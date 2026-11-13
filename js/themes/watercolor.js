// Watercolor: a storybook valley painted on textured paper, with ink outlines.
import {
  TAU, W, H, G, u, time, game, srand, rand, clamp, fbm, mix, mkCanvas,
  rect, poly, circ, ell, line, vgrad, hgrad, lgrad, rgrad, soft,
  Clouds, Flock, groundPath, pips, ruinFrom,
} from '../core.js';

const CITY_FX = [0.215, 0.3, 0.385, 0.615, 0.7, 0.785];
const BASE_FX = [0.08, 0.5, 0.92];
const INK = 'rgba(44,40,62,0.86)';
const WALLS = ['#f2b8a8', '#f6dc8a', '#a9d3ee', '#b7e0c4', '#e9c3e8', '#f7e7c6'];
const ROOFS = ['#c0533e', '#5f7aa0', '#8a5a9e', '#3f7f7a', '#b9772f'];

// ---------- brush helpers
// Irregular blob outline, the basis of every wash.
function blob(c, x, y, rx, ry, rnd, wob = 0.14) {
  const n = 28, p1 = rnd() * TAU, p2 = rnd() * TAU;
  c.beginPath();
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * TAU, k = 1 + wob * (Math.sin(a * 3 + p1) * 0.6 + Math.sin(a * 5 + p2) * 0.4) + (rnd() - 0.5) * wob * 0.6;
    const px = x + Math.cos(a) * rx * k, py = y + Math.sin(a) * ry * k;
    if (i) c.lineTo(px, py); else c.moveTo(px, py);
  }
  c.closePath();
}
// Layered translucent wash with a slightly darker pooled edge.
function wash(c, x, y, rx, ry, color, alpha, seed, passes = 4) {
  const rnd = srand(seed);
  for (let p = 0; p < passes; p++) {
    blob(c, x + (rnd() - 0.5) * rx * 0.15, y + (rnd() - 0.5) * ry * 0.15, rx * (0.85 + rnd() * 0.2), ry * (0.85 + rnd() * 0.2), rnd, 0.16);
    c.globalAlpha = alpha; c.fillStyle = color; c.fill();
    c.globalAlpha = alpha * 0.55; c.strokeStyle = color; c.lineWidth = 1.5; c.stroke();
  }
  c.globalAlpha = 1;
}
// Painted polygon in unit coordinates: uneven wash, pooled edge, then a wobbly ink line.
function wpoly(c, pts, fill, rnd, ink = true) {
  const path = (j) => { c.beginPath(); pts.forEach(([x, y], k) => { const px = x + (rnd() - 0.5) * j, py = y + (rnd() - 0.5) * j; if (k) c.lineTo(px, py); else c.moveTo(px, py); }); c.closePath(); };
  path(0.3); c.globalAlpha = 0.82; c.fillStyle = fill; c.fill();
  path(1); c.globalAlpha = 0.22; c.fill();
  c.globalAlpha = 0.35; c.strokeStyle = fill; c.lineWidth = 0.9; c.stroke();
  c.globalAlpha = 1;
  if (!ink) return;
  c.strokeStyle = INK; c.lineWidth = 0.55; c.lineJoin = 'round'; c.lineCap = 'round';
  c.beginPath();
  for (let k = 0; k < pts.length; k++) {                  // each edge drawn separately, overshooting the corners
    const [x0, y0] = pts[k], [x1, y1] = pts[(k + 1) % pts.length], dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1, o = 0.5;
    c.moveTo(x0 - (dx / L) * o + (rnd() - 0.5) * 0.4, y0 - (dy / L) * o + (rnd() - 0.5) * 0.4);
    c.quadraticCurveTo((x0 + x1) / 2 + (rnd() - 0.5) * 0.8, (y0 + y1) / 2 + (rnd() - 0.5) * 0.8, x1 + (dx / L) * o + (rnd() - 0.5) * 0.4, y1 + (dy / L) * o + (rnd() - 0.5) * 0.4);
  }
  c.stroke();
}
const wbox = (c, x, y, w, h, fill, rnd, ink) => wpoly(c, [[x, y], [x + w, y], [x + w, y + h], [x, y + h]], fill, rnd, ink);
function wcirc(c, x, y, r, fill, rnd) {
  blob(c, x, y, r, r, rnd, 0.1); c.globalAlpha = 0.8; c.fillStyle = fill; c.fill(); c.globalAlpha = 1;
  c.strokeStyle = INK; c.lineWidth = 0.5; blob(c, x, y, r, r, rnd, 0.08); c.stroke();
}
function cottage(c, x, w, h, wall, roof, rnd, chimney = true) {
  if (chimney) wbox(c, x + w * 0.66, h + w * 0.1, w * 0.16, w * 0.42, '#b98a6a', rnd);
  wbox(c, x, 0, w, h, wall, rnd);
  wpoly(c, [[x - 1.4, h], [x + w / 2, h + w * 0.56], [x + w + 1.4, h]], roof, rnd);
  wbox(c, x + w * 0.16, h * 0.42, w * 0.24, h * 0.3, '#ffe38f', rnd);
  line(c, x + w * 0.28, h * 0.42, x + w * 0.28, h * 0.72, INK, 0.3);
  wbox(c, x + w * 0.58, 0, w * 0.24, h * 0.52, '#8a5a3c', rnd);
}
function tree(c, x, h, col, rnd) {
  line(c, x, 0, x + (rnd() - 0.5), h * 0.55, INK, 0.6);
  wcirc(c, x, h * 0.72, h * 0.3, col, rnd);
}

