(function () {
  "use strict";
  const ns = window.Keiba;
  const REGIONS = { japan: "日本", america: "美国", europe: "欧洲", hongKong: "香港", australia: "澳洲", middleEast: "中东", argentina: "阿根廷", other: "其他" };
  const TYPES = { burst: "瞬发", sustained: "持久", attrition: "消耗" };
  const e = value => String(value == null ? "" : value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const RACE_FILTER_GROUPS = [
    {
      id: "grade",
      label: "等级",
      options: [
        { value: "g1", label: "G1/JpnI" },
        { value: "g2", label: "G2/JpnII" },
        { value: "g3", label: "G3/JpnIII" },
        { value: "op", label: "公开赛" },
        { value: "condition", label: "条件赛" }
      ]
    },
    {
      id: "surface",
      label: "场地",
      options: [
        { value: "草地", label: "草地" },
        { value: "泥地", label: "泥地" }
      ]
    },
    {
      id: "distance",
      label: "距离",
      options: [
        { value: "sprint", label: "短途1000-1300" },
        { value: "mile", label: "英里1400-1800" },
        { value: "middle", label: "中距离1900-2200" },
        { value: "intermediate", label: "中长距离2300-2600" },
        { value: "long", label: "长距离2601+" }
      ]
    },
    { id: "region", label: "地区", options: Object.entries(REGIONS).map(([value,label])=>({value,label})) },
    { id: "track", label: "赛马场", options: [] },
    { id: "type", label: "赛场类型", options: Object.entries(TYPES).map(([value,label])=>({value,label})) }
  ];

  function normalize(source = {}) {
    const out = {};
    for (const g of RACE_FILTER_GROUPS) {
      const raw = Array.isArray(source[g.id]) ? source[g.id] : [source[g.id]];
      out[g.id] = [...new Set(raw.filter(v => typeof v === 'string' && v && v !== 'all' && (g.id === 'track' || g.options.some(o => o.value === v))))];
    }
    if (!out.region.length) out.track = [];
    out.avoidFatigueRisk = !!source.avoidFatigueRisk;
    return out;
  }
  function venue(race, options = {}) {
    if (race.venueDisplay) return { ...race.venueDisplay };
    const profile = race.courseProfile || ns.RaceCourseProfiles?.resolveForRace(race, options);
    const key = profile?.trackKey || race.trackKey || '';
    const track = ns.ChairmanVenues?.tracks.find(t => t.key === key);
    const area = ns.ChairmanVenues?.regionSpecs.find(r => r.key === track?.regionKey);
    const region = Object.keys(REGIONS).find(k => REGIONS[k] === race.surfaceRegion) || 'other';
    const country = area?.country || (region === 'europe' && ['英国','法国','爱尔兰','德国','意大利'].includes(race.course) ? race.course : REGIONS[region] === '其他' ? race.surfaceRegion || '未知地区' : REGIONS[region]);
    const template = /circuit|rotating/.test(key);
    const name = race.trackName || profile?.trackName || '举办地待确认';
    return { region, country, trackKey: key, name, label: `${country}－${name}`, route: profile?.routeName || race.courseRouteName || '', template,
      aliases: [...(ns.RaceCourseProfiles?.trackAliases?.(key) || track?.aliases || []), track?.originalName || '', track?.sourceVenueName || ''], type: profile?.type || '', intensity: profile?.intensity || 0 };
  }
  const key = plan => `${plan.race.id}@${plan.schedule.index}`;
  const monthKey = plan => String(Math.floor(plan.schedule.index / 2));
  const typeLabel = v => TYPES[v.type] ? TYPES[v.type] + (v.intensity === 2 ? 'Ⅱ' : 'Ⅰ') : '类型待设置';
  const risk = (career, plan) => {
    const r = career && ns.RaceFatigueRules?.previewFatigueRisk(career, plan.race, plan.schedule, { priorityEntry: plan.priorityEntry || null });
    return !!(r?.eligible && r.probability > 0);
  };
  function trackOptions(plans, regions) {
    if (!regions.length) return [];
    const map = new Map();
    for (const plan of plans) {
      const v = venue(plan.race);
      if (regions.includes(v.region) && v.trackKey) map.set(v.trackKey, { value: v.trackKey, label: v.name, country: v.country, aliases: v.aliases, template: v.template });
    }
    return [...map.values()].sort((a,b) => a.country.localeCompare(b.country,'zh-CN') || a.label.localeCompare(b.label));
  }
  function matches(plan, filters, career) {
    const f = normalize(filters), r = plan.race, v = venue(r), any = (list, test) => !list.length || list.some(test);
    const ranges = {sprint:[1000,1300],mile:[1400,1800],middle:[1900,2200],intermediate:[2300,2600],long:[2601,Infinity]};
    return any(f.grade, g => r.raceClass === g || g === 'g1' && r.raceClass === 'jpn1' || g === 'g2' && r.raceClass === 'jpn2' || g === 'g3' && r.raceClass === 'jpn3' || g === 'op' && r.raceClass === 'listed' || g === 'condition' && ns.RaceProgression.CONDITION_CLASSES.includes(r.raceClass))
      && any(f.surface, s => r.surface === s) && any(f.distance, d => r.distance >= ranges[d][0] && r.distance <= ranges[d][1])
      && any(f.region, x => v.region === x) && any(f.track, x => v.trackKey === x) && any(f.type, x => v.type === x)
      && (!f.avoidFatigueRisk || !risk(career, plan));
  }
  function prepare(plans, filters, ui, career) {
    const before = filters.track || [], f = normalize(filters), tracks = trackOptions(plans, f.region);
    f.track = f.track.filter(k => tracks.some(t => t.value === k));
    if (before.length > f.track.length) ui.notice = '已清除不适用的马场筛选';
    if (!f.region.length) ui.trackSearch = '';
    Object.assign(filters, f);
    delete filters.japanCourse; delete filters.course;
    const filtered = plans.filter(p => matches(p, f, career));
    const signature = JSON.stringify(f) + '|' + (career?.currentTime?.index ?? '');
    if (ui.signature !== signature) { ui.months = Object.fromEntries([...new Set(filtered.map(monthKey))].slice(0,2).map(k=>[k,true])); ui.signature = signature; }
    if (ui.selected && !filtered.some(p => key(p) === ui.selected)) { ui.selected = ''; ui.notice = '原选中赛事已不在当前可选范围，请重新选择。' + (before.length > f.track.length ? '已清除不适用的马场筛选。' : ''); }
    if (ui.selected) { const selected = filtered.find(p=>key(p)===ui.selected); if (selected && ui.revealSelection) ui.months[monthKey(selected)] = true; }
    ui.revealSelection = false;
    return { plans: filtered, tracks, filters: f };
  }
  function filterGroup(g, f, ui) {
    const disabled = g.id === 'track' && !f.region.length, selected = f[g.id];
    const labels = selected.map(k => g.options.find(o=>o.value===k)?.label || k);
    const summary = disabled ? '请先选择地区' : labels.length ? labels.slice(0,2).join('、') + (labels.length>2 ? ` 等${labels.length}项` : '') : '全部';
    if (disabled) return '<div class="rs-filter-disabled" aria-disabled="true"><b>赛马场</b><span>请先选择地区</span></div>';
    let country = '';
    return `<details class="race-filter-menu rs-filter" data-race-filter-group="${g.id}" ${ui.activeFilterGroup===g.id?'open':''}>
      <summary><span>${g.label}：${e(summary)}</span></summary><div class="race-filter-options">
      ${g.id==='track'?`<label class="rs-search-label">搜索所选地区马场<input id="raceTrackSearch" type="search" value="${e(ui.trackSearch||'')}" placeholder="原名或中文别名"></label>`:''}
      ${g.options.map(o=>{const heading = g.id==='track' && o.country!==country ? `<b class="rs-track-country" data-track-country="${e(o.country)}">${e(o.country)}</b>` : '';country=o.country;return heading+`<label class="race-filter-option" ${g.id==='track'?`data-track-option data-country="${e(o.country)}" data-search="${e([o.label,...o.aliases].join(' ').toLowerCase())}"`:''}><input type="checkbox" data-race-filter="${g.id}" value="${e(o.value)}" ${selected.includes(o.value)?'checked':''}><span>${e(o.label)}${o.template?'（巡回）':''}</span></label>`;}).join('')}
      ${g.id==='track'?`<p class="rs-track-empty" ${g.options.length?'hidden':''}>${g.options.length?'没有匹配的马场':'所选地区暂无可报名马场'}</p>`:''}
      <button type="button" class="secondary" data-filter-clear="${g.id}" ${selected.length?'':'disabled'}>清除${g.label}</button></div></details>`;
  }
  function filtersHTML(f, tracks, ui, count) {
    const groups = RACE_FILTER_GROUPS.map(g=>g.id==='track'?{...g,options:tracks}:g);
    const chips = groups.flatMap(g=>f[g.id].map(v=>`<button type="button" class="secondary rs-chip" data-filter-remove="${g.id}" data-value="${e(v)}" aria-label="移除${e(g.label)}筛选${e(g.options.find(o=>o.value===v)?.label||v)}">${e(g.options.find(o=>o.value===v)?.label||v)} ×</button>`));
    if (f.avoidFatigueRisk) chips.push('<button type="button" class="secondary rs-chip" data-filter-remove="avoidFatigueRisk">避开疲劳风险 ×</button>');
    return `<div class="rs-filters" aria-label="比赛筛选"><div class="rs-common-filters">${groups.slice(0,3).map(g=>filterGroup(g,f,ui)).join('')}<details class="rs-more" id="raceMoreFilters" ${ui.moreOpen?'open':''}><summary>更多筛选</summary><div class="rs-more-content">${groups.slice(3).map(g=>filterGroup(g,f,ui)).join('')}<label class="race-risk-filter"><input type="checkbox" data-race-filter-toggle="avoidFatigueRisk" ${f.avoidFatigueRisk?'checked':''}>避开疲劳风险赛事</label></div></details></div>
    <div class="rs-filter-summary"><span>共 ${count} 场</span>${chips.join('')}<button type="button" class="secondary" id="clearAllRaceFiltersBtn" ${chips.length?'':'disabled'}>清空筛选</button></div></div>`;
  }
  function render(plans, filters, ui, career, displayName) {
    const model = prepare(plans, filters, ui, career), groups = new Map();
    for (const plan of model.plans) { const k=monthKey(plan); if(!groups.has(k))groups.set(k,[]);groups.get(k).push(plan); }
    const name = r=>e(displayName(r));
    return `${filtersHTML(model.filters, model.tracks, ui, model.plans.length)}<p class="rs-notice" role="status">${e(ui.notice||'选择一场比赛查看安排；确认报名后才会锁定。')}</p>
      ${groups.size?`<div class="rs-month-tools"><button type="button" class="secondary" data-race-months="expand">展开全部月份</button><button type="button" class="secondary" data-race-months="collapse">收起全部月份</button></div><div class="rs-columns" aria-hidden="true"><span>半月</span><span>级别／赛事</span><span>草泥／距离</span><span>类型</span><span>地区－马场</span><span>状态／选择</span></div>`:'<p class="muted">当前筛选条件下没有可参加的赛事，请调整或清空筛选。</p>'}
      ${[...groups].map(([month, list])=>{const time=ns.TimeRules.fromIndex(list[0].schedule.index);return `<details class="rs-month" data-race-month="${month}" ${ui.months?.[month]?'open':''}><summary>${time.age}岁 · ${time.month}月 <small>${list.length}场</small></summary><div class="rs-entries">${list.map(p=>{
        const k=key(p),v=venue(p.race),chosen=ui.selected===k, riskFlag=risk(career,p), tags=[p.travel?.active||p.expedition?.active?'远征':'',p.challenge?'格上':'',p.priorityEntry?'优先':'',riskFlag?'疲劳风险':''].filter(Boolean);
        return `<div class="rs-entry ${chosen?'is-selected':''}"><div class="rs-line"><span class="rs-date">${ns.TimeRules.fromIndex(p.schedule.index).half===1?'上半月':'下半月'}</span><span class="rs-race"><small class="badge">${e(p.race.grade)}</small><strong>${name(p.race)}</strong></span><span class="rs-meta"><span class="rs-surface">${e(p.race.surface)} ${p.race.distance}米</span><span class="rs-type">${typeLabel(v)}</span><span class="rs-venue">${e(v.label)}</span></span><span class="rs-choice">${tags.map(t=>`<small>${t}</small>`).join('')}<button type="button" class="secondary" data-race-pick="${e(k)}" aria-expanded="${chosen}" ${chosen?'aria-controls="raceSelectionDetail"':''} aria-label="选择${name(p.race)}">${chosen?'已选择':'选择'}</button></span></div>
        ${chosen?`<section class="rs-detail" id="raceSelectionDetail" aria-label="报名安排"><h3>${name(p.race)}</h3><p>${e(p.schedule.label)} · ${e(v.label)}${v.route&&v.route!=='标准路线'?' · '+e(v.route):''}</p><p>${e(p.race.grade)} · ${e(p.race.ageRule||'')} · ${e(p.race.sexRestriction||'不限性别')} · ${e(p.race.surface)} ${p.race.distance}米 · ${typeLabel(v)}</p>
        ${p.travel?.active?`<p>远征：${e(p.travel.fromLabel||'当前地区')} → ${e(p.travel.toLabel||v.country)}${p.travel.prepLabel?' · 准备开始：'+e(p.travel.prepLabel):''}</p>`:p.expedition?.active?'<p>本场需要远征，按当前远征规则准备。</p>':''}
        ${p.challenge?`<p>格上报名：确认后按现有规则消耗机会并判定是否除外。</p>`:''}${p.priorityEntry?'<p>本场可使用已取得的优先资格。</p>':''}${riskFlag?'<p>疲劳风险：近期出赛安排可能影响本场状态，可调整赛程避开风险。</p>':''}<p class="muted">确认后逐回合推进，到比赛回合自动开赛。</p><button type="button" id="registerRaceBtn">确认报名</button></section>`:''}</div>`;
      }).join('')}</div></details>`;}).join('')}
      <div class="rs-footer"><button id="nextTurnBtn" type="button">下一回合</button><button id="retireBtn" class="secondary" type="button">退役</button></div>`;
  }
  ns.RaceSelection = { normalize, venue, label: race=>venue(race).label, key, monthKey, typeLabel, trackOptions, matches, prepare, render, groups: RACE_FILTER_GROUPS };
})();
