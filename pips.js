// =============================================================
//  Pips: legg alle dominobrikkene på brettet slik at
//  betingelsene i de fargede sonene stemmer.
//  Innholdet lagres kodet (base64) slik at det ikke står i klartekst.
// =============================================================
window.Games = window.Games || {};

window.Games.pips = (function () {
  const decode = (s) => JSON.parse(decodeURIComponent(escape(atob(s))));
  const COLORS = ['#E8C766', '#9CC98A', '#9DBEE6', '#C3A6E0', '#F0A98A', '#E6A3BE', '#8FD1C9', '#D9C3A0', '#B8D97A'];
  // Hvor prikkene står i et 3x3-rutenett
  const PIPS = { 0: [], 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };

  function halfHTML(v) {
    const on = new Set(PIPS[v]);
    let s = '<span class="pp-half">';
    for (let k = 0; k < 9; k++) s += `<i class="${on.has(k) ? 'on' : ''}"></i>`;
    return s + '</span>';
  }

  function mount(root, puzzle, day, onDone) {
    const d = decode(puzzle.data);
    const key = (r, c) => `${r},${c}`;
    const cellSet = new Set(d.cells.map(([r, c]) => key(r, c)));
    const rows = Math.max(...d.cells.map((x) => x[0])) + 1;
    const cols = Math.max(...d.cells.map((x) => x[1])) + 1;
    const regionOf = {};
    d.regions.forEach((rg, i) => rg.cells.forEach(([r, c]) => { regionOf[key(r, c)] = i; }));
    const N = d.dominoes.length;
    const storeKey = `advent-${day}`;

    // Tilstand per brikke: { at: null | { r, c, dir: 'h' | 'v' }, flip: bool, vert: bool (i skuffen) }
    let doms, solved = false;
    const fresh = () => { doms = d.dominoes.map(() => ({ at: null, flip: false, vert: false })); };
    fresh();
    try {
      const s = JSON.parse(localStorage.getItem(storeKey));
      if (s && Array.isArray(s.doms) && s.doms.length === N) { doms = s.doms; solved = !!s.solved; }
    } catch (e) { /* ignorer */ }
    const save = () => {
      try { localStorage.setItem(storeKey, JSON.stringify({ doms, solved })); } catch (e) { /* ignorer */ }
    };

    root.innerHTML = `
      <div class="pp" style="--rows:${rows}; --cols:${cols}">
        <p class="pp-help">Legg alle brikkene på brettet. Trykk på en brikke for å rotere den.</p>
        <div class="pp-board">
          <div class="pp-cells"></div>
          <div class="pp-placed"></div>
          <div class="pp-marks" aria-hidden="true"></div>
        </div>
        <p class="pp-msg" role="status" aria-live="polite"></p>
        <div class="pp-tray" aria-label="Brikker"></div>
      </div>`;
    const boardEl = root.querySelector('.pp-board');
    const cellsEl = root.querySelector('.pp-cells');
    const placedEl = root.querySelector('.pp-placed');
    const marksEl = root.querySelector('.pp-marks');
    const trayEl = root.querySelector('.pp-tray');
    const msg = root.querySelector('.pp-msg');

    // ---------- Brettet med soner ----------
    const badges = [];
    d.cells.forEach(([r, c]) => {
      const el = document.createElement('div');
      el.className = 'pp-cell';
      el.style.gridRow = r + 1;
      el.style.gridColumn = c + 1;
      const ri = regionOf[key(r, c)];
      if (ri !== undefined) {
        const col = COLORS[ri % COLORS.length];
        el.classList.add('zone');
        el.style.setProperty('--zone', col);
        // Stiplet kant der sonen slutter
        const same = (rr, cc) => regionOf[key(rr, cc)] === ri;
        if (!same(r - 1, c)) el.classList.add('bt');
        if (!same(r + 1, c)) el.classList.add('bb');
        if (!same(r, c - 1)) el.classList.add('bl');
        if (!same(r, c + 1)) el.classList.add('br');
      }
      cellsEl.append(el);
    });
    d.regions.forEach((rg, i) => {
      // Merkelappen står nederst til høyre i sonen
      const [r, c] = rg.cells.slice().sort((a, b) => (b[0] - a[0]) || (b[1] - a[1]))[0];
      const b = document.createElement('div');
      b.className = 'pp-badge';
      b.style.gridRow = r + 1;
      b.style.gridColumn = c + 1;
      b.style.setProperty('--zone', COLORS[i % COLORS.length]);
      const label = rg.type === 'sum' ? rg.n : rg.type === 'lt' ? `<${rg.n}` : rg.type === 'gt' ? `>${rg.n}` : rg.type === 'eq' ? '=' : '≠';
      b.innerHTML = '<span></span>';
      b.firstChild.textContent = label;
      cellsEl.append(b);
      badges.push(b);
    });

    // ---------- Brikker ----------
    const cellsOf = (at) => (at.dir === 'h' ? [[at.r, at.c], [at.r, at.c + 1]] : [[at.r, at.c], [at.r + 1, at.c]]);
    const valuesOf = (k) => (doms[k].flip ? [d.dominoes[k][1], d.dominoes[k][0]] : d.dominoes[k].slice());

    function occupied(exceptK) {
      const occ = {};
      doms.forEach((s, k) => { if (s.at && k !== exceptK) cellsOf(s.at).forEach(([r, c]) => { occ[key(r, c)] = k; }); });
      return occ;
    }
    function fits(at, k) {
      const occ = occupied(k);
      return cellsOf(at).every(([r, c]) => cellSet.has(key(r, c)) && occ[key(r, c)] === undefined);
    }

    const domEls = d.dominoes.map((_, k) => {
      const el = document.createElement('div');
      el.className = 'pp-dom';
      el.dataset.k = k;
      el.setAttribute('role', 'button');
      el.tabIndex = 0;
      // Fjern riste-klassen når animasjonen er ferdig, ellers starter den på nytt
      // hver gang brikken flyttes rundt i DOM-en
      el.addEventListener('animationend', () => el.classList.remove('nope'));
      return el;
    });

    function paintDom(k) {
      const s = doms[k], el = domEls[k];
      const [a, b] = valuesOf(k);
      const vert = s.at ? s.at.dir === 'v' : s.vert;
      el.classList.toggle('v', vert);
      el.innerHTML = halfHTML(a) + halfHTML(b);
      el.setAttribute('aria-label', `Brikke ${a} og ${b}`);
      if (s.at) {
        el.style.gridRow = `${s.at.r + 1} / span ${vert ? 2 : 1}`;
        el.style.gridColumn = `${s.at.c + 1} / span ${vert ? 1 : 2}`;
        placedEl.append(el);
      } else {
        el.style.gridRow = '';
        el.style.gridColumn = '';
        trayEl.append(el);
      }
    }

    // Sjekk betingelsene
    function regionState(i, grid) {
      const rg = d.regions[i];
      const vs = rg.cells.map(([r, c]) => grid[key(r, c)]);
      if (vs.some((v) => v === undefined)) return 'open';
      const s = vs.reduce((x, y) => x + y, 0);
      const ok = rg.type === 'sum' ? s === rg.n
        : rg.type === 'lt' ? s < rg.n
        : rg.type === 'gt' ? s > rg.n
        : rg.type === 'eq' ? new Set(vs).size === 1
        : new Set(vs).size === vs.length;
      return ok ? 'ok' : 'bad';
    }

    function render() {
      // Behold rekkefølgen i skuffen
      trayEl.innerHTML = '';
      placedEl.innerHTML = '';
      doms.forEach((_, k) => paintDom(k));
      const grid = {};
      doms.forEach((s, k) => {
        if (!s.at) return;
        const vals = valuesOf(k);
        cellsOf(s.at).forEach(([r, c], j) => { grid[key(r, c)] = vals[j]; });
      });
      const allPlaced = doms.every((s) => s.at);
      let allOk = true;
      const badRegions = [];
      badges.forEach((b, i) => {
        const st = regionState(i, grid);
        b.classList.toggle('ok', st === 'ok');
        b.classList.toggle('bad', allPlaced && st === 'bad');
        if (allPlaced && st === 'bad') badRegions.push(i);
        if (st !== 'ok') allOk = false;
      });
      // Marker feltene som ikke stemmer (bare når alle brikkene er lagt)
      marksEl.innerHTML = '';
      badRegions.forEach((i) => {
        const inRegion = (rr, cc) => regionOf[key(rr, cc)] === i;
        d.regions[i].cells.forEach(([r, c]) => {
          const m = document.createElement('div');
          m.className = 'pp-wrong';
          m.style.gridRow = r + 1;
          m.style.gridColumn = c + 1;
          if (!inRegion(r - 1, c)) m.classList.add('bt');
          if (!inRegion(r + 1, c)) m.classList.add('bb');
          if (!inRegion(r, c - 1)) m.classList.add('bl');
          if (!inRegion(r, c + 1)) m.classList.add('br');
          marksEl.append(m);
        });
      });
      trayEl.classList.toggle('empty', allPlaced);
      if (allPlaced && allOk && !solved) { solved = true; save(); win(true); }
      else if (allPlaced && !allOk) msg.textContent = badRegions.length === 1 ? 'Ikke helt riktig ennå. Feltet markert med rødt stemmer ikke.' : 'Ikke helt riktig ennå. Feltene markert med rødt stemmer ikke.';
      else if (!solved) msg.textContent = '';
    }

    // ---------- Rotering ----------
    function rotate(k) {
      const s = doms[k];
      if (!s.at) {
        // h -> v -> h(snudd) -> v(snudd)
        if (s.vert) s.flip = !s.flip;
        s.vert = !s.vert;
        save(); render();
        return;
      }
      const at = s.at;
      const nextDir = at.dir === 'h' ? 'v' : 'h';
      const nextFlip = at.dir === 'v' ? !s.flip : s.flip;
      const oldFlip = s.flip;
      s.flip = nextFlip;
      const tries = nextDir === 'v'
        ? [{ r: at.r, c: at.c, dir: 'v' }, { r: at.r - 1, c: at.c, dir: 'v' }, { r: at.r, c: at.c + 1, dir: 'v' }, { r: at.r - 1, c: at.c + 1, dir: 'v' }]
        : [{ r: at.r, c: at.c, dir: 'h' }, { r: at.r, c: at.c - 1, dir: 'h' }, { r: at.r + 1, c: at.c, dir: 'h' }, { r: at.r + 1, c: at.c - 1, dir: 'h' }];
      const ok = tries.find((t) => fits(t, k));
      if (ok) { s.at = ok; save(); render(); return; }
      s.flip = oldFlip;
      const el = domEls[k];
      el.classList.remove('nope'); void el.offsetWidth; el.classList.add('nope');
    }

    // ---------- Dra og slipp ----------
    let drag = null;
    const cellSize = () => cellsEl.getBoundingClientRect().width / cols;

    function onDown(e) {
      const el = e.target.closest('.pp-dom');
      if (!el || solved) return;
      e.preventDefault();
      const k = +el.dataset.k;
      const r = el.getBoundingClientRect();
      drag = { k, el, x0: e.clientX, y0: e.clientY, moved: false, ox: e.clientX - r.left, oy: e.clientY - r.top, w: r.width, h: r.height };
      el.setPointerCapture(e.pointerId);
    }
    function onMove(e) {
      if (!drag) return;
      const dx = e.clientX - drag.x0, dy = e.clientY - drag.y0;
      if (!drag.moved && Math.hypot(dx, dy) < 6) return;
      const el = drag.el;
      if (!drag.moved) {
        drag.moved = true;
        const s = doms[drag.k];
        const vert = s.at ? s.at.dir === 'v' : s.vert;
        const cs = cellSize();
        // dra i full størrelse, med fingeren på samme sted (skalert)
        const fw = vert ? cs : cs * 2, fh = vert ? cs * 2 : cs;
        drag.ox *= fw / drag.w; drag.oy *= fh / drag.h;
        drag.fw = fw; drag.fh = fh; drag.vert = vert;
        el.classList.add('dragging');
        el.style.setProperty('--cell', `${cs}px`);
        document.body.append(el);
      }
      el.style.left = `${e.clientX - drag.ox}px`;
      el.style.top = `${e.clientY - drag.oy}px`;
    }
    function onUp(e) {
      if (!drag) return;
      const dr = drag;
      drag = null;
      if (!dr.moved) { rotate(dr.k); return; }
      const el = dr.el;
      el.classList.remove('dragging');
      el.style.left = el.style.top = '';
      el.style.removeProperty('--cell');
      // Hvilken rute havnet den første halvdelen over?
      const g = cellsEl.getBoundingClientRect();
      const cs = g.width / cols;
      const hx = e.clientX - dr.ox + cs / 2, hy = e.clientY - dr.oy + cs / 2;
      const c = Math.floor((hx - g.left) / cs), r = Math.floor((hy - g.top) / cs);
      const s = doms[dr.k];
      const at = { r, c, dir: dr.vert ? 'v' : 'h' };
      const overBoard = hx >= g.left - cs / 2 && hx <= g.right && hy >= g.top - cs / 2 && hy <= g.bottom;
      if (overBoard && fits(at, dr.k)) {
        s.at = at;
      } else if (!overBoard) {
        if (s.at) s.vert = s.at.dir === 'v';
        s.at = null;
      }
      save();
      render();
    }
    root.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    root.addEventListener('keydown', (e) => {
      const el = e.target.closest && e.target.closest('.pp-dom');
      if (el && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); rotate(+el.dataset.k); }
    });

    let finished = false;
    function win(animate) {
      if (finished) return;
      finished = true;
      msg.textContent = 'Alle betingelsene stemmer!';
      boardEl.classList.add('solved');
      setTimeout(() => onDone(true), animate ? 900 : 0);
    }

    render();
    if (solved) win(false);

    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      domEls.forEach((el) => { if (el.parentNode === document.body) el.remove(); });
    };
  }

  // Kun for testing: legg brikkene som i løsningen
  const solvedState = (puzzle) => {
    const d = decode(puzzle.data);
    const doms = d.tiling.map(([a, b], k) => {
      const first = (a[0] < b[0] || (a[0] === b[0] && a[1] < b[1])) ? a : b;
      const dir = a[0] === b[0] ? 'h' : 'v';
      const v = d.solution[`${first[0]},${first[1]}`];
      return { at: { r: first[0], c: first[1], dir }, flip: v !== d.dominoes[k][0], vert: dir === 'v' };
    });
    return { doms, solved: false };
  };

  return { mount, solvedState };
})();
