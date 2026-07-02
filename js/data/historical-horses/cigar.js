(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    id: "cigar",
    name: "Cigar",
    displayName: "Cigar",
    profile: {
      baseAbility: 86,
      peakAbility: 88,
      note: "美国古马泥地王者，连胜与国际远征表现兼具。"
    },
    races: [
      { raceId: "breeders-cup-classic", year: 1995, ability: 88, jockeyId: "jerry-bailey", finish: 1 },
      { raceId: "dubai-world-cup", year: 1996, ability: 88, jockeyId: "jerry-bailey", finish: 1 }
    ]
  });
})();
