#!/usr/bin/env node
// 剧情模式年鉴：从 JBIS 抓取某一年 JRA 分级赛及配置中核实过的特殊重赏的结果页，原样缓存。
// 只读访问，带请求间隔；已缓存的页面不重复请求。
//
// 用法：node scripts/era-almanac-fetch.js --year 1998 [--cache <目录>] [--delay 1500] [--source-cache <只读旧缓存目录>]

const fs = require("node:fs");
const path = require("node:path");

const config = require("./era-almanac-config");
const BASE = "https://www.jbis.or.jp";
const JRA_COURSE_CODES = new Set(["101", "102", "103", "104", "105", "106", "107", "108", "109", "110"]);
const GRADE_PATTERN = /G[ⅠⅡⅢ]/;

function parseArgs(argv) {
  const args = { year: null, cache: path.resolve(".cache", "era-almanac"), delay: 1500 };
  for (let index = 2; index < argv.length; index += 1) {
    const key = argv[index];
    const value = argv[index + 1];
    if (key === "--year") { args.year = Number(value); index += 1; }
    else if (key === "--cache") { args.cache = path.resolve(value); index += 1; }
    else if (key === "--source-cache") { args.sourceCache = path.resolve(value); index += 1; }
    else if (key === "--delay") { args.delay = Number(value); index += 1; }
  }
  if (!Number.isInteger(args.year)) throw new Error("请用 --year 指定年份，例如 --year 1998");
  return args;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function cacheFile(cacheDir, urlPath) {
  const name = urlPath.replace(/^\/+|\/+$/g, "").replace(/\//g, "_") || "index";
  return path.join(cacheDir, "raw", `${name}.html`);
}

async function fetchPage(args, urlPath, stats) {
  const file = cacheFile(args.cache, urlPath);
  if (fs.existsSync(file)) {
    stats.cached += 1;
    return fs.readFileSync(file, "utf8");
  }
  if (args.sourceCache && fs.existsSync(cacheFile(args.sourceCache, urlPath))) {
    stats.cached += 1;
    return fs.readFileSync(cacheFile(args.sourceCache, urlPath), "utf8");
  }
  // The site drops connections occasionally: retry three times with a growing pause
  // so a single hiccup does not abort a whole year's fetch.
  let lastError = null;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    await sleep(args.delay * attempt);
    try {
      const response = await fetch(`${BASE}${urlPath}`, { headers: { "User-Agent": "Mozilla/5.0 (keiba-era-almanac; low-rate research fetch)" } });
      stats.requested += 1;
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${urlPath}`);
      const html = await response.text();
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, html);
      return html;
    } catch (error) {
      lastError = error;
      console.log(`retry ${attempt}/3 ${urlPath}: ${error.message || error}`);
    }
  }
  throw new Error(`fetch failed ${urlPath}: ${lastError?.message || lastError}`);
}

function gradedCourseDays(html, year, month) {
  const prefix = `/race/calendar/${year}${String(month).padStart(2, "0")}`;
  const found = new Set();
  for (const match of html.matchAll(/href="(\/race\/calendar\/(\d{8})\/(\d{3})\/)"[^>]*>([\s\S]{0,120}?)<\/a>/g)) {
    const [, href, , course, label] = match;
    if (!href.startsWith(prefix) || !JRA_COURSE_CODES.has(course)) continue;
    if (GRADE_PATTERN.test(label.replace(/<[^>]+>/g, ""))) found.add(href);
  }
  return [...found].sort();
}

function gradedRaces(html) {
  const races = [];
  for (const match of html.matchAll(/<a href="(\/race\/result\/(\d{8})\/(\d{3})\/(\d{2})\/)"[^>]*>([^<]*)<\/a>\s*<span class="tag-race-(G[123])">/g)) {
    const [, href, date, course, raceNo, name, grade] = match;
    races.push({ href, date, course, raceNo: Number(raceNo), name: name.trim(), grade });
  }
  return races;
}

async function main() {
  const args = parseArgs(process.argv);
  const stats = { requested: 0, cached: 0 };
  const manifest = [];
  for (let month = 1; month <= 12; month += 1) {
    const calendarPath = `/race/calendar/${args.year}${String(month).padStart(2, "0")}/`;
    const calendar = await fetchPage(args, calendarPath, stats);
    for (const dayPath of gradedCourseDays(calendar, args.year, month)) {
      const day = await fetchPage(args, dayPath, stats);
      for (const race of gradedRaces(day)) {
        await fetchPage(args, race.href, stats);
        manifest.push({ ...race, source: `${BASE}${race.href}` });
      }
    }
    console.log(`${args.year}-${String(month).padStart(2, "0")}: 累计 ${manifest.length} 场重赏（请求 ${stats.requested}，缓存 ${stats.cached}）`);
  }
  for (const extra of (config.years[args.year] || {}).additionalRaces || []) {
    if (manifest.some((race) => race.href === extra.href)) continue;
    await fetchPage(args, extra.href, stats);
    manifest.push({ ...extra, source: `${BASE}${extra.href}` });
  }
  manifest.sort((left, right) => left.date.localeCompare(right.date) || left.course.localeCompare(right.course) || left.raceNo - right.raceNo);
  const manifestFile = path.join(args.cache, `manifest-${args.year}.json`);
  fs.mkdirSync(args.cache, { recursive: true });
  fs.writeFileSync(manifestFile, `${JSON.stringify({ year: args.year, fetchedAt: new Date().toISOString(), races: manifest }, null, 2)}\n`);
  console.log(`完成：${manifest.length} 场，清单写入 ${manifestFile}`);
}

if (require.main === module) main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});

module.exports = { gradedCourseDays, gradedRaces };
