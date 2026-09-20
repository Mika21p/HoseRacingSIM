(function () {
  "use strict";
  const ns = (window.Keiba = window.Keiba || {});
  const W = ns.ChairmanRules;
  const field = (key, label, type) => ({ key, label, type: type || "text" });
  const HORSE = [field("id", "编号"), field("name", "马名"), field("gender", "性别"), field("birthYear", "出生年份", "number"),
    field("homeRegion", "所属地区"), field("owner", "马主"), field("coat", "毛色"), field("strength", "基础能力", "number"),
    field("weight", "体重kg", "number"), field("breedingStrength", "配种实力", "number"), field("temperamentLabel", "气性"), field("heavyType", "重场地适性"),
    field("distMin", "距离下限米", "number"), field("coreDist", "核心距离米", "number"), field("distMax", "距离上限米", "number"),
    field("growthType", "成长类型"), field("peakStart", "巅峰开始"), field("peakEnd", "巅峰结束"),
    field("fatherId", "父马编号"), field("motherId", "母马编号"), field("sireId", "父系模板"), field("damId", "母系模板"),
    ...["日本", "香港", "美国", "欧洲", "其他"].map((key) => field(`grass.${key}`, `草地${key}`)),
    ...["日本", "中东", "美国"].map((key) => field(`dirt.${key}`, `泥地${key}`)),
    ...["东京", "中山", "京都", "阪神", "其他地方"].map((key) => field(`courseGrades.${key}`, `赛道${key}`))];
  const RACE = [field("id", "编号"), field("name", "比赛名"), field("raceClass", "格付"), field("trackId", "马场编号"), field("trackName", "马场"),
    field("surface", "场地"), field("distance", "距离米", "number"), field("month", "月份", "number"), field("half", "半月", "half"),
    field("ageRule", "年龄条件"), field("sexRule", "性别条件"), field("capacity", "参赛上限", "number"),
    ...[1, 2, 3, 4, 5].map((n) => field(`prizes.${n - 1}`, `${n}着赏金万`, "number"))];
  function schema(kind) { if (kind === "horse") return HORSE; if (kind === "race") return RACE; throw new Error("模板类型无效。"); }
  function read(obj, key) { return key.split(".").reduce((value, part) => value == null ? undefined : value[part], obj); }
  function write(obj, key, value) {
    const parts = key.split("."); let target = obj;
    for (const part of parts.slice(0, -1)) target = target[part] || (target[part] = part === "prizes" ? [] : {});
    target[parts[parts.length - 1]] = value;
  }
  function parse(text) {
    text = String(text).replace(/^\uFEFF/, "");
    const rows = []; let values = [], value = "", quoted = false, closed = false, line = 1, start = 1;
    function push() { values.push(value); value = ""; closed = false; }
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (quoted) {
        if (char === '"') { if (text[i + 1] === '"') { value += '"'; i++; } else { quoted = false; closed = true; } }
        else { value += char; if (char === "\n") line++; }
      } else if (char === '"') {
        if (value || closed) throw new Error(`第${line}行：引号须包围整个字段。`);
        quoted = true;
      } else if (char === ",") push();
      else if (char === "\r" || char === "\n") {
        if (char === "\r" && text[i + 1] === "\n") i++;
        push(); if (values.some((v) => v !== "")) rows.push({ values, line: start });
        values = []; line++; start = line;
      } else {
        if (closed) throw new Error(`第${line}行：闭合引号后只允许逗号或换行。`);
        value += char;
      }
    }
    if (quoted) throw new Error(`第${start}行：引号未闭合。`);
    push(); if (values.some((v) => v !== "")) rows.push({ values, line: start });
    return rows;
  }
  function quote(value, numeric) {
    let text = value == null ? "" : String(value);
    // Text fields must not become executable spreadsheet formulas.
    if (!numeric && /^[=+\-@\t\r']/.test(text)) text = `'${text}`;
    return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  }
  function exportRows(world, kind, ids) {
    const fields = schema(kind);
    const rows = (kind === "horse" ? world.horses.filter((h) => h.origin === "custom") : world.races.filter((r) => !r.deleted))
      .filter((row) => !ids || ids.includes(row.id));
    const output = [["模板版本", "来源世界", ...fields.map((f) => f.label)].map((v) => quote(v)).join(",")];
    for (const original of rows) {
      const row = { ...original };
      if (kind === "horse") row.breedingStrength = original.breeding?.strength ?? original.breedingStrength;
      if (kind === "race") row.trackName = (world.tracks.find((t) => t.id === row.trackId) || {}).name;
      output.push(["1", quote(world.id), ...fields.map((f) => quote(read(row, f.key), f.type === "number"))].join(","));
    }
    return "\uFEFF" + output.join("\r\n") + "\r\n";
  }
  function template(world, kind) {
    const demo = W.clone(world);
    if (kind === "horse") {
      demo.horses = [];
      W.seeded(demo, () => W.addHorse(demo, { origin: "custom", name: "示例赛马", age: 2, homeRegion: "日本" }));
      demo.horses[0].id = "example-horse";
    } else demo.races = [{ id: "example-race", name: "示例大赛", trackId: (demo.tracks[0] || {}).id || "",
      raceClass: "g3", surface: "草地", distance: 2000, month: 6, half: 1, ageRule: "3+", sexRule: "all", capacity: 16, prizes: W.defaultPrizes("g3") }];
    return exportRows(demo, kind);
  }
  function preview(world, kind, text, options) {
    const opts = options || {}; const mode = opts.mode || "copy";
    const errors = [], changes = []; let added = 0, updated = 0, skipped = 0;
    const fields = schema(kind); const lookup = new Map(fields.map((f) => [f.label, f]));
    let rows;
    try { rows = parse(text); } catch (error) { return { errors: [error.message], changes, added, updated, skipped, output: null }; }
    if (!rows.length) return { errors: ["CSV为空。"], changes, added, updated, skipped, output: null };
    const headers = rows.shift().values.map((v) => v.trim());
    if (new Set(headers).size !== headers.length) errors.push("表头含重复列。");
    for (const header of headers) if (!["模板版本", "来源世界"].includes(header) && !lookup.has(header)) errors.push(`不支持的列：${header}`);
    if (!headers.includes("模板版本")) errors.push("缺少模板版本列，请使用本模式模板。");
    if (!headers.includes(kind === "horse" ? "马名" : "比赛名")) errors.push("缺少名称列。");
    if (!["copy", "update", "skip"].includes(mode)) errors.push("导入模式无效。");
    if (errors.length) return { errors, changes, added, updated, skipped, output: null };
    const inputIds = new Set(); const remap = new Map();
    const output = W.mutate(world, (w) => {
      const collection = kind === "horse" ? w.horses : w.races;
      const prepared = [], pendingStrength = new Map();
      for (const row of rows) {
        if (row.values.length !== headers.length) { errors.push(`第${row.line}行：列数与表头不一致。`); continue; }
        const version = row.values[headers.indexOf("模板版本")];
        if (version !== "1") { errors.push(`第${row.line}行：不支持模板版本${version}。`); continue; }
        const rawId = headers.includes("编号") ? row.values[headers.indexOf("编号")].trim() : "";
        if (rawId && inputIds.has(rawId)) { errors.push(`第${row.line}行，编号：文件中重复。`); continue; }
        if (rawId) inputIds.add(rawId);
        const existing = collection.find((item) => item.id === rawId);
        if (existing && mode === "skip") { skipped++; if (rawId) remap.set(rawId, existing.id); continue; }
        if (existing && mode === "update" && kind === "horse" && existing.origin !== "custom") { errors.push(`第${row.line}行：不能修改普通AI马真实属性。`); continue; }
        const replacing = existing && mode === "update";
        const targetId = replacing ? existing.id : `${kind}-${w.nextId++}`;
        if (rawId) remap.set(rawId, targetId);
        prepared.push({ row, existing: replacing ? existing : null, targetId });
      }
      for (const { row, existing, targetId } of prepared) {
        let value;
        if (existing) value = W.clone(existing);
        else if (kind === "race") value = { id: targetId, name: "", raceClass: "op", ageRule: "2+", sexRule: "all", surface: "草地",
          month: 1, half: 1, distance: 1600, capacity: 16, prizes: W.defaultPrizes("op"), deleted: false };
        else {
          const generated = W.addHorse(w, { id: targetId, origin: "custom", age: 2 });
          w.horses.pop(); w.totalHorses--; value = generated;
        }
        let trackName = "", suppliedTrackId = "";
        let invalid = false;
        headers.forEach((header, index) => {
          const f = lookup.get(header); let cell = row.values[index];
          if (!f || f.key === "id" || cell === "") return;
          if (f.type !== "text") cell = cell.trim();
          if (cell === "#CLEAR") {
            if (["fatherId", "motherId", "owner", "coat", "sireId", "damId"].includes(f.key)) write(value, f.key, "");
            else { errors.push(`第${row.line}行，${header}：该字段不可清空。`); invalid = true; }
            return;
          }
          if (f.key === "trackName") { trackName = cell; return; }
          if (f.key === "trackId") { suppliedTrackId = cell; return; }
          if (f.type === "number") {
            if (!/^-?\d+(?:\.\d+)?$/.test(cell) || !Number.isFinite(Number(cell))) { errors.push(`第${row.line}行，${header}：需要数字。`); invalid = true; return; }
            write(value, f.key, Number(cell));
          } else if (f.type === "half") {
            const half = ({ "1": 1, "2": 2, "上半月": 1, "下半月": 2 })[cell];
            if (!half) { errors.push(`第${row.line}行，半月：仅接受1／2或上半月／下半月。`); invalid = true; }
            else value.half = half;
          } else write(value, f.key, /^'[=+\-@\t\r']/.test(cell) ? cell.slice(1) : cell);
        });
        if (invalid) continue;
        if (kind === "horse") {
          if (!existing || value.homeRegion !== existing.homeRegion) value.locationRegion = value.homeRegion;
          for (const key of ["fatherId", "motherId"]) if (value[key]) {
            const external = headers.includes("来源世界") ? row.values[headers.indexOf("来源世界")] !== w.id : !(existing && existing[key] === value[key]);
            if (remap.has(value[key])) value[key] = remap.get(value[key]);
            else if (opts.parentMappings?.[value[key]]) value[key] = opts.parentMappings[value[key]];
            else if (external) { errors.push(`第${row.line}行，${key === "fatherId" ? "父马编号" : "母马编号"}：跨世界引用${value[key]}须明确映射，不能按同号自动关联。`); invalid = true; }
          }
          if (value.breedingStrength != null && w.breeding) { value.breeding.strength = value.breedingStrength; delete value.breedingStrength; }
          else if (!existing && w.breeding) pendingStrength.set(value.id, value);
          if (invalid) continue;
        } else {
          value.raceClass = String(value.raceClass).toLowerCase();
          value.grade = value.raceClass.toUpperCase();
          const mapping = opts.trackMappings && opts.trackMappings[trackName];
          let track = w.tracks.find((t) => t.id === mapping && !t.deleted);
          if (!track && suppliedTrackId) track = w.tracks.find((t) => t.id === suppliedTrackId && !t.deleted && (!trackName || t.name === trackName));
          if (!track && trackName) {
            const matches = w.tracks.filter((t) => t.name === trackName && !t.deleted);
            if (matches.length === 1) track = matches[0];
          }
          if (!track && !suppliedTrackId && !trackName && existing) track = w.tracks.find((t) => t.id === existing.trackId);
          if (!track) { errors.push(`第${row.line}行，马场：无法唯一匹配“${trackName || suppliedTrackId}”，请指定映射。`); continue; }
          value.trackId = track.id;
        }
        try { if (kind === "horse") W.validateHorse(w, value); else W.validateRace(w, value); }
        catch (error) { errors.push(`第${row.line}行：${error.message}`); continue; }
        if (existing) { Object.assign(existing, value); updated++; }
        else { collection.push(value); added++; if (kind === "horse") w.totalHorses++; }
        changes.push({ line: row.line, name: value.name, action: existing ? "更新" : "新增", id: value.id });
      }
      if (!errors.length) {
        try {
          W.validateWorld(w);
          // Resolve the complete batch before deriving B, including parents appearing later in the CSV.
          const settled = new Set();
          function initializeStrength(h) {
            if (settled.has(h.id)) return;
            for (const id of [h.fatherId, h.motherId]) if (pendingStrength.has(id)) initializeStrength(pendingStrength.get(id));
            delete h.breeding; ns.ChairmanBreeding.initialize(w, h); settled.add(h.id);
          }
          for (const h of pendingStrength.values()) initializeStrength(h);
          W.planEntries(w);
        } catch (error) { errors.push(error.message); }
      }
    });
    return { errors, changes, added, updated, skipped, baseRevision: world.revision, output: errors.length ? null : output };
  }
  ns.ChairmanCSV = { schema, parse, exportRows, template, preview };
})();
