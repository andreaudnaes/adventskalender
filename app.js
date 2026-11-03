// =============================================================
//  Adventskalender
// =============================================================

// Hvilket spill som ligger bak hver luke
const GAMES = {
  1: 'Ordgjetting', 2: 'Zip', 3: 'Fire grupper', 4: 'Emoji-gåte',
  5: 'Nonogram', 6: 'Ordjakt', 7: 'Bikuben', 8: 'Sudoku',
  9: 'Ordgjetting', 10: 'Zip', 11: 'Emoji-gåte', 12: 'Fire grupper',
  13: 'Stort nonogram', 14: 'Ordjakt', 15: 'Sudoku', 16: 'Bikuben',
  17: 'Emoji-gåte', 18: 'Ordgjetting', 19: 'Zip', 20: 'Dobbel runde: fire grupper',
  21: 'Nonogram', 22: 'Sudoku', 23: 'Ordjakt', 24: 'Finalen'
};

// Plassering på forsiden: [luke, kolonne, rad]
const LAYOUT = [
  [7, '1', '1'], [15, '2', '1'], [3, '3', '1 / span 2'], [20, '4', '1'],
  [11, '1', '2'], [1, '2', '2'], [18, '4', '2 / span 2'],
  [9, '1 / span 2', '3'], [22, '3', '3'],
  [5, '1', '4 / span 2'], [13, '2', '4'], [24, '3 / span 2', '4'],
  [17, '2', '5'], [2, '3', '5'], [10, '4', '5'],
  [19, '1', '6'], [6, '2 / span 2', '6'], [14, '4', '6 / span 2'],
  [23, '1', '7'], [12, '2', '7 / span 2'], [4, '3', '7'],
  [16, '1', '8'], [21, '3', '8'], [8, '4', '8']
];

const TONES = ['#6E1A2D', '#64172A', '#761F33'];
const YEAR = 2026;

// -------------------------------------------------------------
//  Dato: hvor mange luker er åpne i dag (norsk tid)?
//  For testing: legg til ?test=6 i adressen for å late som det er 6. desember.
//  HUSK: sett TEST_MODE til false før kalenderen sendes!
// -------------------------------------------------------------
const TEST_MODE = true;

function unlockedDays() {
  if (TEST_MODE) {
    const t = parseInt(new URLSearchParams(location.search).get('test'), 10);
    if (t >= 0 && t <= 24) return t;
  }
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Oslo', year: 'numeric', month: 'numeric', day: 'numeric'
  }).formatToParts(new Date());
  const get = (type) => parseInt(parts.find((p) => p.type === type).value, 10);
  const y = get('year'), m = get('month'), d = get('day');
  if (y > YEAR) return 24;
  if (y < YEAR || m < 12) return 0;
  return Math.min(d, 24);
}

// -------------------------------------------------------------
const $ = (id) => document.getElementById(id);
const today = unlockedDays();
let busy = false;
let toastTimer;

const STAR = '<svg class="star" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l2.6 6.9L22 9.3l-5.8 4.6L18.2 21 12 17l-6.2 4 2-7.1L2 9.3l7.4-.4z"/></svg>';
const LOCK = '<svg class="lock" viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';

function buildGrid() {
  const grid = $('grid');
  grid.innerHTML = '';
  LAYOUT.forEach(([n, col, row], i) => {
    const locked = n > today;
    const big = col.includes('span') || row.includes('span');

    const slot = document.createElement('div');
    slot.className = 'slot';
    if (big) slot.classList.add('big');
    if (locked) slot.classList.add('locked');
    if (n === today) slot.classList.add('today');
    slot.style.gridColumn = col;
    slot.style.gridRow = row;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'door-btn';
    btn.setAttribute('aria-label', locked
      ? `Luke ${n}, låst til ${n}. desember`
      : `Luke ${n}, ${GAMES[n]}`);

    const inner = document.createElement('span');
    inner.className = 'inner';
    inner.setAttribute('aria-hidden', 'true');

    const door = document.createElement('span');
    door.className = 'door';
    if (n < today) door.classList.add('ajar');
    door.style.background = TONES[i % TONES.length];
    door.innerHTML = (n === 24 ? STAR : '') + `<span class="num">${n}</span>` + (locked ? LOCK : '');

    btn.append(inner, door);
    btn.addEventListener('click', () => pick(n, slot, door));
    slot.append(btn);
    grid.append(slot);
  });

  $('today-label').textContent = today === 0
    ? 'Første luke åpner 1. desember'
    : `I dag: ${today}. desember`;
  $('progress-label').textContent = `${today} av 24 luker klare`;
  requestAnimationFrame(() => { $('bar-fill').style.width = `${(today / 24) * 100}%`; });
}

function pick(n, slot, door) {
  if (busy) return;
  if (n > today) {
    slot.classList.remove('shake');
    void slot.offsetWidth; // start animasjonen på nytt
    slot.classList.add('shake');
    showToast(`Tålmodighet! Luke ${n} åpner ${n}. desember`);
    return;
  }
  busy = true;
  slot.classList.remove('today');
  door.classList.remove('ajar');
  door.classList.add('open');
  setTimeout(() => { location.hash = `luke-${n}`; }, 950);
}

function showToast(text) {
  const t = $('toast');
  t.textContent = text;
  t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.hidden = true; }, 2200);
}

function openGame(n) {
  $('game-date').textContent = `Luke ${n} · ${n}. desember`;
  $('game-day').textContent = n;
  $('game-name').textContent = GAMES[n];
  $('home').hidden = true;
  $('game').hidden = false;
  window.scrollTo(0, 0);
}

function showHome() {
  busy = false;
  $('game').hidden = true;
  $('home').hidden = false;
  buildGrid();
}

function route() {
  const m = location.hash.match(/^#luke-(\d+)$/);
  const n = m ? parseInt(m[1], 10) : 0;
  if (n >= 1 && n <= today) {
    openGame(n);
  } else {
    if (location.hash) history.replaceState(null, '', location.pathname + location.search);
    showHome();
  }
}

$('back').addEventListener('click', () => {
  history.replaceState(null, '', location.pathname + location.search);
  showHome();
});
window.addEventListener('hashchange', route);
route();
