// Ajout ponctuel d'un relevé Shotgun fait à la main (fichier events.json : soirées, lieux, line-up, flyers).
// Les soirées passées disparaissent d'elles-mêmes du radar ; rien n'est relancé automatiquement.
// Usage : node scripts/import-shotgun-direct.mjs /chemin/events.json   puis   node scripts/radar.mjs
import { readFile, writeFile } from 'node:fs/promises';
import { departmentFromPostal } from './radar.mjs';
import { estMusiqueClub } from './musique.mjs';

const local = (iso) => {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date(iso)).map((x) => [x.type, x.value]));
  return { date: `${p.year}-${p.month}-${p.day}`, heure: `${p.hour}:${p.minute}` };
};
// Un nom d'artiste : court, sans phrase (le relevé ramasse parfois des lignes de description)
const nomArtiste = (n) => typeof n === 'string' && n.length <= 40 && n.trim().split(/\s+/).length <= 5 && !/[.!?:]$/.test(n.trim()) && !/offert|billet|entr[ée]e|gratuit|verre|r[ée]serv/i.test(n);

const rows = JSON.parse(await readFile(process.argv[2], 'utf8')), checked = new Date().toISOString(), today = local(checked).date;
const events = rows.filter((e) => e.country === 'FR' && e.starts_at && Number.isFinite(e.latitude)).map((e) => {
  const { date, heure } = local(e.starts_at), fin = e.ends_at ? local(e.ends_at).heure : '';
  const url = /^https:\/\/shotgun\.live\//.test(e.detail_url || '') ? e.detail_url : '';
  return { id: 'sgd-' + e.id, src: 'shotgun-direct', country: 'FR', dep: departmentFromPostal(e.postal_code), nom: String(e.title || '').trim(), date, heure,
    lieu: e.venue || e.city, ville: e.city || '', lat: e.latitude, lng: e.longitude, type: /festival/i.test(e.title) ? 'festival' : 'club',
    lineup: (e.lineup || []).filter(nomArtiste).slice(0, 12), genres: '', scheduleNote: fin ? 'Fin annoncée ' + fin : '', prix: e.price_eur ? Math.round(e.price_eur) + ' €' : '',
    url, ticketUrl: url, flyerUrl: /^https:\/\//.test(e.flyer_url || '') ? e.flyer_url : '', verifiedAt: checked,
    evidence: 'Fiche publique Shotgun (relevé ponctuel) : date, lieu et line-up publiés par l’organisateur.', sourceName: 'Shotgun', sourceUpdatedAt: '', sourceLicense: '', sourceRecordUrl: url };
}).filter((e) => e.url && e.dep && e.date >= today && estMusiqueClub(e));
await writeFile('data/radar-shotgun-direct.json', JSON.stringify({ updatedAt: checked, sources: [{ id: 'shotgun-direct', homepage: 'https://shotgun.live' }], events }, null, 1) + '\n');
console.log(rows.length, 'soirées dans le relevé ;', events.length, 'à venir gardées');
