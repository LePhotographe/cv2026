/* Système de fichiers virtuel : dossiers et fichiers texte générés à partir du CV. */
(function (root) {
  const D = root.SiteData, P = D.person;
  const ascii = s => String(s).replace(/[’‘]/g, "'").replace(/[–—]/g, '-').replace(/\u202f/g, ' ');
  const h1 = t => t + '\r\n' + '='.repeat(t.length);
  const h2 = t => t + '\r\n' + '-'.repeat(t.length);
  function wrap(text, width, indent) {
    const words = String(text).split(/\s+/), out = []; let line = '';
    words.forEach(w => { if ((line + (line ? ' ' : '') + w).length > width && line) { out.push(line); line = indent + w; } else line += (line && line !== indent ? ' ' : '') + w; });
    if (line) out.push(line);
    return out.join('\r\n');
  }
  const bullet = t => wrap('- ' + t, 72, '  ');
  function leader(label, value, col, width) {
    const head = label + ' ' + '.'.repeat(Math.max(2, col - label.length - 2)) + ' ';
    return wrap(head + value, width || 74, ' '.repeat(head.length));
  }
  const files = {};
  const add = (id, node) => { files[id] = Object.assign({ id }, node); return id; };
  const role = (e, c, k) => {
    const lines = [h1(ascii((e.company + ' - ' + c.role).toUpperCase())), '', 'Période    : ' + ascii(c.period), 'Structure  : ' + ascii(e.company), '', h2('Missions'), ...c.lines.map(l => bullet(ascii(l))), ''];
    if (e.levelup && k === 0) lines.push(h2('Évolution'), wrap(ascii(e.levelup) + '.', 72, ''), '');
    lines.push(h2('Compétences mobilisées'), wrap(ascii(e.skills.join(', ')), 72, ''), '');
    return lines.join('\r\n');
  };

  // Expériences
  const expIds = D.experiences.map(e => {
    const fid = 'exp/' + e.id;
    const kids = e.chapters.map((c, k) => add(fid + '/' + k, { type: 'txt', name: ascii(c.role + ' (' + c.period + ').txt'), text: role(e, c, k), meta: ascii(c.period) }));
    return add(fid, { type: 'folder', name: e.company, children: kids, meta: ascii(e.period), note: ascii(e.tagline) });
  });
  const rows = [];
  D.experiences.forEach(e => e.chapters.forEach(c => rows.push([ascii(c.period), c.role, e.company === 'Photographe indépendant' ? 'à mon compte' : e.company])));
  const recap = [h1('MES EXPÉRIENCES (2012 - 2026)'), '', ...rows.map(r => (r[0] + ' '.repeat(Math.max(1, 21 - r[0].length))) + leader(r[1], r[2], 28)), '', wrap('14 ans de parcours, 6 rôles dans 4 structures, 2 évolutions internes, 1 entreprise fondée.', 72, ''), '', 'Ouvrez le dossier de chaque entreprise pour le détail des postes.', ''].join('\r\n');
  const recapId = add('exp/recap', { type: 'txt', name: 'Récapitulatif.txt', text: recap });
  add('exp', { type: 'folder', name: 'Mes expériences', children: [...expIds, recapId], note: '4 entreprises, 6 postes' });

  // Compétences
  const compIds = D.competences.map(c => {
    const lines = [h1(ascii(c.num + ' - ' + c.title.toUpperCase())), '', ...c.settings.map(s => bullet(ascii(s))), '', h2('Mis en pratique')];
    const labels = c.proof.map(([id]) => { const e = D.experiences.find(x => x.id === id), f = D.formation.find(x => x.id === id); return ascii(e ? e.company : f ? f.title : id); });
    const col = Math.max(...labels.map(l => l.length)) + 4;
    c.proof.forEach(([, note], i) => lines.push(leader(labels[i], ascii(note), col)));
    lines.push('');
    return add('comp/' + c.id, { type: 'txt', name: ascii(c.num + ' - ' + c.title + '.txt'), text: lines.join('\r\n') });
  });
  const tech = [h1('ENVIRONNEMENT TECHNIQUE'), '', ...D.tools.map(g => leader(ascii(g.label), g.items.join(', '), 22)), ''].join('\r\n');
  const langs = [h1('LANGUES'), '', leader('Français', 'langue de ce bureau et de mon CV', 14), leader('Anglais', 'Licence LLCE Anglais (2011 - 2013)', 14), ''].join('\r\n');
  compIds.push(add('comp/tech', { type: 'txt', name: 'Environnement technique.txt', text: tech }));
  compIds.push(add('comp/langues', { type: 'txt', name: 'Langues.txt', text: langs }));
  add('comp', { type: 'folder', name: 'Compétences', children: compIds, note: '4 domaines, outils, langues' });

  // Formation
  const formIds = D.formation.map(f => add('form/' + f.id, { type: 'txt', name: ascii(f.year).replace(/ - /g, '-') + ' - ' + ascii(f.title) + '.txt', meta: ascii(f.year),
    text: [h1(ascii(f.title.toUpperCase())), '', 'Année  : ' + ascii(f.year), 'Type   : ' + f.kind, '', wrap(ascii(f.note), 72, ''), ''].join('\r\n') }));
  add('form', { type: 'folder', name: 'Formation', children: formIds, note: 'Diplômes et titres' });

  // Fichiers à la racine
  const lisez = [
    h1("Le bureau d'Arthur Chauvineau"), '', 'Bienvenue !', '',
    "Ce bureau est mon CV. Double-cliquez sur une icône pour l'ouvrir", '(sur téléphone, touchez-la simplement).', '',
    leader('Mon profil', "qui je suis, en un coup d'oeil", 28),
    leader('Mes documents', 'tous mes fichiers', 28),
    leader('Mes expériences', 'un dossier par entreprise, un fichier par poste', 28, 80),
    leader('Compétences', "ce que je sais faire, et où je l'ai fait", 28),
    leader('Formation', 'diplômes et titres', 28),
    leader('CV Arthur Chauvineau.doc', 'le CV complet', 28),
    leader('CV Arthur Chauvineau.pdf', 'la version imprimable', 28),
    leader('Écrire à Arthur', 'un message prêt à envoyer', 28),
    leader('Mini-golf', "golfeur depuis 25 ans, j'en ai fait un jeu", 28),
    '', h2('En bref'), P.name, ascii(P.headline), P.status, '', 'E-mail     : ' + P.email, 'Téléphone  : ' + P.phone, ''
  ].join('\r\n');
  const cherche = [h1('CE QUE JE CHERCHE'), '',
    wrap(ascii("Un poste à la croisée de l'expérience client et de la transformation digitale : un rôle où relier vision stratégique, enjeux clients et performance."), 72, ''), '',
    h2("Ce que j'apporte"),
    bullet('La double lecture business et tech : grands comptes européens, puis Lead Tech chez Demooz.'),
    bullet("Le réflexe d'entrepreneur : 36POSES, une plateforme e-commerce créée de A à Z."),
    bullet('Le sens du client, forgé par des années de photographie, en indépendant puis en studio.'),
    bullet('Deux évolutions internes : photographe puis directeur adjoint, Key Account Manager puis Lead Tech.'),
    '', "Pour en parler : " + P.email + ' ou ' + P.phone, ''].join('\r\n');
  add('lisezmoi', { type: 'txt', name: 'LISEZMOI.txt', text: lisez });
  add('cherche', { type: 'txt', name: 'Ce que je cherche.txt', text: cherche });
  add('cvdoc', { type: 'doc', name: 'CV Arthur Chauvineau.doc' });
  add('cvpdf', { type: 'pdf', name: 'CV Arthur Chauvineau.pdf', bytes: 927374 });
  add('vcf', { type: 'vcf', name: 'Arthur Chauvineau.vcf', bytes: 412 });
  add('docs', { type: 'folder', name: 'Mes documents', icon: 'mydocs', children: ['exp', 'comp', 'form', 'vcf', 'cherche', 'cvdoc', 'cvpdf', 'lisezmoi'], note: 'Tous les fichiers' });
  add('trash', { type: 'folder', name: 'Corbeille', icon: 'trash', children: [], note: 'La Corbeille est vide.' });

  // Parents et chemins
  Object.values(files).forEach(n => (n.children || []).forEach(c => { files[c].parent = n.id; }));
  const BASE = 'C:\\Documents and Settings\\Arthur';
  function path(id) {
    if (id === 'trash') return 'Corbeille';
    const parts = []; let n = files[id];
    while (n) { parts.unshift(n.name); n = n.parent ? files[n.parent] : null; }
    return BASE + '\\' + parts.join('\\');
  }
  const TYPES = { folder: 'Dossier de fichiers', txt: 'Document texte', doc: 'Document de traitement de texte', pdf: 'Document PDF', vcf: 'Carte de visite' };
  const utf8 = s => (typeof TextEncoder !== 'undefined' ? new TextEncoder().encode(s).length : unescape(encodeURIComponent(s)).length);
  function bytes(n) {
    if (!n) return 0;
    if (n.type === 'folder') return (n.children || []).reduce((t, c) => t + bytes(files[c]), 0);
    return n.bytes || (n.text ? utf8(n.text) : n.type === 'doc' ? 24576 : 0);
  }
  const kb = b => Math.max(1, Math.round(b / 1024)).toLocaleString('fr-FR') + ' Ko';
  const size = n => (n.type === 'folder' ? '' : kb(bytes(n)));
  function iconOf(n) { return n.icon || (n.type === 'folder' ? 'folder' : n.type); }

  root.FS = { files, path, size, bytes, kb, TYPES, iconOf, get: id => files[id] };
})(typeof window !== 'undefined' ? window : globalThis);
