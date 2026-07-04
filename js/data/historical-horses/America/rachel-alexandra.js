(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    id: "rachel-alexandra",
    name: "Rachel Alexandra",
    displayName: "历山小姐",
    displayNameZh: "历山小姐",
    displayNameEn: "Rachel Alexandra",
    profile: {
      baseAbility: 84,
      peakAbility: 86,
      note: "美国三岁雌马代表，橡树、必利是与Haskell路线含金量高。"
    },
    races: [
      { raceId: "kentucky-oaks", year: 2009, ability: 85, jockeyId: "calvin-borel", finish: 1 },
      { raceId: "preakness-stakes", year: 2009, ability: 86, jockeyId: "calvin-borel", finish: 1 },
      { raceId: "haskell-stakes", year: 2009, ability: 86, jockeyId: "calvin-borel", finish: 1 }
    ]
  });
})();
