// BANZIC — lieux locaux identifiés pour le radar (20 km autour de Hyères).
// Les événements ne sont affichés que lorsqu'une date est confirmée par une source.
window.AGENDA_SUD = {
  maj: '2026-11-12',
  lieux: {
    'local-brewpub-hyeres': {
      nom: 'Brew Pub',
      ville: 'Hyères',
      country: 'FR',
      dep: '83',
      adresse: '494 rue Nicéphore Niépce, ZA le Palyvestre, 83400 Hyères',
      url: 'https://www.brewpub.online/news',
      categories: ['pub', 'concert', 'dj'],
      approx: true
    }
  },
  sources: {
    'brewpub-officiel': 'https://www.brewpub.online/news'
  },
  // Ne pas transformer le programme hebdomadaire en soirées datées non confirmées.
  soirees: []
};
