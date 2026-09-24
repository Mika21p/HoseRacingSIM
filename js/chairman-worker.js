/* Creation-file work is isolated from the simulation random source and the UI. */
"use strict";
self.window = self;
var window = self;
self.Keiba = {};
importScripts("utils/random.js", "data/bloodlines.js", "rules/time.js", "rules/region-rules.js", "rules/maturity.js",
  "rules/temperament.js", "rules/track-aptitude.js", "rules/horse-generator.js", "rules/comments.js", "rules/career.js", "rules/chairman-ratings.js", "rules/chairman-scheduling.js", "rules/chairman.js",
  "data/chairman-pedigrees.js", "data/bloodline-catalog.js", "rules/bloodline-system.js", "rules/chairman-genetics.js", "rules/chairman-breeding.js", "rules/chairman-honors.js", "chairman-csv.js", "rules/chairman-series.js", "chairman-packages.js", "rules/chairman-editor.js", "chairman-storage.js");
importScripts("data/jockeys.js","data/races/registry.js","data/races/core.js","data/jra-course-catalogue.js","data/races/America/conditions.js","data/races/America/g1.js","data/races/America/g2.js","data/races/America/g3.js","data/races/Argentina/g1.js","data/races/Australia/g1.js","data/races/Europe/conditions.js","data/races/Europe/g1.js","data/races/Europe/g2.js","data/races/Europe/g3.js","data/races/HongKong/g1.js","data/races/Japan/conditions.js","data/races/Japan/g1.js","data/races/Japan/g2.js","data/races/Japan/g3.js","data/races/Japan/open.js","data/races/MiddleEast/g1.js","data/races/MiddleEast/g2.js","data/races/MiddleEast/g3.js","data/race-course-profiles.js","rules/jockey-rules.js","rules/injury-rules.js","rules/race-fatigue.js","rules/historical-opponents.js","rules/race-simulator.js","rules/chairman-office.js","data/chairman-venue-records.js","data/chairman-venues.js","rules/chairman-world.js","chairman-world-packages.js");
self.onmessage = (event) => {
  const { kind, payload } = event.data;
  try {
    let result;
    if(kind === "referencePreview"){
      const g=self.Keiba.ChairmanWorldPackages.referencePreview(payload);for(;;){const next=g.next();if(next.done){result=next.value;break;}self.postMessage({progress:next.value.name});}
    } else if (kind === "createWorld") {
      self.postMessage({progress:"正在建立地区、马场、赛历与初始马群…"}); result=self.Keiba.ChairmanWorld.create(payload);
    } else if (kind === "advanceWorld" || kind === "finishWorld") {
      self.postMessage({progress:"正在后台结算比赛、马群和跨年安排…"}); result=kind === "advanceWorld"?self.Keiba.ChairmanRules.advanceHalfMonth(payload,{deferHonors:true}):self.Keiba.ChairmanRules.finishYear(payload);
    } else if (kind === "worldPreview") {
      self.postMessage({progress:"正在校验关联并重新安排未来报名…"});result=self.Keiba.ChairmanWorld.preview(payload.world,payload.kind,payload.value);
    } else if (kind === "csv") {
      self.postMessage({ progress: "正在后台解析、校验表格与关联…" });
      result = self.Keiba.ChairmanCSV.preview(payload.world, payload.kind, payload.text, payload.options);
      if (payload.kind === "race") {
        const rows = self.Keiba.ChairmanCSV.parse(payload.text), column = rows[0]?.values.indexOf("马场");
        result.missingTracks = [...new Set(rows.slice(1).map((r) => r.values[column]).filter((name) => name && !payload.world.tracks.some((t) => t.name === name)))];
      }
    } else if (kind === "contentPreview") {
      const p=typeof payload.package==='string'?JSON.parse(payload.package):payload.package;
      const g=self.Keiba.ChairmanPackages.previewSteps(payload.world,p,payload.options);
      for(;;){const n=g.next();if(n.done){result=n.value;break;}self.postMessage({progress:n.value.name+' '+n.value.done+'/'+n.value.total});}
    } else if (kind === "parseSave") {
      self.postMessage({ progress: "正在后台解析存档…" }); result = JSON.parse(payload);
      self.postMessage({ progress: "正在检查存档版本、评分与关联…" }); self.Keiba.ChairmanStorage.Store.prototype.validateSnapshot(result);
    } else if (kind === "stringify") {
      self.postMessage({ progress: "正在后台生成完整存档文件…" }); result = JSON.stringify(payload);
    } else throw new Error("后台操作无效。");
    self.postMessage({ result });
  } catch (error) { self.postMessage({ error: error.message }); }
};
