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
    return labels[rank] || "着外";
  }

  function finalMark(result) {
    if (!result || result.retired) return "退赛";
    return String(result.total);
  }

  function hasHistoricalScore(entry) {
    return !!entry && Number.isFinite(entry.historicalScore);
  }

  function fixedHistoricalResult(entry) {
    const fixedPhase = { roll: null, random: null, result: { label: "史实固定", mod: 0 }, total: 0 };
    return {
      entry,
      base: entry.historicalScore,
      riderMod: 0,
      retired: false,
      retiredPhase: "",
      total: entry.historicalScore,
      fixedScore: true,
      scoreSource: "historical-fixed",
      phases: {
        gate: { ...fixedPhase },
        position: { ...fixedPhase },
        sprint: { roll: null, random: null, total: 0 }
      }
    };
  }

  function runOneRunner(entry) {
    if (hasHistoricalScore(entry)) return fixedHistoricalResult(entry);
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

  const LEGEND_FIELD_SIZE = 5;
  const LEGEND_DISTANCE_TOLERANCE = 200;
  const LEGEND_G1_MIN_ABILITY = 85;
  const LEGEND_CONDITION_MAX_ABILITY = 90;
  const LEGEND_LONG_DISTANCE_MIN = 2601;
  const LEGEND_SPRINT_DISTANCE_MIN = 1000;
  const LEGEND_SPRINT_DISTANCE_MAX = 1300;

  function raceRegion(race) {
    return (race && race.surfaceRegion) || "日本";
  }

  function isLegendG1(race) {
    return !!race && (race.raceClass === "g1" || race.raceClass === "jpn1");
  }

  function usesLegendG1AbilityFallback(race) {
    if (!isLegendG1(race) || raceRegion(race) !== "日本") return false;
    if (race.surface === "泥地") return true;
    return race.surface === "草地" && race.sexRestriction === "牝马";
  }

  function isLegendLongDistance(distance) {
    return Number(distance) >= LEGEND_LONG_DISTANCE_MIN;
  }

  function isLegendDistanceCompatible(winDistance, targetDistance, tolerance) {
    if (isLegendLongDistance(targetDistance)) return isLegendLongDistance(winDistance);
    return Math.abs(Number(winDistance) - Number(targetDistance)) <= tolerance;
  }

  function recognizedLegendWinRegions(race) {
    const region = raceRegion(race);
    if (region === "中东") {
      return race && race.surface === "草地"
        ? ["中东", "日本", "欧洲"]
        : ["中东", "美国", "日本"];
    }
    if (region === "阿根廷") return ["阿根廷", "美国"];
    if (region === "日本" && race && race.surface === "草地") {
      return ["日本", "香港", "澳洲"];
    }
    if (region === "香港") return ["香港", "日本", "澳洲"];
    if (region === "澳洲") {
      const regions = ["澳洲", "日本"];
      if (race && Number(race.distance) >= LEGEND_SPRINT_DISTANCE_MIN
        && Number(race.distance) <= LEGEND_SPRINT_DISTANCE_MAX) {
        regions.push("欧洲");
      }
      return regions;
    }
    if (region === "美国" && race && race.surface === "草地") return ["美国", "欧洲"];
    return [region];
  }

  function eligibilityWinAppearance(win) {
    if (!win) return null;
    return {
      entry: {
        year: win.year,
        jockeyId: win.jockeyId,
        trackCondition: win.trackCondition || "",
        legendEligibilityOnly: true
      },
      race: {
        id: "",
        name: win.raceName || "传奇资格胜鞍",
        surfaceRegion: win.surfaceRegion,
        surface: win.surface,
        distance: win.distance
      },
      qualificationWin: true
    };
  }

  function historicalHorseProfiles() {
    const raceById = new Map((ns.Races || []).map((race) => [race.id, race]));
    return (ns.HistoricalHorses || []).map((horse) => {
      const appearances = (horse.races || [])
        .map((entry) => ({
          entry,
          race: raceById.get(entry.raceId),
          qualificationWin: entry.finish === 1
        }))
        .filter((appearance) => !!appearance.race);
      const eligibilityWins = (Array.isArray(horse.legendEligibilityWins) ? horse.legendEligibilityWins : [])
        .map(eligibilityWinAppearance)
        .filter(Boolean);
      const profile = horse.profile || {};
      const declaredSex = String(profile.sex || profile.gender || "").toLowerCase();
      const profileNote = String(profile.note || "");
      return {
        horse,
        appearances,
        qualificationWins: appearances.filter((appearance) => appearance.qualificationWin).concat(eligibilityWins),
        inferredFemale: declaredSex === "female"
          || declaredSex === "mare"
          || declaredSex === "filly"
          || declaredSex === "牝"
          || declaredSex === "雌"
          || /牝马|雌马|母马|母馬|女王|\bmare\b|\bfilly\b/i.test(profileNote)
          || appearances.some((appearance) => appearance.race.sexRestriction === "牝马")
      };
    });
  }

  function closestHistoricalAppearance(appearances, race) {
    return appearances.slice().sort((left, right) => {
      const score = (appearance) => {
        const regionPenalty = raceRegion(appearance.race) === raceRegion(race) ? 0 : 10000;
        const surfacePenalty = appearance.race.surface === race.surface ? 0 : 5000;
        return regionPenalty + surfacePenalty + Math.abs(appearance.race.distance - race.distance);
      };
      return score(left) - score(right);
    })[0] || null;
  }

  function compatibleLegendAppearances(profile, race, options) {
    if (!profile || !race) return [];
    const opts = options || {};
    const tolerance = opts.distanceTolerance || LEGEND_DISTANCE_TOLERANCE;
    const targetSurface = opts.surface || race.surface;
    const acceptedRegions = new Set(opts.acceptedRegions || recognizedLegendWinRegions(race));
    return profile.qualificationWins.filter((appearance) => {
      if (appearance.race.surface !== targetSurface) return false;
      if (!isLegendDistanceCompatible(appearance.race.distance, race.distance, tolerance)) return false;
      return acceptedRegions.has(raceRegion(appearance.race));
    });
  }

  function legendCandidate(profile, race, options) {
    const opts = options || {};
    const tolerance = opts.distanceTolerance || LEGEND_DISTANCE_TOLERANCE;
    const targetRaceClass = opts.raceClass || race.raceClass;
    if (race.sexRestriction === "牝马" && !profile.inferredFemale) return null;

    const compatibleAppearances = compatibleLegendAppearances(profile, race, opts);
    if (compatibleAppearances.length === 0) return null;

    const exactEntries = (profile.horse.races || []).filter((entry) => entry.raceId === race.id);
    const threshold = Number.isFinite(opts.minAbility) ? opts.minAbility : null;
    let selectedEntry = null;
    let rawAbility = Number(profile.horse.profile && profile.horse.profile.baseAbility);

    if (exactEntries.length > 0) {
      const eligibleEntries = threshold == null
        ? exactEntries
        : exactEntries.filter((entry) => Number(entry.ability) >= threshold);
      if (eligibleEntries.length === 0) return null;
      selectedEntry = R.pickOne(eligibleEntries);
      rawAbility = Number(selectedEntry.ability);
    }
    if (!Number.isFinite(rawAbility)) return null;

    const ability = CONDITION_RACE_CLASSES.includes(targetRaceClass)
      ? Math.max(60, rawAbility - 4)
      : rawAbility;
    if (CONDITION_RACE_CLASSES.includes(targetRaceClass)
      && ability >= LEGEND_CONDITION_MAX_ABILITY) return null;
    if (threshold != null && ability < threshold) return null;

    const jockeyAppearance = selectedEntry
      ? { entry: selectedEntry, race }
      : closestHistoricalAppearance(compatibleAppearances, race);
    const jockeyEntry = jockeyAppearance ? jockeyAppearance.entry : null;
    const representativeYear = jockeyEntry && Number.isFinite(jockeyEntry.year)
      ? jockeyEntry.year
      : null;
    const jockey = resolveJockey(
      jockeyEntry && jockeyEntry.jockeyId,
      representativeYear,
      "generic-local"
    );
    const horse = profile.horse;
    const regionMatch = compatibleAppearances.some((appearance) => raceRegion(appearance.race) === raceRegion(race));

    return {
      id: `${horse.id}-${race.id}-${selectedEntry ? selectedEntry.year : "projected"}`,
      horseId: horse.id,
      name: horse.name,
      displayName: horse.displayName || horse.name,
      displayNameZh: horse.displayNameZh || horse.displayName || horse.name,
      displayNameEn: horse.displayNameEn || horse.name || horse.displayName,
      year: representativeYear,
      ability,
      peakAbility: Number(horse.profile && horse.profile.peakAbility) || ability,
      jockeyId: jockey.id,
      jockeyName: jockey.name,
      riderAbility: jockey.ability || 70,
      trackCondition: selectedEntry ? selectedEntry.trackCondition || "" : "",
      finish: selectedEntry ? selectedEntry.finish || null : null,
      historical: true,
      exactCurrentRace: !!selectedEntry,
      regionMatch,
      distanceTolerance: tolerance,
      source: selectedEntry ? "historical-race" : "historical-profile"
    };
  }

  function validOpponentYear(year) {
    const numericYear = Number(year);
    return Number.isFinite(numericYear) && numericYear > 0;
  }

  function legendRepresentativeYear(profile, race) {
    const appearance = closestHistoricalAppearance(
      compatibleLegendAppearances(profile, race),
      race
    );
    const year = appearance && appearance.entry ? appearance.entry.year : null;
    return validOpponentYear(year) ? year : null;
  }

  function fillLegendOpponentYear(opponent, race, profilesByHorseId) {
    if (!opponent || validOpponentYear(opponent.year) || !opponent.horseId || !race) return false;
    const profile = profilesByHorseId.get(opponent.horseId);
    const year = legendRepresentativeYear(profile, race);
    if (!year) return false;
    opponent.year = year;
    return true;
  }

  function normalizeLegendOpponentYears(career) {
    if (!career || career.gameMode !== "legend") return false;
    const profilesByHorseId = new Map(
      historicalHorseProfiles().map((profile) => [profile.horse.id, profile])
    );
    let changed = false;

    const fillCollection = (items, race) => {
      if (!Array.isArray(items)) return;
      items.forEach((opponent) => {
        if (fillLegendOpponentYear(opponent, race, profilesByHorseId)) changed = true;
      });
    };

    const scheduled = career.scheduledRace;
    if (scheduled && scheduled.race) {
      if (fillLegendOpponentYear(scheduled.opponent, scheduled.race, profilesByHorseId)) changed = true;
      fillCollection(scheduled.opponents, scheduled.race);
      const scheduledMain = scheduled.opponent
        || (Array.isArray(scheduled.opponents) ? scheduled.opponents[0] : null);
      if (!validOpponentYear(scheduled.year) && scheduledMain && validOpponentYear(scheduledMain.year)) {
        scheduled.year = scheduledMain.year;
        changed = true;
      }
    }

    (Array.isArray(career.races) ? career.races : []).forEach((record) => {
      const publicResult = record && record.public ? record.public : {};
      const hidden = record && record.hidden ? record.hidden : {};
      const race = hidden.race
        || (ns.Races || []).find((item) => item.id === publicResult.raceId)
        || null;
      if (!race) return;

      fillCollection(publicResult.opponents, race);
      fillCollection(hidden.legendOpponents, race);
      fillCollection(hidden.fieldOpponents, race);
      if (fillLegendOpponentYear(hidden.scheduledOpponent, race, profilesByHorseId)) changed = true;
      if (fillLegendOpponentYear(hidden.opponent, race, profilesByHorseId)) changed = true;

      const mainHorseId = publicResult.mainOpponentHorseId
        || (hidden.scheduledOpponent && hidden.scheduledOpponent.horseId)
        || (hidden.opponent && hidden.opponent.horseId)
        || (Array.isArray(publicResult.opponents) && publicResult.opponents[0]
          ? publicResult.opponents[0].horseId
          : "");
      const publicMain = Array.isArray(publicResult.opponents)
        ? publicResult.opponents.find((opponent) => opponent && opponent.horseId === mainHorseId)
        : null;
      const mainYear = publicMain && validOpponentYear(publicMain.year)
        ? publicMain.year
        : legendRepresentativeYear(profilesByHorseId.get(mainHorseId), race);
      if (!validOpponentYear(publicResult.opponentYear) && mainYear) {
        publicResult.opponentYear = mainYear;
        changed = true;
      }
    });

    return changed;
  }

  function legendEncounterState(career) {
    const encountered = new Set();
    let lastMainHorseId = "";
    const records = career && Array.isArray(career.races) ? career.races : [];
    records.forEach((record) => {
      const opponents = record && record.public && Array.isArray(record.public.opponents)
        ? record.public.opponents
        : [];
      opponents.forEach((opponent) => {
        if (opponent && opponent.horseId) encountered.add(opponent.horseId);
      });
    });
    const last = records[records.length - 1];
    if (last && last.public) lastMainHorseId = last.public.mainOpponentHorseId || "";
    return { encountered, lastMainHorseId };
  }

  function legendCandidateWeight(candidate, encounterState) {
    let weight = candidate.exactCurrentRace ? 4 : 1;
    if (encounterState.encountered.has(candidate.horseId)) weight *= 2;
    if (encounterState.lastMainHorseId === candidate.horseId) weight *= 0.25;
    return weight;
  }

  function weightedSampleWithoutReplacement(candidates, count, encounterState) {
    const pool = candidates.slice();
    const picked = [];
    while (pool.length > 0 && picked.length < count) {
      const candidate = R.weightedPick(pool, (item) => legendCandidateWeight(item, encounterState));
      picked.push(candidate);
      pool.splice(pool.indexOf(candidate), 1);
    }
    return picked;
  }

  function getLegendFieldCandidates(race, options) {
    const opts = {
      surface: race && race.surface,
      raceClass: race && race.raceClass,
      distanceTolerance: LEGEND_DISTANCE_TOLERANCE,
      acceptedRegions: recognizedLegendWinRegions(race),
      minAbility: isLegendG1(race) && !usesLegendG1AbilityFallback(race)
        ? LEGEND_G1_MIN_ABILITY
        : null,
      ...(options || {})
    };
    const profiles = historicalHorseProfiles();
    return profiles
      .map((profile) => legendCandidate(profile, race, opts))
      .filter(Boolean);
  }

  function compareLegendCandidates(left, right) {
    if (left.ability !== right.ability) return right.ability - left.ability;
    if (left.peakAbility !== right.peakAbility) return right.peakAbility - left.peakAbility;
    return String(left.horseId).localeCompare(String(right.horseId));
  }

  function chooseOpponentField(race, options) {
    const opts = options || {};
    const candidateOptions = {
      surface: race.surface,
      raceClass: race.raceClass,
      distanceTolerance: LEGEND_DISTANCE_TOLERANCE,
      acceptedRegions: recognizedLegendWinRegions(race)
    };
    const encounterState = legendEncounterState(opts.career);
    let picked;
    let candidateCount;

    if (usesLegendG1AbilityFallback(race)) {
      const strongCandidates = getLegendFieldCandidates(race, {
        ...candidateOptions,
        minAbility: LEGEND_G1_MIN_ABILITY
      });
      if (strongCandidates.length >= LEGEND_FIELD_SIZE) {
        candidateCount = strongCandidates.length;
        picked = weightedSampleWithoutReplacement(strongCandidates, LEGEND_FIELD_SIZE, encounterState);
      } else {
        const strongHorseIds = new Set(strongCandidates.map((candidate) => candidate.horseId));
        const fallbackCandidates = getLegendFieldCandidates(race, {
          ...candidateOptions,
          minAbility: null
        }).filter((candidate) => !strongHorseIds.has(candidate.horseId));
        fallbackCandidates.sort(compareLegendCandidates);
        candidateCount = strongCandidates.length + fallbackCandidates.length;
        picked = strongCandidates.concat(
          fallbackCandidates.slice(0, LEGEND_FIELD_SIZE - strongCandidates.length)
        );
      }
    } else {
      const candidates = getLegendFieldCandidates(race, {
        ...candidateOptions,
        minAbility: isLegendG1(race) ? LEGEND_G1_MIN_ABILITY : null
      });
      candidateCount = candidates.length;
      picked = weightedSampleWithoutReplacement(candidates, LEGEND_FIELD_SIZE, encounterState);
    }

    if (picked.length < LEGEND_FIELD_SIZE) {
      throw new Error(`传奇模式：${race.name || race.id}只有${candidateCount}匹符合认可赛区、同场地、距离资格、性别及赛事强度要求的史实马。`);
    }

    return picked.sort(compareLegendCandidates);
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
      historicalScore: opponent.historicalScore,
      historicalFinish: opponent.historicalFinish,
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

  function highAbilityHistoricalG1FieldStrength(race, opponent) {
    if (!race || race.raceClass !== "g1" || !opponent || !opponent.historical) return null;
    if (!Number.isFinite(opponent.ability) || opponent.ability < 88) return null;
    if (opponent.ability >= 90) return { current: 82, lower: 76 };
    return { current: 80, lower: 74 };
  }

  function createHiddenFieldOpponents(race, opponent) {
    const boostedStrength = highAbilityHistoricalG1FieldStrength(race, opponent);
    const currentAbility = boostedStrength
      ? boostedStrength.current
      : getBaseGeneratedOpponentRange(race)[0];
    const lowerAbility = boostedStrength
      ? boostedStrength.lower
      : lowerFieldOpponentAbility(race);
    return [
      createHiddenFieldOpponent(race, currentAbility, "current", 1),
      createHiddenFieldOpponent(race, currentAbility, "current", 2),
      createHiddenFieldOpponent(race, lowerAbility, "lower", 1),
      createHiddenFieldOpponent(race, lowerAbility, "lower", 2)
    ];
  }

  function compareHistoricalTie(leftEntry, rightEntry) {
    const leftFixed = hasHistoricalScore(leftEntry);
    const rightFixed = hasHistoricalScore(rightEntry);
    if (!leftFixed && !rightFixed) return 0;
    if (leftFixed !== rightFixed) return leftFixed ? -1 : 1;
    const leftFinish = leftEntry.historicalFinish;
    const rightFinish = rightEntry.historicalFinish;
    if (Number.isFinite(leftFinish) && Number.isFinite(rightFinish) && leftFinish !== rightFinish) {
      return leftFinish - rightFinish;
    }
    return 0;
  }

  function orderedFieldResults(results) {
    return results
      .map((result, index) => ({ result, index, tieBreaker: R.rollRange(1, 1000000) }))
      .sort((a, b) => {
        if (a.result.retired !== b.result.retired) return a.result.retired ? 1 : -1;
        if (a.result.retired && b.result.retired) return a.index - b.index;
        if (a.result.total !== b.result.total) return b.result.total - a.result.total;
        const historicalTie = compareHistoricalTie(a.result.entry, b.result.entry);
        if (historicalTie !== 0) return historicalTie;
        if (hasHistoricalScore(a.result.entry) || hasHistoricalScore(b.result.entry)) return a.index - b.index;
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
    const opponents = Array.isArray(opts.opponents) ? opts.opponents.filter(Boolean) : [];
    const opponent = opts.opponent || opponents[0] || chooseOpponent(race);
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
      opponents,
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
    const finishers = finalResults.filter((item) => !item.retired).sort((a, b) => {
      if (a.total !== b.total) return b.total - a.total;
      return compareHistoricalTie(a.entry, b.entry);
    });
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
        tieOutcome = hasHistoricalScore(competitiveOpponentResult.entry) ? "player-loss" : rollTieOutcome();
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
    const legendField = context.opponents.length === LEGEND_FIELD_SIZE;
    const fieldOpponents = legendField
      ? context.opponents.slice(1)
      : createHiddenFieldOpponents(race, opponent);
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
    const publicOpponents = legendField
      ? context.opponents.map((fieldOpponent, index) => {
        const key = index === 0 ? "opponent" : `field-${index}`;
        const result = initialResults.find((item) => item.entry.key === key);
        const fieldPosition = result ? ordered.indexOf(result) + 1 : null;
        return {
          horseId: fieldOpponent.horseId || "",
          displayName: fieldOpponent.displayName || fieldOpponent.name || "",
          displayNameZh: fieldOpponent.displayNameZh || fieldOpponent.displayName || fieldOpponent.name || "",
          displayNameEn: fieldOpponent.displayNameEn || fieldOpponent.name || fieldOpponent.displayName || "",
          year: fieldOpponent.year || "",
          jockeyName: fieldOpponent.jockeyName || "",
          rank: result && !result.retired ? fieldPosition : null,
          rankLabel: rankLabel(fieldPosition, !!(result && result.retired)),
          retired: !!(result && result.retired),
          retiredPhase: result ? result.retiredPhase || "" : ""
        };
      })
      : [];

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
        mainOpponentHorseId: legendField ? opponent.horseId || "" : "",
        opponents: publicOpponents,
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
        legendField,
        fieldSize: ordered.length,
        playerFieldPosition,
        opponentFieldPosition,
        fieldOpponents,
        legendOpponents: legendField ? context.opponents : [],
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
    return context.opponents.length === LEGEND_FIELD_SIZE || usesFieldRanking(race)
      ? simulateFieldRace(horse, race, context)
      : simulateDuelRace(horse, race, context);
  }

  ns.RaceRules = {
    simulateRace,
    chooseOpponent,
    chooseOpponentField,
    getLegendFieldCandidates,
    normalizeLegendOpponentYears,
    recognizedLegendWinRegions,
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
