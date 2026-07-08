(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    id: "believe",
    name: "ビリーヴ",
    displayName: "信念",
    displayNameZh: "信念",
    displayNameEn: "Believe",
    profile: {
      baseAbility: 78,
      peakAbility: 80,
      note: "短途 G1 两胜牝马，2002 短途马锦标与 2003 高松宫纪念胜马。"
    },
    races: [
      { raceId: "centaur-stakes", year: 2002, ability: 78, jockeyId: "yasunari-iwata", finish: 1 },
      { raceId: "sprinters-stakes", year: 2002, ability: 80, jockeyId: "yasunari-iwata", finish: 1 },
      { raceId: "takamatsunomiya-kinen", year: 2003, ability: 80, jockeyId: "katsumi-ando", finish: 1 },
      { raceId: "hakodate-sprint-stakes", year: 2003, ability: 78, jockeyId: "katsumi-ando", finish: 1 }
    ]
  });
})();
