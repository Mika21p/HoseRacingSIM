'use strict';
const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib'),assert=require('node:assert/strict'),os=require('node:os'),{performance}=require('node:perf_hooks');
const {loadChairmanRules}=require('../tests/helpers/project-loader'),A=require('./lib/chairman-scheduling-audit'),P=require('./lib/chairman-population-audit');
function write(file,value,gzip=false){fs.mkdirSync(path.dirname(file),{recursive:true});const body=JSON.stringify(value,null,gzip?0:2);fs.writeFileSync(file+'.tmp',gzip?zlib.gzipSync(body,{level:1}):body);fs.renameSync(file+'.tmp',file);}
function source(){const s=A.manifest();s.populationRunner=A.hash(['scripts/audit-chairman-population.js','scripts/lib/chairman-population-audit.js'].map(f=>fs.readFileSync(f,'utf8')).join('\n'));return s;}
function runCase(config,directory){
 const id=`${config.scenario}-p${Math.round(config.factor*100)}-a${Math.round(config.annualRatio*100)}-s${config.seed}`,file=path.join(directory,id+'.json'),checkpoint=file+'.checkpoint.gz',fingerprint=source();
 if(fs.existsSync(file)){const saved=JSON.parse(fs.readFileSync(file,'utf8'));assert.equal(saved.source.fingerprint,fingerprint.fingerprint,'engine source changed');assert.equal(saved.source.populationRunner,fingerprint.populationRunner,'runner source changed');assert.deepEqual(saved.config,config,'configuration changed');if(['rejected','qualified'].includes(saved.status))return saved;}
 const n=loadChairmanRules().rules,W=n.ChairmanRules,V=n.ChairmanWorld;let state;
 if(fs.existsSync(checkpoint)){state=JSON.parse(zlib.gunzipSync(fs.readFileSync(checkpoint)));assert.deepEqual(state.config,config);assert.deepEqual(state.source,fingerprint);}
 else {
  const params=P.population(P.SCENARIOS[config.scenario],config.factor,config.annualRatio),start=performance.now();
  const world=V.create({id:'population-'+id,worldType:'reference',regionKeys:P.SCENARIOS[config.scenario],seed:config.seed,...params});
  state={source:fingerprint,config,world,createdAt:new Date().toISOString(),creationMs:performance.now()-start,initial:P.structure(n,world),years:[],current:P.annual(n,world),halfMonthMs:[],settleMs:[],rss:process.memoryUsage().rss,elapsedMs:0};
 }
 const start=performance.now(),oldElapsed=state.elapsedMs;
 const persist=status=>{state.elapsedMs=oldElapsed+performance.now()-start;const report={id,status,source:state.source,config,createdAt:state.createdAt,updatedAt:new Date().toISOString(),environment:{node:process.version,cpu:os.cpus()[0].model,logicalCpus:os.cpus().length},initial:state.initial,years:state.years,partial:state.current?.turns?state.current:null,
   performance:{creationMs:state.creationMs,halfMonthMs:P.distribution(state.halfMonthMs),yearSettlementMs:P.distribution(state.settleMs),elapsedMs:state.elapsedMs,peakProcessRssMiB:state.rss/2**20,worldBytes:Buffer.byteLength(JSON.stringify(state.world)),recordBytes:state.years.reduce((s,y)=>s+y.recordsBytes,0)+(state.current?.recordsBytes||0)},worldHash:A.hash(state.world),finalRng:{race:state.world.rngState,ai:state.world.aiRngState},limitations:['Sequential Node timings, not browser latency.','Short-field funnel is descriptive, not proof that reallocating those horses is reasonable.','Output record bytes are uncompressed transaction records, not measured IndexedDB size.','Failed year terminates this candidate; unrun seeds/years are not validated.']};write(checkpoint,state,true);write(file,report);return report;};
 persist('running');
 while(state.years.length<config.years){
  if(state.world.phase==='yearEnd'){
   const judgement=P.verdict(state.current);state.current.verdict=judgement;state.current.populationEnd=P.structure(n,state.world);state.years.push(state.current);state.current=null;
   if(!judgement.passed){const r=persist('rejected');console.log(JSON.stringify({id,status:r.status,year:state.years.length,reasons:judgement.reasons,ms:Math.round(state.elapsedMs)}));return r;}
   const tick=performance.now();state.world=W.finishYear(state.world).world;state.settleMs.push(performance.now()-tick);W.validateWorld(state.world);
   if(state.years.length===config.years)return persist('qualified');state.current=P.annual(n,state.world);persist('running');
  }else{
   const before=state.world,tick=performance.now(),out=W.advanceHalfMonth(before);state.halfMonthMs.push(performance.now()-tick);P.record(n,before,out,state.current);state.world=out.world;state.rss=Math.max(state.rss,process.memoryUsage().rss);
   if(state.current.turns%6===0){persist('running');console.log(JSON.stringify({id,year:state.current.year,turns:state.current.turns}));}
  }
 }
 return persist('qualified');
}
function main(){const opt=Object.fromEntries(process.argv.slice(2).map(v=>{const [k,...r]=v.replace(/^--/,'').split('=');return[k,r.join('=')||'1'];})),scenarios=(opt.scenarios||'japan,usa,europe,combined').split(','),factors=(opt.factors||'.75,1,1.25,1.5').split(',').map(Number),seeds=(opt.seeds||'123,43127,995173').split(',').map(Number),years=Number(opt.years||3),annualRatio=Number(opt.annual||.25),directory=path.resolve(opt.out||'artifacts/chairman-population-stage4');
 assert(scenarios.every(k=>P.SCENARIOS[k]));assert(factors.every(v=>Number.isFinite(v)&&v>0&&v<=4));assert(seeds.every(v=>Number.isSafeInteger(v)&&v>=0&&v<=0xffffffff));assert(Number.isInteger(years)&&years>=1&&years<=20);assert(annualRatio>0&&annualRatio<=1);
 const result={createdAt:new Date().toISOString(),source:source(),scenarios,factors,seeds,years,annualRatio,candidates:[],status:'running'};
 for(const scenario of scenarios)for(const factor of factors){const row={scenario,factor,runs:[],status:'running'};result.candidates.push(row);write(path.join(directory,'matrix.json'),result);
  for(const seed of seeds){const run=runCase({scenario,factor,annualRatio,seed,years},directory);row.runs.push({id:run.id,status:run.status,years:run.years.length,verdict:run.years.at(-1)?.verdict});if(run.status==='rejected'){row.status='rejected';break;}}
  if(row.status==='running')row.status='qualified';write(path.join(directory,'matrix.json'),result);
 }
 result.status='complete';result.qualified=result.candidates.filter(c=>c.status==='qualified').map(c=>({scenario:c.scenario,factor:c.factor}));write(path.join(directory,'matrix.json'),result);console.log(JSON.stringify({status:'complete',qualified:result.qualified,directory}));
}
if(require.main===module)main();module.exports={runCase,source};
