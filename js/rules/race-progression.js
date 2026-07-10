(function () {
  const ns = (window.Keiba = window.Keiba || {});

  const CONDITION_CLASSES = ["new", "maiden", "one-win", "two-win", "three-win"];
  const OPEN_OR_GRADED = ["op", "g3", "jpn3", "g2", "jpn2", "g1", "jpn1"];
  const GRADED_CLASSES = ["g3", "jpn3", "g2", "jpn2", "g1", "jpn1"];
  const CHALLENGE_LIMIT = 2;
  const PRIORITY_ENTRY_RULES = {
    "february-stakes": [
      { raceId: "procyon-stakes", maxRank: 1 },
      { raceId: "negishi-stakes", maxRank: 1 }
    ],
    "takamatsunomiya-kinen": [
      { raceId: "hankyu-hai", maxRank: 1 },
      { raceId: "ocean-stakes", maxRank: 1 }
    ],
    "osaka-hai": [
      { raceId: "nakayama-kinen", maxRank: 1 },
      { raceId: "kinko-sho", maxRank: 1 }
    ],
    "oka-sho": [
      { raceId: "tulip-sho", maxRank: 3 },
      { raceId: "anemone-stakes", maxRank: 2 },
      { raceId: "fillies-revue", maxRank: 3 }
    ],
    "satsuki-sho": [
      { raceId: "yayoi-sho", maxRank: 3 },
      { raceId: "wakaba-stakes", maxRank: 2 },
      { raceId: "spring-stakes", maxRank: 3 }
    ],
    "tenno-sho-haru": [
      { raceId: "hanshin-daishoten", maxRank: 1 },
      { raceId: "nikkei-sho", maxRank: 1 }
    ],
    "nhk-mile-cup": [
      { raceId: "new-zealand-trophy", maxRank: 3 },
      { raceId: "churchill-downs-cup", maxRank: 3 }
    ],
    "victoria-mile": [
      { raceId: "hanshin-himba-stakes", maxRank: 1 },
      { raceId: "fukushima-himba-stakes", maxRank: 1 }
    ],
    "tokyo-yushun": [
      { raceId: "satsuki-sho", maxRank: 5 },
      { raceId: "aoba-sho", maxRank: 2 },
      { raceId: "principal-stakes", maxRank: 1 }
    ],
    "yushun-himba": [
      { raceId: "oka-sho", maxRank: 5 },
      { raceId: "flora-stakes", maxRank: 2 },
      { raceId: "sweetpea-stakes", maxRank: 1 }
    ],
    "yasuda-kinen": [
      { raceId: "yomiuri-milers-cup", maxRank: 1 },
      { raceId: "keio-hai-spring-cup", maxRank: 1 }
    ],
    "sprinters-stakes": [
      { raceId: "keeneland-cup", maxRank: 1 },
      { raceId: "centaur-stakes", maxRank: 1 }
    ],
    "shuka-sho": [
      { raceId: "shion-stakes", maxRank: 3 },
      { raceId: "rose-stakes", maxRank: 3 }
    ],
    "kikka-sho": [
      { raceId: "st-lite-kinen", maxRank: 3 },
      { raceId: "kobe-shimbun-hai", maxRank: 3 }
    ],
    "tenno-sho-aki": [
      { raceId: "sankei-sho-all-comers", maxRank: 1 },
      { raceId: "mainichi-okan", maxRank: 1 },
      { raceId: "kyoto-daishoten", maxRank: 1 }
    ],
    "queen-elizabeth-ii-cup": [
      { raceId: "ireland-trophy", maxRank: 1 }
    ],
    "mile-championship": [
      { raceId: "fuji-stakes", maxRank: 1 },
      { raceId: "swan-stakes", maxRank: 1 }
    ],
    "champions-cup": [
      { raceId: "miyako-stakes", maxRank: 1 },
      { raceId: "musashino-stakes", maxRank: 1 }
    ]
  };
  const CHALLENGE_PROBABILITIES = {
    age2: {
      g2: 0.2,
      jpn2: 0.2,
      g1: 0.4,
      jpn1: 0.4
    },
    age3Spring: {
      op: 0.2,
      g3: 0.2,
      jpn3: 0.2,
      g2: 0.2,
      jpn2: 0.2,
      g1: 0.4,
      jpn1: 0.4
    },
    age3AutumnThreeWin: {
      g1: 0.4,
      jpn1: 0.4
    }
  };

  function isWin(record) {
    return (record.public.rank === 1 || record.public.rankLabel === "一着") && !record.public.retired;
  }

  function rankValue(record) {
    const publicResult = record && record.public ? record.public : {};
    if (Number.isFinite(publicResult.rank)) return publicResult.rank;
    const labels = {
      "一着": 1,
      "二着": 2,
      "三着": 3,
      "四着": 4,
      "五着": 5
    };
    return labels[publicResult.rankLabel] || null;
  }

  function recordRace(record) {
    const hiddenRace = record && record.hidden && record.hidden.race;
    if (hiddenRace) return hiddenRace;
    const raceId = record && record.public ? record.public.raceId : "";
    return (ns.Races || []).find((race) => race && race.id === raceId) || null;
  }

  function isJapanCentralG1(race) {
    if (!race || race.raceClass !== "g1") return false;
    if (ns.RegionRules && ns.RegionRules.getRaceRegionId) {
      return ns.RegionRules.getRaceRegionId(race) === "japan";
    }
    return race.surfaceRegion === "日本";
  }

  function hasJapanG1PromotionResult(career) {
    return career.races.some((record) => {
      const rank = rankValue(record);
      return rank != null
        && rank <= 2
        && !(record.public && record.public.retired)
        && isJapanCentralG1(recordRace(record));
    });
  }

  function wonClass(career, raceClass) {
    return career.races.some((record) => isWin(record) && record.hidden.race.raceClass === raceClass);
  }

  function wonAny(career, raceClasses) {
    return career.races.some((record) => isWin(record) && raceClasses.includes(record.hidden.race.raceClass));
  }

  function hasAnyWin(career) {
    return career.races.some(isWin);
  }

  function isInitialWin(career) {
    return wonClass(career, "new") || wonClass(career, "maiden");
  }

  function hasKikkaThreeWinEntry(career, race, schedule) {
    return !!race
      && race.id === "kikka-sho"
      && !!schedule
      && schedule.age === 3
      && wonClass(career, "three-win");
  }

  function recordScheduleIndex(record) {
    const schedule = record && record.hidden ? record.hidden.schedule : null;
    return schedule && Number.isFinite(schedule.index) ? schedule.index : null;
  }

  function getPriorityEntryInfo(career, race, schedule) {
    if (!career || !race || !schedule) return null;
    const rules = PRIORITY_ENTRY_RULES[race.id];
    if (!rules) return null;
    return career.races.reduce((best, record) => {
      const sourceRace = recordRace(record);
      const rule = rules.find((item) => sourceRace && sourceRace.id === item.raceId);
      if (!rule) return best;
      const sourceIndex = recordScheduleIndex(record);
      const rank = rankValue(record);
      const matched = rank != null
        && rank <= rule.maxRank
        && !(record.public && record.public.retired)
        && (sourceIndex == null || sourceIndex < schedule.index);
      if (!matched) return best;
      if (best) {
        if (sourceIndex == null) return best;
        if (best.sourceScheduleIndex != null && best.sourceScheduleIndex > sourceIndex) return best;
      }
      return {
        targetRaceId: race.id,
        sourceRaceId: sourceRace.id,
        sourceScheduleIndex: sourceIndex,
        rank,
        maxRank: rule.maxRank,
        sourceRaceClass: sourceRace.raceClass || "",
        sourceRaceNameZh: ns.RaceNameRules ? ns.RaceNameRules.displayName(sourceRace, "zh") : sourceRace.nameZh || sourceRace.name || "",
        sourceRaceNameOriginal: ns.RaceNameRules
          ? ns.RaceNameRules.displayName(sourceRace, "original")
          : sourceRace.nameOriginal || sourceRace.name || "",
        targetScheduleIndex: schedule.index
      };
    }, null);
  }

  function hasPriorityEntry(career, race, schedule) {
    return !!getPriorityEntryInfo(career, race, schedule);
  }

  function isBeforeJulyThree(schedule) {
    return schedule.age === 3 && schedule.month <= 6;
  }

  function isAfterJuneThree(schedule) {
    return !!schedule && schedule.age === 3 && schedule.month >= 7;
  }

  function createChallengeState() {
    return {
      age2Used: 0,
      age3SpringUsed: 0,
      age3AutumnThreeWinUsed: 0,
      exclusions: []
    };
  }

  function normalizeChallengeUsed(value) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return 0;
    return Math.max(0, Math.min(CHALLENGE_LIMIT, Math.floor(numeric)));
  }

  function ensureChallengeState(career) {
    if (!career) return createChallengeState();
    if (!career.challenge || typeof career.challenge !== "object") {
      career.challenge = createChallengeState();
    }
    career.challenge.age2Used = normalizeChallengeUsed(career.challenge.age2Used);
    career.challenge.age3SpringUsed = normalizeChallengeUsed(career.challenge.age3SpringUsed);
    career.challenge.age3AutumnThreeWinUsed = normalizeChallengeUsed(career.challenge.age3AutumnThreeWinUsed);
    if (!Array.isArray(career.challenge.exclusions)) career.challenge.exclusions = [];
    return career.challenge;
  }

  function challengeWindow(schedule) {
    if (!schedule) return "";
    if (schedule.age === 2) return "age2";
    if (isBeforeJulyThree(schedule)) return "age3Spring";
    return "";
  }

  function challengeUsedKey(windowId) {
    if (windowId === "age2") return "age2Used";
    if (windowId === "age3AutumnThreeWin") return "age3AutumnThreeWinUsed";
    return "age3SpringUsed";
  }

  function challengeWindowFor(career, race, schedule) {
    const baseWindow = challengeWindow(schedule);
    if (baseWindow) return baseWindow;
    if (isAfterJuneThree(schedule)
      && wonClass(career, "three-win")
      && (race.raceClass === "g1" || race.raceClass === "jpn1")) {
      return "age3AutumnThreeWin";
    }
    return "";
  }

  function challengeKey(race, schedule) {
    return `${race.id}:${schedule.index}`;
  }

  function hasOwn(source, key) {
    return Object.prototype.hasOwnProperty.call(source || {}, key);
  }

  function challengeProbability(raceClass, windowId) {
    const table = CHALLENGE_PROBABILITIES[windowId];
    return hasOwn(table, raceClass) ? table[raceClass] : null;
  }

  function consumesOnChallengeExclusion(raceClass, windowId) {
    return !(windowId === "age3Spring" && raceClass === "op");
  }

  function hasChallengeExclusion(career, race, schedule) {
    if (!career || !race || !schedule) return false;
    const state = ensureChallengeState(career);
    const key = challengeKey(race, schedule);
    return state.exclusions.some((item) => item.key === key
      || (item.raceId === race.id && item.scheduleIndex === schedule.index));
  }

  function allowedClasses(career, schedule) {
    const hasJapanG1Promotion = hasJapanG1PromotionResult(career);
    if (career.races.length === 0) return ["new"];
    if (!hasAnyWin(career) && !hasJapanG1Promotion) return ["maiden"];
    if (wonAny(career, ["op"].concat(GRADED_CLASSES)) || hasJapanG1Promotion) return OPEN_OR_GRADED;
    if (wonClass(career, "three-win")) return ["op", "g3", "jpn3"];
    if (wonClass(career, "two-win")) return ["three-win"];
    if (wonClass(career, "one-win")) {
      if (schedule.age === 2) return ["op", "g3", "jpn3", "g2", "jpn2", "g1", "jpn1"];
      if (isBeforeJulyThree(schedule)) return ["op", "g3", "jpn3"];
      return ["two-win"];
    }
    if (isInitialWin(career)) {
      if (schedule.age === 2) return ["one-win", "op", "g3", "jpn3"];
      return ["one-win"];
    }
    return ["maiden"];
  }

  function isRaceAllowed(career, race, schedule) {
    if (hasPriorityEntry(career, race, schedule)) return true;
    if (hasKikkaThreeWinEntry(career, race, schedule)) return true;
    return allowedClasses(career, schedule).includes(race.raceClass);
  }

  function getChallengeInfo(career, race, schedule) {
    if (!career || !race || !schedule) return null;
    if (!hasAnyWin(career)) return null;
    if (isRaceAllowed(career, race, schedule)) return null;
    const windowId = challengeWindowFor(career, race, schedule);
    const probability = challengeProbability(race.raceClass, windowId);
    if (probability == null) return null;
    if (hasChallengeExclusion(career, race, schedule)) return null;
    const state = ensureChallengeState(career);
    const usedKey = challengeUsedKey(windowId);
    const used = state[usedKey] || 0;
    const remaining = CHALLENGE_LIMIT - used;
    if (remaining <= 0) return null;
    return {
      key: challengeKey(race, schedule),
      window: windowId,
      probability,
      used,
      remaining,
      limit: CHALLENGE_LIMIT,
      consumesOnAccept: true,
      consumesOnExclusion: consumesOnChallengeExclusion(race.raceClass, windowId)
    };
  }

  function consumeChallengeUse(career, windowId) {
    const state = ensureChallengeState(career);
    const usedKey = challengeUsedKey(windowId);
    state[usedKey] = Math.min(CHALLENGE_LIMIT, (state[usedKey] || 0) + 1);
    return state[usedKey];
  }

  function recordChallengeAccepted(career, plan) {
    if (!plan || !plan.challenge) return null;
    if (plan.challenge.consumesOnAccept) consumeChallengeUse(career, plan.challenge.window);
    return plan.challenge;
  }

  function recordChallengeExclusion(career, plan) {
    if (!plan || !plan.challenge) return null;
    const state = ensureChallengeState(career);
    const race = plan.race;
    const schedule = plan.schedule;
    const existing = state.exclusions.some((item) => item.key === plan.challenge.key);
    if (!existing) {
      state.exclusions.push({
        key: plan.challenge.key,
        raceId: race.id,
        scheduleIndex: schedule.index,
        raceName: ns.RaceNameRules ? ns.RaceNameRules.displayName(race, "zh") : race.name,
        raceNameZh: ns.RaceNameRules ? ns.RaceNameRules.displayName(race, "zh") : race.name,
        raceNameOriginal: ns.RaceNameRules ? ns.RaceNameRules.displayName(race, "original") : race.name,
        timeLabel: schedule.label,
        raceClass: race.raceClass,
        probability: plan.challenge.probability,
        consumedChance: plan.challenge.consumesOnExclusion,
        excludedAtIndex: career.currentTime ? career.currentTime.index : null
      });
    }
    if (plan.challenge.consumesOnExclusion) consumeChallengeUse(career, plan.challenge.window);
    return plan.challenge;
  }

  function applyChallengeOutcome(career, plan, excluded) {
    return excluded
      ? recordChallengeExclusion(career, plan)
      : recordChallengeAccepted(career, plan);
  }

  function filterPlans(career, plans) {
    return plans.reduce((items, plan) => {
      if (hasChallengeExclusion(career, plan.race, plan.schedule)) return items;
      const priorityEntry = getPriorityEntryInfo(career, plan.race, plan.schedule);
      if (isRaceAllowed(career, plan.race, plan.schedule)) {
        items.push({ ...plan, challenge: null, priorityEntry });
        return items;
      }
      const challenge = getChallengeInfo(career, plan.race, plan.schedule);
      if (challenge) items.push({ ...plan, challenge });
      return items;
    }, []);
  }

  ns.RaceProgression = {
    CONDITION_CLASSES,
    OPEN_OR_GRADED,
    PRIORITY_ENTRY_RULES,
    allowedClasses,
    isRaceAllowed,
    hasPriorityEntry,
    getPriorityEntryInfo,
    hasJapanG1PromotionResult,
    hasKikkaThreeWinEntry,
    createChallengeState,
    ensureChallengeState,
    challengeKey,
    challengeProbability,
    getChallengeInfo,
    recordChallengeAccepted,
    recordChallengeExclusion,
    applyChallengeOutcome,
    filterPlans
  };
})();
