'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {loadChairmanRules}=require('../tests/helpers/project-loader');
const {createScorer}=require('./lib/chairman-tf-prototype');
const n=loadChairmanRules().rules,W=n.ChairmanRules,S=n.ChairmanRatings;
const previous=JSON.parse(fs.readFileSync('artifacts/chairman-tf-grace.json','utf8'));
const round=x=>Math.round(x*100)/100;
function dist(a){const s=[...a].sort((a,b)=>a-b);return {count:s.length,mean:s.length?round(s.reduce((a,b)=>a+b,0)/s.length):null,p90:s[Math.floor(s.length*.9)]??null,max:s.at(-1)??null};}
function bucket(){return {finished:0,rated:0,graded:0,gradedRated:0};}
function summary(b){return {...b,coverage:b.finished?round(100*b.rated/b.finished):null,gradedCoverage:b.graded?round(100*b.gradedRated/b.graded):null};}
function fixtures(){
 const p=createScorer(S,{durableReference:true,softPrestige:true}),race={id:'trial',raceClass:'op',surface:'草地',distance:1600,prestige:0};
 const rows=[{horseId:'a',rank:1,margin:0},{horseId:'b',rank:2,margin:2},{horseId:'c',rank:null,retired:true}];
 assert.equal(p.rate(race,rows,0).source,'unrated-no-anchor');
 assert.equal(p.settleDebut(race,rows,0,new Set(['a','c'])).count,1);
 assert.equal(p.history.has('b'),false);assert.equal(p.history.has('c'),false);
 assert.equal(p.settleDebut(race,rows,0,new Set(['a'])).count,0);
 const fresh=p.form('a',race,3),old=p.form('a',race,48),wrong=p.form('a',{...race,surface:'泥地',distance:2800},3);
 assert.ok(old&&old.weight<fresh.weight);assert.ok(wrong&&wrong.weight<fresh.weight);assert.equal(fresh.value,old.value);
 p.history.get('a').push({turn:45,tf:105,surface:'草地',distance:1600,roots:['known'],depth:1});
 assert.equal(p.form('a',race,48).value,105);
 const rated=p.rate({...race,raceClass:'g1',prestige:100},rows,48);p.record({...race,raceClass:'g1',prestige:100},rows,48,rated);
 assert.equal(p.history.get('a').at(-1).tf,rated.rawRatings.a);
 require('./audit-chairman-tf-grace').fixtures();require('./audit-chairman-tf-prototype').fixture();
 return {passed:true,oldWeight:old.weight,freshWeight:fresh.weight,wrongConditionWeight:wrong.weight};
}
function run(seed,save){
 const groups=[{name:'previous',options:{}},{name:'durable',options:{durableReference:true}},{name:'complete',options:{durableReference:true},debut:true}].map(g=>({...g,scorer:createScorer(S,{...g.options,softPrestige:true})}));
 let w=W.createWorld({id:'tf-grace-'+seed,worldType:'reference',regionKeys:['japan','usa'],population:{japan:80,usa:80},annualTargets:{japan:20,usa:20},foundation:false,breeding:false,seed});
 const years=[],facts=crypto.createHash('sha256'),old=previous.runs.find(r=>r.seed===seed);
 for(let year=1;year<=6;year++){
  const measures=Object.fromEntries(groups.map(g=>[g.name,{...bucket(),regions:Object.fromEntries(w.regions.map(r=>[r.id,bucket()])),raw:[],gradedRaw:[],g1Raw:[],g1Adjusted:[],debutAssessments:0,noviceFinished:0,noviceWithReference:0,qualifiedWinners:0,winnersWithReference:0,unratedReasons:{},sources:{},provisionalRaces:0}]));
  while(w.phase!=='yearEnd'){
   const before=new Map(w.horses.map(h=>[h.id,h])),turn=w.turn,out=W.advanceHalfMonth(w);w=out.world;const byRace=new Map();
   for(const p of out.performances){if(!byRace.has(p.occurrenceId))byRace.set(p.occurrenceId,[]);byRace.get(p.occurrenceId).push(p);}
   for(const e of out.occurrences){if(e.status!=='completed')continue;
    const race={...e.race,prestige:n.ChairmanPrestige.value(e.race)},rows=byRace.get(e.id)||[],novices=new Set(rows.filter(p=>(before.get(p.horseId).qualification??0)===0).map(p=>p.horseId));
    facts.update(JSON.stringify({id:e.id,turn,rows:rows.map(p=>[p.horseId,p.rank,p.margin,p.retired])}));
    for(const g of groups){const m=measures[g.name],r=g.scorer.rate(race,rows,turn),graded=['g1','g2','g3'].includes(race.raceClass),high=race.raceClass==='g1'&&race.prestige>=85;
     m.sources[r.source]=(m.sources[r.source]||0)+1;m.provisionalRaces+=r.confidence?.startsWith('provisional')?1:0;
     if(high&&r.rawWinnerRating!=null){m.g1Raw.push(r.rawWinnerRating);m.g1Adjusted.push(r.winnerRating);}
     for(const p of rows){if(p.retired||p.rank==null)continue;const rated=r.ratings[p.horseId]!=null;
      for(const b of [m,m.regions[race.regionId]]){b.finished++;b.rated+=rated?1:0;if(graded){b.graded++;b.gradedRated+=rated?1:0;}}
      if(rated){m.raw.push(r.rawRatings[p.horseId]);if(graded)m.gradedRaw.push(r.rawRatings[p.horseId]);}
      else {const reason=g.scorer.history.has(p.horseId)?'existing-reference-not-usable':'never-rated';m.unratedReasons[reason]=(m.unratedReasons[reason]||0)+1;}
     }
     g.scorer.record(race,rows,turn,r);
     if(g.debut)m.debutAssessments+=g.scorer.settleDebut(race,rows,turn,novices).count;
     for(const p of rows){if(!novices.has(p.horseId)||p.retired||p.rank==null)continue;m.noviceFinished++;const has=g.scorer.history.has(p.horseId);m.noviceWithReference+=has?1:0;if(p.rank===1){m.qualifiedWinners++;m.winnersWithReference+=has?1:0;}if(g.debut)assert.ok(has,'Every finishing novice leaves with a reference');}
    }
   }
  }
  const baseline=measures.previous,expected=old.years[year-1];
  for(const key of ['finished','rated','graded','gradedRated'])assert.equal(baseline[key],expected[key],`paired baseline ${seed}/${year}/${key}`);
  const output={year,groups:Object.fromEntries(groups.map(g=>{const m=measures[g.name],regions=Object.fromEntries(Object.entries(m.regions).map(([id,b])=>[id,summary(b)]));const pass=Object.values(regions).every(b=>b.finished&&b.graded&&b.rated/b.finished>=.9&&b.gradedRated/b.graded>=.9);
   return [g.name,{...summary(m),regions,raw:dist(m.raw),gradedRaw:dist(m.gradedRaw),g1Raw:dist(m.g1Raw),g1Adjusted:dist(m.g1Adjusted),acceptance:year<=3?'exempt':pass?'passed':'not-passed'}];}))};
  years.push(output);save({seed,status:'running',years});console.log(JSON.stringify({seed,year,groups:Object.fromEntries(Object.entries(output.groups).map(([k,m])=>[k,{coverage:m.coverage,graded:m.gradedCoverage,debut:m.debutAssessments,acceptance:m.acceptance,g1Raw:m.g1Raw.mean}]))}));
  if(year<6)w=W.finishYear(w).world;
 }
 const factsHash=facts.digest('hex');assert.equal(factsHash,old.factsHash,'Same simulation facts as previous experiment');return {seed,status:'complete',years,factsHash,previousFactsMatched:true};
}
function main(){
 const report={design:'docs/主席模式TF出道衔接与持久参考-实验登记.md',fixtures:fixtures(),runs:[],sourceHashes:Object.fromEntries([__filename,'scripts/lib/chairman-tf-prototype.js'].map(f=>[f,crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex')]))};
 const save=()=>fs.writeFileSync('artifacts/chairman-tf-reference.json',JSON.stringify(report,null,2));
 for(const seed of previous.seeds){const i=report.runs.length;report.runs.push(null);report.runs[i]=run(seed,r=>{report.runs[i]=r;save();});save();}
}
if(require.main===module)main();module.exports={fixtures};
