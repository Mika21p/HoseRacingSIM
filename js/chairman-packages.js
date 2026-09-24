(function () {
  'use strict';
  const ns=window.Keiba,W=()=>ns.ChairmanRules,B=()=>ns.ChairmanBreeding,S=()=>ns.ChairmanSeries;
  const check=(ok,message)=>{if(!ok)throw new Error(message);}, clone=x=>W().clone(x);
  const pick=(o,keys)=>Object.fromEntries(keys.filter(k=>o[k]!==undefined).map(k=>[k,clone(o[k])]));
  const identity=h=>h.familySourceKey||(h.templateId?'jbis:'+h.templateId:'');
  const hash=o=>String(ns.ChairmanRatings.hash(JSON.stringify(o)));
  const raceFields=['id','name','raceClass','surface','distance','month','half','ageRule','sexRule','capacity','prizes','trackId'];
  const seriesFields=['id','name','title','raceIds','ageRule','bonus','honorWeight'];
  const nodeFields=['id','sourceKey','name','originalName','aliases','pinyin','romanizedName','gender','coat','birthYear','historicalBirthYear','fatherId','motherId','region','sourceUrl','grade','playerModified'];
  const bands={'较低':[1,39],'普通':[40,59],'良好':[60,74],'优秀':[75,89],'顶级':[90,100]};
  function envelope(kind,id,data){return {format:'keiba-chairman-content',version:2,kind,id,revision:hash(data),...data};}
  function exportEvents(w,options={}){
    if(w.worldSystemVersion===2)return ns.ChairmanWorldPackages.exportEvents(w,options);
    const series=w.series.filter(s=>!s.deleted&&(!options.seriesIds||options.seriesIds.includes(s.id))&&(options.seriesIds||!options.raceIds));
    const ids=new Set([...(options.raceIds||[]),...series.flatMap(s=>s.raceIds)]),races=w.races.filter(r=>!r.deleted&&(!options.raceIds&&!options.seriesIds||ids.has(r.id)));
    check(races.length,'没有可导出的比赛。');const tracks=w.tracks.filter(t=>races.some(r=>r.trackId===t.id)),regions=W().regions(w).filter(r=>tracks.some(t=>t.region===r.name));
    return envelope('events','events:'+w.id,{regions:regions.map(r=>pick(r,['id','name','baseRegion','autoPopulate'])),tracks:tracks.map(t=>pick(t,['id','name','region','courseType','surfaces'])),races:races.map(r=>pick(r,raceFields)),series:series.map(s=>pick(s,seriesFields))});
  }
  function exportFamily(w,ids){
    check(Array.isArray(ids)&&ids.length,'请选择家族主体。');
    const worldMap=new Map(B().all(w).map(h=>[h.id,h])),local=new Map((ns.ChairmanEditor?.familyTemplates(w)||w.familyTemplates||[]).map(h=>[h.id,h])),base=new Map((ns.ChairmanEditor?.staticTemplates(w)||ns.ChairmanPedigrees?.records||[]).map(h=>[h.id,h]));
    const nodes=new Map(),stack=[...ids];
    while(stack.length){const id=stack.pop();if(nodes.has(id))continue;
      const h=worldMap.get(id)||local.get(id)||base.get(id);check(h,`血统引用缺失：${id}`);
      const isWorld=worldMap.has(id),isLocal=local.has(id),pub=isWorld?B().publicHorse(w,h):h;
      const row={id,sourceKey:identity(h)||h.sourceKey||(isWorld?`world:${w.id}:${id}`:`jbis:${id}`),name:h.name||h.displayName||h.originalName,originalName:h.originalName||h.name||h.displayName,
        aliases:h.aliases||[],pinyin:h.pinyin||'',romanizedName:h.romanizedName||h.originalName||h.name||'',gender:h.gender,coat:h.coat||'',birthYear:h.birthYear,
        historicalBirthYear:h.historicalBirthYear??(!isWorld&&!isLocal?h.birthYear:null),fatherId:h.fatherId||'',motherId:h.motherId||'',region:h.homeRegion||h.region||'',sourceUrl:h.sourceUrl||'',grade:bands[pub.grade]?pub.grade:'未公开',playerModified:!!(h.playerModified||h.editedByWorld)};
      nodes.set(id,row);if(row.fatherId)stack.push(row.fatherId);if(row.motherId)stack.push(row.motherId);
    }
    const data={roots:ids,nodes:[...nodes.values()].sort((a,b)=>a.id.localeCompare(b.id))};validateFamily(data);
    return envelope('family','family:'+w.id+':'+hash(ids.slice().sort()),data);
  }
  function validateFamily(data){
    check(Array.isArray(data.nodes)&&data.nodes.length&&Array.isArray(data.roots)&&data.roots.length,'家系主体或节点缺失。');
    const map=new Map(data.nodes.map(h=>[h.id,h]));check(map.size===data.nodes.length&&data.roots.every(id=>map.has(id)),'家系编号重复或主体缺失。');
    check(new Set(data.nodes.map(h=>h.sourceKey)).size===data.nodes.length,'家系来源身份重复，请合并共享祖先。');
    const children=new Map(),degree=new Map();
    for(const h of data.nodes){
      check(typeof h.id==='string'&&h.id&&typeof h.sourceKey==='string'&&h.sourceKey&&typeof h.name==='string'&&h.name.trim()&&['牡马','牝马','骟马'].includes(h.gender)&&Number.isSafeInteger(h.birthYear),'家系身份或出生年份无效。');
      check(Array.isArray(h.aliases||[])&&(h.aliases||[]).every(v=>typeof v==='string'),'家系别名无效。');
      check(h.grade==null||h.grade==='未公开'||bands[h.grade],'配种档位无效。');
      let n=0;for(const [key,sex] of [['fatherId','牡马'],['motherId','牝马']])if(h[key]){const p=map.get(h[key]);check(p&&p.gender===sex&&p.birthYear<=h.birthYear-3,`${h.name}父母缺失、性别或年代无效。`);n++;if(!children.has(p.id))children.set(p.id,[]);children.get(p.id).push(h.id);}degree.set(h.id,n);
    }
    const queue=[...degree].filter(([,n])=>!n).map(([id])=>id);for(let i=0;i<queue.length;i++)for(const id of children.get(queue[i])||[]){degree.set(id,degree.get(id)-1);if(!degree.get(id))queue.push(id);}
    check(queue.length===data.nodes.length,'家系存在循环。');return queue;
  }
  function validatePackage(p){
    check(p&&p.format==='keiba-chairman-content'&&[1,2].includes(p.version)&&['events','family'].includes(p.kind)&&typeof p.id==='string'&&p.id&&typeof p.revision==='string','内容包格式或版本不支持。');
    if(p.kind==='family')validateFamily(p);else for(const key of ['regions','tracks','races','series'])check(Array.isArray(p[key])&&new Set(p[key].map(v=>v.id)).size===p[key].length,`${key}数据缺失或编号重复。`);
  }
  // Preview is a pure draft operation. Only the final output may be committed.
  function* previewSteps(world,p,options={}){
    validatePackage(p);if(p.kind==='events'&&(p.worldSystemVersion===2||world.worldSystemVersion===2))return yield* ns.ChairmanWorldPackages.previewSteps(world,p,options);let w=clone(world);S().initialize(w);const changes=[],warnings=[],errors=[],maps={},mode=options.mode||'skip',bindings=options.mappings||{},renames=options.renames||{};
    const mint=prefix=>`${prefix}-${w.nextId++}`;
    function mapped(kind,row,collection){
      const key=`${p.id}:${kind}:${row.id}`,source=w.sourceMappings.find(r=>r.id===key),bound=bindings[`${kind}:${row.id}`];
      const existing=collection.find(v=>v.id===(bound||source?.localId));
      if(bound)check(existing,`${row.name}映射的本地对象不存在。`);
      const reuse=!!existing&&(bound||mode!=='copy'),id=reuse?existing.id:mint(kind);
      const updating=reuse&&!bound&&mode==='update'&&source?.hash!==hash(row),skip=reuse&&!updating;
      const name=String(renames[`${kind}:${row.id}`]||row.name||'').trim();
      if(!reuse&&collection.some(v=>v.name===name))throw new Error(`${kind}:${row.id} 名称“${name}”已存在，请明确映射或改名。`);
      maps[`${kind}:${row.id}`]=id;
      const result={id,existing,reuse,skip,name,key,updating};
      if(!skip||bound){const m={id:key,packageId:p.id,kind,sourceId:row.id,localId:id,revision:p.revision,hash:hash(row)};if(source)Object.assign(source,m);else w.sourceMappings.push(m);}
      changes.push({kind,sourceId:row.id,id,name,action:skip?'复用／跳过':updating?'更新':'新增',before:updating?pick(existing,Object.keys(row)):null,after:updating?row:null});return result;
    }
    if(p.kind==='family'){
      const ids=new Map(),known=new Map(w.familyTemplates.map(t=>[t.sourceKey,t]));for(const row of p.nodes){const source=known.get(row.sourceKey);let m;
        if(source&&mode!=='copy'){m={id:source.id,skip:mode!=='update',existing:source};changes.push({kind:'family',id:m.id,name:row.name,action:m.skip?'复用／跳过':'更新',before:mode==='update'?pick(source,nodeFields):null,after:mode==='update'?pick(row,nodeFields):null});}
        else{m={id:mint('family'),skip:false};changes.push({kind:'family',id:m.id,name:row.name,action:'新增'});}ids.set(row.id,m);
      }
      for(let i=0;i<p.nodes.length;i++){
        const row=p.nodes[i],m=ids.get(row.id);if(!m.skip){const value={...pick(row,nodeFields),id:m.id,fatherId:row.fatherId?ids.get(row.fatherId).id:'',motherId:row.motherId?ids.get(row.motherId).id:'',sourceKey:mode==='copy'?`${row.sourceKey}:copy:${m.id}`:row.sourceKey,packageId:p.id,packageRevision:p.revision,core:p.roots.includes(row.id),source:'imported',status:'template'};
          if(m.existing)Object.assign(m.existing,value);else w.familyTemplates.push(value);const override=w.templateOverrides?.find(o=>o.id===m.id);if(override)override.baseline=clone(value);
        }if(i%100===0)yield {done:i,total:p.nodes.length,name:'校验家系模板'};
      }
      validateFamily({roots:w.familyTemplates.filter(t=>t.core).map(t=>t.id),nodes:w.familyTemplates});
    }else{
      for(const r of p.regions){const native=W().REGIONS.includes(r.name),existing=native?W().regions(w).find(v=>v.name===r.name):null;
        if(native){check(r.baseRegion===r.name,'原生地区不能改变参考环境。');maps['region:'+r.id]=existing.id;changes.push({kind:'region',id:existing.id,name:r.name,action:'复用'});continue;}
        const m=mapped('region',r,w.regions);check(W().REGIONS.includes(r.baseRegion),'地区参考环境无效。');if(!m.skip){const v={id:m.id,name:m.name,baseRegion:r.baseRegion,autoPopulate:!!r.autoPopulate};if(m.existing)Object.assign(m.existing,v);else w.regions.push(v);}
      }
      for(const t of p.tracks){const region=p.regions.find(r=>r.name===t.region);check(region,'马场引用缺失地区。');const localRegion=w.regions.find(r=>r.id===maps['region:'+region.id]);const m=mapped('track',t,w.tracks);
        if(m.skip){check(m.existing.region===localRegion.name&&t.surfaces.every(s=>m.existing.surfaces.includes(s)),'复用马场的地区或场地支持不匹配。');continue;}
        const v={...pick(t,['courseType','surfaces']),id:m.id,name:m.name,region:localRegion.name};W().validateTrack(v,w);if(m.existing)Object.assign(m.existing,v);else w.tracks.push(v);
      }
      for(let i=0;i<p.races.length;i++){const r=p.races[i],m=mapped('race',r,w.races),trackId=maps['track:'+r.trackId];check(trackId,'比赛缺少马场关联。');if(!m.skip){const v={...(m.existing||{}),...pick(r,raceFields),id:m.id,name:m.name,trackId,grade:r.raceClass==='op'?'OP':r.raceClass.toUpperCase(),deleted:false};W().validateRace(w,v);if(m.existing?.lastHeldYear===W().date(w.turn).year)v.notBeforeYear=W().date(w.turn).year+1;if(m.existing)Object.assign(m.existing,v);else w.races.push(v);}if(i%100===0)yield {done:i,total:p.races.length,name:'校验赛事包'};}
      for(const d of p.series){const m=mapped('series',d,w.series);if(m.skip)continue;const value={...pick(d,seriesFields),id:m.id,name:m.name,raceIds:d.raceIds.map(id=>{check(maps['race:'+id],'系列引用缺失比赛。');return maps['race:'+id];})};
        const valid=S().validateDefinition(w,value);warnings.push(...valid.warnings);const out=S().edit(w,value,{acceptWarnings:true,deferPlanning:true});w=out.world;
      }
    }
    if(p.kind==='events')W().planEntries(w);
    W().validateWorld(w);validateWorld(w);w.revision=world.revision+1;
    return {baseRevision:world.revision,worldId:world.id,kind:p.kind,changes,warnings,errors,output:{world:w}};
  }
  function preview(w,p,o){const g=previewSteps(w,p,o);for(;;){const n=g.next();if(n.done)return n.value;}}
  function apply(world,prepared,acceptWarnings){check(prepared.worldId===world.id&&prepared.baseRevision===world.revision,'游戏已改变，请重新预览。');check(!prepared.warnings.length||acceptWarnings,'请先确认导入警告。');W().validateWorld(prepared.output.world);validateWorld(prepared.output.world);return prepared.output;}
  function introduce(world,id,options={}){
    check(world.breeding,'请先启用自动繁殖。');
    return W().mutate(world,w=>{
      S().initialize(w);const byId=new Map((ns.ChairmanEditor?.templates(w)||w.familyTemplates).map(t=>[t.id,{...t,name:t.displayName||t.name||t.originalName,sourceKey:t.sourceKey||'jbis:'+t.id}])),root=byId.get(id);check(root&&!root.disabled,'家系模板不存在或已停用。');
      const age=Number(options.age??10),region=options.region||W().regionNames(w)[0];check(Number.isSafeInteger(age)&&age>=3,'引入年龄须为至少三岁的整数。');W().regionBase(w,region);
      const archive=root.gender==='骟马';check(archive||age<(root.gender==='牡马'?25:22),'此年龄已达到繁殖引退上限。');
      const existing=new Map(B().all(w).filter(h=>identity(h)).map(h=>[identity(h),h]));check(!existing.has(root.sourceKey),'该来源个体已经存在，不能重复引入或恢复年轻。');
      const pending=[id],wanted=new Map();while(pending.length){const k=pending.pop();if(wanted.has(k))continue;const t=byId.get(k);check(t,'家系祖先缺失。');wanted.set(k,t);if(t.fatherId)pending.push(t.fatherId);if(t.motherId)pending.push(t.motherId);}
      const ordered=validateFamily({roots:[id],nodes:[...wanted.values()]}),shift=W().date(w.turn).year-age-root.birthYear,ids=new Map();
      for(const k of ordered){const t=byId.get(k),h=existing.get(t.sourceKey),birth=t.birthYear+shift;if(h){check(h.birthYear===birth&&h.gender===t.gender,`${t.name}与现有祖先年代不一致。`);ids.set(k,h.id);}else ids.set(k,`family-horse-${w.nextId++}`);}
      const random=ns.Random.seeded(w.contentState.rngState),breedingRng=w.breeding.rngState;
      ns.Random.withSource(random,()=>{
        for(const k of ordered){const t=byId.get(k);if(existing.has(t.sourceKey)){const h=existing.get(t.sourceKey);check((h.fatherId||'')===(t.fatherId?ids.get(t.fatherId):'')&&(h.motherId||'')===(t.motherId?ids.get(t.motherId):''),'复用祖先的亲缘关系不一致。');continue;}
          const common={id:ids.get(k),name:t.name,originalName:t.originalName||t.name,aliases:clone(t.aliases||[]),romanizedName:t.romanizedName||t.name,pinyin:t.pinyin||'',gender:t.gender,coat:t.coat||'',birthYear:t.birthYear+shift,historicalBirthYear:t.historicalBirthYear??null,homeRegion:region,sourceKind:'imported-family',familySourceKey:t.sourceKey,familyTemplateId:t.id,templateId:t.sourceKey.startsWith('jbis:')&&ns.ChairmanPedigrees.records.some(r=>'jbis:'+r.id===t.sourceKey)?t.sourceKey.slice(5):'',sourceUrl:t.sourceUrl||'',fatherId:t.fatherId?ids.get(t.fatherId):'',motherId:t.motherId?ids.get(t.motherId):''};
          if(k!==id||archive){w.pedigrees.push({...common,status:'ancestor',origin:'ai'});continue;}
          const band=bands[t.grade],strength=t.game?.breedingBase!=null?Math.max(1,Math.min(100,t.game.breedingBase+ns.Random.rollRange(-5,5))):band&&w.breeding?.version===1?ns.Random.rollRange(...band):null;
          const h=W().addHorse(w,{...common,origin:'ai',status:'retired',retiredYear:W().date(w.turn).year,...(strength!=null?{breedingStrength:strength}:{})});
          if(strength==null&&w.breeding.version===1){const parents=[common.fatherId,common.motherId].map(id=>B().get(w,id)?.breeding?.strength??50);const a=Math.max(1,Math.min(100,1+99*(h.strength-62)/38));h.breeding.strength=Math.round(.7*ns.Random.roll(100)+.2*(parents[0]+parents[1])/2+.1*a);}
          if(t.game?.distance){h.coreDist=t.game.distance;h.distMin=Math.max(1,h.coreDist-400);h.distMax=h.coreDist+400;h.distType=W().category(h.coreDist);}if(t.game?.surface){h.surfaceGrades[t.game.surface==='泥地'?'dirt':'grass']='A';}if(t.game?.growthType){h.growthType=t.game.growthType;const peak=ns.HorseRules.generatePeak(h.growthType);h.peakStart=peak.start;h.peakEnd=peak.end;}
          h.breeding.status='candidate';h.breeding.pinned=!!options.pinned;h.breeding.joinedYear=W().date(w.turn).year;
          if(options.pinned){h.breeding.status='active';h.breeding.everActive=true;}
        }
      });
      w.contentState.rngState=random.state();w.breeding.rngState=breedingRng;W().validateWorld(w);
    });
  }
  function validateWorld(w){
    if(!w.contentState)return;
    check(w.contentState.version===1&&Number.isInteger(w.contentState.rngState)&&Array.isArray(w.familyTemplates)&&Array.isArray(w.sourceMappings),'内容资料状态无效。');
    if(w.familyTemplates.length)validateFamily({roots:w.familyTemplates.filter(t=>t.core).map(t=>t.id),nodes:w.familyTemplates});
    check(new Set(w.sourceMappings.map(r=>r.id)).size===w.sourceMappings.length,'内容包来源映射重复。');
    const collections={region:W().regions(w),track:w.tracks,race:w.races,series:w.series,meeting:w.meetingGroups||[]};for(const r of w.sourceMappings)check(collections[r.kind]?.some(v=>v.id===r.localId),'内容包映射引用不存在的对象。');
    const sources=new Set();for(const h of B().all(w))if(identity(h)){check(!sources.has(identity(h)),'同一家系来源被重复实例化。');sources.add(identity(h));}
  }
  ns.ChairmanPackages={exportEvents,exportFamily,validatePackage,validateFamily,previewSteps,preview,apply,introduce,validateWorld,bands};
})();
