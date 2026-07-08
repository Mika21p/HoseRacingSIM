(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    id: "narita-taishin",
    name: "ナリタタイシン",
    displayName: "成田大进",
    displayNameZh: "成田大进",
    displayNameEn: "Narita Taishin",
    profile: {
      baseAbility: 78,
      peakAbility: 80,
      note: "BNW 三强之一，1993 年皋月赏胜马。"
    },
    races: [
      { raceId: "satsuki-sho", year: 1993, ability: 80, jockeyId: "take-yutaka", finish: 1 },
      { raceId: "meguro-kinen", year: 1994, ability: 78, jockeyId: "take-yutaka", finish: 1 }
    ]
  });
})();
