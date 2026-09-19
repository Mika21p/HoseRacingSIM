const fs = require("node:fs"), path = require("node:path");
const { loadChairmanRules, projectRoot } = require("../tests/helpers/project-loader");
const { rules } = loadChairmanRules(), W = rules.ChairmanRules;
const seed = 995173, years = 5, regions = {}, grades = {}, gaps = [], last = new Map();
let world = W.createWorld({ seed, id: "chairman-observation" }), starts = 0, retiredRuns = 0, pressured = 0, g1Starts = 0, availableHorseTurns = 0, idleHorseTurns = 0;
const began = performance.now();
for (let y = 1; y <= years; y++) {
  while (world.phase !== "yearEnd") {
    for (const h of world.horses) if (h.status === "active" && h.restUntil <= world.turn) {
      availableHorseTurns++; if (!h.booked && world.turn - (h.lastRaceTurn ?? 0) >= 6) idleHorseTurns++;
    }
    const out = W.advanceHalfMonth(world); world = out.world;
    for (const r of out.occurrences) {
      const stats = regions[r.race.surfaceRegion] || (regions[r.race.surfaceRegion] = { total: 0, cancelled: 0, full: 0 });
      stats.total++; if (r.status === "cancelled") stats.cancelled++; if (r.count >= r.race.capacity) stats.full++;
      const g = grades[r.raceClass] || (grades[r.raceClass] = { total: 0, full: 0, scores: [] }); g.total++; if (r.count >= r.race.capacity) g.full++;
    }
    for (const p of out.performances) {
      starts++; if (p.retired) retiredRuns++; if (p.pressure > 0) pressured++; if (p.raceClass === "g1") g1Starts++;
      if (last.has(p.horseId)) gaps.push(p.turn - last.get(p.horseId)); last.set(p.horseId, p.turn);
      if (p.tf != null) grades[p.raceClass].scores.push(p.tf);
    }
  }
  world = W.finishYear(world).world;
}
for (const g of Object.values(grades)) {
  const a = g.scores.sort((a, b) => a - b), quantile = (p) => a[Math.floor((a.length - 1) * p)] ?? null;
  g.tf = { count: a.length, min: a[0] ?? null, p10: quantile(.1), median: quantile(.5), p90: quantile(.9), max: a.at(-1) ?? null }; delete g.scores;
}
const report = { seed, years, halfMonths: 120, starts, retiredRuns, g1Starts, pressureEvents: pressured,
  pressureRate: g1Starts ? pressured / g1Starts : 0, minimumGapHalfMonths: Math.min(...gaps), meanGapHalfMonths: gaps.reduce((a, b) => a + b, 0) / gaps.length,
  availableHorseTurns, idleUnbookedAtLeastSixTurns: idleHorseTurns, idleDefinition: "可出赛、无报名且距上次出赛至少6个半月的马匹回合；不是独立马匹人数",
  regions, grades, activeAtEnd: world.horses.filter((h) => h.status === "active").length, elapsedMs: Math.round(performance.now() - began) };
fs.writeFileSync(path.join(projectRoot, "docs/主席模式第二轮模拟观察.json"), JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify(report, null, 2));
