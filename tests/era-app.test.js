const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { JSDOM } = require('jsdom');
const { loadEraRules } = require('./helpers/project-loader');

function harness() {
 const p=loadEraRules(), n=p.rules;
 vm.runInContext(fs.readFileSync('js/ui/era-render.js','utf8'),p.context);
 const dom=new JSDOM('<div id="eraOverlay"></div>');
 const state={eraRun:null,eraEntrySetup:null,eraShowHub:true,eraActivePanel:'scene',eraBrowseState:{}};
 const data=new Map(), writes=[];
 const storage={getItem:k=>data.get(k)||null,setItem:(k,v)=>{data.set(k,v);writes.push(k === "keiba-era-save-v1" ? JSON.parse(v) : v);},removeItem:k=>data.delete(k)};
 let controller;
 controller=n.EraApp.create({state,document:dom.window.document,getStorage:()=>storage,refresh:()=>controller.render(),showHome:()=>{},alert:()=>{},confirm:()=>true});
 controller.bind();
 return {n,state,data,writes,storage,controller,box:dom.window.document.querySelector('div')};
}

test('controller preserves save envelope, silent saves and blocked writes',()=>{
 const h=harness();
 h.state.eraRun=h.n.EraRules.createRun({seed:44,horseName:'合同验证'});
 assert.equal(h.controller.save(),true);
 const saved=JSON.parse(h.data.get('keiba-era-save-v1'));
 assert.deepEqual(Object.keys(saved),['version','savedAt','entrySetup','run']);
 assert.equal(saved.version,3);assert.ok(saved.savedAt);
 assert.equal(JSON.stringify(saved.run),JSON.stringify(h.state.eraRun));
 h.state.eraSaveMessage='保留提示';h.controller.save({silent:true});assert.equal(h.state.eraSaveMessage,'保留提示');
 h.state.eraSaveBlocked=true;const count=h.writes.length;
 assert.equal(h.controller.save(),false);assert.equal(h.writes.length,count);
 h.state.eraSaveBlocked=false;h.controller.load();assert.equal(JSON.stringify(h.state.eraRun),JSON.stringify(saved.run));
});

test('controller actions match direct rules including RNG and event ordering',()=>{
 const h=harness(), setup=h.n.EraRules.createEntrySetup({seed:44});
 const expected=h.n.EraRules.selectEntryCandidate(setup,setup.candidates[0].id);
 h.state.eraRun=JSON.parse(JSON.stringify(expected));h.state.eraShowHub=false;
 h.controller.render();
 h.box.querySelector('#eraEncounterHorseName').value='同种子';
 h.n.EraRules.completeEncounterNaming(expected,'同种子');
 h.box.querySelector('[data-era-name-horse]').click();
 assert.equal(JSON.stringify(h.state.eraRun),JSON.stringify(expected));
 for(let i=0;i<14;i++){
  const scene=h.n.EraRules.getCurrentScene(expected),choice=scene.choices[0];
  const result=h.n.EraRules.resolveSceneChoice(expected,scene.id,choice.id);
  h.box.querySelector(`[data-era-choice="${choice.id}"]`).click();
  assert.equal(JSON.stringify(h.state.eraRun),JSON.stringify(expected),`step ${i}`);
  if(result.type==='open-schedule')break;
 }
 assert.ok(h.writes.every(p=>p.version===3&&!('eraBrowseState' in p)&&!('eraActivePanel' in p)));
});

test('controller keeps corrupt and future save protection in EraSave',()=>{
 const h=harness();
 h.data.set('keiba-era-save-v1','broken');h.controller.load();
 assert.equal(h.data.get('keiba-era-save-legacy'),'broken');assert.equal(h.state.eraSaveBlocked,false);
 const run=h.n.EraRules.createRun({seed:44,horseName:'未来存档'});run.version+=1;
 const raw=JSON.stringify({version:3,run});h.data.set('keiba-era-save-v1',raw);h.controller.load();
 assert.equal(h.state.eraSaveBlocked,true);assert.equal(h.controller.save(),false);assert.equal(h.data.get('keiba-era-save-v1'),raw);
});
