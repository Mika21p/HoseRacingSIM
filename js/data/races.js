(function () {
  const ns = (window.Keiba = window.Keiba || {});
  const splitFiles = [
    "./races/registry.js",
    "./races/core.js",
    "./races/Japan/conditions.js",
    "./races/Japan/open.js",
    "./races/Japan/g3.js",
    "./races/Japan/g2.js",
    "./races/Japan/g1.js",
    "./races/America/conditions.js",
    "./races/America/g3.js",
    "./races/America/g2.js",
    "./races/America/g1.js",
    "./races/Europe/conditions.js",
    "./races/Europe/g3.js",
    "./races/Europe/g2.js",
    "./races/Europe/g1.js",
    "./races/Australia/g1.js",
    "./races/MiddleEast/g1.js",
    "./races/HongKong/g1.js",
    "./races/Argentina/g1.js"
  ];

  if (!ns.RaceRegistry && typeof require === "function") {
    splitFiles.forEach((file) => require(file));
  }

  const registry = ns.RaceRegistry;
  const races = registry ? registry.all() : [];
  const seen = new Set();
  const duplicates = [];

  races.forEach((race) => {
    if (!race || !race.id) return;
    if (seen.has(race.id)) duplicates.push(race.id);
    seen.add(race.id);
  });

  if (duplicates.length) {
    console.error("Duplicate race ids:", duplicates);
  }

  ns.Races = races;
})();
