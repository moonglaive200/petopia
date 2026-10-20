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
  const dungeonNames = [
    "먼지의 반란",
    "양말 실종 사건",
    "택배 지하실",
    "냉장고 뒤편",
    "소파 아래 왕국",
    "빨래산 원정",
    "야근의 늪",
    "고지서의 탑",
    "월요일의 문",
    "집주인의 통보",
  ];
  const dungeons = dungeonNames.map((name, i) => ({
    name,
    monster: [
      "먼지 뭉치",
      "양말 도둑",
      "상자 미믹",
      "상한 푸딩",
      "리모컨 군주",
      "빨래 골렘",
      "야근 유령",
      "고지서 기사",
      "월요일 마왕",
      "월세 드래곤",
    ][i],
    hp: 30 + i * 18,
    attack: 7 + i * 2,
    defense: Math.floor(i / 2),
    gold: 30 + i * 14,
    xp: 25 + i * 16,
    recommended: 1 + i * 2,
  }));
  const boss = {
    name: "조커의남자",
    hp: 650,
    attack: 19,
    defense: 3,
    gold: 300,
    xp: 200,
    recommended: 6,
  };
  function normalize(s) {
    const defaults = {
      version: 2,
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
      daily: { walk: 0, dungeon: 0, star: 0, toy: 0 },
      liveDay: -2,
      loans: [],
      treats: [2, 0, 0],
      toys: [],
      vehicles: [],
      house: 0,
      houses: [0],
      employees: [],
      working: null,
      stocks: {},
      coinHoldings: {},
      buildings: [],
      companies: [],
      feed: [],
      lastLive: null,
      highlights: [],
      bossCleared: false,
      hospital: false,
      expedition: null,
      arcadeSession: null,
      walks: 0,
      dayReport: [],
      toyDay: 0,
    };
    for (const [k, v] of Object.entries(defaults))
      if (s[k] === undefined) s[k] = structuredClone(v);
    for (const k of ["walk", "dungeon", "star", "toy"]) s.daily[k] ??= 0;
    if (s.debt > 0) {
      s.loans.push({ amount: s.debt, due: s.day + 5, source: "기존 대출" });
      s.debt = 0;
    }
    s.version = 2;
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
  function stats(s) {
    return {
      hp: 80 + (s.level - 1) * 8 + armors[s.armor].hp,
      attack: 8 + (s.level - 1) * 2 + weapons[s.weapon].attack + s.weaponUp * 2,
      defense:
        1 + Math.floor((s.level - 1) / 3) + armors[s.armor].defense + s.armorUp,
    };
  }
  function bonus(s) {
    const n = s.followers + s.liveFollowers;
    return n >= 10000 ? 0.15 : n >= 1000 ? 0.1 : n >= 100 ? 0.05 : 0;
  }
  function reward(s, n) {
    const g = Math.floor(n * (1 + bonus(s)) + 1e-8);
    s.gold += g;
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
    return 200 + (s.level - 1) * 150;
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
    if (s.gold < g || s.diamonds < d) return false;
    s.gold -= g;
    s.diamonds -= d;
    return true;
  }
  function canAct(s) {
    return !s.hospital && s.working === null && !s.expedition;
  }
  function consume(s, key, limit, energy) {
    if (!canAct(s) || s.daily[key] >= limit || s.energy < energy) return false;
    s.daily[key]++;
    s.energy -= energy;
    return true;
  }
  function upgradeCost(s, t) {
    return [60, 120, 220][s[t + "Up"]] || 0;
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
    if (!map[kind]) return false;
    const [items, key] = map[kind],
      item = items[i];
    if (!item) return false;
    if (kind !== "treat" && s[key].includes(i)) {
      if (["weapon", "armor", "house"].includes(kind)) s[kind] = i;
      return true;
    }
    if (!spend(s, item.cost, item.diamond || 0)) return false;
    if (kind === "treat") s.treats[i]++;
    else s[key].push(i);
    if (["weapon", "armor", "house"].includes(kind)) s[kind] = i;
    return true;
  }
  function nextDay(s) {
    if (s.expedition || s.arcadeSession) return null;
    const report = [];
    const h = houses[s.house];
    if (s.working !== null) {
      const j = jobs[s.working],
        n = Math.floor(j.pay * (1 + h.work));
      s.gold += n;
      report.push(`주인 ${j.name} 일당 +${n} G`);
      s.working = null;
    }
    let income = 0;
    for (const i of s.employees)
      income += Math.floor(jobs[i].pay * (1 + h.staff));
    for (const i of s.buildings) income += buildings[i].income;
    for (const i of s.companies) income += companies[i].income;
    if (income) {
      s.gold += income;
      report.push(`직원·자산 수입 +${income} G`);
    }
    s.day++;
    const due = s.loans.filter((l) => l.due <= s.day);
    for (const l of due) {
      const paid = Math.ceil(l.amount * 1.1 - 1e-8);
      s.gold -= paid;
      report.push(`${l.source} 만기 상환 −${paid} G (이자 10% 포함)`);
    }
    s.loans = s.loans.filter((l) => l.due > s.day);
    s.energy = 100;
    happy(s, -8);
    s.daily = { walk: 0, dungeon: 0, star: 0, toy: 0 };
    report.push("기력 완충 · 행복도 −8 · 일일 횟수 초기화");
    if (s.gold < 0)
      report.push("잔액이 마이너스야. 수입이 생기면 자동으로 메워져.");
    s.dayReport = report;
    return report;
  }
  function park(s, r = Math.random()) {
    if (!consume(s, "walk", 2, 5)) return null;
    s.walks++;
    let text;
    if (r < 0.5) {
      happy(s, 10);
      s.diamonds++;
      text = "평화로운 산책. 행복도 +10 · 다이아 +1";
    } else if (r < 0.7) {
      s.diamonds += 3;
      happy(s, 5);
      text = "썸냥이와 눈이 마주쳤어. 행복도 +5 · 다이아 +3";
    } else if (r < 0.8) {
      happy(s, -12);
      text = "갑자기 비가 왔어! 행복도 −12";
    } else if (r < 0.85) {
      const i = s.walks % toys.length;
      if (!s.toys.includes(i)) s.toys.push(i);
      else s.diamonds++;
      text = `${toys[i].name} 발견! (이미 있으면 다이아 +1)`;
    } else if (r < 0.9) {
      s.treats[0]++;
      text = "참치 츄르 1개를 주웠어!";
    } else {
      const a = Math.max(1, Math.ceil(s.followers * 0.1)),
        b = Math.max(1, Math.ceil(s.liveFollowers * 0.1));
      s.followers += a;
      s.liveFollowers += b;
      text = `쓰다듬 받았어! 펫스타 +${a} / Live +${b} (각 10%, 최소 1명)`;
    }
    return text;
  }
  function drive(s) {
    if (
      !s.vehicles.some((i) => vehicles[i].type === "car") ||
      !consume(s, "walk", 2, 8)
    )
      return null;
    s.walks++;
    const luxury = s.vehicles.includes(1),
      plane = s.vehicles.includes(2);
    const g = reward(s, 25 + (luxury ? 30 : 0));
    s.diamonds += 1 + (plane ? 1 : 0);
    happy(s, 15 + (luxury ? 10 : 5));
    return `${plane ? "비행기까지 동원한 공중" : "창문 열고 동네"} 드라이브! +${g} G · 다이아 +${plane ? 2 : 1} · 행복도 +${luxury ? 25 : 20}`;
  }
  function addFollowers(s, type, n) {
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
    s.happiness = Math.max(55, s.happiness);
    s.energy = Math.max(50, s.energy);
    s.expedition = null;
    return { cost, borrow };
  }
  function price(s, type, i) {
    const list = type === "stock" ? companies : coins,
      item = list[i],
      base = type === "stock" ? item.stock : item.base;
    const wave =
      Math.sin(s.day * 1.73 + i * 2.31) * 0.7 +
      Math.sin(s.day * 0.31 + i) * 0.3;
    return Math.max(
      2,
      Math.round(base * (1 + wave * (type === "stock" ? 0.22 : 0.45))),
    );
  }
  function trade(s, type, i, side, qty) {
    if (!Number.isInteger(qty) || qty < 1 || qty > 1000) return false;
    const list = type === "stock" ? companies : coins;
    if (!list[i]) return false;
    const book = type === "stock" ? s.stocks : s.coinHoldings,
      p = price(s, type, i),
      held = book[i] || 0;
    if (side === "buy") {
      if (!spend(s, p * qty)) return false;
      book[i] = held + qty;
    } else {
      if (held < qty) return false;
      book[i] = held - qty;
      s.gold += Math.floor(p * qty * 0.96);
    }
    return true;
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
    return { symbols, multiplier, payout };
  }
  root.PetopiaEngine = {
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
    dungeons,
    boss,
    normalize,
    xpNeeded,
    gainXP,
    stats,
    bonus,
    reward,
    happy,
    debt,
    loanLimit,
    takeLoan,
    spend,
    canAct,
    consume,
    upgradeCost,
    purchase,
    nextDay,
    park,
    drive,
    addFollowers,
    hospitalCost,
    heal,
    price,
    trade,
    roulette,
    slot,
  };
})(globalThis);
