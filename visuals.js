const spriteImages = {
  chunbae: new Image(),
  partner: new Image(),
  monsters: new Image(),
  base: new Image(),
};
spriteImages.chunbae.src = "assets/chunbae-emotions.png";
spriteImages.partner.src = "assets/romance-cats-emotions-preview.png";
spriteImages.monsters.src = "assets/monsters.png";
spriteImages.base.src = "assets/chunbae-base-preview.png";
const emotions = { normal: 0, sleep: 1, happy: 2, surprise: 3, sad: 4 };
function spriteMarkup(kind = "chunbae", emotion = "normal", extra = "") {
  return `<div class="cat-sprite ${kind === "chunbae" ? "chunbae-sprite" : "companion-sprite"} ${extra}" role="img" aria-label="${kind === "chunbae" ? "춘배" : E.partners[kind].name} ${emotion}" style="--col:${emotions[emotion] || 0};--row:${kind === "chunbae" ? 0 : kind};--rows:${kind === "chunbae" ? 1 : 3};background-image:url('${kind === "chunbae" ? "assets/chunbae-emotions.png" : "assets/romance-cats-emotions-preview.png"}')"></div>`;
}
function drawPortrait(
  ctx,
  x,
  y,
  size = 96,
  emotion = "normal",
  kind = "chunbae",
) {
  const img = spriteImages[kind === "chunbae" ? "chunbae" : "partner"];
  if (!img.complete || !img.naturalWidth) return;
  const rows = kind === "chunbae" ? 1 : 3,
    sw = img.width / 5,
    sh = img.height / rows,
    col = emotions[emotion] || 0,
    row = kind === "chunbae" ? 0 : kind;
  ctx.imageSmoothingEnabled = false;
  const h = size,
    w = (size * sw) / sh;
  ctx.drawImage(img, sw * col, sh * row, sw, sh, x - w / 2, y - h / 2, w, h);
}
function playEffect(type) {
  if (!sound) return;
  try {
    const a = new (window.AudioContext || window.webkitAudioContext)(),
      now = a.currentTime;
    if (type === "shutter") {
      const buffer = a.createBuffer(1, a.sampleRate * 0.12, a.sampleRate),
        v = buffer.getChannelData(0);
      for (let i = 0; i < v.length; i++)
        v[i] = (Math.random() * 2 - 1) * (1 - i / v.length);
      const n = a.createBufferSource(),
        g = a.createGain();
      n.buffer = buffer;
      g.gain.value = 0.13;
      n.connect(g);
      g.connect(a.destination);
      n.start();
      n.onended = () => a.close();
      return;
    }
    const notes =
      type === "sad"
        ? [392, 349, 294, 220]
        : type === "victory"
          ? [392, 494, 587, 784]
          : type === "hit"
            ? [180, 80]
            : [560, 740];
    notes.forEach((frequency, i) => {
      const o = a.createOscillator(),
        g = a.createGain();
      o.type = type === "hit" ? "sawtooth" : "triangle";
      o.frequency.value = frequency;
      const start = now + i * (type === "hit" ? 0.035 : 0.16);
      g.gain.setValueAtTime(0.0001, start);
      g.gain.exponentialRampToValueAtTime(0.045, start + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, start + 0.22);
      o.connect(g);
      g.connect(a.destination);
      o.start(start);
      o.stop(start + 0.23);
    });
    setTimeout(() => a.close(), 1500);
  } catch {}
}
function showCutscene(type, next) {
  const labels = {
      construction: ["공사장으로 출근!", "안전모 장착. 춘배 밥값 벌러 간다."],
      office: ["회사로 출근!", "출근은 집사가, 낮잠은 춘배가."],
      lab: ["연구소로 출근!", "오늘도 츄르의 비밀을 연구한다."],
      sleep: ["잘 자, 춘배", "하루를 마무리하는 중…"],
    },
    d = labels[type] || labels.office;
  showModal(
    d[0],
    `<div class="cutscene scene-${type}"><div class="city-blocks"></div>${type === "sleep" ? spriteMarkup("chunbae", "sleep") : `<div class="owner-actor walking"><span>${type === "construction" ? "⛑" : type === "lab" ? "🥼" : "💼"}</span><canvas id="cutsceneOwner" width="32" height="32"></canvas></div>`}</div><p>${d[1]}</p>`,
  );
  const c = document.getElementById("cutsceneOwner");
  if (c) person(c.getContext("2d"), 4, 1, false);
  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    modal.removeEventListener("close", finish);
    next?.();
  };
  modal.addEventListener("close", finish, { once: true });
  modal.querySelector(".btn").textContent = "계속하기";
}
