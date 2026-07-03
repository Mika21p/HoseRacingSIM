(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    id: "gold-dream",
    name: "ゴールドドリーム",
    displayName: "Gold Dream",
    profile: {
      baseAbility: 81,
      peakAbility: 82,
      note: "中央泥地G1与地方交流多胜，1600至2000米泥地稳定。"
    },
    races: [
      { raceId: "unicorn-stakes", year: 2016, ability: 80, jockeyId: "yuga-kawada", finish: 1 },
      { raceId: "february-stakes", year: 2017, ability: 82, jockeyId: "mirco-demuro", finish: 1 },
      { raceId: "champions-cup", year: 2017, ability: 82, jockeyId: "ryan-moore", finish: 1 },
      { raceId: "kashiwa-kinen", year: 2018, ability: 82, jockeyId: "christophe-lemaire", finish: 1 },
      { raceId: "teio-sho", year: 2018, ability: 82, jockeyId: "christophe-lemaire", finish: 1 },
      { raceId: "kashiwa-kinen", year: 2019, ability: 81, jockeyId: "christophe-lemaire", finish: 1 }
    ]
  });
})();
