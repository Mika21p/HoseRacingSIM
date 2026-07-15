(function () {
  const ns = (window.Keiba = window.Keiba || {});
  const R = ns.Random;

  const MODE_WEIGHTS = {
    normal: [
      { id: "clear", weight: 50 },
      { id: "broad", weight: 30 },
      { id: "empty", weight: 20 }
    ],
    legend: [
      { id: "clear", weight: 70 },
      { id: "broad", weight: 20 },
      { id: "empty", weight: 10 }
    ]
  };

  const TEXTS = {
    clear: {
      off_day: [
        "这场条件本身没太大毛病，就是临场没把该有的东西跑出来。",
        "今天输得有点可惜，主要是比赛里没展现应有水平。"
      ],
      outclassed: [
        "发挥得不差，只是硬实力上确实还有差距。",
        "这个级别的对手还不是它能应对的。"
      ],
      immature: [
        "身子还没完全长开，这个强度的比赛有点吃亏。",
        "它还没到最能跑的时候，还得多长长身子。"
      ],
      declining: [
        "能看出下滑，能力发挥不如以前了。",
        "有点可惜，看上去身体状态已经开始往下走了。"
      ],
      surface_mismatch: [
        "这个场地它跑得不顺，步子一直没完全打开。",
        "今天这个场地条件不太合它，跑起来一直没顺住。"
      ],
      heavy_mismatch: [
        "今天这个马场太吃力，它在重场下明显跑不开。",
        "场地变重以后它不太能应付，脚下没能完全用上。"
      ],
      distance_too_short: [
        "这场节奏太急，它还没把步子拉开，比赛就已经跑完了。",
        "距离对它来说偏短，整场都像是在被节奏催着走。"
      ],
      distance_too_long: [
        "距离拖长以后后段吃力，这场不是它最舒服的范围。",
        "今天主要是距离长了，前面能跟，后面就撑不住了。"
      ]
    },
    broad: {
      no_issue: [
        "今天比赛本身没看出大问题，输赢更多还是比赛内容和对手强度。",
        "这场比赛发挥还算不错，只是结果没站到我们这边。",
        "今天没看出明显不合的地方，回去还是看它下一场能不能跑回来。"
      ],
      has_issue: [
        "今天不是单纯输给对手，条件上确实有些不合它。",
        "这场看起来跑得不舒服，下次得重新看看条件。",
        "从结果上来看，今天发挥的确实有问题，受到影响了。"
      ]
    },
    empty: {
      win: [
        "这场该做的都做到了，赢下来就是好事。",
        "今天跑得顺，接下来再接再厉。",
        "胜利是最好的结果，今天非常完美。",
        "无论如何，马自己把答案跑出来了。"
      ],
      loss: [
        "输赢先放一边，回去还得练。",
        "这一场已经过去了，关键是下一场。",
        "今天结果不好，后面还有机会调整。",
        "先让它缓一缓，考虑考虑下一场比赛的方向。"
      ],
      retired: [
        "意外在所难免，先看看马的状态吧。",
        "今天出问题了，看看有没有受伤。"
      ]
    }
  };

  function pickOne(items) {
    return items[R.rollRange(0, items.length - 1)];
  }

  function chooseMode(gameMode) {
    const weights = gameMode === "legend" ? MODE_WEIGHTS.legend : MODE_WEIGHTS.normal;
    return R.weightedPick(weights, (item) => item.weight).id;
  }

  function playerResult(raceResult) {
    const results = raceResult.hidden && raceResult.hidden.results;
    return (results || []).find((item) => item.entry && item.entry.key === "player") || null;
  }

  function opponentResult(raceResult) {
    const results = raceResult.hidden && raceResult.hidden.results;
    return (results || []).find((item) => item.entry && item.entry.key === "opponent") || null;
  }

  function isWin(raceResult) {
    return raceResult.public && raceResult.public.rank === 1 && !raceResult.public.retired;
  }

  function isLoss(raceResult) {
    return !isWin(raceResult) && !(raceResult.public && raceResult.public.retired);
  }

  function adaptationOk(calc) {
    if (!calc) return false;
    const maturity = calc.maturity || {};
    return calc.distancePenalty <= 0
      && calc.surfaceMod > -10
      && maturity.status === "成熟期";
  }

  function diagnoseLoss(career, raceResult) {
    const hidden = raceResult.hidden || {};
    const calc = hidden.playerCalc || {};
    const race = hidden.race || {};
    const horse = career.horse || {};
    const maturity = calc.maturity || {};
    const opponent = hidden.opponent || {};
    const player = playerResult(raceResult);
    const opponentRun = opponentResult(raceResult);
    const opponentAbility = opponentRun && opponentRun.entry ? opponentRun.entry.ability : opponent.ability;
    const playerTotal = player ? player.total : null;
    const opponentTotal = opponentRun ? opponentRun.total : null;

    if (race.distance < horse.distMin && calc.distancePenalty >= 3) {
      return { reason: "distance_too_short", issueState: "has_issue", severity: calc.distancePenalty };
    }

    if (race.distance > horse.distMax && calc.distancePenalty >= 3) {
      return { reason: "distance_too_long", issueState: "has_issue", severity: calc.distancePenalty };
    }

    if (calc.surfaceMod <= -10) {
      return {
        reason: "surface_mismatch",
        issueState: "has_issue",
        severity: Math.abs(calc.surfaceMod || 0)
      };
    }

    const badTrackCondition = calc.trackCondition === "重" || calc.trackCondition === "不良";
    if (badTrackCondition && calc.heavyMod <= -2) {
      return {
        reason: "heavy_mismatch",
        issueState: "has_issue",
        severity: Math.abs(calc.heavyMod || 0)
      };
    }

    if (maturity.status === "未成熟" && maturity.strengthDelta <= -2) {
      return { reason: "immature", issueState: "has_issue", severity: Math.abs(maturity.strengthDelta) };
    }

    if (maturity.status === "衰退期" && maturity.strengthDelta <= -2) {
      return { reason: "declining", issueState: "has_issue", severity: Math.abs(maturity.strengthDelta) };
    }

    if (adaptationOk(calc) && Number.isFinite(opponentAbility) && opponentAbility - horse.strength >= 5) {
      return { reason: "outclassed", issueState: "no_issue", severity: opponentAbility - horse.strength };
    }

    if (adaptationOk(calc) && Number.isFinite(playerTotal) && Number.isFinite(opponentTotal)) {
      return { reason: "off_day", issueState: "no_issue", severity: opponentTotal - playerTotal };
    }

    return { reason: "off_day", issueState: "no_issue", severity: 0 };
  }

  function buildComment(raceResult, mode, reason, issueState, text) {
    const publicResult = raceResult.public || {};
    return {
      id: "post-race",
      raceId: publicResult.raceId || "",
      raceName: publicResult.raceName || "",
      result: publicResult.retired ? "retired" : (publicResult.rank === 1 ? "win" : "loss"),
      mode,
      reason: reason || null,
      issueState: issueState || "unknown",
      text
    };
  }

  function generate(career, raceResult) {
    if (!career || !raceResult) {
      return buildComment({ public: {} }, "empty", null, "unknown", "");
    }

    if (raceResult.public && raceResult.public.retired) {
      return buildComment(
        raceResult,
        "empty",
        null,
        "unknown",
        pickOne(TEXTS.empty.retired)
      );
    }

    if (isWin(raceResult)) {
      return buildComment(
        raceResult,
        "empty",
        null,
        "unknown",
        pickOne(TEXTS.empty.win)
      );
    }

    if (!isLoss(raceResult)) {
      return buildComment(
        raceResult,
        "empty",
        null,
        "unknown",
        pickOne(TEXTS.empty.loss)
      );
    }

    const diagnosis = diagnoseLoss(career, raceResult);
    const mode = chooseMode(career.gameMode);

    if (mode === "clear" && diagnosis.reason && TEXTS.clear[diagnosis.reason]) {
      return buildComment(
        raceResult,
        mode,
        diagnosis.reason,
        diagnosis.issueState,
        pickOne(TEXTS.clear[diagnosis.reason])
      );
    }

    if (mode === "broad") {
      return buildComment(
        raceResult,
        mode,
        null,
        diagnosis.issueState,
        pickOne(TEXTS.broad[diagnosis.issueState] || TEXTS.empty.loss)
      );
    }

    return buildComment(
      raceResult,
      "empty",
      null,
      diagnosis.issueState,
      pickOne(TEXTS.empty.loss)
    );
  }

  ns.PostRaceCommentRules = {
    generate,
    diagnoseLoss
  };
})();
