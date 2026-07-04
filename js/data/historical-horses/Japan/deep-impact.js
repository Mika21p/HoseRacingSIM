(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    id: "deep-impact",
    name: "ディープインパクト",
    displayName: "大震撼",
    displayNameZh: "大震撼",
    displayNameEn: "Deep Impact",
    profile: {
      baseAbility: 88,
      peakAbility: 90,
      note: "日本历史最顶尖标尺，经典三冠与古马王道路线。"
    },
    races: [
      { raceId: "yayoi-sho", year: 2005, ability: 88, jockeyId: "take-yutaka", finish: 1, trackCondition: "良" },
      { raceId: "satsuki-sho", year: 2005, ability: 89, jockeyId: "take-yutaka", finish: 1 },
      { raceId: "tokyo-yushun", year: 2005, ability: 89, jockeyId: "take-yutaka", finish: 1 },
      { raceId: "kobe-shimbun-hai", year: 2005, ability: 89, jockeyId: "take-yutaka", finish: 1, trackCondition: "良" },
      { raceId: "kikka-sho", year: 2005, ability: 90, jockeyId: "take-yutaka", finish: 1 },
      { raceId: "hanshin-daishoten", year: 2006, ability: 89, jockeyId: "take-yutaka", finish: 1, trackCondition: "稍重" },
      { raceId: "tenno-sho-haru", year: 2006, ability: 90, jockeyId: "take-yutaka", finish: 1 },
      { raceId: "takarazuka-kinen", year: 2006, ability: 90, jockeyId: "take-yutaka", finish: 1 },
      { raceId: "japan-cup", year: 2006, ability: 90, jockeyId: "take-yutaka", finish: 1 },
      { raceId: "arima-kinen", year: 2006, ability: 90, jockeyId: "take-yutaka", finish: 1 }
    ]
  });
})();
