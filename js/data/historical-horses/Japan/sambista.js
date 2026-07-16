(function () {
  const ns = (window.Keiba = window.Keiba || {});
  ns.HistoricalHorseRegistry.register({
    id: "sambista", name: "Sambista", displayName: "森巴舞后", displayNameZh: "森巴舞后", displayNameEn: "Sambista",
    profile: { sex: "female", baseAbility: 81, peakAbility: 83, note: "2014年JBC雌马经典赛、2015年冠军杯冠军。" },
    races: [
      { raceId: "jbc-ladies-classic", year: 2014, ability: 83, jockeyId: "yasunari-iwata", finish: 1 },
      { raceId: "champions-cup", year: 2015, ability: 83, jockeyId: "mirco-demuro", finish: 1 }
    ]
  });
})();
