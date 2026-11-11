/* Noyau du bureau : utilitaires, gestionnaire de fenêtres, menus et boîtes de message. */
(function () {
  'use strict';
  const Sfx = window.Sfx, I = window.XPIcons.icon;
  const IMG = window.__IMG || {};
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const fr = s => String(s).replace(/ ([!?;:])/g, ' $1');
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const T = s => esc(fr(s));
  const small = () => !!(window.matchMedia && matchMedia('(max-width: 720px)').matches);
  const pic = cls => '<span class="pic' + (cls ? ' ' + cls : '') + '"><img alt="" src="' + (IMG.avatar || '') + '"></span>';
  const ico = key => key === 'profile' ? pic() : I(key);
  const D = window.SiteData;

  /* ---------- Écran 4:3 dans un moniteur d'époque ---------- */
  // L'écran garde une définition fixe (1024 × 768) et le moniteur entier est mis à l'échelle de la fenêtre.
  const SCR_W = 1024, SCR_H = 768, CASE_W = 1024 + 2 * 46, CASE_H = 768 + 40 + 84, STAND = 46;
  const screenEl = () => document.getElementById('screen') || document.body;
  function fitScreen() {
    const vw = innerWidth, vh = innerHeight, root = document.documentElement;
    const s = Math.min((vw - 24) / CASE_W, (vh - 16) / (CASE_H + STAND), 1.7);
    const crt = s >= 0.55 && !(window.matchMedia && matchMedia('(max-width: 720px)').matches);
    root.classList.toggle('is-crt', crt);
    root.style.setProperty('--crt-s', crt ? s.toFixed(4) : '1');
  }
  fitScreen();
  addEventListener('resize', fitScreen);
  // Convertit des coordonnées de la fenêtre du navigateur en coordonnées de l'écran simulé.
  function pt(x, y) { const s = screenEl(), r = s.getBoundingClientRect(), k = r.width / (s.offsetWidth || 1) || 1; return { x: (x - r.left) / k, y: (y - r.top) / k, k }; }

  /* ---------- Petits utilitaires ---------- */
  let toastT = 0;
  function toast(msg) { const el = $('#toast'); el.textContent = fr(msg); el.classList.add('is-on'); clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('is-on'), 2800); }
  function selectText(el) { if (!el) return; if (el.select) { el.focus(); el.select(); return; } const r = document.createRange(); r.selectNodeContents(el); const s = getSelection(); s.removeAllRanges(); s.addRange(r); }
  function copyText(text, fallbackEl, label) {
    const done = () => { const l = label || 'Texte'; toast(l + (/^(Adresse|Sélection)/.test(l) ? ' copiée' : ' copié') + ' dans le Presse-papiers'); };
    const fail = () => { selectText(fallbackEl); toast('Copie impossible ici : sélectionnez le texte puis Ctrl + C (ou Cmd + C)'); };
    try { if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, fail); else fail(); } catch (e) { fail(); }
  }
  const mailto = (subject, body, to) => 'mailto:' + (to === undefined ? D.person.email : to) + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
  function openExternal(href) { const a = document.createElement('a'); a.href = href; a.target = '_blank'; a.rel = 'noopener'; document.body.appendChild(a); a.click(); a.remove(); }
  function setHash(id) { try { history.replaceState(null, '', id ? '#' + id : location.pathname + location.search); } catch (e) { /* ignoré */ } }
  let busyT = 0;
  function busy(ms) { const h = document.documentElement; h.classList.add('is-busy'); clearTimeout(busyT); busyT = setTimeout(() => h.classList.remove('is-busy'), ms || 380); }

  /* ---------- Fichiers à télécharger ---------- */
  const PDF_NAME = 'CV_Arthur_Chauvineau.pdf';
  const Files = { pdf: 'pending', dl: null, artifact: false, ready: [] };
  async function detect() {
    if (window.claude && typeof window.claude.use === 'function') {
      Files.artifact = true;
      try { Files.dl = await window.claude.use('downloads'); } catch (e) { Files.dl = null; }
    }
    if (Files.artifact && !Files.dl) Files.pdf = 'none';
    else if (location.protocol === 'file:') Files.pdf = 'ok';
    else {
      let ok = false;
      try { ok = (await fetch(PDF_NAME, { method: 'HEAD' })).ok; } catch (e) { ok = false; }
      if (!ok) { try { ok = (await fetch(PDF_NAME)).ok; } catch (e) { ok = false; } }
      Files.pdf = ok ? 'ok' : 'none';
    }
    Files.ready.forEach(f => f());
  }
  const canSave = () => !!Files.dl || !Files.artifact;
  async function saveBlob(name, blob) {
    if (Files.dl) {
      try { await Files.dl.save({ filename: name, data: blob }); toast('Téléchargement lancé'); }
      catch (e) { if (!(e && e.code === 'declined')) toast('Le fichier n’a pas pu être enregistré ici.'); }
      return;
    }
    if (Files.artifact) { toast('L’enregistrement n’est pas disponible ici.'); return; }
    const url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000); toast('Téléchargement lancé');
  }
  async function downloadCV() {
    if (Files.pdf !== 'ok') { toast('Le PDF n’est pas disponible ici : ouvrez CV Arthur Chauvineau.doc.'); return; }
    if (!Files.artifact) { const a = document.createElement('a'); a.href = PDF_NAME; a.download = PDF_NAME; document.body.appendChild(a); a.click(); a.remove(); toast('Téléchargement lancé'); return; }
    try { const res = await fetch(PDF_NAME); if (!res.ok) throw new Error('fetch'); await saveBlob(PDF_NAME, await res.blob()); }
    catch (e) { toast('Le PDF n’a pas pu être proposé ici.'); }
  }

  /* ---------- Gestionnaire de fenêtres ---------- */
  const WM = (() => {
    const layer = $('#wins'), wins = new Map(), hooks = { open: [], close: [], focus: [] };
    let z = 20, active = null, count = 0;
    const emit = (k, W) => hooks[k].forEach(f => f(W));
    const area = () => ({ w: layer.clientWidth, h: layer.clientHeight });
    const CT = { min: ['wc-min', 'Réduire'], max: ['wc-max', 'Agrandir'], close: ['wc-close', 'Fermer'], help: ['wc-help', 'Aide'] };
    function create(id, o) {
      const dialog = !!o.dialog;
      const el = document.createElement('section');
      el.className = 'win is-opening' + (dialog ? ' win--dialog' : '') + (o.cls ? ' ' + o.cls : '');
      el.setAttribute('role', 'dialog'); el.setAttribute('aria-labelledby', 'wt-' + id);
      const ctrls = o.ctrls || (dialog ? ['close'] : ['min', 'max', 'close']);
      el.innerHTML = '<div class="win-bar"><span class="win-ico">' + ico(o.icon) + '</span><span class="win-title" id="wt-' + id + '">' + T(o.title) + '</span><div class="win-ctrls">' +
        ctrls.map(k => '<button class="wc ' + CT[k][0] + '" type="button" data-wc="' + k + '" aria-label="' + CT[k][1] + '" title="' + CT[k][1] + '"></button>').join('') + '</div></div>' +
        '<div class="win-body">' + (o.html || '') + '</div>' + (dialog ? '' : '<span class="win-grip" aria-hidden="true"></span>');
      layer.appendChild(el);
      const W = { id, el, body: $('.win-body', el), title: o.title, icon: o.icon, dialog, top: !!o.top, hash: o.hash || null, min: false, notask: !!o.notask, ctrls,
        minW: o.minW || 300, minH: o.minH || 200, onClose: o.onClose, onFocus: o.onFocus, onBlur: o.onBlur, onMin: o.onMin, onRestore: o.onRestore, onHelp: o.onHelp, onResize: o.onResize, kind: o.kind || null };
      wins.set(id, W);
      const a = area(), n = count++ % 6;
      const w = Math.round(Math.min(o.w || 720, a.w - (dialog ? 16 : 24)));
      el.style.width = w + 'px';
      if (!dialog) el.style.height = Math.round(Math.min(o.h || 520, a.h - 24)) + 'px';
      const h = el.offsetHeight;
      if (dialog || o.center) {
        el.style.left = Math.max(0, Math.round((a.w - w) / 2)) + 'px';
        el.style.top = Math.max(0, Math.round((a.h - h) / 2.3)) + 'px';
      } else {
        el.style.left = clamp(a.w > 1180 ? Math.round((a.w - w) / 2) + 30 + n * 26 : (a.w - w >= 196 ? 196 : 104) + n * 26, 0, Math.max(0, a.w - w)) + 'px';
        el.style.top = clamp(16 + n * 24, 0, Math.max(0, a.h - h)) + 'px';
      }
      if (!dialog && (o.max || small())) el.classList.add('is-max');
      bindChrome(W);
      setTimeout(() => el.classList.remove('is-opening'), 160);
      focus(id);
      Sfx.pop(); busy();
      emit('open', W);
      if (o.focus) { const f = $(o.focus, el); if (f) f.focus({ preventScroll: true }); }
      return W;
    }
    function bindChrome(W) {
      const el = W.el, bar = $('.win-bar', el);
      $$('[data-wc]', bar).forEach(b => b.addEventListener('click', e => {
        e.stopPropagation();
        const k = b.dataset.wc;
        if (k === 'min') minimize(W.id); else if (k === 'max') toggleMax(W.id); else if (k === 'close') close(W.id); else if (k === 'help' && W.onHelp) W.onHelp();
      }));
      el.addEventListener('pointerdown', () => { if (active !== W.id) focus(W.id); }, true);
      bar.addEventListener('dblclick', e => { if (!e.target.closest('.wc') && !W.dialog) toggleMax(W.id); });
      let drag = null;
      bar.addEventListener('pointerdown', e => {
        if (e.target.closest('.wc') || el.classList.contains('is-max') || (e.pointerType === 'mouse' && e.button !== 0)) return;
        drag = { x: e.clientX, y: e.clientY, l: el.offsetLeft, t: el.offsetTop, id: e.pointerId, k: pt(0, 0).k };
        try { bar.setPointerCapture(e.pointerId); } catch (err) { /* ignoré */ }
      });
      bar.addEventListener('pointermove', e => {
        if (!drag || e.pointerId !== drag.id) return;
        const a = area();
        el.style.left = clamp(drag.l + (e.clientX - drag.x) / drag.k, 80 - el.offsetWidth, a.w - 80) + 'px';
        el.style.top = clamp(drag.t + (e.clientY - drag.y) / drag.k, 0, a.h - 30) + 'px';
      });
      const end = () => { drag = null; };
      bar.addEventListener('pointerup', end); bar.addEventListener('pointercancel', end);
      const grip = $('.win-grip', el); if (!grip) return;
      let rs = null;
      grip.addEventListener('pointerdown', e => { e.stopPropagation(); rs = { x: e.clientX, y: e.clientY, w: el.offsetWidth, h: el.offsetHeight, id: e.pointerId, k: pt(0, 0).k }; try { grip.setPointerCapture(e.pointerId); } catch (err) { /* ignoré */ } });
      grip.addEventListener('pointermove', e => {
        if (!rs || e.pointerId !== rs.id) return;
        const a = area();
        el.style.width = clamp(rs.w + (e.clientX - rs.x) / rs.k, W.minW, a.w - el.offsetLeft) + 'px';
        el.style.height = clamp(rs.h + (e.clientY - rs.y) / rs.k, W.minH, a.h - el.offsetTop) + 'px';
        if (W.onResize) W.onResize();
      });
      grip.addEventListener('pointerup', () => { rs = null; }); grip.addEventListener('pointercancel', () => { rs = null; });
    }
    function focus(id) {
      const W = wins.get(id); if (!W) return;
      if (active && active !== id) { const P = wins.get(active); if (P) { P.el.classList.remove('is-active'); if (P.onBlur) P.onBlur(); } }
      if (W.min) { W.min = false; W.el.classList.remove('is-min'); if (W.onRestore) W.onRestore(); }
      W.el.style.zIndex = (W.top ? 5000 : 0) + (++z); W.el.classList.add('is-active');
      if (W.flash) { W.flash = null; clearTimeout(W.flashT); }
      const changed = active !== id; active = id;
      if (changed) { if (W.onFocus) W.onFocus(); setHash(W.hash); emit('focus', W); }
      renderTasks();
    }
    function blurAll() {
      if (!active) return;
      const P = wins.get(active); if (P) { P.el.classList.remove('is-active'); if (P.onBlur) P.onBlur(); }
      active = null; renderTasks();
    }
    function topmost() { return [...wins.values()].filter(x => !x.min).sort((a, b) => (+b.el.style.zIndex) - (+a.el.style.zIndex))[0]; }
    function minimize(id) {
      const W = wins.get(id); if (!W || W.dialog) return;
      W.min = true; W.el.classList.add('is-min'); W.el.classList.remove('is-active');
      if (W.onMin) W.onMin();
      if (active === id) { active = null; const next = topmost(); if (next) focus(next.id); }
      Sfx.shut(); renderTasks();
    }
    function toggleMax(id) {
      const W = wins.get(id); if (!W || W.dialog || small() || !W.ctrls.includes('max')) return;
      W.el.classList.toggle('is-max');
      const b = $('.wc-max', W.el); if (b) { const l = W.el.classList.contains('is-max') ? 'Restaurer' : 'Agrandir'; b.setAttribute('aria-label', l); b.title = l; }
      if (W.onResize) W.onResize();
    }
    function close(id, silent) {
      const W = wins.get(id); if (!W) return;
      if (W.onClose) W.onClose(!!silent);
      W.el.remove(); wins.delete(id);
      if (active === id) { active = null; const next = topmost(); if (next) focus(next.id); }
      if (!silent) Sfx.shut();
      renderTasks(); emit('close', W);
      if (!wins.size) setHash(null);
    }
    function setTitle(id, title) { const W = wins.get(id); if (!W) return; W.title = title; $('.win-title', W.el).textContent = fr(title); renderTasks(); }
    function setIcon(id, icon) { const W = wins.get(id); if (!W) return; W.icon = icon; $('.win-ico', W.el).innerHTML = ico(icon); renderTasks(); }
    function setHashFor(id, hash) { const W = wins.get(id); if (!W) return; W.hash = hash; if (active === id) setHash(hash); }
    function renderTasks() {
      const t = $('#tasks');
      t.innerHTML = [...wins.values()].filter(W => !W.notask).map(W => '<button class="task' + (W.id === active && !W.min ? ' is-active' : '') + (W.flash ? ' is-flash' + (W.flash === 'blink' ? ' is-blink' : '') : '') + '" type="button" data-win="' + W.id + '" title="' + esc(fr(W.title)) + '">' + ico(W.icon) + '<span>' + T(W.title) + '</span></button>').join('');
    }
    $('#tasks').addEventListener('click', e => {
      const b = e.target.closest('[data-win]'); if (!b) return;
      const id = b.dataset.win, W = wins.get(id);
      if (W && active === id && !W.min) minimize(id); else focus(id);
    });
    addEventListener('resize', () => {
      const a = area();
      wins.forEach(W => {
        if (W.el.classList.contains('is-max')) { if (W.onResize) W.onResize(); return; }
        if (small() && !W.dialog) { W.el.classList.add('is-max'); if (W.onResize) W.onResize(); return; }
        W.el.style.left = clamp(W.el.offsetLeft, 0, Math.max(0, a.w - Math.min(W.el.offsetWidth, a.w))) + 'px';
        W.el.style.top = clamp(W.el.offsetTop, 0, Math.max(0, a.h - 40)) + 'px';
        if (W.onResize) W.onResize();
      });
    });
    // Comme sous XP : le bouton d'une fenêtre qui réclame l'attention clignote en orange, puis reste orange.
    function flash(id) {
      const W = wins.get(id); if (!W || active === id) return;
      W.flash = 'blink'; renderTasks();
      clearTimeout(W.flashT); W.flashT = setTimeout(() => { if (W.flash) { W.flash = 'steady'; renderTasks(); } }, 4200);
    }
    return { create, focus, minimize, flash, close, toggleMax, setTitle, setIcon, setHash: setHashFor, blurAll, get: id => wins.get(id), get active() { return active; }, all: () => [...wins.values()], on: (k, f) => hooks[k].push(f) };
  })();

  /* ---------- Menus déroulants et contextuels ---------- */
  let openMenu = null;
  function closeMenus() { if (!openMenu) return; const m = openMenu; openMenu = null; m.drop.remove(); if (m.onClose) m.onClose(); }
  function showDrop(items, x, y, onAct, opts) {
    closeMenus();
    opts = opts || {};
    const drop = document.createElement('div');
    drop.className = 'mdrop'; drop.setAttribute('role', 'menu');
    drop.innerHTML = items.filter(Boolean).map(it => {
      if (it.sep) return '<hr>';
      const role = it.radio ? 'menuitemradio' : it.checked !== undefined ? 'menuitemcheckbox' : 'menuitem';
      return '<button type="button" role="' + role + '"' + (it.checked !== undefined ? ' aria-checked="' + (it.checked ? 'true' : 'false') + '"' : '') + (it.disabled ? ' disabled' : '') + (it.bold ? ' class="is-def"' : '') +
        ' data-mi="' + esc(it.id) + '"><span>' + T(it.label) + '</span>' + (it.key ? '<span class="k">' + esc(it.key) + '</span>' : '') + '</button>';
    }).join('');
    const scr = screenEl(); scr.appendChild(drop);
    const p = pt(x, y), r = { width: drop.offsetWidth, height: drop.offsetHeight }, vw = scr.clientWidth, vh = scr.clientHeight;
    let left = p.x, top = p.y;
    if (left + r.width > vw - 2) left = Math.max(2, vw - r.width - 2);
    if (top + r.height > vh - 2) top = Math.max(2, (opts.above !== undefined ? pt(x, opts.above).y : p.y) - r.height);
    drop.style.left = left + 'px'; drop.style.top = top + 'px';
    drop.addEventListener('click', e => { const b = e.target.closest('[data-mi]'); if (!b || b.disabled) return; const id = b.dataset.mi; closeMenus(); Sfx.nav(); onAct(id); });
    drop.addEventListener('keydown', e => {
      const list = $$('button:not(:disabled)', drop), i = list.indexOf(document.activeElement);
      if (e.key === 'ArrowDown') { e.preventDefault(); (list[(i + 1) % list.length] || list[0]).focus(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); (list[(i - 1 + list.length) % list.length] || list[0]).focus(); }
      else if (e.key === 'Escape' || e.key === 'Tab') { e.preventDefault(); e.stopPropagation(); const back = opts.opener; closeMenus(); if (back) back.focus(); }
    });
    openMenu = { drop, onClose: opts.onClose };
    if (opts.focus) { const f = $('button:not(:disabled)', drop); if (f) f.focus(); }
    return drop;
  }
  document.addEventListener('pointerdown', e => { if (openMenu && !e.target.closest('.mdrop') && !e.target.closest('.mbar > button.is-open')) closeMenus(); }, true);
  addEventListener('resize', closeMenus); addEventListener('blur', closeMenus);
  addEventListener('keydown', e => { if (e.key === 'Escape' && openMenu) { e.preventDefault(); closeMenus(); } }, true);

  function menubar(defs, onAct) {
    const bar = document.createElement('div');
    bar.className = 'mbar'; bar.setAttribute('role', 'menubar');
    bar.innerHTML = defs.map((d, i) => '<button type="button" role="menuitem" aria-haspopup="true" aria-expanded="false" data-m="' + i + '">' + T(d.label) + '</button>').join('');
    const openAt = (btn, kb) => {
      const d = defs[+btn.dataset.m], r = btn.getBoundingClientRect();
      const items = typeof d.items === 'function' ? d.items() : d.items;
      showDrop(items, r.left, r.bottom, onAct, { focus: kb, opener: btn, onClose: () => { btn.classList.remove('is-open'); btn.setAttribute('aria-expanded', 'false'); } });
      btn.classList.add('is-open'); btn.setAttribute('aria-expanded', 'true');
    };
    bar.addEventListener('click', e => {
      const btn = e.target.closest('[data-m]'); if (!btn) return;
      if (btn.classList.contains('is-open')) { closeMenus(); return; }
      openAt(btn, e.detail === 0);
    });
    bar.addEventListener('pointerover', e => {
      const btn = e.target.closest('[data-m]');
      if (!btn || btn.classList.contains('is-open') || !$('.is-open', bar)) return;
      openAt(btn, false);
    });
    bar.addEventListener('keydown', e => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      const list = $$('[data-m]', bar), i = list.indexOf(document.activeElement);
      if (i < 0) return;
      e.preventDefault(); list[(i + (e.key === 'ArrowRight' ? 1 : -1) + list.length) % list.length].focus();
    });
    return bar;
  }
  function contextMenu(e, items, onAct) { e.preventDefault(); showDrop(items, e.clientX, e.clientY, onAct, {}); }

  /* ---------- Boîtes de message ---------- */
  let msgN = 0;
  function msg(o) {
    const id = o.id || 'msg' + (++msgN);
    if (WM.get(id)) WM.close(id, true);
    const btns = o.buttons || [{ id: 'ok', label: 'OK', def: true }];
    const W = WM.create(id, {
      title: o.title, icon: o.icon16 || o.icon || 'info', dialog: true, top: true, notask: true, w: o.w || 390, ctrls: ['close'],
      html: '<div class="dlg"><div class="msg">' + I(o.icon || 'info') + '<div>' + o.html + '</div></div><div class="dlg-btns">' +
        btns.map(b => '<button class="btn' + (b.def ? ' btn--default' : '') + '" type="button" data-b="' + b.id + '"' + (b.disabled ? ' disabled' : '') + '>' + T(b.label) + '</button>').join('') + '</div></div>'
    });
    W.body.addEventListener('click', e => {
      const b = e.target.closest('[data-b]'); if (!b) return;
      const r = o.onButton ? o.onButton(b.dataset.b, W) : undefined;
      if (r !== false) WM.close(id);
    });
    const def = $('.btn--default', W.body) || $('.btn', W.body); if (def) def.focus({ preventScroll: true });
    if (o.sound !== false) Sfx.ding();
    return W;
  }
  addEventListener('keydown', e => {
    if (e.key !== 'Escape' || e.defaultPrevented) return;
    const W = WM.active && WM.get(WM.active);
    if (W && W.dialog) { e.preventDefault(); WM.close(W.id); }
  });

  window.XP = { pt, fitScreen, $, $$, clamp, fr, esc, T, small, pic, ico, toast, copyText, selectText, mailto, openExternal, setHash, busy, Files, detect, canSave, saveBlob, downloadCV, WM, menubar, showDrop, closeMenus, contextMenu, msg, PDF_NAME, apps: {} };
})();
