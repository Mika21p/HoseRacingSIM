const test=require('node:test'),assert=require('node:assert/strict'),A=require('../scripts/lib/chairman-scheduling-audit');
const {loadChairmanRules}=require('./helpers/project-loader'),{createFixtures}=require('../scripts/lib/chairman-scheduling-fixtures'),D=require('../scripts/audit-chairman-double-population');
test('five is inclusive for ordinary and low-prestige G1, while prestige 85 requires eight',()=>{
 const n=loadChairmanRules().rules,f=createFixtures(n),w=f.world();w.races=[f.race(w,'op','op'),{...f.race(w,'low','g1'),prestige:84},{...f.race(w,'high','g1'),prestige:85}];
 const out={world:A.copy(w),performances:[],occurrences:w.races.map((r,i)=>({id:'1:'+r.id,race:n.ChairmanWorld.resolveRace(w,r),raceClass:r.raceClass,count:i===2?7:5,status:'completed'}))},m=D.newYear(n,w),hash=A.hash(out);D.observe(n,w,out,m);assert.equal(A.hash(out),hash);const row=m.criteria[w.regions[0].id];assert.equal(row.fiveMet,2);assert.equal(row.eightMet,0);assert.equal(D.verdict(m).passed,false);assert.equal(m.deficits[0].required,8);
 out.occurrences[2].count=8;const pass=D.newYear(n,w);D.observe(n,w,out,pass);assert.equal(D.verdict(pass).passed,true);
 out.occurrences[0].count=1;out.occurrences[0].status='cancelled';const cancelled=D.newYear(n,w);D.observe(n,w,out,cancelled);assert.equal(cancelled.criteria[w.regions[0].id].five,2);assert.equal(cancelled.criteria[w.regions[0].id].fiveMet,1);assert.equal(cancelled.deficits.find(x=>x.raceId==='op').required,5);
});
test('young cohort distinguishes raw numbers from starts and earned qualification',()=>{
 const n=loadChairmanRules().rules,f=createFixtures(n),w=f.world();w.horses=w.horses.slice(0,3);for(const h of w.horses){h.birthYear=-1;h.qualification=0;h.lifetime.starts=0;h.lifetime.wins=0;}w.horses[1].lifetime.starts=2;w.horses[2].lifetime.starts=1;w.horses[2].lifetime.wins=1;w.horses[2].qualification=4;const c=D.cohorts(n,w)[0].ages.find(x=>x.age===2);assert.equal(c.total,3);assert.equal(c.started,2);assert.equal(c.qualified,1);assert.equal(c.neverStarted,1);
});
