(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    id: "tiznow",
    name: "Tiznow",
    displayName: "Tiznow",
    profile: {
      baseAbility: 85,
      peakAbility: 88,
      note: "育马者杯经典赛连霸，硬仗对抗能力极强。"
    },
    races: [
      { raceId: "breeders-cup-classic", year: 2000, ability: 87, jockeyId: "chris-mccarron", finish: 1 },
      { raceId: "santa-anita-handicap", year: 2001, ability: 87, jockeyId: "chris-mccarron", finish: 1 },
      { raceId: "breeders-cup-classic", year: 2001, ability: 88, jockeyId: "chris-mccarron", finish: 1 }
    ]
  });
})();
