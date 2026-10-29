(function () {
  const ns = (window.Keiba = window.Keiba || {});
  // 声明式条件与效果：剧情片段和新闻模板共用同一套受限语法，不使用 eval。
  const CONDITION_KEYS = new Set([
    "eventType", "tags", "notTags", "hasTagPrefix", "window", "registered", "entered", "rewritten",
    "fame", "horseType", "rank", "grade", "retired", "deadHeat", "upset", "maiden", "starts"
  ]);
  const EFFECT_TYPES = new Set(["fame", "tag", "media", "relation"]);
  const MEDIA_VALUES = new Set(["quiet", "confident"]);
  const RELATION_KINDS = new Set(["rival", "nemesis"]);
  const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

  function validate(spec, owner) {
    const warnings = [];
    if (spec === undefined || spec === null) return warnings;
    if (typeof spec !== "object" || Array.isArray(spec)) { warnings.push({ type: "invalid-condition", owner }); return warnings; }
    for (const [key, value] of Object.entries(spec)) {
      if (!CONDITION_KEYS.has(key)) { warnings.push({ type: "unknown-condition-key", owner, key }); continue; }
      if (key === "eventType" || key === "tags" || key === "notTags" || key === "hasTagPrefix") {
        const list = Array.isArray(value) ? value : [value];
        if (!list.length || list.some((item) => typeof item !== "string")) warnings.push({ type: "invalid-condition-value", owner, key });
      } else if (key === "window") {
        if (!Array.isArray(value) || value.length !== 2 || value.some((item) => !DATE_PATTERN.test(String(item)))) warnings.push({ type: "invalid-condition-window", owner, key });
      } else if (key === "fame") {
        if (!value || typeof value !== "object" || Array.isArray(value)) warnings.push({ type: "invalid-condition-value", owner, key });
        else {
          if (value.min !== undefined && !Number.isFinite(value.min)) warnings.push({ type: "invalid-condition-value", owner, key });
          if (value.max !== undefined && !Number.isFinite(value.max)) warnings.push({ type: "invalid-condition-value", owner, key });
        }
      } else if (key === "rank") {
        const list = Array.isArray(value) ? value : [value];
        if (!list.length || list.some((item) => !Number.isInteger(item))) warnings.push({ type: "invalid-condition-value", owner, key });
      } else if (key === "starts") {
        if (!Number.isInteger(value) || value < 0) warnings.push({ type: "invalid-condition-value", owner, key });
      } else if (key === "retired" || key === "deadHeat" || key === "upset" || key === "maiden") {
        if (typeof value !== "boolean") warnings.push({ type: "invalid-condition-value", owner, key });
      } else if (typeof value !== "string") warnings.push({ type: "invalid-condition-value", owner, key });
    }
    return warnings;
  }

  function validateEffect(effect, owner) {
    const warnings = [];
    if (!effect || typeof effect !== "object" || Array.isArray(effect)) return [{ type: "invalid-effect", owner }];
    if (!EFFECT_TYPES.has(effect.type)) return [{ type: "unknown-effect-type", owner, effect: effect.type }];
    if (effect.type === "fame") {
      if (!Number.isFinite(effect.delta) || effect.delta === 0) warnings.push({ type: "invalid-effect", owner, effect: "fame" });
    } else if (effect.type === "tag") {
      if (typeof effect.add !== "string" || !effect.add) warnings.push({ type: "invalid-effect", owner, effect: "tag" });
    } else if (effect.type === "media") {
      if (!MEDIA_VALUES.has(effect.value)) warnings.push({ type: "invalid-effect", owner, effect: "media" });
    } else if (effect.type === "relation") {
      if (typeof effect.target !== "string" || !effect.target) warnings.push({ type: "invalid-effect", owner, effect: "relation" });
      else if (!RELATION_KINDS.has(effect.kind)) warnings.push({ type: "invalid-effect", owner, effect: "relation-kind" });
    }
    return warnings;
  }

  function horseTypeOf(run) {
    const scenario = ns.EraScenarioRegistry?.find(run?.scenarioId);
    return scenario?.routeId || "";
  }

  // 从不可变事件流推导上下文；标签与名声由 EraNarrative 重算，这里只读取快照。
  function context(run, options) {
    const o = options || {};
    const events = run?.events || [];
    const entered = new Set(), rewritten = new Set(), eventTypes = new Set();
    let results = [];
    for (const event of events) {
      eventTypes.add(event.type);
      if (event.type === "race-result") {
        results.push(event);
        if (event.raceId) entered.add(event.raceId);
        if (event.raceId && event.historicalWinnerId && event.winnerId && event.winnerId !== event.historicalWinnerId) rewritten.add(event.raceId);
      }
    }
    const focus = o.event || results[results.length - 1] || null;
    const summary = run?.summary || {};
    const tags = summary.tags || [];
    const rivalTag = tags.find((tag) => tag.startsWith("rival:")) || tags.find((tag) => tag.startsWith("nemesis:")) || "";
    const edition = focus?.raceId ? ns.EraAlmanac?.race(focus.raceId) : null;
    const historicalWinner = edition?.results?.[0] || null;
    // 爆冷：玩家取胜，而当年这匹夺冠马是全场最被看好的那一匹。
    const upset = !!(focus && focus.rank === 1 && !focus.retired && historicalWinner && historicalWinner.popularity === 1 && focus.winnerId && focus.winnerId !== focus.historicalWinnerId);
    return {
      date: run?.date || "",
      tags,
      fame: Number.isFinite(summary.fame) ? summary.fame : 0,
      horseType: horseTypeOf(run),
      eventTypes,
      entered,
      rewritten,
      registered: run?.scheduledRace || "",
      starts: results.length,
      rank: focus?.rank,
      grade: focus?.grade,
      retired: !!focus?.retired,
      deadHeat: !!focus?.deadHeat,
      upset: upset,
      maiden: results.length === 1 && focus?.rank === 1 && !focus?.retired,
      raceId: focus?.raceId || "",
      rivalId: rivalTag.split(":")[1] || "",
      event: focus
    };
  }

  function matches(spec, ctx) {
    if (!spec) return true;
    if (!Object.keys(spec).length) return true;
    if (spec.eventType) {
      const list = Array.isArray(spec.eventType) ? spec.eventType : [spec.eventType];
      if (!list.some((type) => ctx.eventTypes.has(type))) return false;
    }
    if (spec.tags && !spec.tags.every((tag) => ctx.tags.includes(tag))) return false;
    if (spec.notTags && spec.notTags.some((tag) => ctx.tags.includes(tag))) return false;
    if (spec.hasTagPrefix && !ctx.tags.some((tag) => tag.startsWith(spec.hasTagPrefix))) return false;
    if (spec.window && (ctx.date < spec.window[0] || ctx.date > spec.window[1])) return false;
    if (spec.registered && ctx.registered !== spec.registered) return false;
    if (spec.entered && !ctx.entered.has(spec.entered)) return false;
    if (spec.rewritten && !ctx.rewritten.has(spec.rewritten)) return false;
    if (spec.fame) {
      if (spec.fame.min !== undefined && ctx.fame < spec.fame.min) return false;
      if (spec.fame.max !== undefined && ctx.fame > spec.fame.max) return false;
    }
    if (spec.horseType && ctx.horseType !== spec.horseType) return false;
    if (spec.rank !== undefined) {
      const list = Array.isArray(spec.rank) ? spec.rank : [spec.rank];
      if (!list.includes(ctx.rank)) return false;
    }
    if (spec.grade !== undefined) {
      const list = Array.isArray(spec.grade) ? spec.grade : [spec.grade];
      if (!list.includes(ctx.grade)) return false;
    }
    if (spec.retired !== undefined && ctx.retired !== spec.retired) return false;
    if (spec.deadHeat !== undefined && ctx.deadHeat !== spec.deadHeat) return false;
    if (spec.upset !== undefined && ctx.upset !== spec.upset) return false;
    if (spec.maiden !== undefined && ctx.maiden !== spec.maiden) return false;
    if (spec.starts !== undefined && ctx.starts !== spec.starts) return false;
    return true;
  }

  ns.EraConditions = { CONDITION_KEYS, EFFECT_TYPES, MEDIA_VALUES, RELATION_KINDS, validate, validateEffect, context, matches };
})();
