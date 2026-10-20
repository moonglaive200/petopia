const E = PetopiaEngine,
  money = (n) => Math.floor(n).toLocaleString("ko-KR");
let viewCleanup = null,
  activeActivity = false;
function player() {
  return E.normalize(slots[selectedSlot]);
}
function cleanupView() {
  if (viewCleanup) {
    const fn = viewCleanup;
    viewCleanup = null;
    fn();
  }
  activeActivity = false;
}
function leaveGame() {
  if (
    activeActivity &&
    !confirm("지금 활동을 끝낼까? 사용한 기력과 입장 횟수는 돌아오지 않아.")
  )
    return false;
  cleanupView();
  return true;
}
function setCleanup(fn) {
  viewCleanup = fn;
}
const GUIDE_TIPS = [
  "주인 기력은 하루 최대 100! 당일에는 회복되지 않아. 기력 25 이하에서 잠자면 다시 채워져.",
  "냥서바이벌은 하루 1번, 주인 기력 50과 행복도 20 이상이 필요해.",
  "냥서바이벌은 자동 공격! WASD로 이동하고 Space로 회피할 수 있어.",
  "던전에서는 1분에 중간 보스, 3분에 최종 보스가 등장해.",
  "던전에서 쓰러져도 생존 시간과 처치 수에 따른 보상은 받을 수 있어.",
  "무기 5단계와 짝인 능력 3단계를 모으면 무기가 진화해. 던전의 진화 조합을 확인해 봐!",
  "흡혈 송곳니는 실제 준 피해의 10%씩 체력을 회복해. 3단계면 30%!",
  "공원·방앗간·드라이브는 각각 하루 1번, 각각 기력 25야. 방앗간 안에서는 추가 기력 없이 여러 판 즐길 수 있어.",
  "던전 클리어·산책·근무 완료·펫스타·Live 완료 때 치즈냥이 만남 확률은 각각 5%!",
  "드라이브는 자동차와 썸냥이가 모두 있어야 해금돼. 함께 달리면 호감도도 조금 올라!",
  "직접 일하기는 기력 50을 쓰고 다음 날 일당과 근무 경력을 받아. 다른 활동도 가능해.",
  "공사장 주인 10단계면 회사, 회사 주인 10단계면 연구소가 열려.",
  "직원 교육은 같은 직장의 주인 단계까지만 가능해. 먼저 집사부터 승진하자!",
  "펫스타는 매일 1번, 펫 Live는 3일에 1번! 그날 첫 인플루언서 활동만 기력 25를 써.",
  "펫스타와 Live에서 얻은 팬의 20%는 다른 채널에도 유입돼.",
  "행복도 70~99는 수입 +20%, 행복도 100은 +50%! 춘배 기분도 챙겨 줘.",
  "유명세·행복도·연애·집의 수입 보너스는 서로 곱해져. 주인 일당에는 탈것도 추가 적용!",
  "츄르 먹이기와 썸냥이 선물은 각각 하루 1개야. 둘 다 같은 날 할 수 있어.",
  "츄르는 종류마다 매일 0~2개 입고돼. 원하는 맛이 있다면 재고부터 확인해 봐.",
  "호감도 3에서는 고백, 6에서는 프로포즈! 성공 전에는 해당 호감도를 넘을 수 없어.",
  "대화·선물·데이트는 각각 별도 제한이야. 하루에 세 가지를 모두 할 수 있어.",
  "잠자기 전 집 효과를 확인해 봐. 노숙은 기상 행복도 −10, 좋은 집은 행복도를 올려줘.",
  "주식은 하루 ±30%, 코인은 −99%~+200%! 종목 가격이 1G 이하가 되면 다음 날 보유분 소멸, 3일 뒤 기본가격으로 재상장돼.",
  "병원 치료는 행복도를 30으로 회복해. 돈이 부족하면 긴급 대출이 가능하지만 기력은 안 차!",
  "한 계절은 28일, 1일은 일요일이야. 달력에 표시된 겨울 27일은 춘배 생일!",
];
function guidePanel() {
  const s = player();
  if (s.guideDay !== s.day) {
    s.guideDay = s.day;
    s.guideTip = Math.floor(Math.random() * GUIDE_TIPS.length);
  }
  return `<div class="game-notice guide-panel"><p id="guideText">가이드: ${GUIDE_TIPS[s.guideTip] || GUIDE_TIPS[0]}</p></div>`;
}
function statusText(s) {
  return s.hospital
    ? "춘배가 쉬고 싶대. 펫병원에서 치료해 줘."
    : s.working !== null
      ? `${E.jobs[s.working].name} 근무 예약 완료. 다른 활동도 자유롭게 해!`
      : s.gold < 0
        ? "잔액은 마이너스, 귀여움은 플러스."
        : "당일 기력 회복은 없어. 오늘의 활동을 골라보자.";
}
function gameShell(content, back = renderHome) {
  cleanupView();
  const s = player();
  document.body.dataset.screen = "game";
  app.innerHTML = `<section class="game-shell"><div class="game-top"><button class="back" id="gameBack">← ${back === showSlots ? "슬롯 선택" : "돌아가기"}</button><span class="save-label"></span><span class="day-label">${E.calendar(s.day).season} ${E.calendar(s.day).date} (${E.calendar(s.day).weekday}) <button id="calendarButton" aria-label="달력 열기">📅</button></span><div class="wallet"><span>◈ ${money(s.gold)} G</span><span>◆ ${s.diamonds}</span><span>주인 기력 ${s.energy}/100</span></div></div>${back === showSlots ? dailyEventPanel(s) : ""}${content}${back === showSlots ? `<nav class="screen-tools" aria-label="보조 메뉴"><button data-utility="mart">▤ 펫마트</button><button data-utility="inventory">▤ 인벤토리</button><button data-utility="hospital">✚ 펫병원</button><button id="dayButton" ${!E.canSleep(s) ? "disabled" : ""} title="주인 기력 25 이하에서 잠들 수 있어">☾ 잠자기 · 기력 25 이하</button><button data-utility="settings">⚙ 설정</button></nav>` : ""}<section class="activity-journal" aria-label="냥생 기록"><h2>냥생 기록</h2><div class="daily-log" id="activityLog"></div></section>${back === showSlots ? guidePanel() : ""}</section>`;
  document.querySelector(".save-label").textContent =
    `SLOT ${selectedSlot + 1}${s.ownerName ? " · " + s.ownerName + " 집사" : ""}`;
  document.querySelector("#gameBack").onclick = () => {
    if (leaveGame()) back();
  };
  const dayButton = document.querySelector("#dayButton");
  if (dayButton) dayButton.onclick = sleep;
  const actions = {
    mart: renderMart,
    bank: renderBank,
    hospital: renderHospital,
    inventory: renderInventory,
    settings,
  };
  bind("utility", (id) => {
    if (!leaveGame()) return;
    actions[id]();
  });
  document.querySelector("#calendarButton").onclick = renderCalendar;
  refreshActivityLog();
  save();
  schedulePartnerMeeting();
}
function bind(key, fn) {
  document
    .querySelectorAll(`[data-${key}]`)
    .forEach((b) => (b.onclick = () => fn(b.getAttribute("data-" + key), b)));
}
function title(kicker, name, desc = "") {
  return `<div class="eyebrow">${kicker}</div><h1>${name}</h1>${desc ? `<p class="desc">${desc}</p>` : ""}`;
}
function catCanvas(id = "homeArt", size = 140) {
  return `<canvas id="${id}" class="cat-art" width="160" height="160" style="--art-size:${size}px" aria-label="춘배"></canvas>`;
}
function paintCat(id = "homeArt", scale = 1.7, emotion = "normal") {
  const c = document.getElementById(id);
  if (!c) return;
  const draw = () => {
    if (!c.isConnected) return;
    const ctx = c.getContext("2d");
    ctx.clearRect(0, 0, c.width, c.height);
    drawPortrait(ctx, c.width / 2, c.height / 2, c.height * 1.25, emotion);
  };
  if (spriteImages.chunbae.complete) draw();
  else spriteImages.chunbae.addEventListener("load", draw, { once: true });
}
function sleep() {
  if (activeActivity) {
    notice("진행 중인 활동을 먼저 마쳐줘.");
    return;
  }
  const s = player();
  if (!E.canSleep(s)) {
    notice("주인 기력이 25 이하일 때만 잠들 수 있어.");
    return;
  }
  showCutscene("sleep", () => {
    const result = E.nextDay(s);
    if (!result) return;
    save();
    renderDaySummary(result);
  });
}
function renderHome() {
  const s = player(),
    st = E.stats(s),
    married = s.romance?.stage >= 2;
  gameShell(
    `<div class="home-title"><div>${title("CHUNBAE’S LITTLE WORLD", "춘배의 방")}</div><span class="date-chip">${E.houses[s.house].name}</span></div><div class="pet-stage house-${s.house} ${s.weather === "rain" ? "raining" : ""}">${s.house === 0 ? `<div class="street-lamp"></div><div class="street-bag">▣</div><div class="street-paper">오늘의 냥보</div>` : ""}<div class="rain-layer"></div><div class="window-pixel"><span></span></div><div class="wall-picture">${["☁", "▣", "☂", "☀", "≈", "♛", "☾", "✦"][s.house]}</div><div class="speech">${s.hospital ? "집사야… 병원 좀…" : married ? "우리 둘이 같이 살아요. 집사는 출근해요." : "집사 이름으로 된 통장, 내가 지킨다."}</div><div class="home-cats">${spriteMarkup("chunbae", s.hospital ? "sad" : s.happiness > 80 ? "happy" : "normal", "breathing")}${married ? spriteMarkup(s.romance.kind, "happy", "breathing partner-at-home") : ""}</div><div class="floor-rug"></div><div class="pet-stage-actions"><span class="stage-label">${married ? "춘배와 " + escapeLog(E.partnerName(s)) : "춘배 · 오늘도 함께"}</span><button class="btn pet-chunbae" id="petChunbae">♡ 쓰다듬기 · 행복도 +5</button></div></div><div class="status-strip stats-six"><div><small>레벨</small><strong>LV.${s.level}</strong><progress value="${s.xp}" max="${E.xpNeeded(s.level)}"></progress><span>${s.xp}/${E.xpNeeded(s.level)} XP</span></div><div><small>공격 / 방어</small><strong>${st.attack} / ${st.defense}</strong><span>체력 ${st.hp}</span></div><div><small>행복도</small><strong>${s.happiness}/100</strong><progress value="${s.happiness}" max="100"></progress><span class="happiness-bonus-note">수입 보너스 · 0~69: 없음<br>70~99: +20% · 100: +50%</span></div><div><small>유명세</small><strong>${money(s.followers + s.liveFollowers)}</strong><span>펫스타 + Live 팔로워</span></div><div><small>보유재화</small><strong class="gold-label">🪙 골드 ${money(s.gold)} G</strong><span class="diamond-label">💎 다이아 ${s.diamonds}개</span></div><div><small>수입 보너스</small><strong>+${(E.bonus(s) * 100).toFixed(1)}%</strong><span>유명세 × 행복도 × 연애 × 집<br>주인 일당 +${((1 + E.bonus(s)) * (1 + E.vehicleBonus(s)) * 100 - 100).toFixed(1)}%<br>탈것 추가 곱연산</span></div></div><div class="daily-strip"><span>던전 남음 ${1 - s.daily.dungeon}/1</span><span>힐링 남음 ${4 - s.daily.walk - s.daily.drive - s.daily.arcade - s.daily.nap}/4 · 낮잠 주말</span><span>펫스타 남음 ${1 - s.daily.star}/1${s.daily.star ? " · 오늘 완료" : ""}</span><span>Live ${Math.max(0, 3 - s.day + s.liveDay) ? `${3 - s.day + s.liveDay}일 후` : "가능"}</span></div><div class="section-heading"><h2>오늘의 냥생</h2><span>당일 기력 회복 불가</span></div><nav class="activity-grid eight-activities">${[
      ["dungeon", "⚔", "냥서바이벌", "하루 1회 · 기력 −50 · 행복도 20 이상"],
      ["romance", "♡", "연애", "메뉴 입장 무료 · 행동마다 기력 −25"],
      ["idle", "⚑", "춘배 원정대", "자동사냥 · 오프라인 최대 8시간"],
      ["walk", "♧", "힐링하기", "각각 하루 1회 · 주말 낮잠 무료"],
      ["work", "▣", "주인 노동시키기", "근무 중에도 자유 활동 · 기력 −50"],
      [
        "influencer",
        "✦",
        "인플루언서냥",
        "하루 첫 활동 기력 −25 · 이후 추가 소모 없음",
      ],
      ["gambling", "♠", "도박하기", "장비 강화 · 카지노"],
      ["bank", "♜", "펫은행", "대출 · 투자 · 집 사기"],
    ]
      .map(
        ([id, icon, name, desc]) =>
          `<button class="activity ${["dungeon", "romance"].includes(id) ? "adventure" : ""}" data-menu="${id}"><span class="activity-icon">${icon}</span><span><strong>${name}</strong><small>${desc}</small></span><span class="arrow">↗</span></button>`,
      )
      .join("")}</nav>`,
    showSlots,
  );
  const actions = {
    dungeon: renderDungeons,
    idle: renderIdleHunt,
    walk: renderWalk,
    gambling: renderGambling,
    work: renderWork,
    romance: renderRomance,
    influencer: renderInfluencer,
    inventory: renderInventory,
    mart: () => renderMart(),
    bank: () => renderBank(),
  };
  bind("menu", (id) => actions[id]());
  document.querySelector("#petChunbae").onclick = () => {
    const before = s.happiness;
    E.happy(s, 5);
    const gained = s.happiness - before;
    save();
    renderHome();
    catVoice("happy");
    const stage = document.querySelector(".pet-stage");
    stage.querySelector(".speech").textContent = "냐옹~ 집사 손이 제일 좋아!";
    const hearts = document.createElement("span");
    hearts.className = "petting-hearts";
    hearts.setAttribute("aria-hidden", "true");
    hearts.textContent = "♥ ♡ ♥";
    stage.append(hearts);
    setTimeout(() => hearts.remove(), 1200);
    notice(
      gained
        ? `춘배 쓰다듬기 · 행복도 +${gained}`
        : "춘배는 이미 최고로 행복해! (행복도 100)",
    );
  };
  bind("event", (choice) => {
    if (E.resolveEvent(s, choice)) {
      catVoice("happy");
      save();
      renderHome();
    } else notice("금화 또는 주인 기력이 부족해.");
  });
  const log = document.querySelector(".daily-log");
  log.scrollTop = log.scrollHeight;
}
function renderDungeons() {
  const s = player();
  gameShell(
    `${title("SURVIVE THE VERY ORDINARY", "냥서바이벌", "몰려오는 적을 피하고, 판마다 다른 무기 조합으로 살아남자.")}<div class="dungeon-intro"><div class="survival-poster">${spriteMarkup("chunbae", "surprise")}<span>냥생은 실전이다</span></div><div class="boss-timeline"><strong>01:00 중간 보스 등장</strong><strong>03:00 최종 보스 등장</strong><p>최종 보스를 처치하면 클리어!<br>도중에 쓰러져도 생존 시간·처치 수 보상을 받아.</p></div></div><label class="field-label">탐험할 장소<select id="survivalMap"><option value="0">1단계 · 햇살 공원</option><option value="1">2단계 · 버려진 펫마트</option><option value="2">3단계 · 네온 뒷골목</option>${Array.from({ length: 7 }, (_, i) => `<option disabled>${i + 4}단계 · 개발 중 🔒</option>`).join("")}</select></label><div class="dungeon-entry"><button class="btn primary" id="enterSurvival" ${s.daily.dungeon >= 1 || s.energy < 50 || s.happiness < 20 || !E.canAct(s) ? "disabled" : ""}>던전 입장 · 기력 −50 · 행복도 20 이상</button><span>하루 1회 · 자동 공격 / WASD 이동 / Space 회피</span></div><p class="tip-banner">오늘 ${s.daily.dungeon}/1회 · 주인 기력 ${s.energy}/100 · 행복도 ${s.happiness}/100 (입장 조건: 20 이상)<br>치즈폭탄을 주우면 주변 일반 몬스터 즉시 처치 · 보스에게 큰 피해!<br>무기 6종·보조 능력 6종, 레벨업 선택과 진화. 1스테이지 최종 보스는 조커의남자 고정! 처치하면 카지노 해금.<br>다른 보스는 장소·날짜에 따라 등장해.</p><details><summary>보스 도감 (${s.bossKills.length}/10)</summary><div class="boss-codex">${E.bosses.map((b) => `<span>${s.bossKills.includes(b.id) ? "✓" : "♠"} ${b.name}</span>`).join("")}</div><p>조커의남자를 처치하면 카지노가 해금돼.</p></details>${
      s.survivalRecords.length
        ? `<div class="section-heading"><h2>최근 탐험</h2></div>${s.survivalRecords
            .slice(0, 3)
            .map(
              (r) =>
                `<p class="game-notice">DAY ${r.day} · ${r.time}초 · ${r.kills}처치 · ${r.won ? "클리어" : "생존 보상"} · ${r.gold} G</p>`,
            )
            .join("")}`
        : ""
    }`,
  );
  document.querySelector("#enterSurvival").onclick = () =>
    startSurvival(Number(document.querySelector("#survivalMap").value));
}
function renderWalk() {
  const s = player(),
    car = s.vehicles.some((i) => E.vehicles[i].type === "car") && !!s.romance;
  const entries = [
    [
      "park",
      "♧",
      "공원산책",
      s.weather === "rain"
        ? "비 오는 날은 산책할 수 없어"
        : "행복도 +30 · 기력 −25",
      s.weather !== "rain",
    ],
    [
      "arcade",
      "✦",
      "방앗간 가기",
      "입장 행복도 +5 · 기력 −25 · 뽑기 / 10초 맞추기 / HEX",
      true,
    ],
    [
      "drive",
      "🚗",
      "드라이브 가기",
      car
        ? "행복도 +30 · 호감도 +0.1 · 기력 −25"
        : "자동차 구매 + 썸냥이 만남 필요",
      car,
    ],
    [
      "nap",
      "☾",
      "집사랑 낮잠자기",
      "행복도 +30 · 기력 0 · 토·일 하루 1번",
      E.weekend(s),
    ],
  ];
  gameShell(
    `${title("A LITTLE HEALING", "힐링하기", "4개 활동은 각각 하루 1회! 기력이 있으면 모두 할 수 있어.")}<p class="tip-banner">공원·방앗간·드라이브는 각각 하루 1회, 각각 기력 −25.<br>비 오는 날 공원산책 불가 · 주말 낮잠은 기력 소모 없이 행복도 +30!</p><div class="destination-grid">${entries.map(([id, icon, name, desc, unlocked]) => `<button class="destination" data-dest="${id}" ${!unlocked || !E.canAct(s) || (id === "nap" ? s.daily.nap : s.daily[id === "park" ? "walk" : id] >= 1 || s.energy < 25) ? "disabled" : ""}><span>${icon}</span><h2>${name}</h2><p>${desc}</p><small>${id === "nap" ? (E.weekend(s) ? (s.daily.nap ? "오늘 낮잠 완료" : "주말 낮잠 가능") : "주말에만 가능") : unlocked ? (s.daily[id === "park" ? "walk" : id] ? "오늘 완료 · 남음 0/1" : "남음 1/1 · 기력 −25") : "이용 불가"}</small></button>`).join("")}</div>`,
  );
  bind("dest", (id) => {
    if (id === "nap") {
      if (E.nap(s)) {
        catVoice("purr");
        save();
        renderWalk();
        showModal(
          "집사랑 낮잠자기",
          `${spriteMarkup("chunbae", "sleep")}<p>따뜻하게 꿀잠! 행복도 +30 · 기력 소모 없음</p>`,
        );
      }
      return;
    }
    if (id === "arcade") {
      if (E.enterArcade(s)) {
        save();
        renderArcade();
      }
      return;
    }
    const text = id === "park" ? E.park(s) : E.drive(s);
    if (text) {
      E.log(s, text);
      save();
      renderWalk();
      catVoice("happy");
      showModal(
        "힐링 다녀왔어!",
        `<div class="result-cat">${spriteMarkup("chunbae", "happy")}</div><p>${text}</p>`,
      );
    }
  });
}
function renderGambling() {
  const s = player();
  gameShell(
    `${title("LUCK IS ALSO A CAT", "도박하기", "장비 강화는 신중하게! 파괴된 장비는 돌아오지 않아.")}<div class="destination-grid"><button class="destination" id="openEnhance"><span>⚒</span><h2>장비 강화</h2><p>최대 20강 · 10강 2배 / 20강 5배<br>기력 소모 없음</p></button><button class="destination" id="openCasino" ${!s.bossCleared || s.daily.casino || s.energy < 25 || !E.canAct(s) ? "disabled" : ""}><span>♠</span><h2>카지노 가기</h2><p>${s.bossCleared ? "냥슬롯 · 냥룰렛 · 입장 기력 −25 · 하루 1회" : "1스테이지 조커의남자 처치 시 해금"}</p></button></div>`,
  );
  document.querySelector("#openEnhance").onclick = () => renderEnhance();
  document.querySelector("#openCasino").onclick = () => {
    if (E.enterCasino(s)) {
      save();
      renderCasino();
    }
  };
}
function renderEnhance(type = "weapon") {
  const s = player(),
    items = type === "weapon" ? E.weapons : E.armors,
    id = s[type],
    item = items[id],
    info = E.upgradeInfo(s, type),
    lv = s[type + "Up"];
  gameShell(
    `${title("ONE MORE UPGRADE?", "장비 강화", "선택한 장비의 기본 능력치만 강화돼. 춘배 레벨 능력치와 연애 보너스는 곱하지 않아.")}<div class="tabs">${[
      ["weapon", "공격 장비"],
      ["armor", "방어 장비"],
    ]
      .map(
        ([t, n]) =>
          `<button data-enhance-tab="${t}" class="${t === type ? "selected" : ""}">${n}</button>`,
      )
      .join(
        "",
      )}</div><label class="field-label">강화할 장비<select id="enhanceGear">${s[type === "weapon" ? "weapons" : "armors"].map((i) => `<option value="${i}" ${id === i ? "selected" : ""}>${items[i].name} +${s.gearUp[type][i] || 0}</option>`).join("")}</select></label><div class="enhance-anvil">${type === "weapon" ? "⚔" : "♜"}<strong>${item.name} +${lv}</strong><span>장비 능력치 ×${E.gearMultiplier(lv).toFixed(2)}</span></div><div class="tip-banner">1~5강: 성공 90% / 유지 8% / 파괴 2% · 비용 장비가의 10%<br>6~10강: 성공 70% / 유지 20% / 파괴 10% · 비용 20%<br>11~20강: 성공 50% / 유지 35% / 파괴 15% · 비용 30%<br>실패해도 비용은 소모돼. 파괴되면 해당 장비와 강화 단계가 사라지고 기본 장비로 돌아가.</div><button class="btn primary wide" id="tryEnhance" ${!info || s.gold < info.cost || !E.canAct(s) ? "disabled" : ""}>${info ? `+${info.target} 도전 · ${money(info.cost)} G · 성공 ${info.success * 100}%` : id === 0 ? "기본 장비는 강화할 수 없어" : "20강 최대 강화"}</button>${info ? `<p class="note">성공 시 장비 능력치 ×${info.multiplier.toFixed(2)} · 확률은 도전할 단계 기준</p>` : ""}`,
    renderGambling,
  );
  bind("enhance-tab", renderEnhance);
  document.querySelector("#enhanceGear").onchange = (e) => {
    E.purchase(s, type, Number(e.target.value));
    save();
    renderEnhance(type);
  };
  document.querySelector("#tryEnhance").onclick = () => {
    if (activeActivity) return;
    const result = E.enhance(s, type);
    if (!result) return;
    // Commit the roll once before presentation: leaving/reloading cannot reroll it.
    save();
    activeActivity = true;
    document
      .querySelectorAll(".game-shell button, .game-shell select")
      .forEach((el) => {
        el.disabled = true;
      });
    const anvil = document.querySelector(".enhance-anvil");
    anvil.classList.add("enhance-charging");
    anvil.setAttribute("aria-live", "polite");
    anvil.querySelector("span").textContent = "두근두근… 강화 중!";
    document.querySelector("#tryEnhance").textContent =
      "강화 중… 결과를 기다려 줘!";
    const charge = playMedia("enhance-charge", 0.7),
      started = performance.now();
    let finished = false,
      timer;
    const cancel = () => {
      finished = true;
      clearInterval(timer);
      charge.audio.removeEventListener("ended", reveal);
      charge.stop();
    };
    function reveal() {
      if (finished) return;
      cancel();
      activeActivity = false;
      renderEnhance(type);
      if (result.outcome !== "hold")
        playEffect(
          result.outcome === "success" ? "enhance-success" : "enhance-break",
        );
      catVoice(result.outcome === "success" ? "happy" : "complain");
      showModal(
        result.outcome === "success"
          ? "강화 성공!"
          : result.outcome === "hold"
            ? "강화 유지…"
            : "장비가 파괴됐어…",
        `<div class="enhance-result ${result.outcome}">${result.outcome === "success" ? "✦" : "…"}</div><p>${result.name} +${result.target} 도전 · 비용 ${money(result.cost)} G<br>${result.outcome === "success" ? `+${result.target} 달성!` : result.outcome === "hold" ? "단계는 그대로 유지돼." : "해당 장비가 사라졌어. 기본 장비로 교체했어."}</p>`,
      );
    }
    charge.audio.addEventListener("ended", reveal);
    // Muted/blocked/failed playback keeps the same suspense duration (clip: 1.069s).
    timer = setInterval(() => {
      const elapsed = performance.now() - started;
      if (
        (elapsed >= 1100 &&
          (!sound || charge.audio.paused || charge.audio.error)) ||
        elapsed >= 12000
      )
        reveal();
    }, 50);
    setCleanup(cancel);
  };
}
function completeOuting() {
  const s = player();
  if (s.outingPending) {
    s.outingPending = false;
    const event = E.meet(s, "walk");
    save();
    if (event) notice(event);
  }
}
function renderMart(tab = "forge", forge = "weapon") {
  const s = player();
  gameShell(
    `${title("PET MART", "펫마트", "필요한 건 다 있어. 금화가 없는 게 문제지.")}<div class="tabs">${[
      ["forge", "펫대장간"],
      ["treat", "츄르코너"],
      ["vehicle", "펫오토"],
    ]
      .map(
        ([id, n]) =>
          `<button data-mart="${id}" class="${tab === id ? "selected" : ""}">${n}</button>`,
      )
      .join("")}</div>${
      tab === "forge"
        ? `<div class="tabs">${[
            ["weapon", "공격장비"],
            ["armor", "방어장비"],
            ["toy", "장난감"],
          ]
            .map(
              ([id, n]) =>
                `<button data-forge="${id}" class="${forge === id ? "selected" : ""}">${n}</button>`,
            )
            .join("")}</div>${["weapon", "armor"]
            .filter((t) => t === forge)
            .map(
              (type) =>
                `<div class="section-heading"><h2>${type === "weapon" ? "공격 장비" : "방어 장비"}</h2><span>현재 장비 +${s[type + "Up"]}/20</span></div><div class="shop-grid">${(type === "weapon" ? E.weapons : E.armors).map((item, i) => shopCard(type, item, i, s)).join("")}</div>`,
            )
            .join(
              "",
            )}${forge === "toy" ? `<div class="shop-grid">${E.toys.map((item, i) => shopCard("toy", item, i, s)).join("")}</div>` : ""}`
        : `<div class="shop-grid">${(tab === "treat" ? E.treats : E.vehicles).map((item, i) => shopCard(tab, item, i, s)).join("")}</div>`
    }<p class="note">강화는 도박하기 → 장비 강화에서! 장비별로 따로 저장돼. 츄르는 인벤토리에서 먹일 수 있어. 종류별 매일 0~2개 입고.</p>`,
  );
  bind("mart", (id) => renderMart(id));
  bind("forge", (id) => renderMart("forge", id));
  bind("buy", (value, b) => {
    const [type, i] = value.split(":");
    const beforeGold = s.gold,
      beforeDiamonds = s.diamonds;
    if (E.purchase(s, type, Number(i))) {
      if (s.gold < beforeGold || s.diamonds < beforeDiamonds)
        playEffect("purchase");
      save();
      meow();
      renderMart(tab, forge);
      notice("구매·선택 완료!");
    }
  });
}
function shopCard(type, item, i, s) {
  const owned = {
      weapon: s.weapons,
      armor: s.armors,
      toy: s.toys,
      vehicle: s.vehicles,
      house: s.houses,
      building: s.buildings,
      company: s.companies,
    }[type]?.includes(i),
    equipped = ["weapon", "armor", "house"].includes(type) && s[type] === i;
  const info =
    type === "weapon"
      ? `공격 +${item.attack}`
      : type === "armor"
        ? `방어 +${item.defense} · 체력 +${item.hp}`
        : type === "treat"
          ? `행복도 +${item.happy} · 보유 ${s.treats[i]}개 · 오늘 재고 ${s.treatStock[i]}개`
          : type === "toy"
            ? `선물 시 호감도 +${item.affection.toFixed(2)}`
            : type === "house"
              ? `수입 보너스 ×${(1 + item.work).toFixed(2)} (다른 보너스와 곱연산) · 기상 행복도 ${item.wake >= 0 ? "+" : ""}${item.wake} · 주인 수입 +${Math.round(item.work * 100)}% · 직원 +${Math.round(item.staff * 100)}%${item.discount ? ` · 고용 할인 ${item.discount * 100}%` : ""}`
              : item.text ||
                `매일 +${money(item.income)} G (구매 가격의 ${type === "company" ? 1 : 2}%)${type === "company" ? " + 회사가의 1% 상당 주식 (소수 둘째 자리까지)" : ""}`;
  const cost = ["weapon", "armor", "toy", "treat", "vehicle"].includes(type)
    ? E.shopPrice(s, item)
    : item.cost;
  return `<article class="shop-card ${equipped ? "equipped" : ""}"><span class="equipment-icon">${{ weapon: "⚔", armor: "♜", treat: "▰", toy: "♙", vehicle: item.type === "car" ? "🚗" : "✈", house: "⌂", building: "▥", company: "▤" }[type]}</span><h3>${["weapon", "armor"].includes(type) ? `${i + 1}단계 · ` : ""}${item.name}</h3><p>${info}</p><button class="btn" data-buy="${type}:${i}" ${equipped || (type === "treat" && s.treatStock[i] <= 0) || (owned && !["weapon", "armor", "house", "toy"].includes(type)) || ((!owned || type === "toy") && (s.gold < cost || s.diamonds < (item.diamond || 0))) ? "disabled" : ""}>${equipped ? "선택 중" : owned && type !== "toy" ? (["weapon", "armor", "house"].includes(type) ? "선택하기" : "보유 중") : `${money(cost)} G${item.diamond ? ` + ◆${item.diamond}` : ""}`}</button></article>`;
}
function renderInventory() {
  const s = player();
  gameShell(
    `${title("EVERYTHING CHUNBAE OWNS", "인벤토리", "먹이기 하루 1개, 썸냥이 선물 하루 1개는 각각 별도야.")}<div class="tip-banner">먹이기 ${s.daily.feed}/1 · 선물 ${s.daily.gift}/1 · 장난감은 행복도 대신 호감도를 올려.</div><div class="section-heading"><h2>츄르</h2></div><div class="shop-grid">${E.treats.map((t, i) => `<article class="shop-card"><h3>${t.name}</h3><p>보유 ${s.treats[i]}개 · 행복도 +${t.happy}</p><button class="btn" data-feed="${i}" ${s.daily.feed || !s.treats[i] || !E.canAct(s) ? "disabled" : ""}>먹이기</button></article>`).join("")}</div><div class="section-heading"><h2>장난감 (${s.toys.length}/10)</h2></div><div class="inventory-list">${s.toys.length ? s.toys.map((i) => `<div>${E.toys[i].name} ×${s.toyBag[i] || 0}<span>선물 시 호감도 +${E.toys[i].affection.toFixed(2)}</span></div>`).join("") : "<p>아직 없어. 펫마트나 뽑기에서 모아보자.</p>"}</div><div class="section-heading"><h2>장비와 탈것</h2></div><p class="game-notice">${E.weapons[s.weapon].name} +${s.weaponUp} / ${E.armors[s.armor].name} +${s.armorUp}<br>${s.vehicles.length ? s.vehicles.map((i) => E.vehicles[i].name).join(" · ") : "탈것 없음"}</p><button class="btn wide" id="inventoryRomance">♡ 연애 메뉴에서 선물하기</button>`,
  );
  bind("feed", (i) => {
    if (E.feedTreat(s, Number(i))) {
      save();
      catVoice("happy");
      renderInventory();
      notice("맛있게 먹었어! 오늘 먹이기는 끝.");
    }
  });
  document.querySelector("#inventoryRomance").onclick = renderRomance;
}
function renderToys() {
  renderInventory();
}
function renderWork() {
  const s = player(),
    h = E.houses[s.house];
  gameShell(
    `${title("WORK HARD, NAP HARDER", "주인 노동시키기", "일하러 보내도 다른 활동은 계속할 수 있어. 일당·경력은 다음 날 정산!")}<p class="tip-banner">하루 1회 · 주인 기력 −50<br>직접 일하기 일당 기존 대비 5배 · 승진마다 공사장 1일 / 회사 2일 / 츄르연구소 3일<br>집 보너스 ${Math.round(h.work * 100)}% · 탈것 ${Math.round(E.vehicleBonus(s) * 100)}% (최고 1개만) · 각 수입 보너스 곱연산 · 직원 고용 할인 ${h.discount * 100}%</p><div class="shop-grid">${E.jobs
      .map((j, i) => {
        const own = E.promotion(s, i),
          staff = E.promotion(s, i, true),
          hired = s.employees.includes(i);
        if (!E.jobUnlocked(s, i))
          return `<article class="shop-card"><h3>🔒 ${j.name}</h3><p>${E.jobs[i - 1].name} 주인 10단계 달성 시 해금</p></article>`;
        return `<article class="shop-card"><span class="equipment-icon">${["⚒", "▣", "⚗"][i]}</span><h3>${j.name}</h3><p>주인 ${s.workLevels[i]}/10단계 · 근무 ${s.workDays[i]}일 · 현재 승진 근무 ${s.promotionDays[i]}일<br>일당 ${E.jobPay(s, i)} G</p><button class="btn primary" data-job="${i}" ${s.daily.work || s.energy < 50 || !E.canAct(s) ? "disabled" : ""}>직접 일하기 · 기력 −50</button><button class="btn" data-promote="owner:${i}" ${!own || s.promotionDays[i] < own.days || s.gold < own.cost ? "disabled" : ""}>${own ? `승진 ${money(own.cost)} G · 이번 단계 ${s.promotionDays[i]}/${own.days}일` : "주인 최고 단계"}</button><p>직원 ${s.staffLevels[i]}/10단계 · 일당 ${E.jobPay(s, i, true)} G</p><button class="btn" data-hire="${i}" ${hired || s.gold < Math.floor(j.hire * (1 - h.discount)) ? "disabled" : ""}>${hired ? "직원 고용됨" : `직원 고용 ${money(Math.floor(j.hire * (1 - h.discount)))} G`}</button><button class="btn" data-promote="staff:${i}" ${!hired || !staff || s.staffLevels[i] >= s.workLevels[i] || s.gold < staff.cost ? "disabled" : ""}>${s.staffLevels[i] >= s.workLevels[i] && staff ? "주인 승진 필요" : staff ? `직원 교육 ${money(staff.cost)} G` : "직원 최고 단계"}</button></article>`;
      })
      .join("")}</div><p class="game-notice">${statusText(s)}</p>`,
  );
  bind("job", (i) => {
    if (E.startJob(s, Number(i))) {
      save();
      showCutscene(["construction", "office", "lab"][i], renderWork);
    }
  });
  bind("hire", (i) => {
    if (E.hire(s, Number(i))) {
      save();
      renderWork();
      notice("직원 고용 완료! 다음 날부터 자동 수입.");
    }
  });
  bind("promote", (v) => {
    const [type, i] = v.split(":");
    if (E.promote(s, Number(i), type === "staff")) {
      save();
      playEffect("victory");
      renderWork();
    }
  });
}
function renderInfluencer() {
  const s = player(),
    cost = E.influenceCost(s);
  gameShell(
    `${title("INFLUENCER CAT", "인플루언서냥", "하루 첫 활동 시 기력 −25 · 이후 추가 소모 없음")}<p class="tip-banner">들어오거나 구경할 때는 기력 소모 없음.<br>오늘 ${cost ? "아직 미사용 · 첫 활동 −25" : "기력 결제 완료 · 추가 소모 0"}<br>펫스타 하루 1회 / 펫 Live 3일에 1회</p><div class="destination-grid"><button class="destination" data-social="star"><span>✦</span><h2>펫스타</h2><p>팔로워 ${s.followers}명 · 남음 ${1 - s.daily.star}/1 ${s.daily.star ? "· 오늘 완료" : ""}</p></button><button class="destination" data-social="live"><span>◉</span><h2>펫 Live</h2><p>팔로워 ${s.liveFollowers}명 · ${s.day - s.liveDay >= 3 ? "방송 가능" : `${3 - s.day + s.liveDay}일 후`}</p></button></div>`,
  );
  bind("social", (id) => (id === "star" ? renderStar() : renderLive()));
}
const starTopics = STAR_TOPICS;
let starFeedLimit = 12;
function socialBackdrop(fans) {
  const tier = socialLevel(fans);
  return `<p class="studio-level">${tier.name} · ${money(fans)}명 ${tier.next ? `/ 다음 배경 ${money(tier.next.at)}명` : "/ 최종 배경 달성!"}</p>`;
}
function studioProps() {
  return '<div class="studio-lights"></div><span class="studio-speaker speaker-left">▥</span><span class="studio-speaker speaker-right">▥</span><div class="studio-stars">✦　✧　✦</div>';
}
function renderStar() {
  const s = player(),
    cost = E.influenceCost(s),
    trend = (s.day - 1) % STAR_TOPICS.length,
    tier = socialLevel(s.followers);
  gameShell(
    `${title("PETSTAR", "펫스타", "오늘도 귀여움 정상 영업 중.")}<div class="social-profile"><span class="social-avatar">✦</span><div><strong>@chunbae_official</strong><p>팔로워 ${money(s.followers)}명 · 남음 ${1 - s.daily.star}/1 ${s.daily.star ? "· 오늘 완료" : ""}</p></div></div>${socialBackdrop(s.followers)}<p class="tip-banner">오늘 유행 #${STAR_TOPICS[trend]} · 기본 획득 팬의 20%는 Live로!<br>게시 완료 시 10%로 유명인 가상 좋아요: 행복도 100 / 펫스타 팬 +10%. 이 보너스는 Live로 재유입되지 않아.</p><div class="social-photo studio-${tier.level}">${studioProps()}${spriteMarkup("chunbae", "happy", "breathing")}<span>오늘 주인공은 춘배.</span></div><label class="field-label">사진 주제<select id="starTopic">${STAR_TOPICS.map((topic, i) => `<option value="${i}" ${(i === 1 && !s.treats.some((n) => n > 0)) || (i === 2 && !s.toys.length) || (i === 11 && !s.romance) ? "disabled" : ""}>${topic}</option>`).join("")}</select></label><button class="btn primary wide" id="postStar" ${s.daily.star || s.energy < cost || !E.canAct(s) ? "disabled" : ""}>사진 올리기 · 기력 −${cost}</button><div class="section-heading"><h2>내 피드 (${s.feed.length})</h2><span>16개 주제 · 48개 캡션 · 40개 댓글</span></div>${s.feed
      .slice(0, starFeedLimit)
      .map(
        (f) =>
          `<article class="feed-item"><span>${E.dateLabel(f.day)} · ${STAR_TOPICS[f.topic] || "일상"}</span><strong>♥ ${f.likes} · 새 팔로워 ${f.gain}</strong><h3>${f.caption || "오늘도 춘배답게 살았다."}</h3><p>랜선집사: ${f.comment}</p>${f.comment2 ? `<p>젤리덕후: ${f.comment2}</p>` : ""}${f.celebrity ? `<p class="celebrity-note">✦ ${f.celebrity} 님이 좋아합니다! (게임 속 가상 이벤트) · 팬 +${f.bonus}</p>` : ""}</article>`,
      )
      .join(
        "",
      )}${s.feed.length > starFeedLimit ? '<button class="btn wide" id="moreStarFeed">이전 피드 더 보기</button>' : ""}`,
    renderInfluencer,
  );
  document.querySelector("#postStar").onclick = () => {
    const result = E.publishStar(
      s,
      Number(document.querySelector("#starTopic").value),
    );
    if (!result) return;
    playEffect("shutter");
    save();
    renderStar();
    notice(
      `펫스타 +${result.gain}명 · Live +${result.cross}명${result.encounter ? " · " + result.encounter : ""}`,
    );
    if (result.celebrity) {
      catVoice("surprise");
      showModal(
        "✦ 유명인이 좋아요를 눌렀어!",
        `<div class="celebrity-celebration">${spriteMarkup("chunbae", "surprise")}<strong>${result.celebrity}</strong></div><p>게임 속 가상 좋아요 이벤트! (게시 시 10%)<br>춘배 행복도 100 · 펫스타 팔로워 10% 증가 (+${money(result.bonus)}명)<br>이 보너스는 채널 간 20% 유입을 다시 발생시키지 않아.</p>`,
      );
    }
  };
  const more = document.querySelector("#moreStarFeed");
  if (more)
    more.onclick = () => {
      starFeedLimit += 12;
      renderStar();
    };
}
function renderLive() {
  const s = player(),
    cost = E.influenceCost(s),
    remaining = Math.max(0, 3 - s.day + s.liveDay),
    tier = socialLevel(s.liveFollowers);
  gameShell(
    `${title("PET LIVE", "펫 Live", "매 방송 네 가지 상황, 상황마다 네 가지 선택!")}<div class="social-profile"><span class="social-avatar">●</span><div><strong>춘배의 Live</strong><p>팔로워 ${money(s.liveFollowers)}명 · ${remaining ? remaining + "일 후" : "오늘 방송 가능"}</p></div></div>${socialBackdrop(s.liveFollowers)}<div class="live-stage studio-${tier.level}">${studioProps()}${spriteMarkup("chunbae", "normal", "breathing")}<span class="live-badge">● LIVE PREVIEW</span></div><label class="field-label">방송 주제<select id="liveTopic">${LIVE_TOPICS.map((t, i) => `<option ${(i === 1 && !s.treats.some((n) => n > 0)) || (i === 2 && !s.toys.length) || (i === 9 && !s.romance) || (i === 11 && s.liveFollowers < 300) ? "disabled" : ""}>${t}</option>`).join("")}</select></label><button class="btn primary wide" id="startLive" ${remaining || s.energy < cost || !E.canAct(s) ? "disabled" : ""}>방송 시작 · 기력 −${cost}</button><p class="note">12개 주제 · 24개 상황 · 96개 선택지. 선택마다 팬·후원·행복도 결과가 달라져.<br>네 번째 선택은 돌발 도전! 45%로 대성공, 나머지는 소소한 반응이야.<br>소품은 소비하지 않아. 완료 시 썸냥이 만남 5%, 300명부터 협찬 방송 해금.</p>${s.lastLive ? `<p class="game-notice">지난 방송: 후원 ${s.lastLive.gold} G · 팔로워 +${s.lastLive.gain}</p>` : ""}`,
    renderInfluencer,
  );
  document.querySelector("#startLive").onclick = () => {
    if (!E.useInfluence(s, "live")) return;
    const topic = document.querySelector("#liveTopic").value;
    save();
    runLive(topic);
  };
}
function runLive(topic) {
  const s = player(),
    playlist = livePlaylist(topic),
    tier = socialLevel(s.liveFollowers);
  let step = 0,
    fanScore = 0,
    goldScore = 0;
  function draw() {
    const scene = playlist[step];
    gameShell(
      `${title("● ON AIR", topic)}${socialBackdrop(s.liveFollowers)}<div class="live-stage studio-${tier.level}" id="onairStage">${studioProps()}${spriteMarkup("chunbae", "normal", "live-cat breathing")}${topic === "썸냥이 합방" && s.romance ? spriteMarkup(s.romance.kind, "happy", "live-partner") : ""}<div class="owner-actor" id="liveOwner" hidden><canvas id="liveOwnerArt" width="32" height="32"></canvas></div><span class="live-prop" id="liveProp"></span><span class="live-badge">● LIVE</span><div class="live-chat" id="liveChat">채팅: ${scene[0]}</div></div><h2>${scene[0]}</h2><div class="choice-row live-choices">${scene[1].map((label, i) => `<button class="btn" data-choice="${i}">${label}<small>${["팬 중심 · 팬 +18 / 후원 +12", "후원 중심 · 팬 +10 / 후원 +24", "편안하게 · 팬 +6 / 후원 +8 / 행복도 +5", "돌발 도전 · 45% 대성공"][i]}</small></button>`).join("")}</div><p class="note">돌발 상황 ${step + 1}/4 · 중단하면 횟수는 소모되고 정산은 없어.</p>`,
      renderLive,
    );
    activeActivity = true;
    let timer;
    bind("choice", (raw) => {
      const choice = Number(raw);
      document
        .querySelectorAll("[data-choice]")
        .forEach((b) => (b.disabled = true));
      const stage = document.querySelector("#onairStage"),
        mode = scene[2][choice];
      stage.classList.add(
        mode === "dance"
          ? "dance-scene"
          : mode === "owner"
            ? "owner-scene"
            : mode === "paw"
              ? "paw-scene"
              : mode === "sleep"
                ? "sleep-scene"
                : mode === "jump"
                  ? "jump-scene"
                  : mode === "zoom"
                    ? "zoom-scene"
                    : mode === "pair"
                      ? "pair-scene"
                      : "bounce-scene",
      );
      if (["owner", "dance"].includes(mode)) {
        document.querySelector("#liveOwner").hidden = false;
        person(
          document.querySelector("#liveOwnerArt").getContext("2d"),
          4,
          1,
          false,
        );
      }
      document.querySelector("#liveProp").textContent = {
        feed: "🥫",
        toy: "🧶",
        paw: "🐾",
        sleep: "☾",
        dance: "♪",
        jump: "✦",
        pair: "♥",
        zoom: "📸",
        owner: "💼",
      }[mode];
      const risky = choice === 3,
        win = risky && Math.random() < 0.45;
      fanScore += risky ? (win ? 36 : 4) : [18, 10, 6][choice];
      goldScore += risky ? (win ? 35 : 3) : [12, 24, 8][choice];
      E.happy(s, choice === 2 ? 5 : risky ? (win ? 3 : -3) : 1);
      document.querySelector("#liveChat").textContent = risky
        ? win
          ? "채팅: 레전드ㅋㅋㅋㅋ 클립 땄다!"
          : "채팅: 집사야 괜찮아… 이것도 추억이다."
        : [
            "채팅: 귀여워서 친구 다 불렀어요!",
            "채팅: 광고까지 귀엽네 후원합니다!",
            "채팅: 편안하다… 춘배가 행복하면 됐어.",
          ][choice];
      catVoice(
        mode === "sleep" ? "purr" : risky && !win ? "complain" : "happy",
      );
      save();
      timer = setTimeout(() => {
        step++;
        if (step < 4) {
          draw();
          return;
        }
        const before = s.liveFollowers,
          cross = E.addFollowers(s, "live", 20 + fanScore),
          gain = s.liveFollowers - before,
          gold = E.reward(s, 35 + goldScore + (topic === "협찬 방송" ? 90 : 0));
        s.lastLive = { viewers: 20 + s.liveFollowers, gold, gain, topic };
        s.highlights.push(topic + " 명장면");
        s.highlights = s.highlights.slice(-15);
        const event = E.meet(s, "live");
        E.log(s, `펫 Live 종료 · ${topic} · 팬 +${gain} · 후원 +${gold} G`);
        save();
        activeActivity = false;
        renderLive();
        showModal(
          "방송 정산",
          `<p>후원 +${gold} G · Live +${gain}명 · 펫스타 +${cross}명</p>${event ? `<p>${event}</p>` : ""}`,
        );
      }, 1300);
    });
    setCleanup(() => clearTimeout(timer));
  }
  draw();
}
function renderHospital() {
  const s = player(),
    cost = E.hospitalCost(s);
  gameShell(
    `${title("NINE LIVES CLINIC", "펫병원", "부족한 치료비는 긴급 대출. 당일 주인 기력은 회복되지 않아.")}<div class="hospital-stage">${spriteMarkup("chunbae", s.hospital ? "sad" : "happy")}</div><div class="activity-info"><h2>${s.hospital ? "춘배를 치료해 줘" : "건강한 춘배"}</h2><p>치료 ${cost} G · 행복도 30으로 회복<br>주인 기력 회복 없음</p><button class="btn primary" id="healPet" ${!s.hospital ? "disabled" : ""}>${s.gold < cost ? "부족한 돈 빌려서 치료" : "치료하기"}</button></div>`,
  );
  document.querySelector("#healPet").onclick = () => {
    const result = E.heal(s);
    if (result) {
      save();
      renderHospital();
      meow();
      notice(
        `치료 완료 · ${result.cost} G${result.borrow ? " · 대출 " + result.borrow + " G" : ""}`,
      );
    }
  };
}
function renderBank(tab = "main") {
  const s = player();
  if (tab === "main") {
    gameShell(
      `${title("CHUNBAE FINANCIAL GROUP", "펫은행", "은행장 춘배. 신용 심사는 눈빛으로.")}<div class="bank-card"><span>금화 잔액 / 대출 잔액</span><strong>${money(s.gold)} <small>G / ${money(E.debt(s))} G</small></strong><p>LV.${s.level} 대출 한도 ${money(E.loanLimit(s))} G · 만기 5일 · 이자 50% / 부족 시 100% · 추가 이자 없음</p></div>${portfolio(s)}<div class="destination-grid three"><button class="destination" data-bank="loan"><span>◈</span><h2>돈 빌리기</h2><p>레벨별 한도 · 상환 일정</p></button><button class="destination" data-bank="spend"><span>▥</span><h2>돈 쓰기</h2><p>주식 · 코인 · 빌딩 · 회사</p></button><button class="destination" data-bank="house"><span>⌂</span><h2>집 사기</h2><p>집사의 출근 효율까지 달라져</p></button></div>`,
    );
    bind("bank", renderBank);
    return;
  }
  if (tab === "loan") {
    gameShell(
      `${title("LOANS & DEADLINES", "돈 빌리기", "5일 만기: 원금 + 이자 50% 자동 상환. 부족하면 이자 100%로 한 번 차감해 마이너스 잔액으로 처리하고 종료. 이후 추가 이자는 없어.")}<div class="tip-banner">추가 대출 가능 ${Math.max(0, E.loanLimit(s) - E.debt(s))} G · 병원 긴급 대출은 한도 예외</div><label class="field-label">대출 금액<input id="loanAmount" type="number" min="10" step="10" value="100"></label><button class="btn primary wide" id="borrow">빌리기 · DAY ${s.day + 5} 만기</button><div class="section-heading"><h2>대출 내역</h2></div>${s.loans.length ? s.loans.map((l, i) => `<div class="loan-row"><span>${l.source}<small>DAY ${l.due} 만기 · 자동 상환 ${Math.ceil(l.amount * 1.5 - 1e-8)} G / 부족 시 ${l.amount * 2} G · 추가 이자 없음</small></span><strong>${l.amount} G</strong><button class="btn" data-repay="${i}" ${s.gold < l.amount ? "disabled" : ""}>조기 상환 · 이자 면제</button></div>`).join("") : '<p class="empty-state">아직 춘배에게 빚진 돈은 없어.</p>'}`,
      () => renderBank(),
    );
    document.querySelector("#borrow").onclick = () => {
      const n = Number(document.querySelector("#loanAmount").value);
      if (E.takeLoan(s, n)) {
        save();
        renderBank("loan");
        notice("대출 완료. 달력은 보고 사는 거지?");
      } else notice("양의 정수 금액과 남은 한도를 확인해 줘.");
    };
    bind("repay", (i) => {
      const l = s.loans[i];
      if (l && E.spend(s, l.amount)) {
        s.loans.splice(Number(i), 1);
        save();
        renderBank("loan");
        notice("조기 상환! 이자는 면제해 줄게.");
      }
    });
    return;
  }
  if (tab === "house") {
    gameShell(
      `${title("REAL ESTATE FOR REAL CATS", "집 사기", "집 8종 · 최고가 1,000,000 G · 마지막 두 집은 다이아 30개 / 80개도 필요해. 한 번 산 집은 무료로 다시 선택할 수 있고 현재 집의 효과만 적용돼.")}<div class="shop-grid house-grid">${E.houses.map((h, i) => shopCard("house", h, i, s)).join("")}</div>`,
      () => renderBank(),
    );
    bind("buy", (value) => {
      const [t, i] = value.split(":");
      const beforeGold = s.gold,
        beforeDiamonds = s.diamonds;
      if (E.purchase(s, t, Number(i))) {
        if (s.gold < beforeGold || s.diamonds < beforeDiamonds)
          playEffect("purchase");
        save();
        renderBank("house");
        meow();
        notice("이사 완료! 춘배의 방 배경과 일터 효과가 바뀌었어.");
      }
    });
    return;
  }
  if (tab === "spend") {
    gameShell(
      `${title("LET MONEY DO THE WORK", "돈 쓰기")}<div class="destination-grid">${[
        [
          "stock",
          "펫주식 투자",
          "하루 −30%~+30% · 종목 1G 이하: 다음 날 보유분 소멸 · 3일 뒤 기본가격 재상장",
        ],
        [
          "coin",
          "펫코인 투자",
          "하루 −99%~+200% · 종목 1G 이하: 다음 날 보유분 소멸 · 3일 뒤 기본가격 재상장",
        ],
        ["building", "펫빌딩 구매", "매일 빌딩 가격의 2% 임대 수입"],
        ["company", "펫회사 사기", "매일 금화 1% + 회사가의 1% 상당 주식"],
      ]
        .map(
          ([id, n, d]) =>
            `<button class="destination" data-invest="${id}"><span>▥</span><h2>${n}</h2><p>${d}</p></button>`,
        )
        .join("")}</div>`,
      () => renderBank(),
    );
    bind("invest", renderInvest);
  }
}
function renderInvest(type) {
  const s = player();
  if (["building", "company"].includes(type)) {
    const items = type === "building" ? E.buildings : E.companies;
    gameShell(
      `${title("PASSIVE INCOME", type === "building" ? "펫빌딩 구매" : "펫회사 사기", type === "company" ? "매일 회사 가격의 1% 금화 + 회사 가격의 1% 상당 주식 지급 · 정산 시 주가 기준 · 주식은 소수 둘째 자리까지 내림 · 현실 기업의 상대적 규모를 참고한 게임 가격" : "빌딩 9종 · 최고가 1,000,000 G · 매일 구매 가격의 2% 지급")}<div class="shop-grid">${items.map((item, i) => shopCard(type, item, i, s)).join("")}</div>`,
      () => renderBank("spend"),
    );
    bind("buy", (v) => {
      const [t, i] = v.split(":");
      const beforeGold = s.gold,
        beforeDiamonds = s.diamonds;
      if (E.purchase(s, t, Number(i))) {
        if (s.gold < beforeGold || s.diamonds < beforeDiamonds)
          playEffect("purchase");
        save();
        renderInvest(type);
        notice("구매 완료! 이제 돈이 출근할 차례야.");
      }
    });
    return;
  }
  const items = type === "stock" ? E.companies : E.coins,
    book = type === "stock" ? s.stocks : s.coinHoldings;
  gameShell(
    `${title("MARKET · DAY " + s.day, type === "stock" ? "펫주식 투자" : "펫코인 투자", type === "stock" ? "기본 전일 대비 −30%~+30% · 떡상·떡락 이벤트는 추가 ±30% (각 1%) · 1G 단위 반올림 · 종목 가격 1G 이하 시 거래 정지 · 다음 날 보유분 전량 소멸 · 3일 뒤 기본가격 재상장 · 매수·매도 수수료 각각 2% · 소수 둘째 자리까지 거래" : "기본 전일 대비 −99%~+200% · 떡상 +200% / 떡락 −80% 이벤트 (각 1%) · 1G 단위 반올림 · 종목 가격 1G 이하 시 거래 정지 · 다음 날 보유분 전량 소멸 · 3일 뒤 기본가격 재상장 · 매도 수수료 4%")}<label class="field-label">거래 수량 · 1회 최대 1,000주/개<input id="tradeQty" type="number" min="${type === "stock" ? "0.01" : "1"}" step="${type === "stock" ? "0.01" : "1"}" max="1000" value="1"></label><div class="market-list">${items.map((item, i) => `<article class="market-row"><span><strong>${item.name}</strong><small>보유 ${type === "stock" ? (book[i] || 0).toFixed(2) : book[i] || 0}${type === "stock" ? "주" : "개"}</small>${listingInfo(s, type, i)}</span><b>${E.price(s, type, i)} G<small>${marketChange(s, type, i)}</small></b><div class="market-order"><button class="btn" data-trade="${i}:buy" ${tradeCapacity(s, type, i, "buy") === 0 ? "disabled" : ""}>매수</button><small class="trade-capacity" data-capacity="${i}:buy">매수 가능<br><strong>${type === "stock" ? tradeCapacity(s, type, i, "buy").toFixed(2) : money(tradeCapacity(s, type, i, "buy"))}${type === "stock" ? "주" : "개"}</strong></small></div><div class="market-order"><button class="btn" data-trade="${i}:sell" ${tradeCapacity(s, type, i, "sell") === 0 ? "disabled" : ""}>매도</button><small class="trade-capacity" data-capacity="${i}:sell">매도 가능<br><strong>${type === "stock" ? tradeCapacity(s, type, i, "sell").toFixed(2) : money(tradeCapacity(s, type, i, "sell"))}${type === "stock" ? "주" : "개"}</strong></small></div></article>`).join("")}</div>`,
    () => renderBank("spend"),
  );
  bind("trade", (v) => {
    const [i, side] = v.split(":"),
      qty = Number(document.querySelector("#tradeQty").value);
    if (E.trade(s, type, Number(i), side, qty)) {
      if (side === "buy") playEffect("purchase");
      save();
      renderInvest(type);
      notice("거래 완료. 춘배는 투자 조언을 하지 않는다냥.");
    } else notice("금화·보유 수량·거래 수량을 확인해 줘.");
  });
}
function renderRomance(emotion = "normal") {
  const s = player(),
    r = s.romance,
    labels = ["썸냥이", "연인냥이", "부부냥이", "평생의 냥"];
  const encounterHelp = `<div class="tip-banner"><strong>썸냥이 만나는 방법</strong><p>던전 클리어 5% · 공원산책·드라이브 완료 5%<br>주인 일하기 완료 5% · 펫 Live 완료 5% · 펫스타 게시 완료 5%</p><p>활동 완료 때 각각 판정해. 치즈냥이 한 종류만 등장해. 이미 함께라면 중복 만남은 없어.</p></div>`;
  if (!r) {
    gameShell(
      `${title("LOVE, PAWS & CHURU", "연애")}<div class="empty-romance"><span>♡</span><h2>아직 만난 썸냥이가 없어!</h2><p>어딘가에서 치즈냥이가 너를 기다려.</p></div>${encounterHelp}`,
    );
    return;
  }
  const b = E.relationshipBonus ? E.relationshipBonus(s) : null;
  gameShell(
    `${title("ONE LITTLE LOVE STORY", "연애", escapeLog(E.partnerName(s)) + "와 함께하는 이야기 · 행동마다 주인 기력 −25")}<div class="romance-stage">${spriteMarkup(r.kind, emotion, "breathing")}<span class="relationship-badge">${labels[r.stage]}</span><div class="romance-hearts">${"♥".repeat(Math.floor(r.affection))}${"♡".repeat(10 - Math.floor(r.affection))}</div></div><div class="tip-banner"><strong>호감도 ${r.affection.toFixed(2)} / ${r.stage === 0 ? 3 : r.stage === 1 ? 6 : 10}</strong><p>${r.stage === 0 ? "고백 성공 전에는 3을 넘지 않아." : r.stage === 1 ? "프로포즈 성공 전에는 6을 넘지 않아." : r.stage === 2 ? "10을 채우면 평생의 냥이 돼." : "평생 함께! 헤어지기·이혼·갈아타기 불가."}</p><p>${["썸을 알아가는 중", "활동 수입 +8% · 공격 +1 · 방어 +1", "활동 수입 +15% · 공격 +3 · 방어 +2 · 매일 20 G", "활동 수입 +30% · 공격 +6 · 방어 +4 · 매일 50 G와 참치 츄르"][r.stage]}</p></div><div class="romance-actions"><button class="btn" id="talkPartner" ${s.energy < 25 || s.daily.talk || !E.canAct(s) ? "disabled" : ""}>대화하기 · 기력 −25 · 하루 1회</button><button class="btn primary" id="confess" ${s.energy < 25 || r.stage !== 0 || r.affection < 3 || s.diamonds < 1 || !E.canAct(s) ? "disabled" : ""}>고백 · ◆1 · 기력 −25 · 성공 50%</button><button class="btn primary" id="propose" ${s.energy < 25 || r.stage !== 1 || r.affection < 6 || s.diamonds < 5 || !E.canAct(s) ? "disabled" : ""}>프로포즈 · ◆5 · 기력 −25 · 성공 50%</button>${r.stage < 3 ? `<button class="btn danger" id="breakUp" ${s.energy < 25 ? "disabled" : ""}>${r.stage === 2 ? "이혼하기 · 기력 −25" : "헤어지기 · 기력 −25"}</button>` : ""}</div><p class="note">실패해도 호감도는 떨어지지 않아. 고백·프로포즈 자체로 호감도가 오르지는 않아.</p><div class="section-heading"><h2>선물하기 · 오늘 ${s.daily.gift}/1</h2></div><div class="shop-grid">${E.treats.map((t, i) => `<article class="shop-card"><h3>${t.name}</h3><p>보유 ${s.treats[i]}개 · 호감도 +${t.affection}${r.kind === i ? " · 취향 보너스" : ""}</p><button class="btn" data-give-treat="${i}" ${s.energy < 25 || s.daily.gift || !s.treats[i] || !E.canAct(s) ? "disabled" : ""}>츄르 선물 · 기력 −25</button></article>`).join("")}${s.toys.map((i) => `<article class="shop-card"><h3>${E.toys[i].name}</h3><p>보유 ${s.toyBag[i] || 0}개 · 호감도 +${E.toys[i].affection.toFixed(2)}</p><button class="btn" data-give-toy="${i}" ${s.energy < 25 || s.daily.gift || !s.toyBag[i] || !E.canAct(s) ? "disabled" : ""}>장난감 선물 · 기력 −25</button></article>`).join("")}</div><div class="section-heading"><h2>데이트 · 하루 1회</h2></div><div class="shop-grid">${E.dates.map((d, i) => `<article class="shop-card"><h3>${d.name}</h3><p>${money(d.cost)} G · 호감도 +${d.gain}</p><button class="btn" data-date="${i}" ${s.energy < 25 || s.daily.date || s.gold < d.cost || !E.canAct(s) ? "disabled" : ""}>데이트 가기 · 기력 −25</button></article>`).join("")}</div>${s.candidate !== null && r.stage < 3 ? `<div class="new-crush">${spriteMarkup(s.candidate, "surprise")}<h2>${E.partners[s.candidate].name}가 다가왔어!</h2><p>갈아타면 기존 관계는 끝나고 호감도 0부터 시작해.</p><button class="btn" id="switchPartner" ${s.energy < 25 ? "disabled" : ""}>갈아타기 · 기력 −25</button></div>` : ""}<details><summary>만남 확률 보기</summary>${encounterHelp}</details>`,
  );
  document.querySelector("#talkPartner").onclick = () => {
    if (E.talk(s)) {
      save();
      renderRomance("happy");
      notice("오늘도 집사 흉을 보며 가까워졌어. 호감도가 올랐어!");
    }
  };
  for (const [id, proposal] of [
    ["confess", false],
    ["propose", true],
  ])
    document.getElementById(id).onclick = () => {
      const success = E.confess(s, proposal);
      if (success === null) return;
      save();
      renderRomance(success ? "happy" : "sad");
      playEffect(success ? "victory" : "sad");
      showModal(
        success ? "마음을 받아줬어!" : "조금만 더 기다려줄래?",
        success
          ? `<p>${proposal ? "부부냥이가 됐어! 이제 춘배의 방에 둘이 함께 있어." : "연인냥이가 됐어! 호감도 6까지 쌓을 수 있어."}</p>`
          : "<p>호감도는 그대로야. 다이아는 소모됐어.</p>",
      );
    };
  bind("give-treat", (i) => {
    if (E.feedTreat(s, Number(i), true)) {
      save();
      renderRomance("happy");
      meow();
    }
  });
  bind("give-toy", (i) => {
    if (E.giftToy(s, Number(i))) {
      save();
      renderRomance("happy");
      meow();
    }
  });
  bind("date", (i) => {
    if (E.date(s, Number(i))) {
      save();
      renderRomance("happy");
      showModal(
        "같이 보낸 하루",
        `<div class="date-cats">${spriteMarkup("chunbae", "happy")}${spriteMarkup(r.kind, "happy")}</div><p>${E.dates[i].name}에서 즐거운 시간을 보냈어!</p>`,
      );
    }
  });
  const breakup = document.querySelector("#breakUp");
  if (breakup)
    breakup.onclick = () => {
      if (
        confirm(
          `${r.stage === 2 ? "이혼" : "헤어지기"}할까? 현재 호감도는 사라져.`,
        ) &&
        E.breakUp(s)
      ) {
        save();
        renderRomance();
        playEffect("sad");
      }
    };
  const swap = document.querySelector("#switchPartner");
  if (swap)
    swap.onclick = () => {
      if (
        confirm("기존 관계를 끝내고 새 냥이와 호감도 0부터 시작할까?") &&
        E.switchPartner(s)
      ) {
        save();
        renderRomance("normal");
      }
    };
}
function renderDaySummary(report) {
  const s = player(),
    delta = s.lastDayDelta,
    sign = (n) =>
      n > 0
        ? "+" + Number(n.toFixed(2)).toLocaleString("ko-KR")
        : Number(n.toFixed(2)).toLocaleString("ko-KR");
  gameShell(
    `<div class="day-summary">${title("A NEW LITTLE DAY", E.calendar(s.day).season + " " + E.calendar(s.day).date + " (" + E.calendar(s.day).weekday + ")", "어제보다 조금 더 우리다운 하루.")}<div class="sleeping-pair">${spriteMarkup("chunbae", "sleep")}${s.romance?.stage >= 2 ? spriteMarkup(s.romance.kind, "sleep") : ""}</div><div class="day-deltas">${[
      ["전날 번 금화", delta.gold, " G"],
      ["전날 얻은 다이아", delta.diamonds, "개"],
      ["팬 수", delta.fans || 0, "명"],
      ["호감도", delta.affection || 0, ""],
    ]
      .map(
        ([label, n, unit]) =>
          `<div><span>${label}</span><strong class="${n < 0 ? "negative" : "positive"}">${sign(n)}${unit}</strong></div>`,
      )
      .join(
        "",
      )}</div><div class="day-ledger"><p>금화 순변동 ${sign(delta.netGold ?? delta.gold)} G · 오늘 주인 기력 ${s.energy}/100 · 행복도 ${s.happiness}/100</p>${report.map((t) => `<p>${t}</p>`).join("")}</div><button class="btn primary wide" id="startNewDay">오늘을 시작하자</button></div>`,
  );
  document.getElementById("startNewDay").onclick = renderHome;
}
function playIntro() {
  cleanupView();
  const s = player();
  document.body.dataset.screen = "intro";
  let step = 0,
    sceneAudio = null,
    currentScene = "";
  const lines = [
    [
      "battle",
      "오래전, 마지막 성문 앞",
      "검게 물든 하늘 아래, 춘배와 치즈냥이는 나란히 서 있었다. 둘의 뒤에는 아직 지켜야 할 작은 마을이 있었다.",
    ],
    [
      "demon",
      "마왕",
      "고작 작은 발톱으로 나를 막겠다고? 그렇다면 너희가 서로를 지키는 이유부터 빼앗아 주마.",
    ],
    [
      "demon",
      "치즈냥이",
      "춘배야, 무서워도 내 옆에 있어. 우리… 언제나 같이 돌아가기로 했잖아.",
    ],
    ["battle", "춘배", "응. 네가 있는 곳이라면, 나는 끝까지 싸울 거야!"],
    [
      "curse",
      "마왕",
      "잊어라. 함께 웃었던 날도, 서로를 부르던 이름도. 너희의 모든 기억을 이 어둠 속에 묻어라!",
    ],
    [
      "curse",
      "기억의 틈",
      "익숙한 목소리가 멀어졌다. 약속도, 집으로 가는 길도, 바로 옆에 있던 친구의 이름마저 하얗게 흩어졌다.",
    ],
    [
      "flight",
      "마왕의 마지막 일격",
      "거대한 충격이 성문을 갈랐다. 맞잡으려던 두 발이 엇갈리고, 춘배와 치즈냥이는 서로 다른 먼 곳으로 날아갔다.",
    ],
    [
      "rain",
      "며칠 뒤, 비 오는 숲",
      "쏟아지는 빗소리 사이로 작은 울음이 새어 나왔다. 나무 아래 웅크린 고양이는 자신이 어디에서 왔는지도 몰랐다.",
    ],
    ["rain", "집사", "어…? 너, 왜 이런 데 혼자 있니? 발도 온통 젖었잖아."],
    [
      "rain",
      "춘배",
      "…냐옹. (떠올리려 할수록 머릿속이 텅 비었다. 그런데 누군가를 찾아야 할 것만 같았다.)",
    ],
    [
      "rain",
      "집사",
      "괜찮아. 무서워하지 마. 따뜻한 곳부터 찾자. 나도 가진 건 별로 없지만… 같이 있으면 방법이 생기겠지.",
    ],
    [
      "rain",
      "집사",
      "춘배라고 불러도 될까? 왠지 너한테 잘 어울려. 자, 우리 같이 가자.",
    ],
    [
      "rain",
      "낯익은 울음",
      "숲 너머에서 고양이 울음이 들린 듯했다. 춘배는 잠깐 뒤돌아봤다. 누구였을까. 왜 이렇게 가슴이 먹먹할까.",
    ],
    [
      "dawn",
      "잊어버린 이야기의 첫날",
      "모든 기억을 잃어도, 다시 만날 인연은 남아 있다. 춘배와 집사의 조금 이상하고 따뜻한 냥생이 시작된다.",
    ],
  ];
  function draw() {
    const [scene, speaker, line] = lines[step];
    if (scene !== currentScene) {
      sceneAudio?.stop();
      currentScene = scene;
      const names = {
        demon: "demon",
        curse: "memory",
        flight: "flight",
        rain: "rain",
      };
      sceneAudio = names[scene]
        ? playMedia(
            names[scene],
            scene === "rain" ? 0.38 : 0.65,
            scene === "rain",
          )
        : null;
    }
    const forest = scene === "rain" || scene === "dawn";
    app.innerHTML = `<section class="intro-panel"><div class="intro-forest story-scene story-${scene}">${forest ? '<div class="intro-tree"></div><div class="intro-bush bush-left"></div><div class="intro-bush bush-right"></div>' : '<div class="dark-castle">♜</div><div class="demon-king"><span>♛</span><strong>魔</strong></div><div class="curse-rings"></div>'}<div class="story-cats">${spriteMarkup("chunbae", forest ? (scene === "dawn" ? "happy" : "sad") : "surprise", forest ? "shivering" : "")}${!forest ? spriteMarkup(0, "surprise", "story-cheese") : ""}</div>${scene === "rain" ? '<div class="rain-layer"></div>' : ""}<span class="intro-sun">✦</span></div><div class="intro-dialogue"><small id="introSpeaker"></small><p id="introLine"></p><div class="intro-actions"><button class="text-button" id="skipIntro">건너뛰기</button><span>${step + 1} / ${lines.length}</span><button class="btn primary" id="nextIntro">${step === lines.length - 1 ? "춘배와 시작하기" : "다음 →"}</button></div></div></section>`;
    document.getElementById("introSpeaker").textContent =
      speaker === "집사" ? s.ownerName || "집사" : speaker;
    document.getElementById("introLine").textContent = line;
    document.getElementById("skipIntro").onclick = finish;
    document.getElementById("nextIntro").onclick = () => {
      if (++step >= lines.length) finish();
      else draw();
    };
  }
  function finish() {
    s.introSeen = true;
    sceneAudio?.stop();
    save();
    renderHome();
  }
  setCleanup(() => sceneAudio?.stop());
  draw();
}

