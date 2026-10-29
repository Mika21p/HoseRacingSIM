(function () {
  const ns = (window.Keiba = window.Keiba || {});
  ns.HistoricalHorseRegistry.register({
    id: "preferment", name: "Preferment", displayName: "晋升", displayNameZh: "晋升", displayNameEn: "Preferment",
    profile: { baseAbility: 85, peakAbility: 87, note: "澳洲中长距离名马，2016年澳洲杯冠军。" },
    races: [
      { raceId: "australian-cup", year: 2016, ability: 85, jockeyId: "hugh-bowman", finish: 1 }
    ]
  });
})();
