(function () {
  const ns = (window.Keiba = window.Keiba || {});

  // 首页模式卡片的唯一文案来源，由 js/ui/render.js 与 js/chairman-app.js 共同读取。
  // 文案规范见 docs/homepage-design.md，tests/ui-workspace.test.js 会校验以下约束：
  // - title 固定 4 字；badge 为空或固定 3 字
  // - tagline 9—11 字，无标点单句
  // - description 26—32 字，逗号连缀单句并以句号结尾
  // - tags 固定两枚，每枚 4 字
  // - status 为「暂无存档」或「A · B」两段式
  // - startLabel / resumeLabel 4—6 字，不含空格、斜杠与括号
  ns.HomeModes = ns.HomeModes || {};

  ns.HomeModes.copy = Object.freeze({
    career: Object.freeze({
      index: "01 / CAREER",
      icon: "assets/home/career.svg",
      title: "普通生涯",
      badge: "",
      tagline: "亲手培育你的专属赛马",
      description: "自由搭配血统与搭档，按自己的节奏规划赛程，走出专属路线。",
      tags: Object.freeze(["自由育成", "全球赛程"]),
      status: "暂无存档",
      statusLive: true,
      startLabel: "开始生涯",
      resumeLabel: "继续生涯"
    }),
    legend: Object.freeze({
      index: "02 / LEGEND",
      icon: "assets/home/legend.svg",
      title: "传奇模式",
      badge: "",
      tagline: "每场比赛迎战五匹名马",
      description: "以更高潜力出道，与历代史实名马正面对决，留下属于你的战绩。",
      tags: Object.freeze(["史实阵容", "报名锁定"]),
      status: "暂无存档",
      statusLive: true,
      startLabel: "开始传奇模式",
      resumeLabel: "继续传奇生涯"
    }),
    rogue: Object.freeze({
      index: "03 / ROGUELIKE",
      icon: "assets/home/rogue.svg",
      title: "肉鸽挑战",
      badge: "",
      tagline: "从随机候选里寻找黑马",
      description: "挑选随机小马并锁定挑战，用荣誉币让每一次重来更进一步。",
      tags: Object.freeze(["随机候选", "荣誉循环"]),
      status: "荣誉币 0 · 已解锁 1/3 位练马师",
      statusLive: true,
      startLabel: "开始肉鸽挑战",
      resumeLabel: "继续肉鸽进度"
    }),
    era: Object.freeze({
      index: "04 / STORY",
      icon: "assets/home/era.svg",
      title: "剧情模式",
      badge: "未完成",
      tagline: "走进黄金时代的故事",
      description: "踏入 1997—1998 年的赛马世界，写下属于你的赛场篇章。",
      tags: Object.freeze(["时代叙事", "剧情体验"]),
      status: "黄金世代 · 剧本开发中",
      statusLive: false,
      startLabel: "进入剧情模式"
    }),
    chairman: Object.freeze({
      index: "05 / CHAIRMAN",
      icon: "assets/home/chairman.svg",
      title: "主席模式",
      badge: "开发中",
      tagline: "经营属于你的赛马世界",
      description: "创办大赛、安排赛程、评定年度名马，以主席视角经营赛马世界。",
      tags: Object.freeze(["世界沙盒", "自由经营"]),
      status: "世界沙盒 · 内容持续扩充",
      statusLive: false,
      startLabel: "进入主席世界"
    })
  });

  ns.HomeModes.ids = Object.freeze(["career", "legend", "rogue", "era", "chairman"]);
})();
