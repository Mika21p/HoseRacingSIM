(function () {
  const ns = (window.Keiba = window.Keiba || {});
  ns.HistoricalHorseRegistry.register({
    id: "meisei-opera", name: "Meisei Opera", displayName: "名圣歌剧", displayNameZh: "名圣歌剧", displayNameEn: "Meisei Opera",
    profile: { baseAbility: 82, peakAbility: 84, note: "1999年以地方所属马身份赢得二月锦标的历史名马。" },
    races: [
      { raceId: "february-stakes", year: 1999, ability: 84, jockeyId: "isao-sugawara", finish: 1 },
      { raceId: "kawasaki-kinen", year: 1999, ability: 84, jockeyId: "isao-sugawara", finish: 1 }
    ]
  });
})();
