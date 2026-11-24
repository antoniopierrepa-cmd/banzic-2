// Banzic · MODE TEST. Ne fait rien dans le vrai Banzic.
// S'active seulement si l'adresse contient « test » (ex. banzic-test.vercel.app) ou avec ?banzic-test=1 dans l'adresse.
// En mode test : faux comptes autour de Hyères, données de chaque compte rangées à part (le vrai profil du téléphone n'est jamais touché),
// position simulée, liste de tests et bilan. Même base que le vrai Banzic, mais ce que publient les faux comptes est caché aux vrais utilisateurs.
(function () {
  var LS = window.localStorage, P = Storage.prototype;
  var get0 = P.getItem, set0 = P.setItem, del0 = P.removeItem;
  var q = new URLSearchParams(location.search);
  try {
    if (q.get('banzic-test') === '1') sessionStorage.setItem('banzic-test', '1');
    if (q.get('banzic-test') === '0') sessionStorage.removeItem('banzic-test');
  } catch (e) { /* */ }
  var actif = /test/i.test(location.hostname) || (function () { try { return sessionStorage.getItem('banzic-test') === '1'; } catch (e) { return false; } })();
  // Les faux comptes (9 Bangers, 3 DJ) autour de Hyères
  var COMPTES = [
    ['lea', 'Léa M.', 'banger', 'Hyères centre', 43.1204, 6.1286, 'f01', ['House', 'Techno']],
    ['karim', 'Karim B.', 'banger', 'La Londe-les-Maures', 43.1386, 6.2340, 'h01', ['Afro house', 'House']],
    ['sofia', 'Sofia R.', 'banger', 'Toulon', 43.1242, 5.9280, 'f02', ['Techno', 'Melodic']],
    ['mathis', 'Mathis D.', 'banger', 'Carqueiranne', 43.0945, 6.0737, 'h02', ['EDM', 'Tech house']],
    ['ines', 'Inès P.', 'banger', 'Giens', 43.0397, 6.1356, 'f03', ['Disco & funk', 'House']],
    ['hugo', 'Hugo L.', 'banger', 'La Crau', 43.1500, 6.0730, 'h03', ['Techno']],
    ['chloe', 'Chloé V.', 'banger', 'Le Pradet', 43.1060, 6.0230, 'f04', ['Latino', 'EDM']],
    ['yanis', 'Yanis T.', 'banger', 'La Garde', 43.1247, 6.0108, 'h04', ['Tech house', 'Afro house']],
    ['manon', 'Manon G.', 'banger', 'Bormes-les-Mimosas', 43.1508, 6.3417, 'f05', ['Melodic', 'Trance']],
    ['tnova', 'TEST Nova', 'dj', 'Toulon', 43.1180, 5.9350, 'f06', ['Techno', 'Melodic'], 'pro'],
    ['tkalypso', 'TEST Kalypso', 'dj', 'Le Lavandou', 43.1374, 6.3681, 'h05', ['Afro house', 'House'], 'live'],
    ['tmistral', 'TEST Mistral', 'dj', 'Hyères', 43.1190, 6.1310, 'h01', ['Tech house', 'Disco & funk'], 'live']
  ].map(function (c) { return { id: c[0], nom: c[1], type: c[2], ville: c[3], lat: c[4], lng: c[5], avatar: c[6], styles: c[7], formule: c[8] }; });

  // « DJ Nova » : ancien nom d'un faux DJ (test du 24/11), gardé caché pour les vrais utilisateurs
  window.BANZIC_TEST = { actif: actif, noms: COMPTES.map(function (c) { return c.nom; }).concat(['DJ Nova']) };
  if (!actif) return;

  var cle = function (k) { return 'banzictest.' + k; };
  var lire = function (k, d) { try { var v = get0.call(LS, cle(k)); return v ? JSON.parse(v) : d; } catch (e) { return d; } };
  var ecrire = function (k, v) { try { set0.call(LS, cle(k), JSON.stringify(v)); } catch (e) { /* */ } };
  var idCompte = lire('compte', 'lea');
  var compte = COMPTES.filter(function (c) { return c.id === idCompte; })[0] || COMPTES[0];

  // 3. Chaque faux compte range ses données à part : « setly.x » devient « banzictest.<compte>.x »
  var ns = function (k) { return typeof k === 'string' && k.indexOf('setly.') === 0 ? cle(compte.id + '.' + k.slice(6)) : k; };
  P.getItem = function (k) { return get0.call(this, this === LS ? ns(k) : k); };
  P.setItem = function (k, v) { return set0.call(this, this === LS ? ns(k) : k, v); };
  P.removeItem = function (k) { return del0.call(this, this === LS ? ns(k) : k); };

  // Premier passage sur un compte : son profil est déjà rempli (pas d'inscription à refaire)
  var s = function (k, v) { LS.setItem('setly.' + k, JSON.stringify(v)); };
  // Chaque faux compte a déjà son compte créé (connexion simulée, aucun mail envoyé)
  if (!LS.getItem('setly.compte')) s('compte', { fournisseur: 'email', email: compte.id + '@test.banzic.app', date: new Date().toISOString().slice(0, 10) });
  if (!LS.getItem('setly.profil')) {
    LS.setItem('setly.depart', '2026-11-11');
    s('appareil', 'test-' + compte.id + '-0000');
    s('typeCompte', compte.type);
    s('profil', { pseudo: compte.nom, styles: compte.styles, langue: 'fr', ville: compte.ville, destination: 'autre', destinationAutre: compte.ville,
      statut: 'sur-place', du: '', au: '', suivies: [], notifs: true, geoloc: true, presence: true, classement: true,
      emailInfos: false, alertePepites: false, alerteDj: false, emailContact: '', avatar: 'av:' + compte.avatar, photo: '' });
    if (compte.type === 'dj') s('djPro', { id: 'moi', formule: compte.formule, liens: {}, annonces: [], nom: compte.nom, styles: compte.styles, ville: compte.ville,
      residence: null, confirmes: 0, contestes: 0, expires: 0, avis: { top: 0, bien: 0, bof: 0 }, mien: true });
  }

  // 4. Position simulée : le compte est « chez lui » (sauf si on choisit sa vraie position)
  var vraiePos = lire('vraiePos', false);
  if (!vraiePos && navigator.geolocation) {
    var pos = function () { return { coords: { latitude: compte.lat + (Math.random() - 0.5) * 0.0004, longitude: compte.lng + (Math.random() - 0.5) * 0.0004, accuracy: 15 }, timestamp: Date.now() }; };
    try {
      Object.defineProperty(navigator, 'geolocation', { configurable: true, value: {
        getCurrentPosition: function (ok) { setTimeout(function () { ok(pos()); }, 200); },
        watchPosition: function (ok) { var t = setInterval(function () { ok(pos()); }, 5000); setTimeout(function () { ok(pos()); }, 200); return t; },
        clearWatch: function (t) { clearInterval(t); } } });
    } catch (e) { /* */ }
  }

  // 5. La liste des tests (ce qu'on a décidé pour les Bangers et les DJ)
  var TESTS = [
    ['b1', 'Banger', 'Signaler une soirée sur place'],
    ['b2', 'Banger', 'La soirée passe « Validée » après 3 confirmations (3 comptes différents)'],
    ['b3', 'Banger', 'Avec 2 confirmations, elle reste « En attente »'],
    ['b4', 'Banger', 'Confirmer le DJ du line-up'],
    ['b5', 'Banger', 'Marquer une soirée « Intéressé » et la retrouver dans Mes soirées'],
    ['b6', 'Banger', 'Recevoir le rappel d\'une soirée « Intéressé »'],
    ['b7', 'Banger', 'Banguer un DJ (casque) et le voir compté sur un autre compte'],
    ['d1', 'DJ', 'Créer sa fiche DJ avec son matériel'],
    ['d2', 'DJ', 'Trouver un DJ dans l\'annuaire par région'],
    ['d3', 'DJ', 'Annoncer une date et la voir dans l\'Agenda avec le filtre DJ'],
    ['d4', 'DJ', 'Annoncer une soirée qui existe déjà : reliée à la fiche existante, sans doublon'],
    ['d5', 'DJ', 'Recevoir la notification quand un Banger bangue ou commente'],
    ['g1', 'Général', 'La carte « Autour de moi » montre ce qu\'il y a autour de Hyères'],
    ['g2', 'Général', 'Changer de compte sans perdre les données de chaque compte']
  ];
  var res = lire('resultats', {});
  var esc = function (x) { return String(x == null ? '' : x).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var compteur = function () { var n = { ok: 0, ko: 0, af: 0 }; TESTS.forEach(function (t) { var r = res[t[0]]; n[r && r.v === 'ok' ? 'ok' : r && r.v === 'ko' ? 'ko' : 'af']++; }); return n; };

  // 6. L'interface du mode test : bandeau, comptes, tests, bilan
  var css = '#bzt-cadre{position:fixed;inset:0;border:3px solid #f5b400;pointer-events:none;z-index:99998}'
    + '#bzt-pill{position:fixed;top:calc(env(safe-area-inset-top,0px) + 4px);left:50%;transform:translateX(-50%);z-index:99999;background:#f5b400;color:#3a2a00;font:700 11px/1 system-ui,sans-serif;letter-spacing:.04em;border:0;border-radius:999px;padding:6px 12px;box-shadow:0 2px 8px rgba(0,0,0,.35)}'
    + '#bzt{position:fixed;inset:0;z-index:100000;background:#0d0a21;color:#f6f3ff;font:14px/1.45 system-ui,sans-serif;overflow:auto;padding:calc(env(safe-area-inset-top,0px) + 12px) 14px 40px}'
    + '#bzt h2{font-size:18px;margin:6px 0 4px}#bzt .bzt-sous{color:#bfb3d8;font-size:12px;margin:0 0 12px}'
    + '#bzt .bzt-ong{display:flex;gap:6px;margin:10px 0 14px}#bzt .bzt-ong button{flex:1;background:#211336;color:#f6f3ff;border:1px solid #302544;border-radius:10px;padding:8px}#bzt .bzt-ong button.on{background:#f5b400;color:#3a2a00;border-color:#f5b400;font-weight:700}'
    + '#bzt .bzt-l{display:flex;align-items:center;gap:10px;padding:10px;border:1px solid #302544;border-radius:12px;margin-bottom:6px;background:#160f2b;width:100%;color:inherit;text-align:left}#bzt .bzt-l.on{border-color:#f5b400}'
    + '#bzt .bzt-l img{width:34px;height:34px;border-radius:50%;object-fit:cover}#bzt small{color:#bfb3d8}'
    + '#bzt .bzt-t{border:1px solid #302544;border-radius:12px;padding:10px;margin-bottom:8px;background:#160f2b}#bzt .bzt-t p{margin:0 0 8px}'
    + '#bzt .bzt-b{display:flex;gap:6px}#bzt .bzt-b button{border:1px solid #302544;background:#211336;color:#f6f3ff;border-radius:999px;padding:5px 10px;font-size:12px}'
    + '#bzt .bzt-b button.ok{background:#1d6b3e;border-color:#1d6b3e}#bzt .bzt-b button.ko{background:#8a2430;border-color:#8a2430}'
    + '#bzt textarea{width:100%;box-sizing:border-box;margin-top:8px;background:#0d0a21;color:#f6f3ff;border:1px solid #302544;border-radius:8px;padding:6px;font:inherit;font-size:12px}'
    + '#bzt .bzt-n{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:8px 0 14px;text-align:center}#bzt .bzt-n div{border-radius:12px;padding:10px;background:#211336}#bzt .bzt-n b{display:block;font-size:22px}'
    + '#bzt .bzt-gros{width:100%;background:#ff8035;color:#fff;border:0;border-radius:12px;padding:12px;font-weight:700;margin-top:10px}#bzt .bzt-fermer{float:right;background:none;border:0;color:#f6f3ff;font-size:24px}';
  var onglet = 'comptes';
  function rendre() {
    var el = document.getElementById('bzt'); if (!el) return;
    var h = '<button class="bzt-fermer" data-bzt-fermer aria-label="Fermer">×</button><h2>Banzic test</h2>'
      + '<p class="bzt-sous">' + 'Ce que publient les faux comptes est invisible pour les vrais utilisateurs.' + '</p>'
      + '<div class="bzt-ong">' + [['comptes', 'Comptes'], ['tests', 'Tests'], ['bilan', 'Bilan']].map(function (o) { return '<button data-bzt-ong="' + o[0] + '" class="' + (onglet === o[0] ? 'on' : '') + '">' + o[1] + '</button>'; }).join('') + '</div>';
    if (onglet === 'comptes') {
      h += '<p class="bzt-sous">Je joue en tant que… (chaque compte garde ses propres données)</p>' + COMPTES.map(function (c) {
        return '<button class="bzt-l ' + (c.id === compte.id ? 'on' : '') + '" data-bzt-compte="' + c.id + '"><img src="avatars-banzic/' + c.avatar + '.jpg" alt=""><span><b>' + esc(c.nom) + '</b><br><small>' + (c.type === 'dj' ? (c.formule === 'pro' ? 'DJ Pro' : 'DJ') : 'Banger') + ' · ' + esc(c.ville) + '</small></span></button>'; }).join('')
        + '<label class="bzt-l"><input type="checkbox" data-bzt-vraiepos ' + (vraiePos ? 'checked' : '') + '> Utiliser ma vraie position (sinon : la ville du compte)</label>';
    } else if (onglet === 'tests') {
      h += TESTS.map(function (t, i) { var r = res[t[0]] || {};
        return '<div class="bzt-t"><p><small>' + (i + 1) + '/' + TESTS.length + ' · ' + t[1] + '</small><br>' + esc(t[2]) + '</p><div class="bzt-b">'
          + '<button data-bzt-v="ok" data-bzt-id="' + t[0] + '" class="' + (r.v === 'ok' ? 'ok' : '') + '">Ça marche</button>'
          + '<button data-bzt-v="ko" data-bzt-id="' + t[0] + '" class="' + (r.v === 'ko' ? 'ko' : '') + '">Problème</button></div>'
          + '<textarea rows="2" placeholder="Note (ce qui s\'est passé)" data-bzt-note="' + t[0] + '">' + esc(r.note || '') + '</textarea></div>'; }).join('');
    } else {
      var n = compteur();
      h += '<div class="bzt-n"><div><b>' + n.ok + '</b>OK</div><div><b>' + n.ko + '</b>Problèmes</div><div><b>' + n.af + '</b>À faire</div></div>'
        + TESTS.map(function (t) { var r = res[t[0]] || {}; return '<div class="bzt-l"><span style="flex:1">' + esc(t[2]) + (r.note ? '<br><small>' + esc(r.note) + '</small>' : '') + '</span><b>' + (r.v === 'ok' ? 'OK' : r.v === 'ko' ? 'Problème' : 'À faire') + '</b></div>'; }).join('')
        + '<p class="bzt-sous" id="bzt-base">Dans la base de test : …</p><button class="bzt-gros" data-bzt-envoyer>Envoyer le bilan</button>'
        + '<button class="bzt-gros" style="background:#211336" data-bzt-raz>Tout remettre à zéro</button>';
      chargerBase();
    }
    el.innerHTML = h;
  }
  function chargerBase() {
    var B = window.BANZIC_DB, p0 = function (t) { var p = document.getElementById('bzt-base'); if (p) p.textContent = t; };
    if (!B || !B.url) { setTimeout(function () { p0('Base injoignable.'); }); return; }
    var H = { headers: { apikey: B.cle, Authorization: 'Bearer ' + B.cle } }, noms = window.BANZIC_TEST.noms;
    var j = function (c) { return fetch(B.url + '/rest/v1/' + c, H).then(function (r) { return r.ok ? r.json() : []; }).catch(function () { return []; }); };
    Promise.all([j('declarations?select=dj_nom,conf'), j('spots?select=par,conf'), j('interactions?select=appareil&appareil=like.test-*')]).then(function (r) {
      var d = r[0].filter(function (x) { return noms.indexOf(x.dj_nom) >= 0; }), sp = r[1].filter(function (x) { return noms.indexOf(x.par) >= 0; });
      var conf = d.concat(sp).reduce(function (n, x) { return n + (x.conf || 0); }, 0);
      p0('Publié par les faux comptes : ' + d.length + ' dates de DJ, ' + sp.length + ' soirées signalées, ' + conf + ' confirmations, ' + r[2].length + ' casques et commentaires.'); });
  }
  function texteBilan() { var n = compteur(), p = document.getElementById('bzt-base');
    return 'Bilan Banzic test du ' + new Date().toLocaleString('fr-FR') + '\n' + n.ok + ' OK · ' + n.ko + ' problèmes · ' + n.af + ' à faire\n\n'
      + TESTS.map(function (t) { var r = res[t[0]] || {}; return (r.v === 'ok' ? '✅ ' : r.v === 'ko' ? '❌ ' : '⏳ ') + t[2] + (r.note ? '\n   → ' + r.note : ''); }).join('\n')
      + (p ? '\n\n' + p.textContent : ''); }
  function ouvrir() { var el = document.getElementById('bzt'); if (!el) { el = document.createElement('div'); el.id = 'bzt'; document.body.appendChild(el); } el.hidden = false; rendre(); }
  function demarrer() {
    var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    var cadre = document.createElement('div'); cadre.id = 'bzt-cadre'; document.body.appendChild(cadre);
    var pill = document.createElement('button'); pill.id = 'bzt-pill'; pill.type = 'button'; pill.textContent = 'TEST · ' + compte.nom; pill.onclick = ouvrir; document.body.appendChild(pill);
    document.addEventListener('click', function (e) {
      var t = e.target.closest && e.target.closest('#bzt [data-bzt-fermer],#bzt [data-bzt-ong],#bzt [data-bzt-compte],#bzt [data-bzt-v],#bzt [data-bzt-envoyer],#bzt [data-bzt-raz]'); if (!t) return;
      if (t.dataset.bztFermer != null) { document.getElementById('bzt').hidden = true; return; }
      if (t.dataset.bztOng) { onglet = t.dataset.bztOng; rendre(); return; }
      if (t.dataset.bztCompte) { if (t.dataset.bztCompte !== compte.id) { ecrire('compte', t.dataset.bztCompte); location.reload(); } return; }
      if (t.dataset.bztV) { var id = t.dataset.bztId, r = res[id] = res[id] || {}; r.v = r.v === t.dataset.bztV ? null : t.dataset.bztV; r.par = compte.nom; r.t = Date.now(); ecrire('resultats', res); rendre(); return; }
      if (t.dataset.bztEnvoyer != null) { var txt = texteBilan();
        if (navigator.share) navigator.share({ title: 'Bilan Banzic test', text: txt }).catch(function () {});
        else if (navigator.clipboard) navigator.clipboard.writeText(txt).then(function () { alert('Bilan copié : colle-le où tu veux'); }); return; }
      if (t.dataset.bztRaz != null && confirm('Effacer les résultats des tests et les données des 12 faux comptes sur ce téléphone ?')) {
        Object.keys(LS).filter(function (k) { return k.indexOf('banzictest.') === 0; }).forEach(function (k) { del0.call(LS, k); }); location.reload(); }
    });
    document.addEventListener('input', function (e) { var id = e.target.dataset && e.target.dataset.bztNote; if (!id) return; (res[id] = res[id] || {}).note = e.target.value.slice(0, 500); ecrire('resultats', res); });
    document.addEventListener('change', function (e) { if (e.target.dataset && e.target.dataset.bztVraiepos != null) { ecrire('vraiePos', e.target.checked); location.reload(); } });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', demarrer); else demarrer();
})();
