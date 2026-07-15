(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    id: "delta-blues",
    name: "デルタブルース",
    displayName: "密州怨曲",
    displayNameZh: "密州怨曲",
    displayNameEn: "Delta Blues",
    profile: {
      baseAbility: 80,
      peakAbility: 82,
      note: "2004 年菊花赏与 2006 年墨尔本杯胜马。"
    },
    races: [
      { raceId: "kikka-sho", year: 2004, ability: 81, jockeyId: "yasunari-iwata", finish: 1 },
      { raceId: "stayers-stakes", year: 2005, ability: 80, jockeyId: "olivier-peslier", finish: 1 },
      { raceId: "melbourne-cup", year: 2006, ability: 82, jockeyId: "yasunari-iwata", finish: 1 }
    ]
  });
})();
