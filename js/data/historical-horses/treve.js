(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    id: "treve",
    name: "Treve",
    displayName: "Treve",
    profile: {
      baseAbility: 85,
      peakAbility: 87,
      note: "法国中长距离雌马，凯旋门赏连霸与红宝锦标表现突出。"
    },
    races: [
      { raceId: "prix-de-diane", year: 2013, ability: 86, jockeyId: "thierry-jarnet", finish: 1 },
      { raceId: "prix-vermeille", year: 2013, ability: 86, jockeyId: "frankie-dettori", finish: 1 },
      { raceId: "prix-de-larc", year: 2013, ability: 87, jockeyId: "thierry-jarnet", finish: 1 },
      { raceId: "prix-de-larc", year: 2014, ability: 87, jockeyId: "thierry-jarnet", finish: 1 },
      { raceId: "grand-prix-de-saint-cloud", year: 2015, ability: 86, jockeyId: "thierry-jarnet", finish: 1 },
      { raceId: "prix-vermeille", year: 2015, ability: 86, jockeyId: "thierry-jarnet", finish: 1 }
    ]
  });
})();
