const test=require('node:test');
const assert=require('node:assert/strict');
const {loadChairmanRules}=require('./helpers/project-loader');
const {createFixtures}=require('../scripts/lib/chairman-scheduling-fixtures');
const A=require('../scripts/lib/chairman-scheduling-audit');
function setup(){const n=loadChairmanRules().rules,f=createFixtures(n),w=f.world();w.horses=w.horses.slice(0,1);return {n,f,w,h:w.horses[0],V:n.ChairmanWorld};}
function finish(g){let r=g.next();while(!r.done)r=g.next();return r.value;}

test('prestige boundaries, defaults, edit/reset, serialization and locked snapshots',()=>{
 const {n,w,V}=setup();w.horses=[];const track=w.tracks[0];
 const r={id:'custom',name:'custom',trackId:track.id,raceClass:'g1',surface:'草地',distance:1600,month:2,half:1,ageRule:'3+',sexRule:'all',capacity:16,prizes:V.prizes('g1')};
 for(const value of [0,100,null,undefined]){const v=V.edit(w,'race',{...r,prestige:value}).world.races[0];assert.equal(v.prestige,value??80);}
 for(const value of [-1,101,2.5,'80','',NaN,Infinity]){assert.throws(()=>n.ChairmanRules.validateRace(w,{...r,prestige:value}),/声望/);assert.throws(()=>V.edit(w,'race',{...r,prestige:value}),/声望/);}
 w.races=[{...r,sourceId:'japan-cup',prestige:98}];w.lockedRaces['1:custom']=V.resolveRace(w,w.races[0]);
 let changed=V.edit(w,'race',{id:'custom',prestige:0}).world;
 assert.equal(changed.races[0].prestige,0);assert.equal(changed.races[0].prestigeOverride,true);assert.equal(V.resolveRace(changed,changed.races[0]).prestige,98);
 assert.equal(V.resolveRace(changed,changed.races[0],2).prestige,0);
 changed=A.copy(changed);assert.equal(changed.races[0].prestige,0);
 changed=V.edit(changed,'race',{id:'custom',resetPrestige:true}).world;assert.equal(changed.races[0].prestige,98);assert.equal(changed.races[0].prestigeOverride,false);
});

test('v2 package round trip carries zero, rejects invalid prestige and keeps player reference overrides',()=>{
 const {n,V}=setup();let w=V.create({worldType:'reference',regionKeys:['japan'],population:{japan:0},breeding:false,seed:1});
 const r=w.races.find(r=>r.sourceId==='japan-cup');w=V.edit(w,'race',{id:r.id,prestige:0}).world;
 const pack=n.ChairmanWorldPackages.exportEvents(w,{raceIds:[r.id]});assert.equal(pack.races[0].prestige,0);
 const blank=V.create({worldType:'blank',breeding:false,seed:2});const imported=finish(n.ChairmanWorldPackages.previewSteps(blank,pack)).output.world;
 assert.equal(imported.races.find(r=>r.sourceId==='japan-cup').prestige,0);
 pack.races[0].prestige=101;assert.throws(()=>finish(n.ChairmanWorldPackages.previewSteps(blank,pack)),/声望/);
 w.prestigeVersion=0;const unmodified=w.races.find(x=>x.raceClass==='g1'&&x.id!==r.id);unmodified.prestige=1;unmodified.prestigeOverride=false;
 const refreshed=finish(n.ChairmanWorldPackages.referencePreview(w)).output.world;assert.equal(refreshed.races.find(x=>x.id===r.id).prestige,0);assert.equal(refreshed.races.find(x=>x.id===unmodified.id).prestige,n.ChairmanPrestige.reference(unmodified));
 const rng=[w.rngState,w.aiRngState,w.raceRngState];V.synchronize(w);assert.deepEqual([w.rngState,w.aiRngState,w.raceRngState],rng);
});

