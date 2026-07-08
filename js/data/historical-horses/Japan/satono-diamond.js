(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    id: "satono-diamond",
    name: "サトノダイヤモンド",
    displayName: "里见光钻",
    displayNameZh: "里见光钻",
    displayNameEn: "Satono Diamond",
    profile: {
      baseAbility: 81,
      peakAbility: 83,
      note: "2016 年菊花赏与有马纪念胜马，三岁世代代表。"
    },
    races: [
      { raceId: "kisaragi-sho", year: 2016, ability: 81, jockeyId: "christophe-lemaire", finish: 1 },
      { raceId: "kobe-shimbun-hai", year: 2016, ability: 82, jockeyId: "christophe-lemaire", finish: 1 },
      { raceId: "kikka-sho", year: 2016, ability: 83, jockeyId: "christophe-lemaire", finish: 1 },
      { raceId: "arima-kinen", year: 2016, ability: 83, jockeyId: "christophe-lemaire", finish: 1 },
      { raceId: "hanshin-daishoten", year: 2017, ability: 82, jockeyId: "christophe-lemaire", finish: 1 },
      { raceId: "kyoto-daishoten", year: 2018, ability: 81, jockeyId: "yuga-kawada", finish: 1 }
    ]
  });
})();
