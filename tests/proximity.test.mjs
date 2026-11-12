import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const app = readFileSync(new URL('../app.js', import.meta.url), 'utf8');
function context(state, soirees = [], lieux = {}) {
  const c = vm.createContext({ state, DEST: { local: { centre: [43.1242, 5.928] } }, SUD: { soirees, lieux }, iso: () => '2026-11-12' });
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
test('100 km : soirées du jour sans DJ incluses, futures et lointaines exclues, frontière ignorée', () => {
  const state = { ckRayon: 100, maPos: { lat: 42.7, lng: 2.9 } };
  const lieux = { proche: { lat: 42.6, lng: 2.9, country: 'ES' }, loin: { lat: 41.38, lng: 2.17, country: 'ES' } };
  const c = context(state, [{ id: 'sans-dj', date: '2026-11-12', lieu: 'proche', djSet: false }, { id: 'demain', date: '2026-11-13', lieu: 'proche' }, { id: 'loin', date: '2026-11-12', lieu: 'loin' }], lieux);
  assert.deepEqual(Array.from(vm.runInContext('soireesCarteJour().map(x => x.id)', c)), ['sans-dj']);
  assert.equal(vm.runInContext('dansRayonCarte(43.59, 2.9)', c), true);
  assert.equal(vm.runInContext('dansRayonCarte(43.61, 2.9)', c), false);
  assert.ok(vm.runInContext('distKm([0, 179.9], [0, -179.9])', c) < 23);
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
