const E = PetopiaEngine;
const money = (n) => Math.floor(n).toLocaleString("ko-KR");
let viewCleanup = null,
  activeActivity = false;
function player() {
  return E.normalize(slots[selectedSlot]);
}
function cleanupView() {
  if (viewCleanup) {
    viewCleanup();
    viewCleanup = null;
  }
  activeActivity = false;
}
function leaveGame() {
  if (
    activeActivity &&
    !confirm(
      "진행 중인 활동을 끝낼까? 사용한 입장 횟수와 참가비는 돌아오지 않아.",
    )
  )
    return false;
  cleanupView();
  return true;
}
function setCleanup(fn) {
  viewCleanup = fn;
}
function statusText(s) {
  return s.hospital
    ? "춘배가 쓰러졌어. 펫병원에서 치료해 줘."
    : s.working !== null
      ? `집사가 ${E.jobs[s.working].name}에서 일하는 중. 잠자기로 하루를 마치면 일당을 받아.`
      : s.gold < 0
        ? "마이너스 통장도 냥생의 일부. 번 금화로 차근차근 메우자."
        : "오늘은 또 무슨 일이 생길까?";
}
function gameShell(content, back = renderHome) {
  cleanupView();
  const s = player();
  document.body.dataset.screen = "game";
  app.innerHTML = `<section class="game-shell"><div class="game-top"><button class="back" id="gameBack">← ${back === showSlots ? "슬롯 선택" : "돌아가기"}</button><span class="save-label">SLOT 0${selectedSlot + 1}</span><button class="day-button" id="dayButton">☾ DAY ${s.day} · 잠자기</button><div class="wallet"><span>◈ ${money(s.gold)} G</span><span>◆ ${s.diamonds}</span><span>ϟ ${s.energy}</span></div></div>${content}</section>`;
  if (s.ownerName) document.querySelector(".save-label").textContent = `SLOT 0${selectedSlot + 1} · 집사 ${s.ownerName}`;
  document.querySelector("#gameBack").onclick = () => {
    if (leaveGame()) back();
  };
  document.querySelector("#dayButton").onclick = sleep;
  save();
}
function bind(action, fn) {
  document
    .querySelectorAll(`[data-${action}]`)
    .forEach((b) => (b.onclick = () => fn(b.dataset[action], b)));
}
function title(kicker, name, desc = "") {
  return `<div class="eyebrow">${kicker}</div><h1>${name}</h1>${desc ? `<p class="desc">${desc}</p>` : ""}`;
}
function catCanvas(id = "homeArt", size = 96) {
  return `<canvas id="${id}" class="cat-art" width="96" height="96" style="--art-size:${size}px" aria-label="춘배"></canvas>`;
}
function paintCat(id = "homeArt", scale = 1.7) {
  const c = document.getElementById(id);
  if (c) drawCat(c.getContext("2d"), 48, 53, scale);
}
function sleep() {
  if (activeActivity) {
    notice("지금 활동을 끝내고 잠들어 줘.");
    return;
  }
  if (
    !confirm(
      `DAY ${player().day}을 마치고 잠들까? 행복도는 8 내려가고, 대출과 일당이 정산돼.`,
    )
  )
    return;
  const result = E.nextDay(player());
  if (!result) return;
  save();
  renderHome();
  meow(0.85);
  showModal(
    `좋은 아침! DAY ${player().day}`,
    result.map((t) => `<p>${t}</p>`).join(""),
  );
}
function renderHome() {
  const s = player(),
    st = E.stats(s),
    home = E.houses[s.house];
  gameShell(
    `<div class="home-title"><div>${title("CHUNBAE’S LITTLE WORLD", "춘배의 방")}</div><span class="date-chip">${home.name}</span></div><div class="pet-stage house-${s.house}"><div class="window-pixel"><span></span></div><div class="wall-picture">${["✿", "▣", "☂", "☀", "≈", "♛", "☾"][s.house]}</div><div class="speech">${s.hospital ? "집사야… 병원 좀…" : s.gold < 0 ? "통장은 마이너스여도 귀여움은 플러스야." : s.house === 6 ? "지구 집사들아, 잘 지내냐옹." : "내가 귀여운 건 맞는데, 월급은 네가 벌어."}</div>${catCanvas("homeArt", 145)}<div class="floor-rug"></div><span class="stage-label">${s.hospital ? "회복 필요" : "춘배 · 오늘도 정상 영업"}</span></div><div class="status-strip stats-five"><div><small>레벨</small><strong>LV.${s.level}</strong><progress value="${s.xp}" max="${E.xpNeeded(s.level)}" aria-label="경험치"></progress><span>${s.xp}/${E.xpNeeded(s.level)} XP</span></div><div><small>공격 / 방어</small><strong>${st.attack} / ${st.defense}</strong><span>최대 체력 ${st.hp}</span></div><div><small>행복도</small><strong>${s.happiness} <i>/100</i></strong><progress value="${s.happiness}" max="100" aria-label="행복도"></progress><span>${s.hospital ? "병원 치료 필요" : "0이 되면 병원으로"}</span></div><div><small>유명세</small><strong>${money(s.followers + s.liveFollowers)}</strong><span>활동 금화 +${Math.round(E.bonus(s) * 100)}%</span></div><div><small>보유재화</small><strong>◈ ${money(s.gold)}</strong><span>◆ 다이아 ${s.diamonds}</span></div></div><div class="daily-strip"><span>📸 펫스타 ${s.daily.star}/1</span><span>🔴 Live ${Math.max(0, 3 - (s.day - s.liveDay)) ? `${3 - (s.day - s.liveDay)}일 후` : "가능"}</span><span>♧ 산책 ${s.daily.walk}/2</span><span>⚔ 던전 ${s.daily.dungeon}/5</span></div><div class="section-heading"><h2>오늘은 뭐 할까?</h2><button class="text-button" id="openSettings">설정·저장 백업</button></div><nav class="activity-grid">${[
      ["dungeon", "⚔", "던전", "WASD 액션 · 일반 던전 / 보스", "adventure"],
      ["walk", "♧", "산책", "공원 · 방앗간 · 드라이브 · 카지노", "walk"],
      ["mart", "▤", "펫마트", "대장간 · 츄르 · 펫오토", ""],
      ["toys", "♙", "장난감", "모으고, 놀고, 행복해지고", ""],
      ["work", "▣", "주인 일하고 오기", "일터 선택 · 직원 자동 수입", ""],
      ["live", "◉", "펫 Live", "방송하고 후원받기 · 3일에 1회", ""],
      ["star", "✦", "펫스타", "오늘의 사진 · 하루 1회", ""],
      ["bank", "♜", "펫은행", "대출 · 투자 · 집 사기", ""],
      ["hospital", "✚", "펫병원", "치료·부활 · 긴급 대출", ""],
    ]
      .map(
        ([id, icon, name, desc, cls]) =>
          `<button class="activity ${cls}" data-menu="${id}" ${s.working !== null && !["work", "hospital", "bank"].includes(id) ? "disabled" : ""}><span class="activity-icon">${icon}</span><span><strong>${name}</strong><small>${desc}</small></span><span class="arrow">↗</span></button>`,
      )
      .join("")}</nav><p class="game-notice">✦ ${statusText(s)}</p>`,
    showSlots,
  );
  paintCat();
  document.querySelector("#openSettings").onclick = settings;
  const actions = {
    dungeon: renderDungeons,
    walk: renderWalk,
    mart: renderMart,
    toys: renderToys,
    work: renderWork,
    live: renderLive,
    star: renderStar,
    bank: renderBank,
    hospital: renderHospital,
  };
  bind("menu", (id) => {
    if (s.hospital && id !== "hospital" && id !== "bank") {
      notice("춘배가 회복해야 해. 펫병원부터 가자.");
      return;
    }
    meow();
    actions[id]();
  });
  let t = 0,
    raf;
  const animate = () => {
    if (!document.getElementById("homeArt")) return;
    const c = document.getElementById("homeArt").getContext("2d");
    c.clearRect(0, 0, 96, 96);
    drawCat(
      c,
      48,
      53 + (motion ? Math.sin(t / 30) * 1.5 : 0),
      1.7,
      false,
      motion && t % 260 > 245,
    );
    t++;
    raf = requestAnimationFrame(animate);
  };
  raf = requestAnimationFrame(animate);
  setCleanup(() => cancelAnimationFrame(raf));
}
function renderDungeons(tab = "normal") {
  const s = player();
  gameShell(
    `${title("PAWS & CLAWS", "던전", "일반 던전에서 성장하고, 보스를 잡아 새로운 장소를 열자.")}<div class="tabs"><button data-dtab="normal" class="${tab === "normal" ? "selected" : ""}">일반 던전</button><button data-dtab="boss" class="${tab === "boss" ? "selected" : ""}">보스</button></div><div class="tip-banner">오늘 입장 ${s.daily.dungeon}/5 · 입장 기력 10 · WASD 이동 / 마우스·J 공격 / Space 회피<br>쓰러지면 병원에서 부활. 전투 중 새로고침도 전투 포기로 처리돼.</div>${tab === "normal" ? `<div class="dungeon-list">${E.dungeons.map((d, i) => `<button class="dungeon-row" data-dungeon="${i}" ${i > s.cleared || s.daily.dungeon >= 5 || s.energy < 10 || !E.canAct(s) ? "disabled" : ""}><span class="dungeon-number">${String(i + 1).padStart(2, "0")}</span><span class="dungeon-name"><strong>${d.name}</strong><small>권장 LV.${d.recommended} · ${i < s.cleared ? "✓ 정복" : i > s.cleared ? "앞 단계 정복 필요" : "첫 클리어 보상 2배"}</small></span><span class="dungeon-reward">${d.gold} G · ${d.xp} XP</span></button>`).join("")}</div>` : `<article class="boss-card"><span class="boss-symbol">♠</span><h2>조커의남자</h2><p>카드 탄막 · 고양이 공 돌진 · 룰렛 장판<br>체력 650 · 권장 LV.6 이상 · 체력 절반부터 강화 패턴</p><strong>${s.bossCleared ? "✓ 카지노 해금 완료" : "첫 처치 시 카지노 해금"}</strong><button class="btn primary" id="enterBoss" ${s.daily.dungeon >= 5 || s.energy < 10 || !E.canAct(s) ? "disabled" : ""}>보스 도전</button></article>`}`,
  );
  bind("dtab", renderDungeons);
  bind("dungeon", (i) => startActionDungeon(Number(i), false));
  if (tab === "boss")
    document.querySelector("#enterBoss").onclick = () =>
      startActionDungeon(0, true);
}
function renderWalk() {
  const s = player(),
    car = s.vehicles.some((i) => E.vehicles[i].type === "car");
  gameShell(
    `${title("OUTSIDE IS A LITTLE WEIRD", "산책", "오늘은 어디로 갈까? 장소에 들어가서 활동할 때 하루 횟수를 사용해.")}<div class="tip-banner">산책 ${s.daily.walk}/2 · 공원·드라이브 1회, 방앗간·카지노는 입장할 때 1회 사용.<br>방앗간·카지노 안에서는 여러 판 가능. 다이아는 산책과 미니게임에서만 얻어.</div><div class="destination-grid">${[
      ["park", "♧", "공원 걷기", "뜻밖의 만남과 선물", true],
      ["arcade", "✦", "방앗간 가기", "네온 오락실 · 뽑기·리듬·오락", true],
      [
        "drive",
        "▰",
        "드라이브 가기",
        car ? "차 타고 바람 쐬기" : "펫오토에서 자동차 구매 필요",
        car,
      ],
      [
        "casino",
        "♠",
        "카지노 가기",
        s.bossCleared ? "냥슬롯 · 냥룰렛" : "보스 조커의남자 처치 필요",
        s.bossCleared,
      ],
    ]
      .map(
        ([id, icon, name, text, unlocked]) =>
          `<button class="destination" data-dest="${id}" ${!unlocked || s.daily.walk >= 2 || !E.canAct(s) ? "disabled" : ""}><span>${icon}</span><h2>${name}</h2><p>${text}</p>${!unlocked ? "<small>🔒 잠김</small>" : "<small>들어가기 →</small>"}</button>`,
      )
      .join("")}</div>`,
  );
  bind("dest", (id) => {
    if (id === "park") {
      const result = E.park(s);
      if (!result) return;
      save();
      renderWalk();
      meow(1.1);
      showModal(
        "공원에서 생긴 일",
        `<p>${result}</p><p>남은 산책 ${2 - s.daily.walk}회</p>`,
      );
    }
    if (id === "drive") {
      const result = E.drive(s);
      if (result) {
        save();
        renderWalk();
        showModal("붕붕, 집사 운전해!", `<p>${result}</p>`);
      }
    }
    if (["arcade", "casino"].includes(id)) {
      if (!E.consume(s, "walk", 2, 5)) return;
      save();
      id === "arcade" ? renderArcade() : renderCasino();
    }
  });
}
function renderMart(tab = "forge") {
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
      .join(
        "",
      )}</div>${tab === "forge" ? `${["weapon", "armor"].map((type) => `<div class="section-heading"><h2>${type === "weapon" ? "공격 장비" : "방어 장비"}</h2><span>강화 +${s[type + "Up"]}/3</span></div><div class="shop-grid">${(type === "weapon" ? E.weapons : E.armors).map((item, i) => shopCard(type, item, i, s)).join("")}</div><button class="upgrade-button" data-upgrade="${type}" ${s[type + "Up"] >= 3 || s.gold < E.upgradeCost(s, type) ? "disabled" : ""}>${type === "weapon" ? "공격 +2" : "방어 +1"} 확정 강화 <span>${s[type + "Up"] >= 3 ? "최대 강화" : `${E.upgradeCost(s, type)} G`}</span></button>`).join("")}<div class="section-heading"><h2>장난감 매대</h2></div><div class="shop-grid">${E.toys.map((item, i) => shopCard("toy", item, i, s)).join("")}</div>` : `<div class="shop-grid">${(tab === "treat" ? E.treats : E.vehicles).map((item, i) => shopCard(tab, item, i, s)).join("")}</div>`}<p class="note">장비 강화는 교체해도 유지돼. 츄르는 장난감 탭에서도 먹일 수 있어.</p>`,
  );
  bind("mart", renderMart);
  bind("buy", (value, b) => {
    const [type, i] = value.split(":");
    if (E.purchase(s, type, Number(i))) {
      save();
      meow();
      renderMart(tab);
      notice("구매·선택 완료!");
    }
  });
  bind("upgrade", (type) => {
    const cost = E.upgradeCost(s, type);
    if (cost && E.spend(s, cost)) {
      s[type + "Up"]++;
      save();
      renderMart(tab);
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
          ? `행복도 +${item.happy} · 보유 ${s.treats[i]}개`
          : type === "toy"
            ? `놀 때 행복도 +${item.happy}`
            : type === "house"
              ? `주인 수입 +${Math.round(item.work * 100)}% · 직원 +${Math.round(item.staff * 100)}%${item.discount ? ` · 고용 할인 ${item.discount * 100}%` : ""}`
              : item.text || `매일 +${item.income} G`;
  return `<article class="shop-card ${equipped ? "equipped" : ""}"><span class="equipment-icon">${{ weapon: "⚔", armor: "♜", treat: "▰", toy: "♙", vehicle: "✈", house: "⌂", building: "▥", company: "▤" }[type]}</span><h3>${item.name}</h3><p>${info}</p><button class="btn" data-buy="${type}:${i}" ${equipped || (owned && !["weapon", "armor", "house"].includes(type)) || (!owned && (s.gold < item.cost || s.diamonds < (item.diamond || 0))) ? "disabled" : ""}>${equipped ? "선택 중" : owned ? (["weapon", "armor", "house"].includes(type) ? "선택하기" : "보유 중") : `${money(item.cost)} G${item.diamond ? ` + ◆${item.diamond}` : ""}`}</button></article>`;
}
function renderToys() {
  const s = player();
  gameShell(
    `${title("SMALL THINGS, BIG JOY", "장난감과 츄르", "장난감은 하루 2번, 츄르는 원하는 만큼. 행복도 0이면 병원 치료가 먼저야.")}<div class="tip-banner">행복도 ${s.happiness}/100 · 장난감 놀이 ${s.daily.toy}/2</div><div class="section-heading"><h2>내 장난감</h2></div>${s.toys.length ? `<div class="shop-grid">${s.toys.map((i) => `<article class="shop-card"><span class="equipment-icon">♙</span><h3>${E.toys[i].name}</h3><p>행복도 +${E.toys[i].happy}</p><button class="btn" data-playtoy="${i}" ${s.daily.toy >= 2 || !E.canAct(s) ? "disabled" : ""}>같이 놀기</button></article>`).join("")}</div>` : '<p class="empty-state">아직 장난감이 없어. 펫마트나 산책에서 데려오자.</p>'}<div class="section-heading"><h2>츄르 보관함</h2></div><div class="shop-grid">${E.treats.map((t, i) => `<article class="shop-card"><h3>${t.name}</h3><p>${s.treats[i]}개 · 행복도 +${t.happy}</p><button class="btn" data-feed="${i}" ${s.treats[i] <= 0 || !E.canAct(s) ? "disabled" : ""}>먹이기</button></article>`).join("")}</div>`,
  );
  bind("playtoy", (i) => {
    if (!E.canAct(s) || s.daily.toy >= 2) return;
    s.daily.toy++;
    E.happy(s, E.toys[i].happy);
    save();
    meow(0.9);
    renderToys();
  });
  bind("feed", (i) => {
    if (!E.canAct(s) || s.treats[i] <= 0) return;
    s.treats[i]--;
    E.happy(s, E.treats[i].happy);
    save();
    meow(0.8);
    renderToys();
  });
}
function renderWork() {
  const s = player(),
    h = E.houses[s.house];
  gameShell(
    `${title("HUMAN RESOURCE DEPARTMENT", "주인 일하고 오기", "직접 일하면 하루가 끝날 때까지 다른 활동을 못 해. 직원은 대신 일하면서 매일 수입을 줘.")}<div class="tip-banner">${statusText(s)}<br>집 효과: 주인 일당 +${h.work * 100}% · 직원 +${h.staff * 100}% · 고용 비용 −${h.discount * 100}%</div><div class="shop-grid">${E.jobs
      .map((j, i) => {
        const hired = s.employees.includes(i),
          cost = Math.floor(j.hire * (1 - h.discount));
        return `<article class="shop-card"><span class="equipment-icon">${["⚒", "▤", "⚗"][i]}</span><h3>${j.name}</h3><p>주인 일당 ${Math.floor(j.pay * (1 + h.work))} G<br>기력 ${Math.max(1, j.cost - h.energy)} · 1일 근무</p><button class="btn primary" data-job="${i}" ${!E.canAct(s) || s.energy < Math.max(1, j.cost - h.energy) ? "disabled" : ""}>${s.working === i ? "근무 중" : "직접 일하기"}</button><p>직원 일당 ${Math.floor(j.pay * (1 + h.staff))} G</p><button class="btn" data-hire="${i}" ${hired || s.gold < cost ? "disabled" : ""}>${hired ? "직원 근무 중" : `직원 고용 ${cost} G`}</button></article>`;
      })
      .join(
        "",
      )}</div><p class="note">각 일터에 직원 1명 고용 가능. 일당은 잠자기로 다음 날이 될 때 지급돼.</p>`,
  );
  bind("job", (i) => {
    const cost = Math.max(1, E.jobs[i].cost - h.energy);
    if (!E.canAct(s) || s.energy < cost) return;
    s.energy -= cost;
    s.working = Number(i);
    save();
    renderWork();
    notice("출근 완료! 잠자기로 하루를 마치면 퇴근하고 일당을 받아.");
  });
  bind("hire", (i) => {
    const cost = Math.floor(E.jobs[i].hire * (1 - h.discount));
    if (s.employees.includes(Number(i)) || !E.spend(s, cost)) return;
    s.employees.push(Number(i));
    save();
    renderWork();
    notice("직원이 대신 돈을 벌기 시작했어.");
  });
}
const starTopics = ["일상", "츄르 먹방", "장난감 자랑", "산책 인증"];
function renderStar() {
  const s = player(),
    trend = (s.day - 1) % 4;
  gameShell(
    `${title("PETSTAR", "펫스타", "사진은 남고, 집사의 통장은 줄어든다.")}<div class="social-profile"><span class="social-avatar">✦</span><div><strong>@chunbae_official</strong><p>팔로워 <b>${money(s.followers)}</b> · Live에서 유입도 받아!</p></div><span class="badge">DAY ${s.day} · ${s.daily.star}/1</span></div><div class="tip-banner">오늘의 유행: #${["식빵굽기", "츄르ASMR", "내장난감쩔지", "집사산책시킴"][trend]}<br>직접 얻은 팔로워의 20%가 Live로 유입돼. 재유입은 발생하지 않아.</div><div class="social-photo">${catCanvas("starArt", 150)}<span>오늘도 귀여움 정상 영업 중.</span></div><label class="field-label">사진 주제<select id="starTopic">${starTopics.map((t, i) => `<option value="${i}" ${(i === 1 && !s.treats.some((n) => n > 0)) || (i === 2 && !s.toys.length) ? "disabled" : ""}>${t}${i === 1 ? " (츄르 보유 필요)" : i === 2 ? " (장난감 필요)" : ""}</option>`).join("")}</select></label><button class="btn primary wide" id="postStar" ${s.daily.star >= 1 || !E.canAct(s) || s.energy < 3 ? "disabled" : ""}>사진 올리기 · 기력 3</button><div class="section-heading"><h2>내 피드</h2></div>${
      s.feed.length
        ? s.feed
            .slice(0, 8)
            .map(
              (f) =>
                `<article class="feed-item"><span>DAY ${f.day} · ${starTopics[f.topic]}</span><strong>♥ ${f.likes} · 새 팔로워 +${f.gain}</strong><p>${f.comment}</p></article>`,
            )
            .join("")
        : '<p class="empty-state">첫 게시물을 기다리고 있어.</p>'
    }${s.highlights.length ? `<p class="note">최근 방송 명장면: ${s.highlights[s.highlights.length - 1]}</p>` : ""}`,
  );
  paintCat("starArt");
  document.querySelector("#postStar").onclick = () => {
    const topic = Number(document.querySelector("#starTopic").value);
    if (
      (topic === 1 && !s.treats.some((n) => n > 0)) ||
      (topic === 2 && !s.toys.length)
    )
      return;
    if (!E.consume(s, "star", 1, 3)) return;
    const gain =
      25 +
      (topic === trend ? 25 : 0) +
      Math.floor(s.happiness / 10) +
      (s.highlights.length ? 5 : 0);
    const cross = E.addFollowers(s, "star", gain);
    s.feed.unshift({
      day: s.day,
      topic,
      gain,
      likes: gain * 3,
      comment: [
        "고양이가 차주고 사람이 기사인가요?",
        "주인보다 표정 관리 잘하네요.",
        "알고리즘아 이런 것만 보여줘.",
      ][s.day % 3],
    });
    s.feed = s.feed.slice(0, 30);
    save();
    meow();
    renderStar();
    notice(`펫스타 +${gain}명 · 펫 Live +${cross}명!`);
  };
}
function renderLive() {
  const s = player(),
    remaining = Math.max(0, 3 - (s.day - s.liveDay));
  gameShell(
    `${title("PET LIVE", "펫 Live", "누워 있어도 콘텐츠. 집사는 부럽다.")}<div class="social-profile"><span class="social-avatar">●</span><div><strong>춘배의 라이브</strong><p>팔로워 ${money(s.liveFollowers)} · ${remaining ? `${remaining}일 후 방송 가능` : "오늘 방송 가능"}</p></div></div><div class="simple-stage">${catCanvas("liveArt", 150)}<span>${s.feed.length ? `인기 게시물 “${starTopics[s.feed[0].topic]}”을 본 시청자가 기다리고 있어.` : "오늘의 게스트: 춘배의 발바닥"}</span></div><label class="field-label">방송 주제<select id="liveTopic"><option>낮잠 방송</option><option ${!s.treats.some((n) => n > 0) ? "disabled" : ""}>츄르 먹방</option><option ${!s.toys.length ? "disabled" : ""}>장난감 놀이</option>${s.liveFollowers >= 300 ? "<option>협찬 방송</option>" : ""}</select></label><button class="btn primary wide" id="startLive" ${remaining || !E.canAct(s) || s.energy < 8 ? "disabled" : ""}>방송 켜기 · 기력 8</button>${s.lastLive ? `<p class="game-notice">지난 방송: 최고 시청자 ${s.lastLive.viewers}명 · 후원 ${s.lastLive.gold} G · 팔로워 +${s.lastLive.gain}</p>` : ""}<p class="note">300 팔로워에서 협찬 해금. 방송으로 얻은 팔로워 20%는 펫스타로 유입돼.</p>`,
  );
  paintCat("liveArt");
  document.querySelector("#startLive").onclick = () => {
    if (remaining || !E.canAct(s) || s.energy < 8) return;
    const topic = document.querySelector("#liveTopic").value;
    if (topic === "츄르 먹방") {
      const i = s.treats.findIndex((n) => n > 0);
      if (i < 0) return;
      s.treats[i]--;
    }
    s.energy -= 8;
    s.liveDay = s.day;
    s.lastLive = null;
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
    ["시청자가 재롱을 요구한다.", "집사가 대신 춤추기", "춘배의 하품 보여주기"],
    [
      "방송이 끝나려는데 춘배가 잠들었다.",
      "수면 ASMR로 마무리",
      "조용히 이불 덮어주기",
    ],
  ];
  function draw() {
    gameShell(
      `${title("● ON AIR", topic)}<div class="simple-stage">${catCanvas("onairArt", 150)}<span>시청자 ${20 + s.liveFollowers + score * 3} · 채팅: “집사 퇴장 좀”</span></div><h2>${events[step][0]}</h2><div class="choice-row"><button class="btn" data-choice="0">${events[step][1]}</button><button class="btn" data-choice="1">${events[step][2]}</button></div><p class="note">돌발 상황 ${step + 1}/3 · 나가거나 새로고침하면 방송 횟수는 사용되고 정산은 없어.</p>`,
      renderLive,
    );
    paintCat("onairArt");
    activeActivity = true;
    bind("choice", (choice) => {
      score += Number(choice) === step % 2 ? 12 : 7;
      step++;
      if (step === 3) {
        const gain = 20 + score,
          cross = E.addFollowers(s, "live", gain),
          gold = E.reward(s, 35 + score + (topic === "협찬 방송" ? 90 : 0));
        s.lastLive = { viewers: 20 + s.liveFollowers, gold, gain };
        s.highlights.push(`${topic}: 집사의 춤보다 하품이 인기였다`);
        s.highlights = s.highlights.slice(-5);
        save();
        activeActivity = false;
        renderLive();
        meow();
        showModal(
          "방송 종료!",
          `<p>후원 +${gold} G · 펫 Live +${gain}명<br>펫스타 유입 +${cross}명</p>`,
        );
      } else draw();
    });
  }
  draw();
}
function renderHospital() {
  const s = player(),
    cost = E.hospitalCost(s);
  gameShell(
    `${title("NINE LIVES CLINIC", "펫병원", "냥생은 여러 번. 치료비는 매번.")}<div class="hospital-stage">${catCanvas("hospitalArt", 150)}<span>✚</span></div><div class="activity-info"><h2>${s.hospital ? "춘배를 다시 일으켜 줘" : "춘배는 건강해!"}</h2><p>LV.${s.level} 치료·부활 비용 ${cost} G<br>치료 후 행복도 최소 55, 기력 최소 50 회복.<br>부족한 치료비는 한도와 무관하게 긴급 대출해 줘.</p><button class="btn primary" id="healPet" ${!s.hospital ? "disabled" : ""}>${s.gold < cost ? "부족한 돈 빌려서 치료" : "치료·부활하기"}</button></div>`,
  );
  paintCat("hospitalArt");
  document.querySelector("#healPet").onclick = () => {
    const result = E.heal(s);
    if (!result) return;
    save();
    renderHospital();
    meow(0.85);
    notice(
      `치료 완료! ${result.cost} G${result.borrow ? ` · 긴급 대출 ${result.borrow} G (5일 후 상환)` : ""}`,
    );
  };
}
function renderBank(tab = "main") {
  const s = player();
  if (tab === "main") {
    gameShell(
      `${title("CHUNBAE FINANCIAL GROUP", "펫은행", "은행장 춘배. 신용 심사는 눈빛으로.")}<div class="bank-card"><span>금화 잔액 / 대출 잔액</span><strong>${money(s.gold)} <small>G / ${money(E.debt(s))} G</small></strong><p>LV.${s.level} 대출 한도 ${money(E.loanLimit(s))} G · 만기 5일 · 이자 10%</p></div><div class="destination-grid three"><button class="destination" data-bank="loan"><span>◈</span><h2>돈 빌리기</h2><p>레벨별 한도 · 상환 일정</p></button><button class="destination" data-bank="spend"><span>▥</span><h2>돈 쓰기</h2><p>주식 · 코인 · 빌딩 · 회사</p></button><button class="destination" data-bank="house"><span>⌂</span><h2>집 사기</h2><p>집사의 출근 효율까지 달라져</p></button></div>`,
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
        ["stock", "펫주식 투자", "같은 10개 회사의 주식을 조금씩"],
        ["coin", "펫코인 투자", "가격 변동이 큰 코인 3종"],
        ["building", "펫빌딩 구매", "매일 임대 수입"],
        ["company", "펫회사 사기", "10개 회사 인수 · 매일 운영 수입"],
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
      `${title("PASSIVE INCOME", type === "building" ? "펫빌딩 구매" : "펫회사 사기", "산 자산의 수입은 다음 날부터 잠자기 정산 때 지급돼.")}<div class="shop-grid">${items.map((item, i) => shopCard(type, item, i, s)).join("")}</div>`,
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
    `${title("MARKET · DAY " + s.day, type === "stock" ? "펫주식 투자" : "펫코인 투자", "가격은 게임 날짜마다 변동. 매도 수수료 4%, 다이아는 투자에 사용하지 않아.")}<label class="field-label">거래 수량<input id="tradeQty" type="number" min="1" max="1000" value="1"></label><div class="market-list">${items.map((item, i) => `<article class="market-row"><span><strong>${item.name}</strong><small>보유 ${book[i] || 0}${type === "stock" ? "주" : "개"}</small></span><b>${E.price(s, type, i)} G</b><button class="btn" data-trade="${i}:buy">매수</button><button class="btn" data-trade="${i}:sell" ${!book[i] ? "disabled" : ""}>매도</button></article>`).join("")}</div>`,
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
