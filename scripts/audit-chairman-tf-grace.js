'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {loadChairmanRules}=require('../tests/helpers/project-loader');
const {createScorer,prestigeBonus}=require('./lib/chairman-tf-prototype');
const n=loadChairmanRules().rules,W=n.ChairmanRules,S=n.ChairmanRatings;
const seeds=[123,43127,995173],file='artifacts/chairman-tf-grace.json';
const mean=a=>a.length?a.reduce((s,x)=>s+x,0)/a.length:null;
const round=x=>x==null?null:Math.round(x*100)/100;
function bucket(){return {finished:0,rated:0,graded:0,gradedRated:0,adult:0,adultRated:0,juvenile:0,juvenileRated:0};}
function observe(b,p,rated){b.finished++;b.rated+=rated?1:0;if(['g1','g2','g3'].includes(p.raceClass)){b.graded++;b.gradedRated+=rated?1:0;}const age=p.age>=3?'adult':'juvenile';b[age]++;b[age+'Rated']+=rated?1:0;}
function summarize(b){return {...b,coverage:round(100*b.rated/b.finished),gradedCoverage:b.graded?round(100*b.gradedRated/b.graded):null,adultCoverage:b.adult?round(100*b.adultRated/b.adult):null,juvenileCoverage:b.juvenile?round(100*b.juvenileRated/b.juvenile):null};}
function fixtures(){
 const cases=[80,100,108,110,120].map(raw=>({raw,prestige85:round(prestigeBonus({raceClass:'g1',prestige:85},raw)),prestige100:round(prestigeBonus({raceClass:'g1',prestige:100},raw))}));
 for(const x of cases){assert.ok(x.prestige100>=0&&x.prestige100<=4);assert.ok(x.raw>=110?x.prestige100===0:x.raw+x.prestige100<110);}
 for(const race of [{raceClass:'g2',prestige:100},{raceClass:'g1',prestige:84}])assert.equal(prestigeBonus(race,80),0);
 const raw=createScorer(S),soft=createScorer(S,{softPrestige:true});
 const rows=[0,2,4,6,8].map((margin,i)=>({horseId:String(i),rank:i+1,margin}));
 const race={id:'repeat',raceClass:'g1',surface:'草地',distance:1600,prestige:100};
 assert.equal(soft.rate(race,rows,0).source,'unrated-no-anchor');
 let last;
 for(let i=0;i<40;i++){
  const r={...race,raceClass:i?'g1':'new'},a=raw.rate(r,rows,i*3),b=soft.rate(r,rows,i*3);
  assert.deepEqual(a.ratings,b.rawRatings);
  assert.equal(b.rawWinnerRating,a.winnerRating);
  assert.ok(b.prestigeBonus>=0&&b.prestigeBonus<=4);
  for(let j=1;j<rows.length;j++)assert.ok(b.ratings[String(j-1)]>=b.ratings[String(j)]);
  raw.record(r,rows,i*3,a);soft.record(r,rows,i*3,b);last=b;
 }
 assert.ok(last.rawWinnerRating<90);assert.equal(last.prestigeBonus,4);
 return {cases,repeatedRaces:40,lastRaw:last.rawWinnerRating,lastAdjusted:last.winnerRating,passed:true};
}
function run(seed,save){
 const raw=createScorer(S),soft=createScorer(S,{softPrestige:true});
 let w=W.createWorld({id:'tf-grace-'+seed,worldType:'reference',regionKeys:['japan','usa'],population:{japan:80,usa:80},annualTargets:{japan:20,usa:20},foundation:false,breeding:false,seed});
 const initial=new Set(w.horses.map(h=>h.id)),years=[],facts=crypto.createHash('sha256');
 for(let year=1;year<=6;year++){
  const total=bucket(),regions=Object.fromEntries(w.regions.map(r=>[r.id,bucket()])),sources={},unratedReasons={},bonuses=[],winnerRaw=[],winnerAdjusted=[],lineage={rated:0,rooted:0,graded:0,gradedWithTransmission:0,maxDepth:0};
  let completed=0,highG1=0,highG1Rated=0,highG1Boosted=0;
  const active=w.horses.filter(h=>h.status==='active'),initialActive=active.filter(h=>initial.has(h.id)).length;
  while(w.phase!=='yearEnd'){
   const turn=w.turn,out=W.advanceHalfMonth(w);w=out.world;const groups=new Map();
   for(const p of out.performances){if(!groups.has(p.occurrenceId))groups.set(p.occurrenceId,[]);groups.get(p.occurrenceId).push(p);}
   for(const e of out.occurrences){if(e.status!=='completed')continue;completed++;
    const race={...e.race,prestige:n.ChairmanPrestige.value(e.race)},rows=groups.get(e.id)||[],a=raw.rate(race,rows,turn),b=soft.rate(race,rows,turn);
    facts.update(JSON.stringify({id:e.id,turn,rows:rows.map(p=>[p.horseId,p.rank,p.margin,p.retired])}));
    assert.deepEqual(a.ratings,b.rawRatings||b.ratings);assert.ok((b.prestigeBonus||0)>=0&&(b.prestigeBonus||0)<=4);
    sources[a.source]=(sources[a.source]||0)+1;
    if(race.raceClass==='g1'&&race.prestige>=85){highG1++;if(a.winnerRating!=null){highG1Rated++;winnerRaw.push(a.winnerRating);winnerAdjusted.push(b.winnerRating);}if(b.prestigeBonus>0){highG1Boosted++;bonuses.push(b.prestigeBonus);}}
    for(const p of rows){if(p.retired||p.rank==null)continue;const rated=a.ratings[p.horseId]!=null;observe(total,p,rated);observe(regions[race.regionId],p,rated);
     if(rated){lineage.rated++;lineage.rooted+=a.roots?.length>0?1:0;lineage.maxDepth=Math.max(lineage.maxDepth,a.depth||0);if(['g1','g2','g3'].includes(race.raceClass)){lineage.graded++;lineage.gradedWithTransmission+=a.depth>0?1:0;}}
     else {const history=raw.history.get(p.horseId)||[],recent=history.filter(p=>p.turn<turn&&p.turn>=turn-12),form=raw.form(p.horseId,race,turn);const reason=!history.length?'never-rated':!recent.length?'expired-history':!form?'surface-distance-mismatch':'no-usable-field-anchor';unratedReasons[reason]=(unratedReasons[reason]||0)+1;}
    }
    raw.record(race,rows,turn,a);soft.record(race,rows,turn,b);
   }
  }
  assert.equal(lineage.rated,lineage.rooted);assert.equal(lineage.graded,lineage.gradedWithTransmission);
  const regional=Object.fromEntries(Object.entries(regions).map(([id,b])=>[id,summarize(b)]));
  const failures=Object.entries(regional).flatMap(([region,b])=>[['coverage',b.rated,b.finished],['gradedCoverage',b.gradedRated,b.graded]].filter(([,num,den])=>!den||num/den<.9).map(([metric,num,den])=>({region,metric,num,den,status:den?'below-90':'not-applicable'})));
  const result={year,grace:year<=3,activeAtStart:active.length,initialActiveAtStart:initialActive,completed,...summarize(total),regions:regional,sources,unratedReasons,lineage,highG1,highG1Rated,highG1Boosted,meanBonus:round(mean(bonuses)),maxBonus:bonuses.length?round(Math.max(...bonuses)):null,meanHighG1Raw:round(mean(winnerRaw)),meanHighG1Adjusted:round(mean(winnerAdjusted)),acceptance:year<=3?'exempt':failures.length?'not-passed':'passed',failures:year<=3?[]:failures};
  years.push(result);console.log(JSON.stringify({seed,...result}));save({seed,years,status:year===6?'complete':'running'});
  if(year<6)w=W.finishYear(w).world;
 }
 return {seed,years,status:'complete',factsHash:facts.digest('hex')};
}
function main(){
 const report={design:'docs/主席模式TF过渡期与G1柔性加成-实验登记.md',graceYears:3,seeds,sourceHashes:Object.fromEntries(['js/rules/chairman-ratings.js','js/rules/chairman-world.js','js/rules/chairman.js','scripts/lib/chairman-tf-prototype.js',__filename].map(f=>[f,crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex')])),fixtures:fixtures(),runs:[]};
 const persist=()=>fs.writeFileSync(file,JSON.stringify(report,null,2));fs.mkdirSync('artifacts',{recursive:true});
 for(const seed of seeds){const i=report.runs.length;report.runs.push(null);report.runs[i]=run(seed,r=>{report.runs[i]=r;persist();});persist();}
}
if(require.main===module)main();module.exports={fixtures};
