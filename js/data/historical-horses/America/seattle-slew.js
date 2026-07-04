(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    id: "seattle-slew",
    name: "Seattle Slew",
    displayName: "西雅图回旋",
    displayNameZh: "西雅图回旋",
    displayNameEn: "Seattle Slew",
    profile: {
      baseAbility: 94,
      peakAbility: 96,
      note: "无败美国三冠马，速度与先行压制力兼备。"
    },
    races: [
      { raceId: "kentucky-derby", year: 1977, ability: 95, jockeyId: "jean-cruguet", finish: 1 },
      { raceId: "preakness-stakes", year: 1977, ability: 96, jockeyId: "jean-cruguet", finish: 1 },
      { raceId: "belmont-stakes", year: 1977, ability: 96, jockeyId: "jean-cruguet", finish: 1 }
    ]
  });
})();
