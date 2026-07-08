(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    id: "meisho-doto",
    name: "メイショウドトウ",
    displayName: "名将怒涛",
    displayNameZh: "名将怒涛",
    displayNameEn: "Meisho Doto",
    profile: {
      baseAbility: 80,
      peakAbility: 82,
      note: "好歌剧时代核心对手，2001 年宝冢纪念击败宿敌。"
    },
    races: [
      { raceId: "chukyo-kinen", year: 2000, ability: 80, jockeyId: "yasuhiko-yasuda", finish: 1 },
      { raceId: "kinko-sho", year: 2000, ability: 80, jockeyId: "yasuhiko-yasuda", finish: 1 },
      { raceId: "sankei-sho-all-comers", year: 2000, ability: 81, jockeyId: "yasuhiko-yasuda", finish: 1 },
      { raceId: "nikkei-sho", year: 2001, ability: 80, jockeyId: "yasuhiko-yasuda", finish: 1 },
      { raceId: "takarazuka-kinen", year: 2001, ability: 82, jockeyId: "yasuhiko-yasuda", finish: 1 }
    ]
  });
})();
