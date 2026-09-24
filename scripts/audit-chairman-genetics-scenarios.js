const fs=require('node:fs'),assert=require('node:assert/strict'),{loadChairmanRules}=require('../tests/helpers/project-loader');
const n=loadChairmanRules().rules,W=n.ChairmanRules,B=n.ChairmanBreeding,G=n.ChairmanGenetics,result=[];
for(const scenario of ['small','rare','popular','manual','upgrade']){
 let w=W.createWorld({worldType:'reference',regionKeys:['japan'],population:{japan:400},annualTargets:{japan:100},seed:7721}),report={scenario,years:[]};result.push(report);
 const sires=B.all(w).filter(h=>h.breeding?.status==='active'&&h.gender==='牡马'),mares=B.all(w).filter(h=>h.breeding?.status==='active'&&h.gender==='牝马'),sire=sires[0];
 if(scenario==='rare'){for(const h of sires)h.genetics.lineId='fictional:dominant-fixture';sire.genetics.lineId='fictional:rare-fixture';sire.breeding.pinned=true;G.invalidate(w);}
 if(scenario==='popular'){Object.assign(sire.lifetime,{starts:50,wins:40,g1:30,prize:100000});sire.annual.manual=150;sire.breeding.bestEvaluation=150;sire.breeding.pinned=true;G.invalidate(w);}
 if(scenario==='manual'){B.seeded(w,()=>{for(let i=0;i<30;i++)mares.push(B.founder(w,'日本','牝马'));});for(const m of mares)if(G.pair(w,sire.id,m.id).preview.legal&&w.breeding.manual.length<30)w.breeding.manual.push({fatherId:sire.id,motherId:m.id,homeRegion:'日本'});assert(w.breeding.manual.length>20);}
 if(scenario==='upgrade'){w.breeding.version=1;for(const h of B.all(w))delete h.genetics;}
 for(let year=1;year<=5;year++){
  let scheduled=0,completed=0,g1=0,g1Runners=0;
  while(w.phase!=='yearEnd'){const out=W.advanceHalfMonth(w);w=out.world;for(const r of out.occurrences){if(r.race.support)continue;scheduled++;completed+=r.status==='completed'?1:0;if(r.raceClass==='g1'){g1++;g1Runners+=r.count;}}}
  const out=W.finishYear(w);w=out.world;W.validateWorld(w);const events=out.breedingEvents;assert.equal(events.length,100);assert.equal(new Set(events.map(e=>e.motherId)).size,100);
  const usage={};for(const e of events){assert(G.pair(w,e.fatherId,e.motherId).preview.legal);usage[e.fatherId]=(usage[e.fatherId]||0)+1;if(!e.manual)assert(usage[e.fatherId]<=20);}
  if(scenario==='manual'&&year===1)assert.equal(events.filter(e=>e.fatherId===sire.id).length,30);
  if(scenario==='upgrade'&&year===1){assert.equal(w.breeding.version,2);assert(out.breedingReports[0].upgraded);}
  if(year>=3){assert(completed/Math.max(1,scheduled)>=.9);assert(g1Runners/Math.max(1,g1)>=8);}
  report.years.push({year,completion:completed/Math.max(1,scheduled),g1Average:g1Runners/Math.max(1,g1),births:events.length,maxSireUse:Math.max(...Object.values(usage)),rareDescendants:w.horses.filter(h=>h.genetics?.lineId==='fictional:rare-fixture').length,supplements:out.breedingReports[0].supplements.length});
  fs.writeFileSync('artifacts/chairman-genetics-scenarios.json',JSON.stringify(result,null,2));console.log(scenario,year);
 }
 report.passed=true;
}
fs.writeFileSync('artifacts/chairman-genetics-scenarios.json',JSON.stringify(result,null,2));
