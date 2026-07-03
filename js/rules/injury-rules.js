(function () {
  const ns = (window.Keiba = window.Keiba || {});
  const R = ns.Random;

  const SEVERITIES = {
    none: { label: "无伤", restRange: [0, 0] },
    minor: { label: "小伤", restRange: [1, 3] },
    medium: { label: "中伤", restRange: [4, 7] },
    severe: { label: "重伤", restRange: [8, 14] }
  };

  const EARLY_REASONS = [
    { reason: "出闸失败", weight: 35 },
    { reason: "拒绝入闸", weight: 20 },
    { reason: "骑手落马", weight: 15 },
    { reason: "赛前步态异常", weight: 15 },
    { reason: "赛前放马", weight: 15 }
  ];

  const MIDDLE_REASONS = [
    { reason: "突发伤病", weight: 25 },
    { reason: "骑手拉停", weight: 20 },
    { reason: "骑手坠马", weight: 15 },
    { reason: "马具故障", weight: 15 },
    { reason: "严重斜行", weight: 15 },
    { reason: "赛中失误", weight: 10 }
  ];

  const LATE_REASONS = [
    { reason: "突发伤病", weight: 30 },
    { reason: "骑手拉停", weight: 25 },
    { reason: "骑手坠马", weight: 10 },
    { reason: "马具故障", weight: 10 },
    { reason: "严重斜行", weight: 10 },
    { reason: "赛中失误", weight: 15 }
  ];

  const SEVERITY_TABLES = {
    "出闸失败": { none: 82, minor: 15, medium: 3, severe: 0 },
    "拒绝入闸": { none: 92, minor: 7, medium: 1, severe: 0 },
    "骑手落马": { none: 70, minor: 22, medium: 7, severe: 1 },
    "赛前步态异常": { none: 45, minor: 38, medium: 14, severe: 3 },
    "赛前放马": { none: 75, minor: 20, medium: 4, severe: 1 },
    "突发伤病": { none: 5, minor: 25, medium: 45, severe: 25 },
    "骑手拉停": { none: 20, minor: 35, medium: 32, severe: 13 },
    "骑手坠马": { none: 55, minor: 30, medium: 12, severe: 3 },
    "马具故障": { none: 90, minor: 7, medium: 2, severe: 1 },
    "严重斜行": { none: 90, minor: 7, medium: 2, severe: 1 },
    "赛中失误": { none: 90, minor: 8, medium: 2, severe: 0 }
  };

  function phaseKey(phase) {
    if (phase === "序盘") return "early";
    if (phase === "末盘") return "late";
    return "middle";
  }

  function phaseLabel(key) {
    if (key === "early") return "序盘";
    if (key === "late") return "末盘";
    return "中盘";
  }

  function reasonsForPhase(key) {
    if (key === "early") return EARLY_REASONS;
    if (key === "late") return LATE_REASONS;
    return MIDDLE_REASONS;
  }

  function severityTableFor(reason, key) {
    const base = { ...(SEVERITY_TABLES[reason] || SEVERITY_TABLES["赛中失误"]) };
    if (key === "late" && reason === "突发伤病") {
      base.medium -= 5;
      base.severe += 5;
    }
    if (key === "late" && reason === "骑手拉停") {
      base.none -= 5;
      base.medium += 5;
    }
    return base;
  }

  function rollSeverity(table) {
    return R.weightedPick(
      Object.entries(table).map(([id, weight]) => ({ id, weight })),
      (item) => item.weight
    ).id;
  }

  function restMonthsFor(severity) {
    const range = SEVERITIES[severity].restRange;
    if (range[1] <= 0) return 0;
    return R.rollRange(range[0], range[1]);
  }

  function rollInjury(phase) {
    const key = phaseKey(phase);
    const pickedReason = R.weightedPick(reasonsForPhase(key), (item) => item.weight).reason;
    const severity = rollSeverity(severityTableFor(pickedReason, key));
    const restMonths = restMonthsFor(severity);
    const forcedRetirement = severity === "severe" && R.roll(100) <= 10;
    return {
      phase: phaseLabel(key),
      reason: pickedReason,
      severity,
      severityLabel: SEVERITIES[severity].label,
      restMonths,
      forcedRetirement
    };
  }

  ns.InjuryRules = {
    SEVERITIES,
    EARLY_REASONS,
    MIDDLE_REASONS,
    LATE_REASONS,
    SEVERITY_TABLES,
    rollInjury
  };
})();
