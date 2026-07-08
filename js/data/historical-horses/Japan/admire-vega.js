(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    id: "admire-vega",
    name: "アドマイヤベガ",
    displayName: "爱慕织姬",
    displayNameZh: "爱慕织姬",
    displayNameEn: "Admire Vega",
    profile: {
      baseAbility: 79,
      peakAbility: 81,
      note: "1999 年日本德比马，秋季再胜京都新闻杯。"
    },
    races: [
      { raceId: "tokyo-yushun", year: 1999, ability: 81, jockeyId: "take-yutaka", finish: 1 },
      { raceId: "kyoto-shimbun-hai", year: 1999, ability: 79, jockeyId: "take-yutaka", finish: 1 }
    ]
  });
})();
