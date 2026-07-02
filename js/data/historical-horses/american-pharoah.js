(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    id: "american-pharoah",
    name: "American Pharoah",
    displayName: "American Pharoah",
    profile: {
      baseAbility: 87,
      peakAbility: 88,
      note: "现代美国三冠与育马者杯经典赛同年制霸的Grand Slam代表。"
    },
    races: [
      { raceId: "kentucky-derby", year: 2015, ability: 87, jockeyId: "victor-espinoza", finish: 1 },
      { raceId: "preakness-stakes", year: 2015, ability: 88, jockeyId: "victor-espinoza", finish: 1 },
      { raceId: "belmont-stakes", year: 2015, ability: 88, jockeyId: "victor-espinoza", finish: 1 },
      { raceId: "haskell-stakes", year: 2015, ability: 87, jockeyId: "victor-espinoza", finish: 1 },
      { raceId: "breeders-cup-classic", year: 2015, ability: 88, jockeyId: "victor-espinoza", finish: 1 }
    ]
  });
})();
