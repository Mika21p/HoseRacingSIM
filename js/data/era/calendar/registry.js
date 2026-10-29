(function () {
  const ns = (window.Keiba = window.Keiba || {});
  // 年代赛历登记簿：每年一份 <年>.js，登记当年玩家可以报名的比赛。
  const byYear = new Map();
  function register(year, entries) {
    if (!Number.isInteger(year)) throw new Error("Era calendar requires a year.");
    const list = byYear.get(year) || [];
    (entries || []).forEach((entry) => {
      if (!entry || !entry.almanacRaceId) throw new Error("Era calendar entry requires an almanac race id.");
      if (list.some((item) => item.almanacRaceId === entry.almanacRaceId)) throw new Error(`Duplicate era calendar entry: ${entry.almanacRaceId}`);
      list.push({ ...entry, year });
    });
    byYear.set(year, list);
    return list;
  }
  function of(year) {
    return (byYear.get(year) || []).slice();
  }
  function all() {
    return [...byYear.keys()].sort().flatMap((year) => of(year));
  }
  function find(almanacRaceId) {
    return all().find((item) => item.almanacRaceId === almanacRaceId) || null;
  }
  ns.EraCalendarRegistry = { register, of, all, find, years: () => [...byYear.keys()].sort() };
})();
