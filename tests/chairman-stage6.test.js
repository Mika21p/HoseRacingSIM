const test=require('node:test'),assert=require('node:assert/strict');
const {loadChairmanRules}=require('./helpers/project-loader');
const {createFixtures}=require('../scripts/lib/chairman-scheduling-fixtures');
function setup(){const n=loadChairmanRules().rules,f=createFixtures(n);return {n,f,w:f.world()};}
test('new comparable domestic targets distribute across named fields and remain stable',()=>{
 const {n,f,w}=setup();w.races=[f.race(w,'left','op'),f.race(w,'right','op')];
 n.ChairmanWorld.plan(w);const counts=w.races.map(r=>w.horses.filter(h=>h.booked?.raceId===r.id).length);
 assert.ok(counts.every(x=>x>=5),JSON.stringify(counts));
 const first=JSON.stringify(w);n.ChairmanWorld.plan(w);assert.equal(JSON.stringify(w),first);
});
test('distribution does not create travel, change class or ignore distance evidence',()=>{
 const {n,f,w}=setup();w.races=[{...f.race(w,'main','g1'),prestige:98},f.race(w,'lower','g3'),{...f.race(w,'abroad','g1',{region:1,turn:2}),prestige:98},f.race(w,'long','g1',{distance:3200})];
 for(const h of w.horses)h.recentForm=[-1,-4].map(turn=>({turn,tf:125,surface:'草地',distance:1600,rank:1}));
 n.ChairmanWorld.plan(w);assert.ok(w.horses.every(h=>h.target.raceId==='main'));
});
test('existing targets and locked entries are not sacrificed to fill another field',()=>{
 const {n,f,w}=setup();w.races=[f.race(w,'existing','op'),f.race(w,'empty','op')];
 for(const h of w.horses)h.target={raceId:'existing',turn:0};
 n.ChairmanWorld.plan(w);assert.ok(w.horses.every(h=>h.target.raceId==='existing'));
 f.pin(w,w.races[0],0);const bookings=JSON.stringify(w.horses.map(h=>h.booked));n.ChairmanWorld.plan(w);assert.equal(JSON.stringify(w.horses.map(h=>h.booked)),bookings);
});
test('hidden ability changes cannot change distribution',()=>{
 const {n,f,w}=setup();w.races=[f.race(w,'left','op'),f.race(w,'right','op')];const b=n.ChairmanRules.clone(w);
 b.horses.forEach((h,i)=>h.strength=i%2?1:150);n.ChairmanWorld.plan(w);n.ChairmanWorld.plan(b);
 assert.equal(JSON.stringify(w.horses.map(h=>h.booked)),JSON.stringify(b.horses.map(h=>h.booked)));
});
