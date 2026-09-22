(function () {
  'use strict';
  const ns=window.Keiba,W=ns.ChairmanRules,V=ns.ChairmanWorld;
  function create(c){
    const {escape:e,button:b,input,select,modal}=c;
    let prepared=null,referencePrepared=null,creation=null,view='races',offset=0,prefs={};
    for(const eventName of ['input','change'])c.dialog.addEventListener(eventName,event=>{if(event.target.form?.dataset.form==='world:create')updateWizard(event.target.form);});
    const year=()=>W.date(c.world.turn).year;
    const form=(kind,id,html)=>`<form data-form="world:${kind}" data-id="${e(id||'')}">${html}<div class="cm-sticky-actions"><button>预览并校验</button></div></form>`;
    const check=(key,label,on)=>`<label class="cm-check"><input type="checkbox" name="${e(key)}" ${on?'checked':''}>${e(label)}</label>`;
    const multi=(key,label,rows,values)=>`<fieldset><legend>${e(label)}</legend>${rows.map(([id,name])=>`<label class="cm-check"><input type="checkbox" name="${e(key)}" value="${e(id)}" ${values.includes(id)?'checked':''}>${e(name)}</label>`).join('')}</fieldset>`;
    const table=(head,rows)=>`<div class="cm-table-wrap"><table><thead><tr>${head.map(v=>`<th>${e(v)}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map(v=>`<td>${v}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
    const regionChoices=()=>c.world.regions.filter(r=>!r.disabled).map(r=>[r.id,r.name]);
    function referenceDetails(change){
      const collection={race:'races',track:'tracks',region:'regions',meeting:'meetingGroups'}[change.kind],before=change.before||{},after=referencePrepared.output.world[collection]?.find(x=>x.id===change.id)||change.after||{};
      const labels={name:'名称',country:'国家',area:'上级分组',annualTarget:'年度目标',trafficGroup:'交通组',originalName:'原名',state:'行政区',city:'城市',surfaces:'支持场地',surface:'场地',raceClass:'级别',grade:'显示格付',month:'月份',half:'半月',distance:'距离',ageRule:'年龄',sexRule:'性别',capacity:'名额',prizes:'前五名奖金',trackId:'马场',regionId:'地区',courseConfigId:'赛道',mode:'举办方式',startYear:'起始年',trackIds:'候选顺序',raceIds:'成员赛事',yearOverrides:'单年指定',deleted:'停用',enabled:'启用'};
      function value(key,v,w){
        const name=id=>[...w.regions,...w.tracks,...w.races].find(x=>x.id===id)?.name||'未设置';
        if(v==null)return '未设置';if(typeof v==='boolean')return v?'是':'否';
        if(['trackId','regionId'].includes(key))return name(v);
        if(['trackIds','raceIds'].includes(key))return v.map(name).join(' → ');
        if(key==='yearOverrides')return Object.entries(v).map(([y,id])=>`第${y}年 ${name(id)}`).join('；')||'按循环顺序';
        if(key==='courseConfigId')return w.tracks.flatMap(t=>t.configurations).find(x=>x.id===v)?.name||'自动匹配';
        if(key==='raceClass')return V.labels[v]||v;
        if(key==='sexRule')return {all:'不限',female:'牝马',male:'牡马','male-female':'牡牝马'}[v]||v;
        if(key==='mode')return v==='cycle'?'顺序轮换':'固定举办';
        return Array.isArray(v)?v.join('／'):String(v);
      }
      const rows=Object.keys(labels).filter(k=>(k in before||k in after)&&JSON.stringify(before[k])!==JSON.stringify(after[k]));
      return rows.length?`<details><summary>${rows.length}项字段变化</summary><ul>${rows.map(k=>`<li>${e(labels[k])}：${e(value(k,before[k],c.world))} → ${e(value(k,after[k],referencePrepared.output.world))}</li>`).join('')}</ul></details>`:'来源版本或说明更新';
    }

    function updateWizard(f){
      const reference=f.elements.worldType.value==='reference',packs=f.querySelector('[data-reference-packs]'),annual=f.querySelector('[data-annual-settings]');
      packs.hidden=packs.disabled=!reference;annual.hidden=annual.disabled=!reference;
      f.querySelector('[data-world-description]').textContent=reference?'选择加入世界的地区，系统会建立对应的马场、赛历和开局马群。':'从空白开始，自行建立地区、马场、赛事和马群。';
      let total=0,yearly=0,selected=0;
      for(const r of ns.ChairmanVenues.regionSpecs){
        const on=reference&&f.elements['region:'+r.key].checked,pop=f.elements['population:'+r.key],target=f.elements['annualTarget:'+r.key];
        pop.disabled=target.disabled=!on;target.closest('[data-annual-region]').hidden=!on;
        const count=Math.ceil(Math.max(0,Number(pop.value)||0)/4),value=target.value.trim()===''?count:Number(target.value);
        target.placeholder='默认 '+count+' 匹';
        f.querySelector('[data-new-horses="'+r.key+'"]').textContent=`每年新马：${target.value.trim()===''?'默认 ':''}${Number.isFinite(value)?value:count}匹`;
        f.querySelector('[data-region-card="'+r.key+'"]').classList.toggle('is-selected',on);
        if(on){selected++;total+=Number(pop.value)||0;yearly+=Number.isFinite(value)?value:count;}
      }
      f.querySelector('[data-world-summary]').textContent=reference?`已选择 ${selected} 个地区 · 开局 ${total} 匹 · 每年新马目标共 ${yearly} 匹`:'空白世界不自动创建马场或赛马，可在进入后逐步添加。';
    }
    function wizard(type){
      const catalogue=ns.ChairmanVenues.catalogue();
      modal('建立主席世界',form('create','',`<div class="cm-form-grid">${input('name','世界名称','我的国际马会')}${select('worldType','世界类型',[['reference','现实参考世界'],['blank','空白新世界']],type==='blank'?'blank':'reference')}</div><p data-world-description></p>
        <fieldset data-reference-packs><legend>选择加入世界的地区</legend><div class="cm-world-regions">${ns.ChairmanVenues.regionSpecs.map(r=>{
          const n=catalogue.filter(v=>v.regionKey===r.key&&v.status==='confirmed').length;
          return `<section class="cm-world-region" data-region-card="${r.key}"><div>${check('region:'+r.key,r.name,r.key==='japan')}<small>${n}场可用赛事</small></div><div>${input('population:'+r.key,'开局赛马数量',r.key==='japan'?1000:Math.max(100,Math.ceil(n*5/4)*4),'number')}<small data-new-horses="${r.key}"></small></div></section>`;
        }).join('')}</div><p>每年新马默认按开局数量的四分之一设置，用于持续补充现役马群，可在高级设置或进入游戏后调整。</p></fieldset>
        <details class="cm-form-extra" data-world-advanced><summary>高级设置（可选）</summary><fieldset data-annual-settings><legend>每年补充新马（2岁）</legend><p>先计入长到2岁的幼驹，不足目标时再生成新马补足；超过目标的马不会被删除。留空使用默认值，填写0可取消最低补充数量。</p><div class="cm-form-grid">${ns.ChairmanVenues.regionSpecs.map(r=>`<div data-annual-region="${r.key}">${input('annualTarget:'+r.key,r.name+'每年新马目标','','number')}</div>`).join('')}</div></fieldset>${input('seed','随机种子（留空自动）','','number')}<p>用于复现初始生成结果，通常无需填写。</p></details>
        <p class="cm-course-preview" data-world-summary aria-live="polite"></p>`));
      updateWizard(c.dialog.querySelector('[data-form="world:create"]'));
    }
    function regionForm(id){
      const r=c.world.regions.find(r=>r.id===id)||V.newRegion({...c.world,nextId:c.world.nextId},{name:'新地区'}),g=r.generation;
      modal(id?'编辑地区':'新建地区',form('region',id,`
        <fieldset><legend>地区与办赛</legend><div class="cm-form-grid">${input('name','地区名称',r.name)}${input('trafficGroup','交通组',r.trafficGroup)}${select('competitionSystem','资格体系',[['open','简化公开赛'],['japan','日本胜级']],r.competitionSystem)}${input('annualTarget','每年新马目标（2岁）',r.annualTarget,'number')}</div>${check('autoPopulate','自动补充马群',r.autoPopulate)}<p>同交通组跨地区准备1回合，不同组2回合。</p></fieldset>
        <fieldset><legend>新马适性倾向</legend><div class="cm-form-grid">${['草地','泥地','二刀流'].map(k=>input('surface:'+k,k+'比例（%）',g.surfaceWeights[k],'number')).join('')}${Object.entries(typeLabels).map(([k,label])=>input('type:'+k,label+'优势权重',g.trackTypeWeights?.[k]??1,'number')).join('')}</div><p>草泥比例合计100%。三类型默认等权，只影响优势方向，不提高整体适性质量。修改只影响以后生成的新马。</p></fieldset>
        <details class="cm-form-extra"><summary>距离偏好</summary>${['grass','dirt'].map(k=>`<p>${k==='grass'?'草地':'泥地'}距离权重</p><div class="cm-form-grid">${g.distanceWeights[k].map((v,i)=>input(k+':'+i,['短途','英里','中距离','中长距离','长距离','超长距离'][i],v,'number')).join('')}</div>`).join('')}</details>
        <details class="cm-form-extra"><summary>高级设置：骑手与参考环境</summary><div class="cm-form-grid">${select('jockeyPool','骑手池',['日本','欧洲','美国'],r.environment.jockeyPool)}${select('baseRegion','参考环境',['日本','欧洲','美国'],r.baseRegion)}${select('grass','草地参考环境',['日本','香港','美国','欧洲','其他'],r.environment.grass)}${select('dirt','泥地参考环境',['日本','中东','美国'],r.environment.dirt)}</div><p>赛场类型由马场赛程决定，不由参考地区决定。</p></details>
        <details class="cm-form-extra"><summary>补充资料（选填）</summary><div class="cm-form-grid">${input('shortName','简称',r.shortName)}${input('country','国家／地区',r.country)}${input('area','上级分组',r.area)}${input('description','简介',r.description)}${input('order','显示排序',r.order,'number')}</div></details>
        <details class="cm-form-extra"><summary>地区管理</summary>${check('disabled','停用此地区',r.disabled)}<p>停用前须处理在用马场、马匹和锁定安排。</p></details>`));
    }
    const typeLabels={burst:'瞬发',sustained:'持久',attrition:'消耗'};
    const typeChoices=Object.entries(typeLabels).flatMap(([key,label])=>[1,2].map(level=>[key+':'+level,label+(level===1?'Ⅰ':'Ⅱ')]));
    const profileLabel=V.courseLabel;
    function courseRow(i,p={}) {
      return `<div class="cm-course-row" data-course-row="${i}"><div class="cm-form-grid">${select('profileSurface:'+i,'表面',['草地','泥地'],p.surface||'草地')}${input('profileDistance:'+i,'距离（米）',p.distance||'','number')}${select('profileType:'+i,'赛程分类',typeChoices,(p.type||'burst')+':'+(p.intensity||1))}</div><button type="button" data-action="world:removeCourse">移除赛程</button></div>`;
    }
    function trackForm(id){
      const t=c.world.tracks.find(t=>t.id===id)||{surfaces:['草地','泥地'],configurations:[],courseProfiles:[],courseType:'其他地方'};
      const rows=id?V.courseRows(c.world,t):[];
      modal(id?'编辑马场':'新建马场',form('track',id,`<div class="cm-form-grid">${input('name','马场名称',t.name||'')}${select('regionId','所属地区',regionChoices(),t.regionId)}</div>${multi('surfaces','支持场地',[['草地','草地'],['泥地','泥地']],t.surfaces)}<fieldset><legend>手动赛程分类</legend><p>同一马场、表面与距离共用分类，暂不区分内外回。移除手动设置后恢复公共资料或Ⅰ级暂定分类。</p><div data-course-rows data-next="${(t.courseProfiles||[]).length}">${(t.courseProfiles||[]).map((p,i)=>courseRow(i,p)).join('')}</div><button type="button" data-action="world:addCourse">新增赛程</button></fieldset><details open><summary>现有比赛涉及的赛程与当前分类</summary>${rows.length?table(['表面','距离','当前分类','调整'],rows.map(p=>[e(p.surface),p.distance+'米',e(profileLabel(p)),b('world:configureCourse','设置',p.surface+':'+p.distance)])):'<p>暂无赛程。可以先新增，再让赛事引用。</p>'}</details><details class="cm-form-extra"><summary>补充资料（选填）</summary><div class="cm-form-grid">${input('originalName','原名',t.originalName||'')}${input('aliases','别名（逗号分隔）',(t.aliases||[]).join('，'))}${input('state','州／行政区',t.state||'')}${input('city','城市',t.city||'')}${input('sourceUrl','资料来源链接',t.sourceUrl||'')}</div><p>仅用于资料说明，不影响比赛计算。</p></details><details class="cm-form-extra"><summary>马场管理</summary>${check('deleted','停用马场',t.deleted)}</details>`));
    }
    function updateRaceCourse(f) {
      if(!f)return;
      const t=c.world.tracks.find(t=>t.id===f.elements.trackId.value),surface=f.elements.surface.value,distance=Number(f.elements.distance.value);
      const box=f.querySelector('[data-course-preview]');
      box.innerHTML=t&&t.surfaces.includes(surface)&&Number.isInteger(distance)&&distance>0?`<strong>${e(profileLabel(V.courseProfile(c.world,t,surface,distance)))}</strong><p>按所选默认马场显示；轮换赛事按该届实际马场读取。进入马场设置前请先保存赛事修改。</p>${b('world:track','设置马场赛程',t.id)}`:'请选择马场支持的表面与有效距离。';
    }
    c.dialog.addEventListener('input',event=>{const f=event.target.form;if(f?.dataset.form==='world:race'&&['trackId','surface','distance'].includes(event.target.name))updateRaceCourse(f);});
    c.dialog.addEventListener('change',event=>{const f=event.target.form;if(f?.dataset.form==='world:race'&&['trackId','surface','distance'].includes(event.target.name))updateRaceCourse(f);});
    function meetingForm(id){
      const w=c.world,g=w.meetingGroups.find(g=>g.id===id)||{raceIds:[],trackIds:[],mode:'cycle',startYear:year(),enabled:true,yearOverrides:{}};
      modal('编辑举办组',form('meeting',id,`<p>举办组仅决定场地，不授予连冠奖励。候选马场须支持所有成员的草泥场地。单年指定不改变循环次序。</p><div class="cm-form-grid">${input('name','名称',g.name||'')}${select('mode','方式',[['fixed','固定举办'],['cycle','顺序轮换']],g.mode)}${input('startYear','循环起始年份',g.startYear,'number')}${input('overrideYear','指定届次',year(),'number')}${select('overrideTrack','该年指定场地',[['','按循环顺序'],...w.tracks.filter(t=>!t.deleted).map(t=>[t.id,t.name])],g.yearOverrides[year()]||'')}</div><fieldset><legend>候选顺序（固定举办使用第一项）</legend><div class="cm-form-grid">${Array.from({length:Math.max(4,g.trackIds.length+1)},(_,i)=>select('track:'+i,'第'+(i+1)+'站',[['','未选'],...w.tracks.filter(t=>!t.deleted).map(t=>[t.id,t.name])],g.trackIds[i]||'')).join('')}</div></fieldset>${multi('races','成员赛事',w.races.filter(r=>!r.deleted&&!r.support).map(r=>[r.id,r.name]),g.raceIds)}${check('enabled','启用举办组',g.enabled!==false)}`));
    }
    function raceForm(id){
      const r=c.world.races.find(r=>r.id===id)||{raceClass:'op',grade:'OP',surface:'草地',distance:1600,month:1,half:1,ageRule:'2+',sexRule:'all',capacity:16,prizes:V.prizes('op')};
      modal('编辑赛事',form('race',id,`<div class="cm-form-grid">${input('name','名称',r.name||'')}${select('trackId','固定／默认马场',c.world.tracks.filter(t=>!t.deleted).map(t=>[t.id,t.name]),r.trackId)}${select('raceClass','级别',V.classes.map(k=>[k,V.labels[k]]),r.raceClass)}${check('listed','Listed（公开赛显示L）',r.grade==='L')}${select('surface','场地',['草地','泥地'],r.surface)}${input('distance','距离（米）',r.distance,'number')}${input('month','月份',r.month,'number')}${select('half','半月',[[1,'上半月'],[2,'下半月']],r.half)}${select('ageRule','年龄',['2','3','4','2+','3+','4+'],r.ageRule)}${select('sexRule','性别',[['all','不限'],['female','牝马'],['male','牡马'],['male-female','牡牝马']],r.sexRule)}${input('capacity','名额',r.capacity,'number')}${r.prizes.map((v,i)=>input('prize:'+i,'第'+(i+1)+'名奖金（万）',v,'number')).join('')}</div><div class="cm-course-preview" data-course-preview aria-live="polite"></div>${check('deleted','停办未来届次',r.deleted)}<p>修改只影响当前世界的未锁定安排，历史赛果保留。已举行赛事的赛期修改从下一年生效。</p>`));
      updateRaceCourse(c.dialog.querySelector('[data-form="world:race"]'));
    }
    async function archive(kind,id){
      const w=c.world,t=w.tracks.find(t=>t.id===id),g=w.meetingGroups.find(g=>g.id===id);
      if(kind==='meeting'){
        const rows=w.venueAssignments.filter(a=>a.groupId===id).sort((a,b)=>b.year-a.year);
        modal(g.name+' · 举办历史',table(['届次','实际／预计马场','状态','成员赛事'],rows.map(a=>[a.year,e(a.trackName||w.tracks.find(t=>t.id===a.trackId)?.name),a.frozen?'已锁定':'预计',(a.races||g.raceIds.map(id=>V.resolveRace(w,w.races.find(r=>r.id===id),a.year))).map(r=>b('world:entries',r.name,r.id,`data-year="${a.year}"`)+'<small>'+e(profileLabel(r.courseProfile))+'</small>').join('')])));return;
      }
      const history=await c.store.historyPage(w,{},offset,{trackId:id});
      modal(t.name+' · 马场档案',`<p>${e(t.originalName)} · ${e(t.country)} ${e(t.state)} ${e(t.city)} · ${e(V.region(w,t.regionId)?.name)}</p><p>${V.courseRows(w,t).map(p=>e(p.surface)+' '+p.distance+'米 · '+e(profileLabel(p))).join('<br>')||'暂无赛程'}</p>${table(['年份','赛事','级别','状态'],history.rows.map(r=>[W.date(r.turn).year,b('result',r.name,r.id),e(r.race.grade),r.status==='completed'?'已完成':'取消']))}<div class="cm-actions">${b('world:trackPage','上一页',id,`data-offset="${Math.max(0,offset-50)}" ${offset?'':'disabled'}`)}${b('world:trackPage','下一页',id,`data-offset="${offset+50}" ${history.more?'':'disabled'}`)}</div>`);
    }
    async function render(tab){
      if(!V.isV2(c.world)||tab!=='calendar'||c.world.ui.layout?.calendar==='series')return false;
      if(c.world.ui.layout?.calendar==='regions')view='regions';
      if(c.world.ui.layout?.calendar==='tracks')view='tracks';
      else if(view==='tracks')view='races';
      const w=c.world;
      const matchesTrack=(t,query)=>[t?.name,t?.originalName,...(t?.aliases||[])].some(name=>String(name||'').toLocaleLowerCase().includes(String(query||'').trim().toLocaleLowerCase()));
      let html=`<div class="cm-actions">${[['races','完整赛历'],['regions','地区管理'],['tracks','马场'],['meetings','举办组'],['sources','资料核对']].map(([id,name])=>b('world:view',name,id,view===id?'aria-current="page"':'')).join('')}</div>`;
      if(view==='regions')html+=`<p>同地区无需额外准备；同交通组跨地区1回合，不同组2回合。地区对可以单独覆盖。出赛间隔与准备时间同时满足。</p>${b('world:region','新增地区')}${b('world:traffic','地区间交通')}${table(['地区','环境／交通组','现役／幼驹','年度二岁马目标','状态','管理'],w.regions.slice().sort((a,b)=>a.order-b.order).map(r=>[e(r.name),e(r.environment.grass)+'／'+e(r.environment.dirt)+' · '+e(r.trafficGroup),w.horses.filter(h=>h.homeRegionId===r.id&&h.status==='active').length+'／'+w.horses.filter(h=>h.homeRegionId===r.id&&h.status==='juvenile').length,r.annualTarget,r.disabled?'停用':'启用',b('world:region','编辑',r.id)+b('world:populate','生成马群',r.id)]))}`;
      else if(view==='tracks')html+=`<form data-form="world:trackFilter">${input('trackSearch','马场名称或中文别名',prefs.trackSearch||'')}<button>搜索</button></form>`+b('world:track','新建马场')+table(['马场','地区','州／城市','赛道','管理'],w.tracks.filter(t=>matchesTrack(t,prefs.trackSearch)).map(t=>[b('world:trackArchive',t.name,t.id),e(t.region),e(t.state)+' '+e(t.city),t.configurations.map(x=>e(x.name)).join('／'),b('world:track','编辑',t.id)]));
      else if(view==='meetings')html+=`<p>举办组与连冠挑战分别管理。锁定后的本届场地不受候选顺序修改影响。</p>${b('world:meeting','新增举办组')}${table(['举办组','成员数','本届','下届','管理'],w.meetingGroups.map(g=>{const r=w.races.find(r=>r.id===g.raceIds[0]);return [b('world:meetingArchive',g.name,g.id),g.raceIds.length,e(V.resolveRace(w,r,year()).trackName),e(V.resolveRace(w,r,year()+1).trackName),b('world:meeting','编辑',g.id)];}))}`;
      else if(view==='sources'){
        const modified=new Set(w.races.filter(r=>r.sourceRecord?.status==='modified').map(r=>r.sourceId)),audit=w.referenceAudit.map(r=>modified.has(r.sourceId)?{...r,status:'modified'}:r);
        const rows=audit.filter(r=>!prefs.status||r.status===prefs.status);
        html+=`${w.worldType==='reference'?b('world:referencePreview','检查资料包更新'):''}<p>共${w.referenceAudit.length}条来源；${w.referenceAudit.filter(r=>r.status==='pending').length}条待核对，不投入自动赛历。日期与距离沿用源资料；奖金为游戏奖金。</p><form data-form="world:sourceFilter">${select('status','核对状态',[['','全部'],['pending','待核对'],['confirmed','已确认'],['modified','玩家修改／指定']],prefs.status||'')}<button>筛选</button></form>${table(['赛事来源','状态','采用说明','资料'],rows.slice(offset,offset+50).map(r=>[e(r.name||r.sourceId)+(r.status==='pending'?b('world:source','指定举办地',r.sourceId):''),r.status==='confirmed'?'已确认':r.status==='modified'?'玩家修改／指定':'待核对',e(r.note||r.reason||'采用通常举办地'),/^https?:\/\//i.test(r.sourceUrl||'')?`<a href="${e(r.sourceUrl)}" target="_blank" rel="noopener">核对来源</a> · ${e(r.checkedAt||'')}`:r.sourceUrl?.startsWith('project:')?'项目现有资料':'待核对']))}${pager(rows.length)}`;
      }else{
        let races=await c.store.raceEditions(w,Number(prefs.year)||year());
        races=races.filter(r=>(!prefs.region||r.regionId===prefs.region)&&(!prefs.track||r.trackId===prefs.track)&&(!prefs.group||r.meetingGroupId===prefs.group)&&(!prefs.month||r.month===Number(prefs.month))&&(!prefs.raceClass||r.raceClass===prefs.raceClass)&&(!prefs.search||[r.name,r.trackName].some(name=>String(name||'').toLocaleLowerCase().includes(prefs.search.trim().toLocaleLowerCase()))||matchesTrack(w.tracks.find(t=>t.id===r.trackId),prefs.search))&&(!prefs.named||!r.support)).sort((a,b)=>a.month-b.month||a.half-b.half||a.name.localeCompare(b.name));
        html+=`<div class="cm-actions">${b('world:race','新建赛事')+b('contentImport','导入赛事包','events')+b('contentExportEvents','导出全部赛事包')}</div><form data-form="world:filter" class="cm-form-grid">${input('search','赛事／马场名称或中文别名',prefs.search||'')}${input('year','游戏年份',prefs.year||year(),'number')}${select('region','国家／地区',[['','全部'],...regionChoices()],prefs.region||'')}${select('track','马场',[['','全部'],...w.tracks.map(t=>[t.id,t.name])],prefs.track||'')}${select('group','举办组',[['','全部'],...w.meetingGroups.map(g=>[g.id,g.name])],prefs.group||'')}${select('month','月份',[['','全部'],...Array.from({length:12},(_,i)=>[i+1,i+1])],prefs.month||'')}${select('raceClass','级别',[['','全部'],...V.classes.map(k=>[k,V.labels[k]])],prefs.raceClass||'')}${check('named','仅命名赛事',prefs.named)}<button>应用筛选</button></form><p>${races.length}场。条件赛按报名需求开设；少于两匹不开赛。轮换仅改变举办地，日期、距离沿用源资料。</p>${table(['日期','赛事','级别／资格','本届举办地','举办方式／下届','管理'],races.slice(offset,offset+50).map(r=>[r.month+'月'+(r.half===1?'上':'下'),b('raceArchive',r.name,r.id),e(r.grade)+' · '+e(r.ageRule)+'岁',e(r.surfaceRegion)+' · '+e(r.trackName)+'<small>'+e(r.courseName)+' · '+r.distance+'米</small><small>'+e(profileLabel(r.courseProfile))+'</small>',r.meetingGroupId?(r.venueMode==='cycle'?'年度轮换':'固定举办')+'<small>下届：'+e(V.resolveRace(w,w.races.find(d=>d.id===r.id),(Number(prefs.year)||year())+1).trackName)+'</small>':'固定举办',(r.occurrenceId?b('result',r.editionStatus==='cancelled'?'取消记录':'本届赛果',r.occurrenceId):b('entryList','出马表',r.id,`data-year="${Number(prefs.year)||year()}"`))+b('world:follow',(w.ui.followedRaceIds||[]).includes(r.id)?'取消关注':'关注',r.id)+b('world:race','编辑',r.id)+b('contentExportRace','导出',r.id)]))}${pager(races.length)}`;
      }
      c.body.innerHTML=html;return true;
    }
    function pager(n){return `<div class="cm-actions">${b('world:page','上一页',String(Math.max(0,offset-50)),offset?'':'disabled')}<span>${Math.floor(offset/50)+1}页／${Math.max(1,Math.ceil(n/50))}页</span>${b('world:page','下一页',String(offset+50),offset+50<n?'':'disabled')}</div>`;}
    async function click(action,id,el){
      if(action==='new'){wizard(id);return true;}
      if(!V.isV2(c.world))return false;
      const aliases={editRegion:'world:region',regions:'world:regions',editTrack:'world:track',editRace:'world:race',trackArchive:'world:trackArchive',entryList:'world:entries'};action=aliases[action]||action;
      if(!action.startsWith('world:'))return false;
      const k=action.slice(6);
      if(['confirm','region','track','race','meeting','traffic','populate','source'].includes(k)&&!c.store.writable)throw Error('当前为只读，请先取得编辑权。');
      if(k==='view'||k==='regions'){view=k==='regions'?'regions':id;offset=0;c.world.ui.layout.calendar=view==='tracks'?'tracks':'races';await c.render();}
      else if(k==='page'){offset=Number(id);await c.render();}
      else if(k==='entries'){const y=Number(el.dataset.year)||Number(prefs.year)||year(),r=await c.store.raceEdition(c.world,c.world.races.find(r=>r.id===id),y),rows=c.world.horses.filter(h=>h.booked?.raceId===id&&W.date(h.booked.turn).year===y);if(r.occurrenceId){modal(`${r.name} · 第${y}年`,`<p>${e(r.trackName)} · ${e(r.courseName)} · ${r.editionStatus==='cancelled'?'已取消':'已完成'}</p>${b('result','查看本届记录',r.occurrenceId)}`);return true;}modal(`${r.name} · 第${y}年出马表`,`<p>${e(r.surfaceRegion)} · ${e(r.trackName)} · ${e(r.courseName)} ${r.distance}米 · ${e(profileLabel(r.courseProfile))}。${r.venueFrozen?'举办地已锁定':'预计举办地'}。</p><p>尚未锁定的报名可随排赛调整。</p>${table(['赛马','所属','出发地','准备回合'],rows.map(h=>[b('horse',h.name,h.id),e(h.homeRegion),e(V.region(c.world,h.booked.fromRegionId)?.name||h.locationRegion),h.booked.travelTurns||0]))}`);}
      else if(k==='follow'){const ids=new Set(c.world.ui.followedRaceIds||[]);if(ids.has(id))ids.delete(id);else ids.add(id);if(c.store.writable)await c.commit(W.edit(c.world,'ui',{followedRaceIds:[...ids]}));else c.world.ui.followedRaceIds=[...ids];await c.render();}
      else if(k==='qualification'){const h=c.world.horses.find(h=>h.id===id);if(!ns.ChairmanEditor.enabled(c.world))throw Error('请先开启世界编辑模式。');modal('修改参赛资格',form('qualification',id,select('value','资格',[[0,'未胜利'],[1,'1胜级'],[2,'2胜级'],[3,'3胜级'],[4,'公开级']],h.qualification)));}
      else if(k==='region')regionForm(id);
      else if(k==='track')trackForm(id);
      else if(k==='addCourse'||k==='configureCourse'){
        const box=c.dialog.querySelector('[data-course-rows]');let p={};
        if(k==='configureCourse'){
          const [surface,distance]=id.split(':'),t=c.world.tracks.find(t=>t.id===box.closest('form').dataset.id);
          const existing=[...box.children].find(row=>row.querySelector('[name^=profileSurface]').value===surface&&Number(row.querySelector('[name^=profileDistance]').value)===Number(distance));
          if(existing){existing.querySelector('select').focus();return true;}
          p=V.courseProfile(c.world,t,surface,Number(distance));
        }
        const i=Number(box.dataset.next);box.dataset.next=i+1;box.insertAdjacentHTML('beforeend',courseRow(i,p));box.lastElementChild.querySelector('select').focus();
      }
      else if(k==='removeCourse'){const row=el.closest('[data-course-row]'),box=row.parentElement;row.remove();(box.lastElementChild?.querySelector('select')||box.parentElement.querySelector('[data-action="world:addCourse"]')).focus();}
      else if(k==='race')raceForm(id);
      else if(k==='meeting')meetingForm(id);
      else if(k==='source'){const entry=c.world.referenceAudit.find(r=>r.sourceId===id);modal('指定待核对赛事举办地',form('source',id,`<p>${e(entry.name)}：${e(entry.reason)}。保存后标记为玩家指定，加入当前世界赛历。</p>${select('trackId','举办马场',c.world.tracks.filter(t=>!t.deleted).map(t=>[t.id,t.name]))}${input('sourceUrl','参考链接（可选）','')}`));}
      else if(k==='traffic')modal('地区间交通覆盖',form('traffic','',`<div class="cm-form-grid">${select('from','出发地区',regionChoices())}${select('to','到达地区',regionChoices())}${input('turns','额外准备回合（0～4）',1,'number')}</div><p>设置对称适用。${Object.entries(c.world.travelOverrides).map(([key,n])=>e(key.split('|').map(id=>V.region(c.world,id)?.name).join(' ↔ '))+': '+n+'回合').join('；')}</p>`));
      else if(k==='populate')modal('生成地区马群',form('populate',id,`${input('count','新生成二岁马数量',20,'number')}<p>使用地区当前生成倾向。已有马匹不变。</p>`));
      else if(k==='trackArchive'||k==='trackPage'){offset=k==='trackPage'?Number(el.dataset.offset):0;await archive('track',id);}
      else if(k==='meetingArchive')await archive('meeting',id);
      else if(k==='referencePreview'){if(!c.store.writable)throw Error('当前为只读。');referencePrepared=await c.background('referencePreview',c.world);modal('参考资料更新预览',`<p>历史举办地不移动。玩家修改过的地区、马场、赛事和举办组保持原样。</p>${table(['项目','名称','处理','具体变化'],referencePrepared.changes.filter(x=>x.action!=='复用／保留').map(x=>[e({race:'赛事',track:'马场',region:'地区',meeting:'举办组'}[x.kind]||x.kind),e(x.name),e(x.action),referenceDetails(x)]))}<p>${referencePrepared.warnings.map(e).join('；')}</p>${b('world:referenceApply','应用资料更新')}`);}
      else if(k==='referenceApply'){if(!c.store.writable)throw Error('当前为只读。');await c.commit(ns.ChairmanPackages.apply(c.world,referencePrepared,true));referencePrepared=null;c.dialog.close();await c.render();}
      else if(k==='confirm'){await c.commit(V.apply(c.world,prepared));prepared=null;c.dialog.close();await c.render();}
      else return false;
      return true;
    }
    async function submit(f){
      if(!f.dataset.form.startsWith('world:'))return false;
      const kind=f.dataset.form.slice(6),d=new FormData(f),id=f.dataset.id,number=k=>Number(d.get(k)),text=k=>String(d.get(k)||'').trim();let value={id:id||undefined};
      if(kind==='create'){
        const regionKeys=ns.ChairmanVenues.regionSpecs.filter(r=>d.has('region:'+r.key)).map(r=>r.key),population=Object.fromEntries(regionKeys.map(k=>[k,number('population:'+k)]));
        const annualTargets=Object.fromEntries(regionKeys.filter(k=>text('annualTarget:'+k)!=='').map(k=>[k,number('annualTarget:'+k)]));
        creation={worldType:text('worldType'),name:text('name')||'我的国际马会',regionKeys,population,annualTargets,...(text('seed')?{seed:number('seed')}:{})};
        if(creation.worldType==='reference'&&!regionKeys.length)throw Error('请选择至少一个参考地区。');
        for(const n of [...Object.values(population),...Object.values(annualTargets)])if(!Number.isSafeInteger(n)||n<0)throw Error('初始马数和年度目标须为非负整数。');
        const rows=ns.ChairmanVenues.catalogue().filter(r=>regionKeys.includes(r.regionKey)&&r.status==='confirmed');
        modal('创建预览',`<p>${e(creation.name)} · ${creation.worldType==='blank'?'空白新世界，进入后创建地区与马群':`${regionKeys.length}个地区、${rows.length}场命名赛事、${new Set(rows.map(r=>r.venueKey)).size}座马场、${Object.values(population).reduce((a,b)=>a+b,0)}匹初始现役、每年新马目标共${regionKeys.reduce((n,k)=>n+(annualTargets[k]??Math.ceil(population[k]/4)),0)}匹；另按需求提供条件赛／补充公开赛。`}</p><form data-form="world:createConfirm"><button>建立并保存</button></form>`);return true;
      }
      if(kind==='createConfirm'){if(!creation)throw Error('请重新创建预览。');await c.createWorld(creation);creation=null;return true;}
      if(kind==='trackFilter'){prefs.trackSearch=String(d.get('trackSearch')||'');offset=0;await c.render();return true;}
      if(kind==='filter'||kind==='sourceFilter'){prefs={...Object.fromEntries(d),named:d.has('named')};offset=0;await c.render();return true;}
      if(!c.store.writable)throw Error('当前为只读，请先取得编辑权。');
      if(kind==='region'){value={...value,...Object.fromEntries(['name','shortName','country','area','description','trafficGroup','baseRegion','competitionSystem'].map(k=>[k,text(k)])),order:number('order'),annualTarget:number('annualTarget'),autoPopulate:d.has('autoPopulate'),disabled:d.has('disabled'),environment:{grass:text('grass'),dirt:text('dirt'),jockeyPool:text('jockeyPool')},generation:{surfaceWeights:Object.fromEntries(['草地','泥地','二刀流'].map(k=>[k,number('surface:'+k)])),trackTypeWeights:Object.fromEntries(Object.keys(typeLabels).map(k=>[k,number('type:'+k)])),distanceWeights:Object.fromEntries(['grass','dirt'].map(k=>[k,Array.from({length:6},(_,i)=>number(k+':'+i))]))}};}
      else if(kind==='track'){
        const old=c.world.tracks.find(t=>t.id===id),surfaces=d.getAll('surfaces');
        const configurations=(old?.configurations||[]).filter(x=>surfaces.includes(x.surface));
        for(const surface of surfaces)if(!configurations.some(x=>x.surface===surface))configurations.push({id:`${id||'track-'+c.world.nextId}:course:${surface}`,name:surface,surface,courseType:old?.courseType||'其他地方'});
        const courseProfiles=[...f.querySelectorAll('[data-course-row]')].map(row=>{
          const i=row.dataset.courseRow,[type,intensity]=text('profileType:'+i).split(':');
          return {surface:text('profileSurface:'+i),distance:number('profileDistance:'+i),type,intensity:Number(intensity)};
        });
        value={...value,...Object.fromEntries(['name','originalName','regionId','state','city','sourceUrl'].map(k=>[k,text(k)])),aliases:text('aliases').split(/[,，]/).filter(Boolean),surfaces,configurations,courseProfiles,deleted:d.has('deleted')};
      }
      else if(kind==='race'){
        const old=c.world.races.find(r=>r.id===id),t=c.world.tracks.find(t=>t.id===text('trackId'));
        const courseConfigId=t?.configurations.find(x=>x.id===old?.courseConfigId&&x.surface===text('surface'))?.id||'';
        value={...value,courseConfigId,...Object.fromEntries(['name','trackId','raceClass','surface','ageRule','sexRule'].map(k=>[k,text(k)])),...Object.fromEntries(['month','half','distance','capacity'].map(k=>[k,number(k)])),grade:d.has('listed')?'L':V.labels[text('raceClass')],prizes:Array.from({length:5},(_,i)=>number('prize:'+i)),deleted:d.has('deleted')};
      }
      else if(kind==='meeting'){const old=c.world.meetingGroups.find(g=>g.id===id),yearOverrides={...old?.yearOverrides};if(text('overrideTrack'))yearOverrides[number('overrideYear')]=text('overrideTrack');else delete yearOverrides[number('overrideYear')];value={...value,name:text('name'),mode:text('mode'),startYear:number('startYear'),enabled:d.has('enabled'),raceIds:d.getAll('races'),trackIds:[...d].filter(([k,v])=>k.startsWith('track:')&&v).map(([,v])=>v),yearOverrides};}
      else if(kind==='traffic')value={from:text('from'),to:text('to'),turns:number('turns')};
      else if(kind==='qualification')value={id,value:number('value')};
      else if(kind==='source')value={sourceId:id,trackId:text('trackId'),sourceUrl:text('sourceUrl')};
      else if(kind==='populate')value={regionId:id,count:number('count')};
      prepared=await c.background('worldPreview',{world:c.world,kind,value});
      const labels={value:'参赛资格',sourceId:'来源赛事',name:'名称',shortName:'简称',country:'国家／地区',area:'上级分组',description:'简介',order:'排序',trafficGroup:'交通组',baseRegion:'基础环境',competitionSystem:'资格体系',annualTarget:'年度二岁马目标',autoPopulate:'自动补马',disabled:'停用地区',environment:'比赛环境',generation:'马群生成',originalName:'原名',regionId:'所属地区',state:'州／行政区',city:'城市',courseType:'内部路线标识',courseProfiles:'手动赛程分类',sourceUrl:'资料来源',aliases:'别名',surfaces:'场地',deleted:'停办／停用',configurations:'赛道配置',trackId:'举办马场',courseConfigId:'赛道',raceClass:'级别',surface:'场地',ageRule:'年龄',sexRule:'性别',month:'月份',half:'半月',distance:'距离（米）',capacity:'名额',grade:'显示格付',prizes:'前五名奖金（万）',mode:'举办方式',startYear:'循环起始年份',enabled:'启用',raceIds:'成员赛事',trackIds:'候选顺序',yearOverrides:'年度指定',from:'出发地区',to:'到达地区',turns:'准备回合',count:'新增二岁马'};
      function display(k,v){
        const names=ids=>ids.map(id=>[...c.world.regions,...c.world.tracks,...c.world.races].find(x=>x.id===id)?.name||id).join(' → ');
        if(k==='sourceId')return c.world.referenceAudit.find(r=>r.sourceId===v)?.name||v;
        if(typeof v==='boolean')return v?'是':'否';
        if(['regionId','trackId','from','to'].includes(k))return names([v]);
        if(['raceIds','trackIds'].includes(k))return names(v);
        if(k==='environment')return `草地 ${v.grass} · 泥地 ${v.dirt} · 骑手 ${v.jockeyPool}`;
        if(k==='generation')return `草地／泥地／兼擅 ${v.surfaceWeights['草地']}/${v.surfaceWeights['泥地']}/${v.surfaceWeights['二刀流']}%，瞬发／持久／消耗权重 ${Object.keys(typeLabels).map(k=>v.trackTypeWeights[k]).join('／')}；草地距离 ${v.distanceWeights.grass.join('／')}，泥地距离 ${v.distanceWeights.dirt.join('／')}`;
        if(k==='configurations')return v.map(x=>`${x.name}：${x.surface}`).join('；');
        if(k==='courseProfiles')return v.map(p=>`${p.surface} ${p.distance}米：${typeLabels[p.type]}${p.intensity===1?'Ⅰ':'Ⅱ'}`).join('；')||'使用公共资料或Ⅰ级暂定分类';
        if(k==='courseConfigId')return c.world.tracks.flatMap(t=>t.configurations).find(x=>x.id===v)?.name||'自动匹配';
        if(k==='yearOverrides')return Object.entries(v).map(([y,id])=>`第${y}年 ${names([id])}`).join('；')||'按轮换顺序';
        if(k==='mode')return v==='cycle'?'逐年顺序轮换':'固定举办';
        if(k==='raceClass')return V.labels[v];
        if(k==='sexRule')return {all:'不限',female:'牝马',male:'牡马','male-female':'牡牝马'}[v];
        if(k==='competitionSystem')return v==='japan'?'日本胜级':'简化公开赛';
        return Array.isArray(v)?v.join('／'):v;
      }
      modal('确认管理修改',`<p>关联校验已通过，未锁定报名已重新规划。修改仅应用于当前世界。</p>${table(['项目','修改值'],Object.entries(value).filter(([k])=>k!=='id').map(([k,v])=>[e(labels[k]||k),e(display(k,v))]))}${b('world:confirm','保存修改')}`);
      return true;
    }
    return {click,submit,render};
  }
  ns.ChairmanWorldUI={create};
})();
