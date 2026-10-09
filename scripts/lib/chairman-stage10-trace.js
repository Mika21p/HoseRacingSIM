'use strict';
function attach(project,source,enabled){
 const result={blocked:0,heldLower:0,farHeldLower:0,examples:[]},vm=require('vm');
 if(enabled){const marker='p.target=target;setTarget(p.h,target,p.role);';if(!source.includes(marker))throw Error('Trace marker missing');
 source=source.replace(marker,`if(emit){const best=p.allChoices.reduce((a,c)=>!a||c.targetUtility>a.targetUtility?c:a,null);if(best&&best.race.raceClass==='g1'&&ns.ChairmanPrestige.value(best.race)>=85&&!targets.includes(best)&&(!target||best.targetUtility>target.targetUtility)){
 const remaining=pending.slice(pending.indexOf(p)+1),held=remaining.filter(q=>heldTargets.get(q.h.id)===best.key).map(q=>({id:q.h.id,rating:W().entryRating(q.h),target:q.oldTarget,booking:q.old}));
 emit('blocked-goal',{horseId:p.h.id,rating:W().entryRating(p.h),raceId:best.race.id,race:best.race.name,turn:best.turn,utility:best.targetUtility,replacement:target?{raceId:target.race.id,race:target.race.name,turn:target.turn,utility:target.targetUtility}:null,reserved:reserved.get(best.key)||0,occupied:occupied(best.key),capacity:best.race.capacity,held,accepted:(accepted.get(best.key)||[]).map(h=>({id:h.id,rating:W().entryRating(h)}))});}}
 ${marker}`);}
 vm.runInContext(source,project.context);
 const V=project.rules.ChairmanWorld,original=V.plan;
 const factory=w=>d=>{if(d.type!=='blocked-goal')return;result.blocked++;const lower=d.rating!=null?d.held.filter(h=>h.rating!=null&&h.rating<=d.rating-10):[];
 if(lower.length){result.heldLower++;if(d.turn>=w.turn+6)result.farHeldLower++;}
 if(lower.length&&result.examples.length<30)result.examples.push({planTurn:w.turn,...d});};
 if(enabled)V.plan=function(w,observer){const sink=factory(w);return original(w,d=>{sink(d);if(observer)observer(d);});};
 return {result,factory:enabled?factory:undefined,track(){},record(){}};
}
module.exports={attach};
