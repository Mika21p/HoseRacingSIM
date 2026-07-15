(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    id: "admire-don",
    name: "アドマイヤドン",
    displayName: "尊师重道",
    displayNameZh: "尊师重道",
    displayNameEn: "Admire Don",
    profile: {
      baseAbility: 81,
      peakAbility: 83,
      note: "JBC 经典赛三连霸，并于 2004 年胜出二月锦标与帝王赏。"
    },
    races: [
      { raceId: "asahi-hai-fs", year: 2001, ability: 82, jockeyId: "hirofumi-shii", finish: 1 },
      { raceId: "jbc-classic", year: 2002, ability: 83, jockeyId: "hirofumi-shii", finish: 1 },
      { raceId: "elm-stakes", year: 2003, ability: 81, jockeyId: "hirofumi-shii", finish: 1 },
      { raceId: "mile-championship-nambu-hai", year: 2003, ability: 82, jockeyId: "hirofumi-shii", finish: 1 },
      { raceId: "jbc-classic", year: 2003, ability: 83, jockeyId: "hirofumi-shii", finish: 1 },
      { raceId: "february-stakes", year: 2004, ability: 83, jockeyId: "hirofumi-shii", finish: 1 },
      { raceId: "teio-sho", year: 2004, ability: 83, jockeyId: "hirofumi-shii", finish: 1 },
      { raceId: "jbc-classic", year: 2004, ability: 83, jockeyId: "hirofumi-shii", finish: 1 }
    ]
  });
})();
