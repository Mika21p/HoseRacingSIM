(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    id: "agnes-tachyon",
    name: "アグネスタキオン",
    displayName: "爱丽速子",
    displayNameZh: "爱丽速子",
    displayNameEn: "Agnes Tachyon",
    profile: {
      baseAbility: 80,
      peakAbility: 83,
      note: "四战全胜的皋月赏马，退役后亦成为日本冠军种牡马。"
    },
    races: [
      { raceId: "yayoi-sho", year: 2001, ability: 82, jockeyId: "kawachi-hiroshi", finish: 1 },
      { raceId: "satsuki-sho", year: 2001, ability: 83, jockeyId: "kawachi-hiroshi", finish: 1 }
    ]
  });
})();
