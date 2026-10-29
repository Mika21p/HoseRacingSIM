(function () {
  const ns = (window.Keiba = window.Keiba || {});
  ns.EraScenarioRegistry.register({
    id: "jp-1998-road", routeId: "road", name: "日本黄金时代 · 1998-1999王道路", seasonTitle: "你的1998-1999赛季", stageLabel: "P1b引擎原型", startDate: "1998-01-01", endDate: "1999-12-31", year: 1998, years: [1998, 1999],
    playerTemplate: ns.EraHorseTypes.road,
    entryCandidate: { id: "1998-road-entry", title: "王道路候选马", previewTextId: "era.entry" },
    goals: { classics: ["1998-satsuki-sho", "1998-tokyo-yushun", "1998-kikka-sho"] },
    textIds: { entry: "jp.era.1998.scene.entry", time: "jp.era.1998.scene.time" },
    storyletIds: ["opening", "debut", "first-win", "satsuki-eve", "satsuki-after", "derby-eve", "derby-after", "kikka-eve", "kikka-after", "two-crowns", "triple-crown", "crown-lost", "comeback", "arima-eve", "arima-after", "year-end", "year-end-transition",
      "1999-season-open", "1999-tenno-spring-eve", "1999-tenno-spring-after", "1999-takarazuka-eve", "1999-takarazuka-after", "1999-tenno-autumn-eve", "1999-tenno-autumn-after", "1999-japan-cup-after", "1999-arima-eve", "1999-arima-after", "1999-year-end"],
    minimumGapDays: 7,
    prototypeNotice: "基础资格由原型赋予，不虚构此前胜鞍。最少7日赛间隔是原型规则，非史实强制制度；本轮不模拟收得赏金排位及海外远征。剧本覆盖1998与1999两个赛季：1999年的赛历收录对现代实龄四岁玩家马开放的重赏与主要前哨赛；当年条件中的五岁以上、四岁以上分别对应现代四岁以上、三岁以上。"
  });
})();
