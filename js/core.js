// Shared state, math and drawing helpers used by the engine and by every theme.

export const TAU = Math.PI * 2;

// Screen geometry. These are live bindings: themes import them and always see the current values.
//   W, H  window size in CSS pixels      G  y of the ground line
//   u     art scale (1 = design size)    R  interceptor blast radius
export let W = 0, H = 0, G = 0, u = 1, R = 40, dpr = 1, time = 0;
export function setGeom(g) { W = g.W; H = g.H; G = g.G; u = g.u; R = g.R; dpr = g.dpr; }
export function addTime(dt) { time += dt; }

// Mutable game state shared between the engine and the themes.
export const game = {
  cities: [], bases: [], threats: [], shots: [], blasts: [], flyers: [],
  particles: [], puffs: [], chunks: [],
  pointer: { x: 0, y: 0, inside: false },
  brand: { x: 0, top: 0, w: 0, h: 0, wordY: 0, wordSize: 16, bottom: 0 },
  mode: 'playing', auto: true, paused: false,
  cs: 1,            // city art scale: landmarks grow to fill the room between them
  wind: 1,          // slowly varying gust factor, roughly 0.4 to 1.8
  lowFx: false,     // set when frames run slow; themes skip optional effects
  reduceMotion: false,
};

// ---------------------------------------------------------------- math
export const rand = (a, b) => a + Math.random() * (b - a);
export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export const lerp = (a, b, t) => a + (b - a) * t;
export const pick = arr => arr[(Math.random() * arr.length) | 0];
export const smooth = t => t * t * (3 - 2 * t);

// Small seeded generator so procedural art is identical on every frame and rebuild.
export function srand(seed) {
  let s = (Math.imul((seed | 0) + 1, 2654435761) >>> 0) || 1;
  return () => {
    s ^= s << 13; s >>>= 0;
    s ^= s >>> 17;
    s ^= s << 5; s >>>= 0;
    return s / 4294967296;
  };
}
function hash(n) { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }
export function noise1(x, seed = 0) {
  const i = Math.floor(x), f = x - i;
  return lerp(hash(i + seed * 57.31), hash(i + 1 + seed * 57.31), smooth(f));
}
export function fbm(x, seed = 0, oct = 4) {
  let a = 0.5, s = 0, n = 0;
  for (let o = 0; o < oct; o++) { s += a * noise1(x, seed + o * 13.7); n += a; x *= 2.03; a *= 0.5; }
  return s / n;
}

// ---------------------------------------------------------------- color
export function hexRgb(h) {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
// f > 0 lightens toward white, f < 0 darkens toward black
export function mix(h, f) {
  const c = hexRgb(h), t = f > 0 ? 255 : 0, k = Math.abs(f);
  return 'rgb(' + c.map(v => Math.round(v + (t - v) * k)).join(',') + ')';
}
export const rgba = (c, a) => 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')';
export function lerpHex(list, t) {
  const x = clamp(t, 0, 1) * (list.length - 1), i = Math.min(list.length - 2, Math.floor(x)), f = x - i;
  const a = hexRgb(list[i]), b = hexRgb(list[i + 1]);
  return '#' + a.map((v, k) => Math.round(v + (b[k] - v) * f).toString(16).padStart(2, '0')).join('');
}

// ---------------------------------------------------------------- canvases and sprites
export function mkCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.ceil(w * dpr));
  c.height = Math.max(1, Math.ceil(h * dpr));
  const x = c.getContext('2d');
  x.setTransform(dpr, 0, 0, dpr, 0, 0);
  return [c, x];
}

