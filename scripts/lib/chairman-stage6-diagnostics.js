'use strict';
function shortage(n,w,r,count){
 const W=n.ChairmanRules,V=n.ChairmanWorld,required=r.raceClass==='g1'&&n.ChairmanPrestige.value(r)>=85?8:5;
 const pool={active:0,developmentBlocked:0,legal:0,qualifiedLocal:0,reachable:0,localReachable:0,injury:0,interval:0,developmentInterval:0,transport:0,elsewhere:0,supportElsewhere:0,sameTurnElsewhere:0,unbooked:0,targetNearby:0};
 const destinations={};
 for(const h of w.horses){if(h.status!=='active')continue;pool.active++;
  if(!W.eligible(w,{...h,restUntil:0},r,w.turn))continue;pool.legal++;if(n.ChairmanDevelopment.enabled(w)&&(h.qualification??0)===0){pool.developmentBlocked++;continue;}if(h.homeRegionId===r.regionId)pool.qualifiedLocal++;
  if(h.restUntil>w.turn){pool.injury++;continue;}
  if(w.turn-(h.lastRaceTurn??-3)<3){pool.interval++;continue;}
  if(w.turn-(h.development?.lastTurn??-3)<3){pool.developmentInterval++;continue;}
  if(!V.route(w,h,r,w.turn).reachable||h.transit?.kind==='return'){pool.transport++;continue;}
  pool.reachable++;if(h.homeRegionId===r.regionId)pool.localReachable++;
  if(!h.booked)pool.unbooked++;
  else if(h.booked.raceId!==r.id||h.booked.turn!==w.turn){pool.elsewhere++;const dest=w.races.find(x=>x.id===h.booked.raceId);pool.supportElsewhere+=dest?.support?1:0;pool.sameTurnElsewhere+=h.booked.turn===w.turn?1:0;const key=dest?.support?'support':dest?.raceClass||'unknown';destinations[key]=(destinations[key]||0)+1;}
  if(h.target&&h.target.raceId!==r.id&&Math.abs(h.target.turn-w.turn)<3)pool.targetNearby++;
 }
 const primary=pool.qualifiedLocal<required?'local-qualification-age-sex':pool.localReachable<required?'local-rest-interval-transport':pool.elsewhere>=pool.reachable-required+1?'competing-commitments':'route-target-allocation';
 return {id:r.id,name:r.name,region:r.regionId,turn:w.turn,raceClass:r.raceClass,prestige:n.ChairmanPrestige.value(r),ageRule:r.ageRule,sexRule:r.sexRule,surface:r.surface,distance:r.distance,count,required,primary,pool,destinations};
}
module.exports={shortage};
