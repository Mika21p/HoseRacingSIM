(function () {
  'use strict';
  const ns = window.Keiba;
  let library, libraryRevision = -1;
  const clone = value => JSON.parse(JSON.stringify(value));
  function getLibrary(options = {}) {
    const revision = options.includeHall === false ? -1 : ns.HallOfFame?.revision || 0;
    if (!library || libraryRevision !== revision) {
      const records = [...ns.BloodlineCatalog.records];
      if (options.includeHall !== false) {
        const known = new Set(records.map(r => r.id));
        records.push(...(ns.HallOfFame?.bloodlineRecords?.() || []).filter(r => !known.has(r.id)));
      }
      library = ns.BloodlineSystem.createLibrary(records, ns.BloodlineCatalog.nicks);
      libraryRevision = revision;
    }
    return library;
  }
  function parents(gender, options) { return getLibrary(options).records.filter(r => r.core && r.gender === gender); }
  function pair(fatherId, motherId, mode = 'normal', options) { return ns.BloodlineSystem.createPair(getLibrary(options), fatherId, motherId, mode); }
  function randomPair() {
    const fathers = parents('牡马'), mothers = parents('牝马');
    // Rejection sampling is uniform over legal pairs, without rewarding particular theories.
    for (let i = 0; i < 1000; i++) {
      const father = ns.Random.pickOne(fathers), mother = ns.Random.pickOne(mothers);
      if (pair(father.id, mother.id).preview.legal) return [father.id, mother.id];
    }
    const legal = [];
    for (const f of fathers) for (const m of mothers) if (pair(f.id, m.id).preview.legal) legal.push([f.id, m.id]);
    if (!legal.length) throw new Error('暂无合法配合。');
    return ns.Random.pickOne(legal);
  }
  function generate(options) {
    const mode = ['legend', 'roguelike'].includes(options.gameMode) ? options.gameMode : 'normal';
    const includeHall = mode !== 'roguelike' || !!options.includeHall;
    const compiled = pair(options.sireId, options.damId, mode, { includeHall });
    const horse = compiled.generate({ name: options.name, seed: options.seed, strengthProfile: options.strengthProfile,
      childId: window.crypto?.randomUUID?.() || `career-${Date.now()}-${Math.random().toString(36).slice(2)}` });
    const lines = new Map(ns.BloodlineCatalog.lines.map(l => [l.id, l.label]));
    const libraryForBirth = getLibrary({ includeHall });
    horse.pedigree.ancestors = horse.pedigree.ancestors.map(a => {
      const ancestor = libraryForBirth.get(a.id);
      return { ...a, lineLabel: lines.get(a.lineId) || '未知', factors: clone(ancestor?.genetics.factors || []),
        gender: ancestor?.gender || null, fatherId: ancestor?.fatherId || null, motherId: ancestor?.motherId || null,
        genetics: ancestor ? clone(ancestor.genetics) : null };
    });
    horse.pedigree.ancestorRecords = horse.pedigree.ancestors.filter(a => a.id && a.genetics).map(a => ({
      id: a.id, name: a.name, gender: a.gender, fatherId: a.fatherId, motherId: a.motherId, genetics: clone(a.genetics)
    }));
    horse.pedigree.commonAncestors = clone(compiled.preview.commonAncestors);
    horse.pedigree.directionWeights = clone(compiled.preview.directionWeights);
    horse.gameMode = mode;
    return horse;
  }
  // Only ancestor records enter this projection; never inspect the child's hidden traits.
  function routeSummary(pedigree) {
    const labels = { burst: '瞬发', sustained: '持久', attrition: '消耗' };
    const distance = d => !d ? '距离未知' : d.core <= 1300 ? '短途' : d.core <= 1800 ? '英里' : d.core <= 2200 ? '中距离' : d.core <= 2600 ? '中长距离' : d.core <= 3200 ? '长距离' : '超长距离';
    const parents = (pedigree?.parents || []).map((p, i) => {
      const g = p.genetics || {}, s = g.surfaceGrades || {}, rank = { A: 3, B: 2, C: 1, G: 0 };
      const surface = s.grass == null || s.dirt == null ? '场地未知' : rank[s.grass] === rank[s.dirt] ? '草泥兼用倾向' : rank[s.grass] > rank[s.dirt] ? '草地倾向' : '泥地倾向';
      const track = g.trackAptitudes || {}, values = Object.values(track), top = values.includes('◎') ? '◎' : '○';
      const directions = Object.keys(labels).filter(k => track[k] === top);
      return { name: p.name || '未知', relation: i ? '母马' : '父马', line: pedigree.ancestors?.find(a => a.path === (i ? '母' : '父'))?.lineLabel || '未知', surface, distance: distance(g.distance), direction: directions.length === 3 ? '均衡' : directions.map(k => labels[k]).join('／') || '方向未知' };
    });
    const lines = [], warnings = [];
    if (parents.length === 2) {
      const [a, b] = parents;
      lines.push(a.surface === b.surface && a.surface !== '场地未知' ? `父母均为${a.surface}，场地路线依据较一致。` : '父母场地路线不同或资料不全，需结合评语判断，不能据此认定后代兼用。');
      lines.push(a.distance === b.distance && a.distance !== '距离未知' ? `父母均偏${a.distance}，可优先关注这一距离路线。` : `父母距离方向为${a.distance}／${b.distance}，后代可能偏向其中一侧。`);
      lines.push(a.direction === b.direction && !['均衡', '方向未知'].includes(a.direction) ? `双方支持${a.direction}方向，更容易延续该特色。` : `父母方向为${a.direction}／${b.direction}，可能兼顾，也可能偏向其中一侧。`);
    }
    if (['高', '中', '低'].includes(pedigree?.risk?.level)) warnings.push(`亲缘风险${pedigree.risk.level}，需留意气性。`);
    if (pedigree?.risk?.incomplete) warnings.push('部分祖先资料未知，无法完整判断亲缘与血统多样性。');
    return { parents, broodmareSire: pedigree?.ancestors?.find(a => a.path === '母父')?.name || '未知', lines, warnings,
      theories: (pedigree?.theories || []).filter(t => t.id !== 'factor').map(t => ({ id: t.id, label: t.label })) };
  }
  ns.CareerBloodline = { getLibrary, parents, pair, randomPair, generate, routeSummary };
})();
