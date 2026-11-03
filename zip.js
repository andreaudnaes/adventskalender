// =============================================================
//  Zip: tegn én linje gjennom alle rutene, innom tallene i rekkefølge
// =============================================================
window.Games = window.Games || {};

window.Games.zip = (function () {
  function mount(root, puzzle, day, onDone) {
    const N = puzzle.size;
    const nums = {};            // celle -> tall
    let maxNum = 0;
    puzzle.numbers.forEach(([r, c, v]) => { nums[r * N + c] = v; maxNum = Math.max(maxNum, v); });
    const startCell = +Object.keys(nums).find((k) => nums[k] === 1);
    const storeKey = `advent-${day}`;

    let path = [];
    let solved = false;
    try {
      const s = JSON.parse(localStorage.getItem(storeKey));
      if (s && Array.isArray(s.path)) { path = s.path; solved = !!s.solved; }
    } catch (e) { /* ignorer */ }
    const save = () => {
      try { localStorage.setItem(storeKey, JSON.stringify({ path, solved })); } catch (e) { /* ignorer */ }
    };

    root.innerHTML = `
      <div class="zp" style="--n:${N}">
        <p class="zp-help">Dra en linje fra 1 til ${maxNum} gjennom alle rutene</p>
        <div class="zp-board">
          <div class="zp-grid" role="grid" aria-label="Zip ${N} ganger ${N}"></div>
          <svg class="zp-line" aria-hidden="true"><polyline/></svg>
          <div class="zp-nums" aria-hidden="true"></div>
        </div>
        <p class="zp-msg" role="status" aria-live="polite"></p>
        <div class="zp-actions">
          <button type="button" class="zp-btn" data-act="undo">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 14L4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-3"/></svg>Angre
          </button>
          <button type="button" class="zp-btn" data-act="clear">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></svg>Start på nytt
          </button>
        </div>
      </div>`;

    const grid = root.querySelector('.zp-grid');
    const svg = root.querySelector('.zp-line');
    const line = svg.querySelector('polyline');
    const numsEl = root.querySelector('.zp-nums');
    const msg = root.querySelector('.zp-msg');
    const board = root.querySelector('.zp-board');
    const actions = root.querySelector('.zp-actions');

    const cells = [];
    for (let i = 0; i < N * N; i++) {
      const c = document.createElement('div');
      c.className = 'zp-cell';
      c.setAttribute('role', 'gridcell');
      c.dataset.i = i;
      grid.append(c);
      cells.push(c);
    }
    const dots = {};
    Object.keys(nums).forEach((k) => {
      const i = +k;
      const d = document.createElement('div');
      d.className = 'zp-dot';
      d.textContent = nums[i];
      d.style.gridColumn = (i % N) + 1;
      d.style.gridRow = Math.floor(i / N) + 1;
      numsEl.append(d);
      dots[i] = d;
    });

    const adjacent = (a, b) => {
      const ra = Math.floor(a / N), ca = a % N, rb = Math.floor(b / N), cb = b % N;
      return Math.abs(ra - rb) + Math.abs(ca - cb) === 1;
    };
    const nextNumber = () => {
      let hi = 0;
      path.forEach((i) => { if (nums[i]) hi = Math.max(hi, nums[i]); });
      return hi + 1;
    };

    function draw() {
      const inPath = new Set(path);
      cells.forEach((c, i) => c.classList.toggle('on', inPath.has(i)));
      Object.keys(dots).forEach((k) => dots[k].classList.toggle('on', inPath.has(+k)));
      const pts = path.map((i) => `${(i % N) + 0.5},${Math.floor(i / N) + 0.5}`).join(' ');
      line.setAttribute('points', pts);
      svg.setAttribute('viewBox', `0 0 ${N} ${N}`);
    }

    function tryStep(i) {
      if (solved) return;
      if (path.length === 0) {
        if (i === startCell) { path = [i]; changed(); }
        else say('Start på 1');
        return;
      }
      const last = path[path.length - 1];
      if (i === last) return;
      // gå tilbake ett steg
      if (path.length > 1 && i === path[path.length - 2]) { path.pop(); changed(); return; }
      if (!adjacent(last, i) || path.includes(i)) return;
      if (nums[i] && nums[i] !== nextNumber()) {
        say(`Du må innom ${nextNumber()} først`);
        dots[i].classList.remove('nope');
        void dots[i].offsetWidth;
        dots[i].classList.add('nope');
        return;
      }
      if (nums[i] === maxNum && path.length !== N * N - 1) {
        say('Alle rutene må fylles før du ender på ' + maxNum);
        return;
      }
      path.push(i);
      changed();
    }

    function say(t) { msg.textContent = t; }

    function changed() {
      say('');
      draw();
      save();
      if (path.length === N * N && nums[path[path.length - 1]] === maxNum) win(true);
    }

    function win(animate) {
      solved = true;
      save();
      board.classList.add('solved');
      actions.classList.add('done');
      say('Hele brettet er fylt!');
      setTimeout(() => onDone(true), animate ? 1100 : 0);
    }

    // ---------- Trykk og dra ----------
    let dragging = false;
    const cellAt = (x, y) => {
      const r = grid.getBoundingClientRect();
      const col = Math.floor(((x - r.left) / r.width) * N);
      const row = Math.floor(((y - r.top) / r.height) * N);
      if (col < 0 || row < 0 || col >= N || row >= N) return -1;
      return row * N + col;
    };

    board.addEventListener('pointerdown', (e) => {
      if (solved) return;
      const i = cellAt(e.clientX, e.clientY);
      if (i < 0) return;
      e.preventDefault();
      dragging = true;
      const at = path.indexOf(i);
      if (at >= 0 && at < path.length - 1) { path = path.slice(0, at + 1); changed(); }
      else tryStep(i);
    });
    board.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const i = cellAt(e.clientX, e.clientY);
      if (i >= 0) tryStep(i);
    });
    const stop = () => { dragging = false; };
    window.addEventListener('pointerup', stop);
    window.addEventListener('pointercancel', stop);

    actions.addEventListener('click', (e) => {
      const b = e.target.closest('.zp-btn');
      if (!b || solved) return;
      if (b.dataset.act === 'undo' && path.length) path.pop();
      if (b.dataset.act === 'clear') path = [];
      changed();
    });

    draw();
    if (solved) win(false);

    return () => {
      window.removeEventListener('pointerup', stop);
      window.removeEventListener('pointercancel', stop);
    };
  }

  return { mount };
})();
