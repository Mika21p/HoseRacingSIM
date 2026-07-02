(function () {
  const ns = (window.Keiba = window.Keiba || {});
  const R = ns.Random;

  const STRENGTH_TIERS = [
    { id: "condition", min: 0, max: 66, label: "条件赛级", text: "还需要一步步打底，先从基础赛事看成色。" },
    { id: "open", min: 67, max: 70, label: "公开赛级", text: "底子不差，养顺了有机会在公开级别露脸。" },
    { id: "graded", min: 71, max: 75, label: "重赏赛级", text: "身上有重赏马的影子，值得认真选路线。" },
    { id: "g1", min: 76, max: 80, label: "G1级", text: "眼神和身体都很特别，顶级舞台不是不能想。" },
    { id: "world", min: 81, max: 90, label: "世界级", text: "如果养得顺，它有去海外硬碰硬的底气。" },
    { id: "historic", min: 91, max: 999, label: "历史级", text: "这种气场不常见，可能会留下名字。" }
  ];

  const DISTANCE_TYPES = [
    { id: "sprint", label: "短距离", min: 1000, max: 1300 },
    { id: "mile", label: "英里", min: 1400, max: 1800 },
    { id: "middle", label: "中距离", min: 1900, max: 2200 },
    { id: "classic", label: "中长距离", min: 2300, max: 2600 },
    { id: "long", label: "长距离", min: 2601, max: 4200 }
  ];

  const GROWTH_TYPES = ["早熟", "普早", "普迟", "晚熟"];
  const TEMPERAMENT_TYPES = ["极端暴躁", "暴躁", "胆小", "普通", "沉稳", "冷静", "极其聪明"];
  const TEMPERAMENT_GROUPS = [
    { label: "不好", types: ["极端暴躁", "暴躁", "胆小"] },
    { label: "普通", types: ["普通"] },
    { label: "好", types: ["沉稳", "冷静", "极其聪明"] }
  ];

  function chooseAccuracy() {
    const roll = R.roll(100);
    if (roll <= 25) return "accurate";
    if (roll <= 75) return "fuzzy";
    return "wrong";
  }

  function tierIndexByStrength(value) {
    const index = STRENGTH_TIERS.findIndex((tier) => value >= tier.min && value <= tier.max);
    return index >= 0 ? index : 0;
  }

  function clampIndex(index, list) {
    return Math.max(0, Math.min(list.length - 1, index));
  }

  function wrongIndex(current, list) {
    if (list.length <= 1) return current;
    let next = current;
    while (next === current) next = R.rollRange(0, list.length - 1);
    return next;
  }

  function signedShift() {
    return R.roll(2) === 1 ? -1 : 1;
  }

  function getDistanceType(distance) {
    return DISTANCE_TYPES.find((item) => distance >= item.min && distance <= item.max) || DISTANCE_TYPES[2];
  }

  function distanceSpanLabels(min, max) {
    const touched = DISTANCE_TYPES.filter((item) => max >= item.min && min <= item.max);
    if (touched.length === 0) return [getDistanceType((min + max) / 2).label];
    return touched.map((item) => item.label);
  }

  function distanceSpanTypes(min, max) {
    const touched = DISTANCE_TYPES.filter((item) => max >= item.min && min <= item.max);
    return touched.length ? touched : [getDistanceType((min + max) / 2)];
  }

  function distanceRangeFromTypes(types) {
    return {
      min: Math.min(...types.map((item) => item.min)),
      max: Math.max(...types.map((item) => item.max))
    };
  }

  function gradeAtLeast(grade, minimum) {
    const order = ["S", "A", "B", "C", "G"];
    return order.indexOf(grade) <= order.indexOf(minimum);
  }

  function surfaceCandidates(horse, minimum) {
    const result = [];
    Object.entries(horse.grass).forEach(([region, grade]) => {
      if (gradeAtLeast(grade, minimum)) result.push(`草地${region}`);
    });
    Object.entries(horse.dirt).forEach(([region, grade]) => {
      if (gradeAtLeast(grade, minimum)) result.push(`泥地${region}`);
    });
    return result;
  }

  function pickSome(items, count) {
    const pool = items.slice();
    const picked = [];
    while (pool.length > 0 && picked.length < count) {
      const index = R.rollRange(0, pool.length - 1);
      picked.push(pool.splice(index, 1)[0]);
    }
    return picked;
  }

  function buildStrengthText(tier) {
    return `这孩子的底子大概在${tier.label}附近。${tier.text}`;
  }

  function buildDistanceText(labels) {
    return `距离上看，${labels.join("到")}一带最像它的正路，别急着把它扔到太偏的条件里。`;
  }

  function buildSurfaceText(picked) {
    return `场地上我会优先看${picked.join("、")}，那里应该比较能把步子跑开。`;
  }

  function buildGrowthText(growthType) {
    return `成长节奏看起来是${growthType}，排赛时机要照着这个来。`;
  }

  function buildTemperamentText(temperamentType) {
    return `气性方面看起来偏${temperamentType}，比赛里可能会直接影响发挥。`;
  }

  function temperamentGroup(label) {
    return TEMPERAMENT_GROUPS.find((group) => group.types.includes(label)) || TEMPERAMENT_GROUPS[1];
  }

  function strengthComment(horse) {
    const accuracy = chooseAccuracy();
    const current = tierIndexByStrength(horse.strength);

    if (accuracy === "accurate") {
      const tier = STRENGTH_TIERS[current];
      return {
        item: "实力",
        accuracy,
        text: buildStrengthText(tier)
      };
    }

    if (accuracy === "fuzzy") {
      const shifted = clampIndex(current + signedShift(), STRENGTH_TIERS);
      const tier = STRENGTH_TIERS[shifted];
      const direction = shifted <= current ? "至少" : "未必能稳到";
      return {
        item: "实力",
        accuracy,
        text: `单看调教，我会说它${direction}${tier.label}。当然，真到比赛里还得看心气。`
      };
    }

    const tier = STRENGTH_TIERS[wrongIndex(current, STRENGTH_TIERS)];
    return {
      item: "实力",
      accuracy,
      text: buildStrengthText(tier)
    };
  }

  function distanceComment(horse) {
    const accuracy = chooseAccuracy();
    const types = distanceSpanTypes(horse.distMin, horse.distMax);
    const labels = types.map((item) => item.label);

    if (accuracy === "accurate") {
      return {
        item: "距离",
        accuracy,
        text: buildDistanceText(labels),
        lock: distanceRangeFromTypes(types)
      };
    }

    if (accuracy === "fuzzy") {
      const useMax = R.roll(2) === 1;
      const target = useMax ? getDistanceType(horse.distMax) : getDistanceType(horse.distMin);
      return {
        item: "距离",
        accuracy,
        text: useMax
          ? `现在看上限大概能摸到${target.label}，再长就先别太贪。`
          : `下限这边大概从${target.label}起步更稳，太短的比赛可能忙不过来。`,
        lock: useMax
          ? { min: DISTANCE_TYPES[0].min, max: target.max }
          : { min: target.min, max: DISTANCE_TYPES[DISTANCE_TYPES.length - 1].max }
      };
    }

    const center = (horse.distMin + horse.distMax) / 2;
    const current = DISTANCE_TYPES.findIndex((item) => item === getDistanceType(center));
    const wrong = DISTANCE_TYPES[wrongIndex(current, DISTANCE_TYPES)];
    return {
      item: "距离",
      accuracy,
      text: buildDistanceText([wrong.label]),
      lock: { min: wrong.min, max: wrong.max }
    };
  }

  function surfaceComment(horse) {
    const accuracy = chooseAccuracy();

    if (accuracy === "accurate") {
      const candidates = surfaceCandidates(horse, "A");
      const picked = pickSome(candidates.length ? candidates : surfaceCandidates(horse, "B"), R.rollRange(1, 2));
      return {
        item: "场地",
        accuracy,
        text: buildSurfaceText(picked),
        lock: picked
      };
    }

    if (accuracy === "fuzzy") {
      const candidates = surfaceCandidates(horse, "B");
      const picked = pickSome(candidates.length ? candidates : ["草地日本", "泥地日本"], R.rollRange(1, 2));
      return {
        item: "场地",
        accuracy,
        text: `${picked.join("、")}都可以先试，至少从动作上看不算吃亏。`,
        lock: picked
      };
    }

    const allSurfaces = ["草地日本", "草地香港", "草地美国", "草地欧洲", "草地其他", "泥地日本", "泥地美国", "泥地中东"];
    const acceptable = surfaceCandidates(horse, "B");
    const wrongPool = allSurfaces.filter((surface) => !acceptable.includes(surface));
    const picked = pickSome(wrongPool.length ? wrongPool : allSurfaces, R.rollRange(1, 2));
    return {
      item: "场地",
      accuracy,
      text: buildSurfaceText(picked),
      lock: picked
    };
  }

  function growthComment(horse) {
    const accuracy = chooseAccuracy();
    const current = GROWTH_TYPES.indexOf(horse.growthType);

    if (accuracy === "accurate") {
      return {
        item: "成熟度",
        accuracy,
        text: buildGrowthText(horse.growthType),
        lock: [horse.growthType]
      };
    }

    if (accuracy === "fuzzy") {
      const neighbor = clampIndex(current + signedShift(), GROWTH_TYPES);
      const a = Math.min(current, neighbor);
      const b = Math.max(current, neighbor);
      return {
        item: "成熟度",
        accuracy,
        text: `成长这块还没定死，我会先按${GROWTH_TYPES[a]}到${GROWTH_TYPES[b]}之间来估。`,
        lock: GROWTH_TYPES.slice(a, b + 1)
      };
    }

    const guessed = GROWTH_TYPES[wrongIndex(current, GROWTH_TYPES)];
    return {
      item: "成熟度",
      accuracy,
      text: buildGrowthText(guessed),
      lock: [guessed]
    };
  }

  function temperamentComment(horse) {
    const accuracy = chooseAccuracy();
    const current = TEMPERAMENT_TYPES.indexOf(horse.temperamentLabel);

    if (accuracy === "accurate") {
      return {
        item: "气性",
        accuracy,
        text: buildTemperamentText(horse.temperamentLabel)
      };
    }

    if (accuracy === "fuzzy") {
      const group = temperamentGroup(horse.temperamentLabel);
      return {
        item: "气性",
        accuracy,
        text: `气性大致算${group.label}，真正进了闸以后还要再观察。`
      };
    }

    const guessed = TEMPERAMENT_TYPES[wrongIndex(current, TEMPERAMENT_TYPES)];
    return {
      item: "气性",
      accuracy,
      text: buildTemperamentText(guessed)
    };
  }

  function generateDebutCommentDetails(horse) {
    return [
      strengthComment(horse),
      surfaceComment(horse),
      distanceComment(horse),
      growthComment(horse),
      temperamentComment(horse)
    ];
  }

  function mergeGrowthRange(growthTypes) {
    const ranges = {
      "早熟": { start: { age: 2, month: 6, half: 1 }, end: { age: 2, month: 10, half: 2 } },
      "普早": { start: { age: 2, month: 8, half: 1 }, end: { age: 2, month: 12, half: 2 } },
      "普迟": { start: { age: 2, month: 10, half: 1 }, end: { age: 3, month: 2, half: 2 } },
      "晚熟": { start: { age: 3, month: 1, half: 1 }, end: { age: 3, month: 4, half: 2 } }
    };
    const picked = growthTypes.map((type) => ranges[type]).filter(Boolean);
    if (picked.length === 0) return null;
    const startIndex = Math.min(...picked.map((range) => ns.TimeRules.toIndex(range.start.age, range.start.month, range.start.half)));
    const endIndex = Math.max(...picked.map((range) => ns.TimeRules.toIndex(range.end.age, range.end.month, range.end.half)));
    return { startIndex, endIndex };
  }

  function buildDebutLock(commentDetails) {
    const distance = commentDetails.find((comment) => comment.item === "距离");
    const surface = commentDetails.find((comment) => comment.item === "场地");
    const growth = commentDetails.find((comment) => comment.item === "成熟度");
    return {
      distance: distance && distance.lock ? distance.lock : null,
      surfaces: surface && surface.lock ? surface.lock.slice() : [],
      time: growth && growth.lock ? mergeGrowthRange(growth.lock) : null
    };
  }

  function generateDebutComments(horse) {
    return generateDebutCommentDetails(horse).map((comment) => comment.text);
  }

  ns.CommentRules = { generateDebutComments, generateDebutCommentDetails, buildDebutLock };
})();
