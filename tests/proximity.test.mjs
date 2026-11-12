import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const app = readFileSync(new URL('../app.js', import.meta.url), 'utf8');
function context(state, soirees = [], lieux = {}) {
  const bounds = { south: 42, north: 43, west: 2, east: 3, getCenter() { return { lng: (this.west + this.east) / 2 }; }, contains([lat, lng]) { return lat >= this.south && lat <= this.north && lng >= this.west && lng <= this.east; } };
  const c = vm.createContext({ state, bounds, map: { getBounds: () => bounds }, DEST: { local: { centre: [43.1242, 5.928] } }, SUD: { soirees, lieux }, iso: () => '2026-11-12' });
  const distance = app.match(/const distKm = .*?;\n/)[0];
  const geo = app.slice(app.indexOf('  function centreGeographique()'), app.indexOf('  function marqueursRadar()'));
  vm.runInContext(distance + geo, c);
  return c;
}
test('voyage : la ville choisie remplace le GPS pour la recherche, puis retour GPS', () => {
  const state = { ckRayon: 100, maPos: { lat: 43.12, lng: 5.93 }, villeChoisie: true, villeRecherche: [40.4168, -3.7038] };
  const c = context(state);
  assert.deepEqual(Array.from(vm.runInContext('centreGeographique()', c)), state.villeRecherche);
  state.villeChoisie = false;
  assert.deepEqual(Array.from(vm.runInContext('centreGeographique()', c)), [43.12, 5.93]);
});
test('carte : le déplacement et le dézoom affichent les soirées du jour au-delà de 100 km', () => {
  const state = { ckRayon: 10, maPos: { lat: 42.7, lng: 2.9 }, radarDep: '83' };
  const lieux = { proche: { lat: 42.6, lng: 2.9, country: 'ES' }, loin: { lat: 41.38, lng: 2.17, country: 'ES' } };
  const c = context(state, [{ id: 'sans-dj', date: '2026-11-12', lieu: 'proche', djSet: false }, { id: 'demain', date: '2026-11-13', lieu: 'proche' }, { id: 'loin', date: '2026-11-12', lieu: 'loin' }], lieux);
  assert.deepEqual(Array.from(vm.runInContext('soireesCarteJour().map(x => x.id)', c)), ['sans-dj']);
  c.bounds.south = 41;
  assert.deepEqual(Array.from(vm.runInContext('soireesCarteJour().map(x => x.id)', c)), ['sans-dj', 'loin']);
  c.bounds.north = 42;
  assert.deepEqual(Array.from(vm.runInContext('soireesCarteJour().map(x => x.id)', c)), ['loin']);
  assert.equal(vm.runInContext('dansZoneCarte(null, 2)', c), false);
  c.bounds.south = -1; c.bounds.north = 1; c.bounds.west = 179; c.bounds.east = 181;
  assert.equal(vm.runInContext('dansZoneCarte(0, -179.9)', c), true);
});
test('anciennes préférences de 1 000 km ramenées à 100 km au chargement', () => {
  for (const value of [undefined, 1000, 500, 100, 50]) {
    const state = {}, saved = {};
    const c = vm.createContext({ state, store: { get: (k, fallback) => value ?? fallback, set: (k, v) => { saved[k] = v; } } });
    const start = app.indexOf('  const CK_RAYONS =');
    vm.runInContext(app.slice(start, app.indexOf('  // La barre de progression', start)), c);
    assert.equal(state.ckRayon, value === 50 ? 50 : 100);
    assert.equal(saved.ckRayon, state.ckRayon);
  }
});
