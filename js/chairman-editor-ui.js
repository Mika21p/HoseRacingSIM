(function(){
  'use strict';
  const ns=window.Keiba,E=()=>ns.ChairmanEditor,W=()=>ns.ChairmanRules,B=()=>ns.ChairmanBreeding;
  const labels={name:'名字',displayName:'显示名',originalName:'原名',aliases:'别名（每行一项）',pinyin:'拼音检索项',romanizedName:'罗马字检索项',gender:'性别',coat:'毛色',owner:'马主',homeRegion:'所属地区',region:'地区',regionTags:'地区标签（每行一项）',birthYear:'出生年份',age:'当前年龄',strength:'基础能力',weight:'体重kg',temperamentLabel:'气性',heavyType:'重场地适性',distMin:'距离下限米',coreDist:'核心距离米',distMax:'距离上限米',growthType:'成长类型',peakStart:'巅峰开始',peakEnd:'巅峰结束',fatherId:'父马',motherId:'母马',breedingStrength:'繁殖素质',breedingStability:'遗传稳定度',decline:'累计衰退','surfaceGrades.grass':'草地适性','surfaceGrades.dirt':'泥地适性','trackAptitudes.burst':'瞬发适性','trackAptitudes.sustained':'持久适性','trackAptitudes.attrition':'消耗适性','game.breedingBase':'繁殖素质基准','game.distance':'参考距离米','game.surface':'场地倾向','game.growthType':'成长倾向',disabled:'停用模板'};
  const aptitudeLabels={grass:'草地',dirt:'泥地',burst:'瞬发',sustained:'持久',attrition:'消耗'};
  const read=(v,k)=>k.split('.').reduce((o,k)=>o?.[k],v);
  const write=(v,k,x)=>{const a=k.split('.');let o=v;for(const p of a.slice(0,-1))o=o[p]||=( {} );o[a.at(-1)]=x;};
  ns.ChairmanEditorUI={create(c){
    const {escape:e,button:b,input,select,modal}=c;let draft=null,prepared=null;const drafts=new Map();
    const allowed=()=>{if(!E().enabled(c.world))throw Error('请先开启世界编辑模式。');};
    const name=id=>B().get(c.world,id)?.name||E().template(c.world,id)?.displayName||E().template(c.world,id)?.name||id;
    const choice=k=>({gender:['牡马','牝马','骟马'],homeRegion:W().regionNames(c.world),region:W().regionNames(c.world),temperamentLabel:['极端暴躁','暴躁','胆小','普通','沉稳','冷静','极其聪明'],heavyType:['不佳','普通','擅长','鬼'],growthType:E().growths(),'game.growthType':[['','不指定'],...E().growths()],'game.surface':[['','不指定'],'草地','泥地']}[k]);
    function field(k,v){const val=read(v,k);if(['aliases','regionTags'].includes(k))return `<label>${e(labels[k])}<textarea name="${e(k)}" rows="2">${e((val||[]).join('\n'))}</textarea></label>`;
      if(k==='disabled')return `<label><input type="checkbox" name="disabled" ${val?'checked':''}>停用模板（仍保留祖先资料）</label>`;
      if(['fatherId','motherId'].includes(k))return `<div>${input(k,labels[k]+'编号',val||'')}<input type="search" data-editor-parent="${k}" aria-label="搜索${labels[k]}" placeholder="搜索名字／别名"><div data-parent-results="${k}"></div><small data-parent-name="${k}">${e(name(val)||'未记录')}</small>${val?b(draft.kind==='horse'?'pedigree':'worldEditTemplate','查看／编辑亲本',val):''}</div>`;
      if(choice(k))return select(k,labels[k],choice(k),val??'');
      if(k.startsWith('surfaceGrades.'))return select(k,labels[k],['A','B','C','G'],val);
      if(k.startsWith('trackAptitudes.'))return select(k,labels[k],['◎','○','△'],val);
      return input(k,labels[k]||k,val??'',/^(strength|weight|distMin|coreDist|distMax|age|birthYear|breedingStrength|breedingStability|game.breedingBase|game.distance)$/.test(k)?'number':'text');
    }
    function capture(){const form=c.dialog.querySelector('[data-form=worldEdit]');if(!form||!draft)return;for(const el of form.querySelectorAll('[name]')){let val=el.type==='checkbox'?el.checked:el.type==='number'?el.value===''?null:Number(el.value):el.value;if(['aliases','regionTags'].includes(el.name))val=el.value.split(/\r?\n/).map(s=>s.trim()).filter(Boolean);write(draft.values,el.name,val);}drafts.set(draft.key,draft);}
    function editor(kind,id){allowed();capture();const raw=kind==='horse'?B().get(c.world,id):E().template(c.world,id);if(!raw)throw Error('资料不存在。');const key=`${c.world.id}:${kind}:${id}`;
      const existing=drafts.get(key);draft=existing||{key,kind,id,dirty:false,values:W().clone(raw)};if(kind==='horse'&&!existing){draft.values.age=W().ageOf(c.world,raw);draft.values.breedingStrength=raw.breeding?.strength;draft.values.breedingStability=raw.genetics?.stability;}
      const archive=kind==='horse'&&!raw.strength,groups=kind==='template'?[['资料',['displayName','originalName','aliases','pinyin','romanizedName','gender','coat','birthYear']],['关联',['region','regionTags','fatherId','motherId']],['生成预设',['game.breedingBase','game.distance','game.surface','game.growthType','disabled']]]:[['身份',['name','originalName','aliases','pinyin','romanizedName','gender','coat',...(archive?['birthYear']:['owner','homeRegion','age'])]],...(!archive?[['竞赛参数',['strength','weight','temperamentLabel','heavyType']],['适性',['distMin','coreDist','distMax','surfaceGrades.grass','surfaceGrades.dirt','trackAptitudes.burst','trackAptitudes.sustained','trackAptitudes.attrition']],['成长',['growthType','peakStart','peakEnd']]]:[]),['血统与繁殖',['fatherId','motherId',...(raw.breeding?['breedingStrength','breedingStability']:[])]]];
      draft.values.displayName??=raw.name||raw.originalName;draft.fields=groups.flatMap(g=>g[1]);
      modal(kind==='template'?'编辑种马库资料':'编辑马匹',`<p>${kind==='template'?'资料模板：影响以后引入，不同步已有种马。':'世界个体：修改当前这匹马，历史比赛保持不变。'}</p><form data-form="worldEdit">${kind==='template'?`<details><summary>编辑前来源资料</summary><pre>${e(JSON.stringify(c.world.templateOverrides?.find(o=>o.id===id)?.baseline||raw,null,2))}</pre></details>`:''}${groups.map(([title,keys])=>`<fieldset class="cm-editor-group"><legend>${e(title)}</legend><div class="cm-form-grid">${keys.map(k=>field(k,draft.values)).join('')}</div></fieldset>`).join('')}<div class="cm-sticky-actions"><button>预览修改</button>${kind==='template'?b('worldTemplateReset','恢复编辑前默认资料',id):''}</div><p role="status">${draft.dirty?'有未保存修改':''}</p></form>`,{key:'worldEdit:'+key,form:true,render:()=>editor(kind,id)});capture();draft.initialValues||=W().clone(draft.values);
    }
    function previewView(){modal('修改预览',`<p>${prepared.kind==='template'?'资料模板':'世界个体'} · ${e(prepared.name)}</p><div class="cm-table-wrap"><table><thead><tr><th>字段</th><th>原值</th><th>新值</th></tr></thead><tbody>${prepared.changes.map(d=>`<tr><td>${e(labels[d.path.join('.')]||d.path.join('.'))}</td><td>${e(typeof d.before==='object'?JSON.stringify(d.before):d.before??'空')}</td><td>${e(typeof d.after==='object'?JSON.stringify(d.after):d.after??'空')}</td></tr>`).join('')}</tbody></table></div><p>${prepared.kind==='template'?'仅影响未来引入；已有个体与后代不变。':`关联直接子代${prepared.effect.children||0}匹。亲缘修正影响当前查询、子代统计及未来繁殖。`}</p><p>历史赛果、评分、已封存荣誉与锁定快照保持不变。</p><div class="cm-sticky-actions">${b('worldEditApply','保存修改','',prepared.changes.length?'class="cm-primary"':'disabled')}${b('worldEditReturn','返回编辑')}</div>`);}
    async function toggle(on){if(!c.store.writable)throw Error('当前页面只读。');capture();if(!on&&[...drafts.values()].some(d=>d.dirty)){modal('关闭世界编辑模式','<p>尚有未保存编辑。关闭会放弃这些草稿并隐藏真实参数，已保存修改保留。</p>'+b('worldEditDiscardDisable','放弃草稿并关闭')+b('worldEditReturn','返回编辑'));return;}
      if(on&&!c.world.editor?.acknowledged){modal('开启世界编辑模式','<p>将公开真实属性，修改影响后续模拟；关闭不会撤销已保存修改。</p>'+b('worldEditEnable','开启'));return;}await setMode(on);
    }
    async function setMode(on){await c.commit(E().toggle(c.world,on));clear();c.purge();await c.render();}
    function clear(){drafts.clear();draft=null;prepared=null;}
    function close(){capture();if(draft?.dirty&&c.dialog.querySelector('[data-form=worldEdit]')){modal('尚未保存','<p>是否保留当前编辑草稿？</p>'+b('worldEditKeep','保留草稿并关闭')+b('worldEditDiscard','放弃草稿并关闭'));return true;}return false;}
    async function click(action,id,el){
      if(action==='worldEditorToggle'){await toggle(!E().enabled(c.world));return true;}
      if(action==='worldEditEnable'){await setMode(true);return true;}
      if(action==='worldEditDiscardDisable'){await setMode(false);return true;}
      if(!action.startsWith('worldEdit')&&!action.startsWith('worldTemplate'))return false;allowed();
      if(action==='worldEditHorse'||action==='worldEditTemplate')editor(action==='worldEditHorse'?'horse':'template',id);
      else if(action==='worldEditReturn'){if(draft)editor(draft.kind,draft.id);}
      else if(action==='worldEditParent'){capture();draft.values[el.dataset.parent]=id;draft.dirty=true;editor(draft.kind,draft.id);}
      else if(action==='worldTemplateReset'){prepared=E().preview(c.world,'template',id,{}, {reset:true});previewView();}
      else if(action==='worldEditApply'){await c.commit(E().apply(c.world,prepared));clear();c.purge();await c.render();}
      else if(action==='worldEditUndo'){await c.commit(E().undo(c.world));clear();c.purge();await c.render();}
      else if(action==='worldEditKeep')c.dialog.close();
      else if(action==='worldEditDiscard'){if(draft)drafts.delete(draft.key);draft=null;c.dialog.close();}
      else if(action==='worldEditReal'){const h=B().get(c.world,id);modal(h.name+' · 真实参数',real(h)+b('worldEditHorse','编辑马匹',id));}
      else if(action==='worldEditHistory'){const result=await c.store.scanPage('editorRecords',c.world.id,{index:'byTurn',range:window.IDBKeyRange.bound([c.world.id,0],[c.world.id,Number.MAX_SAFE_INTEGER]),reverse:true,offset:Number(id)||0});modal('世界编辑记录',`${b('worldEditUndo','撤销最近一次编辑','',E().canUndo(c.world)?'':'disabled')}<p>推进或其他游戏数据变更后，请使用设置中的“世界编辑前”恢复点。</p>${result.rows.map(r=>`<details><summary>第${r.year}年 · ${e(r.name)} · ${r.action==='undo'?'撤销':'修改'}</summary>${(r.changes||[]).map(d=>`<p>${e(labels[d.path.join('.')]||d.path.join('.'))}：${e(JSON.stringify(d.before))} → ${e(JSON.stringify(d.after))}</p>`).join('')}</details>`).join('')}${result.offset?b('worldEditHistory','上一页',Math.max(0,result.offset-50)):''}${result.more?b('worldEditHistory','下一页',result.offset+50):''}`);}
      return true;
    }
    async function submit(form){if(form.dataset.form!=='worldEdit')return false;allowed();capture();if(!draft.dirty)throw Error('没有实际修改。');const patch={};let gameChanged=false;for(const k of draft.fields){const v=read(draft.values,k);if(JSON.stringify(v)===JSON.stringify(read(draft.initialValues,k)))continue;if(k.startsWith('game.')){gameChanged=true;continue;}write(patch,k,v);}
      if(draft.kind==='template'){if(patch.displayName!==undefined)patch.name=patch.displayName;if(gameChanged){patch.game={...(E().template(c.world,draft.id).game||{})};for(const k of ['breedingBase','distance','surface','growthType']){const value=read(draft.values,'game.'+k);if(value==null||value==='')delete patch.game[k];else patch.game[k]=value;}}}
      prepared=E().preview(c.world,draft.kind,draft.id,patch);previewView();return true;
    }
    function changed(el){if(el.closest('[data-form=worldEdit]')&&draft){draft.dirty=true;capture();}if(el.dataset.editorParent){const key=el.dataset.editorParent,sex=key==='fatherId'?'牡马':'牝马',rows=draft.kind==='template'?E().templates(c.world):B().all(c.world),q=el.value.toLowerCase();c.dialog.querySelector(`[data-parent-results="${key}"]`).innerHTML=rows.filter(h=>h.id!==draft.id&&h.gender===sex&&[h.name,h.originalName,h.displayName,h.id,...(h.aliases||[])].some(v=>String(v||'').toLowerCase().includes(q))).slice(0,50).map(h=>b('worldEditParent',`${h.displayName||h.name||h.originalName} · ${h.birthYear}年`,h.id,`data-parent="${key}"`)).join('');}}
    function real(h){const p=E().project(c.world,h);if(!p.real)return '<p>属性未公开</p>';if(!h.strength)return '<p>无模拟参数</p>';return `<dl class="cm-attributes">${Object.entries(p.real).filter(([,v])=>v!=null).map(([k,v])=>typeof v==='object'?Object.entries(v).map(([a,x])=>`<div><dt>${e(aptitudeLabels[a]||labels[`${k}.${a}`]||k)}</dt><dd>${e(typeof x==='object'?JSON.stringify(x):x)}</dd></div>`).join(''):`<div><dt>${e(labels[k]||k)}</dt><dd>${e(v)}</dd></div>`).join('')}</dl><p>所在地 ${e(h.locationRegion||'未记录')} · 修养${Math.max(0,(h.restUntil||0)-c.world.turn)}个半月</p>`;}
    function decorate(tab){if(tab==='settings'){const f=c.body.querySelector('[data-form=settings]');if(f&&!f.querySelector('[data-action=worldEditorToggle]'))f.insertAdjacentHTML('beforeend',`<div class="cm-actions">${b('worldEditorToggle',E().enabled(c.world)?'关闭世界编辑模式':'开启世界编辑模式','',c.store.writable?'':'disabled')}${E().enabled(c.world)?b('worldEditHistory','编辑记录与撤销'):''}</div>`);}if(E().enabled(c.world))c.root.querySelector('.cm-world-bar')?.insertAdjacentHTML('beforeend',b('worldEditorToggle','世界编辑中 · 关闭','',c.store.writable?'':'disabled'));}
    return {click,submit,changed,decorate,clear,close,real,capture};
  }};
})();
