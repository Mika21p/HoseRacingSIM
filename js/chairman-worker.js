/* Creation-file work is isolated from the simulation random source and the UI. */
"use strict";
self.window = self;
var window = self;
self.Keiba = {};
importScripts("utils/random.js", "data/bloodlines.js", "rules/time.js", "rules/region-rules.js", "rules/maturity.js",
  "rules/temperament.js", "rules/horse-generator.js", "rules/comments.js", "rules/career.js", "rules/chairman-ratings.js", "rules/chairman-scheduling.js", "rules/chairman.js",
  "data/chairman-pedigrees.js", "rules/chairman-breeding.js", "chairman-csv.js", "chairman-storage.js");
self.onmessage = (event) => {
  const { kind, payload } = event.data;
  try {
    let result;
    if (kind === "csv") {
      self.postMessage({ progress: "正在后台解析、校验表格与关联…" });
      result = self.Keiba.ChairmanCSV.preview(payload.world, payload.kind, payload.text, payload.options);
      if (payload.kind === "race") {
        const rows = self.Keiba.ChairmanCSV.parse(payload.text), column = rows[0]?.values.indexOf("马场");
        result.missingTracks = [...new Set(rows.slice(1).map((r) => r.values[column]).filter((name) => name && !payload.world.tracks.some((t) => t.name === name)))];
      }
    } else if (kind === "parseSave") {
      self.postMessage({ progress: "正在后台解析存档…" }); result = JSON.parse(payload);
      self.postMessage({ progress: "正在检查存档版本、评分与关联…" }); self.Keiba.ChairmanStorage.Store.prototype.validateSnapshot(result);
    } else if (kind === "stringify") {
      self.postMessage({ progress: "正在后台生成完整存档文件…" }); result = JSON.stringify(payload);
    } else throw new Error("后台操作无效。");
    self.postMessage({ result });
  } catch (error) { self.postMessage({ error: error.message }); }
};
