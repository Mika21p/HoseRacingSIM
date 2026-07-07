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

  function opponentEntry(opponent) {
    return {
      key: "opponent",
      name: opponent.name || "随机对手",
      ability: opponent.ability,
      jockeyId: opponent.jockeyId,
      jockeyName: opponent.jockeyName,
      riderAbility: opponent.riderAbility,
      specialSprint: false
    };
  }

  function simulateRace(horse, race, options) {
    const opts = options || {};
    const opponent = opts.opponent || chooseOpponent(race);
    const trackCondition = opts.trackCondition || opponent.trackCondition || rollTrackCondition();
    const playerJockey = opts.playerJockey || ns.JockeyRules.describePlayerJockey(opts.playerJockeyId || "generic-local");
    const playerRiderAbility = playerJockey.ability || opts.playerRiderAbility || 70;
    const playerCalc = ns.HorseRules.calcRaceAbility(horse, race, {
      trackCondition,
      currentTime: opts.currentTime,
      maturityDecline: opts.maturityDecline || 0,
      maturity: opts.maturity,
      temperamentMod: opts.temperamentMod
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
    const entries = [
      playerEntry,
      opponentEntry(opponent)
    ];

    const initialResults = entries.map(runOneRunner);
    const playerResult = initialResults.find((item) => item.entry.key === "player");
    const initialOpponentResult = initialResults.find((item) => item.entry.key === "opponent");
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
    const injury = playerResult.retired && ns.InjuryRules
      ? ns.InjuryRules.rollInjury(playerResult.retiredPhase)
      : null;
    const raceNameSource = ns.RaceNameRules && ns.RaceNameRules.findRaceById
      ? ns.RaceNameRules.findRaceById(race.id) || race
      : race;
    const marginLabel = createMarginLabel(marginLengths, tieOutcome);

    return {
      public: {
        raceId: race.id,
        raceName: ns.RaceNameRules ? ns.RaceNameRules.displayName(raceNameSource, "zh") : race.name,
        raceNameZh: ns.RaceNameRules ? ns.RaceNameRules.displayName(raceNameSource, "zh") : race.name,
        raceNameOriginal: ns.RaceNameRules ? ns.RaceNameRules.displayName(raceNameSource, "original") : race.name,
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
    getGateResult,
    getPositionResult
  };
})();
