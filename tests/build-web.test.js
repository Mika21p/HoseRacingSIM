const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const { buildWeb } = require("../scripts/build-web");
const { projectRoot } = require("./helpers/project-loader");

function createBrowserContext(consoleOverride = console) {
  return vm.createContext({
    window: { Keiba: {} },
    console: consoleOverride
  });
}

function runFile(context, file) {
  vm.runInContext(fs.readFileSync(file, "utf8"), context, {
    filename: path.relative(projectRoot, file).replaceAll("\\", "/")
  });
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

test("production build preserves historical-horse data and loads one bundle", async (t) => {
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), "keiba-web-build-"));
  t.after(() => fs.rmSync(temporaryRoot, { recursive: true, force: true }));
  const result = buildWeb({ outputRoot: path.join(temporaryRoot, "dist") });

  assert.equal(result.files.length, 471);
  assert.equal(new Set(result.files).size, result.files.length);
  assert.match(result.bundlePath, /^assets\/historical-horses\.[a-f0-9]{12}\.js$/);

  const sourceContext = createBrowserContext();
  runFile(sourceContext, path.join(projectRoot, "js", "data", "historical-horses", "registry.js"));
  result.files.forEach((file) => {
    runFile(sourceContext, path.join(projectRoot, "js", "data", "historical-horses", ...file.split("/")));
  });
  const sourceHorses = sourceContext.window.Keiba.HistoricalHorseRegistry.all();

  const bundleContext = createBrowserContext();
  runFile(bundleContext, path.join(projectRoot, "js", "data", "historical-horses", "registry.js"));
  runFile(bundleContext, result.bundleFile);
  const bundledHorses = bundleContext.window.Keiba.HistoricalHorseRegistry.all();

  assert.equal(sourceHorses.length, result.files.length);
  assert.equal(new Set(sourceHorses.map((horse) => horse.id)).size, result.files.length);
  assert.deepEqual(plain(bundledHorses), plain(sourceHorses));

  const requests = [];
  const loaderContext = createBrowserContext();
  loaderContext.document = {
    createElement(tagName) {
      assert.equal(tagName, "script");
      return {};
    },
    head: {
      appendChild(script) {
        requests.push(script.src);
        queueMicrotask(() => {
          runFile(loaderContext, result.bundleFile);
          script.onload();
        });
      }
    }
  };
  runFile(loaderContext, path.join(projectRoot, "js", "data", "historical-horses", "registry.js"));
  runFile(loaderContext, result.loaderFile);
  await loaderContext.window.Keiba.HistoricalHorsesReady;

  assert.deepEqual(requests, [result.bundlePath]);
  assert.deepEqual(
    plain(loaderContext.window.Keiba.HistoricalHorseLoadReport),
    {
      total: result.files.length,
      loaded: result.files.length,
      failed: 0,
      failedFiles: []
    }
  );
  assert.deepEqual(plain(loaderContext.window.Keiba.HistoricalHorses), plain(sourceHorses));

  const productionIndex = fs.readFileSync(path.join(result.outputRoot, "index.html"), "utf8");
  // Image paths must work from a standalone production build, not just the source tree.
  for (const asset of fs.readdirSync(path.join(projectRoot, "assets", "home"))) {
    const relative = path.join("assets", "home", asset);
    assert.deepEqual(fs.readFileSync(path.join(result.outputRoot, relative)), fs.readFileSync(path.join(projectRoot, relative)));
  }
  assert.ok(fs.existsSync(path.join(result.outputRoot, "css", "home.css")));
  assert.ok(fs.existsSync(path.join(result.outputRoot, "track-aptitude-lab.html")));
  assert.ok(fs.existsSync(path.join(result.outputRoot, "css", "track-aptitude-lab.css")));
  assert.ok(fs.existsSync(path.join(result.outputRoot, "js", "track-aptitude-lab.js")));
  assert.ok(fs.existsSync(path.join(result.outputRoot, "js", "data", "jra-course-catalogue.js")));
  assert.ok(fs.existsSync(path.join(result.outputRoot, "js", "data", "race-course-profiles.js")));
  assert.match(productionIndex, /js\/data\/jra-course-catalogue\.js\?v=20260922-phase2/);
  assert.match(productionIndex, /js\/data\/race-course-profiles\.js\?v=20260922-phase2/);
  assert.match(
    productionIndex,
    new RegExp(`js/data/historical-horses/index\\.js\\?v=${result.hash}`)
  );
});

test("production loader reports every horse when the bundle fails", async (t) => {
  const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), "keiba-web-failure-"));
  t.after(() => fs.rmSync(temporaryRoot, { recursive: true, force: true }));
  const result = buildWeb({ outputRoot: path.join(temporaryRoot, "dist") });
  const errors = [];
  const failureContext = createBrowserContext({
    ...console,
    error(...items) {
      errors.push(items);
    }
  });
  let requestCount = 0;
  failureContext.document = {
    createElement() {
      return {};
    },
    head: {
      appendChild(script) {
        requestCount += 1;
        queueMicrotask(() => script.onerror());
      }
    }
  };

  runFile(failureContext, path.join(projectRoot, "js", "data", "historical-horses", "registry.js"));
  runFile(failureContext, result.loaderFile);
  await failureContext.window.Keiba.HistoricalHorsesReady;

  assert.equal(requestCount, 1);
  assert.deepEqual(
    plain(failureContext.window.Keiba.HistoricalHorseLoadReport),
    {
      total: result.files.length,
      loaded: 0,
      failed: result.files.length,
      failedFiles: result.files
    }
  );
  assert.deepEqual(plain(failureContext.window.Keiba.HistoricalHorses), []);
  assert.equal(errors.length, 1);
});
