// Steamworks: a brass-and-copper city of clockwork, airships and steam.
import {
  TAU, W, H, G, u, time, game, srand, rand, clamp, mkCanvas,
  rect, poly, circ, ell, line, ring, dome, vgrad, hgrad, lgrad, rgrad, rrect, rrectPath, windows, soft, beacon,
  gear, gearPath, Clouds, skyline, pips, ruinFrom, puff,
} from '../core.js';

const CITY_FX = [0.215, 0.3, 0.385, 0.615, 0.7, 0.785];
const BASE_FX = [0.08, 0.5, 0.92];
const BR = ['#fff0b4', '#e0aa45', '#8f5e1e'];      // brass: highlight, body, shade
const CU = ['#f4a877', '#c0623a', '#743320'];      // copper
const IR = ['#5d5048', '#352b26', '#1b1512'];      // iron
const VD = ['#9be0cf', '#4f9f90', '#2f6f66'];      // verdigris
const BK = ['#b06a42', '#7f4329', '#57291a'];      // brick
const LAMP = '#ffd98a';

// Shading for round metal: dark edge, bright streak, body, dark edge.
const tube = (c, x0, x1, m) => hgrad(c, x0, x1, [[0, m[2]], [0.28, m[0]], [0.55, m[1]], [1, m[2]]]);
function rivets(c, x, y, w, n, col = BR[0], r = 0.35) { for (let k = 0; k < n; k++) circ(c, x + (w * (k + 0.5)) / n, y, r, col); }
function archWin(c, x, y, w, h, fill) {            // unit coords: arched top
  c.fillStyle = fill; c.beginPath(); c.moveTo(x, y); c.lineTo(x, y + h - w / 2); c.arc(x + w / 2, y + h - w / 2, w / 2, Math.PI, 0, true); c.lineTo(x + w, y); c.closePath(); c.fill();
}
function gothWin(c, x, y, w, h, fill) {            // pointed top
  c.fillStyle = fill; c.beginPath(); c.moveTo(x, y); c.lineTo(x, y + h * 0.65); c.quadraticCurveTo(x + w / 2, y + h * 1.25, x + w, y + h * 0.65); c.lineTo(x + w, y); c.closePath(); c.fill();
}
function brick(c, x, y, w, h) {
  c.fillStyle = hgrad(c, x, x + w, [BK[0], BK[1]]); c.fillRect(x, y, w, h);
  c.strokeStyle = 'rgba(40,15,8,0.22)'; c.lineWidth = 0.2; c.beginPath();
  for (let yy = y + 1.2; yy < y + h; yy += 1.2) { c.moveTo(x, yy); c.lineTo(x + w, yy); }
  c.stroke();
}
function lattice(c, x0, w0, y0, x1, w1, y1, n, col = IR[1], lw = 0.5) {   // tapered braced tower
  c.strokeStyle = col; c.lineWidth = lw; c.beginPath();
  c.moveTo(x0 - w0, y0); c.lineTo(x1 - w1, y1); c.moveTo(x0 + w0, y0); c.lineTo(x1 + w1, y1);
  for (let k = 0; k < n; k++) {
    const a = k / n, b = (k + 1) / n, ya = y0 + (y1 - y0) * a, yb = y0 + (y1 - y0) * b;
    const wa = w0 + (w1 - w0) * a, wb = w0 + (w1 - w0) * b, xa = x0 + (x1 - x0) * a, xb = x0 + (x1 - x0) * b;
    c.moveTo(xa - wa, ya); c.lineTo(xb + wb, yb); c.moveTo(xa + wa, ya); c.lineTo(xb - wb, yb); c.moveTo(xb - wb, yb); c.lineTo(xb + wb, yb);
  }
  c.stroke();
}

