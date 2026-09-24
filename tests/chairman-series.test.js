const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {IDBFactory,IDBKeyRange}=require('fake-indexeddb');const {loadChairmanRules}=require('./helpers/project-loader');
const plain=x=>JSON.parse(JSON.stringify(x));
function fixture(breeding=false){const p=loadChairmanRules(),n=p.rules,W=n.ChairmanRules,S=n.ChairmanSeries;let w=W.createWorld({blank:true,seed:801,breeding});w.settings.annualNewHorses=0;
  w=W.edit(w,'track',{name:'连冠测试场',region:'日本',courseType:'东京',surfaces:['草地','泥地']}).world;
  for(let i=0;i<3;i++)w=W.edit(w,'race',{name:'分站'+i,trackId:w.tracks[0].id,raceClass:'g1',surface:'草地',distance:1600+i*400,month:1+i*2,half:1,ageRule:'3',sexRule:'all',capacity:16,prizes:[100,40,25,15,10]}).world;
  W.seeded(w,()=>{W.addHorse(w,{name:'挑战者',age:3,homeRegion:'日本'});W.addHorse(w,{name:'对手',age:3,homeRegion:'日本'});});
  const ids=w.races.map(r=>r.id);w=S.edit(w,{name:'测试三冠',raceIds:ids,bonus:500,honorWeight:3}).world;S.prepare(w,true);return {...p,n,W,S,w,ids};}
function finishLeg(f,w,i,winner=0,cancel=false){w=f.W.clone(w);w.turn=i*4;w.horses.forEach(h=>h.booked=null);f.S.prepare(w);const r=w.races.find(r=>r.id===f.ids[i]),oid=`1:${r.id}`,h=w.horses[winner];const out={world:w,occurrences:[{id:oid,raceId:r.id,year:1,turn:w.turn,status:cancel?'cancelled':'completed',race:f.W.engineRace(w,r),count:cancel?1:2}],performances:cancel?[]:[{id:oid+':'+h.id,occurrenceId:oid,raceId:r.id,year:1,turn:w.turn,horseId:h.id,horseName:h.name,age:3,rank:1,retired:false,prize:100,tf:120}]};f.S.settle(w,out);return out;}

