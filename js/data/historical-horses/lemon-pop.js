(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    id: "lemon-pop",
    name: "レモンポップ",
    displayName: "Lemon Pop",
    profile: {
      baseAbility: 79,
      peakAbility: 80,
      note: "日本泥地一哩至中距离冠军，中央与地方G1/JpnI多胜。"
    },
    races: [
      { raceId: "negishi-stakes", year: 2023, ability: 78, jockeyId: "keita-tosaki", finish: 1 },
      { raceId: "february-stakes", year: 2023, ability: 79, jockeyId: "ryusei-sakai", finish: 1 },
      { raceId: "mile-championship-nambu-hai", year: 2023, ability: 80, jockeyId: "ryusei-sakai", finish: 1 },
      { raceId: "champions-cup", year: 2023, ability: 80, jockeyId: "ryusei-sakai", finish: 1, trackCondition: "良" },
      { raceId: "sakitama-hai", year: 2024, ability: 80, jockeyId: "ryusei-sakai", finish: 1 },
      { raceId: "mile-championship-nambu-hai", year: 2024, ability: 80, jockeyId: "ryusei-sakai", finish: 1 },
      { raceId: "champions-cup", year: 2024, ability: 80, jockeyId: "ryusei-sakai", finish: 1 }
    ]
  });
})();
