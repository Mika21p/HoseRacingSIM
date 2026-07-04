(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    "id": "search-for-a-song",
    "name": "Search For A Song",
    "displayName": "寻歌",
    "displayNameZh": "寻歌",
    "displayNameEn": "Search For A Song",
    "profile": {
      "baseAbility": 82,
      "peakAbility": 84,
      "note": "Dual Irish St Leger-winning Moyglare stayer."
    },
    "races": [
      {
        "raceId": "irish-st-leger",
        "year": 2019,
        "ability": 83,
        "jockeyId": "chris-hayes",
        "finish": 1
      },
      {
        "raceId": "irish-st-leger",
        "year": 2020,
        "ability": 84,
        "jockeyId": "oisin-orr",
        "finish": 1
      }
    ]
  });
})();
