const test=require('node:test'),assert=require('node:assert/strict');
const {loadChairmanRules}=require('./helpers/project-loader');
const clone=v=>JSON.parse(JSON.stringify(v));
const keys=['burst','sustained','attrition'],grade={'△':0,'○':1,'◎':2};
const legal=new Set(['○○△','◎△△','◎○△','○○○','◎○○','◎◎△','◎◎○'].map(s=>[...s].sort().join('')));
function setup(regions=['japan','usa']){const n=loadChairmanRules().rules,V=n.ChairmanWorld,w=V.create({id:'aptitude-test',worldType:'reference',regionKeys:regions,population:Object.fromEntries(regions.map(k=>[k,8])),foundation:false,seed:123});return {n,V,w};}

test('regional weights place the best grade without changing the sampled template or other modes',()=>{
 const {n}=setup([]),H=n.HorseRules,R=n.Random;
 for(const target of keys)for(let seed=1;seed<=150;seed++){
  const a=R.withSource(R.seeded(seed),()=>H.generateTrackAptitudes());
  const b=R.withSource(R.seeded(seed),()=>H.generateTrackAptitudes(Object.fromEntries(keys.map(k=>[k,k===target?1:0]))));
  assert.equal(Object.values(a).sort().join(''),Object.values(b).sort().join(''));
  assert.equal(grade[b[target]],Math.max(...Object.values(b).map(v=>grade[v])));
 }
 const b=R.withSource(()=>0,()=>H.generateTrackAptitudes({burst:0,sustained:0,attrition:1}));assert.equal(b.attrition,'○');
});

test('region validates weights and applies them only to later horses',()=>{
 let {w,V,n}=setup(['japan']);const r=w.regions[0],before=JSON.stringify(w.horses.map(h=>[h.surfaceGrades,h.trackAptitudes,h.generationProfile])),generation=clone(r.generation);
 for(const weights of [{burst:0,sustained:0,attrition:0},{burst:-1,sustained:1,attrition:1},{burst:NaN,sustained:1,attrition:1}])assert.throws(()=>V.edit(w,'region',{id:r.id,generation:{...generation,trackTypeWeights:weights}}),/权重/);
 w=V.edit(w,'region',{id:r.id,generation:{...generation,trackTypeWeights:{burst:0,sustained:0,attrition:1}}}).world;
 assert.equal(JSON.stringify(w.horses.map(h=>[h.surfaceGrades,h.trackAptitudes,h.generationProfile])),before);
 const h=n.ChairmanRules.addHorse(w,{homeRegion:r.name,age:2});assert.equal(grade[h.trackAptitudes.attrition],Math.max(...Object.values(h.trackAptitudes).map(v=>grade[v])));
 assert.equal(h.generationVersion,2);
});

test('five inherited dimensions independently take father, mother, or regional candidate',()=>{
 const {n}=setup([]),B=n.ChairmanBreeding,R=n.Random;
 const f={surfaceGrades:{grass:'A',dirt:'G'},trackAptitudes:{burst:'◎',sustained:'○',attrition:'△'}};
 const m={surfaceGrades:{grass:'C',dirt:'B'},trackAptitudes:{burst:'△',sustained:'◎',attrition:'○'}};
 const random={surfaceGrades:{grass:'G',dirt:'C'},trackAptitudes:{burst:'○',sustained:'△',attrition:'◎'}};
 for(const [roll,parent] of [[.1,f],[.5,m],[.9,random]]) {
  const h=R.withSource(()=>roll,()=>B.inheritAptitudes(clone(random),f,m));
  assert.deepEqual(clone(h.surfaceGrades),parent.surfaceGrades);assert.deepEqual(clone(h.trackAptitudes),parent.trackAptitudes);
  assert.equal(h.surfacePref,n.HorseRules.deriveSurfacePreference(h.surfaceGrades));
 }
 const rolls=[.1,.5,.1,.5,.9],h=R.withSource(()=>rolls.shift()??.1,()=>B.inheritAptitudes(clone(random),f,m));
 assert.deepEqual(clone(h.surfaceGrades),{grass:'A',dirt:'B'});assert.ok(legal.has(Object.values(h.trackAptitudes).sort().join('')));
});

test('projection keeps legal genotypes and selects only minimum-distance legal results for all 27 inputs',()=>{
 const {n}=setup([]),H=n.HorseRules,R=n.Random,all=[];
 for(const a of Object.keys(grade))for(const b of Object.keys(grade))for(const c of Object.keys(grade))all.push({burst:a,sustained:b,attrition:c});
 const candidates=all.filter(v=>legal.has(Object.values(v).sort().join(''))),distance=(a,b)=>keys.reduce((s,k)=>s+(grade[a[k]]-grade[b[k]])**2,0);
 for(const raw of all)for(let seed=1;seed<=15;seed++) {
  const result=R.withSource(R.seeded(seed),()=>H.constrainTrackAptitudes(raw));
  assert.ok(legal.has(Object.values(result).sort().join('')));
  assert.equal(distance(raw,result),Math.min(...candidates.map(c=>distance(raw,c))));
  if(legal.has(Object.values(raw).sort().join('')))assert.deepEqual(clone(result),raw);
 }
});

