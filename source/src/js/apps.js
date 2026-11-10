/* Applications d'époque : explorateur, Bloc-notes, traitement de texte, messagerie, feuilles de propriétés. */
(function () {
  'use strict';
  const X = window.XP, D = window.SiteData, FS = window.FS, Sfx = window.Sfx, I = window.XPIcons.icon;
  const { $, $$, T, esc, ico, toast, copyText, WM, menubar, msg, Files } = X;
  const IMG = window.__IMG || {};
  const P = D.person;
  const PHONE_INTL = P.phoneHref.replace('tel:', '');

  const HASH = { docs: 'documents', exp: 'experiences', comp: 'competences', form: 'formation', trash: 'corbeille', lisezmoi: 'lisezmoi', cherche: 'ce-que-je-cherche', cvdoc: 'cv' };
  const hashFor = id => HASH[id] || (/^exp\/[^/]+$/.test(id) && id !== 'exp/recap' ? id.slice(4) : null);
  const visible = n => !!n && (n.id !== 'cvpdf' || Files.pdf === 'ok');
  const kidsOf = n => (n.children || []).map(FS.get).filter(visible);
  const APP = { txt: 'Bloc-notes', doc: 'Traitement de texte', pdf: 'Lecteur de documents PDF', vcf: 'Carnet d’adresses' };
  const FAV = ['docs', 'exp', 'comp', 'form'];
  const BRINGS = ['La double lecture business et tech : grands comptes européens, puis Lead Tech chez Demooz.', 'Le réflexe d’entrepreneur : 36POSES, une plateforme e-commerce créée de A à Z.', 'Le sens du client, forgé par des années de photographie, en indépendant puis en studio.', 'Deux évolutions internes : photographe puis directeur adjoint, Key Account Manager puis Lead Tech.'];
  const SEEK = 'Un poste à la croisée de l’expérience client et de la transformation digitale : un rôle où relier vision stratégique, enjeux clients et performance.';
  const store = { get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : v; } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* ignoré */ } } };
  const fmtBytes = b => b.toLocaleString('fr-FR') + ' octets';
  const keyId = s => s.replace(/[^\w]/g, '-');

  function about() {
    msg({ id: 'about', title: 'À propos du bureau d’Arthur', icon: 'info', w: 400, sound: false,
      html: '<p><b>Le bureau d’Arthur</b><br>Version 2026</p><p>' + T('Un CV interactif façon bureau des années 2000. Icônes, sons, fond d’écran et mini-golf sont des créations originales.') + '</p><p>' + T(P.name + ' · ' + P.email) + '</p>' });
  }

  /* ---------- Ouvrir un élément avec la bonne application ---------- */
  function open(fid) {
    const n = FS.get(fid); if (!visible(n)) return null;
    if (n.type === 'folder') return explorer(fid);
    if (n.type === 'txt') return notepad(fid);
    if (n.type === 'doc') return wordpad();
    if (n.type === 'pdf') return download();
    if (n.type === 'vcf') return profile('contact');
    return null;
  }

  /* ---------- Explorateur ---------- */
  let exN = 0;
  function explorer(folderId) {
    const start = FS.get(folderId) && FS.get(folderId).type === 'folder' ? folderId : 'docs';
    const same = WM.all().find(W => W.kind === 'explorer' && W.state.cur === start);
    if (same) { WM.focus(same.id); return same; }
    const id = 'ex' + (++exN);
    const html = '<div class="ex"><div class="tbar">' +
      '<button class="tb" type="button" data-x="back" title="Précédente">' + I('back') + '<span>Précédente</span></button>' +
      '<button class="tb" type="button" data-x="fwd" title="Suivante">' + I('fwd') + '</button>' +
      '<button class="tb" type="button" data-x="up" title="Dossier parent">' + I('up') + '</button><span class="tsep"></span>' +
      '<button class="tb" type="button" data-x="views" title="Affichage" aria-haspopup="true">' + I('views') + '<span>Affichage</span></button></div>' +
      '<div class="abar"><span class="abar-l">Adresse</span><div class="abar-f"><span class="abar-i"></span><input type="text" readonly aria-label="Adresse"></div><button class="tb" type="button" data-x="refresh" title="Atteindre">' + I('fwd') + '<span>OK</span></button></div>' +
      '<div class="ex-main"><aside class="ex-pane" aria-label="Volet des tâches"></aside><div class="ex-view" tabindex="0" role="listbox" aria-label="Contenu du dossier"></div></div>' +
      '<div class="sbar"><span class="grow st-a"></span><span class="st-b"></span><span class="st-c">' + I('monitor') + 'Poste de travail</span></div></div>';
    const W = WM.create(id, { title: FS.get(start).name, icon: FS.iconOf(FS.get(start)), w: 800, h: 540, html, kind: 'explorer', hash: hashFor(start), focus: '.ex-view', minW: 360, minH: 260 });
    const S = W.state = { cur: start, back: [], fwd: [], sel: null, view: store.get('ac.view', 'tiles') === 'details' ? 'details' : 'tiles', closed: {} };
    const root = $('.ex', W.body), view = $('.ex-view', W.body), pane = $('.ex-pane', W.body);
    const cur = () => FS.get(S.cur), selN = () => (S.sel ? FS.get(S.sel) : null);

    const MENUS = [
      { label: 'Fichier', items: () => { const s = selN(); return [{ id: 'open', label: 'Ouvrir', disabled: !s, bold: !!s }, { sep: true }, { id: 'props', label: 'Propriétés' }, { sep: true }, { id: 'close', label: 'Fermer' }]; } },
      { label: 'Edition', items: () => { const s = selN(); return [{ id: 'copy', label: 'Copier le contenu', disabled: !(s && s.type === 'txt') }, { id: 'copypath', label: 'Copier le chemin d’accès' }]; } },
      { label: 'Affichage', items: () => viewItems().concat([{ sep: true }, { id: 'refresh', label: 'Actualiser' }]) },
      { label: 'Favoris', items: () => FAV.map(f => ({ id: 'go:' + f, label: FS.get(f).name, disabled: f === S.cur })) },
      { label: '?', items: [{ id: 'readme', label: 'Lire LISEZMOI.txt' }, { sep: true }, { id: 'about', label: 'À propos du bureau d’Arthur' }] }
    ];
    const viewItems = () => [{ id: 'v-tiles', label: 'Mosaïques', radio: true, checked: S.view === 'tiles' }, { id: 'v-details', label: 'Détails', radio: true, checked: S.view === 'details' }];
    root.insertBefore(menubar(MENUS, act), root.firstChild);

    function go(target, mode) {
      const t = FS.get(target);
      if (!t || t.type !== 'folder' || target === S.cur) return;
      if (mode === 'back') S.fwd.push(S.cur); else if (mode === 'fwd') S.back.push(S.cur); else { S.back.push(S.cur); S.fwd = []; }
      S.cur = target; S.sel = null; Sfx.nav(); X.busy(220); render(); view.scrollTop = 0;
    }
    function act(cmd) {
      const s = selN();
      if (cmd.startsWith('go:')) return go(cmd.slice(3));
      switch (cmd) {
        case 'open': if (s) openItem(s.id); break;
        case 'props': fileProps(s ? s.id : S.cur); break;
        case 'copy': if (s && s.text) copyText(s.text.replace(/\r\n/g, '\n'), null, 'Contenu'); break;
        case 'copypath': copyText(FS.path(s ? s.id : S.cur), null, 'Chemin d’accès'); break;
        case 'close': WM.close(id); break;
        case 'v-tiles': case 'v-details': S.view = cmd.slice(2); store.set('ac.view', S.view); renderView(); break;
        case 'refresh': view.style.visibility = 'hidden'; setTimeout(() => { view.style.visibility = ''; renderView(); }, 90); break;
        case 'back': if (S.back.length) go(S.back.pop(), 'back'); break;
        case 'fwd': if (S.fwd.length) go(S.fwd.pop(), 'fwd'); break;
        case 'up': if (cur().parent) go(cur().parent); break;
        case 'compose': compose(); break;
        case 'pdf': download(); break;
        case 'readme': open('lisezmoi'); break;
        case 'about': about(); break;
      }
    }
    function openItem(iid) { const k = FS.get(iid); if (!k) return; if (k.type === 'folder') go(iid); else open(iid); }

    function render() {
      const n = cur();
      WM.setTitle(id, n.name); WM.setIcon(id, FS.iconOf(n)); WM.setHash(id, hashFor(n.id));
      $('.abar-i', W.body).innerHTML = I(FS.iconOf(n));
      $('.abar-f input', W.body).value = FS.path(n.id);
      $('[data-x="back"]', W.body).disabled = !S.back.length;
      $('[data-x="fwd"]', W.body).disabled = !S.fwd.length;
      $('[data-x="up"]', W.body).disabled = !n.parent;
      renderView(); renderPane(); renderStatus();
    }
    const tileLines = k => k.type === 'folder'
      ? (k.meta ? '<small>' + T(k.meta) + '</small>' : '') + (k.note ? '<small>' + T(k.note) + '</small>' : '')
      : '<small>' + T(FS.TYPES[k.type]) + '</small><small>' + esc(FS.size(k)) + '</small>';
    function renderView() {
      const n = cur(), kids = kidsOf(n);
      view.classList.toggle('is-details', S.view === 'details');
      if (!kids.length) { view.innerHTML = '<p class="ex-empty">' + T(n.id === 'trash' ? 'La Corbeille est vide.' : 'Ce dossier est vide.') + '</p>'; return; }
      if (S.view === 'details') {
        view.innerHTML = '<div class="lv"><table><thead><tr><th>Nom</th><th class="r">Taille</th><th>Type</th><th>Période</th></tr></thead><tbody>' +
          kids.map(k => '<tr class="row' + (k.id === S.sel ? ' is-sel' : '') + '" data-id="' + esc(k.id) + '" role="option" aria-selected="' + (k.id === S.sel) + '"><td>' + I(FS.iconOf(k)) + T(k.name) + '</td><td class="r">' + esc(FS.size(k)) + '</td><td>' + T(FS.TYPES[k.type]) + '</td><td>' + T(k.meta || '') + '</td></tr>').join('') +
          '</tbody></table></div>';
      } else {
        view.innerHTML = kids.map(k => '<button class="it' + (k.id === S.sel ? ' is-sel' : '') + '" type="button" tabindex="-1" role="option" aria-selected="' + (k.id === S.sel) + '" data-id="' + esc(k.id) + '">' + I(FS.iconOf(k)) + '<span class="it-t"><b>' + T(k.name) + '</b>' + tileLines(k) + '</span></button>').join('');
      }
    }
    const section = (key, title, body) => '<div class="tp' + (S.closed[key] ? ' is-closed' : '') + '" data-tp="' + key + '"><button class="tp-h" type="button" aria-expanded="' + !S.closed[key] + '">' + T(title) + '<i aria-hidden="true"></i></button><div class="tp-b">' + body + '</div></div>';
    const link = (cmd, icon, label) => '<button class="tp-a" type="button" data-a="' + esc(cmd) + '">' + ico(icon) + '<span>' + T(label) + '</span></button>';
    function renderPane() {
      const n = cur(), s = selN();
      let tasks;
      if (s && s.type === 'folder') tasks = link('open', 'folderOpen', 'Ouvrir ce dossier') + link('props', 'info', 'Afficher les propriétés');
      else if (s) tasks = link('open', FS.iconOf(s), 'Ouvrir ce fichier') + (s.type === 'txt' ? link('copy', 'copy', 'Copier le contenu') : '') + link('props', 'info', 'Afficher les propriétés');
      else tasks = link('compose', 'compose', 'Écrire à Arthur') + (Files.pdf === 'ok' ? link('pdf', 'pdf', 'Télécharger le CV en PDF') : '') + link('readme', 'txt', 'Lire LISEZMOI.txt');
      const places = [n.parent].concat(FAV).filter((p, i, a) => p && p !== n.id && a.indexOf(p) === i).map(p => link('go:' + p, FS.iconOf(FS.get(p)), FS.get(p).name)).join('');
      const d = s || n;
      const det = '<p class="tp-name">' + T(d.name) + '</p><p>' + T(FS.TYPES[d.type]) + '</p>' + (d.type !== 'folder' ? '<p>Taille : ' + esc(FS.size(d)) + '</p>' : '') + (d.meta ? '<p>Période : ' + T(d.meta) + '</p>' : '') + (d.type === 'folder' && d.note ? '<p>' + T(d.note) + '</p>' : '');
      pane.innerHTML = section('t', s ? (s.type === 'folder' ? 'Gestion des dossiers' : 'Gestion des fichiers') : 'Gestion des fichiers et dossiers', tasks) + section('p', 'Autres emplacements', places) + section('d', 'Détails', det);
    }
    function renderStatus() {
      const n = cur(), s = selN(), kids = kidsOf(n);
      const total = kids.filter(k => k.type !== 'folder').reduce((t, k) => t + FS.bytes(k), 0);
      $('.st-a', W.body).textContent = s ? (s.type === 'folder' ? FS.TYPES.folder + (s.note ? ' · ' + s.note : '') : 'Type : ' + FS.TYPES[s.type] + '\u2003Taille : ' + FS.size(s)) : kids.length + (kids.length > 1 ? ' objets' : ' objet');
      $('.st-b', W.body).textContent = s ? (s.type === 'folder' ? '' : FS.size(s)) : (total ? FS.kb(total) : '');
    }
    function select(sid, reveal) {
      S.sel = sid;
      $$('[data-id]', view).forEach(el => { const on = el.dataset.id === sid; el.classList.toggle('is-sel', on); el.setAttribute('aria-selected', on ? 'true' : 'false'); if (on && reveal) el.scrollIntoView({ block: 'nearest' }); });
      renderPane(); renderStatus();
    }

    let lastPT = 'mouse';
    view.addEventListener('pointerdown', e => { lastPT = e.pointerType || 'mouse'; });
    view.addEventListener('click', e => {
      const it = e.target.closest('[data-id]');
      if (!it) { select(null); return; }
      select(it.dataset.id);
      if (lastPT === 'touch' || lastPT === 'pen') openItem(it.dataset.id);
    });
    view.addEventListener('dblclick', e => { const it = e.target.closest('[data-id]'); if (it && lastPT === 'mouse') openItem(it.dataset.id); });
    view.addEventListener('keydown', e => {
      const ids = kidsOf(cur()).map(k => k.id), i = ids.indexOf(S.sel);
      if (['ArrowDown', 'ArrowRight', 'ArrowUp', 'ArrowLeft', 'Home', 'End'].includes(e.key)) {
        e.preventDefault(); if (!ids.length) return;
        const fwdKey = e.key === 'ArrowDown' || e.key === 'ArrowRight';
        const j = i < 0 ? 0 : e.key === 'Home' ? 0 : e.key === 'End' ? ids.length - 1 : fwdKey ? Math.min(ids.length - 1, i + 1) : Math.max(0, i - 1);
        select(ids[j], true);
      } else if (e.key === 'Enter' && S.sel) { e.preventDefault(); openItem(S.sel); }
      else if (e.key === 'Backspace') { e.preventDefault(); act(S.back.length ? 'back' : 'up'); }
    });
    view.addEventListener('contextmenu', e => {
      const it = e.target.closest('[data-id]');
      if (it) {
        select(it.dataset.id);
        const k = FS.get(it.dataset.id);
        X.contextMenu(e, [{ id: 'open', label: 'Ouvrir', bold: true }, k.type === 'txt' ? { id: 'copy', label: 'Copier le contenu' } : null, { sep: true }, { id: 'props', label: 'Propriétés' }], act);
      } else {
        select(null);
        X.contextMenu(e, viewItems().concat([{ sep: true }, { id: 'refresh', label: 'Actualiser' }, { sep: true }, { id: 'props', label: 'Propriétés' }]), act);
      }
    });
    pane.addEventListener('click', e => {
      const h = e.target.closest('.tp-h');
      if (h) { const tp = h.parentElement, k = tp.dataset.tp; S.closed[k] = !S.closed[k]; tp.classList.toggle('is-closed', S.closed[k]); h.setAttribute('aria-expanded', String(!S.closed[k])); return; }
      const a = e.target.closest('[data-a]'); if (a) act(a.dataset.a);
    });
    W.body.addEventListener('click', e => {
      const b = e.target.closest('[data-x]'); if (!b || b.disabled) return;
      if (b.dataset.x === 'views') { const r = b.getBoundingClientRect(); X.showDrop(viewItems(), r.left, r.bottom, act, { opener: b }); }
      else act(b.dataset.x);
    });
    render();
    return W;
  }

  /* ---------- Propriétés d'un fichier ou d'un dossier ---------- */
  function countIn(n) { let f = 0, d = 0; (n.children || []).forEach(c => { const k = FS.get(c); if (!visible(k)) return; if (k.type === 'folder') { d++; const r = countIn(k); f += r.f; d += r.d; } else f++; }); return { f, d }; }
  function fileProps(nid) {
    const n = FS.get(nid); if (!n) return null;
    const id = 'props-' + keyId(nid);
    if (WM.get(id)) { WM.focus(id); return WM.get(id); }
    const isF = n.type === 'folder', b = FS.bytes(n), full = FS.path(n.id);
    const loc = n.id === 'trash' ? 'Bureau' : full.slice(0, full.lastIndexOf('\\'));
    const c = isF ? countIn(n) : null;
    const rows = [
      ['Type :', FS.TYPES[n.type]], isF ? null : ['S’ouvre avec :', APP[n.type]], 'hr',
      ['Emplacement :', loc], ['Taille :', FS.kb(b) + ' (' + fmtBytes(b) + ')'],
      isF ? ['Contenu :', c.f + (c.f > 1 ? ' fichiers, ' : ' fichier, ') + c.d + (c.d > 1 ? ' dossiers' : ' dossier')] : null, 'hr'
    ].filter(Boolean);
    const html = '<div class="dlg"><div><div class="tabs" role="tablist"><button class="tab" type="button" role="tab" aria-selected="true">Général</button></div><div class="tabpanel">' +
      '<div class="fp-top">' + I(FS.iconOf(n)) + '<input class="inp" type="text" readonly value="' + esc(n.name) + '" aria-label="Nom"></div><hr class="xp">' +
      rows.map(r => r === 'hr' ? '<hr class="xp">' : '<div class="fp-row"><span>' + T(r[0]) + '</span><span>' + T(r[1]) + '</span></div>').join('') +
      '<div class="fp-row"><span>Attributs :</span><span><label class="chk"><input type="checkbox" checked disabled> Lecture seule</label><label class="chk"><input type="checkbox" disabled> Caché</label></span></div>' +
      '</div></div><div class="dlg-btns"><button class="btn btn--default" type="button" data-b="ok">OK</button><button class="btn" type="button" data-b="cancel">Annuler</button><button class="btn" type="button" disabled>Appliquer</button></div></div>';
    const W = WM.create(id, { title: 'Propriétés de ' + n.name, icon: FS.iconOf(n), dialog: true, w: 380, ctrls: ['help', 'close'], onHelp: () => open('lisezmoi'), html, focus: '.btn--default' });
    W.body.addEventListener('click', e => { if (e.target.closest('[data-b]')) WM.close(id); });
    return W;
  }

  /* ---------- Bloc-notes ---------- */
  function notepad(fid) {
    const n = FS.get(fid); if (!n || n.type !== 'txt') return null;
    const id = 'np-' + keyId(fid);
    if (WM.get(id)) { WM.focus(id); return WM.get(id); }
    const W = WM.create(id, { title: n.name + ' - Bloc-notes', icon: 'notepad', w: 680, h: 520, hash: hashFor(fid), minW: 260, minH: 180,
      html: '<div class="np"><textarea class="np-text" readonly spellcheck="false" wrap="soft" aria-label="' + esc(n.name) + '"></textarea></div>', focus: '.np-text' });
    const ta = $('.np-text', W.body);
    ta.value = n.text.replace(/\r\n/g, '\n');
    try { ta.setSelectionRange(0, 0); } catch (e) { /* ignoré */ }
    ta.scrollTop = 0;
    let wrap = true;
    const act = cmd => {
      if (cmd === 'save') X.saveBlob(n.name, new Blob([n.text], { type: 'text/plain;charset=utf-8' }));
      else if (cmd === 'close') WM.close(id);
      else if (cmd === 'copy') { const sel = ta.value.slice(ta.selectionStart, ta.selectionEnd); copyText(sel || ta.value, ta, sel ? 'Sélection' : 'Texte'); }
      else if (cmd === 'all') { ta.focus(); ta.select(); }
      else if (cmd === 'wrap') { wrap = !wrap; ta.classList.toggle('is-nowrap', !wrap); ta.setAttribute('wrap', wrap ? 'soft' : 'off'); }
      else if (cmd === 'about') about();
    };
    $('.np', W.body).insertBefore(menubar([
      { label: 'Fichier', items: () => [{ id: 'save', label: 'Enregistrer sous…', disabled: !X.canSave() }, { sep: true }, { id: 'close', label: 'Quitter' }] },
      { label: 'Edition', items: [{ id: 'copy', label: 'Copier', key: 'Ctrl+C' }, { sep: true }, { id: 'all', label: 'Sélectionner tout', key: 'Ctrl+A' }] },
      { label: 'Format', items: () => [{ id: 'wrap', label: 'Retour automatique à la ligne', checked: wrap }] },
      { label: '?', items: [{ id: 'about', label: 'À propos du bureau d’Arthur' }] }
    ], act), ta);
    return W;
  }

  /* ---------- Traitement de texte : le CV ---------- */
  function cvHtml() {
    const exp = D.experiences.map(e => e.chapters.map((c, k) =>
      '<h3>' + T(c.role) + (c.role === e.company ? '' : ' – ' + T(e.company)) + ' <span>(' + T(c.period) + ')</span></h3><ul>' + c.lines.map(l => '<li>' + T(l) + '</li>').join('') + '</ul>' +
      (k === 0 && e.levelup && e.chapters.length > 1 ? '<p class="lvl">' + T(e.levelup) + '</p>' : '')).join('')).join('');
    return '<header class="wp-head"><div><h1>' + T(P.name.toUpperCase()) + '</h1><p class="sub">' + T(P.headline) + '</p><p class="contact">' + T(P.email) + ' · ' + T(P.phone) + '</p><p class="contact"><b>' + T(P.status) + '</b></p></div>' +
      '<img src="' + (IMG.portrait || IMG.avatar || '') + '" alt="Portrait d’Arthur Chauvineau"></header>' +
      '<h2>Profil</h2><p>' + T(P.pitch) + '</p>' +
      '<h2>Expériences professionnelles</h2>' + exp +
      '<div class="wp-cols"><section><h2>Compétences</h2>' + D.competences.map(c => '<p><b>' + T(c.title) + '</b><br>' + T(c.settings.join(' · ')) + '</p>').join('') + '</section>' +
      '<section><h2>Formation</h2><ul class="plain">' + D.formation.map(f => '<li><b>' + T(f.year) + '</b> · ' + T(f.title) + '</li>').join('') + '</ul><h2>Langues</h2><p>Français · Anglais (Licence LLCE Anglais)</p></section></div>' +
      '<h2>Environnement technique</h2>' + D.tools.map(g => '<p><b>' + T(g.label) + ' :</b> ' + T(g.items.join(', ')) + '</p>').join('') +
      '<h2>Centre d’intérêt</h2><p>' + T(P.golf + '. Le mini-golf de ce bureau est fait maison.') + '</p>';
  }
  function wordpad() {
    const id = 'cvdoc';
    if (WM.get(id)) { WM.focus(id); return WM.get(id); }
    const html = '<div class="wp"><div class="tbar">' + (Files.pdf === 'ok' ? '<button class="tb" type="button" data-w="pdf">' + I('pdf') + '<span>Télécharger le PDF</span></button>' : '') +
      '<button class="tb" type="button" data-w="mail">' + I('compose') + '<span>Écrire à Arthur</span></button><button class="tb" type="button" data-w="copy">' + I('copy') + '<span>Copier l’e-mail</span></button></div>' +
      '<div class="wp-ruler" aria-hidden="true"></div><div class="wp-doc" tabindex="0"><article class="wp-page">' + cvHtml() + '</article></div><div class="sbar"><span class="grow">Prêt</span><span>NUM</span></div></div>';
    const W = WM.create(id, { title: 'CV Arthur Chauvineau.doc - Traitement de texte', icon: 'doc', w: 820, h: 640, hash: 'cv', html, focus: '.wp-doc', minW: 320, minH: 240 });
    const wp = $('.wp', W.body), shown = { tools: true, ruler: true, status: true };
    const act = cmd => {
      if (cmd === 'pdf') download();
      else if (cmd === 'mail') compose();
      else if (cmd === 'copy') copyText(P.email, null, 'Adresse');
      else if (cmd === 'copy-tel') copyText(P.phone, null, 'Numéro');
      else if (cmd === 'all') X.selectText($('.wp-page', W.body));
      else if (cmd === 'close') WM.close(id);
      else if (cmd === 'about') about();
      else if (cmd in shown) { shown[cmd] = !shown[cmd]; $({ tools: '.tbar', ruler: '.wp-ruler', status: '.sbar' }[cmd], wp).hidden = !shown[cmd]; }
    };
    wp.insertBefore(menubar([
      { label: 'Fichier', items: () => [{ id: 'pdf', label: 'Télécharger en PDF…', disabled: Files.pdf !== 'ok' }, { sep: true }, { id: 'close', label: 'Quitter' }] },
      { label: 'Edition', items: [{ id: 'copy', label: 'Copier l’adresse e-mail' }, { id: 'copy-tel', label: 'Copier le numéro de téléphone' }, { sep: true }, { id: 'all', label: 'Sélectionner tout', key: 'Ctrl+A' }] },
      { label: 'Affichage', items: () => [{ id: 'tools', label: 'Barre d’outils', checked: shown.tools }, { id: 'ruler', label: 'Règle', checked: shown.ruler }, { id: 'status', label: 'Barre d’état', checked: shown.status }] },
      { label: '?', items: [{ id: 'about', label: 'À propos du bureau d’Arthur' }] }
    ], act), wp.firstChild);
    W.body.addEventListener('click', e => { const b = e.target.closest('[data-w]'); if (b) act(b.dataset.w); });
    return W;
  }

  /* ---------- Nouveau message ---------- */
  const DEFAULT_SUBJECT = 'Prenons contact';
  const DEFAULT_BODY = 'Bonjour Arthur,\n\nJ’ai découvert votre parcours sur votre site et j’aimerais échanger avec vous au sujet d’un poste chez [entreprise].\n\nSeriez-vous disponible pour un premier échange ?\n\nBien cordialement,\n[Prénom Nom]';
  function compose(prefill) {
    const id = 'mail', ex = WM.get(id);
    if (ex) { WM.focus(id); if (prefill) ex.fill(prefill); return ex; }
    const html = '<div class="oe"><div class="tbar"><button class="tb" type="button" data-o="send">' + I('compose') + '<span>Envoyer</span></button><span class="tsep"></span>' +
      '<button class="tb" type="button" data-o="copy">' + I('copy') + '<span>Copier le message</span></button><button class="tb" type="button" data-o="addr">' + I('mail') + '<span>Copier l’adresse</span></button></div>' +
      '<div class="oe-fields"><label for="oe-to">À :</label><div class="to"><input class="inp" id="oe-to" type="text" readonly value="' + esc(P.name + ' <' + P.email + '>') + '"></div>' +
      '<label for="oe-subj">Objet :</label><input class="inp" id="oe-subj" type="text"></div>' +
      '<textarea class="oe-body" aria-label="Message"></textarea><div class="sbar"><span class="grow">' + T('« Envoyer » ouvre votre messagerie avec ce message prêt à partir.') + '</span></div></div>';
    const W = WM.create(id, { title: DEFAULT_SUBJECT, icon: 'compose', w: 640, h: 500, hash: 'contact', html, minW: 300, minH: 260, focus: X.small() ? null : '.oe-body' });
    const subj = $('#oe-subj', W.body), body = $('.oe-body', W.body);
    W.fill = p => { subj.value = p.subject || DEFAULT_SUBJECT; body.value = p.body || DEFAULT_BODY; WM.setTitle(id, subj.value || 'Nouveau message'); };
    W.fill(prefill || {});
    subj.addEventListener('input', () => WM.setTitle(id, subj.value.trim() || 'Nouveau message'));
    const copyMsg = () => copyText('À : ' + P.email + '\nObjet : ' + subj.value + '\n\n' + body.value, body, 'Message');
    const act = cmd => {
      if (cmd === 'send') {
        X.openExternal(X.mailto(subj.value, body.value));
        msg({ title: 'Envoi du message', icon: 'info', w: 400, html: '<p>' + T('Votre messagerie devrait s’ouvrir avec ce message, prêt à partir.') + '</p><p>' + T('Si rien ne s’ouvre, copiez le message et envoyez-le à ') + '<b>' + T(P.email) + '</b>.</p>',
          buttons: [{ id: 'copy', label: 'Copier le message' }, { id: 'ok', label: 'OK', def: true }], onButton: b => { if (b === 'copy') copyMsg(); } });
      } else if (cmd === 'copy') copyMsg();
      else if (cmd === 'addr') copyText(P.email, $('#oe-to', W.body), 'Adresse');
      else if (cmd === 'close') WM.close(id);
      else if (cmd === 'all') { body.focus(); body.select(); }
      else if (cmd === 'reset') W.fill({});
      else if (cmd === 'about') about();
    };
    $('.oe', W.body).insertBefore(menubar([
      { label: 'Fichier', items: [{ id: 'send', label: 'Envoyer le message' }, { sep: true }, { id: 'close', label: 'Fermer' }] },
      { label: 'Edition', items: [{ id: 'copy', label: 'Copier le message' }, { id: 'addr', label: 'Copier l’adresse' }, { sep: true }, { id: 'all', label: 'Sélectionner tout', key: 'Ctrl+A' }, { sep: true }, { id: 'reset', label: 'Rétablir le modèle' }] },
      { label: '?', items: [{ id: 'about', label: 'À propos du bureau d’Arthur' }] }
    ], act), $('.oe .tbar', W.body));
    W.body.addEventListener('click', e => { const b = e.target.closest('[data-o]'); if (b) act(b.dataset.o); });
    return W;
  }

  /* ---------- Propriétés d'Arthur (profil) ---------- */
  function vcard() {
    const v = ['BEGIN:VCARD', 'VERSION:3.0', 'N:Chauvineau;Arthur;;;', 'FN:' + P.name, 'TITLE:' + P.headline, 'EMAIL;TYPE=INTERNET:' + P.email, 'TEL;TYPE=CELL:' + PHONE_INTL, 'NOTE:' + P.status, 'END:VCARD', ''].join('\r\n');
    X.saveBlob('Arthur Chauvineau.vcf', new Blob([v], { type: 'text/vcard;charset=utf-8' }));
  }
  function profile(tab) {
    const id = 'profil', ex = WM.get(id);
    if (ex) { WM.focus(id); if (tab) ex.showTab(tab); return ex; }
    const TABS = [['gen', 'Général'], ['pres', 'Présentation'], ['parc', 'Parcours'], ['contact', 'Contact']];
    const html = '<div class="dlg pp"><div><div class="tabs" role="tablist">' + TABS.map(([k, l]) => '<button class="tab" type="button" role="tab" id="pp-t-' + k + '" aria-controls="pp-p" aria-selected="false" data-tab="' + k + '">' + T(l) + '</button>').join('') +
      '</div><div class="tabpanel" id="pp-p" role="tabpanel"></div></div><div class="dlg-btns"><button class="btn btn--default" type="button" data-b="ok">OK</button><button class="btn" type="button" data-b="cancel">Annuler</button><button class="btn" type="button" disabled>Appliquer</button></div></div>';
    const roles = [];
    D.experiences.forEach(e => e.chapters.forEach((c, k) => roles.push({ period: c.period, role: c.role, org: e.company === 'Photographe indépendant' ? 'À mon compte' : e.company, file: 'exp/' + e.id + '/' + k })));
    const panels = {
      gen: () => '<div class="pp-gen"><div class="pp-photo"><img src="' + (IMG.portrait || IMG.avatar || '') + '" alt="Portrait d’Arthur Chauvineau"></div><div>' +
        '<p class="pp-k">Profil :</p><p class="pp-v"><b>' + T(P.name) + '</b><br>' + T(P.headline) + '<br>Édition 2026</p>' +
        '<p class="pp-k">Statut :</p><p class="pp-v pp-status">' + I('dispo') + T(P.status) + '</p>' +
        '<p class="pp-k">Configuration :</p><p class="pp-v">' + D.stats.map(s => T(s.value + ' ' + s.label)).join('<br>') + '<br>' + T(P.golf) + '</p></div></div>',
      pres: () => '<p class="pp-lead">' + T(P.pitch) + '</p><fieldset class="grp"><legend>Ce que je cherche</legend><p>' + T(SEEK) + '</p></fieldset>' +
        '<fieldset class="grp"><legend>Ce que j’apporte</legend><ul class="pp-ul">' + BRINGS.map(b => '<li>' + T(b) + '</li>').join('') + '</ul></fieldset>',
      parc: () => '<p class="pp-lead">' + T('14 ans de parcours, 6 rôles dans 4 structures. ' + (window.matchMedia && matchMedia('(pointer: coarse)').matches ? 'Touchez' : 'Double-cliquez sur') + ' un poste pour lire le détail.') + '</p><div class="lv lv--wrap"><table><thead><tr><th>Période</th><th>Poste</th><th>Structure</th></tr></thead><tbody>' +
        roles.map(r => '<tr class="row" data-file="' + esc(r.file) + '"><td>' + T(r.period) + '</td><td>' + T(r.role) + '</td><td>' + T(r.org) + '</td></tr>').join('') + '</tbody></table></div>' +
        '<div class="row-btn"><button class="btn" type="button" data-p="exp">Ouvrir Mes expériences</button><button class="btn" type="button" data-p="form">Formation</button></div>',
      contact: () => '<div class="pp-stack"><fieldset class="grp"><legend>Adresse e-mail</legend><div class="row-btn"><input class="inp" type="text" readonly value="' + esc(P.email) + '" aria-label="Adresse e-mail"><button class="btn" type="button" data-p="copy-mail">Copier</button></div>' +
        '<div class="row-btn"><button class="btn" type="button" data-p="compose">Écrire un message…</button></div></fieldset>' +
        '<fieldset class="grp"><legend>Téléphone</legend><div class="row-btn"><input class="inp" type="text" readonly value="' + esc(P.phone) + '" aria-label="Téléphone"><button class="btn" type="button" data-p="copy-tel">Copier</button><a class="btn" href="' + esc(P.phoneHref) + '">Appeler</a></div></fieldset>' +
        '<fieldset class="grp"><legend>Curriculum vitae</legend><div class="row-btn row-btn--wrap">' + (Files.pdf === 'ok' ? '<button class="btn" type="button" data-p="pdf">Télécharger le PDF…</button>' : '') + '<button class="btn" type="button" data-p="cv">Ouvrir le CV</button>' +
        (X.canSave() ? '<button class="btn" type="button" data-p="vcf">Carte de visite (.vcf)</button>' : '') + '</div></fieldset></div>'
    };
    const W = WM.create(id, { title: 'Propriétés d’Arthur Chauvineau', icon: 'profile', dialog: true, w: 460, hash: 'profil', ctrls: ['help', 'close'], onHelp: () => open('lisezmoi'), html, focus: '.btn--default' });
    const panel = $('#pp-p', W.body);
    W.showTab = k => {
      $$('.tab', W.body).forEach(t => { const on = t.dataset.tab === k; t.setAttribute('aria-selected', on ? 'true' : 'false'); t.tabIndex = on ? 0 : -1; });
      panel.innerHTML = panels[k](); panel.setAttribute('aria-labelledby', 'pp-t-' + k); panel.scrollTop = 0; W.tab = k;
    };
    W.showTab(panels[tab] ? tab : 'gen');
    const pAct = cmd => {
      if (cmd === 'copy-mail') copyText(P.email, null, 'Adresse');
      else if (cmd === 'copy-tel') copyText(P.phone, null, 'Numéro');
      else if (cmd === 'compose') compose();
      else if (cmd === 'pdf') download();
      else if (cmd === 'cv') wordpad();
      else if (cmd === 'vcf') vcard();
      else if (cmd === 'exp') explorer('exp');
      else if (cmd === 'form') explorer('form');
    };
    let lastPT = 'mouse';
    W.body.addEventListener('pointerdown', e => { lastPT = e.pointerType || 'mouse'; });
    W.body.addEventListener('click', e => {
      const t = e.target.closest('[data-tab]'); if (t) { if (W.tab !== t.dataset.tab) Sfx.nav(); W.showTab(t.dataset.tab); return; }
      if (e.target.closest('[data-b]')) { WM.close(id); return; }
      const p = e.target.closest('[data-p]'); if (p) { pAct(p.dataset.p); return; }
      const r = e.target.closest('[data-file]');
      if (r) { $$('[data-file]', panel).forEach(x => x.classList.toggle('is-sel', x === r)); if (lastPT === 'touch' || lastPT === 'pen') open(r.dataset.file); }
    });
    W.body.addEventListener('dblclick', e => { const r = e.target.closest('[data-file]'); if (r && lastPT === 'mouse') open(r.dataset.file); });
    W.body.addEventListener('keydown', e => {
      const t = e.target.closest('[data-tab]'); if (!t || (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft')) return;
      const keys = TABS.map(x => x[0]), i = keys.indexOf(t.dataset.tab), k = keys[(i + (e.key === 'ArrowRight' ? 1 : -1) + keys.length) % keys.length];
      e.preventDefault(); W.showTab(k); $('[data-tab="' + k + '"]', W.body).focus();
    });
    return W;
  }

  /* ---------- Téléchargement du PDF ---------- */
  function download() {
    const id = 'dl';
    if (WM.get(id)) { WM.focus(id); return WM.get(id); }
    if (Files.pdf !== 'ok') { toast('Le PDF n’est pas disponible ici : ouvrez CV Arthur Chauvineau.doc.'); return null; }
    const html = '<div class="dlg"><p class="dl-q">Voulez-vous enregistrer ce fichier ?</p><div class="msg">' + I('pdf') + '<dl><dt>Nom :</dt><dd>CV Arthur Chauvineau.pdf</dd><dt>Type :</dt><dd>Document PDF, ' + esc(FS.size(FS.get('cvpdf'))) + '</dd><dt>De :</dt><dd>' + T('Le bureau d’Arthur') + '</dd></dl></div>' +
      '<div class="dlg-btns"><button class="btn btn--default" type="button" data-b="save">Enregistrer</button><button class="btn" type="button" data-b="cancel">Annuler</button></div><hr class="xp">' +
      '<div class="msg msg--note">' + I('info') + '<p>' + T('Les fichiers provenant d’Internet peuvent être utiles. Celui-ci contient mon CV complet, prêt à imprimer ou à transmettre.') + '</p></div></div>';
    const W = WM.create(id, { title: 'Téléchargement de fichier', icon: 'pdf', dialog: true, w: 420, html, focus: '.btn--default' });
    W.body.addEventListener('click', e => { const b = e.target.closest('[data-b]'); if (!b) return; WM.close(id); if (b.dataset.b === 'save') X.downloadCV(); });
    return W;
  }

  /* ---------- Fond d'écran et propriétés d'affichage ---------- */
  const wall = {
    img: '',
    list: [['none', '(Aucun)'], ['practice', 'Le practice'], ['green', 'Le green']],
    css(k) {
      if (k === 'none') return { backgroundImage: 'none', backgroundColor: '#004e98' };
      if (k === 'green') return { backgroundImage: 'repeating-linear-gradient(90deg, rgba(255,255,255,.05) 0 70px, rgba(0,0,0,0) 70px 140px), radial-gradient(120% 90% at 50% 35%, #78c95f 0%, #4fa441 55%, #2f7b30 100%)', backgroundColor: '#3f8f38' };
      return { backgroundImage: wall.img, backgroundColor: '#3a6ea5' };
    },
    current: () => { const k = store.get('ac.wall', 'practice'); return wall.list.some(w => w[0] === k) ? k : 'practice'; },
    apply(k, save) { Object.assign($('#desk').style, wall.css(k)); if (save) store.set('ac.wall', k); },
    init() { wall.img = $('#desk').style.backgroundImage || getComputedStyle($('#desk')).backgroundImage; wall.apply(wall.current()); }
  };
  function display() {
    const id = 'display';
    if (WM.get(id)) { WM.focus(id); return WM.get(id); }
    let pick = wall.current();
    const html = '<div class="dlg"><div><div class="tabs" role="tablist"><button class="tab" type="button" role="tab" aria-selected="true">Bureau</button></div><div class="tabpanel">' +
      '<div class="disp-prev" aria-hidden="true"><div class="scr"></div><div class="ft"></div></div><p class="lb-l" id="disp-l">Arrière-plan :</p><div class="lb" role="listbox" aria-labelledby="disp-l">' +
      wall.list.map(([k, l]) => '<button type="button" role="option" data-w="' + k + '" aria-selected="false">' + I(k === 'none' ? 'views' : 'monitor') + '<span>' + T(l) + '</span></button>').join('') + '</div></div></div>' +
      '<div class="dlg-btns"><button class="btn btn--default" type="button" data-b="ok">OK</button><button class="btn" type="button" data-b="cancel">Annuler</button><button class="btn" type="button" data-b="apply" disabled>Appliquer</button></div></div>';
    const W = WM.create(id, { title: 'Propriétés de Affichage', icon: 'monitor', dialog: true, w: 380, ctrls: ['help', 'close'], onHelp: () => open('lisezmoi'), html, focus: '.btn--default' });
    const scr = $('.scr', W.body), applyBtn = $('[data-b="apply"]', W.body);
    const show = () => { Object.assign(scr.style, wall.css(pick)); $$('[data-w]', W.body).forEach(b => b.setAttribute('aria-selected', b.dataset.w === pick ? 'true' : 'false')); applyBtn.disabled = pick === wall.current(); };
    show();
    W.body.addEventListener('click', e => {
      const w = e.target.closest('[data-w]'); if (w) { pick = w.dataset.w; show(); return; }
      const b = e.target.closest('[data-b]'); if (!b) return;
      if (b.dataset.b !== 'cancel') wall.apply(pick, true);
      if (b.dataset.b === 'apply') show(); else WM.close(id);
    });
    return W;
  }

  Object.assign(X.apps, { open, explorer, fileProps, notepad, wordpad, compose, profile, download, display, about, wall, hashFor, vcard });
})();
