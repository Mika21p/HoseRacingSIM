(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    id: "silent-witness",
    name: "Silent Witness",
    displayName: "Silent Witness",
    profile: {
      baseAbility: 83,
      peakAbility: 85,
      note: "香港短途传奇，开局长连胜，香港短途与本地短途G1双线统治。"
    },
    races: [
      { raceId: "hong-kong-sprint", year: 2003, ability: 84, jockeyId: "felix-coetzee", finish: 1 },
      { raceId: "centenary-sprint-cup", year: 2004, ability: 84, jockeyId: "felix-coetzee", finish: 1 },
      { raceId: "chairmans-sprint-prize", year: 2004, ability: 85, jockeyId: "felix-coetzee", finish: 1 },
      { raceId: "hong-kong-sprint", year: 2004, ability: 85, jockeyId: "felix-coetzee", finish: 1 },
      { raceId: "centenary-sprint-cup", year: 2005, ability: 84, jockeyId: "felix-coetzee", finish: 1 },
      { raceId: "chairmans-sprint-prize", year: 2005, ability: 84, jockeyId: "felix-coetzee", finish: 1 },
      { raceId: "sprinters-stakes", year: 2005, ability: 85, jockeyId: "felix-coetzee", finish: 1 }
    ]
  });
})();
