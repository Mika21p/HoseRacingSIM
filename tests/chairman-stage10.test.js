const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs');
const {loadChairmanRules}=require('./helpers/project-loader'),{createFixtures}=require('../scripts/lib/chairman-scheduling-fixtures');
function setup(name,trace=false){const p=loadChairmanRules(),source=require('../scripts/lib/chairman-stage10-variants').variant(fs.readFileSync('artifacts/chairman-stage10-baseline-world.js','utf8'),name),t=require('../scripts/lib/chairman-stage10-trace').attach(p,source,trace),n=p.rules,f=createFixtures(n);return {n,f,w:f.world(),t};}
test('young filly can book a legal near prep while retaining her major target',()=>{
 const {n,f,w}=setup('prep');w.horses=w.horses.slice(0,1);const h=w.horses[0];h.gender='牝马';h.birthYear=-2;
 w.races=[{...f.race(w,'goal','g1',{turn:4}),prestige:100},{...f.race(w,'prep','g2'),prestige:80}];
 n.ChairmanWorld.plan(w);assert.equal(h.target.raceId,'goal');assert.equal(h.booked.raceId,'prep');
 const first=JSON.stringify(w);n.ChairmanWorld.plan(w);assert.equal(JSON.stringify(w),first);
});
test('prep coordination does not bypass race intervals or locked bookings',()=>{
 const {n,f,w}=setup('prep');w.horses=w.horses.slice(0,1);const h=w.horses[0];h.gender='牝马';h.birthYear=-2;
 w.races=[{...f.race(w,'goal','g1',{turn:2}),prestige:100},{...f.race(w,'prep','g2'),prestige:80}];n.ChairmanWorld.plan(w);assert.equal(h.booked.raceId,'goal');
 w.races[0].month=3;f.pin(w,w.races[0],0);const booked=JSON.stringify(h.booked);n.ChairmanWorld.plan(w);assert.equal(JSON.stringify(h.booked),booked);
});
test('distant high-prestige intentions compete on public results while near targets retain places',()=>{
 for(const turn of [4,8]){const {n,f,w}=setup('intent');w.horses=w.horses.slice(0,2);w.horses[1].annual.manual=100;
 w.races=[{...f.race(w,'major','g1',{turn}),capacity:1,prestige:100},{...f.race(w,'other','g1',{turn}),prestige:80}];w.horses[1].target={raceId:'major',turn};
 n.ChairmanWorld.plan(w);assert.equal(w.horses[turn===4?1:0].target.raceId,'major');const saved=JSON.stringify(w);n.ChairmanWorld.plan(w);assert.equal(JSON.stringify(w),saved);}
});
test('capacity trace identifies a stronger applicant blocked by a lower rated held intention without changing outcomes',()=>{
 const a=setup('baseline'),b=setup('baseline',true);a.w.horses=a.w.horses.slice(0,2);a.w.horses[1].annual.manual=100;
 a.w.races=[{...a.f.race(a.w,'major','g1',{turn:8}),capacity:1,prestige:100},{...a.f.race(a.w,'other','g1',{turn:8}),prestige:80}];a.w.horses[1].target={raceId:'major',turn:8};const copy=b.n.ChairmanRules.clone(a.w);
 a.n.ChairmanWorld.plan(a.w);b.n.ChairmanWorld.plan(copy);assert.equal(JSON.stringify(a.w),JSON.stringify(copy));assert.ok(b.t.result.farHeldLower>0);
});
test('distant intent review preserves locked places and ignores hidden strength',()=>{
 const {n,f,w}=setup('intent');w.horses=w.horses.slice(0,2);w.races=[{...f.race(w,'major','g1',{turn:8}),capacity:1,prestige:100},f.race(w,'other','g1',{turn:8})];
 w.horses[1].target={raceId:'major',turn:8};f.pin(w,w.races[0],1);const saved=JSON.stringify(w.horses[1].booked),b=n.ChairmanRules.clone(w);b.horses[0].strength=1;b.horses[1].strength=150;
 n.ChairmanWorld.plan(w);n.ChairmanWorld.plan(b);assert.equal(JSON.stringify(w.horses[1].booked),saved);assert.equal(JSON.stringify(w.horses.map(h=>h.booked)),JSON.stringify(b.horses.map(h=>h.booked)));
});
test('limited review only contests clearly weaker unbooked intentions, never confirmed entries',()=>{
 for(const booked of [false,true]){const {n,f,w}=setup('review');w.horses=w.horses.slice(0,2);w.horses[1].annual.manual=100;
 w.races=[{...f.race(w,'major','g1',{turn:4}),capacity:1,prestige:100},{...f.race(w,'other','g1',{turn:4}),prestige:80}];w.horses[1].target={raceId:'major',turn:4};if(booked)w.horses[1].booked={raceId:'major',turn:4};
 n.ChairmanWorld.plan(w);assert.equal(w.horses[booked?1:0].target.raceId,'major');const saved=JSON.stringify(w);n.ChairmanWorld.plan(w);assert.equal(JSON.stringify(w),saved);}
});
