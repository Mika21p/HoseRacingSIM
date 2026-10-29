#!/usr/bin/env node
// 剧情模式年鉴：解析 era-almanac-fetch.js 缓存的 JBIS 结果页，按两档收录规则生成年鉴数据。
//   - G1 与主要前哨赛：前 5 名
//   - 其他重赏：只收冠军（另可在配置里补录重要出走马）
// 同时输出完整解析结果（证据，不进仓库）和自检、挂接报告。
//
// 用法：node scripts/era-almanac-build.js --year 1998 --cache <目录> [--out js/data/era/almanac] [--source-cache <只读旧缓存目录>]

const fs = require("node:fs");
const path = require("node:path");
const { JSDOM } = require("jsdom");
const { loadEraRules } = require("../tests/helpers/project-loader");
const config = require("./era-almanac-config");

const COURSE_NAMES = {
  101: "札幌", 102: "函馆", 103: "福岛", 104: "新潟", 105: "东京",
  106: "中山", 107: "中京", 108: "京都", 109: "阪神", 110: "小仓"
};
const SURFACES = { 芝: "草地", ダ: "泥地", 障: "障碍" };
const MARGIN_LENGTHS = {
  同着: 0, ハナ: 0.05, アタマ: 0.1, クビ: 0.2, 大差: 10, タイサ: 10
};
// 着差栏里出现的状态标记：不是着差，记入 status。
const STATUS_MARKS = new Set(["降着", "失格", "中止", "取消", "除外"]);
// JBIS 简称 → 全称（按出现顺序替换词尾）。
const ABBREVIATIONS = [
  [/ChS$/, "チャンピオンシップ"], [/ChT$/, "チャレンジトロフィー"], [/ChC$/, "チャレンジカップ"],
  [/S$/, "ステークス"], [/C$/, "カップ"], [/H$/, "ハンデキャップ"]
];

function parseArgs(argv) {
  const args = { year: null, cache: path.resolve(".cache", "era-almanac"), out: path.resolve("js", "data", "era", "almanac") };
  for (let index = 2; index < argv.length; index += 1) {
    const key = argv[index];
    const value = argv[index + 1];
    if (key === "--year") { args.year = Number(value); index += 1; }
    else if (key === "--cache") { args.cache = path.resolve(value); index += 1; }
    else if (key === "--source-cache") { args.sourceCache = path.resolve(value); index += 1; }
    else if (key === "--out") { args.out = path.resolve(value); index += 1; }
    else if (key === "--audit-names") { args.auditNames = true; }
  }
  if (!Number.isInteger(args.year)) throw new Error("请用 --year 指定年份");
  return args;
}

function text(node) {
  return node ? node.textContent.replace(/\s+/g, " ").trim() : "";
}

function splitTime(value) {
  const raw = String(value || "").trim();
  return { record: raw.startsWith("R"), time: raw.replace(/^R/, "") };
}

function timeSeconds(value) {
  const match = splitTime(value).time.match(/^(?:(\d+):)?(\d+)\.(\d)$/);
  if (!match) return null;
  return Number(match[1] || 0) * 60 + Number(match[2]) + Number(match[3]) / 10;
}

function marginLengths(value) {
  const raw = String(value || "").trim();
  if (!raw || raw === "---") return null;
  if (Object.prototype.hasOwnProperty.call(MARGIN_LENGTHS, raw)) return MARGIN_LENGTHS[raw];
  const normalized = raw.replace(/[０-９]/g, (digit) => String("０１２３４５６７８９".indexOf(digit)));
  const match = normalized.match(/^(?:(\d+)\s*)?(?:(\d)\/(\d))?$/);
  if (!match || (!match[1] && !match[2])) return null;
  return Number(match[1] || 0) + (match[2] ? Number(match[2]) / Number(match[3]) : 0);
}

