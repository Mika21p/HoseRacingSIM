(function () {
  const ns = (window.Keiba = window.Keiba || {});
  ns.HistoricalHorseRegistry.register({
    id: "gold-allure", name: "Gold Allure", displayName: "黄金魅力", displayNameZh: "黄金魅力", displayNameEn: "Gold Allure",
    profile: { baseAbility: 83, peakAbility: 85, note: "2002年日本泥地德比、2003年二月锦标冠军的泥地名马。" },
    races: [
      { raceId: "japan-dirt-classic", year: 2002, ability: 85, jockeyId: "take-yutaka", finish: 1 },
      { raceId: "february-stakes", year: 2003, ability: 85, jockeyId: "take-yutaka", finish: 1 }
    ]
  });
})();
