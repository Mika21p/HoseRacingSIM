(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    id: "sakura-chiyono-o",
    name: "サクラチヨノオー",
    displayName: "樱花千代王",
    displayNameZh: "樱花千代王",
    displayNameEn: "Sakura Chiyono O",
    profile: {
      baseAbility: 78,
      peakAbility: 80,
      note: "丸善斯基子嗣，昭和最后的日本德比马。"
    },
    races: [
      { raceId: "asahi-hai-fs", year: 1987, ability: 79, jockeyId: "futoshi-kojima", finish: 1 },
      { raceId: "yayoi-sho", year: 1988, ability: 78, jockeyId: "futoshi-kojima", finish: 1 },
      { raceId: "tokyo-yushun", year: 1988, ability: 80, jockeyId: "futoshi-kojima", finish: 1 }
    ]
  });
})();
