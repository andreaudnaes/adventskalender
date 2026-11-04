// =============================================================
//  Pyralinks: en pyramide (1-2-4-8) der hver brikke danner et ord
//  sammen med brikken over seg (øverste del først). Bytt plass på brikkene til alt stemmer.
//  Løsningen lagres kodet (base64), i "heap"-rekkefølge:
//  plass 0 er toppen, barna til plass i er 2i+1 og 2i+2.
// =============================================================
window.Games = window.Games || {};

window.Games.pyralinks = (function () {
  const TRIES = 5;
  const decode = (s) => JSON.parse(decodeURIComponent(escape(atob(s))));
  const level = (i) => Math.floor(Math.log2(i + 1));

  function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function mount(root, puzzle, day, onDone) {
    const sol = decode(puzzle.data);        // 15 orddeler i riktig plassering
    const SIZE = sol.length;
    const parentOf = {}, levelOf = {};
    sol.forEach((w, i) => {
      levelOf[w] = level(i);
      parentOf[w] = i === 0 ? null : sol[Math.floor((i - 1) / 2)];
    });
    const storeKey = `advent-${day}`;

    // En kobling (fra plass k til forelderen) er riktig når brikken
    // på k har riktig forelder og står på riktig nivå.
    const linkOk = (arr, k) => parentOf[arr[k]] === arr[Math.floor((k - 1) / 2)] && levelOf[arr[k]] === level(k);

    function freshOrder() {
      let a;
      do { a = shuffle(sol.slice()); } while (a.some((_, k) => k > 0 && linkOk(a, k)));
      return a;
    }

    let order, locked, tries, solved, wrong;
    function fresh() {
      order = freshOrder();
      locked = [];
      tries = TRIES;
      solved = false;
      wrong = [];
    }
    fresh();
    try {
      const s = JSON.parse(localStorage.getItem(storeKey));
      if (s && Array.isArray(s.order) && s.order.slice().sort().join() === sol.slice().sort().join()) {
        order = s.order; locked = s.locked || []; tries = s.tries; solved = !!s.solved;
      }
    } catch (e) { /* ignorer */ }
    const save = () => {
      try { localStorage.setItem(storeKey, JSON.stringify({ order, locked, tries, solved })); } catch (e) { /* ignorer */ }
    };

    root.innerHTML = `
      <div class="py">
        <p class="py-help">Bytt plass på brikkene. Hver brikke danner et ord med brikken over seg: den øverste kommer først.</p>
        <div class="py-board">
          <svg class="py-lines" aria-hidden="true"></svg>
        </div>
        <p class="py-msg" role="status" aria-live="polite"></p>
        <div class="py-bottom">
          <div class="py-tries" aria-label="Forsøk igjen"></div>
          <button type="button" class="py-check">Sjekk</button>
        </div>
      </div>`;

    const board = root.querySelector('.py-board');
    const svg = root.querySelector('.py-lines');
    const msg = root.querySelector('.py-msg');
    const triesEl = root.querySelector('.py-tries');
    const checkBtn = root.querySelector('.py-check');

    // Brikker: én per orddel. Hver brikke flytter seg mellom plassene,
    // slik at et bytte vises som at brikkene glir forbi hverandre.
    const tileOf = {};
    sol.forEach((w) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'py-tile';
      b.textContent = w;
      board.append(b);
      tileOf[w] = b;
    });
    const tileAt = (k) => tileOf[order[k]];
    let pos = [];
    const TILE_H = 40;
    // Linjer (en per kobling, fra plass k til forelderen)
    const lines = [];
    for (let k = 1; k < SIZE; k++) {
      const l = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      svg.append(l);
      lines[k] = l;
    }

    function layout() {
      const W = board.clientWidth;
      const tileH = 40;
      const rowGap = 26;
      const levels = level(SIZE - 1) + 1;
      const H = levels * tileH + (levels - 1) * rowGap;
      board.style.height = `${H}px`;
      svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
      pos = [];
      for (let k = 0; k < SIZE; k++) {
        const L = level(k);
        const j = k - (2 ** L - 1);
        const slot = W / 2 ** L;
        const cx = (j + 0.5) * slot;
        const w = Math.min(slot - 4, 96);
        const top = L * (tileH + rowGap);
        pos[k] = { cx, top, w };
      }
      board.classList.add('no-anim');
      placeTiles();
      void board.offsetWidth;
      board.classList.remove('no-anim');
      for (let k = 1; k < SIZE; k++) {
        const p = pos[Math.floor((k - 1) / 2)], c = pos[k];
        const y1 = p.top + tileH, y2 = c.top;
        const my = (y1 + y2) / 2;
        lines[k].setAttribute('d', `M${p.cx},${y1} C${p.cx},${my} ${c.cx},${my} ${c.cx},${y2}`);
      }
    }

    function isLocked(k) {
      // en brikke er låst hvis en av koblingene dens er bekreftet riktig
      if (locked.includes(k)) return true;
      return locked.some((x) => Math.floor((x - 1) / 2) === k);
    }

    let selected = -1;

    function placeTiles() {
      if (!pos.length) return;
      order.forEach((w, k) => {
        const t = tileOf[w];
        const p = pos[k];
        t.dataset.k = k;
        t.dataset.level = level(k);
        t.style.width = `${p.w}px`;
        t.style.height = `${TILE_H}px`;
        t.style.left = `${p.cx - p.w / 2}px`;
        t.style.top = `${p.top}px`;
      });
    }

    function draw() {
      placeTiles();
      order.forEach((w, k) => {
        const t = tileOf[w];
        t.classList.toggle('locked', isLocked(k));
        t.classList.toggle('selected', k === selected);
        t.setAttribute('aria-label', `${w}${isLocked(k) ? ', låst' : ''}`);
      });
      for (let k = 1; k < SIZE; k++) {
        lines[k].setAttribute('class', locked.includes(k) ? 'ok' : (wrong.includes(k) ? 'bad' : ''));
      }
      triesEl.innerHTML = '';
      for (let i = 0; i < TRIES; i++) {
        const d = document.createElement('span');
        d.className = 'py-try' + (i < tries ? '' : ' used');
        triesEl.append(d);
      }
      triesEl.setAttribute('aria-label', `${tries} av ${TRIES} forsøk igjen`);
    }

    function swap(a, b) {
      if (a === b || isLocked(a) || isLocked(b)) return;
      [order[a], order[b]] = [order[b], order[a]];
      wrong = wrong.filter((k) => ![a, b].includes(k) && ![a, b].includes(Math.floor((k - 1) / 2)));
      selected = -1;
      msg.textContent = '';
      save();
      draw();
    }

    function tap(k) {
      if (solved || tries <= 0) return;
      if (isLocked(k)) { msg.textContent = 'Den brikken er allerede riktig'; return; }
      if (selected === -1) { selected = k; draw(); return; }
      if (selected === k) { selected = -1; draw(); return; }
      swap(selected, k);
    }

    // Trykk for å velge og trykk igjen for å bytte,
    // eller løft en brikke og slipp den oppå en annen.
    let drag = null;
    const slotUnder = (x, y, except) => {
      for (let k = 0; k < SIZE; k++) {
        const t = tileAt(k);
        if (t === except) continue;
        const r = t.getBoundingClientRect();
        if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return k;
      }
      return -1;
    };
    const clearTarget = () => board.querySelectorAll('.py-tile.target').forEach((t) => t.classList.remove('target'));

    board.addEventListener('pointerdown', (e) => {
      const t = e.target.closest('.py-tile');
      if (!t || solved || tries <= 0) return;
      const k = +t.dataset.k;
      drag = { k, t, x: e.clientX, y: e.clientY, moved: false, target: -1, locked: isLocked(k) };
      if (!drag.locked) t.setPointerCapture(e.pointerId);
    });

    board.addEventListener('pointermove', (e) => {
      if (!drag || drag.locked) return;
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (!drag.moved && Math.hypot(dx, dy) < 6) return;
      if (!drag.moved) {
        drag.moved = true;
        selected = -1;
        draw();
        drag.t.classList.add('dragging');
      }
      e.preventDefault();
      drag.t.style.transform = `translate(${dx}px, ${dy}px) scale(1.1)`;
      const k = slotUnder(e.clientX, e.clientY, drag.t);
      const target = k >= 0 && !isLocked(k) ? k : -1;
      if (target !== drag.target) {
        clearTarget();
        if (target >= 0) tileAt(target).classList.add('target');
        drag.target = target;
      }
    });

    const endDrag = (e) => {
      if (!drag) return;
      const d = drag;
      drag = null;
      clearTarget();
      if (!d.moved) { tap(d.k); return; }
      // Slipp: la brikken gli fra der den ble sluppet til sin nye plass
      const r0 = d.t.getBoundingClientRect();
      d.t.classList.add('dropping');          // ingen animasjon mens vi flytter den
      d.t.classList.remove('dragging');
      d.t.style.transform = '';
      if (d.target >= 0 && e.type === 'pointerup') swap(d.k, d.target);
      else draw();
      const r1 = d.t.getBoundingClientRect();  // den nye plassen
      const sx = r0.width / r1.width;
      d.t.style.transform = `translate(${r0.left - r1.left + (r0.width - r1.width) / 2}px, ${r0.top - r1.top + (r0.height - r1.height) / 2}px) scale(${sx})`;
      void d.t.offsetWidth;
      d.t.classList.remove('dropping');       // gli fra slippunktet til plassen
      d.t.style.transform = '';
    };
    board.addEventListener('pointerup', endDrag);
    board.addEventListener('pointercancel', endDrag);

    checkBtn.addEventListener('click', () => {
      if (solved || tries <= 0) return;
      tries--;
      selected = -1;
      const okNow = [], badNow = [];
      for (let k = 1; k < SIZE; k++) (linkOk(order, k) ? okNow : badNow).push(k);
      const newOk = okNow.filter((k) => !locked.includes(k)).length;
      locked = okNow;
      wrong = badNow;
      if (badNow.length === 0) {
        solved = true;
        save(); draw(); win(true);
        return;
      }
      msg.textContent = newOk === 0
        ? 'Ingen nye riktige koblinger'
        : `${newOk} ${newOk === 1 ? 'ny riktig kobling' : 'nye riktige koblinger'}!`;
      save(); draw();
      if (tries <= 0) setTimeout(() => lose(true), 900);
    });

    // Tomt for forsøk: vis riktig pyramide
    function lose(animate) {
      order = sol.slice();
      locked = sol.map((_, k) => k).slice(1);
      wrong = [];
      selected = -1;
      save();
      draw();
      board.classList.add('revealed');
      root.querySelector('.py-bottom').classList.add('done');
      msg.textContent = 'Her var løsningen';
      setTimeout(() => onDone(false), animate ? 900 : 0);
    }

    function win(animate) {
      board.classList.add('solved');
      root.querySelector('.py-bottom').classList.add('done');
      msg.textContent = 'Alle koblingene stemmer!';
      setTimeout(() => onDone(true), animate ? 1000 : 0);
    }

    // Tegn pyramiden på nytt når brettet får (ny) bredde
    const ro = new ResizeObserver(() => layout());
    ro.observe(board);
    requestAnimationFrame(layout);
    draw();
    if (solved) win(false);
    else if (tries <= 0) lose(false);

    return () => ro.disconnect();
  }

  // Kun for testing: lagret tilstand som om pyramiden er løst
  const solvedState = (puzzle) => {
    const sol = decode(puzzle.data);
    return { order: sol, locked: sol.map((_, k) => k).slice(1), tries: TRIES, solved: true };
  };

  return { mount, solvedState };
})();
