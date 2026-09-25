(function () {
  'use strict';
  const ns = window.Keiba, B = ns.BloodlineSystem;
  let data = ns.BloodlineCatalog || ns.BloodlinePilot || ns.BloodlineLabFixtures, library = B.createLibrary(data.records, data.nicks);
  const root = document.getElementById('bloodlineLab');
  const e = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const label = { burst: '瞬发', sustained: '持久', attrition: '消耗' };
  const choices = gender => data.roots.map(id => library.get(id)).filter(r => r.gender === gender).map(r => `<option value="${e(r.id)}">${e(r.displayName || r.name)}${r.originalName ? ' · ' + e(r.originalName) : ''}</option>`).join('');
  root.innerHTML = `<h1>血统系统验证台</h1><p class="notice">第二版修订：常规速度软保底 · 本页不写入正式存档</p><p id="datasetNote" class="notice"></p>
    <div class="controls"><label>试验资料<select name="dataset">${ns.BloodlineCatalog ? `<option value="catalog">完整血统库 · ${ns.BloodlineCatalog.roots.length}匹核心繁殖马</option>` : ''}${ns.BloodlinePilot ? '<option value="pilot">现有种马库 · 12匹父母试赋值</option>' : ''}<option value="fictional">虚构马匹 · 规则对照</option></select></label><label>典型配合<select name="scenario"></select></label>
    <label>运行模式<select name="mode"><option value="normal">常规模式：自由幻想配种</option><option value="chairman">主席模式：繁殖素质分化</option></select></label>
    <label>随机种子<input name="seed" type="number" min="0" max="4294967295" value="20260923"></label>
    <label>父马<select name="father">${choices('牡马')}</select></label><label>母马<select name="mother">${choices('牝马')}</select></label></div>
    <div class="actions"><button data-action="generate">生成一匹后代</button><button data-action="sample">比较两种模式，各生成1000匹</button></div>
    <div id="pairPreview"></div><div id="offspring" aria-live="polite"></div><div id="sampleResult" aria-live="polite"></div><div id="labError" role="alert"></div><div id="assignments"></div>`;
  const field = name => root.querySelector(`[name="${name}"]`);
  const pair = mode => B.createPair(library, field('father').value, field('mother').value, mode || field('mode').value);
  function seed() { const v = Number(field('seed').value); if (field('seed').value === '' || !Number.isInteger(v) || v < 0 || v > 0xffffffff) throw new Error('请输入0至4294967295之间的整数种子。'); return v; }
  function preview() {
    const p = pair().preview, common = new Set(p.commonAncestors.map(c => c.id));
    root.querySelector('#offspring').innerHTML = ''; root.querySelector('#sampleResult').innerHTML = ''; root.querySelector('#labError').textContent = '';
    root.querySelector('#pairPreview').innerHTML = `<section><h2>配合预览</h2><p>${e(p.ability.description)}</p><p>四代资料 ${p.coverage.known}/${p.coverage.total} · 亲缘评估：${e(p.risk.level)}</p>
      <p>${p.theories.map(t => `<button class="tag" data-theory="${e(t.id)}" aria-pressed="false">${e(t.label)}</button>`).join('') || '未成立额外配合理论'}</p><p id="theoryDetail" aria-live="polite">点击配合标签查看规则与参与祖先。</p>
      <p>${p.commonAncestors.map(c => `${e(c.name)} ${c.notation}`).join('；')}</p><p>${e(p.blockedReason)}</p><p>${p.warnings.map(e).join('<br>')}</p>
      <p>方向权重：${Object.entries(p.directionWeights).map(([key, value]) => `${label[key]} ${value.toFixed(1)}`).join(' / ')}（权重不是适性概率）</p>
      <p>配合倾向：${{ same: '同专精', different: '不同专精', mixed: '专精不明确' }[p.trackPlan.kind]} · 优秀组合率 <strong>${(p.trackPlan.excellentChance * 100).toFixed(0)}%</strong>（基础8%，加成上限12个百分点）</p>
      <p>组合概率：${p.trackPlan.combinations.map(r => `${r.pattern} ${(r.probability * 100).toFixed(2)}%`).join(' / ')}</p>
      <details id="pedigreeTable"><summary>展开四代血统图（幼驹父母为第一代）</summary>${ns.PedigreeTree.render({key:'lab:'+field('dataset').value+':'+p.fatherId+':'+p.motherId,root:{name:'待配后代'},depth:4,ancestors:p.pedigree.map(a=>({...a,lineLabel:data.lines?.find(l=>l.id===a.lineId)?.label||a.lineId||'未知',factors:library.get(a.id)?.genetics.factors||[]}))})}</details></section>`;
    root.querySelectorAll('[data-action]').forEach(b => b.disabled = !p.legal);
  }
  function dataset() {
    data = field('dataset').value === 'catalog' ? ns.BloodlineCatalog : field('dataset').value === 'pilot' ? ns.BloodlinePilot : ns.BloodlineLabFixtures;
    library = B.createLibrary(data.records, data.nicks);
    field('father').innerHTML = choices('牡马'); field('mother').innerHTML = choices('牝马');
    field('scenario').innerHTML = '<option value="">自由选择父母</option>' + (data.scenarios || []).map((s, i) => `<option value="${i}">${e(s.label)}</option>`).join('');
    root.querySelector('#datasetNote').textContent = data.note || '虚构马匹：用于隔离变量、验证基础规则。';
    root.querySelector('#assignments').innerHTML = data.assignments ? `<section><details><summary>查看全部${data.assignments.length}匹赋值（${data.roots.length}匹父母＋${data.assignments.length - data.roots.length}匹祖先）</summary><p>素质影响主席模式基础能力；稳定度按当前数据集赋值。适性、因子、相性为游戏设计值。草泥和距离是简化定位，来源链接用于核对身份与赛绩。</p><div class="table-wrap"><table><thead><tr><th>马匹</th><th>用途／地区</th><th>稳定度</th><th>素质</th><th>瞬/持/耗</th><th>草/泥</th><th>距离</th><th>因子</th></tr></thead><tbody>${data.assignments.map(r => { const g = r.genetics; return `<tr><td><a href="${e(r.sourceUrl)}" target="_blank" rel="noopener">${e(r.name)}</a></td><td>${e(r.role)} ${e(r.region || '')}</td><td>${g.stability ?? '—'}</td><td>${g.quality ?? '未赋值'}</td><td>${g.trackAptitudes ? Object.values(g.trackAptitudes).join('/') : '—'}</td><td>${g.surfaceGrades ? g.surfaceGrades.grass + '/' + g.surfaceGrades.dirt : '—'}</td><td>${g.distance ? g.distance.min + '–' + g.distance.max : '—'}</td><td>${g.factors.map(f => label[f.trait] + f.power).join('/')}</td></tr>`; }).join('')}</tbody></table></div></details></section>` : '';
  }
  root.addEventListener('change', event => {
    if (event.target.name === 'dataset') dataset();
    if (event.target.name === 'scenario' && event.target.value !== '') { const s = data.scenarios[Number(event.target.value)]; field('father').value = s.fatherId; field('mother').value = s.motherId; }
    if (['father', 'mother'].includes(event.target.name)) field('scenario').value = '';
    if (event.target.matches('select, input')) preview();
  });
  root.addEventListener('click', event => {
    const theory = event.target.dataset.theory;
    if (theory) {
      const t = pair().preview.theories.find(t => t.id === theory), ids = new Set(t.ids);
      root.querySelector('#theoryDetail').textContent = t.label + '：' + t.description;
      root.querySelector('#pedigreeTable').open = true;
      ns.PedigreeTree.highlight(root.querySelector('#pedigreeTable'), ids);
      root.querySelectorAll('[data-theory]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.theory === theory)));
      return;
    }
    const action = event.target.dataset.action; if (!action) return;
    try {
      root.querySelector('#labError').textContent = '';
      const value = seed();
      if (action === 'generate') {
        const h = pair().generate({ seed: value, childId: 'lab-child' });
        root.querySelector('#offspring').innerHTML = `<section><h2>后代结果</h2><p>基础能力 <strong>${h.strength}</strong> · 草地 ${h.surfaceGrades.grass} / 泥地 ${h.surfaceGrades.dirt}</p><p>${h.breedingOutcome.rawStrength == null ? '' : `原始能力${h.breedingOutcome.rawStrength} → 软保底补回${h.breedingOutcome.protectionGain}（保护线${h.breedingOutcome.floor}） → 加成＋${h.breedingOutcome.bonus}（最高100）`}</p><p>${h.breedingOutcome.excellent ? '抽中优秀组合' : '常见组合'}：${h.breedingOutcome.pattern}</p><p>${Object.entries(h.trackAptitudes).map(([k, v]) => label[k] + v).join(' / ')}</p><p>距离 ${h.distMin}–${h.distMax}米（核心${h.coreDist}） · ${h.growthType} · ${h.temperamentLabel} · 重场${h.heavyType}</p><p class="notice">验证用真实值：繁殖素质 ${h.genetics.quality} / 稳定度 ${h.genetics.stability}。正式玩家界面应根据模式控制公开程度。</p></section>`;
      } else {
        const cards = ['normal', 'chairman'].map(mode => {
          const compiled = pair(mode), values = [], counts = { burst: 0, sustained: 0, attrition: 0 };
          const combinations = Object.fromEntries(compiled.preview.trackPlan.combinations.map(r => [r.pattern, 0])); let excellent = 0;
          for (let i = 0; i < 1000; i++) { const h = compiled.generate({ seed: (value + i) >>> 0 }); values.push(h.strength); excellent += h.breedingOutcome.excellent; combinations[h.breedingOutcome.pattern]++; for (const k of Object.keys(counts)) if (h.trackAptitudes[k] === '◎') counts[k]++; }
          return `<article><h2>${B.MODES[mode].label}</h2><p>平均基础能力 ${(values.reduce((a, b) => a + b, 0) / 1000).toFixed(2)}</p><p>90以上 ${values.filter(v => v >= 90).length}匹 · 范围 ${Math.min(...values)}–${Math.max(...values)}</p><p>优秀组合实测 ${(excellent / 10).toFixed(1)}% · 设定 ${(compiled.preview.trackPlan.excellentChance * 100).toFixed(0)}%</p><p>${Object.entries(combinations).map(([k, v]) => `${k} ${(v / 10).toFixed(1)}%`).join(' / ')}</p><p>◎出现率：${Object.entries(counts).map(([k, v]) => `${label[k]} ${(v / 10).toFixed(1)}%`).join(' / ')}</p></article>`;
        });
        root.querySelector('#sampleResult').innerHTML = `<h2>同一组合的1000匹产出对照</h2><div class="cards">${cards.join('')}</div><p class="notice">用于验证分布趋势，不代表正式赛历胜率。</p>`;
      }
    } catch (error) { root.querySelector('#labError').textContent = error.message; }
  });
  dataset(); preview();
})();
