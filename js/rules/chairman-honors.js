(function () {
  'use strict';
  const ns = window.Keiba;
  const motives = { g1: 'G1', rating: '评价', prize: '奖金', winRate: '胜率', honor: '荣誉', local: '地方', continuity: '延续', random: '随机', abstain: '弃权' };
  const affinities = ['短途', '英里', '中距离', '中长距离', '长距离', '超长距离', '草地', '泥地'];
  // V2 parameters are immutable; changing the scoring contract requires a new round version.
  const hallParameters = Object.freeze({ g1Scale: 4, ratingOrigin: 100, ratingScale: 2.5, honorScale: 4, prizeScale: 6000,
    winStarts: 5, winPrior: 5, qualityFloor: 60, relativeFloor: .85, affinityDivisor: 20, preferencePenalty: 100, jitter: 3,
    defaults: Object.freeze({ g1: 40, rating: 30, honor: 20, prize: 5, winRate: 5 }) });
  const hallReasons = { support: '获得支持', abstain: '按弃权比例弃权', zeroWeight: '票权为零', noPrevious: '去年无有效支持对象',
    notRecognized: '无符合认可标准的候选', noMoreCandidates: '可认可候选不足三匹' };
  const W = () => ns.ChairmanRules, year = w => W().date(w.turn).year;
  const check = (ok, message) => { if (!ok) throw new Error(message); };
  const copy = v => W().clone(v);
  const unique = (w, prefix) => `${prefix}-${w.honors.nextId++}`;
  const regionId = (w, name) => W().regions(w).find(r => r.name === name)?.id || '';
  const max = values => { const a = values.filter(v => v != null); return a.length ? Math.max(...a) : null; };
  const units = n => Math.round(n * 100);
  const decimal = n => Number.isFinite(n) && Number.isSafeInteger(units(n)) && Math.abs(n * 100 - units(n)) < 1e-6;
  const same = (a, b) => a === b || !!a && !!b && typeof a === 'object' && typeof b === 'object' && Array.isArray(a) === Array.isArray(b)
    && Object.keys(a).length === Object.keys(b).length && Object.keys(a).every(k => Object.hasOwn(b, k) && same(a[k], b[k]));
  function initialize(w) {
    w.honors ||= { version: 1, nextId: 1, rngState: ns.ChairmanRatings.hash(`honors:${w.seed}`), threshold: 60, autoHall: false,
      associations: {}, drafts: {}, latest: {}, previous: {}, currentVotes: {}, closedYear: 0 };
    w.councilTypes ||= []; w.honorProfiles ||= [];
    for (const r of W().regions(w)) w.honors.associations[r.id] ||= { id: r.id, name: `${r.name}马会`, enabled: true, strict: false, awards: W().AWARDS.map(a => a.id) };
    const map = new Map(w.honorProfiles.map(p => [p.id, p]));
    for (const h of w.horses) if (!map.has(h.id)) { const p = register(w, h); map.set(h.id, p); }
  }
  function register(w, h) {
    const p = { id: h.id, year: year(w), regionId: regionId(w, h.homeRegion), retiredRegionId: h.status === 'retired' ? regionId(w, h.homeRegion) : null,
      distance: {}, surface: {}, annualDistance: {}, annualSurface: {}, ratings: {}, centralAwards: 0, honor: 0, localAwards: 0,
      nominated: false, excluded: false, induction: null, lastPerformanceTurn: -1 };
    w.honorProfiles.push(p); return p;
  }
  function profile(w, id) { return w.honorProfiles?.find(p => p.id === id); }
  function recordPerformance(w, p, r) {
    if (!p || r.turn <= p.lastPerformanceTurn) return;
    p.lastPerformanceTurn = r.turn;
    if (r.retired || r.rank == null) return;
    const amount = ({ g1: 8, g2: 4, g3: 2, op: 1 }[r.raceClass] || 1) * (r.rank === 1 ? 3 : r.rank <= 3 ? 2 : 1);
    const category = W().category(r.distance);
    for (const [key, label] of [['distance', category], ['surface', r.surface], ...(r.year === p.year ? [['annualDistance', category], ['annualSurface', r.surface]] : [])]) p[key][label] = (p[key][label] || 0) + amount;
  }
  function synchronize(w, out) {
    if (!w.honors) return;
    initialize(w); const profiles = new Map(w.honorProfiles.map(p => [p.id, p]));
    for (const r of out.performances || []) recordPerformance(w, profiles.get(r.horseId), r);
    for (const r of out.ratings || []) { const p = profiles.get(r.horseId); if (p) p.ratings[r.year] = { wtr: r.wtr, tf: r.tf }; }
    for (const a of out.awards || []) { const p = profiles.get(a.horseId); if (!p) continue; if (!a.scope || a.scope === 'central') { p.centralAwards++; p.honor += a.awardId === 'representative' ? 3 : 1; } else p.localAwards++; }
    for (const h of w.horses) {
      const p = profiles.get(h.id);
      if (h.status === 'retired' && !p.retiredRegionId) p.retiredRegionId = p.year === year(w) ? p.regionId : regionId(w, h.homeRegion);
      if (p.year !== year(w)) { p.year = year(w); p.regionId = regionId(w, h.homeRegion); p.annualDistance = {}; p.annualSurface = {}; }
    }
  }
  function migrate(world, performances, ratings, awards) {
    return W().mutate(world, (w) => {
      initialize(w); const map = new Map(w.honorProfiles.map(p => [p.id, p]));
      for (const r of [...performances].sort((a, b) => a.turn - b.turn)) recordPerformance(w, map.get(r.horseId), r);
      for (const r of ratings) { const p = map.get(r.horseId); if (p) p.ratings[r.year] = { wtr: r.wtr, tf: r.tf }; }
      for (const a of awards) { const p = map.get(a.horseId); if (!p) continue; if (!a.scope || a.scope === 'central') { p.centralAwards++; p.honor += a.awardId === 'representative' ? 3 : 1; } else p.localAwards++; }
    });
  }
  function getVotingProfile(w, h, lifetime = false, p = profile(w, h.id)) {
    const annual = h.annual, stats = lifetime ? h.lifetime : annual;
    const records = Object.values(p?.ratings || {});
    const wtr = lifetime ? max([...records.map(r => r.wtr), W().rating(h)]) : W().rating(h);
    const tf = lifetime ? max([...records.map(r => r.tf), annual.starts ? annual.tf : null]) : annual.starts ? annual.tf : null;
    return { id: h.id, name: h.name, age: W().ageOf(w, h), gender: h.gender, status: h.status, regionId: lifetime ? p?.retiredRegionId || p?.regionId : p?.regionId,
      g1: stats.g1, starts: stats.starts, wins: stats.wins, prize: stats.prize, winRate: stats.starts >= (lifetime ? 5 : 3) ? stats.wins / stats.starts : null,
      wtr, tf, rating: wtr ?? (tf == null ? null : tf - 5), ratingSource: wtr != null ? 'WTR' : tf != null ? 'TF－5' : '无评价',
      honor: (p?.honor || 0)+(ns.ChairmanSeries?.honor(h)||0), seriesHonor: ns.ChairmanSeries?.honor(h)||0, centralAwards: p?.centralAwards || 0, localAwards: p?.localAwards || 0,
      distance: copy(p?.[lifetime ? 'distance' : 'annualDistance'] || {}), surface: copy(p?.[lifetime ? 'surface' : 'annualSurface'] || {}) };
  }
  function hallEligible(h, p, value) { return h.status === 'retired' && h.lifetime.starts > 0 && !p.induction && !p.excluded && (p.nominated || h.lifetime.g1 > 0 || p.centralAwards > 0 || (h.seriesTitles||[]).length>0 || value.rating >= 120); }
  function getHonorCandidates(w, scope = 'central', awardId = 'hall') {
    const lifetime = awardId === 'hall', award = W().AWARDS.find(a => a.id === awardId), association = w.honors?.associations[scope];
    if (!lifetime && scope !== 'central' && (!association?.enabled || !association.awards.includes(awardId))) return [];
    check(lifetime ? scope === 'central' : !!award, '评选项目不存在。');
    const profiles = new Map(w.honorProfiles.map(p => [p.id, p]));
    return w.horses.flatMap(h => {
      const p = profiles.get(h.id), value = getVotingProfile(w, h, lifetime, p);
      const eligible = lifetime ? hallEligible(h, p, value) : (scope === 'central' || p.regionId === scope) && W().awardEligible(w, h, award, scope === 'central' ? w.awardsStrict : association.strict);
      return eligible ? [value] : [];
    }).sort((a, b) => a.id.localeCompare(b.id));
  }
  function affinityMultiplier(type, candidate) {
    const avg = group => { const entries = Object.entries(group), total = entries.reduce((s, [, n]) => s + n, 0); return total ? entries.reduce((s, [key, n]) => s + n * (type.affinities[key] || 0), 0) / total : 0; };
    return 2 ** ((avg(candidate.distance) + avg(candidate.surface)) / 100);
  }
  function validateType(w, t) {
    check(t.name && t.name.trim().length <= 80, '请填写1～80字的理事类型名称。');
    check(t.scope === 'central' || w.honors.associations[t.scope], '评议会不存在。');
    check(!t.regionId || w.honors.associations[t.regionId], '代表地区不存在。');
    check(Number.isSafeInteger(t.count) && t.count >= 0 && decimal(t.weight) && t.weight >= 0 && Number.isSafeInteger(t.count * units(t.weight)), '人数须为非负整数，票权须为非负数且最多两位小数。');
    check(Object.keys(motives).every(k => decimal(t.motives[k]) && t.motives[k] >= 0 && t.motives[k] <= 100) && Object.values(t.motives).reduce((s, n) => s + units(n), 0) === 10000, '评价倾向须合计100%，最多两位小数。');
    check(affinities.every(k => Number.isFinite(t.affinities[k]) && t.affinities[k] >= -100 && t.affinities[k] <= 100), '距离及场地爱好须在－100～100之间。');
  }
  function edit(world, kind, value) {
    return W().mutate(world, (w, out) => {
      initialize(w);
      if (kind === 'type') {
        const old = w.councilTypes.find(t => t.id === value.id), t = { enabled: true, ...copy(value), id: old?.id || unique(w, 'council'), members: old ? [...old.members] : [] };
        validateType(w, t); t.members = t.members.slice(0, t.count);
        while (t.members.length < t.count) t.members.push(unique(w, 'director'));
        if (old) Object.assign(old, t); else w.councilTypes.push(t);
      } else if (kind === 'deleteType') w.councilTypes = w.councilTypes.filter(t => t.id !== value.id);
      else if (kind === 'association') {
        const a = w.honors.associations[value.id]; check(a, '地方马会不存在。');
        check(String(value.name).trim().length > 0 && String(value.name).length <= 80, '请填写马会名称。');
        check(Array.isArray(value.awards) && value.awards.every(id => W().AWARDS.some(a => a.id === id)), '地方奖项无效。');
        Object.assign(a, { name: String(value.name).trim(), enabled: !!value.enabled, strict: !!value.strict, awards: [...new Set(value.awards)] });
      } else if (kind === 'settings') {
        check(decimal(value.threshold) && value.threshold > 0 && value.threshold <= 100, '门槛须大于0且不超过100%，最多两位小数。');
        w.honors.threshold = value.threshold; w.honors.autoHall = !!value.autoHall;
      } else if (kind === 'nominate' || kind === 'exclude') {
        const h = w.horses.find(h => h.id === value.id), p = profile(w, value.id);
        check(h?.status === 'retired' && h.lifetime.starts > 0, '仅可提名或排除实际出赛过的退役马。');
        if (kind === 'nominate') { p.nominated = true; p.excluded = false; } else p.excluded = !!value.excluded;
      } else if (kind === 'localDraft') {
        const key = `${value.scope}:${value.awardId}`;
        check(w.honors.associations[value.scope] && W().AWARDS.some(a => a.id === value.awardId), '地方奖项不存在。');
        check(!value.horseId || getHonorCandidates(w, value.scope, value.awardId).some(h => h.id === value.horseId), '地方奖候选已失效。');
        w.honors.drafts[key] = { horseId: value.horseId || '', comment: String(value.comment || '') };
      } else if (kind === 'induct') confirmHallInductions(w, out, value);
      else if (kind === 'revoke') {
        const p = profile(w, value.id); check(p?.induction, '该马尚未入选。');
        (out.hallEvents ||= []).push({ ...p.induction, id: unique(w, 'hall-revoke'), action: 'revoke', year: year(w), turn: w.turn, comment: String(value.comment || ''), previous: p.induction.id }); p.induction = null;
      } else throw new Error('荣誉操作无效。');
    });
  }
  function choose(random, rows, weight) {
    const total = rows.reduce((s, r) => s + weight(r), 0); if (!(total > 0)) return null;
    let n = random() * total; for (const r of rows) { n -= weight(r); if (n < 0) return r; } return rows.at(-1);
  }
  function percentileWeights(candidates, key) {
    const valid = candidates.filter(h => h[key] != null);
    if ((key === 'g1' || key === 'prize') && !valid.some(h => h[key] > 0)) return new Map();
    const sorted = valid.map(h => h[key]).sort((a, b) => a - b), rank = new Map();
    for (let i = 0; i < sorted.length;) { let j = i + 1; while (j < sorted.length && sorted[j] === sorted[i]) j++; rank.set(sorted[i], (i + j) / 2 / sorted.length); i = j; }
    return new Map(valid.map(h => [h.id, 1 + 9 * rank.get(h[key])]));
  }
  function defaultHallMotives() { return Object.fromEntries(Object.keys(motives).map(k => [k, hallParameters.defaults[k] || 0])); }
  function hallMetrics(h, p = hallParameters) {
    const clamp = n => Math.max(0, Math.min(100, n)), value = k => Number.isFinite(h[k]) ? Math.max(0, h[k]) : 0;
    return { g1: 100 * value('g1') / (value('g1') + p.g1Scale),
      rating: h.rating == null ? 0 : clamp((h.rating - p.ratingOrigin) * p.ratingScale),
      honor: 100 * value('honor') / (value('honor') + p.honorScale),
      prize: 100 * value('prize') / (value('prize') + p.prizeScale),
      winRate: value('starts') < p.winStarts ? 0 : clamp(100 * value('wins') / (value('starts') + p.winPrior)) };
  }
  function hallQuality(h, p = hallParameters) { const m = hallMetrics(h, p); return Math.max(m.g1, m.rating, m.honor); }
  function hallPrevious(w, candidates, types) {
    const ids = new Set(candidates.map(h => h.id)), previous = w.honors.previous['central:hall'] || {};
    return Object.fromEntries(types.flatMap(t => t.members.map(id => [id, [...new Set(previous[id] || [])].filter(h => ids.has(h)).sort()])));
  }
  function evidenceSignature(w, scope, awardId, candidates, types, version = awardId === 'hall' ? 2 : 1) {
    const evidence = { scope, awardId, candidates, types, threshold: w.honors.threshold };
    if (version === 2) Object.assign(evidence, { version, parameters: hallParameters, previousVotes: hallPrevious(w, candidates, types) });
    return ns.ChairmanRatings.hash(JSON.stringify(evidence));
  }
  // Shared by generation and history validation: every V2 ballot can be replayed from its frozen round.
  function createHallEvaluator(round) {
    const p = round.parameters, keys = Object.keys(hallParameters.defaults), ids = new Set(round.candidates.map(h => h.id));
    const hash = ns.ChairmanRatings.hash, randomValue = (...parts) => ns.Random.seeded(hash(JSON.stringify(parts)))();
    const candidates = round.candidates.map(h => { const metrics = hallMetrics(h, p); return { h, metrics,
      quality: Math.max(metrics.g1, metrics.rating, metrics.honor), tie: hash(JSON.stringify([round.tieSeed, h.id])), rankSeed: hash(`rank:${h.id}`) }; }).filter(h => h.quality >= p.qualityFloor);
    const configs = new Map();
    const compare = (a, b) => b.rankScore - a.rankScore || b.quality - a.quality || a.tie - b.tie || a.horseId.localeCompare(b.horseId);
    const bestThree = rows => { const top = []; for (const row of rows) if (top.length < 3 || compare(row, top[top.length - 1]) < 0) { top.push(row); top.sort(compare); if (top.length > 3) top.pop(); } return top; };
    const remember = (cache, key, value) => { if (cache.size >= 16) cache.delete(cache.keys().next().value); cache.set(key, value); return value; };
    return (type, memberId) => {
      const configKey = JSON.stringify([type.regionId, keys.map(k => type.motives[k]), type.motives.local, type.motives.continuity, affinities.map(k => type.affinities[k])]);
      let config = configs.get(configKey);
      if (!config) {
        const total = keys.reduce((s, k) => s + type.motives[k], 0), weights = Object.fromEntries(keys.map(k => [k, total ? type.motives[k] / total : p.defaults[k] / 100]));
        const avg = group => { const entries = Object.entries(group), total = entries.reduce((s, [, n]) => s + n, 0); return total ? entries.reduce((s, [k, n]) => s + n * type.affinities[k], 0) / total : 0; };
        const rows = candidates.filter(({ h }) => type.motives.local !== 100 || type.regionId && h.regionId === type.regionId).map(({ h, metrics, quality, tie, rankSeed }) => {
          const base = keys.reduce((s, k) => s + weights[k] * metrics[k], 0), affinity = (avg(h.distance) + avg(h.surface)) / p.affinityDivisor;
          const localPenalty = type.regionId && h.regionId === type.regionId ? 0 : p.preferencePenalty * type.motives.local / 100;
          return { horseId: h.id, metrics, quality, tie, rankSeed, base, affinity, localPenalty };
        }).filter(h => h.base > 0);
        config = remember(configs, configKey, { rows, histories: new Map() });
      }
      const previous = type.motives.continuity ? [...new Set(round.previousVotes[memberId] || [])].filter(id => ids.has(id)).sort() : [];
      const historyKey = JSON.stringify(previous);
      let eligible = config.histories.get(historyKey);
      if (!eligible) {
        const previousIds = new Set(previous), missing = !previous.length;
        const rows = type.motives.continuity === 100 && missing ? [] : config.rows.filter(h => type.motives.continuity !== 100 || previousIds.has(h.horseId)).map(h => {
          const continuityPenalty = missing || previousIds.has(h.horseId) ? 0 : p.preferencePenalty * type.motives.continuity / 100;
          const score = h.base + h.affinity - h.localPenalty - continuityPenalty;
          return { ...h, continuityPenalty, score, rankScore: score, jitter: 0 };
        }).filter(h => h.score > 0);
        const best = rows.reduce((best, h) => Math.max(best, h.score), 0);
        const pool = rows.filter(h => h.score >= best * p.relativeFloor);
        eligible = remember(config.histories, historyKey, { pool, top: bestThree(pool) });
      }
      let top = eligible.top;
      if (type.motives.random > 0) {
        top = [];
        const memberSeed = hash(JSON.stringify([round.ballotSeed, memberId, 'rank'])), amplitude = p.jitter * type.motives.random / 100;
        for (const h of eligible.pool) {
          const jitter = amplitude * (2 * ns.Random.seeded((memberSeed ^ h.rankSeed) >>> 0)() - 1), rankScore = h.score + jitter;
          const last = top[top.length - 1];
          if (top.length < 3 || rankScore > last.rankScore || rankScore === last.rankScore && (h.quality > last.quality || h.quality === last.quality && (h.tie < last.tie || h.tie === last.tie && h.horseId.localeCompare(last.horseId) < 0))) {
            top.push({ ...h, jitter, rankScore }); top.sort(compare); if (top.length > 3) top.pop();
          }
        }
      }
      return Array.from({ length: 3 }, (_, slot) => {
        const h = top[slot], abstained = type.motives.abstain > 0 && randomValue(round.ballotSeed, memberId, slot, 'abstain') < type.motives.abstain / 100;
        const reason = type.weight === 0 ? 'zeroWeight' : !h ? type.motives.continuity === 100 && !previous.length ? 'noPrevious' : top.length ? 'noMoreCandidates' : 'notRecognized' : abstained ? 'abstain' : 'support';
        const score = h ? { metrics: { ...h.metrics }, quality: h.quality, base: h.base, affinity: h.affinity, localPenalty: h.localPenalty,
          continuityPenalty: h.continuityPenalty, score: h.score, jitter: h.jitter, rankScore: h.rankScore } : null;
        return { horseId: reason === 'support' ? h.horseId : null, candidateId: h?.horseId || null, reason, score };
      });
    };
  }
  function* buildCouncilBallot(w, out, scope = 'central', awardId = 'hall', force = false) {
    initialize(w); const key = `${scope}:${awardId}`, previous = w.honors.latest[key];
    if (previous && !force) return;
    const types = w.councilTypes.filter(t => t.enabled && t.scope === scope && t.count > 0).map(copy);
    if (!types.length) return;
    const candidates = getHonorCandidates(w, scope, awardId), byId = new Map(candidates.map(h => [h.id, h]));
    const totalUnits = types.reduce((s, t) => s + t.count * units(t.weight), 0); check(Number.isSafeInteger(totalUnits), '评议会总票权过大。');
    const id = unique(w, 'ballot'), lifetime = awardId === 'hall';
    const random = ns.Random.seeded(lifetime ? w.honors.hallRngState ?? ns.ChairmanRatings.hash(`hall-v2:${w.seed}`) : w.honors.rngState);
    const weights = lifetime ? {} : Object.fromEntries(['g1', 'rating', 'prize', 'winRate'].map(k => [k, percentileWeights(candidates, k)]));
    const tallies = Object.fromEntries(candidates.map(h => [h.id, 0])), byType = {}, continuity = {}, lastVotes = w.honors.previous[key] || {};
    const round = { id, year: year(w), turn: w.turn, scope, awardId, name: lifetime ? '中央殿堂' : W().AWARDS.find(a => a.id === awardId).name,
      associationName: scope === 'central' ? '中央马会' : w.honors.associations[scope].name, phase: w.phase, version: lifetime ? 2 : 1, candidates, types,
      totalUnits, threshold: w.honors.threshold, signature: evidenceSignature(w, scope, awardId, candidates, types), replaces: previous?.id || null };
    if (lifetime) {
      random();
      Object.assign(round, { parameters: copy(hallParameters), ballotSeed: random.state(),
        tieSeed: ns.ChairmanRatings.hash(`hall-ties:${w.seed}:${round.year}`), previousVotes: hallPrevious(w, candidates, types) });
    }
    const evaluate = lifetime ? createHallEvaluator(round) : null;
    let count = 0;
    for (const type of types) {
      byType[type.id] = {};
      const factors = lifetime ? null : new Map(candidates.map(h => [h.id, affinityMultiplier(type, h)]));
      for (const memberId of type.members) {
        const supported = new Set(), slots = [];
        if (lifetime) {
          slots.push(...evaluate(type, memberId));
          for (const s of slots) if (s.horseId) { supported.add(s.horseId); tallies[s.horseId] += units(type.weight); byType[type.id][s.horseId] = (byType[type.id][s.horseId] || 0) + units(type.weight); }
        } else for (let slot = 0; slot < 1; slot++) {
          const available = candidates.filter(h => !supported.has(h.id));
          const previousCandidates = (lastVotes[memberId] || []).map(id => byId.get(id)).filter(h => h && !supported.has(h.id));
          const options = Object.keys(motives).filter(k => (lifetime || k !== 'honor') && (k !== 'continuity' || previousCandidates.length));
          const motive = choose(random, options, k => type.motives[k]);
          let pool = available, base = () => 1;
          if (weights[motive]) { pool = pool.filter(h => weights[motive].has(h.id)); base = h => weights[motive].get(h.id); }
          if (motive === 'honor') { pool = pool.filter(h => h.honor > 0); base = h => h.honor; }
          if (motive === 'local') pool = pool.filter(h => h.regionId === type.regionId);
          if (motive === 'continuity') pool = previousCandidates;
          const selected = motive && motive !== 'abstain' && type.weight > 0 ? choose(random, pool, h => base(h) * factors.get(h.id)) : null;
          slots.push({ motive: motive || 'abstain', horseId: selected?.id || null, factor: selected ? factors.get(selected.id) : null, base: selected ? base(selected) : null });
          if (selected) { supported.add(selected.id); tallies[selected.id] += units(type.weight); byType[type.id][selected.id] = (byType[type.id][selected.id] || 0) + units(type.weight); }
        }
        continuity[memberId] = [...supported];
        (out.councilVotes ||= []).push({ id: `${id}:${memberId}`, roundId: id, year: year(w), turn: w.turn, scope, memberId, typeId: type.id, weightUnits: units(type.weight), slots });
        if (++count % 100 === 0) yield { done: count, total: types.reduce((s, t) => s + t.count, 0), name: round.name };
      }
    }
    Object.assign(round, { tallies, byType }); (out.councilRounds ||= []).push(round);
    if (lifetime) {
      const profiles = new Map(w.honorProfiles.map(p => [p.id, p]));
      for (const h of candidates) profiles.get(h.id).lastHallVote = { roundId: id, year: round.year, votes: tallies[h.id], totalUnits };
    }
    w.honors.latest[key] = { id, year: round.year, phase: round.phase, signature: round.signature, totalUnits, threshold: round.threshold, tallies };
    w.honors.currentVotes[key] = continuity; w.honors[lifetime ? 'hallRngState' : 'rngState'] = random.state();
    if (lifetime && w.honors.autoHall) for (const h of candidates) if (passes(tallies[h.id], totalUnits, round.threshold)) confirmHallInductions(w, out, { id: h.id, method: 'vote', round });
    return round;
  }
  function passes(votes, total, threshold) { return total > 0 && BigInt(votes) * 10000n >= BigInt(total) * BigInt(units(threshold)); }
  function confirmHallInductions(w, out, value) {
    const h = w.horses.find(h => h.id === value.id), p = profile(w, value.id);
    check(h?.status === 'retired' && h.lifetime.starts > 0 && !p?.induction, '仅可授予尚未入选且实际出赛过的退役马。');
    const r = value.round, method = value.method || 'special';
    if (method === 'vote') check(r?.awardId === 'hall' && r.scope === 'central' && w.honors.latest['central:hall']?.id === r.id && passes(r.tallies[h.id] || 0, r.totalUnits, r.threshold), '未达到本轮殿堂门槛。');
    const event = { id: unique(w, 'hall'), horseId: h.id, horseName: h.name, year: year(w), turn: w.turn, action: 'induct', method,
      roundId: method === 'vote' ? r.id : null, votes: method === 'vote' ? r.tallies[h.id] : null, totalUnits: method === 'vote' ? r.totalUnits : null, comment: String(value.comment || '') };
    p.induction = copy(event); (out.hallEvents ||= []).push(event);
  }
  function* automatic(w, out) {
    if (!w.honors || w.phase !== 'yearEnd') return;
    for (const scope of ['central', ...Object.keys(w.honors.associations)]) {
      if (scope !== 'central' && !w.honors.associations[scope].enabled) continue;
      for (const a of W().AWARDS) if (scope === 'central' || w.honors.associations[scope].awards.includes(a.id)) { yield* buildCouncilBallot(w, out, scope, a.id); if (out.councilRounds?.length) yield { done: out.councilRounds.length, total: 12 * (1 + Object.keys(w.honors.associations).length) + 1, name: '年度评议项目' }; }
    }
    yield* buildCouncilBallot(w, out, 'central', 'hall');
  }
  function runAutomatic(out) { for (const progress of automatic(out.world, out)) void progress; return out; }
  async function consume(iterator, progress = () => {}, cancelled = () => false) {
    for (const step of iterator) { check(!cancelled(), '评议已取消，未保存本轮结果。'); progress(step); await new Promise(resolve => setTimeout(resolve, 0)); }
    check(!cancelled(), '评议已取消，未保存本轮结果。');
  }
  function applyBallotSuggestions(world, rounds, overwrite = false) {
    return W().mutate(world, w => {
      for (const r of rounds) {
        check(r.year === year(w) && w.honors.latest[`${r.scope}:${r.awardId}`]?.id === r.id && r.awardId !== 'hall', '只能采用本年当前轮次的奖项建议。');
        const best = Math.max(0, ...Object.values(r.tallies)), winners = Object.entries(r.tallies).filter(([, n]) => n === best && n > 0);
        if (winners.length !== 1) continue;
        const horseId = winners[0][0]; check(getHonorCandidates(w, r.scope, r.awardId).some(h => h.id === horseId), '最高票候选已失效，请重新评议或人工选择。');
        if (r.scope === 'central') { if (overwrite || !w.awardDraft[r.awardId]) w.awardDraft[r.awardId] = horseId; }
        else { const key = `${r.scope}:${r.awardId}`; if (overwrite || !w.honors.drafts[key]?.horseId) w.honors.drafts[key] = { horseId, comment: w.honors.drafts[key]?.comment || '' }; }
      }
    });
  }
  function finalizeAnnualHonors(w, out) {
    if (!w.honors) return;
    check(w.honors.closedYear < year(w), '本年荣誉已经封存。');
    for (const a of Object.values(w.honors.associations)) if (a.enabled) for (const id of a.awards) {
      const draft = w.honors.drafts[`${a.id}:${id}`]; if (!draft?.horseId) continue;
      const h = getHonorCandidates(w, a.id, id).find(h => h.id === draft.horseId); check(h, `${a.name}的获奖候选已失效，请清空或改选。`);
      out.awards.push({ id: `${year(w)}:local:${a.id}:${id}`, year: year(w), turn: w.turn, awardId: id, scope: a.id, associationName: a.name,
        name: W().AWARDS.find(a => a.id === id).name, horseId: h.id, horseName: h.name, comment: draft.comment, representative: '', awardVersion: 3 });
    }
    (out.honorYears ||= []).push({ id: String(year(w)), year: year(w), turn: w.turn, latest: copy(w.honors.latest), drafts: copy(w.honors.drafts), centralDraft: copy(w.awardDraft) });
    w.honors.closedYear = year(w); w.honors.previous = w.honors.currentVotes; w.honors.currentVotes = {}; w.honors.latest = {}; w.honors.drafts = {};
  }
  function validate(w) {
    if (!w.honors) return;
    check(w.honors.version === 1 && Number.isSafeInteger(w.honors.nextId) && w.honors.nextId > 0 && Number.isInteger(w.honors.rngState) && w.honors.rngState >= 0 && w.honors.rngState <= 0xffffffff, '评议版本或随机状态无效。');
    check(w.honors.hallRngState === undefined || Number.isInteger(w.honors.hallRngState) && w.honors.hallRngState >= 0 && w.honors.hallRngState <= 0xffffffff, '殿堂随机状态无效。');
    check(decimal(w.honors.threshold) && w.honors.threshold > 0 && w.honors.threshold <= 100, '殿堂门槛无效。');
    const horses = new Set(w.horses.map(h => h.id)), members = new Set();
    for (const t of w.councilTypes || []) { validateType(w, t); check(t.members.length === t.count, '理事人数与身份不一致。'); for (const id of t.members) { check(typeof id === 'string' && !members.has(id), '理事身份重复。'); members.add(id); } }
    check(new Set((w.honorProfiles || []).map(p => p.id)).size === w.horses.length && w.honorProfiles.length === w.horses.length, '荣誉摘要缺失或重复。');
    for (const p of w.honorProfiles) {
      check(horses.has(p.id) && Number.isInteger(p.year) && w.honors.associations[p.regionId], '荣誉摘要关联无效。');
      for (const key of ['distance', 'surface', 'annualDistance', 'annualSurface']) check(p[key] && Object.values(p[key]).every(n => Number.isFinite(n) && n >= 0), '公开表现分布无效。');
      for (const r of Object.values(p.ratings)) check([r.wtr, r.tf].every(n => n == null || Number.isFinite(n)), '荣誉历史评价无效。');
    }
  }
  function validateHistory(w, records) {
    const horses = new Set(w.horses.map(h => h.id)), rounds = new Map((records.councilRounds || []).map(r => [r.id, r]));
    for (const r of rounds.values()) {
      check((r.version === 1 || r.version === 2 && r.awardId === 'hall') && Number.isSafeInteger(r.totalUnits) && r.totalUnits >= 0 && (r.scope === 'central' || w.honors.associations[r.scope]), '评议轮次内容无效。');
      check(decimal(r.threshold) && r.threshold > 0 && r.threshold <= 100, '历史殿堂门槛无效。');
      check(r.awardId === 'hall' ? r.scope === 'central' : W().AWARDS.some(a => a.id === r.awardId), '评议项目无效。');
      check(Array.isArray(r.candidates) && new Set(r.candidates.map(h => h.id)).size === r.candidates.length && r.candidates.every(h => horses.has(h.id)), '评议候选关联无效。');
      for (const h of r.candidates) {
        check(typeof h.name === 'string' && ['g1', 'starts', 'wins', 'prize', 'honor'].every(k => Number.isFinite(h[k]) && h[k] >= 0) && ['wtr', 'tf', 'rating', 'winRate'].every(k => h[k] == null || Number.isFinite(h[k])), '候选公开指标无效。');
        check(h.distance && h.surface && [...Object.values(h.distance), ...Object.values(h.surface)].every(n => Number.isFinite(n) && n >= 0), '候选表现分布无效。');
      }
      const ids = new Set(r.candidates.map(h => h.id));
      check(Object.keys(r.tallies).length === ids.size && Object.entries(r.tallies).every(([id, n]) => ids.has(id) && Number.isSafeInteger(n) && n >= 0 && n <= r.totalUnits), '票数无效。');
      r.types.forEach(t => validateType(w, t));
      const members = r.types.flatMap(t => t.members);
      check(new Set(members).size === members.length && r.types.every(t => t.members.length === t.count) && r.totalUnits === r.types.reduce((s, t) => s + t.count * units(t.weight), 0), '历史理事或总票权无效。');
      if (r.version === 2) {
        const uint = n => Number.isInteger(n) && n >= 0 && n <= 0xffffffff;
        check(same(r.parameters, hallParameters) && uint(r.ballotSeed) && uint(r.tieSeed), '殿堂评分参数或随机依据无效。');
        check(r.previousVotes && Object.keys(r.previousVotes).length === members.length && members.every(id => Array.isArray(r.previousVotes[id]) && new Set(r.previousVotes[id]).size === r.previousVotes[id].length && r.previousVotes[id].length <= 3 && r.previousVotes[id].every(h => ids.has(h))), '殿堂延续依据无效。');
      }
    }
    const sums = new Map(), seenVotes = new Set(), evaluators = new Map(), typeMaps = new Map(), candidateSets = new Map(), memberSets = new Map();
    for (const r of rounds.values()) {
      typeMaps.set(r.id, new Map(r.types.map(t => [t.id, t]))); candidateSets.set(r.id, new Set(r.candidates.map(h => h.id)));
      memberSets.set(r.id, new Map(r.types.map(t => [t.id, new Set(t.members)])));
    }
    for (const v of records.councilVotes || []) {
      const r = rounds.get(v.roundId), type = typeMaps.get(v.roundId)?.get(v.typeId);
      check(!seenVotes.has(`${v.roundId}:${v.memberId}`), '同一轮理事选票重复。'); seenVotes.add(`${v.roundId}:${v.memberId}`);
      check(r && memberSets.get(r.id).get(v.typeId)?.has(v.memberId) && v.weightUnits === units(type.weight) && v.year === r.year && v.slots.length === (r.awardId === 'hall' ? 3 : 1), '选票关联无效。');
      const selected = v.slots.filter(s => s.horseId), ids = candidateSets.get(r.id);
      check(new Set(selected.map(s => s.horseId)).size === selected.length && selected.every(s => ids.has(s.horseId)), '选票重复支持或候选无效。');
      if (r.version === 2) {
        if (!evaluators.has(r.id)) evaluators.set(r.id, createHallEvaluator(r));
        check(same(v.slots, evaluators.get(r.id)(type, v.memberId)), '殿堂选票评分或弃权依据不一致。');
      }
      else check(v.slots.every(s => Object.hasOwn(motives, s.motive)) && selected.every(s => Number.isFinite(s.factor) && s.factor >= .25 && s.factor <= 4), '选票爱好依据无效。');
      const summary = sums.get(r.id) || { count: 0, votes: {}, byType: Object.fromEntries(r.types.map(t => [t.id, {}])) }; summary.count++;
      for (const s of selected) { summary.votes[s.horseId] = (summary.votes[s.horseId] || 0) + v.weightUnits; const group = summary.byType[v.typeId]; group[s.horseId] = (group[s.horseId] || 0) + v.weightUnits; }
      sums.set(r.id, summary);
      if (r.version === 2 && summary.count === r.types.reduce((n, t) => n + t.count, 0)) evaluators.delete(r.id);
    }
    for (const r of rounds.values()) { const s = sums.get(r.id) || { count: 0, votes: {} }; check(s.count === r.types.reduce((sum, t) => sum + t.count, 0) && Object.entries(r.tallies).every(([id, n]) => n === (s.votes[id] || 0)), '选票不完整或总票数不一致。'); }
    for (const r of rounds.values()) if (r.version === 2) check(same(r.byType, sums.get(r.id)?.byType), '类型分票与选票不一致。');
    for (const e of records.hallEvents || []) check(horses.has(e.horseId) && ['induct', 'revoke'].includes(e.action) && (!e.roundId || rounds.has(e.roundId)), '殿堂记录关联无效。');
    for (const a of records.awards || []) check(!a.scope || a.scope === 'central' || w.honors.associations[a.scope], '地方奖项所属马会无效。');
    for (const [key, latest] of Object.entries(w.honors.latest)) { const r = rounds.get(latest.id); check(r && `${r.scope}:${r.awardId}` === key && r.year === year(w) && JSON.stringify(r.tallies) === JSON.stringify(latest.tallies) && r.totalUnits === latest.totalUnits && r.threshold === latest.threshold, '当前评议轮次与历史不一致。'); }
    const events = new Map((records.hallEvents || []).map(e => [e.id, e]));
    for (const p of w.honorProfiles) if (p.lastHallVote) {
      const v = p.lastHallVote, r = rounds.get(v.roundId);
      check(r?.awardId === 'hall' && r.year === v.year && Object.hasOwn(r.tallies, p.id) && r.tallies[p.id] === v.votes && r.totalUnits === v.totalUnits, '最近殿堂支持率与原始选票不一致。');
    }
    for (const p of w.honorProfiles) if (p.induction) { const event = events.get(p.induction.id); check(event?.action === 'induct' && event.horseId === p.id && JSON.stringify(event) === JSON.stringify(p.induction), '殿堂身份缺少对应授予记录。'); }
    for (const [key, draft] of Object.entries(w.honors.drafts)) check(Object.keys(w.honors.associations).some(scope => W().AWARDS.some(a => key === `${scope}:${a.id}`)) && (!draft.horseId || horses.has(draft.horseId)), '地方奖项草稿关联无效。');
  }
  ns.ChairmanHonors = { motives, affinities, hallParameters, hallReasons, hallMetrics, hallQuality, defaultHallMotives, createHallEvaluator, initialize, register, synchronize, migrate, profile, getVotingProfile, getHonorCandidates, affinityMultiplier,
    validateType, edit, evidenceSignature, buildCouncilBallot, passes, confirmHallInductions, automatic, runAutomatic, consume, applyBallotSuggestions, finalizeAnnualHonors, validate, validateHistory };
})();
