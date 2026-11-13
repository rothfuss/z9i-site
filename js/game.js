// Game engine: rules, input, sound, HUD and the render loop. All artwork lives in js/themes/.
//
// A theme is a plain object. The engine reads:
//   cityFx, baseFx        x positions (0..1) of the things to defend and the three launch bases
//   backdrop(o)           static scenery, drawn once per resize into a cached layer
//   foreground(o)         static ground band, drawn once per resize
//   ambient(c), tick(dt)  animated scenery behind the action (clouds, trains, fish...)
//   cityArt / ruinArt     building art in unit coordinates (cached as sprites)
//   cityAnim(c, i, city)  optional per-frame details on top of a building (unit coordinates)
//   base(c, b)            launch base, drawn every frame in unit coordinates
//   flyer, head, blastDraw, blastExtra, overlay, panel   optional custom drawing
//   threat, smart, abm, blast, fx, ui, brand, footer     colors and effect settings
import {
  TAU, W, H, G, u, R, dpr, time, game, setGeom, addTime,
  rand, clamp, pick, rgba, mkCanvas, unitSprite, burst, puff, soft, circ, rgrad, rrectPath,
} from './core.js';

const THEMES = [
  { id: 'daybreak', name: 'Daybreak', desc: 'Sunrise harbor, glass towers, sailboats', swatch: 'linear-gradient(160deg,#5aa9ec,#bfe1f7 45%,#ffd9b0 70%,#ff5f8f)', page: '#9fd0f5', load: () => import('./themes/daybreak.js') },
  { id: 'laramie', name: 'Laramie', desc: 'Looking west to the Snowy Range', swatch: 'linear-gradient(170deg,#1b5fb4,#8fc4ee 45%,#e9eef2 52%,#d9bd7a 70%,#7a5a36)', page: '#4d97dc', load: () => import('./themes/laramie.js') },
  { id: 'monument', name: 'Monument', desc: 'Z9 INNOVATION as a neon skyline', swatch: 'linear-gradient(170deg,#0b1030,#3a1f6e 40%,#ff4f8b 78%,#ffb35c)', page: '#0b1030', load: () => import('./themes/monument.js') },
  { id: 'steam', name: 'Steamworks', desc: 'Brass, copper, airships and clockwork', swatch: 'linear-gradient(170deg,#4f8f88,#e9d9a0 45%,#e2994e 75%,#3a2416)', page: '#6aa39a', load: () => import('./themes/steamworks.js') },
  { id: 'water', name: 'Watercolor', desc: 'Painted paper, ink lines, a storybook valley', swatch: 'linear-gradient(160deg,#bcd9ee,#f9dcc8 50%,#8fbf9f 75%,#3f7f7a)', page: '#f3eee2', load: () => import('./themes/watercolor.js') },
  { id: 'atlantis', name: 'Atlantis', desc: 'Sunlit sea, domed reef city, whales', swatch: 'linear-gradient(175deg,#9ff3ee,#27b7c9 35%,#0b6e9c 70%,#06324f)', page: '#27b7c9', load: () => import('./themes/atlantis.js') },
  { id: 'orbit', name: 'Orbit', desc: 'Moon base under a rising Earth', swatch: 'radial-gradient(circle at 30% 35%,#6fb6ff 0 14%,#16224a 16% 40%,#05060f 70%)', page: '#05060f', load: () => import('./themes/orbit.js') },
];

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const footerEl = document.getElementById('footer');
const pauseBtn = document.getElementById('pause');
const muteBtn = document.getElementById('mute');
const themeBtn = document.getElementById('themeBtn');
const themeMenu = document.getElementById('themeMenu');
const touchOnly = window.matchMedia('(hover: none)').matches;
game.reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const MONO = '"JetBrains Mono", ui-monospace, monospace';
const SANS = 'Inter, system-ui, sans-serif';

let T = null;                     // active theme
const loaded = {};                // theme id -> theme object
let backLayer = null, frontLayer = null, frontTop = 0, brandSprite = null, logoImg = null;
let sprites = { city: [], ruin: [] };
let fade = null;                  // snapshot of the previous theme, cross-faded out

// ---------------------------------------------------------------- game state
let score = 0, shown = 0, wave = 0, mult = 1, nextBonus = 10000, high = 0;
let phase = 'wave', remaining = 0, salvoTimer = 0, sinceSalvo = 0, waveTargets = [];
let tally = null, tallyTimer = 0, banner = null, shake = 0, flash = 0;
let overTimer = 0, endingTimer = -1, aiTimer = 0, smokeTimer = 0, hint = 1;
let markers = [], ghosts = [];
const pointer = game.pointer;
try { high = parseInt(localStorage.getItem('z9-high') || '0', 10) || 0; } catch (e) {}

const cityX = c => (T.cityX ? T.cityX(c.i) : c.fx * W);
const baseX = b => (T.baseX ? T.baseX(b.i) : b.fx * W);
const baseTop = () => (T.baseTop ? T.baseTop() : G - (T.baseH || 28) * u);
const cityHitY = c => (T.cityHitY ? T.cityHitY(c) : G - 2);
const cityHalf = () => (T.cityHalf ? T.cityHalf() : 27 * u * game.cs);
const baseHalf = () => (T.baseHalf ? T.baseHalf() : 42 * u);
const muzzle = b => (T.muzzle ? T.muzzle(b) : [baseX(b), baseTop() - 6 * u]);
const fallTime = () => Math.max(4.2, 16 / (1 + 0.2 * (wave - 1)));   // seconds from sky to ground
const multFor = w => Math.min(1 + Math.floor((w - 1) / 2), 6);
const shotSpeed = b => G / (b.fast ? 0.7 : 1.35);                     // centre base fires fastest

function citySprite(i, alive) {
  if (T.citySprite) return T.citySprite(i, alive);
  const key = alive ? 'city' : 'ruin';
  let s = sprites[key][i];
  if (!s) {
    const [w, up, down] = T.cityBox || [64, 84, 4];
    s = sprites[key][i] = unitSprite(w, up, down, c => (alive ? T.cityArt(c, i) : T.ruinArt(c, i)), game.cs);
  }
  return s;
}

const makeCities = () => T.cityFx.map((fx, i) => ({ fx, i, alive: true, hitT: -9 }));

// Like the arcade original, each wave aims at no more than three cities, plus the bases.
function chooseTargets() {
  const alive = game.cities.filter(c => c.alive).sort(() => Math.random() - 0.5).slice(0, 3);
  const dead = game.cities.filter(c => !c.alive);
  if (alive.length < 3 && dead.length) alive.push(pick(dead));
  waveTargets = alive.map(c => ({ ref: c, type: 'city' })).concat(game.bases.map(b => ({ ref: b, type: 'base' })));
}

function clearField() {
  game.threats = []; game.shots = []; game.blasts = []; game.flyers = [];
  game.particles = []; game.puffs = []; game.chunks = [];
  markers = []; ghosts = [];
}

// auto = true: the autopilot defends (page load, or after a finished game sits idle).
function newGame(auto) {
  game.mode = 'playing';
  game.auto = auto;
  game.paused = false;
  game.cities = makeCities();
  game.bases = T.baseFx.map((fx, i) => ({ fx, i, ammo: 10, alive: true, fast: i === 1, fireT: -9 }));
  clearField();
  score = 0; shown = 0; wave = 0; nextBonus = 10000; overTimer = 0; endingTimer = -1; tally = null;
  syncButtons();
  startWave();
}

