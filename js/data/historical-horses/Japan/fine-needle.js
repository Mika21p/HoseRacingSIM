(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    "id": "fine-needle",
    "name": "ファインニードル",
    "displayName": "铁杵成针",
    "displayNameZh": "铁杵成针",
    "displayNameEn": "Fine Needle",
    "profile": {
      "baseAbility": 80,
      "peakAbility": 82,
      "note": "日本短途名驹，2018 年高松宫纪念与短途马锦标双冠。"
    },
    "races": [
      {
        "raceId": "centaur-stakes",
        "year": 2017,
        "ability": 80,
        "jockeyId": "mirco-demuro",
        "finish": 1
      },
      {
        "raceId": "silk-road-stakes",
        "year": 2018,
        "ability": 80,
        "jockeyId": "yuga-kawada",
        "finish": 1
      },
      {
        "raceId": "takamatsunomiya-kinen",
        "year": 2018,
        "ability": 82,
        "jockeyId": "yuga-kawada",
        "finish": 1
      },
      {
        "raceId": "centaur-stakes",
        "year": 2018,
        "ability": 81,
        "jockeyId": "yuga-kawada",
        "finish": 1
      },
      {
        "raceId": "sprinters-stakes",
        "year": 2018,
        "ability": 82,
        "jockeyId": "yuga-kawada",
        "finish": 1
      }
    ]
  });
})();
