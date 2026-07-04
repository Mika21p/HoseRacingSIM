(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    id: "titleholder",
    name: "タイトルホルダー",
    displayName: "领衔",
    displayNameZh: "领衔",
    displayNameEn: "Titleholder",
    profile: {
      baseAbility: 82,
      peakAbility: 84,
      note: "菊花赏、天皇赏春与宝塚纪念冠军，长距离先行压制型。"
    },
    races: [
      { raceId: "yayoi-sho", year: 2021, ability: 82, jockeyId: "takeshi-yokoyama", finish: 1 },
      { raceId: "kikka-sho", year: 2021, ability: 83, jockeyId: "takeshi-yokoyama", finish: 1 },
      { raceId: "nikkei-sho", year: 2022, ability: 83, jockeyId: "kazuo-yokoyama", finish: 1 },
      { raceId: "tenno-sho-haru", year: 2022, ability: 84, jockeyId: "takeshi-yokoyama", finish: 1 },
      { raceId: "takarazuka-kinen", year: 2022, ability: 84, jockeyId: "takeshi-yokoyama", finish: 1 },
      { raceId: "nikkei-sho", year: 2023, ability: 83, jockeyId: "kazuo-yokoyama", finish: 1 }
    ]
  });
})();