// ---------- the six works (static parts; moving parts are in cityAnim)
const ART = [
  // 0: Grand clock tower with its guild hall
  c => {
    brick(c, -30, 0, 60, 22);
    for (const x of [-27, -20.5, 16.5, 23]) { gothWin(c, x, 5, 4, 10, LAMP); rect(c, x + 1.85, 5, 0.3, 11, IR[1]); }
    for (const x of [-30.5, -15, 14, 29.5]) poly(c, [[x - 1, 0], [x + 1, 0], [x + 0.7, 24], [x - 0.7, 24]], BK[2]);
    poly(c, [[-31.5, 22], [31.5, 22], [28, 30], [-28, 30]], IR[1]);
    for (let x = -27; x <= 27; x += 3) poly(c, [[x - 0.6, 30], [x, 32.4], [x + 0.6, 30]], BR[1]);
    c.fillStyle = hgrad(c, -9.5, 9.5, [BK[0], BK[1], BK[2]]); c.fillRect(-9.5, 0, 19, 64);
    for (const x of [-10.5, 8.5]) rect(c, x, 0, 2, 64, BK[2]);
    for (const y of [22, 42, 62]) { rect(c, -11, y, 22, 1.6, tube(c, -11, 11, BR)); rivets(c, -10.5, y + 0.8, 21, 9, BR[2]); }
    circ(c, 0, 32, 5.6, BR[1]); circ(c, 0, 32, 4.7, IR[2]);                  // gear window
    gothWin(c, -5, 3, 3, 9, LAMP); gothWin(c, 2, 3, 3, 9, LAMP);
    archWin(c, -2, 0, 4, 7, IR[2]);
    rect(c, -11.5, 43.6, 23, 20, BK[1]);
    c.fillStyle = tube(c, -11.5, 11.5, BR); c.beginPath(); c.arc(0, 53.5, 9.6, 0, TAU); c.fill();
    circ(c, 0, 53.5, 8.2, '#fdf3d6');
    for (let k = 0; k < 12; k++) { const a = (k / 12) * TAU; line(c, Math.cos(a) * 6.6, 53.5 + Math.sin(a) * 6.6, Math.cos(a) * 7.8, 53.5 + Math.sin(a) * 7.8, IR[2], k % 3 ? 0.3 : 0.7); }
    rect(c, -10.5, 64, 21, 9.5, BK[1]);
    for (const x of [-8.5, -2, 4.5]) archWin(c, x, 65, 4, 7.4, IR[2]);
    rect(c, -11.5, 73, 23, 1.6, tube(c, -11.5, 11.5, BR));
    c.fillStyle = hgrad(c, -11, 11, [VD[0], VD[1], VD[2]]);
    c.beginPath(); c.moveTo(-11, 74.6); c.quadraticCurveTo(-4, 80, 0, 96); c.quadraticCurveTo(4, 80, 11, 74.6); c.closePath(); c.fill();
    for (const x of [-10.6, 10.6]) poly(c, [[x - 1.2, 74.6], [x, 81], [x + 1.2, 74.6]], VD[2]);
    rect(c, -0.3, 96, 0.6, 4, BR[1]); circ(c, 0, 100.6, 1, BR[0]);
  },
  // 1: Observatory with a copper dome
  c => {
    brick(c, -21, 0, 42, 25);
    for (let k = 0; k < 5; k++) archWin(c, -17.5 + k * 7.6, 6, 4.4, 11, k === 2 ? IR[2] : LAMP);
    rect(c, -22, 24, 44, 2.4, tube(c, -22, 22, BR)); rivets(c, -22, 25.2, 44, 16, BR[2]);
    c.fillStyle = rgrad(c, -7, 40, 2, 26, [VD[0], VD[1], VD[2]]); c.beginPath(); c.arc(0, 26.4, 21, 0, Math.PI); c.closePath(); c.fill();
    c.strokeStyle = BR[1]; c.lineWidth = 0.5;
    for (let k = 1; k < 6; k++) { c.beginPath(); c.ellipse(0, 26.4, 21 * Math.abs(1 - k / 3), 21, 0, 0, Math.PI); c.stroke(); }
    poly(c, [[2, 26.4], [8, 26.4], [6.2, 46.6], [3.4, 47.2]], IR[2]);                               // slit
    rect(c, -0.3, 47.2, 0.6, 3, BR[1]);
    brick(c, -31, 0, 9, 33);
    archWin(c, -28.5, 5, 4, 9, LAMP); archWin(c, -28.5, 19, 4, 8, LAMP);
    rect(c, -31.6, 32.4, 10.2, 1.4, tube(c, -31.6, -21.4, BR));
    c.fillStyle = tube(c, -31, -22, CU); c.beginPath(); c.arc(-26.5, 33.8, 4.5, 0, Math.PI); c.fill();
    poly(c, [[-4, 0], [4, 0], [3, 2], [-3, 2]], '#cdbfa6');
    rect(c, 24, 0, 5, 12, tube(c, 24, 29, CU)); rect(c, 23.4, 11.4, 6.2, 1.2, BR[1]);                 // pressure tank
    rivets(c, 24, 6, 5, 3, BR[0]);
  },
  // 2: Boiler works with twin copper stacks
  c => {
    for (const [x, w, h] of [[10, 6.5, 80], [19.5, 6.5, 68]]) {
      c.fillStyle = tube(c, x, x + w, CU); c.fillRect(x, 0, w, h);
      poly(c, [[x - 1, h], [x + w + 1, h], [x + w + 0.2, h - 3], [x - 0.2, h - 3]], tube(c, x - 1, x + w + 1, BR));
      for (const f of [0.25, 0.5, 0.75]) { rect(c, x - 0.4, h * f, w + 0.8, 1.4, tube(c, x - 0.4, x + w + 0.4, BR)); rivets(c, x, h * f + 0.7, w, 4, BR[2], 0.28); }
      rect(c, x + w * 0.15, h, w * 0.7, 0.8, IR[2]);
    }
    brick(c, -31, 0, 40, 20);
    for (let k = 0; k < 4; k++) {                                                                   // sawtooth north-lights
      const x = -31 + k * 10;
      poly(c, [[x, 20], [x + 10, 20], [x + 10, 28]], IR[1]);
      poly(c, [[x + 0.8, 20.6], [x + 9.4, 20.6], [x + 9.4, 26.8]], 'rgba(255,217,138,0.85)');
      for (let q = 1; q < 4; q++) line(c, x + 0.8 + q * 2.15, 20.6, x + 0.8 + q * 2.15, 20.6 + q * 1.55, IR[1], 0.3);
    }
    for (let k = 0; k < 3; k++) archWin(c, 0.5 + k * 3 - 31 + 28, 11, 2.2, 6, LAMP);
    rrect(c, -29, 1.5, 22, 12, 6, tube(c, -29, -7, CU));                                             // boiler
    c.fillStyle = lgrad(c, 0, 13.5, 0, 1.5, ['rgba(255,255,255,0.25)', 'rgba(255,255,255,0)', 'rgba(0,0,0,0.3)']); rrectPath(c, -29, 1.5, 22, 12, 6); c.fill();
    for (const x of [-23, -18, -13]) { rect(c, x, 1.5, 0.8, 12, BR[1]); rivets(c, x + 0.4, 3, 0, 1, BR[0]); }
    circ(c, -18, 16.2, 2.6, BR[1]); circ(c, -18, 16.2, 2, '#fdf3d6'); line(c, -18, 16.2, -16.7, 17.4, '#a02a1c', 0.4);
    rect(c, -18.4, 13.4, 0.8, 1, BR[2]);
    c.strokeStyle = tube(c, -7, 12, BR); c.lineWidth = 1.8; c.lineCap = 'butt';                      // steam main to the stacks
    c.beginPath(); c.moveTo(-7, 9); c.lineTo(4, 9); c.lineTo(4, 30); c.lineTo(10, 30); c.stroke();
    rect(c, 3.2, 14, 1.6, 1.2, IR[2]); rect(c, 3.2, 24, 1.6, 1.2, IR[2]);
    rect(c, -5.5, 0, 13, 1.4, IR[1]);                                                                // flywheel bed
  },
  // 3: Airship dock: mooring mast, crane and a tethered launch
  c => {
    brick(c, -20, 0, 40, 11);
    for (let k = 0; k < 5; k++) archWin(c, -17 + k * 7.6, 2.6, 3.4, 6, k === 2 ? IR[2] : LAMP);
    poly(c, [[-21.5, 11], [21.5, 11], [19, 14.5], [-19, 14.5]], IR[1]);
    lattice(c, 0, 9, 14.5, 0, 2.6, 74, 7, IR[0], 0.7);
    lattice(c, 0, 9, 14.5, 0, 2.6, 74, 7, IR[2], 0.3);
    for (const [y, w] of [[31.5, 12], [53, 9], [74, 7]]) {
      rect(c, -w, y, w * 2, 1.2, tube(c, -w, w, BR));
      line(c, -w, y + 3.6, w, y + 3.6, BR[1], 0.3);
      for (let x = -w; x <= w; x += 2) line(c, x, y + 1.2, x, y + 3.6, BR[2], 0.25);
    }
    rect(c, -0.5, 74, 1, 9, IR[1]); circ(c, 0, 83.4, 1.1, BR[0]);
    line(c, 0, 54, 25, 61, IR[1], 0.9); line(c, 0, 60, 25, 61, IR[1], 0.4); line(c, 0, 54, 12, 57.3, IR[2], 0.4);   // crane jib
    line(c, 23, 60.6, 23, 44, IR[2], 0.25); rect(c, 20.6, 39.6, 4.8, 4.4, '#8a5a36'); line(c, 20.6, 41.8, 25.4, 41.8, BR[1], 0.3);
    rect(c, -29, 0, 6, 9, tube(c, -29, -23, CU)); rect(c, -29.5, 8.6, 7, 1.1, BR[1]);                 // gas cylinder
  },
  // 4: Tesla tower
  c => {
    brick(c, -15, 0, 30, 13);
    for (let k = 0; k < 4; k++) archWin(c, -12.4 + k * 7, 3, 3.6, 7, LAMP);
    poly(c, [[-16.5, 13], [16.5, 13], [12, 18], [-12, 18]], VD[2]);
    lattice(c, 0, 11, 18, 0, 3.4, 62, 6, IR[0], 0.8);
    for (let k = 0; k < 6; k++) {                                                                     // copper coil rings
      const y = 22 + k * 7, w = 10.2 - k * 1.25;
      c.fillStyle = tube(c, -w, w, CU); c.beginPath(); c.ellipse(0, y, w, 1.5, 0, 0, TAU); c.fill();
    }
    rect(c, -1.4, 18, 2.8, 46, tube(c, -1.4, 1.4, IR));
    for (let k = 0; k < 4; k++) c.fillStyle = '#e9e2d0', c.beginPath(), c.ellipse(0, 63 + k * 1.7, 2.6 - k * 0.2, 0.8, 0, 0, TAU), c.fill();   // insulators
    c.fillStyle = tube(c, -11, 11, CU); c.beginPath(); c.ellipse(0, 71, 11, 3.6, 0, 0, TAU); c.fill();
    c.fillStyle = 'rgba(0,0,0,0.3)'; c.beginPath(); c.ellipse(0, 70.4, 6, 1.6, 0, 0, TAU); c.fill();
    c.fillStyle = rgrad(c, -2, 79, 0.5, 7, [BR[0], BR[1], BR[2]]); c.beginPath(); c.arc(0, 77.5, 5.6, 0, TAU); c.fill();
    for (const s of [-1, 1]) {                                                                        // spark-gap pylons
      rect(c, s * 25 - 1, 0, 2, 26, tube(c, s * 25 - 1, s * 25 + 1, IR));
      for (let k = 0; k < 3; k++) c.fillStyle = '#e9e2d0', c.beginPath(), c.ellipse(s * 25, 26.6 + k * 1.5, 1.9, 0.7, 0, 0, TAU), c.fill();
      circ(c, s * 25, 32.4, 2, BR[1]); circ(c, s * 25 - 0.6, 33, 0.6, BR[0]);
    }
  },
  // 5: Crystal palace: iron and glass
  c => {
    const glass = lgrad(c, 0, 0, 0, 40, ['rgba(255,214,130,0.95)', 'rgba(255,236,180,0.9)', 'rgba(170,232,220,0.9)']);
    rect(c, -31, 0, 62, 1.4, '#cdbfa6');
    c.fillStyle = glass; c.fillRect(-30, 1.4, 60, 13);
    c.beginPath(); c.ellipse(0, 14.4, 30, 9, 0, 0, Math.PI); c.fill();
    c.beginPath(); c.arc(0, 14.4, 19, 0, Math.PI); c.fill();
    for (const [x, h] of [[-22, 9], [-12, 12], [13, 11], [23, 8]]) {                                   // palms inside
      line(c, x, 1.4, x + 0.6, h, 'rgba(50,90,60,0.7)', 0.5);
      for (let k = 0; k < 5; k++) { const a = 0.5 + k * 0.55; c.strokeStyle = 'rgba(50,110,70,0.75)'; c.lineWidth = 0.5; c.beginPath(); c.moveTo(x + 0.6, h); c.quadraticCurveTo(x + 0.6 + Math.cos(a) * 3, h + Math.sin(a) * 3, x + 0.6 + Math.cos(a) * 5, h + Math.sin(a) * 1.5); c.stroke(); }
    }
    c.strokeStyle = IR[1]; c.lineWidth = 0.35;
    for (let x = -30; x <= 30; x += 3) line(c, x, 1.4, x, 14.4, IR[1], 0.35);
    line(c, -30, 8, 30, 8, IR[1], 0.35);
    for (let k = 1; k < 9; k++) { c.beginPath(); c.ellipse(0, 14.4, 30 * Math.abs(1 - k / 4.5), 9, 0, 0, Math.PI); c.stroke(); }
    c.lineWidth = 0.45;
    for (let k = 1; k < 8; k++) { c.beginPath(); c.ellipse(0, 14.4, 19 * Math.abs(1 - k / 4), 19, 0, 0, Math.PI); c.stroke(); }
    for (const r of [6.5, 12.5]) { c.beginPath(); c.arc(0, 14.4, 19, Math.asin(r / 19), Math.PI - Math.asin(r / 19)); c.stroke(); line(c, -Math.sqrt(361 - r * r), 14.4 + r, Math.sqrt(361 - r * r), 14.4 + r, IR[1], 0.35); }
    rect(c, -30.6, 13.8, 61.2, 1.2, tube(c, -30.6, 30.6, BR)); rect(c, -30.6, 0.8, 61.2, 1.2, IR[1]);
    c.strokeStyle = BR[1]; c.lineWidth = 0.9; c.beginPath(); c.arc(0, 14.4, 19, 0, Math.PI); c.stroke();
    archWin(c, -3.4, 1.4, 6.8, 10.5, IR[2]); archWin(c, -2.6, 1.4, 5.2, 9.4, LAMP);
    rect(c, -0.3, 33.4, 0.6, 9, BR[1]); circ(c, 0, 33.6, 1.4, BR[1]);
  },
];

