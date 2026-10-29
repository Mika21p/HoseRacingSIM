(function () {
  const ns = (window.Keiba = window.Keiba || {});
  // 1998 年的剧情片段。条件与效果使用 js/rules/era-conditions.js 的受限语法。
  // 出走表是赛前公开信息，片段里可以提及同场对手，但不能提前透露史实结果。
  ns.EraStoryletRegistry.register(1998, [
    { id: "opening", textId: "jp.era.1998.scene.opening", priority: 10, when: { eventType: "horse-named" },
      choices: [{ id: "continue", label: "翻开赛历", effects: [] }] },
    { id: "debut", textId: "jp.era.1998.scene.debut", priority: 50, when: { starts: 1 },
      choices: [
        { id: "quiet", label: "让成绩先说话", effects: [{ type: "media", value: "quiet" }] },
        { id: "confident", label: "公开表达对它的期待", effects: [{ type: "media", value: "confident" }] }
      ] },
    { id: "first-win", textId: "jp.era.1998.scene.first-win", priority: 46, when: { tags: ["maiden-win"] },
      choices: [
        { id: "modest", label: "把目光留给下一场", effects: [{ type: "media", value: "quiet" }, { type: "fame", delta: 1 }] },
        { id: "confident", label: "坦然迎接期待", effects: [{ type: "media", value: "confident" }, { type: "fame", delta: 3 }] }
      ] },
    { id: "satsuki-eve", textId: "jp.era.1998.scene.satsuki-eve", priority: 52, when: { registered: "1998-satsuki-sho" },
      choices: [
        { id: "steady", label: "不多表态，先看比赛", effects: [] },
        { id: "claim", label: "从一开始就摆出争冠姿态", effects: [{ type: "fame", delta: 2 }] }
      ] },
    { id: "satsuki-after", textId: "jp.era.1998.scene.satsuki-after", priority: 46, when: { entered: "1998-satsuki-sho" },
      choices: [{ id: "continue", label: "看看下一场", effects: [] }] },
    { id: "derby-eve", textId: "jp.era.1998.scene.derby-eve", priority: 54, when: { registered: "1998-tokyo-yushun" },
      choices: [
        { id: "remember", label: "记住特别周这个对手", effects: [{ type: "relation", target: "special-week", kind: "rival" }] },
        { id: "own", label: "把注意力留给自己的马", effects: [] }
      ] },
    { id: "derby-after", textId: "jp.era.1998.scene.derby-after", priority: 50, when: { entered: "1998-tokyo-yushun" },
      choices: [{ id: "continue", label: "规划夏天的路线", effects: [] }] },
    { id: "kikka-eve", textId: "jp.era.1998.scene.kikka-eve", priority: 56, when: { registered: "1998-kikka-sho" },
      choices: [
        { id: "last-race", label: "公开表态：这一关格外重要", effects: [{ type: "fame", delta: 2 }] },
        { id: "normal", label: "当作普通的一仗", effects: [] }
      ] },
    { id: "kikka-after", textId: "jp.era.1998.scene.kikka-after", priority: 58, when: { entered: "1998-kikka-sho" },
      choices: [{ id: "continue", label: "看看余下的秋季赛程", effects: [] }] },
    { id: "two-crowns", textId: "jp.era.1998.scene.two-crowns", priority: 80, when: { tags: ["triple-crown-candidate"] },
      choices: [{ id: "continue", label: "专注最后一冠", effects: [] }] },
    { id: "triple-crown", textId: "jp.era.1998.scene.triple-crown", priority: 90, when: { tags: ["triple-crown"], entered: "1998-kikka-sho" },
      choices: [
        { id: "own", label: "把这一年留给自己", effects: [] },
        { id: "record", label: "公开庆祝这次三冠", effects: [{ type: "fame", delta: 3 }] }
      ] },
    { id: "crown-lost", textId: "jp.era.1998.scene.crown-lost", priority: 50, when: { tags: ["crown-lost"] },
      choices: [{ id: "continue", label: "继续自己的赛季", effects: [] }] },
    { id: "comeback", textId: "jp.era.1998.scene.comeback", priority: 40, when: { eventType: "injury-recovery" },
      choices: [{ id: "continue", label: "重新检查赛程", effects: [] }] },
    { id: "arima-eve", textId: "jp.era.1998.scene.arima-eve", priority: 58, when: { registered: "1998-arima-kinen" },
      choices: [
        { id: "bet-all", label: "把这一年赌在这一场", effects: [{ type: "fame", delta: 2 }] },
        { id: "safe", label: "不放豪言，先看这一场", effects: [] }
      ] },
    { id: "arima-after", textId: "jp.era.1998.scene.arima-after", priority: 60, when: { entered: "1998-arima-kinen" },
      choices: [{ id: "continue", label: "合上这一页", effects: [] }] },
    { id: "year-end", summaryYear: 1998, textId: "jp.era.1998.scene.year-end", priority: 30, when: { eventType: "season-end", window: ["1998-01-01", "1998-12-31"] },
      choices: [{ id: "continue", label: "查看年度总结", effects: [] }] },
    // 剧本覆盖1998与1999两个赛季：1998年的收尾在赛历翻到1999年时播出，
    // 若赛季在1998年内提前结束，则由上面的 season-end 片段接手。
    { id: "year-end-transition", summaryYear: 1998, textId: "jp.era.1998.scene.year-end", priority: 32, when: { window: ["1998-12-28", "1999-01-31"] },
      choices: [{ id: "continue", label: "合上1998年的账本", effects: [] }] }
  ]);
})();
