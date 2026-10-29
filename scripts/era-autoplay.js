const { loadEraRules } = require("../tests/helpers/project-loader");
const args = process.argv.slice(2);
const count = Number(args[0] || 8);
const quiet = args.includes("--quiet");
const ns = loadEraRules().rules;
const targets = ["1998-yayoi-sho", "1998-satsuki-sho", "1998-aoba-sho", "1998-tokyo-yushun", "1998-kobe-shimbun-hai", "1998-kyoto-shimbun-hai", "1998-kikka-sho", "1998-japan-cup", "1998-arima-kinen",
  "1999-nakayama-kimpai", "1999-kyoto-kinen", "1999-hanshin-daishoten", "1999-nikkei-sho", "1999-osaka-hai", "1999-tenno-sho-haru", "1999-takarazuka-kinen", "1999-sapporo-kinen", "1999-sankei-sho-all-comers", "1999-mainichi-okan", "1999-kyoto-daishoten", "1999-tenno-sho-aki", "1999-japan-cup", "1999-arima-kinen"];
const directTargets = ["1998-satsuki-sho", "1998-tokyo-yushun", "1998-kikka-sho", "1998-arima-kinen", "1999-tenno-sho-haru", "1999-takarazuka-kinen", "1999-tenno-sho-aki", "1999-japan-cup", "1999-arima-kinen"];
const settledPerRun = 234;
const report = [];
const storyletHits = {};
const newsKinds = {};
const raceWins = {};
for (const policy of ["direct", "prep", "random", "conservative"]) {
  for (let seed = 1; seed <= count; seed++) {
    const run = ns.EraRules.createRun({ seed, horseName: "验证马" });
    for (let step = 0; step < 1200 && !run.ended; step++) {
      let scene = ns.EraRules.getCurrentScene(run);
      if (!scene) throw new Error(`No scene: ${policy}/${seed}`);
      if (scene.id.startsWith("time:") && !run.scheduledRace) {
        const plans = ns.EraRules.getAvailablePlans(run).filter((p) => targets.includes(p.occurrence.id));
        let selected;
        if (policy === "direct") selected = plans.find((p) => directTargets.includes(p.occurrence.id));
        else if (policy === "conservative") selected = plans.find((p) => !run.lastRaceDate || ns.EraWorld.day(p.occurrence.date) - ns.EraWorld.day(run.lastRaceDate) >= 40);
        else if (policy === "random") selected = plans[(seed + step * 7) % Math.max(1, plans.length)];
        else selected = plans[0];
        if (selected) {
          ns.EraRules.registerRace(run, selected.occurrence.id);
          scene = ns.EraRules.getCurrentScene(run);
        }
      }
      if (!scene || !scene.choices?.length) throw new Error(`No choice: ${policy}/${seed}`);
      ns.EraRules.resolveSceneChoice(run, scene.id, scene.choices[0].id);
      if (step === 1199) throw new Error(`Loop limit: ${policy}/${seed}`);
    }
    if (run.settled.length !== settledPerRun && !run.career.retired) throw new Error("Unsettled year");
    for (const id of run.storylets.resolved) storyletHits[id] = (storyletHits[id] || 0) + 1;
    for (const item of run.news) newsKinds[item.kind] = (newsKinds[item.kind] || 0) + 1;
    for (const entry of Object.entries(run.worldResults)) {
      if (entry[1].kind === "simulated" && entry[1].winnerId === "player") raceWins[entry[0]] = (raceWins[entry[0]] || 0) + 1;
    }
    report.push({ policy, seed, starts: run.summary.starts, wins: run.summary.wins, g1Wins: run.summary.g1Wins, fame: run.summary.fame, ended: run.ended, settled: run.settled.length, tags: run.summary.tags.length, rng: run.rngState });
  }
}
const byPolicy = {};
for (const row of report) {
  const bucket = byPolicy[row.policy] || (byPolicy[row.policy] = { runs: 0, starts: 0, wins: 0, g1Wins: 0, fame: 0, tags: 0 });
  bucket.runs++; bucket.starts += row.starts; bucket.wins += row.wins; bucket.g1Wins += row.g1Wins; bucket.fame += row.fame; bucket.tags += row.tags;
}
for (const bucket of Object.values(byPolicy)) {
  bucket.starts = +(bucket.starts / bucket.runs).toFixed(2);
  bucket.wins = +(bucket.wins / bucket.runs).toFixed(2);
  bucket.g1Wins = +(bucket.g1Wins / bucket.runs).toFixed(2);
  bucket.fame = +(bucket.fame / bucket.runs).toFixed(1);
  bucket.tags = +(bucket.tags / bucket.runs).toFixed(1);
}
const declaredStorylets = (ns.EraStoryletData || []).map((node) => node.id);
const neverTriggered = declaredStorylets.filter((id) => !storyletHits[id]);
const totalRuns = report.length;
console.log(JSON.stringify({
  runs: totalRuns,
  byPolicy,
  storyletTriggerRate: Object.fromEntries(declaredStorylets.map((id) => [id, `${storyletHits[id] || 0}/${totalRuns}`])),
  neverTriggered,
  newsPerRun: Object.fromEntries(Object.entries(newsKinds).map(([kind, count]) => [kind, +(count / totalRuns).toFixed(1)])),
  playerWinsByRace: raceWins
}, null, 2));
if (!quiet) console.log(JSON.stringify(report, null, 2));
