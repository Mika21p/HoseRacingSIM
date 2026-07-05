(function () {
  const ns = (window.Keiba = window.Keiba || {});

  const EARLY = 1;
  const LATE = 2;
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
    [EARLY]: "early",
    [LATE]: "late"
  };
  const CONDITION_RACE_CLASSES = ["new", "maiden", "one-win", "two-win", "three-win"];

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
    return age * 24 + (month - 1) * 2 + (half || EARLY) - 1;
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

  function ageRestrictionFromRule(rule) {
    if (rule === "2岁") return { type: "exact", age: 2 };
    if (rule === "3岁") return { type: "exact", age: 3 };
    if (rule === "3岁以上") return { type: "min", age: 3 };
    if (rule === "4岁以上") return { type: "min", age: 4 };
    return { type: "min", age: 3 };
  }

  function seasonAgeFromRestriction(restriction) {
    return restriction && Number.isFinite(restriction.age) ? restriction.age : 3;
  }

  function withDisplayNames(race) {
    const nameZh = race.nameZh || race.name || race.nameOriginal || "";
    race.nameZh = nameZh;
    race.nameOriginal = race.nameOriginal || nameZh;
    race.name = nameZh;
    return race;
  }

  function makeConditionRace(kind, plan, surface, course, distance, index) {
    const isNew = kind === "new";
    const surfaceId = surface === "草地" ? "turf" : "dirt";
    const className = isNew ? "新马战" : "未胜利战";
    return withDisplayNames({
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
    });
  }

  function makeAllowanceRace(raceClass, plan, surface, course, distance, index) {
    const labels = {
      "one-win": { grade: "1胜", name: "一胜战" },
      "two-win": { grade: "2胜", name: "二胜战" },
      "three-win": { grade: "3胜", name: "三胜战" }
    };
    const label = labels[raceClass];
    const surfaceId = surface === "草地" ? "turf" : "dirt";
    return withDisplayNames({
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
    });
  }

  function makeNamedRace(region, spec) {
    const restriction = spec.ageRestriction || ageRestrictionFromRule(spec.ageRule);
    const nameZh = spec.nameZh || spec.name || spec.nameOriginal || "";
    const race = {
      id: spec.id,
      name: nameZh,
      nameZh,
      nameOriginal: spec.nameOriginal || nameZh,
      grade: spec.grade,
      raceClass: spec.raceClass,
      surface: spec.surface,
      surfaceRegion: spec.surfaceRegion || region || "日本",
      course: spec.course || "其他地方",
      distance: spec.distance,
      month: spec.month,
      half: spec.half,
      season: spec.season || seasonName(seasonAgeFromRestriction(restriction), spec.month),
      ageRule: spec.ageRule,
      ageRestriction: restriction
    };
    if (spec.sexRestriction) race.sexRestriction = spec.sexRestriction;
    return race;
  }

  function registerGeneratedRaces(region, category, races) {
    ns.RaceRegistry.register(region, category, races.map(withDisplayNames));
  }

  function registerNamedRaces(region, category, specs) {
    ns.RaceRegistry.register(region, category, specs.map((spec) => makeNamedRace(region, spec)));
  }

  ns.RaceData = {
    EARLY,
    LATE,
    CONDITION_RACE_CLASSES,
    ageRestrictionFromRule,
    makeConditionRace,
    makeAllowanceRace,
    registerGeneratedRaces,
    registerNamedRaces,
    turnRange,
    localFor,
    seasonName,
    ageRule
  };
})();
