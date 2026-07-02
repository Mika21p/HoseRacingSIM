(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    id: "seattle-slew",
    name: "Seattle Slew",
    displayName: "Seattle Slew",
    profile: {
      baseAbility: 86,
      peakAbility: 88,
      note: "无败美国三冠马，速度与先行压制力兼备。"
    },
    races: [
      { raceId: "kentucky-derby", year: 1977, ability: 87, jockeyId: "jean-cruguet", finish: 1 },
      { raceId: "preakness-stakes", year: 1977, ability: 88, jockeyId: "jean-cruguet", finish: 1 },
      { raceId: "belmont-stakes", year: 1977, ability: 88, jockeyId: "jean-cruguet", finish: 1 }
    ]
  });
})();
