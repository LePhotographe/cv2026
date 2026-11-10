/* Contenu du site — tout est repris du CV d'Arthur Chauvineau (2026). */
(function (root) {
  const D = {};

  D.person = {
    name: 'Arthur Chauvineau',
    headline: 'Expérience client · Transformation digitale',
    status: 'Ouvert aux opportunités',
    email: 'arthur.chauvineau@gmail.com',
    phone: '06 24 95 91 27',
    phoneHref: 'tel:+33624959127',
    linkedin: 'https://www.linkedin.com/in/arthurchauvineau/',
    pitch: "Professionnel transversal à la croisée du business, de l’expérience client et de la transformation digitale, j’aime comprendre les organisations, identifier leurs axes d’amélioration et construire des solutions concrètes. Mon parcours entrepreneurial et opérationnel me permet de relier vision stratégique, enjeux clients et performance.",
    golf: 'Golfeur depuis 25 ans'
  };

  D.stats = [
    { value: '14 ans', label: 'de parcours, de 2012 à 2026' },
    { value: '6', label: 'rôles dans 4 structures' },
    { value: '2', label: 'évolutions internes' },
    { value: '1', label: 'entreprise fondée' }
  ];

  D.experiences = [
    {
      id: 'demooz', title: 'Demooz', company: 'Demooz', period: '2022 – aujourd’hui',
      tagline: 'Lead Tech · Key Account Manager',
      genre: 'Stratégie / gestion', mode: 'Coopération',
      chapters: [
        { label: 'Chapitre 2', role: 'Lead Tech', period: '2023 – aujourd’hui', lines: [
          'Pilotage de la stratégie technologique, de l’architecture et de l’évolution des solutions digitales.',
          'Coordination des développeurs, gestion des budgets et pilotage des projets, de la conception à la livraison.'
        ] },
        { label: 'Chapitre 1', role: 'Key Account Manager', period: '2022 – 2023', lines: [
          'Gestion et développement d’un portefeuille de comptes stratégiques à dimension européenne.',
          'Conception et pilotage de programmes ambassadeurs, suivi de la performance et amélioration de l’expérience client.'
        ] }
      ],
      levelup: 'Évolution interne : de Key Account Manager à Lead Tech en 2023',
      trophies: [
        { tier: 'or', name: 'Changement de classe', desc: 'Évolution interne de Key Account Manager à Lead Tech.' },
        { tier: 'or', name: 'Architecte', desc: 'Stratégie technologique, architecture et évolution des solutions digitales.' },
        { tier: 'argent', name: 'De la conception à la livraison', desc: 'Coordination des développeurs, gestion des budgets et pilotage des projets.' },
        { tier: 'argent', name: 'Grands comptes européens', desc: 'Portefeuille de comptes stratégiques à dimension européenne.' },
        { tier: 'bronze', name: 'Ambassadeurs', desc: 'Programmes ambassadeurs conçus et pilotés, avec suivi de la performance.' }
      ],
      skills: ['Stratégie technologique', 'Architecture fonctionnelle', 'Pilotage de projets', 'Budgets', 'Comptes clés', 'Programmes ambassadeurs', 'Expérience client'],
      cover: { a: '#071c22', b: '#0f5560', c: '#41c1c9', motif: 'network', mark: 'DEMOOZ', kicker: '2022 → 2026', sub: 'Chapitres 1 & 2' }
    },
    {
      id: '36poses', title: '36POSES', company: '36POSES', period: '2020 – 2022',
      tagline: 'Fondateur',
      genre: 'Tycoon (création d’entreprise)', mode: 'Création',
      chapters: [
        { label: 'Chapitre unique', role: 'Fondateur', period: '2020 – 2022', lines: [
          'Création d’une plateforme e-commerce dédiée à la photographie argentique, de l’étude de marché à la mise en production.',
          'Développement de l’activité de A à Z : stratégie, produit, acquisition clients, partenariats et gestion opérationnelle.'
        ] }
      ],
      trophies: [
        { tier: 'or', name: 'Fondateur', desc: 'Plateforme e-commerce créée, de l’étude de marché à la mise en production.' },
        { tier: 'argent', name: 'De A à Z', desc: 'Stratégie, produit, acquisition clients, partenariats et gestion opérationnelle.' },
        { tier: 'bronze', name: 'Pellicule', desc: 'Un marché de passionnés : la photographie argentique.' }
      ],
      skills: ['Entrepreneuriat', 'Étude de marché', 'Produit', 'E-commerce', 'Acquisition clients', 'Partenariats', 'Gestion opérationnelle'],
      cover: { a: '#1d0d03', b: '#7c3f0e', c: '#ffb45a', motif: 'film', mark: '36POSES', kicker: '2020 → 2022', sub: 'Fondateur' }
    },
    {
      id: 'carmes', title: 'Studio Photo Carmes', company: 'Studio Photo Carmes', period: '2015 – 2020',
      tagline: 'Directeur adjoint · Photographe',
      genre: 'RPG (progression de carrière)', mode: 'Carrière',
      chapters: [
        { label: 'Chapitre 2', role: 'Directeur adjoint', period: '2018 – 2020', lines: [
          'Pilotage du développement de l’entreprise : stratégie marketing, communication, développement commercial.',
          'Participation aux décisions de direction, suivi de la satisfaction client et accompagnement des équipes.'
        ] },
        { label: 'Chapitre 1', role: 'Photographe', period: '2015 – 2018', lines: [
          'Transformation de l’identité visuelle, du site internet et des supports de communication de l’entreprise.',
          'Développement des offres commerciales, intégration du e-commerce et responsabilité du laboratoire argentique.'
        ] }
      ],
      levelup: 'Évolution interne : de photographe à directeur adjoint en 2018',
      trophies: [
        { tier: 'or', name: 'Montée en grade', desc: 'De photographe à directeur adjoint.' },
        { tier: 'argent', name: 'Première transformation digitale', desc: 'Identité visuelle, site internet et intégration du e-commerce.' },
        { tier: 'argent', name: 'Le client au centre', desc: 'Suivi de la satisfaction client et accompagnement des équipes.' },
        { tier: 'bronze', name: 'Chambre noire', desc: 'Responsabilité du laboratoire argentique.' }
      ],
      skills: ['Stratégie marketing', 'Communication', 'Développement commercial', 'Management', 'E-commerce', 'Satisfaction client'],
      cover: { a: '#1c0710', b: '#6e1d3c', c: '#ff8fb3', motif: 'aperture', mark: 'CARMES', kicker: '2015 → 2020', sub: 'Studio Photo' }
    },
    {
      id: 'independant', title: 'Photographe indépendant', company: 'Photographe indépendant', period: '2012 – 2015',
      tagline: 'Création d’activité',
      genre: 'Aventure', mode: 'Solo',
      chapters: [
        { label: 'Chapitre unique', role: 'Photographe indépendant', period: '2012 – 2015', lines: [
          'Création et développement d’une activité photographique à destination des entreprises et des particuliers.',
          'Gestion complète de l’activité : conception des offres, communication, développement commercial et réalisation des prestations.'
        ] }
      ],
      trophies: [
        { tier: 'argent', name: 'Premier niveau', desc: 'Activité photographique créée et développée.' },
        { tier: 'bronze', name: 'Couteau suisse', desc: 'Offres, communication, développement commercial et réalisation des prestations.' }
      ],
      skills: ['Création d’activité', 'Conception d’offres', 'Communication', 'Développement commercial', 'Relation client'],
      cover: { a: '#0a1224', b: '#27467a', c: '#9cc4ff', motif: 'bokeh', mark: 'INDÉPENDANT', kicker: '2012 → 2015', sub: 'Photographe' }
    }
  ];

  D.competences = [
    { id: 'experience-client', num: '01', title: 'Expérience client', icon: 'heart',
      settings: ['Conception & optimisation des parcours clients', 'Satisfaction & fidélisation'],
      proof: [['demooz', 'Programmes ambassadeurs et amélioration de l’expérience client'], ['carmes', 'Suivi de la satisfaction client'], ['independant', 'Prestations pour les entreprises et les particuliers']] },
    { id: 'strategie-business', num: '02', title: 'Stratégie & business', icon: 'chart',
      settings: ['Développement commercial', 'Gestion de comptes clés'],
      proof: [['demooz', 'Portefeuille de comptes stratégiques à dimension européenne'], ['36poses', 'Stratégie, acquisition clients et partenariats'], ['carmes', 'Stratégie marketing et développement commercial'], ['independant', 'Conception des offres et développement commercial']] },
    { id: 'organisation-performance', num: '03', title: 'Organisation & performance', icon: 'gauge',
      settings: ['Optimisation des processus', 'Indicateurs & pilotage de la performance'],
      proof: [['demooz', 'Suivi de la performance et gestion des budgets'], ['36poses', 'Gestion opérationnelle'], ['carmes', 'Participation aux décisions de direction']] },
    { id: 'transformation-digitale', num: '04', title: 'Transformation digitale', icon: 'chip',
      settings: ['Pilotage de projets digitaux', 'Architecture fonctionnelle & évolution des outils'],
      proof: [['demooz', 'Stratégie technologique, architecture, coordination des développeurs'], ['36poses', 'Plateforme e-commerce, de l’étude de marché à la mise en production'], ['carmes', 'Site internet, supports de communication et e-commerce'], ['dev-web', 'Formation Développeur web en 2022']] }
  ];

  D.tools = [
    { label: 'CMS & no-code', items: ['Zapier', 'Webflow', 'Retool'] },
    { label: 'Gestion de projet', items: ['Jira', 'Trello', 'Notion', 'Excel'] },
    { label: 'CRM & data', items: ['HubSpot', 'Power BI', 'SQL', 'MongoDB'] },
    { label: 'Création', items: ['Suite Adobe', 'Figma', 'Canva'] }
  ];

  D.formation = [
    { id: 'dev-web', title: 'Développeur web', year: '2022', kind: 'Formation', icon: 'code',
      note: 'Formation suivie en 2022. L’année suivante, je deviens Lead Tech chez Demooz.', link: 'demooz' },
    { id: 'european-photographer', title: 'European Photographer', year: '2021', kind: 'Titre', icon: 'camera',
      note: 'Titre de photographe obtenu en 2021.', link: null },
    { id: 'portraitiste', title: 'Portraitiste de France', year: '2017 et 2021', kind: 'Titre', icon: 'portrait',
      note: 'Titre obtenu à deux reprises, en 2017 puis en 2021.', link: null },
    { id: 'llce', title: 'Licence LLCE Anglais', year: '2011 – 2013', kind: 'Diplôme', icon: 'book',
      note: 'Licence de langues, littératures et civilisations étrangères, parcours anglais.', link: null }
  ];

  D.holes = [
    { n: 1, par: 3, name: 'L’Argentique', era: '2012 – 2020', story: 'Les années photo : photographe indépendant, puis Studio Photo Carmes.' },
    { n: 2, par: 4, name: 'Le Dogleg', era: '2020 – 2022', story: '36POSES, une plateforme e-commerce construite de A à Z. Un trou qui tourne, à jouer en deux temps.' },
    { n: 3, par: 5, name: 'Le Grand Compte', era: '2022 – aujourd’hui', story: 'Demooz : grands comptes européens, puis Lead Tech. Un par 5 se joue avec de la vision.' }
  ];

  D.themes = [
    { id: 'or', name: 'Noir & or', note: 'Les couleurs du CV', top: [14, 11, 6], mid: [33, 24, 9], bottom: [64, 45, 14], wave: [246, 206, 128], glow: [150, 104, 30] },
    { id: 'green', name: 'Green', note: 'Pour les golfeurs', top: [3, 14, 9], mid: [7, 34, 21], bottom: [16, 70, 40], wave: [168, 238, 176], glow: [40, 130, 70] },
    { id: 'nuit', name: 'Bleu nuit', note: 'Le grand classique', top: [3, 8, 22], mid: [8, 24, 58], bottom: [20, 58, 120], wave: [150, 200, 255], glow: [40, 90, 190] },
    { id: 'bordeaux', name: 'Bordeaux', note: 'Chaleureux', top: [16, 4, 8], mid: [44, 9, 20], bottom: [94, 20, 42], wave: [255, 160, 180], glow: [150, 30, 60] },
    { id: 'ardoise', name: 'Ardoise', note: 'Sobre', top: [9, 10, 12], mid: [22, 24, 28], bottom: [48, 52, 60], wave: [225, 230, 240], glow: [90, 96, 110] },
    { id: 'mois', name: 'Selon le mois', note: 'Change chaque mois' }
  ];
  D.monthThemes = [
    { top: [10, 11, 14], mid: [32, 34, 42], bottom: [86, 90, 104], wave: [235, 238, 248], glow: [120, 124, 140] },
    { top: [16, 12, 3], mid: [44, 32, 6], bottom: [104, 76, 14], wave: [255, 222, 140], glow: [170, 120, 20] },
    { top: [8, 14, 3], mid: [22, 40, 8], bottom: [58, 98, 18], wave: [210, 250, 150], glow: [100, 160, 30] },
    { top: [18, 6, 12], mid: [48, 14, 34], bottom: [112, 36, 82], wave: [255, 176, 222], glow: [180, 60, 130] },
    { top: [3, 14, 7], mid: [8, 38, 20], bottom: [18, 92, 48], wave: [160, 246, 190], glow: [40, 150, 80] },
    { top: [10, 5, 18], mid: [28, 12, 50], bottom: [64, 30, 112], wave: [210, 176, 255], glow: [110, 60, 190] },
    { top: [2, 12, 14], mid: [6, 34, 40], bottom: [14, 82, 96], wave: [150, 240, 250], glow: [30, 140, 160] },
    { top: [3, 8, 22], mid: [8, 24, 58], bottom: [20, 58, 120], wave: [150, 200, 255], glow: [40, 90, 190] },
    { top: [7, 6, 20], mid: [20, 16, 54], bottom: [48, 38, 120], wave: [180, 170, 255], glow: [80, 60, 190] },
    { top: [16, 9, 2], mid: [46, 24, 4], bottom: [110, 58, 10], wave: [255, 196, 120], glow: [190, 100, 20] },
    { top: [14, 7, 4], mid: [38, 18, 9], bottom: [92, 44, 20], wave: [246, 180, 140], glow: [160, 80, 40] },
    { top: [16, 3, 4], mid: [46, 8, 10], bottom: [110, 18, 22], wave: [255, 150, 140], glow: [180, 30, 30] }
  ];

  root.SiteData = D;
})(typeof window !== 'undefined' ? window : globalThis);
