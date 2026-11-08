// =============================================================
//  Strands: finn temaordene i et bokstavrutenett på 6x8.
//  Ordene kan svinge i alle retninger, også på skrå, og fyller
//  hele brettet. Spangrammet går fra side til side.
//  Innholdet lagres kodet (base64) slik at det ikke står i klartekst.
// =============================================================
window.Games = window.Games || {};

window.Games.strands = (function () {
  const HINT_EVERY = 3;
  const decode = (s) => JSON.parse(decodeURIComponent(escape(atob(s))));

  function mount(root, puzzle, day, onDone) {
    const data = decode(puzzle.data); // { clue, grid: [...], span, words: {ORD: [[r,c],...]}, extra: [...] }
    const R = data.grid.length, C = data.grid[0].length;
    const letter = (i) => data.grid[Math.floor(i / C)][i % C];
    const idx = (rc) => rc[0] * C + rc[1];
    const themeWords = Object.keys(data.words);
    const pathOf = {};
    themeWords.forEach((w) => { pathOf[w] = data.words[w].map(idx); });
    const extra = new Set(data.extra);
    const storeKey = `advent-${day}`;

    let found = [], bonus = [], hinted = [], revealed = [], hintsUsed = 0;
    // hinted: temaord med ringer rundt bokstavene. revealed: temaord der rekkefølgen vises.
    try {
      const s = JSON.parse(localStorage.getItem(storeKey));
      if (s && Array.isArray(s.found)) {
        found = s.found.filter((w) => pathOf[w]);
        bonus = s.bonus || [];
        hinted = (Array.isArray(s.hinted) ? s.hinted : (s.hinted ? [s.hinted] : [])).filter((w) => pathOf[w] && !found.includes(w));
        hintsUsed = s.hintsUsed || 0;
        revealed = (s.revealed || []).filter((w) => hinted.includes(w));
      }
    } catch (e) { /* ignorer */ }
    const save = () => {
      try { localStorage.setItem(storeKey, JSON.stringify({ found, bonus, hinted, revealed, hintsUsed })); } catch (e) { /* ignorer */ }
    };

    root.innerHTML = `
      <div class="sd">
        <div class="sd-theme">
          <p class="sd-theme-label">Dagens tema</p>
          <p class="sd-theme-clue"></p>
        </div>
        <p class="sd-word" aria-live="polite"></p>
        <div class="sd-board" style="--rows:${R}; --cols:${C}">
          <svg class="sd-lines" aria-hidden="true"></svg>
          <div class="sd-grid" role="grid" aria-label="Bokstavrutenett"></div>
        </div>
        <div class="sd-bottom">
          <button type="button" class="sd-hint" disabled>
            <span class="sd-hint-fill"></span><span class="sd-hint-text">Hint</span>
          </button>
          <p class="sd-progress"></p>
        </div>
      </div>`;
    root.querySelector('.sd-theme-clue').textContent = data.clue;

    const board = root.querySelector('.sd-board');
    const gridEl = root.querySelector('.sd-grid');
    const svg = root.querySelector('.sd-lines');
    const wordEl = root.querySelector('.sd-word');
    const hintBtn = root.querySelector('.sd-hint');
    const hintFill = root.querySelector('.sd-hint-fill');
    const hintText = root.querySelector('.sd-hint-text');
    const progressEl = root.querySelector('.sd-progress');

    const cells = [];
    for (let i = 0; i < R * C; i++) {
      const c = document.createElement('div');
      c.className = 'sd-cell';
      c.setAttribute('role', 'gridcell');
      c.dataset.i = i;
      c.textContent = letter(i);
      gridEl.append(c);
      cells.push(c);
    }

    // ---------- Tegning ----------
    let current = [];

    const center = (i) => [(i % C) + 0.5, Math.floor(i / C) + 0.5];
    function linePath(path, cls) {
      if (path.length < 2) return '';
      const pts = path.map((i) => center(i).join(',')).join(' ');
      return `<polyline class="${cls}" points="${pts}"/>`;
    }

    const pendingHint = () => hinted.find((w) => !found.includes(w) && !revealed.includes(w));

    // Bokstavene i et avslørt ord lyser opp én etter én, om og om igjen
    let step = 0;
    const revealTimer = setInterval(() => {
      step++;
      revealed.forEach((w) => {
        if (found.includes(w)) return;
        const p = pathOf[w];
        const pos = step % (p.length + 3); // en liten pause før det starter på nytt
        p.forEach((i, k) => cells[i].classList.toggle('lit', k === pos - 1)); // bare én bokstav om gangen
      });
    }, 420);

    function draw() {
      const owner = {};
      found.forEach((w) => pathOf[w].forEach((i) => { owner[i] = w === data.span ? 'span' : 'theme'; }));
      cells.forEach((c, i) => {
        c.classList.remove('span', 'theme', 'sel', 'hint', 'lit');
        if (owner[i]) c.classList.add(owner[i]);
        else if (current.includes(i)) c.classList.add('sel');
        if (hinted.some((w) => !found.includes(w) && pathOf[w].includes(i))) c.classList.add('hint');
      });
      svg.setAttribute('viewBox', `0 0 ${C} ${R}`);
      svg.innerHTML =
        found.map((w) => linePath(pathOf[w], w === data.span ? 'span' : 'theme')).join('') +
        linePath(current, 'sel');

      wordEl.textContent = current.map(letter).join('');
      const themeCount = themeWords.length;
      progressEl.innerHTML = `<b>${found.length}</b> av <b>${themeCount}</b> temaord funnet`;
      // Hint spares opp: hvert tredje ekstra ord gir ett hint
      const earned = Math.max(0, Math.floor(bonus.length / HINT_EVERY) - hintsUsed);
      const partial = (bonus.length % HINT_EVERY) / HINT_EVERY;
      const left = themeWords.filter((w) => !found.includes(w) && !hinted.includes(w));
      const canHint = earned > 0 && (pendingHint() || left.length > 0);
      hintBtn.disabled = !canHint;
      hintFill.style.width = `${(canHint ? 1 : partial) * 100}%`;
      hintText.textContent = earned > 1 ? `Hint ×${earned}` : 'Hint';
      hintBtn.setAttribute('aria-label', canHint ? `Bruk hint (${earned} tilgjengelig)` : `Hint: finn ${HINT_EVERY - (bonus.length % HINT_EVERY)} ord til`);
    }

    function flash(text, cls) {
      wordEl.textContent = text;
      wordEl.className = 'sd-word ' + (cls || '');
      clearTimeout(flash.t);
      flash.t = setTimeout(() => { wordEl.className = 'sd-word'; draw(); }, 1300);
    }

    // ---------- Valg av bokstaver ----------
    const isFree = (i) => !found.some((w) => pathOf[w].includes(i));
    const adjacent = (a, b) => {
      const ra = Math.floor(a / C), ca = a % C, rb = Math.floor(b / C), cb = b % C;
      return a !== b && Math.abs(ra - rb) <= 1 && Math.abs(ca - cb) <= 1;
    };

    function extend(i) {
      if (!isFree(i)) return;
      if (!current.length) { current = [i]; draw(); return; }
      const last = current[current.length - 1];
      if (i === last) return;
      // dra tilbake: fjern siste bokstav
      if (current.length > 1 && i === current[current.length - 2]) { current.pop(); draw(); return; }
      if (current.includes(i) || !adjacent(last, i)) return;
      current.push(i);
      draw();
    }

    function submit() {
      const word = current.map(letter).join('');
      const path = current.slice();
      current = [];
      if (word.length < 4) { draw(); if (word.length > 1) flash('For kort', 'bad'); return; }
      // Samme ruter i samme eller motsatt rekkefølge av like bokstaver teller som riktig
      const sameCells = (w) => pathOf[w].length === path.length && pathOf[w].every((x) => path.includes(x));
      const theme = themeWords.find((w) => !found.includes(w) && w === word && sameCells(w));
      if (theme) {
        found.push(theme);
        hinted = hinted.filter((w) => w !== theme);
        revealed = revealed.filter((w) => w !== theme);
        save();
        draw();
        const isSpan = theme === data.span;
        flash(isSpan ? 'SPANGRAM!' : theme, isSpan ? 'span' : 'theme');
        pathOf[theme].forEach((i, k) => {
          const c = cells[i];
          setTimeout(() => { c.classList.remove('pop'); void c.offsetWidth; c.classList.add('pop'); }, k * 40);
        });
        if (found.length === themeWords.length) win(true);
        return;
      }
      if (themeWords.includes(word) && !found.includes(word)) { draw(); flash('Riktig ord, men ikke her', 'bad'); return; }
      if (found.includes(word) || bonus.includes(word)) { draw(); flash('Allerede funnet'); return; }
      if (extra.has(word)) {
        bonus.push(word);
        save();
        draw();
        // Lite blink på hint-knappen, så man ser at hint samles opp
        hintBtn.classList.remove('blink'); void hintBtn.offsetWidth; hintBtn.classList.add('blink');
        flash(word, 'bonus');
        return;
      }
      draw();
      flash('Ikke i ordlisten', 'bad');
    }

    // Dra over bokstavene, eller trykk én og én og trykk siste bokstav igjen for å sende inn
    let dragging = false, dragged = false, tapSame = false;
    const cellAt = (x, y) => {
      const r = gridEl.getBoundingClientRect();
      const col = Math.floor(((x - r.left) / r.width) * C);
      const row = Math.floor(((y - r.top) / r.height) * R);
      if (col < 0 || row < 0 || col >= C || row >= R) return -1;
      // bare treff nær midten av ruta, så det er lett å gå på skrå
      const cx = r.left + (col + 0.5) * (r.width / C), cy = r.top + (row + 0.5) * (r.height / R);
      const rad = (r.width / C) * 0.42;
      return Math.hypot(x - cx, y - cy) <= rad ? row * C + col : -1;
    };

    board.addEventListener('pointerdown', (e) => {
      if (found.length === themeWords.length) return;
      const i = cellAt(e.clientX, e.clientY);
      if (i < 0 || !isFree(i)) return;
      e.preventDefault();
      board.setPointerCapture(e.pointerId);
      dragging = true; dragged = false;
      const last = current[current.length - 1];
      tapSame = current.length > 0 && i === last;
      if (tapSame) return;                                 // trykk på siste bokstav igjen = send inn
      if (current.length && adjacent(last, i) && !current.includes(i)) extend(i);
      else { current = [i]; draw(); }
    });
    board.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const i = cellAt(e.clientX, e.clientY);
      if (i >= 0 && i !== current[current.length - 1]) { dragged = true; extend(i); }
    });
    const up = () => {
      if (!dragging) return;
      dragging = false;
      if (dragged && current.length > 1) { submit(); return; }
      if (!dragged && tapSame && current.length > 1) submit();
    };
    board.addEventListener('pointerup', up);
    board.addEventListener('pointercancel', () => { dragging = false; });

    hintBtn.addEventListener('click', () => {
      if (hintBtn.disabled) return;
      // Er et temaord allerede ringet inn, viser neste hint rekkefølgen i det.
      // Ellers ringes neste temaord inn (spangrammet til slutt).
      const pending = pendingHint();
      if (pending) {
        revealed.push(pending);
      } else {
        const left = themeWords.filter((w) => !found.includes(w) && !hinted.includes(w));
        const next = left.find((w) => w !== data.span) || left[0];
        if (!next) return;
        hinted.push(next);
      }
      hintsUsed++;
      save();
      draw();
    });

    function win(animate) {
      root.querySelector('.sd-bottom').classList.add('done');
      setTimeout(() => {
        wordEl.className = 'sd-word span';
        wordEl.textContent = 'Alle temaordene er funnet!';
      }, animate ? 1300 : 0);
      setTimeout(() => onDone(true), animate ? 1500 : 0);
    }

    draw();
    if (found.length === themeWords.length) win(false);

    return () => { clearTimeout(flash.t); clearInterval(revealTimer); };
  }

  // Kun for testing: lagret tilstand som om alle ordene er funnet
  const solvedState = (puzzle) => ({ found: Object.keys(decode(puzzle.data).words), bonus: [], hinted: [], revealed: [], hintsUsed: 0 });

  return { mount, solvedState };
})();
