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
    lieux: []
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
    lieux: []
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
    lieux: []
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
    lieux: []
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
    lieux: []
  },
  {
    id: 'phuket', tz: 'Asia/Bangkok', nom: 'Phuket', pays: 'Thaïlande', centre: [7.93, 98.30], zoom: 11,
    saison: 'novembre à avril',
    mois: [3, 2, 2, 2, 0, -1, -1, -1, -1, 0, 1, 3],
    notes: {
      0: 'Haute saison sèche : beach clubs pleins tout le mois.',
      3: 'Songkran mi-avril : fête de l\'eau, soirées partout.',
      5: 'Mousson de mai à octobre : moins de monde, beach clubs au ralenti.',
      11: 'Noël et Nouvel An : le pic de l\'année.'
    },
    evenements: [
      { nom: 'Songkran', quand: '13–15 avril', mois: 3 },
      { nom: 'Nouvel An', quand: '31 décembre', mois: 11 }
    ],
    billetterie: [
      { nom: 'Billetteries des beach clubs', affil: 'Accord direct à négocier' }
    ],
    // Positions approximatives (démo), à vérifier
    lieux: []
  },
  {
    // Partout ailleurs (Toulon, Marseille, Lyon…) : pas de saison ni de line-ups officiels,
    // seulement les DJ qui se déclarent et les spots signalés autour de la position de l'utilisateur.
    id: 'local', local: true, nom: 'Autour de moi', pays: 'ta ville', centre: [43.1242, 5.9280], zoom: 13,
    saison: 'toute l\'année', mois: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], notes: {}, evenements: [], billetterie: [],
    // Vidé le 11/11/2026 : les vrais lieux arriveront par le radar et les signalements.
    lieux: []
  }
];
