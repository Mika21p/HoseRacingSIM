const test=require('node:test'),assert=require('node:assert/strict');
const {loadChairmanRules}=require('./helpers/project-loader');
const {createFixtures}=require('../scripts/lib/chairman-scheduling-fixtures');
const A=require('../scripts/lib/chairman-scheduling-audit');
function setup(){const n=loadChairmanRules().rules,f=createFixtures(n),w=f.world();w.horses=w.horses.slice(0,1);return {n,f,w,h:w.horses[0]};}
test('assessment TF seeds ability without pretending the assigned course is proven',()=>{
 const {n,f,w,h}=setup();h.lifetime.starts=0;h.qualification=1;h.recentForm=[-1,-4].map(turn=>({turn,tf:80,surface:'草地',distance:2400,rank:null,assessment:true}));
 w.races=[f.race(w,'short','op',{distance:1200}),f.race(w,'long','op',{distance:2400})];const audit=A.createPlanAudit(n,w);n.ChairmanWorld.plan(w,audit.sink);
 const choices=audit.candidates.get(h.id).choices;assert.equal(choices.length,2);for(const c of choices){assert.equal(c.form.risky,false);assert.equal(c.form.count,0);assert.equal(c.form.estimate,80);}
});
test('actual race evidence still protects an established route despite conflicting assessments',()=>{
 const {n,f,w,h}=setup();h.recentForm=[-1,-2].map(turn=>({turn,tf:120,surface:'草地',distance:2400,rank:null,assessment:true}));h.recentForm.push(...[-3,-5].map(turn=>({turn,tf:90,surface:'草地',distance:1200,rank:2})));
 w.races=[f.race(w,'short','g1',{distance:1200}),f.race(w,'long','g1',{distance:2400})];n.ChairmanWorld.plan(w);assert.equal(h.booked.raceId,'short');
});
test('untested initial three-win horses use G3 then respond to strong public results',()=>{
 const {n,f,w,h}=setup();h.qualification=3;h.lifetime.starts=0;h.annual.manual=null;h.recentForm=[];
 w.races=[f.race(w,'g3','g3'),f.race(w,'g2','g2'),{...f.race(w,'g1','g1'),prestige:98}];n.ChairmanWorld.plan(w);assert.equal(h.target.raceId,'g3');
 h.lifetime.starts=2;h.annual.manual=120;n.ChairmanWorld.plan(w);assert.equal(h.target.raceId,'g1');
});
