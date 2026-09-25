(function () {
  "use strict";
  const ns = window.Keiba, W = ns.ChairmanRules, B = ns.ChairmanBreeding, UI = ns.ChairmanUI;
  const labels = { none: "未留种", candidate: "待用", active: "繁殖中", retired: "繁殖引退", template: "基础资料", juvenile: "幼驹", ancestor: "祖先档案" };
  ns.ChairmanBreedingUI = { create(c) {
    const { escape: e, button: b, input, select, modal } = c;
    const name = (id) => {const h=B.get(c.world,id)||(B.templates(c.world)).find(h=>h.id===id);return h?.displayName||h?.name||h?.originalName||"未记录";};
    const link = (id, text) => id ? b("pedigree", text || name(id), id, 'class="cm-link"') : "未记录";
    const data = (form) => Object.fromEntries(new FormData(form));
    async function prefs(values) { if (c.store.writable) await c.commit(W.edit(c.world, "ui", values)); else Object.assign(c.world.ui, values); }
    const page = (result, action = "breedPage") => `<div class="cm-pagination">${b(action, "上一页", Math.max(0, result.offset - 50), result.offset ? "" : "disabled")}<span>共${result.total}条 · 第${Math.floor(result.offset / 50) + 1}页</span>${b(action, "下一页", result.offset + 50, result.more ? "" : "disabled")}</div>`;
    const sources = [["", "全部"], ["hall", "殿堂引入"], ["historical", "史实基础资料"], ["foundation", "架空始祖"], ["bred", "自动繁殖"], ["external", "外来二岁马"], ["custom", "自建"], ["ai", "随机马"], ["imported", "导入家系"], ["imported-family", "家系引入"] ];
    function rows(result) {
      return `<div class="cm-table-wrap"><table data-table="breeding" data-primary-columns="0,1,4" data-name-column="0"><thead><tr><th>名字</th><th>出生／性别／地区</th><th>父</th><th>母</th><th>来源／状态／实绩评价</th><th>收藏</th></tr></thead><tbody>${result.rows.map((h) => `<tr data-row-id="${e(h.id)}"><td>${link(h.id, h.name)}${h.playerModified?"<small>玩家修改</small>":""}${h.disabled?"<small>已停用</small>":""}${ns.ChairmanEditor?.enabled(c.world)&&h.strength!=null?`<small>能力 ${h.strength} · 配种 ${h.breedingStrength??"—"}</small>`:""}</td><td>${h.source === "hall" ? "殿堂" : h.source === "imported" ? "模板" : h.status === "template" ? "史实" : "游戏"}${h.birthYear == null ? "· 年代未知" : `${h.birthYear}年`} · ${e(h.gender)}<small>${e(h.region)}</small></td><td>${link(h.fatherId)}</td><td>${link(h.motherId)}</td><td>${e(sources.find((s) => s[0] === h.source)?.[1] || h.source)}<small>${e(labels[h.breedingStatus] || labels[h.status] || h.status)} · ${e(h.grade)}${h.assessment?` · ${e(h.assessment.confidence)} · ${h.assessment.starters}匹出赛子代 · ${e(h.assessment.trend)}`:""}</small></td><td>${b("breedFavorite", (c.world.ui.breedingFavorites || []).includes(h.id) ? "★ 已收藏" : "☆ 收藏", h.id)}</td></tr>`).join("")}</tbody></table></div>`;
    }
    async function render(tab) {
      if (tab !== "breeding") return false;
      const w = c.world;
      if (!w.breeding && w.ui.breedingFilter?.view !== "library") {
        c.body.innerHTML = `<h2>血统与世代</h2><p>启用后从当前年份规划配种，次年出生，二岁出道。已有赛马的竞赛参数保持不变，不补造过去亲缘。</p>${b("breedEnable", "启用自动繁殖")}${b("breedView", "基础血统库", "library")}${b("contentImport", "导入血统家族包", "family")}`; return true;
      }
      const p = w.ui.breedingFilter || { view: "active" }, view = p.view || "active";
      let html = `<div class="cm-breeding-nav"><div class="cm-tabs">${[["library", "基础血统库"], ["active", "当前繁殖群"], ["candidate", "待用马"], ["plans", "年度配种"], ["young", "幼驹"], ["boards", "繁殖榜单"], ["families", "母父与母系"], ["report", "年度报告"]].map(([id, label]) => b("breedView", label, id, view === id ? 'aria-current="page"' : "")).join("")}</div>${UI.more(b("breedFoundation", "建立基础繁殖群")+(ns.HallOfFame?.chairmanTemplates?.().some(t=>t.core)?b("breedHallImport","引入殿堂马"):"")+b("contentImport","导入血统家族包","family"))}</div>`;
      if (["families","report"].includes(view)) {html+=await ns.ChairmanBloodlineUI.render(c,view,p);
      } else if (view === "plans") {
        const copy = W.clone(w); let planned = [], error = "";
        try { planned = B.plan(copy); } catch (err) { error = err.message; }
        html += `${UI.toolbar("年度配种", `指定${w.breeding.manual.length}组 · 共${planned.length}组`, b("breedMate", "指定配种", "", 'class="cm-primary"'))}${UI.help("指定优先，同母同年限一驹。父母、母父与祖先共同参与遗传；繁殖素质影响后代分布，但自动选马只参考公开实绩与配合。过近亲缘禁止，允许的远代重复仍有气性风险。年末锁定结果，预览与读档不重抽。")}${error ? `<p class="cm-error">${e(error)}。请修正指定配种后结束年度。</p>${w.breeding.manual.map((p) => `<p>${link(p.fatherId)} × ${link(p.motherId)} ${b("breedCancel", "取消指定", p.motherId)}</p>`).join("")}` : ""}`;
        const offset = Math.min(Number(p.offset) || 0, Math.max(0, Math.floor((planned.length - 1) / 50) * 50));
        html += `<div class="cm-table-wrap"><table><thead><tr><th>父本</th><th>母本</th><th>地区</th><th>安排</th><th></th></tr></thead><tbody>${planned.slice(offset, offset + 50).map((p) => `<tr><td>${B.get(w, p.fatherId) ? link(p.fatherId) : e(B.get(copy, p.fatherId).name)}</td><td>${B.get(w, p.motherId) ? link(p.motherId) : e(B.get(copy, p.motherId).name)}</td><td>${e(p.homeRegion)}</td><td>${p.manual ? '<span class="cm-badge">指定</span>' : "自动"}</td><td>${p.manual ? b("breedCancel", "取消指定", p.motherId) : ""}</td></tr>`).join("")}</tbody></table></div>`;
        html += page({ total: planned.length, offset, more: offset + 50 < planned.length });
      } else if (view === "boards") {
        const year = Number(p.year) || W.date(w.turn).year;
        html += `<form data-form="breedBoard">${input("year", "查询年度", year, "number")}<button>查询年度</button></form>`;
        const annual = year === W.date(w.turn).year ? B.childStats(w, year) : (await c.store.query("breedingYears", w.id, { year, limit: Number.MAX_SAFE_INTEGER })).rows.sort((a, b) => b.prize - a.prize);
        const board = w.ui.layout?.breedingBoard || "sire", boards = [["sire", "种牡马年度", annual.filter((h) => h.gender === "牡马")], ["dam", "繁殖牝马年度", annual.filter((h) => h.gender === "牝马")], ["lifetime", "种牡马历代", B.childStats(w).filter((h) => h.gender === "牡马")]];
        html += UI.tabs(boards.map(([id, name]) => [id, name]), board, "breedBoardKind", b);
        html += `<div class="cm-table-wrap"><table><thead><tr><th>排名</th><th>繁殖马</th><th>子代奖金万</th><th>获胜／出赛子代</th></tr></thead><tbody>${(boards.find(([id]) => id === board) || boards[0])[2].slice(0, 10).map((h, i) => `<tr><td>${i + 1}</td><td>${link(h.horseId || h.id, h.name)} ${h.champion ? '<span class="cm-badge">冠军种马</span>' : ""}</td><td>${h.prize.toFixed(1)}</td><td>${h.winners} / ${h.starters}</td></tr>`).join("") || '<tr><td colspan="4">暂无出赛子代</td></tr>'}</tbody></table></div>`;
      } else {
        const result = B.query(w, { ...p, view });
        html += `<form data-form="breedFilter" class="cm-filters">${input("search", "名字 / 别名 / 编号", p.search || "")}${ns.ChairmanEditor?.enabled(w)&&view!=="library"?select("sort","排序",[["","名称"],["strength","真实能力"],["breedingStrength","繁殖素质"]],p.sort||""):""}${select("letter","首字母筛选",[["","全部字母"],...result.letters],p.letter||"")}${select("alphabet", "首字母", [["original", "原名"], ["pinyin", "中文拼音"]], p.alphabet || "original")}${select("gender", "性别", [["", "全部"], "牡马", "牝马", "骟马"], p.gender || "")}${select("region", "地区", [["", "全部"], ...W.regionNames(w)], p.region || "")}${input("decade", "出生年代（例如1980）", p.decade || "", "number")}${select("source", "来源", sources, p.source || "")}${select("grade", "公开实绩评价", [["", "全部"], "较低", "普通", "良好", "优秀", "顶级", "尚待子代验证", "未公开"], p.grade || "")}${select("status", "生命周期", [["", "全部"], ["active", "竞赛中"], ["retired", "竞赛退役"], ["juvenile", "幼驹"], ["ancestor", "祖先"]], p.status || "")}${select("breedingStatus", "繁殖状态", [["", "按当前视图"], ["all", "全部档案"], ...Object.entries(labels).filter(([k]) => ["none", "active", "candidate", "retired"].includes(k))], p.breedingStatus || "")}${[ ["favorites", "收藏"], ["recent", "最近查看"], ["used", "最近配种"]].map(([key, label]) => `<label class="cm-check"><input type="checkbox" name="${key}" value="1" ${p[key] ? "checked" : ""}>${label}</label>`).join("")}<button>查询并保存筛选</button>${b("breedClear", "清除筛选")}</form>`;

        html += result.total ? rows(result) + page(result) : `<div class="cm-empty">${view === "young" ? "尚无幼驹。完成年度配种并封存本年后可查看新生幼驹。" : view === "candidate" ? "当前没有待用马。可从马匹档案查看退役马的繁殖状态，或建立基础繁殖群。" : "当前条件下没有记录。请调整筛选并应用，或从基础血统库引入个体。"}</div>`;
      }
      c.body.innerHTML = html; return true;
    }
    function tree(id, level = 0, library = false, childSide = null) {
      const depth = 3 - level, ancestors = [];
      const templates = B.templates(c.world);
      const get = key => library ? templates.find(v=>v.id===key) : B.get(c.world,key);
      const lineLabels=new Map(ns.BloodlineCatalog.lines.map(l=>[l.id,l.label]));
      const node = (key, path) => {const h=get(key),g=h?.genetics||ns.BloodlineCatalog.assignments.find(a=>a.id===h?.id)?.genetics;return {id:h?.id||null,name:h?.displayName||h?.name||h?.originalName||'未知',path,broodmareSire:childSide==='motherId'&&path==='父',lineLabel:lineLabels.get(g?.lineId)||(g?.lineId?.startsWith('fictional:')?'架空家系':null),factors:g?.factors||[]};};
      function walk(key,path) {
        const h=get(key);
        for(const [field,suffix] of [['fatherId','父'],['motherId','母']]) {
          const next=path+suffix;ancestors.push(node(h?.[field],next));
          if(next.length<depth)walk(h?.[field],next);
        }
      }
      walk(id,'');
      return ns.PedigreeTree.render({key:`chairman:${c.world.id}:${library?'library':'world'}:${id}:${level}`,root:node(id,''),ancestors,depth,nameHtml:a=>link(a.id,a.name)});
    }

    const relations = new Map();
    async function content(id, view = "pedigree", offset = 0) {
      const w = c.world, t = (B.templates(c.world)).find((h) => h.id === id), raw = B.get(w, id), h = raw ? B.publicHorse(w, raw) : t;
      if (!h) throw new Error("此亲缘尚未核实，资料未收录。");
      const relation = relations.get(id) || "direct";
      let html = "";
      if (view === "children" && raw) {
        html += `<div class="cm-tabs">${[["direct", "直接子代"], ["paternal", "父系后裔"], ["maternal", "母系后裔"], ["all", "全部后代"]].map(([r, text]) => b("breedDescendants", text, id, `data-relation="${r}" ${r === relation ? 'aria-current="page"' : ""}`)).join("")}</div>`;
        const result = B.query(w, { ancestor: id, relation, offset });
        html += rows(result) + page(result, "breedChildPage").replaceAll('data-action="breedChildPage"', `data-action="breedChildPage" data-horse="${e(id)}" data-relation="${e(relation)}"`);
        const children = B.descendants(w, id, "direct"), active = w.horses.filter((h) => children.has(h.id));
        html += '<details class="cm-help"><summary>优秀子代</summary><div class="cm-award-grid">';
        for (const [title, getter] of [["本年WTR前十", W.rating], ["历代WTR前十", (h) => Math.max(h.breeding?.bestWtr ?? -Infinity, W.rating(h) ?? -Infinity)]]) html += `<section><h3>${title}</h3>${active.filter((h) => getter(h) != null && Number.isFinite(getter(h))).sort((a, b) => getter(b) - getter(a)).slice(0, 10).map((h) => `<p>${link(h.id)} · ${ns.ChairmanRatings.integer(getter(h))}</p>`).join("") || "暂无评分"}</section>`;
        return html + '</div></details>';
      }
      html += `<div class="cm-toolbar"><div>${raw?.breeding ? `${e(labels[h.breedingStatus])} · 实绩评价 ${e(h.grade)}${h.breedingStrength != null ? `（素质${h.breedingStrength}，稳定度${h.breedingStability??"—"}）` : ""} · 冠军种马 ${h.championYears.length}次` : "基础血统资料"}</div>${UI.more((ns.ChairmanEditor?.enabled(w)?(raw?b("worldEditHorse","编辑马匹",id)+b("worldEditReal","真实参数",id):t?.source==="hall"?"":b("worldEditTemplate","编辑库资料",id)):"")+b("contentExportFamily","导出家族模板包",id)+b("breedFavorite", (w.ui.breedingFavorites || []).includes(id) ? "★ 已收藏" : "☆ 收藏", id) + (raw && B.available(w, raw) ? b("breedPin", h.pinned ? "取消指定保留" : "指定保留", id) + b("breedRetire", "勒令繁殖引退", id) : "") + (t?.core&&!t.disabled ? b("breedIntroduce", "引入世界（预览）", id) : ""))}</div>${raw?.preHallCareer?.summary?`<details class="cm-help"><summary>殿堂引入前履历：${h.preHallCareer.summary.starts}战${h.preHallCareer.summary.wins}胜 · 一级赛${h.preHallCareer.summary.gradeOneWins}胜</summary><div class="cm-table-wrap"><table><thead><tr><th>时间</th><th>赛事</th><th>结果</th></tr></thead><tbody>${(h.preHallCareer.races||[]).slice().reverse().map(r=>`<tr><td>${e(r.public?.timeLabel||"—")}</td><td>${e(r.hidden?.race?.name||r.race?.name||"未知赛事")}</td><td>${e(r.public?.rankLabel||"着外")}</td></tr>`).join("")||'<tr><td colspan="3">暂无赛绩</td></tr>'}</tbody></table></div></details>`:""}${raw&&h.assessment?`<p>实绩评价：${e(h.grade)} · ${e(h.assessment.confidence)} · ${e(h.assessment.trend)} · 出赛子代${h.assessment.starters}匹，未出赛${h.assessment.unraced}匹。子代表现${e(h.assessment.consistency)}，受配偶及竞赛环境影响。</p>`:""}${tree(id, 0, !!t)}<details class="cm-help"><summary>资料与来源</summary><p>${e(h.originalName || h.name)} · ${e((h.aliases || []).join("、"))}</p><p>编号 ${e(h.id)} · ${raw ? (raw.sourceKind === "hall" ? "殿堂引入" : "游戏") : "史实"}${h.birthYear}年出生 · ${e(h.gender)}</p>${raw?.historicalBirthYear ? `<p>史实出生年 ${raw.historicalBirthYear}</p>` : ""}${h.sourceUrl && /^https:\/\/www\.jbis\.(jp|or\.jp)\/horse\/\d+\//.test(h.sourceUrl) ? `<a href="${e(h.sourceUrl)}" target="_blank" rel="noopener">JBIS来源资料</a>` : ""}</details>`;
      if(t?.playerModified)html+='<small>玩家修改；原始来源资料仅供对照。</small>';if(t&&ns.ChairmanEditor?.enabled(w))html+=`<details><summary>生成预设（未来引入）</summary><p>配种基准 ${e(t.game?.breedingBase??'默认')} · 参考距离 ${e(t.game?.distance??'随机')} · ${e(t.game?.surface||'默认场地')} · ${e(t.game?.growthType||'随机成长')}</p></details>`; return html;
    }
    async function detail(id, offset = 0, relation = "direct", view = "pedigree") {
      relations.set(id, relation);
      await prefs({ breedingRecent: [...new Set([id, ...(c.world.ui.breedingRecent || [])])].slice(0, 30) });
      if (c.world.horses.some((h) => h.id === id)) return ns.ChairmanApp.horseDetail(id, offset, view);
      const h = B.get(c.world, id) || (B.templates(c.world)).find((h) => h.id === id);
      modal(h?.displayName || h?.name || h?.originalName || "血统档案", `<div class="cm-tabs">${b("pedigree", "血统", id)}${B.get(c.world, id) ? b("breedDescendants", "后代", id, 'data-relation="direct"') : ""}</div>${await content(id, view, offset)}`, { key: `pedigree:${id}`, render: () => detail(id, offset, relation, view) });
    }
    function parentFields(form, values = {}) {
      for (const key of ["fatherId", "motherId"]) {
        const el = form.elements[key]; if (!el) continue;
        const gender = key === "fatherId" ? "牡马" : "牝马", listId = `breed-options-${key}`;
        if (form.dataset.form === "breedMating") {
          el.insertAdjacentHTML("beforebegin", `<input type="search" data-parent-search="${key}" aria-label="搜索${gender}亲本" placeholder="搜索名字 / 别名 / 编号"><select name="${key}" aria-label="选择${gender}亲本" required></select><small data-parent-count="${key}" role="status"></small>`);
          el.remove();
          form.elements[key].addEventListener("change", () => previewParents(form));
          fillParent(form, key, "", gender);
          const current = B.get(c.world, values[key]);
          if (current && B.available(c.world, current)) {
            if (![...form.elements[key].options].some(o => o.value === current.id)) form.elements[key].insertAdjacentHTML("beforeend", `<option value="${e(current.id)}">${e(current.name)} · ${e(current.id)}</option>`);
            form.elements[key].value = current.id;
          }
          continue;
        }
        el.setAttribute("list", listId); el.setAttribute("aria-label", key === "fatherId" ? "父马编号" : "母马编号");
        el.insertAdjacentHTML("afterend", `<input type="search" data-parent-search="${key}" aria-label="搜索${gender}亲本" placeholder="搜索名字 / 别名 / 编号"><datalist id="${listId}"></datalist>`);
        fillParent(form, key, "", gender);
      }
      (form.querySelector('.cm-editor-group:last-of-type') || form).insertAdjacentHTML("beforeend", '<details open><summary>当前三代血统预览</summary><div class="cm-parent-preview"></div></details>');
      previewParents(form);
    }
    function fillParent(form, key, search, gender) {
      if (form.dataset.form === "breedMating") {
        const field = form.elements[key], selected = field.value;
        const result = B.query(c.world, { search, gender, matingEligible: true, limit: 50 });
        const rows = [...result.rows], current = B.get(c.world, selected);
        if (current && B.available(c.world, current) && !rows.some(h => h.id === selected)) rows.unshift(B.publicHorse(c.world, current));
        field.innerHTML = `<option value="">请选择${gender === "牡马" ? "父马" : "母马"}</option>` + rows.map(h => `<option value="${e(h.id)}">${e(h.name)} · ${W.ageOf(c.world, h)}岁 · ${e(h.region)} · ${e(h.id)}</option>`).join("");
        field.value = selected;
        form.querySelector(`[data-parent-count="${key}"]`).textContent = result.total ? `找到${result.total}匹可配种亲本${result.more ? "，显示前50匹，请继续输入筛选" : ""}；选择后才会加入配种。` : "没有符合条件的亲本。可先退役赛马，或从基础血统库引入／建立基础繁殖群。";
        return;
      }
      const source = form.dataset.form === "horse" ? B.query(c.world, { view: "library", instantiable: true, search, gender, limit: 25 }).rows : [];
      const result = B.query(c.world, { search, gender, limit: source.length ? 25 : 50 });
      form.querySelector(`#breed-options-${key}`).innerHTML = result.rows.map((h) => `<option value="${e(h.id)}">${e(h.name)} · 游戏${h.birthYear}年 · ${e(h.region)}</option>`).join("") + source.map((h) => `<option value="template:${e(h.id)}">基础资料：${e(h.name)} · 史实${h.birthYear}年 · ${e(h.region)}</option>`).join("");
    }
    function previewParents(form) { const el = form.querySelector(".cm-parent-preview"); if (el) {el.innerHTML = ["fatherId", "motherId"].map((key) => `<p>${key === "fatherId" ? "父" : "母"}：${link(String(form.elements[key]?.value || "").replace(/^template:/, ""))}</p>${tree(String(form.elements[key]?.value || "").replace(/^template:/, ""), 1, String(form.elements[key]?.value || "").startsWith("template:"),key)}`).join("");const f=form.elements.fatherId?.value,m=form.elements.motherId?.value;
      if(c.world.breeding?.version>=2&&B.get(c.world,f)&&B.get(c.world,m)){try{const p=ns.ChairmanGenetics.publicPair(c.world,f,m);el.innerHTML=`<p>父马：${e(p.father.grade)} · ${e(p.father.confidence)} · ${p.father.starters}匹出赛子代</p><p>母马：${e(p.mother.grade)} · ${e(p.mother.confidence)} · ${p.mother.starters}匹出赛子代</p><p>${e(p.notes.join('；')||'暂无额外配合')} · 亲缘${e(p.risk.level)}</p>${p.legal?'':`<p class="cm-error">${e(p.reason)}</p>`}`+el.innerHTML;ns.PedigreeTree.highlight(el,p.sourceIds);}catch(error){el.innerHTML='<p>'+e(error.message)+'</p>'+el.innerHTML;}}
    }}
    function changed(el) {
      if (el.dataset.parentSearch) fillParent(el.form, el.dataset.parentSearch, el.value, el.dataset.parentSearch === "fatherId" ? "牡马" : "牝马");
      if (["fatherId", "motherId"].includes(el.name)) previewParents(el.form);
    }
    function matingForm(values = {}) {
      let form;
      modal("指定配种", `<form data-form="breedMating">${input("fatherId", "父马", "")}${input("motherId", "母马", "")}${select("homeRegion", "幼驹地区", W.regionNames(c.world), values.homeRegion || "日本")}${input("owner", "幼驹马主（空白随母）", values.owner || "")}<p>搜索后在下拉列表选择亲本。仅列出已竞赛退役、年满3岁且未繁殖引退的马；母马须未满22岁，父马须未满25岁。同母已有指定将被替换，近亲关系在保存时校验。</p><button>保存指定配种</button></form>`, { key: "breedMating", form: true, render: () => matingForm(data(form)) });
      form = c.dialog.querySelector("form");
      parentFields(form, values);
    }
    async function click(action, id, el) {
      const w = c.world, p = w.ui.breedingFilter || { view: "active" };
      if (action === "breedFamilyPage") { const [key,offset]=id.split(":");await prefs({breedingFilter:{...p,offsets:{...p.offsets,[key]:Number(offset)||0}}});await c.render(); }
      else if (action === "breedBoardKind") { await prefs({ layout: { ...(w.ui.layout || {}), breedingBoard: id } }); await c.render(); }
      else if (action === "pedigree") await detail(id);
      else if (action === "breedEnable") {
        const ratings = {}; let offset = 0, result;
        do { result = await c.store.query("ratings", w.id, { offset, limit: 50 }); for (const r of result.rows) (ratings[r.horseId] ||= {})[r.year] = { wtr: r.wtr, tf: r.tf }; offset += 50; } while (result.more);
        await c.commit(B.edit(w, "enable", { ratings })); await c.render();
      }
      else if (["breedView", "breedPage", "breedLetter", "breedClear"].includes(action)) { await prefs({ breedingFilter: action === "breedClear" ? { view: p.view } : { ...p, ...(action === "breedView" ? { view: id, offset: 0 } : action === "breedPage" ? { offset: Number(id) } : { letter: id, offset: 0 }) } }); await c.render(); }
      else if (action === "breedFavorite") { const favorites = new Set(w.ui.breedingFavorites || []); favorites.has(id) ? favorites.delete(id) : favorites.add(id); await prefs({ breedingFavorites: [...favorites] }); el.textContent = favorites.has(id) ? "★ 已收藏" : "☆ 收藏"; }
      else if (action === "breedDescendants" || action === "breedChildPage") await detail(action === "breedChildPage" ? el.dataset.horse : id, action === "breedChildPage" ? Number(id) : 0, el.dataset.relation, "children");
      else if (action === "breedPin" || action === "breedRetire") { await c.commit(B.edit(w, action === "breedPin" ? "pin" : "retire", { id })); await detail(id); }
      else if (action === "breedCancel") { await c.commit(B.edit(w, "cancelMating", { id })); await c.render(); }
      else if (action === "breedFoundation" || action === "breedIntroduce") modal(action === "breedFoundation" ? "建立基础繁殖群" : "引入基础个体", `<form data-form="${action}">${input("templateId", "资料编号", id || "")}${select("region", "引入地区", W.regionNames(w), "日本")}${action === "breedFoundation" ? select("source", "来源包", [["", "按地区参考环境"], ...W.REGIONS, ["mixed", "混合"]], "") : ""}<p>引入年龄为8～14岁，祖先共享已有身份。同一资料只实例化一次，年代或亲缘冲突将阻止引入。</p><button>预览具体名单</button></form>`);
      else if (action === "breedHallImport") {
        const choices = (ns.HallOfFame?.chairmanTemplates?.() || []).filter(t => t.core && !t.disabled);
        if (!choices.length) throw new Error("当前殿堂没有可引入的赛马。");
        modal("引入殿堂赛马", `<form data-form="breedHallImport">${select("templateId", "殿堂赛马", choices.map(t => [t.id, `${t.displayName} · ${t.gender}`]), choices[0].id)}${select("region", "引入地区", W.regionNames(w), "日本")}<p>殿堂赛马以已退役繁殖马进入世界；出生能力、适性与血统按殿堂档案保存，并附带引入前生涯记录。</p><button>预览具体名单</button></form>`);
      }
      else if (action === "breedMate") matingForm();
      else if (action === "breedApplyCreation") { if (!creation || creation.base !== w.revision) throw new Error("世界已变化，请重新预览。"); await c.commit(creation.out); creation = null; c.dialog.close(); await c.render(); }
      else if (action === "breedApplyIntroduction") { if (!introduction || introduction.base !== w.revision) throw new Error("世界已变化，请重新预览。"); await c.commit(introduction.out); introduction = null; c.dialog.close(); await c.render(); }
      else return false;
      return true;
    }
    let introduction = null, creation = null;
    function previewCreation(out) {
      creation = { base: c.world.revision, out }; const old = new Set(B.all(c.world).map((h) => h.id));
      modal("基础亲本引入预览", `<p>以下资料将成为世界内个体。父母关联使用世界编号，已有档案复用。</p>${B.all(out.world).filter((h) => !old.has(h.id) && h.breeding).slice(0, 50).map((h) => `<p>${e(h.name)} · ${W.ageOf(out.world, h)}岁 · ${e(h.id)} · 父${e(B.get(out.world, h.fatherId)?.name || "未记录")} / 母${e(B.get(out.world, h.motherId)?.name || "未记录")}</p>`).join("")}${b("breedApplyCreation", "保存自建马及亲缘")}`);
    }
    async function submit(form) {
      const kind = form.dataset.form, p = data(form), w = c.world;
      if (kind === "breedFilter") { p.normalSort=["strength","breedingStrength"].includes(p.sort)?w.ui.breedingFilter?.normalSort??"":p.sort||"";await prefs({ breedingFilter: { view: w.ui.breedingFilter?.view || "active", ...p, offset: 0 } }); await c.render(); }
      else if (kind === "breedBoard") { await prefs({ breedingFilter: { view: w.ui.breedingFilter?.view === "report" ? "report" : "boards", year: p.year } }); await c.render(); }
      else if (kind === "breedMating") { await c.commit(B.edit(w, "mating", p)); c.dialog.close(); await c.render(); }
      else if (kind === "breedFoundation" || kind === "breedIntroduce" || kind === "breedHallImport") {
        const out = B.edit(w, kind === "breedFoundation" ? "foundation" : "introduce", p), before = new Set(B.all(w).map((h) => h.id)), added = B.all(out.world).filter((h) => !before.has(h.id));
        introduction = { base: w.revision, out }; modal("确认引入名单", `<p>将新增${added.length}个个体及祖先档案。已有同来源个体复用，不恢复年轻。</p>${added.filter((h) => h.breeding).slice(0, 50).map((h) => `<p>${e(h.name)} · ${W.ageOf(w, h)}岁 · 父${e(B.get(out.world, h.fatherId)?.name || "未记录")} / 母${e(B.get(out.world, h.motherId)?.name || "未记录")}</p>`).join("")}${b("breedApplyIntroduction", "保存引入结果")}`);
      } else return false;
      return true;
    }
    return { render, detail, content, click, submit, parentFields, changed, previewCreation };
  } };
})();