// Airship, used for the friendly traffic and (in black and red) for the raider.
function airship(c, x, y, s, dir, pal, prop) {
  c.save(); c.translate(x, y); c.scale(dir * s, s);
  c.strokeStyle = pal.rope; c.lineWidth = 0.4;
  c.beginPath(); c.moveTo(-9, 6); c.lineTo(-6, 11); c.moveTo(9, 6); c.lineTo(6, 11); c.moveTo(0, 8); c.lineTo(0, 11); c.stroke();
  poly(c, [[-22, 0], [-33, -9], [-29, 0], [-33, 9]], pal.fin);
  poly(c, [[-22, -2], [-30, -12], [-18, -6]], pal.fin);
  c.fillStyle = vgrad(c, -9.5, 9.5, pal.env); c.beginPath(); c.ellipse(0, 0, 27, 9.5, 0, 0, TAU); c.fill();
  c.strokeStyle = pal.seam; c.lineWidth = 0.5;
  for (const k of [-18, -9, 0, 9, 18]) { c.beginPath(); c.ellipse(k, 0, 1.6, 9.5 * Math.sqrt(1 - (k / 27) ** 2), 0, 0, TAU); c.stroke(); }
  c.fillStyle = 'rgba(255,255,255,0.22)'; c.beginPath(); c.ellipse(-2, -4.5, 18, 2.4, 0, 0, TAU); c.fill();
  circ(c, 26.4, 0, 1.6, pal.trim);
  rrect(c, -9, 11, 18, 5.4, 2, pal.car);
  for (let k = 0; k < 4; k++) rect(c, -6.6 + k * 3.6, 12.4, 2, 1.8, pal.glow);
  rect(c, -9, 15.6, 18, 0.8, pal.trim);
  rect(c, -12.6, 13, 3.6, 1, pal.rope);
  const a = Math.abs(Math.sin(prop));
  c.fillStyle = pal.rope; c.fillRect(-13.6, 13.5 - 5 * a, 1, 10 * a);
  c.restore();
}
const SHIP_A = { env: ['#f2c98a', '#c98c4a', '#7a4a24'], fin: '#8c3b2a', seam: 'rgba(60,30,10,0.35)', trim: BR[1], car: '#6b3f26', glow: LAMP, rope: '#3a2414' };
const SHIP_B = { env: ['#b8d9cc', '#5f9c8e', '#2f5f58'], fin: '#b5562f', seam: 'rgba(20,50,45,0.35)', trim: BR[1], car: '#5a3a26', glow: LAMP, rope: '#2a2018' };
const RAIDER = { env: ['#5a4e4e', '#2a2226', '#0f0c0e'], fin: '#a3201c', seam: 'rgba(255,90,60,0.35)', trim: '#a3201c', car: '#1b1512', glow: '#ff5a3c', rope: '#0f0c0e' };