test('series pays once after every leg, independent of other losses; duplicate sets only count maximum honor',()=>{
  const f=fixture(),{S}=f;let w=S.edit(f.w,{name:'同场第二称号',raceIds:f.ids,bonus:200,honorWeight:5},{acceptWarnings:true}).world;
  w=finishLeg(f,w,0).world;assert.equal(w.horses[0].lifetime.prize,0);w.horses[0].lastRace={rank:8};w=finishLeg(f,w,1).world;
  const out=finishLeg(f,w,2);w=out.world;assert.equal(w.horses[0].annual.prize,700);assert.equal(w.horses[0].lifetime.seriesPrize,700);assert.equal(w.horses[0].lifetime.wins,0);assert.equal(out.seriesRewards.length,2);assert.equal(S.honor(w.horses[0]),5);
  S.settle(w,out);assert.equal(w.horses[0].lifetime.prize,700);assert.equal(w.horses[0].seriesTitles.length,2);
});
test('loss, cancelled station and age exclusion yield no winner and reset only current year',()=>{
  for(const reason of ['loss','cancel','age']){const f=fixture();let w=finishLeg(f,f.w,0).world;if(reason==='age')w.seriesState.current[0].ageRule='2';w=finishLeg(f,w,1,reason==='loss'?1:0,reason==='cancel').world;const out=finishLeg(f,w,2);assert.equal(out.world.seriesState.current[0].settled,true);assert.equal(out.world.horses[0].lifetime.prize,0);assert.equal(out.seriesRewards,undefined);w=out.world;w.turn=24;f.S.prepare(w);assert.equal(w.seriesState.current[0].results.length,0);}
});
test('frozen series protects later station definitions and stopping affects next year only',()=>{
  const f=fixture(),{W,S}=f;let w=f.w;const snapshot=plain(S.frozenRace(w,f.ids[1]));assert.ok(snapshot);
  w=W.edit(w,'race',{id:f.ids[1],distance:3000,month:9}).world;assert.equal(W.engineRace(w,w.races[1]).distance,snapshot.distance);
  w=W.edit(w,'deleteRace',{id:f.ids[1]}).world;assert.equal(S.frozenRace(w,f.ids[1]).distance,snapshot.distance);
  w=S.edit(w,{id:w.series[0].id},{stop:true}).world;assert.equal(w.seriesState.current.length,1);w.turn=24;S.prepare(w);assert.equal(w.seriesState.current.length,0);
});
test('new series never claims past wins and rejects incompatible conditions with explicit warning opt-in',()=>{
  const f=fixture(),{W,S}=f;let w=W.clone(f.w);w.turn=2;w=S.edit(w,{name:'晚创建',raceIds:f.ids},{acceptWarnings:true}).world;assert.equal(w.series.at(-1).startYear,2);
  const incompatible=W.clone(f.w);incompatible.races[0].ageRule='2';assert.throws(()=>S.edit(incompatible,{name:'非法',raceIds:f.ids}),/共同合法/);
  const short=W.clone(f.w);short.races[1].month=1;short.races[1].half=2;assert.throws(()=>S.edit(short,{name:'间隔太近',raceIds:f.ids}),/间隔/);
  assert.doesNotThrow(()=>S.edit(short,{name:'间隔太近',raceIds:f.ids},{acceptWarnings:true}));
});
test('AI pursuit boosts next station, protects travel/rest for fallback choices and does not reveal hidden traits',()=>{
  const f=fixture(),{W,S}=f;let w=finishLeg(f,f.w,0).world;w.turn=1;const h=w.horses[0];h.lastRaceTurn=0;W.planEntries(w);assert.equal(h.seriesTarget.wins,1);assert.equal(h.booked.raceId,f.ids[1]);
  const changed=W.clone(w);changed.horses[0].strength=62;changed.horses[0].surfaceGrades.grass='G';changed.aiRngState=w.aiRngState;W.planEntries(changed);assert.equal(changed.horses[0].booked.raceId,f.ids[1]);
  const injured=W.clone(w);injured.horses[0].restUntil=9;W.planEntries(injured);assert.equal(injured.horses[0].seriesTarget,null);assert.equal(injured.horses[0].booked,null);
});
test('series title qualifies a retired participant and adds only honor metric, preserving rating and frozen evidence',()=>{
  const f=fixture(),{n,W}=f;let w=f.w;for(let i=0;i<3;i++)w=finishLeg(f,w,i).world;const h=w.horses[0];h.status='retired';h.lifetime.starts=3;h.annual.tf=100;h.annual.starts=3;
  const candidates=n.ChairmanHonors.getHonorCandidates(w,'central','hall');assert.ok(candidates.some(v=>v.id===h.id));const v=candidates.find(v=>v.id===h.id);assert.equal(v.seriesHonor,3);assert.equal(v.rating,95);assert.equal(v.centralAwards,0);
});
test('events package preserves races, tracks and series and supports repeats, conflicts and stale previews',()=>{
  const f=fixture(),P=f.n.ChairmanPackages,W=f.W,p=P.exportEvents(f.w),target=W.createWorld({blank:true,seed:123});
  const preview=P.preview(target,p),out=P.apply(target,preview,true);assert.equal(out.world.races.length,3);assert.equal(out.world.series.length,1);assert.equal(out.world.series[0].bonus,500);assert.equal(target.races.length,0);assert.equal(target.rngState,out.world.rngState);
  const again=P.preview(out.world,p);assert.equal(again.output.world.races.length,3);assert.ok(again.changes.every(r=>r.action.includes('复用')));
  assert.throws(()=>P.apply({...target,revision:target.revision+1},preview,true),/重新预览/);
  const malformed=plain(p);malformed.races[0].trackId='missing';assert.throws(()=>P.preview(target,malformed),/马场/);assert.equal(target.races.length,0);
  const other=plain(p);other.id='another';assert.throws(()=>P.preview(out.world,other),/名称/);
  const round=P.exportEvents(out.world);assert.deepEqual(round.races.map(r=>[r.name,r.distance,r.month,r.prizes]),p.races.map(r=>[r.name,r.distance,r.month,r.prizes]));
});
test('family template export removes hidden traits, deduplicates ancestors, introduces independently and never restores youth',()=>{
  const f=fixture(true),{W,n}=f,P=n.ChairmanPackages;let w=f.w;
  W.seeded(w,()=>{const father=W.addHorse(w,{name:'家系父',age:12,gender:'牡马'}),mother=W.addHorse(w,{name:'家系母',age:10,gender:'牝马'});w.horses[0].fatherId=father.id;w.horses[0].motherId=mother.id;w.horses[0].gender='牡马';w.horses[0].breeding.everActive=true;n.ChairmanGenetics.setValues(w,w.horses[0],80);});
  const p=P.exportFamily(w,[w.horses[0].id]),text=JSON.stringify(p);assert.equal(p.nodes.length,3);assert.doesNotMatch(text,/strength|peakStart|surfaceGrades|trackAptitudes|rngState|manualRating/);
  let target=W.createWorld({blank:true,seed:3,breeding:true});target=P.apply(target,P.preview(target,p),true).world;assert.equal(target.horses.length,0);assert.equal(target.familyTemplates.length,3);
  const id=target.familyTemplates.find(t=>t.core).id,before=[target.rngState,target.aiRngState,target.breeding.rngState,target.honors.rngState],introduced=P.introduce(target,id,{age:10,region:'日本',pinned:true});
  assert.deepEqual([introduced.world.rngState,introduced.world.aiRngState,introduced.world.breeding.rngState,introduced.world.honors.rngState],before);const h=introduced.world.horses[0];assert.equal(W.ageOf(introduced.world,h),10);assert.equal(h.lifetime.starts,0);assert.equal(h.origin,'ai');assert.ok(h.breeding.strength>=25&&h.breeding.strength<=75);assert.equal(h.breeding.strength,h.genetics.quality);assert.equal(introduced.world.pedigrees.length,2);assert.throws(()=>P.introduce(introduced.world,id),/已经存在/);assert.deepEqual(plain(P.introduce(target,id,{age:10,region:'日本',pinned:true})),plain(introduced));
  const invalid=plain(p);invalid.nodes[0].fatherId=invalid.nodes[0].id;assert.throws(()=>P.preview(target,invalid),/年代|循环|性别/);
});
test('new stores, migration recovery, reward rollback, backup and export include series and family content',async()=>{
  const f=fixture(),{W,n,context}=f;Object.assign(context.window,{indexedDB:new IDBFactory(),IDBKeyRange,setInterval,clearInterval});for(const p of ['js/chairman-storage.js','js/chairman-history.js'])vm.runInContext(fs.readFileSync(p,'utf8'),context);
  const store=await n.ChairmanStorage.open();let w=f.w;try{await store.acquire(w.id);await store.commitChanges(null,{world:w});
    for(let i=0;i<3;i++){const out=finishLeg(f,w,i);out.world.revision=w.revision+1;out.world.horses[0].lifetime.starts=i+1;out.world.horses[0].annual.starts=i+1;
      if(i===2){await assert.rejects(store.commitChanges(w,out,{failForTest:true}),/中断/);assert.equal((await store.load(w.id)).horses[0].seriesTitles,undefined);}
      await store.commitChanges(w,out);w=out.world;
    }
    const snapshot=await store.exportWorld(w.id);assert.equal(snapshot.version,10);assert.equal(store.db.version,10);store.validateSnapshot(snapshot);assert.equal(snapshot.records.seriesRewards.length,1);await store.saveSlot(w.id,1);const restored=await store.loadSlot(1,true);assert.equal(restored.horses[0].seriesTitles.length,1);
    let old=W.createWorld({blank:true});delete old.seriesState;delete old.contentState;delete old.familyTemplates;delete old.series;delete old.sourceMappings;await store.acquire(old.id);await store.commitChanges(null,{world:old});old=await store.load(old.id);assert.ok(old.seriesState);assert.ok((await store.query('checkpoints',old.id)).rows.some(r=>r.kind==='content'));
  }finally{await store.close();}
});

