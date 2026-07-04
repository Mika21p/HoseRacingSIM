(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    "id": "king-halo",
    "name": "キングヘイロー",
    "displayName": "帝王光环",
    "displayNameZh": "帝王光环",
    "displayNameEn": "King Halo",
    "profile": {
      "baseAbility": 76,
      "peakAbility": 78,
      "note": "良血万能型，最终在高松宫纪念完成G1制霸。"
    },
    "races": [
      {
        "raceId": "tokyo-sports-hai",
        "year": 1997,
        "ability": 76,
        "jockeyId": "yuichi-fukunaga",
        "finish": 1
      },
      {
        "raceId": "takamatsunomiya-kinen",
        "year": 2000,
        "ability": 78,
        "jockeyId": "yoshitomi-shibata",
        "finish": 1
      }
    ]
  });
})();
