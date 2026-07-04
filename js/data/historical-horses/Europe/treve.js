(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    id: "treve",
    name: "Treve",
    displayName: "卓芙",
    displayNameZh: "卓芙",
    displayNameEn: "Treve",
    profile: {
      baseAbility: 89,
      peakAbility: 91,
      note: "法国中长距离雌马，凯旋门赏连霸与红宝锦标表现突出。"
    },
    races: [
      { raceId: "prix-de-diane", year: 2013, ability: 90, jockeyId: "thierry-jarnet", finish: 1 },
      { raceId: "prix-vermeille", year: 2013, ability: 90, jockeyId: "frankie-dettori", finish: 1 },
      { raceId: "prix-de-larc", year: 2013, ability: 91, jockeyId: "thierry-jarnet", finish: 1 },
      { raceId: "prix-de-larc", year: 2014, ability: 91, jockeyId: "thierry-jarnet", finish: 1 },
      { raceId: "grand-prix-de-saint-cloud", year: 2015, ability: 90, jockeyId: "thierry-jarnet", finish: 1 },
      { raceId: "prix-vermeille", year: 2015, ability: 90, jockeyId: "thierry-jarnet", finish: 1 }
    ]
  });
})();
