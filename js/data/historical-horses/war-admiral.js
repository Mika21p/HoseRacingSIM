(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    id: "war-admiral",
    name: "War Admiral",
    displayName: "War Admiral",
    profile: {
      baseAbility: 90,
      peakAbility: 92,
      note: "Man o' War之子，美国三冠早期代表，泥地经典实力突出。"
    },
    races: [
      { raceId: "kentucky-derby", year: 1937, ability: 91, jockeyId: "charley-kurtsinger", finish: 1 },
      { raceId: "preakness-stakes", year: 1937, ability: 91, jockeyId: "charley-kurtsinger", finish: 1 },
      { raceId: "belmont-stakes", year: 1937, ability: 92, jockeyId: "charley-kurtsinger", finish: 1 }
    ]
  });
})();
