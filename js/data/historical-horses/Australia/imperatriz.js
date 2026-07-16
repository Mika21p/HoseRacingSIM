(function () {
  const ns = (window.Keiba = window.Keiba || {});
  ns.HistoricalHorseRegistry.register({
    id: "imperatriz", name: "Imperatriz", displayName: "重心城", displayNameZh: "重心城", displayNameEn: "Imperatriz",
    profile: { sex: "female", baseAbility: 85, peakAbility: 87, note: "澳洲短途雌马，2023年莫尔锦标与马纳卡图锦标冠军。" },
    races: [
      { raceId: "aj-moir-stakes", year: 2023, ability: 86, jockeyId: "opie-bosson", finish: 1 },
      { raceId: "manikato-stakes", year: 2023, ability: 87, jockeyId: "opie-bosson", finish: 1 },
      { raceId: "black-caviar-lightning", year: 2024, ability: 87, jockeyId: "opie-bosson", finish: 1 },
      { raceId: "william-reid-stakes", year: 2024, ability: 87, jockeyId: "opie-bosson", finish: 1 }
    ]
  });
})();
