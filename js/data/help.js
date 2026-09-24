(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.Help = ns.Help || {};

  function escapeHtml(value) {
    return String(value || "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "\"": "&quot;",
      "'": "&#39;"
    }[char]));
  }

  function sireHelpItems(group) {
    const targetClassic = group === "classic";
    return (ns.SireBloodlines || ns.Bloodlines || [])
      .filter((item) => item && item.id !== "random")
      .filter((item) => (item.group === "classic") === targetClassic)
      .map((item) => `<li><b>${escapeHtml(item.name)}</b>：${escapeHtml(item.note || "以该血统的路线倾向影响随机权重。")}</li>`)
      .join("");
  }

  function damHelpItems() {
    return (ns.DamBloodlines || [])
      .filter((item) => item && item.id !== "random")
      .map((item) => `<li><b>${escapeHtml(item.name)}</b>：${escapeHtml(item.note || "以该母系的素质倾向影响随机权重。")}</li>`)
      .join("");
  }

  ns.Help.attributeHelpHtml = `
    <div class="help-content">
      <div class="help-section">
        <h2>玩法与开始</h2>
        <ul>
          <li><b>普通生涯：</b>培育赛马，规划赛事。</li>
          <li><b>传奇模式：</b>以更高潜力出道，挑战史实名马。</li>
          <li><b>肉鸽挑战：</b>随机选马完成挑战，赢取荣誉币和解锁奖励。</li>
          <li><b>剧情模式：</b>体验1997—1998年的赛马故事。</li>
          <li><b>国际主席模式：</b>创建赛马世界，经营地区、马场、赛事和马群。</li>
        </ul>
        <p>普通与传奇模式共用生涯存档；其他模式分别保存进度。普通生涯和传奇模式从二岁六月开始：报名赛事后，点击“下一回合”推进时间。</p>
      </div>

      <div class="help-section">
        <h2>赛马与适性</h2>
        <p>实力决定上限，成长阶段、草地／泥地、赛道、距离、场地和气性都会影响发挥；骑手也会影响赛果。退役前可通过练马师评语和比赛表现了解赛马，退役后会揭晓真实实力。</p>
        <p>草地和泥地适性从 A 到 G 依次降低；赛道适性用◎（擅长）、○（普通）、△（不擅长）表示。适性越合适，越容易发挥实力；距离超出适应范围会降低发挥。</p>
        <p>成长型决定赛马何时进入成熟期。过早或过晚出赛都可能影响发挥；进入衰退期后，实力会逐渐下降。</p>
      </div>

      <div class="help-section">
        <h2>血统</h2>
        <p>普通与传奇模式可自由选择父母。父母和祖先会影响后代特点，优秀配合也不保证生成强马。</p>
        <p>可按名称、地区或特点筛选父母，也可使用随机配合。生涯中的“血统”页面可查看谱系和配合简评；较早生成的赛马可能没有完整祖先资料。</p>
      </div>

      <div class="help-section">
        <h2>时间与报名</h2>
        <p>赛事按月份排列。选中赛事查看详情，确认报名后逐回合推进；到比赛日期会自动开赛。查看详情不会报名。</p>
        <p>可按级别、场地、距离、地区、马场和赛道筛选。连续参赛可能带来疲劳风险，可在筛选中避开。</p>
        <p>报名较远的赛事时会再次确认。主战骑手不受现实年份限制。</p>
      </div>

      <div class="help-section">
        <h2>赛事等级与远征</h2>
        <p>日本马可在部分赛事中申请越级挑战，赛事名前会标记“格上”。机会有限；报名失败后不能重复申请同一场比赛。</p>
        <p>欧洲和北美采用简化的赛事晋级。获胜后可挑战更高等级，表现突出时晋级更快。</p>
        <p>跨地区参赛需要远征和检疫，报名可能因此提前锁定。欧洲与北美之间可转厩一次；日本马不能转厩。</p>
      </div>

      <div class="help-section">
        <h2>赛场、场地与比赛</h2>
        <p>赛道分为瞬发、持久和消耗型；主席模式可为马场设置赛道类型。比赛当天的场地情况也会影响适性发挥。</p>
        <p>每场比赛都会计算出闸、取位和末脚。严重失误可能退赛；史实阵容报名后固定，若合格史实马不足，该场比赛不会开放报名。</p>
      </div>

      <div class="help-section">
        <h2>主席模式：繁殖</h2>
        <p>配种会综合亲本和祖先特点。优秀配合会提高优良后代的机会，但不会保证结果；繁殖评价会随子代成绩逐渐形成。</p>
        <p>可手动指定配种，其余由系统安排；年底生成后代和年度报告。</p>
      </div>

      <div class="help-section">
        <h2>伤病与休养</h2>
        <p>退赛可能无伤，也可能需要休养。重伤有机会导致提前退役；休养期间不能报名，休养结束后可继续比赛。</p>
      </div>

      <div class="help-section">
        <h2>史实对手</h2>
        <p>普通模式在资料充足时会安排参加过该赛事的史实名马。传奇模式按赛场和距离挑选史实对手，报名后阵容固定；合格对手不足时，该场不会开放报名。</p>
        <p>展开比赛记录可查看同场对手、骑手和赛果。</p>
      </div>
    </div>
  `;

  ns.Help.sireHelpHtml = `
    <div class="help-content sire-help-content">
      <div class="help-section">
        <h2>父系特点</h2>
        <p>父系提供遗传倾向，会影响场地、距离、成长和气性等特点，但不会决定后代结果。</p>
        <p>可在现代父系和经典父系间切换；随机父系没有固定倾向。</p>
      </div>
      <div class="sire-help-list-grid">
        <div class="help-section">
          <h2>现代父系</h2>
          <ul>${sireHelpItems("current")}</ul>
        </div>
        <div class="help-section">
          <h2>经典父系</h2>
          <ul>${sireHelpItems("classic")}</ul>
        </div>
      </div>
    </div>
  `;

  ns.Help.damHelpHtml = `
    <div class="help-content dam-help-content">
      <div class="help-section">
        <h2>母系特点</h2>
        <p>母系会影响速度、耐力、稳定、成长、场地和距离等倾向，但不会决定后代结果。</p>
        <p>随机母系没有固定倾向。</p>
      </div>
      <div class="help-section">
        <h2>史实母系</h2>
        <ul>${damHelpItems()}</ul>
      </div>
    </div>
  `;

  ns.Help.trainerHelpHtml = `
    <div class="help-content trainer-help-content">
      <div class="help-section">
        <h2>练马师评语</h2>
        <p>评语会提示实力、适性、距离、成长和气性，但可能含糊或判断有误。练马师擅长的项目更可信，传奇模式的评语也更准确。</p>
        <p>练马师决定初始所属地，并影响可选骑手、赛事路线和新马战安排。赛后评语可帮助分析表现，但不一定只有一个原因。</p>
      </div>

      <div class="help-section">
        <h2>佐藤悠太</h2>
        <p>日本所属，擅长判断距离，评价实力较谨慎。</p>
      </div>

      <div class="help-section">
        <h2>O'Brien（岳伯仁）</h2>
        <p>欧洲所属，擅长判断成长和气性，评价实力较乐观。</p>
      </div>

      <div class="help-section">
        <h2>Pletcher（普莱彻）</h2>
        <p>北美所属，擅长判断场地适性和实力，评价较乐观。</p>
      </div>
    </div>
  `;
})();
