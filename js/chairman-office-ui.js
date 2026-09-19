(function () {
  "use strict";
  const ns = window.Keiba, W = ns.ChairmanRules, O = ns.ChairmanOffice;
  ns.ChairmanOfficeUI = { create(c) {
    const { escape: e, show, date, button: b, link, input, select, modal } = c;
    let detail = {}, pending = new Map(), timer, lastScene = null;
    const years = () => W.date(c.world.turn).year;
    const horse = (id) => c.world.horses.find((h) => h.id === id);
    const badge = (r) => ({ none: "尚无人工评分", partial: "部分人工评分", all: "全部人工评分" }[r.scoring || "none"]);
    const fields = (form) => { const d = new FormData(form), p = {}; for (const key of new Set(d.keys())) { const values = d.getAll(key).filter((v) => v !== ""); p[key] = values.length > 1 ? values : values[0] ?? ""; } return p; };
    const multi = (key, label, values, p) => `<label>${e(label)}<select name="${key}" multiple size="3">${values.map((v) => { const [id, text] = Array.isArray(v) ? v : [v, v]; return `<option value="${e(id)}" ${O.matches(p[key], id) && p[key]?.length ? "selected" : ""}>${e(text)}</option>`; }).join("")}</select></label>`;
    function filterForm(kind, p, type, extra) {
      const isHorse = ["horses", "board"].includes(type);
      return `<form data-form="officeFilter" data-kind="${kind}" class="cm-filters">${input("search", isHorse ? "搜索马名" : "搜索赛事", p.search || "")}${multi("region", "地区（可多选）", [...W.REGIONS, ...(type === "board" ? ["未记录"] : [])], p)}${isHorse ?
        multi("age", "年龄", [["2", "二岁"], ["3", "三岁"], ["4+", "四岁及以上"]], p) + multi("gender", "性别", ["牡马", "牝马", "骟马"], p) :
        multi("surface", "场地", ["草地", "泥地"], p) + multi("category", "距离类别", O.categories, p) + input("distance", "具体距离（米）", p.distance || "", "number") + multi("raceClass", "格付", [["g1", "G1"], ["g2", "G2"], ["g3", "G3"], ["op", "OP"]], p)}${type === "horses" ?
        select("status", "状态", [["active", "现役"], ["retired", "退役"], ["", "全部"]], p.status ?? "active") + select("origin", "来源", [["", "全部"], ["custom", "自建"], ["ai", "自动生成"]], p.origin || "") + select("sort", "排序", [["wtr", "年度WTR"], ["prize", "生涯奖金"]], p.sort || "wtr") : ""}${["calendar", "results"].includes(type) ?
        input("month", "月份", p.month || "", "number") + select("half", "半月", [["", "全部"], ["1", "上半月"], ["2", "下半月"]], p.half || "") + multi("ageRule", "赛事年龄条件", ["2", "3", "4", "2+", "3+", "4+"], p) + multi("sexRule", "赛事性别条件", [["all", "不限"], ["male", "牡"], ["female", "牝"], ["gelding", "骟"], ["male-female", "牡牝"]], p) : ""}${(["results", "records"].includes(type) || kind === "board_history") ? input("year", "年份", p.year || "", "number") : ""}${type === "board" ? input("minimum", kind === "board_lifetime" ? "最低生涯WTR" : "最低WTR", p.minimum ?? "", "number") : ""}${type === "results" ?
        select("resultStatus", "举办状态", [["", "全部"], ["completed", "已举办"], ["cancelled", "已取消"]], p.resultStatus || "") + select("scoring", "人工评分", [["", "全部"], ["none", "尚无"], ["partial", "部分"], ["all", "全部"]], p.scoring || "") + select("hidden", "显示范围", [["", "正常记录"], ["all", "包括隐藏"], ["only", "仅隐藏"]], p.hidden || "") + `<label class="cm-check"><input name="latest" type="checkbox" value="1" ${p.latest ? "checked" : ""}>只看上次结算</label>` : ""}${extra || ""}<button>查询并保存筛选</button>${b("officeClear", "清除筛选", kind)}<small>同项多选满足任一；不同项须同时满足。多选框可按住Ctrl选择。</small></form>`;
    }
    async function prefs(kind, value) {
      if (c.store.writable) await c.commit(W.edit(c.world, "ui", { [kind]: value })); else c.world.ui[kind] = value;
    }
    const pagination = (action, id, result, size = 50) => `<div class="cm-pagination">${b(action, "上一页", id, `data-offset="${Math.max(0, result.offset - size)}" ${result.offset === 0 ? "disabled" : ""}`)}<span>共${result.total}条 · 第${Math.floor(result.offset / size) + 1}页</span>${b(action, "下一页", id, `data-offset="${result.offset + size}" ${result.more ? "" : "disabled"}`)}</div>`;
    const resultCards = (rows) => rows.map((r) => `<article class="cm-card ${r.raceClass === "g1" ? "cm-g1" : ""}"><span class="cm-badge">${e(r.race.grade)}</span><h3>${e(r.name)}</h3><p>${date(r.turn)} · ${e(r.race.surface)} ${r.race.distance}米 · ${r.count}匹${r.hidden ? " · 已隐藏" : ""}</p><p>${r.status === "cancelled" ? "取消举办" : badge(r)}</p><div class="cm-actions">${r.status === "completed" ? b("result", "完整结果与评分", r.id) : ""}${b("raceArchive", "赛事档案", r.raceId)}${b("hideResult", r.hidden ? "恢复显示" : "从列表隐藏", r.id, `data-hidden="${!r.hidden}"`)}</div></article>`).join("");
    async function render(tab) {
      const w = c.world;
      if (tab === "results") {
        const p = w.ui.results || {}, result = await c.store.historyPage(w, p, c.page * 50); c.page = result.offset / 50;
        c.body.innerHTML = `<div class="cm-actions">${b("latest", "上次半月汇总")}${b("hideCancelled", "批量隐藏取消届次")}</div>${filterForm("results", p, "results")}<p>最近结算：${w.lastCompletedTurn == null ? "尚无" : date(w.lastCompletedTurn)}。${result.total}条符合条件；未人工评分不影响推进。</p><div class="cm-cards">${resultCards(result.rows) || "暂无结果"}</div>${pagination("officeMainPage", "results", result)}`; return true;
      }
      if (tab === "boards") {
        const settings = w.ui.boards || { kind: "current" }, kind = settings.kind || "current", key = `board_${kind}`, p = w.ui[key] || {};
        const result = await c.store.board(w, kind, p, settings.expanded ? c.page * 50 : 0, settings.expanded); c.page = Math.floor(result.offset / 50);
        if (kind === "lifetime") await Promise.all(result.rows.map(async (r) => { const old = await c.store.bestWtr(w.id, r.horseId); r.bestWtr = r.wtr == null ? old : old == null ? r.wtr : Math.max(old, r.wtr); }));
        c.body.innerHTML = `<div class="cm-actions">${[["current", "本年WTR榜"], ["history", "历史WTR榜"], ["annual", "本年奖金榜"], ["lifetime", "生涯奖金榜"]].map(([id, label]) => b("boardKind", label, id, kind === id ? 'aria-current="page"' : "")).join("")}${b("boardExpand", settings.expanded ? "只看前十" : "查看全部")}</div>${filterForm(key, p, "board")}<p>${kind === "history" ? "每条为马匹＋年份；年龄和地区按年度记录。" : kind === "current" ? "本年有WTR的现役马。" : "包括已退役马。身份按当前资料筛选。"}共${result.total}条。相同主分值并列。</p><div class="cm-table-wrap"><table><thead><tr><th>排名</th><th>马匹／年份</th><th>年龄／性别／地区</th><th>WTR / TF</th><th>评分来源</th><th>G1</th><th>胜／出赛</th><th>奖金（万）</th></tr></thead><tbody>${result.rows.map((r) => `<tr><td>${r.rank}</td><td>${link(r.horseId, r.horseName)}<small>第${r.year}年</small></td><td>${r.age}岁 ${e(r.gender)}<small>${e(r.homeRegion || "未记录")}</small></td><td>${b("annualEdit", `${show(r.wtr)} / ${show(r.tf)}`, r.horseId, `data-year="${r.year}"`)}${kind === "lifetime" ? `<small>生涯最高WTR ${show(r.bestWtr)}</small>` : ""}</td><td>${r.manual == null ? "自动" : "人工"}</td><td>${r.g1}</td><td>${r.wins} / ${r.starts}</td><td>${r.prize.toFixed(1)}</td></tr>`).join("")}</tbody></table></div>${settings.expanded ? pagination("officeMainPage", "boards", result) : ""}`; return true;
      }
      if (tab === "awards") {
        const p = w.ui.awards || {}, y = p.year ? Number(p.year) : null;
        const history = await c.store.scanPage("awards", w.id, { index: "byYear", range: window.IDBKeyRange.bound([w.id, 1], [w.id, Number.MAX_SAFE_INTEGER]), reverse: true, offset: c.page * 50,
          filter: (a) => y ? a.year === y : a.year >= years() - 1 }); c.page = history.offset / 50;
        c.body.innerHTML = `<h2>第${years()}年颁奖名单</h2><form data-form="awardStrict"><label class="cm-check"><input name="strict" type="checkbox" ${w.awardsStrict ? "checked" : ""}>严格候选：对应类别本年G1胜马</label><button>保存候选范围</button></form><p>宽松范围仍须本年实际参加对应类型赛事。名单自动保存，年末正式颁发。</p><div class="cm-cards">${W.AWARDS.map((a) => { const h = horse(w.awardDraft[a.id]); return `<article class="cm-card"><h3>${e(a.name)}</h3><p>${h ? link(h.id, h.name) : "空缺"}${h && !W.awardEligible(w, h, a, w.awardsStrict) ? '<strong class="cm-error"> 当前选择不符合候选范围，请调整</strong>' : ""}</p>${b("chooseAward", "选择 / 评语", a.id)}</article>`; }).join("")}</div>${b("finish", "封存年度并进入下一年", "", w.phase === "yearEnd" ? 'class="cm-primary"' : "disabled")}<h2>奖项回顾</h2><form data-form="awardYear" class="cm-actions">${input("year", "年份（留空为本年与去年）", p.year || "", "number")}<button>查看</button></form>${history.rows.map((a) => `<article class="cm-card"><p>第${a.year}年 ${e(a.name)} · ${link(a.horseId, a.horseName)}</p>${a.comment ? `<p>${e(a.comment)}</p>` : ""}${a.representative ? b("result", "代表赛事", a.representative) : ""}</article>`).join("") || "暂无已颁奖项"}${pagination("officeMainPage", "awards", history)}`; return true;
      }
      return false;
    }
    async function annualEdit(id, year) {
      const h = horse(id), r = year === years() ? { ...h.annual, wtr: W.rating(h) } : await c.store.get("ratings", c.world.id, `${year}:${id}`);
      if (!r) throw new Error("此年没有年度档案。");
      const history = await c.store.scanPage("revisions", c.world.id, { index: "byYear", range: [c.world.id, year], reverse: true, filter: (v) => v.horseId === id });
      modal(`${h.name} · 第${year}年评价`, `<p>年度TF ${show(r.tf)} · 自动建议 ${show(r.suggested)} · 有效WTR ${show(r.wtr)}</p><form data-form="annualScore" data-id="${e(id)}" data-year="${year}">${input("score", "人工年度WTR（留空恢复自动）", r.manual, "number")}<button>保存此年评价</button>${b("annualAuto", "恢复自动评价", id, `data-year="${year}"`)}</form><p>修改仅影响此年评价；不改变既有报名、赛果、奖金和已颁奖项。</p><h3>最近评分修订</h3>${history.rows.map((r) => `<p>${e(new Date(r.changedAt).toLocaleString())} · ${r.kind === "annual" ? "年度WTR" : "赛事分"} ${show(r.before)} → ${show(r.after)}</p>`).join("") || "暂无修订"}`);
    }
    async function resultDetail(id, offset = 0) {
      detail = { kind: "result", id, offset };
      const r = await c.store.get("occurrences", c.world.id, id), result = await c.store.query("performances", c.world.id, { occurrenceId: id, offset, limit: 50 }), draft = await c.store.get("scoreDrafts", c.world.id, id);
      modal(`${r.name} · ${date(r.turn)}`, `<p>${e(r.race.grade)} · ${e(r.race.surface)} ${r.race.distance}米 · ${e(r.trackCondition || "")}。${badge(r)}。草稿不参与评级。</p><div class="cm-actions">${b("saveRaceScores", "保存本场评分", id)}${b("resetRaceScores", "重拟评分", id)}${b("raceArchive", "查看赛事档案", r.raceId)}</div><p class="cm-draft-state">${draft ? "已恢复评分草稿，请保存本场评分使其生效。" : "输入会自动保存为草稿。"}</p><div class="cm-table-wrap"><table><thead><tr><th>名次</th><th>马名</th><th>距胜马</th><th>骑手</th><th>奖金万</th><th>上场评级</th><th>机器TF</th><th>人工赛事分</th></tr></thead><tbody>${result.rows.map((p) => `<tr><td>${p.retired ? "退赛" : p.rank}</td><td>${link(p.horseId, p.horseName)}</td><td>${e(p.marginLabel)}</td><td>${e(p.jockeyName)}</td><td>${p.prize}</td><td>${show(p.priorEventRating)}</td><td>${show(p.tf)}</td><td>${p.retired ? "—" : `<input type="number" step="any" data-draft="${e(id)}" data-performance="${e(p.id)}" aria-label="${e(p.horseName)}赛事分" value="${e(Object.hasOwn(draft?.values || {}, p.id) ? draft.values[p.id] : p.manualRating)}">${b("saveOneScore", "保存", p.id, `data-race="${e(id)}"`)}`}</td></tr>`).join("")}</tbody></table></div><div class="cm-actions">${offset ? b("resultPage", "上一页成绩", id, `data-offset="${offset - 50}"`) : ""}${result.more ? b("resultPage", "更多成绩", id, `data-offset="${offset + 50}"`) : ""}</div>`);
    }
    function trend(rows) {
      const data = [...rows].sort((a, b) => a.year - b.year), vals = data.flatMap((r) => [r.wtr, r.tf]).filter((v) => v != null);
      if (!vals.length) return "<p>尚无可绘制的年度评价。</p>";
      const min = Math.min(...vals) - 5, max = Math.max(...vals) + 5, first = data[0].year, last = data.at(-1).year;
      const x = (r) => 35 + (r.year - first) / Math.max(1, last - first) * 520, y = (v) => 150 - (v - min) / (max - min) * 125;
      return `<figure class="cm-trend"><svg viewBox="0 0 590 190" role="img" aria-label="本页年度WTR和TF趋势；缺失年份不连接"><path d="M30 15V155H570" fill="none" stroke="#718199"/>${["wtr", "tf"].map((key, k) => data.map((r, i) => {
        if (r[key] == null) return ""; const prev = data[i - 1], color = k ? "#e4bc7a" : "#93c6ff";
        return `${prev && prev.year + 1 === r.year && prev[key] != null ? `<line x1="${x(prev)}" y1="${y(prev[key])}" x2="${x(r)}" y2="${y(r[key])}" stroke="${color}"/>` : ""}<circle cx="${x(r)}" cy="${y(r[key])}" r="4" fill="${color}"><title>第${r.year}年 ${key.toUpperCase()} ${r[key]}</title></circle>`;
      }).join("")).join("")}<text x="30" y="178" fill="#d4e0f2">第${first}年</text><text x="490" y="178" fill="#d4e0f2">第${last}年</text></svg><figcaption>蓝：WTR · 金：TF；对应下表本页年份，缺失值留空。</figcaption></figure>`;
    }
    async function horseDetail(id, offset = 0, view = "overview") {
      const h = horse(id); if (!h) throw new Error("马匹不存在。"); detail = { kind: "horse", id, offset, view };
      const key = `horse_${id}`, p = c.world.ui[key] || {};
      let html = `<p>${W.ageOf(c.world, h)}岁 ${e(h.gender)} · ${e(h.homeRegion)} · ${e(h.owner)} · ${h.status === "active" ? "现役" : "退役"}</p><p>生涯 ${h.lifetime.wins}胜／${h.lifetime.starts}战 · G1 ${h.lifetime.g1}胜 · 奖金 ${h.lifetime.prize.toFixed(1)}万</p><div class="cm-actions">${[["overview", "概况"], ["records", "逐场赛绩"], ["ratings", "年度评价"], ["honors", "荣誉"]].map(([v, label]) => b("horseView", label, id, `data-view="${v}" ${v === view ? 'aria-current="page"' : ""}`)).join("")}</div>`;
      if (view === "overview") {
        html += `<p>本年WTR ${show(W.rating(h))} · 自动建议 ${show(h.annual.suggested)} · TF ${show(h.annual.tf)}</p>${b("annualEdit", "编辑本年评价", id, `data-year="${years()}"`)}${h.origin === "custom" ? `<details><summary>自建参数</summary><dl class="cm-attributes">${ns.ChairmanCSV.schema("horse").filter((f) => f.key !== "id").map((f) => `<div><dt>${e(f.label)}</dt><dd>${show(f.key.split(".").reduce((o, k) => o?.[k], h))}</dd></div>`).join("")}</dl></details>${b("editHorse", "编辑自建参数", id)}` : "<p>能力、精确适性及巅峰期未知，请根据公开表现评价。</p>"}${h.status === "active" ? b("retire", "勒令退役", id) : ""}`;
        const runs = h.annual.runs || [], groups = {};
        for (const r of runs) { const name = `${r.surface} · ${W.category(r.distance)}`; const g = groups[name] || (groups[name] = [0, 0]); g[0]++; if (r.rank === 1) g[1]++; }
        html += `<h3>本年公开表现样本</h3>${Object.entries(groups).map(([k, v]) => `<p>${e(k)}：${v[1]}胜／${v[0]}次出赛</p>`).join("") || "尚无样本"}<p>仅为已观察战绩，不代表真实适性。</p>`;
      } else if (view === "ratings") {
        const result = await c.store.scanPage("ratings", c.world.id, { index: "byHorseYear", range: window.IDBKeyRange.bound([c.world.id, id, 1], [c.world.id, id, Number.MAX_SAFE_INTEGER]), reverse: true, offset });
        html += trend(result.rows) + `<div class="cm-table-wrap"><table><thead><tr><th>年份</th><th>WTR / TF</th><th>胜／出赛</th><th>G1</th><th>奖金</th><th>编辑</th></tr></thead><tbody>${result.rows.map((r) => `<tr><td>第${r.year}年</td><td>${show(r.wtr)} / ${show(r.tf)}</td><td>${r.wins} / ${r.starts}</td><td>${r.g1}</td><td>${r.prize}</td><td>${b("annualEdit", "修改此年WTR", id, `data-year="${r.year}"`)}</td></tr>`).join("")}</tbody></table></div>${pagination("horseDetailPage", id, result)}`;
      } else {
        const honors = view === "honors";
        const result = await c.store.scanPage("performances", c.world.id, { index: "byHorseTurn", range: window.IDBKeyRange.bound([c.world.id, id, 0], [c.world.id, id, Number.MAX_SAFE_INTEGER]), reverse: true, offset,
          filter: (r) => honors ? r.rank === 1 && r.raceClass === "g1" : (!p.year || r.year === Number(p.year)) && (r.raceName || "").includes(p.search || "") && O.matches(p.region, r.surfaceRegion) && O.matches(p.surface, r.surface) && O.matches(p.category, W.category(r.distance)) && O.matches(p.raceClass, r.raceClass) && (!p.distance || r.distance === Number(p.distance)) });
        html += honors ? "<h3>全部G1胜利</h3>" : filterForm(key, p, "records");
        html += result.rows.map((r) => `<p>${date(r.turn)} · ${e(r.raceName)} · ${r.retired ? "退赛" : `${r.rank}着`} · TF ${show(r.tf)} · 赛事分 ${show(r.manualRating)} ${b("result", "查看 / 评分", r.occurrenceId)}</p>`).join("") || "暂无记录";
        html += pagination("horseDetailPage", id, result);
        if (honors) {
          const awards = await c.store.scanPage("awards", c.world.id, { index: "byHorseYear", range: window.IDBKeyRange.bound([c.world.id, id, 1], [c.world.id, id, Number.MAX_SAFE_INTEGER]), reverse: true, offset: p.awardOffset || 0 });
          html += `<h3>年度奖项</h3>${awards.rows.map((a) => `<p>第${a.year}年 ${e(a.name)} · ${e(a.comment || "")}</p>`).join("")}${pagination("horseAwardPage", id, awards)}`;
        }
      }
      modal(h.name, html);
    }
    async function archive(id, offset = 0, track = false) {
      detail = { kind: track ? "track" : "race", id, offset };
      const definition = (track ? c.world.tracks : c.world.races).find((r) => r.id === id);
      if (!definition) throw new Error("没有对应档案。");
      const rows = await c.store.historyPage(c.world, { hidden: "all" }, offset, track ? { trackId: id, g1: true } : { raceId: id });
      const winners = await Promise.all(rows.rows.map((r) => c.store.query("performances", c.world.id, { occurrenceId: r.id, limit: 1 })));
      let intro = track ? `<p>${e(definition.region)} · ${e(definition.surfaces.join("／"))}</p>${b("trackRaces", "查看当前赛事", id)}` : `<p>${definition.deleted ? "已停止举办" : `未来定义：${definition.month}月${definition.half === 1 ? "上" : "下"}半月 · ${e(definition.surface)} ${definition.distance}米 · ${e(definition.grade)}`}</p>${!definition.deleted ? b("editRace", "编辑未来赛事", id) : ""}`;
      intro += `<h3>${track ? "在此举办的历史G1" : "历届比赛"}</h3>${rows.rows.map((r, i) => { const winner = winners[i].rows[0]; return `<article class="cm-card"><p>${date(r.turn)} · ${e(r.name)} · ${e(r.race.trackName || "")} · ${e(r.race.surface)} ${r.race.distance}米 · ${r.count}匹</p><p>${r.status === "cancelled" ? "取消举办" : winner?.rank === 1 ? `冠军 ${link(winner.horseId, winner.horseName)}` : "无完赛冠军"}</p>${r.status === "completed" ? b("result", "查看该届", r.id) : ""}</article>`; }).join("")}${pagination("archivePage", id, rows)}`;
      modal(definition.name, intro);
    }
    async function chooseAward(id, offset = 0, search = "") {
      const a = W.AWARDS.find((v) => v.id === id); detail = { kind: "award", id, offset, search };
      const rows = c.world.horses.filter((h) => W.awardEligible(c.world, h, a, c.world.awardsStrict) && h.name.includes(search)).sort((a, b) => (W.rating(b) ?? -Infinity) - (W.rating(a) ?? -Infinity) || b.annual.g1 - a.annual.g1 || b.annual.prize - a.annual.prize || a.id.localeCompare(b.id));
      offset = rows.length && offset >= rows.length ? Math.floor((rows.length - 1) / 50) * 50 : offset; detail.offset = offset;
      const chosen = horse(c.world.awardDraft[id]), d = (c.world.awardDetails || {})[id] || {};
      modal(a.name, `<p>当前：${chosen ? e(chosen.name) : "空缺"}</p>${b("pickAward", "设为空缺", "", `data-award="${id}"`)}<form data-form="candidateSearch" data-id="${id}" class="cm-actions">${input("search", "搜索候选马", search)}<button>搜索</button></form><div class="cm-candidates">${rows.slice(offset, offset + 50).map((h) => `<article class="cm-card"><h3>${link(h.id, h.name)}</h3><p>WTR ${show(W.rating(h))} / TF ${show(h.annual.tf)} · G1 ${h.annual.g1} · ${h.annual.wins}胜／${h.annual.starts}战 · 奖金${h.annual.prize.toFixed(1)}万</p><p>本年所胜G1：${e((h.annual.runs || []).filter((r) => r.raceClass === "g1" && r.rank === 1).map((r) => r.name).join("、") || "无")}</p>${b("pickAward", "选为获奖马", h.id, `data-award="${id}"`)}</article>`).join("")}</div>${pagination("candidatePage", id, { offset, total: rows.length, more: offset + 50 < rows.length })}${chosen ? `<form data-form="awardDetail" data-id="${id}">${input("comment", "评语（自动保存）", d.comment || "")}${select("representative", "代表赛事（自动保存）", [["", "不指定"], ...(chosen.annual.runs || []).map((r) => [r.id, r.name])], d.representative || "")}<button>保存评语与代表赛事</button><p class="cm-award-state" role="status"></p></form>` : ""}`);
    }
    async function flush() {
      clearTimeout(timer);
      if (!c.world || !c.store.writable) { pending.clear(); return; }
      for (const [id, values] of [...pending]) { await c.commit(await c.store.draftOutput(c.world, id, values)); if (pending.get(id) === values) pending.delete(id); }
      const state = c.dialog.querySelector(".cm-draft-state"); if (state) state.textContent = "草稿已保存；点击保存本场评分后生效。";
      const form = c.dialog.querySelector('[data-form="awardDetail"]');
      if (form?.dataset.dirty) { const d = fields(form), token = form.dataset.dirty; await c.commit(W.edit(c.world, "awards", { draft: c.world.awardDraft, strict: c.world.awardsStrict,
        details: { ...(c.world.awardDetails || {}), [form.dataset.id]: d } })); if (token === form.dataset.dirty) delete form.dataset.dirty; const s = form.querySelector(".cm-award-state"); if (s) s.textContent = "评语与代表赛事已保存。"; }
    }
    function changed(target) {
      if (target.dataset.draft) { const id = target.dataset.draft; pending.set(id, { ...(pending.get(id) || {}), [target.dataset.performance]: target.value }); const s = c.dialog.querySelector(".cm-draft-state"); if (s) s.textContent = "草稿正在保存…"; }
      else if (target.form?.dataset.form === "awardDetail") target.form.dataset.dirty = String(Number(target.form.dataset.dirty || 0) + 1);
      else return;
      const saveWhenIdle = () => { if (c.busy) timer = setTimeout(saveWhenIdle, 300); else c.run(async () => {}); };
      clearTimeout(timer); timer = setTimeout(saveWhenIdle, 400);
    }
    async function click(action, id, el) {
      const offset = Number(el?.dataset.offset || 0), w = c.world;
      if (action === "annualEdit") await annualEdit(id, Number(el.dataset.year));
      else if (action === "annualAuto") { const year = Number(el.dataset.year), old = year === years() ? null : await c.store.get("ratings", w.id, `${year}:${id}`); await c.commit(O.annualScore(w, id, year, null, old)); await c.render(); await annualEdit(id, year); }
      else if (["saveRaceScores", "saveOneScore"].includes(action)) {
        const occurrenceId = action === "saveOneScore" ? el.dataset.race : id, draft = await c.store.get("scoreDrafts", w.id, occurrenceId);
        const values = action === "saveOneScore" ? { [id]: draft?.values[id] ?? c.dialog.querySelector(`[data-performance="${id}"]`).value } : draft?.values || {};
        const out = await c.store.scoreOutput(w, occurrenceId, values, false);
        if (action === "saveOneScore" && draft) { const remaining = { ...draft.values }; delete remaining[id]; if (Object.keys(remaining).length) { out.deletes = []; out.scoreDrafts = [{ ...draft, values: remaining }]; } }
        await c.commit(out); await c.render(); await resultDetail(occurrenceId, detail.offset);
      } else if (action === "resetRaceScores") modal("重拟本场评分", `<p>清除本场所有人工赛事分及草稿。机器TF、名次、奖金和人工年度WTR覆盖保留。</p>${b("confirmResetScores", "确认重拟", id)}`);
      else if (action === "confirmResetScores") { await c.commit(await c.store.scoreOutput(w, id, {}, true)); await c.render(); await resultDetail(id); }
      else if (action === "latest") { await prefs("results", { latest: "1" }); c.setTab("results"); c.page = 0; await c.render(); }
      else if (action === "officeMainPage") { c.page = offset / 50; await c.render(); }
      else if (action === "boardKind" || action === "boardExpand") { const p = w.ui.boards || { kind: "current" }; await prefs("boards", action === "boardKind" ? { ...p, kind: id } : { ...p, expanded: !p.expanded }); c.page = 0; await c.render(); }
      else if (action === "officeClear") { await prefs(id, {}); c.page = 0; if (id.startsWith("horse_")) await horseDetail(id.slice(6), 0, "records"); else await c.render(); }
      else if (action === "horseView") await horseDetail(id, 0, el.dataset.view);
      else if (action === "horseDetailPage") await horseDetail(id, offset, detail.view);
      else if (action === "horseAwardPage") { await prefs(`horse_${id}`, { ...(w.ui[`horse_${id}`] || {}), awardOffset: offset }); await horseDetail(id, detail.offset, "honors"); }
      else if (action === "raceArchive" || action === "trackArchive") await archive(id, 0, action === "trackArchive");
      else if (action === "archivePage") await archive(id, offset, detail.kind === "track");
      else if (action === "tracks" || action === "tracksPage") { const rows = w.tracks.slice(offset, offset + 50); modal("管理马场", rows.map((t) => `<p>${e(t.name)} · ${e(t.region)} ${b("trackArchive", "马场档案", t.id)} ${b("editTrack", "编辑", t.id)}</p>`).join("") + pagination("tracksPage", "", { offset, total: w.tracks.length, more: offset + 50 < w.tracks.length })); }
      else if (action === "trackRaces" || action === "trackRacePage") { const rows = w.races.filter((r) => !r.deleted && r.trackId === id); modal("马场当前赛事", rows.slice(offset, offset + 50).map((r) => `<p>${e(r.name)} ${b("raceArchive", "档案", r.id)}</p>`).join("") + pagination("trackRacePage", id, { offset, total: rows.length, more: offset + 50 < rows.length })); }
      else if (action === "entryList" || action === "entryPage") { const rows = w.horses.filter((h) => h.booked?.raceId === id); modal(w.races.find((r) => r.id === id).name, rows.slice(offset, offset + 50).map((h) => `<p>${link(h.id, h.name)} · WTR ${show(W.rating(h))}</p>`).join("") + pagination("entryPage", id, { offset, total: rows.length, more: offset + 50 < rows.length })); }
      else if (action === "chooseAward" || action === "candidatePage") await chooseAward(id, offset, action === "candidatePage" ? detail.search : "");
      else if (action === "pickAward") { const aid = el.dataset.award; await c.commit(W.edit(w, "awards", { strict: w.awardsStrict, draft: { ...w.awardDraft, [aid]: id }, details: { ...(w.awardDetails || {}), [aid]: {} } })); await c.render(); await chooseAward(aid); }
      else if (action === "hideResult") { await c.commit(await c.store.visibilityOutput(w, [id], el.dataset.hidden === "true")); await c.render(); }
      else if (action === "hideCancelled") { const rows = await c.store.query("occurrences", w.id, { limit: Number.MAX_SAFE_INTEGER, filter: (r) => r.status === "cancelled" && !r.hidden }); lastScene = rows.rows.map((r) => r.id); modal("隐藏取消届次", `<p>所有年份共${lastScene.length}场取消届次将从正常结果列表隐藏，可通过“仅隐藏”查询并恢复。生涯事实保留。</p>${b("confirmHideCancelled", "确认隐藏")}`); }
      else if (action === "confirmHideCancelled") { await c.commit(await c.store.visibilityOutput(w, lastScene || [], true)); c.dialog.close(); await c.render(); }
      else return false;
      return true;
    }
    async function submit(form) {
      const kind = form.dataset.form, p = fields(form), id = form.dataset.id;
      if (kind === "officeFilter") { await prefs(form.dataset.kind, p); c.page = 0; if (form.dataset.kind.startsWith("horse_")) await horseDetail(form.dataset.kind.slice(6), 0, "records"); else await c.render(); }
      else if (kind === "annualScore") { const year = Number(form.dataset.year); await c.commit(O.annualScore(c.world, id, year, p.score, year === years() ? null : await c.store.get("ratings", c.world.id, `${year}:${id}`))); await c.render(); await annualEdit(id, year); }
      else if (kind === "awardStrict") { await c.commit(W.edit(c.world, "awards", { draft: c.world.awardDraft, strict: !!p.strict })); await c.render(); }
      else if (kind === "awardYear") { await prefs("awards", p); c.page = 0; await c.render(); }
      else if (kind === "candidateSearch") await chooseAward(id, 0, p.search);
      else if (kind === "awardDetail") { form.dataset.dirty = "true"; await flush(); }
      else return false;
      return true;
    }
    async function decorate(tab) {
      if (tab === "settings") {
        const counts = await c.store.stats(c.world.id), estimate = window.navigator.storage?.estimate ? await window.navigator.storage.estimate().catch(() => null) : null;
        c.body.insertAdjacentHTML("beforeend", `<h3>保存与容量</h3><p>最近成功保存：${c.world.savedAt ? e(new Date(c.world.savedAt).toLocaleString()) : "尚未记录"}</p><p>马匹${counts.horses} · 届次${counts.occurrences} · 出赛${counts.performances} · 年度评价${counts.ratings} · 奖项${counts.awards}</p>${estimate ? `<p>本站存储约${(estimate.usage / 1048576).toFixed(1)} MiB／配额${(estimate.quota / 1048576).toFixed(0)} MiB；包含本站其他世界，不是当前世界精确容量。</p>` : ""}`);
      }
      if (tab === "calendar") {
        const groups = {}; for (const r of c.world.races.filter((r) => !r.deleted)) { const t = c.world.tracks.find((t) => t.id === r.trackId), key = `${t.region}／${r.surface}／${W.category(r.distance)}`; groups[key] = (groups[key] || 0) + 1; }
        c.body.insertAdjacentHTML("beforeend", `<details><summary>年度赛事覆盖概览</summary>${Object.entries(groups).map(([k, n]) => `<p>${e(k)}：${n}场</p>`).join("")}</details>`);
      }
    }
    return { render, filters: (kind) => filterForm(kind, c.world.ui[kind] || {}, kind), horseDetail, resultDetail, click, submit, changed, flush, decorate };
  } };
})();
