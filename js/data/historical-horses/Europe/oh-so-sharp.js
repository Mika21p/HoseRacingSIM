(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    "id": "oh-so-sharp",
    "name": "Oh So Sharp",
    "displayName": "好锋利",
    "displayNameZh": "好锋利",
    "displayNameEn": "Oh So Sharp",
    "profile": {
      "baseAbility": 87,
      "peakAbility": 91,
      "note": "1985年英国雌马三冠，经典距离适性完整。"
    },
    "races": [
      {
        "raceId": "fillies-mile",
        "year": 1984,
        "ability": 91,
        "jockeyId": "steve-cauthen",
        "finish": 1
      },
      {
        "raceId": "one-thousand-guineas",
        "year": 1985,
        "ability": 87,
        "jockeyId": "steve-cauthen",
        "finish": 1
      },
      {
        "raceId": "epsom-oaks",
        "year": 1985,
        "ability": 88,
        "jockeyId": "steve-cauthen",
        "finish": 1
      },
      {
        "raceId": "st-leger-stakes",
        "year": 1985,
        "ability": 89,
        "jockeyId": "steve-cauthen",
        "finish": 1
      }
    ]
  });
})();
