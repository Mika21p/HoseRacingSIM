const test = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs'), vm = require('node:vm');
const { IDBFactory, IDBKeyRange } = require('fake-indexeddb');
const { loadChairmanRules } = require('./helpers/project-loader');
const plain = v => JSON.parse(JSON.stringify(v));
async function fixture(legacy=false) {
  const p=loadChairmanRules(), n=p.rules, W=n.ChairmanRules;
  Object.assign(p.context.window,{indexedDB:new IDBFactory(),IDBKeyRange,setInterval,clearInterval});
  for(const f of ['js/chairman-storage.js','js/chairman-history.js'])vm.runInContext(fs.readFileSync(f,'utf8'),p.context);
  const store=await n.ChairmanStorage.open();let w=W.createWorld({seed:991,horseCount:24});
  if(legacy)delete w.ratingPrecisionVersion;
  w.races.filter(r=>r.month===1 && r.half===1).forEach(r=>{r.raceClass='g3';r.grade='G3';});W.planEntries(w);
  await store.acquire(w.id);await store.commitChanges(null,{world:w});
  return {...p,n,W,store,w};
}
test('all scoring paths reject fractions and recommendations round once including negatives and zero',()=>{
  const {rules:n}=loadChairmanRules(),S=n.ChairmanRatings,W=n.ChairmanRules,w=W.createWorld({blank:true});
  assert.equal(S.integer(-1.5),-2);assert.equal(S.integer(1.5),2);assert.equal(S.score(''),null);assert.equal(S.score('0'),0);
  assert.throws(()=>S.score(1.2),/整数/);
  const rows=[{id:'a',horseId:'a',rank:1,margin:0},{id:'b',horseId:'b',rank:2,margin:1}];
  assert.equal(S.buildWtrRecommendations({distance:1600},rows,'a',120).b,118);
  assert.throws(()=>S.buildWtrRecommendations({distance:1600},rows,'a',120.2),/整数/);
  const h=W.addHorse(w,{origin:'custom'});
  assert.throws(()=>W.edit(w,'wtr',{id:h.id,score:120.5}),/整数/);
  assert.throws(()=>W.scorePerformance(w,{raceClass:'g1'},12.5,[]),/整数/);
});
test('precision migration is atomic, keeps recovery evidence and does not change facts or RNG',async()=>{
  const {n,W,store,w}=await fixture(true);
  try{
    const out=W.advanceHalfMonth(w),p=out.performances.find(p=>!p.retired),h=out.world.horses.find(h=>h.id===p.horseId);
    p.tf=124.6;p.manualRating=120.5;h.annual.tf=124.6;h.annual.suggested=120.5;h.annual.manual=0;
    out.scoreDrafts=[{id:p.occurrenceId,year:p.year,turn:p.turn,benchmarkId:p.horseId,benchmarkScore:119.5,values:{[p.id]:'118.5'},recommendations:{[p.id]:118.5},touched:{[p.id]:true}}];
    await store.commitChanges(w,out);const snapshot=await store.exportWorld(w.id),rng=out.world.rngState;
    const migrated=n.ChairmanRatings.integerMigration(out.world,snapshot.records);
    await assert.rejects(store.commitChanges(out.world,migrated,{checkpoint:'precision',failForTest:true}),/中断/);
    assert.equal((await store.get('performances',w.id,p.id)).tf,124.6);
    const loaded=await store.load(w.id);assert.equal(loaded.ratingPrecisionVersion,1);assert.equal(loaded.rngState,rng);
    assert.equal(loaded.horses.find(h=>h.id===p.horseId).annual.manual,0);
    assert.equal((await store.get('performances',w.id,p.id)).manualRating,121);
    assert.equal((await store.get('scoreDrafts',w.id,p.occurrenceId)).values[p.id],'119');
    const points=(await store.query('checkpoints',w.id)).rows,point=points.find(p=>p.kind==='precision');
    assert.equal(point.snapshot.records.performances.find(r=>r.id===p.id).tf,124.6);
    assert.equal((await store.load(w.id)).revision,loaded.revision);
    const result=await store.exportWorld(w.id);store.validateSnapshot(result);
    assert.deepEqual(result.records.performances.map(p=>[p.rank,p.prize,p.total]),snapshot.records.performances.map(p=>[p.rank,p.prize,p.total]));
    const bad=plain(result);bad.records.performances[0].manualRating=1.1;assert.throws(()=>store.validateSnapshot(bad),/整数/);
    const replay=await store.restore(loaded,point.id);assert.equal(replay.ratingPrecisionVersion,1);assert.equal(replay.rngState,rng);
  }finally{await store.close();}
});
test('previous performance is chronological, sees revised zero WTR, OP and DNF without future leakage',async()=>{
  const {W,store,w}=await fixture();try{
    const out=W.advanceHalfMonth(w),first=out.performances.find(p=>!p.retired);await store.commitChanges(w,out);
    const second={...first,id:'second',turn:25,year:2,retired:true,rank:null,raceClass:'op',manualRating:null};
    const third={...first,id:'third',turn:28,year:2,priorPerformanceId:'second'};
    const future={...first,id:'future',turn:40,year:2};
    const update=W.mutate(out.world,(_,o)=>{o.performances.push({...first,manualRating:0},second,third,future);});await store.commitChanges(out.world,update);
    assert.equal(await store.previousPerformance(w.id,first),null);
    assert.equal((await store.previousPerformance(w.id,second)).manualRating,0);
    assert.equal((await store.previousPerformance(w.id,third)).id,'second');assert.equal((await store.previousPerformance(w.id,third)).retired,true);
    assert.equal((await store.previousPerformance(w.id,{...third,priorPerformanceId:'future'})).id,'second');
  }finally{await store.close();}
});
test('manual backup restores original identity atomically, retains undo and forks only explicitly',async()=>{
  const {W,store,w}=await fixture();try{
    await store.saveSlot(w.id,1);const out=W.advanceHalfMonth(w);await store.commitChanges(w,out);const rng=out.world.rngState;
    await assert.rejects(store.loadSlot(1,false,undefined,{failForTest:true}),/中断/);assert.equal((await store.load(w.id)).turn,1);
    const restored=await store.loadSlot(1);assert.equal(restored.id,w.id);assert.equal(restored.turn,0);assert.equal((await store.listWorlds()).length,1);
    const point=(await store.query('checkpoints',w.id)).rows.find(p=>p.kind==='backup');assert.ok(point);
    const undone=await store.restore(restored,point.id);assert.equal(undone.rngState,rng);assert.equal(undone.turn,1);
    const fork=await store.loadSlot(1,true);assert.notEqual(fork.id,w.id);assert.equal((await store.listWorlds()).length,2);
  }finally{await store.close();}
});
test('deletion is atomic, respects leases, preserves backups and allows a deleted game to be restored',async()=>{
  const {n,W,store,w}=await fixture();const other=await n.ChairmanStorage.open();try{
    await store.saveSlot(w.id,1);await assert.rejects(other.deleteWorld(w.id,w.revision),/另一页面/);
    await assert.rejects(store.deleteWorld(w.id,w.revision,{failForTest:true}),/中断/);assert.equal((await store.listWorlds()).length,1);
    await store.deleteWorld(w.id,w.revision);assert.equal((await store.listWorlds()).length,0);
    for(const key of n.ChairmanStorage.DATA)assert.equal((await store.query(key,w.id)).rows.length,0);
    assert.equal((await store.slots()).length,1);
    const restored=await store.loadSlot(1);assert.notEqual(restored.id,w.id);assert.equal(restored.horses.length,w.horses.length);
    await store.deleteSlot(1);assert.equal((await store.slots()).length,0);assert.equal((await store.listWorlds()).length,1);
  }finally{await other.close();await store.close();}
});
test('current-age creation and CSV age imports respect game date, history and pedigree chronology',()=>{
  const {rules:n}=loadChairmanRules(),W=n.ChairmanRules,w=W.createWorld({blank:true});w.turn=155;
  const out=W.edit(w,'horse',{name:'当下生成',age:4}),h=out.world.horses[0];
  assert.equal(W.ageOf(out.world,h),4);assert.equal(h.birthYear,W.date(w.turn).year-4);assert.equal(h.lifetime.starts,0);
  assert.equal(h.maturity.lastCheckedIndex,W.timeFor(out.world,h).index);
  assert.throws(()=>W.edit(w,'horse',{age:2.5}),/整数/);
  h.lifetime.starts=1;assert.throws(()=>W.edit(out.world,'horse',{id:h.id,age:5}),/出赛/);
  const text='模板版本,马名,导入时年龄\n1,表格年龄,3';
  const imported=n.ChairmanCSV.preview(w,'horse',text);assert.deepEqual(plain(imported.errors),[]);assert.equal(imported.changes[0].age,3);
  assert.equal(W.ageOf(w,imported.output.world.horses[0]),3);
  assert.ok(n.ChairmanCSV.preview(w,'horse','模板版本,马名,导入时年龄,出生年份\n1,矛盾,3,100').errors.length);
});
