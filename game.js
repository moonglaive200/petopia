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
  "주인 기력은 하루 최대 100! 당일에는 회복되지 않고 잠자면 다시 채워져.",
  "냥서바이벌은 하루 1번, 주인 기력 50과 행복도 20 이상이 필요해.",
  "냥서바이벌은 자동 공격! WASD로 이동하고 Space로 회피할 수 있어.",
  "던전에서는 1분에 중간 보스, 3분에 최종 보스가 등장해.",
  "던전에서 쓰러져도 생존 시간과 처치 수에 따른 보상은 받을 수 있어.",
  "무기 5단계와 짝인 능력 3단계를 모으면 무기가 진화해. 던전의 진화 조합을 확인해 봐!",
  "흡혈 송곳니는 실제 준 피해의 10%씩 체력을 회복해. 3단계면 30%!",
  "유흥은 하루 1번, 기력 25야. 방앗간 안에서는 추가 기력 없이 여러 판 즐길 수 있어.",
  "공원산책에서 썸냥이를 만날 확률은 3%! 고양이 축제 날에는 3.9%야.",
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
  "주식은 하루 ±30%, 코인은 −99%~+200%! 평균 매입가 대비 −99%면 보유분이 전부 사라져.",
  "병원 치료는 행복도를 30으로 회복해. 돈이 부족하면 긴급 대출이 가능하지만 기력은 안 차!",
  "한 계절은 28일, 1일은 일요일이야. 달력에 표시된 겨울 27일은 춘배 생일!",
];
let guideIndex = -1;
function guidePanel() {
  guideIndex = (guideIndex + 1) % GUIDE_TIPS.length;
  return `<div class="game-notice guide-panel"><p id="guideText" aria-live="polite">가이드: ${GUIDE_TIPS[guideIndex]}</p><button class="text-button" id="nextGuide" aria-label="다음 가이드 보기">다음 팁 <span id="guideCount">${guideIndex + 1}/${GUIDE_TIPS.length}</span> →</button></div>`;
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
  app.innerHTML = `<section class="game-shell"><div class="game-top"><button class="back" id="gameBack">← ${back === showSlots ? "슬롯 선택" : "돌아가기"}</button><span class="save-label"></span><span class="day-label">${E.calendar(s.day).season} ${E.calendar(s.day).date} (${E.calendar(s.day).weekday}) <button id="calendarButton" aria-label="달력 열기">📅</button></span><div class="wallet"><span>◈ ${money(s.gold)} G</span><span>◆ ${s.diamonds}</span><span>주인 기력 ${s.energy}/100</span></div></div>${back === showSlots ? dailyEventPanel(s) : ""}${content}<nav class="screen-tools" aria-label="보조 메뉴"><button data-utility="mart">▤ 펫마트</button><button data-utility="bank">♜ 펫은행</button><button data-utility="hospital">✚ 펫병원</button><button id="dayButton">☾ 잠자기</button><button data-utility="settings">⚙ 설정</button></nav></section>`;
  document.querySelector(".save-label").textContent =
    `SLOT ${selectedSlot + 1}${s.ownerName ? " · " + s.ownerName + " 집사" : ""}`;
  document.querySelector("#gameBack").onclick = () => {
    if (leaveGame()) back();
  };
  document.querySelector("#dayButton").onclick = sleep;
  const actions = {
    mart: renderMart,
    bank: renderBank,
    hospital: renderHospital,
    settings,
  };
  bind("utility", (id) => {
    if (!leaveGame()) return;
    actions[id]();
  });
  document.querySelector("#calendarButton").onclick = renderCalendar;
  save();
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
  const s = player(),
    wake = E.houses[s.house].wake;
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
    `<div class="home-title"><div>${title("CHUNBAE’S LITTLE WORLD", "춘배의 방")}</div><span class="date-chip">${E.houses[s.house].name}</span></div><div class="pet-stage house-${s.house} ${s.weather === "rain" ? "raining" : ""}">${s.house === 0 ? `<div class="street-lamp"></div><div class="street-bag">▣</div><div class="street-paper">오늘의 냥보</div>` : ""}<div class="rain-layer"></div><div class="window-pixel"><span></span></div><div class="wall-picture">${["☁", "▣", "☂", "☀", "≈", "♛", "☾"][s.house]}</div><div class="speech">${s.hospital ? "집사야… 병원 좀…" : married ? "우리 둘이 같이 살아요. 집사는 출근해요." : "집사 이름으로 된 통장, 내가 지킨다."}</div><div class="home-cats">${spriteMarkup("chunbae", s.hospital ? "sad" : s.happiness > 80 ? "happy" : "normal", "breathing")}${married ? spriteMarkup(s.romance.kind, "happy", "breathing partner-at-home") : ""}</div><div class="floor-rug"></div><span class="stage-label">${married ? "춘배와 " + E.partners[s.romance.kind].name : "춘배 · 오늘도 함께"}</span></div><div class="status-strip stats-six"><div><small>레벨</small><strong>LV.${s.level}</strong><progress value="${s.xp}" max="${E.xpNeeded(s.level)}"></progress><span>${s.xp}/${E.xpNeeded(s.level)} XP</span></div><div><small>공격 / 방어</small><strong>${st.attack} / ${st.defense}</strong><span>체력 ${st.hp}</span></div><div><small>행복도</small><strong>${s.happiness}/100</strong><progress value="${s.happiness}" max="100"></progress><span class="happiness-bonus-note">수입 보너스 · 0~69: 없음<br>70~99: +20% · 100: +50%</span></div><div><small>유명세</small><strong>${money(s.followers + s.liveFollowers)}</strong><span>펫스타 + Live 팔로워</span></div><div><small>보유재화</small><strong class="gold-label">🪙 골드 ${money(s.gold)} G</strong><span class="diamond-label">💎 다이아 ${s.diamonds}개</span></div><div><small>수입 보너스</small><strong>+${(E.bonus(s) * 100).toFixed(1)}%</strong><span>유명세 × 행복도 × 연애 × 집<br>주인 일당 +${((1 + E.bonus(s)) * (1 + E.vehicleBonus(s)) * 100 - 100).toFixed(1)}%<br>탈것 추가 곱연산</span></div></div><div class="daily-strip"><span>던전 남음 ${1 - s.daily.dungeon}/1</span><span>유흥 남음 ${1 - s.daily.walk}/1</span><span>펫스타 ${s.daily.star}/1</span><span>Live ${Math.max(0, 3 - s.day + s.liveDay) ? `${3 - s.day + s.liveDay}일 후` : "가능"}</span></div><div class="section-heading"><h2>오늘의 냥생</h2><span>당일 기력 회복 불가</span></div><nav class="activity-grid six-activities">${[
      ["dungeon", "⚔", "냥서바이벌", "하루 1회 · 기력 −50 · 행복도 20 이상"],
      ["walk", "♧", "유흥", "하루 1회 · 기력 −25"],
      ["work", "▣", "주인 노동시키기", "근무 중에도 자유 활동 · 기력 −50"],
      ["romance", "♡", "연애", "썸냥이 만나기 · 기력 소모 없음"],
      [
        "influencer",
        "✦",
        "인플루언서냥",
        "하루 첫 활동 기력 −25 · 이후 추가 소모 없음",
      ],
      ["inventory", "▤", "인벤토리", "장비 · 츄르 · 장난감 · 탈것"],
    ]
      .map(
        ([id, icon, name, desc]) =>
          `<button class="activity ${id === "dungeon" ? "adventure" : ""}" data-menu="${id}"><span class="activity-icon">${icon}</span><span><strong>${name}</strong><small>${desc}</small></span><span class="arrow">↗</span></button>`,
      )
      .join(
        "",
      )}</nav><div class="daily-log">${s.logs.map((l) => `<p>[${E.dateLabel(l.day)}] ${escapeLog(l.text)}</p>`).join("")}</div>${guidePanel()}`,
    showSlots,
  );
  const actions = {
    dungeon: renderDungeons,
    walk: renderWalk,
    work: renderWork,
    romance: renderRomance,
    influencer: renderInfluencer,
    inventory: renderInventory,
  };
  bind("menu", (id) => actions[id]());
  bind("event", (choice) => {
    if (E.resolveEvent(s, choice)) {
      save();
      renderHome();
    } else notice("금화 또는 주인 기력이 부족해.");
  });
  document.querySelector("#nextGuide").onclick = () => {
    guideIndex = (guideIndex + 1) % GUIDE_TIPS.length;
    document.querySelector("#guideText").textContent =
      "가이드: " + GUIDE_TIPS[guideIndex];
    document.querySelector("#guideCount").textContent =
      `${guideIndex + 1}/${GUIDE_TIPS.length}`;
  };
  const log = document.querySelector(".daily-log");
  log.scrollTop = log.scrollHeight;
}
function renderDungeons() {
  const s = player();
  gameShell(
    `${title("SURVIVE THE VERY ORDINARY", "냥서바이벌", "몰려오는 적을 피하고, 판마다 다른 무기 조합으로 살아남자.")}<div class="dungeon-intro"><div class="survival-poster">${spriteMarkup("chunbae", "surprise")}<span>냥생은 실전이다</span></div><div class="boss-timeline"><strong>01:00 중간 보스 등장</strong><strong>03:00 최종 보스 등장</strong><p>최종 보스를 처치하면 클리어!<br>도중에 쓰러져도 생존 시간·처치 수 보상을 받아.</p></div></div><label class="field-label">탐험할 장소<select id="survivalMap"><option value="0">1단계 · 햇살 공원</option><option value="1">2단계 · 버려진 펫마트</option><option value="2">3단계 · 네온 뒷골목</option>${Array.from({ length: 7 }, (_, i) => `<option disabled>${i + 4}단계 · 개발 중 🔒</option>`).join("")}</select></label><div class="dungeon-entry"><button class="btn primary" id="enterSurvival" ${s.daily.dungeon >= 1 || s.energy < 50 || s.happiness < 20 || !E.canAct(s) ? "disabled" : ""}>던전 입장 · 기력 −50 · 행복도 20 이상</button><span>하루 1회 · 자동 공격 / WASD 이동 / Space 회피</span></div><p class="tip-banner">오늘 ${s.daily.dungeon}/1회 · 주인 기력 ${s.energy}/100 · 행복도 ${s.happiness}/100 (입장 조건: 20 이상)<br>치즈폭탄을 주우면 주변 일반 몬스터 즉시 처치 · 보스에게 큰 피해!<br>무기 6종·보조 능력 6종, 레벨업 선택과 진화. 보스 10종이 장소·날짜에 따라 등장해.</p><details><summary>보스 도감 (${s.bossKills.length}/10)</summary><div class="boss-codex">${E.bosses.map((b) => `<span>${s.bossKills.includes(b.id) ? "✓" : "♠"} ${b.name}</span>`).join("")}</div><p>조커의남자를 처치하면 카지노가 해금돼.</p></details>${
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
  gameShell(
    `${title("ONE LITTLE OUTING", "유흥", "하루 한 번, 어디로 갈까?")}<p class="tip-banner">하루 1회 · 주인 기력 −25 · 활동 완료 시 썸냥이 만남 3%<br>방앗간·카지노 안에서는 추가 기력 없이 여러 판 가능.</p><div class="destination-grid">${[
      ["park", "♧", "공원산책", "행복도와 뜻밖의 선물", true],
      ["arcade", "✦", "방앗간 가기", "뽑기 · 리듬 · HEX", true],
      [
        "drive",
        "▰",
        "드라이브 가기",
        car ? "함께 드라이브 · 호감도 +0.1" : "자동차 구매 + 썸냥이 만남 필요",
        car,
      ],
      [
        "casino",
        "♠",
        "카지노 가기",
        s.bossCleared ? "냥슬롯 · 냥룰렛" : "조커의남자 처치 필요",
        s.bossCleared,
      ],
    ]
      .map(
        ([id, icon, name, text, unlocked]) =>
          `<button class="destination" data-dest="${id}" ${!unlocked || s.daily.walk >= 1 || s.energy < 25 || !E.canAct(s) ? "disabled" : ""}><span>${icon}</span><h2>${name}</h2><p>${text}</p><small>${unlocked ? "기력 −25" : "🔒 잠김"}</small></button>`,
      )
      .join("")}</div>`,
  );
  bind("dest", (id) => {
    if (["park", "drive"].includes(id)) {
      const result = id === "park" ? E.park(s) : E.drive(s);
      if (result) {
        save();
        renderWalk();
        meow();
        showModal(
          "산책 다녀왔어!",
          `<div class="result-cat">${spriteMarkup("chunbae", result.includes("비가") ? "sad" : "happy")}</div><p>${result}</p>`,
        );
      }
    } else if (E.consume(s, "walk", 1, 25)) {
      s.outingPending = true;
      save();
      id === "arcade" ? renderArcade() : renderCasino();
    }
  });
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
                `<div class="section-heading"><h2>${type === "weapon" ? "공격 장비" : "방어 장비"}</h2><span>강화 +${s[type + "Up"]}/10</span></div><div class="shop-grid">${(type === "weapon" ? E.weapons : E.armors).map((item, i) => shopCard(type, item, i, s)).join("")}</div><button class="upgrade-button" data-upgrade="${type}" ${s[type + "Up"] >= 10 || s.gold < E.upgradeCost(s, type) ? "disabled" : ""}>${type === "weapon" ? "공격 +2" : "방어 +1"} 확정 강화 <span>${s[type + "Up"] >= 10 ? "최대 강화" : `${E.upgradeCost(s, type)} G`}</span></button>`,
            )
            .join(
              "",
            )}${forge === "toy" ? `<div class="shop-grid">${E.toys.map((item, i) => shopCard("toy", item, i, s)).join("")}</div>` : ""}`
        : `<div class="shop-grid">${(tab === "treat" ? E.treats : E.vehicles).map((item, i) => shopCard(tab, item, i, s)).join("")}</div>`
    }<p class="note">장비 강화는 교체해도 유지돼. 츄르는 인벤토리에서 먹일 수 있어. 종류별 매일 0~2개 입고.</p>`,
  );
  bind("mart", (id) => renderMart(id));
  bind("forge", (id) => renderMart("forge", id));
  bind("buy", (value, b) => {
    const [type, i] = value.split(":");
    if (E.purchase(s, type, Number(i))) {
      save();
      meow();
      renderMart(tab, forge);
      notice("구매·선택 완료!");
    }
  });
  bind("upgrade", (type) => {
    const cost = E.upgradeCost(s, type);
    if (cost && E.spend(s, cost)) {
      s[type + "Up"]++;
      save();
      renderMart(tab, forge);
      notice("강화 성공! 확률 장난은 안 쳐.");
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
                `매일 +${item.income} G${type === "company" ? " + 해당 주식 1주" : ""}`;
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
      meow();
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
    `${title("WORK HARD, NAP HARDER", "주인 노동시키기", "일하러 보내도 다른 활동은 계속할 수 있어. 일당·경력은 다음 날 정산!")}<p class="tip-banner">하루 1회 · 주인 기력 −50<br>집 보너스 ${Math.round(h.work * 100)}% · 탈것 ${Math.round(E.vehicleBonus(s) * 100)}% (최고 1개만) · 각 수입 보너스 곱연산 · 직원 고용 할인 ${h.discount * 100}%</p><div class="shop-grid">${E.jobs
      .map((j, i) => {
        const own = E.promotion(s, i),
          staff = E.promotion(s, i, true),
          hired = s.employees.includes(i);
        if (!E.jobUnlocked(s, i))
          return `<article class="shop-card"><h3>🔒 ${j.name}</h3><p>${E.jobs[i - 1].name} 주인 10단계 달성 시 해금</p></article>`;
        return `<article class="shop-card"><span class="equipment-icon">${["⚒", "▣", "⚗"][i]}</span><h3>${j.name}</h3><p>주인 ${s.workLevels[i]}/10단계 · 근무 ${s.workDays[i]}일<br>일당 ${E.jobPay(s, i)} G</p><button class="btn primary" data-job="${i}" ${s.daily.work || s.energy < 50 || !E.canAct(s) ? "disabled" : ""}>직접 일하기 · 기력 −50</button><button class="btn" data-promote="owner:${i}" ${!own || s.workDays[i] < own.days || s.gold < own.cost ? "disabled" : ""}>${own ? `승진 ${money(own.cost)} G · 누적 ${own.days}일 필요` : "주인 최고 단계"}</button><p>직원 ${s.staffLevels[i]}/10단계 · 일당 ${E.jobPay(s, i, true)} G</p><button class="btn" data-hire="${i}" ${hired || s.gold < Math.floor(j.hire * (1 - h.discount)) ? "disabled" : ""}>${hired ? "직원 고용됨" : `직원 고용 ${money(Math.floor(j.hire * (1 - h.discount)))} G`}</button><button class="btn" data-promote="staff:${i}" ${!hired || !staff || s.staffLevels[i] >= s.workLevels[i] || s.gold < staff.cost ? "disabled" : ""}>${s.staffLevels[i] >= s.workLevels[i] && staff ? "주인 승진 필요" : staff ? `직원 교육 ${money(staff.cost)} G` : "직원 최고 단계"}</button></article>`;
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
    `${title("INFLUENCER CAT", "인플루언서냥", "하루 첫 활동 시 기력 −25 · 이후 추가 소모 없음")}<p class="tip-banner">들어오거나 구경할 때는 기력 소모 없음.<br>오늘 ${cost ? "아직 미사용 · 첫 활동 −25" : "기력 결제 완료 · 추가 소모 0"}<br>펫스타 하루 1회 / 펫 Live 3일에 1회</p><div class="destination-grid"><button class="destination" data-social="star"><span>✦</span><h2>펫스타</h2><p>팔로워 ${s.followers}명 · 오늘 ${s.daily.star}/1</p></button><button class="destination" data-social="live"><span>◉</span><h2>펫 Live</h2><p>팔로워 ${s.liveFollowers}명 · ${s.day - s.liveDay >= 3 ? "방송 가능" : `${3 - s.day + s.liveDay}일 후`}</p></button></div>`,
  );
  bind("social", (id) => (id === "star" ? renderStar() : renderLive()));
}
const starTopics = ["일상", "츄르 먹방", "장난감 자랑", "산책 인증"];
function renderStar() {
  const s = player(),
    trend = (s.day - 1) % 4,
    cost = E.influenceCost(s);
  gameShell(
    `${title("PETSTAR", "펫스타", "오늘도 귀여움 정상 영업 중.")}<div class="social-profile"><span class="social-avatar">✦</span><div><strong>@chunbae_official</strong><p>팔로워 ${s.followers}명 · 하루 ${s.daily.star}/1</p></div></div><p class="tip-banner">오늘 유행 #${["식빵굽기", "츄르ASMR", "장난감자랑", "집사산책시킴"][trend]}<br>팔로워 20%는 Live로 유입 · 게시 완료 시 썸냥이 만남 1%</p><div class="social-photo">${spriteMarkup("chunbae", "happy", "breathing")}<span>오늘 주인공은 춘배.</span></div><label class="field-label">사진 주제<select id="starTopic">${starTopics.map((t, i) => `<option value="${i}" ${(i === 1 && !s.treats.some((n) => n > 0)) || (i === 2 && !s.toys.length) ? "disabled" : ""}>${t}</option>`).join("")}</select></label><button class="btn primary wide" id="postStar" ${s.daily.star || s.energy < cost || !E.canAct(s) ? "disabled" : ""}>사진 올리기 · 기력 −${cost}</button><div class="section-heading"><h2>내 피드</h2></div>${s.feed
      .slice(0, 8)
      .map(
        (f) =>
          `<article class="feed-item"><span>DAY ${f.day} · ${starTopics[f.topic]}</span><strong>♥ ${f.likes} · 새 팔로워 ${f.gain}</strong><p>${f.comment}</p></article>`,
      )
      .join("")}`,
    renderInfluencer,
  );
  document.querySelector("#postStar").onclick = () => {
    const topic = Number(document.querySelector("#starTopic").value);
    if (!E.useInfluence(s, "star")) return;
    playEffect("shutter");
    const beforeFollowers = s.followers;
    const rawGain =
        25 +
        (topic === trend ? 25 : 0) +
        Math.floor(s.happiness / 10) +
        (s.highlights.length ? 5 : 0),
      cross = E.addFollowers(s, "star", rawGain),
      gain = s.followers - beforeFollowers;
    s.feed.unshift({
      day: s.day,
      topic,
      gain,
      likes: gain * 3,
      comment: [
        "집사는 사진만 찍어주세요.",
        "주인보다 수입이 높으신가요?",
        "오늘도 알고리즘이 옳았다.",
      ][s.day % 3],
    });
    s.feed = s.feed.slice(0, 30);
    const event = E.meet(s, "star");
    save();
    renderStar();
    notice(`팔로워 +${gain} · Live +${cross}${event ? " · " + event : ""}`);
  };
}
function renderLive() {
  const s = player(),
    remaining = Math.max(0, 3 - s.day + s.liveDay),
    cost = E.influenceCost(s);
  gameShell(
    `${title("PET LIVE", "펫 Live", "방송 중 선택하면 그 행동이 실제로 보여!")}<div class="social-profile"><span class="social-avatar">●</span><div><strong>춘배의 Live</strong><p>팔로워 ${s.liveFollowers}명 · ${remaining ? remaining + "일 후" : "오늘 가능"}</p></div></div><div class="live-stage">${spriteMarkup("chunbae", "normal", "breathing")}<span class="live-badge">● LIVE PREVIEW</span></div><label class="field-label">주제<select id="liveTopic"><option>낮잠 방송</option><option ${!s.treats.some((n) => n > 0) ? "disabled" : ""}>츄르 먹방</option><option ${!s.toys.length ? "disabled" : ""}>장난감 놀이</option>${s.liveFollowers >= 300 ? "<option>협찬 방송</option>" : ""}</select></label><button class="btn primary wide" id="startLive" ${remaining || s.energy < cost || !E.canAct(s) ? "disabled" : ""}>방송 시작 · 기력 −${cost}</button><p class="note">방송용 소품은 소비하지 않아. 츄르 먹이기·선물 횟수와 별개야.<br>완료 시 썸냥이 만남 1% · 300 팔로워에서 협찬 해금</p>${s.lastLive ? `<p class="game-notice">지난 방송: 후원 ${s.lastLive.gold} G · 팔로워 +${s.lastLive.gain}</p>` : ""}`,
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
  const s = player();
  let step = 0,
    score = 0;
  const events = [
    ["춘배가 카메라를 밀쳤다!", "발바닥 방송으로 전환", "카메라 다시 세우기"],
    ["시청자가 재롱을 요구한다.", "집사가 대신 춤추기", "춘배 하품 보여주기"],
    ["춘배가 잠들었다.", "수면 ASMR로 마무리", "이불 덮어주기"],
  ];
  function draw() {
    gameShell(
      `${title("● ON AIR", topic)}<div class="live-stage" id="onairStage">${spriteMarkup("chunbae", step === 2 ? "sleep" : step === 1 ? "happy" : "surprise", "live-cat breathing")}<div class="owner-actor" id="liveOwner" hidden><canvas id="liveOwnerArt" width="32" height="32"></canvas></div><span class="live-badge">● LIVE</span><div class="live-chat" id="liveChat">시청자: 집사도 출연하나요?</div></div><h2>${events[step][0]}</h2><div class="choice-row">${[0, 1].map((i) => `<button class="btn" data-choice="${i}">${events[step][i + 1]}</button>`).join("")}</div><p class="note">돌발 상황 ${step + 1}/3 · 중단 시 횟수는 사용되고 정산은 없어.</p>`,
      renderLive,
    );
    activeActivity = true;
    let timer;
    bind("choice", (choice) => {
      document
        .querySelectorAll("[data-choice]")
        .forEach((b) => (b.disabled = true));
      const stage = document.querySelector("#onairStage");
      stage.classList.add(
        step === 1 && choice === "0"
          ? "dance-scene"
          : step === 0 && choice === "0"
            ? "paw-scene"
            : step === 2
              ? "sleep-scene"
              : "bounce-scene",
      );
      if (step === 1 && choice === "0") {
        document.querySelector("#liveOwner").hidden = false;
        person(
          document.querySelector("#liveOwnerArt").getContext("2d"),
          4,
          1,
          false,
        );
        document.querySelector("#liveChat").textContent =
          "채팅: 집사 춤ㅋㅋㅋㅋ 춘배 표정 봐";
      } else
        document.querySelector("#liveChat").textContent =
          step === 2
            ? "채팅: 골골송 ASMR 최고다."
            : "채팅: 방금 장면 저장했습니다.";
      score += Number(choice) === step % 2 ? 12 : 7;
      timer = setTimeout(() => {
        step++;
        if (step < 3) {
          draw();
          return;
        }
        const beforeFollowers = s.liveFollowers,
          cross = E.addFollowers(s, "live", 20 + score),
          gain = s.liveFollowers - beforeFollowers,
          gold = E.reward(s, 35 + score + (topic === "협찬 방송" ? 90 : 0));
        s.lastLive = { viewers: 20 + s.liveFollowers, gold, gain };
        s.highlights.push(topic + " 명장면");
        s.highlights = s.highlights.slice(-5);
        const event = E.meet(s, "live");
        save();
        activeActivity = false;
        renderLive();
        showModal(
          "방송 정산",
          `<p>후원 +${gold} G · Live +${gain}명 · 펫스타 +${cross}명</p>${event ? `<p>${event}</p>` : ""}`,
        );
      }, 1600);
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
      `${title("CHUNBAE FINANCIAL GROUP", "펫은행", "은행장 춘배. 신용 심사는 눈빛으로.")}<div class="bank-card"><span>금화 잔액 / 대출 잔액</span><strong>${money(s.gold)} <small>G / ${money(E.debt(s))} G</small></strong><p>LV.${s.level} 대출 한도 ${money(E.loanLimit(s))} G · 만기 5일 · 이자 10%</p></div>${portfolio(s)}<div class="destination-grid three"><button class="destination" data-bank="loan"><span>◈</span><h2>돈 빌리기</h2><p>레벨별 한도 · 상환 일정</p></button><button class="destination" data-bank="spend"><span>▥</span><h2>돈 쓰기</h2><p>주식 · 코인 · 빌딩 · 회사</p></button><button class="destination" data-bank="house"><span>⌂</span><h2>집 사기</h2><p>집사의 출근 효율까지 달라져</p></button></div>`,
    );
    bind("bank", renderBank);
    return;
  }
  if (tab === "loan") {
    gameShell(
      `${title("LOANS & DEADLINES", "돈 빌리기", "만기에는 이자 포함 자동 상환. 돈이 부족해도 파산하지 않고 잔액이 마이너스가 돼.")}<div class="tip-banner">추가 대출 가능 ${Math.max(0, E.loanLimit(s) - E.debt(s))} G · 병원 긴급 대출은 한도 예외</div><label class="field-label">대출 금액<input id="loanAmount" type="number" min="10" step="10" value="100"></label><button class="btn primary wide" id="borrow">빌리기 · DAY ${s.day + 5} 만기</button><div class="section-heading"><h2>대출 내역</h2></div>${s.loans.length ? s.loans.map((l, i) => `<div class="loan-row"><span>${l.source}<small>DAY ${l.due} 만기 · 자동 상환 ${Math.ceil(l.amount * 1.1 - 1e-8)} G</small></span><strong>${l.amount} G</strong><button class="btn" data-repay="${i}" ${s.gold < l.amount ? "disabled" : ""}>조기 상환</button></div>`).join("") : '<p class="empty-state">아직 춘배에게 빚진 돈은 없어.</p>'}`,
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
      `${title("REAL ESTATE FOR REAL CATS", "집 사기", "한 번 구매한 집은 언제든 다시 선택할 수 있어. 현재 집의 효과만 적용돼.")}<div class="shop-grid house-grid">${E.houses.map((h, i) => shopCard("house", h, i, s)).join("")}</div>`,
      () => renderBank(),
    );
    bind("buy", (value) => {
      const [t, i] = value.split(":");
      if (E.purchase(s, t, Number(i))) {
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
          "하루 −30%~+30% · 0G 또는 평균 매입가 대비 −99%면 전량 소멸",
        ],
        [
          "coin",
          "펫코인 투자",
          "하루 −99%~+200% · 0G 또는 평균 매입가 대비 −99%면 전량 소멸",
        ],
        ["building", "펫빌딩 구매", "매일 임대 수입"],
        ["company", "펫회사 사기", "일일 수익 + 매일 해당 회사 주식 1주"],
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
      `${title("PASSIVE INCOME", type === "building" ? "펫빌딩 구매" : "펫회사 사기", type === "company" ? "일일 수익 + 매일 해당 회사 주식 1주 지급 · 현실 기업의 상대적 규모를 참고한 게임 가격" : "구매 가격 10배 · 기존 일일 임대 수입은 유지")}<div class="shop-grid">${items.map((item, i) => shopCard(type, item, i, s)).join("")}</div>`,
      () => renderBank("spend"),
    );
    bind("buy", (v) => {
      const [t, i] = v.split(":");
      if (E.purchase(s, t, Number(i))) {
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
    `${title("MARKET · DAY " + s.day, type === "stock" ? "펫주식 투자" : "펫코인 투자", type === "stock" ? "전일 대비 −30%~+30% · 0G 또는 평균 매입가 대비 −99% 시 전량 자동청산 · 매도 수수료 4%" : "전일 대비 −99%~+200% · 0G 또는 평균 매입가 대비 −99% 시 전량 자동청산 · 매도 수수료 4%")}<label class="field-label">거래 수량<input id="tradeQty" type="number" min="1" max="1000" value="1"></label><div class="market-list">${items.map((item, i) => `<article class="market-row"><span><strong>${item.name}</strong><small>보유 ${book[i] || 0}${type === "stock" ? "주" : "개"}</small></span><b>${E.price(s, type, i)} G<small>${marketChange(s, type, i)}</small></b><button class="btn" data-trade="${i}:buy">매수</button><button class="btn" data-trade="${i}:sell" ${!book[i] ? "disabled" : ""}>매도</button></article>`).join("")}</div>`,
    () => renderBank("spend"),
  );
  bind("trade", (v) => {
    const [i, side] = v.split(":"),
      qty = Number(document.querySelector("#tradeQty").value);
    if (E.trade(s, type, Number(i), side, qty)) {
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
  const encounterHelp = `<div class="tip-banner"><strong>썸냥이 만나는 방법</strong><p>던전 클리어 1% · 산책 완료 3%<br>주인 일하기 완료 1% · 펫 Live 완료 1% · 펫스타 게시 완료 1%</p><p>활동 완료 때 각각 판정해. 이미 썸을 타도 다른 냥이를 만날 수 있어.</p></div>`;
  if (!r) {
    gameShell(
      `${title("LOVE, PAWS & CHURU", "연애")}<div class="empty-romance"><span>♡</span><h2>아직 만난 썸냥이가 없어!</h2><p>치즈냥이 · 턱시도냥이 · 흰색냥이가 기다려.</p></div>${encounterHelp}`,
    );
    return;
  }
  const b = E.relationshipBonus ? E.relationshipBonus(s) : null;
  gameShell(
    `${title("ONE LITTLE LOVE STORY", "연애", E.partners[r.kind].name + "와 함께하는 이야기")}<div class="romance-stage">${spriteMarkup(r.kind, emotion, "breathing")}<span class="relationship-badge">${labels[r.stage]}</span><div class="romance-hearts">${"♥".repeat(Math.floor(r.affection))}${"♡".repeat(10 - Math.floor(r.affection))}</div></div><div class="tip-banner"><strong>호감도 ${r.affection.toFixed(2)} / ${r.stage === 0 ? 3 : r.stage === 1 ? 6 : 10}</strong><p>${r.stage === 0 ? "고백 성공 전에는 3을 넘지 않아." : r.stage === 1 ? "프로포즈 성공 전에는 6을 넘지 않아." : r.stage === 2 ? "10을 채우면 평생의 냥이 돼." : "평생 함께! 헤어지기·이혼·갈아타기 불가."}</p><p>${["썸을 알아가는 중", "활동 수입 +8% · 공격 +1 · 방어 +1", "활동 수입 +15% · 공격 +3 · 방어 +2 · 매일 20 G", "활동 수입 +30% · 공격 +6 · 방어 +4 · 매일 50 G와 참치 츄르"][r.stage]}</p></div><div class="romance-actions"><button class="btn" id="talkPartner" ${s.daily.talk || !E.canAct(s) ? "disabled" : ""}>대화하기 · 무료 · 하루 1회</button><button class="btn primary" id="confess" ${r.stage !== 0 || r.affection < 3 || s.diamonds < 1 || !E.canAct(s) ? "disabled" : ""}>고백 · ◆1 · 성공 50%</button><button class="btn primary" id="propose" ${r.stage !== 1 || r.affection < 6 || s.diamonds < 5 || !E.canAct(s) ? "disabled" : ""}>프로포즈 · ◆5 · 성공 50%</button>${r.stage < 3 ? `<button class="btn danger" id="breakUp">${r.stage === 2 ? "이혼하기" : "헤어지기"}</button>` : ""}</div><p class="note">실패해도 호감도는 떨어지지 않아. 고백·프로포즈 자체로 호감도가 오르지는 않아.</p><div class="section-heading"><h2>선물하기 · 오늘 ${s.daily.gift}/1</h2></div><div class="shop-grid">${E.treats.map((t, i) => `<article class="shop-card"><h3>${t.name}</h3><p>보유 ${s.treats[i]}개 · 호감도 +${t.affection}${r.kind === i ? " · 취향 보너스" : ""}</p><button class="btn" data-give-treat="${i}" ${s.daily.gift || !s.treats[i] || !E.canAct(s) ? "disabled" : ""}>츄르 선물</button></article>`).join("")}${s.toys.map((i) => `<article class="shop-card"><h3>${E.toys[i].name}</h3><p>보유 ${s.toyBag[i] || 0}개 · 호감도 +${E.toys[i].affection.toFixed(2)}</p><button class="btn" data-give-toy="${i}" ${s.daily.gift || !s.toyBag[i] || !E.canAct(s) ? "disabled" : ""}>장난감 선물</button></article>`).join("")}</div><div class="section-heading"><h2>데이트 · 하루 1회</h2></div><div class="shop-grid">${E.dates.map((d, i) => `<article class="shop-card"><h3>${d.name}</h3><p>${money(d.cost)} G · 호감도 +${d.gain}</p><button class="btn" data-date="${i}" ${s.daily.date || s.gold < d.cost || !E.canAct(s) ? "disabled" : ""}>데이트 가기</button></article>`).join("")}</div>${s.candidate !== null && r.stage < 3 ? `<div class="new-crush">${spriteMarkup(s.candidate, "surprise")}<h2>${E.partners[s.candidate].name}가 다가왔어!</h2><p>갈아타면 기존 관계는 끝나고 호감도 0부터 시작해.</p><button class="btn" id="switchPartner">갈아타기</button></div>` : ""}<details><summary>만남 확률 보기</summary>${encounterHelp}</details>`,
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
  let step = 0;
  const lines = [
    ["늦은 오후, 집으로 가는 길…", "풀숲에서 아주 작은 울음소리가 들려왔다."],
    ["집사", "어? 너… 왜 여기 혼자 있니?"],
    ["춘배", "…냐옹."],
    ["집사", "많이 추웠지? 괜찮아. 이제 혼자 안 둬."],
    [
      "집사",
      "이름은 춘배 어때? 우리 같이 가자. 집은 아직 없지만… 방법은 있겠지!",
    ],
    ["춘배", "냐옹!"],
  ];
  function draw() {
    app.innerHTML = `<section class="intro-panel"><div class="intro-forest"><div class="intro-tree"></div><div class="intro-bush bush-left"></div><div class="intro-bush bush-right"></div>${spriteMarkup("chunbae", step < 4 ? "sad" : "happy", step < 4 ? "shivering" : "breathing")}<span class="intro-sun">✦</span></div><div class="intro-dialogue"><small id="introSpeaker"></small><p id="introLine"></p><div class="intro-actions"><button class="text-button" id="skipIntro">건너뛰기</button><button class="btn primary" id="nextIntro">${step === lines.length - 1 ? "춘배와 시작하기" : "다음 →"}</button></div></div></section>`;
    document.getElementById("introSpeaker").textContent =
      lines[step][0] === "집사" ? s.ownerName || "집사" : lines[step][0];
    document.getElementById("introLine").textContent = lines[step][1];
    document.getElementById("skipIntro").onclick = finish;
    document.getElementById("nextIntro").onclick = () => {
      step++;
      if (step >= lines.length) finish();
      else {
        draw();
        if (step === 2 || step === 5) meow(0.9);
      }
    };
  }
  function finish() {
    s.introSeen = true;
    save();
    renderHome();
  }
  draw();
}

function escapeLog(t) {
  const d = document.createElement("div");
  d.textContent = t;
  return d.innerHTML;
}
function dailyEventPanel(s) {
  const e = s.event;
  const tips = [
    "열어보면 츄르가 있을지도?",
    "오늘 획득 팬 +30%",
    "오늘 직접 일하기 일당 +30%",
    "오늘 펫마트 전 상품 30% 할인",
    "오늘 대화·데이트 호감도 +30%",
    "오늘 공원 보상 +30% · 썸냥이 확률 3.9%",
    "광고 출연 또는 금화로 해결",
    "금화로 해결하거나 싸우기 · 주인 기력 −50",
  ];
  return `<div class="event-banner">${s.weather === "rain" ? "☂ 비 오는 날" : "☀ 맑은 날"} · ${e ? E.events[e.id] : "평온한 하루"}${e ? `<small class="event-tip">${tips[e.id]}</small>` : ""}${e && !e.resolved && [0, 6, 7].includes(e.id) ? `<div class="choice-row">${e.id === 0 ? `<button class="btn" data-event="open">택배 열기</button>` : `<button class="btn" data-event="pay" ${s.gold < (e.id === 7 ? 80 : 30) + s.level * (e.id === 7 ? 35 : 12) ? "disabled" : ""}>금화 ${(e.id === 7 ? 80 : 30) + s.level * (e.id === 7 ? 35 : 12)} G로 해결</button><button class="btn" data-event="${e.id === 7 ? "fight" : "ad"}" ${e.id === 7 && s.energy < 50 ? "disabled" : ""}>${e.id === 7 ? "싸우기 · 기력 −50" : "광고 출연으로 해결"}</button>`}</div>` : e?.resolved ? " · 해결 완료" : ""}</div>`;
}
function renderCalendar() {
  const s = player(),
    c = E.calendar(s.day);
  showModal(
    `${c.year}년 ${c.season}`,
    `<div class="calendar-weekdays">${["일", "월", "화", "수", "목", "금", "토"].map((d, i) => `<span class="${i === 0 ? "sunday" : i === 6 ? "saturday" : ""}">${d}</span>`).join("")}</div><div class="calendar-grid">${Array.from({ length: 28 }, (_, i) => `<div class="${i + 1 === c.date ? "today" : ""} ${i % 7 === 0 ? "sunday" : i % 7 === 6 ? "saturday" : ""}">${i + 1}${c.season === "WINTER" && i === 26 ? "<small>🎂 춘배 생일</small>" : ""}</div>`).join("")}</div><p>봄·여름·가을·겨울 각 28일 · 춘배 생일 WINTER 27</p>`,
  );
}
function marketChange(s, t, i) {
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
        rows += `<p><strong>${list[i].name}</strong> ${q}${t === "stock" ? "주" : "개"} · ${money(value)} G · ${marketChange(s, t, +i)}<br>평가손익 ${money(value - cost)} G (${cost ? ((value / cost - 1) * 100).toFixed(1) : "0"}%)</p>`;
      }
  }
  return `<section class="portfolio"><h2>내 자산 포트폴리오</h2>${rows || "<p>보유 주식·코인 없음</p>"}<p>⌂ 현재 집: ${E.houses[s.house].name} · 보유 ${s.houses.length}채</p><p>${s.houses.map((i) => E.houses[i].name).join(" / ")}</p><p>실현손익 · 주식 ${money(s.realized.stock)} G / 코인 ${money(s.realized.coin)} G</p><small>평가손익은 매도 수수료 전 · 기존 저장의 매입원가는 업데이트 시점 가격으로 시작</small></section>`;
}
