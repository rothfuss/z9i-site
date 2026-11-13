// Atlantis: a domed city on a sunlit seabed. Depth charges sink from the surface;
// torpedoes rise to meet them. Whales, fish, jellyfish and kelp keep the water alive.
import {
  TAU, W, H, G, u, time, game, srand, rand, clamp, fbm, mkCanvas,
  rect, poly, circ, ell, line, ring, vgrad, hgrad, lgrad, rgrad, rrect, windows, soft, beacon,
  ridge, pips, ruinFrom, puff,
} from '../core.js';

const CITY_FX = [0.215, 0.3, 0.385, 0.615, 0.7, 0.785];
const BASE_FX = [0.08, 0.5, 0.92];
const GOLD = ['#fff3c0', '#e9b949', '#9a6a1c'];
const PEARL = ['#ffffff', '#e2f4f8', '#9fc9d8'];
const LAMP = '#ffe9a0';

// ---------- unit-coordinate pieces
function tower(c, x, w, h, top, seed) {
  c.fillStyle = hgrad(c, x, x + w, PEARL); c.fillRect(x, 0, w, h);
  windows(c, x + 0.6, 2, w - 1.2, h - 3, Math.max(1, Math.round(w / 2.6)), Math.max(2, Math.round(h / 4)), LAMP, 'rgba(20,90,130,0.22)', seed, 0.62);
  rect(c, x - 0.4, h - 1, w + 0.8, 1.1, GOLD[1]);
  if (top === 'dome') { c.fillStyle = hgrad(c, x, x + w, GOLD); c.beginPath(); c.arc(x + w / 2, h, w / 2, 0, Math.PI); c.fill(); rect(c, x + w / 2 - 0.2, h + w / 2, 0.4, 3, GOLD[1]); }
  else if (top === 'spire') { poly(c, [[x - 0.3, h], [x + w / 2, h + w * 1.7], [x + w + 0.3, h]], '#2fa7a0'); poly(c, [[x + w / 2, h], [x + w / 2, h + w * 1.7], [x + w + 0.3, h]], '#1f7f7c'); }
}
// Glass dome (an ellipse so tall towers fit) with a gold footing ring.
function glass(c, x, rx, ry) {
  c.save(); c.translate(x, 0); c.scale(1, ry / rx);
  c.fillStyle = rgrad(c, -rx * 0.35, rx * 0.5, rx * 0.1, rx * 1.15, [[0, 'rgba(255,255,255,0.42)'], [0.5, 'rgba(180,245,250,0.16)'], [1, 'rgba(120,225,240,0.34)']]);
  c.beginPath(); c.arc(0, 0, rx, 0, Math.PI); c.closePath(); c.fill();
  c.restore();
  c.strokeStyle = 'rgba(255,255,255,0.9)'; c.lineWidth = 0.7; c.beginPath(); c.ellipse(x, 0, rx, ry, 0, 0, Math.PI); c.stroke();
  c.strokeStyle = 'rgba(255,255,255,0.75)'; c.lineWidth = 1.1; c.lineCap = 'round'; c.beginPath(); c.ellipse(x, 0, rx * 0.82, ry * 0.82, 0, Math.PI * 0.6, Math.PI * 0.82); c.stroke();
  c.strokeStyle = 'rgba(255,255,255,0.22)'; c.lineWidth = 0.35;
  for (let k = 1; k < 4; k++) { c.beginPath(); c.ellipse(x, 0, rx * (1 - k / 4), ry, 0, 0, Math.PI); c.stroke(); }
  c.fillStyle = hgrad(c, x - rx - 1.5, x + rx + 1.5, [GOLD[2], GOLD[0], GOLD[1], GOLD[2]]); c.fillRect(x - rx - 1.5, -1.6, rx * 2 + 3, 2.6);
}
function garden(c, x0, x1, seed) {
  const r = srand(seed);
  for (let x = x0; x < x1; x += 2.4 + r() * 2.5) circ(c, x, 1.4 + r() * 1.6, 1.4 + r() * 1.4, r() < 0.5 ? '#43b581' : '#2f9a78');
}
function pearlBall(c, x, y, r) { c.fillStyle = rgrad(c, x - r * 0.35, y + r * 0.35, r * 0.1, r * 1.1, PEARL); c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); }

