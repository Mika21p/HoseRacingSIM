(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    id: "tokai-teio",
    name: "トウカイテイオー",
    displayName: "Tokai Teio",
    profile: {
      baseAbility: 80,
      peakAbility: 81,
      note: "德比、Japan Cup、有马记念的复活型名马。"
    },
    races: [
      { raceId: "satsuki-sho", year: 1991, ability: 80, jockeyId: "generic-local", finish: 1 },
      { raceId: "tokyo-yushun", year: 1991, ability: 81, jockeyId: "generic-local", finish: 1 },
      { raceId: "osaka-hai", year: 1992, ability: 80, jockeyId: "generic-local", finish: 1 },
      { raceId: "japan-cup", year: 1992, ability: 81, jockeyId: "generic-local", finish: 1 },
      { raceId: "arima-kinen", year: 1993, ability: 81, jockeyId: "generic-local", finish: 1 }
    ]
  });
})();
