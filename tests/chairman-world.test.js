const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {loadChairmanRules}=require('./helpers/project-loader');
const {IDBFactory,IDBKeyRange}=require('fake-indexeddb');
function setup(keys=['usa'],population=40){const p=loadChairmanRules(),n=p.rules;return {...p,n,W:n.ChairmanRules,V:n.ChairmanWorld,w:n.ChairmanWorld.create({id:'new-world',worldType:'reference',regionKeys:keys,population:Object.fromEntries(keys.map(k=>[k,population])),foundation:false,seed:42})};}
test('529 sources reconcile, confirmed races have concrete venues, BC 与 JBC 成员分别归入举办组',()=>{
 const {n,w,V}=setup(['japan','usa','britain','france','ireland','germany','italy'],4);const rows=n.ChairmanVenues.catalogue();
 assert.equal(rows.length,529);for(const [key,count]of Object.entries({japan:190,usa:150,britain:68,france:60,ireland:39,germany:14,italy:8}))assert.equal(rows.filter(r=>r.regionKey===key).length,count);
 assert.equal(new Set(rows.map(r=>r.sourceId)).size,529);assert.equal(w.meetingGroups.find(g=>g.sourceKey==='breeders-cup').raceIds.length,14);assert.equal(w.meetingGroups.find(g=>g.sourceKey==='jbc').raceIds.length,3);assert.equal(w.tracks.filter(t=>t.regionKey==='japan').length,17);
 for(const r of rows){assert.ok(r.reason);if(r.status==='confirmed'){assert.ok(r.sourceUrl);assert.ok(n.ChairmanVenues.tracks.some(t=>t.key===r.venueKey));}else assert.ok(!w.races.some(x=>x.sourceId===r.sourceId));}
 for(const r of w.races.filter(r=>!r.support)){assert.ok(V.resolveRace(w,r).trackName);assert.ok(!/英国赛马场|美国赛马场/.test(V.resolveRace(w,r).trackName));}
 assert.equal(V.resolveRace(w,w.races.find(r=>r.sourceId==='july-cup')).courseName,'July Course');
});
test('BC rotation, annual override, frozen snapshots, cancelled first leg and disabled group remain coherent',()=>{
 let {w,V,W}=setup();const g=w.meetingGroups[0],r=w.races.find(r=>r.id===g.raceIds[0]);
 for(let y=1;y<=6;y++)assert.equal(new Set(g.raceIds.map(id=>V.resolveRace(w,w.races.find(r=>r.id===id),y).trackId)).size,1);
 assert.deepEqual([1,2,3,4].map(y=>V.resolveRace(w,r,y).trackId),[g.trackIds[0],g.trackIds[1],g.trackIds[2],g.trackIds[0]]);
 w=V.edit(w,'meeting',{id:g.id,yearOverrides:{2:g.trackIds[2]}}).world;assert.equal(V.resolveRace(w,r,3).trackId,g.trackIds[2]);
 V.freeze(w,r.id,1);const frozen=JSON.stringify(V.resolveRace(w,r,1));
 w=V.edit(w,'track',{id:g.trackIds[0],regionId:w.regions[0].id,name:'改名后的主场'}).world;
 w=V.edit(w,'meeting',{id:g.id,enabled:false,trackIds:[...g.trackIds].reverse()}).world;
 assert.equal(JSON.stringify(V.resolveRace(w,r,1)),frozen);assert.equal(JSON.stringify(V.resolveRace(JSON.parse(JSON.stringify(w)),r,1)),frozen);
 assert.throws(()=>V.edit(w,'meeting',{id:g.id,yearOverrides:{1:g.trackIds[1]}}),/锁定/);W.validateWorld(w);
});
test('JBC rotation keeps the three dirt G1 races at one local venue and freezes the annual snapshot',()=>{
 let {w,V}=setup(['japan'],20);const g=w.meetingGroups.find(g=>g.sourceKey==='jbc'),r=w.races.find(r=>r.id===g.raceIds[0]);
 assert.equal(g.trackIds.length,7);assert.equal(new Set(g.raceIds.map(id=>w.races.find(r=>r.id===id).surface)).size,1);
 for(let y=1;y<=8;y++)assert.equal(new Set(g.raceIds.map(id=>V.resolveRace(w,w.races.find(r=>r.id===id),y).trackId)).size,1);
 assert.deepEqual([1,2,3,4,5,6,7,8].map(y=>V.resolveRace(w,r,y).trackId),[...g.trackIds,g.trackIds[0]]);
 V.freeze(w,r.id,2);const frozen=JSON.stringify(V.resolveRace(w,r,2));
 w=V.edit(w,'meeting',{id:g.id,trackIds:[...g.trackIds].reverse()}).world;
 assert.equal(JSON.stringify(V.resolveRace(w,r,2)),frozen);
});
test('invalid venue surfaces, duplicate membership, conflicting groups and stale preview are rejected atomically',()=>{
 const {w,V,W}=setup();const g=w.meetingGroups[0];
 assert.throws(()=>V.edit(w,'meeting',{id:g.id,raceIds:[g.raceIds[0],g.raceIds[0]]}),/重复/);
 assert.throws(()=>V.edit(w,'meeting',{...g,id:undefined,name:'冲突组'}),/两个/);
 assert.throws(()=>V.edit(w,'meeting',{id:g.id,trackIds:[w.tracks.find(t=>t.key==='kentucky-downs').id]}),/不支持/);
 const preview=V.preview(w,'region',{id:w.regions[0].id,name:'新名称'});assert.equal(w.regions[0].name,'美国');assert.throws(()=>V.apply(W.mutate(w,()=>{}).world,preview),/重新预览/);
});
test('region identity survives rename, transfer never rerolls and transport uses actual location with max interval',()=>{
 let {w,V,W}=setup(['britain','france','usa']);const a=w.regions[0],b=w.regions[1],u=w.regions[2],h=w.horses[0],before=JSON.stringify([h.surfaceGrades,h.trackAptitudes,h.generationProfile]);
 assert.equal(V.travelTurns(w,a.id,b.id),1);assert.equal(V.travelTurns(w,a.id,u.id),2);
 w=V.edit(w,'traffic',{from:a.id,to:u.id,turns:4}).world;assert.equal(V.travelTurns(w,u.id,a.id),4);
 w=V.edit(w,'region',{id:a.id,name:'可编辑英国'}).world;assert.equal(w.horses.find(x=>x.id===h.id).homeRegion,'可编辑英国');
 w=W.edit(w,'horse',{id:h.id,homeRegionId:b.id}).world;const moved=w.horses.find(x=>x.id===h.id);assert.equal(moved.homeRegionId,b.id);assert.equal(JSON.stringify([moved.surfaceGrades,moved.trackAptitudes,moved.generationProfile]),before);
 assert.equal(moved.locationRegionId,a.id);moved.locationRegionId=b.id;moved.lastRaceTurn=0;w.turn=1;assert.equal(V.route(w,moved,{regionId:u.id},3).reachable,true);assert.equal(V.route(w,moved,{regionId:u.id},2).reachable,false);
 assert.throws(()=>V.edit(w,'region',{id:b.id,disabled:true}),/关联/);
});
test('Japanese qualifications promote on actual wins, adult maiden outlets and overseas novice entry',()=>{
 const {w,V,W}=setup(['japan','usa']);const h=w.horses[0],jp=w.regions[0],us=w.regions[1];h.qualification=0;h.lifetime.starts=0;
 assert.equal(V.eligible(w,h,{raceClass:'new',regionId:jp.id}),true);assert.equal(V.eligible(w,h,{raceClass:'op',regionId:jp.id}),false);assert.equal(V.eligible(w,h,{raceClass:'op',regionId:us.id}),true);assert.equal(V.eligible(w,h,{raceClass:'g1',regionId:us.id}),false);
 V.recordPerformance(h,{rank:1,raceClass:'maiden'});assert.equal(h.qualification,1);V.recordPerformance(h,{rank:1,raceClass:'one-win'});assert.equal(h.qualification,2);V.recordPerformance(h,{rank:1,raceClass:'op'});assert.equal(h.qualification,4);
 assert.ok(w.races.some(r=>r.raceClass==='maiden'&&r.ageRule==='4+'));W.validateWorld(w);
});
test('regional generation uses the common surface and track-type aptitude fields',()=>{
 const {n,V}=setup([],0),patterns=new Set();
 for(const spec of n.ChairmanVenues.regionSpecs){const p={...V.defaults()};if(spec.key==='japan')p.surfaceWeights={草地:70,泥地:25,二刀流:5};
 n.Random.withSource(n.Random.seeded(914),()=>{for(let i=0;i<1000;i++){const h=n.HorseRules.generateHorse({chairmanProfile:p});n.TrackAptitudeRules.validateHorse(h);assert.equal(h.grass,undefined);assert.equal(h.dirt,undefined);assert.equal(h.courseGrades,undefined);patterns.add(Object.values(h.trackAptitudes).sort().join(''));}});
 }
 assert.ok(patterns.has('△○○'));assert.ok(patterns.has('△△◎'));assert.ok(!patterns.has('◎◎◎'));
});
test('single-event v2 packages carry rotating dependencies and successive imports merge the source group',()=>{
 const {w,n,W,V}=setup();const g=w.meetingGroups[0];V.freeze(w,g.raceIds[0],1);
 let target=V.create({worldType:'blank',id:'target',seed:9});const first=n.ChairmanPackages.exportEvents(w,{raceIds:[g.raceIds[0]]}),second=n.ChairmanPackages.exportEvents(w,{raceIds:[g.raceIds[1]]});
 assert.equal(first.version,2);assert.equal(first.tracks.length,3);
 target=n.ChairmanPackages.apply(target,n.ChairmanPackages.preview(target,first),true).world;
 target=n.ChairmanPackages.apply(target,n.ChairmanPackages.preview(target,second),true).world;
 target=n.ChairmanPackages.apply(target,n.ChairmanPackages.preview(target,first),true).world;
 assert.equal(target.races.length,2);assert.equal(target.meetingGroups.length,1);assert.equal(target.meetingGroups[0].raceIds.length,2);assert.equal(target.venueAssignments.find(a=>a.year===1).races.length,2);W.validateWorld(target);
 assert.throws(()=>n.ChairmanPackages.preview(W.createWorld({blank:true}),first),/旧世界/);
});
test('v9 storage, backup, fork restore preserve version, annual snapshots and ordinary result history',async()=>{
 const {w,n,W,V,context}=setup(['usa'],80);Object.assign(context.window,{indexedDB:new IDBFactory(),IDBKeyRange,setInterval,clearInterval});for(const f of ['js/chairman-storage.js','js/chairman-history.js'])vm.runInContext(fs.readFileSync(f,'utf8'),context);
 const store=await n.ChairmanStorage.open();try{await store.acquire(w.id);await store.commitChanges(null,{world:w});V.freeze(w,w.meetingGroups[0].raceIds[0],1);const out=W.advanceHalfMonth(w);await store.commitChanges(w,out,{checkpoint:'turn'});const saved=await store.exportWorld(w.id);assert.equal(saved.version,9);store.validateSnapshot(saved);assert.ok((await store.historyPage(out.world,{},0)).rows.some(r=>r.raceClass==='op'));
 const restored=await store.importWorld(saved);assert.equal(restored.worldSystemVersion,2);assert.equal(JSON.stringify(restored.venueAssignments),JSON.stringify(out.world.venueAssignments));store.validateSnapshot(await store.exportWorld(restored.id));
 }finally{await store.close();}
});
test('frozen venue leaves unlocked member definitions editable and records the actual final edition',()=>{
 let {w,V,W}=setup(['usa'],40);const g=w.meetingGroups[0],id=g.raceIds[1];V.freeze(w,g.raceIds[0],1);
 w=V.edit(w,'race',{id,distance:2222}).world;const race=w.races.find(r=>r.id===id),actual=V.resolveRace(w,race,1);assert.equal(actual.distance,2222);assert.equal(actual.trackId,g.trackIds[0]);
 V.rememberActual(w,actual,1);w.turn=24;assert.equal(V.resolveRace(w,race,1).distance,2222);assert.equal(V.resolveRace(w,race,2).trackId,g.trackIds[1]);
 assert.throws(()=>V.edit(w,'track',{id:race.trackId,regionId:w.regions[0].id,configurations:[]}),/配置/);
});
test('cross-year preparation and series snapshot freeze the whole meeting without creating entrants',()=>{
 let {w,V,W,n}=setup(['usa','britain'],16);const g=w.meetingGroups[0],members=g.raceIds.slice(0,2),track=w.tracks.find(t=>t.id===g.trackIds[1]);
 for(const id of members){const r=w.races.find(r=>r.id===id);r.month=1;r.half=1;}
 const h=w.horses.find(h=>h.homeRegionId===w.regions[1].id);w.turn=23;h.booked={raceId:members[0],turn:24,preparationTurn:22,fromRegionId:h.homeRegionId,targetRegionId:track.regionId,targetRegion:w.regions[0].name,travelTurns:2};V.plan(w);
 assert.ok(w.venueAssignments.find(a=>a.year===2).frozen);assert.equal(V.resolveRace(w,w.races.find(r=>r.id===members[1]),2).trackId,track.id);
 assert.ok(!w.lockedRaces['2:'+members[1]]);assert.throws(()=>V.edit(w,'meeting',{id:g.id,yearOverrides:{2:g.trackIds[0]}}),/锁定/);
 let other=setup(['usa'],12).w;const group=other.meetingGroups[0],ids=group.raceIds.slice(0,2);other.races.find(r=>r.id===ids[0]).month=1;other.races.find(r=>r.id===ids[0]).half=1;other.races.find(r=>r.id===ids[1]).month=3;
 other=n.ChairmanSeries.edit(other,{name:'独立连冠',title:'连冠',ageRule:'all',raceIds:ids,bonus:10,honorWeight:1},{acceptWarnings:true}).world;n.ChairmanSeries.prepare(other,true);assert.ok(other.venueAssignments.find(a=>a.year===1).frozen);assert.equal(other.horses.flatMap(h=>h.seriesTitles||[]).length,0);
});
test('births freeze regional version and genotype, explicit parents and current horses are not rerolled',()=>{
 let {w,V,W,n}=setup(['japan'],12);const region=w.regions[0],father=w.horses.find(h=>h.gender==='牡马'),mother=w.horses.find(h=>h.gender==='牝马');
 assert.ok(father&&mother);father.status='retired';mother.status='retired';father.birthYear=-9;mother.birthYear=-8;father.breeding.status='active';mother.breeding.status='active';father.breeding.pinned=true;mother.breeding.pinned=true;
 w.breeding.manual=[{fatherId:father.id,motherId:mother.id,homeRegion:region.name}];const out={breedingYears:[]},locked=n.ChairmanBreeding.closeYear(w,out),child=locked.find(p=>p.fatherId===father.id&&p.motherId===mother.id);assert.ok(child);const genotype=JSON.stringify(child.offspring);
 const profile=JSON.parse(JSON.stringify(region.generation));profile.surfaceWeights={草地:0,泥地:100,二刀流:0};w=V.edit(w,'region',{id:region.id,generation:profile}).world;assert.equal(JSON.stringify(child.offspring),genotype);
 w.turn=24;const births={};n.ChairmanBreeding.startYear(w,births,[child]);const h=w.horses.find(h=>h.id===births.breedingEvents[0].horseId);assert.equal(JSON.stringify(h.surfaceGrades),JSON.stringify(child.offspring.surfaceGrades));assert.equal(JSON.stringify(h.trackAptitudes),JSON.stringify(child.offspring.trackAptitudes));assert.equal(JSON.stringify(h.generationProfile),JSON.stringify(child.generationProfile));assert.equal(h.generationVersion,1);assert.equal(w.regions[0].generationVersion,2);
});
test('reference refresh previews differences, preserves edits and pending venue selection is explicitly player supplied',()=>{
 let {w,V,n}=setup(['britain','france'],4);const r=w.races.find(r=>r.sourceRecord);w=V.edit(w,'race',{id:r.id,name:'本世界自定名'}).world;
 const gen=n.ChairmanWorldPackages.referencePreview(w);let p;for(;;){const x=gen.next();if(x.done){p=x.value;break;}}assert.equal(w.races.find(x=>x.id===r.id).name,'本世界自定名');w=n.ChairmanPackages.apply(w,p,true).world;assert.equal(w.races.find(x=>x.id===r.id).name,'本世界自定名');
 // Synthetic missing-venue fixture: the bundled catalogue now has no pending entries.
 const pending=w.referenceAudit.find(r=>r.sourceId==='europe-listed-goliath-cup-stakes');pending.status='pending';const removed=w.races.find(r=>r.sourceId===pending.sourceId);w.sourceMappings=w.sourceMappings.filter(m=>m.kind!=='race'||m.localId!==removed.id);w.races=w.races.filter(r=>r.id!==removed.id);w=V.edit(w,'source',{sourceId:pending.sourceId,trackId:w.tracks.find(t=>t.surfaces.includes('草地')).id}).world;assert.equal(w.races.find(r=>r.sourceId===pending.sourceId).sourceRecord.status,'modified');assert.equal(w.referenceAudit.find(r=>r.sourceId===pending.sourceId).status,'modified');
 const refresh=n.ChairmanWorldPackages.referencePreview(w);for(;;){const x=refresh.next();if(x.done){w=n.ChairmanPackages.apply(w,x.value,true).world;break;}}assert.equal(w.referenceAudit.find(r=>r.sourceId===pending.sourceId).status,'modified');assert.equal(w.races.filter(r=>r.sourceId===pending.sourceId).length,1);
});