test('a current-date series is editable until entry locking; frozen deleted stations still run this year',()=>{
  const f=fixture(),{W,S}=f;let w=W.clone(f.w);w.seriesState.current[0].frozen=false;w.horses.forEach(h=>h.booked=null);S.prepare(w);assert.equal(w.seriesState.current[0].frozen,false);
  w=S.edit(w,{...w.series[0],bonus:650}).world;assert.equal(w.series[0].startYear,1);assert.equal(w.seriesState.current[0].bonus,650);
  S.prepare(w,true);w=W.edit(w,'deleteRace',{id:f.ids[1]}).world;const held=[];
  while(w.turn<=8){const out=W.advanceHalfMonth(w);held.push(...out.occurrences.map(o=>o.raceId));w=out.world;}
  assert.deepEqual(held,plain(f.ids));assert.equal(w.seriesState.current[0].settled,true);
});

test('series money contributes once to direct parent earnings and champion sire without extra wins',()=>{
  const f=fixture(true),{W,n}=f,B=n.ChairmanBreeding;let w=f.w;
  const father=B.seeded(w,()=>B.founder(w,'日本','牡马'));w.horses[0].fatherId=father.id;
  for(let i=0;i<3;i++)w=finishLeg(f,w,i).world;
  w.horses[0].annual.starts=w.horses[0].lifetime.starts=3;
  assert.equal(B.childStats(w,1).find(s=>s.id===father.id).prize,500);
  assert.equal(w.horses[0].annual.wins,0);assert.equal(w.horses[0].annual.g1,0);
  w.turn=23;w.phase='yearEnd';const out=W.finishYear(w);
  assert.equal(out.breedingYears.find(s=>s.horseId===father.id).champion,true);
});