function balloon(c, x, y, s, a, b) {
  c.save(); c.translate(x, y); c.scale(s, s);
  c.beginPath(); c.moveTo(0, 15); c.bezierCurveTo(-16, 4, -13, -16, 0, -16); c.bezierCurveTo(13, -16, 16, 4, 0, 15); c.closePath();
  c.save(); c.clip();
  for (let k = -3; k <= 3; k++) { c.fillStyle = k % 2 ? a : b; c.fillRect(k * 4.2 - 2.1, -17, 4.25, 33); }
  c.fillStyle = lgrad(c, -13, 0, 13, 0, ['rgba(255,255,255,0.28)', 'rgba(255,255,255,0)', 'rgba(0,0,0,0.3)']); c.fillRect(-14, -17, 28, 33);
  c.restore();
  c.strokeStyle = '#3a2414'; c.lineWidth = 0.4; c.beginPath(); c.moveTo(-2.4, 12.6); c.lineTo(-2, 19); c.moveTo(2.4, 12.6); c.lineTo(2, 19); c.stroke();
  rect(c, -2.4, 19, 4.8, 3.6, '#7a4a24');
  c.restore();
}

export default {
  id: 'steam',
  page: '#6aa39a', meta: '#3f7f7c',
  footer: ['rgba(255,236,190,0.92)', '#fff3cf', 'rgba(255,243,207,0.4)'],
  brand: { fill: '#2b170b', glows: [{ color: 'rgba(255,228,160,0.85)', blur: 14 }] },
  cityFx: CITY_FX, baseFx: BASE_FX, baseH: 30, cityBox: [70, 104, 4],
  cityLabel: 'WORKS', cityOne: 'WORKS',
  prompt: 'Defend the six works. Each cannon holds ten shells.',
  threat: [58, 36, 24], smart: [170, 60, 30], abm: [205, 120, 60], abmHead: BR[0], threatAlpha: 0.55, threatWidth: 1.8, abmAlpha: 0.85, marker: ['#2b170b', '#c0623a'],
  blast: ['rgba(255,250,224,0.98)', 'rgba(255,196,96,0.94)', 'rgba(232,98,44,0.7)', 'rgba(150,60,30,0)'],
  fx: { spark: '255,186,80', debris: '224,170,69', smoke: '64,52,46', haze: '236,228,214', city: '255,214,130', glow: '255,214,140', ring: '255,246,224' },
  ui: { text: '#2b170b', muted: 'rgba(43,23,11,0.72)', panel: 'rgba(252,238,208,0.96)', line: 'rgba(143,94,30,0.6)', ptext: '#2b170b', pmuted: 'rgba(43,23,11,0.7)', accent: '#9a5b16', warn: '#9b2d1f', gold: '#9a5b16', font: 'Cinzel, Georgia, serif' },

  init() {
    this.clouds = new Clouds({ n: 6, y0: 0.1, y1: 0.55, s0: 0.7, s1: 1.4, speed: 6, seed: 5, top: '#fff6dc', bottom: '#d9a877', alpha: 0.9 });
    this.ships = [{ x: 0.15, y: 0.2, s: 1.5, v: 0.008, pal: SHIP_A }, { x: 0.7, y: 0.33, s: 0.85, v: -0.006, pal: SHIP_B }, { x: 0.45, y: 0.12, s: 0.55, v: 0.004, pal: SHIP_A }];
    this.balloons = [{ x: 0.86, y: 0.5, s: 1, v: 0.004, a: '#9b2d1f', b: '#f4e3bd' }, { x: 0.33, y: 0.42, s: 0.7, v: -0.003, a: '#2f6f66', b: '#e0aa45' }];
    this.train = { x: -1, wait: 4, dir: 1 };
    this.emit = 0;
    this.vent = [0, 2.5];
  },
  layout() {
    this.vy = G - 36 * u;                                // viaduct deck
    this.sun = [W * 0.19, G * 0.4, clamp(G * 0.085, 40, 76)];
    this.gauges = [0.15, 0.205, 0.26, 0.74, 0.795, 0.85].map(f => f * W);
  },
  build() { this.clouds.build(); },

  // Riveted brass plaque for the HUD panels.
  panel(c, x, y, w, h) {
    c.save();
    c.shadowColor = 'rgba(40,20,5,0.4)'; c.shadowBlur = 20; c.shadowOffsetY = 5;
    rrectPath(c, x, y, w, h, 10); c.fillStyle = lgrad(c, x, y, x + w, y + h, [BR[0], BR[1], BR[2], BR[1], BR[0]]); c.fill();
    c.restore();
    rrectPath(c, x + 5, y + 5, w - 10, h - 10, 6); c.fillStyle = '#fbeed0'; c.fill();
    c.strokeStyle = 'rgba(90,50,10,0.5)'; c.lineWidth = 1; c.stroke();
    for (const [px, py] of [[x + 10, y + 10], [x + w - 10, y + 10], [x + 10, y + h - 10], [x + w - 10, y + h - 10]]) { circ(c, px, py, 2.6, BR[2]); circ(c, px - 0.6, py - 0.6, 1.2, BR[0]); }
  },

  backdrop(o) {
    const [sx, sy, sr] = this.sun, vy = this.vy;
    o.fillStyle = vgrad(o, 0, G, [[0, '#356f6e'], [0.3, '#7fb0a0'], [0.56, '#e6dca6'], [0.78, '#f3b765'], [1, '#d5733c']]);
    o.fillRect(0, 0, W, H);
    o.fillStyle = rgrad(o, sx, sy, 0, sr * 6, [[0, 'rgba(255,244,200,0.95)'], [0.2, 'rgba(255,226,150,0.5)'], [1, 'rgba(255,214,140,0)']]);
    o.fillRect(0, 0, W, G);
    const rb = srand(2);
    for (let i = 0; i < 9; i++) {                         // smog bands
      o.fillStyle = 'rgba(120,70,40,' + (0.05 + rb() * 0.06) + ')';
      o.beginPath(); o.ellipse(rb() * W, G * (0.55 + rb() * 0.38), (200 + rb() * 300) * u, (5 + rb() * 9) * u, 0, 0, TAU); o.fill();
    }
    // far city: domes, spires and chimneys
    const far = (seed, col, hmin, hmax) => skyline(o, { seed, base: G, hmin, hmax, wmin: 16, wmax: 40, gap: 8, color: col, deco: (q, x, top, w, h, rnd) => {
      const t = rnd();
      if (t < 0.22) { q.beginPath(); q.arc(x + w / 2, top, w * 0.42, Math.PI, 0); q.fill(); q.fillRect(x + w / 2 - u, top - w * 0.42 - 9 * u, 2 * u, 9 * u); }
      else if (t < 0.42) { q.beginPath(); q.moveTo(x + w * 0.25, top); q.lineTo(x + w / 2, top - (20 + rnd() * 26) * u); q.lineTo(x + w * 0.75, top); q.fill(); }
      else if (t < 0.7) { const cw = 4 * u; q.fillRect(x + w * 0.6, top - (24 + rnd() * 30) * u, cw, 60 * u); }
      else for (let k = 0; k < w - 8 * u; k += 8 * u) { q.beginPath(); q.moveTo(x + k, top); q.lineTo(x + k + 8 * u, top - 6 * u); q.lineTo(x + k + 8 * u, top); q.fill(); }
    } });
    far(31, 'rgba(120,84,70,0.4)', 40, 130);
    far(47, 'rgba(84,52,42,0.62)', 22, 84);
    const rw = srand(9);
    for (let i = 0; i < W / 9; i++) { o.fillStyle = 'rgba(255,214,130,' + (0.35 + rw() * 0.5) + ')'; o.fillRect(rw() * W, G - (4 + rw() * 60) * u, 1.6 * u, 2 * u); }
    o.fillStyle = vgrad(o, G - 90 * u, G, ['rgba(240,170,96,0)', 'rgba(244,176,100,0.45)']); o.fillRect(0, G - 90 * u, W, 90 * u);
    // iron viaduct
    const span = 68 * u, pier = 8 * u, rA = (span - pier) / 2, cy = vy + 9 * u + rA;
    o.fillStyle = vgrad(o, vy, G, ['#4a372d', '#2c1f19']);
    o.beginPath(); o.rect(-2, vy, W + 4, G - vy + 2);
    for (let x = -span / 2; x < W + span; x += span) {
      const cx = x + span / 2, th = Math.asin(clamp((cy - G) / rA, -1, 1));
      o.moveTo(cx + Math.cos(th) * rA, G + 2); o.arc(cx, cy, rA, -th, Math.PI + th, true); o.closePath();
    }
    o.fill('evenodd');
    o.fillStyle = vgrad(o, vy - 1.5 * u, vy + 2 * u, [BR[0], BR[1], BR[2]]); o.fillRect(0, vy - 1.5 * u, W, 3 * u);
    o.strokeStyle = 'rgba(40,26,20,0.9)'; o.lineWidth = Math.max(1, 0.8 * u);
    o.beginPath(); o.moveTo(0, vy - 7 * u); o.lineTo(W, vy - 7 * u);
    for (let x = 0; x < W; x += 5 * u) { o.moveTo(x, vy - 1.5 * u); o.lineTo(x + 2.5 * u, vy - 7 * u); o.lineTo(x + 5 * u, vy - 1.5 * u); }
    o.stroke();
    for (let x = span / 2; x < W + span; x += span) {      // gas lamps on the piers
      o.fillStyle = '#2c1f19'; o.fillRect(x - span / 2 - 0.7 * u, vy - 17 * u, 1.4 * u, 16 * u);
      o.fillStyle = rgrad(o, x - span / 2, vy - 18.5 * u, 0, 12 * u, ['rgba(255,226,150,0.9)', 'rgba(255,226,150,0)']); o.fillRect(x - span / 2 - 12 * u, vy - 30.5 * u, 24 * u, 24 * u);
      circ(o, x - span / 2, vy - 18.5 * u, 2 * u, '#fff3c8');
      for (let k = 0; k < 6; k++) circ(o, x - span / 2 - pier / 2 + 1.2 * u + (k % 2) * (pier - 2.4 * u), vy + (6 + k * 4) * u, 0.7 * u, '#6a5346');
    }
  },

  tick(dt) {
    this.clouds.tick(dt);
    for (const s of this.ships) { s.x += s.v * (0.7 + 0.4 * game.wind) * dt; if (s.x > 1.15) s.x = -0.15; if (s.x < -0.15) s.x = 1.15; }
    for (const b of this.balloons) { b.x += b.v * game.wind * dt; if (b.x > 1.1) b.x = -0.1; if (b.x < -0.1) b.x = 1.1; }
    const tr = this.train;
    if (tr.x < 0) { tr.wait -= dt; if (tr.wait <= 0) { tr.x = 0.001; tr.dir = Math.random() < 0.5 ? 1 : -1; } }
    else { tr.x += (W / 15) * dt; if (tr.x > W + 260 * u) { tr.x = -1; tr.wait = rand(9, 20); } }
    // steam: factory stacks, and safety valves on the deck
    this.emit -= dt;
    if (this.emit <= 0) {
      this.emit = game.lowFx ? 0.3 : 0.13;
      const k = u * game.cs;
      for (const ct of game.cities) {
        if (!ct.alive || ct.i !== 2) continue;
        const x = ct.fx * W;
        for (const [dx, h] of [[13.2, 81], [22.7, 69]]) puff(x + dx * k, G - h * k, { rgb: '246,240,230', r: 2.4 * k, gr: 7 * u, a: 0.5, fa: 0.2, vx: game.wind * rand(8, 14) * u, vy: -rand(16, 24) * u });
      }
    }
    this.vent.forEach((t, i) => {
      this.vent[i] = t - dt;
      if (this.vent[i] <= 0) {
        this.vent[i] = rand(3.5, 7);
        const x = (i ? 0.69 : 0.31) * W;
        for (let q = 0; q < 7; q++) puff(x + rand(-2, 2) * u, G - 3 * u, { rgb: '250,246,238', r: rand(2, 4) * u, gr: 16 * u, a: 0.55, fa: 0.5, vx: rand(-10, 10) * u + game.wind * 10 * u, vy: -rand(40, 90) * u });
      }
    });
  },

  ambient(c) {
    const [sx, sy, sr] = this.sun;
    // The clockwork sun: a glowing core inside turning brass rings and gears.
    circ(c, sx, sy, sr * 0.62, '#fff4cc');
    soft(c, sx, sy, sr * 1.5, '255,236,170', 0.8);
    const brass = (a, b) => lgrad(c, sx - sr, sy - sr, sx + sr, sy + sr, [a, b]);
    gear(c, sx, sy, sr * 1.18, 28, time * 0.05, brass('rgba(214,160,60,0.95)', 'rgba(120,76,22,0.95)'), { spokes: 0, hub: 0.76, depth: 0.09 });
    gear(c, sx, sy, sr * 0.86, 20, -time * 0.08, brass('rgba(255,224,140,0.9)', 'rgba(170,112,34,0.9)'), { spokes: 0, hub: 0.8, depth: 0.1 });
    c.lineWidth = Math.max(1.5, 2.4 * u);
    for (let k = 0; k < 3; k++) {                         // armillary rings
      c.strokeStyle = k === 1 ? 'rgba(120,76,22,0.9)' : 'rgba(224,170,69,0.95)';
      c.beginPath(); c.ellipse(sx, sy, sr * 1.62, sr * (0.42 + 0.3 * Math.sin(time * 0.21 + k * 2.1)), time * 0.04 + k * 1.05, 0, TAU); c.stroke();
    }
    for (let k = 0; k < 3; k++) {                         // planets on the rings
      const a = time * (0.25 + k * 0.11) + k * 2, rx = sr * 1.62, ry = sr * (0.42 + 0.3 * Math.sin(time * 0.21 + k * 2.1)), rot = time * 0.04 + k * 1.05;
      const px = Math.cos(a) * rx, py = Math.sin(a) * ry;
      circ(c, sx + px * Math.cos(rot) - py * Math.sin(rot), sy + px * Math.sin(rot) + py * Math.cos(rot), (3 + k) * u, [CU[1], VD[1], BR[0]][k]);
    }
    gear(c, sx + sr * 1.45, sy + sr * 1.1, sr * 0.36, 12, time * 0.5, 'rgba(192,98,58,0.9)');
    gear(c, sx - sr * 1.5, sy - sr * 0.95, sr * 0.28, 10, -time * 0.62, 'rgba(79,159,144,0.9)');

    // great meshing gears turning in the upper corners
    if (!game.lowFx) {
      const r1 = 150 * u, r2 = 90 * u, n1 = 30, n2 = 18, w1 = time * 0.06, col = 'rgba(96,62,26,0.2)';
      gear(c, W - r1 * 0.35, r1 * 0.2, r1, n1, w1, col, { spokes: 6 });
      gear(c, W - r1 * 0.35 - (r1 + r2) * 0.93, r1 * 0.2 + (r1 + r2) * 0.24, r2, n2, (-w1 * n1) / n2 + Math.PI / n2 + 0.26, col, { spokes: 5 });
      gear(c, r2 * 0.1, r2 * 0.5, r2 * 1.2, 22, -time * 0.05, 'rgba(96,62,26,0.16)', { spokes: 6 });
    }
    this.clouds.draw(c);
    for (const b of this.balloons) balloon(c, b.x * W, b.y * G + Math.sin(time * 0.5 + b.x * 20) * 5 * u, b.s * u, b.a, b.b);
    for (const s of this.ships) airship(c, s.x * W, s.y * G + Math.sin(time * 0.7 + s.s * 9) * 4 * u, s.s * u, Math.sign(s.v), s.pal, time * 24);

    // the express on the viaduct
    const tr = this.train;
    if (tr.x > 0) {
      const s = 0.95 * u, y = this.vy - 1.5 * u, dir = tr.dir, X = d => (dir > 0 ? tr.x - d : W - tr.x + d);
      for (let k = 0; k < 5; k++) {
        const cx = X((52 + k * 31) * s);
        c.save(); c.translate(cx, y); c.scale(dir * s, s);
        rrect(c, -14, -13, 28, 10.5, 1.5, k % 2 ? '#7a2a22' : '#2f5f58');
        rect(c, -14, -13.8, 28, 1.6, IR[1]); rect(c, -14, -8.6, 28, 0.7, BR[1]);
        for (let q = 0; q < 5; q++) rect(c, -11.6 + q * 5, -11.6, 3.2, 2.6, LAMP);
        circ(c, -9, -1.6, 2, IR[2]); circ(c, 9, -1.6, 2, IR[2]);
        c.restore();
      }
      const ex = X(14 * s), spin = (tr.x / (4.4 * s)) * dir;
      c.save(); c.translate(ex, y); c.scale(dir * s, s);
      rrect(c, -20, -14.5, 12, 12, 1, '#2f5f58'); rect(c, -17.5, -12.6, 5, 4, LAMP); rect(c, -21, -15.6, 14, 1.4, IR[2]);     // cab
      c.fillStyle = vgrad(c, -13, -4, ['#5a8a80', '#2f5f58', '#1c3b37']); rrectPath(c, -8, -13, 26, 9, 4); c.fill();          // boiler
      for (const x of [-3, 5, 13]) rect(c, x, -13, 1, 9, BR[1]);
      rect(c, 10, -20, 3.4, 7.4, IR[1]); poly(c, [[8.8, -20], [14.6, -20], [13.6, -22.6], [9.8, -22.6]], BR[1]);              // funnel
      c.fillStyle = BR[1]; c.beginPath(); c.arc(1, -13, 2.6, Math.PI, 0); c.fill();
      poly(c, [[18, -5], [24, -1.5], [18, -1.5]], IR[1]);
      rect(c, -20, -4.4, 39, 1.3, '#7a2a22');
      for (const wx of [-13, -4, 5]) { circ(c, wx, -3.8, 4.2, IR[2]); circ(c, wx, -3.8, 3.2, '#7a2a22'); circ(c, wx, -3.8, 1, BR[1]); line(c, wx, -3.8, wx + Math.cos(spin) * 3, -3.8 + Math.sin(spin) * 3, BR[0], 0.6); }
      line(c, -13 + Math.cos(spin) * 2.6, -3.8 + Math.sin(spin) * 2.6, 5 + Math.cos(spin) * 2.6, -3.8 + Math.sin(spin) * 2.6, BR[0], 1);
      circ(c, 14, -2.4, 2, IR[2]);
      c.restore();
      for (let q = 0; q < 9; q++) soft(c, ex + dir * 11.5 * s - dir * q * 15 * s, y - (25 + q * 6) * s - Math.sin(time * 3 + q) * 2 * s, (5 + q * 3.2) * s, '250,246,238', 0.6 - q * 0.06);
    }
  },

  foreground(o) {
    const bt = G - this.baseH * u;
    o.fillStyle = vgrad(o, G, H, ['#4f4038', '#33281f', '#1c1410']);
    o.fillRect(0, G, W, H - G + 2);
    o.strokeStyle = 'rgba(0,0,0,0.35)'; o.lineWidth = 1;
    for (let x = 0; x < W; x += 74 * u) { o.beginPath(); o.moveTo(x, G); o.lineTo(x, H); o.stroke(); o.strokeStyle = 'rgba(255,220,170,0.06)'; o.beginPath(); o.moveTo(x + 1, G); o.lineTo(x + 1, H); o.stroke(); o.strokeStyle = 'rgba(0,0,0,0.35)'; }
    for (let x = 9 * u; x < W; x += 18.5 * u) for (const y of [G + 16 * u, H - 9 * u]) { circ(o, x, y, 1.7 * u, '#7d6652'); circ(o, x - 0.5 * u, y - 0.5 * u, 0.7 * u, '#d9bc92'); }
    for (const f of BASE_FX) {                             // armoured gun pits
      const x = f * W, w = 52 * u;
      o.beginPath(); o.moveTo(x - w, G + 2); o.lineTo(x - w * 0.62, bt); o.lineTo(x + w * 0.62, bt); o.lineTo(x + w, G + 2); o.closePath();
      o.fillStyle = lgrad(o, x - w, bt, x + w, G, ['#6a5a50', '#463a33', '#2a211c']); o.fill();
      o.strokeStyle = 'rgba(255,224,170,0.25)'; o.lineWidth = 1; o.stroke();
      o.fillStyle = vgrad(o, bt, bt + 3 * u, [BR[0], BR[2]]); o.fillRect(x - w * 0.62, bt, w * 1.24, 3 * u);
      for (let k = 0; k < 9; k++) circ(o, x - w * 0.56 + (k * w * 1.12) / 8, bt + 1.5 * u, 0.8 * u, BR[2]);
      for (let k = 0; k < 7; k++) { circ(o, x - w * 0.7 + (k * w * 1.4) / 6, G - 6 * u, 1.3 * u, '#7d6652'); circ(o, x - w * 0.7 + (k * w * 1.4) / 6 - 0.4 * u, G - 6.4 * u, 0.5 * u, '#d9bc92'); }
    }
    // brass steam main with flanges
    o.fillStyle = vgrad(o, G - 1.5 * u, G + 7 * u, [BR[0], BR[1], BR[2]]); o.fillRect(0, G - 1, W, 7.5 * u);
    for (let x = 22 * u; x < W; x += 96 * u) { o.fillStyle = vgrad(o, G - 3 * u, G + 9 * u, ['#f0c877', '#7a5216']); o.fillRect(x, G - 3 * u, 6 * u, 12 * u); }
    for (const x of this.gauges) {                         // pressure gauges (needles are animated)
      const y = G + 24 * u, r = 9 * u;
      o.fillStyle = vgrad(o, G + 6 * u, y, [BR[1], BR[2]]); o.fillRect(x - 1.5 * u, G + 6 * u, 3 * u, y - G - 6 * u);
      circ(o, x, y, r, BR[2]); o.fillStyle = rgrad(o, x - r * 0.3, y - r * 0.3, 0, r, [BR[0], BR[1]]); o.beginPath(); o.arc(x, y, r * 0.92, 0, TAU); o.fill();
      circ(o, x, y, r * 0.74, '#fbf1d6');
      o.strokeStyle = '#3a2414'; o.lineWidth = 1;
      for (let k = 0; k <= 8; k++) { const a = Math.PI * 0.8 + (k / 8) * Math.PI * 1.4; o.beginPath(); o.moveTo(x + Math.cos(a) * r * 0.56, y + Math.sin(a) * r * 0.56); o.lineTo(x + Math.cos(a) * r * 0.7, y + Math.sin(a) * r * 0.7); o.stroke(); }
      o.strokeStyle = '#b3261e'; o.lineWidth = 1.6; o.beginPath(); o.arc(x, y, r * 0.63, Math.PI * 1.95, Math.PI * 2.2); o.stroke();
    }
    for (const f of [0.31, 0.69]) {                        // safety valves
      const x = f * W;
      o.fillStyle = vgrad(o, G - 8 * u, G, [BR[0], BR[2]]); o.fillRect(x - 2 * u, G - 6 * u, 4 * u, 6 * u); o.fillRect(x - 3.4 * u, G - 7.4 * u, 6.8 * u, 2 * u);
      o.strokeStyle = '#b3261e'; o.lineWidth = 1.4 * u; o.beginPath(); o.ellipse(x + 6.5 * u, G - 3 * u, 3.6 * u, 3.6 * u, 0, 0, TAU); o.stroke();
      o.lineWidth = 0.8 * u; o.beginPath(); o.moveTo(x + 2.9 * u, G - 3 * u); o.lineTo(x + 10.1 * u, G - 3 * u); o.moveTo(x + 6.5 * u, G - 6.6 * u); o.lineTo(x + 6.5 * u, G + 0.6 * u); o.stroke();
    }
  },

  groundAnim(c) {                                          // twitching gauge needles
    this.gauges.forEach((x, k) => {
      const y = G + 24 * u, r = 9 * u, v = 0.5 + 0.3 * Math.sin(time * (0.5 + k * 0.13) + k * 2) + 0.04 * Math.sin(time * 17 + k);
      const a = Math.PI * 0.8 + clamp(v, 0, 1) * Math.PI * 1.4;
      c.strokeStyle = '#1b1512'; c.lineWidth = 1.3 * u; c.lineCap = 'round';
      c.beginPath(); c.moveTo(x - Math.cos(a) * r * 0.15, y - Math.sin(a) * r * 0.15); c.lineTo(x + Math.cos(a) * r * 0.62, y + Math.sin(a) * r * 0.62); c.stroke();
      circ(c, x, y, 1.4 * u, BR[2]);
    });
  },

  cityArt(c, i) { ART[i](c); },
  ruinArt(c, i) { ruinFrom(c, ART[i], { seed: i + 11, cut: 14, a: IR[1], b: BK[1], tint: 'rgba(30,20,14,0.5)' }); gear(c, 14, 4, 5, 9, 0.4, BR[2]); gear(c, -17, 3, 3.6, 8, 1.1, CU[2]); },

  cityAnim(c, i, city) {
    if (!city.alive) return;
    if (i === 0) {                                         // clock keeps the real time
      const d = new Date(), hr = ((d.getHours() % 12) + d.getMinutes() / 60) / 12, mn = (d.getMinutes() + d.getSeconds() / 60) / 60;
      const hand = (f, len, lw) => line(c, 0, 53.5, Math.sin(f * TAU) * len, 53.5 + Math.cos(f * TAU) * len, IR[2], lw);
      hand(hr, 4.2, 1); hand(mn, 6.6, 0.6); circ(c, 0, 53.5, 0.8, BR[2]);
      gear(c, -1.6, 33, 2.6, 8, time * 1.2, BR[1], { spokes: 0 }); gear(c, 2.1, 30.6, 2, 6, -time * 1.6 + 0.3, CU[1], { spokes: 0 });
      const sw = Math.sin(time * 2.4) * 0.5;               // pendulum in the doorway
      line(c, 0, 6.6, Math.sin(sw) * 5, 6.6 - Math.cos(sw) * 5, BR[1], 0.3); circ(c, Math.sin(sw) * 5, 6.6 - Math.cos(sw) * 5, 0.8, BR[0]);
    } else if (i === 1) {
      c.save(); c.translate(5, 31); c.rotate(1.02 + Math.sin(time * 0.23) * 0.16);
      c.fillStyle = vgrad(c, -1.6, 1.6, [BR[2], BR[0], BR[1]]); c.fillRect(0, -1.6, 21, 3.2);
      rect(c, 19.5, -2.2, 3, 4.4, BR[2]); rect(c, 6, -2, 1.2, 4, CU[1]); rect(c, 13, -2, 1.2, 4, CU[1]);
      c.restore();
      for (let k = 0; k < 3; k++) { c.strokeStyle = k ? BR[1] : CU[1]; c.lineWidth = 0.5; c.beginPath(); c.ellipse(-26.5, 42.5, 4, 4 * Math.abs(Math.cos(time * 0.7 + k * 1.1)) + 0.4, k * 1.05, 0, TAU); c.stroke(); }
      line(c, -26.5, 38.3, -26.5, 40, BR[2], 0.5); circ(c, -26.5, 42.5, 1, BR[0]);
    } else if (i === 2) {
      const a = time * 3.2, wx = 1, wy = 8.6, r = 6.4;
      gear(c, wx, wy, r, 16, a, tube(c, wx - r, wx + r, IR), { spokes: 6, hub: 0.14, depth: 0.1 });
      circ(c, wx, wy, 1.2, BR[1]);
      const px = wx + Math.cos(a) * 4, py = wy + Math.sin(a) * 4;
      line(c, px, py, -8.5 + Math.cos(a) * 1.6, 8.6, BR[0], 0.9); circ(c, px, py, 0.9, BR[2]);
      rect(c, -13 + Math.cos(a) * 1.6, 7.6, 5, 2, BR[1]);
      soft(c, -18, 16.2, 3.4, '255,217,138', 0.3 + 0.2 * Math.sin(time * 6));
    } else if (i === 3) {
      const bob = Math.sin(time * 1.1) * 1.2;
      line(c, 0, 83.4, 2, 88 + bob, '#3a2414', 0.25); line(c, -6, 75.2, -9, 89 + bob, '#3a2414', 0.2);
      c.save(); c.translate(1, 95 + bob); c.scale(0.62, -0.62);
      airship(c, 0, 0, 1, 1, { ...SHIP_A, env: ['#f6e3b4', '#b23a2a', '#6a1c14'] }, time * 20);
      c.restore();
      beacon(c, 0, 84.6, 0.7, '255,90,60', Math.floor(time * 1.5) % 2 === 0);
    } else if (i === 4) {
      const arc = (x0, y0, x1, y1, seed) => {
        const rnd = srand(seed); c.beginPath(); c.moveTo(x0, y0);
        for (let k = 1; k < 7; k++) { const t = k / 7; c.lineTo(x0 + (x1 - x0) * t + (rnd() - 0.5) * 7, y0 + (y1 - y0) * t + (rnd() - 0.5) * 7); }
        c.lineTo(x1, y1);
        c.strokeStyle = 'rgba(150,220,255,0.55)'; c.lineWidth = 1.5; c.stroke();
        c.strokeStyle = '#ffffff'; c.lineWidth = 0.45; c.stroke();
      };
      const tk = Math.floor(time * 14);
      soft(c, 0, 77.5, 13 + (tk % 3) * 2, '150,220,255', 0.6);
      if (tk % 5 < 3) arc(0, 77.5, -25, 32.4, tk);
      if ((tk + 2) % 5 < 3) arc(0, 77.5, 25, 32.4, tk + 91);
      if (tk % 7 === 0) arc(0, 83, rand(-14, 14), 98, tk + 5);
    } else if (i === 5) {
      for (let k = 0; k < 8; k++) {
        const wob = Math.sin(time * 5 * (0.6 + 0.4 * game.wind) - k * 0.9) * 0.5 * (k / 8);
        rect(c, 0.3 + k * 0.9, 38.6 + wob, 0.95, 3.6, k % 2 ? '#9b2d1f' : '#f4e3bd');
      }
      const g = (time * 0.35) % 1;
      c.fillStyle = 'rgba(255,255,255,' + 0.5 * Math.sin(g * Math.PI) + ')';
      c.beginPath(); c.ellipse(-16 + g * 32, 24 + Math.sin(g * Math.PI) * 6, 1.6, 4, -0.5, 0, TAU); c.fill();
    }
  },

  base(c, b) {
    if (b.alive) {
      let ang = Math.PI / 2;
      const p = game.pointer;
      if (p.inside && game.mode === 'playing') ang = clamp(Math.atan2(G - this.baseH * u - p.y, p.x - b.fx * W), 0.3, Math.PI - 0.3);
      const hot = clamp(1 - (time - b.fireT) * 4, 0, 1);
      c.save(); c.translate(0, 5); c.rotate(ang);
      c.fillStyle = vgrad(c, -2.4, 2.4, [BR[2], BR[0], BR[1], BR[2]]); c.fillRect(-hot * 4, -2.4, 18, 4.8);
      rect(c, 15.5 - hot * 4, -3.1, 3, 6.2, CU[1]); rect(c, 5 - hot * 4, -2.9, 1.4, 5.8, CU[1]);
      c.restore();
      c.fillStyle = rgrad(c, -3, 8, 1, 12, [BR[0], BR[1], BR[2]]); c.beginPath(); c.arc(0, 2, 10, 0, Math.PI); c.closePath(); c.fill();
      for (let k = 1; k < 7; k++) { const a = (k / 7) * Math.PI; circ(c, Math.cos(a) * 8.2, 2 + Math.sin(a) * 8.2, 0.7, BR[2]); }
      rect(c, -12, 0, 24, 2.4, CU[1]); rivets(c, -12, 1.2, 24, 9, BR[0], 0.45);
      circ(c, 0, 5.4, 2.2, IR[2]); circ(c, 0, 5.4, 1.5, hot > 0 ? '#ffd98a' : CU[1]);
    } else {
      poly(c, [[-10, 0], [-5, 5], [-1, 2], [5, 7], [10, 0]], IR[1]);
      gear(c, 6, 3, 3.4, 8, 0.5, BR[2]);
      soft(c, 0, 2, 9, '255,130,60', 0.55 + 0.3 * Math.sin(time * 5));
    }
    pips(c, b, BR[0], 'rgba(255,240,180,0.16)', { y: -6 });
  },

  onFire(b, sx, sy) {
    for (let q = 0; q < 5; q++) puff(sx + rand(-4, 4) * u, sy - rand(0, 8) * u, { rgb: '250,246,238', r: rand(3, 5) * u, gr: 14 * u, a: 0.5, fa: 0.6, vx: rand(-14, 14) * u, vy: -rand(8, 30) * u });
  },

  // Soot behind the falling bombs.
  trail(t, dt) {
    if (!game.lowFx && Math.random() < dt * 7) puff(t.x, t.y, { rgb: '70,56,48', r: 2 * u, gr: 5 * u, a: 0.26, fa: 0.2, vx: game.wind * 6 * u, vy: -5 * u });
  },

  head(c, t) {
    c.save(); c.translate(t.x, t.y); c.rotate(Math.atan2(t.vy, t.vx)); c.scale(u, u);
    const f = 3 + Math.random() * 4;
    soft(c, -9, 0, 9, '255,176,70', 0.9);
    poly(c, [[-5, -1.8], [-9 - f, 0], [-5, 1.8]], '#ffe7a6');
    if (t.kind === 'smart') {
      soft(c, 0, 0, 11, '255,90,50', 0.7);
      gear(c, 0, 0, 6.5, 9, time * 7, BR[1], { spokes: 0, hub: 0.3 }); circ(c, 0, 0, 2, '#ff6a3c');
    } else {
      poly(c, [[-4.5, -2], [-8.5, -5.5], [-3, -2.4]], BK[1]); poly(c, [[-4.5, 2], [-8.5, 5.5], [-3, 2.4]], BK[1]);
      ell(c, 0, 0, 6.4, 2.8, IR[2]); ell(c, 0.6, -0.9, 4, 0.8, 'rgba(255,255,255,0.22)');
      rect(c, -2.6, -2.8, 1.6, 5.6, BR[1]);
      circ(c, 5.4, 0, 1.6, BR[0]);
    }
    c.restore();
  },

  shotHead(c, s) {
    soft(c, s.x, s.y, 7 * u, '255,246,230', 0.7);
    c.save(); c.translate(s.x, s.y); c.rotate(Math.atan2(s.vy, s.vx)); c.scale(u, u);
    ell(c, 0, 0, 4, 1.7, BR[1]); circ(c, 3, 0, 1.3, BR[0]); rect(c, -3.6, -1.7, 1.2, 3.4, CU[1]);
    c.restore();
  },

  // Blasts throw a ring of steam; debris is little brass gears.
  blastExtra(c, b) {
    const k = b.r / b.max;
    for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU + b.seed * 6; soft(c, b.x + Math.cos(a) * b.r * 0.95, b.y + Math.sin(a) * b.r * 0.95, b.r * 0.42 * k, '252,248,240', 0.5 * k); }
  },
  particle(c, p, a, s) {
    if (p.rgb !== this.fx.debris && p.rgb !== this.fx.city) return false;
    c.globalAlpha = a; gear(c, p.x, p.y, s * 1.6, 7, p.rot, p.rgb === this.fx.city ? BR[0] : BR[1], { spokes: 0, hub: 0.3 }); c.globalAlpha = 1;
    return true;
  },

  flyer(c, f) {
    airship(c, f.x, f.y + Math.sin(time * 1.5 + f.x * 0.01) * 3 * u, 1.05 * u, Math.sign(f.vx), RAIDER, time * 30);
  },
};
