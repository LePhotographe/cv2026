/* Mini-golf vu de dessus : 4 trous, un par étape du parcours d'Arthur. Dessin et physique maison. */
(function () {
  'use strict';
  const X = window.XP, Sfx = window.Sfx;
  const { $, T, esc, WM, menubar, msg } = X;
  const TAU = Math.PI * 2, R = 6, CUP = 9, VMAX = 700, MAXS = 7, DRAG = 140;
  const rect = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
  const HOLES = [
    { n: 1, par: 2, title: 'Photographe indépendant', era: '2012 – 2015', aim: 0,
      poly: rect(40, 120, 560, 280), tee: [90, 200], cup: [510, 200],
      bumpers: [{ x: 260, y: 165, r: 16 }, { x: 340, y: 235, r: 16 }] },
    { n: 2, par: 3, title: 'Studio Photo Carmes', era: '2015 – 2020', aim: -Math.PI / 2,
      poly: [[40, 340], [40, 60], [560, 60], [560, 190], [210, 190], [210, 340]], tee: [125, 300], cup: [500, 125],
      sand: [{ x: 330, y: 158, rx: 42, ry: 22 }], photo: { x: 392, y: 270, w: 112, h: 86, a: -0.08 } },
    { n: 3, par: 3, title: '36POSES', era: '2020 – 2022', aim: 0,
      poly: rect(40, 60, 560, 340), tee: [80, 200], cup: [520, 200], film: true,
      blocks: [[290, 60, 310, 117], [290, 143, 310, 187], [290, 213, 310, 257], [290, 283, 310, 340]],
      water: [{ x: 420, y: 125, rx: 45, ry: 28 }, { x: 420, y: 275, rx: 45, ry: 28 }] },
    { n: 4, par: 3, title: 'Demooz', era: '2022 – aujourd’hui', aim: 0,
      poly: rect(40, 60, 560, 340), tee: [80, 200], cup: [510, 200],
      blocks: [[300, 100, 360, 180], [300, 220, 360, 300]], house: [300, 100, 360, 300], mill: { x: 322, y: 200, r0: 6, r1: 44, w: 1.1, a0: 0.4, face: 300, bw: 3.5 } }
  ];
  // Trous bonus : « continuer à jouer » après les 4 trous du parcours
  const BONUS = 'Trou bonus', bump = (x, y, r) => ({ x, y, r: r || 15 });
  HOLES.push(
    { par: 2, title: 'Le Couloir', aim: 0, poly: rect(40, 140, 560, 260), tee: [90, 200], cup: [510, 200],
      walls: [[260, 140, 260, 182], [260, 218, 260, 260], [380, 140, 380, 168], [380, 232, 380, 260]] },
    { par: 3, title: 'Le Zigzag', aim: Math.PI / 2, poly: rect(40, 60, 560, 340), tee: [110, 110], cup: [500, 290],
      walls: [[200, 60, 200, 255], [400, 145, 400, 340]] },
    { par: 3, title: 'L’Île', aim: 0, poly: rect(40, 60, 560, 340), tee: [80, 200], cup: [520, 200],
      water: [{ x: 300, y: 200, rx: 120, ry: 72 }] },
    { par: 3, title: 'Le Flipper', aim: 0, poly: rect(40, 80, 560, 320), tee: [80, 200], cup: [520, 200],
      bumpers: [bump(200, 150), bump(200, 250), bump(300, 200), bump(300, 112), bump(300, 288), bump(400, 150), bump(400, 250)] },
    { par: 2, title: 'La Pente', aim: 0, poly: rect(40, 100, 560, 300), tee: [90, 250], cup: [510, 150],
      slopes: [{ x0: 180, y0: 100, x1: 420, y1: 300, ax: 0, ay: 170 }] },
    { par: 3, title: 'Le Dogleg', aim: 0, poly: [[40, 60], [560, 60], [560, 340], [390, 340], [390, 190], [40, 190]], tee: [90, 125], cup: [475, 295],
      sand: [{ x: 505, y: 105, rx: 36, ry: 24 }] },
    { par: 3, title: 'Les Navettes', aim: 0, poly: rect(40, 80, 560, 320), tee: [80, 200], cup: [520, 200],
      movers: [{ x: 240, y: 200, dx: 0, dy: 82, w: 1.6, ph: 0, r: 18 }, { x: 380, y: 200, dx: 0, dy: 82, w: 1.6, ph: Math.PI, r: 18 }] },
    { par: 3, title: 'Le Fer à cheval', aim: 0, poly: [[40, 60], [560, 60], [560, 340], [40, 340], [40, 240], [440, 240], [440, 160], [40, 160]], tee: [90, 110], cup: [90, 290] },
    { par: 3, title: 'Le Bunker', aim: 0, poly: rect(40, 80, 560, 320), tee: [80, 200], cup: [520, 200],
      sand: [{ x: 300, y: 200, rx: 110, ry: 62 }, { x: 470, y: 125, rx: 40, ry: 24 }, { x: 470, y: 275, rx: 40, ry: 24 }] },
    { par: 3, title: 'Les Étangs', aim: 0, poly: rect(40, 60, 560, 340), tee: [80, 200], cup: [520, 110],
      water: [{ x: 220, y: 128, rx: 58, ry: 38 }, { x: 220, y: 272, rx: 58, ry: 38 }, { x: 400, y: 205, rx: 52, ry: 44 }] },
    { par: 4, title: 'La Chicane', aim: Math.PI / 2, poly: rect(40, 60, 560, 340), tee: [100, 110], cup: [510, 110],
      walls: [[180, 60, 180, 255], [310, 145, 310, 340], [440, 60, 440, 255]] },
    { par: 3, title: 'Les Vallons', aim: 0.5, poly: rect(40, 60, 560, 340), tee: [80, 110], cup: [520, 290],
      slopes: [{ x0: 40, y0: 60, x1: 300, y1: 340, ax: 0, ay: 140 }, { x0: 300, y0: 60, x1: 560, y1: 340, ax: 0, ay: -140 }], bumpers: [bump(300, 200, 18)] },
    { par: 3, title: 'Le Losange', aim: 0, poly: [[300, 50], [560, 200], [300, 350], [40, 200]], tee: [90, 200], cup: [510, 200],
      bumpers: [bump(300, 200, 22)] },
    { par: 4, title: 'Le Grand Final', aim: Math.PI / 2, poly: rect(40, 60, 560, 340), tee: [100, 110], cup: [520, 300],
      walls: [[200, 60, 200, 260], [400, 140, 400, 340]], water: [{ x: 300, y: 292, rx: 56, ry: 32 }],
      movers: [{ x: 480, y: 215, dx: 0, dy: 70, w: 1.3, ph: 0, r: 16 }] }
  );
  HOLES.forEach((H, i) => { H.n = i + 1; if (i >= 4) { H.bonus = true; H.era = BONUS; } });
  const CAREER = 4, PAR = HOLES.slice(0, CAREER).reduce((t, h) => t + h.par, 0), PAR18 = HOLES.reduce((t, h) => t + h.par, 0);
  const lastHole = () => (S.course === 'full' ? HOLES.length : CAREER) - 1;
  const store = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { /* ignoré */ } } };
  const relTxt = r => (r === 0 ? 'Par' : (r > 0 ? '+' : '−') + Math.abs(r));

  /* ---------- Géométrie ---------- */
  function inPoly(x, y, pts) {
    let inside = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const [xi, yi] = pts[i], [xj, yj] = pts[j];
      if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  }
  function segDist(x, y, s) {
    const ex = s[2] - s[0], ey = s[3] - s[1], l2 = ex * ex + ey * ey;
    let t = l2 ? ((x - s[0]) * ex + (y - s[1]) * ey) / l2 : 0; t = t < 0 ? 0 : t > 1 ? 1 : t;
    return [s[0] + ex * t, s[1] + ey * t];
  }
  function edges(pts) { return pts.map((p, i) => { const q = pts[(i + 1) % pts.length]; return [p[0], p[1], q[0], q[1]]; }); }
  const inEll = (x, y, e, k) => ((x - e.x) / e.rx) ** 2 + ((y - e.y) / e.ry) ** 2 < (k || 1);
  HOLES.forEach(H => {
    H.segs = edges(H.poly).concat(...(H.blocks || []).map(b => edges(rect(b[0], b[1], b[2], b[3]))));
    let seed = H.n * 7919 + 13;
    const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    const lane = edges(H.poly);
    H.decor = [];
    for (let y = 20; y < 400; y += 40) for (let x = 20; x < 600; x += 40) {
      const px = x + (rnd() - 0.5) * 22, py = y + (rnd() - 0.5) * 22, r = 8 + rnd() * 8, pick = rnd(), hue = rnd();
      if (inPoly(px, py, H.poly)) continue;
      if (Math.min(...lane.map(s => { const c = segDist(px, py, s); return Math.hypot(px - c[0], py - c[1]); })) < 18 + r) continue;
      if (H.photo && Math.abs(px - H.photo.x) < H.photo.w / 2 + 16 && Math.abs(py - H.photo.y) < H.photo.h / 2 + 16) continue;
      if (pick < 0.2) H.decor.push({ x: px, y: py, r, kind: 'bush' });
      else if (pick < 0.27) H.decor.push({ x: px, y: py, r: 3, kind: 'flower', hue });
    }
    H.specks = [];
    (H.sand || []).forEach(sd => { for (let i = 0; i < 46; i++) { const a = rnd() * TAU, d = Math.sqrt(rnd()) * 0.9; H.specks.push([sd.x + Math.cos(a) * sd.rx * d, sd.y + Math.sin(a) * sd.ry * d]); } });
  });

  /* ---------- État ---------- */
  const S = { alive: false };
  const HOLE = () => HOLES[S.hole];

  /* ---------- Physique ---------- */
  function collideSeg(b, s, e, rad, vel) {
    const [px, py] = segDist(b.x, b.y, s);
    let nx = b.x - px, ny = b.y - py;
    const d = Math.hypot(nx, ny), min = R + rad;
    if (d >= min || d < 1e-6) return 0;
    nx /= d; ny /= d;
    b.x = px + nx * min; b.y = py + ny * min;
    let wx = 0, wy = 0; if (vel) [wx, wy] = vel(px, py);
    const vn = (b.vx - wx) * nx + (b.vy - wy) * ny;
    if (vn >= 0) return 0;
    b.vx -= (1 + e) * vn * nx; b.vy -= (1 + e) * vn * ny;
    return -vn;
  }
  function moverAt(m, t) { const a = m.w * t + m.ph, s = Math.sin(a), c = Math.cos(a) * m.w; return { x: m.x + m.dx * s, y: m.y + m.dy * s, vx: m.dx * c, vy: m.dy * c, r: m.r }; }
  function collideMover(b, c, e) {
    const dx = b.x - c.x, dy = b.y - c.y, d = Math.hypot(dx, dy), min = R + c.r;
    if (d >= min || d < 1e-6) return 0;
    const nx = dx / d, ny = dy / d;
    b.x = c.x + nx * min; b.y = c.y + ny * min;
    const vn = (b.vx - c.vx) * nx + (b.vy - c.vy) * ny;
    if (vn >= 0) return 0;
    b.vx -= (1 + e) * vn * nx; b.vy -= (1 + e) * vn * ny;
    return -vn;
  }
  function collideCircle(b, c, e) {
    const dx = b.x - c.x, dy = b.y - c.y, d = Math.hypot(dx, dy), min = R + c.r;
    if (d >= min || d < 1e-6) return 0;
    const nx = dx / d, ny = dy / d;
    b.x = c.x + nx * min; b.y = c.y + ny * min;
    const vn = b.vx * nx + b.vy * ny;
    if (vn >= 0) return 0;
    b.vx -= (1 + e) * vn * nx; b.vy -= (1 + e) * vn * ny;
    return -vn;
  }
  // Les pales tournent au-dessus du toit : seule la partie qui dépasse devant la façade arrête la balle.
  function bladeSegs(m, time) {
    const a = m.a0 + time * m.w, out = [];
    for (let q = 0; q < 4; q++) {
      const u = a + q * Math.PI / 2, c = Math.cos(u), s = Math.sin(u);
      const tx = m.x + c * m.r1, ty = m.y + s * m.r1;
      if (tx >= m.face) continue;
      const k = (m.face - m.x) / (tx - m.x);
      out.push([m.face, m.y + (ty - m.y) * k, tx, ty]);
    }
    return out;
  }
  function sfx(kind, v) {
    if (S.time - S.sndT < 0.07) return;
    S.sndT = S.time;
    const p = Math.min(1, v / 450);
    if (kind === 'boing') Sfx.boing(p); else Sfx.bump(p);
  }
  function physics(H, h, time) {
    const b = S.ball;
    let sp = Math.hypot(b.vx, b.vy);
    const sand = (H.sand || []).some(e => inEll(b.x, b.y, e));
    const a0 = sand ? 560 : 100, k = sand ? 2.4 : 0.4;
    if (sp > 0) { const ns = Math.max(0, sp - (a0 + k * sp) * h); b.vx *= ns / sp; b.vy *= ns / sp; sp = ns; }
    const dx = H.cup[0] - b.x, dy = H.cup[1] - b.y, dc = Math.hypot(dx, dy) || 1e-6;
    if (dc < CUP) {
      if (sp < 290 || (dc < 2.5 && sp < 430)) { sinkStart(); return; }
      b.vx -= dx / dc * 1400 * h; b.vy -= dy / dc * 1400 * h;
      b.vx *= 1 - 1.2 * h; b.vy *= 1 - 1.2 * h;
    } else if (dc < CUP + 4 && sp < 160) { b.vx += dx / dc * 800 * h; b.vy += dy / dc * 800 * h; }
    for (const z of H.slopes || []) if (b.x > z.x0 && b.x < z.x1 && b.y > z.y0 && b.y < z.y1) { b.vx += z.ax * h; b.vy += z.ay * h; }
    b.x += b.vx * h; b.y += b.vy * h;
    let hit = 0;
    for (const s of H.segs) hit = Math.max(hit, collideSeg(b, s, 0.7, 0, null));
    if (H.mill) {
      const m = H.mill, vel = (px, py) => [-m.w * (py - m.y), m.w * (px - m.x)];
      for (const s of bladeSegs(m, time)) hit = Math.max(hit, collideSeg(b, s, 0.55, m.bw, vel));
    }
    for (const w of H.walls || []) hit = Math.max(hit, collideSeg(b, w, 0.7, 4, null));
    if (hit > 25) sfx('bump', hit);
    for (const m of H.movers || []) { const v = collideMover(b, moverAt(m, time), 0.9); if (v > 15) { m.hit = time; sfx('boing', v); } }
    for (const c of H.bumpers || []) { const v = collideCircle(b, c, 0.95); if (v > 15) { c.hit = S.time; sfx('boing', v); } }
    for (const w of H.water || []) if (inEll(b.x, b.y, w, 0.8)) { splashStart(b.x, b.y); return; }
  }

  /* ---------- Déroulement ---------- */
  function startHole(i) {
    const H = HOLES[i];
    S.hole = i; S.strokes = 0;
    (H.bumpers || []).forEach(b => { b.hit = 0; }); (H.movers || []).forEach(m => { m.hit = 0; });
    S.ball = { x: H.tee[0], y: H.tee[1], vx: 0, vy: 0, vis: true, sc: 1, al: 1 };
    S.rest = { x: H.tee[0], y: H.tee[1] };
    S.aim = { ang: H.aim, pow: 0.5, show: false };
    S.mode = 'aim'; S.drag = null; S.splash = null; S.sink = null; S.cache = null;
    S.banner = { t0: S.time, dur: 2.8, big: 'Trou ' + H.n + ' · Par ' + H.par, small: H.bonus ? H.title : H.title + ' (' + H.era + ')', kind: 'intro' };
    status();
  }
  function newGame(full) { closeCard(); S.scores = []; S.mullUsed = false; S.course = full ? 'full' : 'career'; startHole(0); }
  const sp25 = () => { try { return localStorage.getItem('ac.sp25') === '1'; } catch (e) { return false; } };
  const canMull = () => sp25() && !S.mullUsed && S.mode === 'aim' && S.prev && S.prev.hole === S.hole;
  function mulligan() {
    if (!canMull()) return;
    S.mullUsed = true;
    S.ball = { x: S.prev.x, y: S.prev.y, vx: 0, vy: 0, vis: true, sc: 1, al: 1 };
    S.rest = { x: S.prev.x, y: S.prev.y }; S.strokes = S.prev.strokes; S.prev = null;
    S.banner = { t0: S.time, dur: 1.4, big: 'Mulligan !', small: 'Coup rejoué sans pénalité' };
    Sfx.pop(); status();
  }
  function shoot(ang, pow) {
    if (S.mode !== 'aim' || pow < 0.04) return;
    S.prev = { x: S.ball.x, y: S.ball.y, strokes: S.strokes, hole: S.hole };
    S.strokes++; S.hint = false;
    S.rest = { x: S.ball.x, y: S.ball.y };
    S.ball.vx = Math.cos(ang) * pow * VMAX; S.ball.vy = Math.sin(ang) * pow * VMAX;
    S.aim.ang = ang; S.aim.pow = pow; S.aim.show = false; S.drag = null;
    S.mode = 'roll';
    if (S.banner && S.banner.kind === 'intro') S.banner.dur = Math.min(S.banner.dur, S.time - S.banner.t0 + 0.35);
    Sfx.hit('putt', 0.35 + pow * 0.8);
    status();
  }
  function stopBall() {
    S.ball.vx = 0; S.ball.vy = 0; S.mode = 'aim';
    S.rest = { x: S.ball.x, y: S.ball.y };
    status(); checkCap();
  }
  function checkCap() { if (S.mode === 'aim' && S.strokes >= MAXS) { S.strokes = MAXS; holeDone(true); } }
  function sinkStart() { const b = S.ball; S.mode = 'sink'; S.sink = { t0: S.time, x0: b.x, y0: b.y }; b.vx = 0; b.vy = 0; Sfx.cup(); }
  function splashStart(x, y) {
    S.mode = 'splash'; S.splash = { t0: S.time, x, y };
    S.ball.vis = false; S.ball.vx = 0; S.ball.vy = 0;
    Sfx.splash();
    S.banner = { t0: S.time, dur: 1.5, big: 'Plouf !', small: 'Un coup de pénalité' };
  }
  function holeDone(capped) {
    const H = HOLE(), d = S.strokes - H.par;
    S.scores[S.hole] = S.strokes;
    S.mode = 'done';
    const name = capped ? 'Trou plafonné à ' + MAXS : S.strokes === 1 ? 'Trou en un !' : d <= -3 ? 'Albatros !' : d === -2 ? 'Eagle !' : d === -1 ? 'Birdie !' : d === 0 ? 'Par' : d === 1 ? 'Bogey' : d === 2 ? 'Double bogey' : relTxt(d);
    if (!capped && d < 0) { Sfx.fanfare(); Sfx.applause(S.strokes === 1 ? 0.9 : 0.55); } else if (!capped && d === 0) Sfx.applause(0.3);
    S.banner = { t0: S.time, dur: 1.4, big: name, small: '' };
    status();
    const hole = S.hole;
    setTimeout(() => {
      if (!S.alive || S.mode !== 'done' || S.hole !== hole) return;
      const t = totals(), last = hole === lastHole(), next = last ? null : HOLES[hole + 1];
      card('Trou ' + H.n + ' terminé', '<h3>' + T(name) + '</h3><p>' + S.strokes + (S.strokes > 1 ? ' coups' : ' coup') + ' · Par ' + H.par + ' · Total : ' + t.sc + ' (' + relTxt(t.rel) + ')</p>' +
        (next ? '<p>' + T('Prochain trou : ' + next.title + (next.bonus ? ' (par ' + next.par + ')' : ' (' + next.era + ')')) + '</p>' : ''), [[last ? 'end' : 'next', last ? 'Carte de score' : 'Trou suivant', true]]);
    }, 1100);
  }
  function totals() {
    let sc = 0, par = 0;
    S.scores.forEach((v, i) => { if (v != null) { sc += v; par += HOLES[i].par; } });
    return { sc, par, rel: sc - par };
  }
  function verdictOf(rel) { return rel < 0 ? 'Sous le par : joli parcours !' : rel === 0 ? 'Dans le par. Solide.' : relTxt(rel) + ' au-dessus du par. Une revanche ?'; }
  function record(key, sc) { const best = parseInt(store.get(key), 10) || 0, rec = !best || sc < best; if (rec) store.set(key, String(sc)); return { best, rec }; }
  function endCard() {
    S.mode = 'end';
    if (S.course === 'full') return endCard18();
    const t = totals(), r = record('ac.mg.best', t.sc);
    card('Carte de score', '<table><thead><tr><th>Trou</th><th>Étape</th><th>Par</th><th>Coups</th></tr></thead><tbody>' +
      HOLES.slice(0, CAREER).map((H, i) => '<tr><td>' + H.n + '</td><td>' + T(H.title) + '</td><td>' + H.par + '</td><td>' + S.scores[i] + '</td></tr>').join('') +
      '<tr class="tot"><td></td><td>Total</td><td>' + PAR + '</td><td>' + t.sc + '</td></tr></tbody></table>' +
      '<p class="mg-big">' + t.sc + ' coups (' + relTxt(t.rel) + ')</p><p>' + T(verdictOf(t.rel)) + ' ' + T(r.rec ? 'Nouveau record sur ce poste !' : 'Record sur ce poste : ' + r.best + ' coups.') + '</p>' +
      '<p>' + T('Envie de prolonger ? 14 trous bonus vous attendent pour finir un vrai parcours de 18 trous.') + '</p>',
      [['more', 'Continuer à jouer', true], ['mail', 'Envoyer mon score à Arthur'], ['again', 'Rejouer'], ['quit', 'Fermer']]);
    Sfx.chime();
  }
  function endCard18() {
    const t = totals(), r = record('ac.mg.best18', t.sc);
    const half = (a, b, lab) => {
      const hs = HOLES.slice(a, b), sum = f => hs.reduce((n, H, i) => n + f(H, a + i), 0);
      return '<table class="mg-sc"><thead><tr><th>' + lab + '</th>' + hs.map(H => '<th>' + H.n + '</th>').join('') + '<th>Tot.</th></tr></thead><tbody>' +
        '<tr><td>Par</td>' + hs.map(H => '<td>' + H.par + '</td>').join('') + '<td>' + sum(H => H.par) + '</td></tr>' +
        '<tr class="tot"><td>Coups</td>' + hs.map((H, i) => '<td>' + S.scores[a + i] + '</td>').join('') + '<td>' + sum((H, i) => S.scores[i]) + '</td></tr></tbody></table>';
    };
    card('Carte de score · 18 trous', half(0, 9, 'Aller') + half(9, 18, 'Retour') +
      '<p class="mg-big">' + t.sc + ' coups (' + relTxt(t.rel) + ')</p><p>' + T('Par du parcours : ' + PAR18 + '. ' + verdictOf(t.rel) + ' ') + T(r.rec ? 'Nouveau record sur ce poste !' : 'Record sur ce poste : ' + r.best + ' coups.') + '</p>',
      [['mail', 'Envoyer mon score à Arthur', true], ['again', 'Rejouer'], ['quit', 'Fermer']]);
    Sfx.chime(); Sfx.applause(0.5);
  }
  function scoreMail() {
    const t = totals(), n = S.course === 'full' ? HOLES.length : CAREER;
    const detail = HOLES.slice(0, n).map((H, i) => 'Trou ' + H.n + ' (' + H.title + ', par ' + H.par + ') : ' + S.scores[i]).join('\n');
    X.apps.compose({ subject: 'Mon score au mini-golf : ' + t.sc + ' coups (' + relTxt(t.rel) + ')',
      body: 'Bonjour Arthur,\n\nJe viens de terminer ' + (n === CAREER ? 'le mini-golf de votre bureau' : 'les 18 trous du mini-golf de votre bureau') + ' en ' + t.sc + ' coups (' + relTxt(t.rel) + ').\n\n' + detail + '\n\nJ’aimerais aussi échanger avec vous au sujet d’un poste chez [entreprise].\n\nBien cordialement,\n[Prénom Nom]' });
  }

  /* ---------- Boucle ---------- */
  function update(dt) {
    const H = HOLE();
    if (S.mode === 'roll') {
      const n = Math.max(1, Math.ceil(dt * 240)), h = dt / n;
      for (let i = 0; i < n && S.mode === 'roll'; i++) physics(H, h, S.time - dt + (i + 1) * h);
      if (S.mode === 'roll' && Math.hypot(S.ball.vx, S.ball.vy) < 3) stopBall();
    } else if (S.mode === 'sink') {
      const k = Math.min(1, (S.time - S.sink.t0) / 0.3), b = S.ball;
      b.x = S.sink.x0 + (H.cup[0] - S.sink.x0) * k; b.y = S.sink.y0 + (H.cup[1] - S.sink.y0) * k; b.sc = 1 - 0.4 * k; b.al = 1 - k;
      if (k >= 1) { b.vis = false; holeDone(false); }
    } else if (S.mode === 'splash' && S.time - S.splash.t0 > 1.0) {
      S.strokes++;
      S.ball = { x: S.rest.x, y: S.rest.y, vx: 0, vy: 0, vis: true, sc: 1, al: 1 };
      S.mode = 'aim'; status(); checkCap();
    }
  }
  function frame(ts) {
    S.raf = 0;
    if (!S.alive || S.paused) return;
    const now = ts / 1000, dt = Math.min(0.05, Math.max(0, now - (S.last || now)));
    S.last = now; S.time += dt;
    update(dt); draw();
    S.raf = requestAnimationFrame(frame);
  }
  function kick() { if (S.alive && !S.paused && !S.raf) { S.last = 0; S.raf = requestAnimationFrame(frame); } }

  /* ---------- Dessin ---------- */
  function poly(c, pts) { c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); }
  function ell(c, e) { c.beginPath(); c.ellipse(e.x, e.y, e.rx, e.ry, 0, 0, TAU); }
  function bush(c, d) {
    c.fillStyle = 'rgba(0,0,0,.22)'; c.beginPath(); c.arc(d.x + 3, d.y + 3, d.r, 0, TAU); c.fill();
    c.fillStyle = '#23561c'; c.beginPath(); c.arc(d.x, d.y, d.r, 0, TAU); c.fill();
    c.fillStyle = '#2f7426'; c.beginPath(); c.arc(d.x - d.r * 0.25, d.y - d.r * 0.25, d.r * 0.68, 0, TAU); c.fill();
    c.fillStyle = 'rgba(160,230,120,.35)'; c.beginPath(); c.arc(d.x - d.r * 0.4, d.y - d.r * 0.42, d.r * 0.3, 0, TAU); c.fill();
  }
  function flower(c, d) {
    const col = d.hue < 0.33 ? '#ffd23f' : d.hue < 0.66 ? '#ff7aa8' : '#ffffff';
    c.fillStyle = col;
    for (let i = 0; i < 5; i++) { const a = i * TAU / 5; c.beginPath(); c.arc(d.x + Math.cos(a) * 2.2, d.y + Math.sin(a) * 2.2, 1.6, 0, TAU); c.fill(); }
    c.fillStyle = '#d9821c'; c.beginPath(); c.arc(d.x, d.y, 1.3, 0, TAU); c.fill();
  }
  function polaroid(c, p) {
    c.save(); c.translate(p.x, p.y); c.rotate(p.a);
    c.fillStyle = 'rgba(0,0,0,.3)'; c.fillRect(-p.w / 2 + 4, -p.h / 2 + 5, p.w, p.h);
    c.fillStyle = '#fbfaf3'; c.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
    const iw = p.w - 12, ih = p.h - 26, ix = -iw / 2, iy = -p.h / 2 + 6;
    const g = c.createLinearGradient(0, iy, 0, iy + ih); g.addColorStop(0, '#7fb7f0'); g.addColorStop(1, '#d8ecff');
    c.fillStyle = g; c.fillRect(ix, iy, iw, ih);
    c.fillStyle = '#ffd86b'; c.beginPath(); c.arc(ix + iw * 0.75, iy + ih * 0.3, 7, 0, TAU); c.fill();
    c.fillStyle = '#5fb24a'; c.beginPath(); c.moveTo(ix, iy + ih); c.quadraticCurveTo(ix + iw * 0.3, iy + ih * 0.45, ix + iw * 0.62, iy + ih * 0.8); c.quadraticCurveTo(ix + iw * 0.8, iy + ih * 0.62, ix + iw, iy + ih * 0.7); c.lineTo(ix + iw, iy + ih); c.closePath(); c.fill();
    c.strokeStyle = '#f4f4f2'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(ix + iw * 0.6, iy + ih * 0.8); c.lineTo(ix + iw * 0.6, iy + ih * 0.5); c.stroke();
    c.fillStyle = '#e23c2c'; c.beginPath(); c.moveTo(ix + iw * 0.6, iy + ih * 0.5); c.lineTo(ix + iw * 0.6 + 7, iy + ih * 0.55); c.lineTo(ix + iw * 0.6, iy + ih * 0.6); c.fill();
    c.restore();
  }
  function lens(c, b) {
    c.fillStyle = 'rgba(0,0,0,.3)'; c.beginPath(); c.arc(b.x + 2.5, b.y + 3, b.r, 0, TAU); c.fill();
    c.fillStyle = '#1c1c1f'; c.beginPath(); c.arc(b.x, b.y, b.r, 0, TAU); c.fill();
    c.strokeStyle = '#74787e'; c.lineWidth = 1.2; c.beginPath(); c.arc(b.x, b.y, b.r - 2.2, 0, TAU); c.stroke();
    const g = c.createRadialGradient(b.x - 3, b.y - 4, 1, b.x, b.y, b.r - 4);
    g.addColorStop(0, '#a8d6ff'); g.addColorStop(0.4, '#2b528f'); g.addColorStop(1, '#0a1226');
    c.fillStyle = g; c.beginPath(); c.arc(b.x, b.y, b.r - 4.5, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(200,130,255,.55)'; c.lineWidth = 1.4; c.beginPath(); c.arc(b.x, b.y, b.r - 7.5, 0.6, 2.1); c.stroke();
    c.fillStyle = 'rgba(255,255,255,.9)'; c.beginPath(); c.arc(b.x - 4, b.y - 4.5, 2, 0, TAU); c.fill();
    const k = b.hit ? (S.time - b.hit) / 0.3 : 1;
    if (k < 1) { c.strokeStyle = 'rgba(255,255,255,' + (1 - k) + ')'; c.lineWidth = 2; c.beginPath(); c.arc(b.x, b.y, b.r + 2 + k * 6, 0, TAU); c.stroke(); }
  }
  function film(c, b) {
    const [x0, y0, x1, y1] = b, w = x1 - x0;
    c.fillStyle = 'rgba(0,0,0,.28)'; c.fillRect(x0 + 3, y0 + 3, w, y1 - y0);
    c.fillStyle = '#262019'; c.fillRect(x0, y0, w, y1 - y0);
    c.fillStyle = 'rgba(222,150,58,.6)';
    for (let y = y0 + 4; y + 9 <= y1 - 3; y += 13) c.fillRect(x0 + 6, y, w - 12, 9);
    c.fillStyle = '#f2e9d6';
    for (let y = y0 + 2.5; y + 3 <= y1 - 1.5; y += 6) { c.fillRect(x0 + 1.5, y, 2.5, 3); c.fillRect(x1 - 4, y, 2.5, 3); }
  }
  function slope(c, z) {
    c.save(); c.beginPath(); c.rect(z.x0, z.y0, z.x1 - z.x0, z.y1 - z.y0); c.clip();
    const a = Math.atan2(z.ay, z.ax), g = c.createLinearGradient(z.x0 + (z.x1 - z.x0) / 2 - Math.cos(a) * 140, z.y0 + (z.y1 - z.y0) / 2 - Math.sin(a) * 140, z.x0 + (z.x1 - z.x0) / 2 + Math.cos(a) * 140, z.y0 + (z.y1 - z.y0) / 2 + Math.sin(a) * 140);
    g.addColorStop(0, 'rgba(255,255,255,.10)'); g.addColorStop(1, 'rgba(0,40,0,.16)');
    c.fillStyle = g; c.fillRect(z.x0, z.y0, z.x1 - z.x0, z.y1 - z.y0);
    c.strokeStyle = 'rgba(255,255,255,.38)'; c.lineWidth = 2; c.lineCap = 'round'; c.lineJoin = 'round';
    for (let y = z.y0 + 30; y < z.y1; y += 50) for (let x = z.x0 + 30; x < z.x1; x += 50) {
      c.save(); c.translate(x, y); c.rotate(a); c.beginPath(); c.moveTo(-5, -7); c.lineTo(3, 0); c.lineTo(-5, 7); c.stroke(); c.restore();
    }
    c.restore();
  }
  function wall(c, w) {
    c.lineCap = 'round';
    const line = (col, lw, o) => { c.strokeStyle = col; c.lineWidth = lw; c.beginPath(); c.moveTo(w[0] + o, w[1] + o); c.lineTo(w[2] + o, w[3] + o); c.stroke(); };
    line('rgba(0,0,0,.3)', 9, 2.5); line('#4e2c0f', 9, 0); line('#a8713a', 6, 0); line('#cf9f60', 2, -1);
  }
  function mover(c, m, t) {
    const p = moverAt(m, t);
    c.fillStyle = 'rgba(0,0,0,.3)'; c.beginPath(); c.arc(p.x + 2.5, p.y + 3, m.r, 0, TAU); c.fill();
    const g = c.createRadialGradient(p.x - m.r * 0.35, p.y - m.r * 0.4, 1, p.x, p.y, m.r);
    g.addColorStop(0, '#ffb39c'); g.addColorStop(0.55, '#e0412a'); g.addColorStop(1, '#8e1c10');
    c.fillStyle = g; c.beginPath(); c.arc(p.x, p.y, m.r, 0, TAU); c.fill();
    c.strokeStyle = '#fff'; c.lineWidth = 2.5; c.beginPath(); c.arc(p.x, p.y, m.r - 5, 0, TAU); c.stroke();
    const k = m.hit ? (t - m.hit) / 0.3 : 1;
    if (k >= 0 && k < 1) { c.strokeStyle = 'rgba(255,255,255,' + (1 - k).toFixed(2) + ')'; c.lineWidth = 2; c.beginPath(); c.arc(p.x, p.y, m.r + 2 + k * 6, 0, TAU); c.stroke(); }
  }
  function drawStatic(c, H) {
    c.fillStyle = '#2c6824'; c.fillRect(0, 0, 600, 400);
    c.fillStyle = 'rgba(0,0,0,.07)';
    for (let i = -400; i < 600; i += 44) { c.beginPath(); c.moveTo(i, 0); c.lineTo(i + 22, 0); c.lineTo(i + 422, 400); c.lineTo(i + 400, 400); c.closePath(); c.fill(); }
    if (H.photo) polaroid(c, H.photo);
    H.decor.forEach(d => (d.kind === 'bush' ? bush(c, d) : flower(c, d)));
    c.lineJoin = 'round';
    poly(c, H.poly);
    c.strokeStyle = 'rgba(0,0,0,.3)'; c.lineWidth = 26; c.stroke();
    c.strokeStyle = '#4e2c0f'; c.lineWidth = 22; c.stroke();
    c.strokeStyle = '#a8713a'; c.lineWidth = 17; c.stroke();
    c.strokeStyle = '#cf9f60'; c.lineWidth = 8; c.stroke();
    const g = c.createLinearGradient(0, 40, 0, 360); g.addColorStop(0, '#6fcc57'); g.addColorStop(1, '#4daa3c');
    poly(c, H.poly); c.fillStyle = g; c.fill();
    c.save(); poly(c, H.poly); c.clip();
    c.fillStyle = 'rgba(255,255,255,.07)'; for (let x = 0; x < 600; x += 52) c.fillRect(x, 0, 26, 400);
    poly(c, H.poly); c.strokeStyle = 'rgba(10,50,5,.3)'; c.lineWidth = 10; c.stroke();
    c.restore();
    (H.sand || []).forEach(sd => {
      ell(c, sd); c.fillStyle = '#ead49b'; c.fill(); c.strokeStyle = 'rgba(140,105,40,.5)'; c.lineWidth = 2; c.stroke();
    });
    c.fillStyle = 'rgba(150,112,48,.4)'; H.specks.forEach(p => c.fillRect(p[0], p[1], 1.5, 1.5));
    // Départ : tapis et marques
    const [tx, ty] = H.tee, px = -Math.sin(H.aim), py = Math.cos(H.aim);
    c.save(); c.translate(tx, ty); c.rotate(H.aim);
    c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(-13, -11, 28, 24);
    c.fillStyle = '#3e8c31'; c.fillRect(-14, -12, 28, 24); c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 1; c.strokeRect(-13.5, -11.5, 27, 23);
    c.restore();
    [1, -1].forEach(sg => { c.fillStyle = '#fff'; c.beginPath(); c.arc(tx + px * 18 * sg, ty + py * 18 * sg, 2.6, 0, TAU); c.fill(); c.strokeStyle = 'rgba(0,0,0,.35)'; c.stroke(); });
    (H.slopes || []).forEach(z => slope(c, z));
    (H.movers || []).forEach(m => { c.strokeStyle = 'rgba(0,40,0,.22)'; c.lineWidth = 4; c.lineCap = 'round'; c.beginPath(); c.moveTo(m.x - m.dx, m.y - m.dy); c.lineTo(m.x + m.dx, m.y + m.dy); c.stroke(); });
    (H.walls || []).forEach(w => wall(c, w));
    if (H.film) H.blocks.forEach(b => film(c, b));
    // Trou
    const [cx, cy] = H.cup;
    c.fillStyle = 'rgba(255,255,255,.22)'; c.beginPath(); c.arc(cx, cy, CUP + 2.5, 0, TAU); c.fill();
    c.fillStyle = '#0d1d09'; c.beginPath(); c.arc(cx, cy, CUP, 0, TAU); c.fill();
    c.fillStyle = '#1f3b15'; c.beginPath(); c.arc(cx + 1.6, cy + 1.6, CUP - 2.4, 0, TAU); c.fill();
    (H.bumpers || []).forEach(b => { const hit = b.hit; b.hit = 0; lens(c, b); b.hit = hit; });
  }
  function staticLayer(H) {
    const k = S.s * S.dpr, key = H.n + ':' + k.toFixed(4);
    if (S.cache && S.cache.key === key) return S.cache.cv;
    const off = document.createElement('canvas');
    off.width = Math.max(1, Math.round(600 * k)); off.height = Math.max(1, Math.round(400 * k));
    const c = off.getContext('2d'); c.setTransform(k, 0, 0, k, 0, 0);
    drawStatic(c, H);
    S.cache = { key, cv: off };
    return off;
  }
  function water(c, w, t) {
    c.save(); ell(c, w);
    const g = c.createRadialGradient(w.x - w.rx * 0.2, w.y - w.ry * 0.3, 2, w.x, w.y, w.rx);
    g.addColorStop(0, '#6cbcf5'); g.addColorStop(1, '#2468bd');
    c.fillStyle = g; c.fill(); c.clip();
    c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = 1.5;
    for (let q = 0; q < 3; q++) {
      const yy = w.y - w.ry * 0.45 + q * w.ry * 0.45, off = Math.sin(t * 1.4 + q * 1.7) * 7, x0 = w.x - w.rx * 0.55 + off;
      c.beginPath(); c.moveTo(x0, yy); c.quadraticCurveTo(x0 + w.rx * 0.27, yy - 4, x0 + w.rx * 0.55, yy); c.quadraticCurveTo(x0 + w.rx * 0.82, yy + 4, x0 + w.rx * 1.1, yy); c.stroke();
    }
    c.restore();
    ell(c, w); c.strokeStyle = '#d8c48d'; c.lineWidth = 3; c.stroke();
  }
  function house(c, H, t) {
    const [x0, y0, x1, y1] = H.house, mx = (x0 + x1) / 2, b = S.ball;
    const under = b.vis && b.x > x0 - 5 && b.x < x1 + 5 && b.y > 174 && b.y < 226;
    c.fillStyle = 'rgba(0,0,0,.3)'; c.fillRect(x0 + 6, y0 + 7, x1 - x0, y1 - y0);
    c.fillStyle = '#16260f'; c.fillRect(x0 - 3, 180, 3, 40); c.fillRect(x1, 180, 3, 40);
    c.globalAlpha = under ? 0.42 : 1;
    c.fillStyle = '#3fb4be'; c.fillRect(x0, y0, mx - x0, y1 - y0);
    c.fillStyle = '#288a93'; c.fillRect(mx, y0, x1 - mx, y1 - y0);
    c.strokeStyle = 'rgba(0,45,50,.35)'; c.lineWidth = 1;
    c.beginPath(); for (let y = y0 + 8; y < y1; y += 8) { c.moveTo(x0, y); c.lineTo(x1, y); } c.stroke();
    c.fillStyle = '#1b5f66'; c.fillRect(mx - 1.5, y0, 3, y1 - y0);
    c.strokeStyle = '#123f44'; c.lineWidth = 2; c.strokeRect(x0, y0, x1 - x0, y1 - y0);
    c.globalAlpha = 1;
    const m = H.mill, a = m.a0 + t * m.w;
    c.save(); c.translate(m.x + 3, m.y + 4); c.fillStyle = 'rgba(0,0,0,.25)';
    for (let q = 0; q < 4; q++) { c.save(); c.rotate(a + q * Math.PI / 2); c.fillRect(m.r0, -4, m.r1 - m.r0, 8); c.restore(); }
    c.restore();
    c.save(); c.translate(m.x, m.y);
    for (let q = 0; q < 4; q++) {
      c.save(); c.rotate(a + q * Math.PI / 2);
      c.fillStyle = '#f5f0e3'; c.fillRect(m.r0, -4, m.r1 - m.r0, 8);
      c.strokeStyle = '#8a6a40'; c.lineWidth = 0.8; c.strokeRect(m.r0, -4, m.r1 - m.r0, 8);
      c.beginPath(); for (let r = m.r0 + 5; r < m.r1; r += 5) { c.moveTo(r, -4); c.lineTo(r, 4); } c.stroke();
      c.fillStyle = '#6b4a26'; c.fillRect(0, -1.2, m.r1 + 1, 2.4);
      c.restore();
    }
    c.fillStyle = '#5a3d1e'; c.beginPath(); c.arc(0, 0, 5, 0, TAU); c.fill();
    c.strokeStyle = '#2f1f0e'; c.lineWidth = 1; c.stroke();
    c.restore();
  }
  function flag(c, H, t) {
    const near = S.ball.vis && Math.hypot(S.ball.x - H.cup[0], S.ball.y - H.cup[1]) < 42;
    const k = S.s, x = S.rot ? H.cup[1] : H.cup[0], y = S.rot ? 600 - H.cup[0] : H.cup[1];
    c.save(); c.scale(k, k);
    c.globalAlpha = near ? 0.3 : 1;
    c.strokeStyle = 'rgba(0,0,0,.28)'; c.lineWidth = 2; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 16, y + 8); c.stroke();
    c.strokeStyle = '#f7f7f2'; c.lineWidth = 2; c.beginPath(); c.moveTo(x, y); c.lineTo(x, y - 34); c.stroke();
    const tip = 18 + Math.sin(t * 5) * 1.5;
    c.fillStyle = '#e2392b'; c.beginPath(); c.moveTo(x + 1, y - 34); c.quadraticCurveTo(x + tip * 0.5, y - 32 + Math.sin(t * 6) * 1.2, x + tip, y - 28.5); c.lineTo(x + 1, y - 23); c.closePath(); c.fill();
    c.strokeStyle = '#8f1d14'; c.lineWidth = 0.8; c.stroke();
    c.globalAlpha = 1; c.restore();
  }
  function ball(c) {
    const b = S.ball; if (!b.vis) return;
    const r = R * b.sc;
    c.globalAlpha = b.al;
    c.fillStyle = 'rgba(0,0,0,.3)'; c.beginPath(); c.ellipse(b.x + 1.8, b.y + 2.2, r, r * 0.9, 0, 0, TAU); c.fill();
    const g = c.createRadialGradient(b.x - r * 0.35, b.y - r * 0.4, r * 0.1, b.x, b.y, r);
    g.addColorStop(0, '#ffffff'); g.addColorStop(0.7, '#eceff1'); g.addColorStop(1, '#b4bbc1');
    c.fillStyle = g; c.beginPath(); c.arc(b.x, b.y, r, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(50,60,70,.5)'; c.lineWidth = 0.8; c.stroke();
    c.globalAlpha = 1;
  }
  function aimGuide(c, t) {
    if (S.mode !== 'aim') return;
    const b = S.ball;
    if (!S.drag && !S.aim.show) {
      const p = 0.5 + 0.5 * Math.sin(t * 4);
      c.strokeStyle = 'rgba(255,255,255,' + (0.3 + 0.35 * p).toFixed(2) + ')'; c.lineWidth = 1.5;
      c.beginPath(); c.arc(b.x, b.y, R + 4 + p * 3, 0, TAU); c.stroke();
      return;
    }
    const { ang, pow } = S.aim, ux = Math.cos(ang), uy = Math.sin(ang), col = 'hsl(' + Math.round(120 - 120 * pow) + ',85%,55%)';
    if (S.drag) { c.strokeStyle = 'rgba(255,255,255,.4)'; c.lineWidth = 2; c.beginPath(); c.moveTo(b.x, b.y); c.lineTo(b.x - ux * pow * 46, b.y - uy * pow * 46); c.stroke(); }
    const L = 20 + pow * 120;
    c.save(); c.setLineDash([5, 5]); c.lineDashOffset = -t * 30; c.lineCap = 'round';
    c.beginPath(); c.moveTo(b.x + ux * 9, b.y + uy * 9); c.lineTo(b.x + ux * L, b.y + uy * L);
    c.strokeStyle = 'rgba(0,0,0,.4)'; c.lineWidth = 4; c.stroke();
    c.strokeStyle = col; c.lineWidth = 2; c.stroke();
    c.restore();
    const hx = b.x + ux * (L + 9), hy = b.y + uy * (L + 9);
    c.beginPath(); c.moveTo(hx, hy); c.lineTo(hx - ux * 10 - uy * 6, hy - uy * 10 + ux * 6); c.lineTo(hx - ux * 10 + uy * 6, hy - uy * 10 - ux * 6); c.closePath();
    c.fillStyle = col; c.fill(); c.strokeStyle = 'rgba(0,0,0,.5)'; c.lineWidth = 1; c.stroke();
  }
  function splashFx(c) {
    if (S.mode !== 'splash' || !S.splash) return;
    const k = Math.min(1, (S.time - S.splash.t0) / 0.9);
    c.strokeStyle = 'rgba(255,255,255,' + (1 - k).toFixed(2) + ')'; c.lineWidth = 2;
    [0, 0.25].forEach(o => { const kk = Math.max(0, k - o); c.beginPath(); c.ellipse(S.splash.x, S.splash.y, 3 + kk * 24, 2 + kk * 15, 0, 0, TAU); c.stroke(); });
  }
  function textOut(c, txt, x, y, size, fill) {
    c.font = 'bold ' + size + 'px Verdana, Tahoma, "DejaVu Sans", sans-serif';
    c.lineWidth = Math.max(3, size / 4.5); c.strokeStyle = '#0b2a6b'; c.strokeText(txt, x, y);
    c.fillStyle = fill || '#fff'; c.fillText(txt, x, y);
  }
  function overlayText(c, cw, ch) {
    c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round';
    const B = S.banner;
    if (B) {
      const k = (S.time - B.t0) / B.dur;
      if (k >= 1) S.banner = null;
      else {
        c.globalAlpha = k < 0.1 ? k / 0.1 : k > 0.75 ? (1 - k) / 0.25 : 1;
        const big = Math.round(Math.min(30, Math.max(18, cw / 20))), y = B.kind === 'intro' ? ch * 0.22 : ch * 0.42;
        textOut(c, B.big, cw / 2, y, big, B.kind === 'intro' ? '#fff' : '#ffe27a');
        if (B.small) textOut(c, B.small, cw / 2, y + big * 1.05, Math.round(big * 0.5));
        c.globalAlpha = 1;
      }
    }
    if (S.hint && S.mode === 'aim' && !S.drag && !S.aim.show) {
      const txt = 'Tirez en arrière pour viser, puis relâchez', fs = Math.round(Math.min(13, Math.max(11, cw / 46)));
      c.font = 'bold ' + fs + 'px Tahoma, Verdana, sans-serif';
      const w = c.measureText(txt).width + 22, y = ch - fs - 12;
      c.fillStyle = 'rgba(255,255,225,.95)'; c.strokeStyle = '#000'; c.lineWidth = 1;
      c.beginPath(); if (c.roundRect) c.roundRect(cw / 2 - w / 2, y - fs * 0.9, w, fs * 1.8, 5); else c.rect(cw / 2 - w / 2, y - fs * 0.9, w, fs * 1.8);
      c.fill(); c.stroke();
      c.fillStyle = '#000'; c.fillText(txt, cw / 2, y + 0.5);
    }
  }
  function draw() {
    if (!S.cv || !S.s) return;
    const c = S.ctx, H = HOLE(), k = S.s * S.dpr, t = S.time;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.clearRect(0, 0, S.cv.width, S.cv.height);
    if (S.rot) c.setTransform(0, -k, k, 0, 0, 600 * k); else c.setTransform(k, 0, 0, k, 0, 0);
    c.drawImage(staticLayer(H), 0, 0, 600, 400);
    (H.water || []).forEach(w => water(c, w, t));
    (H.bumpers || []).forEach(b => { if (b.hit && t - b.hit < 0.3) lens(c, b); });
    (H.movers || []).forEach(m => mover(c, m, t));
    ball(c);
    splashFx(c);
    if (H.mill) house(c, H, t);
    aimGuide(c, t);
    c.setTransform(S.dpr, 0, 0, S.dpr, 0, 0);
    flag(c, H, t);
    overlayText(c, S.cv.width / S.dpr, S.cv.height / S.dpr);
  }
  function layout() {
    if (!S.stage) return;
    const sw = S.stage.clientWidth, sh = S.stage.clientHeight; if (!sw || !sh) return;
    const rot = sh > sw * 1.15, LW = rot ? 400 : 600, LH = rot ? 600 : 400;
    const s = Math.max(0.2, Math.min(sw / LW, sh / LH)), dpr = Math.min(2, window.devicePixelRatio || 1);
    S.rot = rot; S.s = s; S.dpr = dpr;
    S.cv.style.width = Math.floor(LW * s) + 'px'; S.cv.style.height = Math.floor(LH * s) + 'px';
    S.cv.width = Math.round(LW * s * dpr); S.cv.height = Math.round(LH * s * dpr);
    S.cache = null; draw();
  }

  /* ---------- Interface ---------- */
  function status() {
    if (!S.W) return;
    const H = HOLE(), t = totals(), b = S.W.body;
    $('.mg-h', b).textContent = 'Trou ' + H.n + ' sur ' + (lastHole() + 1) + ' · Par ' + H.par + (H.bonus ? ' · ' + H.title : '');
    $('.mg-s', b).textContent = 'Coups : ' + S.strokes;
    $('.mg-t', b).textContent = 'Total : ' + (t.sc + (S.scores[S.hole] == null ? S.strokes : 0)) + ' (' + relTxt(t.rel) + ')';
    powUI();
  }
  function powUI() { if (!S.W) return; $('.mg-pow b', S.W.body).style.width = (S.mode === 'aim' && (S.drag || S.aim.show) ? Math.round(S.aim.pow * 100) : 0) + '%'; }
  function card(title, html, btns) {
    S.ov.innerHTML = '<div class="mg-card" role="dialog" aria-label="' + esc(title) + '"><div class="mg-card-h">' + T(title) + '</div><div class="mg-card-b">' + html + '<div class="dlg-btns">' +
      btns.map(([id, l, d]) => '<button class="btn' + (d ? ' btn--default' : '') + '" type="button" data-g="' + id + '">' + T(l) + '</button>').join('') + '</div></div></div>';
    const d = $('.btn--default', S.ov); if (d) d.focus({ preventScroll: true });
  }
  function closeCard() { if (!S.ov) return; const had = !!S.ov.firstChild; S.ov.innerHTML = ''; if (had && S.cv) S.cv.focus({ preventScroll: true }); }
  function startCard() {
    S.mode = 'intro';
    card('Mini-golf', '<h3>4 trous, un par étape de mon parcours</h3><table><thead><tr><th>Trou</th><th>Étape</th><th>Par</th></tr></thead><tbody>' +
      HOLES.slice(0, CAREER).map(H => '<tr><td>' + H.n + '</td><td>' + T(H.title) + ' <small>(' + T(H.era) + ')</small></td><td>' + H.par + '</td></tr>').join('') + '</tbody></table>' +
      '<p>' + T('Puis, si le cœur vous en dit, 14 trous bonus pour un parcours complet de 18 trous.') + '</p>' +
      '<p>' + T('Tirez en arrière pour viser, relâchez pour jouer. Au clavier : flèches pour viser et doser, Espace pour jouer.') + '</p>', [['play', 'Jouer', true], ['play18', '18 trous d’un coup']]);
  }
  function howto() {
    msg({ id: 'mg-howto', title: 'Comment jouer', icon: 'help', w: 420, sound: false,
      html: '<p><b>À la souris ou au doigt :</b> ' + T('appuyez n’importe où sur le parcours, tirez en arrière comme un lance-pierre, puis relâchez. Plus vous tirez, plus le coup est fort.') + '</p>' +
        '<p><b>Au clavier :</b> ' + T('← et → pour viser (Maj pour affiner), ↑ et ↓ pour doser, Espace pour jouer. F2 : nouvelle partie.') + '</p>' +
        '<p>' + T('L’eau coûte un coup de pénalité, le sable freine la balle, et chaque trou est plafonné à ' + MAXS + ' coups.') + '</p>' });
  }
  function aboutGame() {
    msg({ id: 'mg-about', title: 'À propos du mini-golf', icon: 'minigolf', w: 400, sound: false,
      html: '<p><b>Mini-golf</b> · ' + HOLES.length + ' trous, par ' + PAR18 + '</p><p>' + T('Les 4 premiers trous racontent mon parcours : ' + HOLES.slice(0, CAREER).map(h => h.title).join(', ') + '. Les 14 suivants sont là pour le plaisir.') + '</p><p>' + T('Golfeur depuis 25 ans, il me fallait un parcours sur ce bureau. Dessiné et programmé pour ce CV.') + '</p>' });
  }
  function bestDialog() {
    const best = parseInt(store.get('ac.mg.best'), 10) || 0, best18 = parseInt(store.get('ac.mg.best18'), 10) || 0;
    const line = (lab, v, par) => '<p>' + T(lab + ' (par ' + par + ') : ') + (v ? '<b>' + v + ' coups (' + relTxt(v - par) + ')</b>' : T('pas encore de partie terminée')) + '</p>';
    msg({ id: 'mg-best', title: 'Meilleurs scores', icon: 'minigolf', w: 360, sound: false,
      html: '<p>' + T('Meilleurs scores sur ce poste :') + '</p>' + line('Parcours, 4 trous', best, PAR) + line('Parcours complet, 18 trous', best18, PAR18),
      buttons: [{ id: 'reset', label: 'Effacer', disabled: !best && !best18 }, { id: 'ok', label: 'OK', def: true }], onButton: b => { if (b === 'reset') { store.set('ac.mg.best', null); store.set('ac.mg.best18', null); } } });
  }
  function act(cmd) {
    if (cmd === 'new') newGame();
    else if (cmd === 'mull') mulligan();
    else if (cmd === 'restart') { if (S.mode === 'intro' || S.mode === 'end') { newGame(); return; } closeCard(); S.scores.length = S.hole; startHole(S.hole); }
    else if (cmd === 'sound') { Sfx.setEnabled(!Sfx.enabled); dispatchEvent(new Event('sfxchange')); }
    else if (cmd === 'best') bestDialog();
    else if (cmd === 'quit') WM.close('minigolf');
    else if (cmd === 'howto') howto();
    else if (cmd === 'about') aboutGame();
  }
  function toLogical(e) {
    const r = S.cv.getBoundingClientRect(), k = (S.cv.offsetWidth / r.width) || 1, sx = (e.clientX - r.left) * k / S.s, sy = (e.clientY - r.top) * k / S.s;
    return S.rot ? { x: 600 - sy, y: sx } : { x: sx, y: sy };
  }
  function bind(W) {
    const cv = S.cv;
    cv.addEventListener('pointerdown', e => {
      if (S.mode !== 'aim' || (e.pointerType === 'mouse' && e.button !== 0)) return;
      e.preventDefault(); cv.focus({ preventScroll: true });
      const p = toLogical(e);
      S.drag = { id: e.pointerId, x: p.x, y: p.y };
      try { cv.setPointerCapture(e.pointerId); } catch (err) { /* ignoré */ }
    });
    cv.addEventListener('pointermove', e => {
      if (!S.drag || e.pointerId !== S.drag.id) return;
      const p = toLogical(e), vx = S.drag.x - p.x, vy = S.drag.y - p.y, len = Math.hypot(vx, vy);
      if (len > 2) S.aim.ang = Math.atan2(vy, vx);
      S.aim.pow = Math.min(1, len / DRAG);
      powUI();
    });
    const end = e => {
      if (!S.drag || e.pointerId !== S.drag.id) return;
      const pow = S.aim.pow; S.drag = null;
      if (e.type === 'pointerup' && pow >= 0.04) shoot(S.aim.ang, pow); else powUI();
    };
    cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);
    cv.addEventListener('lostpointercapture', e => { if (S.drag && e.pointerId === S.drag.id) { S.drag = null; powUI(); } });
    W.body.addEventListener('keydown', e => {
      if (e.key === 'F2') { e.preventDefault(); newGame(); return; }
      if ((e.key === 'm' || e.key === 'M') && canMull()) { e.preventDefault(); mulligan(); return; }
      if (e.target !== cv || S.mode !== 'aim') return;
      const stepA = (e.shiftKey ? 0.5 : 2) * Math.PI / 180;
      if (e.key === 'ArrowLeft') S.aim.ang -= stepA;
      else if (e.key === 'ArrowRight') S.aim.ang += stepA;
      else if (e.key === 'ArrowUp') S.aim.pow = Math.min(1, +(S.aim.pow + 0.05).toFixed(2));
      else if (e.key === 'ArrowDown') S.aim.pow = Math.max(0.05, +(S.aim.pow - 0.05).toFixed(2));
      else if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); if (S.aim.show) shoot(S.aim.ang, S.aim.pow); else { S.aim.show = true; powUI(); } return; }
      else return;
      e.preventDefault(); S.aim.show = true; powUI();
    });
    S.ov.addEventListener('click', e => {
      const b = e.target.closest('[data-g]'); if (!b) return;
      const g = b.dataset.g;
      if (g === 'play') newGame();
      else if (g === 'play18') newGame(true);
      else if (g === 'again') newGame(S.course === 'full');
      else if (g === 'more') { closeCard(); S.course = 'full'; startHole(CAREER); }
      else if (g === 'next') { closeCard(); startHole(S.hole + 1); }
      else if (g === 'end') endCard();
      else if (g === 'mail') scoreMail();
      else if (g === 'quit') WM.close('minigolf');
    });
  }
  function open() {
    if (WM.get('minigolf')) { WM.focus('minigolf'); return WM.get('minigolf'); }
    const html = '<div class="mg"><div class="mg-stage"><canvas class="mg-cv" tabindex="0" aria-label="' + esc('Parcours de mini-golf : tirez en arrière pour viser, relâchez pour jouer') + '"></canvas><div class="mg-ov"></div></div>' +
      '<div class="sbar"><span class="grow mg-h"></span><span class="mg-s"></span><span class="mg-t"></span><span class="mg-p"><em>Puissance</em><i class="mg-pow" aria-hidden="true"><b></b></i></span></div></div>';
    Object.assign(S, { alive: true, paused: false, time: 0, sndT: 0, raf: 0, last: 0, hint: true, scores: [], cache: null, s: 0, mullUsed: false, prev: null, course: 'career' });
    const W = WM.create('minigolf', { title: 'Mini-golf', icon: 'minigolf', w: 606, h: 478, html, kind: 'game', hash: 'minigolf', minW: 300, minH: 240, focus: '.mg-cv',
      onClose: () => { S.alive = false; if (S.raf) cancelAnimationFrame(S.raf); S.raf = 0; if (S.ro) S.ro.disconnect(); S.W = null; S.cv = null; S.cache = null; },
      onMin: () => { S.paused = true; }, onRestore: () => { S.paused = false; kick(); }, onResize: () => layout() });
    S.W = W; S.cv = $('.mg-cv', W.body); S.ctx = S.cv.getContext('2d'); S.stage = $('.mg-stage', W.body); S.ov = $('.mg-ov', W.body);
    $('.mg', W.body).insertBefore(menubar([
      { label: 'Partie', items: () => [{ id: 'new', label: 'Nouvelle partie', key: 'F2' }, { id: 'restart', label: 'Recommencer le trou', disabled: S.mode === 'intro' || S.mode === 'end' }, sp25() ? { id: 'mull', label: 'Mulligan', key: 'M', disabled: !canMull() } : null, { sep: true }, { id: 'sound', label: 'Effets sonores', checked: Sfx.enabled }, { sep: true }, { id: 'best', label: 'Meilleurs scores…' }, { sep: true }, { id: 'quit', label: 'Quitter' }] },
      { label: '?', items: [{ id: 'howto', label: 'Comment jouer' }, { sep: true }, { id: 'about', label: 'À propos du mini-golf' }] }
    ], act), S.stage);
    startHole(0); S.banner = null; startCard();
    bind(W);
    if (window.ResizeObserver) { S.ro = new ResizeObserver(() => layout()); S.ro.observe(S.stage); }
    if (!W.el.classList.contains('is-max')) {
      const area = { width: $('#wins').clientWidth, height: $('#wins').clientHeight };
      const w = Math.min(W.el.offsetWidth + 600 - S.stage.clientWidth, area.width - 8), h = Math.min(W.el.offsetHeight + 401 - S.stage.clientHeight, area.height - 8);
      Object.assign(W.el.style, { width: w + 'px', height: h + 'px', left: Math.max(0, Math.min(W.el.offsetLeft, area.width - w)) + 'px', top: Math.max(0, Math.min(W.el.offsetTop, area.height - h)) + 'px' });
    }
    layout(); kick();
    return W;
  }

  X.apps.minigolf = open;
  X.minigolf = { HOLES, S, physics, shoot, startHole, totals, endCard };
})();
