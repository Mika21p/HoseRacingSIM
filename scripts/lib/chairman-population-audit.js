'use strict';
const A=require('./chairman-scheduling-audit');
const BASE={japan:1000,usa:752,britain:340,france:300,ireland:196,germany:100,italy:100};
const SCENARIOS={japan:['japan'],usa:['usa'],europe:['britain','france','ireland','germany','italy'],combined:Object.keys(BASE),
 britain:['britain'],france:['france'],ireland:['ireland'],germany:['germany'],italy:['italy'],japanUs:['japan','usa']};
function population(keys,factor,annualRatio=.25){return {population:Object.fromEntries(keys.map(k=>[k,Math.ceil(BASE[k]*factor)])),annualTargets:Object.fromEntries(keys.map(k=>[k,Math.ceil(Math.ceil(BASE[k]*factor)*annualRatio)]))};}
function structure(n,w){return w.regions.map(r=>{const horses=w.horses.filter(h=>h.homeRegionId===r.id&&h.status==='active'),groups={age:{},sex:{},qualification:{}};for(const h of horses)for(const [key,value] of [['age',n.ChairmanRules.ageOf(w,h)],['sex',h.gender],['qualification',h.qualification]])groups[key][value]=(groups[key][value]||0)+1;return {id:r.id,name:r.name,initial:r.initialCount,annual:r.annualTarget,active:horses.length,generation:r.generation,...groups};});}
function annual(n,w){const y=n.ChairmanRules.date(w.turn).year;return {year:y,turns:0,performances:0,overseasStarts:0,crossGroupStarts:0,targetDue:0,targetStarted:0,recordsBytes:0,violations:[],events:[],shortFields:[],regions:Object.fromEntries(w.regions.map(r=>[r.id,{name:r.name,scheduled:0,completed:0,graded:0,gradedSix:0,highG1:0,highG1Eight:0}])),expected:w.races.filter(r=>!r.support&&!r.deleted&&y>=(r.notBeforeYear||1)).map(r=>r.id)};}
function shortage(n,w,r,count,required){
 const W=n.ChairmanRules,V=n.ChairmanWorld;let eligible=0,available=0,committedElsewhere=0,targetProtected=0,unbooked=0,injured=0,transport=0,interval=0;
 for(const h of w.horses){if(h.status!=='active'||!W.eligible(w,{...h,restUntil:0},r,w.turn))continue;eligible++;
   if(h.restUntil>w.turn)injured++;if(h.lastRaceTurn!=null&&w.turn-h.lastRaceTurn<3)interval++;
   const path=V.route(w,h,r,w.turn);if(!path.reachable||h.transit?.kind==='return'){transport+=!path.reachable&&w.turn<Math.max(w.turn,h.transit?.arrivalTurn||0)+path.duration||h.transit?.kind==='return'?1:0;continue;}
   available++;if(!h.booked)unbooked++;else if(h.booked.raceId!==r.id||h.booked.turn!==w.turn)committedElsewhere++;
   if(h.target&&h.target.raceId!==r.id&&h.target.turn>w.turn&&h.target.turn-w.turn<3)targetProtected++;
 }
 const primary=eligible<required?'qualification-age-sex-pool':available<required?'rest-interval-transport':committedElsewhere>=available-required+1?'competing-commitments':'public-route-target-or-allocation';
 return {count,required,eligible,available,committedElsewhere,targetProtected,unbooked,injured,transport,interval,primary};
}
function record(n,before,out,m){
 const W=n.ChairmanRules,V=n.ChairmanWorld,old=new Map(before.horses.map(h=>[h.id,h])),next=new Map(out.world.horses.map(h=>[h.id,h]));m.turns++;
 const groups=new Map(before.regions.map(r=>[r.id,r.trafficGroup])),seen=new Set(),starts=new Map();
 for(const p of out.performances){const h=old.get(p.horseId);m.performances++;m.overseasStarts+=p.regionId!==p.homeRegionId?1:0;m.crossGroupStarts+=groups.get(p.regionId)!==groups.get(p.homeRegionId)?1:0;starts.set(h?.id,p.raceId);
  for(const [bad,type] of [[seen.has(p.horseId),'duplicate'],[!h,'missing-horse'],[h?.restUntil>before.turn,'injury'],[h?.lastRaceTurn!=null&&before.turn-h.lastRaceTurn<3,'interval'],[h?.transit?.arrivalTurn>before.turn,'transport']])if(bad)m.violations.push({turn:before.turn,type,horseId:p.horseId});seen.add(p.horseId);
 }
 for(const h of before.horses){if(h.target?.turn===before.turn){m.targetDue++;if(starts.get(h.id)===h.target.raceId)m.targetStarted++;}
   const b=h.booked,x=next.get(h.id);if(b&&b.turn>before.turn&&b.turn>=out.world.turn&&x?.status==='active'&&(x.restUntil||0)<=b.turn&&(before.lockedRaces?.[`${W.date(b.turn).year}:${b.raceId}`]||b.preparationTurn!=null&&b.preparationTurn<=before.turn)&&JSON.stringify(b)!==JSON.stringify(x.booked))m.violations.push({turn:before.turn,type:'locked-booking',horseId:h.id});
 }
 for(const e of out.occurrences){const r=e.race;if(e.count>r.capacity)m.violations.push({turn:before.turn,type:'capacity',raceId:r.id});
   for(const p of out.performances.filter(p=>p.occurrenceId===e.id))if(!old.get(p.horseId)||!W.eligible(before,old.get(p.horseId),r,before.turn))m.violations.push({turn:before.turn,type:'eligibility',horseId:p.horseId});
   if(r.support)continue;const row=m.regions[r.regionId],high=r.raceClass==='g1'&&n.ChairmanPrestige.value(r)>=85;row.scheduled++;row.completed+=e.status==='completed'?1:0;if(V.graded(r)){row.graded++;row.gradedSix+=e.count>=6?1:0;}if(high){row.highG1++;row.highG1Eight+=e.count>=8?1:0;}
   const required=high?8:V.graded(r)?6:2,record={raceId:r.id,name:r.name,regionId:r.regionId,turn:before.turn,raceClass:r.raceClass,prestige:n.ChairmanPrestige.value(r),surface:r.surface,distance:r.distance,ageRule:r.ageRule,sexRule:r.sexRule,count:e.count,status:e.status};m.events.push(record);
   if(e.count<required)m.shortFields.push({...record,...shortage(n,before,r,e.count,required)});
 }
 m.recordsBytes+=Buffer.byteLength(JSON.stringify(Object.fromEntries(Object.entries(out).filter(([k])=>k!=='world'))));
}
function verdict(m){const reasons=[];for(const [id,r] of Object.entries(m.regions)){
 for(const [metric,num,den,target] of [['completion',r.completed,r.scheduled,.95],['gradedSix',r.gradedSix,r.graded,.9],['highG1Eight',r.highG1Eight,r.highG1,.9]])if(den&&num/den<target)reasons.push({regionId:id,name:r.name,metric,numerator:num,denominator:den,target});
 }const seen=new Set(m.events.map(e=>e.raceId));for(const id of m.expected||[])if(!seen.has(id))reasons.push({metric:'missing-calendar-occurrence',raceId:id});if(m.violations.length)reasons.push({metric:'rules',count:m.violations.length});return {passed:reasons.length===0,reasons};}
module.exports={BASE,SCENARIOS,population,structure,annual,record,shortage,verdict,distribution:A.distribution};
