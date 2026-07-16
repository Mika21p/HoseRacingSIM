(function () {
  const ns = (window.Keiba = window.Keiba || {});
  ns.HistoricalHorseRegistry.register({
    id: "meisho-hario", name: "Meisho Hario", displayName: "名将飞燕", displayNameZh: "名将飞燕", displayNameEn: "Meisho Hario",
    profile: { baseAbility: 81, peakAbility: 83, note: "2022、2023年帝王赏及2023年川崎记念冠军。" },
    races: [
      { raceId: "teio-sho", year: 2022, ability: 83, jockeyId: "suguru-hamanaka", finish: 1 },
      { raceId: "kawasaki-kinen", year: 2023, ability: 83, jockeyId: "suguru-hamanaka", finish: 1 },
      { raceId: "teio-sho", year: 2023, ability: 83, jockeyId: "suguru-hamanaka", finish: 1 }
    ]
  });
})();
