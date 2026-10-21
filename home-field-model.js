/* Pure movement/geometry shared by keyboard, touch controls and click-to-walk. */
(function (root) {
  const W = 1920,
    H = 1240,
    R = 19;
  function mapFor(house = 0) {
    const outdoor = house < 2,
      objects = [];
    const add = (kind, x, y, w, h, solid = true) => {
      const o = { kind, x, y, w, h, solid };
      objects.push(o);
      return o;
    };
    if (outdoor) {
      for (const [x, y] of [
        [120, 180],
        [340, 140],
        [580, 120],
        [1530, 140],
        [1780, 250],
        [150, 480],
        [1700, 510],
        [110, 850],
        [1780, 920],
        [390, 1120],
        [1470, 1110],
        [740, 1140],
      ])
        add("tree", x, y, 110, 160);
      add("shelter", 820, 260, 240, 155);
      add("bench", 1230, 400, 160, 65);
      add("lamp", 610, 360, 38, 150);
      add("box", 650, 820, 105, 85);
      add("box", 765, 860, 75, 65);
      add("plant", 1280, 850, 70, 70);
      add("bed", 890, 335, 130, 70, false);
      add("pond", 1370, 715, 230, 150);
      add("stone", 330, 680, 100, 62);
    } else {
      add("bed", 320, 330, 250, 165);
      add("sofa", 1240, 330, 280, 145);
      add("table", 890, 360, 160, 115);
      add("shelf", 230, 210, 200, 70);
      add("shelf", 1410, 210, 220, 70);
      add("plant", 690, 240, 75, 90);
      add("plant", 1160, 240, 75, 90);
      add("plant", 290, 870, 80, 95);
      add("plant", 1530, 900, 80, 95);
      add("box", 450, 915, 100, 85);
      add("cushion", 1200, 830, 125, 90);
      add("bowl", 1060, 890, 60, 40, false);
      if (house >= 4) {
        add("fountain", 1350, 635, 165, 150);
        add("plant", 450, 700, 85, 90);
      }
      if (house >= 6) {
        add("throne", 900, 195, 150, 150);
        add("column", 620, 390, 65, 110);
        add("column", 1190, 390, 65, 110);
      }
    }
    const colliders = objects
      .filter((o) => o.solid)
      .map((o) => {
        if (o.kind === "tree")
          return { x: o.x + 39, y: o.y + 123, w: 34, h: 29 };
        if (o.kind === "lamp")
          return { x: o.x + 10, y: o.y + 128, w: 18, h: 20 };
        return { x: o.x + 5, y: o.y + o.h * 0.3, w: o.w - 10, h: o.h * 0.65 };
      });
    const portals = [
      { id: "dungeon", label: "냥서바이벌", x: W - 180, y: 550 },
      { id: "walk", label: "힐링하기", x: W - 180, y: 920 },
      { id: "mart", label: "펫마트", x: 240, y: 990 },
      {
        id: "sleep",
        label: "잠자리",
        x: outdoor ? 950 : 450,
        y: outdoor ? 520 : 580,
      },
    ];
    return {
      house,
      outdoor,
      width: W,
      height: H,
      objects,
      colliders,
      portals,
      spawn: { x: 960, y: 700 },
    };
  }
  class HomeFieldModel {
    constructor(house = 0, saved = null, married = false) {
      this.map = mapFor(house);
      this.player = {
        ...this.map.spawn,
        facing: 0,
        walking: false,
        walkDistance: 0,
      };
      this.target = null;
      if (
        saved?.house === house &&
        Number.isFinite(saved.x) &&
        Number.isFinite(saved.y) &&
        this.free(saved.x, saved.y)
      ) {
        this.player.x = saved.x;
        this.player.y = saved.y;
        this.player.facing =
          Number.isInteger(saved.facing) &&
          saved.facing >= 0 &&
          saved.facing < 4
            ? saved.facing
            : 0;
      }
      this.partner = married
        ? {
            x: this.player.x - 75,
            y: this.player.y + 40,
            facing: 0,
            walking: false,
            walkDistance: 0,
          }
        : null;
      if (this.partner && !this.free(this.partner.x, this.partner.y)) {
        this.partner.x = this.player.x;
        this.partner.y = this.player.y;
      }
    }
    free(x, y) {
      if (
        !Number.isFinite(x) ||
        !Number.isFinite(y) ||
        x < R + 32 ||
        y < R + 100 ||
        x > W - R - 32 ||
        y > H - R - 32
      )
        return false;
      return !this.map.colliders.some((o) => {
        const cx = Math.max(o.x, Math.min(x, o.x + o.w)),
          cy = Math.max(o.y, Math.min(y, o.y + o.h));
        return Math.hypot(x - cx, y - cy) < R;
      });
    }
    move(p, dx, dy) {
      const x = p.x,
        y = p.y;
      if (this.free(p.x + dx, p.y)) p.x += dx;
      if (this.free(p.x, p.y + dy)) p.y += dy;
      const distance = Math.hypot(p.x - x, p.y - y);
      p.walking = distance > 0.01;
      p.walkDistance += distance;
      if (p.walking)
        p.facing =
          Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 2 : 1) : dy > 0 ? 0 : 3;
      return distance;
    }
    step(dt, input = {}) {
      if (!Number.isFinite(dt) || dt <= 0) return false;
      dt = Math.min(dt, 0.05);
      let dx = (Number(input.right) || 0) - (Number(input.left) || 0),
        dy = (Number(input.down) || 0) - (Number(input.up) || 0);
      if (dx || dy) this.target = null;
      else if (this.target) {
        dx = this.target.x - this.player.x;
        dy = this.target.y - this.player.y;
        if (Math.hypot(dx, dy) < 8) {
          this.target = null;
          dx = dy = 0;
        }
      }
      const length = Math.hypot(dx, dy);
      if (length) {
        dx /= length;
        dy /= length;
      }
      const moved = this.move(this.player, dx * 180 * dt, dy * 180 * dt);
      if (length && !moved) this.target = null;
      if (this.partner) {
        const x = this.player.x - this.partner.x,
          y = this.player.y + 22 - this.partner.y,
          d = Math.hypot(x, y);
        if (d > 82)
          this.move(
            this.partner,
            (x / d) * Math.min(210 * dt, d - 76),
            (y / d) * Math.min(210 * dt, d - 76),
          );
        else this.partner.walking = false;
      }
      return moved > 0.01;
    }
    nearest() {
      return (
        this.map.portals.find(
          (o) => Math.hypot(o.x - this.player.x, o.y - this.player.y) < 112,
        ) || null
      );
    }
    snapshot() {
      return {
        house: this.map.house,
        x: this.player.x,
        y: this.player.y,
        facing: this.player.facing,
      };
    }
  }
  root.HomeFieldModel = HomeFieldModel;
})(globalThis);
