// Daybreak: a glass city on a harbor at sunrise.
import {
  TAU, W, H, G, u, time, game, srand, rand, clamp, mkCanvas,
  rect, poly, circ, ell, line, dome, vgrad, hgrad, lgrad, rgrad, windows, soft, beacon,
  Clouds, Flock, Jet, skyline, groundPath, pips, rubble,
} from '../core.js';

const CITY_FX = [0.215, 0.3, 0.385, 0.615, 0.7, 0.785];
const BASE_FX = [0.08, 0.5, 0.92];
// [light, dark] glass tints
const GLASS = [['#8fe9f5', '#1c9ec4'], ['#a9d1ff', '#2f6fdc'], ['#c2b8ff', '#5d54da'], ['#98f2d9', '#1c9c8a'], ['#ffd0a8', '#f0785a'], ['#d7ecff', '#5b8fd0']];

// Deterministic tower layout for city i, shared by the intact art, the ruin and the beacons.
const layouts = [];
function towers(i) {
  if (layouts[i]) return layouts[i];
  const rnd = srand(100 + i * 17), list = [];
  const accent = 4;                                   // one warm tower per city
  let x = -29;
  while (x < 18) {
    const w = 10 + rnd() * 5;
    list.push({ x, w, h: 38 + rnd() * 30, row: 0, type: (rnd() * 5) | 0, hue: [0, 1, 2, 5][(rnd() * 4) | 0], seed: (rnd() * 1e6) | 0 });
    x += w - 1.5 + rnd() * 2;
  }
  const hero = list[1 + ((rnd() * (list.length - 2)) | 0)];
  hero.h = 78 + rnd() * 14; hero.type = 5; hero.w = Math.max(hero.w, 12);
  x = -30 + rnd() * 3;
  let k = 0;
  const warm = (rnd() * 3) | 0;
  while (x < 21) {
    const w = 8 + rnd() * 5;
    list.push({ x, w, h: 13 + rnd() * 20, row: 1, type: (rnd() * 5) | 0, hue: k === warm ? accent : [0, 1, 3, 5][(rnd() * 4) | 0], seed: (rnd() * 1e6) | 0 });
    x += w + 0.5 + rnd() * 2.5; k++;
  }
  return (layouts[i] = list);
}

function shape(c, t, h = t.h) {
  const { x, w } = t;
  c.beginPath();
  switch (t.type) {
    case 1: c.rect(x, 0, w, h * 0.72); c.rect(x + w * 0.16, h * 0.72, w * 0.68, h * 0.28); break;
    case 2: c.moveTo(x, 0); c.lineTo(x + w, 0); c.lineTo(x + w, h); c.lineTo(x, h - w * 0.7); c.closePath(); break;
    case 3: c.rect(x, 0, w, h - w / 2); c.moveTo(x + w, h - w / 2); c.arc(x + w / 2, h - w / 2, w / 2, 0, Math.PI); break;
    case 4: c.moveTo(x, 0); c.lineTo(x + w, 0); c.lineTo(x + w * 0.82, h); c.lineTo(x + w * 0.18, h); c.closePath(); break;
    case 5: c.rect(x, 0, w, h * 0.6); c.rect(x + w * 0.14, h * 0.6, w * 0.72, h * 0.24); c.rect(x + w * 0.3, h * 0.84, w * 0.4, h * 0.16); break;
    default: c.rect(x, 0, w, h);
  }
}

function drawTower(c, t) {
  const [lite, dark] = GLASS[t.hue], { x, w, h } = t;
  c.save();
  shape(c, t);
  c.fillStyle = hgrad(c, x, x + w, [lite, dark]);
  c.fill();
  c.clip();
  c.fillStyle = vgrad(c, 0, h, ['rgba(10,30,80,0.28)', 'rgba(10,30,80,0)', 'rgba(255,255,255,0.22)']);
  c.fillRect(x, 0, w, h);
  windows(c, x + 1, 2, w - 2, h - 3, Math.max(2, Math.round(w / 3.4)), Math.max(2, Math.round(h / 4.4)), ['rgba(255,255,255,0.8)', 'rgba(255,246,210,0.9)'], 'rgba(8,30,70,0.16)', t.seed, 0.5, 0.62, 0.52);
  poly(c, [[x - 1, h * 0.25], [x + w + 1, h * 0.62], [x + w + 1, h * 0.78], [x - 1, h * 0.41]], 'rgba(255,255,255,0.2)');
  rect(c, x, 0, 0.8, h, 'rgba(255,255,255,0.55)');
  c.restore();
  if (t.type === 5) { rect(c, x + w / 2 - 0.4, h, 0.8, 9, dark); }
  else if (t.type === 0 && t.row === 0) { rect(c, x + w * 0.2, h, w * 0.3, 1.6, dark); rect(c, x + w * 0.7, h, 0.6, 5, dark); }
  else if (t.type === 1) rect(c, x + w / 2 - 0.3, h, 0.6, 4, dark);
}

