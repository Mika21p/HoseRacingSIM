(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    id: "taiki-shuttle",
    name: "タイキシャトル",
    displayName: "Taiki Shuttle",
    profile: {
      baseAbility: 84,
      peakAbility: 86,
      note: "一哩短途海外G1级别名马。"
    },
    races: [
      { raceId: "unicorn-stakes", year: 1997, ability: 82, jockeyId: "okabe-yukio", finish: 1 },
      { raceId: "swan-stakes", year: 1997, ability: 83, jockeyId: "norihiro-yokoyama", finish: 1 },
      { raceId: "sprinters-stakes", year: 1997, ability: 85, jockeyId: "okabe-yukio", finish: 1 },
      { raceId: "mile-championship", year: 1997, ability: 85, jockeyId: "norihiro-yokoyama", finish: 1 },
      { raceId: "keio-hai-spring-cup", year: 1998, ability: 84, jockeyId: "okabe-yukio", finish: 1 },
      { raceId: "yasuda-kinen", year: 1998, ability: 86, jockeyId: "okabe-yukio", finish: 1 },
      { raceId: "prix-jacques-le-marois", year: 1998, ability: 86, jockeyId: "okabe-yukio", finish: 1 },
      { raceId: "mile-championship", year: 1998, ability: 86, jockeyId: "okabe-yukio", finish: 1 }
    ]
  });
})();
