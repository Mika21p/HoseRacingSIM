(function () {
  const ns = (window.Keiba = window.Keiba || {});
  const sharedNews = {
    win: "jp.golden-road.main.1998.news.win",
    close: "jp.golden-road.main.1998.news.close",
    loss: "jp.golden-road.main.1998.news.loss",
    absent: "jp.golden-road.main.1998.news.absent"
  };
  const sharedChronicle = {
    win: "jp.golden-road.main.1998.chronicle.win",
    close: "jp.golden-road.main.1998.chronicle.close",
    loss: "jp.golden-road.main.1998.chronicle.loss",
    absent: "jp.golden-road.main.1998.chronicle.absent"
  };

  function participant(horseId, historicalFinish, ability, historicalScore, jockeyId, jockeyName, riderAbility) {
    return { horseId, historicalFinish, ability, historicalScore, jockeyId: jockeyId || "", jockeyName, riderAbility };
  }

  ns.EraScenarioRegistry.register({
    id: "jp-golden-road",
    routeId: "main",
    defaultScenarioId: "jp-golden-road",
    name: "日本黄金时代·王道路篇",
    displayModeName: "剧情模式",
    seasonTitle: "你的1997—1998经典赛季",
    historicalStartYear: 1997,
    historicalEndYear: 1999,
    playableStart: { date: "1997-06-01", age: 2, month: 6, half: 1 },
    playableEnd: { date: "1998-11-30", age: 3, month: 11, half: 2 },
    textNamespace: "jp.golden-road.main",
    timeLabelRules: { firstHalfDay: 1, secondHalfDay: 16, yearFromHorseBirthAndAge: true },
    scenePriorities: { time: 5, "race-result": 10, ending: 15, dialogue: 20, "race-decision": 25, "dynamic-report": 30, news: 40 },
    historicalRange: [1997, 1999],
    playableRange: [1997, 1998],
    stageLabel: "二岁前章与经典三冠测试版",
    summary: "从1997二岁赛季开始积累真实经历，再以原创赛马介入1998经典三冠。",
    objective: "完成二岁前章与皋月赏、日本德比、菊花赏，让胜负、缺席和伤病共同构成世界线。",
    summaryTextId: "jp.golden-road.main.scenario.summary",
    objectiveTextId: "jp.golden-road.main.scenario.objective",
    entryCandidate: {
      id: "jp-golden-road-main-entry",
      title: "尚未命名的王道路候选马",
      routeLabel: "日本黄金时代·王道路篇",
      previewTextId: "jp.golden-road.main.entry.preview"
    },
    sources: {
      asahi: "https://www.jra.go.jp/datafile/seiseki/g1/afs/result/afs1997.html",
      radioTampa: "https://www.jra.go.jp/JRADB/accessS.html?CNAME=pw01sde1009199705071119971220%2FE6",
      satsuki: "https://www.jra.go.jp/datafile/seiseki/g1/satsuki/result/satsuki1998.html",
      derby: "https://www.jra.go.jp/datafile/seiseki/g1/derby/result/derby1998.html",
      kikka: "https://www.jra.go.jp/datafile/seiseki/g1/kikka/result/kikka1998.html"
    },
    playerTemplate: {
      birthYear: 1995,
      gender: "牡马",
      homeRegionId: "japan",
      surfacePref: "草地",
      coreDist: 2400,
      distMin: 1800,
      distMax: 3000,
      strengthMin: 81,
      strengthMax: 85,
      growthType: "普早",
      peakStart: "三岁春",
      peakEnd: "三岁秋",
      commentAccuracy: "close",
      trainerId: "sato-yuta",
      playerJockey: {
        id: "era-player-jockey-hayato",
        name: "高桥隼人",
        ability: 70,
        fictional: true
      }
    },
    characters: {
      player: { id: "player", nameToken: "PLAYER_REFERENCE", role: "马主", side: "player", fictional: true },
      "trainer-sato-yuta": { id: "trainer-sato-yuta", name: "佐藤悠太", role: "练马师", side: "player", fictional: true },
      "jockey-era-player-hayato": { id: "jockey-era-player-hayato", sourceId: "era-player-jockey-hayato", name: "高桥隼人", role: "主战骑手", side: "player", fictional: true },
      "jockey-take-yutaka": { id: "jockey-take-yutaka", sourceId: "take-yutaka", name: "武豊", role: "特别周主战骑手", side: "historical" },
      "jockey-norihiro-yokoyama": { id: "jockey-norihiro-yokoyama", sourceId: "norihiro-yokoyama", name: "横山典弘", role: "青云天空主战骑手", side: "historical" },
      "jockey-yuichi-fukunaga": { id: "jockey-yuichi-fukunaga", sourceId: "yuichi-fukunaga", name: "福永祐一", role: "帝王光环主战骑手", side: "historical" },
      "jockey-mikio-matsunaga": { id: "jockey-mikio-matsunaga", sourceId: "mikio-matsunaga", name: "松永幹夫", role: "心潮激荡主战骑手", side: "historical" },
      "jockey-okabe-yukio": { id: "jockey-okabe-yukio", sourceId: "okabe-yukio", name: "岡部幸雄", role: "神圣之光主战骑手", side: "historical" },
      "jockey-kawachi-hiroshi": { id: "jockey-kawachi-hiroshi", sourceId: "kawachi-hiroshi", name: "河内洋", role: "勇者帝王主战骑手", side: "historical" },
      "jockey-kikuzawa-takanori": { id: "jockey-kikuzawa-takanori", name: "菊沢隆徳", role: "大和卓越主战骑手", side: "historical" },
      "jockey-yutaka-yoshida": { id: "jockey-yutaka-yoshida", sourceId: "yutaka-yoshida", name: "吉田豊", role: "目白兰伯特主战骑手", side: "historical" },
      "jockey-hitoshi-matoba": { id: "jockey-hitoshi-matoba", sourceId: "hitoshi-matoba", name: "的場均", role: "草上飞主战骑手", side: "historical" },
      "jockey-masayoshi-ebina": { id: "jockey-masayoshi-ebina", sourceId: "masayoshi-ebina", name: "蛯名正義", role: "矿之恋主战骑手", side: "historical" },
      "jockey-katsuharu-tanaka": { id: "jockey-katsuharu-tanaka", sourceId: "katsuharu-tanaka", name: "田中勝春", role: "迈纳利刃主战骑手", side: "historical" },
      "press-keiba-weekly": { id: "press-keiba-weekly", name: "竞马周报编辑部", role: "报道视角", side: "press", fictional: true },
      "race-announcer": { id: "race-announcer", name: "赛场播报", role: "赛事记录", side: "press", fictional: true }
    },
    encounterNodes: [
      { id: "encounter-stable-arrival", type: "dialogue", interactionKind: "encounter", textId: "jp.golden-road.main.encounter.arrival", speakerId: "trainer-sato-yuta" },
      {
        id: "encounter-first-look",
        type: "dialogue",
        interactionKind: "transient-choice",
        textId: "jp.golden-road.main.encounter.first-look",
        speakerId: "trainer-sato-yuta",
        transientChoices: [
          { id: "observe", label: "先在一旁观察", responseTextId: "jp.golden-road.main.encounter.response.observe" },
          { id: "wait", label: "安静等待它靠近", responseTextId: "jp.golden-road.main.encounter.response.wait" },
          { id: "approach", label: "试着主动接近", responseTextId: "jp.golden-road.main.encounter.response.approach" }
        ]
      },
      { id: "encounter-trainer-assessment", type: "dialogue", interactionKind: "assessment", textId: "jp.golden-road.main.encounter.assessment", speakerId: "trainer-sato-yuta" },
      { id: "encounter-naming", type: "dialogue", interactionKind: "naming", textId: "jp.golden-road.main.encounter.naming", speakerId: "trainer-sato-yuta" },
      { id: "encounter-named", type: "dialogue", interactionKind: "named", textId: "jp.golden-road.main.encounter.named", speakerId: "player" }
    ],
    reportDefinitions: {
      satsuki: {
        unproven: "jp.golden-road.main.1998.report.satsuki.unproven",
        winner: "jp.golden-road.main.1998.report.satsuki.winner",
        contender: "jp.golden-road.main.1998.report.satsuki.contender",
        mixed: "jp.golden-road.main.1998.report.satsuki.mixed",
        outsider: "jp.golden-road.main.1998.report.satsuki.outsider",
        "health-question": "jp.golden-road.main.1998.report.satsuki.health-question"
      },
      derby: {
        unproven: "jp.golden-road.main.1998.report.derby.unproven",
        winner: "jp.golden-road.main.1998.report.derby.winner",
        contender: "jp.golden-road.main.1998.report.derby.contender",
        mixed: "jp.golden-road.main.1998.report.derby.mixed",
        outsider: "jp.golden-road.main.1998.report.derby.outsider",
        "health-question": "jp.golden-road.main.1998.report.derby.health-question"
      },
      kikka: {
        unproven: "jp.golden-road.main.1998.report.kikka.unproven",
        winner: "jp.golden-road.main.1998.report.kikka.winner",
        contender: "jp.golden-road.main.1998.report.kikka.contender",
        mixed: "jp.golden-road.main.1998.report.kikka.mixed",
        outsider: "jp.golden-road.main.1998.report.kikka.outsider",
        "health-question": "jp.golden-road.main.1998.report.kikka.health-question"
      }
    },
    narrativeTextSlots: {
      twoYearProfile: {
        two_year_star: "jp.golden-road.main.context.two-year.star",
        two_year_consistent: "jp.golden-road.main.context.two-year.consistent",
        two_year_unproven: "jp.golden-road.main.context.two-year.unproven",
        late_debut: "jp.golden-road.main.context.two-year.late-debut",
        two_year_struggling: "jp.golden-road.main.context.two-year.struggling",
        two_year_injury: "jp.golden-road.main.context.two-year.injury",
        legacy_unrecorded: "jp.golden-road.main.context.two-year.legacy",
        fallback: "jp.golden-road.main.context.two-year.unproven"
      },
      springProfile: {
        spring_unbeaten: "jp.golden-road.main.context.spring.unbeaten",
        spring_prep_winner: "jp.golden-road.main.context.spring.prep-winner",
        spring_consistent: "jp.golden-road.main.context.spring.consistent",
        spring_uncertain: "jp.golden-road.main.context.spring.uncertain",
        spring_rebound: "jp.golden-road.main.context.spring.rebound",
        spring_health_question: "jp.golden-road.main.context.spring.health-question",
        spring_direct_entry: "jp.golden-road.main.context.spring.direct-entry",
        fallback: "jp.golden-road.main.context.spring.uncertain"
      },
      worldlineContext: {
        "historical-continuation": "jp.golden-road.main.context.worldline.historical",
        "player-rewrite": "jp.golden-road.main.context.worldline.player",
        "rival-rewrite": "jp.golden-road.main.context.worldline.rival",
        fallback: "jp.golden-road.main.context.worldline.historical"
      },
      nextHistoricalQuestion: {
        question_satsuki_credentials: "jp.golden-road.main.context.question.satsuki",
        question_derby_response: "jp.golden-road.main.context.question.derby",
        question_kikka_meaning: "jp.golden-road.main.context.question.kikka",
        question_final_worldline: "jp.golden-road.main.context.question.final"
      }
    },
    twoYearOpinion: {
      id: "1997-asahi-opinion",
      date: "1997-11-16",
      cutoffDate: "1997-11-15",
      targetOccurrenceId: "1997-asahi",
      speakerId: "press-keiba-weekly",
      textByProfile: {
        two_year_star: "jp.golden-road.main.1997.opinion.star",
        two_year_injury: "jp.golden-road.main.1997.opinion.injury",
        two_year_consistent: "jp.golden-road.main.1997.opinion.consistent",
        late_debut: "jp.golden-road.main.1997.opinion.late-debut",
        two_year_struggling: "jp.golden-road.main.1997.opinion.struggling",
        two_year_unproven: "jp.golden-road.main.1997.opinion.unproven",
        legacy_unrecorded: "jp.golden-road.main.1997.opinion.legacy"
      }
    },
    twoYearCalendarWindows: [
      {
        id: "1997-august-late",
        decisionDate: "1997-08-16",
        occurrenceIds: ["1997-early-debut", "1997-early-debut-hanshin", "1997-early-debut-sapporo"]
      },
      {
        id: "1997-september-late",
        decisionDate: "1997-09-16",
        occurrenceIds: ["1997-sapporo-maiden", "1997-hanshin-500", "1997-sapporo-3yo", "1997-nojigiku"]
      },
      {
        id: "1997-october-early",
        decisionDate: "1997-10-01",
        occurrenceIds: ["1997-tokyo-maiden-oct", "1997-tokyo-500", "1997-ivy"]
      },
      {
        id: "1997-october-late",
        decisionDate: "1997-10-16",
        occurrenceIds: ["1997-kyoto-maiden", "1997-kigiku", "1997-daily-hai", "1997-icho"]
      },
      {
        id: "1997-november-early",
        decisionDate: "1997-11-01",
        occurrenceIds: [
          "1997-tokyo-maiden-nov", "1997-kyoto-500", "1997-keisei-3yo", "1997-kyoto-3yo",
          "1997-tokyo-sports", "1997-late-debut", "1997-late-debut-kyoto", "1997-late-debut-fukushima"
        ]
      }
    ],
    sceneNodes: [
      {
        id: "1997-08-debut-route",
        date: "1997-08-16",
        age: 2,
        month: 8,
        half: 2,
        type: "race-decision",
        textId: "jp.golden-road.main.1997.decision.debut-route",
        speakerId: "trainer-sato-yuta",
        calendarWindowId: "1997-august-late",
        allowedOccurrenceIds: ["1997-early-debut", "1997-early-debut-hanshin", "1997-early-debut-sapporo"],
        sceneChoices: [{ id: "wait-debut", labelTextId: "jp.golden-road.main.option.1997.wait-debut", action: "skip-window", routeKey: "debutTiming", routeValue: "wait" }]
      },
      {
        id: "1997-09-free-calendar",
        date: "1997-09-16",
        age: 2,
        month: 9,
        half: 2,
        type: "race-decision",
        textId: "jp.golden-road.main.1997.decision.free-calendar",
        speakerId: "trainer-sato-yuta",
        calendarWindowId: "1997-september-late",
        allowedOccurrenceIds: ["1997-sapporo-maiden", "1997-hanshin-500", "1997-sapporo-3yo", "1997-nojigiku"],
        sceneChoices: [{ id: "skip-window", labelTextId: "jp.golden-road.main.option.1997.skip-window", action: "skip-window" }],
        onlyIfCareerRaces: true
      },
      {
        id: "1997-10-free-calendar-early",
        date: "1997-10-01",
        age: 2,
        month: 10,
        half: 1,
        type: "race-decision",
        textId: "jp.golden-road.main.1997.decision.free-calendar",
        speakerId: "jockey-era-player-hayato",
        calendarWindowId: "1997-october-early",
        allowedOccurrenceIds: ["1997-tokyo-maiden-oct", "1997-tokyo-500", "1997-ivy"],
        sceneChoices: [{ id: "skip-window", labelTextId: "jp.golden-road.main.option.1997.skip-window", action: "skip-window" }],
        onlyIfCareerRaces: true
      },
      {
        id: "1997-10-free-calendar-late",
        date: "1997-10-16",
        age: 2,
        month: 10,
        half: 2,
        type: "race-decision",
        textId: "jp.golden-road.main.1997.decision.free-calendar",
        speakerId: "trainer-sato-yuta",
        calendarWindowId: "1997-october-late",
        allowedOccurrenceIds: ["1997-kyoto-maiden", "1997-kigiku", "1997-daily-hai", "1997-icho"],
        sceneChoices: [{ id: "skip-window", labelTextId: "jp.golden-road.main.option.1997.skip-window", action: "skip-window" }],
        onlyIfCareerRaces: true
      },
      {
        id: "1997-11-free-calendar",
        date: "1997-11-01",
        age: 2,
        month: 11,
        half: 1,
        type: "race-decision",
        textId: "jp.golden-road.main.1997.decision.november-calendar",
        speakerId: "trainer-sato-yuta",
        calendarWindowId: "1997-november-early",
        allowedOccurrenceIds: [
          "1997-tokyo-maiden-nov", "1997-kyoto-500", "1997-keisei-3yo", "1997-kyoto-3yo",
          "1997-tokyo-sports", "1997-late-debut", "1997-late-debut-kyoto", "1997-late-debut-fukushima"
        ],
        sceneChoices: [
          { id: "skip-window", labelTextId: "jp.golden-road.main.option.1997.skip-window", action: "skip-window", onlyIfCareerRaces: true },
          { id: "defer-to-three", labelTextId: "jp.golden-road.main.option.1997.defer", action: "skip-window", routeKey: "debutTiming", routeValue: "deferred", onlyIfNoCareerRaces: true }
        ]
      },
      {
        id: "1997-11-asahi-entry",
        date: "1997-11-16",
        age: 2,
        month: 11,
        half: 2,
        type: "race-decision",
        textId: "jp.golden-road.main.1997.decision.asahi-entry",
        speakerId: "trainer-sato-yuta",
        allowedOccurrenceIds: ["1997-asahi"],
        sceneChoices: [{ id: "decline-asahi", labelTextId: "jp.golden-road.main.option.1997.decline-asahi", action: "route", routeKey: "twoYearFinal", routeValue: "asahi-declined" }],
        requiresOpinionSnapshot: true,
        skipIfRouteKey: "twoYearFinal"
      },
      {
        id: "1997-12-radio-entry",
        date: "1997-12-01",
        age: 2,
        month: 12,
        half: 1,
        type: "race-decision",
        textId: "jp.golden-road.main.1997.decision.radio-entry",
        speakerId: "trainer-sato-yuta",
        allowedOccurrenceIds: ["1997-radio-tampa"],
        sceneChoices: [{ id: "finish-two-year", labelTextId: "jp.golden-road.main.option.1997.finish", action: "route", routeKey: "twoYearFinal", routeValue: "skip" }],
        requiresRoute: { key: "twoYearFinal", value: "asahi-declined" }
      },
      { id: "1997-12-two-year-summary", date: "1997-12-21", age: 2, month: 12, half: 2, type: "dialogue", textId: "jp.golden-road.main.1997.summary", speakerId: "trainer-sato-yuta", useNarrativeSlots: true, stageTransition: "1998-classics", requiresTwoYearFinalResolved: true },
      { id: "1998-01-stable-opening", date: "1998-01-01", age: 3, month: 1, half: 1, type: "dialogue", textId: "jp.golden-road.main.1998.prologue.open", speakerId: "trainer-sato-yuta" },
      { id: "1998-01-player-declaration", date: "1998-01-01", age: 3, month: 1, half: 1, type: "dialogue", textId: "jp.golden-road.main.1998.scene.player-declaration", speakerId: "player" },
      { id: "1998-01-jockey-impression", date: "1998-01-16", age: 3, month: 1, half: 2, type: "dialogue", textId: "jp.golden-road.main.1998.scene.jockey-first-impression", speakerId: "jockey-era-player-hayato" },
      { id: "1998-02-generation-desk", date: "1998-02-01", age: 3, month: 2, half: 1, type: "news", textId: "jp.golden-road.main.1998.scene.generation-desk", speakerId: "press-keiba-weekly" },
      { id: "1998-02-satsuki-route", date: "1998-02-16", age: 3, month: 2, half: 2, type: "race-decision", textId: "jp.golden-road.main.1998.decision.satsuki-route", speakerId: "trainer-sato-yuta", allowedOccurrenceIds: ["1998-yayoi", "1998-satsuki"], untilOccurrenceId: "1998-satsuki" },
      { id: "1998-03-satsuki-confirm", date: "1998-03-16", age: 3, month: 3, half: 2, type: "race-decision", textId: "jp.golden-road.main.1998.decision.satsuki-confirm", speakerId: "trainer-sato-yuta", allowedOccurrenceIds: ["1998-satsuki"], untilOccurrenceId: "1998-satsuki" },
      { id: "1998-04-satsuki-background", date: "1998-04-01", age: 3, month: 4, half: 1, type: "dialogue", textId: "jp.golden-road.main.1998.satsuki.pre.background", speakerId: "jockey-norihiro-yokoyama", untilOccurrenceId: "1998-satsuki", useNarrativeSlots: true },
      { id: "1998-05-derby-route", date: "1998-05-01", age: 3, month: 5, half: 1, type: "race-decision", textId: "jp.golden-road.main.1998.decision.derby-route", speakerId: "jockey-era-player-hayato", allowedOccurrenceIds: ["1998-aoba", "1998-derby"], untilOccurrenceId: "1998-derby" },
      { id: "1998-05-derby-confirm", date: "1998-05-16", age: 3, month: 5, half: 2, type: "race-decision", textId: "jp.golden-road.main.1998.decision.derby-confirm", speakerId: "trainer-sato-yuta", allowedOccurrenceIds: ["1998-derby"], untilOccurrenceId: "1998-derby" },
      { id: "1998-05-derby-background", date: "1998-05-16", age: 3, month: 5, half: 2, type: "dialogue", textId: "jp.golden-road.main.1998.derby.pre.background", speakerId: "jockey-take-yutaka", untilOccurrenceId: "1998-derby", useNarrativeSlots: true },
      { id: "1998-07-summer-stable", date: "1998-07-01", age: 3, month: 7, half: 1, type: "dialogue", textId: "jp.golden-road.main.1998.scene.summer-stable", speakerId: "trainer-sato-yuta", untilOccurrenceId: "1998-kikka", useNarrativeSlots: true },
      { id: "1998-08-kikka-route", date: "1998-08-16", age: 3, month: 8, half: 2, type: "race-decision", textId: "jp.golden-road.main.1998.decision.kikka-route", speakerId: "trainer-sato-yuta", allowedOccurrenceIds: ["1998-kobe", "1998-kyoto-shimbun", "1998-kikka"], untilOccurrenceId: "1998-kikka" },
      { id: "1998-09-kikka-followup", date: "1998-09-16", age: 3, month: 9, half: 2, type: "race-decision", textId: "jp.golden-road.main.1998.decision.kikka-followup", speakerId: "jockey-era-player-hayato", allowedOccurrenceIds: ["1998-kyoto-shimbun", "1998-kikka"], untilOccurrenceId: "1998-kikka" },
      { id: "1998-10-kikka-confirm", date: "1998-10-01", age: 3, month: 10, half: 1, type: "race-decision", textId: "jp.golden-road.main.1998.decision.kikka-confirm", speakerId: "trainer-sato-yuta", allowedOccurrenceIds: ["1998-kikka"], untilOccurrenceId: "1998-kikka" },
      { id: "1998-10-kikka-background", date: "1998-10-16", age: 3, month: 10, half: 2, type: "dialogue", textId: "jp.golden-road.main.1998.kikka.pre.background", speakerId: "jockey-yuichi-fukunaga", untilOccurrenceId: "1998-kikka", useNarrativeSlots: true }
    ],
    primaryRivalIds: ["special-week", "seiun-sky", "king-halo"],
    eraHorses: {
      emosion: { id: "emosion", name: "エモシオン", displayName: "心潮激荡", displayNameZh: "心潮激荡", displayNameEn: "Emosion" },
      "divine-light": { id: "divine-light", name: "ディヴァインライト", displayName: "神圣之光", displayNameZh: "神圣之光", displayNameEn: "Divine Light" },
      "bold-emperor": { id: "bold-emperor", name: "ボールドエンペラー", displayName: "勇者帝王", displayNameZh: "勇者帝王", displayNameEn: "Bold Emperor" },
      "daiwa-superior": { id: "daiwa-superior", name: "ダイワスペリアー", displayName: "大和卓越", displayNameZh: "大和卓越", displayNameEn: "Daiwa Superior" },
      "mejiro-lambert": { id: "mejiro-lambert", name: "メジロランバート", displayName: "目白兰伯特", displayNameZh: "目白兰伯特", displayNameEn: "Mejiro Lambert" },
      "meiner-love": { id: "meiner-love", name: "マイネルラヴ", displayName: "矿之恋", displayNameZh: "矿之恋", displayNameEn: "Meiner Love" },
      figaro: { id: "figaro", name: "フィガロ", displayName: "费加罗", displayNameZh: "费加罗", displayNameEn: "Figaro" },
      "agnes-world": { id: "agnes-world", name: "アグネスワールド", displayName: "爱丽世界", displayNameZh: "爱丽世界", displayNameEn: "Agnes World" },
      "meiner-messer": { id: "meiner-messer", name: "マイネルメッサー", displayName: "迈纳利刃", displayNameZh: "迈纳利刃", displayNameEn: "Meiner Messer" },
      "lord-ax": { id: "lord-ax", name: "ロードアックス", displayName: "ロードアックス", displayNameZh: "ロードアックス", displayNameEn: "Lord Ax" }
    },
    openingTextIds: [
      "jp.golden-road.main.1998.prologue.open",
      "jp.golden-road.main.1998.season.goal"
    ],
    futureTextIds: [
      "jp.golden-road.main.1999.spring.placeholder",
      "jp.golden-road.main.1999.autumn.placeholder"
    ],
    endingTextIds: {
      triple: "jp.golden-road.main.1998.ending.triple",
      partial: "jp.golden-road.main.1998.ending.partial",
      none: "jp.golden-road.main.1998.ending.none",
      absent: "jp.golden-road.main.1998.ending.absent",
      injury: "jp.golden-road.main.1998.ending.injury",
      retired: "jp.golden-road.main.1998.ending.retired"
    },
    endingDefinitions: {
      triple: "jp.golden-road.main.1998.ending.triple",
      partial: "jp.golden-road.main.1998.ending.partial",
      none: "jp.golden-road.main.1998.ending.none",
      absent: "jp.golden-road.main.1998.ending.absent",
      injury: "jp.golden-road.main.1998.ending.injury",
      retired: "jp.golden-road.main.1998.ending.retired"
    },
    occurrences: [
      {
        id: "1997-early-debut",
        nameZh: "中山草地1600米新马战",
        date: "1997-09-07",
        age: 2,
        month: 9,
        half: 1,
        fieldPolicy: "generated",
        freeRace: true,
        calendarWindowId: "1997-august-late",
        stageId: "two-year",
        choiceTextId: "jp.golden-road.main.option.1997.early-debut",
        routeChoice: { key: "debutTiming", value: "early" },
        raceSnapshot: { id: "era-1997-new-nakayama-1600", nameZh: "中山草地1600米新马战", grade: "新马", raceClass: "new", surface: "草地", surfaceRegion: "日本", course: "中山", distance: 1600, ageRule: "2岁", ageRestriction: { type: "exact", age: 2 } }
      },
      { id: "1997-early-debut-hanshin", nameZh: "阪神草地1800米新马战", date: "1997-09-07", age: 2, month: 9, half: 1, fieldPolicy: "generated", freeRace: true, calendarWindowId: "1997-august-late", stageId: "two-year", choiceTextId: "jp.golden-road.main.option.1997.early-debut-hanshin", routeChoice: { key: "debutTiming", value: "early" }, raceSnapshot: { id: "era-1997-new-hanshin-1800", nameZh: "阪神草地1800米新马战", grade: "新马", raceClass: "new", surface: "草地", surfaceRegion: "日本", course: "阪神", distance: 1800, ageRule: "2岁", ageRestriction: { type: "exact", age: 2 } } },
      { id: "1997-early-debut-sapporo", nameZh: "札幌草地1800米新马战", date: "1997-09-07", age: 2, month: 9, half: 1, fieldPolicy: "generated", freeRace: true, calendarWindowId: "1997-august-late", stageId: "two-year", choiceTextId: "jp.golden-road.main.option.1997.early-debut-sapporo", routeChoice: { key: "debutTiming", value: "early" }, raceSnapshot: { id: "era-1997-new-sapporo-1800", nameZh: "札幌草地1800米新马战", grade: "新马", raceClass: "new", surface: "草地", surfaceRegion: "日本", course: "札幌", distance: 1800, ageRule: "2岁", ageRestriction: { type: "exact", age: 2 } } },
      { id: "1997-sapporo-maiden", nameZh: "札幌草地1800米未胜利战", date: "1997-09-20", age: 2, month: 9, half: 2, fieldPolicy: "generated", freeRace: true, calendarWindowId: "1997-september-late", stageId: "two-year", choiceTextId: "jp.golden-road.main.option.1997.sapporo-maiden", raceSnapshot: { id: "era-1997-maiden-sapporo-1800", nameZh: "札幌草地1800米未胜利战", grade: "未胜利", raceClass: "maiden", surface: "草地", surfaceRegion: "日本", course: "札幌", distance: 1800, ageRule: "2岁", ageRestriction: { type: "exact", age: 2 } } },
      { id: "1997-hanshin-500", nameZh: "阪神草地1800米500万下", date: "1997-09-27", age: 2, month: 9, half: 2, fieldPolicy: "generated", freeRace: true, calendarWindowId: "1997-september-late", stageId: "two-year", choiceTextId: "jp.golden-road.main.option.1997.hanshin-500", raceSnapshot: { id: "era-1997-500-hanshin-1800", nameZh: "阪神草地1800米500万下", grade: "500万下", raceClass: "one-win", surface: "草地", surfaceRegion: "日本", course: "阪神", distance: 1800, ageRule: "2岁", ageRestriction: { type: "exact", age: 2 } } },
      { id: "1997-sapporo-3yo", nameZh: "札幌三岁锦标", date: "1997-09-20", age: 2, month: 9, half: 2, fieldPolicy: "generated", freeRace: true, calendarWindowId: "1997-september-late", stageId: "two-year", choiceTextId: "jp.golden-road.main.option.1997.sapporo-3yo", raceSnapshot: { id: "era-1997-sapporo-3yo", nameOriginal: "札幌3歳ステークス", nameZh: "札幌三岁锦标", grade: "G3", raceClass: "g3", surface: "草地", surfaceRegion: "日本", course: "札幌", distance: 1800, ageRule: "2岁", ageRestriction: { type: "exact", age: 2 } } },
      { id: "1997-nojigiku", nameZh: "野路菊锦标", date: "1997-09-27", age: 2, month: 9, half: 2, fieldPolicy: "generated", freeRace: true, calendarWindowId: "1997-september-late", stageId: "two-year", choiceTextId: "jp.golden-road.main.option.1997.nojigiku", raceSnapshot: { id: "era-1997-nojigiku", nameOriginal: "野路菊ステークス", nameZh: "野路菊锦标", grade: "公开赛", raceClass: "open", surface: "草地", surfaceRegion: "日本", course: "阪神", distance: 1600, ageRule: "2岁", ageRestriction: { type: "exact", age: 2 } } },
      { id: "1997-tokyo-maiden-oct", nameZh: "东京草地1800米未胜利战", date: "1997-10-12", age: 2, month: 10, half: 1, fieldPolicy: "generated", freeRace: true, calendarWindowId: "1997-october-early", stageId: "two-year", choiceTextId: "jp.golden-road.main.option.1997.tokyo-maiden", raceSnapshot: { id: "era-1997-maiden-tokyo-1800-oct", nameZh: "东京草地1800米未胜利战", grade: "未胜利", raceClass: "maiden", surface: "草地", surfaceRegion: "日本", course: "东京", distance: 1800, ageRule: "2岁", ageRestriction: { type: "exact", age: 2 } } },
      { id: "1997-tokyo-500", nameZh: "东京草地1800米500万下", date: "1997-10-12", age: 2, month: 10, half: 1, fieldPolicy: "generated", freeRace: true, calendarWindowId: "1997-october-early", stageId: "two-year", choiceTextId: "jp.golden-road.main.option.1997.tokyo-500", raceSnapshot: { id: "era-1997-500-tokyo-1800", nameZh: "东京草地1800米500万下", grade: "500万下", raceClass: "one-win", surface: "草地", surfaceRegion: "日本", course: "东京", distance: 1800, ageRule: "2岁", ageRestriction: { type: "exact", age: 2 } } },
      { id: "1997-ivy", nameZh: "常春藤锦标", date: "1997-10-12", age: 2, month: 10, half: 1, fieldPolicy: "generated", freeRace: true, calendarWindowId: "1997-october-early", stageId: "two-year", choiceTextId: "jp.golden-road.main.option.1997.ivy", raceSnapshot: { id: "era-1997-ivy", nameOriginal: "アイビーステークス", nameZh: "常春藤锦标", grade: "公开赛", raceClass: "open", surface: "草地", surfaceRegion: "日本", course: "东京", distance: 1400, ageRule: "2岁", ageRestriction: { type: "exact", age: 2 } } },
      { id: "1997-kyoto-maiden", nameZh: "京都草地1800米未胜利战", date: "1997-10-25", age: 2, month: 10, half: 2, fieldPolicy: "generated", freeRace: true, calendarWindowId: "1997-october-late", stageId: "two-year", choiceTextId: "jp.golden-road.main.option.1997.kyoto-maiden", raceSnapshot: { id: "era-1997-maiden-kyoto-1800", nameZh: "京都草地1800米未胜利战", grade: "未胜利", raceClass: "maiden", surface: "草地", surfaceRegion: "日本", course: "京都", distance: 1800, ageRule: "2岁", ageRestriction: { type: "exact", age: 2 } } },
      { id: "1997-kigiku", nameZh: "黄菊赏", date: "1997-10-25", age: 2, month: 10, half: 2, fieldPolicy: "generated", freeRace: true, calendarWindowId: "1997-october-late", stageId: "two-year", choiceTextId: "jp.golden-road.main.option.1997.kigiku", raceSnapshot: { id: "era-1997-kigiku", nameOriginal: "黄菊賞", nameZh: "黄菊赏", grade: "500万下", raceClass: "one-win", surface: "草地", surfaceRegion: "日本", course: "京都", distance: 1800, ageRule: "2岁", ageRestriction: { type: "exact", age: 2 } } },
      { id: "1997-daily-hai", nameZh: "每日杯三岁锦标", date: "1997-10-18", age: 2, month: 10, half: 2, fieldPolicy: "generated", freeRace: true, calendarWindowId: "1997-october-late", stageId: "two-year", choiceTextId: "jp.golden-road.main.option.1997.daily-hai", raceSnapshot: { id: "era-1997-daily-hai", nameOriginal: "デイリー杯3歳ステークス", nameZh: "每日杯三岁锦标", grade: "G2", raceClass: "g2", surface: "草地", surfaceRegion: "日本", course: "京都", distance: 1600, ageRule: "2岁", ageRestriction: { type: "exact", age: 2 } } },
      { id: "1997-icho", nameZh: "银杏锦标", date: "1997-10-26", age: 2, month: 10, half: 2, fieldPolicy: "generated", freeRace: true, calendarWindowId: "1997-october-late", stageId: "two-year", choiceTextId: "jp.golden-road.main.option.1997.icho", raceSnapshot: { id: "era-1997-icho", nameOriginal: "いちょうステークス", nameZh: "银杏锦标", grade: "公开赛", raceClass: "open", surface: "草地", surfaceRegion: "日本", course: "东京", distance: 1600, ageRule: "2岁", ageRestriction: { type: "exact", age: 2 } } },
      { id: "1997-tokyo-maiden-nov", nameZh: "东京草地1800米未胜利战", date: "1997-11-08", age: 2, month: 11, half: 1, fieldPolicy: "generated", freeRace: true, calendarWindowId: "1997-november-early", stageId: "two-year", choiceTextId: "jp.golden-road.main.option.1997.tokyo-maiden", raceSnapshot: { id: "era-1997-maiden-tokyo-1800-nov", nameZh: "东京草地1800米未胜利战", grade: "未胜利", raceClass: "maiden", surface: "草地", surfaceRegion: "日本", course: "东京", distance: 1800, ageRule: "2岁", ageRestriction: { type: "exact", age: 2 } } },
      { id: "1997-kyoto-500", nameZh: "京都草地1600米500万下", date: "1997-11-08", age: 2, month: 11, half: 1, fieldPolicy: "generated", freeRace: true, calendarWindowId: "1997-november-early", stageId: "two-year", choiceTextId: "jp.golden-road.main.option.1997.kyoto-500", raceSnapshot: { id: "era-1997-500-kyoto-1600", nameZh: "京都草地1600米500万下", grade: "500万下", raceClass: "one-win", surface: "草地", surfaceRegion: "日本", course: "京都", distance: 1600, ageRule: "2岁", ageRestriction: { type: "exact", age: 2 } } },
      { id: "1997-keisei-3yo", nameZh: "京成杯三岁锦标", date: "1997-11-08", age: 2, month: 11, half: 1, fieldPolicy: "generated", freeRace: true, calendarWindowId: "1997-november-early", stageId: "two-year", choiceTextId: "jp.golden-road.main.option.1997.keisei-3yo", raceSnapshot: { id: "era-1997-keisei-3yo", nameOriginal: "京成杯3歳ステークス", nameZh: "京成杯三岁锦标", grade: "G2", raceClass: "g2", surface: "草地", surfaceRegion: "日本", course: "东京", distance: 1400, ageRule: "2岁", ageRestriction: { type: "exact", age: 2 } } },
      { id: "1997-kyoto-3yo", nameZh: "京都三岁锦标", date: "1997-11-08", age: 2, month: 11, half: 1, fieldPolicy: "generated", freeRace: true, calendarWindowId: "1997-november-early", stageId: "two-year", choiceTextId: "jp.golden-road.main.option.1997.kyoto-3yo", raceSnapshot: { id: "era-1997-kyoto-3yo", nameOriginal: "京都3歳ステークス", nameZh: "京都三岁锦标", grade: "公开赛", raceClass: "open", surface: "草地", surfaceRegion: "日本", course: "京都", distance: 1800, ageRule: "2岁", ageRestriction: { type: "exact", age: 2 } } },
      {
        id: "1997-late-debut",
        nameZh: "东京草地1800米新马战",
        date: "1997-11-08",
        age: 2,
        month: 11,
        half: 1,
        fieldPolicy: "generated",
        freeRace: true,
        calendarWindowId: "1997-november-early",
        stageId: "two-year",
        choiceTextId: "jp.golden-road.main.option.1997.late-debut",
        routeChoice: { key: "debutTiming", value: "late" },
        raceSnapshot: { id: "era-1997-new-tokyo-1800", nameZh: "东京草地1800米新马战", grade: "新马", raceClass: "new", surface: "草地", surfaceRegion: "日本", course: "东京", distance: 1800, ageRule: "2岁", ageRestriction: { type: "exact", age: 2 } }
      },
      { id: "1997-late-debut-kyoto", nameZh: "京都草地1800米新马战", date: "1997-11-08", age: 2, month: 11, half: 1, fieldPolicy: "generated", freeRace: true, calendarWindowId: "1997-november-early", stageId: "two-year", choiceTextId: "jp.golden-road.main.option.1997.late-debut-kyoto", routeChoice: { key: "debutTiming", value: "late" }, raceSnapshot: { id: "era-1997-new-kyoto-1800", nameZh: "京都草地1800米新马战", grade: "新马", raceClass: "new", surface: "草地", surfaceRegion: "日本", course: "京都", distance: 1800, ageRule: "2岁", ageRestriction: { type: "exact", age: 2 } } },
      { id: "1997-late-debut-fukushima", nameZh: "福岛草地1800米新马战", date: "1997-11-08", age: 2, month: 11, half: 1, fieldPolicy: "generated", freeRace: true, calendarWindowId: "1997-november-early", stageId: "two-year", choiceTextId: "jp.golden-road.main.option.1997.late-debut-fukushima", routeChoice: { key: "debutTiming", value: "late" }, raceSnapshot: { id: "era-1997-new-fukushima-1800", nameZh: "福岛草地1800米新马战", grade: "新马", raceClass: "new", surface: "草地", surfaceRegion: "日本", course: "福岛", distance: 1800, ageRule: "2岁", ageRestriction: { type: "exact", age: 2 } } },
      {
        id: "1997-tokyo-sports",
        raceId: "tokyo-sports-hai",
        nameZh: "东京体育杯三岁锦标",
        date: "1997-11-15",
        age: 2,
        month: 11,
        half: 1,
        fieldPolicy: "generated",
        freeRace: true,
        calendarWindowId: "1997-november-early",
        stageId: "two-year",
        choiceTextId: "jp.golden-road.main.option.1997.tokyo-sports",
        historicalWinnerId: "king-halo",
        override: { grade: "G3", raceClass: "g3", surface: "草地", surfaceRegion: "日本", course: "东京", distance: 1800, ageRule: "2岁" }
      },
      {
        id: "1997-asahi",
        raceId: "asahi-hai-fs",
        nameZh: "朝日杯三岁锦标",
        date: "1997-12-07",
        age: 2,
        month: 12,
        half: 1,
        fieldPolicy: "historical-fixed",
        choiceTextId: "jp.golden-road.main.option.1997.asahi",
        importantTwoYear: true,
        stageId: "two-year-final",
        routeGroup: "1997-year-end",
        routeChoice: { key: "twoYearFinal", value: "asahi" },
        historicalWinnerId: "grass-wonder",
        override: { grade: "G1", raceClass: "g1", surface: "草地", surfaceRegion: "日本", course: "中山", distance: 1600, ageRule: "2岁" },
        opponents: [
          participant("grass-wonder", 1, 81, 105, "hitoshi-matoba", "的場均", 70),
          participant("meiner-love", 2, 79, 97.5, "masayoshi-ebina", "蛯名正義", 60),
          participant("figaro", 3, 78, 96, "yuichi-fukunaga", "福永祐一", 60),
          participant("agnes-world", 4, 79, 85.5, "take-yutaka", "武豊", 80),
          participant("meiner-messer", 5, 76, 76.5, "katsuharu-tanaka", "田中勝春", 60)
        ],
        text: {
          post: { win: "jp.golden-road.main.1997.post.win", close: "jp.golden-road.main.1997.post.close", loss: "jp.golden-road.main.1997.post.loss", absent: "jp.golden-road.main.1997.post.absent" },
          news: sharedNews,
          chronicle: sharedChronicle,
          fallback: "jp.golden-road.main.1998.fallback"
        }
      },
      {
        id: "1997-radio-tampa",
        nameZh: "电台杯三岁锦标",
        date: "1997-12-20",
        age: 2,
        month: 12,
        half: 2,
        fieldPolicy: "generated",
        choiceTextId: "jp.golden-road.main.option.1997.radio",
        importantTwoYear: true,
        stageId: "two-year-final",
        routeGroup: "1997-year-end",
        routeChoice: { key: "twoYearFinal", value: "radio" },
        historicalWinnerId: "lord-ax",
        raceSnapshot: { id: "era-1997-radio-tampa", nameOriginal: "ラジオたんぱ杯3歳ステークス", nameZh: "电台杯三岁锦标", grade: "G3", raceClass: "g3", surface: "草地", surfaceRegion: "日本", course: "阪神", distance: 2000, ageRule: "2岁", ageRestriction: { type: "exact", age: 2 } },
        text: {
          post: { win: "jp.golden-road.main.1997.post.win", close: "jp.golden-road.main.1997.post.close", loss: "jp.golden-road.main.1997.post.loss", absent: "jp.golden-road.main.1997.post.absent" },
          news: sharedNews,
          chronicle: sharedChronicle,
          fallback: "jp.golden-road.main.1998.fallback"
        }
      },
      {
        id: "1998-yayoi",
        raceId: "yayoi-sho",
        nameZh: "弥生赏",
        date: "1998-03-08",
        age: 3,
        month: 3,
        half: 1,
        fieldPolicy: "generated",
        choiceTextId: "jp.golden-road.main.option.1998.yayoi",
        keyRace: false,
        override: { grade: "G2", raceClass: "g2", surface: "草地", surfaceRegion: "日本", course: "中山", distance: 2000, ageRule: "3岁" }
      },
      {
        id: "1998-satsuki",
        raceId: "satsuki-sho",
        nameZh: "皋月赏",
        date: "1998-04-19",
        age: 3,
        month: 4,
        half: 2,
        fieldPolicy: "historical-fixed",
        choiceTextId: "jp.golden-road.main.option.1998.satsuki",
        keyRace: true,
        chapterId: "satsuki",
        reportKey: "satsuki",
        historicalWinnerId: "seiun-sky",
        override: { grade: "G1", raceClass: "g1", surface: "草地", surfaceRegion: "日本", course: "中山", distance: 2000, ageRule: "3岁" },
        opponents: [
          participant("seiun-sky", 1, 81, 104, "norihiro-yokoyama", "横山典弘", 70),
          participant("king-halo", 2, 80, 103, "yuichi-fukunaga", "福永祐一", 60),
          participant("special-week", 3, 82, 101, "take-yutaka", "武豊", 80),
          participant("emosion", 4, 78, 95, "mikio-matsunaga", "松永幹夫", 70),
          participant("divine-light", 5, 78, 93.5, "okabe-yukio", "岡部幸雄", 70)
        ],
        text: {
          pre: "jp.golden-road.main.1998.satsuki.pre.background",
          post: {
            win: "jp.golden-road.main.1998.satsuki.post.win",
            close: "jp.golden-road.main.1998.satsuki.post.close",
            loss: "jp.golden-road.main.1998.satsuki.post.loss",
            absent: "jp.golden-road.main.1998.satsuki.post.absent"
          },
          news: sharedNews,
          chronicle: sharedChronicle,
          fallback: "jp.golden-road.main.1998.fallback"
        }
      },
      {
        id: "1998-aoba",
        raceId: "aoba-sho",
        nameZh: "青叶赏",
        date: "1998-05-09",
        age: 3,
        month: 5,
        half: 1,
        fieldPolicy: "generated",
        choiceTextId: "jp.golden-road.main.option.1998.aoba",
        keyRace: false,
        override: { grade: "G3", raceClass: "g3", surface: "草地", surfaceRegion: "日本", course: "东京", distance: 2400, ageRule: "3岁" }
      },
      {
        id: "1998-derby",
        raceId: "tokyo-yushun",
        nameZh: "日本德比",
        date: "1998-06-07",
        age: 3,
        month: 6,
        half: 1,
        fieldPolicy: "historical-fixed",
        choiceTextId: "jp.golden-road.main.option.1998.derby",
        keyRace: true,
        chapterId: "derby",
        reportKey: "derby",
        historicalWinnerId: "special-week",
        override: { grade: "G1", raceClass: "g1", surface: "草地", surfaceRegion: "日本", course: "东京", distance: 2400, ageRule: "3岁" },
        opponents: [
          participant("special-week", 1, 84, 105, "take-yutaka", "武豊", 80),
          participant("bold-emperor", 2, 79, 95, "kawachi-hiroshi", "河内洋", 60),
          participant("daiwa-superior", 3, 79, 94, "", "菊沢隆徳", 60),
          participant("seiun-sky", 4, 81, 93.5, "norihiro-yokoyama", "横山典弘", 70),
          participant("king-halo", 14, 79, 73.5, "yuichi-fukunaga", "福永祐一", 60)
        ],
        text: {
          pre: "jp.golden-road.main.1998.derby.pre.background",
          post: {
            win: "jp.golden-road.main.1998.derby.post.win",
            close: "jp.golden-road.main.1998.derby.post.close",
            loss: "jp.golden-road.main.1998.derby.post.loss",
            absent: "jp.golden-road.main.1998.derby.post.absent"
          },
          news: sharedNews,
          chronicle: sharedChronicle,
          fallback: "jp.golden-road.main.1998.fallback"
        }
      },
      {
        id: "1998-kobe",
        raceId: "kobe-shimbun-hai",
        nameZh: "神户新闻杯",
        date: "1998-09-20",
        age: 3,
        month: 9,
        half: 2,
        fieldPolicy: "generated",
        choiceTextId: "jp.golden-road.main.option.1998.kobe",
        keyRace: false,
        override: { grade: "G2", raceClass: "g2", surface: "草地", surfaceRegion: "日本", course: "阪神", distance: 2000, ageRule: "3岁" }
      },
      {
        id: "1998-kyoto-shimbun",
        raceId: "kyoto-shimbun-hai",
        nameZh: "京都新闻杯",
        date: "1998-10-18",
        age: 3,
        month: 10,
        half: 2,
        fieldPolicy: "generated",
        choiceTextId: "jp.golden-road.main.option.1998.kyoto-shimbun",
        keyRace: false,
        override: { grade: "G2", raceClass: "g2", surface: "草地", surfaceRegion: "日本", course: "京都", distance: 2200, ageRule: "3岁" }
      },
      {
        id: "1998-kikka",
        raceId: "kikka-sho",
        nameZh: "菊花赏",
        date: "1998-11-08",
        age: 3,
        month: 11,
        half: 1,
        fieldPolicy: "historical-fixed",
        choiceTextId: "jp.golden-road.main.option.1998.kikka",
        keyRace: true,
        chapterId: "kikka",
        reportKey: "kikka",
        historicalWinnerId: "seiun-sky",
        override: { grade: "G1", raceClass: "g1", surface: "草地", surfaceRegion: "日本", course: "京都", distance: 3000, ageRule: "3岁" },
        opponents: [
          participant("seiun-sky", 1, 84, 105, "norihiro-yokoyama", "横山典弘", 70),
          participant("special-week", 2, 83, 98, "take-yutaka", "武豊", 80),
          participant("emosion", 3, 79, 97.5, "mikio-matsunaga", "松永幹夫", 70),
          participant("mejiro-lambert", 4, 79, 97, "yutaka-yoshida", "吉田豊", 60),
          participant("king-halo", 5, 78, 96.5, "yuichi-fukunaga", "福永祐一", 60)
        ],
        text: {
          pre: "jp.golden-road.main.1998.kikka.pre.background",
          post: {
            win: "jp.golden-road.main.1998.kikka.post.win",
            close: "jp.golden-road.main.1998.kikka.post.close",
            loss: "jp.golden-road.main.1998.kikka.post.loss",
            absent: "jp.golden-road.main.1998.kikka.post.absent"
          },
          news: sharedNews,
          chronicle: sharedChronicle,
          fallback: "jp.golden-road.main.1998.fallback"
        }
      }
    ]
  });
})();
