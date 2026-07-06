(function () {
  const ns = (window.Keiba = window.Keiba || {});
  const D = ns.RaceData;

  const SURFACE_EN = {
    "泥地": "Dirt",
    "草地": "Turf"
  };

  const SURFACE_IDS = {
    "泥地": "dirt",
    "草地": "turf"
  };

  const HALF_IDS = {
    1: "early",
    2: "late"
  };

  const MAIDEN_RACES = [
    [2, 6, 1, "泥地", 1000],
    [2, 6, 2, "泥地", 1200],
    [2, 6, 2, "草地", 1000],
    [2, 7, 1, "泥地", 1200],
    [2, 7, 2, "草地", 1000],
    [2, 8, 1, "泥地", 1200],
    [2, 8, 2, "草地", 1200],
    [2, 9, 1, "泥地", 1400],
    [2, 9, 2, "草地", 1400],
    [2, 9, 2, "泥地", 1600],
    [2, 10, 1, "泥地", 1600],
    [2, 10, 2, "草地", 1600],
    [2, 11, 1, "泥地", 1700],
    [2, 11, 2, "草地", 1600],
    [2, 12, 1, "泥地", 1700],
    [2, 12, 2, "草地", 1700],
    [3, 1, 1, "泥地", 1200],
    [3, 1, 2, "泥地", 1600],
    [3, 2, 1, "泥地", 1400],
    [3, 2, 2, "草地", 1600],
    [3, 3, 1, "泥地", 1600],
    [3, 3, 1, "泥地", 1800],
    [3, 3, 2, "草地", 1800],
    [3, 4, 1, "泥地", 1800],
    [3, 4, 2, "草地", 1800],
    [3, 5, 1, "泥地", 1200],
    [3, 5, 2, "草地", 2000],
    [3, 6, 1, "泥地", 1600],
    [3, 6, 2, "草地", 2200],
    [3, 7, 1, "泥地", 1200],
    [3, 7, 2, "草地", 1600],
    [3, 7, 2, "草地", 2400],
    [3, 8, 1, "泥地", 1700],
    [3, 8, 2, "草地", 1800],
    [3, 9, 1, "泥地", 1400],
    [3, 9, 2, "草地", 2000],
    [3, 10, 1, "泥地", 1800],
    [3, 10, 2, "草地", 2200],
    [3, 11, 1, "泥地", 1200],
    [3, 11, 2, "草地", 1600],
    [3, 12, 1, "泥地", 1600],
    [3, 12, 2, "草地", 2000],
    [4, 1, 1, "泥地", 1200],
    [4, 2, 2, "草地", 1600],
    [4, 3, 1, "泥地", 1600],
    [4, 4, 2, "草地", 1800],
    [4, 5, 1, "泥地", 1800],
    [4, 6, 2, "草地", 2000],
    [4, 7, 1, "泥地", 1200],
    [4, 8, 2, "草地", 2200],
    [4, 9, 1, "泥地", 1600],
    [4, 10, 2, "草地", 2400],
    [4, 11, 1, "泥地", 1800],
    [4, 12, 2, "草地", 2000]
  ];

  const LOW_RACES = [
    [2, 7, 1, "泥地", 1000],
    [2, 8, 1, "泥地", 1200],
    [2, 8, 2, "草地", 1000],
    [2, 9, 1, "泥地", 1200],
    [2, 9, 2, "草地", 1600],
    [2, 10, 1, "泥地", 1400],
    [2, 10, 2, "草地", 1400],
    [2, 11, 1, "泥地", 1600],
    [2, 12, 1, "泥地", 1700],
    [2, 12, 2, "草地", 1600],
    [3, 1, 1, "泥地", 1200],
    [3, 1, 2, "泥地", 1600],
    [3, 2, 1, "泥地", 1400],
    [3, 2, 2, "草地", 1600],
    [3, 3, 1, "泥地", 1600],
    [3, 3, 2, "草地", 1800],
    [3, 4, 1, "泥地", 1800],
    [3, 4, 1, "泥地", 2000],
    [3, 4, 2, "草地", 1800],
    [3, 5, 1, "泥地", 1200],
    [3, 5, 2, "草地", 2000],
    [3, 6, 1, "泥地", 1600],
    [3, 6, 2, "草地", 2200],
    [3, 7, 1, "泥地", 1200],
    [3, 7, 2, "草地", 1600],
    [3, 8, 1, "泥地", 1700],
    [3, 8, 1, "泥地", 2000],
    [3, 8, 2, "草地", 1800],
    [3, 9, 1, "泥地", 1400],
    [3, 9, 2, "草地", 2000],
    [3, 10, 1, "泥地", 1800],
    [3, 10, 2, "草地", 2200],
    [3, 11, 1, "泥地", 1200],
    [3, 11, 2, "草地", 1600],
    [3, 12, 1, "泥地", 1600],
    [3, 12, 2, "草地", 2000],
    [4, 1, 1, "泥地", 1200],
    [4, 1, 2, "草地", 1600],
    [4, 2, 1, "泥地", 1600],
    [4, 3, 1, "泥地", 1800],
    [4, 3, 2, "草地", 1800],
    [4, 4, 1, "泥地", 1200],
    [4, 4, 2, "草地", 2000],
    [4, 5, 2, "泥地", 1600],
    [4, 6, 1, "草地", 2200],
    [4, 6, 1, "泥地", 2000],
    [4, 7, 1, "泥地", 1200],
    [4, 8, 1, "草地", 1600],
    [4, 8, 1, "泥地", 1700],
    [4, 9, 1, "草地", 2000],
    [4, 9, 2, "泥地", 1800],
    [4, 10, 1, "泥地", 1200],
    [4, 10, 2, "草地", 2400],
    [4, 11, 1, "泥地", 1600],
    [4, 12, 1, "泥地", 1800],
    [4, 12, 1, "草地", 2000]
  ];

  const LISTED_RACES = [
    { id: "swale-stakes", nameOriginal: "Swale Stakes", nameZh: "斯韦尔锦标", month: 1, half: 1, surface: "泥地", distance: 1400, ageRule: "3岁" },
    { id: "smarty-jones-stakes-oaklawn", nameOriginal: "Smarty Jones Stakes (Oaklawn)", nameZh: "聪明琼斯锦标（奥克朗）", month: 1, half: 1, surface: "泥地", distance: 1600, ageRule: "3岁" },
    { id: "santa-ynez-stakes", nameOriginal: "Santa Ynez Stakes", nameZh: "圣伊内斯锦标", month: 1, half: 2, surface: "泥地", distance: 1400, ageRule: "3岁", sexRestriction: "牝马" },
    { id: "silverbulletday-stakes", nameOriginal: "Silverbulletday Stakes", nameZh: "银弹日锦标", month: 1, half: 2, surface: "泥地", distance: 1700, ageRule: "3岁", sexRestriction: "牝马" },
    { id: "astra-stakes", nameOriginal: "Astra Stakes", nameZh: "阿斯特拉锦标", month: 1, half: 2, surface: "草地", distance: 2400, ageRule: "4岁以上", sexRestriction: "牝马" },
    { id: "las-virgenes-stakes", nameOriginal: "Las Virgenes Stakes", nameZh: "拉斯维吉尼斯锦标", month: 2, half: 1, surface: "泥地", distance: 1600, ageRule: "3岁", sexRestriction: "牝马" },
    { id: "withers-stakes", nameOriginal: "Withers Stakes", nameZh: "威瑟斯锦标", month: 2, half: 1, surface: "泥地", distance: 1800, ageRule: "3岁" },
    { id: "sunland-park-derby", nameOriginal: "Sunland Park Derby", nameZh: "森兰公园德比", month: 2, half: 2, surface: "泥地", distance: 1700, ageRule: "3岁" },
    { id: "general-george-stakes", nameOriginal: "General George Stakes", nameZh: "乔治将军锦标", month: 2, half: 2, surface: "泥地", distance: 1400, ageRule: "4岁以上" },
    { id: "barbara-fritchie-stakes", nameOriginal: "Barbara Fritchie Stakes", nameZh: "芭芭拉·弗里奇锦标", month: 2, half: 2, surface: "泥地", distance: 1400, ageRule: "4岁以上", sexRestriction: "牝马" },
    { id: "gulfstream-park-sprint-stakes", nameOriginal: "Gulfstream Park Sprint Stakes", nameZh: "湾流园短途锦标", month: 2, half: 2, surface: "泥地", distance: 1200, ageRule: "4岁以上" },
    { id: "gulfstream-park-turf-sprint-stakes", nameOriginal: "Gulfstream Park Turf Sprint Stakes", nameZh: "湾流园草地短途锦标", month: 2, half: 2, surface: "草地", distance: 1000, ageRule: "4岁以上" },
    { id: "sweet-life-stakes", nameOriginal: "Sweet Life Stakes", nameZh: "甜蜜生活锦标", month: 2, half: 2, surface: "草地", distance: 1300, ageRule: "3岁", sexRestriction: "牝马" },
    { id: "hutcheson-stakes", nameOriginal: "Hutcheson Stakes", nameZh: "哈奇森锦标", month: 3, half: 1, surface: "泥地", distance: 1200, ageRule: "3岁" },
    { id: "desert-stormer-stakes", nameOriginal: "Desert Stormer Stakes", nameZh: "沙漠风暴锦标", month: 3, half: 1, surface: "泥地", distance: 1200, ageRule: "4岁以上", sexRestriction: "牝马" },
    { id: "appleton-stakes", nameOriginal: "Appleton Stakes", nameZh: "阿普尔顿锦标", month: 3, half: 2, surface: "草地", distance: 1600, ageRule: "4岁以上" },
    { id: "kona-gold-stakes", nameOriginal: "Kona Gold Stakes", nameZh: "科纳金锦标", month: 4, half: 1, surface: "泥地", distance: 1300, ageRule: "3岁以上" },
    { id: "santa-barbara-stakes", nameOriginal: "Santa Barbara Stakes", nameZh: "圣巴巴拉锦标", month: 4, half: 2, surface: "草地", distance: 2400, ageRule: "4岁以上", sexRestriction: "牝马" },
    { id: "providencia-stakes", nameOriginal: "Providencia Stakes", nameZh: "普罗维登西亚锦标", month: 4, half: 2, surface: "草地", distance: 1800, ageRule: "3岁", sexRestriction: "牝马" },
    { id: "elusive-quality-stakes", nameOriginal: "Elusive Quality Stakes", nameZh: "飘忽品质锦标", month: 5, half: 1, surface: "草地", distance: 1400, ageRule: "4岁以上" },
    { id: "monmouth-stakes", nameOriginal: "Monmouth Stakes", nameZh: "蒙茅斯锦标", month: 5, half: 2, surface: "草地", distance: 1800, ageRule: "3岁以上" },
    { id: "honeymoon-stakes", nameOriginal: "Honeymoon Stakes", nameZh: "蜜月锦标", month: 5, half: 2, surface: "草地", distance: 1800, ageRule: "3岁", sexRestriction: "牝马" },
    { id: "tremont-stakes", nameOriginal: "Tremont Stakes", nameZh: "特里蒙特锦标", month: 6, half: 1, surface: "泥地", distance: 1000, ageRule: "2岁" },
    { id: "bashford-manor-stakes", nameOriginal: "Bashford Manor Stakes", nameZh: "巴什福德庄园锦标", month: 6, half: 2, surface: "泥地", distance: 1200, ageRule: "2岁" },
    { id: "churchill-downs-debutante-stakes", nameOriginal: "Churchill Downs Debutante Stakes", nameZh: "丘吉尔园初登场锦标", month: 6, half: 2, surface: "泥地", distance: 1200, ageRule: "2岁", sexRestriction: "牝马" },
    { id: "pegasus-stakes", nameOriginal: "Pegasus Stakes", nameZh: "飞马锦标", month: 6, half: 2, surface: "泥地", distance: 1700, ageRule: "3岁" },
    { id: "frank-j-de-francis-memorial-dash", nameOriginal: "Frank J. De Francis Memorial Dash", nameZh: "弗兰克·德弗朗西斯纪念短途赛", month: 7, half: 1, surface: "泥地", distance: 1200, ageRule: "3岁以上" },
    { id: "alydar-stakes", nameOriginal: "Alydar Stakes", nameZh: "阿利达锦标", month: 8, half: 1, surface: "泥地", distance: 1800, ageRule: "4岁以上" },
    { id: "shared-belief-stakes", nameOriginal: "Shared Belief Stakes", nameZh: "共同信念锦标", month: 8, half: 2, surface: "泥地", distance: 1600, ageRule: "3岁" },
    { id: "smarty-jones-stakes-parx", nameOriginal: "Smarty Jones Stakes (Parx)", nameZh: "聪明琼斯锦标（帕克斯）", month: 8, half: 2, surface: "泥地", distance: 1700, ageRule: "3岁" },
    { id: "saranac-stakes", nameOriginal: "Saranac Stakes", nameZh: "萨拉纳克锦标", month: 9, half: 1, surface: "草地", distance: 1800, ageRule: "3岁" },
    { id: "remington-park-oaks", nameOriginal: "Remington Park Oaks", nameZh: "雷明顿公园橡树", month: 9, half: 2, surface: "泥地", distance: 1700, ageRule: "3岁", sexRestriction: "牝马" },
    { id: "laurel-futurity-stakes", nameOriginal: "Laurel Futurity Stakes", nameZh: "劳雷尔未来锦标", month: 9, half: 2, surface: "草地", distance: 1700, ageRule: "2岁" },
    { id: "tempted-stakes", nameOriginal: "Tempted Stakes", nameZh: "诱惑锦标", month: 10, half: 1, surface: "泥地", distance: 1600, ageRule: "2岁", sexRestriction: "牝马" },
    { id: "blue-norther-stakes", nameOriginal: "Blue Norther Stakes", nameZh: "蓝北风锦标", month: 10, half: 2, surface: "草地", distance: 1600, ageRule: "2岁", sexRestriction: "牝马" },
    { id: "discovery-stakes", nameOriginal: "Discovery Stakes", nameZh: "探索锦标", month: 11, half: 1, surface: "泥地", distance: 1800, ageRule: "3岁" },
    { id: "selima-stakes", nameOriginal: "Selima Stakes", nameZh: "塞利马锦标", month: 11, half: 1, surface: "草地", distance: 1700, ageRule: "2岁", sexRestriction: "牝马" },
    { id: "cardinal-stakes", nameOriginal: "Cardinal Stakes", nameZh: "红雀锦标", month: 11, half: 2, surface: "草地", distance: 1800, ageRule: "3岁以上", sexRestriction: "牝马" },
    { id: "bob-hope-stakes", nameOriginal: "Bob Hope Stakes", nameZh: "鲍勃·霍普锦标", month: 11, half: 2, surface: "泥地", distance: 1400, ageRule: "2岁" },
    { id: "remington-springboard-mile", nameOriginal: "Remington Springboard Mile", nameZh: "雷明顿跳板一哩赛", month: 12, half: 2, surface: "泥地", distance: 1600, ageRule: "2岁" }
  ];

  function makeRace(kind, entry, index) {
    const [age, month, half, surface, distance] = entry;
    const isMaiden = kind === "maiden";
    const classLabelZh = isMaiden ? "未胜利赛" : "低级赛";
    const classLabelEn = isMaiden ? "Maiden Special Weight" : "Allowance";
    const surfaceId = SURFACE_IDS[surface] || "surface";
    const surfaceEn = SURFACE_EN[surface] || "Surface";

    return {
      id: `america-${kind}-${age}-${month}-${HALF_IDS[half] || "early"}-${surfaceId}-${distance}-${index + 1}`,
      nameOriginal: `American ${surfaceEn} ${distance}m ${classLabelEn}`,
      nameZh: `美国${age}岁${surface}${distance}m${classLabelZh}`,
      grade: isMaiden ? "未胜利" : "低级赛",
      raceClass: isMaiden ? "maiden" : "one-win",
      month,
      half,
      surface,
      course: "美国",
      distance,
      ageRule: `${age}岁`,
      ageRestriction: { type: "exact", age }
    };
  }

  function makeListedRace(spec) {
    const race = {
      id: `america-listed-${spec.id}`,
      nameOriginal: spec.nameOriginal,
      nameZh: spec.nameZh || spec.nameOriginal,
      grade: "OP/L",
      raceClass: "op",
      month: spec.month,
      half: spec.half,
      surface: spec.surface,
      course: "美国",
      distance: spec.distance,
      ageRule: spec.ageRule
    };
    if (spec.ageRestriction) race.ageRestriction = spec.ageRestriction;
    if (spec.sexRestriction) race.sexRestriction = spec.sexRestriction;
    return race;
  }

  D.registerNamedRaces("美国", "conditions", [
    ...MAIDEN_RACES.map((entry, index) => makeRace("maiden", entry, index)),
    ...LOW_RACES.map((entry, index) => makeRace("low", entry, index)),
    ...LISTED_RACES.map(makeListedRace)
  ]);
})();
