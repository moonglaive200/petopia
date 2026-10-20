/* Three-minute survival simulation. Uses no DOM; the same rules drive browser and tests. */
const SURVIVAL_WEAPONS = [
  { name: "냥발톱", desc: "주변을 할퀴는 근접 광역", pair: "power" },
  {
    name: "날아라 생선",
    desc: "가까운 적에게 날리는 관통 생선",
    pair: "speed",
  },
  { name: "방울 충격파", desc: "넓게 퍼지는 원형 충격파", pair: "range" },
  { name: "공전 털실공", desc: "몸 주위를 도는 털실공", pair: "vamp" },
  { name: "레이저 눈빛", desc: "긴 직선으로 꿰뚫는 눈빛", pair: "magnet" },
  { name: "츄르 웅덩이", desc: "적 발밑에 남는 지속 피해", pair: "luck" },
];
const SURVIVAL_PASSIVES = [
  { id: "power", name: "맹수의 발톱", desc: "공격력 +20%" },
  { id: "range", name: "길어진 수염", desc: "공격 범위 +15%" },
  { id: "speed", name: "냥발 스텝", desc: "이동·공격 속도 +10%" },
  {
    id: "vamp",
    name: "흡혈 송곳니",
    desc: "준 피해의 10% 체력 흡수 · 최대 30%",
  },
  { id: "magnet", name: "집사의 부름", desc: "경험치 회수 범위 +40" },
  { id: "luck", name: "행운의 꼬리", desc: "치명타·필드 보상 확률 증가" },
];
const SURVIVAL_MONSTERS = [
  "말랑 슬라임",
  "밤의 박쥐",
  "먼지 요정",
  "화난 버섯",
  "택배 미믹",
  "불똥 딱정벌레",
  "유령냥",
  "돌골렘",
  "뼈다귀 도둑",
  "가시 털뭉치",
  "어둠의 집사",
  "꼬마 용",
];
class CatSurvival {
  constructor(stats, map = 0, day = 1, random = Math.random) {
    this.random = random;
    this.stats = stats;
    this.map = map;
    this.day = day;
    this.time = 0;
    this.world = { w: 2400, h: 1800 };
    this.player = {
      x: 1200,
      y: 900,
      hp: stats.hp,
      maxHP: stats.hp,
      inv: 0,
      dash: 0,
      dashCD: 0,
      dx: 1,
      dy: 0,
    };
    this.enemies = [];
    this.shots = [];
    this.gems = [];
    this.effects = [];
    this.zones = [];
    this.numbers = [];
    this.loot = [];
    this.weapons = [1, 0, 0, 0, 0, 0];
    this.cooldowns = [0, 0, 0, 0, 0, 0];
    this.passives = {
      power: 0,
      range: 0,
      speed: 0,
      vamp: 0,
      magnet: 0,
      luck: 0,
    };
    this.level = 1;
    this.xp = 0;
    this.kills = 0;
    this.bossKills = [];
    this.midSpawned = false;
    this.finalSpawned = false;
    this.won = false;
    this.lost = false;
    this.paused = false;
    this.choice = null;
    this.pendingLevels = 0;
    this.spawnClock = 0;
    this.hitStop = 0;
    this.lastHitStop = -1;
    this.shake = 0;
    this.event = "기본 무기 냥발톱으로 출발!";
    this.lastEvent = 0;
    this.hitSound = false;
    this.uid = 0;
    this.bonusGold = 0;
    this.moveDistance = 0;
    this.collectables = 0;
    this.id = null;
  }
  needed() {
    return 7 + this.level * 3;
  }
  evolved(i) {
    return this.weapons[i] >= 5 && this.passives[SURVIVAL_WEAPONS[i].pair] >= 3;
  }
  power(i) {
    return (
      (this.stats.attack + 3) *
      (1 + this.passives.power * 0.2) *
      (1 + (this.weapons[i] - 1) * 0.28) *
      (this.evolved(i) ? 1.9 : 1)
    );
  }
  damage(enemy, amount, kx = 0, ky = 0) {
    if (enemy.hp <= 0) return;
    const crit = this.random() < 0.05 + this.passives.luck * 0.06,
      damage = Math.max(1, Math.round(amount * (crit ? 1.7 : 1)));
    const actual = Math.min(enemy.hp, damage);
    enemy.hp = Math.max(0, enemy.hp - damage);
    if (this.passives.vamp)
      this.player.hp = Math.min(
        this.player.maxHP,
        this.player.hp + actual * this.passives.vamp * 0.1,
      );
    this.effects.push({
      kind: "spark",
      x: enemy.x,
      y: enemy.y,
      r: crit ? 28 : 18,
      angle: Math.atan2(ky, kx),
      life: 0.18,
      max: 0.18,
      color: crit ? "#ffe97b" : "#fff2ce",
    });
    enemy.flash = 0.12;
    const len = Math.hypot(kx, ky) || 1;
    enemy.x += (kx / len) * (enemy.boss ? 3 : 12);
    enemy.y += (ky / len) * (enemy.boss ? 3 : 12);
    this.numbers.push({
      x: enemy.x,
      y: enemy.y - 20,
      text: String(damage) + (crit ? "!" : ""),
      life: 0.55,
      crit,
    });
    if (this.time - this.lastHitStop > 0.1) {
      this.hitStop = Math.max(this.hitStop, 0.018);
      this.lastHitStop = this.time;
    }
    this.shake = Math.max(this.shake, crit ? 4 : 1.5);
    this.hitSound = true;
    if (enemy.hp === 0) this.kill(enemy);
  }
  kill(e) {
    this.kills++;
    this.effects.push({
      kind: "death",
      x: e.x,
      y: e.y,
      r: e.boss ? 65 : 22,
      life: 0.45,
      max: 0.45,
      color: e.boss ? "#e9ba67" : "#dfb87a",
    });
    this.gems.push({
      x: e.x,
      y: e.y,
      icon: Math.floor(this.random() * 6),
      value: e.boss ? 18 : 1 + (e.type % 3 === 0 ? 1 : 0),
    });
    if (e.boss) {
      this.bossKills.push(e.bossId);
      this.loot.push({ x: e.x + 22, y: e.y, kind: "chest" });
      this.event = e.name + " 격파!";
      if (e.final) {
        this.won = true;
        return;
      }
    } else if (this.random() < 0.025 + this.passives.luck * 0.009)
      this.loot.push({
        x: e.x,
        y: e.y,
        kind: ["coin", "magnet", "chest"][Math.floor(this.random() * 3)],
      });
    if (!this.discovered) this.discovered = [];
    if (!this.discovered.includes(e.type)) this.discovered.push(e.type);
  }
  hit(amount) {
    const p = this.player;
    if (p.inv > 0 || this.won || this.lost) return;
    const damage = Math.max(1, Math.round(amount - this.stats.defense));
    p.hp = Math.max(0, p.hp - damage);
    p.inv = 0.75;
    this.shake = 8;
    this.numbers.push({
      x: p.x,
      y: p.y - 32,
      text: "−" + damage,
      life: 0.7,
      hurt: true,
    });
    this.effects.push({
      kind: "hurt",
      x: p.x,
      y: p.y,
      r: 36,
      life: 0.2,
      max: 0.2,
      color: "#dc6e65",
    });
    if (!p.hp) this.lost = true;
  }
  dodge() {
    const p = this.player;
    if (this.paused || this.choice || p.dashCD > 0 || this.lost || this.won)
      return;
    p.dash = 0.18;
    p.inv = 0.32;
    p.dashCD = 2.5;
  }
  spawn(boss = false, final = false) {
    const p = this.player,
      a = this.random() * Math.PI * 2,
      dist = boss ? 310 : 440 + this.random() * 90,
      type = Math.min(
        11,
        Math.floor(
          this.random() * Math.min(12, 4 + this.time / 18 + this.map * 2),
        ),
      );
    const bossId = (this.day - 1 + this.map * 3 + (final ? 5 : 0)) % 10,
      b = PetopiaEngine.bosses[bossId];
    const hp = boss
      ? b.hp * (final ? 1.1 : 0.65) * (1 + this.map * 0.25)
      : 20 + type * 2 + this.time * 0.19 + this.map * 10;
    this.enemies.push({
      id: ++this.uid,
      x: Math.max(28, Math.min(2372, p.x + Math.cos(a) * dist)),
      y: Math.max(28, Math.min(1772, p.y + Math.sin(a) * dist)),
      hp,
      maxHP: hp,
      type,
      boss,
      final,
      bossId,
      name: boss ? b.name : SURVIVAL_MONSTERS[type],
      attack: boss ? 14 + this.map * 4 : 5 + type * 0.6 + this.map * 2,
      speed: boss ? 38 : type === 1 ? 92 : type === 7 ? 35 : 48 + type * 2,
      flash: 0,
      windup: 0,
      contactCD: 1,
      pattern: 2,
      patternIndex: 0,
      orbitCD: 0,
      charge: null,
    });
  }
  options() {
    const all = [];
    this.weapons.forEach((lv, i) => {
      if (lv < 5)
        all.push({
          kind: "weapon",
          id: i,
          name: SURVIVAL_WEAPONS[i].name,
          level: lv + 1,
          desc: SURVIVAL_WEAPONS[i].desc,
        });
    });
    for (const p of SURVIVAL_PASSIVES)
      if (this.passives[p.id] < 3)
        all.push({
          kind: "passive",
          id: p.id,
          name: p.name,
          level: this.passives[p.id] + 1,
          desc: p.desc,
        });
    if (!all.length)
      all.push({
        kind: "heal",
        id: "heal",
        name: "따끈한 낮잠",
        level: 1,
        desc: "전투 체력 20 회복 (주인 기력과 별개)",
      });
    const choices = [];
    while (choices.length < 3 && all.length) {
      const i = Math.floor(this.random() * all.length);
      choices.push(all.splice(i, 1)[0]);
    }
    return choices;
  }
  choose(index) {
    if (!this.choice || !this.choice[index]) return false;
    const c = this.choice[index];
    if (c.kind === "weapon") this.weapons[c.id]++;
    else if (c.kind === "passive") this.passives[c.id]++;
    else this.player.hp = Math.min(this.player.maxHP, this.player.hp + 20);
    this.pendingLevels--;
    this.choice = this.pendingLevels > 0 ? this.options() : null;
    for (let i = 0; i < 6; i++)
      if (this.evolved(i)) this.event = SURVIVAL_WEAPONS[i].name + " 진화!";
    return true;
  }
  gainXP(amount) {
    this.xp += amount;
    while (this.xp >= this.needed()) {
      this.xp -= this.needed();
      this.level++;
      this.pendingLevels++;
    }
    if (this.pendingLevels && !this.choice) this.choice = this.options();
  }
  attack(i) {
    const p = this.player,
      lv = this.weapons[i],
      range = 1 + this.passives.range * 0.15,
      power = this.power(i),
      targets = this.enemies.filter((e) => e.hp > 0),
      nearest = targets.reduce(
        (best, e) =>
          !best ||
          Math.hypot(e.x - p.x, e.y - p.y) <
            Math.hypot(best.x - p.x, best.y - p.y)
            ? e
            : best,
        null,
      );
    if (!nearest) return;
    const angle = Math.atan2(nearest.y - p.y, nearest.x - p.x),
      evolved = this.evolved(i);
    if (i === 0 || i === 2) {
      const radius = (i === 0 ? 90 : 150) * range * (evolved ? 1.3 : 1);
      for (const e of targets)
        if (Math.hypot(e.x - p.x, e.y - p.y) < radius)
          this.damage(e, power * (i === 0 ? 1 : 0.75), e.x - p.x, e.y - p.y);
      this.effects.push({
        kind: i === 0 ? "slash" : "ring",
        x: p.x,
        y: p.y,
        r: radius,
        life: 0.23,
        max: 0.23,
        color: evolved ? "#ffd777" : i === 0 ? "#fff1c4" : "#98dce3",
        angle,
      });
    }
    if (i === 1) {
      for (let n = 0; n < 1 + Math.floor(lv / 2); n++) {
        const a = angle + (n - Math.floor(lv / 2) / 2) * 0.18;
        this.shots.push({
          x: p.x,
          y: p.y,
          dx: Math.cos(a),
          dy: Math.sin(a),
          speed: 420,
          life: 1.8,
          damage: power,
          pierce: 1 + Math.floor(lv / 2),
          hitIds: [],
          friendly: true,
          kind: "fish",
        });
      }
    }
    if (i === 4) {
      const length = 370 * range,
        dx = Math.cos(angle),
        dy = Math.sin(angle);
      for (const e of targets) {
        const ex = e.x - p.x,
          ey = e.y - p.y,
          dot = ex * dx + ey * dy,
          perp = Math.abs(ex * dy - ey * dx);
        if (dot > 0 && dot < length && perp < 24) this.damage(e, power * 1.6);
      }
      this.effects.push({
        kind: "beam",
        x: p.x,
        y: p.y,
        r: length,
        angle,
        life: 0.2,
        max: 0.2,
        color: evolved ? "#ffe579" : "#e7a3c8",
      });
    }
    if (i === 5)
      this.zones.push({
        friendly: true,
        x: nearest.x,
        y: nearest.y,
        r: (55 + lv * 8) * range,
        life: 3,
        warn: 0,
        tick: 0,
        damage: power * 0.35,
      });
  }
  bossPattern(e) {
    const p = this.player,
      a = Math.atan2(p.y - e.y, p.x - e.x),
      phase = e.hp < e.maxHP / 2,
      pattern = PetopiaEngine.bosses[e.bossId].pattern;
    this.event =
      e.name +
      " · " +
      ["카드 탄막", "돌진 예고", "위험 장판", "나선 탄막", "회복과 추적"][
        pattern
      ];
    e.patternIndex++;
    e.pattern = phase ? 2.6 : 3.6;
    if (pattern === 0 || pattern === 3) {
      const count = phase ? 9 : 5;
      for (let i = 0; i < count; i++) {
        const angle =
          pattern === 3
            ? (i / count) * Math.PI * 2 + this.time
            : a + (i - (count - 1) / 2) * 0.22;
        this.shots.push({
          x: e.x,
          y: e.y,
          dx: Math.cos(angle),
          dy: Math.sin(angle),
          speed: phase ? 205 : 155,
          life: 5,
          delay: 0.7,
          friendly: false,
          damage: e.attack,
        });
      }
    }
    if (pattern === 1) {
      const d = Math.hypot(p.x - e.x, p.y - e.y) || 1;
      this.zones.push({
        kind: "charge",
        enemy: e,
        x: e.x,
        y: e.y,
        dx: (p.x - e.x) / d,
        dy: (p.y - e.y) / d,
        warn: 0.9,
        life: 0.6,
        friendly: false,
      });
    }
    if (pattern === 2 || pattern === 4) {
      for (let i = 0; i < (phase ? 4 : 2); i++)
        this.zones.push({
          x: i === 0 ? p.x : p.x + (this.random() - 0.5) * 400,
          y: i === 0 ? p.y : p.y + (this.random() - 0.5) * 300,
          r: 65,
          warn: 0.9,
          life: 1,
          friendly: false,
          damage: e.attack + 5,
        });
      if (pattern === 4) {
        e.hp = Math.min(e.maxHP, e.hp + e.maxHP * 0.025);
        this.effects.push({
          kind: "ring",
          x: e.x,
          y: e.y,
          r: 65,
          life: 0.5,
          max: 0.5,
          color: "#9ee1a2",
        });
      }
    }
  }
  update(dt, input = {}) {
    if (this.paused || this.choice || this.won || this.lost) return;
    this.time += dt;
    if (this.time >= 60 && !this.midSpawned) {
      this.midSpawned = true;
      this.spawn(true, false);
      this.event = "01:00 중간 보스 등장!";
    }
    if (this.time >= 180 && !this.finalSpawned) {
      this.finalSpawned = true;
      this.spawn(true, true);
      this.event = "03:00 최종 보스 등장!";
    }
    if (this.hitStop > 0) {
      this.hitStop -= dt;
      return;
    }
    const p = this.player;
    for (const k of ["inv", "dash", "dashCD"]) p[k] = Math.max(0, p[k] - dt);
    this.shake = Math.max(0, this.shake - dt * 28);
    let dx = (input.right ? 1 : 0) - (input.left ? 1 : 0),
      dy = (input.down ? 1 : 0) - (input.up ? 1 : 0),
      len = Math.hypot(dx, dy);
    if (len) {
      dx /= len;
      dy /= len;
      p.dx = dx;
      p.dy = dy;
    }
    if (input.dodge) this.dodge();
    if (p.dash > 0) {
      dx = p.dx;
      dy = p.dy;
      len = 1;
    }
    if (len) {
      const speed = p.dash > 0 ? 500 : 170 * (1 + this.passives.speed * 0.1);
      p.x = Math.max(24, Math.min(2376, p.x + dx * speed * dt));
      p.y = Math.max(24, Math.min(1776, p.y + dy * speed * dt));
      this.moveDistance += speed * dt;
    }
    this.spawnClock -= dt;
    if (this.spawnClock <= 0 && this.enemies.length < 100) {
      const count = 1 + Math.floor(this.time / 45) + this.map;
      for (let i = 0; i < count; i++) this.spawn();
      this.spawnClock = Math.max(0.35, 1.2 - this.time / 240);
    }
    if (this.time - this.lastEvent >= 40) {
      this.lastEvent = this.time;
      this.event = [
        "박쥐 러시!",
        "바닥의 아이템 경험치를 모아 성장하자!",
        "장판을 피해 돌아가자!",
      ][Math.floor(this.time / 40) % 3];
      if (Math.floor(this.time / 40) % 2 === 1)
        for (let i = 0; i < 6; i++) {
          this.spawn();
          this.enemies[this.enemies.length - 1].type = 1;
        }
    }
    for (let i = 0; i < 6; i++) {
      if (!this.weapons[i] || i === 3) continue;
      this.cooldowns[i] -= dt;
      if (this.cooldowns[i] <= 0) {
        this.attack(i);
        this.cooldowns[i] =
          [0.7, 0.9, 2.3, 0, 1.9, 2.2][i] / (1 + this.passives.speed * 0.1);
      }
    }
    for (const e of this.enemies) {
      if (e.hp <= 0) continue;
      e.flash = Math.max(0, e.flash - dt);
      e.orbitCD -= dt;
      e.contactCD -= dt;
      const ex = p.x - e.x,
        ey = p.y - e.y,
        dist = Math.hypot(ex, ey) || 1;
      if (e.charge) {
        e.charge.life -= dt;
        e.x += e.charge.dx * dt * 440;
        e.y += e.charge.dy * dt * 440;
        if (e.charge.life <= 0) e.charge = null;
      } else if (e.windup > 0) {
        e.windup -= dt;
        if (e.windup <= 0 && dist < (e.boss ? 65 : 35)) this.hit(e.attack);
      } else if (dist > 25) {
        e.x += (ex / dist) * e.speed * dt;
        e.y += (ey / dist) * e.speed * dt;
      } else if (e.contactCD <= 0) {
        e.windup = 0.3;
        e.contactCD = 0.9;
      }
      e.x = Math.max(20, Math.min(2380, e.x));
      e.y = Math.max(20, Math.min(1780, e.y));
      if (e.charge && dist < 45) this.hit(e.attack + 4);
      if (e.boss) {
        e.pattern -= dt;
        if (e.pattern <= 0) this.bossPattern(e);
      } else if (
        [4, 10, 11].includes(e.type) &&
        e.contactCD < 0 &&
        dist > 110
      ) {
        this.shots.push({
          x: e.x,
          y: e.y,
          dx: ex / dist,
          dy: ey / dist,
          speed: 130,
          life: 4,
          friendly: false,
          damage: e.attack,
          delay: 0.35,
        });
        e.contactCD = 3;
      }
      if (this.weapons[3] && e.orbitCD <= 0) {
        const count = 2 + Math.floor(this.weapons[3] / 2);
        for (let i = 0; i < count; i++) {
          const a = this.time * 2.5 + (i / count) * Math.PI * 2,
            ox = p.x + Math.cos(a) * 85,
            oy = p.y + Math.sin(a) * 85;
          if (Math.hypot(e.x - ox, e.y - oy) < 25) {
            this.damage(e, this.power(3) * 0.6, e.x - p.x, e.y - p.y);
            e.orbitCD = 0.45;
            break;
          }
        }
      }
    }
    for (const shot of this.shots) {
      if (shot.delay > 0) {
        shot.delay -= dt;
        continue;
      }
      shot.x += shot.dx * shot.speed * dt;
      shot.y += shot.dy * shot.speed * dt;
      shot.life -= dt;
      if (shot.friendly) {
        for (const e of this.enemies)
          if (
            e.hp > 0 &&
            !shot.hitIds.includes(e.id) &&
            Math.hypot(e.x - shot.x, e.y - shot.y) < (e.boss ? 32 : 22)
          ) {
            this.damage(e, shot.damage, shot.dx, shot.dy);
            shot.hitIds.push(e.id);
            if (--shot.pierce <= 0) {
              shot.life = 0;
              break;
            }
          }
      } else if (Math.hypot(shot.x - p.x, shot.y - p.y) < 20) {
        this.hit(shot.damage);
        shot.life = 0;
      }
    }
    this.shots = this.shots.filter((s) => s.life > 0);
    for (const z of this.zones) {
      if (z.warn > 0) {
        z.warn -= dt;
        if (z.warn <= 0 && z.kind === "charge")
          z.enemy.charge = { dx: z.dx, dy: z.dy, life: 0.65 };
      } else {
        z.life -= dt;
        if (z.friendly) {
          z.tick -= dt;
          if (z.tick <= 0) {
            z.tick = 0.5;
            for (const e of this.enemies)
              if (e.hp > 0 && Math.hypot(e.x - z.x, e.y - z.y) < z.r)
                this.damage(e, z.damage);
          }
        } else if (
          z.kind !== "charge" &&
          Math.hypot(p.x - z.x, p.y - z.y) < z.r
        )
          this.hit(z.damage);
      }
    }
    this.zones = this.zones.filter((z) => z.life > 0);
    const pickup = 65 + this.passives.magnet * 40;
    for (const g of this.gems) {
      const d = Math.hypot(g.x - p.x, g.y - p.y);
      if (d < pickup) {
        const speed = 250 * dt;
        g.x += ((p.x - g.x) / (d || 1)) * Math.min(speed, d);
        g.y += ((p.y - g.y) / (d || 1)) * Math.min(speed, d);
      }
      if (d < 24) {
        this.gainXP(g.value);
        g.collected = true;
      }
    }
    this.gems = this.gems.filter((g) => !g.collected);
    if (this.gems.length > 450) this.gems.splice(0, this.gems.length - 450);
    for (const item of this.loot)
      if (Math.hypot(item.x - p.x, item.y - p.y) < 32) {
        item.collected = true;
        this.collectables++;
        if (item.kind === "magnet")
          for (const g of this.gems) {
            g.x = p.x;
            g.y = p.y;
          }
        else if (item.kind === "coin") this.bonusGold += 15;
        else {
          this.gainXP(8);
          p.hp = Math.min(p.maxHP, p.hp + 10);
          this.bonusGold += 20;
          this.event = "상자! 경험치 +8 · 전투 체력 +10";
        }
      }
    this.loot = this.loot.filter((i) => !i.collected);
    this.enemies = this.enemies.filter(
      (e) => e.hp > 0 && (e.boss || Math.hypot(e.x - p.x, e.y - p.y) < 950),
    );
    for (const n of this.numbers) {
      n.life -= dt;
      n.y -= dt * 25;
    }
    this.numbers = this.numbers.filter((n) => n.life > 0).slice(-60);
    for (const e of this.effects) e.life -= dt;
    this.effects = this.effects.filter((e) => e.life > 0);
  }
  snapshot() {
    return {
      id: this.id,
      time: this.time,
      kills: this.kills,
      bossKills: [...this.bossKills],
      won: this.won,
      bonusGold: this.bonusGold,
      discovered: this.discovered || [],
    };
  }
}
globalThis.CatSurvival = CatSurvival;
function startSurvival(map = 0) {
  if (!Number.isInteger(map) || map < 0 || map > 2) return;
  const s = player();
  if (!E.consume(s, "dungeon", 1, 50)) return;
  const arena = new CatSurvival(E.stats(s), map, s.day);
  arena.id = crypto.randomUUID();
  s.expedition = arena.snapshot();
  save();
  gameShell(
    `${title("CAT SURVIVAL", ["햇살 공원", "버려진 펫마트", "네온 뒷골목"][map])}<div class="survival-hud"><strong id="runTime">00:00</strong><div class="hero-health"><span id="runHP"></span><progress id="heroHP" max="100" value="100"></progress></div><span id="runKills"></span><button class="text-button" id="pauseSurvival">일시정지 P</button></div><progress id="runXP" value="0" max="10" aria-label="판 안의 경험치"></progress><div class="action-wrap"><canvas id="survivalCanvas" width="860" height="500" tabindex="0" aria-label="WASD로 움직이는 냥서바이벌"></canvas><div id="survivalOverlay" hidden></div></div><div class="boss-run-bars" id="bossBars"></div><div class="run-build" id="runBuild"></div><div class="action-controls"><div class="dpad"><button data-move="up">↑</button><button data-move="left">←</button><button data-move="down">↓</button><button data-move="right">→</button></div><span>자동 공격 · WASD 이동</span><button class="btn" id="survivalDodge">회피 · Space</button></div><p class="game-notice" id="runEvent">01:00 중간 보스 · 03:00 최종 보스 · 최종 보스 처치 시 클리어</p><details><summary>진화 조합 보기</summary><p>무기 5단계 + 연결된 보조 능력 3단계</p>${SURVIVAL_WEAPONS.map((w) => `<p>${w.name} + ${SURVIVAL_PASSIVES.find((p) => p.id === w.pair).name}</p>`).join("")}</details>`,
    renderDungeons,
  );
  activeActivity = true;
  const canvas = document.getElementById("survivalCanvas"),
    ctx = canvas.getContext("2d"),
    overlay = document.getElementById("survivalOverlay"),
    keys = {};
  let raf,
    last = 0,
    settled = false,
    overlayState = "",
    snapshotAt = 0,
    lastSound = 0,
    touch = null;
  function finish(retreat = false) {
    if (settled) return;
    settled = true;
    const result = E.settleSurvival(s, { ...arena.snapshot(), retreat });
    save();
    activeActivity = false;
    playEffect(arena.won ? "victory" : "sad");
    if (retreat) return;
    overlay.hidden = false;
    overlay.innerHTML = `<h2>${arena.won ? "냥서바이벌 클리어!" : "춘배, 오늘도 열심히 살았다."}</h2><p>${Math.floor(arena.time)}초 생존 · ${arena.kills}마리 처치 · 보스 ${arena.bossKills.length}마리</p><p>금화 +${result?.gold || 0} G · 경험치 +${result?.xp || 0}${arena.won ? " · 클리어 추가 보상 포함" : ""}</p>${result?.encounter ? `<p>${result.encounter}</p>` : ""}<button class="btn primary" id="runExit">${arena.won ? "춘배의 방으로" : "펫병원으로"}</button>`;
    document.getElementById("runExit").onclick = () =>
      arena.won ? renderHome() : renderHospital();
    document.getElementById("survivalDodge").disabled = true;
  }
  function pause(value) {
    if (settled) return;
    arena.paused = value;
    for (const k of Object.keys(keys)) keys[k] = false;
    overlayState = "";
    renderOverlay();
  }
  function renderOverlay() {
    if (settled) return;
    if (arena.choice) {
      const key = "choice" + arena.level + arena.pendingLevels;
      if (overlayState === key) return;
      overlayState = key;
      overlay.hidden = false;
      overlay.innerHTML = `<h2>LEVEL ${arena.level}!</h2><p>능력 하나를 골라 줘. 선택 중에는 시간이 멈춰.</p><div class="upgrade-choices">${arena.choice.map((c, i) => `<button class="btn augment-${c.kind === "weapon" ? "weapon" : c.id}" data-run-upgrade="${i}"><span class="augment-icon">${survivalIcon(c.kind === "weapon" ? c.id : c.id)}</span><em>${c.kind === "weapon" ? "무기" : "능력 강화"}</em><strong>${i + 1}. ${c.name} LV.${c.level}</strong><small>${c.desc}</small></button>`).join("")}</div>`;
      bind("run-upgrade", (i) => {
        arena.choose(Number(i));
        overlayState = "";
        renderOverlay();
      });
      return;
    }
    if (arena.paused) {
      if (overlayState === "pause") return;
      overlayState = "pause";
      overlay.hidden = false;
      overlay.innerHTML =
        '<h2>잠깐 쉬는 중</h2><button class="btn primary" id="resumeSurvival">계속하기</button>';
      document.getElementById("resumeSurvival").onclick = () => pause(false);
      return;
    }
    overlay.hidden = true;
    overlayState = "";
  }
  function drawEnemy(e, camX, camY) {
    const x = e.x - camX,
      y = e.y - camY;
    if (x < -80 || x > 940 || y < -100 || y > 600) return;
    const phase = arena.time * (e.type === 1 ? 12 : 7) + e.id,
      bob = Math.sin(phase) * (e.boss ? 2 : 3),
      size = e.boss ? 100 : 48;
    ctx.save();
    ctx.translate(x, y + bob);
    ctx.fillStyle = "#31251e33";
    ctx.beginPath();
    ctx.ellipse(0, 15, size * 0.28, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    const img = spriteImages.monsters,
      type = e.boss ? [10, 4, 2, 1, 4, 6, 5, 8, 10, 11][e.bossId] : e.type;
    if (img.complete && img.naturalWidth) {
      const sw = img.width / 4,
        sh = img.height / 3;
      ctx.imageSmoothingEnabled = false;
      if (e.flash > 0) ctx.filter = "brightness(3)";
      ctx.drawImage(
        img,
        (type % 4) * sw,
        Math.floor(type / 4) * sh,
        sw,
        sh,
        -size / 2,
        -size / 2,
        size,
        size,
      );
      ctx.filter = "none";
    }
    if (e.boss) {
      ctx.fillStyle = "#f3cd70";
      ctx.font = "bold 14px Neo,monospace";
      ctx.textAlign = "center";
      ctx.fillText(e.name + (e.final ? " (최종보스)" : ""), 0, -size / 2 - 12);
      ctx.fillText("♛", 0, -size / 2 + 2);
    } else {
      ctx.fillStyle = "#563f37";
      ctx.fillRect(-20, -29, 40, 4);
      ctx.fillStyle = "#d47c65";
      ctx.fillRect(-20, -29, (40 * e.hp) / e.maxHP, 4);
    }
    if (e.windup > 0) {
      ctx.strokeStyle = "#e2634b";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, e.boss ? 50 : 30, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }
  function draw() {
    const p = arena.player,
      camX = Math.max(0, Math.min(1540, p.x - 430)),
      camY = Math.max(0, Math.min(1300, p.y - 250));
    ctx.save();
    const shake = motion ? arena.shake : 0;
    ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
    const palettes = [
        ["#b8bb83", "#a9ad76", "#879d69"],
        ["#b8a17f", "#aa9273", "#867559"],
        ["#343346", "#39394e", "#4b4a62"],
      ],
      pal = palettes[map];
    ctx.fillStyle = pal[0];
    ctx.fillRect(0, 0, 860, 500);
    for (let y = Math.floor(camY / 64) * 64; y < camY + 564; y += 64)
      for (let x = Math.floor(camX / 64) * 64; x < camX + 924; x += 64) {
        ctx.fillStyle = (x + y) % 128 ? pal[0] : pal[1];
        ctx.fillRect(x - camX, y - camY, 63, 63);
        if (map === 0) {
          ctx.fillStyle = pal[2];
          ctx.fillRect(x - camX + 14, y - camY + 25, 3, 6);
          ctx.fillRect(x - camX + 18, y - camY + 22, 3, 8);
        } else if (map === 2) {
          ctx.fillStyle = "#6d6784";
          ctx.fillRect(x - camX, y - camY, 63, 1);
        }
      }
    // Deterministic scenery lives in world coordinates and never blocks combat.
    for (let gy = Math.floor(camY / 240) * 240; gy < camY + 740; gy += 240)
      for (let gx = Math.floor(camX / 240) * 240; gx < camX + 1100; gx += 240) {
        const seed = Math.abs(Math.sin(gx * 0.017 + gy * 0.031));
        if (seed < 0.48) continue;
        const x = gx - camX + 60,
          y = gy - camY + 90;
        ctx.save();
        ctx.globalAlpha = 0.58;
        if (map === 0) {
          ctx.fillStyle = "#6c855e";
          ctx.fillRect(x - 20, y - 8, 40, 14);
          ctx.fillStyle = "#8ba16a";
          ctx.fillRect(x - 25, y - 22, 50, 19);
          ctx.fillRect(x - 15, y - 29, 30, 14);
          ctx.fillStyle = "#e8d693";
          for (let i = 0; i < 3; i++)
            ctx.fillRect(x - 13 + i * 12, y - 17, 3, 3);
        } else if (map === 1) {
          ctx.fillStyle = "#685747";
          ctx.fillRect(x - 24, y - 20, 48, 32);
          ctx.fillStyle = "#c0a077";
          ctx.fillRect(x - 26, y - 23, 52, 5);
          ctx.fillRect(x - 26, y + 9, 52, 5);
          for (let i = 0; i < 4; i++) {
            ctx.fillStyle = ["#c89f7d", "#9ca68b", "#baa2ab"][i % 3];
            ctx.fillRect(x - 20 + i * 12, y - 14, 9, 18);
          }
        } else {
          ctx.fillStyle = "#252d42";
          ctx.fillRect(x - 25, y - 25, 50, 38);
          ctx.strokeStyle = "#d47faf";
          ctx.lineWidth = 2;
          ctx.strokeRect(x - 25, y - 25, 50, 38);
          ctx.fillStyle = "#9bd9e0";
          ctx.font = "12px Neo";
          ctx.textAlign = "center";
          ctx.fillText("MEOW", x, y - 6);
          ctx.fillStyle = "#b47fbc";
          ctx.fillRect(x - 15, y + 4, 30, 2);
        }
        ctx.restore();
      }
    const shade = ctx.createRadialGradient(430, 250, 160, 430, 250, 570);
    shade.addColorStop(0, "#00000000");
    shade.addColorStop(1, map === 2 ? "#14152e77" : "#28342433");
    ctx.fillStyle = shade;
    ctx.fillRect(0, 0, 860, 500);
    ctx.strokeStyle = map === 2 ? "#b38bc2" : "#6f7751";
    ctx.lineWidth = 12;
    ctx.strokeRect(-camX, -camY, 2400, 1800);
    for (const z of arena.zones) {
      ctx.save();
      ctx.translate(z.x - camX, z.y - camY);
      ctx.fillStyle = z.friendly
        ? "#d9a3c355"
        : z.warn > 0
          ? "#e9a15055"
          : "#e964555f";
      ctx.strokeStyle = z.friendly
        ? "#efbfdd"
        : z.warn > 0
          ? "#ffe2a0"
          : "#ff6c60";
      ctx.lineWidth = 3;
      if (z.kind === "charge") {
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(z.dx * 550, z.dy * 550);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, z.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
      if (z.friendly) {
        ctx.fillStyle = "#ffd4ab";
        for (let i = 0; i < 7; i++) {
          const a = i * 2.4 + arena.time;
          ctx.beginPath();
          ctx.arc(
            Math.cos(a) * z.r * 0.6,
            Math.sin(a) * z.r * 0.6,
            3 + Math.sin(a) * 2,
            0,
            Math.PI * 2,
          );
          ctx.fill();
        }
        drawItem(ctx, 0, 0, 26, 5, arena.time);
      }
      ctx.restore();
    }
    for (const g of arena.gems) {
      const x = g.x - camX,
        y = g.y - camY;
      drawItem(ctx, x, y, 20, g.icon || 0, arena.time);
    }
    for (const l of arena.loot) {
      const x = l.x - camX,
        y = l.y - camY;
      drawItem(ctx, x, y, 32, l.kind, arena.time);
    }
    arena.enemies.forEach((e) => drawEnemy(e, camX, camY));
    const px = p.x - camX,
      py = p.y - camY,
      emotion = arena.lost
        ? "sad"
        : p.inv > 0
          ? "surprise"
          : arena.won
            ? "happy"
            : "normal";
    ctx.save();
    ctx.globalAlpha =
      p.inv > 0 && Math.floor(arena.time * 15) % 2 === 0 ? 0.45 : 1;
    drawPortrait(
      ctx,
      px,
      py + (motion ? Math.sin(arena.time * 9) * 1.3 : 0),
      86,
      emotion,
    );
    ctx.restore();
    if (arena.weapons[3]) {
      const n = 2 + Math.floor(arena.weapons[3] / 2);
      for (let i = 0; i < n; i++) {
        const a = arena.time * 2.5 + (i / n) * Math.PI * 2;
        const ox = px + Math.cos(a) * 85,
          oy = py + Math.sin(a) * 85;
        ctx.save();
        ctx.strokeStyle = "#e9a4d466";
        ctx.lineWidth = 12;
        ctx.beginPath();
        ctx.arc(px, py, 85, a - 0.6, a);
        ctx.stroke();
        ctx.restore();
        drawItem(ctx, ox, oy, 28, 3, arena.time, false);
      }
    }
    for (const b of arena.shots) {
      const x = b.x - camX,
        y = b.y - camY;
      if (b.delay > 0) {
        ctx.strokeStyle = "#ecb26e99";
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + b.dx * 40, y + b.dy * 40);
        ctx.stroke();
        continue;
      }
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(Math.atan2(b.dy, b.dx));
      ctx.fillStyle = b.friendly ? "#a5e4e4" : "#edacb2";
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 12;
      ctx.fillRect(-32, -2, 26, 4);
      ctx.shadowBlur = 0;
      if (b.friendly) drawItem(ctx, 0, 0, 28, 1, arena.time, false);
      else {
        ctx.beginPath();
        ctx.arc(0, 0, 7, 0, Math.PI * 2);
        ctx.fill();
      }
      if (b.friendly) {
        ctx.beginPath();
        ctx.moveTo(-8, 0);
        ctx.lineTo(-14, -7);
        ctx.lineTo(-14, 7);
        ctx.fill();
      }
      ctx.restore();
    }
    for (const e of arena.effects) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, e.life / e.max);
      const x = e.x - camX,
        y = e.y - camY;
      ctx.strokeStyle = e.color;
      ctx.fillStyle = e.color;
      ctx.lineWidth = e.kind === "slash" ? 7 : 3;
      ctx.shadowColor = e.color;
      ctx.shadowBlur = 18;
      if (e.kind === "spark") {
        for (let i = 0; i < 6; i++) {
          const a = (i * Math.PI) / 3,
            d = (1 - e.life / e.max) * e.r;
          ctx.beginPath();
          ctx.moveTo(x + Math.cos(a) * d * 0.3, y + Math.sin(a) * d * 0.3);
          ctx.lineTo(x + Math.cos(a) * d, y + Math.sin(a) * d);
          ctx.stroke();
        }
      } else if (e.kind === "slash") {
        ctx.translate(x, y);
        ctx.rotate(e.angle);
        const q = 1 - e.life / e.max;
        for (let i = -1; i <= 1; i++) {
          ctx.save();
          ctx.rotate(i * 0.26 + (q - 0.5) * 0.8);
          ctx.fillStyle = e.color;
          ctx.beginPath();
          ctx.moveTo(5, -e.r * 0.64 + i * 7);
          ctx.quadraticCurveTo(e.r * 1.1, -e.r * 0.6, e.r * 0.72, e.r * 0.56);
          ctx.quadraticCurveTo(e.r * 0.65, -e.r * 0.15, 5, -e.r * 0.64 + i * 7);
          ctx.fill();
          ctx.strokeStyle = "#fffaf0";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(12, -e.r * 0.58 + i * 7);
          ctx.quadraticCurveTo(e.r * 0.9, -e.r * 0.45, e.r * 0.72, e.r * 0.56);
          ctx.stroke();
          ctx.restore();
        }
      } else if (e.kind === "beam") {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + Math.cos(e.angle) * e.r, y + Math.sin(e.angle) * e.r);
        ctx.lineWidth = 18;
        ctx.stroke();
        ctx.strokeStyle = "#fff6fd";
        ctx.lineWidth = 5;
        ctx.stroke();
      } else if (e.kind === "death") {
        for (let i = 0; i < 7; i++) {
          const a = (i / 7) * Math.PI * 2,
            d = (1 - e.life / e.max) * e.r;
          ctx.fillRect(x + Math.cos(a) * d - 2, y + Math.sin(a) * d - 2, 5, 5);
        }
      } else {
        if (e.kind === "ring") {
          drawItem(ctx, x, y, 30, 2, arena.time);
          for (let n = 0; n < 2; n++) {
            ctx.lineWidth = 2 + n * 3;
            ctx.globalAlpha *= 0.8;
            ctx.beginPath();
            ctx.arc(
              x,
              y,
              e.r * (1 - (e.life / e.max) * 0.5) + n * 12,
              0,
              Math.PI * 2,
            );
            ctx.stroke();
          }
        }
        ctx.beginPath();
        ctx.arc(
          x,
          y,
          e.r * (1 - (e.life / e.max) * 0.4),
          e.kind === "slash" ? -1 : 0,
          e.kind === "slash" ? 3.7 : Math.PI * 2,
        );
        ctx.stroke();
      }
      ctx.restore();
    }
    ctx.textAlign = "center";
    ctx.font = "bold 16px Neo,monospace";
    for (const n of arena.numbers) {
      ctx.globalAlpha = Math.min(1, n.life * 3);
      ctx.fillStyle = n.hurt ? "#ffc7bb" : n.crit ? "#ffe18e" : "#fff6d5";
      ctx.strokeStyle = "#594137";
      ctx.lineWidth = 3;
      ctx.strokeText(n.text, n.x - camX, n.y - camY);
      ctx.fillText(n.text, n.x - camX, n.y - camY);
    }
    ctx.globalAlpha = 1;
    // Small world map, without obscuring the play field.
    ctx.fillStyle = "#241b2dcc";
    ctx.fillRect(754, 10, 96, 72);
    ctx.fillStyle = "#a2b285";
    ctx.fillRect(758 + (p.x / 2400) * 86, 14 + (p.y / 1800) * 62, 4, 4);
    for (const e of arena.enemies.filter((e) => e.boss)) {
      ctx.fillStyle = "#f293a1";
      ctx.fillRect(758 + (e.x / 2400) * 86, 14 + (e.y / 1800) * 62, 4, 4);
    }
    ctx.restore();
    document.getElementById("runTime").textContent =
      `${String(Math.floor(arena.time / 60)).padStart(2, "0")}:${String(Math.floor(arena.time % 60)).padStart(2, "0")}`;
    document.getElementById("runHP").textContent =
      `춘배 체력 ${Math.ceil(p.hp)} / ${p.maxHP} · LV.${arena.level}`;
    document.getElementById("heroHP").max = p.maxHP;
    document.getElementById("heroHP").value = p.hp;
    document.getElementById("runKills").textContent = `${arena.kills} 처치`;
    document.getElementById("runXP").max = arena.needed();
    document.getElementById("runXP").value = arena.xp;
    document.getElementById("runEvent").textContent = arena.event;
    document.getElementById("bossBars").innerHTML = arena.enemies
      .filter((e) => e.boss && e.hp > 0)
      .map(
        (e) =>
          `<div><span>${e.name} ${e.final ? "(최종보스)" : "(중간보스)"}</span><progress value="${e.hp}" max="${e.maxHP}"></progress><small>${Math.ceil(e.hp)}/${Math.ceil(e.maxHP)}</small></div>`,
      )
      .join("");
    const build =
      arena.weapons
        .map((lv, i) =>
          lv
            ? `<div class="build-item augment-weapon"><span>${survivalIcon(i)}</span><strong>${SURVIVAL_WEAPONS[i].name}</strong><small>${arena.evolved(i) ? "✦ 진화" : "LV." + lv + " / 5"}</small></div>`
            : "",
        )
        .join("") +
      SURVIVAL_PASSIVES.map((p) =>
        arena.passives[p.id]
          ? `<div class="build-item augment-${p.id}"><span>${survivalIcon(p.id)}</span><strong>${p.name}</strong><small>LV.${arena.passives[p.id]} / 3</small></div>`
          : "",
      ).join("");
    const buildNode = document.getElementById("runBuild");
    if (buildNode.innerHTML !== build) buildNode.innerHTML = build;
  }
  const down = (e) => {
    if (modal.open) return;
    const code = e.code;
    if (
      [
        "KeyW",
        "KeyA",
        "KeyS",
        "KeyD",
        "ArrowLeft",
        "ArrowRight",
        "ArrowUp",
        "ArrowDown",
        "Space",
        "KeyP",
        "Digit1",
        "Digit2",
        "Digit3",
      ].includes(code)
    )
      e.preventDefault();
    keys[code] = true;
    if (code === "KeyP" && !e.repeat) pause(!arena.paused);
    if (arena.choice && code.startsWith("Digit")) {
      arena.choose(Number(code.slice(5)) - 1);
      overlayState = "";
      renderOverlay();
    }
  };
  const up = (e) => (keys[e.code] = false),
    blur = () => pause(true),
    visibility = () => {
      if (document.hidden) pause(true);
    };
  window.addEventListener("keydown", down);
  window.addEventListener("keyup", up);
  window.addEventListener("blur", blur);
  document.addEventListener("visibilitychange", visibility);
  document.querySelectorAll("[data-move]").forEach((b) => {
    const codes = { up: "KeyW", left: "KeyA", down: "KeyS", right: "KeyD" },
      code = codes[b.dataset.move];
    b.onpointerdown = (e) => {
      e.preventDefault();
      b.setPointerCapture(e.pointerId);
      keys[code] = true;
    };
    b.onpointerup =
      b.onpointercancel =
      b.onlostpointercapture =
        () => (keys[code] = false);
  });
  document.getElementById("pauseSurvival").onclick = () => pause(!arena.paused);
  document.getElementById("survivalDodge").onclick = () => arena.dodge();
  canvas.onpointerdown = (e) => {
    e.preventDefault();
    canvas.setPointerCapture(e.pointerId);
    touch = { x: e.clientX, y: e.clientY };
    canvas.focus({ preventScroll: true });
  };
  canvas.onpointermove = (e) => {
    if (!touch) return;
    keys.KeyA = e.clientX < touch.x - 12;
    keys.KeyD = e.clientX > touch.x + 12;
    keys.KeyW = e.clientY < touch.y - 12;
    keys.KeyS = e.clientY > touch.y + 12;
  };
  canvas.onpointerup = canvas.onpointercancel = () => {
    touch = null;
    keys.KeyA = keys.KeyD = keys.KeyW = keys.KeyS = false;
  };
  function frame(t) {
    const dt = Math.min(0.035, (t - last) / 1000 || 0);
    last = t;
    arena.update(dt, {
      left: keys.KeyA || keys.ArrowLeft,
      right: keys.KeyD || keys.ArrowRight,
      up: keys.KeyW || keys.ArrowUp,
      down: keys.KeyS || keys.ArrowDown,
      dodge: keys.Space,
    });
    draw();
    renderOverlay();
    if (arena.hitSound && t - lastSound > 110) {
      arena.hitSound = false;
      lastSound = t;
      playEffect("hit");
    }
    if (arena.time - snapshotAt > 3 && !settled) {
      snapshotAt = arena.time;
      s.expedition = arena.snapshot();
      save();
    }
    if ((arena.won || arena.lost) && !settled) finish();
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  setCleanup(() => {
    cancelAnimationFrame(raf);
    window.removeEventListener("keydown", down);
    window.removeEventListener("keyup", up);
    window.removeEventListener("blur", blur);
    document.removeEventListener("visibilitychange", visibility);
    if (!settled) finish(true);
  });
  canvas.focus({ preventScroll: true });
}

