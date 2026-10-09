'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '../..');
const copy = value => JSON.parse(JSON.stringify(value));
const hash = value => crypto.createHash('sha256').update(typeof value === 'string' ? value : JSON.stringify(value)).digest('hex');
const increment = (object, key, value = 1) => { object[key] = (object[key] || 0) + value; };
const bookingKey = (W, booking) => booking ? `${W.date(booking.turn).year}:${booking.raceId}` : null;

function manifest() {
  const walk = directory => fs.readdirSync(path.join(root, directory), { withFileTypes: true })
    .flatMap(entry => entry.isDirectory() ? walk(`${directory}/${entry.name}`) : [`${directory}/${entry.name}`]);
  const files = [...walk('js').filter(file => file.endsWith('.js')),
    'tests/helpers/project-loader.js', 'scripts/lib/chairman-scheduling-audit.js',
    'scripts/lib/chairman-scheduling-fixtures.js', 'scripts/audit-chairman-scheduling.js', 'package-lock.json'].sort();
  const sources = files.map(file => ({ file, sha256: hash(fs.readFileSync(path.join(root, file), 'utf8')) }));
  let revision = null;
  try { revision = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8', windowsHide: true }).trim(); } catch {}
  return { revision, fingerprint: hash(sources), sources };
}

function eligibilityReasons(n, w, h, event) {
  const W = n.ChairmanRules, r = event.race, age = W.ageOf(w, h, event.turn), reasons = [];
  if (!(r.ageRule.endsWith('+') ? age >= Number(r.ageRule.slice(0, -1)) : age === Number(r.ageRule))) reasons.push('age');
  const sex = r.sexRule === 'all' || r.sexRule === 'male-female' && h.gender !== '骟马'
    || r.sexRule === 'male' && h.gender === '牡马' || r.sexRule === 'female' && h.gender === '牝马'
    || r.sexRule === 'gelding' && h.gender === '骟马';
  if (!sex) reasons.push('sex');
  if (!n.ChairmanWorld.eligible(w, h, r)) reasons.push('qualification');
  if (r.deleted) reasons.push('race-settings');
  return reasons.length ? reasons : ['eligibility-other'];
}

// All objects retained here belong to the offline audit, never to a save file.
function createPlanAudit(n, w, { traceLimit = 8, traceHorseIds = [] } = {}) {
  const W = n.ChairmanRules, V = n.ChairmanWorld;
  const horses = new Map(w.horses.map(h => [h.id, h]));
  const summary = { turn: w.turn, active: 0, preserved: 0, eligibleComparisons: 0, candidateComparisons: 0,
    rejected: {}, calendarExclusions: {}, fullOptions: 0, needDrivenSelections: 0, moves: {}, crossDistanceMerges: 0,
    rebookingOpportunities: 0, rebookings: 0, targetBookingMismatch: 0, targetIntervalConflicts: 0, unbooked: 0, examples: [], races: {} };
  const previous = new Map(), candidates = new Map(), allocations = new Map(), traced = new Set(traceHorseIds);
  let events = new Map();
  const example = row => { if (summary.examples.length < traceLimit || traced.has(row.horseId)) summary.examples.push(copy(row)); };
  const reject = (row, reason) => { increment(row.rejected, reason); increment(summary.rejected, reason); };
  const sink = data => {
    if (data.type === 'start') {
      for (const row of data.calendarExcluded || []) for (const reason of row.reasons) increment(summary.calendarExclusions, reason);
      events = new Map(data.events.map(e => [e.key, e]));
      for (const e of events.values()) summary.races[e.key] = { raceId: e.race.id, name: e.race.name, turn: e.turn,
        regionId: e.race.regionId, surface: e.race.surface, distance: e.race.distance, ageRule: e.race.ageRule,
        sexRule: e.race.sexRule, raceClass: e.race.raceClass, support: !!e.race.support,
        eligible: 0, candidates: 0, targetProtected: 0, committedElsewhere: 0, selectedElsewhere: 0, full: 0, booked: 0, rejected: {} };
    } else if (data.type === 'horse') {
      summary.active++;
      previous.set(data.horseId, data);
    } else if (data.type === 'preserved') {
      summary.preserved++;
      const h = horses.get(data.horseId);
      for (const e of events.values()) {
        const row = summary.races[e.key];
        if (W.eligible(w, { ...h, restUntil: 0 }, e.race, e.turn)) {
          row.eligible++; summary.eligibleComparisons++;
          if (e.key === data.key) { row.candidates++; summary.candidateComparisons++; }
          else { row.committedElsewhere++; reject(row, data.reason||'committed-elsewhere'); }
        } else for (const reason of eligibilityReasons(n, w, h, e)) reject(row, reason);
      }
    } else if (data.type === 'candidates') {
      candidates.set(data.horseId, data);
      const legal = new Set(data.eligibleKeys), h = horses.get(data.horseId);
      for (const e of events.values()) {
        const row = summary.races[e.key];
        if (legal.has(e.key)) { row.eligible++; summary.eligibleComparisons++; }
        else for (const reason of eligibilityReasons(n, w, h, e)) reject(row, reason);
      }
      for (const r of data.rejected) for (const reason of r.reasons) reject(summary.races[r.key], reason);
      for (const c of data.choices) { summary.races[c.key].candidates++; summary.candidateComparisons++; if(c.bookingBlocked==='target-preparation')summary.races[c.key].targetProtected++; }
    } else if (data.type === 'allocation') {
      allocations.set(data.horseId, data);
      for (const o of data.options) if (o.occupied >= o.capacity) { summary.fullOptions++; summary.races[o.key].full++; }
      const available = data.options.filter(o => o.occupied < o.capacity);
      const bestBase = available.reduce((best, o) => !best || o.utility > best.utility ? o : best, null);
      const chosen = available.find(o => o.key === data.selected);
      const needDriven = !!(data.reason !== 'retained-booking' && chosen && bestBase && chosen.utility < bestBase.utility);
      if (needDriven) summary.needDrivenSelections++;
      const h = horses.get(data.horseId), selectedEvent = events.get(data.selected);
      if (needDriven || !chosen || selectedEvent?.race.regionId !== h.homeRegionId || traced.has(data.horseId)) example({ type: 'allocation', horseId: data.horseId,
        rating: previous.get(data.horseId).rating, target: candidates.get(data.horseId)?.target,
        selected: data.selected, selectedName: events.get(data.selected)?.race.name,
        homeRegionId: h.homeRegionId, locationRegionId: h.locationRegionId,
        selectedPath: candidates.get(data.horseId)?.choices.find(c => c.key === data.selected)?.path,
        needDriven, allocationReason: data.reason || 'utility-with-field-support', chosen, bestBase, topOptions: available.slice().sort((a, b) => (b.utility + b.need) - (a.utility + a.need)).slice(0, 3) });
    } else if (data.type === 'move') {
      increment(summary.moves, data.reason);
      const from = events.get(data.from), to = events.get(data.to);
      if (data.reason === 'consolidation' && from?.race.distance !== to.race.distance) summary.crossDistanceMerges++;
      example({ ...data, fromName: from?.race.name, toName: to.race.name,
        fromDistance: from?.race.distance, toDistance: to.race.distance });
    } else if (data.type === 'end') {
      for (const [id, before] of previous) {
        const h = horses.get(id), finalKey = bookingKey(W, h.booked);
        if (finalKey && summary.races[finalKey]) summary.races[finalKey].booked++;
        else summary.unbooked++;
        if (h.target && (h.target.raceId !== h.booked?.raceId || h.target.turn !== h.booked?.turn)) summary.targetBookingMismatch++;
        if (h.target && h.booked && h.target.raceId !== h.booked.raceId && Math.abs(h.target.turn - h.booked.turn) < 3) summary.targetIntervalConflicts++;
        if (before.previousBooking && before.previousBooking.turn >= w.turn && candidates.has(id)) {
          summary.rebookingOpportunities++;
          if (bookingKey(W, before.previousBooking) !== finalKey || before.previousBooking.turn !== h.booked?.turn) summary.rebookings++;
        }
        for (const c of candidates.get(id)?.choices || []) if (c.key !== finalKey) summary.races[c.key].selectedElsewhere++;
      }
    }
  };
  return { sink, summary, candidates, allocations };
}

function explainShortField(row) {
  if (!row) return { primary: 'missing-planning-evidence', certainty: 'unknown' };
  let primary;
  if (row.eligible < 2) primary = 'eligibility-pool';
  else if (row.candidates >= 2 && row.candidates - (row.targetProtected || 0) < 2) primary = 'target-preparation';
  else if (row.candidates < 2) primary = row.rejected['condition-evidence'] ? 'condition-evidence-or-other-constraints' : 'rest-transport-or-commitment';
  else primary = 'allocation-or-schedule';
  return { primary, certainty: 'observed-funnel-not-counterfactual', eligible: row.eligible, targetProtected: row.targetProtected || 0,
    candidates: row.candidates, booked: row.booked, rejected: row.rejected,
    committedElsewhere: row.committedElsewhere, selectedElsewhere: row.selectedElsewhere, fullOptions: row.full };
}

function newMetrics() {
  return { turns: 0, performances: 0, overseasStarts: 0, crossGroupStarts: 0, locationChanges: 0,
    crossGroupMoves: 0, returnsHome: 0, departures: 0, crossGroupDepartures: 0, returnDepartures: 0, transitHorseTurns: 0, travelPurposes: {}, activeHorseTurns: 0, overseasHorseTurns: 0,
    unbookedHorseTurns: 0, maxObservedOverseasStreak: 0, plans: 0, rebookingOpportunities: 0,
    rebookings: 0, targetBookingMismatch: 0, targetIntervalConflicts: 0, needDrivenSelections: 0, moves: {}, crossDistanceMerges: 0,
    rejections: {}, calendarExclusions: {}, regions: {}, raceCells: {}, cancellations: [], smallFields: [], examples: [], violations: [] };
}

function addPlan(metrics, plan) {
  if (!plan) return;
  metrics.plans++;
  for (const key of ['rebookingOpportunities', 'rebookings', 'targetBookingMismatch', 'targetIntervalConflicts', 'needDrivenSelections', 'crossDistanceMerges']) metrics[key] += plan[key];
  for (const [key, count] of Object.entries(plan.moves)) increment(metrics.moves, key, count);
  for (const [key, count] of Object.entries(plan.rejected)) increment(metrics.rejections, key, count);
  for (const [key, count] of Object.entries(plan.calendarExclusions)) increment(metrics.calendarExclusions, key, count);
  for (const row of plan.examples) if (metrics.examples.length < 40) metrics.examples.push({ turn: plan.turn, ...row });
}

function recordTurn(n, before, out, plan, metrics, streaks) {
  const W = n.ChairmanRules, after = out.world;
  metrics.turns++;
  const old = new Map(before.horses.map(h => [h.id, h]));
  const nextHorses = new Map(after.horses.map(h => [h.id, h]));
  const groups = new Map(before.regions.map(r => [r.id, r.trafficGroup]));
  for (const h of before.horses.filter(h => h.status === 'active')) {
    metrics.activeHorseTurns++;
    if (!h.booked) metrics.unbookedHorseTurns++;
    const abroad = h.locationRegionId !== h.homeRegionId;
    const streak = abroad ? (streaks[h.id] || 0) + 1 : 0;
    streaks[h.id] = streak;
    if (abroad) metrics.overseasHorseTurns++;
    metrics.maxObservedOverseasStreak = Math.max(metrics.maxObservedOverseasStreak, streak);
    if(h.transit)metrics.transitHorseTurns++;
    // Location changes count arrivals, independently from departures and race starts.
    const next = nextHorses.get(h.id);
    for(const t of next?.travelHistory||[])if(t.departureTurn===before.turn){metrics.departures++;if(t.crossGroup)metrics.crossGroupDepartures++;if(t.kind==='return')metrics.returnDepartures++;}
    if (next && next.locationRegionId !== h.locationRegionId) {
      metrics.locationChanges++;
      if (groups.get(next.locationRegionId) !== groups.get(h.locationRegionId)) metrics.crossGroupMoves++;
      if (next.locationRegionId === next.homeRegionId) metrics.returnsHome++;
    }
  }
  const seen = new Set();
  for (const p of out.performances) {
    const h = old.get(p.horseId);
    metrics.performances++;
    if (p.regionId !== p.homeRegionId) metrics.overseasStarts++;
    if (groups.get(p.regionId) !== groups.get(p.homeRegionId)) metrics.crossGroupStarts++;
    if(p.regionId!==p.homeRegionId)increment(metrics.travelPurposes,p.travelPurpose||'未记录');
    if(h?.transit?.arrivalTurn>before.turn)metrics.violations.push({turn:before.turn,type:'in-transit-start',horseId:h.id});
    if (seen.has(p.horseId)) metrics.violations.push({ turn: before.turn, type: 'duplicate-start', horseId: p.horseId });
    seen.add(p.horseId);
    if (h?.lastRaceTurn != null && before.turn - h.lastRaceTurn < 3) metrics.violations.push({ turn: before.turn, type: 'interval', horseId: h.id });
    if (h?.restUntil > before.turn) metrics.violations.push({ turn: before.turn, type: 'injury-rest', horseId: h.id });
  }
  for (const event of out.occurrences) {
    const r = event.race;
    if (event.count > r.capacity) metrics.violations.push({ turn: before.turn, type: 'capacity', raceId: r.id });
    for (const p of out.performances.filter(p => p.occurrenceId === event.id)) {
      const h = old.get(p.horseId);
      if (!h || !W.eligible(before, h, r, before.turn)) metrics.violations.push({ turn: before.turn, type: 'eligibility', horseId: p.horseId });
    }
    if (r.support) continue;
    const region = metrics.regions[r.regionId] ||= { name: before.regions.find(v => v.id === r.regionId)?.name,
      scheduled: 0, completed: 0, graded: 0, gradedSix: 0, g1: 0, g1Runners: 0, runners: 0, counts: [] };
    region.scheduled++; region.completed += event.status === 'completed' ? 1 : 0;
    region.runners += event.count; region.counts.push(event.count);
    if (n.ChairmanWorld.graded(r)) { region.graded++; if (event.count >= 6) region.gradedSix++; }
    if (r.raceClass === 'g1') { region.g1++; region.g1Runners += event.count; }
    const cellKey = [r.regionId, r.raceClass, r.surface, W.category(r.distance), r.ageRule, r.sexRule].join('|');
    const cell = metrics.raceCells[cellKey] ||= { scheduled: 0, completed: 0, underSix: 0, runners: 0 };
    cell.scheduled++; cell.completed += event.status === 'completed' ? 1 : 0;
    cell.underSix += event.count < 6 ? 1 : 0; cell.runners += event.count;
    if (event.count < 6) {
      const row = { id: event.id, turn: before.turn, name: r.name, regionId: r.regionId, count: event.count,
        raceClass: r.raceClass, evidence: explainShortField(plan?.races[event.id]) };
      metrics.smallFields.push(row);
      if (event.status !== 'completed') metrics.cancellations.push(row);
    }
  }
}

function distribution(values) {
  const rows = values.slice().sort((a, b) => a - b);
  const q = fraction => rows.length ? rows[Math.max(0, Math.ceil(rows.length * fraction) - 1)] : null;
  return { count: rows.length, median: q(.5), p95: q(.95), max: rows.at(-1) ?? null };
}

module.exports = { copy, hash, manifest, bookingKey, createPlanAudit, explainShortField, newMetrics, addPlan, recordTurn, distribution };
