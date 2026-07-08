(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    id: "jungle-pocket",
    name: "ジャングルポケット",
    displayName: "森林宝穴",
    displayNameZh: "森林宝穴",
    displayNameEn: "Jungle Pocket",
    profile: {
      baseAbility: 82,
      peakAbility: 84,
      note: "日本德比与日本杯胜马，东京赛场表现突出的中距离名马。"
    },
    races: [
      { raceId: "sapporo-nisai-stakes", year: 2000, ability: 82, jockeyId: "koichi-tsunoda", finish: 1 },
      { raceId: "tokyo-sports-hai", year: 2000, ability: 82, jockeyId: "koichi-tsunoda", finish: 1 },
      { raceId: "tokyo-yushun", year: 2001, ability: 84, jockeyId: "koichi-tsunoda", finish: 1 },
      { raceId: "japan-cup", year: 2001, ability: 84, jockeyId: "olivier-peslier", finish: 1 }
    ]
  });
})();
