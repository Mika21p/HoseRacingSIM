(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    id: "mejiro-bright",
    name: "メジロブライト",
    displayName: "目白光明",
    displayNameZh: "目白光明",
    displayNameEn: "Mejiro Bright",
    profile: {
      baseAbility: 80,
      peakAbility: 82,
      note: "长距离名马，1998 年春季天皇赏胜马。"
    },
    races: [
      { raceId: "stayers-stakes", year: 1997, ability: 80, jockeyId: "kawachi-hiroshi", finish: 1 },
      { raceId: "american-jockey-club-cup", year: 1998, ability: 80, jockeyId: "kawachi-hiroshi", finish: 1 },
      { raceId: "hanshin-daishoten", year: 1998, ability: 81, jockeyId: "kawachi-hiroshi", finish: 1 },
      { raceId: "tenno-sho-haru", year: 1998, ability: 82, jockeyId: "kawachi-hiroshi", finish: 1 },
      { raceId: "nikkei-shinshun-hai", year: 1999, ability: 80, jockeyId: "kawachi-hiroshi", finish: 1 }
    ]
  });
})();
