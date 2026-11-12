// Liste des discothèques de France depuis OpenStreetMap (amenity=nightclub), © les contributeurs OpenStreetMap, licence ODbL.
// Écrit discotheques.js : [id, nom, lat, lng, ville, site]. Lancé par .github/workflows/discotheques.yml (une fois par mois).
import { writeFile } from 'node:fs/promises';
const q = '[out:json][timeout:240];area["ISO3166-1"="FR"][admin_level=2]->.fr;nwr["amenity"="nightclub"]["name"](area.fr);out center tags;';
const hotes = ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter', 'https://overpass.private.coffee/api/interpreter'];
let els = null;
for (const h of hotes) {
  try {
    const r = await fetch(h, { method: 'POST', headers: { 'User-Agent': 'Banzic/1.0 (https://banzic-2.vercel.app)', 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ data: q }) });
    if (!r.ok) { console.log(h, r.status); continue; }
    els = (await r.json()).elements; console.log(h, els.length); break;
  } catch (e) { console.log(h, e.message); }
}
if (!els || els.length < 200) { console.error('Liste incomplète, fichier non modifié'); process.exit(1); }
const sur = (u) => { try { const x = new URL(/^https?:/.test(u) ? u : 'https://' + u); return x.protocol === 'https:' || x.protocol === 'http:' ? x.href.replace(/^http:/, 'https:') : ''; } catch { return ''; } };
const rows = els.map((e) => { const t = e.tags || {}, lat = e.lat ?? e.center?.lat, lng = e.lon ?? e.center?.lon;
  if (lat == null || /disused|abandoned/.test(t.disused || '') || t['disused:amenity']) return null;
  return [e.type[0] + e.id, String(t.name).slice(0, 60), +lat.toFixed(5), +lng.toFixed(5), String(t['addr:city'] || '').slice(0, 40), sur(t.website || t['contact:website'] || '')]; }).filter(Boolean)
  .sort((a, b) => a[0].localeCompare(b[0]));
await writeFile('discotheques.js', '// Discothèques de France · © les contributeurs OpenStreetMap (ODbL) · généré par scripts/discotheques.mjs le ' + new Date().toISOString().slice(0, 10) + '\nwindow.DISCOTHEQUES = ' + JSON.stringify(rows) + ';\n');
console.log(rows.length, 'discothèques');
