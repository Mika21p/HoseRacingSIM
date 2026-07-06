(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    id: "narita-brian",
    name: "ナリタブライアン",
    displayName: "成田白仁",
    displayNameZh: "成田白仁",
    displayNameEn: "Narita Brian",
    profile: {
      baseAbility: 81,
      peakAbility: 83,
      note: "90年代三冠马，经典三冠与有马记念代表。"
    },
    races: [
      { raceId: "asahi-hai-fs", year: 1993, ability: 81, jockeyId: "minai-katsumi", finish: 1 },
      { raceId: "tokinominoru-kinen", year: 1994, ability: 81, jockeyId: "minai-katsumi", finish: 1 },
      { raceId: "spring-stakes", year: 1994, ability: 81, jockeyId: "minai-katsumi", finish: 1 },
      { raceId: "satsuki-sho", year: 1994, ability: 82, jockeyId: "minai-katsumi", finish: 1 },
      { raceId: "tokyo-yushun", year: 1994, ability: 83, jockeyId: "minai-katsumi", finish: 1 },
      { raceId: "kikka-sho", year: 1994, ability: 83, jockeyId: "minai-katsumi", finish: 1 },
      { raceId: "arima-kinen", year: 1994, ability: 83, jockeyId: "minai-katsumi", finish: 1 },
      { raceId: "hanshin-daishoten", year: 1995, ability: 81, jockeyId: "minai-katsumi", finish: 1 },
      { raceId: "hanshin-daishoten", year: 1996, ability: 81, jockeyId: "take-yutaka", finish: 1 }
    ]
  });
})();
