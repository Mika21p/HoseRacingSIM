(function () {
  const ns = (window.Keiba = window.Keiba || {});
  ns.HistoricalHorseRegistry.register({
    id: "white-fugue", name: "White Fugue", displayName: "白色赋格", displayNameZh: "白色赋格", displayNameEn: "White Fugue",
    profile: { sex: "female", baseAbility: 78, peakAbility: 80, note: "2015、2016年JBC雌马经典赛连霸。" },
    races: [
      { raceId: "jbc-ladies-classic", year: 2015, ability: 80, jockeyId: "takuya-ono", finish: 1 },
      { raceId: "jbc-ladies-classic", year: 2016, ability: 80, jockeyId: "masayoshi-ebina", finish: 1 }
    ]
  });
})();
