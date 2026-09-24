'use strict';
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const { load } = require('../tests/helpers/bloodline-v2-fixtures');
const { B, n, cases } = load(), root = path.resolve(__dirname, '..'), results = [];
const original = n.HorseRules.generateHorse;
for (const c of cases.filter(c => ['same-none', 'nick', 'complement', 'diversity', 'full'].includes(c.id))) {
  const p = c.pair.preview.ability, hardHistogram = {}, softHistogram = {};
  let hardSum = 0, softSum = 0;
  try {
    for (let a = 1; a <= 20; a++) for (let b = 1; b <= 20; b++) {
      const raw = a + b + 60;
      n.HorseRules.generateHorse = options => ({ ...original(options), strength: raw });
      const h = c.pair.generate({ seed: a * 20 + b }), hard = Math.min(100, Math.max(raw, p.floor) + p.theoryBonus);
      assert.equal(h.strength, Math.min(100, Math.round(raw + Math.max(0, p.floor - raw) / 2) + p.theoryBonus));
      hardSum += hard; softSum += h.strength;
      hardHistogram[hard] = (hardHistogram[hard] || 0) + 1; softHistogram[h.strength] = (softHistogram[h.strength] || 0) + 1;
    }
  } finally { n.HorseRules.generateHorse = original; }
  let sampledSum = 0, min = 101, max = 0, excellent = 0;
  const count = 2000;
  for (let seed = 0; seed < count; seed++) {
    const h = c.pair.generate({ seed }); sampledSum += h.strength; min = Math.min(min, h.strength); max = Math.max(max, h.strength); excellent += h.breedingOutcome.excellent;
  }
  const boundary = p.floor + p.theoryBonus;
  results.push({ id: c.id, label: c.label, protectionLine: p.floor, bonus: p.theoryBonus,
    exact: { outcomes: 400, hardMean: hardSum / 400, softMean: softSum / 400, hardMin: Math.min(...Object.keys(hardHistogram).map(Number)), softMin: Math.min(...Object.keys(softHistogram).map(Number)), boundary,
      hardBoundaryPercent: (hardHistogram[boundary] || 0) / 4, softBoundaryPercent: (softHistogram[boundary] || 0) / 4, hardHistogram, softHistogram },
    observed: { count, seedRange: [0, count - 1], mean: sampledSum / count, min, max, excellentPercent: excellent / count * 100 } });
}
const report = { version: B.VERSION, generated: 12000, note: '5组各穷举400种骰点并抽样2000匹；满配为虚构边界系谱，不代表史实马评分。', results };
fs.writeFileSync(path.join(root, 'artifacts/bloodline-soft-floor-analysis.json'), JSON.stringify(report, null, 2) + '\n');
let md = '# 常规血统速度：软保底简测\n\n规则版本：' + B.VERSION + '。5组各穷举400种等可能骰点，再各抽样2000匹（种子0–1999），合计生成12000匹。满配是虚构边界系谱。\n\n低于保护线时补回差距的一半，四舍五入，再加固定奖励，最高100：`min(100, round(原始能力 + max(0, 保护线 - 原始能力) / 2) + 固定奖励)`。专精/互补保护线70，多样性74，取最高而不叠加；均值奖励最多2。保护线不是能力最低值。无需额外随机抽取；优秀组合概率与主席速度规则不变。\n\n|配合|硬保底均值|软保底均值|软保底实测均值|最低值：硬→软|旧边界集中率：硬→软|\n|---|---:|---:|---:|---|---|\n';
for (const r of results) { const e = r.exact; md += `|${r.label}|${e.hardMean.toFixed(4)}|${e.softMean.toFixed(4)}|${r.observed.mean.toFixed(4)}|${e.hardMin} → ${e.softMin}|${e.boundary}点：${e.hardBoundaryPercent.toFixed(2)}% → ${e.softBoundaryPercent.toFixed(2)}%|\n`; }
md += '\n均值、下限、集中率的对比来自400种骰点穷举，不存在抽样误差。整数四舍五入仍会合并相邻低点，但不再将全部低分拉到同一值。滿配原始62、66、70、74分别成为70、72、74、76；原始80依旧为82。当前仅验证台启用，正式模式及旧存档未切换。\n';
fs.writeFileSync(path.join(root, 'docs/血统软保底测试-2026-09-24.md'), md);
console.log(JSON.stringify({ version: B.VERSION, generated: report.generated, results: results.map(r => ({ label: r.label, hardMean: r.exact.hardMean, softMean: r.exact.softMean, sampleMean: r.observed.mean, minimum: r.exact.softMin, boundaryPercent: r.exact.softBoundaryPercent })) }, null, 2));
