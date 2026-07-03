(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    id: "contrail",
    name: "コントレイル",
    displayName: "Contrail",
    profile: {
      baseAbility: 84,
      peakAbility: 86,
      note: "无败三冠马，2岁到经典路线持续高表现。"
    },
    races: [
      { raceId: "tokyo-sports-hai", year: 2019, ability: 84, jockeyId: "ryan-moore", finish: 1, trackCondition: "良" },
      { raceId: "hopeful-stakes", year: 2019, ability: 85, jockeyId: "yuichi-fukunaga", finish: 1 },
      { raceId: "satsuki-sho", year: 2020, ability: 85, jockeyId: "yuichi-fukunaga", finish: 1 },
      { raceId: "tokyo-yushun", year: 2020, ability: 86, jockeyId: "yuichi-fukunaga", finish: 1 },
      { raceId: "kobe-shimbun-hai", year: 2020, ability: 85, jockeyId: "yuichi-fukunaga", finish: 1, trackCondition: "良" },
      { raceId: "kikka-sho", year: 2020, ability: 86, jockeyId: "yuichi-fukunaga", finish: 1 },
      { raceId: "japan-cup", year: 2021, ability: 86, jockeyId: "yuichi-fukunaga", finish: 1 }
    ]
  });
})();
