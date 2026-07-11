(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    "id": "special-duty",
    "name": "Special Duty",
    "displayName": "特别任务",
    "displayNameZh": "特别任务",
    "displayNameEn": "Special Duty",
    "profile": {
      "baseAbility": 81,
      "peakAbility": 85,
      "note": "2010年经典赛雌马冠军，一千坚尼胜鞍计入当前赛事表。"
    },
    "races": [
      {
        "raceId": "cheveley-park-stakes",
        "year": 2009,
        "ability": 85,
        "jockeyId": "stephane-pasquier",
        "finish": 1
      },
      {
        "raceId": "one-thousand-guineas",
        "year": 2010,
        "ability": 83,
        "jockeyId": "stephane-pasquier",
        "finish": 1
      },
      {
        "raceId": "poule-dessai-des-pouliches",
        "year": 2010,
        "ability": 84,
        "jockeyId": "stephane-pasquier",
        "finish": 1
      }
    ]
  });
})();
