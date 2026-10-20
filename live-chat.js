/* Cosmetic viewers: chat never pays money, consumes energy, or rolls game rewards. */
const LIVE_CHAT_NAMES = [
  "젤리수집가",
  "춘배1호팬",
  "참치캔따개",
  "고양이대통령",
  "퇴근한집사",
  "츄르한입만",
  "오후의골골송",
  "박스부동산",
  "랜선집사",
  "발바닥연구원",
  "치즈토스트",
  "낮잠은과학",
  "냥냥펀치",
  "새벽우다다",
  "길냥이친구",
  "집사월급루팡",
  "꼬리흔들지마",
  "춘배보러옴",
  "오늘도야옹",
  "말랑콩떡",
];
const LIVE_CHAT_LINES = [
  "왔어요 왔어 춘배 방송!",
  "얼굴만 보고 있어도 힐링된다",
  "방금 눈 마주쳤다 나만 봤다",
  "집사야 카메라 조금만 더 가까이ㅋㅋ",
  "저 발바닥 좀 봐…",
  "춘배 오늘 컨디션 좋은데?",
  "여기 누우면 되나요",
  "귀여워서 친구 불렀어요",
  "춘배는 세금을 츄르로 내나요",
  "좋아요 누르다가 젤리 될 뻔",
  "집사는 출연료 받나요ㅋㅋ",
  "오늘도 춘배가 세상을 구한다",
  "야옹 한 번만 해주세요",
  "저 표정 분명 간식 생각 중",
  "우리 집 고양이도 같이 보는 중",
  "방금 장면 다시 보고 싶다",
  "춘배야 건강만 해!",
  "채팅 속도 무슨 일이야ㅋㅋ",
  "보고 있으면 시간 순삭",
  "집사보다 춘배가 방송 잘함",
  "화면에서 골골 소리 나는 것 같아",
  "오늘 방송도 출석 완료",
  "춘배 최고 ♥",
  "나는 원래 고양이를 좋아했다",
  "아 저 귀 움직였어ㅋㅋ",
  "작고 소중한 방송국",
  "춘배 방송은 못 참지",
  "츄르값 벌어주는 효자냥",
  "여기 완전 내 취향이네",
  "다음 방송도 보러 올게요",
];
const LIVE_TOPIC_CHAT = {
  "낮잠 방송": [
    "쉿… 춘배 깨겠다",
    "같이 낮잠 자고 싶은 얼굴",
    "코 자는 것도 콘텐츠가 되네",
  ],
  "츄르 먹방": [
    "한입만 달라는 눈빛ㅋㅋ",
    "먹는 모습도 야무지다",
    "츄르 광고주 뭐 하냐",
  ],
  "장난감 놀이": [
    "저 장난감 어디서 샀어요?",
    "집사보다 장난감이 바쁘네",
    "사냥 본능 깨어났다!",
  ],
  "집사 댄스 배틀": [
    "집사 춤에 춘배 표정ㅋㅋ",
    "집사야 관절 괜찮니",
    "춤은 집사가 귀여움은 춘배가",
  ],
  "골골송 ASMR": [
    "이어폰 끼고 듣는 중",
    "골골송 앨범 언제 나와요",
    "마음이 말랑해진다",
  ],
  "상자 언박싱": [
    "내용물보다 상자가 비싸 보임",
    "새집 마련 축하드립니다",
    "박스 입주 심사 끝났나요",
  ],
  "집들이 투어": [
    "춘배 방 인테리어 합격",
    "집사 방도 있긴 한가요ㅋㅋ",
    "냥세권 매물 좋아 보인다",
  ],
  "새벽 우다다": [
    "집사 수면시간 증발ㅋㅋ",
    "저 속도 실화냐",
    "새벽 운동회 시작!",
  ],
  "발바닥 팬미팅": [
    "젤리 한 번만 보여주세요",
    "핑크 젤리 귀하다",
    "발바닥 팬클럽 가입합니다",
  ],
  "썸냥이 합방": [
    "둘이 눈빛 뭐야 뭐야",
    "우리 춘배 다 컸네",
    "이 조합 계속 보고 싶다",
  ],
  "춘배 운동회": [
    "우리 춘배 금메달 가자",
    "집사도 같이 뛰어ㅋㅋ",
    "운동했으니 츄르 먹자",
  ],
  "협찬 방송": [
    "광고도 춘배가 하면 본다",
    "모델 섭외 잘했네",
    "귀여움이 브랜드다",
  ],
};
const LIVE_BOT_CHAT = [
  "아직 시청자는 없지만 집사봇은 보고 있어! 🐾",
  "춘배야 긴장하지 마. 첫 팬이 곧 올 거야!",
  "카메라 테스트 완료! 오늘도 귀여움은 만점.",
  "시청자가 없어도 집사봇은 박수 친다 짝짝짝!",
  "첫 방송 리허설 중… 츄르부터 챙겨 놓자.",
];
function liveChatPanel(preview = false) {
  return `<aside class="live-chat-panel" aria-label="시청자 채팅"><div class="live-chat-heading"><strong>${preview ? "채팅 대기실" : "실시간 채팅"}</strong><span>${preview ? "대기 중" : '● <span id="liveViewerCount"></span>명'}</span></div><div class="live-chat-messages" id="liveChatMessages" role="log" aria-live="off" aria-label="시청자 채팅 기록">${preview ? '<p class="live-chat-wait">방송을 시작하면<br>집사들이 채팅하러 와! 🐾</p>' : ""}</div><button class="chat-jump" id="liveChatJump" hidden>새 채팅 보기 ↓</button><div class="live-chat-footer">${preview ? "춘배를 기다리는 중…" : "♥ 춘배와 함께하는 랜선 집사들"}</div></aside>`;
}
function mountLiveChat(state, topic) {
  const log = document.querySelector("#liveChatMessages"),
    jump = document.querySelector("#liveChatJump"),
    count = document.querySelector("#liveViewerCount");
  let stopped = false,
    timer;
  const random = () =>
    crypto.getRandomValues(new Uint32Array(1))[0] / 4294967296;
  const pick = (list) => list[Math.floor(random() * list.length)];
  function lineElement(message) {
    const row = document.createElement("p");
    row.className = `live-chat-message chat-tone-${message.tone}${message.reaction ? " chat-reaction" : ""}`;
    const name = document.createElement("strong");
    name.textContent = message.name;
    const text = document.createElement("span");
    text.textContent = message.text;
    row.append(name, text);
    return row;
  }
  function push(message) {
    if (stopped) return;
    const follow = log.scrollHeight - log.scrollTop - log.clientHeight < 40;
    state.messages.push(message);
    const row = lineElement(message);
    log.append(row);
    if (state.messages.length > 40) {
      state.messages.shift();
      const first = log.firstElementChild,
        height =
          first.getBoundingClientRect().height +
          parseFloat(getComputedStyle(first).marginBottom);
      first.remove();
      if (!follow) log.scrollTop = Math.max(0, log.scrollTop - height);
    }
    if (follow) log.scrollTop = log.scrollHeight;
    else jump.hidden = false;
  }
  state.messages.forEach((message) => log.append(lineElement(message)));
  if (!state.messages.length) {
    push({
      name: "춘배방송국",
      text: `${topic} 시작! 다 같이 춘배를 응원해 줘 🐾`,
      tone: 0,
      reaction: true,
    });
    if (state.viewers === 0)
      push({ name: "집사봇", text: pick(LIVE_BOT_CHAT), tone: 5 });
    for (let i = 0; i < (state.viewers > 0 ? 3 : 0); i++)
      push({
        name: pick(LIVE_CHAT_NAMES),
        text: pick(LIVE_CHAT_LINES),
        tone: Math.floor(random() * 6),
      });
  }
  log.scrollTop = log.scrollHeight;
  jump.onclick = () => {
    log.scrollTop = log.scrollHeight;
    jump.hidden = true;
  };
  log.onscroll = () => {
    if (log.scrollHeight - log.scrollTop - log.clientHeight < 40)
      jump.hidden = true;
  };
  function tick() {
    if (stopped) return;
    if (!document.hidden) {
      const lines =
        random() < 0.4 && LIVE_TOPIC_CHAT[topic]
          ? LIVE_TOPIC_CHAT[topic]
          : LIVE_CHAT_LINES;
      push({
        name: state.viewers > 0 ? pick(LIVE_CHAT_NAMES) : "집사봇",
        text: state.viewers > 0 ? pick(lines) : pick(LIVE_BOT_CHAT),
        tone: Math.floor(random() * 6),
      });
    }
    timer = setTimeout(tick, 900 + Math.floor(random() * 700));
  }
  count.textContent = money(state.viewers);
  timer = setTimeout(tick, 700);
  return {
    reaction(text) {
      push({
        name: state.viewers > 0 ? "집사들" : "집사봇",
        text,
        tone: 2,
        reaction: true,
      });
    },
    stop() {
      stopped = true;
      clearTimeout(timer);
    },
  };
}
