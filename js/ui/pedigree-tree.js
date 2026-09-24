(function () {
  'use strict';
  const ns = window.Keiba = window.Keiba || {};
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const labels = {burst:'瞬发',sustained:'持久',attrition:'消耗',grass:'草地',dirt:'泥地',calm:'沉稳',heavy:'重场'};
  const positions = new Map();
  function render({key, root, ancestors, depth = 3, nameHtml}) {
    depth = Math.max(1, Math.min(4, depth));
    const width = 208, gap = 40, height = 144, pitch = 164, top = 34;
    const totalHeight = pitch * 2 ** depth + top, totalWidth = (depth + 1) * (width + gap) - gap;
    const byPath = new Map(ancestors.map(a => [a.path,a])), counts = new Map();
    ancestors.filter(a => a.path.length <= depth && a.id).forEach(a => counts.set(a.id,(counts.get(a.id)||0)+1));
    let nodes = '', lines = '';
    function walk(path, index) {
      const generation = path.length, a = generation ? byPath.get(path) || {} : root;
      const x = generation * (width + gap), y = top + (index + .5) * pitch * 2 ** (depth-generation);
      const repeated = a.id && counts.get(a.id)>1;
      const title = a.name || '未知';
      nodes += `<article class="pt-node bloodline-node ${path==='母父'||a.broodmareSire?'is-broodmare-sire':''} ${repeated?'is-repeated repeat':''}" data-path="${escape(path)}" data-horse="${escape(a.id||'')}" style="left:${x}px;top:calc(${y}px * var(--pt-y-scale) - var(--pt-node-height) / 2)"><small>${escape(path||'当前马匹')}${a.broodmareSire?' · 待配后代母父':path==='母父'?' · 母父':''}${repeated?' · 重复祖先':''}</small><strong>${nameHtml && a.id ? nameHtml(a) : escape(title)}</strong>${a.lineLabel ? `<span>${escape(a.lineLabel)}${a.lineLabel.endsWith('家系')?'':'血系'}</span>` : ''}${a.factors?.length ? `<span>${escape(a.factors.map(f=>labels[f.trait]||f.trait).join(' · '))}</span>` : ''}<span class="pt-participant-label" hidden>配合来源</span></article>`;
      if (generation >= depth) return;
      for (let i=0;i<2;i++) {
        const childY = top + (index*2+i+.5)*pitch*2**(depth-generation-1);
        lines += `<path d="M ${x+width} ${y} H ${x+width+gap/2} V ${childY} H ${x+width+gap}"/>`;
        walk(path+(i?'母':'父'),index*2+i);
      }
    }
    walk('',0);
    return `<p class="pt-hint">左右滑动查看祖先 · 父亲在上，母亲在下</p><div class="pt-scroll" tabindex="0" role="region" aria-label="横向血统图，可左右滚动" data-tree-key="${escape(key)}"><div class="pt-canvas" style="width:${totalWidth}px;height:calc(${totalHeight}px * var(--pt-y-scale))">${Array.from({length:depth+1},(_,i)=>`<div class="pt-heading" style="left:${i*(width+gap)}px;width:${width}px">${i?'第'+i+'代':'当前马匹'}</div>`).join('')}<svg class="pt-lines" width="${totalWidth}" height="${totalHeight}" viewBox="0 0 ${totalWidth} ${totalHeight}" preserveAspectRatio="none" aria-hidden="true">${lines}</svg>${nodes}</div></div>`;
  }
  function highlight(container, ids) {
    const selected = new Set(ids);
    container.querySelectorAll('.pt-node').forEach(node => {
      const active = selected.has(node.dataset.horse);
      node.classList.toggle('participant',active);
      node.querySelector('.pt-participant-label').hidden = !active;
    });
  }
  ns.PedigreeTree = {render,highlight};
  if (typeof document === 'undefined') return;
  document.addEventListener('scroll', event => {
    const node=event.target;
    if(node.matches?.('.pt-scroll')) positions.set(node.dataset.treeKey,node.scrollLeft);
  },true);
  const restore = node => {
    if (node.matches?.('.pt-scroll')) node.scrollLeft=positions.get(node.dataset.treeKey)||0;
    node.querySelectorAll?.('.pt-scroll').forEach(restore);
  };
  new MutationObserver(records=>{for(const r of records) for(const n of r.addedNodes) if(n.nodeType===1)restore(n);}).observe(document.documentElement,{childList:true,subtree:true});
  // Restore a tree that was first inserted inside a collapsed details element.
  document.addEventListener('toggle',event=>{if(event.target.open)restore(event.target);},true);
  let drag=null, suppressUntil=0;
  document.addEventListener('pointerdown',event=>{
    const node=event.target.closest?.('.pt-scroll');
    if(!node||event.pointerType!=='mouse'||event.button!==0||event.target.closest('button,a,input,select'))return;
    drag={node,x:event.clientX,left:node.scrollLeft,id:event.pointerId,moved:false};
  });
  document.addEventListener('pointermove',event=>{
    if(!drag||drag.id!==event.pointerId)return;
    if(Math.abs(event.clientX-drag.x)>5){drag.moved=true;drag.node.classList.add('is-dragging');drag.node.setPointerCapture(event.pointerId);}
    if(drag.moved){event.preventDefault();drag.node.scrollLeft=drag.left+drag.x-event.clientX;}
  });
  const end=()=>{if(!drag)return;if(drag.moved)suppressUntil=Date.now()+100;drag.node.classList.remove('is-dragging');if(drag.node.hasPointerCapture(drag.id))drag.node.releasePointerCapture(drag.id);drag=null;};
  document.addEventListener('pointerup',end);document.addEventListener('pointercancel',end);
  document.addEventListener('click',event=>{if(Date.now()<suppressUntil&&event.target.closest?.('.pt-scroll')){event.preventDefault();event.stopPropagation();}},true);
  document.addEventListener('keydown',event=>{
    if(!event.target.matches?.('.pt-scroll'))return;
    if(['ArrowLeft','ArrowRight','Home','End'].includes(event.key)){
      event.preventDefault();const n=event.target;n.scrollLeft=event.key==='Home'?0:event.key==='End'?n.scrollWidth:n.scrollLeft+(event.key==='ArrowLeft'?-160:160);
    }
  });
})();
