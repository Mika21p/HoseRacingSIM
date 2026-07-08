(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    id: "espoir-city",
    name: "エスポワールシチー",
    displayName: "希望之城",
    displayNameZh: "希望之城",
    displayNameEn: "Espoir City",
    profile: {
      baseAbility: 78,
      peakAbility: 80,
      note: "日本泥地强马，两届最佳泥地马，中央与地方 G1/Jpn1 多胜。"
    },
    races: [
      { raceId: "march-stakes", year: 2009, ability: 78, jockeyId: "masami-matsuoka", finish: 1 },
      { raceId: "kashiwa-kinen", year: 2009, ability: 80, jockeyId: "tetsuzo-sato", finish: 1 },
      { raceId: "mile-championship-nambu-hai", year: 2009, ability: 80, jockeyId: "tetsuzo-sato", finish: 1 },
      { raceId: "champions-cup", year: 2009, ability: 80, jockeyId: "tetsuzo-sato", finish: 1 },
      { raceId: "february-stakes", year: 2010, ability: 80, jockeyId: "tetsuzo-sato", finish: 1 },
      { raceId: "kashiwa-kinen", year: 2010, ability: 80, jockeyId: "tetsuzo-sato", finish: 1 },
      { raceId: "nagoya-daishoten", year: 2011, ability: 78, jockeyId: "tetsuzo-sato", finish: 1 },
      { raceId: "miyako-stakes", year: 2011, ability: 78, jockeyId: "tetsuzo-sato", finish: 1 },
      { raceId: "kashiwa-kinen", year: 2012, ability: 80, jockeyId: "tetsuzo-sato", finish: 1 },
      { raceId: "mile-championship-nambu-hai", year: 2012, ability: 80, jockeyId: "tetsuzo-sato", finish: 1 },
      { raceId: "mile-championship-nambu-hai", year: 2013, ability: 80, jockeyId: "hiroki-goto", finish: 1 },
      { raceId: "jbc-sprint", year: 2013, ability: 80, jockeyId: "hiroki-goto", finish: 1 }
    ]
  });
})();
