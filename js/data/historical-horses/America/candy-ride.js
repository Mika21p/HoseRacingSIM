(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    "id": "candy-ride",
    "name": "Candy Ride",
    "displayName": "糖果快车",
    "displayNameZh": "糖果快车",
    "displayNameEn": "Candy Ride",
    "profile": {
      "baseAbility": 88,
      "peakAbility": 90,
      "note": "Candy Ride major race wins recorded for currently available project race IDs."
    },
    "races": [
      {
        "raceId": "gran-premio-san-isidro",
        "year": 2002,
        "ability": 88,
        "jockeyId": "armando-c-glades",
        "finish": 1
      },
      {
        "raceId": "gran-premio-joaquin-s-de-anchorena",
        "year": 2002,
        "ability": 89,
        "jockeyId": "armando-c-glades",
        "finish": 1
      },
      {
        "raceId": "pacific-classic",
        "year": 2003,
        "ability": 90,
        "jockeyId": "julie-krone",
        "finish": 1
      }
    ]
  });
})();
