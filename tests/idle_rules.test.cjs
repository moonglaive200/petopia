const assert = require("node:assert/strict");
require("../engine.js");
require("../idle-engine.js");
const E = PetopiaEngine;
const fresh = (o = {}) =>
  E.normalize({
    eventDay: 1,
    event: null,
    weather: "sun",
    happiness: 50,
    ...o,
  });
let count = 0;
function test(name, fn) {
  fn();
  console.log("✓ " + name);
  count++;
}
test("old saves opt in; locked/invalid dispatches are atomic; zero energy can start", () => {
  const s = fresh({ energy: 0 });
  assert.equal(s.idleHunt, null);
  assert.equal(E.claimIdle(s, 1000), null);
  assert.equal(s.idleHunt.running, false);
  const before = structuredClone(s);
  for (const [area, time] of [
    [1, 1000],
    [-1, 1000],
    [0.5, 1000],
    [0, NaN],
    [0, -1],
  ])
    assert.equal(E.startIdle(s, area, time), false);
  assert.deepEqual(s, before);
  assert.ok(E.startIdle(s, 0, 1000));
  assert.equal(s.energy, 0);
  assert.equal(s.daily.dungeon, 0);
});
test("one shared ledger: online ticks and one offline settlement yield exactly the same rewards", () => {
  const a = fresh(),
    b = fresh();
  E.startIdle(a, 0, 1000);
  E.startIdle(b, 0, 1000);
  for (let t = 2000; t <= 3601000; t += 1000) E.claimIdle(a, t, false);
  const report = E.claimIdle(b, 3601000);
  assert.ok(report.kills > 0);
  assert.equal(a.gold, b.gold);
  assert.equal(a.level, b.level);
  assert.equal(a.xp, b.xp);
  assert.equal(a.idleHunt.totalKills, b.idleHunt.totalKills);
  assert.ok(Math.abs(a.idleHunt.goldFraction - b.idleHunt.goldFraction) < 1e-7);
  assert.equal(a.day, 1);
  assert.equal(a.energy, 100);
  assert.equal(a.happiness, 50);
  assert.equal(E.claimIdle(b, 3601000), null);
  assert.equal(E.claimIdle(b, 3600999), null);
  const restored = E.normalize(JSON.parse(JSON.stringify(b)));
  assert.equal(E.claimIdle(restored, 3601000), null);
  assert.equal(restored.gold, b.gold);
});
test("offline cap is eight hours and discarded excess cannot be recovered by repeated claims", () => {
  const a = fresh(),
    b = fresh();
  E.startIdle(a, 0, 1000);
  E.startIdle(b, 0, 1000);
  const ar = E.claimIdle(a, 1000 + 24 * 3600000),
    br = E.claimIdle(b, 1000 + 8 * 3600000);
  assert.equal(ar.gold, br.gold);
  assert.equal(ar.xp, br.xp);
  assert.equal(ar.ms, 28800000);
  assert.equal(ar.capped, true);
  assert.equal(E.claimIdle(a, 1000 + 24 * 3600000), null);
  const gold = a.gold;
  E.claimIdle(a, 1000 + 24 * 3600000 + 1000);
  assert.ok(a.gold - gold < 10);
});
test("stop/resume excludes stopped time; clock rollback cannot duplicate or reset cursor", () => {
  const s = fresh();
  E.startIdle(s, 0, 100000);
  E.stopIdle(s, 160000);
  const report = E.claimIdle(s, 160000);
  assert.ok(report.kills > 0);
  const gold = s.gold;
  assert.equal(E.claimIdle(s, 9e8), null);
  assert.equal(s.gold, gold);
  E.startIdle(s, 0, 9e8);
  E.claimIdle(s, 9e8 + 60000);
  const last = s.idleHunt.lastAt,
    after = s.gold;
  assert.equal(E.claimIdle(s, last - 10000), null);
  assert.equal(s.idleHunt.lastAt, last);
  assert.equal(s.gold, after);
});
test("gear/area refresh settles old elapsed at old rates; new stats only apply forward", () => {
  const s = fresh({ gold: 1e6 });
  E.startIdle(s, 0, 1000);
  const old = structuredClone(s.idleHunt.rates);
  s.weapon = 9;
  s.gearUp.weapon[9] = 20;
  s.weaponUp = 20;
  s.level = 10;
  E.settleIdle(s, 61000);
  assert.equal(s.idleHunt.pending.kills, Math.floor(60000 / old.cycleMs));
  assert.equal(s.idleHunt.rates.attack, old.attack);
  E.startIdle(s, 2, 61000);
  assert.equal(s.idleHunt.rates.attack, E.stats(s).attack);
  assert.equal(s.idleHunt.area, 2);
  assert.equal(s.idleHunt.rates.level, 10);
  const oldKills = s.idleHunt.pending.kills;
  E.settleIdle(s, 121000);
  assert.ok(s.idleHunt.pending.kills > oldKills);
});
test("slots keep independent clocks, claims and progression; partial cycles persist", () => {
  const a = fresh(),
    b = fresh();
  E.startIdle(a, 0, 1000);
  E.startIdle(b, 0, 2000);
  const cycle = a.idleHunt.rates.cycleMs;
  E.settleIdle(a, 1000 + cycle / 2);
  assert.equal(E.claimIdle(a, 1000 + cycle / 2), null);
  const restored = E.normalize(JSON.parse(JSON.stringify(a)));
  const report = E.claimIdle(restored, 1000 + cycle);
  assert.equal(report.kills, 1);
  assert.equal(b.gold, 80);
  assert.equal(b.idleHunt.lastAt, 2000);
});
test("four market shock events each have exactly one percent, calm days now 43 percent", () => {
  const counts = { none: 0 };
  for (let i = 0; i < 10000; i++) {
    const s = fresh();
    let n = 0;
    E.rollDay(s, () => (n++ === 0 ? 0.9 : (i + 0.5) / 10000));
    const id = s.event?.id ?? "none";
    counts[id] = (counts[id] || 0) + 1;
  }
  for (let id = 12; id < 16; id++) assert.equal(counts[id], 100);
  assert.equal(counts.none, 4300);
});
test("market shocks apply once across reload, preserve held quantities, skip halted listings", () => {
  for (const [id, type, factor] of [
    [12, "stock", 1.3],
    [13, "stock", 0.7],
    [14, "coin", 3],
    [15, "coin", 0.2],
  ]) {
    const s = fresh({ stocks: { 0: 1.25 }, coinHoldings: { 0: 2 } });
    s.market[type][0] = 100;
    s.market[type][1] = 1;
    E.syncMarketListings(s);
    let n = 0;
    E.rollDay(s, () => (n++ === 0 ? 0.9 : (53.5 + (id - 12)) / 100));
    assert.equal(s.event.id, id);
    assert.equal(s.market[type][0], Math.round(100 * factor));
    assert.equal(s.market[type][1], 1);
    assert.ok(s.event.resolved);
    assert.ok(s.event.effect.includes("즉시 적용"));
    assert.equal(s.previousMarket[type][0], 100);
    const snapshot = JSON.stringify(s.market);
    E.normalize(s);
    assert.equal(JSON.stringify(s.market), snapshot);
    assert.equal(s.stocks[0], 1.25);
    assert.equal(s.coinHoldings[0], 2);
  }
});
console.log(`PASS ${count} idle/market feature groups`);
