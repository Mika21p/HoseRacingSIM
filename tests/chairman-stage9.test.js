const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),vm=require('vm');
const {loadChairmanRules}=require('./helpers/project-loader');
const {createFixtures}=require('../scripts/lib/chairman-scheduling-fixtures');
test('local route caches preserve planning across travel edits, rest and transport changes',()=>{
 const p=loadChairmanRules(),b=loadChairmanRules();vm.runInContext(fs.readFileSync(require('path').join(__dirname,'fixtures/chairman/chairman-stage9-baseline-world.js'),'utf8'),b.context);
 const n=p.rules,f=createFixtures(n),w=f.world();w.turn=1;
 w.races=[f.race(w,'home','g1',{turn:4}),f.race(w,'away','g1',{region:1,turn:5}),f.race(w,'away2','g3',{region:1,turn:5})];
 for(const edit of [()=>{},()=>{w.travelOverrides[[w.regions[0].id,w.regions[1].id].sort().join('|')]=4;},()=>{w.horses[0].restUntil=9;w.horses[1].transit={toRegionId:w.regions[1].id,arrivalTurn:3,kind:'outbound'};},()=>{w.races[1].deleted=true;}]){
  edit();const a=n.ChairmanRules.clone(w),c=n.ChairmanRules.clone(w);n.ChairmanWorld.plan(a);b.rules.ChairmanWorld.plan(c);assert.equal(JSON.stringify(a),JSON.stringify(c));
 }
});
test('stage9 offline target diagnostics preserve world and RNG state',()=>{
 const p=loadChairmanRules(),n=p.rules,f=createFixtures(n),w=f.world();w.races=[{...f.race(w,'main','g1',{turn:4}),capacity:1,prestige:98},f.race(w,'alternative','g3',{turn:4})];
 const plain=n.ChairmanRules.clone(w);n.ChairmanWorld.plan(plain);const t=require('../scripts/lib/chairman-stage9-trace').attach(p,true);n.ChairmanWorld.plan(w);
 assert.equal(JSON.stringify(w),JSON.stringify(plain));assert.ok(t.result.counts['preferred-target-denied']>0);
});
