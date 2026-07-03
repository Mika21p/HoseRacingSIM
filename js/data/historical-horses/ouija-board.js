(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    id: "ouija-board",
    name: "Ouija Board",
    displayName: "Ouija Board",
    profile: {
      baseAbility: 81,
      peakAbility: 84,
      note: "英国雌马国际远征代表，欧洲、美国与香港均有G1胜利。"
    },
    races: [
      { raceId: "epsom-oaks", year: 2004, ability: 83, jockeyId: "kieren-fallon", finish: 1 },
      { raceId: "breeders-cup-filly-mare-turf", year: 2004, ability: 84, jockeyId: "kieren-fallon", finish: 1 },
      { raceId: "hong-kong-vase", year: 2005, ability: 83, jockeyId: "kieren-fallon", finish: 1 },
      { raceId: "prince-of-wales-stakes", year: 2006, ability: 84, jockeyId: "olivier-peslier", finish: 1 },
      { raceId: "breeders-cup-filly-mare-turf", year: 2006, ability: 84, jockeyId: "frankie-dettori", finish: 1 }
    ]
  });
})();
