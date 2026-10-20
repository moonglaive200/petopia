const assert = require("node:assert/strict");
require("../engine.js");
require("../action.js");
const E = PetopiaEngine;
let count = 0;
const test = (name, fn) => {
  fn();
  count++;
  console.log("✓", name);
};
const fresh = (o = {}) =>
  E.normalize({
    character: "chunbae",
    eventDay: 1,
    weather: "sun",
    event: null,
    ...o,
  });
test("old saves migrate once, retain items/name/wealth and do not replay intro", () => {
  const s = fresh({
    version: 2,
    ownerName: "승식",
    gold: 321,
    toys: [0, 2],
    daily: { walk: 1, star: 1 },
    debt: 100,
  });
  assert.equal(s.toyBag[0], 1);
  assert.equal(s.daily.influence, 1);
  assert.equal(s.introSeen, true);
  assert.equal(E.debt(s), 100);
  E.normalize(s);
  assert.equal(E.debt(s), 100);
  assert.equal(s.gold, 321);
  assert.equal(s.version, 3);
});
test("catalog price multipliers, ten toys and house waking values", () => {
  assert.deepEqual(
    E.treats.map((x) => [x.cost, x.diamond]),
    [
      [400, 0],
      [1100, 0],
      [2200, 1],
    ],
  );
  assert.deepEqual(
    E.toys.slice(0, 3).map((x) => x.cost),
    [600, 840, 1080],
  );
  assert.equal(E.toys.length, 10);
  assert.equal(E.weapons.length, 10);
  assert.equal(E.armors.length, 10);
  const equipped = fresh({ weapon: 9, armor: 9 });
  assert.ok(E.stats(equipped).attack > E.stats(fresh()).attack);
  assert.ok(E.stats(equipped).hp > E.stats(fresh()).hp);
  assert.deepEqual(
    E.vehicles.map((x) => x.cost),
    [5000, 24000, 300000],
  );
  assert.equal(E.jobs[0].hire, 5500);
  assert.equal(E.buildings[0].cost, 18000);
  assert.equal(E.companies[0].cost, 900000);
  assert.equal(E.houses[1].cost, 3500);
  assert.deepEqual(
    E.houses.map((x) => x.wake),
    [-10, -5, 0, 3, 6, 9, 12],
  );
});
test("daily limits, exact owner energy and no recovery from hospital", () => {
  const s = fresh();
  assert.ok(E.consume(s, "dungeon", 1, 50));
  assert.equal(E.consume(s, "dungeon", 1, 50), false);
  assert.equal(s.energy, 50);
  assert.ok(E.startJob(s, 0));
  assert.equal(s.energy, 0);
  assert.ok(E.canAct(s));
  assert.equal(E.park(s), null);
  s.hospital = true;
  E.heal(s);
  assert.equal(s.energy, 0);
  E.nextDay(s);
  assert.equal(s.energy, 100);
  assert.equal(s.daily.dungeon, 0);
});
test("influencer entry cost is paid once in either order", () => {
  for (const order of [
    ["star", "live"],
    ["live", "star"],
  ]) {
    const s = fresh();
    assert.equal(E.influenceCost(s), 25);
    assert.ok(E.useInfluence(s, order[0]));
    assert.equal(s.energy, 75);
    assert.equal(E.influenceCost(s), 0);
    assert.ok(E.useInfluence(s, order[1]));
    assert.equal(s.energy, 75);
    assert.equal(E.useInfluence(s, "star"), false);
    assert.equal(E.useInfluence(s, "live"), false);
    E.nextDay(s);
    assert.equal(E.useInfluence(s, "live"), false);
    assert.ok(E.useInfluence(s, "star"));
    E.nextDay(s);
    E.nextDay(s);
    assert.ok(E.useInfluence(s, "live"));
  }
});
test("normalization does not replenish energy or treat shop stock", () => {
  const s = fresh({ energy: 12 });
  const stock = s.treatStock.slice();
  s.treatStock[0] = 0;
  for (let i = 0; i < 10; i++) E.normalize(s);
  assert.equal(s.energy, 12);
  assert.equal(s.treatStock[0], 0);
  E.nextDay(s);
  assert.ok(s.treatStock.every((n) => n >= 0 && n <= 2));
  assert.equal(s.energy, 100);
});
test("limited treat stock purchases are atomic and gifting/feed use separate caps", () => {
  const s = fresh({
    gold: 5000,
    diamonds: 5,
    romance: { kind: 0, stage: 0, affection: 0, since: 1 },
  });
  s.treatStock = [1, 0, 1];
  assert.equal(E.purchase(s, "treat", 1), false);
  assert.equal(s.gold, 5000);
  assert.ok(E.purchase(s, "treat", 0));
  assert.equal(E.purchase(s, "treat", 0), false);
  assert.equal(s.gold, 4600);
  assert.ok(E.feedTreat(s, 0));
  assert.ok(E.feedTreat(s, 0, true));
  assert.equal(E.feedTreat(s, 0), false);
  assert.equal(E.feedTreat(s, 0, true), false);
  assert.ok(s.romance.affection > 0);
  assert.equal(s.daily.feed, 1);
  assert.equal(s.daily.gift, 1);
});
test("toys cost resources, may be repurchased, and are consumed for affection only", () => {
  const s = fresh({
    gold: 10000,
    romance: { kind: 1, stage: 0, affection: 0, since: 1 },
  });
  assert.ok(E.purchase(s, "toy", 0));
  assert.ok(E.purchase(s, "toy", 0));
  assert.equal(s.toyBag[0], 2);
  const happy = s.happiness;
  assert.ok(E.giftToy(s, 0));
  assert.equal(s.happiness, happy);
  assert.equal(s.toyBag[0], 1);
  assert.equal(s.romance.affection, 0.2);
  assert.equal(E.giftToy(s, 0), false);
});
test("romance gates, exact diamond costs, no affection loss, permanent end stage", () => {
  const s = fresh({
    gold: 50000,
    diamonds: 30,
    romance: { kind: 0, stage: 0, affection: 0, since: 1 },
  });
  E.affection(s, 20);
  assert.equal(s.romance.affection, 3);
  assert.equal(E.confess(s, false, 0.8), false);
  assert.equal(s.diamonds, 29);
  assert.equal(s.romance.affection, 3);
  assert.equal(E.confess(s, false, 0.2), true);
  assert.equal(s.romance.affection, 3);
  E.affection(s, 20);
  assert.equal(s.romance.affection, 6);
  assert.equal(E.confess(s, true, 0.8), false);
  assert.equal(s.diamonds, 23);
  assert.equal(s.romance.affection, 6);
  assert.equal(E.confess(s, true, 0.2), true);
  assert.equal(s.diamonds, 18);
  assert.equal(s.romance.stage, 2);
  E.affection(s, 20);
  assert.equal(s.romance.stage, 3);
  s.candidate = 2;
  assert.equal(E.switchPartner(s), false);
  assert.equal(E.breakUp(s), false);
  assert.equal(E.meet(s, "walk", 0, 0), null);
  assert.ok(E.bonus(s) >= 0.3);
});
test("meeting chance by completed activity and partner switching resets affection", () => {
  for (const source of ["dungeon", "work", "live", "star"]) {
    const s = fresh();
    assert.equal(E.meet(s, source, 0.011), null);
    assert.ok(E.meet(s, source, 0.009, 0));
    assert.equal(s.romance.kind, 0);
  }
  const s = fresh();
  assert.equal(E.meet(s, "walk", 0.031), null);
  assert.ok(E.meet(s, "walk", 0.029, 0));
  s.romance.affection = 2;
  assert.ok(E.meet(s, "walk", 0, 0.99));
  assert.equal(s.candidate, 2);
  assert.ok(E.switchPartner(s));
  assert.equal(s.romance.affection, 0);
  assert.equal(s.romance.kind, 2);
  assert.ok(E.breakUp(s));
  assert.equal(s.romance, null);
});
test("work ten-level progression, house/car perks, free activities during work", () => {
  const s = fresh({ gold: 1e8, house: 3, vehicles: [0, 1, 2] });
  assert.ok(E.startJob(s, 0));
  assert.ok(E.canAct(s));
  assert.equal(E.vehicleBonus(s), 0.25);
  assert.equal(E.promote(s, 0), false);
  s.workDays[0] = 2;
  assert.ok(E.promote(s, 0));
  assert.equal(s.workLevels[0], 2);
  assert.equal(E.jobPay(s, 0), Math.floor(28 * 2 * 1.5 * 1.2 * 1.15 * 1.25));
  assert.ok(E.hire(s, 0));
  assert.ok(E.promote(s, 0, true));
  assert.equal(E.promote(s, 0, true), false);
  s.workLevels[0] = 10;
  for (let i = 2; i < 10; i++) assert.ok(E.promote(s, 0, true));
  assert.equal(s.staffLevels[0], 10);
  assert.equal(E.promote(s, 0, true), false);
  s.workLevels[0] = 10;
  assert.equal(E.promote(s, 0), false);
  const old = s.gold,
    pay = E.jobPay(s, 0) + E.jobPay(s, 0, true);
  E.nextDay(s);
  assert.equal(s.workDays[0], 3);
  assert.equal(s.gold, old + pay);
  assert.equal(s.daily.work, 0);
});
test("daily company stock, passive income, housing mood and visible deltas settle once", () => {
  const s = fresh({
    gold: 100,
    energy: 25,
    diamonds: 7,
    house: 4,
    companies: [0],
    buildings: [0],
    romance: { kind: 1, stage: 2, affection: 6, since: 1 },
  });
  E.nextDay(s);
  assert.equal(s.stocks[0], 1);
  assert.equal(s.gold, 100 + 110 + 45 + 20);
  assert.equal(s.happiness, 86);
  assert.deepEqual(s.lastDayDelta, {
    day: 2,
    gold: 175,
    netGold: 175,
    diamonds: 0,
    energy: 75,
    happiness: 6,
    fans: 0,
    affection: 0,
  });
  E.normalize(s);
  assert.equal(s.stocks[0], 1);
  E.nextDay(s);
  assert.equal(s.stocks[0], 2);
});
test("daily market ranges stay positive and within advertised bounds", () => {
  const s = fresh();
  for (let day = 0; day < 50; day++) {
    const before = structuredClone(s.market);
    E.nextDay(s);
    for (let i = 0; i < 10; i++) {
      const ratio = s.market.stock[i] / before.stock[i];
      assert.ok(ratio >= 0.7 - 1e-9 && ratio <= 1.3 + 1e-9);
    }
    for (let i = 0; i < 3; i++) {
      const ratio = s.market.coin[i] / before.coin[i];
      assert.ok(ratio >= 0.01 - 1e-9 && ratio <= 3 + 1e-9);
      assert.ok(s.market.coin[i] >= 1);
    }
  }
});
test("loan maturity allows negative balances; treatment never restores owner energy", () => {
  const s = fresh({ gold: 0, energy: 0 });
  assert.ok(E.takeLoan(s, 200));
  s.gold = 0;
  for (let i = 0; i < 5; i++) E.nextDay(s);
  assert.equal(s.gold, -220);
  s.hospital = true;
  s.energy = 0;
  const h = E.heal(s);
  assert.ok(h.borrow > 0);
  assert.equal(s.energy, 0);
  assert.equal(s.gold, 0);
  assert.equal(E.debt(s), h.borrow);
});
test("park removed the 20% guaranteed romance and keeps exact daily cost", () => {
  const s = fresh();
  const text = E.park(s, 0.6);
  assert.ok(text.includes("평범한"));
  assert.equal(s.diamonds, 1);
  assert.equal(s.daily.walk, 1);
  assert.equal(s.energy, 75);
  assert.equal(E.park(s, 0.1), null);
});
test("cross followers do not recurse", () => {
  const s = fresh();
  E.addFollowers(s, "star", 100);
  assert.equal(s.followers, 100);
  assert.equal(s.liveFollowers, 20);
  E.addFollowers(s, "live", 50);
  assert.equal(s.followers, 110);
  assert.equal(s.liveFollowers, 70);
});
test("roulette remains 15/15/1 with green 30x and slots expected return 88%", () => {
  const counts = { red: 0, black: 0, green: 0 };
  for (let i = 0; i < 31; i++) {
    const s = fresh({ gold: 1000 });
    const r = E.roulette(s, "green", 10, (i + 0.5) / 31);
    counts[r.color]++;
    if (r.color === "green") assert.equal(r.payout, 300);
  }
  assert.deepEqual(counts, { red: 15, black: 15, green: 1 });
  let total = 0;
  for (let a = 0; a < 5; a++)
    for (let b = 0; b < 5; b++)
      for (let c = 0; c < 5; c++)
        total += E.slot(fresh({ gold: 100 }), 100, [
          (a + 0.5) / 5,
          (b + 0.5) / 5,
          (c + 0.5) / 5,
        ]).payout;
  assert.equal(total / 125, 88);
});
test("partial survival rewards, casino unlock and replay protection", () => {
  const s = fresh({ energy: 100 });
  assert.ok(E.consume(s, "dungeon", 1, 50));
  s.expedition = { id: "a" };
  const r = E.settleSurvival(s, {
    id: "a",
    time: 65,
    kills: 20,
    bossKills: [0],
    won: false,
  });
  assert.ok(r.gold > 100);
  assert.ok(r.xp > 0);
  assert.equal(s.bossCleared, true);
  assert.equal(s.hospital, true);
  assert.equal(s.energy, 50);
  const gold = s.gold;
  assert.equal(
    E.settleSurvival(s, {
      id: "a",
      time: 65,
      kills: 20,
      bossKills: [0],
      won: false,
    }),
    null,
  );
  assert.equal(s.gold, gold);
});
test("survival boss clocks, upgrade pauses, evolution, dodge and death", () => {
  const a = new CatSurvival({ hp: 80, attack: 8, defense: 1 }, 0, 1, () => 0.5);
  a.time = 59.99;
  a.spawnClock = 99;
  a.update(0.02, {});
  assert.ok(a.midSpawned);
  assert.equal(a.finalSpawned, false);
  a.time = 179.99;
  a.update(0.02, {});
  assert.ok(a.finalSpawned);
  a.gainXP(100);
  const time = a.time;
  a.update(1, {});
  assert.equal(a.time, time);
  assert.equal(a.choice.length, 3);
  a.choose(0);
  a.weapons[0] = 5;
  a.passives.power = 3;
  assert.ok(a.evolved(0));
  a.choice = null;
  a.dodge();
  a.hit(1000);
  assert.equal(a.player.hp, 80);
  a.player.inv = 0;
  a.hit(1000);
  assert.ok(a.lost);
});
test("boss clock advances during hit-stop but stays paused during level choices", () => {
  const a = new CatSurvival({ hp: 80, attack: 8, defense: 1 }, 0, 1, () => 0.5);
  a.time = 179.99;
  a.hitStop = 1;
  a.update(0.02, {});
  assert.ok(a.finalSpawned);
  assert.ok(a.time >= 180);
  a.choice = a.options();
  const t = a.time;
  a.update(1, {});
  assert.equal(a.time, t);
});
function seeded(n) {
  return () => {
    n = (n * 1664525 + 1013904223) >>> 0;
    return n / 4294967296;
  };
}
test("all three maps run through 1-minute/3-minute boss events and clear by combat", () => {
  for (let map = 0; map < 3; map++) {
    const a = new CatSurvival(
      { hp: 700, attack: 25, defense: 10 },
      map,
      1,
      seeded(map + 1),
    );
    let frames = 0;
    while (!a.won && !a.lost && a.time < 260 && frames++ < 22000) {
      if (a.choice) {
        const preferred = a.choice.findIndex(
          (c) => c.kind === "weapon" && (c.id === 1 || c.id === 3),
        );
        a.choose(preferred < 0 ? 0 : preferred);
      }
      const p = a.player,
        angle = a.time * 0.06,
        target = {
          x: 1200 + Math.cos(angle) * 230,
          y: 900 + Math.sin(angle) * 230,
        };
      a.update(1 / 30, {
        right: p.x < target.x - 4,
        left: p.x > target.x + 4,
        down: p.y < target.y - 4,
        up: p.y > target.y + 4,
      });
    }
    assert.ok(a.midSpawned);
    assert.ok(a.finalSpawned);
    assert.ok(a.won, "map " + map);
    assert.ok(a.bossKills.length >= 2);
    assert.ok(a.kills > 100);
    assert.ok(a.level > 5);
  }
});
test("calendar, fame, mood and multiplicative bonuses", () => {
  assert.deepEqual(E.calendar(112), {
    year: 1,
    season: "WINTER",
    date: 28,
    weekday: "토",
  });
  assert.deepEqual(E.calendar(113), {
    year: 2,
    season: "SPRING",
    date: 1,
    weekday: "일",
  });
  const s = fresh({
    followers: 5000,
    happiness: 100,
    house: 2,
    romance: { stage: 1, kind: 0, affection: 3 },
  });
  assert.equal(E.fameBonus(s), 0.15);
  assert.ok(Math.abs(E.bonus(s) - (1.15 * 1.5 * 1.1 * 1.08 - 1)) < 1e-8);
  for (const [n, b] of [
    [100, 0.05],
    [1000, 0.1],
    [10000, 0.2],
    [30000, 0.25],
    [50000, 0.3],
    [100000, 0.5],
    [1000000, 1],
  ]) {
    s.followers = n;
    assert.equal(E.fameBonus(s), b);
  }
});
test("job gates, staff cap, price changes, drive gate and equipment ten levels", () => {
  const s = fresh({ gold: 1e8 });
  assert.equal(E.startJob(s, 1), false);
  assert.equal(E.hire(s, 1), false);
  s.workLevels[0] = 10;
  assert.ok(E.jobUnlocked(s, 1));
  assert.equal(E.promotion(fresh(), 0).cost, 1000);
  assert.equal(E.drive(s), null);
  s.vehicles = [0];
  assert.equal(E.drive(s), null);
  s.romance = { kind: 0, stage: 0, affection: 0 };
  assert.ok(E.drive(s));
  assert.equal(s.romance.affection, 0.1);
  s.weaponUp = 9;
  assert.ok(E.upgradeCost(s, "weapon") > 0);
  s.weaponUp = 10;
  assert.equal(E.upgradeCost(s, "weapon"), 0);
});
test("average cost, realized loss and automatic liquidation", () => {
  const s = fresh({ gold: 100000 });
  const p = E.price(s, "stock", 0);
  assert.ok(E.trade(s, "stock", 0, "buy", 2));
  s.market.stock[0] = p * 2;
  assert.ok(E.trade(s, "stock", 0, "buy", 2));
  assert.equal(s.costBasis.stock[0], p * 6);
  assert.ok(E.trade(s, "stock", 0, "sell", 1));
  assert.equal(s.costBasis.stock[0], p * 4.5);
  assert.equal(s.realized.stock, p * 2 * 0.96 - p * 1.5);
  s.market.stock[0] = 1;
  const report = [];
  E.liquidate(s, report);
  assert.equal(s.stocks[0], 0);
  assert.ok(report.length);
});
test("lifesteal only heals actual dealt damage and respects maximum health", () => {
  const a = new CatSurvival(
    { hp: 100, attack: 8, defense: 1 },
    0,
    1,
    () => 0.5,
  );
  a.player.hp = 50;
  a.passives.vamp = 1;
  const e = { hp: 10, x: 0, y: 0, boss: false, type: 0 };
  a.damage(e, 100);
  assert.equal(a.player.hp, 51);
  a.player.hp = 99;
  a.passives.vamp = 3;
  a.damage({ hp: 100, x: 0, y: 0 }, 100);
  assert.equal(a.player.hp, 100);
});
test("rain stays across reload, hospital mood30, and event choices settle once", () => {
  const s = fresh({ energy: 50, gold: 0 });
  s.weather = "rain";
  E.normalize(s);
  assert.equal(s.weather, "rain");
  s.event = { id: 7, resolved: false };
  assert.equal(E.resolveEvent(s, "pay"), false);
  assert.ok(E.resolveEvent(s, "fight"));
  assert.equal(s.energy, 0);
  assert.equal(E.resolveEvent(s, "fight"), false);
  s.hospital = true;
  E.heal(s);
  assert.equal(s.happiness, 30);
  assert.equal(s.energy, 0);
});

test("survival happiness threshold is enforced without spending failed entry resources", () => {
  const s = fresh({ happiness: 19 });
  assert.equal(E.consume(s, "dungeon", 1, 50), false);
  assert.equal(s.energy, 100);
  assert.equal(s.daily.dungeon, 0);
  s.happiness = 20;
  assert.ok(E.consume(s, "dungeon", 1, 50));
  assert.equal(s.energy, 50);
  assert.equal(s.daily.dungeon, 1);
});

console.log(`PASS ${count} v4 scenario groups`);
