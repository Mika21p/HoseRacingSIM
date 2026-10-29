(function () {
  const ns = (window.Keiba = window.Keiba || {});
  // 年代剧情片段登记簿：每年一份 <年>.js，登记当年的片段节点。
  // 引擎侧仍读取扁平的 ns.EraStoryletData；登记簿按年归档，并在每次登记后重建这张表。
  const byYear = new Map();
  function rebuild() {
    ns.EraStoryletData = [...byYear.keys()].sort().flatMap((year) => byYear.get(year));
  }
  function register(year, nodes) {
    if (!Number.isInteger(year)) throw new Error("Era storylet requires a year.");
    const list = byYear.get(year) || [];
    (nodes || []).forEach((node) => {
      if (!node || !node.id) throw new Error("Era storylet node requires an id.");
      if (list.some((item) => item.id === node.id)) throw new Error(`Duplicate era storylet id: ${node.id}`);
      list.push(node);
    });
    byYear.set(year, list);
    rebuild();
    return list;
  }
  function of(year) { return (byYear.get(year) || []).slice(); }
  ns.EraStoryletRegistry = { register, of, years: () => [...byYear.keys()].sort() };
})();
