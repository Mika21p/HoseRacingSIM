(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    id: "silence-suzuka",
    name: "サイレンススズカ",
    displayName: "无声铃鹿",
    displayNameZh: "无声铃鹿",
    displayNameEn: "Silence Suzuka",
    profile: {
      baseAbility: 81,
      peakAbility: 84,
      note: "日本代表性逃马，1998 年连续赢下重赏并夺宝冢纪念。"
    },
    races: [
      { raceId: "principal-stakes", year: 1997, ability: 81, jockeyId: "hiroyuki-uemura", finish: 1 },
      { raceId: "nakayama-kinen", year: 1998, ability: 82, jockeyId: "take-yutaka", finish: 1 },
      { raceId: "kokura-daishoten", year: 1998, ability: 82, jockeyId: "take-yutaka", finish: 1 },
      { raceId: "kinko-sho", year: 1998, ability: 83, jockeyId: "take-yutaka", finish: 1 },
      { raceId: "takarazuka-kinen", year: 1998, ability: 84, jockeyId: "minai-katsumi", finish: 1 },
      { raceId: "mainichi-okan", year: 1998, ability: 84, jockeyId: "take-yutaka", finish: 1 }
    ]
  });
})();
