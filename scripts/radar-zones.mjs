import { createHash } from 'node:crypto';
import { mkdir, readdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const hash = value => createHash('sha256').update(value).digest('hex').slice(0, 16);
const compact = value => JSON.stringify(value) + '\n';

export async function writeRadarZones(data, directory = 'radar-zones') {
  await mkdir(directory, { recursive: true });
  const { soirees, lieux, ...metadata } = data;
  const zones = new Map(), recherche = [];
  for (const event of soirees) {
    const lieu = lieux[event.lieu];
    const { country, dep, lat, lng } = lieu;
    const key = country === 'FR' ? country + '-' + dep : [country, Math.floor(lat / 2), Math.floor(lng / 2)].join('_');
    if (!zones.has(key)) zones.set(key, { country, dep, minLat: lat, maxLat: lat, minLng: lng, maxLng: lng, dates: new Set(), lieux: {}, soirees: [] });
    const zone = zones.get(key);
    zone.minLat = Math.min(zone.minLat, lat);
    zone.maxLat = Math.max(zone.maxLat, lat);
    zone.minLng = Math.min(zone.minLng, lng);
    zone.maxLng = Math.max(zone.maxLng, lng);
    zone.dates.add(event.date);
    zone.lieux[event.lieu] = lieu;
    zone.soirees.push(event);
    recherche.push([key, event.id, event.date, [event.nom, event.djs, lieu.nom, lieu.ville].filter(Boolean).join('\n')]);
  }
  const index = [];
  for (const [id, { lieux, soirees, dates, ...geo }] of zones) {
    const body = compact({ lieux, soirees });
    const version = hash(body);
    await writeFile(directory + '/' + id + '.json', body);
    index.push({ id, version, ...geo, dates: [...dates] });
  }
  const search = compact(recherche);
  await writeFile(directory + '/recherche.json', search);
  await writeFile(directory + '/index.json', compact({ ...metadata, index, recherche: hash(search) }));
  const files = new Set(['index.json', 'recherche.json', ...index.map(zone => zone.id + '.json')]);
  for (const name of await readdir(directory)) {
    if (/^[A-Z]{2}[-_][A-Z0-9_-]+\.json$/.test(name) && !files.has(name)) await unlink(directory + '/' + name);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const source = await readFile(process.argv[2] || 'agenda-radar.js', 'utf8');
  const data = JSON.parse(source.split('window.AGENDA_RADAR = ')[1].trim().replace(/;$/, ''));
  await writeRadarZones(data);
}
