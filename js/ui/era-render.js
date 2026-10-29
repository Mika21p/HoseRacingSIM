(function () {
  const ns = (window.Keiba = window.Keiba || {});
  const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const button = (label, attr) => `<button type="button" ${attr}>${esc(label)}</button>`;
  const CATEGORY_LABELS = { horse: "名马", scene: "名场面", year: "年度" };
  const yearLabel = (years) => (years.length <= 1 ? String(years[0] ?? "") : `${years[0]}–${years[years.length - 1]}`);
  function historicalFieldLabel(edition) {
    const field = ns.EraAlmanac.historicalHeadcount(edition);
    if (field.count == null) return "史实起跑数待核实";
    return field.source === "legacy" ? `旧年鉴口径${field.count}头（起跑数未单列）` : `史实起跑${field.count}头`;
  }
  function encyclopedia(run, years) {
    const entries = years.flatMap((year) => ns.EraAlmanac.entriesOf(year));
    if (!entries.length) return "";
    const items = entries.map((item) => {
      const actual = item.raceId ? run.worldResults[item.raceId] : null;
      let mark = "";
      if (actual) {
        const edition = ns.EraAlmanac.race(item.raceId);
        const historical = edition ? `史实：${ns.EraAlmanac.horseName(edition.results[0].horseId)}胜出` : "";
        const local = actual.kind === "simulated"
          ? `本局：${actual.winnerId === "player" ? run.career.horse.name : ns.EraAlmanac.horseName(actual.winnerId)}胜出 · 玩家${actual.retired ? "退赛" : `${actual.playerRank}着`}`
          : "本局：玩家未参赛，按史实推进";
        mark = `<p class="era-entry-worldline">${esc(historical)} / ${esc(local)}</p>`;
      }
      const source = item.raceId ? ns.EraAlmanac.race(item.raceId)?.source : "";
      return `<details class="era-encyclopedia-entry"><summary>${esc(item.title)}${item.subtitle ? ` · ${esc(item.subtitle)}` : ""}</summary><p class="eyebrow">${esc(CATEGORY_LABELS[item.category] || "条目")}${item.status === "draft" ? " · 草稿待审" : ""}</p><p>${esc(item.body)}</p>${mark}${source ? `<a href="${esc(source)}" target="_blank" rel="noopener noreferrer">JBIS赛果来源</a>` : ""}</details>`;
    }).join("");
    return `<section data-era-encyclopedia><h2>${esc(yearLabel(years))}年鉴 · 百科</h2><p>名马、名场面与年度回顾，共${entries.length}条。标注“史实／本局”的条目会对照你这一局的结果。</p>${items}</section>`;
  }
  function annualReviewNote(scene) {
    if (!['year-end', 'year-end-transition'].includes(scene?.id) || scene.textId !== 'jp.era.1998.scene.year-end') return '';
    return `<p class="era-drawer-note" data-era-review-note>1998年度回顾${scene.date ? ` · 快照日期：${esc(scene.date)}` : ''}。日期与纪事分组沿用原快照，不代表回顾年度。</p>`;
  }
  function renderSceneBody(content, scene, run, label) {
    return `${content ? `<article class="era-scene-card" data-era-current-scene><p class="eyebrow">${esc(content.status === "final" ? "正文已定稿" : scene.content ? "正文快照 · 草稿待审" : "正文草稿 · 待审核")}</p><h2>${esc(content.title)}</h2>${annualReviewNote(scene)}<p>${esc(content.body)}</p>${scene.interactionKind === "naming" ? `<label for="eraEncounterHorseName">正式马名</label><input id="eraEncounterHorseName" maxlength="30">${button(`确认名字，进入${label}赛季`, "data-era-name-horse")}` : (scene.choices || []).map((c) => button(c.label, `data-era-choice="${esc(c.id)}" data-era-scene-id="${esc(scene.id)}"`)).join("")}</article>` : ""}${run.ended ? `<article class="era-editorial-summary" data-era-summary><h2>${label}生涯总结</h2><p>累计${run.summary.starts}战 ${run.summary.wins}胜 · G1 ${run.summary.g1Wins}胜 · 名声${run.summary.fame}</p><p>本次生涯已结束，可继续查阅纪事与年鉴。</p>${button("查看纪事", 'data-era-panel-select="timeline"')}${button("查看年鉴", 'data-era-panel-select="yearbook"')}</article>` : ""}${!content && !run.ended ? '<article data-era-current-scene><h2>赛季现场</h2><p>当前没有待处理的剧情，可打开赛程手册查看报名情况，或回看生涯纪事。</p></article>' : ""}`;
  }
  function renderTimelineBody(history) {
    return `<section data-era-timeline><h2>生涯纪事</h2>${history.map((h) => `<details><summary>${esc(h.date)} · ${esc(h.content.title)}</summary>${annualReviewNote(h)}<p>${esc(h.content.body)}</p></details>`).join("")}</section>`;
  }
  function renderYearbookBody(yearbook, allRaces, label, run) {
    const settledCount = allRaces.filter((race) => run.settled.includes(race.id)).length;
    return `<section data-era-yearbook><h2>${run.ended ? `${label}生涯年鉴 · 开放查阅${yearbook.length}场` : `${label}年鉴 · 已发生${yearbook.length}/${allRaces.length}场`}</h2>${run.ended ? `<p>本局已结算${settledCount}/${allRaces.length}场；其余赛事仅开放史实资料，不代表在本局发生。</p>` : ""}<p>赛程列表中的未发生赛事只显示名称与条件；百科另收录全年史实赛果与回顾，可提前查阅。史实走时不是玩家的模拟走时。</p>${yearbook.map(({ edition: e, actual }) => `<details><summary>${esc(e.date)} · ${esc(e.nameZh || e.nameOriginal)}${actual?.kind === "simulated" ? " · 本局已介入" : ""}</summary>${run.ended ? `<p>${run.settled.includes(e.id) ? "本局已结算" : "结束后开放 · 史实资料"}</p>` : ""}<p>${esc(e.grade)} · ${esc(e.course)} · ${e.distance}米 · ${esc(e.going)} · ${esc(historicalFieldLabel(e))}</p><p>史实冠军：${esc(ns.EraAlmanac.horseName(e.results[0].horseId))}${actual?.kind === "simulated" ? ` / 本局冠军：${esc(actual.winnerId === "player" ? run.career.horse.name : ns.EraAlmanac.horseName(actual.winnerId))} · 玩家${actual.retired ? "退赛" : actual.playerRank + "着"} · 本局阵容${actual.fieldSize ?? e.headcount}头` : ""}</p><ul>${e.results.map((r) => `<li>${r.finish}着${r.deadHeat ? "（同着）" : ""} · ${esc(ns.EraAlmanac.horseName(r.horseId))} · ${esc(r.jockey)} · 史实${esc(r.time)}</li>`).join("")}</ul><a href="${esc(e.source)}" target="_blank" rel="noopener noreferrer">JBIS史实来源</a></details>`).join("")}</section>`;
  }
  const browseOwners = new WeakMap();
  function filterRecords(section) {
    if (!section) return;
    const values = Object.fromEntries([...section.querySelectorAll('[data-era-filter]')].map((input) => [input.dataset.eraFilter, input.value]));
    let count = 0;
    section.querySelectorAll('[data-era-record]').forEach((row) => {
      const d = row.dataset;
      row.hidden = !!((values.year && d.year !== values.year)
        || (values.month && d.month !== values.month)
        || (values.category && d.category !== values.category)
        || (values.query && !d.title.includes(values.query.trim().toLocaleLowerCase()))
        || (values.scope === 'future' && d.future !== 'true' && d.scheduled !== 'true')
        || (values.scope === 'available' && d.available !== 'true' && d.scheduled !== 'true')
        || (values.scope === 'unread' && d.unread !== 'true')
        || (values.scope === 'player' && d.player !== 'true'));
      if (!row.hidden) count += 1;
    });
    section.querySelectorAll('[data-era-group]').forEach((group) => {
      group.hidden = ![...group.querySelectorAll('[data-era-record]')].some((row) => !row.hidden);
    });
    section.querySelector('[data-era-count]').textContent = `显示${count}条 / 全部${section.querySelectorAll('[data-era-record]').length}条`;
    const empty = section.querySelector('[data-era-empty]');
    const rows = [...section.querySelectorAll('[data-era-record]')];
    let message = '当前筛选没有结果。可调整条件或重置筛选。';
    if (!rows.length) {
      const messages = {
        timeline: '尚无生涯纪事。经历剧情后，可在这里回看。',
        news: section.dataset.ended === 'true' ? '本次生涯没有收录新闻。' : '尚无新闻。后续报道会收录在这里。',
        yearbook: '尚无已结算赛事。赛事结算后可在这里查阅。',
        schedule: '当前剧本尚无赛程资料。',
        encyclopedia: '当前剧本尚无百科条目。'
      };
      message = messages[section.dataset.eraRecords] || message;
    } else if (section.dataset.eraRecords === 'news' && values.scope === 'unread' && !rows.some((row) => row.dataset.unread === 'true')) {
      message = '全部新闻已读。可切换“全部新闻”回看。';
    } else if (section.dataset.eraRecords === 'yearbook' && values.scope === 'player') {
      message = section.dataset.hasPlayer === 'true' ? '当前条件无参赛记录。可调整条件或重置筛选。' : '本次生涯未参赛。可切换全部赛事查阅史实资料。';
    }
    empty.textContent = message;
    empty.hidden = count > 0;
  }
  function captureBrowse(container, state) {
    state.filters = {};
    container.querySelectorAll('[data-era-records]').forEach((section) => {
      state.filters[section.dataset.eraRecords] = Object.fromEntries([...section.querySelectorAll('[data-era-filter]')].map((input) => [input.dataset.eraFilter, input.value]));
    });
    state.open = [...container.querySelectorAll('details[data-era-record][open]')].map((row) => row.dataset.eraRecord);
    state.scroll = [...container.querySelectorAll('[data-era-schedule-drawer], [data-era-newspaper-drawer]')].map((drawer) => drawer.scrollTop);
    state.top = container.scrollTop;
    const focused = container.ownerDocument.activeElement;
    state.focus = focused?.matches('[data-era-news-read]') ? { news: focused.dataset.eraNewsRead }
      : focused?.matches('[data-era-register], [data-era-cancel-race]') ? { schedule: true } : null;
  }
  function restoreBrowse(container, state) {
    container.querySelectorAll('[data-era-records]').forEach((section) => {
      const saved = state.filters?.[section.dataset.eraRecords];
      section.querySelectorAll('[data-era-filter]').forEach((input) => {
        if (saved && Object.hasOwn(saved, input.dataset.eraFilter)) input.value = saved[input.dataset.eraFilter];
      });
      filterRecords(section);
    });
    container.querySelectorAll('details[data-era-record]').forEach((row) => { row.open = (state.open || []).includes(row.dataset.eraRecord); });
    container.querySelectorAll('[data-era-schedule-drawer], [data-era-newspaper-drawer]').forEach((drawer, index) => { drawer.scrollTop = state.scroll?.[index] || 0; });
    container.scrollTop = state.top || 0;
    if (state.focus?.schedule) {
      const open = container.querySelector('[data-era-schedule-drawer]')?.getAttribute('aria-hidden') === 'false';
      container.querySelector(open ? '[data-era-schedule-drawer] [data-era-schedule-close]' : '[data-era-schedule-open]')?.focus({ preventScroll: true });
    }
    if (state.focus?.news) {
      const row = [...container.querySelectorAll('[data-era-news-id]')].find((item) => item.dataset.eraNewsId === state.focus.news);
      const target = row && !row.hidden ? row : container.querySelector('[data-era-records="news"] [data-era-filter]');
      target?.focus({ preventScroll: true });
    }
  }
  function organizeRecords(container, run, years) {
    const select = (name, label, items, initial = '') => `<label>${label}<select data-era-filter="${name}" data-default="${initial}">${items.map(([value, text]) => `<option value="${value}" ${value === initial ? 'selected' : ''}>${text}</option>`).join('')}</select></label>`;
    const yearSelect = select('year', '年份', [['', '全部年份'], ...years.map((year) => [year, year])]);
    const monthSelect = select('month', '月份', [['', '全部月份'], ...Array.from({ length: 12 }, (_, i) => [String(i + 1).padStart(2, '0'), `${i + 1}月`])]);
    const history = ns.EraRules.getTimeline(run), yearbook = ns.EraWorld.yearbook(run), schedule = ns.EraRules.getScheduleOptions(run), news = ns.EraRules.getNewspaperItems(run);
    const entries = years.flatMap((year) => ns.EraAlmanac.entriesOf(year).map((entry) => ({ year, ...entry })));
    const specs = [
      { id: 'timeline', section: '[data-era-timeline]', rows: ':scope > details', data: history, date: (h) => h.date, key: (h, i) => `timeline:${h.id || h.date + ':' + i}`, controls: yearSelect + monthSelect },
      { id: 'yearbook', section: '[data-era-yearbook]', rows: ':scope > details', data: yearbook, date: (h) => h.edition.date, key: (h) => h.edition.id, controls: yearSelect + monthSelect + select('scope', '参赛范围', [['', run.ended ? '全部开放赛事' : '全部已发生'], ['player', '本局参赛']]) },
      { id: 'encyclopedia', section: '[data-era-encyclopedia]', rows: ':scope > details', data: entries, date: (h) => String(h.year), key: (h) => h.id, controls: yearSelect + select('category', '类别', [['', '全部类别'], ...Object.entries(CATEGORY_LABELS)]) + '<label>标题检索<input type="search" data-era-filter="query" placeholder="输入条目标题"></label>' },
      { id: 'schedule', section: '[data-era-schedule-drawer]', rows: ':scope > article', data: schedule, date: (h) => h.occurrence.date, key: (h) => h.occurrence.id, controls: select('scope', '赛程范围', [['future', '后续赛程'], ['available', '可报名（含已报名）'], ['', '全部赛程']], 'future') + yearSelect + monthSelect },
      { id: 'news', section: '[data-era-newspaper-drawer]', rows: ':scope > article', data: news, date: (h) => h.date, key: (h) => h.id, controls: select('scope', '阅读状态', [['', '全部新闻'], ['unread', '未读新闻']]) + yearSelect }
    ];
    specs.forEach((spec) => {
      const section = container.querySelector(spec.section);
      if (!section) return;
      section.dataset.eraRecords = spec.id;
      section.dataset.ended = String(!!run.ended);
      if (spec.id === "yearbook") section.dataset.hasPlayer = String(Object.values(run.worldResults).some((result) => result.kind === "simulated"));
      const rows = [...section.querySelectorAll(spec.rows)];
      const groups = new Map();
      rows.forEach((row, index) => {
        const item = spec.data[index], date = spec.date(item);
        row.dataset.eraRecord = `${spec.id}:${spec.key(item, index)}`;
        row.dataset.year = date.slice(0, 4); row.dataset.month = date.slice(5, 7);
        if (spec.id === 'encyclopedia') { row.dataset.entryId = item.id; row.dataset.horseId = item.horseId || ''; row.dataset.raceId = item.raceId || ''; row.dataset.category = item.category; row.dataset.title = item.title.toLocaleLowerCase(); }
        if (spec.id === 'yearbook') { row.dataset.raceId = item.edition.id; row.dataset.player = String(item.actual?.kind === 'simulated'); }
        if (spec.id === 'timeline') row.dataset.raceId = item.raceId || '';
        if (spec.id === 'schedule') {
          row.dataset.future = String(item.occurrence.date >= run.date && item.status !== 'completed');
          row.dataset.available = String(item.enabled); row.dataset.scheduled = String(item.status === 'scheduled');
        }
        if (spec.id === 'news') { row.dataset.unread = String(!item.read); row.dataset.eraNewsId = item.id; row.tabIndex = -1; }
        const key = spec.id === 'encyclopedia' ? date : spec.id === 'schedule' && item.status === 'scheduled' ? '已报名' : date.slice(0, 7);
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(row);
      });
      const toolbar = container.ownerDocument.createElement('div');
      toolbar.className = 'era-record-tools';
      toolbar.innerHTML = `${spec.controls}${button('重置筛选', 'data-era-filter-reset')}<p data-era-count role="status" aria-live="polite"></p>`;
      const empty = container.ownerDocument.createElement('p'); empty.dataset.eraEmpty = ''; empty.textContent = '当前筛选没有结果。可调整条件或重置筛选。';
      const content = container.ownerDocument.createElement('div'); content.className = 'era-record-groups';
      const ordered = [...groups.keys()];
      if (spec.id === 'timeline') ordered.sort().reverse();
      if (spec.id === 'schedule') ordered.sort((a, b) => a === '已报名' ? -1 : b === '已报名' ? 1 : a.localeCompare(b));
      ordered.forEach((key) => {
        const group = container.ownerDocument.createElement('section'); group.dataset.eraGroup = '';
        const heading = container.ownerDocument.createElement('h3'); heading.textContent = key === '已报名' ? key : key.length === 4 ? `${key}年` : `${key.slice(0, 4)}年${Number(key.slice(5))}月`;
        group.append(heading, ...groups.get(key)); content.append(group);
      });
      section.append(toolbar, empty, content);
      filterRecords(section);
    });
  }

  function render(container, run, options) {
    const o = options || {}, s = ns.EraRules.scenarioFor(run);
    const browse = o.browseState;
    if (browse && browseOwners.get(container) === browse) captureBrowse(container, browse);
    const years = s.years || (s.year ? [s.year] : []);
    const label = yearLabel(years);
    const nav = button("返回主页", "data-era-home");
    const otherYears = [1996, 1997, 1998, 1999, 2000].filter((year) => !years.includes(year));
    const coverageNote = `<p data-era-coverage-note>当前剧本覆盖${esc(label)}。${otherYears.length ? `${otherYears.join("、")}尚未接入本原型。` : ""}</p>`;
    if (!run || o.showHub) {
      const setup = o.entrySetup;
      container.innerHTML = `<section class="era-screen era-hub"><header class="era-topbar">${nav}<span class="era-test-badge">P1b 引擎原型 · 正文审核状态逐项标注</span></header><div class="era-hub-card"><p class="eyebrow">OWNER'S SEASON / ${esc(label)}</p><h1>${esc(s.name)}</h1><p>${esc(s.prototypeNotice)}</p>${coverageNote}<p>赛名保留旧制马龄：当年的四岁、五岁分别对应现代三岁、四岁。史实结果与本局模拟分别保存。</p>${o.saveMessage ? `<p role="status">${esc(o.saveMessage)}</p>` : ""}${run ? button(run.ended ? `回看 ${run.career.horse.name} 的生涯` : `继续 ${run.career.horse.name} 的赛季`, "data-era-continue") + button("重新开始", "data-era-restart") : setup ? ns.EraRules.getEntryCandidates(setup).map((c) => `<article class="era-entry-card"><h2>${esc(c.title)}</h2><p>${esc(c.coat)} · ${esc(c.gender)} · ${esc(c.trainerName)}</p>${button("前往马房相遇", `data-era-select-candidate="${esc(c.id)}"`)}</article>`).join("") : `<label for="eraPlayerReferenceInput">玩家称呼</label><input id="eraPlayerReferenceInput" maxlength="20" value="马主"><label for="eraSeedInput">世界线种子（可留空）</label><input id="eraSeedInput" inputmode="numeric" placeholder="例如1998">${button("生成本次路线候选", "data-era-create-candidates")}`}</div></section>`;
      return;
    }
    const scene = ns.EraRules.getCurrentScene(run);
    const content = scene ? scene.content || ns.EraTextIndex.resolve(scene.textId, scene.tokensSnapshot) : null;
    const history = ns.EraRules.getTimeline(run);
    const schedule = ns.EraRules.getScheduleOptions(run);
    const yearbook = ns.EraWorld.yearbook(run);
    const allRaces = ns.EraWorld.scenarioRaces(run);
    const age = run.career.currentTime?.age ?? 3;
    const comments = run.career.commentDetails || [];
    const panels = [["scene", "赛季现场"], ["timeline", "生涯纪事"], ["yearbook", "赛事年鉴"], ["encyclopedia", "名马与名场面"]];
    const activePanel = panels.some(([id]) => id === o.activePanel) ? o.activePanel : "scene";
    const panel = (id, body) => `<div id="era-panel-${id}" data-era-panel="${id}" ${activePanel === id ? "" : "hidden"}>${body}</div>`;
    const sceneBody = renderSceneBody(content, scene, run, label);
    const timelineBody = renderTimelineBody(history);
    const yearbookBody = renderYearbookBody(yearbook, allRaces, label, run);
    const scheduled = schedule.find((item) => item.status === "scheduled");
    const booking = scheduled ? `<section class="era-booking"><h2>已报名赛事</h2><p>${esc(scheduled.occurrence.nameZh)} · ${esc(scheduled.occurrence.date)}</p><p>${esc(scheduled.race.grade)} · ${esc(scheduled.race.course)} ${scheduled.race.distance}米</p>${button("查看赛程", "data-era-schedule-open")}</section>` : "";
    container.innerHTML = `<section class="era-screen era-run">
      <header class="era-editorial-header"><div><p class="eyebrow">${esc(run.date)} · ${run.ended ? "生涯已结束" : `${esc(run.date.slice(0, 4))}赛季`}</p><h1>${esc(run.career.horse.name)}</h1><p>${esc(run.playerReference)} · 现代实龄${age}岁 · 种子${run.seed}</p></div>
        <div class="era-header-actions">${button("赛程手册", "data-era-schedule-open")}${button(`报纸箱（${run.news.filter((n) => !n.read).length}未读）`, "data-era-newspaper-open")}<details class="era-more"><summary>更多</summary><div>${button("剧本菜单", "data-era-hub")}${nav}<details><summary>玩法与口径说明</summary><p>${esc(s.prototypeNotice)}</p>${coverageNote}<p>赛名保留旧制马龄：当年的四岁、五岁分别对应现代三岁、四岁。史实结果与本局模拟分别保存。</p></details></div></details></div>
      </header>
      <nav class="era-panel-nav" aria-label="剧情模式资料导航">${panels.map(([id, title]) => button(title, `data-era-panel-select="${id}" aria-controls="era-panel-${id}" aria-pressed="${activePanel === id}"`)).join("")}</nav>
      <div class="era-editorial-grid"><main class="era-narrative-column">${panel("scene", sceneBody + booking)}${panel("timeline", timelineBody)}${panel("yearbook", yearbookBody)}${panel("encyclopedia", encyclopedia(run, years))}</main>
        <aside class="era-dossier"><h2>马房档案</h2><p>${run.summary.starts}战 ${run.summary.wins}胜 · 名声${run.summary.fame}</p><p>主战：${esc(run.career.playerJockey.name)}（虚构）</p><p>草地 · 适距${run.career.horse.distMin}—${run.career.horse.distMax}米</p><details class="era-full-dossier"><summary>查看完整档案</summary><h3>佐藤悠太的出道前评估</h3>${comments.map((c) => `<p>${esc(c.text)}</p>`).join("")}<p>${esc(run.summary.tags.join(" / "))}</p>${!run.ended && run.onboarding.namingComplete ? `<div class="era-retirement"><h3>结束本次生涯</h3><p>提前退役将结束当前路线，操作前会再次确认。</p>${button("提前退役", "data-era-retire")}</div>` : ""}</details></aside>
      </div>
      <div class="era-drawer-backdrop" ${o.scheduleOpen ? "" : "hidden"} data-era-schedule-close></div><aside class="era-schedule-drawer ${o.scheduleOpen ? "is-open" : ""}" data-era-schedule-drawer aria-hidden="${!o.scheduleOpen}"><header><h2>${label}赛程手册</h2>${button("关闭", "data-era-schedule-close")}</header><p>实名相对顺序保持史实；玩家替换一匹匿名马，头数不变。未标定或未核实的赛事仅供浏览。</p>${schedule.map((p) => `<article class="era-schedule-row"><div class="era-schedule-copy"><h3>${esc(p.occurrence.nameZh)}</h3><p>${esc(p.occurrence.date)} · ${esc(p.race.grade)} · ${esc(p.race.course)} ${p.race.distance}米</p><small>${esc(p.reason || "原型基础资格可报")}</small></div>${p.enabled ? button("报名", `data-era-register="${esc(p.occurrence.id)}"`) : ""}${p.status === "scheduled" ? button("取消报名", "data-era-cancel-race") : ""}</article>`).join("")}</aside>
      <div class="era-drawer-backdrop" ${o.newspaperOpen ? "" : "hidden"} data-era-newspaper-close></div><aside class="era-newspaper-drawer ${o.newspaperOpen ? "is-open" : ""}" data-era-newspaper-drawer aria-hidden="${!o.newspaperOpen}"><header><h2>竞马周报 · 报纸箱</h2>${button("关闭", "data-era-newspaper-close")}</header>${ns.EraRules.getNewspaperItems(run).map((n) => `<article><small>${esc(n.date)} · ${n.kind === "historical" ? "史实简讯" : "本局报道"} · ${esc(n.status === "final" ? "新闻快照 · 已定稿" : "新闻快照 · 未标为定稿")}</small><h3>${esc(n.title)}</h3><p>${esc(n.body)}</p>${!n.read ? button("标为已读", `data-era-news-read="${esc(n.id)}"`) : ""}</article>`).join("")}</aside></section>`;
    organizeRecords(container, run, years);
    addRecordLinks(container);
    if (browse?.origin) showReturnLink(container);
    if (browse) { restoreBrowse(container, browse); browseOwners.set(container, browse); }
  }
  function addRecordLinks(container) {
    const rows = [...container.querySelectorAll('[data-era-record]')];
    const entries = rows.filter((row) => row.dataset.entryId);
    rows.forEach((row) => {
      const links = [];
      const d = row.dataset;
      if (d.raceId && !row.closest('[data-era-records="yearbook"]')) {
        const race = rows.find((target) => target.closest('[data-era-records="yearbook"]') && target.dataset.raceId === d.raceId);
        if (race) links.push([race, '查看赛事年鉴']);
      }
      if (row.closest('[data-era-records="yearbook"]')) {
        entries.filter((entry) => entry.dataset.raceId === d.raceId).forEach((entry) => links.push([entry, `相关百科：${entry.querySelector('summary').textContent}`]));
      }
      if (d.horseId) entries.filter((entry) => entry !== row && entry.dataset.horseId === d.horseId && entry.dataset.year !== d.year).forEach((entry) => links.push([entry, `查看${entry.dataset.year}年：${entry.querySelector('summary').textContent}`]));
      if (!links.length) return;
      const nav = container.ownerDocument.createElement('nav');
      nav.setAttribute('aria-label', '相关资料');
      nav.innerHTML = links.map(([target, label]) => button(label, `data-era-record-link="${esc(target.dataset.eraRecord)}"`)).join('');
      row.append(nav);
    });
  }
  function showReturnLink(container) {
    if (container.querySelector('[data-era-source-return]')) return;
    const nav = container.ownerDocument.createElement('div');
    nav.dataset.eraSourceBar = '';
    nav.innerHTML = button('返回来源', 'data-era-source-return') + '<span data-era-link-message role="status"></span>';
    container.querySelector('.era-panel-nav').after(nav);
  }
  function selectRecordPanel(container, id) {
    container.querySelectorAll('[data-era-panel]').forEach((panel) => { panel.hidden = panel.dataset.eraPanel !== id; });
    container.querySelectorAll('[data-era-panel-select]').forEach((button) => { button.setAttribute('aria-pressed', String(button.dataset.eraPanelSelect === id)); });
  }
  function navigateRecord(container, state, key, panel) {
    const target = [...container.querySelectorAll('[data-era-record]')].find((row) => row.dataset.eraRecord === key);
    if (!target) {
      showReturnLink(container);
      container.querySelector('[data-era-link-message]').textContent = '该资料当前不可查阅，仍保留来源页面。';
      if (!state.origin) container.querySelector('[data-era-source-return]').hidden = true;
      return null;
    }
    if (!state.origin) {
      const snapshot = {};
      captureBrowse(container, snapshot);
      const active = container.ownerDocument.activeElement;
      const source = active?.closest('[data-era-record]');
      state.origin = { snapshot, panel: panel || container.querySelector('[data-era-panel]:not([hidden])')?.dataset.eraPanel, sourceKey: source?.dataset.eraRecord, targetKey: key };
    }
    const section = target.closest('[data-era-records]');
    const values = { year: target.dataset.year, month: target.dataset.month, category: target.dataset.category };
    section.querySelectorAll('[data-era-filter]').forEach((input) => {
      const name = input.dataset.eraFilter;
      const blocks = name === 'query' ? input.value.trim() && !target.dataset.title.includes(input.value.trim().toLocaleLowerCase())
        : name === 'scope' ? input.value === 'player' && target.dataset.player !== 'true'
        : input.value && input.value !== values[name];
      if (blocks) input.value = '';
    });
    filterRecords(section);
    const id = target.closest('[data-era-panel]').dataset.eraPanel;
    selectRecordPanel(container, id);
    target.open = true;
    const summary = target.querySelector('summary');
    summary?.focus({ preventScroll: true });
    target.scrollIntoView?.({ block: 'start', behavior: 'auto' });
    showReturnLink(container);
    container.querySelector('[data-era-source-return]').hidden = false;
    container.querySelector('[data-era-link-message]').textContent = '';
    return id;
  }
  function returnToSource(container, state) {
    if (!state?.origin) return null;
    const origin = state.origin;
    restoreBrowse(container, origin.snapshot);
    selectRecordPanel(container, origin.panel);
    const source = [...container.querySelectorAll('[data-era-record]')].find((row) => row.dataset.eraRecord === origin.sourceKey);
    const link = source && [...source.querySelectorAll('[data-era-record-link]')].find((button) => button.dataset.eraRecordLink === origin.targetKey);
    (link || source?.querySelector('summary') || container.querySelector(`[data-era-panel-select="${origin.panel}"]`))?.focus({ preventScroll: true });
    container.scrollTop = origin.snapshot.top;
    delete state.origin;
    container.querySelector('[data-era-source-bar]')?.remove();
    return origin.panel;
  }

  ns.EraUI = { render, escapeHtml: esc, filterRecords, navigateRecord, returnToSource };
})();