test('imported templates can breed, template updates preserve individuals and duplicate origins are rejected',()=>{
  const {rules:n}=loadChairmanRules(),W=n.ChairmanRules,P=n.ChairmanPackages,B=n.ChairmanBreeding;
  let source=W.createWorld({blank:true,seed:405,breeding:true});W.seeded(source,()=>{W.addHorse(source,{name:'分享父',age:10,gender:'牡马'});W.addHorse(source,{name:'分享母',age:10,gender:'牝马'});});
  const p=P.exportFamily(source,source.horses.map(h=>h.id));let w=W.createWorld({blank:true,seed:406,breeding:true});w.settings.annualNewHorses=0;
  w=P.apply(w,P.preview(w,p),true).world;for(const t of w.familyTemplates)w=P.introduce(w,t.id,{age:10,region:'日本',pinned:true}).world;
  const before=plain(w.horses),updated=plain(p);updated.nodes[0].name='模板新名';updated.revision='2';w=P.apply(w,P.preview(w,updated,{mode:'update'}),true).world;assert.deepEqual(plain(w.horses),before);
  const father=w.horses.find(h=>h.gender==='牡马'),mother=w.horses.find(h=>h.gender==='牝马');
  w=B.edit(w,'mating',{fatherId:father.id,motherId:mother.id,homeRegion:'日本'}).world;w.turn=23;w.phase='yearEnd';w=W.finishYear(w).world;
  const child=w.horses.find(h=>h.sourceKind==='bred');assert.ok(child);assert.equal(child.fatherId,father.id);assert.equal(child.motherId,mother.id);assert.equal(child.status,'juvenile');assert.equal(W.ageOf(w,child),0);
  const duplicate=plain(p);duplicate.nodes[1].sourceKey=duplicate.nodes[0].sourceKey;assert.throws(()=>P.preview(w,duplicate),/来源身份重复/);
});


test('family identity also recognizes original historical templates already instantiated in a world',()=>{
  const {rules:n}=loadChairmanRules(),W=n.ChairmanRules,P=n.ChairmanPackages,B=n.ChairmanBreeding;
  let w=W.createWorld({blank:true,seed:10,breeding:true});const t=n.ChairmanPedigrees.records.find(t=>t.core&&t.gender==='牡马');
  const h=B.seeded(w,()=>B.founder(w,'日本','牡马',t));const p=P.exportFamily(w,[h.id]);assert.equal(p.nodes[0].sourceKey,'jbis:'+t.id);
  w=P.apply(w,P.preview(w,p),true).world;assert.throws(()=>P.introduce(w,w.familyTemplates.find(t=>t.core).id,{age:10}),/已经存在/);
  let fresh=W.createWorld({blank:true,seed:11,breeding:true});fresh=P.apply(fresh,P.preview(fresh,p),true).world;fresh=P.introduce(fresh,fresh.familyTemplates.find(t=>t.core).id,{age:10}).world;assert.equal(fresh.horses[0].templateId,t.id);
});
