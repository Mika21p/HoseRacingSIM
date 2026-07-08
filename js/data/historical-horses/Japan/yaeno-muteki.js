(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    id: "yaeno-muteki",
    name: "ヤエノムテキ",
    displayName: "八重无敌",
    displayNameZh: "八重无敌",
    displayNameEn: "Yaeno Muteki",
    profile: {
      baseAbility: 79,
      peakAbility: 81,
      note: "1988 年皋月赏与 1990 年天皇赏秋胜马。"
    },
    races: [
      { raceId: "satsuki-sho", year: 1988, ability: 81, jockeyId: "katsuichi-nishiura", finish: 1 },
      { raceId: "kyoto-shimbun-hai", year: 1988, ability: 79, jockeyId: "katsuichi-nishiura", finish: 1 },
      { raceId: "naruo-kinen", year: 1988, ability: 79, jockeyId: "katsuichi-nishiura", finish: 1 },
      { raceId: "osaka-hai", year: 1989, ability: 79, jockeyId: "katsuichi-nishiura", finish: 1 },
      { raceId: "tenno-sho-aki", year: 1990, ability: 81, jockeyId: "okabe-yukio", finish: 1 }
    ]
  });
})();
