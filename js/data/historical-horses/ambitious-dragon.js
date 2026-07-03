(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    id: "ambitious-dragon",
    name: "Ambitious Dragon",
    displayName: "Ambitious Dragon",
    profile: {
      baseAbility: 82,
      peakAbility: 84,
      note: "雄心威龙两届香港年度马，兼具一哩与中距离G1胜绩。"
    },
    races: [
      { raceId: "hong-kong-queen-elizabeth-ii-cup", year: 2011, ability: 83, jockeyId: "douglas-whyte", finish: 1 },
      { raceId: "hong-kong-stewards-cup", year: 2012, ability: 83, jockeyId: "douglas-whyte", finish: 1 },
      { raceId: "hong-kong-gold-cup", year: 2012, ability: 84, jockeyId: "douglas-whyte", finish: 1 },
      { raceId: "hong-kong-mile", year: 2012, ability: 84, jockeyId: "zac-purton", finish: 1 },
      { raceId: "queens-silver-jubilee-cup", year: 2013, ability: 83, jockeyId: "zac-purton", finish: 1 }
    ]
  });
})();
