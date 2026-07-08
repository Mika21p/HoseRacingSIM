(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    id: "twin-turbo",
    name: "ツインターボ",
    displayName: "双涡轮",
    displayNameZh: "双涡轮",
    displayNameEn: "Twin Turbo",
    profile: {
      baseAbility: 74,
      peakAbility: 77,
      note: "极端逃马代表，1993 年七夕赏与产经赏 All Comers 大逃获胜。"
    },
    races: [
      { raceId: "radio-nikkei-sho", year: 1991, ability: 74, jockeyId: "shoichi-osaki", finish: 1 },
      { raceId: "tanabata-sho", year: 1993, ability: 77, jockeyId: "eiji-nakadate", finish: 1 },
      { raceId: "sankei-sho-all-comers", year: 1993, ability: 77, jockeyId: "eiji-nakadate", finish: 1 }
    ]
  });
})();