test('manual courses share by exact surface/distance, remain world-local, and use explicit fallback',()=>{
 let {w,V,n}=setup(['japan']);const t=w.tracks.find(t=>t.key==='tokyo'),r=w.races.find(r=>r.trackId===t.id&&r.surface==='草地'&&r.distance===2400),original=V.resolveRace(w,r);
 assert.equal(original.courseProfile.type,'burst');assert.equal(original.courseProfile.intensity,1);
 const untouched=clone(w),rows=[{surface:'草地',distance:2400,type:'sustained',intensity:2},{surface:'泥地',distance:1800,type:'attrition',intensity:2}];
 w=V.edit(w,'track',{id:t.id,regionId:t.regionId,courseProfiles:rows}).world;
 for(const race of w.races.filter(r=>r.trackId===t.id&&r.surface==='草地'&&r.distance===2400))assert.equal(V.resolveRace(w,race).courseProfile.type,'sustained');
 assert.equal(V.resolveRace(untouched,r).courseProfile.type,'burst');
 assert.equal(V.courseProfile(w,w.tracks.find(x=>x.id===t.id),'草地',2401).chairmanSource,'fallback');
 const fake={id:'fake',name:'虚构马场',surfaces:['草地','泥地'],configurations:[]};
 for(const [surface,distance,type] of [['草地',1600,'burst'],['泥地',1200,'attrition'],['泥地',1800,'sustained']]){
  const p=V.courseProfile(w,fake,surface,distance);assert.equal(p.type,type);assert.equal(p.intensity,1);assert.match(V.courseLabel(p),/暂定/);
 }
 assert.throws(()=>V.edit(w,'track',{id:t.id,regionId:t.regionId,courseProfiles:[rows[0],rows[0]]}),/重复/);
 assert.throws(()=>V.edit(w,'track',{id:t.id,regionId:t.regionId,courseProfiles:[{...rows[0],distance:0}]}),/赛程/);
 const h=clone(w.horses[0]);h.surfaceGrades.grass='G';h.trackAptitudes.sustained='△';
 const calc=n.HorseRules.calcRaceAbility(h,V.resolveRace(w,r),{maturity:{adjustedStrength:60},temperamentMod:{mod:0},noAbilityFloor:true});assert.equal(calc.surfaceMod,-20);assert.equal(calc.trackAptitudeMod,-4);
});

test('BC and JBC read actual venue courses and frozen editions retain classifications after edits',()=>{
 let {w,V}=setup();
 for(const group of w.meetingGroups.filter(g=>['breeders-cup','jbc'].includes(g.sourceKey))) {
  const r=w.races.find(r=>r.id===group.raceIds[0]),t=w.tracks.find(t=>t.id===group.trackIds[1]);
  w=V.edit(w,'track',{id:t.id,regionId:t.regionId,courseProfiles:[{surface:r.surface,distance:r.distance,type:'burst',intensity:2}]}).world;
  assert.equal(V.resolveRace(w,r,2).courseProfile.type,'burst');V.freeze(w,r.id,2);const before=JSON.stringify(V.resolveRace(w,r,2));
  w=V.edit(w,'track',{id:t.id,regionId:t.regionId,courseProfiles:[{surface:r.surface,distance:r.distance,type:'attrition',intensity:1}]}).world;
  assert.equal(JSON.stringify(V.resolveRace(w,r,2)),before);
  assert.equal(V.resolveRace(w,r,2+group.trackIds.length).courseProfile.type,'attrition');
 }
});

test('event packages remap frozen profiles and retain region weights and manual course rows',()=>{
 let {w,V,n}=setup(['usa']);const g=w.meetingGroups[0],r=w.races.find(r=>r.id===g.raceIds[0]),t=w.tracks.find(t=>t.id===g.trackIds[0]);
 w=V.edit(w,'track',{id:t.id,regionId:t.regionId,courseProfiles:[{surface:r.surface,distance:r.distance,type:'sustained',intensity:2}]}).world;
 w.regions[0].generation.trackTypeWeights={burst:7,sustained:2,attrition:1};V.freeze(w,r.id,1);
 const pkg=n.ChairmanPackages.exportEvents(w,{raceIds:[r.id]});let target=V.create({worldType:'blank',id:'other-world',seed:8});target.nextId=900;
 target=n.ChairmanPackages.apply(target,n.ChairmanPackages.preview(target,pkg),true).world;
 const actual=V.resolveRace(target,target.races[0]);assert.equal(actual.courseProfile.type,'sustained');assert.equal(actual.courseProfile.trackId,actual.trackId);assert.match(actual.courseProfile.id,/other-world/);
 assert.equal(target.regions[0].generation.trackTypeWeights.burst,7);assert.equal(target.tracks.find(t=>t.id===actual.trackId).courseProfiles[0].intensity,2);
 assert.equal(target.venueAssignments.find(a=>a.frozen).trackSnapshot.id,actual.trackId);V.validate(target);
});
