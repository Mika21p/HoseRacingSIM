const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");
const vm = require("node:vm");
const { JSDOM } = require("jsdom");

const { projectRoot } = require("./helpers/project-loader");

function runBrowserFile(context, relativePath) {
  const file = path.join(projectRoot, relativePath);
  vm.runInContext(fs.readFileSync(file, "utf8"), context, { filename: relativePath });
}

test("实验页可选择赛程、预览修正、运行比赛并只保存独立实验记录", () => {
  const dom = new JSDOM('<!doctype html><html><body class="tal-body"><div id="trackAptitudeLab"></div></body></html>', {
    runScripts: "outside-only",
    url: "https://track-aptitude-lab.test/"
  });
  const context = dom.getInternalVMContext();
  [
    "js/utils/random.js",
    "js/rules/time.js",
    "js/rules/maturity.js",
    "js/rules/temperament.js",
    "js/rules/horse-generator.js",
    "js/rules/race-simulator.js",
    "js/rules/track-aptitude.js",
    "js/data/course-profiles.js",
    "js/track-aptitude-lab.js"
  ].forEach((file) => runBrowserFile(context, file));
  dom.window.document.dispatchEvent(new dom.window.Event("DOMContentLoaded"));

  const root = dom.window.document.getElementById("trackAptitudeLab");
  const profileSelect = root.querySelector('select[name="profileId"]');
  assert.ok(profileSelect);
  assert.match(root.textContent, /开发中，数值未定/);
  assert.equal(dom.window.localStorage.getItem("keiba-career-save"), null);

  profileSelect.value = "lab-mistfield-turf-2000-inner";
  profileSelect.dispatchEvent(new dom.window.Event("change", { bubbles: true }));
  assert.match(root.textContent, /瞬发Ⅱ／◎/);
  assert.match(root.textContent, /本场能力\s*84/);

  root.querySelector('[data-action="run"]').click();
  assert.match(root.textContent, /实验结果/);
  assert.match(root.textContent, /入场能力 84/);
  assert.ok(dom.window.localStorage.getItem("keiba-track-aptitude-lab-v1"));
  assert.equal(dom.window.localStorage.getItem("keiba-career-save"), null);
});
