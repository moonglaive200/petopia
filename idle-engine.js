/* Real-time idle ledger; independent of game days and the manual survival run. */
(function (root) {
  const E = root.PetopiaEngine,
    CAP_MS = 8 * 60 * 60 * 1000;
  const zones = [
    {
      name: "풀숲 순찰길",
      level: 1,
      power: 15,
      gold: 1,
      xp: 1,
      color: "#2c594b",
    },
    {
      name: "버섯빛 숲",
      level: 5,
      power: 60,
      gold: 3,
      xp: 2,
      color: "#4b3b67",
    },
    {
      name: "별사탕 광산",
      level: 10,
      power: 180,
      gold: 7,
      xp: 4,
      color: "#24445f",
    },
  ];
  const pending = () => ({ gold: 0, xp: 0, kills: 0, ms: 0, capped: false });
  function state(s) {
    return (s.idleHunt ??= {
      running: false,
      area: 0,
      lastAt: null,
      phaseMs: 0,
      goldFraction: 0,
      rates: null,
      pending: pending(),
      totalGold: 0,
      totalXP: 0,
      totalKills: 0,
    });
  }
  function rates(s, area = state(s).area) {
    const zone = zones[area];
    if (!zone) return null;
    const stats = E.stats(s),
      power = stats.attack + stats.defense * 2 + stats.hp * 0.04;
    const cycleMs = Math.max(
      1600,
      Math.min(12000, Math.ceil((8000 * zone.power) / power)),
    );
    const gold = zone.gold * (1 + E.bonus(s));
    return {
      cycleMs,
      gold,
      xp: zone.xp,
      power,
      level: s.level,
      attack: stats.attack,
      defense: stats.defense,
      hp: stats.hp,
      goldHour: (gold * 3600000) / cycleMs,
      xpHour: (zone.xp * 3600000) / cycleMs,
    };
  }
  function settle(s, now = Date.now()) {
    const a = state(s);
    if (
      !Number.isFinite(now) ||
      now < 0 ||
      !a.running ||
      !a.rates ||
      !Number.isFinite(a.lastAt) ||
      now <= a.lastAt
    )
      return null;
    const elapsed = now - a.lastAt,
      ms = Math.min(CAP_MS, elapsed);
    a.lastAt = now; // Drop time beyond the cap once, never claim it on the next refresh.
    const total = a.phaseMs + ms,
      kills = Math.floor(total / a.rates.cycleMs);
    a.phaseMs = total - kills * a.rates.cycleMs;
    const exact = a.goldFraction + kills * a.rates.gold,
      gold = Math.floor(exact + 1e-8);
    a.goldFraction = Math.max(0, exact - gold);
    a.pending.gold += gold;
    a.pending.xp += kills * a.rates.xp;
    a.pending.kills += kills;
    a.pending.ms += ms;
    a.pending.capped ||= elapsed > CAP_MS;
    return {
      ms,
      kills,
      gold,
      xp: kills * a.rates.xp,
      capped: elapsed > CAP_MS,
    };
  }
  function start(s, area = 0, now = Date.now()) {
    if (
      !Number.isInteger(area) ||
      !zones[area] ||
      s.level < zones[area].level ||
      !Number.isFinite(now) ||
      now < 0
    )
      return false;
    const a = state(s);
    settle(s, now);
    const progress = a.rates ? a.phaseMs / a.rates.cycleMs : 0;
    a.area = area;
    a.rates = rates(s, area);
    a.phaseMs = progress * a.rates.cycleMs;
    a.lastAt = Math.max(a.lastAt ?? now, now);
    a.running = true;
    return true;
  }
  function stop(s, now = Date.now()) {
    const a = state(s);
    if (!Number.isFinite(now) || now < 0 || !a.running) return false;
    settle(s, now);
    a.running = false;
    return true;
  }
  function claim(s, now = Date.now(), writeLog = true) {
    if (!Number.isFinite(now) || now < 0) return null;
    settle(s, now);
    const a = state(s),
      p = a.pending;
    if (!p.kills && !p.gold && !p.xp) return null;
    a.pending = pending(); // Consume before applying rewards; the next call cannot pay twice.
    s.gold += p.gold;
    s.earned.gold += p.gold;
    const levels = E.gainXP(s, p.xp);
    a.totalGold += p.gold;
    a.totalXP += p.xp;
    a.totalKills += p.kills;
    if (writeLog)
      E.log(
        s,
        `춘배 원정대 정산 · ${p.kills}마리 · +${p.gold} G · +${p.xp} XP${p.capped ? " · 최대 8시간 적용" : ""}`,
      );
    return { ...p, levels };
  }
  Object.assign(E, {
    idleZones: zones,
    idleCapMs: CAP_MS,
    idleState: state,
    idleRates: rates,
    settleIdle: settle,
    startIdle: start,
    stopIdle: stop,
    claimIdle: claim,
  });
})(globalThis);
