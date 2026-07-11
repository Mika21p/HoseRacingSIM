(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    id: "tap-dance-city",
    name: "タップダンスシチー",
    displayName: "跳舞城",
    displayNameZh: "跳舞城",
    displayNameEn: "Tap Dance City",
    profile: {
      baseAbility: 81,
      peakAbility: 83,
      note: "日本杯大胜与宝冢纪念胜马，代表性领放型古马。"
    },
    races: [
      { raceId: "challenge-cup", year: 2002, ability: 81, jockeyId: "tetsuzo-sato", finish: 1 },
      { raceId: "kinko-sho", year: 2003, ability: 81, jockeyId: "tetsuzo-sato", finish: 1 },
      { raceId: "kyoto-daishoten", year: 2003, ability: 82, jockeyId: "tetsuzo-sato", finish: 1 },
      { raceId: "japan-cup", year: 2003, ability: 83, jockeyId: "tetsuzo-sato", finish: 1 },
      { raceId: "kinko-sho", year: 2004, ability: 81, jockeyId: "tetsuzo-sato", finish: 1 },
      { raceId: "takarazuka-kinen", year: 2004, ability: 83, jockeyId: "tetsuzo-sato", finish: 1 },
      { raceId: "kinko-sho", year: 2005, ability: 81, jockeyId: "tetsuzo-sato", finish: 1 }
    ]
  });
})();
