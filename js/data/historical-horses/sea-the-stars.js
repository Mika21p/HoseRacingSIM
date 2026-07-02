(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    id: "sea-the-stars",
    name: "Sea The Stars",
    displayName: "Sea The Stars",
    profile: {
      baseAbility: 88,
      peakAbility: 89,
      note: "欧洲三岁王道完全制压，英里经典到凯旋门赏均衡顶级。"
    },
    races: [
      { raceId: "two-thousand-guineas", year: 2009, ability: 88, jockeyId: "mick-kinane", finish: 1 },
      { raceId: "epsom-derby", year: 2009, ability: 89, jockeyId: "mick-kinane", finish: 1 },
      { raceId: "eclipse-stakes", year: 2009, ability: 89, jockeyId: "mick-kinane", finish: 1 },
      { raceId: "international-stakes", year: 2009, ability: 89, jockeyId: "mick-kinane", finish: 1 },
      { raceId: "irish-champion-stakes", year: 2009, ability: 89, jockeyId: "mick-kinane", finish: 1 },
      { raceId: "prix-de-larc", year: 2009, ability: 89, jockeyId: "mick-kinane", finish: 1 }
    ]
  });
})();
