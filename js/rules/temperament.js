(function () {
  const ns = (window.Keiba = window.Keiba || {});
  const R = ns.Random;

  const MOD_RANGES = {
    "极端暴躁": [-5, 2],
    "暴躁": [-3, 1],
    "胆小": [-2, 0],
    "普通": [-1, 0],
    "沉稳": [0, 0],
    "冷静": [0, 1],
    "极其聪明": [0, 2]
  };

  function getRange(label) {
    return MOD_RANGES[label] || [0, 0];
  }

  function rollRaceMod(label) {
    const range = getRange(label);
    return {
      label,
      min: range[0],
      max: range[1],
      mod: R.rollRange(range[0], range[1])
    };
  }

  ns.TemperamentRules = { MOD_RANGES, getRange, rollRaceMod };
})();
