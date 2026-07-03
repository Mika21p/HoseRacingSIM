(function () {
  const ns = (window.Keiba = window.Keiba || {});
  const R = ns.Random;

  const MODE_WEIGHTS = [
    { id: "clear", weight: 50 },
    { id: "broad", weight: 30 },
    { id: "empty", weight: 20 }
  ];

  const TEXTS = {
    clear: {
      off_day: [
        "这场条件本身没太大毛病，就是临场没把该有的东西跑出来。",
        "今天输得有点可惜，路线和条件不算错，主要是比赛里没完全跑开。"
      ],
      outclassed: [
        "这场不是安排的问题，对手底子更硬，正面碰上就是吃亏。",
        "条件没太大问题，但这一级别的对手现在还是压了它一截。"
      ],
      immature: [
        "身子还没完全长开，现在硬碰这种强度，后段自然会吃亏。",
        "它还没到最能跑的时候，这场更多是成熟度没跟上。"
      ],
      declining: [
        "这场能看出一点下滑，末段顶住的力道不如以前了。",
        "不是不肯跑，是身体状态已经开始往下走了。"
      ],
      surface_mismatch: [
        "这块场地它跑得不顺，步子一直没完全打开。",
        "今天主要吃在场地上，它在这种条件下发力不够顺。"
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
        "今天条件本身没看出大问题，输赢更多还是比赛内容和对手强度。",
        "这场安排方向不算错，只是结果没站到我们这边。",
        "路线和条件大体没偏，回去还是看它下一场能不能把内容跑出来。"
      ],
      has_issue: [
        "今天不是单纯输给对手，条件上确实有些不合它。",
        "这场看着有地方别着劲，不是它最舒服的一场。",
        "输是一个结果，但更要紧的是今天有些条件没有贴住它。"
      ]
    },
    empty: {
      win: [
        "这场该做的都做到了，赢下来就是好事。",
        "今天跑得顺，回去先把状态稳住。",
        "结果拿到了，但下一场还是要重新看条件。",
        "这场不用说太多，马自己把答案跑出来了。"
      ],
      loss: [
        "输赢先放一边，回去把状态收住，下一场再看。",
        "这一场已经过去了，关键是别让它带着这口气进下一场。",
        "今天结果不好，但马还在，后面还有机会调整。",
        "先让它缓一缓，比赛里的东西回去再慢慢消化。"
      ],
      retired: [
        "这场先别多说，回去把马看仔细，后面的事再慢慢定。",
        "比赛已经这样了，先把状态收住，比追着结果问更重要。"
      ]
    }
  };

  function pickOne(items) {
    return items[R.rollRange(0, items.length - 1)];
  }

  function chooseMode() {
    return R.weightedPick(MODE_WEIGHTS, (item) => item.weight).id;
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
      return { reason: "surface_mismatch", issueState: "has_issue", severity: Math.abs(calc.surfaceMod) };
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
    const mode = chooseMode();

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
