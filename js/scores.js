// Arcade high-score table: the top five scores, each with a three-letter tag.
//
// Where scores live
//   scores.json   the official table, a plain file in the repo. Edit it by hand to add or remove entries.
//   this device   every score a visitor enters is also saved in their browser, so it shows up on their next visit.
//   ENDPOINT      optional shared back end. Leave it empty on plain GitHub Pages. When set, the table is
//                 read from it and new scores are POSTed to it, so every visitor sees the same board.
//                 It must answer GET with {"scores":[{"n":"ABC","s":1234}, ...]} and accept
//                 POST of {"n":"ABC","s":1234} sent as text/plain.
export const ENDPOINT = '';

const KEY = 'z9-scores', TAG_KEY = 'z9-tag', SIZE = 5;
const FALLBACK = [{ n: 'Z9I', s: 5000 }, { n: 'WYO', s: 4000 }, { n: 'LAR', s: 3000 }, { n: 'SNO', s: 2000 }, { n: 'ELK', s: 1000 }];
const BLOCK = ['ASS', 'SEX', 'FAG', 'KKK', 'NAZ', 'FUK', 'DIK', 'CUM', 'TIT', 'WTF', 'GAY'];
const RANK = ['1ST', '2ND', '3RD', '4TH', '5TH'];

const $ = id => document.getElementById(id);
const root = $('arcade');
let base = FALLBACK.slice();      // official table (file or endpoint)
let table = [];
let st = null;                    // open dialog state, or null
const listeners = [];

const read = k => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } };
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };

function clean(list) {
  const seen = new Set(), out = [];
  for (const e of Array.isArray(list) ? list : []) {
    if (!e || typeof e.n !== 'string' || !/^[A-Za-z0-9]{3}$/.test(e.n) || !Number.isFinite(+e.s) || +e.s <= 0) continue;
    const x = { n: e.n.toUpperCase(), s: Math.floor(+e.s), d: typeof e.d === 'string' ? e.d.slice(0, 10) : '' };
    const key = x.n + x.s + x.d;
    if (!seen.has(key)) { seen.add(key); out.push(x); }
  }
  return out.sort((a, b) => b.s - a.s).slice(0, SIZE);
}
function rebuild() {
  table = clean(ENDPOINT ? base : base.concat(read(KEY) || []));
  listeners.forEach(f => f());
}

export const best = () => (table[0] ? table[0].s : 0);
export const qualifies = s => s > 0 && (table.length < SIZE || s > table[table.length - 1].s);
export const onChange = f => listeners.push(f);
export const isOpen = () => !!st;
export const entering = () => !!st && st.mode === 'entry';

export async function load() {
  rebuild();
  try {
    const res = await fetch(ENDPOINT || 'scores.json?' + Date.now(), { cache: 'no-store' });
    if (res.ok) { const j = await res.json(); base = clean(j.scores || j); if (!base.length && !ENDPOINT) base = FALLBACK.slice(); }
  } catch (e) { /* offline: keep what we have */ }
  rebuild();
}

function save(n, s) {
  const e = { n, s, d: new Date().toISOString().slice(0, 10) };
  const mine = read(KEY) || [];
  mine.push(e);
  write(KEY, clean(mine));
  write(TAG_KEY, n);
  if (ENDPOINT) {
    base = clean(base.concat([e]));
    fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify({ n, s }) }).then(load).catch(() => {});
  }
  rebuild();
  return table.findIndex(x => x.n === n && x.s === s);
}

// ---------------------------------------------------------------- dialog
const pad = n => String(n).padStart(6, '0');
const A = 65;

function rows(hi) {
  let h = '';
  for (let i = 0; i < SIZE; i++) {
    const e = table[i];
    h += '<li class="r' + (i + 1) + (i === hi ? ' new' : '') + '"><span>' + RANK[i] + '</span><span>' + (e ? e.n : '---') + '</span><span>' + (e ? pad(e.s) : '000000') + '</span></li>';
  }
  return '<ol class="arc-table" aria-label="Top five scores">' + h + '</ol>';
}

