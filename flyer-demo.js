/* Homepage format samples requested for review; never added to the real event catalogue. */
(() => {
  const samples = [{"slug":"portrait-sunset","w":800,"h":1200,"title":"SUNSET HOUSE","format":"Vertical"},{"slug":"portrait-night","w":800,"h":1000,"title":"NIGHT GROOVE","format":"Vertical"},{"slug":"landscape-pool","w":1200,"h":675,"title":"POOL SESSION","format":"Horizontal"},{"slug":"landscape-after","w":1200,"h":800,"title":"AFTER HOURS","format":"Horizontal"},{"slug":"square-rooftop","w":1000,"h":1000,"title":"ROOFTOP VIBES","format":"Carré"},{"slug":"square-disco","w":1000,"h":1000,"title":"DEEP & DISCO","format":"Carré"}];
  window.BANZIC_FLYER_SAMPLES = samples.map(s => ({id: 'demo:' + s.slug, nom: s.title, demo: true, flyerUrl: 'img/demo-flyers/' + s.slug + '.svg', l: {nom: 'TEST · Visuel fictif', ville: ''}}));
  window.BANZIC_FLYER_DEMO = (saved, icon) => samples.map(s => '<article class="dc-slide" data-demo-flyer="1" role="button" tabindex="0" aria-label="Voir le flyer test"><span class="dc-media"><img src="img/demo-flyers/' + s.slug + '.svg" width="' + s.w + '" height="' + s.h + '" alt="Flyer de démonstration ' + s.title + '" loading="eager" decoding="async"></span><div class="dc-footer"><span class="dc-bas"><small>TEST · ' + s.format + '</small><b>' + s.title + '</b><span>Visuel fictif · aucune soirée réelle</span></span><button type="button" class="dc-bang' + (saved.includes('demo:' + s.slug) ? ' on' : '') + '" data-garder="demo:' + s.slug + '" aria-pressed="' + saved.includes('demo:' + s.slug) + '">' + icon + '<span>' + (saved.includes('demo:' + s.slug) ? 'Intéressé' : 'Banger intéressé') + '</span></button></div></article>').join('');
})();
document.addEventListener('click', e => {
 const card = e.target.closest('[data-demo-flyer]'); if (!card || e.target.closest('[data-garder]')) return;
 let dialog = document.querySelector('.flyer-test-dialog');
 if (!dialog) { dialog = document.createElement('dialog'); dialog.className = 'flyer-test-dialog'; document.body.appendChild(dialog); }
 dialog.textContent = '';
 const title = document.createElement('h2'); title.textContent = card.querySelector('.dc-bas b').textContent;
 const info = document.createElement('p'); info.textContent = 'Flyer de test. Aucune soirée réelle : adresse, date, DJ et billetterie ne sont pas renseignés. Les vraies soirées ouvrent leur fiche complète.';
 const close = document.createElement('button'); close.textContent = 'Fermer'; close.onclick = () => dialog.close();
 dialog.append(title,info,close); dialog.showModal();
});
document.addEventListener('keydown', e => { const c=e.target.closest('[data-demo-flyer]'); if(c && (e.key==='Enter'||e.key===' ' ) && e.target===c) {e.preventDefault();c.click();} });