const ART = [
  c => { garden(c, -27, 27, 1); tower(c, -21, 7, 20, 'dome', 11); tower(c, -11, 7, 34, 'spire', 12); tower(c, -2, 9, 44, 'dome', 13); tower(c, 9, 7, 30, 'spire', 14); tower(c, 17, 6, 17, 'dome', 15); glass(c, 0, 29, 56); },
  c => {                                                  // twin domes joined by a tube
    garden(c, -28, -3, 2); tower(c, -22, 6, 15, 'dome', 21); tower(c, -14, 6, 20, 'spire', 22); glass(c, -15.5, 13.5, 30);
    rrect(c, -3.5, 4, 7, 4.4, 2.2, 'rgba(200,245,250,0.5)'); rect(c, -3.5, 3.6, 7, 0.8, GOLD[1]); rect(c, -3.5, 8.2, 7, 0.8, GOLD[1]);
    garden(c, 3, 29, 3); tower(c, 6, 7, 28, 'dome', 23); tower(c, 15, 6, 38, 'spire', 24); tower(c, 22, 5, 16, 'dome', 25); glass(c, 15.5, 14.5, 52);
  },
  c => {                                                  // nautilus hall
    garden(c, -28, 28, 4);
    c.save(); c.translate(-3, 17);
    for (let k = 0; k < 26; k++) {                        // spiral chambers, largest first
      const t = k / 25, a = -0.6 + t * 4.6, r = 17 * Math.exp(-t * 1.25), cx = Math.cos(a) * r * 0.55, cy = Math.sin(a) * r * 0.55, rr = r * 0.62;
      c.fillStyle = rgrad(c, cx - rr * 0.3, cy + rr * 0.3, rr * 0.1, rr, k % 2 ? ['#ffffff', '#ffd9c2', '#e59a84'] : ['#ffffff', '#fff0d8', '#f0b48e']);
      c.beginPath(); c.arc(cx, cy, rr, 0, TAU); c.fill();
      if (k < 12 && k % 2 === 0) circ(c, cx, cy, rr * 0.2, LAMP);
    }
    c.restore();
    rect(c, -12, 0, 18, 3, GOLD[1]);
    tower(c, 14, 6, 22, 'spire', 31); tower(c, 21, 5, 13, 'dome', 32);
    glass(c, 0, 29, 42);
  },
  c => {                                                  // pearl spire: stacked spheres with a searchlight
    garden(c, -26, -8, 5); tower(c, -24, 6, 14, 'dome', 41); tower(c, -16, 5, 9, 'dome', 42); glass(c, -17, 11, 22);
    rect(c, 4.6, 0, 3.8, 50, hgrad(c, 4.6, 8.4, PEARL));
    for (const [y, r] of [[13, 10], [31, 7.6], [45, 5.4]]) {
      pearlBall(c, 6.5, y, r);
      c.fillStyle = hgrad(c, 6.5 - r - 1.5, 6.5 + r + 1.5, [GOLD[2], GOLD[0], GOLD[1], GOLD[2]]); c.beginPath(); c.ellipse(6.5, y, r + 1.5, 1.3, 0, 0, TAU); c.fill();
      for (let k = -2; k <= 2; k++) circ(c, 6.5 + k * r * 0.36, y + 2.6, 0.75, LAMP);
    }
    rect(c, 6.3, 50, 0.4, 7, GOLD[1]);
    rrect(c, 17, 0, 12, 8, 4, hgrad(c, 17, 29, PEARL)); for (let k = 0; k < 3; k++) circ(c, 20 + k * 3, 4.4, 0.9, LAMP);
  },
  c => {                                                  // temple of the old city
    garden(c, -27, -17, 6); garden(c, 17, 27, 7);
    const M = ['#ffffff', '#eef4f0', '#bfd3d0'];
    rect(c, -17, 0, 34, 1.4, M[2]); rect(c, -16, 1.4, 32, 1.4, M[1]); rect(c, -15, 2.8, 30, 1.2, M[0]);
    for (let k = 0; k < 6; k++) { const x = -13.6 + k * 5.2; c.fillStyle = hgrad(c, x, x + 2.2, M); c.fillRect(x, 4, 2.2, 15); rect(c, x - 0.4, 18.4, 3, 0.9, M[0]); rect(c, x - 0.4, 4, 3, 0.7, M[1]); for (const q of [0.6, 1.1, 1.6]) line(c, x + q, 5, x + q, 18, 'rgba(120,150,150,0.35)', 0.15); }
    rect(c, -15.4, 19.3, 30.8, 2.2, M[1]); rect(c, -15.4, 20.6, 30.8, 0.5, GOLD[1]);
    poly(c, [[-16.4, 21.5], [0, 30], [16.4, 21.5]], M[0]); poly(c, [[-12.6, 22.3], [0, 28.4], [12.6, 22.3]], '#cfe3e0');
    circ(c, 0, 24.6, 1.6, GOLD[1]); rect(c, -0.3, 30, 0.6, 3.4, GOLD[1]); circ(c, 0, 34, 1, GOLD[0]);
    rect(c, -3, 4, 6, 9, 'rgba(20,90,130,0.4)'); soft(c, 0, 8, 7, '255,233,160', 0.5);
    glass(c, 0, 29, 46);
  },
  c => {                                                  // coral-grown towers
    garden(c, -28, 28, 8);
    const T = [[-21, 9, 24, ['#ffd0d8', '#ff8fa3', '#c84f73']], [-9, 11, 42, ['#ffe0c2', '#ffa46b', '#d0663a']], [5, 9, 31, ['#e8d5ff', '#b490f0', '#7650b8']], [16, 8, 19, ['#d0fff0', '#62d6b4', '#2a9a84']]];
    for (const [x, w, h, col] of T) {
      c.fillStyle = hgrad(c, x, x + w, col);
      c.beginPath(); c.moveTo(x - 1, 0); c.quadraticCurveTo(x + 0.4, h * 0.6, x + w * 0.2, h); c.quadraticCurveTo(x + w / 2, h + w * 0.6, x + w * 0.8, h); c.quadraticCurveTo(x + w - 0.4, h * 0.6, x + w + 1, 0); c.closePath(); c.fill();
      const r = srand(x + 50);
      for (let y = 4; y < h - 1; y += 4.4) for (let q = 0; q < 2; q++) if (r() < 0.75) circ(c, x + w * (0.32 + q * 0.36), y, 0.95, LAMP);
      circ(c, x + w / 2, h + w * 0.34, 1.2, GOLD[0]);
    }
    glass(c, 0, 29, 54);
  },
];

