// =============================================================
//  Adventskalender
// =============================================================

// Hvilket spill som ligger bak hver luke
const GAMES = {
  1: 'Ordgjetting', 2: 'Zip', 3: 'Connies', 4: 'Pyralinks',
  5: 'Nonogram', 6: 'Ordjakt', 7: 'Bikuben', 8: 'Sudoku',
  9: 'Ordgjetting', 10: 'Zip', 11: 'Pyralinks', 12: 'Connies',
  13: 'Stort nonogram', 14: 'Ordjakt', 15: 'Sudoku', 16: 'Bikuben',
  17: 'Pyralinks', 18: 'Ordgjetting', 19: 'Zip', 20: 'Dobbel runde: Connies',
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

// Innholdet i hver luke. Svarene er kodet (base64) så de ikke står i klartekst.
const PUZZLES = {
  1: { type: 'ordgjetting', answer: 'S0FLQU8=' },
  2: {
    type: 'zip',
    size: 6,
    numbers: [[5, 3, 1], [4, 1, 2], [1, 4, 3], [3, 1, 4], [2, 2, 5], [1, 2, 6], [1, 0, 7]]
  },
  4: {
    type: 'pyralinks',
    data: 'WyJqdWxlIiwgImJvcmQiLCAidHJlIiwgInNrcml2ZSIsICJ0ZW5uaXMiLCAia2FudCIsICJza28iLCAiZmVpbCIsICJib2siLCAiYmFuZSIsICJyYWNrZXQiLCAiaW5lIiwgInN0ZWluIiwgImxlIiwgImxpc3NlIl0='
  },
  5: {
    type: 'nonogram',
    data: 'WyIuVS4uLi4uLi4uLi4uUlIiLCAiVVVVLi4uLi4uLi4uUlJMIiwgIi5VLi5ISC4uLi4uUlIuTCIsICIuLi5ISEhILi4uUlIuLkwiLCAiLi4uLkZGLi4uUlIuLi5MIiwgIi4uLi5GQi4uUlIuLi4uTCIsICIuLi5CQkJCUlIuLi4uLkwiLCAiLi5CQkJCLi4uLi4uLi5MIiwgIi4uLkJCQi4uLi4uLi4uTCIsICJXV1dXV1dXV1dXV1dXLkwiLCAiLlcuV1dXV1dXVy5XLi5MIiwgIi4uV1dXV1dXV1dXLi4uTCIsICJTUy4uU1NTLi5TUy4uTC4iLCAiLlNTUy4uLlNTUy5TUy5TIiwgIlNTU1NTU1NTU1NTU1NTUyJd',
    colors: {
      U: '#F6D27A', // sol
      H: '#E3B341', // sydvest
      F: '#F0C9A0', // ansikt
      B: '#D99A2B', // regnjakke
      R: '#8B5A2B', // fiskestang
      L: '#F3E6D3', // snøre
      W: '#B5713A', // båt
      S: '#3E7CB1'  // sjø
    }
  }
};

// Belønningen som vises når luken er løst
const REWARDS = {
  1: {
    title: 'En liten hilsen',
    text: '[Skriv meldingen din til luke 1 her]'
  },
  2: {
    title: 'En liten hilsen',
    text: '[Skriv meldingen din til luke 2 her]'
  },
  4: {
    title: 'En liten hilsen',
    text: '[Skriv meldingen din til luke 4 her]'
  },
  5: {
    title: 'Du klarte det \u2665\uFE0E',
    text: 'Knut på fisketur'
  }
};

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

let cleanup = null;
const PLACEHOLDER = $('game-area').innerHTML;

function openGame(n) {
  $('game-date').textContent = `Luke ${n} · ${n}. desember`;
  $('game-day').textContent = n;
  $('game-name').textContent = GAMES[n];

  const area = $('game-area');
  const puzzle = PUZZLES[n];
  const game = puzzle && window.Games && window.Games[puzzle.type];
  if (cleanup) { cleanup(); cleanup = null; }
  $('game').classList.toggle('compact', !!game);
  if (game) {
    area.className = 'game-area playing';
    cleanup = game.mount(area, puzzle, n, () => showReward(n));
  } else {
    area.className = 'game-area';
    area.innerHTML = PLACEHOLDER;
  }

  $('home').hidden = true;
  $('game').hidden = false;
  window.scrollTo(0, 0);
}

function showReward(n) {
  const r = REWARDS[n];
  if (!r) return;
  const card = document.createElement('div');
  card.className = 'reward';
  card.innerHTML = `
    <svg class="reward-star" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l2.6 6.9L22 9.3l-5.8 4.6L18.2 21 12 17l-6.2 4 2-7.1L2 9.3l7.4-.4z"/></svg>
    <p class="reward-title"></p>
    <p class="reward-text"></p>`;
  card.querySelector('.reward-title').textContent = r.title;
  card.querySelector('.reward-text').textContent = r.text;
  $('game-area').append(card);
  setTimeout(() => card.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50);
}

function showHome() {
  busy = false;
  if (cleanup) { cleanup(); cleanup = null; }
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

// -------------------------------------------------------------
//  Kun for testing: knapp for å starte på nytt.
//  Vises bare når TEST_MODE er på og adressen har ?test=
//  Forsvinner automatisk når TEST_MODE settes til false.
// -------------------------------------------------------------
if (TEST_MODE && new URLSearchParams(location.search).has('test')) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'test-reset';
  document.body.append(btn);

  const label = () => {
    const m = location.hash.match(/^#luke-(\d+)$/);
    btn.textContent = m ? `Test: start luke ${m[1]} på nytt` : 'Test: nullstill alle luker';
  };

  btn.addEventListener('click', () => {
    const m = location.hash.match(/^#luke-(\d+)$/);
    try {
      if (m) {
        localStorage.removeItem(`advent-${m[1]}`);
      } else {
        Object.keys(localStorage)
          .filter((k) => k.startsWith('advent-'))
          .forEach((k) => localStorage.removeItem(k));
      }
    } catch (e) { /* ignorer */ }
    if (m) openGame(parseInt(m[1], 10));
    else showToast('Alle luker er nullstilt');
  });

  window.addEventListener('hashchange', label);
  $('back').addEventListener('click', label);
  label();
}

route();
