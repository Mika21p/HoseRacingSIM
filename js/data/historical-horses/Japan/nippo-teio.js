(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    id: "nippo-teio",
    name: "ニッポーテイオー",
    displayName: "日本帝王",
    displayNameZh: "日本帝王",
    displayNameEn: "Nippo Teio",
    profile: {
      baseAbility: 81,
      peakAbility: 83,
      note: "1987 年度日本代表性一哩至中距离强马，一级赛三胜。"
    },
    races: [
      { raceId: "new-zealand-trophy", year: 1986, ability: 81, jockeyId: "gohara-hiroyuki", finish: 1 },
      { raceId: "hakodate-kinen", year: 1986, ability: 81, jockeyId: "gohara-hiroyuki", finish: 1 },
      { raceId: "swan-stakes", year: 1986, ability: 82, jockeyId: "gohara-hiroyuki", finish: 1 },
      { raceId: "keio-hai-spring-cup", year: 1987, ability: 82, jockeyId: "gohara-hiroyuki", finish: 1 },
      { raceId: "tenno-sho-aki", year: 1987, ability: 83, jockeyId: "gohara-hiroyuki", finish: 1 },
      { raceId: "mile-championship", year: 1987, ability: 83, jockeyId: "gohara-hiroyuki", finish: 1 },
      { raceId: "yasuda-kinen", year: 1988, ability: 83, jockeyId: "gohara-hiroyuki", finish: 1 }
    ]
  });
})();
