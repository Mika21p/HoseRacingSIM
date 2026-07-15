(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    id: "sakura-star-o",
    name: "サクラスターオー",
    displayName: "樱花星王",
    displayNameZh: "樱花星王",
    displayNameEn: "Sakura Star O",
    profile: {
      baseAbility: 80,
      peakAbility: 82,
      note: "1987 年皋月赏与菊花赏双冠马。"
    },
    races: [
      { raceId: "yayoi-sho", year: 1987, ability: 80, jockeyId: "azuma-shinji", finish: 1 },
      { raceId: "satsuki-sho", year: 1987, ability: 81, jockeyId: "azuma-shinji", finish: 1 },
      { raceId: "kikka-sho", year: 1987, ability: 82, jockeyId: "azuma-shinji", finish: 1 }
    ]
  });
})();