test('public strong horses prefer high prestige across seeds; weak horses retain an experience route',()=>{
 const {n,f,V}=setup();let chosen=0;
 for(let seed=1;seed<=30;seed++){const w=f.world();w.seed=seed;w.horses=w.horses.slice(0,1);w.races=[{...f.race(w,'high','g1'),prestige:95},{...f.race(w,'low','g1'),prestige:50}];V.plan(w);chosen+=w.horses[0].target.raceId==='high';}
 assert.ok(chosen>=27);
 const w=f.world(),h=w.horses[0];w.horses=[h];h.annual.manual=null;h.qualification=4;h.recentForm=[-1,-4].map(turn=>({turn,tf:80,surface:'草地',distance:1600,rank:8}));
 w.races=[{...f.race(w,'high','g1'),prestige:100},f.race(w,'local-op','op')];V.plan(w);assert.equal(h.target.raceId,'local-op');
});

test('prestige cannot erase established distance evidence or legal rest',()=>{
 const {f,w,h,V}=setup();h.recentForm=[-1,-4].map(turn=>({turn,tf:125,surface:'草地',distance:1200,rank:1}));
 w.races=[{...f.race(w,'long','g1',{distance:3200}),prestige:100},{...f.race(w,'sprint','g1',{distance:1200}),prestige:50}];V.plan(w);assert.equal(h.target.raceId,'sprint');
 h.booked=null;w.lockedRaces={};h.restUntil=12;V.plan(w);assert.equal(h.booked,null);assert.equal(h.target,null);
});

test('12-turn targets allow compatible prep or rest, protect overseas preparation and survive reload',()=>{
 const {f,w,h,V}=setup();w.races=[{...f.race(w,'goal','g1',{turn:8}),prestige:100},f.race(w,'prep','g3',{turn:0}),f.race(w,'conflict','g3',{turn:6})];
 V.plan(w);assert.equal(h.target.raceId,'goal');assert.equal(h.booked.raceId,'prep');assert.equal(h.scheduleReason,'目标前哨');
 const before=A.hash(w);V.plan(w);assert.equal(A.hash(w),before);
 w.turn=4;h.booked=null;V.plan(w);assert.equal(h.booked.raceId,'goal');
 w.turn=0;h.booked=null;w.races=w.races.filter(r=>r.id!=='prep');V.plan(w);assert.equal(h.booked,null);assert.equal(h.scheduleReason,'休整备战目标');
});

test('oversubscribed targets reserve legal fallback targets and calendar edits replan',()=>{
 const {f,V}=setup(),w=f.world();w.races=[{...f.race(w,'high','g1'),prestige:100,capacity:2},{...f.race(w,'fallback','g1'),prestige:80}];V.plan(w);
 assert.equal(w.horses.filter(h=>h.target.raceId==='high').length,2);assert.equal(w.horses.filter(h=>h.target.raceId==='fallback').length,10);
 assert.ok(w.horses.slice(2).every(h=>h.scheduleReason==='落选备选'));
 const before=A.hash(w);V.plan(w);assert.equal(A.hash(w),before);
 w.races[0].deleted=true;V.plan(w);assert.ok(w.horses.every(h=>h.target.raceId==='fallback'));
});

test('CSV copy/update preserves zero and rejects out-of-range prestige',()=>{
 const {n,V}=setup(),w=V.create({worldType:'reference',regionKeys:['japan'],population:{japan:0},breeding:false});const r=w.races[0];r.prestige=0;const sourceId=r.id;
 const text=n.ChairmanCSV.exportRows(w,'race',[sourceId]);
 const copied=n.ChairmanCSV.preview(w,'race',text,{mode:'copy'});assert.deepEqual(Array.from(copied.errors),[]);
 assert.equal(copied.output.world.races.find(r=>r.id===copied.changes[0].id).prestige,0);
 const updated=n.ChairmanCSV.preview(w,'race',text,{mode:'update'});assert.equal(updated.output.world.races.find(r=>r.id===sourceId).prestige,0);assert.equal(updated.output.world.races.find(r=>r.id===sourceId).prestigeOverride,true);
 const invalid=n.ChairmanCSV.preview(w,'race','模板版本,编号,比赛名,赛事声望\n1,'+sourceId+',无效声望测试,101',{mode:'update'});assert.equal(invalid.output,null);assert.ok(invalid.errors.some(x=>x.includes('声望')));
 const old=A.copy(w);delete old.races[0].prestige;const random=[old.rngState,old.aiRngState,old.raceRngState];V.synchronize(old);assert.equal(old.races[0].prestige,n.ChairmanPrestige.reference(old.races[0]));assert.deepEqual([old.rngState,old.aiRngState,old.raceRngState],random);
});

