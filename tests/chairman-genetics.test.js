const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {loadChairmanRules}=require('./helpers/project-loader');
const plain=x=>JSON.parse(JSON.stringify(x));
function setup(){const p=loadChairmanRules(),n=p.rules,W=n.ChairmanRules,B=n.ChairmanBreeding,G=n.ChairmanGenetics,w=W.createWorld({seed:43127,blank:true,breeding:true});w.settings.annualNewHorses=10;return {...p,n,W,B,G,w};}
function parents(f){let sire,mare;f.B.seeded(f.w,()=>{sire=f.B.founder(f.w,'日本','牡马');mare=f.B.founder(f.w,'日本','牝马');});return [sire,mare];}
test('founder Q/S are independent of own ability, bounded, and canonical editor writes synchronize Q',()=>{
 const f=setup(),a=f.W.clone(f.w),b=f.W.clone(f.w);const low=f.W.addHorse(a,{strength:62}),high=f.W.addHorse(b,{strength:100});assert.equal(low.genetics.quality,high.genetics.quality);assert.equal(low.genetics.stability,high.genetics.stability);assert(low.genetics.quality>=25&&low.genetics.quality<=75);assert(low.genetics.stability>=40&&low.genetics.stability<=80);f.G.setValues(a,low,99,1);assert.equal(low.breeding.strength,99);assert.equal(low.genetics.stability,1);assert.throws(()=>f.G.setValues(a,low,101));
});
test('Q/S changes do not change retention or mating choices with identical public evidence and RNG',()=>{
 const f=setup();for(let i=0;i<16;i++)f.B.seeded(f.w,()=>f.B.founder(f.w,i%3?'日本':'美国',i%2?'牝马':'牡马'));
 const a=f.W.clone(f.w),b=f.W.clone(f.w);for(const h of f.B.all(b))if(h.breeding)f.G.setValues(b,h,100,1);
 f.B.selectBreeders(a);f.B.selectBreeders(b);assert.deepEqual(plain(f.B.all(a).map(h=>[h.id,h.breeding.status])),plain(f.B.all(b).map(h=>[h.id,h.breeding.status])));
 assert.deepEqual(plain(f.B.plan(a)),plain(f.B.plan(b)));
});
test('public objects and previews hide truth; read-only queries preserve every random stream and snapshot',()=>{
 const f=setup(),[s,m]=parents(f),before=JSON.stringify(f.w);f.G.setValues(f.w,s,97,13);const state=JSON.stringify(f.w);
 const preview=f.G.publicPair(f.w,s.id,m.id),publicHorse=f.B.publicHorse(f.w,s);assert.doesNotMatch(JSON.stringify({preview,publicHorse}),/quality|stability|breedingStrength|meanQuality|bloodlineMeanEffect/);
 f.B.query(f.w);f.G.familyStats(f.w);f.G.context(f.w);assert.equal(JSON.stringify(f.w),state);assert.notEqual(state,before);
});
test('public evaluation deduplicates children, counts unraced separately, and never changes inherited Q/S',()=>{
 const f=setup(),[s,m]=parents(f),q=s.genetics.quality,st=s.genetics.stability;
 for(let i=0;i<9;i++){const h=f.W.addHorse(f.w,{age:3,fatherId:s.id,motherId:m.id});if(i<8){h.lifetime.starts=20;h.lifetime.wins=i%2;h.annual.manual=i===0?null:100+i;}}
 f.G.invalidate(f.w);const v=f.G.publicEvaluation(f.w,s);assert.equal(v.starters,8);assert.equal(v.unraced,1);assert.equal(v.confidence,'初步参考');assert.notEqual(v.consistency,'样本不足');assert.equal(s.genetics.quality,q);assert.equal(s.genetics.stability,st);
 const kids=f.w.horses.filter(h=>h.fatherId===s.id);kids[0].lifetime.starts=1000;f.G.invalidate(f.w);assert.deepEqual(plain(f.G.publicEvaluation(f.w,s)),plain(v));
});
test('manual usage counts toward cap, mothers are unique, empty pools supplement without relaxing kinship',()=>{
 const f=setup(),[s,m]=parents(f);const mares=[m];for(let i=0;i<3;i++)f.B.seeded(f.w,()=>mares.push(f.B.founder(f.w,'日本','牝马')));
 f.w.breeding.manual=mares.map(m=>({fatherId:s.id,motherId:m.id,homeRegion:'日本'}));const pairs=f.B.plan(f.w);assert.equal(pairs.length,10);assert.equal(new Set(pairs.map(p=>p.motherId)).size,10);assert.equal(pairs.filter(p=>p.fatherId===s.id&&p.homeRegion==='日本').length,4);assert(f.w.breeding.planNotices.length>0);for(const p of pairs)assert(f.G.pair(f.w,p.fatherId,p.motherId).preview.legal);
 const usage=new Map();for(const p of pairs){const key=p.fatherId+'|'+p.homeRegion;usage.set(key,(usage.get(key)||0)+1);if(!p.manual)assert(usage.get(key)<=Math.max(1,Math.floor(f.B.quotas(f.w)[p.homeRegion]*.2)));}
});
test('migration keeps original race traits and legacy Q, deterministic S consumes no breeding random numbers',()=>{
 const f=setup();parents(f);f.w.breeding.version=1;for(const h of f.B.all(f.w)){delete h.genetics;h.breeding.strength=37;}
 const before=plain(f.w),rng=f.w.breeding.rngState;assert(f.G.upgrade(f.w));assert.equal(f.w.breeding.rngState,rng);assert.equal(f.w.breeding.version,2);assert.equal(f.G.upgrade(f.w),false);
 for(const h of f.B.all(f.w)){assert.equal(h.genetics.quality,37);assert(h.genetics.stability>=40&&h.genetics.stability<=80);const original=f.B.get(before,h.id),actual=plain(h);delete actual.genetics;assert.deepEqual(actual,plain(original));}
 const retry=plain(before);f.G.upgrade(retry);assert.deepEqual(plain(retry),plain(f.w));const disabled=f.W.createWorld({blank:true});assert.equal(f.G.upgrade(disabled),false);assert.equal(disabled.breeding,undefined);
});
test('year close retry is deterministic, newborns retain exact generated Q/S and four-generation evidence',()=>{
 const f=setup();parents(f);f.w.settings.annualNewHorses=3;f.w.phase='yearEnd';f.w.turn=23;
 const a=f.W.finishYear(f.w),b=f.W.finishYear(plain(f.w));assert.deepEqual(plain(a),plain(b));assert.equal(a.breedingReports.length,1);assert.equal(a.breedingEvents.length,3);
 for(const e of a.breedingEvents){const h=f.B.get(a.world,e.horseId);assert.equal(h.genetics.quality,h.breeding.strength);assert.equal(h.pedigree.mode,'chairman');assert.equal(h.pedigree.ancestors.length,30);assert(h.breedingOutcome);assert(!JSON.stringify(h.pedigree).includes('"pedigree":'));}
 const locked=[];f.B.closeYear(f.W.clone(f.w),{});const c=f.W.clone(f.w);f.B.closeYear(c,{});assert.throws(()=>f.B.closeYear(c,{}),/已经结算/);
});
test('maternal grandfather and maternal root stats remain separate and historical report is frozen',()=>{
 const f=setup(),[s,m]=parents(f);let mf;f.B.seeded(f.w,()=>mf=f.B.founder(f.w,'欧洲','牡马'));mf.birthYear=m.birthYear-5;m.fatherId=mf.id;f.G.invalidate(f.w);
 const h=f.W.addHorse(f.w,{fatherId:s.id,motherId:m.id,age:2});Object.assign(h.lifetime,{starts:9,wins:3,g1:2,prize:250});Object.assign(h.annual,{starts:9,wins:3,g1:2,prize:250});
 const v=f.G.familyStats(f.w);assert.equal(v.broodmareSires.find(r=>r.id===mf.id).starters,1);assert.equal(v.broodmareSires.find(r=>r.id===mf.id).g1,2);assert(!f.B.childStats(f.w).some(r=>r.id===mf.id));
 const report=f.G.report(f.w,[]),serialized=JSON.stringify(report);h.annual.g1=99;h.lifetime.g1=99;f.G.invalidate(f.w);f.G.report(f.w,[]);assert.equal(JSON.stringify(report),serialized);
});
test('world adapter uses shared parent inheritance and never applies the old parent speed term',()=>{
 const f=setup(),[s,m]=parents(f);const a=f.B.seeded(f.w,()=>f.G.inherited(f.w,s,m,'日本'));const w2=f.W.clone(f.w);w2.breeding.rngState=431;
 s.strength=62;m.strength=100;f.w.breeding.rngState=431;f.G.invalidate(f.w);const b=f.B.seeded(f.w,()=>f.G.inherited(f.w,s,m,'日本'));const c=f.B.seeded(w2,()=>f.G.inherited(w2,f.B.get(w2,s.id),f.B.get(w2,m.id),'日本'));assert.deepEqual(plain(b),plain(c));assert(a.strength>=62&&a.strength<=100);
});
test('annual legacy upgrade, failed transaction retry, report validation and save/import remain atomic',async()=>{
 const f=setup();parents(f);f.w.settings.annualNewHorses=3;f.w.turn=23;f.w.phase='yearEnd';f.w.breeding.version=1;for(const h of f.B.all(f.w))delete h.genetics;
 const {IDBFactory,IDBKeyRange}=require('fake-indexeddb');Object.assign(f.context.window,{indexedDB:new IDBFactory(),IDBKeyRange,setInterval,clearInterval});vm.runInContext(fs.readFileSync('js/chairman-storage.js','utf8'),f.context);const store=await f.n.ChairmanStorage.open();
 try{await store.acquire(f.w.id);await store.commitChanges(null,{world:f.w});const out=f.W.finishYear(f.w);await assert.rejects(store.commitChanges(f.w,out,{failForTest:true}),/事务中断/);const old=await store.load(f.w.id);assert.equal(old.breeding.version,1);assert.equal((await store.query('breedingReports',f.w.id)).rows.length,0);
  const retry=f.W.finishYear(old);assert.deepEqual(plain(out),plain(retry));await store.commitChanges(old,retry,{checkpoint:'year'});await assert.rejects(store.commitChanges(old,retry),/已被更新/);
  const snapshot=await store.exportWorld(f.w.id);assert.equal(snapshot.records.breedingReports.length,1);assert.equal(snapshot.records.breedingReports[0].upgraded,true);store.validateSnapshot(snapshot);const bad=plain(snapshot);bad.records.breedingReports[0].maternalFamilies[0].id='missing';assert.throws(()=>store.validateSnapshot(bad),/报告引用/);
  const badRare=plain(snapshot);badRare.records.breedingReports[0].rareLines={};assert.throws(()=>store.validateSnapshot(badRare),/稀有家系/);
  const badQ=plain(snapshot);badQ.world.horses[0].genetics.quality=1;badQ.world.horses[0].breeding.strength=99;assert.throws(()=>store.validateSnapshot(badQ),/素质|同步|遗传/);
  await store.saveSlot(f.w.id,1);const loaded=await store.loadSlot(1,true);assert.deepEqual(plain(loaded.horses.map(h=>h.pedigree||null)),plain(retry.world.horses.map(h=>h.pedigree||null)));const imported=await store.importWorld(snapshot);assert(imported);
 }finally{await store.close();}
});
test('legacy locked offspring are not regenerated after upgrade and duplicate births are rejected',()=>{
 const f=setup(),[s,m]=parents(f),offspring=f.B.seeded(f.w,()=>f.G.inherited(f.w,s,m,'日本'));delete offspring.genetics;delete offspring.pedigree;offspring.strength=99;offspring.breedingStrength=23;
 const locked=[{id:'1:mating:0',year:1,birthYear:2,fatherId:s.id,motherId:m.id,homeRegion:'日本',offspring}];f.w.breeding.version=1;for(const h of f.B.all(f.w))delete h.genetics;f.G.upgrade(f.w);f.w.turn=24;const out={};f.B.startYear(f.w,out,locked);const child=f.B.get(f.w,out.breedingEvents[0].horseId);assert.equal(child.strength,99);assert.equal(child.genetics.quality,23);assert.deepEqual(plain(child.trackAptitudes),plain(offspring.trackAptitudes));assert.throws(()=>f.B.startYear(f.w,{},locked),/已经结算/);
});
test('upgrade cancels now-forbidden pending pairs, reports reasons, and reuses the mare legally',()=>{
 const f=setup(),[s,m]=parents(f);m.fatherId=s.id;s.birthYear=m.birthYear-6;f.w.breeding.version=1;f.w.breeding.manual=[{fatherId:s.id,motherId:m.id,homeRegion:'日本'}];for(const h of f.B.all(f.w))delete h.genetics;f.G.upgrade(f.w);assert.equal(f.w.breeding.manual.length,0);assert.equal(f.w.breeding.upgradeNotices.length,1);const pairs=f.B.plan(f.w);assert(pairs.some(p=>p.motherId===m.id&&p.fatherId!==s.id));for(const p of pairs)assert(f.G.pair(f.w,p.fatherId,p.motherId).preview.legal);
});
test('compact birth snapshots are immutable across transactions, with independent mutable horse traits',()=>{
 const f=setup();parents(f);f.w.turn=23;f.w.phase='yearEnd';const born=f.W.finishYear(f.w).world,h=born.horses.find(h=>h.sourceKind==='bred');assert.equal(h.pedigree.format,2);assert.equal(new Set(h.pedigree.nodes.map(n=>n.id)).size,h.pedigree.nodes.length);
 const frozen=JSON.stringify(h.pedigree),next=f.W.edit(born,'ui',{tab:'breeding'}).world,newHorse=f.B.get(next,h.id);assert.equal(newHorse.pedigree,h.pedigree);assert(Object.isFrozen(newHorse.pedigree));assert(Object.isFrozen(newHorse.pedigree.nodes));newHorse.genetics.quality=7;assert.notEqual(h.genetics.quality,7);assert.equal(JSON.stringify(h.pedigree),frozen);
 const restored=f.W.clone(next);assert.deepEqual(plain(restored.horses.find(a=>a.id===h.id).pedigree),plain(h.pedigree));
});
test('fast kinship screening matches shared full previews for every fixture mating',()=>{
 const f=setup();vm.runInContext(fs.readFileSync('js/data/bloodline-lab-fixtures.js','utf8'),f.context);const data=f.n.BloodlineLabFixtures,lib=f.n.BloodlineSystem.createLibrary(data.records,data.nicks),rng=f.w.breeding.rngState;
 for(const sire of data.records.filter(r=>r.gender==='牡马'))for(const mare of data.records.filter(r=>r.gender==='牝马')){const fast=f.n.BloodlineSystem.checkPair(lib,sire.id,mare.id),full=f.n.BloodlineSystem.createPair(lib,sire.id,mare.id,'chairman').preview;assert.equal(fast.legal,full.legal);}
 assert.equal(f.w.breeding.rngState,rng);
});
test('parent Q/S inheritance is symmetric while sex-specific maternal-sire theory stays directional',()=>{
 const f=setup(),S=f.n.BloodlineSystem;function pair(reverse){return S.createPair(S.createLibrary([{id:'father',gender:'牡马',genetics:{quality:reverse?90:30,stability:reverse?80:35}},{id:'mother',gender:'牝马',genetics:{quality:reverse?30:90,stability:reverse?35:80}}]),'father','mother','chairman');}
 for(let seed=1;seed<=50;seed++){const a=pair(false).generate({seed}),b=pair(true).generate({seed});assert.equal(a.strength,b.strength);assert.equal(a.genetics.quality,b.genetics.quality);assert.equal(a.genetics.stability,b.genetics.stability);}
});
test('first upgraded annual report does not label established sires as first-crop newcomers',()=>{
 const f=setup(),[s,m]=parents(f),h=f.W.addHorse(f.w,{fatherId:s.id,motherId:m.id});h.lifetime.starts=8;h.annual.starts=3;f.G.invalidate(f.w);assert.equal(f.G.report(f.w,[]).firstCrop.length,0);
 delete f.w.breeding.publicBaseline;h.annual.starts=8;f.G.invalidate(f.w);assert(f.G.report(f.w,[]).firstCrop.some(r=>r.id===s.id));
});
test('database v9 gains the report store without upgrading world genetics during read',async()=>{
 const f=setup();parents(f);f.w.breeding.version=1;for(const h of f.B.all(f.w))delete h.genetics;
 const {IDBFactory,IDBKeyRange}=require('fake-indexeddb');Object.assign(f.context.window,{indexedDB:new IDBFactory(),IDBKeyRange,setInterval,clearInterval});const source=fs.readFileSync('js/chairman-storage.js','utf8');const legacy=source.replace('indexedDB.open(DB_NAME, 10)','indexedDB.open(DB_NAME, 9)').replace('"breedingYears", "breedingReports",','"breedingYears",').replace(/^\s*if\(event.oldVersion<10\).*$/m,'');
 vm.runInContext(legacy,f.context);let store=await f.n.ChairmanStorage.open();await store.acquire(f.w.id);await store.commitChanges(null,{world:f.w});assert.equal(store.db.version,9);assert(!store.db.objectStoreNames.contains('breedingReports'));await store.close();vm.runInContext(source,f.context);store=await f.n.ChairmanStorage.open();
 try{assert.equal(store.db.version,10);assert(store.db.objectStoreNames.contains('breedingReports'));const loaded=await store.load(f.w.id);assert.equal(loaded.breeding.version,1);assert.equal(loaded.breeding.rngState,f.w.breeding.rngState);assert(loaded.pedigrees.every(h=>!h.genetics));assert.equal((await store.query('breedingReports',f.w.id)).rows.length,0);}finally{await store.close();}
});
test('automatic draws preserve the 20% uniform mixture and 80/20 local preference',()=>{
 const f=setup();let a,b,m;f.B.seeded(f.w,()=>{[a,b,m]=['牡马','牡马','牝马'].map(gender=>f.W.addHorse(f.w,{gender,age:5,status:'retired',homeRegion:'日本'}));});for(const h of [a,b,m])h.breeding.status='active';f.w.settings.annualNewHorses=1;
 for(const [h,high]of [[a,true],[b,false]]){h.lifetime.starts=1;h.lifetime.g1=high?1:0;h.lifetime.prize=high?100:1;h.annual.manual=high?130:100;}f.G.invalidate(f.w);
 assert.equal(f.G.publicEvaluation(f.w,a).score,75);assert.equal(f.G.publicEvaluation(f.w,b).score,25);
 const trials=6000,draw=()=>{let count=0;for(let i=0;i<trials;i++){f.w.breeding.rngState=i+1;count+=f.B.plan(f.w)[0].fatherId===a.id?1:0;}return count/trials;};
 const probability=.2*.5+.8*(4/6),weighted=draw();assert(Math.abs(weighted-probability)<4*Math.sqrt(probability*(1-probability)/trials),String(weighted));
 b.homeRegion='美国';const local=draw();assert(Math.abs(local-.8)<4*Math.sqrt(.8*.2/trials),String(local));
});

