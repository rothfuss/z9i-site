// Laramie, Wyoming: the view west from town across the Laramie Plains.
// Left to right (south to north): Jelm Mountain with its observatory, the long ridge of Sheep Mountain,
// the Snowy Range (Medicine Bow Peak) above the forested Medicine Bow Mountains, and Elk Mountain.
// The six things to defend are town landmarks: Old Main, War Memorial Stadium and the Arena-Auditorium,
// the downtown brick blocks, the Union Pacific depot with the Garfield Street footbridge,
// St. Matthew's Cathedral and the Ivinson Mansion.
import {
  TAU, W, H, G, u, time, game, srand, rand, clamp, fbm, noise1, mkCanvas,
  rect, poly, circ, ell, line, dome, vgrad, hgrad, lgrad, rgrad, windows, soft, beacon,
  Clouds, Jet, lensCloudSprite, ridge, pips, ruinFrom,
} from '../core.js';

const CITY_FX = [0.215, 0.3, 0.385, 0.615, 0.7, 0.785];
const BASE_FX = [0.08, 0.5, 0.92];
const SAND = ['#e2caa0', '#c9ab7a', '#a98a5e'];           // local sandstone: light, mid, shade

// ---------- small unit-coordinate props
function spruce(c, x, h, col = '#2f5b48') {
  rect(c, x - 0.4, 0, 0.8, h * 0.2, '#4a3a2a');
  for (let k = 0; k < 3; k++) {
    const w = h * (0.27 - k * 0.06), y = h * (0.14 + k * 0.25);
    poly(c, [[x - w, y], [x, y + h * 0.42], [x + w, y]], col);
    poly(c, [[x, y], [x, y + h * 0.42], [x + w, y]], 'rgba(0,0,0,0.14)');
  }
}
function cottonwood(c, x, h, col = '#6c9a52') {
  rect(c, x - 0.5, 0, 1, h * 0.5, '#5a4632');
  circ(c, x, h * 0.66, h * 0.32, col);
  circ(c, x - h * 0.2, h * 0.56, h * 0.22, col);
  circ(c, x + h * 0.2, h * 0.55, h * 0.24, col);
  circ(c, x - h * 0.08, h * 0.74, h * 0.16, 'rgba(255,255,220,0.2)');
}
function coursing(c, x, y, w, h, step = 2.4) {            // faint stone courses
  c.strokeStyle = 'rgba(90,65,35,0.2)'; c.lineWidth = 0.25;
  c.beginPath();
  for (let yy = y + step; yy < y + h; yy += step) { c.moveTo(x, yy); c.lineTo(x + w, yy); }
  c.stroke();
}
function tallWin(c, x, y, w, h, arch = false, glass = '#33465f') {
  rect(c, x - 0.3, y - 0.3, w + 0.6, h + 0.6, '#f1e4c8');
  rect(c, x, y, w, h, glass);
  if (arch) { c.fillStyle = '#f1e4c8'; c.beginPath(); c.arc(x + w / 2, y + h, w / 2 + 0.3, 0, Math.PI); c.fill(); c.fillStyle = glass; c.beginPath(); c.arc(x + w / 2, y + h, w / 2, 0, Math.PI); c.fill(); }
  rect(c, x, y + h * 0.5, w, 0.25, '#f1e4c8');
}

