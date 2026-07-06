(function () {
  const ns = (window.Keiba = window.Keiba || {});

  const REGIONS = {
    japan: {
      id: "japan",
      label: "日本",
      raceRegions: ["日本"],
      jockeyAffiliation: "japan",
      system: "japan"
    },
    europe: {
      id: "europe",
      label: "欧洲",
      raceRegions: ["欧洲"],
      jockeyAffiliation: "europe",
      system: "western"
    },
    northAmerica: {
      id: "northAmerica",
      label: "北美",
      raceRegions: ["美国"],
      jockeyAffiliation: "usa",
      system: "western"
    }
  };

  const RACE_REGION_MAP = Object.keys(REGIONS).reduce((items, regionId) => {
    REGIONS[regionId].raceRegions.forEach((raceRegion) => {
      items[raceRegion] = regionId;
    });
    return items;
  }, {});

  const GRADED_CLASSES = ["g3", "jpn3", "g2", "jpn2", "g1", "jpn1"];
  const JAPAN_GRADED_ACCESS_WIN_CLASSES = ["three-win", "op", "g3", "jpn3", "g2", "jpn2", "g1", "jpn1"];
  const TRANSFER_REGION_PAIRS = {
    europe: "northAmerica",
    northAmerica: "europe"
  };

  function getRegion(regionId) {
    return REGIONS[regionId] || REGIONS.japan;
  }

  function normalizeRegionId(regionId) {
    return REGIONS[regionId] ? regionId : "japan";
  }

  function regionIdForTrainer(trainer) {
    if (!trainer) return "japan";
    if (trainer.regionId && REGIONS[trainer.regionId]) return trainer.regionId;
    if (trainer.id && ns.CommentRules && ns.CommentRules.getTrainer) {
      const current = ns.CommentRules.getTrainer(trainer.id);
      if (current && current.regionId && REGIONS[current.regionId]) return current.regionId;
    }
    return "japan";
  }

  function getRaceSurfaceRegion(race) {
    return (race && race.surfaceRegion) || "日本";
  }

  function getRaceRegionId(race) {
    return RACE_REGION_MAP[getRaceSurfaceRegion(race)] || "other";
  }

  function getRaceRegionLabel(race) {
    const regionId = getRaceRegionId(race);
    if (REGIONS[regionId]) return REGIONS[regionId].label;
    return getRaceSurfaceRegion(race);
  }

  function getStableRegionId(career) {
    const stableRegion = career && career.stable && career.stable.regionId;
    const horseRegion = career && career.horse && (career.horse.currentRegionId || career.horse.homeRegionId);
    return normalizeRegionId(stableRegion || horseRegion || "japan");
  }

  function getStableRegionLabel(career) {
    return getRegion(getStableRegionId(career)).label;
  }

  function getOriginalRegionId(career) {
    const stableRegion = career && career.stable && career.stable.originalRegionId;
    const horseRegion = career && career.horse && career.horse.homeRegionId;
    return normalizeRegionId(stableRegion || horseRegion || getStableRegionId(career));
  }

  function getOriginalRegionLabel(career) {
    return getRegion(getOriginalRegionId(career)).label;
  }

  function isWesternRegion(regionId) {
    return getRegion(regionId).system === "western";
  }

  function isWesternCareer(career) {
    return isWesternRegion(getStableRegionId(career));
  }

  function getJockeyAffiliation(regionId) {
    return getRegion(normalizeRegionId(regionId)).jockeyAffiliation;
  }

  function getDebutRaceClasses(career) {
    return isWesternCareer(career) ? ["maiden"] : ["new"];
  }

  function isWin(record) {
    return !!record
      && !!record.public
      && (record.public.rank === 1 || record.public.rankLabel === "一着")
      && !record.public.retired;
  }

  function wonAny(career, raceClasses) {
    return !!career && Array.isArray(career.races)
      && career.races.some((record) => isWin(record)
        && record.hidden
        && record.hidden.race
        && raceClasses.includes(record.hidden.race.raceClass));
  }

  function hasJapanGradedAccess(career) {
    return wonAny(career, JAPAN_GRADED_ACCESS_WIN_CLASSES);
  }

  function hasGradedAccess(career) {
    if (isWesternCareer(career)) {
      return !!(ns.WesternProgression && ns.WesternProgression.hasGradedAccess(career));
    }
    return hasJapanGradedAccess(career);
  }

  function isGradedRace(race) {
    return !!race && GRADED_CLASSES.includes(race.raceClass);
  }

  function isDomesticRace(career, race) {
    const raceRegionId = getRaceRegionId(race);
    return raceRegionId !== "other" && raceRegionId === getStableRegionId(career);
  }

  function isExpeditionRace(career, race) {
    return !isDomesticRace(career, race);
  }

  function isExpeditionVisible(career, race) {
    if (!isExpeditionRace(career, race)) return true;
    return isGradedRace(race) && hasGradedAccess(career);
  }

  function buildExpedition(career, race) {
    if (!isExpeditionRace(career, race)) return null;
    const fromRegionId = getStableRegionId(career);
    const toRegionId = getRaceRegionId(race);
    return {
      active: true,
      fromRegionId,
      toRegionId,
      fromLabel: getRegion(fromRegionId).label,
      toLabel: getRaceRegionLabel(race),
      penalty: 0,
      lockBeforeTurns: 0,
      lockAfterTurns: 0
    };
  }

  function decoratePlan(career, plan) {
    return {
      ...plan,
      expedition: buildExpedition(career, plan.race)
    };
  }

  function transferTargetRegionId(career) {
    const regionId = getStableRegionId(career);
    return TRANSFER_REGION_PAIRS[regionId] || "";
  }

  function canTransfer(career) {
    if (!career || career.retired) return { allowed: false, reason: "退役后不能转厩。" };
    const targetRegionId = transferTargetRegionId(career);
    if (!targetRegionId) return { allowed: false, reason: "当前所属地不能转厩。" };
    if (career.stable && career.stable.transferUsed) return { allowed: false, reason: "转厩机会已经使用。" };
    if (career.scheduledRace) return { allowed: false, reason: "已报名比赛时不能转厩。" };
    if (ns.CareerRules && ns.CareerRules.isResting && ns.CareerRules.isResting(career)) {
      return { allowed: false, reason: "强制休养期间不能转厩。" };
    }
    return {
      allowed: true,
      reason: "",
      targetRegionId,
      targetLabel: getRegion(targetRegionId).label
    };
  }

  function ensureCareerState(career) {
    if (!career || typeof career !== "object") return null;
    const trainer = career.trainer || (ns.CommentRules && ns.CommentRules.getTrainer
      ? ns.CommentRules.getTrainer(career.trainerId)
      : null);
    const fallbackRegionId = regionIdForTrainer(trainer);
    const originalRegionId = normalizeRegionId(
      career.stable && career.stable.originalRegionId
        || career.horse && career.horse.homeRegionId
        || fallbackRegionId
    );
    const currentRegionId = normalizeRegionId(
      career.stable && career.stable.regionId
        || career.horse && career.horse.currentRegionId
        || originalRegionId
    );

    career.stable = career.stable && typeof career.stable === "object" ? career.stable : {};
    career.stable.originalRegionId = originalRegionId;
    career.stable.regionId = currentRegionId;
    career.stable.transferUsed = !!career.stable.transferUsed;
    if (!Array.isArray(career.stable.transfers)) career.stable.transfers = [];

    if (career.horse) {
      career.horse.homeRegionId = originalRegionId;
      career.horse.currentRegionId = currentRegionId;
    }

    career.expedition = career.expedition && typeof career.expedition === "object"
      ? career.expedition
      : {};
    if (!Array.isArray(career.expedition.history)) career.expedition.history = [];

    return career;
  }

  function transferStable(career, targetRegionId) {
    ensureCareerState(career);
    const transfer = canTransfer(career);
    const resolvedTargetRegionId = normalizeRegionId(targetRegionId || transfer.targetRegionId);
    if (!transfer.allowed || resolvedTargetRegionId !== transfer.targetRegionId) {
      return { ok: false, reason: transfer.reason || "不能转厩到该所属地。" };
    }
    const fromRegionId = getStableRegionId(career);
    const time = career.currentTime || (ns.TimeRules && ns.TimeRules.startTime ? ns.TimeRules.startTime() : null);
    const timeLabel = ns.TimeRules && ns.TimeRules.formatAgeMonth && time
      ? ns.TimeRules.formatAgeMonth(time)
      : "";

    career.stable.regionId = resolvedTargetRegionId;
    career.stable.transferUsed = true;
    career.stable.transfers.push({
      fromRegionId,
      toRegionId: resolvedTargetRegionId,
      fromLabel: getRegion(fromRegionId).label,
      toLabel: getRegion(resolvedTargetRegionId).label,
      timeIndex: time ? time.index : null,
      timeLabel
    });
    if (career.horse) career.horse.currentRegionId = resolvedTargetRegionId;
    return { ok: true, fromRegionId, toRegionId: resolvedTargetRegionId };
  }

  ns.RegionRules = {
    REGIONS,
    GRADED_CLASSES,
    getRegion,
    normalizeRegionId,
    regionIdForTrainer,
    getRaceRegionId,
    getRaceRegionLabel,
    getStableRegionId,
    getStableRegionLabel,
    getOriginalRegionId,
    getOriginalRegionLabel,
    isWesternCareer,
    getJockeyAffiliation,
    getDebutRaceClasses,
    hasGradedAccess,
    isGradedRace,
    isDomesticRace,
    isExpeditionRace,
    isExpeditionVisible,
    buildExpedition,
    decoratePlan,
    transferTargetRegionId,
    canTransfer,
    ensureCareerState,
    transferStable
  };
})();
