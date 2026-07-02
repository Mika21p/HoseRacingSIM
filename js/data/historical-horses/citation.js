(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    id: "citation",
    name: "Citation",
    displayName: "Citation",
    profile: {
      baseAbility: 87,
      peakAbility: 89,
      note: "美国三冠与长连胜时代代表，稳定性和赛程适应极强。"
    },
    races: [
      { raceId: "kentucky-derby", year: 1948, ability: 88, jockeyId: "eddie-arcaro", finish: 1 },
      { raceId: "preakness-stakes", year: 1948, ability: 88, jockeyId: "eddie-arcaro", finish: 1 },
      { raceId: "belmont-stakes", year: 1948, ability: 89, jockeyId: "eddie-arcaro", finish: 1 }
    ]
  });
})();
