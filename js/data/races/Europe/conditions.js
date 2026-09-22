(function () {
  const ns = (window.Keiba = window.Keiba || {});
  const D = ns.RaceData;

  const COUNTRY_IDS = {
    "英国": "britain",
    "爱尔兰": "ireland",
    "法国": "france",
    "德国": "germany",
    "意大利": "italy"
  };

  const COUNTRY_EN = {
    "英国": "British",
    "爱尔兰": "Irish",
    "法国": "French",
    "德国": "German",
    "意大利": "Italian"
  };

  const HALF_IDS = {
    1: "early",
    2: "late"
  };

  const MAIDEN_RACES = [
    [2, 6, 1, "英国", 1000],
    [2, 6, 2, "爱尔兰", 1200],
    [2, 7, 1, "法国", 1200],
    [2, 7, 2, "英国", 1400],
    [2, 8, 1, "爱尔兰", 1400],
    [2, 8, 2, "法国", 1600],
    [2, 9, 1, "德国", 1400],
    [2, 9, 2, "英国", 1600],
    [2, 10, 1, "爱尔兰", 1600],
    [2, 10, 2, "法国", 1800],
    [2, 11, 1, "意大利", 1600],
    [2, 11, 2, "德国", 1800],
    [2, 12, 1, "英国", 2000],
    [2, 12, 2, "法国", 2000],
    [2, 12, 2, "爱尔兰", 1400],
    [2, 12, 2, "意大利", 1800],
    [3, 1, 1, "法国", 1600],
    [3, 1, 2, "英国", 1800],
    [3, 1, 2, "英国", 1200],
    [3, 2, 1, "爱尔兰", 1600],
    [3, 2, 2, "德国", 2000],
    [3, 3, 1, "法国", 2000],
    [3, 3, 1, "德国", 2400],
    [3, 3, 2, "英国", 2200],
    [3, 4, 1, "爱尔兰", 2000],
    [3, 4, 1, "爱尔兰", 1200],
    [3, 4, 2, "意大利", 2200],
    [3, 5, 1, "法国", 2400],
    [3, 5, 2, "英国", 1600],
    [3, 5, 2, "法国", 2800],
    [3, 6, 1, "德国", 2400],
    [3, 6, 2, "爱尔兰", 2000],
    [3, 7, 1, "法国", 1200],
    [3, 7, 1, "爱尔兰", 2400],
    [3, 7, 2, "英国", 2800],
    [3, 8, 1, "意大利", 1800],
    [3, 8, 2, "德国", 2200],
    [3, 8, 2, "德国", 3000],
    [3, 9, 1, "法国", 1600],
    [3, 9, 2, "爱尔兰", 2400],
    [3, 9, 2, "法国", 1000],
    [3, 10, 1, "英国", 2000],
    [3, 10, 2, "法国", 2800],
    [3, 11, 1, "德国", 1600],
    [3, 11, 2, "意大利", 2400],
    [3, 11, 2, "爱尔兰", 3200],
    [3, 12, 1, "爱尔兰", 2000],
    [3, 12, 1, "意大利", 1200],
    [3, 12, 2, "法国", 2200],
    [3, 12, 2, "英国", 2600]
  ];

  const LOW_RACES = [
    [2, 7, 1, "英国", 1000],
    [2, 7, 2, "爱尔兰", 1200],
    [2, 8, 1, "法国", 1200],
    [2, 8, 2, "英国", 1400],
    [2, 9, 1, "爱尔兰", 1400],
    [2, 9, 2, "法国", 1600],
    [2, 10, 1, "德国", 1600],
    [2, 10, 2, "英国", 1800],
    [2, 11, 2, "意大利", 1800],
    [2, 12, 2, "法国", 2000],
    [3, 1, 1, "法国", 1200],
    [3, 1, 2, "英国", 1600],
    [3, 2, 1, "意大利", 2400],
    [3, 2, 2, "爱尔兰", 1800],
    [3, 3, 1, "法国", 2000],
    [3, 3, 2, "德国", 2200],
    [3, 4, 1, "英国", 2000],
    [3, 4, 2, "爱尔兰", 2400],
    [3, 4, 2, "英国", 1000],
    [3, 5, 1, "法国", 1600],
    [3, 5, 2, "意大利", 2200],
    [3, 6, 1, "英国", 2400],
    [3, 6, 2, "德国", 2800],
    [3, 7, 1, "法国", 1200],
    [3, 7, 2, "爱尔兰", 2000],
    [3, 8, 1, "英国", 1600],
    [3, 8, 2, "意大利", 2400],
    [3, 9, 1, "法国", 2200],
    [3, 9, 2, "德国", 1600],
    [3, 10, 1, "爱尔兰", 1200],
    [3, 10, 2, "英国", 2800],
    [3, 11, 1, "法国", 2600],
    [3, 12, 1, "英国", 3000],
    [3, 12, 2, "法国", 2000],
    [4, 1, 2, "爱尔兰", 1600],
    [4, 2, 1, "法国", 1200],
    [4, 2, 2, "法国", 2200],
    [4, 3, 2, "英国", 2400],
    [4, 4, 2, "德国", 2800],
    [4, 5, 2, "爱尔兰", 2000],
    [4, 6, 1, "爱尔兰", 2400],
    [4, 6, 2, "法国", 1200],
    [4, 7, 1, "法国", 2800],
    [4, 7, 2, "意大利", 1600],
    [4, 8, 2, "英国", 2000],
    [4, 9, 1, "英国", 1000],
    [4, 9, 2, "德国", 2400],
    [4, 10, 2, "法国", 2800],
    [4, 11, 2, "爱尔兰", 1800],
    [4, 12, 1, "德国", 2600],
    [4, 12, 1, "爱尔兰", 3200],
    [4, 12, 2, "英国", 2200]
  ];

  const LISTED_RACES = [
    { id: "cammidge-trophy", country: "英国", nameOriginal: "Cammidge Trophy", nameZh: "坎米奇锦标", month: 3, half: 2, distance: 1200, ageRule: "3岁以上" },
    { id: "doncaster-mile-stakes", country: "英国", nameOriginal: "Doncaster Mile Stakes", nameZh: "唐卡士打一哩锦标", month: 3, half: 2, distance: 1600, ageRule: "4岁以上" },
    { id: "goliath-cup-stakes", country: "英国", nameOriginal: "Goliath Cup Stakes", nameZh: "哥利亚杯锦标", month: 4, half: 1, distance: 2800, ageRule: "4岁以上" },
    { id: "feilden-stakes", country: "英国", nameOriginal: "Feilden Stakes", nameZh: "菲尔登锦标", month: 4, half: 1, distance: 1800, ageRule: "3岁" },
    { id: "blue-riband-trial-stakes", country: "英国", nameOriginal: "Blue Riband Trial Stakes", nameZh: "蓝绶带预赛锦标", month: 4, half: 2, distance: 2000, ageRule: "3岁" },
    { id: "newmarket-stakes", country: "英国", nameOriginal: "Newmarket Stakes", nameZh: "新市场锦标", month: 5, half: 1, distance: 2000, ageRule: "3岁" },
    { id: "paradise-stakes", country: "英国", nameOriginal: "Paradise Stakes", nameZh: "天堂锦标", month: 5, half: 1, distance: 1600, ageRule: "4岁以上" },
    { id: "king-charles-ii-stakes", country: "英国", nameOriginal: "King Charles II Stakes", nameZh: "查理二世国王锦标", month: 5, half: 1, distance: 1400, ageRule: "3岁" },
    { id: "carnarvon-stakes", country: "英国", nameOriginal: "Carnarvon Stakes", nameZh: "卡纳芬锦标", month: 5, half: 2, distance: 1200, ageRule: "3岁" },
    { id: "national-stakes", country: "英国", nameOriginal: "National Stakes", nameZh: "国家锦标", month: 5, half: 2, distance: 1000, ageRule: "2岁" },
    { id: "heron-stakes", country: "英国", nameOriginal: "Heron Stakes", nameZh: "苍鹭锦标", month: 5, half: 2, distance: 1600, ageRule: "3岁" },
    { id: "scurry-stakes", country: "英国", nameOriginal: "Scurry Stakes", nameZh: "疾驰锦标", month: 6, half: 1, distance: 1000, ageRule: "3岁" },
    { id: "grand-cup", country: "英国", nameOriginal: "Grand Cup", nameZh: "大奖杯", month: 6, half: 1, distance: 2800, ageRule: "4岁以上" },
    { id: "wolferton-stakes", country: "英国", nameOriginal: "Wolferton Stakes", nameZh: "沃尔弗顿锦标", month: 6, half: 2, distance: 2000, ageRule: "4岁以上" },
    { id: "chesham-stakes", country: "英国", nameOriginal: "Chesham Stakes", nameZh: "切舍姆锦标", month: 6, half: 2, distance: 1400, ageRule: "2岁" },
    { id: "dragon-stakes", country: "英国", nameOriginal: "Dragon Stakes", nameZh: "龙锦标", month: 7, half: 1, distance: 1000, ageRule: "2岁" },
    { id: "gala-stakes", country: "英国", nameOriginal: "Gala Stakes", nameZh: "庆典锦标", month: 7, half: 1, distance: 2000, ageRule: "3岁以上" },
    { id: "esher-stakes", country: "英国", nameOriginal: "Esher Stakes", nameZh: "伊舍锦标", month: 7, half: 1, distance: 3200, ageRule: "4岁以上" },
    { id: "coral-distaff", country: "英国", nameOriginal: "Coral Distaff", nameZh: "珊瑚雌马锦标", month: 7, half: 1, distance: 1600, ageRule: "3岁", sexRestriction: "牝马" },

    { id: "devoy-stakes", country: "爱尔兰", nameOriginal: "Devoy Stakes", nameZh: "德沃伊锦标", month: 3, half: 2, distance: 2100, ageRule: "4岁以上" },
    { id: "gladness-stakes", country: "爱尔兰", nameOriginal: "Gladness Stakes", nameZh: "喜悦锦标", month: 3, half: 2, distance: 1400, ageRule: "3岁以上" },
    { id: "cork-stakes", country: "爱尔兰", nameOriginal: "Cork Stakes", nameZh: "科克锦标", month: 4, half: 1, distance: 1200, ageRule: "3岁以上" },
    { id: "noblesse-stakes", country: "爱尔兰", nameOriginal: "Noblesse Stakes", nameZh: "贵族锦标", month: 4, half: 1, distance: 2400, ageRule: "4岁以上", sexRestriction: "牝马" },
    { id: "heritage-stakes", country: "爱尔兰", nameOriginal: "Heritage Stakes", nameZh: "传承锦标", month: 4, half: 1, distance: 1600, ageRule: "4岁以上" },
    { id: "committed-stakes", country: "爱尔兰", nameOriginal: "Committed Stakes", nameZh: "坚定锦标", month: 4, half: 2, distance: 1200, ageRule: "3岁" },
    { id: "vintage-crop-stakes", country: "爱尔兰", nameOriginal: "Vintage Crop Stakes", nameZh: "复古佳酿锦标", month: 4, half: 2, distance: 2800, ageRule: "4岁以上" },
    { id: "woodlands-stakes", country: "爱尔兰", nameOriginal: "Woodlands Stakes", nameZh: "林地锦标", month: 4, half: 2, distance: 1000, ageRule: "3岁以上" },
    { id: "first-flier-stakes", country: "爱尔兰", nameOriginal: "First Flier Stakes", nameZh: "初飞者锦标", month: 5, half: 1, distance: 1000, ageRule: "2岁" },
    { id: "tetrarch-stakes", country: "爱尔兰", nameOriginal: "Tetrarch Stakes", nameZh: "泰特拉克锦标", month: 5, half: 1, distance: 1600, ageRule: "3岁" },
    { id: "yeats-stakes", country: "爱尔兰", nameOriginal: "Yeats Stakes", nameZh: "叶芝锦标", month: 5, half: 2, distance: 2600, ageRule: "3岁" },
    { id: "sole-power-sprint-stakes", country: "爱尔兰", nameOriginal: "Sole Power Sprint Stakes", nameZh: "独力短途锦标", month: 5, half: 2, distance: 1000, ageRule: "3岁以上" },
    { id: "king-george-v-cup", country: "爱尔兰", nameOriginal: "King George V Cup", nameZh: "乔治五世国王杯", month: 6, half: 1, distance: 2400, ageRule: "3岁" },
    { id: "glencairn-stakes", country: "爱尔兰", nameOriginal: "Glencairn Stakes", nameZh: "格伦凯恩锦标", month: 6, half: 1, distance: 1800, ageRule: "3岁以上" },
    { id: "midsummer-sprint-stakes", country: "爱尔兰", nameOriginal: "Midsummer Sprint Stakes", nameZh: "仲夏短途锦标", month: 6, half: 1, distance: 1000, ageRule: "3岁以上" },
    { id: "belgrave-stakes", country: "爱尔兰", nameOriginal: "Belgrave Stakes", nameZh: "贝尔格雷夫锦标", month: 6, half: 2, distance: 1200, ageRule: "3岁以上" },
    { id: "lenebane-stakes", country: "爱尔兰", nameOriginal: "Lenebane Stakes", nameZh: "莱纳贝恩锦标", month: 6, half: 2, distance: 2400, ageRule: "3岁以上" },
    { id: "tipperary-stakes", country: "爱尔兰", nameOriginal: "Tipperary Stakes", nameZh: "蒂珀雷里锦标", month: 7, half: 1, distance: 1000, ageRule: "2岁" },
    { id: "marble-city-stakes", country: "爱尔兰", nameOriginal: "Marble City Stakes", nameZh: "大理石城锦标", month: 7, half: 2, distance: 2400, ageRule: "3岁" },
    { id: "vinnie-roe-stakes", country: "爱尔兰", nameOriginal: "Vinnie Roe Stakes", nameZh: "维尼罗锦标", month: 8, half: 2, distance: 2800, ageRule: "3岁" },

    { id: "prix-francois-mathet", country: "法国", nameOriginal: "Prix Francois Mathet", nameZh: "弗朗索瓦·马泰锦标", month: 3, half: 2, distance: 2100, ageRule: "3岁" },
    { id: "prix-omnium-ii", country: "法国", nameOriginal: "Prix Omnium II", nameZh: "奥姆尼姆二世锦标", month: 3, half: 2, distance: 1600, ageRule: "3岁" },
    { id: "prix-la-camargo", country: "法国", nameOriginal: "Prix La Camargo", nameZh: "拉卡马戈锦标", month: 3, half: 2, distance: 1600, ageRule: "3岁", sexRestriction: "牝马" },
    { id: "prix-ronde-de-nuit", country: "法国", nameOriginal: "Prix Ronde de Nuit", nameZh: "夜巡锦标", month: 3, half: 2, distance: 1100, ageRule: "3岁" },
    { id: "prix-right-royal", country: "法国", nameOriginal: "Prix Right Royal", nameZh: "正统王室锦标", month: 4, half: 1, distance: 3000, ageRule: "4岁以上" },
    { id: "prix-zarkava", country: "法国", nameOriginal: "Prix Zarkava", nameZh: "扎卡瓦锦标", month: 4, half: 1, distance: 2100, ageRule: "4岁以上", sexRestriction: "牝马" },
    { id: "prix-cor-de-chasse", country: "法国", nameOriginal: "Prix Cor de Chasse", nameZh: "猎号锦标", month: 4, half: 1, distance: 1100, ageRule: "4岁以上" },
    { id: "prix-lord-seymour", country: "法国", nameOriginal: "Prix Lord Seymour", nameZh: "西摩勋爵锦标", month: 4, half: 2, distance: 2400, ageRule: "4岁以上" },
    { id: "prix-jacques-laffitte", country: "法国", nameOriginal: "Prix Jacques Laffitte", nameZh: "雅克·拉菲特锦标", month: 4, half: 2, distance: 1850, ageRule: "4岁以上" },
    { id: "prix-maurice-zilber", country: "法国", nameOriginal: "Prix Maurice Zilber", nameZh: "莫里斯·齐尔贝锦标", month: 5, half: 1, distance: 1400, ageRule: "4岁以上", sexRestriction: "牝马" },
    { id: "prix-de-suresnes", country: "法国", nameOriginal: "Prix de Suresnes", nameZh: "叙雷讷锦标", month: 5, half: 1, distance: 2000, ageRule: "3岁" },
    { id: "prix-servanne", country: "法国", nameOriginal: "Prix Servanne", nameZh: "瑟瓦讷锦标", month: 5, half: 1, distance: 1200, ageRule: "4岁以上" },
    { id: "prix-gold-river", country: "法国", nameOriginal: "Prix Gold River", nameZh: "金河锦标", month: 5, half: 2, distance: 2800, ageRule: "4岁以上", sexRestriction: "牝马" },
    { id: "prix-de-la-seine", country: "法国", nameOriginal: "Prix de la Seine", nameZh: "塞纳锦标", month: 5, half: 2, distance: 2200, ageRule: "3岁", sexRestriction: "牝马" },
    { id: "prix-matchem", country: "法国", nameOriginal: "Prix Matchem", nameZh: "马彻姆锦标", month: 6, half: 1, distance: 1800, ageRule: "3岁" },
    { id: "prix-la-fleche", country: "法国", nameOriginal: "Prix La Fleche", nameZh: "拉弗莱什锦标", month: 6, half: 1, distance: 1000, ageRule: "2岁" },
    { id: "prix-andre-baboin", country: "法国", nameOriginal: "Prix Andre Baboin", nameZh: "安德烈·巴博安锦标", month: 10, half: 1, distance: 1900, ageRule: "3岁以上" },
    { id: "prix-isonomy", country: "法国", nameOriginal: "Prix Isonomy", nameZh: "伊索诺米锦标", month: 10, half: 2, distance: 1600, ageRule: "2岁" },
    { id: "prix-yacowlef", country: "法国", nameOriginal: "Prix Yacowlef", nameZh: "雅科夫列夫锦标", month: 7, half: 1, distance: 1000, ageRule: "2岁" },
    { id: "prix-herod", country: "法国", nameOriginal: "Prix Herod", nameZh: "希律锦标", month: 11, half: 2, distance: 1400, ageRule: "2岁" },

    { id: "benazet-rennen", country: "德国", nameOriginal: "Benazet-Rennen", nameZh: "贝纳泽特大赛", month: 5, half: 2, distance: 1200, ageRule: "3岁以上" },
    { id: "grand-prix-aufgalopp", country: "德国", nameOriginal: "Grand Prix-Aufgalopp", nameZh: "开季大奖赛", month: 4, half: 1, distance: 2100, ageRule: "4岁以上" },

    { id: "premio-primi-passi", country: "意大利", nameOriginal: "Premio Primi Passi", nameZh: "初步锦标", month: 6, half: 2, distance: 1200, ageRule: "2岁" },
    { id: "premio-carlo-dalessio", country: "意大利", nameOriginal: "Premio Carlo d'Alessio", nameZh: "卡洛·德亚历西奥锦标", month: 5, half: 2, distance: 2400, ageRule: "4岁以上" },
    { id: "premio-omenoni", country: "意大利", nameOriginal: "Premio Omenoni", nameZh: "奥梅诺尼锦标", month: 10, half: 2, distance: 1000, ageRule: "3岁以上" },
    { id: "premio-carlo-e-francesco-aloisi", country: "意大利", nameOriginal: "Premio Carlo e Francesco Aloisi", nameZh: "卡洛与弗朗切斯科·阿洛伊西锦标", month: 11, half: 1, distance: 1200, ageRule: "2岁以上", ageRestriction: { type: "min", age: 2 } }
  ];

  function makeRace(kind, entry, index) {
    const [age, month, half, country, distance] = entry;
    const isMaiden = kind === "maiden";
    const classLabelZh = isMaiden ? "未胜利赛" : "低级赛";
    const classLabelEn = isMaiden ? "Maiden" : "Novice";
    const countryId = COUNTRY_IDS[country] || "europe";
    const countryEn = COUNTRY_EN[country] || "European";

    return {
      id: `europe-${kind}-${age}-${month}-${HALF_IDS[half] || "early"}-${countryId}-${distance}-${index + 1}`,
      nameOriginal: `${countryEn} Turf ${distance}m ${classLabelEn}`,
      nameZh: `${country}${age}岁草地${distance}m${classLabelZh}`,
      grade: isMaiden ? "未胜利" : "低级赛",
      raceClass: isMaiden ? "maiden" : "one-win",
      month,
      half,
      surface: "草地",
      course: country,
      distance,
      ageRule: `${age}岁`,
      ageRestriction: { type: "exact", age }
    };
  }

  function makeListedRace(spec) {
    const race = {
      id: `europe-listed-${spec.id}`,
      nameOriginal: spec.nameOriginal,
      nameZh: spec.nameZh || spec.nameOriginal,
      grade: "OP/L",
      raceClass: "op",
      month: spec.month,
      half: spec.half,
      surface: "草地",
      course: spec.country || "其他地方",
      distance: spec.distance,
      ageRule: spec.ageRule
    };
    if (spec.ageRestriction) race.ageRestriction = spec.ageRestriction;
    if (spec.sexRestriction) race.sexRestriction = spec.sexRestriction;
    return race;
  }

  D.registerNamedRaces("欧洲", "conditions", [
    ...MAIDEN_RACES.map((entry, index) => makeRace("maiden", entry, index)),
    ...LOW_RACES.map((entry, index) => makeRace("low", entry, index)),
    ...LISTED_RACES.map(makeListedRace)
  ]);
})();