function render() {
  const s = st;
  let h = '<h2 class="arc-title" id="arcTitle">' + (s.mode === 'view' ? 'HIGH SCORES' : s.mode === 'entry' ? 'NEW HIGH SCORE' : 'GAME OVER') + '</h2>';
  if (s.mode !== 'view') h += '<p class="arc-line">YOUR SCORE <b>' + pad(s.score) + '</b></p>';
  if (s.mode === 'entry') {
    h += '<p class="arc-line dim">ENTER YOUR INITIALS</p><div class="arc-initials" role="group" aria-label="Initials">';
    for (let i = 0; i < 3; i++) {
      h += '<div class="arc-col"><button type="button" class="arc-arrow" data-i="' + i + '" data-d="1" aria-label="Letter ' + (i + 1) + ' up">&#9650;</button>' +
        '<span class="arc-ch" id="ch' + i + '"></span>' +
        '<button type="button" class="arc-arrow" data-i="' + i + '" data-d="-1" aria-label="Letter ' + (i + 1) + ' down">&#9660;</button></div>';
    }
    h += '</div><p class="arc-err" id="arcErr" role="alert"></p><button type="button" class="arc-btn" id="arcOk">OK</button>';
  } else {
    h += rows(s.rank);
    h += s.mode === 'view' ? '<button type="button" class="arc-btn" id="arcGo">CLOSE</button>' : '<button type="button" class="arc-btn" id="arcGo">PLAY AGAIN</button>';
    if (!ENDPOINT) h += '<p class="arc-note">Scores are saved on this device.</p>';
  }
  root.innerHTML = '<div class="arc-card" tabindex="-1">' + h + '</div>';
  root.hidden = false;
  if (s.mode === 'entry') paint();
  const go = $('arcGo');
  if (go) go.addEventListener('click', primary);
  const ok = $('arcOk');
  if (ok) ok.addEventListener('click', submit);
  root.querySelectorAll('.arc-arrow').forEach(b => b.addEventListener('click', () => { st.pos = +b.dataset.i; cycle(+b.dataset.d); }));
  root.querySelectorAll('.arc-ch').forEach((c, i) => c.addEventListener('click', () => { st.pos = i; paint(); }));
  (ok || go).focus({ preventScroll: true });
}

function paint() {
  st.letters.forEach((c, i) => { const el = $('ch' + i); el.textContent = c; el.classList.toggle('cur', i === st.pos); });
  const e = $('arcErr'); if (e) e.textContent = '';
}
function cycle(d) {
  const c = st.letters[st.pos].charCodeAt(0) - A;
  st.letters[st.pos] = String.fromCharCode(A + ((c + d + 26) % 26));
  paint();
}
function submit() {
  const tag = st.letters.join('');
  if (BLOCK.includes(tag)) { $('arcErr').textContent = 'TRY ANOTHER'; return; }
  st.rank = save(tag, st.score);
  st.mode = 'over';
  render();
}
function primary() {
  const done = st.done;
  const mode = st.mode;
  close();
  if (done) done(mode);
}
function close() { st = null; root.hidden = true; root.innerHTML = ''; }

// Game over: ask for initials if the score made the board, then show the table.
export function showGameOver(score, done) {
  const last = read(TAG_KEY);
  st = { mode: qualifies(score) ? 'entry' : 'over', score, rank: -1, pos: 0, letters: (typeof last === 'string' && /^[A-Z]{3}$/.test(last) ? last : 'AAA').split(''), done };
  render();
}
export function showTable(done) {
  st = { mode: 'view', score: 0, rank: -1, done };
  render();
}
export function hide() { if (st) close(); }

document.addEventListener('keydown', e => {
  if (!st) return;
  const k = e.key;
  if (st.mode === 'entry') {
    if (/^[a-zA-Z]$/.test(k) && !e.ctrlKey && !e.metaKey && !e.altKey) { st.letters[st.pos] = k.toUpperCase(); st.pos = Math.min(2, st.pos + 1); paint(); }
    else if (k === 'Backspace') { st.pos = Math.max(0, st.pos - 1); paint(); }
    else if (k === 'ArrowUp') cycle(1);
    else if (k === 'ArrowDown') cycle(-1);
    else if (k === 'ArrowLeft') { st.pos = Math.max(0, st.pos - 1); paint(); }
    else if (k === 'ArrowRight') { st.pos = Math.min(2, st.pos + 1); paint(); }
    else if (k === 'Enter') submit();
    else if (k !== 'Tab') return;
    if (k !== 'Tab') e.preventDefault();
  } else if (k === 'Escape' && st.mode === 'view') { e.preventDefault(); primary(); }
  else if (k === 'Enter' && document.activeElement && document.activeElement.id !== 'arcGo') { e.preventDefault(); primary(); }
  e.stopPropagation();
}, true);
