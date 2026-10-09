'use strict';
function evidence(n,w,h,actualOnly=false){
 const published=(h.recentForm||[]).filter(p=>Number.isFinite(p.tf)&&!p.retired&&Number.isInteger(p.turn)&&p.turn<=w.turn&&p.turn>=w.turn-12&&Number.isFinite(p.distance)&&p.distance>0&&['草地','泥地'].includes(p.surface)&&(p.rank==null||p.rank>0)).sort((a,b)=>b.turn-a.turn).slice(0,8);
 const rows=actualOnly?published.filter(p=>!p.assessment):published;
 const groups=new Map();for(const p of rows){const key=p.surface+':'+n.ChairmanRules.category(p.distance),a=groups.get(key)||[];a.push(p);groups.set(key,a);}
 const median=n.ChairmanRatings.median,best=[...groups.values()].filter(a=>a.length>=2).map(a=>({surface:a[0].surface,distance:median(a.map(p=>p.distance)),value:median(a.map(p=>p.tf))})).sort((a,b)=>b.value-a.value)[0];
 return {rows,groups,best};
}
function risky(n,e,r){const a=e.groups.get(r.surface+':'+n.ChairmanRules.category(r.distance))||[],near=e.rows.filter(p=>p.surface===r.surface&&Math.abs(p.distance-r.distance)<=400),sample=a.length?a:near,b=e.best;
 return !!(b&&(sample.length>=2&&n.ChairmanRatings.median(sample.map(p=>p.tf))<b.value-15||e.rows.length&&!sample.length&&(b.surface!==r.surface||Math.abs(b.distance-r.distance)>600)));
}
function inspect(n,w,out){
 const W=n.ChairmanRules,V=n.ChairmanWorld,cache=new Map(),records=[];
 for(const e of out.occurrences){const r=e.race;if(r.support)continue;const high=r.raceClass==='g1'&&n.ChairmanPrestige.value(r)>=85,required=high?8:5;if(!high&&e.count>=required)continue;
  const row={raceId:r.id,name:r.name,region:r.regionId,turn:w.turn,high,count:e.count,required,age:r.ageRule,sex:r.sexRule,surface:r.surface,distance:r.distance,localReady:0,assessmentRisk:0,assessmentRiskSupport:0,actualRisk:0,knownCohort:0,leaders:0,leadersReady:0,leadersStarted:0,pair:false,fullFieldBetterOutsiders:0,outsiderGoals:{thisRace:0,otherHigh:0,other:0,none:0}};
  const entrants=new Set(out.performances.filter(p=>p.occurrenceId===e.id).map(p=>p.horseId)),cohort=[];
  for(const h of w.horses){if(h.status!=='active'||h.homeRegionId!==r.regionId||(h.qualification??0)===0||!W.eligible(w,{...h,restUntil:0},r,w.turn))continue;
   if(!cache.has(h.id))cache.set(h.id,{all:evidence(n,w,h),actual:evidence(n,w,h,true)});const f=cache.get(h.id),ready=h.restUntil<=w.turn&&V.route(w,h,r,w.turn).reachable&&!h.transit;
   if(ready){row.localReady++;const ar=risky(n,f.actual,r);row.actualRisk+=ar?1:0;if(risky(n,f.all,r)&&!ar){row.assessmentRisk++;if(w.races.find(x=>x.id===h.booked?.raceId)?.support)row.assessmentRiskSupport++;}}
   const score=W.entryRating(h),routeKnown=f.all.rows.some(p=>p.surface===r.surface&&Math.abs(p.distance-r.distance)<=400);
   if(high&&score!=null&&routeKnown)cohort.push({id:h.id,score,ready,target:h.target});
  }
  row.knownCohort=cohort.length;
  if(cohort.length>=4){const sorted=cohort.map(h=>h.score).sort((a,b)=>a-b),cut=sorted[Math.floor(sorted.length*.75)],leaders=cohort.filter(h=>h.score>=cut);row.leaders=leaders.length;row.leadersReady=leaders.filter(h=>h.ready).length;row.leadersStarted=leaders.filter(h=>entrants.has(h.id)).length;row.pair=row.leadersStarted>=2;
   const scores=cohort.filter(h=>entrants.has(h.id)).map(h=>h.score);if(e.count>=r.capacity&&scores.length){const low=Math.min(...scores);const outside=leaders.filter(h=>h.ready&&!entrants.has(h.id)&&h.score>=low+10);row.fullFieldBetterOutsiders=outside.length;for(const h of outside){const target=w.races.find(r=>r.id===h.target?.raceId);const key=!target?'none':target.id===r.id&&h.target.turn===w.turn?'thisRace':target.raceClass==='g1'&&n.ChairmanPrestige.value(target)>=85?'otherHigh':'other';row.outsiderGoals[key]++;}}
  }
  records.push(row);
 }
 return records;
}
module.exports={inspect};