// A sprite drawn in "unit" coordinates: origin at the centre of its base on the ground,
// x to the right, y UP, one unit = u CSS pixels. Art code can then say rect(c, -10, 0, 20, 30)
// for a 20 x 30 building standing on the ground.
export function unitSprite(wU, upU, downU, draw, k = 1) {
  const s = u * k, w = wU * s, h = (upU + downU) * s;
  const [c, x] = mkCanvas(w, h);
  x.setTransform(dpr * s, 0, 0, -dpr * s, (w / 2) * dpr, upU * s * dpr);
  draw(x);
  return { c, w, h, ax: w / 2, ay: upU * s };
}
export function blit(c, s, x, y) { c.drawImage(s.c, x - s.ax, y - s.ay, s.w, s.h); }

// ---------------------------------------------------------------- gradients and shapes
// Stops are either plain colors (evenly spaced) or [offset, color] pairs.
function addStops(g, list) {
  const n = list.length;
  list.forEach((s, i) => (Array.isArray(s) ? g.addColorStop(s[0], s[1]) : g.addColorStop(n === 1 ? 0 : i / (n - 1), s)));
  return g;
}
export const lgrad = (c, x0, y0, x1, y1, list) => addStops(c.createLinearGradient(x0, y0, x1, y1), list);
export const vgrad = (c, y0, y1, list) => lgrad(c, 0, y0, 0, y1, list);
export const hgrad = (c, x0, x1, list) => lgrad(c, x0, 0, x1, 0, list);
export const rgrad = (c, x, y, r0, r1, list) => addStops(c.createRadialGradient(x, y, r0, x, y, r1), list);

export const rect = (c, x, y, w, h, fill) => { c.fillStyle = fill; c.fillRect(x, y, w, h); };
export function poly(c, pts, fill, stroke, lw) {
  c.beginPath();
  for (let i = 0; i < pts.length; i++) i ? c.lineTo(pts[i][0], pts[i][1]) : c.moveTo(pts[i][0], pts[i][1]);
  c.closePath();
  if (fill) { c.fillStyle = fill; c.fill(); }
  if (stroke) { c.strokeStyle = stroke; c.lineWidth = lw || 1; c.stroke(); }
}
export const circ = (c, x, y, r, fill) => { c.fillStyle = fill; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); };
export function ell(c, x, y, rx, ry, fill, rot = 0) { c.fillStyle = fill; c.beginPath(); c.ellipse(x, y, rx, ry, rot, 0, TAU); c.fill(); }
export function line(c, x0, y0, x1, y1, stroke, lw = 1) {
  c.strokeStyle = stroke; c.lineWidth = lw;
  c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
}
export function ring(c, x, y, r, stroke, lw = 1) { c.strokeStyle = stroke; c.lineWidth = lw; c.beginPath(); c.arc(x, y, r, 0, TAU); c.stroke(); }
// Half disc. In unit (y-up) coordinates this is a dome sitting on y.
export function dome(c, x, y, r, fill) { c.fillStyle = fill; c.beginPath(); c.arc(x, y, r, 0, Math.PI); c.closePath(); c.fill(); }
export function rrectPath(c, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}
export function rrect(c, x, y, w, h, r, fill) { rrectPath(c, x, y, w, h, r); c.fillStyle = fill; c.fill(); }

// Grid of windows. `on` may be one color or a list to choose from; pass off = null to skip dark panes.
export function windows(c, x, y, w, h, cols, rows, on, off, seed, lit = 0.6, fw = 0.56, fh = 0.5) {
  const rnd = srand(seed), cw = w / cols, rh = h / rows;
  for (let r = 0; r < rows; r++) for (let k = 0; k < cols; k++) {
    const col = rnd() < lit ? (Array.isArray(on) ? on[(rnd() * on.length) | 0] : on) : off;
    if (!col) continue;
    c.fillStyle = col;
    c.fillRect(x + k * cw + cw * (1 - fw) / 2, y + r * rh + rh * (1 - fh) / 2, cw * fw, rh * fh);
  }
}

