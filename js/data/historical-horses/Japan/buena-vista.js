(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    id: "buena-vista",
    name: "ブエナビスタ",
    displayName: "迷人景致",
    displayNameZh: "迷人景致",
    displayNameEn: "Buena Vista",
    profile: {
      baseAbility: 81,
      peakAbility: 83,
      note: "牝马经典与古马王道长期一线。"
    },
    races: [
      { raceId: "hanshin-juvenile-fillies", year: 2008, ability: 80, jockeyId: "katsumi-ando", finish: 1 },
      { raceId: "tulip-sho", year: 2009, ability: 80, jockeyId: "katsumi-ando", finish: 1 },
      { raceId: "oka-sho", year: 2009, ability: 81, jockeyId: "katsumi-ando", finish: 1 },
      { raceId: "yushun-himba", year: 2009, ability: 82, jockeyId: "katsumi-ando", finish: 1 },
      { raceId: "kyoto-kinen", year: 2010, ability: 81, jockeyId: "norihiro-yokoyama", finish: 1 },
      { raceId: "victoria-mile", year: 2010, ability: 82, jockeyId: "norihiro-yokoyama", finish: 1 },
      { raceId: "tenno-sho-aki", year: 2010, ability: 83, jockeyId: "christophe-soumillon", finish: 1 },
      { raceId: "japan-cup", year: 2011, ability: 83, jockeyId: "yasunari-iwata", finish: 1 }
    ]
  });
})();
