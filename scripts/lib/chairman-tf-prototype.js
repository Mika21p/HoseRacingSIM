'use strict';
// Research-only scorer. No game loader imports this module.
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const median=a=>{const s=[...a].sort((x,y)=>x-y);return s.length?(s[(s.length-1)>>1]+s[s.length>>1])/2:null;};
function weightedMedian(rows){const s=[...rows].sort((a,b)=>a.value-b.value),half=s.reduce((v,r)=>v+r.weight,0)/2;let sum=0;for(const r of s){sum+=r.weight;if(sum>=half)return r.value;}return null;}
function prestigeBonus(race,winner){
  if(race.raceClass!=='g1'||!Number.isFinite(race.prestige)||race.prestige<85||!Number.isFinite(winner))return 0;
  const strength=.15+.15*clamp((race.prestige-85)/15,0,1);
  return Math.min(4,strength*Math.max(0,110-winner));
}
function createScorer(S,options={}){
  const base=options.base??85,history=new Map();
  function noviceWave(race,turn){
    if(!options.noviceVariation)return 0;
    const key=`novice-tf:1:${options.seed??0}:${turn}:${race.id}`;
    // Small, symmetric triangular variation; no game RNG consumption or
    // per-runner second roll. Existing margins already contain performance.
    return 4*(S.hash(key+':a')/4294967296+S.hash(key+':b')/4294967296-1);
  }
  function form(id,race,turn){
    if(options.durableReference){
      const compatible=p=> (p.surface===race.surface?1:.15)*(Math.abs(p.distance-race.distance)<=400?1:Math.abs(p.distance-race.distance)<=800?.4:.15);
      const candidates=(history.get(id)||[]).filter(p=>p.turn<turn).map(p=>({p,weight:Math.pow(2,-Math.min(120,turn-p.turn)/12)*compatible(p)})).sort((a,b)=>b.weight-a.weight).slice(0,5);
      if(!candidates.length)return null;
      const value=weightedMedian(candidates.map(({p,weight})=>({value:p.tf,weight}))),spread=median(candidates.map(({p})=>Math.abs(p.tf-value)));
      return {value,count:candidates.length,weight:Math.min(3,candidates.reduce((s,r)=>s+r.weight,0))/(1+spread/6),roots:[...new Set(candidates.flatMap(({p})=>p.roots||[]))],depth:Math.max(...candidates.map(({p})=>p.depth||0))};
    }
    const rows=(history.get(id)||[]).filter(p=>p.turn<turn&&p.turn>=turn-12&&p.surface===race.surface&&Math.abs(p.distance-race.distance)<=400).slice(-5);
    if(!rows.length)return null;
    const value=weightedMedian(rows.map(p=>({value:p.tf,weight:Math.pow(.85,turn-p.turn)})));
    const spread=median(rows.map(p=>Math.abs(p.tf-value)));
    return {value,count:rows.length,weight:Math.min(3,rows.length)/(1+spread/6),roots:[...new Set(rows.flatMap(p=>p.roots||[]))],depth:Math.max(...rows.map(p=>p.depth||0))};
  }
  function rate(race,results,turn){
    const field=results.filter(p=>!p.retired&&p.rank!=null).map(p=>({...p,d:S.deficit(p,race.distance),form:form(p.horseId,race,turn)}));
    if(!field.length)return {ratings:{},source:'no-finishers',confidence:'none',anchors:0};
    // Grossly beaten runners cannot be presumed to have reproduced their form.
    const anchors=field.filter(p=>p.form&&p.d<=25).map(p=>({value:p.form.value+p.d,weight:p.form.weight,id:p.horseId,form:p.form}));
    let winner,source,confidence,roots=[],depth=0;
    if(anchors.length){
      const fullSize=race.raceClass==='g1'&&race.prestige>=85?8:5;
      // With a sufficiently populated field, one heavily weighted history
      // cannot overrule two or more other runners on the initial center.
      let center=options.robustField&&field.length>=fullSize&&anchors.length>=3?median(anchors.map(p=>p.value)):weightedMedian(anchors);
      let accepted=anchors.filter(p=>Math.abs(p.value-center)<=8);
      // An even field may straddle a large gap: the arithmetic median need
      // not be an observed candidate. Fall back to an actual weighted anchor.
      if(!accepted.length){center=weightedMedian(anchors);accepted=anchors.filter(p=>Math.abs(p.value-center)<=8);}
      winner=accepted.reduce((s,p)=>s+p.value*p.weight,0)/accepted.reduce((s,p)=>s+p.weight,0);
      roots=[...new Set(accepted.flatMap(p=>p.form.roots))];depth=1+Math.max(...accepted.map(p=>p.form.depth));
      source='runner-consensus';
      confidence=accepted.length>=3&&accepted.reduce((s,p)=>s+p.weight,0)>=6?'consistent-relative':'provisional-relative';
    }else if(['new','maiden'].includes(race.raceClass)){
      // Winner prior, not a guarantee that the middle runner is worth 100.
      winner=base+clamp((median(field.map(p=>p.d))-8)*.25,-5,5)+noviceWave(race,turn);
      source='novice-prior';confidence='provisional-root';
      roots=[`${turn}:${race.id}`];
    }else return {ratings:{},source:'unrated-no-anchor',confidence:'none',anchors:0};
    if(!Number.isFinite(winner))throw new Error('TF prototype produced a non-finite winner rating');
    const bonus=options.softPrestige?prestigeBonus(race,winner):0;
    return {ratings:Object.fromEntries(field.map(p=>[p.horseId,S.integer(winner+bonus-p.d)])),rawRatings:Object.fromEntries(field.map(p=>[p.horseId,S.integer(winner-p.d)])),winnerRating:winner+bonus,rawWinnerRating:winner,prestigeBonus:bonus,source,confidence,anchors:anchors.length,roots,depth};
  }
  function record(race,results,turn,evaluation){
    // Prestige support changes this performance's published score, not the
    // evidence for the next race: it cannot compound through repeated starts.
    for(const p of results){const tf=(evaluation.rawRatings||evaluation.ratings)[p.horseId];if(tf==null||p.retired)continue;const old=history.get(p.horseId)||[];
      history.set(p.horseId,[...(options.durableReference?old:old.filter(r=>r.turn>=turn-12)),{turn,tf,surface:race.surface,distance:race.distance,roots:evaluation.roots||[],depth:evaluation.depth||0}].slice(-12));}
  }
  // Called after the race, using pre-race qualification. This is a labelled
  // novice assessment, never an invented past win or an anchor for this race.
  function settleDebut(race,results,turn,noviceIds){
    const missing=results.filter(p=>noviceIds.has(p.horseId)&&!p.retired&&p.rank!=null&&!history.has(p.horseId));
    if(!missing.length)return {count:0,ratings:{}};
    const best=Math.min(...missing.map(p=>S.deficit(p,race.distance))),ds=missing.map(p=>S.deficit(p,race.distance)-best);
    const winner=base+clamp((median(ds)-8)*.25,-5,5)+noviceWave(race,turn),ratings={};
    for(let i=0;i<missing.length;i++){
      const p=missing[i],tf=S.integer(winner-ds[i]);ratings[p.horseId]=tf;
      history.set(p.horseId,[{turn,tf,surface:race.surface,distance:race.distance,roots:[`debut-assessment:${turn}:${race.id}`],depth:0}]);
    }
    return {count:missing.length,ratings};
  }
  return {rate,record,form,history,settleDebut};
}
module.exports={createScorer,median,prestigeBonus};
