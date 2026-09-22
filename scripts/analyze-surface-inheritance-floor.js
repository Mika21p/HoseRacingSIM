"use strict";

// 单轮开发实验；只写分析文件，不改正式规则或玩家存档。
const fs = require('node:fs');
const assert = require('node:assert/strict');
const { loadChairmanRules } = require('../tests/helpers/project-loader');
const project = loadChairmanRules();
// 在独立测试上下文中恢复实验前的两处调用，避免正式接入后重复保底。
// 仅替换内存源码，不写回规则文件；保持此前报告的对照定义。
const vm = require('node:vm');
for (const file of ['js/rules/horse-generator.js', 'js/rules/chairman-breeding.js']) {
  const source = fs.readFileSync(file, 'utf8')
    .replace('ensureSurfaceFloor(generateSurfaceGrades(selectedSurfacePreference), [], profile?.surfaceWeights || surfaceWeightsForEffects(effects))', 'generateSurfaceGrades(selectedSurfacePreference)')
    .replace('h.surfaceGrades = ns.HorseRules.ensureSurfaceFloor(h.surfaceGrades, [father, mother], surfaceWeights);', '');
  vm.runInContext(source, project.context, { filename: file });
}
const n = project.rules, R = n.Random, H = n.HorseRules;
const SEED = 20260922, COUNT = 5000;
const profile = { surfaceWeights: { 草地: 60, 泥地: 35, 二刀流: 5 }, trackTypeWeights: { burst: 1, sustained: 1, attrition: 1 }, distanceWeights: { grass: [20,20,20,20,10,10], dirt: [30,30,30,12,2,1] } };
const keys = ['grass', 'dirt'], score = { G: 0, C: 1, B: 2, A: 3 };
const clone = x => JSON.parse(JSON.stringify(x));
const parent = grades => ({ surfaceGrades: { grass: grades[0], dirt: grades[1] }, trackAptitudes: { burst: '◎', sustained: '○', attrition: '△' } });
const scenarios = [
  ['随机新马', null, null],
  ['同向草地专精 A/G × A/G', parent('AG'), parent('AG')],
  ['同向泥地专精 G/A × G/A', parent('GA'), parent('GA')],
  ['互补专精 A/G × G/A', parent('AG'), parent('GA')],
  ['双适性优秀 A/A × A/A', parent('AA'), parent('AA')],
  ['弱适性边界 B/B × B/B', parent('BB'), parent('BB')]
];