// ---------- six little places
const ART = [
  c => { const r = srand(11); tree(c, -29, 12, '#7fb685', r); cottage(c, -24, 13, 10, WALLS[0], ROOFS[0], r); cottage(c, -8, 16, 14, WALLS[2], ROOFS[1], r); cottage(c, 11, 13, 10, WALLS[1], ROOFS[3], r); tree(c, 28, 14, '#93c48f', r); },
  c => {                                                  // church
    const r = srand(23);
    tree(c, -28, 15, '#7fb685', r);
    wbox(c, -8, 0, 26, 15, WALLS[5], r);
    wpoly(c, [[-9.5, 15], [5, 27], [19.5, 15]], ROOFS[1], r);
    wbox(c, -19, 0, 11, 30, WALLS[5], r);
    wpoly(c, [[-20.5, 30], [-13.5, 56], [-6.5, 30]], ROOFS[1], r);
    line(c, -13.5, 56, -13.5, 61, INK, 0.6); line(c, -15.2, 59, -11.8, 59, INK, 0.6);
    wcirc(c, -13.5, 21, 2.4, '#ffe38f', r);
    for (const x of [-3, 3.5, 10]) { wpoly(c, [[x, 4], [x + 3, 4], [x + 3, 9.5], [x + 1.5, 11.6], [x, 9.5]], '#9ec7ea', r); }
    wpoly(c, [[-16, 0], [-11, 0], [-11, 7], [-13.5, 9.4], [-16, 7]], '#8a5a3c', r);
    cottage(c, 21, 9, 8, WALLS[3], ROOFS[0], r, false);
  },
  c => {                                                  // windmill (sails turn in cityAnim)
    const r = srand(37);
    cottage(c, -29, 13, 9, WALLS[1], ROOFS[2], r);
    wpoly(c, [[-9, 0], [9, 0], [5.5, 34], [-5.5, 34]], '#f3ead8', r);
    wpoly(c, [[-6.8, 34], [0, 43], [6.8, 34]], ROOFS[0], r);
    wbox(c, -2.4, 0, 4.8, 8, '#8a5a3c', r);
    wbox(c, -2, 16, 4, 5, '#9ec7ea', r); wbox(c, -1.6, 26, 3.2, 4, '#9ec7ea', r);
    line(c, -8, 11, 8, 11, INK, 0.4);
    tree(c, 18, 13, '#93c48f', r); tree(c, 26, 17, '#6fa37f', r);
  },
  c => {                                                  // row of tall town houses
    const r = srand(41);
    [[-28, 11, 26, 0, 0], [-17, 10, 32, 1, 3], [-7, 12, 24, 2, 1], [5, 10, 34, 4, 2], [15, 12, 27, 3, 4]].forEach(([x, w, h, wi, ri]) => {
      wbox(c, x, 0, w, h, WALLS[wi], r);
      wpoly(c, [[x - 0.8, h], [x + w * 0.2, h], [x + w * 0.2, h + 3], [x + w * 0.4, h + 3], [x + w * 0.4, h + 6], [x + w * 0.6, h + 6], [x + w * 0.6, h + 3], [x + w * 0.8, h + 3], [x + w * 0.8, h], [x + w + 0.8, h]], ROOFS[ri], r);
      for (let f = 0; f < Math.floor((h - 9) / 7); f++) for (let q = 0; q < 2; q++) wbox(c, x + w * (0.16 + q * 0.42), 10 + f * 7, w * 0.26, 4.2, f % 2 ? '#ffe38f' : '#9ec7ea', r);
      wbox(c, x + w * 0.34, 0, w * 0.32, 7, '#8a5a3c', r);
    });
  },
  c => {                                                  // old keep (flag flies in cityAnim)
    const r = srand(53);
    wbox(c, -4, 0, 28, 17, '#d9d2c6', r);
    wpoly(c, [[-5.5, 17], [10, 28], [25.5, 17]], ROOFS[4], r);
    for (const x of [1, 9, 17]) wbox(c, x, 6, 3.6, 6, '#9ec7ea', r);
    wbox(c, -21, 0, 15, 40, '#cfc7ba', r);
    wpoly(c, [[-22.5, 40], [-22.5, 45], [-18.6, 45], [-18.6, 42], [-15.4, 42], [-15.4, 45], [-11.6, 45], [-11.6, 42], [-8.4, 42], [-8.4, 45], [-4.5, 45], [-4.5, 40]], '#cfc7ba', r);
    wpoly(c, [[-16, 0], [-11, 0], [-11, 8], [-13.5, 10.5], [-16, 8]], '#6b4a34', r);
    for (const y of [18, 29]) wbox(c, -14.7, y, 2.4, 5.4, '#4a4660', r);
    line(c, -13.5, 45, -13.5, 60, INK, 0.6);
    tree(c, 29, 13, '#7fb685', r);
  },
  c => {                                                  // farm: barn, silo, haystacks
    const r = srand(67);
    wbox(c, -29, 0, 9, 30, '#e9e2d0', r);
    c.globalAlpha = 0.85; c.fillStyle = ROOFS[1]; c.beginPath(); c.arc(-24.5, 30, 4.7, 0, Math.PI); c.fill(); c.globalAlpha = 1;
    c.strokeStyle = INK; c.lineWidth = 0.55; c.beginPath(); c.arc(-24.5, 30, 4.8, 0, Math.PI); c.stroke();
    for (const y of [8, 16, 24]) line(c, -29, y, -20, y + 0.4, INK, 0.3);
    wpoly(c, [[-17, 0], [9, 0], [9, 14], [5, 21], [-4, 25], [-13, 21], [-17, 14]], '#c8504a', r);
    wpoly(c, [[-18.5, 14], [-13, 22.4], [-4, 26.6], [5, 22.4], [10.5, 14], [9, 13.4], [5, 20.4], [-4, 24], [-13, 20.4], [-17, 13.4]], '#7a2f2c', r);
    wbox(c, -9, 0, 10, 11, '#f6efe0', r);
    line(c, -9, 0, 1, 11, INK, 0.4); line(c, 1, 0, -9, 11, INK, 0.4);
    wbox(c, -5.6, 15.5, 3.2, 3.6, '#f6efe0', r);
    for (const [x, s] of [[16, 1], [24, 0.8]]) { c.globalAlpha = 0.85; c.fillStyle = '#e8c868'; c.beginPath(); c.ellipse(x, 0, 5.5 * s, 8 * s, 0, 0, Math.PI); c.fill(); c.globalAlpha = 1; c.strokeStyle = INK; c.lineWidth = 0.5; c.beginPath(); c.ellipse(x, 0, 5.6 * s, 8.1 * s, 0, 0, Math.PI); c.stroke(); }
  },
];

