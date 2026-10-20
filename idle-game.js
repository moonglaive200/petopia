/* Persistent real-time expedition; rendering is only a view of the engine ledger. */
function idleDuration(ms) {
  const seconds = Math.max(0, Math.floor(ms / 1000));
  return seconds >= 3600
    ? `${Math.floor(seconds / 3600)}시간 ${Math.floor((seconds % 3600) / 60)}분`
    : seconds >= 60
      ? `${Math.floor(seconds / 60)}분 ${seconds % 60}초`
      : `${seconds}초`;
}
function showIdleReturn(report) {
  showModal(
    "춘배가 원정에서 돌아왔어!",
    `<div class="idle-return">${spriteMarkup("chunbae", "happy")}<p>${idleDuration(report.ms)} 동안 ${money(report.kills)}마리 처치!</p><div class="idle-rewards"><strong>🪙 +${money(report.gold)} G</strong><strong>✦ +${money(report.xp)} XP</strong></div>${report.levels ? `<p>LEVEL UP! 현재 LV.${player().level}</p>` : ""}<p>${report.capped ? "오프라인 보상은 최대 8시간까지 정산했어." : "골드와 경험치를 지급했어."}</p><small>게임 날짜·기력은 그대로야. 원정은 계속 진행 중!</small></div>`,
  );
}
function flushIdle() {
  const s = slots[selectedSlot];
  if (!s?.introSeen || !s.idleHunt?.running) return;
  E.settleIdle(s, Date.now());
  save();
}
// Freeze the last observed timestamp before hiding; suspended tabs resume as offline time.
window.addEventListener("pagehide", flushIdle);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) flushIdle();
});
setInterval(() => {
  if (!document.hidden && document.body.dataset.screen === "game") flushIdle();
}, 10000);
let idleBattleSound = false;
function renderIdleHunt() {
  const s = player(),
    a = E.idleState(s);
  E.settleIdle(s, Date.now());
  gameShell(`${title("CHUNBAE EXPEDITION", "춘배 원정대", "집사가 없어도, 춘배의 모험은 계속된다.")}
    <div class="idle-banner"><span class="idle-state" id="idleState"></span><span>기력 0 · 날짜 변화 없음 · 던전 횟수 별도</span></div>
    <div class="idle-stage-wrap"><canvas id="idleCanvas" width="860" height="330" aria-label="춘배가 자동으로 이동하고 몬스터를 공격하는 원정 사냥터"></canvas><div class="idle-stage-caption"><span id="idleZoneName"></span><button class="text-button" id="idleSound"></button></div></div>
    <div class="idle-dashboard"><div><small>시간당 예상 골드</small><strong id="idleGoldRate"></strong></div><div><small>시간당 예상 경험치</small><strong id="idleXPRate"></strong></div><div><small>지금까지 받은 골드</small><strong id="idleTotalGold"></strong></div><div><small>누적 처치</small><strong id="idleTotalKills"></strong></div></div>
    <p id="idlePay" class="game-notice" role="status">사냥 중 보상은 자동 지급돼. 꺼두면 최대 8시간까지 모아 둘게!</p>
    <div class="idle-actions"><button class="btn primary" id="idleStart"></button><button class="btn" id="idleRefresh">현재 장비 반영</button><button class="btn" id="idleStop">원정 쉬기</button></div>
    <p class="note" id="idlePower"></p>
    <div class="section-heading"><h2>원정 사냥터</h2><span>장비가 강할수록 빠른 사냥</span></div>
    <div class="idle-zones">${E.idleZones.map((z, i) => `<button class="destination ${a.area === i ? "selected" : ""}" data-idle-zone="${i}" ${s.level < z.level ? "disabled" : ""}><span>${["♧", "✧", "◆"][i]}</span><h2>${z.name}</h2><p>LV.${z.level}부터 · ${s.level < z.level ? "잠김" : "선택 가능"}</p></button>`).join("")}</div>
    <div class="tip-banner">출발할 때의 레벨·공격·방어·체력과 수입 보너스로 속도·보상을 정해.<br>성장하거나 장비를 바꿨다면 ‘현재 장비 반영’을 눌러 줘! 지난 시간의 보상은 이전 능력으로 정산돼.<br>원정은 안전해서 쓰러지지 않아. 게임을 꺼도 출발한 사냥터에서 최대 8시간 동안 골드·경험치를 모아.</div>`);
  const canvas = document.querySelector("#idleCanvas"),
    ctx = canvas.getContext("2d");
  let raf,
    timer,
    lastAttack = -1,
    stopped = false;
  function update() {
    if (stopped) return;
    const report = E.claimIdle(s, Date.now(), false);
    if (report) {
      document.querySelector("#idlePay").textContent =
        `자동 획득 +${report.gold} G · +${report.xp} XP · ${report.kills}마리${report.levels ? ` · 레벨 업! LV.${s.level}` : ""}`;
    }
    const rate = a.rates || E.idleRates(s, a.area);
    document.querySelector("#idleState").textContent = a.running
      ? "● 자동사냥 중"
      : "☾ 출발 대기";
    document.querySelector("#idleZoneName").textContent =
      E.idleZones[a.area].name;
    document.querySelector("#idleGoldRate").textContent =
      `${money(rate.goldHour)} G`;
    document.querySelector("#idleXPRate").textContent =
      `${money(rate.xpHour)} XP`;
    document.querySelector("#idleTotalGold").textContent =
      `${money(a.totalGold)} G`;
    document.querySelector("#idleTotalKills").textContent =
      `${money(a.totalKills)}마리`;
    document.querySelector("#idleStart").textContent = a.running
      ? "원정 진행 중"
      : "⚑ 원정 출발";
    document.querySelector("#idleStart").disabled = a.running;
    document.querySelector("#idleStop").disabled = !a.running;
    document.querySelector("#idleRefresh").disabled = !a.running;
    document.querySelector("#idlePower").textContent =
      `${a.running ? "출발 능력" : "예상 능력"} · LV.${rate.level} · 공격 ${rate.attack} / 방어 ${rate.defense} / 체력 ${rate.hp} · 1마리 약 ${(rate.cycleMs / 1000).toFixed(1)}초 · 기력 ${s.energy}/100`;
    document.querySelector(".wallet span").textContent = `◈ ${money(s.gold)} G`;
    document.querySelectorAll("[data-idle-zone]").forEach((b, i) => {
      b.disabled = s.level < E.idleZones[i].level;
    });
    save();
  }
  function dispatch(area, refresh = false) {
    if (!E.startIdle(s, area, Date.now())) return;
    E.log(
      s,
      `춘배 원정대 ${refresh ? "장비 반영" : "출발"} · ${E.idleZones[area].name}`,
    );
    save();
    renderIdleHunt();
  }
  document.querySelector("#idleStart").onclick = () => dispatch(a.area);
  document.querySelector("#idleRefresh").onclick = () => dispatch(a.area, true);
  document.querySelector("#idleStop").onclick = () => {
    E.stopIdle(s, Date.now());
    E.claimIdle(s, Date.now());
    E.log(s, "춘배 원정대가 쉬고 있어. 다시 출발하기 전까지 추가 수익 없음");
    save();
    renderIdleHunt();
  };
  bind("idle-zone", (value) => {
    const area = Number(value);
    if (a.running) dispatch(area);
    else {
      if (s.level < E.idleZones[area].level) return;
      a.area = area;
      save();
      renderIdleHunt();
    }
  });
  const sfx = document.querySelector("#idleSound");
  function labelSound() {
    sfx.textContent = idleBattleSound
      ? "♫ 원정 효과음 끄기"
      : "♪ 원정 효과음 켜기";
  }
  sfx.onclick = () => {
    idleBattleSound = !idleBattleSound;
    labelSound();
  };
  labelSound();
  function draw(t) {
    if (stopped) return;
    const zone = E.idleZones[a.area],
      rate = a.rates || E.idleRates(s, a.area);
    const elapsed = a.running ? Math.max(0, Date.now() - a.lastAt) : 0;
    const progress = a.running
      ? ((a.phaseMs + elapsed) % rate.cycleMs) / rate.cycleMs
      : 0;
    const now = t / 1000,
      phase = motion ? now : 0;
    ctx.fillStyle = zone.color;
    ctx.fillRect(0, 0, 860, 330);
    const sky = ctx.createLinearGradient(0, 0, 0, 330);
    sky.addColorStop(0, "#0e182c99");
    sky.addColorStop(1, "#0b171244");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, 860, 330);
    for (let i = 0; i < 14; i++) {
      const x =
        (i * 113 +
          Math.sin(i) * 53 +
          860 -
          ((a.running && motion ? now * 12 : 0) % 860)) %
        950;
      ctx.fillStyle = i % 2 ? "#101e2966" : "#a5c99d13";
      ctx.fillRect(x, 45 + (i % 3) * 22, 18 + (i % 3) * 12, 230);
      ctx.fillStyle = "#b4d6b015";
      ctx.beginPath();
      ctx.arc(x + 9, 58 + (i % 3) * 22, 46, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = "#14242166";
    ctx.fillRect(0, 250, 860, 80);
    for (let i = 0; i < 28; i++) {
      ctx.fillStyle = i % 2 ? "#a0ba7344" : "#a5dbcf44";
      ctx.fillRect((i * 43 + 24) % 860, 265 + (i % 4) * 12, 7, 3);
    }
    if (!a.running) {
      drawPortrait(ctx, 430, 200, 122, "sleep");
      ctx.fillStyle = "#fff0ce";
      ctx.font = "18px NeoDunggeunmo,monospace";
      ctx.textAlign = "center";
      ctx.fillText("잠깐 쉬는 중… 출발하면 자동으로 사냥해!", 430, 85);
      raf = requestAnimationFrame(draw);
      return;
    }
    const catX = 220 + Math.min(1, progress / 0.3) * 90,
      enemyX = 610 - Math.min(1, progress / 0.35) * 210;
    const hit = progress > 0.3 && (progress * 8) % 1 < 0.38;
    drawWalkingCat(
      ctx,
      catX,
      214,
      105,
      {
        facing: 2,
        walking: progress < 0.3,
        walkDistance: phase * 60,
        attackAnim: hit ? 0.12 : 0,
      },
      phase,
    );
    const image = spriteImages.monsters,
      index = (a.totalKills + a.area * 3) % 9;
    if (image.complete && image.naturalWidth) {
      const w = image.width / 4,
        h = image.height / 3;
      ctx.save();
      if (hit) ctx.filter = "brightness(1.6)";
      ctx.drawImage(
        image,
        (index % 4) * w,
        Math.floor(index / 4) * h,
        w,
        h,
        enemyX - 48,
        170 + (motion ? Math.sin(phase * 6) * 3 : 0),
        96,
        96,
      );
      ctx.restore();
    } else {
      ctx.fillStyle = "#dc8c9f";
      ctx.beginPath();
      ctx.arc(enemyX, 215, 30, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = "#241d2b";
    ctx.fillRect(enemyX - 52, 147, 104, 12);
    ctx.fillStyle = "#f37779";
    ctx.fillRect(enemyX - 50, 149, 100 * (1 - progress), 8);
    ctx.textAlign = "center";
    ctx.font = "14px NeoDunggeunmo,monospace";
    ctx.fillStyle = "#fff2d3";
    ctx.fillText("원정 몬스터", enemyX, 134);
    if (hit) {
      ctx.save();
      ctx.strokeStyle = "#ffe8a0";
      ctx.lineWidth = 5;
      ctx.shadowColor = "#ffe8a0";
      ctx.shadowBlur = 15;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(enemyX - 52 + i * 16, 182);
        ctx.lineTo(enemyX - 24 + i * 16, 228);
        ctx.stroke();
      }
      ctx.restore();
      ctx.font = "bold 24px NeoDunggeunmo,monospace";
      ctx.fillStyle = "#fff1ab";
      ctx.fillText(`${rate.attack}`, enemyX, 104);
    }
    const attackKey = Math.floor((a.totalKills + progress) * 8);
    if (hit && attackKey !== lastAttack) {
      lastAttack = attackKey;
      if (idleBattleSound && !document.hidden) playEffect("claw");
    }
    ctx.textAlign = "left";
    ctx.font = "14px NeoDunggeunmo,monospace";
    ctx.fillStyle = "#e9f1d5";
    ctx.fillText(`AUTO · LV.${s.level}`, 24, 32);
    ctx.textAlign = "right";
    ctx.fillText(
      `다음 처치 ${Math.max(0, ((1 - progress) * rate.cycleMs) / 1000).toFixed(1)}초`,
      836,
      32,
    );
    raf = requestAnimationFrame(draw);
  }
  setCleanup(() => {
    stopped = true;
    clearInterval(timer);
    cancelAnimationFrame(raf);
    E.settleIdle(s, Date.now());
    save();
  });
  update();
  timer = setInterval(update, 1000);
  raf = requestAnimationFrame(draw);
}
