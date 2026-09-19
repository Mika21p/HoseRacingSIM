(function () {
  const ns = (window.Keiba = window.Keiba || {});
  const R = ns.Random;

  const AGE_MAP = {
    "二": 2,
    "三": 3,
    "四": 4,
    "五": 5,
    "六": 6,
    "七": 7,
    "八": 8
  };

  const SEASONS = {
    "春": { startMonth: 3, endMonth: 5, endAgeOffset: 0 },
    "夏": { startMonth: 6, endMonth: 8, endAgeOffset: 0 },
    "秋": { startMonth: 9, endMonth: 11, endAgeOffset: 0 },
    "冬": { startMonth: 12, endMonth: 2, endAgeOffset: 1 }
  };

  function parseSeasonLabel(label) {
    const match = String(label || "").match(/^(.+)岁(.+)$/);
    if (!match) return null;
    const age = AGE_MAP[match[1]];
    const season = SEASONS[match[2]];
    if (!age || !season) return null;
    return { age, season };
  }

  function getPeakWindow(horse) {
    const start = parseSeasonLabel(horse.peakStart);
    const end = parseSeasonLabel(horse.peakEnd);
    if (!start || !end) return null;
    const startIndex = ns.TimeRules.toIndex(start.age, start.season.startMonth, 1);
    const endIndex = ns.TimeRules.toIndex(end.age + end.season.endAgeOffset, end.season.endMonth, 2);
    return {
      startIndex,
      endIndex,
      startLabel: horse.peakStart,
      endLabel: horse.peakEnd
    };
  }

  function evaluate(horse, time, decline, options) {
    const peak = getPeakWindow(horse);
    const currentIndex = time.index;
    const declineValue = decline || 0;
    if (!peak) {
      return {
        status: "未知",
        adjustedStrength: Math.max(1, horse.strength - declineValue),
        strengthDelta: -declineValue,
        monthsFromPeak: 0,
        decline: declineValue,
        peak
      };
    }

    if (currentIndex < peak.startIndex) {
      const monthsEarly = Math.ceil((peak.startIndex - currentIndex) / 2);
      const adjustedStrength = options && options.noAbilityFloor
        ? horse.strength - monthsEarly : Math.max(60, horse.strength - monthsEarly);
      return {
        status: "未成熟",
        adjustedStrength,
        strengthDelta: adjustedStrength - horse.strength,
        monthsFromPeak: -monthsEarly,
        decline: declineValue,
        peak
      };
    }

    if (currentIndex <= peak.endIndex) {
      return {
        status: "成熟期",
        adjustedStrength: horse.strength,
        strengthDelta: 0,
        monthsFromPeak: 0,
        decline: declineValue,
        peak
      };
    }

    const adjustedStrength = Math.max(1, horse.strength - declineValue);
    return {
      status: "衰退期",
      adjustedStrength,
      strengthDelta: adjustedStrength - horse.strength,
      monthsFromPeak: Math.ceil((currentIndex - peak.endIndex) / 2),
      decline: declineValue,
      peak
    };
  }

  function applyMonthlyDecline(horse, maturity, fromIndex, toIndex) {
    const peak = getPeakWindow(horse);
    const events = [];
    if (!peak || toIndex <= fromIndex) return events;
    for (let index = fromIndex + 1; index <= toIndex; index += 1) {
      if (index <= peak.endIndex) continue;
      const time = ns.TimeRules.fromIndex(index);
      if (time.half !== 1) continue;
      if (R.roll(2) === 1) {
        maturity.decline += 1;
        events.push({
          type: "monthly",
          amount: 1,
          timeLabel: ns.TimeRules.formatAgeMonth(time)
        });
      }
    }
    return events;
  }

  function applyRaceWear(horse, maturity, raceIndex) {
    const peak = getPeakWindow(horse);
    if (!peak || raceIndex <= peak.endIndex) return null;
    const amount = R.rollRange(1, 2);
    maturity.decline += amount;
    const time = ns.TimeRules.fromIndex(raceIndex);
    return {
      type: "race",
      amount,
      timeLabel: ns.TimeRules.formatAgeMonth(time)
    };
  }

  ns.MaturityRules = {
    getPeakWindow,
    evaluate,
    applyMonthlyDecline,
    applyRaceWear
  };
})();