// Gear outline with trapezoid teeth. Adds to the current path if `append` is set.
export function gearPath(c, x, y, r, teeth, rot = 0, depth = 0.18, append = false) {
  const ri = r * (1 - depth), p = TAU / teeth;
  if (!append) c.beginPath();
  for (let i = 0; i < teeth; i++) {
    const a = rot + i * p;
    const pt = (ang, rr) => [x + Math.cos(ang) * rr, y + Math.sin(ang) * rr];
    const p0 = pt(a - p * 0.28, ri), p1 = pt(a - p * 0.16, r), p2 = pt(a + p * 0.16, r), p3 = pt(a + p * 0.28, ri);
    if (i === 0) c.moveTo(p0[0], p0[1]); else c.lineTo(p0[0], p0[1]);
    c.lineTo(p1[0], p1[1]); c.lineTo(p2[0], p2[1]); c.lineTo(p3[0], p3[1]);
  }
  c.closePath();
}
// A complete gear: teeth, spoke cut-outs and a hub hole. `fill` may be a gradient.
export function gear(c, x, y, r, teeth, rot, fill, o = {}) {
  const spokes = o.spokes ?? (r > 6 ? 5 : 0), hub = o.hub ?? 0.16;
  gearPath(c, x, y, r, teeth, rot, o.depth ?? 0.18);
  if (spokes) {
    const r0 = r * 0.34, r1 = r * 0.66, gap = 0.2;
    for (let i = 0; i < spokes; i++) {
      const a0 = rot + (i / spokes) * TAU + gap, a1 = rot + ((i + 1) / spokes) * TAU - gap;
      c.moveTo(x + Math.cos(a0) * r1, y + Math.sin(a0) * r1);
      c.arc(x, y, r1, a0, a1);
      c.arc(x, y, r0, a1, a0, true);
      c.closePath();
    }
  }
  c.moveTo(x + r * hub, y);
  c.arc(x, y, r * hub, 0, TAU, true);
  c.fillStyle = fill;
  c.fill('evenodd');
  if (o.stroke) { c.strokeStyle = o.stroke; c.lineWidth = o.lw || 0.6; c.stroke(); }
}

// ---------------------------------------------------------------- soft light
const softCache = new Map();
function softDot(rgb) {
  let s = softCache.get(rgb);
  if (s) return s;
  s = document.createElement('canvas');
  s.width = s.height = 64;
  const x = s.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(' + rgb + ',1)');
  g.addColorStop(0.35, 'rgba(' + rgb + ',0.6)');
  g.addColorStop(0.7, 'rgba(' + rgb + ',0.18)');
  g.addColorStop(1, 'rgba(' + rgb + ',0)');
  x.fillStyle = g; x.fillRect(0, 0, 64, 64);
  softCache.set(rgb, s);
  return s;
}
// Cheap soft-edged disc (pre-rendered), used for glows, smoke and shadows. rgb is 'r,g,b'.
export function soft(c, x, y, r, rgb, a = 1) {
  if (a <= 0 || r <= 0) return;
  const pa = c.globalAlpha;
  c.globalAlpha = pa * Math.min(1, a);
  c.drawImage(softDot(rgb), x - r, y - r, r * 2, r * 2);
  c.globalAlpha = pa;
}
// Blinking light with a halo.
export function beacon(c, x, y, r, rgb, on = true) {
  if (on) soft(c, x, y, r * 5, rgb, 0.8);
  circ(c, x, y, r, on ? 'rgb(' + rgb + ')' : 'rgba(' + rgb + ',0.25)');
}

// ---------------------------------------------------------------- particles
export function burst(x, y, n, rgb, speed, life, size = 2, o = {}) {
  const P = game.particles;
  if (P.length > 900) return;
  for (let i = 0; i < n; i++) {
    const a = Math.random() * TAU, s = rand(0.2, 1) * speed;
    P.push({
      x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - speed * (o.up ?? 0.25),
      life: rand(0.5, 1) * life, max: life, rgb, size, rot: Math.random() * TAU, kind: o.kind,
    });
  }
}
// Lingering puff: smoke, dust, a bubble or an expanding ring.
export function puff(x, y, o) {
  const P = game.puffs;
  if (P.length > 420) P.splice(0, 20);
  P.push(Object.assign({ x, y, vx: 0, vy: 0, r: 4 * u, gr: 8 * u, a: 0.4, fa: 0.2, rgb: '120,120,130', kind: 'smoke', lift: 0 }, o));
}

