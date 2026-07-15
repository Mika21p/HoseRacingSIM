(function () {
  const ns = (window.Keiba = window.Keiba || {});
  const R = ns.Random;

  const GRADES = ["S", "A", "B", "C", "G"];
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
  const SURFACE_BLOODLINE_MULTIPLIER = 1.2;
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
  const GRASS_REGIONS = ["日本", "香港", "美国", "欧洲", "其他"];
  const DIRT_REGIONS = ["日本", "中东", "美国"];
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

  function gradeFromD10(value) {
    if (value >= 10) return "S";
    if (value >= 7) return "A";
    if (value >= 5) return "B";
    if (value >= 3) return "C";
    return "G";
  }

  function clampGrade(grade, min, max) {
    const idx = GRADES.indexOf(grade);
    const minIdx = min ? GRADES.indexOf(min) : GRADES.length - 1;
    const maxIdx = max ? GRADES.indexOf(max) : 0;
    return GRADES[Math.max(maxIdx, Math.min(minIdx, idx))];
  }

  function shiftGrade(base, delta) {
    const idx = GRADES.indexOf(base);
    return GRADES[Math.max(0, Math.min(GRADES.length - 1, idx - delta))];
  }

  function gradeMod(grade, table) {
    return table[grade] || 0;
  }

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

  function addNestedMap(target, source) {
    Object.entries(source || {}).forEach(([group, values]) => {
      target[group] = target[group] || {};
      addMap(target[group], values);
    });
  }

  function clampMap(target, min, max) {
    Object.keys(target).forEach((key) => {
      target[key] = R.clamp(target[key], min, max);
    });
  }

  function clampNestedMap(target, min, max) {
    Object.values(target).forEach((values) => clampMap(values, min, max));
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
      surfaceMods: { grass: {}, dirt: {} },
      distanceMods: {},
      growthMods: {},
      temperament: R.clamp((sire.temperament || 0) + (dam.temperament || 0), -2, 2),
      heavy: R.clamp((sire.heavy || 0) + (dam.heavy || 0), -2, 2),
      weight: mergeWeightRange(sire.weight, dam.weight),
      rangeBias: {
        up: R.clamp(((sire.rangeBias && sire.rangeBias.up) || 0) + ((dam.rangeBias && dam.rangeBias.up) || 0), -1, 1),
        down: R.clamp(((sire.rangeBias && sire.rangeBias.down) || 0) + ((dam.rangeBias && dam.rangeBias.down) || 0), -1, 1),
        narrow: R.clamp(((sire.rangeBias && sire.rangeBias.narrow) || 0) + ((dam.rangeBias && dam.rangeBias.narrow) || 0), 0, 1)
      },
      courseMods: {}
    };

    addMap(effects.surfaceWeights, sire.surfaceWeights);
    addMap(effects.surfaceWeights, dam.surfaceWeights);
    addNestedMap(effects.surfaceMods, sire.surfaceMods);
    clampNestedMap(effects.surfaceMods, -2, 2);
    addMap(effects.distanceMods, sire.distanceMods);
    addMap(effects.distanceMods, dam.distanceMods);
    clampMap(effects.distanceMods, -8, 18);
    addMap(effects.growthMods, sire.growthMods);
    addMap(effects.growthMods, dam.growthMods);
    clampMap(effects.growthMods, -14, 16);
    addMap(effects.courseMods, sire.courseMods);
    addMap(effects.courseMods, dam.courseMods);
    clampMap(effects.courseMods, -1, 1);
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

  function pickSurface(effects) {
    const raw = {};
    SURFACES.forEach((surface) => {
      raw[surface.name] = Math.max(1, surface.base + (effects.surfaceWeights[surface.name] || 0) * SURFACE_BLOODLINE_MULTIPLIER);
    });
    const weights = clampDistribution(raw, SURFACE_MIN_PCT, SURFACE_MAX_PCT);
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

  function pickWeightedEntry(entries) {
    return R.weightedPick(entries, (entry) => entry.weight);
  }

  function rollPercentTable(entries) {
    return pickWeightedEntry(entries).value;
  }

  function strongGrade(sRate) {
    return R.roll(100) <= sRate ? "S" : "A";
  }

  function lowGrade() {
    return R.roll(2) === 1 ? "C" : "G";
  }

  function nonStrongMainGrade() {
    const roll = R.roll(100);
    if (roll <= 65) return "B";
    return "C";
  }

  function dualNonStrongGrade() {
    const roll = R.roll(100);
    if (roll <= 70) return "B";
    return "C";
  }

  function regionWeight(mod) {
    if (mod >= 2) return 22;
    if (mod >= 1) return 15;
    if (mod <= -2) return 5;
    if (mod <= -1) return 7;
    return 10;
  }

  function pickRegions(regions, group, effects, count) {
    const picked = [];
    const pool = regions.slice();
    while (pool.length > 0 && picked.length < count) {
      const region = R.weightedPick(pool, (item) => regionWeight((effects.surfaceMods[group] || {})[item] || 0));
      picked.push(region);
      pool.splice(pool.indexOf(region), 1);
    }
    return picked;
  }

  function assignMainSurfaceGrades(regions, group, effects, strongCount, sRate, nonStrongGradeFn) {
    const grades = {};
    const strongRegions = pickRegions(regions, group, effects, strongCount);
    regions.forEach((region) => {
      grades[region] = strongRegions.includes(region) ? strongGrade(sRate) : nonStrongGradeFn();
    });
    return grades;
  }

  function secondaryGradeType(table) {
    return rollPercentTable(table);
  }

  function assignSecondaryGrades(regions, group, effects, gradeType) {
    const grades = {};
    regions.forEach((region) => {
      grades[region] = lowGrade();
    });
    if (gradeType !== "none") {
      const region = pickRegions(regions, group, effects, 1)[0];
      grades[region] = gradeType;
    }
    return grades;
  }

  function generateGrassSurfaceGrades(effects) {
    const strongCount = rollPercentTable([
      { value: 2, weight: 50 },
      { value: 3, weight: 40 },
      { value: 1, weight: 7 },
      { value: 4, weight: 3 }
    ]);
    const grass = assignMainSurfaceGrades(GRASS_REGIONS, "grass", effects, strongCount, 15, nonStrongMainGrade);
    const dirt = assignSecondaryGrades(DIRT_REGIONS, "dirt", effects, secondaryGradeType([
      { value: "none", weight: 62 },
      { value: "B", weight: 26 },
      { value: "A", weight: 10 },
      { value: "S", weight: 2 }
    ]));
    return { grass, dirt };
  }

  function generateDirtSurfaceGrades(effects) {
    const strongCount = rollPercentTable([
      { value: 1, weight: 45 },
      { value: 2, weight: 45 },
      { value: 3, weight: 10 }
    ]);
    const strongRegions = pickRegions(DIRT_REGIONS, "dirt", effects, strongCount);
    const dirt = {};
    DIRT_REGIONS.forEach((region) => {
      if (strongRegions.includes(region)) {
        dirt[region] = strongGrade(15);
      } else {
        dirt[region] = nonStrongMainGrade();
      }
    });

    const grass = assignSecondaryGrades(GRASS_REGIONS, "grass", effects, secondaryGradeType([
      { value: "none", weight: 58 },
      { value: "B", weight: 28 },
      { value: "A", weight: 12 },
      { value: "S", weight: 2 }
    ]));
    return { grass, dirt };
  }

  function generateDualSurfaceGrades(effects) {
    const pattern = rollPercentTable([
      { value: "one-each", weight: 55 },
      { value: "one-side-two", weight: 30 },
      { value: "both-two", weight: 12 },
      { value: "three-and-two", weight: 3 }
    ]);
    let grassStrong = 1;
    let dirtStrong = 1;
    if (pattern === "one-side-two") {
      if (R.roll(2) === 1) grassStrong = 2;
      else dirtStrong = 2;
    } else if (pattern === "both-two") {
      grassStrong = 2;
      dirtStrong = 2;
    } else if (pattern === "three-and-two") {
      if (R.roll(2) === 1) {
        grassStrong = 3;
        dirtStrong = 2;
      } else {
        grassStrong = 2;
        dirtStrong = 3;
      }
    }

    const grassStrongRegions = pickRegions(GRASS_REGIONS, "grass", effects, grassStrong);
    const dirtStrongRegions = pickRegions(DIRT_REGIONS, "dirt", effects, dirtStrong);
    const grass = {};
    const dirt = {};
    GRASS_REGIONS.forEach((region) => {
      grass[region] = grassStrongRegions.includes(region) ? strongGrade(18) : dualNonStrongGrade();
    });
    DIRT_REGIONS.forEach((region) => {
      dirt[region] = dirtStrongRegions.includes(region) ? strongGrade(18) : dualNonStrongGrade();
    });
    return { grass, dirt };
  }

  function generateSurfaceGrades(surfacePref, effects) {
    if (surfacePref === "泥地") return generateDirtSurfaceGrades(effects);
    if (surfacePref === "二刀流") return generateDualSurfaceGrades(effects);
    return generateGrassSurfaceGrades(effects);
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

  function rollCourseGrade(mod) {
    const value = R.roll(10) + R.clamp(mod || 0, -1, 1);
    if (value >= 9) return "S";
    if (value >= 3) return "A";
    return "B";
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

  function generateHorse(options) {
    const opts = options || {};
    const gameMode = opts.gameMode === "legend" ? "legend" : "normal";
    const sire = getSireBloodline(opts.sireId || "random");
    const dam = getDamBloodline(opts.damId || "random");
    const effects = mergeBloodlineEffects(sire, dam);
    const rawStrength = gameMode === "legend" ? R.roll(20) + 80 : R.rollMulti(2, 20) + 60;
    const strength = gameMode === "legend"
      ? rawStrength
      : R.clamp(applyStrengthType(rawStrength, effects.strengthType), 62, 100);
    const coat = pickCoat();
    const gender = opts.gender || (R.roll(2) === 1 ? "牡马" : "牝马");
    const weightMod = R.rollRange(effects.weight[0], effects.weight[1]);
    const baseWeight = gender === "牡马" ? R.rollMulti(3, 50) + 400 : R.rollMulti(3, 45) + 395;
    const weight = R.clamp(baseWeight + weightMod, 350, 620);
    const temperamentLabel = pickTemperamentLabel(effects.temperament);
    const temperament = temperamentValue(temperamentLabel);
    const surfacePref = pickSurface(effects);
    const surfaceGrades = generateSurfaceGrades(surfacePref, effects);
    const grass = surfaceGrades.grass;
    const dirt = surfaceGrades.dirt;

    const heavyType = pickHeavyType(effects.heavy);

    const courses = ["东京", "中山", "京都", "阪神", "其他地方"];
    const courseGrades = {};
    courses.forEach((course) => {
      courseGrades[course] = rollCourseGrade(effects.courseMods[course]);
    });
    if (!Object.values(courseGrades).includes("A")) courseGrades[R.pickOne(courses)] = "A";

    const distPick = pickDistance(effects, surfacePref);
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
      strength,
      strengthLabel: gameMode === "legend"
        ? "传奇模式 1d20+80(81-100)"
        : "2d20+60+血统分布修正(62-100)",
      coat: coat.name,
      coatEn: coat.en,
      gender,
      weight,
      temperament,
      temperamentLabel,
      surfacePref,
      grass,
      dirt,
      heavyType,
      courseGrades,
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
    horse.surfacePref = opts.surfacePref || horse.surfacePref;
    horse.grass = {
      日本: opts.grassJapan || horse.grass.日本,
      香港: opts.grassHongKong || horse.grass.香港,
      美国: opts.grassUsa || horse.grass.美国,
      欧洲: opts.grassEurope || horse.grass.欧洲,
      其他: opts.grassOther || horse.grass.其他
    };
    horse.dirt = {
      日本: opts.dirtJapan || horse.dirt.日本,
      中东: opts.dirtMiddleEast || horse.dirt.中东,
      美国: opts.dirtUsa || horse.dirt.美国
    };
    horse.courseGrades = {
      东京: opts.courseTokyo || horse.courseGrades.东京,
      中山: opts.courseNakayama || horse.courseGrades.中山,
      京都: opts.courseKyoto || horse.courseGrades.京都,
      阪神: opts.courseHanshin || horse.courseGrades.阪神,
      其他地方: opts.courseOther || horse.courseGrades.其他地方
    };
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

  function effectiveSurfaceRegion(race) {
    const region = race.surfaceRegion || "日本";
    return region === "阿根廷" ? "美国" : region;
  }

  function getSurfaceGrade(horse, race) {
    const region = effectiveSurfaceRegion(race);
    if (race.surface === "泥地") return horse.dirt[region] || horse.dirt.日本 || "B";
    return horse.grass[region] || horse.grass.其他 || horse.grass.日本 || "B";
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

  function calcRaceAbility(horse, race, options) {
    const opts = options || {};
    const maturity = opts.maturity || ns.MaturityRules.evaluate(
      horse,
      opts.currentTime || ns.TimeRules.startTime(),
      opts.maturityDecline || 0
    );
    const surfaceGrade = getSurfaceGrade(horse, race);
    const surfaceRegion = race.surfaceRegion || "日本";
    const surfaceLabel = `${surfaceRegion}${race.surface}`;
    const isJapaneseRace = !race.surfaceRegion || race.surfaceRegion === "日本";
    const courseGrade = isJapaneseRace
      ? horse.courseGrades[race.course] || horse.courseGrades["其他地方"] || "A"
      : "A";
    const distancePenalty = calcDistancePenalty(race.distance, horse.distMin, horse.distMax);
    const surfaceMod = gradeMod(surfaceGrade, { S: 5, A: 0, B: -5, C: -10, G: -25 });
    const courseMod = gradeMod(courseGrade, { S: 4, A: 0, B: -4 });
    const trackCondition = opts.trackCondition || "良";
    const heavyMod = getHeavyMod(horse.heavyType, trackCondition);
    const temperamentMod = opts.temperamentMod || ns.TemperamentRules.rollRaceMod(horse.temperamentLabel);
    const racePenaltyMod = Number.isFinite(opts.racePenaltyMod) ? opts.racePenaltyMod : 0;
    const rawAbility = maturity.adjustedStrength + surfaceMod + courseMod + heavyMod + temperamentMod.mod - distancePenalty + racePenaltyMod;
    const ability = Math.max(MIN_EFFECTIVE_RACE_ABILITY, rawAbility);
    return {
      ability,
      rawAbility,
      abilityFloorApplied: ability !== rawAbility,
      maturity,
      temperamentMod,
      surfaceLabel,
      surfaceRegion,
      surfaceGrade,
      surfaceMod,
      courseGrade,
      courseMod,
      distancePenalty,
      trackCondition,
      heavyMod,
      racePenaltyMod
    };
  }

  ns.HorseRules = {
    GRADES,
    COATS,
    generateHorse,
    applyDebugOverrides,
    calcDistancePenalty,
    calcRaceAbility,
    MIN_EFFECTIVE_RACE_ABILITY
  };
})();
