'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),{performance}=require('node:perf_hooks');
const {loadChairmanRules}=require('../tests/helpers/project-loader');
const crypto=require('node:crypto');
const {shortage}=require('./lib/chairman-stage6-diagnostics');
const {inspect}=require('./lib/chairman-stage8-diagnostics');
const round=x=>Math.round(x*100)/100;
function run(seed,enabled,population,years){
 const project=loadChairmanRules(),n=project.rules,W=n.ChairmanRules,t=performance.now();
 const trace={result:{},track(){},record(){}};
 let w=W.createWorld({id:`stage5-${seed}-${enabled}-${population.japan}`,worldType:'reference',regionKeys:Object.keys(population),population,annualTargets:Object.fromEntries(Object.entries(population).map(([k,v])=>[k,Math.ceil(v/4)])),foundation:false,breeding:false,seed,development:enabled});
 const creationMs=performance.now()-t,results=[],timings=[];trace.track(w);
 for(let year=1;year<=years;year++){
  const shortFields=[],diagnostics=[],capacity=[];let overseas=0,targetDue=0,targetStarted=0,rebookingOpportunities=0,rebookings=0,lockedViolations=0;
  const regions=Object.fromEntries(w.regions.map(r=>[r.id,{name:r.name,scheduled:0,completed:0,five:0,fiveMet:0,eight:0,eightMet:0}]));
  let starts=0,rated=0,attempts=0,promoted=0,violations=0,basicSimulated=0;const tf=[];const tails={full:{rated:0,low:0,high:0},small:{rated:0,low:0,high:0}},initialYoung=new Set(w.horses.filter(h=>W.ageOf(w,h)===2).map(h=>h.id));
  while(w.phase!=='yearEnd'){
   const before=w,byId=new Map(w.horses.map(h=>[h.id,h])),start=performance.now(),out=W.advanceHalfMonth(w);w=out.world;timings.push(performance.now()-start);W.validateWorld(w);trace.record(w);diagnostics.push(...inspect(n,before,out));capacity.push(...require('./lib/chairman-stage11-capacity').inspect(n,before,out));
   for(const h of before.horses)if(h.target?.turn===before.turn){targetDue++;if(out.performances.some(p=>p.horseId===h.id&&p.raceId===h.target.raceId))targetStarted++;}
   const nextHorses=new Map(w.horses.map(h=>[h.id,h]));
   for(const h of before.horses){const b=h.booked,x=nextHorses.get(h.id);if(!b||b.turn< w.turn||x?.status!=='active'||x.restUntil>b.turn||w.phase!=='season')continue;
    const locked=before.lockedRaces?.[W.date(b.turn).year+':'+b.raceId]||b.preparationTurn!=null&&b.preparationTurn<=before.turn;
    const changed=JSON.stringify(b)!==JSON.stringify(x.booked);
    if(locked){if(changed)lockedViolations++;}else{rebookingOpportunities++;if(b.raceId!==x.booked?.raceId||b.turn!==x.booked?.turn)rebookings++;}
   }
   attempts+=w.developmentSummary?.attempted||0;promoted+=w.developmentSummary?.promoted||0;
   for(const e of out.occurrences){if(e.status==='completed'&&['new','maiden'].includes(e.raceClass))basicSimulated++;if(e.race.support)continue;const r=regions[e.race.regionId],high=e.raceClass==='g1'&&n.ChairmanPrestige.value(e.race)>=85;if(e.count<(high?8:5))shortFields.push(shortage(n,before,e.race,e.count));r.scheduled++;r.completed+=e.status==='completed'?1:0;r[high?'eight':'five']++;r[high?'eightMet':'fiveMet']+=e.count>=(high?8:5)?1:0;}
   const seen=new Set();for(const p of out.performances){starts++;overseas+=p.regionId!==p.homeRegionId?1:0;rated+=p.tf!=null?1:0;if(p.tf!=null)tf.push(p.tf);const h=byId.get(p.horseId),e=out.occurrences.find(e=>e.id===p.occurrenceId);if(p.tf!=null){const full=e.count>=(e.raceClass==='g1'&&n.ChairmanPrestige.value(e.race)>=85?8:5),tail=tails[full?'full':'small'];tail.rated++;tail.low+=p.tf<40?1:0;tail.high+=p.tf>140?1:0;}if(seen.has(h.id)||h.restUntil>before.turn||h.transit||h.locationRegionId!==p.regionId||before.turn-(h.lastRaceTurn??-3)<3||before.turn-(h.development?.lastTurn??-3)<3||!W.eligible(before,h,e.race,before.turn)||e.count>e.race.capacity)violations++;seen.add(h.id);}
  }
  assert.equal(violations,0);assert.equal(lockedViolations,0);if(enabled)assert.equal(basicSimulated,0);
  const young=w.horses.filter(h=>initialYoung.has(h.id)),reasons=[];for(const [id,r]of Object.entries(regions))for(const [name,a,b,min]of [['completion',r.completed,r.scheduled,.95],['five',r.fiveMet,r.five,.9],['eight',r.eightMet,r.eight,.9]])if(b&&a/b<min)reasons.push({region:r.name,metric:name,actual:round(a/b*100)});
  const result={year,starts,rated,tails,rebookingOpportunities,rebookings,lockedViolations,overseas,targetDue,targetStarted,shortFields,diagnostics,capacity,coverage:round(rated/starts*100),attempts,promoted,basicSimulated,young:young.length,youngQualified:young.filter(h=>h.qualification>=1).length,regions,violations,meanTf:tf.length?round(tf.reduce((a,b)=>a+b)/tf.length):null,maxTf:tf.length?Math.max(...tf):null,minTf:tf.length?Math.min(...tf):null,populationPassed:!reasons.length,reasons};results.push(result);console.log(JSON.stringify({seed,enabled,population,year,coverage:result.coverage,promoted,youngQualified:result.youngQualified,young:result.young,populationPassed:result.populationPassed}));if(year<years)w=W.finishYear(w).world;
 }
 timings.sort((a,b)=>a-b);return {seed,enabled,population,trace:trace.result,years:results,creationMs:round(creationMs),halfMonthMs:{median:round(timings[Math.floor(timings.length*.5)]),p95:round(timings[Math.floor(timings.length*.95)]),max:round(timings.at(-1))},worldBytes:Buffer.byteLength(JSON.stringify(w))};
}
function main(){
 const tag=process.argv[2]||'baseline',seed=Number(process.argv[3]||123),europe=process.argv.includes('--europe'),scale=process.argv.includes('--double')?2:1,population=europe?{britain:340,france:300}:{japan:1000*scale,usa:752*scale};
 const report={tag,baselineReplay:process.argv.includes('--baseline-replay'),sourceHashes:Object.fromEntries(['js/rules/chairman.js','js/rules/chairman-world.js','js/rules/chairman-ratings.js','js/rules/chairman-development.js','scripts/audit-chairman-stage11.js','scripts/lib/chairman-stage6-diagnostics.js','scripts/lib/chairman-stage11-capacity.js','scripts/lib/chairman-stage8-diagnostics.js'].map(f=>[f,crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex')])),runs:[]};
 report.runs.push(run(seed,true,population,2));fs.writeFileSync('artifacts/chairman-stage11-'+tag+'-'+seed+'.json',JSON.stringify(report,null,2));
}
if(require.main===module)main();
