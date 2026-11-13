// Monument: "Z9 INNOVATION" stands across the bottom as a neon skyline at dusk.
// The letters ARE the city. Z, O and N launch the interceptors; the other nine are what you defend,
// and each one collapses into a dark stump when it is hit.
import {
  TAU, W, H, G, u, dpr, time, game, srand, rand, clamp, lerpHex, hexRgb, mkCanvas,
  rect, poly, circ, vgrad, hgrad, lgrad, rgrad, soft, beacon,
  Clouds, lensCloudSprite, makeStars, drawStars, skyline,
} from '../core.js';

const WORD = 'Z9 INNOVATION';
const FONT = '"Archivo Black", "Arial Black", Impact, sans-serif';
// Advance widths of Archivo Black, in em, so the layout is right even before the font arrives.
const ADV = { Z: 0.722, 9: 0.667, ' ': 0.33, I: 0.389, N: 0.833, O: 0.833, V: 0.778, A: 0.778, T: 0.722 };
const CAP = 0.703, TRACK = 0.02;
const CITY_SLOTS = [1, 3, 4, 5, 7, 8, 9, 10, 11];
const BASE_SLOTS = [0, 6, 12];
const NEON = ['#22e3ff', '#4d8dff', '#a45bff', '#ff4fb0', '#ff8a4c', '#ffd24c'];

