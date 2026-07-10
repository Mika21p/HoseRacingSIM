(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    id: "soul-rush",
    name: "ソウルラッシュ",
    displayName: "魂冲",
    displayNameZh: "魂冲",
    displayNameEn: "Soul Rush",
    profile: {
      baseAbility: 81,
      peakAbility: 84,
      note: "日本一哩强豪，2024 年一哩冠军赛与 2025 年迪拜草地大赛胜马。"
    },
    races: [
      { raceId: "yomiuri-milers-cup", year: 2022, ability: 81, jockeyId: "suguru-hamanaka", finish: 1 },
      { raceId: "keisei-hai-autumn-handicap", year: 2023, ability: 81, jockeyId: "kohei-matsuyama", finish: 1 },
      { raceId: "yomiuri-milers-cup", year: 2024, ability: 82, jockeyId: "taisei-danno", finish: 1 },
      { raceId: "mile-championship", year: 2024, ability: 83, jockeyId: "taisei-danno", finish: 1 },
      { raceId: "dubai-turf", year: 2025, ability: 84, jockeyId: "cristian-demuro", finish: 1 }
    ]
  });
})();
