// Orbit: a moon base under a slowly turning Earth, defended against a meteor storm.
// No air here: debris arcs lazily in low gravity and dust hangs where it is thrown.
import {
  TAU, W, H, G, u, time, game, srand, rand, clamp, fbm, mkCanvas,
  rect, poly, circ, ell, line, ring, vgrad, hgrad, lgrad, rgrad, rrect, windows, soft, beacon,
  makeStars, drawStars, groundPath, pips, ruinFrom, puff, burst,
} from '../core.js';

const CITY_FX = [0.215, 0.3, 0.385, 0.615, 0.7, 0.785];
const BASE_FX = [0.08, 0.5, 0.92];
const HULL = ['#ffffff', '#dfe3ea', '#8f96a6'];      // lit from the right
const DARK = ['#6a7080', '#3d4250', '#1e212b'];
const ORANGE = '#ff8a3c', GLOW = '#8fd0ff', PANEL = ['#3f6fd8', '#1a2f7a'];

const hull = (c, x0, x1) => hgrad(c, x0, x1, [HULL[2], HULL[1], HULL[0]]);
function module(c, x, y, w, h, r = 2) { rrect(c, x, y, w, h, r, hull(c, x, x + w)); rect(c, x, y + h * 0.62, w, 0.7, ORANGE); }
function lit(c, x, y, n, gap = 2.6, col = GLOW) { for (let k = 0; k < n; k++) rect(c, x + k * gap, y, 1.5, 1.5, col); }
function lattice(c, x, w0, y0, w1, y1, n, col = HULL[1], lw = 0.45) {
  c.strokeStyle = col; c.lineWidth = lw; c.beginPath();
  c.moveTo(x - w0, y0); c.lineTo(x - w1, y1); c.moveTo(x + w0, y0); c.lineTo(x + w1, y1);
  for (let k = 0; k < n; k++) {
    const ya = y0 + ((y1 - y0) * k) / n, yb = y0 + ((y1 - y0) * (k + 1)) / n, wa = w0 + ((w1 - w0) * k) / n, wb = w0 + ((w1 - w0) * (k + 1)) / n;
    c.moveTo(x - wa, ya); c.lineTo(x + wb, yb); c.moveTo(x + wa, ya); c.lineTo(x - wb, yb); c.moveTo(x - wb, yb); c.lineTo(x + wb, yb);
  }
  c.stroke();
}
function dish(c, x, y, r, tilt, squash = 1) {            // unit coords; opening faces `tilt`
  c.save(); c.translate(x, y); c.rotate(tilt); c.scale(squash, 1);
  c.fillStyle = lgrad(c, -r, 0, r, 0, [HULL[2], HULL[0]]); c.beginPath(); c.ellipse(0, 0, r, r * 0.42, 0, Math.PI, TAU); c.closePath(); c.fill();
  c.fillStyle = 'rgba(40,50,70,0.35)'; c.beginPath(); c.ellipse(0, 0, r, r * 0.16, 0, 0, TAU); c.fill();
  line(c, 0, 0, 0, r * 0.75, HULL[1], 0.4); circ(c, 0, r * 0.75, 0.9, ORANGE);
  c.restore();
}