export default {
  id: 'monument',
  page: '#0b1030', meta: '#0b1030',
  footer: ['rgba(226,224,255,0.9)', '#ffffff', 'rgba(255,255,255,0.35)'],
  footerPad: 16,
  brand: { fill: '#ffffff', pad: 46, glows: [{ color: 'rgba(60,220,255,0.95)', blur: 20 }, { color: 'rgba(255,70,170,0.7)', blur: 40 }] },
  cityFx: CITY_SLOTS.map(k => k / 13), baseFx: BASE_SLOTS.map(k => k / 13), cityScale: false,
  cityLabel: 'LETTERS', cityOne: 'LETTER',
  prompt: 'Defend the letters. Z, O and N launch the interceptors.',
  threat: [255, 64, 120], smart: [255, 196, 60], abm: [70, 230, 255], abmHead: '#ffffff', threatAlpha: 0.6, abmAlpha: 0.9, marker: ['#ffffff', '#22e3ff'],
  blast: ['rgba(255,255,255,1)', 'rgba(120,240,255,0.9)', 'rgba(255,70,190,0.6)', 'rgba(120,60,255,0)'],
  groundBlast: ['rgba(255,255,255,1)', 'rgba(255,190,120,0.9)', 'rgba(255,70,120,0.6)', 'rgba(160,40,200,0)'],
  fx: { spark: '255,170,220', debris: '120,200,255', smoke: '70,50,110', haze: '120,90,170', city: '255,210,120', glow: '140,200,255', ring: '160,240,255', add: true, flash: '255,200,240' },
  ui: { text: '#f4f2ff', muted: 'rgba(244,242,255,0.72)', panel: 'rgba(14,12,44,0.86)', line: 'rgba(110,210,255,0.4)', ptext: '#f4f2ff', pmuted: 'rgba(244,242,255,0.74)', accent: '#4fe3ff', warn: '#ff5a8a', gold: '#ffc45c', veil: 'rgba(5,5,20,0.5)' },

  init() {
    this.stars = makeStars(170, 11, 0.62);
    this.clouds = new Clouds({ n: 6, y0: 0.34, y1: 0.7, s0: 0.7, s1: 1.5, speed: 3, seed: 6, alpha: 0.5, w: 320, h: 64, make: (seed, w, h) => lensCloudSprite(seed, w, h, '#ff9ab8', '#5b2c94') });
    const rnd = srand(3);
    this.traffic = Array.from({ length: 22 }, (_, k) => ({ x: rnd(), lane: k % 3, v: (0.03 + rnd() * 0.04) * (k % 2 ? 1 : -1) }));
    this.meteor = { t: 6, x: 0, y: 0, life: 0 };
  },

  hue(k) { return lerpHex(NEON, k / 12); },

  layout() {
    const total = [...WORD].reduce((s, ch) => s + ADV[ch], 0) + TRACK * 12;
    this.fs = Math.min((0.94 * W) / total, (G * 0.26) / CAP);
    this.capH = this.fs * CAP;
    this.depth = Math.max(3, this.capH * 0.1);
    this.pos = []; this.wid = [];
    let x = (W - total * this.fs) / 2;
    for (const ch of WORD) { const w = ADV[ch] * this.fs; this.pos.push(x + w / 2); this.wid.push(w); x += w + TRACK * this.fs; }
    this.spr = null;
  },
  fontsReady() { this.spr = null; },

  cityX(i) { return this.pos[CITY_SLOTS[i]]; },
  baseX(i) { return this.pos[BASE_SLOTS[i]]; },
  baseTop() { return G - this.capH - 2 * u; },
  cityHitY() { return G - this.capH * 0.62; },
  cityHalf() { return this.fs * 0.36; },
  baseHalf() { return this.fs * 0.4; },
  muzzle(b) { return [this.pos[BASE_SLOTS[b.i]], G - this.capH - 6 * u]; },

  // One letter as a tower: extruded sides, a glass face full of lit windows, and a neon outline.
  letter(k) {
    const ch = WORD[k], { fs, capH, depth: d } = this, w = this.wid[k], hue = this.hue(k), rgb = hexRgb(hue).join(',');
    const pad = Math.ceil(28 * u) + 2, sw = w + pad * 2 + d * 0.8, sh = capH + pad * 2 + d * 0.7;
    const ox = pad, oy = pad + d * 0.7 + capH, font = fs + 'px ' + FONT;
    const [mc, m] = mkCanvas(sw, sh);
    m.font = font; m.fillStyle = '#fff'; m.fillText(ch, ox, oy);

    const [cv, c] = mkCanvas(sw, sh);
    c.font = font; c.lineJoin = 'round';
    const steps = Math.ceil(d);
    for (let s = steps; s >= 1; s--) {                    // sides, darker toward the back
      const t = s / steps;
      c.fillStyle = lerpHex(['#3a2a78', '#0a0820'], t);
      c.fillText(ch, ox + t * d * 0.8, oy - t * d * 0.7);
    }
    const [fc, f] = mkCanvas(sw, sh);                     // the face
    f.fillStyle = vgrad(f, oy - capH, oy, ['#232a66', '#141436', '#2a1248']);
    f.fillRect(0, 0, sw, sh);
    const rnd = srand(k * 31 + 7), cell = Math.max(3.2, capH / 15);
    for (let y = oy - capH + cell * 0.45; y < oy - cell * 0.5; y += cell) {
      for (let x = ox; x < ox + w; x += cell * 0.86) {
        const r = rnd();
        if (r < 0.44) {
          f.fillStyle = r < 0.2 ? 'rgba(255,220,140,0.95)' : r < 0.32 ? 'rgba(' + rgb + ',0.95)' : 'rgba(200,244,255,0.92)';
          f.fillRect(x + cell * 0.16, y + cell * 0.22, cell * 0.5, cell * 0.52);
        } else if (r < 0.75) { f.fillStyle = 'rgba(255,255,255,0.06)'; f.fillRect(x + cell * 0.16, y + cell * 0.22, cell * 0.5, cell * 0.52); }
      }
      f.fillStyle = 'rgba(0,0,0,0.3)'; f.fillRect(0, y - 0.5, sw, 1);
    }
    f.fillStyle = lgrad(f, ox, oy - capH, ox + w, oy, ['rgba(255,255,255,0.2)', 'rgba(255,255,255,0)', 'rgba(255,255,255,0.07)']);
    f.fillRect(0, 0, sw, sh);
    f.fillStyle = vgrad(f, oy - capH * 0.3, oy, ['rgba(255,120,150,0)', 'rgba(255,120,150,0.28)']);   // sunset bounce
    f.fillRect(0, oy - capH * 0.3, sw, capH * 0.3);
    f.globalCompositeOperation = 'destination-in';
    f.drawImage(mc, 0, 0, sw, sh);
    c.drawImage(fc, 0, 0, sw, sh);

    c.shadowColor = hue; c.shadowBlur = 12 * u * dpr;     // neon tube along the edges
    c.strokeStyle = hue; c.lineWidth = Math.max(1.6, 2.3 * u);
    c.strokeText(ch, ox, oy); c.strokeText(ch, ox, oy);
    c.shadowBlur = 0; c.shadowColor = 'transparent';
    c.strokeStyle = 'rgba(255,255,255,0.9)'; c.lineWidth = Math.max(0.7, 0.8 * u);
    c.strokeText(ch, ox, oy);

    const [gc, g] = mkCanvas(sw, sh);                     // wide halo, pulsed each frame
    g.font = font; g.lineJoin = 'round';
    g.shadowColor = hue; g.shadowBlur = 24 * u * dpr; g.strokeStyle = hue; g.lineWidth = Math.max(2, 3 * u);
    g.strokeText(ch, ox, oy);

    const [rc, r] = mkCanvas(sw, sh);                     // the stump left after a hit
    r.save();
    r.beginPath(); r.moveTo(0, sh);
    const cut = oy - capH * (0.26 + rnd() * 0.12);
    for (let i = 0; i <= 9; i++) r.lineTo((i / 9) * sw, cut + (rnd() - 0.5) * capH * 0.24);
    r.lineTo(sw, sh); r.closePath(); r.clip();
    r.drawImage(cv, 0, 0, sw, sh);
    r.globalCompositeOperation = 'source-atop';
    r.fillStyle = 'rgba(8,5,22,0.72)'; r.fillRect(0, 0, sw, sh);
    r.restore();
    for (let i = 0; i < 6; i++) { r.fillStyle = i % 2 ? '#1a1440' : '#2a1f5a'; const bs = capH * (0.05 + rnd() * 0.07); r.fillRect(ox + rnd() * (w - bs), oy - bs * (0.6 + rnd() * 0.6), bs, bs); }

    const meta = { w: sw, h: sh, ax: pad + w / 2, ay: oy };
    return { alive: { c: cv, ...meta }, ruin: { c: rc, ...meta }, glow: { c: gc, ...meta }, hue, rgb };
  },
  sprites() {
    if (!this.spr) this.spr = [...WORD].map((ch, k) => (ch === ' ' ? null : this.letter(k)));
    return this.spr;
  },
  citySprite(i, alive) { const s = this.sprites()[CITY_SLOTS[i]]; return alive ? s.alive : s.ruin; },
  baseSprite(i, alive) { const s = this.sprites()[BASE_SLOTS[i]]; return alive ? s.alive : s.ruin; },

  build() { this.clouds.build(); },

  backdrop(o) {
    o.fillStyle = vgrad(o, 0, G, [[0, '#060a22'], [0.3, '#151349'], [0.55, '#3d1b74'], [0.74, '#8f2b8c'], [0.9, '#ff5b7c'], [1, '#ffb46c']]);
    o.fillRect(0, 0, W, H);
    const sx = W / 2, sy = G + 24 * u, sr = Math.min(W * 0.2, G * 0.4);
    this.sun = [sx, sy, sr];
    o.fillStyle = rgrad(o, sx, sy, sr * 0.6, sr * 2.4, [[0, 'rgba(255,214,150,0.75)'], [0.4, 'rgba(255,110,130,0.3)'], [1, 'rgba(255,110,130,0)']]);
    o.fillRect(0, 0, W, G);
    o.save();
    o.beginPath(); o.arc(sx, sy, sr, Math.PI, 0); o.clip();
    o.fillStyle = vgrad(o, sy - sr, sy, ['#fff6b0', '#ffc04f', '#ff6f8a', '#ff4f9a']);
    o.fillRect(sx - sr, sy - sr, sr * 2, sr);
    for (let i = 0; i < 8; i++) {                         // bands of sky cut through the low sun
      const y = sy - sr * 0.58 + i * sr * 0.085;
      o.fillStyle = 'rgba(124,34,126,0.62)'; o.fillRect(sx - sr, y, sr * 2, (1 + i * 0.85) * u);
    }
    o.restore();
    // far city against the afterglow
    skyline(o, { seed: 9, base: G, hmin: 26, hmax: 120, wmin: 14, wmax: 34, gap: 6, color: 'rgba(60,24,100,0.55)', deco: (q, x, top, w, h, rnd) => { if (rnd() < 0.2) q.fillRect(x + w / 2 - u, top - 18 * u, 2 * u, 18 * u); } });
    skyline(o, { seed: 4, base: G, hmin: 14, hmax: 70, wmin: 12, wmax: 28, gap: 4, color: 'rgba(30,14,64,0.82)', deco: (q, x, top, w, h, rnd) => {
      for (let k = 0; k < 8; k++) if (rnd() < 0.55) { q.fillStyle = rnd() < 0.6 ? 'rgba(255,214,130,0.7)' : 'rgba(120,230,255,0.7)'; q.fillRect(x + (0.12 + rnd() * 0.76) * w, top + (0.08 + rnd() * 0.84) * h, 1.5 * u, 1.5 * u); }
    } });
    o.fillStyle = vgrad(o, G - 60 * u, G, ['rgba(255,150,120,0)', 'rgba(255,170,130,0.35)']);
    o.fillRect(0, G - 60 * u, W, 60 * u);
  },

  tick(dt) {
    this.clouds.tick(dt);
    for (const t of this.traffic) { t.x += t.v * dt; if (t.x > 1.05) t.x = -0.05; if (t.x < -0.05) t.x = 1.05; }
    const m = this.meteor;
    if (m.life > 0) m.life -= dt; else { m.t -= dt; if (m.t <= 0) { m.t = rand(5, 14); m.life = 0.7; m.x = rand(0.1, 0.9); m.y = rand(0.04, 0.3); m.d = Math.random() < 0.5 ? 1 : -1; } }
  },

  ambient(c) {
    drawStars(c, this.stars, G, s => (s.hue < 0.2 ? '255,214,190' : s.hue < 0.4 ? '190,220,255' : '240,240,255'));
    const m = this.meteor;
    if (m.life > 0) {
      const p = 1 - m.life / 0.7, x = (m.x + m.d * p * 0.12) * W, y = (m.y + p * 0.07) * G;
      c.strokeStyle = lgrad(c, x - m.d * 60 * u, y - 34 * u, x, y, ['rgba(255,255,255,0)', 'rgba(255,255,255,' + Math.sin(p * Math.PI) + ')']);
      c.lineWidth = 1.5 * u; c.beginPath(); c.moveTo(x - m.d * 60 * u, y - 34 * u); c.lineTo(x, y); c.stroke();
    }
    this.clouds.draw(c);
    c.globalCompositeOperation = 'lighter';
    if (!game.lowFx && this.pos) {                         // searchlights sweeping from between the towers
      [1.5, 4.5, 8.5, 11.5].forEach((slot, k) => {
        const i = Math.floor(slot), x = (this.pos[i] + this.pos[i + 1]) / 2, a = -Math.PI / 2 + Math.sin(time * 0.33 + k * 1.9) * 0.55 + (k - 1.5) * 0.12, L = G * 0.95, wd = 0.045;
        c.fillStyle = lgrad(c, x, G, x + Math.cos(a) * L, G + Math.sin(a) * L, ['rgba(170,220,255,0.26)', 'rgba(170,220,255,0)']);
        c.beginPath(); c.moveTo(x, G); c.lineTo(x + Math.cos(a - wd) * L, G + Math.sin(a - wd) * L); c.lineTo(x + Math.cos(a + wd) * L, G + Math.sin(a + wd) * L); c.fill();
      });
    }
    for (const t of this.traffic) {                        // air traffic in three lanes
      const y = G * (0.47 + t.lane * 0.055), x = t.x * W, d = Math.sign(t.v), len = 16 * u;
      c.strokeStyle = lgrad(c, x - d * len, y, x, y, ['rgba(255,255,255,0)', d > 0 ? 'rgba(255,244,210,0.9)' : 'rgba(255,90,110,0.9)']);
      c.lineWidth = 1.4 * u; c.beginPath(); c.moveTo(x - d * len, y); c.lineTo(x, y); c.stroke();
    }
    c.globalCompositeOperation = 'source-over';
  },

  foreground(o) {
    o.fillStyle = vgrad(o, G, H, ['#17103e', '#0a0722', '#04030f']);
    o.fillRect(0, G, W, H - G + 2);
    o.save();
    o.beginPath(); o.rect(0, G, W, H - G); o.clip();
    o.strokeStyle = 'rgba(255,80,200,0.2)'; o.lineWidth = 1;
    const vy = G - 46 * u;
    for (let k = -30; k <= 30; k++) { o.beginPath(); o.moveTo(W / 2 + k * 26 * u, vy); o.lineTo(W / 2 + k * 150 * u, H); o.stroke(); }
    for (let j = 1; j < 7; j++) { const y = G + (H - G) * Math.pow(j / 7, 1.7); o.beginPath(); o.moveTo(0, y); o.lineTo(W, y); o.stroke(); }
    o.restore();
    o.fillStyle = vgrad(o, G - 10 * u, G + 12 * u, ['rgba(255,120,220,0)', 'rgba(255,120,220,0.3)', 'rgba(255,120,220,0)']);
    o.fillRect(0, G - 10 * u, W, 22 * u);
    o.fillStyle = hgrad(o, 0, W, NEON); o.fillRect(0, G - 1, W, 2.5);
    o.fillStyle = 'rgba(255,255,255,0.7)'; o.fillRect(0, G - 0.5, W, 1);
  },

  // Reflections on the wet plaza.
  groundAnim(c) {
    const spr = this.sprites();
    const draw = (slot, alive) => {
      const s = alive ? spr[slot].alive : spr[slot].ruin;
      c.drawImage(s.c, this.pos[slot] - s.ax, -s.ay, s.w, s.h);
    };
    c.save();
    c.beginPath(); c.rect(0, G + 1.5, W, H - G); c.clip();
    c.translate(0, G); c.scale(1, -0.62);
    c.globalAlpha = 0.26;
    game.cities.forEach(ct => draw(CITY_SLOTS[ct.i], ct.alive));
    game.bases.forEach(b => draw(BASE_SLOTS[b.i], b.alive));
    c.restore();
    c.fillStyle = vgrad(c, G + 2, H, ['rgba(4,3,15,0)', 'rgba(4,3,15,0.85)']);
    c.fillRect(0, G + 2, W, H - G);
  },

  drawBase(c, b, x) {
    const s = this.sprites()[BASE_SLOTS[b.i]], img = b.alive ? s.alive : s.ruin;
    c.drawImage(img.c, x - img.ax, G - img.ay, img.w, img.h);
    for (let k = 0; k < 10; k++) {                         // interceptor stock under the letter
      const px = x + (k - 4.5) * 6.4 * u, on = b.alive && k < b.ammo;
      if (on) soft(c, px, G + 10 * u, 6 * u, s.rgb, 0.6);
      c.fillStyle = on ? s.hue : 'rgba(255,255,255,0.12)';
      c.fillRect(px - 2 * u, G + 8.5 * u, 4 * u, 3 * u);
    }
  },

  // Halos breathe along the word; rooftop beacons blink; broken tubes flicker.
  afterCities(c) {
    const spr = this.sprites();
    c.globalCompositeOperation = 'lighter';
    const each = (slot, alive, fireT) => {
      const s = spr[slot], x = this.pos[slot], g = s.glow;
      if (alive) {
        const hot = fireT != null ? clamp(1 - (time - fireT) * 3, 0, 1) : 0;
        c.globalAlpha = 0.3 + 0.25 * Math.sin(time * 1.7 - slot * 0.55) + hot * 0.6;
        c.drawImage(g.c, x - g.ax, G - g.ay, g.w, g.h);
        c.globalAlpha = 1;
        if (hot > 0) soft(c, x, G - this.capH - 4 * u, 26 * u * hot, s.rgb, hot);
        beacon(c, x - this.wid[slot] * 0.28, G - this.capH - this.depth * 0.7 - 3 * u, 1.3 * u, '255,70,90', Math.floor(time * 1.4 + slot * 0.37) % 2 === 0);
      } else if (Math.sin(time * 23 + slot * 7) * Math.sin(time * 3.1 + slot) > 0.55) {
        c.globalAlpha = 0.35;
        c.save();
        c.beginPath(); c.rect(x - g.ax, G - this.capH * 0.34, g.w, this.capH * 0.34); c.clip();
        c.drawImage(g.c, x - g.ax, G - g.ay, g.w, g.h);
        c.restore();
        c.globalAlpha = 1;
      }
    };
    game.cities.forEach(ct => each(CITY_SLOTS[ct.i], ct.alive));
    game.bases.forEach(b => each(BASE_SLOTS[b.i], b.alive, b.fireT));
    c.globalCompositeOperation = 'source-over';
  },

  ruinSmoke(city, x) {
    if (Math.random() < 0.5) return;
    game.puffs.push({ x: x + rand(-10, 10) * u, y: G - this.capH * 0.3, vx: game.wind * rand(4, 10) * u, vy: -rand(14, 24) * u, r: rand(3, 5) * u, gr: 7 * u, a: 0.3, fa: 0.14, rgb: '90,70,140', kind: 'smoke' });
  },

  flyer(c, f) {
    const dir = Math.sign(f.vx);
    soft(c, f.x, f.y + 5 * u, 20 * u, '60,220,255', 0.5);
    c.save();
    c.translate(f.x, f.y + Math.sin(time * 3 + f.x * 0.01) * 2 * u);
    c.scale(dir * u, u);
    poly(c, [[22, 0], [6, -5], [-14, -5], [-20, -10], [-22, -10], [-18, 0], [-14, 4], [6, 4]], '#120d33');
    poly(c, [[22, 0], [6, -5], [-14, -5], [-20, -10], [-22, -10], [-18, 0], [-14, 4], [6, 4]], null, '#ff4fb0', 1.2);
    rect(c, -12, 4, 16, 1.4, '#22e3ff');
    c.restore();
    beacon(c, f.x - dir * 6 * u, f.y - 2 * u, 1.4 * u, '255,60,90', Math.floor(time * 5) % 2 === 0);
  },
};
