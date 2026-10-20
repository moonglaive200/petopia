const spriteImages = {
  chunbae: new Image(),
  partner: new Image(),
  monsters: new Image(),
  base: new Image(),
  walk: new Image(),
};
spriteImages.chunbae.src = "assets/chunbae-emotions.png";
spriteImages.partner.src = "assets/romance-cats-emotions-preview.png";
spriteImages.monsters.src = "assets/monsters.png";
spriteImages.walk.src = "assets/chunbae-walk.png";
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
let audioContext = null;
const effectTimes = {};
const shutterAudio = new Audio("assets/shutter.mp3");
shutterAudio.preload = "auto";
function soundContext() {
  if (!audioContext)
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  if (audioContext.state === "suspended") audioContext.resume().catch(() => {});
  return audioContext;
}
// User-provided audio. Loop intent survives mute; scene cleanup always releases it.
const mediaLoops = new Set(),
  mediaShots = new Set();
function playMedia(name, volume = 0.6, loop = false) {
  const audio = new Audio(`assets/${name}.mp3`);
  audio.volume = volume;
  audio.loop = loop;
  const entry = {
    audio,
    wanted: true,
    stop() {
      this.wanted = false;
      audio.pause();
      audio.currentTime = 0;
      mediaLoops.delete(this);
      mediaShots.delete(this);
    },
    pause() {
      this.wanted = false;
      audio.pause();
    },
    resume() {
      this.wanted = true;
      if (sound && audio.paused) audio.play().catch(() => {});
    },
  };
  (loop ? mediaLoops : mediaShots).add(entry);
  audio.onended = () => mediaShots.delete(entry);
  audio.onerror = () => {
    mediaShots.delete(entry);
    mediaLoops.delete(entry);
  };
  if (sound) audio.play().catch(() => {});
  else if (!loop) {
    mediaShots.delete(entry);
    entry.wanted = false;
  }
  return entry;
}
const sampleEffects = {
  claw: "weapon-swing",
  purchase: "purchase",
  "enhance-success": "enhance-success",
  "enhance-break": "enhance-break",
};
function playEffect(type) {
  if (!sound) return;
  const time = performance.now(),
    gap = type === "step" ? 180 : type === "hit" ? 100 : 75;
  if (time - (effectTimes[type] || -1000) < gap) return;
  effectTimes[type] = time;
  if (sampleEffects[type]) {
    // Attack samples may overlap briefly, never grow into an unlimited audio pile.
    if (
      type === "claw" &&
      [...mediaShots].filter((v) => v.audio.src.endsWith("weapon-swing.mp3"))
        .length >= 3
    )
      return;
    playMedia(sampleEffects[type], type === "claw" ? 0.8 : 0.65);
    return;
  }
  if (type === "shutter") {
    shutterAudio.currentTime = 0;
    shutterAudio.volume = 0.45;
    shutterAudio.play().catch(() => {});
    return;
  }
  try {
    const a = soundContext(),
      now = a.currentTime;
    const presets = {
      pickup: [[980, 1320], "sine", 0.01, 0.03],
      chest: [[600, 900, 1200], "triangle", 0.02, 0.05],
      sad: [[392, 349, 294, 220], "triangle", 0.035, 0.14],
      victory: [[392, 494, 587, 784], "triangle", 0.035, 0.12],
      hit: [[190, 70], "sawtooth", 0.014, 0.025],
      claw: [[620, 180], "sawtooth", 0.018, 0.025],
      fish: [[440, 690], "sine", 0.025, 0.04],
      bell: [[1046, 1568], "sine", 0.025, 0.06],
      yarn: [[280, 420], "triangle", 0.016, 0.04],
      laser: [[1200, 220], "sawtooth", 0.012, 0.04],
      puddle: [[160, 240, 120], "sine", 0.018, 0.04],
      step: [[90], "triangle", 0.007, 0.04],
      dodge: [[600, 1000], "sine", 0.015, 0.03],
      hurt: [[180, 90], "sawtooth", 0.025, 0.06],
      boss: [[220, 330, 220, 440], "square", 0.015, 0.13],
      bomb: [[80, 50, 35], "sawtooth", 0.032, 0.08],
      level: [[523, 659, 784, 1046], "triangle", 0.022, 0.08],
    };
    const [notes, wave, volume, spacing] = presets[type] || [
      [560, 740],
      "triangle",
      0.02,
      0.09,
    ];
    notes.forEach((freq, i) => {
      const o = a.createOscillator(),
        g = a.createGain(),
        start = now + i * spacing;
      o.type = wave;
      o.frequency.setValueAtTime(freq, start);
      if (["claw", "laser", "bomb", "dodge"].includes(type))
        o.frequency.exponentialRampToValueAtTime(
          Math.max(25, freq * 0.25),
          start + 0.15,
        );
      g.gain.setValueAtTime(0.0001, start);
      g.gain.exponentialRampToValueAtTime(
        volume *
          (["claw", "fish", "bell", "yarn", "laser", "puddle"].includes(type)
            ? 2.8
            : 1),
        start + 0.008,
      );
      g.gain.exponentialRampToValueAtTime(0.0001, start + 0.19);
      o.connect(g);
      g.connect(a.destination);
      o.start(start);
      o.stop(start + 0.2);
    });
  } catch {}
}
let lastCatVoice = -1000;
const catTimers = new Set(),
  activeCatVoices = new Set();
