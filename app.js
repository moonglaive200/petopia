const app = document.querySelector("#app"),
  modal = document.querySelector("#modal");
let selectedSlot = 0,
  slots = [],
  sound = true,
  motion = true,
  customBackground = "";
try {
  slots = JSON.parse(localStorage.getItem("petopia.slots") || "[]");
  if (!Array.isArray(slots)) slots = [];
  sound = localStorage.getItem("petopia.sound") !== "false";
  motion = localStorage.getItem("petopia.motion") !== "false";
  customBackground = localStorage.getItem("petopia.background") || "";
} catch {}
function save() {
  try {
    localStorage.setItem("petopia.slots", JSON.stringify(slots));
    return true;
  } catch {
    notice(
      "저장 공간이 부족해. 설정에서 저장 파일을 내려받아 보관해 줘.",
      false,
    );
    return false;
  }
}
let lastMeow = 0;
const meowAudio = new Audio("assets/meow.mp3");
meowAudio.preload = "auto";
function meow(rate = 1) {
  if (!sound || Date.now() - lastMeow < 1800) return;
  lastMeow = Date.now();
  meowAudio.pause();
  meowAudio.currentTime = 0;
  meowAudio.volume = 0.35;
  meowAudio.playbackRate = rate;
  meowAudio.play().catch(() => {});
}
function clickSound() {
  if (!sound) return;
  try {
    const a = new (window.AudioContext || window.webkitAudioContext)(),
      o = a.createOscillator(),
      g = a.createGain();
    o.type = "triangle";
    o.frequency.value = 460;
    g.gain.setValueAtTime(0.018, a.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, a.currentTime + 0.07);
    o.connect(g);
    g.connect(a.destination);
    o.start();
    o.stop(a.currentTime + 0.07);
    o.onended = () => a.close();
  } catch {}
}
function syncSound() {
  window.dispatchEvent(new Event("petopia-sound"));
  document.querySelector("#sound").textContent = sound ? "♫ ON" : "♫ OFF";
  document
    .querySelector("#sound")
    .setAttribute("aria-label", sound ? "효과음 끄기" : "효과음 켜기");
  document
    .querySelectorAll("iframe")
    .forEach((f) =>
      f.contentWindow.postMessage(
        { type: "petopia-mute", muted: !sound },
        location.origin === "null" ? "*" : location.origin,
      ),
    );
}
function toggleSound() {
  sound = !sound;
  try {
    localStorage.setItem("petopia.sound", sound);
  } catch {}
  if (!sound) meowAudio.pause();
  else meow();
  syncSound();
}
document.querySelector("#sound").onclick = toggleSound;
syncSound();
document.addEventListener("click", (e) => {
  if (e.target.closest("button")) clickSound();
});
document.querySelector("#home").onclick = (e) => {
  e.preventDefault();
  if (typeof leaveGame === "function" && !leaveGame()) return;
  lobby();
};
function applyBackground() {
  document.body.classList.add("custom-bg");
  document.querySelector("#lobbyBackground").style.backgroundImage =
    `url("${customBackground || "assets/lobby.png"}")`;
}
applyBackground();
function lobby() {
  if (typeof cleanupView === "function") cleanupView();
  document.body.dataset.screen = "lobby";
  app.innerHTML = `<section class="hero"><div class="eyebrow">A VERY ORDINARY CAT LIFE</div><h1 class="logo">PETOPIA</h1><div class="wood-sub">춘배와 집사의 이상한 하루</div><nav class="menu" aria-label="메인 메뉴"><button class="btn primary" id="start">▷ 시작하기</button><button class="btn" id="settings">⚙ 설정</button><button class="btn" id="credits">♡ 크레딧</button></nav><p class="version">VER. 0.4.2 · 냥생은 실전이다</p></section>`;
  document.querySelector("#start").onclick = () => {
    meow();
    showSlots();
  };
  document.querySelector("#settings").onclick = settings;
  document.querySelector("#credits").onclick = () =>
    showModal(
      "만든 사람들",
      "기획 · 승식<br>개발 · Codex<br>폰트 · Neo둥근모 / SIL OFL 1.1<br>야옹사운드 · cat-ccnotify-hook / MIT<br>HEX FINALE · 승식<br><br>자세한 출처는 저장소의 ASSETS.md에 남겼어.",
    );
}
function showModal(title, body) {
  if (modal.open) modal.close();
  modal.innerHTML = `<h2>${title}</h2><div class="modal-body">${body}</div><button class="btn primary">확인</button>`;
  modal.querySelector(".btn").onclick = () => modal.close();
  modal.showModal();
}
function notice(message, track = true) {
  if (
    track &&
    document.body.dataset.screen === "game" &&
    typeof player === "function" &&
    selectedSlot !== null &&
    slots[selectedSlot]
  ) {
    E.log(player(), message);
    save();
  }
  const el = document.querySelector("#toast");
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(notice.timer);
  notice.timer = setTimeout(() => el.classList.remove("show"), 5000);
}
function settings() {
  if (modal.open) modal.close();
  modal.innerHTML = `<h2>설정</h2><div class="setting">야옹·효과음<button id="toggleSound">${sound ? "켜짐" : "꺼짐"}</button></div><div class="setting">배경 움직임<button id="toggleMotion">${motion ? "켜짐" : "꺼짐"}</button></div><div class="setting"><label for="backgroundFile">로비 배경 선택 (PNG/JPG)<br><small>다른 이미지로 바꾸고 싶을 때 선택해 줘.</small></label><input type="file" id="backgroundFile" accept="image/png,image/jpeg,image/webp"></div><button class="text-button" id="resetBackground">기본 마을 배경으로</button><div class="setting">저장 데이터 백업<button id="exportSave">내려받기</button></div><label class="setting">저장 데이터 가져오기<input type="file" id="importSave" accept="application/json"></label><p class="note">진행은 현재 브라우저에 저장돼. 파일 실행과 웹 주소의 저장은 별개야.</p><button class="btn primary" id="closeSettings">완료</button>`;
  modal.querySelector("#toggleSound").onclick = (e) => {
    toggleSound();
    e.target.textContent = sound ? "켜짐" : "꺼짐";
  };
  modal.querySelector("#toggleMotion").onclick = (e) => {
    motion = !motion;
    try {
      localStorage.setItem("petopia.motion", motion);
    } catch {}
    e.target.textContent = motion ? "켜짐" : "꺼짐";
    document.body.classList.toggle("still", !motion);
    drawScene();
  };
  modal.querySelector("#backgroundFile").onchange = async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    if (f.size > 8e6) {
      notice("배경은 8MB 이하 이미지로 골라줘.");
      return;
    }
    const image = new Image();
    image.src = URL.createObjectURL(f);
    try {
      await image.decode();
      const c = document.createElement("canvas");
      c.width = Math.min(1920, image.width);
      c.height = Math.round((image.height * c.width) / image.width);
      c.getContext("2d").drawImage(image, 0, 0, c.width, c.height);
      const data = c.toDataURL("image/jpeg", 0.88);
      localStorage.setItem("petopia.background", data);
      customBackground = data;
      applyBackground();
      notice("로비 배경 적용 완료!");
    } catch {
      notice("이미지를 저장할 수 없어. 더 작은 파일을 골라줘.");
    } finally {
      URL.revokeObjectURL(image.src);
    }
  };
  modal.querySelector("#resetBackground").onclick = () => {
    customBackground = "";
    localStorage.removeItem("petopia.background");
    applyBackground();
  };
  modal.querySelector("#exportSave").onclick = () => {
    const blob = new Blob(
        [JSON.stringify({ format: "petopia-v2", slots }, null, 2)],
        { type: "application/json" },
      ),
      a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "petopia-save.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  modal.querySelector("#importSave").onchange = async (e) => {
    try {
      const data = JSON.parse(await e.target.files[0].text());
      if (
        data.format !== "petopia-v2" ||
        !Array.isArray(data.slots) ||
        data.slots.length > 3 ||
        data.slots.some(
          (s) =>
            s &&
            (!Number.isInteger(s.level) ||
              s.level < 1 ||
              !Number.isFinite(s.gold) ||
              s.character !== "chunbae"),
        )
      )
        throw Error();
      if (!confirm("현재 저장 슬롯을 가져온 데이터로 바꿀까?")) return;
      slots = data.slots;
      slots.forEach((s) => {
        if (s) PetopiaEngine.normalize(s);
      });
      save();
      modal.close();
      lobby();
      notice("저장 데이터를 가져왔어.");
    } catch {
      notice("올바른 Petopia 저장 파일이 아니야.");
    }
  };
  modal.querySelector("#closeSettings").onclick = () => modal.close();
  modal.showModal();
}
function showSlots() {
  document.body.dataset.screen = "slots";
  app.innerHTML = `<section class="panel"><button class="back" id="back">← 로비로</button><div class="eyebrow">THREE LITTLE STORIES</div><h1>어떤 냥생을 이어갈까?</h1><p class="desc">세 개의 자리, 각자 다른 우리의 일상.</p><div class="cards">${[0, 1, 2].map((i) => `<div class="slot-card"><button class="slot" data-slot="${i}"><small>SLOT 0${i + 1}</small><span class="plus">${slots[i] ? "🐾" : "+"}</span><strong>${slots[i] ? "춘배의 일상" : "새로운 이야기"}</strong><p>${slots[i] ? `DAY ${slots[i].day || 1} · LV.${slots[i].level || 1}` : "비어 있는 슬롯"}</p>${slots[i]?.ownerName ? `<span class="slot-owner" data-owner-slot="${i}"></span>` : ""}</button>${slots[i] ? `<button class="slot-delete" data-delete-slot="${i}" aria-label="슬롯 ${i + 1} 저장 삭제">저장 삭제</button>` : ""}</div>`).join("")}</div><p class="note">✦ 자동 저장 · 설정에서 저장 파일 백업 가능</p></section>`;
  document.querySelector("#back").onclick = lobby;
  document.querySelectorAll("[data-owner-slot]").forEach((label) => {
    label.textContent = `집사 · ${slots[Number(label.dataset.ownerSlot)].ownerName}`;
  });
  document.querySelectorAll("[data-slot]").forEach(
    (b) =>
      (b.onclick = () => {
        selectedSlot = Number(b.dataset.slot);
        slots[selectedSlot] ? room() : enterOwnerName();
      }),
  );
  document.querySelectorAll("[data-delete-slot]").forEach((button) => {
    button.onclick = () => confirmDeleteSlot(Number(button.dataset.deleteSlot));
  });
}
function confirmDeleteSlot(index) {
  if (!slots[index]) return;
  if (modal.open) modal.close();
  modal.innerHTML = `<h2>슬롯 ${index + 1}을 삭제할까?</h2><div class="modal-body"><p>이 슬롯의 진행 상황과 보유 아이템이 모두 삭제돼.<br>삭제하면 되돌릴 수 없어.</p><p>다른 슬롯은 그대로 유지돼.</p></div><div class="delete-actions"><button class="btn" id="cancelSlotDelete" autofocus>취소</button><button class="btn danger" id="confirmSlotDelete">삭제하기</button></div>`;
  modal.querySelector("#cancelSlotDelete").onclick = () => modal.close();
  modal.querySelector("#confirmSlotDelete").onclick = () => {
    const previous = slots[index];
    slots[index] = null;
    if (!save()) {
      slots[index] = previous;
      return;
    }
    modal.close();
    showSlots();
    document.querySelector(`[data-slot="${index}"]`).focus();
    notice(`슬롯 ${index + 1}의 저장을 삭제했어.`);
  };
  modal.showModal();
}
function enterOwnerName(initialName = "") {
  document.body.dataset.screen = "owner-name";
  app.innerHTML = `<section class="panel owner-panel"><button class="back" id="back">← 슬롯 선택으로</button><div class="eyebrow">SLOT 0${selectedSlot + 1} · MEET THE HUMAN</div><h1>집사 이름은?</h1><p class="desc">춘배와 함께할 집사의 이름을 알려줘.</p><form id="ownerForm" novalidate><label class="field-label" for="ownerName">집사 이름</label><input id="ownerName" name="ownerName" class="owner-input" type="text" maxlength="12" autocomplete="off" placeholder="이름을 입력해 줘" aria-describedby="ownerHint ownerError" required><p id="ownerHint" class="note">1~12자로 입력해 줘. 이름은 이 슬롯에 저장돼.</p><p id="ownerError" class="form-error" role="alert"></p><button type="submit" class="btn primary wide" id="ownerNext">다음 · 펫 고르기 →</button></form></section>`;
  const input = document.querySelector("#ownerName");
  input.value = initialName;
  document.querySelector("#back").onclick = showSlots;
  document.querySelector("#ownerForm").onsubmit = (event) => {
    event.preventDefault();
    const name = input.value.trim();
    if (!name || name.length > 12) {
      input.setAttribute("aria-invalid", "true");
      document.querySelector("#ownerError").textContent =
        "집사 이름을 1~12자로 입력해 줘.";
      input.focus();
      return;
    }
    choose(name);
  };
  input.oninput = () => {
    input.removeAttribute("aria-invalid");
    document.querySelector("#ownerError").textContent = "";
  };
  input.focus({ preventScroll: true });
}
function choose(ownerName) {
  if (!ownerName || !ownerName.trim()) return enterOwnerName();
  app.innerHTML = `<section class="panel"><button class="back" id="back">← 집사 이름으로</button><p id="chosenOwner" class="chosen-owner"></p><h1>이야기의 주인공은?</h1><p class="desc">낮잠도 모험도, 같이 하자.</p><div class="cards characters"><button class="character" id="chunbae"><img id="chunbaeArt" class="character-portrait" src="assets/chunbae-base-preview.png" width="128" height="128" alt="은회색 긴 털과 연두빛 눈을 가진 춘배"><strong>춘배</strong><p>집사는 돈을 벌고, 나는 전설이 된다.</p><span class="badge">함께 시작하기 →</span></button><button class="character" disabled aria-label="오레오 개발 중"><canvas id="oreoArt" width="48" height="48"></canvas><strong>오레오</strong><p>냥생 준비 중. 조금만 기다려!</p><span class="badge">🔒 개발 중</span></button></div></section>`;
  drawCat(document.querySelector("#oreoArt").getContext("2d"), 24, 27, 1, true);
  document.querySelector("#chosenOwner").textContent =
    `${ownerName} 집사와 함께할 친구`;
  document.querySelector("#back").onclick = () => enterOwnerName(ownerName);
  document.querySelector("#chunbae").onclick = () => {
    slots[selectedSlot] = PetopiaEngine.normalize({
      character: "chunbae",
      ownerName,
      introSeen: false,
      createdAt: new Date().toISOString(),
    });
    if (save()) {
      meow();
      room();
    } else slots[selectedSlot] = null;
  };
}
function room() {
  const s = PetopiaEngine.normalize(slots[selectedSlot]);
  if (!s.introSeen) {
    playIntro();
    return;
  }
  if (s.expedition) {
    const run = s.expedition;
    if (run.id && typeof run.time === "number")
      PetopiaEngine.settleSurvival(s, { ...run, won: false });
    else {
      s.expedition = null;
      s.hospital = true;
      PetopiaEngine.happy(s, -15);
    }
    save();
    notice("전투 도중 나왔던 춘배가 병원에 있어. 치료 후 다시 출발하자.");
  }
  if (s.arcadeSession) {
    s.arcadeSession = null;
    save();
    notice("중단된 미니게임은 종료됐어. 참가비는 반환되지 않아.");
  }
  renderHome();
}
function drawCat(c, x, y, scale = 1, oreo = false, blink = false) {
  c.save();
  c.translate(Math.round(x), Math.round(y));
  c.scale(scale, scale);
  const r = (x, y, w, h, col) => {
      c.fillStyle = col;
      c.fillRect(x, y, w, h);
    },
    fur = oreo ? "#ece6db" : "#efbb70",
    dark = oreo ? "#45454c" : "#bf844c";
  r(-17, 14, 34, 4, "#30412c25");
  r(-13, -3, 26, 19, fur);
  r(-15, -16, 30, 22, fur);
  r(-15, -24, 8, 12, dark);
  r(7, -24, 8, 12, dark);
  r(-13, -21, 4, 8, "#e7a89a");
  r(9, -21, 4, 8, "#e7a89a");
  r(-4, -16, 3, 7, dark);
  r(3, -16, 3, 5, dark);
  r(-10, -5, 4, blink ? 1 : 4, "#3f493e");
  r(6, -5, 4, blink ? 1 : 4, "#3f493e");
  r(-2, 1, 4, 2, "#ab7162");
  r(-7, 6, 14, 8, "#fff0cc");
  r(-12, 14, 7, 4, dark);
  r(5, 14, 7, 4, dark);
  r(13, 5, 10, 5, fur);
  r(20, 0, 5, 8, dark);
  r(-19, 0, 7, 1, "#8f755b");
  r(12, 0, 7, 1, "#8f755b");
  c.restore();
}
function person(c, x, y, oreo = false) {
  const r = (a, b, w, h, col) => {
    c.fillStyle = col;
    c.fillRect(x + a, y + b, w, h);
  };
  r(4, 27, 17, 2, "#60735130");
  r(8, 19, 5, 8, "#525668");
  r(15, 19, 5, 8, "#525668");
  r(7, 26, 6, 2, "#744a36");
  r(15, 26, 7, 2, "#744a36");
  r(6, 12, 16, 9, oreo ? "#676b76" : "#d89c61");
  r(3, 14, 4, 7, "#e7b98b");
  r(22, 14, 4, 7, "#e7b98b");
  r(8, 2, 13, 11, "#edc398");
  r(6, 3, 3, 7, "#554139");
  r(8, 0, 13, 4, oreo ? "#272e36" : "#554139");
  r(19, 3, 3, 5, "#554139");
  r(10, 6, 2, 2, "#393c39");
  r(17, 6, 2, 2, "#393c39");
  r(13, 10, 3, 1, "#b67e69");
}
function pet(c, x, y, cat = false) {
  const r = (a, b, w, h, col) => {
    c.fillStyle = col;
    c.fillRect(x + a, y + b, w, h);
  };
  const col = cat ? "#e7bc7e" : "#f2e6c5";
  r(0, 14, 25, 3, "#52714c35");
  r(4, 7, 17, 8, col);
  r(4, 14, 4, 3, col);
  r(17, 14, 4, 3, col);
  r(12, 1, 12, 10, col);
  r(12, -2, 4, 5, cat ? "#c18a61" : "#987354");
  r(21, -2, 3, 5, cat ? "#c18a61" : "#987354");
  r(15, 4, 2, 2, "#35483c");
  r(21, 4, 2, 2, "#35483c");
  r(19, 7, 2, 2, "#a67762");
  r(0, 4, 5, 3, col);
  if (cat) {
    r(4, 8, 3, 7, "#c28d62");
    r(10, 8, 3, 7, "#c28d62");
  }
}
const scene = document.querySelector("#scene");
scene.width = 480;
scene.height = 300;
function drawScene(t = 0) {
  const c = scene.getContext("2d");
  const r = (x, y, w, h, col) => {
    c.fillStyle = col;
    c.fillRect(x, y, w, h);
  };
  r(0, 0, 480, 300, "#c9dbb9");
  r(0, 0, 480, 115, "#c8e1d0");
  for (let i = 0; i < 4; i++) {
    const x = ((i * 143 + (motion ? t / 150 : 0)) % 600) - 70;
    r(x, 20 + (i % 2) * 17, 55, 9, "#f8f3d8");
    r(x + 9, 12 + (i % 2) * 17, 31, 17, "#f8f3d8");
  }
  r(370, 25, 26, 26, "#fbebad");
  r(365, 30, 36, 16, "#fbebad");
  for (let i = 0; i < 9; i++) {
    let x = i * 64 - 10,
      y = 70 + (i % 3) * 10;
    r(x, y, 60, 60, "#9db88b");
    r(x + 10, y - 15, 40, 80, "#9db88b");
    r(x + 8, y + 8, 40, 58, "#b2c79c");
  }
  r(0, 135, 480, 165, "#91ad77");
  r(0, 174, 480, 4, "#bac99b");
  r(0, 178, 480, 41, "#d5c5a0");
  r(0, 219, 480, 4, "#aeb88a");
  for (let i = 0; i < 80; i++) {
    let x = (i * 137) % 480,
      y = 145 + ((i * 73) % 155);
    r(x, y, 2, 2, i % 3 ? "#adc18b" : "#6f966b");
  }
  for (let i = 0; i < 20; i++) {
    let x = (i * 83) % 480,
      y = 240 + ((i * 17) % 50);
    r(x, y, 1, 4, "#6e936a");
    r(x - 1, y, 3, 2, i % 2 ? "#f4dfa0" : "#e9c6a9");
  }
  function tree(x, y, s) {
    r(x + 20 * s, y + 30 * s, 7 * s, 70 * s, "#826c4c");
    r(x, y + 10 * s, 48 * s, 42 * s, "#678b65");
    r(x + 8 * s, y - 5 * s, 34 * s, 64 * s, "#789a6b");
    r(x + 16 * s, y - 14 * s, 17 * s, 70 * s, "#789a6b");
    r(x + 4 * s, y + 13 * s, 12 * s, 20 * s, "#8aa775");
    r(x + 30 * s, y + 17 * s, 15 * s, 22 * s, "#597e5e");
    r(x + 8 * s, y + 47 * s, 31 * s, 8 * s, "#597e5e");
  }
  tree(420, 55, 1.7);
  tree(255, 73, 0.75);
  c.save();
  c.translate(-135, 0);
  r(294, 165, 101, 8, "#a47f54");
  r(298, 146, 93, 5, "#ba986b");
  r(298, 154, 93, 5, "#ba986b");
  r(302, 169, 5, 15, "#716a4f");
  r(384, 169, 5, 15, "#716a4f");
  r(306, 147, 4, 18, "#716a4f");
  r(379, 147, 4, 18, "#716a4f");
  c.save();
  c.translate(323, 127);
  c.scale(1.35, 1.35);
  person(c, 0, 0);
  c.restore();
  pet(c, 370, 185, false);
  pet(c, 298, 193, true);
  r(401, 190, 11, 9, "#ad8262");
  r(399, 188, 15, 3, "#e5b181");
  r(404, 177, 3, 12, "#5e8863");
  r(399, 177, 7, 4, "#7a9d6c");
  c.restore();
  for (let j = 0; j < 12; j++) {
    let lx = (j * 67 + (motion ? t / 130 : 0)) % 480,
      ly = (j * 31 + (motion ? t / 190 : 0)) % 290;
    r(lx, ly, 3, 2, j % 2 ? "#eac67c" : "#c4d69a");
  }
  for (let i = 0; i < 5; i++) {
    let x = 290 + i * 33,
      y = 80 + (i % 3) * 17 + (motion ? Math.sin(t / 1500 + i) * 3 : 0);
    r(x, y, 2, 2, "#fff0ba");
  }
  r(0, 285, 480, 15, "#62865d");
  for (let i = 0; i < 32; i++) r(i * 17, 278 + (i % 3) * 4, 10, 15, "#62865d");
}
let last = 0;
function frame(t) {
  if (motion && t - last > 90) {
    drawScene(t);
    last = t;
  }
  requestAnimationFrame(frame);
}
drawScene();
requestAnimationFrame(frame);
document.body.classList.toggle("still", !motion);
lobby();
