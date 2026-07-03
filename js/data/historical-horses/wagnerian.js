(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    id: "wagnerian",
    name: "ワグネリアン",
    displayName: "Wagnerian",
    profile: {
      baseAbility: 79,
      peakAbility: 81,
      note: "2018年日本德比冠军，东京中距离世代代表。"
    },
    races: [
      { raceId: "tokyo-sports-hai", year: 2017, ability: 79, jockeyId: "yuichi-fukunaga", finish: 1 },
      { raceId: "tokyo-yushun", year: 2018, ability: 81, jockeyId: "yuichi-fukunaga", finish: 1 },
      { raceId: "kobe-shimbun-hai", year: 2018, ability: 80, jockeyId: "yuichi-fukunaga", finish: 1 }
    ]
  });
})();