test('normal targets leave actual travel preparation time and release a target after injury',()=>{
 const {f,w,h,V}=setup();w.races=[{...f.race(w,'foreign-goal','g1',{turn:5,region:1}),prestige:100},{...f.race(w,'late-prep','op',{turn:3}),prestige:0}];
 V.plan(w);assert.equal(h.target.raceId,'foreign-goal');assert.equal(h.booked.raceId,'foreign-goal');assert.equal(h.booked.preparationTurn,3);
 h.restUntil=7;V.plan(w);assert.equal(h.target,null);assert.equal(h.booked,null);
});

test('local juvenile leaders can challenge a G1 below the adult absolute rating threshold',()=>{
 const {f,V}=setup(),w=f.world();
 w.horses.forEach((h,i)=>{h.birthYear=-1;h.qualification=1;h.lifetime.starts=3;h.annual.manual=90-i;h.recentForm=[-1,-4].map(turn=>({turn,tf:90-i,surface:'草地',distance:1600,rank:i+1}));});
 w.races=[{...f.race(w,'juvenile-goal','g1'),ageRule:'2',prestige:90},{...f.race(w,'experience','op'),ageRule:'2',prestige:40}];
 V.plan(w);assert.equal(w.horses[0].target.raceId,'juvenile-goal');assert.equal(w.horses.at(-1).target.raceId,'experience');
});

test('default Japan population retains complete plans through repeated save/reload planning',()=>{
 const n=loadChairmanRules().rules,V=n.ChairmanWorld;
 let w=V.create({id:'stage2-reload',worldType:'reference',regionKeys:['japan'],foundation:false,breeding:false,seed:123});
 const before=A.hash(w);for(let i=0;i<3;i++){w=A.copy(w);V.plan(w);assert.equal(A.hash(w),before);}
});

test('background world editor uses the same prestige and target rules as foreground',()=>{
 const fs=require('fs'),vm=require('vm'),{V}=setup(),w=V.create({worldType:'reference',regionKeys:['japan'],population:{japan:16},breeding:false,seed:12});
 const messages=[],self={postMessage:m=>messages.push(m)},context=vm.createContext({self,console});
 context.importScripts=(...files)=>files.forEach(file=>vm.runInContext(fs.readFileSync('js/'+file.split('?')[0],'utf8'),context));
 vm.runInContext(fs.readFileSync('js/chairman-worker.js','utf8'),context);
 const value={id:w.races.find(r=>r.sourceId==='japan-cup').id,prestige:0};
 self.onmessage({data:{kind:'worldPreview',payload:{world:A.copy(w),kind:'race',value}}});
 assert.equal(messages.at(-1).error,undefined);assert.equal(A.hash(messages.at(-1).result),A.hash(V.preview(w,'race',value)));
});

test('reference scores use stable ids and include major dirt, sprint, female and staying routes',()=>{
 const {n}=setup(),P=n.ChairmanPrestige;
 for(const id of ['champions-cup','sprinters-stakes','yushun-himba','ascot-gold-cup','breeders-cup-distaff']){const row=P.records.get(id);assert.ok(row.value>=90);assert.ok(row.sourceUrl.startsWith('https://'));assert.equal(row.checkedAt,'2026-09-28');}
 for(const [id,row] of P.records){assert.ok(P.valid(row.value),id);assert.equal(row.sourceId,id);}
 assert.equal(P.reference({sourceId:'japan-cup',name:'renamed',raceClass:'g1'}),98);
});

