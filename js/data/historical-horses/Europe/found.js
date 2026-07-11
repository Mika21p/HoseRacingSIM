(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    "id": "found",
    "name": "Found",
    "displayName": "艳迹可寻",
    "displayNameZh": "艳迹可寻",
    "displayNameEn": "Found",
    "profile": {
      "baseAbility": 88,
      "peakAbility": 90,
      "note": "High-class Galileo mare, Arc and Breeders' Cup Turf winner."
    },
    "races": [
      { "raceId": "europe-g2-mooresbridge-stakes", "year": 2016, "ability": 88, "jockeyId": "ryan-moore", "finish": 1 },
      {
        "raceId": "prix-marcel-boussac",
        "year": 2014,
        "ability": 88,
        "jockeyId": "ryan-moore",
        "finish": 1
      },
      {
        "raceId": "breeders-cup-turf",
        "year": 2015,
        "ability": 89,
        "jockeyId": "ryan-moore",
        "finish": 1
      },
      {
        "raceId": "prix-de-larc",
        "year": 2016,
        "ability": 90,
        "jockeyId": "ryan-moore",
        "finish": 1
      }
    ]
  });
})();
