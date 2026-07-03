(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    id: "zarkava",
    name: "Zarkava",
    displayName: "Zarkava",
    profile: {
      baseAbility: 89,
      peakAbility: 91,
      note: "无败法国雌马，法国橡树、红宝锦标与凯旋门赏连贯制压。"
    },
    races: [
      { raceId: "prix-de-diane", year: 2008, ability: 90, jockeyId: "christophe-soumillon", finish: 1 },
      { raceId: "prix-vermeille", year: 2008, ability: 90, jockeyId: "christophe-soumillon", finish: 1 },
      { raceId: "prix-de-larc", year: 2008, ability: 91, jockeyId: "christophe-soumillon", finish: 1 }
    ]
  });
})();
