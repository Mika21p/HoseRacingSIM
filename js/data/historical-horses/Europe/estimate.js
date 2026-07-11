(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    "id": "estimate",
    "name": "Estimate",
    "displayName": "估算",
    "displayNameZh": "估算",
    "displayNameEn": "Estimate",
    "profile": {
      "baseAbility": 81,
      "peakAbility": 83,
      "note": "2013年雅士谷金杯冠军雌马，长途代表胜鞍明确。"
    },
    "races": [
      { "raceId": "europe-g2-doncaster-cup", "year": 2014, "ability": 82, "jockeyId": "ryan-moore", "finish": 1 },
      {
        "raceId": "ascot-gold-cup",
        "year": 2013,
        "ability": 83,
        "jockeyId": "ryan-moore",
        "finish": 1
      }
    ]
  });
})();
