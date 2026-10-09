'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const n=require('../tests/helpers/project-loader').loadChairmanRules().rules,W=n.ChairmanRules,S=n.ChairmanRatings;
const {createScorer}=require('./lib/chairman-tf-prototype');
const prior=JSON.parse(fs.readFileSync('artifacts/chairman-tf-reference.json','utf8'));
const options={durableReference:true,softPrestige:true,noviceVariation:true,robustField:true};
const round=x=>Math.round(x*100)/100,mean=a=>a.length?a.reduce((a,b)=>a+b,0)/a.length:null;
function dist(a){const s=[...a].sort((a,b)=>a-b);return {count:s.length,mean:s.length?round(mean(s)):null,min:s[0]??null,p90:s[Math.floor(s.length*.9)]??null,max:s.at(-1)??null};}
function checks(){
 const race={id:'new',raceClass:'new',surface:'草地',distance:1600},rows=Array.from({length:8},(_,i)=>({horseId:String(i),rank:i+1,margin:i*2}));
 const p=createScorer(S,{...options,seed:123}),old=createScorer(S,{durableReference:true}),baseline=old.rate(race,rows,0).rawWinnerRating;
 const random=n.Random.seeded(123),before=random.state(),waves=[];
 n.Random.withSource(random,()=>{for(let i=0;i<64;i++){const r={...race,id:'debut-'+i},a=p.rate(r,rows,0),b=p.rate(r,[...rows].reverse(),0);assert.deepEqual(a,b);waves.push(a.rawWinnerRating-baseline);assert.ok(Math.abs(waves.at(-1))<=4);for(let j=1;j<8;j++)assert.ok(a.ratings[j-1]>=a.ratings[j]);}});
 assert.equal(random.state(),before);assert.ok(Math.abs(mean(waves))<1);
 const hostile=[];
 for(const count of [2,5,8])for(const bad of [40,150]){
  const r={...race,raceClass:count===8?'g1':'op',prestige:count===8?100:0};
  const rs=rows.slice(0,count),a=createScorer(S,{durableReference:true}),b=createScorer(S,options);
  for(const scorer of [a,b])for(const [i,row] of rs.entries())scorer.history.set(row.horseId,i===0?[41,44,47].map(turn=>({turn,tf:bad,surface:r.surface,distance:r.distance,roots:['bad'],depth:0})):[{turn:0,tf:100-S.deficit(row,r.distance),surface:r.surface,distance:r.distance,roots:['normal-'+i],depth:0}]);
  const x=a.rate(r,rs,50),y=b.rate(r,rs,50);if(count>=5)assert.ok(Math.abs(y.rawWinnerRating-100)<1e-9);
  hostile.push({count,bad,old:round(x.rawWinnerRating),optimized:round(y.rawWinnerRating),adjusted:round(y.winnerRating)});
 }
 const strong=createScorer(S,options);for(const row of rows)strong.history.set(row.horseId,[{turn:0,tf:150-S.deficit(row,1600),surface:'草地',distance:1600,roots:['strong'],depth:0}]);
 assert.ok(Math.abs(strong.rate({...race,raceClass:'g1',prestige:100},rows,3).rawWinnerRating-150)<1e-9);
 const split=createScorer(S,options),splitRows=rows.slice(0,6).map(r=>({...r,margin:0}));
 for(const [i,row]of splitRows.entries())split.history.set(row.horseId,[{turn:0,tf:i<3?80:120,surface:race.surface,distance:race.distance,roots:['split'],depth:0}]);
 const splitResult=split.rate({...race,raceClass:'op'},splitRows,3);
 assert.ok(Number.isFinite(splitResult.rawWinnerRating));assert.ok(Object.values(splitResult.ratings).every(v=>v===80));
 // Same future potential, different current mature performance. The scorer
 // receives margins only; changing potential fields cannot change TF.
 const matureRows=[{horseId:'early',rank:1,margin:0,potential:100},{horseId:'late',rank:2,margin:4,potential:100}];
 const mature=p.rate(race,matureRows,0),hidden=p.rate(race,matureRows.map(r=>({...r,potential:999})),0);
 assert.deepEqual(mature,hidden);assert.equal(mature.ratings.early-mature.ratings.late,10);
 require('./audit-chairman-tf-reference').fixtures();
 return {waves:dist(waves),hostile,splitCandidatesWinner:splitResult.rawWinnerRating,maturity:{early:mature.ratings.early,late:mature.ratings.late,potentialIgnored:true},passed:true};
}
function bucket(){return {finished:0,rated:0,graded:0,gradedRated:0};}
function summary(b){return {...b,coverage:b.finished?round(100*b.rated/b.finished):null,gradedCoverage:b.graded?round(100*b.gradedRated/b.graded):null};}
function run(seed,save){
 const groups=[{name:'before',scorer:createScorer(S,{durableReference:true,softPrestige:true})},{name:'waveOnly',scorer:createScorer(S,{...options,robustField:false,seed})},{name:'guardOnly',scorer:createScorer(S,{...options,noviceVariation:false,seed})},{name:'after',scorer:createScorer(S,{...options,seed})}];
 let w=W.createWorld({id:'tf-grace-'+seed,worldType:'reference',regionKeys:['japan','usa'],population:{japan:80,usa:80},annualTargets:{japan:20,usa:20},foundation:false,breeding:false,seed});
 const years=[],facts=crypto.createHash('sha256');
 for(let year=1;year<=4;year++){
  const stats=Object.fromEntries(groups.map(g=>[g.name,{...bucket(),regions:Object.fromEntries(w.regions.map(r=>[r.id,bucket()])),raw:[],noviceRaw:[],g1Raw:[],novices:0,noviceReferences:0,winners:0,winnerReferences:0,debutAssessments:0,lowCases:[],fields:{complete:{rated:0,low:0,high:0},incomplete:{rated:0,low:0,high:0}}}]));
  while(w.phase!=='yearEnd'){
   const before=new Map(w.horses.map(h=>[h.id,h])),turn=w.turn,out=W.advanceHalfMonth(w);w=out.world;const races=new Map();
   for(const p of out.performances){if(!races.has(p.occurrenceId))races.set(p.occurrenceId,[]);races.get(p.occurrenceId).push(p);}
   for(const e of out.occurrences){if(e.status!=='completed')continue;const race={...e.race,prestige:n.ChairmanPrestige.value(e.race)},rows=races.get(e.id)||[],noviceIds=new Set(rows.filter(p=>(before.get(p.horseId).qualification??0)===0).map(p=>p.horseId));
    facts.update(JSON.stringify({id:e.id,turn,rows:rows.map(p=>[p.horseId,p.rank,p.margin,p.retired])}));
    const finishers=rows.filter(p=>!p.retired&&p.rank!=null),full=finishers.length>=(race.raceClass==='g1'&&race.prestige>=85?8:5),graded=['g1','g2','g3'].includes(race.raceClass);
    for(const g of groups){const m=stats[g.name],r=g.scorer.rate(race,rows,turn);
     if(r.rawWinnerRating!=null&&race.raceClass==='g1')m.g1Raw.push(r.rawWinnerRating);
     if(r.rawWinnerRating!=null&&['new','maiden'].includes(race.raceClass))m.noviceRaw.push(r.rawWinnerRating);
     if(r.rawWinnerRating!=null)assert.ok(Number.isFinite(r.rawWinnerRating));
     for(const p of finishers){const rated=r.ratings[p.horseId]!=null;if(rated)assert.ok(Number.isFinite(r.ratings[p.horseId]));for(const b of [m,m.regions[race.regionId]]){b.finished++;b.rated+=rated?1:0;if(graded){b.graded++;b.gradedRated+=rated?1:0;}}
      if(rated){const value=r.rawRatings[p.horseId],f=m.fields[full?'complete':'incomplete'];m.raw.push(value);f.rated++;f.low+=value<40?1:0;f.high+=value>140?1:0;if(full&&value<40)m.lowCases.push({raceId:race.id,turn,raceClass:race.raceClass,horseId:p.horseId,rank:p.rank,count:finishers.length,margin:p.margin,deficit:S.deficit(p,race.distance),value,winner:r.rawWinnerRating,anchors:r.anchors});}
     }
     g.scorer.record(race,rows,turn,r);m.debutAssessments+=g.scorer.settleDebut(race,rows,turn,noviceIds).count;
     for(const p of finishers.filter(p=>noviceIds.has(p.horseId))){m.novices++;assert.ok(g.scorer.history.has(p.horseId));m.noviceReferences++;if(p.rank===1){m.winners++;m.winnerReferences++;}}
    }
   }
  }
  const expected=prior.runs.find(r=>r.seed===seed).years[year-1].groups.complete;
  for(const key of ['finished','rated','graded','gradedRated'])assert.equal(stats.before[key],expected[key]);
  const result={year,groups:Object.fromEntries(groups.map(g=>{const m=stats[g.name],regions=Object.fromEntries(Object.entries(m.regions).map(([id,b])=>[id,summary(b)]));return [g.name,{...summary(m),regions,raw:dist(m.raw),noviceRaw:dist(m.noviceRaw),g1Raw:dist(m.g1Raw),acceptance:year<=3?'exempt':Object.values(regions).every(b=>b.coverage>=90&&b.gradedCoverage>=90)?'passed':'not-passed'}];}))};
  years.push(result);save({seed,years,status:'running'});console.log(JSON.stringify({seed,year,before:result.groups.before.coverage,after:result.groups.after.coverage,graded:result.groups.after.gradedCoverage,fields:result.groups.after.fields,acceptance:result.groups.after.acceptance}));if(year<4)w=W.finishYear(w).world;
 }
 return {seed,years,status:'complete',factsHash:facts.digest('hex'),baselineCountsMatched:true};
}
function main(){
 const controlled=require('./audit-chairman-tf-prototype').controlled;
 const report={design:'docs/主席模式TF新马波动与完整阵容优化-实验登记.md',checks:checks(),controlled:[123,43127].map(seed=>controlled(seed,false,{...options,seed})),sourceHashes:Object.fromEntries([__filename,'scripts/lib/chairman-tf-prototype.js'].map(f=>[f,crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex')])),runs:[]};
 const persist=()=>fs.writeFileSync('artifacts/chairman-tf-variation.json',JSON.stringify(report,null,2));
 for(const seed of [123,43127]){const i=report.runs.length;report.runs.push(null);report.runs[i]=run(seed,r=>{report.runs[i]=r;persist();});persist();}
}
if(require.main===module)main();
