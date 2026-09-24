'use strict';
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const { load, disabledTheories } = require('../tests/helpers/bloodline-v2-fixtures');
const { B, n, cases } = load(), root = path.resolve(__dirname, '..');
let sampledFoals = 0;
function exactAbility(pair) {
  const p = pair.preview.ability; let sum = 0, top95 = 0, atFloor = 0;
  for (let a = 1; a <= 20; a++) for (let b = 1; b <= 20; b++) {
    const v = Math.min(100, Math.round(a + b + 60 + Math.max(0, p.floor - (a + b + 60)) * .5) + p.theoryBonus);
    sum += v; top95 += v >= 95; atFloor += v === p.finalMinimum;
  }
  return { mean: sum / 400, min: p.finalMinimum, top95Percent: top95 / 4, atMinimumPercent: atFloor / 4 };
}
function sample(pair, count) {
  const p = pair.preview, patterns = Object.fromEntries(p.trackPlan.combinations.map(r => [r.pattern, 0]));
  let sum = 0, min = 101, max = 0, excellent = 0, top95 = 0, under70 = 0, floorMass = 0, usable = 0;
  const directionBest = { burst: 0, sustained: 0, attrition: 0 };
  for (let seed = 0; seed < count; seed++) {
    const h = pair.generate({ seed }), r = h.breedingOutcome;
    assert.ok(h.strength >= p.ability.finalMinimum && h.strength <= 100);
    assert.equal([...r.pattern].sort().join(''), Object.values(h.trackAptitudes).sort().join(''));
    if (p.mode === 'normal') assert.equal(h.strength, Math.min(100, Math.round(r.rawStrength + Math.max(0, p.ability.floor - r.rawStrength) * .5) + p.ability.theoryBonus));
    sum += h.strength; min = Math.min(min, h.strength); max = Math.max(max, h.strength);
    top95 += h.strength >= 95; under70 += h.strength < 70; excellent += r.excellent;
    floorMass += h.strength === p.ability.finalMinimum; patterns[r.pattern]++;
    for (const key of Object.keys(directionBest)) directionBest[key] += h.trackAptitudes[key] === '◎';
    if (p.trackPlan.targets.length === 2) usable += p.trackPlan.targets.every(k => h.trackAptitudes[k] !== '△');
  }
  sampledFoals += count;
  const pct = v => +(v / count * 100).toFixed(3);
  for (const r of p.trackPlan.combinations) assert.ok(Math.abs(patterns[r.pattern] / count - r.probability) < .025, r.pattern + '偏离设定概率');
  return { count, seedRange: [0, count - 1], mean: +(sum / count).toFixed(4), min, max, excellentPercent: pct(excellent), top95Percent: pct(top95), under70Percent: pct(under70), atMinimumPercent: pct(floorMass),
    patternsPercent: Object.fromEntries(Object.entries(patterns).map(([k, v]) => [k, pct(v)])),
    bestPercent: Object.fromEntries(Object.entries(directionBest).map(([k, v]) => [k, pct(v)])), bothTargetsUsablePercent: p.trackPlan.targets.length === 2 ? pct(usable) : null };
}
const isolated = cases.map(c => ({ id: c.id, label: c.label, configured: c.pair.preview.trackPlan, ability: c.pair.preview.ability, exact: exactAbility(c.pair), observed: sample(c.pair, 10000) }));
console.log('9组隔离变量对照完成，共90000匹。');
const data = n.BloodlinePilot, library = B.createLibrary(data.records, data.nicks), real = [];
for (const s of data.scenarios) for (const mode of ['normal', 'chairman']) {
  const pair = B.createPair(library, s.fatherId, s.motherId, mode), p = pair.preview;
  assert.equal(p.legal, !s.blocked);
  if (!p.legal) { real.push({ label: s.label, mode, legal: false, reason: p.blockedReason }); continue; }
  const result = { label: s.label, mode, legal: true, risk: p.risk.level, coverage: p.coverage, theories: p.theories.map(t => t.id), configured: p.trackPlan, ability: p.ability, observed: sample(pair, 5000) };
  if (mode === 'normal') { result.exact = exactAbility(pair); result.noTheoryControl = sample(B.createPair(library, s.fatherId, s.motherId, mode, { disabledTheories }), 5000); }
  real.push(result);
}
const report = { version: B.VERSION, sampledFoals, note: '隔离组使用虚构系谱；史实试验沿用已有26匹试赋值。组合不是赛道方向顺序；不评价赛事胜率或多年世界平衡。', isolated, real };
fs.mkdirSync(path.join(root, 'artifacts'), { recursive: true });
fs.writeFileSync(path.join(root, 'artifacts/bloodline-v2-soft-analysis.json'), JSON.stringify(report, null, 2) + '\n');
const f = v => v.toFixed(2);
let md = '# 血统组合与常规速度奖励：第二版测试\n\n日期：2026-09-24。版本：' + B.VERSION + '。本轮共生成' + sampledFoals + '匹；隔离组各10000匹，真实配合每模式各5000匹，常规另有同种子关闭理论对照。所有概率指组合，不是固定的瞬发/持久/消耗顺序。\n\n';
md += '## 生效规则\n\n- 两模式共用组合抽取。同专精：◎△△50%、○○△20%；不同专精20%/50%；专精不明确35%/35%。◎○△固定22%，优秀池基础8%。\n- 母父＋4、祖先支持的专精或互补＋4、合格远代祖先＋2、多样性＋2，均为百分点；总加成最多12个百分点，优秀池最高20%。增加部分按原比例从两种普通组合扣除。\n- 优秀池内部：○○○50%、◎○○25%、◎◎△20%、◎◎○5%。\n- 常规能力：低于保护线时补回一半差距并四舍五入（专精/互补70、多样性74，取最高），再加母父＋1及远代祖先＋1，总加成最高2，能力最高100。父母素质不参与常规速度。\n- 主席速度保留素质与稳定度规则；适性取消逐项40/40/20及后续升级，以保证组合池概率。草泥、距离等其他遗传保持原规则。\n- 3×3有因子强化但无远代速度/优秀池奖励；存在3×3时不能借更远重复祖先绕过限制。直系与过近亲缘仍拦截。\n\n';
md += '## 隔离变量：常规模式\n\n|配合|优秀率设定→实测|平均能力理论→实测|实测范围|95以上|低于70|\n|---|---|---|---|---|---|\n';
for (const r of isolated) md += `|${r.label}|${f(r.configured.excellentChance * 100)}% → ${f(r.observed.excellentPercent)}%|${f(r.exact.mean)} → ${f(r.observed.mean)}|${r.observed.min}–${r.observed.max}|${f(r.observed.top95Percent)}%|${f(r.observed.under70Percent)}%|\n`;
md += '\n## 七种组合的实测占比\n\n|配合|◎△△|○○△|◎○△|○○○|◎○○|◎◎△|◎◎○|\n|---|---|---|---|---|---|---|---|\n';
for (const r of isolated.filter(r => ['same-none', 'different-none', 'mixed-none', 'full'].includes(r.id))) md += `|${r.label}|${['◎△△', '○○△', '◎○△', '○○○', '◎○○', '◎◎△', '◎◎○'].map(k => f(r.observed.patternsPercent[k]) + '%').join('|')}|\n`;
md += '\n## 现有种马库配合\n\n|组合|模式|优秀率设定→实测|平均能力|范围|瞬发◎/持久◎/消耗◎|\n|---|---|---|---|---|---|\n';
for (const r of real.filter(r => r.legal)) md += `|${r.label}|${r.mode === 'normal' ? '常规' : '主席'}|${f(r.configured.excellentChance * 100)}% → ${f(r.observed.excellentPercent)}%|${f(r.observed.mean)}|${r.observed.min}–${r.observed.max}|${Object.values(r.observed.bestPercent).map(v => f(v) + '%').join('/')}|\n`;
md += '\n## 常规配合开关对照\n\n|组合|平均能力：关闭→开启|优秀率：关闭→开启|\n|---|---|---|\n';
for (const r of real.filter(r => r.noTheoryControl)) md += `|${r.label}|${f(r.noTheoryControl.mean)} → ${f(r.observed.mean)}|${f(r.noTheoryControl.excellentPercent)}% → ${f(r.observed.excellentPercent)}%|\n`;
md += '\n## 观察与限制\n\n- 穷举2d20的400种等可能结果：无奖励均值81；只有母父81.9975；只有70软保护81.175；只有74软保护81.5075；满配83.4975。\n- 软保底减轻边界聚集：70软保护有4.25%落在70；满配有6.25%落在76，最低可到70。保护线不再是硬下限。\n- 速度奖励由配合直接决定，不要求抽中优秀适性；未引入优秀适性额外加速。\n- 3×3不获远代奖励，2组直系配合在两模式拦截；禅雅塔分支仍保留28/30资料提示。\n- 满配结果来自专门构造的虚构完整系谱，不暗示本轮某个史实组合已经满配。\n- 当前仅验证台生效；正式常规开局、主席年度繁殖和旧存档未切换。\n';
fs.writeFileSync(path.join(root, 'docs/血统软保底完整抽样-2026-09-24.md'), md);
console.log(JSON.stringify({ version: B.VERSION, sampledFoals, isolated: isolated.map(r => ({ label: r.label, excellent: r.observed.excellentPercent, mean: r.observed.mean, range: [r.observed.min, r.observed.max] })) }, null, 2));
