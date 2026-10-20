const assert = require("node:assert/strict");
require("../engine.js");
const E = PetopiaEngine;
let passed = 0;
const fresh = (o = {}) =>
  E.normalize({ eventDay: 1, event: null, weather: "sun", ...o });
function test(name, fn) {
  fn();
  console.log("✓ " + name);
  passed++;
}
test("slot tickets exactly match all published probabilities and 90% RTP, with matching reels", () => {
  const s = fresh({ gold: 1e9 }),
    counts = {};
  let payout = 0;
  for (let i = 0; i < 10000; i++) {
    const r = E.slot(s, 100, [(i + 0.5) / 10000, 0.43, 0.72]);
    payout += r.payout;
    counts[r.label] = (counts[r.label] || 0) + 1;
    const unique = new Set(r.symbols).size;
    if (r.multiplier >= 3) assert.equal(unique, 1);
    else if (r.multiplier === 2)
      assert.deepEqual([...r.symbols].sort(), [1, 2, 3]);
    else if (r.multiplier === 1) assert.equal(unique, 2);
    else {
      assert.equal(unique, 3);
      assert.ok(r.symbols.some((x) => ![1, 2, 3].includes(x)));
    }
  }
  for (const o of E.slotTable) assert.equal(counts[o.label], o.weight);
  assert.equal(payout / 10000, 90);
});
test("both casino games accept entire wallet, reject insufficient/invalid amounts without loss", () => {
  for (const game of ["slot", "roulette"]) {
    const s = fresh({ gold: 1000000 });
    const call = (bet) =>
      game === "slot"
        ? E.slot(s, bet, [0, 0.5, 0.5])
        : E.roulette(s, "green", bet, 30.5 / 31);
    assert.equal(call(1000001), null);
    assert.equal(s.gold, 1000000);
    for (const n of [0, 9, 10.5, Infinity, NaN]) {
      assert.equal(call(n), null);
      assert.equal(s.gold, 1000000);
    }
    const win = call(1000000);
    assert.equal(win.payout, 1000000 * (game === "slot" ? 100 : 30));
    assert.equal(s.gold, win.payout);
  }
});
test("four healing allowances independent; blocked actions never spend energy or claims", () => {
  const s = fresh({
    happiness: 0,
    romance: { kind: 0, name: "치즈", affection: 0, stage: 0 },
    vehicles: [0],
  });
  assert.ok(E.nap(s));
  assert.equal(s.happiness, 30);
  assert.equal(s.energy, 100);
  assert.ok(E.park(s, 0.5));
  assert.equal(s.energy, 75);
  assert.ok(E.drive(s));
  assert.equal(s.energy, 50);
  assert.ok(E.enterArcade(s));
  assert.equal(s.energy, 25);
  assert.equal(s.happiness, 95);
  const before = structuredClone(s);
  assert.equal(E.park(s), null);
  assert.equal(E.drive(s), null);
  assert.equal(E.enterArcade(s), false);
  assert.equal(E.nap(s), false);
  assert.deepEqual(s, before);
  const rain = fresh({ weather: "rain" });
  assert.equal(E.park(rain), null);
  assert.equal(rain.daily.walk, 0);
  assert.equal(rain.energy, 100);
  assert.ok(E.enterArcade(rain));
  const empty = fresh({ energy: 24 });
  assert.equal(E.enterArcade(empty), false);
  assert.equal(empty.daily.arcade, 0);
  const old = fresh({ daily: { walk: 1 }, version: 3 });
  assert.equal(old.daily.walk, 1);
  assert.equal(old.daily.drive, 0);
  assert.equal(old.daily.arcade, 0);
});
test("owner promotions require 1/2/3 fresh workdays at every level, staff gate unchanged", () => {
  for (let job = 0; job < 3; job++) {
    const s = fresh({ gold: 1e10, workLevels: [10, 10, 10] });
    s.workLevels[job] = 1;
    for (let level = 1; level < 10; level++) {
      assert.equal(E.promotion(s, job).days, job + 1);
      s.promotionDays[job] = job;
      assert.equal(E.promote(s, job), false);
      s.promotionDays[job]++;
      assert.ok(E.promote(s, job));
      assert.equal(s.promotionDays[job], 0);
      assert.equal(s.workLevels[job], level + 1);
    }
    assert.equal(E.promotion(s, job), null);
  }
  const s = fresh({ happiness: 50 });
  assert.equal(E.jobPay(s, 0), E.jobs[0].pay * 10);
  assert.equal(E.jobPay(s, 0, true), E.jobs[0].pay * 5);
  s.working = 0;
  s.energy = 0;
  E.nextDay(s, () => 0.99);
  assert.equal(s.workDays[0], 1);
  assert.equal(s.promotionDays[0], 1);
  const old = fresh({ workDays: [100, 100, 100], workLevels: [4, 4, 4] });
  assert.deepEqual(old.promotionDays, [1, 2, 3]);
  old.promotionDays[0] = 0;
  E.normalize(old);
  assert.equal(old.promotionDays[0], 0);
});
test("company dividend grants floor-to-2-decimal shares by settlement quote and retains 1% cash", () => {
  const s = fresh({ gold: 0, companies: [0], energy: 0, happiness: 50 });
  s.market.stock[0] = 2700;
  const amount = 3.33;
  assert.ok(E.nextDay(s, () => 0.99));
  assert.equal(s.gold, E.companies[0].income);
  assert.equal(s.stocks[0], amount);
  assert.equal(s.costBasis.stock[0], amount * 2700);
  assert.ok(s.dayReport.some((t) => t.includes("3.33주")));
  E.normalize(s);
  assert.equal(s.stocks[0], amount);
  const q =
    Math.floor(
      ((E.companies[0].cost * 0.01) / E.price(s, "stock", 0)) * 100 + 1e-8,
    ) / 100;
  s.energy = 0;
  E.nextDay(s, () => 0.99);
  assert.equal(s.stocks[0], Math.round((amount + q) * 100) / 100);
  const halted = fresh({ companies: [0], energy: 0, gold: 0 });
  halted.market.stock[0] = 1;
  E.nextDay(halted, () => 0.99);
  assert.equal(halted.stocks[0] || 0, 0);
  assert.equal(halted.gold, E.companies[0].income);
});
test("fractional stock trading collects 2% on buys and sells, cost basis includes fee; coins unchanged", () => {
  const s = fresh({ gold: 10000 });
  s.market.stock[0] = 1000;
  assert.ok(E.trade(s, "stock", 0, "buy", 0.33));
  assert.equal(s.gold, 9663);
  assert.equal(s.stocks[0], 0.33);
  assert.equal(s.costBasis.stock[0], 337);
  assert.ok(E.trade(s, "stock", 0, "sell", 0.33));
  assert.equal(s.gold, 9986);
  assert.equal(s.stocks[0], 0);
  assert.equal(s.realized.stock, -14);
  const before = structuredClone(s);
  for (const q of [0.001, 0.333, NaN, Infinity, -1])
    assert.equal(E.trade(s, "stock", 0, "buy", q), false);
  assert.deepEqual(s, before);
  s.gold = 1019;
  assert.equal(E.trade(s, "stock", 0, "buy", 1), false);
  s.gold = 1020;
  assert.ok(E.trade(s, "stock", 0, "buy", 1));
  assert.equal(s.gold, 0);
  s.gold = 100;
  s.market.coin[0] = 10;
  assert.ok(E.trade(s, "coin", 0, "buy", 1));
  assert.equal(s.gold, 90);
  assert.ok(E.trade(s, "coin", 0, "sell", 1));
  assert.equal(s.gold, 99);
  assert.equal(E.trade(s, "coin", 0, "buy", 0.5), false);
});
test("only cheese meets at 5%, naming validates and persists, existing relationships migrate intact", () => {
  assert.equal(E.partners.length, 1);
  for (const source of ["walk", "work", "dungeon", "star", "live"]) {
    const s = fresh();
    assert.equal(E.meet(s, source, 0.05), null);
    assert.ok(E.meet(s, source, 0.049999));
    assert.ok(s.romance.namePending);
    assert.equal(E.namePartner(s, ""), false);
    assert.equal(E.namePartner(s, "x".repeat(13)), false);
    assert.ok(E.namePartner(s, "  햇살이  "));
    assert.equal(E.partnerName(s), "햇살이");
    assert.equal(s.romance.namePending, false);
    assert.equal(E.meet(s, source, 0), null);
    E.normalize(s);
    assert.equal(E.partnerName(s), "햇살이");
  }
  const s = fresh({ romance: { kind: 2, stage: 2, affection: 7 } });
  assert.equal(s.romance.kind, 0);
  assert.equal(s.romance.affection, 7);
  assert.equal(s.romance.stage, 2);
  assert.ok(s.romance.namePending);
});
console.log(`PASS ${passed} v6 feature groups`);