let meetingScheduled = false,
  meetingOpen = false;
modal.addEventListener("close", () => {
  if (!meetingOpen) schedulePartnerMeeting();
});
function schedulePartnerMeeting() {
  if (meetingScheduled || meetingOpen) return;
  meetingScheduled = true;
  setTimeout(() => {
    meetingScheduled = false;
    const s = slots[selectedSlot];
    if (
      !s?.romance?.namePending ||
      !s.introSeen ||
      document.body.dataset.screen !== "game" ||
      activeActivity ||
      modal.open
    )
      return;
    showPartnerMeeting(s);
  }, 50);
}
function showPartnerMeeting(s) {
  if (!s.romance?.namePending || meetingOpen) return;
  meetingOpen = true;
  let step = 0;
  const lines = [
    ["낯익은 치즈냥이", "저기… 우리, 어디선가 만난 적 있지 않아?"],
    [
      "춘배",
      "모르겠어. 아무것도 기억나지 않아. 그런데 네 목소리는… 이상하게 따뜻해.",
    ],
    ["치즈냥이", "나도 그래. 아주 오래전부터 너를 기다린 기분이야."],
    ["춘배", "그럼 지금부터 다시 알아가면 되지. 너는 이름이 뭐니?"],
  ];
  function draw() {
    showModal(
      "다시 만난 인연",
      `<div class="meeting-cats">${spriteMarkup("chunbae", "surprise")}${spriteMarkup(0, step < 2 ? "surprise" : "happy")}</div><p class="meeting-speaker">${lines[step][0]}</p><p>${lines[step][1]}</p>${step === 3 ? '<label class="field-label">썸냥이 이름 (1~12자)<input id="partnerName" maxlength="12" placeholder="치즈냥이" autocomplete="off"></label><p id="partnerNameError" role="alert"></p>' : ""}`,
    );
    const button = modal.querySelector(".btn");
    button.textContent = step === 3 ? "이름 확정하고 넘어가기" : "다음 →";
    button.onclick = () => {
      if (step < 3) {
        step++;
        draw();
        return;
      }
      if (!E.namePartner(s, modal.querySelector("#partnerName").value)) {
        modal.querySelector("#partnerNameError").textContent =
          "이름을 1~12자로 적어 줘.";
        return;
      }
      modal.close();
      meetingOpen = false;
      save();
      renderRomance("happy");
      catVoice("happy");
    };
    if (step === 3) {
      modal.querySelector("#partnerName").focus();
      modal.querySelector("#partnerName").onkeydown = (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          button.click();
        }
      };
    }
  }
  modal.addEventListener(
    "cancel",
    () => {
      meetingOpen = false;
    },
    { once: true },
  );
  draw();
}

