/* Pop-up « Deviens membre » : apparaît de temps en temps quand on clique
   dans l'appli sans compte. Une croix permet de la fermer. */
(function () {
  var MODE_TEST = false;        // true = ESSAI : apparaît vite, même avec un compte
  var CLICS_AVANT_1ER = MODE_TEST ? 2 : 6;   // normal : après 6 clics
  var CLICS_ENTRE = MODE_TEST ? 4 : 10;      // normal : puis tous les 10 clics
  var DELAI_MIN = MODE_TEST ? 8000 : 40000;  // normal : 40 s minimum entre deux

  var clics = 0, prochain = CLICS_AVANT_1ER, dernier = 0;

  function aUnCompte() {
    try { return !!JSON.parse(localStorage.getItem('setly.compte')) || !!JSON.parse(localStorage.getItem('setly.profil')); } catch (e) { return false; }
  }
  function splashVisible() {
    var s = document.getElementById('splash');
    return s && s.offsetParent !== null && getComputedStyle(s).display !== 'none' && getComputedStyle(s).visibility !== 'hidden';
  }

  var calque = document.createElement('div');
  calque.className = 'pm-calque';
  calque.hidden = true;
  calque.innerHTML =
    '<div class="pm-carte" role="dialog" aria-modal="true" aria-labelledby="pm-titre">' +
      '<button class="pm-x" type="button" aria-label="Fermer">×</button>' +
      '<svg class="pm-logo" viewBox="0 0 120 120" aria-hidden="true">' +
        '<circle cx="60" cy="60" r="50" fill="none" stroke="#FF8A3D" stroke-width="8" stroke-dasharray="220 45" stroke-linecap="round"/>' +
        '<circle cx="60" cy="60" r="30" fill="none" stroke="#FFB27A" stroke-width="8" stroke-dasharray="130 34" stroke-linecap="round"/>' +
        '<circle cx="60" cy="60" r="12" fill="#FF8A3D"/></svg>' +
      '<h2 id="pm-titre">Deviens membre Banzic</h2>' +
      '<p>Crée ton compte gratuit et débloque toute l\'appli&nbsp;:</p>' +
      '<ul><li>Tes DJ favoris et leurs alertes</li><li>L\'agenda complet de la saison</li><li>La carte en direct, partout</li></ul>' +
      '<button class="pm-go" type="button">Je crée mon compte</button>' +
      '<button class="pm-plus-tard" type="button">Plus tard</button>' +
    '</div>';

  function fermer() { calque.hidden = true; }
  function ouvrir() { calque.hidden = false; dernier = Date.now(); }

  calque.addEventListener('click', function (e) {
    if (e.target === calque || e.target.closest('.pm-x') || e.target.closest('.pm-plus-tard')) { fermer(); return; }
    if (e.target.closest('.pm-go')) {
      fermer();
      var onglet = document.querySelector('.tab[data-tab="profil"]');
      if (onglet) onglet.click();
    }
  });

  document.addEventListener('click', function (e) {
    if (!calque.hidden || calque.contains(e.target) || e.target.closest('.rg-cale') || e.target.closest('#screen-profil')) return;
    if ((!MODE_TEST && aUnCompte()) || splashVisible()) return;
    clics++;
    if (clics >= prochain && Date.now() - dernier > DELAI_MIN) {
      prochain = clics + CLICS_ENTRE;
      setTimeout(ouvrir, 350);
    }
  }, true);

  function monter() { (document.querySelector('.app') || document.body).appendChild(calque); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', monter); else monter();
})();
