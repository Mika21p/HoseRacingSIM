(function () {
  const ns = (window.Keiba = window.Keiba || {});

  const TIER = {
    MAIDEN: 0,
    LOW: 1,
    OP_LISTED: 2,
    GRADED: 3,
    G1: 4
  };

  const TIER_LABELS = {
    [TIER.MAIDEN]: "maiden",
    [TIER.LOW]: "低级赛",
    [TIER.OP_LISTED]: "OP/L",
    [TIER.GRADED]: "重赏",
    [TIER.G1]: "G1"
  };

  function raceTier(race) {
    if (!race) return null;
    const raceClass = race.raceClass;
    if (raceClass === "new" || raceClass === "maiden") return TIER.MAIDEN;
    if (raceClass === "one-win" || raceClass === "two-win" || raceClass === "novice") return TIER.LOW;
    if (raceClass === "three-win" || raceClass === "op" || raceClass === "listed") return TIER.OP_LISTED;
    if (raceClass === "g3" || raceClass === "jpn3" || raceClass === "g2" || raceClass === "jpn2") return TIER.GRADED;
    if (raceClass === "g1" || raceClass === "jpn1") return TIER.G1;
    return null;
  }

  function isWin(record) {
    return !!record
      && !!record.public
      && (record.public.rank === 1 || record.public.rankLabel === "一着")
      && !record.public.retired;
  }

  function highestWinTier(career) {
    if (!career || !Array.isArray(career.races)) return -1;
    return career.races.reduce((highest, record) => {
      if (!isWin(record) || !record.hidden || !record.hidden.race) return highest;
      const tier = raceTier(record.hidden.race);
      return tier == null ? highest : Math.max(highest, tier);
    }, -1);
  }

  function lastRaceWinMargin(career) {
    if (!career || !Array.isArray(career.races) || career.races.length === 0) return 0;
    const record = career.races[career.races.length - 1];
    if (!isWin(record) || !record.hidden) return 0;
    if (typeof record.hidden.scoreDiff === "number" && record.hidden.scoreDiff < 0) return 0;
    return typeof record.hidden.marginLengths === "number" ? record.hidden.marginLengths : 0;
  }

  function lastRaceBoost(career) {
    const margin = lastRaceWinMargin(career);
    if (margin > 4) return { type: "direct-g1", extraTiers: 99, margin };
    if (margin > 2) return { type: "jump-one", extraTiers: 1, margin };
    return { type: "", extraTiers: 0, margin };
  }

  function eligibleRange(career) {
    const highest = highestWinTier(career);
    const boost = lastRaceBoost(career);
    if (highest < 0) {
      return { minTier: TIER.MAIDEN, maxTier: TIER.MAIDEN, highestWinTier: highest, boost };
    }
    if (highest === TIER.MAIDEN) {
      return {
        minTier: TIER.LOW,
        maxTier: boost.type === "direct-g1"
          ? TIER.G1
          : Math.min(TIER.G1, TIER.LOW + boost.extraTiers),
        highestWinTier: highest,
        boost
      };
    }
    if (highest === TIER.LOW) {
      return {
        minTier: TIER.OP_LISTED,
        maxTier: boost.type === "direct-g1"
          ? TIER.G1
          : Math.min(TIER.G1, TIER.OP_LISTED + boost.extraTiers),
        highestWinTier: highest,
        boost
      };
    }
    return {
      minTier: TIER.GRADED,
      maxTier: TIER.G1,
      highestWinTier: highest,
      boost
    };
  }

  function isRaceAllowed(career, race) {
    const tier = raceTier(race);
    if (tier == null) return false;
    const range = eligibleRange(career);
    return tier >= range.minTier && tier <= range.maxTier;
  }

  function hasGradedAccess(career) {
    return eligibleRange(career).maxTier >= TIER.GRADED;
  }

  function decoratePlan(career, plan) {
    const tier = raceTier(plan.race);
    const range = eligibleRange(career);
    return {
      ...plan,
      challenge: null,
      western: {
        tier,
        tierLabel: TIER_LABELS[tier] || "",
        minTier: range.minTier,
        maxTier: range.maxTier,
        boost: range.boost
      }
    };
  }

  function filterPlans(career, plans) {
    return plans
      .filter((plan) => isRaceAllowed(career, plan.race))
      .map((plan) => decoratePlan(career, plan));
  }

  ns.WesternProgression = {
    TIER,
    TIER_LABELS,
    raceTier,
    highestWinTier,
    lastRaceWinMargin,
    lastRaceBoost,
    eligibleRange,
    isRaceAllowed,
    hasGradedAccess,
    filterPlans
  };
})();
