(function () {
  const ns = (window.Keiba = window.Keiba || {});
  function summarize(events, scenario) {
    const results = events.filter((e) => e.type === "race-result");
    const wins = results.filter((e) => e.rank === 1 && !e.retired);
    const g1Wins = wins.filter((e) => e.grade === "G1").length;
    const classics = scenario.goals.classics;
    const classicResults = classics.map((id) => results.find((e) => e.raceId === id));
    const settled = new Set(events.filter((e) => ["race-result", "historical-race"].includes(e.type)).map((e) => e.raceId));
    const tags = [];
    if (wins.length) tags.push("winner");
    if (g1Wins) tags.push("g1-winner");
    const wonClassic = (index) => {
      const result = classicResults[index];
      return !!(result && result.rank === 1 && !result.retired);
    };
    if (classicResults.slice(0, 2).every((e) => e && e.rank === 1 && !e.retired) && !settled.has(classics[2])) tags.push("triple-crown-candidate");
    // 三冠落空：至少赢下一场古典赛，之后又丢掉了一场；从未领先过三冠的不算。
    if (classicResults.slice(0, 2).some((_e, index) => wonClassic(index)) && classics.some((id, i) => settled.has(id) && !wonClassic(i))) tags.push("crown-lost");
    if (classicResults.every((e) => e && e.rank === 1 && !e.retired)) tags.push("triple-crown");

    // 玩家名次序列，用于连胜、连败、初胜等标签。
    const finishes = results.map((e) => (e.retired ? 0 : e.rank));
    if (finishes.length && finishes.every((rank) => rank === 1)) tags.push("unbeaten");
    if (results.length && finishes[0] === 1) tags.push("maiden-win");
    let streak = 0, bestStreak = 0;
    for (const rank of finishes) { streak = rank === 1 ? streak + 1 : 0; bestStreak = Math.max(bestStreak, streak); }
    if (bestStreak >= 3) tags.push("streak");
    let slump = 0, bestSlump = 0;
    for (const rank of finishes) { slump = rank === 1 ? 0 : slump + 1; bestSlump = Math.max(bestSlump, slump); }
    if (bestSlump >= 3) tags.push("slump");

    // 伤病与复出：伤愈后首次实际参赛时获得复出标签。
    let justRecovered = false;
    for (const event of events) {
      if (event.type === "injury-start") justRecovered = false;
      else if (event.type === "injury-recovery") justRecovered = true;
      else if (event.type === "race-result") {
        if (justRecovered && !tags.includes("injury-return")) {
          tags.push("injury-return");
        }
        justRecovered = false;
      }
    }
    if (events.some((e) => e.type === "race-absent")) tags.push("missed-race");

    // 世界线改写：玩家参与的比赛冠军与史实冠军不同。
    const rewrites = results.filter((e) => e.historicalWinnerId && e.winnerId && e.winnerId !== e.historicalWinnerId);
    if (rewrites.length) tags.push("worldline-rewriter");

    const rivals = {}, beatenBy = {};
    for (const e of results) for (const h of e.namedOpponents || []) {
      rivals[h] = (rivals[h] || 0) + 1;
      const ownFinish = e.retired ? 99 : e.rank;
      const theirFinish = (e.namedOpponentFinishes || {})[h];
      if (Number.isFinite(theirFinish) && theirFinish < ownFinish) beatenBy[h] = (beatenBy[h] || 0) + 1;
    }
    for (const [id, count] of Object.entries(rivals)) if (count >= 2) tags.push(`rival:${id}`);
    for (const [id, count] of Object.entries(beatenBy)) if (count >= 3) tags.push(`nemesis:${id}`);

    // 剧情片段与选项带来的加成名声与标签同样记在事件流里，随存档一起保存。
    let bonusFame = 0;
    for (const event of events) {
      if (event.type !== "storylet-effect" || !event.effect) continue;
      if (event.effect.type === "fame" && Number.isFinite(event.effect.delta)) bonusFame += event.effect.delta;
      else if (event.effect.type === "tag" && event.effect.add && !tags.includes(event.effect.add)) tags.push(event.effect.add);
      else if (event.effect.type === "relation" && event.effect.target) {
        const tag = `${event.effect.kind}:${event.effect.target}`;
        if (!tags.includes(tag)) tags.push(tag);
      }
    }
    const fame = Math.max(0, Math.min(100, wins.length * 5 + g1Wins * 15 + rewrites.length * 8 + bonusFame));
    return { tags, starts: results.length, wins: wins.length, g1Wins, fame, rivals };
  }
  ns.EraNarrative = { summarize };
})();
