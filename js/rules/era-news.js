(function () {
  const ns = (window.Keiba = window.Keiba || {});
  const clone = (x) => JSON.parse(JSON.stringify(x));
  const personName = (value) => String(value || "").replace(/[\s　]+/g, "");

  function tokens(run, event, options) {
    const o = options || {};
    const summary = run?.summary || {};
    // 年度回顾只取该年的赛果，整局汇总与专题触发不变。
    const annualWins = Number.isInteger(o.summaryYear) ? (run?.events || []).filter((item) =>
      item.type === "race-result" && item.date?.slice(0, 4) === String(o.summaryYear) && item.rank === 1 && !item.retired) : null;
    const ctx = ns.EraConditions.context(run, { event });
    const focus = event || ctx.event;
    const raceId = o.raceId || focus?.raceId || "";
    const edition = raceId ? ns.EraAlmanac?.race(raceId) : null;
    const results = edition?.results || [];
    const [winner, runnerUp, third] = results;
    const historicalWinner = winner ? ns.EraAlmanac.horseName(winner.horseId) : "";
    // 同着对手：名次与玩家相同的那匹；没有同着时，取排在玩家前面的最近一匹。
    const ownFinish = focus?.rank;
    let opponent = null;
    if (edition && Number.isFinite(ownFinish)) {
      opponent = edition.results.find((item) => item.finish === ownFinish) || edition.results.find((item) => item.finish < ownFinish) || null;
    }
    const raceName = o.raceId ? (edition?.nameZh || edition?.nameOriginal || "") : (focus?.raceName || edition?.nameZh || edition?.nameOriginal || "");
    return {
      PLAYER_REFERENCE: run?.playerReference || "马主",
      PLAYER_HORSE_NAME: run?.career?.horse?.name || "你的赛马",
      RACE_NAME: raceName,
      WINNER_NAME: focus?.winnerName || historicalWinner,
      DATE: o.date || focus?.date || run?.date || "",
      FINISH: focus?.retired ? "退赛" : `${focus?.rank || "着外"}着`,
      WINS: annualWins ? annualWins.length : (summary.wins ?? 0),
      G1_WINS: annualWins ? annualWins.filter((item) => item.grade === "G1").length : (summary.g1Wins ?? 0),
      PLAYER_RANK: focus?.retired ? "退赛" : (focus?.rank ?? "着外"),
      PLAYER_JOCKEY: personName(run?.career?.playerJockey?.name),
      WINNER_JOCKEY: personName(focus?.winnerJockey || winner?.jockey),
      SECOND_NAME: runnerUp ? ns.EraAlmanac.horseName(runnerUp.horseId) : "",
      THIRD_NAME: third ? ns.EraAlmanac.horseName(third.horseId) : "",
      HISTORICAL_WINNER_NAME: historicalWinner,
      RACE_CONDITION: edition ? `${edition.course}${edition.distance}米·${edition.going}` : "",
      RACE_GRADE: o.raceId ? (edition?.grade || "") : (focus?.grade || edition?.grade || ""),
      HEADCOUNT: edition ? (ns.EraAlmanac.historicalHeadcount(edition).count ?? "待核实") : "",
      FAME: summary.fame ?? 0,
      STARTS: summary.starts ?? 0,
      RIVAL_NAME: ctx.rivalId ? ns.EraAlmanac.horseName(ctx.rivalId) : "",
      OPPONENT_NAME: opponent ? ns.EraAlmanac.horseName(opponent.horseId) : ""
    };
  }

  function add(run, category, event, options) {
    const o = options || {};
    const id = o.id || `${category}:${event?.id || run.events.length}:${run.news.length}`;
    if (run.news.some((item) => item.id === id)) return null;
    const t = tokens(run, event);
    const ctx = ns.EraConditions.context(run, { event });
    let template = o.template || null;
    let source = "template";
    if (!template && category === "historical") {
      const note = ns.EraNewsNotes.noteFor(event?.raceId);
      if (note) { template = { id: `note:${note.raceId}`, title: note.title, body: note.body }; source = "note"; }
    }
    if (!template) template = ns.EraNewsTemplates.select(category, ctx);
    if (!template) return null;
    // 专题目标取匹配的关系标签，避免宿敌与克星指向不同马时串名。
    const targetPrefix = template.when?.hasTagPrefix;
    if (["rival:", "nemesis:"].includes(targetPrefix)) {
      const target = ctx.tags.find((tag) => tag.startsWith(targetPrefix));
      if (target) t.RIVAL_NAME = ns.EraAlmanac.horseName(target.slice(targetPrefix.length));
    }
    const item = {
      id, date: event?.date || run.date, status: "draft", kind: category, source,
      featureTag: o.featureTag || "", eventSequence: run.events.length,
      tokensSnapshot: clone(t),
      title: ns.EraTextIndex.replaceOnce(template.title, t),
      body: ns.EraTextIndex.replaceOnce(template.body, t),
      read: false
    };
    run.news.push(item);
    return item;
  }

  function featureKey(template) {
    if (template.when?.tags?.length) return template.when.tags.join("+");
    if (template.when?.hasTagPrefix) return template.when.hasTagPrefix;
    return "";
  }

  // 专题报道由叙事标签触发：同一标签只出一次专题。
  function syncFeatures(run, event) {
    const ctx = ns.EraConditions.context(run, { event });
    const fired = new Set(run.news.map((item) => item.featureTag).filter(Boolean));
    const candidates = ns.EraNewsTemplates.list()
      .filter((template) => template.category === "feature")
      .map((template) => ({ template, key: featureKey(template) }))
      .filter(({ key }) => key && !fired.has(key))
      .filter(({ template }) => ns.EraConditions.matches(template.when, ctx))
      .sort((left, right) => (right.template.priority || 0) - (left.template.priority || 0));
    const chosen = [];
    for (const candidate of candidates) {
      if (chosen.length >= 2) break;
      if (chosen.some((item) => item.key === candidate.key)) continue;
      chosen.push(candidate);
    }
    for (const { template, key } of chosen) add(run, "feature", event, { template, featureTag: key });
    return chosen.length;
  }

  ns.EraNews = { add, tokens, syncFeatures, personName };
})();
