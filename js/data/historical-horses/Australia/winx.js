(function () {
  const ns = (window.Keiba = window.Keiba || {});
  ns.HistoricalHorseRegistry.register({
    id: "winx", name: "Winx", displayName: "云丝仙子", displayNameZh: "云丝仙子", displayNameEn: "Winx",
    profile: { sex: "female", baseAbility: 95, peakAbility: 97, note: "四届觉士盾冠军的澳洲历史级雌马。" },
    races: [
      { raceId: "cox-plate", year: 2015, ability: 95, jockeyId: "hugh-bowman", finish: 1 },
      { raceId: "doncaster-mile", year: 2016, ability: 96, jockeyId: "hugh-bowman", finish: 1 },
      { raceId: "cox-plate", year: 2016, ability: 96, jockeyId: "hugh-bowman", finish: 1 },
      { raceId: "queen-elizabeth-stakes-aus", year: 2017, ability: 97, jockeyId: "hugh-bowman", finish: 1 },
      { raceId: "cox-plate", year: 2017, ability: 97, jockeyId: "hugh-bowman", finish: 1 },
      { raceId: "cox-plate", year: 2018, ability: 97, jockeyId: "hugh-bowman", finish: 1 },
      { raceId: "queen-elizabeth-stakes-aus", year: 2019, ability: 97, jockeyId: "hugh-bowman", finish: 1 }
    ]
  });
})();
