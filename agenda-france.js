// Agenda France (hors PACA) : festivals et soirées électro à venir, relevés le 17 octobre 2026 sur des agendas
// publics (JDS, Shotgun, Songkick, Music Festival Wizard, Monfestival, Sortir à Paris, Techno Airlines, Infoconcert).
// Positions : centre du lieu ou de la ville, approximatives. Les programmes peuvent changer : toujours vérifier la source.
(function () {
  const A = window.AGENDA_SUD || (window.AGENDA_SUD = { maj: '2026-10-17', lieux: {}, sources: {}, soirees: [] });
  A.maj = '2026-10-17';
  Object.assign(A.lieux, {
    'fr-englos': { nom: 'Kodz × Blizzard', ville: 'Englos', dep: '59', lat: 50.623, lng: 2.958 },
    'fr-lons': { nom: 'Lons Electronic Festival', ville: 'Montmorot', dep: '39', lat: 46.676, lng: 5.51 },
    'fr-motoco': { nom: 'Motoco', ville: 'Mulhouse', dep: '68', lat: 47.755, lng: 7.317 },
    'fr-villepinte': { nom: 'Parc des Expos Paris-Nord Villepinte', ville: 'Villepinte', dep: '93', lat: 48.972, lng: 2.517 },
    'fr-lille': { nom: 'Lieu à confirmer', ville: 'Lille', dep: '59', lat: 50.629, lng: 3.057 },
    'fr-zenithsud': { nom: 'Zénith Sud', ville: 'Montpellier', dep: '34', lat: 43.596, lng: 3.917 },
    'fr-bordeaux': { nom: 'Lieu à confirmer', ville: 'Bordeaux', dep: '33', lat: 44.8378, lng: -0.5792 },
    'fr-citedesign': { nom: 'Cité du design', ville: 'Saint-Étienne', dep: '42', lat: 45.448, lng: 4.398 },
    'fr-bruz': { nom: 'Parc Expo Rennes Aéroport', ville: 'Bruz', dep: '35', lat: 48.067, lng: -1.73 },
    'fr-grandsud': { nom: 'Le Grand Sud', ville: 'Lille', dep: '59', lat: 50.612, lng: 3.07 },
    'fr-interference': { nom: 'Interférence', ville: 'Balma', dep: '31', lat: 43.614, lng: 1.497 },
    'fr-huez': { nom: 'Station de l\'Alpe d\'Huez', ville: 'Huez', dep: '38', lat: 45.092, lng: 6.07 },
    'fr-chamonix': { nom: 'Chamonix-Mont-Blanc', ville: 'Chamonix', dep: '74', lat: 45.924, lng: 6.869 },
    'fr-lyon': { nom: 'Lieu à confirmer', ville: 'Lyon', dep: '69', lat: 45.764, lng: 4.8357 },
    'fr-torcy': { nom: 'Base de loisirs de Vaires-Torcy', ville: 'Torcy', dep: '77', lat: 48.865, lng: 2.637 },
    'fr-bourget': { nom: 'Musée de l\'Air et de l\'Espace', ville: 'Le Bourget', dep: '93', lat: 48.946, lng: 2.437 },
    'fr-cannes': { nom: 'Palais des Festivals', ville: 'Cannes', dep: '06', lat: 43.551, lng: 7.017 },
    'fr-touquet': { nom: 'Plage du Touquet', ville: 'Le Touquet-Paris-Plage', dep: '62', lat: 50.52, lng: 1.585 },
    'fr-lomme': { nom: 'Parc urbain de Lomme', ville: 'Lomme', dep: '59', lat: 50.643, lng: 2.987 },
    // Salles et clubs
    'fr-zenithparis': { nom: 'Zénith Paris – La Villette', ville: 'Paris 19e', dep: '75', lat: 48.894, lng: 2.393 },
    'fr-bataclan': { nom: 'Bataclan', ville: 'Paris 11e', dep: '75', lat: 48.863, lng: 2.371 },
    'fr-olympia': { nom: 'L\'Olympia', ville: 'Paris 9e', dep: '75', lat: 48.87, lng: 2.328 },
    'fr-nanterre': { nom: 'Plenitude Arena', ville: 'Nanterre', dep: '92', lat: 48.896, lng: 2.229 },
    'fr-sucre': { nom: 'Le Sucre', ville: 'Lyon 2e', dep: '69', lat: 45.738, lng: 4.815 },
    'fr-transbo': { nom: 'Le Transbordeur', ville: 'Villeurbanne', dep: '69', lat: 45.784, lng: 4.86 },
    'fr-rayonne': { nom: 'La Rayonne', ville: 'Villeurbanne', dep: '69', lat: 45.773, lng: 4.889 },
    'fr-tonygarnier': { nom: 'Halle Tony Garnier', ville: 'Lyon 7e', dep: '69', lat: 45.732, lng: 4.823 },
    'fr-krakatoa': { nom: 'Le Krakatoa', ville: 'Mérignac', dep: '33', lat: 44.838, lng: -0.65 },
    'fr-arkea': { nom: 'Arkéa Arena', ville: 'Floirac', dep: '33', lat: 44.835, lng: -0.528 },
    'fr-condition': { nom: 'La Condition Publique', ville: 'Roubaix', dep: '59', lat: 50.69, lng: 3.186 },
    'fr-splendid': { nom: 'Le Splendid', ville: 'Lille', dep: '59', lat: 50.636, lng: 3.07 },
    'fr-zenithlille': { nom: 'Zénith de Lille', ville: 'Lille', dep: '59', lat: 50.632, lng: 3.077 },
    'fr-aeroscopia': { nom: 'Musée Aeroscopia', ville: 'Blagnac', dep: '31', lat: 43.656, lng: 1.364 },
    'fr-bikini': { nom: 'Le Bikini', ville: 'Ramonville-Saint-Agne', dep: '31', lat: 43.553, lng: 1.48 },
    'fr-cartoucherie': { nom: 'Halles de la Cartoucherie', ville: 'Toulouse', dep: '31', lat: 43.602, lng: 1.415 },
    'fr-zenithtlse': { nom: 'Zénith Toulouse Métropole', ville: 'Toulouse', dep: '31', lat: 43.594, lng: 1.416 },
    'fr-victoire2': { nom: 'Victoire 2', ville: 'Saint-Jean-de-Védas', dep: '34', lat: 43.566, lng: 3.83 },
    'fr-rockstore': { nom: 'Rockstore', ville: 'Montpellier', dep: '34', lat: 43.608, lng: 3.878 },
    'fr-warehouse': { nom: 'Warehouse', ville: 'Nantes', dep: '44', lat: 47.204, lng: -1.564 },
    'fr-ferrailleur': { nom: 'Le Ferrailleur', ville: 'Nantes', dep: '44', lat: 47.205, lng: -1.566 },
    'fr-stereolux': { nom: 'Stereolux', ville: 'Nantes', dep: '44', lat: 47.205, lng: -1.564 }
  });
  Object.assign(A.sources, {
    'fr-shotgun': 'https://shotgun.live/en/festivals/-/europe/france/techno',
    'fr-songkick': 'https://www.songkick.com/festivals/countries/fr',
    'fr-dream': 'https://www.sortiraparis.com/en/where-to-party-in-paris/articles/74345-dream-nation-2026-in-paris-nord-the-full-lineup-by-day-and-by-stage',
    'fr-monfest': 'https://monfestival.fr/index.php/festivals/musique/techno',
    'fr-posedu': 'https://monfestival.fr/festival/positive-education-festival',
    'fr-trans': 'https://www.infoconcert.com/festival/les-trans-musicales-de-rennes-196/concerts',
    'fr-nuits': 'https://www.technoairlines.com/festival/nuits-sonores-lyon-france-2027',
    'fr-plages': 'https://www.musicfestivalwizard.com/festivals/les-plages-electroniques-2027/',
    'fr-marvellous': 'https://www.musicfestivalwizard.com/festivals/marvellous-island-festival-2027/',
    'jds-paris': 'https://www.jds.fr/paris/agenda/electro-335_B',
    'jds-lyon': 'https://www.jds.fr/lyon/agenda/electro-335_B',
    'jds-bordeaux': 'https://www.jds.fr/bordeaux/agenda/electro-335_B',
    'jds-lille': 'https://www.jds.fr/lille/agenda/electro-335_B',
    'jds-toulouse': 'https://www.jds.fr/toulouse/agenda/electro-335_B',
    'jds-montpellier': 'https://www.jds.fr/montpellier/agenda/electro-335_B',
    'jds-nantes': 'https://www.jds.fr/nantes/agenda/electro-335_B'
  });
  const F = (date, nom, djs, lieu, src, extra) => Object.assign({ type: 'festival', date, heure: '', nom, djs, lieu, src }, extra || {});
  const C = (type, date, heure, nom, djs, lieu, src, extra) => Object.assign({ type, date, heure, nom, djs, lieu, src }, extra || {});
  A.soirees.push(
    // Festivals
    F('2026-10-18', 'Kodz × Blizzard Festival (16–18 oct.)', 'Angerfist, Luca Agnelli…', 'fr-englos', 'fr-shotgun'),
    F('2026-10-23', 'Lons Electronic Festival · édition d\'automne (23–25 oct.)', '', 'fr-lons', 'fr-shotgun'),
    F('2026-10-23', 'Idilik Festival (23–25 oct.)', '', 'fr-motoco', 'fr-shotgun'),
    F('2026-10-30', 'Dream Nation · Halloween (30–31 oct.)', 'Pendulum, Vini Vici, Don Diablo, The Bloody Beetroots, Mandragora, Dirtyphonics, Angerfist…', 'fr-villepinte', 'fr-dream', { gros: true }),
    F('2026-10-30', 'Halloween Music Festival (30 oct.–1er nov.)', '', 'fr-lille', 'fr-shotgun'),
    F('2026-10-31', 'FCKG Halloween', '', 'fr-zenithsud', 'fr-shotgun'),
    F('2026-11-05', 'Isulia Festival (5–7 nov.)', 'Octave One (live), Djedjotronic & Trio Xenakis (live)', 'fr-bordeaux', 'fr-monfest'),
    F('2026-11-06', 'Positive Education (6–7 nov.)', 'A Guy Called Gerald, Andy Stott, Eris Drew & Octo Octa, Jane Fitz, Machine Girl…', 'fr-citedesign', 'fr-posedu', { gros: true }),
    F('2026-11-06', 'Madame Loyal (6–7 nov.)', 'Worakls…', 'fr-bruz', 'fr-songkick'),
    C('club', '2026-11-13', '18:00', 'Name Festival', 'Local Suicide, Apm001, Blac', 'fr-lille', 'fr-shotgun'),
    F('2026-12-02', 'Rencontres Trans Musicales (2–6 déc.)', '', 'fr-bruz', 'fr-trans', { gros: true }),
    F('2026-12-18', 'Le Jardin d\'Automne · hard techno (18–19 déc.)', '', 'fr-grandsud', 'jds-lille'),
    F('2027-02-06', 'OHLALA Winter Festival (6–7 fév.)', '', 'fr-interference', 'jds-toulouse'),
    F('2027-03-20', 'Tomorrowland Winter (20–27 mars)', '', 'fr-huez', 'fr-monfest', { gros: true }),
    F('2027-03-25', 'The Unlimited Festival (25–29 mars)', '', 'fr-chamonix', 'fr-monfest'),
    F('2027-03-26', 'Reperkusound (26–28 mars)', '', 'fr-lyon', 'fr-monfest'),
    F('2027-05-05', 'Nuits Sonores (5–9 mai)', '', 'fr-lyon', 'fr-nuits', { gros: true }),
    F('2027-05-15', 'Marvellous Island (15–16 mai)', '', 'fr-torcy', 'fr-marvellous', { gros: true }),
    F('2027-05-22', 'Cercle Festival (22–24 mai)', '', 'fr-bourget', 'jds-paris', { gros: true }),
    F('2027-08-06', 'Les Plages Électroniques (6–8 août)', '', 'fr-cannes', 'fr-plages', { gros: true }),
    F('2027-08-27', 'Touquet Music Beach Festival (27–29 août)', '', 'fr-touquet', 'fr-monfest'),
    F('2027-09-11', 'Le Jardin Électronique (11–12 sept.)', '', 'fr-lomme', 'jds-lille'),
    // Paris
    C('concert', '2026-10-18', '20:00', 'Mosimann · Dream Tour', 'Mosimann', 'fr-zenithparis', 'jds-paris'),
    C('concert', '2026-11-06', '20:00', 'Digitalism', 'Digitalism', 'fr-bataclan', 'jds-paris'),
    C('concert', '2026-11-14', '', 'Overmono', 'Overmono', 'fr-olympia', 'jds-paris'),
    C('concert', '2026-12-12', '', 'Anyma presents ÆDEN', 'Anyma', 'fr-nanterre', 'jds-paris', { gros: true }),
    // Lyon et Saint-Étienne
    C('concert', '2026-10-22', '18:30', 'Khalil Epi × TUQUS', 'Khalil Epi, TUQUS', 'fr-sucre', 'jds-lyon'),
    C('concert', '2026-11-06', '20:00', 'La P\'tite Fumée', 'La P\'tite Fumée', 'fr-transbo', 'jds-lyon'),
    C('club', '2026-12-02', '20:00', 'Bardix le Gaulois', 'Bardix le Gaulois', 'fr-rayonne', 'jds-lyon'),
    C('concert', '2027-01-28', '20:00', 'NTO', 'NTO', 'fr-transbo', 'jds-lyon'),
    C('concert', '2027-02-19', '19:00', 'Lewis OfMan', 'Lewis OfMan', 'fr-sucre', 'jds-lyon'),
    C('concert', '2027-04-16', '', 'Mosimann · Dream Tour', 'Mosimann', 'fr-tonygarnier', 'jds-lyon'),
    // Bordeaux
    C('concert', '2026-11-21', '', 'Kid Francescoli', 'Kid Francescoli', 'fr-krakatoa', 'jds-bordeaux'),
    C('concert', '2027-04-28', '20:00', 'Mosimann · Dream Tour', 'Mosimann', 'fr-arkea', 'jds-bordeaux'),
    // Lille
    C('concert', '2026-10-25', '19:00', 'Carpenter Brut', 'Carpenter Brut', 'fr-condition', 'jds-lille'),
    C('concert', '2026-11-04', '20:30', 'Fakear', 'Fakear', 'fr-splendid', 'jds-lille'),
    C('concert', '2027-02-05', '20:00', 'La P\'tite Fumée', 'La P\'tite Fumée', 'fr-splendid', 'jds-lille'),
    C('concert', '2027-04-20', '20:00', 'Mosimann · Dream Tour', 'Mosimann', 'fr-zenithlille', 'jds-lille'),
    // Toulouse
    C('club', '2026-10-17', '', 'Rave sous le Concorde et l\'A380', '', 'fr-aeroscopia', 'jds-toulouse', { gros: true }),
    C('concert', '2026-10-21', '19:30', 'Carpenter Brut', 'Carpenter Brut', 'fr-bikini', 'jds-toulouse'),
    C('concert', '2026-10-31', '20:30', 'Hilight Tribe · Halloween', 'Hilight Tribe', 'fr-cartoucherie', 'jds-toulouse'),
    C('concert', '2027-01-09', '19:30', 'Jersey', 'Jersey', 'fr-bikini', 'jds-toulouse'),
    C('concert', '2027-01-28', '19:30', 'Thylacine', 'Thylacine', 'fr-bikini', 'jds-toulouse'),
    C('concert', '2027-02-12', '19:30', 'NTO (live)', 'NTO', 'fr-bikini', 'jds-toulouse'),
    C('concert', '2027-03-26', '20:00', 'French 79', 'French 79', 'fr-zenithtlse', 'jds-toulouse'),
    // Montpellier
    C('club', '2026-10-24', '', 'Chinese Man Records Party', 'Chinese Man', 'fr-victoire2', 'jds-montpellier'),
    C('concert', '2026-12-03', '19:30', 'La P\'tite Fumée', 'La P\'tite Fumée', 'fr-rockstore', 'jds-montpellier'),
    // Nantes
    C('concert', '2026-10-28', '19:00', 'Deep Forest', 'Deep Forest', 'fr-warehouse', 'jds-nantes'),
    C('club', '2026-10-30', '', 'Nantes Rave Techno', 'Vladimir Cauchemar, Shanixx, Noir Mat…', 'fr-warehouse', 'jds-nantes'),
    C('club', '2026-11-13', '', 'Invasion', 'Hardcore France, Eskape', 'fr-warehouse', 'jds-nantes'),
    C('club', '2026-11-20', '', 'Organik × Warehouse', 'Organik, Jazzy Yoshiko, Todiefor', 'fr-warehouse', 'jds-nantes'),
    C('concert', '2026-11-21', '20:30', 'Scratch Massive', 'Scratch Massive', 'fr-ferrailleur', 'jds-nantes'),
    C('club', '2026-12-04', '', '2much Nantes · 2 ans', 'Panteros666, DJ Schnake, Kichta…', 'fr-warehouse', 'jds-nantes'),
    C('concert', '2026-12-12', '19:00', 'The Avener', 'The Avener', 'fr-warehouse', 'jds-nantes'),
    C('club', '2026-12-19', '', 'Astropolis × Club de Jour', 'Kittin, DJ Hell, Sonic Crew', 'fr-warehouse', 'jds-nantes', { gros: true }),
    C('concert', '2027-01-14', '20:00', 'NTO (live)', 'NTO', 'fr-stereolux', 'jds-nantes')
  );
})();
