(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    id: "able-friend",
    name: "Able Friend",
    displayName: "Able Friend",
    profile: {
      baseAbility: 84,
      peakAbility: 87,
      note: "步步友为香港高评分一哩代表，末脚爆发力突出。"
    },
    races: [
      { raceId: "hong-kong-mile", year: 2014, ability: 86, jockeyId: "joao-moreira", finish: 1 },
      { raceId: "hong-kong-stewards-cup", year: 2015, ability: 86, jockeyId: "joao-moreira", finish: 1 },
      { raceId: "queens-silver-jubilee-cup", year: 2015, ability: 86, jockeyId: "joao-moreira", finish: 1 },
      { raceId: "champions-mile", year: 2015, ability: 87, jockeyId: "joao-moreira", finish: 1 }
    ]
  });
})();
