(function (root) {
  'use strict';

  const ignored = new Set('the and les des une pour avec soiree party night club concert live dj djs presents presente invite feat with all nuit de la le du et en au aux x'.split(' '));
  const words = value => String(value || '').toLowerCase().normalize('NFD').replace(/\p{M}/gu, '')
    .split(/[^\p{L}\p{N}]+/u).filter(word => (word.length > 2 || /[0-9]/.test(word) || /^(ii|iv|vi|ix)$/.test(word)) && !ignored.has(word));
  const wordsInTitle = event => {
    const venue = new Set(words(event.venue.nom + ' ' + event.venue.ville));
    const title = String(event.nom || '').replace(/\[drink included\]/gi, '');
    return new Set(words(title).filter(word => !venue.has(word)));
  };
  function eventUrl(value) {
    try {
      const url = new URL(value);
      if (url.protocol !== 'https:' || url.username || url.password || url.pathname === '/') return '';
      url.hash = '';
      return url.href;
    } catch { return ''; }
  }
  function sameEvent(a, b) {
    if (!a.date || a.date !== b.date || (a.heure && b.heure && a.heure !== b.heure)) return false;
    const x = a.venue, y = b.venue;
    if (!x || !y || (x.country && y.country && x.country !== y.country)) return false;
    if (a.src && a.src === b.src && a.id != null && a.id === b.id) return true;
    if (![x.lat, x.lng, y.lat, y.lng].every(Number.isFinite)) return false;
    const rad = Math.PI / 180;
    const d = Math.sin((y.lat - x.lat) * rad / 2) ** 2 +
      Math.cos(x.lat * rad) * Math.cos(y.lat * rad) * Math.sin((y.lng - x.lng) * rad / 2) ** 2;
    if (12742 * Math.asin(Math.sqrt(Math.min(1, d))) > 0.3) return false;
    const first = a.mots || wordsInTitle(a), second = b.mots || wordsInTitle(b);
    let common = 0;
    for (const word of first) if (second.has(word)) common++;
    const max = Math.max(first.size, second.size);
    if (common && common === max) return true;
    const title = words(a.nom).join(' ');
    if (title && title === words(b.nom).join(' ')) return true;
    const url = eventUrl(a.sourceRecordUrl || a.url);
    return Boolean(url && url === eventUrl(b.sourceRecordUrl || b.url) &&
      String(a.nom || '').trim().toLowerCase() === String(b.nom || '').trim().toLowerCase());
  }

  function mergeEvent(primary, secondary) {
    const merged = { ...primary };
    const fields = ['heure', 'heureFin', 'ticketUrl', 'flyerUrl', 'genres', 'prix', 'scheduleNote', 'url'];
    for (const field of fields) if (!merged[field] && secondary[field]) merged[field] = secondary[field];
    const artists = new Map();
    for (const artist of [primary.djs, secondary.djs].filter(Boolean).join(',').split(',').map(x => x.trim()).filter(Boolean)) {
      const key = artist.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');
      if (!artists.has(key)) artists.set(key, artist);
    }
    if (artists.size) merged.djs = [...artists.values()].join(', ');
    if (primary.djSet || secondary.djSet) merged.djSet = true;
    const sources = event => event.provenance || [{
      source: event.src, id: event.id, nom: event.sourceName, url: event.sourceRecordUrl || event.url,
      actualise: event.sourceUpdatedAt, verifie: event.verifiedAt, licence: event.sourceLicense,
    }];
    const provenance = new Map();
    for (const source of [...sources(primary), ...sources(secondary)]) {
      const key = [source.source, source.nom, source.url || source.id].join('|');
      const current = provenance.get(key);
      if (!current || (source.actualise || '') > (current.actualise || '')) provenance.set(key, source);
    }
    merged.provenance = [...provenance.values()];
    merged.aussiSur = [...new Set([...(primary.aussiSur || []), ...(secondary.aussiSur || []), secondary.sourceName || secondary.src].filter(Boolean))];
    return merged;
  }

  function mergeFeeds(base, incoming, venues) {
    const byDate = new Map();
    const output = base.slice();
    const originals = new Map();
    function index(event, position) {
      if (!byDate.has(event.date)) byDate.set(event.date, []);
      byDate.get(event.date).push(position);
    }
    base.forEach(index);
    for (const event of incoming) {
      const match = (byDate.get(event.date) || []).find(position => {
        const other = output[position];
        return sameEvent({ ...other, venue: venues[other.lieu] }, { ...event, venue: venues[event.lieu] });
      });
      if (match === undefined) {
        index(event, output.length);
        output.push(event);
      } else {
        const previous = output[match];
        const original = originals.get(previous) || previous;
        originals.delete(previous);
        output[match] = mergeEvent(previous, event);
        originals.set(output[match], original);
      }
    }
    return { events: output, originals };
  }

  const api = { wordsInTitle, sameEvent, mergeEvent, mergeFeeds };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.BANZIC_AGENDA_MATCH = api;
})(globalThis);
