const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const { JSDOM } = require("jsdom");
const { loadEraRules } = require("./helpers/project-loader");
test("era UI renders candidate, naming, schedule and spoiler-safe yearbook", () => {
 const p = loadEraRules(), n = p.rules;
 vm.runInContext(fs.readFileSync("js/ui/era-render.js", "utf8"), p.context);
 const d = new JSDOM('<div id="era"></div>').window.document, box = d.getElementById("era");
 const setup = n.EraRules.createEntrySetup({ seed: 1998 });
 n.EraUI.render(box, null, { entrySetup: setup }); assert.ok(box.querySelector("[data-era-select-candidate]"));
 const run = n.EraRules.selectEntryCandidate(setup, setup.candidates[0].id);
 n.EraUI.render(box, run, { showHub: false }); assert.ok(box.querySelector("#eraEncounterHorseName"));
 n.EraRules.completeEncounterNaming(run, '<script>坏名字</script>');
 n.EraUI.render(box, run, { showHub: false, scheduleOpen: true });
 assert.equal(box.querySelectorAll("script").length, 0);
 assert.ok(box.querySelector("[data-era-register]"));
 assert.ok(box.querySelector("[data-era-yearbook]").textContent.includes("已发生0/234"));
 assert.ok(!box.querySelector("[data-era-yearbook]").textContent.includes("史实冠军"));
});

test("yearbook separates historical starters, legacy counts and simulated fields", () => {
 const p = loadEraRules(), n = p.rules;
 vm.runInContext(fs.readFileSync("js/ui/era-render.js", "utf8"), p.context);
 const box = new JSDOM('<div></div>').window.document.querySelector('div');
 const run = n.EraRules.createRun({ seed: 99, horseName: "人数验证" });
 const ids = ["1999-satsuki-sho", "1999-takamatsunomiya-kinen", "1999-japan-cup", "1999-arima-kinen", "1998-mainichi-hai"];
 run.settled.push(...ids);
 run.worldResults["1999-japan-cup"] = { kind: "simulated", winnerId: "player", playerRank: 1, fieldSize: 15 };
 n.EraUI.render(box, run, { showHub: false });
 const rows = [...box.querySelectorAll('[data-era-yearbook] details')];
 for (const [date,count] of [["1999-04-18",17],["1999-05-23",16],["1999-11-28",14],["1999-12-26",14]]) assert.ok(rows.find(d=>d.textContent.includes(date)).textContent.includes(`史实起跑${count}头`));
 assert.ok(box.textContent.includes("本局阵容15头"));
 assert.ok(box.textContent.includes("旧年鉴口径"));
 n.EraAlmanac.race("1999-japan-cup").starterCount = null;
 n.EraUI.render(box, run, { showHub: false });
 assert.ok(box.textContent.includes("史实起跑数待核实"));
});

test("review labels follow captured content status without approving old snapshots", () => {
 const p = loadEraRules(), n = p.rules;
 vm.runInContext(fs.readFileSync("js/ui/era-render.js", "utf8"), p.context);
 const box = new JSDOM('<div></div>').window.document.querySelector('div');
 const run = n.EraRules.createRun({ seed: 44, horseName: "标签验证" });
 const id = "jp.era.1999.scene.tenno-spring-after";
 const content = n.EraTextIndex.resolve(id, { DATE: "1999-05-02", PLAYER_HORSE_NAME: "标签验证", FINISH: "1着" });
 run.storylets.pending = [{ id: "label-check", textId: id, content, choices: [] }];
 run.news.push({ id: "old", date: "1999-05-02", kind: "historical", source: "note", status: "draft", title: "快照标题", body: "快照正文", read: true });
 const before = JSON.stringify(run);
 n.EraUI.render(box, run, { showHub: false, newspaperOpen: true });
 assert.equal(box.querySelector('[data-era-current-scene] .eyebrow').textContent, "正文已定稿");
 assert.ok(box.querySelector('[data-era-newspaper-drawer]').textContent.includes("新闻快照 · 未标为定稿"));
 assert.equal(JSON.stringify(run), before);
 run.storylets.pending[0].content = { ...content, status: "draft" };
 n.EraUI.render(box, run, { showHub: false });
 assert.equal(box.querySelector('[data-era-current-scene] .eyebrow').textContent, "正文快照 · 草稿待审");
 run.storylets.pending[0].content = n.EraTextIndex.resolve("jp.era.1998.scene.opening", {});
 n.EraUI.render(box, run, { showHub: false });
 assert.ok(box.querySelector('[data-era-current-scene] .eyebrow').textContent.includes("草稿待审"));
 n.EraUI.render(box, run, { showHub: true });
 assert.ok(box.textContent.includes("正文审核状态逐项标注"));
 assert.ok(!box.textContent.includes("全部已定稿"));
});

