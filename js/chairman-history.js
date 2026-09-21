(function () {
  "use strict";
  const ns = window.Keiba, W = ns.ChairmanRules, O = ns.ChairmanOffice, P = ns.ChairmanStorage.Store.prototype;
  const range = (parts) => window.IDBKeyRange.bound(parts, [...parts, []]);
  const plain = (row) => { const r = { ...row }; delete r.worldId; return r; };
  P.previousPerformance = async function (worldId, row) {
    if (row.priorPerformanceId) {
      const prior = await this.get('performances', worldId, row.priorPerformanceId);
      if (prior && prior.horseId === row.horseId && prior.turn < row.turn) return prior;
    }
    if (row.turn <= 0) return null;
    const source = this.db.transaction('performances').objectStore('performances').index('byHorseTurn');
    return new Promise((resolve, reject) => {
      const req = source.openCursor(window.IDBKeyRange.bound([worldId, row.horseId, 0], [worldId, row.horseId, row.turn], false, true), 'prev');
      req.onsuccess = () => resolve(req.result ? plain(req.result.value) : null); req.onerror = () => reject(req.error);
    });
  };
  P.scanPage = async function (key, worldId, options) {
    const p = options || {}, limit = Math.min(50, p.limit || 50), offset = p.offset || 0;
    const store = this.db.transaction(key).objectStore(key);
    const index = p.index || "byWorld", bound = p.range || worldId;
    const result = await new Promise((resolve, reject) => {
      let count = 0, previous, rank = 0; const rows = [];
      const source = store.index(index);
      const accept = (value) => {
        let r = plain(value);
        if (!p.filter || p.filter(r)) {
          if (p.metric) { if (!count || previous !== r[p.metric]) rank = count + 1; previous = r[p.metric]; r = { ...r, rank }; }
          if (count >= offset && rows.length < limit) rows.push(r); count++;
        }
      };
      const finish = () => resolve({ rows, total: count, more: count > offset + limit, offset });
      // These compound indexes have a unique final ID. Bounded blocks avoid one
      // browser event per historical row without loading the complete archive.
      if (["byWtr", "byTf", "byLegacy", "byDisplay", "byGradedDisplay"].includes(index) && !p.reverse) {
        const block = (keyRange) => {
          const req = source.getAll(keyRange, 256); req.onerror = () => reject(req.error);
          req.onsuccess = () => { const values = req.result; values.forEach(accept); if (values.length < 256) return finish();
            const last = values.at(-1), key = source.keyPath.map((part) => last[part]);
            block(window.IDBKeyRange.bound(key, bound.upper, true, bound.upperOpen)); };
        }; block(bound); return;
      }
      const req = source.openCursor(bound, p.reverse ? "prev" : "next");
      req.onerror = () => reject(req.error);
      req.onsuccess = () => {
        const c = req.result; if (!c) return finish(); accept(c.value); c.continue();
      };
    });
    if (result.total && offset >= result.total) return this.scanPage(key, worldId, { ...p, offset: Math.floor((result.total - 1) / limit) * limit });
    return result;
  };
  P.historyPage = function (world, prefs, offset, extra) {
    const e = extra || {};
    return this.scanPage("occurrences", world.id, { index: e.raceId ? "byRace" : e.trackId ? "byTrack" : "byGradedDisplay",
      range: range(e.raceId ? [world.id, e.raceId] : e.trackId ? [world.id, e.trackId] : [world.id, 1]),
      reverse: !!(e.raceId || e.trackId), offset,
      filter: (r) => r.raceClass !== "op" && O.raceMatches(r, prefs, world.lastCompletedTurn) && (!e.g1 || r.raceClass === "g1") });
  };
  P.queryHonorHistory = function (worldId, key, prefs = {}) {
    const year = Number(prefs.year), bounds = window.IDBKeyRange;
    const index = prefs.roundId ? 'byRound' : prefs.scope ? 'byScopeYear' : 'byYear';
    const base = prefs.scope ? [worldId, prefs.scope] : [worldId];
    const range = prefs.roundId ? bounds.only([worldId, prefs.roundId]) : bounds.bound([...base, year || 1], [...base, year || Number.MAX_SAFE_INTEGER]);
    return this.scanPage(key, worldId, { index, range, reverse: !prefs.roundId, offset: prefs.offset || 0, limit: 50 });
  };
  P.board = async function (world, kind, prefs, offset, expanded) {
    const limit = expanded ? 50 : 10;
    if (["history", "tfHistory", "legacy"].includes(kind)) return this.scanPage("ratings", world.id, { index: kind === "tfHistory" ? "byTf" : kind === "legacy" ? "byLegacy" : "byWtr", range: range([world.id]), offset, limit, metric: kind === "tfHistory" ? "tf" : kind === "legacy" ? "legacyAutomatic" : "wtr",
      filter: (r) => (kind === "tfHistory" ? r.tf : kind === "legacy" ? r.legacyAutomatic : r.wtr) != null && O.horseMatches(kind === "tfHistory" ? { ...r, wtr:r.tf } : r, prefs) });
    let rows = world.horses.map((h) => O.publicHorse(world, h, kind === "lifetime"));
    if (kind === "lifetime" && prefs.minimum !== "" && prefs.minimum != null) {
      const highest = await this.highestRatings(world.id);
      rows.forEach((r) => { const old = highest.get(r.horseId); r.bestWtr = r.wtr == null ? old ?? null : old == null ? r.wtr : Math.max(old, r.wtr); });
    }
    rows = rows.filter((r) => ["current", "tf"].includes(kind) ? r.status === "active" && (kind === "tf" ? r.tf : r.wtr) != null : r.starts > 0 || r.prize > 0)
      .filter((r) => O.horseMatches(kind === "tf" ? { ...r, wtr:r.tf } : kind === "lifetime" && Object.hasOwn(r, "bestWtr") ? { ...r, wtr: r.bestWtr } : r, prefs));
    rows = O.ranked(rows, kind === "current" ? "wtr" : kind === "tf" ? "tf" : "prize");
    const start = rows.length && offset >= rows.length ? Math.floor((rows.length - 1) / limit) * limit : offset;
    return { rows: rows.slice(start, start + limit), total: rows.length, offset: start, more: rows.length > start + limit };
  };
  P.highestRatings = async function (worldId) {
    const source = this.db.transaction("ratings").objectStore("ratings").index("byWtr"), result = new Map();
    return new Promise((resolve, reject) => {
      const upper = [worldId, []];
      const block = (bound) => { const req = source.getAll(bound, 256); req.onerror = () => reject(req.error);
        req.onsuccess = () => { const rows = req.result; for (const r of rows) if (r.wtr != null && !result.has(r.horseId)) result.set(r.horseId, r.wtr);
          if (rows.length < 256) return resolve(result); const last = rows.at(-1);
          block(window.IDBKeyRange.bound(source.keyPath.map((k) => last[k]), upper, true)); };
      }; block(range([worldId]));
    });
  };
  P.bestWtr = async function (worldId, horseId) {
    const rows = await this.query("ratings", worldId, { horseId, limit: Number.MAX_SAFE_INTEGER });
    const values = rows.rows.map((r) => r.wtr).filter((v) => v != null); return values.length ? Math.max(...values) : null;
  };
  P.scoreOutput = async function (world, occurrenceId, values, reset) {
    const occurrence = await this.get("occurrences", world.id, occurrenceId);
    if (!occurrence || occurrence.raceClass === "op" || occurrence.status !== "completed") throw new Error("该届赛事没有可评分的成绩。");
    const all = (await this.query("performances", world.id, { occurrenceId, limit: Number.MAX_SAFE_INTEGER })).rows;
    for (const id of Object.keys(values)) if (!all.some((p) => p.id === id)) throw new Error("评分不属于当前赛事。");
    const horseIds = [...new Set(all.filter((p) => reset || Object.hasOwn(values, p.id)).map((p) => p.horseId))];
    const rows = await Promise.all(horseIds.map((horseId) => this.query("performances", world.id, { horseId, year: occurrence.year, limit: Number.MAX_SAFE_INTEGER })));
    const archives = occurrence.year === W.date(world.turn).year ? [] : await Promise.all(horseIds.map((h) => this.get("ratings", world.id, `${occurrence.year}:${h}`)));
    const draft=await this.get('scoreDrafts',world.id,occurrenceId);
    const out=O.raceScores(world, occurrence, all, values, rows.flatMap((r) => r.rows), archives, reset);
    if(reset)out.occurrences[0].wtrBenchmark=null;
    else if(draft?.benchmarkId && draft.benchmarkScore!=null)out.occurrences[0].wtrBenchmark={horseId:draft.benchmarkId,score:draft.benchmarkScore,scaleOffset:draft.scaleOffset??occurrence.scaleOffset,ratingVersion:2};
    return out;
  };
  P.draftOutput = async function (world, occurrenceId, values, metadata) {
    const occurrence = await this.get("occurrences", world.id, occurrenceId);
    if (!occurrence || occurrence.raceClass === "op" || occurrence.status !== "completed") throw new Error("没有对应的已完成比赛。");
    const old = await this.get("scoreDrafts", world.id, occurrenceId);
    if (metadata?.benchmarkScore != null) O.score(metadata.benchmarkScore);
    for (const v of Object.values(metadata?.recommendations || {})) O.score(v);
    for (const [id, v] of Object.entries(values)) {
      O.score(v); const p = await this.get("performances", world.id, id);
      if (!p || p.occurrenceId !== occurrenceId || p.retired) throw new Error("评分草稿对象无效。");
    }
    return W.mutate(world, (w, out) => { out.scoreDrafts = [{ id: occurrenceId, year: occurrence.year, turn: w.turn,
      ...old, ...metadata, values: { ...(old || {}).values, ...values }, touched: metadata?.touched || { ...old?.touched, ...Object.fromEntries(Object.keys(values).map(id=>[id,true])) }, savedAt: Date.now() }]; });
  };
  P.recommendOutput = async function(world, occurrenceId, benchmarkId, value, options) {
    const occurrence=await this.get('occurrences',world.id,occurrenceId);
    if(!occurrence || occurrence.raceClass==='op' || occurrence.status!=='completed') throw new Error('仅可为已完成重赏生成推荐。');
    const rows=(await this.query('performances',world.id,{occurrenceId,limit:Number.MAX_SAFE_INTEGER})).rows;
    const old=await this.get('scoreDrafts',world.id,occurrenceId), S=ns.ChairmanRatings, opts=options||{};
    const anchor=rows.find(p=>p.horseId===(benchmarkId||occurrence.tfBenchmarkId)&&!p.retired) || rows.find(p=>p.rank===1);
    if(benchmarkId && !rows.some(p=>p.horseId===benchmarkId && !p.retired))throw new Error('基准马不属于本场完赛马。');
    if(!anchor)throw new Error('没有可用的完赛基准马。');
    const scaleOffset=occurrence.scaleOffset??S.getRatingScaleOffset(world.ratingSeed??world.seed,occurrenceId);
    const benchmarkScore=opts.useTf ? S.integer(anchor.tf)-scaleOffset : O.score(value);
    const recommendations=S.buildWtrRecommendations(occurrence.race,rows,anchor.horseId,benchmarkScore), values={}, touched=opts.replace ? {} : {...old?.touched};
    for(const p of rows) if(Object.hasOwn(recommendations,p.id) && (opts.replace || !touched[p.id])) {
      if(!opts.replace && p.manualRating!=null && !Object.hasOwn(old?.values||{},p.id)) {touched[p.id]=true;continue;}
      values[p.id]=String(recommendations[p.id]);
    }
    const out=await this.draftOutput(world,occurrenceId,values,{benchmarkId:anchor.horseId,benchmarkScore,scaleOffset,recommendations,touched,ratingVersion:S.VERSION});
    out.occurrences.push({...occurrence,scaleOffset}); return out;
  };
  P.visibilityOutput = async function (world, ids, hidden) {
    const rows = await Promise.all(ids.map((id) => this.get("occurrences", world.id, id)));
    if (rows.some((r) => !r)) throw new Error("比赛记录不存在。");
    return W.mutate(world, (w, out) => { out.occurrences = rows.map((r) => ({ ...r, hidden: !!hidden })); });
  };
  P.stats = async function (worldId) {
    const stores = ["horses", "occurrences", "performances", "ratings", "awards"], tx = this.db.transaction(stores);
    return Object.fromEntries(await Promise.all(stores.map((key) => new Promise((resolve, reject) => {
      const req = tx.objectStore(key).index("byWorld").count(worldId); req.onsuccess = () => resolve([key, req.result]); req.onerror = () => reject(req.error);
    }))));
  };
  // Derived display summaries may be missing in an old snapshot or inverse journal.
  P.repairOffice = async function (worldId) {
    const tx = this.db.transaction(["occurrences", "performances", "ratings"], "readwrite");
    const done = new Promise((resolve, reject) => { tx.oncomplete = resolve; tx.onabort = () => reject(tx.error); tx.onerror = () => {}; });
    const counts = new Map(), regions = new Map();
    const p = tx.objectStore("performances").index("byWorld").openCursor(worldId);
    p.onsuccess = () => {
      const c = p.result;
      if (c) { const r = c.value, n = counts.get(r.occurrenceId) || [0, 0]; if (!r.retired) { n[0]++; if (r.manualRating != null) n[1]++; } counts.set(r.occurrenceId, n);
        const key = `${r.year}:${r.horseId}`; if (r.homeRegion && (!regions.has(key) || regions.get(key).turn < r.turn)) regions.set(key, r); c.continue();
      } else for (const key of ["occurrences", "ratings"]) {
        const request = tx.objectStore(key).index("byWorld").openCursor(worldId);
        request.onsuccess = () => { const item = request.result; if (!item) return; const r = item.value;
          if (key === "occurrences") { const n = counts.get(r.id) || [0, 0]; r.scoring = !n[1] ? "none" : n[0] === n[1] ? "all" : "partial"; }
          else if (!r.homeRegion || r.homeRegion === "未记录") r.homeRegion = (regions.get(`${r.year}:${r.horseId}`) || {}).homeRegion || "未记录";
          item.update(ns.ChairmanStorage.indexed(key, r)); item.continue(); };
      }
    }; await done;
  };
  for (const method of ["restore", "importWorld"]) {
    const original = P[method];
    P[method] = async function (...args) {
      const oldImport = method === "importWorld" && (args[0].version === 1 || args[0].world.officeVersion !== 2);
      const world = await original.apply(this, args);
      if (oldImport || world.officeVersion !== 2) {
        await this.repairOffice(world.id);
        // A legacy inverse journal needs this once; current snapshots already
        // restore their derived rows together with their authoritative records.
        const tx = this.db.transaction("worlds", "readwrite");
        await new Promise((resolve, reject) => {
          const request = tx.objectStore("worlds").get(world.id);
          request.onsuccess = () => tx.objectStore("worlds").put({ ...request.result, officeVersion: 2 });
          tx.oncomplete = resolve; tx.onabort = () => reject(tx.error); tx.onerror = () => {};
        }); world.officeVersion = 2;
      }
      return world;
    };
  }
})();