test('series travel validation resolves annual venues and respects chairman traffic overrides',()=>{
 const {w,V,n}=setup(['usa','france'],0),g=w.meetingGroups[0],a=w.races.find(r=>r.id===g.raceIds[0]),b=w.races.find(r=>r.raceClass==='g1'&&!g.raceIds.includes(r.id)&&r.surface==='草地');
 a.month=1;a.half=1;a.ageRule='2+';a.sexRule='all';b.month=2;b.half=2;b.ageRule='2+';b.sexRule='all';
 const foreign=w.regions[1].id;w.tracks.find(t=>t.id===g.trackIds[1]).regionId=foreign;w.turn=24;
 const v={name:'行程检验',title:'称号',ageRule:'all',bonus:0,honorWeight:1,raceIds:[a.id,b.id]};
 assert.equal(n.ChairmanSeries.validateDefinition(w,v).warnings.length,0);
 w.travelOverrides[[foreign,w.regions[0].id].sort().join('|')]=4;
 assert.equal(n.ChairmanSeries.validateDefinition(w,v).warnings.length,1);
 assert.equal(V.resolveRace(w,a,2).regionId,foreign);
});

test('initial population targets, environment versions and fixed-edition venue locks are independently preserved',()=>{
 const {V,W}=setup([],0);let w=V.create({worldType:'reference',regionKeys:['usa'],population:{usa:8},annualTargets:{usa:3},foundation:false,seed:98});
 assert.equal(w.regions[0].initialCount,8);assert.equal(w.regions[0].annualTarget,3);
 const r=w.races.find(r=>!V.groupFor(w,r.id)),track=w.tracks.find(t=>t.id===r.trackId),snapshot=V.resolveRace(w,r,1);
 w.lockedRaces['1:'+r.id]=snapshot;w.races.filter(r=>r.trackId===track.id).forEach(r=>r.deleted=true);
 assert.throws(()=>V.edit(w,'track',{id:track.id,regionId:track.regionId,deleted:true}),/锁定/);
 const area=w.regions[0];w=V.edit(w,'region',{id:area.id,environment:{...area.environment,grass:'欧洲'}}).world;assert.equal(w.regions[0].generationVersion,2);assert.equal(V.resolveRace(w,w.races.find(x=>x.id===r.id),1).chairmanEnvironment.grass,'美国');W.validateWorld(w);
});