function paintedBalloon(c, x, y, s, cols, seed) {
  const rnd = srand(seed);
  c.save(); c.translate(x, y); c.scale(s, s);
  const path = () => { c.beginPath(); c.moveTo(0, 16); c.bezierCurveTo(-17, 4, -14, -17, 0, -17); c.bezierCurveTo(14, -17, 17, 4, 0, 16); c.closePath(); };
  path(); c.save(); c.clip();
  for (let k = -3; k <= 3; k++) { c.globalAlpha = 0.78; c.fillStyle = cols[(k + 3) % cols.length]; c.fillRect(k * 4.4 - 2.2 + (rnd() - 0.5), -18, 4.6, 35); }
  c.globalAlpha = 1; c.fillStyle = lgrad(c, -14, 0, 14, 0, ['rgba(255,255,255,0.35)', 'rgba(255,255,255,0)', 'rgba(60,50,90,0.22)']); c.fillRect(-15, -18, 30, 35);
  c.restore();
  path(); c.strokeStyle = INK; c.lineWidth = 0.7; c.stroke();
  line(c, -2.6, 13.4, -2, 20, INK, 0.4); line(c, 2.6, 13.4, 2, 20, INK, 0.4);
  c.globalAlpha = 0.85; rect(c, -2.6, 20, 5.2, 4, '#b98a5a'); c.globalAlpha = 1;
  c.strokeStyle = INK; c.lineWidth = 0.5; c.strokeRect(-2.6, 20, 5.2, 4);
  c.restore();
}

