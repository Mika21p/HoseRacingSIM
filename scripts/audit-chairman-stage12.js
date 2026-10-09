'use strict';
const fs=require('fs'),crypto=require('crypto'),assert=require('assert/strict'),{performance}=require('perf_hooks');
const {loadChairmanRules}=require('../tests/helpers/project-loader');
const mode=process.argv[2]||'all',full=mode==='breeding',years=full?4:2,seed=123,base='artifacts/chairman-stage12-'+mode;
const keys=full?['usa']:['japan','usa','britain','france','ireland','germany','italy'];
const hash=x=>crypto.createHash('sha256').update(x).digest('hex'),round=x=>Math.round(x*100)/100;
const walk=p=>fs.readdirSync(p,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(p+'/'+e.name):[p+'/'+e.name]);
const hashes=Object.fromEntries([...walk('js').filter(p=>p.endsWith('.js')),'scripts/audit-chairman-stage12.js'].map(p=>[p,hash(fs.readFileSync(p))]));
const fingerprint=hash(JSON.stringify(hashes)),n=loadChairmanRules().rules,W=n.ChairmanRules;
const historyKeys=['occurrences','performances','ratings','awards','scoreDrafts','revisions','breedingEvents','breedingYears','breedingReports','councilRounds','councilVotes','hallEvents','honorYears','seriesYears','seriesRewards','editorRecords'];
function save(p,o){fs.writeFileSync(p+'.tmp',JSON.stringify(o));fs.renameSync(p+'.tmp',p);}
function counts(w){return {total:w.horses.length,active:w.horses.filter(h=>h.status==='active').length,juvenile:w.horses.filter(h=>h.status==='juvenile').length,retired:w.horses.filter(h=>h.status==='retired').length,pedigrees:w.pedigrees?.length||0};}
let state;
if(process.argv.includes('--resume')){state=JSON.parse(fs.readFileSync(base+'-checkpoint.json'));assert.equal(state.fingerprint,fingerprint,'Source changed; cannot resume mixed rules');}
else{const t=performance.now(),w=W.createWorld({id:'stage12-'+mode,worldType:'reference',regionKeys:keys,foundation:full,breeding:full,seed});state={fingerprint,mode,seed,years,creationMs:round(performance.now()-t),world:w,initial:counts(w),results:[],records:Object.fromEntries(historyKeys.map(k=>[k,[]])),current:null};}
const add=out=>{for(const k of historyKeys)state.records[k].push(...(out[k]||[]));};
while(state.results.length<years){let w=state.world;
 if(!state.current)state.current={year:W.date(w.turn).year,start:counts(w),regions:Object.fromEntries(w.regions.map(r=>[r.id,{name:r.name,scheduled:0,completed:0,five:0,fiveMet:0,eight:0,eightMet:0,starts:0,rated:0,graded:0,gradedRated:0,overseas:0,sameGroupForeign:0}])),times:[],violations:0,lockedViolations:0,rebookings:0,rebookingOpportunities:0,targetDue:0,targetStarted:0,low:0,high:0};
 const y=state.current;
 while(w.phase!=='yearEnd'){
  const before=w,t=performance.now(),out=W.advanceHalfMonth(w);w=out.world;y.times.push(performance.now()-t);W.validateWorld(w);add(out);
  const horses=new Map(before.horses.map(h=>[h.id,h])),seen=new Set(),events=new Map(out.occurrences.map(e=>[e.id,e]));
  for(const e of out.occurrences){if(e.race.support)continue;const r=y.regions[e.race.regionId],high=e.raceClass==='g1'&&n.ChairmanPrestige.value(e.race)>=85;r.scheduled++;r.completed+=e.status==='completed'?1:0;r[high?'eight':'five']++;r[high?'eightMet':'fiveMet']+=e.count>=(high?8:5)?1:0;assert.ok(e.count<=e.race.capacity);}
  for(const p of out.performances){const r=y.regions[p.regionId],h=horses.get(p.horseId),e=events.get(p.occurrenceId);r.starts++;if(p.tf!=null){r.rated++;y.low+=p.tf<40?1:0;y.high+=p.tf>140?1:0;}if(['g1','g2','g3'].includes(p.raceClass)){r.graded++;r.gradedRated+=p.tf!=null?1:0;}if(p.regionId!==p.homeRegionId){r.overseas++;r.sameGroupForeign+=before.regions.find(x=>x.id===p.regionId)?.trafficGroup===before.regions.find(x=>x.id===p.homeRegionId)?.trafficGroup?1:0;}
   if(seen.has(h.id)||h.restUntil>before.turn||h.transit||h.locationRegionId!==p.regionId||before.turn-(h.lastRaceTurn??-3)<3||before.turn-(h.development?.lastTurn??-3)<3||!W.eligible(before,h,e.race,before.turn))y.violations++;seen.add(h.id);
  }
  const next=new Map(w.horses.map(h=>[h.id,h]));for(const h of before.horses){if(h.target?.turn===before.turn){y.targetDue++;y.targetStarted+=out.performances.some(p=>p.horseId===h.id&&p.raceId===h.target.raceId)?1:0;}const b=h.booked,x=next.get(h.id);if(!b||b.turn<w.turn||x?.status!=='active'||x.restUntil>b.turn||w.phase!=='season')continue;const locked=before.lockedRaces?.[W.date(b.turn).year+':'+b.raceId]||b.preparationTurn!=null&&b.preparationTurn<=before.turn;if(locked)y.lockedViolations+=JSON.stringify(b)!==JSON.stringify(x.booked)?1:0;else{y.rebookingOpportunities++;y.rebookings+=b.raceId!==x.booked?.raceId||b.turn!==x.booked?.turn?1:0;}}
  state.world=w;if(w.turn%12===0)save(base+'-checkpoint.json',state);
 }
 y.end=counts(w);y.worldBytes=Buffer.byteLength(JSON.stringify(w));const sorted=y.times.slice().sort((a,b)=>a-b);y.halfMonthMs={median:round(sorted[Math.floor(sorted.length*.5)]),p95:round(sorted[Math.floor(sorted.length*.95)]),max:round(sorted.at(-1))};
 y.attendanceFailures=[];y.tfFailures=[];for(const r of Object.values(y.regions)){for(const [key,a,b,min]of [['completion',r.completed,r.scheduled,.95],['five',r.fiveMet,r.five,.9],['eight',r.eightMet,r.eight,.9]])if(b&&a/b<min)y.attendanceFailures.push({region:r.name,key,actual:round(100*a/b)});if(y.year>=4)for(const [key,a,b]of [['all',r.rated,r.starts],['graded',r.gradedRated,r.graded]])if(b&&a/b<.9)y.tfFailures.push({region:r.name,key,actual:round(100*a/b)});}
 assert.equal(y.violations,0);assert.equal(y.lockedViolations,0);
 // Save a genuine year-end world with complete accumulated history for storage tests.
 if(y.year===years)save(base+'-yearend.json',{world:w,records:state.records});
 const oldIds=new Set(w.horses.map(h=>h.id)),before=w,t=performance.now(),out=W.finishYear(w);w=out.world;W.validateWorld(w);add(out);y.finishYearMs=round(performance.now()-t);y.next=counts(w);
 y.replenishment=w.regions.map(r=>{const matured=before.horses.filter(h=>h.status==='juvenile'&&h.homeRegionId===r.id&&W.ageOf(w,h)>=2).length,external=w.horses.filter(h=>!oldIds.has(h.id)&&h.homeRegionId===r.id&&(!full||h.sourceKind==='external')&&W.ageOf(w,h)===2).length,born=(out.breedingEvents||[]).filter(e=>e.homeRegion===r.name).length;assert.equal(external,Math.max(0,r.annualTarget-matured));return {region:r.name,target:r.annualTarget,matured,external,born};});
 const motherYears=new Set();for(const e of state.records.breedingEvents){const k=e.birthYear+':'+e.motherId;assert.ok(!motherYears.has(k),'Duplicate mother/year birth');motherYears.add(k);}
 y.bredRunners=w.horses.filter(h=>h.sourceKind==='bred'&&h.lifetime.starts>0).length;
 state.results.push(y);state.current=null;state.world=w;save(base+'-checkpoint.json',state);save(base+'.json',{fingerprint,sourceHashes:hashes,mode,seed,initial:state.initial,creationMs:state.creationMs,results:state.results,recordCounts:Object.fromEntries(historyKeys.map(k=>[k,state.records[k].length]))});
 console.log(JSON.stringify({mode,year:y.year,start:y.start,end:y.end,next:y.next,attendanceFailures:y.attendanceFailures,tfFailures:y.tfFailures,replenishment:y.replenishment,halfMonthMs:y.halfMonthMs,finishYearMs:y.finishYearMs}));
}