function startWave() {
  if (game.auto) {                 // the demo loops wave 1 so a visitor always joins an easy wave
    wave = 1;
    game.cities.forEach(c => { c.alive = true; });
  } else wave++;
  mult = multFor(wave);
  game.bases.forEach(b => { b.alive = true; b.ammo = 10; });
  remaining = Math.min(12 + 2 * (wave - 1), 30);
  salvoTimer = 2.2;
  sinceSalvo = 0;
  phase = 'wave';
  chooseTargets();
  banner = game.auto ? null : { title: 'WAVE ' + wave, sub: mult + '× POINTS', t: 2.4 };
  if (!game.auto) sfx.wave();
}

// The visitor's first shot takes over from the autopilot, mid-wave.
function takeover() {
  game.auto = false;
  score = 0; shown = 0; wave = 1; mult = 1; nextBonus = 10000;
  game.bases.forEach(b => { if (b.alive) b.ammo = 10; });
  banner = { title: 'WAVE 1', sub: 'YOU HAVE CONTROL', t: 2.2 };
  syncButtons();
}

function targetPoint() {
  const t = pick(waveTargets);
  if (t.type === 'city') return { x: cityX(t.ref) + rand(-5, 5) * u, y: cityHitY(t.ref) };
  return { x: baseX(t.ref) + rand(-8, 8) * u, y: baseTop() };
}

function spawnThreat(sx, sy, kind, canSplit) {
  const tp = targetPoint();
  const vy = (G / fallTime()) * (kind === 'smart' ? 1.15 : rand(0.92, 1.08));
  const dur = Math.max(0.3, (tp.y - sy) / vy);
  const t = { sx, sy, x: sx, y: sy, tx: tp.x, ty: tp.y, vx: (tp.x - sx) / dur, vy, kind, pts: [[sx, sy]], split: null, targeted: false, dodge: 0, born: time };
  if (canSplit && kind === 'normal' && wave >= 2 && Math.random() < Math.min(0.1 + wave * 0.03, 0.35)) t.split = rand(0.28, 0.55) * G;
  game.threats.push(t);
  return t;
}

function launchSalvo() {
  const n = Math.min(remaining, 3 + ((Math.random() * 2) | 0) + Math.floor(wave / 4), 8);
  let smarts = 0;
  for (let i = 0; i < n; i++) {
    const smart = wave >= 6 && smarts < 2 && Math.random() < 0.14;
    if (smart) smarts++;
    spawnThreat(rand(0.04, 0.96) * W, -2, smart ? 'smart' : 'normal', true);
  }
  remaining -= n;
  sinceSalvo = 0;
  if (wave >= 2 && game.flyers.length === 0 && Math.random() < 0.35) {
    const dir = Math.random() < 0.5 ? 1 : -1;
    game.flyers.push({
      x: dir > 0 ? -50 : W + 50, y: rand(0.3, 0.5) * G, vx: (dir * W) / rand(8, 11),
      drops: Array.from({ length: 1 + ((Math.random() * 2) | 0) }, () => rand(0.2, 0.8) * W),
    });
  }
}

function fire(x, y, idx) {
  if (game.paused || phase !== 'wave' || game.mode !== 'playing') return false;
  y = Math.min(y, baseTop() - 34 * u);
  let base = null;
  if (idx != null) {
    const b = game.bases[idx];
    if (b && b.alive && b.ammo > 0) base = b;
  } else {
    let best = Infinity;
    for (const b of game.bases) {
      if (!b.alive || b.ammo <= 0) continue;
      const d = Math.abs(baseX(b) - x);
      if (d < best) { best = d; base = b; }
    }
  }
  if (!base) { if (!game.auto) sfx.empty(); return false; }
  base.ammo--;
  base.fireT = time;
  const [sx, sy] = muzzle(base);
  const d = Math.hypot(x - sx, y - sy) || 1, sp = shotSpeed(base);
  game.shots.push({ sx, sy, x: sx, y: sy, tx: x, ty: y, vx: ((x - sx) / d) * sp, vy: ((y - sy) / d) * sp, left: d });
  markers.push({ x, y, t: 0 });
  if (T.onFire) T.onFire(base, sx, sy, x, y);
  if (!game.auto) sfx.launch(base.fast);
  return true;
}

function addBlast(x, y, max, kind) {
  const b = { x, y, max, kind, t: 0, r: 0, seed: Math.random() };
  game.blasts.push(b);
  if (kind === 'player') puff(x, y, { kind: 'ring', r: max * 0.3, gr: max * 2.6, a: 0.55, fa: 1.1, rgb: T.fx.ring || '255,255,255', lw: 2 });
  if (T.onBlast) T.onBlast(b);
}

const ghost = (t, rgb) => ghosts.push({ pts: t.pts.concat([[t.x, t.y]]), rgb, a: 1 });
const addScore = n => { if (!game.auto) score += n * mult; };

function killThreat(i) {
  const t = game.threats[i];
  game.threats.splice(i, 1);
  ghost(t, t.kind === 'smart' ? T.smart : T.threat);
  addBlast(t.x, t.y, R * 0.72, 'chain');
  burst(t.x, t.y, 12, T.fx.spark, 120 * u, 0.8);
  addScore(t.kind === 'smart' ? 125 : 25);
  if (!game.auto) sfx.pop();
}

function killFlyer(i) {
  const f = game.flyers[i];
  game.flyers.splice(i, 1);
  addBlast(f.x, f.y, R * 0.9, 'chain');
  burst(f.x, f.y, 26, T.fx.debris, 160 * u, 1.1, 2.5);
  burst(f.x, f.y, 14, T.fx.spark, 200 * u, 0.7);
  addScore(100);
  if (!game.auto) sfx.pop();
}

// Break a sprite into tumbling pieces.
function shatter(s, x, y) {
  const cols = 5, rows = clamp(Math.round((5 * s.h) / s.w), 3, 8), cw = s.w / cols, ch = s.h / rows;
  const kx = s.c.width / s.w, ky = s.c.height / s.h;
  for (let r = 0; r < rows; r++) for (let q = 0; q < cols; q++) {
    const life = rand(1.0, 1.9);
    game.chunks.push({
      s, sx: q * cw * kx, sy: r * ch * ky, sw: cw * kx, sh: ch * ky, w: cw, h: ch,
      x: x - s.ax + (q + 0.5) * cw, y: y - s.ay + (r + 0.5) * ch,
      vx: (q - (cols - 1) / 2) * rand(18, 46) * u + rand(-14, 14) * u,
      vy: -rand(40, 190) * u * (1.15 - r / rows),
      rot: 0, vr: rand(-5, 5), life, max: life,
    });
  }
}

function impact(t) {
  ghost(t, t.kind === 'smart' ? T.smart : T.threat);
  addBlast(t.x, t.y, R * 0.8, 'ground');
  burst(t.x, t.y, 20, T.fx.spark, 160 * u, 1.0);
  burst(t.x, t.y, 10, T.fx.debris, 70 * u, 1.6, 3);
  let hit = false;
  const ch = cityHalf(), bh = baseHalf();
  for (const c of game.cities) {
    if (c.alive && Math.abs(cityX(c) - t.x) < ch) {
      shatter(citySprite(c.i, true), cityX(c), G);
      c.alive = false; c.hitT = time; hit = true;
      burst(cityX(c), cityHitY(c) - 8 * u, 30, T.fx.city, 190 * u, 1.4);
      if (T.onCityLost) T.onCityLost(c);
    }
  }
  for (const b of game.bases) {
    if (b.alive && Math.abs(baseX(b) - t.x) < bh) {
      if (T.baseSprite) shatter(T.baseSprite(b.i, true), baseX(b), G);
      b.alive = false; b.ammo = 0; hit = true;
      burst(baseX(b), baseTop(), 28, T.fx.city, 170 * u, 1.2);
    }
  }
  if (!game.reduceMotion) { shake = Math.max(shake, hit ? 9 : 3); flash = Math.max(flash, hit ? 0.5 : 0.12); }
  if (T.onImpact) T.onImpact(t, hit);
  if (!game.auto) sfx.boom(hit);
}

