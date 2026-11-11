/* Le bureau d'Arthur : icônes, menu démarrer, barre des tâches, bulle, session et adresses. */
(function () {
  'use strict';
  const X = window.XP, A = X.apps, D = window.SiteData, Sfx = window.Sfx, I = window.XPIcons.icon;
  const { $, $$, T, esc, ico, pic, toast, copyText, WM, Files } = X;
  const P = D.person;

  /* ---------- Icônes du bureau ---------- */
  const ICONS = () => [
    { id: 'profil', label: 'Mon profil', icon: 'profile', tip: 'Qui je suis, en un coup d’œil', run: () => A.profile() },
    { id: 'docs', label: 'Mes documents', icon: 'mydocs', tip: 'Tous mes fichiers', node: 'docs', run: () => A.explorer('docs') },
    { id: 'exp', label: 'Mes expériences', icon: 'folder', tip: 'Un dossier par entreprise, un fichier par poste', node: 'exp', run: () => A.explorer('exp') },
    { id: 'comp', label: 'Compétences', icon: 'folder', tip: 'Ce que je sais faire, et où je l’ai fait', node: 'comp', run: () => A.explorer('comp') },
    { id: 'form', label: 'Formation', icon: 'folder', tip: 'Diplômes et titres', node: 'form', run: () => A.explorer('form') },
    { id: 'lisezmoi', label: 'LISEZMOI.txt', icon: 'txt', tip: 'Le mode d’emploi de ce bureau', node: 'lisezmoi', run: () => A.open('lisezmoi') },
    { id: 'cvdoc', label: 'CV Arthur Chauvineau.doc', icon: 'doc', tip: 'Mon CV complet', node: 'cvdoc', run: () => A.open('cvdoc') },
    Files.pdf === 'ok' ? { id: 'cvpdf', label: 'CV Arthur Chauvineau.pdf', icon: 'pdf', tip: 'La version imprimable', node: 'cvpdf', run: () => A.open('cvpdf') } : null,
    { id: 'mail', label: 'Écrire à Arthur', icon: 'compose', tip: 'Un message prêt à envoyer', run: () => A.compose() },
    { id: 'minigolf', label: 'Mini-golf', icon: 'minigolf', tip: 'Golfeur depuis 25 ans : 4 trous, un par étape de mon parcours', run: () => A.minigolf() },
    { id: 'linkedin', label: 'Mon LinkedIn', icon: 'weblink', tip: 'Mon profil LinkedIn (s’ouvre dans un nouvel onglet)', run: () => X.openExternal(P.linkedin) },
    { id: 'trash', label: 'Corbeille', icon: 'trash', tip: '1 élément supprimé, pour une bonne raison', node: 'trash', corner: true, run: () => A.explorer('trash') }
  ].filter(Boolean);
  const iconBtn = i => '<button class="dico" type="button" data-icon="' + i.id + '" title="' + esc(X.fr(i.tip)) + '">' + ico(i.icon) + '<span>' + T(i.label) + '</span></button>';
  function buildIcons() {
    const list = ICONS(), sel = ($('.dico.is-sel') || {}).dataset;
    $('#desk-icons').innerHTML = list.filter(i => !i.corner).map(iconBtn).join('');
    $('#desk-corner').innerHTML = list.filter(i => i.corner).map(iconBtn).join('');
    if (sel && sel.icon) { const b = $('.dico[data-icon="' + sel.icon + '"]'); if (b) b.classList.add('is-sel'); }
  }
  let opened = 0, hinted = false;
  function runIcon(id) { const it = ICONS().find(i => i.id === id); if (it) { opened++; it.run(); } }
  function refresh() { const box = $('#desk'); box.classList.add('is-refresh'); setTimeout(() => { buildIcons(); box.classList.remove('is-refresh'); }, 120); }

  /* ---------- Menu démarrer ---------- */
  function buildStart() {
    const left = [['profil', 'profile', 'Mon profil', 'Qui je suis'], ['mail', 'compose', 'Écrire à Arthur', 'Un message prêt à envoyer'], 'hr',
      ['lisezmoi', 'txt', 'LISEZMOI.txt'], ['cvdoc', 'doc', 'CV Arthur Chauvineau.doc'], ['minigolf', 'minigolf', 'Mini-golf']];
    const right = [['docs', 'mydocs', 'Mes documents'], ['exp', 'folder', 'Mes expériences'], ['comp', 'folder', 'Compétences'], ['form', 'folder', 'Formation'], 'hr',
      Files.pdf === 'ok' ? ['cvpdf', 'pdf', 'CV en PDF'] : null, ['copy-mail', 'mail', 'Copier l’e-mail'], ['copy-tel', 'phone', 'Copier le téléphone'], 'hr',
      ['display', 'monitor', 'Affichage'], ['sound', Sfx.enabled ? 'speaker2' : 'mute2', Sfx.enabled ? 'Couper les sons' : 'Activer les sons'], ['help', 'help', 'Aide']].filter(Boolean);
    const item = ([id, ic, l, s]) => '<button class="sm-item' + (s ? ' sm-item--pin' : '') + '" type="button" role="menuitem" data-sm="' + id + '">' + ico(ic) + '<span>' + (s ? '<b>' + T(l) + '</b><small>' + T(s) + '</small>' : T(l)) + '</span></button>';
    $('#startmenu').innerHTML = '<div class="sm-head">' + pic() + '<div>' + T(P.name) + '<small>' + T(P.status) + '</small></div></div><div class="sm-cols"><div class="sm-left">' +
      left.map(x => (x === 'hr' ? '<div class="sm-hr"></div>' : item(x))).join('') + '<div class="sm-grow"></div><div class="sm-hr"></div><button class="sm-item sm-all" type="button" role="menuitem" aria-haspopup="true" data-sm="all"><span>Tous les programmes</span>' + I('fwd') + '</button></div><div class="sm-right">' + right.map(x => (x === 'hr' ? '<div class="sm-hr"></div>' : item(x))).join('') +
      '</div></div><div class="sm-foot"><button type="button" role="menuitem" data-sm="logoff">' + I('logoff') + 'Fermer la session</button></div>';
  }
  function toggleStart(force) {
    const sm = $('#startmenu'), btn = $('#start-btn');
    const open = force !== undefined ? force : sm.hidden;
    if (open === !sm.hidden) return;
    sm.hidden = !open; btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) { X.closeMenus(); buildStart(); Sfx.pop(); const f = $('.sm-item', sm); if (f) f.focus({ preventScroll: true }); }
  }
  function startAction(id) {
    toggleStart(false);
    const map = {
      profil: () => A.profile(), mail: () => A.compose(), minigolf: () => A.minigolf(), display: () => A.display(), help: () => A.open('lisezmoi'),
      'copy-mail': () => copyText(P.email, null, 'Adresse'), 'copy-tel': () => copyText(P.phone, null, 'Numéro'), sound: toggleSound, logoff
    };
    if (map[id]) map[id](); else if (['docs', 'exp', 'comp', 'form'].includes(id)) A.explorer(id); else A.open(id);
  }

  /* ---------- Barre des tâches ---------- */
  function clock() {
    const d = new Date(), p = n => String(n).padStart(2, '0'), el = $('#clock');
    el.textContent = p(d.getHours()) + ':' + p(d.getMinutes()); el.dateTime = d.toISOString();
    el.title = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }
  function trayIcons() {
    $('#start-ico').innerHTML = I('ball');
    const dsp = $('#tray-dispo'); dsp.innerHTML = I('dispo'); dsp.title = X.fr(P.status);
    const s = $('#tray-sound'); s.innerHTML = I(Sfx.enabled ? 'speaker' : 'mute'); s.setAttribute('aria-pressed', Sfx.enabled ? 'true' : 'false');
    const l = Sfx.enabled ? 'Couper les sons' : 'Activer les sons'; s.setAttribute('aria-label', l); s.title = l;
  }
  function toggleSound() { Sfx.setEnabled(!Sfx.enabled); trayIcons(); toast(Sfx.enabled ? 'Sons activés' : 'Sons désactivés'); if (Sfx.enabled) Sfx.pop(); }
  let balloonT = 0;
  function balloon(show) {
    const b = $('#balloon');
    if (!show) { b.hidden = true; clearTimeout(balloonT); return; }
    b.innerHTML = '<button class="bl-x" type="button" aria-label="Fermer la bulle">×</button><div class="bl-click"><b>' + I('info') + T(P.status) + '</b><p>' + T('Arthur cherche un poste en expérience client et transformation digitale. Cliquez ici pour lui écrire.') + '</p></div>';
    b.hidden = false; Sfx.ding(); clearTimeout(balloonT); balloonT = setTimeout(() => { b.hidden = true; }, 14000);
  }

  /* ---------- Session ---------- */
  let logged = false;
  function login() {
    if (logged) return; logged = true;
    const w = $('#welcome'); w.classList.add('is-loading'); $('#welcome-hint').textContent = 'Ouverture de la session';
    Sfx.chime(); X.busy(900);
    setTimeout(() => {
      w.classList.add('is-done');
      try { sessionStorage.setItem('ac.session', '1'); } catch (e) { /* ignoré */ }
      if (!route() && !X.small()) { A.open('lisezmoi'); A.profile(); setTimeout(() => WM.flash('np-lisezmoi'), 2200); }
      setTimeout(() => { if (!(X.small() && WM.all().length) && !WM.get('minigolf')) balloon(true); }, 1600);
    }, 650);
  }
  function logoff() {
    WM.all().forEach(W => WM.close(W.id, true));
    balloon(false); logged = false; X.closeMenus();
    try { sessionStorage.removeItem('ac.session'); } catch (e) { /* ignoré */ }
    const w = $('#welcome'); w.classList.remove('is-done', 'is-loading'); $('#welcome-hint').textContent = P.status;
    $('#welcome-user').focus({ preventScroll: true });
  }
  function route() {
    const id = decodeURIComponent((location.hash || '').slice(1)).toLowerCase();
    if (!id) return false;
    const R = {
      profil: () => A.profile(), documents: () => A.explorer('docs'), experiences: () => A.explorer('exp'), competences: () => A.explorer('comp'), formation: () => A.explorer('form'),
      corbeille: () => A.explorer('trash'), cv: () => A.open('cvdoc'), contact: () => A.compose(), lisezmoi: () => A.open('lisezmoi'), 'ce-que-je-cherche': () => A.open('cherche'),
      minigolf: () => A.minigolf(), parcours: () => A.minigolf(), golf: () => A.minigolf()
    };
    if (R[id]) { R[id](); return true; }
    if (D.experiences.some(e => e.id === id)) { A.explorer('exp/' + id); return true; }
    return false;
  }

  function init() {
    document.documentElement.lang = 'fr';
    A.wall.init();
    trayIcons(); buildIcons(); buildStart(); clock(); setInterval(clock, 15000);
    const desk = $('#desk');
    let lastPT = 'mouse';
    desk.addEventListener('pointerdown', e => { lastPT = e.pointerType || 'mouse'; });
    desk.addEventListener('click', e => {
      const b = e.target.closest('.dico');
      $$('.dico.is-sel').forEach(x => { if (x !== b) x.classList.remove('is-sel'); });
      if (!b) { WM.blurAll(); return; }
      b.classList.add('is-sel');
      if (lastPT === 'touch' || lastPT === 'pen') { runIcon(b.dataset.icon); return; }
      if (!hinted && e.detail === 1) {
        hinted = true; const before = opened;
        setTimeout(() => { if (opened === before && logged) toast('Double-cliquez sur une icône pour l’ouvrir'); }, 1100);
      }
    });
    desk.addEventListener('dblclick', e => { const b = e.target.closest('.dico'); if (b && lastPT === 'mouse') runIcon(b.dataset.icon); });
    desk.addEventListener('keydown', e => {
      const b = e.target.closest('.dico'); if (!b) return;
      if (e.key === 'Enter') { e.preventDefault(); runIcon(b.dataset.icon); return; }
      const list = $$('.dico', desk), i = list.indexOf(b);
      const d = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
      if (!d) return;
      e.preventDefault();
      const n = list[Math.max(0, Math.min(list.length - 1, i + d))];
      list.forEach(x => x.classList.toggle('is-sel', x === n)); n.focus();
    });
    desk.addEventListener('contextmenu', e => {
      const b = e.target.closest('.dico');
      if (b) {
        $$('.dico.is-sel').forEach(x => x.classList.remove('is-sel')); b.classList.add('is-sel');
        const it = ICONS().find(i => i.id === b.dataset.icon);
        X.contextMenu(e, [{ id: 'open', label: 'Ouvrir', bold: true }, { sep: true }, { id: 'props', label: 'Propriétés', disabled: !(it.node || it.id === 'profil') }],
          cmd => { if (cmd === 'open') runIcon(it.id); else if (it.id === 'profil') A.profile(); else A.fileProps(it.node); });
      } else {
        X.contextMenu(e, [{ id: 'refresh', label: 'Actualiser' }, { sep: true }, { id: 'mail', label: 'Écrire à Arthur' }, { sep: true }, { id: 'props', label: 'Propriétés' }],
          cmd => { if (cmd === 'refresh') refresh(); else if (cmd === 'mail') A.compose(); else A.display(); });
      }
    });
    $('#start-btn').addEventListener('click', e => { e.stopPropagation(); toggleStart(); });
    $('#startmenu').addEventListener('click', e => {
      const b = e.target.closest('[data-sm]'); if (!b) return;
      if (b.dataset.sm !== 'all') { startAction(b.dataset.sm); return; }
      const r = b.getBoundingClientRect();
      X.showDrop([{ id: 'p-ex', label: 'Explorateur' }, { id: 'p-np', label: 'Bloc-notes' }, { id: 'p-wp', label: 'Traitement de texte' }, { id: 'p-mail', label: 'Messagerie' }, { sep: true }, { id: 'p-golf', label: 'Mini-golf' }, { sep: true }, { id: 'p-disp', label: 'Propriétés d’affichage' }],
        r.right - 2, r.top, cmd => { toggleStart(false); ({ 'p-ex': () => A.explorer('docs'), 'p-np': () => A.open('lisezmoi'), 'p-wp': () => A.open('cvdoc'), 'p-mail': () => A.compose(), 'p-golf': () => A.minigolf(), 'p-disp': () => A.display() })[cmd](); },
        { above: r.bottom, focus: e.detail === 0, opener: b });
    });
    $('#startmenu').addEventListener('keydown', e => {
      const list = $$('[data-sm]', $('#startmenu')), i = list.indexOf(document.activeElement);
      if (e.key === 'ArrowDown') { e.preventDefault(); list[(i + 1) % list.length].focus(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); list[(i - 1 + list.length) % list.length].focus(); }
    });
    document.addEventListener('pointerdown', e => { const sm = $('#startmenu'); if (!sm.hidden && !e.target.closest('#startmenu') && !e.target.closest('#start-btn') && !e.target.closest('.mdrop')) toggleStart(false); });
    $('#tray-sound').addEventListener('click', toggleSound);
    $('#tray-dispo').addEventListener('click', () => balloon($('#balloon').hidden));
    $('#balloon').addEventListener('click', e => { balloon(false); if (!e.target.closest('.bl-x')) A.compose(); });
    addEventListener('sfxchange', trayIcons);
    addEventListener('keydown', e => {
      if (e.key === 'Escape' && !$('#startmenu').hidden) { toggleStart(false); $('#start-btn').focus(); return; }
      if (!logged && (e.key === 'Enter' || e.key === ' ') && document.activeElement !== $('#welcome-user')) { e.preventDefault(); login(); }
    });
    addEventListener('hashchange', () => { if (logged) route(); });
    const unlock = () => Sfx.unlock();
    addEventListener('pointerdown', unlock, { once: true }); addEventListener('keydown', unlock, { once: true });
    $('#welcome-user').addEventListener('click', login);
    $('#welcome').addEventListener('click', e => { if (!e.target.closest('#welcome-user')) login(); });
    WM.on('open', () => { if (X.small()) balloon(false); });
    WM.on('open', W => { if (W.id === 'minigolf') balloon(false); });
    Files.ready.push(() => { buildIcons(); buildStart(); });
    X.detect();
    let seen = false; try { seen = sessionStorage.getItem('ac.session') === '1'; } catch (e) { /* ignoré */ }
    const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (seen || reduce || (location.hash && location.hash.length > 1)) login();
    else setTimeout(() => { if (!logged) login(); }, 2600);
  }

  window.App = { WM, open: A.open, apps: A, toast };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
