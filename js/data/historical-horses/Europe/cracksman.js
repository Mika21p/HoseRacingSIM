(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    "id": "cracksman",
    "name": "Cracksman",
    "displayName": "金库神偷",
    "displayNameZh": "金库神偷",
    "displayNameEn": "Cracksman",
    "profile": {
      "baseAbility": 90,
      "peakAbility": 92,
      "note": "Frankel子嗣的欧洲中距离强豪，加冕杯胜鞍计入。"
    },
    "races": [
      { "raceId": "europe-g2-great-voltigeur-stakes", "year": 2017, "ability": 90, "jockeyId": "frankie-dettori", "finish": 1 },
      { "raceId": "champion-stakes", "year": 2017, "ability": 92, "jockeyId": "frankie-dettori", "finish": 1 },
      { "raceId": "prix-ganay", "year": 2018, "ability": 91, "jockeyId": "frankie-dettori", "finish": 1 },
      { "raceId": "champion-stakes", "year": 2018, "ability": 92, "jockeyId": "frankie-dettori", "finish": 1 },
      {
        "raceId": "coronation-cup",
        "year": 2018,
        "ability": 91,
        "jockeyId": "frankie-dettori",
        "finish": 1
      }
    ]
  });
})();
