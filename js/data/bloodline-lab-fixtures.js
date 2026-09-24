(function () {
  'use strict';
  const ns = window.Keiba = window.Keiba || {};
  // 全部为虚构验证数据，不注册到史实库或主席世界。
  const records = [], roots = [];
  function family(id, gender, name, quality, track, surface = 'grass', core = 2000) {
    let serial = 0;
    function node(key, sex, depth) {
      const order = serial++;
      const row = { id: key, name: depth ? `${name}·祖先${order}` : name, gender: sex, fictional: true,
        genetics: { quality, stability: 50, lineId: depth ? `line-${order % 8}` : 'line-main', familyId: `family-${id}`,
          surfaceGrades: { grass: surface === 'grass' ? 'A' : 'C', dirt: surface === 'dirt' ? 'A' : 'C' },
          trackAptitudes: Object.fromEntries(['burst', 'sustained', 'attrition'].map(k => [k, k === track ? '◎' : '△'])),
          distance: { min: core - 400, core, max: core + 400 }, growthType: '普迟', temperamentLabel: '普通', heavyType: '普通',
          factors: depth === 3 ? [] : [{ trait: track, power: 1 }] } };
      records.push(row);
      if (depth < 3) { row.fatherId = key + '-f'; row.motherId = key + '-m'; node(row.fatherId, '牡马', depth + 1); node(row.motherId, '牝马', depth + 1); }
      return row;
    }
    const root = node(id, gender, 0); roots.push(id); return root;
  }
  family('sire-burst', '牡马', '流星之父', 80, 'burst');
  family('sire-burst-low', '牡马', '流星之父·低繁殖素质对照', 20, 'burst');
  family('sire-attrition', '牡马', '赤沙之父', 80, 'attrition', 'dirt', 1800);
  family('mare-sustained', '牝马', '长风之母', 80, 'sustained');
  family('mare-sustained-low', '牝马', '长风之母·低繁殖素质对照', 20, 'sustained');
  family('mare-burst', '牝马', '星河之母', 70, 'burst');
  family('mare-cross', '牝马', '共同祖先示例之母', 70, 'sustained');
  const map = new Map(records.map(r => [r.id, r]));
  // 幼驹视角3×3；与父方重复的更远祖先仍逐一显示，效果按方向封顶。
  map.get('mare-cross-f').fatherId = map.get('sire-burst-f').fatherId;
  records.push({ id: 'mare-unknown', name: '系谱待补之母', gender: '牝马', fictional: true }); roots.push('mare-unknown');
  ns.BloodlineLabFixtures = { records, roots, nicks: [{ sireLine: 'line-main', broodmareSireLine: 'line-1' }] };
})();
