(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    "id": "khaadem",
    "name": "Khaadem",
    "displayName": "卡登",
    "displayNameZh": "卡登",
    "displayNameEn": "Khaadem",
    "profile": {
      "baseAbility": 82,
      "peakAbility": 84,
      "note": "皇家雅士谷短途老将，禧年锦标两度取胜。"
    },
    "races": [
      { "raceId": "europe-g3-palace-house-stakes", "year": 2022, "ability": 82, "jockeyId": "william-buick", "finish": 1 },
      {
        "raceId": "queen-elizabeth-ii-jubilee-stakes",
        "year": 2023,
        "ability": 83,
        "jockeyId": "jamie-spencer",
        "finish": 1
      },
      {
        "raceId": "queen-elizabeth-ii-jubilee-stakes",
        "year": 2024,
        "ability": 84,
        "jockeyId": "oisin-murphy",
        "finish": 1
      }
    ]
  });
})();
