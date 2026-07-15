(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    id: "eishin-preston",
    name: "エイシンプレストン",
    displayName: "荣进宝蹄",
    displayNameZh: "荣进宝蹄",
    displayNameEn: "Eishin Preston",
    profile: {
      baseAbility: 82,
      peakAbility: 84,
      note: "香港一级赛三胜，并于日本胜出朝日杯三岁锦标。"
    },
    races: [
      { raceId: "asahi-hai-fs", year: 1999, ability: 83, jockeyId: "yuichi-fukunaga", finish: 1 },
      { raceId: "churchill-downs-cup", year: 2000, ability: 82, jockeyId: "yuichi-fukunaga", finish: 1 },
      { raceId: "new-zealand-trophy", year: 2000, ability: 82, jockeyId: "yuichi-fukunaga", finish: 1 },
      { raceId: "kitakyushu-kinen", year: 2001, ability: 82, jockeyId: "yuichi-fukunaga", finish: 1 },
      { raceId: "mainichi-okan", year: 2001, ability: 83, jockeyId: "yuichi-fukunaga", finish: 1 },
      { raceId: "hong-kong-mile", year: 2001, ability: 84, jockeyId: "yuichi-fukunaga", finish: 1 },
      { raceId: "hong-kong-queen-elizabeth-ii-cup", year: 2002, ability: 84, jockeyId: "yuichi-fukunaga", finish: 1 },
      { raceId: "hong-kong-queen-elizabeth-ii-cup", year: 2003, ability: 84, jockeyId: "yuichi-fukunaga", finish: 1 }
    ]
  });
})();