// ---------------------------------------------------------------- scenery builders
// Filled ridge line from a height function (screen coordinates, heights in pixels above `base`).
export function ridge(o, x0, x1, base, hFn, fill, step = 3) {
  o.beginPath();
  o.moveTo(x0, base + 2);
  for (let x = x0; x < x1; x += step) o.lineTo(x, base - hFn(x));
  o.lineTo(x1, base - hFn(x1));
  o.lineTo(x1, base + 2);
  o.closePath();
  if (fill) { o.fillStyle = fill; o.fill(); }
}

// Row of block silhouettes for distant skylines. `deco(o, x, top, w, h, rnd)` can add roof details.
export function skyline(o, { seed, base, hmin, hmax, wmin, wmax, color, gap = 0, x0 = 0, x1 = W, deco }) {
  const rnd = srand(seed);
  for (let x = x0; x < x1;) {
    const w = (wmin + rnd() * (wmax - wmin)) * u, h = (hmin + rnd() * (hmax - hmin)) * u;
    o.fillStyle = color;
    o.fillRect(x, base - h, w + 0.5, h + 1);
    if (deco) deco(o, x, base - h, w, h, rnd);
    x += w + rnd() * gap * u;
  }
}

// Soft cumulus cloud with a flat base, lit from above.
export function cloudSprite(seed, w, h, top = '#ffffff', bottom = '#c3d2e6') {
  const [cv, c] = mkCanvas(w, h);
  const rnd = srand(seed), baseY = h * 0.74, n = 15;
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1), env = Math.pow(Math.sin(Math.PI * t), 0.7);
    const r = h * (0.13 + 0.25 * env * (0.55 + rnd() * 0.5));
    const px = w * (0.15 + 0.7 * t) + (rnd() - 0.5) * w * 0.05;
    const py = baseY - r * (0.45 + rnd() * 0.5) - env * h * 0.14 * rnd();
    c.fillStyle = rgrad(c, px, py, r * 0.25, r, [[0, 'rgba(255,255,255,1)'], [0.72, 'rgba(255,255,255,0.96)'], [1, 'rgba(255,255,255,0)']]);
    c.beginPath(); c.arc(px, py, r, 0, TAU); c.fill();
  }
  c.globalCompositeOperation = 'destination-out';
  c.fillStyle = vgrad(c, baseY - h * 0.05, baseY + h * 0.07, ['rgba(0,0,0,0)', 'rgba(0,0,0,1)']);
  c.fillRect(0, baseY - h * 0.05, w, h);
  c.globalCompositeOperation = 'source-atop';
  c.fillStyle = vgrad(c, h * 0.08, baseY + h * 0.04, [[0, top], [0.5, top], [1, bottom]]);
  c.fillRect(0, 0, w, h);
  c.globalCompositeOperation = 'source-over';
  return { c: cv, w, h };
}

// Smooth lens-shaped (lenticular) cloud, the kind that stacks up downwind of mountains.
export function lensCloudSprite(seed, w, h, top = '#ffffff', bottom = '#b9c8de') {
  const [cv, c] = mkCanvas(w, h);
  const rnd = srand(seed), layers = 2 + ((rnd() * 2) | 0);
  for (let i = 0; i < layers; i++) {
    const cy = h * (0.3 + 0.2 * i), rx = w * (0.46 - i * 0.07 + rnd() * 0.02), ry = h * 0.15;
    c.save();
    c.translate(w / 2 + (rnd() - 0.5) * w * 0.06, cy);
    c.scale(1, ry / rx);
    c.fillStyle = rgrad(c, 0, 0, rx * 0.2, rx, [[0, 'rgba(255,255,255,0.98)'], [0.75, 'rgba(255,255,255,0.9)'], [1, 'rgba(255,255,255,0)']]);
    c.beginPath(); c.arc(0, 0, rx, 0, TAU); c.fill();
    c.restore();
  }
  c.globalCompositeOperation = 'source-atop';
  c.fillStyle = vgrad(c, h * 0.12, h * 0.85, [[0, top], [0.45, top], [1, bottom]]);
  c.fillRect(0, 0, w, h);
  c.globalCompositeOperation = 'source-over';
  return { c: cv, w, h };
}

