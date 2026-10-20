/* Petopia v2 — deterministic rules, independent of the DOM. */
(function (root) {
  const weapons = [
    { name: "솜방망이", attack: 0, cost: 0 },
    { name: "등짝 스매셔", attack: 6, cost: 180 },
    { name: "전설의 냥발톱", attack: 15, cost: 650 },
  ];
  const armors = [
    { name: "폭신한 털", defense: 0, hp: 0, cost: 0 },
    { name: "택배 상자 갑옷", defense: 3, hp: 16, cost: 150 },
    { name: "방탄 앞치마", defense: 7, hp: 36, cost: 550 },
  ];
  // Preserve the original indices; later equipment tiers extend existing saves.
  [
    ["참치캔 너클", 24, 1800],
    ["냥냥 펀치 글러브", 36, 4200],
    ["은빛 송곳니", 48, 9000],
    ["달빛 갈퀴", 65, 18000],
    ["츄르 광선검", 85, 36000],
    ["집사 수호냥권", 110, 72000],
    ["춘배의 천공발톱", 145, 140000],
  ].forEach(([name, attack, cost]) => weapons.push({ name, attack, cost }));
  [
    ["골판지 기사 갑옷", 11, 60, 1600],
    ["냥집사 방호복", 16, 90, 3800],
    ["참치 비늘 갑옷", 22, 130, 8200],
    ["달빛 망토", 29, 180, 17000],
    ["우주 탐사냥 슈트", 37, 240, 34000],
    ["집사 수호 성갑", 46, 310, 68000],
    ["춘배의 불멸 털갑옷", 58, 400, 135000],
  ].forEach(([name, defense, hp, cost]) =>
    armors.push({ name, defense, hp, cost }),
  );
  const treats = [
    { name: "참치 츄르", cost: 18, diamond: 0, happy: 15 },
    { name: "연어 츄르", cost: 45, diamond: 0, happy: 35 },
    { name: "금수저 츄르", cost: 80, diamond: 2, happy: 70 },
  ];
  const toys = [
    { name: "깃털 낚싯대", cost: 90, diamond: 0, happy: 10 },
    { name: "우당탕 털실공", cost: 180, diamond: 0, happy: 15 },
    { name: "집사 조종 리모컨", cost: 350, diamond: 4, happy: 25 },
  ];
  const vehicles = [
    {
      name: "중고 붕붕카",
      cost: 500,
      diamond: 0,
      type: "car",
      text: "드라이브 해금 · 드라이브 행복도 +5",
    },
    {
      name: "냥르쉐",
      cost: 2400,
      diamond: 3,
      type: "car",
      text: "드라이브 금화 +30 · 행복도 +10",
    },
    {
      name: "츄르 항공 1호",
      cost: 6000,
      diamond: 8,
      type: "plane",
      text: "드라이브를 공중 산책으로 · 다이아 +1",
    },
  ];
  const houses = [
    {
      name: "집사랑 얹혀사는 방",
      cost: 0,
      work: 0,
      staff: 0,
      discount: 0,
      energy: 0,
    },
    {
      name: "택배 상자 원룸",
      cost: 350,
      work: 0.05,
      staff: 0,
      discount: 0,
      energy: 0,
    },
    {
      name: "반지하 냥룸",
      cost: 900,
      work: 0.1,
      staff: 0,
      discount: 0,
      energy: 0,
    },
    {
      name: "햇살 맛집 아파트",
      cost: 2200,
      work: 0.15,
      staff: 0,
      discount: 0,
      energy: 2,
    },
    {
      name: "츄르 풀빌라",
      cost: 5500,
      work: 0.2,
      staff: 0.1,
      discount: 0,
      energy: 3,
    },
    {
      name: "집사는 별채에 저택",
      cost: 12000,
      work: 0.25,
      staff: 0.15,
      discount: 0.15,
      energy: 4,
    },
    {
      name: "우주 펫하우스",
      cost: 26000,
      work: 0.35,
      staff: 0.2,
      discount: 0.2,
      energy: 5,
    },
  ];
  const jobs = [
    { name: "공사장", pay: 28, cost: 8, hire: 550 },
    { name: "회사", pay: 40, cost: 12, hire: 850 },
    { name: "츄르 연구소", pay: 55, cost: 16, hire: 1300 },
  ];
  const companyNames = [
    "펫비디아",
    "펫성",
    "펫이닉스",
    "펫플",
    "펫글",
    "펫이크로소프트",
    "펫슬라",
    "펫마존",
    "펫카오",
    "펫이버",
  ];
  const companies = companyNames.map((name, i) => ({
    name,
    stock: 45 + i * 12,
    cost: 4500 + i * 900,
    income: 110 + i * 24,
  }));
  const coins = [
    { name: "냥트코인", base: 70 },
    { name: "츄리움", base: 35 },
    { name: "도지냥", base: 12 },
  ];
  const buildings = [
    { name: "골판지 상가", cost: 1800, income: 45 },
    { name: "냥세권 오피스텔", cost: 4800, income: 135 },
    { name: "츄르타워", cost: 13000, income: 400 },
  ];
  // v3 catalogs and rules. Existing item indices remain stable for old saves.
  treats.forEach((t, i) =>
    Object.assign(t, {
      cost: [400, 1100, 2200][i],
      diamond: i === 2 ? 1 : 0,
      affection: [0.15, 0.35, 0.7][i],
    }),
  );
  toys.splice(
    0,
    toys.length,
    ...[
      "깃털 낚싯대",
      "우당탕 털실공",
      "집사 조종 리모컨",
      "삑삑 생선",
      "캣닢 주머니",
      "레이저 쫓기 세트",
      "자동 나비 장난감",
      "우주 쥐돌이",
      "황금 캣휠",
      "츄르 왕관",
    ].map((name, i) => ({
      name,
      cost: Math.round((0.2 + i * 0.08) * 3000),
      diamond: 0,
      affection: 0.2 + i * 0.08,
    })),
  );
  vehicles.forEach((v, i) => {
    v.cost *= i === 2 ? 50 : 10;
    v.work = [0.1, 0.15, 0.25][i];
    v.text += ` · 주인 일당 +${v.work * 100}% (최고 효과만 적용)`;
  });
  vehicles[0].text = "자동차+썸냥이로 드라이브 해금 · 주인 일당 ×1.10";
  vehicles[1].text = "드라이브 다이아 +1 · 주인 일당 ×1.15";
  vehicles[2].text = "드라이브 다이아 +5 · 주인 일당 ×1.25";
  houses.push({
    name: "춘배의 천상궁전",
    cost: 1000000,
    work: 0.5,
    staff: 0.3,
    discount: 0.25,
    energy: 0,
  });
  houses.forEach((h, i) => {
    h.cost = [0, 5000, 15000, 45000, 120000, 300000, 600000, 1000000][i];
    h.diamond = i === 6 ? 30 : i === 7 ? 80 : 0;
    h.wake = i < 3 ? [-10, -5, 0][i] : (i - 2) * 3;
    h.energy = 0;
  });
  houses[0].name = "집사랑 노숙 중";
  jobs.forEach((j) => {
    j.hire *= 10;
    j.cost = 50;
  });
  buildings.forEach((b) => (b.cost *= 10));
  [
    ["캣닢 백화점", 180000],
    ["냐옹 복합몰", 260000],
    ["집사 금융센터", 380000],
    ["골골랜드 호텔", 540000],
    ["냥세권 메가타워", 740000],
    ["춘배월드 본사", 1000000],
  ].forEach(([name, cost]) => buildings.push({ name, cost }));
  buildings.forEach((b) => (b.income = Math.round(b.cost * 0.02)));
  companies.forEach((c) => (c.cost *= 10));
  companies.forEach((c, i) => {
    c.stock = [1800, 750, 950, 2200, 1600, 2100, 650, 1200, 180, 350][i];
    c.cost = [
      900000, 480000, 560000, 1200000, 1000000, 1300000, 450000, 850000, 110000,
      220000,
    ][i];
    c.income = Math.round(c.cost * 0.01);
  });
  const partners = [
    { name: "치즈냥이", row: 0, likes: 0 },
    { name: "턱시도냥이", row: 1, likes: 1 },
    { name: "백설냥이", row: 2, likes: 2 },
  ];
  const bossNames = [
    "조커의남자",
    "츄르 밀수왕",
    "진공청소기 대마왕",
    "레이저포인터 백작",
    "택배상자 미믹",
    "목욕탕의 배신자",
    "새벽 네 시의 질주냥",
    "병원장 주사냥",
    "월세추심관 집사장",
    "우주를 긁는 냥라토스",
  ];
  const bosses = bossNames.map((name, i) => ({
    name,
    id: i,
    pattern: i % 5,
    hp: 650 + i * 180,
  }));
  const defaultDaily = () => ({
    walk: 0,
    dungeon: 0,
    star: 0,
    influence: 0,
    work: 0,
    feed: 0,
    gift: 0,
    talk: 0,
    date: 0,
  });
  function stockFor(day, seed = 0) {
    return [0, 1, 2].map(
      (i) =>
        Math.abs(Math.floor(Math.sin(day * 37 + i * 17 + seed) * 10000)) % 3,
    );
  }
  function normalize(s) {
    const prev = s.version || 1;
    const d = {
      introSeen: true,
      outingPending: false,
      version: 3,
      level: 1,
      xp: 0,
      gold: 80,
      diamonds: 0,
      happiness: 80,
      energy: 100,
      cleared: 0,
      weapon: 0,
      armor: 0,
      weaponUp: 0,
      armorUp: 0,
      weapons: [0],
      armors: [0],
      followers: 0,
      liveFollowers: 0,
      day: 1,
      daily: defaultDaily(),
      liveDay: -2,
      loans: [],
      treats: [2, 0, 0],
      toys: [],
      toyBag: {},
      vehicles: [],
      house: 0,
      houses: [0],
      employees: [],
      working: null,
      workLevels: [1, 1, 1],
      staffLevels: [1, 1, 1],
      workDays: [0, 0, 0],
      stocks: {},
      coinHoldings: {},
      buildings: [],
      companies: [],
      feed: [],
      lastLive: null,
      highlights: [],
      bossCleared: false,
      bossKills: [],
      hospital: false,
      expedition: null,
      arcadeSession: null,
      walks: 0,
      dayReport: [],
      romance: null,
      candidate: null,
      stockDay: 0,
      treatStock: [],
      survivalRecords: [],
      discovered: [],
      completionSerial: 0,
      earned: { gold: 0, diamonds: 0 },
      logs: [],
      event: null,
      weather: "sun",
      eventDay: 0,
      costBasis: { stock: {}, coin: {} },
      realized: { stock: 0, coin: 0 },
      dayStart: null,
      previousMarket: null,
      marketStatus: { stock: {}, coin: {} },
    };
    for (const [k, v] of Object.entries(d))
      if (s[k] === undefined) s[k] = structuredClone(v);
    for (const [k, v] of Object.entries(defaultDaily())) s.daily[k] ??= v;
    if (prev < 3) {
      s.toys.forEach((i) => (s.toyBag[i] ??= 1));
      if (s.working !== null) s.daily.work = 1;
      if (s.daily.star || s.liveDay === s.day) s.daily.influence = 1;
    }
    if (s.debt > 0) {
      s.loans.push({ amount: s.debt, due: s.day + 5, source: "기존 대출" });
      s.debt = 0;
    }
    if (s.stockDay !== s.day) {
      s.treatStock = stockFor(s.day, (s.ownerName || "").length);
      s.stockDay = s.day;
    }
    s.market ??= {
      stock: companies.map((c) => c.stock),
      coin: coins.map((c) => c.base),
    };
    for (const type of ["stock", "coin"]) {
      const book = type === "stock" ? s.stocks : s.coinHoldings;
      for (const [i, q] of Object.entries(book))
        if (q && s.costBasis[type][i] === undefined)
          s.costBasis[type][i] = price(s, type, +i) * q;
    }
    syncMarketListings(s);
    if (!s.dayStart) s.dayStart = daySnapshot(s);
    if (s.eventDay !== s.day) rollDay(s);
    s.energy = Math.max(0, Math.min(100, s.energy));
    s.version = 3;
    return s;
  }
  function xpNeeded(l) {
    return 35 + l * 15;
  }
  function gainXP(s, n) {
    s.xp += n;
    let levels = 0;
    while (s.xp >= xpNeeded(s.level)) {
      s.xp -= xpNeeded(s.level);
      s.level++;
      levels++;
    }
    return levels;
  }
  function relationshipBonus(s) {
    return !s.romance
      ? { gold: 0, attack: 0, defense: 0, gift: 0 }
      : s.romance.stage === 3
        ? { gold: 0.3, attack: 6, defense: 4, gift: 50 }
        : s.romance.stage === 2
          ? { gold: 0.15, attack: 3, defense: 2, gift: 20 }
          : s.romance.stage === 1
            ? { gold: 0.08, attack: 1, defense: 1, gift: 0 }
            : { gold: 0, attack: 0, defense: 0, gift: 0 };
  }
  function stats(s) {
    const b = relationshipBonus(s);
    return {
      hp: 80 + (s.level - 1) * 8 + armors[s.armor].hp,
      attack:
        8 +
        (s.level - 1) * 2 +
        weapons[s.weapon].attack +
        s.weaponUp * 2 +
        b.attack,
      defense:
        1 +
        Math.floor((s.level - 1) / 3) +
        armors[s.armor].defense +
        s.armorUp +
        b.defense,
    };
  }
  function fameBonus(s) {
    const n = s.followers + s.liveFollowers;
    return n >= 1000000
      ? 1
      : n >= 100000
        ? 0.5
        : n >= 50000
          ? 0.3
          : n >= 30000
            ? 0.25
            : n >= 10000
              ? 0.2
              : n >= 5000
                ? 0.15
                : n >= 1000
                  ? 0.1
                  : n >= 100
                    ? 0.05
                    : 0;
  }
  function bonus(s) {
    return (
      (1 + fameBonus(s)) *
        (1 + relationshipBonus(s).gold) *
        (s.happiness === 100 ? 1.5 : s.happiness >= 70 ? 1.2 : 1) *
        (1 + houses[s.house].work) -
      1
    );
  }
  function calendar(day) {
    const n = day - 1;
    return {
      year: Math.floor(n / 112) + 1,
      season: ["SPRING", "SUMMER", "FALL", "WINTER"][Math.floor(n / 28) % 4],
      date: (n % 28) + 1,
      weekday: ["일", "월", "화", "수", "목", "금", "토"][n % 7],
    };
  }
  function dateLabel(day) {
    const c = calendar(day);
    return `${c.year}년 ${c.season} ${c.date}일 (${c.weekday})`;
  }
  function log(s, text) {
    s.logs.push({ day: s.day, text: String(text) });
    s.logs = s.logs.slice(-100);
  }
  function daySnapshot(s) {
    return {
      gold: s.gold,
      diamonds: s.diamonds,
      fans: s.followers + s.liveFollowers,
      affection: s.romance?.affection || 0,
    };
  }
  const events = [
    "택배 도착",
    "알고리즘의 선택",
    "집사야 야근해",
    "펫마트 세일",
    "오늘따라 귀여워",
    "고양이 축제",
    "정체불명의 고지서",
    "골목 깡패 등장",
  ];
  function rollDay(s, random = Math.random) {
    s.weather = random() < 0.1 ? "rain" : "sun";
    s.eventDay = s.day;
    s.event =
      random() < 0.4
        ? { id: Math.floor(random() * events.length), resolved: false }
        : null;
    log(
      s,
      `${s.weather === "rain" ? "비 오는 날 ☂" : "맑은 날 ☀"} · ${s.event ? events[s.event.id] : "평온한 하루"}`,
    );
  }
  function eventIs(s, id) {
    return s.event?.id === id;
  }
  function resolveEvent(s, choice) {
    if (!s.event || s.event.resolved) return false;
    const id = s.event.id,
      fee = (id === 7 ? 80 : 30) + s.level * (id === 7 ? 35 : 12);
    if (id === 7) {
      if (choice === "fight") {
        if (s.energy < 50) return false;
        s.energy -= 50;
      } else if (!spend(s, fee)) return false;
    } else if (id === 6) {
      if (choice === "ad") addFollowers(s, "star", 2);
      else if (!spend(s, fee)) return false;
    } else if (id === 0) {
      if (Math.random() < 0.75) s.treats[0]++;
    } else return false;
    s.event.resolved = true;
    log(s, events[id] + " 해결 완료");
    return true;
  }
  function shopPrice(s, item) {
    return Math.round(item.cost * (eventIs(s, 3) ? 0.7 : 1));
  }
  function reward(s, n) {
    const g = Math.floor(n * (1 + bonus(s)) + 1e-8);
    s.gold += g;
    s.earned.gold += g;
    return g;
  }
  function happy(s, n) {
    s.happiness = Math.max(0, Math.min(100, s.happiness + n));
    if (!s.happiness) s.hospital = true;
  }
  function debt(s) {
    return s.loans.reduce((a, l) => a + l.amount, 0);
  }
  function loanLimit(s) {
    return Math.floor((200 + (s.level - 1) * 150) / 2);
  }
  function takeLoan(s, amount, medical = false) {
    if (
      !Number.isInteger(amount) ||
      amount <= 0 ||
      (!medical && debt(s) + amount > loanLimit(s))
    )
      return false;
    s.gold += amount;
    s.loans.push({
      amount,
      due: s.day + 5,
      source: medical ? "병원 긴급 대출" : "생활 대출",
    });
    return true;
  }
  function spend(s, g, d = 0) {
    if (!Number.isFinite(g) || g < 0 || d < 0 || s.gold < g || s.diamonds < d)
      return false;
    s.gold -= g;
    s.diamonds -= d;
    return true;
  }
  function canAct(s) {
    return !s.hospital && !s.expedition && !s.arcadeSession;
  }
  function consume(s, key, limit, energy) {
    if (
      !canAct(s) ||
      s.daily[key] >= limit ||
      s.energy < energy ||
      (key === "dungeon" && s.happiness < 20)
    )
      return false;
    s.daily[key]++;
    s.energy -= energy;
    log(
      s,
      `${{ walk: "유흥", dungeon: "냥서바이벌", work: "근무" }[key] || key} 시작 · 주인 기력 −${energy}`,
    );
    return true;
  }
  function influenceCost(s) {
    return s.daily.influence ? 0 : 25;
  }
  function useInfluence(s, type) {
    const cost = influenceCost(s);
    if (
      !canAct(s) ||
      s.energy < cost ||
      (type === "star" && s.daily.star >= 1) ||
      (type === "live" && s.day - s.liveDay < 3)
    )
      return false;
    s.energy -= cost;
    s.daily.influence = 1;
    if (type === "star") s.daily.star++;
    else s.liveDay = s.day;
    return true;
  }
  function upgradeCost(s, t) {
    return s[t + "Up"] >= 10 ? 0 : Math.round(60 * Math.pow(1.65, s[t + "Up"]));
  }
  function purchase(s, kind, i) {
    const map = {
      weapon: [weapons, "weapons"],
      armor: [armors, "armors"],
      treat: [treats, "treats"],
      toy: [toys, "toys"],
      vehicle: [vehicles, "vehicles"],
      house: [houses, "houses"],
      building: [buildings, "buildings"],
      company: [companies, "companies"],
    };
    if (!map[kind] || !Number.isInteger(i)) return false;
    const [items, key] = map[kind],
      item = items[i];
    if (!item) return false;
    const repeat = ["treat", "toy"].includes(kind);
    if (!repeat && s[key].includes(i)) {
      if (["weapon", "armor", "house"].includes(kind)) s[kind] = i;
      return true;
    }
    if (kind === "treat" && s.treatStock[i] <= 0) return false;
    if (
      !spend(
        s,
        ["weapon", "armor", "treat", "toy", "vehicle"].includes(kind)
          ? shopPrice(s, item)
          : item.cost,
        item.diamond || 0,
      )
    )
      return false;
    if (kind === "treat") {
      s.treats[i]++;
      s.treatStock[i]--;
    } else if (kind === "toy") {
      s.toyBag[i] = (s.toyBag[i] || 0) + 1;
      if (!s.toys.includes(i)) s.toys.push(i);
    } else s[key].push(i);
    if (["weapon", "armor", "house"].includes(kind)) s[kind] = i;
    return true;
  }
  function vehicleBonus(s) {
    return Math.max(0, ...s.vehicles.map((i) => vehicles[i].work));
  }
  function jobUnlocked(s, i) {
    return i === 0 || s.workLevels[i - 1] >= 10;
  }
  function jobPay(s, i, staff = false) {
    const level = (staff ? s.staffLevels : s.workLevels)[i];
    return Math.floor(
      jobs[i].pay *
        (staff ? 5 : 2) *
        (1 + (level - 1) * (staff ? 0.3 : 0.5)) *
        (1 + bonus(s)) *
        (staff ? 1 + houses[s.house].staff : 1 + vehicleBonus(s)) *
        (!staff && eventIs(s, 2) ? 1.3 : 1),
    );
  }
  function promotion(s, i, staff = false) {
    const levels = staff ? s.staffLevels : s.workLevels,
      lv = levels[i];
    if (lv >= 10) return null;
    return {
      cost: Math.round((staff ? jobs[i].hire * 0.4 : 1000 + i * 600) * lv * lv),
      days: staff ? 0 : lv * 2,
    };
  }
  function promote(s, i, staff = false) {
    const p = promotion(s, i, staff);
    if (
      !p ||
      !jobUnlocked(s, i) ||
      (staff && s.staffLevels[i] >= s.workLevels[i]) ||
      (staff && !s.employees.includes(i)) ||
      (!staff && s.workDays[i] < p.days) ||
      !spend(s, p.cost)
    )
      return false;
    (staff ? s.staffLevels : s.workLevels)[i]++;
    return true;
  }
  function startJob(s, i) {
    if (!jobs[i] || !jobUnlocked(s, i) || !consume(s, "work", 1, 50))
      return false;
    s.working = i;
    log(s, `${jobs[i].name} 근무 예약 완료!`);
    return true;
  }
  function hire(s, i) {
    const cost = Math.floor(jobs[i].hire * (1 - houses[s.house].discount));
    if (!jobUnlocked(s, i) || s.employees.includes(i) || !spend(s, cost))
      return false;
    s.employees.push(i);
    return true;
  }
  function meet(s, source, r = Math.random(), typeRoll = Math.random()) {
    s.completionSerial++;
    const chance = source === "walk" ? 0.03 * (eventIs(s, 5) ? 1.3 : 1) : 0.01;
    if (s.romance?.stage === 3 || r >= chance) return null;
    const choices = [0, 1, 2].filter((i) => i !== s.romance?.kind);
    const kind =
      choices[
        Math.min(choices.length - 1, Math.floor(typeRoll * choices.length))
      ];
    if (!s.romance) {
      s.romance = { kind, affection: 0, stage: 0, since: s.day };
      return `${partners[kind].name}를 만났어! 연애 메뉴에서 인사해 줘.`;
    }
    s.candidate = kind;
    return `${partners[kind].name}가 다가왔어. 연애 메뉴에서 갈아타기를 선택할 수 있어.`;
  }
  function affection(s, n) {
    const r = s.romance;
    if (!r) return;
    const cap = r.stage === 0 ? 3 : r.stage === 1 ? 6 : 10;
    r.affection = Math.round(Math.min(cap, r.affection + n) * 100) / 100;
    if (r.stage === 2 && r.affection >= 10) r.stage = 3;
  }
  function feedTreat(s, i, gift = false) {
    if (
      !canAct(s) ||
      !treats[i] ||
      s.treats[i] <= 0 ||
      s.daily[gift ? "gift" : "feed"] >= 1 ||
      (gift && !s.romance)
    )
      return false;
    s.treats[i]--;
    s.daily[gift ? "gift" : "feed"]++;
    if (gift)
      affection(s, treats[i].affection * (s.romance.kind === i ? 1.4 : 1));
    else happy(s, treats[i].happy);
    return true;
  }
  function giftToy(s, i) {
    if (!canAct(s) || !s.romance || !s.toyBag[i] || s.daily.gift >= 1)
      return false;
    s.toyBag[i]--;
    if (!s.toyBag[i]) s.toys = s.toys.filter((n) => n !== i);
    s.daily.gift++;
    affection(s, toys[i].affection);
    return true;
  }
  function talk(s) {
    if (!canAct(s) || !s.romance || s.daily.talk) return false;
    s.daily.talk = 1;
    affection(s, 0.15 * (eventIs(s, 4) ? 1.3 : 1));
    return true;
  }
  const dates = [
    { name: "편의점 앞 벤치", cost: 450, gain: 0.2 },
    { name: "츄르 맛집", cost: 1950, gain: 0.5 },
    { name: "별빛 루프탑", cost: 5400, gain: 1 },
  ];
  function date(s, i) {
    if (
      !canAct(s) ||
      !s.romance ||
      s.daily.date ||
      !dates[i] ||
      !spend(s, dates[i].cost)
    )
      return false;
    s.daily.date = 1;
    affection(s, dates[i].gain * (eventIs(s, 4) ? 1.3 : 1));
    return true;
  }
  function confess(s, proposal = false, r = Math.random()) {
    const p = s.romance;
    if (
      !canAct(s) ||
      !p ||
      p.stage !== (proposal ? 1 : 0) ||
      p.affection < (proposal ? 6 : 3) ||
      s.diamonds < (proposal ? 5 : 1)
    )
      return null;
    s.diamonds -= proposal ? 5 : 1;
    const success = r < 0.5;
    if (success) p.stage = proposal ? 2 : 1;
    return success;
  }
  function switchPartner(s) {
    if (s.candidate === null || s.romance?.stage === 3) return false;
    s.romance = { kind: s.candidate, affection: 0, stage: 0, since: s.day };
    s.candidate = null;
    return true;
  }
  function breakUp(s) {
    if (!s.romance || s.romance.stage === 3) return false;
    s.romance = null;
    s.candidate = null;
    return true;
  }
  function canSleep(s) {
    return s.energy <= 25 && !s.expedition && !s.arcadeSession;
  }
  function nextDay(s) {
    if (!canSleep(s)) return null;
    const dayOpening = s.dayStart || daySnapshot(s);
    syncMarketListings(s);
    const before = {
      gold: s.gold,
      diamonds: s.diamonds,
      energy: s.energy,
      happiness: s.happiness,
    };
    const report = [];
    if (s.working !== null) {
      const i = s.working,
        n = jobPay(s, i);
      s.gold += n;
      s.earned.gold += n;
      s.workDays[i]++;
      report.push(`${jobs[i].name} 일당 +${n} G · 근무 ${s.workDays[i]}일`);
      const event = meet(s, "work");
      if (event) report.push(event);
      s.working = null;
    }
    let income = 0;
    for (const i of s.employees) income += jobPay(s, i, true);
    for (const i of s.buildings) income += buildings[i].income;
    for (const i of s.companies) {
      income += companies[i].income;
      if (listing(s, "stock", i)) {
        report.push(`${companies[i].name} 거래 정지 중 · 주식 지급 보류`);
        continue;
      }
      s.stocks[i] = (s.stocks[i] || 0) + 1;
      s.costBasis.stock[i] = (s.costBasis.stock[i] || 0) + price(s, "stock", i);
      report.push(`${companies[i].name} 주식 +1주`);
    }
    if (income) {
      s.gold += income;
      s.earned.gold += income;
      report.push(`직원·자산 수입 +${income} G`);
    }
    const b = relationshipBonus(s);
    if (b.gift) {
      s.gold += b.gift;
      s.earned.gold += b.gift;
      report.push(`동반자 생활 선물 +${b.gift} G`);
    }
    if (s.romance?.stage === 3) {
      s.treats[0]++;
      report.push("평생의 냥 선물: 참치 츄르 +1");
    }
    s.day++;
    s.previousMarket = structuredClone(s.market);
    for (const type of ["stock", "coin"])
      s.market[type] = s.market[type].map((old, i) => {
        if (listing(s, type, i)) return old;
        const u = Math.random(),
          change = type === "stock" ? u * 0.6 - 0.3 : u * 2.99 - 0.99;
        return Math.max(0, Math.min(1e9, Math.round(old * (1 + change))));
      });
    liquidate(s, report);
    for (const l of s.loans.filter((l) => l.due <= s.day)) {
      const normal = Math.ceil(l.amount * 1.5 - 1e-8),
        late = s.gold < normal;
      const paid = late ? l.amount * 2 : normal;
      s.gold -= paid;
      const text = `${l.source} ${late ? "미상환 이자 100%" : "정상 이자 50%"} · 총 −${paid} G · 대출 종료, 추가 이자 없음`;
      report.push(text);
      log(s, text);
    }
    s.loans = s.loans.filter((l) => l.due > s.day);
    s.energy = 100;
    s.outingPending = false;
    s.daily = defaultDaily();
    s.stockDay = s.day;
    s.treatStock = stockFor(s.day, (s.ownerName || "").length);
    happy(s, houses[s.house].wake);
    report.push(
      `주인 기력 100 · 집 효과 행복도 ${houses[s.house].wake >= 0 ? "+" : ""}${houses[s.house].wake} · 츄르 새 입고`,
    );
    if (s.gold < 0) report.push("잔액이 마이너스여도 계속 활동할 수 있어.");
    const closing = daySnapshot(s);
    s.dayStart = closing;
    rollDay(s);
    report.push(
      `${dateLabel(s.day)} · ${s.weather === "rain" ? "비" : "맑음"} · ${s.event ? events[s.event.id] : "평온한 하루"}`,
    );
    s.dayReport = report;
    s.lastDayDelta = {
      day: s.day,
      gold: s.earned.gold,
      netGold: closing.gold - dayOpening.gold,
      fans: closing.fans - dayOpening.fans,
      affection:
        Math.round((closing.affection - dayOpening.affection) * 100) / 100,
      diamonds: s.earned.diamonds,
      energy: s.energy - before.energy,
      happiness: s.happiness - before.happiness,
    };
    s.earned = { gold: 0, diamonds: 0 };
    return report;
  }
  function park(s, r = Math.random()) {
    if (!consume(s, "walk", 1, 25)) return null;
    s.walks++;
    let text;
    if (r < 0.8) {
      happy(s, 10);
      const diamonds = 1 + (eventIs(s, 5) && Math.random() < 0.3 ? 1 : 0);
      s.diamonds += diamonds;
      s.earned.diamonds += diamonds;
      text = `평범한 산책 · 행복도 +10 · 다이아 +${diamonds}`;
    } else if (r < 0.85) {
      const i = s.walks % toys.length;
      s.toyBag[i] = (s.toyBag[i] || 0) + 1;
      if (!s.toys.includes(i)) s.toys.push(i);
      const extra = eventIs(s, 5) && Math.random() < 0.3 ? 1 : 0;
      if (extra) s.toyBag[i]++;
      text = `${toys[i].name} ${1 + extra}개 발견!`;
    } else if (r < 0.9) {
      const count = 1 + (eventIs(s, 5) && Math.random() < 0.3 ? 1 : 0);
      s.treats[0] += count;
      text = `참치 츄르 ${count}개 발견!`;
    } else {
      const a = Math.max(
          1,
          Math.ceil(s.followers * 0.1 * (eventIs(s, 5) ? 1.3 : 1)),
        ),
        b = Math.max(
          1,
          Math.ceil(s.liveFollowers * 0.1 * (eventIs(s, 5) ? 1.3 : 1)),
        );
      s.followers += a;
      s.liveFollowers += b;
      text = `쓰다듬 받기 · 펫스타 +${a} / Live +${b}명`;
    }
    if (s.weather === "rain") {
      happy(s, -12);
      text += " · 비 오는 공원! 물웅덩이 폴짝 · 행복도 −12";
    }
    if (eventIs(s, 5)) {
      happy(s, 3);
      text += " · 고양이 축제 행복도 보너스 +3";
    }
    const event = meet(s, "walk");
    return text + (event ? " · " + event : "");
  }
  function drive(s) {
    if (
      !s.romance ||
      !s.vehicles.some((i) => vehicles[i].type === "car") ||
      !consume(s, "walk", 1, 25)
    )
      return null;
    s.walks++;
    const luxury = s.vehicles.includes(1),
      plane = s.vehicles.includes(2),
      g = reward(s, 25);
    s.diamonds += 1 + (luxury ? 1 : 0) + (plane ? 5 : 0);
    s.earned.diamonds += 1 + (luxury ? 1 : 0) + (plane ? 5 : 0);
    affection(s, 0.1);
    happy(s, luxury ? 25 : 20);
    const event = meet(s, "walk");
    return (
      `드라이브! +${g} G · 다이아 +${1 + (luxury ? 1 : 0) + (plane ? 5 : 0)} · 호감도 +0.1` +
      (event ? " · " + event : "")
    );
  }
  function addFollowers(s, type, n) {
    n = Math.round(n * (eventIs(s, 1) ? 1.3 : 1));
    const other = type === "star" ? "liveFollowers" : "followers",
      key = type === "star" ? "followers" : "liveFollowers",
      cross = Math.floor(n * 0.2);
    s[key] += n;
    s[other] += cross;
    return cross;
  }
  function hospitalCost(s) {
    return 60 + s.level * 35;
  }
  function heal(s) {
    if (!s.hospital) return null;
    const cost = hospitalCost(s),
      borrow = Math.max(0, cost - s.gold);
    if (borrow) takeLoan(s, borrow, true);
    s.gold -= cost;
    s.hospital = false;
    s.happiness = 30;
    s.expedition = null;
    return { cost, borrow };
  }
  function price(s, type, i) {
    return (
      s.market?.[type]?.[i] ??
      (type === "stock" ? companies[i].stock : coins[i].base)
    );
  }
  function trade(s, type, i, side, qty) {
    if (
      !["stock", "coin"].includes(type) ||
      !["buy", "sell"].includes(side) ||
      !Number.isInteger(qty) ||
      qty < 1 ||
      qty > 1000
    )
      return false;
    const list = type === "stock" ? companies : coins;
    if (!list[i]) return false;
    syncMarketListings(s);
    if (listing(s, type, i)) return false;
    const book = type === "stock" ? s.stocks : s.coinHoldings,
      p = price(s, type, i),
      held = book[i] || 0;
    if (side === "buy") {
      if (p <= 0) return false;
      if (!spend(s, p * qty)) return false;
      book[i] = held + qty;
      s.costBasis[type][i] = (s.costBasis[type][i] || 0) + p * qty;
    } else {
      if (held < qty) return false;
      const cost = ((s.costBasis[type][i] || 0) * qty) / held;
      s.costBasis[type][i] = Math.max(0, (s.costBasis[type][i] || 0) - cost);
      s.realized[type] += Math.floor(p * qty * 0.96) - cost;
      book[i] = held - qty;
      s.gold += Math.floor(p * qty * 0.96);
    }
    return true;
  }
  function listing(s, type, i) {
    return s.marketStatus?.[type]?.[i] || null;
  }
  function syncMarketListings(s, report = []) {
    s.marketStatus ??= { stock: {}, coin: {} };
    for (const type of ["stock", "coin"]) {
      s.marketStatus[type] ??= {};
      const items = type === "stock" ? companies : coins,
        book = type === "stock" ? s.stocks : s.coinHoldings;
      items.forEach((item, i) => {
        let state = listing(s, type, i);
        const announce = (text) => {
          report.push(text);
          log(s, text);
        };
        if (!state && price(s, type, i) <= 1) {
          state = s.marketStatus[type][i] = {
            crashedDay: s.day,
            delistDay: s.day + 1,
            relistDay: s.day + 3,
            delisted: false,
          };
          announce(
            `${item.name} ${price(s, type, i)}G · 거래 정지! ${dateLabel(state.delistDay)} 보유분 상장폐지, ${dateLabel(state.relistDay)} 기본가격 재상장`,
          );
        }
        if (!state) return;
        if (!state.delisted && s.day >= state.delistDay) {
          const qty = book[i] || 0,
            cost = s.costBasis[type][i] || 0;
          s.realized[type] -= cost;
          book[i] = 0;
          s.costBasis[type][i] = 0;
          state.delisted = true;
          announce(
            `${item.name} 상장폐지 · 보유 ${qty}${type === "stock" ? "주" : "개"} 전량 소멸 · 보상 없음`,
          );
        }
        if (s.day >= state.relistDay) {
          s.market[type][i] = type === "stock" ? item.stock : item.base;
          if (s.previousMarket) s.previousMarket[type][i] = s.market[type][i];
          delete s.marketStatus[type][i];
          announce(
            `${item.name} 기본가격 ${s.market[type][i]}G로 재상장 · 새로 매수 가능, 이전 보유분 복구 없음`,
          );
        }
      });
    }
  }
  function liquidate(s, report = []) {
    syncMarketListings(s, report);
  }
  function settleSurvival(s, run) {
    if (!s.expedition || s.expedition.id !== run.id) return null;
    const gold = reward(
        s,
        0.2 *
          Math.max(
            5,
            Math.floor(
              run.time * 0.7 +
                run.kills * 2 +
                run.bossKills.length * 100 +
                (run.bonusGold || 0) +
                (run.won ? 350 : 0),
            ),
          ),
      ),
      xp = Math.floor(run.time * 0.4 + run.kills * 2 + (run.won ? 180 : 0)),
      levels = gainXP(s, xp);
    for (const i of run.bossKills) {
      if (!s.bossKills.includes(i)) s.bossKills.push(i);
      if (i === 0) s.bossCleared = true;
    }
    s.discovered = [...new Set([...s.discovered, ...(run.discovered || [])])];
    s.survivalRecords.unshift({
      day: s.day,
      time: Math.floor(run.time),
      kills: run.kills,
      won: run.won,
      gold,
      xp,
    });
    s.survivalRecords = s.survivalRecords.slice(0, 10);
    s.expedition = null;
    if (!run.won && !run.retreat) {
      s.hospital = true;
      happy(s, -15);
    } else if (run.won) {
      happy(s, -4);
      s.cleared++;
    }
    const encounter = run.won ? meet(s, "dungeon") : null;
    return { gold, xp, levels, encounter };
  }
  function roulette(s, color, bet, r = Math.random()) {
    if (
      !["red", "black", "green"].includes(color) ||
      !Number.isInteger(bet) ||
      bet < 10 ||
      bet > 500 ||
      !spend(s, bet)
    )
      return null;
    const slot = Math.floor(r * 31),
      result = slot === 30 ? "green" : slot % 2 ? "black" : "red",
      won = color === result,
      payout = won ? bet * (color === "green" ? 30 : 2) : 0;
    s.gold += payout;
    s.earned.gold += payout;
    return { slot, color: result, won, payout, bet };
  }
  function slot(s, bet, rolls = [Math.random(), Math.random(), Math.random()]) {
    if (
      !Number.isInteger(bet) ||
      bet < 10 ||
      bet > 500 ||
      rolls.length !== 3 ||
      rolls.some((r) => r < 0 || r >= 1) ||
      !spend(s, bet)
    )
      return null;
    const symbols = rolls.map((r) => Math.floor(r * 5)),
      unique = new Set(symbols).size,
      multiplier = unique === 1 ? 10 : unique === 2 ? 1 : 0,
      payout = bet * multiplier;
    s.gold += payout;
    s.earned.gold += payout;
    return { symbols, multiplier, payout };
  }
  root.PetopiaEngine = {
    calendar,
    dateLabel,
    log,
    events,
    eventIs,
    resolveEvent,
    shopPrice,
    jobUnlocked,
    fameBonus,
    liquidate,
    listing,
    syncMarketListings,
    weapons,
    armors,
    treats,
    toys,
    vehicles,
    houses,
    jobs,
    companies,
    coins,
    buildings,
    partners,
    bosses,
    dates,
    normalize,
    xpNeeded,
    gainXP,
    stats,
    relationshipBonus,
    bonus,
    reward,
    happy,
    debt,
    loanLimit,
    takeLoan,
    spend,
    canAct,
    consume,
    influenceCost,
    useInfluence,
    upgradeCost,
    purchase,
    vehicleBonus,
    jobPay,
    promotion,
    promote,
    startJob,
    hire,
    meet,
    affection,
    feedTreat,
    giftToy,
    talk,
    date,
    confess,
    switchPartner,
    breakUp,
    nextDay,
    canSleep,
    park,
    drive,
    addFollowers,
    hospitalCost,
    heal,
    price,
    trade,
    settleSurvival,
    roulette,
    slot,
  };
})(globalThis);
