(function () {
  'use strict';
  const ns = window.Keiba, Hall = () => ns.HallOfFame;
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const modes = { normal: '常规', legend: '传奇', roguelike: '肉鸽' };
  let selected = null, tab = 'overview', bound = false;

  function countText() { return `殿堂 ${Hall().count()}／${Hall().CAPACITY}`; }
  function retirementAction(career) {
    if (!Hall().eligible(career)) return '';
    const id = `player:${career.gameMode || career.horse.gameMode || 'normal'}:${career.horse.id}`;
    const existing = Hall().find(id);
    if (existing) return `<div class="hall-retirement-action"><p>这匹赛马已收藏于殿堂。</p><button class="secondary" type="button" data-hall-open="${esc(id)}">查看殿堂档案</button></div>`;
    if (Hall().count() >= Hall().CAPACITY) return `<div class="hall-retirement-action"><p>已达${Hall().CAPACITY}匹上限，可先在殿堂管理中移出收藏。</p><button class="secondary" type="button" data-hall-manage>管理殿堂</button></div>`;
    return `<div class="hall-retirement-action"><p>达成一级赛胜利条件，可将这匹赛马加入殿堂（${countText()}）。</p><button type="button" data-hall-collect>收藏加入殿堂</button></div>`;
  }
  function card(entry) {
    const horse = entry.career.horse, summary = entry.summary || {};
    const wins = (entry.career.races || []).filter(r => r.public?.rank === 1).slice(-2).map(r => (r.hidden?.race || r.race || {}).name).filter(Boolean).join(' · ');
    return `<article class="hall-card"><button class="hall-card-open" type="button" data-hall-open="${esc(entry.id)}"><strong>${esc(horse.name)}</strong><span>${modes[entry.sourceMode] || '常规'} · ${esc(horse.gender || '未知')}</span><span>${summary.starts || 0}战 ${summary.wins || 0}胜 · 一级赛${summary.gradeOneWins || 0}胜</span><span>父 ${esc(horse.sireName || '未知')} × 母 ${esc(horse.damName || '未知')}</span><small>${esc(wins || '暂无代表胜鞍')}</small></button><button class="secondary hall-remove" type="button" data-hall-remove="${esc(entry.id)}">移除</button></article>`;
  }
  function listHtml() {
    const rows = Hall().list();
    return `<div class="hall-list-toolbar"><strong>${countText()}</strong><label>搜索<input type="search" id="hallSearch" placeholder="马名、父母"></label><label>来源<select id="hallMode"><option value="">全部模式</option><option value="normal">常规</option><option value="legend">传奇</option><option value="roguelike">肉鸽</option></select></label><label>性别<select id="hallGender"><option value="">全部</option><option>牡马</option><option>牝马</option></select></label><label>排序<select id="hallSort"><option value="date">收藏时间</option><option value="wins">一级赛胜场</option></select></label></div><div id="hallList" class="hall-list">${rows.length ? rows.map(card).join('') : '<p class="hall-empty">殿堂还没有赛马。达成三场G1／JpnI胜利后，可在退役总结中收藏。</p>'}</div><div class="hall-data-actions"><button class="secondary" type="button" data-hall-export>导出殿堂备份</button><label class="secondary hall-file-label">导入备份<input id="hallImportFile" type="file" accept="application/json,.json"></label></div>`;
  }
  function detail(entry) {
    if (!entry?.career) return '<p class="hall-empty">这份殿堂档案暂不可用。</p>';
    const career = entry.career, horse = career.horse, summary = entry.summary || {};
    const body = tab === 'history' ? '<div id="hallHistory"></div>' : tab === 'bloodline' ? '<div id="hallBloodline"></div>' : `<div class="stat-grid"><span>能力 <b>${esc(horse.strength ?? '—')}</b></span><span>父马 <b>${esc(horse.sireName || '未知')}</b></span><span>母马 <b>${esc(horse.damName || '未知')}</b></span><span>核心距离 <b>${esc(horse.coreDist || '未知')}m</b></span><span>距离范围 <b>${esc(horse.distMin ?? '—')}～${esc(horse.distMax ?? '—')}m</b></span><span>成长 <b>${esc(horse.growthType || '未知')}</b></span><span>气性 <b>${esc(horse.temperamentLabel || '未知')}</b></span><span>重场 <b>${esc(horse.heavyType || '未知')}</b></span>${Object.entries(horse.surfaceGrades || {}).map(([key, value]) => `<span>${key === 'grass' ? '草地' : '泥地'} <b>${esc(value)}</b></span>`).join('')}${Object.entries(horse.trackAptitudes || {}).map(([key, value]) => `<span>${({ burst: '瞬发', sustained: '持久', attrition: '消耗' })[key] || esc(key)} <b>${esc(value)}</b></span>`).join('')}</div>`;
    return `<div class="hall-detail"><div class="hall-detail-top"><button class="secondary" type="button" data-hall-back>返回殿堂</button><span>${modes[entry.sourceMode] || '常规'} · ${esc(horse.gender || '未知')}</span><button class="secondary" type="button" data-hall-remove="${esc(entry.id)}">移除</button></div><h2>${esc(horse.name)}</h2><p>生涯 ${summary.starts || 0}战 ${summary.wins || 0}胜 · G1 ${summary.g1Wins || 0}胜 · JpnI ${summary.jpn1Wins || 0}胜 · 收藏 ${new Date(entry.joinedAt).toLocaleDateString('zh-CN')}</p><div class="hall-tabs"><button type="button" data-hall-tab="overview">马匹资料</button><button type="button" data-hall-tab="history">完整战绩</button><button type="button" data-hall-tab="bloodline">血统传承</button></div><section class="hall-detail-content">${body}</section></div>`;
  }
  function render() {
    const body = document.getElementById('hallDialogBody'), notice = document.getElementById('hallStorageNotice');
    if (!body) return;
    if (notice) { notice.hidden = !Hall().error; notice.textContent = Hall().error; }
    const entry = selected && Hall().find(selected);
    body.innerHTML = selected ? detail(entry) : listHtml();
    if (entry && tab === 'history') ns.UI.renderHistory(document.getElementById('hallHistory'), entry.career, ns.CareerRules.retire(entry.career), { expanded: true, horseNameLanguage: 'en', raceNameMode: 'zh' });
    if (entry && tab === 'bloodline') ns.CareerBloodlineUI.render(document.getElementById('hallBloodline'), entry.career);
  }
  function open(id) {
    selected = id || null; tab = 'overview'; render();
    const dialog = document.getElementById('hallDialog');
    if (dialog && !dialog.open) dialog.showModal();
  }
  function updateCount() {
    const value = countText().replace('殿堂 ', '');
    for (const id of ['homeHallCount', 'moreHallCount']) { const node = document.getElementById(id); if (node) node.textContent = value; }
  }
  async function handleClick(event) {
    const target = event.target.closest('[data-hall-open],[data-hall-back],[data-hall-tab],[data-hall-remove],[data-hall-export],[data-hall-close],[data-hall-manage]');
    if (!target) return;
    if (target.hasAttribute('data-hall-open')) { open(target.dataset.hallOpen); return; }
    if (target.hasAttribute('data-hall-manage')) { open(); return; }
    if (target.hasAttribute('data-hall-close')) { document.getElementById('hallDialog')?.close(); return; }
    if (target.hasAttribute('data-hall-back')) { selected = null; render(); return; }
    if (target.hasAttribute('data-hall-tab')) { tab = target.dataset.hallTab; render(); return; }
    if (target.hasAttribute('data-hall-export')) {
      const blob = new Blob([JSON.stringify(Hall().exportData(), null, 2)], { type: 'application/json' }), url = URL.createObjectURL(blob), anchor = document.createElement('a');
      anchor.href = url; anchor.download = '我的殿堂.json'; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); return;
    }
    if (target.hasAttribute('data-hall-remove')) {
      const entry = Hall().find(target.dataset.hallRemove); if (!entry) return;
      const horse = entry.career.horse;
      if (!window.confirm(`确定将「${horse.name}」移出殿堂吗？\n\n${entry.summary.starts}战${entry.summary.wins}胜，一级赛${entry.summary.gradeOneWins}胜。移除后完整档案将删除并退出后续配种名单；已出生后代与主席世界会保留其祖先身份。`)) return;
      await Hall().remove(entry.id); selected = null; render(); updateCount(); window.dispatchEvent(new CustomEvent('keiba-hall-changed'));
    }
  }
  function filter(event) {
    if (!event.target.closest('#hallDialog') || !['hallSearch', 'hallMode', 'hallGender', 'hallSort'].includes(event.target.id)) return;
    const query = document.getElementById('hallSearch')?.value.trim().toLocaleLowerCase() || '', mode = document.getElementById('hallMode')?.value || '', gender = document.getElementById('hallGender')?.value || '', sort = document.getElementById('hallSort')?.value || 'date';
    const rows = Hall().list().filter(entry => { const horse = entry.career.horse, text = [horse.name, horse.sireName, horse.damName].join(' ').toLocaleLowerCase(); return (!query || text.includes(query)) && (!mode || entry.sourceMode === mode) && (!gender || horse.gender === gender); });
    rows.sort(sort === 'wins' ? (a, b) => b.summary.gradeOneWins - a.summary.gradeOneWins : (a, b) => b.joinedAt - a.joinedAt);
    const list = document.getElementById('hallList'); if (list) list.innerHTML = rows.length ? rows.map(card).join('') : '<p class="hall-empty">没有符合条件的殿堂马。</p>';
  }
  async function importFile(event) {
    if (event.target.id !== 'hallImportFile' || !event.target.files?.[0]) return;
    try {
      const data = JSON.parse(await event.target.files[0].text()), incoming = data.entries || [];
      if (Hall().count() + incoming.filter(entry => !Hall().find(entry.id)).length > Hall().CAPACITY) {
        const available = Hall().CAPACITY - Hall().count(), choice = window.prompt(`殿堂可再导入${available}匹。输入要导入的档案序号，以逗号分隔（共${incoming.length}份）：`);
        if (choice == null) return;
        const ids = choice.split(',').map(value => incoming[Number(value.trim()) - 1]?.id).filter(Boolean);
        await Hall().importData(data, ids);
      } else await Hall().importData(data);
      render(); updateCount(); window.dispatchEvent(new CustomEvent('keiba-hall-changed'));
    } catch (error) { window.alert(error.message); }
    event.target.value = '';
  }
  function bind() {
    if (bound) return; bound = true;
    document.addEventListener('click', event => { handleClick(event).catch(error => window.alert(error.message)); });
    document.addEventListener('input', filter); document.addEventListener('change', filter); document.addEventListener('change', importFile);
  }
  ns.HallUI = { bind, open, render, countText, retirementAction };
})();