// A drifting layer of clouds. Wind-driven; nearer (larger) clouds move faster.
export class Clouds {
  constructor(o) {
    this.o = Object.assign({ n: 6, y0: 0.08, y1: 0.55, s0: 0.7, s1: 1.4, speed: 9, variants: 3, w: 260, h: 120, top: '#ffffff', bottom: '#c3d2e6', alpha: 1, seed: 1, make: cloudSprite, band: null }, o);
    const rnd = srand(this.o.seed * 7 + 3), q = this.o;
    this.items = Array.from({ length: q.n }, (_, i) => ({ fx: rnd() * 1.3 - 0.15, fy: rnd(), s: q.s0 + rnd() * (q.s1 - q.s0), k: i % q.variants, v: 0.7 + rnd() * 0.6 }));
    this.sprites = [];
  }
  build() {
    const q = this.o;
    this.sprites = Array.from({ length: q.variants }, (_, k) => q.make(q.seed * 31 + k, q.w * u, q.h * u, q.top, q.bottom));
  }
  tick(dt) {
    const q = this.o;
    for (const it of this.items) {
      it.fx += (q.speed * u * it.v * it.s * game.wind * dt) / Math.max(W, 1);
      if (it.fx > 1.22) { it.fx = -0.22; it.fy = Math.random(); }
    }
  }
  band() { return this.o.band ? this.o.band() : [this.o.y0 * G, this.o.y1 * G]; }
  draw(c) {
    const [t, b] = this.band(), pa = c.globalAlpha;
    c.globalAlpha = pa * this.o.alpha;
    for (const it of this.items) {
      const s = this.sprites[it.k];
      if (!s) continue;
      const w = s.w * it.s, h = s.h * it.s;
      c.drawImage(s.c, it.fx * W - w / 2, t + it.fy * (b - t) - h / 2, w, h);
    }
    c.globalAlpha = pa;
  }
  // Shadows the clouds cast on open ground between y0 (far) and y1 (near).
  shadows(c, y0, y1, a = 0.12, rgb = '25,35,60') {
    for (const it of this.items) {
      const s = this.sprites[it.k];
      if (!s) continue;
      const d = it.fy, y = y0 + d * (y1 - y0), rx = s.w * it.s * (0.4 + 0.5 * d), ry = Math.max(3, (y1 - y0) * 0.1 * (0.5 + d));
      c.save();
      c.translate(it.fx * W + (y1 - y0) * 0.6, y);
      c.scale(1, ry / rx);
      soft(c, 0, 0, rx, rgb, a);
      c.restore();
    }
  }
}

