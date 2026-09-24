const path = require('node:path');

function supplementalErrors(project) {
  const errors = [];
  const jockeys = new Map(project.jockeys.map(j => [j.id, j]));
  for (const j of project.jockeys) {
    const periods = [...(j.periods || [])].sort((a, b) => a.from - b.from);
    periods.forEach((p, i) => {
      if (!Number.isInteger(p.from) || !Number.isInteger(p.to) || p.from > p.to || !Number.isFinite(p.ability)) {
        errors.push(`INVALID_PERIOD ${j.id} ${i}`);
      }
      if (i && periods[i - 1].to >= p.from) errors.push(`OVERLAPPING_PERIOD ${j.id} ${i}`);
    });
  }
  for (const h of project.horses) {
    const base = h.profile?.baseAbility, peak = h.profile?.peakAbility;
    if (!Number.isInteger(base) || !Number.isInteger(peak) || base > peak) errors.push(`INVALID_RANGE ${h.id}`);
    const seen = new Set();
    for (const r of h.races || []) {
      const key = `${r.raceId}:${r.year}`;
      if (seen.has(key)) errors.push(`DUPLICATE_WIN ${h.id} ${key}`);
      seen.add(key);
      if (!Number.isInteger(r.ability) || r.ability < base || r.ability > peak) errors.push(`OUT_OF_RANGE ${h.id} ${key} ${r.ability} [${base},${peak}]`);
      const j = jockeys.get(r.jockeyId);
      if (!j || !(j.periods || []).some(p => p.from <= r.year && r.year <= p.to)) errors.push(`UNAVAILABLE_JOCKEY ${h.id} ${key} ${r.jockeyId}`);
    }
    for (const r of h.legendEligibilityWins || []) {
      const j = jockeys.get(r.jockeyId);
      if (!j || !(j.periods || []).some(p => p.from <= r.year && r.year <= p.to)) errors.push(`UNAVAILABLE_LEGEND_JOCKEY ${h.id} ${r.raceName}:${r.year} ${r.jockeyId}`);
    }
  }
  return errors;
}

if (require.main === module) {
  const root = path.resolve(process.argv[2] || process.cwd());
  const { loadProjectData } = require(path.join(root, 'tests/helpers/project-loader.js'));
  const { validateProjectData } = require(path.join(root, 'tests/helpers/validate-data.js'));
  const project = loadProjectData();
  const errors = [...validateProjectData(project), ...supplementalErrors(project)];
  console.log(JSON.stringify({ horses: project.horses.length, jockeys: project.jockeys.length, races: project.races.length, raceEntries: project.horses.reduce((n, h) => n + (h.races || []).length, 0), errors }, null, 2));
  if (errors.length) process.exitCode = 1;
}

module.exports = { supplementalErrors };
