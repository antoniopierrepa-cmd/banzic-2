// Discothèques de France depuis l'extrait OpenStreetMap de Geofabrik (filtré par osmium : amenity=nightclub).
// Champs : [id, nom, lat, lng, ville, site, horaires OpenStreetMap (opening_hours)].
// Entrée : un GeoJSON-Seq produit par `osmium export`. © les contributeurs OpenStreetMap, licence ODbL.
import { readFile, writeFile } from 'node:fs/promises';
const lignes = (await readFile(process.argv[2], 'utf8')).split('\n').filter((l) => l.trim());
const sur = (u) => { try { const x = new URL(/^https?:/.test(u) ? u : 'https://' + u); return /^https?:$/.test(x.protocol) ? x.href.replace(/^http:/, 'https:') : ''; } catch { return ''; } };
const centre = (g) => { const pts = []; const parc = (c) => typeof c[0] === 'number' ? pts.push(c) : c.forEach(parc); parc(g.coordinates); const n = pts.length; return n ? [pts.reduce((s, p) => s + p[1], 0) / n, pts.reduce((s, p) => s + p[0], 0) / n] : null; };
const vus = new Set(), rows = [];
for (const l of lignes) {
  let f; try { f = JSON.parse(l.replace(/^\x1e/, '')); } catch { continue; }
  const t = f.properties || {}; if (t.amenity !== 'nightclub' || !t.name || t['disused:amenity']) continue;
  const c = centre(f.geometry || { coordinates: [] }); if (!c) continue;
  const id = String(t['@type'] || 'x')[0] + (t['@id'] || rows.length); if (vus.has(id)) continue; vus.add(id);
  rows.push([id, String(t.name).slice(0, 60), +c[0].toFixed(5), +c[1].toFixed(5), String(t['addr:city'] || '').slice(0, 40), sur(t.website || t['contact:website'] || ''), String(t.opening_hours || '').slice(0, 120)]);
}
rows.sort((a, b) => a[0].localeCompare(b[0]));
if (rows.length < 200) { console.error('Liste incomplète (' + rows.length + '), fichier non modifié'); process.exit(1); }
await writeFile('discotheques.js', '// Discothèques de France · © les contributeurs OpenStreetMap (ODbL) · extrait Geofabrik du ' + new Date().toISOString().slice(0, 10) + '\nwindow.DISCOTHEQUES = ' + JSON.stringify(rows) + ';\n');
console.log(rows.length, 'discothèques');