function endWave() {
  const ammoLeft = game.bases.reduce((s, b) => s + (b.alive ? b.ammo : 0), 0);
  const citiesLeft = game.cities.filter(c => c.alive).length;
  const ammoBonus = ammoLeft * 5 * mult, cityBonus = citiesLeft * 100 * mult;
  let restored = 0;
  if (!game.auto) {
    score += ammoBonus + cityBonus;
    while (score >= nextBonus) {
      nextBonus += 10000;
      const dead = game.cities.find(c => !c.alive);
      if (dead) { dead.alive = true; restored++; }
    }
    sfx.clear();
  }
  tally = { ammoLeft, citiesLeft, ammoBonus, cityBonus, restored };
  phase = 'tally';
  tallyTimer = game.auto ? 1.4 : 3.4;
}

function gameOver() {
  game.mode = 'gameover';
  overTimer = 0;
  game.paused = false;
  syncButtons();
  if (score > high) {
    high = score;
    try { localStorage.setItem('z9-high', String(high)); } catch (e) {}
  }
  sfx.over();
}

// Autopilot: leads the lowest unclaimed missile from the nearest base that still has ammo.
function runAI(dt) {
  aiTimer -= dt;
  if (aiTimer > 0 || phase !== 'wave') return;
  aiTimer = rand(0.3, 0.7);
  const cands = game.threats.filter(t => !t.targeted && t.y > G * 0.12).sort((a, b) => b.y - a.y);
  for (const t of cands) {
    let best = null, bd = Infinity;
    for (const b of game.bases) {
      const d = Math.abs(baseX(b) - t.x);
      if (b.alive && b.ammo > 0 && d < bd) { bd = d; best = b; }
    }
    if (!best) return;
    let px = t.x, py = t.y;
    for (let k = 0; k < 3; k++) {
      const tt = Math.hypot(px - baseX(best), py - baseTop()) / shotSpeed(best) + 0.25;
      px = t.x + t.vx * tt; py = t.y + t.vy * tt;
    }
    if (py > baseTop() - 40 * u) continue;
    if (fire(px + rand(-5, 5), py + rand(-5, 5), game.bases.indexOf(best))) {
      game.threats.forEach(o => { if (Math.hypot(o.x - px, o.y - py) < R * 1.2) o.targeted = true; });
      t.targeted = true;
    }
    return;
  }
}

function update(dt) {
  addTime(dt);
  game.wind = 1 + 0.45 * Math.sin(time * 0.11) + 0.3 * Math.sin(time * 0.31 + 1.7) + 0.15 * Math.sin(time * 0.9);
  if (shake > 0) shake = Math.max(0, shake - dt * 22);
  if (flash > 0) flash = Math.max(0, flash - dt * 2.4);
  if (banner) { banner.t -= dt; if (banner.t <= 0) banner = null; }
  hint += ((game.auto ? 1 : 0) - hint) * Math.min(1, dt * 6);
  shown += (score - shown) * Math.min(1, dt * 9);
  if (T.tick) T.tick(dt);

  const { threats, shots, blasts, flyers, particles, puffs, chunks, cities } = game;
  const anyCity = cities.some(c => c.alive);

  if (game.mode === 'playing') {
    if (phase === 'wave') {
      sinceSalvo += dt;
      if (remaining > 0 && anyCity) {
        salvoTimer -= dt;
        const lowest = threats.reduce((m, t) => Math.min(m, t.y), Infinity);
        const ready = threats.length === 0 || lowest > G * 0.42 || sinceSalvo > fallTime() * 0.7;
        if (salvoTimer <= 0 && ready && sinceSalvo > 1.5) launchSalvo();
      } else if (!threats.length && !shots.length && !blasts.length && !flyers.length && anyCity) {
        endWave();
      }
    } else if (phase === 'tally') {
      tallyTimer -= dt;
      if (tallyTimer <= 0) { tally = null; startWave(); }
    }
    if (game.auto) runAI(dt);
  }

  for (let i = threats.length - 1; i >= 0; i--) {
    const t = threats[i];
    if (t.kind === 'smart') {                       // smart bombs sidestep growing blasts
      let push = 0;
      for (const b of blasts) {
        if (b.kind === 'ground') continue;
        const dx = t.x - b.x, dy = t.y - b.y, d = Math.hypot(dx, dy);
        if (d < b.max + R * 0.9 && d > b.r * 0.8) push += Math.sign(dx || 1);
      }
      if (push) {
        t.x = clamp(t.x + ((Math.sign(push) * G) / fallTime()) * 2.2 * dt, 10, W - 10);
        t.dodge += dt;
        if (t.dodge > 0.12) { t.pts.push([t.x, t.y]); t.dodge = 0; }
        t.vx = (t.tx - t.x) / Math.max(0.1, (t.ty - t.y) / t.vy);
      }
    }
    t.x += t.vx * dt; t.y += t.vy * dt;
    if (T.trail) T.trail(t, dt);
    if (t.split != null && t.y >= t.split) {
      threats.splice(i, 1);
      const n = 2 + ((Math.random() * 2) | 0);
      for (let k = 0; k < n; k++) spawnThreat(t.x, t.y, 'normal', false).pts = t.pts.concat([[t.x, t.y]]);
      continue;
    }
    if (t.y >= t.ty) { threats.splice(i, 1); impact(t); }
  }

  for (let i = flyers.length - 1; i >= 0; i--) {
    const f = flyers[i], px = f.x;
    f.x += f.vx * dt;
    for (let k = f.drops.length - 1; k >= 0; k--) {
      const d = f.drops[k];
      if ((px - d) * (f.x - d) <= 0) { f.drops.splice(k, 1); if (anyCity) spawnThreat(f.x, f.y + 8 * u, 'normal', false); }
    }
    if (f.x < -80 || f.x > W + 80) flyers.splice(i, 1);
  }

  for (let i = shots.length - 1; i >= 0; i--) {
    const s = shots[i];
    s.left -= Math.hypot(s.vx, s.vy) * dt;
    if (s.left <= 0) {
      shots.splice(i, 1);
      addBlast(s.tx, s.ty, R, 'player');
      const mi = markers.findIndex(m => m.x === s.tx && m.y === s.ty);
      if (mi >= 0) markers.splice(mi, 1);
      if (!game.auto) sfx.blast();
    } else { s.x += s.vx * dt; s.y += s.vy * dt; if (T.shotTrail) T.shotTrail(s, dt); }
  }

  // Blasts last about a second: grow, hold briefly, collapse.
  for (let i = blasts.length - 1; i >= 0; i--) {
    const b = blasts[i];
    b.t += dt;
    const g = 0.45, h = 0.1, f = 0.45;
    if (b.t < g) b.r = b.max * Math.sin(((b.t / g) * Math.PI) / 2);
    else if (b.t < g + h) b.r = b.max;
    else if (b.t < g + h + f) b.r = b.max * (1 - (b.t - g - h) / f);
    else {
      blasts.splice(i, 1);
      if (T.fx.linger !== false && !game.lowFx) for (let k = 0; k < 2; k++) puff(b.x + rand(-6, 6) * u, b.y + rand(-6, 6) * u, { rgb: T.fx.haze || T.fx.smoke, r: b.max * 0.3, gr: 10 * u, a: 0.12, fa: 0.12, vx: game.wind * 10 * u, vy: -8 * u });
      continue;
    }
    if (b.kind === 'ground') continue;
    const r2 = b.r * b.r;
    for (let j = threats.length - 1; j >= 0; j--) {
      const t = threats[j], dx = t.x - b.x, dy = t.y - b.y;
      if (dx * dx + dy * dy < r2) killThreat(j);
    }
    for (let j = flyers.length - 1; j >= 0; j--) {
      const fl = flyers[j], dx = fl.x - b.x, dy = fl.y - b.y, rr = b.r + 12 * u;
      if (dx * dx + dy * dy < rr * rr) killFlyer(j);
    }
  }

  const grav = (T.fx.gravity ?? 120) * u, drag = Math.pow(T.fx.drag ?? 0.4, dt);
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.life -= dt;
    if (p.life <= 0) { particles.splice(i, 1); continue; }
    p.vy += grav * dt; p.vx *= drag; p.vy *= drag;
    p.x += p.vx * dt; p.y += p.vy * dt; p.rot += dt * 4;
    if (p.y > G && grav > 0) { p.y = G; p.vy *= -0.25; }
  }
  for (let i = puffs.length - 1; i >= 0; i--) {
    const p = puffs[i];
    p.a -= p.fa * dt;
    if (p.a <= 0) { puffs.splice(i, 1); continue; }
    p.x += p.vx * dt; p.y += p.vy * dt; p.r += p.gr * dt;
    if (p.kind === 'bubble') p.x += Math.sin(time * 3 + p.y * 0.05) * 6 * u * dt;
  }
  const cg = (T.fx.chunkG ?? 420) * u, cd = Math.pow(T.fx.chunkDrag ?? 0.6, dt);
  for (let i = chunks.length - 1; i >= 0; i--) {
    const p = chunks[i];
    p.life -= dt;
    if (p.life <= 0) { chunks.splice(i, 1); continue; }
    p.vy += cg * dt; p.vx *= cd; p.vy *= cd;
    p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
    if (p.y > G + 4 * u && cg > 0) { p.y = G + 4 * u; p.vy *= -0.2; p.vx *= 0.5; p.vr *= 0.4; }
  }
  for (let i = ghosts.length - 1; i >= 0; i--) { ghosts[i].a -= dt * 0.9; if (ghosts[i].a <= 0) ghosts.splice(i, 1); }
  markers.forEach(m => { m.t += dt; });

  // Ruins keep smouldering.
  smokeTimer -= dt;
  if (smokeTimer <= 0) {
    smokeTimer = game.lowFx ? 0.3 : 0.14;
    for (const c of cities) {
      if (c.alive) continue;
      if (T.ruinSmoke) T.ruinSmoke(c, cityX(c));
      else if (T.fx.ruinSmoke !== false) puff(cityX(c) + rand(-9, 9) * u, cityHitY(c) - rand(2, 9) * u, { rgb: T.fx.smoke, r: rand(3, 5) * u, gr: 8 * u, a: 0.34, fa: 0.13, vx: game.wind * rand(8, 16) * u, vy: -rand(18, 28) * u });
    }
  }

  if (game.mode === 'playing' && !anyCity) {
    if (endingTimer < 0) endingTimer = 0;
    endingTimer += dt;
    if (endingTimer > (game.auto ? 2.5 : 1.6)) { if (game.auto) newGame(true); else gameOver(); }
  }
  if (game.mode === 'gameover') { overTimer += dt; if (overTimer > 18) newGame(true); }
}

