(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    id: "mejiro-ryan",
    name: "メジロライアン",
    displayName: "目白莱恩",
    displayNameZh: "目白莱恩",
    displayNameEn: "Mejiro Ryan",
    profile: {
      baseAbility: 77,
      peakAbility: 79,
      note: "目白 87 世代代表之一，1991 年宝冢纪念胜马。"
    },
    races: [
      { raceId: "kyoto-shimbun-hai", year: 1990, ability: 77, jockeyId: "norihiro-yokoyama", finish: 1 },
      { raceId: "nikkei-sho", year: 1991, ability: 78, jockeyId: "norihiro-yokoyama", finish: 1 },
      { raceId: "takarazuka-kinen", year: 1991, ability: 79, jockeyId: "norihiro-yokoyama", finish: 1 }
    ]
  });
})();
