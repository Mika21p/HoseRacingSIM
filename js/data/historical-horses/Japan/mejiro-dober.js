(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    id: "mejiro-dober",
    name: "メジロドーベル",
    displayName: "目白多伯",
    displayNameZh: "目白多伯",
    displayNameEn: "Mejiro Dober",
    profile: {
      baseAbility: 79,
      peakAbility: 81,
      note: "日本牝马路线代表，三岁牝马二冠并两胜女王杯。"
    },
    races: [
      { raceId: "hanshin-juvenile-fillies", year: 1996, ability: 80, jockeyId: "yutaka-yoshida", finish: 1 },
      { raceId: "yushun-himba", year: 1997, ability: 81, jockeyId: "yutaka-yoshida", finish: 1 },
      { raceId: "shuka-sho", year: 1997, ability: 81, jockeyId: "yutaka-yoshida", finish: 1 },
      { raceId: "queen-elizabeth-ii-cup", year: 1998, ability: 81, jockeyId: "yutaka-yoshida", finish: 1 },
      { raceId: "queen-elizabeth-ii-cup", year: 1999, ability: 81, jockeyId: "yutaka-yoshida", finish: 1 }
    ]
  });
})();