const ART = [
  // 0: Habitat: geodesic garden dome with an airlock module
  c => {
    rect(c, -24, 0, 48, 2.6, hull(c, -24, 24));
    const r = srand(4);
    for (let x = -17; x < 18; x += 2.6 + r() * 2) circ(c, x, 3.6 + r() * 2, 1.6 + r() * 1.6, r() < 0.5 ? '#3fae6b' : '#2f8f5a');
    rect(c, -3, 2.6, 0.9, 7, '#6a4a30'); circ(c, -2.6, 11.5, 4, '#48b872'); circ(c, -4.6, 10, 2.6, '#3fae6b');
    module(c, 6, 2.6, 9, 6, 1.5); lit(c, 7.4, 6.4, 3, 2.4, '#ffe9a0');
    c.fillStyle = rgrad(c, 6, 14, 2, 24, [[0, 'rgba(210,235,255,0.34)'], [0.6, 'rgba(150,205,255,0.14)'], [1, 'rgba(140,200,255,0.3)']]);
    c.beginPath(); c.arc(0, 2.6, 21, 0, Math.PI); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(235,245,255,0.75)'; c.lineWidth = 0.35;
    for (let k = 0; k <= 6; k++) {                        // geodesic frame
      const a = (k / 6) * Math.PI, x = Math.cos(a) * 21, y = 2.6 + Math.sin(a) * 21;
      c.beginPath(); c.moveTo(x, y); c.lineTo(Math.cos(a) * 12, 2.6 + Math.sin(a) * 12 + 5); c.stroke();
      if (k < 6) { const b = ((k + 1) / 6) * Math.PI; c.beginPath(); c.moveTo(x, y); c.lineTo(Math.cos(b) * 21, 2.6 + Math.sin(b) * 21); c.moveTo(Math.cos(a) * 12, 7.6 + Math.sin(a) * 12); c.lineTo(Math.cos(b) * 12, 7.6 + Math.sin(b) * 12); c.moveTo(Math.cos(a) * 12, 7.6 + Math.sin(a) * 12); c.lineTo(Math.cos(b) * 21, 2.6 + Math.sin(b) * 21); c.stroke(); }
    }
    c.strokeStyle = '#ffffff'; c.lineWidth = 0.7; c.beginPath(); c.arc(0, 2.6, 21, 0, Math.PI); c.stroke();
    c.strokeStyle = 'rgba(255,255,255,0.8)'; c.lineWidth = 1; c.beginPath(); c.arc(0, 2.6, 17.5, 0.25, 0.7); c.stroke();
    module(c, 22, 0, 9, 9, 2); rect(c, 25, 1, 3, 5, DARK[1]); lit(c, 23.4, 6.6, 2);
    line(c, -28, 0, -28, 22, HULL[1], 0.5); line(c, -30, 16, -26, 16, HULL[1], 0.35);
  },
  // 1: Communications mast (the big dish turns in cityAnim)
  c => {
    module(c, -29, 0, 17, 8); lit(c, -27, 4.6, 5);
    module(c, 9, 0, 21, 7); lit(c, 11, 4, 6);
    rect(c, -4, 0, 8, 3, DARK[1]);
    lattice(c, 0, 5, 3, 1.8, 40, 6);
    dish(c, 20, 10.5, 4.6, 0.5);
    line(c, -22, 8, -22, 20, HULL[1], 0.4);
    rect(c, 13, 7, 4, 3.4, DARK[0]); rect(c, 13.6, 7.6, 2.8, 1.2, GLOW);
  },
  // 2: Launch pad with a rocket on the stand
  c => {
    rect(c, -22, 0, 44, 2.2, DARK[1]);
    for (let x = -22; x < 22; x += 4) poly(c, [[x, 0], [x + 2, 0], [x + 3, 2.2], [x + 1, 2.2]], '#f2c230');
    lattice(c, -15, 3.4, 2.2, 3, 48, 8, DARK[0], 0.5);
    line(c, -12, 22, -4, 22, DARK[0], 0.7); line(c, -12, 36, -3.4, 36, DARK[0], 0.7);
    poly(c, [[-4, 6], [-8, 2.2], [-4, 2.2]], ORANGE); poly(c, [[4, 6], [8, 2.2], [4, 2.2]], '#d86a20');
    poly(c, [[-2.4, 4], [-3.4, 2.2], [3.4, 2.2], [2.4, 4]], DARK[1]);
    c.fillStyle = hull(c, -4, 4); c.fillRect(-4, 4, 8, 34);
    rect(c, -4, 14, 8, 1.2, DARK[2]); rect(c, -4, 28, 8, 3, ORANGE);
    c.fillStyle = hgrad(c, -4, 4, ['#c85a14', '#ff9a4c']); c.beginPath(); c.moveTo(-4, 38); c.quadraticCurveTo(-3.4, 47, 0, 51); c.quadraticCurveTo(3.4, 47, 4, 38); c.closePath(); c.fill();
    circ(c, 0, 33.6, 1.4, '#1a2f7a'); circ(c, 0.4, 34, 0.5, GLOW);
    for (const [x, r] of [[17, 6.4], [27, 4.2]]) {
      line(c, x - r * 0.6, 0, x - r * 0.4, r, DARK[0], 0.5); line(c, x + r * 0.6, 0, x + r * 0.4, r, DARK[0], 0.5);
      c.fillStyle = rgrad(c, x + r * 0.35, r + 2.4 + r * 0.35, r * 0.1, r * 1.1, HULL); c.beginPath(); c.arc(x, r + 2.4, r, 0, TAU); c.fill();
      rect(c, x - r, r + 2, r * 2, 0.7, ORANGE);
    }
    line(c, 8, 3, 11, 3, DARK[0], 0.8);
  },
  // 3: Power: reactor dome and a field of solar panels
  c => {
    for (let k = -3; k <= 3; k++) rect(c, -19 + k * 2.4 - 0.25, 2, 0.5, 15 - Math.abs(k) * 1.2, DARK[0]);   // radiator fins
    c.fillStyle = rgrad(c, -15, 9, 1, 12, HULL); c.beginPath(); c.arc(-19, 2, 9.5, 0, Math.PI); c.closePath(); c.fill();
    rect(c, -29.5, 0, 21, 2.4, hull(c, -29.5, -8.5)); rect(c, -28.5, 4.6, 19, 0.9, ORANGE);
    circ(c, -19, 6.4, 2.2, DARK[2]); circ(c, -19, 6.4, 1.5, GLOW);
    for (let k = 0; k < 4; k++) {
      const x = -5 + k * 9;
      line(c, x + 3.6, 0, x + 3.6, 7, DARK[0], 0.6);
      c.fillStyle = lgrad(c, x, 4, x + 8, 14, PANEL); c.beginPath(); c.moveTo(x - 0.5, 4.5); c.lineTo(x + 6.6, 4.5); c.lineTo(x + 8.6, 14.5); c.lineTo(x + 1.5, 14.5); c.closePath(); c.fill();
      c.strokeStyle = 'rgba(190,220,255,0.55)'; c.lineWidth = 0.22; c.stroke();
      for (let q = 1; q < 4; q++) { line(c, x - 0.5 + q * 1.78, 4.5, x + 1.5 + q * 1.78, 14.5, 'rgba(190,220,255,0.5)', 0.2); line(c, x - 0.5 + q * 0.5, 4.5 + q * 2.5, x + 6.6 + q * 0.5, 4.5 + q * 2.5, 'rgba(190,220,255,0.5)', 0.2); }
    }
  },
  // 4: Observatory and radio telescope
  c => {
    rect(c, -22, 0, 24, 9, hull(c, -22, 2)); rect(c, -22, 5.6, 24, 0.8, ORANGE); lit(c, -20, 2, 7, 3.2);
    c.fillStyle = rgrad(c, -4, 18, 1, 16, HULL); c.beginPath(); c.arc(-10, 9, 12.5, 0, Math.PI); c.closePath(); c.fill();
    poly(c, [[-9, 9], [-4.6, 9], [-6, 20.6], [-8.6, 21.4]], DARK[2]);
    c.strokeStyle = 'rgba(120,130,150,0.5)'; c.lineWidth = 0.25; for (let k = 1; k < 5; k++) { c.beginPath(); c.ellipse(-10, 9, 12.5 * Math.abs(1 - k / 2.5), 12.5, 0, 0, Math.PI); c.stroke(); }
    lattice(c, 18, 5, 0, 1.6, 16, 3, HULL[1], 0.5);
    dish(c, 18, 21, 11, -0.55);
    rect(c, 9, 0, 5, 4, DARK[0]);
  },
  // 5: Mine: derrick, processing tower and conveyor
  c => {
    for (const [x, w, h] of [[20, 9, 4.4], [27, 6, 3]]) { c.fillStyle = hgrad(c, x - w, x + w, ['#5a5c66', '#9a9ca6']); c.beginPath(); c.ellipse(x, 0, w, h, 0, 0, Math.PI); c.fill(); }
    lattice(c, -19, 6, 0, 1.4, 40, 7, HULL[1], 0.5);
    rect(c, -19.5, 0, 1, 34, DARK[0]); rect(c, -21, 34, 4, 3, ORANGE);
    c.fillStyle = hull(c, -3, 9); c.fillRect(-3, 0, 12, 27);
    rect(c, -3, 18, 12, 0.9, ORANGE); rect(c, -4, 27, 14, 1.4, DARK[0]);
    lit(c, -1.4, 21, 4, 2.7); lit(c, -1.4, 12, 4, 2.7, '#ffe9a0');
    poly(c, [[-13, 3], [-11, 1.6], [0, 22.6], [-2, 24]], DARK[0]);
    rect(c, 9, 4, 5, 0.8, DARK[0]); rect(c, 13, 0, 1, 5, DARK[0]);
    poly(c, [[9, 14], [16, 14], [14.4, 9], [10.6, 9]], DARK[1]);
    rect(c, 2.4, 28.4, 1, 6, DARK[0]);
  },
];