// ---------- sea life (screen coordinates)
function whale(c, x, y, s, dir, t) {
  const tail = Math.sin(t * 1.3), fin = Math.sin(t * 0.9 + 1);
  c.save(); c.translate(x, y); c.scale(dir * s, s);
  c.fillStyle = vgrad(c, -26, 24, ['#1f5f8c', '#2d79a6', '#7fb9d2']);
  c.beginPath();
  c.moveTo(62, 2); c.bezierCurveTo(54, -22, -8, -27, -50, -9);
  c.quadraticCurveTo(-74, -3 + tail * 5, -92, -5 + tail * 10);
  c.lineTo(-110, -18 + tail * 15); c.quadraticCurveTo(-101, -2 + tail * 12, -110, 13 + tail * 12); c.lineTo(-91, 4 + tail * 9);
  c.quadraticCurveTo(-70, 8 + tail * 3, -46, 12); c.bezierCurveTo(-6, 26, 46, 22, 62, 2);
  c.fill();
  c.fillStyle = 'rgba(190,225,238,0.5)'; c.beginPath(); c.moveTo(58, 6); c.bezierCurveTo(40, 21, -4, 24, -40, 12); c.bezierCurveTo(-4, 16, 36, 13, 58, 6); c.fill();
  c.strokeStyle = 'rgba(20,70,110,0.35)'; c.lineWidth = 0.6;
  for (let k = 0; k < 5; k++) { c.beginPath(); c.moveTo(52 - k * 3, 8 + k * 1.2); c.quadraticCurveTo(30, 16 + k, 6 - k * 2, 16 + k * 0.8); c.stroke(); }
  c.fillStyle = '#1f5f8c'; c.beginPath(); c.moveTo(24, 10); c.quadraticCurveTo(10, 30 + fin * 6, -8, 42 + fin * 8); c.quadraticCurveTo(8, 40 + fin * 6, 32, 14); c.fill();
  poly(c, [[-22, -19], [-30, -27], [-34, -17]], '#1f5f8c');
  circ(c, 46, -1, 1.5, '#0c2c44');
  c.restore();
}
function fish(c, x, y, s, dir, col, wag) {
  c.save(); c.translate(x, y); c.scale(dir * s, s);
  poly(c, [[-5, 0], [-9, -3.4 + wag], [-9, 3.4 + wag]], col[1]);
  ell(c, 0, 0, 5.6, 2.8, col[0]);
  rect(c, -0.6, -2.6, 1.4, 5.2, col[2]);
  circ(c, 3.4, -0.6, 0.6, '#0c2c44');
  c.restore();
}
function jelly(c, x, y, s, t, col) {
  const p = 0.8 + 0.2 * Math.sin(t * 2.2);
  c.strokeStyle = 'rgba(' + col + ',0.5)'; c.lineWidth = Math.max(1, 0.9 * s); c.lineCap = 'round';
  for (let k = -2; k <= 2; k++) {
    c.beginPath(); c.moveTo(x + k * 3.4 * s, y);
    for (let q = 1; q <= 6; q++) c.lineTo(x + k * 3.4 * s + Math.sin(t * 2 + q * 0.9 + k) * 2.4 * s, y + q * 5 * s * (1.1 - 0.15 * p));
    c.stroke();
  }
  c.fillStyle = rgrad(c, x, y - 4 * s, 1, 12 * s, ['rgba(255,255,255,0.75)', 'rgba(' + col + ',0.55)', 'rgba(' + col + ',0.2)']);
  c.beginPath(); c.ellipse(x, y, 10 * s * (1.1 - 0.12 * p), 9 * s * p, 0, Math.PI, 0); c.closePath(); c.fill();
  c.strokeStyle = 'rgba(255,255,255,0.7)'; c.lineWidth = 1; c.beginPath(); c.ellipse(x, y, 10 * s * (1.1 - 0.12 * p), 9 * s * p, 0, Math.PI, 0); c.stroke();
}
function turtle(c, x, y, s, dir, t) {
  const f = Math.sin(t * 2.2);
  c.save(); c.translate(x, y); c.scale(dir * s, s); c.rotate(-0.08);
  poly(c, [[6, -2], [16, -12 - f * 7], [20, -9 - f * 7], [10, 1]], '#5f9a6a'); poly(c, [[-7, 3], [-16, 8 + f * 4], [-13, 10 + f * 4], [-5, 5]], '#5f9a6a');
  ell(c, 0, 0, 12, 7, '#3d7a55'); ell(c, 0, -1, 9.6, 5, '#5f9f66');
  c.strokeStyle = 'rgba(30,70,45,0.6)'; c.lineWidth = 0.6; c.beginPath(); c.moveTo(-8, -1); c.lineTo(8, -1); c.moveTo(-4, -5); c.lineTo(-4, 3); c.moveTo(3, -5.4); c.lineTo(3, 3.4); c.stroke();
  ell(c, 14.5, 0.6, 4, 2.8, '#6fae78'); circ(c, 16.2, -0.2, 0.6, '#0c2c44');
  c.restore();
}
function sub(c, x, y, s, dir, t) {
  c.save(); c.translate(x, y); c.scale(dir * s, s);
  c.fillStyle = 'rgba(40,40,48,0.5)'; c.fillRect(-31, -6 * Math.abs(Math.sin(t * 22)), 1.6, 12 * Math.abs(Math.sin(t * 22)));
  poly(c, [[-22, 0], [-30, -6], [-27, 0], [-30, 6]], '#2a2f3a');
  c.fillStyle = vgrad(c, -8, 8, ['#565f70', '#2f3644', '#171b24']); c.beginPath(); c.ellipse(0, 0, 27, 8, 0, 0, TAU); c.fill();
  rrect(c, -4, -15, 12, 9, 2, '#2f3644'); rect(c, 2, -21, 1, 6, '#2f3644'); rect(c, 2, -21, 4, 1, '#2f3644');
  rect(c, -24, -0.8, 48, 1.6, '#c8102e');
  for (let k = 0; k < 4; k++) circ(c, -8 + k * 7, -3, 1.3, '#ff8a5c');
  c.restore();
}

