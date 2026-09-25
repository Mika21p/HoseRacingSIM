(function () {
  'use strict';
  const ns = window.Keiba = window.Keiba || {};
  const VERSION = 'bloodline-combinations-v2.2-career';
  const TYPES = ['burst', 'sustained', 'attrition'];
  const SURFACES = ['grass', 'dirt'];
  const FACTORS = [...TYPES, ...SURFACES, 'calm', 'heavy'];
  const TRACK_SCORE = { '△': 0, '○': 1, '◎': 2 };
  const TEMPERAMENTS = ['极端暴躁', '暴躁', '胆小', '普通', '沉稳', '冷静', '极其聪明'];
  const GROWTHS = ['早熟', '普早', '普迟', '晚熟'];
  const clone = value => JSON.parse(JSON.stringify(value));
  function freeze(value) {
    if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); }
    return value;
  }
  const MODES = freeze({
    normal: { label: '常规模式', qualityAbilityWeight: 0, theoryAbilityCap: 2 },
    legend: { label: '传奇模式', qualityAbilityWeight: 0, theoryAbilityCap: 2 },
    roguelike: { label: '肉鸽模式', qualityAbilityWeight: 0, theoryAbilityCap: 0 },
    chairman: { label: '主席模式', qualityAbilityWeight: .18, theoryAbilityCap: 1.5 }
  });
  const assert = (condition, message) => { if (!condition) throw new Error(message); };
  const number = (value, min, max, label) => assert(Number.isFinite(value) && value >= min && value <= max, `${label}须在${min}至${max}之间。`);
  const EXCELLENT = freeze([
    { pattern: '○○○', share: .5 }, { pattern: '◎○○', share: .25 },
    { pattern: '◎◎△', share: .2 }, { pattern: '◎◎○', share: .05 }
  ]);
  // 保护线不是最低值；仅补回一半差距，四舍五入后再加固定奖励。不消耗额外随机数。
  function normalAbility(raw, floor, bonus) { return Math.min(100, Math.round(raw + Math.max(0, floor - raw) * .5) + bonus); }
  function drawTrack(plan, weights, R) {
    const row = R.weightedPick(plan.combinations, r => r.probability);
    // 枚举合法排列，只调整方向，不再逐项遗传或追加升级，保持组合概率准确。
    const grades = [...row.pattern], permutations = new Map();
    for (const order of [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]]) {
      const values = order.map(i => grades[i]);
      const targetScores = plan.targets.map(k => TRACK_SCORE[values[TYPES.indexOf(k)]]);
      let weight = TYPES.reduce((product, key, i) => product * weights[key] ** TRACK_SCORE[values[i]], 1);
      if (plan.kind === 'same' && targetScores[0] === Math.max(...values.map(v => TRACK_SCORE[v]))) weight *= 2;
      if (plan.kind === 'different' && targetScores.every(s => s >= 1)) weight *= 3;
      permutations.set(values.join(''), { values, weight });
    }
    let choices = [...permutations.values()];
    if (plan.directionalChance && plan.targets.length && R.next() < plan.directionalChance) {
      const score = row => {
        const scores = plan.targets.map(k => TRACK_SCORE[row.values[TYPES.indexOf(k)]]);
        return Math.min(...scores) * 10 + scores.reduce((a, b) => a + b, 0);
      };
      const best = Math.max(...choices.map(score));
      choices = choices.filter(row => score(row) === best);
    }
    const selected = R.weightedPick(choices, r => r.weight);
    return { pattern: row.pattern, excellent: row.excellent, aptitudes: Object.fromEntries(TYPES.map((key, i) => [key, selected.values[i]])) };
  }

  // 事实身份与游戏遗传字段分离。缺失亲缘/遗传资料保持未知，不从国家或马名猜测。
  function createLibrary(records, nicks = []) {
    assert(Array.isArray(records), '血统记录须为数组。');
    const byId = new Map();
    for (const input of records) {
      assert(input && typeof input.id === 'string' && input.id, '血统记录需要稳定编号。');
      assert(!byId.has(input.id), `血统编号重复：${input.id}`);
      const row = clone(input), g = row.genetics || {};
      assert(['牡马', '牝马', '骟马'].includes(row.gender), '血统性别无效。');
      for (const key of ['fatherId', 'motherId']) assert(row[key] == null || typeof row[key] === 'string', '父母编号无效。');
      for (const key of ['lineId', 'familyId']) assert(g[key] == null || typeof g[key] === 'string', '血系编号无效。');
      for (const key of ['quality', 'stability']) if (g[key] != null) number(g[key], 1, 100, key);
      const surface = g.surfaceGrades || row.surfaceGrades;
      const track = g.trackAptitudes || row.trackAptitudes;
      if (surface) for (const key of SURFACES) assert(['A', 'B', 'C', 'G'].includes(surface[key]), '草泥适性无效。');
      if (track) for (const key of TYPES) assert(Object.hasOwn(TRACK_SCORE, track[key]), '三类型适性无效。');
      const distance = g.distance || (row.coreDist != null ? { min: row.distMin, core: row.coreDist, max: row.distMax } : null);
      if (distance) {
        for (const value of Object.values(distance)) number(value, 1000, 4200, '距离');
        assert(distance.min <= distance.core && distance.core <= distance.max, '距离区间必须包含核心距离。');
      }
      const growth = g.growthType || row.growthType;
      const temperament = g.temperamentLabel || row.temperamentLabel;
      const heavy = g.heavyType || row.heavyType;
      if (growth) assert(GROWTHS.includes(growth), '成长类型无效。');
      if (temperament) assert(TEMPERAMENTS.includes(temperament), '气性类型无效。');
      if (heavy) assert(['不佳', '普通', '擅长', '鬼'].includes(heavy), '重场适性无效。');
      assert(g.factors == null || Array.isArray(g.factors), '因子须为数组。');
      const factors = new Set();
      for (const f of g.factors || []) {
        assert(FACTORS.includes(f.trait) && [1, 2].includes(f.power), '因子类型或强度无效。');
        assert(!factors.has(f.trait), '同一个体的因子不能重复。'); factors.add(f.trait);
      }
      assert(factors.size <= 2, '每匹马最多两个因子。');
      row.genetics = { ...g, surfaceGrades: surface || null, trackAptitudes: track || null,
        distance, growthType: growth || null, temperamentLabel: temperament || null, heavyType: heavy || null, factors: g.factors || [] };
      byId.set(row.id, freeze(row));
    }
    const done = new Set(), active = new Set();
    function visit(row) {
      if (done.has(row.id)) return;
      assert(!active.has(row.id), '血统关系存在循环。'); active.add(row.id);
      for (const [key, gender] of [['fatherId', '牡马'], ['motherId', '牝马']]) {
        const parent = byId.get(row[key]);
        if (parent) { assert(parent.gender === gender, '血统父母性别不符。'); visit(parent); }
      }
      active.delete(row.id); done.add(row.id);
    }
    byId.forEach(visit);
    assert(Array.isArray(nicks), '血系相性须为数组。');
    const nickKeys = new Set();
    for (const nick of nicks) {
      assert(typeof nick.sireLine === 'string' && nick.sireLine && typeof nick.broodmareSireLine === 'string' && nick.broodmareSireLine, '相性需要父系与母父系编号。');
      nickKeys.add(JSON.stringify([nick.sireLine, nick.broodmareSireLine]));
    }
    return Object.freeze({ records: Object.freeze([...byId.values()]), get: id => byId.get(id),
      hasNick: (sireLine, damSireLine) => nickKeys.has(JSON.stringify([sireLine, damSireLine])) });
  }

  const pedigreeCaches = new WeakMap();
  function pedigreeAnalysis(library,fatherId,motherId) {
    const father = library.get(fatherId), mother = library.get(motherId);
    assert(father?.gender === '牡马' && mother?.gender === '牝马', '请选择存在的父马和母马。');
    let cache = pedigreeCaches.get(library);
    if (!cache) { cache = { slots:new Map(), ancestors:new Map() }; pedigreeCaches.set(library,cache); }
    const slots = [];
    function walk(id, side, generation, path) {
      const row = library.get(id);
      slots.push({ side, generation, path, id: row?.id || null, requestedId: id || null,
        name: row?.displayName || row?.name || row?.id || '资料缺失', lineId: row?.genetics.lineId || null });
      if (generation < 4) {
        walk(row?.fatherId, side, generation + 1, path + '父');
        walk(row?.motherId, side, generation + 1, path + '母');
      }
    }
    for (const [id,side,path] of [[fatherId,'father','父'],[motherId,'mother','母']]) {
      const key=id+'|'+side;
      if(cache.slots.has(key)) slots.push(...cache.slots.get(key));
      else { const offset=slots.length;walk(id,side,1,path);cache.slots.set(key,slots.slice(offset)); }
    }
    const nearest = side => {
      const map = new Map();
      for (const slot of slots.filter(s => s.side === side && s.id)) {
        const old = map.get(slot.id);
        if (!old || slot.generation < old.generation) map.set(slot.id, slot);
      }
      return map;
    };
    const paternal = nearest('father'), maternal = nearest('mother');
    const common = [...paternal.values()].filter(s => maternal.has(s.id)).map(s => ({ id: s.id, name: s.name,
      fatherGeneration: s.generation, motherGeneration: maternal.get(s.id).generation,
      notation: `${s.generation}×${maternal.get(s.id).generation}` }));
    function hasAncestor(root, id) {
      let known=cache.ancestors.get(root.id);
      if(!known){known=new Set();const todo=[root.fatherId,root.motherId];while(todo.length){const key=todo.pop();if(!key||known.has(key))continue;known.add(key);const row=library.get(key);if(row)todo.push(row.fatherId,row.motherId);}cache.ancestors.set(root.id,known);}
      return known.has(id);
    }
    const forbidden = hasAncestor(father, motherId) || hasAncestor(mother, fatherId) ||
      common.some(c => Math.min(c.fatherGeneration, c.motherGeneration) <= 2 && Math.max(c.fatherGeneration, c.motherGeneration) <= 3);
    const severity = common.reduce((max, c) => Math.max(max, c.fatherGeneration + c.motherGeneration <= 6 ? 3 : c.fatherGeneration + c.motherGeneration === 7 ? 2 : 1), 0);
    return {father,mother,slots,common,forbidden,severity};
  }
  function checkPair(library,fatherId,motherId) {const p=pedigreeAnalysis(library,fatherId,motherId);return {legal:!p.forbidden,severity:p.severity};}

  function createPair(library, fatherId, motherId, mode = 'normal', audit = {}) {
    assert(Object.hasOwn(MODES, mode), '血统模式无效。');
    const {father,mother,slots,common,forbidden,severity} = pedigreeAnalysis(library,fatherId,motherId);
    const third = slots.filter(s => s.generation === 3);
    const enabled = id => !(audit.disabledTheories || []).includes(id);
    const diverse = enabled('diversity') && third.every(s => s.id && s.lineId) && new Set(third.map(s => s.lineId)).size >= 6;
    const broodmareSire = library.get(mother.fatherId);
    const nick = enabled('nick') && library.hasNick(father.genetics.lineId, broodmareSire?.genetics.lineId);
    const uniqueAncestors = new Map();
    for (const slot of slots) if (slot.id && (!uniqueAncestors.has(slot.id) || uniqueAncestors.get(slot.id).generation > slot.generation)) uniqueAncestors.set(slot.id, slot);
    const factorSources = [...uniqueAncestors.values()].flatMap(s => (library.get(s.id).genetics.factors || []).map(f => ({ ...f, id: s.id, name: s.name, generation: s.generation })));
    const factorWeights = {}, reinforcementWeights = {};
    for (const source of factorSources) {
      const contribution = source.power / 2 ** (source.generation - 1);
      factorWeights[source.trait] = Math.min(2, (factorWeights[source.trait] || 0) + contribution);
      if (enabled('ancestor') && common.some(c => c.id === source.id)) reinforcementWeights[source.trait] = Math.min(.5, (reinforcementWeights[source.trait] || 0) + contribution * .5);
    }
    // 强化有独立小额上限，避免父母因子填满基础上限后祖先配合完全失效。
    for (const trait of FACTORS) if (reinforcementWeights[trait]) factorWeights[trait] = (factorWeights[trait] || 0) + reinforcementWeights[trait];
    const weights = Object.fromEntries(TYPES.map(key => [key, 1 + [father, mother].reduce((sum, p) => sum + (TRACK_SCORE[p.genetics.trackAptitudes?.[key]] ?? 1), 0) + (factorWeights[key] || 0)
      + (nick ? Math.min(.6, (broodmareSire.genetics.factors || []).filter(f => f.trait === key).reduce((sum, f) => sum + f.power * .3, 0)) : 0)]));
    const strongest = row => TYPES.filter(k => row.genetics.trackAptitudes?.[k] === '◎');
    const a = strongest(father), b = strongest(mother);
    const support = (side, trait) => factorSources.filter(f => f.trait === trait && slots.some(s => s.id === f.id && s.side === side && s.generation >= 2 && s.generation <= 3));
    const supported = a.length === 1 && b.length === 1 && support('father', a[0]).length && support('mother', b[0]).length;
    const specialized = enabled('specialization') && supported && a[0] === b[0];
    const complementary = enabled('complement') && supported && a[0] !== b[0];
    const reinforced = enabled('ancestor') ? common.filter(c => factorSources.some(f => f.id === c.id)) : [];
    // 高风险3×3仍有因子传递，但不给速度/优秀池额外奖励；不能借其更远的重复祖先绕过。
    const distantReward = !forbidden && severity <= 2 && reinforced.some(c => c.fatherGeneration >= 3 && c.motherGeneration >= 3);
    const kind = a.length === 1 && b.length === 1 ? (a[0] === b[0] ? 'same' : 'different') : 'mixed';
    const excellentBonus = Math.min(.12, (nick ? .04 : 0) + (specialized || complementary ? .04 : 0) + (distantReward ? .02 : 0) + (diverse ? .02 : 0));
    const excellentChance = .08 + excellentBonus, commonChance = 1 - .22 - excellentChance;
    const focusedShare = kind === 'same' ? 5 / 7 : kind === 'different' ? 2 / 7 : .5;
    const trackPlan = { kind, targets: kind === 'mixed' ? [] : [...new Set([a[0], b[0]])], excellentChance, excellentBonus,
      combinations: [
        { pattern: '◎○△', probability: .22, excellent: false },
        ...EXCELLENT.map(r => ({ pattern: r.pattern, probability: excellentChance * r.share, excellent: true })),
        { pattern: '◎△△', probability: commonChance * focusedShare, excellent: false },
        { pattern: '○○△', probability: commonChance * (1 - focusedShare), excellent: false }
      ] };
    if (mode === 'roguelike') trackPlan.directionalChance = .85;
    if (diverse) { const mean = TYPES.reduce((sum, key) => sum + weights[key], 0) / 3; TYPES.forEach(key => weights[key] = .85 * weights[key] + .15 * mean); }
    const meanQuality = ((father.genetics.quality ?? 50) + (mother.genetics.quality ?? 50)) / 2;
    const meanStability = ((father.genetics.stability ?? 50) + (mother.genetics.stability ?? 50)) / 2;
    const normalBonus = Math.min(2, (nick ? 1 : 0) + (distantReward ? 1 : 0));
    const normalFloor = diverse ? 74 : specialized || complementary ? 70 : 62;
    const theoryBonus = mode === 'roguelike' ? 0 : mode !== 'chairman' ? normalBonus : Math.min(MODES.chairman.theoryAbilityCap, (nick ? .6 : 0) + (diverse ? .4 : 0) + (distantReward ? .4 : 0));
    const contributors = supported ? [...new Set([fatherId, motherId, ...support('father', a[0]).map(f => f.id), ...support('mother', b[0]).map(f => f.id)])] : [];
    const theories = [nick && { id: 'nick', label: '母父相性', ids: [fatherId, motherId, broodmareSire.id], description: '优秀组合率＋4个百分点；常规能力＋1，主席能力计算＋0.6；母父的赛道因子额外增加方向权重，每方向最多0.6。' },
      reinforced.length && { id: 'ancestor', label: '祖先强化', ids: reinforced.map(c => c.id), description: '共同祖先因子额外贡献50%，每方向强化上限0.5；' + (distantReward ? '符合远代条件，优秀组合率＋2个百分点，常规能力＋1、主席能力计算＋0.4。' : '当前亲缘不满足奖励条件，不加速度或优秀组合率。') + '亲缘风险仍保留。' },
      specialized && { id: 'specialization', label: '专精配合', ids: contributors, description: '同专精且双方二至三代均有对应因子；优秀组合率＋4个百分点，常规原始能力低于70时补回一半差距，四舍五入。不再追加适性升级。' },
      complementary && { id: 'complement', label: '互补配合', ids: contributors, description: '不同专精且双方二至三代均有对应因子；优秀组合率＋4个百分点，常规原始能力低于70时补回一半差距，四舍五入。不再追加适性升级。' },
      diverse && { id: 'diversity', label: '血统多样性', ids: third.map(s => s.id), description: '第三代八个槽位全部已知且至少六种血系；优秀组合率＋2个百分点，常规原始能力低于74时补回一半差距，四舍五入；主席能力计算＋0.4；方向权重向均衡靠拢15%。' },
      factorSources.length && { id: 'factor', label: '祖先特征传递', ids: factorSources.map(f => f.id), description: '因子按代数衰减为1、1/2、1/4、1/8；每匹祖先只贡献一次，最多两个因子。' }].filter(Boolean);
    const missing = slots.filter(s => !s.id).length;
    const preview = freeze({ ruleVersion: VERSION, mode, fatherId, motherId, legal: !forbidden,
      blockedReason: forbidden ? '直系或过近亲缘，不能配种。' : '', pedigree: slots, commonAncestors: common,
      coverage: { known: 30 - missing, total: 30, complete: missing === 0 },
      risk: { level: forbidden ? '禁止' : severity >= 3 ? '高' : severity === 2 ? '中' : severity === 1 ? '低' : missing ? '资料不足' : '未发现四代重复', incomplete: missing > 0 },
      theories, factorSources, factorWeights, directionWeights: weights,
      trackPlan,
      ability: mode === 'roguelike' ? { bloodlineMeanEffect: 0, floor: null, protection: null, theoryBonus: 0, description: '能力仅由候选档位决定。' } : { bloodlineMeanEffect: mode !== 'chairman' ? 0 : (meanQuality - 50) * MODES.chairman.qualityAbilityWeight,
        floor: mode !== 'chairman' ? normalFloor : 62, protection: mode !== 'chairman' ? 'half-gap-rounded' : null,
        finalMinimum: mode !== 'chairman' ? normalAbility(mode === 'legend' ? 81 : 62, normalFloor, normalBonus) : 62,
        theoryBonus, qualityKnown: [father, mother].filter(p => p.genetics.quality != null).length,
        description: mode !== 'chairman' ? `原始能力${mode === 'legend' ? '1d20+80' : '2d20+60'}；低于${normalFloor}时补回一半差距，四舍五入后再加${normalBonus}，最高100。保护线不是最低值，最终范围${normalAbility(mode === 'legend' ? 81 : 62, normalFloor, normalBonus)}–100。` : '繁殖素质影响后代分布；稳定度影响波动，普通血统也有小概率突破。适性组合与常规共用新概率。' },
      warnings: [missing ? '祖先资料不全；不能将缺失当成无近亲或血统多样。' : '',
        [father, mother].some(p => p.genetics.quality == null) ? '未赋值的繁殖素质按中性50处理，不是现实评价。' : ''].filter(Boolean) });

    function generate(options = {}) {
      assert(preview.legal, preview.blockedReason);
      if (options.seed != null) assert(Number.isInteger(options.seed) && options.seed >= 0 && options.seed <= 0xffffffff, '种子须为32位非负整数。');
      const R = ns.Random, H = ns.HorseRules;
      assert(R && H, '血统生成需要随机与马匹生成规则。');
      function run() {
        const h = H.generateHorse({ gameMode: mode === 'roguelike' ? 'roguelike' : mode === 'legend' ? 'legend' : 'normal', strengthProfile: options.strengthProfile, sireId: 'random', damId: 'random', chairmanProfile: options.regionalProfile });
        const rawStrength = h.strength;
        delete h.id;
        if (options.childId != null) h.id = String(options.childId);
        h.name = options.name || '未命名后代';
        h.fatherId = fatherId; h.motherId = motherId;
        h.sireId = fatherId; h.damId = motherId;
        h.sireName = father.displayName || father.name || fatherId; h.damName = mother.displayName || mother.name || motherId;
        let chairmanDraw;
        if (mode === 'chairman') {
          const noise = (R.rollMulti(2, 20) - 21) * (1.15 - meanStability * .006);
          const breakthrough = R.next() < .03;
          const exceptional = R.rollRange(90, 100);
          h.strength = R.clamp(Math.round(81 + preview.ability.bloodlineMeanEffect + noise + theoryBonus), 62, 100);
          chairmanDraw = { breakthrough, ordinaryStrength: h.strength };
          if (breakthrough) h.strength = Math.max(h.strength, exceptional);
        } else if (mode !== 'roguelike') h.strength = normalAbility(rawStrength, normalFloor, normalBonus);
        if (mode !== 'roguelike') h.strengthLabel = mode !== 'chairman' ? `${MODES[mode].label}血统：软保底与轻度加成（${preview.ability.finalMinimum}–100）` : '主席血统：繁殖素质与稳定度分布（62–100）';
        const inherited = (a, b, fresh, share = .4) => { const roll = R.next(); return clone((roll < share ? a : roll < share * 2 ? b : null) ?? fresh); };
        for (const key of SURFACES) h.surfaceGrades[key] = inherited(father.genetics.surfaceGrades?.[key], mother.genetics.surfaceGrades?.[key], h.surfaceGrades[key], mode === 'roguelike' ? .45 : .4);
        for (const key of SURFACES) if (R.next() < (factorWeights[key] || 0) * .05) {
          const grades = ['A', 'B', 'C', 'G']; h.surfaceGrades[key] = grades[Math.max(0, grades.indexOf(h.surfaceGrades[key]) - 1)];
        }
        h.surfaceGrades = H.ensureSurfaceFloor(h.surfaceGrades, [father.genetics, mother.genetics], options.regionalProfile?.surfaceWeights);
        h.surfacePref = H.deriveSurfacePreference(h.surfaceGrades);
        const trackResult = drawTrack(trackPlan, weights, R);
        h.trackAptitudes = trackResult.aptitudes;
        h.breedingOutcome = { pattern: trackResult.pattern, excellent: trackResult.excellent,
          rawStrength: mode !== 'chairman' ? rawStrength : null, floor: preview.ability.floor, protection: preview.ability.protection,
          protectionGain: mode !== 'chairman' && mode !== 'roguelike' ? normalAbility(rawStrength, normalFloor, 0) - rawStrength : 0, bonus: theoryBonus };
        if (chairmanDraw) Object.assign(h.breedingOutcome, chairmanDraw);
        const dist = inherited(father.genetics.distance, mother.genetics.distance, { min: h.distMin, core: h.coreDist, max: h.distMax }, mode === 'roguelike' ? .45 : .3);
        h.distMin = dist.min; h.coreDist = dist.core; h.distMax = dist.max;
        h.distType = dist.core <= 1400 ? '短途' : dist.core <= 1800 ? '英里' : dist.core <= 2200 ? '中距离' : dist.core <= 2800 ? '中长距离' : dist.core <= 3200 ? '长距离' : '超长距离';
        h.growthType = inherited(father.genetics.growthType, mother.genetics.growthType, h.growthType, .3);
        const peak = H.generatePeak(h.growthType); h.peakStart = peak.start; h.peakEnd = peak.end;
        h.temperamentLabel = inherited(father.genetics.temperamentLabel, mother.genetics.temperamentLabel, h.temperamentLabel, .3);
        h.heavyType = inherited(father.genetics.heavyType, mother.genetics.heavyType, h.heavyType, .3);
        if (R.next() < (factorWeights.calm || 0) * .05) h.temperamentLabel = '沉稳';
        if (R.next() < (factorWeights.heavy || 0) * .05 && ['不佳', '普通'].includes(h.heavyType)) h.heavyType = '擅长';
        // 风险只影响现有气性属性，不另造健康属性或扣基础能力。
        if (R.next() < severity * .05) h.temperamentLabel = '暴躁';
        if (mode === 'roguelike' && options.strengthProfile === 'champion' && h.temperamentLabel === '极端暴躁') h.temperamentLabel = '暴躁';
        h.temperament = H.temperamentValue(h.temperamentLabel);
        const quality = R.clamp(Math.round(50 + .65 * (meanQuality - 50) + R.rollMulti(2, 16) - 17), 1, 100);
        const stability = R.clamp(Math.round(50 + .6 * (meanStability - 50) + R.rollMulti(2, 16) - 17), 1, 100);
        const factors = []; // 因子来源先合并，每个方向只抽一次。
        for (const trait of FACTORS) if (R.next() < Math.min(.5, (factorWeights[trait] || 0) * .2)) factors.push({ trait, power: 1 });
        // 超过两项时随机选择，避免固定顺序偏向瞬发。
        while (factors.length > 2) factors.splice(R.rollRange(0, factors.length - 1), 1);
        h.genetics = { version: VERSION, quality, stability, lineId: father.genetics.lineId || null, familyId: mother.genetics.familyId || null, factors };
        h.pedigree = { ruleVersion: mode === 'roguelike' ? VERSION + '-rogue-v1' : VERSION, mode, seed: options.seed ?? null, fatherId, motherId,
          parents: [father, mother].map(p => ({ id: p.id, name: p.displayName || p.name || p.id,
            gender: p.gender, fatherId: p.fatherId || null, motherId: p.motherId || null, genetics: clone(p.genetics) })),
          ancestors: clone(slots), theories: clone(theories), risk: clone(preview.risk), trackPlan: clone(trackPlan),
          abilityRule: clone(preview.ability), disabledTheories: clone(audit.disabledTheories || []) };
        return h;
      }
      return options.seed == null ? run() : R.withSource(R.seeded(options.seed), run);
    }
    return Object.freeze({ preview, generate });
  }
  ns.BloodlineSystem = Object.freeze({ VERSION, MODES, FACTORS: Object.freeze(FACTORS), createLibrary, createPair, checkPair });
})();
