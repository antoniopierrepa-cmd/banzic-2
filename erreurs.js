// Banzic · relevé automatique des erreurs : chaque erreur de l'appli sur un téléphone est notée dans Supabase (table « erreurs »),
// sans donnée personnelle (message, fichier, ligne, écran, navigateur). Au plus 15 par visite, sans doublon.
(function () {
  var vues = {}, n = 0;
  function appareil() { try { return (JSON.parse(localStorage.getItem('setly.appareil') || '""') || '').slice(0, 40); } catch (e) { return ''; } }
  function envoyer(message, source, ligne) {
    try {
      var C = window.BANZIC_DB; if (!C || !C.url || n >= 15) return;
      message = String(message || 'Erreur inconnue').slice(0, 500);
      var cle = message + '|' + source + '|' + ligne; if (vues[cle]) return; vues[cle] = 1; n++;
      var ecran = (document.querySelector('.tab.on') || {}).dataset; ecran = ecran && ecran.tab || '';
      var v = (document.querySelector('script[src^="app.js"]') || {}).src || '';
      fetch(C.url + '/rest/v1/erreurs', { method: 'POST', keepalive: true,
        headers: { apikey: C.cle, Authorization: 'Bearer ' + C.cle, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
        body: JSON.stringify({ message: message, source: String(source || '').replace(location.origin, '').slice(0, 200), ligne: ligne || null,
          ecran: ecran.slice(0, 40), version: (v.split('v=')[1] || '').slice(0, 40), navigateur: navigator.userAgent.slice(0, 200), appareil: appareil() || null }) }).catch(function () {});
    } catch (e) { /* le relevé ne doit jamais casser l'appli */ }
  }
  window.addEventListener('error', function (e) {
    if (e.target && e.target !== window) return; // une image ou un flyer qui ne charge pas : pas une erreur de l'appli
    envoyer(e.message, e.filename, e.lineno);
  });
  window.addEventListener('unhandledrejection', function (e) {
    var r = e.reason; if (typeof r === 'number' || (r && /Failed to fetch|NetworkError|Load failed/i.test(String(r.message || r)))) return; // réseau coupé : ignoré
    envoyer('Promesse : ' + (r && (r.message || r)), r && r.stack ? String(r.stack).split('\n')[1] : '', 0);
  });
  window.BANZIC_ERREUR = envoyer;
})();
