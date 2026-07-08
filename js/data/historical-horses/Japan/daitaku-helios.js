(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    id: "daitaku-helios",
    name: "ダイタクヘリオス",
    displayName: "大拓太阳神",
    displayNameZh: "大拓太阳神",
    displayNameEn: "Daitaku Helios",
    profile: {
      baseAbility: 79,
      peakAbility: 81,
      note: "日本短哩逃先型名马，两度制霸一哩冠军赛。"
    },
    races: [
      { raceId: "takamatsunomiya-kinen", year: 1991, ability: 79, jockeyId: "shigehiko-kishi", finish: 1 },
      { raceId: "mile-championship", year: 1991, ability: 81, jockeyId: "shigehiko-kishi", finish: 1 },
      { raceId: "yomiuri-milers-cup", year: 1992, ability: 79, jockeyId: "shigehiko-kishi", finish: 1 },
      { raceId: "mile-championship", year: 1992, ability: 81, jockeyId: "shigehiko-kishi", finish: 1 }
    ]
  });
})();