test('prestige editor previews and saves zero, restores reference default and rejects fractions',async()=>{
 const fs=require('fs'),{JSDOM}=require('jsdom'),{n,V}=setup();
 const dom=new JSDOM('<dialog></dialog>',{runScripts:'outside-only'}),browser=dom.window;
 try{
 browser.Keiba=n;browser.eval(fs.readFileSync('js/chairman-ui.js','utf8'));browser.eval(fs.readFileSync('js/chairman-world-ui.js','utf8'));
 const e=n.ChairmanUI.escape,c={world:V.create({worldType:'reference',regionKeys:['japan'],population:{japan:0},breeding:false}),dialog:browser.document.querySelector('dialog'),store:{writable:true},escape:e,render:async()=>{},commit:async out=>{c.world=out.world;}};
 c.background=async(kind,{world,kind:editKind,value})=>V.preview(world,editKind,value);
 c.dialog.close=()=>{};c.modal=(title,html)=>{c.dialog.innerHTML=html;};
 c.input=(key,label,value='',type='text')=>`<label>${e(label)}<input name="${e(key)}" type="${type}" value="${e(value)}"></label>`;
 c.select=(key,label,items,selected)=>`<label>${e(label)}<select name="${e(key)}">${items.map(x=>{const [v,label]=Array.isArray(x)?x:[x,x];return `<option value="${e(v)}" ${v===selected?'selected':''}>${e(label)}</option>`;}).join('')}</select></label>`;
 c.button=(action,label,id='')=>`<button data-action="${e(action)}" data-id="${e(id)}">${e(label)}</button>`;
 const ui=n.ChairmanWorldUI.create(c),id=c.world.races.find(r=>r.sourceId==='japan-cup').id;
 await ui.click('world:race',id,{});let form=c.dialog.querySelector('form');form.elements.prestige.value='0';await ui.submit(form);assert.match(c.dialog.textContent,/赛事声望/);await ui.click('world:confirm','',{});assert.equal(c.world.races.find(r=>r.id===id).prestige,0);
 await ui.click('world:race',id,{});form=c.dialog.querySelector('form');assert.equal(form.elements.prestige.value,'0');form.elements.resetPrestige.checked=true;await ui.submit(form);await ui.click('world:confirm','',{});assert.equal(c.world.races.find(r=>r.id===id).prestige,98);
 await ui.click('world:race',id,{});form=c.dialog.querySelector('form');form.elements.prestige.value='2.5';await assert.rejects(()=>ui.submit(form),/声望/);
 }finally{browser.close();}
});

function g1Pair(f,w,prestige,turn=2){return [{...f.race(w,'mile-g1','g1',{turn}),prestige:95},{...f.race(w,'sprint-g1','g1',{turn,distance:1000}),prestige}];}
function mileForm(w){w.horses.forEach(h=>{h.recentForm=[-1,-4].map(turn=>({turn,tf:120,surface:'草地',distance:1600,rank:1}));});return w;}
const targeted=(w,id)=>w.horses.filter(h=>h.target?.raceId===id).length;

test('same-turn high-prestige G1s share a surplus field across distances without dropping the donor below eight',()=>{
 const {f,V}=setup(),w=mileForm(f.world());w.races=g1Pair(f,w,90);V.plan(w);
 assert.equal(targeted(w,'mile-g1'),8);assert.equal(targeted(w,'sprint-g1'),4);
 const before=A.hash(w);V.plan(w);assert.equal(A.hash(w),before);
 // With only eight entrants the donor keeps everyone.
 const small=f.world();small.horses=small.horses.slice(0,8);mileForm(small);small.races=g1Pair(f,small,90);V.plan(small);
 assert.equal(targeted(small,'mile-g1'),8);assert.equal(targeted(small,'sprint-g1'),0);
 // G1s below prestige 85 are outside the balance.
 const low=mileForm(f.world());low.races=g1Pair(f,low,80);V.plan(low);assert.equal(targeted(low,'sprint-g1'),0);
});

