(function () {
  'use strict';
  const ns = window.Keiba = window.Keiba || {};
  if (!ns.ChairmanPedigrees) throw new Error('试赋值需要现有主席系谱库。');
  const records = JSON.parse(JSON.stringify(ns.ChairmanPedigrees.records));
  const byId = new Map(records.map(r => [r.id, r]));
  const id = value => 'jbis-' + value;
  const labels = { burst: '瞬发', sustained: '持久', attrition: '消耗' };
  // 每行：现有编号、父系标签、繁殖素质、主适性、副适性、草泥、距离、成长。
  // 以下全部是可撤回的游戏试赋值，来源页只支持身份、系谱和赛绩，不支持遗传评分。
  const specs = [
    ['0000742976', 'sunday', 92, 'burst', 'sustained', 'grass', 2000, 2400, 3000, '普早'],
    ['0000729458', 'kingmambo', 86, 'burst', 'attrition', 'grass', 1600, 2000, 2400, '普早'],
    ['0000714343', 'sadlers', 94, 'sustained', 'attrition', 'grass', 2000, 2400, 2800, '普早'],
    ['0001111493', 'dubai', 90, 'attrition', 'sustained', 'grass', 1400, 1800, 2400, '早熟'],
    ['0000849372', 'apindy', 88, 'attrition', 'sustained', 'dirt', 1600, 2000, 2400, '普早'],
    ['0000333862', 'sunday', 94, 'burst', 'attrition', 'dual', 1800, 2000, 2400, '普早'],
    ['0000274849', 'tonybin', 82, 'sustained', 'burst', 'grass', 1800, 2200, 2400, '普早'],
    ['0000743110', 'sunday', 86, 'burst', 'sustained', 'grass', 1800, 2200, 2400, '普早'],
    ['0001110862', 'sunday', 76, 'burst', 'sustained', 'grass', 1600, 2400, 2500, '普早'],
    ['0000225908', 'mrprospector', 92, 'sustained', 'attrition', 'grass', 2000, 2400, 2800, '普迟'],
    ['0001037012', 'streetcry', 68, 'attrition', 'burst', 'dirt', 1600, 2000, 2200, '普迟'],
    ['0001127386', 'medaglia', 72, 'attrition', 'sustained', 'dirt', 1600, 1800, 2000, '普早']
  ];
  const assignments = [];
  for (const [key, lineId, quality, main, secondary, surface, min, core, max, growthType] of specs) {
    const row = byId.get(id(key));
    if (!row?.core) throw new Error('试验对象必须来自现有核心库：' + key);
    row.genetics = { lineId, familyId: row.gender === '牝马' ? 'pilot-family-' + key : null,
      quality, stability: 60,
      trackAptitudes: Object.fromEntries(Object.keys(labels).map(k => [k, k === main ? '◎' : k === secondary ? '○' : '△'])),
      surfaceGrades: { grass: surface === 'dirt' ? 'C' : 'A', dirt: surface === 'grass' ? 'C' : 'A' },
      distance: { min, core, max }, growthType, temperamentLabel: '普通', heavyType: '普通',
      factors: [{ trait: main, power: 1 }] };
    assignments.push({ id: row.id, name: row.displayName || row.name, english: row.originalName, role: '可选父母',
      status: '游戏试赋值', sourceUrl: row.profileUrl || `https://www.jbis.or.jp/horse/${key}/`,
      rationale: `${labels[main]}主型、${labels[secondary]}副型，用于验证地区路线差异；稳定度、气性、重场采用统一对照值。`, genetics: row.genetics });
  }
  const ancestors = [
    ['0000161740', 'tonybin', 'sustained'], ['0000293624', 'sunday', 'burst'],
    ['0000336572', 'sadlers', 'sustained'], ['0000347989', 'kingmambo', 'burst'],
    ['0000372664', 'dubai', 'attrition'], ['0000337444', 'mrprospector', 'attrition'],
    ['0000337958', 'apindy', 'attrition'], ['0000339653', 'apindy', 'attrition'],
    ['0000335975', 'mrprospector', 'attrition'], ['0000336395', 'mrprospector', 'sustained'],
    ['0000621983', 'streetcry', 'attrition'], ['0000721553', 'medaglia', 'attrition'],
    ['0000334002', 'northerndancer', 'sustained'], ['0000335154', 'halo', 'burst']
  ];
  for (const [key, lineId, trait] of ancestors) {
    const row = byId.get(id(key));
    if (!row) throw new Error('祖先编号不存在：' + key);
    row.genetics = { lineId, factors: [{ trait, power: 1 }] };
    assignments.push({ id: row.id, name: row.displayName || row.name, english: row.originalName, role: '祖先因子', status: '游戏试赋值',
      sourceUrl: row.profileUrl || `https://www.jbis.or.jp/horse/${key}/`, rationale: '只设置因子与父系标签，其他遗传值保持未知。', genetics: row.genetics });
  }
  // 父系标签仅沿已存在的父链追溯到已赋值节点；不按地区猜测，不补造未知祖先。
  function inheritedLine(row, seen = new Set()) {
    if (!row || seen.has(row.id)) return null;
    if (row.genetics?.lineId) return row.genetics.lineId;
    seen.add(row.id); return inheritedLine(byId.get(row.fatherId), seen);
  }
  for (const row of records) {
    if (!row.genetics) row.genetics = {};
    const line = inheritedLine(row);
    if (line && !row.genetics.lineId) { row.genetics.lineId = line; row.genetics.lineSource = '沿已知父链追溯'; }
  }
  ns.BloodlinePilot = { version: 'historical-pilot-v1', label: '现有种马库 · 试赋值', records,
    roots: specs.map(s => id(s[0])), assignments,
    nicks: [
      { sireLine: 'sunday', broodmareSireLine: 'tonybin' },
      { sireLine: 'kingmambo', broodmareSireLine: 'sunday' },
      { sireLine: 'sadlers', broodmareSireLine: 'sunday' },
      { sireLine: 'apindy', broodmareSireLine: 'medaglia' }
    ],
    scenarios: [
      { label: '母父＋互补：大震撼 × 气槽', fatherId: id('0000742976'), motherId: id('0000274849') },
      { label: '母父＋专精：夏威夷王 × 西沙里奥', fatherId: id('0000729458'), motherId: id('0000743110') },
      { label: '欧洲×日本：伽利略 × 贵妇人', fatherId: id('0000714343'), motherId: id('0001110862') },
      { label: '祖先强化：杜拜威 × 都市海洋', fatherId: id('0001111493'), motherId: id('0000225908') },
      { label: '泥地专精：Tapit × Rachel Alexandra', fatherId: id('0000849372'), motherId: id('0001127386') },
      { label: '跨草泥：周日宁静 × 禅雅塔', fatherId: id('0000333862'), motherId: id('0001037012') },
      { label: '近亲拦截：大震撼 × 贵妇人', fatherId: id('0000742976'), motherId: id('0001110862'), blocked: true },
      { label: '近亲拦截：伽利略 × 都市海洋', fatherId: id('0000714343'), motherId: id('0000225908'), blocked: true }
    ],
    note: '系谱沿用现有史实库；数值、因子、相性组合均为游戏试验设定，不代表已证实的真实遗传规律。禅雅塔的合成场地表现暂映射到现有泥地类别。' };
})();
