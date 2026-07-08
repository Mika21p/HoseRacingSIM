(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    id: "furioso",
    name: "フリオーソ",
    displayName: "狂怒乐章",
    displayNameZh: "狂怒乐章",
    displayNameEn: "Furioso",
    profile: {
      baseAbility: 78,
      peakAbility: 80,
      note: "地方泥地代表，南关东与交流重赏 G1/Jpn1 多胜。"
    },
    races: [
      { raceId: "zen-nippon-nisai-yushun", year: 2006, ability: 79, jockeyId: "hiroyuki-uchida", finish: 1 },
      { raceId: "tokyo-derby", year: 2007, ability: 78, jockeyId: "hiroyuki-uchida", finish: 1 },
      { raceId: "japan-dirt-classic", year: 2007, ability: 80, jockeyId: "hiroyuki-uchida", finish: 1 },
      { raceId: "diolite-kinen", year: 2008, ability: 78, jockeyId: "keita-tosaki", finish: 1 },
      { raceId: "teio-sho", year: 2008, ability: 80, jockeyId: "keita-tosaki", finish: 1 },
      { raceId: "diolite-kinen", year: 2009, ability: 78, jockeyId: "keita-tosaki", finish: 1 },
      { raceId: "teio-sho", year: 2010, ability: 80, jockeyId: "keita-tosaki", finish: 1 },
      { raceId: "kashiwa-kinen", year: 2011, ability: 80, jockeyId: "keita-tosaki", finish: 1 },
      { raceId: "kawasaki-kinen", year: 2011, ability: 80, jockeyId: "keita-tosaki", finish: 1 }
    ]
  });
})();
