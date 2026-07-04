(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    id: "kurofune",
    name: "クロフネ",
    displayName: "黑船",
    displayNameZh: "黑船",
    displayNameEn: "Kurofune",
    profile: {
      baseAbility: 81,
      peakAbility: 83,
      note: "草泥双G1级名马，泥地表现极具冲击力。"
    },
    races: [
      { raceId: "mainichi-hai", year: 2001, ability: 81, jockeyId: "hirofumi-shii", finish: 1 },
      { raceId: "nhk-mile-cup", year: 2001, ability: 82, jockeyId: "take-yutaka", finish: 1 },
      { raceId: "musashino-stakes", year: 2001, ability: 83, jockeyId: "take-yutaka", finish: 1 },
      { raceId: "champions-cup", year: 2001, ability: 83, jockeyId: "take-yutaka", finish: 1 }
    ]
  });
})();