// ---------------------------------------------------------------- layout
function layout() {
  if (!T) return;
  const oldW = W, oldG = G, oldR = R;
  const w = window.innerWidth, h = window.innerHeight;
  // Cap the backing store so very large screens stay smooth.
  const d = Math.max(1, Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(7.5e6 / (w * h))));
  canvas.width = Math.round(w * d);
  canvas.height = Math.round(h * d);
  footerEl.style.minHeight = '';
  const band = Math.max(footerEl.offsetHeight + (T.footerPad || 0), clamp(h * 0.1, 60, 96));
  footerEl.style.minHeight = band + 'px';
  const g = h - band;
  setGeom({ W: w, H: h, G: g, u: clamp(Math.min(w / 1200, h / 820), 0.6, 1.45), R: clamp(Math.min(w * 0.05, g * 0.075), 24, 62), dpr: d });

  // Landmarks grow to fill the room between neighbours (smaller on narrow phones).
  const xs = [...T.cityFx, ...T.baseFx].sort((a, z) => a - z);
  let gap = 1;
  for (let i = 1; i < xs.length; i++) gap = Math.min(gap, xs[i] - xs[i - 1]);
  game.cs = T.cityScale === false ? 1 : clamp((gap * W * 0.92) / (62 * u), 0.7, T.cityScaleMax || 1.6);

  const b = game.brand;
  b.w = clamp(Math.min(W * 0.24, H * 0.34), 120, 280);
  b.h = (b.w * 411) / 720;
  b.top = clamp(H * 0.1, 56, 120);
  b.x = W / 2;
  b.wordSize = clamp(Math.min(W * 0.024, H * 0.034), 15, 28);
  b.wordY = b.top + b.h + clamp(H * 0.016, 8, 16) + b.wordSize / 2;
  b.bottom = b.wordY + b.wordSize / 2;

  if (oldW && (oldW !== W || oldG !== G)) rescale(W / oldW, G / oldG, R / oldR);
  rebuild();
}

function rebuild() {
  if (!T || !W) return;
  if (T.layout) T.layout();
  sprites = { city: [], ruin: [] };
  if (T.build) T.build();
  let c;
  [backLayer, c] = mkCanvas(W, H);
  T.backdrop(c);
  frontTop = Math.max(0, Math.floor(G - 120 * u));
  [frontLayer, c] = mkCanvas(W, H - frontTop);
  c.translate(0, -frontTop);
  T.foreground(c);
  buildBrand();
}

// Logo and wordmark, tinted and lit per theme, cached as one sprite.
function buildBrand() {
  if (!T || !W) return;
  const b = game.brand, st = T.brand || {};
  const pad = Math.ceil((st.pad ?? 30) * u);
  const font = '600 ' + b.wordSize + 'px "Cormorant Garamond", Georgia, serif';
  const word = 'INNOVATION', sp = b.wordSize * 0.62;
  ctx.save(); ctx.font = font;
  const widths = [...word].map(ch => ctx.measureText(ch).width);
  ctx.restore();
  const total = widths.reduce((a, v) => a + v, 0) + sp * (word.length - 1);
  const w = Math.max(b.w, total) + pad * 2, h = b.bottom - b.top + pad * 2;

  const [fc, f] = mkCanvas(w, h);
  if (logoImg && logoImg.complete && logoImg.naturalWidth) f.drawImage(logoImg, (w - b.w) / 2, pad, b.w, b.h);
  f.font = font; f.textBaseline = 'middle'; f.textAlign = 'left'; f.fillStyle = '#000';
  let x = (w - total) / 2;
  [...word].forEach((ch, k) => { f.fillText(ch, x, pad + b.wordY - b.top); x += widths[k] + sp; });
  f.globalCompositeOperation = 'source-in';
  f.fillStyle = typeof st.fill === 'function' ? st.fill(f, w, h) : st.fill || '#0d1224';
  f.fillRect(0, 0, w, h);

  const [oc, o] = mkCanvas(w, h);
  for (const g of st.glows || []) {
    o.shadowColor = g.color; o.shadowBlur = g.blur * u * dpr; o.shadowOffsetY = (g.dy || 0) * u * dpr;
    o.drawImage(fc, 0, 0, w, h);
  }
  o.shadowColor = 'transparent'; o.shadowBlur = 0; o.shadowOffsetY = 0;
  o.drawImage(fc, 0, 0, w, h);
  brandSprite = { c: oc, w, h, x: b.x - w / 2, y: b.top - pad };
}

