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
const advance = (s) => {
  s.energy = Math.min(s.energy, 25);
  return E.nextDay(s, () => 0.99);
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
  assert.equal(E.houses[1].cost, 5000);
  assert.deepEqual(
    E.houses.map((x) => x.wake),
    [-10, -5, 0, 3, 6, 9, 12, 15],
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
  advance(s);
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
    advance(s);
    assert.equal(E.useInfluence(s, "live"), false);
    assert.ok(E.useInfluence(s, "star"));
    advance(s);
    advance(s);
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
  advance(s);
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
test("all eligible completions meet only cheese at five percent, no duplicate partner", () => {
  for (const source of ["dungeon", "work", "live", "star", "walk"]) {
    const s = fresh();
    assert.equal(E.meet(s, source, 0.05), null);
    assert.ok(E.meet(s, source, 0.04999));
    assert.equal(s.romance.kind, 0);
    assert.equal(E.meet(s, source, 0), null);
    assert.equal(s.candidate, null);
    assert.ok(E.namePartner(s, "치즈"));
    assert.equal(E.partnerName(s), "치즈");
  }
});
test("work ten-level progression, house/car perks, free activities during work", () => {
  const s = fresh({ gold: 1e8, house: 3, vehicles: [0, 1, 2] });
  assert.ok(E.startJob(s, 0));
  assert.ok(E.canAct(s));
  assert.equal(E.vehicleBonus(s), 0.25);
  assert.equal(E.promote(s, 0), false);
  s.workDays[0] = 2;
  s.promotionDays[0] = 1;
  assert.ok(E.promote(s, 0));
  assert.equal(s.workLevels[0], 2);
  assert.equal(E.jobPay(s, 0), Math.floor(28 * 10 * 1.5 * 1.2 * 1.15 * 1.25));
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
  advance(s);
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
  advance(s);
  assert.equal(s.stocks[0], 5);
  assert.equal(s.gold, 100 + 9000 + 360 + 20);
  assert.equal(s.happiness, 86);
  assert.deepEqual(s.lastDayDelta, {
    day: 2,
    gold: 9380,
    netGold: 9380,
    diamonds: 0,
    energy: 75,
    happiness: 6,
    fans: 0,
    affection: 0,
  });
  E.normalize(s);
  assert.equal(s.stocks[0], 5);
  const expected =
    5 +
    Math.floor(
      ((E.companies[0].cost * 0.01) / E.price(s, "stock", 0)) * 100 + 1e-8,
    ) /
      100;
  advance(s);
  assert.ok(Math.abs(s.stocks[0] - expected) < 1e-8);
});
test("daily market ranges stay positive and within advertised bounds", () => {
  const s = fresh();
  for (let day = 0; day < 50; day++) {
    const before = structuredClone(s.market);
    const statuses = structuredClone(s.marketStatus);
    advance(s);
    for (let i = 0; i < 10; i++) {
      if (statuses.stock[i] || s.marketStatus.stock[i]) continue;
      const ratio = s.market.stock[i] / before.stock[i];
      assert.ok(
        ratio >= 0.7 - 0.5 / before.stock[i] - 1e-9 &&
          ratio <= 1.3 + 0.5 / before.stock[i] + 1e-9,
      );
    }
    for (let i = 0; i < 3; i++) {
      if (statuses.coin[i] || s.marketStatus.coin[i]) continue;
      const ratio = s.market.coin[i] / before.coin[i];
      assert.ok(
        ratio >= 0.01 - 0.5 / before.coin[i] - 1e-9 &&
          ratio <= 3 + 0.5 / before.coin[i] + 1e-9,
      );
      assert.ok(s.market.coin[i] >= 1);
    }
  }
});
test("loan maturity allows negative balances; treatment never restores owner energy", () => {
  const s = fresh({ gold: 0, energy: 0 });
  assert.ok(E.takeLoan(s, 100));
  s.gold = 0;
  for (let i = 0; i < 5; i++) advance(s);
  assert.equal(s.gold, -200);
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
  assert.ok(text.includes("공원산책"));
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
test("roulette remains 15/15/1 with green 30x and slots expected return 90%", () => {
  const counts = { red: 0, black: 0, green: 0 };
  for (let i = 0; i < 31; i++) {
    const s = fresh({ gold: 1000 });
    const r = E.roulette(s, "green", 10, (i + 0.5) / 31);
    counts[r.color]++;
    if (r.color === "green") assert.equal(r.payout, 300);
  }
  assert.deepEqual(counts, { red: 15, black: 15, green: 1 });
  let total = 0;
  for (let i = 0; i < 10000; i++)
    total += E.slot(fresh({ gold: 100 }), 100, [
      (i + 0.5) / 10000,
      0.5,
      0.5,
    ]).payout;
  assert.equal(total / 10000, 90);
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
  assert.equal(r.gold, 44);
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
  s.weapon = 1;
  s.weaponUp = 19;
  assert.ok(E.upgradeCost(s, "weapon") > 0);
  s.weaponUp = 20;
  assert.equal(E.upgradeCost(s, "weapon"), 0);
});
test("average cost, realized loss and automatic liquidation", () => {
  const s = fresh({ gold: 100000 });
  const p = E.price(s, "stock", 0);
  assert.ok(E.trade(s, "stock", 0, "buy", 2));
  s.market.stock[0] = p * 2;
  assert.ok(E.trade(s, "stock", 0, "buy", 2));
  assert.equal(s.costBasis.stock[0], p * 6 * 1.02);
  assert.ok(E.trade(s, "stock", 0, "sell", 1));
  assert.equal(s.costBasis.stock[0], p * 4.5 * 1.02);
  assert.equal(s.realized.stock, p * 2 * 0.98 - p * 1.5 * 1.02);
  s.market.stock[0] = 1;
  const report = [];
  E.liquidate(s, report);
  assert.equal(s.stocks[0], 3);
  advance(s);
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

test("bomb pickup clears nearby regular enemies, damages bosses and preserves distant targets", () => {
  const a = new CatSurvival(
    { hp: 100, attack: 8, defense: 1 },
    0,
    1,
    () => 0.5,
  );
  const make = (x, boss = false) => ({
    x,
    y: 900,
    hp: boss ? 1000 : 50.4,
    maxHP: boss ? 1000 : 50.4,
    type: 0,
    boss,
    bossId: 1,
    speed: 0,
    pattern: 99,
    contactCD: 99,
    flash: 0,
    windup: 0,
    charge: null,
  });
  a.enemies = [make(1250), make(1400, true), make(1600)];
  a.loot = [{ x: 1200, y: 900, kind: "bomb" }];
  a.spawnClock = 99;
  a.update(0.01, {});
  assert.equal(a.kills, 1);
  assert.equal(a.enemies.find((e) => e.boss).hp, 800);
  assert.equal(a.enemies.find((e) => e.x > 1500).hp, 50.4);
  assert.ok(a.effects.some((e) => e.kind === "explosion"));
  assert.ok(a.numbers.some((n) => n.text === "치즈폭탄!"));
  assert.equal(
    a.loot.some((e) => e.kind === "bomb"),
    false,
  );
  assert.ok(a.event.includes("폭탄"));
});
test("survival clear gold is reduced to twenty percent while XP and partner identity remain intact", () => {
  const s = fresh();
  s.expedition = { id: "clear" };
  const r = E.settleSurvival(s, {
    id: "clear",
    time: 180,
    kills: 100,
    bossKills: [1, 2],
    won: true,
  });
  assert.equal(r.gold, 210);
  assert.equal(r.xp, 452);
  assert.equal(E.partners.length, 1);
  assert.equal(E.partners[0].name, "치즈냥이");
});
test("global price crash halts trade, wipes next day, and relists exactly day three without restoring holdings", () => {
  for (const type of ["stock", "coin"])
    for (const low of [0, 1]) {
      const s = fresh({ gold: 100000, companies: type === "stock" ? [0] : [] });
      E.trade(s, type, 0, "buy", 2);
      const book = type === "stock" ? s.stocks : s.coinHoldings,
        cost = s.costBasis[type][0];
      s.market[type][0] = low;
      E.normalize(s);
      assert.equal(E.listing(s, type, 0).relistDay, 4);
      assert.equal(book[0], 2);
      for (let i = 0; i < 3; i++) E.normalize(s);
      assert.equal(E.listing(s, type, 0).crashedDay, 1);
      assert.equal(E.trade(s, type, 0, "sell", 1), false);
      assert.equal(E.trade(s, type, 0, "buy", 1), false);
      advance(s);
      assert.equal(book[0], 0);
      assert.equal(s.realized[type], -cost);
      assert.ok(s.dayReport.some((t) => t.includes("상장폐지")));
      advance(s);
      assert.equal(s.market[type][0], low);
      assert.equal(s.realized[type], -cost);
      advance(s);
      assert.equal(E.listing(s, type, 0), null);
      assert.equal(
        s.market[type][0],
        type === "stock" ? E.companies[0].stock : E.coins[0].base,
      );
      assert.equal(book[0], 0);
      assert.ok(E.trade(s, type, 0, "buy", 1));
    }
});
test("personal loss alone no longer delists an actively priced asset", () => {
  const s = fresh({
    stocks: { 0: 1 },
    costBasis: { stock: { 0: 100000 }, coin: {} },
  });
  s.market.stock[0] = 100;
  E.liquidate(s);
  assert.equal(s.stocks[0], 1);
  assert.equal(E.listing(s, "stock", 0), null);
});
test("a low-price stock can naturally reach one G through a rounded daily fall", () => {
  const s = fresh();
  s.market.stock[0] = 2;
  const original = Math.random;
  try {
    Math.random = () => 0;
    advance(s);
  } finally {
    Math.random = original;
  }
  assert.equal(s.market.stock[0], 1);
  assert.equal(E.listing(s, "stock", 0).crashedDay, 2);
  assert.equal(E.listing(s, "stock", 0).relistDay, 5);
});
test("nine buildings yield two percent, companies one percent, and sleep enforces energy threshold", () => {
  assert.equal(E.buildings.length, 9);
  assert.equal(Math.max(...E.buildings.map((b) => b.cost)), 1000000);
  for (const b of E.buildings) assert.equal(b.income, b.cost * 0.02);
  for (const c of E.companies) assert.equal(c.income, c.cost * 0.01);
  const s = fresh({ energy: 26 });
  assert.equal(E.nextDay(s), null);
  assert.equal(s.day, 1);
  assert.equal(s.energy, 26);
  s.energy = 25;
  assert.ok(E.nextDay(s, () => 0.99));
  assert.equal(s.day, 2);
  assert.equal(s.energy, 100);
  assert.equal(E.nextDay(s), null);
});
test("loan caps are halved; maturity charges fifty percent or one hundred once with no ongoing debt", () => {
  assert.equal(E.loanLimit(fresh()), 100);
  assert.equal(E.loanLimit(fresh({ level: 3 })), 250);
  const enough = fresh({ gold: 0 });
  assert.equal(E.takeLoan(enough, 101), false);
  assert.ok(E.takeLoan(enough, 100));
  enough.gold = 150;
  for (let i = 0; i < 5; i++) advance(enough);
  assert.equal(enough.gold, 0);
  assert.equal(enough.loans.length, 0);
  assert.ok(enough.dayReport.some((t) => t.includes("50%")));
  const short = fresh({ gold: 0 });
  E.takeLoan(short, 100);
  short.gold = 149;
  for (let i = 0; i < 5; i++) advance(short);
  assert.equal(short.gold, -51);
  assert.equal(short.loans.length, 0);
  assert.ok(short.dayReport.some((t) => t.includes("100%")));
  for (let i = 0; i < 10; i++) advance(short);
  assert.equal(short.gold, -51);
});
test("eight house tiers cap at one million and require diamonds for the last two without charging old ownership", () => {
  assert.deepEqual(
    E.houses.map((h) => h.cost),
    [0, 5000, 15000, 45000, 120000, 300000, 600000, 1000000],
  );
  assert.deepEqual(
    E.houses.map((h) => h.diamond),
    [0, 0, 0, 0, 0, 0, 30, 80],
  );
  const s = fresh({ gold: 1000000, diamonds: 79, houses: [0, 6] });
  assert.equal(E.purchase(s, "house", 7), false);
  assert.equal(s.gold, 1000000);
  assert.equal(s.diamonds, 79);
  s.diamonds = 80;
  assert.ok(E.purchase(s, "house", 7));
  assert.equal(s.gold, 0);
  assert.equal(s.diamonds, 0);
  assert.equal(s.house, 7);
  assert.ok(E.purchase(s, "house", 6));
  assert.equal(s.diamonds, 0);
});
console.log(`PASS ${count} v4 scenario groups`);
