(function (root) {
  'use strict';

  const cacheName = 'banzic-radar-zones-v1';
  const requests = new Map();
  let manifest;

  function requestJson(url, persist = false, revalidate = false) {
    if (!requests.has(url)) {
      requests.set(url, (async () => {
        const cache = persist ? await root.caches?.open(cacheName).catch(() => null) : null;
        const cached = await cache?.match(url).catch(() => null);
        if (cached && !revalidate) {
          try { return await cached.json(); }
          catch { await cache.delete(url).catch(() => {}); }
        }
        let response;
        try {
          response = await fetch(url, { cache: revalidate ? 'no-cache' : 'default' });
          if (!response.ok) throw new Error('Radar HTTP ' + response.status);
        } catch (error) {
          if (cached && revalidate) return cached.json();
          throw error;
        }
        const copy = cache && response.clone();
        const data = await response.json();
        if (copy) cache.put(url, copy).catch(() => {});
        return data;
      })().catch(error => { requests.delete(url); throw error; }));
    }
    return requests.get(url);
  }

  async function index() {
    if (!manifest) {
      manifest = requestJson('radar-zones/index.json', true, true).then(data => {
        if (!Array.isArray(data.index)) throw new Error('Index radar invalide');
        if (root.caches) {
          const current = new Set(data.index.map(urlZone).concat(searchUrl(data), 'radar-zones/index.json').map(url => new URL(url, location.href).href));
          root.caches.open(cacheName).then(async cache => {
            for (const key of await cache.keys()) if (!current.has(key.url)) await cache.delete(key);
          }).catch(() => {});
        }
        return data;
      }).catch(error => { manifest = null; requests.delete('radar-zones/index.json'); throw error; });
    }
    return manifest;
  }

  const urlZone = zone => 'radar-zones/' + zone.id + '.json?v=' + zone.version;
  const searchUrl = data => 'radar-zones/recherche.json?v=' + data.recherche;
  async function search() { return requestJson(searchUrl(await index()), true); }
  function circle(centre, km) {
    const [lat, lng] = centre, radians = Math.PI / 180, delta = km / 6371 / radians;
    const angle = Math.abs(lat) + delta >= 90 ? 180 : Math.asin(Math.sin(delta * radians) / Math.cos(lat * radians)) / radians;
    return { minLat: Math.max(-90, lat - delta), maxLat: Math.min(90, lat + delta), minLng: lng - angle, maxLng: lng + angle };
  }
  function intersects(zone, bounds) {
    if (zone.minLat > bounds.maxLat || zone.maxLat < bounds.minLat) return false;
    if (bounds.maxLng - bounds.minLng >= 360) return true;
    const shift = 360 * Math.round((bounds.minLng - zone.minLng) / 360);
    return [shift - 360, shift, shift + 360].some(d => zone.minLng + d <= bounds.maxLng && zone.maxLng + d >= bounds.minLng);
  }
  function select(zones, { ids, country, dep, bounds, dates }) {
    const keys = ids && new Set(ids);
    return zones.filter(zone => (!keys || keys.has(zone.id)) && (!country || zone.country === country)
      && (!dep || zone.dep === dep) && (!bounds || intersects(zone, bounds))
      && (!dates || dates.some(date => zone.dates.includes(date))));
  }
  async function load(zones) {
    let next = 0;
    const results = new Array(zones.length);
    async function worker() {
      while (next < zones.length) {
        const i = next++, zone = zones[i];
        try { results[i] = { zone, data: await requestJson(urlZone(zone), true) }; }
        catch { results[i] = { zone, data: null }; }
      }
    }
    await Promise.all(Array.from({ length: Math.min(8, zones.length) }, worker));
    return results;
  }

  const api = { index, circle, select, load, search };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.BANZIC_RADAR_ZONES = api;
})(globalThis);
