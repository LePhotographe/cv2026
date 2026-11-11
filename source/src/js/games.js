/* Jeux de la session invité : Démineur et Flipper. Dessin, règles et physique maison. */
(function () {
  'use strict';
  const X = window.XP, Sfx = window.Sfx;
  const { $, $$, T, WM, menubar, msg } = X;
  const store = { get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : v; } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* ignoré */ } } };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  function fitWindow(W, box) {
    if (W.el.classList.contains('is-max')) return;
    const area = $('#wins'), bar = $('.mbar', W.body);
    const w = Math.min(box.offsetWidth + 6, area.clientWidth - 8);
    const h = Math.min(box.offsetHeight + (bar ? bar.offsetHeight : 0) + W.el.offsetHeight - W.body.offsetHeight, area.clientHeight - 8);
    Object.assign(W.el.style, { width: w + 'px', height: h + 'px' });
    W.el.style.left = clamp(W.el.offsetLeft, 0, Math.max(0, area.clientWidth - w)) + 'px';
    W.el.style.top = clamp(W.el.offsetTop, 0, Math.max(0, area.clientHeight - h)) + 'px';
  }

  /* =========================================================
     Démineur
     ========================================================= */
  const LV = { deb: { w: 9, h: 9, m: 10, label: 'Débutant' }, int: { w: 16, h: 16, m: 40, label: 'Intermédiaire' }, exp: { w: 30, h: 16, m: 99, label: 'Expert' } };
  const SEG = { 0: 'abcdef', 1: 'bc', 2: 'abged', 3: 'abgcd', 4: 'fgbc', 5: 'afgcd', 6: 'afgedc', 7: 'abc', 8: 'abcdefg', 9: 'abcdfg', '-': 'g' };
  const SP = { a: 'M2.5 1h8l-1.6 2H4.1z', b: 'M12 2.2v8l-1.8-1.3V4z', c: 'M12 11.8v8l-1.8-1.8v-4.9z', d: 'M2.5 21h8l-1.6-2H4.1z', e: 'M1 11.8v8l1.8-1.8v-4.9z', f: 'M1 2.2v8l1.8-1.3V4z', g: 'M2.4 11l1.5-1.1h5.2l1.5 1.1-1.5 1.1H3.9z' };
  function lcd(n) {
    const s = n < 0 ? '-' + String(Math.min(99, -n)).padStart(2, '0') : String(Math.min(999, n)).padStart(3, '0');
    return s.split('').map(ch => '<svg viewBox="0 0 13 22" aria-hidden="true">' + Object.keys(SP).map(k => '<path d="' + SP[k] + '" fill="' + ((SEG[ch] || '').includes(k) ? '#ff2b1c' : '#420804') + '"/>').join('') + '</svg>').join('');
  }
  function face(kind) {
    const eyes = '<circle cx="8.6" cy="9.6" r="1.4"/><circle cx="15.4" cy="9.6" r="1.4"/>';
    const parts = {
      smile: eyes + '<path d="M7.4 14.2q4.6 4.6 9.2 0" fill="none" stroke="#000" stroke-width="1.4" stroke-linecap="round"/>',
      oh: eyes + '<circle cx="12" cy="15.6" r="2.2" fill="none" stroke="#000" stroke-width="1.4"/>',
      cool: '<path d="M4.6 8.2h6.2v3.2a1.6 1.6 0 0 1-1.6 1.6H6.2a1.6 1.6 0 0 1-1.6-1.6zM13.2 8.2h6.2v3.2a1.6 1.6 0 0 1-1.6 1.6h-3a1.6 1.6 0 0 1-1.6-1.6z"/><path d="M10.8 9h2.4M2.8 8.6l1.8-.4M21.2 8.6l-1.8-.4" stroke="#000" stroke-width="1.1"/><path d="M7.6 15q4.4 3.8 8.8 0" fill="none" stroke="#000" stroke-width="1.4" stroke-linecap="round"/>',
      dead: '<path d="M7.2 8l3 3M10.2 8l-3 3M13.8 8l3 3M16.8 8l-3 3" stroke="#000" stroke-width="1.4" stroke-linecap="round"/><path d="M8 17.4q4-3.6 8 0" fill="none" stroke="#000" stroke-width="1.4" stroke-linecap="round"/>'
    };
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10.4" fill="#ffe14a" stroke="#000" stroke-width="1.1"/><g fill="#000">' + parts[kind] + '</g></svg>';
  }
  function minesApp() {
    if (WM.get('mines')) { WM.focus('mines'); return WM.get('mines'); }
    const G = { lv: LV[store.get('ac.mines.lv', 'deb')] ? store.get('ac.mines.lv', 'deb') : 'deb', timer: 0 };
    const html = '<div class="ms" tabindex="0"><div class="ms-frame"><div class="ms-panel"><div class="ms-lcd" data-lcd="m"></div><button class="ms-face" type="button" aria-label="Nouvelle partie"></button><div class="ms-lcd" data-lcd="t"></div></div><div class="ms-grid" role="grid" aria-label="Champ de mines"></div></div></div>';
    const W = WM.create('mines', { title: 'Démineur', icon: 'mines', w: 220, h: 300, html, kind: 'game', cls: 'win--fixed', ctrls: ['min', 'close'], focus: '.ms', onClose: () => clearInterval(G.timer) });
    const box = $('.ms', W.body), grid = $('.ms-grid', W.body), faceBtn = $('.ms-face', W.body);
    const setFace = k => { faceBtn.innerHTML = face(k); };
    const over = () => G.state === 'won' || G.state === 'lost';
    const restFace = () => setFace(G.state === 'lost' ? 'dead' : G.state === 'won' ? 'cool' : 'smile');
    const nb = i => { const x = i % G.w, y = (i / G.w) | 0, out = []; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { if (!dx && !dy) continue; const nx = x + dx, ny = y + dy; if (nx >= 0 && ny >= 0 && nx < G.w && ny < G.h) out.push(ny * G.w + nx); } return out; };
    function panel() { $('[data-lcd="m"]', W.body).innerHTML = lcd(G.m - G.flags); $('[data-lcd="t"]', W.body).innerHTML = lcd(G.t); }
    function newGame() {
      clearInterval(G.timer);
      const L = LV[G.lv];
      Object.assign(G, { w: L.w, h: L.h, m: L.m, state: 'ready', t: 0, flags: 0, opened: 0, mine: new Uint8Array(L.w * L.h), open: new Uint8Array(L.w * L.h), flag: new Uint8Array(L.w * L.h), cnt: new Uint8Array(L.w * L.h) });
      const cell = X.small() ? clamp(Math.floor((innerWidth - 44) / L.w), 18, 34) : ({ deb: 24, int: 22, exp: 20 })[G.lv] || 20;
      grid.style.setProperty('--cols', L.w); grid.style.setProperty('--cell', cell + 'px');
      grid.innerHTML = Array.from({ length: L.w * L.h }, (_, i) => '<button class="c" type="button" tabindex="-1" data-i="' + i + '" aria-label="Case"></button>').join('');
      G.cells = $$('.c', grid);
      setFace('smile'); panel(); fitWindow(W, box);
    }
    function place(safe) {
      const keep = new Set([safe, ...nb(safe)]), free = [];
      for (let i = 0; i < G.w * G.h; i++) if (!keep.has(i)) free.push(i);
      for (let k = 0; k < G.m; k++) { const j = k + Math.floor(Math.random() * (free.length - k)); [free[k], free[j]] = [free[j], free[k]]; G.mine[free[k]] = 1; }
      for (let i = 0; i < G.w * G.h; i++) G.cnt[i] = nb(i).reduce((n, j) => n + G.mine[j], 0);
      G.state = 'play';
      G.t = 1; panel();
      G.timer = setInterval(() => { if (G.t < 999) { G.t++; panel(); } }, 1000);
    }
    function paint(i) {
      const c = G.cells[i];
      if (G.open[i]) { c.className = 'c o' + (G.cnt[i] ? ' n' + G.cnt[i] : ''); c.textContent = G.cnt[i] || ''; }
      else c.className = 'c' + (G.flag[i] ? ' f' : '');
    }
    function reveal(i) {
      if (G.state === 'ready') place(i);
      if (G.flag[i] || G.open[i]) return;
      if (G.mine[i]) { lose(i); return; }
      const stack = [i];
      while (stack.length) {
        const j = stack.pop();
        if (G.open[j] || G.flag[j]) continue;
        G.open[j] = 1; G.opened++; paint(j);
        if (!G.cnt[j]) nb(j).forEach(k => { if (!G.open[k] && !G.mine[k]) stack.push(k); });
      }
      if (G.opened === G.w * G.h - G.m) win();
    }
    function chord(i) {
      if (!G.open[i] || !G.cnt[i] || over()) return;
      const n = nb(i);
      if (n.reduce((s, j) => s + G.flag[j], 0) !== G.cnt[i]) return;
      n.forEach(j => { if (!G.flag[j] && !G.open[j] && !over()) reveal(j); });
    }
    function toggleFlag(i) {
      if (G.open[i] || over()) return;
      G.flag[i] ^= 1; G.flags += G.flag[i] ? 1 : -1; paint(i); panel(); Sfx.nav();
    }
    function lose(i) {
      G.state = 'lost'; clearInterval(G.timer);
      for (let j = 0; j < G.w * G.h; j++) {
        const c = G.cells[j];
        if (G.mine[j] && !G.flag[j]) c.className = 'c o m' + (j === i ? ' x' : '');
        else if (!G.mine[j] && G.flag[j]) c.className = 'c o w';
      }
      setFace('dead'); Sfx.deny(); Sfx.splash();
    }
    function win() {
      G.state = 'won'; clearInterval(G.timer);
      for (let j = 0; j < G.w * G.h; j++) if (G.mine[j] && !G.flag[j]) { G.flag[j] = 1; paint(j); }
      G.flags = G.m; panel(); setFace('cool'); Sfx.fanfare();
      const key = 'ac.mines.best.' + G.lv, best = parseInt(store.get(key, '0'), 10) || 0;
      if (!best || G.t < best) {
        store.set(key, String(G.t));
        setTimeout(() => msg({ title: 'Démineur', icon: 'mines', w: 340, html: '<p><b>' + T('Nouveau record !') + '</b></p><p>' + T('Niveau ' + LV[G.lv].label + ' terminé en ' + G.t + ' secondes : c’est le meilleur temps sur ce poste.') + '</p>' }), 500);
      }
    }
    // Souris : clic gauche pour découvrir, clic droit pour un drapeau, double-clic sur un chiffre pour dégager autour.
    // Tactile : toucher pour découvrir, appui long pour un drapeau.
    let lp = 0, lpDone = false;
    grid.addEventListener('contextmenu', e => e.preventDefault());
    grid.addEventListener('pointerdown', e => {
      const c = e.target.closest('.c'); if (!c || over()) return;
      const i = +c.dataset.i;
      if (e.pointerType === 'mouse') { if (e.button === 2) { toggleFlag(i); return; } if (e.button === 0) setFace('oh'); return; }
      lpDone = false; clearTimeout(lp); setFace('oh');
      lp = setTimeout(() => { lpDone = true; toggleFlag(i); restFace(); try { navigator.vibrate && navigator.vibrate(25); } catch (err) { /* ignoré */ } }, 420);
    });
    grid.addEventListener('pointerup', e => {
      clearTimeout(lp);
      const c = e.target.closest('.c');
      if (!over()) restFace();
      if (!c || over()) return;
      const i = +c.dataset.i;
      if (e.pointerType !== 'mouse') { if (!lpDone) { if (G.open[i]) chord(i); else reveal(i); } }
      else if (e.button === 0) { if (G.open[i]) chord(i); else reveal(i); }
      else if (e.button === 1) chord(i);
      restFace();
    });
    grid.addEventListener('pointerleave', () => { clearTimeout(lp); if (!over()) restFace(); });
    faceBtn.addEventListener('click', () => { Sfx.pop(); newGame(); });
    box.addEventListener('keydown', e => { if (e.key === 'F2') { e.preventDefault(); newGame(); } });
    function bestTimes() {
      msg({ id: 'mines-best', title: 'Meilleurs temps', icon: 'mines', w: 320, sound: false,
        html: Object.keys(LV).map(k => { const b = parseInt(store.get('ac.mines.best.' + k, '0'), 10) || 0; return '<p>' + T(LV[k].label + ' : ') + '<b>' + (b ? b + ' s' : '–') + '</b></p>'; }).join(''),
        buttons: [{ id: 'reset', label: 'Effacer les scores' }, { id: 'ok', label: 'OK', def: true }],
        onButton: b => { if (b === 'reset') Object.keys(LV).forEach(k => { try { localStorage.removeItem('ac.mines.best.' + k); } catch (e) { /* ignoré */ } }); } });
    }
    const act = cmd => {
      if (cmd === 'new') newGame();
      else if (LV[cmd]) { G.lv = cmd; store.set('ac.mines.lv', cmd); newGame(); }
      else if (cmd === 'best') bestTimes();
      else if (cmd === 'quit') WM.close('mines');
      else if (cmd === 'howto') msg({ id: 'mines-howto', title: 'Comment jouer', icon: 'help', w: 400, sound: false, html: '<p>' + T('Découvrez toutes les cases sans mine. Chaque chiffre indique combien de mines touchent la case.') + '</p><p><b>' + T('Souris :') + '</b> ' + T('clic gauche pour découvrir, clic droit pour poser un drapeau, double-clic sur un chiffre pour dégager autour.') + '</p><p><b>' + T('Tactile :') + '</b> ' + T('touchez pour découvrir, appui long pour un drapeau.') + '</p>' });
      else if (cmd === 'about') msg({ id: 'mines-about', title: 'À propos du Démineur', icon: 'mines', w: 360, sound: false, html: '<p><b>Démineur</b></p><p>' + T('Une version maison du grand classique, dessinée et programmée pour ce bureau.') + '</p>' });
    };
    box.parentNode.insertBefore(menubar([
      { label: 'Partie', items: () => [{ id: 'new', label: 'Nouvelle partie', key: 'F2' }, { sep: true }, ...Object.keys(LV).map(k => ({ id: k, label: LV[k].label, radio: true, checked: G.lv === k })), { sep: true }, { id: 'best', label: 'Meilleurs temps…' }, { sep: true }, { id: 'quit', label: 'Quitter' }] },
      { label: '?', items: [{ id: 'howto', label: 'Comment jouer' }, { sep: true }, { id: 'about', label: 'À propos du Démineur' }] }
    ], act), box);
    newGame();
    return W;
  }

  /* =========================================================
     Flipper
     ========================================================= */
  const PW = 360, PH = 600, BR = 8, GRAV = 1050, VMAXB = 1600;
  const arc = (cx, cy, r, a0, a1, n) => Array.from({ length: n }, (_, i) => { const t0 = a0 + (a1 - a0) * i / n, t1 = a0 + (a1 - a0) * (i + 1) / n; return [cx + r * Math.cos(t0), cy + r * Math.sin(t0), cx + r * Math.cos(t1), cy + r * Math.sin(t1)]; });
  const TB = {
    walls: arc(180, 170, 160, Math.PI, 2 * Math.PI, 30).concat([[20, 170, 20, 470], [20, 470, 100, 529], [340, 170, 340, 600], [300, 600, 340, 600], [300, 232, 300, 600], [300, 470, 220, 529],
      [45, 395, 45, 455], [45, 455, 86, 482], [275, 395, 275, 455], [275, 455, 234, 482]]),
    slings: [[45, 395, 86, 482], [275, 395, 234, 482]],
    posts: [92, 127, 162, 197, 232].map(x => [x, 64, x, 90]),
    lanes: [92, 127, 162, 197, 232],
    bumpers: [{ x: 112, y: 205, r: 17 }, { x: 208, y: 205, r: 17 }, { x: 160, y: 262, r: 17 }],
    hole: { x: 52, y: 300, r: 11 },
    flippers: [{ px: 100, py: 535, rest: 0.49, up: -0.45, len: 50 }, { px: 220, py: 535, rest: Math.PI - 0.49, up: Math.PI + 0.45, len: 50 }]
  };
  let N = null;
  function hitSeg(b, s, e, rad, vel) {
    const ex = s[2] - s[0], ey = s[3] - s[1], l2 = ex * ex + ey * ey;
    let t = l2 ? ((b.x - s[0]) * ex + (b.y - s[1]) * ey) / l2 : 0; t = t < 0 ? 0 : t > 1 ? 1 : t;
    const px = s[0] + ex * t, py = s[1] + ey * t;
    let nx = b.x - px, ny = b.y - py; const d = Math.hypot(nx, ny), min = BR + rad;
    if (d >= min || d < 1e-6) return 0;
    nx /= d; ny /= d; b.x = px + nx * min; b.y = py + ny * min;
    let wx = 0, wy = 0; if (vel) [wx, wy] = vel(px, py);
    const vn = (b.vx - wx) * nx + (b.vy - wy) * ny;
    N = [nx, ny];
    if (vn >= 0) return 0;
    b.vx -= (1 + e) * vn * nx; b.vy -= (1 + e) * vn * ny;
    return -vn;
  }
  function flipperApp() {
    if (WM.get('flipper')) { WM.focus('flipper'); return WM.get('flipper'); }
    const html = '<div class="pb"><div class="pb-stage"><canvas class="pb-cv" tabindex="0" aria-label="Table de flipper"></canvas></div>' +
      '<div class="pb-side"><div class="pb-logo">FLIPPER<span>GREEN</span></div><dl><dt>Score</dt><dd class="pb-score">0</dd><dt>Balle</dt><dd class="pb-ball">1 / 3</dd><dt>Bonus</dt><dd class="pb-mult">x1</dd><dt>Record</dt><dd class="pb-best">0</dd></dl>' +
      '<p class="pb-msg"></p><p class="pb-help">' + T('← → ou Z / M : flippers') + '<br>' + T('Espace : lancer la balle') + '<br>F2 : nouvelle partie</p></div></div>';
    const G = { alive: true, paused: false, raf: 0, last: 0, time: 0 };
    const W = WM.create('flipper', { title: 'Flipper', icon: 'flipper', w: 520, h: 660, html, kind: 'game', ctrls: ['min', 'max', 'close'], focus: '.pb-cv', minW: 300, minH: 320,
      onClose: () => { G.alive = false; cancelAnimationFrame(G.raf); if (G.ro) G.ro.disconnect(); },
      onMin: () => { G.paused = true; }, onRestore: () => { G.paused = false; kick(); }, onResize: () => layout() });
    const cv = $('.pb-cv', W.body), ctx = cv.getContext('2d'), stage = $('.pb-stage', W.body);
    const ui = k => $('.pb-' + k, W.body);
    const F = TB.flippers.map(f => ({ ...f, a: f.rest, w: 0, on: false }));
    function say(t) { ui('msg').textContent = X.fr(t); G.msgT = G.time; }
    function hud() {
      ui('score').textContent = G.score.toLocaleString('fr-FR'); ui('ball').textContent = Math.min(G.balls, 3) + ' / 3';
      ui('mult').textContent = 'x' + G.mult; ui('best').textContent = (parseInt(store.get('ac.pb.best', '0'), 10) || 0).toLocaleString('fr-FR');
    }
    function newBall() { G.ball = { x: 320, y: 592 - 0.5, vx: 0, vy: 0 }; G.held = false; G.idle = 0; G.charge = 0; G.charging = false; }
    function newGame() {
      Object.assign(G, { score: 0, balls: 3, mult: 1, lit: [0, 0, 0, 0], inLane: [0, 0, 0, 0], over: false, flash: {} });
      newBall(); hud(); say('Espace pour lancer la balle'); Sfx.chime();
    }
    const add = p => { G.score += p * G.mult; hud(); };
    const ready = () => G.ball && !G.held && !G.over && G.ball.x > 300 && G.ball.y > 560 && Math.hypot(G.ball.vx, G.ball.vy) < 40;
    function launch() {
      if (!ready()) { G.charging = false; G.charge = 0; return; }
      G.ball.vy = -(1060 + 480 * G.charge); G.ball.vx = 0;
      G.charging = false; G.charge = 0; Sfx.swoosh();
    }
    function lost() {
      G.balls--; Sfx.deny();
      if (G.balls > 0) { say('Balle perdue'); G.ball = null; setTimeout(() => { if (G.alive && !G.over) { newBall(); hud(); say('Espace pour lancer la balle'); } }, 1200); }
      else {
        G.over = true; G.ball = null;
        const best = parseInt(store.get('ac.pb.best', '0'), 10) || 0;
        if (G.score > best) { store.set('ac.pb.best', String(G.score)); say('Partie terminée. Nouveau record !'); Sfx.fanfare(); }
        else say('Partie terminée. F2 pour rejouer');
      }
      hud();
    }
    function step(h) {
      F.forEach(f => {
        const tgt = f.on ? f.up : f.rest, d = tgt - f.a, sp = (f.on ? 24 : 15) * h;
        const da = Math.abs(d) <= sp ? d : Math.sign(d) * sp; f.a += da; f.w = da / h;
      });
      const b = G.ball; if (!b) return;
      if (G.held) { if (G.time - G.held > 0.9) { G.held = false; G.kicked = G.time; b.vx = 360; b.vy = -260; Sfx.swoosh(); } return; }
      b.vy += GRAV * h; b.x += b.vx * h; b.y += b.vy * h;
      for (const s of TB.walls) hitSeg(b, s, 0.45, 0);
      for (const s of TB.posts) hitSeg(b, s, 0.5, 3);
      TB.slings.forEach((s, k) => { const v = hitSeg(b, s, 0.5, 0); if (v > 60 && N) { b.vx += N[0] * 330; b.vy += N[1] * 330; G.flash['s' + k] = G.time; add(10); Sfx.bump(0.6); } });
      TB.bumpers.forEach((p, k) => {
        const dx = b.x - p.x, dy = b.y - p.y, d = Math.hypot(dx, dy), min = BR + p.r;
        if (d >= min || d < 1e-6) return;
        const nx = dx / d, ny = dy / d; b.x = p.x + nx * min; b.y = p.y + ny * min;
        const sp = Math.max(Math.hypot(b.vx, b.vy) * 0.9, 520); b.vx = nx * sp; b.vy = ny * sp;
        G.flash['b' + k] = G.time; add(100); Sfx.boing(0.7);
      });
      F.forEach(f => {
        const tx = f.px + Math.cos(f.a) * f.len, ty = f.py + Math.sin(f.a) * f.len;
        const v = hitSeg(b, [f.px, f.py, tx, ty], 0.3, 6, (x, y) => [-f.w * (y - f.py), f.w * (x - f.px)]);
        if (v > 300 && f.w !== 0) Sfx.bump(0.4);
      });
      const H = TB.hole, hd = Math.hypot(b.x - H.x, b.y - H.y);
      if (hd < 9 && Math.hypot(b.vx, b.vy) < 700 && !(G.time - (G.kicked || -9) < 0.8)) { b.x = H.x; b.y = H.y; b.vx = b.vy = 0; G.held = G.time; add(500); say('Trou en un ! +500'); Sfx.cup(); }
      if (b.y > 60 && b.y < 94) for (let i = 0; i < 4; i++) {
        const inside = b.x > TB.lanes[i] && b.x < TB.lanes[i + 1];
        if (inside && !G.inLane[i]) { G.inLane[i] = 1; if (!G.lit[i]) { G.lit[i] = 1; add(50); Sfx.pop(); } }
        if (!inside) G.inLane[i] = 0;
      } else G.inLane = [0, 0, 0, 0];
      if (G.lit.every(Boolean)) { add(1000); G.mult = Math.min(5, G.mult + 1); G.lit = [0, 0, 0, 0]; say('G-O-L-F ! Bonus x' + G.mult); Sfx.fanfare(); hud(); }
      const sp = Math.hypot(b.vx, b.vy); if (sp > VMAXB) { b.vx *= VMAXB / sp; b.vy *= VMAXB / sp; }
      if (b.y > 640) lost();
    }
    function update(dt) {
      if (G.charging) G.charge = Math.min(1, G.charge + dt);
      const n = 10, h = dt / n;
      for (let i = 0; i < n; i++) step(h);
      const b = G.ball;
      if (b && !G.held && !ready()) {
        if (Math.hypot(b.vx, b.vy) < 6) { G.idle += dt; if (G.idle > 2.5) { b.vx = (Math.random() - 0.5) * 260; b.vy = -260; G.idle = 0; say('Petit coup de pouce'); } } else G.idle = 0;
      }
      if (G.msgT && G.time - G.msgT > 3 && !G.over && !ready()) { ui('msg').textContent = ''; G.msgT = 0; }
    }
    /* Dessin */
    function draw() {
      const k = G.s * G.dpr, c = ctx, t = G.time;
      c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, cv.width, cv.height); c.setTransform(k, 0, 0, k, 0, 0);
      // Table
      c.beginPath(); c.moveTo(20, 600); c.lineTo(20, 170); c.arc(180, 170, 160, Math.PI, 2 * Math.PI); c.lineTo(340, 600); c.closePath();
      const g = c.createLinearGradient(0, 0, 0, 600); g.addColorStop(0, '#1f6f2c'); g.addColorStop(1, '#0f4419'); c.fillStyle = g; c.fill();
      c.save(); c.clip();
      c.fillStyle = 'rgba(255,255,255,.05)'; for (let x = 20; x < 300; x += 40) c.fillRect(x, 0, 20, 600);
      c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(300, 232, 40, 368);
      c.font = 'bold 30px Verdana, Tahoma, sans-serif'; c.textAlign = 'center'; c.fillStyle = 'rgba(255,255,255,.12)'; c.fillText('GREEN', 160, 380);
      c.font = 'bold 12px Verdana, Tahoma, sans-serif'; c.fillText('ARTHUR · 2026', 160, 400);
      c.restore();
      // Couloirs G O L F
      'GOLF'.split('').forEach((L, i) => {
        const x = (TB.lanes[i] + TB.lanes[i + 1]) / 2, on = G.lit && G.lit[i];
        c.beginPath(); c.arc(x, 112, 9, 0, Math.PI * 2); c.fillStyle = on ? '#ffd34d' : 'rgba(0,0,0,.35)'; c.fill();
        if (on) { c.shadowColor = '#ffd34d'; c.shadowBlur = 10; c.fill(); c.shadowBlur = 0; }
        c.fillStyle = on ? '#3a2600' : 'rgba(255,255,255,.55)'; c.font = 'bold 11px Verdana, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(L, x, 112.5);
      });
      // Trou
      const H = TB.hole;
      c.beginPath(); c.arc(H.x, H.y, H.r + 3, 0, Math.PI * 2); c.fillStyle = 'rgba(255,255,255,.25)'; c.fill();
      c.beginPath(); c.arc(H.x, H.y, H.r, 0, Math.PI * 2); c.fillStyle = '#071a0b'; c.fill();
      c.strokeStyle = '#f2f2ee'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(H.x + 6, H.y - 2); c.lineTo(H.x + 6, H.y - 26); c.stroke();
      c.fillStyle = '#e2392b'; c.beginPath(); c.moveTo(H.x + 6, H.y - 26); c.lineTo(H.x + 18, H.y - 22); c.lineTo(H.x + 6, H.y - 18); c.fill();
      // Lance-balle
      const comp = G.charging ? G.charge : 0;
      c.strokeStyle = '#c9ced6'; c.lineWidth = 2; c.beginPath();
      for (let i = 0; i <= 8; i++) { const y = 601 + i * (2.2 - comp * 1.2); c.lineTo(i % 2 ? 314 : 326, y); } c.stroke();
      // Murs et poteaux
      c.lineCap = 'round'; c.lineJoin = 'round';
      const metal = (segs, w) => { c.strokeStyle = '#2b3036'; c.lineWidth = w + 3; c.beginPath(); segs.forEach(s => { c.moveTo(s[0], s[1]); c.lineTo(s[2], s[3]); }); c.stroke(); c.strokeStyle = '#cfd5dc'; c.lineWidth = w; c.stroke(); };
      metal(TB.walls, 4); metal(TB.posts, 4);
      // Lance-pierres
      [[45, 395, 45, 455, 86, 482], [275, 395, 275, 455, 234, 482]].forEach((p, i) => {
        const lit = G.flash && t - (G.flash['s' + i] || -9) < 0.15;
        c.beginPath(); c.moveTo(p[0], p[1]); c.lineTo(p[2], p[3]); c.lineTo(p[4], p[5]); c.closePath();
        c.fillStyle = lit ? '#ffe27a' : '#d6402a'; c.fill(); c.strokeStyle = '#fff'; c.lineWidth = 2; c.stroke();
      });
      // Bumpers balles de golf
      TB.bumpers.forEach((p, i) => {
        const lit = G.flash && t - (G.flash['b' + i] || -9) < 0.15;
        c.beginPath(); c.arc(p.x, p.y, p.r + 4, 0, Math.PI * 2); c.fillStyle = lit ? '#ffd34d' : '#c8321e'; c.fill();
        const gg = c.createRadialGradient(p.x - 5, p.y - 6, 2, p.x, p.y, p.r); gg.addColorStop(0, '#fff'); gg.addColorStop(1, '#c9cdd1');
        c.beginPath(); c.arc(p.x, p.y, p.r, 0, Math.PI * 2); c.fillStyle = gg; c.fill();
        c.fillStyle = 'rgba(120,130,140,.45)';
        for (let a = 0; a < 6; a++) for (const rr of [5, 10]) { const an = a * Math.PI / 3 + rr; c.beginPath(); c.arc(p.x + Math.cos(an) * rr, p.y + Math.sin(an) * rr, 1.3, 0, Math.PI * 2); c.fill(); }
      });
      // Flippers
      F.forEach(f => {
        const tx = f.px + Math.cos(f.a) * f.len, ty = f.py + Math.sin(f.a) * f.len;
        c.strokeStyle = '#8f1d14'; c.lineWidth = 15; c.beginPath(); c.moveTo(f.px, f.py); c.lineTo(tx, ty); c.stroke();
        c.strokeStyle = '#f5f2ea'; c.lineWidth = 11; c.stroke();
        c.fillStyle = '#8f1d14'; c.beginPath(); c.arc(f.px, f.py, 3, 0, Math.PI * 2); c.fill();
      });
      // Bille
      const b = G.ball;
      if (b) {
        c.fillStyle = 'rgba(0,0,0,.35)'; c.beginPath(); c.arc(b.x + 2, b.y + 3, BR, 0, Math.PI * 2); c.fill();
        const bg = c.createRadialGradient(b.x - 3, b.y - 3, 1, b.x, b.y, BR); bg.addColorStop(0, '#ffffff'); bg.addColorStop(0.5, '#c4cad1'); bg.addColorStop(1, '#5d6670');
        c.fillStyle = bg; c.beginPath(); c.arc(b.x, b.y, BR, 0, Math.PI * 2); c.fill();
      }
      if (ready() && Math.floor(t * 2) % 2 === 0) { c.fillStyle = '#ffd34d'; c.font = 'bold 10px Verdana, sans-serif'; c.textAlign = 'center'; c.fillText('LANCER', 320, 548); }
      if (G.over) { c.fillStyle = 'rgba(0,0,0,.55)'; c.fillRect(20, 250, 280, 80); c.fillStyle = '#ffd34d'; c.font = 'bold 22px Verdana, sans-serif'; c.textAlign = 'center'; c.fillText('PARTIE TERMINÉE', 160, 285); c.font = '12px Verdana, sans-serif'; c.fillStyle = '#fff'; c.fillText('F2 ou Partie › Nouvelle partie', 160, 310); }
    }
    function layout() {
      const sw = stage.clientWidth, sh = stage.clientHeight; if (!sw || !sh) return;
      G.s = Math.max(0.3, Math.min(sw / PW, sh / PH)); G.dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.style.width = Math.floor(PW * G.s) + 'px'; cv.style.height = Math.floor(PH * G.s) + 'px';
      cv.width = Math.round(PW * G.s * G.dpr); cv.height = Math.round(PH * G.s * G.dpr);
      draw();
    }
    function frame(ts) {
      G.raf = 0; if (!G.alive || G.paused) return;
      const now = ts / 1000, dt = Math.min(0.033, Math.max(0, now - (G.last || now))); G.last = now; G.time += dt;
      update(dt); draw(); G.raf = requestAnimationFrame(frame);
    }
    function kick() { if (G.alive && !G.paused && !G.raf) { G.last = 0; G.raf = requestAnimationFrame(frame); } }
    /* Commandes */
    const LEFT = ['ArrowLeft', 'z', 'Z', 'q', 'Q', 'ShiftLeft'], RIGHT = ['ArrowRight', 'm', 'M', '/', 'ShiftRight'];
    const isL = e => LEFT.includes(e.key) || e.code === 'ShiftLeft', isR = e => RIGHT.includes(e.key) || e.code === 'ShiftRight';
    W.el.addEventListener('keydown', e => {
      if (e.key === 'F2') { e.preventDefault(); newGame(); return; }
      if (isL(e)) { e.preventDefault(); if (!F[0].on) Sfx.nav(); F[0].on = true; }
      else if (isR(e)) { e.preventDefault(); if (!F[1].on) Sfx.nav(); F[1].on = true; }
      else if (e.key === ' ' || e.key === 'ArrowDown') { e.preventDefault(); if (!e.repeat && ready()) G.charging = true; }
    });
    W.el.addEventListener('keyup', e => {
      if (isL(e)) F[0].on = false;
      else if (isR(e)) F[1].on = false;
      else if (e.key === ' ' || e.key === 'ArrowDown') { e.preventDefault(); if (G.charging) launch(); }
    });
    const touches = new Map();
    stage.addEventListener('pointerdown', e => {
      e.preventDefault(); cv.focus({ preventScroll: true });
      const r = cv.getBoundingClientRect(), x = (e.clientX - r.left) / r.width;
      let role;
      if (ready() && x > 0.78) { role = 'launch'; G.charging = true; }
      else role = x < 0.5 ? 0 : 1;
      if (role !== 'launch') { F[role].on = true; Sfx.nav(); }
      touches.set(e.pointerId, role);
      try { stage.setPointerCapture(e.pointerId); } catch (err) { /* ignoré */ }
    });
    const release = e => { const role = touches.get(e.pointerId); touches.delete(e.pointerId); if (role === 'launch') launch(); else if (role !== undefined) F[role].on = false; };
    stage.addEventListener('pointerup', release); stage.addEventListener('pointercancel', release);
    W.el.addEventListener('blur', () => F.forEach(f => { f.on = false; }), true);
    const act = cmd => {
      if (cmd === 'new') newGame();
      else if (cmd === 'quit') WM.close('flipper');
      else if (cmd === 'howto') msg({ id: 'pb-howto', title: 'Comment jouer', icon: 'help', w: 400, sound: false, html: '<p><b>' + T('Clavier :') + '</b> ' + T('← et → (ou Z et M) pour les flippers, Espace maintenu puis relâché pour lancer la balle.') + '</p><p><b>' + T('Tactile :') + '</b> ' + T('touchez la moitié gauche ou droite de la table pour les flippers, le couloir de droite pour lancer.') + '</p><p>' + T('Allumez les quatre lettres G-O-L-F pour augmenter le bonus, et visez le trou à gauche : +500.') + '</p>' });
      else if (cmd === 'about') msg({ id: 'pb-about', title: 'À propos du Flipper', icon: 'flipper', w: 360, sound: false, html: '<p><b>Flipper Green</b></p><p>' + T('Un flipper maison, version golf, dessiné et programmé pour ce bureau.') + '</p>' });
    };
    $('.pb', W.body).parentNode.insertBefore(menubar([
      { label: 'Partie', items: [{ id: 'new', label: 'Nouvelle partie', key: 'F2' }, { sep: true }, { id: 'quit', label: 'Quitter' }] },
      { label: '?', items: [{ id: 'howto', label: 'Comment jouer' }, { sep: true }, { id: 'about', label: 'À propos du Flipper' }] }
    ], act), $('.pb', W.body));
    if (window.ResizeObserver) { G.ro = new ResizeObserver(() => layout()); G.ro.observe(stage); }
    newGame(); layout(); kick();
    X.flipper = { G, F, TB, step, launch };
    return W;
  }

  Object.assign(X.apps, { mines: minesApp, flipper: flipperApp });
})();
