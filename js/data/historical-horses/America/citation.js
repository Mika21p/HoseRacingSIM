(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    id: "citation",
    name: "Citation",
    displayName: "例证",
    displayNameZh: "例证",
    displayNameEn: "Citation",
    profile: {
      baseAbility: 95,
      peakAbility: 97,
      note: "美国三冠与长连胜时代代表，稳定性和赛程适应极强。"
    },
    races: [
      { raceId: "kentucky-derby", year: 1948, ability: 96, jockeyId: "eddie-arcaro", finish: 1 },
      { raceId: "preakness-stakes", year: 1948, ability: 96, jockeyId: "eddie-arcaro", finish: 1 },
      { raceId: "belmont-stakes", year: 1948, ability: 97, jockeyId: "eddie-arcaro", finish: 1 }
    ]
  });
})();
