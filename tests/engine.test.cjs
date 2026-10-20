const assert = require("node:assert/strict");
require("../engine.js");
require("../action.js");
const E = PetopiaEngine;
let assertions = 0;
function check(fn) {
  fn();
  assertions++;
}
const fresh = (overrides = {}) =>
  E.normalize({ character: "chunbae", ...overrides });
check(() => {
  const s = fresh({ debt: 100, followers: 42 });
  assert.equal(s.day, 1);
  assert.equal(s.followers, 42);
  assert.equal(s.liveFollowers, 0);
  assert.equal(E.debt(s), 100);
  E.normalize(s);
  assert.equal(E.debt(s), 100);
  assert.deepEqual(s.treats, [2, 0, 0]);
});
check(() => {
  const s = fresh();
  assert.equal(E.consume(s, "walk", 2, 5), true);
  assert.equal(E.consume(s, "walk", 2, 5), true);
  assert.equal(E.consume(s, "walk", 2, 5), false);
  assert.equal(s.energy, 90);
  assert.equal(s.daily.walk, 2);
  E.nextDay(s);
  assert.equal(s.day, 2);
  assert.equal(s.daily.walk, 0);
  assert.equal(s.energy, 100);
});
check(() => {
  const s = fresh({ working: 0 });
  assert.equal(E.canAct(s), false);
  assert.equal(E.consume(s, "dungeon", 5, 10), false);
  const before = s.gold;
  E.nextDay(s);
  assert.equal(s.gold, before + 28);
  assert.equal(s.working, null);
  assert.equal(E.canAct(s), true);
});
check(() => {
  const s = fresh({
    house: 6,
    employees: [0],
    buildings: [0],
    companies: [0],
    working: 1,
  });
  const before = s.gold;
  E.nextDay(s);
  assert.equal(
    s.gold,
    before + Math.floor(40 * 1.35) + Math.floor(28 * 1.2) + 45 + 110,
  );
});
check(() => {
  const s = fresh({ gold: 0 });
  assert.equal(E.takeLoan(s, 201), false);
  assert.equal(E.takeLoan(s, 200), true);
  assert.equal(E.takeLoan(s, 1), false);
  s.gold = 0;
  for (let i = 0; i < 5; i++) E.nextDay(s);
  assert.equal(s.gold, -220);
  assert.equal(E.debt(s), 0);
  const old = s.gold;
  s.working = 0;
  E.nextDay(s);
  assert.equal(s.gold, old + 28);
});
check(() => {
  const s = fresh({ hospital: true, level: 5, gold: -80, happiness: 0 });
  assert.equal(E.canAct(s), false);
  const result = E.heal(s);
  assert.equal(result.cost, 235);
  assert.equal(result.borrow, 315);
  assert.equal(s.gold, 0);
  assert.equal(s.hospital, false);
  assert.equal(s.happiness, 55);
  assert.equal(E.debt(s), 315);
});
check(() => {
  const rolls = [0.1, 0.55, 0.75, 0.82, 0.87, 0.95];
  for (let i = 0; i < rolls.length; i++) {
    const s = fresh({ followers: 100, liveFollowers: 50 });
    const text = E.park(s, rolls[i]);
    assert.ok(text);
    assert.equal(s.daily.walk, 1);
    if (i === 0) {
      assert.equal(s.diamonds, 1);
      assert.equal(s.happiness, 90);
    }
    if (i === 1) assert.equal(s.diamonds, 3);
    if (i === 2) assert.equal(s.happiness, 68);
    if (i === 3) assert.equal(s.toys.length, 1);
    if (i === 4) assert.equal(s.treats[0], 3);
    if (i === 5) {
      assert.equal(s.followers, 110);
      assert.equal(s.liveFollowers, 55);
    }
  }
});
check(() => {
  const s = fresh({ gold: 10000, diamonds: 100 });
  assert.equal(E.drive(s), null);
  E.purchase(s, "vehicle", 2);
  assert.equal(E.drive(s), null);
  E.purchase(s, "vehicle", 0);
  assert.ok(E.drive(s));
  assert.equal(s.diamonds, 94);
  assert.equal(s.daily.walk, 1);
});
check(() => {
  const s = fresh();
  assert.equal(E.addFollowers(s, "star", 100), 20);
  assert.equal(s.followers, 100);
  assert.equal(s.liveFollowers, 20);
  E.addFollowers(s, "live", 50);
  assert.equal(s.liveFollowers, 70);
  assert.equal(s.followers, 110);
});
check(() => {
  const s = fresh({ gold: 1000, diamonds: 5 });
  assert.equal(E.purchase(s, "weapon", 1), true);
  assert.equal(s.gold, 820);
  assert.equal(s.weapon, 1);
  E.purchase(s, "weapon", 0);
  E.purchase(s, "weapon", 1);
  assert.equal(s.gold, 820);
  s.weaponUp = 3;
  assert.equal(E.upgradeCost(s, "weapon"), 0);
  E.purchase(s, "treat", 2);
  assert.equal(s.diamonds, 3);
  assert.equal(s.treats[2], 1);
});
check(() => {
  const s = fresh({ gold: 1000 });
  const p = E.price(s, "stock", 0);
  assert.equal(E.trade(s, "stock", 0, "buy", 3), true);
  assert.equal(s.stocks[0], 3);
  assert.equal(E.trade(s, "stock", 0, "sell", 4), false);
  assert.equal(E.trade(s, "stock", 0, "sell", 3), true);
  assert.equal(s.gold, 1000 - 3 * p + Math.floor(3 * p * 0.96));
  assert.equal(E.trade(s, "stock", 0, "buy", -1), false);
});
check(() => {
  const s = fresh({ gold: 1000 });
  let r = E.roulette(s, "green", 10, 30 / 31 + 0.001);
  assert.equal(r.payout, 300);
  assert.equal(s.gold, 1290);
  r = E.roulette(s, "red", 10, 0);
  assert.equal(r.payout, 20);
  r = E.roulette(s, "black", 10, 1 / 31 + 0.001);
  assert.equal(r.payout, 20);
  assert.equal(E.roulette(s, "red", 501), null);
  assert.equal(E.roulette(s, "red", -1), null);
  const counts = { red: 0, black: 0, green: 0 };
  for (let i = 0; i < 31; i++) {
    const t = fresh({ gold: 10000 });
    counts[E.roulette(t, "red", 10, (i + 0.5) / 31).color]++;
  }
  assert.deepEqual(counts, { red: 15, black: 15, green: 1 });
});
check(() => {
  const s = fresh({ happiness: 8 });
  E.nextDay(s);
  assert.equal(s.hospital, true);
  assert.equal(s.happiness, 0);
  assert.equal(E.consume(s, "star", 1, 3), false);
});
check(() => {
  const a = new PetopiaArena(E.stats(fresh()), 0);
  const x = a.player.x,
    y = a.player.y;
  a.update(1, { right: true, down: true });
  assert.ok(Math.abs(Math.hypot(a.player.x - x, a.player.y - y) - 175) < 0.001);
  a.paused = true;
  const t = a.time;
  a.update(1, { right: true });
  assert.equal(a.time, t);
});
check(() => {
  const a = new PetopiaArena(E.stats(fresh()), 0);
  a.player.x = 550;
  a.player.y = 110;
  const e = a.enemies[0];
  const hp = e.hp;
  assert.equal(a.attack(), true);
  assert.ok(e.hp < hp);
  assert.equal(a.attack(), false);
  a.dodge();
  a.hit(1000);
  assert.equal(a.player.hp, a.stats.hp);
  a.player.inv = 0;
  a.hit(1000);
  assert.equal(a.lost, true);
});
check(() => {
  for (let i = 0; i < 10; i++) {
    const s = fresh({
      level: 1 + i * 2,
      weapon: i < 3 ? 0 : i < 6 ? 1 : 2,
      armor: i < 3 ? 0 : i < 6 ? 1 : 2,
      weaponUp: Math.min(3, Math.floor(i / 3)),
    });
    const a = new PetopiaArena(E.stats(s), i);
    for (let t = 0; t < 20000 && !a.won && !a.lost; t++) {
      const target = a.enemies.find((e) => e.hp > 0),
        p = a.player;
      if (target) {
        const dx = target.x - p.x,
          dy = target.y - p.y;
        const d = Math.hypot(dx, dy);
        a.update(0.016, {
          left: d > 60 && dx < -5,
          right: d > 60 && dx > 5,
          up: d > 60 && dy < -5,
          down: d > 60 && dy > 5,
          attack: true,
          dodge: false,
        });
      }
    }
    assert.equal(
      a.won,
      true,
      "Tier " +
        (i + 1) +
        " should be beatable at recommended level with matching gear",
    );
  }
});
check(() => {
  const a = new PetopiaArena(E.stats(fresh({ level: 8 })), 0, true);
  a.enemies[0].hp = 320;
  for (let i = 0; i < 700; i++) a.update(0.016, { left: false });
  assert.ok(a.enemies[0].patternIndex >= 3);
  assert.ok(a.projectiles.length || a.zones.length || a.enemies[0].charge);
});
check(() => {
  const s = fresh({ gold: 1000 });
  assert.equal(E.slot(s, 10, [0.01, 0.02, 0.03]).payout, 100);
  assert.equal(E.slot(s, 10, [0.01, 0.02, 0.4]).payout, 10);
  assert.equal(E.slot(s, 10, [0.01, 0.4, 0.9]).payout, 0);
  assert.equal(E.slot(s, -1), null);
  let total = 0;
  for (let a = 0; a < 5; a++)
    for (let b = 0; b < 5; b++)
      for (let c = 0; c < 5; c++) {
        const t = fresh({ gold: 100 });
        total += E.slot(t, 100, [
          (a + 0.5) / 5,
          (b + 0.5) / 5,
          (c + 0.5) / 5,
        ]).payout;
      }
  assert.equal(total / 125, 88);
});
check(() => {
  const s = fresh({ level: 6, weapon: 1, armor: 1, weaponUp: 1, armorUp: 1 }),
    a = new PetopiaArena(E.stats(s), 0, true);
  for (let t = 0; t < 20000 && !a.won && !a.lost; t++) {
    const e = a.enemies[0],
      p = a.player,
      dx = e.x - p.x,
      dy = e.y - p.y,
      d = Math.hypot(dx, dy);
    a.update(0.016, {
      left: d > 60 && dx < -5,
      right: d > 60 && dx > 5,
      up: d > 60 && dy < -5,
      down: d > 60 && dy > 5,
      attack: true,
      dodge:
        p.inv <= 0 &&
        (e.windup > 0 ||
          a.zones.some(
            (z) => z.warn < 0.2 && Math.hypot(z.x - p.x, z.y - p.y) < 90,
          )),
    });
  }
  assert.equal(a.won, true);
  assert.ok(a.enemies[0].patternIndex >= 3);
});
console.log(
  `PASS: ${assertions} scenario groups — migration, daily limits, job locks, passive income, bankruptcy-free loans, hospital, all park outcomes, vehicle unlock, cross-followers, purchases, trading, roulette odds, defeat, movement, invulnerability, ten-tier combat, boss patterns`,
);
