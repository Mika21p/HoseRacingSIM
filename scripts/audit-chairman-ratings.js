const fs = require('node:fs');
const project = require('../tests/helpers/project-loader').loadChairmanRules();
const { rules } = project;
// Optional immutable baseline revision; execute exactly the old rules in the same harness.
const baseline = process.argv.find(arg => arg.startsWith('--baseline='))?.split('=')[1];
if (baseline) {
  const vm=require('node:vm'), {execFileSync}=require('node:child_process');
  for(const file of ['js/rules/race-simulator.js','js/rules/chairman.js'])
    vm.runInContext(execFileSync('git',['show',`${baseline}:${file}`],{encoding:'utf8'}),project.context,{filename:`baseline/${file}`});
}
const W = rules.ChairmanRules;
const reports = [];
for (const seed of [5701, 778, 2026, 995173, 18349]) {
  let w = W.createWorld({ seed, id: `rating-audit-${seed}` });
  const report = { seed, years: [], illegalGaps: 0, overflow: 0, idle: 0, eligibleTurns: 0, changes: 0 };
  const last = new Map();
  for (let y = 1; y <= 10; y++) {
    const stats = { year: y, g1: 0, cancelled: 0, entries: 0, young: 0, youngCancelled: 0, tf: [], onlyOpLeaders: 0 };
    const starts = new Map();
    while (w.phase !== 'yearEnd') {
      for (const h of w.horses) if (h.status === 'active' && h.restUntil <= w.turn) {
        report.eligibleTurns++; if (!h.booked && w.turn - (h.lastRaceTurn ?? 0) >= 6) report.idle++;
      }
      const before = new Map(w.horses.map(h => [h.id, h.booked]));
      const out = W.advanceHalfMonth(w); w = out.world;
      for (const h of w.horses) { const b = before.get(h.id); if (b && b.turn >= w.turn && h.booked && (b.raceId !== h.booked.raceId || b.turn !== h.booked.turn)) report.changes++; }
      for (const r of out.occurrences) {
        if (r.count > r.race.capacity) report.overflow++;
        if (r.raceClass !== 'g1') continue;
        stats.g1++; stats.entries += r.count; if (r.status === 'cancelled') stats.cancelled++;
        if (['2', '3'].includes(r.race.ageRule)) { stats.young++; if (r.status === 'cancelled') stats.youngCancelled++; }
      }
      for (const p of out.performances) {
        if (last.has(p.horseId) && p.turn - last.get(p.horseId) < 3) report.illegalGaps++;
        last.set(p.horseId, p.turn);
        const s = starts.get(p.horseId) || { graded: 0 }; if (p.raceClass !== 'op') s.graded++; starts.set(p.horseId, s);
        if (p.tf != null) stats.tf.push(p.tf);
      }
    }
    const leaders = w.horses.filter(h => h.annual.tf != null).sort((a,b) => b.annual.tf-a.annual.tf).slice(0, 30);
    stats.onlyOpLeaders = leaders.filter(h => !starts.get(h.id)?.graded).length;
    stats.tf.sort((a,b)=>a-b); const values = stats.tf;
    stats.tf = { min: values[0], median: values[Math.floor(values.length/2)], p90: values[Math.floor(values.length*.9)], max: values.at(-1) };
    report.years.push(stats); w = W.finishYear(w).world;
  }
  reports.push(report); console.log(JSON.stringify(report));
}
if (process.argv[2]) fs.writeFileSync(process.argv[2], JSON.stringify(reports, null, 2));
