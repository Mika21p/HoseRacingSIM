'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {performance}=require('node:perf_hooks');
const {loadChairmanRules}=require('../tests/helpers/project-loader');
const {createScorer,median}=require('./lib/chairman-tf-prototype');
const n=loadChairmanRules().rules,S=n.ChairmanRatings,W=n.ChairmanRules;
const seeds=[123,43127,995173],mean=a=>a.length?a.reduce((s,x)=>s+x,0)/a.length:null;
const rounded=x=>x==null?null:Math.round(x*100)/100;
function distribution(a){const s=a.filter(Number.isFinite).sort((a,b)=>a-b);return {count:s.length,mean:rounded(mean(s)),median:median(s),p90:s[Math.floor(s.length*.9)]??null,max:s.at(-1)??null};}
function fixture(){
 const p=createScorer(S),race={id:'a',raceClass:'new',surface:'草地',distance:1600};
 const rows=[0,2,4,6,8].map((margin,i)=>({horseId:String(i),rank:i+1,margin}));
 const debut=p.rate(race,rows,0);assert.equal(debut.ratings['0'],86);p.record(race,rows,0,debut);
 const other={...race,raceClass:'g1',prestige:100,tfStandards:{a:[999]}};
 const a=p.rate(other,rows,3),b=p.rate({...other,raceClass:'op',prestige:0},rows.map(r=>({...r,total:9999,strength:999,tf:999})),3);
 assert.deepEqual(a,b);
 const upset=rows.map(r=>r.horseId==='4'?{...r,margin:100}:r);
 const dropped=p.rate(other,upset,3);assert.ok(Math.abs(dropped.winnerRating-a.winnerRating)<=1);
 assert.equal(createScorer(S).rate(other,rows,0).source,'unrated-no-anchor');
 assert.deepEqual(p.rate(race,rows.map(r=>({...r,retired:true})),3).ratings,{});
 const fast=[{horseId:'x',rank:1,margin:0},{horseId:'0',rank:2,margin:8}];
 const transfer=p.rate(other,fast,3);assert.equal(transfer.ratings.x,106);
 assert.equal(p.rate({...other,surface:'泥地'},rows,3).source,'unrated-no-anchor');
 return {checks:7,debut,ordinary:a,oneBadRun:dropped,transfer};
}
function controlled(seed,maturing,options={}){
 const rng=n.Random.seeded(seed),p=createScorer(S,options),race={id:'controlled',raceClass:'new',surface:'草地',distance:1600};
 const horses=Array.from({length:16},(_,i)=>({id:String(i),status:'active',recentForm:[]}));
 const records=[],last={};
 for(let round=0;round<120;round++){
  const turn=round*3;race.raceClass=round?'op':'new';
  const truth=horses.map((h,i)=>({horseId:h.id,value:65+i*1.2+(maturing&&i<4?Math.max(0,Math.min(12,(round-59)*.2)):0)}));
  const runs=truth.map(h=>({...h,performance:h.value+(rng()-.5)*8})).sort((a,b)=>b.performance-a.performance);
  const rows=runs.map((h,i)=>({horseId:h.horseId,rank:i+1,margin:(runs[0].performance-h.performance)/2.5}));
  const old=S.rateRaceTF(race,rows,horses,turn,undefined,S.calibration({turn,horses})),out=p.rate(race,rows,turn);
  p.record(race,rows,turn,out);
  rows.forEach(r=>S.record(horses.find(h=>h.id===r.horseId),{...r,tf:old.ratings[r.horseId],turn,raceClass:race.raceClass,surface:race.surface,distance:race.distance,prize:0},16));
  const target=Object.fromEntries(truth.map(h=>[h.horseId,h.value])),actual=out.ratings;
  const shift=mean(Object.keys(actual).map(id=>actual[id]-target[id]));
  const rmse=Math.sqrt(mean(Object.keys(actual).map(id=>(actual[id]-shift-target[id])**2)));
  let correct=0,pairs=0;for(let i=0;i<16;i++)for(let j=i+1;j<16;j++){const delta=target[i]-target[j];if(!delta)continue;pairs++;correct+=(actual[i]-actual[j])*delta>0?1:actual[i]===actual[j]?.5:0;}
  records.push({round,prototype:mean(Object.values(actual)),current:mean(Object.values(old.ratings)),rmse,ordering:correct/pairs,
    youngGap:mean(['0','1','2','3'].map(id=>actual[id]))-mean(horses.slice(4).map(h=>actual[h.id]))});
  Object.assign(last,actual);
 }
 const slice=(key,from,to)=>mean(records.slice(from,to).map(r=>r[key]));
 const drift=slice('prototype',90)-slice('prototype',20,50);
 return {seed,maturing,prototypeDrift:rounded(drift),currentDrift:rounded(slice('current',90)-slice('current',20,50)),driftPass:maturing?null:Math.abs(drift)<=5,
  centeredRmse:rounded(slice('rmse',90)),pairOrdering:rounded(slice('ordering',90)),youngRelativeGain:rounded(slice('youngGap',90)-slice('youngGap',20,50)),last};
}
function replay(seed){
 const start=performance.now(),protos=[80,85,90].map(base=>({base,scorer:createScorer(S,{base}),values:[],byClass:{},sources:{},milliseconds:0}));
 let w=W.createWorld({id:'tf-prototype-'+seed,worldType:'reference',regionKeys:['japan','usa'],population:{japan:80,usa:80},annualTargets:{japan:20,usa:20},foundation:false,breeding:false,seed});
 let completed=0,performances=0;const current=[],byClass={},facts=[],matchedCurrent=[],newWinners=[];
 while(w.phase!=='yearEnd'){
  const turn=w.turn,out=W.advanceHalfMonth(w);w=out.world;
  const grouped=new Map();for(const row of out.performances){if(!grouped.has(row.occurrenceId))grouped.set(row.occurrenceId,[]);grouped.get(row.occurrenceId).push(row);}
  for(const occurrence of out.occurrences){
   if(occurrence.status!=='completed')continue;completed++;const rows=grouped.get(occurrence.id)||[],race=occurrence.race;
   const vals=rows.filter(p=>p.tf!=null).map(p=>p.tf);performances+=vals.length;current.push(...vals);(byClass[race.raceClass]??=[]).push(...vals);
   if(race.raceClass==='new')newWinners.push(...rows.filter(p=>p.rank===1&&p.tf!=null).map(p=>p.tf));
   facts.push({id:occurrence.id,turn,raceClass:race.raceClass,rows:rows.map(p=>({id:p.horseId,rank:p.rank,margin:p.margin,retired:p.retired}))});
   for(const proto of protos){const t=performance.now(),r=proto.scorer.rate(race,rows,turn);proto.scorer.record(race,rows,turn,r);proto.milliseconds+=performance.now()-t;
    const values=Object.values(r.ratings);proto.values.push(...values);(proto.byClass[race.raceClass]??=[]).push(...values);proto.sources[r.source]=(proto.sources[r.source]||0)+1;
    if(proto.base===85)matchedCurrent.push(...rows.filter(p=>r.ratings[p.horseId]!=null&&p.tf!=null).map(p=>p.tf));}
  }
 }
 return {seed,completed,performances,elapsedSeconds:rounded((performance.now()-start)/1000),factsHash:crypto.createHash('sha256').update(JSON.stringify(facts)).digest('hex'),current:distribution(current),matchedCurrent:distribution(matchedCurrent),currentNewWinners:distribution(newWinners),currentByClass:Object.fromEntries(Object.entries(byClass).map(([k,v])=>[k,distribution(v)])),
  prototypes:protos.map(p=>({base:p.base,distribution:distribution(p.values),coverage:rounded(p.values.length/performances*100),byClass:Object.fromEntries(Object.entries(p.byClass).map(([k,v])=>[k,distribution(v)])),sources:p.sources,scoringMs:rounded(p.milliseconds)}))};
}
function main(){
 const report={design:'docs/主席模式TF机制小规模实验-登记.md',seeds,sourceHashes:Object.fromEntries(['js/rules/chairman-ratings.js','scripts/lib/chairman-tf-prototype.js',__filename].map(f=>[f,crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex')])),fixtures:fixture(),controlled:seeds.flatMap(seed=>[controlled(seed,false),controlled(seed,true)]),replays:[]};
 fs.mkdirSync('artifacts',{recursive:true});
 for(const seed of seeds){const r=replay(seed);report.replays.push(r);console.log(JSON.stringify(r));fs.writeFileSync('artifacts/chairman-tf-prototype.json',JSON.stringify(report,null,2));}
 console.log(JSON.stringify({controlled:report.controlled,fixtures:report.fixtures.checks}));
}
if(require.main===module)main();
module.exports={fixture,controlled,replay};
