(function () {
  const ns = (window.Keiba = window.Keiba || {});
  ns.EraHorseTypes = {
    // 原型设定：马主路线以三岁王道型牡马起步。
    // 巅峰期从三岁春延续到四岁秋：剧本覆盖 1998 与 1999 两个赛季，
    // 若在三岁秋后立刻进入衰退期，1999 年整季都会背着月衰与赛磨损，赛历无法进行。
    road: { id: "road", label: "王道型牡马", birthYear: 1995, gender: "牡马", homeRegionId: "japan", surfacePref: "草地", distMin: 1800, distMax: 3200, coreDist: 2400, strengthMin: 83, strengthMax: 87, growthType: "普早", peakStart: "三岁春", peakEnd: "四岁秋", commentAccuracy: "close", trainerId: "sato-yuta", playerJockey: { id: "era-player-hayato", name: "高桥隼人", ability: 70, fictional: true } }
  };
})();
