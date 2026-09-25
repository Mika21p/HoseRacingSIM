/* Local curation step: factual parent links remain independent of game presets. */
const fs = require('node:fs'), path = require('node:path');
const root = path.resolve(__dirname, '..');
const { loadChairmanRules } = require('../tests/helpers/project-loader');
const project = loadChairmanRules(), B = project.rules.ChairmanBreeding;
const source = JSON.parse(fs.readFileSync(path.join(root, 'js/data/chairman-pedigrees.json'), 'utf8'));
const nameOverrides = require('../js/data/chairman-pedigree-name-overrides.json');
const normalize = (s) => String(s).normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
const historical = new Map(project.horses.map((h) => [normalize(h.displayNameEn || h.name), h]));
const japanese = new Map(project.horses.map((h) => [String(h.name).normalize('NFKC'), h]));
function kanaIndex(text) {
  const kana = 'あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをんがぎぐげござじずぜぞだぢづでどばびぶべぼぱぴぷぺぽぁぃぅぇぉゔ';
  const sounds = 'a i u e o ka ki ku ke ko sa shi su se so ta chi tsu te to na ni nu ne no ha hi fu he ho ma mi mu me mo ya yu yo ra ri ru re ro wa wo n ga gi gu ge go za ji zu ze zo da ji zu de do ba bi bu be bo pa pi pu pe po a i u e o vu'.split(' ');
  const map = Object.fromEntries([...kana].map((c, i) => [c, sounds[i]]));
  Object.assign(map, { 'ゐ': 'i', 'ゑ': 'e', 'ゃ': 'ya', 'ゅ': 'yu', 'ょ': 'yo', 'ゎ': 'wa' });
  const chars = [...String(text).normalize('NFKC').replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 96))];
  let out = '';
  for (let i = 0; i < chars.length; i++) {
    const c = chars[i]; let sound = map[c] || c;
    if (c === 'っ') { out += (map[chars[i + 1]] || '').charAt(0); continue; }
    if (c === 'ー') { out += out.match(/[aeiou](?=[^aeiou]*$)/)?.[0] || ''; continue; }
    if ('ゃゅょ'.includes(chars[i + 1] || '!') && sound.endsWith('i')) {
      sound = sound.replace(/i$/, '') + (/[hcj]$/.test(sound.replace(/i$/, '')) ? '' : 'y') + ({ 'ゃ':'a', 'ゅ':'u', 'ょ':'o' })[chars[++i]];
    }
    out += sound;
  }
  return out;
}
const groups = [
  [90, "Sunday Silence|Deep Impact|Northern Dancer|Mr. Prospector|Sadler's Wells|Galileo|Danehill|Frankel|Dubawi|Tapit|Into Mischief|Urban Sea|Hasili|La Troienne"],
  [80, "Northern Taste|King Kamehameha|Heart's Cry|Lord Kanaloa|Stay Gold|Kitasan Black|Epiphaneia|Duramente|Storm Cat|A.P. Indy|Danzig|Unbridled|Seattle Slew|Bold Ruler|Native Dancer|Curlin|Gun Runner|Scat Daddy|Quality Road|Medaglia d'Oro|Sea The Stars|Montjeu|Pivotal|Lope de Vega|Kingman|Night of Thunder|Green Desert|Shamardal|Blushing Groom|Ribot|Nearco|Hyperion|Cesario|Air Groove|Dancing Key|Biwa Heidi|Scarlet Bouquet|Dyna Carle|Kind|Zomaradah|Miesque|Rafha|Fall Aspen|Toussaud|Leslie's Lady|Weekend Surprise|Somethingroyal|Terlingua"],
  [65, "Hindostan|Partholon|Tesco Boy|Maruzensky|Tosho Boy|Tony Bin|Brian's Time|Real Shadai|Fuji Kiseki|Special Week|Daiwa Major|Orfevre|Harbinger|Rulership|Kizuna|Nasrullah|Mill Reef|Rainbow Quest|Machiavellian|Invincible Spirit|Oasis Dream|Dark Angel|Teofilo|Too Darn Hot|Almanzor|Secretariat|Deputy Minister|Smart Strike|Distorted Humor|Elusive Quality|Giant's Causeway|Uncle Mo|Speightstown|Street Sense|American Pharoah|Justify|Constitution|Nyquist|Not This Time|Vega|Fusaichi Pandora|Heavenly Romance|To the Victory|Gold Beauty|Quiet Giant|Allegretta|Special|Natalma"],
  [35, 'Tokai Teio|Mejiro McQueen']
];
const bases = new Map(groups.flatMap(([n, list]) => list.split('|').map((name) => [normalize(name), n])));
// Game-only breeding presets for the Japanese-focused expansion. These are
// deliberately separate from the sourced identity and parent links.
for (const [name, base] of [
  ['Wind in Her Hair', 90], ['Gold Ship', 65], ['Mejiro Dober', 65],
  ['Manhattan Cafe', 80], ['Curren Chan', 65], ['T.M. Opera O', 35],
  ['Daiichi Ruby', 65]
]) bases.set(normalize(name), base);
const extraNames = { 'Sunday Silence': '周日宁静', 'Northern Dancer': '北地舞人', 'Mr. Prospector': '淘金者', 'Sadler\'s Wells': '鞍匠井', 'Galileo': '伽利略', 'Danehill': '丹山', 'Urban Sea': '都市海洋', 'A.P. Indy': '艾匹印第', 'Tapit': '普鲁笔', 'Into Mischief': '恶作剧', 'Kingman': '皇治', 'La Troienne': '拉托莲', 'Kind': '善良', 'Hasili': '夏西里' };
for (const h of source.records) {
  const romanized = { 'jbis-0000108334': 'Marble Tosho', 'jbis-0000383510': 'Immense', 'jbis-0001239512': 'Best In The World' }[h.id];
  if (romanized) { h.aliases = [...new Set([...(h.aliases || []), h.originalName])]; h.originalName = romanized; h.nameSourceUrl = `https://www.jbis.or.jp/horse/${h.jbisId}/`; }
  const old = historical.get(normalize(h.originalName)) || japanese.get(h.originalName.normalize('NFKC'));
  const priorDisplayName = h.displayName, priorPinyin = h.pinyin;
  h.displayName = ['欧洲', '美国'].includes(h.region) ? h.originalName : nameOverrides[h.originalName] || old?.displayNameZh || extraNames[h.originalName] || h.originalName;
  h.aliases = [...new Set([...(h.aliases || []), h.originalName, h.name, h.displayName, ...(old ? [old.name, old.displayNameEn] : [])].filter(Boolean))];
  h.pinyin = priorDisplayName === h.displayName && priorPinyin ? priorPinyin : [...h.displayName].map((ch) => B.initial(ch)).join('').toLowerCase();
  h.romanizedName = /[A-Za-z]/.test(h.originalName) ? h.originalName : old?.displayNameEn || kanaIndex(h.originalName);
  h.aliases = [...new Set([...h.aliases, h.romanizedName])];
  const starts = (old?.races || []).map((run) => project.races.find((r) => r.id === run.raceId)).filter(Boolean);
  const distances = starts.map((r) => r.distance).sort((a, b) => a - b);
  const surface = starts.length ? starts.filter((r) => r.surface === '泥地').length > starts.length / 2 ? '泥地' : '草地' : null;
  const growth = old?.races?.length && h.birthYear ? Math.min(...old.races.map((r) => r.year - h.birthYear).filter((a) => a >= 2 && a < 8)) : null;
  h.game = { breedingBase: bases.get(normalize(h.originalName)) ?? 50, distance: distances.length ? distances[Math.floor(distances.length / 2)] : null,
    surface, growthType: Number.isFinite(growth) ? growth <= 2 ? '早熟' : growth === 3 ? '普早' : growth === 4 ? '普迟' : '晚熟' : null,
    note: '游戏粗略预设；不是JBIS的繁殖评价。资料不足时采用中性生成。' };
  h.verification = h.verifiedParents ? '父母已核实' : '祖先资料／父母尚缺';
}
const nodes = new Map(source.records.map((h) => [h.id, h]));
for (const core of source.records.filter((h) => h.core)) {
  const todo = [core.id], seen = new Set();
  while (todo.length) { const id = todo.pop(); if (seen.has(id)) continue; seen.add(id); const h = nodes.get(id); if (!h) continue;
    h.regionTags = [...new Set([...(h.regionTags || []), core.region])]; for (const p of [h.fatherId, h.motherId]) if (p) todo.push(p);
  }
}
if (nodes.size !== source.records.length) throw Error('重复来源编号');
const errors = [], missing = [], visited = new Set(), active = new Set();
function validate(h) {
  if (visited.has(h.id)) return;
  if (active.has(h.id)) throw Error('血统关系循环：' + h.name);
  active.add(h.id);
  for (const [key, gender] of [['fatherId', '牡马'], ['motherId', '牝马']]) if (h[key]) {
    const p = nodes.get(h[key]);
    if (!p) throw Error('缺失父母节点：' + h.name);
    if (p.gender !== gender || p.birthYear != null && h.birthYear != null && p.birthYear > h.birthYear - 2) errors.push(`${h.name} → ${p.name}：性别或年代需复核`);
    validate(p);
  }
  active.delete(h.id); visited.add(h.id);
}
source.records.forEach(validate);
if (errors.length) throw Error(errors.join('\n'));
function gaps(id, prefix = '', depth = 0) {
  if (depth === 3) return;
  const h = nodes.get(id);
  for (const [key, label] of [['fatherId', '父'], ['motherId', '母']]) {
    if (!h?.[key]) missing.push({ id, horse: h?.name || '', path: prefix + label });
    else gaps(h[key], prefix + label, depth + 1);
  }
}
const summary = [];
for (const region of ['日本', '欧洲', '美国']) for (const sex of ['牡马', '牝马']) {
  const rows = source.records.filter((h) => h.core && h.region === region && h.gender === sex);
  const eras = [rows.filter((h) => h.birthYear < 1980).length, rows.filter((h) => h.birthYear >= 1980 && h.birthYear < 2000).length,
    rows.filter((h) => h.birthYear >= 2000 && h.birthYear < 2010).length, rows.filter((h) => h.birthYear >= 2010).length];
  summary.push({ region, sex, count: rows.length, eras });
}
source.records.filter((h) => h.core).forEach((h) => gaps(h.id, h.name + '／'));
source.summary = summary; source.missingThreeGenerations = missing;
fs.writeFileSync(path.join(root, 'js/data/chairman-pedigrees.json'), JSON.stringify(source, null, 2) + '\n');
fs.writeFileSync(path.join(root, 'js/data/chairman-pedigrees.js'), 'window.Keiba.ChairmanPedigrees = ' + JSON.stringify(source) + ';\n');
const report = ['# 第三阶段基础血统资料核对', '', `核对日期：${source.verifiedAt}。共${source.records.length}个唯一来源个体。`, '',
  '| 地区 | 性别 | 核心数 | ≤1979 / 1980–1999 / 2000–2009 / ≥2010 |', '|---|---|---:|---|',
  ...summary.map((r) => `| ${r.region} | ${r.sex} | ${r.count} | ${r.eras.join(' / ')} |`), '',
  '父母来源使用JBIS公开个体页；每条数据保存链接、原名、别名、真实出生年及核对状态。相同祖先共用来源编号。游戏参数与事实字段独立，配种实力为主观粗略分档，未知资料默认50；并非现实繁殖成绩排名。', '',
  '跨年代模板允许现实中未留种的名马在架空世界中成为繁殖马，不虚构其现实产驹记录。年代比例按资料可用性调整；未收录的搜索候选由已核实的母系祖先补充。', '',
  `三代待补位置：${missing.length}。`, ...missing.map((m) => `- ${m.path}（${m.id}）`), '', '采集未命中的候选或祖先：', ...(source.errors || []).map((s) => '- ' + s), ''];
fs.writeFileSync(path.join(root, 'docs/第三阶段血统资料核对.md'), report.join('\n'));
console.log(JSON.stringify({ total: nodes.size, core: source.records.filter((h) => h.core).length, summary, missing: missing.length }, null, 2));
