(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    id: "vodka",
    name: "ウオッカ",
    displayName: "Vodka",
    profile: {
      baseAbility: 81,
      peakAbility: 83,
      note: "牝马德比马，英里与东京中距离顶级表现。"
    },
    races: [
      { raceId: "hanshin-juvenile-fillies", year: 2006, ability: 79, jockeyId: "hirofumi-shii", finish: 1 },
      { raceId: "tulip-sho", year: 2007, ability: 80, jockeyId: "hirofumi-shii", finish: 1 },
      { raceId: "tokyo-yushun", year: 2007, ability: 83, jockeyId: "hirofumi-shii", finish: 1 },
      { raceId: "yasuda-kinen", year: 2008, ability: 83, jockeyId: "take-yutaka", finish: 1 },
      { raceId: "tenno-sho-aki", year: 2008, ability: 83, jockeyId: "take-yutaka", finish: 1 },
      { raceId: "victoria-mile", year: 2009, ability: 82, jockeyId: "take-yutaka", finish: 1 },
      { raceId: "yasuda-kinen", year: 2009, ability: 83, jockeyId: "take-yutaka", finish: 1 },
      { raceId: "japan-cup", year: 2009, ability: 83, jockeyId: "christophe-lemaire", finish: 1 }
    ]
  });
})();
