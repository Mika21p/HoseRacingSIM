(function () {
  "use strict";
  const ns = window.Keiba, W = ns.ChairmanRules, B = ns.ChairmanBreeding, UI = ns.ChairmanUI;
  const labels = { none: "未留种", candidate: "待用", active: "繁殖中", retired: "繁殖引退", template: "基础资料", juvenile: "幼驹", ancestor: "祖先档案" };
  ns.ChairmanBreedingUI = { create(c) {
    const { escape: e, button: b, input, select, modal } = c;
    const name = (id) => B.get(c.world, id)?.name || ns.ChairmanPedigrees.records.find((h) => h.id === id)?.originalName || "未记录";
    const link = (id, text) => id ? b("pedigree", text || name(id), id, 'class="cm-link"') : "未记录";
    const data = (form) => Object.fromEntries(new FormData(form));
    async function prefs(values) { if (c.store.writable) await c.commit(W.edit(c.world, "ui", values)); else Object.assign(c.world.ui, values); }
    const page = (result, action = "breedPage") => `<div class="cm-pagination">${b(action, "上一页", Math.max(0, result.offset - 50), result.offset ? "" : "disabled")}<span>共${result.total}条 · 第${Math.floor(result.offset / 50) + 1}页</span>${b(action, "下一页", result.offset + 50, result.more ? "" : "disabled")}</div>`;
    const sources = [["", "全部"], ["historical", "史实基础资料"], ["foundation", "架空始祖"], ["bred", "自动繁殖"], ["external", "外来二岁马"], ["custom", "自建"], ["ai", "随机马"]];
    function rows(result) {
      return `<div class="cm-table-wrap"><table><thead><tr><th>名字</th><th>出生／性别／地区</th><th>父</th><th>母</th><th>来源／状态／配种档位</th><th>收藏</th></tr></thead><tbody>${result.rows.map((h) => `<tr><td>${link(h.id, h.name)}</td><td>${h.status === "template" ? "史实" : "游戏"}${h.birthYear}年 · ${e(h.gender)}<small>${e(h.region)}</small></td><td>${link(h.fatherId)}</td><td>${link(h.motherId)}</td><td>${e(sources.find((s) => s[0] === h.source)?.[1] || h.source)}<small>${e(labels[h.breedingStatus] || labels[h.status] || h.status)} · ${e(h.grade)}</small></td><td>${b("breedFavorite", (c.world.ui.breedingFavorites || []).includes(h.id) ? "★ 已收藏" : "☆ 收藏", h.id)}</td></tr>`).join("")}</tbody></table></div>`;
    }
    async function render(tab) {
      if (tab !== "breeding") return false;
      const w = c.world;
      if (!w.breeding) {
        c.body.innerHTML = `<h2>血统与世代</h2><p>启用后从当前年份规划配种，次年出生，二岁出道。已有赛马的竞赛参数保持不变，不补造过去亲缘。</p>${b("breedEnable", "启用自动繁殖")}`; return true;
      }
      const p = w.ui.breedingFilter || { view: "active" }, view = p.view || "active";
      let html = `<div class="cm-breeding-nav"><div class="cm-tabs">${[["library", "基础血统库"], ["active", "当前繁殖群"], ["candidate", "待用马"], ["plans", "年度配种"], ["young", "幼驹"], ["boards", "繁殖榜单"]].map(([id, label]) => b("breedView", label, id, view === id ? 'aria-current="page"' : "")).join("")}</div>${UI.more(b("breedFoundation", "建立基础繁殖群"))}</div>`;
      if (view === "plans") {
        const copy = W.clone(w); let planned = [], error = "";
        try { planned = B.plan(copy); } catch (err) { error = err.message; }
        html += `${UI.toolbar("年度配种", `指定${w.breeding.manual.length}组 · 共${planned.length}组`, b("breedMate", "指定配种", "", 'class="cm-primary"'))}${UI.help("指定优先；同母同年限一驹。预览不消耗随机数，年末锁定。超过目标的指定配种全部保留。")}${error ? `<p class="cm-error">${e(error)}。请修正指定配种后结束年度。</p>${w.breeding.manual.map((p) => `<p>${link(p.fatherId)} × ${link(p.motherId)} ${b("breedCancel", "取消指定", p.motherId)}</p>`).join("")}` : ""}`;
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
        html += `<form data-form="breedFilter" class="cm-filters">${input("search", "名字 / 别名 / 编号", p.search || "")}${select("alphabet", "首字母", [["original", "原名"], ["pinyin", "中文拼音"]], p.alphabet || "original")}${select("gender", "性别", [["", "全部"], "牡马", "牝马", "骟马"], p.gender || "")}${select("region", "地区", [["", "全部"], ...W.regionNames(w)], p.region || "")}${input("decade", "出生年代（例如1980）", p.decade || "", "number")}${select("source", "来源", sources, p.source || "")}${select("grade", "公开配种档位", [["", "全部"], "较低", "普通", "良好", "优秀", "顶级", "未公开"], p.grade || "")}${select("status", "生命周期", [["", "全部"], ["active", "竞赛中"], ["retired", "竞赛退役"], ["juvenile", "幼驹"], ["ancestor", "祖先"]], p.status || "")}${select("breedingStatus", "繁殖状态", [["", "按当前视图"], ["all", "全部档案"], ...Object.entries(labels).filter(([k]) => ["none", "active", "candidate", "retired"].includes(k))], p.breedingStatus || "")}${[ ["favorites", "收藏"], ["recent", "最近查看"], ["used", "最近配种"]].map(([key, label]) => `<label class="cm-check"><input type="checkbox" name="${key}" value="1" ${p[key] ? "checked" : ""}>${label}</label>`).join("")}<button>查询并保存筛选</button>${b("breedClear", "清除筛选")}</form>`;
        html += `<div class="cm-letter-index">${b("breedLetter", "全部字母")}${result.letters.map((l) => b("breedLetter", l, l, p.letter === l ? 'aria-current="page"' : "")).join("")}</div>`;
        html += rows(result) + page(result);
      }
      c.body.innerHTML = html; return true;
    }
    function tree(id, level = 0, library = false) {
      const cells = [], depth = 3 - level, height = 2 ** depth;
      function walk(parent, col, row, span, path) {
        const h = library ? ns.ChairmanPedigrees.records.find((v) => v.id === parent) : B.get(c.world, parent);
        for (const [i, key] of ["fatherId", "motherId"].entries()) { const at = row + i * span / 2, label = path + (i ? "母" : "父");
          cells.push(`<div class="cm-pedigree-cell cm-lineage-${at < height / 2 ? "father" : "mother"}" style="grid-column:${col};grid-row:${at + 1}/span ${span / 2}"><small>${label}</small>${link(h?.[key])}</div>`);
          if (col < depth) walk(h?.[key], col + 1, at, span / 2, label);
        }
      }
      walk(id, 1, 0, height, ""); return `<div class="cm-pedigree-grid" style="--generations:${depth}">${cells.join("")}</div>`;
    }
    const relations = new Map();
    async function content(id, view = "pedigree", offset = 0) {
      const w = c.world, t = ns.ChairmanPedigrees.records.find((h) => h.id === id), raw = B.get(w, id), h = raw ? B.publicHorse(w, raw) : t;
      if (!h) throw new Error("此亲缘尚未核实，资料未收录。");
      const relation = relations.get(id) || "direct";
      let html = "";
      if (view === "children" && raw) {
        html += `<div class="cm-tabs">${[["direct", "直接子代"], ["paternal", "父系后裔"], ["maternal", "母系后裔"], ["all", "全部后代"]].map(([r, text]) => b("breedDescendants", text, id, `data-relation="${r}" ${r === relation ? 'aria-current="page"' : ""}`)).join("")}</div>`;
        const result = B.query(w, { ancestor: id, relation, offset });
        html += rows(result) + page(result, "breedChildPage").replaceAll('data-action="breedChildPage"', `data-action="breedChildPage" data-horse="${e(id)}" data-relation="${e(relation)}"`);
        const children = B.descendants(w, id, "direct"), active = w.horses.filter((h) => children.has(h.id));
        html += '<details class="cm-help"><summary>优秀子代</summary><div class="cm-award-grid">';
        for (const [title, getter] of [["本年WTR前十", W.rating], ["历代WTR前十", (h) => Math.max(h.breeding?.bestWtr ?? -Infinity, W.rating(h) ?? -Infinity)]]) html += `<section><h3>${title}</h3>${active.filter((h) => getter(h) != null && Number.isFinite(getter(h))).sort((a, b) => getter(b) - getter(a)).slice(0, 10).map((h) => `<p>${link(h.id)} · ${getter(h)}</p>`).join("") || "暂无评分"}</section>`;
        return html + '</div></details>';
      }
      html += `<div class="cm-toolbar"><div>${raw?.breeding ? `${e(labels[h.breedingStatus])} · 配种实力 ${e(h.grade)}${h.breedingStrength != null ? `（自建值${h.breedingStrength}）` : ""} · 冠军种马 ${h.championYears.length}次` : "基础血统资料"}</div>${UI.more(b("breedFavorite", (w.ui.breedingFavorites || []).includes(id) ? "★ 已收藏" : "☆ 收藏", id) + (raw && B.available(w, raw) ? b("breedPin", h.pinned ? "取消指定保留" : "指定保留", id) + b("breedRetire", "勒令繁殖引退", id) : "") + (t?.core ? b("breedIntroduce", "引入世界（预览）", id) : ""))}</div>${tree(id, 0, !!t)}<details class="cm-help"><summary>资料与来源</summary><p>${e(h.originalName || h.name)} · ${e((h.aliases || []).join("、"))}</p><p>编号 ${e(h.id)} · ${raw ? "游戏" : "史实"}${h.birthYear}年出生 · ${e(h.gender)}</p>${raw?.historicalBirthYear ? `<p>史实出生年 ${raw.historicalBirthYear}</p>` : ""}${h.sourceUrl && /^https:\/\/www\.jbis\.(jp|or\.jp)\/horse\/\d+\//.test(h.sourceUrl) ? `<a href="${e(h.sourceUrl)}" target="_blank" rel="noopener">JBIS来源资料</a>` : ""}</details>`;
      return html;
    }
    async function detail(id, offset = 0, relation = "direct", view = "pedigree") {
      relations.set(id, relation);
      await prefs({ breedingRecent: [...new Set([id, ...(c.world.ui.breedingRecent || [])])].slice(0, 30) });
      if (c.world.horses.some((h) => h.id === id)) return ns.ChairmanApp.horseDetail(id, offset, view);
      const h = B.get(c.world, id) || ns.ChairmanPedigrees.records.find((h) => h.id === id);
      modal(h?.displayName || h?.name || h?.originalName || "血统档案", `<div class="cm-tabs">${b("pedigree", "血统", id)}${B.get(c.world, id) ? b("breedDescendants", "后代", id, 'data-relation="direct"') : ""}</div>${await content(id, view, offset)}`, { key: `pedigree:${id}`, render: () => detail(id, offset, relation, view) });
    }
    function parentFields(form, values = {}) {
      for (const key of ["fatherId", "motherId"]) {
        const el = form.elements[key]; if (!el) continue;
        const gender = key === "fatherId" ? "牡马" : "牝马", listId = `breed-options-${key}`;
        el.setAttribute("list", listId); el.setAttribute("aria-label", key === "fatherId" ? "父马编号" : "母马编号");
        el.insertAdjacentHTML("afterend", `<input type="search" data-parent-search="${key}" aria-label="搜索${gender}亲本" placeholder="搜索名字 / 别名 / 编号"><datalist id="${listId}"></datalist>`);
        fillParent(form, key, "", gender);
      }
      (form.querySelector('.cm-editor-group:last-of-type') || form).insertAdjacentHTML("beforeend", '<details open><summary>当前三代血统预览</summary><div class="cm-parent-preview"></div></details>');
      previewParents(form);
    }
    function fillParent(form, key, search, gender) {
      const source = form.dataset.form === "horse" ? B.query(c.world, { view: "library", instantiable: true, search, gender, limit: 25 }).rows : [];
      const result = B.query(c.world, { search, gender, limit: source.length ? 25 : 50 });
      form.querySelector(`#breed-options-${key}`).innerHTML = result.rows.map((h) => `<option value="${e(h.id)}">${e(h.name)} · 游戏${h.birthYear}年 · ${e(h.region)}</option>`).join("") + source.map((h) => `<option value="template:${e(h.id)}">基础资料：${e(h.name)} · 史实${h.birthYear}年 · ${e(h.region)}</option>`).join("");
    }
    function previewParents(form) { const el = form.querySelector(".cm-parent-preview"); if (el) el.innerHTML = ["fatherId", "motherId"].map((key) => `<p>${key === "fatherId" ? "父" : "母"}：${link(String(form.elements[key]?.value || "").replace(/^template:/, ""))}</p>${tree(String(form.elements[key]?.value || "").replace(/^template:/, ""), 1, String(form.elements[key]?.value || "").startsWith("template:"))}`).join(""); }
    function changed(el) {
      if (el.dataset.parentSearch) fillParent(el.form, el.dataset.parentSearch, el.value, el.dataset.parentSearch === "fatherId" ? "牡马" : "牝马");
      if (["fatherId", "motherId"].includes(el.name)) previewParents(el.form);
    }
    async function click(action, id, el) {
      const w = c.world, p = w.ui.breedingFilter || { view: "active" };
      if (action === "breedBoardKind") { await prefs({ layout: { ...(w.ui.layout || {}), breedingBoard: id } }); await c.render(); }
      else if (action === "pedigree") await detail(id);
      else if (action === "breedEnable") {
        const ratings = {}; let offset = 0, result;
        do { result = await c.store.query("ratings", w.id, { offset, limit: 50 }); for (const r of result.rows) (ratings[r.horseId] ||= {})[r.year] = r.wtr; offset += 50; } while (result.more);
        await c.commit(B.edit(w, "enable", { ratings })); await c.render();
      }
      else if (["breedView", "breedPage", "breedLetter", "breedClear"].includes(action)) { await prefs({ breedingFilter: action === "breedClear" ? { view: p.view } : { ...p, ...(action === "breedView" ? { view: id, offset: 0 } : action === "breedPage" ? { offset: Number(id) } : { letter: id, offset: 0 }) } }); await c.render(); }
      else if (action === "breedFavorite") { const favorites = new Set(w.ui.breedingFavorites || []); favorites.has(id) ? favorites.delete(id) : favorites.add(id); await prefs({ breedingFavorites: [...favorites] }); el.textContent = favorites.has(id) ? "★ 已收藏" : "☆ 收藏"; }
      else if (action === "breedDescendants" || action === "breedChildPage") await detail(action === "breedChildPage" ? el.dataset.horse : id, action === "breedChildPage" ? Number(id) : 0, el.dataset.relation, "children");
      else if (action === "breedPin" || action === "breedRetire") { await c.commit(B.edit(w, action === "breedPin" ? "pin" : "retire", { id })); await detail(id); }
      else if (action === "breedCancel") { await c.commit(B.edit(w, "cancelMating", { id })); await c.render(); }
      else if (action === "breedFoundation" || action === "breedIntroduce") modal(action === "breedFoundation" ? "建立基础繁殖群" : "引入基础个体", `<form data-form="${action}">${input("templateId", "资料编号", id || "")}${select("region", "引入地区", W.regionNames(w), "日本")}${action === "breedFoundation" ? select("source", "来源包", [["", "按地区参考环境"], ...W.REGIONS, ["mixed", "混合"]], "") : ""}<p>引入年龄为8～14岁，祖先共享已有身份。同一资料只实例化一次，年代或亲缘冲突将阻止引入。</p><button>预览具体名单</button></form>`);
      else if (action === "breedMate") { modal("指定配种", `<form data-form="breedMating">${input("fatherId", "父马编号", "")}${input("motherId", "母马编号", "")}${select("homeRegion", "幼驹地区", W.regionNames(w), "日本")}${input("owner", "幼驹马主（空白随母）", "")}<p>搜索后选择稳定编号；同母已有指定将被替换。近亲关系与年龄在保存时校验。</p><button>保存指定配种</button></form>`); parentFields(c.dialog.querySelector("form")); }
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
      if (kind === "breedFilter") { await prefs({ breedingFilter: { view: w.ui.breedingFilter?.view || "active", ...p, offset: 0 } }); await c.render(); }
      else if (kind === "breedBoard") { await prefs({ breedingFilter: { view: "boards", year: p.year } }); await c.render(); }
      else if (kind === "breedMating") { await c.commit(B.edit(w, "mating", p)); c.dialog.close(); await c.render(); }
      else if (kind === "breedFoundation" || kind === "breedIntroduce") {
        const out = B.edit(w, kind === "breedFoundation" ? "foundation" : "introduce", p), before = new Set(B.all(w).map((h) => h.id)), added = B.all(out.world).filter((h) => !before.has(h.id));
        introduction = { base: w.revision, out }; modal("确认引入名单", `<p>将新增${added.length}个个体及祖先档案。已有同来源个体复用，不恢复年轻。</p>${added.filter((h) => h.breeding).slice(0, 50).map((h) => `<p>${e(h.name)} · ${W.ageOf(w, h)}岁 · 父${e(B.get(out.world, h.fatherId)?.name || "未记录")} / 母${e(B.get(out.world, h.motherId)?.name || "未记录")}</p>`).join("")}${b("breedApplyIntroduction", "保存引入结果")}`);
      } else return false;
      return true;
    }
    return { render, detail, content, click, submit, parentFields, changed, previewCreation };
  } };
})();
