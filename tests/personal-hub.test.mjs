import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const app=readFileSync(new URL('../app.js',import.meta.url),'utf8');
function harness(saved,events,panel='soirees') {
 const elements=Object.fromEntries(['fav-hub-tabs','fav-list'].map(id=>[id,{innerHTML:'',hidden:true,attrs:{},setAttribute(k,v){this.attrs[k]=v;}}]));
 const context=vm.createContext({window:{},Set,Date,state:{favPanel:panel,favs:[]},mesSoirees:()=>saved,soireesAvecKm:()=>events,$:selector=>elements[selector.slice(1)],document:{querySelectorAll:()=>[]},renderFavDjs(){elements['fav-list'].innerHTML='DJ collection';},ficheSoireeJour(){},esc:x=>String(x),radarUrl:()=>'',afficheSoiree:()=>'/test.png',MOIS_CRT:['janv','févr','mars','avr','mai','juin','juil','août','sept','oct','nov','déc'],ICO_BANG:'◎'});
 vm.runInContext(app.slice(app.indexOf('  function soireesGardees()'),app.indexOf('  function ouvrirFavoris(')),context);
 context.renderFavs();return{context,elements};
}
test('saved event is visible without any DJ favorites',()=>{
 const {elements}=harness(['event-1'],[{id:'event-1',date:'2099-01-01',nom:'Saved event',l:{nom:'Venue',ville:'City'}}]);
 assert.match(elements['fav-list'].innerHTML,/Saved event/);
 assert.match(elements['fav-list'].innerHTML,/Retirer Saved event de mes soirées/);
 assert.equal(elements['fav-list'].attrs['aria-labelledby'],'fav-tab-soirees');
 assert.equal(elements['fav-hub-tabs'].hidden,false);
});
test('unrelated events are excluded and removing saved IDs empties list',()=>{
 const saved=['event-1'];const {context,elements}=harness(saved,[{id:'event-2',date:'2099-01-01',nom:'Unrelated',l:{nom:'Venue'}}]);
 assert.match(elements['fav-list'].innerHTML,/Aucune soirée gardée/);
 saved.splice(0);context.renderFavs();assert.match(elements['fav-hub-tabs'].innerHTML,/Mes soirées <small>0/);
});
test('DJ tab preserves its renderer and exposes both collections and counts',()=>{
 const {elements}=harness([],[],'dj');
 assert.equal(elements['fav-list'].innerHTML,'DJ collection');
 assert.match(elements['fav-hub-tabs'].innerHTML,/data-fav-panel="dj" aria-selected="true"/);
 assert.match(elements['fav-hub-tabs'].innerHTML,/data-fav-panel="soirees" aria-selected="false"/);
});
