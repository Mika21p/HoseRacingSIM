(function () {
  'use strict';
  const ns=window.Keiba, R=ns.Random, B=()=>ns.ChairmanBreeding, W=()=>ns.ChairmanRules;
  const copy=x=>JSON.parse(JSON.stringify(x)), year=w=>W().date(w.turn).year;
  const caches=new WeakMap(), evaluations=new WeakMap();
  const hash=s=>{let v=2166136261;for(const c of String(s))v=Math.imul(v^c.charCodeAt(0),16777619)>>>0;return v;};
  let catalog;
  const assigned=id=>(catalog||=new Map((ns.BloodlineCatalog?.assignments||[]).map(a=>[a.id,a.genetics]))).get(id);
  function invalidate(w){caches.delete(w);evaluations.delete(w);}
  function setValues(w,h,quality,stability){
    for(const v of [quality,stability])if(v!=null&&(!Number.isInteger(v)||v<1||v>100))throw Error('繁殖素质与稳定度须为1～100整数。');
    h.genetics||={};if(quality!=null){h.genetics.quality=quality;if(h.breeding)h.breeding.strength=quality;}if(stability!=null)h.genetics.stability=stability;
    invalidate(w);
  }
  function factors(h){return Object.entries(h.trackAptitudes||{}).filter(([,v])=>v==='◎'||v==='○').sort((a,b)=>(a[1]==='◎'?-1:1)-(b[1]==='◎'?-1:1)).slice(0,2).map(([trait])=>({trait,power:1}));}
  function initialize(w,h,{migration=false}={}){
    if(!w.breeding)return;
    const source=assigned(h.templateId), old=h.genetics||{}, ancestor=!h.breeding&&h.status==='ancestor';
    const f=h.fatherId?B().get(w,h.fatherId):null,m=h.motherId?B().get(w,h.motherId):null;
    h.genetics={...copy(source||{}),...old};
    h.genetics.lineId=source?.lineId??old.lineId??f?.genetics?.lineId??(!h.fatherId&&!h.templateId&&!ancestor?'fictional:'+h.id:null);
    h.genetics.familyId=source?.familyId??old.familyId??m?.genetics?.familyId??(!h.motherId&&!ancestor?'known-maternal-'+h.id:null);
    h.genetics.factors=copy(old.factors??source?.factors??(ancestor?[]:factors(h)));
    if(!ancestor){
      const q=old.quality??(migration?h.breeding?.strength:null)??source?.quality??h.breedingStrength??(50+R.rollMulti(2,26)-27);
      const s=old.stability??h.breedingStability??(migration?40+hash(w.seed+':stability:'+h.id)%41:source?.stability??(60+R.rollMulti(2,21)-22));
      setValues(w,h,q,s);
    }
    invalidate(w);
  }
  function applyTemplate(w,h,t){
    const g=assigned(t.id), patch=w.templateOverrides?.find(p=>p.id===t.id)?.patch?.game||{};
    if(t.source==='hall'&&t.game?.genetics){
      const data=t.game, genetics=copy(data.genetics);h.genetics=genetics;
      setValues(w,h,genetics.quality??data.breedingBase??50,genetics.stability??50);
      h.surfaceGrades=copy(data.surfaceGrades||genetics.surfaceGrades||{});h.trackAptitudes=copy(data.trackAptitudes||genetics.trackAptitudes||{});
      const distance=data.distance||genetics.distance||{min:1800,core:2000,max:2200};
      Object.assign(h,{distMin:distance.min,coreDist:distance.core,distMax:distance.max,growthType:data.growthType||genetics.growthType||h.growthType,
        temperamentLabel:data.temperamentLabel||genetics.temperamentLabel||h.temperamentLabel,heavyType:data.heavyType||genetics.heavyType||h.heavyType});
      h.surfacePref=ns.HorseRules.deriveSurfacePreference(h.surfaceGrades);h.distType=W().category(h.coreDist);h.temperament=ns.HorseRules.temperamentValue(h.temperamentLabel);
      const peak=ns.HorseRules.generatePeak(h.growthType);h.peakStart=peak.start;h.peakEnd=peak.end;
    }else if(g){
      h.genetics=copy(g);setValues(w,h,patch.breedingBase??g.quality,g.stability);
      h.surfaceGrades=copy(g.surfaceGrades);h.trackAptitudes=copy(g.trackAptitudes);
      Object.assign(h,{distMin:g.distance.min,coreDist:g.distance.core,distMax:g.distance.max,growthType:g.growthType,temperamentLabel:g.temperamentLabel,heavyType:g.heavyType});
      if(patch.distance!=null){h.coreDist=patch.distance;h.distMin=Math.max(1,patch.distance-400);h.distMax=patch.distance+400;}
      if(patch.surface)h.surfaceGrades[patch.surface==='泥地'?'dirt':'grass']='A';
      if(patch.growthType)h.growthType=patch.growthType;
      h.surfacePref=ns.HorseRules.deriveSurfacePreference(h.surfaceGrades);h.distType=W().category(h.coreDist);h.temperament=ns.HorseRules.temperamentValue(h.temperamentLabel);
      const peak=ns.HorseRules.generatePeak(h.growthType);h.peakStart=peak.start;h.peakEnd=peak.end;
    }else setValues(w,h,t.game?.breedingBase??h.genetics.quality,h.genetics.stability);
    invalidate(w);
  }
  function upgrade(w){
    if(!w.breeding||w.breeding.version>=2)return false;
    const rows=B().all(w),done=new Set(),byId=new Map(rows.map(h=>[h.id,h]));
    function visit(h){if(done.has(h.id))return;done.add(h.id);for(const id of [h.fatherId,h.motherId])if(byId.has(id))visit(byId.get(id));initialize(w,h,{migration:true});}
    rows.forEach(visit);w.breeding.version=2;w.breeding.upgradedYear=year(w);w.breeding.ruleVersion=ns.BloodlineSystem.VERSION;
    w.breeding.upgradeNotices=[];
    w.breeding.manual=w.breeding.manual.filter(p=>{try{B().legalPair(w,p.fatherId,p.motherId);return true;}catch(e){w.breeding.upgradeNotices.push({fatherId:p.fatherId,motherId:p.motherId,reason:e.message});return false;}});
    return true;
  }
  function record(h){
    const g=copy(h.genetics||{});
    // Actual world traits can be edited independently of their original catalog preset.
    for(const key of ['surfaceGrades','trackAptitudes','growthType','temperamentLabel','heavyType'])if(h[key]!=null)g[key]=copy(h[key]);
    if(h.coreDist!=null)g.distance={min:R.clamp(h.distMin,1000,4200),core:R.clamp(h.coreDist,1000,4200),max:R.clamp(h.distMax,1000,4200)};
    return {id:h.id,name:h.name,gender:h.gender,fatherId:h.fatherId||null,motherId:h.motherId||null,genetics:g};
  }
  function context(w){
    let c=caches.get(w);const length=w.horses.length+(w.pedigrees?.length||0);
    if(c&&c.revision===w.revision&&c.length===length)return c;
    const rows=B().all(w),library=ns.BloodlineSystem.createLibrary(rows.map(record),ns.BloodlineCatalog.nicks);
    c={revision:w.revision,length,library,byId:new Map(rows.map(h=>[h.id,h])),pairs:new Map()};caches.set(w,c);return c;
  }
  function pair(w,f,m){const c=context(w),key=f+'|'+m;let p=c.pairs.get(key);if(!p){p=ns.BloodlineSystem.createPair(c.library,f,m,'chairman');if(c.pairs.size>=2000)c.pairs.delete(c.pairs.keys().next().value);c.pairs.set(key,p);}return p;}
  function inherited(w,f,m,region){
    const p=pair(w,f.id,m.id),h=p.generate({regionalProfile:w.worldSystemVersion===2?ns.ChairmanWorld.profile(w,region||m.homeRegion):undefined});
    const lines=new Map(ns.BloodlineCatalog.lines.map(l=>[l.id,l.label]));
    const nodes=new Map(),library=context(w).library;
    for(const a of h.pedigree.ancestors)if(a.id&&!nodes.has(a.id))nodes.set(a.id,{id:a.id,name:a.name,lineId:a.lineId,lineLabel:lines.get(a.lineId)||(a.lineId?.startsWith('fictional:')?'架空家系':'未知'),factors:copy(library.get(a.id)?.genetics.factors||[])});
    // Slot paths keep repeated ancestors in their correct positions; each known
    // ancestor's display facts are stored once, with no recursive birth snapshots.
    h.pedigree={format:2,ruleVersion:h.pedigree.ruleVersion,mode:'chairman',fatherId:f.id,motherId:m.id,
      ancestors:h.pedigree.ancestors.map(a=>({path:a.path,id:a.id})),nodes:[...nodes.values()],
      theories:p.preview.theories.map(t=>({id:t.id,label:t.label,ids:copy(t.ids)})),risk:copy(p.preview.risk)};
    for(const key of ['id','name','career','gender','gameMode'])delete h[key];return h;
  }
  const frozenSnapshots=new WeakSet();
  function immutableSnapshot(value){if(value&&typeof value==='object'&&!frozenSnapshots.has(value)){Object.values(value).forEach(immutableSnapshot);Object.freeze(value);frozenSnapshots.add(value);}return value;}
  function cloneForMutation(world){
    const snapshots=new Map();
    const horses=world.horses.map(h=>{if(h.pedigree?.mode!=='chairman')return h;snapshots.set(h.id,immutableSnapshot(h.pedigree));const row={...h};delete row.pedigree;return row;});
    const cloned=copy({...world,horses});for(const h of cloned.horses)if(snapshots.has(h.id))h.pedigree=snapshots.get(h.id);return cloned;
  }
  function percentile(sorted,value){
    if(!Number.isFinite(value)||!sorted.length)return 50;
    const bound=upper=>{let lo=0,hi=sorted.length;while(lo<hi){const mid=(lo+hi)>>1;if(sorted[mid]<value||upper&&sorted[mid]===value)lo=mid+1;else hi=mid;}return lo;};
    return 50*(bound(false)+bound(true))/sorted.length;
  }
  function evaluate(w){
    let cached=evaluations.get(w);if(cached&&cached.revision===w.revision)return cached.values;
    const rows=B().all(w),horses=w.horses.filter(h=>h.lifetime.starts),children=new Map();
    const top=h=>Math.max(h.breeding?.bestEvaluation??h.breeding?.bestWtr??-Infinity,W().rating(h)??(h.annual.tf==null?-Infinity:h.annual.tf-5),h.previousWtr??(h.previousTf==null?-Infinity:h.previousTf-5));
    const ratings=horses.map(top).filter(Number.isFinite).sort((a,b)=>a-b),g1=horses.map(h=>h.lifetime.g1).sort((a,b)=>a-b),prizes=horses.map(h=>h.lifetime.prize).sort((a,b)=>a-b);
    for(const h of w.horses)for(const id of new Set([h.fatherId,h.motherId].filter(Boolean))){if(!children.has(id))children.set(id,[]);children.get(id).push(h);}
    const values=new Map();
    for(const h of rows.filter(h=>h.breeding)){
      const kids=children.get(h.id)||[],starters=kids.filter(k=>k.lifetime.starts),n=starters.length;
      const own=h.lifetime?.starts?(percentile(ratings,top(h))+percentile(g1,h.lifetime.g1)+percentile(prizes,h.lifetime.prize))/3:50;
      const ranks=starters.map(k=>percentile(ratings,top(k))).sort((a,b)=>a-b);
      const offspring=n ? .7*ranks.reduce((a,b)=>a+b,0)/n+30*starters.filter(k=>k.lifetime.wins).length/n:50;
      const score=own*10/(n+10)+offspring*n/(n+10),a=h.gender==='牝马'?3:5,b=h.gender==='牝马'?6:15;
      const iqr=n>=8?ranks[Math.floor((n-1)*.75)]-ranks[Math.floor((n-1)*.25)]:null;
      values.set(h.id,{score,grade:n?B().grade(score):'尚待子代验证',starters:n,unraced:kids.length-n,confidence:!n?'尚待子代验证':n<a?'样本不足':n<b?'初步参考':'较有依据',consistency:iqr==null?'样本不足':iqr<=20?'较集中':iqr<=40?'存在差异':'差异较大'});
    }
    evaluations.set(w,{revision:w.revision,values});return values;
  }
  function publicEvaluation(w,h){const v=evaluate(w).get(h.id);const old=w.breeding?.publicBaseline?.[h.id];const trend=!old?'暂无年度对照':!v||Math.abs(v.score-old.score)<1?'大致持平':v.score>old.score?'较上年上升':'较上年下降';return v?{...v,trend}: {trend,score:50,grade:'尚待子代验证',starters:0,unraced:0,confidence:'尚待子代验证',consistency:'样本不足'};}
  function publicPair(w,f,m){
    const p=pair(w,f,m).preview,notes={nick:'母父配合良好',specialization:'祖系支持同一专精',complement:'双方祖系形成互补',diversity:'祖系来源多样',ancestor:'共同祖先特色强化',factor:'存在祖先特征传递'};
    return {legal:p.legal,reason:p.blockedReason,risk:copy(p.risk),notes:p.theories.map(t=>notes[t.id]).filter(Boolean),sourceIds:[...new Set(p.theories.flatMap(t=>t.ids))],father:publicEvaluation(w,context(w).byId.get(f)),mother:publicEvaluation(w,context(w).byId.get(m))};
  }
  function publicSurface(w,h){
    const observations=Object.entries(h.observations||{}).filter(([,v])=>v?.count>0);
    if(observations.length){const sums={草地:0,泥地:0};for(const [key,v]of observations)for(const s of Object.keys(sums))if(key.split('|')[1]===s)sums[s]+=v.count;return sums.草地===sums.泥地?null:sums.草地>sums.泥地?'草地':'泥地';}
    const g=assigned(h.templateId)?.surfaceGrades;if(g&&g.grass!==g.dirt)return g.grass==='A'?'草地':g.dirt==='A'?'泥地':null;return null;
  }
  function plan(w){return B().seeded(w,()=>{
    const result=[],occupied=new Set(),q=B().quotas(w),ev=evaluate(w),usage=new Map(),recent=new Map();
    w.breeding.planNotices=[];
    for(const h of w.horses.filter(h=>h.sourceKind==='bred'&&h.birthYear>year(w)-5&&h.birthYear<=year(w))){const line=h.genetics?.lineId;if(!recent.has(h.homeRegion))recent.set(h.homeRegion,{total:0,lines:new Map()});const r=recent.get(h.homeRegion);r.total++;if(line)r.lines.set(line,(r.lines.get(line)||0)+1);}
    const use=(f,r)=>usage.get(f+'|'+r)||0;
    const add=p=>{result.push(p);occupied.add(p.motherId);usage.set(p.fatherId+'|'+p.homeRegion,use(p.fatherId,p.homeRegion)+1);};
    for(const p of w.breeding.manual){B().legalPair(w,p.fatherId,p.motherId);if(occupied.has(p.motherId))throw Error('同母同年只能配种一次。');if(!W().regionNames(w).includes(p.homeRegion))throw Error('幼驹地区不存在。');add({...p,manual:true});}
    const supplement=(region,gender,reason)=>{const h=B().founder(w,region,gender);w.breeding.planNotices.push({id:h.id,name:h.name,region,gender,reason});return h;};
    for(const [region,target]of Object.entries(q)){
      const mares=B().all(w).filter(h=>h.gender==='牝马'&&h.homeRegion===region&&h.breeding?.status==='active'&&B().available(w,h)&&!occupied.has(h.id));
      const cap=Math.max(1,Math.floor(target*.2));
      const need=Math.max(0,target-result.filter(p=>p.homeRegion===region).length);
      while(mares.length<need)mares.push(supplement(region,'牝马','可用母马不足'));
      let capacity=B().all(w).filter(h=>h.gender==='牡马'&&h.breeding?.status==='active'&&B().available(w,h)).reduce((sum,h)=>sum+Math.max(0,cap-use(h.id,region)),0);
      while(capacity<need){supplement(region,'牡马','父马年度可用配种额度不足');capacity+=cap;}
      const raceCounts={草地:0,泥地:0};for(const race of w.races.filter(r=>!r.deleted)){const track=w.tracks.find(t=>t.id===race.trackId);if((race.homeRegion||track?.homeRegion||track?.region)===region&&raceCounts[race.surface]!=null)raceCounts[race.surface]++;}
      const preferredSurface=raceCounts.草地===raceCounts.泥地?null:raceCounts.草地>raceCounts.泥地?'草地':'泥地';
      while(result.filter(p=>p.homeRegion===region).length<target){
        const m=mares.length?(R.next()<.6?R.weightedPick(mares,h=>1+(ev.get(h.id)?.score??50)/25):R.pickOne(mares)):supplement(region,'牝马','可用母马不足');
        if(mares.includes(m))mares.splice(mares.indexOf(m),1);
        let sires=B().all(w).filter(h=>h.gender==='牡马'&&h.breeding?.status==='active'&&B().available(w,h)&&use(h.id,region)<cap);
        const library=context(w).library;sires=sires.filter(f=>ns.BloodlineSystem.checkPair(library,f.id,m.id).legal);
        if(!sires.length)sires=[supplement(region,'牡马','没有未达使用上限的合法父马')];
        const local=sires.filter(f=>f.homeRegion===region),foreign=sires.filter(f=>f.homeRegion!==region),preferred=R.next()<.8?local:foreign,pool=preferred.length?preferred:sires;
        const baseWeight=f=>{
          let v=1+(ev.get(f.id)?.score??50)/25;
          if((ev.get(f.id)?.starters??0)<5)v*=1.25;const line=f.genetics?.lineId,r=recent.get(region);
          if(line&&(!r?.total||(r.lines.get(line)||0)/r.total<.05))v*=1.15;
          if(preferredSurface&&publicSurface(w,f)===preferredSurface)v*=1.15;return v;
        };
        const weights=new Map(pool.map(f=>[f.id,baseWeight(f)]));let f;
        if(R.next()<.2)f=R.pickOne(pool);
        else {
          // Rejection sampling gives exactly the specified product weights, without
          // constructing full factor/theory previews for every sire on every mare.
          const bound=1.25*1.15*1.1;
          do {f=R.weightedPick(pool,h=>weights.get(h.id));const p=pair(w,f.id,m.id).preview,ids=new Set(p.theories.map(t=>t.id));let v=1;
            if(ids.has('nick'))v*=1.25;if(ids.has('specialization')||ids.has('complement'))v*=1.15;if(ids.has('diversity'))v*=1.1;
            v*=({高:.35,中:.65,低:.85})[p.risk.level]||1;if(R.next()<v/bound)break;
          }while(true);
        }
        add({fatherId:f.id,motherId:m.id,homeRegion:region,owner:m.owner,manual:false});
      }
    }return result;
  });}
  function familyStats(w,selectedYear){
    const rows=B().all(w),byId=new Map(rows.map(h=>[h.id,h])),maternal=new Map(),broodmares=new Map();
    const root=h=>{const seen=new Set();while(h.motherId&&byId.has(h.motherId)&&!seen.has(h.id)){seen.add(h.id);h=byId.get(h.motherId);}return h;};
    function add(map,id,name,h,v){if(!map.has(id))map.set(id,{id,name,starters:0,winners:0,g1:0,prize:0,representatives:[]});const s=map.get(id);s.starters++;s.winners+=v.wins>0?1:0;s.g1+=v.g1;s.prize+=v.prize;s.representatives.push({id:h.id,name:h.name,g1:v.g1,prize:v.prize});}
    for(const h of w.horses){const v=selectedYear==null?h.lifetime:h.annual;if(!v?.starts)continue;const m=byId.get(h.motherId),mf=byId.get(m?.fatherId);if(mf)add(broodmares,mf.id,mf.name,h,v);const r=root(h);add(maternal,r.id,r.name,h,v);}
    const groups=new Map();for(const h of rows){const id=root(h).id;if(!groups.has(id))groups.set(id,[]);groups.get(id).push(h);}
    for(const [id,members]of groups){if(!maternal.has(id))maternal.set(id,{id,name:byId.get(id).name,starters:0,winners:0,g1:0,prize:0,representatives:[]});const s=maternal.get(id);s.members=members.length;s.breedingDaughters=members.filter(h=>h.gender==='牝马'&&h.breeding?.everActive).length;s.label='已知母链起点';s.generations=Math.max(0,...members.map(h=>{let g=0;while(h.motherId&&byId.has(h.motherId)){g++;h=byId.get(h.motherId);}return g;}));}
    for(const map of [maternal,broodmares])for(const s of map.values())s.representatives=s.representatives.sort((a,b)=>b.g1-a.g1||b.prize-a.prize||a.id.localeCompare(b.id)).slice(0,5);
    const sort=map=>[...map.values()].sort((a,b)=>b.prize-a.prize||a.id.localeCompare(b.id));return {broodmareSires:sort(broodmares),maternalFamilies:sort(maternal)};
  }
  function report(w,pairs){
    const ev=evaluate(w),previous=w.breeding.publicBaseline||{},current={},first=[],rising=[];
    const established=new Set();for(const h of w.horses)if(h.lifetime.starts>(h.annual.starts||0))for(const id of [h.fatherId,h.motherId])if(id)established.add(id);
    for(const [id,v]of ev){current[id]={score:v.score,starters:v.starters};const h=context(w).byId.get(id),old=previous[id];if(h.gender==='牡马'&&v.starters>0&&(!old||!old.starters)&&!established.has(id))first.push({id,name:h.name,...v});if(h.gender==='牡马'&&old&&v.starters-old.starters>=3&&v.score>old.score)rising.push({id,name:h.name,gain:v.score-old.score,newStarters:v.starters-old.starters});}
    w.breeding.publicBaseline=current;
    const lines=new Map();for(const p of pairs){const h=B().get(w,p.fatherId),id=h.genetics?.lineId||null,key=id||'unknown';if(!lines.has(key))lines.set(key,{id,kind:!id?'unknown':id.startsWith('fictional:')?'fictional':'historical',count:0});lines.get(key).count++;}
    const recent=new Map();let recentTotal=0;for(const h of w.horses)if(h.sourceKind==='bred'&&h.birthYear>year(w)-5&&h.birthYear<=year(w)){recentTotal++;const id=h.genetics?.lineId;if(id)recent.set(id,(recent.get(id)||0)+1);}
    const rareLines=[...lines.values()].filter(l=>l.id&&recent.has(l.id)&&recent.get(l.id)/Math.max(1,recentTotal)<.05).map(l=>({...l,previousShare:recent.get(l.id)/recentTotal}));
    return {id:year(w)+':breeding-report',year:year(w),ruleVersion:ns.BloodlineSystem.VERSION,version:2,parents:B().childStats(w,year(w)),...familyStats(w,year(w)),firstCrop:first,rising:rising.sort((a,b)=>b.gain-a.gain),lines:[...lines.values()],rareLines,supplements:copy(w.breeding.planNotices||[]),cancelled:copy(w.breeding.upgradeNotices||[]),upgraded:w.breeding.upgradedYear===year(w),pairs:pairs.length};
  }
  ns.ChairmanGenetics={initialize,applyTemplate,upgrade,setValues,invalidate,context,pair,inherited,evaluate,publicEvaluation,publicPair,plan,familyStats,report,cloneForMutation};
})();
