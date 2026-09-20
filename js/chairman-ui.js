(function () {
  "use strict";
  const ns = window.Keiba;
  const e = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const more = (html, label = "更多") => `<details class="cm-more"><summary>${e(label)}</summary><div class="cm-menu">${html}</div></details>`;
  const help = (text) => `<details class="cm-help"><summary>说明</summary><p>${e(text)}</p></details>`;
  const toolbar = (title, count, actions = "") => `<div class="cm-toolbar"><h2>${e(title)}${count == null ? "" : `<small>${e(count)}</small>`}</h2><div class="cm-actions">${actions}</div></div>`;
  const tabs = (items, active, action, button) => `<div class="cm-tabs">${items.map(([id, name]) => button(action, name, id, id === active ? 'aria-current="page"' : "")).join("")}</div>`;
  let layout = {}, remember = () => {};
  function useLayout(value, save) { layout = value || {}; remember = save; }
  function node(tag, cls, text) { const el = document.createElement(tag); if (cls) el.className = cls; if (text != null) el.textContent = text; return el; }
  function enhanceFilters(form) {
    if (form.dataset.compact) return; form.dataset.compact = "true";
    const kind = form.dataset.kind || (form.dataset.form === "breedFilter" ? "breeding" : ""), fields = [...form.children].filter((v) => v.tagName === "LABEL");
    const common = kind === "horses" ? ["search", "status", "region", "sort"] : kind === "calendar" ? ["search", "month", "half", "region", "raceClass"] : kind === "results" ? ["search", "year", "region", "scoring"] : kind === "breeding" ? ["search", "region", "gender"] : kind.startsWith("horse_") ? ["search", "year"] : ["search", "region", ...(kind === "board_history" ? ["year"] : [])];
    const main = node("div", "cm-filter-main"), advanced = node("details", "cm-filter-advanced"), summary = node("summary", "", "更多筛选"), grid = node("div", "cm-filter-grid"), chips = node("div", "cm-filter-chips");
    advanced.append(summary, grid);
    advanced.open = !!layout.filters?.[kind];
    advanced.addEventListener("toggle", () => { if (advanced.isConnected && advanced.open !== !!layout.filters?.[kind]) remember({ filters: { ...(layout.filters || {}), [kind]: advanced.open } }); });
    const originals = new Map(fields.map((label) => { const el = label.querySelector("input,select"); return [el, el?.tagName === "SELECT" && el.multiple ? [...el.options].map((o) => o.selected) : el?.type === "checkbox" ? el.checked : el?.value]; }));
    const sync = new Map();
    const restoreAdvanced = () => { for (const [el, value] of originals) if (el && !common.includes(el.name)) { if (el.tagName === "SELECT" && el.multiple) [...el.options].forEach((o, i) => o.selected = value[i]); else if (el.type === "checkbox") el.checked = value; else el.value = value; sync.get(el)?.(); } };
    const primarySubmit = () => { restoreAdvanced(); form.requestSubmit(); };
    const originalButtons = [...form.children].filter((v) => v.tagName === "BUTTON");
    for (const other of [...form.children]) if (!fields.includes(other) && !originalButtons.includes(other)) other.remove();
    for (const label of fields) {
      const el = label.querySelector("input,select"), key = el?.name;
      if (!el) continue;
      label.dataset.field = key;
      const caption = label.firstChild.textContent.trim().replace(/（可多选）/, "");
      if (el.tagName === "SELECT" && el.multiple) {
        const menu = node("details", "cm-multi"), title = node("summary"), options = node("div", "cm-multi-options");
        menu.append(title, options); label.replaceWith(menu); menu.dataset.field = key;
        el.hidden = true; menu.append(el);
        function refresh() { const selected = [...el.selectedOptions]; title.textContent = `${caption}：${selected.length ? selected.map((o) => o.textContent).join("、") : "全部"}`; }
        for (const option of el.options) {
          const choice = node("label", "cm-check"), checkbox = document.createElement("input"); checkbox.type = "checkbox"; checkbox.checked = option.selected;
          checkbox.setAttribute("aria-label", `${caption}：${option.textContent}`);
          checkbox.addEventListener("change", () => { option.selected = checkbox.checked; refresh(); if (common.includes(key)) primarySubmit(); });
          choice.append(checkbox, document.createTextNode(option.textContent)); options.append(choice);
        }
        sync.set(el, () => { [...options.querySelectorAll("input")].forEach((c, i) => c.checked = el.options[i].selected); refresh(); });
        refresh(); (common.includes(key) ? main : grid).append(menu);
      } else {
        (common.includes(key) ? main : grid).append(label);
        if (common.includes(key) && (el.tagName === "SELECT" || el.type === "checkbox" || el.type === "number")) el.addEventListener("change", primarySubmit);
      }
      const values = el.tagName === "SELECT" ? [...el.selectedOptions].filter((o) => o.value !== "").map((o) => [o.value, o.textContent]) : el.type === "checkbox" ? el.checked ? [[el.value, label.textContent.trim()]] : [] : el.value ? [[el.value, el.value]] : [];
      if (key === "sort" || key === "alphabet" || key === "status" && el.value === "active") continue;
      for (const [value, text] of values) {
        const chip = node("button", "cm-chip", `${caption}：${text} ×`); chip.type = "button";
        chip.setAttribute("aria-label", `移除${key}筛选：${text}`);
        chip.addEventListener("click", () => { restoreAdvanced(); if (el.tagName === "SELECT" && el.multiple) [...el.options].find((o) => o.value === value).selected = false; else if (el.type === "checkbox") el.checked = false; else el.value = ""; form.requestSubmit(); }); chips.append(chip);
      }
    }
    const search = node("button", "", "搜索"); search.type = "button"; search.addEventListener("click", primarySubmit); main.append(search);
    const apply = originalButtons.find((b) => !b.dataset.action); if (apply) { apply.textContent = "应用"; grid.append(apply); }
    for (const b of originalButtons.filter((b) => b.dataset.action)) { b.textContent = "清除"; main.append(b); }
    const count = [...grid.querySelectorAll('input[name],select[name]')].filter((el) => el.name !== "alphabet" && (el.type === "checkbox" ? el.checked : el.value !== "")).length;
    summary.textContent = `更多筛选${count ? ` · ${count}` : ""}`;
    const mobile = node("button", "cm-mobile-filters", "筛选"); mobile.type = "button"; mobile.setAttribute("aria-expanded", "false");
    mobile.addEventListener("click", () => { const open = form.classList.toggle("cm-filters-open"); mobile.setAttribute("aria-expanded", String(open)); });
    form.append(mobile, main, advanced, chips); if (!chips.children.length) chips.hidden = true;
    form.querySelector('input[name="search"]')?.addEventListener("keydown", (event) => { if (event.key === "Enter" && !event.isComposing) { event.preventDefault(); primarySubmit(); } });
  }
  function enhanceTables(scope) {
    for (const table of scope.querySelectorAll("table")) {
      if (table.dataset.enhanced) continue; table.dataset.enhanced = "true";
      const headings = [...table.querySelectorAll("thead th")].map((v) => v.textContent);
      for (const row of table.querySelectorAll("tbody tr")) [...row.cells].forEach((cell, i) => {
        cell.dataset.label = headings[i] || "";
        if (/排名|名次|WTR|TF|G1|赏金|奖金|胜|匹数|报名|年龄/.test(headings[i] || "")) { cell.classList.add("cm-num"); table.querySelectorAll("thead th")[i]?.classList.add("cm-num"); }
      });
      if (table.classList.contains("cm-score-table")) {
        for (const row of table.querySelectorAll("tbody tr")) { const toggle = node("button", "cm-row-toggle", "详情"); toggle.type = "button"; toggle.setAttribute("aria-expanded", "false"); toggle.addEventListener("click", () => { const open = row.classList.toggle("cm-row-open"); toggle.setAttribute("aria-expanded", String(open)); toggle.textContent = open ? "收起" : "详情"; }); row.cells[1]?.append(toggle); }
      } else {
        table.classList.add("cm-responsive-table");
        for (const row of table.querySelectorAll("tbody tr")) {
          if (row.cells.length <= 3) continue;
          const key = [...row.cells].find((cell) => cell.querySelector('[data-action="horse"],[data-action="pedigree"],[data-action="raceArchive"],[data-action="result"]')) || row.cells[0];
          key.classList.add("cm-row-name");
          [...row.cells].forEach((cell) => { if (cell !== key && !/WTR|TF|名次|排名|配种档位|评分状态/.test(cell.dataset.label)) cell.classList.add("cm-row-secondary"); });
          const toggle = node("button", "cm-row-toggle", "展开"); toggle.type = "button"; toggle.setAttribute("aria-expanded", "false");
          toggle.addEventListener("click", () => { const open = row.classList.toggle("cm-row-open"); toggle.textContent = open ? "收起" : "展开"; toggle.setAttribute("aria-expanded", String(open)); }); key.append(toggle);
        }
      }
    }
  }
  function enhance(scope) {
    scope.querySelectorAll('form[data-form="officeFilter"],form[data-form="breedFilter"]').forEach(enhanceFilters);
    enhanceTables(scope);
    for (const menu of scope.querySelectorAll(".cm-more,.cm-multi")) {
      if (menu.dataset.wired) continue; menu.dataset.wired = "1";
      menu.addEventListener("keydown", (ev) => { if (ev.key === "Escape") { ev.stopPropagation(); ev.preventDefault(); menu.open = false; menu.querySelector("summary").focus(); } });
    }
    for (const form of scope.querySelectorAll('form[data-form="horse"],form[data-form="race"],form[data-form="track"],form[data-form="breedMating"]')) {
      if (!form.id) form.id = "cm-edit-form";
      const actions = form.querySelector(":scope > .cm-actions") || form.querySelector(":scope > button:not([type=button])");
      if (actions) { let group = actions; if (actions.tagName === "BUTTON") { group = node("div", "cm-sticky-actions"); actions.replaceWith(group); group.append(actions); } else group.classList.add("cm-sticky-actions"); for (const button of group.querySelectorAll("button")) if (button.type === "submit") { button.setAttribute("form", form.id); button.classList.add("cm-primary"); } }
    }
    for (const form of scope.querySelectorAll('form[data-form="horse"]')) {
      if (form.dataset.grouped) continue; form.dataset.grouped = "1";
      const grid = form.querySelector(".cm-form-grid"); if (!grid) continue;
      const groups = [["身份", /^(name|gender|birthYear|homeRegion|owner|coat)$/], ["竞赛参数", /^(strength|weight|distMin|coreDist|distMax)$/], ["成长与适性", /^(growthType|peakStart|peakEnd|temperamentLabel|heavyType|grass\.|dirt\.|courseGrades\.)/], ["血统与繁殖", /./]];
      const labels = [...grid.children];
      for (const [title, pattern] of groups) {
        const fieldset = node("fieldset", "cm-editor-group"), legend = node("legend", "", title), fields = node("div", "cm-form-grid"); fieldset.append(legend, fields);
        for (const label of labels.filter((l) => l.parentNode === grid && pattern.test(l.querySelector("input,select")?.name || ""))) fields.append(label);
        if (fields.children.length) grid.before(fieldset);
      }
      grid.remove();
    }
    for (const paragraph of scope.querySelectorAll(":scope > p,.cm-dialog-content > p,form[data-form=horse]>p,form[data-form=race]>p,form[data-form=region]>p")) {
      if (paragraph.children.length || paragraph.className || !/半月开始前安排|普通AI马仅展示|每年重复举办|宽松范围仍须|输入会自动|^UTF-8|^出生年份可为负数|^日本：沿用|^年度补马总数|^按半月每年重办/.test(paragraph.textContent.trim())) continue;
      const details = node("details", "cm-help"); details.append(node("summary", "", "说明")); paragraph.replaceWith(details); details.append(paragraph);
    }
  }
  function settings(scope, view, button) {
    const sections = { rules: node("section"), saves: node("section"), storage: node("section") }; let key = "rules";
    for (const el of [...scope.children]) {
      if (el.tagName === "H2" && el.textContent === "存档与恢复") key = "saves";
      if (el.tagName === "H3" && el.textContent === "保存与容量") key = "storage";
      sections[key].append(el);
    }
    scope.innerHTML = tabs([["rules", "世界规则"], ["saves", "存档与恢复"], ["storage", "存储信息"]], view, "settingsView", button);
    for (const [id, el] of Object.entries(sections)) { el.hidden = id !== view; scope.append(el); }
    const capacity = sections.storage.querySelector("p:last-child"); if (capacity?.textContent.includes("配额")) { const d = node("details", "cm-help"); d.append(node("summary", "", "容量详情")); capacity.replaceWith(d); d.append(capacity); }
  }
  document.addEventListener("pointerdown", (event) => { for (const menu of document.querySelectorAll("#chairmanApp .cm-more[open],#chairmanApp .cm-multi[open]")) if (!menu.contains(event.target)) menu.open = false; });
  ns.ChairmanUI = { useLayout, escape: e, more, help, toolbar, tabs, enhance, settings };
})();
