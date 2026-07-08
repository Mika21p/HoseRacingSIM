(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    id: "winning-ticket",
    name: "ウイニングチケット",
    displayName: "胜利奖券",
    displayNameZh: "胜利奖券",
    displayNameEn: "Winning Ticket",
    profile: {
      baseAbility: 79,
      peakAbility: 81,
      note: "BNW 世代日本德比马，柴田政人首次德比制霸的搭档。"
    },
    races: [
      { raceId: "yayoi-sho", year: 1993, ability: 79, jockeyId: "shibata-masato", finish: 1 },
      { raceId: "tokyo-yushun", year: 1993, ability: 81, jockeyId: "shibata-masato", finish: 1 },
      { raceId: "kyoto-shimbun-hai", year: 1993, ability: 80, jockeyId: "shibata-masato", finish: 1 }
    ]
  });
})();