export default {
  id: 'daybreak',
  page: '#9fd0f5', meta: '#5aa9ec',
  footer: ['rgba(232,242,255,0.92)', '#ffffff', 'rgba(255,255,255,0.4)'],
  brand: { fill: '#0b1838', glows: [{ color: 'rgba(255,255,255,0.75)', blur: 16 }] },
  cityFx: CITY_FX, baseFx: BASE_FX, baseH: 28, cityBox: [70, 98, 4],
  prompt: 'Defend the six cities. Each base holds ten interceptors.',
  threat: [232, 30, 104], smart: [255, 132, 0], abm: [22, 78, 204], abmHead: '#ffffff', marker: ['#0b1838', '#1a6cff'],
  blast: ['rgba(255,255,255,0.98)', 'rgba(255,232,120,0.92)', 'rgba(255,128,64,0.62)', 'rgba(255,64,129,0)'],
  fx: { spark: '255,176,70', debris: '60,95,160', smoke: '108,118,140', city: '170,238,255', glow: '255,226,150' },
  ui: { text: '#0b1838', muted: 'rgba(11,24,56,0.62)', panel: 'rgba(255,255,255,0.88)', line: 'rgba(11,24,56,0.12)', ptext: '#0b1838', pmuted: 'rgba(11,24,56,0.64)', accent: '#0a6fe0', warn: '#d81b60', gold: '#b85f00' },

  init() {
    this.far = new Clouds({ n: 5, y0: 0.05, y1: 0.3, s0: 0.45, s1: 0.75, speed: 4, seed: 4, alpha: 0.85, bottom: '#d6e4f5' });
    this.near = new Clouds({ n: 5, y0: 0.14, y1: 0.58, s0: 0.9, s1: 1.5, speed: 9, seed: 9, bottom: '#c9d8ee' });
    this.gulls = new Flock(7, { color: 'rgba(20,30,60,0.7)', y0: 0.3, y1: 0.55, size: 4.5 });
    this.jet = new Jet();
    const rnd = srand(77);
    this.glints = Array.from({ length: 90 }, () => ({ a: rnd() * 2 - 1, d: rnd(), p: rnd() * TAU, s: 1.5 + rnd() * 3 }));
    this.boats = Array.from({ length: 4 }, (_, k) => ({ x: rnd(), d: 0.25 + rnd() * 0.65, v: (0.004 + rnd() * 0.006) * (k % 2 ? 1 : -1), hue: k }));
  },

  layout() {
    this.hz = G - clamp(G * 0.17, 54, 150);          // far shore
    this.sx = W * 0.78;                               // sun
    this.sy = this.hz - 30 * u;
  },

  build() { this.far.build(); this.near.build(); },

  backdrop(o) {
    const { hz, sx, sy } = this;
    o.fillStyle = vgrad(o, 0, hz, [[0, '#4a9ae6'], [0.38, '#84c2f3'], [0.68, '#c7e4f7'], [0.88, '#ffe9d2'], [1, '#ffc9a0']]);
    o.fillRect(0, 0, W, hz + 1);
    o.fillStyle = rgrad(o, sx, sy, 0, 420 * u, [[0, 'rgba(255,250,224,1)'], [0.1, 'rgba(255,238,190,0.85)'], [0.4, 'rgba(255,214,160,0.35)'], [1, 'rgba(255,214,160,0)']]);
    o.fillRect(0, 0, W, hz + 1);
    circ(o, sx, sy, 30 * u, '#fffbe6');

    // Far shore: hazy hills, then two skyline layers with a suspension bridge.
    const [sc, s] = mkCanvas(W, 140 * u);
    const base = 140 * u;
    s.fillStyle = 'rgba(126,160,214,0.45)';
    s.beginPath(); s.moveTo(0, base);
    for (let x = 0; x <= W; x += 6) s.lineTo(x, base - (10 + 16 * Math.sin(x * 0.004 / u + 1) + 9 * Math.sin(x * 0.011 / u)) * u);
    s.lineTo(W, base); s.fill();
    skyline(s, { seed: 5, base, hmin: 12, hmax: 78, wmin: 10, wmax: 26, gap: 5, color: 'rgba(104,142,206,0.55)', deco: (q, x, top, w, h, rnd) => { if (rnd() < 0.25) q.fillRect(x + w / 2 - u, top - 12 * u, 2 * u, 12 * u); } });
    skyline(s, { seed: 8, base, hmin: 8, hmax: 46, wmin: 9, wmax: 22, gap: 4, color: 'rgba(66,104,178,0.62)', deco: (q, x, top, w, h, rnd) => {
      if (rnd() < 0.18) { q.beginPath(); q.moveTo(x, top); q.lineTo(x + w, top - 8 * u); q.lineTo(x + w, top); q.fill(); }
      q.fillStyle = 'rgba(255,240,200,0.5)';
      for (let k = 0; k < 4; k++) if (rnd() < 0.6) q.fillRect(x + (0.2 + rnd() * 0.6) * w, top + (0.15 + rnd() * 0.7) * h, 1.4 * u, 1.4 * u);
    } });
    // bridge
    const bx0 = W * 0.04, bx1 = W * 0.3, by = base - 9 * u, th = 46 * u;
    s.strokeStyle = 'rgba(52,84,150,0.85)'; s.fillStyle = 'rgba(52,84,150,0.85)';
    s.fillRect(bx0 - 30 * u, by, bx1 - bx0 + 60 * u, 2 * u);
    for (const tx of [bx0 + (bx1 - bx0) * 0.25, bx0 + (bx1 - bx0) * 0.75]) { s.fillRect(tx - 2 * u, by - th, 4 * u, th + 9 * u); s.fillRect(tx - 4 * u, by - th * 0.62, 8 * u, 1.6 * u); }
    s.lineWidth = 1.1 * u;
    const t0 = bx0 + (bx1 - bx0) * 0.25, t1 = bx0 + (bx1 - bx0) * 0.75;
    s.beginPath();
    s.moveTo(bx0 - 30 * u, by); s.quadraticCurveTo((bx0 + t0) / 2 - 10 * u, by - 2 * u, t0, by - th);
    s.quadraticCurveTo((t0 + t1) / 2, by + th * 0.75, t1, by - th);
    s.quadraticCurveTo((t1 + bx1) / 2 + 10 * u, by - 2 * u, bx1 + 30 * u, by);
    s.stroke();
    s.lineWidth = 0.5 * u;
    for (let k = 1; k < 14; k++) {
      const p = k / 14, x = t0 + (t1 - t0) * p, yc = by - th + 4 * p * (1 - p) * th * 0.93;
      s.beginPath(); s.moveTo(x, yc); s.lineTo(x, by); s.stroke();
    }
    o.drawImage(sc, 0, hz - base, W, base);

    // Harbor water with the shore mirrored in it.
    o.fillStyle = vgrad(o, hz, G, [[0, '#ffd7b4'], [0.12, '#bfdcf0'], [0.5, '#6fb2e4'], [1, '#3f86c8']]);
    o.fillRect(0, hz, W, G - hz + 2);
    o.save();
    o.globalAlpha = 0.22;
    o.translate(0, hz); o.scale(1, -0.55);
    o.drawImage(sc, 0, -base, W, base);
    o.restore();
    o.fillStyle = vgrad(o, hz, G, ['rgba(255,236,200,0.5)', 'rgba(255,236,200,0)']);
    o.beginPath(); o.moveTo(sx - 24 * u, hz); o.lineTo(sx + 24 * u, hz); o.lineTo(sx + 150 * u, G); o.lineTo(sx - 150 * u, G); o.fill();
    const rnd = srand(31);
    for (let i = 0; i < (W * (G - hz)) / 900; i++) {
      const d = rnd(), y = hz + d * d * (G - hz), x = rnd() * W;
      o.strokeStyle = rnd() < 0.5 ? 'rgba(255,255,255,0.22)' : 'rgba(20,70,140,0.14)';
      o.lineWidth = 1;
      o.beginPath(); o.moveTo(x, y); o.lineTo(x + (8 + 30 * d) * u, y); o.stroke();
    }
    o.fillStyle = 'rgba(255,255,255,0.55)';
    o.fillRect(0, hz - 0.5, W, 1);
  },

  tick(dt) {
    this.far.tick(dt); this.near.tick(dt); this.gulls.tick(dt); this.jet.tick(dt);
    for (const b of this.boats) { b.x += b.v * (0.6 + 0.5 * game.wind) * dt; if (b.x > 1.08) b.x = -0.08; if (b.x < -0.08) b.x = 1.08; }
  },

  ambient(c) {
    const { hz, sx, sy } = this;
    if (!game.lowFx) {                                // slow sun rays
      c.save();
      c.translate(sx, sy);
      c.rotate(time * 0.02);
      for (let k = 0; k < 14; k++) {
        c.rotate(TAU / 14);
        c.fillStyle = lgrad(c, 0, 0, 520 * u, 0, ['rgba(255,244,210,0.16)', 'rgba(255,244,210,0)']);
        c.beginPath(); c.moveTo(34 * u, 0); c.lineTo(520 * u, -34 * u); c.lineTo(520 * u, 34 * u); c.fill();
      }
      c.restore();
    }
    this.jet.draw(c);
    this.far.draw(c);
    this.near.draw(c);
    this.gulls.draw(c);
    // sun glitter on the water
    for (const g of this.glints) {
      const a = Math.sin(time * g.s + g.p);
      if (a < 0.2) continue;
      const y = hz + (0.04 + g.d * 0.96) * (G - hz), x = sx + g.a * (26 + 130 * g.d) * u;
      c.fillStyle = 'rgba(255,255,255,' + (a - 0.2) * 1.1 + ')';
      c.fillRect(x, y, (3 + 9 * g.d) * u, Math.max(1, 1.2 * u));
    }
    // sailboats
    const sails = ['#ffffff', '#ffe9c9', '#ffd0d8', '#e6f3ff'];
    for (const b of this.boats) {
      const y = hz + b.d * (G - hz) * 0.82, s = (0.45 + b.d * 0.9) * u, x = b.x * W, dir = Math.sign(b.v), bob = Math.sin(time * 1.6 + b.d * 9) * 0.8 * s;
      c.save();
      c.translate(x, y + bob);
      c.globalAlpha = 0.25;
      poly(c, [[0, 2 * s], [9 * s * dir, 2 * s], [0, 20 * s]], '#ffffff');
      c.globalAlpha = 1;
      poly(c, [[-9 * s, 0], [10 * s, 0], [7 * s, 3 * s], [-7 * s, 3 * s]], '#f7fbff');
      rect(c, -9 * s, 0, 19 * s, 0.9 * s, '#1c3f7a');
      line(c, 0, 0, 0, -24 * s, '#40506e', Math.max(0.6, 0.7 * s));
      poly(c, [[1 * s * dir, -23 * s], [1 * s * dir, -2 * s], [11 * s * dir, -2 * s]], sails[b.hue % 4]);
      poly(c, [[-1 * s * dir, -19 * s], [-1 * s * dir, -2 * s], [-7 * s * dir, -2 * s]], '#ffffff');
      c.restore();
    }
  },

  foreground(o) {
    const bt = G - this.baseH * u;
    groundPath(o, BASE_FX, bt);
    o.fillStyle = vgrad(o, bt, H, ['#35619f', '#1a3464', '#0d1c3c']);
    o.fill();
    o.save(); o.clip();
    o.fillStyle = 'rgba(255,255,255,0.1)'; o.fillRect(0, G + 5 * u, W, 2 * u);
    o.fillStyle = 'rgba(127,227,255,0.1)';
    for (let x = 0; x < W; x += 34 * u) o.fillRect(x, G + 11 * u, 16 * u, 1.5 * u);
    o.restore();
    groundPath(o, BASE_FX, bt);
    o.strokeStyle = '#8be6ff'; o.lineWidth = 2; o.stroke();
  },

  cityArt(c, i) {
    const list = towers(i);
    ell(c, 0, 0.5, 33, 2.2, 'rgba(10,30,70,0.25)');
    list.filter(t => t.row === 0).forEach(t => drawTower(c, t));
    list.filter(t => t.row === 1).forEach(t => drawTower(c, t));
    const rnd = srand(i * 5 + 2);
    for (let k = 0; k < 6; k++) {                     // street trees
      const x = -28 + k * 11 + rnd() * 4;
      rect(c, x - 0.3, 0, 0.6, 2.4, '#3b4f3a');
      circ(c, x, 4, 2.6, k % 2 ? '#3fae6b' : '#57c27c');
      circ(c, x - 0.7, 4.8, 1.2, 'rgba(255,255,255,0.25)');
    }
  },

  ruinArt(c, i) {
    const rnd = srand(i * 9 + 4);
    rubble(c, '#2f3d5e', '#4a5a80', 28);
    for (const t of towers(i)) {
      if (rnd() < 0.35) continue;
      const sh = t.h * (0.12 + rnd() * 0.2), [, dark] = GLASS[t.hue];
      c.save();
      c.beginPath();
      c.moveTo(t.x, 0); c.lineTo(t.x + t.w, 0);
      c.lineTo(t.x + t.w, sh * (0.5 + rnd() * 0.5)); c.lineTo(t.x + t.w * 0.66, sh * (0.7 + rnd() * 0.4)); c.lineTo(t.x + t.w * 0.4, sh * (0.4 + rnd() * 0.4)); c.lineTo(t.x, sh * (0.7 + rnd() * 0.5));
      c.closePath();
      c.fillStyle = hgrad(c, t.x, t.x + t.w, ['#55617f', '#2a3352']); c.fill();
      c.clip();
      windows(c, t.x + 0.8, 1.5, t.w - 1.6, sh, Math.max(2, Math.round(t.w / 2.6)), Math.max(1, Math.round(sh / 3.6)), 'rgba(255,150,80,0.55)', 'rgba(0,0,0,0.3)', t.seed, 0.18);
      c.restore();
      rect(c, t.x + t.w * 0.3, 0, 0.5, sh * 1.5, dark);
    }
  },

  cityAnim(c, i, city) {
    if (!city.alive) return;
    for (const t of towers(i)) {
      if (t.type !== 5) continue;
      beacon(c, t.x + t.w / 2, t.h + 9.5, 1, '255,60,90', Math.floor(time * 1.6 + i) % 2 === 0);
    }
  },

  base(c, b) {
    if (b.alive) {
      const hot = clamp(1 - (time - b.fireT) * 4, 0, 1);
      soft(c, 0, 2, 22 + hot * 10, '127,227,255', 0.5 + hot * 0.4);
      c.fillStyle = vgrad(c, 0, 10, ['#cfe6ff', '#ffffff']);
      c.beginPath(); c.arc(0, 0, 10, 0, Math.PI); c.closePath(); c.fill();
      rect(c, -10, 0, 20, 1.4, '#3fb8ff');
      rect(c, -1.4, 8, 2.8, 6, '#eaf4ff');
      circ(c, 0, 4.6, 2.4, hot > 0 ? '#ffffff' : '#0a8cff');
    } else {
      poly(c, [[-9, 0], [-4, 5], [0, 2], [4, 6], [9, 0]], '#55617f');
      soft(c, 0, 2, 9, '255,120,70', 0.6 + 0.3 * Math.sin(time * 5));
    }
    pips(c, b, '#8be6ff', 'rgba(139,230,255,0.16)');
  },

  flyer(c, f) {
    const dir = Math.sign(f.vx);
    c.save();
    c.translate(f.x, f.y + Math.sin(time * 3 + f.x * 0.01) * 2 * u);
    c.scale(dir * u, u);
    poly(c, [[20, 0], [8, -4], [-10, -4], [-16, -11], [-19, -11], [-16, 0], [-12, 4], [8, 4]], '#16234a');
    poly(c, [[2, -2], [-8, -16], [-12, -16], [-6, -2]], '#243a72');
    poly(c, [[2, 2], [-8, 16], [-12, 16], [-6, 2]], '#0f1a3a');
    rect(c, 8, -2, 6, 2, '#7fe3ff');
    c.restore();
    beacon(c, f.x - dir * 4 * u, f.y, 1.5 * u, '255,50,80', Math.floor(time * 4) % 2 === 0);
  },
};
