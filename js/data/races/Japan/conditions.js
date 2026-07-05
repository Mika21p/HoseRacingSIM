(function () {
  const ns = (window.Keiba = window.Keiba || {});
  const D = ns.RaceData;

  const MAIDEN_PLANS = D.turnRange(2, 7, D.EARLY, 3, 9, D.LATE);

  function turfRaces(kind, plan) {
    const distances = [1000, 1200, 1400, 1600, 1800, 2000];
    const seed = plan.month * 2 + plan.half;
    return [
      D.makeConditionRace(kind, plan, "草地", plan.group[0], distances[(seed + 3) % distances.length], 1),
      D.makeConditionRace(kind, plan, "草地", plan.group[1], distances[(seed + 5) % distances.length], 2),
      D.makeConditionRace(kind, plan, "草地", D.localFor(plan, 0), distances[seed % 3], 3),
      D.makeConditionRace(kind, plan, "草地", D.localFor(plan, 1), distances[(seed + 1) % 3], 4)
    ];
  }

  function dirtRaces(kind, plan) {
    const mainDistances = [1200, 1400, 1600, 1800];
    const localDistances = [1000, 1200, 1400];
    const localOnly = plan.age === 2 && plan.month <= 10;
    const seed = plan.month * 2 + plan.half;
    const races = [
      D.makeConditionRace(kind, plan, "泥地", D.localFor(plan, 0), localDistances[seed % localDistances.length], 1),
      D.makeConditionRace(kind, plan, "泥地", D.localFor(plan, 1), localDistances[(seed + 1) % localDistances.length], 2)
    ];
    if (!localOnly) {
      races.push(
        D.makeConditionRace(kind, plan, "泥地", plan.group[0], mainDistances[seed % mainDistances.length], 3),
        D.makeConditionRace(kind, plan, "泥地", plan.group[1], mainDistances[(seed + 2) % mainDistances.length], 4)
      );
    }
    return races;
  }

  function buildConditionRaces() {
    const races = [];
    D.turnRange(2, 6, D.EARLY, 3, 4, D.LATE).forEach((plan) => {
      races.push(...turfRaces("new", plan), ...dirtRaces("new", plan));
    });
    MAIDEN_PLANS.forEach((plan) => {
      races.push(...turfRaces("maiden", plan), ...dirtRaces("maiden", plan));
    });
    return races;
  }

  function pickDistance(pool, plan, offset) {
    return pool[(plan.age * 13 + plan.month * 3 + plan.half + offset) % pool.length];
  }

  function oneWinTurfPool(plan) {
    if (plan.age === 2) return plan.month >= 9 ? [1200, 1400, 1600, 1800, 2000] : [1200, 1400, 1600, 1800];
    if (plan.age === 3) return [1200, 1400, 1600, 1800, 2000, 2200, 2400];
    return [1200, 1400, 1600, 1800, 2000, 2200, 2400, 2600];
  }

  function oneWinDirtPool(plan) {
    if (plan.age === 2) return [1200, 1400, 1600];
    if (plan.age === 3) return [1200, 1400, 1600, 1700, 1800, 1900];
    return [1200, 1400, 1600, 1700, 1800, 1900, 2100];
  }

  function twoWinTurfPool(plan) {
    const pool = [1200, 1400, 1600, 1800, 2000, 2200, 2400];
    if (plan.month % 3 === 0) pool.push(2500, 2600);
    if (plan.month === 1 || plan.month === 12) pool.push(3000);
    return pool;
  }

  function twoWinDirtPool(plan) {
    const pool = [1200, 1400, 1600, 1700, 1800, 1900];
    if (plan.month % 4 === 0) pool.push(2100);
    if (plan.month === 2 || plan.month === 8) pool.push(2400);
    return pool;
  }

  function threeWinTurfPool(plan) {
    const pool = [1200, 1400, 1600, 1800, 2000, 2200, 2400];
    if (plan.month % 4 === 0) pool.push(2500, 2600);
    if (plan.month === 1 || plan.month === 12) pool.push(3000);
    return pool;
  }

  function threeWinDirtPool(plan) {
    const pool = [1200, 1400, 1600, 1700, 1800, 1900];
    if (plan.month % 5 === 0) pool.push(2100);
    if (plan.month === 2 || plan.month === 8) pool.push(2400);
    return pool;
  }

  function buildOneWinRaces() {
    return D.turnRange(2, 7, D.EARLY, 4, 6, D.LATE).flatMap((plan) => {
      const turf = oneWinTurfPool(plan);
      const dirt = oneWinDirtPool(plan);
      return [
        D.makeAllowanceRace("one-win", plan, "草地", plan.group[0], pickDistance(turf, plan, 0), 1),
        D.makeAllowanceRace("one-win", plan, "草地", plan.group[1], pickDistance(turf, plan, 2), 2),
        D.makeAllowanceRace("one-win", plan, "草地", D.localFor(plan, 0), pickDistance(turf, plan, 4), 3),
        D.makeAllowanceRace("one-win", plan, "草地", D.localFor(plan, 1), pickDistance(turf, plan, 6), 4),
        D.makeAllowanceRace("one-win", plan, "泥地", plan.group[0], pickDistance(dirt, plan, 1), 5),
        D.makeAllowanceRace("one-win", plan, "泥地", plan.group[1], pickDistance(dirt, plan, 3), 6),
        D.makeAllowanceRace("one-win", plan, "泥地", D.localFor(plan, 0), pickDistance(dirt, plan, 5), 7)
      ];
    });
  }

  function buildTwoWinRaces() {
    return D.turnRange(3, 6, D.EARLY, 5, 12, D.LATE).flatMap((plan) => {
      const turf = twoWinTurfPool(plan);
      const dirt = twoWinDirtPool(plan);
      return [
        D.makeAllowanceRace("two-win", plan, "草地", plan.group[0], pickDistance(turf, plan, 0), 1),
        D.makeAllowanceRace("two-win", plan, "草地", plan.group[1], pickDistance(turf, plan, 2), 2),
        D.makeAllowanceRace("two-win", plan, "草地", D.localFor(plan, 0), pickDistance(turf, plan, 5), 3),
        D.makeAllowanceRace("two-win", plan, "泥地", plan.group[0], pickDistance(dirt, plan, 1), 4),
        D.makeAllowanceRace("two-win", plan, "泥地", plan.group[1], pickDistance(dirt, plan, 3), 5),
        D.makeAllowanceRace("two-win", plan, "泥地", D.localFor(plan, 1), pickDistance(dirt, plan, 5), 6)
      ];
    });
  }

  function buildThreeWinRaces() {
    return D.turnRange(3, 6, D.EARLY, 5, 12, D.LATE).flatMap((plan) => {
      const turf = threeWinTurfPool(plan);
      const dirt = threeWinDirtPool(plan);
      return [
        D.makeAllowanceRace("three-win", plan, "草地", plan.group[0], pickDistance(turf, plan, 1), 1),
        D.makeAllowanceRace("three-win", plan, "草地", D.localFor(plan, 0), pickDistance(turf, plan, 4), 2),
        D.makeAllowanceRace("three-win", plan, "泥地", plan.group[1], pickDistance(dirt, plan, 2), 3),
        D.makeAllowanceRace("three-win", plan, "泥地", D.localFor(plan, 1), pickDistance(dirt, plan, 5), 4)
      ];
    });
  }

  D.registerGeneratedRaces(
    "日本",
    "conditions",
    buildConditionRaces().concat(buildOneWinRaces(), buildTwoWinRaces(), buildThreeWinRaces())
  );
})();
