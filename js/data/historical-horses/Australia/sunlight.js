(function () {
  const ns = (window.Keiba = window.Keiba || {});
  ns.HistoricalHorseRegistry.register({
    id: "sunlight", name: "Sunlight", displayName: "日光", displayNameZh: "日光", displayNameEn: "Sunlight",
    profile: { sex: "female", baseAbility: 83, peakAbility: 85, note: "澳洲短途雌马，2019年新市场让赛与威廉列特锦标冠军。" },
    races: [
      { raceId: "newmarket-handicap", year: 2019, ability: 85, jockeyId: "barend-vorster", finish: 1 },
      { raceId: "william-reid-stakes", year: 2019, ability: 85, jockeyId: "luke-currie", finish: 1 }
    ]
  });
})();
