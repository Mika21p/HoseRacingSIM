(function () {
  'use strict';
  const ns = window.Keiba;
  const labels = { burst: '瞬发', sustained: '持久', attrition: '消耗', grass: '草地', dirt: '泥地', calm: '沉稳', heavy: '重场' };
  const e = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const options = list => list.map(s => `<option value="${e(s)}">${e(s || '全部')}</option>`).join('');
  function setupHtml() {
    return `<div class="bloodline-picker" id="careerBloodlinePicker"><div class="section-title-row"><div><h3>选择父母</h3><p class="muted">跨地区、跨年代自由配合</p></div><button type="button" class="secondary" id="randomParentsBtn">随机配合</button></div><div class="bloodline-parents">${[['sire', '父马'], ['dam', '母马']].map(([key, name]) => `<section><label>${name}搜索<input id="${key}Search" type="search" placeholder="名字或别名" aria-label="搜索${name}"></label><div class="bloodline-filters"><label>地区<select id="${key}Region">${options(['', '日本', '欧洲', '美国'])}</select></label><label>特点<select id="${key}Trait">${options(['', '瞬发', '持久', '消耗', '均衡'])}</select></label></div><label>${name}<select id="${key}Select"></select></label><p class="muted" id="${key}Summary"></p></section>`).join('')}</div><div id="pairBrief" aria-live="polite"></div></div>`;
  }
  function brief(p) {
    const weights = Object.entries(p.directionWeights || {}).filter(([k]) => ['burst', 'sustained', 'attrition'].includes(k)).sort((a, b) => b[1] - a[1]);
    const lines = [];
    if (weights.length) lines.push(weights[0][1] - weights[weights.length - 1][1] < .15 ? '血统方向较均衡，后代可能走出不同路线。' : `血统倾向${labels[weights[0][0]]}，这是遗传方向，不代表后代一定拥有该项优势。`);
    const prose = {
      nick: '母父配合良好，有助于优秀适性与能力表现。',
      specialization: '双方祖系支持同一专精，后代更容易延续特色，低发挥时也有一定缓冲。',
      complement: '双方祖系形成互补，有机会兼顾不同赛场，低发挥时也有一定缓冲。',
      diversity: '祖系来源多样，有助于表现稳定并拓宽适性。',
      ancestor: '共同祖先重复，其遗传特色得到强化，同时需要留意亲缘风险。'
    };
    for (const t of p.theories || []) if (prose[t.id]) lines.push(p.mode === 'legend' ? prose[t.id].replace('，低发挥时也有一定缓冲', '') : prose[t.id]);
    if (p.risk?.level === '禁止' || p.legal === false) lines.push('直系或过近亲缘，不能进行这组配合。');
    else if (['高', '中', '低'].includes(p.risk?.level)) lines.push(`亲缘风险${p.risk.level}：后代出现暴躁气性的机会有所增加。`);
    if (p.risk?.incomplete) lines.push('部分祖先资料未知，无法完整判断亲缘和血统多样性。');
    if (!lines.length) lines.push('现有资料不足，暂无法分析血统倾向。');
    return `<ul class="bloodline-brief">${lines.map(s => `<li>${e(s)}</li>`).join('')}</ul>`;
  }
  function bindSetup() {
    if (!document.getElementById('careerBloodlinePicker')) return;
    const B = ns.CareerBloodline;
    const assignments = new Map(ns.BloodlineCatalog.assignments.map(a => [a.id, a]));
    function refreshList(key, selected) {
      const select = document.getElementById(key + 'Select');
      const current = selected || select.value;
      const search = document.getElementById(key + 'Search').value.trim().toLocaleLowerCase();
      const region = document.getElementById(key + 'Region').value, trait = document.getElementById(key + 'Trait').value;
      const rows = B.parents(key === 'sire' ? '牡马' : '牝马').filter(r => (!region || r.region === region) && (!trait || assignments.get(r.id)?.classification === trait) && (!search || [r.displayName, r.originalName, ...(r.aliases || [])].some(n => String(n).toLocaleLowerCase().includes(search))));
      select.innerHTML = rows.length ? rows.map(r => `<option value="${e(r.id)}">${e(r.displayName || r.name)}</option>`).join('') : '<option value="">暂无匹配马匹</option>';
      if (rows.some(r => r.id === current)) select.value = current;
      select.disabled = !rows.length;
    }
    function update() {
      const ids = ['sire', 'dam'].map(key => document.getElementById(key + 'Select').value);
      for (const [i, key] of ['sire', 'dam'].entries()) {
        const r = B.getLibrary().get(ids[i]), a = assignments.get(ids[i]);
        document.getElementById(key + 'Summary').textContent = r ? `${r.region} · ${a?.classification || '未知'} · ${r.genetics.distance?.min || '?'}–${r.genetics.distance?.max || '?'}米 · ${r.genetics.growthType || '成长未知'}` : '请调整筛选条件。';
      }
      const target = document.getElementById('pairBrief'), button = document.getElementById('generateBtn');
      if (!ids.every(Boolean)) { target.textContent = '请选择父马和母马。'; button.disabled = true; return; }
      const p = B.pair(...ids, document.getElementById('gameModeSelect').value === 'legend' ? 'legend' : 'normal').preview;
      target.innerHTML = brief(p); button.disabled = !p.legal;
    }
    function random() {
      const ids = B.randomPair();
      ['sire', 'dam'].forEach((key, i) => { ['Search', 'Region', 'Trait'].forEach(suffix => { document.getElementById(key + suffix).value = ''; }); refreshList(key, ids[i]); });
      update();
    }
    for (const key of ['sire', 'dam']) {
      for (const suffix of ['Search', 'Region', 'Trait']) document.getElementById(key + suffix).addEventListener(suffix === 'Search' ? 'input' : 'change', () => { refreshList(key); update(); });
      document.getElementById(key + 'Select').addEventListener('change', update);
    }
    document.getElementById('randomParentsBtn').addEventListener('click', random);
    document.getElementById('gameModeSelect').addEventListener('change', update);
    random();
  }
  function render(panel, career) {
    if (!panel) return;
    const h = career?.horse;
    if (!h) { panel.innerHTML = ''; return; }
    const p = h.pedigree;
    const header = `<h2>${e(h.name)}的血统</h2>${h.debugMode ? '<p class="muted">属性经过调试修改，当前表现不完全来自遗传。</p>' : ''}<div class="bloodline-identity"><p>父马<br><strong>${e(h.sireName || '未知')}</strong></p><p>母马<br><strong>${e(h.damName || '未知')}</strong></p><p>母父<br><strong>${e(p?.ancestors?.find(a => a.path === '母父')?.name || '未知')}</strong></p></div>`;
    if (!p?.ancestors) { panel.innerHTML = header + '<p>旧版血系记录，暂无完整祖先资料。</p>'; return; }
    const sameHorse = panel.dataset.horseId === String(h.id);
    const depth = sameHorse && panel.dataset.treeDepth === '4' ? 4 : 3;
    panel.dataset.horseId = h.id; panel.dataset.treeDepth = depth;
    panel.innerHTML = header + '<h3>血统简评</h3>' + brief(p) + '<p class="muted">以上是血统倾向；已生成的实际适性请在“马匹”页面查看。</p><h3>血统图</h3>' +
      `<div class="pt-depth" aria-label="血统代数">${[3,4].map(d=>`<button type="button" data-tree-depth="${d}" aria-pressed="${depth===d}">${d===3?'三':'四'}代</button>`).join('')}</div>` +
      ns.PedigreeTree.render({key:'career:'+h.id, root:{id:h.id,name:h.name}, ancestors:p.ancestors, depth});
    panel.querySelectorAll('[data-tree-depth]').forEach(button=>button.addEventListener('click',()=>{panel.dataset.treeDepth=button.dataset.treeDepth;render(panel,career);}));
  }
  function retirementTable(horse) {
    const ancestors = horse?.pedigree?.ancestors;
    const legacy = !Array.isArray(ancestors);
    const byPath = new Map((ancestors || []).map(a => [a.path, a]));
    function cell(path, label, rows = 1) {
      const a = byPath.get(path);
      const name = a?.name || (legacy ? ({父: horse.sireName, 母: horse.damName})[path] : '') || '未知';
      const line = a?.lineLabel;
      const lineText = !line || line === '未知' ? '血系未知' : /血系$|家系$/.test(line) ? line : line + '血系';
      return `<td rowspan="${rows}" class="retirement-pedigree-${path.endsWith('父') ? 'male' : 'female'}" data-path="${path}"><small>${label}</small><strong>${e(name)}</strong><span>${e(lineText)}</span></td>`;
    }
    return `<section class="retirement-pedigree"><table aria-label="两代血统表"><caption>血统</caption><tbody><tr>${cell('父', '父马', 2)}${cell('父父', '父父')}</tr><tr>${cell('父母', '父母')}</tr><tr>${cell('母', '母马', 2)}${cell('母父', '母父')}</tr><tr>${cell('母母', '母母')}</tr></tbody></table>${legacy ? '<p class="muted">旧版血系记录，暂无完整祖先资料。</p>' : ''}</section>`;
  }
  ns.CareerBloodlineUI = { setupHtml, bindSetup, render, brief, retirementTable };
})();
