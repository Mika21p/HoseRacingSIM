(function () {
  const ns = (window.Keiba = window.Keiba || {});
  const buckets = [];

  function register(region, category, races) {
    if (!Array.isArray(races)) return;
    buckets.push({
      region,
      category,
      races: races.slice()
    });
  }

  function all() {
    return buckets.flatMap((bucket) => bucket.races);
  }

  function groups() {
    return buckets.map((bucket) => ({
      region: bucket.region,
      category: bucket.category,
      count: bucket.races.length
    }));
  }

  ns.RaceRegistry = {
    register,
    all,
    groups
  };
})();
