// Remet dans le radar les soirées « bars festifs » (karaoké, blind test, afterwork, apéro musical) retirées par le tri du 12/11.
// Usage : node scripts/remettre-bars-festifs.mjs ancien-radar-events.json ancien-radar-belgium.json ancien-radar-spain.json
import { readFile, writeFile } from 'node:fs/promises';
import { genreFestif } from './bars-festifs.mjs';
const today = new Date().toISOString().slice(0, 10);
const cibles = ['data/radar-events.json', 'data/radar-belgium.json', 'data/radar-spain.json'];
for (let i = 0; i < cibles.length; i++) {
  const ancien = JSON.parse(await readFile(process.argv[2 + i], 'utf8')).events, d = JSON.parse(await readFile(cibles[i], 'utf8'));
  const ids = new Set(d.events.map((e) => e.id));
  const ajout = ancien.filter((e) => !ids.has(e.id) && e.date >= today && genreFestif(e)).map((e) => ({ ...e, type: 'bar', genres: genreFestif(e) }));
  d.events = d.events.concat(ajout); await writeFile(cibles[i], JSON.stringify(d, null, 2) + '\n'); console.log(cibles[i], '+', ajout.length);
}
