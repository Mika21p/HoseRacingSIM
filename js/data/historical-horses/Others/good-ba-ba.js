(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    id: "good-ba-ba",
    name: "Good Ba Ba",
    displayName: "好爸爸",
    displayNameZh: "好爸爸",
    displayNameEn: "Good Ba Ba",
    profile: {
      baseAbility: 82,
      peakAbility: 84,
      note: "香港一哩锦标三连霸，2007至2009年一哩线核心名马。"
    },
    races: [
      { raceId: "hong-kong-mile", year: 2007, ability: 83, jockeyId: "olivier-doleuze", finish: 1 },
      { raceId: "hong-kong-stewards-cup", year: 2008, ability: 83, jockeyId: "olivier-doleuze", finish: 1 },
      { raceId: "queens-silver-jubilee-cup", year: 2008, ability: 83, jockeyId: "olivier-doleuze", finish: 1 },
      { raceId: "champions-mile", year: 2008, ability: 84, jockeyId: "olivier-doleuze", finish: 1 },
      { raceId: "hong-kong-mile", year: 2008, ability: 84, jockeyId: "christophe-soumillon", finish: 1 },
      { raceId: "hong-kong-stewards-cup", year: 2009, ability: 83, jockeyId: "olivier-doleuze", finish: 1 },
      { raceId: "hong-kong-mile", year: 2009, ability: 84, jockeyId: "olivier-doleuze", finish: 1 }
    ]
  });
})();