test('minimum named fields are reserved across the planning horizon before conflicting starts consume their runners',()=>{
 const {w,V,W}=setup(['usa'],0);w.meetingGroups=[];w.venueAssignments=[];
 const original=w.races.find(r=>r.raceClass==='g1'&&r.surface==='草地');w.races=[{...original,id:'near',name:'先行重赏',month:2,half:1,ageRule:'3+',sexRule:'all'},{...original,id:'later',name:'牝马后续重赏',raceClass:'g3',grade:'G3',month:2,half:2,ageRule:'3+',sexRule:'female'}];
 W.seeded(w,()=>{for(let i=0;i<6;i++)W.addHorse(w,{homeRegionId:w.regions[0].id,homeRegion:w.regions[0].name,age:3,qualification:1,gender:'牝马'});});V.plan(w);
 for(const r of w.races)assert.ok(w.horses.filter(h=>h.booked?.raceId===r.id).length>=2,r.name);
 W.validateWorld(w);
});

test('fixed venue calendar and archive use completed snapshots after rename, race edits and discontinuation',async()=>{
 const {w,n,W,V,context}=setup(['usa'],80);Object.assign(context.window,{indexedDB:new IDBFactory(),IDBKeyRange,setInterval,clearInterval});for(const f of ['js/chairman-storage.js','js/chairman-history.js'])vm.runInContext(fs.readFileSync(f,'utf8'),context);
 const store=await n.ChairmanStorage.open();try{await store.acquire(w.id);await store.commitChanges(null,{world:w});const out=W.advanceHalfMonth(w);await store.commitChanges(w,out);
 const occurrence=out.occurrences.find(r=>r.status==='completed'&&!r.race.meetingGroupId),track=out.world.tracks.find(t=>t.id===occurrence.race.trackId);assert.ok(occurrence);
 let edited=V.edit(out.world,'track',{id:track.id,regionId:track.regionId,name:'未来改名马场'}).world;edited=V.edit(edited,'race',{id:occurrence.raceId,distance:occurrence.race.distance+100,deleted:true}).world;
 const actual=await store.raceEdition(edited,edited.races.find(r=>r.id===occurrence.raceId),1),calendar=(await store.raceEditions(edited,1)).find(r=>r.id===occurrence.raceId);
 assert.equal(actual.trackName,occurrence.race.trackName);assert.equal(actual.distance,occurrence.race.distance);assert.equal(calendar.occurrenceId,occurrence.id);assert.equal(calendar.trackName,actual.trackName);assert.ok(!(await store.raceEditions(edited,2)).some(r=>r.id===occurrence.raceId));
 }finally{await store.close();}
});

