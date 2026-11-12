// Liste des discothèques de France depuis OpenStreetMap (amenity=nightclub), © les contributeurs OpenStreetMap, licence ODbL.
// Écrit discotheques.js : [id, nom, lat, lng, ville, site]. Lancé par .github/workflows/discotheques.yml (une fois par mois).
import { writeFile } from 'node:fs/promises';
// Cadre de la France métropolitaine et de la Corse (plus rapide qu'une recherche par frontière) ; les pays voisins sont écartés ensuite par addr:country si présent
const q = '[out:json][timeout:180];nwr["amenity"="nightclub"]["name"](41.3,-5.3,51.2,9.7);out center tags;';
const hotes = ['https://maps.mail.ru/osm/tools/overpass/api/interpreter', 'https://overpass.private.coffee/api/interpreter', 'https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter'];
// Contour simplifié de la France métropolitaine + Corse, pour écarter la Belgique, la Suisse, l'Espagne, l'Italie, l'Allemagne…
const FR = [[51.09,2.54],[50.75,3.25],[50.3,4.1],[49.95,4.85],[49.55,5.85],[49.45,6.4],[49.2,6.85],[49.15,7.6],[48.95,8.2],[48.6,7.8],[47.6,7.55],[47.45,7.0],[47.0,6.9],[46.4,6.1],[46.15,6.8],[45.9,7.0],[45.3,7.1],[44.9,6.95],[44.4,6.85],[44.1,7.6],[43.78,7.53],[43.2,6.6],[43.0,5.5],[43.35,4.6],[43.4,3.5],[42.5,3.15],[42.45,1.7],[42.7,0.7],[42.8,-0.3],[43.1,-1.5],[43.4,-1.8],[44.5,-1.3],[46.2,-1.3],[47.0,-2.3],[47.6,-3.1],[48.0,-4.8],[48.7,-4.7],[48.85,-3.0],[48.6,-1.6],[49.7,-1.95],[49.4,-0.3],[50.0,1.4],[51.09,2.54]];
const dans = (lat, lng, poly) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [yi, xi] = poly[i], [yj, xj] = poly[j]; if ((yi > lat) !== (yj > lat) && lng < (xj - xi) * (lat - yi) / (yj - yi) + xi) c = !c; } return c; };
const enFrance = (lat, lng) => dans(lat, lng, FR) || (lat > 41.3 && lat < 43.1 && lng > 8.5 && lng < 9.6);
// Par paquets de 10 départements : chaque requête reste petite, et un paquet qui échoue est réessayé sur un autre serveur
const DEPS = ['01','02','03','04','05','06','07','08','09','10','11','12','13','14','15','16','17','18','19','2A','2B','21','22','23','24','25','26','27','28','29','30','31','32','33','34','35','36','37','38','39','40','41','42','43','44','45','46','47','48','49','50','51','52','53','54','55','56','57','58','59','60','61','62','63','64','65','66','67','68','69','70','71','72','73','74','75','76','77','78','79','80','81','82','83','84','85','86','87','88','89','90','91','92','93','94','95'];
const pause = (ms) => new Promise((r) => setTimeout(r, ms));
let els = [], rates = [];
for (let k = 0; k < DEPS.length; k += 10) {
  const lot = DEPS.slice(k, k + 10), aires = lot.map((d, i) => `area["ref:INSEE"="${d}"]["admin_level"="6"]->.d${i};`).join(''), corps = lot.map((d, i) => `nwr["amenity"="nightclub"]["name"](area.d${i});`).join('');
  const ql = `[out:json][timeout:120];${aires}(${corps});out center tags;`;
  let ok = false;
  for (let essai = 0; essai < hotes.length * 2 && !ok; essai++) {
    const h = hotes[essai % hotes.length];
    try {
      const r = await fetch(h + '?data=' + encodeURIComponent(ql), { headers: { 'User-Agent': 'Banzic/1.0 (+https://banzic-2.vercel.app)', Accept: 'application/json,*/*' }, signal: AbortSignal.timeout(150000) });
      if (!r.ok) { console.log(lot[0] + '…', h, r.status); await pause(5000); continue; }
      const e = (await r.json()).elements || []; els = els.concat(e); ok = true; console.log('départements', lot.join(','), '→', e.length, 'via', new URL(h).host);
    } catch (e) { console.log(lot[0] + '…', h, e.message); await pause(5000); }
  }
  if (!ok) rates.push(...lot);
  await pause(3000);
}
if (rates.length) console.log('départements non récupérés :', rates.join(','));
const vus = new Set(); els = els.filter((e) => !vus.has(e.type + e.id) && vus.add(e.type + e.id));
if (!els || els.length < 200) { console.error('Liste incomplète, fichier non modifié'); process.exit(1); }
const sur = (u) => { try { const x = new URL(/^https?:/.test(u) ? u : 'https://' + u); return x.protocol === 'https:' || x.protocol === 'http:' ? x.href.replace(/^http:/, 'https:') : ''; } catch { return ''; } };
const rows = els.map((e) => { const t = e.tags || {}, lat = e.lat ?? e.center?.lat, lng = e.lon ?? e.center?.lon;
  if (lat == null || /disused|abandoned/.test(t.disused || '') || t['disused:amenity']) return null;
  if (t['addr:country'] && t['addr:country'] !== 'FR') return null;
  if (!enFrance(lat, lng)) return null;
  return [e.type[0] + e.id, String(t.name).slice(0, 60), +lat.toFixed(5), +lng.toFixed(5), String(t['addr:city'] || '').slice(0, 40), sur(t.website || t['contact:website'] || '')]; }).filter(Boolean)
  .sort((a, b) => a[0].localeCompare(b[0]));
await writeFile('discotheques.js', '// Discothèques de France · © les contributeurs OpenStreetMap (ODbL) · généré par scripts/discotheques.mjs le ' + new Date().toISOString().slice(0, 10) + '\nwindow.DISCOTHEQUES = ' + JSON.stringify(rows) + ';\n');
console.log(rows.length, 'discothèques');
