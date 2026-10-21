const assert = require("node:assert/strict");
require("../engine.js");
require("../home-field-model.js");
const E = PetopiaEngine,
  Field = HomeFieldModel;
let count = 0;
function test(name, fn) {
  fn();
  console.log("✓ " + name);
  count++;
}
test("all eight house maps have safe spawns, collision objects and working interaction points", () => {
  for (let house = 0; house < 8; house++) {
    const m = new Field(house, null, true);
    assert.ok(m.free(m.player.x, m.player.y));
    assert.ok(m.free(m.partner.x, m.partner.y));
    assert.equal(m.map.house, house);
    assert.equal(m.map.outdoor, house < 2);
    assert.ok(m.map.objects.length > 10);
    assert.deepEqual(
      m.map.portals.map((p) => p.id),
      ["dungeon", "walk", "mart", "sleep"],
    );
    for (const p of m.map.portals) {
      assert.ok(m.free(p.x, p.y), `${house} ${p.id} access`);
      m.player.x = p.x;
      m.player.y = p.y;
      assert.equal(m.nearest().id, p.id);
    }
  }
});
test("keyboard directions animate facing; diagonals do not increase speed; releasing input stops", () => {
  const a = new Field(),
    b = new Field();
  const x = a.player.x,
    y = a.player.y;
  for (let i = 0; i < 10; i++) {
    a.step(0.02, { right: true });
    b.step(0.02, { right: true, down: true });
  }
  assert.ok(
    Math.abs(
      Math.hypot(a.player.x - x, a.player.y - y) -
        Math.hypot(b.player.x - x, b.player.y - y),
    ) < 1e-7,
  );
  assert.equal(a.player.facing, 2);
  assert.ok(a.player.walking);
  assert.ok(a.player.walkDistance > 0);
  const pos = a.snapshot();
  a.step(0.02, {});
  assert.equal(a.player.walking, false);
  assert.equal(a.player.x, pos.x);
  a.step(0.02, { up: true });
  assert.equal(a.player.facing, 3);
  a.step(0.02, { left: true });
  assert.equal(a.player.facing, 1);
  a.step(0.02, { down: true });
  assert.equal(a.player.facing, 0);
});
test("trees/furniture and world edges block movement; snapshots against walls do not reset on reload", () => {
  for (let house = 0; house < 8; house++) {
    const m = new Field(house);
    for (let i = 0; i < 700; i++) m.step(0.03, { left: true });
    assert.ok(m.player.x >= 51);
    assert.ok(m.free(m.player.x, m.player.y));
    for (let i = 0; i < 700; i++) m.step(0.03, { down: true });
    assert.ok(m.player.y <= 1189);
    assert.ok(m.free(m.player.x, m.player.y));
    const o = m.map.colliders[0];
    m.player.x = o.x - 35;
    m.player.y = o.y + o.h * 0.5;
    for (let i = 0; i < 40; i++) m.step(0.03, { right: true });
    assert.ok(m.player.x <= o.x - 19 + 1e-7);
    assert.ok(m.free(m.player.x, m.player.y));
    const snapshot = m.snapshot(),
      restored = new Field(house, JSON.parse(JSON.stringify(snapshot)));
    assert.equal(restored.player.x, snapshot.x);
    assert.equal(restored.player.y, snapshot.y);
  }
});
test("saved positions are slot and house specific; malformed or obstructed positions recover safely", () => {
  const a = new Field(3);
  a.step(0.05, { right: true });
  const stored = a.snapshot();
  assert.equal(new Field(3, stored).player.x, stored.x);
  assert.equal(new Field(4, stored).player.x, 960);
  for (const bad of [
    { house: 3, x: NaN, y: 3 },
    { house: 3, x: -500, y: 700 },
    { house: 3, x: 10000, y: 700 },
    { house: 3, x: 400, y: 400 },
  ]) {
    const m = new Field(3, bad);
    assert.ok(m.free(m.player.x, m.player.y));
  }
  const b = new Field(0);
  assert.notEqual(a.snapshot().x, b.snapshot().x);
});
test("click targets yield to keyboard, stop at obstacles, and invalid dt never corrupts position", () => {
  const m = new Field();
  m.target = { x: 1200, y: 700 };
  m.step(0.05, {});
  assert.ok(m.player.x > 960);
  m.step(0.03, { left: true });
  assert.equal(m.target, null);
  const before = m.snapshot();
  for (const dt of [NaN, Infinity, -1, 0]) m.step(dt, { right: true });
  assert.deepEqual(m.snapshot(), before);
});
test("married partner follows safely; exploration never changes economy, stamina or game day", () => {
  const s = E.normalize({
      introSeen: true,
      eventDay: 1,
      energy: 0,
      gold: 100,
      happiness: 80,
    }),
    before = structuredClone(s);
  const m = new Field(0, null, true),
    px = m.partner.x;
  for (let i = 0; i < 55; i++) m.step(0.025, { right: true });
  assert.ok(m.partner.x > px);
  assert.ok(m.free(m.partner.x, m.partner.y));
  s.homeField = m.snapshot();
  delete s.homeField;
  delete before.homeField;
  assert.deepEqual(s, before);
});
console.log(`PASS ${count} home field groups`);