// A、B均计一份父母支持；地区二刀流权重平分到草泥。
function floor(h, parents, random) {
  const g = h.surfaceGrades;
  if (keys.some(k => g[k] === 'A')) return false;
  let choices = keys.filter(k => score[g[k]] === Math.max(...keys.map(x => score[g[x]])));
  const support = k => parents.filter(p => score[p.surfaceGrades[k]] >= 2).length;
  choices = choices.filter(k => support(k) === Math.max(...choices.map(support)));
  let target = choices[0];
  if (choices.length === 2) target = random() < (60 + 5 / 2) / 100 ? 'grass' : 'dirt';
  const desired = random() < .9 ? 'A' : 'B';
  if (score[g[target]] < score[desired]) g[target] = desired;
  assert.ok(keys.some(k => score[g[k]] >= 2));
  return true;
}
function stats() { return { aa: 0, anyA: 0, highestB: 0, bothBad: 0, dual: 0, grassOnly: 0, dirtOnly: 0, combinations: {} }; }
function record(s, h) {
  const g = h.surfaceGrades, grass = score[g.grass] >= 2, dirt = score[g.dirt] >= 2;
  s.aa += g.grass === 'A' && g.dirt === 'A';
  s.anyA += keys.some(k => g[k] === 'A');
  s.highestB += !keys.some(k => g[k] === 'A') && (grass || dirt);
  s.bothBad += !grass && !dirt; s.dual += grass && dirt;
  s.grassOnly += grass && !dirt; s.dirtOnly += dirt && !grass;
  const key = `${g.grass}/${g.dirt}`; s.combinations[key] = (s.combinations[key] || 0) + 1;
}
const results = [];
// 一个固定种子样本批次。保底用独立随机流，旧新方案共用候选和遗传抽签。
R.withSource(R.seeded(SEED), () => {
  const repairRandom = R.seeded(SEED + 1);
  for (const [label, father, mother] of scenarios) {
    const before = stats(), after = stats(); let candidateFloors = 0, offspringFloors = 0;
    for (let i = 0; i < COUNT; i++) {
      const original = H.generateHorse({ chairmanProfile: profile });
      const candidate = clone(original);
      candidateFloors += floor(candidate, [], repairRandom);
      let old = original, proposed = candidate;
      if (father) {
        const inheritSeed = R.rollRange(1, 2000000000);
        old = R.withSource(R.seeded(inheritSeed), () => n.ChairmanBreeding.inheritAptitudes(clone(original), father, mother));
        proposed = R.withSource(R.seeded(inheritSeed), () => n.ChairmanBreeding.inheritAptitudes(clone(candidate), father, mother));
        offspringFloors += floor(proposed, [father, mother], repairRandom);
      }
      record(before, old); record(after, proposed);
    }
    assert.equal(after.bothBad, 0);
    results.push({ label, count: COUNT, before, after, candidateFloors, offspringFloors });
  }
});
fs.mkdirSync('artifacts', { recursive: true });
fs.writeFileSync('artifacts/surface-inheritance-floor-analysis.json', JSON.stringify({ seed: SEED, countPerScenario: COUNT, profile, results }, null, 2));
const pct = x => (100 * x / COUNT).toFixed(2) + '%';
const report = `# 草泥遗传保底单轮中样本实验\n\n固定种子 ${SEED}，每组 ${COUNT} 匹，共 ${COUNT * scenarios.length} 匹。未修改正式规则。默认地区比例草60／泥35／二刀流5；双适性定义为两项均≥B。\n\n旧新方案共用原始候选和遗传抽签。新方案先对随机候选保底，再按现有40／40／20逐项遗传，最后对子代保底。没有A时90%将目标项升A，10%至少B；优先较好项，再按父母A/B支持数，仍平局按地区权重（二刀流各分一半）。\n\n| 场景 | 原双不合 | 新双不合 | 原至少一A | 新至少一A | 新最高B | 原→新双适性 | 原→新A/A | 子代末次保底触发 |\n|---|---:|---:|---:|---:|---:|---:|---:|---:|\n${results.map(r => `| ${r.label} | ${pct(r.before.bothBad)} | ${pct(r.after.bothBad)} | ${pct(r.before.anyA)} | ${pct(r.after.anyA)} | ${pct(r.after.highestB)} | ${pct(r.before.dual)} → ${pct(r.after.dual)} | ${pct(r.before.aa)} → ${pct(r.after.aa)} | ${r.label === '随机新马' ? '不适用' : pct(r.offspringFloors)} |`).join('\n')}\n\n## 解读范围\n\n这是一次样本实验，不是多代育种模拟；父母为固定代表档位，不能直接作为全世界平均比例。最高B比例是未取得A后再抽中10%分支的结果。候选保底会通过20%随机来源间接改变子代A/A概率；末次保底本身不会把无A组合变成A/A。原本B/B等弱父母也能大量产生至少一A，是这项强保底的必然取舍。\n\n建议正式接入前接受上述质量提升：本规则保留双适性与另一项短板的遗传价值，但弱化了“是否至少有一个A”的遗传差异。单组5000匹，50%附近比例的抽样误差约±1.4个百分点，1%附近约±0.28个百分点（约95%水平），不应根据小数点差异调参。\n\n运行：node scripts/analyze-surface-inheritance-floor.js。完整档位组合计数见 artifacts/surface-inheritance-floor-analysis.json。\n`;
fs.writeFileSync('docs/草泥遗传保底中样本分析.md', report);
console.log(report);
