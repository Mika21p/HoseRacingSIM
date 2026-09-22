(function () {
  "use strict";
  const ns = window.Keiba, W = ns.ChairmanRules, O = ns.ChairmanOffice, UI = ns.ChairmanUI;
  ns.ChairmanOfficeUI = { create(c) {
    const { escape: e, show, date, button: b, link, input, select, modal } = c;
    const confirmModal=(title,html)=>modal(title,html,{kind:'confirm'});
    let detail = {}, pending = new Map(), timer, lastScene = null;
    const years = () => W.date(c.world.turn).year;
    const horse = (id) => c.world.horses.find((h) => h.id === id);
    const badge = (r) => c.world.worldSystemVersion===2&&!ns.ChairmanWorld.graded(r)?"公开赛果":({ none: "尚无人工评分", partial: "部分人工评分", all: "全部人工评分" }[r.scoring || "none"]);
    const fields = (form) => { const d = new FormData(form), p = {}; for (const key of new Set(d.keys())) { const values = d.getAll(key).filter((v) => v !== ""); p[key] = values.length > 1 ? values : values[0] ?? ""; } return p; };
    const multi = (key, label, values, p) => `<label>${e(label)}<select name="${key}" multiple size="3">${values.map((v) => { const [id, text] = Array.isArray(v) ? v : [v, v]; return `<option value="${e(id)}" ${O.matches(p[key], id) && p[key]?.length ? "selected" : ""}>${e(text)}</option>`; }).join("")}</select></label>`;
    function filterForm(kind, p, type, extra) {
      const isHorse = ["horses", "board"].includes(type);
      return `<form data-form="officeFilter" data-kind="${kind}" class="cm-filters">${input("search", isHorse ? "搜索马名" : "搜索赛事", p.search || "")}${multi("region", "地区（可多选）", [...(c.world.worldSystemVersion===2?c.world.regions.map(r=>[r.id,r.name]):W.regionNames(c.world)), ...(type === "board" ? ["未记录"] : [])], p)}${isHorse ?
        multi("age", "年龄", [["2", "二岁"], ["3", "三岁"], ["4+", "四岁及以上"]], p) + multi("gender", "性别", ["牡马", "牝马", "骟马"], p) :
        multi("surface", "场地", ["草地", "泥地"], p) + multi("category", "距离类别", O.categories, p) + input("distance", "具体距离（米）", p.distance || "", "number") + multi("raceClass", "格付", [["g1", "G1"], ["g2", "G2"], ["g3", "G3"], ...(c.world.worldSystemVersion===2?ns.ChairmanWorld.classes.filter(k=>!["g1","g2","g3"].includes(k)).map(k=>[k,ns.ChairmanWorld.labels[k]]):["results", "records"].includes(type) ? [] : [["op", "OP"]])], p)}${type === "horses" ?
        select("status", "状态", [["active", "现役"], ["retired", "退役"], ["", "全部"]], p.status ?? "active") + select("origin", "来源", [["", "全部"], ["custom", "自建"], ["ai", "自动生成"]], p.origin || "") + select("sort", "排序", [["tf", "年度TF"], ["wtr", "年度WTR"], ["prize", "生涯奖金"],...(ns.ChairmanEditor?.enabled(c.world)?[["strength","真实能力"],["breedingStrength","配种实力"]]:[])], p.sort || "tf") + select("honor", "生涯荣誉", [["", "不限"], ["central", "获得中央年度奖"], ["local", "获得地方年度奖"], ["hall", "入选中央殿堂"]], p.honor || "") : ""}${["calendar", "results"].includes(type) ?
        input("month", "月份", p.month || "", "number") + select("half", "半月", [["", "全部"], ["1", "上半月"], ["2", "下半月"]], p.half || "") + multi("ageRule", "赛事年龄条件", ["2", "3", "4", "2+", "3+", "4+"], p) + multi("sexRule", "赛事性别条件", [["all", "不限"], ["male", "牡"], ["female", "牝"], ["gelding", "骟"], ["male-female", "牡牝"]], p) : ""}${(["results", "records"].includes(type) || ["board_history", "board_tfHistory", "board_legacy"].includes(kind)) ? input("year", "年份", p.year || "", "number") : ""}${type === "board" ? input("minimum", kind.includes("tf") ? "最低TF" : kind === "board_lifetime" ? "最低生涯WTR" : "最低WTR", p.minimum ?? "", "number") : ""}${type === "results" ?
        select("resultStatus", "举办状态", [["", "全部"], ["completed", "已举办"], ["cancelled", "已取消"]], p.resultStatus || "") + multi("scoring", "人工评分", [["none", "尚无"], ["partial", "部分"], ["all", "全部"]], p) + select("hidden", "显示范围", [["", "正常记录"], ["all", "包括隐藏"], ["only", "仅隐藏"]], p.hidden || "") + `<label class="cm-check"><input name="latest" type="checkbox" value="1" ${p.latest ? "checked" : ""}>只看上次结算</label>` : ""}${extra || ""}<button>查询并保存筛选</button>${b("officeClear", "清除筛选", kind)}<small>同项多选满足任一；不同项须同时满足。多选框可按住Ctrl选择。</small></form>`;
    }
    async function prefs(kind, value) {
      if (c.store.writable) await c.commit(W.edit(c.world, "ui", { [kind]: value })); else c.world.ui[kind] = value;
    }
    const pagination = (action, id, result, size = 50) => `<div class="cm-pagination">${b(action, "上一页", id, `data-offset="${Math.max(0, result.offset - size)}" ${result.offset === 0 ? "disabled" : ""}`)}<span>共${result.total}条 · 第${Math.floor(result.offset / size) + 1}页</span>${b(action, "下一页", id, `data-offset="${result.offset + size}" ${result.more ? "" : "disabled"}`)}</div>`;
    const resultCards = (rows) => `<div class="cm-table-wrap"><table data-table="results" data-primary-columns="0,1,3,4,5" data-name-column="1"><thead><tr><th>日期</th><th>赛事</th><th>条件</th><th>参赛数</th><th>评分状态</th><th></th></tr></thead><tbody>${rows.map((r) => `<tr data-row-id="${e(r.id)}" class="${r.raceClass === "g1" ? "cm-g1" : ""}"><td>${date(r.turn)}</td><td><span class="cm-badge">${e(r.race.grade)}</span> ${r.status === "completed" ? b("result", r.name, r.id, 'class="cm-link"') : e(r.name)}</td><td>${e(r.race.surfaceRegion)} · ${e(r.race.trackName||'')} · ${e(r.race.surface)} ${r.race.distance}米${r.race.courseProfile?" · "+e(ns.ChairmanWorld.courseLabel(r.race.courseProfile)):""}</td><td>${r.count}</td><td>${r.status === "cancelled" ? "取消" : badge(r)}${r.hidden ? " · 已隐藏" : ""}</td><td>${UI.more(b("raceArchive", "赛事档案", r.raceId) + b("hideResult", r.hidden ? "恢复显示" : "隐藏", r.id, `data-hidden="${!r.hidden}"`),"赛果操作",`${r.name} · 赛果操作`)}</td></tr>`).join("") || '<tr><td colspan="6">暂无结果</td></tr>'}</tbody></table></div>`;
    async function render(tab) {
      const w = c.world;
      if (tab === "results") {
        const p = w.ui.results || {}, result = await c.store.historyPage(w, p, c.page * 50); c.page = result.offset / 50;
        c.body.innerHTML = `${UI.toolbar("结果与评分", `${result.total}场`, b("latest", "上次半月汇总") + UI.more(b("hideCancelled", "隐藏取消届次")))}${w.backgroundSummary ? `<p class="cm-muted">上次后台普通赛：完成${w.backgroundSummary.completed}场 · 取消${w.backgroundSummary.cancelled}场</p>` : ""}${filterForm("results", p, "results")}${resultCards(result.rows)}${pagination("officeMainPage", "results", result)}`; return true;
      }
      if (tab === "boards") {
        const settings = w.ui.boards || { kind: "tf" }, kind = settings.kind || "tf", key = `board_${kind}`, p = w.ui[key] || {};
        const result = await c.store.board(w, kind, p, settings.expanded ? c.page * 50 : 0, settings.expanded); c.page = Math.floor(result.offset / 50);
        if (kind === "lifetime") await Promise.all(result.rows.map(async (r) => { const old = await c.store.bestWtr(w.id, r.horseId); r.bestWtr = r.wtr == null ? old : old == null ? r.wtr : Math.max(old, r.wtr); }));
        c.body.innerHTML = `<div class="cm-tabs">${[["tf", "本年TF榜"], ["tfHistory", "历史TF榜"], ["current", "本年WTR榜"], ["legacy", "旧制自动评价"], ["history", "历史WTR榜"], ["annual", "本年奖金榜"], ["lifetime", "生涯奖金榜"]].map(([id, label]) => b("boardKind", label, id, kind === id ? 'aria-current="page"' : "")).join("")}</div>${b("boardExpand", settings.expanded ? "只看前十" : "查看全部")}${filterForm(key, p, "board")}<details class="cm-help"><summary>榜单说明 · ${result.total}条</summary><p>${kind === "history" ? "每条为马匹＋年份；年龄和地区按年度记录。" : kind === "current" ? "本年有WTR的现役马。" : "包括已退役马。身份按当前资料筛选。"}共${result.total}条。相同主分值并列。</p></details><div class="cm-table-wrap"><table class="cm-board-table" data-kind="${kind}"><thead><tr><th>排名</th><th>马匹／年份</th><th>年龄／性别／地区</th><th>WTR / TF</th><th>评分来源</th><th>G1</th><th>胜／出赛</th><th>奖金（万）</th></tr></thead><tbody>${result.rows.map((r) => `<tr><td>${r.rank}</td><td>${link(r.horseId, r.horseName)}<small>第${r.year}年</small></td><td>${r.age}岁 ${e(r.gender)}<small>${e(r.homeRegion || "未记录")}</small></td><td>${b("annualEdit", `${show(r.wtr)} / ${show(r.tf)}`, r.horseId, `data-year="${r.year}"`)}${kind === "lifetime" ? `<small>生涯最高WTR ${show(r.bestWtr)}</small>` : ""}</td><td>${kind === "legacy" ? `旧制 ${show(r.legacyAutomatic)}` : r.manual == null ? (r.wtr == null ? "机器TF" : "人工赛事核准") : "年度覆盖"}</td><td>${r.g1}</td><td>${r.wins} / ${r.starts}</td><td>${r.prize.toFixed(1)}</td></tr>`).join("")}</tbody></table></div>${settings.expanded ? pagination("officeMainPage", "boards", result) : ""}`; return true;
      }
      if (tab === "awards") {
        const p = w.ui.awards || {}, y = p.year ? Number(p.year) : null;
        const history = await c.store.scanPage("awards", w.id, { index: "byYear", range: window.IDBKeyRange.bound([w.id, 1], [w.id, Number.MAX_SAFE_INTEGER]), reverse: true, offset: c.page * 50,
          filter: (a) => (!a.scope || a.scope === 'central') && (y ? a.year === y : a.year >= years() - 1) }); c.page = history.offset / 50;
        const view = w.ui.layout?.awards || "draft";
        c.body.innerHTML = `${w.phase!=="yearEnd"&&view==="draft"?'<p class="cm-phase-note">名单自动保存；到达年末后可封存并进入下一年。</p>':''}${UI.toolbar(view === "draft" ? `第${years()}年颁奖名单` : "奖项回顾", null, view === "draft" ? b("finish", "封存年度并进入下一年", "", w.phase === "yearEnd" ? 'class="cm-primary"' : "disabled") : "")}${UI.tabs([["draft", "本年评选"], ["history", "历史回顾"]], view, "awardView", b)}${view === "draft" ? `<form data-form="awardStrict" class="cm-actions"><label class="cm-check"><input name="strict" type="checkbox" ${w.awardsStrict ? "checked" : ""}>仅本年对应类别G1胜马</label><button>应用</button><small>名单自动保存，年末颁发</small></form><div class="cm-award-grid">${W.AWARDS.map((a) => { const h = horse(w.awardDraft[a.id]); return `<article><strong>${e(a.name)}</strong><span>${h ? link(h.id, h.name) : "空缺"}${h && !W.awardEligible(w, h, a, w.awardsStrict) ? '<small class="cm-error">不符合当前候选范围</small>' : ""}</span>${b("chooseAward", "选择 / 评语", a.id)}${w.honors?.latest[`central:${a.id}`] ? b("honorRound", "投票建议", w.honors.latest[`central:${a.id}`].id) : ""}</article>`; }).join("")}</div>` : `<form data-form="awardYear" class="cm-actions">${input("year", "年份", p.year || "", "number")}<button>查询</button></form><div class="cm-table-wrap"><table><thead><tr><th>年份</th><th>奖项</th><th>获奖马</th><th>评语</th><th></th></tr></thead><tbody>${history.rows.map((a) => `<tr><td>第${a.year}年</td><td>${e(a.name)}</td><td>${link(a.horseId, a.horseName)}</td><td>${e(a.comment || "—")}</td><td>${a.representative ? b("result", "代表赛事", a.representative) : ""}</td></tr>`).join("")}</tbody></table></div>${pagination("officeMainPage", "awards", history)}`}`; return true;
      }
      return false;
    }
    async function annualEdit(id, year) {
      const h = horse(id), r = year === years() ? { ...h.annual, wtr: W.rating(h) } : await c.store.get("ratings", c.world.id, `${year}:${id}`);
      if (!r) throw new Error("此年没有年度档案。");
      const history = await c.store.scanPage("revisions", c.world.id, { index: "byYear", range: [c.world.id, year], reverse: true, filter: (v) => v.horseId === id });
      modal(`${h.name} · 第${year}年评价`, `<p>年度TF ${show(r.tf)} · 已核准赛事最高 ${show(r.suggested)} · 有效WTR ${show(r.wtr)}</p><form data-form="annualScore" data-id="${e(id)}" data-year="${year}">${input("score", "人工年度WTR（留空取消覆盖）", r.manual, "number")}<button>保存此年评价</button>${b("annualAuto", "取消年度覆盖", id, `data-year="${year}"`)}</form><p>修改仅影响此年评价；不改变既有报名、赛果、奖金和已颁奖项。</p><h3>最近评分修订</h3>${history.rows.map((r) => `<p>${e(new Date(r.changedAt).toLocaleString())} · ${r.kind === "annual" ? "年度WTR" : "赛事分"} ${show(r.before)} → ${show(r.after)}</p>`).join("") || "暂无修订"}`, { key: `annual:${id}:${year}`, render: () => annualEdit(id, year) });
    }
    function previousRun(p) {
      if (!p) return '首次出赛';
      const name = p.raceClass === 'op' && c.world.worldSystemVersion!==2 ? e(p.raceName) : b('result', p.raceName, p.occurrenceId, 'class="cm-link"');
      return `<div>${name}</div><div>${p.retired ? '退赛' : `${p.rank}／${p.count ?? '—'}名`} · WTR ${p.manualRating == null ? '未核准' : show(p.manualRating)}</div><details><summary>前走详情</summary>${date(p.turn)} · ${e(p.raceClass.toUpperCase())} · ${e(p.surface)} ${p.distance}米 · TF ${show(p.tf)} · ${e(p.marginLabel || '')}</details>`;
    }
    async function resultDetail(id, offset = 0) {
      detail = { kind: "result", id, offset };
      const r = await c.store.get("occurrences", c.world.id, id), result = await c.store.query("performances", c.world.id, { occurrenceId: id, offset, limit: 50 }), draft = await c.store.get("scoreDrafts", c.world.id, id);
      if (!r || r.raceClass === 'op' && c.world.worldSystemVersion!==2) throw new Error('普通赛在后台运行，请查看马匹简要履历。');
      if(r.status==='cancelled'){
        modal(`${r.name} · ${date(r.turn)}`,`<p>${e(r.race.grade)} · ${e(r.race.surfaceRegion)} · ${e(r.race.trackName)} · ${e(r.race.surface)} ${r.race.distance}米${r.race.courseProfile?" · "+e(ns.ChairmanWorld.courseLabel(r.race.courseProfile)):""}</p><p>本届取消：不足两匹合法参赛马。保留当届举办地记录，不产生冠军或人工评分。</p>${b('raceArchive','赛事档案',r.raceId)}`,{key:`result:${id}`,render:()=>resultDetail(id,offset)});return;
      }
      if(c.world.worldSystemVersion===2&&!['g1','g2','g3'].includes(r.raceClass)){
        modal(`${r.name} · ${date(r.turn)}`,`<p>${e(r.race.grade)} · ${e(r.race.surfaceRegion)} · ${e(r.race.trackName)} · ${e(r.race.surface)} ${r.race.distance}米${r.race.courseProfile?" · "+e(ns.ChairmanWorld.courseLabel(r.race.courseProfile)):""} · ${r.status==='completed'?'已完成':'取消：不足两匹参赛'}</p><div class="cm-table-wrap"><table><thead><tr><th>名次</th><th>赛马</th><th>TF</th><th>差距</th><th>骑手</th><th>奖金万</th></tr></thead><tbody>${result.rows.map(p=>`<tr><td>${p.retired?'退赛':p.rank}</td><td>${link(p.horseId,p.horseName)}</td><td>${show(p.tf)}</td><td>${e(p.marginLabel)}</td><td>${e(p.jockeyName)}</td><td>${p.prize}</td></tr>`).join('')}</tbody></table></div><p>人工赛事评分仅用于G1、G2、G3。</p>${b('raceArchive','赛事档案',r.raceId)}`,{key:`result:${id}`,render:()=>resultDetail(id,offset)});return;
      }
      const previous = new Map(await Promise.all(result.rows.map(async p => [p.id, await c.store.previousPerformance(c.world.id, p)])));
      const all = (await c.store.query('performances',c.world.id,{occurrenceId:id,limit:Number.MAX_SAFE_INTEGER})).rows;
      const anchorId=draft?.benchmarkId || r.wtrBenchmark?.horseId || r.tfBenchmarkId || all.find(p=>p.rank===1)?.horseId;
      const delta=r.scaleOffset??ns.ChairmanRatings.getRatingScaleOffset(c.world.ratingSeed??c.world.seed,id);
      const anchor=all.find(p=>p.horseId===anchorId), base=ns.ChairmanRatings.integer(draft?.benchmarkScore??r.wtrBenchmark?.score??(anchor?.tf==null ? null : ns.ChairmanRatings.integer(anchor.tf)-delta));
      modal(`${r.name} · ${date(r.turn)}`, `<div class="cm-detail-meta" aria-label="比赛摘要"><span class="cm-badge">${e(r.race.grade)}</span> ${e(r.race.surfaceRegion)} · ${e(r.race.trackName || '')} · ${e(r.race.surface)} ${r.race.distance}米${r.race.courseProfile?" · "+e(ns.ChairmanWorld.courseLabel(r.race.courseProfile)):""} · ${badge(r)}</div>
      <h3 class="cm-score-section-title">推荐设置</h3><form data-form="wtrBenchmark" data-id="${e(id)}" class="cm-actions">${select('benchmarkId','基准马',all.filter(p=>!p.retired).map(p=>[p.horseId,p.horseName]),anchorId)}${input('benchmarkScore','WTR基准分',base,'number')}<button>生成推荐</button>${UI.more('<p>采用TF参考基准：以基准马的TF估算推荐分；整场默认草稿：自动选择基准并填入默认建议。都不会直接改变已核准评分。</p>'+b('useTfBenchmark','采用TF参考基准',id)+b('defaultWtrDraft','生成整场默认草稿',id),'其他推荐方式')}<small>本场参考：TF－${delta}</small></form>
      <div class="cm-score-summary">已核准 ${all.filter(p=>!p.retired&&p.manualRating!=null).length} / ${all.filter(p=>!p.retired).length} 匹 · 推荐与草稿需要核准后才生效</div><h3 class="cm-score-section-title">评分列表 · 调整与比较</h3><div class="cm-table-wrap"><table class="cm-score-table" data-table="scores" data-name-column="1" data-primary-columns="0,1,2,3,4,5"><thead><tr><th>名次</th><th>马名</th><th>前走成绩／WTR</th><th>本场TF</th><th>推荐WTR</th><th>编辑WTR</th><th>距胜马</th><th>骑手</th><th>奖金万</th></tr></thead><tbody>${result.rows.map(p=>`<tr data-row-id="${e(p.id)}"><td>${p.retired?'退赛':p.rank}</td><td>${link(p.horseId,p.horseName)}</td><td class="cm-previous-run">${previousRun(previous.get(p.id))}</td><td>${show(p.tf)}</td><td>${show(draft?.recommendations?.[p.id])}</td><td>${p.retired?'—':`<input type="number" step="1" data-draft="${e(id)}" data-performance="${e(p.id)}" aria-label="${e(p.horseName)}赛事分" value="${e(Object.hasOwn(draft?.values||{},p.id)?draft.values[p.id]:p.manualRating)}"><small>${draft?.touched?.[p.id]?'已调整 · ':''}已核准 ${show(p.manualRating)}</small>${b('saveOneScore','核准此马',p.id,`data-race="${e(id)}"`)}`}</td><td>${e(p.marginLabel)}</td><td>${e(p.jockeyName)}</td><td>${p.prize}</td></tr>`).join('')}</tbody></table></div>
      <div class="cm-actions">${offset?b('resultPage','上一页成绩',id,`data-offset="${offset-50}"`):''}${result.more?b('resultPage','更多成绩',id,`data-offset="${offset+50}"`):''}</div>
      <div class="cm-sticky-actions">${b('saveRaceScores','核准本场评分',id,'class="cm-primary"')}${UI.more(b('replaceRecommendations','重新生成全部推荐',id)+b('resetRaceScores','重拟评分',id)+b('raceArchive','赛事档案',r.raceId),'评分操作')}</div><p class="cm-draft-state" role="status" aria-live="polite">${draft?'草稿已保存 · 待核准':all.some(p=>p.manualRating!=null)?'评分已核准':'编辑后自动保存草稿 · 核准后生效'}</p>`,{key:`result:${id}`,render:()=>resultDetail(id,offset)});
    }
    function trend(rows) {
      const data = [...rows].sort((a, b) => a.year - b.year), vals = data.flatMap((r) => [r.wtr, r.tf]).filter((v) => v != null);
      if (!vals.length) return "<p>尚无可绘制的年度评价。</p>";
      const min = Math.min(...vals) - 5, max = Math.max(...vals) + 5, first = data[0].year, last = data.at(-1).year;
      const x = (r) => 35 + (r.year - first) / Math.max(1, last - first) * 520, y = (v) => 150 - (v - min) / (max - min) * 125;
      return `<figure class="cm-trend"><svg viewBox="0 0 590 190" role="img" aria-label="本页年度WTR和TF趋势；缺失年份不连接"><path d="M30 15V155H570" fill="none" stroke="#718199"/>${["wtr", "tf"].map((key, k) => data.map((r, i) => {
        if (r[key] == null) return ""; const prev = data[i - 1], color = k ? "#e4bc7a" : "#93c6ff";
        return `${prev && prev.year + 1 === r.year && prev[key] != null ? `<line x1="${x(prev)}" y1="${y(prev[key])}" x2="${x(r)}" y2="${y(r[key])}" stroke="${color}"/>` : ""}<circle cx="${x(r)}" cy="${y(r[key])}" r="4" fill="${color}"><title>第${r.year}年 ${key.toUpperCase()} ${show(r[key])}</title></circle>`;
      }).join("")).join("")}<text x="30" y="178" fill="#d4e0f2">第${first}年</text><text x="490" y="178" fill="#d4e0f2">第${last}年</text></svg><figcaption>蓝：WTR · 金：TF；对应下表本页年份，缺失值留空。</figcaption></figure>`;
    }
    async function horseDetail(id, offset = 0, view = "overview") {
      const h = horse(id); if (h?.status === "juvenile" && !["pedigree", "children", ...(ns.ChairmanEditor?.enabled(c.world)?["real"]:[])].includes(view)) view = "pedigree"; if (!h) throw new Error("马匹不存在。"); if(view==="real"&&!ns.ChairmanEditor?.project(c.world,h).real)view="overview";detail = { kind: "horse", id, offset, view };
      const key = `horse_${id}`, p = c.world.ui[key] || {};
      const young = h.status === "juvenile", views = young ? [["pedigree", "血统"], ["children", "后代"]] : [["overview", "概况"], ["records", "赛绩"], ["ratings", "年度评价"], ["honors", "荣誉"], ...(c.world.breeding ? [["pedigree", "血统"], ["children", "后代"]] : [])];
      if(ns.ChairmanEditor?.project(c.world,h).real)views.push(["real","真实参数"]);
      let html = `<div class="cm-detail-meta">${W.ageOf(c.world, h)}岁 ${e(h.gender)} · ${e(h.homeRegion)} · ${e(h.owner)} · ${young ? "幼驹" : h.status === "active" ? "现役" : "退役"}</div>${young ? "" : `<div class="cm-horse-metrics"><span><small>本年WTR</small><strong>${show(W.rating(h))}</strong></span><span><small>TF</small><strong>${show(h.annual.tf)}</strong></span><span><small>生涯G1</small><strong>${h.lifetime.g1}</strong></span><span><small>胜／出赛</small><strong>${h.lifetime.wins} / ${h.lifetime.starts}</strong></span><span><small>奖金万</small><strong>${h.lifetime.prize.toFixed(1)}</strong></span></div>`}<div class="cm-tabs">${views.map(([v, label]) => b("horseView", label, id, `data-view="${v}" ${v === view ? 'aria-current="page"' : ""}`)).join("")}</div>`;
      if(c.world.worldSystemVersion===2)html+=`<p>参赛资格：${['未胜利','1胜级','2胜级','3胜级','公开级'][h.qualification]}${h.initialQualification!=null?'（含开局资格；开局不虚构赛绩）':''} · 生成来源：${e(ns.ChairmanWorld.region(c.world,h.generationRegionId)?.name||h.homeRegion)} · 当前所在地：${e(h.locationRegion)}</p>${ns.ChairmanEditor?.enabled(c.world)?b('world:qualification','修改参赛资格',id):''}`;
      html += ns.ChairmanEditor?.enabled(c.world)?`<div class="cm-actions">${UI.more(b('worldEditHorse','编辑马匹',id)+b('worldEditHistory','修改记录'),'世界编辑')}${h.editedByWorld?'<small>经世界编辑</small>':''}</div>`:'';
      html += (h.seriesTarget?'<p>挑战'+e(h.seriesTarget.name)+' · '+h.seriesTarget.wins+'/'+h.seriesTarget.total+'冠</p>':'');
      if(view==="real")html+=ns.ChairmanApp.editorReal(h);
      else if (["pedigree", "children"].includes(view)) { html += await ns.ChairmanApp.breedingContent(id, view, offset); } else if (view === "overview") {
        html += `<div class="cm-detail-meta">${h.annual.manual == null ? "赛事分汇总" : "人工年度覆盖"} · 已核准赛事最高 ${show(h.annual.suggested)}</div>${b("annualEdit", "编辑本年评价", id, `data-year="${years()}"`)}${h.origin === "custom" ? `<details><summary>自建参数</summary><dl class="cm-attributes">${ns.ChairmanCSV.schema("horse").filter((f) => f.key !== "id").map((f) => `<div><dt>${e(f.label)}</dt><dd>${show(f.key === "breedingStrength" ? h.breeding?.strength ?? h.breedingStrength : f.key.split(".").reduce((o, k) => o?.[k], h))}</dd></div>`).join("")}</dl></details>${b("editHorse", "编辑自建参数", id)}` : '<span class="cm-muted">'+(ns.ChairmanEditor?.enabled(c.world)?'真实参数可查看':'属性未公开')+'</span>'}${UI.more(b('contentExportFamily','导出家族模板包',id)+(h.status==='active'?b('retire','勒令退役',id,'data-danger'):''),'马匹操作',h.name+' · 马匹操作')}`;
        const bg=h.background;
        html += `<p>后台普通赛：${bg?.starts||0}战${bg?.wins||0}胜 · 奖金${(bg?.prize||0).toFixed(1)}万 · 最近TF ${show(bg?.lastTf)}</p><p>目标：${e(c.world.races.find(r=>r.id===h.target?.raceId)?.name||'观察中')} ${h.target?date(h.target.turn):''} · ${e(h.target?.reason||'积累参赛表现')}</p><p>下场：${e(c.world.races.find(r=>r.id===h.booked?.raceId)?.name||'待安排')} ${h.booked?date(h.booked.turn):''}</p>`;
        const runs = h.annual.runs || [], groups = {};
        for (const r of runs) { const name = `${r.surface} · ${W.category(r.distance)}`; const g = groups[name] || (groups[name] = [0, 0]); g[0]++; if (r.rank === 1) g[1]++; }
        html += `<h3>本年公开表现样本</h3>${Object.entries(groups).map(([k, v]) => `<p>${e(k)}：${v[1]}胜／${v[0]}次出赛</p>`).join("") || "尚无样本"}<p>仅为已观察战绩，不代表真实适性。</p>`;
      } else if (view === "ratings") {
        const result = await c.store.scanPage("ratings", c.world.id, { index: "byHorseYear", range: window.IDBKeyRange.bound([c.world.id, id, 1], [c.world.id, id, Number.MAX_SAFE_INTEGER]), reverse: true, offset });
        html += trend(result.rows) + `<div class="cm-table-wrap"><table><thead><tr><th>年份</th><th>WTR / TF</th><th>胜／出赛</th><th>G1</th><th>奖金</th><th>编辑</th></tr></thead><tbody>${result.rows.map((r) => `<tr><td>第${r.year}年</td><td>${show(r.wtr)} / ${show(r.tf)}</td><td>${r.wins} / ${r.starts}</td><td>${r.g1}</td><td>${r.prize}</td><td>${b("annualEdit", "修改此年WTR", id, `data-year="${r.year}"`)}</td></tr>`).join("")}</tbody></table></div>${pagination("horseDetailPage", id, result)}`;
      } else {
        const honors = view === "honors";
        const result = await c.store.scanPage("performances", c.world.id, { index: "byHorseTurn", range: window.IDBKeyRange.bound([c.world.id, id, 0], [c.world.id, id, Number.MAX_SAFE_INTEGER]), reverse: true, offset,
          filter: (r) => (c.world.worldSystemVersion===2||r.raceClass !== "op") && (honors ? r.rank === 1 && r.raceClass === "g1" : (!p.year || r.year === Number(p.year)) && (r.raceName || "").includes(p.search || "") && O.matches(p.region, r.regionId||r.surfaceRegion) && O.matches(p.surface, r.surface) && O.matches(p.category, W.category(r.distance)) && O.matches(p.raceClass, r.raceClass) && (!p.distance || r.distance === Number(p.distance))) });
        html += honors ? "<h3>全部G1胜利</h3>" : filterForm(key, p, "records");
        html += `<div class="cm-table-wrap"><table><thead><tr><th>日期</th><th>赛事</th><th>名次</th><th>TF</th><th>人工赛事分</th><th></th></tr></thead><tbody>${result.rows.map((r) => `<tr><td>${date(r.turn)}</td><td>${b("result", r.raceName, r.occurrenceId, 'class="cm-link"')}</td><td>${r.retired ? "退赛" : r.rank}</td><td>${show(r.tf)}</td><td>${show(r.manualRating)}</td><td>${b("result", c.world.worldSystemVersion===2&&!ns.ChairmanWorld.graded(r)?"查看结果":"评分", r.occurrenceId)}</td></tr>`).join("") || '<tr><td colspan="6">暂无记录</td></tr>'}</tbody></table></div>`;
        html += pagination("horseDetailPage", id, result);
        if (honors) {
          html+='<h3>连冠系列</h3>'+((h.seriesTitles||[]).map(t=>'<p>第'+t.year+'年 · '+b('seriesDetail',t.title,t.seriesId)+' · '+t.bonus+'万 · 荣誉权重'+t.honorWeight+'</p>').join('')||'尚无系列称号');
          const awards = await c.store.scanPage("awards", c.world.id, { index: "byHorseYear", range: window.IDBKeyRange.bound([c.world.id, id, 1], [c.world.id, id, Number.MAX_SAFE_INTEGER]), reverse: true, offset: p.awardOffset || 0 });
          const induction = ns.ChairmanHonors?.profile(c.world, id)?.induction;
          html += `${induction ? `<h3>中央殿堂</h3><p>第${induction.year}年 · ${induction.method === 'vote' ? '评议核准' : '主席特批'} · ${e(induction.comment)}</p>` : ''}<h3>年度奖项</h3>${awards.rows.map((a) => `<p>第${a.year}年 ${e(a.scope && a.scope !== 'central' ? a.associationName : '中央马会')} · ${e(a.name)} · ${e(a.comment || "")}</p>`).join("")}${pagination("horseAwardPage", id, awards)}`;
        }
      }
      modal(h.name, html, { key: `horse:${id}`, render: () => horseDetail(id, offset, view) });
    }
    async function archive(id, offset = 0, track = false) {
      detail = { kind: track ? "track" : "race", id, offset };
      const definition = (track ? c.world.tracks : c.world.races).find((r) => r.id === id);
      if (!definition) throw new Error("没有对应档案。");
      const rows = await c.store.historyPage(c.world, { hidden: "all" }, offset, track ? { trackId: id, g1: true } : { raceId: id });
      const winners = await Promise.all(rows.rows.map((r) => c.store.query("performances", c.world.id, { occurrenceId: r.id, limit: 1 })));
      let intro = track ? `<p>${e(definition.region)} · ${e(definition.surfaces.join("／"))}</p>${b("trackRaces", "查看当前赛事", id)}` : `<p>${definition.deleted ? "已停止举办" : `未来定义：${definition.month}月${definition.half === 1 ? "上" : "下"}半月 · ${e(definition.surface)} ${definition.distance}米 · ${e(definition.grade)}`}</p>${!definition.deleted ? b("editRace", "编辑未来赛事", id) : ""}`;
      if(!track&&c.world.worldSystemVersion===2){const actual=await c.store.raceEdition(c.world,definition,years()),next=ns.ChairmanWorld.resolveRace(c.world,definition,years()+1);intro+=`<p>本届：${e(actual.trackName)} · ${e(actual.courseName)} · ${e(actual.surfaceRegion)} · ${e(ns.ChairmanWorld.courseLabel(actual.courseProfile))}。${actual.venueMode==='cycle'?'年度轮换':'固定举办'}；下届预计：${e(next.trackName)} · ${e(ns.ChairmanWorld.courseLabel(next.courseProfile))}。</p><p>${e(definition.sourceRecord?.reason||definition.sourceNote||'玩家自建赛事')} ${e(definition.prizeSource||'游戏奖金')}</p>`;}
      if (!track && definition.raceClass === "op" && c.world.worldSystemVersion!==2) { modal(definition.name, intro + "<p>后台普通赛，成绩计入马匹简要履历。</p>"); return; }
      intro += `<h3>${track ? "在此举办的历史G1" : "历届比赛"}</h3>${rows.rows.map((r, i) => { const winner = winners[i].rows[0]; return `<article class="cm-card"><p>${date(r.turn)} · ${e(r.name)} · ${e(r.race.trackName || "")} · ${e(r.race.surface)} ${r.race.distance}米${r.race.courseProfile?" · "+e(ns.ChairmanWorld.courseLabel(r.race.courseProfile)):""} · ${r.count}匹</p><p>${r.status === "cancelled" ? "取消举办" : winner?.rank === 1 ? `冠军 ${link(winner.horseId, winner.horseName)}` : "无完赛冠军"}</p>${r.status === "completed" ? b("result", "查看该届", r.id) : ""}</article>`; }).join("")}${pagination("archivePage", id, rows)}`;
      modal(definition.name, intro, { key: `archive:${id}`, render: () => archive(id, offset, track) });
    }
    async function chooseAward(id, offset = 0, search = c.world.ui.awardSearch?.[id] || "") {
      const a = W.AWARDS.find((v) => v.id === id); detail = { kind: "award", id, offset, search };
      const rows = c.world.horses.filter((h) => W.awardEligible(c.world, h, a, c.world.awardsStrict) && h.name.includes(search)).sort((a, b) => (W.rating(b) ?? -Infinity) - (W.rating(a) ?? -Infinity) || b.annual.g1 - a.annual.g1 || b.annual.prize - a.annual.prize || a.id.localeCompare(b.id));
      offset = rows.length && offset >= rows.length ? Math.floor((rows.length - 1) / 50) * 50 : offset; detail.offset = offset;
      const ballot = c.world.honors?.latest[`central:${id}`];
      if (ballot) rows.sort((a, b) => (ballot.tallies[b.id] || 0) - (ballot.tallies[a.id] || 0));
      const chosen = horse(c.world.awardDraft[id]), d = (c.world.awardDetails || {})[id] || {};
      modal(a.name, `<p>当前：${chosen ? e(chosen.name) : "空缺"}</p>${b("pickAward", "设为空缺", "", `data-award="${id}"`)}<form data-form="candidateSearch" data-id="${id}" class="cm-actions">${input("search", "搜索候选马", search)}<button>搜索</button></form><div class="cm-table-wrap"><table><thead><tr><th>候选马</th><th>WTR / TF</th><th>G1</th><th>胜／出赛</th><th>奖金万</th><th>G1胜利</th><th>支持率</th><th></th></tr></thead><tbody>${rows.slice(offset, offset + 50).map((h) => `<tr><td>${link(h.id, h.name)}</td><td>${show(W.rating(h))} / ${show(h.annual.tf)}</td><td>${h.annual.g1}</td><td>${h.annual.wins} / ${h.annual.starts}</td><td>${h.annual.prize.toFixed(1)}</td><td><details><summary>查看名单</summary>${e((h.annual.runs || []).filter((r) => r.raceClass === "g1" && r.rank === 1).map((r) => r.name).join("、") || "无")}</details></td><td>${ballot?.totalUnits ? ((ballot.tallies[h.id] || 0) / ballot.totalUnits * 100).toFixed(2) + "%" : "—"}</td><td>${b("pickAward", "选择", h.id, `data-award="${id}"`)}</td></tr>`).join("")}</tbody></table></div>${pagination("candidatePage", id, { offset, total: rows.length, more: offset + 50 < rows.length })}${chosen ? `<form data-form="awardDetail" data-id="${id}">${input("comment", "评语（自动保存）", d.comment || "")}${select("representative", "代表赛事（自动保存）", [["", "不指定"], ...(chosen.annual.runs || []).map((r) => [r.id, r.name])], d.representative || "")}<button>保存评语与代表赛事</button><p class="cm-award-state" role="status"></p></form>` : ""}`, { key: `award:${id}`, render: () => chooseAward(id, offset, search) });
    }
    async function flush() {
      clearTimeout(timer);
      if (!c.world || !c.store.writable) return;
      const savingScores=pending.size>0||!!c.dialog.querySelector('[data-form="wtrBenchmark"][data-dirty]');
      try {
      for (const [id, values] of [...pending]) { await c.commit(await c.store.draftOutput(c.world, id, values)); if (pending.get(id) === values) pending.delete(id); }
      const state = c.dialog.querySelector(".cm-draft-state"); if (state && savingScores) state.textContent = "草稿已保存 · 待核准";
      const benchmarkForm=c.dialog.querySelector('[data-form="wtrBenchmark"]');
      if(benchmarkForm?.dataset.dirty) {const f=fields(benchmarkForm); await c.commit(await c.store.draftOutput(c.world,benchmarkForm.dataset.id,{}, {benchmarkId:f.benchmarkId,benchmarkScore:O.score(f.benchmarkScore)}));delete benchmarkForm.dataset.dirty;}
      const form = c.dialog.querySelector('[data-form="awardDetail"]');
      if (form?.dataset.dirty) { const d = fields(form), token = form.dataset.dirty; await c.commit(W.edit(c.world, "awards", { draft: c.world.awardDraft, strict: c.world.awardsStrict,
        details: { ...(c.world.awardDetails || {}), [form.dataset.id]: d } })); if (token === form.dataset.dirty) delete form.dataset.dirty; const s = form.querySelector(".cm-award-state"); if (s) s.textContent = "评语与代表赛事已保存。"; }
      }catch(error){const state=c.dialog.querySelector('.cm-draft-state');if(state){state.textContent=`草稿保存失败：${error.message}。当前输入保留，请重试。`;state.insertAdjacentHTML('beforeend',b('retryDraft','重试保存'));}throw error;}
    }
    function changed(target) {
      if (target.dataset.draft) { const id = target.dataset.draft; pending.set(id, { ...(pending.get(id) || {}), [target.dataset.performance]: target.value }); const s = c.dialog.querySelector(".cm-draft-state"); if (s) s.textContent = "正在保存草稿…"; }
      else if (["awardDetail", "wtrBenchmark"].includes(target.form?.dataset.form)) target.form.dataset.dirty = String(Number(target.form.dataset.dirty || 0) + 1);
      else return;
      const saveWhenIdle = () => { if (c.busy) timer = setTimeout(saveWhenIdle, 300); else c.run(async () => {}); };
      clearTimeout(timer); timer = setTimeout(saveWhenIdle, 400);
    }
    async function click(action, id, el) {
      const offset = Number(el?.dataset.offset || 0), w = c.world;
      if (['useTfBenchmark','defaultWtrDraft','replaceRecommendations','confirmReplaceRecommendations'].includes(action)) {
        const form=c.dialog.querySelector('[data-form="wtrBenchmark"]'), f=form?fields(form):detail.recommendFields;
        if(action==='replaceRecommendations') {detail.recommendFields=f;confirmModal('重新生成全部推荐',`<p>将替换本场草稿中的手动调整。已核准评分要在再次保存后才会改变。</p>${b('confirmReplaceRecommendations','替换草稿',id)}`);return true;}
        await c.commit(await c.store.recommendOutput(w,id,action==='defaultWtrDraft'?null:f.benchmarkId,f.benchmarkScore,{useTf:action!=='confirmReplaceRecommendations',replace:action==='confirmReplaceRecommendations'}));
        await resultDetail(id,detail.offset||0);
      } else if (action === "awardView") { await prefs("layout", { ...(w.ui.layout || {}), awards: id }); c.page = 0; await c.render(); }
      else if (action === "annualEdit") await annualEdit(id, Number(el.dataset.year));
      else if (action === "annualAuto") { const year = Number(el.dataset.year), old = year === years() ? null : await c.store.get("ratings", w.id, `${year}:${id}`); await c.commit(O.annualScore(w, id, year, null, old)); await c.render(); await annualEdit(id, year); }
      else if (["saveRaceScores", "saveOneScore"].includes(action)) {
        const occurrenceId = action === "saveOneScore" ? el.dataset.race : id, draft = await c.store.get("scoreDrafts", w.id, occurrenceId);
        const values = action === "saveOneScore" ? { [id]: draft?.values[id] ?? c.dialog.querySelector(`[data-performance="${id}"]`).value } : draft?.values || {};
        const out = await c.store.scoreOutput(w, occurrenceId, values, false);
        if (action === "saveOneScore" && draft) { const remaining = { ...draft.values }; delete remaining[id]; if (Object.keys(remaining).length) { out.deletes = []; out.scoreDrafts = [{ ...draft, values: remaining }]; } }
        await c.commit(out); await c.render(); await resultDetail(occurrenceId, detail.offset);
      } else if (action === "resetRaceScores") confirmModal("重拟本场评分", `<p>清除本场所有人工赛事分及草稿。机器TF、名次、奖金和人工年度WTR覆盖保留。</p>${b("confirmResetScores", "确认重拟", id)}`);
      else if (action === "confirmResetScores") { await c.commit(await c.store.scoreOutput(w, id, {}, true)); await c.render(); await resultDetail(id); }
      else if (action === "latest") { await prefs("results", { ...(w.ui.results || {}), latest: "1" }); c.setTab("results"); c.page = 0; await c.render(); }
      else if (action === "officeMainPage") { c.page = offset / 50; await c.render(); }
      else if (action === "boardKind" || action === "boardExpand") { const p = w.ui.boards || { kind: "current" }; await prefs("boards", action === "boardKind" ? { ...p, kind: id } : { ...p, expanded: !p.expanded }); c.page = 0; await c.render(); }
      else if (action === "officeClear") { await prefs(id, {}); c.page = 0; if (id.startsWith("horse_")) await horseDetail(id.slice(6), 0, "records"); else await c.render(); }
      else if (action === "horseView") { await prefs("layout", { ...(w.ui.layout || {}), horseTab: el.dataset.view }); await horseDetail(id, 0, el.dataset.view); }
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
      else if (action === "hideCancelled") { const rows = await c.store.query("occurrences", w.id, { limit: Number.MAX_SAFE_INTEGER, filter: (r) => r.status === "cancelled" && !r.hidden }); lastScene = rows.rows.map((r) => r.id); confirmModal("隐藏取消届次", `<p>所有年份共${lastScene.length}场取消届次将从正常结果列表隐藏，可通过“仅隐藏”查询并恢复。生涯事实保留。</p>${b("confirmHideCancelled", "确认隐藏")}`); }
      else if (action === "confirmHideCancelled") { await c.commit(await c.store.visibilityOutput(w, lastScene || [], true)); c.dialog.close(); await c.render(); }
      else return false;
      return true;
    }
    async function submit(form) {
      const kind = form.dataset.form, p = fields(form), id = form.dataset.id;
      if (kind === 'wtrBenchmark') { await c.commit(await c.store.recommendOutput(c.world,id,p.benchmarkId,O.score(p.benchmarkScore))); await resultDetail(id,detail.offset||0); }
      else if (kind === "officeFilter") { if(form.dataset.kind==="horses")p.normalSort=["strength","breedingStrength"].includes(p.sort)?c.world.ui.horses?.normalSort||c.world.ui.horses?.sort||"tf":p.sort;await prefs(form.dataset.kind, p); c.page = 0; if (form.dataset.kind.startsWith("horse_")) await horseDetail(form.dataset.kind.slice(6), 0, "records"); else await c.render(); }
      else if (kind === "annualScore") { const year = Number(form.dataset.year); await c.commit(O.annualScore(c.world, id, year, p.score, year === years() ? null : await c.store.get("ratings", c.world.id, `${year}:${id}`))); await c.render(); await annualEdit(id, year); }
      else if (kind === "awardStrict") { await c.commit(W.edit(c.world, "awards", { draft: c.world.awardDraft, strict: !!p.strict })); await c.render(); }
      else if (kind === "awardYear") { await prefs("awards", p); c.page = 0; await c.render(); }
      else if (kind === "candidateSearch") {await prefs("awardSearch",{...c.world.ui.awardSearch,[id]:p.search});await chooseAward(id, 0, p.search);}
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
