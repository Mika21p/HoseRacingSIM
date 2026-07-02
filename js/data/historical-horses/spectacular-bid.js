(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    id: "spectacular-bid",
    name: "Spectacular Bid",
    displayName: "Spectacular Bid",
    profile: {
      baseAbility: 86,
      peakAbility: 88,
      note: "美国泥地速度型巨星，三岁经典与古马让赛均有顶级表现。"
    },
    races: [
      { raceId: "kentucky-derby", year: 1979, ability: 87, jockeyId: "ron-franklin", finish: 1 },
      { raceId: "preakness-stakes", year: 1979, ability: 87, jockeyId: "ron-franklin", finish: 1 },
      { raceId: "santa-anita-handicap", year: 1980, ability: 88, jockeyId: "bill-shoemaker", finish: 1 }
    ]
  });
})();
