const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");
const vm = require("node:vm");

const { listJavaScriptFiles, projectRoot } = require("./helpers/project-loader");

test("all project JavaScript files have valid syntax", () => {
  const files = [
    ...listJavaScriptFiles("js"),
    ...listJavaScriptFiles("scripts")
  ];

  assert.ok(files.length > 0, "expected JavaScript files to check");
  files.forEach((file) => {
    const relativeFile = path.relative(projectRoot, file).replaceAll("\\", "/");
    assert.doesNotThrow(
      () => new vm.Script(fs.readFileSync(file, "utf8"), { filename: relativeFile }),
      `invalid JavaScript syntax in ${relativeFile}`
    );
  });
});