function rescale(kx, ky, kr) {
  const sc = o => {
    if (o.x != null) o.x *= kx; if (o.y != null) o.y *= ky;
    if (o.sx != null && o.s == null) o.sx *= kx; if (o.sy != null && o.s == null) o.sy *= ky;
    if (o.tx != null) o.tx *= kx; if (o.ty != null) o.ty *= ky;
    if (o.vx != null) o.vx *= kx; if (o.vy != null) o.vy *= ky;
    if (o.split != null) o.split *= ky;
    if (o.pts) o.pts.forEach(p => { p[0] *= kx; p[1] *= ky; });
    if (o.drops) o.drops = o.drops.map(d => d * kx);
    if (o.r != null) o.r *= kr; if (o.max != null && o.kind) o.max *= kr;
    if (o.left != null) o.left *= Math.hypot(kx, ky) / Math.SQRT2;
  };
  [game.threats, game.shots, game.blasts, game.flyers, game.particles, game.puffs, markers, ghosts].forEach(list => list.forEach(sc));
  game.chunks = [];
}

// ---------------------------------------------------------------- rendering
function path(pts, x, y) {
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  if (x != null) ctx.lineTo(x, y);
}

function drawTrails() {
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const tw = (T.threatWidth || 1.6) * u, ta = T.threatAlpha || 0.42;
  for (const g of ghosts) {                         // faded paths of destroyed missiles
    ctx.strokeStyle = rgba(g.rgb, ta * g.a);
    ctx.lineWidth = tw * 0.9;
    path(g.pts); ctx.stroke();
  }
  for (const t of game.threats) {                   // the whole path stays visible, brighter near the head
    const rgb = t.kind === 'smart' ? T.smart : T.threat;
    ctx.strokeStyle = rgba(rgb, ta);
    ctx.lineWidth = tw;
    path(t.pts, t.x, t.y); ctx.stroke();
    const last = t.pts[t.pts.length - 1];
    const k = Math.min(1, (90 * u) / Math.max(1, Math.hypot(t.x - last[0], t.y - last[1])));
    const hx = t.x - (t.x - last[0]) * k, hy = t.y - (t.y - last[1]) * k;
    const g = ctx.createLinearGradient(hx, hy, t.x, t.y);
    g.addColorStop(0, rgba(rgb, 0)); g.addColorStop(1, rgba(rgb, 1));
    ctx.strokeStyle = g; ctx.lineWidth = tw * 1.5;
    ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(t.x, t.y); ctx.stroke();
    if (T.head) T.head(ctx, t, rgb);
    else {
      soft(ctx, t.x, t.y, 9 * u, rgb.join(','), 0.6);
      if (t.kind === 'smart') {
        ctx.save(); ctx.translate(t.x, t.y); ctx.rotate(time * 6);
        ctx.fillStyle = rgba(rgb, 1); const s = 5.5 * u;
        ctx.beginPath(); ctx.moveTo(0, -s); ctx.lineTo(s, 0); ctx.lineTo(0, s); ctx.lineTo(-s, 0); ctx.closePath(); ctx.fill();
        ctx.restore();
      }
      circ(ctx, t.x, t.y, 2.4 * u, rgba(rgb, 1));
      circ(ctx, t.x, t.y, 1.1 * u, 'rgba(255,255,255,0.85)');
    }
  }
  for (const s of game.shots) {
    ctx.strokeStyle = rgba(T.abm, T.abmAlpha || 0.75);
    ctx.lineWidth = (T.abmWidth || 1.7) * u;
    ctx.beginPath(); ctx.moveTo(s.sx, s.sy); ctx.lineTo(s.x, s.y); ctx.stroke();
    if (T.shotHead) T.shotHead(ctx, s);
    else {
      soft(ctx, s.x, s.y, 8 * u, T.abm.join(','), 0.7);
      circ(ctx, s.x, s.y, 2.2 * u, T.abmHead || '#ffffff');
    }
  }
  for (const m of markers) {
    const r = 5 * u;
    ctx.strokeStyle = T.marker[Math.floor(m.t * 10) % 2];
    ctx.lineWidth = 1.6 * u;
    ctx.beginPath();
    ctx.moveTo(m.x - r, m.y - r); ctx.lineTo(m.x + r, m.y + r);
    ctx.moveTo(m.x + r, m.y - r); ctx.lineTo(m.x - r, m.y + r);
    ctx.stroke();
  }
}

function drawBlasts() {
  const add = T.fx.add;
  if (add) ctx.globalCompositeOperation = 'lighter';
  for (const b of game.blasts) {
    if (b.r < 0.5) continue;
    if (T.blastDraw) { T.blastDraw(ctx, b); continue; }
    const k = b.r / b.max, st = b.kind === 'ground' ? T.groundBlast || ['rgba(255,246,220,0.97)', 'rgba(255,170,80,0.9)', 'rgba(230,80,50,0.6)', 'rgba(200,60,50,0)'] : T.blast;
    soft(ctx, b.x, b.y, b.r * 2.1, T.fx.glow || '255,225,160', 0.4 * k);
    const flick = Math.floor(time * 14 + b.seed * 3) % 3;
    ctx.fillStyle = rgrad(ctx, b.x, b.y, 0, b.r, [[0, st[0]], [0.36 + flick * 0.04, st[1]], [0.78, st[2]], [1, st[3]]]);
    ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, TAU); ctx.fill();
    if (b.kind === 'player') {
      ctx.strokeStyle = 'rgba(255,255,255,' + 0.55 * k + ')';
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(b.x, b.y, b.r * 1.03, 0, TAU); ctx.stroke();
    }
    if (T.blastExtra) T.blastExtra(ctx, b);
  }
  const shape = T.fx.shape;
  for (const p of game.particles) {
    const a = Math.max(0, p.life / p.max), s = p.size * u;
    if (T.particle && T.particle(ctx, p, a, s)) continue;
    ctx.fillStyle = 'rgba(' + p.rgb + ',' + a + ')';
    if (shape === 'circle') { ctx.beginPath(); ctx.arc(p.x, p.y, s * 0.7, 0, TAU); ctx.fill(); }
    else ctx.fillRect(p.x - s / 2, p.y - s / 2, s, s);
  }
  if (add) ctx.globalCompositeOperation = 'source-over';
}

function drawPuffs() {
  for (const p of game.puffs) {
    if (p.kind === 'ring') {
      ctx.strokeStyle = 'rgba(' + p.rgb + ',' + Math.max(0, p.a) + ')';
      ctx.lineWidth = (p.lw || 1.5) * u;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.stroke();
    } else if (p.kind === 'bubble') {
      ctx.strokeStyle = 'rgba(' + p.rgb + ',' + Math.max(0, p.a) + ')';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.stroke();
      circ(ctx, p.x - p.r * 0.35, p.y - p.r * 0.35, p.r * 0.22, 'rgba(255,255,255,' + Math.max(0, p.a) + ')');
    } else soft(ctx, p.x, p.y, p.r * 1.6, p.rgb, p.a);
  }
}

