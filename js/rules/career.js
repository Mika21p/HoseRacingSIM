(function () {
  const ns = (window.Keiba = window.Keiba || {});

  function createCareer(horse, comments, commentDetails, debutLock) {
    const start = ns.TimeRules.startTime();
    return {
      horse,
      comments: comments || [],
      commentDetails: commentDetails || [],
      debutLock: debutLock || null,
      mainJockeyId: horse.mainJockeyId || "take-yutaka",
      currentTime: start,
      lastRaceIndex: null,
      scheduledRace: null,
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
    return events;
  }

  function advanceToTime(career, time) {
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
    return events;
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
    career.races.push({
      public: raceResult.public,
      hidden: raceResult.hidden
    });
  }

  function isWin(record) {
    return (record.public.rank === 1 || record.public.rankLabel === "一着") && !record.public.retired;
  }

  function retire(career) {
    career.retired = true;
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
      horse: career.horse,
      races: career.races
    };
  }

  ns.CareerRules = { createCareer, advanceToSchedule, advanceToTime, addRace, retire };
})();
