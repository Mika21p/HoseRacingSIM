(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    id: "goldikova",
    name: "Goldikova",
    displayName: "Goldikova",
    profile: {
      baseAbility: 85,
      peakAbility: 87,
      note: "欧洲英里雌马代表，育马者杯一哩三连霸。"
    },
    races: [
      { raceId: "breeders-cup-mile", year: 2008, ability: 86, jockeyId: "olivier-peslier", finish: 1 },
      { raceId: "prix-jacques-le-marois", year: 2009, ability: 87, jockeyId: "olivier-peslier", finish: 1 },
      { raceId: "breeders-cup-mile", year: 2009, ability: 87, jockeyId: "olivier-peslier", finish: 1 },
      { raceId: "queen-anne-stakes", year: 2010, ability: 87, jockeyId: "olivier-peslier", finish: 1 },
      { raceId: "breeders-cup-mile", year: 2010, ability: 87, jockeyId: "olivier-peslier", finish: 1 }
    ]
  });
})();