export default {
  id: 'atlantis',
  page: '#27b7c9', meta: '#27b7c9',
  footer: ['rgba(224,250,255,0.92)', '#ffffff', 'rgba(255,255,255,0.4)'],
  brand: { fill: '#ffffff', glows: [{ color: 'rgba(0,70,110,0.55)', blur: 16, dy: 2 }, { color: 'rgba(0,70,110,0.35)', blur: 5, dy: 1 }] },
  cityFx: CITY_FX, baseFx: BASE_FX, baseH: 28, cityBox: [70, 62, 4],
  cityLabel: 'DOMES', cityOne: 'DOME',
  prompt: 'Defend the domes. Each turret holds ten torpedoes.',
  threat: [255, 92, 70], smart: [255, 214, 80], abm: [236, 255, 255], abmHead: '#ffffff', threatAlpha: 0.55, abmAlpha: 0.75, marker: ['#ffffff', '#0b3a5c'],
  blast: ['rgba(255,255,255,0.96)', 'rgba(180,252,255,0.78)', 'rgba(70,205,235,0.42)', 'rgba(70,205,235,0)'],
  groundBlast: ['rgba(255,255,255,0.96)', 'rgba(255,230,170,0.8)', 'rgba(255,140,90,0.45)', 'rgba(70,205,235,0)'],
  fx: { spark: '225,255,255', debris: '255,206,130', smoke: '225,255,255', city: '255,244,200', glow: '190,250,255', ring: '235,255,255', flash: '200,255,255', gravity: -70, drag: 0.12, chunkG: 110, chunkDrag: 0.18, shape: 'circle', linger: false, ruinSmoke: false },
  ui: { text: '#ffffff', shadow: 'rgba(0,50,90,0.65)', muted: 'rgba(255,255,255,0.9)', panel: 'rgba(255,255,255,0.93)', line: 'rgba(11,58,92,0.15)', ptext: '#0b3a5c', pmuted: 'rgba(11,58,92,0.68)', accent: '#0a8fb5', warn: '#d1452f', gold: '#a8730a', cross: '#ffffff', veil: 'rgba(220,250,255,0.3)' },

  init() {
    const r = srand(5);
    this.kelp = Array.from({ length: 16 }, () => ({ fx: r(), h: 70 + r() * 110, ph: r() * TAU, col: r() < 0.5 ? ['#1f8f6a', '#0f5f55'] : ['#2aa37a', '#14705f'] }));
    this.schools = [
      { x: 0.2, y: 0.5, v: 0.03, col: ['#ff9a3c', '#e8721c', '#ffffff'], n: 13, s: 1 },
      { x: 0.8, y: 0.34, v: -0.024, col: ['#ffe066', '#e0b020', '#3a7bd5'], n: 16, s: 0.8 },
      { x: 0.5, y: 0.62, v: 0.02, col: ['#c9e9f5', '#8fbfd6', '#5f8fb0'], n: 20, s: 0.6 },
    ].map(sc => ({ ...sc, off: Array.from({ length: sc.n }, () => [r() * 90 - 45, r() * 44 - 22, r() * TAU]), scare: 0 }));
    this.jellies = Array.from({ length: 5 }, (_, k) => ({ x: r(), y: r(), s: 0.7 + r() * 0.8, ph: r() * 9, col: ['255,150,200', '190,150,255', '150,220,255'][k % 3] }));
    this.whale = { x: -0.3, y: 0.3, dir: 1, wait: 3, on: false };
    this.turtle = { x: 0.6, y: 0.56, dir: -1 };
    this.motes = Array.from({ length: 70 }, () => [r(), r(), r() * TAU, 0.4 + r()]);
    this.vents = [0.14, 0.44, 0.57, 0.87];
  },
  layout() { this.hz = G - clamp(G * 0.15, 48, 124); },

  backdrop(o) {
    const hz = this.hz;
    o.fillStyle = vgrad(o, 0, G, [[0, '#c9fff4'], [0.06, '#7fe9e2'], [0.28, '#2fc0d0'], [0.55, '#1291b8'], [0.82, '#0b6a9a'], [1, '#0a5484']]);
    o.fillRect(0, 0, W, H);
    o.fillStyle = rgrad(o, W * 0.5, -G * 0.15, 0, G * 0.9, ['rgba(255,255,240,0.5)', 'rgba(255,255,240,0)']); o.fillRect(0, 0, W, G);
    // drowned ruins and seamounts, fading with distance
    const rr = srand(3);
    ridge(o, 0, W, hz, x => (30 + 110 * Math.pow(fbm((x * 0.0035) / u, 4, 3), 2.2)) * u, 'rgba(22,128,170,0.55)');
    for (let i = 0; i < 9; i++) {                         // broken colonnades
      const x = rr() * W, s = (0.7 + rr() * 0.9) * u, n = 2 + ((rr() * 4) | 0), h = (34 + rr() * 30) * s;
      o.fillStyle = 'rgba(30,140,180,0.6)';
      for (let k = 0; k < n; k++) { const hh = h * (rr() < 0.3 ? 0.4 + rr() * 0.4 : 1); o.fillRect(x + k * 15 * s, hz - hh, 6 * s, hh + 4); o.fillRect(x + k * 15 * s - 1.5 * s, hz - hh, 9 * s, 2.5 * s); }
      if (rr() < 0.6) o.fillRect(x - 3 * s, hz - h - 5 * s, (n - 1) * 15 * s * 0.7 + 12 * s, 5 * s);
    }
    ridge(o, 0, W, hz, x => (10 + 60 * Math.pow(fbm((x * 0.006) / u, 9, 3), 2)) * u, 'rgba(14,104,150,0.75)');
    // the seabed, receding
    o.fillStyle = vgrad(o, hz, G, ['#2a93b5', '#62b3b8', '#c9d4a8', '#e6d7a4']);
    o.fillRect(0, hz, W, G - hz + 2);
    const rs = srand(8);
    for (let i = 0; i < (W * (G - hz)) / 260; i++) {
      const d = Math.pow(rs(), 0.7), y = hz + d * (G - hz), x = rs() * W;
      o.strokeStyle = rs() < 0.5 ? 'rgba(255,255,255,' + 0.25 * d + ')' : 'rgba(120,110,70,' + 0.22 * d + ')'; o.lineWidth = 1;
      o.beginPath(); o.moveTo(x, y); o.quadraticCurveTo(x + (8 + 16 * d) * u, y - 2 * d * u, x + (16 + 34 * d) * u, y); o.stroke();
    }
    for (let i = 0; i < W / 26; i++) {                     // rocks, corals, sponges and anemones
      const d = 0.35 + rs() * 0.65, x = rs() * W, y = hz + d * (G - hz), s = (0.5 + d * 0.9) * u, t = rs();
      if (t < 0.25) { o.fillStyle = '#5f8a94'; o.beginPath(); o.ellipse(x, y, 9 * s, 5 * s, 0, Math.PI, 0); o.fill(); o.fillStyle = 'rgba(255,255,255,0.2)'; o.beginPath(); o.ellipse(x - 2 * s, y - 2 * s, 4 * s, 1.6 * s, 0, 0, TAU); o.fill(); }
      else if (t < 0.6) branch(o, x, y, -Math.PI / 2, (9 + rs() * 7) * s, 4, ['#ff7a9a', '#ff9f5a', '#c78bff', '#ffd166'][(rs() * 4) | 0], rs, s);
      else if (t < 0.8) { for (let k = 0; k < 3; k++) { const hh = (8 + rs() * 12) * s; o.fillStyle = hgrad(o, x + k * 4 * s, x + k * 4 * s + 3.4 * s, ['#b78bff', '#7a52c8']); o.fillRect(x + k * 4 * s, y - hh, 3.4 * s, hh); o.fillStyle = '#4a2f8a'; o.beginPath(); o.ellipse(x + k * 4 * s + 1.7 * s, y - hh, 1.7 * s, 0.8 * s, 0, 0, TAU); o.fill(); } }
      else { o.fillStyle = '#ff8fa3'; for (let k = -3; k <= 3; k++) { o.beginPath(); o.ellipse(x + k * 1.6 * s, y - 4 * s, 1 * s, 5 * s, k * 0.16, 0, TAU); o.fill(); } o.fillStyle = '#e0607c'; o.beginPath(); o.ellipse(x, y, 6 * s, 2.4 * s, 0, 0, TAU); o.fill(); }
    }
    o.fillStyle = vgrad(o, hz - 30 * u, hz + 30 * u, ['rgba(20,140,180,0)', 'rgba(36,150,186,0.5)', 'rgba(36,150,186,0)']); o.fillRect(0, hz - 30 * u, W, 60 * u);
  },

  tick(dt) {
    for (const s of this.schools) {
      s.x += s.v * dt; if (s.x > 1.15) s.x = -0.15; if (s.x < -0.15) s.x = 1.15;
      s.scare = Math.max(0, s.scare - dt);
      for (const b of game.blasts) if (b.t < 0.06 && Math.hypot(b.x - s.x * W, b.y - s.y * G) < 170 * u) s.scare = 1.2;
    }
    for (const j of this.jellies) { j.y -= 0.012 * j.s * dt; j.x += 0.004 * Math.sin(time * 0.3 + j.ph) * dt; if (j.y < -0.1) { j.y = 0.92; j.x = Math.random(); } }
    const w = this.whale;
    if (!w.on) { w.wait -= dt; if (w.wait <= 0) { w.on = true; w.dir = Math.random() < 0.5 ? 1 : -1; w.x = w.dir > 0 ? -0.25 : 1.25; w.y = rand(0.2, 0.42); } }
    else { w.x += w.dir * 0.018 * dt; if (w.x > 1.3 || w.x < -0.3) { w.on = false; w.wait = rand(14, 30); } }
    const t = this.turtle; t.x += t.dir * 0.014 * dt; if (t.x < -0.1) { t.dir = 1; t.y = rand(0.4, 0.66); } if (t.x > 1.1) { t.dir = -1; t.y = rand(0.4, 0.66); }
  },

  ambient(c) {
    const hz = this.hz;
    // the whale and her calf, far off
    const w = this.whale;
    if (w.on) {
      c.globalAlpha = 0.6;
      whale(c, w.x * W, w.y * G + Math.sin(time * 0.4) * 8 * u, 1.9 * u, w.dir, time);
      whale(c, (w.x - w.dir * 0.11) * W, (w.y + 0.07) * G + Math.sin(time * 0.5 + 1) * 6 * u, 0.9 * u, w.dir, time + 1.4);
      c.globalAlpha = 1;
    }
    // sunbeams swaying through the water
    if (!game.lowFx) {
      c.globalCompositeOperation = 'lighter';
      for (let k = 0; k < 7; k++) {
        const x0 = W * (0.04 + k * 0.155) + Math.sin(time * 0.17 + k * 1.7) * 36 * u, wd = (26 + (k % 3) * 22) * u, L = G * (0.72 + (k % 2) * 0.2), sl = L * 0.24, a = 0.1 + 0.06 * Math.sin(time * 0.5 + k * 2.3);
        c.fillStyle = vgrad(c, 0, L, ['rgba(220,255,245,' + a + ')', 'rgba(220,255,245,0)']);
        c.beginPath(); c.moveTo(x0, 0); c.lineTo(x0 + wd, 0); c.lineTo(x0 + wd * 2.4 + sl, L); c.lineTo(x0 - wd * 0.6 + sl, L); c.fill();
      }
      c.globalCompositeOperation = 'source-over';
    }
    // ripples of light under the surface
    c.strokeStyle = 'rgba(255,255,255,0.5)'; c.lineWidth = 1.4 * u;
    for (let r = 0; r < 3; r++) {
      c.beginPath();
      for (let x = -10; x <= W + 10; x += 14) c.lineTo(x, (5 + r * 7) * u + Math.sin(x * 0.02 / u + time * (1.1 + r * 0.3) + r * 2) * 2.4 * u + Math.sin(x * 0.047 / u - time * 0.7) * 1.4 * u);
      c.globalAlpha = 0.6 - r * 0.17; c.stroke();
    }
    c.globalAlpha = 1;
    for (const [mx, my, ph, sp] of this.motes) {           // drifting plankton
      const y = ((my - time * 0.006 * sp) % 1 + 1) % 1;
      c.fillStyle = 'rgba(255,255,255,' + (0.25 + 0.25 * Math.sin(time * sp + ph)) + ')';
      c.fillRect(mx * W + Math.sin(time * 0.4 * sp + ph) * 10 * u, y * G, 1.5 * u, 1.5 * u);
    }
    // kelp forest
    for (const k of this.kelp) {
      const x0 = k.fx * W, hh = k.h * u, n = 9;
      c.strokeStyle = k.col[1]; c.lineWidth = 2.2 * u; c.lineCap = 'round';
      c.beginPath(); c.moveTo(x0, G);
      const pts = [];
      for (let q = 1; q <= n; q++) { const t = q / n, x = x0 + Math.sin(time * 0.8 + q * 0.55 + k.ph) * t * 12 * u, y = G - hh * t; pts.push([x, y]); c.lineTo(x, y); }
      c.stroke();
      pts.forEach(([x, y], q) => { const side = q % 2 ? 1 : -1, a = side * (0.7 + 0.25 * Math.sin(time * 0.8 + q + k.ph)); c.save(); c.translate(x, y); c.rotate(a); ell(c, 0, -6 * u, 2.6 * u, 7 * u, q % 3 ? k.col[0] : k.col[1]); c.restore(); });
    }
    // vents sending up strings of bubbles
    for (const [i, f] of this.vents.entries()) {
      for (let q = 0; q < 9; q++) {
        const p = (time * 0.11 + q / 9 + i * 0.37) % 1, x = f * W + Math.sin(p * 11 + q + i) * 9 * u * p, y = G - p * G * 0.8, r = (1.2 + p * 3) * u;
        c.strokeStyle = 'rgba(255,255,255,' + 0.7 * (1 - p) + ')'; c.lineWidth = 1; c.beginPath(); c.arc(x, y, r, 0, TAU); c.stroke();
        c.fillStyle = 'rgba(255,255,255,' + 0.6 * (1 - p) + ')'; c.fillRect(x - r * 0.45, y - r * 0.45, r * 0.35, r * 0.35);
      }
    }
    const tt = this.turtle; turtle(c, tt.x * W, tt.y * G + Math.sin(time * 0.6) * 6 * u, 1.3 * u, tt.dir, time);
    for (const j of this.jellies) jelly(c, j.x * W, j.y * G, j.s * u, time + j.ph, j.col);
    for (const s of this.schools) {
      const cx = s.x * W, cy = s.y * G + Math.sin(time * 0.5 + s.n) * 14 * u, dir = Math.sign(s.v), sp = 1 + s.scare * 1.6;
      for (const [ox, oy, ph] of s.off) fish(c, cx + ox * u * sp + Math.sin(time * 1.3 + ph) * 4 * u, cy + oy * u * sp + Math.cos(time * 1.1 + ph) * 3 * u, s.s * u, dir, s.col, Math.sin(time * 9 + ph) * 1.4);
    }
  },

  foreground(o) {
    const bt = G - this.baseH * u, rb = srand(6);
    o.fillStyle = vgrad(o, G, H, ['#0f6c8e', '#0a4666', '#062a44']);
    o.fillRect(0, G, W, H - G + 2);
    for (let i = 0; i < W / 9; i++) { o.fillStyle = rb() < 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(0,20,40,0.14)'; o.beginPath(); o.ellipse(rb() * W, G + rb() * (H - G), (6 + rb() * 22) * u, (2 + rb() * 5) * u, 0, 0, TAU); o.fill(); }
    for (const f of BASE_FX) {                             // rocky outcrops for the turrets
      const x = f * W, w = 54 * u;
      o.beginPath(); o.moveTo(x - w, G + 3);
      o.bezierCurveTo(x - w * 0.8, G - 10 * u, x - w * 0.55, bt + 4 * u, x - w * 0.3, bt); o.lineTo(x + w * 0.3, bt);
      o.bezierCurveTo(x + w * 0.5, bt + 2 * u, x + w * 0.85, G - 12 * u, x + w, G + 3); o.closePath();
      o.fillStyle = lgrad(o, x - w, bt, x + w, G, ['#7fb0b8', '#4f8794', '#2a5f70']); o.fill();
      o.strokeStyle = 'rgba(255,255,255,0.3)'; o.lineWidth = 1; o.stroke();
      for (let k = 0; k < 5; k++) { const bx = x + (rb() - 0.5) * w * 1.4, by = G - rb() * 8 * u; branch(o, bx, by, -Math.PI / 2, (5 + rb() * 5) * u, 3, ['#ff7a9a', '#ffd166', '#c78bff'][k % 3], rb, u * 0.8); }
    }
    o.fillStyle = 'rgba(255,255,255,0.35)'; o.fillRect(0, G - 0.5, W, 1);
    for (let x = 0; x < W; x += (16 + rb() * 30) * u) {     // reef edge
      if (BASE_FX.some(f => Math.abs(x - f * W) < 60 * u)) continue;
      const t = rb();
      if (t < 0.5) branch(o, x, G + 2 * u, -Math.PI / 2, (5 + rb() * 6) * u, 3, ['#ff7a9a', '#ff9f5a', '#c78bff', '#62d6b4'][(rb() * 4) | 0], rb, u * 0.8);
      else { o.fillStyle = '#3f7f8f'; o.beginPath(); o.ellipse(x, G + 2 * u, (5 + rb() * 6) * u, (3 + rb() * 3) * u, 0, Math.PI, 0); o.fill(); }
    }
  },

  cityArt(c, i) { ART[i](c); },
  ruinArt(c, i) {
    ruinFrom(c, ART[i], { seed: i + 31, cut: 11, a: '#5f8f9a', b: '#c9d6d2', tint: 'rgba(10,50,80,0.45)' });
    c.strokeStyle = 'rgba(255,255,255,0.7)'; c.lineWidth = 0.6; c.lineCap = 'round';                // shards of the dome
    for (const [a0, a1] of [[0.05, 0.3], [2.75, 3.08]]) { c.beginPath(); c.ellipse(0, 0, 29, 40, 0, a0, a1); c.stroke(); }
  },

  cityAnim(c, i, city) {
    if (!city.alive) return;
    const tops = [[2.5, 49.5], [18, 49], [0, 0], [6.5, 57], [0, 34], [-3.5, 46]][i];
    if (i !== 2) beacon(c, tops[0], tops[1], 0.8, '255,240,170', Math.floor(time * 1.2 + i * 0.4) % 2 === 0);
    if (i === 3) {                                         // searchlight sweeping from the pearl spire
      const a = Math.PI / 2 + Math.sin(time * 0.5) * 1.1, L = 62;
      c.fillStyle = lgrad(c, 6.5, 45, 6.5 + Math.cos(a) * L, 45 + Math.sin(a) * L, ['rgba(255,250,210,0.5)', 'rgba(255,250,210,0)']);
      c.beginPath(); c.moveTo(6.5, 45); c.lineTo(6.5 + Math.cos(a - 0.13) * L, 45 + Math.sin(a - 0.13) * L); c.lineTo(6.5 + Math.cos(a + 0.13) * L, 45 + Math.sin(a + 0.13) * L); c.fill();
    }
    const g = (time * 0.3 + i * 0.17) % 1;                 // a glint sliding over the glass
    c.fillStyle = 'rgba(255,255,255,' + 0.55 * Math.sin(g * Math.PI) + ')';
    c.beginPath(); c.ellipse(-20 + g * 30, 14 + Math.sin(g * Math.PI) * 14, 1.5, 5, -0.6, 0, TAU); c.fill();
  },

  // Broken domes leak air.
  ruinSmoke(city, x) {
    puff(x + rand(-14, 14) * u, G - rand(2, 10) * u, { kind: 'bubble', rgb: '255,255,255', r: rand(1.2, 3) * u, gr: 1.2 * u, a: 0.85, fa: 0.28, vx: 0, vy: -rand(40, 80) * u });
  },
  onBlast(b) {
    const n = b.kind === 'ground' ? 14 : 8;
    for (let k = 0; k < n; k++) { const a = Math.random() * TAU, d = Math.random() * b.max * 0.9; puff(b.x + Math.cos(a) * d, b.y + Math.sin(a) * d, { kind: 'bubble', rgb: '255,255,255', r: rand(1.2, 3.4) * u, gr: 1.5 * u, a: 0.9, fa: 0.45, vx: Math.cos(a) * 20 * u, vy: -rand(30, 90) * u }); }
  },
  trail(t, dt) { if (Math.random() < dt * 9) puff(t.x + rand(-2, 2) * u, t.y - 4 * u, { kind: 'bubble', rgb: '255,255,255', r: rand(0.8, 2) * u, gr: 1 * u, a: 0.7, fa: 0.6, vy: -rand(20, 46) * u }); },
  shotTrail(s, dt) { if (Math.random() < dt * 26) puff(s.x + rand(-2, 2) * u, s.y + rand(-2, 2) * u, { kind: 'bubble', rgb: '255,255,255', r: rand(0.8, 2.2) * u, gr: 1.4 * u, a: 0.75, fa: 0.9, vy: -rand(10, 30) * u }); },

  base(c, b) {
    if (b.alive) {
      let ang = Math.PI / 2;
      const p = game.pointer;
      if (p.inside && game.mode === 'playing') ang = clamp(Math.atan2(G - this.baseH * u - p.y, p.x - b.fx * W), 0.3, Math.PI - 0.3);
      const hot = clamp(1 - (time - b.fireT) * 4, 0, 1);
      c.save(); c.translate(0, 6); c.rotate(ang);
      for (const dy of [-2.6, 0, 2.6]) rect(c, 2, dy - 0.8, 13 - hot * 3, 1.6, GOLD[1]);
      rect(c, 12 - hot * 3, -4, 1.6, 8, GOLD[2]);
      c.restore();
      pearlBall(c, 0, 6, 8);
      c.fillStyle = hgrad(c, -10, 10, [GOLD[2], GOLD[0], GOLD[1], GOLD[2]]); c.fillRect(-10, 0, 20, 2.6);
      circ(c, 0, 6.4, 3, GOLD[1]); circ(c, 0, 6.4, 2.1, hot > 0 ? '#ffffff' : '#27b7c9');
      if (hot > 0) soft(c, 0, 6.4, 14 * hot, '200,255,255', hot);
    } else {
      poly(c, [[-9, 0], [-4, 5], [0, 2], [5, 6], [9, 0]], '#4f8794');
    }
    pips(c, b, '#ffffff', 'rgba(255,255,255,0.18)', { round: true, y: -5 });
  },

  head(c, t) {                                             // depth charge, or a spiked mine
    c.save(); c.translate(t.x, t.y); c.scale(u, u);
    if (t.kind === 'smart') {
      c.rotate(time * 2);
      c.strokeStyle = '#3a3320'; c.lineWidth = 1.4;
      for (let k = 0; k < 8; k++) { const a = (k / 8) * TAU; c.beginPath(); c.moveTo(Math.cos(a) * 4, Math.sin(a) * 4); c.lineTo(Math.cos(a) * 8.5, Math.sin(a) * 8.5); c.stroke(); circ(c, Math.cos(a) * 8.5, Math.sin(a) * 8.5, 1, '#ffd650'); }
      c.fillStyle = rgrad(c, -1.5, -1.5, 0.5, 6, ['#8a8060', '#4a4430', '#22200f']); c.beginPath(); c.arc(0, 0, 5.6, 0, TAU); c.fill();
      circ(c, 0, 0, 1.6, Math.floor(time * 6) % 2 ? '#ff5a3c' : '#7a1c10');
    } else {
      c.rotate(Math.atan2(t.vy, t.vx) - Math.PI / 2);
      rrect(c, -3.4, -5.5, 6.8, 11, 1.6, '#2f3644');
      c.fillStyle = 'rgba(255,255,255,0.2)'; c.fillRect(-2.6, -5, 1.4, 10);
      rect(c, -3.4, -2.2, 6.8, 1.3, '#ff5c46'); rect(c, -3.4, 1.2, 6.8, 1.3, '#ff5c46');
      circ(c, 0, 5.6, 1.4, Math.floor(time * 5 + t.sx) % 2 ? '#ff8a5c' : '#ffe0c0');
    }
    c.restore();
    soft(c, t.x, t.y, 9 * u, '255,120,90', 0.35);
  },
  shotHead(c, s) {                                         // torpedo
    soft(c, s.x, s.y, 8 * u, '220,255,255', 0.7);
    c.save(); c.translate(s.x, s.y); c.rotate(Math.atan2(s.vy, s.vx)); c.scale(u, u);
    poly(c, [[-5, 0], [-7.5, -2.6], [-4, -1]], GOLD[2]); poly(c, [[-5, 0], [-7.5, 2.6], [-4, 1]], GOLD[2]);
    rrect(c, -5, -1.6, 9, 3.2, 1.6, '#f4fbff'); circ(c, 4, 0, 1.6, GOLD[1]);
    c.restore();
  },
  blastExtra(c, b) {
    const k = b.r / b.max;
    c.strokeStyle = 'rgba(255,255,255,' + 0.8 * k + ')'; c.lineWidth = 1;
    for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU + b.seed * 6, d = b.r * (0.86 + 0.1 * Math.sin(time * 9 + i)); c.beginPath(); c.arc(b.x + Math.cos(a) * d, b.y + Math.sin(a) * d, (1.4 + (i % 3)) * u * k, 0, TAU); c.stroke(); }
  },
  particle(c, p, a, s) {
    c.strokeStyle = 'rgba(' + p.rgb + ',' + a + ')'; c.lineWidth = 1; c.beginPath(); c.arc(p.x, p.y, s * 0.9, 0, TAU); c.stroke();
    return true;
  },

  flyer(c, f) { sub(c, f.x, f.y + Math.sin(time * 1.2 + f.x * 0.01) * 3 * u, 1.15 * u, Math.sign(f.vx), time); },
};

// Branching coral.
function branch(o, x, y, a, len, depth, col, rnd, s) {
  const x2 = x + Math.cos(a) * len, y2 = y + Math.sin(a) * len;
  o.strokeStyle = col; o.lineWidth = Math.max(1, depth * 0.9 * s); o.lineCap = 'round';
  o.beginPath(); o.moveTo(x, y); o.lineTo(x2, y2); o.stroke();
  if (depth <= 1) { o.fillStyle = 'rgba(255,255,255,0.6)'; o.beginPath(); o.arc(x2, y2, 0.9 * s, 0, TAU); o.fill(); return; }
  const n = 2 + (rnd() < 0.4 ? 1 : 0);
  for (let k = 0; k < n; k++) branch(o, x2, y2, a + (k - (n - 1) / 2) * 0.7 + (rnd() - 0.5) * 0.3, len * (0.62 + rnd() * 0.2), depth - 1, col, rnd, s);
}
