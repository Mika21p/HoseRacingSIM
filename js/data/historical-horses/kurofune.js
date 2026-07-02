(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    id: "kurofune",
    name: "クロフネ",
    displayName: "Kurofune",
    profile: {
      baseAbility: 80,
      peakAbility: 82,
      note: "草泥双G1级名马，泥地表现极具冲击力。"
    },
    races: [
      { raceId: "mainichi-hai", year: 2001, ability: 80, jockeyId: "generic-local", finish: 1 },
      { raceId: "nhk-mile-cup", year: 2001, ability: 81, jockeyId: "take-yutaka", finish: 1 },
      { raceId: "tokyo-yushun", year: 2001, ability: 80, jockeyId: "take-yutaka", finish: 5 },
      { raceId: "musashino-stakes", year: 2001, ability: 82, jockeyId: "take-yutaka", finish: 1 },
      { raceId: "champions-cup", year: 2001, ability: 82, jockeyId: "take-yutaka", finish: 1 }
    ]
  });
})();
