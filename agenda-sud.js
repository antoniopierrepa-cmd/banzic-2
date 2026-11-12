// Événements locaux datés ; sources publiques à consulter avant déplacement.
window.AGENDA_SUD = {
  maj: '2026-11-12',
  lieux: {
    'milona-la-moutonne': { nom: 'Les Halles Milona', ville: 'La Crau — La Moutonne', dep: '83', country: 'FR', adresse: "595 chemin de l'Estagnol, 83260 La Crau", lat: 43.125, lng: 6.067, approx: true },
    'petit-bain-ayguade': { nom: 'Le Petit Bain', ville: 'Hyères — Ayguade', dep: '83', country: 'FR', adresse: "Plage de l'Ayguade, 83400 Hyères", lat: 43.096, lng: 6.172, approx: true }
  },
  sources: {
    'salsa-faurax': 'https://salsa.faurax.fr/index.php/La%20Crau',
    'petit-bain': 'https://lepetitbainhyeres.fr/soiree-massilia-all-stars-jeudi'
  },
  soirees: [
    { id: 'milona-sbk-20261112', src: 'salsa-faurax', nom: 'Hall Milona SBK — initiation bachata et soirée DJ', date: '2026-11-12', heure: '20:30', heureFin: '23:00', djs: 'DJ MAC.O', type: 'soiree', djSet: true, genres: 'Salsa, bachata, kizomba', prix: 'Gratuit', url: 'https://salsa.faurax.fr/index.php/La%20Crau', ticketUrl: '', sourceName: 'Agenda Salsa d’Olivier — 12 novembre 2026', lieu: 'milona-la-moutonne' },
    { id: 'petit-bain-massilia-20261112', src: 'petit-bain', nom: 'Massilia All Stars — jeudi au Petit Bain', date: '2026-11-12', heure: '22:00', djs: '', type: 'club', djSet: true, scheduleNote: 'Soirée hebdomadaire annoncée sur le site du lieu ; DJ du 12 novembre non précisé, à confirmer auprès du lieu.', genres: 'DJ sets', prix: 'Entrée libre hors soirées spéciales', url: 'https://lepetitbainhyeres.fr/soiree-massilia-all-stars-jeudi', ticketUrl: '', sourceName: 'Le Petit Bain — programmation habituelle du jeudi', lieu: 'petit-bain-ayguade' }
  ]
};
