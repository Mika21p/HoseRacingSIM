'use strict';
const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib'),assert=require('node:assert/strict'),{performance}=require('node:perf_hooks');
const {loadChairmanRules}=require('../tests/helpers/project-loader'),P=require('./lib/chairman-population-audit'),A=require('./lib/chairman-scheduling-audit');
function write(file,value,gzip=false){fs.mkdirSync(path.dirname(file),{recursive:true});const s=JSON.stringify(value,null,gzip?0:2);fs.writeFileSync(file+'.tmp',gzip?zlib.gzipSync(s,{level:1}):s);fs.renameSync(file+'.tmp',file);}
function cohorts(n,w){return w.regions.map(r=>({regionId:r.id,name:r.name,ages:[2,3,4,5,6].map(age=>{const hs=w.horses.filter(h=>h.homeRegionId===r.id&&h.status==='active'&&n.ChairmanRules.ageOf(w,h)===age);return {age,total:hs.length,female:hs.filter(h=>h.gender==='牝马').length,started:hs.filter(h=>h.lifetime.starts>0).length,startedThisYear:hs.filter(h=>h.annual.starts>0).length,qualified:hs.filter(h=>h.qualification>=1||h.lifetime.wins>0).length,neverStarted:hs.filter(h=>!h.lifetime.starts).length};})}));}
function newYear(n,w){return {...P.annual(n,w),criteria:Object.fromEntries(w.regions.map(r=>[r.id,{name:r.name,scheduled:0,completed:0,five:0,fiveMet:0,eight:0,eightMet:0}])),deficits:[],cohorts:[{turn:w.turn,rows:cohorts(n,w)}],youngStarts:0,youngSupportStarts:0,youngNamedStarts:0,youngWins:0};}
function observe(n,w,out,m){
 P.record(n,w,out,m);const W=n.ChairmanRules,V=n.ChairmanWorld,events=new Map(out.occurrences.map(e=>[e.id,e]));
 for(const p of out.performances)if(p.age===2){m.youngStarts++;if(events.get(p.occurrenceId)?.race.support)m.youngSupportStarts++;else m.youngNamedStarts++;if(p.rank===1)m.youngWins++;}
 for(const e of out.occurrences){const r=e.race;if(r.support)continue;const row=m.criteria[r.regionId],high=r.raceClass==='g1'&&n.ChairmanPrestige.value(r)>=85,required=high?8:5;row.scheduled++;row.completed+=e.status==='completed'?1:0;row[high?'eight':'five']++;row[high?'eightMet':'fiveMet']+=e.count>=required?1:0;
  if(e.count>=required)continue;
  const diagnostic=P.shortage(n,w,r,e.count,required);let ageSexPool=0,localAgeSex=0,localQualified=0,localAvailable=0;
  for(const h of w.horses){if(h.status!=='active'||!W.eligible(w,{...h,qualification:4,lifetime:{...h.lifetime,wins:1},restUntil:0},r,w.turn))continue;ageSexPool++;if(h.homeRegionId!==r.regionId)continue;localAgeSex++;if(!W.eligible(w,{...h,restUntil:0},r,w.turn))continue;localQualified++;if(V.route(w,h,r,w.turn).reachable&&h.transit?.kind!=='return')localAvailable++;}
  m.deficits.push({raceId:r.id,name:r.name,regionId:r.regionId,turn:w.turn,ageRule:r.ageRule,sexRule:r.sexRule,raceClass:r.raceClass,surface:r.surface,distance:r.distance,prestige:n.ChairmanPrestige.value(r),...diagnostic,ageSexPool,localAgeSex,localQualified,localAvailable});
 }
 if(m.turns%6===0)m.cohorts.push({turn:out.world.turn,rows:cohorts(n,out.world)});
}
function verdict(m){const reasons=[];for(const [regionId,r] of Object.entries(m.criteria))for(const [metric,num,den,min] of [['completion',r.completed,r.scheduled,.95],['fiveMet',r.fiveMet,r.five,.9],['eightMet',r.eightMet,r.eight,.9]])if(den&&num/den<min)reasons.push({regionId,name:r.name,metric,num,den,min});const seen=new Set(m.events.map(e=>e.raceId));for(const id of m.expected)if(!seen.has(id))reasons.push({metric:'missing-occurrence',raceId:id});if(m.violations.length)reasons.push({metric:'rules',count:m.violations.length});return {passed:reasons.length===0,reasons};}
function run(scenario,extraYoung,directory,seed=123){
 const config={scenario,extraYoung,seed,years:extraYoung?1:2,factor:2,annualRatio:.25,criteria:'five-or-high-g1-eight-v1'},id=`${scenario}${extraYoung?'-extra-young':''}-s${seed}`,file=path.join(directory,id+'.json'),checkpoint=file+'.checkpoint.gz';
 const source={...A.manifest(),runner:A.hash(fs.readFileSync(__filename,'utf8')+fs.readFileSync('scripts/lib/chairman-population-audit.js','utf8'))},n=loadChairmanRules().rules,W=n.ChairmanRules,V=n.ChairmanWorld;
 if(fs.existsSync(file)){const r=JSON.parse(fs.readFileSync(file,'utf8'));assert.deepEqual(r.source,source);assert.deepEqual(r.config,config);if(r.status==='complete')return r;}
 let state;
 if(fs.existsSync(checkpoint)){state=JSON.parse(zlib.gunzipSync(fs.readFileSync(checkpoint)));assert.deepEqual(state.source,source);assert.deepEqual(state.config,config);}
 else {
  const start=performance.now();let w;
  if(extraYoung){const initial=JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(directory,`${scenario}-s${seed}.initial.gz`))));assert.deepEqual(initial.source,source);w=initial.world;const original=cohorts(n,w);W.seeded(w,()=>{for(const r of w.regions){const count=original.find(x=>x.regionId===r.id).ages.find(a=>a.age===2).total;for(let i=0;i<count;i++)W.addHorse(w,{homeRegionId:r.id,homeRegion:r.name,age:2,qualification:0,initialQualification:0,sourceKind:'initial'});}});V.plan(w);W.validateWorld(w);}
  else w=V.create({id:'double-'+id,worldType:'reference',regionKeys:P.SCENARIOS[scenario],seed,...P.population(P.SCENARIOS[scenario],2)},world=>{write(file.replace('.json','.initial.gz'),{source,world},true);});
  state={source,config,world:w,initial:cohorts(n,w),settings:P.structure(n,w),years:[],current:newYear(n,w),timings:[],creationMs:performance.now()-start,rss:process.memoryUsage().rss};
 }
 const persist=status=>{const result={status,id,source,config,settings:state.settings,initial:state.initial,years:state.years,partial:state.current,performance:{creationMs:state.creationMs,halfMonthMs:A.distribution(state.timings),peakRssMiB:state.rss/2**20},worldHash:A.hash(state.world)};write(checkpoint,state,true);write(file,result);return result;};
 persist('running');
 while(state.years.length<config.years){
  if(state.world.phase==='yearEnd'){const m=state.current;m.verdict=verdict(m);state.years.push(m);state.current=null;if(state.years.length===config.years){console.log(JSON.stringify({id,complete:true,verdicts:state.years.map(y=>y.verdict.passed)}));return persist('complete');}state.world=W.finishYear(state.world).world;W.validateWorld(state.world);state.current=newYear(n,state.world);persist('running');}
  else {const before=state.world,t=performance.now(),out=W.advanceHalfMonth(before);state.timings.push(performance.now()-t);observe(n,before,out,state.current);state.world=out.world;state.rss=Math.max(state.rss,process.memoryUsage().rss);if(state.current.turns%6===0){persist('running');console.log(JSON.stringify({id,year:state.current.year,turns:state.current.turns}));}}
 }
 return persist('complete');
}
function main(){const opt=Object.fromEntries(process.argv.slice(2).map(v=>{const [k,...r]=v.replace(/^--/,'').split('=');return [k,r.join('=')];})),directory=path.resolve(opt.out||'artifacts/chairman-double-population');const names=(opt.scenarios||'japan,usa,britain,france,ireland,germany,italy,combined').split(',');for(const name of names){assert(P.SCENARIOS[name]);run(name,false,directory);}if(opt['skip-extra']!=='1')for(const name of ['japan','usa'])run(name,true,directory);}
if(require.main===module)main();module.exports={cohorts,newYear,observe,verdict,run};
