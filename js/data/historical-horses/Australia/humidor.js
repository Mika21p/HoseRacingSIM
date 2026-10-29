(function () {
  const ns = (window.Keiba = window.Keiba || {});
  ns.HistoricalHorseRegistry.register({
    id: "humidor", name: "Humidor", displayName: "雪茄盒", displayNameZh: "雪茄盒", displayNameEn: "Humidor",
    profile: { baseAbility: 83, peakAbility: 85, note: "澳洲一哩至中距离马，2017年澳洲杯与戴花锦标冠军。" },
    races: [
      { raceId: "makybe-diva-stakes", year: 2017, ability: 83, jockeyId: "damian-lane", finish: 1 },
      { raceId: "australian-cup", year: 2017, ability: 84, jockeyId: "damian-lane", finish: 1 }
    ]
  });
})();