function catVoice(kind = "happy") {
  if (!sound || performance.now() - lastCatVoice < 1400) return;
  lastCatVoice = performance.now();
  if (kind === "purr") {
    try {
      const a = soundContext(),
        o = a.createOscillator(),
        lfo = a.createOscillator(),
        g = a.createGain(),
        pulse = a.createGain();
      o.type = "triangle";
      o.frequency.value = 72;
      lfo.frequency.value = 25;
      pulse.gain.value = 0.012;
      lfo.connect(pulse);
      pulse.connect(g.gain);
      g.gain.setValueAtTime(0.012, a.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + 1.4);
      o.connect(g);
      g.connect(a.destination);
      o.start();
      lfo.start();
      o.stop(a.currentTime + 1.45);
      lfo.stop(a.currentTime + 1.45);
    } catch {}
    return;
  }
  const patterns = {
    happy: [1.2],
    surprise: [1.65, 1.35],
    complain: [0.72, 0.85],
  };
  (patterns[kind] || patterns.happy).forEach((rate, i) => {
    const play = () => {
      if (!sound) return;
      const voice = new Audio("assets/meow.mp3");
      voice.volume = kind === "complain" ? 0.2 : 0.26;
      voice.playbackRate = rate;
      activeCatVoices.add(voice);
      voice.onended = () => activeCatVoices.delete(voice);
      voice.play().catch(() => {});
    };
    if (!i) play();
    else {
      const timer = setTimeout(() => {
        catTimers.delete(timer);
        play();
      }, 380 * i);
      catTimers.add(timer);
    }
  });
}
let lastAmbientBeat = -1;
function playCombatAmbience(time) {
  const beat = Math.floor(time * 2);
  if (beat === lastAmbientBeat || !sound) return;
  lastAmbientBeat = beat;
  try {
    const a = soundContext(),
      o = a.createOscillator(),
      g = a.createGain();
    o.type = "sine";
    o.frequency.value = [130.81, 196, 164.81, 220, 146.83, 196, 174.61, 164.81][
      beat % 8
    ];
    g.gain.setValueAtTime(0.006, a.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + 0.4);
    o.connect(g);
    g.connect(a.destination);
    o.start();
    o.stop(a.currentTime + 0.41);
  } catch {}
}
window.addEventListener("petopia-sound", () => {
  for (const entry of mediaLoops) {
    if (sound && entry.wanted) entry.audio.play().catch(() => {});
    else entry.audio.pause();
  }
  if (!sound) for (const entry of [...mediaShots]) entry.stop();
  if (!sound) {
    shutterAudio.pause();
    catTimers.forEach(clearTimeout);
    catTimers.clear();
    activeCatVoices.forEach((v) => v.pause());
    activeCatVoices.clear();
    if (audioContext) audioContext.suspend().catch(() => {});
  }
});
function drawWalkingCat(ctx, x, y, size, p, time) {
  const image = spriteImages.walk;
  if (!image.complete || !image.naturalWidth) {
    drawPortrait(ctx, x, y, size, "normal");
    return;
  }
  const row = p.facing || 0,
    col = motion && p.walking ? Math.floor((p.walkDistance || 0) / 18) % 4 : 0;
  // The artwork is not an equal 4x4 grid. Per-row bounds retain tails and paws.
  const rows = [
      [19, 338],
      [340, 615],
      [629, 883],
      [895, 1189],
    ],
    columns = [
      [
        [46, 295],
        [379, 588],
        [675, 912],
        [996, 1261],
      ],
      [
        [27, 340],
        [341, 644],
        [649, 962],
        [967, 1273],
      ],
      [
        [28, 330],
        [344, 639],
        [655, 954],
        [963, 1278],
      ],
      [
        [32, 296],
        [411, 595],
        [704, 971],
        [1015, 1264],
      ],
    ],
    sx = columns[row][col][0],
    sy = rows[row][0],
    sw = columns[row][col][1] - sx,
    sh = rows[row][1] - sy,
    scale = size / Math.max(sw, sh);
  ctx.save();
  ctx.translate(
    x,
    y + (motion && p.walking ? Math.sin((p.walkDistance || 0) / 9) * 1.5 : 0),
  );
  const squash =
    motion && p.attackAnim > 0 ? Math.sin(p.attackAnim * 20) * 0.06 : 0;
  ctx.scale(1 + squash, 1 - squash);
  if (motion && p.hitRecoil > 0) ctx.rotate(Math.sin(p.hitRecoil * 50) * 0.12);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(
    image,
    sx,
    sy,
    sw,
    sh,
    (-sw * scale) / 2,
    (-sh * scale) / 2,
    sw * scale,
    sh * scale,
  );
  ctx.restore();
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
