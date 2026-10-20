function renderArcade() {
  const s = player();
  gameShell(
    `<div class="neon-lobby">${title("OPEN ALL NIGHT", "방앗간 ARCADE", "입장하면 행복도 +5! 추가 기력 없이 즐겨보자.")}<div class="neon-sign">MEOW • PLAY • REPEAT</div><div class="destination-grid three"><button class="destination" data-arcade="claw"><span>♙</span><h2>인형뽑기</h2><p>집게 중심을 정확히 · 참가비 20 G</p></button><button class="destination" data-arcade="timing" ${s.daily.timing ? "disabled" : ""}><span>⏱</span><h2>10초 맞추기</h2><p>무료 · 하루 1회 · ${s.daily.timing ? "오늘 도전 완료" : "다이아 0~10개 / 장난감 0~5개"}</p></button><button class="destination" data-arcade="hex"><span>⬡</span><h2>오락하기!</h2><p>고양이 HEX FINALE · 참가비 15 G</p></button></div></div>`,
    renderWalk,
  );
  bind("arcade", (id) => {
    if (id === "timing") {
      renderTiming();
      return;
    }
    if (!["claw", "hex"].includes(id)) return;
    const fee = id === "claw" ? 20 : 15;
    if (!E.canAct(s) || !E.spend(s, fee)) {
      notice(`${fee} G와 건강한 춘배가 필요해.`);
      return;
    }
    s.arcadeSession = { type: id, token: crypto.randomUUID() };
    save();
    (id === "claw" ? renderClaw : renderHex)();
  });
}
function finishArcade(gold, diamonds, message, happy = true) {
  const s = player();
  if (!s.arcadeSession) return;
  s.gold += gold;
  s.diamonds += diamonds;
  s.earned.gold += gold;
  s.earned.diamonds += diamonds;
  s.arcadeSession = null;
  completeOuting();
  save();
  activeActivity = false;
  if (happy) meow(1.15);
  notice(
    `${message}${gold ? ` +${gold} G` : ""}${diamonds ? ` · 다이아 +${diamonds}` : ""}`,
  );
}
function cancelArcade() {
  const s = player();
  s.arcadeSession = null;
  save();
}
function renderClaw() {
  const s = player(),
    session = s.arcadeSession;
  let x = 200,
    y = 47,
    phase = "aim",
    caught = null,
    success = false,
    last = 0,
    raf,
    t = 0;
  const prizes = [
    { x: 70, kind: "diamond", value: 1, name: "다이아 1" },
    { x: 154, kind: "toy", value: 0, name: "깃털 낚싯대" },
    { x: 238, kind: "treat", value: 0, name: "참치 츄르" },
    { x: 322, kind: "diamond", value: 3, name: "다이아 3" },
    { x: 406, kind: "toy", value: 1, name: "털실공" },
    { x: 490, kind: "treat", value: 1, name: "연어 츄르" },
  ];
  const input = { left: false, right: false };
  gameShell(
    `<div class="neon-lobby">${title("CLAW MACHINE", "춘배의 집게손", "← → 또는 A/D로 이동하고 Space로 내려! 움직이는 선물의 도착 위치를 예상해 잡자! 집게가 닿는 순간 중심 ±6 안에 정확히!")}<div class="claw-machine"><canvas id="clawCanvas" width="560" height="350" class="mini-canvas" tabindex="0" aria-label="인형뽑기"></canvas><div id="clawFeedback" class="claw-feedback" role="status" hidden></div></div><p id="clawStatus" role="status">잡고 싶은 선물 위로 집게를 옮겨 봐.</p><div class="choice-row"><button class="btn" id="clawLeft">← 왼쪽</button><button class="btn primary" id="clawDrop">집게 내리기 · Space</button><button class="btn" id="clawRight">오른쪽 →</button></div><button class="text-button" id="clawExit">방앗간으로</button></div>`,
    () => {
      cancelArcade();
      renderArcade();
    },
  );
  activeActivity = true;
  const canvas = document.querySelector("#clawCanvas"),
    ctx = canvas.getContext("2d");
  function drop() {
    if (phase !== "aim") return;
    phase = "down";
    document.querySelector("#clawDrop").disabled = true;
  }

  function settle() {
    if (!s.arcadeSession || s.arcadeSession.token !== session.token) return;
    if (caught?.kind === "toy") {
      s.toyBag[caught.value] = (s.toyBag[caught.value] || 0) + 1;
      if (!s.toys.includes(caught.value)) s.toys.push(caught.value);
    }
    if (caught?.kind === "treat") s.treats[caught.value]++;
    finishArcade(
      0,
      caught?.kind === "diamond" ? caught.value : 0,
      success
        ? `${caught.name} 획득!`
        : "fail.. 집게가 허공을 잡았어. 다음엔 정중앙을 노려봐!",
      success,
    );
    document.querySelector("#clawStatus").textContent = success
      ? `${caught.name} 획득! 장난감·츄르는 보관함에 들어갔어.`
      : "fail.. 아깝다… 집게가 닿는 순간 중심을 정확히 맞춰줘.";
    phase = "done";
  }
  function frame(now) {
    const dt = Math.min(0.04, (now - last) / 1000 || 0);
    last = now;
    t += dt;
    if (["aim", "down"].includes(phase))
      for (let i = 0; i < prizes.length; i++) {
        const z = prizes[i];
        z.dir ??= i % 2 ? 1 : -1;
        z.x += z.dir * (210 + i * 11) * dt;
        if (z.x < 40) {
          z.x = 40;
          z.dir = 1;
        }
        if (z.x > 520) {
          z.x = 520;
          z.dir = -1;
        }
      }
    if (phase === "aim") {
      x = Math.max(
        40,
        Math.min(
          520,
          x + ((input.right ? 1 : 0) - (input.left ? 1 : 0)) * 155 * dt,
        ),
      );
    } else if (phase === "down") {
      y += 180 * dt;
      if (y >= 235) {
        y = 235;
        const nearest = prizes.reduce((a, b) =>
          Math.abs(a.x - x) < Math.abs(b.x - x) ? a : b,
        );
        success = Math.abs(nearest.x - x) <= 6;
        caught = success ? nearest : null;
        const feedback = document.querySelector("#clawFeedback");
        feedback.className =
          "claw-feedback " + (success ? "catch-success" : "catch-fail");
        feedback.innerHTML = success
          ? `<strong>CATCH!</strong><span>${caught.name} 제대로 잡았다!</span>${Array.from({ length: 12 }, (_, i) => `<i style="--i:${i}">✦</i>`).join("")}`
          : "<strong>fail..</strong><span>집게 사이로 빠져나갔어…</span>";
        feedback.hidden = false;
        document
          .querySelector(".claw-machine")
          .classList.toggle("is-failed", !success);
        document.querySelector("#clawStatus").textContent = success
          ? "CATCH! 놓치지 않고 끌어올리는 중!"
          : "fail.. 조금만 더 정확히 중심을 노려봐…";
        playEffect(success ? "victory" : "sad");
        phase = "up";
      }
    } else if (phase === "up") {
      y -= 140 * dt;
      if (y <= 47) {
        y = 47;
        phase = "carry";
      }
    } else if (phase === "carry") {
      x += 160 * dt;
      if (x >= 520) {
        x = 520;
        phase = "release";
      }
    } else if (phase === "release") {
      y += 190 * dt;
      if (y > 285) settle();
    }
    ctx.fillStyle = "#121b34";
    ctx.fillRect(0, 0, 560, 350);
    ctx.strokeStyle = "#ff7dcb";
    ctx.lineWidth = 6;
    ctx.strokeRect(10, 10, 540, 330);
    ctx.fillStyle = "#293755";
    ctx.fillRect(20, 270, 520, 60);
    ctx.fillStyle = "#d8c1df";
    ctx.fillRect(490, 275, 48, 50);
    ctx.fillStyle = "#101b32";
    ctx.fillRect(495, 280, 38, 35);
    for (const p of prizes) {
      if (caught === p && ["up", "carry", "release", "done"].includes(phase))
        continue;
      drawPrize(ctx, p.kind, p.value, p.x, 250, 1);
    }
    if (caught && ["up", "carry", "release"].includes(phase))
      drawPrize(ctx, caught.kind, caught.value, x, y + 32, 0.8);
    ctx.strokeStyle = "#71e9ef";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x, 22);
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.fillStyle = "#ffe0a3";
    ctx.fillRect(x - 9, y, 18, 12);
    ctx.beginPath();
    ctx.moveTo(x - 6, y + 10);
    ctx.lineTo(x - (caught ? 8 : 17), y + 28);
    ctx.lineTo(x - 8, y + 34);
    ctx.moveTo(x + 6, y + 10);
    ctx.lineTo(x + (caught ? 8 : 17), y + 28);
    ctx.lineTo(x + 8, y + 34);
    ctx.strokeStyle = "#ffe0a3";
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.fillStyle = "#7dffdc";
    for (let i = 0; i < 16; i++)
      if (Math.floor(t * 3 + i) % 3) ctx.fillRect(22 + i * 33, 17, 6, 5);
    raf = requestAnimationFrame(frame);
  }
  function drawPrize(c, kind, value, x, y, k) {
    c.save();
    c.translate(x, y);
    c.scale(k, k);
    c.fillStyle =
      kind === "diamond" ? "#7ee6f4" : kind === "toy" ? "#e9b888" : "#ee95b9";
    if (kind === "diamond") {
      c.beginPath();
      c.moveTo(0, -16);
      c.lineTo(13, 0);
      c.lineTo(0, 16);
      c.lineTo(-13, 0);
      c.closePath();
      c.fill();
    } else if (kind === "toy") drawCat(c, 0, 0, 0.55);
    else {
      c.fillRect(-8, -20, 16, 35);
      c.fillStyle = "#fff0d5";
      c.fillRect(-8, -7, 16, 9);
    }
    c.restore();
  }
  const down = (e) => {
      if (["ArrowLeft", "KeyA", "ArrowRight", "KeyD", "Space"].includes(e.code))
        e.preventDefault();
      if (["ArrowLeft", "KeyA"].includes(e.code)) input.left = true;
      if (["ArrowRight", "KeyD"].includes(e.code)) input.right = true;
      if (e.code === "Space" && !e.repeat) drop();
    },
    up = (e) => {
      if (["ArrowLeft", "KeyA"].includes(e.code)) input.left = false;
      if (["ArrowRight", "KeyD"].includes(e.code)) input.right = false;
    };
  window.addEventListener("keydown", down);
  window.addEventListener("keyup", up);
  const blur = () => {
    input.left = input.right = false;
  };
  window.addEventListener("blur", blur);
  for (const [id, dir] of [
    ["clawLeft", "left"],
    ["clawRight", "right"],
  ]) {
    const b = document.getElementById(id);
    b.onpointerdown = (e) => {
      e.preventDefault();
      b.setPointerCapture(e.pointerId);
      input[dir] = true;
    };
    b.onpointerup =
      b.onpointercancel =
      b.onlostpointercapture =
        () => (input[dir] = false);
  }
  document.querySelector("#clawDrop").onclick = drop;
  document.querySelector("#clawExit").onclick = () => {
    if (leaveGame()) {
      cancelArcade();
      renderArcade();
    }
  };
  raf = requestAnimationFrame(frame);
  setCleanup(() => {
    cancelAnimationFrame(raf);
    window.removeEventListener("keydown", down);
    window.removeEventListener("keyup", up);
    window.removeEventListener("blur", blur);
    cancelArcade();
  });
  canvas.focus({ preventScroll: true });
}
function renderTiming() {
  const s = player();
  let running = false,
    token = null,
    started = 0,
    raf = 0,
    settled = false;
  gameShell(
    `${title("TEN SECOND CHALLENGE", "10초 맞추기", "시작을 누른 뒤 10초에 정확히 멈춰!")}<div class="timer-stage"><div class="timer-clock" id="timingClock">0.000</div><progress id="timingProgress" max="10.5" value="0"></progress><p>성공 범위 9.900~10.100초 · 10.5초를 넘으면 자동 실패</p><button class="btn primary wide" id="timingStart" ${s.daily.timing || !E.canAct(s) ? "disabled" : ""}>${s.daily.timing ? "오늘 도전 완료" : "시작! · 무료 · 하루 1회"}</button><button class="btn wide" id="timingStop" disabled>멈춰!</button><div id="timingResult" role="status"></div></div><p class="note">성공하면 다이아 0~10개와 장난감 0~5개를 무작위로 받아. 둘 다 0일 수도 있어.<br>시작하면 오늘 횟수가 소모돼. 중간에 나가거나 새로고침해도 다시 도전할 수 없어.</p>`,
    renderArcade,
  );
  function finish() {
    if (!running || settled) return;
    const elapsed = (performance.now() - started) / 1000;
    settled = true;
    running = false;
    cancelAnimationFrame(raf);
    const result = E.finishTiming(s, token, elapsed);
    if (!result) return;
    activeActivity = false;
    save();
    completeOuting();
    document.querySelector("#timingClock").textContent = elapsed.toFixed(3);
    document.querySelector("#timingStop").disabled = true;
    document.querySelector("#timingResult").innerHTML =
      `<h2>${result.success ? "PERFECT!" : "아깝다…"}</h2><p>${elapsed.toFixed(3)}초 · ${result.success ? `다이아 +${result.diamonds}개 / 장난감 ${result.toys.length}개` : "경품은 없지만 다음 날 다시 도전해 봐!"}</p>${result.toys.map((i) => `<span class="timer-prize">${E.toys[i].name}</span>`).join("")}`;
    playEffect(result.success ? "victory" : "sad");
    notice(`10초 맞추기 ${result.success ? "성공!" : "실패…"}`);
  }
  function frame() {
    if (!running) return;
    const elapsed = (performance.now() - started) / 1000;
    document.querySelector("#timingClock").textContent = elapsed.toFixed(3);
    document.querySelector("#timingProgress").value = elapsed;
    if (elapsed >= 10.5) {
      finish();
      return;
    }
    raf = requestAnimationFrame(frame);
  }
  document.querySelector("#timingStart").onclick = () => {
    token = crypto.randomUUID();
    if (!E.startTiming(s, token)) return;
    running = true;
    activeActivity = true;
    started = performance.now();
    save();
    document.querySelector("#timingStart").disabled = true;
    document.querySelector("#timingStop").disabled = false;
    raf = requestAnimationFrame(frame);
  };
  document.querySelector("#timingStop").onclick = finish;
  setCleanup(() => {
    cancelAnimationFrame(raf);
    if (s.arcadeSession?.token === token) {
      s.arcadeSession = null;
      save();
    }
  });
}
function renderHex() {
  const s = player(),
    session = { ...s.arcadeSession },
    startedAt = performance.now();
  gameShell(
    `${title("AFTERGLOW × PETOPIA", "오락하기!", "A/D 회전 · P 일시정지 · 큰 고양이를 중심으로 작은 고양이가 달려!")}<iframe id="hexFrame" class="hex-frame" title="고양이 HEX FINALE" src="games/hex.html?session=${session.token}" allow="autoplay"></iframe><button class="btn wide" id="hexExit">방앗간으로</button><p class="note">30초 생존 → 다이아 1 · 120초 생존 → 다이아 3. 결과는 슬롯에 한 번만 지급돼.</p>`,
    () => {
      cancelArcade();
      renderArcade();
    },
  );
  activeActivity = true;
  const frame = document.querySelector("#hexFrame");
  frame.onload = () =>
    frame.contentWindow.postMessage(
      { type: "petopia-mute", muted: !sound },
      location.origin === "null" ? "*" : location.origin,
    );
  document.querySelector("#hexExit").onclick = () => {
    cancelArcade();
    renderArcade();
  };
  let accepted = false;
  function receive(e) {
    if (
      (location.origin !== "null" && e.origin !== location.origin) ||
      e.source !== frame.contentWindow
    )
      return;
    const d = e.data;
    if (d?.type === "petopia-hex-exit") {
      cancelArcade();
      renderArcade();
      return;
    }
    if (
      d?.type !== "petopia-hex-result" ||
      accepted ||
      d.token !== session.token ||
      s.arcadeSession?.token !== session.token
    )
      return;
    const time = Number(d.time);
    if (
      !Number.isFinite(time) ||
      time < 0 ||
      time > 161 ||
      time > (performance.now() - startedAt) / 1000 + 1
    )
      return;
    accepted = true;
    finishArcade(
      10 + Math.floor(time / 5),
      time >= 120 ? 3 : time >= 30 ? 1 : 0,
      "HEX 플레이 완료!",
    );
  }
  window.addEventListener("message", receive);
  setCleanup(() => {
    window.removeEventListener("message", receive);
    cancelArcade();
  });
}
function renderCasino() {
  const s = player();
  gameShell(
    `<div class="casino-lobby">${title("JOKER’S CAT CASINO", "춘배 카지노", "조커의남자는 졌지만 영업은 계속됩니다.")}<div class="neon-sign">LUCKY PAWS CLUB ♠</div><div class="destination-grid"><button class="destination" data-casino="slot"><span>🎰</span><h2>냥슬롯</h2><p>7가지 그림 · 777 20배 / 잭팟 100배</p></button><button class="destination" data-casino="roulette"><span>◉</span><h2>냥룰렛</h2><p>빨강·검정 2배 / 초록 30배</p></button></div><p class="note">금화 전용 · 최소 10 G / 보유 금화까지 자유 배팅 · 배당은 건 금액 포함 총액.<br>카지노는 다이아를 지급하지 않아. 날짜·자산 수입과 별개의 금화 게임이야.</p></div>`,
    renderGambling,
  );
  bind("casino", (id) => (id === "slot" ? renderSlot() : renderRoulette()));
}
function betInput() {
  return '<label class="field-label">베팅 금화<input id="betAmount" type="number" min="10" step="1" value="10"></label>';
}
function getBet() {
  const n = Number(document.querySelector("#betAmount").value);
  return Number.isSafeInteger(n) &&
    n >= 10 &&
    n <= Math.floor(Number.MAX_SAFE_INTEGER / 100)
    ? n
    : null;
}
const SLOT_SYMBOLS = [
  "🐱",
  "🐟",
  '<svg class="slot-icon" viewBox="0 0 64 64" role="img" aria-label="츄르"><path d="M19 5H45L41 59H23Z" fill="#f39ac2" stroke="#753b69" stroke-width="3"/><path d="M20 13H44M24 49H40" stroke="#fff0ce" stroke-width="4"/><text x="32" y="37" text-anchor="middle" font-size="18" fill="#613c42">츄</text></svg>',
  "🥫",
  "🐾",
  '<b class="slot-seven">7</b>',
  '<svg class="slot-icon jackpot-icon" viewBox="0 0 64 64" role="img" aria-label="잭팟"><path d="M5 20L17 30L32 8L47 30L59 20L53 49H11Z" fill="#ffce4c" stroke="#8b4b21" stroke-width="3"/><path d="M13 55H51" stroke="#ffdc68" stroke-width="5"/><text x="32" y="43" text-anchor="middle" font-weight="bold" font-size="20" fill="#9d304e">J</text></svg>',
];
function renderSlot() {
  const s = player();
  gameShell(
    `<div class="casino-lobby">${title("THREE LITTLE TROUBLEMAKERS", "냥슬롯", "먹거리부터 777, 황금 왕관 잭팟까지! 오늘의 운을 뽑아 보자.")}<div class="slot-reels" aria-live="polite"><span>🐱</span><span>🐟</span><span>🐾</span></div>${betInput()}<p>777: 20배 · 황금 왕관 3개: 100배 잭팟!<br>같은 그림 정확히 2개는 원금 반환 · 배당은 원금 포함</p><details class="slot-odds"><summary>배당·확률표 · 평균 환급률 90%</summary><table><thead><tr><th>조합</th><th>배당</th><th>확률</th></tr></thead><tbody>${E.slotTable.map((o) => `<tr><td>${o.label}</td><td>${o.multiplier}배</td><td>${(o.weight / 100).toFixed(2)}%</td></tr>`).join("")}</tbody></table><p>결과별 가중 확률 · 매 판 독립 추첨 · 당첨 횟수 보장 없음</p></details><button class="btn primary wide" id="spinSlot">돌리기</button><p id="slotResult" class="game-notice" role="status">집사가 번 돈이다. 신중하게 냥.</p></div>`,
    renderCasino,
  );
  document.querySelector("#spinSlot").onclick = () => {
    document
      .querySelector(".slot-reels")
      ?.classList.remove("mega-jackpot", "lucky-seven");
    const bet = getBet();
    if (!bet) {
      notice("베팅은 10 G 이상 정수로, 가진 금화 안에서 골라줘.");
      return;
    }
    const outcome = E.slot(s, bet);
    if (!outcome) {
      notice("금화가 부족해.");
      return;
    }
    const symbols = SLOT_SYMBOLS,
      result = outcome.symbols,
      multiplier = outcome.multiplier,
      payout = outcome.payout;
    save();
    activeActivity = true;
    document.querySelector("#spinSlot").disabled = true;
    let ticks = 0;
    const timer = setInterval(() => {
      document
        .querySelectorAll(".slot-reels span")
        .forEach(
          (el, i) =>
            (el.innerHTML =
              ticks < 10
                ? symbols[Math.floor(Math.random() * symbols.length)]
                : symbols[result[i]]),
        );
      ticks++;
      if (ticks > 10) {
        clearInterval(timer);
        activeActivity = false;
        document.querySelector("#spinSlot").disabled = false;
        document.querySelector("#slotResult").textContent =
          `${payout ? `${multiplier}배 당첨! ${payout} G 지급` : "꽝! 춘배: 원래 그런 거야."} · 잔액 ${money(s.gold)} G`;
        document.querySelector(".wallet span").textContent =
          `◈ ${money(s.gold)} G`;
        completeOuting();
        if (multiplier >= 20) {
          const reels = document.querySelector(".slot-reels");
          reels.classList.add(
            multiplier === 100 ? "mega-jackpot" : "lucky-seven",
          );
          playEffect("victory");
        } else if (payout) meow();
      }
    }, 90);
    setCleanup(() => clearInterval(timer));
  };
}
function renderRoulette() {
  const s = player();
  gameShell(
    `<div class="casino-lobby">${title("THIRTY-ONE CHANCES", "냥룰렛", "빨강 15칸 · 검정 15칸 · 초록 1칸. 고양이 공은 어디에 멈출까?")}<div class="roulette-stage"><div id="rouletteWheel" class="roulette-wheel"><span>♠</span></div><span class="cat-ball">🐱</span><span class="wheel-pointer">▼</span></div>${betInput()}<div class="bet-colors"><button data-color="red" class="red selected">빨강 · 2배</button><button data-color="black" class="black">검정 · 2배</button><button data-color="green" class="green">초록 · 30배</button></div><button class="btn primary wide" id="spinRoulette">고양이 공 굴리기</button><p id="rouletteResult" class="game-notice" role="status">배당은 원금을 포함해. 초록 확률은 1/31이야.</p></div>`,
    renderCasino,
  );
  let color = "red",
    rotation = 0;
  const wheel = document.querySelector("#rouletteWheel"),
    segments = Array.from(
      { length: 31 },
      (_, i) =>
        `${i === 30 ? "#6ea779" : i % 2 ? "#343844" : "#c77e79"} ${(i * 360) / 31}deg ${((i + 1) * 360) / 31}deg`,
    );
  wheel.style.background = `conic-gradient(${segments.join(",")})`;
  bind("color", (value, b) => {
    color = value;
    document
      .querySelectorAll("[data-color]")
      .forEach((btn) => btn.classList.remove("selected"));
    b.classList.add("selected");
  });
  document.querySelector("#spinRoulette").onclick = () => {
    document
      .querySelector(".slot-reels")
      ?.classList.remove("mega-jackpot", "lucky-seven");
    const bet = getBet();
    if (!bet) {
      notice("10 G 이상 정수 금액을 골라줘.");
      return;
    }
    const result = E.roulette(s, color, bet);
    if (!result) {
      notice("금화가 부족해.");
      return;
    }
    save();
    activeActivity = true;
    document.querySelector("#spinRoulette").disabled = true;
    document
      .querySelectorAll("[data-color]")
      .forEach((b) => (b.disabled = true));
    rotation +=
      1440 + (360 - ((result.slot + 0.5) * 360) / 31) - (rotation % 360);
    wheel.style.transform = `rotate(${rotation}deg)`;
    const timer = setTimeout(() => {
      activeActivity = false;
      document.querySelector("#spinRoulette").disabled = false;
      document
        .querySelectorAll("[data-color]")
        .forEach((b) => (b.disabled = false));
      document.querySelector("#rouletteResult").textContent =
        `${{ red: "빨강", black: "검정", green: "초록" }[result.color]}! ${result.won ? `${result.payout} G 지급!` : "이번 판은 아쉽게 꽝."} · 잔액 ${money(s.gold)} G`;
      document.querySelector(".wallet span").textContent =
        `◈ ${money(s.gold)} G`;
      completeOuting();
      if (result.won) meow();
    }, 2400);
    setCleanup(() => clearTimeout(timer));
  };
}
