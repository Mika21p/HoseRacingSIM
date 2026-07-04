(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    "id": "shamardal",
    "name": "Shamardal",
    "displayName": "侠马道",
    "displayNameZh": "侠马道",
    "displayNameEn": "Shamardal",
    "profile": {
      "baseAbility": 85,
      "peakAbility": 87,
      "note": "法国德比与圣詹姆斯皇宫锦标冠军，三岁上半年表现强势。"
    },
    "races": [
      {
        "raceId": "dewhurst-stakes",
        "year": 2004,
        "ability": 86,
        "jockeyId": "kevin-darley",
        "finish": 1
      },
      {
        "raceId": "prix-du-jockey-club",
        "year": 2005,
        "ability": 87,
        "jockeyId": "christophe-soumillon",
        "finish": 1
      },
      {
        "raceId": "st-jamess-palace-stakes",
        "year": 2005,
        "ability": 87,
        "jockeyId": "frankie-dettori",
        "finish": 1
      }
    ]
  });
})();
