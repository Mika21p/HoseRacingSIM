(function () {
  const ns = (window.Keiba = window.Keiba || {});
  // 新闻模板登记表：按类别存放通用模板，剧情片段与新闻共用 js/rules/era-conditions.js 的条件语法。
  // 全部文本为 draft，用户审核通过后才改为 final（见 docs/剧情模式P2文本送审清单-2026-10-25.md）。
  const templates = [];
  const notes = new Map();

  function register(items) {
    for (const item of items || []) {
      if (!item || !item.id || !item.category || !item.title || !item.body) throw new Error("Invalid era news template");
      templates.push({ priority: 0, when: {}, ...item });
    }
    return templates.length;
  }

  function list() { return templates.slice(); }

  function select(category, context) {
    const candidates = templates.filter((item) => item.category === category).sort((left, right) => (right.priority || 0) - (left.priority || 0));
    for (const item of candidates) if (ns.EraConditions.matches(item.when, context)) return item;
    return candidates[candidates.length - 1] || null;
  }

  function registerNotes(year, list) {
    for (const note of list || []) {
      if (!note || !note.raceId || !note.title || !note.body) throw new Error("Invalid era news note");
      notes.set(note.raceId, { year, ...note });
    }
    return notes.size;
  }

  ns.EraNewsTemplates = { register, list, select, registerNotes, noteFor: (raceId) => notes.get(raceId) || null, notes: () => [...notes.values()] };
  ns.EraNewsNotes = { registerNotes, noteFor: (raceId) => notes.get(raceId) || null, list: () => [...notes.values()] };

  ns.EraNewsTemplates.register([
    // —— 史实简讯：玩家没有参赛的比赛 ——
    { id: "historical.g1", category: "historical", priority: 30, when: { grade: "G1" },
      title: "{{RACE_NAME}}：{{WINNER_NAME}}夺冠",
      body: "{{DATE}}。{{RACE_NAME}}（{{RACE_GRADE}}，{{RACE_CONDITION}}）落幕，{{WINNER_NAME}}在{{WINNER_JOCKEY}}策骑下夺冠。赛果按史实原样收进年鉴——这一战，本局没有你的马参与。" },
    { id: "historical.graded", category: "historical", priority: 20, when: { grade: ["G2", "G3", "重"] },
      title: "{{RACE_NAME}}：{{WINNER_NAME}}取胜",
      body: "{{DATE}}，{{RACE_NAME}}（{{RACE_GRADE}}，{{RACE_CONDITION}}）结束，{{WINNER_NAME}}夺冠。这场没有你的马参赛，结果按史实收进年鉴。" },
    { id: "historical.other", category: "historical", priority: 10,
      title: "{{RACE_NAME}}：{{WINNER_NAME}}夺魁",
      body: "{{DATE}}。{{RACE_NAME}}（{{RACE_CONDITION}}）结束，{{WINNER_NAME}}胜出。本局没有参与，赛果按史实保存。" },

    // —— 本局赛果：玩家参加的比赛 ——
    { id: "result.deadheat", category: "result", priority: 66, when: { deadHeat: true },
      title: "{{RACE_NAME}}：{{PLAYER_HORSE_NAME}}与对手同着",
      body: "{{DATE}}，{{RACE_NAME}}（{{RACE_GRADE}}）出现并列：{{PLAYER_HORSE_NAME}}与{{OPPONENT_NAME}}同着。终点也没能把它们分开；两匹马并排写进赛果，名次照旧计入总成绩。" },
    { id: "result.win.maiden", category: "result", priority: 64, when: { rank: 1, maiden: true },
      title: "{{PLAYER_HORSE_NAME}}初战告捷",
      body: "{{DATE}}，{{PLAYER_HORSE_NAME}}在首次出赛的{{RACE_NAME}}（{{RACE_GRADE}}）取胜，策骑的是{{PLAYER_JOCKEY}}。初战告捷，名字终于有了胜鞍作底气；史实冠军{{HISTORICAL_WINNER_NAME}}原本的位置，在本局世界线里换了主人。" },
    { id: "result.win.upset", category: "result", priority: 62, when: { rank: 1, upset: true },
      title: "{{PLAYER_HORSE_NAME}}爆冷击败{{HISTORICAL_WINNER_NAME}}",
      body: "{{DATE}}，{{PLAYER_HORSE_NAME}}拿下{{RACE_NAME}}（{{RACE_GRADE}}），把史实冠军{{HISTORICAL_WINNER_NAME}}压在身后。爆冷的这一笔，只属于本局世界线；翻开年鉴，当年的原始赛果仍在那里。" },
    { id: "result.win.g1", category: "result", priority: 50, when: { rank: 1, grade: "G1" },
      title: "{{PLAYER_HORSE_NAME}}拿下{{RACE_NAME}}",
      body: "{{DATE}}，{{PLAYER_HORSE_NAME}}在{{PLAYER_JOCKEY}}策骑下拿下{{RACE_NAME}}（{{RACE_GRADE}}，{{RACE_CONDITION}}）。G1的头名没有第二份；史实冠军{{HISTORICAL_WINNER_NAME}}原本站着的位置，在本局世界线里换了名字。" },
    { id: "result.win.graded", category: "result", priority: 40, when: { rank: 1, grade: ["G2", "G3", "重"] },
      title: "{{PLAYER_HORSE_NAME}}拿下{{RACE_NAME}}",
      body: "{{DATE}}，{{PLAYER_HORSE_NAME}}在{{PLAYER_JOCKEY}}策骑下拿下{{RACE_NAME}}（{{RACE_GRADE}}，{{RACE_CONDITION}}）。史实冠军{{HISTORICAL_WINNER_NAME}}被挤到身后，年鉴保留原始记录。" },
    { id: "result.win.other", category: "result", priority: 30, when: { rank: 1 },
      title: "{{PLAYER_HORSE_NAME}}拿下{{RACE_NAME}}",
      body: "{{DATE}}，{{PLAYER_HORSE_NAME}}拿下{{RACE_NAME}}（{{RACE_CONDITION}}）。这是本局世界线的结果；史实冠军{{HISTORICAL_WINNER_NAME}}原本的名次，在这一局被改写。" },
    { id: "result.place.second", category: "result", priority: 25, when: { rank: 2 },
      title: "{{RACE_NAME}}：{{WINNER_NAME}}与{{PLAYER_HORSE_NAME}}的差距",
      body: "{{DATE}}，{{RACE_NAME}}（{{RACE_GRADE}}）落幕，{{WINNER_NAME}}夺冠，{{PLAYER_HORSE_NAME}}取得{{PLAYER_RANK}}着。跑在前列，却没拿到最想要的位置——第二名的滋味，也得自己带回去。这是本局模拟的赛果，不是史实成绩。" },
    { id: "result.place.third", category: "result", priority: 24, when: { rank: [3, 4, 5] },
      title: "{{RACE_NAME}}：{{PLAYER_HORSE_NAME}}进入前五",
      body: "{{DATE}}。{{RACE_NAME}}（{{RACE_GRADE}}）里，{{PLAYER_HORSE_NAME}}跑出{{PLAYER_RANK}}着，进入前五。位置拿到了，但版面仍然是{{WINNER_NAME}}的。" },
    { id: "result.place.beaten", category: "result", priority: 20, when: { retired: false },
      title: "{{RACE_NAME}}：{{WINNER_NAME}}胜出",
      body: "{{DATE}}。{{RACE_NAME}}（{{RACE_GRADE}}）的终点，{{PLAYER_HORSE_NAME}}只拿到{{PLAYER_RANK}}着。{{WINNER_NAME}}把这一场留给了自己；名次和着差都是本局模拟出来的结果。" },
    { id: "result.retired", category: "result", priority: 35, when: { retired: true },
      title: "{{RACE_NAME}}：{{PLAYER_HORSE_NAME}}中途退赛",
      body: "{{DATE}}，{{RACE_NAME}}（{{RACE_GRADE}}）还没有跑完，{{PLAYER_HORSE_NAME}}的比赛就已结束——中途退赛。{{WINNER_NAME}}拿下这一战。对{{PLAYER_HORSE_NAME}}来说，眼下先是休养，下一次报名可以晚些再想。" },

    // —— 缺席：伤病等原因无法出赛 ——
    { id: "absent.injury", category: "absent", priority: 40,
      title: "{{PLAYER_HORSE_NAME}}缺席{{RACE_NAME}}",
      body: "{{DATE}}，原定的{{RACE_NAME}}（{{RACE_GRADE}}），{{PLAYER_HORSE_NAME}}因伤未能出赛。史实冠军{{HISTORICAL_WINNER_NAME}}照原样夺冠。少了一次上场的机会，这次缺席也留在了赛季记录里。" },

    // —— 专题与评论：由叙事标签触发 ——
    { id: "feature.triple-crown", category: "feature", priority: 90, when: { tags: ["triple-crown"] },
      title: "三冠达成：{{PLAYER_HORSE_NAME}}",
      body: "{{DATE}}，皋月赏、日本德比、菊花赏，冠军全是{{PLAYER_HORSE_NAME}}。1998年的史实里没有三冠马：皋月赏与菊花赏属于青云天空，日本德比属于特别周。这是本局世界线改写出来的三冠——三道关口，同一个名字，这一次头版只留给你的马。" },
    { id: "feature.triple-crown-candidate", category: "feature", priority: 85, when: { tags: ["triple-crown-candidate"] },
      title: "三冠候选：{{PLAYER_HORSE_NAME}}",
      body: "{{DATE}}，{{PLAYER_HORSE_NAME}}连下两场古典赛，成为本局世界线的三冠候选。还差最后一场。两冠已经够响亮，但第三冠不能靠期待赢下来。" },
    { id: "feature.crown-lost", category: "feature", priority: 80, when: { tags: ["crown-lost"] },
      title: "三冠无望之后：{{PLAYER_HORSE_NAME}}",
      body: "{{DATE}}，{{PLAYER_HORSE_NAME}}的三冠之路断了。那顶完整的冠冕，已经无缘；但三冠之外，还有可以选择的赛程。再试一场，还是先停一停，不必让这一次落空替它决定。" },
    { id: "feature.unbeaten", category: "feature", priority: 70, when: { tags: ["unbeaten"] },
      title: "不败：{{PLAYER_HORSE_NAME}}",
      body: "{{DATE}}，{{PLAYER_HORSE_NAME}}还在赢：{{STARTS}}战全胜。每多跑一场，这份不败记录就要再受一次考验。只要还要上场，就没有哪一场能凭之前的胜利免试。" },
    { id: "feature.streak", category: "feature", priority: 60, when: { tags: ["streak"] },
      title: "连胜：{{PLAYER_HORSE_NAME}}",
      body: "{{DATE}}。{{PLAYER_HORSE_NAME}}曾连下至少三场。连胜是底气，也会变成一副镣铐——赢过之后，再上场就总会被拿来和那段连胜相比：赢仿佛理所当然，输反而成了新闻。" },
    { id: "feature.slump", category: "feature", priority: 60, when: { tags: ["slump"] },
      title: "连续未胜：{{PLAYER_HORSE_NAME}}的赛季低谷",
      body: "{{DATE}}。{{PLAYER_HORSE_NAME}}经历过连续至少三场未胜的低谷。等一场胜利，曾经成了那段日子最迫切的事。低谷不是判决书，但每一次没能赢下来，都让等待又重了一分。" },
    { id: "feature.injury-return", category: "feature", priority: 75, when: { tags: ["injury-return"] },
      title: "复出：{{PLAYER_HORSE_NAME}}回到跑道",
      body: "{{DATE}}。{{PLAYER_HORSE_NAME}}已经完成恢复后的首次出赛。那段停跑的日子没有被抹去，但赛历上终于又有了它的出赛记录。先记住这次归来，胜负可以另说。" },
    { id: "feature.worldline-rewriter", category: "feature", priority: 65, when: { tags: ["worldline-rewriter"] },
      title: "改写者：{{PLAYER_HORSE_NAME}}",
      body: "{{DATE}}。在{{PLAYER_HORSE_NAME}}参与的比赛里，冠军与史实不同了。新的头名未必属于你的马，但这条世界线已经走出了另一种结果。年鉴里的原始记录照旧保留；这一局的胜负，则有了自己的去向。" },
    { id: "feature.rival", category: "feature", priority: 55, when: { hasTagPrefix: "rival:" },
      title: "宿敌对决：{{PLAYER_HORSE_NAME}}与{{RIVAL_NAME}}",
      body: "{{DATE}}，{{PLAYER_HORSE_NAME}}与{{RIVAL_NAME}}的名字被并排写进了同一张出走表。对手有了名字，这场较量也有了分量。" },
    { id: "feature.nemesis", category: "feature", priority: 56, when: { hasTagPrefix: "nemesis:" },
      title: "克星：{{RIVAL_NAME}}",
      body: "{{DATE}}。{{RIVAL_NAME}}已经多次跑在{{PLAYER_HORSE_NAME}}前面。同一个对手，反复占着更靠前的位置——这个名字，就是眼下绕不开的问题。" },

    // —— 媒体口径：由剧情片段的选择决定 ——
    { id: "media.quiet", category: "media", priority: 10,
      title: "{{PLAYER_HORSE_NAME}}：低调备战",
      body: "话说得少，不等于没话。马房把声音压到最低：下一场比赛再开口。在那之前，所有问题都交给跑道回答。" },
    { id: "media.confident", category: "media", priority: 10,
      title: "{{PLAYER_HORSE_NAME}}：正面回应期待",
      body: "马房接下了这份期待。对{{PLAYER_HORSE_NAME}}的目标，不必藏着；但话可以先说，胜负不能先算。下一场，去跑出配得上这份期待的样子。" },
  ]);
})();