test('full event packs keep supplemental races distinct when separate countries reuse generated source numbers',()=>{
 const first=setup(['usa'],0),second=setup(['france'],0);first.w.id='source-us';second.w.id='source-fr';
 const P=first.n.ChairmanPackages;let target=first.V.create({worldType:'blank',id:'mixed',seed:2});
 for(const w of [first.w,second.w])target=P.apply(target,P.preview(target,P.exportEvents(w)),true).world;
 assert.equal(target.races.length,first.w.races.length+second.w.races.length);assert.equal(target.regions.length,2);
 const custom=target.races.find(r=>r.support),distance=custom.distance+100;target=first.V.edit(target,'race',{id:custom.id,distance}).world;target=P.apply(target,P.preview(target,P.exportEvents(first.w),{mode:'update'}),true).world;assert.equal(target.races.find(r=>r.id===custom.id).distance,distance);
 for(const region of target.regions)assert.ok(target.races.some(r=>r.support&&target.tracks.find(t=>t.id===r.trackId).regionId===region.id));
 first.W.validateWorld(target);
});

test('Goliath and Andre Baboin have actual venues shared by ordinary and chairman races',()=>{
 const {w,V,n}=setup(['britain','france'],0);
 assert.equal(n.ChairmanVenues.catalogue().filter(r=>r.status==='pending').length,0);
 for(const [id,key,distance,month,half] of [['europe-listed-goliath-cup-stakes','musselburgh',2800,4,1],['europe-listed-prix-andre-baboin','bordeaux-le-bouscat',1900,10,1]]){
  const source=n.RaceRegistry.all().find(r=>r.id===id),race=w.races.find(r=>r.sourceId===id),actual=V.resolveRace(w,race,1),profile=n.RaceCourseProfiles.resolveForRace(source);
  assert.equal(w.tracks.find(t=>t.id===race.trackId).key,key);
  assert.equal(source.distance,distance);assert.equal(source.month,month);assert.equal(source.half,half);
  assert.equal(profile.trackKey,key);assert.equal(actual.courseProfile.trackKey,key);
  assert.equal(actual.courseProfile.distance,distance);assert.equal(actual.courseProfile.type,profile.type);assert.equal(actual.courseProfile.intensity,1);
 }
 const gold=n.RaceRegistry.all().find(r=>r.id==='ascot-gold-cup');assert.equal(gold.distance,4000);assert.equal(gold.raceClass,'g1');assert.equal(gold.month,6);
});
