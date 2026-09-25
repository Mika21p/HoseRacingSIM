(function () {
  'use strict';
  const ns = window.Keiba;
  const DB_NAME = 'keiba-hall-of-fame-v1', DB_VERSION = 1, CAPACITY = 10;
  const clone = value => value == null ? value : JSON.parse(JSON.stringify(value));
  const state = { db: null, available: false, entries: [], lineages: new Map(), revision: 0, error: '' };
  const sourceMode = career => ['normal', 'legend', 'roguelike'].includes(career?.gameMode || career?.horse?.gameMode) ? career.gameMode || career.horse.gameMode : 'normal';
  const win = record => {
    const pub = record?.public || record || {};
    return (pub.rank === 1 || pub.rankLabel === '一着' || pub.deadHeat) && !pub.retired;
  };
  function gradeOneWins(career) {
    return (career?.races || []).filter(r => win(r) && ['g1', 'jpn1'].includes((r?.hidden?.race || r?.race || {}).raceClass)).length;
  }
  function eligible(career) {
    const horse = career?.horse;
    return !!(career?.retired && horse && !horse.debugMode && !career.debugMode
      && ['normal', 'legend', 'roguelike'].includes(sourceMode(career)) && gradeOneWins(career) >= 3);
  }
  function identity(career) { return `player:${sourceMode(career)}:${career.horse.id}`; }
  function rootRecord(entry) {
    const h = entry.career.horse, id = entry.id;
    const regionId = h.homeRegionId || h.currentRegionId || 'japan';
    const region = ns.RegionRules?.getRegion?.(regionId)?.label || ({ japan: '日本', america: '美国', europe: '欧洲', australia: '澳大利亚', middleEast: '中东', hongKong: '香港', argentina: '阿根廷' }[regionId] || regionId);
    const genetics = clone(h.genetics || {});
    genetics.quality ??= 50; genetics.stability ??= 50;
    genetics.surfaceGrades ||= clone(h.surfaceGrades || null);
    genetics.trackAptitudes ||= clone(h.trackAptitudes || null);
    genetics.distance ||= { min: h.distMin, core: h.coreDist, max: h.distMax };
    genetics.growthType ||= h.growthType || null;
    genetics.temperamentLabel ||= h.temperamentLabel || null;
    genetics.heavyType ||= h.heavyType || null;
    genetics.factors ||= [];
    return { id, name: h.name || '未命名赛马', displayName: h.name || '未命名赛马', gender: h.gender,
      fatherId: h.fatherId || h.sireId || null, motherId: h.motherId || h.damId || null,
      region, genetics, core: true, source: 'hall' };
  }
  function lineageRows(entry) {
    const h = entry.career.horse, rows = new Map();
    const saved = h.pedigree?.ancestorRecords || [];
    for (const r of saved) if (r.id && r.id !== entry.id) rows.set(r.id, { ...clone(r), core: false, source: r.source || 'ancestry' });
    const root = rootRecord(entry); rows.set(root.id, root);
    return [...rows.values()];
  }
  function request(req) { return new Promise((resolve, reject) => { req.onsuccess = () => resolve(req.result); req.onerror = () => reject(req.error || Error('殿堂存储读取失败。')); }); }
  async function open() {
    if (state.db && state.available) return true;
    if (state.db && !state.available) { state.db.close(); state.db = null; }
    if (!window.indexedDB) { state.error = '当前浏览器不支持殿堂本地存储。'; throw Error(state.error); }
    let db;
    try { db = await new Promise((resolve, reject) => {
      const req = window.indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const d = req.result;
        if (!d.objectStoreNames.contains('entries')) d.createObjectStore('entries', { keyPath: 'id' });
        if (!d.objectStoreNames.contains('lineages')) d.createObjectStore('lineages', { keyPath: 'id' });
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error || Error('无法打开殿堂存储。'));
      req.onblocked = () => reject(Error('殿堂存储正被其他页面占用，请关闭旧页面后重试。'));
    }); } catch (error) { state.error = error.message || '无法打开殿堂存储。'; throw error; }
    state.db = db;
    const tx = db.transaction(['entries', 'lineages'], 'readonly');
    let entries, lineages;
    try { [entries, lineages] = await Promise.all([request(tx.objectStore('entries').getAll()), request(tx.objectStore('lineages').getAll())]); }
    catch (error) { state.db.close(); state.db = null; state.error = error.message || '殿堂资料读取失败。'; throw error; }
    if (entries.length > CAPACITY) throw Error('殿堂存储超过当前10匹容量，资料已保留，无法继续写入。');
    state.entries = entries; state.lineages = new Map(lineages.map(r => [r.id, r]));
    state.available = true; state.error = ''; state.revision += 1;
    return true;
  }
  function refreshState(entries, rows) {
    state.entries = entries.sort((a, b) => b.joinedAt - a.joinedAt);
    rows.forEach(row => state.lineages.set(row.id, row));
    state.available = true; state.error = ''; state.revision += 1;
  }
  async function add(career, summary) {
    if (!state.db) await open();
    if (!eligible(career)) throw Error('这匹赛马不符合殿堂入藏条件。');
    summary ||= ns.CareerRules.getRecordSummary(career);
    const entry = { id: identity(career), sourceMode: sourceMode(career), joinedAt: Date.now(),
      summary: { starts: summary?.starts || 0, wins: summary?.wins || 0,
        gradeOneWins: gradeOneWins(career), g1Wins: summary?.g1Wins || 0, jpn1Wins: summary?.jpn1Wins || 0 },
      career: clone(career) };
    const rows = lineageRows(entry);
    await new Promise((resolve, reject) => {
      const tx = state.db.transaction(['entries', 'lineages'], 'readwrite'), entries = tx.objectStore('entries');
      const countReq = entries.count(), oldReq = entries.get(entry.id); let reason = '';
      countReq.onsuccess = () => { if (countReq.result >= CAPACITY) { reason = '殿堂已满，最多收藏10匹。'; tx.abort(); } };
      oldReq.onsuccess = () => { if (oldReq.result) { reason = '这匹赛马已经在殿堂中。'; tx.abort(); } };
      tx.oncomplete = () => resolve(); tx.onabort = () => reject(Error(reason || '殿堂收藏失败。'));
      tx.onerror = () => reject(tx.error || Error(reason || '殿堂收藏失败。'));
      for (const row of rows) tx.objectStore('lineages').put(row);
      entries.add(entry);
    });
    refreshState([...state.entries.filter(e => e.id !== entry.id), entry], rows);
    return clone(entry);
  }
  async function remove(id) {
    if (!state.db) await open();
    const entry = state.entries.find(e => e.id === id); if (!entry) throw Error('殿堂档案不存在。');
    const removed = { ...rootRecord(entry), core: false };
    await new Promise((resolve, reject) => {
      const tx = state.db.transaction(['entries', 'lineages'], 'readwrite');
      tx.objectStore('entries').delete(id); tx.objectStore('lineages').put(removed);
      tx.oncomplete = resolve; tx.onabort = () => reject(tx.error || Error('移除殿堂档案失败。')); tx.onerror = () => reject(tx.error || Error('移除殿堂档案失败。'))
    });
    state.entries = state.entries.filter(e => e.id !== id); state.lineages.set(id, removed); state.revision += 1;
    return true;
  }
  function find(id) { const e = state.entries.find(row => row.id === id); return e ? clone(e) : null; }
  function list() { return clone(state.entries); }
  function count() { return state.entries.length; }
  function bloodlineRecords() {
    const rows = new Map([...state.lineages].map(([id, row]) => [id, clone(row)]));
    state.entries.forEach(entry => rows.set(entry.id, rootRecord(entry)));
    return [...rows.values()];
  }
  function chairmanTemplates() {
    return bloodlineRecords().map(r => ({ ...r, id: `hall-template:${r.id}`, source: 'hall', sourceKey: r.id,
      originalName: r.name, name: r.name, displayName: r.name, birthYear: null, historicalBirthYear: null,
      gender: r.gender, fatherId: String(r.fatherId || '').startsWith('player:') ? `hall-template:${r.fatherId}` : r.fatherId || '',
      motherId: String(r.motherId || '').startsWith('player:') ? `hall-template:${r.motherId}` : r.motherId || '', core: !!r.core && ['牡马', '牝马'].includes(r.gender), disabled: !r.core || !['牡马', '牝马'].includes(r.gender),
      preHallCareer: (() => { const entry = state.entries.find(e => e.id === r.id); return entry ? { summary: clone(entry.summary), races: clone(entry.career.races || []), retiredAt: entry.career.currentTime || null } : null; })(),
      game: { genetics: clone(r.genetics), surfaceGrades: clone(r.genetics.surfaceGrades), trackAptitudes: clone(r.genetics.trackAptitudes),
        distance: clone(r.genetics.distance), growthType: r.genetics.growthType, temperamentLabel: r.genetics.temperamentLabel,
        heavyType: r.genetics.heavyType, breedingBase: r.genetics.quality } }));
  }
  function exportData() { return { format: 'keiba-hall-of-fame', version: 1, entries: list(), lineages: clone([...state.lineages.values()]) }; }
  async function importData(data, selectedIds) {
    if (!state.db) await open();
    if (!data || data.format !== 'keiba-hall-of-fame' || data.version !== 1 || !Array.isArray(data.entries)) throw Error('这不是有效的殿堂备份。');
    const ids = selectedIds ? new Set(selectedIds) : new Set(data.entries.map(e => e.id));
    const incoming = data.entries.filter(e => ids.has(e.id));
    for (const entry of incoming) {
      if (!entry?.career || !eligible(entry.career) || entry.id !== identity(entry.career)) throw Error('备份中包含不符合入藏条件或身份编号不匹配的档案。');
    }
    if (state.entries.length + incoming.filter(e => !state.entries.some(old => old.id === e.id)).length > CAPACITY) throw Error('导入后会超过10匹容量，请选择更少的档案。');
    const merged = new Map(state.entries.map(e => [e.id, e])); incoming.forEach(e => { if (!merged.has(e.id)) merged.set(e.id, clone(e)); });
    const selectedRoots = new Set(incoming.map(entry => entry.id));
    const rowMap = new Map((data.lineages || []).filter(r => !state.lineages.has(r.id)).map(r => [r.id, { ...clone(r), core: !!r.core && selectedRoots.has(r.id) }]));
    incoming.forEach(entry => { if (!state.lineages.has(entry.id)) rowMap.set(entry.id, rootRecord(entry)); });
    const rows = [...rowMap.values()];
    await new Promise((resolve, reject) => {
      const tx = state.db.transaction(['entries', 'lineages'], 'readwrite');
      for (const e of incoming) tx.objectStore('entries').put(merged.get(e.id));
      for (const r of rows) tx.objectStore('lineages').put(r);
      tx.oncomplete = resolve; tx.onerror = () => reject(tx.error || Error('导入殿堂备份失败。'));
    });
    refreshState([...merged.values()], rows); return incoming.length;
  }
  ns.HallOfFame = { CAPACITY, open, eligible, gradeOneWins, add, remove, find, list, count, bloodlineRecords, chairmanTemplates, exportData, importData,
    get available() { return state.available; }, get error() { return state.error; }, get revision() { return state.revision; } };
})();
