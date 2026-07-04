(function () {
  const ns = (window.Keiba = window.Keiba || {});

  const LOCAL_COURSES = ["小仓", "札幌", "中京", "函馆", "福岛", "新潟"];
  const COURSE_IDS = {
    "中山": "nakayama",
    "东京": "tokyo",
    "京都": "kyoto",
    "阪神": "hanshin",
    "小仓": "kokura",
    "札幌": "sapporo",
    "中京": "chukyo",
    "函馆": "hakodate",
    "福岛": "fukushima",
    "新潟": "niigata",
    "其他地方": "local"
  };

  const HALF_SUFFIX = {
    1: "early",
    2: "late"
  };

  const NAMED_RACE_HALVES = {
    "nikkei-shinshun-hai": 2,
    "american-jockey-club-cup": 2,
    "procyon-stakes": 2,
    "kyoto-kinen": 1,
    "nakayama-kinen": 2,
    "tulip-sho": 1,
    "yayoi-sho": 1,
    "fillies-revue": 1,
    "kinko-sho": 1,
    "spring-stakes": 2,
    "hanshin-daishoten": 2,
    "nikkei-sho": 2,
    "new-zealand-trophy": 1,
    "hanshin-himba-stakes": 1,
    "flora-stakes": 2,
    "yomiuri-milers-cup": 2,
    "aoba-sho": 2,
    "kyoto-shimbun-hai": 1,
    "keio-hai-spring-cup": 1,
    "meguro-kinen": 2,
    "sapporo-kinen": 2,
    "shion-stakes": 1,
    "centaur-stakes": 1,
    "rose-stakes": 2,
    "st-lite-kinen": 2,
    "sankei-sho-all-comers": 2,
    "kobe-shimbun-hai": 2,
    "mainichi-okan": 1,
    "kyoto-daishoten": 1,
    "ireland-trophy": 1,
    "fuji-stakes": 2,
    "swan-stakes": 2,
    "keio-hai-nisai-stakes": 1,
    "copa-republica-argentina": 1,
    "daily-hai-nisai-stakes": 1,
    "tokyo-sports-hai": 2,
    "stayers-stakes": 1,
    "hanshin-cup": 2,
    "february-stakes": 2,
    "takamatsunomiya-kinen": 2,
    "osaka-hai": 1,
    "oka-sho": 1,
    "satsuki-sho": 2,
    "tenno-sho-haru": 2,
    "nhk-mile-cup": 1,
    "victoria-mile": 1,
    "yushun-himba": 2,
    "tokyo-yushun": 2,
    "yasuda-kinen": 1,
    "takarazuka-kinen": 2,
    "sprinters-stakes": 2,
    "shuka-sho": 2,
    "kikka-sho": 2,
    "tenno-sho-aki": 2,
    "queen-elizabeth-ii-cup": 1,
    "mile-championship": 2,
    "japan-cup": 2,
    "champions-cup": 1,
    "hanshin-juvenile-fillies": 1,
    "asahi-hai-fs": 2,
    "arima-kinen": 2,
    "hopeful-stakes": 2,
    "tokyo-daishoten": 2,
    "kawasaki-kinen": 1,
    "haneda-hai": 2,
    "kashiwa-kinen": 1,
    "tokyo-derby": 1,
    "sakitama-hai": 1,
    "teio-sho": 2,
    "japan-dirt-classic": 1,
    "mile-championship-nambu-hai": 1,
    "jbc-ladies-classic": 1,
    "jbc-sprint": 1,
    "jbc-classic": 1,
    "zen-nippon-nisai-yushun": 2,
    "diolite-kinen": 1,
    "keihin-hai": 2,
    "hyogo-championship": 1,
    "nagoya-grand-prix": 1,
    "empress-hai": 2,
    "kanto-oaks": 1,
    "furukata-award": 1,
    "nippon-tv-hai": 1,
    "ladies-prelude": 1,
    "tokyo-hai": 1,
    "urawa-kinen": 2,
    "hyogo-junior-grand-prix": 2,
    "kentucky-derby": 1,
    "preakness-stakes": 2,
    "belmont-stakes": 1,
    "pegasus-world-cup": 2,
    "santa-anita-handicap": 1,
    "apple-blossom-handicap": 1,
    "blue-grass-stakes": 1,
    "kentucky-oaks": 1,
    "acorn-stakes": 1,
    "coaching-club-american-oaks": 2,
    "metropolitan-handicap": 1,
    "haskell-stakes": 2,
    "travers-stakes": 2,
    "pegasus-world-cup-turf": 2,
    "american-turf-stakes": 1,
    "turf-classic-stakes": 1,
    "manhattan-stakes": 1,
    "just-a-game-stakes": 1,
    "diana-stakes": 2,
    "arlington-million": 1,
    "keeneland-turf-mile": 1,
    "jaipur-stakes": 1,
    "forego-stakes": 2,
    "h-allen-jerkens-memorial-stakes": 2,
    "prix-dispahan": 2,
    "prix-ganay": 2,
    "poule-dessai-des-poulains": 1,
    "poule-dessai-des-pouliches": 1,
    "prix-vicomtesse-vigier": 2,
    "grand-prix-de-paris": 1,
    "prix-de-royallieu": 1,
    "prix-du-cadran": 1,
    "prix-de-lopera": 1,
    "prix-royal-oak": 2,
    "goodwood-cup": 2,
    "british-champions-long-distance-cup": 2,
    "falmouth-stakes": 1,
    "nassau-stakes": 2,
    "british-champions-fillies-mares-stakes": 2,
    "champion-stakes": 2,
    "irish-two-thousand-guineas": 2,
    "irish-st-leger": 1,
    "deutsches-derby": 1,
    "grosser-preis-von-baden": 1,
    "prix-rothschild": 1,
    "prix-du-moulin": 1,
    "prix-de-la-foret": 1,
    "prix-marcel-boussac": 1,
    "prix-morny": 2,
    "prix-maurice-de-gheest": 1,
    "prix-jean-luc-lagardere": 1,
    "queen-elizabeth-ii-stakes": 2,
    "dewhurst-stakes": 1,
    "yorkshire-oaks": 2,
    "futurity-trophy": 2,
    "middle-park-stakes": 2,
    "irish-oaks": 2,
    "tattersalls-gold-cup": 2,
    "pretty-polly-stakes": 2,
    "phoenix-stakes": 1,
    "flying-five-stakes": 1,
    "grosser-preis-von-berlin": 1,
    "preis-von-europa": 2,
    "grosser-preis-von-bayern": 1,
    "two-thousand-guineas": 1,
    "one-thousand-guineas": 1,
    "epsom-derby": 1,
    "epsom-oaks": 1,
    "coronation-cup": 1,
    "st-leger-stakes": 1,
    "lockinge-stakes": 2,
    "prince-of-wales-stakes": 2,
    "queen-anne-stakes": 2,
    "st-jamess-palace-stakes": 2,
    "ascot-gold-cup": 2,
    "coronation-stakes": 2,
    "eclipse-stakes": 1,
    "sussex-stakes": 2,
    "irish-derby": 2,
    "irish-champion-stakes": 1,
    "prix-du-jockey-club": 1,
    "prix-de-diane": 2,
    "prix-vermeille": 1,
    "king-george-vi-and-queen-elizabeth-stakes": 2,
    "grand-prix-de-saint-cloud": 1,
    "international-stakes": 2,
    "prix-jacques-le-marois": 1,
    "prix-de-larc": 1,
    "king-charles-iii-stakes": 2,
    "queen-elizabeth-ii-jubilee-stakes": 2,
    "commonwealth-cup": 2,
    "july-cup": 1,
    "nunthorpe-stakes": 2,
    "haydock-sprint-cup": 1,
    "prix-de-labbaye": 1,
    "british-champions-sprint-stakes": 2,
    "caulfield-cup": 2,
    "cox-plate": 2,
    "golden-slipper-stakes": 2,
    "doncaster-mile": 1,
    "queen-elizabeth-stakes-aus": 1,
    "victoria-derby": 1,
    "the-everest": 2,
    "tj-smith-stakes": 1,
    "black-caviar-lightning": 1,
    "oakleigh-plate": 2,
    "newmarket-handicap": 1,
    "william-reid-stakes": 2,
    "robert-sangster-stakes": 2,
    "the-goodwood": 1,
    "aj-moir-stakes": 2,
    "manikato-stakes": 2,
    "breeders-cup-classic": 1,
    "breeders-cup-distaff": 1,
    "breeders-cup-sprint": 1,
    "breeders-cup-dirt-mile": 1,
    "breeders-cup-turf": 1,
    "breeders-cup-mile": 1,
    "breeders-cup-turf-sprint": 1,
    "breeders-cup-filly-mare-turf": 1,
    "breeders-cup-filly-mare-sprint": 1,
    "breeders-cup-juvenile": 1,
    "breeders-cup-juvenile-fillies": 1,
    "breeders-cup-juvenile-turf": 1,
    "breeders-cup-juvenile-fillies-turf": 1,
    "breeders-cup-juvenile-turf-sprint": 1,
    "melbourne-cup": 1,
    "dubai-world-cup": 2,
    "dubai-sheema-classic": 2,
    "dubai-turf": 2,
    "dubai-golden-shaheen": 2,
    "al-quoz-sprint": 2,
    "centenary-sprint-cup": 2,
    "chairmans-sprint-prize": 2,
    "hong-kong-stewards-cup": 2,
    "hong-kong-gold-cup": 2,
    "queens-silver-jubilee-cup": 2,
    "hong-kong-queen-elizabeth-ii-cup": 2,
    "champions-mile": 2,
    "champions-chater-cup": 2,
    "hong-kong-sprint": 1,
    "hong-kong-mile": 1,
    "hong-kong-cup": 1,
    "hong-kong-vase": 1,
    "himawari-sho": 2,
    "ivy-stakes": 2,
    "hagi-stakes": 2,
    "cattleya-stakes": 2,
    "junior-cup": 1,
    "kobai-stakes": 2,
    "wakagoma-stakes": 2,
    "crocuss-stakes": 2,
    "elfin-stakes": 1,
    "hyacinth-stakes": 2,
    "sumire-stakes": 2,
    "marguerite-stakes": 2,
    "anemone-stakes": 1,
    "wakaba-stakes": 2,
    "fukuryu-stakes": 2,
    "shoryu-stakes": 2,
    "wasurenagusa-sho": 1,
    "violet-stakes": 2,
    "principal-stakes": 1,
    "tachibana-stakes": 1,
    "hosu-stakes": 2,
    "shirayuri-stakes": 2,
    "seiryu-stakes": 2,
    "paradise-stakes": 2,
    "sannomiya-stakes": 2,
    "sleipnir-stakes": 2,
    "sapporo-nikkei-open": 2,
    "port-island-stakes": 1,
    "opal-stakes": 1,
    "green-channel-cup": 1,
    "october-stakes": 2,
    "shinetsu-stakes": 2,
    "lumiere-autumn-dash": 2,
    "brazil-cup": 2,
    "capital-stakes": 2,
    "december-stakes": 2,
    "new-year-stakes": 1,
    "yodo-tankyori-stakes": 1,
    "subaru-stakes": 1,
    "shirafuji-stakes": 2,
    "manyo-stakes": 1,
    "january-stakes": 1,
    "rakuyo-stakes": 1,
    "nigawa-stakes": 2,
    "aldebaran-stakes": 1,
    "osaka-jo-stakes": 1,
    "coral-stakes": 2,
    "rokko-stakes": 2,
    "shunrai-stakes": 1,
    "fukushima-minpo-cup": 1,
    "keiyo-stakes": 1,
    "oasis-stakes": 2,
    "brilliant-stakes": 1,
    "metropolitan-stakes": 1,
    "ritto-stakes": 1,
    "miyakooji-stakes": 1,
    "nakayama-kimpai": 1,
    "kyoto-kimpai": 1,
    "fairy-stakes": 1,
    "shinzan-kinen": 1,
    "keisei-hai": 2,
    "kokura-himba-stakes": 2,
    "negishi-stakes": 1,
    "silk-road-stakes": 1,
    "tokyo-shimbun-hai": 1,
    "kisaragi-sho": 1,
    "queen-cup": 1,
    "tokinominoru-kinen": 1,
    "diamond-stakes": 2,
    "kokura-daishoten": 2,
    "hankyu-hai": 2,
    "aichi-hai": 2,
    "ocean-stakes": 1,
    "nakayama-himba-stakes": 1,
    "flower-cup": 2,
    "falcon-stakes": 2,
    "mainichi-hai": 2,
    "march-stakes": 2,
    "lord-derby-challenge-trophy": 1,
    "churchill-downs-cup": 1,
    "antares-stakes": 2,
    "fukushima-himba-stakes": 2,
    "niigata-daishoten": 1,
    "unicorn-stakes": 2,
    "heian-stakes": 2,
    "aoi-stakes": 2,
    "epsom-cup": 1,
    "fuchu-himba-stakes": 2,
    "hakodate-sprint-stakes": 1,
    "radio-nikkei-sho": 2,
    "kitakyushu-kinen": 2,
    "shirasagi-stakes": 2,
    "tanabata-sho": 1,
    "tokai-stakes": 2,
    "hakodate-kinen": 2,
    "chukyo-kinen": 2,
    "hakodate-nisai-stakes": 2,
    "ibis-summer-dash": 2,
    "queen-stakes": 2,
    "leopard-stakes": 1,
    "kokura-kinen": 1,
    "sekiya-kinen": 1,
    "cbc-sho": 1,
    "elm-stakes": 1,
    "niigata-nisai-stakes": 2,
    "keeneland-cup": 2,
    "sapporo-nisai-stakes": 1,
    "chukyo-nisai-stakes": 2,
    "niigata-kinen": 1,
    "keisei-hai-autumn-handicap": 1,
    "challenge-cup": 2,
    "sirius-stakes": 2,
    "saudi-arabia-royal-cup": 1,
    "artemis-stakes": 2,
    "fantasy-stakes": 1,
    "miyako-stakes": 1,
    "musashino-stakes": 1,
    "fukushima-kinen": 1,
    "kyoto-nisai-stakes": 2,
    "keihan-hai": 2,
    "naruo-kinen": 1,
    "chunichi-shimbun-hai": 1,
    "capella-stakes": 1,
    "turquoise-stakes": 2,
    "bluebird-cup": 2,
    "queen-sho": 1,
    "saga-kinen": 1,
    "kumotori-sho": 2,
    "iris-kinen": 2,
    "kurofune-sho": 2,
    "hyogo-queen-cup": 1,
    "tokyo-sprint": 1,
    "sparking-lady-cup": 1,
    "mercury-cup": 2,
    "cluster-cup": 1,
    "hokkaido-sprint-cup": 2,
    "breeders-gold-cup": 2,
    "summer-champion": 2,
    "oval-sprint": 2,
    "hakusan-daishoten": 2,
    "marine-cup": 2,
    "edelweiss-sho": 2,
    "jbc-nisai-yushun": 1,
    "nagoya-daishoten": 2,
    "hyogo-gold-trophy": 2
  };

  const MAIDEN_PLANS = turnRange(2, 7, 1, 3, 9, 2);

  function ageName(age) {
    return ["零", "一", "二", "三", "四", "五", "六", "七", "八"][age] || String(age);
  }

  function seasonName(age, month) {
    const season = month >= 3 && month <= 5
      ? "春"
      : month >= 6 && month <= 8
        ? "夏"
        : month >= 9 && month <= 11
          ? "秋"
          : "冬";
    return `${ageName(age)}岁${season}`;
  }

  function ageRule(age) {
    return `${age}岁`;
  }

  function turnIndex(age, month, half) {
    return age * 24 + (month - 1) * 2 + (half || 1) - 1;
  }

  function turnFromIndex(index) {
    const age = Math.floor(index / 24);
    const inYear = index % 24;
    return {
      age,
      month: Math.floor(inYear / 2) + 1,
      half: (inYear % 2) + 1
    };
  }

  function halfSuffix(half) {
    return HALF_SUFFIX[half] || "early";
  }

  function namedRaceHalf(id, month) {
    if (Object.prototype.hasOwnProperty.call(NAMED_RACE_HALVES, id)) return NAMED_RACE_HALVES[id];
    return month <= 1 ? 1 : (month % 2 === 0 ? 2 : 1);
  }

  function localFor(plan, offset) {
    return plan.locals[offset % plan.locals.length] || LOCAL_COURSES[offset % LOCAL_COURSES.length];
  }

  function localCoursesForMonth(month, isEast) {
    if (month <= 2) return isEast ? ["小仓", "福岛"] : ["小仓", "中京"];
    if (month <= 4) return isEast ? ["福岛", "新潟"] : ["中京", "福岛"];
    if (month <= 6) return isEast ? ["新潟", "函馆"] : ["中京", "函馆"];
    if (month <= 8) return isEast ? ["函馆", "札幌"] : ["小仓", "札幌"];
    if (month <= 10) return isEast ? ["新潟", "福岛"] : ["小仓", "中京"];
    return isEast ? ["福岛", "中京"] : ["小仓", "中京"];
  }

  function turnPlanFor(age, month, half) {
    const isEast = (turnIndex(age, month, half) + 1) % 2 === 1;
    return {
      age,
      month,
      half,
      group: isEast ? ["东京", "中山"] : ["京都", "阪神"],
      locals: localCoursesForMonth(month, isEast)
    };
  }

  function turnRange(startAge, startMonth, startHalf, endAge, endMonth, endHalf) {
    const result = [];
    const startIndex = turnIndex(startAge, startMonth, startHalf);
    const endIndex = turnIndex(endAge, endMonth, endHalf);
    for (let index = startIndex; index <= endIndex; index += 1) {
      const time = turnFromIndex(index);
      result.push(turnPlanFor(time.age, time.month, time.half));
    }
    return result;
  }

  function makeRace(kind, plan, surface, course, distance, index) {
    const isNew = kind === "new";
    const surfaceId = surface === "草地" ? "turf" : "dirt";
    const className = isNew ? "新马战" : "未胜利战";
    return {
      id: `${kind}-${surfaceId}-${plan.age}-${plan.month}-${halfSuffix(plan.half)}-${COURSE_IDS[course] || "local"}-${distance}-${index}`,
      name: `${course}${surface}${distance}m${className}`,
      grade: isNew ? "新马" : "未胜利",
      raceClass: isNew ? "new" : "maiden",
      surface,
      surfaceRegion: "日本",
      course,
      distance,
      month: plan.month,
      half: plan.half,
      season: seasonName(plan.age, plan.month),
      ageRule: ageRule(plan.age),
      ageRestriction: { type: "exact", age: plan.age }
    };
  }

  function turfRaces(kind, plan) {
    const distances = [1000, 1200, 1400, 1600, 1800, 2000];
    const seed = plan.month * 2 + plan.half;
    return [
      makeRace(kind, plan, "草地", plan.group[0], distances[(seed + 3) % distances.length], 1),
      makeRace(kind, plan, "草地", plan.group[1], distances[(seed + 5) % distances.length], 2),
      makeRace(kind, plan, "草地", localFor(plan, 0), distances[seed % 3], 3),
      makeRace(kind, plan, "草地", localFor(plan, 1), distances[(seed + 1) % 3], 4)
    ];
  }

  function dirtRaces(kind, plan) {
    const mainDistances = [1200, 1400, 1600, 1800];
    const localDistances = [1000, 1200, 1400];
    const localOnly = plan.age === 2 && plan.month <= 10;
    const seed = plan.month * 2 + plan.half;
    const races = [
      makeRace(kind, plan, "泥地", localFor(plan, 0), localDistances[seed % localDistances.length], 1),
      makeRace(kind, plan, "泥地", localFor(plan, 1), localDistances[(seed + 1) % localDistances.length], 2)
    ];
    if (!localOnly) {
      races.push(
        makeRace(kind, plan, "泥地", plan.group[0], mainDistances[seed % mainDistances.length], 3),
        makeRace(kind, plan, "泥地", plan.group[1], mainDistances[(seed + 2) % mainDistances.length], 4)
      );
    }
    return races;
  }

  function buildConditionRaces() {
    const races = [];
    turnRange(2, 6, 1, 3, 4, 2).forEach((plan) => {
      races.push(...turfRaces("new", plan), ...dirtRaces("new", plan));
    });
    MAIDEN_PLANS.forEach((plan) => {
      races.push(...turfRaces("maiden", plan), ...dirtRaces("maiden", plan));
    });
    return races;
  }

  function pickDistance(pool, plan, offset) {
    return pool[(plan.age * 13 + plan.month * 3 + plan.half + offset) % pool.length];
  }

  function makeAllowanceRace(raceClass, plan, surface, course, distance, index) {
    const labels = {
      "one-win": { grade: "1胜", name: "一胜战" },
      "two-win": { grade: "2胜", name: "二胜战" },
      "three-win": { grade: "3胜", name: "三胜战" }
    };
    const label = labels[raceClass];
    const surfaceId = surface === "草地" ? "turf" : "dirt";
    return {
      id: `${raceClass}-${surfaceId}-${plan.age}-${plan.month}-${halfSuffix(plan.half)}-${COURSE_IDS[course] || "local"}-${distance}-${index}`,
      name: `${course}${surface}${distance}m${label.name}`,
      grade: label.grade,
      raceClass,
      surface,
      surfaceRegion: "日本",
      course,
      distance,
      month: plan.month,
      half: plan.half,
      season: seasonName(plan.age, plan.month),
      ageRule: ageRule(plan.age),
      ageRestriction: { type: "exact", age: plan.age }
    };
  }

  function oneWinTurfPool(plan) {
    if (plan.age === 2) return plan.month >= 9 ? [1200, 1400, 1600, 1800, 2000] : [1200, 1400, 1600, 1800];
    if (plan.age === 3) return [1200, 1400, 1600, 1800, 2000, 2200, 2400];
    return [1200, 1400, 1600, 1800, 2000, 2200, 2400, 2600];
  }

  function oneWinDirtPool(plan) {
    if (plan.age === 2) return [1200, 1400, 1600];
    if (plan.age === 3) return [1200, 1400, 1600, 1700, 1800, 1900];
    return [1200, 1400, 1600, 1700, 1800, 1900, 2100];
  }

  function twoWinTurfPool(plan) {
    const pool = [1200, 1400, 1600, 1800, 2000, 2200, 2400];
    if (plan.month % 3 === 0) pool.push(2500, 2600);
    if (plan.month === 1 || plan.month === 12) pool.push(3000);
    return pool;
  }

  function twoWinDirtPool(plan) {
    const pool = [1200, 1400, 1600, 1700, 1800, 1900];
    if (plan.month % 4 === 0) pool.push(2100);
    if (plan.month === 2 || plan.month === 8) pool.push(2400);
    return pool;
  }

  function threeWinTurfPool(plan) {
    const pool = [1200, 1400, 1600, 1800, 2000, 2200, 2400];
    if (plan.month % 4 === 0) pool.push(2500, 2600);
    if (plan.month === 1 || plan.month === 12) pool.push(3000);
    return pool;
  }

  function threeWinDirtPool(plan) {
    const pool = [1200, 1400, 1600, 1700, 1800, 1900];
    if (plan.month % 5 === 0) pool.push(2100);
    if (plan.month === 2 || plan.month === 8) pool.push(2400);
    return pool;
  }

  function buildOneWinRaces() {
    return turnRange(2, 7, 1, 4, 6, 2).flatMap((plan) => {
      const turf = oneWinTurfPool(plan);
      const dirt = oneWinDirtPool(plan);
      return [
        makeAllowanceRace("one-win", plan, "草地", plan.group[0], pickDistance(turf, plan, 0), 1),
        makeAllowanceRace("one-win", plan, "草地", plan.group[1], pickDistance(turf, plan, 2), 2),
        makeAllowanceRace("one-win", plan, "草地", localFor(plan, 0), pickDistance(turf, plan, 4), 3),
        makeAllowanceRace("one-win", plan, "草地", localFor(plan, 1), pickDistance(turf, plan, 6), 4),
        makeAllowanceRace("one-win", plan, "泥地", plan.group[0], pickDistance(dirt, plan, 1), 5),
        makeAllowanceRace("one-win", plan, "泥地", plan.group[1], pickDistance(dirt, plan, 3), 6),
        makeAllowanceRace("one-win", plan, "泥地", localFor(plan, 0), pickDistance(dirt, plan, 5), 7)
      ];
    });
  }

  function buildTwoWinRaces() {
    return turnRange(3, 6, 1, 5, 12, 2).flatMap((plan) => {
      const turf = twoWinTurfPool(plan);
      const dirt = twoWinDirtPool(plan);
      return [
        makeAllowanceRace("two-win", plan, "草地", plan.group[0], pickDistance(turf, plan, 0), 1),
        makeAllowanceRace("two-win", plan, "草地", plan.group[1], pickDistance(turf, plan, 2), 2),
        makeAllowanceRace("two-win", plan, "草地", localFor(plan, 0), pickDistance(turf, plan, 5), 3),
        makeAllowanceRace("two-win", plan, "泥地", plan.group[0], pickDistance(dirt, plan, 1), 4),
        makeAllowanceRace("two-win", plan, "泥地", plan.group[1], pickDistance(dirt, plan, 3), 5),
        makeAllowanceRace("two-win", plan, "泥地", localFor(plan, 1), pickDistance(dirt, plan, 5), 6)
      ];
    });
  }

  function buildThreeWinRaces() {
    return turnRange(3, 6, 1, 5, 12, 2).flatMap((plan) => {
      const turf = threeWinTurfPool(plan);
      const dirt = threeWinDirtPool(plan);
      return [
        makeAllowanceRace("three-win", plan, "草地", plan.group[0], pickDistance(turf, plan, 1), 1),
        makeAllowanceRace("three-win", plan, "草地", localFor(plan, 0), pickDistance(turf, plan, 4), 2),
        makeAllowanceRace("three-win", plan, "泥地", plan.group[1], pickDistance(dirt, plan, 2), 3),
        makeAllowanceRace("three-win", plan, "泥地", localFor(plan, 1), pickDistance(dirt, plan, 5), 4)
      ];
    });
  }

  function buildAllowanceRaces() {
    return buildOneWinRaces().concat(buildTwoWinRaces(), buildThreeWinRaces());
  }

  function ageRestrictionFromRule(rule) {
    if (rule === "2岁") return { type: "exact", age: 2 };
    if (rule === "3岁") return { type: "exact", age: 3 };
    if (rule === "3岁以上") return { type: "min", age: 3 };
    if (rule === "4岁以上") return { type: "min", age: 4 };
    return { type: "min", age: 3 };
  }

  function makeOpenRace(id, name, grade, month, surface, course, distance, ageRuleText, sexRestriction) {
    const restriction = ageRestrictionFromRule(ageRuleText);
    const seasonAge = restriction.type === "exact" ? restriction.age : restriction.age;
    const half = namedRaceHalf(id, month);
    const race = {
      id,
      name,
      grade,
      raceClass: "op",
      surface,
      surfaceRegion: "日本",
      course,
      distance,
      month,
      half,
      season: seasonName(seasonAge, month),
      ageRule: ageRuleText,
      ageRestriction: restriction
    };
    if (sexRestriction) race.sexRestriction = sexRestriction;
    return race;
  }

  const openRaces = [
    makeOpenRace("himawari-sho", "ひまわり賞", "OP", 8, "草地", "小仓", 1200, "2岁"),
    makeOpenRace("ivy-stakes", "アイビーS", "L", 10, "草地", "东京", 1800, "2岁"),
    makeOpenRace("hagi-stakes", "萩S", "L", 10, "草地", "京都", 1800, "2岁"),
    makeOpenRace("cattleya-stakes", "カトレアS", "OP", 11, "泥地", "东京", 1600, "2岁"),
    makeOpenRace("junior-cup", "ジュニアC", "L", 1, "草地", "中山", 1600, "3岁"),
    makeOpenRace("kobai-stakes", "紅梅S", "L", 1, "草地", "京都", 1400, "3岁", "牝马"),
    makeOpenRace("wakagoma-stakes", "若駒S", "L", 1, "草地", "京都", 2000, "3岁"),
    makeOpenRace("crocuss-stakes", "クロッカスS", "L", 1, "草地", "东京", 1400, "3岁"),
    makeOpenRace("elfin-stakes", "エルフィンS", "L", 2, "草地", "京都", 1600, "3岁", "牝马"),
    makeOpenRace("hyacinth-stakes", "ヒヤシンスS", "L", 2, "泥地", "东京", 1600, "3岁"),
    makeOpenRace("sumire-stakes", "すみれS", "L", 2, "草地", "阪神", 2200, "3岁"),
    makeOpenRace("marguerite-stakes", "マーガレットS", "L", 2, "草地", "阪神", 1200, "3岁"),
    makeOpenRace("anemone-stakes", "アネモネS", "L", 3, "草地", "中山", 1600, "3岁", "牝马"),
    makeOpenRace("wakaba-stakes", "若葉S", "L", 3, "草地", "阪神", 2000, "3岁"),
    makeOpenRace("fukuryu-stakes", "伏竜S", "OP", 3, "泥地", "中山", 1800, "3岁"),
    makeOpenRace("shoryu-stakes", "昇竜S", "OP", 3, "泥地", "中京", 1400, "3岁"),
    makeOpenRace("wasurenagusa-sho", "忘れな草賞", "L", 4, "草地", "阪神", 2000, "3岁", "牝马"),
    makeOpenRace("violet-stakes", "バイオレットS", "OP", 4, "泥地", "阪神", 1400, "3岁"),
    makeOpenRace("principal-stakes", "プリンシパルS", "L", 5, "草地", "东京", 2000, "3岁"),
    makeOpenRace("tachibana-stakes", "橘S", "L", 5, "草地", "京都", 1400, "3岁"),
    makeOpenRace("hosu-stakes", "鳳雛S", "L", 5, "泥地", "京都", 1800, "3岁"),
    makeOpenRace("shirayuri-stakes", "白百合S", "L", 5, "草地", "京都", 1800, "3岁"),
    makeOpenRace("seiryu-stakes", "青竜S", "OP", 5, "泥地", "东京", 1600, "3岁"),
    makeOpenRace("paradise-stakes", "パラダイスS", "L", 6, "草地", "东京", 1400, "3岁以上"),
    makeOpenRace("sannomiya-stakes", "三宮S", "OP", 6, "泥地", "阪神", 1800, "3岁以上"),
    makeOpenRace("sleipnir-stakes", "スレイプニルS", "OP", 6, "泥地", "东京", 2100, "3岁以上"),
    makeOpenRace("sapporo-nikkei-open", "札幌日経OP", "L", 7, "草地", "札幌", 2600, "3岁以上"),
    makeOpenRace("port-island-stakes", "ポートアイランドS", "L", 10, "草地", "阪神", 1600, "3岁以上"),
    makeOpenRace("opal-stakes", "オパールS", "L", 10, "草地", "京都", 1200, "3岁以上"),
    makeOpenRace("green-channel-cup", "グリーンチャンネルC", "L", 10, "泥地", "东京", 1400, "3岁以上"),
    makeOpenRace("october-stakes", "オクトーバーS", "L", 10, "草地", "东京", 2000, "3岁以上"),
    makeOpenRace("shinetsu-stakes", "信越S", "L", 10, "草地", "新潟", 1400, "3岁以上"),
    makeOpenRace("lumiere-autumn-dash", "ルミエールAD", "L", 10, "草地", "新潟", 1000, "3岁以上"),
    makeOpenRace("brazil-cup", "ブラジルC", "L", 10, "泥地", "东京", 2100, "3岁以上"),
    makeOpenRace("capital-stakes", "キャピタルS", "L", 11, "草地", "东京", 1600, "3岁以上"),
    makeOpenRace("december-stakes", "ディセンバーS", "L", 12, "草地", "中山", 1800, "3岁以上"),
    makeOpenRace("new-year-stakes", "ニューイヤーS", "L", 1, "草地", "中山", 1600, "4岁以上"),
    makeOpenRace("yodo-tankyori-stakes", "淀短距離S", "L", 1, "草地", "京都", 1200, "4岁以上"),
    makeOpenRace("subaru-stakes", "すばるS", "L", 1, "泥地", "京都", 1400, "4岁以上"),
    makeOpenRace("shirafuji-stakes", "白富士S", "L", 1, "草地", "东京", 2000, "4岁以上"),
    makeOpenRace("manyo-stakes", "万葉S", "OP", 1, "草地", "京都", 3000, "4岁以上"),
    makeOpenRace("january-stakes", "ジャニュアリーS", "OP", 1, "泥地", "中山", 1200, "4岁以上"),
    makeOpenRace("rakuyo-stakes", "洛陽S", "L", 2, "草地", "京都", 1600, "4岁以上"),
    makeOpenRace("nigawa-stakes", "仁川S", "L", 2, "泥地", "阪神", 2000, "4岁以上"),
    makeOpenRace("aldebaran-stakes", "アルデバランS", "OP", 2, "泥地", "京都", 1900, "4岁以上"),
    makeOpenRace("osaka-jo-stakes", "大阪城S", "L", 3, "草地", "阪神", 1800, "4岁以上"),
    makeOpenRace("coral-stakes", "コーラルS", "L", 3, "泥地", "阪神", 1400, "4岁以上"),
    makeOpenRace("rokko-stakes", "六甲S", "L", 3, "草地", "阪神", 1600, "4岁以上"),
    makeOpenRace("shunrai-stakes", "春雷S", "L", 4, "草地", "中山", 1200, "4岁以上"),
    makeOpenRace("fukushima-minpo-cup", "福島民報杯", "L", 4, "草地", "福岛", 2000, "4岁以上"),
    makeOpenRace("keiyo-stakes", "京葉S", "L", 4, "泥地", "中山", 1200, "4岁以上"),
    makeOpenRace("oasis-stakes", "オアシスS", "L", 4, "泥地", "东京", 1600, "4岁以上"),
    makeOpenRace("brilliant-stakes", "ブリリアントS", "L", 5, "泥地", "东京", 2100, "4岁以上"),
    makeOpenRace("metropolitan-stakes", "メトロポリタンS", "L", 5, "草地", "东京", 2400, "4岁以上"),
    makeOpenRace("ritto-stakes", "栗東S", "L", 5, "泥地", "京都", 1400, "4岁以上"),
    makeOpenRace("miyakooji-stakes", "都大路S", "L", 5, "草地", "京都", 1800, "4岁以上")
  ];

  function makeGradedRace(id, name, grade, month, surface, course, distance, ageRuleText, sexRestriction) {
    const restriction = ageRestrictionFromRule(ageRuleText);
    const seasonAge = restriction.type === "exact" ? restriction.age : restriction.age;
    const half = namedRaceHalf(id, month);
    const race = {
      id,
      name,
      grade,
      raceClass: grade.toLowerCase(),
      surface,
      surfaceRegion: "日本",
      course,
      distance,
      month,
      half,
      season: seasonName(seasonAge, month),
      ageRule: ageRuleText,
      ageRestriction: restriction
    };
    if (sexRestriction) race.sexRestriction = sexRestriction;
    return race;
  }

  function makeJpnRace(id, name, grade, raceClass, month, course, distance, ageRuleText, sexRestriction) {
    const race = makeGradedRace(id, name, grade, month, "泥地", course, distance, ageRuleText, sexRestriction);
    race.raceClass = raceClass;
    return race;
  }

  function makeJpn1Race(id, name, month, course, distance, ageRuleText, sexRestriction) {
    return makeJpnRace(id, name, "JpnI", "jpn1", month, course, distance, ageRuleText, sexRestriction);
  }

  function makeJpn2Race(id, name, month, course, distance, ageRuleText, sexRestriction) {
    return makeJpnRace(id, name, "JpnII", "jpn2", month, course, distance, ageRuleText, sexRestriction);
  }

  function makeJpn3Race(id, name, month, course, distance, ageRuleText, sexRestriction) {
    return makeJpnRace(id, name, "JpnIII", "jpn3", month, course, distance, ageRuleText, sexRestriction);
  }

  const gradedRaces = [
    makeGradedRace("nikkei-shinshun-hai", "日经新春杯", "G2", 1, "草地", "京都", 2400, "4岁以上"),
    makeGradedRace("american-jockey-club-cup", "美国JCC", "G2", 1, "草地", "中山", 2200, "4岁以上"),
    makeGradedRace("procyon-stakes", "プロキオンS", "G2", 1, "泥地", "中京", 1800, "4岁以上"),
    makeGradedRace("kyoto-kinen", "京都记念", "G2", 2, "草地", "京都", 2200, "4岁以上"),
    makeGradedRace("nakayama-kinen", "中山记念", "G2", 2, "草地", "中山", 1800, "4岁以上"),
    makeGradedRace("tulip-sho", "郁金香赏", "G2", 3, "草地", "阪神", 1600, "3岁", "牝马"),
    makeGradedRace("yayoi-sho", "弥生赏", "G2", 3, "草地", "中山", 2000, "3岁"),
    makeGradedRace("fillies-revue", "报知杯雌马赛", "G2", 3, "草地", "阪神", 1400, "3岁", "牝马"),
    makeGradedRace("kinko-sho", "金鯱赏", "G2", 3, "草地", "中京", 2000, "4岁以上"),
    makeGradedRace("spring-stakes", "春季锦标", "G2", 3, "草地", "中山", 1800, "3岁"),
    makeGradedRace("hanshin-daishoten", "阪神大赏典", "G2", 3, "草地", "阪神", 3000, "4岁以上"),
    makeGradedRace("nikkei-sho", "日经赏", "G2", 3, "草地", "中山", 2500, "4岁以上"),
    makeGradedRace("new-zealand-trophy", "新西兰T", "G2", 4, "草地", "中山", 1600, "3岁"),
    makeGradedRace("hanshin-himba-stakes", "阪神牝马S", "G2", 4, "草地", "阪神", 1600, "4岁以上", "牝马"),
    makeGradedRace("flora-stakes", "花仙子S", "G2", 4, "草地", "东京", 2000, "3岁", "牝马"),
    makeGradedRace("yomiuri-milers-cup", "读卖杯", "G2", 4, "草地", "京都", 1600, "4岁以上"),
    makeGradedRace("aoba-sho", "青叶赏", "G2", 4, "草地", "东京", 2400, "3岁"),
    makeGradedRace("kyoto-shimbun-hai", "京都新闻杯", "G2", 5, "草地", "京都", 2200, "3岁"),
    makeGradedRace("keio-hai-spring-cup", "京王杯春季C", "G2", 5, "草地", "东京", 1400, "4岁以上"),
    makeGradedRace("meguro-kinen", "目黑记念", "G2", 5, "草地", "东京", 2500, "4岁以上"),
    makeGradedRace("sapporo-kinen", "札幌记念", "G2", 8, "草地", "札幌", 2000, "3岁以上"),
    makeGradedRace("shion-stakes", "紫苑S", "G2", 9, "草地", "中山", 2000, "3岁", "牝马"),
    makeGradedRace("centaur-stakes", "人马S", "G2", 9, "草地", "阪神", 1200, "3岁以上"),
    makeGradedRace("rose-stakes", "玫瑰S", "G2", 9, "草地", "阪神", 1800, "3岁", "牝马"),
    makeGradedRace("st-lite-kinen", "圣烈特记念", "G2", 9, "草地", "中山", 2200, "3岁"),
    makeGradedRace("sankei-sho-all-comers", "产经赏All Comers", "G2", 9, "草地", "中山", 2200, "3岁以上"),
    makeGradedRace("kobe-shimbun-hai", "神户新闻杯", "G2", 9, "草地", "阪神", 2400, "3岁"),
    makeGradedRace("mainichi-okan", "每日王冠", "G2", 10, "草地", "东京", 1800, "3岁以上"),
    makeGradedRace("kyoto-daishoten", "京都大赏典", "G2", 10, "草地", "京都", 2400, "3岁以上"),
    makeGradedRace("ireland-trophy", "爱尔兰T", "G2", 10, "草地", "东京", 1800, "3岁以上", "牝马"),
    makeGradedRace("fuji-stakes", "富士S", "G2", 10, "草地", "东京", 1600, "3岁以上"),
    makeGradedRace("swan-stakes", "天鹅S", "G2", 10, "草地", "京都", 1400, "3岁以上"),
    makeGradedRace("keio-hai-nisai-stakes", "京王杯2岁S", "G2", 11, "草地", "东京", 1400, "2岁"),
    makeGradedRace("copa-republica-argentina", "阿根廷共和国杯", "G2", 11, "草地", "东京", 2500, "3岁以上"),
    makeGradedRace("daily-hai-nisai-stakes", "每日杯2岁S", "G2", 11, "草地", "京都", 1600, "2岁"),
    makeGradedRace("tokyo-sports-hai", "东京体育杯两岁S", "G2", 11, "草地", "东京", 1800, "2岁"),
    makeGradedRace("stayers-stakes", "长途马S", "G2", 12, "草地", "中山", 3600, "3岁以上"),
    makeGradedRace("hanshin-cup", "阪神C", "G2", 12, "草地", "阪神", 1400, "3岁以上"),
    makeGradedRace("nakayama-kimpai", "中山金杯", "G3", 1, "草地", "中山", 2000, "4岁以上"),
    makeGradedRace("kyoto-kimpai", "京都金杯", "G3", 1, "草地", "京都", 1600, "4岁以上"),
    makeGradedRace("fairy-stakes", "Fairy S", "G3", 1, "草地", "中山", 1600, "3岁", "牝马"),
    makeGradedRace("shinzan-kinen", "新山记念", "G3", 1, "草地", "京都", 1600, "3岁"),
    makeGradedRace("keisei-hai", "京成杯", "G3", 1, "草地", "中山", 2000, "3岁"),
    makeGradedRace("kokura-himba-stakes", "小仓牝马S", "G3", 1, "草地", "小仓", 2000, "4岁以上", "牝马"),
    makeGradedRace("negishi-stakes", "根岸S", "G3", 2, "泥地", "东京", 1400, "4岁以上"),
    makeGradedRace("silk-road-stakes", "丝路S", "G3", 2, "草地", "京都", 1200, "4岁以上"),
    makeGradedRace("tokyo-shimbun-hai", "东京新闻杯", "G3", 2, "草地", "东京", 1600, "4岁以上"),
    makeGradedRace("kisaragi-sho", "如月赏", "G3", 2, "草地", "京都", 1800, "3岁"),
    makeGradedRace("queen-cup", "皇后杯", "G3", 2, "草地", "东京", 1600, "3岁", "牝马"),
    makeGradedRace("tokinominoru-kinen", "共同通信杯", "G3", 2, "草地", "东京", 1800, "3岁"),
    makeGradedRace("diamond-stakes", "钻石S", "G3", 2, "草地", "东京", 3400, "4岁以上"),
    makeGradedRace("kokura-daishoten", "小仓大赏典", "G3", 2, "草地", "小仓", 1800, "4岁以上"),
    makeGradedRace("hankyu-hai", "阪急杯", "G3", 2, "草地", "阪神", 1400, "4岁以上"),
    makeGradedRace("aichi-hai", "爱知杯", "G3", 3, "草地", "中京", 1400, "4岁以上", "牝马"),
    makeGradedRace("ocean-stakes", "海洋S", "G3", 3, "草地", "中山", 1200, "4岁以上"),
    makeGradedRace("nakayama-himba-stakes", "中山牝马S", "G3", 3, "草地", "中山", 1800, "4岁以上", "牝马"),
    makeGradedRace("flower-cup", "花杯", "G3", 3, "草地", "中山", 1800, "3岁", "牝马"),
    makeGradedRace("falcon-stakes", "Falcon S", "G3", 3, "草地", "中京", 1400, "3岁"),
    makeGradedRace("mainichi-hai", "每日杯", "G3", 3, "草地", "阪神", 1800, "3岁"),
    makeGradedRace("march-stakes", "March S", "G3", 3, "泥地", "中山", 1800, "4岁以上"),
    makeGradedRace("lord-derby-challenge-trophy", "达比勋爵CT", "G3", 4, "草地", "中山", 1600, "4岁以上"),
    makeGradedRace("churchill-downs-cup", "Churchill Downs C", "G3", 4, "草地", "阪神", 1600, "3岁"),
    makeGradedRace("antares-stakes", "Antares S", "G3", 4, "泥地", "阪神", 1800, "4岁以上"),
    makeGradedRace("fukushima-himba-stakes", "福岛牝马S", "G3", 4, "草地", "福岛", 1800, "4岁以上", "牝马"),
    makeGradedRace("niigata-daishoten", "新潟大赏典", "G3", 5, "草地", "新潟", 2000, "4岁以上"),
    makeGradedRace("unicorn-stakes", "Unicorn S", "G3", 4, "泥地", "京都", 1900, "3岁"),
    makeGradedRace("heian-stakes", "平安S", "G3", 5, "泥地", "京都", 1900, "4岁以上"),
    makeGradedRace("aoi-stakes", "葵S", "G3", 5, "草地", "京都", 1200, "3岁"),
    makeGradedRace("epsom-cup", "Epsom C", "G3", 6, "草地", "东京", 1800, "3岁以上"),
    makeGradedRace("fuchu-himba-stakes", "府中牝马S", "G3", 6, "草地", "东京", 1800, "3岁以上", "牝马"),
    makeGradedRace("hakodate-sprint-stakes", "函馆短途S", "G3", 6, "草地", "函馆", 1200, "3岁以上"),
    makeGradedRace("radio-nikkei-sho", "Radio NIKKEI赏", "G3", 6, "草地", "福岛", 1800, "3岁"),
    makeGradedRace("kitakyushu-kinen", "北九州记念", "G3", 8, "草地", "小仓", 1200, "3岁以上"),
    makeGradedRace("shirasagi-stakes", "しらさぎS", "G3", 6, "草地", "阪神", 1600, "3岁以上"),
    makeGradedRace("tanabata-sho", "七夕赏", "G3", 7, "草地", "福岛", 2000, "3岁以上"),
    makeGradedRace("tokai-stakes", "东海S", "G3", 7, "泥地", "中京", 1400, "3岁以上"),
    makeGradedRace("hakodate-kinen", "函馆记念", "G3", 7, "草地", "函馆", 2000, "3岁以上"),
    makeGradedRace("chukyo-kinen", "中京记念", "G3", 7, "草地", "中京", 1600, "3岁以上"),
    makeGradedRace("hakodate-nisai-stakes", "函馆2岁S", "G3", 7, "草地", "函馆", 1200, "2岁"),
    makeGradedRace("ibis-summer-dash", "Ibis Summer Dash", "G3", 7, "草地", "新潟", 1000, "3岁以上"),
    makeGradedRace("queen-stakes", "皇后S", "G3", 7, "草地", "札幌", 1800, "3岁以上", "牝马"),
    makeGradedRace("leopard-stakes", "Leopard S", "G3", 8, "泥地", "新潟", 1800, "3岁"),
    makeGradedRace("kokura-kinen", "小仓记念", "G3", 8, "草地", "小仓", 2000, "3岁以上"),
    makeGradedRace("sekiya-kinen", "关屋记念", "G3", 8, "草地", "新潟", 1600, "3岁以上"),
    makeGradedRace("cbc-sho", "CBC赏", "G3", 8, "草地", "中京", 1200, "3岁以上"),
    makeGradedRace("elm-stakes", "Elm S", "G3", 8, "泥地", "札幌", 1700, "3岁以上"),
    makeGradedRace("niigata-nisai-stakes", "新潟2岁S", "G3", 8, "草地", "新潟", 1600, "2岁"),
    makeGradedRace("keeneland-cup", "Keeneland C", "G3", 8, "草地", "札幌", 1200, "3岁以上"),
    makeGradedRace("sapporo-nisai-stakes", "札幌2岁S", "G3", 9, "草地", "札幌", 1800, "2岁"),
    makeGradedRace("chukyo-nisai-stakes", "中京2岁S", "G3", 8, "草地", "中京", 1400, "2岁"),
    makeGradedRace("niigata-kinen", "新潟记念", "G3", 9, "草地", "新潟", 2000, "3岁以上"),
    makeGradedRace("keisei-hai-autumn-handicap", "京成杯AH", "G3", 9, "草地", "中山", 1600, "3岁以上"),
    makeGradedRace("challenge-cup", "Challenge C", "G3", 9, "草地", "阪神", 2000, "3岁以上"),
    makeGradedRace("sirius-stakes", "Sirius S", "G3", 9, "泥地", "阪神", 2000, "3岁以上"),
    makeGradedRace("saudi-arabia-royal-cup", "Saudi Arabia RC", "G3", 10, "草地", "东京", 1600, "2岁"),
    makeGradedRace("artemis-stakes", "Artemis S", "G3", 10, "草地", "东京", 1600, "2岁", "牝马"),
    makeGradedRace("fantasy-stakes", "Fantasy S", "G3", 11, "草地", "京都", 1400, "2岁", "牝马"),
    makeGradedRace("miyako-stakes", "Miyako S", "G3", 11, "泥地", "京都", 1800, "3岁以上"),
    makeGradedRace("musashino-stakes", "武藏野S", "G3", 11, "泥地", "东京", 1600, "3岁以上"),
    makeGradedRace("fukushima-kinen", "福岛记念", "G3", 11, "草地", "福岛", 2000, "3岁以上"),
    makeGradedRace("kyoto-nisai-stakes", "京都2岁S", "G3", 11, "草地", "京都", 2000, "2岁"),
    makeGradedRace("keihan-hai", "京阪杯", "G3", 11, "草地", "京都", 1200, "3岁以上"),
    makeGradedRace("naruo-kinen", "鸣尾记念", "G3", 12, "草地", "阪神", 1800, "3岁以上"),
    makeGradedRace("chunichi-shimbun-hai", "中日新闻杯", "G3", 12, "草地", "中京", 2000, "3岁以上"),
    makeGradedRace("capella-stakes", "Capella S", "G3", 12, "泥地", "中山", 1200, "3岁以上"),
    makeGradedRace("turquoise-stakes", "Turquoise S", "G3", 12, "草地", "中山", 1600, "3岁以上", "牝马")
  ];

  const g1Races = [
    makeGradedRace("february-stakes", "二月锦标", "G1", 2, "泥地", "东京", 1600, "4岁以上"),
    makeGradedRace("takamatsunomiya-kinen", "高松宫纪念", "G1", 3, "草地", "中京", 1200, "4岁以上"),
    makeGradedRace("osaka-hai", "大阪杯", "G1", 4, "草地", "阪神", 2000, "4岁以上"),
    makeGradedRace("oka-sho", "樱花赏", "G1", 4, "草地", "阪神", 1600, "3岁", "牝马"),
    makeGradedRace("satsuki-sho", "皋月赏", "G1", 4, "草地", "中山", 2000, "3岁"),
    makeGradedRace("tenno-sho-haru", "天皇赏春", "G1", 4, "草地", "京都", 3200, "4岁以上"),
    makeGradedRace("nhk-mile-cup", "NHK一哩杯", "G1", 5, "草地", "东京", 1600, "3岁"),
    makeGradedRace("victoria-mile", "维多利亚一哩赛", "G1", 5, "草地", "东京", 1600, "4岁以上", "牝马"),
    makeGradedRace("yushun-himba", "优骏牝马", "G1", 5, "草地", "东京", 2400, "3岁", "牝马"),
    makeGradedRace("tokyo-yushun", "日本德比", "G1", 5, "草地", "东京", 2400, "3岁"),
    makeGradedRace("yasuda-kinen", "安田纪念", "G1", 6, "草地", "东京", 1600, "3岁以上"),
    makeGradedRace("takarazuka-kinen", "宝塚纪念", "G1", 6, "草地", "阪神", 2200, "3岁以上"),
    makeGradedRace("sprinters-stakes", "短途马锦标", "G1", 9, "草地", "中山", 1200, "3岁以上"),
    makeGradedRace("shuka-sho", "秋华赏", "G1", 10, "草地", "京都", 2000, "3岁", "牝马"),
    makeGradedRace("kikka-sho", "菊花赏", "G1", 10, "草地", "京都", 3000, "3岁"),
    makeGradedRace("tenno-sho-aki", "天皇赏秋", "G1", 10, "草地", "东京", 2000, "3岁以上"),
    makeGradedRace("queen-elizabeth-ii-cup", "女王伊丽莎白二世杯", "G1", 11, "草地", "京都", 2200, "3岁以上", "牝马"),
    makeGradedRace("mile-championship", "一哩冠军赛", "G1", 11, "草地", "京都", 1600, "3岁以上"),
    makeGradedRace("japan-cup", "日本杯", "G1", 11, "草地", "东京", 2400, "3岁以上"),
    makeGradedRace("champions-cup", "冠军杯", "G1", 12, "泥地", "中京", 1800, "3岁以上"),
    makeGradedRace("hanshin-juvenile-fillies", "阪神两岁牝马S", "G1", 12, "草地", "阪神", 1600, "2岁", "牝马"),
    makeGradedRace("asahi-hai-fs", "朝日杯FS", "G1", 12, "草地", "阪神", 1600, "2岁"),
    makeGradedRace("arima-kinen", "有马纪念", "G1", 12, "草地", "中山", 2500, "3岁以上"),
    makeGradedRace("hopeful-stakes", "希望锦标", "G1", 12, "草地", "中山", 2000, "2岁"),
    makeGradedRace("tokyo-daishoten", "东京大赏典", "G1", 12, "泥地", "其他地方", 2000, "3岁以上")
  ];

  const jpn1Races = [
    makeJpn1Race("kawasaki-kinen", "川崎记念", 4, "川崎", 2100, "4岁以上"),
    makeJpn1Race("haneda-hai", "羽田杯", 4, "大井", 1800, "3岁"),
    makeJpn1Race("kashiwa-kinen", "柏记念", 5, "船桥", 1600, "4岁以上"),
    makeJpn1Race("tokyo-derby", "东京德比", 6, "大井", 2000, "3岁"),
    makeJpn1Race("sakitama-hai", "埼玉杯", 6, "浦和", 1400, "3岁以上"),
    makeJpn1Race("teio-sho", "帝王赏", 6, "大井", 2000, "4岁以上"),
    makeJpn1Race("japan-dirt-classic", "日本泥地经典赛", 10, "大井", 2000, "3岁"),
    makeJpn1Race("mile-championship-nambu-hai", "一哩冠军南部杯", 10, "盛冈", 1600, "3岁以上"),
    makeJpn1Race("jbc-ladies-classic", "JBC雌马经典赛", 11, "其他地方", 1800, "3岁以上", "牝马"),
    makeJpn1Race("jbc-sprint", "JBC短途赛", 11, "其他地方", 1200, "3岁以上"),
    makeJpn1Race("jbc-classic", "JBC经典赛", 11, "其他地方", 2000, "3岁以上"),
    makeJpn1Race("zen-nippon-nisai-yushun", "全日本两岁优骏", 12, "川崎", 1600, "2岁")
  ];

  const jpn2Races = [
    makeJpn2Race("diolite-kinen", "ダイオライト记念", 3, "船桥", 2400, "4岁以上"),
    makeJpn2Race("keihin-hai", "京滨杯", 3, "大井", 1700, "3岁"),
    makeJpn2Race("hyogo-championship", "兵库冠军锦标", 5, "园田", 1400, "3岁"),
    makeJpn2Race("nagoya-grand-prix", "名古屋大奖赛", 5, "名古屋", 2100, "4岁以上"),
    makeJpn2Race("empress-hai", "雌马杯", 5, "川崎", 2100, "4岁以上", "牝马"),
    makeJpn2Race("kanto-oaks", "关东橡树大赛", 6, "川崎", 2100, "3岁", "牝马"),
    makeJpn2Race("furukata-award", "不来方赏", 9, "盛冈", 2000, "3岁"),
    makeJpn2Race("nippon-tv-hai", "日本电视杯", 10, "船桥", 1800, "3岁以上"),
    makeJpn2Race("ladies-prelude", "雌马预赛", 10, "大井", 1800, "3岁以上", "牝马"),
    makeJpn2Race("tokyo-hai", "东京杯", 10, "大井", 1200, "3岁以上"),
    makeJpn2Race("urawa-kinen", "浦和记念", 11, "浦和", 2000, "3岁以上"),
    makeJpn2Race("hyogo-junior-grand-prix", "兵库青年大奖赛", 11, "园田", 1400, "2岁")
  ];

  const jpn3Races = [
    makeJpn3Race("bluebird-cup", "蓝鸟杯", 1, "船桥", 1800, "3岁"),
    makeJpn3Race("queen-sho", "皇后赏", 2, "船桥", 1800, "4岁以上", "牝马"),
    makeJpn3Race("saga-kinen", "佐贺记念", 2, "佐贺", 2000, "4岁以上"),
    makeJpn3Race("kumotori-sho", "云取赏", 2, "大井", 1800, "3岁"),
    makeJpn3Race("iris-kinen", "鸢尾花记念", 2, "名古屋", 1500, "4岁以上"),
    makeJpn3Race("kurofune-sho", "黑船赏", 3, "高知", 1400, "4岁以上"),
    makeJpn3Race("hyogo-queen-cup", "兵库女王杯", 4, "园田", 1870, "4岁以上", "牝马"),
    makeJpn3Race("tokyo-sprint", "东京短途赛", 4, "大井", 1200, "4岁以上"),
    makeJpn3Race("sparking-lady-cup", "闪耀雌马杯", 7, "川崎", 1600, "3岁以上", "牝马"),
    makeJpn3Race("mercury-cup", "水星杯", 7, "盛冈", 2000, "3岁以上"),
    makeJpn3Race("cluster-cup", "星团杯", 8, "盛冈", 1200, "3岁以上"),
    makeJpn3Race("hokkaido-sprint-cup", "北海道短途杯", 8, "门别", 1200, "3岁"),
    makeJpn3Race("breeders-gold-cup", "育马者金杯", 8, "门别", 2000, "3岁以上", "牝马"),
    makeJpn3Race("summer-champion", "夏季冠军赛", 8, "佐贺", 1400, "3岁以上"),
    makeJpn3Race("oval-sprint", "椭圆短途赛", 9, "浦和", 1400, "3岁以上"),
    makeJpn3Race("hakusan-daishoten", "白山大赏典", 9, "金泽", 2100, "3岁以上"),
    makeJpn3Race("marine-cup", "海洋杯", 9, "船桥", 1800, "3岁", "牝马"),
    makeJpn3Race("edelweiss-sho", "雪绒花赏", 10, "门别", 1200, "2岁", "牝马"),
    makeJpn3Race("jbc-nisai-yushun", "JBC两岁优骏", 11, "门别", 1800, "2岁"),
    makeJpn3Race("nagoya-daishoten", "名古屋大赏典", 12, "名古屋", 2000, "3岁以上"),
    makeJpn3Race("hyogo-gold-trophy", "兵库金杯", 12, "园田", 1400, "3岁以上")
  ];

  function makeOverseasG1Race(id, name, month, surface, surfaceRegion, distance, ageRuleText, sexRestriction) {
    const restriction = ageRestrictionFromRule(ageRuleText);
    const half = namedRaceHalf(id, month);
    const race = {
      id,
      name,
      grade: "G1",
      raceClass: "g1",
      surface,
      surfaceRegion,
      course: "其他地方",
      distance,
      month,
      half,
      season: seasonName(restriction.type === "exact" ? restriction.age : restriction.age, month),
      ageRule: ageRuleText,
      ageRestriction: restriction
    };
    if (sexRestriction) race.sexRestriction = sexRestriction;
    return race;
  }

  const overseasG1Races = [
    makeOverseasG1Race("kentucky-derby", "肯塔基德比", 5, "泥地", "美国", 2000, "3岁"),
    makeOverseasG1Race("preakness-stakes", "必利是锦标", 5, "泥地", "美国", 1900, "3岁"),
    makeOverseasG1Race("belmont-stakes", "贝蒙锦标", 6, "泥地", "美国", 2400, "3岁"),
    makeOverseasG1Race("pegasus-world-cup", "飞马世界杯", 1, "泥地", "美国", 1800, "4岁以上"),
    makeOverseasG1Race("santa-anita-handicap", "圣雅尼塔让赛", 3, "泥地", "美国", 2000, "4岁以上"),
    makeOverseasG1Race("apple-blossom-handicap", "苹果花让赛", 4, "泥地", "美国", 1700, "4岁以上", "牝马"),
    makeOverseasG1Race("blue-grass-stakes", "蓝草锦标", 4, "泥地", "美国", 1800, "3岁"),
    makeOverseasG1Race("kentucky-oaks", "肯塔基橡树", 5, "泥地", "美国", 1800, "3岁", "牝马"),
    makeOverseasG1Race("acorn-stakes", "橡果锦标", 6, "泥地", "美国", 1800, "3岁", "牝马"),
    makeOverseasG1Race("coaching-club-american-oaks", "Coaching Club美国橡树大赛", 7, "泥地", "美国", 1800, "3岁", "牝马"),
    makeOverseasG1Race("metropolitan-handicap", "大都会让赛", 6, "泥地", "美国", 1600, "3岁以上"),
    makeOverseasG1Race("haskell-stakes", "哈斯凯尔锦标", 7, "泥地", "美国", 1800, "3岁"),
    makeOverseasG1Race("travers-stakes", "卓华斯锦标", 8, "泥地", "美国", 2000, "3岁"),
    makeOverseasG1Race("pegasus-world-cup-turf", "飞马世界杯草地赛", 1, "草地", "美国", 1800, "4岁以上"),
    makeOverseasG1Race("american-turf-stakes", "美国草地锦标", 5, "草地", "美国", 1700, "3岁"),
    makeOverseasG1Race("turf-classic-stakes", "草地经典赛", 5, "草地", "美国", 1800, "4岁以上"),
    makeOverseasG1Race("manhattan-stakes", "曼哈顿锦标", 6, "草地", "美国", 1900, "4岁以上"),
    makeOverseasG1Race("just-a-game-stakes", "Just a Game锦标", 6, "草地", "美国", 1600, "4岁以上", "牝马"),
    makeOverseasG1Race("diana-stakes", "戴安娜锦标", 7, "草地", "美国", 1800, "4岁以上", "牝马"),
    makeOverseasG1Race("arlington-million", "阿灵顿百万大赛", 8, "草地", "美国", 2000, "3岁以上"),
    makeOverseasG1Race("keeneland-turf-mile", "基兰草地一哩", 10, "草地", "美国", 1600, "3岁以上"),
    makeOverseasG1Race("jaipur-stakes", "斋浦尔锦标", 6, "草地", "美国", 1200, "3岁以上"),
    makeOverseasG1Race("forego-stakes", "福尔戈锦标", 8, "泥地", "美国", 1400, "4岁以上"),
    makeOverseasG1Race("h-allen-jerkens-memorial-stakes", "H. Allen Jerkens纪念锦标", 8, "泥地", "美国", 1400, "3岁"),
    makeOverseasG1Race("prix-dispahan", "伊斯巴翰锦标", 5, "草地", "欧洲", 1850, "4岁以上"),
    makeOverseasG1Race("prix-ganay", "根利锦标", 4, "草地", "欧洲", 2100, "4岁以上"),
    makeOverseasG1Race("poule-dessai-des-poulains", "法国二千坚尼", 5, "草地", "欧洲", 1600, "3岁"),
    makeOverseasG1Race("poule-dessai-des-pouliches", "法国一千坚尼", 5, "草地", "欧洲", 1600, "3岁", "牝马"),
    makeOverseasG1Race("prix-vicomtesse-vigier", "维吉尔子爵夫人锦标", 5, "草地", "欧洲", 3100, "4岁以上"),
    makeOverseasG1Race("grand-prix-de-paris", "巴黎大赛", 7, "草地", "欧洲", 2400, "3岁"),
    makeOverseasG1Race("prix-de-royallieu", "鲁瓦耶锦标", 10, "草地", "欧洲", 2800, "3岁以上", "牝马"),
    makeOverseasG1Race("prix-du-cadran", "卡德兰大奖赛", 10, "草地", "欧洲", 4000, "4岁以上"),
    makeOverseasG1Race("prix-de-lopera", "歌剧大奖赛", 10, "草地", "欧洲", 2000, "3岁以上", "牝马"),
    makeOverseasG1Race("prix-royal-oak", "皇家橡树大赛", 10, "草地", "欧洲", 3100, "3岁以上"),
    makeOverseasG1Race("goodwood-cup", "古活杯", 7, "草地", "欧洲", 3219, "3岁以上"),
    makeOverseasG1Race("british-champions-long-distance-cup", "英国冠军长途杯", 10, "草地", "欧洲", 3209, "3岁以上"),
    makeOverseasG1Race("falmouth-stakes", "法尔茅斯锦标", 7, "草地", "欧洲", 1600, "3岁以上", "牝马"),
    makeOverseasG1Race("nassau-stakes", "拿骚锦标", 7, "草地", "欧洲", 1991, "3岁以上", "牝马"),
    makeOverseasG1Race("british-champions-fillies-mares-stakes", "英国冠军雌马锦标", 10, "草地", "欧洲", 2400, "3岁以上", "牝马"),
    makeOverseasG1Race("champion-stakes", "冠军锦标", 10, "草地", "欧洲", 2004, "3岁以上"),
    makeOverseasG1Race("irish-two-thousand-guineas", "爱尔兰二千坚尼", 5, "草地", "欧洲", 1600, "3岁"),
    makeOverseasG1Race("irish-st-leger", "爱尔兰圣烈治锦标", 9, "草地", "欧洲", 2800, "3岁以上"),
    makeOverseasG1Race("deutsches-derby", "德国德比", 7, "草地", "欧洲", 2400, "3岁"),
    makeOverseasG1Race("grosser-preis-von-baden", "巴登大赛", 9, "草地", "欧洲", 2400, "3岁以上"),
    makeOverseasG1Race("prix-rothschild", "罗斯柴尔德大奖赛", 8, "草地", "欧洲", 1600, "3岁以上", "牝马"),
    makeOverseasG1Race("prix-du-moulin", "穆兰大赛", 9, "草地", "欧洲", 1600, "3岁以上"),
    makeOverseasG1Race("prix-de-la-foret", "森林大赛", 10, "草地", "欧洲", 1400, "3岁以上"),
    makeOverseasG1Race("prix-marcel-boussac", "马塞尔布萨克大赛", 10, "草地", "欧洲", 1600, "2岁", "牝马"),
    makeOverseasG1Race("prix-morny", "莫尼大赛", 8, "草地", "欧洲", 1200, "2岁"),
    makeOverseasG1Race("prix-maurice-de-gheest", "莫里斯德盖斯特大赛", 8, "草地", "欧洲", 1300, "3岁以上"),
    makeOverseasG1Race("prix-jean-luc-lagardere", "让-吕克拉加代尔大奖赛", 10, "草地", "欧洲", 1400, "2岁"),
    makeOverseasG1Race("queen-elizabeth-ii-stakes", "伊丽莎白女王二世锦标", 10, "草地", "欧洲", 1600, "3岁以上"),
    makeOverseasG1Race("dewhurst-stakes", "杜赫斯特锦标", 10, "草地", "欧洲", 1400, "2岁"),
    makeOverseasG1Race("yorkshire-oaks", "约克郡橡树大赛", 8, "草地", "欧洲", 2400, "3岁以上", "牝马"),
    makeOverseasG1Race("futurity-trophy", "未来锦标", 10, "草地", "欧洲", 1600, "2岁"),
    makeOverseasG1Race("middle-park-stakes", "米德尔帕克锦标", 9, "草地", "欧洲", 1200, "2岁"),
    makeOverseasG1Race("irish-oaks", "爱尔兰橡树大赛", 7, "草地", "欧洲", 2400, "3岁", "牝马"),
    makeOverseasG1Race("tattersalls-gold-cup", "塔特索尔斯金杯", 5, "草地", "欧洲", 2100, "4岁以上"),
    makeOverseasG1Race("pretty-polly-stakes", "美丽波莉锦标", 6, "草地", "欧洲", 2000, "3岁以上", "牝马"),
    makeOverseasG1Race("phoenix-stakes", "凤凰锦标", 8, "草地", "欧洲", 1200, "2岁"),
    makeOverseasG1Race("flying-five-stakes", "飞行五锦标", 9, "草地", "欧洲", 1000, "3岁以上"),
    makeOverseasG1Race("grosser-preis-von-berlin", "柏林大赛", 8, "草地", "欧洲", 2400, "3岁以上"),
    makeOverseasG1Race("preis-von-europa", "欧洲大赛", 9, "草地", "欧洲", 2400, "3岁以上"),
    makeOverseasG1Race("grosser-preis-von-bayern", "巴伐利亚大赛", 11, "草地", "欧洲", 2400, "3岁以上"),
    makeOverseasG1Race("two-thousand-guineas", "二千坚尼", 5, "草地", "欧洲", 1600, "3岁"),
    makeOverseasG1Race("one-thousand-guineas", "一千坚尼", 5, "草地", "欧洲", 1600, "3岁", "牝马"),
    makeOverseasG1Race("epsom-derby", "叶森德比", 6, "草地", "欧洲", 2400, "3岁"),
    makeOverseasG1Race("epsom-oaks", "叶森橡树", 6, "草地", "欧洲", 2400, "3岁", "牝马"),
    makeOverseasG1Race("coronation-cup", "加冕杯", 6, "草地", "欧洲", 2400, "4岁以上"),
    makeOverseasG1Race("st-leger-stakes", "圣烈治锦标", 9, "草地", "欧洲", 2900, "3岁"),
    makeOverseasG1Race("lockinge-stakes", "洛金锦标", 5, "草地", "欧洲", 1600, "4岁以上"),
    makeOverseasG1Race("prince-of-wales-stakes", "威尔士亲王锦标", 6, "草地", "欧洲", 2000, "4岁以上"),
    makeOverseasG1Race("queen-anne-stakes", "女王安妮锦标", 6, "草地", "欧洲", 1600, "4岁以上"),
    makeOverseasG1Race("st-jamess-palace-stakes", "圣詹姆斯皇宫锦标", 6, "草地", "欧洲", 1600, "3岁"),
    makeOverseasG1Race("ascot-gold-cup", "雅士谷金杯", 6, "草地", "欧洲", 4000, "4岁以上"),
    makeOverseasG1Race("coronation-stakes", "加冕锦标", 6, "草地", "欧洲", 1600, "3岁", "牝马"),
    makeOverseasG1Race("eclipse-stakes", "日蚀大赛", 7, "草地", "欧洲", 2000, "3岁以上"),
    makeOverseasG1Race("sussex-stakes", "萨塞克斯锦标", 7, "草地", "欧洲", 1600, "3岁以上"),
    makeOverseasG1Race("irish-derby", "爱尔兰德比", 6, "草地", "欧洲", 2400, "3岁"),
    makeOverseasG1Race("irish-champion-stakes", "爱尔兰冠军锦标", 9, "草地", "欧洲", 2000, "3岁以上"),
    makeOverseasG1Race("prix-du-jockey-club", "法国德比", 6, "草地", "欧洲", 2100, "3岁"),
    makeOverseasG1Race("prix-de-diane", "法国橡树", 6, "草地", "欧洲", 2100, "3岁", "牝马"),
    makeOverseasG1Race("prix-vermeille", "红宝锦标", 9, "草地", "欧洲", 2400, "3岁以上", "牝马"),
    makeOverseasG1Race("king-george-vi-and-queen-elizabeth-stakes", "英皇锦标", 7, "草地", "欧洲", 2400, "3岁以上"),
    makeOverseasG1Race("grand-prix-de-saint-cloud", "圣格卢大赛", 7, "草地", "欧洲", 2400, "4岁以上"),
    makeOverseasG1Race("international-stakes", "国际锦标", 8, "草地", "欧洲", 2050, "3岁以上"),
    makeOverseasG1Race("prix-jacques-le-marois", "杰克莫华大赛", 8, "草地", "欧洲", 1600, "3岁以上"),
    makeOverseasG1Race("prix-de-larc", "凯旋门赏", 10, "草地", "欧洲", 2400, "3岁以上"),
    makeOverseasG1Race("king-charles-iii-stakes", "查理三世锦标", 6, "草地", "欧洲", 1000, "3岁以上"),
    makeOverseasG1Race("queen-elizabeth-ii-jubilee-stakes", "女王伊丽莎白二世禧年锦标", 6, "草地", "欧洲", 1200, "4岁以上"),
    makeOverseasG1Race("commonwealth-cup", "英联邦杯", 6, "草地", "欧洲", 1200, "3岁"),
    makeOverseasG1Race("july-cup", "七月杯", 7, "草地", "欧洲", 1200, "3岁以上"),
    makeOverseasG1Race("nunthorpe-stakes", "南索普锦标", 8, "草地", "欧洲", 1000, "2岁以上"),
    makeOverseasG1Race("haydock-sprint-cup", "海多克短途杯", 9, "草地", "欧洲", 1200, "3岁以上"),
    makeOverseasG1Race("prix-de-labbaye", "阿贝耶大奖赛", 10, "草地", "欧洲", 1000, "2岁以上"),
    makeOverseasG1Race("british-champions-sprint-stakes", "英国冠军短途锦标", 10, "草地", "欧洲", 1200, "3岁以上"),
    makeOverseasG1Race("caulfield-cup", "考菲尔德杯", 10, "草地", "澳洲", 2400, "3岁以上"),
    makeOverseasG1Race("cox-plate", "觉士盾", 10, "草地", "澳洲", 2040, "3岁以上"),
    makeOverseasG1Race("golden-slipper-stakes", "金拖鞋大赛", 3, "草地", "澳洲", 1200, "2岁"),
    makeOverseasG1Race("doncaster-mile", "唐卡士打一哩赛", 4, "草地", "澳洲", 1600, "3岁以上"),
    makeOverseasG1Race("queen-elizabeth-stakes-aus", "女王伊丽莎白锦标", 4, "草地", "澳洲", 2000, "3岁以上"),
    makeOverseasG1Race("victoria-derby", "维多利亚德比", 11, "草地", "澳洲", 2500, "3岁"),
    makeOverseasG1Race("the-everest", "珠穆朗玛峰锦标", 10, "草地", "澳洲", 1200, "3岁以上"),
    makeOverseasG1Race("tj-smith-stakes", "T.J. Smith锦标", 4, "草地", "澳洲", 1200, "3岁以上"),
    makeOverseasG1Race("black-caviar-lightning", "黑鱼子闪电锦标", 2, "草地", "澳洲", 1000, "3岁以上"),
    makeOverseasG1Race("oakleigh-plate", "奥克利盘", 2, "草地", "澳洲", 1100, "3岁以上"),
    makeOverseasG1Race("newmarket-handicap", "新市场让赛", 3, "草地", "澳洲", 1200, "3岁以上"),
    makeOverseasG1Race("william-reid-stakes", "威廉里德锦标", 3, "草地", "澳洲", 1200, "3岁以上"),
    makeOverseasG1Race("robert-sangster-stakes", "罗伯特桑斯特锦标", 4, "草地", "澳洲", 1200, "2岁以上", "牝马"),
    makeOverseasG1Race("the-goodwood", "古活锦标", 5, "草地", "澳洲", 1200, "3岁以上"),
    makeOverseasG1Race("aj-moir-stakes", "A.J. Moir锦标", 9, "草地", "澳洲", 1000, "3岁以上"),
    makeOverseasG1Race("manikato-stakes", "马尼卡托锦标", 9, "草地", "澳洲", 1200, "3岁以上"),
    makeOverseasG1Race("breeders-cup-classic", "育马者杯经典赛", 11, "泥地", "美国", 2000, "3岁以上"),
    makeOverseasG1Race("breeders-cup-distaff", "育马者杯雌马大赛", 11, "泥地", "美国", 1800, "3岁以上", "牝马"),
    makeOverseasG1Race("breeders-cup-sprint", "育马者杯短途大赛", 11, "泥地", "美国", 1200, "3岁以上"),
    makeOverseasG1Race("breeders-cup-dirt-mile", "育马者杯泥地一哩", 11, "泥地", "美国", 1600, "3岁以上"),
    makeOverseasG1Race("breeders-cup-turf", "育马者杯草地大赛", 11, "草地", "美国", 2400, "3岁以上"),
    makeOverseasG1Race("breeders-cup-mile", "育马者杯一哩大赛", 11, "草地", "美国", 1600, "3岁以上"),
    makeOverseasG1Race("breeders-cup-turf-sprint", "育马者杯草地短途", 11, "草地", "美国", 1000, "3岁以上"),
    makeOverseasG1Race("breeders-cup-filly-mare-turf", "育马者杯雌马草地大赛", 11, "草地", "美国", 2000, "3岁以上", "牝马"),
    makeOverseasG1Race("breeders-cup-filly-mare-sprint", "育马者杯雌马短途大赛", 11, "泥地", "美国", 1400, "3岁以上", "牝马"),
    makeOverseasG1Race("breeders-cup-juvenile", "育马者杯两岁大赛", 11, "泥地", "美国", 1700, "2岁"),
    makeOverseasG1Race("breeders-cup-juvenile-fillies", "育马者杯两岁雌马大赛", 11, "泥地", "美国", 1700, "2岁", "牝马"),
    makeOverseasG1Race("breeders-cup-juvenile-turf", "育马者杯两岁草地大赛", 11, "草地", "美国", 1600, "2岁"),
    makeOverseasG1Race("breeders-cup-juvenile-fillies-turf", "育马者杯两岁雌马草地大赛", 11, "草地", "美国", 1600, "2岁", "牝马"),
    makeOverseasG1Race("breeders-cup-juvenile-turf-sprint", "育马者杯两岁草地短途", 11, "草地", "美国", 1000, "2岁"),
    makeOverseasG1Race("melbourne-cup", "墨尔本杯", 11, "草地", "澳洲", 3200, "3岁以上"),
    makeOverseasG1Race("dubai-world-cup", "迪拜世界杯", 3, "泥地", "中东", 2000, "4岁以上"),
    makeOverseasG1Race("dubai-sheema-classic", "迪拜司马经典赛", 3, "草地", "中东", 2400, "4岁以上"),
    makeOverseasG1Race("dubai-turf", "迪拜草地大赛", 3, "草地", "中东", 1800, "4岁以上"),
    makeOverseasG1Race("dubai-golden-shaheen", "迪拜金莎轩锦标", 3, "泥地", "中东", 1200, "3岁以上"),
    makeOverseasG1Race("al-quoz-sprint", "阿乔斯短途锦标", 3, "草地", "中东", 1200, "3岁以上"),
    makeOverseasG1Race("centenary-sprint-cup", "百周年纪念短途杯", 1, "草地", "香港", 1200, "3岁以上"),
    makeOverseasG1Race("chairmans-sprint-prize", "主席短途奖", 4, "草地", "香港", 1200, "3岁以上"),
    makeOverseasG1Race("hong-kong-stewards-cup", "董事杯", 1, "草地", "香港", 1600, "3岁以上"),
    makeOverseasG1Race("hong-kong-gold-cup", "香港金杯", 2, "草地", "香港", 2000, "3岁以上"),
    makeOverseasG1Race("queens-silver-jubilee-cup", "女皇银禧纪念杯", 2, "草地", "香港", 1400, "3岁以上"),
    makeOverseasG1Race("hong-kong-queen-elizabeth-ii-cup", "女皇杯", 4, "草地", "香港", 2000, "3岁以上"),
    makeOverseasG1Race("champions-mile", "冠军一哩赛", 4, "草地", "香港", 1600, "3岁以上"),
    makeOverseasG1Race("champions-chater-cup", "冠军暨遮打杯", 5, "草地", "香港", 2400, "3岁以上"),
    makeOverseasG1Race("hong-kong-sprint", "香港短途锦标", 12, "草地", "香港", 1200, "3岁以上"),
    makeOverseasG1Race("hong-kong-mile", "香港一哩锦标", 12, "草地", "香港", 1600, "3岁以上"),
    makeOverseasG1Race("hong-kong-cup", "香港杯", 12, "草地", "香港", 2000, "3岁以上"),
    makeOverseasG1Race("hong-kong-vase", "香港瓶", 12, "草地", "香港", 2400, "3岁以上")
  ];

  ns.Races = buildConditionRaces().concat(buildAllowanceRaces(), openRaces, gradedRaces, g1Races, jpn1Races, jpn2Races, jpn3Races, overseasG1Races);
})();
