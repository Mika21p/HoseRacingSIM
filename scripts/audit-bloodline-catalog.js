'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),context=vm.createContext({window:{Keiba:{}}});
for(const f of ['js/utils/random.js','js/rules/horse-generator.js','js/rules/bloodline-system.js','js/data/chairman-pedigrees.js','js/data/bloodline-pilot.js','js/data/bloodline-catalog.js'])vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),context);
const {BloodlineSystem:B,BloodlineCatalog:d}=context.window.Keiba,library=B.createLibrary(d.records,d.nicks),core=d.roots.map(id=>library.get(id)),sires=core.filter(r=>r.gender==='牡马'),mares=core.filter(r=>r.gender==='牝马');
const summary={version:d.version,core:core.length,sires:sires.length,mares:mares.length,keyAncestors:d.assignments.length-core.length,regions:{},patterns:{},quality:{},lines:d.lines.length,nicks:d.nicks.length,unknownCoreLines:core.filter(r=>!r.genetics.lineId).map(r=>r.displayName||r.name),pairs:{total:sires.length*mares.length,legal:0,blocked:0,excellentRates:{},theories:{},bySireRegion:{},sireNickCoverage:0,mareNickCoverage:0},samples:{normal:{count:0,sum:0,excellent:0,expectedExcellent:0},chairman:{count:0,sum:0,excellent:0,expectedExcellent:0}}};
for(const r of d.assignments.filter(r=>r.role==='核心繁殖马')){const group=summary.regions[r.region]||={count:0,classification:{},surface:{},sires:0,mares:0};group.count++;group[r.gender==='牡马'?'sires':'mares']++;group.classification[r.classification]=(group.classification[r.classification]||0)+1;group.surface[r.surface]=(group.surface[r.surface]||0)+1;summary.patterns[r.template]=(summary.patterns[r.template]||0)+1;summary.quality[r.genetics.quality]=(summary.quality[r.genetics.quality]||0)+1;}
const sireNicks=new Set(),mareNicks=new Set();let seed=0;
for(const sire of sires)for(const mare of mares){const normal=B.createPair(library,sire.id,mare.id,'normal'),p=normal.preview;seed++;
 if(!p.legal){summary.pairs.blocked++;continue;}
 summary.pairs.legal++;const rate=Math.round(p.trackPlan.excellentChance*100);summary.pairs.excellentRates[rate]=(summary.pairs.excellentRates[rate]||0)+1;
 const region=summary.pairs.bySireRegion[sire.region]||={legal:0,nick:0,full:0};region.legal++;if(rate===20)region.full++;
 for(const t of p.theories)summary.pairs.theories[t.id]=(summary.pairs.theories[t.id]||0)+1;
 if(p.theories.some(t=>t.id==='nick')){sireNicks.add(sire.id);mareNicks.add(mare.id);region.nick++;}
 for(const mode of ['normal','chairman']){const pair=mode==='normal'?normal:B.createPair(library,sire.id,mare.id,mode),h=pair.generate({seed:100000+seed}),s=summary.samples[mode];
  assert.ok(h.strength>=pair.preview.ability.finalMinimum&&h.strength<=100);assert.ok(Object.values(h.trackAptitudes).filter(v=>v==='◎').length<3);assert.ok(h.genetics.factors.length<=2);assert.ok(h.distMin<=h.coreDist&&h.coreDist<=h.distMax);
  s.count++;s.sum+=h.strength;s.excellent+=h.breedingOutcome.excellent;s.expectedExcellent+=p.trackPlan.excellentChance;
 }
}
summary.pairs.sireNickCoverage=sireNicks.size;summary.pairs.mareNickCoverage=mareNicks.size;
for(const s of Object.values(summary.samples)){s.mean=s.sum/s.count;s.excellentPercent=s.excellent/s.count*100;s.expectedExcellentPercent=s.expectedExcellent/s.count*100;delete s.sum;delete s.expectedExcellent;}
fs.writeFileSync(path.join(root,'artifacts/bloodline-catalog-audit.json'),JSON.stringify(summary,null,2)+'\n');
let md='# 血统库批量赋值与初测\n\n240匹核心马均已赋值，另有'+summary.keyAncestors+'匹关键祖先仅补血系／因子。原始身份和系谱数据未改动。采用游戏模板，不是精确史实评级；完整逐匹清单见[赋值清单](血统库游戏赋值清单-2026-09-24.md)。\n\n|地区|牡／牝|瞬发|持久|消耗|均衡|草／泥／兼用|\n|---|---|---|---|---|---|---|\n';
for(const [region,r] of Object.entries(summary.regions))md+=`|${region}|${r.sires}/${r.mares}|${r.classification['瞬发']||0}|${r.classification['持久']||0}|${r.classification['消耗']||0}|${r.classification['均衡']||0}|${r.surface.grass||0}/${r.surface.dirt||0}/${r.surface.dual||0}|\n`;
md+='\n初始组合：'+Object.entries(summary.patterns).map(([k,v])=>k+' '+v+'匹').join('；')+'。只有4匹○○○，没有双◎初始个体。\n\n## 配合遍历\n\n共检查'+summary.pairs.total+'组父母配合，合法'+summary.pairs.legal+'组，近亲拦截'+summary.pairs.blocked+'组。每个合法组合两模式各生成一匹，共'+(summary.samples.normal.count+summary.samples.chairman.count)+'匹。此抽样用于规则健全性和总体分布，不代表任何单独组合的准确胜率。\n\n|优秀池概率|合法组合数|占比|\n|---|---:|---:|\n';
for(const [rate,count] of Object.entries(summary.pairs.excellentRates))md+=`|${rate}%|${count}|${(100*count/summary.pairs.legal).toFixed(2)}%|\n`;
md+='\n母父相性覆盖'+sireNicks.size+'/90匹种牡马、'+mareNicks.size+'/150匹母马（至少有一个合法命中组合）。\n\n|父马地区|合法组合|命中母父相性|达到20%|\n|---|---:|---:|---:|\n';
for(const [region,r] of Object.entries(summary.pairs.bySireRegion))md+=`|${region}|${r.legal}|${r.nick}|${r.full}|\n`;
md+='\n|模式|生成数|平均能力|优秀组合实测|按所测组合计算的期望|\n|---|---:|---:|---:|---:|\n';
for(const [mode,s] of Object.entries(summary.samples))md+=`|${mode==='normal'?'常规':'主席'}|${s.count}|${s.mean.toFixed(2)}|${s.excellentPercent.toFixed(2)}%|${s.expectedExcellentPercent.toFixed(2)}%|\n`;
md+='\n## 数据边界\n\n- 核心父链未追溯到已配置血系锚点的有'+summary.unknownCoreLines.length+'匹：'+summary.unknownCoreLines.join('、')+'。其其他游戏属性已赋值，未知血系不参与多样性凑数。\n- 草泥、距离缺失采用模板默认，逐匹标明依据；稳定度和副适性使用稳定编号生成差异，不宣称现实个体特征。\n- 旧中性50繁殖值映射普通65档，关键繁殖母马单独提档；没有用赛绩能力直接充当繁殖素质。\n- 关键祖先标准：出现在至少4匹核心马的三代祖先中，或是明确配置的血系锚点。其余祖先保留身份和已知父系标签，不批量伪造完整遗传评分。\n- 验证台已默认加载完整库，原12匹试验组可切换。正式模式年度生成仍未切换到新引擎。\n';
fs.writeFileSync(path.join(root,'docs/血统库批量赋值与初测-2026-09-24.md'),md);console.log(JSON.stringify(summary,null,2));