test('public trends and frozen rare-family continuation use past performance and actual births only',()=>{
 const f=setup(),[s,m]=parents(f);s.genetics.lineId='fictional:rare';
 for(let i=0;i<30;i++){const h=f.W.addHorse(f.w,{age:2});h.sourceKind='bred';h.genetics.lineId=i?'fictional:common':'fictional:rare';}
 const v=f.G.publicEvaluation(f.w,s);assert.equal(v.trend,'暂无年度对照');
 f.w.breeding.publicBaseline={[s.id]:{score:v.score-5,starters:0}};assert.equal(f.G.publicEvaluation(f.w,s).trend,'较上年上升');
 const report=f.G.report(f.w,[{fatherId:s.id,motherId:m.id}]);assert.equal(report.rareLines.length,1);assert.equal(report.rareLines[0].count,1);assert.equal(report.rareLines[0].previousShare,1/30);
 const frozen=JSON.stringify(report);s.genetics.lineId='fictional:changed';assert.equal(JSON.stringify(report),frozen);
});

test('legacy worlds do not expose their hidden breeding strength through a public grade before upgrade',()=>{
 const f=setup(),[s]=parents(f);f.w.breeding.version=1;const before=f.B.publicHorse(f.w,s);s.breeding.strength=100;f.G.invalidate(f.w);assert.equal(f.B.publicHorse(f.w,s).grade,before.grade);assert.equal(before.grade,'尚待子代验证');
});
