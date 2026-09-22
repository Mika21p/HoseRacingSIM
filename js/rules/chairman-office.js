(function () {
  "use strict";
  const ns = window.Keiba, W = ns.ChairmanRules;
  const categories = ["短途", "英里", "中距离", "中长距离", "长距离", "超长距离"];
  const classOrder = { g1: 0, g2: 1, g3: 2, op: 3 };
  const assert = (ok, message) => { if (!ok) throw new Error(message); };
  const score = (v) => ns.ChairmanRatings.score(v);
  const matches = (selected, value) => !selected || !selected.length || (Array.isArray(selected) ? selected.includes(String(value)) : String(selected) === String(value));
  function horseMatches(h, p) {
    return String(h.horseName || h.name).includes(p.search || "") && matches(p.age, h.age >= 4 ? "4+" : h.age)
      && matches(p.gender, h.gender) && (matches(p.region, h.homeRegionId || h.homeRegion || "未记录") || matches(p.region,h.homeRegion))
      && matches(p.status, h.status) && matches(p.origin, h.origin)
      && (!p.honor || (p.honor === 'local' ? h.localAwards > 0 : p.honor === 'central' ? h.centralAwards > 0 : p.honor === 'hall' ? !!h.inducted : false))
      && (!p.year || h.year === Number(p.year)) && (p.minimum === "" || p.minimum == null || h.wtr != null && h.wtr >= Number(p.minimum));
  }
  function raceMatches(row, p, lastTurn) {
    const r = row.race || row;
    return (row.name || r.name).includes(p.search || "") && (matches(p.region, r.regionId || r.surfaceRegion || r.region) || matches(p.region,r.surfaceRegion || r.region))
      && matches(p.surface, r.surface) && matches(p.category, W.category(r.distance)) && matches(p.raceClass, r.raceClass)
      && (!p.distance || r.distance === Number(p.distance)) && matches(p.ageRule, r.ageRule) && matches(p.sexRule, r.sexRule)
      && (!p.month || r.month === Number(p.month)) && (!p.half || r.half === Number(p.half))
      && (!p.year || row.year === Number(p.year)) && (!p.latest || row.turn === lastTurn)
      && (!p.resultStatus || row.status === p.resultStatus) && matches(p.scoring, row.scoring || "none")
      && (p.hidden === "all" || p.hidden === "only" ? p.hidden !== "only" || !!row.hidden : !row.hidden);
  }
  function publicHorse(world, h, lifetime) {
    const s = lifetime ? h.lifetime : h.annual;
    return { id: h.id, horseId: h.id, horseName: h.name, age: W.ageOf(world, h), gender: h.gender, homeRegion: h.homeRegion, ...(world.worldSystemVersion===2?{homeRegionId:h.homeRegionId}:{}),
      status: h.status, origin: h.origin, year: W.date(world.turn).year, starts: s.starts, wins: s.wins, g1: s.g1,
      prize: s.prize, wtr: W.rating(h), tf: h.annual.tf, manual: h.annual.manual, suggested: h.annual.suggested };
  }
  function ranked(rows, metric) {
    rows.sort((a, b) => b[metric] - a[metric] || b.prize - a.prize || String(a.id).localeCompare(String(b.id)));
    let rank = 0, previous;
    return rows.map((r, i) => { if (i === 0 || r[metric] !== previous) rank = i + 1; previous = r[metric]; return { ...r, rank }; });
  }
  function revision(out, kind, row, before, after) {
    (out.revisions || (out.revisions = [])).push({ id: `${out.world.revision}:review:${out.revisions.length}`, year: row.year,
      turn: out.world.turn, horseId: row.horseId, targetId: row.id, kind, before, after, changedAt: Date.now() });
  }
  function annualScore(world, horseId, year, value, archived) {
    const n = score(value), current = W.date(world.turn).year;
    return W.mutate(world, (w, out) => {
      const h = w.horses.find((v) => v.id === horseId); assert(h, "马匹不存在。");
      assert(h.status !== "juvenile", "幼驹尚未出道，不能赋予年度竞赛评分。");
      assert(year === current || archived && archived.year === year && archived.horseId === horseId, "没有对应年度档案。");
      const row = year === current ? { ...h.annual, id: `${year}:${horseId}`, horseId } : { ...archived };
      revision(out, "annual", row, row.manual, n);
      row.manual = n; row.wtr = n ?? row.suggested;
      if (year === current) h.annual.manual = n;
      else { out.ratings.push(row); if (year === current - 1) h.previousWtr = row.wtr; ns.ChairmanBreeding?.recordRating(h, year, row.wtr, row.tf); }
    });
  }
  function raceScores(world, occurrence, performances, values, yearRows, archives, reset) {
    assert(["g1","g2","g3"].includes(occurrence.raceClass), "普通赛不开放人工评分。");
    return W.mutate(world, (w, out) => {
      const changed = new Map();
      for (const p of performances) {
        if (!reset && !Object.hasOwn(values, p.id)) continue;
        const n = reset ? null : score(values[p.id]); assert(!p.retired || n === null, "退赛不接受评分。");
        const row = { ...p, manualRating: n }; changed.set(p.id, row); out.performances.push(row);
        if (p.manualRating !== n) revision(out, "event", p, p.manualRating, n);
      }
      for (const horseId of new Set([...changed.values()].map((p) => p.horseId))) {
        const h = w.horses.find((v) => v.id === horseId); assert(h, "马匹不存在。");
        const rows = yearRows.filter((p) => p.horseId === horseId && p.year === occurrence.year).map((p) => changed.get(p.id) || p);
        ns.ChairmanRatings.applyManualYear(w,h,occurrence.year,rows,archives.find(a=>a.horseId===horseId && a.year===occurrence.year),out);
      }
      const final = performances.map((p) => changed.get(p.id) || p).filter((p) => !p.retired);
      const filled = final.filter((p) => p.manualRating != null).length;
      out.occurrences.push({ ...occurrence, scoring: !filled ? "none" : filled === final.length ? "all" : "partial" });
      out.deletes = [{ store: "scoreDrafts", id: occurrence.id }];
    });
  }
  ns.ChairmanOffice = { categories, classOrder, score, matches, horseMatches, raceMatches, publicHorse, ranked, annualScore, raceScores };
})();
