(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    id: "ka-ying-rising",
    name: "Ka Ying Rising",
    displayName: "嘉应高升",
    displayNameZh: "嘉应高升",
    displayNameEn: "Ka Ying Rising",
    profile: {
      baseAbility: 89,
      peakAbility: 92,
      note: "嘉应高升为近期香港短途代表，刷新沙田短途与千四表现标尺。"
    },
    races: [
      { raceId: "hong-kong-sprint", year: 2024, ability: 90, jockeyId: "zac-purton", finish: 1 },
      { raceId: "centenary-sprint-cup", year: 2025, ability: 90, jockeyId: "zac-purton", finish: 1 },
      { raceId: "queens-silver-jubilee-cup", year: 2025, ability: 91, jockeyId: "karis-teetan", finish: 1 },
      { raceId: "chairmans-sprint-prize", year: 2025, ability: 91, jockeyId: "zac-purton", finish: 1 },
      { raceId: "the-everest", year: 2025, ability: 92, jockeyId: "zac-purton", finish: 1 },
      { raceId: "hong-kong-sprint", year: 2025, ability: 92, jockeyId: "zac-purton", finish: 1 },
      { raceId: "centenary-sprint-cup", year: 2026, ability: 91, jockeyId: "zac-purton", finish: 1 },
      { raceId: "queens-silver-jubilee-cup", year: 2026, ability: 92, jockeyId: "zac-purton", finish: 1 },
      { raceId: "chairmans-sprint-prize", year: 2026, ability: 92, jockeyId: "zac-purton", finish: 1 }
    ]
  });
})();