function drawChunks() {
  for (const p of game.chunks) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, (p.life / p.max) * 2.2);
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.drawImage(p.s.c, p.sx, p.sy, p.sw, p.sh, -p.w / 2, -p.h / 2, p.w, p.h);
    ctx.restore();
  }
}

function txt(str, x, y, size, color, o = {}) {
  ctx.font = (o.weight || 500) + ' ' + size + 'px ' + (o.font || T.ui.font || MONO);
  ctx.textAlign = o.align || 'center';
  ctx.textBaseline = 'middle';
  if ('letterSpacing' in ctx) ctx.letterSpacing = (o.spacing || 0) + 'px';
  if (o.shadow) { ctx.shadowColor = o.shadow; ctx.shadowBlur = 6 * dpr; ctx.shadowOffsetY = dpr; }
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
  ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
  if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
}

function panel(cx, cy, w, h) {
  if (T.panel) { T.panel(ctx, cx - w / 2, cy - h / 2, w, h); return; }
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.18)'; ctx.shadowBlur = 22 * dpr; ctx.shadowOffsetY = 5 * dpr;
  rrectPath(ctx, cx - w / 2, cy - h / 2, w, h, 14);
  ctx.fillStyle = T.ui.panel; ctx.fill();
  ctx.restore();
  rrectPath(ctx, cx - w / 2, cy - h / 2, w, h, 14);
  ctx.strokeStyle = T.ui.line; ctx.lineWidth = 1; ctx.stroke();
}

function drawHUD() {
  const ui = T.ui, sh = ui.shadow, b = game.brand;
  const pad = Math.max(16, 20 * u);
  const big = clamp(18 * u, 15, 24), small = clamp(11 * u, 10, 14);
  const cx = W / 2, pw = Math.min(W - 32, 440);
  const t1 = clamp(22 * u, 17, 28), t2 = clamp(12 * u, 11, 14);
  const textY = clamp(b.bottom + Math.max(36, H * 0.06), H * 0.3, G * 0.62);

  if (!game.auto) {
    txt(String(Math.round(shown)).padStart(6, '0'), pad, pad + big / 2, big, ui.text, { align: 'left', weight: 700, spacing: 2, shadow: sh, font: MONO });
    txt('WAVE ' + wave + '  ·  ' + mult + '×', pad, pad + big + small + 4, small, ui.muted, { align: 'left', spacing: 2, shadow: sh, font: MONO });
    txt('HIGH ' + String(Math.max(high, score)).padStart(6, '0'), pad, pad + big + small * 2 + 10, small, ui.muted, { align: 'left', spacing: 2, shadow: sh, font: MONO });
  } else if (high > 0) {
    txt('HIGH ' + String(high).padStart(6, '0'), pad, pad + small / 2, small, ui.muted, { align: 'left', spacing: 2, shadow: sh, font: MONO });
  }

  if (hint > 0.02 && game.mode === 'playing') {     // autopilot is defending; any shot takes over
    ctx.globalAlpha = hint;
    ctx.font = t2 + 'px ' + SANS;
    const l2 = T.prompt, l3 = 'Autopilot is defending until you take over.';
    const lines = touchOnly ? 3 : 4, l4 = 'A  S  D  pick a base   ·   P  pause   ·   T  theme';
    let aw = Math.max(ctx.measureText(l2).width, ctx.measureText(l3).width, 250);
    if (lines === 4) { ctx.font = '500 ' + (t2 - 1) + 'px ' + MONO; aw = Math.max(aw, ctx.measureText(l4).width + l4.length); }
    aw = Math.min(W - 24, aw + 56);
    panel(cx, textY + t2 * (lines === 4 ? 2.55 : 1.75), aw, t2 * (lines === 4 ? 8.3 : 6.6));
    ctx.globalAlpha = hint * (0.65 + 0.35 * Math.sin(time * 2.6));
    txt(touchOnly ? 'TAP ANYWHERE TO FIRE' : 'CLICK ANYWHERE TO FIRE', cx, textY, t2 + 1, ui.ptext, { weight: 600, font: SANS, spacing: 4 });
    ctx.globalAlpha = hint;
    txt(l2, cx, textY + t2 * 2.1, t2, ui.pmuted, { font: SANS });
    txt(l3, cx, textY + t2 * 3.7, t2, ui.pmuted, { font: SANS });
    if (lines === 4) txt(l4, cx, textY + t2 * 5.5, t2 - 1, ui.pmuted, { font: MONO, spacing: 1 });
    ctx.globalAlpha = 1;
  }

  if (banner && game.mode === 'playing' && phase === 'wave') {
    ctx.globalAlpha = clamp(Math.min(banner.t * 2, (2.4 - banner.t) * 4), 0, 1) * (1 - hint);
    panel(cx, textY + t1 * 0.6, Math.min(pw, 300), t1 * 3.4);
    txt(banner.title, cx, textY + t1 * 0.1, t1, ui.ptext, { weight: 700, spacing: 6 });
    txt(banner.sub, cx, textY + t1 * 1.3, t2, ui.accent, { spacing: 3, font: MONO });
    ctx.globalAlpha = 1;
  }

  if (tally && !game.auto && game.mode === 'playing') {
    const lh = t2 * 2, label = T.cityLabel || 'CITIES';
    panel(cx, textY + lh * 1.5, pw, lh * 5 + (tally.restored ? lh : 0));
    txt('WAVE ' + wave + ' COMPLETE', cx, textY, t1 * 0.85, ui.ptext, { weight: 700, spacing: 4 });
    txt('INTERCEPTORS  ' + tally.ammoLeft + ' × ' + 5 * mult + '  =  ' + tally.ammoBonus, cx, textY + lh * 1.4, t2, ui.pmuted, { spacing: 1, font: MONO });
    txt(label + '  ' + tally.citiesLeft + ' × ' + 100 * mult + '  =  ' + tally.cityBonus, cx, textY + lh * 2.3, t2, ui.pmuted, { spacing: 1, font: MONO });
    if (tally.restored) txt((T.cityOne || 'CITY') + ' RESTORED', cx, textY + lh * 3.4, t2, ui.gold, { weight: 700, spacing: 3, font: MONO });
  }

  if (!game.auto && game.mode === 'playing' && phase === 'wave' && game.threats.length && game.bases.every(q => !q.alive || q.ammo === 0) && !game.shots.length) {
    ctx.globalAlpha = 0.6 + 0.4 * Math.sin(time * 5);
    txt('OUT OF INTERCEPTORS', cx, textY, t2 + 1, ui.warnText || ui.text, { weight: 700, spacing: 4, shadow: sh, font: MONO });
    ctx.globalAlpha = 1;
  }

  if (game.mode === 'gameover') {
    const lh = t2 * 2;
    panel(cx, textY + lh * 1.6, pw, lh * 5.4);
    txt('GAME OVER', cx, textY, t1, ui.warn, { weight: 700, spacing: 8 });
    txt('SCORE  ' + score, cx, textY + lh * 1.3, t2 + 2, ui.ptext, { weight: 700, spacing: 2, font: MONO });
    const best = score >= high && score > 0;
    txt(best ? 'NEW HIGH SCORE' : 'HIGH  ' + high, cx, textY + lh * 2.2, t2, best ? ui.gold : ui.pmuted, { weight: best ? 700 : 500, spacing: 2, font: MONO });
    if (overTimer > 1.2) {
      ctx.globalAlpha = 0.6 + 0.4 * Math.sin(time * 2.6);
      txt(touchOnly ? 'TAP TO PLAY AGAIN' : 'CLICK TO PLAY AGAIN', cx, textY + lh * 3.3, t2, ui.accent, { weight: 600, font: SANS, spacing: 3 });
      ctx.globalAlpha = 1;
    }
  }

  if (game.paused) {
    ctx.fillStyle = ui.veil || 'rgba(255,255,255,0.35)';
    ctx.fillRect(0, 0, W, G);
    panel(cx, textY + t1 * 0.7, Math.min(pw, 320), t1 * 3.6);
    txt('PAUSED', cx, textY + t1 * 0.2, t1, ui.ptext, { weight: 700, spacing: 8 });
    txt(touchOnly ? 'Tap ▶ to resume' : 'Press ▶ or P to resume', cx, textY + t1 * 1.45, t2, ui.pmuted, { font: SANS });
  }
}

