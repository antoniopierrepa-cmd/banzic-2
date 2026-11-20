import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const app = readFileSync(new URL('../app.js', import.meta.url), 'utf8');
function harness(search = '?fiche-test=dj-pierro') {
  const body = {innerHTML: ''};
  const ctx = vm.createContext({
    URLSearchParams, location: {search}, sansAccent: s => s.toLowerCase(),
    document: {getElementById: () => ({}), addEventListener() {}},
    $: () => body, djProParNom: () => null, state: {favs: []}, DECLS: [], STATS_DJ: {}, ALERTES_DJ: {},
    RESEAUX: [{id:'instagram', nom:'Instagram'}, {id:'tiktok', nom:'TikTok'}, {id:'youtube', nom:'YouTube'}, {id:'soundcloud', nom:'SoundCloud'}],
    ICO_RESEAU: {}, urlPropre: s => s || '', esc: s => String(s),
    blocAgendaDj: () => '', blocAnnonces: () => '', lecteurStream: () => '',
    avatarDj: () => '<span>DP</span>', boutonCasque: () => '<button>Casque</button>',
    setsConfirmes: d => d.confirmes || 0,
    blocCommentaires: nom => `<form class="form-com" data-com-cle="${nom.toLowerCase()}"></form><p>Commentaire conservé</p>`
  });
  vm.runInContext(app.slice(app.indexOf('  const testPierro ='), app.indexOf('  function renderDj()')), ctx);
  ctx.estFicheTestPierro = vm.runInContext("estFicheTestPierro", ctx);
  return {ctx, body};
}
const profile = {nom:'Dj pierro', ville:'Hyères', formule:'pro', confirmes:0, liens:{instagram:'https://instagram.com/example',tiktok:'https://tiktok.com/@example',youtube:'https://youtube.com/@example',soundcloud:'https://soundcloud.com/example'}};
test('test opt-in and exact existing name are both required', () => {
  const {ctx} = harness();
  assert.equal(ctx.estFicheTestPierro(profile), true);
  for (const nom of ['Dj Pierrot', 'Nina Sol', 'Dj pierro autre']) assert.equal(ctx.estFicheTestPierro({...profile, nom}), false);
  assert.equal(harness('').ctx.estFicheTestPierro(profile), false);
  assert.equal(harness('?fiche-test=autre').ctx.estFicheTestPierro(profile), false);
});
test('paid pro alone never grants certification or Booking', () => {
  const {ctx, body} = harness();
  ctx.renderFicheTestPierro(profile);
  assert.doesNotMatch(body.innerHTML, /Pro certifié|Booking/);
  ctx.renderFicheTestPierro({...profile, officiel:true});
  assert.match(body.innerHTML, /Pro certifié/); assert.match(body.innerHTML, /Booking/);
  ctx.renderFicheTestPierro({...profile, officiel:true, formule:'live'});
  assert.doesNotMatch(body.innerHTML, /Pro certifié|Booking/);
});
test('tabs are exclusive; networks, comments and offline live remain outside them', () => {
  const {ctx, body} = harness();
  for (const tab of ['univers', 'agenda', 'mixes']) {
    vm.runInContext(`ongletPierro = '${tab}'`, ctx); ctx.renderFicheTestPierro(profile);
    assert.equal((body.innerHTML.match(/role="tabpanel"/g) || []).length, 1);
    assert.equal((body.innerHTML.match(/aria-selected="true"/g) || []).length, 1);
    assert.match(body.innerHTML, /Pas de live en cours/);
    assert.match(body.innerHTML, /data-com-cle="dj pierro"/);
    for (const url of Object.values(profile.liens)) assert.ok(body.innerHTML.includes(url));
    if (tab === 'mixes') assert.doesNotMatch(body.innerHTML, /Sa présentation arrive bientôt|Aucune date annoncée/);
  }
});
test('a live arriving after the directory loads appears once, without rebuilding an unchanged player', () => {
  const {ctx} = harness();
  let current = {...profile}, writes = 0, html = 'Pas de live en cours';
  const live = {dataset:{}, get innerHTML() {return html;}, set innerHTML(v) {writes++; html=v;}};
  ctx.state.djOuvert = profile.nom;
  ctx.document.querySelector = () => live;
  ctx.djProParNom = () => current;
  ctx.enStream = d => !!d.stream;
  ctx.streamPrevu = () => false;
  ctx.lecteurStream = d => d.stream ? '<iframe title="Live"></iframe>' : '';
  ctx.actualiserLiveTestPierro();
  assert.equal(writes, 0);
  current = {...profile, stream:{url:'https://youtube.com/watch?v=example', depuis:1}};
  ctx.actualiserLiveTestPierro();
  assert.equal(writes, 1); assert.match(html, /iframe/);
  ctx.actualiserLiveTestPierro(); assert.equal(writes, 1);
  current = {...profile}; ctx.actualiserLiveTestPierro();
  assert.equal(writes, 2); assert.match(html, /Pas de live en cours/);
});
