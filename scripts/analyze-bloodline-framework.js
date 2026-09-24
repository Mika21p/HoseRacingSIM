'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const context = vm.createContext({ window: { Keiba: {} } });
for (const file of ['js/utils/random.js', 'js/rules/horse-generator.js', 'js/rules/bloodline-system.js', 'js/data/bloodline-lab-fixtures.js']) {
  vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, { filename: file });
}
const { BloodlineSystem: B, BloodlineLabFixtures: data } = context.window.Keiba;
const library = B.createLibrary(data.records, data.nicks), count = 5000, results = [];
for (const mode of ['normal', 'chairman']) for (const low of [false, true]) {
  const pair = B.createPair(library, low ? 'sire-burst-low' : 'sire-burst', low ? 'mare-sustained-low' : 'mare-sustained', mode);
  let sum = 0, sumSq = 0, top = 0, quality = 0; const types = { burst: 0, sustained: 0, attrition: 0 };
  for (let seed = 0; seed < count; seed++) {
    const h = pair.generate({ seed }); sum += h.strength; sumSq += h.strength ** 2; quality += h.genetics.quality;
    if (h.strength >= 95) top++; for (const k of Object.keys(types)) if (h.trackAptitudes[k] === '◎') types[k]++;
  }
  results.push({ mode, parentsQuality: low ? 20 : 80, count, mean: +(sum / count).toFixed(3),
    deviation: +Math.sqrt(sumSq / count - (sum / count) ** 2).toFixed(3), top95Percent: top / count * 100,
    offspringQualityMean: +(quality / count).toFixed(3), bestTypePercent: Object.fromEntries(Object.entries(types).map(([k, v]) => [k, +(v / count * 100).toFixed(3)])) });
}
const report = { version: B.VERSION, note: '虚构父母，其他特点一致；参数验证，不代表正式赛历胜率或长期世界平衡。', results };
fs.mkdirSync(path.join(root, 'artifacts'), { recursive: true });
fs.writeFileSync(path.join(root, 'artifacts/bloodline-framework-analysis.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
