(function () {
  const ns = (window.Keiba = window.Keiba || {});
  const entries = new Map();
  const REGISTERED_TOKENS = Object.freeze({
    PLAYER_REFERENCE: "马主",
    PLAYER_HORSE_NAME: "你的赛马",
    RACE_NAME: "比赛",
    WINNER_NAME: "优胜马",
    FINISH: "未出赛",
    DATE: "1998",
    WINS: "0",
    G1_WINS: "0",
    PLAYER_RANK: "着外",
    PLAYER_JOCKEY: "你的骑手",
    WINNER_JOCKEY: "优胜骑手",
    SECOND_NAME: "亚军",
    THIRD_NAME: "季军",
    HISTORICAL_WINNER_NAME: "史实冠军",
    RACE_CONDITION: "赛况未记录",
    RACE_GRADE: "未分级",
    HEADCOUNT: "0",
    FAME: "0",
    STARTS: "0",
    RIVAL_NAME: "老对手",
    OPPONENT_NAME: "对手"
  });
  function register(items) {
    for (const item of items) {
      if (!item.id || entries.has(item.id)) throw new Error(`Duplicate era text: ${item.id}`);
      entries.set(item.id, { status: "draft", ...item });
    }
  }
  function replaceOnce(value, tokens) {
    const snapshot = { ...REGISTERED_TOKENS, ...tokens };
    return String(value || "").replace(/\{\{([A-Z0-9_]+)\}\}/g, (_match, key) => String(snapshot[key] ?? ""));
  }
  function resolve(id, tokens) {
    const item = entries.get(id);
    if (!item || ["outline", "placeholder"].includes(item.status)) throw new Error(`Unplayable era text: ${id}`);
    return { ...item, title: replaceOnce(item.title, tokens), body: replaceOnce(item.body, tokens) };
  }
  function validate() {
    const warnings = [];
    entries.forEach((item) => {
      if (!["draft", "final"].includes(item.status)) warnings.push({ type: "unplayable-text", id: item.id });
      for (const m of `${item.title}\n${item.body}`.matchAll(/\{\{([A-Z0-9_]+)\}\}/g)) if (!(m[1] in REGISTERED_TOKENS)) warnings.push({ type: "unknown-token", id: item.id, token: m[1] });
    });
    return warnings;
  }
  ns.EraTextIndex = { register, resolve, replaceOnce, validate, get: (id) => entries.get(id) || null, get ALL() { return [...entries.values()]; }, REGISTERED_TOKENS };
})();
