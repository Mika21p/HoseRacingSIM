const { loadCoreRules } = require("../tests/helpers/project-loader");

const { races, rules } = loadCoreRules();
const G1_CLASSES = new Set(["g1", "jpn1"]);

function candidatesFor(race, options) {
  return rules.RaceRules.getLegendFieldCandidates(race, options).length;
}

function audit(optionsForRace) {
  return races.map((race) => ({
    race,
    candidates: candidatesFor(race, optionsForRace ? optionsForRace(race) : undefined)
  }));
}

function groupSummary(failures) {
  const groups = new Map();
  failures.forEach(({ race, candidates }) => {
    const region = race.surfaceRegion || "日本";
    const group = groups.get(region) || { belowG1: 0, g1: 0, min: Infinity };
    if (G1_CLASSES.has(race.raceClass)) group.g1 += 1;
    else group.belowG1 += 1;
    group.min = Math.min(group.min, candidates);
    groups.set(region, group);
  });
  return [...groups.entries()].sort(([left], [right]) => left.localeCompare(right));
}

const current = audit();
const failures = current.filter((item) => item.candidates < 5);
const argentinaBefore = audit((race) => race.surfaceRegion === "阿根廷"
  ? { acceptedRegions: ["阿根廷"] }
  : undefined).filter((item) => item.race.surfaceRegion === "阿根廷");
const argentinaAfter = current.filter((item) => item.race.surfaceRegion === "阿根廷");

if (process.argv.includes("--json")) {
  console.log(JSON.stringify({
    totalRaces: races.length,
    failures: failures.map(({ race, candidates }) => ({
      id: race.id,
      name: race.nameZh || race.name,
      region: race.surfaceRegion || "日本",
      raceClass: race.raceClass,
      surface: race.surface,
      distance: race.distance,
      candidates
    })),
    argentina: argentinaAfter.map((item, index) => ({
      id: item.race.id,
      before: argentinaBefore[index].candidates,
      after: item.candidates
    }))
  }, null, 2));
  process.exit(0);
}

console.log("# 传奇模式严格胜鞍候选池审计");
console.log("");
console.log(`- 比赛总数：${races.length}`);
console.log(`- 无法凑齐5匹：${failures.length}`);
console.log(`- G1以下不足：${failures.filter((item) => !G1_CLASSES.has(item.race.raceClass)).length}`);
console.log(`- G1/JpnI不足：${failures.filter((item) => G1_CLASSES.has(item.race.raceClass)).length}`);
console.log("");
console.log("## 赛区汇总");
console.log("");
console.log("| 赛区 | G1以下不足 | G1/JpnI不足 | 最小候选池 |");
console.log("|---|---:|---:|---:|");
groupSummary(failures).forEach(([region, group]) => {
  console.log(`| ${region} | ${group.belowG1} | ${group.g1} | ${group.min} |`);
});
console.log("");
console.log("## 阿根廷单向认可美国胜鞍");
console.log("");
console.log("| 比赛 | 原阿根廷池 | 加入美国胜鞍后 |");
console.log("|---|---:|---:|");
argentinaAfter.forEach((item, index) => {
  console.log(`| ${item.race.nameZh || item.race.name} | ${argentinaBefore[index].candidates} | ${item.candidates} |`);
});
console.log("");
console.log("## 仍不足5匹的赛事");
console.log("");
console.log("| 赛区 | 等级 | 场地 | 距离 | 比赛 | 候选池 |");
console.log("|---|---|---|---:|---|---:|");
failures.forEach(({ race, candidates }) => {
  console.log(`| ${race.surfaceRegion || "日本"} | ${race.raceClass} | ${race.surface} | ${race.distance} | ${race.nameZh || race.name}（${race.id}） | ${candidates} |`);
});
