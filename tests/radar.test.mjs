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
