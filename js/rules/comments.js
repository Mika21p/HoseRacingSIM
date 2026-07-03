(function () {
  const ns = (window.Keiba = window.Keiba || {});
  const R = ns.Random;

  const ACCURACY_LABELS = {
    precise: "非常准确",
    close: "基本准确",
    fuzzy: "模糊准确",
    unknown: "不知其详",
    wrong: "完全谬误"
  };

  const ACCURACY_PROFILES = {
    base: [
      { id: "precise", weight: 10 },
      { id: "close", weight: 20 },
      { id: "fuzzy", weight: 40 },
      { id: "unknown", weight: 20 },
      { id: "wrong", weight: 10 }
    ],
    sharper: [
      { id: "precise", weight: 15 },
      { id: "close", weight: 25 },
      { id: "fuzzy", weight: 40 },
      { id: "unknown", weight: 15 },
      { id: "wrong", weight: 5 }
    ]
  };

  const TRAINERS = [
    {
      id: "sato-yuta",
      name: "佐藤悠太",
      shortName: "佐藤",
      strengthBias: "under",
      sharperItems: ["distance"],
      focusSurfaces: [
        { group: "grass", region: "日本", label: "日本草地" },
        { group: "dirt", region: "日本", label: "日本泥地" }
      ]
    },
    {
      id: "obrien",
      name: "O'Brien（岳伯仁）",
      shortName: "岳伯仁",
      strengthBias: "over",
      sharperItems: ["growth", "temperament"],
      focusSurfaces: [
        { group: "grass", region: "欧洲", label: "欧洲草地" },
        { group: "dirt", region: "美国", label: "美国泥地" }
      ]
    }
  ];

  const STRENGTH_TIERS = [
    { id: "condition", min: 0, max: 66, label: "条件赛级" },
    { id: "open", min: 67, max: 70, label: "公开赛级" },
    { id: "graded", min: 71, max: 75, label: "重赏赛级" },
    { id: "g1", min: 76, max: 80, label: "G1级" },
    { id: "world", min: 81, max: 90, label: "世界级" },
    { id: "historic", min: 91, max: 999, label: "历史级" }
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
  const SURFACE_TYPES = ["草地", "泥地", "二刀流"];
  const GRADE_LABELS = {
    S: "擅长",
    A: "适应",
    B: "尚可",
    C: "不佳",
    G: "不行"
  };

  function getTrainer(trainerId) {
    return TRAINERS.find((trainer) => trainer.id === trainerId) || TRAINERS[0];
  }

  function getTrainerOptions() {
    return TRAINERS.slice();
  }

  function chooseAccuracy(trainer, itemId) {
    const profile = trainer.sharperItems.includes(itemId)
      ? ACCURACY_PROFILES.sharper
      : ACCURACY_PROFILES.base;
    return R.weightedPick(profile, (item) => item.weight).id;
  }

  function detail(id, label, accuracy, text, claim, lock) {
    return {
      id,
      item: label,
      label,
      accuracy,
      accuracyLabel: ACCURACY_LABELS[accuracy],
      text,
      claim: claim || null,
      lock: lock || null
    };
  }

  function tierIndexByStrength(value) {
    const index = STRENGTH_TIERS.findIndex((tier) => value >= tier.min && value <= tier.max);
    return index >= 0 ? index : 0;
  }

  function validIndex(index, list) {
    return index >= 0 && index < list.length;
  }

  function pickOne(items) {
    return items[R.rollRange(0, items.length - 1)];
  }

  function textVariant(templates, context) {
    const template = pickOne(templates);
    return template.replace(/\{(\w+)\}/g, (match, key) => {
      return context && context[key] != null ? context[key] : match;
    });
  }

  function neighborIndex(current, list, bias) {
    if (bias === "under" && validIndex(current - 1, list)) return current - 1;
    if (bias === "over" && validIndex(current + 1, list)) return current + 1;
    const candidates = [current - 1, current + 1].filter((index) => validIndex(index, list));
    return candidates.length ? pickOne(candidates) : current;
  }

  function wrongByTwoIndex(current, list, bias) {
    const lower = validIndex(current - 2, list) ? current - 2 : null;
    const upper = validIndex(current + 2, list) ? current + 2 : null;
    if (bias === "under" && lower != null) return lower;
    if (bias === "over" && upper != null) return upper;
    if (lower == null && upper != null) return upper;
    if (upper == null && lower != null) return lower;
    if (lower != null && upper != null) return pickOne([lower, upper]);
    return neighborIndex(current, list, bias);
  }

  function nonMatchingValue(current, values) {
    const pool = values.filter((value) => value !== current);
    return pool.length ? pickOne(pool) : current;
  }

  function strengthBand(index) {
    if (index <= 1) return "不太行";
    if (index <= 3) return "还不错";
    return "实力强";
  }

  function strengthComment(horse, trainer) {
    const accuracy = chooseAccuracy(trainer, "strength");
    const current = tierIndexByStrength(horse.strength);
    const currentTier = STRENGTH_TIERS[current];

    if (accuracy === "precise") {
      const text = textVariant([
        "这孩子的底子我看得很清楚，就是{tier}。",
        "这孩子的底子我心里有数，按现在的观感，就是{tier}。"
      ], { tier: currentTier.label });
      return detail(
        "strength",
        "实力",
        accuracy,
        text,
        { tier: currentTier.id }
      );
    }

    if (accuracy === "close") {
      const neighbor = neighborIndex(current, STRENGTH_TIERS, trainer.strengthBias);
      const left = Math.min(current, neighbor);
      const right = Math.max(current, neighbor);
      const leftLabel = STRENGTH_TIERS[left].label;
      const rightLabel = STRENGTH_TIERS[right].label;
      const text = textVariant([
        "实力大概落在{left}到{right}之间，路线别排得太死。",
        "实力大致夹在{left}和{right}之间，先按这个幅度去安排路线。"
      ], { left: leftLabel, right: rightLabel });
      return detail(
        "strength",
        "实力",
        accuracy,
        text,
        { tiers: [STRENGTH_TIERS[left].id, STRENGTH_TIERS[right].id] }
      );
    }

    if (accuracy === "fuzzy") {
      const band = strengthBand(current);
      const text = textVariant([
        "单看调教表现，我只能说它现在看起来{band}，真到比赛里还要再验。",
        "只看这几次调教，它给我的感觉是{band}，真章还是要到赛场上见。"
      ], { band });
      return detail(
        "strength",
        "实力",
        accuracy,
        text,
        { band }
      );
    }

    if (accuracy === "unknown") {
      return detail(
        "strength",
        "实力",
        accuracy,
        pickOne([
          "这孩子的实力底线和上限现在都看不透，先别急着下结论。",
          "实力这块暂时摸不到边，现在就说上限下限都太早。"
        ])
      );
    }

    const wrongTier = STRENGTH_TIERS[wrongByTwoIndex(current, STRENGTH_TIERS, trainer.strengthBias)];
    const wrongText = textVariant([
      "这孩子的底子我看得很清楚，就是{tier}。",
      "这孩子的底子我心里有数，按现在的观感，就是{tier}。"
    ], { tier: wrongTier.label });
    return detail(
      "strength",
      "实力",
      accuracy,
      wrongText,
      { tier: wrongTier.id }
    );
  }

  function gradeText(grade) {
    return GRADE_LABELS[grade] || "不好判断";
  }

  function surfaceTypeLabel(type) {
    return type === "二刀流" ? "二刀流" : `${type}马`;
  }

  function surfacesForType(type) {
    if (type === "草地") return ["草地"];
    if (type === "泥地") return ["泥地"];
    if (type === "二刀流") return ["草地", "泥地"];
    return [];
  }

  function surfaceGrade(horse, focus) {
    const source = focus.group === "dirt" ? horse.dirt : horse.grass;
    return (source && source[focus.region]) || "B";
  }

  function wrongSurfaceType(actual) {
    return nonMatchingValue(actual, SURFACE_TYPES);
  }

  function surfaceComment(horse, trainer) {
    const accuracy = chooseAccuracy(trainer, "surface");
    const actualType = horse.surfacePref || "草地";
    const typeText = surfaceTypeLabel(actualType);
    const first = trainer.focusSurfaces[0];
    const second = trainer.focusSurfaces[1];
    const firstGrade = surfaceGrade(horse, first);
    const secondGrade = surfaceGrade(horse, second);

    if (accuracy === "precise") {
      const text = textVariant([
        "{first}{firstGrade}，{second}{secondGrade}。整体看，它更像{type}。",
        "{first}跑起来应该{firstGrade}，{second}也能看出是{secondGrade}。总的来说，它更偏{type}。"
      ], {
        first: first.label,
        firstGrade: gradeText(firstGrade),
        second: second.label,
        secondGrade: gradeText(secondGrade),
        type: typeText
      });
      return detail(
        "surface",
        "场地",
        accuracy,
        text,
        {
          surfaceType: actualType,
          grades: [
            { surface: first.label, grade: firstGrade },
            { surface: second.label, grade: secondGrade }
          ]
        },
        { surfaces: surfacesForType(actualType) }
      );
    }

    if (accuracy === "close") {
      const picked = R.roll(2) === 1 ? first : second;
      const grade = picked === first ? firstGrade : secondGrade;
      const text = textVariant([
        "{surface}这边我看是{grade}。大方向上，它应该是{type}。",
        "{surface}这一项，我看大概是{grade}。整体路子还是按{type}来走。"
      ], {
        surface: picked.label,
        grade: gradeText(grade),
        type: typeText
      });
      return detail(
        "surface",
        "场地",
        accuracy,
        text,
        {
          surfaceType: actualType,
          grades: [{ surface: picked.label, grade }]
        },
        { surfaces: surfacesForType(actualType) }
      );
    }

    if (accuracy === "fuzzy") {
      const text = textVariant([
        "场地大方向先按{type}来想，具体哪块场地最合脚还得再跑。",
        "场地先往{type}这个方向想，细分到哪一块最舒服，还得等它正式跑一场。"
      ], { type: typeText });
      return detail(
        "surface",
        "场地",
        accuracy,
        text,
        { surfaceType: actualType },
        { surfaces: surfacesForType(actualType) }
      );
    }

    if (accuracy === "unknown") {
      return detail(
        "surface",
        "场地",
        accuracy,
        pickOne([
          "场地这块现在还看不明白，草地和泥地都不能太早下判断。",
          "场地适性现在还没露出来，草地泥地都先别急着定性。"
        ])
      );
    }

    const wrongType = wrongSurfaceType(actualType);
    const wrongText = textVariant([
      "场地大方向先按{type}来想，具体哪块场地最合脚还得再跑。",
      "场地先往{type}这个方向想，细分到哪一块最舒服，还得等它正式跑一场。"
    ], { type: surfaceTypeLabel(wrongType) });
    return detail(
      "surface",
      "场地",
      accuracy,
      wrongText,
      { surfaceType: wrongType },
      { surfaces: surfacesForType(wrongType) }
    );
  }

  function getDistanceType(distance) {
    return DISTANCE_TYPES.find((item) => distance >= item.min && distance <= item.max) || DISTANCE_TYPES[2];
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

  function outsideDistanceTypes(min, max) {
    return DISTANCE_TYPES.filter((item) => max < item.min || min > item.max);
  }

  function staminaClaimFromTypes(types) {
    const hasShortSide = types.some((item) => item.id === "sprint" || item.id === "mile");
    const hasLongSide = types.some((item) => item.id === "middle" || item.id === "classic" || item.id === "long");
    if (hasShortSide && hasLongSide) return R.roll(2) === 1 ? "short" : "stays";
    return hasShortSide ? "short" : "stays";
  }

  function staminaLock(claim) {
    return claim === "short"
      ? { min: 1000, max: 1800 }
      : { min: 1600, max: 4200 };
  }

  function staminaText(claim) {
    return claim === "short"
      ? pickOne([
        "耐力不算好，短距离到英里一带更稳。",
        "它的耐力看着不算厚，短距离到英里会更稳当。"
      ])
      : pickOne([
        "耐力看着还行，中距离以上可以认真考虑。",
        "它的耐力底子还可以，中距离往上可以试着安排。"
      ]);
  }

  function distanceComment(horse, trainer) {
    const accuracy = chooseAccuracy(trainer, "distance");
    const types = distanceSpanTypes(horse.distMin, horse.distMax);

    if (accuracy === "precise") {
      const text = textVariant([
        "距离我会直接定在{min}-{max}m，这段最能发挥它。",
        "距离上我会把它放在{min}-{max}m，这一段最像它能跑开的范围。"
      ], { min: horse.distMin, max: horse.distMax });
      return detail(
        "distance",
        "距离",
        accuracy,
        text,
        { min: horse.distMin, max: horse.distMax },
        { distance: { min: horse.distMin, max: horse.distMax } }
      );
    }

    if (accuracy === "close") {
      const useMax = R.roll(2) === 1;
      const target = useMax ? getDistanceType(horse.distMax) : getDistanceType(horse.distMin);
      const range = useMax
        ? { min: DISTANCE_TYPES[0].min, max: target.max }
        : { min: target.min, max: DISTANCE_TYPES[DISTANCE_TYPES.length - 1].max };
      return detail(
        "distance",
        "距离",
        accuracy,
        useMax
          ? textVariant([
            "上限大概能摸到{type}，再长就先别贪。",
            "上限大概到{type}就差不多，再往上加我不太放心。"
          ], { type: target.label })
          : textVariant([
            "下限大概从{type}起步，太短的比赛可能忙不过来。",
            "下限大概得从{type}开始，太短的话节奏可能跟不上。"
          ], { type: target.label }),
        { boundary: useMax ? "max" : "min", type: target.id },
        { distance: range }
      );
    }

    if (accuracy === "fuzzy") {
      const claim = staminaClaimFromTypes(types);
      return detail(
        "distance",
        "距离",
        accuracy,
        staminaText(claim),
        { stamina: claim },
        { distance: staminaLock(claim) }
      );
    }

    if (accuracy === "unknown") {
      return detail(
        "distance",
        "距离",
        accuracy,
        pickOne([
          "距离适性现在看不出来，短的长的都不能急着断言。",
          "距离这块还没有准数，短的长的现在都不能说死。"
        ])
      );
    }

    const outside = outsideDistanceTypes(horse.distMin, horse.distMax);
    if (outside.length) {
      const wrong = pickOne(outside);
      const wrongClaim = wrong.id === "sprint" || wrong.id === "mile" ? "short" : "stays";
      return detail(
        "distance",
        "距离",
        accuracy,
        staminaText(wrongClaim),
        { type: wrong.id, stamina: wrongClaim },
        { distance: { min: wrong.min, max: wrong.max } }
      );
    }

    const wrongClaim = R.roll(2) === 1 ? "short" : "stays";
    return detail(
      "distance",
      "距离",
      accuracy,
      staminaText(wrongClaim),
      { stamina: wrongClaim },
      { distance: staminaLock(wrongClaim) }
    );
  }

  function growthGroup(growthType) {
    if (growthType === "早熟") return { label: "长得快", types: ["早熟", "普早"] };
    if (growthType === "普早") {
      return R.roll(2) === 1
        ? { label: "长得快", types: ["早熟", "普早"] }
        : { label: "普普通通", types: ["普早", "普迟"] };
    }
    if (growthType === "普迟") {
      return R.roll(2) === 1
        ? { label: "普普通通", types: ["普早", "普迟"] }
        : { label: "长得慢", types: ["普迟", "晚熟"] };
    }
    return { label: "长得慢", types: ["普迟", "晚熟"] };
  }

  function growthComment(horse, trainer) {
    const accuracy = chooseAccuracy(trainer, "growth");

    if (accuracy === "precise") {
      const text = textVariant([
        "成熟期我看得比较清楚，大概是{start}到{end}。",
        "成熟期我大概能摸出来，应该会落在{start}到{end}这一段。"
      ], { start: horse.peakStart, end: horse.peakEnd });
      return detail(
        "growth",
        "成熟速度",
        accuracy,
        text,
        { peakStart: horse.peakStart, peakEnd: horse.peakEnd },
        { growthTypes: [horse.growthType] }
      );
    }

    if (accuracy === "close") {
      const text = textVariant([
        "成长型大概就是{growth}，排赛时机要照这个来。",
        "成长型我会按{growth}来看，出赛节奏也照这个方向排。"
      ], { growth: horse.growthType });
      return detail(
        "growth",
        "成熟速度",
        accuracy,
        text,
        { growthType: horse.growthType },
        { growthTypes: [horse.growthType] }
      );
    }

    if (accuracy === "fuzzy") {
      const group = growthGroup(horse.growthType);
      const text = textVariant([
        "成长节奏看着{group}，不用把时间点卡得太死。",
        "成长节奏大概是{group}这一类，时间点不用卡得太细。"
      ], { group: group.label });
      return detail(
        "growth",
        "成熟速度",
        accuracy,
        text,
        { growthGroup: group.label, growthTypes: group.types.slice() },
        { growthTypes: group.types.slice() }
      );
    }

    if (accuracy === "unknown") {
      return detail(
        "growth",
        "成熟速度",
        accuracy,
        pickOne([
          "成熟速度现在还不好说，太早定出道窗口反而容易误判。",
          "成熟速度还藏着，现在贸然定窗口，容易把它带偏。"
        ])
      );
    }

    const wrongGrowth = nonMatchingValue(horse.growthType, GROWTH_TYPES);
    const wrongText = textVariant([
      "成长型大概就是{growth}，排赛时机要照这个来。",
      "成长型我会按{growth}来看，出赛节奏也照这个方向排。"
    ], { growth: wrongGrowth });
    return detail(
      "growth",
      "成熟速度",
      accuracy,
      wrongText,
      { growthType: wrongGrowth },
      { growthTypes: [wrongGrowth] }
    );
  }

  function temperamentClass(label) {
    if (label === "极端暴躁" || label === "暴躁") return "暴躁";
    if (label === "沉稳" || label === "冷静") return "沉稳";
    if (label === "极其聪明") return "聪明";
    return "一般";
  }

  function temperamentFuzzy(label) {
    return ["极端暴躁", "暴躁", "胆小"].includes(label) ? "坏" : "好";
  }

  function wrongTemperament(label) {
    const bad = ["极端暴躁", "暴躁", "胆小"];
    const good = ["沉稳", "冷静", "极其聪明"];
    if (bad.includes(label)) return pickOne(good);
    if (good.includes(label)) return pickOne(bad);
    return nonMatchingValue(label, TEMPERAMENT_TYPES);
  }

  function temperamentComment(horse, trainer) {
    const accuracy = chooseAccuracy(trainer, "temperament");

    if (accuracy === "precise") {
      const text = textVariant([
        "气性我看得很直接，就是{temperament}。",
        "气性这点我看得很明白，就是{temperament}。"
      ], { temperament: horse.temperamentLabel });
      return detail(
        "temperament",
        "气性",
        accuracy,
        text,
        { temperament: horse.temperamentLabel }
      );
    }

    if (accuracy === "close") {
      const group = temperamentClass(horse.temperamentLabel);
      const text = textVariant([
        "气性大概属于{group}这一类，比赛里要按这个脾气去准备。",
        "气性大概归到{group}这一类，临场准备要照着它的脾气来。"
      ], { group });
      return detail(
        "temperament",
        "气性",
        accuracy,
        text,
        { temperamentGroup: group }
      );
    }

    if (accuracy === "fuzzy") {
      const quality = temperamentFuzzy(horse.temperamentLabel);
      const text = textVariant([
        "气性大方向看着偏{quality}，进了闸以后还要再观察。",
        "气性大方向偏{quality}，但进闸以后会不会变样，还得再看。"
      ], { quality });
      return detail(
        "temperament",
        "气性",
        accuracy,
        text,
        { temperamentQuality: quality }
      );
    }

    if (accuracy === "unknown") {
      return detail(
        "temperament",
        "气性",
        accuracy,
        pickOne([
          "气性这块现在看不出来，平时和比赛里可能完全两回事。",
          "气性现在还没定型，平时看着一回事，比赛里可能又是另一回事。"
        ])
      );
    }

    const wrong = wrongTemperament(horse.temperamentLabel);
    const wrongText = textVariant([
      "气性我看得很直接，就是{temperament}。",
      "气性这点我看得很明白，就是{temperament}。"
    ], { temperament: wrong });
    return detail(
      "temperament",
      "气性",
      accuracy,
      wrongText,
      { temperament: wrong }
    );
  }

  function generateDebutCommentDetails(horse, trainerId) {
    const trainer = getTrainer(trainerId || horse.trainerId);
    return [
      strengthComment(horse, trainer),
      surfaceComment(horse, trainer),
      distanceComment(horse, trainer),
      growthComment(horse, trainer),
      temperamentComment(horse, trainer)
    ];
  }

  function mergeGrowthRange(growthTypes) {
    const ranges = {
      "早熟": { start: { age: 2, month: 6, half: 1 }, end: { age: 2, month: 10, half: 2 } },
      "普早": { start: { age: 2, month: 7, half: 1 }, end: { age: 2, month: 12, half: 2 } },
      "普迟": { start: { age: 2, month: 9, half: 1 }, end: { age: 3, month: 2, half: 2 } },
      "晚熟": { start: { age: 2, month: 12, half: 1 }, end: { age: 3, month: 4, half: 2 } }
    };
    const picked = growthTypes.map((type) => ranges[type]).filter(Boolean);
    if (picked.length === 0) return null;
    const startIndex = Math.min(...picked.map((range) => ns.TimeRules.toIndex(range.start.age, range.start.month, range.start.half)));
    const endIndex = Math.max(...picked.map((range) => ns.TimeRules.toIndex(range.end.age, range.end.month, range.end.half)));
    return { startIndex, endIndex };
  }

  function buildDebutLock(commentDetails) {
    const lock = {
      distance: null,
      surfaces: [],
      time: null
    };

    (commentDetails || []).forEach((comment) => {
      if (!comment || !comment.lock) return;
      if (comment.lock.distance) lock.distance = comment.lock.distance;
      if (comment.lock.surfaces) lock.surfaces = comment.lock.surfaces.slice();
      if (comment.lock.growthTypes) lock.time = mergeGrowthRange(comment.lock.growthTypes);
    });

    return lock;
  }

  function generateDebutComments(horse, trainerId) {
    return generateDebutCommentDetails(horse, trainerId).map((comment) => comment.text);
  }

  ns.CommentRules = {
    ACCURACY_LABELS,
    TRAINERS,
    getTrainer,
    getTrainerOptions,
    generateDebutComments,
    generateDebutCommentDetails,
    buildDebutLock
  };
})();
