// Import de l'agenda public « Shotgun » publié par Shotgun sur OpenAgenda (données ouvertes, Licence Ouverte),
// en ne gardant que les soirées électro / club (styles annoncés par Shotgun). Puis le tri « musique » est appliqué à tout le radar.
// Usage : node scripts/import-shotgun.mjs /chemin/shotgun-openagenda.json   puis   node scripts/radar.mjs
import { readFile, writeFile } from 'node:fs/promises';
import { departments } from './radar.mjs';
import { estMusiqueClub } from './musique.mjs';
const norm = (t) => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const STYLES = /techno|electro|house|trance|hardcore|hardstyle|acid|tech house|deep house|afro house|amapiano|disco|hard groove|hard bounce|uptempo|drum & bass|dnb|jungle|dubstep|gabber|frenchcore|hard dance|hardtek|tekno|minimal|garage|ebm|electronica|melodic|progressive|bass|dance\b|club|edm/;
const PAS_CLUB = /metal|punk|rock|jazz|chanson|variete|classical|folk|blues|soul|reggae|ska|bossa|rai|chaabi/;
const byName = Object.fromEntries(Object.entries(departments).map(([k, v]) => [norm(v), k]));
export function convertir(row, checked, today) {
  const kws = (row.keywords_fr || []).map(String), k = norm(kws.join(' ')), titre = row.title_fr || '';
  const electro = STYLES.test(k) || /\bdj\b|dj set|b2b|all night long|rave|clubbing/.test(norm(titre));
  if (!electro || (PAS_CLUB.test(k) && !/techno|house|electro|trance/.test(k))) return [];
  if (/annul|report/.test(norm(row.status))) return [];
  const dep = byName[norm(row.location_department)] || '', c = row.location_coordinates || {}, url = row.canonicalurl || '';
  if (!departments[dep] || !row.location_name || !url.startsWith('https://') || c.lat == null) return [];
  const genres = kws.filter((x) => STYLES.test(norm(x))).slice(0, 4).join(', ');
  const type = /festival/.test(norm(titre)) ? 'festival' : 'club';
  return JSON.parse(row.timings || '[]').map((t) => t.begin).filter((b) => b && b.slice(0, 10) >= today).slice(0, 12).map((b) => ({
    id: 'sg-' + row.uid + '-' + b, src: 'shotgun-fr', nom: titre, date: b.slice(0, 10), heure: b.slice(11, 16), lieu: row.location_name, ville: row.location_city || '', dep,
    lat: c.lat, lng: c.lon, type, lineup: [], djSet: true, genres, prix: row.conditions_fr || '', url, ticketUrl: '', flyerUrl: '', verifiedAt: checked,
    evidence: 'Agenda public Shotgun sur OpenAgenda ; date et lieu publiés, styles annoncés par l’organisateur.', sourceName: 'Shotgun (agenda OpenAgenda)',
    sourceUpdatedAt: row.updatedat || '', sourceLicense: 'https://www.etalab.gouv.fr/wp-content/uploads/2014/05/Licence_Ouverte.pdf', sourceRecordUrl: url }));
}
async function main() {
  const rows = JSON.parse(await readFile(process.argv[2], 'utf8')), checked = new Date().toISOString(), today = checked.slice(0, 10);
  const data = JSON.parse(await readFile('data/radar-events.json', 'utf8'));
  const sg = rows.flatMap((r) => convertir(r, checked, today));
  const avant = data.events.length;
  // L'ancien import OpenAgenda / Shotgun (par mots du titre) est remplacé par l'agenda Shotgun complet
  data.events = data.events.filter((e) => e.sourceName !== 'OpenAgenda / Shotgun' && e.src !== 'shotgun-fr').filter(estMusiqueClub).concat(sg);
  if (!data.sources.some((s) => s.id === 'shotgun-fr')) data.sources.push({ id: 'shotgun-fr', homepage: 'https://openagenda.com/shotgun' });
  await writeFile('data/radar-events.json', JSON.stringify(data, null, 2) + '\n');
  for (const f of ['data/radar-belgium.json', 'data/radar-spain.json']) {
    const d = JSON.parse(await readFile(f, 'utf8')), n = d.events.length; d.events = d.events.filter(estMusiqueClub);
    await writeFile(f, JSON.stringify(d, null, 2) + '\n'); console.log(f, n, '→', d.events.length);
  }
  console.log('France :', avant, 'annonces avant, ', data.events.length, 'après (dont', sg.length, 'dates Shotgun)');
}
main();
