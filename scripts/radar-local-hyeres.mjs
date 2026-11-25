// Radar local : collecte prudente des événements JSON-LD publiés sur les sites autorisés.
// Les résultats sont des candidats à vérifier, jamais des événements automatiquement publiés.
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { safeUrl } from './radar.mjs';
function events(node) {
  if (Array.isArray(node)) return node.flatMap(events);
  if (!node || typeof node !== 'object') return [];
  const t = node['@type'];
  const found = (Array.isArray(t) ? t : [t]).some(x => typeof x === 'string' && /(?:^|[/:])(?:[a-z]+)?Event$/i.test(x)) ? [node] : [];
  return [...found, ...Object.values(node).flatMap(v => typeof v === 'object' ? events(v) : [])];
}
export function candidatesFromHtml(html, source, now, end) {
  const candidates = new Map();
  for (const match of html.matchAll(/<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    let data;
    try { data = JSON.parse(match[1]); } catch { continue; }
    for (const event of events(data)) {
      if (typeof event.startDate !== 'string' || !/^\d{4}-\d{2}-\d{2}T/.test(event.startDate)) continue;
      if (/(EventCancelled|EventPostponed|EventRescheduled)$/.test(String(event.eventStatus || ''))) continue;
      const date = new Date(event.startDate);
      if (!Number.isFinite(date.getTime()) || date < now || date > end) continue;
      const name = typeof event.name === 'string' ? event.name.trim() : '';
      if (!name) continue;
      const location = typeof event.location === 'object' ? event.location?.name || '' : '';
      let url = source.url;
      if (typeof event.url === 'string') {
        try { url = safeUrl(new URL(event.url, source.url).href) || url; } catch { /* Keep the source page. */ }
      }
      const key = JSON.stringify([name, event.startDate, location, url]);
      candidates.set(key, { source: source.id, sourceUrl: source.url, name, startDate: event.startDate, location, url, reviewRequired: true });
    }
  }
  return [...candidates.values()];
}

async function main() {
  const config = JSON.parse(await readFile('data/radar-sources-hyeres.json','utf8'));
  const now = new Date();
  const end = new Date(now.getTime() + 72*3600*1000);
  const results = [], checks = [];
  for (const source of config.sources) {
    try {
      const response = await fetch(source.url, { signal: AbortSignal.timeout(15000), headers: { 'User-Agent': 'BanzicRadar/1.0 (+public event discovery)' } });
      if (!response.ok) throw new Error('HTTP ' + response.status);
      const candidates = candidatesFromHtml(await response.text(), source, now, end);
      results.push(...candidates);
      checks.push({ source: source.id, status: 'ok', jsonLdEventsFound: candidates.length, checkedAt: now.toISOString() });
    } catch (error) {
      checks.push({ source: source.id, status: 'error', reason: String(error.message).slice(0, 160), checkedAt: now.toISOString() });
    }
  }
  await mkdir('data/radar-review', { recursive: true });
  await writeFile('data/radar-review/hyeres-candidates.json', JSON.stringify({
    generatedAt: now.toISOString(), zone: config.zone, checks, candidates: results,
  }, null, 2) + '\n');
  console.log('Sources contrôlées :', checks.length, '; annonces à vérifier :', results.length);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
