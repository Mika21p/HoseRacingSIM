(function () {
  const ns = (window.Keiba = window.Keiba || {});

  function surfaceKey(race) {
    return `${race.surface}${race.surfaceRegion || "日本"}`;
  }

  function isDistanceAllowed(lock, race) {
    if (!lock || !lock.distance) return true;
    return race.distance >= lock.distance.min && race.distance <= lock.distance.max;
  }

  function isFallbackDistanceAllowed(race) {
    if (race.surface === "草地") return race.distance >= 1800 && race.distance <= 2000;
    if (race.surface === "泥地") return race.distance >= 1600 && race.distance <= 1800;
    return false;
  }

  function isSurfaceAllowed(lock, race) {
    if (!lock || !lock.surfaces || lock.surfaces.length === 0) return true;
    const key = surfaceKey(race);
    return lock.surfaces.some((surface) => surface === key || surface.indexOf(race.surface) === 0);
  }

  function isTimeAllowed(lock, schedule) {
    if (!lock || !lock.time) return true;
    return schedule.index >= lock.time.startIndex && schedule.index <= lock.time.endIndex;
  }

  function isDebutRaceAllowed(career, plan) {
    if (!career || career.races.length > 0) return true;
    if (plan.race.raceClass !== "new") return true;
    const lock = career.debutLock;
    return isDistanceAllowed(lock, plan.race)
      && isSurfaceAllowed(lock, plan.race)
      && isTimeAllowed(lock, plan.schedule);
  }

  function isFallbackDebutRaceAllowed(career, plan) {
    if (!career || career.races.length > 0) return true;
    if (plan.race.raceClass !== "new") return true;
    const lock = career.debutLock;
    return isFallbackDistanceAllowed(plan.race)
      && isSurfaceAllowed(lock, plan.race)
      && isTimeAllowed(lock, plan.schedule);
  }

  function isSurfaceAndTimeAllowed(career, plan) {
    if (!career || career.races.length > 0) return true;
    if (plan.race.raceClass !== "new") return true;
    const lock = career.debutLock;
    return isSurfaceAllowed(lock, plan.race)
      && isTimeAllowed(lock, plan.schedule);
  }

  function isTimeOnlyAllowed(career, plan) {
    if (!career || career.races.length > 0) return true;
    if (plan.race.raceClass !== "new") return true;
    return isTimeAllowed(career.debutLock, plan.schedule);
  }

  function filterPlans(career, plans) {
    if (!career || career.races.length > 0) return plans;
    const strict = plans.filter((plan) => isDebutRaceAllowed(career, plan));
    if (strict.length > 0) return strict;
    const fallbackDistance = plans.filter((plan) => isFallbackDebutRaceAllowed(career, plan));
    if (fallbackDistance.length > 0) return fallbackDistance;
    const surfaceAndTime = plans.filter((plan) => isSurfaceAndTimeAllowed(career, plan));
    if (surfaceAndTime.length > 0) return surfaceAndTime;
    const timeOnly = plans.filter((plan) => isTimeOnlyAllowed(career, plan));
    return timeOnly.length > 0 ? timeOnly : plans;
  }

  ns.DebutLockRules = {
    surfaceKey,
    isDebutRaceAllowed,
    isFallbackDebutRaceAllowed,
    isSurfaceAndTimeAllowed,
    isTimeOnlyAllowed,
    filterPlans
  };
})();