function survivalIcon(id) {
  const paths = {
    0: '<path d="M5 25Q5 12 14 4Q10 15 11 25ZM14 27Q14 13 23 5Q19 17 20 27ZM23 28Q23 17 30 11Q28 20 29 28Z" fill="#faf4d8" stroke="#725d42"/>',
    1: '<path d="M10 16L2 9V23Z" fill="#65bdd6"/><ellipse cx="19" cy="16" rx="11" ry="8" fill="#85d8e6"/><path d="M15 10L20 6L23 10" fill="#e1b65f"/><circle cx="25" cy="14" r="2" fill="#21343d"/><path d="M11 17H20" stroke="#3e879b"/>',
    2: '<path d="M5 23L8 18V11Q16 -1 24 11V18L27 23Z" fill="#eebf51" stroke="#835733"/><circle cx="16" cy="27" r="3" fill="#a97c37"/><path d="M11 11V18" stroke="#fff3c5" stroke-width="3"/>',
    3: '<circle cx="16" cy="16" r="13" fill="#d48bc4" stroke="#774b7d"/><path d="M5 10L26 21M4 17L22 28M10 4L28 15M8 25Q7 8 23 5M15 29Q15 14 28 10" fill="none" stroke="#955887" stroke-width="2"/>',
    4: '<path d="M2 16Q16 2 30 16Q16 30 2 16Z" fill="#c3e8c5" stroke="#456853"/><path d="M16 8V24" stroke="#f179bb" stroke-width="5"/><path d="M1 16H31" stroke="#fff" stroke-width="2"/>',
    5: '<path d="M5 9H27V26Q16 32 5 26Z" fill="#d7825a" stroke="#744335"/><ellipse cx="16" cy="9" rx="11" ry="5" fill="#d8ddd6" stroke="#6f787c"/><path d="M11 9H21M9 18H23" stroke="#f8edda" stroke-width="3"/>',
  };
  if (paths[id])
    return `<svg viewBox="0 0 32 32" class="item-icon" aria-hidden="true">${paths[id]}</svg>`;
  return (
    {
      power: "⚔",
      range: "↔",
      speed: "🐾",
      vamp: "🩸",
      magnet: "🧲",
      luck: "🍀",
    }[id] || "♥"
  );
}
function drawItem(c, x, y, size, kind, t = 0, framed = true) {
  c.save();
  c.translate(x, y + Math.sin(t * 4 + x) * 2);
  c.scale(size / 32, size / 32);
  c.shadowColor = "#ffdf7d";
  c.shadowBlur = 9;
  c.fillStyle = "#342c35";
  c.strokeStyle = "#ffe4a2";
  c.lineWidth = 2;
  if (framed) {
    c.beginPath();
    c.roundRect(-16, -16, 32, 32, 7);
    c.fill();
    c.stroke();
  }
  c.shadowBlur = 0;
  c.lineWidth = 2;
  c.strokeStyle = "#332a30";
  if (kind === 0) {
    c.strokeStyle = "#fff4d3";
    c.lineWidth = 3;
    for (let i = -1; i <= 1; i++) {
      c.beginPath();
      c.moveTo(-9, i * 6 + 4);
      c.quadraticCurveTo(0, i * 6 - 8, 10, i * 6 - 6);
      c.stroke();
    }
  } else if (kind === 1) {
    c.fillStyle = "#72cee1";
    c.beginPath();
    c.ellipse(1, 0, 10, 6, 0, 0, Math.PI * 2);
    c.fill();
    c.stroke();
    c.beginPath();
    c.moveTo(-7, 0);
    c.lineTo(-13, -7);
    c.lineTo(-13, 7);
    c.closePath();
    c.fill();
    c.fillStyle = "#142838";
    c.fillRect(6, -3, 3, 3);
  } else if (kind === 2) {
    c.fillStyle = "#ffd46b";
    c.beginPath();
    c.moveTo(-10, 7);
    c.quadraticCurveTo(-7, 3, -7, -5);
    c.quadraticCurveTo(0, -15, 7, -5);
    c.lineTo(10, 7);
    c.closePath();
    c.fill();
    c.stroke();
    c.beginPath();
    c.arc(0, 10, 3, 0, Math.PI * 2);
    c.fill();
  } else if (kind === 3) {
    c.fillStyle = "#e999ce";
    c.beginPath();
    c.arc(0, 0, 11, 0, Math.PI * 2);
    c.fill();
    c.stroke();
    c.strokeStyle = "#974572";
    for (let i = -6; i <= 6; i += 4) {
      c.beginPath();
      c.moveTo(-9, i);
      c.quadraticCurveTo(0, i + 7, 9, i);
      c.stroke();
    }
  } else if (kind === 4) {
    c.fillStyle = "#fa91da";
    c.beginPath();
    c.moveTo(0, -13);
    c.lineTo(4, -3);
    c.lineTo(13, 0);
    c.lineTo(4, 3);
    c.lineTo(0, 13);
    c.lineTo(-4, 3);
    c.lineTo(-13, 0);
    c.lineTo(-4, -3);
    c.closePath();
    c.fill();
  } else if (kind === 5 || kind === "chest") {
    c.fillStyle = "#ed9c75";
    c.fillRect(-10, -8, 20, 18);
    c.strokeRect(-10, -8, 20, 18);
    c.fillStyle = "#e8e5d6";
    c.beginPath();
    c.ellipse(0, -8, 10, 4, 0, 0, Math.PI * 2);
    c.fill();
    c.stroke();
    c.fillStyle = "#643b36";
    c.font = "bold 12px monospace";
    c.textAlign = "center";
    c.fillText("FISH", 0, 6);
  } else {
    c.fillStyle = "#ffe07a";
    c.font = "bold 24px monospace";
    c.textAlign = "center";
    c.fillText(kind === "coin" ? "G" : "U", 0, 8);
  }
  c.strokeStyle = "#ffffffb0";
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(-11, -9);
  c.lineTo(-5, -12);
  c.stroke();
  c.restore();
}
