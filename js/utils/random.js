(function () {
  const ns = (window.Keiba = window.Keiba || {});

  function roll(sides) {
    return Math.floor(Math.random() * sides) + 1;
  }

  function rollMulti(count, sides) {
    let total = 0;
    for (let i = 0; i < count; i += 1) total += roll(sides);
    return total;
  }

  function rollRange(min, max) {
    const lo = Math.min(min, max);
    const hi = Math.max(min, max);
    return lo + Math.floor(Math.random() * (hi - lo + 1));
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function pickOne(items) {
    return items[Math.floor(Math.random() * items.length)];
  }

  function weightedPick(items, getWeight) {
    const total = items.reduce((sum, item) => sum + Math.max(0, getWeight(item)), 0);
    if (total <= 0) return items[0];
    let cursor = Math.random() * total;
    for (const item of items) {
      cursor -= Math.max(0, getWeight(item));
      if (cursor <= 0) return item;
    }
    return items[items.length - 1];
  }

  ns.Random = { roll, rollMulti, rollRange, clamp, pickOne, weightedPick };
})();
