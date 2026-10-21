/* Landscape room: full-viewport walkable world and a sliding activity drawer. */
const FIELD_MENUS = [
  ["dungeon", "⚔", "냥서바이벌", "기력 −50 · 하루 1회 · 행복도 20 이상"],
  ["romance", "♡", "연애", "선물 0 · 다른 행동 기력 −25"],
  ["idle", "⚑", "춘배 원정대", "자동사냥 · 오프라인 8시간"],
  ["influencer", "✦", "인플루언서냥", "하루 첫 활동 기력 −25 · 이후 0"],
  ["work", "▣", "주인 노동시키기", "기력 −50 · 하루 1회"],
  ["walk", "♧", "힐링하기", "각각 하루 1회 · 주말 낮잠 무료"],
  ["gambling", "♠", "도박하기", "강화 · 카지노"],
  ["bank", "♜", "펫은행", "대출 · 투자 · 집"],
];
function renderFieldHome() {
  cleanupView();
  const s = player(),
    c = E.calendar(s.day),
    married = s.romance?.stage >= 2;
  document.body.dataset.screen = "game";
  document.body.dataset.view = "field";
  app.innerHTML = `<section class="game-shell field-shell" aria-label="춘배의 방 필드">
    <canvas id="homeFieldCanvas" tabindex="0" aria-label="춘배의 방. WASD 또는 방향키로 이동하고, 메뉴 버튼으로 활동을 선택하세요."></canvas>
    <div class="field-vignette"></div>
    <div class="game-top field-topbar"><div class="field-location"><button class="back" id="gameBack" aria-label="슬롯 선택으로">←</button><div><strong role="heading" aria-level="1">춘배의 방</strong><span id="fieldHouseName"></span></div></div><div class="day-label">${c.season} ${c.date} (${c.weekday}) <button id="calendarButton" aria-label="달력 열기">📅</button><span class="field-weather">${s.weather === "rain" ? "비 오는 날" : "맑은 날"}</span></div><div class="wallet"><span class="wallet-gold">◈ ${money(s.gold)} G</span><span class="wallet-diamonds">◆ ${s.diamonds}</span><span>기력 ${s.energy}/100</span></div></div>
    <button class="field-menu-toggle" id="fieldMenuToggle" aria-controls="fieldDrawer" aria-expanded="false">☰ <span>메뉴</span></button>
    <div class="field-tools"><button id="fieldSound" aria-label="효과음 켜고 끄기"></button><button id="fieldFullscreen" aria-label="전체화면 전환">⛶</button></div>
    <div class="field-hud"><div class="status-strip stats-six home-stats"><div><small>행복도</small><strong>${s.happiness}/100</strong><span>70↑ +20% · 100 +50%</span></div><div><small>유명세</small><strong>${money(s.followers + s.liveFollowers)}</strong><span>펫스타 + Live</span></div><div><small>수입 보너스</small><strong>+${(E.bonus(s) * 100).toFixed(1)}%</strong><span>각 보너스 곱연산</span></div></div><button class="btn field-pet" id="petChunbae" ${s.daily.pet ? "disabled" : ""}>${s.daily.pet ? "♡ 오늘 쓰다듬기 완료" : "♡ 쓰다듬기 +5 · 하루 1번"}</button></div>
    <div class="field-navigation"><div class="field-dpad" aria-label="춘배 이동"><button data-field-move="up" aria-label="위로 이동">▲</button><button data-field-move="left" aria-label="왼쪽으로 이동">◀</button><button data-field-move="down" aria-label="아래로 이동">▼</button><button data-field-move="right" aria-label="오른쪽으로 이동">▶</button></div><small>WASD / 방향키 · 바닥 터치</small></div>
    <button class="btn field-interact" id="fieldInteract" hidden></button>
    <p class="field-orientation-hint">↻ 가로로 돌리면 더 넓게 보여!</p>
    <aside class="field-drawer" id="fieldDrawer" aria-label="춘배의 방 메뉴" aria-hidden="true" inert><div class="field-drawer-head"><div><small>CHUNBAE’S LITTLE WORLD</small><h2>오늘의 냥생</h2></div><button id="fieldMenuClose" aria-label="메뉴 닫기">✕</button></div><div class="field-drawer-scroll">
      <p class="field-owner"></p><div class="daily-strip"><span>던전 ${1 - s.daily.dungeon}/1 남음</span><span>힐링 ${4 - s.daily.walk - s.daily.drive - s.daily.arcade - s.daily.nap}/4 남음</span><span>펫스타 ${1 - s.daily.star}/1 남음</span><span>Live ${Math.max(0, 3 - s.day + s.liveDay) ? `${3 - s.day + s.liveDay}일 후` : "가능"}</span></div>
      <nav class="activity-grid eight-activities">${FIELD_MENUS.map(([id, icon, name, desc]) => `<button class="activity ${["dungeon", "romance"].includes(id) ? "adventure" : ""}" data-menu="${id}"><span class="activity-icon">${icon}</span><span><strong>${name}</strong><small>${desc}</small></span></button>`).join("")}</nav>
      <nav class="screen-tools" aria-label="보조 메뉴"><button data-utility="mart">▤ 펫마트</button><button data-utility="inventory">▤ 인벤토리</button><button data-utility="hospital">✚ 펫병원</button><button id="dayButton" ${!E.canSleep(s) ? "disabled" : ""}>☾ 잠자기 · 기력 25 이하</button><button data-utility="settings">⚙ 설정</button></nav>
      ${dailyEventPanel(s)}<details class="field-bonus-help"><summary>수입 보너스 안내</summary><p>행복도 0~69: 없음 / 70~99: +20% / 100: +50%<br>유명세 × 행복도 × 연애 × 집<br>주인 일당: +${((1 + E.bonus(s)) * (1 + E.vehicleBonus(s)) * 100 - 100).toFixed(1)}% · 탈것 추가 곱연산</p></details>
      <section class="activity-journal" aria-label="냥생 기록"><h2>냥생 기록</h2><div class="daily-log" id="activityLog"></div></section>${guidePanel()}</div></aside>
  </section>`;
  document.querySelector("#fieldHouseName").textContent =
    E.houses[s.house].name;
  document.querySelector(".field-owner").textContent =
    `SLOT ${selectedSlot + 1} · ${s.ownerName || "이름 없는"} 집사`;
  const model = new HomeFieldModel(s.house, s.homeField, married),
    canvas = document.querySelector("#homeFieldCanvas"),
    ctx = canvas.getContext("2d"),
    drawer = document.querySelector("#fieldDrawer"),
    toggle = document.querySelector("#fieldMenuToggle");
  s.homeField = model.snapshot();
  const actions = {
    dungeon: renderDungeons,
    romance: renderRomance,
    idle: renderIdleHunt,
    influencer: renderInfluencer,
    work: renderWork,
    walk: renderWalk,
    gambling: renderGambling,
    bank: renderBank,
    mart: renderMart,
    inventory: renderInventory,
    hospital: renderHospital,
    settings,
    sleep,
  };
  let menuOpen = false,
    stopped = false,
    raf,
    last = 0,
    dirty = true,
    autosaveAt = 0,
    petUntil = 0;
  const keys = {};
  function clearKeys() {
    for (const key of Object.keys(keys)) keys[key] = false;
    model.target = null;
    document
      .querySelectorAll("[data-field-move]")
      .forEach((b) => b.classList.remove("pressed"));
  }
  function persist() {
    s.homeField = model.snapshot();
    save();
    dirty = false;
  }
  function menu(open) {
    menuOpen = open;
    clearKeys();
    drawer.classList.toggle("is-open", open);
    drawer.inert = !open;
    drawer.setAttribute("aria-hidden", String(!open));
    toggle.setAttribute("aria-expanded", String(open));
    toggle.innerHTML = open ? "✕ <span>닫기</span>" : "☰ <span>메뉴</span>";
    if (open)
      document.querySelector("#fieldMenuClose").focus({ preventScroll: true });
    else canvas.focus({ preventScroll: true });
  }
  function act(id) {
    clearKeys();
    if (id === "sleep") {
      if (!E.canSleep(s)) {
        notice("주인 기력이 25 이하일 때만 잠들 수 있어.");
        return;
      }
      menu(false);
      sleep();
      return;
    }
    if (id === "settings") {
      menu(false);
      settings();
      return;
    }
    persist();
    actions[id]?.();
  }
  toggle.onclick = () => menu(!menuOpen);
  document.querySelector("#fieldMenuClose").onclick = () => menu(false);
  bind("menu", act);
  bind("utility", act);
  document.querySelector("#dayButton").onclick = () => act("sleep");
  document.querySelector("#gameBack").onclick = () => {
    if (leaveGame()) showSlots();
  };
  document.querySelector("#calendarButton").onclick = () => {
    clearKeys();
    renderCalendar();
  };
  bind("event", (choice) => {
    if (E.resolveEvent(s, choice)) {
      catVoice("happy");
      persist();
      renderHome();
      document.querySelector("#fieldMenuToggle").click();
    } else notice("금화 또는 주인 기력이 부족해.");
  });
  document.querySelector("#petChunbae").onclick = () => {
    const gain = E.pet(s);
    if (gain === null) return;
    petUntil = performance.now() + 1500;
    catVoice("happy");
    E.log(
      s,
      gain ? `춘배 쓰다듬기 · 행복도 +${gain}` : "춘배는 이미 최고로 행복해!",
    );
    persist();
    renderHome();
    document
      .querySelector("#homeFieldCanvas")
      .dispatchEvent(new Event("field-petted"));
  };
  const petted = () => {
    petUntil = performance.now() + 1500;
  };
  canvas.addEventListener("field-petted", petted);
  const localSound = document.querySelector("#fieldSound"),
    syncLocalSound = () => {
      localSound.textContent = sound ? "♫" : "♪";
      localSound.setAttribute("aria-pressed", String(sound));
    };
  localSound.onclick = toggleSound;
  window.addEventListener("petopia-sound", syncLocalSound);
  syncLocalSound();
  document.querySelector("#fieldFullscreen").onclick = () => {
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    else if (document.documentElement.requestFullscreen)
      document.documentElement
        .requestFullscreen()
        .catch(() =>
          notice("현재 브라우저에서는 전체화면을 지원하지 않아.", false),
        );
    else notice("휴대폰을 가로로 돌리면 넓게 볼 수 있어!", false);
  };
  document.querySelector("#fieldInteract").onclick = () => {
    const p = model.nearest();
    if (p) act(p.id);
  };
  const down = (e) => {
    if (
      e.ctrlKey ||
      e.metaKey ||
      e.altKey ||
      e.target.closest?.("input,textarea,select") ||
      modal.open
    )
      return;
    if (e.code === "Escape" && menuOpen) {
      e.preventDefault();
      menu(false);
      return;
    }
    if (e.code === "KeyM" && !e.repeat) {
      e.preventDefault();
      menu(!menuOpen);
      return;
    }
    if (e.code === "KeyE" && !e.repeat && !menuOpen) {
      const p = model.nearest();
      if (p) {
        e.preventDefault();
        act(p.id);
      }
      return;
    }
    if (menuOpen) return;
    if (
      [
        "KeyW",
        "KeyA",
        "KeyS",
        "KeyD",
        "ArrowUp",
        "ArrowDown",
        "ArrowLeft",
        "ArrowRight",
      ].includes(e.code)
    ) {
      e.preventDefault();
      keys[e.code] = true;
    }
  };
  const up = (e) => {
    keys[e.code] = false;
  };
  window.addEventListener("keydown", down);
  window.addEventListener("keyup", up);
  window.addEventListener("blur", clearKeys);
  document.querySelectorAll("[data-field-move]").forEach((button) => {
    const code = { up: "KeyW", left: "KeyA", down: "KeyS", right: "KeyD" }[
      button.dataset.fieldMove
    ];
    button.onpointerdown = (e) => {
      e.preventDefault();
      if (menuOpen || modal.open) return;
      button.setPointerCapture(e.pointerId);
      keys[code] = true;
      button.classList.add("pressed");
    };
    button.onpointerup =
      button.onpointercancel =
      button.onlostpointercapture =
        () => {
          keys[code] = false;
          button.classList.remove("pressed");
        };
  });
  let view = {
    width: innerWidth,
    height: innerHeight,
    scale: 1,
    camera: { x: 0, y: 0 },
  };
  const resize = () => {
    const r = canvas.getBoundingClientRect(),
      dpr = Math.min(devicePixelRatio || 1, 2);
    view.width = r.width;
    view.height = r.height;
    canvas.width = Math.round(r.width * dpr);
    canvas.height = Math.round(r.height * dpr);
    view.dpr = dpr;
    view.scale = Math.max(0.55, Math.min(1.15, r.width / 1180, r.height / 700));
  };
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  resize();
  canvas.onpointerdown = (e) => {
    if (modal.open) return;
    if (menuOpen) {
      menu(false);
      return;
    }
    canvas.focus({ preventScroll: true });
    const r = canvas.getBoundingClientRect(),
      x = (e.clientX - r.left) / view.scale + view.camera.x,
      y = (e.clientY - r.top) / view.scale + view.camera.y;
    model.target = { x, y };
  };
  const visibility = () => {
    clearKeys();
    if (document.hidden) persist();
  };
  document.addEventListener("visibilitychange", visibility);
  window.addEventListener("pagehide", persist);
  const ground = createFieldGround(model.map, c.season);
  function frame(t) {
    if (stopped) return;
    const dt = Math.min(0.04, (t - last) / 1000 || 0);
    last = t;
    if (!menuOpen && !modal.open && !document.hidden) {
      if (
        model.step(dt, {
          left: keys.KeyA || keys.ArrowLeft,
          right: keys.KeyD || keys.ArrowRight,
          up: keys.KeyW || keys.ArrowUp,
          down: keys.KeyS || keys.ArrowDown,
        })
      ) {
        dirty = true;
        s.homeField = model.snapshot();
      }
    } else {
      model.player.walking = false;
      if (model.partner) model.partner.walking = false;
    }
    paintHomeField(ctx, view, model, ground, s, t, petUntil);
    const portal = !menuOpen && !modal.open ? model.nearest() : null,
      button = document.querySelector("#fieldInteract");
    button.hidden = !portal;
    if (portal) button.textContent = `E · ${portal.label}`;
    if (dirty && t - autosaveAt > 2000) {
      persist();
      autosaveAt = t;
    }
    raf = requestAnimationFrame(frame);
  }
  setCleanup(() => {
    stopped = true;
    cancelAnimationFrame(raf);
    observer.disconnect();
    window.removeEventListener("keydown", down);
    window.removeEventListener("keyup", up);
    window.removeEventListener("blur", clearKeys);
    window.removeEventListener("pagehide", persist);
    window.removeEventListener("petopia-sound", syncLocalSound);
    document.removeEventListener("visibilitychange", visibility);
    persist();
  });
  refreshActivityLog();
  save();
  schedulePartnerMeeting();
  raf = requestAnimationFrame(frame);
}
function fieldHash(x, y) {
  let n = (x * 374761393 + y * 668265263) ^ 12345;
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}
function createFieldGround(map, season) {
  const canvas = document.createElement("canvas");
  canvas.width = map.width;
  canvas.height = map.height;
  const g = canvas.getContext("2d");
  const grass = {
    SPRING: ["#789761", "#809e67", "#6f8c58"],
    SUMMER: ["#668959", "#6e9361", "#60804e"],
    FALL: ["#af9661", "#b79c68", "#a48b56"],
    WINTER: ["#b9c8c0", "#cbd6cf", "#adbdba"],
  }[season];
  const floors = [
    "#8b9870",
    "#b19c72",
    "#707a7e",
    "#bc9767",
    "#b7bba0",
    "#a47d59",
    "#34465e",
    "#c4a77a",
  ];
  if (map.outdoor) {
    for (let y = 0; y < map.height; y += 32)
      for (let x = 0; x < map.width; x += 32) {
        g.fillStyle = grass[Math.floor(fieldHash(x, y) * 3)];
        g.fillRect(x, y, 32, 32);
      }
    g.fillStyle = season === "WINTER" ? "#a49b88" : "#bdaa7e";
    g.fillRect(870, 0, 190, map.height);
    g.fillRect(0, 620, map.width, 145);
    for (let i = 0; i < 600; i++) {
      let x = Math.floor(fieldHash(i, 1) * map.width),
        y = Math.floor(fieldHash(i, 2) * map.height);
      const path = (x > 870 && x < 1060) || (y > 620 && y < 765);
      g.fillStyle = path ? "#c6b894" : "#465f3e55";
      g.fillRect(x, y, path ? 10 : 3, path ? 3 : 8);
      if (!path && i % 7 === 0) {
        g.fillStyle = ["#f3d987", "#dba9aa", "#d8ddb5"][i % 3];
        g.fillRect(x - 3, y - 5, 8, 5);
      }
    }
    g.fillStyle = "#72816a";
    g.fillRect(0, 0, map.width, 38);
    g.fillStyle = "#3b4d45";
    g.fillRect(0, 18, map.width, 5);
    for (let x = 0; x < map.width; x += 80) {
      g.fillStyle = "#6d5942";
      g.fillRect(x, 15, 10, 72);
      g.fillStyle = "#9c8665";
      g.fillRect(x, 12, 10, 8);
    }
    g.fillStyle = "#876d50";
    g.fillRect(0, 44, map.width, 8);
  } else {
    const base = floors[map.house];
    g.fillStyle = base;
    g.fillRect(0, 0, map.width, map.height);
    for (let y = 140; y < map.height; y += 42) {
      g.fillStyle = map.house === 6 ? "#60728b66" : "#523e2b22";
      g.fillRect(0, y, map.width, 2);
      for (let x = (Math.floor(y / 42) % 2) * 95; x < map.width; x += 190) {
        g.fillRect(x, y, 2, 42);
        g.fillStyle = map.house === 6 ? "#8dbdce18" : "#ffe9ac18";
        g.fillRect(x + 8, y + 7, 174, 3);
        g.fillStyle = map.house === 6 ? "#60728b66" : "#523e2b22";
      }
    }
    g.fillStyle = [
      "",
      "",
      "#465359",
      "#d1bd96",
      "#bdd3c5",
      "#72846e",
      "#192538",
      "#54445f",
    ][map.house];
    g.fillRect(0, 0, map.width, 145);
    g.fillStyle = "#423f4144";
    g.fillRect(0, 140, map.width, 14);
    for (let x = 180; x < 1700; x += 430) {
      g.fillStyle = "#514c41";
      g.fillRect(x - 10, 28, 310, 100);
      g.fillStyle = map.house === 6 ? "#17233e" : "#94bbbd";
      g.fillRect(x, 36, 290, 82);
      g.fillStyle = map.house === 6 ? "#88c2ef" : "#dbe0b6";
      for (let i = 0; i < 12; i++)
        g.fillRect(
          x + fieldHash(i, x) * 280,
          40 + fieldHash(i, x + 1) * 70,
          3,
          3,
        );
      g.fillStyle = "#d9c69a";
      g.fillRect(x + 140, 36, 8, 82);
      g.fillRect(x, 74, 290, 6);
      g.fillStyle = "#e3c590";
      g.fillRect(x - 12, 121, 314, 10);
      g.fillStyle = "#f6dfa31c";
      g.beginPath();
      g.moveTo(x, 140);
      g.lineTo(x + 290, 140);
      g.lineTo(x + 430, 600);
      g.lineTo(x + 60, 600);
      g.fill();
    }
    g.fillStyle = map.house === 6 ? "#7393b2" : "#9e5560";
    g.fillRect(690, 550, 520, 315);
    g.fillStyle = map.house === 6 ? "#b5daed" : "#d4a975";
    g.strokeStyle = g.fillStyle;
    g.lineWidth = 5;
    g.strokeRect(705, 565, 490, 285);
    g.fillStyle = "#ffffff10";
    g.fillRect(0, map.height - 120, map.width, 120);
  }
  return canvas;
}
function drawFieldObject(g, o, house) {
  const { x, y, w, h } = o;
  g.save();
  g.translate(x, y);
  g.fillStyle = "#19251f26";
  g.beginPath();
  g.ellipse(w * 0.5, h * 0.93, w * 0.55, 12, 0, 0, Math.PI * 2);
  g.fill();
  switch (o.kind) {
    case "tree": {
      g.fillStyle = "#725139";
      g.fillRect(42, 62, 30, 92);
      g.fillStyle = "#9d7650";
      g.fillRect(44, 68, 8, 80);
      g.fillStyle = "#42684b";
      g.fillRect(8, 30, 100, 75);
      g.fillRect(23, 12, 72, 107);
      g.fillStyle = "#5c8553";
      g.fillRect(0, 43, 110, 35);
      g.fillRect(23, 5, 64, 54);
      g.fillStyle = "#76975c";
      g.fillRect(21, 17, 30, 20);
      g.fillRect(60, 34, 35, 20);
      g.fillRect(9, 53, 34, 13);
      g.fillStyle = "#324e3c66";
      g.fillRect(22, 92, 73, 18);
      break;
    }
    case "shelter":
      if (house === 1) {
        g.fillStyle = "#9f7c4a";
        g.fillRect(0, 0, w, h - 8);
        g.fillStyle = "#c2a16c";
        g.fillRect(8, 6, w - 16, h - 21);
        g.fillStyle = "#dcc291";
        g.fillRect(w * 0.44, 0, 22, h - 8);
        g.fillStyle = "#74583e";
        g.fillRect(w * 0.25, h * 0.28, w * 0.5, h * 0.68);
        g.fillStyle = "#d8b880";
        g.beginPath();
        g.moveTo(0, 0);
        g.lineTo(-24, -32);
        g.lineTo(w * 0.45, -18);
        g.lineTo(w * 0.5, 14);
        g.fill();
        g.beginPath();
        g.moveTo(w, 0);
        g.lineTo(w + 24, -32);
        g.lineTo(w * 0.55, -18);
        g.lineTo(w * 0.5, 14);
        g.fill();
        g.fillStyle = "#644b35";
        g.font = "12px NeoDunggeunmo,monospace";
        g.fillText("CHUNBAE EXPRESS", 12, h - 18);
        break;
      }
      g.fillStyle = "#63513e";
      g.fillRect(10, 35, w - 20, h - 45);
      g.fillStyle = "#9b8964";
      g.fillRect(4, 45, w - 8, 76);
      g.fillStyle = "#b5a17b";
      g.beginPath();
      g.moveTo(-15, 46);
      g.lineTo(w * 0.5, -22);
      g.lineTo(w + 15, 46);
      g.fill();
      g.fillStyle = "#6b634c";
      g.beginPath();
      g.moveTo(w * 0.5, -22);
      g.lineTo(w + 15, 46);
      g.lineTo(w - 15, 46);
      g.fill();
      g.fillStyle = "#443e33";
      g.fillRect(w * 0.33, 55, w * 0.38, 85);
      g.fillStyle = "#d7c392";
      g.fillRect(w * 0.31, 118, w * 0.43, 24);
      g.fillStyle = "#68503d";
      g.fillRect(7, 44, 8, 110);
      g.fillRect(w - 16, 44, 8, 110);
      break;
    case "bed":
      g.fillStyle = "#674e43";
      g.fillRect(0, 0, w, h);
      g.fillStyle = "#d4c5aa";
      g.fillRect(8, 8, w - 16, h - 15);
      g.fillStyle = house < 2 ? "#879087" : "#a58da8";
      g.fillRect(11, h * 0.37, w - 22, h * 0.52);
      g.fillStyle = "#f0dfbd";
      g.fillRect(16, 12, w * 0.3, h * 0.22);
      g.fillStyle = "#cdbf9e";
      g.fillRect(19, 17, w * 0.24, h * 0.12);
      break;
    case "sofa":
      g.fillStyle = "#36534e";
      g.fillRect(0, 0, w, h * 0.88);
      g.fillStyle = "#77978b";
      g.fillRect(12, 10, w - 24, h * 0.55);
      g.fillStyle = "#94ada0";
      g.fillRect(16, h * 0.48, w - 32, h * 0.32);
      g.fillStyle = "#4c6b61";
      g.fillRect(0, h * 0.45, 23, h * 0.44);
      g.fillRect(w - 23, h * 0.45, 23, h * 0.44);
      g.fillStyle = "#d9b277";
      g.fillRect(45, 25, 55, 40);
      g.fillStyle = "#c58279";
      g.fillRect(w - 100, 25, 55, 40);
      break;
    case "table":
      g.fillStyle = "#6e4b36";
      g.fillRect(7, 18, w - 14, h - 18);
      g.fillStyle = "#c7a377";
      g.fillRect(0, 0, w, h * 0.8);
      g.fillStyle = "#e1c390";
      g.fillRect(6, 6, w - 12, 7);
      g.fillStyle = "#f5e6bc";
      g.fillRect(20, 24, 37, 26);
      g.fillStyle = "#607f72";
      g.fillRect(95, 26, 28, 22);
      g.fillStyle = "#b1815c";
      g.fillRect(99, 30, 20, 8);
      break;
    case "bench":
      g.fillStyle = "#49483b";
      g.fillRect(20, 30, 12, h);
      g.fillRect(w - 32, 30, 12, h);
      g.fillStyle = "#ac8c5e";
      g.fillRect(0, 0, w, 20);
      g.fillRect(0, 27, w, 17);
      g.fillStyle = "#cfb286";
      g.fillRect(4, 3, w - 8, 4);
      break;
    case "lamp":
      g.fillStyle = "#414d43";
      g.fillRect(14, 30, 10, h - 30);
      g.fillRect(0, h - 10, w, 10);
      g.fillStyle = "#f0ce7c";
      g.fillRect(0, 4, w, 30);
      g.fillStyle = "#fff1ba";
      g.fillRect(7, 9, w - 14, 18);
      g.fillStyle = "#536051";
      g.fillRect(-4, 0, w + 8, 6);
      break;
    case "plant":
      g.fillStyle = "#9c6d50";
      g.fillRect(w * 0.25, h * 0.6, w * 0.5, h * 0.35);
      g.fillStyle = "#c69a70";
      g.fillRect(w * 0.18, h * 0.58, w * 0.64, 10);
      g.fillStyle = "#5d835a";
      g.fillRect(w * 0.4, 0, w * 0.2, h * 0.7);
      g.fillRect(0, h * 0.16, w * 0.5, h * 0.25);
      g.fillRect(w * 0.5, h * 0.07, w * 0.48, h * 0.25);
      g.fillStyle = "#8ca96d";
      g.fillRect(w * 0.1, h * 0.17, w * 0.3, 9);
      g.fillRect(w * 0.6, h * 0.08, w * 0.27, 9);
      break;
    case "shelf":
      g.fillStyle = "#694d3d";
      g.fillRect(0, 0, w, h);
      g.fillStyle = "#3e443c";
      g.fillRect(10, 9, w - 20, h - 22);
      for (let i = 0; i < Math.floor(w / 22) - 1; i++) {
        g.fillStyle = ["#ae7977", "#a6b393", "#d4b17a", "#8aa0ad"][i % 4];
        g.fillRect(15 + i * 22, 16, 15, 34);
      }
      g.fillStyle = "#c4a678";
      g.fillRect(0, h - 13, w, 13);
      break;
    case "box":
      g.fillStyle = "#947449";
      g.fillRect(0, 12, w, h - 12);
      g.fillStyle = "#b99865";
      g.fillRect(5, 18, w - 10, h - 24);
      g.fillStyle = "#6e563b";
      g.fillRect(w * 0.25, 13, w * 0.5, h * 0.35);
      g.fillStyle = "#cfb27e";
      g.beginPath();
      g.moveTo(0, 12);
      g.lineTo(w * 0.2, -4);
      g.lineTo(w * 0.5, 13);
      g.lineTo(w * 0.3, 32);
      g.fill();
      g.beginPath();
      g.moveTo(w, 12);
      g.lineTo(w * 0.8, -4);
      g.lineTo(w * 0.5, 13);
      g.lineTo(w * 0.7, 32);
      g.fill();
      break;
    case "cushion":
      g.fillStyle = "#8d7389";
      g.fillRect(0, 10, w, h - 20);
      g.fillStyle = "#b498aa";
      g.fillRect(10, 0, w - 20, h);
      g.fillStyle = "#ccadba";
      g.fillRect(16, 12, w - 32, h - 25);
      break;
    case "pond":
    case "fountain":
      g.fillStyle = "#849484";
      g.beginPath();
      g.ellipse(w / 2, h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = "#5b9ea1";
      g.beginPath();
      g.ellipse(w / 2, h / 2, w * 0.43, h * 0.38, 0, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = "#a2d5c6";
      g.fillRect(w * 0.25, h * 0.37, w * 0.22, 4);
      g.fillRect(w * 0.58, h * 0.62, w * 0.2, 4);
      if (o.kind === "fountain") {
        g.fillStyle = "#bec3a4";
        g.fillRect(w * 0.46, h * 0.02, 18, h * 0.52);
        g.fillStyle = "#c2e2d4";
        g.fillRect(w * 0.35, 0, w * 0.3, 10);
      }
      break;
    case "stone":
      g.fillStyle = "#79847c";
      g.fillRect(10, 8, w - 20, h - 8);
      g.fillRect(0, 22, w, h - 27);
      g.fillStyle = "#a9afa0";
      g.fillRect(17, 9, w - 40, 12);
      break;
    case "column":
      g.fillStyle = "#baac8f";
      g.fillRect(12, 0, w - 24, h);
      g.fillStyle = "#e0d5b3";
      g.fillRect(18, 4, 12, h - 12);
      g.fillRect(0, 0, w, 15);
      g.fillRect(0, h - 15, w, 15);
      break;
    case "throne":
      g.fillStyle = "#907647";
      g.fillRect(0, 0, w, h);
      g.fillStyle = "#a17c9b";
      g.fillRect(12, 12, w - 24, h - 25);
      g.fillStyle = "#dfc58c";
      g.fillRect(0, h * 0.6, w, 15);
      g.fillStyle = "#f0d38c";
      g.fillRect(w * 0.44, -18, 20, 20);
      break;
    case "bowl":
      g.fillStyle = "#c2c6af";
      g.beginPath();
      g.ellipse(w / 2, h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = "#80694f";
      g.beginPath();
      g.ellipse(w / 2, h / 2, w * 0.35, h * 0.3, 0, 0, Math.PI * 2);
      g.fill();
      break;
  }
  g.restore();
}
function paintHomeField(ctx, view, model, ground, s, t, petUntil) {
  const { width, height, scale, dpr } = view,
    map = model.map,
    p = model.player,
    vw = width / scale,
    vh = height / scale;
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  view.camera.x =
    map.width > vw
      ? clamp(p.x - vw * 0.48, 0, map.width - vw)
      : (map.width - vw) / 2;
  view.camera.y =
    map.height > vh
      ? clamp(p.y - vh * 0.53, 0, map.height - vh)
      : (map.height - vh) / 2;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = map.outdoor ? "#536951" : "#282e35";
  ctx.fillRect(0, 0, width, height);
  ctx.imageSmoothingEnabled = false;
  ctx.save();
  ctx.scale(scale, scale);
  ctx.translate(-view.camera.x, -view.camera.y);
  ctx.drawImage(ground, 0, 0);
  for (const portal of map.portals) {
    const near = model.nearest()?.id === portal.id;
    ctx.save();
    ctx.translate(portal.x, portal.y);
    ctx.fillStyle = near ? "#e5d29e55" : "#fff5d316";
    ctx.beginPath();
    ctx.ellipse(0, 14, 75, 25, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#776249";
    ctx.fillRect(-5, -35, 10, 52);
    ctx.fillStyle = near ? "#f2d89c" : "#cfb280";
    ctx.fillRect(-75, -68, 150, 37);
    ctx.strokeStyle = "#826345";
    ctx.lineWidth = 3;
    ctx.strokeRect(-75, -68, 150, 37);
    ctx.font = "14px NeoDunggeunmo,monospace";
    ctx.fillStyle = "#513d2b";
    ctx.textAlign = "center";
    ctx.fillText(portal.label, 0, -44);
    ctx.restore();
  }
  const entities = map.objects.map((o) => ({
    y: o.y + o.h,
    draw: () => drawFieldObject(ctx, o, map.house),
  }));
  function cat(pose, partner) {
    ctx.save();
    ctx.fillStyle = "#1f282133";
    ctx.beginPath();
    ctx.ellipse(pose.x, pose.y + 3, 30, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    const bob =
      motion && pose.walking ? Math.sin(pose.walkDistance / 9) * 2 : 0;
    if (partner) {
      ctx.save();
      ctx.translate(pose.x, pose.y - 44 + bob);
      if (pose.facing === 1) ctx.scale(-1, 1);
      drawPortrait(ctx, 0, 0, 100, pose.walking ? "normal" : "happy", 0);
      ctx.restore();
    } else if (t < petUntil || (s.hospital && !pose.walking))
      drawPortrait(
        ctx,
        pose.x,
        pose.y - 44,
        105,
        t < petUntil ? "happy" : "sad",
      );
    else drawWalkingCat(ctx, pose.x, pose.y - 44, 98, pose, t / 1000);
    ctx.font = "13px NeoDunggeunmo,monospace";
    ctx.textAlign = "center";
    ctx.fillStyle = "#fff7de";
    ctx.shadowColor = "#27372b";
    ctx.shadowBlur = 4;
    ctx.fillText(partner ? E.partnerName(s) : "춘배", pose.x, pose.y - 103);
    ctx.shadowBlur = 0;
    if (!partner && t < petUntil) {
      ctx.fillStyle = "#f7a3b8";
      ctx.font = "25px NeoDunggeunmo,monospace";
      ctx.fillText(
        "♥  ♡  ♥",
        pose.x,
        pose.y - 133 - (1500 - (petUntil - t)) * 0.025,
      );
    }
    ctx.restore();
  }
  entities.push({ y: p.y, draw: () => cat(p, false) });
  if (model.partner)
    entities.push({ y: model.partner.y, draw: () => cat(model.partner, true) });
  entities.sort((a, b) => a.y - b.y);
  for (const e of entities) e.draw();
  if (model.target) {
    ctx.strokeStyle = "#f9edba99";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(model.target.x, model.target.y, 15, 7, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
  if (s.weather === "rain") {
    ctx.save();
    if (!map.outdoor) {
      ctx.scale(scale, scale);
      ctx.translate(-view.camera.x, -view.camera.y);
      ctx.beginPath();
      for (let x = 180; x < 1700; x += 430) ctx.rect(x, 36, 290, 82);
      ctx.clip();
      ctx.translate(view.camera.x, view.camera.y);
      ctx.scale(1 / scale, 1 / scale);
    }
    ctx.strokeStyle = "#d1e7ed66";
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    for (let i = 0; i < (map.outdoor ? 100 : 75); i++) {
      const x = (i * 137 + (motion ? t * 0.12 : 0)) % Math.max(1, width),
        y = (i * 89 + (motion ? t * 0.47 : 0)) % Math.max(1, height);
      ctx.moveTo(x, y);
      ctx.lineTo(x - 10, y + 23);
    }
    ctx.stroke();
    ctx.restore();
    if (map.outdoor) {
      ctx.fillStyle = "#243a4b1a";
      ctx.fillRect(0, 0, width, height);
    }
  }
}