export default {
  id: 'orbit',
  page: '#05060f', meta: '#05060f',
  footer: ['rgba(214,224,245,0.9)', '#ffffff', 'rgba(255,255,255,0.35)'],
  brand: { fill: '#ffffff', pad: 40, glows: [{ color: 'rgba(120,180,255,0.75)', blur: 22 }] },
  cityFx: CITY_FX, baseFx: BASE_FX, baseH: 26, cityBox: [70, 60, 4], cityScaleMax: 1.85,
  cityLabel: 'MODULES', cityOne: 'MODULE',
  prompt: 'Defend the moon base. Each battery holds ten interceptors.',
  threat: [255, 150, 60], smart: [120, 255, 150], abm: [130, 205, 255], abmHead: '#ffffff', threatAlpha: 0.5, abmAlpha: 0.9, marker: ['#ffffff', '#7fc4ff'],
  blast: ['rgba(255,255,255,1)', 'rgba(170,220,255,0.92)', 'rgba(90,140,255,0.55)', 'rgba(120,80,255,0)'],
  groundBlast: ['rgba(255,255,255,1)', 'rgba(255,220,160,0.9)', 'rgba(255,140,70,0.5)', 'rgba(255,120,60,0)'],
  fx: { spark: '205,228,255', debris: '196,198,208', smoke: '168,170,182', city: '255,222,160', glow: '150,200,255', ring: '190,225,255', flash: '200,220,255', add: true, gravity: 26, drag: 0.82, chunkG: 68, chunkDrag: 0.9, linger: false, ruinSmoke: false },
  ui: { text: '#eef3ff', muted: 'rgba(238,243,255,0.72)', panel: 'rgba(12,16,34,0.88)', line: 'rgba(140,190,255,0.42)', ptext: '#eef3ff', pmuted: 'rgba(238,243,255,0.74)', accent: '#7fc4ff', warn: '#ff7a5c', gold: '#ffd27a', veil: 'rgba(2,4,12,0.5)' },

  init() {
    this.stars = makeStars(330, 21, 1);
    this.sats = [{ x: 0.1, y: 0.16, v: 0.016 }, { x: 0.7, y: 0.07, v: -0.011 }];
    this.rover = { x: 0.3, dir: 1 };
    this.ship = { p: -1, wait: 8 };
    this.spark = 0;
  },
  layout() {
    this.hz = G - clamp(G * 0.17, 54, 136);
    this.Y = d => this.hz + d * (G - this.hz);
    const R = clamp(Math.min(G * 0.125, W * 0.1), 30, 112);
    // on narrow screens the Earth sits below the logo instead of beside it
    this.earth = [Math.max(W * 0.17, R + 14), W < 720 ? game.brand.bottom + R + 46 * u : clamp(G * 0.3, 90 * u, G * 0.36), R];
    this.sunP = [W * 0.9, G * 0.13];
  },

  build() {
    // Earth: surface, a wrapping cloud layer and a night-side shade, composited each frame.
    const R = this.earth[2], d = R * 2, r = srand(8);
    const [ec, e] = mkCanvas(d, d);
    e.beginPath(); e.arc(R, R, R, 0, TAU); e.clip();
    e.fillStyle = rgrad(e, R * 1.25, R * 0.8, R * 0.1, R * 1.6, ['#3f95f0', '#1c5fc8', '#0a2f86']); e.fillRect(0, 0, d, d);
    for (let k = 0; k < 11; k++) {
      const x = r() * d, y = R * 0.35 + r() * R * 1.3, rx = R * (0.14 + r() * 0.3), ry = R * (0.1 + r() * 0.22);
      e.fillStyle = r() < 0.6 ? '#3f9a5a' : '#b9a568';
      e.beginPath();
      for (let i = 0; i <= 18; i++) { const a = (i / 18) * TAU, kk = 1 + 0.35 * Math.sin(a * 3 + k) + 0.2 * Math.sin(a * 5 + k * 2); e.lineTo(x + Math.cos(a) * rx * kk, y + Math.sin(a) * ry * kk); }
      e.fill();
    }
    e.fillStyle = 'rgba(255,255,255,0.92)'; e.beginPath(); e.ellipse(R, R * 0.02, R * 0.7, R * 0.16, 0, 0, TAU); e.fill(); e.beginPath(); e.ellipse(R, R * 1.99, R * 0.6, R * 0.13, 0, 0, TAU); e.fill();
    const [cc, cl] = mkCanvas(d * 2, d);
    for (let k = 0; k < 46; k++) {
      const x = r() * d, y = r() * d, rx = R * (0.1 + r() * 0.32), ry = R * (0.02 + r() * 0.05);
      cl.fillStyle = 'rgba(255,255,255,' + (0.35 + r() * 0.45) + ')';
      for (const ox of [0, d]) { cl.beginPath(); cl.ellipse(x + ox, y, rx, ry, (r() - 0.5) * 0.5, 0, TAU); cl.fill(); if (x < rx * 1.2) { cl.beginPath(); cl.ellipse(x + ox + d, y, rx, ry, 0, 0, TAU); cl.fill(); } }
    }
    const [sc, s] = mkCanvas(d, d);
    s.beginPath(); s.arc(R, R, R, 0, TAU); s.clip();
    s.fillStyle = lgrad(s, 0, R * 1.3, d, R * 0.7, [[0, 'rgba(2,3,12,0.96)'], [0.3, 'rgba(2,3,12,0.86)'], [0.58, 'rgba(2,3,12,0.12)'], [1, 'rgba(255,255,255,0)']]); s.fillRect(0, 0, d, d);
    s.fillStyle = rgrad(s, R, R, R * 0.8, R, ['rgba(140,200,255,0)', 'rgba(140,200,255,0.5)']); s.fillRect(0, 0, d, d);
    this.es = { ec, cc, sc, d };
  },

  backdrop(o) {
    const hz = this.hz, Y = this.Y;
    o.fillStyle = vgrad(o, 0, hz, ['#02030a', '#060a1c', '#0d1430']); o.fillRect(0, 0, W, H);
    const r = srand(13);
    for (let i = 0; i < 150; i++) {                        // the Milky Way
      const t = r(), x = W * (0.28 + t * 0.78) + (r() - 0.5) * 150 * u, y = G * (0.62 - t * 0.66) + (r() - 0.5) * 110 * u;
      soft(o, x, y, (40 + r() * 90) * u, ['120,140,255', '190,130,255', '255,170,210', '120,200,255'][(r() * 4) | 0], 0.035 + r() * 0.03);
    }
    for (let i = 0; i < 900; i++) { const t = r(), x = W * (0.28 + t * 0.78) + (r() - 0.5) * (r() * 260) * u, y = G * (0.62 - t * 0.66) + (r() - 0.5) * (r() * 200) * u; o.fillStyle = 'rgba(225,232,255,' + (0.15 + r() * 0.45) + ')'; o.fillRect(x, y, 0.8, 0.8); }
    // the Sun, small and fierce
    const [sx, sy] = this.sunP;
    soft(o, sx, sy, 200 * u, '255,240,210', 0.35); soft(o, sx, sy, 60 * u, '255,250,235', 0.9);
    o.fillStyle = lgrad(o, sx - 260 * u, sy, sx + 260 * u, sy, ['rgba(255,245,220,0)', 'rgba(255,245,220,0.6)', 'rgba(255,245,220,0)']); o.fillRect(sx - 260 * u, sy - 1.2 * u, 520 * u, 2.4 * u);
    o.fillStyle = lgrad(o, sx, sy - 150 * u, sx, sy + 150 * u, ['rgba(255,245,220,0)', 'rgba(255,245,220,0.5)', 'rgba(255,245,220,0)']); o.fillRect(sx - 1 * u, sy - 150 * u, 2 * u, 300 * u);
    circ(o, sx, sy, 9 * u, '#ffffff');
    // distant crater rims as crisp facets: sunlit where they face the Sun (right), in shadow where they face away
    const rr = srand(17), pts = [];
    for (let x = -20 * u; x < W + 50 * u; x += (12 + rr() * 24) * u) pts.push([x, (5 + 52 * Math.pow(fbm((x * 0.006) / u, 3, 3), 1.5) + rr() * 9) * u]);
    o.beginPath(); o.moveTo(pts[0][0], hz + 2); pts.forEach(([x, h]) => o.lineTo(x, hz - h)); o.lineTo(W + 60 * u, hz + 2);
    o.fillStyle = vgrad(o, hz - 60 * u, hz, ['#f0f2f6', '#c3c6d0']); o.fill();
    for (let i = 0; i < pts.length - 1; i++) {             // each slope facing away from the Sun gets a slanted shadow
      const [x0, h0] = pts[i], [x1, h1] = pts[i + 1];
      if (h1 <= h0) continue;
      o.fillStyle = (h1 - h0) / (x1 - x0) > 0.5 ? '#3a3d48' : '#555966';
      o.beginPath(); o.moveTo(x0, hz + 2); o.lineTo(x0, hz - h0); o.lineTo(x1, hz - h1); o.lineTo(x1 + h1 * 0.45, hz + 2); o.fill();
    }
    o.save();
    o.beginPath(); o.moveTo(pts[0][0], hz + 2); pts.forEach(([x, h]) => o.lineTo(x, hz - h)); o.lineTo(W + 60 * u, hz + 2); o.clip();
    o.fillStyle = vgrad(o, hz - 22 * u, hz, ['rgba(141,144,156,0)', 'rgba(141,144,156,0.75)']); o.fillRect(0, hz - 22 * u, W, 22 * u + 2);
    o.restore();
    // the plain
    o.fillStyle = vgrad(o, hz, G, ['#8d909c', '#b4b7c2', '#a2a5b0', '#8a8d98']); o.fillRect(0, hz, W, G - hz + 2);
    const rc = srand(31);
    for (let i = 0; i < (W * (G - hz)) / 170; i++) { const d = Math.pow(rc(), 0.8), y = Y(d), x = rc() * W; o.fillStyle = rc() < 0.5 ? 'rgba(60,62,74,0.16)' : 'rgba(240,242,248,0.2)'; o.fillRect(x, y, (3 + 14 * d) * u, Math.max(1, d * 1.5 * u)); }
    for (let i = 0; i < W / 30; i++) {                     // craters
      const d = 0.08 + rc() * 0.9, x = rc() * W, y = Y(d), rx = (6 + rc() * 22) * (0.35 + d) * u, ry = rx * (0.16 + d * 0.16);
      o.fillStyle = 'rgba(70,72,84,0.55)'; o.beginPath(); o.ellipse(x, y, rx, ry, 0, 0, TAU); o.fill();
      o.strokeStyle = 'rgba(242,244,250,0.85)'; o.lineWidth = Math.max(1, ry * 0.4); o.beginPath(); o.ellipse(x, y, rx, ry, 0, Math.PI * 0.55, Math.PI * 1.45); o.stroke();
      o.strokeStyle = 'rgba(34,36,46,0.55)'; o.beginPath(); o.ellipse(x, y, rx * 0.9, ry * 0.9, 0, -Math.PI * 0.42, Math.PI * 0.42); o.stroke();
    }
    for (let i = 0; i < W / 22; i++) {                     // boulders with long shadows
      const d = 0.2 + rc() * 0.8, x = rc() * W, y = Y(d), s = (1.5 + rc() * 3.5) * (0.4 + d) * u;
      o.fillStyle = 'rgba(30,32,42,0.5)'; o.beginPath(); o.ellipse(x - s * 2.6, y, s * 3, s * 0.4, 0, 0, TAU); o.fill();
      o.fillStyle = '#7b7e8a'; o.beginPath(); o.ellipse(x, y - s * 0.5, s, s * 0.75, 0, 0, TAU); o.fill();
      o.fillStyle = '#eceef4'; o.beginPath(); o.ellipse(x + s * 0.3, y - s * 0.7, s * 0.55, s * 0.4, 0, 0, TAU); o.fill();
    }
    // rover tracks, and the flag
    const ty = Y(0.52);
    o.strokeStyle = 'rgba(70,72,84,0.4)'; o.lineWidth = 1; o.setLineDash([3 * u, 2 * u]);
    o.beginPath(); o.moveTo(0, ty); o.lineTo(W, ty); o.moveTo(0, ty + 3 * u); o.lineTo(W, ty + 3 * u); o.stroke(); o.setLineDash([]);
    const fx = W * 0.445, fy = G - 2 * u;
    o.fillStyle = 'rgba(30,32,42,0.45)'; o.beginPath(); o.ellipse(fx - 16 * u, fy + 1, 16 * u, 1.4 * u, 0, 0, TAU); o.fill();
    o.fillStyle = '#d9dce4'; o.fillRect(fx - 0.6 * u, fy - 30 * u, 1.2 * u, 30 * u);
    o.fillStyle = '#0d1a3a'; o.fillRect(fx + 0.6 * u, fy - 30 * u, 18 * u, 11 * u);
    o.fillStyle = '#ffffff'; o.font = 8 * u + 'px "Archivo Black", sans-serif'; o.textBaseline = 'middle'; o.textAlign = 'center'; o.fillText('Z9', fx + 9.6 * u, fy - 24.2 * u);
  },

  tick(dt) {
    for (const s of this.sats) { s.x += s.v * dt; if (s.x > 1.1) s.x = -0.1; if (s.x < -0.1) s.x = 1.1; }
    const rv = this.rover; rv.x += rv.dir * 0.012 * dt; if (rv.x > 0.95) rv.dir = -1; if (rv.x < 0.05) rv.dir = 1;
    const sh = this.ship;
    if (sh.p < 0) { sh.wait -= dt; if (sh.wait <= 0) { sh.p = 0; sh.dir = Math.random() < 0.5 ? 1 : -1; sh.y = rand(0.42, 0.6); } }
    else { sh.p += dt / 16; if (sh.p > 1.2) { sh.p = -1; sh.wait = rand(14, 30); } }
    // broken modules arc and spark
    this.spark -= dt;
    if (this.spark <= 0) {
      this.spark = rand(0.25, 0.8);
      const dead = game.cities.filter(c => !c.alive);
      if (dead.length) { const ct = dead[(Math.random() * dead.length) | 0]; burst(ct.fx * W + rand(-16, 16) * u, G - rand(3, 12) * u, 5, '170,215,255', 70 * u, 0.6, 1.6); }
    }
  },

  ambient(c) {
    drawStars(c, this.stars, this.hz, s => (s.hue < 0.15 ? '255,220,190' : s.hue < 0.35 ? '190,215,255' : '240,244,255'));
    // Earth
    if (this.es) {
      const [ex, ey, R] = this.earth, { ec, cc, sc, d } = this.es;
      soft(c, ex, ey, R * 1.9, '90,160,255', 0.5);
      c.save(); c.beginPath(); c.arc(ex, ey, R, 0, TAU); c.clip();
      c.drawImage(ec, ex - R, ey - R, d, d);
      c.drawImage(cc, ex - R - ((time * 2.4 * u) % d), ey - R, d * 2, d);
      c.drawImage(sc, ex - R, ey - R, d, d);
      c.restore();
      c.strokeStyle = 'rgba(150,205,255,0.6)'; c.lineWidth = 1.5; c.beginPath(); c.arc(ex, ey, R + 0.5, -Math.PI * 0.62, Math.PI * 0.62); c.stroke();
    }
    for (const s of this.sats) {                           // satellites
      const x = s.x * W, y = s.y * G + (s.x - 0.5) * (s.x - 0.5) * 60 * u;
      rect(c, x - 6 * u, y - 0.9 * u, 4 * u, 1.8 * u, '#3f6fd8'); rect(c, x + 2 * u, y - 0.9 * u, 4 * u, 1.8 * u, '#3f6fd8'); rect(c, x - 1.6 * u, y - 1.4 * u, 3.2 * u, 2.8 * u, '#e8ebf2');
      if (Math.floor(time * 2 + s.x * 9) % 2) soft(c, x, y, 5 * u, '255,90,90', 0.8);
    }
    const sh = this.ship;                                  // supply ship passing low over the horizon
    if (sh.p >= 0) {
      const x = (sh.dir > 0 ? sh.p : 1 - sh.p) * (W + 160 * u) - 80 * u, y = sh.y * G + Math.sin(sh.p * 5) * 6 * u, s = 1.2 * u;
      soft(c, x - sh.dir * 22 * s, y, 16 * s, '120,190,255', 0.85);
      c.save(); c.translate(x, y); c.scale(sh.dir * s, s);
      poly(c, [[-18, 0], [-30 - Math.random() * 8, -2], [-30 - Math.random() * 8, 2]], 'rgba(170,220,255,0.85)');
      poly(c, [[22, 0], [10, -5], [-16, -5], [-19, 0], [-16, 5], [10, 5]], '#e3e7ef');
      poly(c, [[22, 0], [10, -5], [-16, -5], [-17, -2.5], [17, -2.5]], '#ffffff');
      poly(c, [[-8, -5], [-15, -11], [-18, -11], [-14, -5]], '#b8bfcc'); rect(c, -6, 1, 12, 1, ORANGE);
      for (let k = 0; k < 4; k++) rect(c, 2 + k * 3, -1.6, 1.6, 1.6, '#1a2f7a');
      c.restore();
    }
    // rover trundling across the plain
    const rv = this.rover, rx = rv.x * W, ry = this.Y(0.52), s = 0.9 * u;
    for (let k = 0; k < 4; k++) soft(c, rx - rv.dir * (12 + k * 7) * s, ry - (1 + k * 1.4) * s, (3 + k * 2) * s, '190,192,202', 0.28 - k * 0.06);
    c.save(); c.translate(rx, ry); c.scale(rv.dir * s, s);
    c.fillStyle = lgrad(c, 10, -4, 60, -4, ['rgba(255,250,220,0.3)', 'rgba(255,250,220,0)']); c.beginPath(); c.moveTo(10, -6); c.lineTo(60, -12); c.lineTo(60, 2); c.fill();
    for (const wx of [-8, 0, 8]) { circ(c, wx, 0, 3, '#2a2c36'); circ(c, wx, 0, 1.3, '#9a9da8'); }
    rrect(c, -11, -8, 22, 6, 1.5, '#eef0f5'); rect(c, -11, -4.4, 22, 0.8, ORANGE); rect(c, 4, -7, 5, 2.6, '#1a2f7a');
    rect(c, -9, -12, 12, 1, '#3f6fd8'); line(c, -3, -8, -3, -11, '#9a9da8', 0.6); line(c, -9, -8, -9, -16, '#9a9da8', 0.5); circ(c, -9, -16.4, 0.9, ORANGE);
    c.restore();
  },

  foreground(o) {
    const bt = G - this.baseH * u, rb = srand(40);
    groundPath(o, BASE_FX, bt, 54);
    o.fillStyle = vgrad(o, bt, H, ['#7e818d', '#4e515c', '#26272f']); o.fill();
    o.save(); o.clip();
    for (let i = 0; i < W / 7; i++) { o.fillStyle = rb() < 0.5 ? 'rgba(0,0,0,0.14)' : 'rgba(255,255,255,0.06)'; o.beginPath(); o.ellipse(rb() * W, G + rb() * (H - G), (4 + rb() * 18) * u, (1.5 + rb() * 4) * u, 0, 0, TAU); o.fill(); }
    o.restore();
    groundPath(o, BASE_FX, bt, 54); o.strokeStyle = 'rgba(236,238,244,0.75)'; o.lineWidth = 1.4; o.stroke();
    for (const f of BASE_FX) {                             // steel firing platforms
      const x = f * W;
      o.fillStyle = hgrad(o, x - 17 * u, x + 17 * u, ['#5c6170', '#c9cdd8']); o.fillRect(x - 17 * u, bt - 1, 34 * u, 3 * u);
      for (let k = 0; k < 6; k++) { o.fillStyle = k % 2 ? '#f2c230' : '#2a2c36'; o.fillRect(x - 17 * u + (k * 34 * u) / 6, bt + 2 * u, (34 * u) / 6, 1.4 * u); }
    }
  },

  cityArt(c, i) { ART[i](c); },
  ruinArt(c, i) { ruinFrom(c, ART[i], { seed: i + 41, cut: 11, a: '#5a5d68', b: '#a3a6b2', tint: 'rgba(16,18,28,0.55)' }); },

  cityAnim(c, i, city) {
    if (!city.alive) return;
    const blink = (x, y, rgb, f = 1.4, ph = 0) => beacon(c, x, y, 0.7, rgb, Math.floor(time * f + ph) % 2 === 0);
    if (i === 0) blink(-28, 22.6, '255,80,80');
    else if (i === 1) {
      dish(c, 0, 42, 9, 0.2 + Math.sin(time * 0.3) * 0.25, Math.cos(time * 0.5) * 0.75 + (Math.cos(time * 0.5) >= 0 ? 0.25 : -0.25));
      blink(-22, 20.6, '255,80,80', 2); soft(c, 15, 8.2, 3, '143,208,255', 0.5 + 0.4 * Math.sin(time * 4));
    } else if (i === 2) {
      blink(-15, 49, '255,80,80', 1.2);
      for (let k = 0; k < 3; k++) { const p = (time * 0.35 + k / 3) % 1; soft(c, -5 - p * 8, 3 + p * 2, 2 + p * 5, '235,240,250', 0.4 * (1 - p)); soft(c, 5 + p * 8, 3 + p * 2, 2 + p * 5, '235,240,250', 0.4 * (1 - p)); }
    } else if (i === 3) {
      soft(c, -19, 6.4, 6 + Math.sin(time * 3) * 1.5, '143,208,255', 0.7);
      const g = (time * 0.4) % 1; c.fillStyle = 'rgba(255,255,255,' + 0.7 * Math.sin(g * Math.PI) + ')'; c.fillRect(-4 + g * 36, 6 + g * 3, 2.4, 5);
    } else if (i === 4) blink(18 - Math.sin(0.55) * 8.2, 21 + Math.cos(0.55) * 8.2, '255,160,60', 2.2);
    else if (i === 5) {
      soft(c, -19, 38.6, 5, '255,170,60', 0.5 + 0.5 * Math.sin(time * 7));
      for (let k = 0; k < 4; k++) { const p = (time * 0.4 + k / 4) % 1; circ(c, -11.5 + p * 11, 3.4 + p * 21, 0.9, '#8a8c96'); }
    }
  },

  base(c, b) {
    if (b.alive) {
      let ang = Math.PI / 2;
      const p = game.pointer;
      if (p.inside && game.mode === 'playing') ang = clamp(Math.atan2(G - this.baseH * u - p.y, p.x - b.fx * W), 0.3, Math.PI - 0.3);
      const hot = clamp(1 - (time - b.fireT) * 4, 0, 1);
      c.save(); c.translate(0, 6.5); c.rotate(ang);
      for (const dy of [-2, 2]) { rect(c, 2 - hot * 3, dy - 0.9, 15, 1.8, "#dfe3ea"); rect(c, 6 - hot * 3, dy - 1.3, 1.2, 2.6, GLOW); rect(c, 11 - hot * 3, dy - 1.3, 1.2, 2.6, GLOW); }
      c.restore();
      c.fillStyle = rgrad(c, 3, 9, 1, 10, HULL); c.beginPath(); c.arc(0, 2.4, 8, 0, Math.PI); c.closePath(); c.fill();
      rect(c, -11, 0, 22, 2.4, hgrad(c, -11, 11, [HULL[2], HULL[0]])); rect(c, -11, 1, 22, 0.7, ORANGE);
      circ(c, 0, 6, 2.2, DARK[2]); circ(c, 0, 6, 1.5, hot > 0 ? '#ffffff' : GLOW);
      soft(c, 0, 6, 7 + hot * 12, '143,208,255', 0.55 + hot * 0.45);
    } else {
      poly(c, [[-9, 0], [-4, 5], [0, 2], [5, 6], [9, 0]], DARK[1]);
    }
    pips(c, b, '#bfe3ff', 'rgba(191,227,255,0.16)', { y: -5 });
  },

  // Impacts throw up slow fans of dust.
  onImpact(t) {
    for (let k = 0; k < 16; k++) { const a = -Math.PI * rand(0.1, 0.9), sp = rand(20, 90) * u; puff(t.x, t.y - 2 * u, { kind: 'dust', rgb: '176,178,190', r: rand(3, 6) * u, gr: 7 * u, a: 0.45, fa: 0.13, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.55 }); }
  },

  head(c, t, rgb) {
    const a = Math.atan2(t.vy, t.vx);
    if (t.kind === 'smart') {                              // something that is not a rock
      soft(c, t.x, t.y, 16 * u, '120,255,150', 0.7);
      c.save(); c.translate(t.x, t.y); c.rotate(time * 4); c.scale(u, u);
      poly(c, [[0, -7], [3, 0], [0, 7], [-3, 0]], '#d8ffe0'); poly(c, [[-7, 0], [0, -3], [7, 0], [0, 3]], '#7dffa0'); circ(c, 0, 0, 1.6, '#ffffff');
      c.restore();
      return;
    }
    c.save(); c.translate(t.x, t.y); c.rotate(a); c.scale(u, u);
    c.fillStyle = lgrad(c, -34, 0, 4, 0, ['rgba(255,150,60,0)', 'rgba(255,190,90,0.75)', 'rgba(255,245,220,0.95)']);
    c.beginPath(); c.moveTo(4, -4.4); c.quadraticCurveTo(-14, -2.4, -34 - Math.random() * 8, 0); c.quadraticCurveTo(-14, 2.4, 4, 4.4); c.fill();
    c.restore();
    soft(c, t.x, t.y, 13 * u, '255,190,110', 0.85);
    c.save(); c.translate(t.x, t.y); c.rotate(t.sx + time * 2); c.scale(u, u);
    poly(c, [[-3.6, -1.6], [-1, -3.8], [2.8, -2.6], [4, 0.6], [1.6, 3.6], [-2.4, 3], [-4, 0.8]], '#5a4638');
    poly(c, [[-1, -3.8], [2.8, -2.6], [4, 0.6], [1, -0.6]], '#8a6a52');
    c.restore();
  },
  shotHead(c, s) {
    soft(c, s.x, s.y, 11 * u, '150,210,255', 0.9);
    circ(c, s.x, s.y, 2.2 * u, '#ffffff');
  },

  flyer(c, f) {                                            // a saucer, naturally
    const x = f.x, y = f.y + Math.sin(time * 2 + f.x * 0.01) * 3 * u, s = 1.15 * u;
    soft(c, x, y + 8 * s, 22 * s, '120,255,170', 0.35 + 0.15 * Math.sin(time * 6));
    c.save(); c.translate(x, y); c.scale(s, s); c.rotate(Math.sin(time * 1.5) * 0.06);
    c.fillStyle = rgrad(c, -3, -8, 1, 10, ['rgba(220,255,235,0.95)', 'rgba(120,230,170,0.6)']); c.beginPath(); c.ellipse(0, -3, 8, 7, 0, Math.PI, 0); c.fill();
    c.fillStyle = vgrad(c, -4, 5, ['#f1f3f8', '#9aa0b0', '#4a4f5e']); c.beginPath(); c.ellipse(0, 0, 21, 5.4, 0, 0, TAU); c.fill();
    c.fillStyle = '#2a2d38'; c.beginPath(); c.ellipse(0, 3, 10, 2.2, 0, 0, TAU); c.fill();
    for (let k = -3; k <= 3; k++) circ(c, k * 5.4, 0.6, 1.1, (Math.floor(time * 6) + k + 9) % 3 === 0 ? '#7dffa0' : '#ffe680');
    c.restore();
  },
};
