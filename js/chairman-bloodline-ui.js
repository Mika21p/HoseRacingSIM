(function(){
 'use strict';const ns=window.Keiba;
 ns.ChairmanBloodlineUI={async render(c,view,p){
  const {escape:e,button:b,input}=c,w=c.world,G=ns.ChairmanGenetics;
  const link=h=>b('pedigree',h.name,h.horseId||h.id,'class="cm-link"');
  const page=(rows,key,render)=>{const offset=Math.min(Number(p.offsets?.[key])||0,Math.max(0,Math.floor((rows.length-1)/50)*50));return render(rows.slice(offset,offset+50))+(rows.length>50?`<div class="cm-pagination">${b('breedFamilyPage','上一页',key+':'+Math.max(0,offset-50),offset?'':'disabled')}<span>共${rows.length}条 · 第${Math.floor(offset/50)+1}页</span>${b('breedFamilyPage','下一页',key+':'+(offset+50),offset+50<rows.length?'':'disabled')}</div>`:'');};
  const table=(rows,kind)=>page(rows,kind,rows=>rows.length?`<div class="cm-table-wrap"><table><thead><tr><th>${kind}</th><th>出赛／胜出</th><th>G1／奖金</th><th>代表后代</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${link(r)}${r.label?`<small>${e(r.label)} · 延续${r.generations}代 · ${r.members}成员 · ${r.breedingDaughters}匹繁殖母马</small>`:''}</td><td>${r.starters}／${r.winners}</td><td>${r.g1}／${r.prize.toFixed(1)}万</td><td>${r.representatives.map(link).join(' · ')||'暂无'}</td></tr>`).join('')}</tbody></table></div>`:'<p class="cm-empty">暂无出赛后代。</p>');
  if(view==='families'){const stats=G.familyStats(w);return '<h2>母父与母系家族</h2><p>按真实出赛后代统计，不提供永久遗传加成；同一后代在同一榜单中只计一次。</p><h3>母父表现</h3>'+table(stats.broodmareSires,'母父')+'<h3>母系家族</h3>'+table(stats.maternalFamilies,'已知母链起点');}
  const y=Number(p.year)||Math.max(1,ns.ChairmanRules.date(w.turn).year-1),rows=(await c.store.query('breedingReports',w.id,{year:y,limit:100})).rows,r=rows[0];
  let html=`<h2>年度繁殖报告</h2><form data-form="breedBoard">${input('year','年度',y,'number')}<button>查询年度</button></form>`;
  if(!r)return html+'<p>本年度尚无新版报告；旧年度记录不重算。</p>';
  html+=`<p>${r.year}年 · 安排${r.pairs}组配合${r.upgraded?' · 本年已自动升级血统规则':''}</p><h3>种马与种母马实绩</h3><div class="cm-table-wrap"><table><thead><tr><th>马匹</th><th>性别</th><th>出赛／胜出</th><th>G1／子代奖金</th></tr></thead><tbody>${r.parents.map(h=>`<tr><td>${link(h)}${h.champion?'<small>冠军种马</small>':''}</td><td>${e(h.gender)}</td><td>${h.starters}／${h.winners}</td><td>${h.g1}／${h.prize.toFixed(1)}万</td></tr>`).join('')}</tbody></table></div>`;
  html+='<h3>首批子代出赛</h3>'+ (r.firstCrop.map(h=>`<p>${link(h)} · ${h.starters}匹出赛 · ${e(h.grade)} · ${e(h.confidence)}</p>`).join('')||'<p>暂无。</p>');
  html+='<h3>评价上升最快</h3>'+(r.rising.slice(0,10).map(h=>`<p>${link(h)} · 新增${h.newStarters}匹出赛子代 · 公开评价上升</p>`).join('')||'<p>暂无符合至少新增三匹出赛子代的对象。</p>');
  html+='<h3>母父表现</h3>'+table(r.broodmareSires,'母父')+'<h3>母系家族</h3>'+table(r.maternalFamilies,'家族');
  const labels=new Map(ns.BloodlineCatalog.lines.map(l=>[l.id,l.label]));
  html+='<h3>本批配合父系分布</h3>'+r.lines.map(l=>`<p>${e(labels.get(l.id)||(l.kind==='fictional'?'架空家系 '+l.id.replace('fictional:',''):'未知来源'))} · ${l.count}匹${r.pairs?' · '+(100*l.count/r.pairs).toFixed(1)+'%':''}</p>`).join('');
  html+='<h3>稀有家系延续</h3>'+((r.rareLines||[]).map(l=>`<p>${e(labels.get(l.id)||'架空家系 '+l.id.replace('fictional:',''))} · 此前五年产驹占比${(l.previousShare*100).toFixed(1)}% · 本批延续${l.count}匹</p>`).join('')||'<p>暂无此前已有产驹且占比不足5%的家系延续记录。</p>');
  html+='<h3>繁殖群补充与调整</h3>'+([...r.supplements.map(h=>`<p>${link(h)} · ${e(h.region)} · ${e(h.reason)}</p>`),...r.cancelled.map(h=>`<p>取消指定 ${e(h.fatherId)} × ${e(h.motherId)}：${e(h.reason)}</p>`)].join('')||'<p>本年度无需补充或取消。</p>');return html;
 }};
})();
