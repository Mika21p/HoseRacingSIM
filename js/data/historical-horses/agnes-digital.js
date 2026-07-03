(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    id: "agnes-digital",
    name: "アグネスデジタル",
    displayName: "Agnes Digital",
    profile: {
      baseAbility: 80,
      peakAbility: 82,
      note: "草地、泥地、海外均有G1级胜利的万能型。"
    },
    races: [
      { raceId: "zen-nippon-nisai-yushun", year: 1999, ability: 78, jockeyId: "generic-local", finish: 1 },
      { raceId: "unicorn-stakes", year: 2000, ability: 78, jockeyId: "generic-local", finish: 1 },
      { raceId: "mile-championship", year: 2000, ability: 80, jockeyId: "generic-local", finish: 1 },
      { raceId: "nippon-tv-hai", year: 2001, ability: 80, jockeyId: "generic-local", finish: 1 },
      { raceId: "mile-championship-nambu-hai", year: 2001, ability: 81, jockeyId: "generic-local", finish: 1 },
      { raceId: "tenno-sho-aki", year: 2001, ability: 82, jockeyId: "generic-local", finish: 1 },
      { raceId: "hong-kong-cup", year: 2001, ability: 82, jockeyId: "generic-local", finish: 1 },
      { raceId: "february-stakes", year: 2002, ability: 82, jockeyId: "generic-local", finish: 1 },
      { raceId: "yasuda-kinen", year: 2003, ability: 82, jockeyId: "generic-local", finish: 1 }
    ]
  });
})();
