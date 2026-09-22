(function () {
  "use strict";
  const ns = window.Keiba;
  const e = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const more = (html, label = "操作", title = label) => `<details class="cm-more" data-menu-title="${e(title)}"><summary>${e(label)}</summary><div class="cm-menu">${html}</div></details>`;
  const help = (text) => `<details class="cm-help"><summary>说明</summary><p>${e(text)}</p></details>`;
  const toolbar = (title, count, actions = "") => `<div class="cm-toolbar"><h2>${e(title)}${count == null ? "" : `<small>${e(count)}</small>`}</h2><div class="cm-actions">${actions}</div></div>`;
  const tabs = (items, active, action, button) => `<div class="cm-tabs">${items.map(([id, name]) => button(action, name, id, id === active ? 'aria-current="page"' : "")).join("")}</div>`;
  let layout = {}, remember = () => {};
  function useLayout(value, save) { layout = value || {}; remember = save; }
  function node(tag, cls, text) { const el = document.createElement(tag); if (cls) el.className = cls; if (text != null) el.textContent = text; return el; }
  let worldKey = "lobby";
  const filterStates = new Map(), rowStates = new Map(), viewStates = new Map();
  function clearPrivate(){filterStates.clear();rowStates.clear();viewStates.clear();closeMenu(false);}
  function context(id) { worldKey = id || "lobby"; }
  function scopeKey(scope) { return `${worldKey}:${scope.closest('[data-view-key]')?.dataset.viewKey || scope.dataset.viewKey || 'main'}`; }
  function formValues(form) { const out = {}; for (const el of form.querySelectorAll('[name]')) { if (el.disabled) continue; out[el.name] = el.multiple ? [...el.selectedOptions].map(o => o.value) : el.type === 'checkbox' ? el.checked : el.value; } return out; }
  function setValues(form, values) { for (const el of form.querySelectorAll('[name]')) if (Object.hasOwn(values, el.name)) { const value = values[el.name]; if (el.multiple) [...el.options].forEach(o => o.selected = (value || []).includes(o.value)); else if (el.type === 'checkbox') el.checked = !!value; else el.value = value; } }
  function enhanceFilters(form) {
    if (form.dataset.compact) return; form.dataset.compact = 'true';
    const kind = form.dataset.kind || form.dataset.form, key = `${scopeKey(form)}:filter:${kind}:${form.dataset.id||''}`;
    const applied = formValues(form), entry = filterStates.get(key) || { draft: { ...applied }, applied, open: false };
    // Refresh externally changed applied conditions without overwriting edited fields.
    for (const name of Object.keys(applied)) if (JSON.stringify(entry.draft[name]) === JSON.stringify(entry.applied[name])) entry.draft[name] = applied[name];
    entry.applied = applied;
    filterStates.set(key, entry); setValues(form, entry.draft);
    const fields = [...form.children].filter(v => v.tagName === 'LABEL');
    const panel = node('div', 'cm-filter-panel'), main = node('fieldset', 'cm-filter-main'), grid = node('fieldset', 'cm-filter-grid');
    main.append(node('legend', '', '常用条件')); grid.append(node('legend', '', '竞赛、来源与荣誉'));
    const sync = [], controls = new Map(), captions = new Map();
    const common = ['search','region','status','sort','year','month','half','scoring'];
    for (const label of fields) {
      const el = label.querySelector('input,select'); if (!el) continue;
      const caption = [...label.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent).join('').trim().replace(/（可多选）/, ''); captions.set(el.name, caption); controls.set(el.name, el);
      const group = common.includes(el.name) ? main : grid;
      if (el.multiple) {
        const set = node('fieldset', 'cm-multi'), title = node('legend', '', caption), options = node('div', 'cm-multi-options');
        set.dataset.field = el.name; el.hidden = true; set.append(title, el, options);
        for (const option of el.options) {
          const choice = node('label', 'cm-check'), box = document.createElement('input'); box.type = 'checkbox'; box.checked = option.selected;
          box.setAttribute('aria-label', `${caption}：${option.textContent}`);
          box.addEventListener('change', () => { option.selected = box.checked; changed(); });
          choice.append(box, document.createTextNode(option.textContent)); options.append(choice);
        }
        sync.push(() => [...options.querySelectorAll('input')].forEach((box, i) => box.checked = el.options[i].selected));
        group.append(set);
      } else group.append(label);
    }
    const apply = [...form.children].find(el => el.tagName === 'BUTTON' && !el.dataset.action) || node('button');
    apply.textContent = '应用筛选'; apply.type = 'submit'; apply.className = 'cm-primary cm-apply-filter';
    const reset = node('button', '', '重置条件'); reset.type = 'button'; reset.dataset.filterReset = 'true';
    const state = node('span', 'cm-filter-state'); state.setAttribute('role','status');
    const toggle = node('button', 'cm-mobile-filters', '筛选条件'); toggle.type = 'button';
    const chips = node('div', 'cm-filter-chips'), actions = node('div','cm-filter-actions'); actions.append(apply, reset, state);
    panel.append(main); if (grid.children.length > 1) panel.append(grid); panel.append(actions);
    form.replaceChildren(toggle, chips, panel); form.classList.add('cm-filters');
    function expand(open) { entry.open = open; panel.hidden = !open; toggle.setAttribute('aria-expanded', String(open)); form.classList.toggle('cm-filters-open', open); }
    function changed() {
      entry.draft = formValues(form); const dirty = JSON.stringify(Object.entries(entry.draft).sort()) !== JSON.stringify(Object.entries(applied).sort());
      state.textContent = dirty ? '待应用 · 结果尚未更新' : '条件已应用'; toggle.textContent = dirty ? '筛选条件 · 待应用' : '筛选条件';
      chips.replaceChildren();
      for (const [name, el] of controls) {
        if (['sort','alphabet'].includes(name) || name === 'status' && el.value === 'active') continue;
        const vals = el.multiple ? [...el.selectedOptions].map(o => [o.value,o.textContent]) : el.type === 'checkbox' ? el.checked ? [['1',captions.get(name)]] : [] : el.value ? [[el.value,el.selectedOptions?.[0]?.textContent || el.value]] : [];
        for (const [value,text] of vals) {
          const chip = node('button','cm-chip',`${captions.get(name)}：${text} ×`); chip.type='button'; chip.setAttribute('aria-label',`移除${captions.get(name)}筛选：${text}`);
          chip.addEventListener('click',()=>{ if(el.multiple) [...el.options].forEach(o=>{if(o.value===value)o.selected=false;}); else if(el.type==='checkbox')el.checked=false;else el.value=''; sync.forEach(fn=>fn());changed(); }); chips.append(chip);
        }
      }
      chips.hidden = !chips.children.length;
    }
    toggle.addEventListener('click',()=>expand(!entry.open));
    form.addEventListener('input',changed);form.addEventListener('change',changed);
    reset.addEventListener('click',()=>{ for(const [name,el] of controls){if(el.multiple)[...el.options].forEach(o=>o.selected=false);else if(el.type==='checkbox')el.checked=false;else {const preferred=name==='status'&&kind==='horses'?'active':name==='sort'?(kind==='honorFilter'?'rating':'tf'):name==='alphabet'?'original':name==='historyKind'?'councilRounds':'';el.value=preferred;if(el.tagName==='SELECT'&&el.selectedIndex<0)el.selectedIndex=0;}}sync.forEach(fn=>fn());changed(); });
    form.addEventListener('keydown',ev=>{if(ev.key==='Enter'&&!ev.isComposing&&ev.target.tagName==='INPUT'){ev.preventDefault();form.requestSubmit(apply);}});
    form.addEventListener('submit',()=>{entry.draft=formValues(form);entry.open=true;entry.focusApply=true;});
    expand(entry.open);changed();
    if(entry.focusApply){entry.focusApply=false;requestAnimationFrame(()=>{if(apply.isConnected)apply.focus({preventScroll:true});});}
  }
  function enhanceTables(scope) {
    for (const table of scope.querySelectorAll('table')) {
      if(table.dataset.enhanced)continue;table.dataset.enhanced='true';
      const headings=[...table.querySelectorAll('thead th')].map(v=>v.textContent);
      const primary=table.dataset.primaryColumns?.split(',').map(Number), nameIndex=Number(table.dataset.nameColumn||0);
      table.classList.add('cm-responsive-table');
      for(const row of table.querySelectorAll('tbody tr')) {
        [...row.cells].forEach((cell,i)=>cell.dataset.label=headings[i]||'');
        if(!primary||row.cells.length<=1)continue;
        const name=row.cells[nameIndex];if(!name)continue;name.classList.add('cm-row-name');
        [...row.cells].forEach((cell,i)=>{if(!primary.includes(i))cell.classList.add('cm-row-secondary');});
        if(!row.querySelector('.cm-row-secondary'))continue;
        const record=row.dataset.rowId, key=record?`${scopeKey(scope)}:${table.dataset.table||'table'}:${record}`:null;
        const toggle=node('button','cm-row-toggle');toggle.type='button';
        function update(open){open=!!open;row.classList.toggle('cm-row-open',open);toggle.textContent=open?'收起补充资料':'补充资料';toggle.setAttribute('aria-expanded',String(open));if(key)rowStates.set(key,open);}
        update(key&&rowStates.get(key));
        toggle.addEventListener('click',()=>{const y=row.getBoundingClientRect().top;update(!row.classList.contains('cm-row-open'));const scroll=scope.querySelector('.cm-dialog-content');requestAnimationFrame(()=>{const delta=row.getBoundingClientRect().top-y;if(scroll)scroll.scrollTop+=delta;else if(delta)window.scrollTo({top:window.scrollY+delta});});});name.append(toggle);
      }
    }
  }
  function capture(scope) {
    if(!scope)return;const key=scopeKey(scope), scroller=scope.querySelector('.cm-dialog-content');
    const focused=document.activeElement;const identity=focused&&scope.contains(focused)?{id:focused.id,action:focused.dataset.action,target:focused.dataset.id,name:focused.name}:null;
    viewStates.set(key,{top:scroller?scroller.scrollTop:window.scrollY,identity});
  }
  function restore(scope) {
    const saved=viewStates.get(scopeKey(scope));if(!saved)return;
    const scroller=scope.querySelector('.cm-dialog-content');if(scroller)scroller.scrollTop=saved.top;else window.scrollTo({top:saved.top});
    const id=saved.identity;if(id){const target=[...scope.querySelectorAll('button,input,select,summary,[tabindex]')].find(el=>id.id?el.id===id.id:id.action?el.dataset.action===id.action&&el.dataset.id===id.target:id.name?el.name===id.name:false);if(target&&!target.closest('[hidden]'))target.focus({preventScroll:true});else if(id.action){const heading=scope.querySelector('h2,h1');if(heading){heading.tabIndex=-1;heading.focus({preventScroll:true});}const status=scope.querySelector('.cm-position-note')||node('p','cm-position-note','原记录已不在当前结果中，已返回列表标题。');status.setAttribute('role','status');if(!status.isConnected)scope.prepend(status);}}
  }
  let floating=null;
  function closeMenu(focus=true){if(!floating)return;const {owner,panel,shade}=floating;floating=null;owner.open=false;owner.querySelector('summary').setAttribute('aria-expanded','false');panel.removeAttribute('style');panel.classList.remove('cm-floating-menu');panel.querySelector('.cm-menu-heading')?.remove();shade?.remove();owner.append(panel);if(focus&&owner.isConnected)owner.querySelector('summary').focus({preventScroll:true});}
  function positionMenu(){
    if(!floating)return;const {owner,panel}=floating;if(!owner.isConnected){closeMenu(false);return;}
    const a=owner.querySelector('summary').getBoundingClientRect(), dialog=owner.closest('dialog'), d=dialog?.getBoundingClientRect();
    const left=Math.max(8,d?d.left+8:8),right=Math.min(innerWidth-8,d?d.right-8:innerWidth-8),top=Math.max(8,d?d.top+8:8),bottom=Math.min(innerHeight-8,d?d.bottom-8:innerHeight-8);
    if(a.bottom<top||a.top>bottom||a.right<left||a.left>right){closeMenu(false);return;}
    for(let ancestor=owner.parentElement;ancestor&&ancestor!==dialog;ancestor=ancestor.parentElement){if(/auto|scroll|hidden/.test(getComputedStyle(ancestor).overflow)){const box=ancestor.getBoundingClientRect();if(a.bottom<=box.top||a.top>=box.bottom||a.right<=box.left||a.left>=box.right){closeMenu(false);return;}}}
    panel.style.maxHeight=`${Math.max(100,bottom-top)}px`;
    if(innerWidth<768){panel.style.left=`${left}px`;panel.style.width=`${right-left}px`;panel.style.top='auto';panel.style.bottom=`${innerHeight-bottom}px`;return;}
    panel.style.width=`${Math.min(280,right-left)}px`;const h=panel.getBoundingClientRect().height,w=panel.getBoundingClientRect().width;
    panel.style.left=`${Math.max(left,Math.min(a.left,right-w))}px`;panel.style.top=`${Math.max(top,Math.min(a.bottom+4+h<=bottom?a.bottom+4:a.top-h-4,bottom-h))}px`;panel.style.bottom='auto';
  }
  function wireMenus(scope){for(const owner of scope.querySelectorAll('.cm-more')){if(owner.dataset.wired)continue;owner.dataset.wired='1';const trigger=owner.querySelector('summary');trigger.setAttribute('aria-expanded','false');
    const panel=owner.querySelector('.cm-menu'),actions=[...panel.children].filter(el=>el.matches('button[data-action]'));
    const danger=new Set('retire deleteRace deleteSlot deleteWorld resetRaceScores honorRevoke honorDeleteType seriesStop breedRetire'.split(' '));
    const edit=new Set('editHorse editRace editTrack renameWorld saveSlot breedPin honorCopyType seriesEdit seriesCopy replaceRecommendations'.split(' '));
    const categories=new Map();for(const button of actions){const a=button.dataset.action,key=danger.has(a)?'需确认操作':a.startsWith('export')||a.startsWith('contentExport')?'导出':edit.has(a)?'编辑':'查看与操作';if(!categories.has(key))categories.set(key,[]);categories.get(key).push(button);if(danger.has(a))button.dataset.danger='true';}
    if(categories.size>1)for(const key of ['查看与操作','编辑','导出','需确认操作'])if(categories.has(key)){const group=node('div','cm-menu-section');group.append(node('small','',key),...categories.get(key));panel.append(group);}

    trigger.addEventListener('click',ev=>{ev.preventDefault();if(floating?.owner===owner){closeMenu();return;}closeMenu(false);owner.open=true;trigger.setAttribute('aria-expanded','true');
      const panel=owner.querySelector('.cm-menu'), host=owner.closest('dialog')||owner.closest('#chairmanApp')||scope;
      const heading=node('div','cm-menu-heading'), title=node('strong','',owner.dataset.menuTitle||trigger.textContent), close=node('button','','关闭');close.type='button';close.addEventListener('click',()=>closeMenu());heading.append(title,close);panel.prepend(heading);
      const shade=node('div','cm-menu-shade');shade.addEventListener('click',()=>closeMenu());host.append(shade,panel);panel.classList.add('cm-floating-menu');floating={owner,panel,shade};positionMenu();panel.querySelector('button:not(.cm-menu-heading button)')?.focus({preventScroll:true});
    });
  }}
  document.addEventListener('pointerdown',ev=>{if(floating&&!floating.owner.contains(ev.target)&&!floating.panel.contains(ev.target))closeMenu();});
  document.addEventListener('keydown',ev=>{if(!floating)return;if(ev.key==='Escape'){ev.preventDefault();ev.stopImmediatePropagation();closeMenu();}else if(ev.key==='Tab'){const buttons=[...floating.panel.querySelectorAll('button:not(:disabled)')];const index=buttons.indexOf(document.activeElement);if(ev.shiftKey&&index<=0){ev.preventDefault();buttons.at(-1)?.focus();}else if(!ev.shiftKey&&index===buttons.length-1){ev.preventDefault();buttons[0]?.focus();}}},true);
  document.addEventListener('click',ev=>{if(floating&&ev.target.closest('[data-action]')&&floating.panel.contains(ev.target)){queueMicrotask(()=>closeMenu());}},false);
  window.addEventListener('resize',positionMenu);document.addEventListener('scroll',ev=>{if(floating&&!floating.panel.contains(ev.target))positionMenu();},true);
  const groups = [
    {id:'overview',label:'总览',icon:'◈',items:[['overview','工作概览','overview']]},
    {id:'events',label:'赛事',icon:'⚑',items:[['calendar','赛历','calendar','calendar','races'],['results','赛果与评分','results'],['tracks','马场','calendar','calendar','tracks'],['regions','地区','calendar','calendar','regions'],['series','系列赛','calendar','calendar','series']]},
    {id:'horses',label:'马匹',icon:'♞',items:[['horses','马匹档案','horses'],['library','基础血统库','breeding','breeding','library'],['active','繁殖群','breeding','breeding','active'],['candidate','待用马','breeding','breeding','candidate'],['plans','年度配种','breeding','breeding','plans'],['young','幼驹','breeding','breeding','young'],['breedBoards','繁殖榜单','breeding','breeding','boards']]},
    {id:'honors',label:'荣誉',icon:'✧',items:[['awards','年度奖项','awards'],['boards','评分与奖金榜','boards'],['hall','殿堂','hall','honors','candidates'],['council','评议会','hall','honors','council']]},
    {id:'manage',label:'管理',icon:'☷',items:[['settings','世界规则','settings','settings','rules'],['saves','游戏与备份','settings','settings','saves'],['storage','存储信息','settings','settings','storage']]}
  ];
  const routes=groups.flatMap(g=>g.items.map(([id,label,tab,section,value])=>({id,label,tab,section,value,group:g.id})));
  function routeFor(world,tab){
    return routes.find(r=>{
      if(r.tab!==tab)return false;
      if(!r.section)return true;
      if(r.section==='breeding')return (world.ui.breedingFilter?.view||'active')===r.value;
      if(r.section==='honors')return (world.ui.honors?.view==='council')===(r.value==='council');
      const view=world.ui.layout?.[r.section]||(r.section==='calendar'?'races':'rules');
      return (view==='background'?'races':view)===r.value;
    })||routes.find(r=>r.tab===tab)||routes[0];
  }
  function routePatch(world,route){
    const layout={...world.ui.layout}, current=world.ui.breedingFilter||{};
    if(current.view)layout.breedingViews={...layout.breedingViews,[current.view||'active']:{...current}};
    if(world.ui.honors?.view&&world.ui.honors.view!=='council')layout.hallView=world.ui.honors.view;
    const patch={tab:route.tab,layout};
    if(route.section==='breeding')patch.breedingFilter={...(layout.breedingViews?.[route.value]||(current.view===route.value?current:{})),view:route.value};
    else if(route.section==='honors')patch.honors={...world.ui.honors,view:route.value==='council'?'council':layout.hallView||'candidates'};
    else if(route.section)layout[route.section]=route.value;
    return patch;
  }
  function routeButton(route,current){const action=route.section==='calendar'&&route.id!=='calendar'?'calendarView':route.section==='settings'&&route.id!=='settings'?'settingsView':route.section==='breeding'?'breedView':route.section==='honors'&&route.id==='council'?'honorView':'tab';const id=action==='tab'?route.tab:route.value;return `<button type="button" data-action="${action}" data-id="${id}" data-route="${route.id}" ${route.id===current.id?'aria-current="page"':''}>${e(route.label)}</button>`;}
  function navigation(current){return `<div class="cm-nav-brand"><img src="assets/home/chairman.svg" alt="" width="30" height="30"><div><strong>国际马会</strong><small>主席工作台</small></div></div>${groups.map(g=>`<section class="cm-nav-group"><button type="button" data-action="workbenchGroup" data-id="${g.id}" aria-expanded="${g.id===current.group}" ${g.id===current.group?'aria-current="true"':''}><span aria-hidden="true">${g.icon}</span>${g.label}</button><div class="cm-group-links" ${g.id===current.group?'':'hidden'}>${routes.filter(r=>r.group===g.id).map(r=>routeButton(r,current)).join('')}</div></section>`).join('')}`;}
  function pageSwitch(current){const g=groups.find(g=>g.id===current.group);return more(routes.filter(r=>r.group===current.group).map(r=>routeButton(r,current)).join(''),'切换页面');}
  function enhanceViews(scope){for(const area of scope.querySelectorAll('.cm-tabs')){if(area.dataset.viewSelect)continue;area.dataset.viewSelect='true';const label=node('label','cm-view-select',area.querySelector('[data-action=calendarView]')?'赛事范围':'当前视图'),select=document.createElement('select');for(const b of area.querySelectorAll(':scope > button')){const o=new Option(b.textContent,String(select.options.length),false,b.hasAttribute('aria-current'));select.add(o);}select.addEventListener('change',()=>area.querySelectorAll(':scope > button')[Number(select.value)]?.click());label.append(select);area.before(label);area.hidden=true;}}
  const queryForms=new Set(['world:filter','world:sourceFilter','officeFilter','breedFilter','seriesFilter','honorFilter','honorHistoryFilter','candidateSearch','honorCandidateSearch','honorNominationSearch','awardYear','breedBoard','honorScope','honorAwardScope','honorHistoryScope','filter']);
  const writeActions=new Set('world:qualification world:source world:referencePreview world:referenceApply world:confirm world:region world:track world:race world:meeting world:traffic world:populate advance fast finish editHorse editRace editTrack editRegion retire deleteRace confirmEdit autoRating generate applyCSV prepPreview prepApply saveSlot confirmSaveSlot restore confirmRestore loadSlot confirmLoadSlot annualAuto saveOneScore saveRaceScores useTfBenchmark defaultWtrDraft replaceRecommendations confirmReplaceRecommendations resetRaceScores confirmResetScores hideResult hideCancelled confirmHideCancelled pickAward breedEnable breedFoundation breedIntroduce breedApplyCreation breedApplyIntroduction breedMate breedCancel breedPin breedRetire honorEditType honorCopyType honorDeleteType honorConfirmDeleteType honorAssociation honorSettings honorExclude honorAnnualVotes honorGenerateHall honorNominate honorInduct honorRevoke honorRevote honorConfirmRevote honorApplyRound honorApplySuggestions honorPickLocal contentImport contentApply familyIntroduce familyApply seriesEdit seriesCopy seriesStop seriesConfirm seriesConfirmStop worldEditorToggle worldEditEnable worldEditDiscardDisable worldEditHorse worldEditTemplate worldEditParent worldEditApply worldEditUndo worldTemplateReset'.split(' '));
  function access(scope,writable){
    if(writable)return;
    const reason='当前为只读：请在游戏与备份中重新取得编辑权。';
    for(const el of scope.querySelectorAll('[data-action]'))if(writeActions.has(el.dataset.action)){el.disabled=true;el.title=reason;el.setAttribute('aria-label',`${el.textContent}（只读，不可操作）`);}
    for(const form of scope.querySelectorAll('form[data-form]'))if(!queryForms.has(form.dataset.form))for(const el of form.querySelectorAll('input,select,textarea,button:not([data-action])')){el.disabled=true;el.title=reason;}
    scope.querySelectorAll('[data-performance]').forEach(el=>{el.disabled=true;el.title=reason;});
  }
  function enhance(scope) {
    scope.querySelectorAll('form').forEach(form=>{if(queryForms.has(form.dataset.form)&&!['honorScope','honorAwardScope','honorHistoryScope'].includes(form.dataset.form))enhanceFilters(form);});
    enhanceTables(scope);
    enhanceViews(scope);
    wireMenus(scope);
    for (const form of scope.querySelectorAll('form[data-form="horse"],form[data-form="race"],form[data-form="track"],form[data-form="breedMating"],form[data-form="honorType"],form[data-form="worldEdit"],form[data-form^="world:"]:not([data-form="world:filter"]):not([data-form="world:sourceFilter"])')) {
      if (!form.id) form.id = "cm-edit-form";
      const actions = form.querySelector(":scope > .cm-actions,:scope > .cm-sticky-actions") || form.querySelector(":scope > button:not([type=button])");
      if (actions) { let group = actions; if (actions.tagName === "BUTTON") { group = node("div", "cm-sticky-actions"); actions.replaceWith(group); group.append(actions); } else group.classList.add("cm-sticky-actions"); for (const button of group.querySelectorAll("button")) if (button.type === "submit") { button.setAttribute("form", form.id); button.classList.add("cm-primary"); } }
    }
    for (const form of scope.querySelectorAll('form[data-form="horse"]')) {
      if (form.dataset.grouped) continue; form.dataset.grouped = "1";
      const grid = form.querySelector(".cm-form-grid"); if (!grid) continue;
      const groups = [["身份", /^(name|gender|age|birthYear|homeRegion|owner|coat)$/], ["竞赛参数", /^(strength|weight|distMin|coreDist|distMax)$/], ["成长与适性", /^(growthType|peakStart|peakEnd|temperamentLabel|heavyType|surfaceGrades\.|trackAptitudes\.)/], ["血统与繁殖", /./]];
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
      if (el.tagName === "H2" && el.textContent === "备份与恢复") key = "saves";
      if (el.tagName === "H3" && el.textContent === "保存与容量") key = "storage";
      sections[key].append(el);
    }
    scope.innerHTML = tabs([["rules", "世界规则"], ["saves", "备份与恢复"], ["storage", "存储信息"]], view, "settingsView", button);
    for (const [id, el] of Object.entries(sections)) { el.hidden = id !== view; scope.append(el); }
    const capacity = sections.storage.querySelector("p:last-child"); if (capacity?.textContent.includes("配额")) { const d = node("details", "cm-help"); d.append(node("summary", "", "容量详情")); capacity.replaceWith(d); d.append(capacity); }
  }
  ns.ChairmanUI = { clearPrivate, access, groups, routes, routeFor, routePatch, navigation, pageSwitch, useLayout, context, capture, restore, closeMenu, wireMenus, escape: e, more, help, toolbar, tabs, enhance, settings };
})();