// Small flock of birds in a loose V that crosses the sky and scatters from explosions.
export class Flock {
  constructor(n, o = {}) {
    this.o = Object.assign({ color: 'rgba(30,35,50,0.75)', y0: 0.16, y1: 0.42, speed: 0.022, size: 5 }, o);
    this.n = n;
    this.reset(rand(0, 1));
  }
  reset(x) {
    const y = rand(this.o.y0, this.o.y1);
    this.b = Array.from({ length: this.n }, (_, i) => {
      const row = Math.ceil(i / 2), side = i % 2 ? 1 : -1;
      return { x: x - row * 0.011 + rand(-0.003, 0.003), y: y + side * row * 0.011 + rand(-0.004, 0.004), s: rand(0.8, 1.15), ph: rand(0, TAU), vy: 0, vx: 0 };
    });
  }
  tick(dt) {
    let minX = 9;
    for (const b of this.b) {
      b.x += (this.o.speed * (0.8 + 0.3 * game.wind) + b.vx) * dt;
      b.y += b.vy * dt;
      b.vx *= 0.97; b.vy *= 0.97;
      b.ph += dt * (7 + Math.abs(b.vy) * 60);
      minX = Math.min(minX, b.x);
    }
    if (minX > 1.08) this.reset(-0.06);
    for (const bl of game.blasts) {
      if (bl.t > 0.1) continue;
      for (const b of this.b) {
        const dx = b.x * W - bl.x, dy = b.y * G - bl.y, d = Math.hypot(dx, dy);
        if (d < R * 4) { b.vy += (dy / (d + 1)) * 0.06; b.vx += (dx / (d + 1)) * 0.03; }
      }
    }
  }
  draw(c) {
    c.strokeStyle = this.o.color; c.lineWidth = Math.max(1, 1.2 * u); c.lineCap = 'round';
    for (const b of this.b) {
      const x = b.x * W, y = b.y * G + Math.sin(b.ph * 0.25) * 2 * u, s = this.o.size * b.s * u, f = Math.sin(b.ph) * 0.55;
      c.beginPath();
      c.moveTo(x - s, y - s * (0.3 + f));
      c.quadraticCurveTo(x - s * 0.4, y - s * 0.5, x, y);
      c.quadraticCurveTo(x + s * 0.4, y - s * 0.5, x + s, y - s * (0.3 + f));
      c.stroke();
    }
  }
}

// Twinkling star field (static positions; draw every frame for the twinkle).
export function makeStars(n, seed, yMax = 1) {
  const rnd = srand(seed);
  return Array.from({ length: n }, () => ({ x: rnd(), y: rnd() * yMax, r: rnd() < 0.86 ? 0.6 + rnd() * 0.5 : 1.2 + rnd() * 0.8, p: rnd() * TAU, s: 0.5 + rnd() * 2, hue: rnd() }));
}
export function drawStars(c, stars, yScale, rgbFn) {
  for (const s of stars) {
    const a = 0.45 + 0.45 * Math.sin(time * s.s + s.p);
    c.fillStyle = 'rgba(' + (rgbFn ? rgbFn(s) : '235,240,255') + ',' + a + ')';
    c.fillRect(s.x * W, s.y * yScale, s.r * Math.max(1, u), s.r * Math.max(1, u));
  }
}

// Ground outline with a raised mound under each launch base. `flat` gives butte-like flat tops.
export function groundPath(c, baseFx, top, half = 56, flat = false) {
  c.beginPath();
  c.moveTo(0, H + 2);
  c.lineTo(0, G);
  for (const fx of baseFx) {
    const x = fx * W, w = half * u;
    c.lineTo(x - w, G);
    if (flat) { c.lineTo(x - w * 0.45, top); c.lineTo(x + w * 0.45, top); c.lineTo(x + w, G); }
    else {
      c.bezierCurveTo(x - w * 0.6, G, x - w * 0.55, top, x - w * 0.3, top);
      c.lineTo(x + w * 0.3, top);
      c.bezierCurveTo(x + w * 0.55, top, x + w * 0.6, G, x + w, G);
    }
  }
  c.lineTo(W, G);
  c.lineTo(W, H + 2);
  c.closePath();
}

// Interceptor stock as a pyramid of ten (4-3-2-1). Unit coordinates, hanging below the origin.
export function pips(c, b, on, off, o = {}) {
  const dy = o.y ?? -5, sx = o.sx ?? 6, sy = o.sy ?? 4.6;
  let k = 0;
  for (let row = 0; row < 4; row++) {
    const n = 4 - row, y = dy - (3 - row) * sy;
    for (let q = 0; q < n; q++, k++) {
      const x = (q - (n - 1) / 2) * sx;
      c.fillStyle = b.alive && k < b.ammo ? on : off;
      if (o.round) { c.beginPath(); c.arc(x, y - 1.6, 1.6, 0, TAU); c.fill(); }
      else c.fillRect(x - 1.2, y - 3.2, 2.4, 3.2);
    }
  }
}

