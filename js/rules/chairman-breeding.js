(function () {
  "use strict";
  const ns = window.Keiba, R = ns.Random, activeRandom = new WeakSet();
  const W = () => ns.ChairmanRules;
  const clone = (x) => x === undefined ? undefined : JSON.parse(JSON.stringify(x));
  const year = (w) => W().date(w.turn).year;
  const assert = (ok, message) => { if (!ok) throw new Error(message); };
  const all = (w) => [...w.horses, ...(w.pedigrees || [])];
  const map = (w) => new Map(all(w).map((h) => [h.id, h]));
  const get = (w, id) => w.horses.find((h) => h.id === id) || (w.pedigrees || []).find((h) => h.id === id);
  const templates = w => ns.ChairmanEditor?.staticTemplates(w) || ns.ChairmanPedigrees?.records || [];
  function seeded(w, action) {
    if (activeRandom.has(w)) return action();
    const random = R.seeded(w.breeding.rngState); activeRandom.add(w);
    try { return R.withSource(random, action); }
    finally { w.breeding.rngState = random.state(); activeRandom.delete(w); }
  }
  function grade(value) { return value >= 90 ? "顶级" : value >= 75 ? "优秀" : value >= 60 ? "良好" : value >= 40 ? "普通" : "较低"; }
  function recordRating(h, y, value, tf) {
    if (!h.breeding) return;
    (h.breeding.yearWtr ||= {})[y] = value;
    const values = Object.values(h.breeding.yearWtr).filter((v) => v != null && Number.isFinite(v));
    h.breeding.bestWtr = values.length ? Math.max(...values) : null;
    (h.breeding.evaluationByYear ||= {})[y] = value ?? (tf == null ? null : tf - 5);
    const evaluation = Object.values(h.breeding.evaluationByYear).filter(v=>v!=null && Number.isFinite(v));
    h.breeding.bestEvaluation = evaluation.length ? Math.max(...evaluation) : null;
  }
  function initialize(w, h) {
    if (!w.breeding || h.breeding) return;
    seeded(w, () => {
      const p = ((get(w, h.fatherId)?.breeding?.strength ?? 50) + (get(w, h.motherId)?.breeding?.strength ?? 50)) / 2;
      const a = R.clamp(1 + 99 * (h.strength - 62) / 38, 1, 100);
      const strength = h.breedingStrength ?? Math.round(.7 * R.roll(100) + .2 * p + .1 * a);
      assert(Number.isInteger(strength) && strength >= 1 && strength <= 100, "配种实力须为1～100的整数。");
      h.breeding = { strength, status: "none", everActive: false, pinned: false, joinedYear: null, championYears: [] };
      delete h.breedingStrength;
    });
  }
  function ancestors(w, id, depth = Infinity, byId = map(w)) {
    const result = new Set(); let level = [id];
    for (let n = 0; n < depth && level.length; n++) {
      const next = [];
      for (const key of level) for (const parent of [byId.get(key)?.fatherId, byId.get(key)?.motherId]) {
        if (parent && !result.has(parent)) { result.add(parent); next.push(parent); }
      }
      level = next;
    }
    return result;
  }
  function related(w, father, mother, byId = map(w)) {
    if (father.id === mother.id || ancestors(w, father.id, Infinity, byId).has(mother.id) || ancestors(w, mother.id, Infinity, byId).has(father.id)) return true;
    const fa = ancestors(w, father.id, 2, byId), ma = ancestors(w, mother.id, 2, byId);
    return [...fa].some((id) => ma.has(id));
  }
  function available(w, h) {
    const age = year(w) - h.birthYear;
    return h.status === "retired" && h.breeding && h.breeding.status !== "retired" && age >= 3
      && age < (h.gender === "牝马" ? 22 : 25) && ["牡马", "牝马"].includes(h.gender);
  }
  function legalPair(w, fatherId, motherId, byId = map(w)) {
    const f = byId.get(fatherId), m = byId.get(motherId);
    assert(f?.gender === "牡马" && m?.gender === "牝马", "请选择牡马父本和牝马母本。");
    assert(available(w, f) && available(w, m), "父母须已竞赛退役、年满三岁且未繁殖引退或超过年龄上限。");
    assert(!related(w, f, m, byId), "此配对具有禁止的近亲关系，请更换父本或母本。");
    return [f, m];
  }
  function quotas(w) {
    if (w.worldSystemVersion === 2) return Object.fromEntries(w.regions.filter(r=>!r.disabled&&r.autoPopulate).map(r=>[r.name,r.annualTarget]));
    const homes = W().populationRegions(w), total = w.settings.annualNewHorses;
    return Object.fromEntries(homes.map((name, i) => [name, Math.floor(total / homes.length) + (i < total % homes.length ? 1 : 0)]));
  }
  function percentile(rows, value) {
    if (value == null || !rows.length) return 0;
    return 100 * (rows.filter((v) => v < value).length + .5 * rows.filter((v) => v === value).length) / rows.length;
  }
  function reputations(w) {
    const horses = w.horses.filter((h) => h.lifetime.starts), candidates = all(w).filter((h) => h.breeding);
    const top = (h) => Math.max(h.breeding?.bestEvaluation ?? h.breeding?.bestWtr ?? -Infinity, W().rating(h) ?? (h.annual.tf == null ? -Infinity : h.annual.tf - 5), h.previousWtr ?? (h.previousTf == null ? -Infinity : h.previousTf - 5));
    const ratings = horses.map(top).filter(Number.isFinite), g1s = horses.map((h) => h.lifetime.g1), prizes = horses.map((h) => h.lifetime.prize);
    const children = new Map();
    for (const h of horses) for (const id of [h.fatherId, h.motherId]) if (id) { if (!children.has(id)) children.set(id, []); children.get(id).push(h); }
    return new Map(candidates.map((h) => {
      const own = h.lifetime?.starts ? (percentile(ratings, top(h)) + percentile(g1s, h.lifetime.g1) + percentile(prizes, h.lifetime.prize)) / 3 : 50;
      const kids = children.get(h.id) || [], n = kids.length;
      const score = n ? .7 * kids.reduce((s, k) => s + percentile(ratings, top(k)), 0) / n + 30 * kids.filter((k) => k.lifetime.wins).length / n : 50;
      return [h.id, own * 10 / (n + 10) + score * n / (n + 10)];
    }));
  }
  function choose(items, scores, weighted) { return weighted ? R.weightedPick(items, (h) => 1 + (scores.get(h.id) || 0) / 20) : R.pickOne(items); }
  function selectBreeders(w, natural = false) {
    return seeded(w, () => {
      const rows = all(w).filter((h) => h.breeding), scores = reputations(w), q = quotas(w);
      for (const h of rows) {
        const b = h.breeding, age = year(w) - h.birthYear;
        if (b.everActive && b.status !== "retired" && (age >= (h.gender === "牝马" ? 22 : 25)
          || natural && b.joinedYear < year(w) && R.roll(100) <= 1 + Math.floor(age / 10))) { b.status = "retired"; b.pinned = false; b.retiredYear = year(w); }
        else if (available(w, h)) b.status = "candidate";
      }
      for (const region of W().regionNames(w)) for (const gender of ["牡马", "牝马"]) {
        const pool = rows.filter((h) => h.homeRegion === region && h.gender === gender && available(w, h));
        const target = q[region] ? gender === "牡马" ? Math.max(4, Math.ceil(q[region] * .4)) : Math.ceil(q[region] * 1.2) : 0;
        const picked = pool.filter((h) => h.breeding.pinned), rest = pool.filter((h) => !h.breeding.pinned);
        const slots = Math.max(0, target - picked.length);
        for (let i = 0; i < slots && rest.length; i++) { const h = choose(rest, scores, i < Math.ceil(slots * .6)); picked.push(h); rest.splice(rest.indexOf(h), 1); }
        for (const h of picked) { h.breeding.status = "active"; h.breeding.everActive = true; h.breeding.joinedYear ??= year(w); }
      }
    });
  }
  function founder(w, region, gender, template) {
    const existing = template && all(w).find((h) => h.templateId === template.id);
    if (existing?.breeding) {
      assert(available(w, existing), "此资料已作为世界个体存在，当前年龄或状态不允许再次引入。");
      return existing;
    }
    if (existing) assert(year(w) - existing.birthYear >= 3 && year(w) - existing.birthYear < (gender === "牝马" ? 22 : 25), "已有祖先年龄不适合留种，不能通过重新引入恢复年轻。");
    const h = W().addHorse(w, { age: existing ? year(w) - existing.birthYear : R.rollRange(8, 14), homeRegion: region, gender,
      ...(existing ? { id: existing.id, fatherId: existing.fatherId, motherId: existing.motherId, parentsLocked: true } : {}),
      status: "retired", origin: "ai", sourceKind: template ? "historical" : "foundation" });
    w.horses.pop(); w.totalHorses--;
    if (w.honorProfiles) w.honorProfiles = w.honorProfiles.filter(p => p.id !== h.id);
    if (existing) w.pedigrees[w.pedigrees.indexOf(existing)] = h; else (w.pedigrees ||= []).push(h);
    h.name = template ? template.displayName || template.originalName : `外来始祖·${h.name}`;
    h.templateId = template?.id || ""; h.templateVersion = w.breeding.templateVersion; h.historicalBirthYear = template?.birthYear ?? null;
    h.sourceUrl = template?.sourceUrl || "";
    h.aliases = template?.aliases || []; h.originalName = template?.originalName || h.name; h.romanizedName = template?.romanizedName || h.originalName; h.pinyin = template?.pinyin || "";
    h.breeding.strength = template ? R.clamp((template.game?.breedingBase ?? 50) + R.rollRange(-5, 5), 1, 100) : h.breeding.strength;
    h.breeding.status = "active"; h.breeding.everActive = true; h.breeding.joinedYear = year(w);
    if (template?.game?.distance) { h.coreDist = template.game.distance; h.distMin = Math.max(1000, h.coreDist - 400); h.distMax = h.coreDist + 400; }
    if (template?.game?.surface) { const key = template.game.surface === "泥地" ? "dirt" : "grass"; h.surfaceGrades[key] = "A"; }
    if (template?.game?.growthType) { h.growthType = template.game.growthType; const peak = ns.HorseRules.generatePeak(h.growthType); h.peakStart = peak.start; h.peakEnd = peak.end; }
    if(template?.playerModified){if(template.coat)h.coat=template.coat;if(template.game?.distance){h.distMin=Math.max(1,h.coreDist-400);h.distType=W().category(h.coreDist);}if(template.game?.surface==='泥地'&&W().regionBase(w,region)==='欧洲')h.surfaceGrades.dirt='A';}
    return h;
  }
  function attachAncestors(w, roots) {
    const source = new Map((ns.ChairmanEditor?.templates(w)||templates(w)).map((h) => [h.id, h])), placed = new Map(all(w).filter((h) => h.templateId||h.familyTemplateId).map((h) => [h.templateId||h.familyTemplateId, h]));
    function visit(tid, latest, path = new Set()) {
      if (!tid || !source.has(tid)) return "";
      assert(!path.has(tid), "基础资料血统循环。");
      const t = source.get(tid); let h = placed.get(tid);
      if (h?.breeding) { assert(h.birthYear <= latest, "引入的基础马与已有子代年代冲突。"); return h.id; }
      if (h?.parentsLocked) {
        const queue = [[h, latest]], adjusted = new Set();
        while (queue.length) {
          const [node, bound] = queue.pop();
          if (node.breeding) { assert(node.birthYear <= bound, "引入的基础马与已有子代年代冲突。"); continue; }
          if (adjusted.has(node.id) && node.birthYear <= bound) continue;
          node.birthYear = Math.min(node.birthYear, bound); adjusted.add(node.id);
          for (const pid of [node.fatherId, node.motherId]) if (pid) queue.push([get(w, pid), node.birthYear - 3]);
        }
        return h.id;
      }
      if (!h) {
        h = { id: `ancestor-${w.nextId++}`, templateId: t.source==='imported'?'':tid,...(t.source==='imported'?{familyTemplateId:tid,familySourceKey:t.sourceKey}:{}),name: t.displayName || t.name || t.originalName, originalName: t.originalName,
          aliases: t.aliases || [], pinyin: t.pinyin || "", romanizedName: t.romanizedName || t.originalName, gender: t.gender, historicalBirthYear: t.birthYear,
          birthYear: latest, fatherId: "", motherId: "", status: "ancestor", sourceKind: t.source==='imported'?'imported-family':"historical", sourceUrl: t.sourceUrl, templateVersion: w.breeding.templateVersion };
        w.pedigrees.push(h); placed.set(tid, h);
      }
      h.birthYear = Math.min(h.birthYear, latest);
      const next = new Set(path); next.add(tid);
      h.fatherId = visit(t.fatherId, h.birthYear - 3, next); h.motherId = visit(t.motherId, h.birthYear - 3, next);
      h.parentsLocked = true;
      return h.id;
    }
    for (const h of roots) { const t = source.get(h.templateId); if (t && !h.parentsLocked) { h.sourceUrl = t.sourceUrl; h.fatherId = visit(t.fatherId, h.birthYear - 3); h.motherId = visit(t.motherId, h.birthYear - 3); h.parentsLocked = true; } }
  }
  function foundation(w, region, sourceRegion) {
    return seeded(w, () => {
      assert(W().regionNames(w).includes(region), "地区不存在。");
      const source = sourceRegion || W().regionBase(w, region), data = templates(w).filter(t=>!t.disabled), bySource = new Map(data.map((t) => [t.id, t]));
    const existing = all(w).filter((h) => h.templateId), selected = existing.filter((h) => h.breeding).map((h) => h.templateId), used = new Set(existing.map((h) => h.templateId)), roots = [], lineages = new Map();
      function lineage(id) { if (lineages.has(id)) return lineages.get(id); const seen = new Set(), todo = [id]; while (todo.length) { const t = bySource.get(todo.pop()); for (const p of [t?.fatherId, t?.motherId]) if (p && !seen.has(p)) { seen.add(p); todo.push(p); } } lineages.set(id, seen); return seen; }
      for (const gender of ["牡马", "牝马"]) {
        let need = Math.max(0, (gender === "牡马" ? 10 : 30) - all(w).filter((h) => h.homeRegion === region && h.gender === gender && available(w, h)).length);
        const pool = data.filter((t) => t.core && t.gender === gender && (source === "mixed" || t.region === source));
        while (need-- > 0) {
          const legal = pool.filter((t) => !used.has(t.id) && selected.every((id) => !lineage(t.id).has(id) && !lineage(id).has(t.id)));
          // Avoid choosing an old ubiquitous ancestor that excludes most mares.
          // Families and distance groups already represented receive a mild discount.
          const t = legal.length ? R.weightedPick(legal, (candidate) => {
            const conflicts = data.filter((other) => other.core && lineage(other.id).has(candidate.id)).length;
            const sameFamily = roots.filter((h) => bySource.get(h.templateId)?.fatherId === candidate.fatherId).length;
            const sameDistance = roots.filter((h) => bySource.get(h.templateId)?.game?.distance === candidate.game?.distance).length;
            return 1 / (1 + conflicts * 20 + sameFamily * 3 + sameDistance);
          }) : null;
          const h = founder(w, region, gender, t); roots.push(h); if (t) { selected.push(t.id); used.add(t.id); }
        }
      }
      attachAncestors(w, roots); return roots;
    });
  }
  function enable(w, options = {}) {
    assert(!w.breeding, "此世界已启用繁殖。");
    w.pedigrees ||= []; w.breeding = { version: 1, templateVersion: ns.ChairmanPedigrees?.version || 1,
      rngState: ((w.seed ?? w.rngState) ^ 0xb4e31d57) >>> 0, enabledYear: year(w), manual: [], sources: {}, completedYear: year(w) - 1 };
    seeded(w, () => {
      w.horses.forEach((h) => { initialize(w, h); for (const [y, score] of Object.entries(options.ratings?.[h.id] || {})) recordRating(h, y, score && typeof score === "object" ? score.wtr : score, score && typeof score === "object" ? score.tf : null); });
      if (options.foundation !== false) for (const region of W().populationRegions(w)) foundation(w, region);
      if (options.background) {
        const byId = map(w), occupied = new Set();
        for (const h of w.horses) {
          if (h.fatherId || h.motherId) continue;
          const mares = (w.pedigrees || []).filter((m) => m.gender === "牝马" && m.breeding && m.homeRegion === h.homeRegion && m.birthYear <= h.birthYear - 3 && !occupied.has(`${m.id}:${h.birthYear}`));
          const m = mares.length ? R.pickOne(mares) : null;
          const sires = m ? w.pedigrees.filter((f) => f.gender === "牡马" && f.breeding && f.birthYear <= h.birthYear - 3 && !related(w, f, m, byId)) : [];
          if (m && sires.length) { h.fatherId = R.pickOne(sires).id; h.motherId = m.id; h.pedigreeOrigin = "background"; occupied.add(`${m.id}:${h.birthYear}`); delete h.breeding; initialize(w, h); }
        }
      }
      selectBreeders(w);
    });
  }
  function resolveParents(w, value) {
    if (!w.breeding) return value;
    return seeded(w, () => {
      const result = { ...value }, roots = [];
      for (const [key, gender] of [["fatherId", "牡马"], ["motherId", "牝马"]]) if (String(result[key] || "").startsWith("template:")) {
        const tid = result[key].slice(9), t = templates(w).find((h) => h.id === tid && h.core && !h.disabled && h.gender === gender);
        assert(t, "基础父母资料不存在或性别不符。");
        const h = founder(w, value.homeRegion || "日本", gender, t); roots.push(h); result[key] = h.id;
      }
      attachAncestors(w, roots); return result;
    });
  }
  function plan(w) {
    return seeded(w, () => {
      const result = [], occupied = new Set(), quotasByRegion = quotas(w), byId = map(w), scores = reputations(w);
      for (const p of w.breeding.manual) {
        legalPair(w, p.fatherId, p.motherId, byId);
        assert(!occupied.has(p.motherId), "同一母马本年只能安排一次配种。");
        assert(W().regionNames(w).includes(p.homeRegion), "幼驹地区不存在。");
        occupied.add(p.motherId); result.push({ ...p, manual: true });
      }
      for (const [region, q] of Object.entries(quotasByRegion)) {
        let need = Math.max(0, q - result.filter((p) => p.homeRegion === region).length);
        const mares = all(w).filter((h) => available(w, h) && h.gender === "牝马" && h.homeRegion === region && h.breeding.status === "active" && !occupied.has(h.id));
        while (need-- > 0) {
          let m = mares.length ? choose(mares, scores, R.next() < .6) : founder(w, region, "牝马");
          if (mares.includes(m)) mares.splice(mares.indexOf(m), 1); byId.set(m.id, m);
          let sires = all(w).filter((f) => f.gender === "牡马" && f.breeding?.status === "active" && available(w, f) && !related(w, f, m, byId));
          const limited = sires.filter((f) => result.filter((p) => p.fatherId === f.id && p.homeRegion === region).length < Math.max(1, Math.floor(q * .2)));
          if (limited.length) sires = limited;
          if (!sires.length) { const f = founder(w, region, "牡马"); byId.set(f.id, f); sires = [f]; }
          const local = sires.filter((f) => f.homeRegion === region), foreign = sires.filter((f) => f.homeRegion !== region);
          const preferred = R.next() < .8 ? local : foreign;
          const f = choose(preferred.length ? preferred : sires, scores, R.next() < .6);
          result.push({ fatherId: f.id, motherId: m.id, homeRegion: region, owner: m.owner, manual: false }); occupied.add(m.id);
        }
      }
      return result;
    });
  }
  function inherited(w, f, m, homeRegion) {
    const h = ns.HorseRules.generateHorse({ gameMode: "normal", sireId: "random", damId: "random", ...(w.worldSystemVersion === 2 ? {chairmanProfile:ns.ChairmanWorld.profile(w,homeRegion||m.homeRegion)} : {}) });
    delete h.id; delete h.name; delete h.career; delete h.gender;
    h.strength = R.clamp(Math.round(h.strength + (((f?.breeding?.strength ?? 50) + (m?.breeding?.strength ?? 50)) / 2 - 50) / 10), 62, 100);
    inheritAptitudes(h, f, m, w.worldSystemVersion === 2 ? ns.ChairmanWorld.profile(w,homeRegion||m.homeRegion).surfaceWeights : undefined);
    for (const keys of [["distMin", "coreDist", "distMax", "distType"], ["temperamentLabel", "temperament", "heavyType"]]) {
      const roll = R.next(), p = roll < .3 ? f : roll < .6 ? m : null;
      if (p) for (const key of keys) h[key] = clone(p[key]);
    }
    const roll = R.next(), parent = roll < .3 ? f : roll < .6 ? m : null;
    if (parent) {
      h.growthType = parent.growthType;
      const peak = ns.HorseRules.generatePeak(h.growthType); h.peakStart = peak.start; h.peakEnd = peak.end;
    }
    return h;
  }
  function inheritAptitudes(h, father, mother, surfaceWeights) {
    for (const [group, keys] of [['surfaceGrades', ['grass', 'dirt']], ['trackAptitudes', ['burst', 'sustained', 'attrition']]]) {
      for (const key of keys) {
        const roll = R.next(), parent = roll < .4 ? father : roll < .8 ? mother : null;
        if (parent?.[group]?.[key] != null) h[group][key] = parent[group][key];
      }
    }
    h.trackAptitudes = ns.HorseRules.constrainTrackAptitudes(h.trackAptitudes);
    h.surfaceGrades = ns.HorseRules.ensureSurfaceFloor(h.surfaceGrades, [father, mother], surfaceWeights);
    h.surfacePref = ns.HorseRules.deriveSurfacePreference(h.surfaceGrades);
    return h;
  }
  function closeYear(w, out) {
    if (!w.breeding) return null;
    const y = year(w); assert(w.breeding.completedYear < y, "本年度繁殖已经结算。");
    return seeded(w, () => {
      const stats = childStats(w, y), sires = stats.filter((s) => s.gender === "牡马"), highest = Math.max(0, ...sires.map((s) => s.prize));
      out.breedingYears = stats.map((s) => ({ ...s, year: y, id: `${y}:${s.id}`, horseId: s.id, champion: s.gender === "牡马" && Math.abs(s.prize - highest) < 1e-8 && highest > 0 }));
      for (const s of out.breedingYears.filter((s) => s.champion)) get(w, s.horseId).breeding.championYears.push(y);
      const pairs = plan(w), nodes = map(w);
      const locked = pairs.map((p, i) => {
        const f = nodes.get(p.fatherId) || get(w, p.fatherId), m = nodes.get(p.motherId) || get(w, p.motherId);
        return { ...p, id: `${y}:mating:${i}`, year: y, birthYear: y + 1, fatherName: f.name, motherName: m.name,
          fatherSnapshot: geneticSnapshot(f), motherSnapshot: geneticSnapshot(m), offspring: inherited(w, f, m, p.homeRegion), ...(w.worldSystemVersion === 2 ? {homeRegionId:ns.ChairmanWorld.region(w,p.homeRegion).id,generationVersion:ns.ChairmanWorld.region(w,p.homeRegion).generationVersion||1,generationProfile:ns.ChairmanWorld.profile(w,p.homeRegion)} : {}) };
      });
      w.breeding.completedYear = y; w.breeding.manual = [];
      return locked;
    });
  }
  function geneticSnapshot(h) { const keys = ["id", "name", "strength", "surfaceGrades", "trackAptitudes", "surfacePref", "distMin", "coreDist", "distMax", "distType", "growthType", "temperamentLabel", "temperament", "heavyType"]; return { ...Object.fromEntries(keys.map((k) => [k, clone(h[k])])), breeding: { strength: h.breeding.strength } }; }
  function startYear(w, out, locked) {
    if (!w.breeding) return;
    seeded(w, () => {
      const debut = {};
      for (const h of w.horses) if (h.status === "juvenile" && W().ageOf(w, h) >= 2) { h.status = "active"; h.maturity.lastCheckedIndex = ns.TimeRules.toIndex(2, 1, 1); debut[h.homeRegion] = (debut[h.homeRegion] || 0) + 1; }
      out.breedingEvents = [];
      for (const p of locked || []) {
        const h = W().addHorse(w, { ...p.offspring, name: undefined, age: 0, birthYear: year(w), fatherId: p.fatherId, motherId: p.motherId,
          homeRegion: p.homeRegion, homeRegionId:p.homeRegionId, generationProfile:p.generationProfile,generationVersion:p.generationVersion, owner: p.owner || get(w, p.motherId).owner, status: "juvenile", origin: "ai", sourceKind: "bred" });
        // addHorse owns identity and naming, not the intermediate generator object.
        h.name ||= `新生${h.id}`;
        const { offspring, ...event } = p; out.breedingEvents.push({ ...event, horseId: h.id, horseName: h.name });
      }
      selectBreeders(w, true);
      for (const [region, target] of Object.entries(quotas(w))) for (let n = debut[region] || 0; n < target; n++) W().addHorse(w, { age: 2, homeRegion: region, sourceKind: "external" });
    });
  }
  function childStats(w, selectedYear) {
    const byId = map(w), stats = new Map();
    for (const h of w.horses) {
      const values = selectedYear == null ? h.lifetime : h.annual;
      if (!values.starts) continue;
      for (const pid of [h.fatherId, h.motherId]) {
        const parent = byId.get(pid); if (!parent?.breeding) continue;
        if (!stats.has(pid)) stats.set(pid, { id: pid, name: parent.name, gender: parent.gender, homeRegion: parent.homeRegion, prize: 0, starters: 0, winners: 0, g1: 0 });
        const s = stats.get(pid); s.prize += values.prize; s.starters++; s.winners += values.wins > 0 ? 1 : 0; s.g1 += values.g1;
      }
    }
    return [...stats.values()].sort((a, b) => b.prize - a.prize || a.id.localeCompare(b.id));
  }
  function publicHorse(w, h) {
    const b = h.breeding, age = h.birthYear == null ? null : year(w) - h.birthYear;
    return { id: h.id, name: h.name, originalName: h.originalName || h.name, romanizedName: h.romanizedName || h.originalName || h.name, aliases: h.aliases || [], pinyin: h.pinyin || "",
      gender: h.gender, birthYear: h.birthYear, historicalBirthYear: h.historicalBirthYear ?? null, age,
      fatherId: h.fatherId || "", motherId: h.motherId || "", region: h.homeRegion || "", status: h.status,
      source: h.sourceKind || (h.origin === "custom" ? "custom" : "ai"), templateId: h.templateId || "", sourceUrl: h.sourceUrl || "",
      breedingStatus: b?.status || "none", grade: b?.everActive || h.origin === "custom" ? grade(b?.strength ?? 50) : "未公开",
      ...(ns.ChairmanEditor?.enabled(w)?{strength:h.strength}:{}),pinned: !!b?.pinned, championYears: b?.championYears || [], ...((h.origin === "custom" || ns.ChairmanEditor?.enabled(w)) ? { breedingStrength: b?.strength ?? null } : {}) };
  }
  const normalize = (s) => String(s || "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[\s'’._-]/g, "");
  const pinyinCollator = new Intl.Collator("zh-Hans-CN-u-co-pinyin");
  function initial(name) {
    const first = String(name || "").charAt(0);
    if (/^[\u3400-\u9fff]$/.test(first)) {
      const boundaries = "阿八擦搭蛾发噶哈击喀垃妈拿哦啪期然撒塌挖昔压匝", letters = "ABCDEFGHJKLMNOPQRSTWXYZ";
      for (let i = boundaries.length - 1; i >= 0; i--) if (pinyinCollator.compare(first, boundaries[i]) >= 0) return letters[i];
    }
    return normalize(first).toUpperCase();
  }
  function query(w, options = {}) {
    const p = options, byId = map(w), favorite = new Set(w.ui.breedingFavorites || []);
    let rows = p.view === "library" ? templates(w).filter((h) => !p.instantiable || h.core && !h.disabled).map((h) => ({ id: h.id, templateId: h.id, core: !!h.core, name: h.displayName || h.originalName, originalName: h.originalName,
      aliases: h.aliases || [], pinyin: h.pinyin || "", romanizedName: h.romanizedName || h.originalName, birthYear: h.birthYear, historicalBirthYear: h.birthYear, gender: h.gender, region: h.region,
      fatherId: h.fatherId, motherId: h.motherId, regionTags: h.regionTags || [], status: "template", source: "historical", breedingStatus: h.core ? "template" : "ancestor", grade: "未公开", disabled:!!h.disabled, playerModified:!!h.playerModified, sourceUrl: h.sourceUrl }))
      : all(w).map((h) => publicHorse(w, h));
    if(p.view==='library') rows.push(...(ns.ChairmanEditor?.familyTemplates(w)||w.familyTemplates||[]).filter(t=>!p.instantiable||t.core&&!t.disabled).map(t=>({... (ns.ChairmanEditor?.publicTemplate(w,t)||t),templateId:t.id,originalName:t.originalName||t.name,pinyin:t.pinyin||'',romanizedName:t.romanizedName||t.name,aliases:t.aliases||[],source:'imported',status:'template',breedingStatus:'template'})));
    if (p.matingEligible) rows = rows.filter((h) => byId.has(h.id) && available(w, byId.get(h.id)));
    if (p.view === "active" && !p.breedingStatus) rows = rows.filter((h) => h.breedingStatus === "active");
    if (p.view === "candidate") rows = rows.filter((h) => ["candidate", "none"].includes(h.breedingStatus) && available(w, byId.get(h.id)));
    if (p.view === "young") rows = rows.filter((h) => h.status === "juvenile");
    if (p.ancestor) { const ids = descendants(w, p.ancestor, p.relation || "direct"); rows = rows.filter((h) => ids.has(h.id)); }
    rows = rows.filter((h) => (!p.search || [h.name, h.originalName, h.id, h.pinyin, h.romanizedName, ...h.aliases].some((s) => normalize(s).includes(normalize(p.search))))
      && (!p.gender || h.gender === p.gender) && (!p.region || h.region === p.region || h.regionTags?.includes(p.region)) && (!p.source || h.source === p.source)
      && (!p.status || h.status === p.status) && (!p.breedingStatus || p.breedingStatus === "all" || h.breedingStatus === p.breedingStatus) && (!p.grade || h.grade === p.grade)
      && (!p.decade || Math.floor((h.historicalBirthYear ?? h.birthYear) / 10) * 10 === Number(p.decade))
      && (!p.favorites || favorite.has(h.id)) && (!p.recent || (w.ui.breedingRecent || []).includes(h.id))
      && (!p.used || (w.ui.breedingUsed || []).includes(h.id)));
    function letter(h) { const ch = initial(p.alphabet === "pinyin" ? h.pinyin || h.name : h.romanizedName); return /^[A-Z]$/.test(ch) ? ch : /^[0-9]$/.test(ch) ? "0-9" : "其他"; }
    const letters = [...new Set(rows.map(letter))].sort(); if (p.letter) rows = rows.filter((h) => letter(h) === p.letter);
    rows.sort((a, b) => ns.ChairmanEditor?.enabled(w)&&p.sort==="strength"?(b.strength??-Infinity)-(a.strength??-Infinity)||a.id.localeCompare(b.id):ns.ChairmanEditor?.enabled(w)&&p.sort==="breedingStrength"?(b.breedingStrength??-Infinity)-(a.breedingStrength??-Infinity)||a.id.localeCompare(b.id):(p.alphabet === "pinyin" ? pinyinCollator.compare(a.pinyin || a.name, b.pinyin || b.name) : a.romanizedName.localeCompare(b.romanizedName, "en")) || a.id.localeCompare(b.id));
    const limit = Math.min(50, Math.max(1, Number(p.limit) || 50)), offset = Math.min(Math.max(0, Number(p.offset) || 0), Math.max(0, Math.floor((rows.length - 1) / limit) * limit));
    return { rows: rows.slice(offset, offset + limit), total: rows.length, offset, letters, more: offset + limit < rows.length };
  }
  function descendants(w, id, relation) {
    const children = new Map(), rows = all(w);
    for (const h of rows) for (const pid of relation === "paternal" ? [h.fatherId] : relation === "maternal" ? [h.motherId] : [h.fatherId, h.motherId]) {
      if (pid) { if (!children.has(pid)) children.set(pid, []); children.get(pid).push(h.id); }
    }
    const result = new Set(), todo = [...(children.get(id) || [])];
    while (todo.length) { const key = todo.pop(); if (result.has(key)) continue; result.add(key); if (relation !== "direct") todo.push(...(children.get(key) || [])); }
    return result;
  }
  function edit(world, action, value = {}) {
    return W().mutate(world, (w) => {
      if (action === "enable") enable(w, value);
      else {
        assert(w.breeding, "请先启用自动繁殖。");
        seeded(w, () => {
          if (action === "foundation") { foundation(w, value.region, value.source); selectBreeders(w); }
          else if (action === "introduce") { const t = templates(w).find((h) => h.id === value.templateId && h.core && !h.disabled); assert(t, "基础资料不存在。"); const h = founder(w, value.region, t.gender, t); attachAncestors(w, [h]); h.breeding.pinned = true; }
          else if (action === "pin" || action === "retire") {
            const h = get(w, value.id); assert(h?.breeding, "繁殖个体不存在。");
            if (action === "retire") { h.breeding.status = "retired"; h.breeding.pinned = false; h.breeding.retiredYear = year(w); }
            else { assert(available(w, h), "此马不能留种。"); h.breeding.pinned = !h.breeding.pinned; if (h.breeding.pinned) { h.breeding.status = "active"; h.breeding.everActive = true; h.breeding.joinedYear ??= year(w); } }
          } else if (action === "mating") {
            legalPair(w, value.fatherId, value.motherId);
            assert(W().regionNames(w).includes(value.homeRegion), "幼驹地区不存在。");
            w.breeding.manual = w.breeding.manual.filter((p) => p.motherId !== value.motherId);
            w.breeding.manual.push({ fatherId: value.fatherId, motherId: value.motherId, homeRegion: value.homeRegion, owner: String(value.owner || get(w, value.motherId).owner) });
            for (const id of [value.fatherId, value.motherId]) { const h = get(w, id); h.breeding.status = "active"; h.breeding.everActive = true; h.breeding.joinedYear ??= year(w); }
            w.ui.breedingUsed = [...new Set([value.fatherId, value.motherId, ...(w.ui.breedingUsed || [])])].slice(0, 30);
          } else if (action === "cancelMating") w.breeding.manual = w.breeding.manual.filter((p) => p.motherId !== value.id);
          else throw new Error("未知繁殖操作。");
        });
      }
      W().validateWorld(w);
    });
  }
  function validate(w) {
    if (!w.breeding) { assert(!(w.pedigrees || []).length, "未启用繁殖的世界不能含有新增谱系。"); return; }
    assert(Array.isArray(w.pedigrees) && Number.isInteger(w.breeding.enabledYear) && w.breeding.enabledYear <= year(w)
      && Number.isInteger(w.breeding.completedYear) && w.breeding.completedYear < year(w), "繁殖启用或结算年份无效。");
    assert(w.breeding.version === 1 && Number.isInteger(w.breeding.rngState) && w.breeding.rngState >= 0 && w.breeding.rngState <= 0xffffffff, "繁殖规则或随机状态无效。");
    const rows = all(w), byId = map(w); assert(rows.length === byId.size, "谱系与马匹编号重复。");
    const templatesSeen = new Set(), mothers = new Set();
    for (const h of rows) {
      assert(h && typeof h.id === "string" && h.id && typeof h.name === "string" && h.name && Number.isInteger(h.birthYear), "谱系身份或年代无效。");
      assert(["牡马", "牝马", "骟马"].includes(h.gender) && h.birthYear <= year(w), "谱系性别或出生年份无效。");
      const serial = h.id.match(/^(?:horse|ancestor)-(\d+)$/); if (serial) assert(Number(serial[1]) < w.nextId, "谱系编号与后续编号冲突。");
      if (h.templateId) { assert(!templatesSeen.has(h.templateId), "同一基础资料被重复实例化。"); templatesSeen.add(h.templateId); }
      if (h.breeding) assert(Number.isInteger(h.breeding.strength) && h.breeding.strength >= 1 && h.breeding.strength <= 100
        && ["none", "candidate", "active", "retired"].includes(h.breeding.status) && Array.isArray(h.breeding.championYears)
        && typeof h.breeding.everActive === "boolean" && typeof h.breeding.pinned === "boolean"
        && h.breeding.championYears.every((y) => Number.isInteger(y) && y < year(w))
        && new Set(h.breeding.championYears).size === h.breeding.championYears.length
        && Object.values(h.breeding.yearWtr || {}).every((v) => v == null || Number.isFinite(v)), "配种实力或繁殖状态无效。");
      if (h.status === "juvenile") assert(W().ageOf(w, h) < 2 && !h.booked && !h.lifetime.starts && !h.annual.starts
        && [h.annual.tf, h.annual.manual, h.annual.suggested].every((v) => v == null), "幼驹不能报名、拥有赛绩或年度评分。");
      if (h.sourceKind === "bred" && h.motherId) { const key = `${h.motherId}:${h.birthYear}`; assert(!mothers.has(key), "同母同年产驹重复。"); mothers.add(key); }
      for (const [key, gender] of [["fatherId", "牡马"], ["motherId", "牝马"]]) if (h[key]) { const p = byId.get(h[key]); assert(p && p.gender === gender && p.birthYear <= h.birthYear - 2, "血统父母不存在、性别或年代不符。"); }
    }
    for (const h of w.horses) assert(h.breeding, "已启用世界缺少马匹繁殖参数。");
    for (const h of w.pedigrees) { assert(["ancestor", "retired"].includes(h.status), "谱系节点不能作为现役或幼驹。"); if (h.breeding) W().validateHorse(w, h); }
    const visited = new Set(), visiting = new Set();
    function visit(h) { if (visited.has(h.id)) return; assert(!visiting.has(h.id), "血统关系循环。"); visiting.add(h.id); for (const p of [h.fatherId, h.motherId]) if (p) visit(byId.get(p)); visiting.delete(h.id); visited.add(h.id); }
    rows.forEach(visit);
    assert(Array.isArray(w.breeding.manual), "指定配种记录无效。");
    const ms = new Set(); for (const p of w.breeding.manual) { assert(byId.has(p.fatherId) && byId.has(p.motherId) && !ms.has(p.motherId), "指定配种关联无效或重复。"); ms.add(p.motherId); }
  }
  ns.ChairmanBreeding = { inheritAptitudes, all, get, seeded, grade, initial, recordRating, initialize, ancestors, related, available, legalPair, quotas, reputations,
    selectBreeders, founder, foundation, enable, resolveParents, plan, inherited, closeYear, startYear, childStats, publicHorse, query, descendants, edit, validate };
})();
