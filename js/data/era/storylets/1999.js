(function () {
  const ns = (window.Keiba = window.Keiba || {});
  // 1999 年的剧情片段：玩家马已经四岁，赛历收录对其开放的重赏与主要前哨赛。
  // 条件与效果使用 js/rules/era-conditions.js 的受限语法；
  // 赛前片段只提走出走表上的公开信息，不得提前透露史实赛果。
  ns.EraStoryletRegistry.register(1999, [
    { id: "1999-season-open", textId: "jp.era.1999.scene.season-open", priority: 30, when: { window: ["1999-01-01", "1999-12-31"] },
      choices: [
        { id: "steady", label: "照去年的节奏继续", effects: [] },
        { id: "press", label: "把去年的名次摆上台面", effects: [{ type: "fame", delta: 2 }] }
      ] },
    { id: "1999-tenno-spring-eve", textId: "jp.era.1999.scene.tenno-spring-eve", priority: 52, when: { registered: "1999-tenno-sho-haru" },
      choices: [
        { id: "endurance", label: "把它当成长距离的考卷", effects: [] },
        { id: "chase", label: "公开表态：要跟住对手", effects: [{ type: "fame", delta: 2 }] }
      ] },
    { id: "1999-tenno-spring-after", textId: "jp.era.1999.scene.tenno-spring-after", priority: 46, when: { entered: "1999-tenno-sho-haru" },
      choices: [{ id: "continue", label: "看看下一场", effects: [] }] },
    { id: "1999-takarazuka-eve", textId: "jp.era.1999.scene.takarazuka-eve", priority: 52, when: { registered: "1999-takarazuka-kinen" },
      choices: [
        { id: "steady", label: "按自己的节奏跑", effects: [] },
        { id: "claim", label: "记住草上飞这个对手", effects: [{ type: "relation", target: "grass-wonder", kind: "rival" }] }
      ] },
    { id: "1999-takarazuka-after", textId: "jp.era.1999.scene.takarazuka-after", priority: 46, when: { entered: "1999-takarazuka-kinen" },
      choices: [{ id: "continue", label: "继续排秋天的赛程", effects: [] }] },
    { id: "1999-tenno-autumn-eve", textId: "jp.era.1999.scene.tenno-autumn-eve", priority: 52, when: { registered: "1999-tenno-sho-aki" },
      choices: [
        { id: "steady", label: "不再加码", effects: [] },
        { id: "all-in", label: "把这一年押在秋天", effects: [{ type: "fame", delta: 2 }] }
      ] },
    { id: "1999-tenno-autumn-after", textId: "jp.era.1999.scene.tenno-autumn-after", priority: 46, when: { entered: "1999-tenno-sho-aki" },
      choices: [{ id: "continue", label: "走向年末", effects: [] }] },
    { id: "1999-japan-cup-after", textId: "jp.era.1999.scene.japan-cup-after", priority: 50, when: { entered: "1999-japan-cup" },
      choices: [{ id: "continue", label: "看看年末的赛程", effects: [] }] },
    { id: "1999-arima-eve", textId: "jp.era.1999.scene.arima-eve", priority: 58, when: { registered: "1999-arima-kinen" },
      choices: [
        { id: "bet-all", label: "把两年都赌在这一场", effects: [{ type: "fame", delta: 2 }] },
        { id: "safe", label: "稳稳跑完就行", effects: [] }
      ] },
    { id: "1999-arima-after", textId: "jp.era.1999.scene.arima-after", priority: 60, when: { entered: "1999-arima-kinen" },
      choices: [{ id: "continue", label: "合上这一页", effects: [] }] },
    { id: "1999-year-end", textId: "jp.era.1999.scene.year-end", priority: 30, when: { eventType: "season-end", window: ["1999-01-01", "1999-12-31"] },
      choices: [{ id: "continue", label: "查看生涯总结", effects: [] }] }
  ]);
})();