test("era first-page navigation only changes the view and keeps prose intact", () => {
 const p = loadEraRules(), n = p.rules;
 vm.runInContext(fs.readFileSync("js/ui/era-render.js", "utf8"), p.context);
 const box = new JSDOM('<div></div>').window.document.querySelector('div');
 const run = n.EraRules.createRun({ seed: 44, horseName: "导航验证" });
 const before = JSON.stringify(run);
 for (const activePanel of [undefined, "scene", "timeline", "yearbook", "encyclopedia", "invalid"]) {
  n.EraUI.render(box, run, { activePanel });
  const selected = ["timeline", "yearbook", "encyclopedia"].includes(activePanel) ? activePanel : "scene";
  assert.equal(box.querySelectorAll('[data-era-panel]:not([hidden])').length, 1);
  assert.equal(box.querySelector('[data-era-panel]:not([hidden])').dataset.eraPanel, selected);
  assert.equal(box.querySelector('[data-era-panel-select][aria-pressed="true"]').dataset.eraPanelSelect, selected);
  assert.ok(!box.querySelector('.era-full-dossier').open);
  assert.ok(!box.querySelector('.era-more').open);
  assert.equal(JSON.stringify(run), before);
 }
 const setup = n.EraRules.createEntrySetup({ seed: 1998 });
 const naming = n.EraRules.selectEntryCandidate(setup, setup.candidates[0].id);
 n.EraUI.render(box, naming, {});
 assert.equal(box.querySelector('[data-era-name-horse]').textContent, "确认名字，进入1998–1999赛季");
 assert.ok(!box.textContent.includes('${label}'));
 run.ended = true;
 n.EraUI.render(box, run, {});
 assert.ok(box.querySelector('[data-era-summary]').textContent.includes("1998–1999生涯总结"));
 assert.ok(box.querySelector('[data-era-summary]').textContent.includes("累计"));
 assert.equal(box.querySelector('[data-era-retire]'), null);
});

test("era panel click leaves run, storage, focus and expanded records untouched", () => {
 const p = loadEraRules(), n = p.rules;
 vm.runInContext(fs.readFileSync("js/ui/era-render.js", "utf8"), p.context);
 const dom = new JSDOM('<div id="eraOverlay"></div>'), box = dom.window.document.querySelector('div');
 const setup = n.EraRules.createEntrySetup({ seed: 44 });
 const run = n.EraRules.selectEntryCandidate(setup, setup.candidates[0].id);
 n.EraUI.render(box, run, {});
 const state = {};
 n.EraApp.create({ state, document: dom.window.document }).bind();
 const before = JSON.stringify(run);
 const record = box.querySelector('[data-era-encyclopedia] details');
 record.open = true;
 const input = box.querySelector('#eraEncounterHorseName');
 assert.ok(input);
 input.value = '未确认名字';
 for (const id of ['encyclopedia', 'yearbook', 'timeline', 'scene']) {
  const button = box.querySelector(`[data-era-panel-select="${id}"]`);
  button.focus(); button.click();
  assert.equal(dom.window.document.activeElement, button);
  assert.equal(state.eraActivePanel, id);
  assert.equal(box.querySelector('[data-era-panel]:not([hidden])').dataset.eraPanel, id);
  assert.equal(JSON.stringify(run), before);
  assert.ok(record.open);
  if (input) assert.equal(input.value, '未确认名字');
 }
});

