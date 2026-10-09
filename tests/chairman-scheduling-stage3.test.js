const test=require('node:test'),assert=require('node:assert/strict');
const {loadChairmanRules}=require('./helpers/project-loader');
const {createFixtures}=require('../scripts/lib/chairman-scheduling-fixtures');
const A=require('../scripts/lib/chairman-scheduling-audit');
function setup(){const n=loadChairmanRules().rules,f=createFixtures(n),w=f.world();w.horses=w.horses.slice(0,1);return {n,f,w,h:w.horses[0],V:n.ChairmanWorld,W:n.ChairmanRules};}
function abroad(w,h){h.locationRegionId=w.regions[1].id;h.locationRegion=w.regions[1].name;}

test('domestic comparable races beat empty ordinary intercontinental races across seeds',()=>{
 const {f,V}=setup();for(let seed=1;seed<=30;seed++){const w=f.world();w.seed=seed;w.horses=w.horses.slice(0,1);w.races=[f.race(w,'local','g3',{turn:2}),f.race(w,'empty','g3',{turn:2,region:1})];V.plan(w);assert.equal(w.horses[0].booked.raceId,'local');assert.equal(w.horses[0].transit,undefined);}
});
test('high prestige target remains attractive; public route gap permits a non-elite traveller',()=>{
 const {f,w,h,V}=setup();w.races=[{...f.race(w,'international','g1',{turn:2,region:1}),prestige:100},f.race(w,'local','g3',{turn:2})];V.plan(w);assert.equal(h.booked.raceId,'international');assert.equal(h.campaign.reason,'国际高声望目标');
 const q=f.world(),x=q.horses[0];q.horses=[x];x.annual.manual=80;x.recentForm=[-1,-4].map(turn=>({turn,tf:80,surface:'草地',distance:1600,rank:3}));q.races=[f.race(q,'only-route','op',{turn:2,region:1})];V.plan(q);assert.equal(x.booked.raceId,'only-route');assert.equal(x.campaign.reason,'国内适合路线缺口');
});
test('outbound preparation preserves physical location until arrival and repeated planning is stable',()=>{
 const {f,w,h,V}=setup();w.races=[{...f.race(w,'foreign','g1',{turn:2,region:1}),prestige:100}];V.plan(w);assert.equal(h.locationRegionId,h.homeRegionId);assert.equal(h.transit.arrivalTurn,2);const hash=A.hash(w);V.plan(w);V.synchronize(w);assert.equal(A.hash(w),hash);
 w.turn=1;V.travelTick(w);assert.equal(h.locationRegionId,h.homeRegionId);assert.equal(V.route(w,h,{regionId:h.homeRegionId},3).reachable,false);
 w.turn=2;V.travelTick(w);assert.equal(h.locationRegionId,w.regions[1].id);assert.equal(h.transit,null);V.validate(w);
});
test('old save abroad without a target gets a timed return; no booking while returning',()=>{
 const {f,w,h,V}=setup();abroad(w,h);const random=[w.rngState,w.aiRngState];V.synchronize(w);assert.equal(h.transit,undefined);V.plan(w);assert.equal(h.transit.kind,'return');assert.equal(h.locationRegionId,w.regions[1].id);
 const saved=A.copy(w);V.synchronize(saved);V.plan(saved);assert.equal(A.hash(saved),A.hash(w));assert.deepEqual([w.rngState,w.aiRngState],random);
 w.races=[f.race(w,'home','g1',{turn:1})];w.turn=1;V.travelTick(w);V.plan(w);assert.equal(h.booked,null);assert.equal(h.locationRegionId,w.regions[1].id);
 w.turn=2;V.travelTick(w);assert.equal(h.locationRegionId,h.homeRegionId);assert.equal(h.campaign,null);
});
test('local follow-up does not count as a new trip; no endless stay beyond campaign horizon',()=>{
 const {f,w,h,V}=setup();abroad(w,h);h.campaign={originRegionId:h.homeRegionId,homeRegionId:h.homeRegionId,destinationRegionId:h.locationRegionId,createdTurn:0,arrivalTurn:0,status:'staying',primaryTarget:{raceId:'first',turn:0}};h.lastRaceTurn=0;w.turn=1;w.races=[f.race(w,'follow','g3',{turn:3,region:1})];V.plan(w);assert.equal(h.booked.raceId,'follow');assert.equal(h.transit,undefined);assert.equal(h.campaign.nextRace.raceId,'follow');
 h.booked=null;w.lockedRaces={};w.turn=12;w.races=[f.race(w,'late','g3',{turn:15,region:1})];V.plan(w);assert.equal(h.booked,null);assert.equal(h.transit.kind,'return');
});
test('injury releases a now-impossible foreign booking and returns with real transport time',()=>{
 const {f,w,h,V}=setup();abroad(w,h);w.races=[f.race(w,'follow','g1',{turn:3,region:1})];V.plan(w);h.restUntil=9;V.plan(w);assert.equal(h.booked,null);assert.equal(h.transit.kind,'return');assert.equal(h.transit.arrivalTurn,2);assert.equal(h.restUntil,9);
});
test('cross-year locked leg survives departure and arrival, then returns after cancellation',()=>{
 const {f,w,h,V,W}=setup();w.turn=22;w.races=[{...f.race(w,'next-year','g1',{turn:24,region:1}),prestige:100}];V.plan(w);assert.equal(h.transit.arrivalTurn,24);assert.ok(w.lockedRaces['2:next-year']);
 w.turn=23;V.travelTick(w);V.plan(w);assert.equal(h.booked.turn,24);w.turn=24;V.travelTick(w);V.plan(w);assert.equal(h.booked.raceId,'next-year');
 const reserve=A.copy(h);reserve.id='reserve';reserve.booked=null;reserve.transit=null;reserve.restUntil=99;w.horses.push(reserve);
 const out=W.advanceHalfMonth(w,{deferHonors:true});assert.equal(out.occurrences[0].status,'cancelled');const next=out.world.horses[0];assert.equal(next.transit.kind,'return');assert.equal(next.locationRegionId,w.regions[1].id);
});
test('nearby travel and overrides are respected; repeated intercontinental burden decays across years',()=>{
 const {w,h,V}=setup(),path={fromRegionId:w.regions[0].id,targetRegionId:w.regions[1].id};assert.equal(V.travelTurns(w,path.fromRegionId,path.targetRegionId),2);h.travelHistory=[{departureTurn:22,crossGroup:true},{departureTurn:23,crossGroup:true}];w.turn=24;assert.equal(V.travelBurden(w,h,path),4);w.turn=36;assert.equal(V.travelBurden(w,h,path),0);
 w.regions[1].trafficGroup=w.regions[0].trafficGroup;assert.equal(V.travelTurns(w,path.fromRegionId,path.targetRegionId),1);assert.equal(V.travelBurden(w,h,path),0);w.travelOverrides[[path.fromRegionId,path.targetRegionId].sort().join('|')]=4;assert.equal(V.travelTurns(w,path.fromRegionId,path.targetRegionId),4);
});
test('region transfer preserves transit and a locked booking; disabling an occupied region is blocked',()=>{
 const {n,V,W}=setup();let w=V.create({worldType:'reference',regionKeys:['japan','usa'],population:{japan:1,usa:0},breeding:false,seed:42});const h=w.horses[0];w.races=[];w.meetingGroups=[];w.venueAssignments=[];w.lockedRaces={};h.booked=null;h.target=null;h.locationRegionId=w.regions[1].id;h.locationRegion=w.regions[1].name;V.plan(w);
 const old=A.copy(h.transit);w=W.edit(w,'horse',{id:h.id,homeRegionId:w.regions[1].id}).world;assert.deepEqual(A.copy(w.horses[0].transit),old);assert.equal(w.horses[0].locationRegionId,w.regions[1].id);
 assert.throws(()=>V.edit(w,'region',{id:w.regions[1].id,disabled:true}),/关联/);assert.ok(n);
});
test('audit distinguishes departures, arrivals and starts and observes return without mutating it',()=>{
 const {n,f,w,h,V}=setup();abroad(w,h);V.plan(w);const metrics=A.newMetrics(),before=A.copy(w),after=A.copy(w);after.turn=1;V.travelTick(after);A.recordTurn({ChairmanRules:{},ChairmanWorld:V},before,{world:after,performances:[],occurrences:[]},null,metrics,{});assert.equal(metrics.departures,1);assert.equal(metrics.returnDepartures,1);assert.equal(metrics.crossGroupDepartures,1);assert.equal(metrics.locationChanges,0);assert.equal(metrics.performances,0);
 w.races=[f.race(w,'local','g1',{turn:2})];const audit=A.createPlanAudit(n,w);V.plan(w,audit.sink);assert.equal(audit.summary.races['1:local'].eligible,1);assert.equal(audit.summary.rejected['return-transit'],1);
});
test('two actual foreign starts share one outbound trip and cannot run during preparation',()=>{
 const {f,V,W}=setup();let w=f.world();w.horses=w.horses.slice(0,2);w.races=[{...f.race(w,'first','g1',{turn:2,region:1}),prestige:100},{...f.race(w,'second','g1',{turn:5,region:1}),prestige:100}];V.plan(w);
 let performances=[];for(let i=0;i<6;i++){const out=W.advanceHalfMonth(w,{deferHonors:true});if(i<2)assert.equal(out.performances.length,0);performances.push(...out.performances);w=out.world;}
 assert.equal(performances.length,4);for(const h of w.horses){assert.equal(h.travelHistory.filter(t=>t.kind==='race').length,1);assert.equal(h.transit.kind,'return');assert.equal(h.transit.arrivalTurn,8);}
});
test('campaign and transit survive full backup export and fork restore',async()=>{
 const fs=require('node:fs'),vm=require('node:vm'),{IDBFactory,IDBKeyRange}=require('fake-indexeddb');
 const p=loadChairmanRules(),n=p.rules,V=n.ChairmanWorld;
 const w=V.create({id:'campaign-backup',worldType:'reference',regionKeys:['japan','usa'],population:{japan:2,usa:0},breeding:false,seed:42});
 w.races=[];w.meetingGroups=[];w.venueAssignments=[];w.lockedRaces={};for(const h of w.horses){h.booked=null;h.target=null;abroad(w,h);}V.plan(w);
 Object.assign(p.context.window,{indexedDB:new IDBFactory(),IDBKeyRange,setInterval,clearInterval});vm.runInContext(fs.readFileSync('js/chairman-storage.js','utf8'),p.context);
 const store=await n.ChairmanStorage.open();try{await store.acquire(w.id);await store.commitChanges(null,{world:w});const backup=await store.exportWorld(w.id);const restored=await store.importWorld(backup);assert.deepEqual(A.copy(restored.horses.map(h=>[h.campaign,h.transit,h.travelHistory])),A.copy(w.horses.map(h=>[h.campaign,h.transit,h.travelHistory])));V.synchronize(restored);V.plan(restored);assert.deepEqual(A.copy(restored.horses.map(h=>h.transit)),A.copy(w.horses.map(h=>h.transit)));}finally{await store.close();}
});
test('a third-country target requires the second real journey and preserves the committed leg',()=>{
 const {V,W,f}=setup();let w=V.create({worldType:'reference',regionKeys:['japan','usa','britain'],population:{japan:2,usa:0,britain:0},annualTargets:{japan:0,usa:0,britain:0},breeding:false,seed:42});
 w.meetingGroups=[];w.venueAssignments=[];w.series=[];w.seriesState.current=[];w.lockedRaces={};w.horses.forEach(h=>{Object.assign(h,{birthYear:-3,qualification:4,booked:null,target:null});h.lifetime.starts=4;h.lifetime.wins=1;h.annual.manual=140;});
 w.races=[{...f.race(w,'usa','g1',{turn:2,region:1}),prestige:100},{...f.race(w,'britain','g1',{turn:5,region:2}),prestige:100}];V.plan(w);
 for(let i=0;i<3;i++)w=W.advanceHalfMonth(w,{deferHonors:true}).world;
 for(const h of w.horses){assert.equal(h.locationRegionId,w.regions[1].id);assert.equal(h.transit.toRegionId,w.regions[2].id);assert.equal(h.transit.arrivalTurn,5);assert.equal(h.booked.raceId,'britain');assert.equal(h.travelHistory.length,2);}
 const hash=A.hash(w);V.plan(w);assert.equal(A.hash(w),hash);
 w=W.advanceHalfMonth(w,{deferHonors:true}).world;assert.ok(w.horses.every(h=>h.locationRegionId===w.regions[1].id));w=W.advanceHalfMonth(w,{deferHonors:true}).world;assert.ok(w.horses.every(h=>h.locationRegionId===w.regions[2].id));
});
