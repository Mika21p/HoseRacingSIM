(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    id: "katsuragi-ace",
    name: "カツラギエース",
    displayName: "葛城王牌",
    displayNameZh: "葛城王牌",
    displayNameEn: "Katsuragi Ace",
    profile: {
      baseAbility: 80,
      peakAbility: 82,
      note: "日本调教马首次日本杯制霸，1984 年中距离代表。"
    },
    races: [
      { raceId: "osaka-hai", year: 1984, ability: 80, jockeyId: "katsuichi-nishiura", finish: 1 },
      { raceId: "keihan-hai", year: 1984, ability: 80, jockeyId: "katsuichi-nishiura", finish: 1 },
      { raceId: "takarazuka-kinen", year: 1984, ability: 82, jockeyId: "katsuichi-nishiura", finish: 1 },
      { raceId: "mainichi-okan", year: 1984, ability: 81, jockeyId: "katsuichi-nishiura", finish: 1 },
      { raceId: "japan-cup", year: 1984, ability: 82, jockeyId: "katsuichi-nishiura", finish: 1 }
    ]
  });
})();
