(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    id: "orfevre",
    name: "オルフェーヴル",
    displayName: "黄金巨匠",
    displayNameZh: "黄金巨匠",
    displayNameEn: "Orfevre",
    profile: {
      baseAbility: 86,
      peakAbility: 88,
      note: "三冠马，海外顶级表现，爆发力极高。"
    },
    races: [
      { raceId: "spring-stakes", year: 2011, ability: 86, jockeyId: "kenichi-ikezoe", finish: 1, trackCondition: "良" },
      { raceId: "satsuki-sho", year: 2011, ability: 86, jockeyId: "kenichi-ikezoe", finish: 1 },
      { raceId: "tokyo-yushun", year: 2011, ability: 87, jockeyId: "kenichi-ikezoe", finish: 1 },
      { raceId: "kobe-shimbun-hai", year: 2011, ability: 87, jockeyId: "kenichi-ikezoe", finish: 1, trackCondition: "良" },
      { raceId: "kikka-sho", year: 2011, ability: 88, jockeyId: "kenichi-ikezoe", finish: 1 },
      { raceId: "arima-kinen", year: 2011, ability: 88, jockeyId: "kenichi-ikezoe", finish: 1 },
      { raceId: "takarazuka-kinen", year: 2012, ability: 88, jockeyId: "kenichi-ikezoe", finish: 1 },
      { raceId: "osaka-hai", year: 2013, ability: 88, jockeyId: "kenichi-ikezoe", finish: 1 },
      { raceId: "arima-kinen", year: 2013, ability: 88, jockeyId: "kenichi-ikezoe", finish: 1 }
    ]
  });
})();
