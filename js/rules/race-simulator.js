(function () {
  const ns = (window.Keiba = window.Keiba || {});
  const R = ns.Random;
  const SMALL_MARGIN_LABELS = ["头差", "颈差", "0.5马身"];

  function getGateResult(value) {
    if (value <= 1) return { label: "极好出", mod: 5 };
    if (value <= 3) return { label: "好出", mod: 2 };
    if (value <= 7) return { label: "普通出", mod: 0 };
    if (value <= 9) return { label: "迟出", mod: -2 };
    return { label: "大迟出", mod: -5 };
  }

  function getPositionResult(value, riderAbility) {
    const threshold = Math.floor(riderAbility / 3);
    if (value <= 5) return { label: "完美取位", mod: 5 };
    if (value <= threshold) return { label: "良好取位", mod: 2 };
    if (value <= riderAbility) return { label: "普通取位", mod: 0 };
    if (value <= 95) return { label: "失误取位", mod: -2 };
    return { label: "严重失误", mod: -5 };
  }

  function rollTrackCondition() {
    const value = R.roll(100);
    if (value <= 80) return "良";
    if (value <= 90) return "稍重";
    if (value <= 95) return "重";
    return "不良";
  }

  function getPointsPerLength(distance) {
    return distance >= 2000 ? 2 : 3;
  }

  function rollPlacementWhenBehind(lengthsBehind) {
    if (lengthsBehind < 1) return 2;
    if (lengthsBehind < 3) return R.rollRange(2, 4);
    if (lengthsBehind < 5) return R.rollRange(3, 5);
    if (lengthsBehind <= 6) return R.roll(2) === 1 ? 5 : null;
    return null;
  }

  function rollTieOutcome() {
    const value = R.roll(100);
    if (value <= 49) return "player-win";
    if (value <= 98) return "player-loss";
    return "dead-heat";
  }

  function createMarginLabel(marginLengths, tieOutcome) {
    if (tieOutcome === "dead-heat") return "";
    if (tieOutcome === "player-win" || tieOutcome === "player-loss") return "鼻差";
    if (typeof marginLengths !== "number" || !Number.isFinite(marginLengths)) return "";
    if (marginLengths === 0) return "鼻差";
    if (marginLengths > 0 && marginLengths < 1) return R.pickOne(SMALL_MARGIN_LABELS);

    const integer = Math.floor(marginLengths);
    if (marginLengths === integer) return `${integer}马身`;
    return `${integer + 0.5}马身`;
  }

  function rankLabel(rank, retired) {
    const labels = {
      1: "一着",
      2: "二着",
      3: "三着",
      4: "四着",
      5: "五着"
    };
    if (retired) return "退赛";
    return rank ? labels[rank] || `${rank}着` : "着外";
  }

  function finalMark(result) {
    if (!result || result.retired) return "退赛";
    return String(result.total);
  }

  function runOneRunner(entry) {
    const riderMod = Math.floor(entry.riderAbility / 10);
    const base = entry.ability + riderMod;
    let retired = false;
    let retiredPhase = "";

    const gateRoll = R.roll(10);
    const gate = getGateResult(gateRoll);
    const gateRandom = R.roll(5);
    const gateTotal = gate.mod + gateRandom;
    if (gate.mod === -5 && gateRandom === 1 && R.roll(2) === 1) {
      retired = true;
      retiredPhase = "序盘";
    }

    let positionRoll = null;
    let position = null;
    let positionRandom = null;
    let positionTotal = null;
    if (!retired) {
      positionRoll = R.roll(100);
      position = getPositionResult(positionRoll, entry.riderAbility);
      positionRandom = R.roll(5);
      positionTotal = position.mod + positionRandom;
      if (position.mod === -5 && positionRandom === 1) {
        retired = true;
        retiredPhase = "中盘";
      }
    }

    let sprintRoll = null;
    let sprintRandom = null;
    let sprintTotal = null;
    if (!retired) {
      sprintRoll = R.roll(entry.specialSprint ? 6 : 5);
      sprintRandom = R.roll(5);
      sprintTotal = sprintRoll + sprintRandom;
      if (sprintRoll === 1 && sprintRandom === 1 && R.roll(4) === 1) {
        retired = true;
        retiredPhase = "末盘";
      }
    }

    const total = retired ? null : base + gateTotal + positionTotal + sprintTotal;
    return {
      entry,
      base,
      riderMod,
      retired,
      retiredPhase,
      total,
      phases: {
        gate: { roll: gateRoll, random: gateRandom, result: gate, total: gateTotal },
        position: { roll: positionRoll, random: positionRandom, result: position, total: positionTotal },
        sprint: { roll: sprintRoll, random: sprintRandom, total: sprintTotal }
      }
    };
  }

  function resolveJockey(jockeyId, year, fallbackId) {
    const selected = ns.JockeyRules.describeHistoricalJockey(jockeyId, year);
    if (selected.available) return selected;
    return ns.JockeyRules.describeHistoricalJockey(fallbackId || "generic-local", year);
  }

  function jockeyAffiliationForRace(race) {
    const region = race.surfaceRegion || "日本";
    if (region === "美国" || region === "阿根廷") return "usa";
    if (region === "欧洲" || region === "中东") return "europe";
    if (region === "香港") return "hongkong";
    if (region === "澳洲") return "australia";
    return "japan";
  }

  function isJapanRace(race) {
    return !race.surfaceRegion || race.surfaceRegion === "日本";
  }

  function getBaseGeneratedOpponentRange(race) {
    const ranges = {
      new: [60, 64],
      maiden: [60, 64],
      "one-win": [62, 65],
      "two-win": [64, 66],
      "three-win": [66, 68],
      op: [68, 72],
      listed: [68, 72],
      g3: [70, 74],
      g2: [72, 76]
    };
    if (race.raceClass === "jpn1") return [74, 78];
    if (race.raceClass === "jpn2") return [70, 74];
    if (race.raceClass === "jpn3") return [68, 72];
    if (race.raceClass === "g1") return isJapanRace(race) ? [76, 80] : [78, 82];
    return ranges[race.raceClass] || race.fallbackOpponentRange || [70, 80];
  }

  function getGeneratedOpponentSpec(race) {
    const conditionClasses = ["new", "maiden", "one-win", "two-win", "three-win"];
    const openToG2Classes = ["op", "g3", "jpn3", "g2", "jpn2"];
    if (conditionClasses.includes(race.raceClass) && R.roll(100) <= 10) {
      return { range: [66, 70], name: "随机强敌", upgraded: true };
    }
    if (openToG2Classes.includes(race.raceClass) && R.roll(100) <= 10) {
      const range = race.raceClass === "jpn2" || race.raceClass === "jpn3" ? [76, 80] : [78, 82];
      return { range, name: "随机强敌", upgraded: true };
    }
    return { range: getBaseGeneratedOpponentRange(race), name: "", upgraded: false };
  }

  function createGeneratedOpponent(race, year, reason) {
    const spec = getGeneratedOpponentSpec(race);
    const jockey = ns.JockeyRules.pickDefaultJockey(jockeyAffiliationForRace(race))
      || ns.JockeyRules.describePlayerJockey("generic-local");
    return {
      id: `${race.id}-generated-${reason || "fallback"}`,
      name: spec.name,
      year: year || null,
      ability: R.rollRange(spec.range[0], spec.range[1]),
      jockeyId: jockey.id,
      jockeyName: jockey.name,
      riderAbility: jockey.ability || 70,
      trackCondition: "",
      historical: false,
      generatedReason: reason || "fallback",
      generatedRange: spec.range,
      generatedUpgraded: spec.upgraded
    };
  }

  function getHistoricalCandidates(race) {
    return ns.HistoricalOpponentRules
      ? ns.HistoricalOpponentRules.getByRaceId(race.id)
      : [];
  }

  function isChampionOpponent(candidate) {
    if (!candidate) return false;
    return candidate.finish === 1 || candidate.champion === true;
  }

  function filterOpponentCandidates(candidates, options) {
    const opts = options || {};
    const pool = opts.pool || "champions";
    if (pool === "all") return candidates.slice();
    if (pool === "featured") {
      return candidates.filter((candidate) => isChampionOpponent(candidate) || candidate.featured === true);
    }
    return candidates.filter(isChampionOpponent);
  }

  function chooseOpponent(race, options) {
    const opts = options || {};
    const candidates = filterOpponentCandidates(
      getHistoricalCandidates(race),
      { pool: opts.opponentPool || "champions" }
    );
    if (candidates.length > 0) {
      const picked = R.pickOne(candidates);
      const jockey = resolveJockey(picked.jockeyId, picked.year, "generic-local");
      return {
        id: picked.id || `${race.id}-${picked.year}`,
        horseId: picked.horseId || "",
        name: picked.name,
        displayName: picked.displayName || picked.name,
        displayNameZh: picked.displayNameZh || picked.displayName || picked.name,
        displayNameEn: picked.displayNameEn || picked.name || picked.displayName,
        year: picked.year,
        ability: picked.ability,
        jockeyId: jockey.id,
        jockeyName: jockey.name,
        riderAbility: jockey.ability || 70,
        trackCondition: picked.trackCondition || "",
        finish: picked.finish || null,
        historical: true,
        source: picked.source || "historical-horses"
      };
    }
    return createGeneratedOpponent(race, null, "fallback");
  }

  function opponentEntry(opponent, key) {
    return {
      key: key || "opponent",
      name: opponent.name || "随机对手",
      ability: opponent.ability,
      jockeyId: opponent.jockeyId,
      jockeyName: opponent.jockeyName,
      riderAbility: opponent.riderAbility,
      specialSprint: false
    };
  }

  const CONDITION_RACE_CLASSES = ["new", "maiden", "one-win", "two-win", "three-win"];
  const FIELD_RACE_CLASSES = ["op", "listed", "g3", "jpn3", "g2", "jpn2", "g1", "jpn1"];
  const FIELD_OPPONENT_RIDER_ABILITY = 60;
  const LOWER_FIELD_OPPONENT_ABILITY = {
    op: 66,
    listed: 66,
    g3: 68,
    jpn3: 66,
    g2: 70,
    jpn2: 68,
    g1: 72,
    jpn1: 70
  };

  function usesFieldRanking(race) {
    if (!race || CONDITION_RACE_CLASSES.includes(race.raceClass)) return false;
    return FIELD_RACE_CLASSES.includes(race.raceClass);
  }

  function lowerFieldOpponentAbility(race) {
    if (Object.prototype.hasOwnProperty.call(LOWER_FIELD_OPPONENT_ABILITY, race.raceClass)) {
      return LOWER_FIELD_OPPONENT_ABILITY[race.raceClass];
    }
    return getBaseGeneratedOpponentRange(race)[0];
  }

  function createHiddenFieldOpponent(race, ability, group, index) {
    return {
      id: `${race.id}-hidden-${group}-${index}`,
      name: "",
      year: null,
      ability,
      jockeyId: "hidden-field-jockey",
      jockeyName: "隐藏对手",
      riderAbility: FIELD_OPPONENT_RIDER_ABILITY,
      trackCondition: "",
      historical: false,
      hiddenFieldOpponent: true,
      generatedReason: `hidden-${group}`,
      generatedRange: [ability, ability],
      generatedUpgraded: false
    };
  }

  function createHiddenFieldOpponents(race) {
    const currentAbility = getBaseGeneratedOpponentRange(race)[0];
    const lowerAbility = lowerFieldOpponentAbility(race);
    return [
      createHiddenFieldOpponent(race, currentAbility, "current", 1),
      createHiddenFieldOpponent(race, currentAbility, "current", 2),
      createHiddenFieldOpponent(race, lowerAbility, "lower", 1),
      createHiddenFieldOpponent(race, lowerAbility, "lower", 2)
    ];
  }

  function orderedFieldResults(results) {
    return results
      .map((result, index) => ({ result, index, tieBreaker: R.rollRange(1, 1000000) }))
      .sort((a, b) => {
        if (a.result.retired !== b.result.retired) return a.result.retired ? 1 : -1;
        if (a.result.retired && b.result.retired) return a.index - b.index;
        if (a.result.total !== b.result.total) return b.result.total - a.result.total;
        if (a.tieBreaker !== b.tieBreaker) return b.tieBreaker - a.tieBreaker;
        return a.index - b.index;
      })
      .map((item, index) => {
        item.result.fieldPosition = index + 1;
        item.result.fieldTieBreaker = item.tieBreaker;
        return item.result;
      });
  }

  function raceNameSourceFor(race) {
    return ns.RaceNameRules && ns.RaceNameRules.findRaceById
      ? ns.RaceNameRules.findRaceById(race.id) || race
      : race;
  }

  function raceDisplayNameFor(source, race, mode) {
    return ns.RaceNameRules ? ns.RaceNameRules.displayName(source, mode) : race.name;
  }

  function preRaceFatigue(condition) {
    return condition && condition.fatigue ? condition.fatigue : null;
  }

  function preRaceAbilityMod(condition) {
    if (ns.RaceFatigueRules && ns.RaceFatigueRules.abilityMod) {
      return ns.RaceFatigueRules.abilityMod(condition);
    }
    const fatigue = preRaceFatigue(condition);
    return fatigue && fatigue.triggered ? fatigue.abilityMod || 0 : 0;
  }

  function preRaceAccidentInjury(condition) {
    if (ns.RaceFatigueRules && ns.RaceFatigueRules.accidentInjury) {
      return ns.RaceFatigueRules.accidentInjury(condition);
    }
    const fatigue = preRaceFatigue(condition);
    return fatigue && fatigue.accident ? fatigue.accidentInjury : null;
  }

  function applyPreRaceAccident(result, condition) {
    const fatigue = preRaceFatigue(condition);
    if (!result || !fatigue || !fatigue.triggered || !fatigue.accident) return result;
    result.retired = true;
    result.retiredPhase = fatigue.accidentPhase || "末盘";
    result.total = null;
    result.fatigueAccident = true;
    return result;
  }

  function retirementInjury(result, condition) {
    if (!result || !result.retired) return null;
    if (result.fatigueAccident) {
      return preRaceAccidentInjury(condition);
    }
    return ns.InjuryRules ? ns.InjuryRules.rollInjury(result.retiredPhase) : null;
  }

  function buildRaceContext(horse, race, options) {
    const opts = options || {};
    const opponent = opts.opponent || chooseOpponent(race);
    const trackCondition = opts.trackCondition || opponent.trackCondition || rollTrackCondition();
    const playerJockey = opts.playerJockey || ns.JockeyRules.describePlayerJockey(opts.playerJockeyId || "generic-local");
    const playerRiderAbility = playerJockey.ability || opts.playerRiderAbility || 70;
    const preRaceCondition = opts.preRaceCondition || null;
    const playerCalc = ns.HorseRules.calcRaceAbility(horse, race, {
      trackCondition,
      currentTime: opts.currentTime,
      maturityDecline: opts.maturityDecline || 0,
      maturity: opts.maturity,
      temperamentMod: opts.temperamentMod,
      racePenaltyMod: preRaceAbilityMod(preRaceCondition)
    });
    const playerEntry = {
      key: "player",
      name: horse.name,
      ability: playerCalc.ability,
      jockeyId: playerJockey.id,
      jockeyName: playerJockey.name,
      riderAbility: playerRiderAbility,
      specialSprint: false
    };
    return {
      opts,
      opponent,
      trackCondition,
      playerJockey,
      playerEntry,
      playerCalc,
      preRaceCondition
    };
  }

  function simulateDuelRace(horse, race, context) {
    const opts = context.opts;
    const opponent = context.opponent;
    const trackCondition = context.trackCondition;
    const playerJockey = context.playerJockey;
    const playerEntry = context.playerEntry;
    const playerCalc = context.playerCalc;
    const entries = [
      playerEntry,
      opponentEntry(opponent)
    ];

    const initialResults = entries.map(runOneRunner);
    const playerResult = initialResults.find((item) => item.entry.key === "player");
    const initialOpponentResult = initialResults.find((item) => item.entry.key === "opponent");
    applyPreRaceAccident(playerResult, context.preRaceCondition);
    let competitiveOpponent = opponent;
    let competitiveOpponentResult = initialOpponentResult;
    let replacementOpponent = null;
    let replacementResult = null;

    if (!playerResult.retired && initialOpponentResult.retired) {
      replacementOpponent = opts.replacementOpponent || createGeneratedOpponent(
        race,
        null,
        "scheduled-opponent-retired"
      );
      replacementResult = runOneRunner(opponentEntry(replacementOpponent));
      competitiveOpponent = replacementOpponent;
      competitiveOpponentResult = replacementResult;
    }

    const finalResults = [
      playerResult,
      competitiveOpponentResult
    ];
    const finishers = finalResults.filter((item) => !item.retired).sort((a, b) => b.total - a.total);
    const retirees = finalResults.filter((item) => item.retired);
    const ordered = finishers.concat(retirees);
    const playerRankInDuel = ordered.findIndex((item) => item.entry.key === "player") + 1;
    let opponentRank = ordered.findIndex((item) => item.entry.key === "opponent") + 1;
    const pointsPerLength = getPointsPerLength(race.distance);
    let scoreDiff = null;
    let marginLengths = null;
    let playerRank = playerRankInDuel;
    let tieOutcome = "";

    if (playerResult.retired) {
      playerRank = null;
    } else if (competitiveOpponentResult.retired) {
      playerRank = 1;
    } else {
      scoreDiff = playerResult.total - competitiveOpponentResult.total;
      marginLengths = Math.abs(scoreDiff) / pointsPerLength;
      if (scoreDiff > 0) {
        playerRank = 1;
        opponentRank = 2;
      } else if (scoreDiff < 0) {
        playerRank = rollPlacementWhenBehind(marginLengths);
        opponentRank = 1;
      } else {
        tieOutcome = rollTieOutcome();
        if (tieOutcome === "player-win") {
          playerRank = 1;
          opponentRank = 2;
        } else if (tieOutcome === "player-loss") {
          playerRank = 2;
          opponentRank = 1;
        } else {
          playerRank = 1;
          opponentRank = 1;
        }
      }
    }
    const injury = retirementInjury(playerResult, context.preRaceCondition);
    const raceNameSource = raceNameSourceFor(race);
    const marginLabel = createMarginLabel(marginLengths, tieOutcome);

    return {
      public: {
        raceId: race.id,
        raceName: raceDisplayNameFor(raceNameSource, race, "zh"),
        raceNameZh: raceDisplayNameFor(raceNameSource, race, "zh"),
        raceNameOriginal: raceDisplayNameFor(raceNameSource, race, "original"),
        trackCondition,
        rank: playerRank,
        rankLabel: rankLabel(playerRank, playerResult.retired),
        opponentName: opponent.displayName || opponent.name || "",
        opponentNameZh: opponent.displayNameZh || opponent.displayName || opponent.name || "",
        opponentNameEn: opponent.displayNameEn || opponent.name || opponent.displayName || "",
        opponentYear: opponent.year || "",
        scheduledOpponentRetired: !!replacementOpponent,
        playerJockeyName: playerJockey.name,
        opponentJockeyName: opponent.jockeyName,
        replacementOpponentJockeyName: replacementOpponent ? replacementOpponent.jockeyName : "",
        opponentRank,
        tieOutcome,
        deadHeat: tieOutcome === "dead-heat",
        retired: playerResult.retired,
        retiredPhase: playerResult.retiredPhase,
        injury: injury ? {
          phase: injury.phase,
          reason: injury.reason,
          severity: injury.severityLabel,
          restMonths: injury.restMonths,
          forcedRetirement: injury.forcedRetirement
        } : null
      },
      hidden: {
        race,
        trackCondition,
        pointsPerLength,
        scoreDiff,
        marginLengths,
        marginLabel,
        tieOutcome,
        scoreLine: `${finalMark(playerResult)} - ${finalMark(competitiveOpponentResult)}`,
        preRaceCondition: context.preRaceCondition,
        injury,
        playerCalc,
        opponent: competitiveOpponent,
        scheduledOpponent: opponent,
        scheduledOpponentResult: initialOpponentResult,
        replacementOpponent,
        replacementResult,
        results: ordered
      }
    };
  }

  function marginReferenceForPlayer(ordered, playerResult) {
    if (!playerResult || playerResult.retired) return null;
    const playerIndex = ordered.indexOf(playerResult);
    if (playerIndex < 0) return null;
    if (playerIndex === 0) return ordered.find((item) => item !== playerResult && !item.retired) || null;
    return ordered[0] && !ordered[0].retired ? ordered[0] : null;
  }

  function simulateFieldRace(horse, race, context) {
    const opponent = context.opponent;
    const trackCondition = context.trackCondition;
    const playerJockey = context.playerJockey;
    const playerEntry = context.playerEntry;
    const playerCalc = context.playerCalc;
    const fieldOpponents = createHiddenFieldOpponents(race);
    const entries = [
      playerEntry,
      opponentEntry(opponent)
    ].concat(fieldOpponents.map((fieldOpponent, index) => {
      return opponentEntry(fieldOpponent, `field-${index + 1}`);
    }));

    const initialResults = entries.map(runOneRunner);
    const playerResult = initialResults.find((item) => item.entry.key === "player");
    const scheduledOpponentResult = initialResults.find((item) => item.entry.key === "opponent");
    applyPreRaceAccident(playerResult, context.preRaceCondition);
    const ordered = orderedFieldResults(initialResults);
    const playerFieldPosition = ordered.indexOf(playerResult) + 1;
    const opponentFieldPosition = ordered.indexOf(scheduledOpponentResult) + 1;
    const playerRank = playerResult.retired
      ? null
      : (playerFieldPosition <= 5 ? playerFieldPosition : null);
    const opponentRank = scheduledOpponentResult.retired
      ? null
      : (opponentFieldPosition <= 5 ? opponentFieldPosition : null);
    const pointsPerLength = getPointsPerLength(race.distance);
    const marginReferenceResult = marginReferenceForPlayer(ordered, playerResult);
    let scoreDiff = null;
    let marginLengths = null;
    let tieOutcome = "";

    if (playerResult && !playerResult.retired && marginReferenceResult && !marginReferenceResult.retired) {
      scoreDiff = playerResult.total - marginReferenceResult.total;
      marginLengths = Math.abs(scoreDiff) / pointsPerLength;
      if (scoreDiff === 0) {
        tieOutcome = playerFieldPosition === 1 ? "player-win" : "player-loss";
      }
    }

    const scheduledScoreDiff = playerResult && scheduledOpponentResult
      && !playerResult.retired && !scheduledOpponentResult.retired
      ? playerResult.total - scheduledOpponentResult.total
      : null;
    const injury = retirementInjury(playerResult, context.preRaceCondition);
    const raceNameSource = raceNameSourceFor(race);
    const marginLabel = createMarginLabel(marginLengths, tieOutcome);

    return {
      public: {
        raceId: race.id,
        raceName: raceDisplayNameFor(raceNameSource, race, "zh"),
        raceNameZh: raceDisplayNameFor(raceNameSource, race, "zh"),
        raceNameOriginal: raceDisplayNameFor(raceNameSource, race, "original"),
        trackCondition,
        rank: playerRank,
        rankLabel: rankLabel(playerRank, playerResult.retired),
        opponentName: opponent.displayName || opponent.name || "",
        opponentNameZh: opponent.displayNameZh || opponent.displayName || opponent.name || "",
        opponentNameEn: opponent.displayNameEn || opponent.name || opponent.displayName || "",
        opponentYear: opponent.year || "",
        scheduledOpponentRetired: scheduledOpponentResult.retired,
        playerJockeyName: playerJockey.name,
        opponentJockeyName: opponent.jockeyName,
        replacementOpponentJockeyName: "",
        opponentRank,
        tieOutcome,
        deadHeat: false,
        retired: playerResult.retired,
        retiredPhase: playerResult.retiredPhase,
        injury: injury ? {
          phase: injury.phase,
          reason: injury.reason,
          severity: injury.severityLabel,
          restMonths: injury.restMonths,
          forcedRetirement: injury.forcedRetirement
        } : null
      },
      hidden: {
        race,
        fieldRace: true,
        fieldSize: ordered.length,
        playerFieldPosition,
        opponentFieldPosition,
        fieldOpponents,
        fieldResults: ordered,
        marginReferenceResult,
        trackCondition,
        pointsPerLength,
        scoreDiff,
        marginLengths,
        marginLabel,
        tieOutcome,
        scoreLine: `${finalMark(playerResult)} - ${finalMark(marginReferenceResult)}`,
        scheduledScoreDiff,
        scheduledScoreLine: `${finalMark(playerResult)} - ${finalMark(scheduledOpponentResult)}`,
        preRaceCondition: context.preRaceCondition,
        injury,
        playerCalc,
        opponent,
        scheduledOpponent: opponent,
        scheduledOpponentResult,
        replacementOpponent: null,
        replacementResult: null,
        results: ordered
      }
    };
  }

  function simulateRace(horse, race, options) {
    const context = buildRaceContext(horse, race, options);
    return usesFieldRanking(race)
      ? simulateFieldRace(horse, race, context)
      : simulateDuelRace(horse, race, context);
  }

  ns.RaceRules = {
    simulateRace,
    chooseOpponent,
    createGeneratedOpponent,
    getHistoricalCandidates,
    isChampionOpponent,
    filterOpponentCandidates,
    getBaseGeneratedOpponentRange,
    getGeneratedOpponentSpec,
    rollTrackCondition,
    getPointsPerLength,
    rollPlacementWhenBehind,
    usesFieldRanking,
    createHiddenFieldOpponents,
    getGateResult,
    getPositionResult
  };
})();
