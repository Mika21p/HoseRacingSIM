(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    id: "golden-sixty",
    name: "Golden Sixty",
    displayName: "Golden Sixty",
    profile: {
      baseAbility: 86,
      peakAbility: 88,
      note: "香港历史级一哩王，三届香港年度马，香港一哩与冠军一哩多胜。"
    },
    races: [
      { raceId: "hong-kong-mile", year: 2020, ability: 86, jockeyId: "vincent-ho", finish: 1 },
      { raceId: "hong-kong-stewards-cup", year: 2021, ability: 86, jockeyId: "vincent-ho", finish: 1 },
      { raceId: "hong-kong-gold-cup", year: 2021, ability: 87, jockeyId: "vincent-ho", finish: 1 },
      { raceId: "champions-mile", year: 2021, ability: 87, jockeyId: "vincent-ho", finish: 1 },
      { raceId: "hong-kong-mile", year: 2021, ability: 87, jockeyId: "vincent-ho", finish: 1 },
      { raceId: "champions-mile", year: 2022, ability: 87, jockeyId: "vincent-ho", finish: 1 },
      { raceId: "hong-kong-stewards-cup", year: 2023, ability: 87, jockeyId: "vincent-ho", finish: 1 },
      { raceId: "hong-kong-gold-cup", year: 2023, ability: 88, jockeyId: "vincent-ho", finish: 1 },
      { raceId: "champions-mile", year: 2023, ability: 88, jockeyId: "vincent-ho", finish: 1 },
      { raceId: "hong-kong-mile", year: 2023, ability: 88, jockeyId: "vincent-ho", finish: 1 }
    ]
  });
})();
