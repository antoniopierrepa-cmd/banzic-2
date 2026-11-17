/* Manually checked public organizer pages; no API access assumed. */
(() => {
  const catalogue = window.AGENDA_RADAR;
  if (!catalogue || !Array.isArray(catalogue.soirees)) return;
  const verified = [
    {
      id: 'shotgun-fr:sg-92899117-2026-11-20T20:00:00+01:00',
      date: '2026-11-20',
      image: 'https://api.lemakeda.com/uploads/events/552-mobile-1784799517608.webp',
      source: 'https://lemakeda.com/agenda',
      format: 'portrait'
    },
    {
      id: 'shotgun-fr:sg-82033021-2026-11-20T23:00:00+01:00',
      date: '2026-11-20',
      image: 'https://assets.shotgun.live/image/upload/c_limit%2Car_16%3A9%2Cw_3840%2Cfl_lossy%2Cf_webp%2Cq_auto/dev/artworks/Mark_Reeve_1920x1080_VF_gnbmgm.png',
      source: 'https://shotgun.live/fr/events/20-11-club-cabaret-agoya-invite-mark-reeve',
      format: 'landscape'
    }
  ];
  for (const item of verified) {
    const event = catalogue.soirees.find(e => e.id === item.id && e.date === item.date);
    if (!event) continue;
    event.flyerUrl = item.image;
    event.flyerSourceUrl = item.source;
    event.flyerFormat = item.format;
    event.featuredOfficialFlyer = true;
  }
})();