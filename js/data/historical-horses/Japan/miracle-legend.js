(function () {
  const ns = (window.Keiba = window.Keiba || {});
  ns.HistoricalHorseRegistry.register({
    id: "miracle-legend", name: "Miracle Legend", displayName: "奇迹传说", displayNameZh: "奇迹传说", displayNameEn: "Miracle Legend",
    profile: { sex: "female", baseAbility: 78, peakAbility: 80, note: "2011、2012年JBC雌马经典赛连霸。" },
    races: [
      { raceId: "jbc-ladies-classic", year: 2011, ability: 80, jockeyId: "yasunari-iwata", finish: 1 },
      { raceId: "jbc-ladies-classic", year: 2012, ability: 80, jockeyId: "yasunari-iwata", finish: 1 }
    ]
  });
})();
