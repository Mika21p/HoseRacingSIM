(function(){
  'use strict';
  const ns=window.Keiba,W=()=>ns.ChairmanRules,B=()=>ns.ChairmanBreeding;
  const copy=v=>v===undefined?undefined:W().clone(v),equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
  const check=(v,m)=>{if(!v)throw Error(m);};
  const identity=['name','originalName','aliases','pinyin','romanizedName','gender','coat','owner','homeRegion','fatherId','motherId','birthYear'];
  const traits=['strength','weight','temperamentLabel','heavyType','surfaceGrades','trackAptitudes','distMin','coreDist','distMax','growthType','peakStart','peakEnd'];
  const templateFields=['name','displayName','originalName','aliases','pinyin','romanizedName','gender','coat','birthYear','fatherId','motherId','region','regionTags','game','disabled'];
  function initialize(w){w.editor||={version:1,enabled:false,acknowledged:false,undo:null};w.templateOverrides||=[];}
  function enabled(w){return w.editor?.enabled===true;}
  function templates(w){const overrides=new Map((w.templateOverrides||[]).map(o=>[o.id,o])),rows=[...(ns.ChairmanPedigrees?.records||[]),...(w.familyTemplates||[])],ids=new Set(rows.map(t=>t.id));for(const o of overrides.values())if(!ids.has(o.id))rows.push(o.baseline);return rows.map(t=>{const o=overrides.get(t.id);return o?{...copy(o.baseline),...copy(o.patch),playerModified:Object.keys(o.patch).length>0}:t;});}
  function staticTemplates(w){const imported=new Set((w.familyTemplates||[]).map(t=>t.id));return templates(w).filter(t=>!imported.has(t.id));}
  function familyTemplates(w){const ids=new Set((w.familyTemplates||[]).map(t=>t.id));return templates(w).filter(t=>ids.has(t.id));}
  function template(w,id){return templates(w).find(t=>t.id===id);}
  function publicTemplate(w,t){return Object.fromEntries(['id','name','displayName','originalName','aliases','pinyin','romanizedName','gender','coat','birthYear','historicalBirthYear','fatherId','motherId','region','regionTags','sourceUrl','sourceKey','grade','core','disabled','playerModified','status','source'].filter(k=>t[k]!==undefined).map(k=>[k,copy(t[k])]));}
  function project(w,h){
    const keys=[...identity,'id','origin','sourceKind','status','annual','lifetime','booked','target','seriesTarget','seriesTitles','locationRegion','restUntil','editedByWorld'];
    const p=Object.fromEntries(keys.filter(k=>h[k]!==undefined).map(k=>[k,copy(h[k])]));
    if(enabled(w)||h.origin==='custom'){p.real=Object.fromEntries(traits.filter(k=>h[k]!==undefined).map(k=>[k,copy(h[k])]));p.real.breedingStrength=h.breeding?.strength??h.breedingStrength??null;p.real.decline=h.maturity?.decline??null;p.real.lastInjury=copy(h.lastInjury);}
    return p;
  }
  function diff(before,after,path=[],out=[]){
    if(equal(before,after))return out;
    if(Array.isArray(before)&&Array.isArray(after)&&before.length===after.length&&before.every(x=>x&&typeof x==='object'&&x.id)&&after.every(x=>x&&typeof x==='object'&&x.id)&&before.every(x=>after.some(y=>y.id===x.id))){const map=new Map(after.map(x=>[x.id,x]));for(const x of before)diff(x,map.get(x.id),[...path,{id:x.id}],out);return out;}
    if(before&&after&&typeof before==='object'&&typeof after==='object'&&Array.isArray(before)===Array.isArray(after)&&(!Array.isArray(before)||before.length===after.length)){
      for(const k of new Set([...Object.keys(before),...Object.keys(after)]))diff(before[k],after[k],[...path,k],out);
    }else out.push({path,beforeExists:before!==undefined,afterExists:after!==undefined,...(before!==undefined?{before:copy(before)}:{}),...(after!==undefined?{after:copy(after)}:{})});return out;
  }
  function semantic(w){const v={...w,horses:w.horses.map(h=>({...h,annual:{...h.annual,runs:h.annual.runs||[]}}))};for(const k of ['id','ui','editor','revision','savedAt','officeVersion'])delete v[k];return v;}
  function stable(v){if(Array.isArray(v)){const a=v.every(x=>x&&typeof x==='object'&&x.id)?v.slice().sort((a,b)=>a.id.localeCompare(b.id)):v;return a.map(stable);}return v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,stable(v[k])])):v;}
  function signature(w){return ns.ChairmanRatings.hash(JSON.stringify(stable(semantic(w))));}
  function toggle(world,on){return W().mutate(world,w=>{initialize(w);w.editor.enabled=!!on;if(on)w.editor.acknowledged=true;else {const reset=p=>{if(!p||typeof p!=='object')return;if(['strength','breedingStrength'].includes(p.sort))p.sort=p.normalSort??(p.view?'':'tf');for(const v of Object.values(p))if(v&&typeof v==='object')reset(v);};reset(w.ui);}});}
  function validateTemplates(w){
    const rows=templates(w),map=new Map(rows.map(t=>[t.id,t])),children=new Map(),degree=new Map();
    check(map.size===rows.length,'模板身份重复。');
    for(const t of rows){check(typeof(t.displayName||t.name||t.originalName)==='string'&&(t.displayName||t.name||t.originalName).trim(),'请填写模板名字。');check(['牡马','牝马','骟马'].includes(t.gender)&&Number.isSafeInteger(t.birthYear),'模板性别或出生年份无效。');
      const g=t.game||{};if(g.breedingBase!=null)check(Number.isInteger(g.breedingBase)&&g.breedingBase>=1&&g.breedingBase<=100,'配种实力基准须为1～100整数。');
      if(g.distance!=null)check(Number.isInteger(g.distance)&&g.distance>0,'参考距离须为正整数。');if(g.surface!=null)check(['草地','泥地'].includes(g.surface),'场地倾向无效。');if(g.growthType!=null)check(growths().includes(g.growthType),'成长类型无效。');
      let count=0;for(const [key,sex]of [['fatherId','牡马'],['motherId','牝马']])if(t[key]){const p=map.get(t[key]);check(p&&p.gender===sex&&p.birthYear<=t.birthYear-3,`${t.displayName||t.name}的父母年代、性别或关联无效。`);count++;if(!children.has(p.id))children.set(p.id,[]);children.get(p.id).push(t.id);}degree.set(t.id,count);
    }
    const q=[...degree].filter(([,n])=>!n).map(([id])=>id);for(let i=0;i<q.length;i++)for(const id of children.get(q[i])||[]){degree.set(id,degree.get(id)-1);if(!degree.get(id))q.push(id);}check(q.length===rows.length,'模板血统存在循环。');
  }
  function growths(){return ['早熟','普早','普迟','晚熟'];}
  function patchTemplate(w,id,patch,reset){
    let o=w.templateOverrides.find(o=>o.id===id);const raw=[...(ns.ChairmanPedigrees?.records||[]),...(w.familyTemplates||[])].find(t=>t.id===id)||o?.baseline;check(raw,'模板不存在。');
    if(!o){o={id,baseline:copy(raw),sourceVersion:ns.ChairmanPedigrees?.version||1,patch:{}};w.templateOverrides.push(o);}
    if(reset)o.patch={};else{for(const k of Object.keys(patch))check(templateFields.includes(k),'不允许编辑模板字段：'+k);Object.assign(o.patch,copy(patch));}
    const t=template(w,id);if(t.game)check(Object.keys(t.game).every(k=>['breedingBase','distance','surface','growthType','note'].includes(k)),'无效生成预设。');validateTemplates(w);
  }
  function patchHorse(w,id,patch){
    const h=B().get(w,id);check(h,'个体不存在。');for(const k of Object.keys(patch))check([...identity,...traits,'age','breedingStrength'].includes(k),'不允许编辑字段：'+k);
    const old=copy(h),v=copy(patch),nodes=B().all(w),archive=h.status==='ancestor'&&!h.strength;
    if(v.age!=null){check(Number.isSafeInteger(v.age)&&v.age>=(h.status==='juvenile'?0:2),'当前年龄无效。');v.birthYear=W().date(w.turn).year-v.age;delete v.age;}
    if(h.status==='juvenile'&&v.birthYear!=null)check(v.birthYear===h.birthYear,'幼驹年龄由出生流程管理，不能提前出道。');
    if(v.birthYear!=null&&v.birthYear!==h.birthYear)check(!h.lifetime?.starts&&!nodes.some(c=>c.fatherId===id||c.motherId===id),'已有出赛或子代记录的马不能修改年龄。');
    if(v.gender&&v.gender!==h.gender&&h.breeding?.everActive)check(false,'已有繁殖身份，不能修改性别。');
    if(archive)check(Object.keys(v).every(k=>identity.includes(k)),'纯祖先档案无模拟参数。');
    if(v.breedingStrength!=null){check(h.breeding&&Number.isInteger(v.breedingStrength)&&v.breedingStrength>=1&&v.breedingStrength<=100,'配种实力须为1～100整数，且已启用繁殖。');h.breeding.strength=v.breedingStrength;delete v.breedingStrength;}
    if(h.sourceKind==='bred'&&['birthYear','fatherId','motherId'].some(k=>v[k]!==undefined&&!equal(v[k],h[k])))h.birthFacts||={birthYear:h.birthYear,fatherId:h.fatherId,motherId:h.motherId};
    if(w.worldSystemVersion===2&&v.homeRegion!=null){const area=ns.ChairmanWorld.region(w,v.homeRegion);check(area&&!area.disabled,'请选择启用地区。');h.homeRegionId=area.id;}
    Object.assign(h,v);check(typeof h.name==='string'&&h.name.trim(),'请填写马名。');if(h.aliases)check(Array.isArray(h.aliases)&&h.aliases.every(v=>typeof v==='string'),'别名无效。');
    if(h.growthType)check(growths().includes(h.growthType),'成长类型无效。');
    if(!archive){W().validateHorse(w,h);h.distType=W().category(h.coreDist);if(old.temperamentLabel!==h.temperamentLabel)h.temperament=ns.HorseRules.temperamentValue(h.temperamentLabel);if(old.coat!==h.coat)h.coatEn=ns.HorseRules.COATS.find(c=>c.name===h.coat)?.en||'';}
    if(old.birthYear!==h.birthYear&&h.maturity)h.maturity.lastCheckedIndex=W().timeFor(w,h).index;
    const qualifying=['gender','birthYear','homeRegion'];
    if(qualifying.some(k=>!equal(old[k],h[k]))&&h.booked&&(w.lockedRaces?.[`${W().date(h.booked.turn).year}:${h.booked.raceId}`]||h.booked.preparationTurn!=null&&h.booked.preparationTurn<=w.turn))throw Error('该马已有锁定报名或远征准备，请完成该安排后再修改性别、年龄或归属。');
    const related=new Map(nodes.map(n=>[n.id,n]));for(const n of nodes)for(const [key,sex]of [['fatherId','牡马'],['motherId','牝马']])if(n[key]){const p=related.get(n[key]);check(p&&p.gender===sex&&p.birthYear<=n.birthYear-2,'父母关联、性别或年代冲突。');}
    B().validate(w);
    for(const p of w.breeding?.manual||[])B().legalPair(w,p.fatherId,p.motherId);
    if(!equal(old,h))h.editedByWorld=true;
    if(qualifying.some(k=>!equal(old[k],h[k])))W().planEntries(w);
    return {children:nodes.filter(c=>c.fatherId===id||c.motherId===id).length};
  }
  function preview(world,kind,id,patch={},options={}){
    check(enabled(world),'请先开启世界编辑模式。');check(['horse','template'].includes(kind),'编辑对象无效。');
    const target=kind==='horse'?B().get(world,id):template(world,id);check(target,'编辑对象不存在。');let effect={};
    const out=W().mutate(world,(w)=>{initialize(w);if(kind==='horse')effect=patchHorse(w,id,patch);else patchTemplate(w,id,patch,options.reset);W().validateWorld(w);});
    const after=kind==='horse'?B().get(out.world,id):template(out.world,id),changes=diff(target,after).filter(d=>!['editedByWorld','playerModified'].includes(d.path[0]));
    return {worldId:world.id,revision:world.revision,kind,id,patch:copy(patch),reset:!!options.reset,changes,effect,name:target.displayName||target.name||target.originalName};
  }
  function apply(world,p){
    check(p.worldId===world.id&&p.revision===world.revision,'游戏已改变，请重新预览。');const checked=preview(world,p.kind,p.id,p.patch,{reset:p.reset});check(checked.changes.length,'没有实际修改。');
    const out=W().mutate(world,w=>{initialize(w);if(p.kind==='horse')patchHorse(w,p.id,p.patch);else patchTemplate(w,p.id,p.patch,p.reset);});
    const id=`edit:${out.world.revision}`,changes=diff(semantic(world),semantic(out.world));out.world.editor.undo={id,changes,signature:signature(out.world)};
    out.editorRecords=[{id,year:W().date(world.turn).year,turn:world.turn,kind:p.kind,targetId:p.id,name:checked.name,changes:checked.changes,action:'edit'}];out.editorCheckpoint=true;return out;
  }
  function canUndo(w){return !!w.editor?.undo&&w.editor.undo.signature===signature(w);}
  function undo(world){check(enabled(world),'请先开启世界编辑模式。');check(canUndo(world),'已有后续游戏数据变更，请使用编辑恢复点。');const u=world.editor.undo;
    const out=W().mutate(world,w=>{for(const d of u.changes){let obj=w;for(const k of d.path.slice(0,-1))obj=typeof k==='object'?obj.find(v=>v.id===k.id):obj[k];if(d.beforeExists)obj[d.path.at(-1)]=copy(d.before);else delete obj[d.path.at(-1)];}w.editor.undo=null;});
    W().validateWorld(out.world);out.editorRecords=[{id:`edit:${out.world.revision}`,year:W().date(world.turn).year,turn:world.turn,action:'undo',undoId:u.id,name:'撤销最近编辑'}];out.editorCheckpoint=true;return out;
  }
  function validate(w){if(!w.editor)return;check(w.editor.version===1&&typeof w.editor.enabled==='boolean'&&Array.isArray(w.templateOverrides),'编辑模式数据无效。');check(new Set(w.templateOverrides.map(o=>o.id)).size===w.templateOverrides.length,'模板覆盖重复。');for(const o of w.templateOverrides)check(o.baseline?.id===o.id&&o.patch&&Object.keys(o.patch).every(k=>templateFields.includes(k)),'模板覆盖内容无效。');
    if(w.editor.undo){check(Array.isArray(w.editor.undo.changes),'撤销记录无效。');for(const d of w.editor.undo.changes)check(Array.isArray(d.path)&&d.path.length&&d.path.every(k=>typeof k==='object'?k&&typeof k.id==='string':typeof k==='string'&&!['__proto__','prototype','constructor'].includes(k)),'撤销路径无效。');}
    if(w.templateOverrides.length)validateTemplates(w);}
  ns.ChairmanEditor={initialize,enabled,templates,staticTemplates,familyTemplates,template,publicTemplate,project,toggle,preview,apply,undo,canUndo,validate,signature,growths};
})();
