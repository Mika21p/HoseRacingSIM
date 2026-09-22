(function () {
  'use strict';
  const ns = window.Keiba, H = ns.ChairmanHonors, W = ns.ChairmanRules, UI = ns.ChairmanUI;
  ns.ChairmanHonorsUI = { create(c) {
    const { escape: e, button: b, input, select, link, show, modal } = c;
    const confirmModal=(title,html)=>modal(title,html,{kind:'confirm'});
    let timer, pendingComment = null;
    const prefs = () => c.world.ui.honors || {};
    const scopes = () => [['central', '中央马会'], ...Object.values(c.world.honors?.associations || {}).map(a => [a.id, a.name])];
    const scopeName = id => scopes().find(([key]) => key === id)?.[1] || id;
    const remember = async value => { const next = { ...prefs(), ...value }; if (c.store.writable) await c.commit(W.edit(c.world, 'ui', { honors: next })); else c.world.ui.honors = next; };
    const percentage = (n, total) => total ? `${(n / total * 100).toFixed(2)}%` : '—';
    const controls = (action, id, offset, total, size = 50) => `<div class="cm-pagination">${b(action, '上一页', id, `data-offset="${Math.max(0, offset - size)}" ${offset ? '' : 'disabled'}`)}<span>共${total}条 · 第${Math.floor(offset / size) + 1}页</span>${b(action, '下一页', id, `data-offset="${offset + size}" ${offset + size < total ? '' : 'disabled'}`)}</div>`;
    const selector = (value, form = 'honorScope') => `<form data-form="${form}" class="cm-actions">${select('scope', '马会', scopes(), value)}<button>切换</button></form>`;
    const usable = () => !!c.world?.honors;
    async function generate(scope, awardId, force) {
      const out = W.mutate(c.world, () => {});
      await H.consume(H.buildCouncilBallot(out.world, out, scope, awardId, force), p => c.notice(`${p.name} · 已处理${p.done}/${p.total}位理事…`), c.cancelled);
      if (!out.councilRounds?.length) { c.notice('尚未配置可用理事，或已有本年评议。'); return; }
      await c.commit(out); await c.render(); await roundDetail(out.councilRounds[0].id);
    }
    async function completeAutomatic(out) {
      await H.consume(H.automatic(out.world, out), p => c.notice(`${p.name} · 已处理${p.done}/${p.total}位理事…`), c.cancelled);
    }
    function awardBar(scope) {
      return `${selector(scope, 'honorAwardScope')}<div class="cm-actions">${UI.more(b('honorCouncil','配置理事',scope),'评议管理')}${b('honorAnnualVotes', '生成本年评议', scope)}${scope !== 'central' ? b('honorAssociation', '地方奖项设置', scope) : ''}${b('honorSuggestions', '查看评议建议', scope)}</div>`;
    }
    async function decorate(tab) { if (usable() && tab === 'awards') c.body.insertAdjacentHTML('afterbegin', awardBar('central')); }
    async function render(tab) {
      if (!['hall', 'awards'].includes(tab)) return false;
      if (!usable()) { if (tab === 'hall') { c.body.innerHTML = '<p>取得本世界编辑权后，将建立评议与荣誉档案。</p>'; return true; } return false; }
      if (tab === 'awards') {
        const scope = prefs().awardScope || 'central'; if (scope === 'central') return false;
        const a = c.world.honors.associations[scope]; if (!a) return false;
        const history = prefs().localHistory, y = W.date(c.world.turn).year;
        c.body.innerHTML = awardBar(scope) + UI.toolbar(history ? `${a.name} · 历年奖项` : `${a.name} · 第${y}年奖项`, null, b('honorLocalHistory', history ? '返回本年' : '历史回顾'));
        if (history) {
          const result = await c.store.scanPage('awards', c.world.id, { index: 'byYear', range: window.IDBKeyRange.bound([c.world.id, 1], [c.world.id, Number.MAX_SAFE_INTEGER]), reverse: true, offset: prefs().offset || 0, filter: r => r.scope === scope });
          c.body.innerHTML += `<div class="cm-table-wrap"><table><thead><tr><th>年份</th><th>奖项</th><th>马匹</th><th>评语</th></tr></thead><tbody>${result.rows.map(r => `<tr><td>${r.year}</td><td>${e(r.name)}</td><td>${link(r.horseId, r.horseName)}</td><td>${e(r.comment)}</td></tr>`).join('')}</tbody></table></div>${controls('honorPage', '', result.offset, result.total)}`;
        } else {
          c.body.innerHTML += !a.enabled ? '<p>地方评奖已关闭。</p>' : `<div class="cm-award-grid">${W.AWARDS.filter(award => a.awards.includes(award.id)).map(award => {
            const draft = c.world.honors.drafts[`${scope}:${award.id}`], h = c.world.horses.find(h => h.id === draft?.horseId), r = c.world.honors.latest[`${scope}:${award.id}`];
            return `<article><strong>${e(award.name)}</strong><span>${h ? link(h.id, h.name) : '空缺'}</span>${b('honorChooseLocal', '选择／评语', award.id, `data-scope="${e(scope)}"`)}${r ? b('honorRound', '查看投票', r.id) : ''}</article>`;
          }).join('')}</div>`;
          c.body.innerHTML += (c.world.phase==='yearEnd'?'':'<p class="cm-phase-note">名单已自动保存，年末可封存。</p>') + b('finish', '封存年度并进入下一年', '', c.world.phase === 'yearEnd' ? 'class="cm-primary"' : 'disabled');
        }
        return true;
      }
      const p = prefs(), view = p.view || 'candidates';
      c.body.innerHTML = (view==='council'?'':UI.toolbar('殿堂', null, b('honorGenerateHall', '殿堂投票', '', 'class="cm-primary"') + UI.more(b('honorSettings', '入选规则') + b('honorNomination', '特批提名')))) + UI.tabs([['inducted', '入选马'], ['candidates', '候选'], ['history', '评选记录'], ['council', '评议会']], view, 'honorView', b);
      if (view === 'council') {
        const scope = p.scope || 'central', types = c.world.councilTypes.filter(t => t.scope === scope), offset = p.offset || 0;
        c.body.innerHTML += selector(scope) + UI.toolbar('理事类型', types.length, b('honorEditType', '创建理事类型', '', `data-scope="${e(scope)}" class="cm-primary"`));
        c.body.innerHTML += types.length ? `<div class="cm-table-wrap"><table><thead><tr><th>类型</th><th>人数</th><th>每票权重</th><th>代表地区</th><th>状态</th><th>操作</th></tr></thead><tbody>${types.slice(offset, offset + 50).map(t => `<tr><td>${e(t.name)}</td><td>${t.count}</td><td>${t.weight}</td><td>${t.regionId ? e(scopeName(t.regionId)) : '未指定'}</td><td>${t.enabled ? '启用' : '停用'}</td><td>${b('honorEditType', '编辑', t.id)}${UI.more(b('honorCopyType', '复制至任意评议会', t.id) + b('honorDeleteType', '删除', t.id))}</td></tr>`).join('')}</tbody></table></div>${controls('honorPage', '', offset, types.length)}` : '<p class="cm-empty">尚未配置评议会。可以创建理事，也可继续人工颁奖与入选。</p>';
      } else if (view === 'history') {
        const offset = p.offset || 0;
        const events = p.historyKind === 'hallEvents';
        c.body.innerHTML += `<form data-form="honorHistoryFilter" class="cm-actions">${select('historyKind', '记录', [['councilRounds', '投票轮次'], ['hallEvents', '殿堂授予与修订']], p.historyKind || 'councilRounds')}${select('historyScope', '马会（投票）', [['', '全部'], ...scopes()], p.historyScope || '')}${input('historyYear', '年份', p.historyYear || '', 'number')}<button>查询</button></form>`;
        const r = await c.store.queryHonorHistory(c.world.id, events ? 'hallEvents' : 'councilRounds', { scope: events ? '' : p.historyScope, year: p.historyYear, offset });
        c.body.innerHTML += events
          ? `<div class="cm-table-wrap"><table><thead><tr><th>年份</th><th>马匹</th><th>决定</th><th>支持率</th><th>评语</th><th>依据</th></tr></thead><tbody>${r.rows.map(r => `<tr><td>${r.year}</td><td>${link(r.horseId, r.horseName)}</td><td>${r.action === 'revoke' ? '撤销误授' : r.method === 'vote' ? '评议核准' : '主席特批'}</td><td>${percentage(r.votes, r.totalUnits)}</td><td>${e(r.comment)}</td><td>${r.roundId ? b('honorRound', '原始表决', r.roundId) : '—'}</td></tr>`).join('')}</tbody></table></div>`
          : `<div class="cm-table-wrap"><table><thead><tr><th>年份</th><th>马会</th><th>项目</th><th>票权</th><th>轮次</th></tr></thead><tbody>${r.rows.map(r => `<tr><td>${r.year}</td><td>${e(r.associationName)}</td><td>${b('honorRound', r.name, r.id, 'class="cm-link"')}</td><td>${r.totalUnits / 100}</td><td>${e(r.id)}</td></tr>`).join('')}</tbody></table></div>`;
        c.body.innerHTML += controls('honorPage', '', r.offset, r.total);
      } else {
        const map = new Map(c.world.honorProfiles.map(p => [p.id, p])), eligible = new Set(H.getHonorCandidates(c.world).map(h => h.id)), latest = c.world.honors.latest['central:hall'];
        let rows = c.world.horses.filter(h => { const hp = map.get(h.id); return view === 'inducted' ? !!hp.induction : p.excluded ? hp.excluded : eligible.has(h.id); }).map(h => ({ ...H.getVotingProfile(c.world, h, true, map.get(h.id)), induction: map.get(h.id).induction, lastHallVote: map.get(h.id).lastHallVote }));
        rows = rows.filter(h => (!p.search || h.name.includes(p.search)) && (!p.region || h.regionId === p.region) && (!p.gender || h.gender === p.gender));
        const metric = p.sort || 'rating'; rows.sort((a, b) => (metric === 'votes' ? ((b.lastHallVote?.votes || 0) / (b.lastHallVote?.totalUnits || 1)) - ((a.lastHallVote?.votes || 0) / (a.lastHallVote?.totalUnits || 1)) : (b[metric] ?? -Infinity) - (a[metric] ?? -Infinity)) || a.id.localeCompare(b.id));
        const size = p.expanded ? 50 : 10, offset = rows.length ? Math.min(p.offset || 0, Math.floor((rows.length - 1) / size) * size) : 0;
        c.body.innerHTML += `<form data-form="honorFilter" class="cm-actions">${input('search', '搜索马名', p.search || '')}${select('region', '地区', [['', '全部'], ...scopes().slice(1)], p.region || '')}${select('gender', '性别', [['', '全部'], '牡马', '牝马', '骟马'], p.gender || '')}${select('sort', '排序', [['rating', '评价'], ['wtr', 'WTR'], ['tf', 'TF'], ['g1', 'G1'], ['winRate', '胜率'], ['prize', '奖金'], ['votes', '最近支持率']], metric)}<label><input type="checkbox" name="excluded" ${p.excluded ? 'checked' : ''}>查看排除候选</label><button>查询</button>${b('honorClear', '清除')}</form><div class="cm-actions">${b('honorExpand', p.expanded ? '只看前十' : '展开')}${latest ? b('honorRound', '最近殿堂表决', latest.id) : ''}</div>`;
        c.body.innerHTML += `<div class="cm-table-wrap"><table><thead><tr><th>马匹</th><th>G1</th><th>WTR／TF</th><th>胜／出赛</th><th>奖金万</th><th>中央／地方奖</th><th>支持率／入选</th><th>操作</th></tr></thead><tbody>${rows.slice(offset, offset + size).map(h => `<tr><td>${link(h.id, h.name)}</td><td>${h.g1}</td><td>${show(h.wtr)}／${show(h.tf)}${!h.induction && eligible.has(h.id) ? `<small>${H.hallQuality(h) < H.hallParameters.qualityFloor ? '具备资格 · 未达成绩认可标准' : '具备资格 · 达到成绩底线'}</small>` : ''}</td><td>${h.wins}／${h.starts}</td><td>${h.prize.toFixed(1)}</td><td>${h.centralAwards}／${h.localAwards}<small>系列荣誉 ${h.seriesHonor||0}</small></td><td>${h.induction ? `第${h.induction.year}年 · ${h.induction.method === 'vote' ? '评议通过' : '主席特批'}` : `${percentage(h.lastHallVote?.votes || 0, h.lastHallVote?.totalUnits || 0)}${h.lastHallVote ? `<small>第${h.lastHallVote.year}年</small>` : ''}`}</td><td>${h.induction ? b('honorRevoke', '撤销误授', h.id) : b('honorInduct', '入选／评语', h.id) + UI.more(b('honorExclude', p.excluded ? '恢复候选' : '暂时排除', h.id, `data-excluded="${!p.excluded}"`))}</td></tr>`).join('') || '<tr><td colspan="8">暂无符合条件的马匹</td></tr>'}</tbody></table></div>${p.expanded ? controls('honorPage', '', offset, rows.length) : `<p class="cm-muted">共${rows.length}匹 · 默认前十</p>`}`;
      }
      return true;
    }
    function editType(id, scope, clone = false) {
      const old = c.world.councilTypes.find(t => t.id === id), t = old || { name: '', scope: scope || 'central', regionId: '', count: 1, weight: 1, enabled: true, motives: !scope || scope === 'central' ? H.defaultHallMotives() : Object.fromEntries(Object.keys(H.motives).map(k => [k, k === 'random' ? 100 : 0])), affinities: Object.fromEntries(H.affinities.map(k => [k, 0])) };
      const body = `<form data-form="honorType" data-id="${clone ? '' : e(id || '')}"><fieldset><legend>身份与人数</legend><div class="cm-form-grid">${input('name', '类型名称', clone ? `${t.name}副本` : t.name)}${select('scope', '所属评议会', scopes(), t.scope)}${select('regionId', '代表地区', [['', '未指定'], ...scopes().slice(1)], t.regionId)}${input('count', '人数', t.count, 'number')}${input('weight', '每人票权', t.weight, 'number')}<label><input type="checkbox" name="enabled" ${t.enabled ? 'checked' : ''}>启用</label></div></fieldset><fieldset><legend>评价倾向 · 合计100%</legend><div class="cm-form-grid">${Object.entries(H.motives).map(([key, label]) => input(`motive.${key}`, `${label}${key === "honor" ? "（仅殿堂）" : ""} %`, t.motives[key], 'number')).join('')}</div><p class="cm-motive-total" role="status"></p><p>殿堂：G1、评价、奖金、胜率、荣誉按比例综合评分；五项全零时使用默认成绩权重。地方与延续偏好可以决定选择。随机只扰动接近的排序，弃权按每个名额计算，不递补。年度奖项仍按原有倾向抽选。</p><p>殿堂认可底线：至少6个G1、124评价或6点荣誉之一。每人最多支持3匹，可少投；距离与场地爱好合计最多加减10分。</p></fieldset>${[['距离爱好', H.affinities.slice(0, 6)], ['场地爱好', H.affinities.slice(6)]].map(([title, keys]) => `<fieldset><legend>${title} · −100～＋100</legend><div class="cm-form-grid">${keys.map(key => `<label>${e(key)}<input type="number" min="-100" max="100" step="any" name="affinity.${e(key)}" value="${t.affinities[key]}" data-affinity="${e(key)}"><input type="range" min="-100" max="100" value="${t.affinities[key]}" data-affinity-slider="${e(key)}" aria-label="${e(key)}爱好滑杆"></label>`).join('')}</div></fieldset>`).join('')}<div class="cm-sticky-actions"><button type="submit">保存理事</button>${b('honorZeroAffinity', '爱好全部归零')}</div></form>`;
      modal(clone ? '复制理事类型' : old ? '编辑理事类型' : '创建理事类型', body); refreshEditor(c.dialog.querySelector('form'));
    }
    function refreshEditor(form) {
      const total = Object.keys(H.motives).reduce((s, k) => s + Number(form.elements[`motive.${k}`].value), 0), el = form.querySelector('.cm-motive-total');
      el.textContent = `当前合计 ${total.toFixed(2)}%`; el.classList.toggle('cm-error', Math.abs(total - 100) > .00001);
    }
    function hallSlot(slot, names) {
      const score = slot.score, candidate = slot.candidateId;
      const title = candidate ? link(candidate, names.get(candidate)) : '空缺名额';
      return `<div>${title} · ${e(H.hallReasons[slot.reason])}${score ? `<small>成绩分${score.base.toFixed(2)} · 爱好${score.affinity.toFixed(2)} · 地方扣分${score.localPenalty.toFixed(2)} · 延续扣分${score.continuityPenalty.toFixed(2)} · 随机调整${score.jitter.toFixed(2)} · 最终排序分${score.rankScore.toFixed(2)}</small>` : ''}</div>`;
    }
    async function roundDetail(id, offset = 0, votes = false) {
      const r = await c.store.get('councilRounds', c.world.id, id); if (!r) throw new Error('评议轮次不存在。');
      const current = c.world.honors.latest[`${r.scope}:${r.awardId}`]?.id === id;
      const types = c.world.councilTypes.filter(t => t.enabled && t.scope === r.scope && t.count > 0);
      const changed = current && H.evidenceSignature(c.world, r.scope, r.awardId, H.getHonorCandidates(c.world, r.scope, r.awardId), types, r.version) !== r.signature;
      let html = `<p>第${r.year}年 · ${e(r.associationName)} · 总票权${r.totalUnits / 100}${r.awardId === 'hall' ? r.version === 2 ? ' · 综合评分择优' : ' · 历史抽选规则' : ''}${r.phase !== 'yearEnd' ? ' · 赛季结束前生成' : ''}${!current ? ' · 历史轮次' : ''}${changed ? ' · 依据已更新，原选票保持不变' : ''}</p><div class="cm-actions">${b('honorRound', '支持分布', id)}${b('honorVotes', '逐理事选票', id)}${current ? b('honorRevote', '新建一轮评议', id) : ''}${current && r.awardId !== 'hall' ? b('honorApplyRound', '采用建议', id) : ''}</div>`;
      if (votes) {
        const page = await c.store.queryHonorHistory(c.world.id, 'councilVotes', { roundId: id, offset });
        const names = new Map(r.candidates.map(h => [h.id, h.name])), types = new Map(r.types.map(t => [t.id, t.name]));
        html += `<div class="cm-table-wrap"><table><thead><tr><th>理事</th><th>票权</th><th>选票与依据</th></tr></thead><tbody>${page.rows.map(v => `<tr><td>${e(types.get(v.typeId))}<small>${e(v.memberId)}</small></td><td>${v.weightUnits / 100}</td><td>${v.slots.map(s => r.version === 2 ? hallSlot(s, names) : `<div>${e(H.motives[s.motive])} → ${s.horseId ? `${link(s.horseId, names.get(s.horseId))} · 基础${s.base.toFixed(2)} × 爱好${s.factor.toFixed(2)}` : '弃权'}</div>`).join('')}</td></tr>`).join('')}</tbody></table></div>${controls('honorVotesPage', id, page.offset, page.total)}`;
      } else {
        const rows = [...r.candidates].sort((a, b) => r.tallies[b.id] - r.tallies[a.id] || a.id.localeCompare(b.id));
        html += r.awardId === 'hall' ? `<p>门槛${r.threshold}% · 每人最多支持3匹 · 弃权计入分母</p>` : '<p>并列最高票须由主席选择；全体弃权不产生获奖建议。</p>';
        html += `<div class="cm-table-wrap"><table><thead><tr><th>候选</th><th>评价依据</th><th>票权</th><th>支持率</th><th>类型分布</th><th>核准</th></tr></thead><tbody>${rows.slice(offset, offset + 50).map(h => `<tr><td>${link(h.id, h.name)}</td><td>${e(h.ratingSource)} ${show(h.rating)}<small>系列荣誉 ${h.seriesHonor||0}</small></td><td>${r.tallies[h.id] / 100}${r.version === 2 ? `<small>${r.tallies[h.id] > 0 ? '获得支持' : H.hallQuality(h, r.parameters) < r.parameters.qualityFloor ? '未达认可标准' : '具备资格 · 本轮未获支持'}</small>` : ''}</td><td>${percentage(r.tallies[h.id], r.totalUnits)}</td><td><details><summary>查看分票</summary>${r.types.map(t => `<div>${e(t.name)}：${(r.byType[t.id]?.[h.id] || 0) / 100}</div>`).join('')}</details></td><td>${current && r.awardId === 'hall' && H.passes(r.tallies[h.id], r.totalUnits, r.threshold) && !H.profile(c.world, h.id)?.induction ? b('honorInduct', '核准入选', h.id, `data-round="${e(id)}"`) : ''}</td></tr>`).join('')}</tbody></table></div>${controls('honorRoundPage', id, offset, rows.length)}`;
      }
      modal(`${r.name} · 评议记录`, html, { key: `honorRound:${id}`, render: () => roundDetail(id, offset, votes) });
    }
    async function chooseLocal(scope, awardId, offset = 0, search = prefs().candidateSearch?.[`${scope}:${awardId}`] || '') {
      const rows = H.getHonorCandidates(c.world, scope, awardId).filter(h => h.name.includes(search)), key = `${scope}:${awardId}`, draft = c.world.honors.drafts[key], latest = c.world.honors.latest[key];
      rows.sort((a, b) => (latest?.tallies[b.id] || 0) - (latest?.tallies[a.id] || 0) || (b.rating ?? -Infinity) - (a.rating ?? -Infinity));
      modal(`${scopeName(scope)} · ${W.AWARDS.find(a => a.id === awardId).name}`, `<form data-form="honorCandidateSearch" data-scope="${e(scope)}" data-award="${e(awardId)}" class="cm-actions">${input('search', '搜索马名', search)}<button>查询</button></form>${b('honorPickLocal', '设为空缺', '', `data-scope="${e(scope)}" data-award="${e(awardId)}"`)}<div class="cm-table-wrap"><table><thead><tr><th>候选</th><th>WTR／TF</th><th>G1</th><th>胜／出赛</th><th>支持率</th><th>操作</th></tr></thead><tbody>${rows.slice(offset, offset + 50).map(h => `<tr><td>${link(h.id, h.name)}</td><td>${show(h.wtr)}／${show(h.tf)}</td><td>${h.g1}</td><td>${h.wins}／${h.starts}</td><td>${percentage(latest?.tallies[h.id] || 0, latest?.totalUnits || 0)}</td><td>${b('honorPickLocal', '选择', h.id, `data-scope="${e(scope)}" data-award="${e(awardId)}"`)}</td></tr>`).join('')}</tbody></table></div>${controls('honorLocalPage', `${scope}|${awardId}|${search}`, offset, rows.length)}${draft?.horseId ? `<form data-form="honorComment" data-scope="${e(scope)}" data-award="${e(awardId)}" data-horse="${e(draft.horseId)}">${input('comment', '评语（自动保存）', draft.comment || '')}<button>保存评语</button></form>` : ''}`, { key: `localAward:${scope}:${awardId}`, render: () => chooseLocal(scope, awardId, offset, search) });
    }
    async function suggestions(scope, roundId) {
      const ids = roundId ? [roundId] : W.AWARDS.map(a => c.world.honors.latest[`${scope}:${a.id}`]?.id).filter(Boolean);
      const rounds = (await Promise.all(ids.map(id => c.store.get('councilRounds', c.world.id, id)))).filter(Boolean);
      const choices = rounds.map(r => { const best = Math.max(0, ...Object.values(r.tallies)), ids = Object.keys(r.tallies).filter(id => best > 0 && r.tallies[id] === best), chosen = r.scope === 'central' ? c.world.awardDraft[r.awardId] : c.world.honors.drafts[`${r.scope}:${r.awardId}`]?.horseId; return { r, ids, chosen }; });
      modal('采用评议建议', `<p>仅单独最高票可一键填入；并列和弃权保留人工选择。</p>${choices.map(({ r, ids, chosen }) => `<p>${e(r.name)}：${e(c.world.horses.find(h => h.id === chosen)?.name || '空缺')} → ${ids.length === 1 ? e(r.candidates.find(h => h.id === ids[0]).name) : ids.length ? '并列待选' : '空缺'}</p>`).join('') || '<p>尚无本年投票。</p>'}<div class="cm-actions">${b('honorApplySuggestions', '仅填空缺', ids.join('|'), 'data-overwrite="false"')}${b('honorApplySuggestions', '按上述差异覆盖', ids.join('|'), 'data-overwrite="true"')}</div>`);
    }
    async function click(action, id, el) {
      if (!action.startsWith('honor')) return false;
      if (!usable()) throw new Error('请先取得编辑权并完成荣誉档案升级。');
      const w = c.world;
      if (action === 'honorView') { await remember({ view: id, offset: 0 }); await c.render(); }
      else if (action === 'honorPage') { await remember({ offset: Number(el.dataset.offset) }); await c.render(); }
      else if (action === 'honorExpand') { await remember({ expanded: !prefs().expanded, offset: 0 }); await c.render(); }
      else if (action === 'honorClear') { await remember({ search: '', region: '', gender: '', excluded: false, offset: 0 }); await c.render(); }
      else if (action === 'honorCouncil') { await remember({ view: 'council', scope: id, offset: 0 }); c.setTab('hall'); await c.render(); }
      else if (action === 'honorEditType' || action === 'honorCopyType') editType(id, el.dataset.scope, action === 'honorCopyType');
      else if (action === 'honorDeleteType') confirmModal('删除理事类型', `<p>停止未来参与，保留已有选票。</p>${b('honorConfirmDeleteType', '确认删除', id)}`);
      else if (action === 'honorConfirmDeleteType') { await c.commit(H.edit(w, 'deleteType', { id })); c.dialog.close(); await c.render(); }
      else if (action === 'honorZeroAffinity') { for (const el of c.dialog.querySelectorAll('[data-affinity],[data-affinity-slider]')) el.value = 0; }
      else if (action === 'honorSettings') modal('殿堂入选规则', `<form data-form="honorSettings">${input('threshold', '支持率门槛 %（达到即通过）', w.honors.threshold, 'number')}<label><input type="checkbox" name="autoHall" ${w.honors.autoHall ? 'checked' : ''}>达到门槛自动入选</label><button>保存</button></form>`);
      else if (action === 'honorAssociation') { const a = w.honors.associations[id]; modal('地方马会设置', `<form data-form="honorAssociation" data-id="${e(id)}">${input('name', '马会名称', a.name)}<label><input type="checkbox" name="enabled" ${a.enabled ? 'checked' : ''}>启用地方奖</label><label><input type="checkbox" name="strict" ${a.strict ? 'checked' : ''}>仅对应G1胜马</label><div class="cm-form-grid">${W.AWARDS.map(award => `<label><input type="checkbox" name="awards" value="${award.id}" ${a.awards.includes(award.id) ? 'checked' : ''}>${e(award.name)}</label>`).join('')}</div><button>保存</button></form>`); }
      else if (action === 'honorNomination') nomination();
      else if (action === 'honorNominate') { await c.commit(H.edit(w, 'nominate', { id })); c.dialog.close(); await c.render(); }
      else if (action === 'honorExclude') { await c.commit(H.edit(w, 'exclude', { id, excluded: el.dataset.excluded === 'true' })); await c.render(); }
      else if (action === 'honorInduct') { const h = w.horses.find(h => h.id === id), r = el.dataset.round; modal(`${h.name} · 入选殿堂`, `<form data-form="honorInduct" data-id="${e(id)}" data-round="${e(r || '')}"><p>${r ? '按该轮达到门槛的评议结果核准。' : '主席特批，不要求达到投票门槛。'}</p>${input('comment', '入选评语', '')}<button>确认入选</button></form>`); }
      else if (action === 'honorRevoke') modal('撤销误授', `<form data-form="honorRevoke" data-id="${e(id)}">${input('comment', '修订说明', '')}<button>确认撤销并保留记录</button></form>`);
      else if (action === 'honorGenerateHall') await generate('central', 'hall', false);
      else if (action === 'honorAnnualVotes') { const out = W.mutate(w, () => {}); for (const a of W.AWARDS) if (id === 'central' || w.honors.associations[id].enabled && w.honors.associations[id].awards.includes(a.id)) await H.consume(H.buildCouncilBallot(out.world, out, id, a.id), p => c.notice(`${p.name} · ${p.done}/${p.total}`), c.cancelled); if (out.councilRounds?.length) { await c.commit(out); await c.render(); } else c.notice('尚未配置可用理事，或本年评议已存在。'); }
      else if (action === 'honorRound' || action === 'honorRoundPage') await roundDetail(id, Number(el.dataset.offset || 0));
      else if (action === 'honorVotes' || action === 'honorVotesPage') await roundDetail(id, Number(el.dataset.offset || 0), true);
      else if (action === 'honorRevote') modal('新一轮评议', `<p>使用当前候选、评分和理事配置重新投票。保留旧轮次，不覆盖人工颁奖草稿。</p>${b('honorConfirmRevote', '生成新轮次', id)}`);
      else if (action === 'honorConfirmRevote') { const r = await c.store.get('councilRounds', w.id, id); await generate(r.scope, r.awardId, true); }
      else if (action === 'honorSuggestions' || action === 'honorApplyRound') await suggestions(id, action === 'honorApplyRound' ? id : null);
      else if (action === 'honorApplySuggestions') { const rounds = await Promise.all(id.split('|').filter(Boolean).map(id => c.store.get('councilRounds', w.id, id))); await c.commit(H.applyBallotSuggestions(w, rounds, el.dataset.overwrite === 'true')); c.dialog.close(); await c.render(); }
      else if (action === 'honorChooseLocal') await chooseLocal(el.dataset.scope, id);
      else if (action === 'honorLocalPage') { const [scope, award, search] = id.split('|'); await chooseLocal(scope, award, Number(el.dataset.offset), search || ''); }
      else if (action === 'honorPickLocal') { const scope = el.dataset.scope, awardId = el.dataset.award; await c.commit(H.edit(w, 'localDraft', { scope, awardId, horseId: id })); await c.render(); await chooseLocal(scope, awardId); }
      else if (action === 'honorLocalHistory') { await remember({ localHistory: !prefs().localHistory, offset: 0 }); await c.render(); }
      return true;
    }
    function nomination(search = prefs().nominationSearch || '', offset = 0) {
      const rows = c.world.horses.filter(h => h.status === 'retired' && h.lifetime.starts > 0 && !H.profile(c.world, h.id)?.induction && h.name.includes(search));
      modal('特批提名', `<form data-form="honorNominationSearch" class="cm-actions">${input('search', '搜索退役参赛马', search)}<button>搜索</button></form>${rows.slice(offset, offset + 50).map(h => `<p>${link(h.id, h.name)} · G1 ${h.lifetime.g1} ${b('honorNominate', '加入候选', h.id)}</p>`).join('') || '<p>暂无符合条件的退役马。</p>'}${controls('honorNominationPage', search, offset, rows.length)}`);
    }
    async function submit(form) {
      const kind = form.dataset.form; if (!kind.startsWith('honor')) return false;
      const d = new FormData(form), v = Object.fromEntries(d), id = form.dataset.id;
      if (kind === 'honorType') {
        const value = { name: v.name.trim(), scope: v.scope, regionId: v.regionId, count: Number(v.count), weight: Number(v.weight), enabled: d.has('enabled'), motives: {}, affinities: {} }; if (id) value.id = id;
        for (const key of Object.keys(H.motives)) value.motives[key] = Number(v[`motive.${key}`]);
        for (const key of H.affinities) value.affinities[key] = Number(v[`affinity.${key}`]);
        await c.commit(H.edit(c.world, 'type', value)); c.dialog.close(); await remember({ view: 'council', scope: value.scope, offset: 0 }); c.setTab('hall');
      } else if (kind === 'honorScope') await remember({ scope: v.scope, offset: 0 });
      else if (kind === 'honorAwardScope') await remember({ awardScope: v.scope, localHistory: false, offset: 0 });
      else if (kind === 'honorFilter') await remember({ ...v, excluded: d.has('excluded'), offset: 0 });
      else if (kind === 'honorHistoryFilter') await remember({ ...v, offset: 0 });
      else if (kind === 'honorSettings') { await c.commit(H.edit(c.world, 'settings', { threshold: Number(v.threshold), autoHall: d.has('autoHall') })); c.dialog.close(); }
      else if (kind === 'honorAssociation') { await c.commit(H.edit(c.world, 'association', { id, name: v.name, enabled: d.has('enabled'), strict: d.has('strict'), awards: d.getAll('awards') })); c.dialog.close(); }
      else if (kind === 'honorNominationSearch') { await remember({nominationSearch:v.search});nomination(v.search); return true; }
      else if (kind === 'honorCandidateSearch') { await remember({candidateSearch:{...prefs().candidateSearch,[`${form.dataset.scope}:${form.dataset.award}`]:v.search}});await chooseLocal(form.dataset.scope, form.dataset.award, 0, v.search); return true; }
      else if (kind === 'honorInduct') { const round = form.dataset.round ? await c.store.get('councilRounds', c.world.id, form.dataset.round) : null; await c.commit(H.edit(c.world, 'induct', { id, method: round ? 'vote' : 'special', round, comment: v.comment })); c.dialog.close(); }
      else if (kind === 'honorRevoke') { await c.commit(H.edit(c.world, 'revoke', { id, comment: v.comment })); c.dialog.close(); }
      else if (kind === 'honorComment') { pendingComment = { scope: form.dataset.scope, awardId: form.dataset.award, horseId: form.dataset.horse, comment: v.comment }; await flush(); }
      await c.render(); return true;
    }
    function changed(el) {
      const form = el.form; if (form?.dataset.form === 'honorType') {
        if (el.dataset.affinity) form.querySelector(`[data-affinity-slider="${el.dataset.affinity}"]`).value = el.value;
        if (el.dataset.affinitySlider) form.elements[`affinity.${el.dataset.affinitySlider}`].value = el.value;
        refreshEditor(form);
      }
      if (form?.dataset.form === 'honorComment') { pendingComment = { scope: form.dataset.scope, awardId: form.dataset.award, horseId: form.dataset.horse, comment: form.elements.comment.value }; clearTimeout(timer); timer = setTimeout(() => c.run(async () => {}), 400); }
    }
    async function flush() { clearTimeout(timer); if (pendingComment && c.store.writable) { const value = pendingComment; await c.commit(H.edit(c.world, 'localDraft', value)); if (pendingComment === value) pendingComment = null; } }
    return { render, decorate, click: async (action, id, el) => { if (action === 'honorNominationPage') { nomination(id, Number(el.dataset.offset)); return true; } return click(action, id, el); }, submit, changed, flush, completeAutomatic };
  } };
})();
