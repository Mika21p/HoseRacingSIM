(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    id: "marche-lorraine",
    name: "マルシュロレーヌ",
    displayName: "洛林军歌",
    displayNameZh: "洛林军歌",
    displayNameEn: "Marche Lorraine",
    profile: {
      baseAbility: 82,
      peakAbility: 84,
      note: "2021 年育马者杯雌马大赛冠军，首匹胜出该赛的日本训练马。"
    },
    races: [
      { raceId: "ladies-prelude", year: 2020, ability: 82, jockeyId: "yuga-kawada", finish: 1 },
      { raceId: "hyogo-queen-cup", year: 2021, ability: 82, jockeyId: "yuga-kawada", finish: 1 },
      { raceId: "empress-hai", year: 2021, ability: 82, jockeyId: "yuga-kawada", finish: 1 },
      { raceId: "breeders-gold-cup", year: 2021, ability: 82, jockeyId: "yuga-kawada", finish: 1 },
      { raceId: "breeders-cup-distaff", year: 2021, ability: 84, jockeyId: "oisin-murphy", finish: 1 }
    ]
  });
})();