test("record directories filter years, titles and player starts without changing run", () => {
 const p = loadEraRules(), n = p.rules;
 vm.runInContext(fs.readFileSync('js/ui/era-render.js','utf8'), p.context);
 const box = new JSDOM('<div></div>').window.document.querySelector('div');
 const run = n.EraRules.createRun({seed:44,horseName:'目录验证'});
 run.date='1999-01-05';
 run.settled.push('1998-mainichi-hai','1999-japan-cup');
 run.worldResults['1999-japan-cup']={kind:'simulated',winnerId:'player',playerRank:1,fieldSize:15};
 const before=JSON.stringify(run);
 n.EraUI.render(box,run,{});
 const apply=(id,values)=>{const section=box.querySelector(`[data-era-records="${id}"]`);for(const [key,value] of Object.entries(values))section.querySelector(`[data-era-filter="${key}"]`).value=value;n.EraUI.filterRecords(section);return [...section.querySelectorAll('[data-era-record]')].filter(r=>!r.hidden);};
 let rows=apply('encyclopedia',{year:'1999',category:'horse',query:'好歌剧'});
 assert.equal(rows.length,1); assert.ok(rows[0].textContent.includes('好歌剧'));
 rows=apply('encyclopedia',{query:'不存在的标题'});assert.equal(rows.length,0);
 assert.equal(box.querySelector('[data-era-records="encyclopedia"] [data-era-empty]').hidden,false);
 rows=apply('yearbook',{scope:'player'});assert.equal(rows.length,1);assert.ok(rows[0].textContent.includes('本局阵容15头'));
 rows=apply('yearbook',{scope:'',year:'1998'});assert.equal(rows.length,1);assert.ok(rows[0].textContent.includes('旧年鉴口径'));
 const all=n.EraRules.getScheduleOptions(run);
 rows=apply('schedule',{});assert.ok(rows.every(r=>r.dataset.future==='true'||r.dataset.scheduled==='true'));
 rows=apply('schedule',{scope:'available'});
 assert.equal(rows.length,all.filter(r=>r.enabled||r.status==='scheduled').length);
 rows=apply('schedule',{scope:'',year:'1998',month:'03'});assert.ok(rows.every(r=>r.dataset.year==='1998'&&r.dataset.month==='03'));
 assert.equal(JSON.stringify(run),before);
});

test("unread filters, expanded records and scroll survive read refresh", () => {
 const p=loadEraRules(),n=p.rules;
 vm.runInContext(fs.readFileSync('js/ui/era-render.js','utf8'),p.context);
 const dom=new JSDOM('<div></div>'),box=dom.window.document.querySelector('div');
 const run=n.EraRules.createRun({seed:44,horseName:'报纸验证'}),browseState={};
 run.news.push({id:'old',date:'1998-12-27',kind:'historical',status:'draft',title:'旧新闻',body:'冻结正文',read:true},{id:'new',date:'1999-01-05',kind:'historical',status:'draft',title:'新新闻',body:'已存正文',read:false});
 n.EraUI.render(box,run,{browseState,newspaperOpen:true});
 const records=box.querySelector('[data-era-records="news"]');
 records.querySelector('[data-era-filter="scope"]').value='unread';n.EraUI.filterRecords(records);
 assert.equal([...records.querySelectorAll('[data-era-record]')].filter(r=>!r.hidden).length,1);
 const detail=box.querySelector('[data-era-encyclopedia] details');detail.open=true;
 box.scrollTop=80;box.querySelector('[data-era-newspaper-drawer]').scrollTop=120;
 const read=box.querySelector('[data-era-news-read]');read.focus();
 n.EraRules.readNews(run,'new');
 n.EraUI.render(box,run,{browseState,newspaperOpen:true});
 const updated=box.querySelector('[data-era-records="news"]');
 assert.equal(updated.querySelector('[data-era-filter="scope"]').value,'unread');
 assert.equal(updated.querySelector('[data-era-empty]').hidden,false);
 assert.equal(dom.window.document.activeElement,updated.querySelector('[data-era-filter]'));
 assert.ok(box.querySelector('[data-era-encyclopedia] details').open);
 assert.equal(box.scrollTop,80);assert.equal(box.querySelector('[data-era-newspaper-drawer]').scrollTop,120);
 assert.equal(run.news[1].body,'已存正文');assert.equal(run.news[1].status,'draft');
 assert.ok(box.querySelector('[data-era-newspaper-open]').textContent.includes('0未读'));
});

