import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import zones from '../lib/radar-zones.js';

test('les zones publiées préservent toutes les soirées et leurs lieux', async () => {
  const data = await readFile(new URL('../agenda-radar.js', import.meta.url), 'utf8');
  const radar = JSON.parse(data.split('window.AGENDA_RADAR = ')[1].trim().replace(/;$/, ''));
  const read = async file => JSON.parse(await readFile(new URL('../radar-zones/' + file, import.meta.url), 'utf8'));
  const index = await read('index.json');
  const lots = await Promise.all(index.index.map(zone => read(zone.id + '.json')));
  const sorties = lots.flatMap(lot => lot.soirees).sort((a, b) => a.id.localeCompare(b.id));
  assert.deepEqual(sorties, radar.soirees.slice().sort((a, b) => a.id.localeCompare(b.id)));
  assert.deepEqual(Object.assign({}, ...lots.map(lot => lot.lieux)), radar.lieux);
  assert.deepEqual(index.departments, radar.departments);
  assert.deepEqual(index.coverage, radar.coverage);
  assert.deepEqual((await read('recherche.json')).map(row => row[1]).sort(), sorties.map(event => event.id).sort());
});

test('la sélection conserve les zones à 100 km, outre-mer et au passage du méridien', () => {
  const row = (id, lat, lng, country, dep) => ({
    id, country, dep, minLat: lat, maxLat: lat, minLng: lng, maxLng: lng, dates: ['2027-01-01'],
  });
  const region = [
    row('proche', 43.8, 6, 'FR', '83'), row('lointaine', 45, 6, 'FR', '06'),
    row('outremer', -21, 55, 'FR', '974'), row('vers-est', 0, -179.9, 'FJ', 'FJ'),
  ];
  assert.deepEqual(zones.select(region, { bounds: zones.circle([43, 6], 100) }).map(z => z.id), ['proche']);
  assert.deepEqual(zones.select(region, { country: 'FR', dep: '974' }).map(z => z.id), ['outremer']);
  assert.deepEqual(zones.select(region, { bounds: zones.circle([0, 179.9], 100) }).map(z => z.id), ['vers-est']);
  assert.equal(zones.select(region, { dates: ['2026-12-31'] }).length, 0);
});
