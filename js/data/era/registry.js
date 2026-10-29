(function () {
  const ns = (window.Keiba = window.Keiba || {});
  const entries = new Map();
  function register(scenario) {
    if (!scenario || !scenario.id || entries.has(scenario.id)) throw new Error("Invalid or duplicate era scenario id");
    entries.set(scenario.id, scenario);
    return scenario;
  }
  function validate() {
    const warnings = [];
    entries.forEach((s) => {
      if (!s.playerTemplate || !s.startDate || !s.endDate || !s.goals) warnings.push({ type: "invalid-scenario", id: s.id });
      for (const id of s.storyletIds || []) if (!ns.EraStoryletData?.some((node) => node.id === id)) warnings.push({ type: "missing-storylet", id });
    });
    return warnings;
  }
  ns.EraScenarioRegistry = {
    register, validate, find: (id) => entries.get(id) || null,
    list: () => [...entries.values()],
    listEntries: () => [...entries.values()].map((s) => ({ ...s.entryCandidate, scenarioId: s.id, routeId: s.routeId }))
  };
})();
