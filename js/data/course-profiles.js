(function () {
  "use strict";

  const ns = (window.Keiba = window.Keiba || {});
  const profiles = [
    {
      id: "lab-starlight-turf-1600-main",
      name: "星海竞马场 草地1600 主赛道",
      trackId: "lab-starlight",
      courseConfigId: "lab-starlight:main",
      trackName: "星海竞马场",
      routeName: "主赛道",
      surface: "草地",
      distance: 1600,
      type: "burst",
      intensity: 1,
      note: "虚构实验赛程；用于验证瞬发Ⅰ。"
    },
    {
      id: "lab-mistfield-turf-2000-inner",
      name: "雾原竞马场 草地2000 内圈",
      trackId: "lab-mistfield",
      courseConfigId: "lab-mistfield:inner",
      trackName: "雾原竞马场",
      routeName: "内圈",
      surface: "草地",
      distance: 2000,
      type: "burst",
      intensity: 2,
      note: "虚构实验赛程；用于验证瞬发Ⅱ。"
    },
    {
      id: "lab-redpeak-dirt-1800-counterclockwise",
      name: "赤岳竞马场 泥地1800 逆时针",
      trackId: "lab-redpeak",
      courseConfigId: "lab-redpeak:counterclockwise",
      trackName: "赤岳竞马场",
      routeName: "逆时针",
      surface: "泥地",
      distance: 1800,
      type: "sustained",
      intensity: 1,
      note: "虚构实验赛程；用于验证持久Ⅰ。"
    },
    {
      id: "lab-verdant-turf-2400-outer",
      name: "翠岭竞马场 草地2400 外圈",
      trackId: "lab-verdant",
      courseConfigId: "lab-verdant:outer",
      trackName: "翠岭竞马场",
      routeName: "外圈",
      surface: "草地",
      distance: 2400,
      type: "sustained",
      intensity: 2,
      note: "虚构实验赛程；用于验证持久Ⅱ。"
    },
    {
      id: "lab-greyharbor-dirt-1400-short",
      name: "灰港竞马场 泥地1400 短直线",
      trackId: "lab-greyharbor",
      courseConfigId: "lab-greyharbor:short",
      trackName: "灰港竞马场",
      routeName: "短直线",
      surface: "泥地",
      distance: 1400,
      type: "attrition",
      intensity: 1,
      note: "虚构实验赛程；用于验证消耗Ⅰ。"
    },
    {
      id: "lab-northgate-turf-3200-endurance",
      name: "北境竞马场 草地3200 耐力环",
      trackId: "lab-northgate",
      courseConfigId: "lab-northgate:endurance",
      trackName: "北境竞马场",
      routeName: "耐力环",
      surface: "草地",
      distance: 3200,
      type: "attrition",
      intensity: 2,
      note: "虚构实验赛程；用于验证消耗Ⅱ。"
    }
  ];

  if (ns.TrackAptitudeRules) {
    profiles.forEach((profile) => ns.TrackAptitudeRules.validateCourseProfile(profile));
  }

  const byId = new Map(profiles.map((profile) => [profile.id, profile]));
  ns.CourseProfiles = {
    version: "track-aptitude-lab-v1",
    all() { return profiles.slice(); },
    get(id) { return byId.get(id) || null; }
  };
})();
