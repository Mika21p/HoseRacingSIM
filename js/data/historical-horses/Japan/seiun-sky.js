(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    id: "seiun-sky",
    name: "セイウンスカイ",
    displayName: "青云天空",
    displayNameZh: "青云天空",
    displayNameEn: "Seiun Sky",
    profile: {
      baseAbility: 79,
      peakAbility: 81,
      note: "1998 年皋月赏与菊花赏胜马，菊花赏逃切代表。"
    },
    races: [
      { raceId: "satsuki-sho", year: 1998, ability: 81, jockeyId: "norihiro-yokoyama", finish: 1 },
      { raceId: "kyoto-daishoten", year: 1998, ability: 80, jockeyId: "norihiro-yokoyama", finish: 1 },
      { raceId: "kikka-sho", year: 1998, ability: 81, jockeyId: "norihiro-yokoyama", finish: 1 },
      { raceId: "nikkei-sho", year: 1999, ability: 79, jockeyId: "norihiro-yokoyama", finish: 1 },
      { raceId: "sapporo-kinen", year: 1999, ability: 80, jockeyId: "norihiro-yokoyama", finish: 1 }
    ]
  });
})();
