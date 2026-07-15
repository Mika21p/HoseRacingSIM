(function () {
  const ns = (window.Keiba = window.Keiba || {});

  function createCareer(horse, comments, commentDetails, debutLock, trainer) {
    const start = ns.TimeRules.startTime();
    const regionId = ns.RegionRules
      ? ns.RegionRules.regionIdForTrainer(trainer) || "japan"
      : "japan";
    horse.homeRegionId = horse.homeRegionId || regionId;
    horse.currentRegionId = horse.currentRegionId || horse.homeRegionId;
    horse.gameMode = horse.gameMode === "legend" ? "legend" : "normal";
    const career = {
      horse,
      gameMode: horse.gameMode,
      comments: comments || [],
      commentDetails: commentDetails || [],
      debutLock: debutLock || null,
      trainer: trainer || null,
      trainerId: (trainer && trainer.id) || horse.trainerId || "sato-yuta",
      lastRaceComment: null,
      mainJockeyId: horse.mainJockeyId || "take-yutaka",
      currentTime: start,
      lastRaceIndex: null,
      lastRaceCancelIndex: null,
      scheduledRace: null,
      injury: {
        active: null,
        history: []
      },
      stable: {
        originalRegionId: horse.homeRegionId,
        regionId: horse.currentRegionId,
        transferUsed: false,
        transfers: []
      },
      expedition: {
        history: []
      },
      travel: {
        currentRegionId: ns.RegionRules && ns.RegionRules.getCurrentLocationId
          ? ns.RegionRules.getCurrentLocationId({ stable: { regionId }, horse })
          : regionId,
        currentLabel: ns.RegionRules && ns.RegionRules.getTravelRegion
          ? ns.RegionRules.getTravelRegion(regionId).label
          : "日本",
        history: []
      },
      challenge: ns.RaceProgression && ns.RaceProgression.createChallengeState
        ? ns.RaceProgression.createChallengeState()
        : { age2Used: 0, age3SpringUsed: 0, exclusions: [] },
      maturity: {
        decline: 0,
        lastCheckedIndex: start.index,
        events: []
      },
      races: [],
      retired: false
    };
    if (ns.RegionRules) ns.RegionRules.ensureCareerState(career);
    if (ns.RaceFatigueRules) ns.RaceFatigueRules.ensureFatigueState(career);
    if (ns.AdaptationHintRules) ns.AdaptationHintRules.ensure(career);
    return career;
  }

  function advanceToSchedule(career, schedule) {
    ensureInjuryState(career);
    const fromIndex = career.maturity.lastCheckedIndex;
    const events = ns.MaturityRules.applyMonthlyDecline(career.horse, career.maturity, fromIndex, schedule.index);
    career.currentTime = {
      age: schedule.age,
      month: schedule.month,
      half: schedule.half || 1,
      index: schedule.index
    };
    career.lastRaceIndex = schedule.index;
    career.maturity.lastCheckedIndex = schedule.index;
    career.maturity.events = career.maturity.events.concat(events);
    updateInjuryStatus(career);
    return events;
  }

  function advanceToTime(career, time) {
    ensureInjuryState(career);
    const fromIndex = career.maturity.lastCheckedIndex;
    const events = ns.MaturityRules.applyMonthlyDecline(career.horse, career.maturity, fromIndex, time.index);
    career.currentTime = {
      age: time.age,
      month: time.month,
      half: time.half || 1,
      index: time.index
    };
    career.maturity.lastCheckedIndex = time.index;
    career.maturity.events = career.maturity.events.concat(events);
    updateInjuryStatus(career);
    return events;
  }

  function ensureInjuryState(career) {
    if (!career.injury) career.injury = { active: null, history: [] };
    if (!Array.isArray(career.injury.history)) career.injury.history = [];
    return career.injury;
  }

  function injuryPublicLabel(injury) {
    if (!injury) return "";
    if (injury.forcedRetirement) return `${injury.reason}（${injury.severityLabel}，强制退役）`;
    if (injury.restMonths > 0) return `${injury.reason}（${injury.severityLabel}休养${injury.restMonths}个月）`;
    return `${injury.reason}（${injury.severityLabel}）`;
  }

  function applyRaceInjury(career, raceResult, schedule) {
    ensureInjuryState(career);
    const injury = raceResult.hidden && raceResult.hidden.injury;
    if (!injury) return null;
    const startIndex = schedule ? schedule.index : career.currentTime.index;
    const applied = {
      ...injury,
      startIndex,
      startLabel: schedule ? schedule.label : ns.TimeRules.formatAgeMonth(career.currentTime),
      restTurns: injury.restMonths * 2,
      restUntilIndex: injury.restMonths > 0 ? startIndex + injury.restMonths * 2 : null,
      restUntilLabel: ""
    };
    if (applied.restUntilIndex != null) {
      applied.restUntilLabel = ns.TimeRules.formatAgeMonth(ns.TimeRules.fromIndex(applied.restUntilIndex));
    }
    applied.publicLabel = injuryPublicLabel(applied);
    career.injury.history.push(applied);
    raceResult.hidden.injury = applied;
    raceResult.public.injury = {
      phase: applied.phase,
      reason: applied.reason,
      severity: applied.severityLabel,
      restMonths: applied.restMonths,
      restUntilLabel: applied.restUntilLabel,
      forcedRetirement: applied.forcedRetirement,
      label: applied.publicLabel
    };
    if (applied.forcedRetirement) {
      career.forcedRetirement = true;
      career.forcedRetirementReason = `因${applied.reason}导致${applied.severityLabel}，被迫退役`;
      career.injury.active = null;
    } else if (applied.restUntilIndex != null && applied.restUntilIndex > career.currentTime.index) {
      career.injury.active = applied;
    }
    return applied;
  }

  function updateInjuryStatus(career) {
    if (!career) return null;
    ensureInjuryState(career);
    if (!career || !career.injury || !career.injury.active) return null;
    if (career.currentTime.index >= career.injury.active.restUntilIndex) {
      const healed = career.injury.active;
      career.injury.active = null;
      return healed;
    }
    return career.injury.active;
  }

  function isResting(career) {
    updateInjuryStatus(career);
    return !!(career && career.injury && career.injury.active && career.injury.active.restUntilIndex > career.currentTime.index);
  }

  function getRestStatus(career) {
    if (!isResting(career)) return null;
    const injury = career.injury.active;
    const remainingTurns = injury.restUntilIndex - career.currentTime.index;
    return {
      ...injury,
      remainingTurns,
      remainingMonths: Math.ceil(remainingTurns / 2)
    };
  }

  function addRace(career, raceResult, schedule) {
    ensureExpeditionState(career);
    if (schedule) {
      raceResult.public.timeLabel = schedule.label;
      raceResult.hidden.schedule = schedule;
    }
    const raceWear = schedule ? ns.MaturityRules.applyRaceWear(career.horse, career.maturity, schedule.index) : null;
    if (raceWear) career.maturity.events.push(raceWear);
    raceResult.hidden.postRaceMaturity = ns.MaturityRules.evaluate(career.horse, career.currentTime, career.maturity.decline);
    raceResult.hidden.raceWear = raceWear;
    applyRaceInjury(career, raceResult, schedule);
    const postRaceComment = ns.PostRaceCommentRules
      ? ns.PostRaceCommentRules.generate(career, raceResult, schedule)
      : null;
    if (postRaceComment) {
      raceResult.public.postRaceCommentText = postRaceComment.text;
      raceResult.hidden.postRaceComment = postRaceComment;
      career.lastRaceComment = postRaceComment;
      if (ns.AdaptationHintRules) ns.AdaptationHintRules.applyPostRace(career, raceResult, postRaceComment);
    }
    if (raceResult.hidden.expedition && raceResult.hidden.expedition.active) {
      career.expedition.history.push({
        ...raceResult.hidden.expedition,
        raceId: raceResult.hidden.race ? raceResult.hidden.race.id : "",
        raceName: raceResult.public.raceName || "",
        timeLabel: raceResult.public.timeLabel || "",
        scheduleIndex: schedule ? schedule.index : null
      });
    }
    if (ns.RegionRules && ns.RegionRules.completeTravelAfterRace && raceResult.hidden && raceResult.hidden.race) {
      const travel = raceResult.hidden.travel || null;
      ns.RegionRules.completeTravelAfterRace(career, raceResult.hidden.race, raceResult.hidden);
      if (travel && travel.active && career.travel && Array.isArray(career.travel.history)) {
        career.travel.history.push({
          ...travel,
          raceId: raceResult.hidden.race.id || "",
          raceName: raceResult.public.raceName || "",
          timeLabel: raceResult.public.timeLabel || "",
          scheduleIndex: schedule ? schedule.index : null
        });
      }
    }
    career.races.push({
      public: raceResult.public,
      hidden: raceResult.hidden
    });
  }

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

  function raceClass(record) {
    const race = recordRace(record);
    return race && race.raceClass ? race.raceClass : "";
  }

  function isClassWin(record, classes) {
    return isWin(record) && classes.includes(raceClass(record));
  }

  function resultBucket(record) {
    const publicResult = recordPublic(record);
    if (isWin(record)) return "firsts";
    if (!publicResult.retired && (publicResult.rank === 2 || publicResult.rankLabel === "二着")) return "seconds";
    if (!publicResult.retired && (publicResult.rank === 3 || publicResult.rankLabel === "三着")) return "thirds";
    return "others";
  }

  function getRecordSummary(career) {
    const records = career && Array.isArray(career.races) ? career.races : [];
    const summary = {
      starts: records.length,
      wins: 0,
      firsts: 0,
      seconds: 0,
      thirds: 0,
      others: 0,
      g1Wins: 0,
      g2Wins: 0,
      g3Wins: 0,
      jpn1Wins: 0,
      jpn2Wins: 0,
      jpn3Wins: 0,
      grade1Wins: 0,
      grade2Wins: 0,
      grade3Wins: 0,
      winRate: 0
    };

    records.forEach((record) => {
      const bucket = resultBucket(record);
      summary[bucket] += 1;
      if (!isWin(record)) return;
      summary.wins += 1;
      if (isClassWin(record, ["g1"])) summary.g1Wins += 1;
      if (isClassWin(record, ["g2"])) summary.g2Wins += 1;
      if (isClassWin(record, ["g3"])) summary.g3Wins += 1;
      if (isClassWin(record, ["jpn1"])) summary.jpn1Wins += 1;
      if (isClassWin(record, ["jpn2"])) summary.jpn2Wins += 1;
      if (isClassWin(record, ["jpn3"])) summary.jpn3Wins += 1;
      if (isClassWin(record, ["g1", "jpn1"])) summary.grade1Wins += 1;
      if (isClassWin(record, ["g2", "jpn2"])) summary.grade2Wins += 1;
      if (isClassWin(record, ["g3", "jpn3"])) summary.grade3Wins += 1;
    });

    summary.winRate = summary.starts ? Math.round((summary.wins / summary.starts) * 100) : 0;
    return summary;
  }

  function ensureExpeditionState(career) {
    if (!career.expedition) career.expedition = { history: [] };
    if (!Array.isArray(career.expedition.history)) career.expedition.history = [];
    return career.expedition;
  }

  function retire(career, reason) {
    career.retired = true;
    if (reason) career.retirementReason = reason;
    const recordSummary = getRecordSummary(career);
    return {
      ...recordSummary,
      maturityDecline: career.maturity.decline,
      retirementReason: career.retirementReason || "",
      horse: career.horse,
      races: career.races
    };
  }

  ns.CareerRules = {
    createCareer,
    advanceToSchedule,
    advanceToTime,
    addRace,
    retire,
    getRecordSummary,
    updateInjuryStatus,
    isResting,
    getRestStatus
  };
})();
