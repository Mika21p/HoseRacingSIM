(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    id: "efforia",
    name: "エフフォーリア",
    displayName: "乐透心",
    displayNameZh: "乐透心",
    displayNameEn: "Efforia",
    profile: {
      baseAbility: 84,
      peakAbility: 87,
      note: "2021 年日本马王，胜出皋月赏、秋季天皇赏与有马纪念。"
    },
    races: [
      { raceId: "tokinominoru-kinen", year: 2021, ability: 84, jockeyId: "takeshi-yokoyama", finish: 1 },
      { raceId: "satsuki-sho", year: 2021, ability: 85, jockeyId: "takeshi-yokoyama", finish: 1 },
      { raceId: "tenno-sho-aki", year: 2021, ability: 87, jockeyId: "takeshi-yokoyama", finish: 1 },
      { raceId: "arima-kinen", year: 2021, ability: 87, jockeyId: "takeshi-yokoyama", finish: 1 }
    ]
  });
})();
