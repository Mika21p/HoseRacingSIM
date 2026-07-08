(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    id: "narita-top-road",
    name: "ナリタトップロード",
    displayName: "成田路",
    displayNameZh: "成田路",
    displayNameEn: "Narita Top Road",
    profile: {
      baseAbility: 80,
      peakAbility: 82,
      note: "99 世代三强之一，菊花赏胜马并长期活跃于中长距离重赏。"
    },
    races: [
      { raceId: "kisaragi-sho", year: 1999, ability: 80, jockeyId: "kunihiko-watanabe", finish: 1 },
      { raceId: "yayoi-sho", year: 1999, ability: 80, jockeyId: "kunihiko-watanabe", finish: 1 },
      { raceId: "kikka-sho", year: 1999, ability: 82, jockeyId: "kunihiko-watanabe", finish: 1 },
      { raceId: "hanshin-daishoten", year: 2001, ability: 81, jockeyId: "kunihiko-watanabe", finish: 1 },
      { raceId: "kyoto-kinen", year: 2002, ability: 80, jockeyId: "kunihiko-watanabe", finish: 1 },
      { raceId: "hanshin-daishoten", year: 2002, ability: 81, jockeyId: "kunihiko-watanabe", finish: 1 },
      { raceId: "kyoto-daishoten", year: 2002, ability: 81, jockeyId: "kunihiko-watanabe", finish: 1 }
    ]
  });
})();
