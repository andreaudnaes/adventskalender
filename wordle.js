// =============================================================
//  Ordgjetting (inspirert av Wordle)
//  Svaret lagres kodet slik at det ikke står i klartekst i koden.
// =============================================================
window.Games = window.Games || {};

window.Games.ordgjetting = (function () {
  const LENGTH = 5;
  const TRIES = 6;
  const ROWS = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', 'Å'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Ø', 'Æ'],
    ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACK']
  ];
  const BACK_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 5H9l-6 7 6 7h12z"/><path d="M17 9l-6 6M11 9l6 6"/></svg>';

  const decode = (s) => decodeURIComponent(escape(atob(s)));

  // Fargelegg et gjett: 'correct' | 'present' | 'absent'
  function score(guess, answer) {
    const res = Array(LENGTH).fill('absent');
    const left = {};
    for (let i = 0; i < LENGTH; i++) {
      if (guess[i] === answer[i]) res[i] = 'correct';
      else left[answer[i]] = (left[answer[i]] || 0) + 1;
    }
    for (let i = 0; i < LENGTH; i++) {
      if (res[i] !== 'correct' && left[guess[i]] > 0) {
        res[i] = 'present';
        left[guess[i]]--;
      }
    }
    return res;
  }

  function mount(root, puzzle, day, onDone) {
    const answer = decode(puzzle.answer).toUpperCase();
    const storeKey = `advent-${day}`;
    let saved = {};
    try { saved = JSON.parse(localStorage.getItem(storeKey)) || {}; } catch (e) { saved = {}; }

    const guesses = saved.guesses || [];
    let current = '';
    let finished = guesses.includes(answer) || guesses.length >= TRIES;
    let animating = false;
    const keyState = {};

    root.innerHTML = `
      <div class="wg">
        <div class="wg-board" role="grid" aria-label="Ordgjetting"></div>
        <p class="wg-msg" role="status" aria-live="polite"></p>
        <div class="wg-keys"></div>
      </div>`;
    const board = root.querySelector('.wg-board');
    const msg = root.querySelector('.wg-msg');
    const keys = root.querySelector('.wg-keys');

    // Brett
    const tiles = [];
    for (let r = 0; r < TRIES; r++) {
      const row = document.createElement('div');
      row.className = 'wg-row';
      row.setAttribute('role', 'row');
      tiles[r] = [];
      for (let c = 0; c < LENGTH; c++) {
        const t = document.createElement('div');
        t.className = 'wg-tile';
        t.setAttribute('role', 'gridcell');
        row.append(t);
        tiles[r].push(t);
      }
      board.append(row);
    }

    // Tastatur
    const keyEls = {};
    ROWS.forEach((r) => {
      const row = document.createElement('div');
      row.className = 'wg-keyrow';
      r.forEach((k) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'wg-key';
        if (k === 'ENTER') { b.textContent = 'Gjett'; b.classList.add('wide'); }
        else if (k === 'BACK') { b.innerHTML = BACK_ICON; b.classList.add('wide'); b.setAttribute('aria-label', 'Slett'); }
        else { b.textContent = k; keyEls[k] = b; }
        b.addEventListener('click', () => press(k));
        row.append(b);
      });
      keys.append(row);
    });

    function save() {
      try { localStorage.setItem(storeKey, JSON.stringify({ guesses })); } catch (e) { /* ignorer */ }
    }

    function paintKeys(guess, res) {
      const rank = { absent: 1, present: 2, correct: 3 };
      for (let i = 0; i < LENGTH; i++) {
        const l = guess[i];
        if (!keyState[l] || rank[res[i]] > rank[keyState[l]]) keyState[l] = res[i];
        if (keyEls[l]) keyEls[l].dataset.state = keyState[l];
      }
    }

    function showRow(r, guess, animate) {
      const res = score(guess, answer);
      tiles[r].forEach((t, i) => {
        t.textContent = guess[i];
        t.classList.add('filled');
        if (animate) {
          setTimeout(() => {
            t.classList.add('flip');
            setTimeout(() => { t.dataset.state = res[i]; }, 250);
          }, i * 280);
        } else {
          t.dataset.state = res[i];
        }
      });
      if (animate) setTimeout(() => paintKeys(guess, res), LENGTH * 280 + 250);
      else paintKeys(guess, res);
    }

    function drawCurrent() {
      const r = guesses.length;
      if (r >= TRIES) return;
      tiles[r].forEach((t, i) => {
        t.textContent = current[i] || '';
        t.classList.toggle('filled', !!current[i]);
      });
    }

    function shakeRow() {
      const row = board.children[guesses.length];
      row.classList.remove('shake');
      void row.offsetWidth;
      row.classList.add('shake');
    }

    function say(text) { msg.textContent = text; }

    function end(won, animate) {
      finished = true;
      const delay = animate ? LENGTH * 280 + 500 : 0;
      setTimeout(() => {
        if (won) {
          const praise = ['Genialt!', 'Imponerende!', 'Strålende!', 'Flott!', 'Godt jobbet!', 'Puh, akkurat!'];
          say(praise[guesses.length - 1] || 'Riktig!');
          board.children[guesses.length - 1].classList.add('win');
        } else {
          say(`Ordet var ${answer}`);
        }
        keys.classList.add('done');
        setTimeout(() => onDone(won), animate ? 900 : 0);
      }, delay);
    }

    function press(k) {
      if (finished || animating) return;
      if (k === 'BACK') { current = current.slice(0, -1); drawCurrent(); say(''); return; }
      if (k === 'ENTER') {
        if (current.length < LENGTH) { shakeRow(); say('For få bokstaver'); return; }
        const valid = current === answer || !window.WORDS5 || window.WORDS5.has(current);
        if (!valid) { shakeRow(); say('Ikke i ordlisten'); return; }
        const guess = current;
        const r = guesses.length;
        guesses.push(guess);
        current = '';
        save();
        say('');
        animating = true;
        showRow(r, guess, true);
        setTimeout(() => { animating = false; }, LENGTH * 280 + 250);
        if (guess === answer) end(true, true);
        else if (guesses.length >= TRIES) end(false, true);
        return;
      }
      if (current.length < LENGTH) { current += k; drawCurrent(); }
    }

    function onKey(e) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === 'Enter') { e.preventDefault(); press('ENTER'); }
      else if (e.key === 'Backspace') { e.preventDefault(); press('BACK'); }
      else if (/^[a-zæøå]$/i.test(e.key)) press(e.key.toUpperCase());
    }
    document.addEventListener('keydown', onKey);

    // Gjenopprett tidligere gjett
    guesses.forEach((g, r) => showRow(r, g, false));
    if (finished) end(guesses.includes(answer), false);

    // Returner en opprydder
    return () => document.removeEventListener('keydown', onKey);
  }

  return { mount };
})();