// Generic broken-building pile in unit coordinates.
export function rubble(c, a, b, w = 24) {
  const k = w / 24;
  poly(c, [[-24 * k, 0], [-17 * k, 6], [-9 * k, 3], [1 * k, 10], [11 * k, 4], [17 * k, 7], [24 * k, 0]], a);
  poly(c, [[-14 * k, 0], [-6 * k, 4], [4 * k, 2], [10 * k, 0]], b);
  poly(c, [[6 * k, 0], [9 * k, 13], [12 * k, 0]], a);
  poly(c, [[-20 * k, 0], [-18 * k, 9], [-15 * k, 0]], b);
}

// High-altitude jet that crosses now and then, leaving a fading contrail.
export class Jet {
  constructor(o = {}) {
    this.o = Object.assign({ y0: 0.05, y1: 0.2, rgb: '255,255,255', wait: [12, 34], secs: 30 }, o);
    this.p = -1;
    this.t = rand(3, 10);
  }
  tick(dt) {
    if (this.p < 0) {
      this.t -= dt;
      if (this.t <= 0) { this.p = 0; this.dir = Math.random() < 0.5 ? 1 : -1; this.y = rand(this.o.y0, this.o.y1); this.slope = rand(-0.05, 0.02); }
    } else {
      this.p += dt / this.o.secs;
      if (this.p > 1.6) { this.p = -1; this.t = rand(this.o.wait[0], this.o.wait[1]); }
    }
  }
  draw(c) {
    if (this.p < 0) return;
    const at = p => [(this.dir > 0 ? p : 1 - p) * (W + 80) - 40, this.y * G + this.slope * p * G];
    const [x, y] = at(this.p), [tx, ty] = at(Math.max(0, this.p - 0.55));
    const g = c.createLinearGradient(tx, ty, x, y);
    g.addColorStop(0, 'rgba(' + this.o.rgb + ',0)');
    g.addColorStop(0.7, 'rgba(' + this.o.rgb + ',0.5)');
    g.addColorStop(1, 'rgba(' + this.o.rgb + ',0.85)');
    c.strokeStyle = g; c.lineWidth = 2.2 * u; c.lineCap = 'round';
    c.beginPath(); c.moveTo(tx, ty); c.lineTo(x, y); c.stroke();
    c.fillStyle = 'rgba(235,240,250,0.95)';
    c.beginPath(); c.ellipse(x + this.dir * 3 * u, y, 4 * u, 1 * u, Math.atan2(this.slope * G, this.dir * W), 0, TAU); c.fill();
  }
}

// Ruin generator: the intact art, cut off along a jagged line near the ground, scorched, with rubble.
export function ruinFrom(c, art, o = {}) {
  const rnd = srand(o.seed || 1), w = o.w || 62, cut = o.cut || 13, n = 13;
  c.save();
  c.beginPath();
  c.moveTo(-w / 2, -8);
  for (let k = 0; k <= n; k++) c.lineTo(-w / 2 + (k / n) * w, cut * (0.3 + rnd() * 0.95) * (k % 2 ? 1 : 0.5));
  c.lineTo(w / 2, -8);
  c.closePath();
  c.clip();
  art(c);
  c.restore();
  c.globalCompositeOperation = 'source-atop';
  c.fillStyle = o.tint || 'rgba(38,30,26,0.5)';
  c.fillRect(-w, -10, w * 2, cut * 3);
  c.globalCompositeOperation = 'source-over';
  rubble(c, o.a || '#4a4038', o.b || '#6a5a4c', o.rw || w * 0.4);
}
