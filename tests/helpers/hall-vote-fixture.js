const { loadChairmanRules } = require('./project-loader');
const project = loadChairmanRules(), { ChairmanRules: W, ChairmanHonors: H } = project.rules;
const plain = v => JSON.parse(JSON.stringify(v));
function fixture(count = 30, seed = 18349) {
  const w = W.createWorld({ seed, blank: true, id: 'hall-v2-test' });
  W.seeded(w, () => { for (let i = 0; i < count; i++) {
    const h = W.addHorse(w, { name: `候选${i}`, age: 5, status: 'retired', homeRegion: '日本', gender: '牡马' });
    h.lifetime = { starts: 30, wins: i ? 1 : 20, g1: i ? 1 : 20, prize: i ? 1000 : 20000 };
    h.annual.manual = i ? 105 : 140;
    H.profile(w, h.id).honor = i ? 0 : 12;
  } });
  return w;
}
function config(changes = {}, options = {}) {
  return { name: '测试理事', scope: 'central', regionId: '', count: 1000, weight: 1, enabled: true,
    motives: { ...Object.fromEntries(Object.keys(H.motives).map(k => [k, 0])), ...changes },
    affinities: Object.fromEntries(H.affinities.map(k => [k, 0])), ...options };
}
function council(w, changes = { g1: 100 }, options = {}) { return H.edit(w, 'type', config(changes, options)).world; }
function vote(w, force = false, award = 'hall') {
  const out = W.mutate(w, () => {});
  for (const p of H.buildCouncilBallot(out.world, out, 'central', award, force)) void p;
  return out;
}
module.exports = { project, W, H, plain, fixture, config, council, vote };
