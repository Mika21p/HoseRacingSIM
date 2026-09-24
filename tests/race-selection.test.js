const test=require('node:test'),assert=require('node:assert/strict'),{JSDOM}=require('jsdom');
const {loadChairmanRules}=require('./helpers/project-loader');
const plain=x=>JSON.parse(JSON.stringify(x));
function setup(){const n=loadChairmanRules().rules,S=n.RaceSelection;return {n,S,plan:(id,index=80)=>({race:n.RaceRegistry.all().find(r=>r.id===id),schedule:{...n.TimeRules.fromIndex(index),label:n.TimeRules.formatAgeHalf(n.TimeRules.fromIndex(index))}})};}
test('venue identity separates country, course and templates and honors stored snapshots',()=>{
 const {S,plan}=setup();assert.equal(S.label(plan('ascot-gold-cup').race),'英国－Ascot');assert.equal(S.label(plan('kentucky-derby').race),'美国－Churchill Downs');assert.equal(S.label(plan('japan-cup').race),'日本－东京');
 const r=plan('july-cup').race;assert.equal(S.venue(r).name,'Newmarket');assert.equal(S.venue(r).route,'July Course');
 const saved={...r,venueDisplay:{...S.venue(r),name:'当届马场',label:'英国－当届马场'}};assert.equal(S.label(saved),'英国－当届马场');
});
test('region gates tracks, search aliases and region removal preserve only applicable choices',()=>{
 const {S,plan}=setup(),plans=[plan('ascot-gold-cup'),plan('kentucky-derby'),plan('japan-cup')];
 const f=S.normalize({region:[],track:['ascot'],japanCourse:['tokyo'],course:['tokyo']}),ui={trackSearch:'abc'};
 let m=S.prepare(plans,f,ui);assert.equal(m.tracks.length,0);assert.equal(f.track.length,0);assert.equal(ui.trackSearch,'');assert.equal(f.japanCourse,undefined);
 f.region=['europe'];m=S.prepare(plans,f,ui);assert.equal(m.tracks.length,1);assert.ok(m.tracks[0].aliases.includes('雅士谷'));f.track=['ascot'];
 f.region.push('america');S.prepare(plans,f,ui);assert.deepEqual(plain(f.track),['ascot']);
 f.track.push('churchill-downs');f.region=['america'];S.prepare(plans,f,ui);assert.deepEqual(plain(f.track),['churchill-downs']);assert.match(ui.notice,/已清除/);
 f.grade=['g3'];m=S.prepare(plans,f,ui);assert.equal(m.plans.length,0);assert.equal(m.tracks.length,1);assert.equal(f.track.length,1);
});
test('selection is explicit, occurrence keyed, cleared when filtered out; preview draws no randomness',()=>{
 const {n,S,plan}=setup(),plans=[plan('ascot-gold-cup',80),plan('kentucky-derby',82),plan('japan-cup',84)],f=S.normalize({}),ui={};
 n.Random.withSource(()=>{throw Error('preview consumed randomness')},()=>{
  S.prepare(plans,f,ui);assert.equal(ui.selected,undefined);assert.equal(Object.keys(ui.months).length,2);
  ui.selected=S.key(plans[0]);f.region=['europe'];S.prepare(plans,f,ui);assert.equal(ui.selected,S.key(plans[0]));
  f.region=['america'];S.prepare(plans,f,ui);assert.equal(ui.selected,'');assert.match(ui.notice,/重新选择/);
 });
 assert.notEqual(S.key(plans[0]),S.key({...plans[0],schedule:{index:104}}));
});
test('compact rendering handles 60 plans and creates one confirmation only for the selected row',()=>{
 const {S,plan}=setup();const plans=Array.from({length:60},(_,i)=>plan(i%2?'ascot-gold-cup':'kentucky-derby',80+i)),f=S.normalize({}),ui={};
 let d=new JSDOM(S.render(plans,f,ui,null,r=>r.name));assert.equal(d.window.document.querySelectorAll('.rs-entry').length,60);assert.equal(d.window.document.querySelectorAll('.rs-month[open]').length,2);assert.equal(d.window.document.querySelector('#registerRaceBtn'),null);assert.equal(d.window.document.querySelector('[data-track-option]'),null);
 ui.selected=S.key(plans[4]);ui.revealSelection=true;d=new JSDOM(S.render(plans,f,ui,null,r=>r.name));assert.equal(d.window.document.querySelectorAll('#registerRaceBtn').length,1);assert.equal(d.window.document.querySelectorAll('#raceSelectionDetail').length,1);
});
