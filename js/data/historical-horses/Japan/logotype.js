(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    id: "logotype",
    name: "ロゴタイプ",
    displayName: "标志名驹",
    displayNameZh: "标志名驹",
    displayNameEn: "Logotype",
    profile: {
      baseAbility: 79,
      peakAbility: 81,
      note: "朝日杯、皋月赏与安田纪念胜马，长时间活跃于一哩中距离。"
    },
    races: [
      { raceId: "asahi-hai-fs", year: 2012, ability: 80, jockeyId: "mirco-demuro", finish: 1 },
      { raceId: "spring-stakes", year: 2013, ability: 79, jockeyId: "cristian-demuro", finish: 1 },
      { raceId: "satsuki-sho", year: 2013, ability: 81, jockeyId: "mirco-demuro", finish: 1 },
      { raceId: "yasuda-kinen", year: 2016, ability: 81, jockeyId: "hironobu-tanabe", finish: 1 }
    ]
  });
})();
