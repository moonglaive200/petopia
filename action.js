/* Fixed-coordinate arena. Rendering and saved rewards are kept outside simulation. */
class PetopiaArena {
  constructor(stats, index, boss = false) {
    const e = PetopiaEngine;
    this.stats = stats;
    this.index = index;
    this.isBoss = boss;
    this.player = {
      x: 150,
      y: 230,
      hp: stats.hp,
      inv: 0,
      dash: 0,
      dashCD: 0,
      attackCD: 0,
      slash: 0,
      dx: 1,
      dy: 0,
    };
    this.enemies = Array.from({ length: boss ? 1 : 3 }, (_, i) => ({
      x: 600 + (i % 2) * 85,
      y: 110 + i * 100,
      hp: boss ? e.boss.hp : e.dungeons[index].hp,
      maxHP: boss ? e.boss.hp : e.dungeons[index].hp,
      attack: boss ? e.boss.attack : e.dungeons[index].attack,
      defense: boss ? e.boss.defense : e.dungeons[index].defense,
      speed: boss ? 30 : 42 + index * 4,
      windup: 0,
      cooldown: 1 + i * 0.3,
      pattern: 2,
      patternIndex: 0,
      charge: null,
    }));
    this.projectiles = [];
    this.zones = [];
    this.numbers = [];
    this.time = 0;
    this.won = false;
    this.lost = false;
    this.paused = false;
  }
  attack() {
    const p = this.player;
    if (p.attackCD > 0 || this.won || this.lost || this.paused) return false;
    p.attackCD = 0.34;
    p.slash = 0.18;
    for (const e of this.enemies) {
      if (e.hp <= 0) continue;
      if (Math.hypot(e.x - p.x, e.y - p.y) < 87) {
        const damage = Math.max(1, this.stats.attack - e.defense);
        e.hp = Math.max(0, e.hp - damage);
        this.numbers.push({
          x: e.x,
          y: e.y - 20,
          text: "−" + damage,
          life: 0.7,
        });
        const dx = e.x - p.x,
          dy = e.y - p.y,
          len = Math.hypot(dx, dy) || 1;
        e.x = Math.max(24, Math.min(776, e.x + (dx / len) * 13));
        e.y = Math.max(24, Math.min(436, e.y + (dy / len) * 13));
      }
    }
    return true;
  }
  dodge() {
    const p = this.player;
    if (p.dashCD > 0 || this.won || this.lost || this.paused) return;
    p.dash = 0.2;
    p.inv = 0.32;
    p.dashCD = 2.2;
  }
  hit(n) {
    const p = this.player;
    if (p.inv > 0 || this.lost) return;
    const damage = Math.max(1, n - this.stats.defense);
    p.hp = Math.max(0, p.hp - damage);
    p.inv = 0.8;
    this.numbers.push({ x: p.x, y: p.y - 20, text: "−" + damage, life: 0.7 });
    if (!p.hp) this.lost = true;
  }
  update(dt, input = {}) {
    if (this.won || this.lost || this.paused) return;
    this.time += dt;
    const p = this.player;
    for (const key of ["inv", "dash", "dashCD", "attackCD", "slash"])
      p[key] = Math.max(0, p[key] - dt);
    let dx = (input.right ? 1 : 0) - (input.left ? 1 : 0),
      dy = (input.down ? 1 : 0) - (input.up ? 1 : 0),
      len = Math.hypot(dx, dy);
    if (len) {
      dx /= len;
      dy /= len;
      p.dx = dx;
      p.dy = dy;
    }
    if (p.dash > 0) {
      dx = p.dx;
      dy = p.dy;
      len = 1;
    }
    if (len) {
      const speed = p.dash > 0 ? 530 : 175;
      p.x = Math.max(24, Math.min(776, p.x + dx * speed * dt));
      p.y = Math.max(28, Math.min(430, p.y + dy * speed * dt));
    }
    if (input.attack) this.attack();
    if (input.dodge) this.dodge();
    for (const e of this.enemies) {
      if (e.hp <= 0) continue;
      e.cooldown -= dt;
      let ex = p.x - e.x,
        ey = p.y - e.y,
        dist = Math.hypot(ex, ey) || 1;
      if (e.windup > 0) {
        e.windup -= dt;
        if (e.windup <= 0) {
          if (dist < 62) this.hit(e.attack);
          e.cooldown = 1.1;
        }
      } else if (e.charge) {
        e.charge.time -= dt;
        e.x += e.charge.dx * dt * 540;
        e.y += e.charge.dy * dt * 540;
        if (dist < 50) this.hit(e.attack + 8);
        if (e.charge.time <= 0) e.charge = null;
      } else if (dist > 47) {
        e.x += (ex / dist) * e.speed * dt;
        e.y += (ey / dist) * e.speed * dt;
      } else if (e.cooldown <= 0) e.windup = 0.55;
      e.x = Math.max(28, Math.min(772, e.x));
      e.y = Math.max(30, Math.min(430, e.y));
      if (this.isBoss) {
        e.pattern -= dt;
        if (e.pattern <= 0) {
          const phase = e.hp < e.maxHP / 2,
            kind = e.patternIndex++ % 3;
          e.pattern = phase ? 2.2 : 3.1;
          if (kind === 0) {
            const angle = Math.atan2(ey, ex),
              count = phase ? 7 : 5;
            for (let i = 0; i < count; i++) {
              const a = angle + (i - (count - 1) / 2) * 0.22;
              this.projectiles.push({
                x: e.x,
                y: e.y,
                dx: Math.cos(a),
                dy: Math.sin(a),
                speed: phase ? 220 : 165,
                life: 5,
                delay: 0.65,
              });
            }
          }
          if (kind === 1) {
            this.zones.push({
              kind: "charge",
              x: e.x,
              y: e.y,
              dx: ex / dist,
              dy: ey / dist,
              warn: 0.85,
              life: 0.5,
              triggered: false,
              enemy: e,
            });
          }
          if (kind === 2) {
            for (let i = 0; i < (phase ? 4 : 3); i++)
              this.zones.push({
                kind: "circle",
                x:
                  i === 0
                    ? p.x
                    : 130 + ((i * 231 + Math.floor(this.time) * 71) % 530),
                y: i === 0 ? p.y : 80 + ((i * 113) % 300),
                warn: 0.95,
                life: 0.8,
                r: phase ? 80 : 65,
              });
          }
        }
      } else if (this.index >= 4 && e.cooldown < 0 && dist > 130) {
        this.projectiles.push({
          x: e.x,
          y: e.y,
          dx: ex / dist,
          dy: ey / dist,
          speed: 130,
          life: 4,
          delay: 0.4,
        });
        e.cooldown = 2.5;
      }
    }
    for (const b of this.projectiles) {
      if (b.delay > 0) {
        b.delay -= dt;
        continue;
      }
      b.x += b.dx * b.speed * dt;
      b.y += b.dy * b.speed * dt;
      b.life -= dt;
      if (Math.hypot(b.x - p.x, b.y - p.y) < 22) {
        this.hit(this.isBoss ? 19 : 9 + this.index);
        b.life = 0;
      }
    }
    this.projectiles = this.projectiles.filter(
      (b) => b.life > 0 && b.x > -30 && b.x < 830 && b.y > -30 && b.y < 490,
    );
    for (const z of this.zones) {
      if (z.warn > 0) {
        z.warn -= dt;
        if (z.warn <= 0 && z.kind === "charge" && !z.triggered) {
          z.enemy.charge = { dx: z.dx, dy: z.dy, time: 0.6 };
          z.triggered = true;
        }
      } else {
        z.life -= dt;
        if (z.kind === "circle" && Math.hypot(z.x - p.x, z.y - p.y) < z.r)
          this.hit(23);
      }
    }
    this.zones = this.zones.filter((z) => z.life > 0);
    for (const n of this.numbers) {
      n.life -= dt;
      n.y -= dt * 20;
    }
    this.numbers = this.numbers.filter((n) => n.life > 0);
    if (!this.lost && this.enemies.every((e) => e.hp <= 0)) this.won = true;
  }
}
globalThis.PetopiaArena = PetopiaArena;
function startActionDungeon(index, isBoss) {
  const s = player();
  if (!E.consume(s, "dungeon", 5, 10)) return;
  s.expedition = { index, boss: isBoss };
  save();
  const arena = new PetopiaArena(E.stats(s), index, isBoss),
    name = isBoss ? E.boss.name : E.dungeons[index].name;
  gameShell(
    `${title(isBoss ? "BOSS ENCOUNTER" : "DUNGEON " + String(index + 1).padStart(2, "0"), name)}<div class="arena-hud"><span id="playerHP"></span><span id="dashStatus"></span><button class="text-button" id="pauseArena">일시정지 P</button></div>${isBoss ? `<div class="boss-health"><span>♠ 조커의남자</span><progress id="bossHP" max="650" value="650" aria-label="보스 체력"></progress><b id="bossHPText">650 / 650</b></div>` : ""}<div class="action-wrap"><canvas id="actionCanvas" width="800" height="460" tabindex="0" aria-label="WASD로 움직이고 J 또는 클릭으로 공격하는 던전"></canvas><div id="actionOverlay" hidden></div></div><div class="action-controls"><div class="dpad"><button data-move="up" aria-label="위로">↑</button><button data-move="left" aria-label="왼쪽으로">←</button><button data-move="down" aria-label="아래로">↓</button><button data-move="right" aria-label="오른쪽으로">→</button></div><button class="btn primary" id="attackButton">공격 · J</button><button class="btn" id="dodgeButton">회피 · Space</button></div><p class="note">WASD / 방향키 이동 · 마우스 클릭 또는 J 공격 · Space 회피 · P 일시정지<br>붉은 표시를 피해! 회피 중에는 잠깐 무적. 탭을 벗어나면 자동 일시정지.</p>`,
    () => renderDungeons(isBoss ? "boss" : "normal"),
  );
  activeActivity = true;
  const canvas = document.querySelector("#actionCanvas"),
    ctx = canvas.getContext("2d"),
    keys = {},
    overlay = document.querySelector("#actionOverlay");
  let raf,
    last = 0,
    settled = false;
  function finish() {
    if (settled) return;
    settled = true;
    s.expedition = null;
    activeActivity = false;
    let text;
    if (arena.won) {
      const first = isBoss ? !s.bossCleared : index === s.cleared;
      if (isBoss) s.bossCleared = true;
      else if (first) s.cleared = Math.min(10, s.cleared + 1);
      const d = isBoss ? E.boss : E.dungeons[index],
        gold = E.reward(s, d.gold * (first ? 2 : 1)),
        xp = d.xp * (first ? 2 : 1),
        levels = E.gainXP(s, xp);
      E.happy(s, -4);
      text = `<h2>${isBoss ? "조커의남자 격파!" : "던전 정복!"}</h2><p>+${gold} G · +${xp} XP${levels ? " · 레벨 업!" : ""}</p>${isBoss ? "<p>♠ 카지노가 해금됐어!</p>" : ""}`;
      meow(1.15);
    } else {
      s.hospital = true;
      E.happy(s, -20);
      text =
        "<h2>춘배가 쓰러졌어!</h2><p>펫병원에서 치료하면 다시 모험할 수 있어.<br>가진 돈과 경험치는 잃지 않았어.</p>";
      meow(0.75);
    }
    save();
    overlay.hidden = false;
    overlay.innerHTML = `${text}<button class="btn primary" id="afterBattle">${arena.lost ? "펫병원으로" : "던전 목록으로"}</button>`;
    document.querySelector("#afterBattle").onclick = () =>
      arena.lost
        ? renderHospital()
        : renderDungeons(isBoss ? "boss" : "normal");
    document.querySelector("#attackButton").disabled = true;
    document.querySelector("#dodgeButton").disabled = true;
  }
  function pause(value) {
    if (settled) return;
    arena.paused = value;
    for (const k of Object.keys(keys)) keys[k] = false;
    overlay.hidden = !value;
    if (value) {
      overlay.innerHTML =
        '<h2>잠깐 쉬는 중</h2><button class="btn primary" id="resumeArena">계속하기</button>';
      document.querySelector("#resumeArena").onclick = () => pause(false);
    }
  }
  const keydown = (e) => {
      if (modal.open) return;
      if (
        [
          "KeyW",
          "KeyA",
          "KeyS",
          "KeyD",
          "ArrowUp",
          "ArrowLeft",
          "ArrowDown",
          "ArrowRight",
          "Space",
          "KeyJ",
          "KeyP",
        ].includes(e.code)
      )
        e.preventDefault();
      keys[e.code] = true;
      if (e.code === "KeyP" && !e.repeat) pause(!arena.paused);
    },
    keyup = (e) => (keys[e.code] = false);
  const blur = () => pause(true);
  window.addEventListener("keydown", keydown);
  window.addEventListener("keyup", keyup);
  window.addEventListener("blur", blur);
  const visibility = () => {
    if (document.hidden) pause(true);
  };
  document.addEventListener("visibilitychange", visibility);
  canvas.onpointerdown = (e) => {
    e.preventDefault();
    arena.attack();
  };
  document.querySelector("#attackButton").onclick = () => arena.attack();
  document.querySelector("#dodgeButton").onclick = () => arena.dodge();
  document.querySelector("#pauseArena").onclick = () => pause(!arena.paused);
  const moveMap = { up: "KeyW", left: "KeyA", down: "KeyS", right: "KeyD" };
  document.querySelectorAll("[data-move]").forEach((b) => {
    b.onpointerdown = (e) => {
      e.preventDefault();
      b.setPointerCapture(e.pointerId);
      keys[moveMap[b.dataset.move]] = true;
    };
    b.onpointerup =
      b.onpointercancel =
      b.onlostpointercapture =
        () => (keys[moveMap[b.dataset.move]] = false);
  });
  function draw() {
    ctx.fillStyle = isBoss ? "#292d3e" : "#d0d3b5";
    ctx.fillRect(0, 0, 800, 460);
    for (let y = 0; y < 460; y += 40)
      for (let x = 0; x < 800; x += 40) {
        ctx.fillStyle = isBoss
          ? (x + y) % 80
            ? "#323449"
            : "#2d3042"
          : (x + y) % 80
            ? "#c6ccb0"
            : "#cbd0b2";
        ctx.fillRect(x + 1, y + 1, 38, 38);
      }
    ctx.strokeStyle = isBoss ? "#a88d64" : "#8f9b77";
    ctx.lineWidth = 8;
    ctx.strokeRect(4, 4, 792, 452);
    for (const z of arena.zones) {
      ctx.save();
      ctx.fillStyle = z.warn > 0 ? "#e89b4955" : "#e24e5477";
      ctx.strokeStyle = z.warn > 0 ? "#ffbd6a" : "#ff6b69";
      ctx.lineWidth = 3;
      if (z.kind === "circle") {
        ctx.beginPath();
        ctx.arc(z.x, z.y, z.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.moveTo(z.x, z.y);
        ctx.lineTo(z.x + z.dx * 700, z.y + z.dy * 700);
        ctx.stroke();
      }
      ctx.restore();
    }
    for (const b of arena.projectiles) {
      if (b.delay > 0) {
        ctx.strokeStyle = "#f4b46588";
        ctx.beginPath();
        ctx.moveTo(b.x, b.y);
        ctx.lineTo(b.x + b.dx * 75, b.y + b.dy * 75);
        ctx.stroke();
        continue;
      }
      ctx.fillStyle = isBoss ? "#f0c589" : "#9987b3";
      ctx.fillRect(b.x - 5, b.y - 7, 10, 14);
      ctx.fillStyle = "#be6369";
      ctx.fillRect(b.x - 2, b.y - 3, 4, 6);
    }
    for (const enemy of arena.enemies) {
      if (enemy.hp <= 0) continue;
      ctx.save();
      ctx.translate(enemy.x, enemy.y);
      const col = isBoss
        ? "#ae6c94"
        : ["#94a275", "#b58c70", "#ac946c", "#a4b176", "#8d80aa"][index % 5];
      ctx.fillStyle = enemy.windup > 0 ? "#ec8b70" : col;
      ctx.fillRect(-17, -17, 34, 31);
      ctx.fillRect(-12, -25, 24, 12);
      ctx.fillStyle = "#f8eac6";
      ctx.fillRect(-10, -12, 7, 7);
      ctx.fillRect(5, -12, 7, 7);
      ctx.fillStyle = "#3b4140";
      ctx.fillRect(-6, -10, 3, 4);
      ctx.fillRect(5, -10, 3, 4);
      if (isBoss) {
        ctx.fillStyle = "#e3bc6b";
        ctx.fillRect(-23, -30, 46, 7);
        ctx.fillRect(-15, -42, 8, 14);
        ctx.fillRect(9, -42, 8, 14);
        ctx.fillStyle = "#f6e1aa";
        ctx.font = "18px monospace";
        ctx.fillText("♠", -7, 10);
      } else {
        ctx.fillStyle = "#5b6556";
        ctx.fillRect(-24, -37, 48, 5);
        ctx.fillStyle = "#b16c5d";
        ctx.fillRect(-24, -37, (48 * enemy.hp) / enemy.maxHP, 5);
      }
      if (enemy.windup > 0) {
        ctx.strokeStyle = "#ed7461";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 52, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }
    const p = arena.player;
    if (p.inv <= 0 || Math.floor(arena.time * 15) % 2 === 0)
      drawCat(ctx, p.x, p.y, 0.9);
    if (p.slash > 0) {
      ctx.strokeStyle = "#fff7c6";
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 70, arena.time * 7, arena.time * 7 + Math.PI * 1.6);
      ctx.stroke();
    }
    ctx.font = "bold 17px monospace";
    for (const n of arena.numbers) {
      ctx.fillStyle = "#fff7da";
      ctx.strokeStyle = "#6e4c42";
      ctx.lineWidth = 3;
      ctx.strokeText(n.text, n.x - 10, n.y);
      ctx.fillText(n.text, n.x - 10, n.y);
    }
    document.querySelector("#playerHP").textContent =
      `♥ ${p.hp}/${arena.stats.hp}`;
    document.querySelector("#dashStatus").textContent =
      p.dashCD > 0 ? `회피 ${p.dashCD.toFixed(1)}초` : "회피 준비";
    if (isBoss) {
      const e = arena.enemies[0];
      document.querySelector("#bossHP").value = e.hp;
      document.querySelector("#bossHPText").textContent =
        `${e.hp}/650${e.hp < 325 ? " · 2페이즈" : ""}`;
    }
  }
  function frame(t) {
    const dt = Math.min(0.035, (t - last) / 1000 || 0);
    last = t;
    arena.update(dt, {
      left: keys.KeyA || keys.ArrowLeft,
      right: keys.KeyD || keys.ArrowRight,
      up: keys.KeyW || keys.ArrowUp,
      down: keys.KeyS || keys.ArrowDown,
      attack: keys.KeyJ,
      dodge: keys.Space,
    });
    draw();
    if (arena.won || arena.lost) finish();
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  setCleanup(() => {
    cancelAnimationFrame(raf);
    window.removeEventListener("keydown", keydown);
    window.removeEventListener("keyup", keyup);
    window.removeEventListener("blur", blur);
    document.removeEventListener("visibilitychange", visibility);
    if (!settled) {
      s.expedition = null;
      E.happy(s, -5);
      save();
    }
  });
  canvas.focus({ preventScroll: true });
}
