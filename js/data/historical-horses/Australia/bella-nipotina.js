(function () {
  const ns = (window.Keiba = window.Keiba || {});
  ns.HistoricalHorseRegistry.register({
    id: "bella-nipotina", name: "Bella Nipotina", displayName: "美孙女", displayNameZh: "美孙女", displayNameEn: "Bella Nipotina",
    profile: { sex: "female", baseAbility: 83, peakAbility: 85, note: "澳洲短途雌马，2022年马纳卡图锦标及2024年珠穆朗玛峰赛冠军。" },
    races: [
      { raceId: "manikato-stakes", year: 2022, ability: 85, jockeyId: "craig-williams", finish: 1 },
      { raceId: "the-everest", year: 2024, ability: 85, jockeyId: "craig-williams", finish: 1 }
    ],
    legendEligibilityWins: [
      { raceName: "Doomben 10,000", year: 2024, surfaceRegion: "澳洲", surface: "草地", distance: 1200, jockeyId: "craig-williams" }
    ]
  });
})();
