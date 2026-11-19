// Import des soirées publiées sur Xceed (xceed.me), toutes villes, via l'interface publique du site (sans clé, sans contournement).
// Pour chaque ville : la liste des soirées à venir (90 jours), avec le lieu, le line-up, les styles et le flyer.
// La position de chaque lieu est demandée une fois puis gardée dans data/xceed-lieux.json.
// Usage : node scripts/import-xceed.mjs   (écrit data/radar-xceed.json, puis lancer node scripts/radar.mjs)
import { readFile, writeFile } from 'node:fs/promises';
import { estMusiqueClub } from './musique.mjs';
import { departmentFromPostal } from './radar.mjs';

const API = 'https://event-b2c.xceed.me';
const HEADERS = { Accept: 'application/json', 'Accept-Language': 'fr', Origin: 'https://xceed.me', Referer: 'https://xceed.me/', 'User-Agent': 'Mozilla/5.0 (compatible; BanzicAgenda/1.0; +https://banzic-2.vercel.app)' };
const JOURS = 90, PAUSE = 250;
const PAS_CLUB = /jazz|rock|metal|punk|classical|classique|opera|flamenco|folk|blues|chanson|cantautor|comedy|teatro|theatre|stand.?up|live music/;
const CLUB = /techno|house|electro|edm|trance|disco|hip.?hop|rap|reggaeton|latin|afro|amapiano|dancehall|r&b|rnb|trap|commercial|dance|drum|bass|urban|pop|funk|90|80|2000|remember/;
const norm = (t) => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const pause = (ms) => new Promise((r) => setTimeout(r, ms));

async function get(path, essais = 3) {
  for (let i = 1; ; i++) {
    try {
      const r = await fetch(API + path, { headers: HEADERS });
      if (r.status === 429 || r.status >= 500) throw new Error('HTTP ' + r.status);
      if (!r.ok) return null;
      return (await r.json()).data;
    } catch (e) { if (i >= essais) { console.warn('  échec', path, e.message); return null; } await pause(2000 * i); }
  }
}
// Date et heure locales de la soirée, dans le fuseau de la ville
function local(ts, tz) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date(ts * 1000)).map((x) => [x.type, x.value]));
  return { date: `${p.year}-${p.month}-${p.day}`, heure: `${p.hour}:${p.minute}` };
}
async function departementFR(lat, lng) {
  try {
    const r = await fetch(`https://geo.api.gouv.fr/communes?lat=${lat}&lon=${lng}&fields=codeDepartement,codesPostaux&format=json`);
    const c = (await r.json())[0] || {};
    return c.codeDepartement || departmentFromPostal((c.codesPostaux || [])[0]);
  } catch { return ''; }
}

async function main() {
  const now = Math.floor(Date.now() / 1000), checked = new Date().toISOString();
  let lieux = {}; try { lieux = JSON.parse(await readFile('data/xceed-lieux.json', 'utf8')); } catch {}
  const villes = ((await get('/v1/cities')) || []).filter((c) => !c.isArchived && c.country && /^[A-Z]{2}$/.test(c.country.isoCode || ''));
  if (villes.length < 100) throw new Error('Liste des villes Xceed incomplète : ' + villes.length);
  const events = [], vus = new Set(), parPays = {};
  for (const ville of villes) {
    const pays = ville.country.isoCode, tz = ville.timezone || 'Europe/Paris';
    for (let page = 1; page <= 20; page++) {
      const d = await get(`/v2/events?cities[0]=${encodeURIComponent(ville.slug)}&limit=100&page=${page}&startingTimeFrom=${now - 6 * 3600}&startingTimeTo=${now + JOURS * 86400}`);
      await pause(PAUSE);
      const items = (d && d.items) || [];
      for (const ev of items) {
        if (!ev.legacyId || vus.has(ev.legacyId) || ev.venueIsSecret || !ev.venue || !ev.venue.slug) continue;
        vus.add(ev.legacyId);
        const genres = (ev.musicGenres || []).map((g) => g.name).filter(Boolean);
        const lineup = (ev.lineup || []).map((a) => a && a.name).filter(Boolean).slice(0, 12);
        // Pas de style annoncé par l'organisateur : soirée club classée « Généraliste et festif »
        const g = norm(genres.join(' '));
        if (PAS_CLUB.test(g) && !CLUB.test(g)) continue;
        // Position du lieu : une seule demande par lieu, gardée d'une nuit à l'autre
        let l = lieux[ev.venue.slug];
        if (!l) {
          const det = await get('/v1/events/' + ev.legacyId); await pause(PAUSE);
          const v = det && det.venue, c = v && v.coordinates;
          if (!c || !Number.isFinite(c.latitude) || !Number.isFinite(c.longitude)) continue;
          l = lieux[ev.venue.slug] = { nom: v.name, adresse: v.address || '', lat: c.latitude, lng: c.longitude, types: v.types || [] };
          if (pays === 'FR') l.dep = await departementFR(l.lat, l.lng);
        }
        if (pays === 'FR' && !l.dep) continue;
        const { date, heure } = local(ev.startingTime, tz);
        const fin = ev.endingTime ? local(ev.endingTime, tz).heure : '';
        const url = `https://xceed.me/fr/${ev.venue.city?.slug || ville.slug}/event/${ev.slug}/${ev.legacyId}`;
        const row = {
          id: 'xceed-' + ev.legacyId, src: 'xceed', country: pays, dep: pays === 'FR' ? l.dep : pays, nom: String(ev.name || '').trim(), date, heure,
          lieu: ev.venue.name || l.nom, ville: ev.venue.city?.name || ville.name, lat: l.lat, lng: l.lng, type: ev.isFestival ? 'festival' : 'club',
          lineup, djSet: lineup.length > 0 || CLUB.test(g), genres: genres.slice(0, 4).join(', ') || 'Généraliste', scheduleNote: fin ? 'Fin annoncée ' + fin : '', prix: '',
          url, ticketUrl: url, flyerUrl: /^https:\/\//.test(ev.coverUrl || '') ? ev.coverUrl : '', verifiedAt: checked,
          evidence: 'Fiche publique Xceed : date, lieu, line-up et styles publiés par l’organisateur.', sourceName: 'Xceed', sourceUpdatedAt: '', sourceLicense: '', sourceRecordUrl: url,
        };
        if (!estMusiqueClub(row)) continue;
        events.push(row); parPays[pays] = (parPays[pays] || 0) + 1;
      }
      if (!d || !d.meta || page * (d.meta.perPage || 100) >= (d.meta.total || 0) || !items.length) break;
    }
  }
  events.sort((a, b) => (a.date + a.heure).localeCompare(b.date + b.heure));
  await writeFile('data/xceed-lieux.json', JSON.stringify(lieux) + '\n');
  await writeFile('data/radar-xceed.json', JSON.stringify({ updatedAt: checked, sources: [{ id: 'xceed', homepage: 'https://xceed.me' }], events }, null, 1) + '\n');
  console.log(villes.length, 'villes Xceed ;', events.length, 'soirées gardées ;', JSON.stringify(Object.entries(parPays).sort((a, b) => b[1] - a[1])));
  if (!events.length) process.exitCode = 1;
}
main().catch((e) => { console.error('Import Xceed non fait :', e.message); process.exitCode = 1; });
