(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    id: "oguri-cap",
    name: "オグリキャップ",
    displayName: "Oguri Cap",
    profile: {
      baseAbility: 79,
      peakAbility: 81,
      note: "地方出身国民名马，英里到有马记念均有顶级表现。"
    },
    races: [
      { raceId: "mainichi-hai", year: 1988, ability: 78, jockeyId: "kawachi-hiroshi", finish: 1 },
      { raceId: "new-zealand-trophy", year: 1988, ability: 78, jockeyId: "kawachi-hiroshi", finish: 1 },
      { raceId: "takamatsunomiya-kinen", year: 1988, ability: 79, jockeyId: "kawachi-hiroshi", finish: 1 },
      { raceId: "mainichi-okan", year: 1988, ability: 79, jockeyId: "kawachi-hiroshi", finish: 1 },
      { raceId: "arima-kinen", year: 1988, ability: 81, jockeyId: "okabe-yukio", finish: 1 },
      { raceId: "sankei-sho-all-comers", year: 1989, ability: 79, jockeyId: "minai-katsumi", finish: 1 },
      { raceId: "mainichi-okan", year: 1989, ability: 79, jockeyId: "minai-katsumi", finish: 1 },
      { raceId: "mile-championship", year: 1989, ability: 81, jockeyId: "minai-katsumi", finish: 1 },
      { raceId: "yasuda-kinen", year: 1990, ability: 81, jockeyId: "take-yutaka", finish: 1 },
      { raceId: "arima-kinen", year: 1990, ability: 81, jockeyId: "take-yutaka", finish: 1 }
    ]
  });
})();
