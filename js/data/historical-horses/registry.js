(function () {
  const ns = (window.Keiba = window.Keiba || {});
  const horses = [];

  function register(horse) {
    if (!horse || !horse.id) return;
    const existingIndex = horses.findIndex((item) => item.id === horse.id);
    if (existingIndex >= 0) {
      horses[existingIndex] = horse;
      return;
    }
    horses.push(horse);
  }

  function all() {
    return horses.slice();
  }

  ns.HistoricalHorseRegistry = { register, all };
})();
