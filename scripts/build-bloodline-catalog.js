'use strict';
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),source=JSON.parse(fs.readFileSync(path.join(root,'js/data/chairman-pedigrees.json'),'utf8'));
const rows=source.records,byId=new Map(rows.map(r=>[r.id,r])),byName=new Map(rows.map(r=>[r.originalName,r]));
const types=['burst','sustained','attrition'],label={burst:'瞬发',sustained:'持久',attrition:'消耗'};
const hash=s=>[...s].reduce((h,c)=>Math.imul(h^c.charCodeAt(0),16777619)>>>0,2166136261);
const groups={
 sustained:"Tony Bin|Mejiro McQueen|Stay Gold|Heart's Cry|Rulership|Orfevre|Harbinger|Epiphaneia|Kitasan Black|Air Groove|Dyna Carle|Dancing Key|Hishi Amazon|Kawakami Princess|Lys Gracieux|Chrono Genesis|Daring Tact|Mill Reef|Ribot|Sadler's Wells|Rainbow Quest|Hyperion|Montjeu|Galileo|Teofilo|Sea The Stars|Golden Horn|Almanzor|All Along|Urban Sea|User Friendly|Allez France|Detroit|Slightly Dangerous|Salsabil|Dunfermline|Pawneese|Zomaradah|Ouija Board|Albanova|Dar Re Mi|Midday|Zarkava|Snow Fairy|The Fugue|Taghrooda|Best In The World|Enable|Snowfall|Treve|Alpinista|Secretariat|Seattle Slew|A.P. Indy|Curlin|Shuvee|Rags to Riches|Malathaat|Nest|Damascus",
 burst:"Tosho Boy|Maruzensky|Tokai Teio|Fuji Kiseki|Special Week|Sunday Silence|King Kamehameha|Deep Impact|Kizuna|Duramente|Contrail|Equinox|Cesario|Gentildonna|Almond Eye|Gran Alegria|Loves Only You|Liberty Island|Green Desert|Machiavellian|Pivotal|Invincible Spirit|Oasis Dream|Dark Angel|Kingman|Too Darn Hot|Miesque|Goldikova|Immortal Verse|Alpha Centauri|Winter|Inspiral|Meow|Mr. Prospector|Elusive Quality|Speightstown|Gold Beauty|Ta Wee|Goodnight Olive",
 attrition:"Daiwa Major|King Halo|Lord Kanaloa|Kyoei March|Daiwa Scarlet|Sodashi|Danehill|Dubai Millennium|Dubawi|Shamardal|Lope de Vega|Night of Thunder|Giant's Causeway|Tapit|Medaglia d'Oro|Zenyatta|Rachel Alexandra"
};
const mainOverrides=new Map();for(const [t,names] of Object.entries(groups))for(const name of names.split('|'))mainOverrides.set(name,t);
const lineageSpecs=[
 ['Partholon','partholon','sustained'],['Hindostan','hindostan','sustained'],['Tesco Boy','tescoboy','burst'],['Fine Top','finetop','sustained'],['Djebel','djebel','sustained'],['Princely Gift','princelygift','burst'],['Bering','bering','sustained'],['Ahonoora','ahonoora','attrition'],['Sunday Silence','sunday','burst'],['Tony Bin','tonybin','sustained'],['Roberto','roberto','sustained'],['Halo','halo','burst'],['Hail to Reason','hailreason','sustained'],
 ['Kingmambo','kingmambo','burst'],['Dubai Millennium','dubai','attrition'],['Seeking the Gold','seekinggold','attrition'],['Mr. Prospector','mrprospector','attrition'],['Native Dancer','nativedancer','attrition'],['Raise a Native','raisenative','attrition'],
 ["Sadler's Wells",'sadlers','sustained'],['Danehill','danehill','attrition'],['Green Desert','greendesert','burst'],['Danzig','danzig','attrition'],['Nureyev','nureyev','burst'],['Lyphard','lyphard','burst'],['Nijinsky','nijinsky','sustained'],['Northern Taste','northerntaste','burst'],['Northern Dancer','northerndancer','sustained'],['Storm Cat','stormcat','attrition'],['Storm Bird','stormbird','attrition'],['Deputy Minister','deputyminister','attrition'],
 ['A.P. Indy','apindy','sustained'],['Seattle Slew','seattleslew','sustained'],['Bold Ruler','boldruler','attrition'],['Mill Reef','millreef','sustained'],['Never Bend','neverbend','sustained'],['Ribot','ribot','sustained'],['Hyperion','hyperion','sustained'],['Nasrullah','nasrullah','burst'],['Nearco','nearco','sustained'],['Teddy','teddy','sustained'],['Blandford','blandford','sustained'],['Tom Fool','tomfool','burst'],['Caro','caro','attrition'],['Grey Sovereign','greysovereign','attrition'],['Damascus','damascus','sustained'],['In Reality','inreality','attrition'],['Street Cry','streetcry','attrition'],["Medaglia d'Oro",'medaglia','attrition']
];
const anchors=new Map(lineageSpecs.map(([name,id,trait])=>{const r=byName.get(name);if(!r)throw Error('Missing lineage anchor '+name);return[r.id,{id,label:r.displayName||name,trait,ancestorId:r.id}];}));
function lineage(r,seen=new Set()){if(!r||seen.has(r.id))return null;if(anchors.has(r.id))return anchors.get(r.id);seen.add(r.id);return lineage(byId.get(r.fatherId),seen);}
function family(r){const seen=new Set();while(r?.motherId&&byId.has(r.motherId)&&!seen.has(r.id)){seen.add(r.id);r=byId.get(r.motherId);}return r?'known-maternal-'+r.id:null;}
const lineAssignments=Object.fromEntries(rows.map(r=>[r.id,lineage(r)?.id||null]));
const usage=new Map();for(const r of rows.filter(r=>r.core)){const seen=new Set();function walk(id,d){const a=byId.get(id);if(!a||d>3)return;if(!seen.has(id)){seen.add(id);usage.set(id,(usage.get(id)||0)+1);}walk(a.fatherId,d+1);walk(a.motherId,d+1);}walk(r.fatherId,1);walk(r.motherId,1);}
const featured=new Set('Deep Impact|King Kamehameha|Galileo|Dubawi|Tapit|Sunday Silence|Air Groove|Cesario|Gentildonna|Urban Sea|Zenyatta|Rachel Alexandra'.split('|'));
const balanced=new Set('Nearco|Northern Dancer|La Troienne|Hasili'.split('|'));
const dual=new Set('Sunday Silence|Dubai Millennium|Scat Daddy|American Pharoah|Sodashi|Elusive Quality'.split('|'));
const turfUS=new Set("Giant's Causeway|Danzig|Gamely|Toussaud|Fall Aspen|Fun House|Love Style".split('|'));
const short=new Set('Lord Kanaloa|Oasis Dream|Dark Angel|Green Desert|Invincible Spirit|Pivotal|Speightstown|Ta Wee|Gold Beauty|Goodnight Olive|Meow'.split('|'));
const eliteMares=new Set('Urban Sea|Hasili|La Troienne'.split('|'));
const strongMares=new Set("Dyna Carle|Scarlet Bouquet|Air Groove|Biwa Heidi|Cesario|Oriental Art|Dancing Key|Antique Value|Rafha|Miesque|Zomaradah|Zenda|Somethingroyal|Weekend Surprise|Toussaud|Fall Aspen|Terlingua|Leslie's Lady|Love Style|Quiet Giant|Stage Magic".split('|'));
const assignments=[];
for(const r of rows){const core=!!r.core;if(!core&&(usage.get(r.id)||0)<4&&!anchors.has(r.id))continue;
 const name=r.originalName,h=hash(r.id),line=lineage(r),region=r.region||'祖先';
 const main=mainOverrides.get(name)||line?.trait||(region==='日本'?'burst':region==='欧洲'?'sustained':'attrition');
 const second=types.filter(t=>t!==main)[hash(r.id+'secondary')%2];
 if(!core){assignments.push({id:r.id,name:r.displayName||name,english:name,role:'关键祖先',region,usage:usage.get(r.id)||0,method:'重复出现祖先按已知父系模板赋因子；非现实遗传结论',genetics:{lineId:line?.id||null,factors:[{trait:main,power:1}]}});continue;}
 let surface=dual.has(name)?'dual':r.game?.surface==='泥地'?'dirt':r.game?.surface==='草地'?'grass':region==='美国'&&!turfUS.has(name)?'dirt':'grass';
 let primary=mainOverrides.get(name)||(region==='日本'?'burst':region==='欧洲'?'sustained':surface==='grass'?'attrition':line?.trait||'attrition');
 const secondary=types.filter(t=>t!==primary)[hash(r.id+'secondary')%2];
 let template=balanced.has(name)?'○○○':featured.has(name)?'◎○△':h%100<55?'◎△△':h%100<80?'○○△':'◎○△';
 let quality=eliteMares.has(name)?95:strongMares.has(name)?85:({35:50,50:65,65:75,80:85,90:95}[r.game?.breedingBase]||65);
 let coreDistance=short.has(name)?1200:r.game?.distance|| (primary==='sustained'?2400:surface==='dirt'?1800:primary==='burst'?1600:2000);
 coreDistance=Math.max(1200,Math.min(3600,Math.round(coreDistance/200)*200));
 const stability=[35,60,80][hash(r.id+'stability')%10<2?0:hash(r.id+'stability')%10<8?1:2];
 const track=Object.fromEntries(types.map(t=>[t,'△']));track[primary]=template[0];track[secondary]=template[1];if(template==='○○○')types.forEach(t=>track[t]='○');
 const factors=[{trait:primary,power:1}];if(anchors.has(r.id)||eliteMares.has(name))factors.push({trait:secondary,power:1});
 const genetics={lineId:line?.id||null,familyId:family(r),quality,stability,trackAptitudes:track,surfaceGrades:{grass:surface==='dirt'?'C':'A',dirt:surface==='grass'?'C':'A'},distance:{min:Math.max(1000,coreDistance-400),core:coreDistance,max:Math.min(4200,coreDistance+400)},growthType:r.game?.growthType|| (short.has(name)?'早熟':'普早'),temperamentLabel:'普通',heavyType:'普通',factors};
 assignments.push({id:r.id,name:r.displayName||name,english:name,role:'核心繁殖马',region,gender:r.gender,classification:template==='○○△'||template==='○○○'?'均衡':label[primary],primary,template,surface,usage:usage.get(r.id)||0,method:mainOverrides.has(name)?'个体游戏定位＋模板': '地区／父系游戏模板',distanceSource:r.game?.distance?'沿用旧游戏距离并取整':'模板默认距离',surfaceSource:dual.has(name)||turfUS.has(name)?'游戏兼用／草地定位':r.game?.surface?'沿用旧游戏场地':'地区模板默认',genetics});
}
const pairs=[['partholon','sunday'],['hindostan','roberto'],['tescoboy','northerntaste'],['finetop','sunday'],['sunday','tonybin'],['sunday','roberto'],['kingmambo','sunday'],['tonybin','sunday'],['roberto','kingmambo'],['northerntaste','sunday'],['sadlers','sunday'],['sadlers','danehill'],['danehill','sadlers'],['dubai','sadlers'],['greendesert','mrprospector'],['millreef','danzig'],['ribot','nureyev'],['hyperion','nasrullah'],['apindy','medaglia'],['apindy','mrprospector'],['stormcat','apindy'],['mrprospector','stormcat'],['medaglia','seattleslew'],['streetcry','danzig'],['caro','sunday'],['damascus','mrprospector'],['inreality','apindy'],['nijinsky','sunday'],['tomfool','northerndancer']];
for(const a of assignments)a.sourceUrl=byId.get(a.id).profileUrl||'https://www.jbis.or.jp/horse/'+byId.get(a.id).jbisId+'/';
const data={version:'bloodline-catalog-game-v1',note:'240匹核心马的粗分类游戏赋值；身份与系谱沿用原库。地区、父系模板及稳定差异是设计选择，不是史实遗传结论；未知字段的模板默认均有标记。',roots:rows.filter(r=>r.core).map(r=>r.id),lines:[...anchors.values()],lineAssignments,assignments,nicks:pairs.map(([sireLine,broodmareSireLine])=>({sireLine,broodmareSireLine}))};
fs.writeFileSync(path.join(root,'js/data/bloodline-catalog.json'),JSON.stringify(data,null,2)+'\n');
fs.writeFileSync(path.join(root,'js/data/bloodline-catalog.js'),`(function(){'use strict';const ns=window.Keiba;const data=${JSON.stringify(data)};const patches=new Map(data.assignments.map(r=>[r.id,r.genetics]));data.records=ns.ChairmanPedigrees.records.map(r=>({...r,genetics:JSON.parse(JSON.stringify(patches.get(r.id)||{lineId:data.lineAssignments[r.id]||null}))}));data.scenarios=(ns.BloodlinePilot?.scenarios||[]).map(s=>({...s,label:s.label.replace(/^[^：]+：/,'')}));ns.BloodlineCatalog=data;})();\n`);
let md='# 血统库游戏赋值清单\n\n'+data.note+'\n\n品质档：50/65/75/85/95；稳定度档：35/60/80。模板差异用稳定编号确定，不消耗游戏随机数。初始优秀组合只保留4匹○○○，其余使用◎△△、○○△、◎○△。母系家族标识只代表目前已知母链末端，不冒充现实母系族号。无已知血系锚点的父链保持未知。\n\n|地区|马匹|性别|分类|瞬/持/耗|草/泥|距离|素质|稳定度|因子|依据|\n|---|---|---|---|---|---|---|---|---|---|---|\n';
for(const r of assignments.filter(r=>r.role==='核心繁殖马')){const g=r.genetics;md+=`|${r.region}|${r.name} / ${r.english}|${r.gender}|${r.classification}|${types.map(t=>g.trackAptitudes[t]).join('/')}|${g.surfaceGrades.grass}/${g.surfaceGrades.dirt}|${g.distance.min}–${g.distance.max}（${g.distance.core}）|${g.quality}|${g.stability}|${g.factors.map(f=>label[f.trait]+f.power).join('/')}|${r.method}；${r.surfaceSource}；${r.distanceSource}|\n`;}
md+='\n## 关键祖先\n\n';for(const r of assignments.filter(r=>r.role==='关键祖先'))md+=`- ${r.name} / ${r.english}：${r.genetics.lineId||'血系未知'}，${r.genetics.factors.map(f=>label[f.trait]+f.power).join('/')}；见于${r.usage}匹核心马的三代祖先。\n`;
fs.writeFileSync(path.join(root,'docs/血统库游戏赋值清单-2026-09-24.md'),md);
console.log(JSON.stringify({core:data.roots.length,ancestors:assignments.length-data.roots.length,lines:data.lines.length,nicks:data.nicks.length,unknownCoreLines:assignments.filter(r=>r.role==='核心繁殖马'&&!r.genetics.lineId).map(r=>r.name)}));
