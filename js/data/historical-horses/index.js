(function () {
  const ns = (window.Keiba = window.Keiba || {});
  const basePath = "js/data/historical-horses/";
  const files = [
    "deep-impact.js",
    "orfevre.js",
    "gold-ship.js",
    "contrail.js",
    "almond-eye.js",
    "gentildonna.js",
    "equinox.js",
    "symboli-rudolf.js",
    "narita-brian.js",
    "tm-opera-o.js",
    "tokai-teio.js",
    "mejiro-mcqueen.js",
    "oguri-cap.js",
    "special-week.js",
    "el-condor-pasa.js",
    "grass-wonder.js",
    "vodka.js",
    "daiwa-scarlet.js",
    "buena-vista.js",
    "kitasan-black.js",
    "lord-kanaloa.js",
    "taiki-shuttle.js",
    "kurofune.js",
    "agnes-digital.js",
    "smart-falcon.js",
    "hokko-tarumae.js",
    "copano-rickey.js",
    "secretariat.js",
    "seattle-slew.js",
    "affirmed.js",
    "american-pharoah.js",
    "justify.js",
    "citation.js",
    "war-admiral.js",
    "spectacular-bid.js",
    "cigar.js",
    "tiznow.js",
    "zenyatta.js",
    "rachel-alexandra.js",
    "frankel.js",
    "sea-the-stars.js",
    "enable.js",
    "galileo.js",
    "dancing-brave.js",
    "nijinsky.js",
    "shergar.js",
    "montjeu.js",
    "zarkava.js",
    "baaeed.js",
    "ouija-board.js",
    "goldikova.js",
    "treve.js"
  ];

  function loadScript(file) {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = `${basePath}${file}`;
      script.onload = resolve;
      script.onerror = () => reject(new Error(`Failed to load ${file}`));
      document.head.appendChild(script);
    });
  }

  ns.HistoricalHorseFiles = files.slice();
  ns.HistoricalHorsesReady = Promise.all(files.map(loadScript))
    .then(() => {
      ns.HistoricalHorses = ns.HistoricalHorseRegistry.all();
      return ns.HistoricalHorses;
    })
    .catch((error) => {
      console.error(error);
      ns.HistoricalHorses = ns.HistoricalHorseRegistry.all();
      return ns.HistoricalHorses;
    });
})();
