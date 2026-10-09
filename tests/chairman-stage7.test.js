const test=require('node:test'),assert=require('node:assert/strict');
const {loadChairmanRules}=require('./helpers/project-loader');
const {createFixtures}=require('../scripts/lib/chairman-scheduling-fixtures');
function setup(){const n=loadChairmanRules().rules,f=createFixtures(n);return {n,f,w:f.world()};}
test('valid target places survive arrival of a higher-ranked uncommitted horse',()=>{
 const {n,f,w}=setup();w.horses=w.horses.slice(0,3);w.races=[{...f.race(w,'established','g1',{turn:4}),capacity:1,prestige:98},{...f.race(w,'alternative','g1',{turn:4}),prestige:80}];
 const owner=w.horses[2];owner.target={raceId:'established',turn:4};
 n.ChairmanWorld.plan(w);assert.equal(owner.target.raceId,'established');assert.equal(owner.booked.raceId,'established');assert.ok(w.horses.slice(0,2).every(h=>h.target.raceId==='alternative'));
 const saved=JSON.stringify(w);n.ChairmanWorld.plan(w);assert.equal(JSON.stringify(w),saved);
 w.races[0].deleted=true;n.ChairmanWorld.plan(w);assert.ok(w.horses.every(h=>h.target.raceId==='alternative'));
});
test('entering the booking window does not cancel a valid booked prep for the same target',()=>{
 const {n,f,w}=setup();w.horses=w.horses.slice(0,1);const h=w.horses[0];
 w.races=[{...f.race(w,'goal','g1',{turn:6}),prestige:100},f.race(w,'prep','g3',{turn:3})];
 n.ChairmanWorld.plan(w);assert.equal(h.target.raceId,'goal');assert.equal(h.booked.raceId,'prep');
 w.turn=1;n.ChairmanWorld.plan(w);assert.equal(h.target.raceId,'goal');assert.equal(h.booked.raceId,'prep');
 h.restUntil=4;n.ChairmanWorld.plan(w);assert.equal(h.booked.raceId,'goal');
});
test('invalid old targets cannot hoard capacity after a qualification change',()=>{
 const {n,f,w}=setup();w.horses=w.horses.slice(0,2);w.races=[{...f.race(w,'entry','one-win',{turn:4}),capacity:1},f.race(w,'open','op',{turn:4})];
 const [a,b]=w.horses;a.qualification=2;a.target={raceId:'entry',turn:4};b.qualification=1;b.annual.manual=null;b.lifetime.starts=0;
 n.ChairmanWorld.plan(w);assert.notEqual(a.target.raceId,'entry');assert.equal(b.target.raceId,'entry');
});
test('an existing prep keeps its capacity place against a new higher-ranked applicant',()=>{
 const {n,f,w}=setup();w.horses=w.horses.slice(0,2);const owner=w.horses[1];
 w.races=[{...f.race(w,'goal','g1',{turn:6}),prestige:100},{...f.race(w,'prep','g3',{turn:3}),capacity:1},f.race(w,'other-prep','g3',{turn:3})];
 owner.target={raceId:'goal',turn:6};owner.booked={raceId:'prep',turn:3};n.ChairmanWorld.plan(w);
 assert.equal(owner.booked.raceId,'prep');assert.notEqual(w.horses[0].booked?.raceId,'prep');
 assert.equal(w.horses.filter(h=>h.booked?.raceId==='prep').length,1);
});
test('trace observer does not change planning outcomes or random state',()=>{
 const {n,f,w}=setup();w.turn=1;w.races=[f.race(w,'a','op',{turn:3}),f.race(w,'b','op',{turn:4})];const b=n.ChairmanRules.clone(w);
 n.ChairmanWorld.plan(w);require('../scripts/lib/chairman-stage7-trace').attach(n,true);n.ChairmanWorld.plan(b);
 assert.equal(JSON.stringify(w),JSON.stringify(b));
});
