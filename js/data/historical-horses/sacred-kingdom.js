(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    id: "sacred-kingdom",
    name: "Sacred Kingdom",
    displayName: "Sacred Kingdom",
    profile: {
      baseAbility: 82,
      peakAbility: 84,
      note: "莲华生辉为香港短途王，香港短途锦标与短途三冠线多胜。"
    },
    races: [
      { raceId: "hong-kong-sprint", year: 2007, ability: 83, jockeyId: "gerald-mosse", finish: 1 },
      { raceId: "chairmans-sprint-prize", year: 2008, ability: 83, jockeyId: "gerald-mosse", finish: 1 },
      { raceId: "hong-kong-sprint", year: 2009, ability: 84, jockeyId: "brett-prebble", finish: 1 },
      { raceId: "centenary-sprint-cup", year: 2010, ability: 84, jockeyId: "brett-prebble", finish: 1 },
      { raceId: "chairmans-sprint-prize", year: 2010, ability: 84, jockeyId: "brett-prebble", finish: 1 },
      { raceId: "centenary-sprint-cup", year: 2011, ability: 83, jockeyId: "brett-prebble", finish: 1 }
    ]
  });
})();
