// Événements locaux datés ; sources publiques à consulter avant déplacement.
window.AGENDA_SUD = {
  maj: '2026-11-14',
  lieux: {
    'chrysalide-seyne': { nom: 'La Chrysalide', ville: 'La Seyne-sur-Mer', dep: '83', country: 'FR', adresse: '118 avenue Marcel Berre, 83500 La Seyne-sur-Mer', lat: 43.1170074, lng: 5.8651447, approx: false, categories: ['club','libertin','dj'] },
    'inda-carqueiranne': { nom: 'INDA HOUSE', ville: 'Carqueiranne', dep: '83', country: 'FR', lat: 43.0974914, lng: 6.0678497, approx: false, categories: ['club','dj'] },
    'milona-la-moutonne': { nom: 'Les Halles Milona', ville: 'La Crau — La Moutonne', dep: '83', country: 'FR', adresse: "595 chemin de l'Estagnol, 83260 La Crau", lat: 43.125, lng: 6.067, approx: true },
    'petit-bain-ayguade': { nom: 'Le Petit Bain', ville: 'Hyères — Ayguade', dep: '83', country: 'FR', adresse: "Plage de l'Ayguade, 83400 Hyères", lat: 43.096, lng: 6.172, approx: true }
  },
  sources: {
    'chrysalide-officiel': 'https://lachrysalide.fr/',
    'chrysalide-wyylde': 'https://app.wyylde.com/en-us/event/party/5b27d8a8-e06e-11f1-9197-65cda76fb8a8',
    'teufy-inda': 'https://teufyparty.com/soirees-house/',
    'salsa-faurax': 'https://salsa.faurax.fr/index.php/La%20Crau',
    'petit-bain': 'https://lepetitbainhyeres.fr/soiree-massilia-all-stars-jeudi'
  },
  soirees: [
    { id: 'chrysalide-fenomeno-20261114', src: 'chrysalide-officiel', nom: 'FENOMENO WAR GAMES', date: '2026-11-14', dateFin: '2026-11-15', heure: '22:00', heureFin: '05:00', djs: 'Alexis Dante, DJ K', type: 'club', djSet: true, genres: 'Clubbing', url: 'https://lachrysalide.fr/', flyerUrl: 'https://lachrysalide.fr/wp-content/uploads/2025/08/1411_fenomeno.jpg', sourceName: 'Agenda officiel La Chrysalide et Wyylde', lieu: 'chrysalide-seyne' },
    { id: 'inda-fusion-20261114', src: 'teufy-inda', nom: 'Fusion at Inda House — Alban DWZ & Matteis', date: '2026-11-14', heure: '23:30', djs: 'Alban DWZ, Matteis', type: 'club', djSet: true, genres: 'Tech House, Electro House', prix: 'Dès 5,99 €', url: 'https://teufyparty.com/soirees-house/', sourceName: 'Teufy — soirées house du 14 novembre', lieu: 'inda-carqueiranne' },
    { id: 'milona-sbk-20261112', src: 'salsa-faurax', nom: 'Hall Milona SBK — initiation bachata et soirée DJ', date: '2026-11-12', heure: '20:30', heureFin: '23:00', djs: 'DJ MAC.O', type: 'soiree', djSet: true, genres: 'Salsa, bachata, kizomba', prix: 'Gratuit', url: 'https://salsa.faurax.fr/index.php/La%20Crau', ticketUrl: '', sourceName: 'Agenda Salsa d’Olivier — 12 novembre 2026', lieu: 'milona-la-moutonne' },
    { id: 'petit-bain-massilia-20261112', src: 'petit-bain', nom: 'Massilia All Stars — jeudi au Petit Bain', date: '2026-11-12', heure: '22:00', djs: '', type: 'club', djSet: true, scheduleNote: 'Soirée hebdomadaire annoncée sur le site du lieu ; DJ du 12 novembre non précisé, à confirmer auprès du lieu.', genres: 'DJ sets', prix: 'Entrée libre hors soirées spéciales', url: 'https://lepetitbainhyeres.fr/soiree-massilia-all-stars-jeudi', ticketUrl: '', sourceName: 'Le Petit Bain — programmation habituelle du jeudi', lieu: 'petit-bain-ayguade' }
  ]
};