function drawCrosshair() {
  if (game.mode !== 'playing' || !pointer.inside || game.paused) return;
  const { x, y } = pointer, s = Math.max(0.8, u), col = T.ui.cross || T.ui.text;
  ctx.save();
  if (T.ui.shadow) { ctx.shadowColor = T.ui.shadow; ctx.shadowBlur = 4 * dpr; }
  ctx.strokeStyle = col; ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(x, y, 8 * s, 0, TAU);
  ctx.moveTo(x - 15 * s, y); ctx.lineTo(x - 4 * s, y);
  ctx.moveTo(x + 4 * s, y); ctx.lineTo(x + 15 * s, y);
  ctx.moveTo(x, y - 15 * s); ctx.lineTo(x, y - 4 * s);
  ctx.moveTo(x, y + 4 * s); ctx.lineTo(x, y + 15 * s);
  ctx.stroke();
  circ(ctx, x, y, 1.2 * s, col);
  ctx.restore();
}

function render() {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.globalAlpha = 1;
  if (backLayer) ctx.drawImage(backLayer, 0, 0, W, H);
  if (shake > 0) ctx.translate(rand(-shake, shake) * 0.5, rand(-shake, shake) * 0.5);
  if (T.ambient) T.ambient(ctx);
  if (brandSprite) ctx.drawImage(brandSprite.c, brandSprite.x, brandSprite.y, brandSprite.w, brandSprite.h);
  if (T.mid) T.mid(ctx);
  drawTrails();
  for (const f of game.flyers) T.flyer(ctx, f);
  if (frontLayer) ctx.drawImage(frontLayer, 0, frontTop, W, H - frontTop);
  if (T.groundAnim) T.groundAnim(ctx);

  for (const c of game.cities) {
    const x = cityX(c), s = citySprite(c.i, c.alive);
    ctx.drawImage(s.c, x - s.ax, G - s.ay, s.w, s.h);
    if (T.cityAnim) {
      ctx.save(); ctx.translate(x, G); ctx.scale(u * game.cs, -u * game.cs);
      T.cityAnim(ctx, c.i, c);
      ctx.restore();
    }
  }
  const bt = baseTop();
  for (const b of game.bases) {
    const x = baseX(b);
    if (T.drawBase) T.drawBase(ctx, b, x, bt);
    else { ctx.save(); ctx.translate(x, bt); ctx.scale(u, -u); T.base(ctx, b); ctx.restore(); }
  }
  if (T.afterCities) T.afterCities(ctx);
  drawChunks();
  drawPuffs();
  drawBlasts();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  if (T.overlay) T.overlay(ctx);
  if (flash > 0) { ctx.fillStyle = 'rgba(' + (T.fx.flash || '255,255,255') + ',' + flash * 0.28 + ')'; ctx.fillRect(0, 0, W, H); }
  drawHUD();
  drawCrosshair();
  if (fade) {
    ctx.globalAlpha = Math.max(0, fade.a);
    ctx.drawImage(fade.c, 0, 0, W, H);
    ctx.globalAlpha = 1;
  }
}

// ---------------------------------------------------------------- sound (synthesized, off until the visitor turns it on)
let ac = null, master = null, noiseBuf = null, muted = true;
function initAudio() {
  if (muted) return;
  if (!ac) {
    try {
      ac = new (window.AudioContext || window.webkitAudioContext)();
      master = ac.createGain(); master.gain.value = 0.3; master.connect(ac.destination);
      noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    } catch (e) { ac = null; }
  }
  if (ac && ac.state === 'suspended') ac.resume();
}
function tone(f0, f1, dur, type, vol, delay) {
  if (!ac || muted) return;
  const t0 = ac.currentTime + (delay || 0);
  const o = ac.createOscillator(), g = ac.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f0, t0);
  o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g); g.connect(master);
  o.start(t0); o.stop(t0 + dur + 0.02);
}
function noise(dur, freq, vol) {
  if (!ac || muted) return;
  const t0 = ac.currentTime;
  const s = ac.createBufferSource(); s.buffer = noiseBuf;
  const f = ac.createBiquadFilter(); f.type = 'lowpass';
  f.frequency.setValueAtTime(freq, t0);
  f.frequency.exponentialRampToValueAtTime(60, t0 + dur);
  const g = ac.createGain();
  g.gain.setValueAtTime(vol, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  s.connect(f); f.connect(g); g.connect(master);
  s.start(t0); s.stop(t0 + dur);
}
const sfx = {
  launch: fast => tone(fast ? 1100 : 850, 220, fast ? 0.14 : 0.22, 'triangle', 0.16),
  blast: () => noise(0.7, 2200, 0.32),
  pop: () => { tone(500, 1300, 0.08, 'square', 0.04); noise(0.3, 2800, 0.14); },
  boom: hit => { noise(hit ? 1.2 : 0.7, hit ? 900 : 600, hit ? 0.85 : 0.45); tone(110, 40, 0.6, 'sine', 0.35); },
  empty: () => tone(180, 140, 0.08, 'square', 0.05),
  wave: () => { tone(440, 440, 0.12, 'triangle', 0.1); tone(660, 660, 0.2, 'triangle', 0.1, 0.13); },
  clear: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, f, 0.16, 'triangle', 0.09, i * 0.09)),
  over: () => [392, 330, 262, 196].forEach((f, i) => tone(f, f * 0.98, 0.32, 'sawtooth', 0.06, i * 0.24)),
};

// ---------------------------------------------------------------- themes
let themeToken = 0;
async function ensure(meta) {
  if (!loaded[meta.id]) {
    const th = (await meta.load()).default;
    if (!th.ready) { th.ready = true; if (th.init) th.init(); }
    loaded[meta.id] = th;
  }
  return loaded[meta.id];
}
async function setTheme(id, save) {
  const meta = THEMES.find(t => t.id === id) || THEMES[0];
  const token = ++themeToken;
  const next = await ensure(meta);
  if (token !== themeToken) return;                // a newer choice was made while this one loaded
  if (next === T) return;
  const prev = T;
  if (prev && W) {                                 // keep the old frame to fade out of
    const [fc, fx] = mkCanvas(W, H);
    fx.drawImage(canvas, 0, 0, W, H);
    fade = { c: fc, a: 1 };
  }
  T = next;
  game.theme = T;
  const root = document.documentElement.style;
  root.setProperty('--page', T.page);
  root.setProperty('--footer-text', T.footer[0]);
  root.setProperty('--footer-strong', T.footer[1]);
  root.setProperty('--footer-line', T.footer[2]);
  document.getElementById('themeColor').setAttribute('content', T.meta || T.page);
  if (save) { try { localStorage.setItem('z9-theme', T.id); } catch (e) {} }
  themeMenu.querySelectorAll('button').forEach(b => b.setAttribute('aria-checked', String(b.dataset.id === T.id)));
  layout();
  if (prev) remap();
}

