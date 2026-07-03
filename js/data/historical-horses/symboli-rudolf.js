(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    id: "symboli-rudolf",
    name: "シンボリルドルフ",
    displayName: "Symboli Rudolf",
    profile: {
      baseAbility: 79,
      peakAbility: 81,
      note: "早期日本草地G1顶尖，三冠与古马王道路线上限标尺。"
    },
    races: [
      { raceId: "yayoi-sho", year: 1984, ability: 79, jockeyId: "generic-local", finish: 1 },
      { raceId: "satsuki-sho", year: 1984, ability: 80, jockeyId: "generic-local", finish: 1 },
      { raceId: "tokyo-yushun", year: 1984, ability: 81, jockeyId: "generic-local", finish: 1 },
      { raceId: "st-lite-kinen", year: 1984, ability: 80, jockeyId: "generic-local", finish: 1 },
      { raceId: "kikka-sho", year: 1984, ability: 81, jockeyId: "generic-local", finish: 1 },
      { raceId: "arima-kinen", year: 1984, ability: 81, jockeyId: "generic-local", finish: 1 },
      { raceId: "nikkei-sho", year: 1985, ability: 81, jockeyId: "generic-local", finish: 1 },
      { raceId: "tenno-sho-haru", year: 1985, ability: 81, jockeyId: "generic-local", finish: 1 },
      { raceId: "japan-cup", year: 1985, ability: 81, jockeyId: "generic-local", finish: 1 },
      { raceId: "arima-kinen", year: 1985, ability: 81, jockeyId: "generic-local", finish: 1 }
    ]
  });
})();
