const test=require('node:test'),assert=require('node:assert/strict');
const P=require('../scripts/lib/chairman-population-audit'),A=require('../scripts/lib/chairman-scheduling-audit');
const {loadChairmanRules}=require('./helpers/project-loader'),{createFixtures}=require('../scripts/lib/chairman-scheduling-fixtures');
test('population rounding preserves default ratios and explicitly rounds smaller-country candidates',()=>{
 assert.deepEqual(P.population(['japan','usa'],1),{population:{japan:1000,usa:752},annualTargets:{japan:250,usa:188}});
 assert.deepEqual(P.population(['ireland','germany'],.75,.25),{population:{ireland:147,germany:75},annualTargets:{ireland:37,germany:19}});
 const n=loadChairmanRules().rules;for(const [k,count] of Object.entries(P.BASE)){const confirmed=n.ChairmanVenues.catalogue().filter(r=>r.regionKey===k&&r.status==='confirmed').length;assert.equal(count,k==='japan'?1000:Math.max(100,Math.ceil(confirmed*5/4)*4));}
});
test('acceptance includes first year, every region and all three denominators without rounding into a pass',()=>{
 const m={regions:{a:{name:'A',scheduled:100,completed:95,graded:10,gradedSix:9,highG1:10,highG1Eight:9},b:{name:'B',scheduled:8,completed:8,graded:5,gradedSix:5,highG1:0,highG1Eight:0}},expected:['x'],events:[{raceId:'x'}],violations:[]};assert.equal(P.verdict(m).passed,true);
 m.regions.b.completed=7;assert.equal(P.verdict(m).passed,false);m.regions.b.completed=8;m.regions.a.highG1Eight=8;assert.equal(P.verdict(m).reasons[0].metric,'highG1Eight');m.regions.a.highG1Eight=9;m.expected.push('missing');assert.equal(P.verdict(m).reasons[0].metric,'missing-calendar-occurrence');
});
test('cancelled high-prestige G1 counts in all denominators and receives a supply funnel',()=>{
 const n=loadChairmanRules().rules,f=createFixtures(n),w=f.world();w.horses=w.horses.slice(0,1);w.races=[{...f.race(w,'named','g1'),prestige:100}];const r=n.ChairmanWorld.resolveRace(w,w.races[0]),m=P.annual(n,w),out={world:A.copy(w),performances:[],occurrences:[{id:'1:named',race:r,raceClass:'g1',status:'cancelled',count:1}]};P.record(n,w,out,m);const row=m.regions[r.regionId];assert.equal(row.scheduled,1);assert.equal(row.completed,0);assert.equal(row.graded,1);assert.equal(row.highG1,1);assert.equal(row.highG1Eight,0);assert.equal(m.shortFields[0].primary,'qualification-age-sex-pool');
});
test('population observer does not mutate transactions, tracks legal starts and detects committed booking changes',()=>{
 const n=loadChairmanRules().rules,f=createFixtures(n),w=f.world();w.races=[f.race(w,'home','g1')];n.ChairmanWorld.plan(w);const out=n.ChairmanRules.advanceHalfMonth(w,{deferHonors:true}),hash=A.hash(out),m=P.annual(n,w);P.record(n,w,out,m);assert.equal(A.hash(out),hash);assert.equal(m.performances,12);assert.equal(m.violations.length,0);
 const h=w.horses[0];h.booked={raceId:'future',turn:1,preparationTurn:0};out.world.horses.find(x=>x.id===h.id).booked=null;P.record(n,w,out,P.annual(n,w));const target=P.annual(n,w);P.record(n,w,out,target);assert.ok(target.violations.some(x=>x.type==='locked-booking'));
});
test('sparse custom calendar can run with a small suitable population instead of requiring the reference defaults',()=>{
 const n=loadChairmanRules().rules,f=createFixtures(n),w=f.world();w.horses=w.horses.slice(0,8);w.races=[{...f.race(w,'custom','g1'),prestige:90}];n.ChairmanWorld.plan(w);const m=P.annual(n,w),out=n.ChairmanRules.advanceHalfMonth(w,{deferHonors:true});P.record(n,w,out,m);assert.equal(out.occurrences[0].count,8);assert.equal(P.verdict(m).passed,true);
});
test('age and sex bottlenecks stay visible when total active population is large enough',()=>{
 const n=loadChairmanRules().rules,f=createFixtures(n),w=f.world();w.horses.forEach(h=>{h.gender='牡马';h.birthYear=-3;});w.horses[0].gender='牝马';
 const female=n.ChairmanWorld.resolveRace(w,{...f.race(w,'female','g1'),sexRule:'female'}),juvenile=n.ChairmanWorld.resolveRace(w,{...f.race(w,'juvenile','g1'),ageRule:'2'});
 assert.equal(P.shortage(n,w,female,1,8).eligible,1);assert.equal(P.shortage(n,w,juvenile,0,8).eligible,0);assert.equal(P.shortage(n,w,female,1,8).primary,'qualification-age-sex-pool');
});
test('limited public distance evidence is not declared a numerical shortage merely because a race is empty',()=>{
 const n=loadChairmanRules().rules,f=createFixtures(n),w=f.world();w.horses.forEach(h=>{h.recentForm=[-1,-4].map(turn=>({turn,tf:120,surface:'草地',distance:1200,rank:1}));});
 const long=n.ChairmanWorld.resolveRace(w,f.race(w,'long','g1',{distance:3200}));const row=P.shortage(n,w,long,0,8);assert.equal(row.eligible,12);assert.equal(row.available,12);assert.equal(row.primary,'public-route-target-or-allocation');
 const dirt={...long,surface:'泥地'};assert.equal(P.shortage(n,w,dirt,0,8).primary,'public-route-target-or-allocation');
});
test('adding simultaneous custom races exposes competition for the same local horses without counting it as extra supply',()=>{
 const n=loadChairmanRules().rules,f=createFixtures(n),w=f.world();w.horses=w.horses.slice(0,8);w.races=[{...f.race(w,'first','g1'),prestige:100},{...f.race(w,'second','g1'),prestige:85}];n.ChairmanWorld.plan(w);const r=n.ChairmanWorld.resolveRace(w,w.races[1]),row=P.shortage(n,w,r,0,8);assert.equal(row.available,8);assert.equal(row.committedElsewhere,8);assert.equal(row.primary,'competing-commitments');
});
test('failed first year stops later years, saves a checkpoint and resumes without inventing a fresh run',t=>{
 const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),{runCase}=require('../scripts/audit-chairman-population');
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'keiba-population-')),config={scenario:'japan',factor:.01,annualRatio:.25,seed:321,years:3};
 t.after(()=>{assert.equal(path.dirname(path.resolve(directory)),path.resolve(os.tmpdir()));assert.ok(path.basename(directory).startsWith('keiba-population-'));fs.rmSync(directory,{recursive:true,force:true});});
 const first=runCase(config,directory);assert.equal(first.status,'rejected');assert.equal(first.years.length,1);assert.equal(first.years[0].turns,24);assert.ok(first.years[0].verdict.reasons.length);assert.ok(fs.existsSync(path.join(directory,first.id+'.json.checkpoint.gz')));
 const again=runCase(config,directory);assert.equal(again.worldHash,first.worldHash);assert.equal(again.createdAt,first.createdAt);assert.equal(again.years.length,1);
 assert.throws(()=>runCase({...config,years:2},directory),/configuration changed/);
});
