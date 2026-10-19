// Tournées hors Ibiza des DJ résidents (clubs et festivals).
// Relevé du 15 octobre 2026 sur Songkick, Bandsintown et JamBase. À tenir à jour (import ou API en production).
window.TOURNEES = {
  maj: '2026-10-15',
  djs: {
    'Black Coffee': {
      sources: { 'Songkick': 'https://www.songkick.com/artists/421804-black-coffee/calendar', 'Resident Advisor': 'https://ra.co/dj/blackcoffee/tour-dates' },
      dates: [
        { date: '2026-10-16', lieu: 'LIV', ville: 'Miami Beach', pays: 'États-Unis' },
        { date: '2026-10-17', lieu: 'Pacha NYC', ville: 'New York', pays: 'États-Unis' },
        { date: '2026-10-18', lieu: 'Navy Pier', ville: 'Chicago', pays: 'États-Unis' },
        { date: '2026-10-21', lieu: 'Ziggo Dome', ville: 'Amsterdam', pays: 'Pays-Bas' },
        { date: '2026-10-23', lieu: 'ONYX Arena', ville: 'Djeddah', pays: 'Arabie saoudite' },
        { date: '2026-10-24', lieu: 'Ushuaïa Dubai Harbour', ville: 'Dubaï', pays: 'Émirats arabes unis' },
        { date: '2026-10-29', lieu: 'Ductwork', ville: 'Houston', pays: 'États-Unis' },
        { date: '2026-12-06', lieu: 'Club Space', ville: 'Miami', pays: 'États-Unis' }
      ]
    },
    'Marco Carola': {
      sources: { 'Songkick': 'https://www.songkick.com/artists/392901-marco-carola', 'Bandsintown': 'https://www.bandsintown.com/a/97134-marco-carola' },
      dates: [
        { date: '2026-10-16', lieu: 'Pacha New York', ville: 'New York', pays: 'États-Unis' },
        { date: '2026-10-18', lieu: 'Club Space', ville: 'Miami', pays: 'États-Unis' },
        { date: '2026-11-07', lieu: 'Music On São Paulo', ville: 'São Paulo', pays: 'Brésil' },
        { date: '2026-11-20', lieu: 'FIVE LUXE JBR', ville: 'Dubaï', pays: 'Émirats arabes unis' },
        { date: '2026-12-27', lieu: 'KOKO', ville: 'Londres', pays: 'Royaume-Uni' },
        { date: '2026-12-28', lieu: 'KOKO', ville: 'Londres', pays: 'Royaume-Uni' }
      ]
    },
    'Solomun': {
      sources: { 'Songkick': 'https://www.songkick.com/artists/2329001-solomun/calendar' },
      dates: [
        { date: '2026-11-01', lieu: 'Parque Villa-Lobos', ville: 'São Paulo', pays: 'Brésil' },
        { date: '2026-11-28', lieu: 'Hollywood Blvd', ville: 'Los Angeles', pays: 'États-Unis' },
        { date: '2026-12-02', fin: '2026-12-06', lieu: 'Factory Basel', ville: 'Miami', pays: 'États-Unis' }
      ]
    },
    'Joseph Capriati': {
      sources: { 'Bandsintown': 'https://www.bandsintown.com/a/379225-joseph-capriati' },
      dates: [
        { date: '2026-10-17', lieu: 'Bolgia', ville: 'Osio Sopra (Bergame)', pays: 'Italie' },
        { date: '2026-10-23', lieu: 'Sugar Factory', ville: 'Amsterdam', pays: 'Pays-Bas' },
        { date: '2026-10-25', lieu: 'Bret', ville: 'Amsterdam', pays: 'Pays-Bas' },
        { date: '2026-10-29', lieu: 'Q Nightclub', ville: 'Seattle', pays: 'États-Unis' },
        { date: '2026-10-30', lieu: 'NOS Events Center', ville: 'San Bernardino', pays: 'États-Unis' }
      ]
    },
    'Paco Osuna': {
      sources: { 'Bandsintown': 'https://www.bandsintown.com/a/206027-paco-osuna', 'Resident Advisor': 'https://ra.co/dj/pacoosuna/tour-dates' },
      dates: [
        { date: '2026-12-01', lieu: 'Jolene Sound Room', ville: 'Miami', pays: 'États-Unis' },
        { date: '2026-12-31', lieu: 'Studio 338', ville: 'Londres', pays: 'Royaume-Uni' },
        { date: '2027-01-15', lieu: 'Reframe Studios', ville: 'Los Angeles', pays: 'États-Unis' }
      ]
    },
    'Claptone': {
      sources: { 'JamBase': 'https://www.jambase.com/band/claptone', 'Resident Advisor': 'https://ra.co/dj/claptone/tour-dates' },
      dates: [
        { date: '2026-11-13', lieu: 'BauHaus', ville: 'Houston', pays: 'États-Unis' },
        { date: '2026-11-14', lieu: 'KOKO', ville: 'Londres', pays: 'Royaume-Uni' },
        { date: '2027-01-22', lieu: 'Beach Hotel', ville: 'Byron Bay', pays: 'Australie' }
      ]
    }
  }
};
