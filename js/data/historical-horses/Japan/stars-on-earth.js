(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    id: "stars-on-earth",
    name: "スターズオンアース",
    displayName: "星映天下",
    displayNameZh: "星映天下",
    displayNameEn: "Stars on Earth",
    profile: {
      baseAbility: 82,
      peakAbility: 84,
      note: "2022 年樱花赏与优骏牝马双冠马。"
    },
    races: [
      { raceId: "oka-sho", year: 2022, ability: 83, jockeyId: "yuga-kawada", finish: 1 },
      { raceId: "yushun-himba", year: 2022, ability: 84, jockeyId: "christophe-lemaire", finish: 1 }
    ]
  });
})();
