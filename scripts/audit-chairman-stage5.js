'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),{performance}=require('node:perf_hooks');
const {loadChairmanRules}=require('../tests/helpers/project-loader');
const crypto=require('node:crypto');
const round=x=>Math.round(x*100)/100;
function run(seed,enabled,population,years){
 const n=loadChairmanRules().rules,W=n.ChairmanRules,t=performance.now();
 let w=W.createWorld({id:`stage5-${seed}-${enabled}-${population.japan}`,worldType:'reference',regionKeys:['japan','usa'],population,annualTargets:Object.fromEntries(Object.entries(population).map(([k,v])=>[k,Math.ceil(v/4)])),foundation:false,breeding:false,seed,development:enabled});
 const creationMs=performance.now()-t,results=[],timings=[];
 for(let year=1;year<=years;year++){
  const regions=Object.fromEntries(w.regions.map(r=>[r.id,{name:r.name,scheduled:0,completed:0,five:0,fiveMet:0,eight:0,eightMet:0}]));
  let starts=0,rated=0,attempts=0,promoted=0,violations=0,basicSimulated=0;const tf=[];const tails={full:{rated:0,low:0,high:0},small:{rated:0,low:0,high:0}},initialYoung=new Set(w.horses.filter(h=>W.ageOf(w,h)===2).map(h=>h.id));
  while(w.phase!=='yearEnd'){
   const before=w,byId=new Map(w.horses.map(h=>[h.id,h])),start=performance.now(),out=W.advanceHalfMonth(w);w=out.world;timings.push(performance.now()-start);W.validateWorld(w);
   attempts+=w.developmentSummary?.attempted||0;promoted+=w.developmentSummary?.promoted||0;
   for(const e of out.occurrences){if(e.status==='completed'&&['new','maiden'].includes(e.raceClass))basicSimulated++;if(e.race.support)continue;const r=regions[e.race.regionId],high=e.raceClass==='g1'&&n.ChairmanPrestige.value(e.race)>=85;r.scheduled++;r.completed+=e.status==='completed'?1:0;r[high?'eight':'five']++;r[high?'eightMet':'fiveMet']+=e.count>=(high?8:5)?1:0;}
   const seen=new Set();for(const p of out.performances){starts++;rated+=p.tf!=null?1:0;if(p.tf!=null)tf.push(p.tf);const h=byId.get(p.horseId),e=out.occurrences.find(e=>e.id===p.occurrenceId);if(p.tf!=null){const full=e.count>=(e.raceClass==='g1'&&n.ChairmanPrestige.value(e.race)>=85?8:5),tail=tails[full?'full':'small'];tail.rated++;tail.low+=p.tf<40?1:0;tail.high+=p.tf>140?1:0;}if(seen.has(h.id)||h.restUntil>before.turn||h.transit||h.locationRegionId!==p.regionId||before.turn-(h.lastRaceTurn??-3)<3||before.turn-(h.development?.lastTurn??-3)<3||!W.eligible(before,h,e.race,before.turn)||e.count>e.race.capacity)violations++;seen.add(h.id);}
  }
  assert.equal(violations,0);if(enabled)assert.equal(basicSimulated,0);
  const young=w.horses.filter(h=>initialYoung.has(h.id)),reasons=[];for(const [id,r]of Object.entries(regions))for(const [name,a,b,min]of [['completion',r.completed,r.scheduled,.95],['five',r.fiveMet,r.five,.9],['eight',r.eightMet,r.eight,.9]])if(b&&a/b<min)reasons.push({region:r.name,metric:name,actual:round(a/b*100)});
  const result={year,starts,rated,tails,coverage:round(rated/starts*100),attempts,promoted,basicSimulated,young:young.length,youngQualified:young.filter(h=>h.qualification>=1).length,regions,violations,meanTf:tf.length?round(tf.reduce((a,b)=>a+b)/tf.length):null,maxTf:tf.length?Math.max(...tf):null,minTf:tf.length?Math.min(...tf):null,populationPassed:!reasons.length,reasons};results.push(result);console.log(JSON.stringify({seed,enabled,population,year,coverage:result.coverage,promoted,youngQualified:result.youngQualified,young:result.young,populationPassed:result.populationPassed}));if(year<years)w=W.finishYear(w).world;
 }
 timings.sort((a,b)=>a-b);return {seed,enabled,population,years:results,creationMs:round(creationMs),halfMonthMs:{median:round(timings[Math.floor(timings.length*.5)]),p95:round(timings[Math.floor(timings.length*.95)]),max:round(timings.at(-1))},worldBytes:Buffer.byteLength(JSON.stringify(w))};
}
function main(){
 const full=process.argv.includes('--default'),file=full?'artifacts/chairman-stage5-default.json':'artifacts/chairman-stage5-linked.json',report={scope:full?'Japan/US defaults, one seed two years':'Japan/US 80 each, two seeds four years paired',runs:[],sourceHashes:Object.fromEntries(['js/rules/chairman.js','js/rules/chairman-world.js','js/rules/chairman-ratings.js','js/rules/chairman-development.js','scripts/audit-chairman-stage5.js'].map(f=>[f,crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex')]))};
 const jobs=full?[[123,true,{japan:1000,usa:752},2]]:[123,43127].flatMap(s=>[[s,false,{japan:80,usa:80},4],[s,true,{japan:80,usa:80},4]]);
 for(const args of jobs){report.runs.push(run(...args));fs.writeFileSync(file,JSON.stringify(report,null,2));}
}
if(require.main===module)main();
