(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    id: "soccer-boy",
    name: "サッカーボーイ",
    displayName: "足球小子",
    displayNameZh: "足球小子",
    displayNameEn: "Soccer Boy",
    profile: {
      baseAbility: 79,
      peakAbility: 81,
      note: "1987 年日本最佳两岁雄马，翌年胜出一哩冠军赛。"
    },
    races: [
      { raceId: "hanshin-juvenile-fillies", year: 1987, ability: 80, jockeyId: "kawachi-hiroshi", finish: 1 },
      { raceId: "falcon-stakes", year: 1988, ability: 79, jockeyId: "kawachi-hiroshi", finish: 1 },
      { raceId: "hakodate-kinen", year: 1988, ability: 80, jockeyId: "kawachi-hiroshi", finish: 1 },
      { raceId: "mile-championship", year: 1988, ability: 81, jockeyId: "kawachi-hiroshi", finish: 1 }
    ]
  });
})();
