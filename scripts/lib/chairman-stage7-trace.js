'use strict';
function attach(n,enabled){
 const W=n.ChairmanRules,V=n.ChairmanWorld,original=V.plan,result={reasons:{},examples:{},trajectories:[]},tracked=new Set(),turns=new Set([1,2,3,24,25,26,30,40]);
 if(enabled)V.plan=function(w,observer){
  if(!turns.has(w.turn))return original(w,observer);
  const horses=new Map(),candidates=new Map(),events=new Map();
  return original(w,d=>{
   if(observer)observer(d);
   if(d.type==='start')for(const e of d.events)events.set(e.key,e);
   if(d.type==='horse')horses.set(d.horseId,d);
   if(d.type==='candidates')candidates.set(d.horseId,d);
   if(d.type!=='allocation')return;
   const h=horses.get(d.horseId),b=h?.previousBooking,c=candidates.get(d.horseId);if(!b||b.turn<w.turn)return;
   const old=W.date(b.turn).year+':'+b.raceId;if(old===d.selected)return;
   const choice=c.choices.find(x=>x.key===old),option=d.options.find(x=>x.key===old),next=d.options.find(x=>x.key===d.selected);
   const reason=!c.eligibleKeys.includes(old)?'eligibility-or-calendar':c.rejected.find(x=>x.key===old)?.reasons.join('+')||choice?.bookingBlocked||(option?.occupied>=option?.capacity?'capacity':option&&next&&next.utility-option.utility>1?'utility-gain':'other');
   result.reasons[reason]=(result.reasons[reason]||0)+1;const rows=result.examples[reason]||=[];
   if(rows.length<12)rows.push({turn:w.turn,horseId:d.horseId,oldRace:events.get(old)?.race.name,oldTurn:b.turn,newRace:events.get(d.selected)?.race.name,newTurn:events.get(d.selected)?.turn,oldTarget:h.previousTarget,newTarget:c.target,oldUtility:option?.utility,newUtility:next?.utility,occupied:option?.occupied,capacity:option?.capacity});
  });
 };
 return {result,track(w){if(!enabled)return;for(let i=0;i<8;i++)tracked.add(w.horses[Math.floor(i*w.horses.length/8)]?.id);},record(w){if(!enabled)return;for(const h of w.horses)if(tracked.has(h.id))result.trajectories.push(JSON.parse(JSON.stringify({turn:w.turn,id:h.id,name:h.name,status:h.status,qualification:h.qualification,lastRace:h.lastRaceTurn,target:h.target,booked:h.booked,reason:h.scheduleReason,restUntil:h.restUntil})));}};
}
module.exports={attach};
