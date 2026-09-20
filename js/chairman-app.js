(function () {
  "use strict";
  const ns = window.Keiba, W = ns.ChairmanRules, CSV = ns.ChairmanCSV, UI = ns.ChairmanUI;
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
  let root, body, dialog, store, world, office, breeding, busy = false, stopping = false, tab = "overview", page = 0, token = 0, preview = null;
  const positions = new Map();
  let activeWorker = null, cancelWorker = null;
  function background(kind, payload) {
    if (!window.Worker) throw new Error("此浏览器不支持后台文件处理，请使用支持Worker的浏览器。");
    if (stopping) throw new Error("操作已取消，当前世界未改变。");
    return new Promise((resolve, reject) => {
      const worker = new Worker("js/chairman-worker.js?v=20260920-breeding"); activeWorker = worker;
      const end = () => { worker.terminate(); activeWorker = null; cancelWorker = null; };
      cancelWorker = () => { end(); reject(new Error("操作已取消，当前世界未改变。")); };
      worker.onmessage = ({ data }) => { if (data.progress) { notice(data.progress); return; } end(); if (data.error) reject(new Error(data.error)); else resolve(data.result); };
      worker.onerror = (event) => { end(); reject(new Error(event.message || "后台文件处理失败，当前世界未改变。")); };
      worker.postMessage({ kind, payload });
    });
  }
  let batch = "", currentModal = null, restoringModal = false, listScroll = 0, modalOpener = null;
  const modalStack = [];
  const selected = { horse: new Set(), race: new Set() };
  function notice(text, error) { const el = root.querySelector(".cm-notice"); const quiet = !error && /已保存至本地数据库|进度已恢复/.test(text); el.textContent = quiet ? "已保存" : text; el.classList.toggle("cm-error", !!error); el.classList.toggle("cm-status-quiet", quiet); root.querySelector(".cm-sticky-head")?.classList.toggle("cm-has-alert", !!error); if (dialog?.open && !quiet) dialog.querySelector(".cm-dialog-notice").textContent = text; }
  function modal(title, html, route) {
    const next = { title, html, route, key: route?.key || title };
    if (dialog.open && currentModal && !restoringModal && currentModal.key !== next.key) {
      currentModal.scroll = dialog.querySelector(".cm-dialog-content").scrollTop;
      currentModal.fields = [...dialog.querySelectorAll("input,select,textarea")].map((el) => ({ name: el.name, parentSearch: el.dataset.parentSearch, value: el.value, checked: el.checked, selected: el.multiple ? [...el.options].map((o) => o.selected) : null }));
      modalStack.push(currentModal);
    }
    if (!dialog.open) { modalStack.length = 0; listScroll = window.scrollY; modalOpener = document.activeElement; }
    currentModal = next;
    dialog.innerHTML = `<header>${modalStack.length ? button("dialogBack", "返回") : ""}<h2 id="cm-dialog-title" tabindex="-1">${escape(title)}</h2>${button("stop", "停止", "", 'class="cm-stop"')}${button("close", "关闭")}</header><div class="cm-dialog-content">${html}</div><footer class="cm-dialog-footer"><p class="cm-dialog-notice" role="status"></p></footer>`;
    UI.enhance(dialog);
    const footer = dialog.querySelector(".cm-dialog-footer");
    for (const el of dialog.querySelectorAll(".cm-sticky-actions,.cm-draft-state")) footer.append(el);
    dialog.setAttribute("aria-labelledby", "cm-dialog-title");
    if (dialog.querySelector('form[data-form="horse"],form[data-form="race"],form[data-form="track"],form[data-form="breedMating"]')) footer.insertAdjacentHTML("beforeend", '<small class="cm-editor-state" role="status">保存后生效</small>');
    if (!dialog.open) dialog.showModal();
    dialog.querySelector("#cm-dialog-title").focus({ preventScroll: true });
  }
  async function modalBack() {
    const previous = modalStack.pop(); if (!previous) return;
    restoringModal = true;
    try { if (previous.route) await previous.route.render(); else modal(previous.title, previous.html); }
    finally { restoringModal = false; }
    if (!previous.route || previous.route.form) for (const f of previous.fields || []) { const el = [...dialog.querySelectorAll("input,select,textarea")].find((el) => f.name ? el.name === f.name && (!f.value || el.type !== "checkbox" || el.value === f.value) : f.parentSearch && el.dataset.parentSearch === f.parentSearch); if (el) { el.value = f.value; el.checked = f.checked; if (f.selected) [...el.options].forEach((o, i) => o.selected = f.selected[i]); if (el.dataset.parentSearch || ["fatherId", "motherId"].includes(el.name)) breeding.changed(el); } }
    if (previous.route?.form) { const state = dialog.querySelector(".cm-editor-state"); if (state) state.textContent = "已恢复未提交的表单"; }
    dialog.querySelector(".cm-dialog-content").scrollTop = previous.scroll || 0;
  }
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
    body.innerHTML = `<div class="cm-welcome"><p class="cm-eyebrow">国际主席模式 · 第三轮开发版</p><h1>让世界的赛马，跑出自己的故事。</h1><p>建立马场与大赛，观察马群自动参赛，以表现评定年度地位。每次推进结算半个月。</p><div class="cm-actions">${button("new", "国际预设开局", "preset")}${button("new", "空白世界", "blank")}${button("importSave", "导入完整存档")}</div></div><h2>本地世界</h2>${worlds.map((w) => `<article class="cm-card"><h3>${escape(w.name)}</h3><p>${date(w.turn)}${w.phase === "yearEnd" ? " · 年末回合" : ""}</p>${button("openWorld", "继续世界", w.id)}</article>`).join("") || "<p>还没有本地世界。</p>"}`;
  }
  function filters(kind) { return office.filters(kind); }
  function pager(more) { return `<div class="cm-pagination">${button("page", "上一页", "-1", page === 0 ? "disabled" : "")}<span>第 ${page + 1} 页 · 每页最多50条</span>${button("page", "下一页", "1", more ? "" : "disabled")}</div>`; }
  function horseTable(horses) { return `<div class="cm-table-wrap"><table><thead><tr>${batch === "horse" ? "<th>选择</th>" : ""}<th>马名</th><th>年龄／性别</th><th>所属</th><th>本年WTR / TF</th><th>本年G1</th><th>生涯胜 / 出赛</th><th>赏金（万）</th><th>安排</th></tr></thead><tbody>${horses.map((h) => `<tr>${batch === "horse" ? `<td>${h.origin === "custom" ? `<input aria-label="选择${escape(h.name)}" type="checkbox" data-selection="horse" value="${escape(h.id)}" ${selected.horse.has(h.id) ? "checked" : ""}>` : ""}</td>` : ""}<td>${link(h.id, h.name)}${h.origin === "custom" ? '<small>自建</small>' : ""}</td><td>${W.ageOf(world, h)}岁 ${escape(h.gender)}</td><td>${escape(h.homeRegion)}</td><td>${show(W.rating(h))} / ${show(h.annual.tf)}</td><td>${h.annual.g1}</td><td>${h.lifetime.wins} / ${h.lifetime.starts}</td><td>${h.lifetime.prize.toFixed(1)}</td><td class="cm-arrangement"><span tabindex="0" title="${escape(h.booked ? (world.races.find((r) => r.id === h.booked.raceId) || {}).name : "")}">${h.status === "retired" ? "已退役" : h.restUntil > world.turn ? `休养至${date(h.restUntil)}` : h.booked ? escape((world.races.find((r) => r.id === h.booked.raceId) || {}).name) : "等待赛程"}</span></td></tr>`).join("")}</tbody></table></div>`; }
  function raceTable(rows) {
    return `<div class="cm-table-wrap"><table><thead><tr>${batch === "race" ? "<th>选择</th>" : ""}<th>日期</th><th>赛事</th><th>格付</th><th>场地／距离</th><th>马场／地区</th><th>资格</th><th>报名</th><th>冠军奖金万</th><th>操作</th></tr></thead><tbody>${rows.map((r) => { const track = world.tracks.find((t) => t.id === r.trackId); return `<tr class="${r.raceClass === "g1" ? "cm-g1-row" : ""}">${batch === "race" ? `<td><input type="checkbox" aria-label="选择${escape(r.name)}" data-selection="race" value="${escape(r.id)}" ${selected.race.has(r.id) ? "checked" : ""}></td>` : ""}<td>${r.month}月${r.half === 1 ? "上" : "下"}</td><td>${button("raceArchive", r.name, r.id, 'class="cm-link"')}</td><td><span class="cm-badge">${escape(r.grade)}</span></td><td>${escape(r.surface)} ${r.distance}m</td><td>${escape(track.name)}<small>${escape(track.region)}</small></td><td>${escape(r.ageRule)}岁 · ${escape(sexLabels[r.sexRule])}</td><td>${world.horses.filter((h) => h.booked?.raceId === r.id).length}/${r.capacity}</td><td>${r.prizes[0]}</td><td>${button("entryList", "出马表", r.id)}${UI.more(button("editRace", "编辑赛事", r.id))}</td></tr>`; }).join("")}</tbody></table></div>`;
  }
  const sexLabels = { all: "不限性别", male: "牡马", female: "牝马", gelding: "骟马", "male-female": "牡马与牝马" };
  async function render() { try { await renderContent(); } finally {
    UI.useLayout(world?.ui.layout, (changes) => { if (!world) return; const next = { ...(world.ui.layout || {}), ...changes }; if (busy) { world.ui.layout = next; return; } run(async () => { if (store.writable) await commit(W.edit(world, "ui", { layout: next })); else world.ui.layout = next; }); });
    UI.enhance(body);
  } }
  async function renderContent() {
    if (!world) return lobby();
    const seq = ++token, d = W.date(world.turn);
    root.querySelector(".cm-sticky-head").classList.toggle("cm-has-alert", !!root.querySelector(".cm-notice.cm-error"));
    root.querySelector(".cm-world-bar").innerHTML = `<div class="cm-world-identity"><p class="cm-eyebrow">${escape(world.name)}</p><h1>${date(world.turn)}${world.phase === "yearEnd" ? " · 年末回合" : ""}</h1></div><div class="cm-actions">${button("advance", world.phase === "yearEnd" ? "前往年末颁奖" : "下一半月", "", store.writable ? 'class="cm-primary"' : "disabled")}${button("fast", "快进至G1 / 年末", "", store.writable && world.phase === "season" ? "" : "disabled")}${button("stop", "停止快进", "", 'class="cm-stop"')}</div><nav>${[["overview", "概览"], ["calendar", "赛历与马场"], ["horses", "马匹"], ["results", "结果与评分"], ["awards", "年度奖项"], ["boards", "榜单"], ["breeding", "繁殖"], ["settings", "设置"]].map(([id, name]) => button("tab", name, id, tab === id ? 'aria-current="page"' : "")).join("")}</nav>`;
    if (await breeding.render(tab)) return;
    if (await office.render(tab)) return;
    if (tab === "overview") {
      const active = world.horses.filter((h) => h.status === "active"), upcoming = world.races.filter((r) => !r.deleted && r.month === d.month && r.half === d.half);
      body.innerHTML = `<div class="cm-stats"><article><strong>${active.length}</strong>现役</article><article><strong>${world.races.filter((r) => !r.deleted).length}</strong>赛事</article><article><strong>${active.filter((h) => h.booked).length}</strong>已安排</article></div>${UI.toolbar(world.phase === "yearEnd" ? "年度颁奖待完成" : "本半月赛事", upcoming.length, button("latest", "上次汇总") + UI.more(button("editHorse", "自建赛马") + button("editRace", "创办赛事")))}${raceTable(upcoming.sort((a, b) => (b.raceClass === "g1") - (a.raceClass === "g1")).slice(page * 50, page * 50 + 50))}${upcoming.length > 50 ? pager(upcoming.length > (page + 1) * 50) : ""}`;

    } else if (tab === "horses") {
      const p = world.ui.horses || {};
      const rows = world.horses.filter((h) => ns.ChairmanOffice.horseMatches({ ...h, age: W.ageOf(world, h) }, { status: "active", ...p }));
      if (rows.length && page * 50 >= rows.length) page = Math.floor((rows.length - 1) / 50);
      rows.sort((a, b) => p.sort === "prize" ? b.lifetime.prize - a.lifetime.prize : (W.rating(b) ?? -Infinity) - (W.rating(a) ?? -Infinity) || b.lifetime.prize - a.lifetime.prize);
      body.innerHTML = `${UI.toolbar("马匹", rows.length, button("editHorse", "自建赛马", "", 'class="cm-primary"') + UI.more(button("generate", "生成随机马群") + button("csv", "CSV导入导出", "horse") + button("batch", batch === "horse" ? "结束批量选择" : "批量导出", "horse")))}${batch === "horse" ? `<div class="cm-actions">${button("exportSelected", "导出所选", "horse")}</div>` : ""}${filters("horses")}${horseTable(rows.slice(page * 50, page * 50 + 50))}${rows.length ? "" : '<p class="cm-empty">暂无符合条件的马匹</p>'}${pager(rows.length > (page + 1) * 50)}`;

    } else if (tab === "calendar") {
      const p = world.ui.calendar || {};
      const rows = world.races.filter((r) => !r.deleted && ns.ChairmanOffice.raceMatches({ ...r, region: world.tracks.find((t) => t.id === r.trackId).region }, p)).sort((a, b) => a.month - b.month || a.half - b.half || (b.raceClass === "g1") - (a.raceClass === "g1"));
      if (rows.length && page * 50 >= rows.length) page = Math.floor((rows.length - 1) / 50);
      const sub = world.ui.layout?.calendar || "races";
      body.innerHTML = UI.tabs([["races", "赛事"], ["tracks", "马场"], ["regions", "地区"]], sub, "calendarView", button);
      if (sub === "tracks") body.innerHTML += UI.toolbar("马场", world.tracks.filter((t) => !t.deleted).length, button("editTrack", "建立马场", "", 'class="cm-primary"')) + `<div class="cm-table-wrap"><table><thead><tr><th>马场</th><th>地区</th><th>场地</th><th>操作</th></tr></thead><tbody>${world.tracks.filter((t) => !t.deleted).slice(page * 50, page * 50 + 50).map((t) => `<tr><td>${button("trackArchive", t.name, t.id, 'class="cm-link"')}</td><td>${escape(t.region)}</td><td>${escape(t.surfaces.join("／"))}</td><td>${UI.more(button("editTrack", "编辑马场", t.id) + button("trackRaces", "查看赛事", t.id))}</td></tr>`).join("")}</tbody></table></div>` + pager(world.tracks.length > (page + 1) * 50);
      else if (sub === "regions") body.innerHTML += UI.toolbar("地区", W.regions(world).length, button("editRegion", "新增虚构地区", "", 'class="cm-primary"')) + `<div class="cm-table-wrap"><table><thead><tr><th>地区</th><th>参考环境</th><th>自动补马</th><th>操作</th></tr></thead><tbody>${W.regions(world).slice(page * 50, page * 50 + 50).map((r) => `<tr><td>${escape(r.name)}</td><td>${escape(r.baseRegion)}</td><td>${r.autoPopulate ? "开启" : "关闭"}</td><td>${button("editRegion", "设置", r.id)} ${button("editTrack", "建立马场", "", `data-region="${escape(r.name)}"`)}</td></tr>`).join("")}</tbody></table></div>` + pager(W.regions(world).length > (page + 1) * 50);
      else body.innerHTML += UI.toolbar("年度赛历", rows.length, button("editRace", "创办赛事", "", 'class="cm-primary"') + UI.more(button("csv", "CSV导入导出", "race") + button("batch", batch === "race" ? "结束批量选择" : "批量导出", "race"))) + (batch === "race" ? `<div class="cm-actions">${button("exportSelected", "导出所选", "race")}</div>` : "") + filters("calendar") + raceTable(rows.slice(page * 50, page * 50 + 50)) + pager(rows.length > (page + 1) * 50);

    } else if (tab === "settings") {
      const points = await store.query("checkpoints", world.id); const slots = await store.slots(); if (seq !== token) return;
      body.innerHTML = `<form data-form="settings"><h2>世界规则</h2>${input("annualNewHorses", "每年补充二岁马（过多可能影响性能）", world.settings.annualNewHorses, "number")}<label class="cm-check"><input type="checkbox" name="autoRetire" ${world.settings.autoRetire ? "checked" : ""}>年初自动退役已过巅峰期的马</label><button>保存设置</button></form><h2>存档与恢复</h2><p>每项操作自动保存。完整存档包含模拟所需真实属性；请保留下载备份，浏览器清理站点数据会删除本地世界。</p><div class="cm-actions">${button("exportSave", "导出完整存档")}${button("importSave", "导入完整存档")}${button("reacquire", "重新读取并取得编辑权")}${button("lobby", "切换 / 新建世界")}</div><div class="cm-table-wrap"><table><tbody>${Array.from({ length: 10 }, (_, i) => { const slot = slots.find((s) => s.id === i + 1); return `<tr><td>存档${i + 1}</td><td>${slot ? escape(slot.name) + " · " + date(slot.turn) : "空"}</td><td>${button("saveSlot", slot ? "覆盖保存" : "保存", i + 1)} ${button("loadSlot", "读取副本", i + 1, slot ? "" : "disabled")}</td></tr>`; }).join("")}</tbody></table></div><h3>恢复点</h3><p>保留最近3个半月与最近1个年末。恢复后放弃此后的当前分支进度，手动槽仍保留。</p>${points.rows.map((p) => `<p>${date(p.turn)} · ${escape(p.label)} ${button("restore", "恢复到此处", p.id)}</p>`).join("") || "尚无恢复点"}`;
    }
    await office.decorate(tab);
    if (tab === "settings") UI.settings(body, world.ui.layout?.settings || "rules", button);
  }
  async function horseDetail(id, offset) { return office.horseDetail(id, offset); }
  async function resultDetail(id, offset) { return office.resultDetail(id, offset); }
  function regionPanel(offset = 0) {
    const rows = W.regions(world);
    modal("管理地区", `<p>地区是独立的赛马世界区域。可在其中建立马场、创办赛事和生成马匹；跨地区出赛需要远征准备。</p>${button("editRegion", "新增虚构地区")}${rows.slice(offset, offset + 50).map((r) => `<article class="cm-card"><h3>${escape(r.name)}</h3><p>参考环境：${escape(r.baseRegion)} · 年度自动补马${r.autoPopulate ? "已开启" : "已关闭"}</p><p>${world.tracks.filter((t) => t.region === r.name && !t.deleted).length}座马场 · ${world.horses.filter((h) => h.homeRegion === r.name && h.status === "active").length}匹现役马</p>${button("editRegion", "地区设置", r.id)} ${button("editTrack", "在此建立马场", "", `data-region="${escape(r.name)}"`)}</article>`).join("")}<div class="cm-pagination">${button("regions", "上一页", String(Math.max(0, offset - 50)), offset ? "" : "disabled")}${button("regions", "下一页", String(offset + 50), offset + 50 < rows.length ? "" : "disabled")}</div>`);
  }
  function regionForm(id) {
    const region = W.regions(world).find((r) => r.id === id) || { name: "", baseRegion: "日本", autoPopulate: true };
    modal(id ? "地区设置" : "新增虚构地区", `<form data-form="region" data-id="${escape(id)}"><label>地区名称<input name="name" value="${escape(region.name)}" maxlength="80" required ${id ? "readonly" : ""}></label>${select("baseRegion", "参考比赛环境", W.REGIONS.includes(region.name) ? [region.baseRegion] : W.REGIONS, region.baseRegion)}<p>日本：沿用日本草地、泥地与赛道适性；欧洲：沿用欧洲草地、现有欧洲泥地规则（参考日本泥地）；美国：沿用美国草地和泥地。骑手采用相应地区的现有名单。参考环境不会改变本地区的名字和独立行程。</p><label class="cm-check"><input type="checkbox" name="autoPopulate" ${region.autoPopulate ? "checked" : ""}>参与年度自动补马</label><p>年度补马总数保持设置值，在已开启的地区之间均分。全部关闭时暂停年度补马。新地区不会自动附带马场和赛事，可自行创建。地区名创建后固定；环境修改只影响未锁定的未来比赛。</p><button>保存地区</button></form>`);
  }
  function editForm(kind, id, preferredRegion) {
    if (kind === "track") {
      const t = world.tracks.find((v) => v.id === id) || { region: preferredRegion || "日本", courseType: "东京", surfaces: ["草地", "泥地"] };
      modal(id ? "编辑马场" : "建立马场", `<form data-form="track" data-id="${escape(id)}"><div class="cm-form-grid">${input("name", "马场名称", t.name)}${select("region", "地理赛区", W.regionNames(world), t.region)}${select("courseType", "现有赛道适性类型", ["东京", "中山", "京都", "阪神", "其他地方"], t.courseType)}${["草地", "泥地"].map((v) => `<label class="cm-check"><input name="surfaces" type="checkbox" value="${v}" ${t.surfaces.includes(v) ? "checked" : ""}>支持${v}</label>`).join("")}</div><button>保存马场</button></form>`); return;
    }
    if (kind === "race" && !world.tracks.length) throw new Error("请先建立一个马场。");
    let value = (kind === "horse" ? world.horses : world.races).find((v) => v.id === id);
    if (kind === "horse" && value && value.origin !== "custom") throw new Error("普通AI马的原始属性保持隐藏。");
    if (!value) {
      if (kind === "horse") { const copy = W.clone(world); value = W.seeded(copy, () => W.addHorse(copy, { origin: "custom", name: "我的赛马" })); }
      else value = { name: "新大赛", raceClass: "g1", trackId: world.tracks[0].id, surface: world.tracks[0].surfaces[0], distance: 2000, month: W.date(world.turn).month, half: W.date(world.turn).half, capacity: 16, ageRule: "3+", sexRule: "all", prizes: W.defaultPrizes("g1") };
    }
    const choices = { gender: ["牡马", "牝马", "骟马"], homeRegion: W.regionNames(world), temperamentLabel: ["极端暴躁", "暴躁", "胆小", "普通", "沉稳", "冷静", "极其聪明"], heavyType: ["不佳", "普通", "擅长", "鬼"], raceClass: [["op", "普通公开赛"], ["g3", "G3"], ["g2", "G2"], ["g1", "G1"]], trackId: world.tracks.filter((t) => !t.deleted).map((t) => [t.id, `${t.name} · ${t.region}`]), surface: ["草地", "泥地"], half: [[1, "上半月"], [2, "下半月"]], ageRule: [["2", "二岁限定"], ["3", "三岁限定"], ["4", "四岁限定"], ["2+", "二岁及以上"], ["3+", "三岁及以上"], ["4+", "四岁及以上"]], sexRule: Object.entries(sexLabels) };
    const fields = CSV.schema(kind).filter((f) => !["id", "trackName"].includes(f.key));
    modal(kind === "horse" ? "自建赛马" : "创办 / 编辑赛事", `<form data-form="${kind}" data-id="${escape(id)}"><p>${kind === "horse" ? "出生年份可为负数；当前年龄＝世界年份−出生年份。巅峰期沿用引擎，例如二岁夏、五岁冬。父母使用世界内稳定编号；可搜索和预览三代血统。配种实力留空时自动生成。" : "按半月每年重办；已经完成的历史届次保持原样。新赛事默认奖金为游戏试玩数值。"}</p><div class="cm-form-grid">${fields.map((f) => { const list = choices[f.key] || (/^(grass|dirt)\./.test(f.key) ? ["S", "A", "B", "C", "G"] : f.key.startsWith("courseGrades.") ? ["S", "A", "B"] : null); return list ? select(f.key, f.label, list, read(value, f.key)) : input(f.key, f.label, (f.key === "breedingStrength" ? value.breeding?.strength ?? value.breedingStrength : read(value, f.key)), f.type === "number" ? "number" : "text"); }).join("")}</div>${kind === "race" ? '<p class="cm-qualifying"></p>' : ""}<div class="cm-actions"><button>保存${kind === "horse" ? "赛马" : "赛事"}</button>${kind === "race" ? button("defaultPrizes", "按当前格付填入默认奖金") : ""}${kind === "race" && id ? button("deleteRace", "删除未来赛事", id) : ""}</div></form>`, { key: `edit:${kind}:${id || "new"}`, form: true, render: () => editForm(kind, id, preferredRegion) });
    if (kind === "race") qualifying(dialog.querySelector("form"));
    if (kind === "horse" && world.breeding) breeding.parentFields(dialog.querySelector("form"));
  }
  function qualifying(form) {
    const race = { ageRule: form.elements.ageRule.value, sexRule: form.elements.sexRule.value };
    const count = world.horses.filter((h) => W.eligible(world, { ...h, restUntil: 0 }, race, world.turn)).length;
    form.querySelector(".cm-qualifying").textContent = `按当前年龄、性别符合资格的现役马：${count}匹。不检查隐藏适性，也不代表均可完成休养与行程后参赛。`;
  }
  function csvPanel(kind) {
    preview = null;
    modal(kind === "horse" ? "自建马CSV" : "赛事CSV", `<p>UTF-8表格；默认新增副本。按编号更新时空白保持原值，父母编号用 #CLEAR 清空。日期仅接受上／下半月。普通AI马不会包含在创作导出中。</p><div class="cm-actions">${button("template", "下载模板", kind)}${button("exportCSV", "导出全部", kind)}${button("exportSelected", "导出所选", kind)}</div><form data-form="csv" data-kind="${kind}">${select("mode", "导入方式", [["copy", "新增副本"], ["update", "按编号更新"], ["skip", "跳过已有"]], "copy")}<label>读取CSV文件<input type="file" name="csvFile" accept=".csv,text/csv"></label><label>CSV内容<textarea name="csvText" rows="7"></textarea></label>${kind === "race" ? `<details><summary>马场映射（找不到同名马场时使用）</summary>${input("mapName", "文件中的马场名称", "")}${select("mapTarget", "映射至", [["", "不指定"], ...world.tracks.map((t) => [t.id, `${t.name} · ${t.region}`])], "")}</details>` : ""}${kind === "horse" ? `<label>父母编号映射（每行：外部编号=本地编号）<textarea name="parentMappings" rows="3" placeholder="horse-123=horse-456"></textarea></label><p>跨世界父母必须明确映射。可先在繁殖档案中检索本地编号；随文件一起导入的亲本会自动关联到新副本。</p>` : ""}<div class="cm-mapping-fields"></div><button>预览导入</button></form><div class="cm-preview"></div>`);
  }
  async function onClick(event) {
    const el = event.target.closest("[data-action]"); if (!el || !root.contains(el)) return;
    const action = el.dataset.action, id = el.dataset.id;
    if (action === "stop") { stopping = true; if (activeWorker) cancelWorker(); else notice("将在当前完整保存边界停止；正在保存的事务会完整提交。"); return; }
    if (action === "dialogTop") { dialog.querySelector(".cm-dialog-content").scrollTo({ top: 0, behavior: "smooth" }); return; }
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
      if (action === "dialogBack") return modalBack();
      if (!world) return;
      if (action === "calendarView" || action === "settingsView") { const key = action === "calendarView" ? "calendar" : "settings"; const layout = { ...(world.ui.layout || {}), [key]: id }; if (store.writable) await commit(W.edit(world, "ui", { layout })); else world.ui.layout = layout; page = 0; return render(); }
      if (action === "batch") { batch = batch === id ? "" : id; return render(); }
      if (await breeding.click(action, id, el)) return;
      if (await office.click(action, id, el)) return;
      if (action === "tab") { positions.set(`${world.id}:${tab}`, { page, scroll: window.scrollY }); tab = id; const pos = positions.get(`${world.id}:${tab}`); page = pos?.page || 0; if (store.writable) await commit(W.edit(world, "ui", { tab })); dialog.close(); await render(); window.scrollTo({ top: pos?.scroll || 0 }); return; }
      if (action === "page") { page = Math.max(0, page + Number(id)); return render(); }
      if (action === "horse" || action === "horsePage") return office.horseDetail(id, Number(el.dataset.offset || 0));
      if (action === "result" || action === "resultPage") return office.resultDetail(id, Number(el.dataset.offset || 0));
      if (action === "editHorse" || action === "editRace" || action === "editTrack") return editForm(action === "editHorse" ? "horse" : action === "editRace" ? "race" : "track", id, el.dataset.region);
      if (action === "regions") return regionPanel(Number(id) || 0);
      if (action === "editRegion") return regionForm(id);
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
      if (action === "generate") { modal("补充随机赛马", `<form data-form="generate">${input("count", "二岁马数量（过多可能卡顿）", 30, "number")}${select("homeRegion", "生成至地区", [["", "按已开启补马的地区轮换"], ...W.regionNames(world)], "")}<p>使用外来血统模板。每批完成后保存，可在批次之间停止。</p><button>开始生成</button>${button("stop", "停止生成")}</form>`); return; }
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
      if (await breeding.submit(form)) return;
      if (await office.submit(form)) return;
      const data = new FormData(form), kind = form.dataset.form, id = form.dataset.id;
      if (kind === "new") { const created = W.createWorld({ name: String(data.get("name")).trim() || "我的国际马会", blank: form.dataset.blank === "true", breeding: true }); await store.acquire(created.id); await store.commitChanges(null, { world: created }); world = created; tab = "overview"; dialog.close(); notice("世界已建立并保存。"); }
      else if (kind === "filter") { const prefs = Object.fromEntries(data); if (store.writable) await commit(W.edit(world, "ui", { [form.dataset.kind]: prefs })); else world.ui[form.dataset.kind] = prefs; page = 0; }
      else if (kind === "region") { const out = W.edit(world, "region", { id: id || undefined, name: data.get("name"), baseRegion: data.get("baseRegion"), autoPopulate: data.has("autoPopulate") }); W.validateWorld(out.world); await commit(out); await render(); return regionPanel(); }
      else if (["track", "horse", "race"].includes(kind)) {
        const value = id ? { id } : {};
        if (kind === "track") { Object.assign(value, Object.fromEntries(data), { surfaces: data.getAll("surfaces") }); }
        else for (const f of CSV.schema(kind).filter((f) => !["id", "trackName"].includes(f.key))) {
          const raw = data.get(f.key); if (raw == null || f.key === "breedingStrength" && raw.trim() === "") continue;
          write(value, f.key, f.type === "number" || f.key === "half" ? (raw.trim() === "" ? NaN : Number(raw)) : raw.trim());
        }
        const out = W.edit(world, kind, value); W.validateWorld(out.world); if (kind === "horse" && [value.fatherId, value.motherId].some((v) => String(v || "").startsWith("template:"))) return breeding.previewCreation(out); await commit(out); dialog.close();
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
        const region = data.get("homeRegion"), homes = region ? [region] : W.populationRegions(world);
        if (!homes.length) throw new Error("请指定生成地区，或先开启一个地区的自动补马。");
        if (homes.some((name) => !W.regionNames(world).includes(name))) throw new Error("生成地区不存在。");
        for (let i = 0; i < count && !stopping; i += 50) {
          notice(`正在生成 ${Math.min(count, i + 50)} / ${count} 匹…`); await pause();
          await commit(W.mutate(world, (w) => { for (let j = i; j < Math.min(count, i + 50); j++) W.addHorse(w, { age: 2, homeRegion: homes[j % homes.length] }); W.planEntries(w); }));
        } dialog.close();
      } else if (kind === "csv") {
        preview = null; dialog.querySelector(".cm-preview").innerHTML = "";
        notice("正在校验创作表格…"); await pause();
        const mappings = {}; if (data.get("mapName") && data.get("mapTarget")) mappings[data.get("mapName")] = data.get("mapTarget");
        for (const el of form.querySelectorAll('[data-map-source]')) if (el.value) mappings[el.dataset.mapSource] = el.value;
        const parentMappings = {};
        for (const line of String(data.get("parentMappings") || "").split(/\r?\n/).filter((s) => s.trim())) { const parts = line.split("=").map((s) => s.trim()); if (parts.length !== 2 || !parts.every(Boolean) || parentMappings[parts[0]]) throw new Error("父母映射须为每行一组外部编号=本地编号，不能重复。"); parentMappings[parts[0]] = parts[1]; }
        preview = await background("csv", { world, kind: form.dataset.kind, text: data.get("csvText"), options: { mode: data.get("mode"), trackMappings: mappings, parentMappings } });
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
    const card = document.createElement("article"); card.className = "home-mode-card home-mode-chairman";
    card.setAttribute("aria-labelledby", "homeChairmanTitle");
    card.innerHTML = '<div class="home-card-top"><img src="assets/home/chairman.svg" width="44" height="44" alt=""><span class="home-card-index">05 / CHAIRMAN</span></div><h3 id="homeChairmanTitle">国际主席模式 <span class="home-mode-badge">开发版</span></h3><p class="home-card-tagline">让世界赛场，按你的蓝图生长</p><p class="home-card-description">创办大赛，观察国际马群，评定年度名马。以主席视角，经营一个赛马世界。</p><div class="home-card-tags"><span>世界沙盒</span><span>自由经营</span></div><div class="home-card-bottom"><p class="home-card-status">世界沙盒 · 第三轮开发版</p><div class="home-card-actions"><button class="home-mode-action" id="chairmanLaunch" type="button">进入 / 继续主席世界</button></div></div>'; home.appendChild(card);
    root = document.createElement("section"); root.id = "chairmanApp"; root.hidden = true;
    root.innerHTML = `<div class="cm-shell"><div class="cm-sticky-head"><div class="cm-topline">${button("exit", "返回模式选择")}<p class="cm-notice" role="status" aria-live="polite"></p></div><header class="cm-world-bar"></header></div><main class="cm-body"></main>${button("top", "↑ 顶部", "", 'class="cm-back-top" aria-label="滑至顶部"')}<dialog class="cm-dialog"></dialog></div>`;
    document.getElementById("app").after(root); body = root.querySelector(".cm-body"); dialog = root.querySelector("dialog");
    office = ns.ChairmanOfficeUI.create({ get world() { return world; }, get store() { return store; }, get busy() { return busy; },
      get page() { return page; }, set page(v) { page = v; }, setTab(v) { tab = v; }, body, dialog, escape, show, date, button, link, input, select,
      modal, commit, render, run, notice });
    breeding = ns.ChairmanBreedingUI.create({ get world() { return world; }, get store() { return store; }, body, dialog, escape, button, input, select, modal, commit, render });
    root.addEventListener("input", (event) => { breeding.changed(event.target); if (event.target.name && ["horse", "race", "track", "breedMating"].includes(event.target.form?.dataset.form)) { const state = dialog.querySelector(".cm-editor-state"); if (state) state.textContent = "有未保存修改"; } });
    dialog.addEventListener("cancel", (event) => { event.preventDefault(); run(async () => dialog.close()); });
    dialog.addEventListener("close", () => { modalStack.length = 0; currentModal = null; if (modalOpener?.isConnected) modalOpener.focus({ preventScroll: true }); window.scrollTo({ top: listScroll }); });
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
    document.getElementById("chairmanLaunch").addEventListener("click", () => run(async () => {
      document.getElementById("app").hidden = true; root.hidden = false;
      if (!store) { store = await ns.ChairmanStorage.open(); store.onLeaseLost = () => notice("编辑权已失效，请在设置中重新取得编辑权。", true); }
      await lobby();
    }));
    window.addEventListener("pagehide", () => { if (store) store.release().catch(() => {}); });
  }
  ns.ChairmanApp = { mount, horseDetail: (id, offset, view) => office.horseDetail(id, offset, view), breedingContent: (...args) => breeding.content(...args), breedingDetail: (id) => breeding.detail(id) };
})();
