(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    id: "songline",
    name: "ソングライン",
    displayName: "前人足迹",
    displayNameZh: "前人足迹",
    displayNameEn: "Songline",
    profile: {
      baseAbility: 83,
      peakAbility: 85,
      note: "安田纪念连霸，并于 2023 年胜出维多利亚一哩赛。"
    },
    races: [
      { raceId: "kobai-stakes", year: 2021, ability: 83, jockeyId: "kenichi-ikezoe", finish: 1 },
      { raceId: "fuji-stakes", year: 2021, ability: 83, jockeyId: "kenichi-ikezoe", finish: 1 },
      { raceId: "yasuda-kinen", year: 2022, ability: 85, jockeyId: "kenichi-ikezoe", finish: 1 },
      { raceId: "victoria-mile", year: 2023, ability: 85, jockeyId: "keita-tosaki", finish: 1 },
      { raceId: "yasuda-kinen", year: 2023, ability: 85, jockeyId: "keita-tosaki", finish: 1 }
    ]
  });
})();
