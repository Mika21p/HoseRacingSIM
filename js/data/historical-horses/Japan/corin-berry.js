(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    id: "corin-berry",
    name: "コーリンベリー",
    displayName: "コーリンベリー",
    displayNameZh: "コーリンベリー",
    displayNameEn: "Corin Berry",
    profile: {
      sex: "female",
      baseAbility: 80,
      peakAbility: 82,
      note: "2015年JBC短途赛冠军，日本泥地短途牝马。"
    },
    races: [
      { raceId: "coral-stakes", year: 2015, ability: 80, jockeyId: "kohei-matsuyama", finish: 1, trackCondition: "稍重" },
      { raceId: "jbc-sprint", year: 2015, ability: 80, jockeyId: "kohei-matsuyama", finish: 1, trackCondition: "不良" },
      { raceId: "tokyo-sprint", year: 2016, ability: 80, jockeyId: "kohei-matsuyama", finish: 1, trackCondition: "稍重" }
    ],
    legendEligibilityWins: []
  });
})();
