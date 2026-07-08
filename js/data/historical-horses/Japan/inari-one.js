(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    id: "inari-one",
    name: "イナリワン",
    displayName: "稻荷一",
    displayNameZh: "稻荷一",
    displayNameEn: "Inari One",
    profile: {
      baseAbility: 78,
      peakAbility: 80,
      note: "地方转中央后夺春天皇赏、宝冢纪念与有马纪念的 1989 年度代表马。"
    },
    races: [
      { raceId: "tokyo-daishoten", year: 1988, ability: 79, jockeyId: "masayuki-miyaura", finish: 1 },
      { raceId: "tenno-sho-haru", year: 1989, ability: 80, jockeyId: "take-yutaka", finish: 1 },
      { raceId: "takarazuka-kinen", year: 1989, ability: 80, jockeyId: "take-yutaka", finish: 1 },
      { raceId: "arima-kinen", year: 1989, ability: 80, jockeyId: "shibata-masato", finish: 1 }
    ]
  });
})();
