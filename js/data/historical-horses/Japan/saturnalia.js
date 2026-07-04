(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    "id": "saturnalia",
    "name": "サートゥルナーリア",
    "displayName": "农神节庆",
    "displayNameZh": "农神节庆",
    "displayNameEn": "Saturnalia",
    "profile": {
      "baseAbility": 79,
      "peakAbility": 81,
      "note": "希望锦标与皋月赏冠军，三岁春峰值明确。"
    },
    "races": [
      {
        "raceId": "hopeful-stakes",
        "year": 2018,
        "ability": 80,
        "jockeyId": "mirco-demuro",
        "finish": 1
      },
      {
        "raceId": "satsuki-sho",
        "year": 2019,
        "ability": 81,
        "jockeyId": "christophe-lemaire",
        "finish": 1
      },
      {
        "raceId": "kobe-shimbun-hai",
        "year": 2019,
        "ability": 80,
        "jockeyId": "christophe-lemaire",
        "finish": 1
      }
    ]
  });
})();
