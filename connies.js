// =============================================================
//  Connies: finn fire grupper med fire ord
//  Gruppene lagres kodet (base64) slik at de ikke står i klartekst.
// =============================================================
window.Games = window.Games || {};

window.Games.connies = (function () {
  const MISTAKES = 4;
  const decode = (s) => JSON.parse(decodeURIComponent(escape(atob(s))));

  function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function mount(root, puzzle, day, onDone) {
    const groups = decode(puzzle.data); // [{ title, color, words: [...] }]
    const groupOf = {};
    groups.forEach((g, gi) => g.words.forEach((w) => { groupOf[w] = gi; }));
    const allWords = groups.flatMap((g) => g.words);
    const storeKey = `advent-${day}`;

    let order, solved, mistakes, guesses;
    function fresh() {
      order = shuffle(allWords.slice());
      solved = [];
      mistakes = 0;
      guesses = [];
    }
    fresh();
    try {
      const s = JSON.parse(localStorage.getItem(storeKey));
      if (s && Array.isArray(s.order) && s.order.slice().sort().join() === allWords.slice().sort().join()) {
        order = s.order; solved = s.solved || []; mistakes = s.mistakes || 0; guesses = s.guesses || [];
      }
    } catch (e) { /* ignorer */ }
    const save = () => {
      try { localStorage.setItem(storeKey, JSON.stringify({ order, solved, mistakes, guesses })); } catch (e) { /* ignorer */ }
    };

    let selected = [];
    let busy = false;

    root.innerHTML = `
      <div class="cn">
        <p class="cn-help">Finn fire grupper med fire ord som hører sammen</p>
        <div class="cn-grid"></div>
        <div class="cn-mistakes" aria-live="polite"></div>
        <div class="cn-actions">
          <button type="button" class="cn-btn" data-act="shuffle">Stokk</button>
          <button type="button" class="cn-btn" data-act="clear">Fjern valg</button>
          <button type="button" class="cn-btn primary" data-act="submit" disabled>Send inn</button>
        </div>
        <div class="cn-fail" hidden>
          <p class="cn-fail-title">Tomt for forsøk</p>
          <p class="cn-fail-text">Ordene stokkes på nytt, og du får fire nye forsøk.</p>
          <button type="button" class="cn-retry">Prøv igjen</button>
        </div>
      </div>`;

    const grid = root.querySelector('.cn-grid');
    const mistakesEl = root.querySelector('.cn-mistakes');
    const actions = root.querySelector('.cn-actions');
    const submitBtn = root.querySelector('[data-act="submit"]');
    const failEl = root.querySelector('.cn-fail');

    // Én knapp per ord, gjenbrukes slik at de kan gli når rekkefølgen endres
    const tileOf = {};
    allWords.forEach((w) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'cn-tile';
      b.textContent = w;
      if (w.length > 12) b.classList.add('xs');
      else if (w.length > 9) b.classList.add('sm');
      b.addEventListener('click', () => toggle(w));
      tileOf[w] = b;
    });

    function banner(gi) {
      const g = groups[gi];
      const el = document.createElement('div');
      el.className = 'cn-banner';
      el.style.background = g.color;
      el.innerHTML = '<p class="cn-banner-title"></p><p class="cn-banner-words"></p>';
      el.querySelector('.cn-banner-title').textContent = g.title;
      el.querySelector('.cn-banner-words').textContent = g.words.join(', ');
      return el;
    }

    // Tegn rutenettet: løste grupper øverst, deretter ordene som er igjen
    function render(animate) {
      const before = {};
      if (animate) allWords.forEach((w) => { if (tileOf[w].isConnected) before[w] = tileOf[w].getBoundingClientRect(); });

      grid.innerHTML = '';
      solved.forEach((gi) => grid.append(banner(gi)));
      const left = order.filter((w) => !solved.includes(groupOf[w]));
      left.forEach((w) => {
        const t = tileOf[w];
        t.classList.toggle('on', selected.includes(w));
        t.setAttribute('aria-pressed', selected.includes(w) ? 'true' : 'false');
        grid.append(t);
      });

      // Animer brikkene fra gammel til ny plass
      if (animate) {
        left.forEach((w) => {
          const a = before[w];
          if (!a) return;
          const b = tileOf[w].getBoundingClientRect();
          const dx = a.left - b.left, dy = a.top - b.top;
          if (!dx && !dy) return;
          const t = tileOf[w];
          t.style.transition = 'none';
          t.style.transform = `translate(${dx}px, ${dy}px)`;
          void t.offsetWidth;
          t.style.transition = '';
          t.style.transform = '';
        });
      }

      mistakesEl.innerHTML = 'Feil igjen: ' + Array.from({ length: MISTAKES }, (_, i) =>
        `<span class="cn-dot${i < MISTAKES - mistakes ? '' : ' used'}"></span>`).join('');
      mistakesEl.setAttribute('aria-label', `${MISTAKES - mistakes} feil igjen`);
      submitBtn.disabled = selected.length !== 4;
    }

    function toggle(w) {
      if (busy || solved.length === 4 || mistakes >= MISTAKES) return;
      if (selected.includes(w)) selected = selected.filter((x) => x !== w);
      else if (selected.length < 4) selected.push(w);
      render(false);
    }

    // Kort beskjed øverst på skjermen
    function toast(text) {
      let t = document.querySelector('.cn-toast');
      if (!t) {
        t = document.createElement('div');
        t.className = 'cn-toast';
        t.setAttribute('role', 'status');
        document.body.append(t);
      }
      t.textContent = text;
      t.classList.remove('show');
      void t.offsetWidth;
      t.classList.add('show');
      clearTimeout(t._timer);
      t._timer = setTimeout(() => t.classList.remove('show'), 1800);
    }

    function submit() {
      if (busy || selected.length !== 4) return;
      const key = selected.slice().sort().join('|');
      if (guesses.includes(key)) { toast('Allerede gjettet'); return; }
      guesses.push(key);

      // Små hopp på de valgte brikkene, som i originalen
      busy = true;
      selected.forEach((w, i) => {
        const t = tileOf[w];
        setTimeout(() => {
          t.classList.remove('hop');
          void t.offsetWidth;
          t.classList.add('hop');
        }, i * 90);
      });

      const counts = {};
      selected.forEach((w) => { counts[groupOf[w]] = (counts[groupOf[w]] || 0) + 1; });
      const best = Math.max(...Object.values(counts));
      const gi = +Object.keys(counts).find((k) => counts[k] === best);

      setTimeout(() => {
        if (best === 4) {
          // Flytt de riktige ordene til øverste ledige rad, så slå dem sammen
          const left = order.filter((w) => !solved.includes(groupOf[w]) && !selected.includes(w));
          order = order.filter((w) => solved.includes(groupOf[w])).concat(selected, left);
          render(true);
          setTimeout(() => {
            solved.push(gi);
            selected = [];
            save();
            render(false);
            const b = grid.children[solved.length - 1];
            if (b) b.classList.add('pop');
            busy = false;
            if (solved.length === 4) win(true);
          }, 450);
        } else {
          mistakes++;
          if (best === 3) toast('En unna …');
          selected.forEach((w) => {
            const t = tileOf[w];
            t.classList.remove('shake');
            void t.offsetWidth;
            t.classList.add('shake');
          });
          save();
          render(false);
          busy = false;
          if (mistakes >= MISTAKES) setTimeout(() => { failEl.hidden = false; }, 700);
        }
      }, 450);
    }

    actions.addEventListener('click', (e) => {
      const b = e.target.closest('.cn-btn');
      if (!b || busy) return;
      if (b.dataset.act === 'shuffle') {
        const left = shuffle(order.filter((w) => !solved.includes(groupOf[w])));
        order = order.filter((w) => solved.includes(groupOf[w])).concat(left);
        save();
        render(true);
      }
      if (b.dataset.act === 'clear') { selected = []; render(false); }
      if (b.dataset.act === 'submit') submit();
    });

    root.querySelector('.cn-retry').addEventListener('click', () => {
      fresh(); selected = []; save(); failEl.hidden = true; render(false);
    });

    function win(animate) {
      actions.classList.add('done');
      mistakesEl.classList.add('done');
      setTimeout(() => onDone(true), animate ? 900 : 0);
    }

    render(false);
    if (solved.length === 4) win(false);
    else if (mistakes >= MISTAKES) failEl.hidden = false;

    return () => {
      const t = document.querySelector('.cn-toast');
      if (t) t.remove();
    };
  }

  // Kun for testing: lagret tilstand som om alle gruppene er funnet
  const solvedState = (puzzle) => {
    const groups = decode(puzzle.data);
    return { order: groups.flatMap((g) => g.words), solved: [0, 1, 2, 3], mistakes: 0, guesses: [] };
  };

  return { mount, solvedState };
})();
