const test=require('node:test'), assert=require('node:assert/strict');
const fs=require('node:fs'), vm=require('node:vm');
const {IDBFactory,IDBKeyRange}=require('fake-indexeddb');
const {loadChairmanRules}=require('./helpers/project-loader');
const plain=v=>JSON.parse(JSON.stringify(v));
const project=loadChairmanRules(), n=project.rules, W=n.ChairmanRules, S=n.ChairmanRatings;
test('distance interpolation, compressed margins, exact manual benchmark and independent TF',()=>{
  assert.equal(S.pointsPerLength(1400),2.75); assert.equal(S.pointsPerLength(5000),.5);
  const rows=[{id:'a',horseId:'a',rank:1,margin:0},{id:'b',horseId:'b',rank:2,margin:2},{id:'c',horseId:'c',rank:3,margin:40},{id:'d',horseId:'d',retired:true}];
  const rec=S.buildWtrRecommendations({distance:2000},rows,'b',0);
  assert.equal(rec.b,0);assert.equal(rec.a,4);assert.equal(rec.c,-36);assert.equal(rec.d,undefined);
  const horses=rows.map(p=>({id:p.horseId,strength:99,recentForm:[{turn:0,tf:110,surface:'草地',distance:2000},{turn:3,tf:110,surface:'草地',distance:2000}]}));
  const race={id:'r',distance:2000,surface:'草地'};
  const before=S.rateRaceTF(race,rows,horses,6,{});
  horses.forEach(h=>{h.strength=1;h.annual={manual:9999};h.peakStart='七岁春';});rows.forEach(p=>{p.total=-1000;p.pressure=8;p.manualRating=999;});
  assert.deepEqual(plain(S.rateRaceTF(race,rows,horses,6,{})),plain(before));
});
test('scale offset is reproducible, shared and statistically 25/50/25 without RNG use',()=>{
  const count={4:0,5:0,6:0};for(let i=0;i<20000;i++){const d=S.getRatingScaleOffset(775,`1:race-${i}`);count[d]++;assert.equal(d,S.getRatingScaleOffset(775,`1:race-${i}`));}
  assert.ok(Math.abs(count[4]/20000-.25)<.02);assert.ok(Math.abs(count[5]/20000-.5)<.02);assert.ok(Math.abs(count[6]/20000-.25)<.02);
  const random=n.Random.seeded(12), before=random.state();n.Random.withSource(random,()=>S.getRatingScaleOffset(4,'r'));assert.equal(random.state(),before);
});
test('fixed public population avoids cumulative inflation or collapse across 120 repeat races',()=>{
  const random=n.Random.seeded(413), w={turn:0,horses:Array.from({length:16},(_,i)=>({id:String(i),status:'active',recentForm:[]}))};
  const race={id:'repeat',surface:'草地',distance:1600}, centers=[];
  for(let round=0;round<120;round++){
    w.turn=round*3;
    const field=w.horses.map((h,i)=>({horseId:h.id,score:80+i*1.4+random()*16})).sort((a,b)=>b.score-a.score);
    const rows=field.map((r,i)=>({horseId:r.horseId,rank:i+1,margin:(field[0].score-r.score)/3}));
    const rated=S.rateRaceTF(race,rows,w.horses,w.turn,{},S.calibration(w));
    rows.forEach(p=>S.record(w.horses.find(h=>h.id===p.horseId),{...p,turn:w.turn,tf:rated.ratings[p.horseId],raceClass:'op',prize:0,surface:'草地',distance:1600},16));
    centers.push(S.median(Object.values(rated.ratings)));
  }
  const avg=a=>a.reduce((s,x)=>s+x,0)/a.length;
  assert.ok(Math.abs(avg(centers.slice(-30))-avg(centers.slice(20,50)))<8,JSON.stringify(centers));
});
async function storeFixture(){
  const p=loadChairmanRules();Object.assign(p.context.window,{indexedDB:new IDBFactory(),IDBKeyRange,setInterval,clearInterval});
  for(const f of ['js/chairman-storage.js','js/chairman-history.js'])vm.runInContext(fs.readFileSync(f,'utf8'),p.context);
  const store=await p.rules.ChairmanStorage.open(), W=p.rules.ChairmanRules;
  let world=W.createWorld({seed:5701,horseCount:24});world.races.filter(r=>r.month===1&&r.half===1).forEach(r=>{r.raceClass='g3';r.grade='G3';});W.planEntries(world);
  await store.acquire(world.id);await store.commitChanges(null,{world});const out=W.advanceHalfMonth(world);await store.commitChanges(world,out);world=out.world;
  return {...p,store,world,out};
}
test('recommendations preserve touched cells, do not approve WTR, replay through snapshots and reset to null',async()=>{
  const {rules:n,store,world:initial,out:first}=await storeFixture();let world=initial;const W=n.ChairmanRules;
  try{
    const race=first.occurrences.find(r=>r.status==='completed'), rows=first.performances.filter(p=>p.occurrenceId===race.id&&!p.retired), anchor=rows[1]||rows[0];
    assert.ok(world.horses.every(h=>W.rating(h)===null));
    let out=await store.recommendOutput(world,race.id,anchor.horseId,null,{useTf:true});await store.commitChanges(world,out);world=out.world;
    let draft=await store.get('scoreDrafts',world.id,race.id);assert.equal(draft.benchmarkScore,anchor.tf-race.scaleOffset);
    assert.ok(world.horses.every(h=>W.rating(h)===null));
    out=await store.draftOutput(world,race.id,{[rows[0].id]:'0'});await store.commitChanges(world,out);world=out.world;
    out=await store.recommendOutput(world,race.id,anchor.horseId,130);await store.commitChanges(world,out);world=out.world;
    draft=await store.get('scoreDrafts',world.id,race.id);assert.equal(draft.values[rows[0].id],'0');assert.equal(draft.recommendations[anchor.id],130);
    const snapshot=await store.exportWorld(world.id);store.validateSnapshot(snapshot);const imported=await store.importWorld(snapshot);
    assert.deepEqual(plain(await store.get('scoreDrafts',imported.id,race.id)),plain(draft));world=imported;
    out=await store.scoreOutput(world,race.id,draft.values);await store.commitChanges(world,out);world=out.world;
    assert.equal(W.rating(world.horses.find(h=>h.id===rows[0].horseId)),0);
    out=await store.scoreOutput(world,race.id,{},true);await store.commitChanges(world,out);world=out.world;
    assert.equal(W.rating(world.horses.find(h=>h.id===rows[0].horseId)),null);
    assert.equal((await store.get('performances',world.id,anchor.id)).tf,anchor.tf);
  }finally{await store.close();}
});
test('legacy migration preserves TF and manual overrides, recovers and is repeatable',async()=>{
  const {rules:n,store,world:initial,out:first}=await storeFixture();const W=n.ChairmanRules;
  try{
    const legacy=W.clone(initial);legacy.ratingVersion=1;legacy.horses.forEach(h=>{h.annual.suggested=h.annual.tf;delete h.recentForm;});legacy.horses[0].annual.manual=0;
    const change=W.mutate(initial,(w,out)=>{Object.assign(w,legacy);out.performances=first.performances;});await store.commitChanges(initial,change);
    const before=await store.exportWorld(initial.id), oldRevision=change.world.revision;
    const loaded=await store.load(initial.id);assert.equal(loaded.ratingVersion,2);assert.equal(loaded.rngState,legacy.rngState);assert.equal(loaded.horses[0].annual.manual,0);
    assert.ok(loaded.horses.every(h=>h.annual.suggested===null));assert.ok(loaded.horses.some(h=>h.recentForm.length));
    assert.deepEqual(plain((await store.exportWorld(initial.id)).records.performances),plain(before.records.performances));
    const again=await store.load(initial.id);assert.equal(again.revision,loaded.revision);
    let progressed=loaded;for(let i=0;i<5;i++){const out=W.advanceHalfMonth(progressed);await store.commitChanges(progressed,out,{checkpoint:'turn'});progressed=out.world;}
    const restored=await store.restore(progressed,`migration:${oldRevision}`);assert.equal(restored.ratingVersion,2);assert.equal(restored.aiRngState,loaded.aiRngState);
    assert.deepEqual(plain(restored.horses),plain(loaded.horses));
  }finally{await store.close();}
});
test('background races retain facts but cannot receive scores or appear in graded result paging',async()=>{
  const {rules:n,store,world:initial}=await storeFixture();let world=initial;
  try{
    let op;for(let i=0;i<8&&!op;i++){const out=n.ChairmanRules.advanceHalfMonth(world);await store.commitChanges(world,out);world=out.world;op=out.occurrences.find(r=>r.raceClass==='op'&&r.status==='completed');}assert.ok(op);
    const list=await store.historyPage(world,{},0);assert.ok(list.rows.every(r=>r.raceClass!=='op'));
    await assert.rejects(store.scoreOutput(world,op.id,{}));await assert.rejects(store.recommendOutput(world,op.id,null,null,{useTf:true}));
    assert.ok(world.horses.some(h=>h.background?.starts));assert.ok((await store.query('performances',world.id,{occurrenceId:op.id})).rows.length);
    assert.equal((await store.board(world,'current',{},0,false)).total,0);assert.ok((await store.board(world,'tf',{},0,false)).total);
  }finally{await store.close();}
});
test('selection compares TF on WTR scale, does not gate G1, and uses an independent random stream',()=>{
  const w=W.createWorld({seed:778,horseCount:20}), h=w.horses[0];
  h.annual.tf=125;assert.equal(W.entryRating(h),120);h.annual.manual=0;assert.equal(W.entryRating(h),0);h.annual.manual=null;
  const before=w.rngState;W.planEntries(w);assert.equal(w.rngState,before);
  const r=w.races.find(r=>r.raceClass==='g1');Object.assign(r,{ageRule:'2+',sexRule:'all',month:1,half:1});
  assert.equal(W.eligible(w,h,r,0),true);assert.equal(n.ChairmanScheduling.getRecentForm(w,h,W.engineRace(w,r),0).challenge,false);
  const pending=n.ChairmanScheduling.preparationRaces(w);const out=W.edit(w,'preparationRaces',{});assert.equal(n.ChairmanScheduling.preparationRaces(out.world).length,0);assert.equal(out.world.races.length,w.races.length+pending.length);
});

test('breeding may use TF as reputation without exposing it as an approved historical WTR',()=>{
  const h={breeding:{}};
  n.ChairmanBreeding.recordRating(h,1,null,130);
  assert.equal(h.breeding.bestWtr,null);assert.equal(h.breeding.yearWtr[1],null);assert.equal(h.breeding.bestEvaluation,125);
  n.ChairmanBreeding.recordRating(h,1,0,130);
  assert.equal(h.breeding.bestWtr,0);assert.equal(h.breeding.bestEvaluation,0);
  n.ChairmanBreeding.recordRating(h,1,null,130);
  assert.equal(h.breeding.bestWtr,null);assert.equal(h.breeding.bestEvaluation,125);
});
