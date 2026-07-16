(function () {
  const ns = (window.Keiba = window.Keiba || {});
  ns.HistoricalHorseRegistry.register({
    id: "chuwa-wizard", name: "Chuwa Wizard", displayName: "中和魔匠", displayNameZh: "中和魔匠", displayNameEn: "Chuwa Wizard",
    profile: { baseAbility: 82, peakAbility: 84, note: "2019年JBC经典赛、2020年冠军杯及两届川崎记念冠军。" },
    races: [
      { raceId: "jbc-classic", year: 2019, ability: 84, jockeyId: "yuga-kawada", finish: 1 },
      { raceId: "champions-cup", year: 2020, ability: 84, jockeyId: "keita-tosaki", finish: 1 },
      { raceId: "kawasaki-kinen", year: 2022, ability: 84, jockeyId: "yuga-kawada", finish: 1 }
    ]
  });
})();
