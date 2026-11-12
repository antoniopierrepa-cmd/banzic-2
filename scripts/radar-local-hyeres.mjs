// Radar local : collecte prudente des événements JSON-LD publiés sur les sites autorisés.
// Les résultats sont des candidats à vérifier, jamais des événements automatiquement publiés.
import { readFile, mkdir, writeFile } from 'node:fs/promises';
const config = JSON.parse(await readFile('data/radar-sources-hyeres.json','utf8'));
const now = new Date();
const end = new Date(now.getTime() + 72*3600*1000);
const results = [], checks = [];
function events(node) {
  if (Array.isArray(node)) return node.flatMap(events);
  if (!node || typeof node !== 'object') return [];
  const t = node['@type'];
  const found = (Array.isArray(t) ? t : [t]).some(x => typeof x === 'string' && /(^|:)Event$/.test(x)) ? [node] : [];
  return [...found, ...Object.values(node).flatMap(v => typeof v === 'object' ? events(v) : [])];
}
for (const source of config.sources) {
  try {
    const response = await fetch(source.url,{signal:AbortSignal.timeout(15000),headers:{'User-Agent':'BanzicRadar/1.0 (+public event discovery)'}});
    if (!response.ok) throw new Error('HTTP '+response.status);
    const html = await response.text();
    const scripts = [...html.matchAll(/<script\\b[^>]*type=["']application\\/ld\\+json["'][^>]*>([\\s\\S]*?)<\\/script>/gi)];
    let count=0;
    for (const match of scripts) {
      let data; try { data=JSON.parse(match[1]); } catch {continue;}
      for (const event of events(data)) {
        const date = new Date(event.startDate);
        if (!Number.isFinite(date.getTime()) || date<now || date>end) continue;
        const name = String(event.name||'').trim();
        if (!name) continue;
        const location = typeof event.location==='object' ? event.location?.name||'' : '';
        results.push({source:source.id,sourceUrl:source.url,name,startDate:event.startDate,location,url:typeof event.url==='string'?event.url:source.url,reviewRequired:true});
        count++;
      }
    }
    checks.push({source:source.id,status:'ok',jsonLdEventsFound:count,checkedAt:now.toISOString()});
  } catch(error) { checks.push({source:source.id,status:'error',reason:String(error.message).slice(0,160),checkedAt:now.toISOString()}); }
}
await mkdir('data/radar-review',{recursive:true});
await writeFile('data/radar-review/hyeres-candidates.json',JSON.stringify({generatedAt:now.toISOString(),zone:config.zone,checks,candidates:results},null,2)+'\\n');
console.log('Sources contrôlées:',checks.length,'; annonces structurées à vérifier:',results.length);
