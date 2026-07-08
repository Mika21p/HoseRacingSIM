(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    id: "tamamo-cross",
    name: "タマモクロス",
    displayName: "玉藻十字",
    displayNameZh: "玉藻十字",
    displayNameEn: "Tamamo Cross",
    profile: {
      baseAbility: 79,
      peakAbility: 81,
      note: "1988 年度代表马，春秋天皇赏与宝冢纪念胜马。"
    },
    races: [
      { raceId: "naruo-kinen", year: 1987, ability: 79, jockeyId: "minai-katsumi", finish: 1 },
      { raceId: "nakayama-kimpai", year: 1988, ability: 79, jockeyId: "minai-katsumi", finish: 1 },
      { raceId: "hanshin-daishoten", year: 1988, ability: 80, jockeyId: "minai-katsumi", finish: 1 },
      { raceId: "tenno-sho-haru", year: 1988, ability: 81, jockeyId: "minai-katsumi", finish: 1 },
      { raceId: "takarazuka-kinen", year: 1988, ability: 81, jockeyId: "minai-katsumi", finish: 1 },
      { raceId: "tenno-sho-aki", year: 1988, ability: 81, jockeyId: "minai-katsumi", finish: 1 }
    ]
  });
})();