// ---------- the six landmarks
const ART = [
  // 0: Old Main, University of Wyoming (1886): rough sandstone, central tower block without its old spire
  c => {
    rect(c, -31, 0, 62, 1.2, '#5f8f4a');
    c.fillStyle = hgrad(c, -27, 27, [SAND[0], SAND[1]]); c.fillRect(-27, 1, 54, 19);
    coursing(c, -27, 1, 54, 19);
    poly(c, [[-28.5, 20], [28.5, 20], [24.5, 26.5], [-24.5, 26.5]], '#5d4c42');
    poly(c, [[-28.5, 20], [28.5, 20], [27.6, 21.2], [-27.6, 21.2]], '#7a665a');
    for (const s of [-1, 1]) {                           // gabled end pavilions
      rect(c, s * 22 - 5.5, 1, 11, 22, s < 0 ? SAND[0] : SAND[1]);
      coursing(c, s * 22 - 5.5, 1, 11, 22);
      poly(c, [[s * 22 - 6.5, 23], [s * 22, 30], [s * 22 + 6.5, 23]], '#5d4c42');
      tallWin(c, s * 22 - 3.4, 4, 2.2, 6); tallWin(c, s * 22 + 1.2, 4, 2.2, 6);
      tallWin(c, s * 22 - 3.4, 13, 2.2, 6, true); tallWin(c, s * 22 + 1.2, 13, 2.2, 6, true);
    }
    for (const x of [-15, -11, 9, 13]) { tallWin(c, x, 4, 2, 5.5); tallWin(c, x, 12.5, 2, 5.5, true); }
    rect(c, -6.5, 1, 13, 30, SAND[0]);                    // central block
    coursing(c, -6.5, 1, 13, 30);
    rect(c, -7.2, 30.4, 14.4, 1.2, SAND[2]);
    rect(c, -5, 31.6, 10, 8.5, SAND[1]);
    coursing(c, -5, 31.6, 10, 8.5);
    poly(c, [[-6, 40.1], [0, 45], [6, 40.1]], '#5d4c42');
    tallWin(c, -3.6, 33, 2.2, 4.5, true); tallWin(c, 1.4, 33, 2.2, 4.5, true);
    tallWin(c, -4.6, 21, 2.4, 6, true); tallWin(c, -1.2, 21, 2.4, 6, true); tallWin(c, 2.2, 21, 2.4, 6, true);
    tallWin(c, -4.6, 12, 2.4, 6); tallWin(c, 2.2, 12, 2.4, 6);
    c.fillStyle = '#4a2f22'; c.beginPath(); c.rect(-2.2, 1, 4.4, 6); c.arc(0, 7, 2.2, 0, Math.PI); c.fill();   // arched entry
    poly(c, [[-5, 0], [5, 0], [3.4, 1.6], [-3.4, 1.6]], '#d9cdb8');
    rect(c, -0.25, 45, 0.5, 9, '#d8d8d8');               // flagpole (the flag itself is animated)
    spruce(c, -30, 17); spruce(c, 31, 15, '#2a5341');
  },
  // 1: Arena-Auditorium dome and War Memorial Stadium, brown and gold
  c => {
    rect(c, -31, 0, 62, 1, '#6a9a50');
    c.fillStyle = hgrad(c, -30, -2, ['#d9c7a6', '#b79f7c']); c.fillRect(-30, 1, 28, 7.5);
    rect(c, -30, 6.4, 28, 1.2, '#4a2f1c'); rect(c, -30, 5.2, 28, 0.8, '#f2b632');
    c.fillStyle = lgrad(c, -24, 22, -4, 8, ['#fbfbf7', '#cfd4d8', '#9aa3aa']);
    c.beginPath(); c.ellipse(-16, 8.5, 14.6, 9.5, 0, 0, Math.PI); c.fill();
    c.strokeStyle = 'rgba(80,90,100,0.3)'; c.lineWidth = 0.3;
    for (let k = 1; k < 8; k++) { c.beginPath(); c.ellipse(-16, 8.5, 14.6 * Math.abs(1 - k / 4), 9.5, 0, 0, Math.PI); c.stroke(); }
    rect(c, -17, 18, 2, 1.4, '#8d969d');
    for (let k = 0; k < 6; k++) rect(c, -28 + k * 4.6, 1.6, 2.4, 3, '#40546e');
    // stadium: sloped east stand with press box and light towers
    poly(c, [[1, 1], [31, 1], [31, 25], [27, 25], [1, 6.5]], '#b9b3a6');
    for (let k = 0; k < 7; k++) {
      const y0 = 7.4 + k * 2.5, x0 = 2.2 + k * 3.55;
      poly(c, [[x0, y0], [29.5, y0], [29.5, y0 + 1.5], [x0 + 2.1, y0 + 1.5]], k % 2 ? '#f2b632' : '#4a2f1c');
    }
    poly(c, [[1, 1], [31, 1], [31, 4], [1, 4]], '#8f897c');
    for (let k = 0; k < 6; k++) rect(c, 3 + k * 4.8, 1, 2.6, 2.6, '#3d342c');
    rect(c, 21, 25, 10, 5.5, '#4a2f1c'); rect(c, 21.8, 26.4, 8.4, 2.8, '#9fd0f0'); rect(c, 21, 30.5, 10, 0.9, '#f2b632');
    for (const [x, h] of [[4, 37], [17, 40], [30, 42]]) {
      rect(c, x - 0.35, 1, 0.7, h, '#6c7279');
      rect(c, x - 3.2, h, 6.4, 3.4, '#3a3f45');
      for (let r = 0; r < 2; r++) for (let q = 0; q < 4; q++) circ(c, x - 2.3 + q * 1.55, h + 0.9 + r * 1.6, 0.5, '#fff7d6');
    }
  },
  // 2: Downtown brick storefronts along 2nd Street
  c => {
    const B = [[-29, 13, 20, '#a4472f', '#2e6b5e'], [-16, 16, 26, '#8a3628', '#c8102e'], [0, 12, 18, '#c58a5a', '#f2b632'], [12, 17, 23, '#9b4a36', '#2f4f7f']];
    rect(c, -31, 0, 62, 0.9, '#8b8f93');
    B.forEach(([x, w, h, col, awn], k) => {
      c.fillStyle = hgrad(c, x, x + w, [col, shade(col)]); c.fillRect(x, 0.9, w, h);
      c.strokeStyle = 'rgba(40,15,10,0.18)'; c.lineWidth = 0.2; c.beginPath();
      for (let yy = 2; yy < h; yy += 1.1) { c.moveTo(x, yy); c.lineTo(x + w, yy); }
      c.stroke();
      rect(c, x - 0.6, h - 1.2, w + 1.2, 2.4, '#e9dcc3');                       // cornice
      rect(c, x - 0.6, h - 1.6, w + 1.2, 0.5, 'rgba(0,0,0,0.25)');
      for (let q = 0; q < w / 1.4 - 1; q++) rect(c, x + 0.4 + q * 1.4, h - 2.6, 0.7, 1, '#e9dcc3');
      if (k === 1) { poly(c, [[x + w / 2 - 4, h + 1.2], [x + w / 2, h + 4.6], [x + w / 2 + 4, h + 1.2]], '#e9dcc3'); circ(c, x + w / 2, h + 2.3, 0.9, col); }
      const n = Math.max(2, Math.round(w / 4.4));
      for (let f = 0; f < (h > 21 ? 2 : 1); f++) for (let q = 0; q < n; q++) tallWin(c, x + (w / n) * (q + 0.5) - 1, 10.4 + f * 7, 2, 4.4, true, f ? '#3a4a60' : '#ffe2a0');
      rect(c, x + 1, 1.2, w - 2, 5.8, '#bfe0f2');                               // shop glass
      rect(c, x + w / 2 - 1.3, 1.2, 2.6, 5.4, '#4a2f22');
      rect(c, x + 1, 5.4, w - 2, 0.3, 'rgba(255,255,255,0.6)');
      poly(c, [[x + 0.4, 9], [x + w - 0.4, 9], [x + w + 0.8, 6.6], [x - 0.8, 6.6]], awn);
      for (let q = 0; q < w; q += 2.2) poly(c, [[x + 0.4 + q, 9], [x + 1.5 + q, 9], [x + 1.6 + q + 0.2, 6.6], [x - 0.4 + q, 6.6]], 'rgba(255,255,255,0.28)');
    });
    // mural on the tall side wall
    rect(c, 29, 0.9, 2, 23, '#7c3a2b');
    rect(c, -16.6, 19, 0.6, 7, 'rgba(0,0,0,0.2)');
    const m = [3.5, 12.2, 5.2, 4.2];
    rect(c, 12 + m[0], m[1], m[2] + 5, m[3], '#3f8fd0');
    poly(c, [[15.5, 12.2], [18.5, 15.4], [20.2, 13.8], [22.4, 15.9], [25.7, 12.2]], '#f4f6f8');
    rect(c, 15.5, 12.2, 10.2, 0.9, '#e0b84e');
    rect(c, -8, 26.9, 0.5, 5, '#555'); rect(c, -11, 28.5, 6.5, 3.4, '#1f2a3a');  // rooftop sign (lit in cityAnim)
  },
  // 3: Union Pacific depot (1924) under the Garfield Street footbridge
  c => {
    const IRON = '#3d4249';
    rect(c, -31, 0, 62, 1, '#77706a');
    for (const s of [-1, 1]) {                           // stair towers
      const x = s * 27;
      c.strokeStyle = IRON; c.lineWidth = 0.5; c.beginPath();
      c.moveTo(x - 2.4, 1); c.lineTo(x - 2.4, 26); c.moveTo(x + 2.4, 1); c.lineTo(x + 2.4, 26);
      for (let k = 0; k < 5; k++) { const y = 1 + k * 5; c.moveTo(x - 2.4, y); c.lineTo(x + 2.4, y + 5); c.moveTo(x - 2.4, y + 5); c.lineTo(x + 2.4, y + 5); }
      c.stroke();
    }
    rect(c, -31, 24, 62, 1.3, IRON);                      // deck and truss
    rect(c, -31, 31.2, 62, 0.9, IRON);
    c.strokeStyle = IRON; c.lineWidth = 0.45; c.beginPath();
    for (let x = -30; x <= 30; x += 5) { c.moveTo(x, 25); c.lineTo(x, 31.5); if (x < 30) { c.moveTo(x, 25); c.lineTo(x + 5, 31.5); c.moveTo(x + 5, 25); c.lineTo(x, 31.5); } }
    c.stroke();
    rect(c, -31, 26.6, 62, 0.3, 'rgba(160,170,180,0.8)');
    c.fillStyle = hgrad(c, -21, 21, ['#b0573d', '#8c3f2c']); c.fillRect(-21, 1, 42, 9.5);     // depot
    rect(c, -6.5, 1, 13, 13, '#a44f37');
    poly(c, [[-24.5, 10.5], [24.5, 10.5], [20, 16], [-20, 16]], '#3f5d4d');
    poly(c, [[-24.5, 10.5], [24.5, 10.5], [24, 11.3], [-24, 11.3]], '#5d8170');
    poly(c, [[-8.2, 14], [0, 20.5], [8.2, 14]], '#3f5d4d');
    poly(c, [[-6.5, 14], [0, 19], [6.5, 14]], '#a44f37');
    circ(c, 0, 16, 1.3, '#f3ead6');
    for (const x of [-18.5, -14.5, -10.5, 8.5, 12.5, 16.5]) tallWin(c, x, 3.4, 2, 4.6, true, '#3b4c60');
    tallWin(c, -4.6, 3.4, 2.2, 6, true, '#ffe2a0'); tallWin(c, 2.4, 3.4, 2.2, 6, true, '#ffe2a0');
    rect(c, -1.4, 1, 2.8, 6, '#3f2a20');
    rect(c, -23, 0.6, 46, 0.8, '#c9c2b4');
    rect(c, 22.6, 1, 0.5, 15, '#444'); rect(c, 21.4, 14, 2.9, 4.4, '#22262b');             // signal mast
  },
  // 4: St. Matthew's Cathedral (1896, spire 1916): sandstone Gothic Revival
  c => {
    rect(c, -31, 0, 62, 1, '#5f8f4a');
    c.fillStyle = hgrad(c, -6, 27, [SAND[0], SAND[1]]); c.fillRect(-6, 1, 33, 17);
    coursing(c, -6, 1, 33, 17);
    poly(c, [[-7.5, 18], [27.5, 18], [24, 31], [-2, 31]], '#5f6772');
    poly(c, [[-7.5, 18], [27.5, 18], [27, 19], [-7, 19]], '#7f8792');
    for (let k = 0; k < 5; k++) {                         // lancet windows and buttresses
      const x = -1.5 + k * 5.6;
      c.fillStyle = '#2b3550'; c.beginPath(); c.moveTo(x, 4); c.lineTo(x, 11); c.quadraticCurveTo(x + 1.1, 14.5, x + 2.2, 11); c.lineTo(x + 2.2, 4); c.fill();
      rect(c, x + 0.9, 4, 0.3, 8.5, '#c8a24a');
      poly(c, [[x + 3.3, 1], [x + 4.5, 1], [x + 4.3, 13], [x + 3.5, 13]], SAND[2]);
    }
    c.fillStyle = hgrad(c, -21, -8, [SAND[0], SAND[1]]); c.fillRect(-21, 1, 13, 36);       // tower
    coursing(c, -21, 1, 13, 36);
    for (const x of [-21.6, -9.4]) { rect(c, x, 1, 1.6, 30, SAND[2]); poly(c, [[x - 0.2, 37], [x + 0.8, 42], [x + 1.8, 37]], SAND[1]); }
    rect(c, -21.6, 36.4, 14.2, 1.2, SAND[2]);
    for (const x of [-18.6, -13.4]) { c.fillStyle = '#2a2420'; c.beginPath(); c.moveTo(x, 25); c.lineTo(x, 31); c.quadraticCurveTo(x + 1.5, 35, x + 3, 31); c.lineTo(x + 3, 25); c.fill(); for (let k = 0; k < 4; k++) rect(c, x, 25.6 + k * 1.6, 3, 0.4, SAND[2]); }
    circ(c, -14.5, 19, 2.6, '#f3ead6'); circ(c, -14.5, 19, 2.1, '#2b3550');
    c.fillStyle = '#7a2a22'; c.beginPath(); c.moveTo(-16.6, 1); c.lineTo(-16.6, 7); c.quadraticCurveTo(-14.5, 11.5, -12.4, 7); c.lineTo(-12.4, 1); c.fill();
    poly(c, [[-20.4, 37.6], [-14.5, 67], [-8.6, 37.6]], '#5f6772');                         // spire
    poly(c, [[-14.5, 37.6], [-14.5, 67], [-8.6, 37.6]], '#4b525c');
    rect(c, -14.75, 67, 0.5, 5, '#d9c27a'); rect(c, -16, 69.6, 3, 0.5, '#d9c27a');
    cottonwood(c, 30, 15); spruce(c, -27, 13);
  },
  // 5: Ivinson Mansion (1892): Queen Anne with a round corner tower
  c => {
    rect(c, -31, 0, 62, 1.2, '#5f8f4a');
    const WALL = '#e9dcc0', WALL2 = '#cfbf9c', ROOF = '#6e3a30', ROOF2 = '#57291f';
    c.fillStyle = hgrad(c, -20, 15, [WALL, WALL2]); c.fillRect(-20, 1, 35, 19);
    poly(c, [[-22, 20], [17, 20], [11, 31], [-15, 31]], ROOF);
    poly(c, [[-22, 20], [17, 20], [16.4, 21], [-21.4, 21]], '#8a4e42');
    rect(c, -17, 1, 13, 24, WALL);                                                           // front gable bay
    poly(c, [[-19, 25], [-10.5, 36], [-2, 25]], ROOF2);
    poly(c, [[-16.5, 25], [-10.5, 33], [-4.5, 25]], '#d8c49a');
    for (let k = 0; k < 4; k++) rect(c, -15.5 + k * 0.6, 25.4 + k * 1.7, 10 - k * 1.2, 0.35, 'rgba(110,58,48,0.5)');
    tallWin(c, -14.6, 12.5, 2.4, 6, true); tallWin(c, -9, 12.5, 2.4, 6, true);
    tallWin(c, -11.7, 27, 2.2, 3.4, true);
    for (const x of [1, 6.5]) tallWin(c, x, 12.5, 2.2, 5.6);
    c.fillStyle = hgrad(c, 13, 25, [WALL, WALL2]); c.fillRect(13.5, 1, 11, 30);              // round tower
    for (let k = 0; k < 3; k++) rect(c, 13.5, 9 + k * 9.5, 11, 0.6, '#b9a57e');
    tallWin(c, 15, 12, 2, 5); tallWin(c, 20.4, 12, 2, 5); tallWin(c, 17.8, 22, 2.2, 5, true);
    poly(c, [[12.2, 31], [19, 50], [25.8, 31]], ROOF);
    poly(c, [[19, 31], [19, 50], [25.8, 31]], ROOF2);
    rect(c, 18.8, 50, 0.4, 4, '#3a3a3a'); circ(c, 19, 54.4, 0.7, '#d9c27a');
    rect(c, 4, 28, 2.6, 11, '#8a4e42'); rect(c, 3.6, 38.4, 3.4, 1, '#57291f');               // chimneys
    rect(c, -6, 30, 2.2, 8, '#8a4e42');
    rect(c, -22, 1, 37, 1.3, '#d9cdb8');                                                     // wrap-around porch
    poly(c, [[-23, 8.6], [16, 8.6], [15, 10.4], [-22, 10.4]], ROOF);
    for (let x = -21.5; x <= 14.5; x += 4.5) rect(c, x, 2.3, 0.7, 6.3, '#f7f1e3');
    rect(c, -22, 4.2, 37, 0.3, '#f7f1e3');
    rect(c, -12, 2.3, 3, 5.6, '#5a3526');
    c.strokeStyle = '#2b2b2b'; c.lineWidth = 0.3; c.beginPath();                              // iron fence
    c.moveTo(-31, 3.4); c.lineTo(-23.5, 3.4); c.moveTo(26, 3.4); c.lineTo(31, 3.4);
    for (const x of [-30.5, -29, -27.5, -26, -24.5, 26.5, 28, 29.5]) { c.moveTo(x, 1); c.lineTo(x, 4); }
    c.stroke();
    cottonwood(c, -27, 19, '#5f8f4a'); spruce(c, 29, 16);
  },
];
function shade(hex) { const n = parseInt(hex.slice(1), 16); return 'rgb(' + [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(v => Math.round(v * 0.78)).join(',') + ')'; }

export default {
  id: 'laramie',
  page: '#4d97dc', meta: '#1b5fb4',
  footer: ['rgba(250,238,214,0.94)', '#fff8e8', 'rgba(255,248,232,0.4)'],
  // white logo with a navy edge so it stays readable when a cloud drifts behind it
  brand: { fill: '#ffffff', glows: [{ color: 'rgba(8,40,100,0.5)', blur: 18, dy: 2 }, { color: 'rgba(6,30,84,0.85)', blur: 3 }, { color: 'rgba(6,30,84,0.85)', blur: 3 }] },
  cityFx: CITY_FX, baseFx: BASE_FX, baseH: 30, cityBox: [68, 78, 4],
  cityLabel: 'LANDMARKS', cityOne: 'LANDMARK',
  prompt: 'Defend Laramie. Each battery holds ten interceptors.',
  threat: [168, 14, 40], smart: [255, 106, 0], abm: [255, 255, 255], abmHead: '#12284a', abmAlpha: 0.95, abmWidth: 2.2, threatAlpha: 0.5, marker: ['#ffffff', '#12284a'],
  blast: ['rgba(255,255,255,0.98)', 'rgba(255,236,150,0.94)', 'rgba(255,150,60,0.66)', 'rgba(220,60,40,0)'],
  fx: { spark: '255,176,74', debris: '120,84,50', smoke: '96,88,82', haze: '170,170,176', city: '236,208,160', glow: '255,230,170' },
  ui: { text: '#ffffff', shadow: 'rgba(8,30,80,0.6)', muted: 'rgba(255,255,255,0.88)', panel: 'rgba(255,255,255,0.93)', line: 'rgba(18,40,74,0.15)', ptext: '#12284a', pmuted: 'rgba(18,40,74,0.68)', accent: '#1b5fb4', warn: '#a80e28', gold: '#9a5a08', cross: '#ffffff' },

  init() {
    this.cumulus = new Clouds({ n: 6, s0: 0.7, s1: 1.2, speed: 12, seed: 3, bottom: '#bccbe2', band: () => this.cloudBand() });
    this.farClouds = new Clouds({ n: 7, s0: 0.3, s1: 0.5, speed: 3.5, seed: 12, alpha: 0.92, bottom: '#cdd9ea', h: 90, band: () => [this.hz - this.peak * 1.75, this.hz - this.peak * 1.15] });
    this.jet = new Jet({ y0: 0.04, y1: 0.16 });
    this.train = { x: -1, wait: 6, dir: 1, cars: [] };
    this.herd = { x: 0.3, run: 0, wait: 8, dir: -1 };
    this.tumble = { x: -1, wait: 12, rot: 0 };
    this.trucks = [{ p: 0.2, v: 0.035 }, { p: 0.75, v: -0.03 }];
  },

  // Cumulus keep to the sky between the logo and the mountains.
  cloudBand() {
    const top = game.brand.bottom + 80 * u, bot = this.hz - this.peak * 1.25 - 40 * u;
    return bot > top ? [top, bot] : [(top + bot) / 2, (top + bot) / 2 + 1];
  },

  layout() {
    this.hz = G - clamp(G * 0.2, 62, 170);                // edge of the plains
    this.peak = clamp(Math.min(G * 0.15, W * 0.13), 38, 150);
    this.Y = d => this.hz + d * (G - this.hz);            // depth 0 (horizon) to 1 (town)
    this.trackY = this.Y(0.64);
    // Wind turbines far to the north (right)
    this.turbines = [0.875, 0.905, 0.935, 0.962, 0.988].map((f, k) => ({ x: W * f, y: this.hz - (3 + (k % 2) * 2) * u, ph: f * 40, s: 0.55 + (k % 3) * 0.08 }));
    this.lens = null;
  },

  build() {
    this.cumulus.build(); this.farClouds.build();
    this.lens = [lensCloudSprite(5, 230 * u, 70 * u, '#ffffff', '#c3d0e4'), lensCloudSprite(8, 150 * u, 54 * u, '#ffffff', '#c9d5e8')];
  },

  // Mountain profiles (heights in pixels above the plain), shared by the art and the snow plume.
  hSnowy(x) {
    const P = this.peak, t = (x - W * 0.29) / (W * 0.31);
    if (t <= 0 || t >= 1) return 0;
    const env = Math.pow(Math.sin(Math.PI * t), 0.42);               // a long white wall, not an alpine spike
    const mbp = Math.exp(-Math.pow((t - 0.37) / 0.2, 2));            // Medicine Bow Peak
    const browns = 0.82 * Math.exp(-Math.pow((t - 0.68) / 0.15, 2)); // Browns Peak
    const sugar = 0.62 * Math.exp(-Math.pow((t - 0.52) / 0.04, 2));  // Sugarloaf
    return P * env * (0.6 + 0.4 * Math.max(mbp, browns, sugar) + 0.08 * (fbm((x * 0.045) / u, 4) - 0.5));
  },
  hForest(x) {
    const P = this.peak, t = clamp((x - W * 0.17) / (W * 0.6), 0, 1);
    return P * 0.5 * Math.pow(Math.sin(Math.PI * t), 0.5) * (0.82 + 0.3 * fbm((x * 0.012) / u, 7));
  },
  hSheep(x) {
    const P = this.peak, t = clamp((x - W * 0.075) / (W * 0.3), 0, 1);
    return P * 0.4 * Math.pow(Math.sin(Math.PI * Math.pow(t, 0.85)), 0.62) * (0.92 + 0.12 * fbm((x * 0.016) / u, 11));
  },
  hJelm(x) {
    const P = this.peak, t = clamp((x + W * 0.03) / (W * 0.17), 0, 1);
    return P * 0.5 * Math.pow(Math.sin(Math.PI * t), 1.3) * (0.92 + 0.14 * fbm((x * 0.03) / u, 2));
  },
  hElk(x) {
    const P = this.peak, t = clamp((x - W * 0.72) / (W * 0.15), 0, 1);
    return P * 0.5 * Math.pow(Math.sin(Math.PI * t), 0.75) * (0.9 + 0.16 * fbm((x * 0.03) / u, 5));
  },

  backdrop(o) {
    const { hz, peak: P } = this, Y = this.Y;
    // High-altitude sky: deep blue overhead, pale at the horizon.
    o.fillStyle = vgrad(o, 0, hz, [[0, '#0f4fa8'], [0.3, '#2573cc'], [0.62, '#5fa5e4'], [0.88, '#b4d7f1'], [1, '#e3eef4']]);
    o.fillRect(0, 0, W, hz + 2);
    o.fillStyle = rgrad(o, W * 0.08, -G * 0.1, 0, G * 0.9, ['rgba(255,255,240,0.38)', 'rgba(255,255,240,0)']);
    o.fillRect(0, 0, W, hz);

    // Low hills north of the range, then Elk Mountain standing alone.
    ridge(o, W * 0.5, W, hz, x => P * 0.14 * (0.5 + fbm((x * 0.008) / u, 21)), '#a9bdd4');
    ridge(o, W * 0.72, W * 0.87, hz, x => this.hElk(x), vgrad(o, hz - P * 0.5, hz, ['#8fa8c8', '#b3c5db']));
    snow(o, W * 0.72, W * 0.87, hz, x => this.hElk(x), x => P * (0.3 + 0.06 * noise1((x * 0.09) / u, 3)), 'rgba(250,252,255,0.92)');

    // Medicine Bow Mountains (timbered) carrying the Snowy Range crest.
    const sx0 = W * 0.29, sx1 = W * 0.6;
    ridge(o, sx0, sx1, hz, x => this.hSnowy(x), vgrad(o, hz - P, hz - P * 0.4, ['#9aa9c4', '#b6c2d6']));
    snow(o, sx0, sx1, hz, x => this.hSnowy(x), x => P * (0.5 + 0.1 * noise1((x * 0.07) / u, 6) - 0.16 * Math.max(0, noise1((x * 0.35) / u, 9) - 0.55)), vgrad(o, hz - P, hz - P * 0.45, ['#ffffff', '#eef3fa']));
    // shadowed cliff bands on the quartzite face
    o.save();
    ridge(o, sx0, sx1, hz, x => this.hSnowy(x), null); o.clip();
    const r1 = srand(14);
    for (let x = sx0; x < sx1; x += (3 + r1() * 7) * u) {
      const top = hz - this.hSnowy(x);
      o.fillStyle = 'rgba(92,110,150,' + (0.2 + r1() * 0.3) + ')';
      o.beginPath(); o.moveTo(x, top + (2 + r1() * 5) * u); o.lineTo(x + (2 + r1() * 4) * u, top + (5 + r1() * 6) * u); o.lineTo(x + (1 + r1() * 3) * u, top + P * (0.18 + r1() * 0.26)); o.lineTo(x - 1.5 * u, top + P * (0.14 + r1() * 0.2)); o.fill();
    }
    o.restore();
    ridge(o, W * 0.17, W * 0.77, hz, x => this.hForest(x), vgrad(o, hz - P * 0.55, hz, ['#3d5f78', '#54768a', '#8aa3b0']));
    o.save();
    ridge(o, W * 0.17, W * 0.77, hz, x => this.hForest(x), null); o.clip();
    const r2 = srand(23);
    for (let i = 0; i < W / 3; i++) {                     // timber texture and parks
      const x = W * (0.17 + r2() * 0.6), y = hz - this.hForest(x) * r2();
      o.fillStyle = r2() < 0.75 ? 'rgba(30,60,70,0.22)' : 'rgba(150,175,150,0.25)';
      o.fillRect(x, y, (3 + r2() * 9) * u, (1 + r2() * 2) * u);
    }
    o.restore();

    // Jelm Mountain with the infrared observatory on top.
    ridge(o, 0, W * 0.15, hz, x => this.hJelm(x), vgrad(o, hz - P * 0.5, hz, ['#557089', '#7f98a6']));
    const jx = W * 0.055;
    circ(o, jx, hz - this.hJelm(jx) - 1.2 * u, 1.8 * u, '#f6f8fa');
    o.fillStyle = '#dfe6ec'; o.fillRect(jx - 1.8 * u, hz - this.hJelm(jx) - 1.2 * u, 3.6 * u, 1.6 * u);

    // Sheep Mountain: long hogback, timber on top, sage and grass below.
    ridge(o, W * 0.07, W * 0.38, hz, x => this.hSheep(x), vgrad(o, hz - P * 0.38, hz, ['#3f5f5e', '#5d7a68', '#a3a682']));
    o.save();
    ridge(o, W * 0.07, W * 0.38, hz, x => this.hSheep(x), null); o.clip();
    const r3 = srand(31);
    for (let i = 0; i < W / 4; i++) {
      const x = W * (0.07 + r3() * 0.31), hh = this.hSheep(x), y = hz - hh * (0.45 + r3() * 0.55);
      o.fillStyle = 'rgba(26,52,48,' + (0.18 + r3() * 0.2) + ')';
      o.fillRect(x, y, (4 + r3() * 12) * u, (1 + r3() * 2.2) * u);
    }
    for (let i = 0; i < 26; i++) {                         // drainages
      const x = W * (0.09 + r3() * 0.27), hh = this.hSheep(x);
      o.strokeStyle = 'rgba(40,60,50,0.2)'; o.lineWidth = 1;
      o.beginPath(); o.moveTo(x, hz - hh * 0.9); o.lineTo(x + (r3() - 0.3) * 14 * u, hz); o.stroke();
    }
    o.restore();
    // haze where the mountains meet the plain
    o.fillStyle = vgrad(o, hz - P * 0.45, hz, ['rgba(222,234,244,0)', 'rgba(226,236,244,0.62)']);
    o.fillRect(0, hz - P * 0.45, W, P * 0.45 + 1);

    // turbine towers
    for (const t of this.turbines) { o.strokeStyle = 'rgba(255,255,255,0.95)'; o.lineWidth = Math.max(1, 1.5 * u * t.s); o.beginPath(); o.moveTo(t.x, t.y + 4 * u); o.lineTo(t.x, t.y - 30 * u * t.s); o.stroke(); }

    // The Laramie Plains: shortgrass and sage, paler with distance.
    o.fillStyle = vgrad(o, hz, G, [[0, '#d6cfa4'], [0.15, '#d3c287'], [0.5, '#c8ad68'], [1, '#b99650']]);
    o.fillRect(0, hz, W, G - hz + 2);
    const rp = srand(7);
    for (let i = 0; i < (W * (G - hz)) / 200; i++) {
      const d = Math.pow(rp(), 0.8), y = Y(d), x = rp() * W;
      const t = rp();
      o.fillStyle = t < 0.4 ? 'rgba(140,105,50,0.2)' : t < 0.75 ? 'rgba(252,240,196,0.3)' : 'rgba(118,132,92,0.42)';
      if (t < 0.75) o.fillRect(x, y, (4 + 22 * d) * u, Math.max(1, d * 1.6 * u));
      else { o.beginPath(); o.ellipse(x, y, (1.2 + 3.4 * d) * u, (0.6 + 1.5 * d) * u, 0, 0, TAU); o.fill(); }   // sagebrush
    }
    // lake, then the Laramie River with hay meadows and cottonwoods
    o.fillStyle = '#7fb4e0'; o.beginPath(); o.ellipse(W * 0.16, Y(0.1), 46 * u, 1.8 * u, 0, 0, TAU); o.fill();
    o.fillStyle = 'rgba(255,255,255,0.6)'; o.fillRect(W * 0.16 - 30 * u, Y(0.1) - 0.5, 34 * u, 1);
    const ry = x => Y(0.27 + 0.045 * Math.sin((x * 0.0042) / u + 0.6) + 0.02 * Math.sin((x * 0.013) / u));
    o.beginPath(); o.moveTo(0, ry(0) - 5 * u);
    for (let x = 0; x <= W; x += 8) o.lineTo(x, ry(x) - (4 + 3 * Math.sin(x * 0.02)) * u);
    for (let x = W; x >= 0; x -= 8) o.lineTo(x, ry(x) + (5 + 3 * Math.sin(x * 0.017 + 2)) * u);
    o.fillStyle = 'rgba(126,160,84,0.6)'; o.fill();
    o.strokeStyle = '#6fa8dc'; o.lineWidth = Math.max(1.2, 1.8 * u);
    o.beginPath(); for (let x = 0; x <= W; x += 6) o.lineTo(x, ry(x)); o.stroke();
    const rc = srand(41);
    for (let x = 0; x < W; x += (3 + rc() * 9) * u) {
      if (noise1((x * 0.012) / u, 17) < 0.42) { x += rc() * 30 * u; continue; }   // groves with gaps between
      const y = ry(x) - (1 + rc() * 2) * u, s = (1.8 + rc() * 3.4) * u;
      circ(o, x, y - s * 0.7, s, rc() < 0.7 ? '#5f8c48' : '#7aa255');
      circ(o, x - s * 0.3, y - s * 0.9, s * 0.45, 'rgba(255,255,210,0.18)');
    }
    // Snowy Range Road heading west across the flats
    o.fillStyle = 'rgba(112,106,98,0.6)';
    o.beginPath(); o.moveTo(W * 0.452, hz + 1); o.lineTo(W * 0.453, hz + 1); o.lineTo(W * 0.536 + 5 * u, Y(0.62)); o.lineTo(W * 0.536, Y(0.62)); o.fill();
    this.road = [[W * 0.4525, hz + 1], [W * 0.536 + 2.5 * u, Y(0.62)]];
    // snow fences
    o.strokeStyle = 'rgba(110,84,56,0.75)';
    for (const [fx, d] of [[0.63, 0.34], [0.69, 0.4], [0.76, 0.33], [0.26, 0.44], [0.33, 0.5]]) {
      const x0 = W * fx, y = Y(d), s = (0.6 + d) * u;
      o.lineWidth = Math.max(1, s);
      for (let k = 0; k < 9; k++) { o.beginPath(); o.moveTo(x0 + k * 4 * s, y); o.lineTo(x0 + k * 4 * s + 1.5 * s, y - 5 * s); o.stroke(); }
      o.lineWidth = Math.max(0.6, 0.6 * s);
      o.beginPath(); o.moveTo(x0, y - 2 * s); o.lineTo(x0 + 34 * s, y - 2 * s); o.moveTo(x0 + 1, y - 4 * s); o.lineTo(x0 + 35 * s, y - 4 * s); o.stroke();
    }
    // Union Pacific main line
    const ty = this.trackY;
    o.fillStyle = 'rgba(120,108,96,0.75)'; o.fillRect(0, ty - 0.5 * u, W, 3.2 * u);
    o.fillStyle = 'rgba(70,52,38,0.7)';
    for (let x = 0; x < W; x += 5 * u) o.fillRect(x, ty - 0.2 * u, 2.2 * u, 2.6 * u);
    o.strokeStyle = 'rgba(52,48,46,0.95)'; o.lineWidth = Math.max(1, 0.8 * u);
    o.beginPath(); o.moveTo(0, ty + 0.2 * u); o.lineTo(W, ty + 0.2 * u); o.moveTo(0, ty + 2 * u); o.lineTo(W, ty + 2 * u); o.stroke();
    // barbed-wire fence
    const fy = Y(0.84);
    o.strokeStyle = 'rgba(86,62,40,0.55)'; o.lineWidth = 1;
    o.beginPath(); o.moveTo(0, fy - 5 * u); o.lineTo(W, fy - 5 * u); o.moveTo(0, fy - 3 * u); o.lineTo(W, fy - 3 * u); o.stroke();
    o.fillStyle = 'rgba(86,62,40,0.75)';
    for (let x = 0; x < W; x += 24 * u) o.fillRect(x, fy - 7.5 * u, 1.4 * u, 7.5 * u);
    // the town's trees and rooftops along the near edge
    const rt = srand(57);
    for (let x = -4 * u; x < W; x += (7 + rt() * 9) * u) {
      if (BASE_FX.some(f => Math.abs(x - f * W) < 58 * u)) continue;
      const t = rt();
      if (t < 0.34) { const w = (9 + rt() * 8) * u, h = (5 + rt() * 4) * u; o.fillStyle = ['#d8cdb8', '#b8a58a', '#c9b79a', '#9fb2c2'][(rt() * 4) | 0]; o.fillRect(x, G - h, w, h); o.fillStyle = ['#6d5a4c', '#7a3f33', '#5c6670'][(rt() * 3) | 0]; o.beginPath(); o.moveTo(x - u, G - h); o.lineTo(x + w / 2, G - h - 3.4 * u); o.lineTo(x + w + u, G - h); o.fill(); }
      else if (t < 0.62) { const h = (12 + rt() * 12) * u; o.fillStyle = rt() < 0.5 ? '#2f5b48' : '#3a6a55'; o.beginPath(); o.moveTo(x - h * 0.24, G); o.lineTo(x, G - h); o.lineTo(x + h * 0.24, G); o.fill(); }
      else { const s = (5 + rt() * 5) * u; o.fillStyle = '#5a4632'; o.fillRect(x - 0.6 * u, G - s * 1.2, 1.2 * u, s * 1.2); circ(o, x, G - s * 1.6, s, rt() < 0.6 ? '#6c9a52' : '#86ad5e'); circ(o, x - s * 0.3, G - s * 1.9, s * 0.4, 'rgba(255,255,210,0.2)'); }
    }
  },

  tick(dt) {
    this.cumulus.tick(dt); this.farClouds.tick(dt); this.jet.tick(dt);
    const tr = this.train;
    if (tr.x < 0) {
      tr.wait -= dt;
      if (tr.wait <= 0) {
        tr.x = 0.001; tr.dir = Math.random() < 0.5 ? 1 : -1;
        const kinds = ['stack', 'stack', 'tank', 'hopper', 'box'];
        const run = kinds[(Math.random() * kinds.length) | 0];
        tr.cars = Array.from({ length: 16 + ((Math.random() * 12) | 0) }, () => ({ k: Math.random() < 0.7 ? run : kinds[(Math.random() * kinds.length) | 0], a: (Math.random() * 6) | 0, b: (Math.random() * 6) | 0 }));
      }
    } else {
      tr.x += (W / 20) * dt;
      if (tr.x > W + (tr.cars.length * 21 + 80) * u) { tr.x = -1; tr.wait = rand(10, 24); }
    }
    const hd = this.herd;
    if (hd.run > 0) { hd.run -= dt; hd.x += hd.dir * 0.07 * dt; if (hd.x < 0.04 || hd.x > 0.96) hd.dir *= -1; }
    else { hd.wait -= dt; if (hd.wait <= 0) { hd.run = rand(2.5, 5); hd.wait = rand(9, 20); if (Math.random() < 0.4) hd.dir *= -1; } }
    for (const b of game.blasts) if (b.t < 0.05 && b.kind === 'ground' && hd.run <= 0) { hd.run = 3.5; hd.dir = b.x > hd.x * W ? -1 : 1; }
    const tb = this.tumble;
    if (tb.x < 0) { tb.wait -= dt; if (tb.wait <= 0 && game.wind > 1.2) tb.x = 0.001; }
    else { tb.x += (W / 8) * game.wind * dt; tb.rot += dt * 7 * game.wind; if (tb.x > W + 40) { tb.x = -1; tb.wait = rand(8, 20); } }
    for (const t of this.trucks) { t.p += t.v * dt; if (t.p > 1.05) t.p = -0.05; if (t.p < -0.05) t.p = 1.05; }
  },

  ambient(c) {
    const { hz, peak: P } = this, Y = this.Y;
    this.jet.draw(c);
    this.farClouds.draw(c);
    // Lenticular clouds hold station downwind of the Snowy Range.
    if (this.lens) {
      const l0 = this.lens[0], l1 = this.lens[1], bob = Math.sin(time * 0.2) * 2 * u;
      c.globalAlpha = 0.95;
      c.drawImage(l0.c, W * 0.5 - l0.w / 2 + bob, hz - P * 1.62 - l0.h / 2, l0.w, l0.h);
      c.drawImage(l1.c, W * 0.66 - l1.w / 2 - bob, hz - P * 1.34 - l1.h / 2, l1.w, l1.h);
      c.globalAlpha = 1;
    }
    // Snow blowing off Medicine Bow Peak
    if (!game.lowFx) {
      const px = W * 0.29 + W * 0.31 * 0.36, py = hz - this.hSnowy(px);
      for (let k = 0; k < 7; k++) {
        const ph = (time * 0.22 * (0.6 + 0.5 * game.wind) + k / 7) % 1;
        soft(c, px + ph * 54 * u, py - ph * 5 * u + Math.sin(ph * 9 + k) * 1.5 * u, (4 + ph * 11) * u, '255,255,255', 0.34 * (1 - ph));
      }
    }
    this.cumulus.draw(c);
    this.cumulus.shadows(c, Y(0.06), Y(0.62), 0.13, '40,36,20');

    // hawk riding a thermal
    const ha = time * 0.42, hx = W * 0.2 + Math.cos(ha) * 70 * u, hy = G * 0.43 + Math.sin(ha) * 16 * u, bank = Math.sin(ha) * 0.5, hs = (5.5 + Math.sin(ha) * 1.3) * u;
    c.save(); c.translate(hx, hy); c.rotate(bank * 0.5);
    c.fillStyle = '#3a2a1e';
    c.beginPath(); c.moveTo(-hs * 2, -hs * 0.3); c.quadraticCurveTo(-hs, -hs * 0.2, 0, hs * 0.25); c.quadraticCurveTo(hs, -hs * 0.2, hs * 2, -hs * 0.3); c.quadraticCurveTo(hs, hs * 0.25, 0, hs * 0.55); c.quadraticCurveTo(-hs, hs * 0.25, -hs * 2, -hs * 0.3); c.fill();
    poly(c, [[-hs * 0.3, hs * 0.4], [0, hs * 1.1], [hs * 0.3, hs * 0.4]], '#8a4a2a');
    c.restore();

    // turbine blades
    for (const t of this.turbines) {
      const hx2 = t.x, hy2 = t.y - 30 * u * t.s, a0 = time * (0.9 + 0.7 * game.wind) + t.ph, L = 15 * u * t.s;
      c.strokeStyle = '#ffffff'; c.lineWidth = Math.max(1, 1.4 * u * t.s); c.lineCap = 'round';
      for (let k = 0; k < 3; k++) { const a = a0 + (k * TAU) / 3; c.beginPath(); c.moveTo(hx2, hy2); c.lineTo(hx2 + Math.cos(a) * L, hy2 + Math.sin(a) * L); c.stroke(); }
      circ(c, hx2, hy2, 1.4 * u * t.s, '#e9eef3');
    }
    // pickups on Snowy Range Road
    if (this.road) for (const t of this.trucks) {
      if (t.p < 0 || t.p > 1) continue;
      const q = t.p * t.p, x = this.road[0][0] + (this.road[1][0] - this.road[0][0]) * q, y = this.road[0][1] + (this.road[1][1] - this.road[0][1]) * q, s = (0.25 + q * 1.3) * u;
      rect(c, x - 2 * s, y - 2.6 * s, 4 * s, 2.6 * s, t.v > 0 ? '#b0122e' : '#f4f4f0');
      rect(c, x - 1.4 * s, y - 3.6 * s, 2.8 * s, 1.2 * s, '#2b3440');
    }

    // Union Pacific freight
    const tr = this.train;
    if (tr.x > 0) {
      const s = 0.8 * u, y = this.trackY + 1.6 * u, dir = tr.dir;
      const X = d => (dir > 0 ? tr.x - d : W - tr.x + d);
      const CONT = ['#c8102e', '#1f5fa8', '#2e8b57', '#e08a1e', '#6b7a8a', '#7a3f8a'];
      tr.cars.forEach((car, k) => {
        const cx = X((58 + k * 21) * s + 10 * s);
        if (cx < -30 * s || cx > W + 30 * s) return;
        const x0 = cx - 9.5 * s;
        if (car.k === 'stack') { rect(c, x0, y - 3.4 * s, 19 * s, 1.4 * s, '#3a3a3a'); rect(c, x0 + 1 * s, y - 8 * s, 17 * s, 4.6 * s, CONT[car.a]); rect(c, x0 + 1 * s, y - 12.6 * s, 17 * s, 4.6 * s, CONT[car.b]); rect(c, x0 + 1 * s, y - 8.2 * s, 17 * s, 0.4 * s, 'rgba(0,0,0,0.3)'); }
        else if (car.k === 'tank') { c.fillStyle = '#1f1f22'; c.beginPath(); c.ellipse(cx, y - 6.4 * s, 9.2 * s, 3.6 * s, 0, 0, TAU); c.fill(); rect(c, cx - 1 * s, y - 11 * s, 2 * s, 1.6 * s, '#1f1f22'); rect(c, x0, y - 3.2 * s, 19 * s, 1 * s, '#3a3a3a'); rect(c, cx - 7 * s, y - 7.4 * s, 14 * s, 0.5 * s, 'rgba(255,255,255,0.18)'); }
        else if (car.k === 'hopper') { poly(c, [[x0, y - 11 * s], [x0 + 19 * s, y - 11 * s], [x0 + 16 * s, y - 2.6 * s], [x0 + 3 * s, y - 2.6 * s]], car.a % 2 ? '#6e7276' : '#7d5a3c'); for (let r = 1; r < 6; r++) rect(c, x0 + r * 3.1 * s, y - 11 * s, 0.4 * s, 8 * s, 'rgba(0,0,0,0.22)'); }
        else { rect(c, x0, y - 11.4 * s, 19 * s, 8.8 * s, car.a % 2 ? '#7a3b28' : '#8a6a2e'); rect(c, cx - 2.6 * s, y - 10.4 * s, 5.2 * s, 7 * s, 'rgba(0,0,0,0.18)'); }
        circ(c, x0 + 3 * s, y - 1.4 * s, 1.5 * s, '#1c1c1c'); circ(c, x0 + 16 * s, y - 1.4 * s, 1.5 * s, '#1c1c1c');
      });
      for (let k = 0; k < 2; k++) {                       // locomotives: yellow, gray roof, red stripe
        const cx = X((6 + k * 27) * s + 13 * s);
        c.save(); c.translate(cx, y); c.scale(dir * s, s);
        rect(c, -13, -10.5, 26, 8, '#f4c20d');
        rect(c, -13, -12.4, 20, 2.2, '#8f979e');
        poly(c, [[7, -14.6], [13, -14.6], [13, -10.5], [5.5, -10.5]], '#f4c20d');
        rect(c, 8, -13.8, 4, 2.2, '#27333f');
        rect(c, -13, -5, 26, 1, '#c8102e');
        rect(c, -13.5, -2.6, 27, 1.2, '#55595d');
        for (let q = 0; q < 6; q++) rect(c, -11 + q * 3, -9.4, 1.8, 3, 'rgba(0,0,0,0.2)');
        for (const wx of [-10, -6.5, 6.5, 10]) circ(c, wx, -1.2, 1.5, '#1c1c1c');
        c.restore();
        if (k === 0 && !game.lowFx) for (let q = 0; q < 4; q++) soft(c, cx - dir * (4 + q * 9) * s, y - (17 + q * 3.5) * s, (4 + q * 2.4) * s, '70,70,74', 0.3 - q * 0.06);
      }
    }

    // pronghorn on the near flats
    const hd = this.herd, running = hd.run > 0, base = Y(0.93);
    [[0, 0], [18, -4], [37, 2], [54, -3], [73, 1]].forEach(([ox, oy], k) => {
      const s = 0.9 * u, x = hd.x * W + ox * u, hop = running ? Math.abs(Math.sin(time * 9 + k)) * 4 * u : 0, y = base + oy * 0.6 * u - hop, dir = running ? hd.dir : k % 2 ? 1 : -1;
      const graze = !running && (k + Math.floor(time * 0.15)) % 3 !== 0;
      c.save(); c.translate(x, y); c.scale(-dir * s, s);          // drawn facing left
      const leg = running ? Math.sin(time * 18 + k) * 3 : 0;
      c.strokeStyle = '#8a5a26'; c.lineWidth = 1;
      c.beginPath(); c.moveTo(-5, 3); c.lineTo(-6 - leg, 9); c.moveTo(-3, 3); c.lineTo(-3 + leg, 9); c.moveTo(4, 3); c.lineTo(4 - leg, 9); c.moveTo(6, 3); c.lineTo(7 + leg, 9); c.stroke();
      ell(c, 0, 0, 8, 3.7, '#c7853a');
      ell(c, 0.5, 1.8, 6, 1.9, '#fbf3e4');
      ell(c, 7.2, -0.2, 2.2, 2.8, '#fbf3e4');
      const hx3 = graze ? -10.5 : -11, hy3 = graze ? 5.5 : -6.5;
      c.strokeStyle = '#c7853a'; c.lineWidth = 2.2; c.beginPath(); c.moveTo(-6, -1); c.lineTo(hx3 + 1, hy3 + 0.6); c.stroke();
      c.strokeStyle = '#fbf3e4'; c.lineWidth = 0.8; c.beginPath(); c.moveTo(-7.2, 0.8); c.lineTo(hx3 + 1.6, hy3 + 1.6); c.stroke();
      ell(c, hx3, hy3, 2.4, 1.6, '#c7853a', graze ? 0.6 : -0.3);
      if (!graze) { c.strokeStyle = '#1a1a1a'; c.lineWidth = 0.9; c.beginPath(); c.moveTo(hx3 + 0.6, hy3 - 1.2); c.lineTo(hx3 + 0.9, hy3 - 4.4); c.lineTo(hx3 - 0.3, hy3 - 3.4); c.stroke(); }
      c.restore();
    });

    const tb = this.tumble;
    if (tb.x > 0) {
      const y = G - 6 * u - Math.abs(Math.sin(tb.x * 0.02)) * 12 * u;
      c.strokeStyle = 'rgba(132,100,58,0.85)'; c.lineWidth = 1;
      for (let k = 0; k < 7; k++) { c.beginPath(); c.arc(tb.x, y, 5.5 * u, tb.rot + k * 0.9, tb.rot + k * 0.9 + 2.2); c.stroke(); }
    }
  },

  foreground(o) {
    const bt = G - this.baseH * u;
    o.fillStyle = vgrad(o, G, H, ['#8a6a3c', '#5e4425', '#3b2a17']);
    o.fillRect(0, G, W, H - G + 2);
    const rs = srand(64);
    for (let i = 0; i < W / 5; i++) { o.fillStyle = rs() < 0.5 ? 'rgba(0,0,0,0.12)' : 'rgba(255,230,180,0.08)'; o.fillRect(rs() * W, G + rs() * (H - G), (3 + rs() * 12) * u, 1.2 * u); }
    // Batteries sit on knobs of pink Sherman granite, the stone of Vedauwoo.
    for (const f of BASE_FX) {
      const x0 = f * W, rb = srand(Math.round(f * 100));
      const rocks = [[-34, 0, 20, 15], [-12, 0, 24, 19], [14, 0, 22, 16], [36, 0, 15, 11], [-22, 13, 21, 14], [4, 15, 24, 15], [26, 11, 16, 12]];
      for (const [dx, dy, w, h] of rocks) {
        const x = x0 + (dx + (rb() - 0.5) * 3) * u, yb = G - dy * u, rw = (w / 2) * u, rh = h * u;
        o.beginPath();
        o.moveTo(x - rw, yb + 3 * u);
        o.bezierCurveTo(x - rw * 1.1, yb - rh * 0.7, x - rw * 0.6, yb - rh, x - rw * 0.1, yb - rh);
        o.bezierCurveTo(x + rw * 0.7, yb - rh * 1.04, x + rw * 1.12, yb - rh * 0.6, x + rw, yb + 3 * u);
        o.closePath();
        o.fillStyle = lgrad(o, x - rw, yb - rh, x + rw, yb, ['#edc7a6', '#cf9f7e', '#a87558']);
        o.fill();
        o.strokeStyle = 'rgba(96,58,40,0.45)'; o.lineWidth = 1; o.stroke();
        o.strokeStyle = 'rgba(96,58,40,0.3)';
        o.beginPath(); o.moveTo(x - rw * 0.5, yb - rh * 0.55); o.lineTo(x + rw * 0.6, yb - rh * 0.45); o.moveTo(x - rw * 0.1, yb - rh * 0.95); o.lineTo(x + rw * 0.05, yb - rh * 0.2); o.stroke();
      }
      o.fillStyle = '#cf9f7e'; o.fillRect(x0 - 14 * u, bt, 28 * u, 6 * u);
      o.fillStyle = 'rgba(255,240,220,0.45)'; o.fillRect(x0 - 14 * u, bt, 28 * u, 1.2 * u);
      for (const [dx, h] of [[-40, 13], [43, 11]]) {       // limber pines in the cracks
        const x = x0 + dx * u, hh = h * u;
        o.fillStyle = '#4a3a2a'; o.fillRect(x - 0.6 * u, G - hh * 0.3, 1.2 * u, hh * 0.3);
        o.fillStyle = '#2f5b48'; o.beginPath(); o.moveTo(x - hh * 0.3, G - hh * 0.2); o.lineTo(x, G - hh); o.lineTo(x + hh * 0.3, G - hh * 0.2); o.fill();
      }
    }
  },

  // Prairie grass along the near edge, leaning with the wind.
  groundAnim(c) {
    const rnd = srand(88), lean = (game.wind - 0.4) * 2.2 * u;
    c.lineWidth = Math.max(1, 1.1 * u);
    for (let x = 0; x < W; x += 3.2 * u) {
      const h = (3 + rnd() * 6) * u, t = rnd();
      if (BASE_FX.some(f => Math.abs(x - f * W) < 50 * u)) continue;
      const sway = lean * (0.6 + 0.4 * Math.sin(time * 3.2 + x * 0.05));
      c.strokeStyle = t < 0.5 ? '#c9a95e' : t < 0.8 ? '#a8873f' : '#8f9a56';
      c.beginPath(); c.moveTo(x, G + 2); c.quadraticCurveTo(x + sway * 0.3, G - h * 0.6, x + sway, G - h); c.stroke();
    }
  },

  cityArt(c, i) { ART[i](c); },
  ruinArt(c, i) { ruinFrom(c, ART[i], { seed: i + 3, cut: i === 4 ? 16 : 12, a: '#6a5a48', b: '#a08a66', tint: 'rgba(40,30,24,0.45)' }); },

  cityAnim(c, i, city) {
    if (!city.alive) return;
    if (i === 0) {                                         // flag over Old Main
      const w = 8, h = 4.6, y0 = 49.2;
      for (let k = 0; k < 8; k++) {
        const x = 0.25 + (k / 8) * w, wob = Math.sin(time * 6 * (0.6 + 0.4 * game.wind) - k * 0.9) * 0.5 * (k / 8);
        for (let r = 0; r < 7; r++) rect(c, x, y0 + wob + (r * h) / 7, w / 8 + 0.05, h / 7 + 0.02, r % 2 ? '#ffffff' : '#b22234');
        if (k < 3) rect(c, x, y0 + wob + h * 0.46, w / 8 + 0.05, h * 0.54, '#3c3b6e');
      }
    } else if (i === 1) {
      for (const [x, h] of [[4, 37], [17, 40], [30, 42]]) soft(c, x, h + 1.7, 7, '255,247,214', 0.35);
    } else if (i === 2) {
      const on = Math.sin(time * 1.3) > -0.85;
      rect(c, -10.4, 29.1, 5.3, 2.2, on ? '#ff5a4a' : '#5a2a26');
      if (on) soft(c, -7.8, 30.2, 6, '255,90,74', 0.5);
    } else if (i === 3) {
      beacon(c, 22.85, 17, 0.7, '255,60,50', Math.floor(time * 2) % 2 === 0);
      beacon(c, 22.85, 15.2, 0.7, '70,255,120', Math.floor(time * 2) % 2 === 1);
    }
  },

  base(c, b) {
    if (b.alive) {
      let ang = Math.PI / 2;
      const p = game.pointer;
      if (p.inside && game.mode === 'playing') ang = clamp(Math.atan2(G - this.baseH * u - p.y, p.x - b.fx * W), 0.3, Math.PI - 0.3);
      const hot = clamp(1 - (time - b.fireT) * 5, 0, 1);
      c.save(); c.translate(0, 5); c.rotate(ang);
      rect(c, 0, -1.3, 13 - hot * 3, 2.6, '#3d3a36'); rect(c, 11 - hot * 3, -1.7, 2.4, 3.4, '#22201e');
      c.restore();
      if (hot > 0) soft(c, Math.cos(ang) * 14, 5 + Math.sin(ang) * 14, 9 * hot, '255,236,170', hot);
      rect(c, -9, 0, 18, 4.6, '#4a2f1c');
      rect(c, -9, 2.8, 18, 1.2, '#f2b632');
      dome(c, 0, 4.6, 6, '#5f4630');
      circ(c, 0, 5.4, 1.6, '#f2b632');
    } else {
      poly(c, [[-9, 0], [-4, 5], [0, 2], [5, 6], [9, 0]], '#3d3a36');
      soft(c, 0, 2, 9, '255,130,60', 0.55 + 0.3 * Math.sin(time * 5));
    }
    pips(c, b, '#2b1c10', 'rgba(43,28,16,0.2)', { y: -4 });
  },

  flyer(c, f) {                                            // red biplane
    const dir = Math.sign(f.vx), s = 1.15 * u;
    c.save(); c.translate(f.x, f.y + Math.sin(time * 2 + f.x * 0.01) * 3 * u); c.scale(dir * s, s);
    ell(c, 0, 0, 15, 3.4, '#c8102e');
    poly(c, [[-13, 0], [-19, -7], [-15.5, -7], [-10, -1.5]], '#c8102e');
    rect(c, -5, -8.4, 11, 2, '#f2b632'); rect(c, -5, 3.6, 11, 2, '#f2b632');
    line(c, -3, -6.4, -3, 3.6, '#5e1712', 0.7); line(c, 4, -6.4, 4, 3.6, '#5e1712', 0.7);
    circ(c, 4, -1.4, 1.5, '#27333f');
    line(c, 2, 3, 3, 7, '#333', 0.7); circ(c, 3, 7.2, 1.6, '#1c1c1c');
    c.fillStyle = 'rgba(60,60,60,0.45)'; c.fillRect(15, -6.5 * Math.abs(Math.sin(time * 40)), 1.1, 13 * Math.abs(Math.sin(time * 40)));
    c.restore();
  },
};

// Fill everything on a ridge above a (jagged) snow line.
function snow(o, x0, x1, base, hFn, lineFn, fill) {
  o.save();
  ridge(o, x0, x1, base, hFn, null);
  o.clip();
  o.beginPath();
  o.moveTo(x0, base - lineFn(x0));
  for (let x = x0; x <= x1; x += 3) o.lineTo(x, base - lineFn(x));
  o.lineTo(x1, -20); o.lineTo(x0, -20);
  o.closePath();
  o.fillStyle = fill;
  o.fill();
  o.restore();
}
