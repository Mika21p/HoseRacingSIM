(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    id: "loves-only-you",
    name: "ラヴズオンリーユー",
    displayName: "唯独爱你",
    displayNameZh: "唯独爱你",
    displayNameEn: "Loves Only You",
    profile: {
      baseAbility: 83,
      peakAbility: 86,
      note: "日本首匹育马者杯冠军，2021 年胜出三项海外一级赛。"
    },
    races: [
      { raceId: "wasurenagusa-sho", year: 2019, ability: 83, jockeyId: "mirco-demuro", finish: 1 },
      { raceId: "yushun-himba", year: 2019, ability: 84, jockeyId: "mirco-demuro", finish: 1 },
      { raceId: "kyoto-kinen", year: 2021, ability: 84, jockeyId: "yuga-kawada", finish: 1 },
      { raceId: "hong-kong-queen-elizabeth-ii-cup", year: 2021, ability: 85, jockeyId: "vincent-ho", finish: 1 },
      { raceId: "breeders-cup-filly-mare-turf", year: 2021, ability: 86, jockeyId: "yuga-kawada", finish: 1 },
      { raceId: "hong-kong-cup", year: 2021, ability: 86, jockeyId: "yuga-kawada", finish: 1 }
    ]
  });
})();
