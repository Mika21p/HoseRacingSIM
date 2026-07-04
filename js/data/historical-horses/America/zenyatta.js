(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    id: "zenyatta",
    name: "Zenyatta",
    displayName: "禅雅塔",
    displayNameZh: "禅雅塔",
    displayNameEn: "Zenyatta",
    profile: {
      baseAbility: 87,
      peakAbility: 89,
      note: "美国雌马代表，后追脚质与育马者杯经典赛胜利极具标志性。"
    },
    races: [
      { raceId: "apple-blossom-handicap", year: 2008, ability: 87, jockeyId: "mike-smith", finish: 1 },
      { raceId: "breeders-cup-distaff", year: 2008, ability: 88, jockeyId: "mike-smith", finish: 1 },
      { raceId: "breeders-cup-classic", year: 2009, ability: 89, jockeyId: "mike-smith", finish: 1 },
      { raceId: "apple-blossom-handicap", year: 2010, ability: 88, jockeyId: "mike-smith", finish: 1 }
    ]
  });
})();
