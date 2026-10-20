# Petopia · 춘배와 집사의 이상한 하루

A static HTML / CSS / JavaScript pixel browser game. No npm install, backend, login, or paid assets required.

## Run

```sh
cd /workspace/petopia
python -m http.server 8000
```

Use a browser on the server address, or publish the repository's `main` branch root with GitHub Pages. A static web server is recommended for consistent iframe/audio behavior. Saves belong to the current browser and origin. Settings includes JSON save export/import and lobby background selection.

## Main loop

Choose one of three independent slots, enter a 1–12 character owner name, then choose 춘배. Names are saved per slot; existing saves continue directly. 오레오 is locked as under development. 춘배 appears above nine activity menus. The information bar shows level, attack/defense, happiness, fame, gold and diamonds.

**Sleep** advances the in-game day; real-world time does not advance days. A new day restores energy to 100, lowers happiness by 8, pays jobs and assets, and settles due loans. Daily limits: Petstar 1 post, Live once every 3 days, walks 2 outings, dungeons 5 entries (normal and boss combined). Arcade/casino entry uses one outing; several games can be played during that visit. Activity restrictions and all results are saved immediately.

### Combat and health

- 10 normal dungeon tiers, unlocked sequentially. Three enemies per run with individual health bars. First-clear gold/XP rewards doubled.
- WASD / arrows: move; J / click: attack; Space: dodge; P: pause. Touch controls are included. Tab blur automatically pauses combat.
- Boss: **조커의남자**, 650 HP, recommended level 6+, card fan / telegraphed charge / roulette hazard circles. Stronger patterns below half health. Defeating it unlocks the casino.
- Death or happiness reaching 0 requires **펫병원**. Treatment costs `60 + level × 35 G` and restores happiness to at least 55 and energy to at least 50. Insufficient funds trigger a five-day emergency loan even above the ordinary credit limit.
- Refreshing in an unfinished dungeon sends the pet to hospital; manually retreating consumes the entry and lowers happiness by 5. Gold and XP already owned are preserved.

### Petmart and collection

- **펫대장간**: 3 weapons and 3 armors; permanent slot upgrades +3 max, costs 60/120/220 G. Upgrade bonuses survive equipment switching. Toy shelf included.
- **츄르코너**: tuna, salmon, premium churu, with different prices/happiness gains. No generic snack duplicates.
- **펫오토**: cheap car (drive unlock), luxury car (extra drive gold/happiness), aircraft (extra drive diamond; a car is still required to unlock driving).
- **장난감**: collected toys can be used twice a day for happiness; churu inventory can be fed freely when the pet is healthy.

### Walks and minigames

- **Park**: 50% happiness +10/diamond +1; 20% meet a crush/diamond +3/happiness +5; 10% rain/happiness −12; 5% toy; 5% churu; 10% petting/both follower counts +10% (minimum 1). Duplicate toy finds become one diamond.
- **방앗간**: neon arcade. Claw machine (20 G/energy 5, exact-center catch guaranteed), 4-key rhythm game (15 G/energy 5), and the supplied cat-adapted HEX FINALE (15 G/energy 5). Claw rewards diamonds, toys or churu; rhythm/HEX diamonds depend on performance.
- **Drive**: car required; base gold, happiness and diamonds, improved by vehicles.
- **Casino**: boss unlock required. Gold only. Roulette has 15 red / 15 black / 1 green; total payout 2x/2x/30x. Slots have five equally likely symbols: 3 matches 10x, 2 matches return the stake, otherwise 0 (88% expected return). Stakes 10–500 G, payouts include the stake. Casino does not award diamonds.
- Diamonds are earned only through walks or minigames. They buy premium churu, special toys and vehicles; they cannot be borrowed or traded in the financial markets.

### Social, work and bank

- **Petstar**: daily topic, trending tag, possession-gated themes, persistent feed and comments. Previous Live highlights give a small boost.
- **Pet Live**: topic choice, 3 interactive incidents, viewers/donations, saved highlights, sponsorships at 300 Live followers. Direct follower gains cross over to the other service at 20%, rounded down, without recursive crossover.
- Combined fame adds 5%/10%/15% to activity gold at 100/1,000/10,000 followers.
- **Work**: construction, office, churu lab. Direct jobs lock other activities until sleep and pay modest daily wages. Expensive employees work independently, one per job.
- **Bank → loans**: limit `200 + (level−1) × 150 G`, due in five days, 10% interest, interest-free early repayment. Maturity settles automatically even into a negative gold balance; no bankruptcy/game-over. Emergency medical loans share the loan ledger.
- **Bank → spending**: ten matching stock/company names; 3 coins; 3 buildings; company acquisitions. Daily deterministic quotes and a 4% sale fee. Acquired buildings/companies pay passive income each new day.
- **Bank → housing**: default room + 6 homes, from cardboard studio to space penthouse. Current home changes the room background and work/employee perks. Previously purchased homes can be reselected; effects do not stack.

## Assets and limits

See [ASSETS.md](ASSETS.md) and `licenses/` for audio/font provenance. All distributed assets load locally. The user-provided village illustration is included as the shared default lobby background. Settings can override it for this browser or restore the default.

This is a playable single-player prototype; saving uses localStorage, not a server economy or anti-cheat system. Numeric balance is centralized in `engine.js` and can be tuned after playtesting. Existing v1 slots migrate automatically; old debt becomes a five-day loan.

## Validation

```sh
node tests/engine.test.cjs
# With the web server running and Python Playwright + Chromium installed:
python tests/browser_smoke.py
```

The engine suite exercises migration, day limits, jobs, debt/negative balances, medical loans, all park outcomes, unlocks, investments, expected slot payouts, roulette odds, dodge/movement, all ten combat tiers, and a recommended-level boss clear. Browser checks exercise real navigation, saves, daily limits, live events, purchases, investments, medical recovery, each minigame, mobile overflow, combat controls and pause/reload recovery. Tests use an isolated browser profile and do not alter player saves.
