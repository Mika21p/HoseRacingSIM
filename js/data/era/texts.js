(function () {
  const ns = (window.Keiba = window.Keiba || {});

  const REGISTERED_TOKENS = Object.freeze({
    PLAYER_REFERENCE: "马主",
    CANDIDATE_HORSE_REFERENCE: "那匹尚未命名的马",
    PLAYER_HORSE_NAME: "你的赛马",
    PLAYER_JOCKEY_NAME: "主战骑手",
    PLAYER_TRAINER_NAME: "练马师",
    RACE_NAME: "这场比赛",
    ACTUAL_WINNER_NAME: "优胜马",
    HISTORICAL_WINNER_NAME: "史实优胜马",
    PRIMARY_RIVAL_NAME: "主要对手",
    CURRENT_YEAR: "1997",
    PLAYER_FINISH: "未参赛",
    CLASSIC_WINS: "0",
    BEST_FINISH: "无",
    MISSED_RACES: "0",
    DIVERGENCE_COUNT: "0",
    LAST_RACE_NAME: "此前没有出赛记录",
    LAST_RACE_FINISH: "未出赛"
  });

  function text(id, status, category, nature, title, body, speakerId, presentation) {
    return { id, status, category, nature, speakerId: speakerId || "", presentation: presentation || "article", title, body };
  }

  function outline(id, category, nature, title, body, speakerId) {
    const normalized = /^\[[^\[\]]+\]$/.test(String(body || "")) ? String(body) : `[${String(body || "")}]`;
    return text(id, "outline", category, nature, title, normalized, speakerId, "outline");
  }

  const entries = [
    outline("jp.golden-road.main.scenario.summary", "scenario-introduction", "system", "日本黄金时代·王道路篇", "本概要说明玩家将从1997二岁阶段与{{PLAYER_HORSE_NAME}}相遇并积累经历，再进入1998经典三冠，使用玩家马动态代称，内容属于剧本简介。"),
    outline("jp.golden-road.main.scenario.objective", "scenario-objective", "system", "本期测试目标", "本概要说明{{PLAYER_HORSE_NAME}}需要完成二岁前章与三场经典赛，并让比赛、缺席和伤病进入同一世界线，内容属于操作目标。"),
    text("jp.golden-road.main.option.1997.early-debut", "final", "option-copy", "system", "中山新马战", "报名中山草地1600米新马战"),
    text("jp.golden-road.main.option.1997.early-debut-hanshin", "final", "option-copy", "system", "阪神新马战", "报名阪神草地1800米新马战"),
    text("jp.golden-road.main.option.1997.early-debut-sapporo", "final", "option-copy", "system", "札幌新马战", "报名札幌草地1800米新马战"),
    text("jp.golden-road.main.option.1997.wait-debut", "final", "option-copy", "system", "继续等待", "继续观察，暂不安排九月出道"),
    text("jp.golden-road.main.option.1997.sapporo-maiden", "final", "option-copy", "system", "札幌未胜利战", "报名札幌草地1800米未胜利战"),
    text("jp.golden-road.main.option.1997.hanshin-500", "final", "option-copy", "system", "阪神500万下", "报名阪神草地1800米500万下"),
    text("jp.golden-road.main.option.1997.sapporo-3yo", "final", "option-copy", "system", "札幌三岁锦标", "报名札幌三岁锦标"),
    text("jp.golden-road.main.option.1997.nojigiku", "final", "option-copy", "system", "野路菊锦标", "报名野路菊锦标"),
    text("jp.golden-road.main.option.1997.tokyo-maiden", "final", "option-copy", "system", "东京未胜利战", "报名东京草地1800米未胜利战"),
    text("jp.golden-road.main.option.1997.tokyo-500", "final", "option-copy", "system", "东京500万下", "报名东京草地1800米500万下"),
    text("jp.golden-road.main.option.1997.ivy", "final", "option-copy", "system", "常春藤锦标", "报名常春藤锦标"),
    text("jp.golden-road.main.option.1997.kyoto-maiden", "final", "option-copy", "system", "京都未胜利战", "报名京都草地1800米未胜利战"),
    text("jp.golden-road.main.option.1997.kigiku", "final", "option-copy", "system", "黄菊赏", "报名黄菊赏"),
    text("jp.golden-road.main.option.1997.daily-hai", "final", "option-copy", "system", "每日杯三岁锦标", "报名每日杯三岁锦标"),
    text("jp.golden-road.main.option.1997.icho", "final", "option-copy", "system", "银杏锦标", "报名银杏锦标"),
    text("jp.golden-road.main.option.1997.kyoto-500", "final", "option-copy", "system", "京都500万下", "报名京都草地1600米500万下"),
    text("jp.golden-road.main.option.1997.keisei-3yo", "final", "option-copy", "system", "京成杯三岁锦标", "报名京成杯三岁锦标"),
    text("jp.golden-road.main.option.1997.kyoto-3yo", "final", "option-copy", "system", "京都三岁锦标", "报名京都三岁锦标"),
    text("jp.golden-road.main.option.1997.tokyo-sports", "final", "option-copy", "system", "东京体育杯", "参加东京体育杯备战"),
    text("jp.golden-road.main.option.1997.skip-window", "final", "option-copy", "system", "本旬不出赛", "本旬不安排比赛，继续推进时间"),
    text("jp.golden-road.main.option.1997.skip-prep", "final", "option-copy", "system", "跳过备战", "跳过备战，直接考虑年末路线"),
    text("jp.golden-road.main.option.1997.late-debut", "final", "option-copy", "system", "东京新马战", "报名东京草地1800米新马战"),
    text("jp.golden-road.main.option.1997.late-debut-kyoto", "final", "option-copy", "system", "京都新马战", "报名京都草地1800米新马战"),
    text("jp.golden-road.main.option.1997.late-debut-fukushima", "final", "option-copy", "system", "福岛新马战", "报名福岛草地1800米新马战"),
    text("jp.golden-road.main.option.1997.defer", "final", "option-copy", "system", "暂缓至三岁", "二岁阶段暂不出赛"),
    text("jp.golden-road.main.option.1997.asahi", "final", "option-copy", "system", "朝日杯路线", "报名朝日杯三岁锦标"),
    text("jp.golden-road.main.option.1997.decline-asahi", "final", "option-copy", "system", "放弃朝日杯", "不参加朝日杯，保留电台杯选择"),
    text("jp.golden-road.main.option.1997.radio", "final", "option-copy", "system", "电台杯路线", "报名电台杯三岁锦标"),
    text("jp.golden-road.main.option.1997.finish", "final", "option-copy", "system", "结束二岁赛季", "结束二岁赛季，准备三岁春季"),
    text("jp.golden-road.main.option.1998.yayoi", "final", "option-copy", "system", "弥生赏", "参加弥生赏备战"),
    text("jp.golden-road.main.option.1998.satsuki", "final", "option-copy", "system", "皋月赏", "报名皋月赏"),
    text("jp.golden-road.main.option.1998.aoba", "final", "option-copy", "system", "青叶赏", "参加青叶赏备战"),
    text("jp.golden-road.main.option.1998.derby", "final", "option-copy", "system", "日本德比", "报名日本德比"),
    text("jp.golden-road.main.option.1998.kobe", "final", "option-copy", "system", "神户新闻杯", "参加神户新闻杯备战"),
    text("jp.golden-road.main.option.1998.kyoto-shimbun", "final", "option-copy", "system", "京都新闻杯", "参加京都新闻杯备战"),
    text("jp.golden-road.main.option.1998.kikka", "final", "option-copy", "system", "菊花赏", "报名菊花赏"),
    outline("jp.golden-road.main.entry.preview", "entry-preview", "system", "尚未命名的王道路候选马", "本概要说明一匹由佐藤悠太照料、准备从1997二岁赛季起步的牡马正在等待{{PLAYER_REFERENCE}}选择，使用玩家称呼，内容属于路线预览。", "trainer-sato-yuta"),
    outline("jp.golden-road.main.encounter.arrival", "dialogue", "fictional-dialogue", "第一次走进马房", "你以{{PLAYER_REFERENCE}}的身份来到佐藤悠太的马房，准备第一次见到为王道路篇选定的赛马，正式对白待后续细化。", "trainer-sato-yuta"),
    outline("jp.golden-road.main.encounter.first-look", "dialogue", "fictional-dialogue", "隔着栏门的第一次对视", "你在栏门外第一次观察{{CANDIDATE_HORSE_REFERENCE}}，并决定用怎样的方式回应它，具体演出待后续细化。", "trainer-sato-yuta"),
    outline("jp.golden-road.main.encounter.response.observe", "dialogue", "fictional-dialogue", "保持距离的观察", "你暂时留在原地观察，{{CANDIDATE_HORSE_REFERENCE}}也在安静判断你的来意，这句即时反应待后续细化。", "player"),
    outline("jp.golden-road.main.encounter.response.wait", "dialogue", "fictional-dialogue", "等待它作出选择", "你没有催促，{{CANDIDATE_HORSE_REFERENCE}}在等待中逐渐把注意力转向你，这句即时反应待后续细化。", "player"),
    outline("jp.golden-road.main.encounter.response.approach", "dialogue", "fictional-dialogue", "主动走近栏门", "你试着主动接近，{{CANDIDATE_HORSE_REFERENCE}}用自己的方式回应这次初次接触，这句即时反应待后续细化。", "player"),
    outline("jp.golden-road.main.encounter.assessment", "dialogue", "fictional-dialogue", "佐藤悠太的初次评估", "你听取佐藤悠太对{{CANDIDATE_HORSE_REFERENCE}}能力、场地、距离、成长与气性的五项基本准确判断，正式说明待后续细化。", "trainer-sato-yuta"),
    outline("jp.golden-road.main.encounter.naming", "dialogue", "fictional-dialogue", "为它取一个名字", "相遇告一段落，你需要为{{CANDIDATE_HORSE_REFERENCE}}确定今后写入赛程与报道的正式名字，具体演出待后续细化。", "trainer-sato-yuta"),
    outline("jp.golden-road.main.encounter.named", "dialogue", "fictional-dialogue", "从名字开始的赛季", "{{PLAYER_REFERENCE}}以玩家名牌确认接纳{{PLAYER_HORSE_NAME}}，你们从1997二岁阶段开始共同推进赛季，内容属于待细化的玩家对白。", "player"),
    outline("jp.golden-road.main.1997.decision.debut-route", "race-decision", "fictional-dialogue", "第一次出赛的时机", "本概要描写你与佐藤悠太根据{{PLAYER_HORSE_NAME}}的当前准备程度讨论九月出道或继续等待，使用玩家马代称，内容属于待细化的路线会议。", "trainer-sato-yuta"),
    outline("jp.golden-road.main.1997.decision.free-calendar", "race-decision", "fictional-dialogue", "本旬赛程选择", "你与马房根据{{PLAYER_HORSE_NAME}}已经发生的赛果和当前状态决定本旬出赛或继续等待，具体报名放入赛程手册，场景待后续细化。", "trainer-sato-yuta"),
    outline("jp.golden-road.main.1997.decision.november-calendar", "race-decision", "fictional-dialogue", "朝日杯前的最后赛程", "你与佐藤悠太在十一月上旬根据{{PLAYER_HORSE_NAME}}是否已经出道选择相应赛事或暂缓至三岁，场景待后续细化。", "trainer-sato-yuta"),
    outline("jp.golden-road.main.1997.decision.prep-route", "race-decision", "fictional-dialogue", "二岁备战的意义", "本概要描写高桥隼人根据{{PLAYER_HORSE_NAME}}的首次出赛结果讨论东京体育杯或跳过备战，承认最近比赛经历，内容属于待细化的路线会议。", "jockey-era-player-hayato"),
    outline("jp.golden-road.main.1997.decision.late-debut", "race-decision", "fictional-dialogue", "十一月的出道决定", "本概要描写你与佐藤悠太在此前未出赛的背景下讨论十一月出道或暂缓到三岁，使用{{PLAYER_HORSE_NAME}}，内容属于待细化的回退路线。", "trainer-sato-yuta"),
    outline("jp.golden-road.main.1997.decision.year-end", "race-decision", "fictional-dialogue", "二岁年末路线", "本概要描写马房根据{{PLAYER_HORSE_NAME}}最近一战选择朝日杯、电台杯或结束二岁赛季，承认出道与备战经历，内容属于待细化的年末路线会议。", "trainer-sato-yuta"),
    outline("jp.golden-road.main.1997.decision.asahi-entry", "race-decision", "fictional-dialogue", "朝日杯报名会议", "你在读完朝日杯前舆论后，与佐藤悠太确认{{PLAYER_HORSE_NAME}}是否参加十二月七日的朝日杯，正式对白待后续细化。", "trainer-sato-yuta"),
    outline("jp.golden-road.main.1997.decision.radio-entry", "race-decision", "fictional-dialogue", "放弃朝日杯后的年末选择", "你在放弃朝日杯后与马房决定{{PLAYER_HORSE_NAME}}改走电台杯或结束二岁赛季，正式对白待后续细化。", "trainer-sato-yuta"),
    outline("jp.golden-road.main.1997.opinion.star", "report", "projected", "朝日杯前舆论：二岁明星", "竞马周报将{{PLAYER_HORSE_NAME}}截至十一月十五日的重赏胜利或多胜履历列为朝日杯前的主要关注点，报道正文待后续细化。", "press-keiba-weekly"),
    outline("jp.golden-road.main.1997.opinion.injury", "report", "projected", "朝日杯前舆论：健康疑问", "竞马周报围绕伤病实际阻断{{PLAYER_HORSE_NAME}}赛程的事实评估朝日杯风险，报道正文待后续细化。", "press-keiba-weekly"),
    outline("jp.golden-road.main.1997.opinion.consistent", "report", "projected", "朝日杯前舆论：稳定竞争者", "竞马周报根据{{PLAYER_HORSE_NAME}}多次进入前三的综合成绩把它视为朝日杯的稳定竞争者，报道正文待后续细化。", "press-keiba-weekly"),
    outline("jp.golden-road.main.1997.opinion.late-debut", "report", "projected", "朝日杯前舆论：晚出道马", "竞马周报以{{PLAYER_HORSE_NAME}}十一月以后才首次出赛的短履历作为朝日杯前观察重点，报道正文待后续细化。", "press-keiba-weekly"),
    outline("jp.golden-road.main.1997.opinion.struggling", "report", "projected", "朝日杯前舆论：仍待反弹", "竞马周报依据{{PLAYER_HORSE_NAME}}截至十一月十五日的低迷综合成绩保持谨慎，报道正文待后续细化。", "press-keiba-weekly"),
    outline("jp.golden-road.main.1997.opinion.unproven", "report", "projected", "朝日杯前舆论：仍待证明", "竞马周报指出{{PLAYER_HORSE_NAME}}截至十一月十五日的比赛样本不足，朝日杯评价仍待证明，报道正文待后续细化。", "press-keiba-weekly"),
    outline("jp.golden-road.main.1997.opinion.legacy", "report", "system", "朝日杯前舆论：旧档资料有限", "竞马周报只依据旧存档能够确认的{{PLAYER_HORSE_NAME}}经历建立迁移快照，不补造二岁赛果，报道正文待后续细化。", "press-keiba-weekly"),
    outline("jp.golden-road.main.1997.summary", "season-review", "projected", "二岁赛季小结", "本概要总结{{PLAYER_HORSE_NAME}}在1997年的实际出赛、伤病与年末路线，并以相应二岁身份衔接1998，内容属于待细化的赛季回顾。", "trainer-sato-yuta"),
    outline("jp.golden-road.main.1997.post.win", "post-race", "alternate", "二岁重要赛被改写", "本概要描写{{PLAYER_HORSE_NAME}}赢得{{RACE_NAME}}后马房对二岁成就的即时反应，承认实际优胜马改变，内容属于待细化的赛后人物场景。", "trainer-sato-yuta"),
    outline("jp.golden-road.main.1997.post.close", "post-race", "alternate", "年末舞台上的竞争者", "本概要描写{{PLAYER_HORSE_NAME}}以{{PLAYER_FINISH}}完成{{RACE_NAME}}后相关人员对其二岁定位的判断，内容属于待细化的赛后人物场景。", "jockey-era-player-hayato"),
    outline("jp.golden-road.main.1997.post.loss", "post-race", "alternate", "二岁赛季留下的问题", "本概要描写{{PLAYER_HORSE_NAME}}在{{RACE_NAME}}落败后马房将结果带入三岁春季，承认实际赛果，内容属于待细化的赛后人物场景。", "trainer-sato-yuta"),
    outline("jp.golden-road.main.1997.post.absent", "post-race", "historical", "从场外结束二岁赛季", "本概要描写{{PLAYER_HORSE_NAME}}因已记录原因缺席{{RACE_NAME}}后，马房从{{HISTORICAL_WINNER_NAME}}的史实结果转向三岁，内容属于待细化的缺席场景。", "press-keiba-weekly"),
    outline(
      "jp.golden-road.main.1998.prologue.open",
      "dialogue",
      "fictional-dialogue",
      "经典之门",
      "{{PLAYER_REFERENCE}}，你与佐藤悠太围绕{{PLAYER_HORSE_NAME}}进入1998经典世代的目标展开赛季会议，正式对白待后续细化。",
      "trainer-sato-yuta"
    ),
    outline(
      "jp.golden-road.main.1998.season.goal",
      "route-tip",
      "system",
      "1998经典赛季目标",
      "本场景说明{{PLAYER_HORSE_NAME}}将通过备战选择和三场经典赛形成自己的赛季记录，具体演出待后续细化。"
    ),
    outline("jp.golden-road.main.1998.scene.player-declaration", "dialogue", "fictional-dialogue", "你的赛季宣言", "你以{{PLAYER_REFERENCE}}的发言名牌确认将和{{PLAYER_HORSE_NAME}}挑战1998经典赛季，正式台词待后续细化。", "player"),

    outline("jp.golden-road.main.1998.satsuki.pre.background", "historical-background", "historical", "皋月赏前夜", "特别周、青云天空和帝王光环在中山集结，{{PLAYER_HORSE_NAME}}介入第一冠前夜的群像场景待后续细化。", "jockey-norihiro-yokoyama"),
    outline("jp.golden-road.main.1998.derby.pre.background", "historical-background", "historical", "东京的二千四百米", "你从赛场动向中看见武豊与特别周成为东京焦点，并根据{{PLAYER_HORSE_NAME}}的春季战绩准备日本德比，场景待后续细化。", "jockey-take-yutaka"),
    outline("jp.golden-road.main.1998.kikka.pre.background", "historical-background", "historical", "京都的最后一冠", "横山典弘、武豊与福永祐一进入京都决战，{{PLAYER_HORSE_NAME}}面对最后一冠的场景待后续细化。", "jockey-yuichi-fukunaga"),

    outline("jp.golden-road.main.1998.satsuki.post.win", "post-race", "alternate", "第一冠被改写", "{{PLAYER_HORSE_NAME}}赢下皋月赏后，马房与史实阵营重新评价第一冠结果的场景待后续细化。", "trainer-sato-yuta"),
    outline("jp.golden-road.main.1998.satsuki.post.close", "post-race", "alternate", "中山留下的距离", "{{PLAYER_HORSE_NAME}}以{{PLAYER_FINISH}}完成皋月赏后，相关人员讨论与{{ACTUAL_WINNER_NAME}}差距的场景待后续细化。", "jockey-era-player-hayato"),
    outline("jp.golden-road.main.1998.satsuki.post.loss", "post-race", "alternate", "第一冠之后", "{{PLAYER_HORSE_NAME}}在皋月赏失利后，你与马房重新规划东京路线的场景待后续细化。", "trainer-sato-yuta"),
    outline("jp.golden-road.main.1998.satsuki.post.absent", "post-race", "historical", "旁观第一冠", "{{PLAYER_HORSE_NAME}}缺席皋月赏后，马房从{{HISTORICAL_WINNER_NAME}}夺冠的报道中重新接入赛季的场景待后续细化。", "press-keiba-weekly"),

    outline("jp.golden-road.main.1998.derby.post.win", "post-race", "alternate", "东京的新德比马", "{{PLAYER_HORSE_NAME}}成为德比马后，东京赛场各方回应历史改写的群像场景待后续细化。", "race-announcer"),
    outline("jp.golden-road.main.1998.derby.post.close", "post-race", "alternate", "德比终点之前", "{{PLAYER_HORSE_NAME}}以{{PLAYER_FINISH}}完成日本德比后，马房与{{ACTUAL_WINNER_NAME}}阵营的赛后场景待后续细化。", "jockey-era-player-hayato"),
    outline("jp.golden-road.main.1998.derby.post.loss", "post-race", "alternate", "东京之后仍有秋天", "日本德比失利后，你与佐藤悠太把目标转向秋季京都的场景待后续细化。", "trainer-sato-yuta"),
    outline("jp.golden-road.main.1998.derby.post.absent", "post-race", "historical", "没有站上的德比跑道", "{{PLAYER_HORSE_NAME}}缺席日本德比后，马房阅读{{HISTORICAL_WINNER_NAME}}夺冠报道的场景待后续细化。", "press-keiba-weekly"),

    outline("jp.golden-road.main.1998.kikka.post.win", "post-race", "alternate", "最后一冠的回答", "{{PLAYER_HORSE_NAME}}赢下菊花赏后，京都赛场为玩家马写下经典评价的场景待后续细化。", "race-announcer"),
    outline("jp.golden-road.main.1998.kikka.post.close", "post-race", "alternate", "京都的终点", "{{PLAYER_HORSE_NAME}}以{{PLAYER_FINISH}}完成菊花赏后，主要骑手回顾经典赛季的群像场景待后续细化。", "jockey-take-yutaka"),
    outline("jp.golden-road.main.1998.kikka.post.loss", "post-race", "alternate", "经典赛季落幕", "菊花赏失利后，你与马房整理三场经典赛结论的场景待后续细化。", "trainer-sato-yuta"),
    outline("jp.golden-road.main.1998.kikka.post.absent", "post-race", "historical", "从场外看见最后一冠", "{{PLAYER_HORSE_NAME}}缺席菊花赏后，{{HISTORICAL_WINNER_NAME}}夺冠与玩家赛季收束的场景待后续细化。", "press-keiba-weekly"),

    outline("jp.golden-road.main.1998.season.triple-alive", "route-tip", "system", "三冠可能仍在延续", "{{PLAYER_HORSE_NAME}}仍保有三冠可能，下一阶段对话与报道方向待后续细化。"),
    outline("jp.golden-road.main.1998.season.triple-lost", "route-tip", "system", "三冠路线已经改变", "{{PLAYER_HORSE_NAME}}失去三冠可能后转向经典胜场与世代评价的场景待后续细化。"),
    outline("jp.golden-road.main.1998.season.review", "season-review", "projected", "经典赛季回顾", "本概要按照实际发生的三场经典赛、缺席、伤病与世界线分歧回顾{{PLAYER_HORSE_NAME}}的1998赛季，年度结论将在下一场景确认。", "trainer-sato-yuta"),

    outline("jp.golden-road.main.1998.scene.jockey-first-impression", "dialogue", "fictional-dialogue", "主战骑手的第一印象", "你听取高桥隼人对{{PLAYER_HORSE_NAME}}首次骑乘感受的汇报，场景待后续细化。", "jockey-era-player-hayato"),
    outline("jp.golden-road.main.1998.scene.generation-desk", "report", "historical", "黄金世代版面会议", "竞马周报编辑部梳理特别周、青云天空、帝王光环与{{PLAYER_HORSE_NAME}}关注度的场景待后续细化。", "press-keiba-weekly"),
    outline("jp.golden-road.main.1998.decision.satsuki-route", "race-decision", "fictional-dialogue", "通往中山的第一份计划", "你与佐藤悠太讨论弥生赏热身或直行皋月赏的赛程选择，正式对白待后续细化。", "trainer-sato-yuta"),
    outline("jp.golden-road.main.1998.decision.satsuki-confirm", "race-decision", "fictional-dialogue", "确认第一冠", "皋月赏报名截止前，马房确认参赛或放弃第一冠的场景待后续细化。", "trainer-sato-yuta"),
    outline("jp.golden-road.main.1998.decision.derby-route", "race-decision", "fictional-dialogue", "东京路线会议", "佐藤悠太与高桥隼人讨论青叶赏热身或直行日本德比的场景待后续细化。", "jockey-era-player-hayato"),
    outline("jp.golden-road.main.1998.decision.derby-confirm", "race-decision", "fictional-dialogue", "确认德比席位", "日本德比报名截止前，你与马房确认东京参赛计划的场景待后续细化。", "trainer-sato-yuta"),
    outline("jp.golden-road.main.1998.scene.summer-stable", "dialogue", "fictional-dialogue", "经典赛季的夏天", "马房在夏季整理{{PLAYER_HORSE_NAME}}春季表现并准备秋季长距离路线的场景待后续细化。", "trainer-sato-yuta"),
    outline("jp.golden-road.main.1998.decision.kikka-route", "race-decision", "fictional-dialogue", "秋季路线会议", "你与马房在神户新闻杯、京都新闻杯和直行菊花赏之间作出选择，场景待后续细化。", "trainer-sato-yuta"),
    outline("jp.golden-road.main.1998.decision.kikka-followup", "race-decision", "fictional-dialogue", "京都之前的最后调整", "秋季备战结束后，马房讨论追加京都新闻杯或直接进入菊花赏的场景待后续细化。", "jockey-era-player-hayato"),
    outline("jp.golden-road.main.1998.decision.kikka-confirm", "race-decision", "fictional-dialogue", "确认最后一冠", "菊花赏报名截止前，你与相关人员确认经典赛季最后选择，场景待后续细化。", "trainer-sato-yuta"),
    text("jp.golden-road.main.1998.time.passage", "final", "time", "system", "赛季日历翻页", "时间由{{LAST_RACE_NAME}}推进至{{RACE_NAME}}，期间没有需要单独结算的比赛事件。"),
    text("jp.golden-road.main.1998.time.forced-rest", "final", "time", "system", "伤病休养日程", "{{PLAYER_HORSE_NAME}}仍在强制休养期，本旬不能报名比赛；预计休养节点为{{RACE_NAME}}。", "trainer-sato-yuta"),
    text("jp.golden-road.main.1998.race.result", "final", "race-result", "alternate", "{{RACE_NAME}}赛果", "{{PLAYER_HORSE_NAME}}以{{PLAYER_FINISH}}完成{{RACE_NAME}}，本场结果已经写入赛季记录。"),

    text("jp.golden-road.main.1998.news.win", "final", "news", "alternate", "{{PLAYER_HORSE_NAME}}夺得{{RACE_NAME}}", "{{PLAYER_HORSE_NAME}}在{{RACE_NAME}}击败同世代强敌，史实优胜马{{HISTORICAL_WINNER_NAME}}的冠军记录在当前世界线中被改写。"),
    text("jp.golden-road.main.1998.news.close", "final", "news", "alternate", "{{RACE_NAME}}形成新的竞争格局", "{{ACTUAL_WINNER_NAME}}赢得{{RACE_NAME}}，{{PLAYER_HORSE_NAME}}以{{PLAYER_FINISH}}紧随其后，并进入这一世代的主要竞争叙事。"),
    text("jp.golden-road.main.1998.news.loss", "final", "news", "alternate", "{{ACTUAL_WINNER_NAME}}赢得{{RACE_NAME}}", "{{PLAYER_HORSE_NAME}}以{{PLAYER_FINISH}}完成{{RACE_NAME}}。胜负已经确认，但其后续影响仍将延续到下一场经典赛。"),
    text("jp.golden-road.main.1998.news.absent", "final", "news", "historical", "{{HISTORICAL_WINNER_NAME}}赢得{{RACE_NAME}}", "{{PLAYER_HORSE_NAME}}缺席本场比赛，{{RACE_NAME}}由史实优胜马{{HISTORICAL_WINNER_NAME}}取得胜利。"),

    text("jp.golden-road.main.1998.chronicle.win", "final", "chronicle", "alternate", "历史分歧：{{RACE_NAME}}", "{{PLAYER_HORSE_NAME}}以第一名完成{{RACE_NAME}}；史实优胜马为{{HISTORICAL_WINNER_NAME}}。"),
    text("jp.golden-road.main.1998.chronicle.close", "final", "chronicle", "alternate", "竞争介入：{{RACE_NAME}}", "{{PLAYER_HORSE_NAME}}以{{PLAYER_FINISH}}完成{{RACE_NAME}}，实际优胜马为{{ACTUAL_WINNER_NAME}}。"),
    text("jp.golden-road.main.1998.chronicle.loss", "final", "chronicle", "alternate", "世界线记录：{{RACE_NAME}}", "{{PLAYER_HORSE_NAME}}以{{PLAYER_FINISH}}完成{{RACE_NAME}}，实际优胜马为{{ACTUAL_WINNER_NAME}}。"),
    text("jp.golden-road.main.1998.chronicle.absent", "final", "chronicle", "historical", "旁观历史：{{RACE_NAME}}", "{{PLAYER_HORSE_NAME}}未参赛；{{HISTORICAL_WINNER_NAME}}按史实赢得{{RACE_NAME}}。"),

    text("jp.golden-road.main.1998.ending.triple", "final", "stage-ending", "projected", "新的三冠马", "{{PLAYER_HORSE_NAME}}三战三胜，完成1998经典三冠。三场史实优胜结果全部被改写，这条世界线由玩家赛马居于中心。"),
    text("jp.golden-road.main.1998.ending.partial", "final", "stage-ending", "projected", "经典冠军的一季", "{{PLAYER_HORSE_NAME}}赢得{{CLASSIC_WINS}}场经典赛，最佳名次为{{BEST_FINISH}}。虽然未完成三冠，但已经改变了1998世代的冠军分布。"),
    text("jp.golden-road.main.1998.ending.none", "final", "stage-ending", "projected", "没有冠军也被记录的赛季", "{{PLAYER_HORSE_NAME}}完成经典赛季但未赢得一冠，最佳名次为{{BEST_FINISH}}。竞争、落败和实际优胜马共同构成了完整的世界线。"),
    text("jp.golden-road.main.1998.ending.absent", "final", "stage-ending", "projected", "未完整出走的经典赛季", "{{PLAYER_HORSE_NAME}}错过{{MISSED_RACES}}场关键比赛。缺席没有抹去故事；参加过的比赛、旁观的史实与{{DIVERGENCE_COUNT}}处分歧均已保存。"),
    text("jp.golden-road.main.1998.ending.injury", "final", "stage-ending", "projected", "因伤中止的1998年", "伤病迫使{{PLAYER_HORSE_NAME}}提前结束经典赛季。已经发生的胜负、新闻和年代纪事全部保留，未出赛部分以伤病世界线结算。"),
    text("jp.golden-road.main.1998.ending.retired", "final", "stage-ending", "projected", "提前退役的世界线", "{{PLAYER_HORSE_NAME}}在赛季结束前退役。已经完成的比赛仍然有效，其余经典目标以提前退役结局收束。"),
    text("jp.golden-road.main.1998.fallback", "final", "fallback", "system", "世界线继续", "{{RACE_NAME}}已经结算。系统未找到更具体的组合文本，因此保留实际优胜马{{ACTUAL_WINNER_NAME}}与玩家名次{{PLAYER_FINISH}}，继续推进当前世界线。"),

    outline("jp.golden-road.main.context.two-year.star", "narrative-context", "projected", "二岁明星的履历", "本概要承认{{PLAYER_HORSE_NAME}}在二岁重要赛获胜或已经累积至少两胜，并把这项成就作为当前场景的历史背景。"),
    outline("jp.golden-road.main.context.two-year.consistent", "narrative-context", "projected", "稳定累积的二岁赛季", "本概要承认{{PLAYER_HORSE_NAME}}二岁阶段多次进入前三，并把稳定表现作为当前判断的历史背景。"),
    outline("jp.golden-road.main.context.two-year.unproven", "narrative-context", "projected", "仍待证明的二岁履历", "本概要承认{{PLAYER_HORSE_NAME}}没有足够二岁比赛可形成明确定位，并保留其尚待证明的历史背景。"),
    outline("jp.golden-road.main.context.two-year.late-debut", "narrative-context", "projected", "晚出道留下的空间", "本概要承认{{PLAYER_HORSE_NAME}}在十一月以后才首次出赛，并把较短履历作为当前场景的历史背景。"),
    outline("jp.golden-road.main.context.two-year.struggling", "narrative-context", "projected", "二岁赛季的未决课题", "本概要承认{{PLAYER_HORSE_NAME}}二岁阶段多数成绩在第四名以后或尚无前三，并让这些实际结果进入当前判断。"),
    outline("jp.golden-road.main.context.two-year.injury", "narrative-context", "projected", "被伤病打断的二岁计划", "本概要承认伤病实际阻断{{PLAYER_HORSE_NAME}}的二岁计划赛事，并把恢复情况作为当前场景的历史背景。"),
    outline("jp.golden-road.main.context.two-year.legacy", "narrative-context", "system", "未记录的二岁履历", "本概要说明旧版存档没有可确认的1997经历，因此只标记履历未记录，不补造任何二岁赛果。"),

    outline("jp.golden-road.main.context.spring.unbeaten", "narrative-context", "projected", "保持不败的春季评价", "本概要承认{{PLAYER_HORSE_NAME}}最近的春季备战胜利延续不败，并概括相关人员的谨慎期待。", "trainer-sato-yuta"),
    outline("jp.golden-road.main.context.spring.prep-winner", "narrative-context", "projected", "前哨胜者的春季评价", "本概要承认{{PLAYER_HORSE_NAME}}赢得最近一场春季前哨，并概括相关人员对经典赛资格的重新判断。", "jockey-era-player-hayato"),
    outline("jp.golden-road.main.context.spring.consistent", "narrative-context", "projected", "稳定竞争者的春季评价", "本概要承认{{PLAYER_HORSE_NAME}}最近一场春季比赛进入前三，并概括相关人员对其竞争力的判断。", "trainer-sato-yuta"),
    outline("jp.golden-road.main.context.spring.uncertain", "narrative-context", "projected", "状态未明的春季评价", "本概要承认{{PLAYER_HORSE_NAME}}最近一场春季表现没有消除疑问，并概括相关人员仍需确认的课题。", "trainer-sato-yuta"),
    outline("jp.golden-road.main.context.spring.rebound", "narrative-context", "projected", "回升后的春季评价", "本概要承认{{PLAYER_HORSE_NAME}}从此前失利或伤愈状态中回升至前三，并概括相关人员对反弹的判断。", "jockey-era-player-hayato"),
    outline("jp.golden-road.main.context.spring.health-question", "narrative-context", "projected", "健康疑问下的春季评价", "本概要承认{{PLAYER_HORSE_NAME}}的伤病或休养已经影响赛程，并概括相关人员对能否顺利出赛的担忧。", "trainer-sato-yuta"),
    outline("jp.golden-road.main.context.spring.direct-entry", "narrative-context", "projected", "直行经典赛的春季评价", "本概要承认{{PLAYER_HORSE_NAME}}没有春季前哨赛果，并概括相关人员对直行经典赛的不确定判断。", "trainer-sato-yuta"),

    outline("jp.golden-road.main.context.worldline.historical", "narrative-context", "historical", "仍与史实并行", "本概要说明截至当前节点的实际优胜马仍与已登记史实一致，世界线暂未因比赛结果产生明确分歧。"),
    outline("jp.golden-road.main.context.worldline.player", "narrative-context", "alternate", "玩家马改写世界线", "本概要说明{{PLAYER_HORSE_NAME}}已经通过实际比赛结果改写至少一项已登记史实，并承认这处分歧。"),
    outline("jp.golden-road.main.context.worldline.rival", "narrative-context", "alternate", "其他赛马改写世界线", "本概要说明已有非史实优胜马通过实际比赛结果改写已登记史实，并承认这处分歧。"),

    outline("jp.golden-road.main.context.question.satsuki", "narrative-context", "projected", "下一问题：第一冠资格", "本概要把{{PLAYER_HORSE_NAME}}能否在皋月赏证明经典资格作为后续场景需要回答的问题。"),
    outline("jp.golden-road.main.context.question.derby", "narrative-context", "projected", "下一问题：东京的回应", "本概要把{{PLAYER_HORSE_NAME}}如何在日本德比回应第一冠结果作为后续场景需要回答的问题。"),
    outline("jp.golden-road.main.context.question.kikka", "narrative-context", "projected", "下一问题：最后一冠的意义", "本概要把{{PLAYER_HORSE_NAME}}如何在菊花赏定义经典赛季作为后续场景需要回答的问题。"),
    outline("jp.golden-road.main.context.question.final", "narrative-context", "projected", "最终问题：世界线如何被记住", "本概要把实际胜负、缺席和伤病共同形成的世界线如何被总结作为年度结局需要回答的问题。"),

    text("jp.golden-road.main.1999.spring.placeholder", "placeholder", "chapter-opening", "projected", "古马王道之春", "[在1999年春季根据1998三冠赛的实际结果展开古马王道路，承认{{PLAYER_HORSE_NAME}}的经典胜场、伤病与退役状态，使用{{PRIMARY_RIVAL_NAME}}，并明确本段属于时代推演。]"),
    text("jp.golden-road.main.1999.autumn.placeholder", "placeholder", "stage-ending", "projected", "黄金时代的秋天", "[在1999年秋季总结天皇赏、杰出杯与有马纪念方向的世界线，承认此前所有历史分歧，使用{{ACTUAL_WINNER_NAME}}和{{PLAYER_HORSE_NAME}}，并明确本段属于时代推演。]")
  ];

  entries.push(
    outline("jp.golden-road.main.1998.report.satsuki.unproven", "dynamic-report", "projected", "皋月赏前瞻 · 未经检验", "此前没有出赛记录，报道将把{{PLAYER_HORSE_NAME}}视为首次接受皋月赏检验的新面孔，正式报道正文待后续细化。", "press-keiba-weekly"),
    outline("jp.golden-road.main.1998.report.satsuki.winner", "dynamic-report", "projected", "皋月赏前瞻 · 胜势正盛", "最近一战{{LAST_RACE_NAME}}获胜，报道将把{{PLAYER_HORSE_NAME}}列为状态强势的皋月赏焦点马，正式报道正文待后续细化。", "press-keiba-weekly"),
    outline("jp.golden-road.main.1998.report.satsuki.contender", "dynamic-report", "projected", "皋月赏前瞻 · 有力竞争", "最近一战{{LAST_RACE_NAME}}取得{{LAST_RACE_FINISH}}，报道将把{{PLAYER_HORSE_NAME}}列入皋月赏有力竞争者，正式报道正文待后续细化。", "press-keiba-weekly"),
    outline("jp.golden-road.main.1998.report.satsuki.mixed", "dynamic-report", "projected", "皋月赏前瞻 · 谨慎观察", "最近一战{{LAST_RACE_NAME}}取得{{LAST_RACE_FINISH}}，报道将谨慎评价{{PLAYER_HORSE_NAME}}的皋月赏上限，正式报道正文待后续细化。", "press-keiba-weekly"),
    outline("jp.golden-road.main.1998.report.satsuki.outsider", "dynamic-report", "projected", "皋月赏前瞻 · 挑战者", "最近一战{{LAST_RACE_NAME}}取得{{LAST_RACE_FINISH}}，报道将把{{PLAYER_HORSE_NAME}}置于皋月赏受疑挑战者的位置，正式报道正文待后续细化。", "press-keiba-weekly"),
    outline("jp.golden-road.main.1998.report.satsuki.health-question", "dynamic-report", "projected", "皋月赏前瞻 · 健康疑问", "最近一战或当前休养状态引发健康疑问，报道将聚焦{{PLAYER_HORSE_NAME}}能否顺利参加皋月赏，正式报道正文待后续细化。", "press-keiba-weekly"),
    outline("jp.golden-road.main.1998.report.derby.unproven", "dynamic-report", "projected", "日本德比前瞻 · 未经检验", "此前没有出赛记录，报道将把{{PLAYER_HORSE_NAME}}视为首次接受日本德比检验的新面孔，正式报道正文待后续细化。", "press-keiba-weekly"),
    outline("jp.golden-road.main.1998.report.derby.winner", "dynamic-report", "projected", "日本德比前瞻 · 胜势正盛", "最近一战{{LAST_RACE_NAME}}获胜，报道将把{{PLAYER_HORSE_NAME}}列为状态强势的日本德比焦点马，正式报道正文待后续细化。", "press-keiba-weekly"),
    outline("jp.golden-road.main.1998.report.derby.contender", "dynamic-report", "projected", "日本德比前瞻 · 有力竞争", "最近一战{{LAST_RACE_NAME}}取得{{LAST_RACE_FINISH}}，报道将把{{PLAYER_HORSE_NAME}}列入日本德比有力竞争者，正式报道正文待后续细化。", "press-keiba-weekly"),
    outline("jp.golden-road.main.1998.report.derby.mixed", "dynamic-report", "projected", "日本德比前瞻 · 谨慎观察", "最近一战{{LAST_RACE_NAME}}取得{{LAST_RACE_FINISH}}，报道将谨慎评价{{PLAYER_HORSE_NAME}}的日本德比上限，正式报道正文待后续细化。", "press-keiba-weekly"),
    outline("jp.golden-road.main.1998.report.derby.outsider", "dynamic-report", "projected", "日本德比前瞻 · 挑战者", "最近一战{{LAST_RACE_NAME}}取得{{LAST_RACE_FINISH}}，报道将把{{PLAYER_HORSE_NAME}}置于日本德比受疑挑战者的位置，正式报道正文待后续细化。", "press-keiba-weekly"),
    outline("jp.golden-road.main.1998.report.derby.health-question", "dynamic-report", "projected", "日本德比前瞻 · 健康疑问", "最近一战或当前休养状态引发健康疑问，报道将聚焦{{PLAYER_HORSE_NAME}}能否顺利参加日本德比，正式报道正文待后续细化。", "press-keiba-weekly"),
    outline("jp.golden-road.main.1998.report.kikka.unproven", "dynamic-report", "projected", "菊花赏前瞻 · 未经检验", "此前没有出赛记录，报道将把{{PLAYER_HORSE_NAME}}视为首次接受菊花赏检验的新面孔，正式报道正文待后续细化。", "press-keiba-weekly"),
    outline("jp.golden-road.main.1998.report.kikka.winner", "dynamic-report", "projected", "菊花赏前瞻 · 胜势正盛", "最近一战{{LAST_RACE_NAME}}获胜，报道将把{{PLAYER_HORSE_NAME}}列为状态强势的菊花赏焦点马，正式报道正文待后续细化。", "press-keiba-weekly"),
    outline("jp.golden-road.main.1998.report.kikka.contender", "dynamic-report", "projected", "菊花赏前瞻 · 有力竞争", "最近一战{{LAST_RACE_NAME}}取得{{LAST_RACE_FINISH}}，报道将把{{PLAYER_HORSE_NAME}}列入菊花赏有力竞争者，正式报道正文待后续细化。", "press-keiba-weekly"),
    outline("jp.golden-road.main.1998.report.kikka.mixed", "dynamic-report", "projected", "菊花赏前瞻 · 谨慎观察", "最近一战{{LAST_RACE_NAME}}取得{{LAST_RACE_FINISH}}，报道将谨慎评价{{PLAYER_HORSE_NAME}}的菊花赏上限，正式报道正文待后续细化。", "press-keiba-weekly"),
    outline("jp.golden-road.main.1998.report.kikka.outsider", "dynamic-report", "projected", "菊花赏前瞻 · 挑战者", "最近一战{{LAST_RACE_NAME}}取得{{LAST_RACE_FINISH}}，报道将把{{PLAYER_HORSE_NAME}}置于菊花赏受疑挑战者的位置，正式报道正文待后续细化。", "press-keiba-weekly"),
    outline("jp.golden-road.main.1998.report.kikka.health-question", "dynamic-report", "projected", "菊花赏前瞻 · 健康疑问", "最近一战或当前休养状态引发健康疑问，报道将聚焦{{PLAYER_HORSE_NAME}}能否顺利参加菊花赏，正式报道正文待后续细化。", "press-keiba-weekly")
  );

  const byId = new Map();
  entries.forEach((entry) => {
    if (!byId.has(entry.id)) byId.set(entry.id, entry);
  });

  function get(textId) {
    return byId.get(textId) || null;
  }

  function tokenNames(value) {
    const names = [];
    String(value || "").replace(/\{\{([A-Z0-9_]+)\}\}/g, (_match, name) => {
      names.push(name);
      return _match;
    });
    return names;
  }

  function replaceOnce(value, tokens) {
    const snapshot = { ...REGISTERED_TOKENS, ...(tokens || {}) };
    return String(value || "").replace(/\{\{([A-Z0-9_]+)\}\}/g, (_match, name) => {
      const replacement = Object.prototype.hasOwnProperty.call(snapshot, name)
        ? snapshot[name]
        : REGISTERED_TOKENS[name];
      return replacement == null ? "" : String(replacement);
    });
  }

  function resolve(textId, tokens, options) {
    const entry = get(textId);
    if (!entry) throw new Error(`Unknown era text id: ${textId}`);
    if (entry.status === "placeholder" && !(options && options.allowPlaceholder)) {
      throw new Error(`Placeholder era text cannot be displayed: ${textId}`);
    }
    return {
      ...entry,
      title: replaceOnce(entry.title, tokens),
      body: replaceOnce(entry.body, tokens)
    };
  }

  function validate() {
    const warnings = [];
    const seen = new Set();
    entries.forEach((entry) => {
      if (seen.has(entry.id)) warnings.push({ type: "duplicate-text-id", textId: entry.id });
      seen.add(entry.id);
      if (!entry.id || !["placeholder", "outline", "draft", "final"].includes(entry.status)) {
        warnings.push({ type: "invalid-text-entry", textId: entry.id || "" });
      }
      tokenNames(`${entry.title}\n${entry.body}`).forEach((name) => {
        if (!Object.prototype.hasOwnProperty.call(REGISTERED_TOKENS, name)) {
          warnings.push({ type: "unknown-token", textId: entry.id, token: name });
        }
      });
      if (entry.status === "placeholder" && !/^\[[\s\S]+\]$/.test(entry.body || "")) {
        warnings.push({ type: "invalid-placeholder", textId: entry.id });
      }
      if (entry.status === "outline" && !/^\[[^\[\]]+\]$/.test(entry.body || "")) {
        warnings.push({ type: "invalid-outline", textId: entry.id });
      }
    });
    return warnings;
  }

  function findPlaceholders() {
    return entries.filter((entry) => entry.status === "placeholder").slice();
  }

  ns.EraTextIndex = {
    ALL: entries,
    REGISTERED_TOKENS,
    get,
    resolve,
    validate,
    findPlaceholders,
    replaceOnce
  };
})();
