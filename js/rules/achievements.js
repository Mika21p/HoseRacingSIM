(function () {
  const ns = (window.Keiba = window.Keiba || {});

  const TOP_LEVEL_CLASSES = ["g1", "jpn1"];
  const CATEGORY_ORDER = {
    base: 1,
    combo: 2,
    repeat: 3
  };
  const CATEGORY_LABELS = {
    base: "基础成就",
    combo: "赛事组合",
    repeat: "连霸成就"
  };

  const DEFINITIONS = [
    {
      id: "g1-winner",
      name: "G1胜者",
      category: "base",
      group: "g1-base",
      priority: 1,
      type: "classWinCount",
      raceClass: "g1",
      min: 1,
      description: "生涯胜出G1赛事"
    },
    {
      id: "g1-multiple-winner",
      name: "G1多胜",
      category: "base",
      group: "g1-base",
      priority: 2,
      type: "classWinCount",
      raceClass: "g1",
      min: 3,
      description: "生涯胜出3场以上G1赛事"
    },
    {
      id: "g1-legend",
      name: "G1传奇",
      category: "base",
      group: "g1-base",
      priority: 3,
      type: "classWinCount",
      raceClass: "g1",
      min: 7,
      description: "生涯胜出7场以上G1赛事"
    },
    {
      id: "jpni-champion",
      name: "JpnI冠军",
      category: "base",
      group: "jpni-base",
      priority: 1,
      type: "classWinCount",
      raceClass: "jpn1",
      min: 1,
      description: "生涯胜出JpnI赛事"
    },
    {
      id: "local-king",
      name: "地方王者",
      category: "base",
      group: "jpni-base",
      priority: 2,
      type: "classWinCount",
      raceClass: "jpn1",
      min: 4,
      description: "生涯胜出4场以上JpnI赛事"
    },
    {
      id: "foreign-g1-winner",
      name: "海外G1",
      category: "base",
      group: "foreign-g1-base",
      priority: 1,
      type: "foreignG1RegionCount",
      min: 1,
      description: "胜出所属地以外的G1赛事"
    },
    {
      id: "foreign-g1-tour",
      name: "海外巡回",
      category: "base",
      group: "foreign-g1-base",
      priority: 2,
      type: "foreignG1RegionCount",
      min: 2,
      description: "在2个以上所属地以外赛事地区胜出G1"
    },
    {
      id: "world-class-horse",
      name: "世界级名马",
      category: "base",
      group: "foreign-g1-base",
      priority: 3,
      type: "foreignG1RegionCount",
      min: 3,
      description: "在3个以上所属地以外赛事地区胜出G1"
    },
    {
      id: "juvenile-champion",
      name: "二岁王者",
      category: "base",
      type: "juvenileTopLevelWin",
      description: "2岁时胜出最高级别赛事"
    },
    {
      id: "japan-classic-triple-crown",
      name: "日本经典三冠",
      category: "combo",
      type: "raceSet",
      raceIds: ["satsuki-sho", "tokyo-yushun", "kikka-sho"],
      sameAge: true,
      description: "同一年龄年胜出皋月赏、日本德比、菊花赏"
    },
    {
      id: "japan-filly-triple-crown",
      name: "日本牝马三冠",
      category: "combo",
      type: "raceSet",
      raceIds: ["oka-sho", "yushun-himba", "shuka-sho"],
      sameAge: true,
      description: "同一年龄年胜出樱花赏、优骏牝马、秋华赏"
    },
    {
      id: "japan-alternate-triple-crown",
      name: "日本变则三冠",
      category: "combo",
      type: "raceSet",
      raceIds: ["oka-sho", "yushun-himba", "shuka-sho", "satsuki-sho", "tokyo-yushun", "kikka-sho"],
      minWins: 3,
      sameAge: true,
      description: "同一年龄年胜出日本经典/牝马六战中的任意三场"
    },
    {
      id: "japan-dirt-triple-crown",
      name: "日本泥地三冠",
      category: "combo",
      type: "raceSet",
      raceIds: ["haneda-hai", "tokyo-derby", "japan-dirt-classic"],
      sameAge: true,
      description: "同一年龄年胜出羽田杯、东京德比、日本泥地经典赛"
    },
    {
      id: "american-classic-triple-crown",
      name: "美国经典三冠",
      category: "combo",
      type: "raceSet",
      raceIds: ["kentucky-derby", "preakness-stakes", "belmont-stakes"],
      sameAge: true,
      description: "同一年龄年胜出肯塔基德比、必利时锦标、贝蒙锦标"
    },
    {
      id: "american-filly-triple-crown",
      name: "美国牝马三冠",
      category: "combo",
      type: "raceSet",
      raceIds: ["acorn-stakes", "coaching-club-american-oaks", "alabama-stakes"],
      sameAge: true,
      description: "同一年龄年胜出Acorn Stakes、Coaching Club American Oaks、Alabama Stakes"
    },
    {
      id: "british-classic-triple-crown",
      name: "英国经典三冠",
      category: "combo",
      type: "raceSet",
      raceIds: ["two-thousand-guineas", "epsom-derby", "st-leger-stakes"],
      sameAge: true,
      description: "同一年龄年胜出二千坚尼、叶森德比、圣烈治锦标"
    },
    {
      id: "british-filly-triple-crown",
      name: "英国牝马三冠",
      category: "combo",
      type: "raceSet",
      raceIds: ["one-thousand-guineas", "epsom-oaks", "st-leger-stakes"],
      sameAge: true,
      description: "同一年龄年胜出一千坚尼、叶森橡树、圣烈治锦标"
    },
    {
      id: "hong-kong-triple-crown",
      name: "香港三冠",
      category: "combo",
      type: "raceSet",
      raceIds: ["hong-kong-stewards-cup", "hong-kong-gold-cup", "champions-chater-cup"],
      sameAge: true,
      description: "同一年龄年胜出董事杯、香港金杯、冠军暨遮打杯"
    },
    {
      id: "hong-kong-sprint-triple-crown",
      name: "香港短途三冠",
      category: "combo",
      type: "raceSet",
      raceIds: ["centenary-sprint-cup", "queens-silver-jubilee-cup", "chairmans-sprint-prize"],
      sameAge: true,
      description: "同一年龄年胜出百周年纪念短途杯、女皇银禧纪念杯、主席短途奖"
    },
    {
      id: "spring-older-triple-crown",
      name: "春古马三冠",
      category: "combo",
      type: "raceSet",
      raceIds: ["osaka-hai", "tenno-sho-haru", "takarazuka-kinen"],
      sameAge: true,
      description: "同一年龄年胜出大阪杯、天皇赏春、宝塚纪念"
    },
    {
      id: "autumn-older-triple-crown",
      name: "秋古马三冠",
      category: "combo",
      type: "raceSet",
      raceIds: ["tenno-sho-aki", "japan-cup", "arima-kinen"],
      sameAge: true,
      description: "同一年龄年胜出天皇赏秋、日本杯、有马纪念"
    },
    {
      id: "spring-autumn-mile-king",
      name: "春秋英里王",
      category: "combo",
      type: "raceSet",
      raceIds: ["yasuda-kinen", "mile-championship"],
      sameAge: true,
      description: "同一年龄年胜出安田纪念、一哩冠军赛"
    },
    {
      id: "spring-autumn-sprint-king",
      name: "春秋短途王",
      category: "combo",
      type: "raceSet",
      raceIds: ["takamatsunomiya-kinen", "sprinters-stakes"],
      sameAge: true,
      description: "同一年龄年胜出高松宫纪念、短途马锦标"
    },
    {
      id: "spring-autumn-grand-prix",
      name: "春秋大奖赛",
      category: "combo",
      type: "raceSet",
      raceIds: ["takarazuka-kinen", "arima-kinen"],
      sameAge: true,
      description: "同一年龄年胜出宝塚纪念、有马纪念"
    },
    {
      id: "spring-autumn-tenno-sho",
      name: "春秋天皇赏",
      category: "combo",
      type: "raceSet",
      raceIds: ["tenno-sho-haru", "tenno-sho-aki"],
      sameAge: true,
      description: "同一年龄年胜出天皇赏春、天皇赏秋"
    },
    {
      id: "older-horse-road-sweep",
      name: "古马王道完全制霸",
      category: "combo",
      type: "raceSet",
      raceIds: ["osaka-hai", "tenno-sho-haru", "takarazuka-kinen", "tenno-sho-aki", "japan-cup", "arima-kinen"],
      sameAge: true,
      description: "同一年龄年胜出大阪杯、天皇赏春、宝塚纪念、天皇赏秋、日本杯、有马纪念"
    },
    {
      id: "dirt-king",
      name: "泥地王者",
      category: "combo",
      type: "raceSet",
      raceIds: ["saudi-cup", "dubai-world-cup", "breeders-cup-classic"],
      sameAge: true,
      description: "同一年龄年胜出沙特杯、迪拜世界杯、育马者杯经典赛"
    },
    {
      id: "annual-sprint-king",
      name: "短途王者",
      category: "combo",
      type: "annualTopLevelCount",
      min: 5,
      distanceMin: 1000,
      distanceMax: 1200,
      description: "同一年龄年胜出5场以上1000-1200米最高级别赛事"
    },
    {
      id: "annual-mile-king",
      name: "一哩王者",
      category: "combo",
      type: "annualTopLevelCount",
      min: 5,
      distanceExact: 1600,
      description: "同一年龄年胜出5场以上1600米最高级别赛事"
    },
    {
      id: "annual-stayer-king",
      name: "长途王者",
      category: "combo",
      type: "annualTopLevelCount",
      min: 4,
      distanceMin: 2600,
      description: "同一年龄年胜出4场以上2600米及以上最高级别赛事"
    },
    {
      id: "king-george-arc",
      name: "英皇凯旋",
      category: "combo",
      type: "raceSet",
      raceIds: ["king-george-vi-and-queen-elizabeth-stakes", "prix-de-larc"],
      sameAge: true,
      description: "同一年龄年胜出英皇锦标与凯旋门赏"
    }
  ];

  function recordPublic(record) {
    return record && record.public ? record.public : {};
  }

  function recordRace(record) {
    const hiddenRace = record && record.hidden && record.hidden.race;
    if (hiddenRace) return hiddenRace;
    const raceId = recordPublic(record).raceId;
    return (ns.Races || []).find((race) => race && race.id === raceId) || null;
  }

  function isWin(record) {
    const publicResult = recordPublic(record);
    return (publicResult.rank === 1 || publicResult.rankLabel === "一着" || publicResult.deadHeat) && !publicResult.retired;
  }

  function recordAge(record) {
    const schedule = record && record.hidden && record.hidden.schedule;
    if (schedule && Number.isFinite(schedule.age)) return schedule.age;
    return null;
  }

  function recordScheduleIndex(record) {
    const schedule = record && record.hidden && record.hidden.schedule;
    return schedule && Number.isFinite(schedule.index) ? schedule.index : null;
  }

  function raceName(record, race) {
    const publicResult = recordPublic(record);
    return publicResult.raceNameZh || publicResult.raceName || (race && (race.nameZh || race.name)) || "";
  }

  function isTopLevelRaceClass(raceClass) {
    return TOP_LEVEL_CLASSES.includes(raceClass);
  }

  function isForeignRecord(record, career, race) {
    const expedition = record && record.hidden && record.hidden.expedition;
    if (record && record.hidden && Object.prototype.hasOwnProperty.call(record.hidden, "expedition")) {
      return !!(expedition && expedition.active);
    }
    const raceRegion = (race && race.surfaceRegion) || "日本";
    if (ns.RegionRules && ns.RegionRules.getOriginalRegionId && ns.RegionRules.getRegion) {
      const region = ns.RegionRules.getRegion(ns.RegionRules.getOriginalRegionId(career));
      return !((region.raceRegions || []).includes(raceRegion));
    }
    return raceRegion !== "日本";
  }

  function collectWinRecords(career) {
    const records = career && Array.isArray(career.races) ? career.races : [];
    return records
      .filter(isWin)
      .map((record) => {
        const race = recordRace(record) || {};
        return {
          record,
          race,
          raceId: race.id || recordPublic(record).raceId || "",
          raceName: raceName(record, race),
          raceClass: race.raceClass || "",
          surfaceRegion: race.surfaceRegion || "日本",
          distance: race.distance || 0,
          surface: race.surface || "",
          age: recordAge(record),
          scheduleIndex: recordScheduleIndex(record),
          foreign: isForeignRecord(record, career, race)
        };
      })
      .filter((item) => item.raceId);
  }

  function countClassWins(winRecords, raceClass) {
    return winRecords.filter((item) => item.raceClass === raceClass).length;
  }

  function foreignG1RegionCount(winRecords) {
    const regions = new Set(
      winRecords
        .filter((item) => item.raceClass === "g1" && item.foreign)
        .map((item) => item.surfaceRegion)
        .filter(Boolean)
    );
    return regions.size;
  }

  function groupByAge(winRecords) {
    return winRecords.reduce((items, record) => {
      if (!Number.isFinite(record.age)) return items;
      if (!items[record.age]) items[record.age] = [];
      items[record.age].push(record);
      return items;
    }, {});
  }

  function raceSetMatches(records, definition) {
    const ids = new Set(records.map((record) => record.raceId));
    const matched = definition.raceIds.filter((raceId) => ids.has(raceId));
    return matched.length >= (definition.minWins || definition.raceIds.length);
  }

  function hasRaceSet(winRecords, definition) {
    if (!definition.sameAge) return raceSetMatches(winRecords, definition);
    const byAge = groupByAge(winRecords);
    return Object.keys(byAge).some((age) => raceSetMatches(byAge[age], definition));
  }

  function distanceMatches(record, definition) {
    if (definition.distanceExact != null && record.distance !== definition.distanceExact) return false;
    if (definition.distanceMin != null && record.distance < definition.distanceMin) return false;
    if (definition.distanceMax != null && record.distance > definition.distanceMax) return false;
    return true;
  }

  function hasAnnualTopLevelCount(winRecords, definition) {
    const byAge = groupByAge(winRecords.filter((record) => isTopLevelRaceClass(record.raceClass) && distanceMatches(record, definition)));
    return Object.keys(byAge).some((age) => byAge[age].length >= definition.min);
  }

  function definitionAchieved(definition, winRecords) {
    if (definition.type === "classWinCount") {
      return countClassWins(winRecords, definition.raceClass) >= definition.min;
    }
    if (definition.type === "foreignG1RegionCount") {
      return foreignG1RegionCount(winRecords) >= definition.min;
    }
    if (definition.type === "juvenileTopLevelWin") {
      return winRecords.some((record) => record.age === 2 && isTopLevelRaceClass(record.raceClass));
    }
    if (definition.type === "raceSet") {
      return hasRaceSet(winRecords, definition);
    }
    if (definition.type === "annualTopLevelCount") {
      return hasAnnualTopLevelCount(winRecords, definition);
    }
    return false;
  }

  function buildAchievement(definition, order) {
    return {
      id: definition.id,
      name: definition.name,
      category: definition.category,
      categoryLabel: CATEGORY_LABELS[definition.category] || "成就",
      group: definition.group || "",
      priority: definition.priority || 0,
      description: definition.description || "",
      order
    };
  }

  function detectRepeatAchievements(winRecords, startOrder) {
    const byRace = winRecords
      .filter((record) => isTopLevelRaceClass(record.raceClass) && Number.isFinite(record.age))
      .reduce((items, record) => {
        if (!items[record.raceId]) items[record.raceId] = [];
        items[record.raceId].push(record);
        return items;
      }, {});

    return Object.keys(byRace).sort().reduce((achievements, raceId) => {
      const records = byRace[raceId]
        .slice()
        .sort((a, b) => a.age - b.age || (a.scheduleIndex || 0) - (b.scheduleIndex || 0));
      const ages = [...new Set(records.map((record) => record.age))].sort((a, b) => a - b);
      const hasRepeat = ages.some((age, index) => index > 0 && age === ages[index - 1] + 1);
      if (!hasRepeat) return achievements;
      const source = records[records.length - 1];
      achievements.push({
        id: `repeat-${raceId}`,
        name: `${source.raceName}连霸`,
        category: "repeat",
        categoryLabel: CATEGORY_LABELS.repeat,
        group: "",
        priority: 0,
        description: `连续两年胜出${source.raceName}`,
        order: startOrder + achievements.length
      });
      return achievements;
    }, []);
  }

  function collapseGroupedAchievements(achievements) {
    const grouped = new Map();
    const result = [];
    achievements.forEach((achievement) => {
      if (!achievement.group) {
        result.push(achievement);
        return;
      }
      const current = grouped.get(achievement.group);
      if (!current || achievement.priority > current.priority) grouped.set(achievement.group, achievement);
    });
    grouped.forEach((achievement) => result.push(achievement));
    return result;
  }

  function sortAchievements(achievements) {
    return achievements.slice().sort((a, b) => {
      const categoryDiff = (CATEGORY_ORDER[a.category] || 99) - (CATEGORY_ORDER[b.category] || 99);
      if (categoryDiff !== 0) return categoryDiff;
      return a.order - b.order;
    });
  }

  function evaluate(career) {
    const winRecords = collectWinRecords(career);
    const fixed = DEFINITIONS
      .map((definition, index) => ({ definition, index }))
      .filter(({ definition }) => definitionAchieved(definition, winRecords))
      .map(({ definition, index }) => buildAchievement(definition, index));
    const repeated = detectRepeatAchievements(winRecords, DEFINITIONS.length);
    return sortAchievements(collapseGroupedAchievements(fixed.concat(repeated)));
  }

  ns.AchievementRules = {
    DEFINITIONS,
    collectWinRecords,
    evaluate
  };
})();