function horseIdFromHref(href) {
  const match = String(href || "").match(/\/horse\/(\d+)\//);
  return match ? match[1] : "";
}

function countStarters(runners) {
  const issues = [];
  let count = 0;
  for (const runner of runners) {
    const finish = String(runner.finishRaw || "").trim();
    const margin = String(runner.marginRaw || "").trim();
    const marks = [finish, margin].filter((value) => STATUS_MARKS.has(value));
    const absent = marks.some((value) => ["取消", "除外"].includes(value));
    const started = marks.some((value) => ["中止", "失格", "降着"].includes(value));
    const ranked = /^[1-9]\d*$/.test(finish);
    const validMargin = !margin || /^[-*]+$/.test(margin) || STATUS_MARKS.has(margin) || marginLengths(margin) != null;
    if (!runner.name || !runner.jbisHorseId || !validMargin || (absent && (started || ranked)) || (!absent && !started && !ranked)) {
      issues.push({ number: runner.number, name: runner.name, finishRaw: finish, marginRaw: margin });
    } else if (!absent) count += 1;
  }
  if (!runners.length || !count) issues.push({ reason: "没有可确认的起跑马" });
  return { starterCount: issues.length ? null : count, starterCountIssues: issues };
}

function parseResultPage(html, manifestEntry) {
  const { document } = new JSDOM(html).window;
  const heading = document.querySelector(".hdg2-l-1 h2");
  const gradeLabel = text(heading && heading.querySelector("[class*=tag-race-]"));
  const actualGrade = ({ "GⅠ": "G1", "GⅡ": "G2", "GⅢ": "G3", "重": "重" })[gradeLabel];
  if (!actualGrade || actualGrade !== manifestEntry.grade) throw new Error(`Grade mismatch: ${manifestEntry.href} ${gradeLabel} / ${manifestEntry.grade}`);
  const nameHeading = heading.cloneNode(true);
  nameHeading.querySelectorAll("[class*=tag-race-]").forEach((tag) => tag.remove());
  const title = text(document.querySelector("title"));
  const kaiMatch = title.match(/(\d+)回\s*(\S+)\s*(\d+)日/);
  const courseLine = text(document.querySelector(".box-race .txt-race"));
  const conditionLine = text(document.querySelector(".box-race__text p:nth-of-type(2)"));
  const surfaceMatch = courseLine.match(/^(芝|ダ|障)\S*?(\d+)M/);
  const weather = (conditionLine.match(/天候：(\S+)/) || [])[1] || "";
  const going = (conditionLine.match(/(?:芝|ダート|ダ)：(\S+)/) || [])[1] || "";
  const rows = [...document.querySelectorAll(".data-6-11 > div")].slice(1);
  const runners = rows.map((row) => {
    const cells = [...row.children];
    const horseLink = cells[3] && cells[3].querySelector("a[href^='/horse/']");
    const parents = cells[3] ? [...cells[3].querySelectorAll(".data-6__small p")] : [];
    const jockeyCell = cells[5];
    const sexAge = text(cells[4]);
    const finishRaw = text(cells[0]);
    const trainerCell = cells[13];
    const ownerCell = cells[14];
    const ownerSpans = ownerCell ? [...ownerCell.querySelectorAll("span > span, a")].map(text).filter(Boolean) : [];
    const bodyWeight = text(cells[12]).match(/^(\d+)/);
    const marginRaw = text(cells[7]);
    const time = splitTime(text(cells[6]));
    return {
      finishRaw,
      marginRaw,
      finish: /^\d+$/.test(finishRaw) ? Number(finishRaw) : null,
      frame: Number(text(cells[1])) || null,
      number: Number(text(cells[2]).replace("番", "")) || null,
      jbisHorseId: horseIdFromHref(horseLink && horseLink.getAttribute("href")),
      name: text(horseLink),
      sire: parents[0] ? text(parents[0]).replace(/^父：\s*/, "") : "",
      dam: parents[1] ? text(parents[1]).replace(/^母：\s*/, "") : "",
      sex: sexAge.replace(/\d+$/, ""),
      ageOriginal: Number((sexAge.match(/(\d+)$/) || [])[1]) || null,
      jockey: text(jockeyCell && jockeyCell.querySelector("a, span:not(.ta-right)")),
      carried: Number(text(jockeyCell && jockeyCell.querySelector(".ta-right"))) || null,
      time: time.time,
      record: time.record,
      timeSeconds: timeSeconds(time.time),
      margin: STATUS_MARKS.has(marginRaw) || /^[-*]+$/.test(marginRaw) ? "" : marginRaw,
      status: STATUS_MARKS.has(marginRaw) ? marginRaw : (finishRaw === "**" ? "取消" : ""),
      popularity: Number(text(cells[11]).replace("人気", "")) || null,
      bodyWeight: bodyWeight ? Number(bodyWeight[1]) : null,
      trainer: text(trainerCell && trainerCell.querySelector("span > span")),
      trainerAffiliation: (text(trainerCell).match(/\((.+)\)/) || [])[1] || "",
      owner: ownerSpans[0] || "",
      breeder: ownerSpans[1] || ""
    };
  });
  return {
    date: `${manifestEntry.date.slice(0, 4)}-${manifestEntry.date.slice(4, 6)}-${manifestEntry.date.slice(6, 8)}`,
    courseCode: manifestEntry.course,
    course: COURSE_NAMES[manifestEntry.course] || manifestEntry.course,
    meeting: kaiMatch ? { kai: Number(kaiMatch[1]), day: Number(kaiMatch[3]) } : null,
    raceNo: manifestEntry.raceNo,
    nameOriginal: text(nameHeading).replace(/^\d+R\s*/, "").trim(),
    grade: actualGrade,
    surface: surfaceMatch ? SURFACES[surfaceMatch[1]] : "",
    distance: surfaceMatch ? Number(surfaceMatch[2]) : null,
    condition: conditionLine.replace(/天候：.*$/, "").trim(),
    weather,
    going,
    headcount: runners.length,
    ...countStarters(runners),
    source: manifestEntry.source,
    runners
  };
}

function selfCheck(race) {
  const problems = [];
  const finishers = race.runners.filter((runner) => Number.isFinite(runner.finish));
  if (!race.distance || !race.surface) problems.push("缺少场地或距离");
  if (!finishers.length) problems.push("没有完赛马");
  const sorted = finishers.slice().sort((left, right) => left.finish - right.finish);
  sorted.forEach((runner, index) => {
    if (index === 0 && runner.finish !== 1) problems.push("第一名缺失");
    const sameRank = index > 0 && runner.finish === sorted[index - 1].finish;
    if (runner.finish !== (sameRank ? sorted[index - 1].finish : index + 1)) problems.push(`非法名次跳号：${runner.name}`);
    if ((runner.margin === "同着") !== sameRank) problems.push(`同着标记与名次不一致：${runner.name}`);
    // 降着马的名次排在走时更慢的马之后，属于史实，不算倒挂。
    const previous = sorted.slice(0, index).filter((item) => item.status !== "降着").pop();
    if (runner.status !== "降着" && previous && runner.timeSeconds != null && previous.timeSeconds != null
      && runner.timeSeconds < previous.timeSeconds) problems.push(`走时倒挂：${runner.name}`);
    if (runner.margin && marginLengths(runner.margin) == null) problems.push(`无法识别的着差：${runner.name} ${runner.margin}`);
    if (!runner.name || !runner.jbisHorseId) problems.push(`缺少马名或 ID：${runner.finish}着`);
    if (runner.timeSeconds == null) problems.push(`缺少走时：${runner.name}`);
  });
  return problems;
}

// JBIS 对较早登记的马沿用旧写法（拗音、促音写成大写假名，如「トウシヨウボーイ」），匹配时统一折叠成大写。
const SMALL_KANA = { ァ: "ア", ィ: "イ", ゥ: "ウ", ェ: "エ", ォ: "オ", ャ: "ヤ", ュ: "ユ", ョ: "ヨ", ッ: "ツ", ヮ: "ワ" };

function normalizeName(value) {
  return String(value || "")
    .replace(/[\s　]/g, "")
    .replace(/\((?:USA|GB|IRE|FR|CAN|AUS|NZ|GER|ITY|ARG|BRZ|JPN)\)$/i, "")
    .replace(/[ァィゥェォャュョッヮ]/g, (kana) => SMALL_KANA[kana]);
}

function buildIndexes(ns) {
  const horsesByName = new Map();
  (ns.HistoricalHorses || []).forEach((horse) => horsesByName.set(normalizeName(horse.name), horse));
  Object.entries(config.horseAliases || {}).forEach(([name, horseId]) => {
    const horse = (ns.HistoricalHorses || []).find((item) => item.id === horseId);
    if (!horse) throw new Error(`horseAliases 指向不存在的全局史实马：${horseId}`);
    horsesByName.set(normalizeName(name), horse);
  });
  const jockeysByName = new Map();
  (ns.Jockeys || []).forEach((jockey) => jockeysByName.set(normalizeName(jockey.name), jockey));
  const racesByOriginal = new Map();
  (ns.Races || []).filter((race) => race.surfaceRegion === "日本").forEach((race) => {
    if (race.nameOriginal) racesByOriginal.set(normalizeName(race.nameOriginal), race);
  });
  return { horsesByName, jockeysByName, racesByOriginal };
}

// 依次尝试：配置别名 → 原名 → 展开简称 → 2001 年前的虚岁赛名（３歳→2歳）。
function globalRaceFor(indexes, yearConfig, race) {
  const alias = (yearConfig.raceAliases || {})[race.nameOriginal];
  if (alias === null) return null;
  // sameName：当年名称与全局现名只差简称或括号写法时，才沿用全局中文名；改过名的赛事中文名留待审核。
  const candidates = [];
  if (alias && typeof alias === "object") candidates.push({ name: alias.to, sameName: !!alias.sameName });
  else if (alias) candidates.push({ name: alias, sameName: false });
  const base = race.nameOriginal.replace(/\(/g, "（").replace(/\)/g, "）");
  candidates.push({ name: base, sameName: true });
  let expanded = base;
  ABBREVIATIONS.forEach(([pattern, replacement]) => { expanded = expanded.replace(pattern, replacement); });
  candidates.push({ name: expanded, sameName: true });
  candidates.push({ name: expanded.replace(/３歳/g, "2歳"), sameName: false });
  for (const candidate of candidates) {
    const found = indexes.racesByOriginal.get(normalizeName(candidate.name));
    if (found) return { race: found, sameName: candidate.sameName };
  }
  return null;
}

function tierFor(year, race) {
  const yearConfig = config.years[year] || {};
  if (race.grade === "G1") return "top5";
  return (yearConfig.keyTrials || []).includes(race.nameOriginal) ? "top5" : "winner";
}

function raceSlug(year, race, globalRace) {
  if (globalRace) return `${year}-${globalRace.id}`;
  return `${year}-jbis-${race.date.replace(/-/g, "")}-${race.courseCode}-${String(race.raceNo).padStart(2, "0")}`;
}

function horseSlug(horse, globalHorse) {
  return globalHorse ? globalHorse.id : `jbis-${horse.jbisHorseId}`;
}

function jsLiteral(value) {
  return JSON.stringify(value, null, 2);
}

function main() {
  const args = parseArgs(process.argv);
  const manifest = JSON.parse(fs.readFileSync(path.join(args.cache, `manifest-${args.year}.json`), "utf8"));
  const ns = loadEraRules().rules;
  const indexes = buildIndexes(ns);
  const parsed = [];
  const checkProblems = [];
  manifest.races.forEach((entry) => {
    let file = path.join(args.cache, "raw", `${entry.href.replace(/^\/+|\/+$/g, "").replace(/\//g, "_")}.html`);
    if (!fs.existsSync(file) && args.sourceCache) file = path.join(args.sourceCache, "raw", path.basename(file));
    const race = parseResultPage(fs.readFileSync(file, "utf8"), entry);
    const problems = selfCheck(race);
    if (problems.length) checkProblems.push({ race: `${race.date} ${race.nameOriginal}`, problems });
    parsed.push(race);
  });

  if (checkProblems.length) throw new Error(`Almanac self-check failed: ${JSON.stringify(checkProblems)}`);
  const yearConfig = config.years[args.year] || {};
  const horses = new Map();
  const missingNames = new Map();
  const unmatched = { races: [], jockeys: new Map(), horses: [] };
  const races = parsed.map((race) => {
    const globalMatch = globalRaceFor(indexes, yearConfig, race);
    const globalRace = globalMatch ? globalMatch.race : null;
    if (!globalRace) unmatched.races.push(`${race.date} ${race.nameOriginal}（${race.grade}）`);
    const tier = tierFor(args.year, race);
    const extras = (yearConfig.extraRunners || {})[race.nameOriginal] || [];
    const kept = race.runners
      .filter((runner) => Number.isFinite(runner.finish))
      .sort((left, right) => left.finish - right.finish)
      .filter((runner) => (tier === "top5" ? runner.finish <= 5 : runner.finish === 1) || extras.includes(runner.name));
    const results = kept.map((runner) => {
      const globalHorse = indexes.horsesByName.get(normalizeName(runner.name));
      const globalJockey = indexes.jockeysByName.get(normalizeName(runner.jockey));
      if (!globalJockey) unmatched.jockeys.set(runner.jockey, (unmatched.jockeys.get(runner.jockey) || 0) + 1);
      const horseId = horseSlug(runner, globalHorse);
      const approvedName = (config.horseNamesByJbisId || {})[runner.jbisHorseId];
      let nameSource = approvedName;
      if (!globalHorse && !approvedName) {
        if (!args.auditNames) {
          throw new Error(`Era almanac horse has no reviewed/default-approved Chinese name: ${runner.jbisHorseId} ${runner.name}`);
        }
        // 审核模式：只登记待命名马，生成数据文件前先交人工审中文名。
        const record = missingNames.get(runner.jbisHorseId) || {
          jbisHorseId: runner.jbisHorseId,
          name: runner.name,
          sex: runner.sex,
          sire: runner.sire,
          dam: runner.dam,
          trainer: runner.trainer,
          trainerAffiliation: runner.trainerAffiliation,
          owner: runner.owner,
          breeder: runner.breeder,
          appearances: 0,
          races: []
        };
        record.appearances += 1;
        const label = `${race.date} ${race.nameOriginal}`;
        if (!record.races.includes(label)) record.races.push(label);
        missingNames.set(runner.jbisHorseId, record);
        nameSource = { nameZh: "", status: "pending" };
      }
      if (globalHorse && approvedName && approvedName.nameZh !== (globalHorse.displayNameZh || globalHorse.displayName)) {
        throw new Error(`Era almanac name conflicts with global confirmed name: ${runner.jbisHorseId}`);
      }
      if (!horses.has(horseId)) {
        horses.set(horseId, {
          id: horseId,
          jbisHorseId: runner.jbisHorseId,
          name: runner.name,
          nameZh: globalHorse ? (globalHorse.displayNameZh || globalHorse.displayName) : nameSource.nameZh,
          nameZhStatus: globalHorse ? "global" : nameSource.status,
          historicalHorseId: globalHorse ? globalHorse.id : "",
          sex: runner.sex,
          birthYear: runner.ageOriginal ? args.year - (runner.ageOriginal - 1) : null,
          sire: runner.sire,
          dam: runner.dam,
          trainer: runner.trainer,
          trainerAffiliation: runner.trainerAffiliation,
          owner: runner.owner,
          breeder: runner.breeder
        });
        if (!globalHorse) unmatched.horses.push(runner.name);
      }
      return {
        finish: runner.finish,
        deadHeat: runner.margin === "同着" || kept.some((other) => other !== runner && other.finish === runner.finish) || undefined,
        number: runner.number,
        horseId,
        jockey: runner.jockey,
        jockeyId: globalJockey ? globalJockey.id : "",
        carried: runner.carried,
        time: runner.time,
        record: runner.record || undefined,
        status: runner.status || undefined,
        margin: runner.margin,
        marginLengths: marginLengths(runner.margin),
        popularity: runner.popularity,
        bodyWeight: runner.bodyWeight
      };
    });
    return {
      id: raceSlug(args.year, race, globalRace),
      globalRaceId: globalRace ? globalRace.id : "",
      nameOriginal: race.nameOriginal,
      // global：沿用全局库（用户已确认）；draft：Claude 拟名待审；pending：尚未拟名。
      ...(globalMatch && globalMatch.sameName
        ? { nameZh: globalRace.nameZh, nameZhStatus: "global" }
        : ((yearConfig.raceNamesZhDraft || {})[race.nameOriginal]
          ? { nameZh: yearConfig.raceNamesZhDraft[race.nameOriginal], nameZhStatus: "draft" }
          : { nameZh: "", nameZhStatus: "pending" })),
      grade: race.grade,
      date: race.date,
      course: race.course,
      meeting: race.meeting,
      raceNo: race.raceNo,
      surface: race.surface,
      distance: race.distance,
      condition: race.condition,
      weather: race.weather,
      going: race.going,
      headcount: race.headcount,
      starterCount: race.starterCount,
      tier,
      source: race.source,
      results
    };
  });

  const evidenceFile = path.join(args.cache, `parsed-${args.year}.json`);
  fs.writeFileSync(evidenceFile, `${jsLiteral({ year: args.year, races: parsed })}\n`);

  if (args.auditNames) {
    // 审核模式只产出待命名马清单，不落地数据文件。
    const list = [...missingNames.values()].sort((left, right) => right.appearances - left.appearances);
    const auditFile = path.join(args.cache, `names-${args.year}.json`);
    fs.writeFileSync(auditFile, `${jsLiteral({ year: args.year, count: list.length, horses: list })}\n`);
    console.log(jsLiteral({ year: args.year, missingNames: list.length, file: auditFile }));
    list.forEach((item) => console.log(`${item.jbisHorseId} ${item.name} ×${item.appearances} ${item.races.slice(0, 3).join(" / ")}`));
    return;
  }

  fs.mkdirSync(path.join(args.out, "races"), { recursive: true });
  fs.mkdirSync(path.join(args.out, "horses"), { recursive: true });
  const header = "// 由 scripts/era-almanac-build.js 生成；来源见每条 source。人工修订请同步改生成配置或在审核清单中记录。\n";
  fs.writeFileSync(path.join(args.out, "races", `${args.year}.js`), `${header}(function () {
  const ns = (window.Keiba = window.Keiba || {});
  ns.EraAlmanac.registerRaces(${args.year}, ${jsLiteral(races).replace(/\n/g, "\n  ")});
})();
`);
  fs.writeFileSync(path.join(args.out, "horses", `${args.year}.js`), `${header}(function () {
  const ns = (window.Keiba = window.Keiba || {});
  ns.EraAlmanac.registerHorses(${jsLiteral([...horses.values()]).replace(/\n/g, "\n  ")});
})();
`);

  const report = {
    year: args.year,
    races: races.length,
    byTier: { top5: races.filter((race) => race.tier === "top5").length, winner: races.filter((race) => race.tier === "winner").length },
    byGrade: ["G1", "G2", "G3", "重"].map((grade) => `${grade} ${races.filter((race) => race.grade === grade).length}`).join(" / "),
    resultEntries: races.reduce((sum, race) => sum + race.results.length, 0),
    horses: horses.size,
    horsesLinkedToGlobal: [...horses.values()].filter((horse) => horse.historicalHorseId).length,
    keyTrialsConfigured: (yearConfig.keyTrials || []).length,
    keyTrialsMissing: (yearConfig.keyTrials || []).filter((name) => !races.some((race) => race.nameOriginal === name)),
    selfCheckProblems: checkProblems,
    starterCountUnknown: parsed.filter((race) => race.starterCount == null).map((race) => ({ date: race.date, name: race.nameOriginal, source: race.source, issues: race.starterCountIssues })),
    starterCountDifferences: races.filter((race) => race.starterCount != null && race.starterCount !== race.headcount).map((race) => ({ id: race.id, headcount: race.headcount, starterCount: race.starterCount })),
    unmatchedRaces: unmatched.races,
    unmatchedJockeys: [...unmatched.jockeys].sort((left, right) => right[1] - left[1]).map(([name, count]) => `${name}×${count}`),
    horsesWithoutGlobalEntry: unmatched.horses.length
  };
  fs.writeFileSync(path.join(args.cache, `report-${args.year}.json`), `${jsLiteral(report)}\n`);
  console.log(jsLiteral(report));
}

if (require.main === module) main();

module.exports = { parseResultPage, selfCheck, countStarters };
