(function () {
  const ns = (window.Keiba = window.Keiba || {});
  ns.HistoricalHorseRegistry.register({
    id: "sunline", name: "Sunline", displayName: "日平线", displayNameZh: "日平线", displayNameEn: "Sunline",
    profile: { sex: "female", baseAbility: 91, peakAbility: 93, note: "横跨新西兰与澳洲的历史级雌马，两届觉士盾冠军。" },
    races: [
      { raceId: "cox-plate", year: 1999, ability: 92, jockeyId: "greg-childs", finish: 1 },
      { raceId: "manikato-stakes", year: 2000, ability: 92, jockeyId: "greg-childs", finish: 1 },
      { raceId: "cox-plate", year: 2000, ability: 93, jockeyId: "greg-childs", finish: 1 }
    ],
    legendEligibilityWins: [
      { raceName: "Doncaster Handicap", year: 1999, surfaceRegion: "澳洲", surface: "草地", distance: 1600, jockeyId: "larry-cassidy" }
    ]
  });
})();
