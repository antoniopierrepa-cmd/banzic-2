import test from 'node:test';
import assert from 'node:assert/strict';
import { departments, departmentFromPostal, normalize, snapshot, safeUrl } from '../scripts/radar.mjs';
const source = { id: 'organisateur', homepage: 'https://example.org' };
const row = { id: 'a', nom: 'Soirée house', lieu: 'Club test', ville: 'Hyères', dep: '83', lat: 43.12, lng: 6.13, date: '2027-01-10', heure: '22:00', url: 'https://example.org/event', lineup: ['DJ test'] };
test('101 départements, Corse et outre-mer compris', () => {
  assert.equal(Object.keys(departments).length, 101);
  for (const [postal, dep] of [['83000','83'],['20000','2A'],['20200','2B'],['97400','974'],['97600','976']]) assert.equal(departmentFromPostal(postal), dep);
  assert.equal(departmentFromPostal('98000'), '');
});
test('rejette dates invalides, événements passés/annulés et coordonnées absentes', () => {
  for (const patch of [{ date: '2026-01-01' }, { date: '2027-02-30' }, { status: 'cancelled' }, { status: 'postponed' }, { lat: null }, { lat: '' }, { lng: 190 }, { dep: '20' }]) {
    assert.equal(normalize({ ...row, ...patch }, source, '2026-11-12'), null);
  }
});
test('aucun protocole exécutable dans les liens', () => {
  for (const url of ['javascript:alert(1)', 'data:text/html,test', 'http://example.org', 'https://user:password@example.org']) assert.equal(safeUrl(url), '');
  assert.equal(normalize({ ...row, url: 'javascript:alert(1)' }, source, '2026-11-12'), null);
});
test('déduplique et fusionne le line-up et la billetterie, sans inventer de DJ', () => {
  const data = snapshot([{ row: { ...row, lineup: [] }, source }, { row: { ...row, id: 'b', ticketUrl: row.url }, source }], [source], new Date('2026-11-12T10:00:00Z'));
  assert.equal(data.soirees.length, 1); assert.equal(data.soirees[0].djs, 'DJ test');
  assert.equal(data.soirees[0].ticketUrl, row.url); assert.equal(data.coverage['83'], 1);
  assert.equal(normalize({ ...row, lineup: [] }, source, '2026-11-12').djs, '');
});
test('conserve la provenance des annonces nationales et le type soirée', () => {
 const event = normalize({...row,type:'soiree',lineup:[],sourceName:'Office de tourisme',sourceUpdatedAt:'2026-11-10',sourceLicense:'https://example.org/licence',sourceRecordUrl:row.url},source,'2026-11-12');
 assert.equal(event.type,'soiree');assert.equal(event.sourceName,'Office de tourisme');assert.equal(event.sourceUpdatedAt,'2026-11-10');assert.equal(event.sourceRecordUrl,row.url);assert.equal(event.djSet,false);
});
test('la Belgique conserve sa géolocalisation et n’est pas un département français', () => {
 const belgian={...row,id:'belgium-test',country:'BE',dep:'',ville:'Bruxelles',lat:50.85,lng:4.35,lineup:[],flyerUrl:'https://example.org/flyer.jpg'};
 const result=normalize(belgian,source,'2026-11-12');assert.equal(result.venue.country,'BE');assert.equal(result.venue.dep,'BE');assert.equal(result.flyerUrl,belgian.flyerUrl);assert.equal(result.djSet,false);
 const data=snapshot([{row:belgian,source},{row,source}],[source],new Date('2026-11-12T10:00:00Z'));
 assert.equal(data.countryCoverage.BE,1);assert.equal(data.countryCoverage.FR,1);assert.equal(Object.keys(data.coverage).length,101);assert.equal(data.coverage.BE,undefined);
 assert.equal(normalize({...belgian,country:'ZZ'},source,'2026-11-12'),null);
 assert.equal(normalize({...belgian,lineup:['Groupe live'],djSet:false},source,'2026-11-12').djSet,false);
});
test('Espagne et îles : événements géolocalisés sans département ni DJ obligatoire', () => {
 const espagne={...row,id:'espagne-test',country:'ES',dep:'',ville:'Barcelona',lat:41.38,lng:2.17,lineup:[],djSet:false,scheduleNote:'Ouverture 0h30 · nuit suivant le 12/11'};
 const event=normalize(espagne,source,'2026-11-12');assert.equal(event.venue.country,'ES');assert.equal(event.venue.dep,'ES');assert.equal(event.djSet,false);assert.equal(event.scheduleNote,espagne.scheduleNote);
 const data=snapshot([{row:espagne,source},{row,source}],[source],new Date('2026-11-12T10:00:00Z'));assert.equal(data.countryCoverage.ES,1);assert.equal(data.coverage['83'],1);assert.equal(Object.keys(data.coverage).length,101);
});

test('le rapprochement commun ne fusionne ni des titres distincts ni deux horaires publiés', async () => {
  const { default: match } = await import('../lib/agenda-match.js');
  const venues = { local: { nom: 'Club test', ville: 'Hyères', lat: 43.12, lng: 6.13 } };
  const first = { id: 'local-a', src: 'local', lieu: 'local', date: row.date, nom: 'Soirée électro', heure: '22:00', djs: 'DJ Un', url: 'https://example.org/a' };
  const same = { ...first, id: 'bdd-a', src: 'bdd', djs: 'DJ Un, DJ Deux', ticketUrl: 'https://example.org/billets' };
  const different = { ...same, id: 'bdd-b', nom: 'Soirée salsa' };
  const secondSlot = { ...same, id: 'bdd-c', heure: '23:30' };
  const { events, originals } = match.mergeFeeds([first], [same, different, secondSlot], venues);
  assert.deepEqual(events.map(event => event.id), ['local-a', 'bdd-b', 'bdd-c']);
  assert.equal(events[0].djs, 'DJ Un, DJ Deux');
  assert.equal(events[0].ticketUrl, same.ticketUrl);
  assert.deepEqual(events[0].provenance.map(item => item.source), ['local', 'bdd']);
  assert.strictEqual(originals.get(events[0]), first);
  assert.equal(first.ticketUrl, undefined);
});

test('Hyères extrait uniquement des candidats datés, valides et à vérifier', async () => {
  const { candidatesFromHtml } = await import('../scripts/radar-local-hyeres.mjs');
  const now = new Date('2026-11-25T12:00:00Z'), end = new Date('2026-11-28T12:00:00Z');
  const event = { '@type': 'MusicEvent', name: 'Soirée test', startDate: '2026-11-26T20:00:00+01:00', url: '/agenda/soiree' };
  const html = '<script type="application/ld+json">' + JSON.stringify({ '@graph': [
    event, event,
    { ...event, name: 'Annulée', eventStatus: 'https://schema.org/EventCancelled' },
    { ...event, name: 'Sans horaire', startDate: '2026-11-26' },
  ] }) + '</script>';
  const candidates = candidatesFromHtml(html, { id: 'test', url: 'https://example.org/agenda' }, now, end);
  assert.equal(candidates.length, 1);
  assert.equal(candidates[0].url, 'https://example.org/agenda/soiree');
  assert.equal(candidates[0].reviewRequired, true);
});
