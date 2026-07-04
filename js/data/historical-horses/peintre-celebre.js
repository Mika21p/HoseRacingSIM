(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    "id": "peintre-celebre",
    "name": "Peintre Celebre",
    "displayName": "Peintre Celebre",
    "profile": {
      "baseAbility": 95,
      "peakAbility": 97,
      "note": "1997 French Derby, Grand Prix de Paris and Arc winner."
    },
    "races": [
      {
        "raceId": "prix-du-jockey-club",
        "year": 1997,
        "ability": 96,
        "jockeyId": "olivier-peslier",
        "finish": 1
      },
      {
        "raceId": "grand-prix-de-paris",
        "year": 1997,
        "ability": 96,
        "jockeyId": "olivier-peslier",
        "finish": 1
      },
      {
        "raceId": "prix-de-larc",
        "year": 1997,
        "ability": 97,
        "jockeyId": "olivier-peslier",
        "finish": 1
      }
    ]
  });
})();
