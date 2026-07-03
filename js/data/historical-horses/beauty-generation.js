(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    id: "beauty-generation",
    name: "Beauty Generation",
    displayName: "Beauty Generation",
    profile: {
      baseAbility: 85,
      peakAbility: 87,
      note: "香港一哩王，美丽系代表，连续赛季统治一哩至千四路线。"
    },
    races: [
      { raceId: "hong-kong-mile", year: 2017, ability: 85, jockeyId: "derek-leung", finish: 1 },
      { raceId: "queens-silver-jubilee-cup", year: 2018, ability: 86, jockeyId: "zac-purton", finish: 1 },
      { raceId: "champions-mile", year: 2018, ability: 86, jockeyId: "zac-purton", finish: 1 },
      { raceId: "hong-kong-mile", year: 2018, ability: 87, jockeyId: "zac-purton", finish: 1 },
      { raceId: "hong-kong-stewards-cup", year: 2019, ability: 87, jockeyId: "zac-purton", finish: 1 },
      { raceId: "queens-silver-jubilee-cup", year: 2019, ability: 87, jockeyId: "zac-purton", finish: 1 },
      { raceId: "champions-mile", year: 2019, ability: 87, jockeyId: "zac-purton", finish: 1 },
      { raceId: "queens-silver-jubilee-cup", year: 2020, ability: 85, jockeyId: "zac-purton", finish: 1 }
    ]
  });
})();
