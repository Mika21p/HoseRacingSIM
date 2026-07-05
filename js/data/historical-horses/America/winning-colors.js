(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    "id": "winning-colors",
    "name": "Winning Colors",
    "displayName": "胜利色彩",
    "displayNameZh": "胜利色彩",
    "displayNameEn": "Winning Colors",
    "profile": {
      "baseAbility": 78,
      "peakAbility": 80,
      "note": "少数赢下肯塔基德比的雌马之一，三岁春峰值鲜明。"
    },
    "races": [
      {
        "raceId": "santa-anita-derby",
        "year": 1988,
        "ability": 87,
        "jockeyId": "gary-stevens",
        "finish": 1
      },
      {
        "raceId": "kentucky-derby",
        "year": 1988,
        "ability": 80,
        "jockeyId": "gary-stevens",
        "finish": 1
      }
    ]
  });
})();
