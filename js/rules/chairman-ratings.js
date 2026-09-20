(function () {
  'use strict';
  const ns = window.Keiba;
  const VERSION = 2;
  const knots = [[1000, 3.3], [1200, 3], [1600, 2.5], [2000, 2], [2400, 1.5], [3200, 1]];
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  function hash(text) { let h = 2166136261; for (const c of String(text)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b); return (h ^ h >>> 13) >>> 0; }
  function getRatingScaleOffset(seed, id) { const v = hash(`scale:1:${seed}:${id}`) / 4294967296; return v < .25 ? 4 : v < .75 ? 5 : 6; }
  function pointsPerLength(distance) {
    let i = knots.findIndex(k => distance <= k[0]); if (i < 1) i = distance <= knots[0][0] ? 1 : knots.length - 1;
    const [x, a] = knots[i - 1], [y, b] = knots[i]; return clamp(a + (distance - x) / (y - x) * (b - a), .5, 4);
  }
  function deficit(row, distance) {
    if(Number.isFinite(row.ratingDeficit) && row.ratingDeficit>=0)return row.ratingDeficit;
    const raw = Math.max(0, Number(row.margin) || 0) * pointsPerLength(distance);
    return Math.min(20, raw) + Math.max(0, Math.min(20, raw - 20)) * .5 + Math.max(0, raw - 40) * .25;
  }
  function median(values) { const a = [...values].sort((a,b) => a-b); return a.length ? (a[Math.floor((a.length-1)/2)] + a[Math.ceil((a.length-1)/2)]) / 2 : null; }
  function weightedMedian(rows) {
    if (!rows.length) return null;
    const a = rows.map((r,i) => ({ n: r.tf, weight: 5-i })).sort((a,b) => a.n-b.n);
    const half = a.reduce((s,r) => s+r.weight, 0)/2; let sum = 0;
    for (const r of a) { sum += r.weight; if (sum >= half) return r.n; }
  }
  function recent(h, turn, race) {
    const all = (h.recentForm || []).filter(p => p.tf != null && !p.retired && p.turn < turn && p.turn >= turn-12).sort((a,b)=>b.turn-a.turn);
    let rows = race ? all.filter(p => p.surface === race.surface && Math.abs(p.distance-race.distance) <= 400) : all;
    if (rows.length < 2) rows = [...rows, ...all.filter(p => !rows.includes(p))];
    rows = rows.slice(0,5); const value = weightedMedian(rows);
    return { value, count: rows.length, spread: rows.length ? median(rows.map(p => Math.abs(p.tf-value))) : 0, rows };
  }
  function rateRaceTF(race, results, horses, turn, standards, calibration) {
    const byId = new Map(horses.map(h => [h.id, h]));
    // Public inputs only: deliberately discard simulator totals, pressure and abilities.
    const field = results.filter(p => !p.retired && p.rank != null).map(p => ({ horseId: p.horseId, rank: p.rank,
      d: deficit(p, race.distance), form: recent(byId.get(p.horseId) || {}, turn, race) }));
    if (!field.length) return { ratings: {}, benchmarkId: null, winnerRating: null, source: 'no-finishers', version: VERSION };
    const known = field.filter(p => p.form.value != null);
    function candidates(pool) {
      return pool.filter(p => p.form.count >= 2).map(p => {
        const win = p.form.value + p.d;
        const error = known.reduce((s,q) => s + Math.abs(win-q.d-q.form.value)*q.form.count,0) / Math.max(1,known.reduce((s,q)=>s+q.form.count,0));
        return { ...p, win, error };
      }).filter(p=>p.error <= 8).sort((a,b)=>a.error-b.error || b.form.count-a.form.count || a.form.spread-b.form.spread || a.rank-b.rank);
    }
    let chosen = candidates(field.filter(p=>p.rank>=2 && p.rank<=5))[0] || candidates(field)[0];
    let winnerRating = chosen?.win, source = chosen ? 'benchmark' : '', benchmarkId = chosen?.horseId || null;
    const winner = field.find(p=>p.rank===1) || field[0];
    if (winnerRating == null && winner.form.value != null) { winnerRating = winner.form.value; source = 'winner-history'; benchmarkId = winner.horseId; }
    const history = standards?.[race.id] || standards?.[`${race.surface}|${ns.ChairmanRules.category(race.distance)}`];
    if (winnerRating == null && history?.length) { winnerRating = median(history); source = 'race-history'; }
    if (winnerRating == null) { winnerRating = 100 + median(field.map(p=>p.d)); source = 'initial'; }
    // Standardisation: public contemporaries provide an absolute reference for
    // otherwise closed chains of relative anchors. There is no grade bonus/cap.
    if (calibration?.count >= 2 && source !== 'initial') {
      const standard=median(field.map(p=>(calibration.references[p.horseId]??calibration.target)+p.d));
      winnerRating=.8*winnerRating+.2*standard;
    }
    return { ratings: Object.fromEntries(field.map(p=>[p.horseId, Math.round(winnerRating-p.d)])), benchmarkId, winnerRating, source, version: VERSION };
  }
  function buildWtrRecommendations(race, rows, benchmarkId, score) {
    const anchor = rows.find(p=>p.horseId===benchmarkId && !p.retired && p.rank != null);
    if (!anchor || !Number.isFinite(score)) throw new Error('请选择完赛基准马并填写有效分数。');
    const d = deficit(anchor, race.distance);
    return Object.fromEntries(rows.filter(p=>!p.retired && p.rank != null).map(p=>[p.id, p.horseId===benchmarkId ? score : Number((score+d-deficit(p,race.distance)).toFixed(1))]));
  }
  function record(h, p, count) {
    const row = { turn:p.turn, tf:p.tf, raceClass:p.raceClass, rank:p.rank, retired:!!p.retired, surface:p.surface, distance:p.distance,
      region:p.surfaceRegion, count, age:p.age, year:p.year, raceId:p.raceId };
    h.recentForm = [...(h.recentForm || []).filter(r=>r.turn>=p.turn-12 && r.turn!==p.turn), row].slice(-12);
    if (p.raceClass === 'op') { const s = h.background || (h.background={starts:0,wins:0,prize:0,lastTf:null}); s.starts++; if(p.rank===1)s.wins++; s.prize+=p.prize; if(p.tf!=null)s.lastTf=p.tf; }
  }
  function calibration(world) {
    const horses=world.horses.filter(h=>h.status==='active').map(h=>({id:h.id,value:recent(h,world.turn+1).value})).filter(h=>h.value!=null);
    const sorted=horses.map(h=>h.value).sort((a,b)=>a-b), target=world.tfScaleCenter??100, references={};
    const ranks=new Map();for(let i=0;i<sorted.length;){let j=i+1;while(j<sorted.length&&sorted[j]===sorted[i])j++;ranks.set(sorted[i],(i+j)/2/sorted.length);i=j;}
    for(const h of horses)references[h.id]=target+40*(ranks.get(h.value)-.5);
    return {count:horses.length,center:median(sorted),target,references};
  }
  function manualMaximum(rows) { const a = rows.filter(p=>!p.retired && p.manualRating != null).map(p=>p.manualRating); return a.length ? Math.max(...a) : null; }
  function applyManualYear(w,h,year,rows,archived,out) {
    const current=ns.ChairmanRules.date(w.turn).year, suggested=manualMaximum(rows);
    if(year===current) h.annual.suggested=suggested;
    else {
      if(!archived)throw new Error('缺少对应年度档案。');
      const row={...archived,suggested,wtr:archived.manual??suggested};out.ratings.push(row);
      if(year===current-1)h.previousWtr=row.wtr;
      ns.ChairmanBreeding?.recordRating(h,year,row.wtr,row.tf);
    }
    const last=rows.find(p=>p.turn===h.lastRaceTurn);if(last)h.lastEventRating=last.manualRating??null;
  }
  function migrate(world, performances, ratings) {
    const W = ns.ChairmanRules;
    return W.mutate(world, (w,out) => {
      w.ratingVersion=VERSION; w.aiVersion=2; w.ratingSeed=w.seed>>>0; w.aiRngState=hash(`ai:${w.seed}`); w.tfStandards={};
      const byHorse=new Map(), byYear=new Map();
      for(const p of [...performances].sort((a,b)=>a.turn-b.turn)) { if(!byHorse.has(p.horseId))byHorse.set(p.horseId,[]); byHorse.get(p.horseId).push(p); const k=`${p.year}:${p.horseId}`; if(!byYear.has(k))byYear.set(k,[]); byYear.get(k).push(p); }
      for(const h of w.horses) {
        h.recentForm=[]; h.background={starts:0,wins:0,prize:0,lastTf:null};
        const rows=byHorse.get(h.id)||[]; for(const p of rows)record(h,p,p.count||0);
        h.annual.legacyAutomatic=h.annual.suggested; h.annual.suggested=manualMaximum(byYear.get(`${h.annual.year}:${h.id}`)||[]);
        const prev=ratings.find(r=>r.horseId===h.id && r.year===W.date(w.turn).year-1);
        h.previousWtr=prev ? prev.manual ?? manualMaximum(byYear.get(prev.id)||[]) : null; h.previousTf=prev?.tf??null;
        if(h.lastRaceTurn!=null) h.lastEventRating=rows.findLast(p=>p.turn===h.lastRaceTurn)?.manualRating??null;
      }
      for (const h of w.horses) if(h.breeding) {h.breeding.yearWtr={};h.breeding.bestWtr=null;h.breeding.evaluationByYear={};h.breeding.bestEvaluation=null;}
      out.ratings=ratings.map(r=>{ const suggested=manualMaximum(byYear.get(`${r.year}:${r.horseId}`)||[]); return {...r,legacyAutomatic:r.manual == null ? r.wtr : null, suggested,wtr:r.manual??suggested,ratingVersion:VERSION}; });
      for (const r of out.ratings) {const h=w.horses.find(h=>h.id===r.horseId);if(h?.breeding)ns.ChairmanBreeding.recordRating(h,r.year,r.wtr,r.tf);}
    });
  }
  ns.ChairmanRatings={VERSION,hash,getRatingScaleOffset,pointsPerLength,deficit,median,recent,rateRaceTF,buildWtrRecommendations,record,calibration,manualMaximum,applyManualYear,migrate};
})();
