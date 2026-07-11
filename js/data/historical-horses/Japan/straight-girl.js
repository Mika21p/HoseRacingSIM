(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    "id": "straight-girl",
    "name": "ストレイトガール",
    "displayName": "真诚少女",
    "displayNameZh": "真诚少女",
    "displayNameEn": "Straight Girl",
    "profile": {
      "baseAbility": 79,
      "peakAbility": 81,
      "note": "维多利亚一哩赛连霸并胜短途马锦标，雌马短哩双线名将。"
    },
    "races": [
      {
        "raceId": "silk-road-stakes",
        "year": 2014,
        "ability": 79,
        "jockeyId": "yasunari-iwata",
        "finish": 1
      },
      {
        "raceId": "victoria-mile",
        "year": 2015,
        "ability": 80,
        "jockeyId": "keita-tosaki",
        "finish": 1
      },
      {
        "raceId": "sprinters-stakes",
        "year": 2015,
        "ability": 81,
        "jockeyId": "keita-tosaki",
        "finish": 1
      },
      {
        "raceId": "victoria-mile",
        "year": 2016,
        "ability": 81,
        "jockeyId": "keita-tosaki",
        "finish": 1
      }
    ]
  });
})();
