// Ajoute au radar les soirées récurrentes publiées par les lieux eux-mêmes (data/radar-recurrentes.json), sur les 6 prochaines semaines.
// Les anciennes dates générées sont remplacées à chaque passage. Usage : node scripts/recurrentes.mjs && node scripts/radar.mjs
import { readFile, writeFile } from 'node:fs/promises';
const conf = JSON.parse(await readFile('data/radar-recurrentes.json', 'utf8'));
const data = JSON.parse(await readFile('data/radar-events.json', 'utf8'));
const now = new Date(), checked = now.toISOString(), iso = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
const ajout = [];
for (const s of conf.soirees) for (let i = 0; i < 42; i++) {
  const d = new Date(now); d.setDate(d.getDate() + i); if (!s.jours.includes(d.getDay())) continue;
  const date = iso(d);
  ajout.push({ id: 'rec-' + s.id + '-' + date, src: 'site-lieu', nom: s.nom, date, heure: s.heure || '', lieu: s.lieu, ville: s.ville, dep: s.dep, lat: s.lat, lng: s.lng, type: s.type, lineup: s.lineup,
    djSet: true, genres: s.genres, prix: '', scheduleNote: s.note || '', url: s.url, ticketUrl: '', flyerUrl: '', verifiedAt: checked, evidence: s.preuve, sourceName: 'Site du lieu (' + s.lieu + ')',
    sourceUpdatedAt: '', sourceLicense: '', sourceRecordUrl: s.url });
}
data.events = data.events.filter((e) => e.src !== 'site-lieu').concat(ajout);
if (!data.sources.some((x) => x.id === 'site-lieu')) data.sources.push({ id: 'site-lieu', homepage: 'https://banzic-2.vercel.app' });
await writeFile('data/radar-events.json', JSON.stringify(data, null, 2) + '\n');
console.log(ajout.length, 'dates de soirées récurrentes');
