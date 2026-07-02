(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    id: "daiwa-scarlet",
    name: "ダイワスカーレット",
    displayName: "Daiwa Scarlet",
    profile: {
      baseAbility: 82,
      peakAbility: 83,
      note: "高稳定牝马强豪，牝马经典与有马记念代表。"
    },
    races: [
      { raceId: "oka-sho", year: 2007, ability: 82, jockeyId: "generic-local", finish: 1 },
      { raceId: "rose-stakes", year: 2007, ability: 82, jockeyId: "generic-local", finish: 1 },
      { raceId: "shuka-sho", year: 2007, ability: 83, jockeyId: "generic-local", finish: 1 },
      { raceId: "queen-elizabeth-ii-cup", year: 2007, ability: 83, jockeyId: "generic-local", finish: 1 },
      { raceId: "osaka-hai", year: 2008, ability: 82, jockeyId: "generic-local", finish: 1 },
      { raceId: "arima-kinen", year: 2008, ability: 83, jockeyId: "generic-local", finish: 1 }
    ]
  });
})();