test("real app delegation handles filter input, select change and reset", () => {
 const p=loadEraRules(),n=p.rules;
 vm.runInContext(fs.readFileSync('js/ui/era-render.js','utf8'),p.context);
 const dom=new JSDOM('<div id="eraOverlay"></div>'),box=dom.window.document.querySelector('div');
 const run=n.EraRules.createRun({seed:44,horseName:'事件验证'});
 n.EraUI.render(box,run,{});
 n.EraApp.create({ state: {}, document: dom.window.document }).bind();
 const s=box.querySelector('[data-era-records="encyclopedia"]'),before=JSON.stringify(run);
 const query=s.querySelector('[data-era-filter="query"]');query.value='没有这个标题';query.dispatchEvent(new dom.window.Event('input',{bubbles:true}));
 assert.equal(s.querySelector('[data-era-empty]').hidden,false);
 s.querySelector('[data-era-filter-reset]').click();assert.equal(query.value,'');
 const year=s.querySelector('[data-era-filter="year"]');year.value='1999';year.dispatchEvent(new dom.window.Event('change',{bubbles:true}));
 assert.ok([...s.querySelectorAll('[data-era-record]')].filter(r=>!r.hidden).every(r=>r.dataset.year==='1999'));
 assert.equal(JSON.stringify(run),before);
});

test('ended yearbook separates unlocked history from settled races and offers read-only review', () => {
 const p=loadEraRules(),n=p.rules;
 vm.runInContext(fs.readFileSync('js/ui/era-render.js','utf8'),p.context);
 const dom=new JSDOM('<div id="eraOverlay"></div>'),box=dom.window.document.querySelector('div');
 const run=n.EraRules.createRun({seed:44,horseName:'回看验证'});
 n.EraApp.create({state:{},document:dom.window.document}).bind();
 for(const [date,ids] of [['1998-01-01',[]],['1999-01-05',['1998-mainichi-hai']],['1999-12-31',n.EraWorld.scenarioRaces(run).map(r=>r.id)]]){
  run.date=date;run.ended=true;run.settled=ids;
  const before=JSON.stringify(run);
  n.EraUI.render(box,run,{showHub:true});assert.equal(box.querySelector('[data-era-continue]').textContent,'回看 回看验证 的生涯');
  n.EraUI.render(box,run,{});
  const y=box.querySelector('[data-era-yearbook]');
  assert.ok(y.querySelector('h2').textContent.includes('开放查阅234场'));
  assert.ok(y.textContent.includes(`本局已结算${ids.length}/234场`));
  assert.equal(y.querySelector('[data-era-filter="scope"] option').textContent,'全部开放赛事');
  assert.equal(y.querySelectorAll('[data-era-record]').length,234);
  const first=y.querySelector('[data-era-record]');
  assert.ok(first.textContent.includes(ids.length===234?'本局已结算':'结束后开放 · 史实资料'));
  assert.ok(!first.textContent.includes('本局冠军'));
  box.querySelector('[data-era-summary] [data-era-panel-select="yearbook"]').click();
  assert.equal(box.querySelector('[data-era-panel]:not([hidden])').dataset.eraPanel,'yearbook');
  assert.equal(JSON.stringify(run),before);
 }
});

