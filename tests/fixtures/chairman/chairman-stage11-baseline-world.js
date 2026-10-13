(function () {
  'use strict';
  const ns = window.Keiba, R = ns.Random, W = () => ns.ChairmanRules;
  const copy = v => v === undefined ? undefined : JSON.parse(JSON.stringify(v));
  const check = (v, message) => { if (!v) throw Error(message); };
  const isV2 = w => w?.worldSystemVersion === 2;
  const classes = ['new','maiden','one-win','two-win','three-win','op','g3','g2','g1'];
  const graded = r => ['g1','g2','g3'].includes(typeof r === 'string' ? r : r.raceClass);
  const labels = {new:'新马',maiden:'未胜利','one-win':'1胜','two-win':'2胜','three-win':'3胜',op:'OP',g3:'G3',g2:'G2',g1:'G1'};
  const level = {new:0,maiden:0,'one-win':1,'two-win':2,'three-win':3};
  const defaults = () => ({surfaceWeights:{草地:60,泥地:35,二刀流:5},trackTypeWeights:{burst:1,sustained:1,attrition:1},distanceWeights:{grass:[20,20,20,20,10,10],dirt:[30,30,30,12,2,1]}});
  const mint = (w, prefix) => `${prefix}-${w.nextId++}`;
  const year = w => W().date(w.turn).year;
  const at = (y,r) => (y-1)*24+(r.month-1)*2+r.half-1;
  const region = (w,key) => w.regions.find(r=>r.id===key || r.name===key);
  function profile(w,key) {
    const r=region(w,key);check(r&&!r.disabled,'请选择启用的生成来源地区。');
    return {trackTypeWeights:{burst:1,sustained:1,attrition:1},...copy(r.generation),grass:r.environment.grass,dirt:r.environment.dirt};
  }
  function newRegion(w,v={}) {
    const base=v.baseRegion||'日本';
    return {id:v.id||mint(w,'region'),name:v.name||'新地区',shortName:v.shortName||v.name||'新地区',country:v.country||v.name||'',area:v.area||'',description:v.description||'',order:v.order??w.regions.length,
      baseRegion:base,autoPopulate:v.autoPopulate??true,disabled:false,initialCount:v.initialCount??0,annualTarget:v.annualTarget??0,trafficGroup:v.trafficGroup||v.area||base,
      competitionSystem:v.competitionSystem||'open',environment:{grass:base,dirt:base==='欧洲'?'日本':base,jockeyPool:base,...v.environment},...copy(v),generation:{...defaults(),...copy(v.generation)}};
  }
  function horseInput(w,v) {
    const r=region(w,v.homeRegionId||v.homeRegion); if(!r)return v;check(!r.disabled,'请选择启用地区。');
    const old=w.horses.find(h=>h.id===v.id);
    return {...v,homeRegion:r.name,homeRegionId:r.id,...(!old?{locationRegionId:r.id,locationRegion:r.name}:{})};
  }
  function initializeHorse(w,h,opts) {
    const r=region(w,opts.homeRegionId||h.homeRegion);check(r&&!r.disabled,'所属地区未启用。');
    h.homeRegionId=r.id;h.homeRegion=r.name;h.locationRegionId=opts.locationRegionId||r.id;
    h.locationRegion=region(w,h.locationRegionId)?.name||r.name;
    h.generationRegionId=opts.generationRegionId||r.id;h.generationVersion=opts.generationVersion||r.generationVersion||1;h.generationProfile=copy(opts.generationProfile||profile(w,h.generationRegionId));
    h.qualification=opts.qualification??0;h.initialQualification=opts.initialQualification??null;
  }
  // Names are compatibility/display projections. All new-world references have IDs.
  function synchronize(w) {
    if(!isV2(w))return;
    for(const r of w.races)ns.ChairmanPrestige.initialize(r);
    w.settings.annualNewHorses=w.regions.filter(r=>r.autoPopulate&&!r.disabled).reduce((n,r)=>n+r.annualTarget,0);
    for(const h of [...w.horses,...(w.pedigrees||[])])for(const [key,idKey] of [['homeRegion','homeRegionId'],['locationRegion','locationRegionId']]){
      if(!h[key]&&!h[idKey])continue;
      const r=region(w,h[idKey]||h[key]);if(r){h[idKey]=r.id;h[key]=r.name;}
    }
    for(const t of w.tracks){const r=region(w,t.regionId||t.region);if(r){t.regionId=r.id;t.region=r.name;}}
    for(const h of w.horses)if(h.booked){const b=h.booked,r=region(w,b.targetRegionId||b.targetRegion);if(r){b.targetRegionId=r.id;b.targetRegion=r.name;}}
    for(const p of w.breeding?.manual||[]){const r=region(w,p.homeRegionId||p.homeRegion);if(r){p.homeRegionId=r.id;p.homeRegion=r.name;}}
  }
  function travelTurns(w,from,to) {
    if(from===to)return 0;
    const key=[from,to].sort().join('|'),override=w.travelOverrides?.[key];
    if(override!=null)return override;
    return region(w,from)?.trafficGroup===region(w,to)?.trafficGroup?1:2;
  }
  function route(w,h,race,turn) {
    const from=h.transit?.toRegionId||h.locationRegionId||region(w,h.locationRegion)?.id,to=race.regionId;
    const duration=travelTurns(w,from,to),earliest=Math.max(Math.max(w.turn,h.transit?.arrivalTurn||0)+duration,(h.lastRaceTurn??-3)+3,(h.development?.lastTurn??-3)+3,h.restUntil||0);
    return {reachable:turn>=earliest,preparationTurn:duration?turn-duration:null,fromRegionId:from,targetRegionId:to,targetRegion:race.surfaceRegion,duration};
  }
  function travelBurden(w,h,path) {
    if(!crossGroup(w,path))return 0;
    return Math.min(8,(h.travelHistory||[]).filter(t=>t.crossGroup&&t.departureTurn>w.turn-12).length*2);
  }
  // Only time advancement completes transport. Loading or repeatedly planning never advances it.
  function travelTick(w) {
    for(const h of w.horses){
      const t=h.transit;if(!t||t.arrivalTurn>w.turn)continue;
      h.locationRegionId=t.toRegionId;h.locationRegion=region(w,t.toRegionId).name;h.transit=null;
      if(h.campaign){h.campaign.status=t.toRegionId===h.homeRegionId?'completed':'staying';h.campaign.arrivalTurn=t.arrivalTurn;}
      if(t.toRegionId===h.homeRegionId)h.campaign=null;
    }
  }
  function startTravel(w,h,to,departureTurn,arrivalTurn,kind) {
    if(h.transit||h.locationRegionId===to)return;
    const from=h.locationRegionId,t={fromRegionId:from,toRegionId:to,departureTurn,arrivalTurn,kind,crossGroup:crossGroup(w,{fromRegionId:from,targetRegionId:to})};
    h.transit=t;h.travelHistory=[...(h.travelHistory||[]).filter(t=>t.departureTurn>w.turn-24),copy(t)];
    if(h.campaign)h.campaign.status=kind==='return'?'returning':'outbound';
    // A player-defined zero-turn connection is intentionally instantaneous.
    if(arrivalTurn<=w.turn){h.locationRegionId=to;h.locationRegion=region(w,to).name;h.transit=null;if(to===h.homeRegionId)h.campaign=null;else if(h.campaign){h.campaign.status='staying';h.campaign.arrivalTurn=w.turn;}}
  }
  function reconcileCampaign(w,h) {
    const b=h.booked,abroad=h.locationRegionId!==h.homeRegionId;
    if(h.transit)return;
    if(b&&b.targetRegionId!==h.homeRegionId){
      const target=h.target&&h.target.turn>=b.turn?h.target:{raceId:b.raceId,turn:b.turn};
      if(!h.campaign||h.campaign.status==='completed'||h.campaign.destinationRegionId!==b.targetRegionId)
        h.campaign={originRegionId:h.locationRegionId,homeRegionId:h.homeRegionId,destinationRegionId:b.targetRegionId,createdTurn:w.turn,arrivalTurn:abroad?w.turn:null,status:abroad?'staying':'planned',primaryTarget:copy(target),reason:h.travelReason||'延续已锁定行程',exitCondition:'目标结束且无近期当地后续赛，或伤病、驻留届满',returnIntent:true};
      h.campaign.nextRace={raceId:b.raceId,turn:b.turn};
    }
    if(b){
      if(b.targetRegionId!==h.locationRegionId&&(b.preparationTurn==null||b.preparationTurn<=w.turn))
        startTravel(w,h,b.targetRegionId,b.preparationTurn??w.turn,b.turn,'race');
      return;
    }
    if(!abroad){h.campaign=null;return;}
    h.campaign||={originRegionId:h.homeRegionId,homeRegionId:h.homeRegionId,destinationRegionId:h.locationRegionId,createdTurn:w.turn,arrivalTurn:w.turn,primaryTarget:null,returnIntent:true,exitCondition:'无近期后续目标即返乡'};
    h.campaign.nextRace=null;h.campaign.reason=h.restUntil>w.turn?'伤病返乡休养':'远征结束，返乡调整';h.scheduleReason=h.campaign.reason;
    startTravel(w,h,h.homeRegionId,w.turn,w.turn+travelTurns(w,h.locationRegionId,h.homeRegionId),'return');
    h.target=null;h.scheduleReason=h.transit?'返乡途中':'返乡休整';
  }
  function travelReason(w,h,c,domestic,role) {
    if(c.race.regionId===h.homeRegionId)return '国内路线';
    if(c.path.fromRegionId===c.race.regionId)return '当地后续赛';
    if(!crossGroup(w,c.path))return '邻近地区交流';
    if(c.seriesGoal)return '连冠目标';
    if(h.lastRace?.raceId===c.race.id&&h.lastRace.rank===1)return '卫冕目标';
    const prestige=ns.ChairmanPrestige.value(c.race);
    if(!c.form.risky&&(role==='honor'&&prestige>=85||role==='challenge'&&prestige>=90))return '国际高声望目标';
    if(c.form.risky||c.form.count<2)return null;
    const comparable=domestic.some(d=>Math.abs(d.turn-c.turn)<=4&&d.race.surface===c.race.surface&&Math.abs(d.race.distance-c.race.distance)<=400&&Math.abs(classes.indexOf(d.race.raceClass)-classes.indexOf(c.race.raceClass))<=1&&!d.form.risky);
    if(!comparable)return '国内适合路线缺口';
    if(domestic.length&&domestic.every(d=>d.form.estimate+10<c.form.estimate))return '公开表现支持条件优势';
    return null;
  }
  function groupFor(w,raceId) {return (w.meetingGroups||[]).find(g=>g.enabled!==false&&g.raceIds.includes(raceId));}
  function assignment(w,g,y) {
    const existing=w.venueAssignments.find(a=>a.groupId===g.id&&a.year===y);
    if(existing?.frozen)return existing;
    const ids=g.trackIds,offset=Math.max(0,y-g.startYear)%ids.length;
    const trackId=g.yearOverrides?.[y]||ids[g.mode==='fixed'?0:offset];
    return {id:`${g.id}:${y}`,groupId:g.id,year:y,trackId,frozen:false};
  }
  function courseProfile(w,t,surface,distance) {
    const manual=t.courseProfiles?.find(p=>p.surface===surface&&p.distance===distance);
    const publicProfile=!manual&&ns.RaceCourseProfiles?.resolveForTrackCourse?.(t.key,surface,distance);
    const base=manual||publicProfile||{type:surface==='泥地'?(distance<=1400?'attrition':'sustained'):'burst',intensity:1,status:'provisional'};
    return {...copy(base),id:publicProfile?.id||`chairman:${w.id}:${t.id}:${surface}:${distance}`,trackId:t.id,trackKey:t.key||t.id,trackName:t.name,
      courseConfigId:t.configurations?.find(c=>c.surface===surface)?.id||`${t.id}:${surface}`,surface,distance,routeId:'standard',routeName:'标准路线',
      chairmanSource:manual?'manual':publicProfile?'public':'fallback',status:manual?'confirmed':base.status||'confirmed'};
  }
  function courseProfileFields(w,r,t) {
    const p=courseProfile(w,t,r.surface,r.distance);
    return {courseProfile:p,courseProfileId:p.id,courseRouteId:p.routeId,courseRouteName:p.routeName};
  }
  function courseLabel(p) {
    if(!p)return '赛程分类未记录';
    return `${{burst:'瞬发',sustained:'持久',attrition:'消耗'}[p.type]}${p.intensity===1?'Ⅰ':'Ⅱ'} · ${p.chairmanSource==='manual'?'手动设置':p.status==='provisional'?'暂定，待设置':'公共资料'}`;
  }
  function courseRows(w,t) {
    const rows=new Map((t.courseProfiles||[]).map(p=>[`${p.surface}:${p.distance}`,p]));
    for(const r of w.races.filter(r=>!r.deleted&&(r.trackId===t.id||w.meetingGroups.some(g=>g.enabled!==false&&g.trackIds.includes(t.id)&&g.raceIds.includes(r.id))))) {
      rows.set(`${r.surface}:${r.distance}`,{surface:r.surface,distance:r.distance});
    }
    return [...rows.values()].map(r=>courseProfile(w,t,r.surface,r.distance)).sort((a,b)=>a.surface.localeCompare(b.surface)||a.distance-b.distance);
  }
  function validateCourseProfiles(t) {
    check(t.courseProfiles==null||Array.isArray(t.courseProfiles),'赛程配置必须是列表。');
    const keys=new Set();
    for(const p of t.courseProfiles||[]) {
      const key=`${p.surface}:${p.distance}`;
      check(!keys.has(key),'同一马场的草泥与距离赛程不能重复。');keys.add(key);
      check(t.surfaces.includes(p.surface)&&Number.isInteger(p.distance)&&p.distance>0&&['burst','sustained','attrition'].includes(p.type)&&[1,2].includes(p.intensity),'赛程的场地、距离或分类无效。');
    }
  }
  function resolveRace(w,r,y=year(w)) {
    const locked=w.lockedRaces?.[`${y}:${r.id}`];if(locked)return copy(locked);
    const archived=w.venueAssignments.find(a=>a.year===y&&a.frozen&&a.races?.some(x=>x.id===r.id));
    if(archived){const snapshot=archived.races.find(x=>x.id===r.id);if(y<year(w)||r.lastHeldYear===y)return copy(snapshot);
      const venueKeys=['trackId','trackName','regionId','surfaceRegion','engineRegion','course','courseConfigId','courseName','courseProfile','courseProfileId','courseRouteId','courseRouteName','chairmanEnvironment','competitionSystem','meetingGroupId','venueYear','venueMode'];
      const fields=r.distance!==snapshot.distance?courseProfileFields(w,r,archived.trackSnapshot||w.tracks.find(t=>t.id===snapshot.trackId)):{};
      return {...copy(r),...Object.fromEntries(venueKeys.map(k=>[k,copy(snapshot[k])])),...fields,venueFrozen:true};}
    const g=groupFor(w,r.id),a=g?assignment(w,g,y):null;
    const frozen=a?.frozen?a.races?.find(x=>x.id===r.id):null;if(frozen)return copy(frozen);
    const t=w.tracks.find(t=>t.id===(a?.trackId||r.trackId));check(t,'赛事举办马场不存在。');
    const area=region(w,t.regionId),config=t.configurations?.find(c=>c.id===r.courseConfigId&&c.surface===r.surface)||t.configurations?.find(c=>c.surface===r.surface);
    check(area&&t.surfaces.includes(r.surface)&&config,'举办地地区或场地配置不匹配。');
    const {courseProfile,courseProfileId,courseRouteId,courseRouteName,...base}=copy(r),profile=courseProfileFields(w,r,t);
    return {...base,prestige:ns.ChairmanPrestige.value(r),trackId:t.id,trackKey:t.key,trackName:t.name,regionId:area.id,surfaceRegion:area.name,engineRegion:area.baseRegion,course:config?.courseType||t.courseType,
      courseConfigId:config?.id||'',courseName:config?.name||r.surface,...profile,chairmanEnvironment:copy(area.environment),competitionSystem:area.competitionSystem,meetingGroupId:g?.id||'',venueYear:y,venueMode:g?.mode||'fixed',venueFrozen:!!a?.frozen};
  }
  function refreshAssignments(w) {
    for(const g of w.meetingGroups.filter(g=>g.enabled!==false))for(const y of [year(w),year(w)+1]){
      const a=assignment(w,g,y),old=w.venueAssignments.find(x=>x.id===a.id);
      if(!old)w.venueAssignments.push(a);else if(!old.frozen)Object.assign(old,a);
    }
  }
  function freeze(w,raceId,y=year(w)) {
    if(!isV2(w))return;
    const g=groupFor(w,raceId);if(!g)return;
    const a=assignment(w,g,y);if(a.frozen)return;
    a.groupName=g.name;a.trackSnapshot=copy(w.tracks.find(t=>t.id===a.trackId));a.trackName=a.trackSnapshot.name;a.races=g.raceIds.map(id=>resolveRace(w,w.races.find(r=>r.id===id),y));a.frozen=true;
    const old=w.venueAssignments.find(x=>x.id===a.id);if(old)Object.assign(old,a);else w.venueAssignments.push(a);
  }
  function rememberActual(w,race,y) {
    const a=w.venueAssignments.find(a=>a.year===y&&a.frozen&&a.races.some(r=>r.id===race.id));
    if(a){const i=a.races.findIndex(r=>r.id===race.id);a.races[i]={...copy(race),venueFrozen:true};}
  }
  function validateGroup(w,g) {
    check(typeof g.name==='string'&&g.name.trim(),'请填写举办组名称。');
    check(['fixed','cycle'].includes(g.mode)&&Number.isInteger(g.startYear)&&g.startYear>=1,'轮换方式或起始年份无效。');
    check(Array.isArray(g.raceIds)&&g.raceIds.length&&new Set(g.raceIds).size===g.raceIds.length,'举办组成员缺失或重复。');
    check(Array.isArray(g.trackIds)&&g.trackIds.length&&new Set(g.trackIds).size===g.trackIds.length,'候选场地缺失或重复。');
    const races=g.raceIds.map(id=>w.races.find(r=>r.id===id));check(races.every(Boolean),'举办组引用了不存在的赛事。');
    check(!w.meetingGroups.some(o=>o.id!==g.id&&o.raceIds.some(id=>g.raceIds.includes(id))),'赛事不能同时属于两个举办组。');
    for(const id of g.trackIds){const t=w.tracks.find(t=>t.id===id);check(t&&(g.enabled===false||!t.deleted&&!region(w,t.regionId)?.disabled),'候选马场不存在或已停用。');for(const r of g.enabled===false?[]:races)check(t.surfaces.includes(r.surface),`${t.name}不支持${r.name}需要的${r.surface}。`);}
    for(const [y,id]of Object.entries(g.yearOverrides||{}))check(Number.isInteger(Number(y))&&Number(y)>=1&&(g.trackIds.includes(id)||w.venueAssignments.some(a=>a.frozen&&a.groupId===g.id&&a.year===Number(y)&&a.trackId===id)),'年度指定场地或年份无效。');
  }
  function eligible(w,h,r) {
    const q=h.qualification??0;
    if(r.raceClass==='new')return q===0&&h.lifetime.starts===0;
    if(Object.hasOwn(level,r.raceClass))return q===level[r.raceClass];
    const area=region(w,r.regionId||w.tracks.find(t=>t.id===r.trackId)?.regionId);
    if((r.competitionSystem||area?.competitionSystem)==='japan')return q>=1;
    return !graded(r)||q>=1||h.lifetime.wins>0;
  }
  function recordPerformance(h,p) {
    if(p.rank!==1||p.retired)return;
    h.qualification=Object.hasOwn(level,p.raceClass)?Math.max(h.qualification||0,level[p.raceClass]+1):4;
  }
  function prizes(c,grade) {const first={new:5,maiden:5,'one-win':10,'two-win':20,'three-win':40,op:grade==='L'?80:60,g3:100,g2:300,g1:1000}[c];return [1,.4,.25,.15,.1].map(v=>v*first);}
  function sourceRace(w,s,t,extra={}) {
    const age=s.ageRestriction||{type:'min',age:2};
    const raceClass=/^jpn([123])$/.test(s.raceClass)?`g${s.raceClass.at(-1)}`:s.raceClass;
    return {id:mint(w,'race'),sourceId:s.id,name:s.nameZh||s.name,originalName:s.nameOriginal||s.name,trackId:t.id,courseConfigId:t.configurations.find(c=>c.surface===s.surface)?.id,
      raceClass,prestige:ns.ChairmanPrestige.reference({sourceId:s.id,raceClass}),prestigeOverride:false,grade:s.grade==='OP/L'?'L':s.grade||labels[raceClass],surface:s.surface,distance:s.distance,month:s.month,half:s.half,
      ageRule:age.type==='exact'?String(age.age):`${age.age}+`,sexRule:s.sexRestriction==='牝馬'||s.sexRestriction==='牝马'?'female':'all',capacity:16,prizes:prizes(raceClass,s.grade==='OP/L'?'L':s.grade),prizeSource:'游戏奖金',
      courseProfileId:s.courseProfileId||'',courseRouteId:s.courseRouteId||'',courseRouteName:s.courseRouteName||'',deleted:false,...extra};
  }
  function newTrack(w,area,spec) {
    const id=spec.id||mint(w,'track'),surfaces=spec.surfaces||['草地','泥地'];
    const configurations=spec.configurations||surfaces.map((surface,i)=>({id:`${id}:course:${i}`,name:surface,surface,courseType:spec.courseType||'其他地方'}));
    return {id,name:spec.name,originalName:spec.originalName||spec.name,aliases:[],regionId:area.id,region:area.name,country:area.country,city:spec.city||'',state:spec.state||'',courseType:spec.courseType||'其他地方',surfaces,configurations,courseProfiles:[],deleted:false,...copy(spec)};
  }
  function addSupport(w,area) {
    const tracks=w.tracks.filter(t=>t.regionId===area.id&&!t.deleted);if(!tracks.length)return;
    if(area.competitionSystem==='japan'){
      const seen=new Set();
      for(const s of ns.RaceRegistry.all().filter(r=>r.surfaceRegion==='日本'&&Object.hasOwn(level,r.raceClass))){
        const t=tracks.find(t=>t.sourceCourse===s.course);if(!t)continue;
        const age=s.ageRestriction.age,ageRule=age>=4?'4+':String(age),key=[s.raceClass,ageRule,s.month,s.half,t.id,s.surface,s.distance].join(':');if(seen.has(key))continue;seen.add(key);
        w.races.push(sourceRace(w,s,t,{ageRule,demandDriven:true,support:true}));
      }
      // Adult non-winners retain an outlet after the source maiden age window ends.
      for(let k=0;k<24;k++)for(const surface of ['草地','泥地']){const pool=tracks.filter(t=>t.surfaces.includes(surface));if(!pool.length)continue;const t=pool[k%pool.length],d=W().date(k);w.races.push(sourceRace(w,{id:`adult-maiden:${k}:${surface}`,name:`${t.name}成年未胜利补充赛`,raceClass:'maiden',surface,distance:[1200,1600,2000,2400][k%4],month:d.month,half:d.half,ageRestriction:{type:'min',age:4}},t,{demandDriven:true,support:true,sourceNote:'主席补充赛事'}));}
    }else for(let k=0;k<24;k++)for(const surface of ['草地','泥地']){
      const pool=tracks.filter(t=>t.surfaces.includes(surface));if(!pool.length)continue;const t=pool[k%pool.length],d=W().date(k);
      for(let lane=0;lane<2;lane++)w.races.push(sourceRace(w,{id:`support:${area.id}:${k}:${surface}:${lane}`,name:`${area.name}${d.month}月${d.half===1?'上':'下'}${surface}补充公开赛`,raceClass:'op',surface,distance:[1200,1600,2000,2400][(k+lane)%4],month:d.month,half:d.half,ageRestriction:{type:'min',age:2}},t,{support:true,demandDriven:true,sourceNote:'主席补充赛事'}));
    }
  }
  function create(opts={},auditFactory) {
    const w=W().createWorld({id:opts.id,seed:opts.seed,name:opts.name,blank:true});
    Object.assign(w,{worldSystemVersion:2,worldType:opts.worldType,prestigeVersion:ns.ChairmanPrestige.version,generationVersion:1,regions:[],tracks:[],races:[],meetingGroups:[],venueAssignments:[],travelOverrides:{},referenceAudit:[],worldChanges:[],referenceVersion:ns.ChairmanVenues?.version||'1',worldPhase:'setup'});
    w.honors.associations={};
    w.developmentVersion=opts.development===false?0:1;
    w.developmentActivatedTurn=w.turn;
    const selected=opts.worldType==='blank'?[]:opts.regionKeys||['japan'];
    check(new Set(selected).size===selected.length,'地区选择重复。');
    for(const key of selected){
      const spec=ns.ChairmanVenues.regionSpecs.find(r=>r.key===key);check(spec,'参考地区不存在。');
      const entries=ns.ChairmanVenues.catalogue().filter(r=>r.regionKey===key),confirmed=entries.filter(r=>r.status==='confirmed');
      const count=opts.population?.[key]??(key==='japan'?1000:Math.max(100,Math.ceil(confirmed.length*5/4)*4));
      check(Number.isSafeInteger(count)&&count>=0,'初始马数须为非负整数。');
      const area=newRegion(w,{...spec,id:mint(w,'region'),initialCount:count,annualTarget:opts.annualTargets?.[key]??Math.ceil(count/4),generation:{...defaults(),...(key==='japan'?{surfaceWeights:{草地:70,泥地:25,二刀流:5}}:{})}});validateRegion(area);w.regions.push(area);
      w.referenceAudit.push(...entries.map(e=>({...copy(e),regionId:area.id})));
      const hostedVenueKeys={
        'breeders-cup':['santa-anita','del-mar','keeneland'],
        jbc:['oi','funabashi','kawasaki','morioka','nagoya','saga','kanazawa']
      };
      const venueKeys=new Set(confirmed.flatMap(e=>hostedVenueKeys[e.hostGroup]||[e.venueKey]));
      if(key==='japan')ns.ChairmanVenues.tracks.filter(t=>t.regionKey==='japan').forEach(t=>venueKeys.add(t.key));
      for(const venueKey of venueKeys){const data=ns.ChairmanVenues.tracks.find(t=>t.key===venueKey);check(data,'马场资料缺失。');w.tracks.push(newTrack(w,area,{...data,id:mint(w,'track')}));}
      const source=new Map(ns.RaceRegistry.all().map(r=>[r.id,r]));
      for(const e of confirmed){const t=w.tracks.find(t=>t.key===e.venueKey);const s=source.get(e.sourceId);const race=sourceRace(w,s,t,{sourceRecord:copy(e),sourceBaseline:copy(s)});if(e.courseName){const config=t.configurations.find(c=>c.name===e.courseName);check(config,'赛事赛道资料缺失。');race.courseConfigId=config.id;}w.races.push(race);}
      addSupport(w,area);
    }
    const hostedGroups=[
      {sourceKey:'breeders-cup',name:'育马者杯',trackKeys:['santa-anita','del-mar','keeneland']},
      {sourceKey:'jbc',name:'JBC',trackKeys:['oi','funabashi','kawasaki','morioka','nagoya','saga','kanazawa']}
    ];
    for(const definition of hostedGroups){
      const members=w.races.filter(r=>r.sourceRecord?.hostGroup===definition.sourceKey);
      if(members.length)w.meetingGroups.push({id:mint(w,'meeting'),sourceKey:definition.sourceKey,name:definition.name,mode:'cycle',startYear:1,trackIds:definition.trackKeys.map(k=>w.tracks.find(t=>t.key===k)?.id).filter(Boolean),raceIds:members.map(r=>r.id),yearOverrides:{},enabled:true});
    }
    ns.ChairmanHonors.initialize(w);
    W().seeded(w,()=>{for(const area of w.regions)for(let i=0;i<area.initialCount;i++){
      const age=2+Math.floor(i/Math.max(1,Math.ceil(area.initialCount/4)))%4,q=age===2?0:1+i%4;
      W().addHorse(w,{homeRegion:area.name,homeRegionId:area.id,age,qualification:q,initialQualification:q,sourceKind:'initial'});
    }});
    w.settings.annualNewHorses=w.regions.reduce((n,r)=>n+r.annualTarget,0);
    if(opts.breeding!==false)ns.ChairmanBreeding.enable(w,{foundation:opts.foundation!==false&&selected.length>0,background:opts.foundation!==false&&selected.length>0});
    synchronize(w);refreshAssignments(w);if(w.horses.length&&w.races.length){w.worldPhase='running';plan(w,typeof auditFactory==='function'?auditFactory(w):undefined);}W().validateWorld(w);return w;
  }
  function assertReady(w) {
    check(w.regions.some(r=>!r.disabled)&&w.tracks.some(t=>!t.deleted)&&w.races.some(r=>!r.deleted),'世界仍在筹备：请先创建地区、马场和赛事。');
    check(w.horses.filter(h=>h.status==='active').length>=2,'世界仍在筹备：至少需要两匹可参赛马。');
  }
  // Public, recent evidence only. A single poor run must not erase an established route.
  function planningEvidence(w,h) {
    const published=(h.recentForm||[]).filter(p=>Number.isFinite(p.tf)&&!p.retired&&Number.isInteger(p.turn)&&p.turn<=w.turn&&p.turn>=w.turn-12
      &&Number.isFinite(p.distance)&&p.distance>0&&['草地','泥地'].includes(p.surface)&&(p.rank==null||p.rank>0)).sort((a,b)=>b.turn-a.turn).slice(0,8);
    // An assessment seeds public ability, but its assigned course is not an
    // observed race performance and cannot establish a specialist route.
    const rows=published.filter(p=>!p.assessment);
    const median=ns.ChairmanRatings.median, overall=median(published.map(p=>p.tf))??100, groups=new Map();
    for(const p of rows){const key=p.surface+':'+W().category(p.distance),sample=groups.get(key)||[];sample.push(p);groups.set(key,sample);}
    const established=[...groups.values()].filter(v=>v.length>=2).map(v=>({surface:v[0].surface,distance:median(v.map(p=>p.distance)),value:median(v.map(p=>p.tf))}));
    const best=established.reduce((a,b)=>!a||b.value>a.value?b:a,null);
    return {rows,overall,groups,best};
  }
  function planningForm(evidence,race) {
    const same=evidence.groups.get(race.surface+':'+W().category(race.distance))||[];
    const nearby=evidence.rows.filter(p=>p.surface===race.surface&&Math.abs(p.distance-race.distance)<=400);
    const sample=same.length?same:nearby, count=sample.length, confidence=count/(count+2);
    const observed=ns.ChairmanRatings.median(sample.map(p=>p.tf));
    const estimate=evidence.overall+(observed==null?0:Math.max(-25,Math.min(25,observed-evidence.overall))*confidence);
    const best=evidence.best, unfamiliar=!!(evidence.rows.length&&!count), different=!!(best&&(best.surface!==race.surface||Math.abs(best.distance-race.distance)>600));
    const poor=!!(best&&count>=2&&observed<best.value-15);
    return {estimate,count,confidence,unfamiliar,risky:poor||unfamiliar&&different,
      penalty:(unfamiliar?1.5:0)+(poor?3:0),observed};
  }
  function planningPreference(w,h,key) {
    return ns.ChairmanRatings.hash(`schedule:1:${w.seed}:${year(w)}:${h.id}:${key}`)/4294967296;
  }
  function mixPreference(value) {
    value=Math.imul(value^(value>>>16),0x85ebca6b);
    value=Math.imul(value^(value>>>13),0xc2b2ae35);
    return ((value^(value>>>16))>>>0)/4294967296;
  }
  function crossGroup(w,path) {return region(w,path.fromRegionId)?.trafficGroup!==region(w,path.targetRegionId)?.trafficGroup;}
  function planningRole(h,evidence,cohort) {
    if(!h.lifetime.starts)return (h.qualification||0)>=3?'challenge':'experience';
    const published=W().entryRating(h);
    const relative=published??(evidence.rows.length?evidence.overall:null);
    if((h.qualification||0)>=1&&cohort?.length>=8&&relative!=null){
      if(h.lifetime.starts>=2&&relative>=cohort[Math.floor(cohort.length*.75)])return 'honor';
      if(relative>=cohort[Math.floor(cohort.length*.4)])return 'challenge';
    }
    if((published??0)>=110||evidence.overall>=110&&evidence.rows.length>=2)return 'honor';
    return (published??evidence.overall)>=95?'challenge':'experience';
  }
  const raceTiers={new:0,maiden:0,'one-win':1,'two-win':2,'three-win':3,op:4,g3:5,g2:6,g1:7};
  function planningObjective(h,role) {
    const published=W().entryRating(h);
    // Initial three-win qualification is not evidence of graded-race form.
    // Start that untested cohort at G3; open-class and proven horses can aim higher.
    const challengeTier=!h.lifetime.starts&&published==null&&h.qualification===3?5:6;
    const desired=role==='honor'?7:role==='challenge'?((h.qualification||0)>=3?((published??0)>=105?7:challengeTier):5):Math.min(4,h.qualification||0);
    return {desired,prestigeWeight:role==='honor'?.09:role==='challenge'?.045:.01};
  }
  function objectiveValue(objective,r) {
    return 9-Math.abs(raceTiers[r.raceClass]-objective.desired)*2.2+ns.ChairmanPrestige.value(r)*objective.prestigeWeight;
  }
  function compatiblePrep(w,c,target) {
    return c.key===target.key || c.turn<target.turn && target.turn-c.turn>=Math.max(3,travelTurns(w,c.race.regionId,target.race.regionId)+1)
      && c.race.surface===target.race.surface && Math.abs(c.race.distance-target.race.distance)<=400 && !c.form.risky;
  }
  function setTarget(h,target,role) {
    h.target=target?{raceId:target.race.id,turn:target.turn,reason:target.seriesGoal?'连冠目标':role==='honor'?'主攻高声望大赛':role==='challenge'?'挑战升级':'积累经验',prestige:ns.ChairmanPrestige.value(target.race)}:null;
  }
  function supportChoice(w,choice,reference,target) {
    if(!reference||choice.key===reference.key)return false;
    if(reference.utility-choice.utility>1)return false;
    if(target&&reference.key===target.key&&choice.key!==target.key)return false;
    if(target&&choice.key!==target.key&&Math.abs(choice.turn-target.turn)<3)return false;
    if(choice.form.risky||crossGroup(w,choice.path))return false;
    if(choice.race.surface!==reference.race.surface||Math.abs(choice.race.distance-reference.race.distance)>400||choice.form.estimate<reference.form.estimate-5)return false;
    return true;
  }
  function plan(w, audit) {
    if(w.phase!=='season')return;
    // Optional, detached diagnostics for offline audits; never persisted in the world.
    const emit=typeof audit==='function'?(type,data)=>audit({type,...copy(data)}):null;
    synchronize(w);refreshAssignments(w);ns.ChairmanSeries?.prepare(w);
    const now=w.turn,events=[],indexes=new Map(),calendarExcluded=emit?[]:null;
    for(const d of w.races)for(const y of [year(w),year(w)+1]){
      const locked=w.lockedRaces?.[`${y}:${d.id}`]||ns.ChairmanSeries?.frozenRace(w,d.id,y);
      if(!locked&&(d.deleted||d.lastHeldYear===y||y<(d.notBeforeYear||1))){if(calendarExcluded)calendarExcluded.push({raceId:d.id,year:y,reasons:[...(d.deleted?['deleted']:[]),...(d.lastHeldYear===y?['already-held']:[]),...(y<(d.notBeforeYear||1)?['not-before-year']:[])]});continue;}
      const race=locked||resolveRace(w,d,y),turn=at(y,race);if(turn<now||turn>=now+12||race.support&&turn>=now+6)continue;
      const e={race,turn,key:`${y}:${d.id}`,locked:!!locked,preferenceSeed:ns.ChairmanRatings.hash(`${y}:${d.id}`)};events.push(e);indexes.set(e.key,e);
    }
    if(emit)emit('start',{turn:now,events,calendarExcluded});
    {
      const accepted=new Map(),pending=[],eligibleBuckets=new Map(),preserved=new Set();
      const active=w.horses.filter(h=>h.status==='active'),cohorts=new Map(),cohortKey=h=>h.homeRegionId+':'+Math.min(4,W().ageOf(w,h));
      for(const h of active){const score=W().entryRating(h);if(score==null)continue;const key=cohortKey(h),rows=cohorts.get(key)||[];rows.push(score);cohorts.set(key,rows);}
      for(const rows of cohorts.values())rows.sort((a,b)=>a-b);
      for(const h of active){
        const b=h.booked,old=b&&indexes.get(`${W().date(b.turn).year}:${b.raceId}`);
        if(emit)emit('horse',{horseId:h.id,previousBooking:b,previousTarget:h.target,rating:W().entryRating(h)});
        if(h.transit?.kind==='return'){if(emit)emit('preserved',{horseId:h.id,key:null,reason:'return-transit'});h.booked=null;h.target=null;h.scheduleReason='返乡途中';continue;}
        if(old&&(h.restUntil||0)<=b.turn&&(old.locked||b.preparationTurn!=null&&b.preparationTurn<=now)){
          if(emit)emit('preserved',{horseId:h.id,key:old.key});
          const list=accepted.get(old.key)||[];list.push(h);accepted.set(old.key,list);preserved.add(old.key);continue;
        }
        h.booked=null;
        if(ns.ChairmanDevelopment.enabled(w)&&(h.qualification??0)===0){h.target=null;h.scheduleReason='出道评估与未胜利晋级';continue;}
        const goals=(w.seriesState?.current||[]).filter(s=>!s.settled&&s.results.length&&s.results.every(r=>r.horseId===h.id&&r.eligible)&&ns.ChairmanSeries.ageOK(s.ageRule,W().ageOf(w,h))).map(s=>s.races.filter(r=>!s.results.some(p=>p.raceId===r.id)).map(r=>({race:r,turn:at(s.year,r)})).sort((a,b)=>a.turn-b.turn)[0]).filter(Boolean);
        const goal=goals.sort((a,b)=>a.turn-b.turn)[0];
        const bucketKey=[h.birthYear,h.gender,h.qualification,h.lifetime.starts===0,h.lifetime.wins>0].join(':');
        if(!eligibleBuckets.has(bucketKey))eligibleBuckets.set(bucketKey,events.filter(e=>W().eligible(w,{...h,restUntil:0},e.race,e.turn)));
        const evidence=planningEvidence(w,h),role=planningRole(h,evidence,cohorts.get(cohortKey(h))),objective=planningObjective(h,role),formCache=new Map(),preferenceSeed=ns.ChairmanRatings.hash(`schedule:1:${w.seed}:${year(w)}:${h.id}`);
        // Routes and travel burden are constant for one horse/destination/turn
        // within this planning pass. Keep caches local so edits never reuse stale data.
        const routeCache=new Map(),burdenCache=new Map();
        const regional=region(w,h.generationRegionId||h.homeRegionId),choices=[],rejected=emit?[]:null;
        for(const e of eligibleBuckets.get(bucketKey)){
          const r=e.race;if(goal&&r.id!==goal.race.id&&(e.turn>=goal.turn||goal.turn-e.turn<Math.max(3,travelTurns(w,r.regionId,goal.race.regionId)))){if(rejected)rejected.push({key:e.key,reasons:['series-conflict']});continue;}
          const routeKey=JSON.stringify([r.regionId,r.surfaceRegion,e.turn]);
          if(!routeCache.has(routeKey))routeCache.set(routeKey,route(w,h,r,e.turn));
          const path=routeCache.get(routeKey);if(!path.reachable){if(rejected)rejected.push({key:e.key,reasons:[...(e.turn<(h.restUntil||0)?['injury-rest']:[]),...(e.turn<(h.lastRaceTurn??-3)+3?['race-interval']:[]),...(e.turn<now+path.duration?['transport']:[])]});continue;}
          const formKey=r.surface+':'+r.distance;
          if(!formCache.has(formKey))formCache.set(formKey,planningForm(evidence,r));
          const form=formCache.get(formKey);
          const surfacePrior=(regional?.generation.surfaceWeights[r.surface]||0)/100;
          const suitable=(form.estimate-evidence.overall)*.16-form.penalty+(!h.lifetime.starts?surfacePrior:0);
          const seriesGoal=goal?.race.id===r.id&&goal.turn===e.turn;
          if(!burdenCache.has(r.regionId))burdenCache.set(r.regionId,travelBurden(w,h,path));
          const merit=(seriesGoal?20:0)+suitable+objectiveValue(objective,r)-path.duration*1.5-burdenCache.get(r.regionId)+(r.regionId===h.homeRegionId?2.5:0)+mixPreference(preferenceSeed^e.preferenceSeed)*.5;
          const targetUtility=merit-(e.turn-now)*.55,utility=merit-(e.turn-now)*1.4;
          choices.push({...e,path,utility,targetUtility,seriesGoal,form});
        }
        const safe=choices.some(c=>!c.form.risky),explore=(h.lifetime.starts||0)%4===Math.floor(planningPreference(w,h,'exploration')*4);
        for(let i=choices.length-1;i>=0;i--){const c=choices[i],seriesGoal=goal&&c.race.id===goal.race.id&&c.turn===goal.turn;if(!seriesGoal&&c.form.risky&&(safe&&(!explore||graded(c.race))||crossGroup(w,c.path))){if(rejected)rejected.push({key:c.key,reasons:['condition-evidence']});choices.splice(i,1);}}
        const domestic=choices.filter(c=>c.race.regionId===h.homeRegionId),abroad=h.locationRegionId!==h.homeRegionId;
        for(let i=choices.length-1;i>=0;i--){
          const c=choices[i];c.travelReason=travelReason(w,h,c,domestic,role);
          // A stay has a short forward commitment and a bounded campaign; locked legs were preserved above.
          const expired=abroad&&c.race.regionId!==h.homeRegionId&&!c.seriesGoal&&(h.restUntil>now||c.turn>now+4||c.turn>(h.campaign?.arrivalTurn??now)+12);
          if(!c.travelReason||expired){if(rejected)rejected.push({key:c.key,reasons:[expired?'campaign-return':'overseas-purpose']});choices.splice(i,1);}
        }
        pending.push({h,allChoices:choices,choices:[],role,oldTarget:h.target,old:b,rating:W().entryRating(h)??0,tie:planningPreference(w,h,'entry-order'),eligibleKeys:emit?eligibleBuckets.get(bucketKey).map(e=>e.key):null,rejected});
      }
      pending.sort((a,b)=>b.rating-a.rating||b.h.lifetime.prize-a.h.lifetime.prize||a.tie-b.tie);
      const pendingById=new Map(pending.map(p=>[p.h.id,p])),reserved=new Map([...accepted].map(([key,rows])=>[key,rows.length]));
      // A valid existing target keeps its provisional place while other horses
      // choose. Release that place when its owner reevaluates or changes target.
      const heldTargets=new Map(),heldBookings=new Map(),bookingReserved=new Map();
      const occupied=key=>(accepted.get(key)?.length||0)+(bookingReserved.get(key)||0);
      for(const p of pending){const old=p.allChoices.find(c=>c.race.id===p.oldTarget?.raceId&&c.turn===p.oldTarget.turn);
        if(old&&old.race.regionId===p.h.homeRegionId&&p.h.locationRegionId===p.h.homeRegionId&&(reserved.get(old.key)||0)<old.race.capacity){heldTargets.set(p.h.id,old.key);reserved.set(old.key,(reserved.get(old.key)||0)+1);}
        const booking=p.allChoices.find(c=>c.race.id===p.old?.raceId&&c.turn===p.old.turn);
        if(booking&&booking.race.regionId===p.h.homeRegionId&&p.h.locationRegionId===p.h.homeRegionId&&(!old||compatiblePrep(w,booking,old))&&occupied(booking.key)<booking.race.capacity){heldBookings.set(p.h.id,booking.key);bookingReserved.set(booking.key,(bookingReserved.get(booking.key)||0)+1);}
      }
      for(const p of pending){
        const held=heldTargets.get(p.h.id);if(held)reserved.set(held,reserved.get(held)-1);
        const bookedPlace=heldBookings.get(p.h.id);if(bookedPlace)bookingReserved.set(bookedPlace,bookingReserved.get(bookedPlace)-1);
        const targets=p.allChoices.filter(c=>(reserved.get(c.key)||0)<c.race.capacity&&occupied(c.key)<c.race.capacity);
        let target=targets.reduce((best,c)=>!best||c.targetUtility>best.targetUtility?c:best,null);
        // Spread new, nearly equivalent domestic commitments before they become
        // protected targets. Never displace a materially better race or create travel.
        if(target){
          const reference=target,need=c=>c.race.support?0:Math.max(0,1-(reserved.get(c.key)||0)/(c.race.raceClass==='g1'&&ns.ChairmanPrestige.value(c.race)>=85?8:5));
          let best=target.targetUtility+need(target)*.75;
          for(const c of targets){if(c.key===reference.key||Math.abs(c.turn-reference.turn)>1||c.race.raceClass!==reference.race.raceClass||!supportChoice(w,{...c,utility:c.targetUtility},{...reference,utility:reference.targetUtility},null))continue;
            const score=c.targetUtility+need(c)*.75;if(score>best){target=c;best=score;}
          }
        }
        const previous=targets.find(c=>c.race.id===p.oldTarget?.raceId&&c.turn===p.oldTarget.turn);
        if(previous&&target&&!target.seriesGoal&&target.targetUtility-previous.targetUtility<2.5)target=previous;
        p.target=target;setTarget(p.h,target,p.role);
        const ideal=p.allChoices.reduce((best,c)=>!best||c.targetUtility>best.targetUtility?c:best,null);
        if(target&&ideal&&ideal.key!==target.key&&!targets.includes(ideal))p.h.target.reason='落选备选';
        if(target&&target===previous&&p.oldTarget.reason)p.h.target.reason=p.oldTarget.reason;
        if(target)reserved.set(target.key,(reserved.get(target.key)||0)+1);
        p.choices=p.allChoices.filter(c=>c.turn<now+6&&(!target||compatiblePrep(w,c,target)));
        // A target inside the booking window is preferred to an unnecessary extra start.
        // Far targets allow a suitable local prep, or deliberate rest when none exists.
        if(target&&target.turn<now+6)p.choices=p.choices.map(c=>({...c,utility:c.utility+(c.key===target.key?5:0)}));
        p.choiceByKey=new Map(p.choices.map(c=>[c.key,c]));
        if(emit)emit('candidates',{horseId:p.h.id,eligibleKeys:p.eligibleKeys,rejected:p.rejected,target:p.h.target,choices:p.allChoices.map(c=>({key:c.key,utility:c.utility,path:c.path,form:c.form,bookingBlocked:c.turn>=now+6?'outside-booking-window':target&&!compatiblePrep(w,c,target)?'target-preparation':null}))});
        p.h.scheduleReason=target?'休整备战目标':'暂无合法参赛机会';
        const available=p.choices.filter(c=>occupied(c.key)<c.race.capacity);
        const reference=available.reduce((a,c)=>!a||c.utility>a.utility?c:a,null);
        p.reference=reference;
        // Field support only breaks close, suitable choices; it cannot buy a new overseas trip.
        const fieldNeed=e=>e.race.support?(occupied(e.key)>0?.5:0):Math.max(0,8-occupied(e.key))/8*.75;
        const need=e=>supportChoice(w,e,reference,p.target)?Math.max(0,fieldNeed(e)-fieldNeed(reference)):0;
        let e=null,score=-Infinity;for(const candidate of p.choices){if(occupied(candidate.key)>=candidate.race.capacity)continue;const value=candidate.utility+need(candidate);if(value>score){e=candidate;score=value;}}
        const sameTarget=target&&target.race.id===p.oldTarget?.raceId&&target.turn===p.oldTarget.turn;
        const retained=available.find(c=>c.race.id===p.old?.raceId&&c.turn===p.old.turn&&(reference.utility-c.utility<=1
          ||sameTarget&&c.race.regionId===p.h.homeRegionId&&target.race.regionId===p.h.homeRegionId&&c.key!==target.key&&compatiblePrep(w,c,target)&&!c.form.risky));
        if(retained)e=retained;
        if(emit)emit('allocation',{horseId:p.h.id,selected:e?.key||null,reason:retained?'retained-booking':'utility-with-field-support',options:p.choices.map(c=>({key:c.key,utility:c.utility,need:need(c),occupied:occupied(c.key),capacity:c.race.capacity}))});
        if(!e)continue;
        p.h.scheduleReason=e.key===target?.key?p.h.target.reason:e.form.unfamiliar?'探索条件':(p.h.lastRaceTurn!=null&&now-p.h.lastRaceTurn>=6)?'复出前哨':'目标前哨';
        p.h.travelReason=e.travelReason;
        const list=accepted.get(e.key)||[];list.push(p.h);accepted.set(e.key,list);
        p.h.booked={raceId:e.race.id,turn:e.turn,targetRegion:e.path.targetRegion,targetRegionId:e.path.targetRegionId,fromRegionId:e.path.fromRegionId,preparationTurn:e.path.preparationTurn,travelTurns:e.path.duration};
      }
      // A short field may borrow a willing runner from a close alternative only.
      // Keep at least two runners in every other named event.
      // A frozen venue does not close its entry list. Before departure or race day we
      // may still fill a short field from uncommitted, legally reachable horses.
      // Previously committed runners never enter `pending` and cannot be moved.
      const willing=pending.slice().reverse();
      for(const e of events.filter(e=>!e.race.support&&e.turn<now+6).sort((a,b)=>a.turn-b.turn)){
        const list=accepted.get(e.key)||[];
        if(list.length>=2)continue;
        for(const p of willing){
          if(list.length>=2)break;
          const choice=p.choiceByKey.get(e.key);if(!choice||list.includes(p.h))continue;
          const booked=p.h.booked,donor=booked&&indexes.get(`${W().date(booked.turn).year}:${booked.raceId}`),rows=donor&&accepted.get(donor.key);
          const reference=p.choiceByKey.get(donor?.key)||p.reference;
          if(!supportChoice(w,choice,reference,p.target))continue;
          if(p.reference&&p.reference.utility-choice.utility>1)continue;
          if(list.length>=e.race.capacity)break;
          if(donor&&!donor.race.support&&rows.length<=2)continue;
          if(emit)emit('move',{reason:'minimum-field',horseId:p.h.id,from:donor?.key||null,to:e.key});
          if(rows)rows.splice(rows.indexOf(p.h),1);
          list.push(p.h);accepted.set(e.key,list);
          p.h.scheduleReason=choice.key===p.target?.key?p.h.target.reason:choice.form.unfamiliar?'探索条件':(p.h.lastRaceTurn!=null&&now-p.h.lastRaceTurn>=6)?'复出前哨':'目标前哨';
          p.h.booked={raceId:e.race.id,turn:e.turn,targetRegion:choice.path.targetRegion,targetRegionId:choice.path.targetRegionId,fromRegionId:choice.path.fromRegionId,preparationTurn:choice.path.preparationTurn,travelTurns:choice.path.duration};
        }
      }
      // Consolidate single-runner demand races before they are locked.
      for(const [key,list]of accepted){const e=indexes.get(key);if(!list.length||list.length>=8||!e.race.demandDriven||e.locked||preserved.has(key))continue;
        const alternative=[...accepted].find(([k,rows])=>{const a=indexes.get(k);return k!==key&&!preserved.has(k)&&!a.locked&&rows.length>0&&rows.length<8&&rows.length+list.length<=a.race.capacity&&a.race.demandDriven&&a.turn===e.turn&&a.race.raceClass===e.race.raceClass&&a.race.grade===e.race.grade&&a.race.ageRule===e.race.ageRule&&a.race.sexRule===e.race.sexRule&&a.race.surface===e.race.surface&&a.race.distance===e.race.distance&&a.race.trackId===e.race.trackId&&a.race.courseConfigId===e.race.courseConfigId&&a.race.regionId===e.race.regionId&&list.every(h=>{const p=pendingById.get(h.id),c=p?.choiceByKey.get(k);return c&&(!p.reference||p.reference.utility-c.utility<=1)&&W().eligible(w,h,a.race,a.turn);});});
        if(alternative){const a=indexes.get(alternative[0]);for(const h of list){if(emit)emit('move',{reason:'consolidation',horseId:h.id,from:key,to:a.key});alternative[1].push(h);h.booked={...h.booked,raceId:a.race.id};}list.length=0;}
      }
    }
    for(const h of w.horses){if(h.status!=='active')continue;reconcileCampaign(w,h);const b=h.booked;if(b&&b.preparationTurn!=null&&b.preparationTurn<=w.turn){const y=W().date(b.turn).year;freeze(w,b.raceId,y);w.lockedRaces[`${y}:${b.raceId}`]||=resolveRace(w,w.races.find(r=>r.id===b.raceId),y);}}
    ns.ChairmanSeries?.prepare(w);
    if(emit)emit('end',{turn:now,aiRngState:w.aiRngState});
  }
  function validateRegion(r) {
    check(typeof r.name==='string'&&r.name.trim()&&r.name.length<=80,'地区名称须为1～80字。');
    check(['日本','欧洲','美国'].includes(r.baseRegion),'无效的基础环境。');
    check(['日本','香港','美国','欧洲','其他'].includes(r.environment?.grass)&&['日本','中东','美国'].includes(r.environment?.dirt)&&['日本','欧洲','美国'].includes(r.environment?.jockeyPool),'比赛环境无效。');
    const g=r.generation,weights=g?.surfaceWeights;check(weights&&['草地','泥地','二刀流'].every(k=>Number.isFinite(weights[k])&&weights[k]>=0)&&Math.abs(Object.values(weights).reduce((a,b)=>a+b,0)-100)<1e-8,'草泥类型比例须为非负数且合计100%。');
    const tw=g.trackTypeWeights||defaults().trackTypeWeights;check(['burst','sustained','attrition'].every(k=>Number.isFinite(tw[k])&&tw[k]>=0)&&['burst','sustained','attrition'].some(k=>tw[k]>0),'三类型权重必须非负且至少一项大于0。');
    for(const k of ['grass','dirt'])check(Array.isArray(g.distanceWeights?.[k])&&g.distanceWeights[k].length===6&&g.distanceWeights[k].every(v=>Number.isFinite(v)&&v>=0)&&g.distanceWeights[k].some(v=>v>0),'距离权重须为六项非负数且至少一项大于零。');
    check(Number.isSafeInteger(r.annualTarget)&&r.annualTarget>=0&&Number.isSafeInteger(r.initialCount)&&r.initialCount>=0,'人口设置须为非负整数。');
    check(typeof r.trafficGroup==='string'&&r.trafficGroup.trim(),'请填写交通分组。');
  }
  const editKinds=['region','track','race','meeting','traffic','qualification','populate','source'];
  function edit(world,kind,v) {
    if(kind==='race'&&!v.resetPrestige)check(ns.ChairmanPrestige.valid(v.prestige),'赛事声望须为0～100的整数，留空采用默认值。');
    return W().mutate(world,w=>{
      if(kind==='source'){
        const audit=w.referenceAudit.find(r=>r.sourceId===v.sourceId),source=ns.RaceRegistry.all().find(r=>r.id===v.sourceId),track=w.tracks.find(t=>t.id===v.trackId);check(audit&&source&&track&&!track.deleted,'来源赛事或选定马场不存在。');check(track.surfaces.includes(source.surface),'所选马场不支持该赛事场地。');
        const old=w.races.find(r=>r.sourceId===v.sourceId);check(!old,'来源赛事已经启用，请在赛历中编辑。');
        const record={...copy(audit),status:'modified',venueKey:track.key||null,reason:'玩家指定举办地；未作为官方核对结论。',sourceUrl:String(v.sourceUrl||audit.sourceUrl||''),checkedAt:null};
        w.races.push(sourceRace(w,source,track,{sourceRecord:record,sourceBaseline:copy(source)}));Object.assign(audit,record);
      }else if(kind==='populate'){
        const area=region(w,v.regionId);check(area&&!area.disabled&&Number.isInteger(v.count)&&v.count>=1&&v.count<=10000,'请选择启用地区与1～10000匹生成数量。');for(let i=0;i<v.count;i++)W().addHorse(w,{homeRegionId:area.id,homeRegion:area.name,age:2,sourceKind:'external'});
      }else if(kind==='region'){
        const old=region(w,v.id),r=old?{...copy(old),...copy(v)}:newRegion(w,v);validateRegion(r);
        check(!w.regions.some(a=>a.id!==r.id&&a.name===r.name),'地区名称已存在。');
        if(r.disabled)check(!w.venueAssignments.some(a=>a.frozen&&a.year>=year(w)&&w.tracks.find(t=>t.id===a.trackId)?.regionId===r.id)&&!Object.values(w.lockedRaces||{}).some(x=>x.regionId===r.id)&&!w.tracks.some(t=>t.regionId===r.id&&!t.deleted)&&!w.horses.some(h=>h.homeRegionId===r.id&&['active','juvenile'].includes(h.status)||h.booked?.targetRegionId===r.id||h.locationRegionId===r.id&&h.status==='active'||h.transit?.toRegionId===r.id)&&!(w.breeding?.manual||[]).some(p=>(p.homeRegionId||region(w,p.homeRegion)?.id)===r.id),'地区仍有在用马场、马匹、报名或繁殖安排，请先处理关联。');
        if(old&&(JSON.stringify(old.generation)!==JSON.stringify(r.generation)||JSON.stringify(old.environment)!==JSON.stringify(r.environment)))r.generationVersion=(old.generationVersion||1)+1;
        if(old&&w.honors?.associations[old.id]?.name===old.name+'马会')w.honors.associations[old.id].name=r.name+'马会';
        r.playerModified=true;if(old)Object.assign(old,r);else w.regions.push(r);
      }else if(kind==='track'){
        const old=w.tracks.find(t=>t.id===v.id),area=region(w,v.regionId||v.region);check(area&&!area.disabled,'请选择启用的地区。');
        const t=newTrack(w,area,{...(old||{}),...v,regionId:area.id,region:area.name});W().validateTrack(t,w);validateCourseProfiles(t);
        check(!w.tracks.some(x=>x.id!==t.id&&x.name===t.name),'马场名称已存在。');
        for(const r of w.races.filter(r=>!r.deleted&&r.trackId===t.id))check(!t.deleted&&t.surfaces.includes(r.surface),'马场仍有使用该场地的赛事。');
        for(const a of w.venueAssignments.filter(a=>a.frozen&&a.year>=year(w)&&a.trackId===t.id))check(!t.deleted,`该马场已锁定第${a.year}年举办安排。`);
        for(const [key,r]of Object.entries(w.lockedRaces||{}))if(Number(key.split(':')[0])>=year(w)&&r.trackId===t.id)check(!t.deleted,'马场仍有已锁定届次，不能停用。');
        t.playerModified=true;if(old)Object.assign(old,t);else w.tracks.push(t);
      }else if(kind==='race'){
        const old=w.races.find(r=>r.id===v.id),r={...(old||{id:mint(w,'race'),deleted:false}),...copy(v)};
        if(v.resetPrestige){r.prestige=ns.ChairmanPrestige.reference(r);r.prestigeOverride=false;}
        else if(Object.hasOwn(v,'prestige')){r.prestigeOverride=v.prestige!=null;}
        delete r.resetPrestige;ns.ChairmanPrestige.initialize(r);
        r.grade=r.raceClass==='op'&&r.grade==='L'?'L':labels[r.raceClass];W().validateRace(w,r);
        if(old?.lastHeldYear===year(w))r.notBeforeYear=year(w)+1;
        for(const a of w.venueAssignments.filter(a=>a.year===year(w)&&a.frozen&&a.races.some(x=>x.id===r.id)))check(a.races.find(x=>x.id===r.id).surface===r.surface,'本届举办地已锁定，不能改变所需草泥场地。');
        if(old?.sourceRecord)r.sourceRecord={...old.sourceRecord,status:'modified'};
        if(old)Object.assign(old,r);else w.races.push(r);
      }else if(kind==='meeting'){
        const old=w.meetingGroups.find(g=>g.id===v.id),g={id:old?.id||mint(w,'meeting'),yearOverrides:{},enabled:true,...copy(old),...copy(v)};
        validateGroup(w,g);
        for(const a of w.venueAssignments.filter(a=>a.groupId===g.id&&a.frozen))check(!g.yearOverrides[a.year]||g.yearOverrides[a.year]===a.trackId,'本届举办地已锁定，只能调整未来年度。');
        g.playerModified=true;if(old)Object.assign(old,g);else w.meetingGroups.push(g);
      }else if(kind==='traffic'){
        check(region(w,v.from)&&region(w,v.to)&&v.from!==v.to&&Number.isInteger(v.turns)&&v.turns>=0&&v.turns<=4,'交通地区或准备回合无效。');w.travelOverrides[[v.from,v.to].sort().join('|')]=v.turns;
      }else if(kind==='qualification'){
        check(w.editor?.enabled,'请先开启世界编辑模式。');const h=w.horses.find(h=>h.id===v.id);check(h&&Number.isInteger(v.value)&&v.value>=0&&v.value<=4,'参赛资格无效。');h.qualification=v.value;
      }
      synchronize(w);for(const g of w.meetingGroups)validateGroup(w,g);plan(w);validate(w);
      w.worldChanges.push({id:mint(w,'change'),turn:w.turn,kind,entityId:v.id||null,patch:copy(v)});
    });
  }
  function preview(w,kind,value) {const out=edit(w,kind,value);W().validateWorld(out.world);return {worldId:w.id,revision:w.revision,kind,value:copy(value),output:out};}
  function apply(w,p){check(p.worldId===w.id&&p.revision===w.revision,'世界已改变，请重新预览。');W().validateWorld(p.output.world);return p.output;}
  function validate(w) {
    check(w.worldSystemVersion===2&&['blank','reference'].includes(w.worldType),'新世界版本或类型无效。');
    for(const r of w.regions)validateRegion(r);
    for(const t of w.tracks)validateCourseProfiles(t);
    for(const h of w.horses){
      check(region(w,h.homeRegionId)&&region(w,h.locationRegionId),'马匹地区编号缺失。');check(Number.isInteger(h.qualification)&&h.qualification>=0&&h.qualification<=4,'马匹资格无效。');
      for(const t of [...(h.travelHistory||[]),...(h.transit?[h.transit]:[])])check(region(w,t.fromRegionId)&&region(w,t.toRegionId)&&Number.isInteger(t.departureTurn)&&Number.isInteger(t.arrivalTurn)&&t.arrivalTurn>=t.departureTurn&&['race','return'].includes(t.kind),'远征交通记录无效。');
      if(h.transit)check(h.locationRegionId===h.transit.fromRegionId,'在途马匹所在地与出发地不一致。');
      if(h.campaign)check(region(w,h.campaign.originRegionId)&&region(w,h.campaign.destinationRegionId)&&region(w,h.campaign.homeRegionId)&&Number.isInteger(h.campaign.createdTurn),'远征计划无效。');
    }
    for(const t of w.tracks){check(region(w,t.regionId),'马场地区编号缺失。');check(Array.isArray(t.configurations)&&t.configurations.length&&new Set(t.configurations.map(c=>c.id)).size===t.configurations.length,'赛道配置缺失或重复。');for(const c of t.configurations)check(t.surfaces.includes(c.surface)&&['东京','中山','京都','阪神','其他地方'].includes(c.courseType),'赛道场地或适性映射无效。');check(t.surfaces.every(s=>t.configurations.some(c=>c.surface===s)),'场地缺少赛道配置。');}
    for(const r of w.races){const t=w.tracks.find(t=>t.id===r.trackId);check(t,'赛事马场编号缺失。');if(!r.deleted&&r.courseConfigId)check(t.configurations.some(c=>c.id===r.courseConfigId&&c.surface===r.surface),'指定赛道不属于举办马场或场地不匹配。');}
    for(const g of w.meetingGroups)validateGroup(w,g);
    check(new Set(w.venueAssignments.map(a=>a.id)).size===w.venueAssignments.length,'年度举办记录重复。');
    for(const a of w.venueAssignments)check(w.meetingGroups.some(g=>g.id===a.groupId)&&w.tracks.some(t=>t.id===a.trackId)&&Number.isInteger(a.year)&&a.year>=1&&(!a.frozen||Array.isArray(a.races)&&a.races.every(r=>r.trackId===a.trackId)),'年度举办记录无效。');
  }
  ns.ChairmanWorld={courseLabel,courseProfile,courseRows,isV2,classes,labels,graded,defaults,newRegion,newTrack,profile,region,horseInput,initializeHorse,synchronize,travelTurns,route,travelTick,travelBurden,reconcileCampaign,groupFor,resolveRace,refreshAssignments,freeze,rememberActual,validateGroup,eligible,recordPerformance,create,assertReady,plan,editKinds,edit,preview,apply,validate,prizes,sourceRace};
})();
