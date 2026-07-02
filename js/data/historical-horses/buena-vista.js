(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    id: "buena-vista",
    name: "ブエナビスタ",
    displayName: "Buena Vista",
    profile: {
      baseAbility: 82,
      peakAbility: 84,
      note: "牝马经典与古马王道长期一线。"
    },
    races: [
      { raceId: "hanshin-juvenile-fillies", year: 2008, ability: 81, jockeyId: "generic-local", finish: 1 },
      { raceId: "tulip-sho", year: 2009, ability: 81, jockeyId: "generic-local", finish: 1 },
      { raceId: "oka-sho", year: 2009, ability: 82, jockeyId: "generic-local", finish: 1 },
      { raceId: "yushun-himba", year: 2009, ability: 83, jockeyId: "generic-local", finish: 1 },
      { raceId: "kyoto-kinen", year: 2010, ability: 82, jockeyId: "kazuo-yokoyama", finish: 1 },
      { raceId: "victoria-mile", year: 2010, ability: 83, jockeyId: "kazuo-yokoyama", finish: 1 },
      { raceId: "tenno-sho-aki", year: 2010, ability: 84, jockeyId: "generic-local", finish: 1 },
      { raceId: "japan-cup", year: 2011, ability: 84, jockeyId: "generic-local", finish: 1 }
    ]
  });
})();