test('empty records distinguish no content, read news and filtered player starts', () => {
 const p=loadEraRules(),n=p.rules;
 vm.runInContext(fs.readFileSync('js/ui/era-render.js','utf8'),p.context);
 const box=new JSDOM('<div></div>').window.document.querySelector('div');
 const run=n.EraRules.createRun({seed:44,horseName:'空态验证'});
 n.EraUI.render(box,run,{});
 const message=id=>box.querySelector(`[data-era-records="${id}"] [data-era-empty]`).textContent;
 assert.ok(message('news').includes('尚无新闻'));assert.ok(message('timeline').includes('尚无生涯纪事'));assert.ok(message('yearbook').includes('尚无已结算'));
 assert.equal(box.querySelector('[data-era-timeline]').textContent.split('尚无生涯纪事').length-1,1);
 run.ended=true;n.EraUI.render(box,run,{});assert.equal(message('news'),'本次生涯没有收录新闻。');
 run.news.push({id:'read',date:'1998-01-01',title:'新闻',body:'快照原文',status:'draft',read:true});
 n.EraUI.render(box,run,{});
 const filter=(id,key,value)=>{const s=box.querySelector(`[data-era-records="${id}"]`);s.querySelector(`[data-era-filter="${key}"]`).value=value;n.EraUI.filterRecords(s);};
 filter('news','scope','unread');assert.ok(message('news').includes('全部新闻已读'));
 filter('yearbook','scope','player');assert.ok(message('yearbook').includes('本次生涯未参赛'));
 run.worldResults['1998-mainichi-hai']={kind:'simulated',winnerId:'player',playerRank:1,fieldSize:15};
 n.EraUI.render(box,run,{});filter('yearbook','scope','player');filter('yearbook','year','1999');
 assert.ok(message('yearbook').includes('当前条件无参赛记录'));
 assert.equal(run.news[0].body,'快照原文');assert.equal(run.news[0].status,'draft');
});

test('stable record links navigate across filters and return to a single source without saving', () => {
 const p=loadEraRules(),n=p.rules;
 vm.runInContext(fs.readFileSync('js/ui/era-render.js','utf8'),p.context);
 const dom=new JSDOM('<div id="eraOverlay"></div>'),box=dom.window.document.querySelector('div');
 const run=n.EraRules.createRun({seed:44,horseName:'互链验证'});run.ended=true;
 const state={eraRun:run,eraActivePanel:'encyclopedia',eraBrowseState:{}};
 n.EraUI.render(box,run,{activePanel:state.eraActivePanel,browseState:state.eraBrowseState});
 n.EraApp.create({state,document:dom.window.document}).bind();
 const before=JSON.stringify(run);
 const source=[...box.querySelectorAll('[data-entry-id]')].find(r=>r.dataset.entryId==='1999-entry-special-week');
 source.open=true;
 const y=box.querySelector('[data-era-records="yearbook"]');y.querySelector('[data-era-filter="year"]').value='1998';y.querySelector('[data-era-filter="scope"]').value='player';n.EraUI.filterRecords(y);
 box.scrollTop=123;
 const link=source.querySelector('[data-era-record-link^="yearbook:"]');link.focus();link.click();
 const target=[...box.querySelectorAll('[data-era-record]')].find(r=>r.dataset.eraRecord===link.dataset.eraRecordLink);
 assert.equal(state.eraActivePanel,'yearbook');assert.equal(target.hidden,false);assert.ok(target.open);assert.equal(dom.window.document.activeElement,target.querySelector('summary'));
 assert.equal(y.querySelector('[data-era-filter="year"]').value,'');assert.equal(y.querySelector('[data-era-filter="scope"]').value,'');
 const origin=state.eraBrowseState.origin;
 const reverse=target.querySelector('[data-era-record-link]');reverse.focus();reverse.click();assert.equal(state.eraBrowseState.origin,origin);
 box.querySelector('[data-era-source-return]').click();
 assert.equal(state.eraActivePanel,'encyclopedia');assert.equal(y.querySelector('[data-era-filter="year"]').value,'1998');assert.equal(y.querySelector('[data-era-filter="scope"]').value,'player');assert.equal(box.scrollTop,123);assert.equal(dom.window.document.activeElement,link);assert.ok(source.open);assert.equal(state.eraBrowseState.origin,undefined);
 assert.equal(JSON.stringify(run),before);
 assert.ok(source.querySelector('[data-era-record-link^="encyclopedia:"]'));
});

test('links omit unopened races and unknown targets preserve source and run', () => {
 const p=loadEraRules(),n=p.rules;
 vm.runInContext(fs.readFileSync('js/ui/era-render.js','utf8'),p.context);
 const box=new JSDOM('<div></div>').window.document.querySelector('div');
 const run=n.EraRules.createRun({seed:44,horseName:'边界验证'});
 n.EraUI.render(box,run,{activePanel:'encyclopedia'});
 const before=JSON.stringify(run);
 assert.equal(box.querySelectorAll('[data-era-record-link^="yearbook:"]').length,0);
 assert.equal(n.EraUI.navigateRecord(box,{},'yearbook:missing','encyclopedia'),null);
 assert.equal(box.querySelector('[data-era-panel]:not([hidden])').dataset.eraPanel,'encyclopedia');
 assert.ok(box.querySelector('[data-era-link-message]').textContent.includes('不可查阅'));
 assert.equal(JSON.stringify(run),before);
});

