(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    "id": "lady-aurelia",
    "name": "Lady Aurelia",
    "displayName": "奥维李雅",
    "displayNameZh": "奥维李雅",
    "displayNameEn": "Lady Aurelia",
    "profile": {
      "sex": "female",
      "baseAbility": 85,
      "peakAbility": 87,
      "note": "美国训练的欧洲短途G1雌马，皇家雅士谷速度突出。"
    },
    "races": [
      {
        "raceId": "prix-morny",
        "year": 2016,
        "ability": 86,
        "jockeyId": "frankie-dettori",
        "finish": 1
      },
      {
        "raceId": "king-charles-iii-stakes",
        "year": 2017,
        "ability": 87,
        "jockeyId": "john-velazquez",
        "finish": 1
      }
    ],
    "legendEligibilityWins": [
      {
        "raceName": "Giant's Causeway Stakes",
        "year": 2017,
        "surfaceRegion": "美国",
        "surface": "草地",
        "distance": 1100,
        "jockeyId": "john-velazquez"
      }
    ]
  });
})();
