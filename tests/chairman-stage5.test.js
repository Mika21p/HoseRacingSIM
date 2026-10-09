const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {IDBFactory,IDBKeyRange}=require('fake-indexeddb');
const {loadChairmanRules}=require('./helpers/project-loader');
const p=loadChairmanRules(),n=p.rules,W=n.ChairmanRules,D=n.ChairmanDevelopment;
const plain=x=>JSON.parse(JSON.stringify(x));
const canonicalHorses=hs=>plain(hs).map(h=>({...h,annual:{...h.annual,runs:h.annual.runs||[]}}));
function world(extra={}){return W.createWorld({worldType:'reference',regionKeys:['usa'],population:{usa:24},annualTargets:{usa:6},foundation:false,breeding:false,seed:43127,...extra});}
test('stage5 scorer preserves tested prototype results including raw prestige separation',()=>{
 const factory=require('../scripts/lib/chairman-tf-prototype').createScorer,opts={durableReference:true,noviceVariation:true,robustField:true,softPrestige:true,seed:123};
 const a=factory(n.ChairmanRatings,opts),b=D.createScorer(n.ChairmanRatings,opts),rows=Array.from({length:8},(_,i)=>({horseId:String(i),rank:i+1,margin:i*2}));
 for(let turn=0;turn<24;turn+=3){const race={id:'repeat',surface:'草地',distance:1600,raceClass:turn?'g1':'new',prestige:100},x=a.rate(race,rows,turn),y=b.rate(race,rows,turn);assert.deepEqual(plain(y),plain(x));a.record(race,rows,turn,x);b.record(race,rows,turn,y);assert.equal(b.history.get('0').at(-1).tf,y.rawRatings['0']);}
});
test('locked novice debut receives a reference even when context contains an empty history',()=>{
 const w=world(),h=w.horses[0],scorer=D.context(w);
 assert.equal(scorer.history.get(h.id).length,0);
 const result=scorer.settleDebut({id:'locked',raceClass:'new',surface:'草地',distance:1600},[{horseId:h.id,rank:1,margin:0}],0,new Set([h.id]));
 assert.equal(result.count,1);D.persist(scorer,h);assert.ok(Number.isSafeInteger(h.tfReference[0].tf));
});
test('lightweight development is deterministic, respects health and travel, grants only basic qualification',()=>{
 const w=world();w.turn=6;const h=w.horses[0];Object.assign(h,{birthYear:-1,qualification:0,booked:null,strength:95,peakStart:'二岁春',peakEnd:'五岁秋'});
 let completed;for(let t=6;t<24;t++){w.turn=t;const a=W.clone(w),b=W.clone(w),rng=a.rngState;D.settle(a,D.context(a));D.settle(b,D.context(b));assert.deepEqual(plain(a),plain(b));assert.equal(a.rngState,rng);if(a.horses[0].development){completed=a.horses[0];break;}}
 assert.ok(completed);assert.ok([0,1].includes(completed.qualification));assert.equal(completed.lifetime.starts,0);assert.equal(completed.lifetime.wins,0);assert.equal(completed.lifetime.prize,0);assert.ok(completed.tfReference.length);
 for(const patch of [{restUntil:100},{transit:{arrivalTurn:100}},{booked:{turn:100}}]){const copy=W.clone(w);Object.assign(copy.horses[0],patch);D.settle(copy,D.context(copy));assert.equal(copy.horses[0].development,undefined);}
});
test('current maturity affects assessment without double penalizing late maturity',()=>{
 const source=world();source.turn=6;const h=source.horses[0];Object.assign(h,{birthYear:-1,qualification:0,booked:null,strength:90,peakStart:'二岁春',peakEnd:'六岁冬'});
 let a,b;for(let t=6;t<9;t++){source.turn=t;a=W.clone(source);b=W.clone(source);b.horses[0].peakStart='四岁春';D.settle(a,D.context(a));D.settle(b,D.context(b));if(a.horses[0].development)break;}
 assert.ok(a.horses[0].development.lastTf>b.horses[0].development.lastTf);assert.equal(a.horses[0].development.attempts,1);
});
test('half-month integration bypasses basic race simulation and keeps assessment interval',()=>{
 let w=world(),promotions=0;const original=n.RaceRules.simulateWorldRace;
 n.RaceRules.simulateWorldRace=(runners,race)=>{assert.ok(!['new','maiden'].includes(race.raceClass));return original(runners,race);};
 try{for(let i=0;i<24;i++){const before=new Map(w.horses.map(h=>[h.id,h])),out=W.advanceHalfMonth(w);for(const row of out.performances){const h=before.get(row.horseId);if(h.development)assert.ok(row.turn-h.development.lastTurn>=3);if(row.tf!=null){assert.ok(Number.isSafeInteger(row.rawTf));assert.ok(Number.isSafeInteger(row.tf));}}
   w=out.world;promotions+=w.developmentSummary.promoted;W.validateWorld(w);}
 }finally{n.RaceRules.simulateWorldRace=original;}
 assert.ok(promotions>0);assert.ok(w.horses.some(h=>h.development&&h.qualification>=1));
});
test('legacy version2 activation waits for advancement and preserves locked bookings',()=>{
 const w=world({development:false});delete w.developmentVersion;delete w.developmentActivatedTurn;
 const h=w.horses.find(h=>h.booked);assert.ok(h);const race=w.races.find(r=>r.id===h.booked.raceId),key=`${W.date(h.booked.turn).year}:${race.id}`;w.lockedRaces[key]=W.engineRace(w,race);const booking=plain(h.booked);
 n.ChairmanWorld.plan(w);assert.equal(w.developmentVersion,undefined);assert.deepEqual(plain(h.booked),booking);
 const out=W.advanceHalfMonth(w);assert.equal(out.world.developmentVersion,1);assert.equal(w.developmentVersion,undefined);
 if(booking.turn>w.turn)assert.deepEqual(plain(out.world.horses.find(x=>x.id===h.id).booked),booking);
 const legacy=W.createWorld({horseCount:12,seed:123});assert.equal(W.advanceHalfMonth(legacy).world.developmentVersion,undefined);
});
test('development records survive database reload, export/import and deterministic continuation',async()=>{
 const project=loadChairmanRules();Object.assign(project.context.window,{indexedDB:new IDBFactory(),IDBKeyRange,setInterval,clearInterval});
 for(const f of ['js/chairman-storage.js','js/chairman-history.js'])vm.runInContext(fs.readFileSync(f,'utf8'),project.context);
 const store=await project.rules.ChairmanStorage.open(),Rules=project.rules.ChairmanRules;
 try{let w=Rules.createWorld({worldType:'reference',regionKeys:['usa'],population:{usa:16},foundation:false,breeding:false,seed:11});await store.acquire(w.id);await store.commitChanges(null,{world:w});
  for(let i=0;i<10;i++){const out=Rules.advanceHalfMonth(w);await store.commitChanges(w,out);w=out.world;}
  assert.ok(w.horses.some(h=>h.development));const loaded=await store.load(w.id);assert.deepEqual(canonicalHorses(loaded.horses),canonicalHorses(w.horses));
  await store.saveSlot(w.id,1);
  const next=Rules.advanceHalfMonth(loaded);await store.commitChanges(loaded,next,{checkpoint:'turn'});
  const restored=await store.restore(next.world,`turn:${loaded.revision}`);assert.deepEqual(canonicalHorses(restored.horses),canonicalHorses(w.horses));
  assert.deepEqual(plain(Rules.advanceHalfMonth(restored).performances),plain(next.performances));
  const backup=await store.loadSlot(1,true);assert.deepEqual(canonicalHorses(backup.horses),canonicalHorses(w.horses));
  const snap=await store.exportWorld(w.id);store.validateSnapshot(snap);const imported=await store.importWorld(snap);assert.deepEqual(canonicalHorses(imported.horses),canonicalHorses(w.horses));
  const a=Rules.advanceHalfMonth(w),b=Rules.advanceHalfMonth(imported);assert.deepEqual(plain(a.performances),plain(b.performances));assert.deepEqual(canonicalHorses(a.world.horses),canonicalHorses(b.world.horses));
  const bad=Rules.clone(snap);bad.world.horses[0].tfReference=[{turn:0,tf:Infinity,distance:1600,surface:'草地'}];assert.throws(()=>store.validateSnapshot(bad));
 }finally{await store.close();}
});
