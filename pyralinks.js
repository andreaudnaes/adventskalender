// =============================================================
//  Pyralinks: en pyramide (1-2-4-8) der hver brikke danner et ord
//  sammen med brikken over seg (øverste del først). Bytt plass på brikkene til alt stemmer.
//  Bekreftede (rosa) koblinger henger sammen og flyttes som én bolk.
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
    const parentOf = {};
    sol.forEach((w, i) => {
      parentOf[w] = i === 0 ? null : sol[Math.floor((i - 1) / 2)];
    });
    const storeKey = `advent-${day}`;

    // En kobling (fra plass k til forelderen) er riktig når orddelen på k
    // danner et ord med orddelen over seg.
    const parentSlot = (k) => Math.floor((k - 1) / 2);
    const linkOk = (arr, k) => parentOf[arr[k]] === arr[parentSlot(k)];

    function freshOrder() {
      let a;
      do { a = shuffle(sol.slice()); } while (a.some((_, k) => k > 0 && linkOk(a, k)));
      return a;
    }

    // confirmed: orddeler (barn) der koblingen opp til forelderen er bekreftet.
    // Bekreftede brikker henger sammen i bolker som flyttes samlet.
    let order, confirmed, tries, solved, wrong;
    function fresh() {
      order = freshOrder();
      confirmed = [];
      tries = TRIES;
      solved = false;
      wrong = [];
    }
    fresh();
    try {
      const s = JSON.parse(localStorage.getItem(storeKey));
      if (s && Array.isArray(s.order) && s.order.slice().sort().join() === sol.slice().sort().join()) {
        order = s.order; tries = s.tries; solved = !!s.solved;
        if (Array.isArray(s.confirmed)) confirmed = s.confirmed;
        else if (Array.isArray(s.locked)) confirmed = s.locked.map((k) => order[k]); // gammelt format
        confirmed = confirmed.filter((w) => { const k = order.indexOf(w); return k > 0 && linkOk(order, k); });
      }
    } catch (e) { /* ignorer */ }
    const save = () => {
      try { localStorage.setItem(storeKey, JSON.stringify({ order, confirmed, tries, solved })); } catch (e) { /* ignorer */ }
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

    // Er brikken på plass k med i en bekreftet kobling?
    function isConfirmed(k) {
      if (k > 0 && confirmed.includes(order[k])) return true;
      return [2 * k + 1, 2 * k + 2].some((c) => c < SIZE && confirmed.includes(order[c]));
    }

    // Bolken (sammenhengende bekreftede brikker) som brikken på plass k hører til
    function groupOf(k) {
      const seen = new Set([k]);
      const stack = [k];
      while (stack.length) {
        const x = stack.pop();
        const nb = [];
        if (x > 0 && confirmed.includes(order[x])) nb.push(parentSlot(x));
        [2 * x + 1, 2 * x + 2].forEach((c) => { if (c < SIZE && confirmed.includes(order[c])) nb.push(c); });
        nb.forEach((y) => { if (!seen.has(y)) { seen.add(y); stack.push(y); } });
      }
      return [...seen];
    }
    const depth = (k) => level(k);
    // Veien fra plass a ned til plass s, som en liste med 0 (venstre) og 1 (høyre)
    function relPath(a, s) {
      const bits = [];
      while (s !== a) { bits.unshift(s % 2 === 1 ? 0 : 1); s = parentSlot(s); }
      return bits;
    }
    function descend(b, bits) {
      for (const bit of bits) { b = 2 * b + 1 + bit; if (b >= SIZE) return -1; }
      return b;
    }

    // Flytt bolken som brikken på plass from hører til, slik at den brikken havner på plass to.
    // Brikkene som var der, flyttes til plassene bolken forlot. Returnerer ny rekkefølge eller null.
    function planMove(from, to) {
      const members = groupOf(from);
      if (members.includes(to)) return null;
      const a = members.reduce((m, x) => (depth(x) < depth(m) ? x : m), members[0]);
      const pathFrom = relPath(a, from);
      const d = pathFrom.length;
      if (depth(to) < d) return null;
      let b = to;
      for (let i = 0; i < d; i++) b = parentSlot(b);
      const pathTo = relPath(b, to);
      // Speil bolken der det trengs (rekkefølgen på søsken spiller ingen rolle)
      const flip = pathFrom.map((bit, i) => bit !== pathTo[i]);
      const target = new Map(); // fra plass -> til plass
      for (const m of members) {
        const bits = relPath(a, m).map((bit, i) => (i < flip.length && flip[i] ? 1 - bit : bit));
        const t = descend(b, bits);
        if (t < 0) return null;
        target.set(m, t);
      }
      const tgtToSrc = new Map([...target].map(([src, tgt]) => [tgt, src]));
      const next = order.slice();
      // brikker som blir fortrengt, følger kjeden til en ledig plass
      for (const x of tgtToSrc.keys()) {
        if (target.has(x)) continue;
        let y = x;
        while (tgtToSrc.has(y)) y = tgtToSrc.get(y);
        next[y] = order[x];
      }
      for (const [src, tgt] of target) next[tgt] = order[src];
      // Alle bekreftede koblinger må fortsatt henge sammen
      const ok = confirmed.every((w) => { const k = next.indexOf(w); return k > 0 && linkOk(next, k); });
      return ok ? next : null;
    }

    let selected = -1;
    let selectedGroup = [];

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
        t.classList.toggle('locked', isConfirmed(k));
        t.classList.toggle('selected', selectedGroup.includes(k));
        t.setAttribute('aria-label', `${w}${isConfirmed(k) ? ', bekreftet' : ''}`);
      });
      for (let k = 1; k < SIZE; k++) {
        lines[k].setAttribute('class', confirmed.includes(order[k]) ? 'ok' : (wrong.includes(k) ? 'bad' : ''));
      }
      triesEl.innerHTML = '';
      for (let i = 0; i < TRIES; i++) {
        const d = document.createElement('span');
        d.className = 'py-try' + (i < tries ? '' : ' used');
        triesEl.append(d);
      }
      triesEl.setAttribute('aria-label', `${tries} av ${TRIES} forsøk igjen`);
    }

    function nope(slots, text) {
      msg.textContent = text;
      slots.forEach((k) => {
        const t = tileAt(k);
        t.classList.remove('nope'); void t.offsetWidth; t.classList.add('nope');
      });
    }

    // Flytt (eller bytt) og la brikkene gli på plass
    function move(from, to) {
      const next = planMove(from, to);
      selected = -1; selectedGroup = [];
      if (!next) { draw(); nope(groupOf(from), 'Bolken får ikke plass der'); return false; }
      order = next;
      wrong = [];
      msg.textContent = '';
      save();
      draw();
      return true;
    }

    function tap(k) {
      if (solved || tries <= 0) return;
      if (selected === -1) { selected = k; selectedGroup = groupOf(k); draw(); return; }
      if (selectedGroup.includes(k)) { selected = -1; selectedGroup = []; draw(); return; }
      move(selected, k);
    }

    // Trykk for å velge og trykk igjen for å bytte,
    // eller løft en brikke (med hele bolken sin) og slipp den oppå en annen.
    let drag = null;
    const slotUnder = (x, y, except) => {
      for (let k = 0; k < SIZE; k++) {
        if (except.includes(k)) continue;
        const r = tileAt(k).getBoundingClientRect();
        if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return k;
      }
      return -1;
    };
    const clearTarget = () => board.querySelectorAll('.py-tile.target').forEach((t) => t.classList.remove('target'));

    board.addEventListener('pointerdown', (e) => {
      const t = e.target.closest('.py-tile');
      if (!t || solved || tries <= 0) return;
      const k = +t.dataset.k;
      const group = groupOf(k);
      drag = { k, t, group, tiles: group.map(tileAt), x: e.clientX, y: e.clientY, moved: false, target: -1 };
      t.setPointerCapture(e.pointerId);
    });

    board.addEventListener('pointermove', (e) => {
      if (!drag) return;
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (!drag.moved && Math.hypot(dx, dy) < 6) return;
      if (!drag.moved) {
        drag.moved = true;
        selected = -1; selectedGroup = [];
        draw();
        drag.tiles.forEach((t) => t.classList.add('dragging'));
        // skjul de rosa linjene inne i bolken mens den flyttes
        drag.group.forEach((k) => { if (k > 0 && drag.group.includes(parentSlot(k))) lines[k].setAttribute('class', 'hide'); });
      }
      e.preventDefault();
      drag.tiles.forEach((t) => { t.style.transform = `translate(${dx}px, ${dy}px) scale(1.06)`; });
      const k = slotUnder(e.clientX, e.clientY, drag.group);
      if (k !== drag.target) {
        clearTarget();
        if (k >= 0) tileAt(k).classList.add('target');
        drag.target = k;
      }
    });

    const endDrag = (e) => {
      if (!drag) return;
      const d = drag;
      drag = null;
      clearTarget();
      if (!d.moved) { tap(d.k); return; }
      // Slipp: la bolken gli fra der den ble sluppet til sin nye plass
      const before = d.tiles.map((t) => t.getBoundingClientRect());
      d.tiles.forEach((t) => { t.classList.add('dropping'); t.classList.remove('dragging'); t.style.transform = ''; });
      if (!(d.target >= 0 && e.type === 'pointerup' && move(d.k, d.target))) draw();
      d.tiles.forEach((t, i) => {
        const r0 = before[i], r1 = t.getBoundingClientRect();
        t.style.transform = `translate(${r0.left - r1.left + (r0.width - r1.width) / 2}px, ${r0.top - r1.top + (r0.height - r1.height) / 2}px) scale(${r0.width / r1.width})`;
      });
      void board.offsetWidth;
      d.tiles.forEach((t) => { t.classList.remove('dropping'); t.style.transform = ''; });
    };
    board.addEventListener('pointerup', endDrag);
    board.addEventListener('pointercancel', endDrag);

    checkBtn.addEventListener('click', () => {
      if (solved || tries <= 0) return;
      tries--;
      selected = -1; selectedGroup = [];
      const okNow = [], badNow = [];
      for (let k = 1; k < SIZE; k++) (linkOk(order, k) ? okNow : badNow).push(k);
      const newOk = okNow.filter((k) => !confirmed.includes(order[k])).length;
      confirmed = okNow.map((k) => order[k]);
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
      confirmed = sol.slice(1);
      wrong = [];
      selected = -1; selectedGroup = [];
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
    return { order: sol, confirmed: sol.slice(1), tries: TRIES, solved: true };
  };

  return { mount, solvedState };
})();