test('timeline race links use captured race ids and survive refresh before return', () => {
 const p=loadEraRules(),n=p.rules;
 vm.runInContext(fs.readFileSync('js/ui/era-render.js','utf8'),p.context);
 const box=new JSDOM('<div></div>').window.document.querySelector('div');
 const run=n.EraRules.createRun({seed:44,horseName:'纪事定位'});
 run.settled.push('1998-mainichi-hai');run.timeline.push({id:'captured-race',date:'1998-03-29',raceId:'1998-mainichi-hai',content:{title:'已存标题',body:'已存正文'}});
 const browse={};n.EraUI.render(box,run,{activePanel:'timeline',browseState:browse});
 const source=box.querySelector('[data-era-records="timeline"] details');source.open=true;
 const link=source.querySelector('[data-era-record-link]');link.focus();
 const before=JSON.stringify(run);
 assert.equal(n.EraUI.navigateRecord(box,browse,link.dataset.eraRecordLink,'timeline'),'yearbook');
 n.EraUI.render(box,run,{activePanel:'yearbook',browseState:browse});
 assert.ok(box.querySelector('[data-era-source-return]'));
 assert.equal(n.EraUI.returnToSource(box,browse),'timeline');
 assert.ok(box.querySelector('[data-era-records="timeline"] details').open);
 assert.equal(JSON.stringify(run),before);
});

test('annual review notes are outside frozen prose and preserve snapshot grouping', () => {
 const p=loadEraRules(),n=p.rules;
 vm.runInContext(fs.readFileSync('js/ui/era-render.js','utf8'),p.context);
 const box=new JSDOM('<div></div>').window.document.querySelector('div');
 const run=n.EraRules.createRun({seed:44,horseName:'跨年说明'});run.date='1999-01-05';
 const scene={id:'year-end-transition',textId:'jp.era.1998.scene.year-end',date:'1999-01-05',content:{title:'冻结标题',body:'冻结正文',status:'draft'},choices:[]};
 run.storylets.pending=[scene];run.timeline=[JSON.parse(JSON.stringify(scene))];
 const before=JSON.stringify(run);
 n.EraUI.render(box,run,{});
 assert.ok(box.querySelector('.era-editorial-header .eyebrow').textContent.includes('1999赛季'));
 const current=box.querySelector('[data-era-current-scene]');
 assert.equal(current.querySelector('h2').textContent,'冻结标题');
 assert.equal(current.querySelector('[data-era-review-note]').nextElementSibling.textContent,'冻结正文');
 assert.ok(current.querySelector('[data-era-review-note]').textContent.includes('1998年度回顾'));
 assert.ok(current.querySelector('[data-era-review-note]').textContent.includes('1999-01-05'));
 assert.ok(box.querySelector('[data-era-records="timeline"] [data-era-group] h3').textContent.includes('1999年1月'));
 assert.equal(JSON.stringify(run),before);
 run.storylets.pending[0]={...scene,id:'unknown-old',textId:'jp.era.1998.scene.year-end'};
 n.EraUI.render(box,run,{});assert.equal(box.querySelector('[data-era-current-scene] [data-era-review-note]'),null);
 run.ended=true;run.storylets.pending=[];
 n.EraUI.render(box,run,{});
 assert.ok(box.querySelector('.era-editorial-header .eyebrow').textContent.includes('生涯已结束'));
 assert.ok(!box.querySelector('[data-era-summary]').textContent.includes('尚未接入'));
 assert.ok(box.querySelector('.era-more [data-era-coverage-note]').textContent.includes('1996、1997、2000尚未接入'));
 n.EraUI.render(box,run,{showHub:true});assert.ok(box.querySelector('[data-era-coverage-note]'));
});
