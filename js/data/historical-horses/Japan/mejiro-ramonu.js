(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    id: "mejiro-ramonu",
    name: "メジロラモーヌ",
    displayName: "目白高峰",
    displayNameZh: "目白高峰",
    displayNameEn: "Mejiro Ramonu",
    profile: {
      baseAbility: 80,
      peakAbility: 82,
      note: "日本首匹牝马三冠马，目白系牝马历史标尺。"
    },
    races: [
      { raceId: "fillies-revue", year: 1986, ability: 80, jockeyId: "kawachi-hiroshi", finish: 1 },
      { raceId: "oka-sho", year: 1986, ability: 82, jockeyId: "kawachi-hiroshi", finish: 1 },
      { raceId: "flora-stakes", year: 1986, ability: 80, jockeyId: "kawachi-hiroshi", finish: 1 },
      { raceId: "yushun-himba", year: 1986, ability: 82, jockeyId: "kawachi-hiroshi", finish: 1 },
      { raceId: "queen-elizabeth-ii-cup", year: 1986, ability: 82, jockeyId: "kawachi-hiroshi", finish: 1 }
    ]
  });
})();
