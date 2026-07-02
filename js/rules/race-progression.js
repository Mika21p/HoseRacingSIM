(function () {
  const ns = (window.Keiba = window.Keiba || {});

  const CONDITION_CLASSES = ["new", "maiden", "one-win", "two-win", "three-win"];
  const OPEN_OR_GRADED = ["op", "g3", "jpn3", "g2", "jpn2", "g1", "jpn1"];
  const GRADED_CLASSES = ["g3", "jpn3", "g2", "jpn2", "g1", "jpn1"];

  function isWin(record) {
    return (record.public.rank === 1 || record.public.rankLabel === "一着") && !record.public.retired;
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

  function isBeforeJulyThree(schedule) {
    return schedule.age === 3 && schedule.month <= 6;
  }

  function allowedClasses(career, schedule) {
    if (career.races.length === 0) return ["new"];
    if (!hasAnyWin(career)) return ["maiden"];
    if (wonAny(career, ["op"].concat(GRADED_CLASSES))) return OPEN_OR_GRADED;
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
    return allowedClasses(career, schedule).includes(race.raceClass);
  }

  function filterPlans(career, plans) {
    return plans.filter((plan) => isRaceAllowed(career, plan.race, plan.schedule));
  }

  ns.RaceProgression = {
    CONDITION_CLASSES,
    OPEN_OR_GRADED,
    allowedClasses,
    isRaceAllowed,
    filterPlans
  };
})();
