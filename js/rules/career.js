(function () {
  const ns = (window.Keiba = window.Keiba || {});

  function createCareer(horse, comments, commentDetails, debutLock, trainer) {
    const start = ns.TimeRules.startTime();
    return {
      horse,
      comments: comments || [],
      commentDetails: commentDetails || [],
      debutLock: debutLock || null,
      trainer: trainer || null,
      trainerId: (trainer && trainer.id) || horse.trainerId || "sato-yuta",
      lastRaceComment: null,
      mainJockeyId: horse.mainJockeyId || "take-yutaka",
      currentTime: start,
      lastRaceIndex: null,
      scheduledRace: null,
      injury: {
        active: null,
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
    }
    career.races.push({
      public: raceResult.public,
      hidden: raceResult.hidden
    });
  }

  function isWin(record) {
    return (record.public.rank === 1 || record.public.rankLabel === "一着") && !record.public.retired;
  }

  function retire(career, reason) {
    career.retired = true;
    if (reason) career.retirementReason = reason;
    const starts = career.races.length;
    const wins = career.races.filter(isWin).length;
    const g1Wins = career.races.filter((item) => isWin(item) && item.hidden.race.grade === "G1").length;
    const jpn1Wins = career.races.filter((item) => isWin(item) && item.hidden.race.raceClass === "jpn1").length;
    return {
      starts,
      wins,
      g1Wins,
      jpn1Wins,
      winRate: starts ? Math.round((wins / starts) * 100) : 0,
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
    updateInjuryStatus,
    isResting,
    getRestStatus
  };
})();
