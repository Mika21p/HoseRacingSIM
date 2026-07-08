(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    id: "daiichi-ruby",
    name: "ダイイチルビー",
    displayName: "第一红宝",
    displayNameZh: "第一红宝",
    displayNameEn: "Daiichi Ruby",
    profile: {
      baseAbility: 79,
      peakAbility: 81,
      note: "1991 年安田纪念与短途马锦标胜马，短哩牝马代表。"
    },
    races: [
      { raceId: "keio-hai-spring-cup", year: 1991, ability: 79, jockeyId: "kawachi-hiroshi", finish: 1 },
      { raceId: "yasuda-kinen", year: 1991, ability: 81, jockeyId: "kawachi-hiroshi", finish: 1 },
      { raceId: "sprinters-stakes", year: 1991, ability: 81, jockeyId: "kawachi-hiroshi", finish: 1 }
    ]
  });
})();
