(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    "id": "order-of-st-george",
    "name": "Order of St George",
    "displayName": "圣乔治骑士团",
    "displayNameZh": "圣乔治骑士团",
    "displayNameEn": "Order of St George",
    "profile": {
      "baseAbility": 88,
      "peakAbility": 90,
      "note": "Modern staying champion with Ascot Gold Cup and Irish St Leger wins."
    },
    "races": [
      {
        "raceId": "irish-st-leger",
        "year": 2015,
        "ability": 88,
        "jockeyId": "joseph-obrien",
        "finish": 1
      },
      {
        "raceId": "ascot-gold-cup",
        "year": 2016,
        "ability": 90,
        "jockeyId": "ryan-moore",
        "finish": 1
      },
      {
        "raceId": "irish-st-leger",
        "year": 2017,
        "ability": 89,
        "jockeyId": "ryan-moore",
        "finish": 1
      },
      {
        "raceId": "british-champions-long-distance-cup",
        "year": 2017,
        "ability": 89,
        "jockeyId": "ryan-moore",
        "finish": 1
      }
    ]
  });
})();
