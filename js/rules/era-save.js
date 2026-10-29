(function () {
  const ns = (window.Keiba = window.Keiba || {});
  const KEY = "keiba-era-save-v1", LEGACY_KEY = "keiba-era-save-legacy";
  function read(storage) {
    let raw;
    try { raw = storage.getItem(KEY); } catch { return { blocked: true, message: "无法访问剧情存档，禁止覆盖。" }; }
    if (!raw) return { run: null, entrySetup: null, blocked: false, message: "" };
    let payload;
    try {
      payload = JSON.parse(raw);
      if (!payload || payload.version !== 3 || (!payload.run && !payload.entrySetup)) throw new Error("Invalid era payload");
      if (payload.run && payload.run.version > ns.EraRules.RUN_VERSION) return { blocked: true, message: "这是较新版本的剧情存档，已保留，当前原型不能覆盖。" };
      const run = payload.run ? ns.EraRules.normalizeSave(payload.run) : null;
      const entrySetup = payload.entrySetup ? ns.EraRules.normalizeEntrySetup(payload.entrySetup) : null;
      return { run, entrySetup, blocked: false, savedAt: payload.savedAt, message: "已恢复独立剧情存档。" };
    } catch {
      let archived = false;
      try {
        const prior = storage.getItem(LEGACY_KEY);
        if (!prior || prior === raw) {
          storage.setItem(LEGACY_KEY, raw);
          archived = storage.getItem(LEGACY_KEY) === raw;
        }
        if (archived) storage.removeItem(KEY);
      } catch { archived = false; }
      return { run: null, entrySetup: null, blocked: !archived, message: archived ? "旧验证版或无法读取的剧情存档已原样归档，新原型需要重新开始。" : "原始剧情存档已保留，备份未完成，禁止覆盖。" };
    }
  }
  ns.EraSave = { read, KEY, LEGACY_KEY };
})();
