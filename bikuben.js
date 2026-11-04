// =============================================================
//  Bikuben (inspirert av Spelling Bee)
//  Lag ord med minst fire bokstaver. Midtbokstaven må alltid være med.
//  Et pangram bruker alle sju bokstavene.
//  Ordlisten lagres kodet (base64) slik at den ikke står i klartekst.
// =============================================================
window.Games = window.Games || {};

window.Games.bikuben = (function () {
  const decode = (s) => JSON.parse(decodeURIComponent(escape(atob(s))));
  // Nivåer i prosent av maks poeng
  const RANKS = [
    [0, 'Begynner'], [5, 'God start'], [12, 'På vei'], [22, 'Bra'],
    [35, 'Flott'], [50, 'Imponerende'], [70, 'Genialt'], [100, 'Bikubedronning']
  ];

  function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function mount(root, puzzle, day, onDone) {
    const d = decode(puzzle.data); // { center, outer: [...6], words: [...] }
    const letters = new Set([d.center, ...d.outer]);
    const valid = new Set(d.words.map((w) => w.toUpperCase()));
    const isPangram = (w) => [...letters].every((l) => w.includes(l));
    const points = (w) => (w.length === 4 ? 1 : w.length) + (isPangram(w) ? 7 : 0);
    const maxScore = [...valid].reduce((s, w) => s + points(w), 0);
    const storeKey = `advent-${day}`;

    let found = [], outer = d.outer.slice(), pangramDone = false;
    try {
      const s = JSON.parse(localStorage.getItem(storeKey));
      if (s && Array.isArray(s.found)) { found = s.found.filter((w) => valid.has(w)); pangramDone = !!s.pangramDone; }
    } catch (e) { /* ignorer */ }
    const save = () => {
      try { localStorage.setItem(storeKey, JSON.stringify({ found, pangramDone })); } catch (e) { /* ignorer */ }
    };

    let input = '';
    let pendingClear = false; // feil ord vises kort før det slettes

    root.innerHTML = `
      <div class="bk">
        <div class="bk-rank">
          <span class="bk-rank-name"></span>
          <div class="bk-track"><div class="bk-fill"></div></div>
          <span class="bk-score"></span>
        </div>
        <button type="button" class="bk-found-btn" aria-expanded="false"></button>
        <div class="bk-found" hidden></div>
        <p class="bk-msg" role="status" aria-live="polite"></p>
        <p class="bk-input" aria-live="polite"></p>
        <div class="bk-hive"></div>
        <div class="bk-actions">
          <button type="button" class="bk-btn" data-act="del">Slett</button>
          <button type="button" class="bk-btn round" data-act="shuffle" aria-label="Stokk bokstavene">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12a9 9 0 0 1 15.5-6.3L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15.5 6.3L3 16"/><path d="M3 21v-5h5"/></svg>
          </button>
          <button type="button" class="bk-btn" data-act="enter">Send inn</button>
        </div>
      </div>`;

    const hive = root.querySelector('.bk-hive');
    const inputEl = root.querySelector('.bk-input');
    const msg = root.querySelector('.bk-msg');
    const rankName = root.querySelector('.bk-rank-name');
    const fill = root.querySelector('.bk-fill');
    const scoreEl = root.querySelector('.bk-score');
    const foundBtn = root.querySelector('.bk-found-btn');
    const foundEl = root.querySelector('.bk-found');

    // Sekskanter: midten + seks rundt
    const POS = [[0, 0], [0, -1], [0.866, -0.5], [0.866, 0.5], [0, 1], [-0.866, 0.5], [-0.866, -0.5]];
    function drawHive() {
      hive.innerHTML = '';
      [d.center, ...outer].forEach((l, k) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'bk-cell' + (k === 0 ? ' center' : '');
        b.style.setProperty('--x', POS[k][0]);
        b.style.setProperty('--y', POS[k][1]);
        b.innerHTML = `<svg viewBox="0 0 100 87" aria-hidden="true"><polygon points="25,0 75,0 100,43.5 75,87 25,87 0,43.5"/></svg><span>${l}</span>`;
        b.setAttribute('aria-label', l + (k === 0 ? ', midtbokstav' : ''));
        b.addEventListener('click', () => type(l));
        hive.append(b);
      });
    }

    function score() { return found.reduce((s, w) => s + points(w), 0); }

    function drawStatus() {
      const sc = score();
      const pct = maxScore ? (sc / maxScore) * 100 : 0;
      let name = RANKS[0][1];
      RANKS.forEach(([p, n]) => { if (pct >= p) name = n; });
      rankName.textContent = name;
      fill.style.width = `${Math.min(100, pct)}%`;
      scoreEl.textContent = sc;
      foundBtn.textContent = found.length
        ? `Du har funnet ${found.length} ${found.length === 1 ? 'ord' : 'ord'}`
        : 'Du har ikke funnet noen ord ennå';
      foundEl.innerHTML = '';
      found.slice().sort((a, b) => a.localeCompare(b, 'nb')).forEach((w) => {
        const s = document.createElement('span');
        s.textContent = w;
        if (isPangram(w)) s.className = 'pangram';
        foundEl.append(s);
      });
    }

    function drawInput() {
      inputEl.innerHTML = '';
      [...input].forEach((l) => {
        const s = document.createElement('span');
        s.textContent = l;
        if (l === d.center) s.className = 'c';
        else if (!letters.has(l)) s.className = 'x';
        inputEl.append(s);
      });
      const caret = document.createElement('i');
      caret.className = 'bk-caret';
      inputEl.append(caret);
    }

    function say(text, cls) {
      msg.textContent = text;
      msg.className = 'bk-msg show ' + (cls || '');
      clearTimeout(say.t);
      say.t = setTimeout(() => { msg.className = 'bk-msg'; }, 1600);
    }

    function type(l) {
      if (pendingClear) { pendingClear = false; input = ''; inputEl.classList.remove('shake'); }
      if (input.length >= 19) return;
      input += l;
      drawInput();
    }

    function submit() {
      if (pendingClear) return;
      const w = input;
      if (!w) return;
      const fail = (t) => {
        say(t, 'bad');
        inputEl.classList.remove('shake'); void inputEl.offsetWidth; inputEl.classList.add('shake');
        pendingClear = true;
        setTimeout(() => { if (pendingClear) { pendingClear = false; input = ''; drawInput(); } }, 450);
      };
      if (w.length < 4) return fail('For kort');
      if (![...w].every((l) => letters.has(l))) return fail('Feil bokstaver');
      if (!w.includes(d.center)) return fail('Mangler midtbokstaven');
      if (found.includes(w)) return fail('Allerede funnet');
      if (!valid.has(w)) return fail('Ikke i ordlisten');
      found.push(w);
      input = '';
      drawInput();
      drawStatus();
      const pts = points(w);
      if (isPangram(w)) {
        say(`PANGRAM! +${pts}`, 'pangram');
        hive.classList.remove('party'); void hive.offsetWidth; hive.classList.add('party');
        if (!pangramDone) { pangramDone = true; save(); setTimeout(() => onDone(true), 1200); return; }
      } else {
        const praise = w.length >= 7 ? 'Fantastisk!' : w.length >= 5 ? 'Flott!' : 'Bra!';
        say(`${praise} +${pts}`, 'good');
      }
      save();
    }

    root.querySelector('.bk-actions').addEventListener('click', (e) => {
      const b = e.target.closest('.bk-btn');
      if (!b) return;
      if (b.dataset.act === 'del') { if (pendingClear) { pendingClear = false; input = ''; } input = input.slice(0, -1); drawInput(); }
      if (b.dataset.act === 'shuffle') { outer = shuffle(outer); drawHive(); }
      if (b.dataset.act === 'enter') submit();
    });
    foundBtn.addEventListener('click', () => {
      const open = foundEl.hidden;
      foundEl.hidden = !open;
      foundBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      foundBtn.classList.toggle('open', open);
    });

    function onKey(e) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === 'Enter') { e.preventDefault(); submit(); }
      else if (e.key === 'Backspace') { e.preventDefault(); if (pendingClear) { pendingClear = false; input = ''; } input = input.slice(0, -1); drawInput(); }
      else if (/^[a-zæøå]$/i.test(e.key)) type(e.key.toUpperCase());
    }
    document.addEventListener('keydown', onKey);

    drawHive();
    drawInput();
    drawStatus();
    if (pangramDone) setTimeout(() => onDone(true), 0);

    return () => { document.removeEventListener('keydown', onKey); clearTimeout(say.t); };
  }

  // Kun for testing: som om pangrammet er funnet
  const solvedState = (puzzle) => {
    const d = decode(puzzle.data);
    const L = [d.center, ...d.outer];
    const pg = d.words.map((w) => w.toUpperCase()).filter((w) => L.every((l) => w.includes(l)));
    return { found: pg, pangramDone: true };
  };

  return { mount, solvedState };
})();