export default {
  id: 'water',
  page: '#f3eee2', meta: '#f3eee2',
  footer: ['rgba(253,250,243,0.95)', '#ffffff', 'rgba(255,255,255,0.45)'],
  brand: { fill: '#2c3566' },
  cityFx: CITY_FX, baseFx: BASE_FX, baseH: 28, cityBox: [72, 68, 4],
  cityLabel: 'VILLAGES', cityOne: 'VILLAGE',
  prompt: 'Defend the valley. Each tower holds ten interceptors.',
  threat: [52, 48, 98], smart: [196, 50, 120], abm: [208, 92, 62], abmHead: '#2c3566', threatAlpha: 0.6, threatWidth: 1.9, marker: ['#2c3566', '#d05c3e'],
  fx: { spark: '224,122,95', debris: '61,64,91', smoke: '150,150,165', haze: '190,190,205', city: '242,204,143', shape: 'circle', ring: '208,92,62' },
  ui: { text: '#2c3566', muted: 'rgba(44,53,102,0.68)', panel: 'rgba(253,250,243,0.94)', line: 'rgba(44,53,102,0.28)', ptext: '#2c3566', pmuted: 'rgba(44,53,102,0.68)', accent: '#c0533e', warn: '#b23a48', gold: '#b5651d' },

  init() {
    this.clouds = new Clouds({ n: 6, y0: 0.08, y1: 0.5, s0: 0.7, s1: 1.4, speed: 7, seed: 2, w: 260, h: 110, make: (seed, w, h) => {
      const [cv, c] = mkCanvas(w, h);
      wash(c, w / 2, h / 2, w * 0.42, h * 0.3, '#ffffff', 0.5, seed + 300, 4);
      wash(c, w * 0.42, h * 0.58, w * 0.3, h * 0.16, '#c2d0e4', 0.2, seed + 400, 3);
      return { c: cv, w, h };
    } });
    this.birds = new Flock(6, { color: 'rgba(44,40,62,0.75)', y0: 0.14, y1: 0.4, size: 5 });
    this.balloons = [
      { x: 0.12, y: 0.3, s: 1.5, v: 0.006, cols: ['#e07a5f', '#f4f1de', '#f2cc8f'], seed: 3 },
      { x: 0.66, y: 0.44, s: 1, v: 0.004, cols: ['#3d8fb0', '#f4f1de'], seed: 5 },
      { x: 0.9, y: 0.22, s: 0.7, v: 0.003, cols: ['#81b29a', '#f2cc8f', '#f4f1de'], seed: 8 },
    ];
    const rnd = srand(19);
    this.petals = Array.from({ length: 26 }, () => ({ x: rnd(), y: rnd(), s: 0.6 + rnd() * 0.9, p: rnd() * TAU, c: ['#f4a6b8', '#f7c59f', '#ffffff', '#f2cc8f'][(rnd() * 4) | 0] }));
  },

  layout() { this.mill = [W * 0.9, G - clamp(G * 0.2, 60, 170)]; },

  build() {
    this.clouds.build();
    // paper: fibres, grain and a warm vignette, multiplied over the finished frame
    const [pc, p] = mkCanvas(W, H);
    p.fillStyle = '#ffffff'; p.fillRect(0, 0, W, H);
    const rnd = srand(99), n = Math.min(70000, (W * H) / 30);
    for (let i = 0; i < n; i++) { p.fillStyle = 'rgba(120,100,70,' + rnd() * 0.085 + ')'; p.fillRect(rnd() * W, rnd() * H, 1, 1); }
    p.strokeStyle = 'rgba(140,120,90,0.05)';
    for (let i = 0; i < 300; i++) { const x = rnd() * W, y = rnd() * H; p.beginPath(); p.moveTo(x, y); p.quadraticCurveTo(x + rnd() * 20 - 10, y + rnd() * 20 - 10, x + rnd() * 34 - 17, y + rnd() * 34 - 17); p.stroke(); }
    p.fillStyle = rgrad(p, W / 2, H / 2, Math.min(W, H) * 0.3, Math.max(W, H) * 0.75, ['rgba(255,255,255,0)', 'rgba(200,170,130,0.24)']);
    p.fillRect(0, 0, W, H);
    this.paper = pc;
  },

  backdrop(o) {
    o.fillStyle = '#fbf6ec'; o.fillRect(0, 0, W, H);
    const rnd = srand(12);
    for (let i = 0; i < 10; i++) wash(o, rnd() * W, rnd() * G * 0.42, (170 + rnd() * 230) * u, (60 + rnd() * 90) * u, i % 3 ? '#86bde6' : '#a9cdea', 0.1, 20 + i, 4);
    for (let i = 0; i < 7; i++) wash(o, rnd() * W, G * (0.55 + rnd() * 0.3), (190 + rnd() * 210) * u, (40 + rnd() * 54) * u, i % 2 ? '#f6c28b' : '#f2a7a0', 0.085, 50 + i, 3);
    wash(o, W * 0.78, G * 0.26, 46 * u, 46 * u, '#f7d774', 0.3, 77, 4);
    wash(o, W * 0.78, G * 0.26, 80 * u, 80 * u, '#f7d774', 0.05, 78, 3);

    const layer = (base, amp, col, a, seed, f, trees) => {
      const r = srand(seed), h = x => base - amp * u * (0.25 + 1.1 * fbm((x * f) / u, seed, 3));
      for (let pass = 0; pass < 3; pass++) {
        o.beginPath(); o.moveTo(-10, G + 5);
        for (let x = -10; x <= W + 10; x += 7) o.lineTo(x, h(x) + (r() - 0.5) * 3);
        o.lineTo(W + 10, G + 5); o.closePath();
        o.globalAlpha = a; o.fillStyle = col; o.fill();
        o.globalAlpha = a * 0.55; o.strokeStyle = mix(col, -0.25); o.lineWidth = 1.2; o.stroke();
      }
      o.globalAlpha = 1;
      for (let k = 0; k < trees; k++) {
        const x = r() * W, y = h(x) + (2 + r() * 16) * u, s = (0.7 + r() * 0.6) * u;
        o.strokeStyle = 'rgba(44,40,62,0.55)'; o.lineWidth = 1; o.beginPath(); o.moveTo(x, y); o.lineTo(x + (r() - 0.5) * 2, y - 9 * s); o.stroke();
        o.globalAlpha = 0.55; circ(o, x, y - 12 * s, 5 * s, mix(col, -0.18)); o.globalAlpha = 1;
        blob(o, x, y - 12 * s, 5 * s, 5 * s, r, 0.12); o.stroke();
      }
      return h;
    };
    layer(G * 0.74, 120, '#b9b5dc', 0.22, 3, 0.0035, 0);    // far mountains
    layer(G * 0.82, 70, '#a9c7c9', 0.3, 5, 0.004, 5);
    const hMid = layer(G * 0.9, 46, '#86b59a', 0.32, 6, 0.005, 9);
    // patchwork fields
    const rf = srand(8);
    for (let i = 0; i < 9; i++) { const x = rf() * W; wash(o, x, hMid(x) + (14 + rf() * 20) * u, (26 + rf() * 30) * u, (5 + rf() * 5) * u, ['#e8c868', '#b9d08a', '#d9a86a'][i % 3], 0.2, 100 + i, 3); }
    // river winding down the valley
    o.beginPath();
    const rx = t => W * (0.52 + 0.1 * Math.sin(t * 5.2) * (0.3 + t)) , ry = t => G * 0.8 + t * t * (G * 0.2);
    for (let t = 0; t <= 1; t += 0.04) o.lineTo(rx(t) - (2 + t * 26) * u, ry(t));
    for (let t = 1; t >= 0; t -= 0.04) o.lineTo(rx(t) + (2 + t * 26) * u, ry(t));
    o.closePath();
    o.globalAlpha = 0.5; o.fillStyle = '#8cc0e8'; o.fill(); o.globalAlpha = 0.5; o.strokeStyle = '#5f9fd0'; o.lineWidth = 1.2; o.stroke(); o.globalAlpha = 1;
    o.strokeStyle = 'rgba(255,255,255,0.75)'; o.lineWidth = 1.2;
    for (let t = 0.2; t < 1; t += 0.13) { o.beginPath(); o.moveTo(rx(t) - t * 10 * u, ry(t)); o.lineTo(rx(t) + t * 9 * u, ry(t) + 1); o.stroke(); }
    layer(G * 0.975, 26, '#6fa37f', 0.36, 7, 0.006, 8);
    // windmill tower on the far hill (sails are animated)
    const [mx, my] = this.mill, s = u * 1.2;
    o.globalAlpha = 0.85; o.fillStyle = '#f3ead8'; o.beginPath(); o.moveTo(mx - 9 * s, my + 34 * s); o.lineTo(mx + 9 * s, my + 34 * s); o.lineTo(mx + 5 * s, my); o.lineTo(mx - 5 * s, my); o.fill();
    o.fillStyle = '#c0533e'; o.beginPath(); o.moveTo(mx - 6.4 * s, my); o.lineTo(mx, my - 8 * s); o.lineTo(mx + 6.4 * s, my); o.fill(); o.globalAlpha = 1;
    o.strokeStyle = INK; o.lineWidth = 1.1; o.beginPath(); o.moveTo(mx - 9 * s, my + 34 * s); o.lineTo(mx - 5 * s, my); o.lineTo(mx, my - 8 * s); o.lineTo(mx + 5 * s, my); o.lineTo(mx + 9 * s, my + 34 * s); o.moveTo(mx - 6.4 * s, my); o.lineTo(mx + 6.4 * s, my); o.stroke();
  },

  tick(dt) {
    this.clouds.tick(dt); this.birds.tick(dt);
    for (const b of this.balloons) { b.x += b.v * (0.5 + 0.6 * game.wind) * dt; if (b.x > 1.12) b.x = -0.12; }
    for (const p of this.petals) { p.x += (0.02 + 0.03 * game.wind) * p.s * dt; p.y += 0.035 * p.s * dt; p.p += dt * 2; if (p.x > 1.03) p.x = -0.03; if (p.y > 1) p.y = -0.03; }
  },

  ambient(c) {
    this.clouds.draw(c);
    this.birds.draw(c);
    for (const b of this.balloons) paintedBalloon(c, b.x * W, b.y * G + Math.sin(time * 0.5 + b.seed) * 6 * u, b.s * u, b.cols, b.seed);
    // windmill sails
    const [mx, my] = this.mill, s = u * 1.2, a0 = time * (0.4 + 0.35 * game.wind);
    c.strokeStyle = INK; c.lineCap = 'round';
    for (let k = 0; k < 4; k++) {
      const a = a0 + (k * TAU) / 4, ex = mx + Math.cos(a) * 26 * s, ey = my - 2 * s + Math.sin(a) * 26 * s, nx = -Math.sin(a) * 4.4 * s, ny = Math.cos(a) * 4.4 * s;
      c.lineWidth = 1.2; c.beginPath(); c.moveTo(mx, my - 2 * s); c.lineTo(ex, ey); c.stroke();
      c.globalAlpha = 0.6; c.fillStyle = '#f6efe0';
      c.beginPath(); c.moveTo(mx + Math.cos(a) * 8 * s, my - 2 * s + Math.sin(a) * 8 * s); c.lineTo(ex, ey); c.lineTo(ex + nx, ey + ny); c.lineTo(mx + Math.cos(a) * 8 * s + nx, my - 2 * s + Math.sin(a) * 8 * s + ny); c.closePath(); c.fill();
      c.globalAlpha = 1; c.lineWidth = 0.7; c.stroke();
    }
    for (const p of this.petals) {                         // petals on the breeze
      c.save(); c.translate(p.x * W, p.y * G); c.rotate(p.p); c.globalAlpha = 0.75;
      ell(c, 0, 0, 3.2 * p.s * u, 1.5 * p.s * u, p.c);
      c.restore();
    }
    c.globalAlpha = 1;
  },

  foreground(o) {
    const bt = G - this.baseH * u;
    for (let pass = 0; pass < 3; pass++) {
      groundPath(o, BASE_FX, bt, 58);
      o.fillStyle = vgrad(o, bt, H, ['rgba(104,164,116,0.55)', 'rgba(63,127,122,0.76)', 'rgba(44,94,92,0.92)']);
      o.fill();
    }
    const rnd = srand(4);
    for (let i = 0; i < 46; i++) { o.globalAlpha = 0.17; circ(o, rnd() * W, G + rnd() * (H - G), (6 + rnd() * 22) * u, '#2f6260'); }
    o.globalAlpha = 1;
    groundPath(o, BASE_FX, bt, 58); o.strokeStyle = 'rgba(44,40,62,0.75)'; o.lineWidth = 1.3; o.stroke();
    o.strokeStyle = 'rgba(44,40,62,0.4)'; o.lineWidth = 1;
    for (let x = 0; x < W; x += 8) { o.beginPath(); o.moveTo(x, G + 2); o.lineTo(x + 2, G - (2 + rnd() * 5) * u); o.stroke(); }
    for (let x = 6; x < W; x += (14 + rnd() * 26) * u) {    // wildflowers
      if (BASE_FX.some(f => Math.abs(x - f * W) < 60 * u)) continue;
      o.globalAlpha = 0.85; circ(o, x, G + (4 + rnd() * 9) * u, (1.4 + rnd() * 1.4) * u, ['#f28482', '#f6bd60', '#ffffff', '#e5989b'][(rnd() * 4) | 0]);
    }
    o.globalAlpha = 1;
  },

  cityArt(c, i) { ART[i](c); },
  ruinArt(c, i) {
    ruinFrom(c, ART[i], { seed: i + 21, cut: 10, a: 'rgba(96,88,104,0.9)', b: 'rgba(170,140,130,0.9)', tint: 'rgba(60,54,84,0.42)' });
    const r = srand(i + 5);
    for (let k = 0; k < 7; k++) { c.globalAlpha = 0.5; circ(c, -24 + r() * 48, r() * 6, 1 + r() * 2.4, '#3d405b'); }   // ink spatter
    c.globalAlpha = 1;
  },

  cityAnim(c, i, city) {
    if (!city.alive) return;
    if (i === 0) {                                         // chimney smoke
      for (let k = 0; k < 4; k++) { const p = (time * 0.3 + k / 4) % 1; c.globalAlpha = 0.5 * (1 - p); circ(c, 3.6 + p * 6 * game.wind, 28 + p * 14, 1.4 + p * 3, '#b9b6c6'); }
      c.globalAlpha = 1;
    } else if (i === 2) {                                  // sails
      const a0 = time * (0.6 + 0.5 * game.wind);
      for (let k = 0; k < 4; k++) {
        const a = a0 + (k * TAU) / 4, ex = Math.cos(a) * 21, ey = 38 + Math.sin(a) * 21, nx = -Math.sin(a) * 3.6, ny = Math.cos(a) * 3.6;
        line(c, 0, 38, ex, ey, INK, 0.7);
        c.globalAlpha = 0.75; poly(c, [[Math.cos(a) * 6, 38 + Math.sin(a) * 6], [ex, ey], [ex + nx, ey + ny], [Math.cos(a) * 6 + nx, 38 + Math.sin(a) * 6 + ny]], '#f6efe0'); c.globalAlpha = 1;
        poly(c, [[Math.cos(a) * 6, 38 + Math.sin(a) * 6], [ex, ey], [ex + nx, ey + ny], [Math.cos(a) * 6 + nx, 38 + Math.sin(a) * 6 + ny]], null, INK, 0.4);
      }
      circ(c, 0, 38, 1.2, '#8a5a3c');
    } else if (i === 4) {                                  // flag
      const pts = [];
      for (let k = 0; k <= 6; k++) pts.push([-13.5 + k * 1.6, 59.6 + Math.sin(time * 5 - k * 0.9) * 0.6 * (k / 6)]);
      for (let k = 6; k >= 0; k--) pts.push([-13.5 + k * 1.6, 55 + Math.sin(time * 5 - k * 0.9) * 0.6 * (k / 6)]);
      c.globalAlpha = 0.9; poly(c, pts, '#f6c445'); c.globalAlpha = 1; poly(c, pts, null, INK, 0.4);
    }
  },

  base(c, b) {
    const r = srand(b.i * 7 + 1);
    if (b.alive) {
      wbox(c, -6.5, 0, 13, 10, '#c9cfdd', r);
      line(c, -6.5, 5, 6.5, 5.3, INK, 0.3); wbox(c, -1.4, 2, 2.8, 4.4, '#4a4660', r);
      wpoly(c, [[-8.4, 10], [0, 21], [8.4, 10]], '#c0533e', r);
      line(c, 0, 21, 0, 28, INK, 0.5);
      const w = Math.sin(time * 5 + b.i) * 0.7;
      poly(c, [[0, 28], [6.5, 26.6 + w], [0, 24.6]], '#f6c445'); poly(c, [[0, 28], [6.5, 26.6 + w], [0, 24.6]], null, INK, 0.4);
      const hot = clamp(1 - (time - b.fireT) * 4, 0, 1);
      if (hot > 0) soft(c, 0, 22, 12 * hot, '255,214,140', hot);
    } else {
      wpoly(c, [[-7, 0], [-6, 5], [-2, 3], [1, 7], [5, 3], [7, 0]], '#9a98a8', r);
    }
    pips(c, b, '#fdfaf3', 'rgba(253,250,243,0.22)', { round: true, y: -5 });
  },

  head(c, t, rgb) {
    c.globalAlpha = 0.3; circ(c, t.x, t.y, 5.5 * u, 'rgb(' + rgb.join(',') + ')'); c.globalAlpha = 1;
    circ(c, t.x, t.y, 2.4 * u, 'rgb(' + rgb.join(',') + ')');
    if (t.kind === 'smart') { c.strokeStyle = 'rgb(' + rgb.join(',') + ')'; c.lineWidth = 1.2 * u; c.beginPath(); c.arc(t.x, t.y, 6.5 * u, time * 5, time * 5 + 4); c.stroke(); }
  },
  shotHead(c, s) { circ(c, s.x, s.y, 2.4 * u, '#2c3566'); c.globalAlpha = 0.35; circ(c, s.x, s.y, 5 * u, '#d05c3e'); c.globalAlpha = 1; },

  // Explosions bloom like wet paint, with a spatter of droplets.
  blastDraw(c, b) {
    const k = b.r / b.max, rnd = srand((b.seed * 1000) | 0);
    const set = [['#f6bd60', '#f28482'], ['#f7d774', '#f4978e'], ['#ffd6a5', '#e5989b']][(b.seed * 3) | 0] || ['#f6bd60', '#f28482'];
    const cols = b.kind === 'ground' ? ['#e9a06a', '#b0527a'] : set;
    for (let p = 0; p < 3; p++) {
      blob(c, b.x + (rnd() - 0.5) * b.r * 0.2, b.y + (rnd() - 0.5) * b.r * 0.2, b.r * (0.82 + p * 0.12), b.r * (0.82 + p * 0.12), rnd, 0.18);
      c.globalAlpha = 0.36 * Math.min(1, k * 1.5);
      c.fillStyle = rgrad(c, b.x, b.y, 0, b.r * 1.15, [[0, 'rgba(255,252,236,0.95)'], [0.5, cols[0]], [1, cols[1]]]);
      c.fill();
      c.globalAlpha = 0.3 * k; c.strokeStyle = cols[1]; c.lineWidth = 1.5; c.stroke();
    }
    for (let i = 0; i < 9; i++) {
      const a = rnd() * TAU, d = b.r * (1.05 + rnd() * 0.5);
      c.globalAlpha = 0.5 * k; circ(c, b.x + Math.cos(a) * d, b.y + Math.sin(a) * d, (1 + rnd() * 2.6) * u * k, cols[i % 2]);
    }
    c.globalAlpha = 1;
  },

  flyer(c, f) {                                            // a little storm cloud
    const x = f.x, y = f.y + Math.sin(time * 2 + f.x * 0.01) * 2 * u, rnd = srand(7);
    wash(c, x, y, 22 * u, 10 * u, '#8c90a8', 0.5, 5, 3);
    c.strokeStyle = INK; c.lineWidth = 1; blob(c, x, y, 22 * u, 10 * u, rnd, 0.14); c.stroke();
    if (Math.floor(time * 3) % 3 === 0) { c.strokeStyle = '#e9a400'; c.lineWidth = 1.8; c.lineJoin = 'round'; c.beginPath(); c.moveTo(x, y + 8 * u); c.lineTo(x - 4 * u, y + 15 * u); c.lineTo(x + 1 * u, y + 15 * u); c.lineTo(x - 3 * u, y + 23 * u); c.stroke(); }
  },

  overlay(c) {
    if (!this.paper) return;
    c.save(); c.globalCompositeOperation = 'multiply'; c.drawImage(this.paper, 0, 0, W, H); c.restore();
  },
};
