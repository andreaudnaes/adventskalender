// =============================================================
//  Nonogram med tre liv
//  Bildet lagres kodet (base64) slik at det ikke står i klartekst.
//  Hver bokstav i bildet er en farge som vises når det er løst.
// =============================================================
window.Games = window.Games || {};

window.Games.nonogram = (function () {
  const LIVES = 3;
  const HEART = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7.5-4.6-9.6-9.3C.9 8.3 3 4.5 6.7 4.5c2.1 0 3.6 1.2 5.3 3 1.7-1.8 3.2-3 5.3-3 3.7 0 5.8 3.8 4.3 7.2C19.5 16.4 12 21 12 21z"/></svg>';

  const decode = (s) => JSON.parse(decodeURIComponent(escape(atob(s))));

  function clues(line) {
    const out = [];
    let run = 0;
    line.forEach((v) => {
      if (v) run++;
      else if (run) { out.push(run); run = 0; }
    });
    if (run) out.push(run);
    return out.length ? out : [0];
  }

  function mount(root, puzzle, day, onDone) {
    const pic = decode(puzzle.data);
    const n = pic.length;
    const sol = pic.map((r) => r.split('').map((ch) => (ch === '.' ? 0 : 1)));
    const rowClues = sol.map(clues);
    const colClues = sol[0].map((_, j) => clues(sol.map((r) => r[j])));
    const total = sol.flat().filter(Boolean).length;
    const storeKey = `advent-${day}`;

    // state: 0 = tom, 1 = fylt, 2 = kryss, 3 = feil (rødt kryss)
    let state, lives, solved;
    function fresh() {
      state = Array.from({ length: n }, () => Array(n).fill(0));
      lives = LIVES;
      solved = false;
    }
    fresh();
    try {
      const s = JSON.parse(localStorage.getItem(storeKey));
      if (s && s.state && s.state.length === n) { state = s.state; lives = s.lives; solved = !!s.solved; }
    } catch (e) { /* ignorer */ }

    const save = () => {
      try { localStorage.setItem(storeKey, JSON.stringify({ state, lives, solved })); } catch (e) { /* ignorer */ }
    };

    let mode = 1; // 1 = fyll, 2 = kryss

    // ---------- Oppsett ----------
    root.innerHTML = `
      <div class="ng">
        <div class="ng-top">
          <div class="ng-lives" aria-label="Liv"></div>
          <div class="ng-mode" role="group" aria-label="Verktøy">
            <button type="button" class="ng-tool active" data-mode="1" aria-pressed="true"><span class="ng-swatch"></span>Fyll</button>
            <button type="button" class="ng-tool" data-mode="2" aria-pressed="false"><span class="ng-x">✕</span>Kryss</button>
          </div>
        </div>
        <div class="ng-wrap">
          <div class="ng-board" style="--n:${n}">
            <div class="ng-corner"></div>
            <div class="ng-colclues"></div>
            <div class="ng-rowclues"></div>
            <div class="ng-grid" role="grid" aria-label="Nonogram ${n} ganger ${n}"></div>
          </div>
        </div>
        <p class="ng-msg" role="status" aria-live="polite"></p>
      </div>`;

    const livesEl = root.querySelector('.ng-lives');
    const gridEl = root.querySelector('.ng-grid');
    const colEl = root.querySelector('.ng-colclues');
    const rowEl = root.querySelector('.ng-rowclues');
    const msg = root.querySelector('.ng-msg');
    const boardEl = root.querySelector('.ng-board');

    // Hint
    const colHint = colClues.map((c) => {
      const d = document.createElement('div');
      d.className = 'ng-cc';
      d.innerHTML = c.map((x) => `<span>${x}</span>`).join('');
      colEl.append(d);
      return d;
    });
    const rowHint = rowClues.map((c) => {
      const d = document.createElement('div');
      d.className = 'ng-rc';
      d.innerHTML = c.map((x) => `<span>${x}</span>`).join('');
      rowEl.append(d);
      return d;
    });

    // Ruter
    const cells = [];
    for (let i = 0; i < n; i++) {
      cells[i] = [];
      for (let j = 0; j < n; j++) {
        const c = document.createElement('div');
        c.className = 'ng-cell';
        c.setAttribute('role', 'gridcell');
        c.dataset.r = i;
        c.dataset.c = j;
        if (j % 5 === 4 && j < n - 1) c.classList.add('edge-r');
        if (i % 5 === 4 && i < n - 1) c.classList.add('edge-b');
        gridEl.append(c);
        cells[i][j] = c;
      }
    }

    function paint(i, j) {
      const c = cells[i][j];
      const v = state[i][j];
      c.dataset.v = v;
    }

    function lineDone(isRow, k) {
      for (let x = 0; x < n; x++) {
        const s = isRow ? sol[k][x] : sol[x][k];
        const v = isRow ? state[k][x] : state[x][k];
        if (s && v !== 1) return false;
      }
      return true;
    }

    // Når alle fylte ruter i en rad eller kolonne er funnet,
    // settes kryss automatisk i resten av den raden/kolonnen.
    function autoCross(i, j) {
      if (lineDone(true, i)) {
        for (let x = 0; x < n; x++) if (state[i][x] === 0) { state[i][x] = 2; paint(i, x); }
      }
      if (lineDone(false, j)) {
        for (let x = 0; x < n; x++) if (state[x][j] === 0) { state[x][j] = 2; paint(x, j); }
      }
    }

    function updateHints() {
      for (let k = 0; k < n; k++) {
        rowHint[k].classList.toggle('done', lineDone(true, k));
        colHint[k].classList.toggle('done', lineDone(false, k));
      }
    }

    function drawLives() {
      livesEl.innerHTML = '';
      for (let k = 0; k < LIVES; k++) {
        const h = document.createElement('span');
        h.className = 'ng-heart' + (k < lives ? '' : ' lost');
        h.innerHTML = HEART;
        livesEl.append(h);
      }
      livesEl.setAttribute('aria-label', `${lives} av ${LIVES} liv igjen`);
    }

    function drawAll() {
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) paint(i, j);
      updateHints();
      drawLives();
    }

    function filledCount() {
      let k = 0;
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (state[i][j] === 1) k++;
      return k;
    }

    // ---------- Spillogikk ----------
    let dragAction = null;

    function apply(i, j) {
      if (solved || lives <= 0) return;
      const v = state[i][j];
      if (v === 3) return; // feil-ruter er låst
      if (dragAction === 'clear') {
        if (v === 2) { state[i][j] = 0; paint(i, j); }
        return;
      }
      if (v !== 0) return;

      if (mode === 1) {
        if (sol[i][j]) {
          state[i][j] = 1;
        } else {
          state[i][j] = 3;
          mistake(i, j);
        }
      } else {
        if (!sol[i][j]) {
          state[i][j] = 2;
        } else {
          state[i][j] = 1; // var egentlig fylt: vis den, men koster et liv
          mistake(i, j);
        }
      }
      paint(i, j);
      autoCross(i, j);
      updateHints();
      save();
      checkWin();
    }

    function mistake(i, j) {
      lives--;
      drawLives();
      const c = cells[i][j];
      c.classList.remove('oops');
      void c.offsetWidth;
      c.classList.add('oops');
      boardEl.classList.remove('shake');
      void boardEl.offsetWidth;
      boardEl.classList.add('shake');
      msg.textContent = lives > 0 ? (lives === 1 ? 'Au! Ett liv igjen' : 'Au! Det var feil') : '';
      dragAction = null;
      if (lives <= 0) {
        save();
        setTimeout(() => reveal(true, false), 600);
      }
    }

    function checkWin() {
      if (filledCount() !== total) return;
      solved = true;
      save();
      reveal(true);
    }

    // Vis bildet i farger. won = false når hun har brukt opp livene.
    function reveal(animate, won = true) {
      msg.textContent = won ? '' : 'Her var bildet';
      root.querySelector('.ng-top').classList.add('done');
      boardEl.classList.add('solved');
      const colors = puzzle.colors || {};
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          const ch = pic[i][j];
          const c = cells[i][j];
          const set = () => {
            if (ch !== '.') { c.style.background = colors[ch] || 'var(--gold)'; c.dataset.v = 'color'; }
            else c.dataset.v = 'blank';
          };
          if (animate) setTimeout(set, (i + j) * 45);
          else set();
        }
      }
      setTimeout(() => onDone(won), animate ? (2 * n) * 45 + 700 : 0);
    }

    // ---------- Pekere (trykk og dra) ----------
    function cellAt(x, y) {
      const el = document.elementFromPoint(x, y);
      return el && el.classList.contains('ng-cell') ? el : null;
    }

    gridEl.addEventListener('pointerdown', (e) => {
      const c = e.target.closest('.ng-cell');
      if (!c) return;
      e.preventDefault();
      const i = +c.dataset.r, j = +c.dataset.c;
      dragAction = state[i][j] === 2 && mode === 2 ? 'clear' : 'set';
      apply(i, j);
    });
    gridEl.addEventListener('pointermove', (e) => {
      if (!dragAction) return;
      const c = cellAt(e.clientX, e.clientY);
      if (c) apply(+c.dataset.r, +c.dataset.c);
    });
    const stop = () => { dragAction = null; };
    window.addEventListener('pointerup', stop);
    window.addEventListener('pointercancel', stop);

    // Verktøy
    root.querySelectorAll('.ng-tool').forEach((b) => {
      b.addEventListener('click', () => {
        mode = +b.dataset.mode;
        root.querySelectorAll('.ng-tool').forEach((x) => {
          const on = x === b;
          x.classList.toggle('active', on);
          x.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
      });
    });

    drawAll();
    if (solved) reveal(false);
    else if (lives <= 0) reveal(false, false);

    return () => {
      window.removeEventListener('pointerup', stop);
      window.removeEventListener('pointercancel', stop);
    };
  }

  // Kun for testing: lagret tilstand som om bildet er løst
  const solvedState = (puzzle) => {
    const pic = decode(puzzle.data);
    return {
      state: pic.map((r) => r.split('').map((ch) => (ch === '.' ? 2 : 1))),
      lives: LIVES,
      solved: true
    };
  };

  return { mount, solvedState };
})();
