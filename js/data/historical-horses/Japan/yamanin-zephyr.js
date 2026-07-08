(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    id: "yamanin-zephyr",
    name: "ヤマニンゼファー",
    displayName: "也文摄辉",
    displayNameZh: "也文摄辉",
    displayNameEn: "Yamanin Zephyr",
    profile: {
      baseAbility: 80,
      peakAbility: 82,
      note: "短哩至中距离兼备，安田纪念连霸并胜天皇赏秋。"
    },
    races: [
      { raceId: "yasuda-kinen", year: 1992, ability: 82, jockeyId: "katsuharu-tanaka", finish: 1 },
      { raceId: "keio-hai-spring-cup", year: 1993, ability: 80, jockeyId: "katsuharu-tanaka", finish: 1 },
      { raceId: "yasuda-kinen", year: 1993, ability: 82, jockeyId: "yoshitomi-shibata", finish: 1 },
      { raceId: "tenno-sho-aki", year: 1993, ability: 82, jockeyId: "shibata-masato", finish: 1 }
    ]
  });
})();
