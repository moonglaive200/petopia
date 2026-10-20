/* Offline social content. Celebrity likes are fictional in-game events. */
const STAR_TOPICS = [
  "일상",
  "츄르 먹방",
  "장난감 자랑",
  "산책 인증",
  "식빵 굽기",
  "집사 관찰",
  "상자 리뷰",
  "냥모닝 셀카",
  "창밖 구경",
  "낮잠 일기",
  "발바닥 자랑",
  "썸냥이 투샷",
  "집들이",
  "사고 현장",
  "운동 챌린지",
  "골골송 녹음",
];
const STAR_CAPTIONS = [
  [
    "오늘도 집사가 대신 출근했다. 나는 귀여웠다.",
    "아무것도 안 했는데 하루가 갔다. 재능이다.",
    "내 통장은 집사가, 내 표정은 내가 관리한다.",
  ],
  [
    "이 츄르의 끝은 어디인가. 집사 지갑인가.",
    "협찬 아닙니다. 집사 카드입니다.",
    "한 입만이라고 했지만 한 봉지였다.",
  ],
  [
    "새 장난감보다 포장 끈이 더 좋다.",
    "집사가 조종하는 줄 알지? 내가 조종한다.",
    "오늘의 사냥감: 깃털과 집사의 자존심.",
  ],
  [
    "공원에 다녀왔다. 동네 평판이 또 올랐다.",
    "꽃은 못 먹고 다이아는 주웠다.",
    "걸음 수는 집사가 채우고 사진은 내가 찍혔다.",
  ],
  [
    "발효 0시간, 털 함량 100% 식빵.",
    "갓 구운 춘배. 만지면 골골 소리가 납니다.",
    "모서리가 둥근 이유는 전부 털이기 때문이다.",
  ],
  [
    "집사는 왜 돈을 벌고 피곤해할까. 나는 자는데.",
    "집사의 월요일 표정을 관찰했다. 귀가 없어서 다행이다.",
    "집사에게 업무 지시 중. 츄르 즉시 결재.",
  ],
  [
    "방 1개, 창문 0개. 신축 상자 입주 완료.",
    "명품 백보다 택배 박스가 더 잘 어울린다.",
    "집사가 상자를 버리려 했다. 임대차 분쟁이다.",
  ],
  [
    "눈 뜬 김에 세상을 감시한다.",
    "기상 직후인데 미모는 이미 출근했다.",
    "모닝콜은 새벽 네 시. 고객 만족도는 낮다.",
  ],
  [
    "비둘기 주가를 분석 중이다.",
    "창밖 세입자들이 자꾸 날아다닌다.",
    "창문은 냥플릭스다. 광고가 없다.",
  ],
  [
    "열두 시간 잤더니 졸리다.",
    "꿈에서 츄르 공장을 인수했다.",
    "잠깐 눈을 감았더니 계절이 바뀌었다.",
  ],
  [
    "젤리 수출 상담은 집사에게.",
    "말랑함은 유료입니다. 집사는 무료입니다.",
    "이 발로 집사 인생을 꾹꾹 눌렀다.",
  ],
  [
    "같이 찍었는데 내 얼굴이 더 커 보인다. 털이다.",
    "오늘부터 우리 츄르는 반반. 내 몫은 큰 반.",
    "집사가 눈치 없이 가운데 앉으려 한다.",
  ],
  [
    "집사 명의지만 소유주는 춘배입니다.",
    "이 집의 채광과 낮잠 동선을 평가하겠습니다.",
    "가구는 줄이고 캣타워는 늘려주세요.",
  ],
  [
    "꽃병이 먼저 시비를 걸었다.",
    "휴지가 자발적으로 풀렸다. 목격자는 없다.",
    "증거 사진을 집사가 올려버렸다.",
  ],
  [
    "운동 3초, 휴식 3시간. 인터벌 트레이닝.",
    "캣휠은 돌고 집사 지갑은 비었다.",
    "레이저는 잡을 수 없다. 인생도 그렇다.",
  ],
  [
    "오늘의 신곡: 골골골. 전곡 반복입니다.",
    "마이크에 털이 들어간 건 라이브 감성입니다.",
    "집사 코러스는 코골이로 참여했다.",
  ],
];
const STAR_COMMENTS = [
  "집사님 촬영 실력 늘었네요ㅋㅋ",
  "이 표정은 월세 내는 표정인데",
  "젤리 한 번만 만지게 해주세요",
  "춘배는 귀엽고 집사는 바쁘고",
  "이 계정 때문에 출근이 늦었습니다",
  "오늘도 털이 고급지다",
  "츄르 광고주 뭐 하세요?",
  "팔로우 누르다 젤리 눌렀어요",
  "집사 통장 괜찮나요",
  "내 마음의 알고리즘은 춘배",
  "이 집사 복지 좋네요",
  "사진에서 골골 소리가 들려요",
  "이건 저장해야겠다",
  "춘배야 세금은 집사가 내줄 거야",
  "실물 영접 기원 1일차",
  "집사 시점 너무 부럽다",
  "냥생 너무 잘 사는 거 아니냐",
  "턱 밑 한번만 긁고 싶다",
  "이 표정으로 사과하면 다 용서됨",
  "펫마트 매출의 주역",
  "오늘의 귀여움 할당량 초과",
  "랜선 집사는 오늘도 야근합니다",
  "엄마 나 유명한 고양이랑 맞팔하고 싶어",
  "우리 집 고양이한테 보여줬더니 질투함",
  "이 정도면 국보 젤리",
  "통장보다 사진첩이 부자",
  "츄르 사재기하고 기다릴게",
  "이런 얼굴로 던전도 간다니",
  "분명 어제도 잤는데 오늘도 잔다",
  "집사 노동의 결실이 아름답다",
  "배경 바뀌었네 성공했구나",
  "사진에서 햇살 냄새가 난다",
  "이 계정은 구독료를 받아야 한다",
  "오늘도 팔로워 적금 들고 갑니다",
  "영상으로도 올려줘요",
  "귀 끝까지 완벽해",
  "집사님 춘배 모시는 법 강의 좀",
  "세계관 최강 귀여움",
  "여기가 힐링 맛집 맞죠",
  "좋아요 취소하고 두 번 누를 뻔",
];
const SOCIAL_CELEBRITIES = [
  "유재석",
  "아이유",
  "손흥민",
  "김연아",
  "봉준호",
  "박보검",
  "김태리",
  "차은우",
  "제니",
  "RM",
  "테일러 스위프트",
  "브루노 마스",
  "빌리 아일리시",
  "아리아나 그란데",
  "에드 시런",
  "리오넬 메시",
  "크리스티아누 호날두",
  "젠데이아",
  "톰 홀랜드",
  "엠마 왓슨",
];
const SOCIAL_LEVELS = [
  { at: 0, name: "골목 촬영 구석" },
  { at: 100, name: "소품 가득한 방" },
  { at: 1000, name: "홈 스튜디오" },
  { at: 5000, name: "네온 스튜디오" },
  { at: 30000, name: "스타 방송국" },
  { at: 100000, name: "월드 투어 무대" },
];
function socialLevel(fans) {
  let level = 0;
  SOCIAL_LEVELS.forEach((s, i) => {
    if (fans >= s.at) level = i;
  });
  return {
    level,
    ...SOCIAL_LEVELS[level],
    next: SOCIAL_LEVELS[level + 1] || null,
  };
}
(function (E) {
  E.publishStar = function (s, topic, random = Math.random) {
    if (
      !Number.isInteger(topic) ||
      !STAR_TOPICS[topic] ||
      (topic === 1 && !s.treats.some((n) => n > 0)) ||
      (topic === 2 && !s.toys.length) ||
      (topic === 11 && !s.romance) ||
      !E.useInfluence(s, "star")
    )
      return null;
    const before = s.followers,
      base =
        25 +
        (topic === (s.day - 1) % STAR_TOPICS.length ? 25 : 0) +
        Math.floor(s.happiness / 10) +
        (s.highlights.length ? 5 : 0),
      cross = E.addFollowers(s, "star", base),
      gain = s.followers - before;
    const celebrity =
      random() < 0.1
        ? SOCIAL_CELEBRITIES[Math.floor(random() * SOCIAL_CELEBRITIES.length)]
        : null;
    const bonus = celebrity ? Math.floor(s.followers * 0.1) : 0;
    if (celebrity) {
      s.followers += bonus;
      s.happiness = 100;
    }
    const caption = STAR_CAPTIONS[topic][Math.floor(random() * 3)],
      comment = STAR_COMMENTS[Math.floor(random() * STAR_COMMENTS.length)],
      comment2 =
        STAR_COMMENTS[
          (Math.floor(random() * STAR_COMMENTS.length) + 13) %
            STAR_COMMENTS.length
        ];
    const post = {
      id: `${s.day}:${s.completionSerial}`,
      day: s.day,
      topic,
      gain,
      likes: gain * 3,
      caption,
      comment,
      comment2,
      celebrity,
      bonus,
    };
    s.feed.unshift(post);
    s.feed = s.feed.slice(0, 150);
    const encounter = E.meet(s, "star");
    E.log(
      s,
      `펫스타 게시 · 팬 +${gain}${celebrity ? ` · ${celebrity} 가상 좋아요! 팬 +${bonus} · 행복도 100` : ""}`,
    );
    return { ...post, cross, encounter };
  };
})(PetopiaEngine);
const LIVE_TOPICS = [
  "낮잠 방송",
  "츄르 먹방",
  "장난감 놀이",
  "집사 댄스 배틀",
  "골골송 ASMR",
  "상자 언박싱",
  "집들이 투어",
  "새벽 우다다",
  "발바닥 팬미팅",
  "썸냥이 합방",
  "춘배 운동회",
  "협찬 방송",
];
const LIVE_SCENES = [
  [
    "춘배가 카메라 앞에서 졸기 시작했다.",
    [
      "골골송 ASMR 켜기",
      "수면용 츄르 광고 읽기",
      "조용히 담요 덮어주기",
      "집사도 옆에서 잠들기",
    ],
    ["sleep", "owner", "sleep", "sleep"],
  ],
  [
    "집사의 코골이가 마이크를 점령했다.",
    [
      "코골이 리믹스 만들기",
      "방음 베개 협찬 소개",
      "춘배 얼굴로 화면 전환",
      "집사 코에 마이크 대기",
    ],
    ["dance", "owner", "zoom", "paw"],
  ],
  [
    "츄르가 튀어서 춘배 코에 붙었다.",
    [
      "코 핥는 순간 줌인",
      "오늘의 츄르 가격 안내",
      "집사가 살살 닦아주기",
      "집사도 코에 츄르 묻히기",
    ],
    ["feed", "feed", "owner", "dance"],
  ],
  [
    "시청자가 맛 표현을 부탁했다.",
    [
      "골골 소리로 맛 평가",
      "츄르 봉지 제품 리뷰",
      "남은 츄르 천천히 먹기",
      "집사가 냄새 맡고 평가",
    ],
    ["feed", "zoom", "sleep", "owner"],
  ],
  [
    "깃털 낚싯대가 화면 밖으로 날아갔다.",
    [
      "춘배의 점프 보여주기",
      "장난감 내구성 리뷰",
      "앉아서 집사 기다리기",
      "집사가 낚싯대 물어오기",
    ],
    ["jump", "toy", "sleep", "owner"],
  ],
  [
    "털실공이 집사 발목을 감았다.",
    [
      "엉킨 발목 클로즈업",
      "실뜨기 세트 광고",
      "춘배가 실 풀어주기",
      "집사가 탈출 마술 도전",
    ],
    ["paw", "toy", "toy", "dance"],
  ],
  [
    "채팅창이 집사 댄스를 외친다.",
    [
      "집사 셔플 댄스",
      "댄스화 협찬 소개",
      "춘배는 박수만 치기",
      "집사 브레이크 댄스",
    ],
    ["dance", "owner", "paw", "dance"],
  ],
  [
    "춘배가 집사의 춤을 보고 얼어붙었다.",
    [
      "표정 확대해 밈 만들기",
      "집사 춤 유료 앙코르",
      "춘배에게 휴식 주기",
      "고양이와 동기화 댄스",
    ],
    ["zoom", "dance", "sleep", "dance"],
  ],
  [
    "시청자가 볼륨을 최대로 올렸다.",
    [
      "골골송 독주",
      "마이크 음질 소개",
      "속삭이는 집사",
      "우렁찬 야옹 고음 도전",
    ],
    ["sleep", "zoom", "owner", "jump"],
  ],
  [
    "마이크에 털이 잔뜩 붙었다.",
    [
      "털 수집 ASMR",
      "냥전용 마이크 광고",
      "집사가 조용히 청소",
      "털로 마이크 가발 만들기",
    ],
    ["paw", "zoom", "owner", "toy"],
  ],
  [
    "상자 속에 더 작은 상자가 있다.",
    [
      "춘배가 직접 개봉",
      "상자 크기 비교 리뷰",
      "안쪽 상자에서 휴식",
      "집사가 큰 상자 입어보기",
    ],
    ["toy", "zoom", "sleep", "owner"],
  ],
  [
    "춘배가 포장지에만 관심을 보인다.",
    [
      "포장지 바스락 방송",
      "포장지 재활용 광고",
      "춘배 취향 존중하기",
      "집사를 선물처럼 포장",
    ],
    ["toy", "owner", "sleep", "dance"],
  ],
  [
    "시청자가 집 구조를 궁금해한다.",
    [
      "캣타워 투어",
      "집사 방 임대 광고",
      "햇살 드는 자리 소개",
      "집사가 캣타워 올라가기",
    ],
    ["jump", "owner", "sleep", "jump"],
  ],
  [
    "새 가구에 춘배 털이 붙었다.",
    [
      "털무늬 한정판 소개",
      "돌돌이 협찬 방송",
      "춘배 전용 자리 만들기",
      "가구 대신 집사 빗질",
    ],
    ["zoom", "toy", "sleep", "owner"],
  ],
  [
    "새벽 네 시 우다다 시간이 왔다.",
    [
      "춘배 질주 중계",
      "저소음 매트 소개",
      "따뜻한 물로 쉬어가기",
      "집사와 전력 달리기",
    ],
    ["jump", "toy", "sleep", "dance"],
  ],
  [
    "춘배가 갑자기 벽을 보고 멈췄다.",
    [
      "긴장감 있게 줌인",
      "방충망 협찬 소개",
      "장난감으로 관심 돌리기",
      "집사도 벽과 대화하기",
    ],
    ["zoom", "owner", "toy", "owner"],
  ],
  [
    "채팅창에 젤리 이모티콘이 쏟아진다.",
    [
      "젤리 확대 촬영",
      "젤리 굿즈 예약 안내",
      "부드럽게 발 마사지",
      "집사 발바닥도 공개",
    ],
    ["paw", "toy", "sleep", "owner"],
  ],
  [
    "팬이 춘배의 사인을 부탁했다.",
    [
      "발도장 찍어주기",
      "한정판 발도장 판매",
      "랜선 눈맞춤 해주기",
      "집사가 고양이 사인 흉내",
    ],
    ["paw", "paw", "zoom", "dance"],
  ],
  [
    "썸냥이가 카메라에 얼굴을 들이밀었다.",
    [
      "둘이 나란히 인사",
      "커플 츄르 세트 소개",
      "둘이 함께 쉬기",
      "집사가 사이에 끼어들기",
    ],
    ["pair", "feed", "sleep", "owner"],
  ],
  [
    "둘이 같은 장난감을 잡았다.",
    [
      "사이좋게 줄다리기",
      "커플 장난감 리뷰",
      "장난감을 하나 더 꺼내기",
      "집사가 심판으로 등장",
    ],
    ["pair", "toy", "toy", "dance"],
  ],
  [
    "춘배가 캣휠 앞에서 고민한다.",
    [
      "첫 발 내딛기 응원",
      "캣휠 협찬 소개",
      "스트레칭부터 시작",
      "집사가 캣휠 대신 달리기",
    ],
    ["jump", "toy", "paw", "dance"],
  ],
  [
    "레이저 점이 집사 등으로 갔다.",
    [
      "사냥감 추적 카메라",
      "레이저 포인터 리뷰",
      "천천히 장난감 교체",
      "집사가 보스 몬스터 연기",
    ],
    ["jump", "toy", "toy", "owner"],
  ],
  [
    "광고 문구보다 춘배 하품이 인기다.",
    ["하품 클로즈업", "집사가 광고 읽기", "춘배 쉬는 시간", "하품 챌린지 개최"],
    ["zoom", "owner", "sleep", "jump"],
  ],
  [
    "협찬 상품보다 상자가 먼저 뜯겼다.",
    [
      "상자 리뷰로 전환",
      "제품 장점 직접 설명",
      "춘배에게 안전한 소품만",
      "집사 즉흥 홈쇼핑",
    ],
    ["toy", "owner", "sleep", "dance"],
  ],
];
function livePlaylist(topic, random = Math.random) {
  const index = Math.max(0, LIVE_TOPICS.indexOf(topic)),
    used = [index * 2, index * 2 + 1],
    pool = LIVE_SCENES.map((_, i) => i).filter((i) => !used.includes(i));
  while (used.length < 4) {
    const n = Math.floor(random() * pool.length);
    used.push(pool.splice(n, 1)[0]);
  }
  return used.map((i) => LIVE_SCENES[i]);
}

Object.assign(PetopiaEngine, {
  socialLevel,
  starTopics: STAR_TOPICS,
  celebrities: SOCIAL_CELEBRITIES,
  liveTopics: LIVE_TOPICS,
  liveScenes: LIVE_SCENES,
  livePlaylist,
});
