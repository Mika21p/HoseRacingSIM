/*
 * JRA 中央平地赛程目录。
 *
 * 资料来源为 JRA 十个中央马场的官方赛道介绍页。它是“马场 + 表面 + 距离 + 路线”
 * 的身份目录，不包含赛场类型判断；类型判断由 race-course-profiles.js 统一维护。
 */
(function () {
  const ns = window.Keiba = window.Keiba || {};

  const routeNames = Object.freeze({ standard: '标准路线', inner: '内回', outer: '外回', straight: '直线' });
  const identities = Object.freeze({
    '东京': {
      trackKey: 'tokyo', sourceUrl: 'https://www.jra.go.jp/facilities/race/tokyo/course/',
      routes: { '草地': { standard: [1400, 1600, 1800, 2000, 2300, 2400, 2500, 2600, 3400] }, '泥地': { standard: [1200, 1300, 1400, 1600, 2100, 2400] } }
    },
    '中山': {
      trackKey: 'nakayama', sourceUrl: 'https://www.jra.go.jp/facilities/race/nakayama/course/',
      routes: { '草地': { outer: [1200, 1600, 2200, 2600, 3200, 4000], inner: [1800, 2000, 2500, 3200, 3600] }, '泥地': { standard: [1000, 1200, 1700, 1800, 2400, 2500] } }
    },
    '京都': {
      trackKey: 'kyoto', sourceUrl: 'https://www.jra.go.jp/facilities/race/kyoto/course/',
      routes: { '草地': { inner: [1100, 1200, 1400, 1600, 2000], outer: [1400, 1600, 1800, 2000, 2200, 2400, 3000, 3200] }, '泥地': { standard: [1000, 1100, 1200, 1400, 1800, 1900, 2600] } }
    },
    '阪神': {
      trackKey: 'hanshin', sourceUrl: 'https://www.jra.go.jp/facilities/race/hanshin/course/',
      routes: { '草地': { inner: [1200, 1400, 2000, 2200, 3000, 3200], outer: [1400, 1600, 1800, 2400, 2600, 3200] }, '泥地': { standard: [1200, 1400, 1800, 2000, 2600] } }
    },
    '中京': {
      trackKey: 'chukyo', sourceUrl: 'https://www.jra.go.jp/facilities/race/chukyo/course/',
      routes: { '草地': { standard: [1200, 1300, 1400, 1600, 2000, 2200, 3000] }, '泥地': { standard: [1200, 1400, 1800, 1900, 2500] } }
    },
    '福岛': {
      trackKey: 'fukushima', sourceUrl: 'https://www.jra.go.jp/facilities/race/fukushima/course/',
      routes: { '草地': { standard: [1000, 1200, 1700, 1800, 2000, 2600] }, '泥地': { standard: [1000, 1150, 1700, 2400] } }
    },
    '新潟': {
      trackKey: 'niigata', sourceUrl: 'https://www.jra.go.jp/facilities/race/niigata/course/',
      routes: { '草地': { straight: [1000], inner: [1200, 1400, 2000, 2200, 2400], outer: [1400, 1600, 1800, 2000, 3000, 3200] }, '泥地': { standard: [1000, 1200, 1700, 1800, 2500] } }
    },
    '小仓': {
      trackKey: 'kokura', sourceUrl: 'https://www.jra.go.jp/facilities/race/kokura/course/',
      routes: { '草地': { standard: [1000, 1200, 1700, 1800, 2000, 2600] }, '泥地': { standard: [1000, 1700, 2400] } }
    },
    '札幌': {
      trackKey: 'sapporo', sourceUrl: 'https://www.jra.go.jp/facilities/race/sapporo/course/',
      routes: { '草地': { standard: [1000, 1200, 1500, 1800, 2000, 2600] }, '泥地': { standard: [1000, 1700, 2400] } }
    },
    '函馆': {
      trackKey: 'hakodate', sourceUrl: 'https://www.jra.go.jp/facilities/race/hakodate/course/',
      routes: { '草地': { standard: [1000, 1200, 1700, 1800, 2000, 2600] }, '泥地': { standard: [1000, 1700, 2400] } }
    }
  });

  function routesFor(course, surface, distance) {
    const identity = identities[course];
    if (!identity || !identity.routes[surface]) return [];
    return Object.entries(identity.routes[surface])
      .filter(([, distances]) => distances.includes(distance))
      .map(([routeId]) => routeId);
  }

  // 条件赛保留原定距离；优先保留原马场，其次同举办组、同档期地方场，最后才从中央目录补位。
  // 若某距离有内／外两个真实路线，则交替分配，且把路线写入赛事，绝不交给后续阶段猜测。
  function normalizeGeneratedRace(plan, surface, course, distance, index) {
    const candidates = [...new Set([course, ...(plan.group || []), ...(plan.locals || []), ...Object.keys(identities)])];
    const selectedCourse = candidates.find((candidate) => routesFor(candidate, surface, distance).length);
    if (!selectedCourse) throw new Error(`没有可承办 ${surface}${distance}m 条件赛的 JRA 中央赛程。`);
    const routes = routesFor(selectedCourse, surface, distance);
    const seed = ((plan.age || 0) * 31 + (plan.month || 0) * 7 + (plan.half || 0) * 3 + (index || 0));
    const routeId = routes[seed % routes.length];
    return Object.freeze({ course: selectedCourse, routeId, routeName: routeNames[routeId], trackKey: identities[selectedCourse].trackKey, sourceUrl: identities[selectedCourse].sourceUrl });
  }

  ns.JraCourseCatalogue = Object.freeze({ version: 'jra-course-catalogue-v1', identities, routeNames, routesFor, normalizeGeneratedRace });
})();
