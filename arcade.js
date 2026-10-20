function renderArcade() {
  gameShell(
    `<div class="neon-lobby">${title("OPEN ALL NIGHT · CLOSED WHEN SLEEPY", "방앗간 ARCADE", "집사는 여길 그냥 방앗간이라고 부른다.")}<div class="neon-sign">MEOW • PLAY • REPEAT</div><div class="destination-grid three"><button class="destination" data-arcade="claw"><span>♙</span><h2>인형뽑기</h2><p>직접 집게 조작<br>다이아 · 장난감 · 츄르</p></button><button class="destination" data-arcade="rhythm"><span>♫</span><h2>리듬게임</h2><p>D F J K · 4키<br>정확히 맞춰 다이아 획득</p></button><button class="destination" data-arcade="hex"><span>⬡</span><h2>오락하기!</h2><p>네가 만든 HEX FINALE<br>큰 고양이와 작은 고양이</p></button></div><p class="note">산책 입장 때 기력 25를 사용했어. 각 게임은 금화 참가비만 사용. 나가거나 새로고침하면 진행 중인 판은 종료돼.</p></div>`,
    renderWalk,
  );
  bind("arcade", (id) => {
    const s = player(),
      fee = id === "claw" ? 20 : 15;
    if (!E.canAct(s) || !E.spend(s, fee)) {
      notice(`${fee} G가 필요해. 춘배 건강 상태도 확인해 줘.`);
      return;
    }
    s.arcadeSession = { type: id, token: crypto.randomUUID() };
    save();
    ({ claw: renderClaw, rhythm: renderRhythm, hex: renderHex })[id]();
  });
}
function finishArcade(gold, diamonds, message) {
  const s = player();
  if (!s.arcadeSession) return;
  s.gold += gold;
  s.diamonds += diamonds;
  s.arcadeSession = null;
  completeOuting();
  save();
  activeActivity = false;
  meow(1.15);
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
    `<div class="neon-lobby">${title("CLAW MACHINE", "춘배의 집게손", "← → 또는 A/D로 이동하고 Space로 내려! 정중앙 ±13이면 확정 성공.")}<canvas id="clawCanvas" width="560" height="350" class="mini-canvas" tabindex="0" aria-label="인형뽑기"></canvas><p id="clawStatus" role="status">잡고 싶은 선물 위로 집게를 옮겨 봐.</p><div class="choice-row"><button class="btn" id="clawLeft">← 왼쪽</button><button class="btn primary" id="clawDrop">집게 내리기 · Space</button><button class="btn" id="clawRight">오른쪽 →</button></div><button class="text-button" id="clawExit">방앗간으로</button></div>`,
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
    const nearest = prizes.reduce((a, b) =>
      Math.abs(a.x - x) < Math.abs(b.x - x) ? a : b,
    );
    const distance = Math.abs(nearest.x - x);
    success = distance <= 13 || (distance <= 23 && Math.random() < 0.35);
    caught = success ? nearest : null;
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
        : "앗, 집게가 허공을 잡았어. 다음엔 정중앙을 노려봐!",
    );
    document.querySelector("#clawStatus").textContent = success
      ? `${caught.name} 획득! 장난감·츄르는 보관함에 들어갔어.`
      : "놓쳤다! 정중앙을 잡으면 확정 성공이야.";
    phase = "done";
  }
  function frame(now) {
    const dt = Math.min(0.04, (now - last) / 1000 || 0);
    last = now;
    t += dt;
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
    ctx.lineTo(x - 17, y + 28);
    ctx.lineTo(x - 8, y + 34);
    ctx.moveTo(x + 6, y + 10);
    ctx.lineTo(x + 17, y + 28);
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
function renderRhythm() {
  const s = player(),
    music = new Audio("assets/afterglow.mp3");
  music.volume = 0.3;
  let started = false,
    elapsed = 0,
    last = 0,
    raf,
    hits = 0,
    combo = 0,
    best = 0,
    done = false,
    paused = false,
    judge = "준비되면 시작!",
    flash = [0, 0, 0, 0];
  const notes = Array.from({ length: 48 }, (_, i) => ({
    at: 2 + i * 0.5,
    lane: (i * 7 + Math.floor(i / 4)) % 4,
    hit: false,
    miss: false,
  }));
  gameShell(
    `<div class="neon-lobby">${title("FOUR PAWS RHYTHM", "냥냥 비트", "D F J K 또는 아래 패드를 누르자. 판정선 ±0.16초 안에 맞히기!")}<div class="rhythm-score" id="rhythmScore">0 / 48 · COMBO 0</div><canvas id="rhythmCanvas" width="480" height="390" class="mini-canvas"></canvas><p id="rhythmJudge">준비되면 시작!</p><button class="btn primary wide" id="rhythmStart">시작 / 계속하기</button><div class="rhythm-pads">${["D", "F", "J", "K"].map((k, i) => `<button class="btn" data-lane="${i}">${k}</button>`).join("")}</div></div>`,
    () => {
      cancelArcade();
      renderArcade();
    },
  );
  activeActivity = true;
  const ctx = document.querySelector("#rhythmCanvas").getContext("2d");
  const onSound = () => (music.muted = !sound);
  window.addEventListener("petopia-sound", onSound);
  function hit(lane) {
    if (!started || done || paused) return;
    const note = notes
      .filter((n) => n.lane === lane && !n.hit && !n.miss)
      .sort((a, b) => Math.abs(a.at - elapsed) - Math.abs(b.at - elapsed))[0];
    flash[lane] = 0.15;
    if (note && Math.abs(note.at - elapsed) <= 0.16) {
      note.hit = true;
      hits++;
      combo++;
      best = Math.max(best, combo);
      judge = Math.abs(note.at - elapsed) < 0.08 ? "PERFECT!" : "GOOD!";
      clickSound();
    } else {
      combo = 0;
      judge = "조금만 더 박자에 맞춰봐!";
    }
  }
  function finish() {
    done = true;
    music.pause();
    const accuracy = hits / 48,
      diamonds = accuracy >= 0.85 ? 3 : accuracy >= 0.5 ? 1 : 0;
    finishArcade(
      10 + Math.floor(hits / 3),
      diamonds,
      `리듬 완료! 정확도 ${Math.round(accuracy * 100)}%`,
    );
    document.querySelector("#rhythmJudge").textContent =
      `완료! ${hits}/48 · 최대 콤보 ${best} · 다이아 +${diamonds}`;
    document.querySelector("#rhythmStart").disabled = true;
  }
  function frame(now) {
    const dt = Math.min(0.04, (now - last) / 1000 || 0);
    last = now;
    if (started && !paused && !done) {
      elapsed = music.currentTime;
      for (const n of notes)
        if (!n.hit && !n.miss && elapsed > n.at + 0.16) {
          n.miss = true;
          combo = 0;
          judge = "MISS";
        }
      if (elapsed > 26.5) finish();
    }
    ctx.fillStyle = "#131d35";
    ctx.fillRect(0, 0, 480, 390);
    for (let i = 0; i < 4; i++) {
      flash[i] = Math.max(0, flash[i] - dt);
      ctx.fillStyle = flash[i] ? "#644d7e" : "#1c2c46";
      ctx.fillRect(i * 120 + 4, 0, 112, 390);
      ctx.fillStyle = ["#75e5e5", "#f19fce", "#ecc880", "#9dacf3"][i];
      ctx.fillRect(i * 120 + 8, 323, 104, 4);
    }
    for (const n of notes) {
      if (n.hit || n.miss) continue;
      const y = 325 - (n.at - elapsed) * 180;
      if (y < 0 || y > 360) continue;
      ctx.fillStyle = ["#75e5e5", "#f19fce", "#ecc880", "#9dacf3"][n.lane];
      ctx.fillRect(n.lane * 120 + 15, y - 8, 90, 16);
    }
    document.querySelector("#rhythmScore").textContent =
      `${hits} / 48 · COMBO ${combo}`;
    if (!done)
      document.querySelector("#rhythmJudge").textContent = paused
        ? "일시정지. 계속하기를 눌러 줘."
        : judge;
    raf = requestAnimationFrame(frame);
  }
  const keys = ["KeyD", "KeyF", "KeyJ", "KeyK"],
    keydown = (e) => {
      if (keys.includes(e.code)) {
        e.preventDefault();
        if (!e.repeat) hit(keys.indexOf(e.code));
      }
    },
    blur = () => {
      if (started && !done) {
        paused = true;
        music.pause();
      }
    };
  window.addEventListener("keydown", keydown);
  window.addEventListener("blur", blur);
  const visibility = () => {
    if (document.hidden) blur();
  };
  document.addEventListener("visibilitychange", visibility);
  document.querySelector("#rhythmStart").onclick = () => {
    music.muted = !sound;
    music
      .play()
      .then(() => {
        started = true;
        paused = false;
        judge = "비트를 따라가자!";
      })
      .catch(() => notice("음악 재생을 허용하고 다시 눌러줘."));
  };
  bind("lane", (i) => hit(Number(i)));
  raf = requestAnimationFrame(frame);
  setCleanup(() => {
    window.removeEventListener("petopia-sound", onSound);
    music.pause();
    music.src = "";
    cancelAnimationFrame(raf);
    window.removeEventListener("keydown", keydown);
    window.removeEventListener("blur", blur);
    document.removeEventListener("visibilitychange", visibility);
    cancelArcade();
  });
}
function renderHex() {
  const s = player(),
    session = { ...s.arcadeSession },
    startedAt = performance.now();
  gameShell(
    `${title("AFTERGLOW × PETOPIA", "오락하기!", "A/D 회전 · P 일시정지 · 큰 고양이를 중심으로 작은 고양이가 달려!")}<iframe id="hexFrame" class="hex-frame" title="고양이 HEX FINALE" src="games/hex.html?session=${session.token}" allow="autoplay"></iframe><p class="note">30초 생존 → 다이아 1 · 120초 생존 → 다이아 3. 결과는 슬롯에 한 번만 지급돼.</p>`,
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
  let accepted = false;
  function receive(e) {
    if (e.origin !== location.origin || e.source !== frame.contentWindow)
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
    `<div class="casino-lobby">${title("JOKER’S CAT CASINO", "춘배 카지노", "조커의남자는 졌지만 영업은 계속됩니다.")}<div class="neon-sign">LUCKY PAWS CLUB ♠</div><div class="destination-grid"><button class="destination" data-casino="slot"><span>🎰</span><h2>냥슬롯</h2><p>그림 3개 · 배당 최대 10배</p></button><button class="destination" data-casino="roulette"><span>◉</span><h2>냥룰렛</h2><p>빨강·검정 2배 / 초록 30배</p></button></div><p class="note">금화 전용 · 최소 10 / 최대 500 G · 배당은 건 금액 포함 총액.<br>카지노는 다이아를 지급하지 않아. 날짜·자산 수입과 별개의 금화 게임이야.</p></div>`,
    renderWalk,
  );
  bind("casino", (id) => (id === "slot" ? renderSlot() : renderRoulette()));
}
function betInput() {
  return '<label class="field-label">베팅 금화<input id="betAmount" type="number" min="10" max="500" step="10" value="10"></label>';
}
function getBet() {
  const n = Number(document.querySelector("#betAmount").value);
  return Number.isInteger(n) && n >= 10 && n <= 500 ? n : null;
}
function renderSlot() {
  const s = player();
  gameShell(
    `<div class="casino-lobby">${title("THREE LITTLE TROUBLEMAKERS", "냥슬롯", "츄르·생선·춘배·발바닥. 오늘의 운을 뽑아 보자.")}<div class="slot-reels" aria-live="polite"><span>🐱</span><span>🐟</span><span>🐾</span></div>${betInput()}<p>같은 그림 3개: 10배 · 2개: 원금 반환 · 나머지: 꽝</p><button class="btn primary wide" id="spinSlot">돌리기</button><p id="slotResult" class="game-notice" role="status">집사가 번 돈이다. 신중하게 냥.</p></div>`,
    renderCasino,
  );
  document.querySelector("#spinSlot").onclick = () => {
    const bet = getBet();
    if (!bet) {
      notice("베팅은 10~500 G, 가진 금화 안에서 골라줘.");
      return;
    }
    const outcome = E.slot(s, bet);
    if (!outcome) {
      notice("금화가 부족해.");
      return;
    }
    const symbols = ["🐱", "🐟", "🐾", "▰", "🧶"],
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
            (el.textContent =
              ticks < 10
                ? symbols[Math.floor(Math.random() * 5)]
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
        if (payout) meow();
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
    const bet = getBet();
    if (!bet) {
      notice("10~500 사이 정수 금액을 골라줘.");
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
