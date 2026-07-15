const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const projectRoot = path.resolve(__dirname, "..");
const hook = path.join(projectRoot, ".githooks", "pre-push");

try {
  fs.chmodSync(hook, 0o755);
} catch (error) {
  console.error(`Unable to make ${hook} executable: ${error.message}`);
  process.exit(1);
}

const result = spawnSync("git", ["config", "core.hooksPath", ".githooks"], {
  cwd: projectRoot,
  stdio: "inherit"
});

if (result.error) {
  console.error(`Unable to configure Git hooks: ${result.error.message}`);
  process.exit(1);
}
if (result.status !== 0) process.exit(result.status || 1);

console.log("Git pre-push tests are enabled for this repository.");
