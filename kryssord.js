// =============================================================
//  Minikryssord (inspirert av NYT Mini)
//  Data (base64-JSON): { grid: ["ABCDE", "#...", ...], across: {1: "hint"}, down: {1: "hint"} }
//  '#' er en svart rute.
// =============================================================
window.Games = window.Games || {};

window.Games.kryssord = (function () {
  const ROWS = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', 'Å'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Ø', 'Æ'],
    ['Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACK']
  ];
  const BACK_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 5H9l-6 7 6 7h12z"/><path d="M17 9l-6 6M11 9l6 6"/></svg>';
  const ARROW_L = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>';
  const ARROW_R = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>';
  const decode = (s) => JSON.parse(decodeURIComponent(escape(atob(s))));
  const DIR_NAME = { a: 'Vannrett', d: 'Loddrett' };

  // Finn nummer og ord ut fra rutenettet
  function analyse(data) {
    const g = data.grid.map((r) => r.toUpperCase());
    const R = g.length, C = g[0].length;
    const black = (r, c) => r < 0 || c < 0 || r >= R || c >= C || g[r][c] === '#';
    const num = {};
    const words = []; // { dir, n, cells:[idx], clue }
    let n = 0;
    for (let r = 0; r < R; r++) {
      for (let c = 0; c < C; c++) {
        if (black(r, c)) continue;
        const startA = black(r, c - 1) && !black(r, c + 1);
        const startD = black(r - 1, c) && !black(r + 1, c);
        if (!startA && !startD) continue;
        n++;
        num[r * C + c] = n;
        if (startA && data.across[n]) {
          const cells = [];
          for (let k = c; !black(r, k); k++) cells.push(r * C + k);
          words.push({ dir: 'a', n, cells, clue: data.across[n] });
        }
        if (startD && data.down[n]) {
          const cells = [];
          for (let k = r; !black(k, c); k++) cells.push(k * C + c);
          words.push({ dir: 'd', n, cells, clue: data.down[n] });
        }
      }
    }
    // Vannrett først, så loddrett (slik som i NYT)
    words.sort((a, b) => (a.dir === b.dir ? a.n - b.n : a.dir === 'a' ? -1 : 1));
    const solution = [];
    for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) solution.push(black(r, c) ? null : g[r][c]);
    return { R, C, num, words, solution };
  }

  function mount(root, puzzle, day, onDone) {
    const data = decode(puzzle.data);
    const { R, C, num, words, solution } = analyse(data);
    const storeKey = `advent-${day}`;
    let saved = {};
    try { saved = JSON.parse(localStorage.getItem(storeKey)) || {}; } catch (e) { saved = {}; }

    const letters = solution.map((s, i) => (s === null ? null : (saved.letters && saved.letters[i]) || ''));
    let finished = !!saved.done;
    let wrongShown = false;

    const wordOf = (i, dir) => words.find((w) => w.dir === dir && w.cells.includes(i));
    let cur = words[0].cells[0];
    let dir = words[0].dir;

    root.innerHTML = `
      <div class="kr">
        <div class="kr-clue">
          <button type="button" class="kr-nav prev" aria-label="Forrige hint">${ARROW_L}</button>
          <p class="kr-clue-text"><b class="kr-clue-num"></b><span></span></p>
          <button type="button" class="kr-nav next" aria-label="Neste hint">${ARROW_R}</button>
        </div>
        <div class="kr-grid" role="grid" aria-label="Kryssord" style="--cols:${C}"></div>
        <p class="kr-msg" role="status" aria-live="polite"></p>
        <div class="wg-keys kr-keys"></div>
        <div class="kr-lists">
          <div><h3>Vannrett</h3><ol class="kr-list" data-dir="a"></ol></div>
          <div><h3>Loddrett</h3><ol class="kr-list" data-dir="d"></ol></div>
        </div>
      </div>`;
    const gridEl = root.querySelector('.kr-grid');
    const clueNum = root.querySelector('.kr-clue-num');
    const clueText = root.querySelector('.kr-clue-text span');
    const msg = root.querySelector('.kr-msg');
    const keys = root.querySelector('.kr-keys');

    // Rutenett
    const cells = solution.map((s, i) => {
      const el = document.createElement('div');
      el.className = 'kr-cell' + (s === null ? ' black' : '');
      el.setAttribute('role', 'gridcell');
      if (s !== null) {
        if (num[i]) { const t = document.createElement('span'); t.className = 'kr-num'; t.textContent = num[i]; el.append(t); }
        const l = document.createElement('span'); l.className = 'kr-letter'; el.append(l);
        el.addEventListener('click', () => {
          if (finished) return;
          if (i === cur) { if (wordOf(i, dir === 'a' ? 'd' : 'a')) dir = dir === 'a' ? 'd' : 'a'; }
          else { cur = i; if (!wordOf(i, dir)) dir = dir === 'a' ? 'd' : 'a'; }
          draw();
        });
      }
      gridEl.append(el);
      return el;
    });

    // Hintlister
    const listItems = new Map();
    words.forEach((w) => {
      const li = document.createElement('li');
      li.innerHTML = `<b>${w.n}</b><span></span>`;
      li.querySelector('span').textContent = w.clue;
      li.addEventListener('click', () => { if (finished) return; select(w); });
      root.querySelector(`.kr-list[data-dir="${w.dir}"]`).append(li);
      listItems.set(w, li);
    });

    // Tastatur
    ROWS.forEach((r) => {
      const row = document.createElement('div');
      row.className = 'wg-keyrow';
      r.forEach((k) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'wg-key';
        if (k === 'BACK') { b.innerHTML = BACK_ICON; b.classList.add('wide'); b.setAttribute('aria-label', 'Slett'); }
        else b.textContent = k;
        b.addEventListener('click', () => press(k));
        row.append(b);
      });
      keys.append(row);
    });

    root.querySelector('.kr-nav.prev').addEventListener('click', () => step(-1));
    root.querySelector('.kr-nav.next').addEventListener('click', () => step(1));

    function select(w, toFirstEmpty = true) {
      dir = w.dir;
      cur = toFirstEmpty ? (w.cells.find((i) => !letters[i]) ?? w.cells[0]) : w.cells[0];
      draw();
    }

    function step(d) {
      const w = wordOf(cur, dir);
      const k = words.indexOf(w);
      select(words[(k + d + words.length) % words.length]);
    }

    function save() {
      try { localStorage.setItem(storeKey, JSON.stringify({ letters, done: finished })); } catch (e) { /* ignorer */ }
    }

    function draw() {
      const w = wordOf(cur, dir);
      cells.forEach((el, i) => {
        if (solution[i] === null) return;
        el.querySelector('.kr-letter').textContent = letters[i] || '';
        el.classList.toggle('word', !finished && w && w.cells.includes(i));
        el.classList.toggle('cur', !finished && i === cur);
      });
      if (w) {
        clueNum.textContent = `${w.n}${w.dir === 'a' ? 'V' : 'L'}`;
        clueNum.title = DIR_NAME[w.dir];
        clueText.textContent = w.clue;
      }
      listItems.forEach((li, x) => {
        li.classList.toggle('active', x === w);
        li.classList.toggle('filled', x.cells.every((i) => letters[i]));
      });
    }

    function nextEmptyAfter(w, from) {
      const k = w.cells.indexOf(from);
      for (let j = k + 1; j < w.cells.length; j++) if (!letters[w.cells[j]]) return w.cells[j];
      for (let j = 0; j < k; j++) if (!letters[w.cells[j]]) return w.cells[j];
      return null;
    }

    function checkDone() {
      if (letters.some((l, i) => solution[i] !== null && !l)) { wrongShown = false; return; }
      if (letters.every((l, i) => solution[i] === null || l === solution[i])) {
        finished = true;
        save();
        msg.textContent = '';
        win(true);
      } else if (!wrongShown) {
        wrongShown = true;
        msg.textContent = 'Noe er ikke helt riktig ennå';
        gridEl.classList.remove('shake'); void gridEl.offsetWidth; gridEl.classList.add('shake');
      }
    }

    function win(animate) {
      keys.classList.add('done');
      root.querySelector('.kr').classList.add('solved');
      draw();
      if (animate) {
        cells.forEach((el, i) => { if (solution[i] !== null) el.style.animationDelay = `${(Math.floor(i / C) + (i % C)) * 60}ms`; });
        gridEl.classList.add('win');
        setTimeout(() => onDone(true), 900);
      } else onDone(true);
    }

    function press(k) {
      if (finished) return;
      const w = wordOf(cur, dir);
      if (k === 'BACK') {
        if (letters[cur]) letters[cur] = '';
        else {
          const p = w.cells.indexOf(cur);
          if (p > 0) { cur = w.cells[p - 1]; letters[cur] = ''; }
        }
        msg.textContent = '';
        save(); draw(); return;
      }
      letters[cur] = k;
      // Videre: neste tomme rute i ordet, ellers neste ord med tomme ruter
      const nxt = nextEmptyAfter(w, cur);
      if (nxt !== null) cur = nxt;
      else {
        const k0 = words.indexOf(w);
        for (let j = 1; j <= words.length; j++) {
          const w2 = words[(k0 + j) % words.length];
          const e = w2.cells.find((i) => !letters[i]);
          if (e !== undefined) { dir = w2.dir; cur = e; break; }
        }
        if (letters.every((l, i) => solution[i] === null || l)) {
          // alt er fylt: bli stående på siste rute i ordet
          const p = w.cells.indexOf(cur);
          if (p < w.cells.length - 1) cur = w.cells[p + 1];
        }
      }
      save(); draw(); checkDone();
    }

    function move(dr, dc) {
      const d2 = dr ? 'd' : 'a';
      if (dir !== d2 && wordOf(cur, d2)) { dir = d2; draw(); return; }
      let r = Math.floor(cur / C), c = cur % C;
      for (;;) {
        r += dr; c += dc;
        if (r < 0 || c < 0 || r >= R || c >= C) return;
        if (solution[r * C + c] !== null) { cur = r * C + c; draw(); return; }
      }
    }

    function onKey(e) {
      if (finished || e.metaKey || e.ctrlKey || e.altKey) return;
      if (!document.body.contains(root) || !root.querySelector('.kr')) return;
      if (e.key === 'Backspace') { e.preventDefault(); press('BACK'); }
      else if (e.key === 'Tab') { e.preventDefault(); step(e.shiftKey ? -1 : 1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); move(0, -1); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); move(0, 1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1, 0); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); move(1, 0); }
      else if (/^[a-zæøå]$/i.test(e.key)) press(e.key.toUpperCase());
    }
    document.addEventListener('keydown', onKey);

    draw();
    if (finished) win(false);
    return () => document.removeEventListener('keydown', onKey);
  }

  // Kun for testing: lagret tilstand som om kryssordet er løst
  const solvedState = (puzzle) => {
    const { solution } = analyse(decode(puzzle.data));
    return { letters: solution, done: true };
  };

  return { mount, solvedState };
})();
