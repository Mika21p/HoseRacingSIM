(function () {
  const ns = (window.Keiba = window.Keiba || {});
  function validate() {
    const warnings = [], ids = new Set();
    for (const node of ns.EraStoryletData || []) {
      if (ids.has(node.id)) warnings.push({ type: "duplicate-storylet", id: node.id });
      ids.add(node.id);
      if (!ns.EraTextIndex.get(node.textId)) warnings.push({ type: "unknown-storylet-text", id: node.id });
      warnings.push(...ns.EraConditions.validate(node.when, node.id));
      for (const choice of node.choices || []) for (const effect of choice.effects || []) {
        warnings.push(...ns.EraConditions.validateEffect(effect, node.id));
        if (effect?.type === "relation" && ns.EraAlmanac && !ns.EraAlmanac.horse(effect.target)) warnings.push({ type: "unknown-relation-target", id: node.id, target: effect.target });
      }
      for (const effect of node.effects || []) warnings.push(...ns.EraConditions.validateEffect(effect, node.id));
    }
    return warnings;
  }
  function sync(run, scenario) {
    if (validate().length) throw new Error("Invalid era storylet data");
    const ctx = ns.EraConditions.context(run);
    const nodes = (ns.EraStoryletData || [])
      .filter((node) => scenario.storyletIds.includes(node.id))
      .filter((node) => !run.storylets.resolved.includes(node.id) && !run.storylets.pending.some((pending) => pending.id === node.id))
      .filter((node) => ns.EraConditions.matches(node.when, ctx))
      .sort((left, right) => (right.priority || 0) - (left.priority || 0));
    for (const node of nodes.slice(0, 2)) {
      // 片段自己指向的比赛决定日期与赛事名：赛前片段用报名赛的日期，赛后片段用该场的名次。
      const raceId = node.when.entered || node.when.registered || node.when.rewritten || "";
      const edition = raceId ? ns.EraAlmanac.race(raceId) : null;
      const result = node.when.entered ? (run.events || []).find((event) => event.type === "race-result" && event.raceId === raceId) : null;
      if (node.when.entered && !result) continue;
      const t = ns.EraNews.tokens(run, result, { raceId, date: edition?.date || run.date, summaryYear: node.summaryYear });
      run.storylets.pending.push({
        id: node.id, priority: node.priority || 0, textId: node.textId, raceId,
        tokensSnapshot: { ...t }, content: ns.EraTextIndex.resolve(node.textId, t),
        choices: JSON.parse(JSON.stringify(node.choices || [])), createdSequence: run.events.length, date: t.DATE
      });
    }
    run.storylets.pending.sort((left, right) => (right.priority || 0) - (left.priority || 0));
    return run.storylets.pending.length;
  }
  function resolve(run, id, choiceId) {
    const current = run.storylets.pending[0];
    if (!current || current.id !== id) return false;
    const choice = (current.choices || []).find((item) => item.id === choiceId);
    if (!choice) return false;
    for (const effect of choice.effects || []) {
      const warnings = ns.EraConditions.validateEffect(effect, current.id);
      if (warnings.length) throw new Error("Invalid storylet effect");
      if (effect.type === "media") run.media = effect.value;
      ns.EraRules.recordEffect(run, effect);
      if (effect.type === "media") ns.EraNews.add(run, "media", null, { id: `media:${run.events.length}:${run.news.length}` });
    }
    run.storylets.pending.shift();
    run.storylets.resolved.push(id);
    run.timeline.push({ ...current, choiceId });
    return true;
  }
  ns.EraStorylets = { validate, sync, resolve };
})();
