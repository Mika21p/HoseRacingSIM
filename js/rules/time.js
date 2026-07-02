(function () {
  const ns = (window.Keiba = window.Keiba || {});

  const START_AGE = 2;
  const START_MONTH = 6;
  const START_HALF = 1;
  const MAX_AGE = 8;

  function toIndex(age, month, half) {
    const resolvedHalf = half || 1;
    return age * 24 + (month - 1) * 2 + resolvedHalf - 1;
  }

  function fromIndex(index) {
    const age = Math.floor(index / 24);
    const inYear = index % 24;
    return {
      age,
      month: Math.floor(inYear / 2) + 1,
      half: (inYear % 2) + 1,
      index
    };
  }

  function halfLabel(half) {
    return half === 2 ? "下半" : "上半";
  }

  function formatAgeHalf(time) {
    return `${time.age}岁${time.month}月${halfLabel(time.half || 1)}`;
  }

  function formatAgeMonth(time) {
    return formatAgeHalf(time);
  }

  function startTime() {
    return {
      age: START_AGE,
      month: START_MONTH,
      half: START_HALF,
      index: toIndex(START_AGE, START_MONTH, START_HALF)
    };
  }

  function nextTurn(time) {
    return fromIndex((time && Number.isFinite(time.index) ? time.index : startTime().index) + 1);
  }

  function isSameTurn(a, b) {
    return !!a && !!b && a.index === b.index;
  }

  function turnGap(from, to) {
    if (!from || !to) return 0;
    return to.index - from.index;
  }

  function isAgeEligible(age, restriction) {
    if (!restriction) return true;
    if (restriction.type === "exact") return age === restriction.age;
    if (restriction.type === "min") return age >= restriction.age;
    if (restriction.type === "range") return age >= restriction.min && age <= restriction.max;
    return true;
  }

  function isSexEligible(horse, race) {
    if (!race.sexRestriction) return true;
    if (!horse || !horse.gender) return false;
    return horse.gender === race.sexRestriction;
  }

  function resolveNextRaceDate(career, race) {
    const currentIndex = career.currentTime ? career.currentTime.index : startTime().index;
    const minIndex = career.lastRaceIndex == null ? currentIndex : career.lastRaceIndex + 1;
    const start = fromIndex(minIndex);
    const startAge = start.age;
    const raceMonth = race.month || 1;
    const raceHalf = race.half || 1;

    for (let age = startAge; age <= MAX_AGE; age += 1) {
      if (!isAgeEligible(age, race.ageRestriction)) continue;
      const index = toIndex(age, raceMonth, raceHalf);
      if (index < minIndex) continue;
      return {
        age,
        month: raceMonth,
        half: raceHalf,
        index,
        label: formatAgeHalf({ age, month: raceMonth, half: raceHalf })
      };
    }
    return null;
  }

  function getAvailableRacePlans(career, races) {
    const plans = races
      .map((race) => ({ race, schedule: resolveNextRaceDate(career, race) }))
      .filter((plan) => plan.schedule)
      .filter((plan) => isSexEligible(career && career.horse, plan.race))
      .sort((a, b) => {
        if (a.schedule.index !== b.schedule.index) return a.schedule.index - b.schedule.index;
        return a.race.name.localeCompare(b.race.name, "zh-CN");
      });
    const progressed = ns.RaceProgression ? ns.RaceProgression.filterPlans(career, plans) : plans;
    return ns.DebutLockRules ? ns.DebutLockRules.filterPlans(career, progressed) : progressed;
  }

  ns.TimeRules = {
    START_AGE,
    START_MONTH,
    START_HALF,
    MAX_AGE,
    toIndex,
    fromIndex,
    halfLabel,
    formatAgeHalf,
    formatAgeMonth,
    startTime,
    nextTurn,
    isSameTurn,
    turnGap,
    isAgeEligible,
    isSexEligible,
    resolveNextRaceDate,
    getAvailableRacePlans
  };
})();
