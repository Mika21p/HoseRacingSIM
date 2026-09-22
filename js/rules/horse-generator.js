(function () {
  const ns = (window.Keiba = window.Keiba || {});
  const R = ns.Random;

  const COATS = [
    { name: "鹿毛", en: "Bay", base: 45, color: "#D2691E" },
    { name: "栗毛", en: "Chestnut", base: 30, color: "#CD853F" },
    { name: "黑鹿毛", en: "Dark Bay", base: 15, color: "#5D4037" },
    { name: "芦毛", en: "Grey", base: 7, color: "#BDBDBD" },
    { name: "青鹿毛/青毛", en: "Black", base: 2, color: "#2d2d44" },
    { name: "白毛", en: "White/Rare", base: 1, color: "#f0f0f0" }
  ];
  const SURFACES = [
    { name: "草地", base: 60 },
    { name: "泥地", base: 35 },
    { name: "二刀流", base: 5 }
  ];
  const FORMAL_SURFACE_GRADES = ["A", "B", "C", "G"];
  // 赛场类型适性不从基础能力推导。组合先按稀有度抽取，再随机对应到三种比赛形态，
  // 以保证专精型和泛用型都能自然出现。
  const TRACK_APTITUDE_TEMPLATES = [
    { grades: ["○", "○", "△"], weight: 45 },
    { grades: ["◎", "△", "△"], weight: 30 },
    { grades: ["◎", "○", "△"], weight: 13 },
    { grades: ["○", "○", "○"], weight: 6 },
    { grades: ["◎", "○", "○"], weight: 3 },
    { grades: ["◎", "◎", "△"], weight: 2 },
    { grades: ["◎", "◎", "○"], weight: 1 }
  ];
  const TRACK_APTITUDE_KEYS = ["burst", "sustained", "attrition"];
  const SURFACE_PREFERENCE_BLOODLINE_MULTIPLIER = 1.2;
  const DISTS = [
    { dist: 1200, type: "短途", base: 20 },
    { dist: 1600, type: "英里", base: 20 },
    { dist: 2000, type: "中距离", base: 20 },
    { dist: 2400, type: "中长距离", base: 20 },
    { dist: 3000, type: "长距离", base: 10 },
    { dist: 3600, type: "超长距离", base: 10 }
  ];
  const DISTS_DIRT = [
    { dist: 1200, type: "短途", base: 30 },
    { dist: 1600, type: "英里", base: 30 },
    { dist: 2000, type: "中距离", base: 30 },
    { dist: 2400, type: "中长距离", base: 12 },
    { dist: 3000, type: "长距离", base: 2 },
    { dist: 3600, type: "超长距离", base: 0 }
  ];
  const DIRT_DISTANCE_MIN_WEIGHT = 1;
  const DIRT_DISTANCE_MAX_WEIGHT = { 2400: 15, 3000: 4, 3600: 1 };
  const MIN_EFFECTIVE_RACE_ABILITY = 60;
  const GROWTH_TYPES = ["早熟", "普早", "普迟", "晚熟"];
  const SURFACE_MIN_PCT = { 草地: 15, 泥地: 15, 二刀流: 5 };
  const SURFACE_MAX_PCT = { 草地: 80, 泥地: 80, 二刀流: 12 };
  const TEMPERAMENT_WEIGHTS = {
    "极端暴躁": 15,
    "暴躁": 15,
    "胆小": 15,
    "普通": 10,
    "沉稳": 15,
    "冷静": 15,
    "极其聪明": 15
  };
  const HEAVY_WEIGHTS = {
    "-2": { "不佳": 40, "普通": 38, "擅长": 16, "鬼": 6 },
    "-1": { "不佳": 35, "普通": 40, "擅长": 18, "鬼": 7 },
    "0": { "不佳": 30, "普通": 40, "擅长": 20, "鬼": 10 },
    "1": { "不佳": 24, "普通": 40, "擅长": 24, "鬼": 12 },
    "2": { "不佳": 20, "普通": 38, "擅长": 27, "鬼": 15 }
  };
  const PEAK_START_MAP = {
    "早熟": ["二岁夏", "二岁秋", "二岁秋", "二岁冬", "二岁冬"],
    "普早": ["二岁冬", "三岁春", "三岁春", "三岁夏", "三岁秋"],
    "普迟": ["三岁秋", "三岁冬", "三岁冬", "四岁春"],
    "晚熟": ["四岁春", "四岁夏", "四岁秋", "四岁冬", "五岁春"]
  };
  const PEAK_END_MAP = {
    "早熟": ["三岁冬", "四岁夏", "四岁秋", "四岁冬"],
    "普早": ["四岁秋", "四岁冬", "五岁春", "五岁夏", "五岁冬"],
    "普迟": ["四岁冬", "五岁夏", "五岁冬", "六岁春", "六岁秋"],
    "晚熟": ["五岁冬", "六岁夏", "六岁冬", "六岁冬", "七岁冬"]
  };

  function getSireBloodline(id) {
    const list = ns.SireBloodlines || ns.Bloodlines || [];
    return list.find((item) => item.id === id) || list[0] || {};
  }

  function getDamBloodline(id) {
    const list = ns.DamBloodlines || ns.Bloodlines || [];
    return list.find((item) => item.id === id) || list[0] || {};
  }

  function pickCoat() {
    return R.weightedPick(COATS, (coat) => coat.base);
  }

  function addMap(target, source) {
    Object.entries(source || {}).forEach(([key, value]) => {
      target[key] = (target[key] || 0) + value;
    });
  }

  function clampMap(target, min, max) {
    Object.keys(target).forEach((key) => {
      target[key] = R.clamp(target[key], min, max);
    });
  }

  function mergeWeightRange(left, right) {
    const a = left || [0, 0];
    const b = right || [0, 0];
    return [
      R.clamp((a[0] || 0) + (b[0] || 0), -15, 35),
      R.clamp((a[1] || 0) + (b[1] || 0), -15, 35)
    ];
  }

  function pickStrengthType(sire, dam) {
    const sireType = sire.strengthType || "standard";
    const damType = dam.strengthType || "standard";
    if ((sireType === "standard" || sireType === "late") && damType !== "standard") return damType;
    return sireType;
  }

  function mergeBloodlineEffects(sire, dam) {
    const effects = {
      strengthType: pickStrengthType(sire, dam),
      surfaceWeights: {},
      distanceMods: {},
      growthMods: {},
      temperament: R.clamp((sire.temperament || 0) + (dam.temperament || 0), -2, 2),
      heavy: R.clamp((sire.heavy || 0) + (dam.heavy || 0), -2, 2),
      weight: mergeWeightRange(sire.weight, dam.weight),
      rangeBias: {
        up: R.clamp(((sire.rangeBias && sire.rangeBias.up) || 0) + ((dam.rangeBias && dam.rangeBias.up) || 0), -1, 1),
        down: R.clamp(((sire.rangeBias && sire.rangeBias.down) || 0) + ((dam.rangeBias && dam.rangeBias.down) || 0), -1, 1),
        narrow: R.clamp(((sire.rangeBias && sire.rangeBias.narrow) || 0) + ((dam.rangeBias && dam.rangeBias.narrow) || 0), 0, 1)
      }
    };

    addMap(effects.surfaceWeights, sire.surfaceWeights);
    addMap(effects.surfaceWeights, dam.surfaceWeights);
    addMap(effects.distanceMods, sire.distanceMods);
    addMap(effects.distanceMods, dam.distanceMods);
    clampMap(effects.distanceMods, -8, 18);
    addMap(effects.growthMods, sire.growthMods);
    addMap(effects.growthMods, dam.growthMods);
    clampMap(effects.growthMods, -14, 16);
    return effects;
  }

  function clampDistribution(raw, minPct, maxPct) {
    const keys = Object.keys(raw);
    const result = {};
    let free = keys.slice();
    let remaining = 100;

    while (free.length > 0) {
      const total = free.reduce((sum, key) => sum + Math.max(0, raw[key] || 0), 0);
      let changed = false;
      for (let i = free.length - 1; i >= 0; i -= 1) {
        const key = free[i];
        const share = total > 0 ? remaining * Math.max(0, raw[key] || 0) / total : remaining / free.length;
        const min = minPct[key] || 0;
        const max = maxPct[key] || 100;
        if (share < min) {
          result[key] = min;
          remaining -= min;
          free.splice(i, 1);
          changed = true;
        } else if (share > max) {
          result[key] = max;
          remaining -= max;
          free.splice(i, 1);
          changed = true;
        }
      }
      if (!changed) {
        free.forEach((key) => {
          result[key] = total > 0 ? remaining * Math.max(0, raw[key] || 0) / total : remaining / free.length;
        });
        free = [];
      }
    }

    return result;
  }

  function surfaceWeightsForEffects(effects) {
    const raw = {};
    SURFACES.forEach((surface) => {
      raw[surface.name] = Math.max(1, surface.base + (effects.surfaceWeights[surface.name] || 0) * SURFACE_PREFERENCE_BLOODLINE_MULTIPLIER);
    });
    return clampDistribution(raw, SURFACE_MIN_PCT, SURFACE_MAX_PCT);
  }

  function pickSurface(effects) {
    const weights = surfaceWeightsForEffects(effects);
    return R.weightedPick(SURFACES, (surface) => weights[surface.name] || 0).name;
  }

  function pickDistance(effects, surface) {
    const table = surface === "泥地" ? DISTS_DIRT : DISTS;
    const minWeight = surface === "泥地" ? DIRT_DISTANCE_MIN_WEIGHT : 4;
    const maxWeights = surface === "泥地" ? DIRT_DISTANCE_MAX_WEIGHT : {};
    return R.weightedPick(table, (item) => {
      const weight = Math.max(minWeight, item.base + (effects.distanceMods[item.dist] || 0));
      const maxWeight = maxWeights[item.dist];
      return maxWeight ? Math.min(weight, maxWeight) : weight;
    });
  }

  function applyStrengthType(value, strengthType) {
    if (strengthType === "stable") {
      if (value <= 70) return value + 2;
      if (value >= 91) return value - 2;
    }
    if (strengthType === "burst") {
      const roll = R.roll(100);
      if (roll <= 20) return value + 2;
      if (roll <= 40) return value - 2;
    }
    if (strengthType === "early") {
      if (value <= 75) return value + 1;
      if (value >= 91) return value - 1;
    }
    return value;
  }

  function surfaceGradeFromTable(table) {
    return R.weightedPick(Object.keys(table), (grade) => table[grade]);
  }

  function generateSurfaceGrades(surfacePref) {
    const tables = surfacePref === "泥地"
      ? {
          grass: { A: 5, B: 15, C: 45, G: 35 },
          dirt: { A: 75, B: 18, C: 6, G: 1 }
        }
      : (surfacePref === "二刀流"
        ? {
            grass: { A: 68, B: 25, C: 6, G: 1 },
            dirt: { A: 68, B: 25, C: 6, G: 1 }
          }
        : {
            grass: { A: 75, B: 18, C: 6, G: 1 },
            dirt: { A: 5, B: 15, C: 45, G: 35 }
          });
    return {
      grass: surfaceGradeFromTable(tables.grass),
      dirt: surfaceGradeFromTable(tables.dirt)
    };
  }

  function surfaceGradeScore(grade) {
    return FORMAL_SURFACE_GRADES.indexOf(grade);
  }

  // 仅在新生成／遗传结算时调用，不在读档和展示时补抽。
  function ensureSurfaceFloor(surfaceGrades, parents = [], weights = { 草地: 60, 泥地: 35, 二刀流: 5 }) {
    const grades = { ...surfaceGrades }, keys = ["grass", "dirt"];
    if (keys.some(key => grades[key] === "A")) return grades;
    const best = Math.min(...keys.map(key => surfaceGradeScore(grades[key])));
    let choices = keys.filter(key => surfaceGradeScore(grades[key]) === best);
    const support = key => parents.filter(parent => ["A", "B"].includes(parent?.surfaceGrades?.[key])).length;
    const mostSupport = Math.max(...choices.map(support));
    choices = choices.filter(key => support(key) === mostSupport);
    const weight = key => (weights[key === "grass" ? "草地" : "泥地"] || 0) + (weights["二刀流"] || 0) / 2;
    const weightedChoices = choices.filter(key => weight(key) > 0);
    const target = choices.length === 1 ? choices[0] : weightedChoices.length
      ? R.weightedPick(weightedChoices, weight) : R.pickOne(choices);
    grades[target] = R.next() < .9 ? "A" : "B";
    return grades;
  }

  function deriveSurfacePreference(surfaceGrades) {
    const grass = surfaceGradeScore(surfaceGrades.grass);
    const dirt = surfaceGradeScore(surfaceGrades.dirt);
    if (grass <= 1 && dirt <= 1) return "二刀流";
    return grass <= dirt ? "草地" : "泥地";
  }

  function generateTrackAptitudes(weights) {
    const template = R.weightedPick(TRACK_APTITUDE_TEMPLATES, (item) => item.weight);
    const grades = template.grades.slice();
    const result = {};
    if (weights) {
      const keys = TRACK_APTITUDE_KEYS.slice();
      grades.sort((a, b) => ['◎', '○', '△'].indexOf(a) - ['◎', '○', '△'].indexOf(b));
      for (const grade of grades) {
        const key = keys.some(k => weights[k] > 0) ? R.weightedPick(keys.filter(k => weights[k] > 0), k => weights[k]) : R.pickOne(keys);
        result[key] = grade;
        keys.splice(keys.indexOf(key), 1);
      }
      return Object.fromEntries(TRACK_APTITUDE_KEYS.map(k => [k, result[k]]));
    }
    TRACK_APTITUDE_KEYS.forEach((key) => {
      const index = R.rollRange(0, grades.length - 1);
      result[key] = grades.splice(index, 1)[0];
    });
    return result;
  }

  // Projection preserves every legal genotype; ties retain the original template prior.
  function constrainTrackAptitudes(raw) {
    const score = { '△': 0, '○': 1, '◎': 2 };
    const candidates = TRACK_APTITUDE_TEMPLATES.flatMap(template => {
      const permutations = new Map();
      for (const order of [[0,1,2],[0,2,1],[1,0,2],[1,2,0],[2,0,1],[2,1,0]]) {
        const grades = order.map(i => template.grades[i]);
        permutations.set(grades.join(''), grades);
      }
      return [...permutations.values()].map(grades => ({ grades, weight: template.weight / permutations.size,
        distance: TRACK_APTITUDE_KEYS.reduce((sum, key, i) => sum + (score[raw[key]] - score[grades[i]]) ** 2, 0) }));
    });
    const minimum = Math.min(...candidates.map(c => c.distance));
    if (minimum === 0) return { ...raw };
    const selected = R.weightedPick(candidates.filter(c => c.distance === minimum), c => c.weight);
    return Object.fromEntries(TRACK_APTITUDE_KEYS.map((key, i) => [key, selected.grades[i]]));
  }

  function pickTemperamentLabel(level) {
    const weights = Object.assign({}, TEMPERAMENT_WEIGHTS);
    const add = (label, value) => {
      weights[label] = Math.max(1, weights[label] + value);
    };

    if (level === 1) {
      add("极端暴躁", -3);
      add("暴躁", -3);
      add("沉稳", 3);
      add("冷静", 3);
    } else if (level === 2) {
      add("极端暴躁", -3);
      add("暴躁", -3);
      add("胆小", -3);
      add("沉稳", 3);
      add("冷静", 3);
      add("极其聪明", 3);
    } else if (level === -1) {
      add("暴躁", 3);
      add("胆小", 3);
      add("普通", -3);
      add("沉稳", -3);
    } else if (level === -2) {
      add("极端暴躁", 3);
      add("暴躁", 3);
      add("极其聪明", 3);
      add("普通", -3);
      add("沉稳", -3);
      add("冷静", -3);
    }

    return R.weightedPick(Object.keys(weights), (label) => weights[label]);
  }

  function pickHeavyType(level) {
    const weights = HEAVY_WEIGHTS[String(level)] || HEAVY_WEIGHTS["0"];
    return R.weightedPick(Object.keys(weights), (label) => weights[label]);
  }

  function pickGrowthType(effects) {
    const weights = {};
    GROWTH_TYPES.forEach((type) => {
      weights[type] = Math.max(8, 25 + (effects.growthMods[type] || 0));
    });
    return R.weightedPick(GROWTH_TYPES, (type) => weights[type]);
  }

  function stepFromRoll(value) {
    if (value <= 3) return 0;
    if (value <= 6) return 1;
    if (value <= 8) return 2;
    if (value === 9) return 3;
    return 4;
  }

  function adjustedStep(bias) {
    return R.clamp(stepFromRoll(R.roll(10)) + bias, 0, 4);
  }

  function capDistanceRange(distMin, distMax, coreDist, maxSpan) {
    if (distMax - distMin <= maxSpan) return { distMin, distMax };
    const left = Math.max(0, coreDist - distMin);
    const right = Math.max(0, distMax - coreDist);
    const span = Math.max(1, left + right);
    const allowedLeft = Math.round((maxSpan * left / span) / 100) * 100;
    const allowedRight = maxSpan - allowedLeft;
    return {
      distMin: Math.max(1000, coreDist - allowedLeft),
      distMax: Math.min(4200, coreDist + allowedRight)
    };
  }

  function calcDistancePenalty(raceDistance, distMin, distMax) {
    if (raceDistance > distMax) {
      const x = Math.round((raceDistance - distMax) / 100);
      return x > 0 ? 3 * x - 2 : 0;
    }
    if (raceDistance < distMin) {
      const x = Math.round((distMin - raceDistance) / 100);
      return x > 0 ? 2 * x - 1 : 0;
    }
    return 0;
  }

  function tempDesc(value) {
    if (value <= 15) return "极端暴躁";
    if (value <= 30) return "暴躁";
    if (value <= 45) return "胆小";
    if (value <= 55) return "普通";
    if (value <= 70) return "沉稳";
    if (value <= 85) return "冷静";
    return "极其聪明";
  }

  function temperamentValue(label) {
    const values = {
      "极端暴躁": 10,
      "暴躁": 25,
      "胆小": 40,
      "普通": 50,
      "沉稳": 65,
      "冷静": 80,
      "极其聪明": 95
    };
    return values[label] || 50;
  }

  function distanceType(distance) {
    if (distance <= 1300) return "短途";
    if (distance <= 1800) return "英里";
    if (distance <= 2200) return "中距离";
    if (distance <= 2600) return "中长距离";
    if (distance <= 3200) return "长距离";
    return "超长距离";
  }

  function rollProfileStrength(profile, effects) {
    const bounds = profile === "selected"
      ? { min: 74, max: 94 }
      : (profile === "champion" ? { min: 81, max: 100 } : { min: 62, max: 90 });
    for (let attempt = 0; attempt < 1000; attempt += 1) {
      const raw = profile === "normal"
        ? R.rollMulti(2, 15) + 60
        : Math.round((R.rollRange(bounds.min, bounds.max) + R.rollRange(bounds.min, bounds.max)) / 2);
      const adjusted = applyStrengthType(raw, effects.strengthType);
      if (adjusted >= bounds.min && adjusted <= bounds.max) return adjusted;
    }
    return Math.round((bounds.min + bounds.max) / 2);
  }

  function generateHorse(options) {
    const opts = options || {};
    const gameMode = opts.gameMode === "legend"
      ? "legend"
      : (opts.gameMode === "roguelike" ? "roguelike" : "normal");
    const strengthProfile = gameMode === "roguelike"
      ? (["normal", "selected", "champion"].includes(opts.strengthProfile) ? opts.strengthProfile : "normal")
      : "";
    const sire = getSireBloodline(opts.sireId || "random");
    const dam = getDamBloodline(opts.damId || "random");
    const effects = mergeBloodlineEffects(sire, dam);
    const rawStrength = gameMode === "roguelike"
      ? null
      : (gameMode === "legend" ? R.roll(20) + 80 : R.rollMulti(2, 20) + 60);
    const strength = gameMode === "roguelike"
      ? rollProfileStrength(strengthProfile, effects)
      : (gameMode === "legend"
        ? rawStrength
        : R.clamp(applyStrengthType(rawStrength, effects.strengthType), 62, 100));
    const coat = pickCoat();
    const gender = opts.gender || (R.roll(2) === 1 ? "牡马" : "牝马");
    const weightMod = R.rollRange(effects.weight[0], effects.weight[1]);
    const baseWeight = gender === "牡马" ? R.rollMulti(3, 50) + 400 : R.rollMulti(3, 45) + 395;
    const weight = R.clamp(baseWeight + weightMod, 350, 620);
    let temperamentLabel = pickTemperamentLabel(effects.temperament);
    if (strengthProfile === "champion") {
      for (let attempt = 0; temperamentLabel === "极端暴躁" && attempt < 100; attempt += 1) {
        temperamentLabel = pickTemperamentLabel(effects.temperament);
      }
    }
    const temperament = temperamentValue(temperamentLabel);
    const profile = opts.chairmanProfile;
    const selectedSurfacePreference = profile
      ? R.weightedPick(SURFACES, (surface) => profile.surfaceWeights[surface.name]).name
      : pickSurface(effects);
    const surfaceGrades = ensureSurfaceFloor(generateSurfaceGrades(selectedSurfacePreference), [], profile?.surfaceWeights || surfaceWeightsForEffects(effects));
    const surfacePref = deriveSurfacePreference(surfaceGrades);
    const trackAptitudes = generateTrackAptitudes(profile?.trackTypeWeights);

    const heavyType = pickHeavyType(effects.heavy);

    const distPick = profile
      ? R.weightedPick(selectedSurfacePreference === "泥地" ? DISTS_DIRT : DISTS, (distance) => profile.distanceWeights[selectedSurfacePreference === "泥地" ? "dirt" : "grass"][DISTS.findIndex((item) => item.dist === distance.dist)])
      : pickDistance(effects, selectedSurfacePreference);
    const stepUnit = distPick.dist >= 3000 ? 400 : 200;
    let upStep = adjustedStep(effects.rangeBias.up);
    let downStep = adjustedStep(effects.rangeBias.down);
    if (effects.rangeBias.narrow) {
      upStep = Math.min(upStep, 2);
      downStep = Math.min(downStep, 2);
    }
    let distMin = R.clamp(distPick.dist - downStep * stepUnit, 1000, distPick.dist);
    let distMax = R.clamp(distPick.dist + 200 + upStep * stepUnit, distPick.dist, 4200);
    const maxSpan = effects.rangeBias.up > 0 ? 2000 : 1600;
    const cappedRange = capDistanceRange(distMin, distMax, distPick.dist, maxSpan);
    distMin = cappedRange.distMin;
    distMax = cappedRange.distMax;

    const growthType = pickGrowthType(effects);

    return {
      id: window.crypto && window.crypto.randomUUID ? window.crypto.randomUUID() : String(Date.now()),
      name: opts.name || "未命名小马",
      sireId: sire.id,
      damId: dam.id,
      sireName: sire.name,
      damName: dam.name,
      gameMode,
      strengthProfile,
      strength,
      strengthLabel: gameMode === "roguelike"
        ? (strengthProfile === "selected" ? "精选马驹(74-94)" : (strengthProfile === "champion" ? "拍买马王(81-100)" : "肉鸽普通候选 2d15+60(62-90)"))
        : (gameMode === "legend" ? "传奇模式 1d20+80(81-100)" : "2d20+60+血统分布修正(62-100)"),
      coat: coat.name,
      coatEn: coat.en,
      gender,
      weight,
      temperament,
      temperamentLabel,
      surfacePref,
      surfaceGrades,
      trackAptitudes,
      heavyType,
      coreDist: distPick.dist,
      distType: distPick.type,
      distMin,
      distMax,
      growthType,
      peakStart: R.pickOne(PEAK_START_MAP[growthType]),
      peakEnd: R.pickOne(PEAK_END_MAP[growthType]),
      career: []
    };
  }

  function applyDebugOverrides(horse, options) {
    const opts = options || {};
    const coat = COATS.find((item) => item.name === opts.coat) || COATS[0];
    const temperamentLabel = opts.temperamentLabel || horse.temperamentLabel || "普通";
    const coreDist = R.clamp(Number(opts.coreDist) || horse.coreDist, 1000, 4200);
    const distMin = R.clamp(Number(opts.distMin) || horse.distMin, 1000, 4200);
    const distMax = R.clamp(Number(opts.distMax) || horse.distMax, 1000, 4200);

    horse.debugMode = true;
    horse.strength = R.clamp(Number(opts.strength) || horse.strength, 62, 100);
    horse.coat = coat.name;
    horse.coatEn = coat.en;
    horse.gender = opts.gender || horse.gender;
    horse.weight = R.clamp(Number(opts.weight) || horse.weight, 350, 620);
    horse.temperamentLabel = temperamentLabel;
    horse.temperament = temperamentValue(temperamentLabel);
    horse.surfaceGrades = {
      grass: opts.surfaceGrass || horse.surfaceGrades.grass,
      dirt: opts.surfaceDirt || horse.surfaceGrades.dirt
    };
    horse.trackAptitudes = {
      burst: opts.trackBurst || horse.trackAptitudes.burst,
      sustained: opts.trackSustained || horse.trackAptitudes.sustained,
      attrition: opts.trackAttrition || horse.trackAptitudes.attrition
    };
    horse.surfacePref = deriveSurfacePreference(horse.surfaceGrades);
    horse.heavyType = opts.heavyType || horse.heavyType;
    horse.coreDist = coreDist;
    horse.distMin = Math.min(distMin, coreDist);
    horse.distMax = Math.max(distMax, coreDist);
    horse.distType = distanceType(coreDist);
    horse.growthType = opts.growthType || horse.growthType;
    horse.peakStart = opts.peakStart || horse.peakStart;
    horse.peakEnd = opts.peakEnd || horse.peakEnd;
    return horse;
  }

  function getSurfaceGrade(horse, race) {
    const surfaceKey = ns.TrackAptitudeRules.surfaceKeyFor(race && race.surface);
    return (horse.surfaceGrades && horse.surfaceGrades[surfaceKey]) || "B";
  }

  function getHeavyMod(heavyType, condition) {
    const table = {
      "不佳": { "良": 0, "稍重": -1, "重": -2, "不良": -4 },
      "普通": { "良": 0, "稍重": 0, "重": -1, "不良": -2 },
      "擅长": { "良": 0, "稍重": 1, "重": 2, "不良": 4 },
      "鬼": { "良": 0, "稍重": 2, "重": 4, "不良": 6 }
    };
    return (table[heavyType] && table[heavyType][condition]) || 0;
  }

  function calcTrackAptitudeAbility(horse, race, maturity, options) {
    const opts = options || {};
    if (!ns.TrackAptitudeRules) throw new Error("赛场适性规则尚未加载。");
    const profile = ns.TrackAptitudeRules.resolveRuntimeCourseProfile(race, { year: opts.year });
    if (!profile) {
      throw new Error(`比赛${race && (race.name || race.id) ? `“${race.name || race.id}”` : ""}尚未配置赛程属性。`);
    }
    ns.TrackAptitudeRules.requireCourseProfile({ ...race, courseProfile: profile });
    const aptitude = ns.TrackAptitudeRules.calculateModifiers(horse, profile);
    const distancePenalty = calcDistancePenalty(race.distance, horse.distMin, horse.distMax);
    const trackCondition = opts.trackCondition || "良";
    const heavyMod = getHeavyMod(horse.heavyType, trackCondition);
    const temperamentMod = opts.temperamentMod || ns.TemperamentRules.rollRaceMod(horse.temperamentLabel);
    const racePenaltyMod = Number.isFinite(opts.racePenaltyMod) ? opts.racePenaltyMod : 0;
    const rawAbility = maturity.adjustedStrength + aptitude.modifier + heavyMod + temperamentMod.mod - distancePenalty + racePenaltyMod;
    const ability = opts.noAbilityFloor ? rawAbility : Math.max(MIN_EFFECTIVE_RACE_ABILITY, rawAbility);
    return {
      ability,
      rawAbility,
      abilityFloorApplied: ability !== rawAbility,
      maturity,
      temperamentMod,
      surfaceLabel: aptitude.surfaceLabel,
      surfaceRegion: "",
      surfaceGrade: aptitude.surfaceGrade,
      surfaceMod: aptitude.surfaceMod,
      courseGrade: "",
      courseMod: 0,
      distancePenalty,
      trackCondition,
      heavyMod,
      racePenaltyMod,
      ruleVersion: aptitude.ruleVersion,
      courseProfileId: aptitude.courseProfileId,
      trackAptitude: aptitude,
      trackAptitudeMod: aptitude.trackAptitudeMod
    };
  }

  function calcRaceAbility(horse, race, options) {
    const opts = options || {};
    const maturity = opts.maturity || ns.MaturityRules.evaluate(
      horse,
      opts.currentTime || ns.TimeRules.startTime(),
      opts.maturityDecline || 0,
      opts
    );
    return calcTrackAptitudeAbility(horse, race, maturity, opts);
  }

  ns.HorseRules = {
    generatePeak(type) { return { start: R.pickOne(PEAK_START_MAP[type] || PEAK_START_MAP["普早"]), end: R.pickOne(PEAK_END_MAP[type] || PEAK_END_MAP["普早"]) }; },
    SURFACE_GRADES: FORMAL_SURFACE_GRADES,
    temperamentValue,
    COATS,
    generateHorse,
    generateTrackAptitudes,
    constrainTrackAptitudes,
    deriveSurfacePreference,
    ensureSurfaceFloor,
    rollProfileStrength,
    applyDebugOverrides,
    calcDistancePenalty,
    getSurfaceGrade,
    calcRaceAbility,
    MIN_EFFECTIVE_RACE_ABILITY
  };
})();