// Carry a game in progress over to the new theme's layout.
function remap() {
  const old = game.cities, frac = old.length ? old.filter(c => c.alive).length / old.length : 1;
  const fresh = makeCities();
  let keep = Math.round(frac * fresh.length);
  if (frac > 0) keep = Math.max(1, keep);
  const order = fresh.map((_, k) => k).sort(() => Math.random() - 0.5);
  fresh.forEach(c => { c.alive = false; });
  order.slice(0, keep).forEach(k => { fresh[k].alive = true; });
  game.cities = fresh;
  game.bases.forEach((b, k) => { b.fx = T.baseFx[k]; });
  game.chunks = [];
  game.puffs = [];
  chooseTargets();
  for (const t of game.threats) {                  // re-aim missiles already in flight
    const tp = targetPoint();
    t.pts.push([t.x, t.y]);
    t.tx = tp.x; t.ty = Math.max(tp.y, t.y + 1);
    t.vx = (tp.x - t.x) / Math.max(0.3, (t.ty - t.y) / t.vy);
  }
}

THEMES.forEach(t => {
  const b = document.createElement('button');
  b.type = 'button';
  b.setAttribute('role', 'menuitemradio');
  b.setAttribute('aria-checked', 'false');
  b.dataset.id = t.id;
  b.innerHTML = '<span class="sw" style="background:' + t.swatch + '"></span><span><span class="name">' + t.name + '</span><span class="desc">' + t.desc + '</span></span><svg class="check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5 9-10"/></svg>';
  b.addEventListener('click', () => { setTheme(t.id, true); closeMenu(); });
  themeMenu.appendChild(b);
});

let pausedByMenu = false;
function openMenu() {
  themeMenu.hidden = false;
  themeBtn.setAttribute('aria-expanded', 'true');
  if (game.mode === 'playing' && !game.auto && !game.paused) { pausedByMenu = true; setPaused(true); }
  (themeMenu.querySelector('[aria-checked="true"]') || themeMenu.querySelector('button')).focus();
}
function closeMenu() {
  if (themeMenu.hidden) return;
  themeMenu.hidden = true;
  themeBtn.setAttribute('aria-expanded', 'false');
  if (pausedByMenu) { pausedByMenu = false; setPaused(false); }
}
themeBtn.addEventListener('click', e => { e.stopPropagation(); if (themeMenu.hidden) openMenu(); else closeMenu(); });
document.addEventListener('pointerdown', e => {
  if (!themeMenu.hidden && !themeMenu.contains(e.target) && !themeBtn.contains(e.target)) closeMenu();
}, true);

// ---------------------------------------------------------------- controls
function syncButtons() {
  const playing = game.mode === 'playing' && !game.auto;
  pauseBtn.hidden = !playing;
  pauseBtn.setAttribute('aria-pressed', String(game.paused));
  pauseBtn.setAttribute('aria-label', game.paused ? 'Resume game' : 'Pause game');
  canvas.classList.toggle('aiming', game.mode === 'playing' && !game.paused);
}
function setPaused(p) {
  if (game.mode !== 'playing' || game.auto) return;
  game.paused = p;
  syncButtons();
}
pauseBtn.addEventListener('click', () => { pausedByMenu = false; setPaused(!game.paused); });

try { muted = localStorage.getItem('z9-sound') !== '1'; } catch (e) {}
function syncMute() {
  muteBtn.setAttribute('aria-pressed', String(muted));
  muteBtn.setAttribute('aria-label', muted ? 'Turn sound on' : 'Turn sound off');
}
syncMute();
muteBtn.addEventListener('click', () => {
  muted = !muted;
  syncMute();
  initAudio();
  try { localStorage.setItem('z9-sound', muted ? '0' : '1'); } catch (e) {}
});

canvas.addEventListener('pointermove', e => { pointer.x = e.clientX; pointer.y = e.clientY; pointer.inside = e.pointerType === 'mouse'; });
canvas.addEventListener('pointerleave', () => { pointer.inside = false; });
canvas.addEventListener('pointerdown', e => {
  e.preventDefault();
  initAudio();
  pointer.x = e.clientX; pointer.y = e.clientY; pointer.inside = e.pointerType === 'mouse';
  if (!T) return;
  if (game.paused) { pausedByMenu = false; setPaused(false); return; }
  if (game.mode === 'gameover') { if (overTimer > 1.2) newGame(false); return; }
  if (game.auto) takeover();
  fire(e.clientX, e.clientY);
});
window.addEventListener('keydown', e => {
  const k = e.key.toLowerCase();
  if (k === 'escape' && !themeMenu.hidden) { closeMenu(); themeBtn.focus(); return; }
  if (e.target && e.target.closest && e.target.closest('.menu')) return;
  if (e.metaKey || e.ctrlKey || e.altKey || !T) return;
  if (k === 't') { setTheme(THEMES[(THEMES.findIndex(t => t.id === T.id) + 1) % THEMES.length].id, true); return; }
  if (game.mode !== 'playing') return;
  if ((k === 'p' || k === 'escape') && !game.auto) { setPaused(!game.paused); e.preventDefault(); return; }
  const idx = { a: 0, s: 1, d: 2, 1: 0, 2: 1, 3: 2 }[k];
  if (idx != null && pointer.inside && !game.paused) {
    initAudio();
    if (game.auto) takeover();
    fire(pointer.x, pointer.y, idx);
    e.preventDefault();
  }
});
document.addEventListener('visibilitychange', () => { if (document.hidden) setPaused(true); });
let resizeTimer = 0;
window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(layout, 60); });

// Canvas text needs the web fonts loaded explicitly; rebuild the cached art when they arrive.
if (document.fonts && document.fonts.load) {
  Promise.all(['600 20px "Cormorant Garamond"', '20px "Archivo Black"', '500 14px "JetBrains Mono"', '700 14px "JetBrains Mono"', '600 14px Inter', '700 20px Cinzel'].map(f => document.fonts.load(f).catch(() => {})))
    .then(() => { if (T) { if (T.fontsReady) T.fontsReady(); rebuild(); } });
}

// ---------------------------------------------------------------- start
(async () => {
  let start = 'daybreak';
  try { start = localStorage.getItem('z9-theme') || start; } catch (e) {}
  const qp = new URLSearchParams(location.search).get('theme');
  if (qp && THEMES.some(t => t.id === qp)) start = qp;
  if (!THEMES.some(t => t.id === start)) start = 'daybreak';

  logoImg = new Image();
  logoImg.onload = buildBrand;
  logoImg.src = 'logo.png';

  await setTheme(start, false);
  newGame(true);                                   // the game is live as soon as the page loads
  if (new URLSearchParams(location.search).has('debug')) window.__z9 = () => ({ mode: game.mode, auto: game.auto, dead: game.cities.filter(c => !c.alive).length, wave, score, low: game.lowFx });

  let last = performance.now(), slow = 0;
  function frame(now) {
    const raw = (now - last) / 1000, dt = Math.min(0.05, raw);
    last = now;
    // If frames stay slow for a while, ask themes to drop their optional effects.
    slow = raw > 0.03 && raw < 0.2 ? slow + 1 : Math.max(0, slow - 2);
    if (slow > 90) game.lowFx = true;
    if (fade) { fade.a -= dt * 2.4; if (fade.a <= 0) fade = null; }
    if (!game.paused) update(dt);
    render();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // Fetch the other themes in the background so switching is instant.
  const idle = window.requestIdleCallback || (fn => setTimeout(fn, 1500));
  idle(async () => {
    for (const t of THEMES) { try { await ensure(t); } catch (e) {} }
  });
})();
