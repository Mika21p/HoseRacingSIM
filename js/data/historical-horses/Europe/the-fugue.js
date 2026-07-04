(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    "id": "the-fugue",
    "name": "The Fugue",
    "displayName": "赋格",
    "displayNameZh": "赋格",
    "displayNameEn": "The Fugue",
    "profile": {
      "baseAbility": 88,
      "peakAbility": 90,
      "note": "Top-class mare at 2000m to 2400m for John Gosden."
    },
    "races": [
      {
        "raceId": "nassau-stakes",
        "year": 2012,
        "ability": 88,
        "jockeyId": "william-buick",
        "finish": 1
      },
      {
        "raceId": "yorkshire-oaks",
        "year": 2013,
        "ability": 89,
        "jockeyId": "william-buick",
        "finish": 1
      },
      {
        "raceId": "irish-champion-stakes",
        "year": 2013,
        "ability": 89,
        "jockeyId": "william-buick",
        "finish": 1
      },
      {
        "raceId": "prince-of-wales-stakes",
        "year": 2014,
        "ability": 90,
        "jockeyId": "william-buick",
        "finish": 1
      }
    ]
  });
})();
