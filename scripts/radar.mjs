import { readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import agendaMatch from '../lib/agenda-match.js';
import { writeRadarZones } from './radar-zones.mjs';

export const departments = Object.fromEntries(`01:Ain|02:Aisne|03:Allier|04:Alpes-de-Haute-Provence|05:Hautes-Alpes|06:Alpes-Maritimes|07:Ardèche|08:Ardennes|09:Ariège|10:Aube|11:Aude|12:Aveyron|13:Bouches-du-Rhône|14:Calvados|15:Cantal|16:Charente|17:Charente-Maritime|18:Cher|19:Corrèze|2A:Corse-du-Sud|2B:Haute-Corse|21:Côte-d'Or|22:Côtes-d'Armor|23:Creuse|24:Dordogne|25:Doubs|26:Drôme|27:Eure|28:Eure-et-Loir|29:Finistère|30:Gard|31:Haute-Garonne|32:Gers|33:Gironde|34:Hérault|35:Ille-et-Vilaine|36:Indre|37:Indre-et-Loire|38:Isère|39:Jura|40:Landes|41:Loir-et-Cher|42:Loire|43:Haute-Loire|44:Loire-Atlantique|45:Loiret|46:Lot|47:Lot-et-Garonne|48:Lozère|49:Maine-et-Loire|50:Manche|51:Marne|52:Haute-Marne|53:Mayenne|54:Meurthe-et-Moselle|55:Meuse|56:Morbihan|57:Moselle|58:Nièvre|59:Nord|60:Oise|61:Orne|62:Pas-de-Calais|63:Puy-de-Dôme|64:Pyrénées-Atlantiques|65:Hautes-Pyrénées|66:Pyrénées-Orientales|67:Bas-Rhin|68:Haut-Rhin|69:Rhône|70:Haute-Saône|71:Saône-et-Loire|72:Sarthe|73:Savoie|74:Haute-Savoie|75:Paris|76:Seine-Maritime|77:Seine-et-Marne|78:Yvelines|79:Deux-Sèvres|80:Somme|81:Tarn|82:Tarn-et-Garonne|83:Var|84:Vaucluse|85:Vendée|86:Vienne|87:Haute-Vienne|88:Vosges|89:Yonne|90:Territoire de Belfort|91:Essonne|92:Hauts-de-Seine|93:Seine-Saint-Denis|94:Val-de-Marne|95:Val-d'Oise|971:Guadeloupe|972:Martinique|973:Guyane|974:La Réunion|976:Mayotte`.split('|').map(x => x.split(':')));

export function safeUrl(value) {
  try { const u = new URL(value); return u.protocol === 'https:' && !u.username && !u.password ? u.href : ''; } catch { return ''; }
}
const text = value => typeof value === 'string' ? value.trim().slice(0, 500) : '';
export function departmentFromPostal(value) {
  const p = String(value || '');
  if (!/^\d{5}$/.test(p)) return '';
  if (p === '20000' || p.startsWith('201')) return '2A';
  if (p.startsWith('202') || p === '20600') return '2B';
  const d = p.startsWith('97') ? p.slice(0, 3) : p.slice(0, 2);
  return departments[d] ? d : '';
}
export function normalize(row, source, today) {
  const lat = Number(row.lat), lng = Number(row.lng), date = text(row.date);
  if (row.lat == null || row.lng == null || row.lat === '' || row.lng === '' || !Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date || date < today) return null;
  if (['cancelled', 'canceled', 'postponed'].includes(row.status)) return null;
  const country = text(row.country) || 'FR';
  const dep = country !== 'FR' ? country : text(row.dep) || departmentFromPostal(row.postalCode);
  const url = safeUrl(row.url);
  // Code pays à 2 lettres, et pas un code réservé qui ne désigne aucun pays (AA, QM à QZ, XA à XZ, ZZ)
  if (!/^[A-Z]{2}$/.test(country) || /^(AA|Q[M-Z]|X[A-Z]|ZZ)$/.test(country) || (country === 'FR' && !departments[dep]) || !url || !text(row.nom) || !text(row.lieu)) return null;
  return { id: source.id + ':' + text(row.id || url), src: source.id, nom: text(row.nom), date,
    heure: /^([01]\d|2[0-3]):[0-5]\d$/.test(row.heure || '') ? row.heure : '',
    djs: Array.isArray(row.lineup) ? row.lineup.map(text).filter(Boolean).join(', ') : text(row.djs),
    type: ['club', 'festival', 'concert', 'bar', 'restaurant', 'soiree'].includes(row.type) ? row.type : 'club',
    djSet: row.djSet !== false && (row.djSet === true || (Array.isArray(row.lineup) ? row.lineup.some(Boolean) : !!text(row.djs))),
    scheduleNote: text(row.scheduleNote), genres: text(row.genres), prix: text(row.prix), url, ticketUrl: safeUrl(row.ticketUrl), flyerUrl: safeUrl(row.flyerUrl),
    verifiedAt: text(row.verifiedAt), sourceName: text(row.sourceName), sourceUpdatedAt: text(row.sourceUpdatedAt), sourceLicense: safeUrl(row.sourceLicense), sourceRecordUrl: safeUrl(row.sourceRecordUrl),
    venue: { nom: text(row.lieu), ville: text(row.ville), country, dep, lat, lng, approx: row.positionApproximate === true } };
}
export const { wordsInTitle: motsTitre, sameEvent: memeSoiree } = agendaMatch;
export function snapshot(rows, sources, now = new Date()) {
  const today = now.toISOString().slice(0, 10), lieux = {}, soirees = [], seen = new Set(), parJour = {};
  const countryCoverage = { FR: 0, BE: 0, ES: 0 };
  const coverage = Object.fromEntries(Object.keys(departments).map(d => [d, 0]));
  let doublons = 0;
  for (const { row, source } of rows) {
    const e = normalize(row, source, today); if (!e) continue;
    if (seen.has(e.id)) continue;
    e.mots = motsTitre(e);
    const jour = parJour[e.date] ||= [];
    const existing = jour.find(x => memeSoiree(x, e));
    if (existing) {
      doublons++;
      Object.assign(existing, agendaMatch.mergeEvent(existing, e));
      seen.add(e.id);
      continue;
    }
    seen.add(e.id); e.autresSources = []; jour.push(e); soirees.push(e);
  }
  soirees.sort((a, b) => (a.date + a.heure).localeCompare(b.date + b.heure));
  const out = soirees.map((e, i) => {
    const { venue, mots, autresSources, ...event } = e, lieu = 'radar-' + i; lieux[lieu] = venue;
    if (venue.country === 'FR') coverage[venue.dep]++;
    countryCoverage[venue.country] = (countryCoverage[venue.country] || 0) + 1;
    return autresSources.length ? { ...event, lieu, aussiSur: autresSources.filter(s => s !== event.sourceName) } : { ...event, lieu };
  });
  console.log(doublons + ' doublons fusionnés entre les sources.');
  return { maj: now.toISOString(), departments, coverage, countryCoverage, sources: Object.fromEntries(sources.map(s => [s.id, s.homepage])), lieux, soirees: out };
}
async function lire(fichier, input) {
  let contenu;
  try { contenu = await readFile(fichier, 'utf8'); } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
  const d = JSON.parse(contenu);
  input.sources.push(...d.sources.filter(s => !input.sources.some(x => x.id === s.id)));
  return d.events;
}
async function main() {
  const input = JSON.parse(await readFile('data/radar-events.json', 'utf8'));
  // Les sources les plus complètes (line-up) passent d'abord : en cas de doublon, c'est leur fiche qui est gardée
  input.events.unshift(...await lire('data/radar-shotgun-direct.json', input), ...await lire('data/radar-xceed.json', input));
  const priorites = await lire('data/radar-openagenda-priorites.json', input);
  input.events.push(...priorites);
  const sites = await lire('data/radar-sites-valides.json', input);
  input.events.push(...sites.filter(row => row.reviewRequired === false));
  for (const countryFile of ['data/radar-belgium.json', 'data/radar-spain.json']) {
    input.events.push(...await lire(countryFile, input));
  }
  const sources = input.sources;
  if (!Array.isArray(sources) || !Array.isArray(input.events)) throw new Error('Format radar invalide');
  const ids = new Set();
  for (const source of sources) {
    if (!/^[a-z0-9-]+$/.test(source.id) || ids.has(source.id) || !safeUrl(source.homepage)) throw new Error('Source invalide');
    ids.add(source.id);
  }
  const rows = input.events.map(row => {
    const source = sources.find(s => s.id === row.src);
    if (!source || !safeUrl(row.url) || !/^\d{4}-\d{2}-\d{2}T/.test(row.verifiedAt || '') || Number.isNaN(Date.parse(row.verifiedAt)) || !text(row.evidence)) throw new Error('Annonce sans source ou vérification');
    const candidate = normalize(row, source, '0000-01-01');
    if (!candidate && !['cancelled', 'canceled', 'postponed'].includes(row.status)) throw new Error('Annonce invalide');
    return { row, source };
  });
  const data = snapshot(rows, sources);
  const json = JSON.stringify(data).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
  await writeFile('agenda-radar.js', '// Généré par scripts/radar.mjs. Ne contient aucune clé API.\nwindow.AGENDA_RADAR = ' + json + ';\n');
  await writeRadarZones(data);
  const sansAnnonce = Object.keys(data.coverage).filter(dep => !data.coverage[dep]);
  console.log(`${data.soirees.length} soirées ; ${101 - sansAnnonce.length}/101 départements avec annonces.`);
  console.log('Départements sans annonce :', sansAnnonce.join(', ') || 'aucun');
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main().catch(() => {
  console.error('Radar non actualisé. Vérifier les annonces et leur provenance ; données précédentes conservées.'); process.exitCode = 1;
});
