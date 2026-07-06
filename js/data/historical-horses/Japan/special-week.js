(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    id: "special-week",
    name: "スペシャルウィーク",
    displayName: "特别周",
    displayNameZh: "特别周",
    displayNameEn: "Special Week",
    profile: {
      baseAbility: 81,
      peakAbility: 83,
      note: "德比与1999年古马王道代表。"
    },
    races: [
      { raceId: "kisaragi-sho", year: 1998, ability: 81, jockeyId: "take-yutaka", finish: 1 },
      { raceId: "yayoi-sho", year: 1998, ability: 81, jockeyId: "take-yutaka", finish: 1 },
      { raceId: "tokyo-yushun", year: 1998, ability: 83, jockeyId: "take-yutaka", finish: 1 },
      { raceId: "kyoto-shimbun-hai", year: 1998, ability: 81, jockeyId: "take-yutaka", finish: 1 },
      { raceId: "american-jockey-club-cup", year: 1999, ability: 82, jockeyId: "olivier-peslier", finish: 1 },
      { raceId: "hanshin-daishoten", year: 1999, ability: 82, jockeyId: "take-yutaka", finish: 1 },
      { raceId: "tenno-sho-haru", year: 1999, ability: 83, jockeyId: "take-yutaka", finish: 1 },
      { raceId: "tenno-sho-aki", year: 1999, ability: 83, jockeyId: "take-yutaka", finish: 1 },
      { raceId: "japan-cup", year: 1999, ability: 83, jockeyId: "take-yutaka", finish: 1 }
    ]
  });
})();
