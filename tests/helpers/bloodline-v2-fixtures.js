'use strict';
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const root = path.resolve(__dirname, '../..');
const disabledTheories = ['nick', 'specialization', 'complement', 'ancestor', 'diversity'];
function load() {
  const context = vm.createContext({ window: { Keiba: {} } });
  for (const file of ['js/utils/random.js', 'js/rules/horse-generator.js', 'js/rules/bloodline-system.js', 'js/data/bloodline-lab-fixtures.js', 'js/data/chairman-pedigrees.js', 'js/data/bloodline-pilot.js']) vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context);
  const n = context.window.Keiba, B = n.BloodlineSystem, data = n.BloodlineLabFixtures;
  const records = JSON.parse(JSON.stringify(data.records)), byId = new Map(records.map(r => [r.id, r]));
  const third = ['sire-burst-f-f', 'sire-burst-f-m', 'sire-burst-m-f', 'sire-burst-m-m', 'mare-sustained-f-f', 'mare-sustained-f-m', 'mare-sustained-m-f', 'mare-sustained-m-m'];
  third.forEach((id, i) => byId.get(id).genetics.lineId = `test-diverse-${i}`);
  byId.get('mare-sustained-f-f').fatherId = 'sire-burst-f-f-f';
  byId.get('sire-burst-f-f-f').genetics.factors = [{ trait: 'burst', power: 1 }];
  const full = B.createLibrary(records, data.nicks), basic = B.createLibrary(data.records, data.nicks);
  const cases = [
    { id: 'same-none', label: '同专精，无额外奖励', library: basic, mother: 'mare-burst', active: [] },
    { id: 'different-none', label: '不同专精，无额外奖励', library: basic, active: [] },
    { id: 'mixed-none', label: '专精不明，无额外奖励', library: basic, mother: 'mare-unknown', active: [] },
    { id: 'nick', label: '只有母父相性', library: full, active: ['nick'] },
    { id: 'specialization', label: '只有专精配合', library: basic, mother: 'mare-burst', active: ['specialization'] },
    { id: 'complement', label: '只有互补配合', library: full, active: ['complement'] },
    { id: 'ancestor', label: '只有远代祖先奖励', library: full, active: ['ancestor'] },
    { id: 'diversity', label: '只有多样性', library: full, active: ['diversity'] },
    { id: 'full', label: '全部奖励达到上限', library: full, active: disabledTheories }
  ].map(c => ({ ...c, pair: B.createPair(c.library, 'sire-burst', c.mother || 'mare-sustained', 'normal', { disabledTheories: disabledTheories.filter(t => !c.active.includes(t)) }) }));
  return { n, B, data, records, full, basic, cases };
}
module.exports = { load, disabledTheories };
