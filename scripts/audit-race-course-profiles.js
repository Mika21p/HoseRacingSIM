"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { projectRoot, loadChairmanRules } = require("../tests/helpers/project-loader");

const write = process.argv.includes("--write");
const quiet = process.argv.includes("--quiet");
// 主席世界的场地资料已经逐项记录实际举办地。审计读取它们，但只做解析，
// 不创建世界、不改写比赛库，也不让尚无路线的海外比赛假装已分类。
const project = loadChairmanRules();
const report = project.context.window.Keiba.RaceCourseProfiles.audit(project.races);
const output = `${JSON.stringify(report, null, 2)}\n`;

if (write) {
  const target = path.join(projectRoot, "artifacts", "track-aptitude-course-coverage.json");
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, output, "utf8");
  process.stderr.write(`已写入 ${path.relative(projectRoot, target)}\n`);
}

if (!quiet) process.stdout.write(output);
