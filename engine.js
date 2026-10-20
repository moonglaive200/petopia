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
  // v3 catalogs and rules. Existing item indices remain stable for old saves.
  treats.forEach((t, i) =>
    Object.assign(t, {
      cost: [100, 500, 1500][i],
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
      cost: ([90, 180, 350][i] || 400 + (i - 3) * 180) * 3,
      diamond: i === 2 ? 4 : i > 6 ? i - 6 : 0,
      affection: 0.2 + i * 0.08,
    })),
  );
  vehicles.forEach((v, i) => {
    v.cost *= 10;
    v.work = [0.1, 0.15, 0.25][i];
    v.text += ` · 주인 일당 +${v.work * 100}% (최고 효과만 적용)`;
  });
  houses.forEach((h, i) => {
    h.cost *= 10;
    h.wake = [-10, -5, 0, 3, 6, 9, 12][i];
    h.energy = 0;
  });
  houses[0].name = "집사랑 노숙 중";
  jobs.forEach((j) => {
    j.hire *= 10;
    j.cost = 50;
  });
  buildings.forEach((b) => (b.cost *= 10));
  companies.forEach((c) => (c.cost *= 10));
  const partners = [
    { name: "치즈냥이", row: 0, likes: 0 },
    { name: "턱시도냥이", row: 1, likes: 1 },
    { name: "흰색냥이", row: 2, likes: 2 },
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
  function bonus(s) {
    const n = s.followers + s.liveFollowers;
    return (
      (n >= 10000 ? 0.15 : n >= 1000 ? 0.1 : n >= 100 ? 0.05 : 0) +
      relationshipBonus(s).gold
    );
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
    if (!canAct(s) || s.daily[key] >= limit || s.energy < energy) return false;
    s.daily[key]++;
    s.energy -= energy;
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
    if (!spend(s, item.cost, item.diamond || 0)) return false;
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
  function jobPay(s, i, staff = false) {
    const level = (staff ? s.staffLevels : s.workLevels)[i],
      h = houses[s.house],
      base = jobs[i].pay * (1 + (level - 1) * (staff ? 0.3 : 0.5));
    return Math.floor(
      base *
        (1 +
          (staff ? h.staff : h.work + vehicleBonus(s)) +
          relationshipBonus(s).gold),
    );
  }
  function promotion(s, i, staff = false) {
    const levels = staff ? s.staffLevels : s.workLevels,
      lv = levels[i];
    if (lv >= 10) return null;
    return {
      cost: Math.round((staff ? jobs[i].hire * 0.4 : 100 + i * 60) * lv * lv),
      days: staff ? 0 : lv * 2,
    };
  }
  function promote(s, i, staff = false) {
    const p = promotion(s, i, staff);
    if (
      !p ||
      (staff && !s.employees.includes(i)) ||
      (!staff && s.workDays[i] < p.days) ||
      !spend(s, p.cost)
    )
      return false;
    (staff ? s.staffLevels : s.workLevels)[i]++;
    return true;
  }
  function startJob(s, i) {
    if (!jobs[i] || !consume(s, "work", 1, 50)) return false;
    s.working = i;
    return true;
  }
  function hire(s, i) {
    const cost = Math.floor(jobs[i].hire * (1 - houses[s.house].discount));
    if (s.employees.includes(i) || !spend(s, cost)) return false;
    s.employees.push(i);
    return true;
  }
  function meet(s, source, r = Math.random(), typeRoll = Math.random()) {
    s.completionSerial++;
    const chance = source === "walk" ? 0.03 : 0.01;
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
    affection(s, 0.15);
    return true;
  }
  const dates = [
    { name: "편의점 앞 벤치", cost: 150, gain: 0.2 },
    { name: "츄르 맛집", cost: 650, gain: 0.5 },
    { name: "별빛 루프탑", cost: 1800, gain: 1 },
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
    affection(s, dates[i].gain);
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
  function nextDay(s) {
    if (s.expedition || s.arcadeSession) return null;
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
      s.stocks[i] = (s.stocks[i] || 0) + 1;
      report.push(`${companies[i].name} 주식 +1주`);
    }
    if (income) {
      s.gold += income;
      report.push(`직원·자산 수입 +${income} G`);
    }
    const b = relationshipBonus(s);
    if (b.gift) {
      s.gold += b.gift;
      report.push(`동반자 생활 선물 +${b.gift} G`);
    }
    if (s.romance?.stage === 3) {
      s.treats[0]++;
      report.push("평생의 냥 선물: 참치 츄르 +1");
    }
    s.day++;
    for (const type of ["stock", "coin"])
      s.market[type] = s.market[type].map((old, i) => {
        const r =
          (Math.sin(s.day * 73 + i * 39 + (type === "coin" ? 91 : 0)) *
            43758.5453) %
          1;
        const u = r - Math.floor(r),
          change = type === "stock" ? u * 0.6 - 0.3 : u * 2.4 - 0.9;
        return Math.max(
          Math.max(1, Math.ceil(old * (type === "stock" ? 0.7 : 0.1))),
          Math.min(
            Math.floor(old * (type === "stock" ? 1.3 : 2.5)),
            1e9,
            Math.round(old * (1 + change)),
          ),
        );
      });
    for (const l of s.loans.filter((l) => l.due <= s.day)) {
      const paid = Math.ceil(l.amount * 1.1 - 1e-8);
      s.gold -= paid;
      report.push(`${l.source} 상환 −${paid} G`);
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
    s.dayReport = report;
    s.lastDayDelta = {
      day: s.day,
      gold: s.gold - before.gold,
      diamonds: s.diamonds - before.diamonds,
      energy: s.energy - before.energy,
      happiness: s.happiness - before.happiness,
    };
    return report;
  }
  function park(s, r = Math.random()) {
    if (!consume(s, "walk", 1, 25)) return null;
    s.walks++;
    let text;
    if (r < 0.7) {
      happy(s, 10);
      s.diamonds++;
      text = "평범한 산책 · 행복도 +10 · 다이아 +1";
    } else if (r < 0.8) {
      happy(s, -12);
      text = "비가 왔어! 행복도 −12";
    } else if (r < 0.85) {
      const i = s.walks % toys.length;
      s.toyBag[i] = (s.toyBag[i] || 0) + 1;
      if (!s.toys.includes(i)) s.toys.push(i);
      text = `${toys[i].name} 발견!`;
    } else if (r < 0.9) {
      s.treats[0]++;
      text = "참치 츄르 1개 발견!";
    } else {
      const a = Math.max(1, Math.ceil(s.followers * 0.1)),
        b = Math.max(1, Math.ceil(s.liveFollowers * 0.1));
      s.followers += a;
      s.liveFollowers += b;
      text = `쓰다듬 받기 · 펫스타 +${a} / Live +${b}명`;
    }
    const event = meet(s, "walk");
    return text + (event ? " · " + event : "");
  }
  function drive(s) {
    if (
      !s.vehicles.some((i) => vehicles[i].type === "car") ||
      !consume(s, "walk", 1, 25)
    )
      return null;
    s.walks++;
    const luxury = s.vehicles.includes(1),
      plane = s.vehicles.includes(2),
      g = reward(s, 25 + (luxury ? 30 : 0));
    s.diamonds += 1 + (plane ? 1 : 0);
    happy(s, luxury ? 25 : 20);
    const event = meet(s, "walk");
    return (
      `드라이브! +${g} G · 다이아 +${plane ? 2 : 1}` +
      (event ? " · " + event : "")
    );
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
  function settleSurvival(s, run) {
    if (!s.expedition || s.expedition.id !== run.id) return null;
    const gold = reward(
        s,
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