test('classic-route legs may follow at a short interval; other races and other years keep three turns',()=>{
 const {f,w,h,V}=setup();
 const guineas={...f.race(w,'guineas','g2',{turn:9}),sourceId:'europe-g2-mehl-mulhens-rennen'},union={...f.race(w,'union','g2',{turn:10}),sourceId:'europe-g2-union-rennen'},other={...f.race(w,'other','g2',{turn:10}),sourceId:'europe-g3-diana-trial'};
 w.races=[guineas,union,other];w.turn=10;h.gender='牡马';h.lastRaceTurn=9;h.lastRace={raceId:'guineas',raceClass:'g2',rank:3};
 const rUnion=V.resolveRace(w,union,1),rOther=V.resolveRace(w,other,1);
 assert.equal(V.raceInterval(w,h,rUnion,10),1);assert.equal(V.intervalReady(w,h,rUnion,10),true);
 assert.equal(V.intervalReady(w,h,rOther,10),false);
 assert.equal(V.route(w,h,rUnion,10).reachable,true);assert.equal(V.route(w,h,rOther,10).reachable,false);
 // A previous-year leg does not open the exception.
 assert.equal(V.raceInterval(w,{...h,lastRaceTurn:-15},{...rUnion},10),3);
 // Chains only go forward.
 h.lastRace={raceId:'union',raceClass:'g2',rank:1};assert.equal(V.raceInterval(w,h,V.resolveRace(w,guineas,1),10),3);
 for(const chain of V.CLASSIC_CHAINS)assert.ok(chain.length>=2&&chain.every(id=>typeof id==='string'));
 // An open Guineas leads fillies to their own trial, not the Derby route.
 h.lastRace={raceId:'guineas',raceClass:'g2',rank:3};
 assert.equal(V.raceInterval(w,{...h,gender:'牝马'},rOther,10),1);assert.equal(V.raceInterval(w,{...h,gender:'牝马'},rUnion,10),3);
 assert.equal(V.raceInterval(w,{...h,gender:'牡马'},rUnion,10),1);
});

test('European reference regions generate mostly turf horses; Japan, US and blank defaults are unchanged',()=>{
 const n=loadChairmanRules().rules,V=n.ChairmanWorld;
 const w=V.create({worldType:'reference',regionKeys:['japan','usa','britain','italy'],population:{japan:0,usa:0,britain:0,italy:0},breeding:false,seed:3});
 const weights=Object.fromEntries(w.regions.map(r=>[r.name,r.generation.surfaceWeights]));
 assert.deepEqual({...weights['日本']},{草地:70,泥地:25,二刀流:5});assert.deepEqual({...weights['美国']},{草地:60,泥地:35,二刀流:5});
 assert.deepEqual({...weights['英国']},{草地:80,泥地:15,二刀流:5});assert.deepEqual({...weights['意大利']},{草地:80,泥地:15,二刀流:5});
 assert.deepEqual({...V.defaults().surfaceWeights},{草地:60,泥地:35,二刀流:5});
});

test('G1 balance does not move horses into risky conditions or overseas races',()=>{
 const {f,V}=setup(),w=f.world();
 w.horses.forEach(h=>{h.recentForm=[{turn:-1,tf:120,surface:'草地',distance:1600,rank:1},{turn:-4,tf:120,surface:'草地',distance:1600,rank:1},{turn:-6,tf:90,surface:'草地',distance:1000,rank:9},{turn:-8,tf:90,surface:'草地',distance:1000,rank:9}];});
 w.races=[{...f.race(w,'mile-g1','g1',{turn:4}),prestige:95},{...f.race(w,'sprint-g1','g1',{turn:4,distance:1000}),prestige:90},
   {...f.race(w,'abroad-g1','g1',{turn:4,region:1}),prestige:90}];
 V.plan(w);assert.equal(targeted(w,'mile-g1'),12);
});
