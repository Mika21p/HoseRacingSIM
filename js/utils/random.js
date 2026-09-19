(function () {
  const ns = (window.Keiba = window.Keiba || {});
  let source = null;

  function next() { return source ? source() : Math.random(); }

  function withSource(random, action) {
    const previous = source;
    source = random;
    try { return action(); } finally { source = previous; }
  }

  function seeded(state) {
    let value = state >>> 0;
    const random = () => {
      value = (value + 0x6D2B79F5) >>> 0;
      let t = Math.imul(value ^ (value >>> 15), 1 | value);
      t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    random.state = () => value;
    return random;
  }

  function roll(sides) {
    return Math.floor(next() * sides) + 1;
  }

  function rollMulti(count, sides) {
    let total = 0;
    for (let i = 0; i < count; i += 1) total += roll(sides);
    return total;
  }

  function rollRange(min, max) {
    const lo = Math.min(min, max);
    const hi = Math.max(min, max);
    return lo + Math.floor(next() * (hi - lo + 1));
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function pickOne(items) {
    return items[Math.floor(next() * items.length)];
  }

  function weightedPick(items, getWeight) {
    const total = items.reduce((sum, item) => sum + Math.max(0, getWeight(item)), 0);
    if (total <= 0) return items[0];
    let cursor = next() * total;
    for (const item of items) {
      cursor -= Math.max(0, getWeight(item));
      if (cursor <= 0) return item;
    }
    return items[items.length - 1];
  }

  ns.Random = { roll, rollMulti, rollRange, clamp, pickOne, weightedPick, next, withSource, seeded };
})();
