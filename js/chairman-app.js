(function () {
  "use strict";
  const ns = window.Keiba, W = ns.ChairmanRules, CSV = ns.ChairmanCSV;
  const escape = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const show = (v) => v == null ? "—" : escape(v);
  const date = (turn) => { const d = W.date(turn); return `第${d.year}年 ${d.month}月${d.half === 1 ? "上" : "下"}半月`; };
  const button = (action, text, id, extra) => `<button type="button" data-action="${action}" data-id="${escape(id || "")}" ${extra || ""}>${escape(text)}</button>`;
  const link = (id, name) => button("horse", name, id, 'class="cm-link"');
  const options = (items, value) => items.map((item) => { const pair = Array.isArray(item) ? item : [item, item]; return `<option value="${escape(pair[0])}" ${String(pair[0]) === String(value) ? "selected" : ""}>${escape(pair[1])}</option>`; }).join("");
  const input = (key, label, value, type) => `<label>${escape(label)}<input name="${escape(key)}" type="${type || "text"}" ${type === "number" ? 'step="any"' : ""} value="${escape(value)}"></label>`;
  const select = (key, label, items, value) => `<label>${escape(label)}<select name="${key}">${options(items, value)}</select></label>`;
  const read = (obj, key) => key.split(".").reduce((o, k) => o == null ? undefined : o[k], obj);
  const write = (obj, key, value) => { const parts = key.split("."); let target = obj; for (const part of parts.slice(0, -1)) target = target[part] || (target[part] = part === "prizes" ? [] : {}); target[parts.at(-1)] = value; };
  function download(name, text, type) { const url = URL.createObjectURL(new Blob([text], { type: type || "text/plain;charset=utf-8" })); const a = document.createElement("a"); a.href = url; a.download = name; a.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000); }
  const pause = () => new Promise((resolve) => window.setTimeout(resolve, 0));
  let root, body, dialog, store, world, office, busy = false, stopping = false, tab = "overview", page = 0, token = 0, preview = null;
  const positions = new Map();
  let activeWorker = null, cancelWorker = null;
  function background(kind, payload) {
    if (!window.Worker) throw new Error("此浏览器不支持后台文件处理，请使用支持Worker的浏览器。");
    if (stopping) throw new Error("操作已取消，当前世界未改变。");
    return new Promise((resolve, reject) => {
      const worker = new Worker("js/chairman-worker.js?v=20260919-chairman-v2"); activeWorker = worker;
      const end = () => { worker.terminate(); activeWorker = null; cancelWorker = null; };
      cancelWorker = () => { end(); reject(new Error("操作已取消，当前世界未改变。")); };
      worker.onmessage = ({ data }) => { if (data.progress) { notice(data.progress); return; } end(); if (data.error) reject(new Error(data.error)); else resolve(data.result); };
      worker.onerror = (event) => { end(); reject(new Error(event.message || "后台文件处理失败，当前世界未改变。")); };
      worker.postMessage({ kind, payload });
    });
  }
  const selected = { horse: new Set(), race: new Set() };
  function notice(text, error) { const el = root.querySelector(".cm-notice"); el.textContent = text; el.classList.toggle("cm-error", !!error); if (dialog?.open) dialog.querySelector(".cm-dialog-notice").textContent = text; }
  function modal(title, html) { dialog.innerHTML = `<header><h2>${escape(title)}</h2>${button("stop", "停止当前操作", "", 'class="cm-stop"')}${button("dialogTop", "↑ 顶部")}${button("close", "关闭")}</header><div class="cm-dialog-content">${html}</div><p class="cm-dialog-notice" role="status"></p>`; if (!dialog.open) dialog.showModal(); }
  function errorMessage(error) { console.error(error); notice(error.message || String(error), true); if (dialog.open) dialog.querySelector(".cm-dialog-notice").textContent = error.message || String(error); }
  async function run(action) {
    if (busy) return;
    busy = true; stopping = false; root.classList.add("cm-busy"); root.setAttribute("aria-busy", "true");
    try { await pause(); if (office) await office.flush(); if (stopping) throw new Error("操作已取消。"); await action(); } catch (error) { errorMessage(error); }
    finally { busy = false; root.classList.remove("cm-busy"); root.setAttribute("aria-busy", "false"); }
  }
  async function commit(out, checkpoint) {
    await store.commitChanges(world, out, { checkpoint }); world = out.world;
    notice("已保存至本地数据库。");
  }
  async function openWorld(id) {
    const loaded = await store.load(id); await store.acquire(id); world = loaded;
    tab = world.ui.tab || "overview"; page = 0;
    notice(store.writable ? "进度已恢复，所有操作自动保存。" : "当前为只读：另一页面正在操作此世界。可在设置中重新取得编辑权。", !store.writable);
    await render();
  }
  async function lobby() {
    world = null; await store.release(); const worlds = (await store.listWorlds()).sort((a, b) => b.turn - a.turn);
    root.querySelector(".cm-world-bar").innerHTML = "";
    body.innerHTML = `<div class="cm-welcome"><p class="cm-eyebrow">国际主席模式 · 第二轮测试版</p><h1>让世界的赛马，跑出自己的故事。</h1><p>建立马场与大赛，观察马群自动参赛，以表现评定年度地位。每次推进结算半个月。</p><div class="cm-actions">${button("new", "国际预设开局", "preset")}${button("new", "空白世界", "blank")}${button("importSave", "导入完整存档")}</div></div><h2>本地世界</h2>${worlds.map((w) => `<article class="cm-card"><h3>${escape(w.name)}</h3><p>${date(w.turn)}${w.phase === "yearEnd" ? " · 年末回合" : ""}</p>${button("openWorld", "继续世界", w.id)}</article>`).join("") || "<p>还没有本地世界。</p>"}`;
  }
  function filters(kind) { return office.filters(kind); }
  function pager(more) { return `<div class="cm-pagination">${button("page", "上一页", "-1", page === 0 ? "disabled" : "")}<span>第 ${page + 1} 页 · 每页最多50条</span>${button("page", "下一页", "1", more ? "" : "disabled")}</div>`; }
  function horseTable(horses) { return `<div class="cm-table-wrap"><table><thead><tr><th>选择</th><th>马名</th><th>年龄／性别</th><th>所属</th><th>本年WTR / TF</th><th>本年G1</th><th>生涯胜 / 出赛</th><th>赏金（万）</th><th>安排</th></tr></thead><tbody>${horses.map((h) => `<tr><td>${h.origin === "custom" ? `<input aria-label="选择${escape(h.name)}" type="checkbox" data-selection="horse" value="${escape(h.id)}" ${selected.horse.has(h.id) ? "checked" : ""}>` : ""}</td><td>${link(h.id, h.name)}${h.origin === "custom" ? '<small>自建</small>' : ""}</td><td>${W.ageOf(world, h)}岁 ${escape(h.gender)}</td><td>${escape(h.homeRegion)}</td><td>${show(W.rating(h))} / ${show(h.annual.tf)}</td><td>${h.annual.g1}</td><td>${h.lifetime.wins} / ${h.lifetime.starts}</td><td>${h.lifetime.prize.toFixed(1)}</td><td>${h.status === "retired" ? "已退役" : h.restUntil > world.turn ? `休养至${date(h.restUntil)}` : h.booked ? escape((world.races.find((r) => r.id === h.booked.raceId) || {}).name) : "等待赛程"}</td></tr>`).join("")}</tbody></table></div>`; }
  function raceCard(r) {
    const track = world.tracks.find((t) => t.id === r.trackId);
    return `<article class="cm-card ${r.raceClass === "g1" ? "cm-g1" : ""}"><div class="cm-actions"><input type="checkbox" aria-label="选择${escape(r.name)}" data-selection="race" value="${escape(r.id)}" ${selected.race.has(r.id) ? "checked" : ""}><span class="cm-badge">${escape(r.grade)}</span><h3>${escape(r.name)}</h3></div><p>${r.month}月${r.half === 1 ? "上" : "下"}半月 · ${escape(track.name)} · ${escape(r.surface)} ${r.distance}米</p><p>${escape(r.ageRule)}岁 · ${escape(sexLabels[r.sexRule])} · 上限${r.capacity}匹 · 冠军${r.prizes[0]}万</p><div class="cm-actions">${button("raceArchive", "赛事档案", r.id)}${button("entryList", "查看出马表", r.id)}${button("editRace", "编辑赛事", r.id)}</div></article>`;
  }
  const sexLabels = { all: "不限性别", male: "牡马", female: "牝马", gelding: "骟马", "male-female": "牡马与牝马" };
  async function render() {
    if (!world) return lobby();
    const seq = ++token, d = W.date(world.turn);
    root.querySelector(".cm-world-bar").innerHTML = `<div><p class="cm-eyebrow">${escape(world.name)}</p><h1>${date(world.turn)}${world.phase === "yearEnd" ? " · 年末回合" : ""}</h1></div><div class="cm-actions">${button("advance", world.phase === "yearEnd" ? "前往年末颁奖" : "下一半月", "", store.writable ? 'class="cm-primary"' : "disabled")}${button("fast", "快进至下一场G1 / 年末", "", store.writable && world.phase === "season" ? "" : "disabled")}${button("stop", "停止快进", "", 'class="cm-stop"')}</div><nav>${[["overview", "概览"], ["calendar", "赛历与马场"], ["horses", "马匹"], ["results", "结果与评分"], ["awards", "年度奖项"], ["boards", "榜单"], ["settings", "设置"]].map(([id, name]) => button("tab", name, id, tab === id ? 'aria-current="page"' : "")).join("")}</nav>`;
    if (await office.render(tab)) return;
    if (tab === "overview") {
      const active = world.horses.filter((h) => h.status === "active"), upcoming = world.races.filter((r) => !r.deleted && r.month === d.month && r.half === d.half);
      body.innerHTML = `<div class="cm-stats"><article><strong>${active.length}</strong>现役赛马</article><article><strong>${world.races.filter((r) => !r.deleted).length}</strong>年度赛事</article><article><strong>${active.filter((h) => h.booked).length}</strong>已有参赛安排</article></div><p>半月开始前安排报名与行程，点击“下一半月”统一结算。普通马的真实属性保持隐藏，机器TF与人工WTR用于评价表现。</p><div class="cm-actions">${button("latest", "查看上次汇总")}${button("editHorse", "自建赛马")}${button("editRace", "创办赛事")}</div><h2>${world.phase === "yearEnd" ? "年度赛事已结束，请完成颁奖" : "本半月赛事"}</h2><div class="cm-cards">${upcoming.sort((a, b) => (b.raceClass === "g1") - (a.raceClass === "g1")).slice(page * 50, page * 50 + 50).map(raceCard).join("") || "暂无赛事，可以继续推进。"}</div>${upcoming.length > 50 ? pager(upcoming.length > (page + 1) * 50) : ""}`;
    } else if (tab === "horses") {
      const p = world.ui.horses || {};
      const rows = world.horses.filter((h) => ns.ChairmanOffice.horseMatches({ ...h, age: W.ageOf(world, h) }, { status: "active", ...p }));
      if (rows.length && page * 50 >= rows.length) page = Math.floor((rows.length - 1) / 50);
      rows.sort((a, b) => p.sort === "prize" ? b.lifetime.prize - a.lifetime.prize : (W.rating(b) ?? -Infinity) - (W.rating(a) ?? -Infinity) || b.lifetime.prize - a.lifetime.prize);
      body.innerHTML = `<div class="cm-actions">${button("editHorse", "自建赛马")}${button("generate", "生成随机马群")}${button("csv", "马匹CSV导入导出", "horse")}</div>${filters("horses")}<p>共${rows.length}匹。普通AI马仅展示公开表现；创作导出仅包含自建马。</p>${horseTable(rows.slice(page * 50, page * 50 + 50))}${pager(rows.length > (page + 1) * 50)}`;
    } else if (tab === "calendar") {
      const p = world.ui.calendar || {};
      const rows = world.races.filter((r) => !r.deleted && ns.ChairmanOffice.raceMatches({ ...r, region: world.tracks.find((t) => t.id === r.trackId).region }, p)).sort((a, b) => a.month - b.month || a.half - b.half || (b.raceClass === "g1") - (a.raceClass === "g1"));
      if (rows.length && page * 50 >= rows.length) page = Math.floor((rows.length - 1) / 50);
      body.innerHTML = `<div class="cm-actions">${button("editTrack", "建立马场")}${button("tracks", "管理马场")}${button("editRace", "创办赛事")}${button("csv", "赛事CSV导入导出", "race")}</div>${filters("calendar")}<p>每年重复举办，修改仅影响未来届次。奖金为游戏默认值。</p><div class="cm-cards">${rows.slice(page * 50, page * 50 + 50).map(raceCard).join("")}</div>${pager(rows.length > (page + 1) * 50)}`;
    } else if (tab === "settings") {
      const points = await store.query("checkpoints", world.id); const slots = await store.slots(); if (seq !== token) return;
      body.innerHTML = `<form data-form="settings"><h2>世界规则</h2>${input("annualNewHorses", "每年补充二岁马（过多可能影响性能）", world.settings.annualNewHorses, "number")}<label class="cm-check"><input type="checkbox" name="autoRetire" ${world.settings.autoRetire ? "checked" : ""}>年初自动退役已过巅峰期的马</label><button>保存设置</button></form><h2>存档与恢复</h2><p>每项操作自动保存。完整存档包含模拟所需真实属性；请保留下载备份，浏览器清理站点数据会删除本地世界。</p><div class="cm-actions">${button("exportSave", "导出完整存档")}${button("importSave", "导入完整存档")}${button("reacquire", "重新读取并取得编辑权")}${button("lobby", "切换 / 新建世界")}</div><div class="cm-table-wrap"><table><tbody>${Array.from({ length: 10 }, (_, i) => { const slot = slots.find((s) => s.id === i + 1); return `<tr><td>存档${i + 1}</td><td>${slot ? escape(slot.name) + " · " + date(slot.turn) : "空"}</td><td>${button("saveSlot", slot ? "覆盖保存" : "保存", i + 1)} ${button("loadSlot", "读取副本", i + 1, slot ? "" : "disabled")}</td></tr>`; }).join("")}</tbody></table></div><h3>恢复点</h3><p>保留最近3个半月与最近1个年末。恢复后放弃此后的当前分支进度，手动槽仍保留。</p>${points.rows.map((p) => `<p>${date(p.turn)} · ${escape(p.label)} ${button("restore", "恢复到此处", p.id)}</p>`).join("") || "尚无恢复点"}`;
    }
    await office.decorate(tab);
  }
  async function horseDetail(id, offset) { return office.horseDetail(id, offset); }
  async function resultDetail(id, offset) { return office.resultDetail(id, offset); }
  function editForm(kind, id) {
    if (kind === "track") {
      const t = world.tracks.find((v) => v.id === id) || { region: "日本", courseType: "东京", surfaces: ["草地", "泥地"] };
      modal(id ? "编辑马场" : "建立马场", `<form data-form="track" data-id="${escape(id)}"><div class="cm-form-grid">${input("name", "马场名称", t.name)}${select("region", "地理赛区", W.REGIONS, t.region)}${select("courseType", "现有赛道适性类型", ["东京", "中山", "京都", "阪神", "其他地方"], t.courseType)}${["草地", "泥地"].map((v) => `<label class="cm-check"><input name="surfaces" type="checkbox" value="${v}" ${t.surfaces.includes(v) ? "checked" : ""}>支持${v}</label>`).join("")}</div><button>保存马场</button></form>`); return;
    }
    if (kind === "race" && !world.tracks.length) throw new Error("请先建立一个马场。");
    let value = (kind === "horse" ? world.horses : world.races).find((v) => v.id === id);
    if (kind === "horse" && value && value.origin !== "custom") throw new Error("普通AI马的原始属性保持隐藏。");
    if (!value) {
      if (kind === "horse") { const copy = W.clone(world); value = W.seeded(copy, () => W.addHorse(copy, { origin: "custom", name: "我的赛马" })); }
      else value = { name: "新大赛", raceClass: "g1", trackId: world.tracks[0].id, surface: world.tracks[0].surfaces[0], distance: 2000, month: W.date(world.turn).month, half: W.date(world.turn).half, capacity: 16, ageRule: "3+", sexRule: "all", prizes: W.defaultPrizes("g1") };
    }
    const choices = { gender: ["牡马", "牝马", "骟马"], homeRegion: W.REGIONS, temperamentLabel: ["极端暴躁", "暴躁", "胆小", "普通", "沉稳", "冷静", "极其聪明"], heavyType: ["不佳", "普通", "擅长", "鬼"], raceClass: [["op", "普通公开赛"], ["g3", "G3"], ["g2", "G2"], ["g1", "G1"]], trackId: world.tracks.filter((t) => !t.deleted).map((t) => [t.id, `${t.name} · ${t.region}`]), surface: ["草地", "泥地"], half: [[1, "上半月"], [2, "下半月"]], ageRule: [["2", "二岁限定"], ["3", "三岁限定"], ["4", "四岁限定"], ["2+", "二岁及以上"], ["3+", "三岁及以上"], ["4+", "四岁及以上"]], sexRule: Object.entries(sexLabels) };
    const fields = CSV.schema(kind).filter((f) => !["id", "trackName"].includes(f.key));
    modal(kind === "horse" ? "自建赛马" : "创办 / 编辑赛事", `<form data-form="${kind}" data-id="${escape(id)}"><p>${kind === "horse" ? "出生年份可为负数；当前年龄＝世界年份−出生年份。巅峰期沿用引擎，例如二岁夏、五岁冬。父母编号仅保留关联，暂不执行遗传。" : "按半月每年重办；已经完成的历史届次保持原样。新赛事默认奖金为游戏试玩数值。"}</p><div class="cm-form-grid">${fields.map((f) => { const list = choices[f.key] || (/^(grass|dirt)\./.test(f.key) ? ["S", "A", "B", "C", "G"] : f.key.startsWith("courseGrades.") ? ["S", "A", "B"] : null); return list ? select(f.key, f.label, list, read(value, f.key)) : input(f.key, f.label, read(value, f.key), f.type === "number" ? "number" : "text"); }).join("")}</div>${kind === "race" ? '<p class="cm-qualifying"></p>' : ""}<div class="cm-actions"><button>保存${kind === "horse" ? "赛马" : "赛事"}</button>${kind === "race" ? button("defaultPrizes", "按当前格付填入默认奖金") : ""}${kind === "race" && id ? button("deleteRace", "删除未来赛事", id) : ""}</div></form>`);
    if (kind === "race") qualifying(dialog.querySelector("form"));
  }
  function qualifying(form) {
    const race = { ageRule: form.elements.ageRule.value, sexRule: form.elements.sexRule.value };
    const count = world.horses.filter((h) => W.eligible(world, { ...h, restUntil: 0 }, race, world.turn)).length;
    form.querySelector(".cm-qualifying").textContent = `按当前年龄、性别符合资格的现役马：${count}匹。不检查隐藏适性，也不代表均可完成休养与行程后参赛。`;
  }
  function csvPanel(kind) {
    preview = null;
    modal(kind === "horse" ? "自建马CSV" : "赛事CSV", `<p>UTF-8表格；默认新增副本。按编号更新时空白保持原值，父母编号用 #CLEAR 清空。日期仅接受上／下半月。普通AI马不会包含在创作导出中。</p><div class="cm-actions">${button("template", "下载模板", kind)}${button("exportCSV", "导出全部", kind)}${button("exportSelected", "导出所选", kind)}</div><form data-form="csv" data-kind="${kind}">${select("mode", "导入方式", [["copy", "新增副本"], ["update", "按编号更新"], ["skip", "跳过已有"]], "copy")}<label>读取CSV文件<input type="file" name="csvFile" accept=".csv,text/csv"></label><label>CSV内容<textarea name="csvText" rows="7"></textarea></label>${kind === "race" ? `<details><summary>马场映射（找不到同名马场时使用）</summary>${input("mapName", "文件中的马场名称", "")}${select("mapTarget", "映射至", [["", "不指定"], ...world.tracks.map((t) => [t.id, `${t.name} · ${t.region}`])], "")}</details>` : ""}<div class="cm-mapping-fields"></div><button>预览导入</button></form><div class="cm-preview"></div>`);
  }
  async function onClick(event) {
    const el = event.target.closest("[data-action]"); if (!el || !root.contains(el)) return;
    const action = el.dataset.action, id = el.dataset.id;
    if (action === "stop") { stopping = true; if (activeWorker) cancelWorker(); else notice("将在当前完整保存边界停止；正在保存的事务会完整提交。"); return; }
    if (action === "dialogTop") { dialog.scrollTo({ top: 0, behavior: "smooth" }); return; }
    if (action === "top") { window.scrollTo({ top: 0, behavior: "smooth" }); return; }
    if (action === "close") { await run(async () => dialog.close()); return; }
    await run(async () => {
      if (action === "exit") { dialog.close(); if (store) await store.release(); root.hidden = true; document.getElementById("app").hidden = false; return; }
      if (action === "lobby") { dialog.close(); await lobby(); return; }
      if (action === "new") {
        modal("建立世界", `<form data-form="new" data-blank="${id === "blank"}">${input("name", "世界名称", "我的国际马会")}<p>${id === "blank" ? "从空白马场、赛历和马群开始。" : "日本、欧洲、美国各100匹马，18场G1与144场普通公开赛。"}</p><button>建立并保存</button></form>`); return;
      }
      if (action === "openWorld") return openWorld(id);
      if (action === "importSave") { modal("导入完整存档", '<form data-form="importSave"><p>验证通过后建立独立世界副本，现有世界和手动存档保留。</p><input type="file" name="file" accept=".json,application/json" required><button>验证并导入</button></form>'); return; }
      if (!world) return;
      if (await office.click(action, id, el)) return;
      if (action === "tab") { positions.set(`${world.id}:${tab}`, { page, scroll: window.scrollY }); tab = id; const pos = positions.get(`${world.id}:${tab}`); page = pos?.page || 0; if (store.writable) await commit(W.edit(world, "ui", { tab })); dialog.close(); await render(); window.scrollTo({ top: pos?.scroll || 0 }); return; }
      if (action === "page") { page = Math.max(0, page + Number(id)); return render(); }
      if (action === "horse" || action === "horsePage") return office.horseDetail(id, Number(el.dataset.offset || 0));
      if (action === "result" || action === "resultPage") return office.resultDetail(id, Number(el.dataset.offset || 0));
      if (action === "editHorse" || action === "editRace" || action === "editTrack") return editForm(action === "editHorse" ? "horse" : action === "editRace" ? "race" : "track", id);
      if (action === "tracks") { modal("管理马场", world.tracks.map((t) => `<p>${escape(t.name)} · ${escape(t.region)} · ${escape(t.surfaces.join(" / "))} ${button("editTrack", "编辑", t.id)}</p>`).join("")); return; }
      if (action === "entryList") { const race = world.races.find((r) => r.id === id); const horses = world.horses.filter((h) => h.booked && h.booked.raceId === id); modal(race.name, `<p>AI预定名单，尚未举办的赛事可随排赛调整。</p>${horseTable(horses)}`); return; }
      if (action === "advance" || action === "fast") {
        if (world.phase === "yearEnd") { tab = "awards"; return render(); }
        stopping = false;
        for (let i = 0; i < (action === "fast" ? 24 : 1); i++) {
          notice(`正在结算${date(world.turn)}…`); await pause();
          const out = W.advanceHalfMonth(world); await commit(out, "turn");
          if (stopping || world.phase === "yearEnd" || out.occurrences.some((r) => r.raceClass === "g1")) break;
        }
        tab = world.phase === "yearEnd" ? "awards" : "results"; if (tab === "results") { await commit(W.edit(world, "ui", { results: { latest: "1" } })); } page = 0; window.scrollTo({ top: 0 }); await render(); return;
      }
      if (action === "finish") { await commit(W.finishYear(world), "year"); tab = "overview"; window.scrollTo({ top: 0 }); return render(); }
      if (action === "retire" || action === "deleteRace") {
        modal(action === "retire" ? "勒令退役" : "删除赛事", `<p>${action === "retire" ? "停止这匹马今后的参赛，保留全部生涯资料。" : "停止未来举办，历史成绩和评分继续保留。"}</p>${button("confirmEdit", "确认", id, `data-kind="${action}"`)}`); return;
      }
      if (action === "confirmEdit") { await commit(W.edit(world, el.dataset.kind, { id })); dialog.close(); return render(); }
      if (action === "autoRating") { await commit(W.edit(world, "wtr", { id, score: null })); await render(); return horseDetail(id); }
      if (action === "generate") { modal("补充随机赛马", `<form data-form="generate">${input("count", "二岁马数量（过多可能卡顿）", 30, "number")}<p>按地区轮换生成，使用外来血统模板。每批完成后保存，可在批次之间停止。</p><button>开始生成</button>${button("stop", "停止生成")}</form>`); return; }
      if (action === "csv") return csvPanel(id);
      if (action === "template") return download(`${id}-模板.csv`, CSV.template(world, id), "text/csv;charset=utf-8");
      if (action === "exportCSV" || action === "exportSelected") { if (action === "exportSelected" && !selected[id].size) throw new Error("请先在列表勾选至少一项。"); return download(`${id}-创作.csv`, CSV.exportRows(world, id, action === "exportSelected" ? [...selected[id]] : null), "text/csv;charset=utf-8"); }
      if (action === "applyCSV") { if (!preview || preview.errors.length || preview.baseRevision !== world.revision) throw new Error("预览已失效，请重新预览。"); notice("正在保存整批创作数据，此阶段将完整提交…"); await pause(); await commit(preview.output); preview = null; dialog.close(); return render(); }
      if (action === "defaultPrizes") { const form = el.closest("form"); W.defaultPrizes(form.elements.raceClass.value).forEach((n, i) => { form.elements[`prizes.${i}`].value = n; }); return; }
      if (action === "exportSave") { stopping = false; notice("正在读取完整存档记录…"); const snapshot = await store.exportWorld(world.id); if (stopping) throw new Error("导出已取消。"); const text = await background("stringify", snapshot); download(`${world.name}-第${W.date(world.turn).year}年.json`, text, "application/json"); notice("完整存档文件已生成。"); return; }
      if (action === "saveSlot") { modal(`保存到存档${id}`, `<p>此操作覆盖该槽现有快照，不影响其他存档槽。</p>${button("confirmSaveSlot", "确认保存", id)}`); return; }
      if (action === "confirmSaveSlot") { await store.saveSlot(world.id, Number(id)); dialog.close(); notice(`已保存至存档${id}。`); return render(); }
      if (action === "loadSlot") { world = await store.loadSlot(Number(id)); tab = "overview"; page = 0; return render(); }
      if (action === "restore") { modal("恢复进度", `<p>当前世界将回到此恢复点，之后的进度将被移除。手动槽不受影响。</p>${button("confirmRestore", "确认恢复", id)}`); return; }
      if (action === "confirmRestore") { world = await store.restore(world, id); dialog.close(); notice("已恢复进度及随机状态。"); return render(); }
      if (action === "reacquire") return openWorld(world.id);
      if (action === "awardHorse") { const form = body.querySelector('[data-form="awards"]'); const ids = [...new Set(W.AWARDS.map((a) => form.elements[a.id].value).filter(Boolean))]; modal("颁奖候选", ids.map((hid) => { const h = world.horses.find((v) => v.id === hid); return `<p>${link(hid, h.name)} · 本年G1 ${h.annual.g1} · WTR ${show(W.rating(h))}</p>`; }).join("") || "尚未选择候选马。"); }
    });
  }
  async function onSubmit(event) {
    const form = event.target.closest("form[data-form]"); if (!form) return; event.preventDefault();
    await run(async () => {
      if (await office.submit(form)) return;
      const data = new FormData(form), kind = form.dataset.form, id = form.dataset.id;
      if (kind === "new") { const created = W.createWorld({ name: String(data.get("name")).trim() || "我的国际马会", blank: form.dataset.blank === "true" }); await store.acquire(created.id); await store.commitChanges(null, { world: created }); world = created; tab = "overview"; dialog.close(); notice("世界已建立并保存。"); }
      else if (kind === "filter") { const prefs = Object.fromEntries(data); if (store.writable) await commit(W.edit(world, "ui", { [form.dataset.kind]: prefs })); else world.ui[form.dataset.kind] = prefs; page = 0; }
      else if (["track", "horse", "race"].includes(kind)) {
        const value = id ? { id } : {};
        if (kind === "track") { Object.assign(value, Object.fromEntries(data), { surfaces: data.getAll("surfaces") }); }
        else for (const f of CSV.schema(kind).filter((f) => !["id", "trackName"].includes(f.key))) {
          const raw = data.get(f.key); if (raw == null) continue;
          write(value, f.key, f.type === "number" || f.key === "half" ? (raw.trim() === "" ? NaN : Number(raw)) : raw.trim());
        }
        const out = W.edit(world, kind, value); W.validateWorld(out.world); await commit(out); dialog.close();
      } else if (kind === "wtr") { await commit(W.edit(world, "wtr", { id, score: data.get("score").trim() === "" ? null : Number(data.get("score")) })); await render(); return horseDetail(id); }
      else if (kind === "score") {
        const performance = await store.get("performances", world.id, id);
        const rows = await store.query("performances", world.id, { horseId: performance.horseId, year: performance.year, limit: 24 });
        const archived = performance.year === W.date(world.turn).year ? null : await store.get("ratings", world.id, `${performance.year}:${performance.horseId}`);
        await commit(W.scorePerformance(world, performance, data.get("score").trim() === "" ? null : Number(data.get("score")), rows.rows, archived));
        await render(); return resultDetail(performance.occurrenceId);
      } else if (kind === "settings") { await commit(W.edit(world, "settings", { annualNewHorses: Number(data.get("annualNewHorses")), autoRetire: data.has("autoRetire") })); }
      else if (kind === "awards") { await saveAwards(form); }
      else if (kind === "generate") {
        const count = Number(data.get("count")); if (!Number.isSafeInteger(count) || count < 1) throw new Error("数量须为正整数。"); stopping = false;
        for (let i = 0; i < count && !stopping; i += 50) {
          notice(`正在生成 ${Math.min(count, i + 50)} / ${count} 匹…`); await pause();
          await commit(W.mutate(world, (w) => { for (let j = i; j < Math.min(count, i + 50); j++) W.addHorse(w, { age: 2, homeRegion: W.REGIONS[j % 3] }); W.planEntries(w); }));
        } dialog.close();
      } else if (kind === "csv") {
        preview = null; dialog.querySelector(".cm-preview").innerHTML = "";
        notice("正在校验创作表格…"); await pause();
        const mappings = {}; if (data.get("mapName") && data.get("mapTarget")) mappings[data.get("mapName")] = data.get("mapTarget");
        for (const el of form.querySelectorAll('[data-map-source]')) if (el.value) mappings[el.dataset.mapSource] = el.value;
        preview = await background("csv", { world, kind: form.dataset.kind, text: data.get("csvText"), options: { mode: data.get("mode"), trackMappings: mappings } });
        if (form.dataset.kind === "race") {
          try {
            const missing = preview.missingTracks || [];
            form.querySelector('.cm-mapping-fields').innerHTML = missing.map((name) => `<label>${escape(name)} → 本地马场<select data-map-source="${escape(name)}">${options([["", "请选择后重新预览"], ...world.tracks.map((t) => [t.id, `${t.name} · ${t.region}`])], mappings[name] || "")}</select></label>`).join("");
          } catch (_) { /* Parser errors are already shown by the preview. */ }
        }
        dialog.querySelector(".cm-preview").innerHTML = `<p>新增 ${preview.added} · 更新 ${preview.updated} · 跳过 ${preview.skipped}</p>${preview.errors.length ? `<ul class="cm-error">${preview.errors.slice(0, 50).map((e) => `<li>${escape(e)}</li>`).join("")}</ul>` : `<p>整批校验通过。确认后一次保存全部记录，关闭窗口可取消。</p>${button("applyCSV", "确认导入")}`}`; return;
      } else if (kind === "importSave") { const file = data.get("file"); if (!file || !file.size) throw new Error("请选择存档文件。"); stopping = false; notice("正在读取存档文件…"); const text = await file.text(); if (stopping) throw new Error("导入已取消。"); const parsed = await background("parseSave", text); notice("校验通过，正在完整保存世界副本…"); await pause(); world = await store.importWorld(parsed); dialog.close(); tab = "overview"; page = 0; }
      await render();
    });
  }
  async function saveAwards(form) {
    const data = new FormData(form), strict = data.has("strict"), draft = {};
    for (const a of W.AWARDS) { const id = data.get(a.id); const h = world.horses.find((v) => v.id === id); draft[a.id] = h && W.awardEligible(world, h, a, strict) ? id : ""; }
    await commit(W.edit(world, "awards", { strict, draft }));
  }
  function mount() {
    const home = document.querySelector("#homeScreen .home-mode-grid"); if (!home || document.getElementById("chairmanLaunch")) return;
    const card = document.createElement("article"); card.className = "cm-home-card";
    card.innerHTML = '<p class="eyebrow">世界沙盒 · 第二轮测试版</p><h2>国际主席模式</h2><p>创办大赛，观察国际马群，评定属于你的年度名马。</p><button id="chairmanLaunch" type="button">进入 / 继续主席世界</button>'; home.appendChild(card);
    root = document.createElement("section"); root.id = "chairmanApp"; root.hidden = true;
    root.innerHTML = `<div class="cm-shell"><div class="cm-topline"><span>KEIBA · 国际马会</span>${button("exit", "返回模式选择")}</div><p class="cm-notice" role="status" aria-live="polite"></p><header class="cm-world-bar"></header><main class="cm-body"></main>${button("top", "↑ 顶部", "", 'class="cm-back-top" aria-label="滑至顶部"')}<dialog class="cm-dialog"></dialog></div>`;
    document.getElementById("app").after(root); body = root.querySelector(".cm-body"); dialog = root.querySelector("dialog");
    office = ns.ChairmanOfficeUI.create({ get world() { return world; }, get store() { return store; }, get busy() { return busy; },
      get page() { return page; }, set page(v) { page = v; }, setTab(v) { tab = v; }, body, dialog, escape, show, date, button, link, input, select,
      modal, commit, render, run, notice });
    root.addEventListener("click", onClick); root.addEventListener("submit", onSubmit);
    root.addEventListener("input", (event) => office.changed(event.target));
    root.addEventListener("focusout", (event) => { if (event.target.dataset.draft || event.target.form?.dataset.form === "awardDetail") office.changed(event.target); });
    root.addEventListener("change", (event) => {
      const el = event.target;
      office.changed(el);
      if (el.form?.dataset.form === "race") qualifying(el.form);
      if (el.dataset.selection) { const set = selected[el.dataset.selection]; if (el.checked) set.add(el.value); else set.delete(el.value); }
      if (el.name === "raceClass" && el.form && el.form.dataset.form === "race" && !el.form.dataset.id) W.defaultPrizes(el.value).forEach((n, i) => { el.form.elements[`prizes.${i}`].value = n; });
      if (el.name === "csvFile" && el.files[0]) run(async () => { el.form.elements.csvText.value = await el.files[0].text(); preview = null; });
      if (el.closest('[data-form="csv"]')) { preview = null; const area = dialog.querySelector(".cm-preview"); if (area) area.innerHTML = ""; }
      if (el.closest('[data-form="awards"]')) run(async () => { await saveAwards(el.form); await render(); });
    });
    dialog.addEventListener("cancel", (event) => { event.preventDefault(); if (!busy) run(async () => dialog.close()); });
    document.getElementById("chairmanLaunch").addEventListener("click", () => run(async () => {
      document.getElementById("app").hidden = true; root.hidden = false;
      if (!store) { store = await ns.ChairmanStorage.open(); store.onLeaseLost = () => notice("编辑权已失效，请在设置中重新取得编辑权。", true); }
      await lobby();
    }));
    window.addEventListener("pagehide", () => { if (store) store.release().catch(() => {}); });
  }
  ns.ChairmanApp = { mount };
})();
