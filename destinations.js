// Destinations : saisons, affluence par mois, temps forts, billetteries et lieux.
// Affluence par mois (janvier → décembre) : -1 hors saison, 0 fluide, 1 chargé, 2 très chargé, 3 saturé.
// Ce sont des tendances tirées de sources publiques (offices de tourisme, guides, presse, calendriers
// d'événements), pas des mesures. Elles servent à savoir où et quand vendre des billets.
// Positions des lieux : approximatives. Seule Ibiza a des line-ups réels dans la démo.
window.DESTS = [
  {
    id: 'ibiza', tz: 'Europe/Madrid', nom: 'Ibiza', pays: 'Espagne', centre: [38.94, 1.40], zoom: 11,
    saison: 'fin avril à mi-octobre',
    mois: [-1, -1, -1, 0, 1, 2, 3, 3, 2, 1, -1, -1],
    notes: {
      3: 'Premières openings fin avril (25 avril en 2025).',
      4: 'Openings des grands clubs, monde en hausse le week-end.',
      6: 'Pleine saison, tout est plein du jeudi au dimanche.',
      7: 'Pic de l\'année, autour du 15 août tout est saturé.',
      8: 'Encore très fréquenté, premières closings fin septembre.',
      9: 'Closings jusqu\'à mi-octobre : grosses soirées, puis l\'île ferme.'
    },
    evenements: [
      { nom: 'Openings des clubs', quand: 'fin avril – mai', mois: 4 },
      { nom: '15 août', quand: 'mi-août', mois: 7 },
      { nom: 'Closings des clubs', quand: 'fin septembre – mi-octobre', mois: 9 }
    ],
    billetterie: [
      { nom: 'Billetteries des clubs (Ushuaïa, Hï, Pacha, Amnesia…)', affil: 'Accord direct à négocier' },
      { nom: 'Fever', url: 'https://business.feverup.com', affil: 'Programme partenaires' },
      { nom: 'Skiddle', affil: 'Programme d\'affiliation public' },
      { nom: 'Xceed', affil: 'Pas de programme public : à négocier' }
    ],
    lieux: [] // les 21 lieux de la démo (data.js)
  },
  {
    id: 'mykonos', tz: 'Europe/Athens', nom: 'Mykonos', pays: 'Grèce', centre: [37.43, 25.35], zoom: 12,
    saison: 'fin mai à début octobre',
    mois: [-1, -1, -1, -1, 0, 2, 3, 3, 2, 0, -1, -1],
    notes: {
      4: 'Les beach clubs rouvrent fin mai, encore calme.',
      5: 'La saison démarre vraiment, monde le week-end.',
      6: 'Pic : beach clubs pleins l\'après-midi, clubs la nuit.',
      7: 'Pic de l\'année, autour du 15 août (Assomption) tout est saturé.',
      8: 'Encore très fréquenté la première quinzaine.',
      9: 'Dernières soirées début octobre, puis l\'île ferme.'
    },
    evenements: [
      { nom: 'Ouverture des beach clubs', quand: 'fin mai', mois: 4 },
      { nom: 'Assomption (15 août)', quand: 'mi-août', mois: 7 },
      { nom: 'Closings', quand: 'fin septembre – début octobre', mois: 8 }
    ],
    billetterie: [
      { nom: 'Billetteries et réservations des lieux (Scorpios, Cavo Paradiso…)', affil: 'Accord direct à négocier' },
      { nom: 'Fever', url: 'https://business.feverup.com', affil: 'Programme partenaires' }
    ],
    lieux: [
      { id: 'scorpios', img: ["https://scorpios.com/assets/Reservations-Scorpios-Mykonos-Beach_002513162513166a7b05ad.jpg", "https://scorpios.com/assets/Scorpios-Reserve-Mykonos_007414383df240657a043f.jpg"], nom: 'Scorpios', type: 'plage', zone: 'Paraga', lat: 37.4069, lng: 25.3476 },
      { id: 'santanna', img: ["https://www.santannamykonos.com/wp-content/uploads/2026/04/Homepage-Cabanas-Lounges-1.jpg"], nom: 'SantAnna', type: 'plage', zone: 'Paraga', lat: 37.4079, lng: 25.3505 },
      { id: 'paradise-myk', nom: 'Paradise Club', type: 'plage', zone: 'Paradise Beach', lat: 37.4103, lng: 25.3556 },
      { id: 'cavo-paradiso', img: ["https://www.cavoparadiso.gr/assets/images/dsc08711-816x488.jpg", "https://www.cavoparadiso.gr/assets/images/dsc07687-1192x1788.jpg"], nom: 'Cavo Paradiso', type: 'club', zone: 'Paradise Beach', lat: 37.4112, lng: 25.3590 },
      { id: 'nammos', img: ["https://www.nammos.com/sites/default/files/2021-11/nammos_mykonos_gallery_2.jpg", "https://www.nammos.com/sites/default/files/og-nammos.jpg"], nom: 'Nammos', type: 'plage', zone: 'Psarou', lat: 37.4167, lng: 25.3423 },
      { id: 'alemagou', img: ["https://www.technoairlines.com/wp-content/uploads/2026/10/alemagou-mykonos-1024x683.jpg", "https://k-studio.gr/wp-content/uploads/2025/08/K-Studio_Alemagou_021_BillStamatopoulos-1200x800.jpg"], nom: 'Alemagou', type: 'plage', zone: 'Ftelia', lat: 37.4627, lng: 25.3760 },
      { id: 'bonbonniere-myk', nom: 'Bonbonniere', type: 'club', zone: 'Mykonos ville', lat: 37.4462, lng: 25.3268 },
      { id: 'void-myk', nom: 'VOID Mykonos', type: 'club', zone: 'Mykonos ville · Lakka', lat: 37.4447, lng: 25.3297, approx: true },
      { id: 'tropicana-myk', nom: 'Tropicana Club', type: 'plage', zone: 'Paradise Beach', lat: 37.4098, lng: 25.3548, approx: true }
    ]
  },
  {
    id: 'tulum', tz: 'America/Cancun', nom: 'Tulum', pays: 'Mexique', centre: [20.17, -87.455], zoom: 12,
    saison: 'mi-décembre à avril',
    mois: [3, 2, 2, 1, 0, 0, 0, 0, 0, 0, 1, 3],
    notes: {
      0: 'Pic absolu du 29 décembre au 8 janvier, puis les festivals de janvier (Zamna, Day Zero).',
      1: 'Haute saison, très fréquenté.',
      2: 'Spring break américain : du monde jusqu\'à fin mars.',
      3: 'Semaine sainte, puis la saison retombe.',
      8: 'Le plus calme de l\'année (saison des ouragans, sargasses).',
      10: 'La saison redémarre doucement.',
      11: 'Monte en flèche à partir de Noël.'
    },
    evenements: [
      { nom: 'Réveillon et semaine du Nouvel An', quand: '29 décembre – 8 janvier', mois: 11 },
      { nom: 'Zamna Festival', quand: 'janvier', mois: 0, url: 'https://zamnafestival.com' },
      { nom: 'Day Zero', quand: 'janvier', mois: 0, url: 'https://dayzero.events' },
      { nom: 'Spring break', quand: 'mars', mois: 2 },
      { nom: 'Semaine sainte', quand: 'mars ou avril', mois: 3 }
    ],
    billetterie: [
      { nom: 'Sites des festivals (Zamna, Day Zero)', affil: 'Accord direct à négocier' },
      { nom: 'Eventbrite / Posh', affil: 'Pas d\'affiliation : partenariat avec les organisateurs' },
      { nom: 'Fever', url: 'https://business.feverup.com', affil: 'Programme partenaires' }
    ],
    lieux: [
      { id: 'vagalume', img: ["https://images.discotech.me/venue/None/0aee050a-e56d-4bba-9651-72cf5283d8ab.jpg?auto=format&h=720&q=65&fit=fill&fill=blur", "https://media.alotea.com/vagalume-tulum-nightclubs-people-2.webp"], nom: 'Vagalume', type: 'plage', zone: 'Zone hôtelière', lat: 20.1868, lng: -87.4425 },
      { id: 'papaya-playa', img: ["https://images.discotech.me/venue/None/19f91574-fe39-4925-9a9d-422b3da6e71c.jpg?auto=format&h=720&q=65&fit=fill&fill=blur"], nom: 'Papaya Playa Project', type: 'plage', zone: 'Zone hôtelière, km 4,5', lat: 20.1813, lng: -87.4450 },
      { id: 'taboo-tulum', nom: 'Taboo Tulum', type: 'plage', zone: 'Zone hôtelière, km 7', lat: 20.1589, lng: -87.4555 },
      { id: 'bonbonniere-tulum', img: ["https://images.discotech.me/venue/None/30bbbcec-38aa-4e50-a68c-af200b21532e.jpg?auto=format&h=720&q=65&fit=fill&fill=blur", "https://www.technoairlines.com/wp-content/uploads/2026/10/bonbonniere-tulum-1024x1024.jpg"], nom: 'Bonbonniere Tulum', type: 'club', zone: 'Zone hôtelière', lat: 20.1533, lng: -87.4577 },
      { id: 'gitano-jungle', img: ["https://images.discotech.me/venue/None/80a7fece-b9d8-4ff7-8954-62e6c56f9996.jpg?auto=format&h=720&q=65&fit=fill&fill=blur"], nom: 'Gitano Jungle', type: 'club', zone: 'Zone hôtelière, km 7', lat: 20.1501, lng: -87.4591 },
      { id: 'gitano-beach', nom: 'Gitano Beach', type: 'plage', zone: 'Zone hôtelière, km 9,5', lat: 20.1320, lng: -87.4640 }
    ]
  },
  {
    id: 'miami', tz: 'America/New_York', nom: 'Miami', pays: 'États-Unis', centre: [25.80, -80.16], zoom: 12,
    saison: 'novembre à mai, pic en mars et décembre',
    mois: [2, 2, 3, 1, 1, 0, 0, 0, 0, 1, 1, 3],
    notes: {
      0: 'Haute saison d\'hiver, beaucoup d\'Américains du Nord et d\'Européens.',
      2: 'Miami Music Week et Ultra fin mars : la plus grosse semaine électro de l\'année.',
      4: 'Week-end de Memorial Day fin mai.',
      6: 'Été chaud et humide, surtout du public local.',
      11: 'Art Basel début décembre puis le Nouvel An : tout est plein.'
    },
    evenements: [
      { nom: 'Miami Music Week et Ultra', quand: 'fin mars (24–29 mars en 2026)', mois: 2 },
      { nom: 'Memorial Day', quand: 'fin mai', mois: 4 },
      { nom: 'Art Basel Miami Beach', quand: 'début décembre', mois: 11 },
      { nom: 'Nouvel An', quand: '31 décembre', mois: 11 }
    ],
    billetterie: [
      { nom: 'Fever', url: 'https://business.feverup.com', affil: 'Programme partenaires' },
      { nom: 'Eventbrite / Posh / Dice', affil: 'Pas d\'affiliation : partenariat avec les organisateurs' },
      { nom: 'Billetteries des clubs (Club Space, LIV, E11EVEN…)', affil: 'Accord direct à négocier' }
    ],
    lieux: [
      { id: 'club-space', img: ["https://www.clubspace.com/assets/og/club-space.jpg"], nom: 'Club Space', type: 'club', zone: 'Downtown', lat: 25.7847, lng: -80.1932 },
      { id: 'e11even', img: ["https://images.discotech.me/venue/117/f9fa9f01-5a5d-4237-9356-3f5f0b8bcf78.jpg?auto=format&h=720&q=65&fit=fill&fill=blur", "https://cdn.prod.website-files.com/6377f4b5d60031cd02999855/64062331b786612cdf268d37_11-social.jpg"], nom: 'E11EVEN', type: 'club', zone: 'Downtown', lat: 25.7852, lng: -80.1940 },
      { id: 'liv', img: ["https://images.discotech.me/venue/94/d624ae72-8389-47d0-a495-fa5c9c610754.jpg?auto=format&h=720&q=65&fit=fill&fill=blur"], nom: 'LIV', type: 'club', zone: 'Miami Beach · Fontainebleau', lat: 25.8180, lng: -80.1224 },
      { id: 'm2', nom: 'M2', type: 'club', zone: 'South Beach', lat: 25.7835, lng: -80.1319 },
      { id: 'dnsotf', img: ["https://images.discotech.me/venues/160/detail/5fab7f9b-75ca-472e-bb84-6f4105a94649.jpg?auto=format&h=720&q=65&fit=fill&fill=blur"], nom: 'Do Not Sit On The Furniture', type: 'club', zone: 'South Beach', lat: 25.7893, lng: -80.1323 }
    ]
  },
  {
    id: 'dubai', tz: 'Asia/Dubai', nom: 'Dubaï', pays: 'Émirats arabes unis', centre: [25.12, 55.20], zoom: 11,
    saison: 'octobre à avril',
    mois: [2, 1, 2, 1, 1, 0, -1, -1, 0, 1, 2, 3],
    notes: {
      1: 'Ramadan (environ du 8 février au 9 mars en 2027) : soirées calmes, pas de musique forte.',
      2: 'Après le Ramadan, Untold Dubai relance la saison.',
      5: 'La chaleur arrive, les beach clubs ralentissent.',
      6: 'Été : beaucoup de beach clubs fermés, chaleur extrême.',
      9: 'Réouverture des beach clubs, la saison repart.',
      11: 'Grand Prix de F1 à Abu Dhabi, Sole DXB, Nouvel An : le mois le plus chargé.'
    },
    evenements: [
      { nom: 'Grand Prix de F1 d\'Abu Dhabi', quand: '3–6 décembre', mois: 11 },
      { nom: 'Sole DXB', quand: '11–13 décembre', mois: 11 },
      { nom: 'Nouvel An', quand: '31 décembre', mois: 11 },
      { nom: 'Ramadan (soirées calmes)', quand: 'environ 8 février – 9 mars 2027', mois: 1 },
      { nom: 'Untold Dubai', quand: 'mars 2027 (annoncé du 19 au 22)', mois: 2 }
    ],
    billetterie: [
      { nom: 'Platinumlist', url: 'https://platinumlist.net', affil: 'Programme d\'affiliation public' },
      { nom: 'Fever', url: 'https://business.feverup.com', affil: 'Programme partenaires' }
    ],
    lieux: [
      { id: 'ushuaia-dubai', img: ["https://platinumlist.net/guide/wp-content/uploads/2024/08/20230814_ushuaia_david_guetta_0003_6000x4000px_.jpg"], nom: 'Ushuaïa Dubai Harbour', type: 'plage', zone: 'Dubai Harbour', lat: 25.0912, lng: 55.1278 },
      { id: 'be-beach', nom: 'Be Beach', type: 'plage', zone: 'Dubai Harbour', lat: 25.0898, lng: 55.1255 },
      { id: 'cove-beach', nom: 'Cove Beach', type: 'plage', zone: 'Bluewaters', lat: 25.0790, lng: 55.1210 },
      { id: 'zero-gravity', img: ["https://cdn.prod.website-files.com/68822ddcb927e3ab196ea5f9/68a708e2408d687c226379b4_home-hilite2_0.jpg"], nom: 'Zero Gravity', type: 'plage', zone: 'Dubai Marina', lat: 25.0850, lng: 55.1390 },
      { id: 'soho-garden', img: ["https://www.technoairlines.com/wp-content/uploads/2026/09/soho-garden-dubai-club-1024x682.jpg", "https://images.discotech.me/venue/736/9847bf57-abe2-4c5f-baa0-94a47c659282.jpg?auto=format&h=720&q=65&fit=fill&fill=blur"], nom: 'Soho Garden DXB', type: 'club', zone: 'Meydan', lat: 25.1579, lng: 55.3000 }
    ]
  },
  {
    // Partout ailleurs (Toulon, Marseille, Lyon…) : pas de saison ni de line-ups officiels,
    // seulement les DJ qui se déclarent et les spots signalés autour de la position de l'utilisateur.
    id: 'local', local: true, nom: 'Autour de moi', pays: 'ta ville', centre: [43.1242, 5.9280], zoom: 13,
    saison: 'toute l\'année', mois: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], notes: {}, evenements: [], billetterie: [],
    // Clubs du Var (relevé du 15/10/2026 sur des guides publics). Positions approximatives, DJ à confirmer.
    lieux: [
      { id: 'var-809', nom: '809 Social Club', type: 'club', zone: 'La Garde', lat: 43.1256, lng: 6.0105, style: 'Rap, hip-hop, reggaeton, shatta, commercial · DJ invités (Ofenbach, Bob Sinclar, Damien N-Drix…)', saison: 'les vendredis, samedis et veilles de fériés (jeudis pendant les vacances), 23h30–5h', dep: '83', approx: true },
      { id: 'var-box', nom: 'The Box', type: 'club', zone: 'Toulon · place de la Liberté', lat: 43.125, lng: 5.932, style: 'Club généraliste, sons actuels', saison: '', dep: '83', approx: true },
      { id: 'var-magot', nom: 'Le Magot', type: 'club', zone: 'Toulon · Mourillon', lat: 43.11, lng: 5.944, style: 'Club et karaoké, DJ locaux', saison: '', dep: '83', approx: true },
      { id: 'var-baraka', nom: 'La Baraka', type: 'club', zone: 'Toulon', lat: 43.123, lng: 5.93, style: 'Techno, house, underground', saison: '', dep: '83', approx: true },
      { id: 'var-panda', nom: 'Panda Club', type: 'club', zone: 'Toulon', lat: 43.124, lng: 5.926, style: 'Urbain : rap, R&B', saison: '', dep: '83', approx: true },
      { id: 'var-elysee', nom: 'L\'Elysée Club', type: 'club', zone: 'Toulon', lat: 43.122, lng: 5.935, style: 'Tubes et classiques', saison: '', dep: '83', approx: true },
      { id: 'var-absolu', nom: 'L\'Absolu Club House', type: 'club', zone: 'Solliès-Pont', lat: 43.19, lng: 6.04, style: 'Électro house, afro', saison: '', dep: '83', approx: true },
      { id: 'var-qg', nom: 'Le QG Famous Club', type: 'club', zone: 'Solliès-Pont', lat: 43.1915, lng: 6.042, style: 'Club', saison: '', dep: '83', approx: true },
      { id: 'var-maitai', nom: 'Le Mai-Tai', type: 'club', zone: 'Sanary-sur-Mer', lat: 43.119, lng: 5.801, style: 'Club', saison: '', dep: '83', approx: true },
      { id: 'var-blackjack', nom: 'Le Black Jack', type: 'club', zone: 'Bandol', lat: 43.136, lng: 5.753, style: 'Club', saison: '', dep: '83', approx: true },
      { id: 'var-domino', nom: 'Le Domino', type: 'club', zone: 'Hyères', lat: 43.12, lng: 6.13, style: 'Club', saison: '', dep: '83', approx: true },
      { id: 'var-reve', nom: 'Le Rêve', type: 'club', zone: 'Hyères', lat: 43.118, lng: 6.128, style: 'Club', saison: '', dep: '83', approx: true },
      { id: 'var-vertigo', nom: 'Club Vertigo', type: 'club', zone: 'La Londe-les-Maures', lat: 43.138, lng: 6.234, style: 'Club', saison: '', dep: '83', approx: true },
      { id: 'var-challenger', nom: 'Le Challenger', type: 'club', zone: 'Cavalaire-sur-Mer', lat: 43.173, lng: 6.533, style: 'Club', saison: '', dep: '83', approx: true },
      { id: 'var-hype', nom: 'Hype Club', type: 'club', zone: 'Cogolin', lat: 43.252, lng: 6.53, style: 'Club', saison: '', dep: '83', approx: true },
      { id: 'var-caves', nom: 'Les Caves du Roy', type: 'club', zone: 'Saint-Tropez · Byblos', lat: 43.27, lng: 6.641, style: 'Club mythique, DJ internationaux', saison: 'en saison', dep: '83', approx: true },
      { id: 'var-papagayo', nom: 'Le Papagayo', type: 'club', zone: 'Saint-Tropez · port', lat: 43.2725, lng: 6.6385, style: 'Club', saison: 'en saison', dep: '83', approx: true },
      { id: 'var-odyssee', nom: 'L\'Odyssée', type: 'club', zone: 'Fréjus', lat: 43.433, lng: 6.737, style: 'Club', saison: '', dep: '83', approx: true },
      { id: 'var-palas', nom: 'Le Palas', type: 'club', zone: 'Fréjus', lat: 43.435, lng: 6.74, style: 'Club', saison: '', dep: '83', approx: true },
      { id: 'var-reserve', nom: 'La Réserve', type: 'club', zone: 'Saint-Raphaël', lat: 43.425, lng: 6.768, style: 'Club', saison: '', dep: '83', approx: true }
    ]
  }
];
