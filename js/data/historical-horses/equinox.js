(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    id: "equinox",
    name: "イクイノックス",
    displayName: "Equinox",
    profile: {
      baseAbility: 88,
      peakAbility: 90,
      note: "世界级名马，现代日本草地最高档标尺。"
    },
    races: [
      { raceId: "tokyo-sports-hai", year: 2021, ability: 87, jockeyId: "christophe-lemaire", finish: 1, trackCondition: "良" },
      { raceId: "tenno-sho-aki", year: 2022, ability: 88, jockeyId: "christophe-lemaire", finish: 1 },
      { raceId: "arima-kinen", year: 2022, ability: 89, jockeyId: "christophe-lemaire", finish: 1 },
      { raceId: "dubai-sheema-classic", year: 2023, ability: 90, jockeyId: "christophe-lemaire", finish: 1 },
      { raceId: "takarazuka-kinen", year: 2023, ability: 89, jockeyId: "christophe-lemaire", finish: 1 },
      { raceId: "tenno-sho-aki", year: 2023, ability: 90, jockeyId: "christophe-lemaire", finish: 1 },
      { raceId: "japan-cup", year: 2023, ability: 90, jockeyId: "christophe-lemaire", finish: 1 }
    ]
  });
})();