function escapeLog(t) {
  const d = document.createElement("div");
  d.textContent = t;
  return d.innerHTML;
}
function dailyEventPanel(s) {
  const e = s.event,
    tips = [
      "열면 75%로 츄르!",
      "오늘 획득 팬 +30%",
      "오늘 직접 일하기 일당 +30%",
      "오늘 펫마트 상품 30% 할인",
      "오늘 대화·데이트 호감도 +30%",
      "공원 보상 +30% · 치즈냥이 만남 5%",
      "금화 또는 광고 출연으로 해결",
      "금화 또는 기력 50으로 해결",
      "손톱 다듬기 · 기력 −25 · 행복도 +10",
      "털 다듬기 · 기력 −25 · 행복도 +10",
      "골드 −10% · 기력 −75 · 행복도 −75 (발생 즉시 적용)",
      "목욕하기 · 기력 −50 · 행복도 −10",
      "전체 주식 +30% · 거래 정지·상폐 제외",
      "전체 주식 −30% · 거래 정지·상폐 제외",
      "전체 코인 +200% · 거래 정지·상폐 제외",
      "전체 코인 −80% · 거래 정지·상폐 제외",
    ];
  let controls = "";
  if (e && !e.resolved) {
    if (e.id === 0)
      controls = '<button class="btn" data-event="open">택배 열기</button>';
    else if ([6, 7].includes(e.id)) {
      const fee = (e.id === 7 ? 80 : 30) + s.level * (e.id === 7 ? 35 : 12);
      controls = `<button class="btn" data-event="pay" ${s.gold < fee ? "disabled" : ""}>${fee} G로 해결</button><button class="btn" data-event="${e.id === 7 ? "fight" : "ad"}" ${e.id === 7 && s.energy < 50 ? "disabled" : ""}>${e.id === 7 ? "싸우기 · 기력 −50" : "광고 출연으로 해결"}</button>`;
    } else if ([8, 9, 11].includes(e.id)) {
      const cost = e.id === 11 ? 50 : 25;
      controls = `<button class="btn" data-event="care" ${s.energy < cost || !E.canAct(s) ? "disabled" : ""}>${e.id === 8 ? "손톱깎기" : e.id === 9 ? "털깎기" : "냥빨하기"} · 기력 −${cost}</button>`;
    }
  }
  return `<div class="event-banner">${s.weather === "rain" ? "☂ 비 오는 날 (10%)" : "☀ 맑은 날 (90%)"} · ${e ? `${E.events[e.id]} (발생 확률 ${E.eventChances[e.id]}%)` : "평온한 하루 (43%)"}${e ? `<small class="event-tip">${tips[e.id]}${e.resolved ? " · 처리 완료" : ""}${e.effect ? "<br>" + e.effect : ""}</small>` : ""}${controls ? `<div class="choice-row">${controls}</div>` : ""}</div>`;
}
function refreshActivityLog() {
  const el = document.querySelector("#activityLog"),
    s = slots[selectedSlot];
  if (!el || !s) return;
  const html = s.logs
    .map((l) => `<p>[${E.dateLabel(l.day)}] ${escapeLog(l.text)}</p>`)
    .join("");
  if (el.innerHTML !== html) {
    el.innerHTML = html;
    el.scrollTop = el.scrollHeight;
  }
}
function renderCalendar() {
  const s = player(),
    c = E.calendar(s.day);
  showModal(
    `${c.year}년 ${c.season}`,
    `<div class="calendar-weekdays">${["일", "월", "화", "수", "목", "금", "토"].map((d, i) => `<span class="${i === 0 ? "sunday" : i === 6 ? "saturday" : ""}">${d}</span>`).join("")}</div><div class="calendar-grid">${Array.from({ length: 28 }, (_, i) => `<div class="${i + 1 === c.date ? "today" : ""} ${i % 7 === 0 ? "sunday" : i % 7 === 6 ? "saturday" : ""}">${i + 1}${c.season === "WINTER" && i === 26 ? "<small>🎂 춘배 생일</small>" : ""}</div>`).join("")}</div><p>봄·여름·가을·겨울 각 28일 · 춘배 생일 WINTER 27</p>`,
  );
}
function tradeCapacity(s, type, i, side) {
  if (E.listing(s, type, i) || E.price(s, type, i) <= 1) return 0;
  return side === "buy"
    ? Math.max(
        0,
        type === "stock"
          ? Math.floor((s.gold / (E.price(s, type, i) * 1.02)) * 100 + 1e-8) /
              100
          : Math.floor(s.gold / E.price(s, type, i)),
      )
    : (type === "stock" ? s.stocks : s.coinHoldings)[i] || 0;
}
function listingInfo(s, t, i) {
  const state = E.listing(s, t, i);
  return state
    ? `<small class="listing-status">${state.delisted ? "상장폐지" : "거래 정지"} · ${E.dateLabel(state.delistDay)} 보유분 소멸<br>${E.dateLabel(state.relistDay)} 기본가격 재상장 (${state.relistDay - s.day}일 후)</small>`
    : "";
}
function marketChange(s, t, i) {
  if (E.listing(s, t, i)) return "거래 정지";
  const old = s.previousMarket?.[t]?.[i] ?? E.price(s, t, i);
  return `전일 ${old ? ((E.price(s, t, i) / old - 1) * 100).toFixed(1) : "0.0"}%`;
}
function portfolio(s) {
  let rows = "";
  for (const t of ["stock", "coin"]) {
    const book = t === "stock" ? s.stocks : s.coinHoldings,
      list = t === "stock" ? E.companies : E.coins;
    for (const [i, q] of Object.entries(book))
      if (q) {
        const value = E.price(s, t, +i) * q,
          cost = s.costBasis[t][i] || 0;
        rows += `<p><strong>${list[i].name}</strong>${listingInfo(s, t, +i)} ${t === "stock" ? q.toFixed(2) : q}${t === "stock" ? "주" : "개"} · ${money(value)} G · ${marketChange(s, t, +i)}<br>평가손익 ${money(value - cost)} G (${cost ? ((value / cost - 1) * 100).toFixed(1) : "0"}%)</p>`;
      }
  }
  return `<section class="portfolio"><h2>내 자산 포트폴리오</h2>${rows || "<p>보유 주식·코인 없음</p>"}<p>⌂ 현재 집: ${E.houses[s.house].name} · 보유 ${s.houses.length}채</p><p>${s.houses.map((i) => E.houses[i].name).join(" / ")}</p><p>실현손익 · 주식 ${money(s.realized.stock)} G / 코인 ${money(s.realized.coin)} G</p><small>평가손익은 매도 수수료 전 · 기존 저장의 매입원가는 업데이트 시점 가격으로 시작</small></section>`;
}
