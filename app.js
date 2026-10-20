(function () {
  'use strict';

  const D = window.DEMO;

  // Heure réelle (le programme de démo du jeudi est rejoué à l'heure du jour).
  // Pour une démo à une heure précise : index.html?heure=01:40
  function heureReelle() {
    let h, m;
    const forcee = new URLSearchParams(location.search).get('heure');
    if (forcee && /^\d{1,2}:\d{2}$/.test(forcee)) [h, m] = forcee.split(':').map(Number);
    else { const d = new Date(); h = d.getHours(); m = d.getMinutes(); }
    return (h < 12 ? h + 24 : h) * 60 + m;
  }
  const $ = (s) => document.querySelector(s);

  // ---------- Temps : minutes depuis le jeudi 00:00. Avant midi = après minuit (même nuit).
  const toMin = (hhmm) => {
    const [h, m] = hhmm.split(':').map(Number);
    return (h < 12 ? h + 24 : h) * 60 + m;
  };
  const fmt = (min) => {
    const m = ((min % 1440) + 1440) % 1440;
    return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
  };
  const dans = (min) => {
    if (min < 60) return min + ' min';
    const h = Math.floor(min / 60), r = min % 60;
    return h + ' h' + (r ? ' ' + String(r).padStart(2, '0') : '');
  };

  // ---------- Stockage local (favoris, confirmations)
  const store = {
    get(k, d) { try { const v = localStorage.getItem('setly.' + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('setly.' + k, JSON.stringify(v)); } catch (e) { /* mode privé */ } }
  };

  // ---------- Langue de l'interface (i18n.js). Une clé absente retombe sur le français.
  const LANGUES = window.LANGUES || [{ id: 'fr', nom: 'Français' }];
  const I18N = window.I18N || { fr: {} };
  const langueDetectee = () => { const n = (navigator.language || 'fr').slice(0, 2); return I18N[n] ? n : 'fr'; };
  let LANG = store.get('langue', null) || (store.get('profil', null) || {}).langue || langueDetectee();
  if (!I18N[LANG]) LANG = 'fr';
  const T = (k, v) => {
    let s = (I18N[LANG] && I18N[LANG][k]) || I18N.fr[k] || k;
    if (v) Object.keys(v).forEach((x) => { s = s.replace('{' + x + '}', v[x]); });
    return s;
  };
  const MOIS_EL = ['Ιανουάριος', 'Φεβρουάριος', 'Μάρτιος', 'Απρίλιος', 'Μάιος', 'Ιούνιος', 'Ιούλιος', 'Αύγουστος', 'Σεπτέμβριος', 'Οκτώβριος', 'Νοέμβριος', 'Δεκέμβριος'];
  const moisNom = (k) => { if (LANG === 'el') return MOIS_EL[k]; try { return new Intl.DateTimeFormat(LANG, { month: 'long' }).format(new Date(2026, k, 15)); } catch (e) { return ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'][k]; } };
  const Maj = (x) => x.charAt(0).toUpperCase() + x.slice(1);

  // ---------- Données préparées
  const lieux = {};
  D.lieux.forEach((l) => { lieux[l.id] = l; });
  const soirees = {};
  D.soirees.forEach((s) => { soirees[s.lieu] = { ...s, d: toMin(s.debut), f: toMin(s.fin) }; });
  const passages = D.passages.map((p, i) => ({ ...p, id: i, d: toMin(p.debut), f: toMin(p.fin), c: p.constate ? toMin(p.constate) : null }));
  const passageParId = (id) => passages.find((p) => p.id === id);

  // Photos des lieux (CDN Ibiza Spotlight pour la démo). En cas d'échec, un dégradé prend le relais.
  const photoUrl = (l, style) => l && l.photo ? D.photoBase + (style || 'auto_1500_width') + '/public/' + l.photo : '';
  // Ordre d'essai : ta photo locale (dossier photos/, nommée d'après l'identifiant du lieu, ex. pacha.jpg),
  // puis la photo en ligne, puis un dégradé.
  window.photoSuivante = (img) => {
    const essais = JSON.parse(img.dataset.essais || '[]');
    const suiv = essais.shift();
    if (suiv) { img.dataset.essais = JSON.stringify(essais); img.src = suiv; return; }
    const v = document.createElement('span'); v.className = img.className + ' photo-vide'; img.replaceWith(v);
  };
  const photo = (l, cls, style) => {
    if (!l) return `<span class="${cls} photo-vide"></span>`;
    const essais = [];
    if (window.PHOTOS_LIEUX && window.PHOTOS_LIEUX[l.id]) essais.push(window.PHOTOS_LIEUX[l.id].f);
    essais.push(artLieu(l)); // sinon une illustration du lieu
    return `<img class="${cls}" src="photos/${l.id}.jpg" alt="${esc(l.nom)}" loading="lazy" data-essais='${JSON.stringify(essais)}' onerror="photoSuivante(this)">`;
  };

  // Cartes visuelles communes à toutes les pages (même style que l'accueil) : couleur, badge, gros nom, infos dessous
  const vCarte = ({ tag = 'button', attr = '', c = '#3D8BFF', img = '', badge = '', type = '', nom = '', lieu = '', bas = [], extra = '' }) =>
    `<${tag} class="dc-carte vc" ${attr} style="--mc:${c}"><span class="dc-art"${img ? ` style="--photo:url('${img}')"` : ''}>${badge ? `<span class="dc-badge">${badge}</span>` : ''}${extra}
      ${type ? `<span class="dc-type">${type}</span>` : ''}<b class="dc-nom">${nom}</b>${lieu ? `<span class="dc-lieu">${lieu}</span>` : ''}</span>
      ${bas.filter(Boolean).length ? `<span class="dc-bas">${bas.filter(Boolean).map((b) => `<small>${b}</small>`).join('')}</span>` : ''}</${tag}>`;
  const rangCartes = (cartes) => cartes.length ? `<div class="acc-rang dc-rang">${cartes.join('')}</div>` : '';
  // Illustration originale d'un lieu sans photo : dessinée selon son type (club, plage, bar, rooftop), couleurs tirées de son nom
  function artLieu(l) {
    const nom = (l && l.nom) || 'Lieu'; let g = 7; for (const ch of nom) g = (g * 31 + ch.charCodeAt(0)) >>> 0;
    const r = () => { g = (g * 1103515245 + 12345) >>> 0; return g / 4294967296; };
    const h1 = Math.floor(r() * 360), h2 = (h1 + 140 + Math.floor(r() * 80)) % 360;
    const typ = /plage|beach/i.test((l && (l.type + ' ' + (l.style || ''))) || '') ? 'plage' : /rooftop/i.test(l && l.type || '') ? 'rooftop' : /bar|resto|restaurant|lounge/i.test((l && (l.type + ' ' + (l.style || ''))) || '') ? 'bar' : 'club';
    const ini = nom.replace(/[^A-Za-zÀ-ÿ0-9 ]/g, '').split(/\s+/).filter((w) => w && !/^(le|la|les|l|the|club|de|du)$/i.test(w)).map((w) => w[0]).join('').slice(0, 3).toUpperCase() || nom[0];
    let foule = ''; for (let i = 0; i < 26; i++) { const x = i * 19 + r() * 8, rr = 9 + r() * 6; foule += `<circle cx='${x.toFixed(0)}' cy='${(318 - r() * 10).toFixed(0)}' r='${rr.toFixed(0)}' fill='#05040A'/><rect x='${(x - rr).toFixed(0)}' y='${(316 - r() * 8).toFixed(0)}' width='${(rr * 2).toFixed(0)}' height='30' rx='8' fill='#05040A'/>`; }
    let svg;
    if (typ === 'plage') {
      svg = `<defs><linearGradient id='c' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='hsl(${h1},70%,55%)'/><stop offset='.55' stop-color='hsl(28,95%,62%)'/><stop offset='.56' stop-color='hsl(195,70%,38%)'/><stop offset='1' stop-color='hsl(200,75%,22%)'/></linearGradient></defs>
        <rect width='480' height='320' fill='url(#c)'/><circle cx='${(150 + r() * 180).toFixed(0)}' cy='170' r='46' fill='hsl(45,100%,72%)' opacity='.95'/>
        <rect y='176' width='480' height='3' fill='hsl(40,100%,80%)' opacity='.6'/><rect y='196' width='480' height='2' fill='hsl(40,100%,80%)' opacity='.35'/>
        <path d='M0 270 Q120 248 240 262 T480 255 L480 320 L0 320Z' fill='hsl(38,60%,72%)'/>
        <path d='M70 270 C72 220 66 170 84 120' stroke='#1A0F0A' stroke-width='9' fill='none'/><path d='M84 120 q-50 -10 -78 22 M84 120 q-20 -40 -66 -38 M84 120 q30 -40 76 -30 M84 120 q50 0 70 34 M84 120 q-6 -46 10 -66' stroke='#1A0F0A' stroke-width='10' fill='none' stroke-linecap='round'/>
        <path d='M330 268 L330 210' stroke='#2A1A12' stroke-width='4'/><path d='M282 214 Q330 176 378 214Z' fill='hsl(${h2},80%,55%)'/>`;
    } else if (typ === 'rooftop') {
      let tours = ''; let x = 0; while (x < 480) { const w = 26 + r() * 40, hh = 60 + r() * 120; tours += `<rect x='${x.toFixed(0)}' y='${(300 - hh).toFixed(0)}' width='${w.toFixed(0)}' height='${hh.toFixed(0)}' fill='hsl(${h1},30%,${(10 + r() * 8).toFixed(0)}%)'/>`; x += w + 2; }
      svg = `<defs><linearGradient id='c' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='hsl(${h1},60%,22%)'/><stop offset='1' stop-color='hsl(${h2},80%,55%)'/></linearGradient></defs><rect width='480' height='320' fill='url(#c)'/>${tours}<rect y='290' width='480' height='30' fill='#0A0712'/>${foule}`;
    } else if (typ === 'bar') {
      svg = `<defs><filter id='n'><feGaussianBlur stdDeviation='5'/></filter></defs><rect width='480' height='320' fill='hsl(${h1},35%,9%)'/>
        <text x='240' y='160' text-anchor='middle' font-family='Arial Black,Arial' font-weight='900' font-size='92' fill='hsl(${h1},100%,62%)' filter='url(#n)'>${ini}</text>
        <text x='240' y='160' text-anchor='middle' font-family='Arial Black,Arial' font-weight='900' font-size='92' fill='none' stroke='hsl(${h1},100%,85%)' stroke-width='3'>${ini}</text>
        <rect y='230' width='480' height='90' fill='hsl(${h2},40%,16%)'/><rect y='226' width='480' height='8' fill='hsl(${h2},70%,45%)'/>${foule}`;
    } else {
      let lasers = ''; for (let i = 0; i < 7; i++) { const x = 40 + r() * 400, hh = i % 2 ? h1 : h2; lasers += `<path d='M240 30 L${(x - 14).toFixed(0)} 330 L${(x + 14).toFixed(0)} 330Z' fill='hsl(${hh},100%,60%)' opacity='.28'/>`; }
      svg = `<defs><radialGradient id='c' cx='50%' cy='0%' r='90%'><stop offset='0' stop-color='hsl(${h1},70%,30%)'/><stop offset='1' stop-color='#07050E'/></radialGradient></defs><rect width='480' height='320' fill='url(#c)'/>${lasers}
        <circle cx='240' cy='42' r='24' fill='hsl(${h2},30%,80%)'/><path d='M216 42 H264 M240 18 V66 M222 28 H258 M222 56 H258' stroke='hsl(${h2},20%,55%)' stroke-width='2'/>${foule}`;
    }
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 480 320'>${svg}</svg>`).replace(/'/g, '%27');
  }
  const creditLieu = (l) => { const p = window.PHOTOS_LIEUX && l && window.PHOTOS_LIEUX[l.id];
    return `<span class="hero-credit">${p ? (p.libre ? `Photo : ${esc(p.auteur || 'Wikimedia Commons')} · ${esc(p.licence)} · Wikimedia Commons` : `Photo : ${esc(p.auteur)} (prototype)`) : 'Illustration'}</span>`; };
  const imgLieu = (l) => !l ? '' : (window.PHOTOS_LIEUX && window.PHOTOS_LIEUX[l.id]) ? window.PHOTOS_LIEUX[l.id].f : artLieu(l);
  const COUL_TYPE_LIEU = { club: '#FF8A3D', plage: '#3DD6C6' };

  // Signalements : un utilisateur signale le DJ qui joue dans un lieu. Le passage est créé tout de suite,
  // visible pour lui (en attente), et diffusé quand 2 autres personnes sur place l'ont confirmé.
  const SIGNALEMENTS = (function () { try { return JSON.parse(localStorage.getItem('setly.signalements')) || []; } catch (e) { return []; } })();
  function ajouterPassageSignale(sg) {
    passages.push({ id: sg.id, lieu: sg.lieu, salle: 'Signalé par les Bangers', dj: sg.dj, d: sg.t, f: sg.t + 120,
      debut: fmtMin(sg.t), fin: fmtMin(sg.t + 120), c: null, confirmations: 0, communaute: true });
  }
  function fmtMin(min) { const m = ((min % 1440) + 1440) % 1440; return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); }
  SIGNALEMENTS.forEach(ajouterPassageSignale);

  const state = {
    t: heureReelle(),
    tab: 'live',
    filtre: 'tout',
    q: '',
    favs: store.get('favs', ['Black Coffee', 'Purple Disco Machine', 'Sven Väth']),
    autres: store.get('autres', {}),
    mesAvis: store.get('mesAvis', {}),
    autresAvis: store.get('autresAvis', {}),
    signaler: false,
    vueCarte: 'carte',
    voted: store.get('voted', {}),
    lieuOuvert: null
  };

  // Validation façon Waze : la confirmation d'un utilisateur est enregistrée tout de suite et visible
  // pour lui, mais elle n'est diffusée aux autres qu'une fois que 2 autres personnes ont confirmé.
  const SEUIL_AUTRES = 2;
  const autresConf = (p) => (p.confirmations || 0) + (state.autres[p.id] || 0);
  const monVote = (p) => !!state.voted[p.id];
  const monVoteValide = (p) => monVote(p) && autresConf(p) >= SEUIL_AUTRES;
  const confirmations = (p) => autresConf(p) + (monVoteValide(p) ? 1 : 0);

  // Avis sur un set : « À ne pas rater », « Sympa », « Bof ». Le résumé n'est public qu'à partir de 3 avis,
  // et l'avis d'un utilisateur compte dans le public dès que 2 autres personnes ont donné le leur.
  const AVIS = [['top', 'À ne pas rater'], ['bien', 'Sympa'], ['bof', 'Bof']];
  const SEUIL_AVIS = 3;
  function resumeAvis(p) {
    const base = { top: 0, bien: 0, bof: 0, ...(p.avis || {}), ...(state.autresAvis[p.id] || {}) };
    const autresTotal = base.top + base.bien + base.bof;
    const mien = state.mesAvis[p.id];
    const mienCompte = mien && autresTotal >= 2;
    if (mienCompte) base[mien] += 1;
    const total = base.top + base.bien + base.bof;
    let verdict = null;
    if (total >= SEUIL_AVIS) {
      const top = base.top / total, bof = base.bof / total;
      verdict = top >= 0.6 ? (p.tete ? { code: 'feu', txt: 'Le public adore' } : { code: 'pepite', txt: 'Pépite à suivre' })
        : bof >= 0.5 ? { code: 'mitige', txt: 'Avis mitigés' } : { code: 'bien', txt: 'Bien noté' };
    }
    return { ...base, total, mien, mienCompte, verdict };
  }
  const badgeAvis = (p) => { const r = resumeAvis(p); return r.verdict ? `<span class="badge avis-${r.verdict.code}">${r.verdict.txt} · ${r.total} avis</span>` : ''; };
  const estConfirme = (p) => confirmations(p) >= 3;
  const debutReel = (p) => p.c ?? p.d;

  function statutLieu(id, t) {
    const s = soirees[id];
    if (!s) return { code: 'ferme', label: 'Fermé ce soir' };
    if (t >= s.d && t < s.f) return { code: 'live', label: 'Live' };
    if (t < s.d) return s.d - t <= 120 ? { code: 'bientot', label: 'Dans ' + dans(s.d - t) } : { code: 'plustard', label: 'Dès ' + s.debut };
    return { code: 'fini', label: 'Terminé' };
  }
  const passagesDe = (id) => passages.filter((p) => p.lieu === id);
  const enCours = (id, t) => passagesDe(id).filter((p) => t >= p.d && t < p.f);
  const suivant = (p) => passagesDe(p.lieu).filter((x) => x.salle === p.salle && x.d >= p.f).sort((a, b) => a.d - b.d)[0];

  // ---------- Petits gabarits
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const heartSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg>';
  // Tout nom de DJ est un lien vers sa fiche (les B2B et les listes « A, B » sont découpés)
  const lienDj1 = (nom) => `<span class="lien-dj-txt" role="link" tabindex="0" data-dj-lien="${esc(nom)}">${esc(nom)}</span>`;
  const lienDjs = (txt) => !txt ? '' : String(txt).split(/(,\s*|\s+(?:B2B|b2b|feat\.)\s+)/).map((part, i) => i % 2 ? esc(part) : (part.trim() ? lienDj1(part.trim()) : '')).join('');
  const heart = (dj) => `<button class="heart ${state.favs.includes(dj) ? 'on' : ''}" data-fav="${esc(dj)}" aria-label="${state.favs.includes(dj) ? 'Retirer' : 'Ajouter'} ${esc(dj)} de mes DJ" aria-pressed="${state.favs.includes(dj)}">${heartSvg}</button>`;
  const fiab = (p) => p.inconnu ? '' : (estConfirme(p)
    ? `<span class="badge b-ok">Confirmé · ${confirmations(p)}</span>`
    : `<span class="badge b-est">Estimé</span>`) +
    (monVote(p) && !monVoteValide(p) ? ` <span class="badge b-attente">${p.communaute ? 'Ton signalement' : 'Ta confirmation'} · en attente</span>` : '');
  const horaire = (p) => {
    let s = `${p.debut} – ${p.fin}`;
    if (p.c != null && p.c !== p.d) s = `Annoncé ${p.debut} · réel ${fmt(p.c)}`;
    return s;
  };

  // ---------- Écran En direct
  const FILTRES = [['tout', 'Tout'], ['club', 'Clubs'], ['plage', 'Plage'], ['favs', 'Mes DJ']];

  function renderChips() {
    $('#chips').innerHTML = FILTRES.map(([k, l]) => `<button class="chip ${state.filtre === k ? 'on' : ''}" data-filtre="${k}" aria-pressed="${state.filtre === k}">${l}</button>`).join('');
  }

  function carteSet(p) {
    const l = lieux[p.lieu];
    const n = suivant(p);
    const pct = Math.max(0, Math.min(100, Math.round((state.t - p.d) / (p.f - p.d) * 100)));
    return `<div class="card ${l.type}" role="button" tabindex="0" data-lieu="${l.id}">
      <div class="card-head"><span class="ch-g">${photo(l, 'thumb', 'generic_small_square_thumb')}<span><span class="venue">${esc(l.nom)}</span> · ${esc(p.salle)}</span></span><span class="badge b-live">LIVE</span></div>
      <div class="dj-row">
        <div class="dj ${p.inconnu ? 'unknown' : ''}">${p.inconnu ? esc(p.dj) : lienDjs(p.dj)}${p.note ? ' <span class="note">' + esc(p.note) + '</span>' : ''}</div>
        ${p.inconnu ? '' : heart(p.dj)}
      </div>
      <div class="slot">${p.communaute ? 'Signalé par les Bangers à ' + p.debut : horaire(p)} ${fiab(p)} ${l.experience === 'show' ? '<span class="badge b-show">Show</span>' : ''} ${badgeAvis(p)}</div>
      <div class="bar"><i style="width:${pct}%"></i></div>
      ${n ? `<div class="next">Ensuite : <b>${n.inconnu ? esc(n.dj) : lienDjs(n.dj)}</b> à ${n.debut}</div>` : `<div class="next">Jusqu'à la fermeture · ${soirees[p.lieu].fin}</div>`}
    </div>`;
  }

  function matchQ(p) {
    if (!state.q) return true;
    const q = state.q.toLowerCase();
    return p.dj.toLowerCase().includes(q) || lieux[p.lieu].nom.toLowerCase().includes(q);
  }
  function matchFiltre(p) {
    if (state.filtre === 'club' || state.filtre === 'plage') return lieux[p.lieu].type === state.filtre;
    if (state.filtre === 'favs') return state.favs.includes(p.dj);
    return true;
  }

  // Pépites : warm-ups (pas têtes d'affiche) que le public adore, en ce moment ou plus tôt ce soir
  function pepitesDuSoir() {
    const t = state.t;
    return passages.filter((p) => !p.inconnu && !p.tete && resumeAvis(p).verdict && resumeAvis(p).verdict.code === 'pepite' && t >= p.d && t < p.f + 180)
      .map((p) => ({ p, now: t < p.f, r: resumeAvis(p) }))
      .sort((a, b) => (b.now ? 1 : 0) - (a.now ? 1 : 0) || b.r.top - a.r.top);
  }
  function blocPepites() {
    if (state.q || state.filtre === 'favs') return '';
    const toutes = pepitesDuSoir();
    if (!toutes.length) return '';
    const ps = toutes.slice(0, 3);
    return `<div class="section-title">Pépites de ce soir <small>warm-ups adorés du public</small></div><div class="pepites">` +
      ps.map(({ p, now, r }) => `<button class="pepite" data-lieu="${p.lieu}">
        <span class="pep-ico" aria-hidden="true">★</span>
        <span class="pep-txt"><b>${lienDjs(p.dj)}</b><small>${esc(lieux[p.lieu].nom)} · ${now ? 'en ce moment, jusqu\'à ' + p.fin : 'a cartonné plus tôt (' + p.debut + ')'}</small>
        <small>${r.top} sur ${r.total} disent « à ne pas rater »</small></span>
        <span class="badge ${now ? 'b-live' : 'b-off'}">${now ? 'LIVE' : 'Terminé'}</span></button>`).join('') + (toutes.length > 3 ? `<p class="avis-detail">et ${toutes.length - 3} autre${toutes.length > 4 ? 's' : ''} plus tôt ce soir</p>` : '') + '</div>';
  }
  let pepitesAnnoncees = {};
  try { pepitesAnnoncees = JSON.parse(sessionStorage.getItem('setly.pepites')) || {}; } catch (e) { /* */ }
  function alertePepite() {
    const reglage = state.profil ? state.profil.alertePepites !== false : true;
    if (!reglage) return;
    const live = pepitesDuSoir().find((x) => x.now && !pepitesAnnoncees[x.p.id]);
    if (!live) return;
    pepitesAnnoncees[live.p.id] = true;
    try { sessionStorage.setItem('setly.pepites', JSON.stringify(pepitesAnnoncees)); } catch (e) { /* */ }
    setTimeout(() => state.dest === 'ibiza' && toast(`Pépite en ce moment : ${live.p.dj} à ${lieux[live.p.lieu].nom}, ${live.r.top} avis « à ne pas rater »`), 1200);
  }

  function renderLive() {
    const acc = $('#accueil'), voirAcc = state.vueAcc === 'accueil' && estInscrit();
    if (acc) acc.hidden = !voirAcc;
    majChipsAcc();
    if (voirAcc) { $('#chips').hidden = true; $('#live-note').hidden = true; $('#live-list').innerHTML = ''; renderAccueil(); return; }
    if (!estInscrit()) { $('#chips').hidden = true; $('#live-note').hidden = true; $('#live-list').innerHTML = portail('live'); return; }
    const ibiza = state.dest === 'ibiza';
    $('#chips').hidden = !ibiza; $('#live-note').hidden = !ibiza;
    if (!ibiza) { renderDestLive(); return; }
    const t = state.t;
    const now = passages.filter((p) => t >= p.d && t < p.f && matchQ(p) && matchFiltre(p))
      .sort((a, b) => (b.tete ? 1 : 0) - (a.tete ? 1 : 0) || (a.inconnu ? 1 : 0) - (b.inconnu ? 1 : 0) || lieux[a.lieu].nom.localeCompare(lieux[b.lieu].nom));
    const soon = passages.filter((p) => p.d > t && p.d - t <= 90 && !p.inconnu && matchQ(p) && matchFiltre(p)).sort((a, b) => a.d - b.d);
    const autres = D.lieux.filter((l) => ['fini', 'ferme', 'plustard'].includes(statutLieu(l.id, t).code))
      .filter((l) => !state.q || l.nom.toLowerCase().includes(state.q.toLowerCase()))
      .filter((l) => state.filtre === 'tout' || l.type === state.filtre);

    let h = '';
    const pr = state.profil;
    { const di = DEST.ibiza, ni = di.mois[MOIS_NOW];
      h += `<div class="dest-banniere" style="background-image:url('ibiza-carte.jpg?v=3')"></div><div class="dest-tete"><div><h2>${esc(di.nom)}</h2><small>${esc(di.pays)} · ${T('saison')} : ${esc(di.saison)}</small><small class="heure-loc">${T('il_est', { h: heureLocale(di.tz) })} · ${decalage(di.tz)}</small></div>${pastilleMois(ni)}</div>${barreAnnee(di)}`
        + miniCarteDest(di) + filDest() + carteIbizaGrande() + carteAgendaDest(di); }
    h += blocDecls();
    h += blocPepites();
    h += blocSpots();
    h += `<div class="section-title">En ce moment <small>${now.length} set${now.length > 1 ? 's' : ''}</small></div>`;
    h += now.length ? rangCartes(now.map((p) => { const l = lieux[p.lieu], n = suivant(p), pct = Math.max(0, Math.min(100, Math.round((t - p.d) / (p.f - p.d) * 100)));
      return vCarte({ tag: 'div', attr: `role="button" tabindex="0" data-lieu="${l.id}"`, c: COUL_TYPE_LIEU[l.type] || '#FF8A3D', img: imgLieu(l), badge: '<i></i>Live',
        extra: p.inconnu ? '' : heart(p.dj), type: esc(l.nom), nom: esc(p.dj), lieu: esc(p.salle) + `<span class="vc-barre"><i style="width:${pct}%"></i></span>`,
        bas: [p.communaute ? 'Signalé à ' + p.debut : `${p.debut} → ${p.fin}`, n ? 'Ensuite : ' + esc(n.dj) : 'Jusqu\'à la fermeture'] }); })) : `<div class="empty">Aucun set en ce moment${state.filtre !== 'tout' || state.q ? ' pour ce filtre' : ''}.<br>Les soirées reprennent en fin d'après-midi : regarde ce qui arrive juste en dessous.</div>`;

    if (soon.length) {
      h += `<div class="section-title">Bientôt <small>dans l'heure et demie</small></div>`;
      h += rangCartes(soon.map((p) => vCarte({ attr: `data-lieu="${p.lieu}"`, c: '#F2B53A', img: imgLieu(lieux[p.lieu]), badge: 'Dans ' + dans(p.d - t),
        type: esc(lieux[p.lieu].nom), nom: esc(p.dj), lieu: esc(p.salle), bas: ['Début ' + p.debut] })));
    }
    if (autres.length && state.filtre !== 'favs') {
      h += `<div class="section-title">Pas en live <small>${autres.length} lieux</small></div>`;
      h += rangCartes(autres.map((l) => { const s = statutLieu(l.id, t);
        return vCarte({ attr: `data-lieu="${l.id}"`, c: '#5A6378', img: imgLieu(l), badge: s.label, type: l.type === 'plage' ? 'Plage' : 'Club', nom: esc(l.nom), lieu: esc(l.zone) }); }));
    }
    $('#live-list').innerHTML = h;
    alertePepite();
  }

  // ---------- Écran Mes DJ
  function prochainSetDe(dj) {
    const sets = passages.filter((p) => p.dj === dj && p.f > state.t).sort((a, b) => a.d - b.d);
    return sets[0];
  }

  function renderFavs() {
    const ibiza = state.dest === 'ibiza';
    document.querySelectorAll('#screen-fav > :not(#fav-list)').forEach((el) => { el.hidden = !ibiza; });
    if (!ibiza && !state.favs.length) { $('#fav-list').innerHTML = `<div class="empty">${esc(T('lineups_bientot', { d: DEST[state.dest].nom }))}</div>`; return; }
    const t = state.t;
    if (!state.favs.length) {
      $('#fav-list').innerHTML = `<div class="empty">Ajoute tes DJ préférés : l'appli te dit où et à quelle heure ils jouent ce soir.</div>`;
    } else {
      const liveFav = (dj) => { const pro = djProParNom(dj); return !!pro && (enStream(pro) || DECLS.some((x) => x.dj === pro.id && declActive(x))); };
      const favCartes = state.favs.slice().sort((x, y) => (liveFav(y) ? 1 : 0) - (liveFav(x) ? 1 : 0)).map((dj) => {
        // DJ Pro / Premium de l'appli : en live s'il s'est déclaré (et pas encore fini) ou s'il diffuse son live
        const pro = djProParNom(dj), decl = pro && DECLS.find((x) => x.dj === pro.id && declActive(x));
        if (decl || (pro && enStream(pro))) { const l = decl ? lieuDe(decl) || {} : {};
          return vCarte({ tag: 'div', attr: decl ? `role="button" tabindex="0" data-dj-pro="${esc(dj)}"` : `role="button" tabindex="0" data-dj-pro="${esc(dj)}"`, c: '#F2C53A', img: avPinDj(pro) || (decl && l.id ? imgLieu(l) : ''), badge: 'En live',
            extra: heart(dj), type: decl ? esc(l.nom || 'Spot') : 'Live en ligne', nom: esc(dj), lieu: decl ? `${esc(l.nom || 'Spot')} · jusqu'à ${hm(decl.fin)}` : 'En direct sur sa chaîne' }); }
        const p = prochainSetDe(dj);
        let info, badge;
        if (!p) { info = 'Ne joue plus ce soir'; badge = '<span class="badge b-off">Pas ce soir</span>'; }
        else if (t >= p.d) { info = `${lieux[p.lieu].nom} · jusqu'à ${p.fin}`; badge = `<span class="badge b-live ${lieux[p.lieu].type}">En ce moment</span>`; }
        else { info = `${lieux[p.lieu].nom} · ${p.debut} – ${p.fin}`; badge = `<span class="badge b-soon">Dans ${dans(p.d - t)}</span>`; }
        const c = !p ? '#5A6378' : t >= p.d ? (COUL_TYPE_LIEU[lieux[p.lieu].type] || '#FF8A3D') : '#F2B53A';
        return vCarte({ tag: 'div', attr: p ? `role="button" tabindex="0" data-lieu="${p.lieu}"` : '', c, img: p ? imgLieu(lieux[p.lieu]) : '', badge: badge.replace(/<[^>]+>/g, ''),
          extra: heart(dj), type: p ? esc(lieux[p.lieu].nom) : 'Mes DJ', nom: esc(dj), lieu: esc(info) });
      });
      $('#fav-list').innerHTML = `<div class="section-title">Mes DJ <small>${state.favs.length} suivi${state.favs.length > 1 ? 's' : ''} · touche le cœur pour arrêter</small></div>` + rangCartes(favCartes);
    }
    // Annuaire : une fiche pour chaque DJ passé à Ibiza (line-up de ce soir + toute la saison 2025)
    const q = sansAccent(($('#fav-search').value || '').trim());
    const nb = nbDatesDj();
    const tous = [...tousLesDjs().entries()].map(([k, nom]) => ({ k, nom, n: nb.get(k) || 0 }));
    const sugg = tous.filter((x) => !state.favs.includes(x.nom) && (!q || x.k.includes(q)))
      .sort((a, b) => b.n - a.n || a.nom.localeCompare(b.nom)).slice(0, q ? 30 : 12);
    $('#fav-titre-annuaire').innerHTML = `Tous les DJ passés à Ibiza <small>${tous.length} fiches</small>`;
    $('#fav-suggest').innerHTML = sugg.map((x) => `<div class="mini">${avatarDj(x.nom)}<button class="lien-dj venue" data-dj-pro="${esc(x.nom)}">${esc(x.nom)}<br><small>${x.n ? x.n + ' date' + (x.n > 1 ? 's' : '') + ' en 2025' : 'Ce soir'}${djProParNom(x.nom) && djProParNom(x.nom).officiel ? ' · ✓ Officiel' : ''}</small></button>${heart(x.nom)}</div>`).join('') || '<div class="empty">Aucun DJ trouvé.</div>';
    remplirAvatars($('#fav-suggest'));
  }

  function toggleFav(dj) {
    const i = state.favs.indexOf(dj);
    if (i >= 0) state.favs.splice(i, 1); else { state.favs.push(dj); rappelCompte(); }
    store.set('favs', state.favs);
    render();
    if (state.lieuOuvert) renderSheet();
  }

  // ---------- Carte
  let map, layer, rayonLayer = null;
  function couleur(l, t) {
    const s = statutLieu(l.id, t).code;
    if (s === 'live') return l.type === 'plage' ? '#3DD6C6' : '#FF8A3D';
    if (s === 'bientot') return '#F2B53A';
    return '#8A8498';
  }
  let FONDS = null, fondActif = null;
  function choisirFond(nom) {
    if (!map || !FONDS[nom]) return;
    if (fondActif) map.removeLayer(fondActif);
    fondActif = FONDS[nom].addTo(map);
    fondActif.eachLayer((l) => l.bringToBack && l.bringToBack());
    store.set('fond', nom);
    document.querySelectorAll('[data-fond]').forEach((b) => { const on = b.dataset.fond === nom; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
    $('#map').classList.toggle('satellite', nom === 'satellite');
  }
  // ---------- Ma position sur la carte : point bleu « Tu es ici »
  let moiLayer = null;
  function dessinerMoi() {
    if (!map || !moiLayer) return;
    moiLayer.clearLayers();
    const m = state.maPos; if (!m) return;
    if (m.acc && m.acc < 2000) L.circle([m.lat, m.lng], { radius: m.acc, color: '#4DA3FF', weight: 1, opacity: .5, fillColor: '#4DA3FF', fillOpacity: .12, interactive: false }).addTo(moiLayer);
    L.marker([m.lat, m.lng], { icon: L.divIcon({ className: 'moi-pin', iconSize: [22, 22], iconAnchor: [11, 11], html: '<i></i>' }), zIndexOffset: 1000, keyboard: false })
      .bindPopup('<div class="pop-venue">Tu es ici</div><div class="pop-slot">' + esc(state.zoneGeo && state.zoneGeo.nom || '') + (m.acc ? ' · précision ' + Math.round(m.acc) + ' m' : '') + '</div><button class="pop-btn" data-spot-ici="1">Un DJ joue ici</button>')
      .addTo(moiLayer);
  }
  function villeProche(lat, lng) {
    const vs = (window.VILLES || []).map((v) => ({ n: v[0], km: distKm([lat, lng], [v[2], v[3]]) })).sort((x, y) => x.km - y.km);
    return vs[0] && vs[0].km < 25 ? vs[0].n : null;
  }
  function initMap() {
    if (map || typeof L === 'undefined') return;
    map = L.map('map', { zoomControl: false, attributionControl: true }).setView(DEST[state.dest].centre, DEST[state.dest].zoom);
    // Deux fonds Esri (acceptent les pages ouvertes depuis un fichier local) : nuit et satellite
    const esri = 'https://server.arcgisonline.com/ArcGIS/rest/services/';
    FONDS = {
      nuit: L.layerGroup([
        L.tileLayer(esri + 'Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', { maxZoom: 16, attribution: 'Fond de carte &copy; Esri' }),
        L.tileLayer(esri + 'Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}', { maxZoom: 16 })
      ]),
      satellite: L.layerGroup([
        L.tileLayer(esri + 'World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 18, attribution: 'Imagerie &copy; Esri' }),
        L.tileLayer(esri + 'Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', { maxZoom: 18 })
      ])
    };
    // Si le fond de carte ne charge pas (aperçu dans Claude, réseau coupé) : fond dessiné de secours + petit mot
    let tuilesOk = 0, tuilesKo = 0;
    Object.values(FONDS).forEach((g) => g.eachLayer((t) => { t.on('tileload', () => { tuilesOk++; $('#map').classList.remove('sans-fond'); }); t.on('tileerror', () => { tuilesKo++; if (!tuilesOk && tuilesKo >= 4) $('#map').classList.add('sans-fond'); }); }));
    setTimeout(() => { if (!tuilesOk) $('#map').classList.add('sans-fond'); }, 4000);
    choisirFond(store.get('fond', 'nuit'));
    L.control.zoom({ position: 'topright' }).addTo(map);
    layer = L.layerGroup().addTo(map);
    moiLayer = L.layerGroup().addTo(map);
    dessinerMoi();
  }
  function renderGalerie() {
    if (state.dest !== 'ibiza') { renderGalerieDest(); return; }
    const t = state.t;
    const ordre = { live: 0, bientot: 1, plustard: 2, fini: 3, ferme: 4 };
    const tri = D.lieux.slice().sort((a, b) => ordre[statutLieu(a.id, t).code] - ordre[statutLieu(b.id, t).code] || a.nom.localeCompare(b.nom));
    const grp = (titre, liste) => liste.length ? `<div class="section-title">${titre} <small>${liste.length}</small></div><div class="galerie">` + liste.map((l) => {
      const st = statutLieu(l.id, t), cur = enCours(l.id, t).filter((p) => !p.inconnu)[0];
      const cls = st.code === 'live' ? 'b-live ' + l.type : st.code === 'bientot' ? 'b-soon' : 'b-off';
      return `<button class="g-lieu" data-lieu="${l.id}">${photo(l, 'g-img')}
        <span class="g-info"><b>${esc(l.nom)}</b><small>${esc(l.zone)}</small>
        <span class="badge ${cls}">${st.code === 'live' ? (cur ? esc(cur.dj) : 'LIVE') : st.label}</span></span></button>`;
    }).join('') + '</div>' : '';
    $('#galerie-lieux').innerHTML =
      grp('Clubs', tri.filter((l) => l.type === 'club')) + grp('Plages et beach clubs', tri.filter((l) => l.type === 'plage')) +
      '<p class="demo-note">Photos : Ibiza Spotlight, pour la démo. Pour l\'appli publique, il faudra les photos des lieux partenaires ou celles de Google, avec leur crédit.</p>';
  }
  function renderMap() {
    try { renderCartesMap(); } catch (e) { console.warn(e); }
    const leg = state.dest === 'ibiza'
      ? [['#FF8A3D', 'Club live'], ['#3DD6C6', 'Plage live'], ['#F2B53A', 'Bientôt'], ['#8A8498', 'Fini · fermé']]
      : [['#FF8A3D', T('club')], ['#3DD6C6', T('plage')], ['#24304A', moisNom(MOIS_NOW) + ' : ' + labelMois(DEST[state.dest].mois[MOIS_NOW])]];
    if (DEST[state.dest].local) leg.length = 0;
    leg.push(['#B58CFF', 'Spot']); leg.push(['#F2C94C', 'DJ déclaré']);
    $('.map-legend').innerHTML = leg.map(([c, t]) => `<span><i style="background:${c}"></i>${t}</span>`).join('');
    if (state.vueCarte === 'lieux') renderGalerie();
    if (!map) return;
    layer.clearLayers();
    if (state.dest !== 'ibiza') { marqueursDest(); marqueursSpots(); marqueursDecls(); return; }
    const t = state.t;
    D.lieux.forEach((l) => {
      const s = statutLieu(l.id, t);
      const live = s.code === 'live';
      const col = couleur(l, t);
      const m = L.marker([l.lat, l.lng], { icon: iconeLieu(l, live, ['fini', 'ferme'].includes(s.code)), zIndexOffset: live ? 400 : 0 });
      const cur = enCours(l.id, t);
      const djs = cur.length ? cur.map((p) => `<div class="pop-dj">${p.inconnu ? esc(p.dj) : lienDjs(p.dj)}</div><div class="pop-slot">${esc(p.salle)} · ${horaire(p)}</div>`).join('') : `<div class="pop-slot" style="margin-top:4px">${s.label}</div>`;
      m.bindPopup(`${photo(l, 'pop-photo')}<div class="pop-venue">${esc(l.nom)}</div>${djs}<button class="pop-btn" data-lieu="${l.id}">Voir la soirée</button>`);
      lierBandeau(m, `data-lieu="${l.id}"`);
      m.addTo(layer);
    });
    marqueursSpots();
    marqueursDecls();
  }

  // ---------- Fiche lieu
  // Bouton retour explicite : « Retour à la carte » quand on vient de la carte, sinon « Retour »
  const ECRANS_RETOUR = { map: 'Retour à la carte', live: 'Retour', agenda: 'Retour à l\'agenda', fav: 'Retour à mes DJ', profil: 'Retour au profil' };
  function libelleRetour(btn) {
    const txt = ECRANS_RETOUR[state.tab] || 'Retour';
    let span = btn.querySelector('span'); if (!span) { span = document.createElement('span'); btn.appendChild(span); }
    span.textContent = txt; btn.setAttribute('aria-label', txt);
  }
  function ouvrirLieu(id) {
    if (!estInscrit()) { if (state.djOuvert) fermerDj(); toast('Inscris-toi pour voir les soirées en direct'); setTab('profil'); return; }
    libelleRetour($('#sheet-back'));
    state.lieuOuvert = id;
    state.signaler = false;
    renderSheet();
    $('#sheet').classList.add('open');
    $('#sheet').setAttribute('aria-hidden', 'false');
    $('#sheet-back').focus({ preventScroll: true }); document.querySelector('.app').scrollLeft = 0;
  }
  function fermerLieu() {
    state.lieuOuvert = null;
    $('#sheet').classList.remove('open');
    $('#sheet').setAttribute('aria-hidden', 'true');
  }

  function renderSheet() {
    const id = state.lieuOuvert;
    if (!id) return;
    if (!lieux[id] && LIEUX_DEST[id]) { renderSheetDest(LIEUX_DEST[id]); return; }
    if (!lieux[id] && LIEUX_IBIZA_PLUS[id]) { renderSheetIbizaPlus(LIEUX_IBIZA_PLUS[id]); return; }
    const l = lieux[id], s = soirees[id], t = state.t, st = statutLieu(id, t);
    const cls = st.code === 'live' ? 'b-live ' + l.type : st.code === 'bientot' ? 'b-soon' : 'b-off';
    $('#sheet-status').innerHTML = `<span class="badge ${cls}">${st.code === 'live' ? 'LIVE' : st.label}</span>`;

    let h = `<div class="hero">${photo(l, 'hero-img')}${creditLieu(l)}</div><h2>${esc(l.nom)}</h2>
      <div class="meta">${l.type === 'plage' ? 'Beach club' : 'Club'} · ${esc(l.zone)} · ★ ${l.note}
      ${l.experience === 'show' ? '<span class="badge b-show">Lieu-spectacle</span>' : '<span class="badge b-est">On danse</span>'}</div>`;

    if (!s) {
      h += `<div class="event"><div class="event-title">Pas de soirée annoncée ce soir</div><div class="event-sub">${D.date}</div></div>`;
      h += rendrePassages(id, l, t);
    } else {
      h += `<div class="event"><div class="event-title">${esc(s.titre)}</div><div class="event-sub">${D.date} · ${s.debut} – ${s.fin}${s.prix ? ' · ' + esc(s.prix) : ''}</div></div>`;
      h += rendrePassages(id, l, t);
      h += `<p class="source">Line-up : Ibiza Spotlight. Ordre et horaires de passage non publiés par le lieu : « estimé » tant que moins de 3 personnes sur place l'ont confirmé.</p>`;
    }
    h += state.signaler
      ? `<form id="form-signaler" class="form-email" novalidate>
          <label class="champ"><span>Qui joue ici en ce moment ?</span>
            <input class="search" name="dj" list="liste-djs" placeholder="Nom du DJ" autocomplete="off"></label>
          <datalist id="liste-djs">${[...tousLesDjs().values()].slice(0, 400).map((n) => `<option value="${esc(n)}">`).join('')}</datalist>
          <p class="erreur" id="err-dj" hidden>Écris le nom du DJ</p>
          <button type="submit" class="btn-plein">Signaler</button>
          <button type="button" class="lien-demo" data-annuler-signal="1">Annuler</button>
          <p class="conseil" style="margin:0">Ton signalement apparaît tout de suite pour toi. Les autres le verront quand 2 personnes sur place l'auront confirmé.</p>
        </form>`
      : `<button class="alerte signaler" data-signaler="1">Signaler le DJ qui joue ici</button>`;
    $('#sheet-body').innerHTML = h;
    $('#sheet-actions').innerHTML = `
      <a class="btn-ghost" href="https://www.google.com/maps/dir/?api=1&destination=${l.lat},${l.lng}" target="_blank" rel="noopener">Itinéraire</a>
      <a class="btn-main" href="https://www.ibiza-spotlight.com/night/tickets" target="_blank" rel="noopener">Prendre mon billet</a>`;
  }

  function rendrePassages(id, l, t) {
    let h = '';
    const salles = [...new Set(passagesDe(id).map((p) => p.salle))];
    salles.forEach((salle) => {
      h += `<div class="room"><div class="room-name">${esc(salle)}</div>`;
      passagesDe(id).filter((p) => p.salle === salle).sort((a, b) => a.d - b.d).forEach((p) => {
        const now = t >= p.d && t < p.f, done = t >= p.f;
        const deja = state.voted[p.id];
        const av = resumeAvis(p);
        const peutNoter = !p.inconnu && (now || done);
        h += `<div class="pass ${now ? 'now' : ''} ${done ? 'done' : ''}">
          <div class="pass-time">${fmt(debutReel(p))}</div>
          <div>
            <div class="pass-dj">${p.inconnu ? esc(p.dj) : lienDjs(p.dj)}${p.tete ? '<span class="star" aria-label="tête d\'affiche">★</span>' : ''}${p.note ? ' <span class="note">' + esc(p.note) + '</span>' : ''}</div>
            <div class="pass-info">${p.communaute ? 'Signalé à ' + p.debut : horaire(p)} ${fiab(p)} ${now ? '<span class="badge b-live ' + l.type + '">En ce moment</span>' : ''} ${badgeAvis(p)}</div>
            ${now && !p.inconnu && !deja ? `<button class="confirm" data-vote="${p.id}">Je suis sur place : il joue</button>` : ''}
            ${deja ? (monVoteValide(p)
              ? `<p class="statut-vote ok">${p.communaute ? 'Ton signalement' : 'Ta confirmation'} est validé${p.communaute ? '' : 'e'} : d'autres personnes sur place l'ont confirmé${p.communaute ? '' : 'e'}, visible par tous.</p>`
              : `<p class="statut-vote">${p.communaute ? 'Ton signalement est enregistré' : 'Ta confirmation est enregistrée'}. Toi seul le vois pour l'instant : visible par tous quand ${SEUIL_AUTRES} autres personnes sur place l'auront confirmé (${Math.min(autresConf(p), SEUIL_AUTRES)}/${SEUIL_AUTRES}).</p>
                 <button class="lien-demo" data-autre="${p.id}">Démo : simuler la confirmation d'un autre utilisateur</button>`) : ''}
            ${peutNoter ? `<div class="avis" role="group" aria-label="Ton avis sur ce set">
                <span class="avis-q">${av.mien ? 'Ton avis' : 'Ça vaut le coup ?'}</span>
                ${AVIS.map(([k, lab]) => `<button class="avis-btn ${av.mien === k ? 'on' : ''}" data-avis="${p.id}" data-val="${k}" aria-pressed="${av.mien === k}">${lab}</button>`).join('')}
              </div>
              ${av.mien && !av.mienCompte ? `<p class="statut-vote">Ton avis est enregistré. Il comptera publiquement quand 2 autres personnes auront donné le leur.</p>
                <button class="lien-demo" data-autre-avis="${p.id}" data-val="${av.mien}">Démo : simuler l'avis d'un autre utilisateur</button>` : ''}
              ${av.total ? `<div class="avis-barre" title="${av.top} à ne pas rater, ${av.bien} sympa, ${av.bof} bof"><i class="a-top" style="flex:${av.top}"></i><i class="a-bien" style="flex:${av.bien}"></i><i class="a-bof" style="flex:${av.bof}"></i></div>
                <p class="avis-detail">${av.top} à ne pas rater · ${av.bien} sympa · ${av.bof} bof${av.total < SEUIL_AVIS ? ' · résumé public à partir de ' + SEUIL_AVIS + ' avis' : ''}</p>` : ''}` : ''}
          </div>
        </div>`;
      });
      h += `</div>`;
    });
    return h;
  }

  function donnerAvis(pid, val) {
    if (state.mesAvis[pid] === val) delete state.mesAvis[pid]; else state.mesAvis[pid] = val;
    store.set('mesAvis', state.mesAvis);
    rappelCompte();
    renderSheet(); render();
  }

  function signaler(lieu, dj) {
    const sg = { id: 1000 + Date.now() % 1000000, lieu, dj, t: state.t };
    SIGNALEMENTS.push(sg);
    try { localStorage.setItem('setly.signalements', JSON.stringify(SIGNALEMENTS)); } catch (e) { /* */ }
    ajouterPassageSignale(sg);
    state.voted[sg.id] = Date.now(); store.set('voted', state.voted);
    INDEX_DJ = null;
    state.signaler = false;
    rappelCompte();
    renderSheet(); render();
    toast('Signalé : visible par toi, en attente de confirmation');
  }

  // ---------- Règle des Bangers : on ne confirme que là où le téléphone se trouve vraiment
  const RAYON_M = 200;                 // distance maximale pour confirmer dans un lieu
  const RAYON_BATEAU_M = 500;          // un bateau bouge : marge plus large
  let posDemo = null;                  // prototype seulement : position simulée pour tester sans être à Ibiza
  const fmtDist = (m) => m < 1000 ? Math.round(m / 10) * 10 + ' m' : (m / 1000).toFixed(m < 10000 ? 1 : 0).replace('.', ',') + ' km';
  function calqueGeo(html) {
    let c = document.getElementById('geo-calque');
    if (!c) { c = document.createElement('div'); c.id = 'geo-calque'; c.className = 'avis-calque'; (document.querySelector('.app') || document.body).appendChild(c);
      c.addEventListener('click', (e) => { if (e.target === c || e.target.closest('[data-geo-fermer]')) c.hidden = true; }); }
    c.innerHTML = `<div class="avis-feuille geo-feuille" role="dialog" aria-modal="true">${html}</div>`; c.hidden = false; return c;
  }
  // lieu : { nom, lat, lng } ; action : ce qu'on fait une fois la présence vérifiée
  function surPlace(lieu, action, opts) {
    opts = opts || {};
    const rayon = opts.rayon || RAYON_M;
    if (!lieu || lieu.lat == null) { action(null); return; }
    const verifier = (lat, lng, src) => {
      const d = distKm([lat, lng], [lieu.lat, lieu.lng]) * 1000;
      if (d <= rayon) { action({ lat, lng, src }); return; }
      const c = calqueGeo(`<div class="avis-tete"><h2>Tu n'es pas sur place</h2><button class="ps-x" data-geo-fermer="1" type="button" aria-label="Fermer">×</button></div>
        <p class="conseil">Pour confirmer, ton téléphone doit être à moins de <b>${rayon}&nbsp;m</b> de <b>${esc(lieu.nom)}</b>. Il est à <b>${fmtDist(d)}</b>.</p>
        <p class="aide">C'est la règle des Bangers : on confirme seulement ce qu'on voit de ses yeux. C'est ce qui rend l'info fiable pour tout le monde.</p>
        <button class="btn-plein" data-geo-fermer="1" type="button">Compris</button>
        <button class="lien-demo" data-geo-demo="1" type="button">Démo : me placer à ${esc(lieu.nom)}</button>`);
      c.querySelector('[data-geo-demo]').onclick = () => { posDemo = { lat: lieu.lat, lng: lieu.lng, nom: lieu.nom }; c.hidden = true; toast('Démo : te voilà à ' + lieu.nom); action({ lat: lieu.lat, lng: lieu.lng, src: 'demo' }); };
    };
    if (posDemo) { verifier(posDemo.lat, posDemo.lng, 'demo'); return; }
    if (!navigator.geolocation) { refusGeo(lieu, action); return; }
    toast('Je vérifie que tu es sur place…');
    navigator.geolocation.getCurrentPosition((p) => verifier(p.coords.latitude, p.coords.longitude, 'gps'), () => refusGeo(lieu, action), { enableHighAccuracy: true, maximumAge: 60000, timeout: 8000 });
  }
  function refusGeo(lieu, action) {
    const c = calqueGeo(`<div class="avis-tete"><h2>Active ta position</h2><button class="ps-x" data-geo-fermer="1" type="button" aria-label="Fermer">×</button></div>
      <p class="conseil">Pour confirmer qui joue à <b>${esc(lieu.nom)}</b>, Banzic doit vérifier que tu y es. Autorise la position pour Banzic dans les réglages de ton téléphone, puis réessaie.</p>
      <p class="aide">Ta position sert seulement à cette vérification. Elle n'est jamais montrée aux autres.</p>
      <button class="btn-plein" data-geo-fermer="1" type="button">Compris</button>
      <button class="lien-demo" data-geo-demo="1" type="button">Démo : me placer à ${esc(lieu.nom)}</button>`);
    c.querySelector('[data-geo-demo]').onclick = () => { posDemo = { lat: lieu.lat, lng: lieu.lng, nom: lieu.nom }; c.hidden = true; toast('Démo : te voilà à ' + lieu.nom); action({ lat: lieu.lat, lng: lieu.lng, src: 'demo' }); };
  }

  function voter(pid) {
    state.voted[pid] = Date.now();
    store.set('voted', state.voted);
    rappelCompte();
    const p = passageParId(pid);
    toast(monVoteValide(p) ? 'Merci ! Confirmée par d\'autres : visible par tous' : 'Enregistré : visible par toi, en attente de validation');
    renderSheet();
    render();
  }

  // ---------- Agenda façon Bison Futé
  // Prévisions d'affluence par jour et par lieu. Démo : seule la soirée du jeudi 1er octobre
  // a un line-up réel ; les autres jours, ouvertures et prévisions sont simulées.
  const NIVEAUX = [
    // Popularité estimée : une tendance du nombre de gens attendus, pas une mesure
    { code: 'vert', get label() { return T('pop0'); }, get court() { return T('pop0'); }, couleur: '#3FBF7F' },
    { code: 'orange', get label() { return T('pop1'); }, get court() { return T('pop1'); }, couleur: '#F59E2E' },
    { code: 'rouge', get label() { return T('pop2'); }, get court() { return T('pop2'); }, couleur: '#E5484D' },
    { code: 'noir', get label() { return T('pop3'); }, get court() { return T('pop3'); }, couleur: '#050505' }
  ];
  const JOURS = ['lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.', 'dim.'];
  const JOURS_LONGS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
  const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  const EVENEMENTS = {
    '2026-09-26': 'Week-end des closings',
    '2026-09-27': 'Week-end des closings',
    '2026-10-03': 'Week-end des closings',
    '2026-10-04': 'Week-end des closings',
    '2026-10-12': 'Jour férié en Espagne',
    '2026-10-17': 'Vacances scolaires (France)',
    '2026-10-18': 'Vacances scolaires (France)'
  };
  const hash = (s) => { let h = 7; for (const c of s) h = (h * 31 + c.charCodeAt(0)) % 9973; return h; };
  const iso = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');

  const AGENDA = (() => {
    const out = [];
    const debut = new Date(2026, 8, 21); // lundi 21 septembre
    for (let i = 0; i < 28; i++) {
      const d = new Date(debut); d.setDate(debut.getDate() + i);
      const key = iso(d), wd = (d.getDay() + 6) % 7;
      const finSaison = d >= new Date(2026, 9, 12);
      const closing = d >= new Date(2026, 8, 25) && d <= new Date(2026, 9, 4);
      let base = [0, 0, 1, 1, 2, 2, 1][wd] + (closing ? 1 : 0) + (EVENEMENTS[key] && !closing ? 1 : 0) - (finSaison ? 1 : 0);
      const lieuxDuJour = [];
      if (key === '2026-10-01') {
        const reel = { unvrs: 3, amnesia: 2, pacha: 2, akasha: 1, '528': 1, chinois: 3, lio: 1, espardis: 1, borabora: 1, destino: 2, obeach: 1, mambo: 2, cafedelmar: 2, bluemarlin: 0 };
        D.soirees.forEach((s) => lieuxDuJour.push({ id: s.lieu, niveau: reel[s.lieu] ?? 1, titre: s.titre, tetes: passagesDe(s.lieu).filter((p) => p.tete).map((p) => p.dj).filter((v, j, a) => a.indexOf(v) === j && !s.titre.includes(v)), reel: true }));
        base = 2;
      } else {
        D.lieux.forEach((l) => {
          const h = hash(l.id + key);
          const ouvertures = 2 + (hash(l.id) % 3);
          const ouvert = finSaison ? ['pacha', 'lio', 'chinois', 'espardis', 'cafedelmar', 'mambo'].includes(l.id) && h % 3 !== 0
            : l.type === 'plage' ? h % 5 !== 0 : (hash(l.id) + wd) % 7 < ouvertures;
          if (!ouvert) return;
          const niveau = Math.max(0, Math.min(3, base + (l.experience === 'show' ? 1 : 0) + (h % 3) - 1 - (l.capacite < 1000 ? 0 : 0)));
          lieuxDuJour.push({ id: l.id, niveau, titre: null, tetes: [], reel: false });
        });
      }
      const niveau = Math.max(0, Math.min(3, base));
      out.push({ key, date: d, wd, niveau, evenement: EVENEMENTS[key] || null, lieux: lieuxDuJour.sort((a, b) => b.niveau - a.niveau) });
    }
    return out;
  })();

  Object.assign(state, {
    jour: '2026-10-01',
    envie: store.get('envie', 'foule'),
    alertes: store.get('alertes', {}),
    sejour: store.get('sejour', null),
    choixSejour: null
  });

  const pastille = (n, petit) => `<span class="niv niv-${NIVEAUX[n].code}${petit ? ' petit' : ''}">${petit ? NIVEAUX[n].court : NIVEAUX[n].label}</span>`;
  const dansSejour = (key) => state.sejour && key >= state.sejour[0] && key <= state.sejour[1];

  function conseil(j) {
    const nom = (x) => esc(lieux[x.id].nom);
    if (!j.lieux.length) return 'Peu de soirées ce jour-là.';
    // Conseil neutre : les soirées les plus populaires, et celles où il y aura de la place
    const gros = j.lieux.filter((x) => x.niveau >= 2).slice(0, 3);
    const calmes = j.lieux.filter((x) => x.niveau <= 1).slice(0, 3);
    let s = gros.length ? `Les plus populaires : <b>${gros.map(nom).join(', ')}</b>, prends ton billet à l'avance.` : 'Soirée calme : peu d\'endroits seront vraiment pleins.';
    if (calmes.length) s += ` Plus de place à ${calmes.map(nom).join(', ')}.`;
    return s;
  }

  // Saisons : Ibiza (programme 2025 réel) et les autres destinations (window.SAISONS_MONDE)
  let SM_IBIZA = null;
  const SM = () => {
    if (state.dest === 'ibiza') return SM_IBIZA || (SM_IBIZA = { source: 'Programme réel de la saison 2025 (calendrier Ibiza Spotlight).', noms: S0.noms, lignes: S0.lignes });
    return window.SAISONS_MONDE && SAISONS_MONDE[state.dest];
  };
  // 4 onglets pour chaque destination : Toute l'année · Prévisions · Calendrier · Tendances (saison 2026).
  // Ibiza garde sa clé « 2026 » pour ses prévisions ; sa saison 2025 d'origine reste accessible par un lien.
  const toggleAnnee = () => {
    if (state.dest !== 'ibiza' && !SM()) return '';
    const prev = state.dest === 'ibiza' ? '2026' : 'prev';
    const b = (k, l) => `<button class="seg ${state.annee === k ? 'on' : ''}" data-annee="${k}" aria-pressed="${state.annee === k}">${l}</button>`;
    return `<div class="segs annees quatre" role="group" aria-label="Agenda">${b('annee', 'Année')}${b(prev, 'Prévisions')}${b('cal', 'Calendrier')}${b('tend', 'Tendances')}</div>`;
  };

  function renderAgenda() {
    if ((state.annee === 'cal' || state.annee === 'tend') && SM()) { renderSaisonMonde('2026', state.annee); return; }
    if (state.dest !== 'ibiza' && SM()) { if (state.annee === 'prev') renderSaisonMonde('prev', 'cal'); else renderAnnee(); return; }
    if (!['annee', '2025', '2026'].includes(state.annee) || state.dest !== 'ibiza') state.annee = state.dest === 'ibiza' ? (state.annee || 'annee') : 'annee';
    if (!['annee', '2025', '2026'].includes(state.annee)) state.annee = 'annee';
    if (state.annee === 'annee') { renderAnnee(); return; }
    if (state.annee === '2025') { renderSaison(); return; }
    let h = toggleAnnee() + `<div class="section-title">${T('pop_titre')} <small>21 sept. – 18 oct.</small></div>
      <div class="legende">${NIVEAUX.map((n, i) => `<span><i class="niv-dot niv-${n.code}"></i>${n.label}</span>`).join('')}</div>
      <div class="cal" role="grid" aria-label="Calendrier des soirées">
        ${JOURS.map((j) => `<div class="cal-h" role="columnheader">${j}</div>`).join('')}`;
    AGENDA.forEach((j) => {
      const n = NIVEAUX[j.niveau];
      const premier = j.date.getDate() === 1 || j === AGENDA[0];
      h += `<button class="cal-d niv-${n.code} ${state.jour === j.key ? 'sel' : ''} ${dansSejour(j.key) ? 'sejour' : ''} ${state.choixSejour && state.choixSejour[0] === j.key ? 'sejour arrivee' : ''}" data-jour="${j.key}" aria-label="${JOURS_LONGS[j.wd]} ${j.date.getDate()} ${MOIS[j.date.getMonth()]} : ${n.label}">
        <span class="cal-n">${j.date.getDate()}${premier ? ' <small>' + MOIS[j.date.getMonth()].slice(0, 4) + '.</small>' : ''}</span>
        <span class="cal-icons">${j.evenement ? '<i class="ev" title="' + esc(j.evenement) + '"></i>' : ''}${state.alertes[j.key] ? '<i class="bell"></i>' : ''}</span>
      </button>`;
    });
    h += `</div>
      <button class="lien-sejour" data-sejour="1">${state.choixSejour ? (state.choixSejour.length ? 'Maintenant, touche ton jour de départ' : 'Touche ton jour d\'arrivée') : state.sejour ? 'Changer mes dates de séjour' : 'Indiquer mes dates de séjour'}</button>`;

    const j = AGENDA.find((x) => x.key === state.jour);
    if (j) {
      const alerte = state.alertes[j.key];
      h += `<div class="jour">
        <div class="jour-top"><div>
          <div class="jour-titre">${JOURS_LONGS[j.wd]} ${j.date.getDate()} ${MOIS[j.date.getMonth()]}</div>
          ${j.evenement ? `<div class="jour-ev">${esc(j.evenement)}</div>` : ''}
        </div>${pastille(j.niveau)}</div>
        <p class="conseil">${conseil(j)}</p>
        <button class="alerte ${alerte ? 'on' : ''}" data-alerte="${j.key}" aria-pressed="${!!alerte}">${alerte ? 'Alerte activée : on te prévient la veille' : 'Me prévenir si la prévision change'}</button>
        <div class="jour-lieux">`;
      j.lieux.forEach((x) => {
        const l = lieux[x.id];
        h += `<button class="jl" data-lieu-jour="${x.id}" data-jour-lieu="${j.key}">
          <span class="jl-g"><span class="venue">${esc(l.nom)}</span>
          <small>${x.titre ? esc(x.titre) + (x.tetes.length ? ' · ' + x.tetes.map(lienDj1).join(', ') : '') : 'Line-up pas encore publié'}</small>
          <small>${l.experience === 'show' ? 'Lieu-spectacle · on regarde' : (l.type === 'plage' ? 'Beach club' : 'Club') + ' · on danse'}</small></span>
          ${pastille(x.niveau, true)}
        </button>`;
      });
      if (!j.lieux.length) h += '<div class="empty">Aucune soirée prévue.</div>';
      h += `</div></div>`;
    }
    if (state.sejour) {
      const nuits = AGENDA.filter((x) => dansSejour(x.key));
      const fmt = (k) => { const d = new Date(k + 'T12:00:00'); return d.getDate() + ' ' + MOIS[d.getMonth()]; };
      const meilleures = [...nuits].sort((a, b) => b.niveau - a.niveau).slice(0, 3);
      h += `<div class="section-title" id="ton-sejour">Ton séjour <small>${nuits.length} ${nuits.length > 1 ? 'nuits' : 'nuit'}</small></div>
        <p class="conseil">Du <b>${fmt(state.sejour[0])}</b> au <b>${fmt(state.sejour[1])}</b>.${meilleures.length ? ` Tes plus grosses soirées : ${meilleures.map((x) => `<b>${JOURS_LONGS[x.wd].toLowerCase()} ${x.date.getDate()}</b>`).join(', ')}.` : ''}</p>
        <div class="plan-sejour">`;
      nuits.forEach((x) => {
        const top = x.lieux.slice(0, 3);
        h += `<button class="ps-jour ${state.jour === x.key ? 'sel' : ''}" data-jour="${x.key}">
          <span class="ps-tete"><span class="ps-date"><b>${JOURS_LONGS[x.wd]} ${x.date.getDate()}</b> ${MOIS[x.date.getMonth()]}</span>${pastille(x.niveau, true)}</span>
          ${x.evenement ? `<span class="ps-ev">${esc(x.evenement)}</span>` : ''}
          <span class="ps-lieux">${top.length ? top.map((y) => `<span class="ps-l"><i class="niv-dot niv-${NIVEAUX[y.niveau].code}"></i>${esc(lieux[y.id].nom)}${y.titre ? ' · <small>' + esc(y.titre) + '</small>' : ''}</span>`).join('') : '<span class="ps-l">Peu de soirées ce soir-là</span>'}</span>
        </button>`;
      });
      h += `</div>`;
    }
    h += `<p class="demo-note">Démo : seul le jeudi 1er octobre a un line-up réel. Les autres jours, les ouvertures et les prévisions sont simulées. Dans l'appli, la prévision combinera line-ups annoncés, jours fériés, vacances et historique d'affluence.</p>`;
    $('#screen-agenda').innerHTML = h;
  }

  let toastTimer;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg; t.classList.add('on');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('on'), 2600);
  }

  // ---------- Saison 2025 réelle : calendrier, tendances, import/export du tableau
  const S0 = window.SAISON2025 || { noms: {}, zones: {}, lignes: [] };
  const NOM_VERS_ID = {};
  Object.keys(S0.noms).forEach((id) => { NOM_VERS_ID[S0.noms[id].toLowerCase()] = id; });
  const NIV_TXT = { vert: 0, orange: 1, rouge: 2, noir: 3, fluide: 0, 'chargé': 1, 'très chargé': 2, 'saturé': 3, 'peu de monde': 0, 'du monde': 1, 'beaucoup de monde': 2, '0': 0, '1': 1, '2': 2, '3': 3 };
  const TYPES = ['normal', 'opening', 'closing'];
  const MOIS_SAISON = [3, 4, 5, 6, 7, 8, 9];
  const JOURS_ORD = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

  function chargerSaison() {
    const perso = store.get('saison2025', null);
    const src = perso && perso.lignes ? perso : S0;
    return {
      perso: !!(perso && perso.lignes),
      lignes: src.lignes.map((r) => ({ date: r[0], lieu: r[1], soiree: r[2], type: r[3], djs: r[4], niveau: r[5], reel: !!r[6], notes: r[7] || '' }))
    };
  }
  let SAISON = chargerSaison();
  Object.assign(state, { annee: store.get('annee', 'annee'), vue25: 'cal', mois25: 7, jour25: '2025-08-15' });

  const nomLieu = (id) => S0.noms[id] || (lieux[id] && lieux[id].nom) || id;
  const zoneLieu = (id) => S0.zones[id] || 'Autre';
  const parJour = () => {
    const m = {};
    SAISON.lignes.forEach((r) => { (m[r.date] = m[r.date] || []).push(r); });
    return m;
  };
  // Niveau d'un jour façon Bison Futé : moyenne des soirées du jour, comparée au reste de la saison
  // (30 % des jours en vert, 30 % en orange, 25 % en rouge, 15 % en noir).
  const moyJour = (rs) => rs.reduce((a, r) => a + r.niveau, 0) / rs.length;
  let SEUILS = null;
  function seuils() {
    if (SEUILS) return SEUILS;
    const v = Object.values(parJour()).filter((rs) => rs.length >= 3).map(moyJour).sort((a, b) => a - b);
    const q = (p) => v.length ? v[Math.min(v.length - 1, Math.floor(p * v.length))] : 1;
    SEUILS = [q(0.3), q(0.6), q(0.85)];
    return SEUILS;
  }
  function niveauJour(rs) {
    if (!rs || !rs.length) return -1;
    const m = moyJour(rs), s = seuils();
    return m < s[0] ? 0 : m < s[1] ? 1 : m < s[2] ? 2 : 3;
  }
  const barres = (counts) => {
    const tot = counts.reduce((a, b) => a + b, 0) || 1;
    return `<span class="stack">${counts.map((c, i) => c ? `<i class="niv-${NIVEAUX[i].code}" style="width:${(c / tot * 100).toFixed(1)}%" title="${NIVEAUX[i].label} : ${c}"></i>` : '').join('')}</span>`;
  };

  // Saison d'une destination : calendrier jour par jour + tendances, comme la saison 2025 d'Ibiza.
  // 2025 = programme réel ; 2026 = démo (2025 recopié sur le même jour de la semaine) ;
  // Prévisions = la même programmation projetée sur les prochaines dates à venir.
  const decaleJours = (d, n) => { const x = new Date(d + 'T12:00:00'); x.setDate(x.getDate() + n); return iso(x); };
  function dateProjetee(r, an) {
    const fixe = /réveillon/i.test(r[2]);
    if (an === '2025') return r[0];
    if (an === '2026') return fixe ? (+r[0].slice(0, 4) + 1) + r[0].slice(4) : decaleJours(r[0], 364);
    const auj = iso(new Date());
    for (let k = 1; k < 6; k++) { const d = fixe ? (+r[0].slice(0, 4) + k) + r[0].slice(4) : decaleJours(r[0], 364 * k); if (d >= auj) return d; }
    return r[0];
  }
  function lignesMonde(an) {
    const sm = SM(); if (!sm) return [];
    return sm.lignes.map((r) => ({ date: dateProjetee(r, an), lieu: r[1], soiree: r[2], type: r[3], djs: r[4], niveau: r[5] }));
  }
  function renderSaisonMonde(an, vueSaison) {
    state.smVue = vueSaison || 'cal';
    const sm = SM(), d = DEST[state.dest], ls = lignesMonde(an), pj = {};
    ls.forEach((r) => { (pj[r.date] = pj[r.date] || []).push(r); });
    const jours = Object.keys(pj).sort();
    const cle = state.dest + an;
    if (state.smCle !== cle) { state.smCle = cle; const auj = iso(new Date()); const j0 = an === 'prev' ? jours.find((k) => k >= auj) : jours.find((k) => pj[k].some((r) => r.niveau >= 2)) || jours[0]; state.smJour = j0; state.smMois = j0 ? new Date(j0 + 'T12:00:00').getMonth() : MOIS_NOW; state.smAn = j0 ? +j0.slice(0, 4) : new Date().getFullYear(); }
    let h = toggleAnnee() + `${an === '2026' ? `<p class="conseil sm-titre">Saison 2026 · ${esc(d.nom)}</p>` : ''}
      <div class="legende">${NIVEAUX.map((n) => `<span><i class="niv-dot niv-${n.code}"></i>${n.label}</span>`).join('')}</div>`;
    if (an === 'prev') h += `<p class="conseil">Prévisions pour ${esc(d.nom)} : les prochaines dates, d'après la programmation de la saison passée.</p>`;
    h += (state.smVue === 'tend') ? tendancesMonde(ls, sm) : calMonde(an, pj, jours, sm, d);
    h += `<div class="section-title">Ces données</div><p class="conseil">${ls.length} soirées sur ${jours.length} jours.${state.dest === 'ibiza' ? ' <button class="lien-demo" data-annee="2025">Voir la saison 2025 d\'origine (télécharger, importer ton tableau)</button>' : ''}</p>
      <p class="demo-note">${esc(sm.source)}${an === '2025' ? '' : ' <b>Démo :</b> c\'est le programme 2025 recopié sur le même jour de la semaine (le Réveillon reste le 31 décembre), pour voir comment l\'appli fonctionne. Les vraies dates le remplaceront.'} L'affluence est une estimation (taille du lieu, têtes d'affiche, mois, jour), pas une mesure.</p>`;
    $('#screen-agenda').innerHTML = h;
  }
  function calMonde(an, pj, jours, sm, d) {
    const ABR = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
    const moisListe = [...new Set(jours.map((k) => k.slice(0, 7)))].sort(), annees = new Set(moisListe.map((k) => k.slice(0, 4)));
    const mm = state.smAn + '-' + String(state.smMois + 1).padStart(2, '0');
    let h = `<div class="mois-grille sm-mois" role="group" aria-label="Mois">${moisListe.map((k) => { const [y, m] = k.split('-').map(Number);
        return `<button class="mois-btn ${k === mm ? 'on' : ''}" data-sm-mois="${k}" aria-pressed="${k === mm}">${ABR[m - 1]}${annees.size > 1 ? ' ' + y : ''}</button>`; }).join('')}</div>
      <div class="cal" role="grid" aria-label="Calendrier ${MOIS[state.smMois]} ${state.smAn}">${JOURS.map((j) => `<div class="cal-h">${j}</div>`).join('')}`;
    const premier = new Date(state.smAn, state.smMois, 1), decal = (premier.getDay() + 6) % 7, nb = new Date(state.smAn, state.smMois + 1, 0).getDate();
    for (let i = 0; i < decal; i++) h += '<span></span>';
    for (let j = 1; j <= nb; j++) {
      const key = iso(new Date(state.smAn, state.smMois, j)), rs = pj[key], n = rs ? Math.max(...rs.map((r) => r.niveau)) : -1;
      const evt = rs && rs.some((r) => r.type === 2) ? 'closing' : rs && rs.some((r) => r.type === 1) ? 'opening' : '';
      h += n < 0 ? `<span class="cal-d vide"><span class="cal-n">${j}</span></span>`
        : `<button class="cal-d niv-${NIVEAUX[n].code} ${state.smJour === key ? 'sel' : ''}" data-sm-jour="${key}" aria-label="${j} ${MOIS[state.smMois]} : ${rs.length} soirée${rs.length > 1 ? 's' : ''}"><span class="cal-n">${j}</span><span class="cal-icons">${evt ? '<i class="ev"></i>' : ''}${rs.length > 1 ? `<b class="sm-nb">${rs.length}</b>` : ''}</span></button>`;
    }
    h += '</div>';
    const rs = (pj[state.smJour] || []).slice().sort((a, b) => b.niveau - a.niveau);
    if (rs.length) {
      const dj = new Date(state.smJour + 'T12:00:00');
      h += `<div class="jour"><div class="jour-top"><div><div class="jour-titre">${JOURS_LONGS[(dj.getDay() + 6) % 7]} ${dj.getDate()} ${MOIS[dj.getMonth()]} ${dj.getFullYear()}</div>
        <div class="jour-ev">${rs.length} soirée${rs.length > 1 ? 's' : ''} à ${esc(d.nom)}${an === '2025' ? '' : an === 'prev' ? ' · prévision' : ' · démo'}</div></div>${pastille(Math.max(...rs.map((r) => r.niveau)))}</div><div class="jour-lieux">`;
      rs.forEach((r) => {
        h += `<div class="jl"><span class="jl-g"><span class="venue">${esc(sm.noms[r.lieu] || r.lieu)}${r.type ? ` <span class="badge ${r.type === 2 ? 'b-soon' : 'b-ok'}">${TYPES[r.type]}</span>` : ''}</span>
          ${r.soiree ? `<small>${esc(r.soiree)}</small>` : ''}<small class="djs">${r.djs ? lienDjs(r.djs) : 'DJ non annoncés'}</small></span>
          <span style="display:flex;flex-direction:column;align-items:flex-end;gap:4px">${pastille(r.niveau, true)}<small class="src">estimé</small></span></div>`;
      });
      h += '</div></div>';
    }
    return h;
  }
  function tendancesMonde(L, sm) {
    if (!L.length) return '<div class="empty">Pas encore de soirées relevées.</div>';
    const grp = (keyFn, ordre) => { const g = {}; L.forEach((r) => { const k = keyFn(r); (g[k] = g[k] || [0, 0, 0, 0])[r.niveau]++; });
      return (ordre || Object.keys(g)).filter((k) => g[k]).map((k) => ({ k, c: g[k], n: g[k].reduce((a, b) => a + b, 0), plein: (g[k][2] + g[k][3]) / g[k].reduce((a, b) => a + b, 0) })); };
    const bloc = (titre, items, lab) => `<div class="section-title">${titre} <small>soirées · % pleines</small></div><div class="tend">` +
      items.map((x) => `<div class="tl"><span class="tl-k">${lab(x.k)}</span>${barres(x.c)}<span class="tl-v">${x.n} · ${Math.round(x.plein * 100)} %</span></div>`).join('') + '</div>';
    const mois = grp((r) => r.date.slice(0, 7)).sort((a, b) => a.k.localeCompare(b.k));
    const jours = grp((r) => (new Date(r.date + 'T12:00:00').getDay() + 6) % 7, ['0', '1', '2', '3', '4', '5', '6']);
    const lieuxT = grp((r) => r.lieu).sort((a, b) => b.plein - a.plein || b.n - a.n);
    const djCount = {}; L.forEach((r) => { const t = (r.djs || '').split(',')[0].trim(); if (t) t.split(/\s+B2B\s+/i).forEach((x) => { djCount[x] = (djCount[x] || 0) + 1; }); });
    const topDj = Object.entries(djCount).sort((a, b) => b[1] - a[1]).slice(0, 10), maxDj = topDj.length ? topDj[0][1] : 1;
    const mj = jours.slice().sort((a, b) => b.plein - a.plein)[0];
    let h = `<p class="conseil">Les soirées les plus pleines tombent le <b>${JOURS_ORD[+mj.k].toLowerCase()}</b> (${Math.round(mj.plein * 100)} % de soirées rouges ou noires).</p>`;
    h += bloc('Par mois', mois, (k) => { const [y, m] = k.split('-').map(Number); return Maj(MOIS[m - 1]) + ' ' + y; });
    h += bloc('Par jour de la semaine', jours, (k) => JOURS_ORD[+k]);
    h += bloc('Par lieu', lieuxT, (k) => esc(sm.noms[k] || k));
    h += `<div class="section-title">DJ les plus présents <small>soirées en tête d'affiche</small></div><div class="tend">` + topDj.map(([n, c]) =>
      `<div class="tl"><span class="tl-k">${lienDjs(n)}</span><span class="stack"><i class="niv-orange" style="width:${(c / maxDj * 100).toFixed(0)}%"></i></span><span class="tl-v">${c}</span></div>`).join('') + '</div>';
    return h;
  }
  document.addEventListener('click', (e) => {
    const an = state.annee === 'prev' ? 'prev' : '2026', vu = state.annee === 'tend' ? 'tend' : 'cal';
    const m = e.target.closest('[data-sm-mois]'); if (m) { const [y, mo] = m.dataset.smMois.split('-').map(Number); state.smAn = y; state.smMois = mo - 1; renderSaisonMonde(an, vu); return; }
    const j = e.target.closest('[data-sm-jour]'); if (j) { state.smJour = j.dataset.smJour; renderSaisonMonde(an, vu); return; }
  });

  function renderSaison() {
    const vue = (k, l) => `<button class="seg ${state.vue25 === k ? 'on' : ''}" data-vue25="${k}" aria-pressed="${state.vue25 === k}">${l}</button>`;
    let h = toggleAnnee() + `<div class="segs" role="group" aria-label="Affichage" style="margin-top:8px">${vue('cal', 'Calendrier')}${vue('tend', 'Tendances')}</div>
      <div class="legende">${NIVEAUX.map((n) => `<span><i class="niv-dot niv-${n.code}"></i>${n.label}</span>`).join('')}</div>`;
    h += state.vue25 === 'tend' ? renderTendances() : renderCal25();
    h += `<div class="section-title">Tes données</div>
      <p class="conseil">${SAISON.lignes.length} soirées sur ${Object.keys(parJour()).length} jours${SAISON.perso ? ', <b>ton tableau importé</b>' : ', données d\'origine'}. Ouvre le tableau dans Numbers ou Excel, remplis la colonne <b>affluence_reelle</b> (vert, orange, rouge ou noir) avec ce que tu sais, puis réimporte-le : tes valeurs remplacent l'estimation.</p>
      <div class="actions-25">
        <button class="alerte" data-export25="1">Télécharger le tableau</button>
        <label class="alerte import">Importer mon tableau<input type="file" accept=".csv,text/csv" id="import25" hidden></label>
        ${SAISON.perso ? '<button class="alerte" data-reset25="1">Revenir aux données d\'origine</button>' : ''}
      </div>
      <p class="demo-note">Programme réel de la saison 2025 (calendrier Ibiza Spotlight, du 25 avril au 18 octobre ; DC10, Café Mambo, Café del Mar et Blue Marlin n'y figurent pas). L'affluence est une estimation (taille du lieu, mois, jour, têtes d'affiche, opening ou closing), pas une mesure, tant que tu ne la remplaces pas par tes données.</p>`;
    $('#screen-agenda').innerHTML = h;
  }

  function renderCal25() {
    const pj = parJour();
    const m = state.mois25;
    const ABR = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
    const actifs = new Set(Object.keys(pj).map((k) => +k.slice(5, 7) - 1));
    const nav = ABR.map((ab, x) => `<button class="mois-btn ${x === m ? 'on' : ''} ${actifs.has(x) ? '' : 'hors'}" data-mois25="${x}" aria-pressed="${x === m}" aria-label="${MOIS[x]} 2025${actifs.has(x) ? '' : ', hors saison'}">${ab}</button>`).join('');
    let h = `<div class="mois-grille" role="group" aria-label="Mois">${nav}</div>
      ${actifs.has(m) ? '' : '<p class="conseil hors-saison">Hors saison : pas de soirée relevée ce mois-ci. La saison 2025 va du 25 avril au 18 octobre.</p>'}
      <div class="cal" role="grid" aria-label="Calendrier ${MOIS[m]} 2025">${JOURS.map((j) => `<div class="cal-h">${j}</div>`).join('')}`;
    const premier = new Date(2025, m, 1), decal = (premier.getDay() + 6) % 7, nb = new Date(2025, m + 1, 0).getDate();
    for (let i = 0; i < decal; i++) h += '<span></span>';
    for (let d = 1; d <= nb; d++) {
      const key = iso(new Date(2025, m, d)), rs = pj[key], n = niveauJour(rs);
      const evt = rs && rs.some((r) => r.type === 2) ? 'closing' : rs && rs.some((r) => r.type === 1) ? 'opening' : '';
      h += n < 0 ? `<span class="cal-d vide" aria-label="${d} : pas de données"><span class="cal-n">${d}</span></span>`
        : `<button class="cal-d niv-${NIVEAUX[n].code} ${state.jour25 === key ? 'sel' : ''}" data-jour25="${key}" aria-label="${d} ${MOIS[m]} : ${NIVEAUX[n].label}${evt ? ', ' + evt : ''}">
          <span class="cal-n">${d}</span><span class="cal-icons">${evt ? '<i class="ev" title="' + evt + '"></i>' : ''}</span></button>`;
    }
    h += '</div>';
    const rs = (pj[state.jour25] || []).slice().sort((a, b) => b.niveau - a.niveau);
    if (rs.length) {
      const d = new Date(state.jour25 + 'T12:00:00');
      h += `<div class="jour"><div class="jour-top"><div><div class="jour-titre">${JOURS_LONGS[(d.getDay() + 6) % 7]} ${d.getDate()} ${MOIS[d.getMonth()]} 2025</div>
        <div class="jour-ev">${rs.length} soirées</div></div>${pastille(niveauJour(rs))}</div><div class="jour-lieux">`;
      rs.forEach((r) => {
        h += `<div class="jl"><span class="jl-g"><span class="venue">${esc(nomLieu(r.lieu))}${r.type ? ` <span class="badge ${r.type === 2 ? 'b-soon' : 'b-ok'}">${TYPES[r.type]}</span>` : ''}</span>
          <small>${esc(r.soiree)}</small><small class="djs">${r.djs ? lienDjs(r.djs) : 'DJ non annoncés'}</small>
          ${r.notes ? `<small>Note : ${esc(r.notes)}</small>` : ''}</span>
          <span style="display:flex;flex-direction:column;align-items:flex-end;gap:4px">${pastille(r.niveau, true)}<small class="src">${r.reel ? 'ta donnée' : 'estimé'}</small></span></div>`;
      });
      h += '</div></div>';
    }
    return h;
  }

  function renderTendances() {
    const L = SAISON.lignes;
    const grp = (keyFn, ordre) => {
      const g = {};
      L.forEach((r) => { const k = keyFn(r); (g[k] = g[k] || [0, 0, 0, 0])[r.niveau]++; });
      return (ordre || Object.keys(g)).filter((k) => g[k]).map((k) => ({ k, c: g[k], n: g[k].reduce((a, b) => a + b, 0), plein: (g[k][2] + g[k][3]) / g[k].reduce((a, b) => a + b, 0) }));
    };
    const bloc = (titre, sous, items, lab) => `<div class="section-title">${titre} <small>${sous}</small></div><div class="tend">` +
      items.map((x) => `<div class="tl"><span class="tl-k">${lab(x.k)}</span>${barres(x.c)}<span class="tl-v">${x.n} · ${Math.round(x.plein * 100)} %</span></div>`).join('') + '</div>';
    const mois = grp((r) => +r.date.slice(5, 7) - 1, MOIS_SAISON.map(String)).map((x) => ({ ...x, k: +x.k }));
    const jours = grp((r) => (new Date(r.date + 'T12:00:00').getDay() + 6) % 7, [0, 1, 2, 3, 4, 5, 6].map(String));
    const zones = grp((r) => zoneLieu(r.lieu)).sort((a, b) => b.plein - a.plein);
    const lieuxT = grp((r) => r.lieu).sort((a, b) => b.plein - a.plein || b.n - a.n);
    // Têtes d'affiche : le premier nom annoncé de chaque soirée (B2B séparés)
    const djCount = {};
    L.forEach((r) => {
      const tete = r.djs.split(',')[0].trim();
      if (tete) tete.split(/\s+B2B\s+/i).forEach((d) => { djCount[d] = (djCount[d] || 0) + 1; });
    });
    const topDj = Object.entries(djCount).sort((a, b) => b[1] - a[1]).slice(0, 12);
    const maxDj = topDj.length ? topDj[0][1] : 1;
    const meilleurJour = jours.slice().sort((a, b) => b.plein - a.plein)[0];
    const meilleurMois = mois.slice().sort((a, b) => b.plein - a.plein)[0];
    let h = `<p class="conseil">Les soirées les plus pleines tombent le <b>${JOURS_ORD[+meilleurJour.k].toLowerCase()}</b> (${Math.round(meilleurJour.plein * 100)} % de soirées rouges ou noires) et au mois d'<b>${MOIS[meilleurMois.k]}</b>. Chaque barre montre la part de soirées avec peu de monde, du monde, beaucoup de monde ou saturées. Le chiffre indique le nombre de soirées, puis la part de soirées pleines.</p>`;
    h += bloc('Par mois', 'soirées · % pleines', mois, (k) => MOIS[k].charAt(0).toUpperCase() + MOIS[k].slice(1));
    h += bloc('Par jour de la semaine', 'soirées · % pleines', jours, (k) => JOURS_ORD[+k]);
    h += bloc('Par zone', 'de la plus pleine à la plus calme', zones, (k) => esc(k));
    h += bloc('Par lieu', 'de la plus pleine à la plus calme', lieuxT, (k) => esc(nomLieu(k)));
    h += `<div class="section-title">Têtes d'affiche les plus programmées <small>nombre de dates</small></div><div class="tend">` +
      topDj.map(([d, n]) => `<div class="tl"><span class="tl-k">${lienDj1(d)}</span><span class="stack"><i class="dj-bar" style="width:${(n / maxDj * 100).toFixed(1)}%" title="${esc(d)} : ${n} dates"></i></span><span class="tl-v">${n}</span></div>`).join('') + '</div>';
    return h;
  }

  // Lecture d'un CSV (séparateur ; ou ,) avec guillemets
  function lireCSV(txt) {
    txt = txt.replace(/^﻿/, '');
    const sep = (txt.split('\n')[0].match(/;/g) || []).length >= (txt.split('\n')[0].match(/,/g) || []).length ? ';' : ',';
    const out = []; let row = [], cell = '', q = false;
    for (let i = 0; i < txt.length; i++) {
      const c = txt[i];
      if (q) { if (c === '"' && txt[i + 1] === '"') { cell += '"'; i++; } else if (c === '"') q = false; else cell += c; }
      else if (c === '"') q = true;
      else if (c === sep) { row.push(cell); cell = ''; }
      else if (c === '\n' || c === '\r') { if (c === '\r' && txt[i + 1] === '\n') i++; row.push(cell); out.push(row); row = []; cell = ''; }
      else cell += c;
    }
    if (cell || row.length) { row.push(cell); out.push(row); }
    return out.filter((r) => r.some((x) => x.trim()));
  }

  function importer(fichier) {
    const fr = new FileReader();
    fr.onload = () => {
      try {
        const rows = lireCSV(String(fr.result));
        const tete = rows.shift().map((x) => x.trim().toLowerCase());
        const col = (n) => tete.indexOf(n);
        const need = ['date', 'lieu', 'soiree'];
        if (need.some((n) => col(n) < 0)) { toast('Colonnes manquantes : date, lieu, soiree'); return; }
        const lignes = [];
        rows.forEach((r) => {
          const nom = (r[col('lieu')] || '').trim();
          const id = NOM_VERS_ID[nom.toLowerCase()] || nom.toLowerCase().replace(/[^a-z0-9]+/g, '');
          if (!S0.noms[id] && nom) S0.noms[id] = nom;
          if (col('zone') >= 0 && r[col('zone')] && !S0.zones[id]) S0.zones[id] = r[col('zone')].trim();
          const reelle = col('affluence_reelle') >= 0 ? (r[col('affluence_reelle')] || '').trim().toLowerCase() : '';
          const estimee = col('affluence_estimee') >= 0 ? (r[col('affluence_estimee')] || '').trim().toLowerCase() : '';
          const niv = NIV_TXT[reelle] ?? NIV_TXT[estimee] ?? 0;
          const type = Math.max(0, TYPES.indexOf((r[col('type')] || 'normal').trim().toLowerCase()));
          const date = (r[col('date')] || '').trim();
          if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return;
          lignes.push([date, id, (r[col('soiree')] || '').trim(), type, col('djs') >= 0 ? (r[col('djs')] || '').trim() : '', niv, NIV_TXT[reelle] !== undefined, col('notes') >= 0 ? (r[col('notes')] || '').trim() : '']);
        });
        if (!lignes.length) { toast('Aucune ligne lisible dans ce fichier'); return; }
        store.set('saison2025', { lignes });
        SAISON = chargerSaison(); SEUILS = null; INDEX_DJ = null;
        renderSaison();
        toast(lignes.length + ' soirées importées');
      } catch (err) { toast('Impossible de lire ce fichier'); }
    };
    fr.readAsText(fichier, 'utf-8');
  }

  function exporter() {
    const JRS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
    const cel = (v) => /[;"\n]/.test(v) ? '"' + String(v).replace(/"/g, '""') + '"' : v;
    const lignes = [['date', 'jour', 'lieu', 'zone', 'soiree', 'type', 'djs', 'affluence_estimee', 'affluence_reelle', 'notes'].join(';')];
    SAISON.lignes.forEach((r) => {
      const wd = (new Date(r.date + 'T12:00:00').getDay() + 6) % 7;
      lignes.push([r.date, JRS[wd], nomLieu(r.lieu), zoneLieu(r.lieu), r.soiree, TYPES[r.type], r.djs, r.reel ? '' : NIVEAUX[r.niveau].code, r.reel ? NIVEAUX[r.niveau].code : '', r.notes].map(cel).join(';'));
    });
    const blob = new Blob(['﻿' + lignes.join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'saison-2025.csv';
    document.body.appendChild(a); a.click(); a.remove();
  }

  function clicSaison(e) {
    const an = e.target.closest('[data-annee]');
    if (an) { state.annee = an.dataset.annee; store.set('annee', state.annee); renderAgenda(); return true; }
    if (state.annee === 'annee') return clicAnnee(e);
    if (state.annee !== '2025') return false;
    const v = e.target.closest('[data-vue25]');
    if (v) { state.vue25 = v.dataset.vue25; renderSaison(); return true; }
    const mo = e.target.closest('[data-mois25]');
    if (mo) {
      state.mois25 = +mo.dataset.mois25;
      const jours = Object.keys(parJour()).filter((k) => +k.slice(5, 7) - 1 === state.mois25).sort();
      state.jour25 = jours[0] || null;
      renderSaison(); return true;
    }
    const j = e.target.closest('[data-jour25]');
    if (j) { state.jour25 = j.dataset.jour25; renderSaison(); return true; }
    if (e.target.closest('[data-export25]')) { exporter(); return true; }
    if (e.target.closest('[data-reset25]')) { try { localStorage.removeItem('setly.saison2025'); } catch (err) { /* */ } SAISON = chargerSaison(); SEUILS = null; INDEX_DJ = null; renderSaison(); toast('Données d\'origine rétablies'); return true; }
    return e.target.closest('label.import') ? true : false;
  }
  document.addEventListener('change', (e) => { if (e.target.id === 'import25' && e.target.files[0]) importer(e.target.files[0]); });

  function clicAgenda(e) {
    const sd = e.target.closest('[data-sud-dep]');
    if (sd) { state.sudDep = sd.dataset.sudDep; renderAgendaSud(); return true; }
    const st = e.target.closest('[data-sud-type]');
    if (st) { state.sudType = st.dataset.sudType; listeAgendaSud(); return true; }
    if (clicSaison(e)) return true;
    const env = e.target.closest('[data-envie]');
    if (env) { state.envie = env.dataset.envie; store.set('envie', state.envie); renderAgenda(); return true; }
    const sej = e.target.closest('[data-sejour]');
    if (sej) { state.choixSejour = []; renderAgenda(); toast('Touche ton jour d\'arrivée dans le calendrier'); return true; }
    const jr = e.target.closest('[data-jour]');
    if (jr) {
      const k = jr.dataset.jour;
      if (state.choixSejour) {
        state.choixSejour.push(k);
        if (state.choixSejour.length === 1) toast('Maintenant, touche ton jour de départ');
        if (state.choixSejour.length === 2) {
          state.sejour = state.choixSejour.sort(); state.choixSejour = null; store.set('sejour', state.sejour);
          toast('Séjour enregistré : ton programme jour par jour est en dessous');
          state.jour = k; renderAgenda();
          setTimeout(() => { const t = document.getElementById('ton-sejour'); if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 80);
          return true;
        }
      }
      state.jour = k; renderAgenda(); return true;
    }
    const al = e.target.closest('[data-alerte]');
    if (al) {
      const k = al.dataset.alerte;
      if (state.alertes[k]) delete state.alertes[k]; else state.alertes[k] = true;
      store.set('alertes', state.alertes);
      renderAgenda();
      toast(state.alertes[k] ? 'Alerte activée : notification la veille au soir' : 'Alerte retirée');
      return true;
    }
    const jl = e.target.closest('[data-lieu-jour]');
    if (jl) {
      if (jl.dataset.jourLieu === '2026-10-01') ouvrirLieu(jl.dataset.lieuJour);
      else toast('Line-up pas encore publié pour ce soir-là');
      return true;
    }
    return false;
  }

  // ---------- Profil et niveaux (Disque → Casque → Platine → DJ, chacun en bronze, argent, or)
  const OBJETS = [
    { nom: 'Disque', icone: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r=".6"/>' },
    { nom: 'Casque', icone: '<path d="M4 15v-3a8 8 0 0 1 16 0v3"/><rect x="3" y="14" width="4" height="6" rx="1.5"/><rect x="17" y="14" width="4" height="6" rx="1.5"/>' },
    { nom: 'Platine', icone: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="10" cy="12" r="4"/><circle cx="10" cy="12" r="1"/><path d="M17 8v7"/>' },
    { nom: 'Cabine', icone: '<path d="M3 11h18v9H3z"/><circle cx="8" cy="7" r="3"/><circle cx="16" cy="7" r="3"/><path d="M7 15h10"/>' }
  ];
  const METAUX = [
    { nom: 'bronze', couleur: '#C98A55' },
    { nom: 'argent', couleur: '#C9CED6' },
    { nom: 'or', couleur: '#F2C94C' }
  ];
  const NIVEAUX_PROFIL = [];
  OBJETS.forEach((o, i) => METAUX.forEach((m, j) => NIVEAUX_PROFIL.push({ objet: o, metal: m, rang: i * 3 + j })));
  const PALIERS = [0, 50, 110, 190, 280, 380, 500, 650, 830, 1030, 1250, 1500];
  // Destinations : chaque secteur a sa saison, l'appli travaille toute l'année
  const DESTINATIONS = [
    { id: 'ibiza', nom: 'Ibiza', saison: 'mai à octobre' },
    { id: 'mykonos', nom: 'Mykonos', saison: 'juin à septembre' },
    { id: 'tulum', nom: 'Tulum', saison: 'décembre à avril' },
    { id: 'miami', nom: 'Miami', saison: 'hiver et Miami Music Week en mars' },
    { id: 'dubai', nom: 'Dubaï', saison: 'novembre à avril' }
  ];
  const nomDest = (p) => p.ville ? p.ville : p.destination === 'autre' ? (p.destinationAutre || 'Ailleurs') : (DESTINATIONS.find((d) => d.id === p.destination) || {}).nom || '';
  const STYLES = ['House', 'Tech house', 'Techno', 'Afro house', 'Melodic', 'Disco & funk', 'EDM', 'Trance', 'Latino'];
  // Tous les genres (inspirés des catégories SoundCloud), en cartes illustrées qu'on fait défiler
  const GENRES = ['House', 'Deep house', 'Tech house', 'Techno', 'Hard techno', 'Melodic', 'Afro house', 'Amapiano', 'Minimal', 'Progressive', 'Trance', 'Disco & funk', 'Nu disco', 'EDM', 'Dance', 'Drum & bass', 'Dubstep', 'Bass music', 'UK garage', 'Électro', 'Ambient', 'Hip-hop & rap', 'Trap', 'R&B & soul', 'Pop', 'Latino', 'Reggaeton', 'Dancehall', 'Reggae', 'Afrobeats', 'Rock', 'Indie', 'Metal', 'Jazz & blues', 'Classique', 'Musiques du monde', 'Lo-fi'];
  const _visuG = {};
  function visuGenre(g) {
    if (_visuG[g]) return _visuG[g];
    let h = 5; for (const ch of g) h = (h * 33 + ch.charCodeAt(0)) >>> 0;
    const pals = [['#FF4FA3', '#7B2FFF'], ['#FF8A3D', '#FF2D55'], ['#3DD6C6', '#1E6FFF'], ['#F2C53A', '#FF6B00'], ['#B23DFF', '#1E0A3C'], ['#00E5FF', '#7B2FFF'], ['#3DF28A', '#0A6B5C'], ['#FF2D55', '#2A0010']];
    const t = g.toLowerCase(), c = /techno|minimal|hard|metal/.test(t) ? pals[4] : /house|disco|funk|garage/.test(t) ? pals[1] : /afro|amapiano|reggae|dancehall|latino|monde/.test(t) ? pals[3] : /rap|trap|r&b/.test(t) ? pals[5] : /trance|progressive|melodic|ambient|lo-fi/.test(t) ? pals[2] : /drum|dubstep|bass|électro/.test(t) ? pals[6] : /rock|indie|pop/.test(t) ? pals[0] : pals[h % 8];
    const m = h % 4;
    const motif = m === 0 ? Array.from({ length: 14 }, (_, i) => { const hh = 8 + ((h >> (i % 16)) % 34); return `<rect x="${6 + i * 8}" y="${70 - hh}" width="5" height="${hh}" rx="2" fill="#fff" opacity=".55"/>`; }).join('')
      : m === 1 ? [18, 30, 42, 54].map((r) => `<circle cx="98" cy="20" r="${r}" fill="none" stroke="#fff" stroke-width="2.5" opacity="${0.6 - r / 120}"/>`).join('')
      : m === 2 ? `<path d="M0 52 L14 38 L28 56 L42 30 L56 50 L70 26 L84 46 L98 22 L120 40" fill="none" stroke="#fff" stroke-width="3" opacity=".55" stroke-linejoin="round"/>`
      : `<circle cx="96" cy="30" r="22" fill="none" stroke="#fff" stroke-width="10" opacity=".25"/><circle cx="96" cy="30" r="5" fill="#fff" opacity=".7"/>` + `<path d="M0 64 Q30 40 60 64 T120 60" fill="none" stroke="#fff" stroke-width="2" opacity=".4"/>`;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 80"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c[0]}"/><stop offset="1" stop-color="${c[1]}"/></linearGradient></defs><rect width="120" height="80" fill="url(#g)"/>${motif}<rect width="120" height="80" fill="url(#g)" opacity=".15"/></svg>`;
    return (_visuG[g] = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg));
  }
  function cartesGenres(nom, choisis, type, liste) {
    const sel = choisis || [];
    return `<div class="genres-rang">${(liste || GENRES).map((g) => { const on = sel.includes(g);
      return `<label class="genre-carte ${on ? 'on' : ''}" style="--gi:url('${visuGenre(g)}')"><input type="${type || 'checkbox'}" name="${nom}" value="${esc(g)}" ${on ? 'checked' : ''} hidden><span>${esc(g)}</span><i class="gc-coche" aria-hidden="true"></i></label>`; }).join('')}</div>`;
  }
  document.addEventListener('change', (e) => {
    const c = e.target.closest('.genre-carte'); if (!c) return;
    c.closest('.genres-rang').querySelectorAll('.genre-carte').forEach((l) => l.classList.toggle('on', l.querySelector('input').checked));
  });

  Object.assign(state, { profil: store.get('profil', null), compte: store.get('compte', null), editProfil: false, modeEmail: false, rappelCompte: store.get('rappelCompte', false) });
  const FOURNISSEURS = { apple: 'Apple', google: 'Google', email: 'email' };

  // Écran de connexion : Apple, Google, ou email. Démo : la connexion est simulée.
  function ecranConnexion() {
    return `<div class="connexion">
      <label class="langue-ligne"><span>${T('langue')}</span>${selectLangue()}</label>
      <div class="section-title">${T('creer_compte')}</div>
      <div class="carte-banger"><div class="cb-tete"><span class="cb-titre">Profil Banger</span></div>
      <p class="conseil spotters" style="margin:6px 0 0"><b>Deviens Banger.</b> Les Bangers, c'est la communauté qui fait vivre la carte : ils repèrent qui joue, confirment sur place et notent les sets. Chaque contribution te fait monter, de Disque bronze jusqu'au Graal.</p></div>
      <p class="conseil">Un compte garde tes DJ, tes alertes et ta progression, même si tu changes de téléphone. Un seul toucher, pas de mot de passe.</p>
      <button class="btn-compte apple" data-connexion="apple">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M16.4 12.6c0-2.5 2-3.6 2.1-3.7-1.2-1.7-3-1.9-3.6-2-1.5-.2-3 .9-3.8.9-.8 0-2-.9-3.3-.9-1.7 0-3.3 1-4.1 2.5-1.8 3.1-.5 7.6 1.3 10.1.8 1.2 1.8 2.6 3.1 2.5 1.3-.1 1.7-.8 3.3-.8s1.9.8 3.3.8c1.4 0 2.2-1.2 3-2.4.9-1.4 1.3-2.7 1.3-2.8-.1 0-2.6-1-2.6-4.2zM14 5.1c.7-.8 1.1-1.9 1-3.1-1 0-2.2.7-2.9 1.5-.6.7-1.2 1.9-1 3 1.1.1 2.2-.6 2.9-1.4z"/></svg>
        ${T('avec_apple')}</button>
      <button class="btn-compte google" data-connexion="google">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M22.6 12.2c0-.8-.1-1.5-.2-2.2H12v4.2h5.9c-.3 1.4-1 2.5-2.2 3.3v2.7h3.6c2.1-1.9 3.3-4.7 3.3-8z"/><path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.6-2.7c-1 .7-2.2 1.1-3.7 1.1-2.9 0-5.3-1.9-6.2-4.5H2.1v2.8C3.9 20.6 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.8 14.2c-.2-.7-.4-1.4-.4-2.2s.1-1.5.4-2.2V7H2.1C1.4 8.5 1 10.2 1 12s.4 3.5 1.1 5l3.7-2.8z"/><path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.2-3.2C17.5 2.1 15 1 12 1 7.7 1 3.9 3.4 2.1 7l3.7 2.8C6.7 7.3 9.1 5.4 12 5.4z"/></svg>
        ${T('avec_google')}</button>
      ${state.modeEmail ? `<form id="form-email" class="form-email" novalidate>
          <label class="champ"><span>Ton email</span><input class="search" type="email" name="email" placeholder="toi@exemple.com" autocomplete="email"></label>
          <p class="erreur" id="err-email" hidden>Entre une adresse email valide</p>
          <button type="submit" class="btn-plein">Continuer</button></form>`
        : '<button class="btn-compte email" data-connexion="email">' + T('avec_email') + '</button>'}
      <button class="lien-demo" data-plus-tard="1">${T('plus_tard')}</button>
      <p class="demo-note">Démo : la connexion est simulée. Dans l'appli, elle passera par Supabase (Apple, Google ou lien envoyé par email). Avec Apple, tu peux masquer ton adresse.</p>
    </div>`;
  }
  function connecter(fournisseur, email) {
    state.compte = {
      fournisseur,
      email: email || (fournisseur === 'apple' ? 'adresse masquée par Apple' : 'ton compte Google'),
      date: new Date().toISOString().slice(0, 10)
    };
    store.set('compte', state.compte);
    state.modeEmail = false;
    renderProfil();
    toast('Compte créé avec ' + FOURNISSEURS[fournisseur] + ' : choisis ton pseudo');
  }
  // Rappel discret, une seule fois, au premier geste qui mérite d'être sauvegardé
  function rappelCompte() { return; // Prototype 2 : pas de rappel d'inscription

    if (state.compte || state.rappelCompte) return;
    state.rappelCompte = true; store.set('rappelCompte', true);
    setTimeout(() => toast('Crée ton compte (onglet Profil) pour ne pas perdre ta progression'), 2800);
  }

  function points() {
    const mes = passages.filter((p) => monVote(p));
    const confirms = mes.filter(monVoteValide).length;
    return {
      confirms, attente: mes.length - confirms, mes,
      // Tout le monde démarre Disque bronze : seules les confirmations validées sur place font monter
      total: confirms * 10
    };
  }
  function niveauProfil(pts) {
    let i = 0;
    while (i + 1 < PALIERS.length && pts >= PALIERS[i + 1]) i++;
    return i;
  }
  const badgeNiveau = (n, taille) => `<span class="medaille" style="--m:${n.metal.couleur};width:${taille}px;height:${taille}px" aria-hidden="true">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${n.objet.icone}</svg></span>`;
  const nomNiveau = (n) => `${n.objet.nom} ${n.metal.nom}`;

  // Photo ou avatar du profil Banger (facultatif)
  const AVATARS = ['🎧', '😎', '🪩', '🌴', '🔥', '🦩', '🐬', '🌙', '🍹', '👽'];
  // Avatars illustrés Banzic : 10 hommes, 10 femmes (choix dans le profil)
  const AV_ILLUS = { h: Array.from({ length: 10 }, (_, i) => 'h' + String(i + 1).padStart(2, '0')), f: Array.from({ length: 10 }, (_, i) => 'f' + String(i + 1).padStart(2, '0')) };
  const avIllus = (a) => /^av:[hf]\d\d$/.test(a || '') ? a.slice(3) : 'h01';
  function avatarHtml(photo, avatar, taille) {
    if (!photo && avIllus(avatar)) return `<span class="av-rond av-illus" style="width:${taille}px;height:${taille}px"><img src="avatars-banzic/${avIllus(avatar)}.jpg" alt=""></span>`;
    if (photo) return `<span class="av-rond" style="width:${taille}px;height:${taille}px"><img src="${photo}" alt=""></span>`;
    return `<span class="av-rond" style="width:${taille}px;height:${taille}px;font-size:${Math.round(taille * 0.52)}px">${avatar || '🎧'}</span>`;
  }
  function photoReduite(file) {
    return new Promise((ok, ko) => {
      const url = URL.createObjectURL(file), img = new Image();
      img.onload = () => {
        const t = 200, c = document.createElement('canvas'); c.width = c.height = t;
        const m = Math.min(img.naturalWidth, img.naturalHeight);
        c.getContext('2d').drawImage(img, (img.naturalWidth - m) / 2, (img.naturalHeight - m) / 2, m, m, 0, 0, t, t);
        URL.revokeObjectURL(url); ok(c.toDataURL('image/jpeg', 0.82));
      };
      img.onerror = () => { URL.revokeObjectURL(url); ko(); };
      img.src = url;
    });
  }
  function majApercuAvatar() {
    const f = document.getElementById('form-profil'); if (!f) return;
    const av = (f.querySelector('input[name="avatar"]:checked') || {}).value || '';
    $('#av-apercu').innerHTML = avatarHtml(state.photoTemp, av, 72);
    $('#av-retirer').hidden = !state.photoTemp;
  }

  function formProfil(p) {
    p = p || { pseudo: '', styles: [], langue: LANG, notifs: true, geoloc: true, presence: true, classement: true };
    state.photoTemp = p.photo || '';
    const coche = (id, label, aide, val) => `<label class="reglage"><span><b>${label}</b><small>${aide}</small></span>
      <input type="checkbox" name="${id}" ${val ? 'checked' : ''}><i class="interrupteur" aria-hidden="true"></i></label>`;
    return `<form id="form-profil" class="profil-form" novalidate>
      <div class="carte-banger"><div class="cb-tete"><span class="cb-titre">${state.profil ? 'Modifier mon profil Banger' : 'Créer mon profil Banger'}</span></div>
      ${state.profil ? '' : '<p class="conseil" style="margin:6px 0 0">Ton profil de Banger garde tes DJ, tes alertes et ta progression, de Disque bronze jusqu\'au Graal : Cabine or.</p>'}</div>
      <label class="champ"><span>Pseudo</span>
        <input class="search" name="pseudo" maxlength="20" value="${esc(p.pseudo)}" placeholder="nightowl_ibz" autocomplete="nickname"></label>
      <p class="erreur" id="err-pseudo" hidden>Choisis un pseudo d'au moins 2 caractères</p>
      <div class="champ"><span>Ta photo ou ton avatar <small class="aide">(si tu veux)</small></span>
        <div class="av-zone"><span id="av-apercu">${avatarHtml(p.photo, p.avatar, 72)}</span>
          <div class="av-actions"><label class="av-btn">📷 Choisir une photo<input type="file" accept="image/*" id="av-fichier" hidden></label>
          <button type="button" class="av-retirer" id="av-retirer" data-av-retirer="1" ${p.photo ? '' : 'hidden'}>Retirer la photo</button></div></div>
        ${[['h', 'Hommes'], ['f', 'Femmes']].map(([g, t]) => `<div class="av-rang-titre">${t}</div><div class="av-rang">${AV_ILLUS[g].map((id) => { const v = 'av:' + id, on = (avIllus(p.avatar) ? p.avatar : 'av:h01') === v; return `<label class="chip av-chip av-illus-chip ${on ? 'on' : ''}"><input type="radio" name="avatar" value="${v}" ${on ? 'checked' : ''} hidden><img src="avatars-banzic/${id}.jpg" alt="" loading="lazy"></label>`; }).join('')}</div>`).join('')}
        <small class="aide">Fais défiler et touche ton avatar, ou mets ta photo à la place.</small></div>
      <div class="champ" id="champ-styles"><span>Ce que tu aimes en musique <small class="aide">(un ou plusieurs)</small></span>
        ${cartesGenres('styles', p.styles)}
      <p class="erreur" id="err-styles" hidden>Choisis au moins un style</p></div>
      <label class="champ" id="champ-ville"><span>Ta ville <small class="aide">(obligatoire : c'est elle qui règle la carte et ce qui se passe autour de toi)</small></span>
        <span class="ville-ligne"><input class="search" name="ville" list="liste-villes-profil" maxlength="40" value="${esc(p.ville || '')}" placeholder="Toulon, Marseille, Ibiza…" autocomplete="address-level2">
        <button type="button" class="ville-gps" data-ville-gps="1" aria-label="Utiliser ma position"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 3 3 10.5l7.2 2.3L12.5 20z" fill="currentColor"/></svg>Ma position</button></span>
        <datalist id="liste-villes-profil">${(window.VILLES || []).map((v) => `<option value="${esc(v[0])}">`).join('')}</datalist></label>
      <p class="erreur" id="err-ville" hidden>Indique ta ville pour voir ce qui se passe autour de toi</p>
      <div class="section-title">Confidentialité</div>
      ${coche('notifs', 'Questions sur place', 'Le QCM rapide quand tu arrives dans un lieu, une fois par lieu', p.notifs)}
      ${coche('geoloc', 'Position en arrière-plan', 'Pour savoir qui joue autour de toi et t\'envoyer le QCM', p.geoloc)}
      ${coche('presence', 'Compter ma présence', 'Toujours anonyme : un +1 dans l\'affluence du lieu, jamais ton nom', p.presence)}
      ${coche('classement', 'Apparaître au classement', 'Ton pseudo et ton niveau dans le classement de la saison', p.classement)}
      ${coche('alertePepites', 'Alerte pépites', 'Être prévenu quand un warm-up très bien noté joue en ce moment', p.alertePepites !== false)}
      <div class="section-title">Bons plans et alertes</div>
      ${coche('emailInfos', 'Recevoir les bons plans par email', 'Line-ups de ta semaine, grosses closings, préventes. Jamais de spam, désinscription en un clic.', p.emailInfos !== false)}
      ${coche('alerteDj', 'Être prévenu quand mes DJ jouent', 'Un message dès qu\'un DJ que tu suis est annoncé près de toi', p.alerteDj !== false)}
      <label class="champ"><span>Ton email</span>
        <input class="search" type="email" name="emailContact" value="${esc(p.emailContact || (state.compte && /@/.test(state.compte.email) ? state.compte.email : ''))}" placeholder="toi@exemple.com" autocomplete="email" inputmode="email"></label>
      <p class="erreur" id="err-emailc" hidden>Entre ton email pour recevoir les bons plans et les alertes</p>
      <button type="submit" class="btn-plein">${state.profil ? 'Enregistrer' : 'Créer mon profil Banger'}</button>
      ${state.profil ? '<button type="button" class="alerte" data-annuler-profil="1">Annuler</button>' : ''}
    </form>`;
  }

  function renderProfil() {
    const p = state.profil;
    if (!state.compte) { $('#screen-profil').innerHTML = ecranConnexion(); return; }
    if (!p || state.editProfil) { $('#screen-profil').innerHTML = formProfil(p); return; }
    if (state.vueDj === 'creer') { $('#screen-profil').innerHTML = formDjPro(); return; }
    if (state.vueDj === 'mixe' && MON_DJ) { $('#screen-profil').innerHTML = formMixe(); return; }
    if (state.vueDj === 'liens' && MON_DJ) { $('#screen-profil').innerHTML = formLiens(); return; }
    if (state.vueDj === 'annonce' && MON_DJ) { $('#screen-profil').innerHTML = formAnnonce(); return; }
    if (state.vueDj === 'stream' && MON_DJ) { $('#screen-profil').innerHTML = formStream(); return; }
    const pt = points(), i = niveauProfil(pt.total), n = NIVEAUX_PROFIL[i], suiv = NIVEAUX_PROFIL[i + 1];
    const pct = suiv ? Math.round((pt.total - PALIERS[i]) / (PALIERS[i + 1] - PALIERS[i]) * 100) : 100;
    const stB = (v, t) => `<span class="fp-stat"><b>${v}</b><small>${t}</small></span>`;
    const illusP = !p.photo && avIllus(p.avatar);
    const sousB = `${esc(nomDest(p))}${(p.suivies || []).length ? ' · suit ' + (p.suivies || []).map((id) => (DESTINATIONS.find((d) => d.id === id) || {}).nom).filter(Boolean).join(', ') : ''}`;
    let h = illusP
      // Avec l'illustration : pas de rond, le pseudo est incrusté à droite de la grande image, là où regarde le DJ
      ? `<div class="fp fp-banger"><div class="fp-cover fp-illus" style="--fp-img:url('avatars-banzic/${avIllus(p.avatar)}-c.jpg')">
          <div class="fp-incruste"><div class="fp-nom">${esc(p.pseudo)}</div><div class="fp-sous">${sousB}</div></div></div>
`
      : `<div class="fp fp-banger"><div class="fp-cover"${p.photo ? ` style="--fp-img:url('${p.photo}')"` : ''}><i class="fp-lasers"></i></div>
      <div class="fp-tete"><span class="fp-av">${avatarHtml(p.photo, p.avatar, 92)}<span class="fp-med">${badgeNiveau(n, 34)}</span></span>
        <div class="fp-id"><div class="fp-nom">${esc(p.pseudo)}</div><div class="fp-sous">${sousB}</div></div></div>
`;
    h += `      <div class="fp-corps">
        <div class="fp-badges"><span class="fp-badge b-banger">Banger</span><span class="fp-badge b-niv" style="--m:${n.metal.couleur}">${nomNiveau(n)}${i === NIVEAUX_PROFIL.length - 1 ? ' · le Graal' : ''}</span></div>
        <div class="fp-puces">${p.styles.map((x) => `<span class="fp-puce">${esc(x)}</span>`).join('') || '<span class="fp-puce">Aucun style choisi</span>'}</div>
        <div class="fp-stats">${stB(pt.total, 'points')}${stB(pt.confirms, 'DJ confirmés')}${stB(pt.attente, 'en attente')}${stB(state.favs.length, 'DJ suivis')}</div>
        <div class="fp-prog"><div class="fp-prog-top"><b>${suiv ? nomNiveau(suiv) : 'Niveau maximum'}</b><small>${suiv ? `encore ${PALIERS[i + 1] - pt.total} points` : 'tu as atteint le Graal'}</small></div><div class="bar"><i style="width:${pct}%"></i></div></div>
        <div class="fp-actions"><button class="fp-btn plein" data-modifier-profil="1">Modifier mon profil</button><button class="fp-btn" data-partager-profil="1">Partager ma fiche</button></div>
      </div></div>
      ${state.favs.length ? `<div class="section-title">Mes DJ préférés <small>${state.favs.length}</small></div><div class="fp-vins">${state.favs.slice(0, 12).map((d) => `<button class="fp-vin" data-dj-pro="${esc(d)}"><span class="fp-disque">${avatarDj(d)}</span><small>${esc(d)}</small></button>`).join('')}</div>` : ''}
      <p class="conseil" style="margin-top:12px">Tout le monde commence Disque bronze. Pour monter, confirme sur place le DJ qui joue : chaque confirmation validée par d'autres te rapporte +10 points.</p>
      <div class="section-title">Mes contributions <small>${pt.mes.length}</small></div>
      ${pt.mes.length ? '<div class="jour">' + pt.mes.map((p) => `<div class="jl"><span class="jl-g"><span class="venue">${lienDjs(p.dj)}</span><small>${esc(lieux[p.lieu].nom)} · ${horaire(p)}</small></span>
        ${monVoteValide(p) ? '<span class="badge b-ok">Validée · visible par tous</span>' : `<span class="badge b-attente">En attente ${Math.min(autresConf(p), SEUIL_AUTRES)}/${SEUIL_AUTRES}</span>`}</div>`).join('') + '</div>'
        : '<p class="conseil">Pas encore de contribution. Sur place, confirme le DJ qui joue : tu le vois tout de suite, les autres le voient dès que d\'autres personnes l\'ont confirmé.</p>'}
      <div class="section-title">L'échelle des Bangers <small>de Disque bronze au Graal</small></div>
      <div class="echelle">`;
    OBJETS.forEach((o, oi) => {
      h += `<div class="echelle-ligne"><span class="echelle-obj">${o.nom}</span>`;
      METAUX.forEach((m, mi) => {
        const r = oi * 3 + mi, atteint = r <= i;
        h += `<span class="echelle-pas ${atteint ? 'ok' : ''} ${r === i ? 'actuel' : ''}" title="${o.nom} ${m.nom} : ${PALIERS[r]} points">
          ${badgeNiveau(NIVEAUX_PROFIL[r], 34)}<small>${m.nom}</small></span>`;
      });
      h += '</div>';
    });
    h += `</div>
      ${blocEspaceDj()}
      <div class="section-title">Mes réglages</div>
      <div class="jour reglages-resume">
        <label class="langue-ligne"><span>${T('langue')}</span>${selectLangue()}</label>
        <span>Questions sur place : <b>${p.notifs ? 'oui' : 'non'}</b> · Position : <b>${p.geoloc ? 'oui' : 'non'}</b></span>
        <span>Présence anonyme : <b>${p.presence ? 'oui' : 'non'}</b> · Classement : <b>${p.classement ? 'oui' : 'non'}</b></span>
        <span>Compte : <b>${FOURNISSEURS[state.compte.fournisseur]}</b> · ${esc(state.compte.email)}</span>
        <span>Bons plans par email : <b>${p.emailInfos ? 'oui' : 'non'}</b> · Alerte pépites : <b>${p.alertePepites !== false ? 'oui' : 'non'}</b></span>
        <span>Ville : <b>${esc(p.ville || 'à renseigner')}</b> · Alerte mes DJ : <b>${p.alerteDj ? 'oui' : 'non'}</b></span>
        ${p.emailContact ? `<span>Email : <b>${esc(p.emailContact)}</b></span>` : ''}
      </div>
      <button class="alerte" data-modifier-profil="1">Modifier mon profil Banger</button>
      <button class="alerte danger" data-supprimer-profil="1">Supprimer mon profil Banger</button>
      <p class="demo-note">Démo : le profil reste dans ce navigateur. Dans l'appli, il sera lié à un compte et les points viendront des contributions validées par les autres.</p>`;
    $('#screen-profil').innerHTML = h;
  }

  function clicProfil(e) {
    const lab = e.target.closest('#form-profil label.chip, #form-profil label.seg');
    if (lab) {
      setTimeout(() => {
        document.querySelectorAll('#form-profil label.chip, #form-profil label.seg').forEach((l) => {
          const inp = l.querySelector('input'); if (inp) l.classList.toggle('on', inp.checked);
        });
      }, 0);
      return true;
    }
    const cx = e.target.closest('[data-connexion]');
    if (cx) {
      if (cx.dataset.connexion === 'email') { state.modeEmail = true; renderProfil(); setTimeout(() => { const i = document.querySelector('#form-email input'); if (i) i.focus(); }, 0); }
      else connecter(cx.dataset.connexion);
      return true;
    }
    if (e.target.closest('[data-regler-ecran]')) { if (!(window.banzicReglerEcran && window.banzicReglerEcran())) toast('Rien à régler : l\'appli est déjà en plein écran'); return true; }
    if (e.target.closest('[data-av-retirer]')) { state.photoTemp = ''; majApercuAvatar(); return true; }
    if (e.target.closest('[data-plus-tard]')) { setTab('live'); toast('Tu peux créer ton compte quand tu veux, onglet Profil'); return true; }
    if (e.target.closest('[data-modifier-profil]')) { state.editProfil = true; renderProfil(); return true; }
    if (e.target.closest('[data-partager-profil]')) { toast('Démo : ta fiche Banger aura son lien à partager'); return true; }
    if (e.target.closest('[data-annuler-profil]')) { state.editProfil = false; renderProfil(); return true; }
    if (e.target.closest('[data-supprimer-profil]')) {
      if (!confirm('Supprimer ton compte et ton profil ? Ta progression sera perdue.')) return true;
      state.profil = null; state.compte = null;
      try { localStorage.removeItem('setly.profil'); localStorage.removeItem('setly.compte'); } catch (err) { /* */ }
      renderProfil(); majPortails(); toast('Profil supprimé'); return true;
    }
    return false;
  }

  document.addEventListener('submit', (e) => {
    if (e.target.id === 'form-signaler') {
      e.preventDefault();
      const dj = String(new FormData(e.target).get('dj') || '').trim();
      if (dj.length < 2) { $('#err-dj').hidden = false; return; }
      signaler(state.lieuOuvert, dj);
      return;
    }
    if (e.target.id === 'form-email') {
      e.preventDefault();
      const v = String(new FormData(e.target).get('email') || '').trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) { $('#err-email').hidden = false; e.target.email.focus(); return; }
      connecter('email', v);
      return;
    }
    if (e.target.id !== 'form-profil') return;
    e.preventDefault();
    const f = new FormData(e.target);
    const pseudo = String(f.get('pseudo') || '').trim();
    if (pseudo.length < 2) { $('#err-pseudo').hidden = false; e.target.pseudo.scrollIntoView({ block: 'center', behavior: 'smooth' }); return; }
    const ville = String(f.get('ville') || '').trim();
    if (ville.length < 2) { $('#err-ville').hidden = false; $('#champ-ville').scrollIntoView({ block: 'center', behavior: 'smooth' }); return; }
    if (!f.getAll('styles').length) { $('#err-styles').hidden = false; $('#champ-styles').scrollIntoView({ block: 'center', behavior: 'smooth' }); return; }
    const emailC = String(f.get('emailContact') || '').trim();
    if ((f.get('emailInfos') || f.get('alerteDj')) && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(emailC)) { $('#err-emailc').hidden = false; e.target.emailContact.scrollIntoView({ block: 'center', behavior: 'smooth' }); return; }
    const nouveau = !state.profil;
    state.profil = {
      pseudo, styles: f.getAll('styles'), langue: LANG, ville,
      // « Où es-tu ? » a été retiré du formulaire : on garde ce qui était déjà enregistré
      destination: 'autre', destinationAutre: ville,
      statut: (state.profil && state.profil.statut) || 'sur-place', du: (state.profil && state.profil.du) || '', au: (state.profil && state.profil.au) || '', suivies: (state.profil && state.profil.suivies) || [],
      notifs: !!f.get('notifs'), geoloc: !!f.get('geoloc'), presence: !!f.get('presence'), classement: !!f.get('classement'),
      emailInfos: !!f.get('emailInfos'), alertePepites: !!f.get('alertePepites'),
      alerteDj: !!f.get('alerteDj'), emailContact: emailC,
      avatar: f.get('avatar') || 'av:h01', photo: state.photoTemp || ''
    };
    // La ville choisie règle la zone « autour de moi »
    { const v = (window.VILLES || []).find((x) => sansAccent(x[0]).toLowerCase() === sansAccent(ville).toLowerCase()); if (v) { state.zoneGeo = { dest: 'local', nom: v[0], approx: false }; DEST.local.centre = [v[2], v[3]]; } }
    store.set('profil', state.profil);
    state.editProfil = false;
    renderProfil();
    const ecran = $('#screen-profil'); if (ecran) ecran.scrollTop = 0;
    toast(nouveau ? 'Bienvenue chez les Bangers, ' + pseudo + ' : te voilà ' + nomNiveau(NIVEAUX_PROFIL[niveauProfil(points().total)]) : 'Profil enregistré');
  });
  document.addEventListener('click', (e) => {
    if (!e.target.closest('[data-ville-gps]')) return;
    const champ = e.target.closest('form') && e.target.closest('form').querySelector('[name="ville"]'); if (!champ) return;
    const poser = (nom) => { champ.value = nom; document.querySelectorAll('#err-ville, #err-ville-dj').forEach((x) => { x.hidden = true; }); toast('Ville : ' + nom); };
    if (!navigator.geolocation) { poser(state.zoneGeo && state.zoneGeo.nom || 'Toulon'); return; }
    navigator.geolocation.getCurrentPosition((pos) => { const la = pos.coords.latitude, lo = pos.coords.longitude;
      const v = (window.VILLES || []).map((x) => ({ x, d: distKm([la, lo], [x[2], x[3]]) })).sort((u, w) => u.d - w.d)[0]; poser(v ? v.x[0] : 'Ma position'); },
      () => poser(state.zoneGeo && state.zoneGeo.nom || 'Toulon'), { timeout: 8000 });
  });
  document.addEventListener('change', (e) => {
    if (e.target.id === 'av-fichier' && e.target.files && e.target.files[0]) {
      photoReduite(e.target.files[0]).then((url) => { state.photoTemp = url; majApercuAvatar(); toast('Photo ajoutée : enregistre ta fiche pour la garder'); })
        .catch(() => toast('Impossible de lire cette photo, essaie une autre'));
      e.target.value = '';
    }
    if (e.target.name === 'avatar' && e.target.closest('#form-profil')) { state.photoTemp = ''; majApercuAvatar(); }
  });
  document.addEventListener('input', (e) => {
    if (e.target.name === 'pseudo') $('#err-pseudo').hidden = true;
    if (e.target.name === 'styles' && $('#err-styles')) $('#err-styles').hidden = true;
    if (e.target.name === 'emailContact' && $('#err-emailc')) $('#err-emailc').hidden = true;
    if (e.target.name === 'email' && $('#err-email')) $('#err-email').hidden = true;
  });

  // ---------- Recherche d'un DJ : où et quand il joue
  const sansAccent = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const decouperDjs = (txt) => txt.split(',').map((x) => x.trim()).filter(Boolean)
    .flatMap((x) => x.split(/\s+(?:B2B|b2b|feat\.)\s+/)).map((x) => x.trim()).filter(Boolean);

  function indexDjs() {
    const m = new Map();
    const ajoute = (nom) => { const k = sansAccent(nom); if (!m.has(k)) m.set(k, nom); };
    passages.filter((p) => !p.inconnu).forEach((p) => decouperDjs(p.dj).forEach(ajoute));
    SAISON.lignes.forEach((r) => decouperDjs(r.djs).forEach(ajoute));
    return m;
  }
  let INDEX_DJ = null, NB_DATES = null;
  const nbDatesDj = () => {
    if (NB_DATES) return NB_DATES;
    NB_DATES = new Map();
    SAISON.lignes.forEach((r) => new Set(decouperDjs(r.djs).map(sansAccent)).forEach((k) => NB_DATES.set(k, (NB_DATES.get(k) || 0) + 1)));
    return NB_DATES;
  };
  const tousLesDjs = () => (INDEX_DJ = INDEX_DJ || indexDjs());

  function suggestions(q) {
    const k = sansAccent(q.trim());
    if (k.length < 2) return [];
    const res = [];
    tousLesDjs().forEach((nom, cle) => { const i = cle.indexOf(k); if (i >= 0) res.push({ nom, rang: (i === 0 ? 0 : cle.includes(' ' + k) ? 1 : 2) }); });
    return res.sort((a, b) => a.rang - b.rang || a.nom.localeCompare(b.nom)).slice(0, 8).map((x) => x.nom);
  }

  // Lieux : par nom, par zone, ou par type (« club », « boîte », « plage », « beach »…)
  const MOTS_TYPE = { club: ['club', 'clubs', 'boite', 'boites', 'discotheque', 'nightclub'], plage: ['plage', 'plages', 'beach', 'beach club', 'beachclub', 'sunset', 'piscine', 'pool'] };
  function lieuxCherches(q) {
    const k = sansAccent(q.trim());
    if (k.length < 2) return [];
    const type = Object.keys(MOTS_TYPE).find((t) => MOTS_TYPE[t].some((m) => m.startsWith(k) || k.startsWith(m)));
    const ordre = { live: 0, bientot: 1, plustard: 2, fini: 3, ferme: 4 };
    // Uniquement les lieux de la destination choisie
    const base = state.dest === 'ibiza' ? D.lieux : Object.values(LIEUX_DEST).filter((l) => l.dest === state.dest);
    return base.filter((l) => sansAccent(l.nom).includes(k) || sansAccent(l.zone).includes(k) || (type && l.type === type))
      .sort((a, b) => (sansAccent(b.nom).startsWith(k) ? 1 : 0) - (sansAccent(a.nom).startsWith(k) ? 1 : 0)
        || (a.dest ? 1 : 0) - (b.dest ? 1 : 0) || ordre[statutLieu(a.id, state.t).code] - ordre[statutLieu(b.id, state.t).code] || a.nom.localeCompare(b.nom));
  }

  function renderSuggestions() {
    const q = $('#recherche-dj').value, box = $('#suggestions-dj');
    if (q.trim().length < 2) { box.hidden = true; $('#recherche-dj').setAttribute('aria-expanded', 'false'); return; }
    const f = state.rechFiltre || 'tout';
    const tousLieux = lieuxCherches(q);
    const ls = f === 'tout' ? tousLieux : f === 'club' || f === 'plage' ? tousLieux.filter((l) => l.type === f) : [];
    const djs = f === 'tout' || f === 'dj' ? suggestions(q).slice(0, f === 'dj' ? 10 : ls.length > 4 ? 4 : 6) : [];
    const vs = f === 'tout' || f === 'ville' ? villesCherchees(q) : [];
    const k0 = sansAccent(q.trim());
    const evs = (f === 'tout' || f === 'festival' || f === 'club') ? (SUD.soirees || []).filter((x) => x.date >= iso(new Date()) && (f === 'tout' || (x.type || 'club') === f)
      && [x.nom, x.djs, (SUD.lieux[x.lieu] || {}).nom, (SUD.lieux[x.lieu] || {}).ville].some((t) => t && sansAccent(t).includes(k0))).slice(0, 5) : [];
    const fests = (f === 'tout' || f === 'festival') ? DESTS.flatMap((d) => d.evenements.filter((e) => e.url && sansAccent(e.nom).includes(k0)).map((e) => ({ e, d }))).slice(0, 4) : [];
    let h = `<div class="rech-filtres">${[['tout', 'Tout'], ['club', '🪩 Clubs'], ['plage', '🏖️ Plages'], ['festival', '🎪 Festivals'], ['dj', '🎧 DJ'], ['ville', '📍 Villes']]
      .map(([k, l]) => `<button type="button" class="chip ${f === k ? 'on' : ''}" data-rech-filtre="${k}">${l}</button>`).join('')}</div>`;
    const vide = h;
    const blocVilles = vs.length ? `<div class="sugg-titre">Villes · ${vs.length}</div>` + vs.map((i) => {
      const v = VILLES[i];
      const pr = DESTS.filter((d) => !d.local).map((d) => ({ d, km: distKm([v[2], v[3]], d.centre) })).sort((x, y) => x.km - y.km)[0];
      const info = pr && pr.km < 80 ? 'Destination ' + esc(pr.d.nom) + ' · saison, lieux, tendance' : 'DJ déclarés et spots autour';
      return `<button class="sugg sugg-ville" role="option" data-ville="${i}"><b>📍 ${esc(v[0])}</b><small>${esc(v[1])} · ${info}</small></button>`;
    }).join('') : '';
    const villeDAbord = vs.length && sansAccent(VILLES[vs[0]][0]).startsWith(sansAccent(q.trim()));
    if (villeDAbord) h += blocVilles;
    if (ls.length) {
      h += `<div class="sugg-titre">Lieux · ${ls.length}</div>` + ls.slice(0, 8).map((l) => {
        const st = statutLieu(l.id, state.t), cur = enCours(l.id, state.t).filter((p) => !p.inconnu)[0];
        const info = l.dest ? `${moisNom(MOIS_NOW)} : ${esc(labelMois(DEST[l.dest].mois[MOIS_NOW]))}` : st.code === 'live' ? (cur ? 'Live · ' + esc(cur.dj) : 'Live') : st.label;
        return `<button class="sugg sugg-lieu" role="option" data-lieu-sugg="${l.id}">${photo(l, 'thumb', 'generic_small_square_thumb')}
          <span><b>${esc(l.nom)}</b><small>${l.type === 'plage' ? T('plage') : T('club')} · ${esc(l.zone)} · ${info}</small></span></button>`;
      }).join('');
    }
    if (djs.length) {
      h += `<div class="sugg-titre">DJ · ${djs.length}</div>` + djs.map((nom) => {
        const ce = passages.filter((p) => decouperDjs(p.dj).some((d) => sansAccent(d) === sansAccent(nom)));
        const info = ce.length ? `Ce soir · ${esc(lieux[ce[0].lieu].nom)} · ${ce[0].debut}` : 'Saison 2025';
        return `<button class="sugg" role="option" data-dj="${esc(nom)}"><b>${esc(nom)}</b><small>${info}</small></button>`;
      }).join('');
    }
    if (!villeDAbord) h += blocVilles;
    if (evs.length) h += `<div class="sugg-titre">Soirées près de toi · ${evs.length}</div>` + evs.map((x) => {
      const l = SUD.lieux[x.lieu] || {}, dt = new Date(x.date + 'T12:00:00');
      return `<a class="sugg" role="option" href="${x.url || SUD.sources[x.src] || '#'}" target="_blank" rel="noopener"><b>${x.type === 'festival' ? '🎪 ' : ''}${esc(x.nom)}</b><small>${dt.getDate()} ${MOIS[dt.getMonth()]} · ${esc(l.nom || '')} · ${esc(l.ville || '')}</small></a>`;
    }).join('');
    if (fests.length) h += `<div class="sugg-titre">Festivals · ${fests.length}</div>` + fests.map(({ e, d }) =>
      `<a class="sugg" role="option" href="${e.url}" target="_blank" rel="noopener"><b>🎪 ${esc(e.nom)}</b><small>${esc(d.nom)} · ${esc(e.quand)}</small></a>`).join('');
    box.innerHTML = h !== vide ? h : vide + `<div class="sugg vide">${esc(T('aucun', { q }))}</div>`;
    box.hidden = false; $('#recherche-dj').setAttribute('aria-expanded', 'true');
  }
  // ---------- Recherche d'une ville dans le monde
  const VILLES = window.VILLES || [];
  function villesCherchees(q) {
    const k = sansAccent(q.trim()); if (k.length < 2) return [];
    return VILLES.map((v, i) => ({ i, n: sansAccent(v[0]), p: sansAccent(v[1]) }))
      .filter((x) => x.n.includes(k) || x.p.startsWith(k))
      .sort((a, b) => (b.n.startsWith(k) ? 2 : b.n.includes(k) ? 1 : 0) - (a.n.startsWith(k) ? 2 : a.n.includes(k) ? 1 : 0) || a.n.localeCompare(b.n))
      .slice(0, 5).map((x) => x.i);
  }
  function allerVille(i) {
    const v = VILLES[i]; if (!v) return;
    $('#suggestions-dj').hidden = true; $('#recherche-dj').value = ''; $('#recherche-dj').blur();
    if (state.djOuvert) fermerDj();
    if (map) map.closePopup();
    state.villeChoisie = true;
    state.zoneGeo = zoneDe([v[2], v[3]], false, v[0]);
    state.mode = 'geo'; store.set('mode', 'geo');
    changerDest(state.zoneGeo.dest);
    if (map) map.setView([v[2], v[3]], DEST[state.zoneGeo.dest].local ? 13 : DEST[state.zoneGeo.dest].zoom);
    toast('📍 ' + v[0] + (state.zoneGeo.dest !== 'local' ? ' · destination ' + DEST[state.zoneGeo.dest].nom : ' · DJ et spots autour'));
  }

  function ouvrirLieuRecherche(id) {
    $('#suggestions-dj').hidden = true; $('#recherche-dj').value = ''; $('#recherche-dj').blur();
    if (state.djOuvert) fermerDj();
    if (map) map.closePopup();
    if (LIEUX_DEST[id] && LIEUX_DEST[id].dest !== state.dest) changerDest(LIEUX_DEST[id].dest);
    ouvrirLieu(id);
  }

  function ouvrirDj(nom) {
    $('#suggestions-dj').hidden = true;
    $('#recherche-dj').value = '';
    $('#recherche-dj').blur();
    state.djOuvert = nom;
    libelleRetour($('#dj-back'));
    if (state.lieuOuvert) { const sp = $('#dj-back span'); if (sp) sp.textContent = 'Retour'; }
    if (state.djLiveOuvert) { const sp = $('#dj-back span'); if (sp) sp.textContent = 'Retour aux départs'; }
    renderDj();
    $('#sheet-dj').classList.add('open');
    $('#sheet-dj').setAttribute('aria-hidden', 'false');
  }
  function fermerDj() {
    state.djOuvert = null;
    $('#sheet-dj').classList.remove('open');
    $('#sheet-dj').setAttribute('aria-hidden', 'true');
  }


  const DRAPEAU_PAYS = { 'France': '🇫🇷', 'Espagne': '🇪🇸', 'Portugal': '🇵🇹', 'États-Unis': '🇺🇸', 'Royaume-Uni': '🇬🇧', 'Pays-Bas': '🇳🇱', 'Émirats arabes unis': '🇦🇪',
    'Brésil': '🇧🇷', 'Italie': '🇮🇹', 'Australie': '🇦🇺', 'Arabie saoudite': '🇸🇦', 'Allemagne': '🇩🇪', 'Belgique': '🇧🇪', 'Suisse': '🇨🇭', 'Mexique': '🇲🇽', 'Grèce': '🇬🇷',
    'Canada': '🇨🇦', 'Argentine': '🇦🇷', 'Colombie': '🇨🇴', 'Afrique du Sud': '🇿🇦', 'Japon': '🇯🇵', 'Croatie': '🇭🇷', 'Malte': '🇲🇹', 'Turquie': '🇹🇷', 'Thaïlande': '🇹🇭', 'Inde': '🇮🇳', 'Chili': '🇨🇱', 'Pologne': '🇵🇱' };
  const COUL_PAYS = { 'France': ['#2A5BFF', '#E5484D'], 'Espagne': ['#E5484D', '#F2C53A'], 'Portugal': ['#2E9E4F', '#E5484D'], 'États-Unis': ['#3D5AFE', '#E5484D'],
    'Royaume-Uni': ['#2A3F9E', '#E5484D'], 'Pays-Bas': ['#E5484D', '#2A5BFF'], 'Émirats arabes unis': ['#2E9E4F', '#E5484D'], 'Brésil': ['#2E9E4F', '#F2C53A'], 'Italie': ['#2E9E4F', '#E5484D'],
    'Australie': ['#2A3F9E', '#E5484D'], 'Arabie saoudite': ['#2E9E4F', '#1E6B3A'], 'Allemagne': ['#F2C53A', '#E5484D'], 'Belgique': ['#F2C53A', '#E5484D'], 'Mexique': ['#2E9E4F', '#E5484D'], 'Grèce': ['#2A7BFF', '#9CC3FF'] };
  const coulPays = (p) => COUL_PAYS[p] || ['#3D8BFF', '#0A1F4A'];
  document.addEventListener('click', (e) => {
    const res = e.target.closest('[data-resident]'); if (res) { const t = document.querySelector('#dj-ibiza'); if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
    const b = e.target.closest('[data-pays-tournee]'); if (!b || !state.djOuvert) return;
    const p = b.dataset.paysTournee;
    state.paysTournee = p && !(state.paysTournee && state.paysTournee.pays === p) ? { dj: state.djOuvert, pays: p } : null;
    const r = b.closest('.pays-rang'), x = r ? r.scrollLeft : 0;
    renderDj();
    const r2 = document.querySelector('#sheet-dj .pays-rang'); if (r2) r2.scrollLeft = x;
  });

  // Photos des villes et pays de tournée (Wikimedia Commons, photos-villes.js) : une ville proche ou le pays à défaut
  const VILLE_ALIAS = { 'villeurbanne': 'Lyon', 'ramonville-saint-agne': 'Toulouse', 'merignac': 'Bordeaux', 'nanterre': 'Paris', 'villepinte': 'Paris', 'la seyne-sur-mer': 'Toulon', 'englos': 'Lille',
    'humanes de madrid': 'Madrid', 'pinto (madrid)': 'Madrid', 'osio sopra (bergame)': 'Bergame', 'le-mans': 'Le Mans', 'marennes-hiers-brouage': 'Biarritz', 'seignosse': 'Biarritz', 'bruz': 'Vannes' };
  const PAYS_PHOTO = { 'France': 'Paris', 'Espagne': 'Madrid', 'Portugal': 'Lisbonne', 'Brésil': 'Brésil', 'États-Unis': 'Los Angeles', 'Royaume-Uni': 'Londres', 'Pays-Bas': 'Amsterdam',
    'Émirats arabes unis': 'Dubaï', 'Italie': 'Bergame', 'Australie': 'Byron Bay', 'Arabie saoudite': 'Djeddah' };
  const _villesIdx = (() => { const m = {}; Object.keys(window.PHOTOS_VILLES || {}).forEach((v) => { m[sansAccent(v)] = v; }); return m; })();
  const photoVille = (ville, pays) => { const V = window.PHOTOS_VILLES || {}; let v = String(ville || '').trim();
    const a = VILLE_ALIAS[sansAccent(v)]; if (a) v = a; v = v.replace(/\s+\d+(e|er)$/i, '');
    const k = _villesIdx[sansAccent(v)] || _villesIdx[sansAccent(PAYS_PHOTO[pays] || '')]; return k ? V[k].f : ''; };
  const photoPays = (pays) => { const k = PAYS_PHOTO[pays]; return k && window.PHOTOS_VILLES && window.PHOTOS_VILLES[k] ? window.PHOTOS_VILLES[k].f : ''; };
  const pastilleDj = (nom) => `<span class="vc-av">${avatarDj(nom)}</span>`;

  // Carte « Résident » : le lieu d'Ibiza où il a le plus joué en 2025 (sa résidence), mise en avant en premier
  function carteResident(nom) {
    const k = sansAccent(nom), xs = (SAISON.lignes || []).filter((r) => decouperDjs(r.djs).some((d) => sansAccent(d) === k));
    if (!xs.length) return '';
    const c = {}; xs.forEach((r) => { c[r.lieu] = (c[r.lieu] || 0) + 1; });
    const [top, n] = Object.entries(c).sort((a, b) => b[1] - a[1])[0];
    const ph = imgLieu(lieux[top]) || ((window.PHOTOS_LIEUX || {})[top] || {}).f || '';
    return `<button class="pays-carte resident${ph ? ' a-photo' : ''}" data-resident="1" style="--p1:#E5484D;--p2:#F2C53A${ph ? `;--photo:url('${ph}')` : ''}"><span class="res-badge">Résident</span>${pastilleDj(nom)}<span class="pays-drapeau">🇪🇸</span><b>Ibiza · ${esc(nomLieu(top))}</b><small>${n} soirée${n > 1 ? 's' : ''} · ${xs.length} dates en 2025</small></button>`;
  }

  // ---- Tournée hors Ibiza : section séparée de la partie Ibiza ----
  function blocTournee(nom) {
    const T = window.TOURNEES || { djs: {} };
    const k = sansAccent(nom);
    const cle = Object.keys(T.djs).find((n) => sansAccent(n) === k);
    const q = encodeURIComponent(nom);
    const chercher = `<div class="liens-dj"><a class="lien-reseau" href="https://www.songkick.com/search?query=${q}" target="_blank" rel="noopener">Songkick</a><a class="lien-reseau" href="https://ra.co/search?query=${q}" target="_blank" rel="noopener">Resident Advisor</a></div>`;
    const titre = `<div class="section-title">Où le voir <small>sa résidence d'abord, puis ses dates pays par pays</small></div>`;
    // Dates en France, Espagne et Portugal tirées de l'agenda (soirées où il est à l'affiche)
    const PAYS_DEP = { ES: 'Espagne', PT: 'Portugal' };
    const agenda = (SUD.soirees || []).filter((x) => x.djs && SUD.lieux[x.lieu] && decouperDjs(x.djs).some((n) => sansAccent(n) === k))
      .map((x) => { const l = SUD.lieux[x.lieu]; return { date: x.date, lieu: x.nom, ville: l.ville, pays: PAYS_DEP[l.dep] || 'France' }; });
    soireesDubai().filter((r) => decouperDjs(r.djs || '').some((n) => sansAccent(n) === k)).forEach((r) => agenda.push({ date: r.date, lieu: r.nomLieu, ville: 'Dubaï', pays: 'Émirats arabes unis' }));
    if (!cle && !agenda.length) return titre + (carteResident(nom) ? `<div class="acc-rang pays-rang">${carteResident(nom)}</div>` : '') + `<p class="conseil">Sa tournée hors Ibiza n'est pas encore relevée. Pour voir où il joue :</p>` + chercher;
    const d = cle ? T.djs[cle] : { dates: [], sources: {} };
    const auj = new Date(); auj.setHours(0, 0, 0, 0);
    const toutes = d.dates.concat(agenda.filter((a) => !d.dates.some((b) => b.date === a.date && b.ville === a.ville)));
    const tousAvenir = toutes.filter((x) => !/ibiza|eivissa/i.test(x.ville) && new Date((x.fin || x.date) + 'T23:59') >= auj).sort((a, b) => a.date.localeCompare(b.date));
    const fmtT = (iso) => { const x = new Date(iso + 'T12:00'); let m; try { m = new Intl.DateTimeFormat(LANG, { month: 'short' }).format(x); } catch (e) { m = moisNom(x.getMonth()); } return `${x.getDate()} ${m}`; };
    const quand = (x) => { const j = Math.round((new Date(x.date + 'T12:00') - auj) / 86400000); return j <= 0 ? '<span class="badge b-live">En cours</span>' : j === 1 ? '<span class="badge b-soon">Demain</span>' : j <= 7 ? `<span class="badge b-soon">Dans ${j} j</span>` : ''; };
    const pays = [...new Set(tousAvenir.map((x) => x.pays))];
    let h = titre;
    if (!tousAvenir.length) return h + `<p class="conseil">Aucune date à venir relevée.</p>` + chercher;
    // Une carte par pays avec son drapeau : on touche un pays, on ne voit que ses dates
    if (state.paysTournee && (state.paysTournee.dj !== nom || !pays.includes(state.paysTournee.pays))) state.paysTournee = null;
    const choix = state.paysTournee ? state.paysTournee.pays : null;
    const avenir = choix ? tousAvenir.filter((x) => x.pays === choix) : tousAvenir;
    const photoTous = tousAvenir.map((x) => photoVille(x.ville, x.pays)).find(Boolean) || '';
    const cartePays = (p, n, prochaine, on) => { const ph = p ? photoPays(p) : photoTous; return `<button class="pays-carte${on ? ' on' : ''}${ph ? ' a-photo' : ''}" data-pays-tournee="${esc(p)}" aria-pressed="${on}" style="--p1:${p ? coulPays(p)[0] : '#3D8BFF'};--p2:${p ? coulPays(p)[1] : '#0A1F4A'}${ph ? `;--photo:url('${ph}')` : ''}">
      <span class="pays-drapeau">${p ? (DRAPEAU_PAYS[p] || '🌍') : '🌍'}</span><b>${p ? esc(p) : 'Tous les pays'}</b><small>${n} date${n > 1 ? 's' : ''}${prochaine ? ' · ' + esc(prochaine) : ''}</small></button>` };
    h += `<p class="conseil" style="margin:0 0 8px">Touche un pays pour voir ses dates.</p><div class="acc-rang pays-rang">`
      + carteResident(nom) + cartePays('', tousAvenir.length, '', !choix)
      + pays.map((p) => { const xs = tousAvenir.filter((x) => x.pays === p); return cartePays(p, xs.length, xs[0].ville, choix === p); }).join('') + '</div>';
    const jourC = (iso) => { const x = new Date(iso + 'T12:00'); return ['Dim.', 'Lun.', 'Mar.', 'Mer.', 'Jeu.', 'Ven.', 'Sam.'][x.getDay()] + ' ' + fmtT(iso); };
    h += `<div class="tournee">` + rangCartes(avenir.map((x) => { const [c1, c2] = coulPays(x.pays), q = quand(x).replace(/<[^>]+>/g, '');
      return vCarte({ tag: 'div', c: c1, img: photoVille(x.ville, x.pays), extra: pastilleDj(nom), badge: (DRAPEAU_PAYS[x.pays] || '') + ' ' + (q || esc(x.pays)), type: jourC(x.date) + (x.fin ? ' → ' + fmtT(x.fin) : ''), nom: esc(x.lieu), lieu: esc(x.ville) + ' · ' + esc(x.pays) })
        .replace('style="--mc:' + c1 + '"', `style="--mc:${c1};--mc2:${c2}"`).replace('dc-carte vc', 'dc-carte vc date-pays'); }));
    h += `</div><div class="liens-dj tournee-src">${Object.entries(d.sources || {}).map(([n, u]) => `<a class="lien-reseau" href="${esc(u)}" target="_blank" rel="noopener">Toute sa tournée · ${esc(n)}</a>`).join('')}</div>`;
    const mj = new Date(T.maj + 'T12:00');
    h += `<p class="aide">Dates relevées le ${mj.getDate()} ${moisNom(mj.getMonth())} ${mj.getFullYear()} sur les agendas publics. Vérifie toujours auprès de la billetterie. Photos des villes : Wikimedia Commons, licences libres (auteurs cités dans photos-villes.js).</p>`;
    return h;
  }

  // Menu « Agenda » d'une fiche DJ (agenda-djs.js) : à venir à partir d'aujourd'hui, saison Ibiza 2026, dates passées
  const agendaDj = (nom) => { const A = window.AGENDA_DJS || {}; const k = Object.keys(A).find((n) => sansAccent(n) === sansAccent(nom)); return k ? A[k] : null; };
  function blocAgendaDj(nom) {
    const A = agendaDj(nom); if (!A) return '';
    const auj = isoAuj(), lig = (r) => ({ date: r[0], fin: r[1], lieu: r[2], ville: r[3], pays: r[4], titre: r[5], url: r[6], heure: r[7] });
    const avenir = A.avenir.map(lig).filter((x) => (x.fin || x.date) >= auj), ibiza = A.ibiza.map(lig), passe = A.monde.map(lig).concat(ibiza).filter((x) => (x.fin || x.date) < auj).sort((a, b) => b.date.localeCompare(a.date));
    const ong = state.agendaDj && state.agendaDj.dj === nom ? state.agendaDj.o : 'avenir';
    const liste = ong === 'ibiza' ? ibiza : ong === 'passe' ? passe : avenir;
    const fmtJ = (iso) => { const x = new Date(iso + 'T12:00'); return ['Dim.', 'Lun.', 'Mar.', 'Mer.', 'Jeu.', 'Ven.', 'Sam.'][x.getDay()] + ' ' + x.getDate() + ' ' + MOIS[x.getMonth()] + (x.getFullYear() !== new Date().getFullYear() ? ' ' + x.getFullYear() : ''); };
    const DEST_IMG = { Tulum: 'tulum-carte.jpg', Mykonos: 'mykonos-carte.jpg' };
    const img = (x) => (x.ville === 'Ibiza' ? (imgLieu(lieux[x.lieu]) || ((window.PHOTOS_LIEUX || {})[x.lieu] || {}).f) : '') || photoVille(x.ville, x.pays) || DEST_IMG[x.ville] || 'fond-platine.jpg';
    const carte = (x) => { const j = Math.round((new Date(x.date + 'T12:00') - new Date(auj + 'T12:00')) / 864e5);
      const badge = (DRAPEAU_PAYS[x.pays] || '') + ' ' + (j === 0 ? 'Ce soir' : j === 1 ? 'Demain' : j > 1 && j <= 30 ? 'Dans ' + j + ' j' : esc(x.pays));
      return vCarte({ tag: 'a', attr: `href="${esc(x.url)}" target="_blank" rel="noopener"`, c: '#FF8A3D', img: img(x), extra: pastilleDj(nom), badge,
        type: fmtJ(x.date) + (x.fin ? ' → ' + fmtJ(x.fin) : '') + (x.heure ? ' · ' + x.heure : ''), nom: esc(x.ville === 'Ibiza' ? nomLieu(x.lieu) : x.lieu), lieu: esc(x.ville === 'Ibiza' ? x.titre : x.ville + ' · ' + x.pays) })
        .replace('dc-carte vc', 'dc-carte vc date-pays').replace('style="--mc:#FF8A3D"', 'style="--mc:#FF8A3D;--mc2:#B23DFF"'); };
    const b = (k, l, n) => `<button class="seg ${ong === k ? 'on' : ''}" data-agenda-dj="${k}" aria-pressed="${ong === k}">${l} <small>${n}</small></button>`;
    const mj = new Date(A.maj + 'T12:00');
    return `<div class="section-title" id="dj-agenda">Agenda <small>${avenir.length} date${avenir.length > 1 ? 's' : ''} à venir</small></div>
      <div class="segs ag-dj" role="group" aria-label="Agenda du DJ">${b('avenir', 'À venir', avenir.length)}${ibiza.length ? b('ibiza', 'Ibiza 2026', ibiza.length) : ''}${passe.length ? b('passe', 'Déjà passées', passe.length) : ''}</div>
      ${liste.length ? rangCartes(liste.map(carte)) : '<p class="conseil">Aucune date annoncée pour l\'instant.</p>'}
      <p class="aide">Dates relevées le ${mj.getDate()} ${MOIS[mj.getMonth()]} ${mj.getFullYear()} sur Resident Advisor, Bandsintown, Songkick et Ibiza Spotlight. Touche une date pour la page billets.</p>`;
  }
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-agenda-dj]'); if (!b || !state.djOuvert) return;
    state.agendaDj = { dj: state.djOuvert, o: b.dataset.agendaDj }; renderDj();
    const t = document.querySelector('#dj-agenda'); if (t) t.scrollIntoView({ block: 'start' });
  });

  // Fiche DJ : en-tête commun (DJ Pro = premium, DJ Live = normal, sinon fiche d'après les line-ups)
  const ALERTES_DJ = store.get('alertesDj', {});
  // Le casque « Banger » : le bouton pour dire qu'on aime le DJ. Un toucher : il fait deux tours rapides et un son de basse.
  const LIKES_DJ = store.get('likesDj', {});
  const baseLikes = (nom) => { let g = 7; for (const ch of nom) g = (g * 31 + ch.charCodeAt(0)) >>> 0; const r = window.DJMAG2026 ? DJMAG2026.djs.findIndex((x) => sansAccent(x[0]) === sansAccent(nom)) + 1 : 0; return r ? 2000 + (101 - r) * 180 + g % 900 : 40 + g % 600; };
  const nbLikes = (nom) => baseLikes(nom) + (LIKES_DJ[sansAccent(nom)] ? 1 : 0);
  const fmtLikes = (n) => n >= 10000 ? (n / 1000).toFixed(0) + 'k' : n >= 1000 ? (n / 1000).toFixed(1).replace('.', ',') + 'k' : String(n);
  const boutonCasque = (nom) => { const on = !!LIKES_DJ[sansAccent(nom)];
    return `<button class="casque-like${on ? ' on' : ''}" data-casque="${esc(nom)}" aria-pressed="${on}" aria-label="${on ? 'Tu aimes ce DJ' : 'J\'aime ce DJ'}"><img src="banger-casque.png" alt=""><span class="cl-nb">${fmtLikes(nbLikes(nom))}</span><span class="cl-txt">${on ? 'Tu bangues' : 'Je bangue'}</span></button>`; };
  let audioCtx = null;
  function sonBanger() {
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)(); const t = audioCtx.currentTime;
      const o = audioCtx.createOscillator(), g = audioCtx.createGain(); o.type = 'sine';
      o.frequency.setValueAtTime(160, t); o.frequency.exponentialRampToValueAtTime(48, t + .35);
      g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.9, t + .01); g.gain.exponentialRampToValueAtTime(.0001, t + .45);
      o.connect(g).connect(audioCtx.destination); o.start(t); o.stop(t + .5);
      const o2 = audioCtx.createOscillator(), g2 = audioCtx.createGain(); o2.type = 'triangle';
      o2.frequency.setValueAtTime(880, t + .05); o2.frequency.exponentialRampToValueAtTime(1760, t + .25);
      g2.gain.setValueAtTime(.0001, t + .05); g2.gain.exponentialRampToValueAtTime(.18, t + .08); g2.gain.exponentialRampToValueAtTime(.0001, t + .35);
      o2.connect(g2).connect(audioCtx.destination); o2.start(t + .05); o2.stop(t + .4);
    } catch (e) { /* pas de son possible : l'animation suffit */ }
  }
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-casque]'); if (!b) return;
    const nom = b.dataset.casque, k = sansAccent(nom), on = !LIKES_DJ[k];
    if (on) LIKES_DJ[k] = Date.now(); else delete LIKES_DJ[k]; store.set('likesDj', LIKES_DJ);
    b.classList.toggle('on', on); b.setAttribute('aria-pressed', on);
    b.querySelector('.cl-nb').textContent = fmtLikes(nbLikes(nom)); b.querySelector('.cl-txt').textContent = on ? 'Tu bangues' : 'Je bangue';
    if (on) { b.classList.remove('tourne'); void b.offsetWidth; b.classList.add('tourne'); sonBanger(); if (navigator.vibrate) navigator.vibrate(30); toast('Tu bangues ' + nom); }
  });

  function ficheTeteDj(nom, pro, ceSoirN, nbSaison) {
    const tier = pro ? (pro.formule === 'pro' ? 'pro' : 'live') : 'std';
    const live = pro ? DECLS.filter((x) => x.dj === pro.id && declActive(x)) : [];
    const c = pro ? credibilite(pro) : null;
    const img = avatarIllusDj(nom) || avPinDj(pro) || (pro && pro.photo) || (photoLibre(nom) && photoLibre(nom).f) || '';
    let g = 7; for (const ch of nom) g = (g * 31 + ch.charCodeAt(0)) >>> 0;
    const abonnes = pro ? (pro.abonnes || (tier === 'pro' ? 1200 + g % 9000 : 40 + g % 400)) : 0;
    const k = (n) => n >= 1000 ? (n / 1000).toFixed(1).replace('.', ',').replace(',0', '') + 'k' : n;
    const sous = pro ? [pro.ville, ...(pro.residences || [])].filter(Boolean).map(esc).join(' · ') : (ceSoirN ? 'Joue ce soir' : 'Ne joue pas ce soir') + ' · ' + nbSaison + ' date' + (nbSaison > 1 ? 's' : '') + ' à Ibiza en 2025';
    const styles = pro ? pro.styles : [];
    const stat = (v, t) => `<span class="fp-stat"><b>${v}</b><small>${t}</small></span>`;
    const stats = tier === 'pro' ? stat(k(abonnes), 'abonnés') + stat(c.niv.code === 'nouveau' ? '–' : c.score + ' %', 'crédibilité') + stat((pro.annonces || []).length + nbSaison, 'dates') + stat(pro.confirmes, 'sets confirmés')
      : tier === 'live' ? stat(c.niv.code === 'nouveau' ? '–' : c.score + ' %', 'crédibilité') + stat(pro.confirmes, 'sets confirmés') + stat(c.note ? c.note : '–', 'note /5') + stat(k(abonnes), 'abonnés')
      : stat(nbSaison, 'dates 2025') + stat(ceSoirN, 'ce soir') + stat(state.favs.includes(nom) ? 'Oui' : 'Non', 'tu le suis');
    const suivi = state.favs.includes(nom), al = !!ALERTES_DJ[sansAccent(nom)];
    const TOPM = window.DJMAG2026, iTop = TOPM ? TOPM.djs.findIndex((x) => sansAccent(x[0]) === sansAccent(nom)) : -1;
    const mvTop = iTop >= 0 ? ({ '+': 'En hausse', '-': 'En baisse', '=': 'Stable', 'N': 'Nouveau', 'R': 'Retour' })[TOPM.djs[iTop][1]] || '' : '';
    const medTop = iTop >= 0 ? `<button class="fp-top100 ${iTop < 10 ? 'or' : iTop < 50 ? 'argent' : 'bronze'}" data-top-info="${iTop + 1}" aria-label="Classé ${iTop + 1}e au Top 100 DJ Mag 2026"><small>TOP</small><b>${iTop + 1}</b></button>` : '';
    return `<div class="fp fp-${tier}"><div class="fp-cover"${img ? ` style="--fp-img:url('${img}')"` : ''}><i class="fp-lasers"></i></div>
      <div class="fp-tete"><span class="fp-av">${avatarDj(nom, 'fp-photo')}${medTop}</span>
        <div class="fp-id"><div class="fp-nom">${esc(nom)}</div><div class="fp-sous">${sous}</div></div>
        ${boutonCasque(nom)}</div>
      <div class="fp-corps">
        <div class="fp-badges">${tier === 'pro' ? '<span class="fp-badge b-pro">DJ Pro</span>' : tier === 'live' ? '<span class="fp-badge b-live">DJ Live</span>' : '<span class="fp-badge b-std">Fiche line-ups</span>'}${iTop >= 0 ? `<span class="fp-badge b-top">Top 100 · ${iTop ? iTop + 1 + 'e' : '1er'}${mvTop ? ' · ' + mvTop : ''}</span>` : ''}${pro && pro.officiel ? '<span class="fp-badge b-off">Officiel</span>' : ''}</div>
        ${styles.length ? `<div class="fp-puces">${styles.map((x) => `<span class="fp-puce">${esc(x)}</span>`).join('')}</div>` : ''}
        ${live.map((x) => `<div class="fp-direct"><span class="fp-pt"></span><span><b>Mixe en ce moment</b><small>${esc(lieuDe(x).nom || 'Spot')} · depuis ${hm(x.debut)} · confirmé par ${x.conf} Banger${x.conf > 1 ? 's' : ''}</small></span></div>`).join('')}
        <div class="fp-stats">${stats}</div>
        <div class="fp-actions"><button class="fp-btn ${tier === 'pro' ? 'or' : 'plein'}" data-fav="${esc(nom)}">${suivi ? 'Suivi' : 'Suivre'}</button>
          <button class="fp-btn ${al ? 'on' : ''}" data-alerte-dj="${esc(nom)}">${al ? 'Alerte activée' : "M'alerter"}</button>
          ${tier === 'pro' ? `<button class="fp-btn" data-booking="${esc(nom)}">Booking</button>` : ''}</div>
      </div></div>`;
  }
  document.addEventListener('click', (e) => {
    const a = e.target.closest('[data-alerte-dj]');
    if (a) { const kk = sansAccent(a.dataset.alerteDj); if (ALERTES_DJ[kk]) delete ALERTES_DJ[kk]; else ALERTES_DJ[kk] = true; store.set('alertesDj', ALERTES_DJ);
      toast(ALERTES_DJ[kk] ? 'On te prévient dès que ' + a.dataset.alerteDj + ' joue près de toi' : 'Alerte retirée'); renderDj(); return; }
    const tp = e.target.closest('[data-top-info]');
    if (tp) { toast((tp.dataset.topInfo === '1' ? '1er' : tp.dataset.topInfo + 'e') + ' au classement Top 100 DJ Mag 2026, annoncé le 7 octobre à Ibiza'); return; }
    const b = e.target.closest('[data-booking]');
    if (b) toast('Démo : la demande de booking partira directement au DJ ou à son agent');
  });

  function renderDj() {
    const nom = state.djOuvert; if (!nom) return;
    const k = sansAccent(nom), t = state.t;
    const joue = (txt) => decouperDjs(txt).some((d) => sansAccent(d) === k);
    const ceSoir = passages.filter((p) => joue(p.dj)).sort((a, b) => a.d - b.d);
    const saison = SAISON.lignes.filter((r) => joue(r.djs)).sort((a, b) => a.date.localeCompare(b.date));

    const pro = djProParNom(nom);
    let h = ficheTeteDj(nom, pro, ceSoir.length, saison.length) + `${photoLibre(nom) && !fondAvatarDj(nom) ? `<p class="credit-photo">Photo : ${esc(photoLibre(nom).auteur || 'Wikimedia Commons')} · ${esc(photoLibre(nom).licence)} · <a href="https://en.wikipedia.org/wiki/${encodeURIComponent(photoLibre(nom).page.replace(/ /g, '_'))}" target="_blank" rel="noopener">Wikimedia Commons</a></p>` : `<p class="credit-photo" data-credit-photo="${esc(nom)}" hidden></p>`}`;
    h += blocAgendaDj(nom);
    if (!pro) {
      h += `<div class="revendiquer"><span><b>Fiche créée d'après les line-ups officiels</b><small>Tu es ${esc(nom)} ? Revendique ta fiche pour la gérer : photo, bio, dates, et le badge ✓ Officiel.</small></span>
        <button class="alerte" data-revendiquer="${esc(nom)}">Revendiquer</button></div>`;
    }
    if (pro) {
      if (pro.formule === 'pro') h += blocLiens(pro);
      h += lecteurStream(pro);
      if (pro.formule === 'pro') h += blocAnnonces(pro, false);
      h += `<div class="section-title">Crédibilité</div>` + carteCredibilite(pro);
      if (pro.mien && pro.formule !== 'pro') h += `<div class="fp-verrou"><b>Fiche DJ Pro</b> : dates annoncées à l'avance, pays de tournée, lecteur de sets, liens YouTube, SoundCloud, Instagram, TikTok et bouton Booking.</div>`;
      if (!ceSoir.length && !saison.length) { $('#dj-body').innerHTML = h + blocTournee(nom) + blocCommentaires(nom); remplirAvatars($('#dj-body')); return; }
    }

    h += `<div class="section-title">Ce soir <small>${D.date}</small></div>`;
    if (ceSoir.length) {
      ceSoir.forEach((p) => {
        const l = lieux[p.lieu];
        const statut = t >= p.f ? '<span class="badge b-off">Terminé</span>'
          : t >= p.d ? `<span class="badge b-live ${l.type}">En ce moment</span>`
          : `<span class="badge b-soon">Dans ${dans(p.d - t)}</span>`;
        h += `<button class="card ${l.type}" data-lieu="${l.id}">
          <div class="card-head"><span class="ch-g">${photo(l, 'thumb', 'generic_small_square_thumb')}<span><span class="venue">${esc(l.nom)}</span> · ${esc(p.salle)}</span></span>${statut}</div>
          <div class="dj" style="font-size:22px;margin-top:8px">${fmt(debutReel(p))} – ${p.fin}</div>
          <div class="slot">${horaire(p)} ${fiab(p)}${p.note ? ' · ' + esc(p.note) : ''}</div>
          <div class="next">Voir la soirée et l'ordre de passage</div></button>`;
      });
    } else {
      h += `<p class="conseil">Pas de passage annoncé ce soir. Suis-le avec le cœur : l'appli te prévient dès qu'une date est publiée.</p>`;
    }

    const notes = ceSoir.filter((p) => resumeAvis(p).total);
    if (notes.length) {
      const tot = { top: 0, bien: 0, bof: 0 };
      notes.forEach((p) => { const r = resumeAvis(p); tot.top += r.top; tot.bien += r.bien; tot.bof += r.bof; });
      const n = tot.top + tot.bien + tot.bof;
      const verdicts = notes.map((p) => resumeAvis(p).verdict).filter(Boolean);
      const v = verdicts.find((x) => x.code === 'pepite' || x.code === 'feu') || verdicts[0];
      h += `<div class="section-title">Avis du public <small>${n} avis ce soir</small></div>
        <div class="jour">${v ? `<span class="badge avis-${v.code}">${v.txt}</span>` : '<span class="badge b-est">Pas encore assez d\'avis</span>'}
          ${v && v.code === 'pepite' ? '<p class="conseil" style="margin:8px 0 0">Pas encore une tête d\'affiche, mais le public en parle : un nom à suivre.</p>' : ''}
          <div class="avis-barre"><i class="a-top" style="flex:${tot.top}"></i><i class="a-bien" style="flex:${tot.bien}"></i><i class="a-bof" style="flex:${tot.bof}"></i></div>
          <p class="avis-detail">${tot.top} à ne pas rater · ${tot.bien} sympa · ${tot.bof} bof</p></div>`;
    }

    if (saison.length) {
      const compte = (fn) => { const c = {}; saison.forEach((r) => { const x = fn(r); c[x] = (c[x] || 0) + 1; }); return Object.entries(c).sort((a, b) => b[1] - a[1]); };
      const lieuxTop = compte((r) => r.lieu).slice(0, 3);
      const jourTop = compte((r) => (new Date(r.date + 'T12:00:00').getDay() + 6) % 7)[0];
      const soireesTop = compte((r) => r.soiree).slice(0, 3);
      const fmtD = (d) => { const x = new Date(d + 'T12:00:00'); return `${x.getDate()} ${MOIS[x.getMonth()]}`; };
      h += `<div class="section-title" id="dj-ibiza">À Ibiza · saison 2025 <small>${saison.length} dates</small></div>
        <div class="jour">
          <p class="conseil" style="margin:0">Du <b>${fmtD(saison[0].date)}</b> au <b>${fmtD(saison[saison.length - 1].date)}</b>, surtout le <b>${JOURS_ORD[+jourTop[0]].toLowerCase()}</b> (${jourTop[1]} fois).</p>
          <div class="dj-faits">
            <span><small>Lieux</small>${lieuxTop.map(([id, n]) => `${esc(nomLieu(id))} <b>${n}</b>`).join(' · ')}</span>
            <span><small>Soirées</small>${soireesTop.map(([s, n]) => `${esc(s)} <b>${n}</b>`).join(' · ')}</span>
          </div>
        </div>
        ${rangCartes(saison.map((r) => vCarte({ attr: `data-saison-jour="${r.date}"`, c: '#E5484D', img: imgLieu(lieux[r.lieu]) || ((window.PHOTOS_LIEUX || {})[r.lieu] || {}).f || '', extra: pastilleDj(nom), badge: '🇪🇸 ' + NIVEAUX[r.niveau].court, type: fmtD(r.date) + (r.type ? ' · ' + TYPES[r.type] : ''), nom: esc(nomLieu(r.lieu)), lieu: esc(r.soiree) })
          .replace('dc-carte vc', 'dc-carte vc date-pays').replace('style="--mc:#E5484D"', 'style="--mc:#E5484D;--mc2:#F2C53A"')))}`;
    }
    if (!agendaDj(nom)) h += blocTournee(nom);
    h += blocCommentaires(nom);
    $('#dj-body').innerHTML = h;
    remplirAvatars($('#dj-body'));
  }

  $('#recherche-dj').addEventListener('input', renderSuggestions);
  $('#recherche-dj').addEventListener('focus', renderSuggestions);
  $('#recherche-dj').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const ls = lieuxCherches(e.target.value), s = suggestions(e.target.value);
      const k = sansAccent(e.target.value.trim());
      const vs = villesCherchees(e.target.value);
      if (vs.length && sansAccent(VILLES[vs[0]][0]) === k) allerVille(vs[0]);
      else if (ls[0] && (sansAccent(ls[0].nom).includes(k) || !s[0])) ouvrirLieuRecherche(ls[0].id);
      else if (s[0]) ouvrirDj(s[0]);
      else if (vs.length) allerVille(vs[0]);
    }
    if (e.key === 'Escape') { $('#suggestions-dj').hidden = true; }
  });
  $('#dj-back').addEventListener('click', fermerDj);
  const ouvrirLienDj = (e) => {
    const l = e.target.closest('[data-dj-lien]'); if (!l) return;
    e.preventDefault(); e.stopPropagation();
    if (map) map.closePopup();
    if (state.djOuvert) fermerDj();
    ouvrirDj(l.dataset.djLien);
  };
  document.addEventListener('click', ouvrirLienDj, true);
  document.addEventListener('keydown', (e) => { if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[data-dj-lien]')) ouvrirLienDj(e); }, true);
  document.addEventListener('click', (e) => {
    const s = e.target.closest('.sugg[data-dj]');
    if (s) { ouvrirDj(s.dataset.dj); return; }
    const rf = e.target.closest('[data-rech-filtre]');
    if (rf) { state.rechFiltre = rf.dataset.rechFiltre; renderSuggestions(); $('#recherche-dj').focus(); return; }
    const sv = e.target.closest('[data-ville]');
    if (sv) { allerVille(+sv.dataset.ville); return; }
    const sl = e.target.closest('[data-lieu-sugg]');
    if (sl) { ouvrirLieuRecherche(sl.dataset.lieuSugg); return; }
    if (!e.target.closest('.recherche')) $('#suggestions-dj').hidden = true;
    const sj = e.target.closest('[data-saison-jour]');
    if (sj) {
      fermerDj();
      state.annee = '2025'; store.set('annee', '2025'); state.vue25 = 'cal';
      state.jour25 = sj.dataset.saisonJour; state.mois25 = +sj.dataset.saisonJour.slice(5, 7) - 1;
      setTab('agenda');
      return;
    }
    if (state.djOuvert && e.target.closest('#sheet-dj [data-lieu]')) fermerDj();
    if (state.djOuvert && e.target.closest('#sheet-dj [data-fav]')) setTimeout(renderDj, 0);
  });

  // ---------- Destinations : Ibiza, Mykonos, Tulum, Miami, Dubaï
  // Chaque destination a sa saison (affluence mois par mois), ses temps forts, ses lieux et ses billetteries.
  // Seule Ibiza a des line-ups en direct dans la démo ; ailleurs, on montre la saison et les lieux.
  const DESTS = window.DESTS || [];
  const DEST = {};
  DESTS.forEach((d) => { DEST[d.id] = d; });
  const LIEUX_DEST = {};
  DESTS.forEach((d) => d.lieux.forEach((l) => { LIEUX_DEST[l.id] = { ...l, dest: d.id }; }));
  const MOIS_NOW = new Date().getMonth();
  const ABR_MOIS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
  const heureLocale = (tz) => { try { return new Intl.DateTimeFormat('fr-FR', { timeZone: tz, hour: '2-digit', minute: '2-digit' }).format(new Date()); } catch (e) { return fmt(state.t); } };
  const decalage = (tz) => { try { const f = (z) => new Date(new Date().toLocaleString('en-US', { timeZone: z })); const h = Math.round((f(tz) - f(Intl.DateTimeFormat().resolvedOptions().timeZone)) / 3600000); return h === 0 ? T('meme_heure') : T('decalage', { h: (h > 0 ? '+' : '−') + Math.abs(h) }); } catch (e) { return ''; } };
  const labelMois = (n) => n < 0 ? T('hors') : NIVEAUX[n].label;
  const pastilleMois = (n, petit) => n < 0 ? `<span class="niv niv-hors${petit ? ' petit' : ''}">${T('hors')}</span>` : pastille(n, petit);
  const reprise = (d, m) => { for (let i = 1; i <= 12; i++) { const k = (m + i) % 12; if (d.mois[k] >= 0) return moisNom(k); } return ''; };
  // Conseil pour l'utilisateur selon la popularité estimée du mois
  const CONSEIL_VENTE = {
    '-1': 'Hors saison : la plupart des lieux sont fermés.',
    0: 'Peu de monde : idéal pour danser à l\'aise, entrées plus faciles.',
    1: 'Du monde, surtout le week-end : réserve les grosses soirées.',
    2: 'Beaucoup de monde : prends tes billets à l\'avance.',
    3: 'Saturé : les billets partent des semaines avant, réserve tôt.'
  };
  const evenementsAVenir = (d, m) => d.evenements.slice().sort((a, b) => ((a.mois - m + 12) % 12) - ((b.mois - m + 12) % 12));
  const dansMois = (k, m) => { const x = (k - m + 12) % 12; return x === 0 ? 'ce mois-ci' : x === 1 ? 'le mois prochain' : 'dans ' + x + ' mois'; };
  const listeBillets = (d) => rangCartes(d.billetterie.map((b) => vCarte({ tag: b.url ? 'a' : 'div', attr: b.url ? `href="${b.url}" target="_blank" rel="noopener"` : '', c: '#A77BFF',
    badge: 'Billets', nom: esc(b.nom), lieu: esc(b.affil), bas: [b.url ? 'Voir les billets →' : 'Bientôt'] })).map((x) => x.replace('dc-carte vc', 'dc-carte vc vc-petite')));
  const barreAnnee = (d) => `<div class="barre-annee" aria-label="Affluence de ${esc(d.nom)} mois par mois">${d.mois.map((n, k) =>
    `<span class="ba ${n < 0 ? 'niv-hors' : 'niv-' + NIVEAUX[n].code} ${k === MOIS_NOW ? 'now' : ''}" title="${moisNom(k)} : ${labelMois(n)}"><i>${ABR_MOIS[k]}</i></span>`).join('')}</div>`;

  Object.assign(state, {
    dest: store.get('mode', 'geo') === 'ibiza' ? 'ibiza' : 'local',
    anMois: MOIS_NOW
  });

  function changerDest(id, silencieux) {
    if (!DEST[id]) return;
    state.dest = id; store.set('dest', id);
    majModeUI();
    if (map) { map.closePopup(); map.setView(DEST[id].centre, DEST[id].zoom); }
    if (DEST[id].local && state.maPos && !state.villeChoisie) { DEST[id].centre = [state.maPos.lat, state.maPos.lng]; if (map) map.setView(DEST[id].centre, 14); }
    dessinerMoi();
    if (!silencieux) render();
  }


  // Carte de la destination (Ibiza, Mykonos, Tulum, Miami, Dubaï…) : contour de l'île quand on l'a, lieux à leur vraie place.
  // Un appui ouvre la grande carte sur cette destination.
  const CONTOURS = {
    ibiza: [[1.52,39.115],[1.44,39.095],[1.38,39.06],[1.30,39.015],[1.295,38.985],[1.24,38.975],[1.215,38.958],[1.232,38.94],[1.215,38.912],[1.218,38.89],[1.28,38.862],[1.32,38.864],[1.385,38.838],[1.405,38.858],[1.41,38.885],[1.445,38.905],[1.465,38.92],[1.53,38.95],[1.545,38.98],[1.585,39.0],[1.595,39.025],[1.59,39.075],[1.555,39.1]],
    mykonos: [[25.32,37.45],[25.33,37.47],[25.36,37.49],[25.40,37.50],[25.44,37.48],[25.46,37.46],[25.47,37.44],[25.43,37.41],[25.39,37.40],[25.35,37.40],[25.32,37.42]]
  };
  // Grande carte illustrée d'Ibiza : île néon, quartiers, Es Vedrà, clubs et plages numérotés (touche un lieu pour sa fiche)
  const ILE_IBIZA = [[1.611,39.087],[1.575,39.112],[1.52,39.118],[1.47,39.105],[1.43,39.09],[1.39,39.068],[1.35,39.045],[1.33,39.035],[1.295,39.01],[1.292,38.993],[1.302,38.976],[1.275,38.968],[1.24,38.966],[1.215,38.955],[1.228,38.945],[1.212,38.925],[1.216,38.9],[1.245,38.878],[1.275,38.862],[1.31,38.858],[1.35,38.85],[1.385,38.836],[1.402,38.85],[1.405,38.872],[1.418,38.888],[1.44,38.9],[1.452,38.905],[1.47,38.918],[1.5,38.93],[1.535,38.948],[1.556,38.97],[1.585,38.99],[1.6,39.02],[1.615,39.05]];
  // Carte illustrée d'Ibiza (visuel fourni par Antonio) : repères placés à la main sur l'illustration, en % de l'image.
  // Catégories : club (discothèques), plage (beach clubs), bar (sunset et bars musicaux), pool (pool clubs et autres lieux musicaux)
  const CAT_IBIZA = { club: ['Clubs', '#FF4FA3'], plage: ['Beach clubs', '#3DD6C6'], bar: ['Bars', '#F2B53A'], pool: ['Pool clubs', '#8B7BFF'] };
  const REPERES_IBIZA = [
    // lieux de l'appli (fiche existante)
    ['pacha', 'club', 62, 61], ['chinois', 'club', 57.5, 65], ['lio', 'club', 72, 63.5], ['destino', 'club', 79, 57],
    ['hi', 'club', 52, 78], ['ushuaia', 'club', 58, 78], ['dc10', 'club', 55, 72.5], ['unvrs', 'club', 49, 50], ['amnesia', 'club', 55, 51.5],
    ['covasanta', 'club', 42, 69], ['akasha', 'club', 88, 34], ['eden', 'club', 30.5, 44.5], ['espardis', 'club', 27, 42.5], ['528', 'club', 40, 47],
    ['borabora', 'plage', 64, 78], ['bluemarlin', 'plage', 20.5, 68.5],
    ['mambo', 'bar', 16.5, 44], ['cafedelmar', 'bar', 20, 45.8], ['pikes', 'pool', 33, 40], ['obeach', 'pool', 22, 49.5], ['rocks', 'pool', 26, 47],
    // autres lieux (repère seul pour la démo)
    [null, 'plage', 70, 79, 'Nassau Beach Club', "Playa d'en Bossa"], [null, 'plage', 52, 83, 'Tanit Beach', "Playa d'en Bossa"],
    [null, 'plage', 58, 83, 'Coco Beach', "Playa d'en Bossa"], [null, 'plage', 64, 83, 'Seahorse Ibiza', "Playa d'en Bossa"],
    [null, 'plage', 13, 51, 'Cala Bassa Beach Club', 'Cala Bassa'], [null, 'plage', 11, 56.5, 'Cotton Beach Club', 'Cala Tarida'],
    [null, 'plage', 63, 93, 'Experimental Beach', 'Ses Salines · Cap des Falcó'], [null, 'plage', 89, 46, 'Nikki Beach', 'Santa Eulària'],
    [null, 'plage', 92, 40, 'Aiyanna', 'Cala Nova'], [null, 'plage', 87, 52, 'Amante', "Sol d'en Serra"],
    [null, 'plage', 40, 24, 'Elements', 'Benirràs'], [null, 'plage', 71, 91, 'El Chiringuito', 'Es Cavallet'],
    [null, 'bar', 18, 48.5, 'Kumharas', 'Baie de Sant Antoni'], [null, 'bar', 25, 37.5, 'Hostal La Torre', 'Cap Negret'],
    [null, 'bar', 84, 31, 'Las Dalias', 'Sant Carles'], [null, 'bar', 70, 84, "Murphy's Ibiza", "Playa d'en Bossa"], [null, 'bar', 66, 64.5, 'Tigre Morado', 'Eivissa'],
    [null, 'pool', 29, 47.5, 'Bam-Bu-Ku', 'Sant Antoni'], [null, 'pool', 54, 88, 'NoHo Ibiza', "Playa d'en Bossa"],
    [null, 'pool', 60, 88, 'Zazú Ibiza', "Playa d'en Bossa"], [null, 'pool', 66, 88, 'The Beach, Unexpected Ibiza', "Playa d'en Bossa"],
    [null, 'pool', 14, 61, 'El Silencio', 'Cala Molí']
  ];
  // Fiches des lieux d'Ibiza ajoutés sur la carte (démo : descriptions courtes, horaires indicatifs à vérifier)
  const FICHES_IBIZA = {
    'Nassau Beach Club': "Beach club chic de Playa d'en Bossa : transats, cuisine méditerranéenne et DJ house au coucher du soleil.",
    'Tanit Beach': "Restaurant de plage à Playa d'en Bossa, ambiance lounge et musique house en journée.",
    'Coco Beach': "Beach club familial et festif à Playa d'en Bossa, transats, cocktails et DJ l'après-midi.",
    'Seahorse Ibiza': "Beach club d'hôtel à Playa d'en Bossa, piscine face à la mer et sets deep house.",
    'Cala Bassa Beach Club': "Beach club sous les pins dans la crique de Cala Bassa, eau turquoise et musique chill.",
    'Cotton Beach Club': "Beach club perché sur la falaise de Cala Tarida, vue sur le coucher du soleil.",
    'Experimental Beach': "Chiringuito branché vers Ses Salines, cocktails signature et DJ au sunset.",
    'Nikki Beach': "Beach club glamour à Santa Eulària, piscine, champagne et DJ house le week-end.",
    'Aiyanna': "Restaurant de plage bohème à Cala Nova, cuisine bio et ambiance détente.",
    'Amante': "Restaurant de plage romantique à Sol d'en Serra, terrasse sur la falaise et musique douce.",
    'Elements': "Beach club de la baie de Benirràs, connue pour ses tambours au coucher du soleil.",
    'El Chiringuito': "Restaurant de plage à Es Cavallet, dans le parc naturel de Ses Salines.",
    'Kumharas': "Bar sunset de la baie de Sant Antoni, ambiance hippie, concerts et DJ au coucher du soleil.",
    'Hostal La Torre': "Terrasse sur les rochers de Cap Negret, l'un des couchers de soleil les plus calmes de l'île.",
    'Las Dalias': "Marché hippie mythique de Sant Carles, avec bar, concerts et soirées.",
    "Murphy's Ibiza": "Pub irlandais de Playa d'en Bossa, sport à l'écran, before et after des clubs.",
    'Tigre Morado': "Bar à cocktails et salle de concerts dans le port d'Eivissa, DJ et live jusque tard.",
    'Bam-Bu-Ku': "Bar lounge de Sant Antoni, décor asiatique, cocktails et DJ house.",
    'NoHo Ibiza': "Pool club de Playa d'en Bossa, piscine, transats et DJ l'après-midi.",
    'Zazú Ibiza': "Pool club et restaurant de Playa d'en Bossa, ambiance festive au bord de la piscine.",
    'The Beach, Unexpected Ibiza': "Beach club d'hôtel à Playa d'en Bossa, pool parties et DJ en journée.",
    'El Silencio': "Restaurant de plage à Cala Molí, ambiance bohème chic, DJ au coucher du soleil."
  };
  const HORAIRES_CAT = { plage: '10h – 00h (saison)', bar: '17h – 03h', pool: '11h – 21h (saison)', club: '23h – 06h', event: 'selon l\'événement' };
  const NOM_CAT = { plage: 'Beach club', bar: 'Bar', pool: 'Pool club', club: 'Club', event: 'Grandes soirées' };
  const cleX = (n) => 'x-' + n.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  // Carte illustrée de Dubaï (visuel fourni par Antonio) : les repères tombent sur les points dessinés de l'illustration
  const CAT_DUBAI = { club: ['Clubs', '#FF4FA3'], plage: ['Beach clubs', '#3DD6C6'], event: ['Grandes soirées', '#F2B53A'] };
  const REPERES_DUBAI = [
    [null, 'plage', 17, 12.5, 'White Beach', 'Atlantis The Palm'], [null, 'plage', 43.9, 17.1, 'BCH:CLB', 'Palm Jumeirah'],
    [null, 'event', 74.4, 28.2, 'Coca-Cola Arena', 'City Walk'], [null, 'plage', 30.5, 37.1, 'Zero Gravity', 'Dubai Marina'],
    [null, 'club', 63.5, 42.1, 'Armani/Privé', 'Downtown · Burj Khalifa'], [null, 'plage', 20.1, 48.1, 'Barasti', 'Dubai Marina'],
    [null, 'club', 91.5, 53.5, 'Sky 2.0', 'Dubai Design District'], [null, 'club', 57.2, 59.9, 'BLU Dubai', 'Downtown'],
    [null, 'club', 79.6, 77, 'Soho Garden', 'Meydan · avec HIVE et CODE'],
    [null, 'event', 15, 72, 'Ushuaïa Dubai Harbour Experience', 'Dubai Harbour'],
    [null, 'plage', 32, 30, 'Bohemia Beach Club', 'Palm Jumeirah'], [null, 'plage', 26, 25, 'Playa Pacha', 'Palm Jumeirah'],
    [null, 'plage', 37.5, 31, 'Be Beach', 'Dubai Harbour'], [null, 'club', 22, 21, 'The Penthouse', 'Palm Jumeirah'],
    [null, 'club', 26, 43, 'Cavo Dubai', 'Dubai Marina']
  ];
  const FICHES_DUBAI = {
    'White Beach': "Beach club de l'Atlantis The Palm, piscines face au golfe et DJ house l'après-midi.",
    'BCH:CLB': 'Beach club sur la Palm Jumeirah, ambiance festive et DJ au coucher du soleil.',
    'Coca-Cola Arena': 'La grande salle de Dubaï pour les concerts et les grosses soirées électroniques.',
    'Zero Gravity': 'Beach club de Dubai Marina, piscine, plage et soirées DJ jusque tard.',
    'Armani/Privé': "Club chic de l'hôtel Armani, au pied de la Burj Khalifa, DJ house et hip-hop.",
    'Barasti': 'Bar de plage mythique de Dubai Marina, sunset, concerts et DJ.',
    'Sky 2.0': 'Club en plein air de Dubai Design District, gros DJ et shows lumière.',
    'BLU Dubai': 'Club de Downtown, hip-hop, R&B et DJ invités.',
    'Soho Garden': 'Grand complexe de Meydan avec plusieurs salles, dont HIVE et CODE : techno et house.',
    'Ushuaïa Dubai Harbour Experience': "La version dubaïote d'Ushuaïa : grandes soirées électroniques en plein air.",
    'Bohemia Beach Club': 'Beach club de la Palm Jumeirah, DJ au coucher du soleil.',
    'Playa Pacha': 'Le beach club de Pacha sur la Palm Jumeirah, soirées Pacha ICONS.',
    'Be Beach': 'Beach club de Dubai Harbour, transats, piscine et événements DJ.',
    'The Penthouse': 'Rooftop club de la Palm Jumeirah, soirées house et DJ internationaux.',
    'Cavo Dubai': 'Rooftop de Dubai Marina, DJ et soirées plus régulières.'
  };
  const LIEUX_IBIZA_PLUS = {};
  REPERES_IBIZA.forEach((r) => { if (!r[0]) { const id = cleX(r[4]); LIEUX_IBIZA_PLUS[id] = { id, nom: r[4], zone: r[5], cat: r[1], type: r[1] === 'plage' ? 'plage' : 'club', ville: 'Ibiza' }; } });
  REPERES_DUBAI.forEach((r) => { const id = cleX(r[4]); LIEUX_IBIZA_PLUS[id] = { id, nom: r[4], zone: r[5], cat: r[1], type: r[1] === 'plage' ? 'plage' : 'club', ville: 'Dubaï' }; });
  function renderSheetIbizaPlus(l) {
    $('#sheet-status').innerHTML = '<span class="badge b-est">DJ à confirmer</span>';
    const q = l.nom + ' ' + (l.ville === 'Dubaï' ? 'Dubai' : 'Ibiza') + ' ' + (l.zone || '');
    $('#sheet-body').innerHTML = `<div class="hero">${photo(l, 'hero-img')}</div><h2>${esc(l.nom)}</h2>
      <div class="meta">${NOM_CAT[l.cat]} · ${esc(l.zone)} · ${l.ville}</div>
      <div class="event"><div class="event-title">${esc(FICHES_IBIZA[l.nom] || FICHES_DUBAI[l.nom] || NOM_CAT[l.cat] + ' à ' + l.zone + '.')}</div>
        <div class="event-sub">Horaires habituels : ${HORAIRES_CAT[l.cat]}</div></div>
      <p class="conseil">Les DJ de ce lieu ne sont pas encore annoncés dans Banzic. Le lieu et ses DJ pourront publier leurs dates eux-mêmes.</p>
      <p class="demo-note">Fiche de démonstration : description et horaires indicatifs, à vérifier avant d'y aller.</p>`;
    $('#sheet-actions').innerHTML = `
      <a class="btn-ghost" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}" target="_blank" rel="noopener">Itinéraire</a>
      <a class="btn-main" href="https://www.google.com/search?q=${encodeURIComponent(q + ' soirée')}" target="_blank" rel="noopener">Voir ses soirées</a>`;
  }
  const CARTES_ILLUS = { ibiza: { nom: "Carte d'Ibiza", img: 'ibiza-plan.jpg', cats: () => CAT_IBIZA, reps: () => REPERES_IBIZA }, dubai: { nom: 'Carte de Dubaï', img: 'dubai-plan.jpg', cats: () => CAT_DUBAI, reps: () => REPERES_DUBAI } };
  function carteIbizaGrande(dest) {
    const cfg = CARTES_ILLUS[dest || 'ibiza'], CAT_IBIZA = cfg.cats();
    const t = state.t, idx = dest === 'dubai' ? {} : Object.fromEntries(D.lieux.map((l) => [l.id, l]));
    const reps = cfg.reps().filter((r) => !r[0] || idx[r[0]]).map((r) => { const l = r[0] ? idx[r[0]] : null;
      return { id: r[0], cat: r[1], x: r[2], y: r[3], nom: l ? l.nom.replace(/\s*·.*$/, '').replace('Playa Soleil', 'Playa Soleil') : r[4], zone: l ? l.zone : r[5], st: l ? statutLieu(l.id, t).code : '' }; });
    reps.sort((a, b) => a.y - b.y || a.x - b.x); reps.forEach((r, i) => { r.n = i + 1; });
    const coul = (r) => r.st === 'ferme' ? '#5A6378' : CAT_IBIZA[r.cat][1];
    const attr = (r) => `data-lieu="${r.id || cleX(r.nom)}"`;
    const TYPE_ART = { club: 'club', plage: 'plage', bar: 'bar', pool: 'rooftop', event: 'club' };
    const visuel = (r) => r.id ? imgLieu(idx[r.id]) : ((window.PHOTOS_LIEUX || {})[cleX(r.nom)] || {}).f || artLieu({ nom: r.nom, type: TYPE_ART[r.cat] });
    const stTxt = (r) => r.st === 'live' ? 'En live' : r.st === 'ferme' ? 'Fermé' : r.st === 'bientot' ? 'Bientôt' : '';
    const pins = reps.map((r) => `<button class="ci-pin${r.st === 'live' ? ' on' : ''}" data-cat="${r.cat}" data-ci-pin="${r.n}" data-ci-id="${r.id || cleX(r.nom)}" data-ci-nom="${esc(r.nom)}" data-ci-zone="${esc(r.zone || '')}" data-ci-img="${esc(visuel(r))}" data-ci-cat="${esc(CAT_IBIZA[r.cat][0])}" data-ci-st="${stTxt(r)}" style="left:${r.x}%;top:${r.y}%;--c:${coul(r)}" aria-label="${r.n}. ${esc(r.nom)}">${r.n}</button>`).join('');
    const statutTxt = (r) => r.st === 'live' ? '<em class="ci-live">Live</em>' : r.st === 'ferme' ? '<em class="ci-ferme">Fermé</em>' : '';
    const legende = Object.keys(CAT_IBIZA).map((c) => { const rs = reps.filter((r) => r.cat === c);
      return `<div class="ci-groupe" data-cat="${c}"><h3 style="--c:${CAT_IBIZA[c][1]}">${CAT_IBIZA[c][0]} <small>${rs.length}</small></h3><div class="ci-rang">` + rs.map((r) => `<button class="ci-carte" ${attr(r)} style="--c:${CAT_IBIZA[c][1]}"><span class="ci-carte-img" style="background-image:url('${visuel(r)}')"><i style="--c:${coul(r)}">${r.n}</i>${statutTxt(r)}</span><b>${esc(r.nom)}</b><small>${esc(r.zone || '')}</small></button>`).join('') + '</div></div>'; }).join('');
    const menu = [['tout', 'Tout', reps.length, '#C9CFDD'], ...Object.entries(CAT_IBIZA).map(([k, [n, c]]) => [k, n, reps.filter((r) => r.cat === k).length, c])]
      .map(([k, n, nb, c]) => `<button class="ci-f${k === 'tout' ? ' on' : ''}" data-ci-f="${k}" style="--c:${c}">${n} <small>${nb}</small></button>`).join('');
    const vivants = reps.filter((r) => r.st === 'live').length;
    return `<section class="ci" data-f="tout"><div class="ci-tete"><div><h2>${cfg.nom}</h2><small>${reps.length} lieux${dest === 'dubai' ? ' · clubs, beach clubs et grandes soirées' : ' · ' + vivants + ' en live maintenant'}</small></div><button class="ci-ouvrir" data-tab="map">Plein écran</button></div>
      <div class="ci-menu">${menu}</div>
      <div class="ci-art"><img class="ci-img" src="${cfg.img}" alt="${cfg.nom}">${pins}<div class="ci-bulle" hidden></div></div>
      </section>`;
  }
  // Bulle d'aperçu : au survol (souris) ou en posant / glissant le doigt sur les repères, une mini-fiche apparaît
  function bulleCarte(pin) {
    const art = pin.closest('.ci-art'), b = art.querySelector('.ci-bulle'); if (!b) return;
    if (b.dataset.pour === pin.dataset.ciPin && !b.hidden) return;
    art.querySelectorAll('.ci-pin.actif').forEach((x) => x.classList.remove('actif')); pin.classList.add('actif');
    const d = pin.dataset, cible = `data-lieu="${d.ciId}"`;
    b.innerHTML = `<button class="ci-bulle-in" ${cible}><span class="ci-bulle-img" style="background-image:url('${d.ciImg}')">${d.ciSt ? `<em class="${d.ciSt === 'En live' ? 'ci-live' : 'ci-ferme'}">${d.ciSt}</em>` : ''}</span>
      <span class="ci-bulle-txt"><small style="color:${getComputedStyle(pin).getPropertyValue('--c')}">${d.ciCat}</small><b>${d.ciNom}</b><span>${d.ciZone}</span><i>Voir la fiche ›</i></span></button>`;
    b.dataset.pour = d.ciPin; b.hidden = false;
    const W = art.clientWidth, H = art.clientHeight, x = pin.offsetLeft, y = pin.offsetTop, bw = b.offsetWidth, bh = b.offsetHeight;
    const gauche = Math.max(6, Math.min(W - bw - 6, x - bw / 2)), haut = y - bh - 18 >= 6 ? y - bh - 18 : Math.min(H - bh - 6, y + 18);
    b.style.left = gauche + 'px'; b.style.top = haut + 'px';
    b.style.setProperty('--fx', Math.max(14, Math.min(bw - 14, x - gauche)) + 'px'); b.classList.toggle('dessous', haut > y);
  }
  const cacherBulle = (art) => { const b = art && art.querySelector('.ci-bulle'); if (b) { b.hidden = true; b.dataset.pour = ''; } art && art.querySelectorAll('.ci-pin.actif').forEach((x) => x.classList.remove('actif')); };
  document.addEventListener('pointerover', (e) => { if (e.pointerType !== 'mouse') return; const pin = e.target.closest('.ci-pin'); if (pin) bulleCarte(pin); });
  document.addEventListener('pointerdown', (e) => { const pin = e.target.closest('.ci-pin'); if (pin) { pin.dataset.deja = pin.classList.contains('actif') ? '1' : ''; bulleCarte(pin); try { pin.releasePointerCapture(e.pointerId); } catch (err) { /* */ } } });
  document.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'mouse' || !e.buttons) return;
    const el = document.elementFromPoint(e.clientX, e.clientY), pin = el && el.closest('.ci-pin');
    if (pin) bulleCarte(pin);
  });
  document.addEventListener('click', (e) => {
    const pinC = e.target.closest('.ci-pin'); if (pinC) { e.stopPropagation(); if (pinC.dataset.deja) ouvrirLieu(pinC.dataset.ciId); return; }
    const art = e.target.closest('.ci-art'); if (art) setTimeout(() => cacherBulle(art), 0);
  }, true);
  document.addEventListener('click', (e) => {
    const f = e.target.closest('[data-ci-f]');
    if (f) { const sec = f.closest('.ci'); sec.dataset.f = f.dataset.ciF; sec.querySelectorAll('.ci-f').forEach((b) => b.classList.toggle('on', b === f)); return; }
    const r = e.target.closest('[data-repere]'); if (r) toast(r.dataset.repere);
  });
  function carteDest(d) {
    const ibiza = d.id === 'ibiza', t = state.t;
    const ls = (ibiza ? D.lieux : Object.values(LIEUX_DEST).filter((l) => l.dest === d.id)).filter((l) => l.lat != null);
    if (!ls.length) return '';
    const W = 340, H = 190, cont = CONTOURS[d.id] || null;
    const pts = ls.map((l) => [l.lng, l.lat]).concat(cont || []);
    let x0 = Math.min(...pts.map((p) => p[0])), x1 = Math.max(...pts.map((p) => p[0])), y0 = Math.min(...pts.map((p) => p[1])), y1 = Math.max(...pts.map((p) => p[1]));
    const k = Math.cos(((y0 + y1) / 2) * Math.PI / 180), padX = (x1 - x0) * .12 + .004, padY = (y1 - y0) * .14 + .004;
    x0 -= padX; x1 += padX; y0 -= padY; y1 += padY;
    const sc = Math.min(W / ((x1 - x0) * k), H / (y1 - y0)), ox = (W - (x1 - x0) * k * sc) / 2, oy = (H - (y1 - y0) * sc) / 2;
    const P = (lo, la) => [ox + (lo - x0) * k * sc, oy + (y1 - la) * sc];
    const ile = cont ? `<path d="M${cont.map((c) => P(c[0], c[1]).map((v) => v.toFixed(1)).join(' ')).join(' L')} Z" fill="#16233F" stroke="#3DD6C6" stroke-opacity=".45" stroke-width="1.2" stroke-linejoin="round"/>` : '';
    const st = (l) => ibiza ? statutLieu(l.id, t).code : 'saison';
    const coul = (l) => { const c = st(l); return c === 'live' ? (l.type === 'plage' ? '#3DD6C6' : '#FF8A3D') : c === 'bientot' ? '#F2B53A' : c === 'saison' ? (l.type === 'plage' ? '#3DD6C6' : '#FF8A3D') : '#5A6378'; };
    const vivants = ls.filter((l) => st(l) === 'live');
    const noms = (ibiza ? vivants : ls).slice(0, 7);
    const pins = ls.map((l) => { const [x, y] = P(l.lng, l.lat), on = st(l) === 'live';
      return (on ? `<circle class="mm-pulse" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="9" fill="${coul(l)}" opacity=".35"/>` : '') + `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${on ? 4.6 : 3.4}" fill="${coul(l)}" stroke="#0A0F22" stroke-width="1.2"/>`; }).join('');
    const poses = [];
    const etiq = noms.map((l) => { const [x, y] = P(l.lng, l.lat); if (poses.some(([a, b]) => Math.abs(a - x) < 60 && Math.abs(b - y) < 11)) return ''; poses.push([x, y]); return `<text x="${(x + 7).toFixed(1)}" y="${(y + 3).toFixed(1)}" font-size="8.5" font-weight="700" fill="#E9ECF4" paint-order="stroke" stroke="#0A0F22" stroke-width="2.6">${esc(l.nom.replace(/\s*·.*$/, '').slice(0, 16))}</text>`; }).join('');
    const svg = `<svg class="dc-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" aria-hidden="true"><defs><radialGradient id="mer-${d.id}" cx="50%" cy="45%" r="75%"><stop offset="0" stop-color="#0E2147"/><stop offset="1" stop-color="#070C1C"/></radialGradient></defs>
      <rect width="${W}" height="${H}" fill="url(#mer-${d.id})"/>${ile}${pins}${etiq}</svg>`;
    const badge = ibiza ? `<span class="acc-badge"><i></i>${vivants.length} lieu${vivants.length > 1 ? 'x' : ''} en live</span>` : `<span class="acc-badge or">${ls.length} lieux</span>`;
    return `<button class="dest-carte" data-tab="map" aria-label="Ouvrir la carte de ${esc(d.nom)}"><span class="dest-carte-art">${svg}${badge}<span class="mm-ouvrir">Ouvrir la carte</span></span>
      <span class="dest-carte-txt"><b>Carte ${/^[AEIOUYÉ]/i.test(d.nom) ? "d'" : 'de '}${esc(d.nom)}</b><small>${ibiza ? 'Clubs et plages · orange : club en live · turquoise : plage en live · gris : fermé' : 'Clubs et beach clubs de la saison'}</small></span></button>`;
  }

  // Carte « Agenda » de la destination : les 12 mois colorés selon l'affluence, un appui ouvre l'agenda complet
  function carteAgendaDest(d) {
    if (!d || d.local || !d.mois) return '';
    const COUL = ['#3FBF7F', '#F59E2E', '#E5484D', '#0A0A0F'];
    const mois = d.mois.map((n, k) => `<span class="ag-m${k === MOIS_NOW ? ' now' : ''}" style="background:${n < 0 ? 'rgba(255,255,255,.06)' : COUL[n]}"><i>${ABR_MOIS[k]}</i></span>`).join('');
    return `<button class="dest-agenda" data-dest-agenda="${d.id}"><span class="dest-agenda-tete"><b>Agenda ${/^[AEIOUYÉ]/i.test(d.nom) ? "d'" : 'de '}${esc(d.nom)}</b><span class="mm-ouvrir">Ouvrir l'agenda</span></span>
      <span class="dest-agenda-mois">${mois}</span>
      <small>Toute l'année · prévisions · calendrier jour par jour · tendances · vert : peu de monde · rouge : beaucoup · noir : saturé</small></button>`;
  }
  document.addEventListener('click', (e) => { const b = e.target.closest('[data-dest-agenda]'); if (!b) return; state.dest = b.dataset.destAgenda; state.annee = 'annee'; store.set('annee', 'annee'); state.retourAgenda = b.dataset.destAgenda; setTab('agenda'); });
  // Bouton « Retour » en haut de l'agenda quand on y arrive depuis la page d'une destination
  (() => {
    const scr = document.getElementById('screen-agenda'); if (!scr) return;
    const poser = () => {
      if (!state.retourAgenda || state.tab !== 'agenda' || scr.querySelector('.retour-ag')) return;
      const d = DEST[state.retourAgenda]; if (!d) return;
      scr.insertAdjacentHTML('afterbegin', `<button class="retour-ag" data-retour-ag="1"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>Retour à ${esc(d.nom)}</button>`);
    };
    new MutationObserver(poser).observe(scr, { childList: true });
    document.addEventListener('click', (e) => {
      if (e.target.closest('[data-retour-ag]')) { const id = state.retourAgenda; state.retourAgenda = null; state.dest = id; state.vueAcc = 'liste'; setTab('live'); return; }
      if (e.target.closest('nav [data-tab]')) state.retourAgenda = null;
    });
  })();

  // Agenda réel de Dubaï (agenda-dubai.js) : à partir d'aujourd'hui, date réelle du téléphone
  const AG_DXB = window.AGENDA_DUBAI || { lieux: {}, soirees: [] };
  const isoAuj = () => { const x = new Date(); return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'); };
  const soireesDubai = () => AG_DXB.soirees.filter((r) => r[0] >= isoAuj()).map(([date, heure, lieu, titre, djs, url]) => ({ date, heure, lieu, titre, djs, url, nomLieu: AG_DXB.lieux[lieu] || lieu }));
  function blocAgendaDubai() {
    const xs = soireesDubai(); if (!xs.length) return '';
    const auj = isoAuj(), fmtJ = (iso) => { const x = new Date(iso + 'T12:00'); return ['Dim.', 'Lun.', 'Mar.', 'Mer.', 'Jeu.', 'Ven.', 'Sam.'][x.getDay()] + ' ' + x.getDate() + ' ' + MOIS[x.getMonth()]; };
    const img = (r) => ((window.PHOTOS_LIEUX || {})[r.lieu] || {}).f || ((window.PHOTOS_VILLES || {})['Dubaï'] || {}).f || '';
    const carte = (r) => { const dj = (r.djs || '').split(/,| b2b /i)[0].trim(); const j = Math.round((new Date(r.date + 'T12:00') - new Date(auj + 'T12:00')) / 86400000);
      return vCarte({ tag: 'a', attr: `href="${esc(r.url)}" target="_blank" rel="noopener"`, c: '#FF8A3D', img: img(r), extra: dj && fondAvatarDj(dj) ? pastilleDj(dj) : '',
        badge: j === 0 ? 'Ce soir' : j === 1 ? 'Demain' : j <= 7 ? 'Dans ' + j + ' j' : '🇦🇪 Dubaï', type: fmtJ(r.date) + (r.heure ? ' · ' + r.heure : ''), nom: esc(r.djs || r.titre), lieu: esc(r.nomLieu), bas: ['Billets →'] })
        .replace('dc-carte vc', 'dc-carte vc date-pays').replace('style="--mc:#FF8A3D"', 'style="--mc:#FF8A3D;--mc2:#B23DFF"'); };
    const ceSoir = xs.filter((r) => r.date === auj), semaine = xs.filter((r) => r.date > auj && r.date <= new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10)), apres = xs.filter((r) => !ceSoir.includes(r) && !semaine.includes(r));
    let h = '';
    h += `<div class="section-title">Ce soir à Dubaï <small>${fmtJ(auj)}</small></div>` + (ceSoir.length ? rangCartes(ceSoir.map(carte)) : `<p class="conseil">Pas de soirée annoncée ce soir. La prochaine : <b>${esc(xs[0].djs || xs[0].titre)}</b>, ${fmtJ(xs[0].date)} à ${esc(xs[0].nomLieu)}.</p>`);
    if (semaine.length) h += `<div class="section-title">Cette semaine <small>${semaine.length} soirées</small></div>` + rangCartes(semaine.map(carte));
    if (apres.length) h += `<div class="section-title">Plus tard <small>jusqu'au ${fmtJ(xs[xs.length - 1].date)}</small></div>` + rangCartes(apres.map(carte));
    return h + `<p class="aide">Agenda réel relevé le ${new Date(AG_DXB.maj + 'T12:00').getDate()} ${MOIS[new Date(AG_DXB.maj + 'T12:00').getMonth()]} sur Platinumlist et Resident Advisor. Vérifie toujours sur la page billets.</p>`;
  }

  // Bandeau d'actualité des pages saison (Ibiza, Dubaï, Miami…) : sets en cours, line-ups confirmés, DJ déclarés, spots, soirées du jour
  function filDest() {
    const d = DEST[state.dest]; if (!d) return '';
    const kmL = (la, lo) => d.local && la != null ? ' · ' + (distKm(d.centre, [la, lo]) < 1 ? '< 1' : Math.round(distKm(d.centre, [la, lo]))) + ' km' : '';
    const dur = (m) => m >= 60 ? Math.floor(m / 60) + ' h' + (m % 60 ? String(m % 60).padStart(2, '0') : '') : m + ' min';
    const item = (k, tag, attr, nom, l1, l2, visO) => { const vis = visO != null ? visO : k === 'spot' ? '' : visFil(nom); return `<button class="fil-item k-${k}${vis ? ' a-vis' : ''}" ${attr}>${vis}<span class="fil-l1"><em class="fil-tag ${k}">${tag}</em><b>${esc(nom)}</b>${l1 ? `<span class="fil-t">${l1}</span>` : ''}</span><span class="fil-l2">${l2.filter(Boolean).map((x) => `<span${x[1] ? ` class="${x[1]}"` : ''}>${x[0]}</span>`).join('')}</span></button>`; };
    const xs = [];
    if (d.id === 'ibiza') {
      const t = state.t;
      passages.filter((p) => !p.inconnu && t >= p.d && t < p.f).sort((a, b) => (b.confirmations || 0) - (a.confirmations || 0)).forEach((p) => { const l = lieux[p.lieu], ok = !!p.constate;
        xs.push(item(ok ? 'live' : 'decl', ok ? 'Live' : 'Line-up', `data-lieu="${l.id}"`, p.dj, 'encore ' + dur(p.f - t), [[esc(l.nom) + (p.salle ? ' · ' + esc(p.salle) : '')], ok ? ['confirmé par ' + (p.confirmations || 1) + ' Banger' + ((p.confirmations || 1) > 1 ? 's' : '') + ' à ' + p.constate, 'fil-ok'] : ['line-up annoncé, pas encore confirmé', 'fil-att']], visFil(p.dj, ok ? (p.confirmations || 1) : 0, ''))); });
      passages.filter((p) => !p.inconnu && p.d > t && p.d - t <= 120).sort((a, b) => a.d - b.d).slice(0, 6).forEach((p) => { const l = lieux[p.lieu];
        xs.push(item('decl', 'Bientôt', `data-lieu="${l.id}"`, p.dj, 'à ' + p.debut, [[esc(l.nom) + (p.salle ? ' · ' + esc(p.salle) : '')], ['dans ' + dur(p.d - t)]], visFil(p.dj, 0, ''))); });
    }
    declsVisibles().forEach((x) => { const dj = djDe(x), l = lieuDe(x) || {}, ok = declConfirmee(x), m = Math.round((x.fin - Date.now()) / 60000);
      xs.push(item(ok ? 'live' : 'decl', ok ? 'Live' : 'Déclaré', `data-dj-pro="${esc(dj.nom)}"`, dj.nom, m > 0 ? 'encore ' + dur(m) : 'se termine', [[esc(l.nom || 'Spot') + kmL(l.lat, l.lng)], ok ? [x.conf + ' Bangers confirment', 'fil-ok'] : ['pas encore confirmé', 'fil-att']], visFil(dj.nom, x.conf || 0, `data-decl-ok="${x.id}"`))); });
    spotsVisibles().filter(spotPublic).forEach((sp) => { const n = sp.note || 0, c = sp.conf || 0, v = n >= 4 && c >= 3 ? ['Ça vaut le coup', 'top'] : n >= 3 || c >= 2 ? ['Sympa', 'bien'] : ['À vérifier', 'bof'];
      xs.push(item('spot', 'Spot', `data-spot-voir="${sp.id}"`, sp.nom || TYPES_SPOT[sp.type] || 'Spot', `<span class="fil-vaut v-${v[1]}">${v[0]}</span>`, [[esc(sp.dj || 'DJ inconnu') + kmL(sp.lat, sp.lng)], ['signalé à ' + hm(sp.t || sp.maj) + ' par @' + esc(sp.par || 'un Banger')]], visSpotC(sp))); });
    const auj = isoAuj();
    if (d.id === 'dubai') soireesDubai().filter((r) => r.date === auj).forEach((r) => { const dj = (r.djs || '').split(/,| b2b /i)[0].trim();
      xs.push(item('decl', 'Ce soir', `data-dj-pro="${esc(dj || r.titre)}"`, dj || r.titre, r.heure ? 'à ' + esc(r.heure) : '', [[esc(r.nomLieu)], [esc(r.titre)], ['line-up annoncé', 'fil-att']], visFil(dj || r.titre, 0, ''))); });
    // Agendas du Top 100 : les DJ qui passent dans cette destination dans les 7 jours
    const villes = { dubai: ['dubai', 'dubaï'], miami: ['miami', 'miami beach'], mykonos: ['mykonos', 'mýkonos'], tulum: ['tulum'], ibiza: ['ibiza', 'sant antoni de portmany', 'sant josep de sa talaia', 'eivissa'] }[d.id] || [];
    const fin7 = iso(new Date(Date.now() + 7 * 86400000));
    Object.entries(window.AGENDA_DJS || {}).forEach(([nom, o]) => (o.avenir || []).forEach((r) => { if (r[0] >= auj && r[0] <= fin7 && villes.includes(sansAccent(String(r[3] || '')).toLowerCase())) {
      const j = Math.round((new Date(r[0] + 'T12:00') - new Date(auj + 'T12:00')) / 86400000);
      xs.push(item('decl', j === 0 ? 'Ce soir' : 'Cette semaine', `data-dj-pro="${esc(nom)}"`, nom, j === 0 ? (r[7] ? 'à ' + esc(r[7]) : 'ce soir') : j === 1 ? 'demain' : 'dans ' + j + ' jours', [[esc(r[2])], [r[5] && r[5] !== r[2] ? esc(r[5]) : ''], ['date annoncée par le DJ', 'fil-att']], visFil(nom, 0, ''))); } }));
    // Les lieux de la destination (clubs, pool parties, bars, beach clubs)
    const lsD = (d.id === 'ibiza' ? D.lieux : Object.values(LIEUX_DEST).filter((l) => l.dest === d.id)).filter((l) => l.lat != null)
      .map((l) => ({ l, k: distKm(d.centre, [l.lat, l.lng]) })).sort((u, v) => u.k - v.k).slice(0, 24);
    const kmClub = (k) => d.local ? (k < 1 ? '< 1 km' : Math.round(k) + ' km') : '';
    lsD.forEach(({ l, k }) => xs.push(filClub(l, kmClub(k))));
    if (!xs.length) return '';
    const lot = xs.slice(0, 60), sep = '<span class="fil-sep" aria-hidden="true"></span>';
    return `<div class="fil-infos fil-dest" aria-label="Fil d'actualité ${esc(d.nom)}"><div class="fil-fenetre"><div class="fil-piste">${lot.join(sep)}${sep}<span class="fil-copie" aria-hidden="true">${lot.join(sep)}${sep}</span></div></div></div>`;
  }

  // ---- Check-in : le tableau des départs façon aéroport, autour de moi (10 à 100 km).
  // Chaque ligne garde le bandeau tel quel ; au-dessus, la bande aéroport : heure, porte (le lieu), statut.
  const CK_RAYONS = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
  state.ckRayon = store.get('ckRayon', 50);
  function renderCheckin(lignesSeules) {
    const box = $('#screen-checkin'); if (!box && !lignesSeules) return;
    // Position : le GPS du téléphone ; pour tester ailleurs, ?position=dubai (ou ibiza, miami, mykonos, tulum) dans l'adresse
    const posTest = (location.search.match(/[?&]position=([a-z]+)/) || [])[1], destTest = posTest && DEST[posTest];
    const r = state.ckRayon, c = destTest ? destTest.centre : (state.maPos ? [state.maPos.lat, state.maPos.lng] : DEST.local.centre), now = Date.now();
    const nomPos = destTest ? destTest.nom + ' (position de test)' : (state.zoneGeo && state.zoneGeo.nom) || 'toi';
    const km = (la, lo) => la == null ? 0 : distKm(c, [la, lo]), fK = (x) => x < 1 ? '< 1 km' : Math.round(x) + ' km';
    const dur = (m) => m >= 60 ? Math.floor(m / 60) + ' h' + (m % 60 ? String(m % 60).padStart(2, '0') : '') : m + ' min';
    const auj = iso(new Date()), dem = iso(new Date(now + 86400000));
    const msDe = (date, hh) => { if (!hh) return null; const [H, M] = hh.split(':').map(Number); const x = new Date(date + 'T00:00:00'); x.setHours(H, M, 0, 0); return x.getTime(); };
    const L = [];
    const ligne = (o) => L.push(o);
    // DJ déclarés autour de moi
    DECLS.filter((x) => declActive(x) && djDe(x)).forEach((x) => { const dj = djDe(x), l = lieuDe(x) || {}; if (l.lat == null) return; const d = km(l.lat, l.lng); if (d > r) return;
      const ok = declConfirmee(x), avant = (x.debut - now) / 60000, reste = (x.fin - now) / 60000;
      const st = avant > 20 ? ['À l\'heure', 'bleu'] : avant > 0 ? ['Embarquement imminent', 'or'] : reste <= 15 ? ['Dernier appel', 'rouge'] : ok ? ['En cours', 'vert'] : ['Annoncé', 'orange'];
      ligne({ conf: x.conf || 0, act: `data-decl-ok="${x.id}"`, km: d, t: x.debut, heure: hm(x.debut), porte: l.nom || 'Spot', st, k: ok ? 'live' : 'decl', tag: ok ? 'Live' : 'Déclaré', attr: `data-dj-pro="${esc(dj.nom)}"`, nom: dj.nom,
        l1: avant > 0 ? 'commence dans ' + dur(Math.round(avant)) : reste > 0 ? 'encore ' + dur(Math.round(reste)) : 'se termine',
        l2: [[esc(l.nom || 'Spot') + ' · ' + fK(d)], ok ? [x.conf + ' Bangers confirment', 'fil-ok'] : ['pas encore confirmé', 'fil-att']], vol: dj.nom }); });
    // Spots signalés par les Bangers
    SPOTS.filter((s) => spotActif(s) && spotPublic(s) && s.lat != null).forEach((sp) => { const d = km(sp.lat, sp.lng); if (d > r) return;
      const n = sp.note || 0, cf = sp.conf || 0, v = n >= 4 && cf >= 3 ? ['Ça vaut le coup', 'top'] : n >= 3 || cf >= 2 ? ['Sympa', 'bien'] : ['À vérifier', 'bof'];
      ligne({ sp, km: d, t: sp.t || sp.maj, heure: hm(sp.t || sp.maj), porte: sp.nom || TYPES_SPOT[sp.type] || 'Spot', st: ['Signalé', 'violet'], k: 'spot', tag: 'Spot', attr: `data-spot-voir="${sp.id}"`, nom: sp.nom || TYPES_SPOT[sp.type] || 'Spot',
        l1: `<span class="fil-vaut v-${v[1]}">${v[0]}</span>`, l2: [[esc(sp.dj || 'DJ inconnu') + ' · ' + fK(d)], ['signalé par @' + esc(sp.par || 'un Banger')]], vol: '' }); });
    // Soirées de l'agenda : ce soir et demain
    SUD.soirees.filter((x) => (x.date === auj || x.date === dem) && SUD.lieux[x.lieu]).forEach((x) => { const l = SUD.lieux[x.lieu], d = km(l.lat, l.lng); if (d > r) return;
      const deb = msDe(x.date, x.heure), avant = deb ? (deb - now) / 60000 : null, dj = String(x.djs || '').split(/,| b2b | & /i)[0].trim();
      const st = x.date === dem ? ['Demain', 'gris'] : avant == null ? ['Ce soir', 'bleu'] : avant > 20 ? ['À l\'heure', 'bleu'] : avant > 0 ? ['Embarquement imminent', 'or'] : avant > -360 ? ['En cours', 'vert'] : ['Terminé', 'gris'];
      if (st[0] === 'Terminé') return;
      ligne({ lieuId: x.lieu, lieuPin: pinLieu({ nom: l.nom, style: x.type }), km: d, t: deb || msDe(x.date, '23:59'), heure: x.heure || '--:--', porte: l.nom, st, k: 'decl', tag: ({ club: 'Club', festival: 'Festival', concert: 'Concert' })[x.type] || 'Soirée', attr: dj ? `data-dj-pro="${esc(dj)}"` : '', nom: x.nom,
        l1: x.date === dem ? 'demain' + (x.heure ? ' à ' + x.heure : '') : avant != null && avant > 0 ? 'dans ' + dur(Math.round(avant)) : x.heure ? 'depuis ' + x.heure : 'ce soir',
        l2: [[esc(l.nom) + ' · ' + fK(d)], [esc(String(x.djs || '').slice(0, 60))], ['line-up annoncé', 'fil-att']], vol: dj }); });
    // Rangés par distance, du plus proche au plus loin (à distance égale, par heure)
    // Ibiza : les sets de ce soir dans les clubs (en cours ou dans les 2 heures)
    { const t = state.t; passages.filter((p) => !p.inconnu && p.f > t && p.d - t <= 120).forEach((p) => { const l = lieux[p.lieu]; if (!l || l.lat == null) return; const d = km(l.lat, l.lng); if (d > r) return;
      const avant = p.d - t, reste = p.f - t, ok = !!p.constate;
      const st = avant > 20 ? ['À l\'heure', 'bleu'] : avant > 0 ? ['Embarquement imminent', 'or'] : reste <= 15 ? ['Dernier appel', 'rouge'] : ['En cours', 'vert'];
      ligne({ conf: ok ? (p.confirmations || 1) : 0, km: d, t: now + avant * 60000, heure: p.debut, porte: l.nom, st, k: ok ? 'live' : 'decl', tag: ok ? 'Live' : 'Line-up', attr: `data-lieu="${l.id}"`, nom: p.dj,
        l1: avant > 0 ? 'dans ' + dur(avant) : 'encore ' + dur(reste), l2: [[esc(l.nom) + (p.salle ? ' · ' + esc(p.salle) : '') + ' · ' + fK(d)]], vol: p.dj }); }); }
    // Dubaï : les soirées de ce soir et demain (agenda Platinumlist / RA)
    soireesDubai().filter((x) => x.date === auj || x.date === dem).forEach((x) => { const lv = LIEUX_DEST[x.lieu], la = lv ? lv.lat : DEST.dubai.centre[0], lo = lv ? lv.lng : DEST.dubai.centre[1], d = km(la, lo); if (d > r) return;
      const deb = msDe(x.date, x.heure), avant = deb ? (deb - now) / 60000 : null, dj = String(x.djs || '').split(/,| b2b | & /i)[0].trim();
      const st = x.date === dem ? ['Demain', 'gris'] : avant == null ? ['Ce soir', 'bleu'] : avant > 20 ? ['À l\'heure', 'bleu'] : avant > 0 ? ['Embarquement imminent', 'or'] : ['En cours', 'vert'];
      ligne({ lieuId: x.lieu, lieuPin: pinLieu({ nom: x.nomLieu }), km: d, t: deb || msDe(x.date, '23:59'), heure: x.heure || '--:--', porte: x.nomLieu, st, k: 'decl', tag: 'Soirée', attr: dj ? `data-dj-pro="${esc(dj)}"` : '', nom: x.titre,
        l1: x.date === dem ? 'demain' + (x.heure ? ' à ' + x.heure : '') : x.heure ? 'à ' + x.heure : 'ce soir', l2: [[esc(x.nomLieu) + ' · ' + fK(d)], [esc(String(x.djs || '').slice(0, 60))]], vol: '' }); });
    // Les DJ du Top 100 qui jouent ce soir ou demain dans une ville du rayon
    const V = new Map((window.VILLES || []).map((v) => [sansAccent(v[0]).toLowerCase(), v]));
    Object.entries(window.AGENDA_DJS || {}).forEach(([nomDj, o]) => (o.avenir || []).forEach((row) => { if (row[0] !== auj && row[0] !== dem) return; const v = V.get(sansAccent(String(row[3] || '')).toLowerCase()); if (!v) return; const d = km(v[2], v[3]); if (d > r) return;
      const deb = msDe(row[0], row[7]);
      ligne({ km: d, t: deb || msDe(row[0], '23:58'), heure: row[7] || '--:--', porte: row[2], st: row[0] === dem ? ['Demain', 'gris'] : ['Ce soir', 'bleu'], k: 'decl', tag: 'Top 100', attr: `data-dj-pro="${esc(nomDj)}"`, nom: nomDj,
        l1: row[0] === dem ? 'demain' : 'ce soir', l2: [[esc(row[2]) + ' · ' + esc(row[3]) + ' · ' + fK(d)]], vol: nomDj }); }));
    L.sort((a, b) => Math.round(a.km) - Math.round(b.km) || (a.t || 0) - (b.t || 0));
    const vis = (nom) => nom ? visFil(nom) : '';
    const rangee = (o) => { const v = o.lieuPin ? `<span class="fil-vis fil-dj fil-pinbox"><img class="fil-pin fil-lieu" src="${o.lieuPin}" alt="">${casqueConf(BANG_LIEU[o.lieuId] || 0)}</span>` : o.k === 'spot' ? (o.sp ? visSpotC(o.sp) : '') : o.vol ? visFil(o.vol, o.conf || 0, o.act || '') : '';
      return `<div class="ck-ligne ck-${o.st[1]}">
        <div class="ck-bande"><span class="ck-h">${flap(o.heure, 5)}</span><span class="ck-porte"><small>Porte</small>${esc(o.porte)}</span><span class="ck-st ck-st-${o.st[1]}"><i></i>${esc(o.st[0])}</span></div>
        <button class="fil-item k-${o.k}${v ? ' a-vis' : ''}" ${o.attr}>${v}<span class="fil-l1"><em class="fil-tag ${o.k}">${o.tag}</em><b>${esc(o.nom)}</b>${o.l1 ? `<span class="fil-t">${o.l1}</span>` : ''}</span><span class="fil-l2">${o.l2.filter((x) => x && x[0]).map((x) => `<span${x[1] ? ` class="${x[1]}"` : ''}>${x[0]}</span>`).join('')}</span></button></div>`; };
    const i = CK_RAYONS.indexOf(r);
    if (lignesSeules) return L.map(rangee);
    box.innerHTML = `<div class="ck-tete"><div><h2>Check-in</h2><small>Départs autour de ${esc(nomPos)} · <b>${r} km</b> · ${L.length} départ${L.length > 1 ? 's' : ''}</small></div><span class="ck-horloge">${flap(hm(now), 5)}</span></div>
      <div class="fd-rail ck-rail"><input type="range" id="fader-ck" min="0" max="${CK_RAYONS.length - 1}" step="1" value="${i}" style="--pct:${i / (CK_RAYONS.length - 1) * 100}%" aria-label="Rayon du check-in" aria-valuetext="${r} kilomètres">
        <div class="fd-graduations" aria-hidden="true">${CK_RAYONS.map((k, j) => `<span class="${j === i ? 'on' : ''}" data-ck-rayon="${j}">${k}</span>`).join('')}</div></div>
      <div class="ck-legende"><span class="ck-st ck-st-or"><i></i>Embarquement imminent</span><span>commence dans moins de 20 min</span><span class="ck-st ck-st-rouge"><i></i>Dernier appel</span><span>se termine dans moins de 15 min</span></div>
      ${L.length ? `<div class="ck-liste">${L.map(rangee).join('')}</div>` : `<div class="empty">Aucun départ à moins de ${r} km pour l'instant. Pousse le fader vers 100 km.</div>`}`;
  }
  const reglerCk = (j) => { state.ckRayon = CK_RAYONS[Math.max(0, Math.min(CK_RAYONS.length - 1, j))]; store.set('ckRayon', state.ckRayon); renderCheckin(); };
  document.addEventListener('change', (e) => { if (e.target.id === 'fader-ck') reglerCk(+e.target.value); });
  document.addEventListener('input', (e) => { if (e.target.id === 'fader-ck') { const j = +e.target.value; e.target.style.setProperty('--pct', j / (CK_RAYONS.length - 1) * 100 + '%'); document.querySelectorAll('[data-ck-rayon]').forEach((s, k) => s.classList.toggle('on', k === j)); } });
  document.addEventListener('click', (e) => { const g = e.target.closest('[data-ck-rayon]'); if (g) reglerCk(+g.dataset.ckRayon); });

  // Mini-carte des pages saison, comme celle de l'accueil : DJ en live, déclarés, spots et clubs, avec l'encart au doigt
  function miniCarteDest(d) {
    const c = d.centre, kmC = (la, lo) => la == null ? 99 : distKm(c, [la, lo]);
    const fK = (x) => x < 1 ? '< 1 km du centre' : Math.round(x) + ' km du centre';
    const DJ_SVG = (col) => `<svg class="aut-dessin" viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="17" r="8" fill="#0A0D16"/><path d="M22 17a10 10 0 0 1 20 0" fill="none" stroke="#0A0D16" stroke-width="3"/><path d="M20 40c2-9 7-13 12-13s10 4 12 13" fill="#0A0D16"/><rect x="6" y="40" width="52" height="16" rx="3" fill="#0A0D16"/><circle cx="20" cy="48" r="5.5" fill="${col}"/><circle cx="44" cy="48" r="5.5" fill="${col}"/></svg>`;
    const SPOT_SVG = `<svg class="aut-dessin" viewBox="0 0 64 64" aria-hidden="true"><path d="M32 6c-10 0-18 8-18 18 0 13 18 32 18 32s18-19 18-32c0-10-8-18-18-18z" fill="#0A0D16"/><path d="M24 26l9-6v14l-9-6z" fill="#B58CFF"/></svg>`;
    const CLUB_SVG = `<svg class="aut-dessin" viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="22" fill="#0A0D16"/><circle cx="32" cy="32" r="14" fill="none" stroke="#3DD6C6" stroke-width="1.5" opacity=".6"/><circle cx="32" cy="32" r="3" fill="#3DD6C6"/></svg>`;
    const enc = (o) => ({ k: o.k, attr: o.attr, html: `<span class="enc-art enc-${o.k}">${o.dessin}</span><span class="enc-txt"><span class="enc-etat enc-${o.k}"><i></i>${o.etat}</span><b>${esc(o.t)}</b><span class="enc-heure">${o.heure}</span><small>${o.s}</small>${o.plus || ''}<span class="enc-voir">Voir la fiche →</span></span>` });
    const decls = [], infosD = [];
    if (d.id === 'ibiza') { const t = state.t;
      passages.filter((p) => !p.inconnu && t >= p.d && t < p.f).forEach((p) => { const l = lieux[p.lieu]; if (!l || l.lat == null) return; const conf = p.constate ? (p.confirmations || 2) : 0;
        decls.push({ x: { conf }, l });
        infosD.push(enc({ k: conf >= 2 ? 'live' : 'decl', attr: `data-lieu="${l.id}"`, dessin: DJ_SVG(conf >= 2 ? '#F2C53A' : '#FF8A3D'), etat: conf >= 2 ? 'DJ en live' : 'Line-up annoncé', heure: `${p.debut} → ${p.fin}`, t: p.dj, s: `${esc(l.nom)}${p.salle ? ' · ' + esc(p.salle) : ''}`, plus: `<small>${conf >= 2 ? conf + ' Bangers confirment' : 'Pas encore confirmé par les Bangers'}</small>` })); }); }
    declsVisibles().forEach((x) => { const dj = djDe(x), l = lieuDe(x) || {}, ok = declConfirmee(x); decls.push({ x, l });
      infosD.push(enc({ k: ok ? 'live' : 'decl', attr: `data-dj-pro="${esc(dj.nom)}"`, dessin: DJ_SVG(ok ? '#F2C53A' : '#FF8A3D'), etat: ok ? 'DJ en live' : 'DJ déclaré', heure: `${hm(x.debut)} → ${hm(x.fin)}`, t: dj.nom, s: esc(l.nom || 'Spot'), plus: `<small>${ok ? x.conf + ' Bangers confirment' : 'Pas encore confirmé par les Bangers'}</small>` })); });
    const spots = spotsVisibles().filter((s) => spotPublic(s) && s.lat != null);
    const infosS = spots.map((sp) => { const n = sp.note || 0, cf = sp.conf || 0, v = n >= 4 && cf >= 3 ? ['Ça vaut le coup', 'top'] : n >= 3 || cf >= 2 ? ['Sympa', 'bien'] : ['À vérifier', 'bof'];
      return enc({ k: 'spot', attr: `data-spot-voir="${sp.id}"`, dessin: SPOT_SVG, etat: 'Spot signalé', heure: `Signalé à ${hm(sp.t || sp.maj)}`, t: sp.nom || TYPES_SPOT[sp.type] || 'Spot', s: `${esc(sp.dj || 'DJ inconnu')} · ${fK(kmC(sp.lat, sp.lng))}`, plus: `<small>par <b>@${esc(sp.par || 'un Banger')}</b> · ${cf} confirment</small><span class="enc-vaut ${v[1]}">${v[0]}</span>` }); });
    const ls = (d.id === 'ibiza' ? D.lieux : Object.values(LIEUX_DEST).filter((l) => l.dest === d.id)).filter((l) => l.lat != null);
    const enJeu = new Set(decls.map((o) => o.l && o.l.id));
    const coin = ls.filter((l) => !enJeu.has(l.id)).map((l) => ({ l, d: kmC(l.lat, l.lng) })).sort((x, y) => x.d - y.d);
    const infosC = coin.slice(0, 14).map(({ l, d: dd }) => enc({ k: 'club', attr: `data-lieu="${l.id}"`, dessin: CLUB_SVG, etat: l.type === 'plage' ? 'Beach club' : 'Club', heure: 'DJ à confirmer', t: l.nom, s: `${esc(l.zone || '')}${l.zone ? ' · ' : ''}${fK(dd)}` }));
    let html = carteMiniMap(c, decls, spots, coin, infosD.concat(infosS, infosC));
    html = html.replace(/<circle class="mm-pulse" cx="[\d.]+" cy="[\d.]+" r="12" fill="#4DA3FF" opacity=".3"\/><circle cx="[\d.]+" cy="[\d.]+" r="6.5" fill="#4DA3FF" stroke="#fff" stroke-width="2"\/>/, '')
      .replace(/<span class="acc-badge"><i><\/i>\d+ DJ autour<\/span>/, `<span class="acc-badge"><i></i>${decls.length + spots.length} DJ en ce moment</span>`);
    const lg = (k, nom, info) => `<button type="button" class="lg-item" data-lg-info="${info}"><i class="lg ${k}"></i>${nom}</button>`;
    const legende = `<div class="aut-legende" aria-label="Légende de la carte">${lg('live', 'Live', 'DJ en live, confirmé par les Bangers')}${lg('decl', 'Déclaré', 'DJ annoncé ou déclaré, pas encore confirmé')}${lg('spot', 'Spot', 'Spot signalé par un Banger : bar, plage, bateau…')}${lg('club', 'Club', 'Club ou beach club, DJ à confirmer')}<span class="lg-bulle" aria-live="polite"></span></div>`;
    return `<div class="aut-carte dest-mini">${html}</div>${legende}`;
  }

  function renderDestLive() {
    const d = DEST[state.dest], m = MOIS_NOW, n = d.mois[m];
    if (d.local) {
      const coin = Object.values(LIEUX_DEST).filter((l) => l.dest === 'local').map((l) => ({ l, km: distKm(DEST.local.centre, [l.lat, l.lng]) })).filter((x) => x.km <= 60).sort((x, y) => x.km - y.km);
      const xs = blocDecls() + blocSpots() + (coin.length ? `<div class="section-title">Clubs du coin <small>${coin.length} · DJ à confirmer</small></div>` + rangCartes(coin.map(({ l, km }) =>
        vCarte({ attr: `data-lieu="${l.id}"`, c: '#3D8BFF', img: imgLieu(l), badge: (km < 1 ? '< 1' : Math.round(km)) + ' km', type: esc((l.style || 'Club').split(/[,·:]/)[0].trim()), nom: esc(l.nom), lieu: esc(l.zone.split('·')[0].trim()), bas: [l.saison ? 'Ouvert ' + esc(l.saison) : 'DJ à confirmer'] }))) : '');
      $('#live-list').innerHTML = `<div class="dest-tete"><div><small class="heure-loc">${esc(state.zoneGeo.nom)}${state.zoneGeo.approx ? ' · position de démo' : ''}</small><small>Les DJ qui mixent près de toi, déclarés par eux-mêmes et confirmés par les Bangers</small></div></div>`
        + (xs || '<div class="empty">Aucun DJ déclaré autour de toi pour l\'instant.</div>')
        + `<p class="demo-note">Partout hors des grandes destinations (Toulon, Marseille, Lyon…), l'appli montre les DJ qui se déclarent avec un profil DJ et les spots signalés par les Bangers. Démo : la carte est centrée sur Toulon si ta position n'est pas disponible.</p>`;
      return;
    }
    const FOND_DEST = { ibiza: 'ibiza-carte.jpg?v=3', mykonos: 'mykonos-carte.jpg?v=3', tulum: 'tulum-carte.jpg?v=3', miami: 'miami-carte.jpg?v=3', dubai: 'dubai-carte.jpg?v=3' };
    let h = `${FOND_DEST[d.id] ? `<div class="dest-banniere" style="background-image:url('${FOND_DEST[d.id]}')"></div>` : ''}<div class="dest-tete"><div><h2>${esc(d.nom)}</h2><small>${esc(d.pays)} · ${T('saison')} : ${esc(d.saison)}</small><small class="heure-loc">${T('il_est', { h: heureLocale(d.tz) })} · ${decalage(d.tz)}</small></div>${pastilleMois(n)}</div>
      ${barreAnnee(d)}${miniCarteDest(d)}${filDest()}
      <p class="conseil"><b>${Maj(moisNom(m))}</b> : ${esc(d.notes[m] || (n < 0 ? 'hors saison.' : labelMois(n) + '.'))}${n < 0 ? ` ${T('reprise', { m: '<b>' + reprise(d, m) + '</b>' })}.` : ''}</p>`;
    h += (CARTES_ILLUS[d.id] ? carteIbizaGrande(d.id) : '') + carteAgendaDest(d);
    if (d.id === 'dubai') h += blocAgendaDubai();
    h += blocDecls() + blocSpots();
    const coulNiv = (k) => k < 0 ? '#5A6378' : ['#3FBF7F', '#F59E2E', '#E5484D', '#8A5CFF'][k];
    h += `<div class="section-title">${T('temps_forts')}</div>` + rangCartes(evenementsAVenir(d, m).map((e) => vCarte({ tag: e.url ? 'a' : 'div', attr: e.url ? `href="${e.url}" target="_blank" rel="noopener"` : '', img: (photoVille(d.nom, '') || FOND_DEST[d.id] || '').split('?')[0],
      c: coulNiv(d.mois[e.mois]), badge: d.mois[e.mois] < 0 ? T('hors') : NIVEAUX[d.mois[e.mois]].court, type: esc(e.quand), nom: esc(e.nom), bas: [dansMois(e.mois, m), e.url ? 'Billets →' : ''] })));
    const grp = (titre, liste) => liste.length ? `<div class="section-title">${titre} <small>${liste.length}</small></div>` + rangCartes(liste.map((l) =>
      vCarte({ attr: `data-lieu="${l.id}"`, c: COUL_TYPE_LIEU[l.type] || '#FF8A3D', img: imgLieu(l), badge: n < 0 ? T('hors') : NIVEAUX[n].court, type: l.type === 'plage' ? 'Beach club' : 'Club', nom: esc(l.nom), lieu: esc(l.zone), bas: [T('lineup_bientot')] }))) : '';
    const ls = Object.values(LIEUX_DEST).filter((l) => l.dest === d.id);
    h += grp(T('clubs'), ls.filter((l) => l.type === 'club')) + grp(T('plages'), ls.filter((l) => l.type === 'plage'));
    h += `<div class="section-title">${T('billets')}</div>${listeBillets(d)}`;
    h += `<p class="demo-note">Démo : les line-ups en direct ne sont suivis qu'à Ibiza pour l'instant. Pour ${esc(d.nom)}, l'appli montre la saison, les temps forts et les lieux. L'affluence par mois est une tendance tirée de sources publiques, pas une mesure. Positions des lieux approximatives.</p>`;
    $('#live-list').innerHTML = h;
  }

  function renderGalerieDest() {
    const d = DEST[state.dest], n = d.mois[MOIS_NOW];
    const ls = Object.values(LIEUX_DEST).filter((l) => l.dest === d.id);
    const grp = (titre, liste) => liste.length ? `<div class="section-title">${titre} <small>${liste.length}</small></div><div class="galerie">` + liste.map((l) =>
      `<button class="g-lieu" data-lieu="${l.id}">${photo(l, 'g-img')}<span class="g-info"><b>${esc(l.nom)}</b><small>${esc(l.zone)}</small>${pastilleMois(n, true)}</span></button>`).join('') + '</div>' : '';
    $('#galerie-lieux').innerHTML = grp(T('clubs'), ls.filter((l) => l.type === 'club')) + grp(T('plages'), ls.filter((l) => l.type === 'plage')) +
      `<p class="demo-note">Photos : sites des lieux, Discotech, Techno Airlines, Platinumlist, pour la démo. Pour l'appli publique, il faudra les photos des lieux partenaires, avec leur accord. Pour remplacer une photo, dépose la tienne dans le dossier photos/ (nom du fichier = identifiant du lieu, ex. ${ls[0] ? ls[0].id : 'lieu'}.jpg).</p>`;
  }

  function marqueursDest() {
    const d = DEST[state.dest], n = d.mois[MOIS_NOW];
    Object.values(LIEUX_DEST).filter((l) => l.dest === d.id).forEach((l) => {
      const m = L.marker([l.lat, l.lng], { icon: iconeLieu(l, false, n < 0) }); m.__lieu = l.id;
      m.bindPopup(d.local
        ? entreeBulle({ k: 'club', lieu: esc(l.zone), etat: 'Club', tete: '<span class="pb-ico club">♪</span>', t: l.nom, heure: esc((l.style || 'Club').split(/[,·:]/)[0].trim()), bang: '<span>Pas encore de DJ annoncé · <b>bangue</b> si ça joue</span>', actions: `<div class="pb-actions"><button class="pb-btn plein" data-lieu="${l.id}">${T('voir_lieu')}</button></div>` })
        : `${photo(l, 'pop-photo')}<div class="pop-venue">${esc(l.nom)}</div><div class="pop-slot">${l.type === 'plage' ? T('plage') : T('club')} · ${esc(l.zone)}</div>
        <div class="pop-slot" style="margin-top:4px">${moisNom(MOIS_NOW)} : ${labelMois(n)}</div><button class="pop-btn" data-lieu="${l.id}">${T('voir_lieu')}</button>`);
      if (d.local) { m.options.className = ''; }
      m.addTo(layer);
    });
  }

  function renderSheetDest(l) {
    const d = DEST[l.dest], m = MOIS_NOW, n = d.mois[m];
    if (d.local) {
      $('#sheet-status').innerHTML = '<span class="badge b-est">DJ à confirmer</span>';
      const lieuQ = l.nom + ' ' + l.zone.split(' · ')[0];
      $('#sheet-body').innerHTML = `<div class="hero">${photo(l, 'hero-img')}${creditLieu(l)}</div><h2>${esc(l.nom)}</h2>
        <div class="meta">Club · ${esc(l.zone)}${l.dep ? ' · ' + l.dep : ''}</div>
        <div class="event"><div class="event-title">${esc(l.style || 'Club')}</div><div class="event-sub">${l.saison ? 'Ouvert ' + esc(l.saison) + '. ' : ''}Les DJ de ce club ne sont pas encore annoncés dans Banzic.</div></div>
        <p class="conseil">Tu sais qui mixe ici ? Les DJ et le club pourront annoncer leurs dates eux-mêmes avec un profil DJ. En attendant, regarde les réseaux du club avant d'y aller.</p>
        ${l.approx ? '<p class="demo-note">Position sur la carte approximative. Horaires et ouverture à vérifier.</p>' : ''}`;
      $('#sheet-actions').innerHTML = `
        <a class="btn-ghost" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lieuQ)}" target="_blank" rel="noopener">Itinéraire</a>
        <a class="btn-main" href="https://www.google.com/search?q=${encodeURIComponent(lieuQ + ' soirée')}" target="_blank" rel="noopener">Voir ses soirées</a>`;
      return;
    }
    $('#sheet-status').innerHTML = pastilleMois(n, true);
    let h = `<div class="hero">${photo(l, 'hero-img')}${creditLieu(l)}</div><h2>${esc(l.nom)}</h2>
      <div class="meta">${l.type === 'plage' ? 'Beach club' : 'Club'} · ${esc(l.zone)} · ${esc(d.nom)}</div>
      <div class="event"><div class="event-title">Line-up pas encore suivi ici</div><div class="event-sub">${esc(d.nom)} arrive dans l'appli : saison ${esc(d.saison)}.</div></div>
      <p class="conseil"><b>${Maj(moisNom(m))}</b> : ${esc(d.notes[m] || labelMois(n) + '.')}${n < 0 ? ` ${T('reprise', { m: '<b>' + reprise(d, m) + '</b>' })}.` : ''}</p>
      <div class="section-title">${T('tendance_mois')}</div>${barreAnnee(d)}
      <div class="section-title">${T('billets')}</div>${listeBillets(d)}`;
    $('#sheet-body').innerHTML = h;
    const b = d.billetterie.find((x) => x.url);
    $('#sheet-actions').innerHTML = `
      <a class="btn-ghost" href="https://www.google.com/maps/dir/?api=1&destination=${l.lat},${l.lng}" target="_blank" rel="noopener">Itinéraire</a>
      <a class="btn-main" href="${b ? b.url : 'https://www.google.com/search?q=' + encodeURIComponent(l.nom + ' ' + d.nom + ' tickets')}" target="_blank" rel="noopener">${n < 0 ? 'Voir les billets' : 'Prendre mon billet'}</a>`;
  }

  // Agenda « Toute l'année » : où il y a du monde chaque mois, donc où vendre des billets
  function renderAnnee() {
    const d = DEST[state.dest], m = state.anMois, n = d.mois[m];
    if (d.local) { renderAgendaSud(); return; }
    let h = toggleAnnee() + `<div class="section-title">${T('tendance_mois')} <small>${esc(d.nom)}</small></div>
      <div class="legende">${NIVEAUX.map((x) => `<span><i class="niv-dot niv-${x.code}"></i>${x.label}</span>`).join('')}<span><i class="niv-dot niv-hors"></i>${T('hors')}</span></div>
      <div class="barre-annee grande" role="group" aria-label="${esc(d.nom)}">${d.mois.map((v, k) =>
        `<button class="ba ${v < 0 ? 'niv-hors' : 'niv-' + NIVEAUX[v].code} ${k === MOIS_NOW ? 'now' : ''} ${k === m ? 'sel' : ''}" data-an="${d.id}|${k}" aria-pressed="${k === m}" aria-label="${moisNom(k)} : ${labelMois(v)}"><i>${ABR_MOIS[k]}</i></button>`).join('')}</div>`;
    const evs = d.evenements.filter((e) => e.mois === m);
    h += `<div class="jour">
      <div class="jour-top"><div><div class="jour-titre">${esc(d.nom)} · ${moisNom(m)}</div><div class="jour-ev">${T('saison')} : ${esc(d.saison)}</div></div>${pastilleMois(n)}</div>
      <p class="conseil">${d.notes[m] ? esc(d.notes[m]) + ' ' : ''}${CONSEIL_VENTE[n]}${n < 0 ? ' ' + T('reprise', { m: '<b>' + reprise(d, m) + '</b>' }) + '.' : ''}</p>
      ${evs.length ? evs.map((e) => `<div class="mini"><span><span class="venue">${esc(e.nom)}</span><br><small>${esc(e.quand)}</small></span>${e.url ? `<a class="badge b-soon" href="${e.url}" target="_blank" rel="noopener">${T('billets')}</a>` : ''}</div>`).join('') : ''}
    </div>`;
    const avenir = evenementsAVenir(d, MOIS_NOW);
    h += `<div class="section-title">${T('temps_forts')}</div>` + avenir.map((e) => `<button class="mini" data-an="${d.id}|${e.mois}">
      <span><span class="venue">${esc(e.nom)}</span><br><small>${esc(e.quand)} · ${dansMois(e.mois, MOIS_NOW)}</small></span>${pastilleMois(d.mois[e.mois], true)}</button>`).join('');
    h += `<div class="section-title">${T('billets')}</div>${listeBillets(d)}`;
    h += `<p class="demo-note">Popularité estimée : une tendance du nombre de gens attendus, tirée de sources publiques (offices de tourisme, guides, presse, calendriers des festivals), pas une mesure. Elle sera affinée avec les données de l'appli.</p>`;
    $('#screen-agenda').innerHTML = h;
  }
  // ---------- Agenda « Autour de moi » : soirées relevées dans le Var, les Alpes-Maritimes et les Bouches-du-Rhône
  const SUD = window.AGENDA_SUD || { lieux: {}, sources: {}, soirees: [] };
  const NOMS_DEP = { '13': 'Bouches-du-Rhône', '83': 'Var', '06': 'Alpes-Maritimes', '75': 'Paris', '77': 'Seine-et-Marne', '92': 'Hauts-de-Seine', '93': 'Seine-Saint-Denis',
    '69': 'Rhône', '42': 'Loire', '38': 'Isère', '74': 'Haute-Savoie', '39': 'Jura', '68': 'Haut-Rhin', '59': 'Nord', '62': 'Pas-de-Calais', '33': 'Gironde',
    '31': 'Haute-Garonne', '34': 'Hérault', '44': 'Loire-Atlantique', '35': 'Ille-et-Vilaine' };
  // Agenda autour de moi : un fader façon table de mixage règle le rayon (5 → 500 km) autour de ma position
  const RAYONS = [5, 10, 100, 200, 500];
  // 8 pads façon platine : 1re rangée le type de soirée, 2e rangée le moment (et mes DJ favoris)
  const PADS = [
    { g: 'type', k: 'tout', nom: 'Tout', c: '#C9CFDD' }, { g: 'type', k: 'club', nom: 'Clubs', c: '#3D8BFF' },
    { g: 'type', k: 'festival', nom: 'Festivals', c: '#FF8A3D' }, { g: 'type', k: 'concert', nom: 'Concerts', c: '#F2C53A' },
    { g: 'quand', k: 'soir', nom: 'Ce soir', c: '#FF4FA3' }, { g: 'quand', k: 'weekend', nom: 'Week-end', c: '#A77BFF' },
    { g: 'quand', k: 'semaine', nom: '7 jours', c: '#3DD6C6' }, { g: 'mesdj', k: 'oui', nom: 'Mes DJ', c: '#3DF28A' }
  ];
  const auJour = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return iso(d); };
  function finWeekend() { const d = new Date(), j = d.getDay(); d.setDate(d.getDate() + (j === 0 ? 0 : 7 - j)); return iso(d); }
  function debutWeekend() { const d = new Date(), j = d.getDay(); if (j >= 5 || j === 0) return iso(d); d.setDate(d.getDate() + (5 - j)); return iso(d); }
  const PAD_TEST = {
    'type|club': (x) => (x.type || 'club') === 'club', 'type|festival': (x) => x.type === 'festival', 'type|concert': (x) => x.type === 'concert', 'type|tout': () => true,
    'quand|soir': (x) => x.date === iso(new Date()), 'quand|weekend': (x) => x.date >= debutWeekend() && x.date <= finWeekend(), 'quand|semaine': (x) => x.date < auJour(7),
    'mesdj|oui': (x) => !!x.djs && state.favs.some((f) => sansAccent(x.djs).includes(sansAccent(f)))
  };
  state.rayonIdx = store.get('rayonIdx', 2);
  function soireesAvecKm() {
    const centre = DEST.local.centre, auj = iso(new Date());
    return SUD.soirees.filter((x) => x.date >= auj && SUD.lieux[x.lieu])
      .map((x) => ({ ...x, l: SUD.lieux[x.lieu], km: distKm(centre, [SUD.lieux[x.lieu].lat, SUD.lieux[x.lieu].lng]) }))
      .sort((a, b) => a.date.localeCompare(b.date) || a.km - b.km);
  }
  function renderAgendaSud() {
    const r = RAYONS[state.rayonIdx];
    $('#screen-agenda').innerHTML = `<div class="fader-module">
        <div class="acc-tete fd-tete"><div><h2>Agenda autour de moi</h2><small>Autour de ${esc(state.zoneGeo.nom)} · <b id="fd-km">${r} km</b> · <span id="fd-nb"></span></small></div></div>
        <div class="fd-rail">
          <input type="range" id="fader-rayon" min="0" max="${RAYONS.length - 1}" step="1" value="${state.rayonIdx}" aria-label="Rayon de recherche" aria-valuetext="${r} kilomètres">
          <div class="fd-graduations" aria-hidden="true">${RAYONS.map((k, i) => `<span class="${i === state.rayonIdx ? 'on' : ''}" data-rayon="${i}">${k}</span>`).join('')}</div>
        </div>
        <div class="pads" role="group" aria-label="Filtres">${PADS.map((x) => `<button class="pad" style="--pc:${x.c}" data-pad="${x.g}|${x.k}" aria-pressed="false"><span class="pad-nom">${x.nom}</span><small class="pad-nb"></small></button>`).join('')}</div>
      </div>
      <div id="agenda-liste"></div>`;
    listeAgendaSud();
  }
  function listeAgendaSud() {
    const r = RAYONS[state.rayonIdx], toutes = soireesAvecKm().filter((x) => x.km <= r);
    const typ = state.sudType || 'tout', quand = state.sudQuand || null, mesdj = !!state.sudMesDj;
    const liste = toutes.filter((x) => PAD_TEST['type|' + typ](x) && (!quand || PAD_TEST['quand|' + quand](x)) && (!mesdj || PAD_TEST['mesdj|oui'](x)));
    document.querySelectorAll('[data-pad]').forEach((b) => {
      const [g, k] = b.dataset.pad.split('|'), on = g === 'type' ? typ === k : g === 'quand' ? quand === k : mesdj;
      b.classList.toggle('on', on); b.setAttribute('aria-pressed', on);
      b.querySelector('.pad-nb').textContent = toutes.filter(PAD_TEST[b.dataset.pad]).length;
    });
    $('#fd-km').textContent = r + ' km';
    $('#fd-nb').textContent = toutes.length + (toutes.length > 1 ? ' soirées' : ' soirée');
    document.querySelectorAll('.fd-graduations span').forEach((s, i) => s.classList.toggle('on', i === state.rayonIdx));
    const fr = $('#fader-rayon'); if (fr) fr.style.setProperty('--pct', (state.rayonIdx / (RAYONS.length - 1) * 100) + '%');
    let h = '';
    if (!toutes.length) h += `<div class="empty">Rien d'annoncé à moins de ${r} km pour l'instant. Pousse le fader vers la droite pour voir plus loin.<br><small>L'agenda couvre la région PACA, Paris, Lyon, Lille, Bordeaux, Toulouse, Montpellier, Nantes, et les grandes villes d'Espagne et du Portugal. Ailleurs, il se remplira avec les dates des DJ et des établissements.</small></div>`;
    else {
      if (!liste.length) h += `<div class="empty">Rien pour ces pads dans ce rayon.${mesdj && !state.favs.length ? ' Ajoute des DJ en favori (♥) pour utiliser « Mes DJ ».' : ''}</div>`;
      let mois = '';
      liste.forEach((x) => {
        const dt = new Date(x.date + 'T12:00:00'), m = MOIS[dt.getMonth()] + ' ' + dt.getFullYear();
        if (m !== mois) { mois = m; h += `<div class="section-title ag-mois">${Maj(m)}</div>`; }
        h += ligneSud(x);
      });
    }
    h += festivalsFrance(toutes);
    h += `<p class="demo-note">Soirées et festivals électro relevés le ${SUD.maj.split('-').reverse().join('/')} sur des agendas publics (JDS, Fest, Resident Advisor, Shotgun, Songkick, Music Festival Wizard, Technobeatscloud, presse locale). Les programmes peuvent changer : vérifie toujours sur « Infos » avant de sortir. Dans l'appli, les DJ et les établissements ajouteront eux-mêmes leurs dates.</p>`;
    $('#agenda-liste').innerHTML = h;
  }
  const reglerRayon = (i) => { state.rayonIdx = Math.max(0, Math.min(RAYONS.length - 1, i)); store.set('rayonIdx', state.rayonIdx);
    const f = $('#fader-rayon'); if (f) { f.value = state.rayonIdx; f.setAttribute('aria-valuetext', RAYONS[state.rayonIdx] + ' kilomètres'); } listeAgendaSud(); };
  document.addEventListener('input', (e) => { if (e.target.id === 'fader-rayon') reglerRayon(+e.target.value); });
  document.addEventListener('click', (e) => { const g = e.target.closest('.fd-graduations [data-rayon]'); if (g) reglerRayon(+g.dataset.rayon); });
  document.addEventListener('click', (e) => {
    const pd = e.target.closest('[data-pad]'); if (!pd) return;
    const [g, k] = pd.dataset.pad.split('|');
    if (g === 'type') state.sudType = k;
    else if (g === 'quand') state.sudQuand = state.sudQuand === k ? null : k;
    else state.sudMesDj = !state.sudMesDj;
    pd.classList.remove('frappe'); void pd.offsetWidth; pd.classList.add('frappe');
    listeAgendaSud();
  });
  // Affiche inventée pour une soirée (style jeu vidéo néon, aucun flyer repris) : ciel, soleil rayé, silhouette, titre en gros
  const _affCache = {};
  function afficheSoiree(x) {
    const cle = x.date + x.nom; if (_affCache[cle]) return _affCache[cle];
    let g = 11; for (const ch of cle) g = (g * 31 + ch.charCodeAt(0)) >>> 0;
    const r = () => { g = (g * 1103515245 + 12345) >>> 0; return g / 4294967296; };
    const txt = (x.genres || '') + ' ' + x.nom;
    const pal = /hard|tek|core|acid|rave|mental/i.test(txt) ? ['#12021F', '#FF2D55', '#FF9F0A'] : /afro|amapiano|shatta|bouyon|zouk|dancehall|baile|latin|reggaeton|salsa/i.test(txt) ? ['#1A0A00', '#FF6B00', '#FFD60A']
      : /rap|hip hop|trap|r&b/i.test(txt) ? ['#050A1E', '#7B2FFF', '#00E5FF'] : /disco|funk|pop/i.test(txt) ? ['#1E0016', '#FF3DB8', '#FFC93D'] : /trance|melodic|progressive/i.test(txt) ? ['#000B1E', '#0A84FF', '#64D2FF'] : ['#07001A', '#B23DFF', '#FF4FA3'];
    const decor = Math.floor(r() * 3), incl = (r() * 8 - 4).toFixed(1);
    const mots = x.nom.replace(/\s*[@|].*$/, '').replace(/[^\p{L}\p{N}' &-]/gu, ' ').toUpperCase().split(/\s+/).filter(Boolean);
    const lignes = []; let l = '';
    for (const m of mots) { if ((l + ' ' + m).trim().length > 10 && l) { lignes.push(l); l = m; } else l = (l + ' ' + m).trim(); if (lignes.length === 3) break; }
    if (l && lignes.length < 3) lignes.push(l);
    if (lignes.length) lignes[lignes.length - 1] = lignes[lignes.length - 1].replace(/(\s+(BY|X|×|DE|DU|LA|LE|LES|&|-|AU|À|W\/|AND|THE|IN))+$/u, '');
    const esc2 = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;');
    const fs = lignes.some((t) => t.length > 8) ? 16 : 19, n = lignes.length;
    const bH = 12 + n * (fs + 1), bY = 150 - bH, dy = bY + 4 - 118;
    const raies = [0, 1, 2, 3].map((i) => `<rect x="24" y="${66 + i * 8}" width="72" height="${2 + i}" fill="${pal[0]}"/>`).join('');
    const sil = decor === 0 ? `<path d="M0 118 L0 98 L12 98 L12 88 L24 88 L24 100 L36 100 L36 80 L48 80 L48 96 L60 96 L60 86 L72 86 L72 74 L84 74 L84 100 L98 100 L98 90 L120 90 L120 118Z" fill="${pal[0]}"/>`
      : decor === 1 ? `<path d="M30 118 Q33 90 40 70" stroke="${pal[0]}" stroke-width="4" fill="none"/><path d="M40 70 q-16 -2 -24 8 M40 70 q-12 -10 -24 -6 M40 70 q4 -14 16 -16 M40 70 q14 -4 22 6 M40 70 q10 6 12 18" stroke="${pal[0]}" stroke-width="4" fill="none" stroke-linecap="round"/><rect x="0" y="108" width="120" height="10" fill="${pal[0]}"/>`
      : `<path d="M0 118 L0 104 Q30 96 60 104 T120 102 L120 118Z" fill="${pal[0]}"/><path d="M78 104 L84 66 L90 104Z" fill="${pal[0]}"/><circle cx="84" cy="64" r="5" fill="${pal[0]}"/>`;
    const tl = lignes.map((t, i) => `<text x="60" y="${bY + 4 + (i + 1) * (fs + 1)}" text-anchor="middle" font-family="Impact, 'Arial Black', 'Helvetica Neue', sans-serif" font-weight="900" font-size="${fs}" fill="#fff" stroke="#000" stroke-width="3" paint-order="stroke" letter-spacing="-0.5" textLength="${Math.min(108, t.length * fs * 0.62)}" lengthAdjust="spacingAndGlyphs">${esc2(t)}</text>`).join('');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 160"><defs><linearGradient id="c" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${pal[0]}"/><stop offset=".55" stop-color="${pal[1]}"/><stop offset="1" stop-color="${pal[2]}"/></linearGradient><linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF6A8"/><stop offset="1" stop-color="${pal[2]}"/></linearGradient></defs>
<rect width="120" height="160" fill="url(#c)"/><g transform="translate(0 ${Math.min(0, dy + 10)})"><circle cx="60" cy="74" r="32" fill="url(#s)"/>${raies}</g><g transform="translate(0 ${dy})">${sil}</g>
<g transform="rotate(${incl} 60 ${bY + bH / 2})"><rect x="-10" y="${bY}" width="140" height="${bH}" fill="${pal[1]}" opacity=".94"/>${tl}</g>
${x.djs ? (() => { const d = x.djs.toUpperCase().replace(/[^\p{L}\p{N}' &+,.-]/gu, ' ').replace(/\s+/g, ' ').trim().slice(0, 34); return `<rect x="3" y="22" width="114" height="15" fill="#000" opacity=".82"/><text x="60" y="33" text-anchor="middle" font-family="Impact, 'Arial Black', sans-serif" font-weight="900" font-size="9" fill="#FFD60A" textLength="${Math.min(108, d.length * 5.6)}" lengthAdjust="spacingAndGlyphs">${esc2(d)}</text>`; })() : ''}<rect x="3" y="3" width="114" height="154" fill="none" stroke="#000" stroke-width="3"/><text x="9" y="17" font-family="Arial, sans-serif" font-weight="800" font-size="9" fill="#fff" stroke="#000" stroke-width="2" paint-order="stroke">${(x.date.slice(8) + '.' + x.date.slice(5, 7))}</text></svg>`;
    return (_affCache[cle] = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg));
  }
  // Couleur de chaque type = celle de sa touche en haut
  const TYPE_COUL = { club: '#3D8BFF', festival: '#FF8A3D', concert: '#F2C53A', bar: '#3DD6C6', restaurant: '#FF4FA3' };
  const TYPE_NOM = { club: 'Club', festival: 'Festival', concert: 'Concert', bar: 'Bar', restaurant: 'Resto' };
  // Une ligne de l'agenda
  function ligneSud(x) {
      const dt = new Date(x.date + 'T12:00:00');
      const wd = (dt.getDay() + 6) % 7, url = x.url || SUD.sources[x.src];
      return `<div class="sud-soiree ${x.gros ? 'gros' : ''}">
        <div class="sud-date" style="--tc:${TYPE_COUL[x.type || 'club']}"><b>${dt.getDate()}</b><small>${JOURS[wd]}</small><i>${TYPE_NOM[x.type || 'club']}</i></div>
        <img class="sud-affiche" src="${afficheSoiree(x)}" alt="" loading="lazy">
        <div class="sud-info"><span class="venue">${esc(x.nom)}</span>
          ${x.djs ? `<small>${esc(x.djs)}</small>` : x.genres ? `<small class="sud-genres">${esc(x.genres)}</small>` : ''}
          <small class="sud-lieu">${esc(x.l.nom)} · ${esc(x.l.ville)}${x.heure ? ' · ' + x.heure.replace(':', 'h') : ''}${x.prix ? ' · ' + esc(x.prix) : ''} ${/^\d+$/.test(x.l.dep) ? ' · <span class="sud-dep">' + x.l.dep + '</span>' : ''}</small></div>
        ${url ? `<a class="badge b-soon" href="${url}" target="_blank" rel="noopener">Infos</a>` : ''}
      </div>`;
  }
  // Les grands festivals de toute la France, même loin de toi : ils valent le déplacement
  function festivalsFrance(proches) {
    const deja = new Set(proches.map((x) => x.nom + x.date)), centre = DEST.local.centre, auj = iso(new Date());
    const fs = SUD.soirees.filter((x) => x.type === 'festival' && x.date >= auj && SUD.lieux[x.lieu] && /^\d+$/.test(SUD.lieux[x.lieu].dep) && !deja.has(x.nom + x.date))
      .map((x) => ({ ...x, l: SUD.lieux[x.lieu], km: distKm(centre, [SUD.lieux[x.lieu].lat, SUD.lieux[x.lieu].lng]) }))
      .sort((a, b) => a.date.localeCompare(b.date)).slice(0, 20);
    if (!fs.length) return '';
    return `<div class="section-title">Grands festivals en France <small>${fs.length} à venir</small></div>` + fs.map(ligneSud).join('');
  }

  function clicAnnee(e) {
    const c = e.target.closest('[data-an]');
    if (c) { const [id, k] = c.dataset.an.split('|'); state.anMois = +k; if (id !== state.dest) changerDest(id); else renderAnnee(); return true; }
    const r = e.target.closest('[data-dest-an]');
    if (r) { changerDest(r.dataset.destAn); return true; }
    return false;
  }

  // ---------- Ibiza en haut de la pyramide, partout ailleurs la géoposition décide.
  // « Ibiza » est toujours accessible d'un toucher. « Autour de moi » prend la position du téléphone :
  // près de Mykonos, Tulum, Miami ou Dubaï, on voit cette destination ; ailleurs (Toulon, Marseille…),
  // les DJ déclarés et les spots signalés autour de soi. Démo : ?pos=mykonos|tulum|miami|dubai|toulon|ibiza
  const POS_DEMO = { ibiza: [38.95, 1.42], mykonos: [37.44, 25.35], tulum: [20.17, -87.46], miami: [25.79, -80.15], dubai: [25.10, 55.17], toulon: [43.1242, 5.928] };
  const distKm = (a, b) => { const r = Math.PI / 180, x = (b[1] - a[1]) * r * Math.cos((a[0] + b[0]) / 2 * r), y = (b[0] - a[0]) * r; return Math.sqrt(x * x + y * y) * 6371; };
  state.mode = store.get('mode', 'geo');
  state.zoneGeo = { dest: 'local', nom: 'Toulon', approx: true };
  // La ville du profil règle la zone « autour de moi » au démarrage (le GPS, s'il répond, la remplace)
  try { const pv = state.profil && state.profil.ville && (window.VILLES || []).find((x) => sansAccent(x[0]).toLowerCase() === sansAccent(state.profil.ville).toLowerCase()); if (pv) { state.zoneGeo = { dest: 'local', nom: pv[0], approx: false }; DEST.local.centre = [pv[2], pv[3]]; } } catch (e) { /* pas de ville */ }
  function zoneDe(pos, approx, nomVille) {
    const proche = DESTS.filter((d) => !d.local).map((d) => ({ d, km: distKm(pos, d.centre) })).sort((a, b) => a.km - b.km)[0];
    if (proche && proche.km < 80) return { dest: proche.d.id, nom: proche.d.nom, approx };
    DEST.local.centre = pos;
    return { dest: 'local', nom: nomVille || 'près de toi', approx };
  }
  // Destinations du monde sous le logo : Ibiza en premier, puis les autres. Le point dit si c'est la saison ce mois-ci.
  const DRAPEAUX = { ibiza: '🇪🇸', mykonos: '🇬🇷', tulum: '🇲🇽', miami: '🇺🇸', dubai: '🇦🇪' };
  // Menu « … saison » : Ibiza en tête, un toucher déroule les autres saisons de DJ
  function majDestLigne() {
    const z = $('#dest-ligne'); if (!z) return;
    const actif = state.mode !== 'geo' && DEST[state.dest] && !DEST[state.dest].local ? DEST[state.dest] : null, aff = actif || DEST.ibiza;
    const html = `<button class="dest-menu-btn ${actif ? 'on' : ''}" id="dest-menu-btn" aria-expanded="${!!state.menuDest}" aria-controls="dest-menu">
        <span class="dp-drapeau" aria-hidden="true">${DRAPEAUX[aff.id]}</span><b>${esc(aff.nom)} saison</b>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg></button>
      <div class="dest-menu" id="dest-menu" ${state.menuDest ? '' : 'hidden'} role="menu">
        ${DESTS.filter((d) => !d.local).map((d) => `<button class="dm-ligne ${aff.id === d.id ? 'on' : ''}" role="menuitem" data-dest-puce="${d.id}">
          <span class="dp-drapeau" aria-hidden="true">${DRAPEAUX[d.id] || '🌍'}</span><span class="dm-nom"><b>${esc(d.nom)} saison</b><small>${esc(d.saison)}</small></span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg></button>`).join('')}
      </div>`;    if (z._html !== html) { z._html = html; z.innerHTML = html; } // pas de redessin inutile (le menu ne clignote pas)
  }
  document.addEventListener('click', (e) => {
    if (e.target.closest('#dest-menu-btn')) { state.menuDest = !state.menuDest; majDestLigne(); return; }
    if (state.menuDest && !e.target.closest('#dest-menu')) { state.menuDest = false; majDestLigne(); }
  });
  function choisirDestMonde(id) {
    if (!DEST[id]) return;
    state.mode = id === 'ibiza' ? 'ibiza' : 'monde'; store.set('mode', state.mode);
    changerDest(id);
  }
  document.addEventListener('click', (e) => { const b = e.target.closest('[data-dest-puce]'); if (b) { state.menuDest = false; state.vueAcc = 'liste'; store.set('vueAcc', 'liste'); choisirDestMonde(b.dataset.destPuce); setTab('live'); } });
  function majModeUI() {
    majDestLigne();
    document.querySelectorAll('[data-mode]').forEach((b) => { const on = b.dataset.mode === state.mode; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
    const z = $('#mode-zone'); if (z) z.textContent = state.zoneGeo.nom + (state.zoneGeo.approx ? ' (démo)' : '');
  }
  function choisirMode(mode) {
    // « Autour de moi » après une ville cherchée : on revient à la vraie position du téléphone
    if (mode === 'geo' && state.villeChoisie) { state.villeChoisie = false; state.mode = 'geo'; store.set('mode', 'geo'); state.zoneGeo = { dest: 'local', nom: 'près de toi', approx: false }; localiser(); return; }
    state.mode = mode; store.set('mode', mode);
    changerDest(mode === 'ibiza' ? 'ibiza' : state.zoneGeo.dest);
    if (mode === 'geo') localiser(true);
  }
  function localiser(force) {
    const demo = new URLSearchParams(location.search).get('pos');
    if (demo && POS_DEMO[demo]) { state.zoneGeo = zoneDe(POS_DEMO[demo], true, demo === 'toulon' ? 'Toulon' : null); if (state.mode === 'geo') changerDest(state.zoneGeo.dest); else majModeUI(); return; }
    if (state.mode === 'geo' && !force) changerDest(state.zoneGeo.dest);
    if (!navigator.geolocation) { if (force) toast('Ton téléphone ne donne pas sa position à cette page'); return; }
    if (force) toast('Je te localise…');
    navigator.geolocation.getCurrentPosition((p) => {
      const lat = p.coords.latitude, lng = p.coords.longitude;
      state.maPos = { lat, lng, acc: p.coords.accuracy, t: Date.now() };
      state.zoneGeo = zoneDe([lat, lng], false, villeProche(lat, lng));
      if (state.mode === 'geo') {
        changerDest(state.zoneGeo.dest);
        if (map && DEST[state.zoneGeo.dest].local) map.setView([lat, lng], 14);
      } else majModeUI();
      dessinerMoi();
      if (map && state.tab === 'map') map.setView([lat, lng], Math.max(map.getZoom(), 14));
      if (force) toast('📍 ' + (state.zoneGeo.dest === 'local' ? 'Te voilà : ' + state.zoneGeo.nom : 'Destination ' + DEST[state.zoneGeo.dest].nom));
    }, (err) => {
      if (!force) return;
      toast(err && err.code === 1
        ? 'Position refusée. Autorise-la : Réglages › Confidentialité › Service de localisation › Safari, puis réessaie.'
        : 'Position introuvable pour l\'instant. Réessaie dans un moment.');
    }, { enableHighAccuracy: true, timeout: 12000, maximumAge: force ? 0 : 60000 });
  }
  document.addEventListener('click', (e) => { const m = e.target.closest('[data-mode]'); if (m) choisirMode(m.dataset.mode); });

  // ---------- Spots signalés : un DJ hors des lieux répertoriés (bar du port, terrasse, bateau, rue…)
  // Le spot est créé à la position du téléphone, visible tout de suite pour son auteur, public après
  // 2 confirmations de personnes à proximité, et il s'efface 3 h après la dernière confirmation.
  // Un bateau bouge : chaque confirmation met à jour sa position.
  const TYPES_SPOT = { club: 'Discothèque', bar: 'Bar', resto: 'Restaurant', plage: 'Plage', rooftop: 'Rooftop', bateau: 'Bateau', rue: 'Rue · place' };
  const DUREE_SPOT = 3 * 3600 * 1000, SEUIL_SPOT = 2;
  const SPOTS_DEMO = () => {
    const now = Date.now();
    return [
      { id: 'demo-port', demo: true, dest: 'ibiza', type: 'bar', nom: 'Terrasse du port', dj: 'DJ local, house', lat: 38.9107, lng: 1.4372, t: now - 50 * 60000, maj: now - 12 * 60000, conf: 4, par: 'ibz_nights' },
      { id: 'demo-bateau', demo: true, dest: 'ibiza', type: 'bateau', nom: 'Catamaran sunset', dj: '', lat: 38.9185, lng: 1.4565, t: now - 35 * 60000, maj: now - 6 * 60000, conf: 2, par: 'sunset.lover',
        trace: [[38.9095, 1.4460], [38.9140, 1.4520]] },
      { id: 'demo-mourillon', demo: true, dest: 'local', type: 'plage', nom: 'Plage du Mourillon', dj: 'DJ Sunny, house', lat: 43.1068, lng: 5.9448, t: now - 40 * 60000, maj: now - 9 * 60000, conf: 5, note: 4, par: 'lea_83' },
      { id: 'demo-rooftop', demo: true, dest: 'local', type: 'rooftop', nom: 'Rooftop du centre', dj: '', lat: 43.1242, lng: 5.9292, t: now - 25 * 60000, maj: now - 4 * 60000, conf: 3, note: 5, par: 'max.tln' }
    ];
  };
  let SPOTS = store.get('spots', []).concat(SPOTS_DEMO());
  const sauverSpots = () => store.set('spots', SPOTS.filter((s) => !s.demo));
  const spotActif = (s) => Date.now() - s.maj < DUREE_SPOT;
  const spotPublic = (s) => s.conf >= SEUIL_SPOT;
  const spotsVisibles = () => SPOTS.filter((s) => s.dest === state.dest && spotActif(s) && (spotPublic(s) || s.mien));
  const ilYa = (ms) => { const m = Math.round((Date.now() - ms) / 60000); return m < 1 ? 'à l\'instant' : m < 60 ? `il y a ${m} min` : m < 1440 ? `il y a ${Math.floor(m / 60)} h` : `il y a ${Math.floor(m / 1440)} j`; };
  const iconeSpot = (s) => djInconnu(s) ? L.divIcon({ className: 'pin-dj pin-inconnu', iconSize: [44, 48], iconAnchor: [22, 47], html: `<img src="${PIN_INCONNU}" alt="">` }) : L.divIcon({ className: 'pin-lieu pin-spot', iconSize: [44, 48], iconAnchor: [22, 47], html: `<img src="${pinSpot(s)}" alt="">` }) || L.divIcon({ className: 'spot-pin' + (s.type === 'bateau' ? ' bateau' : '') + (spotPublic(s) ? '' : ' attente'), iconSize: [30, 30], iconAnchor: [15, 15],
    html: s.type === 'bateau'
      ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 17h18l-2 3H5z"/><path d="M12 3v11M12 4l6 9h-6"/></svg>'
      : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="2"/><path d="M8.5 8.5a5 5 0 0 0 0 7M15.5 8.5a5 5 0 0 1 0 7"/></svg>' });

  function popupSpot(s) {
    const n = s.note || 0, c = s.conf || 0, v = n >= 4 && c >= 3 ? ['Ça vaut le coup', 'top'] : n >= 3 || c >= 2 ? ['Sympa', 'bien'] : ['À vérifier', 'bof'];
    return entreeBulle({ k: 'spot', lieu: esc(s.nom || TYPES_SPOT[s.type]), etat: 'Spot', tete: `<span class="pb-ico spot">${TYPES_SPOT[s.type].slice(0, 1)}</span>`, t: s.dj || 'DJ inconnu',
      heure: `Signalé à ${hm(s.t)} par @${esc(s.par || 'un Banger')}`,
      bang: spotPublic(s) ? `${tetesBangers(c, s.id)}<span><b>${c} Bangers</b> y sont${n ? ' · ' + '★'.repeat(n) : ''}</span><span class="pb-vaut ${v[1]}">${v[0]}</span>` : `<span><b>Ton signalement</b> · en attente ${Math.min(c, SEUIL_SPOT)}/${SEUIL_SPOT}</span>`,
      actions: `<div class="pb-actions"><button class="pb-btn plein" data-spot-ok="${s.id}">${s.type === 'bateau' ? 'Je suis à bord' : 'J\'y suis : il joue'}</button></div>${s.mien && !spotPublic(s) ? `<button class="lien-demo" data-spot-autre="${s.id}">Démo : un autre utilisateur confirme</button>` : ''}` });
  }
  function marqueursSpots() {
    spotsVisibles().forEach((s) => {
      if (s.type === 'bateau' && s.trace && s.trace.length) {
        L.polyline(s.trace.concat([[s.lat, s.lng]]), { color: '#B58CFF', weight: 2, dashArray: '4 6', opacity: .8 }).addTo(layer);
      }
      lierBandeau(survolBulle(L.marker([s.lat, s.lng], { icon: iconeSpot(s), zIndexOffset: 500 }).bindPopup(popupSpot(s), OPT_BULLE)), `data-spot-voir="${s.id}"`).addTo(layer);
    });
  }
  function blocSpots() {
    const ss = spotsVisibles().sort((a, b) => b.maj - a.maj);
    if (!ss.length) return '';
    return `<div class="section-title">Signalés par les Bangers <small>hors des lieux répertoriés</small></div><div class="acc-rang dc-rang">` + ss.map((s) => `<button class="dc-carte dc-spot" data-spot-voir="${s.id}">
      <span class="dc-art"><span class="dc-badge">${spotPublic(s) ? (s.type === 'bateau' ? 'En mer' : 'Signalé') : 'En attente'}</span>
        <span class="dc-type">${esc(TYPES_SPOT[s.type] || 'Spot')}</span><b class="dc-nom">${esc(s.dj || 'DJ inconnu')}</b><span class="dc-lieu">${esc(s.nom || TYPES_SPOT[s.type] || '')}</span></span>
      <span class="dc-bas"><small>Signalé ${ilYa(s.maj)}${s.note ? ' · ' + s.note + '/5' : ''}</small><small>${spotPublic(s) ? 'Confirmé par ' + s.conf : 'À confirmer'}</small></span></button>`).join('') + '</div>';
  }

  // Signaler : la position est prise automatiquement. Si on est dans un lieu connu (moins de 150 m),
  // il est proposé d'office : il ne reste qu'à taper le nom du DJ. Sinon, on choisit juste le type d'endroit.
  let posSpot = null;
  const lieuxIci = () => state.dest === 'ibiza' ? D.lieux : Object.values(LIEUX_DEST).filter((l) => l.dest === state.dest);
  function formSpot() {
    $('#panel-spot').innerHTML = '<div class="ps-titre"><b>Un DJ joue ici</b><button type="button" class="ps-x" data-spot-fermer="1" aria-label="Fermer">×</button></div><p class="aide">Je cherche ta position…</p>';
    $('#panel-spot').hidden = false;
    positionSpot((lat, lng, src) => {
      const proche = lieuxIci().map((l) => ({ l, km: distKm([lat, lng], [l.lat, l.lng]) })).sort((a, b) => a.km - b.km)[0];
      const connu = proche && proche.km < 0.15 ? proche.l : null;
      posSpot = { lat, lng, src, connu };
      const ou = connu ? `<b>${esc(connu.nom)}</b> <small>à ${Math.round(proche.km * 1000)} m</small>`
        : `<b>Endroit non répertorié</b> <small>${src === 'gps' ? 'ta position' : 'centre de la carte (démo)'}</small>`;
      $('#panel-spot').innerHTML = `<form id="form-spot" novalidate>
        <div class="ps-titre"><b>Un DJ joue ici</b><button type="button" class="ps-x" data-spot-fermer="1" aria-label="Fermer">×</button></div>
        <div class="ps-ou"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/></svg><span>Tu es à : ${ou}</span></div>
        <div class="ps-dj-cartes">
          <button type="button" class="ps-dj-carte" data-ps-dj="connu" style="--pc:#FF8A3D"><i aria-hidden="true"></i><b>Je connais le DJ</b><small>J'écris son nom</small></button>
          <button type="button" class="ps-dj-carte" data-ps-dj="inconnu" style="--pc:#8A93AB"><i aria-hidden="true"></i><b>DJ inconnu</b><small>Je ne sais pas qui joue</small></button>
        </div>
        <input class="search ps-dj-champ" name="dj" maxlength="40" list="liste-djs-spot" placeholder="Nom du DJ" autocomplete="off" hidden>
        <datalist id="liste-djs-spot">${state.dest === 'ibiza' ? [...tousLesDjs().values()].slice(0, 300).map((n) => `<option value="${esc(n)}">`).join('') : ''}</datalist>
        ${connu ? '' : `<div class="ps-types">${Object.entries(TYPES_SPOT).map(([k, l], i) => `<label class="ps-type" style="--pc:${({ club: '#3D8BFF', bar: '#A77BFF', resto: '#3DF28A', plage: '#3DD6C6', rooftop: '#FF4FA3', bateau: '#FF8A3D', rue: '#F2C53A' })[k]}"><input type="radio" name="type" value="${k}" ${i === 0 ? 'checked' : ''} hidden><span><i aria-hidden="true"></i>${l}</span></label>`).join('')}<button type="button" class="ps-type ps-ajout-nom" data-ps-nom="1"><span><b aria-hidden="true">+</b>Nom de l'endroit</span></button></div>
          <input class="search ps-nom-champ" name="nom" maxlength="40" placeholder="Nom de l'endroit : terrasse du port, catamaran…" hidden>`}
        <!-- plus de note : on signale juste qu'un DJ joue ici -->
        <button type="submit" class="btn-plein">Signaler</button>
        <button type="button" class="alerte ps-retour" data-spot-fermer="1">← Annuler, retour à la carte</button>
        <p class="aide">Visible tout de suite pour toi ; les autres le verront quand 2 personnes à côté l'auront confirmé.${connu ? '' : ' Il s\'efface 3 h après la dernière confirmation. Pas de spot dans un lieu privé.'}</p>
      </form>`;
    });
  }
  // Note en vinyles : les vinyles jusqu'à celui touché s'allument
  const NOTE_MOTS = ['', 'Bof', 'Moyen', 'Bien', 'Top', 'Très bien'];
  document.addEventListener('click', (e) => {
    const c = e.target.closest('[data-ps-dj]'); if (!c) return;
    document.querySelectorAll('#form-spot .ps-dj-carte').forEach((x) => x.classList.toggle('on', x === c));
    const champ = document.querySelector('#form-spot .ps-dj-champ'); if (!champ) return;
    if (c.dataset.psDj === 'connu') { champ.hidden = false; champ.focus(); } else { champ.value = ''; champ.hidden = true; }
  });
  document.addEventListener('click', (e) => { if (!e.target.closest('[data-ps-nom]')) return; const c = document.querySelector('#form-spot .ps-nom-champ'); if (c) { c.hidden = false; c.focus(); } });
  document.addEventListener('change', (e) => {
    if (!e.target.matches('input[name=note]') || !e.target.closest('.ps-vinyles')) return;
    const n = +e.target.value, fm = e.target.closest('form');
    fm.querySelectorAll('.ps-vinyle').forEach((v, i) => v.classList.toggle('on', i < n));
    const t = fm.querySelector('.ps-note-txt'); if (t) t.textContent = '· ' + NOTE_MOTS[n];
    const b = fm.querySelector('.nd-envoyer'); if (b) b.disabled = false;
  });
  function positionSpot(cb) {
    const c = map.getCenter(), d = DEST[state.dest];
    const repli = () => (state.maPos && Date.now() - state.maPos.t < 120000) ? cb(state.maPos.lat, state.maPos.lng, 'gps') : cb(c.lat, c.lng, 'centre');
    if (!navigator.geolocation) return repli();
    navigator.geolocation.getCurrentPosition((p) => {
      const loin = Math.abs(p.coords.latitude - d.centre[0]) > .5 || Math.abs(p.coords.longitude - d.centre[1]) > .5;
      state.maPos = { lat: p.coords.latitude, lng: p.coords.longitude, acc: p.coords.accuracy, t: Date.now() }; dessinerMoi();
      loin ? repli() : cb(p.coords.latitude, p.coords.longitude, 'gps');
    }, repli, { timeout: 5000, maximumAge: 60000 });
  }
  document.addEventListener('submit', (e) => {
    if (e.target.id !== 'form-spot') return;
    e.preventDefault();
    const f = new FormData(e.target), dj = String(f.get('dj') || '').trim(), note = f.get('note') ? +f.get('note') : null;
    const { lat, lng, src, connu } = posSpot || {};
    $('#panel-spot').hidden = true;
    if (connu && state.dest === 'ibiza') { signaler(connu.id, dj || 'DJ inconnu'); renderMap(); return; }
    const s = { id: 'sp' + Date.now(), dest: state.dest, type: connu ? (connu.type === 'plage' ? 'plage' : 'club') : (f.get('type') || 'bar'),
      nom: connu ? connu.nom : String(f.get('nom') || '').trim(), dj, lat: connu ? connu.lat : lat, lng: connu ? connu.lng : lng,
      t: Date.now(), maj: Date.now(), conf: 0, mien: true, trace: [], note, notes: note ? [note] : [] };
    SPOTS.push(s); sauverSpots();
    renderMap(); rappelCompte && rappelCompte();
    if (connu) { BANG_LIEU[connu.id] = (BANG_LIEU[connu.id] || 0) + 1; store.set('bangLieu', BANG_LIEU); }
    toast(src === 'gps' || connu ? 'Banguérisé : tu es là, un DJ joue · visible pour toi, en attente de 2 confirmations' : 'Démo : spot placé au centre de la carte (déplace la carte avant de signaler)');
  });
  document.addEventListener('click', (e) => {
    if (e.target.closest('#btn-spot')) { formSpot(); return; }
    if (e.target.closest('[data-spot-ici]')) { if (map) map.closePopup(); formSpot(); return; }
    if (e.target.closest('#btn-moi')) { if (state.mode !== 'geo') choisirMode('geo'); else localiser(true); return; }
    if (e.target.closest('[data-spot-fermer]')) { $('#panel-spot').hidden = true; return; }
    const lab = e.target.closest('#form-spot label.chip');
    if (lab) { setTimeout(() => document.querySelectorAll('#form-spot label.chip').forEach((l) => l.classList.toggle('on', l.querySelector('input').checked)), 0); return; }
    const ok = e.target.closest('[data-spot-ok]');
    if (ok) {
      const s = SPOTS.find((x) => x.id === ok.dataset.spotOk); if (!s) return;
      surPlace({ nom: s.nomLieu || (s.type === 'bateau' ? 'ce bateau' : 'ce spot'), lat: s.lat, lng: s.lng }, (pos) => {
        const lat = pos ? pos.lat : s.lat, lng = pos ? pos.lng : s.lng, src = pos ? pos.src : 'lieu';
        if (s.type === 'bateau' && src === 'gps') { s.trace = (s.trace || []).concat([[s.lat, s.lng]]).slice(-8); s.lat = lat; s.lng = lng; }
        if (!s.mien) s.conf += 1;
        s.maj = Date.now(); sauverSpots(); map.closePopup(); renderMap();
        toast(s.type === 'bateau' ? 'Merci ! Position du bateau mise à jour' : 'Merci, ta confirmation est enregistrée');
      }, { rayon: s.type === 'bateau' ? RAYON_BATEAU_M : RAYON_M });
      return;
    }
    const au = e.target.closest('[data-spot-autre]');
    if (au) {
      const s = SPOTS.find((x) => x.id === au.dataset.spotAutre); if (!s) return;
      s.conf += 1; s.maj = Date.now(); sauverSpots(); map.closePopup(); renderMap();
      toast(spotPublic(s) ? 'Validé : ton spot est maintenant visible par tous' : 'Un autre utilisateur a confirmé (1/2)');
      return;
    }
    const v = e.target.closest('[data-spot-voir]');
    if (v) {
      const s = SPOTS.find((x) => x.id === v.dataset.spotVoir); if (!s) return;
      setTab('map'); setTimeout(() => { map.setView([s.lat, s.lng], 15); renderMap(); layer.eachLayer((l) => { if (l.getLatLng && l.getLatLng().lat === s.lat && l.getLatLng().lng === s.lng && l.openPopup) l.openPopup(); }); }, 50);
    }
  });

  // ---------- Profils DJ (abonnement « Live ») : le DJ déclare « Je mixe maintenant », la communauté confirme,
  // et une note de crédibilité se construit au fil des sets. Elle ne s'achète pas : seule la communauté la fait bouger.
  const FORMULES_DJ = {
    live: { nom: 'DJ Live', prix: '4,99 € / mois', aide: 'Déclarer quand tu mixes, apparaître sur la carte en direct, ta note de crédibilité.' },
    pro: { nom: 'DJ Pro', prix: '14,99 € / mois', aide: 'Tout DJ Live, plus : annoncer tes dates à l\'avance, tes liens YouTube, SoundCloud, Mixcloud, Twitch, Instagram et TikTok sur ta fiche, et diffuser tes lives YouTube dans « DJ en live ».' }
  };
  const formuleDe = (d) => FORMULES_DJ[(d && d.formule) || 'live'];
  const FORMULE_DJ = FORMULES_DJ.live;
  // Liens que le DJ Pro affiche sur sa fiche
  const RESEAUX = [
    { id: 'youtube', nom: 'YouTube', ex: 'youtube.com/@toncompte' },
    { id: 'soundcloud', nom: 'SoundCloud', ex: 'soundcloud.com/toncompte' },
    { id: 'mixcloud', nom: 'Mixcloud', ex: 'mixcloud.com/toncompte' },
    { id: 'twitch', nom: 'Twitch', ex: 'twitch.tv/toncompte' },
    { id: 'instagram', nom: 'Instagram', ex: 'instagram.com/toncompte' },
    { id: 'tiktok', nom: 'TikTok', ex: 'tiktok.com/@toncompte' }
  ];
  const urlPropre = (u) => { u = String(u || '').trim(); if (!u) return ''; if (!/^https?:\/\//i.test(u)) u = 'https://' + u; try { const x = new URL(u); return x.protocol === 'https:' || x.protocol === 'http:' ? x.href : ''; } catch (e) { return ''; } };
  function blocLiens(d) {
    const ls = RESEAUX.filter((r) => d.liens && d.liens[r.id]);
    if (!ls.length) return '';
    return `<div class="liens-dj">${ls.map((r) => d.demo
      ? `<span class="lien-reseau r-${r.id}" title="Lien de démonstration">${r.nom}</span>`
      : `<a class="lien-reseau r-${r.id}" href="${esc(d.liens[r.id])}" target="_blank" rel="noopener">${r.nom}</a>`).join('')}</div>`;
  }
  const annoncesAVenir = (d) => (d.annonces || []).filter((a) => new Date(a.date + 'T23:59') >= new Date()).sort((a, b) => (a.date + a.heure).localeCompare(b.date + b.heure));
  const fmtJour = (iso) => { const x = new Date(iso + 'T12:00'); return `${['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'][x.getDay()]} ${x.getDate()} ${moisNom(x.getMonth())}`; };
  function blocAnnonces(d, edit) {
    const as = annoncesAVenir(d);
    if (!as.length && !edit) return '';
    return `<div class="section-title">Prochaines dates <small>annoncées par le DJ</small></div>
      ${as.map((a, i) => `<div class="mini annonce"><span><span class="venue">${fmtJour(a.date)}${a.heure ? ' · ' + esc(a.heure) : ''}</span><br><small>${esc(a.lieu)}${a.texte ? ' · ' + esc(a.texte) : ''}</small></span>
        ${a.billet ? `<a class="badge b-soon" href="${esc(a.billet)}" target="_blank" rel="noopener">Billets</a>` : '<span class="badge b-decl">Annoncé</span>'}
        ${edit ? `<button class="ps-x" data-annonce-suppr="${i}" aria-label="Supprimer cette date">×</button>` : ''}</div>`).join('') || '<p class="conseil">Aucune date annoncée pour l\'instant.</p>'}
      <p class="aide" style="margin-top:4px">Annoncé par le DJ, pas encore confirmé par le lieu.</p>`;
  }
  const NIVEAUX_DJ = [
    { code: 'nouveau', nom: 'Nouveau DJ', aide: 'moins de 5 sets confirmés' },
    { code: 'verifie', nom: 'Vérifié par les Bangers', aide: '5 sets confirmés, crédibilité 60+' },
    { code: 'fiable', nom: 'DJ fiable', aide: '15 sets confirmés, crédibilité 80+' },
    { code: 'reference', nom: 'Référence', aide: '40 sets confirmés, crédibilité 90+' }
  ];
  const DJS_DEMO = [
    { id: 'nina-sol', officiel: true, demo: true, formule: 'pro', liens: { soundcloud: '#', instagram: '#', tiktok: '#', youtube: '#' },
      pays: '🇪🇸', stream: { url: '#', titre: 'Sunset afro house en direct de la terrasse', depuis: Date.now() - 38 * 60000, vues: 412 },
      annonces: [{ date: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10), heure: '22:00', lieu: 'Terrasse du port, Ibiza', texte: 'Sunset afro house' },
        { date: new Date(Date.now() + 9 * 86400000).toISOString().slice(0, 10), heure: '23:30', lieu: 'Lío Ibiza', texte: 'Résidence du jeudi' }],
      nom: 'Nina Sol', styles: ['Afro house', 'Melodic'], ville: 'Ibiza', confirmes: 46, contestes: 1, expires: 2, avis: { top: 88, bien: 31, bof: 6 } },
    { id: 'marco-vela', nom: 'Marco Vela', styles: ['Tech house'], ville: 'Ibiza', confirmes: 17, contestes: 3, expires: 2, avis: { top: 20, bien: 26, bof: 9 } },
    { id: 'lia-k', nom: 'Lia K', styles: ['House', 'Disco & funk'], ville: 'Ibiza', confirmes: 3, contestes: 0, expires: 1, avis: { top: 4, bien: 2, bof: 0 } },
    { id: 'kenzo-b', demo: true, formule: 'pro', liens: { youtube: '#', instagram: '#' }, pays: '🇫🇷', stream: { url: '#', titre: 'Warm-up tech house, home studio Toulon', depuis: Date.now() - 12 * 60000, vues: 57 }, nom: 'Kenzo B', styles: ['Tech house', 'House'], ville: 'Toulon', confirmes: 8, contestes: 1, expires: 2, avis: { top: 12, bien: 9, bof: 3 } },
    { id: 'tomas-reyes', officiel: true, demo: true, formule: 'pro', liens: { youtube: '#', soundcloud: '#' }, pays: '🇲🇽', stream: { url: '#', titre: 'Live depuis la jungle, Tulum', depuis: Date.now() - 74 * 60000, vues: 1280 }, nom: 'Tomás Reyes', styles: ['Afro house'], ville: 'Tulum', confirmes: 22, contestes: 1, expires: 3, avis: { top: 30, bien: 14, bof: 3 } }
  ];
  // DJ Pro fictifs du monde entier, pour remplir le tableau « DJ en live » de la démo
  const djMonde = (id, nom, styles, ville, pays, cred, st) => ({ id, nom, styles, ville, pays, demo: true, formule: 'pro', liens: { youtube: '#', instagram: '#' }, stream: st,
    confirmes: cred[0], contestes: cred[1], expires: 1, avis: { top: cred[2], bien: cred[3], bof: 2 } });
  const ilYaM = (min) => Date.now() - min * 60000, dansM = (min) => Date.now() + min * 60000;
  DJS_DEMO.push(
    djMonde('lena-brandt', 'Lena Brandt', ['Techno'], 'Berlin', '🇩🇪', [31, 1, 40, 12], { url: '#', titre: 'Warehouse techno, Kreuzberg', depuis: ilYaM(52), vues: 864 }),
    djMonde('ren-okada', 'Ren Okada', ['Techno', 'Minimal'], 'Tokyo', '🇯🇵', [19, 2, 22, 10], { url: '#', titre: 'Late night minimal, Shibuya', depuis: ilYaM(97), vues: 336 }),
    djMonde('rafa-lume', 'Rafa Lume', ['Afro house'], 'São Paulo', '🇧🇷', [12, 1, 15, 9], { url: '#', titre: 'Rooftop afro house, Vila Madalena', depuis: ilYaM(23), vues: 198 }),
    djMonde('eleni-vos', 'Eleni Vos', ['Melodic'], 'Mykonos', '🇬🇷', [9, 0, 11, 6], { url: '#', titre: 'Sunset melodic, Scorpios beach', depuis: ilYaM(6), vues: 91 }),
    djMonde('zoe-akin', 'Zoe Akin', ['House'], 'New York', '🇺🇸', [14, 1, 18, 8], { url: '#', titre: 'Brooklyn house session', depuis: dansM(12), vues: 0 }),
    djMonde('thabo-nkosi', 'Thabo Nkosi', ['Amapiano'], 'Le Cap', '🇿🇦', [7, 0, 9, 5], { url: '#', titre: 'Amapiano sundowner', depuis: dansM(95), vues: 0 }),
    djMonde('mc-nova', 'MC Nova', ['Rap'], 'Marseille', '🇫🇷', [10, 1, 14, 6], { url: '#', titre: 'Rap & trap live, Vieux-Port', depuis: ilYaM(18), vues: 742 }),
    djMonde('kai-rivera', 'Kai Rivera', ['Deep house'], 'Lisbonne', '🇵🇹', [15, 0, 17, 7], { url: '#', titre: 'Deep house au coucher du soleil, LX Factory', depuis: ilYaM(41), vues: 455 }),
    djMonde('dax-volt', 'Dax Volt', ['Électro'], 'Paris', '🇫🇷', [11, 1, 13, 8], { url: '#', titre: 'Électro warehouse, Pantin', depuis: ilYaM(9), vues: 288 })
  );
  let MON_DJ = store.get('djPro', null);
  const tousDjsPro = () => DJS_DEMO.concat(MON_DJ ? [MON_DJ] : []);
  const djProParNom = (nom) => tousDjsPro().find((d) => sansAccent(d.nom) === sansAccent(nom));

  // Crédibilité sur 100 : 70 % fiabilité (déclarations confirmées par les Bangers, lissée pour les débutants)
  // + 30 % avis du public. Une déclaration contestée (« il n'est pas là ») pèse trois fois plus qu'une simple expiration.
  function credibilite(d) {
    const fiab = (d.confirmes + 1) / (d.confirmes + d.expires + 3 * d.contestes + 2);
    const a = d.avis || { top: 0, bien: 0, bof: 0 }, n = a.top + a.bien + a.bof;
    const note = n ? (a.top * 5 + a.bien * 3.5 + a.bof * 1.5) / n : null;
    const score = Math.round(100 * (0.7 * fiab + 0.3 * (note == null ? fiab : (note - 1) / 4)));
    const niv = d.confirmes >= 40 && score >= 90 ? 3 : d.confirmes >= 15 && score >= 80 ? 2 : d.confirmes >= 5 && score >= 60 ? 1 : 0;
    return { score, fiab: Math.round(fiab * 100), note: note == null ? null : note.toFixed(1).replace('.', ','), nAvis: n, niv: NIVEAUX_DJ[niv] };
  }
  const badgeCred = (d) => { const c = credibilite(d); return c.niv.code === 'nouveau' ? `<span class="badge cred cred-nouveau">Nouveau DJ</span>` : `<span class="badge cred cred-${c.niv.code}">Crédibilité ${c.score}</span>`; };
  // Profil officiel, validé par les Bangers : 3 preuves croisées.
  // 1. le téléphone du compte est sur place pendant le set ; 2. le public confirme qu'il joue ;
  // 3. ça se répète : 5 sets confirmés, sur 3 soirs et dans 2 lieux différents au moins.
  // Pour un nom déjà présent dans les line-ups officiels (une star), une preuve en plus : un code publié depuis son Instagram officiel.
  const VERIF = { sets: 5, soirs: 3, lieux: 2 };
  const badgeOfficiel = (d) => d && d.officiel ? '<span class="badge officiel" title="Profil officiel, vérifié par les Bangers">✓ Officiel</span>' : '';
  const nomConnu = (nom) => { const k = sansAccent(nom); let ok = false; tousLesDjs().forEach((n, cle) => { if (cle === k) ok = true; }); return ok; };
  function etatVerif(d) {
    const sets = d.sets || [];
    const soirs = new Set(sets.map((x) => x.jour)).size, ls = new Set(sets.map((x) => x.lieu)).size;
    const connu = nomConnu(d.nom);
    const ok = sets.length >= VERIF.sets && soirs >= VERIF.soirs && ls >= VERIF.lieux && (!connu || d.preuveInsta);
    return { sets: sets.length, soirs, lieux: ls, connu, ok };
  }
  function verifierOfficiel() {
    if (!MON_DJ || MON_DJ.officiel) return;
    if (etatVerif(MON_DJ).ok) { MON_DJ.officiel = true; store.set('djPro', MON_DJ); setTimeout(() => toast('Bravo : ton profil est maintenant officiel, vérifié par les Bangers'), 300); }
  }
  function blocVerif(d) {
    if (d.officiel) return `<div class="jour verif ok"><b>✓ Profil officiel</b><p class="conseil" style="margin:6px 0 0">Validé par les Bangers : ta présence sur place et le public l'ont confirmé sur plusieurs soirs.${etatVerif(d).connu ? ' Ta fiche existante (dates, avis) est maintenant reliée à ton compte.' : ''}</p></div>`;
    const v = etatVerif(d);
    const ligne = (fait, txt, n, max) => `<div class="v-ligne ${fait ? 'fait' : ''}"><span class="v-coche">${fait ? '✓' : ''}</span><span>${txt}${max ? ` <small>${Math.min(n, max)}/${max}</small>` : ''}</span>${max ? `<span class="v-barre"><i style="width:${Math.min(100, n / max * 100)}%"></i></span>` : ''}</div>`;
    return `<div class="jour verif">
      <div class="jour-titre">Devenir profil officiel</div>
      <p class="conseil" style="margin:4px 0 10px">C'est la communauté qui te valide : pendant tes sets, ton téléphone est sur place et le public confirme que tu joues.</p>
      ${ligne(v.sets >= VERIF.sets, 'Sets confirmés par le public, téléphone sur place', v.sets, VERIF.sets)}
      ${ligne(v.soirs >= VERIF.soirs, 'Soirs différents', v.soirs, VERIF.soirs)}
      ${ligne(v.lieux >= VERIF.lieux, 'Lieux différents', v.lieux, VERIF.lieux)}
      ${v.connu ? `${ligne(!!d.preuveInsta, 'Ton nom est déjà connu dans les line-ups : publie ce code en story depuis ton Instagram officiel')}
        <div class="v-code"><code>SETLY-${(d.nom.replace(/[^A-Za-z]/g, '').slice(0, 4) || 'DJ').toUpperCase()}-${String(d.nom.length * 731 % 9000 + 1000)}</code>${d.preuveInsta ? '' : '<button class="lien-demo" data-verif-insta="1">Démo : j\'ai publié la story</button>'}</div>` : ''}
      <button class="lien-demo" data-verif-demo="1">Démo : ajouter un set confirmé un autre soir</button>
    </div>`;
  }
  function carteCredibilite(d) {
    const c = credibilite(d);
    return `<div class="jour cred-carte">
      <div class="jour-top"><div><div class="jour-titre">${esc(c.niv.nom)}</div><div class="jour-ev">${esc(c.niv.aide)}</div></div>
        <div class="cred-score cred-${c.niv.code}"><b>${c.niv.code === 'nouveau' ? '–' : c.score}</b><small>/100</small></div></div>
      <div class="stats">
        <span><b>${d.confirmes}</b><small>sets confirmés</small></span>
        <span><b>${c.fiab} %</b><small>fiabilité</small></span>
        <span><b>${c.note ? '★ ' + c.note : '–'}</b><small>${c.nAvis} avis</small></span>
        <span><b>${d.contestes}</b><small>contestés</small></span>
      </div>
      <p class="conseil" style="margin:10px 0 0">La note vient uniquement des Bangers : déclarations confirmées sur place, avis après les sets, signalements « il n'est pas là ». Elle ne s'achète pas.</p>
    </div>`;
  }

  // Déclarations « Je mixe maintenant »
  const DECL_DEMO = () => {
    const now = Date.now();
    return [
      { id: 'd-nina', demo: true, dj: 'nina-sol', dest: 'ibiza', lieu: null, nomLieu: 'Terrasse du port', lat: 38.9104, lng: 1.4366, style: 'Afro house', debut: now - 40 * 60000, fin: now + 140 * 60000, conf: 5, contest: 0 },
      { id: 'd-marco', demo: true, dj: 'marco-vela', dest: 'ibiza', lieu: 'lio', style: 'Tech house', debut: now - 15 * 60000, fin: now + 165 * 60000, conf: 1, contest: 0 },
      { id: 'd-kenzo', demo: true, dj: 'kenzo-b', dest: 'local', lieu: null, nomLieu: 'Club du port, Toulon', lat: 43.1205, lng: 5.9330, style: 'Tech house', debut: now - 20 * 60000, fin: now + 200 * 60000, conf: 2, contest: 0 },
      { id: 'd-tomas', demo: true, dj: 'tomas-reyes', dest: 'tulum', lieu: 'gitano-jungle', style: 'Afro house', debut: now - 30 * 60000, fin: now + 120 * 60000, conf: 3, contest: 0 }
    ];
  };
  let DECLS = store.get('decls', []).concat(DECL_DEMO());
  const sauverDecls = () => store.set('decls', DECLS.filter((x) => !x.demo));
  const djDe = (x) => tousDjsPro().find((d) => d.id === x.dj);
  const lieuDe = (x) => x.lieu ? (lieux[x.lieu] || LIEUX_DEST[x.lieu]) : { nom: x.nomLieu || 'Spot', lat: x.lat, lng: x.lng, zone: '' };
  const declActive = (x) => Date.now() < x.fin && !(x.contest >= 2 && x.contest > x.conf);
  const declConfirmee = (x) => x.conf >= 2;
  const declsVisibles = () => DECLS.filter((x) => x.dest === state.dest && declActive(x) && djDe(x));
  const hm = (ms) => { const d = new Date(ms); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); };

  function carteDecl(x) {
    const d = djDe(x), l = lieuDe(x), voted = state.votesDecl[x.id];
    return `<div class="card decl">
      <div class="card-head"><span class="ch-g">${d.photo ? `<img class="avatar petit" src="${d.photo}" alt="">` : '<span class="decl-ico" aria-hidden="true">DJ</span>'}<span><span class="venue">${esc(l.nom)}</span>${l.zone ? ' · ' + esc(l.zone) : ''}</span></span>
        <span class="badge ${declConfirmee(x) ? 'b-ok' : 'b-decl'}">${declConfirmee(x) ? 'Live confirmé · ' + x.conf : 'Déclaré par le DJ'}</span></div>
      <div class="dj-row"><div><button class="dj lien-dj" data-dj-pro="${esc(d.nom)}">${esc(d.nom)}</button> ${badgeOfficiel(d)}
        <div class="slot">${esc(x.style)} · depuis ${hm(x.debut)} · jusqu'à ${hm(x.fin)} env.</div></div>${badgeCred(d)}</div>
      ${x.mien ? `<div class="decl-actions"><span class="conseil" style="margin:0">Ta déclaration · ${x.conf} confirmation${x.conf > 1 ? 's' : ''}</span>
          ${x.conf < 2 ? `<button class="lien-demo" data-decl-demo="${x.id}">Démo : quelqu'un sur place confirme</button>` : ''}
          <button class="alerte" data-decl-fin="${x.id}">Terminer mon set</button></div>`
        : voted ? `<p class="conseil" style="margin:8px 0 0">Merci, ${voted === 'ok' ? 'ta confirmation' : 'ton signalement'} est enregistré${voted === 'ok' ? 'e' : ''}.</p>`
        : `<div class="decl-actions"><button class="confirm" style="margin:0" data-decl-ok="${x.id}">J'y suis : il joue</button><button class="alerte" data-decl-non="${x.id}">Il n'est pas là</button></div>`}
    </div>`;
  }
  function blocDecls() {
    const xs = declsVisibles().sort((a, b) => credibilite(djDe(b)).score - credibilite(djDe(a)).score);
    if (!xs.length) return '';
    const miens = xs.filter((x) => x.mien), autres = xs.filter((x) => !x.mien);
    const carte = (x) => { const d = djDe(x), l = lieuDe(x), voted = state.votesDecl[x.id], ok = declConfirmee(x);
      return `<div class="dc-carte dc-decl">
        <button class="dc-art" data-dj-pro="${esc(d.nom)}" ${d.photo ? `style="--photo:url('${d.photo}')"` : ''}>
          <span class="dc-badge">${ok ? '<i></i>Live · ' + x.conf : 'Déclaré'}</span>
          <span class="dc-type">${esc(x.style || '')}</span><b class="dc-nom">${esc(d.nom)}${d.officiel ? ' <em class="dc-off">✓</em>' : ''}</b><span class="dc-lieu">${esc(l.nom)}${l.zone ? ' · ' + esc(l.zone) : ''}</span></button>
        <span class="dc-bas"><small>${hm(x.debut)} → ${hm(x.fin)}</small><small>Crédibilité ${credibilite(d).score}</small></span>
        ${voted ? `<span class="dc-merci">Merci, c'est noté</span>` : `<span class="dc-actions"><button data-decl-ok="${x.id}">J'y suis</button><button class="non" data-decl-non="${x.id}">Pas là</button></span>`}
      </div>`; };
    return `<div class="section-title">Déclarés par les DJ <small>${xs.length} en ce moment</small></div>` + miens.map(carteDecl).join('')
      + (autres.length ? `<div class="acc-rang dc-rang">${autres.map(carte).join('')}</div>` : '');
  }
  // Bulles blanches de la grande carte : même contenu que l'encart de l'accueil (dessin, état, nom, heure, infos)
  function dessinBulle(k) {
    if (k === 'spot') return '<svg class="aut-dessin" viewBox="0 0 64 64" aria-hidden="true"><path d="M32 6c-10 0-18 8-18 18 0 13 18 32 18 32s18-19 18-32c0-10-8-18-18-18z" fill="#0A0D16"/><path d="M24 26l9-6v14l-9-6z" fill="#B58CFF"/><rect x="20" y="22" width="5" height="8" rx="1" fill="#B58CFF"/><path d="M37 21q4 5 0 10M40 18q7 8 0 16" fill="none" stroke="#B58CFF" stroke-width="2" stroke-linecap="round"/></svg>';
    if (k === 'club') return '<svg class="aut-dessin" viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="22" fill="#0A0D16"/><circle cx="32" cy="32" r="14" fill="none" stroke="#3DD6C6" stroke-width="1.5" opacity=".6"/><circle cx="32" cy="32" r="8" fill="none" stroke="#3DD6C6" stroke-width="1.5" opacity=".6"/><circle cx="32" cy="32" r="3" fill="#3DD6C6"/></svg>';
    const c = k === 'live' ? '#F2C53A' : '#FF8A3D';
    return `<svg class="aut-dessin" viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="17" r="8" fill="#0A0D16"/><path d="M22 17a10 10 0 0 1 20 0" fill="none" stroke="#0A0D16" stroke-width="3"/><rect x="19" y="15" width="5" height="8" rx="2" fill="#0A0D16"/><rect x="40" y="15" width="5" height="8" rx="2" fill="#0A0D16"/><path d="M20 40c2-9 7-13 12-13s10 4 12 13" fill="#0A0D16"/><path d="M14 33l6 7M50 33l-6 7" stroke="#0A0D16" stroke-width="3.5" stroke-linecap="round"/><rect x="6" y="40" width="52" height="16" rx="3" fill="#0A0D16"/><circle cx="20" cy="48" r="5.5" fill="${c}"/><circle cx="44" cy="48" r="5.5" fill="${c}"/></svg>`;
  }
  // Les Bangers présents (rempli par la communauté quand ils « banguent » sur place) : petites têtes empilées
  const tetesBangers = (n, graine) => { const ids = AV_ILLUS.h.concat(AV_ILLUS.f); let g = 7; for (const ch of String(graine)) g = (g * 31 + ch.charCodeAt(0)) >>> 0;
    return `<span class="bg-tetes">${Array.from({ length: Math.min(n, 4) }, (_, i) => `<img src="avatars-banzic/${ids[(g + i * 7) % ids.length]}.jpg" alt="">`).join('')}</span>`; };
  // Une entrée de bulle (un DJ, un spot, un club) ; plusieurs entrées au même endroit s'empilent dans la même bulle
  const entreeBulle = (o) => `<div class="pb-e pb-${o.k}"><div class="pb-haut"><span class="pb-lieu">${o.lieu}</span><span class="pb-etat"><i></i>${o.etat}</span></div>
    <div class="pb-dj">${o.tete || ''}<span><b>${esc(o.t)}</b><small>${o.heure}</small></span></div>
    <div class="pb-bang">${o.bang}</div>${o.actions || ''}</div>`;
  const bulleCarteHtml = (o) => entreeBulle(o);
  const bullesEmpilees = (lst) => `<div class="pb-pile">${lst.join('<hr class="pb-sep">')}</div>`;
  const OPT_BULLE = { className: 'pop-banzic', maxWidth: 280, minWidth: 240, closeButton: false, offset: [0, -8] };
  // Grande carte : plus aucune bulle. Toucher un repère cale le bandeau sur son info, ou ouvre directement sa fiche
  if (window.L && L.Layer && !L.Layer.prototype.__sansBulle) {
    const ouvrirDepuisRepere = function () {
      if (window.__zoomRepere) window.__zoomRepere(this);
      const html = typeof this.__bulle === 'string' ? this.__bulle : '';
      const m = html.match(/data-(lieu|spot-voir|dj-pro)="([^"]*)"/) || (this.__lieu ? [null, 'lieu', this.__lieu] : null); if (!m) return;
      const attr = `data-${m[1]}="${m[2]}"`;
      if (window.__filCibler && window.__filCibler(attr)) return;
      const f = document.createElement('button'); f.setAttribute('data-' + m[1], m[2].replace(/&quot;/g, '"').replace(/&amp;/g, '&')); f.hidden = true; document.body.appendChild(f); f.click(); f.remove();
    };
    L.Layer.prototype.__sansBulle = true;
    L.Layer.prototype.bindPopup = function (c) { this.__bulle = c; this.off('click', ouvrirDepuisRepere); this.on('click', ouvrirDepuisRepere); return this; };
    L.Layer.prototype.unbindPopup = function () { this.__bulle = null; this.off('click', ouvrirDepuisRepere); return this; };
    L.Layer.prototype.openPopup = function () { return this; };
    L.Layer.prototype.getPopup = function () { return null; };
  }
  const survolBulle = (m) => m.on('mouseover', function () { this.openPopup(); });

  function marqueursDecls() {
    const groupes = {};
    declsVisibles().forEach((x) => { const l = lieuDe(x), d = djDe(x); if (!l || l.lat == null) return; const k = l.lat.toFixed(4) + ',' + l.lng.toFixed(4);
      (groupes[k] = groupes[k] || { l, ok: false, html: [], pin: '', nom1: d.nom }); groupes[k].pin = groupes[k].pin || pinDj(d);
      const ok = declConfirmee(x); groupes[k].ok = groupes[k].ok || ok;
      groupes[k].html.push(entreeBulle({ k: ok ? 'live' : 'decl', lieu: esc(l.nom), etat: ok ? 'En live' : 'Déclaré', tete: avatarDj(d.nom, 'pb-av'), t: d.nom,
        heure: `${hm(x.debut)} → ${hm(x.fin)}${x.style ? ' · ' + esc(x.style) : ''}`,
        bang: ok ? `${tetesBangers(x.conf, x.id)}<span><b>${x.conf} Bangers</b> y sont et confirment</span>` : '<span>Le DJ s\'est déclaré ici · <b>bangue</b> si tu y es</span>',
        actions: `<div class="pb-actions"><button class="pb-btn" data-decl-ok="${x.id}">J'y suis</button><button class="pb-btn plein" data-dj-pro="${esc(d.nom)}">Fiche du DJ</button></div>` })); });
    Object.values(groupes).forEach((g) => {
      const icone = g.pin ? L.divIcon({ className: 'pin-dj' + (g.ok ? ' ok' : ''), iconSize: [44, 48], iconAnchor: [22, 47], html: `<img src="${g.pin}" alt="">${g.html.length > 1 ? '<sup>' + g.html.length + '</sup>' : ''}` })
        : L.divIcon({ className: 'decl-pin' + (g.ok ? ' ok' : '') + (g.html.length > 1 ? ' plusieurs' : ''), iconSize: [30, 30], iconAnchor: [15, 15], html: g.html.length > 1 ? 'DJ<sup>' + g.html.length + '</sup>' : 'DJ' });
      lierBandeau(L.marker([g.l.lat, g.l.lng], { icon: icone, zIndexOffset: 600 })
        .bindPopup(bullesEmpilees(g.html), OPT_BULLE), `data-dj-pro="${esc(g.nom1)}"`).addTo(layer);
    });
  }


  // Carte : cartes moyennes en bas (DJ déclarés et spots signalés), un appui centre la carte et ouvre la bulle
  function renderCartesMap() {
    const box = $('#map-cartes'); if (!box) return;
    // Le bandeau d'actu défile en bas de la grande carte, comme sur l'accueil et les pages saison
    const fil = filDest(); box.innerHTML = fil; box.hidden = !fil; box.classList.add('avec-fil'); return;
    const c = (DEST[state.dest] || {}).centre, dist = (la, lo) => c && la != null ? distKm(c, [la, lo]) : null;
    const kmTxt = (k) => k == null ? '' : ' · ' + (k < 1 ? '< 1' : Math.round(k)) + ' km';
    const ds = declsVisibles().map((x) => { const d = djDe(x), l = lieuDe(x); return `<button class="mc-carte mc-decl" data-mc-ll="${l.lat},${l.lng}">
        <span class="mc-photo">${d.photo ? `<img src="${d.photo}" alt="">` : 'DJ'}</span>
        <span class="mc-txt"><span class="mc-badge">${declConfirmee(x) ? '<i></i>Live confirmé' : 'DJ déclaré'}</span><b>${esc(d.nom)}</b>
          <small>${esc(l.nom)}${kmTxt(dist(l.lat, l.lng))}</small><small>${esc(x.style || '')}${x.style ? ' · ' : ''}jusqu'à ${hm(x.fin)}</small></span></button>`; });
    const ss = spotsVisibles().sort((a, b) => b.maj - a.maj).map((sp) => `<button class="mc-carte mc-spot" data-mc-ll="${sp.lat},${sp.lng}">
        <span class="mc-photo"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="2"/><path d="M8.5 8.5a5 5 0 0 0 0 7M15.5 8.5a5 5 0 0 1 0 7"/></svg></span>
        <span class="mc-txt"><span class="mc-badge">Spot · ${esc(TYPES_SPOT[sp.type] || 'Spot')}</span><b>${esc(sp.dj || 'DJ inconnu')}</b>
          <small>${esc(sp.nom || TYPES_SPOT[sp.type] || 'Spot')}${kmTxt(dist(sp.lat, sp.lng))}</small><small>Signalé ${ilYa(sp.t)}${sp.note ? ' · ' + sp.note + '/5' : ''}</small></span></button>`);
    const all = ds.concat(ss);
    box.innerHTML = all.join('');
    box.hidden = !all.length;
  }
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-mc-ll]'); if (!b || !map) return;
    const [la, lo] = b.dataset.mcLl.split(',').map(Number); if (isNaN(la)) return;
    map.flyTo([la, lo], Math.max(map.getZoom(), 15), { duration: .6 });
    setTimeout(() => layer.eachLayer((m) => { if (m.getLatLng && m.getPopup && m.getPopup()) { const p = m.getLatLng(); if (Math.abs(p.lat - la) < 1e-6 && Math.abs(p.lng - lo) < 1e-6) m.openPopup(); } }), 650);
  });

  // Espace DJ dans le profil
  function blocEspaceDj() {
    if (!MON_DJ) return `<div class="section-title">Espace DJ <small>profil DJ · payant</small></div>
      <div class="jour"><p class="conseil" style="margin:0 0 10px">Tu es DJ ? Crée ton profil DJ : avec la formule <b>${FORMULE_DJ.nom}</b> (${FORMULE_DJ.prix}), tu signales toi-même quand tu mixes, et ta note de crédibilité grandit à chaque set confirmé par le public.</p>
        <button class="btn-plein" data-djpro-creer="1">Créer mon profil DJ</button></div>`;
    const actif = DECLS.find((x) => x.mien && declActive(x));
    const f = formuleDe(MON_DJ), pro = MON_DJ.formule === 'pro';
    return `<div class="section-title">Espace DJ <small>${f.nom} · ${f.prix}</small></div>
      <div class="dj-tete"><div class="dj-tete-g">
          <label class="photo-choix" title="Changer ma photo">${MON_DJ.photo ? `<img class="avatar grand" src="${MON_DJ.photo}" alt="Ma photo">` : `<span class="avatar grand vide">+<small>Photo</small></span>`}
            <input type="file" class="photo-dj-input" accept="image/*" hidden></label>
          <div><h2 style="margin:0">${esc(MON_DJ.nom)} ${badgeOfficiel(MON_DJ)}</h2><div class="meta">${MON_DJ.styles.map(esc).join(' · ')} · ${esc(MON_DJ.ville)}</div>
          <label class="lien-demo" style="display:inline-block;margin-top:4px;cursor:pointer">${MON_DJ.photo ? 'Changer ma photo' : 'Ajouter ma photo'}<input type="file" class="photo-dj-input" accept="image/*" hidden></label></div></div>${badgeCred(MON_DJ)}</div>
      ${actif ? carteDecl(actif) : `<button class="btn-plein btn-mixe" data-djpro-mixe="1">Je mixe maintenant</button>`}
      ${pro ? `${blocLiens(MON_DJ) || '<p class="conseil">Ajoute tes liens pour montrer ce que tu fais : YouTube, SoundCloud, Mixcloud, Twitch, Instagram, TikTok.</p>'}
          <button class="alerte" data-djpro-liens="1">Modifier mes liens</button>
          ${blocAnnonces(MON_DJ, true)}
          <button class="alerte" data-djpro-annonce="1">Annoncer une date</button>
          <div class="section-title">Mon live YouTube <small>visible dans « DJ en live »</small></div>
          ${enStream(MON_DJ) ? carteStream(MON_DJ, true) + '<button class="alerte" data-stream-fin="1">Arrêter mon live</button>'
            : '<button class="btn-plein btn-stream" data-djpro-stream="1"><span class="pt-rouge" aria-hidden="true"></span>Je suis en live sur YouTube</button>'}`
        : `<div class="jour upsell"><b>Passer en ${FORMULES_DJ.pro.nom} · ${FORMULES_DJ.pro.prix}</b><p class="conseil" style="margin:6px 0 10px">${FORMULES_DJ.pro.aide}</p>
          <button class="btn-plein" data-djpro-upgrade="1">Passer en DJ Pro</button></div>`}
      ${blocVerif(MON_DJ)}
      ${carteCredibilite(MON_DJ)}
      <p class="demo-note">Démo : aucun paiement. Dans l'appli, l'abonnement passera par l'App Store, Google Play ou le site.</p>`;
  }
  // ---- DJ en live : les DJ Pro partagent le lien de leur live YouTube, visible par tous dans « DJ en live ».
  // Un live s'arrête quand le DJ le termine, ou tout seul au bout de 6 h.
  const DUREE_STREAM = 6 * 3600000;
  const enStream = (d) => !!(d && d.formule === 'pro' && d.stream && d.stream.depuis <= Date.now() && Date.now() - d.stream.depuis < DUREE_STREAM);
  const streamPrevu = (d) => !!(d && d.formule === 'pro' && d.stream && d.stream.depuis > Date.now() && d.stream.depuis - Date.now() < 12 * 3600000);
  const porteDe = (d) => String([...d.id].reduce((a, c) => a + c.charCodeAt(0), 0) % 24 + 1).padStart(2, '0');
  const ytId = (u) => { try { const x = new URL(u), h = x.hostname.replace(/^www\.|^m\./, '');
    if (h === 'youtu.be') return x.pathname.slice(1).split('/')[0] || null;
    if (x.searchParams.get('v')) return x.searchParams.get('v');
    const m = x.pathname.match(/^\/(live|embed|shorts)\/([\w-]{6,})/); return m ? m[2] : null; } catch (e) { return null; } };
  // Petit lecteur sur la fiche du DJ : le live YouTube se regarde dans Banzic, et chaque Banger qui l'écoute compte.
  function lecteurStream(d) {
    if (streamPrevu(d)) return `<div class="section-title">Prochain live</div><div class="lecteur prevu"><span class="badge b-soon">Prochain live à ${hm(d.stream.depuis)}</span><div class="stream-titre">${esc(d.stream.titre)}</div><p class="conseil" style="margin:0">Reviens à ${hm(d.stream.depuis)} : le lecteur s'allumera ici.</p></div>`;
    if (!enStream(d)) return '';
    const st = d.stream, id = !d.demo && ytId(st.url);
    const ecran = id
      ? `<iframe class="lecteur-ecran" src="https://www.youtube-nocookie.com/embed/${esc(id)}?playsinline=1" title="Live YouTube de ${esc(d.nom)}" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`
      : `<button class="lecteur-ecran demo" data-lecteur-demo="${esc(d.id)}" aria-label="Écouter le live de ${esc(d.nom)}">
          <span class="le-nom">${esc(d.nom)}</span><span class="le-play" aria-hidden="true">▶</span>
          <span class="le-eq" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span></button>`;
    return `<div class="section-title">En live <small>depuis ${depuisTxt(st.depuis)}</small></div>
      <div class="lecteur" data-lecteur="${esc(d.id)}">
        <div class="lecteur-haut"><span class="badge b-yt"><span class="pt-rouge" aria-hidden="true"></span>EN LIVE</span><span class="le-vues"><b data-vues="${esc(d.id)}">${(st.vues || 0).toLocaleString('fr-FR')}</b> Bangers à l'écoute</span></div>
        ${ecran}
        <div class="stream-titre">${esc(st.titre)}</div>
      </div>`;
  }
  const streamsActifs = () => tousDjsPro().filter(enStream).sort((a, b) => (b.stream.vues || 0) - (a.stream.vues || 0));
  const depuisTxt = (t) => { const m = Math.max(1, Math.round((Date.now() - t) / 60000)); return m < 60 ? m + ' min' : Math.floor(m / 60) + ' h ' + String(m % 60).padStart(2, '0'); };
  function carteStream(d, court) {
    const st = d.stream;
    const lien = d.demo || st.url === '#'
      ? `<button class="btn-yt" data-stream-demo="1"><span aria-hidden="true">▶</span> Regarder sur YouTube</button>`
      : `<a class="btn-yt" href="${esc(st.url)}" target="_blank" rel="noopener"><span aria-hidden="true">▶</span> Regarder sur YouTube</a>`;
    return `<div class="card stream">
      ${court ? '' : `<div class="dj-row"><div class="dj-tete-g">${d.photo ? `<img class="avatar petit" src="${d.photo}" alt="">` : avatarDj(d.nom)}<div><button class="dj lien-dj" data-dj-pro="${esc(d.nom)}">${esc(d.nom)}</button> ${badgeOfficiel(d)}
        <div class="slot">${d.styles.map(esc).join(' · ')}${d.ville ? ' · ' + esc(d.ville) : ''}</div></div></div>${badgeCred(d)}</div>`}
      <div class="stream-titre"><span class="badge b-yt"><span class="pt-rouge" aria-hidden="true"></span>EN LIVE</span> ${esc(st.titre)}</div>
      <div class="slot">Depuis ${depuisTxt(st.depuis)}${st.vues ? ' · ' + st.vues.toLocaleString('fr-FR') + ' spectateurs' : ''}</div>
      ${lien}</div>`;
  }
  function majDjLive() {
    const n = streamsActifs().length, b = $('#btn-djlive'); if (!b) return;
    $('#djlive-n').textContent = n ? n : '';
    b.classList.toggle('vide', !n);
    if (state.djLiveOuvert) renderDjLive();
  }
  // Tableau « DJ en live » façon panneau des départs d'aéroport (lettres à palettes qui tournent)
  const flap = (txt, n) => { txt = String(txt).toUpperCase(); if (n) txt = txt.padEnd(n).slice(0, n); return [...txt].map((c) => `<span class="fl${c === ' ' ? ' vide' : ''}" data-c="${esc(c)}">${c === ' ' ? '&nbsp;' : esc(c)}</span>`).join(''); };
  function renderDjLive() {
    const live = streamsActifs(), prevus = tousDjsPro().filter(streamPrevu).sort((x, y) => x.stream.depuis - y.stream.depuis);
    const ligne = (d) => {
      const on = enStream(d), mins = (d.stream.depuis - Date.now()) / 60000;
      const statut = on ? '<span class="dep-statut live"><span class="pt-live" aria-hidden="true"></span>En live</span>' : mins <= 20 ? '<span class="dep-statut embarq">Embarquement</span>' : '<span class="dep-statut prevu">Prévu ' + hm(d.stream.depuis) + '</span>';
      return `<button class="dep-ligne${on ? ' on' : ''}" data-dj-pro="${esc(d.nom)}" aria-label="${esc(d.nom)}, ${on ? 'en live' : 'live prévu à ' + hm(d.stream.depuis)}">
        <span class="dep-av">${d.photo ? `<img class="avatar" src="${d.photo}" alt="">` : avatarDj(d.nom)}</span>
        <span class="dep-centre">
          <span class="dep-dj">${flap(d.nom.normalize('NFD').replace(/[̀-ͯ]/g, ''), 12)}</span>
          <span class="dep-info">${d.pays || '🌍'} ${esc(d.ville || '')} · ${esc(d.styles[0] || '')} · ${on ? 'depuis ' + hm(d.stream.depuis) : 'à ' + hm(d.stream.depuis)}</span>
          <span class="dep-bas">${statut}${on ? `<span class="dep-vues"><b class="fl-nb" data-vues-tab="${esc(d.id)}">${flap(String(d.stream.vues || 0))}</b> Bangers à l'écoute</span>` : ''}</span>
        </span>
        <span class="dep-porte"><small>Porte</small><span class="dep-porte-n">${flap(porteDe(d))}</span></span>
      </button>`;
    };
    const genres = [...new Set(live.concat(prevus).map(genreDe))];
    if (state.genreLive && !genres.includes(state.genreLive)) state.genreLive = null;
    const filtre = (d) => !state.genreLive || genreDe(d) === state.genreLive;
    const puces = `<div class="genre-puces">${['', ...genres].map((g) => `<button class="genre-puce${(state.genreLive || '') === g ? ' on' : ''}" data-genre-live="${esc(g)}" style="--gc:${g ? coulGenre(g) : '#C9CFDD'}">${g ? esc(g) : 'Tous'}</button>`).join('')}</div>`;
    const lv = live.filter(filtre), pv = prevus.filter(filtre);
    let h = `<div class="acc-tete"><div><h2>DJ en live</h2><small>${live.length} DJ en direct partout dans le monde · touche un style, puis un DJ</small></div></div>${puces}
      ${lv.length ? `<div class="lect-grille">${lv.map((d) => carteLecteur(d)).join('')}</div>` : '<div class="empty">Aucun DJ en live dans ce style pour l\'instant.</div>'}
      ${pv.length ? `<div class="section-title">Bientôt en live <small>${pv.length} prévu${pv.length > 1 ? 's' : ''}</small></div><div class="lect-grille">${pv.map((d) => carteLecteur(d, true)).join('')}</div>` : ''}
      <p class="conseil" style="margin:14px 2px">Touche un DJ : sa fiche s'ouvre avec son lecteur live. Chaque Banger qui l'écoute s'ajoute au compteur.</p>`;
    h += MON_DJ && MON_DJ.formule === 'pro'
      ? (enStream(MON_DJ) ? '' : `<button class="alerte" data-djlive-moi="1">Je suis en live : partager mon lien</button>`)
      : `<div class="jour upsell"><b>Tu es DJ ? Affiche-toi ici en live</b><p class="conseil" style="margin:6px 0 10px">Réservé aux ${FORMULES_DJ.pro.nom} (${FORMULES_DJ.pro.prix}), où que tu sois dans le monde : tu lances ton live sur YouTube, tu colles le lien dans ton Espace DJ, et tu décolles ici.</p>
          <button class="btn-plein" data-djlive-moi="1">${MON_DJ ? 'Passer en DJ Pro' : 'Créer mon profil DJ'}</button></div>`;
    h += `<p class="demo-note">Démo : DJ et lives fictifs. Dans l'appli, seuls les DJ Pro apparaissent ici, sans besoin de géolocalisation.</p>`;
    $('#djlive-body').innerHTML = h;
    animerPalettes($('#djlive-body'));
  }
  // Effet palettes : chaque lettre défile avant de se poser, comme sur un vrai panneau
  const PAL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  function animerPalettes(root, seulement) {
    (seulement || root.querySelectorAll('.fl:not(.vide)')).forEach((el, i) => {
      const fin = el.dataset.c; let n = 3 + Math.floor(Math.random() * 5) + Math.floor(i / 10);
      el.classList.add('roule');
      const t = setInterval(() => { if (--n <= 0) { clearInterval(t); el.textContent = fin; el.classList.remove('roule'); return; } el.textContent = PAL[Math.floor(Math.random() * PAL.length)]; }, 55);
    });
  }
  // Démo : le nombre de Bangers à l'écoute bouge un peu toutes les quelques secondes
  setInterval(() => {
    streamsActifs().forEach((d) => {
      if (!d.demo) return;
      d.stream.vues = Math.max(1, (d.stream.vues || 0) + Math.round((Math.random() - .35) * Math.max(3, d.stream.vues / 40)));
      const box = document.querySelector(`[data-vues-tab="${d.id}"]`);
      if (box) { const txt = String(d.stream.vues), fls = box.querySelectorAll('.fl'), chg = [];
        if (fls.length !== txt.length) { box.innerHTML = flap(txt); animerPalettes(box); }
        else { [...txt].forEach((c, i) => { if (fls[i].dataset.c !== c) { fls[i].dataset.c = c; chg.push(fls[i]); } }); animerPalettes(box, chg); } }
      document.querySelectorAll(`[data-vues="${d.id}"]`).forEach((b) => { b.textContent = d.stream.vues.toLocaleString('fr-FR'); });
    });
  }, 4000);
  document.addEventListener('click', (e) => {
    const ld = e.target.closest('[data-lecteur-demo]'); if (!ld) return;
    const d = tousDjsPro().find((x) => x.id === ld.dataset.lecteurDemo); if (!d || ld.classList.contains('joue')) return;
    ld.classList.add('joue'); d.stream.vues += 1;
    document.querySelectorAll(`[data-vues="${d.id}"]`).forEach((b) => { b.textContent = d.stream.vues.toLocaleString('fr-FR'); });
    toast('Démo : tu écoutes ' + d.nom + '. Dans l\'appli, son live joue ici.');
  });
  function ouvrirDjLive() {
    $('#suggestions-dj').hidden = true;
    state.djLiveOuvert = true; renderDjLive();
    $('#sheet-djlive').classList.add('open'); $('#sheet-djlive').setAttribute('aria-hidden', 'false');
  }
  function fermerDjLive() {
    state.djLiveOuvert = false;
    $('#sheet-djlive').classList.remove('open'); $('#sheet-djlive').setAttribute('aria-hidden', 'true');
  }
  document.addEventListener('click', (e) => {
    if (e.target.closest('#btn-djlive')) { ouvrirDjLive(); return; }
    if (e.target.closest('#btn-autour')) { state.vueAcc = 'liste'; store.set('vueAcc', 'liste'); if (state.mode !== 'geo') choisirMode('geo'); setTab('live'); majAutour(); return; }
    if (e.target.closest('#djlive-back')) { fermerDjLive(); return; }
    if (e.target.closest('[data-stream-demo]')) { toast('Démo : ici s\'ouvrirait le live YouTube du DJ'); return; }
    if (e.target.closest('[data-djlive-moi]')) {
      fermerDjLive();
      state.vueDj = !MON_DJ ? (state.compte && state.profil ? 'creer' : null) : MON_DJ.formule === 'pro' ? 'stream' : null;
      setTab('profil');
      if (!MON_DJ && !state.vueDj) toast('Crée d\'abord ton compte, puis ton profil DJ');
      return;
    }
  });
  const majAutour = () => { const b = $('#btn-autour'); if (b) b.classList.toggle('on', state.vueAcc !== 'accueil' && state.mode === 'geo' && state.tab === 'live'); };
  document.addEventListener('click', () => setTimeout(majAutour, 0));
  setTimeout(majAutour, 0);
  setTimeout(majDjLive, 0);
  setInterval(majDjLive, 60000);
  function formStream() {
    return `<form id="form-stream" class="profil-form" novalidate>
      <div class="section-title">Je suis en live sur YouTube</div>
      <label class="champ"><span>Lien de ton live YouTube</span><input class="search" name="url" inputmode="url" placeholder="youtube.com/live/…"></label>
      <p class="erreur" id="err-stream" hidden>Colle le lien de ton live YouTube (youtube.com ou youtu.be)</p>
      <label class="champ"><span>Titre (facultatif)</span><input class="search" name="titre" maxlength="60" placeholder="Sunset house depuis mon studio"></label>
      <button type="submit" class="btn-plein">Apparaître dans « DJ en live »</button>
      <button type="button" class="alerte" data-djpro-annuler="1">Annuler</button>
      <p class="aide">Lance d'abord ton live sur YouTube, puis colle son lien ici. Tu disparais de « DJ en live » quand tu l'arrêtes, ou tout seul au bout de 6 h.</p>
    </form>`;
  }
  function formDjPro() {
    return `<form id="form-djpro" class="profil-form" novalidate>
      <div class="section-title">Mon profil DJ</div>
      <label class="champ"><span>Nom d'artiste</span><input class="search" name="nom" maxlength="30" placeholder="DJ Nightowl" value="${esc(state.nomRevendique || '')}"></label>
      <p class="erreur" id="err-djnom" hidden>Choisis un nom d'artiste</p>
      <div class="champ"><span>Tes styles <small class="aide">(fais défiler)</small></span>${cartesGenres('styles', [])}</div>
      <label class="champ" id="champ-ville-dj"><span>Ta ville, zone d'activité <small class="aide">(obligatoire)</small></span>
        <span class="ville-ligne"><input class="search" name="ville" list="liste-villes-dj" maxlength="40" value="${esc((state.profil && state.profil.ville) || '')}" placeholder="Toulon, Marseille, Ibiza…" autocomplete="address-level2">
        <button type="button" class="ville-gps" data-ville-gps="1" aria-label="Utiliser ma position"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 3 3 10.5l7.2 2.3L12.5 20z" fill="currentColor"/></svg>Ma position</button></span>
        <datalist id="liste-villes-dj">${(window.VILLES || []).map((v) => `<option value="${esc(v[0])}">`).join('')}</datalist></label>
      <p class="erreur" id="err-ville-dj" hidden>Indique la ville où tu mixes</p>
      <div class="champ"><span>Ton avatar <small class="aide">ta tête sur la carte, ta fiche et le bandeau</small></span><div class="choix-pins">${PINS_TOUS.map((p, i) => `<label class="choix-pin${i === 0 ? ' on' : ''}"><input type="radio" name="pin" value="${p}" ${i === 0 ? 'checked' : ''}><img src="pins-dj/${p}.png" alt="" loading="lazy"></label>`).join('')}</div></div>
      <div class="champ"><span>Ta formule</span>
        ${Object.entries(FORMULES_DJ).map(([k, f], i) => `<label class="formule ${i === 0 ? 'on' : ''}"><input type="radio" name="formule" value="${k}" ${i === 0 ? 'checked' : ''}><span><b>${f.nom} · ${f.prix}</b><small>${f.aide}</small></span></label>`).join('')}
        <small class="aide">Sans engagement.</small></div>
      <button type="submit" class="btn-plein">M'abonner et créer mon profil DJ</button>
      <button type="button" class="alerte" data-djpro-annuler="1">Annuler</button>
    </form>`;
  }
  function formLiens() {
    return `<form id="form-liens" class="profil-form" novalidate>
      <div class="section-title">Mes liens</div>
      <p class="conseil" style="margin-top:0">Ils s'affichent sur ta fiche DJ. Colle l'adresse de ta page ou de ta chaîne.</p>
      ${RESEAUX.map((r) => `<label class="champ"><span>${r.nom}</span><input class="search" name="${r.id}" inputmode="url" autocomplete="off" placeholder="${r.ex}" value="${esc((MON_DJ.liens || {})[r.id] || '')}"></label>`).join('')}
      <button type="submit" class="btn-plein">Enregistrer mes liens</button>
      <button type="button" class="alerte" data-djpro-annuler="1">Annuler</button>
    </form>`;
  }
  function formAnnonce() {
    const demain = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    return `<form id="form-annonce" class="profil-form" novalidate>
      <div class="section-title">Annoncer une date</div>
      <label class="champ"><span>Date</span><input class="search" type="date" name="date" value="${demain}" min="${new Date().toISOString().slice(0, 10)}"></label>
      <label class="champ"><span>Heure</span><input class="search" type="time" name="heure" value="23:00"></label>
      <label class="champ"><span>Lieu</span><input class="search" name="lieu" maxlength="50" placeholder="Club, bar, ville…"></label>
      <p class="erreur" id="err-lieu" hidden>Indique le lieu</p>
      <label class="champ"><span>Infos (facultatif)</span><input class="search" name="texte" maxlength="60" placeholder="Nom de la soirée, style, invités…"></label>
      <label class="champ"><span>Lien billetterie (facultatif)</span><input class="search" name="billet" inputmode="url" placeholder="https://…"></label>
      <button type="submit" class="btn-plein">Publier la date</button>
      <button type="button" class="alerte" data-djpro-annuler="1">Annuler</button>
      <p class="aide">Ta date apparaît sur ta fiche et chez tes fans, avec la mention « Annoncé par le DJ ».</p>
    </form>`;
  }
  function formMixe() {
    const ls = state.dest === 'ibiza' ? D.lieux : Object.values(LIEUX_DEST).filter((l) => l.dest === state.dest);
    const fin = new Date(Date.now() + 2 * 3600000);
    return `<form id="form-mixe" class="profil-form" novalidate>
      <div class="section-title">Je mixe maintenant</div>
      <label class="champ"><span>Où ?</span><select class="search" name="lieu">
        <option value="">Ailleurs : bar, resto, bateau… (ma position)</option>
        ${ls.map((l) => `<option value="${l.id}">${esc(l.nom)}</option>`).join('')}</select></label>
      <label class="champ"><span>Si ailleurs, le nom de l'endroit</span><input class="search" name="nomLieu" maxlength="40" placeholder="Terrasse du port, catamaran…"></label>
      <div class="champ"><span>Style joué</span>${(() => { const l = MON_DJ.styles.length ? MON_DJ.styles.concat(GENRES.filter((g) => !MON_DJ.styles.includes(g))) : GENRES; return cartesGenres('style', [l[0]], 'radio', l); })()}</div>
      <label class="champ"><span>Fin estimée</span><input class="search" type="time" name="fin" value="${hm(fin.getTime())}"></label>
      <button type="submit" class="btn-plein">Je mixe : me mettre sur la carte</button>
      <button type="button" class="alerte" data-djpro-annuler="1">Annuler</button>
      <p class="aide">Ta position confirme que tu es bien sur place. Tu apparais tout de suite « Déclaré par le DJ » ; après 2 confirmations des Bangers, ça devient « Live confirmé ».</p>
    </form>`;
  }
  state.votesDecl = store.get('votesDecl', {});
  state.vueDj = null; // null | 'creer' | 'mixe'

  document.addEventListener('submit', (e) => {
    if (e.target.id === 'form-djpro') {
      e.preventDefault();
      const f = new FormData(e.target), nom = String(f.get('nom') || '').trim();
      if (nom.length < 2) { $('#err-djnom').hidden = false; return; }
      if (String(f.get('ville') || '').trim().length < 2) { $('#err-ville-dj').hidden = false; $('#champ-ville-dj').scrollIntoView({ block: 'center', behavior: 'smooth' }); return; }
      MON_DJ = { id: 'moi', formule: f.get('formule') || 'live', liens: {}, annonces: [], nom, styles: f.getAll('styles'), ville: String(f.get('ville') || '').trim(), confirmes: 0, contestes: 0, expires: 0, avis: { top: 0, bien: 0, bof: 0 }, mien: true, pin: String(f.get('pin') || '') };
      store.set('djPro', MON_DJ); state.vueDj = null; state.nomRevendique = null; renderProfil(); toast('Profil DJ créé · formule ' + formuleDe(MON_DJ).nom + ' (démo)');
    }
    if (e.target.id === 'form-liens') {
      e.preventDefault();
      const f = new FormData(e.target); MON_DJ.liens = {};
      RESEAUX.forEach((r) => { const u = urlPropre(f.get(r.id)); if (u) MON_DJ.liens[r.id] = u; });
      store.set('djPro', MON_DJ); state.vueDj = null; renderProfil(); toast('Liens enregistrés');
      return;
    }
    if (e.target.id === 'form-stream') {
      e.preventDefault();
      const f = new FormData(e.target), u = urlPropre(f.get('url'));
      if (!u || !/(^|\.)(youtube\.com|youtu\.be)$/i.test(new URL(u).hostname)) { $('#err-stream').hidden = false; return; }
      MON_DJ.stream = { url: u, titre: String(f.get('titre') || '').trim() || 'Live de ' + MON_DJ.nom, depuis: Date.now(), vues: 0 };
      store.set('djPro', MON_DJ); state.vueDj = null; renderProfil(); majDjLive(); toast('Tu es dans « DJ en live »');
      return;
    }
    if (e.target.id === 'form-annonce') {
      e.preventDefault();
      const f = new FormData(e.target), lieu = String(f.get('lieu') || '').trim();
      if (lieu.length < 2) { $('#err-lieu').hidden = false; return; }
      MON_DJ.annonces = (MON_DJ.annonces || []).concat([{ date: f.get('date'), heure: f.get('heure') || '', lieu, texte: String(f.get('texte') || '').trim(), billet: urlPropre(f.get('billet')) }]);
      store.set('djPro', MON_DJ); state.vueDj = null; renderProfil(); toast('Date publiée sur ta fiche');
      return;
    }
    if (e.target.id === 'form-mixe') {
      e.preventDefault();
      const f = new FormData(e.target), lieu = f.get('lieu') || null;
      const [h, m] = String(f.get('fin') || '').split(':').map(Number);
      let fin = new Date(); if (!isNaN(h)) { fin.setHours(h, m || 0, 0, 0); if (fin < new Date()) fin = new Date(fin.getTime() + 86400000); } else fin = new Date(Date.now() + 2 * 3600000);
      const cree = (lat, lng) => {
        DECLS.push({ id: 'dc' + Date.now(), dj: 'moi', mien: true, dest: state.dest, lieu, nomLieu: String(f.get('nomLieu') || '').trim() || 'Spot', lat, lng, style: f.get('style'), debut: Date.now(), fin: fin.getTime(), conf: 0, contest: 0 });
        sauverDecls(); state.vueDj = null; renderProfil(); toast('Tu es sur la carte : « Déclaré par le DJ »');
      };
      if (lieu) cree(null, null);
      else if (map) positionSpot(cree);
      else { const c = DEST[state.dest].centre; cree(c[0], c[1]); }
    }
  });
  document.addEventListener('click', (e) => {
    const lab = e.target.closest('#form-djpro label.chip');
    if (lab) { setTimeout(() => lab.classList.toggle('on', lab.querySelector('input').checked), 0); return; }
    if (e.target.closest('[data-djpro-creer]')) { state.vueDj = 'creer'; renderProfil(); return; }
    const rv = e.target.closest('[data-revendiquer]');
    if (rv) {
      fermerDj(); state.nomRevendique = rv.dataset.revendiquer;
      if (MON_DJ) { toast('Tu as déjà un profil DJ : ' + MON_DJ.nom); setTab('profil'); return; }
      state.vueDj = state.compte && state.profil ? 'creer' : null; setTab('profil');
      if (!state.vueDj) toast('Crée d\'abord ton compte, puis ton profil DJ');
      return;
    }
    if (e.target.closest('[data-djpro-mixe]')) { state.vueDj = 'mixe'; renderProfil(); return; }
    if (e.target.closest('[data-djpro-liens]')) { state.vueDj = 'liens'; renderProfil(); return; }
    if (e.target.closest('[data-djpro-annonce]')) { state.vueDj = 'annonce'; renderProfil(); return; }
    if (e.target.closest('[data-djpro-stream]')) { state.vueDj = 'stream'; renderProfil(); return; }
    if (e.target.closest('[data-stream-fin]') && MON_DJ) { delete MON_DJ.stream; store.set('djPro', MON_DJ); renderProfil(); majDjLive(); toast('Live terminé : tu n\'apparais plus dans « DJ en live »'); return; }
    if (e.target.closest('[data-djpro-upgrade]') && MON_DJ) { MON_DJ.formule = 'pro'; MON_DJ.liens = MON_DJ.liens || {}; MON_DJ.annonces = MON_DJ.annonces || []; store.set('djPro', MON_DJ); renderProfil(); toast('Tu es passé en DJ Pro (démo)'); return; }
    const sup = e.target.closest('[data-annonce-suppr]');
    if (sup && MON_DJ) { const as = annoncesAVenir(MON_DJ), a = as[+sup.dataset.annonceSuppr]; MON_DJ.annonces = MON_DJ.annonces.filter((x) => x !== a); store.set('djPro', MON_DJ); renderProfil(); return; }
    const lp = e.target.closest('#form-djpro label.choix-pin');
    if (lp) { setTimeout(() => document.querySelectorAll('#form-djpro label.choix-pin').forEach((l) => l.classList.toggle('on', l.querySelector('input').checked)), 0); }
    const lab2 = e.target.closest('#form-djpro label.formule');
    if (lab2) { setTimeout(() => document.querySelectorAll('#form-djpro label.formule').forEach((l) => l.classList.toggle('on', l.querySelector('input').checked)), 0); }
    if (e.target.closest('[data-djpro-annuler]')) { state.vueDj = null; renderProfil(); return; }
    const dp = e.target.closest('[data-dj-pro]');
    if (dp) { ouvrirDj(dp.dataset.djPro); return; }
    const vote = (id, v) => {
      const x = DECLS.find((y) => y.id === id); if (!x) return;
      if (v === 'ok') x.conf += 1; else x.contest += 1;
      state.votesDecl[id] = v; store.set('votesDecl', state.votesDecl); sauverDecls(); render();
      toast(v === 'ok' ? 'Merci : ça compte pour la crédibilité du DJ' : 'Merci : si d\'autres le confirment, la déclaration est retirée');
    };
    const lieuDecl = (id) => { const x = DECLS.find((y) => y.id === id); return x ? lieuDe(x) : null; };
    const ok = e.target.closest('[data-decl-ok]'); if (ok) { surPlace(lieuDecl(ok.dataset.declOk), () => vote(ok.dataset.declOk, 'ok')); return; }
    const non = e.target.closest('[data-decl-non]'); if (non) { surPlace(lieuDecl(non.dataset.declNon), () => vote(non.dataset.declNon, 'non')); return; }
    const dm = e.target.closest('[data-decl-demo]');
    if (dm) {
      const x = DECLS.find((y) => y.id === dm.dataset.declDemo); if (!x) return;
      x.conf += 1;
      if (x.conf === 2 && MON_DJ) {
        MON_DJ.confirmes += 1;
        MON_DJ.sets = (MON_DJ.sets || []).concat([{ jour: new Date().toISOString().slice(0, 10), lieu: x.lieu || x.nomLieu, presence: true }]);
        store.set('djPro', MON_DJ); verifierOfficiel();
      }
      sauverDecls(); render();
      toast(x.conf >= 2 ? 'Live confirmé par les Bangers : +1 set confirmé pour ta crédibilité' : 'Une personne sur place a confirmé (1/2)');
      return;
    }
    if (e.target.closest('[data-verif-demo]') && MON_DJ) {
      const n = (MON_DJ.sets || []).length + 1, LIEUX_DEMO = ['pacha', 'lio', 'Terrasse du port', 'amnesia'];
      MON_DJ.sets = (MON_DJ.sets || []).concat([{ jour: new Date(Date.now() - n * 86400000 * 2).toISOString().slice(0, 10), lieu: LIEUX_DEMO[n % LIEUX_DEMO.length], presence: true }]);
      MON_DJ.confirmes += 1; store.set('djPro', MON_DJ); verifierOfficiel(); renderProfil(); return;
    }
    if (e.target.closest('[data-verif-insta]') && MON_DJ) { MON_DJ.preuveInsta = true; store.set('djPro', MON_DJ); verifierOfficiel(); renderProfil(); return; }
    const fin = e.target.closest('[data-decl-fin]');
    if (fin) { const x = DECLS.find((y) => y.id === fin.dataset.declFin); if (x) { if (x.conf < 2 && MON_DJ) { MON_DJ.expires += 1; store.set('djPro', MON_DJ); } x.fin = Date.now() - 1; sauverDecls(); render(); toast('Set terminé'); } }
  });

  // ---------- Photos des DJ
  // DJ connus : photo libre de droits récupérée sur Wikipédia (licence libre uniquement), mise en cache.
  // On vérifie que la page parle bien d'un DJ ou d'un musicien, pour ne pas prendre un homonyme.
  // DJ inscrits (Live ou Pro) : ils ajoutent leur propre photo depuis leur Espace DJ.
  const PHOTOS_WIKI = (() => { try { return JSON.parse(localStorage.getItem('setly.photosWiki')) || {}; } catch (e) { return {}; } })();
  const sauverPhotosWiki = () => { try { localStorage.setItem('setly.photosWiki', JSON.stringify(PHOTOS_WIKI)); } catch (e) { /* */ } };
  const RE_MUSIQUE = /\b(dj|disc jockey|musician|record producer|producer|singer|rapper|duo|trio|band|group|music|composer|electronic)\b/i;
  const wikiEnCours = {};
  function photoWiki(nom) {
    const k = sansAccent(nom);
    if (k in PHOTOS_WIKI) return Promise.resolve(PHOTOS_WIKI[k]);
    if (wikiEnCours[k]) return wikiEnCours[k];
    const titres = [nom, nom + ' (DJ)', nom + ' (musician)', nom + ' (producer)', nom + ' (band)'];
    const url = 'https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*&redirects=1&prop=pageimages|description&piprop=thumbnail&pithumbsize=360&pilicense=free&titles='
      + encodeURIComponent(titres.join('|'));
    wikiEnCours[k] = fetch(url).then((r) => r.json()).then((j) => {
      const pages = Object.values((j.query && j.query.pages) || {});
      const ok = pages.filter((p) => p.thumbnail && RE_MUSIQUE.test(p.description || ''))
        .sort((a, b) => (/\(dj\)/i.test(b.title) ? 1 : 0) - (/\(dj\)/i.test(a.title) ? 1 : 0))[0];
      PHOTOS_WIKI[k] = ok ? { src: ok.thumbnail.source, page: 'https://en.wikipedia.org/wiki/' + encodeURIComponent(ok.title.replace(/ /g, '_')) } : null;
      sauverPhotosWiki(); return PHOTOS_WIKI[k];
    }).catch(() => null);
    return wikiEnCours[k];
  }
  const initiales = (nom) => String(nom).replace(/[^\p{L}\p{N} ]/gu, ' ').trim().split(/\s+/).slice(0, 2).map((x) => x[0]).join('').toUpperCase() || 'DJ';
  // Avatar : photo du profil DJ si le DJ en a mis une, sinon initiales, remplacées par la photo Wikipédia si elle existe.
  // Photos libres (Wikimedia Commons) rangées dans photos-dj/ : on les cherche par nom, sans accents ni majuscules
  const PHOTOS_IDX = (() => { const m = {}; Object.entries(window.PHOTOS_DJ || {}).forEach(([n, v]) => { m[sansAccent(n)] = v; }); return m; })();
  const photoLibre = (nom) => PHOTOS_IDX[sansAccent(nom)] || null;
  // Avatars illustrés des DJ (Top 100 et autres) : prioritaires sur les photos
  const _avDjIdx = (() => { const m = {}; Object.entries(window.AVATARS_DJ || {}).forEach(([n, f]) => { m[sansAccent(n).replace(/[^a-z0-9]/g, '')] = f; }); return m; })();
  const _cleDj = (nom) => sansAccent(String(nom || '')).replace(/[^a-z0-9]/g, '');
  const avatarIllusDj = (nom) => _avDjIdx[_cleDj(nom)] || '';
  // DJ 101 à 1000 : avatars rangés par 100 dans une planche (10 x 10 cases) pour limiter le nombre de fichiers
  const _avPlIdx = (() => { const m = {}; Object.entries(window.AVATARS_DJ_PLANCHES || {}).forEach(([n, v]) => { m[_cleDj(n)] = v; }); return m; })();
  const fondPlancheDj = (nom) => { const e = _avPlIdx[_cleDj(nom)]; if (!e) return ''; const x = (e[1] % 10) * 100 / 9, y = Math.floor(e[1] / 10) * 100 / 9;
    return `url('avatars-dj-planches/p${e[0] + 1}.jpg') ${x.toFixed(3)}% ${y.toFixed(3)}% / 1000% 1000% no-repeat`; };
  // Fond CSS de l'avatar illustré d'un DJ (fichier seul ou case de planche), '' s'il n'en a pas
  const fondAvatarDj = (nom) => avatarIllusDj(nom) ? `url('${avatarIllusDj(nom)}') center / cover no-repeat` : fondPlancheDj(nom);
  // Épingles GPS illustrées des DJ Pro (visuels fournis par Antonio) : la même tête sur la carte et sur la fiche
  const PINS_DJ = new Set(['nina-sol', 'lia-k', 'lena-brandt', 'eleni-vos', 'zoe-akin', 'marco-vela', 'kenzo-b', 'tomas-reyes', 'ren-okada', 'rafa-lume', 'thabo-nkosi', 'mc-nova', 'kai-rivera', 'dax-volt']);
  // Le DJ Pro choisit son avatar à la création de son profil (pro.pin) ; sinon celui attribué en démo
  const PINS_TOUS = [...PINS_DJ, 'x-libre-1', 'x-libre-2', 'x-libre-3', 'x-libre-4', 'x-libre-5', 'x-trio'];
  const cleePin = (pro) => !pro ? '' : pro.pin && PINS_TOUS.includes(pro.pin) ? pro.pin : PINS_DJ.has(pro.id) ? pro.id : '';
  const pinDj = (pro) => cleePin(pro) ? 'pins-dj/' + cleePin(pro) + '.png' : '';
  // Compteur des Bangers par lieu (part de zéro, +1 à chaque fois qu'un Banger banguérise sur place)
  const BANG_LIEU = store.get('bangLieu', {});
  // Épingles des lieux (visuels fournis par Antonio) : club, pool party, bar, beach club
  const typeLieu = (l) => { if (!l) return 'club'; const t = `${l.nom || ''} ${l.style || ''} ${l.salle || ''}`;
    if (/pool|piscine|destino|o beach|ushua/i.test(t)) return 'pool';
    if (l.type === 'plage' || /beach|plage|playa|chiringuito/i.test(t)) return 'beach';
    if (/\bbar\b|rooftop|lounge|\bpub\b|café|cafe|sunset|cocktail/i.test(t)) return 'bar';
    return 'club'; };
  const pinLieu = (l) => 'pins-lieux/' + typeLieu(l) + '.png';
  const pinSpot = (sp) => pinLieu({ nom: sp.nom || '', style: sp.type === 'plage' ? 'beach' : sp.type === 'bateau' ? 'beach' : sp.type || '' });
  const iconeLieu = (l, on, eteint) => L.divIcon({ className: 'pin-lieu' + (on ? ' on' : '') + (eteint ? ' eteint' : ''), iconSize: [44, 48], iconAnchor: [22, 47], html: `<img src="${pinLieu(l)}" alt="">` });
  // Spot signalé sans DJ connu : l'épingle violette « DJ inconnu » (visuel fourni par Antonio), sur les cartes et dans les bandeaux
  const PIN_INCONNU = 'pins-dj/spot-inconnu.png';
  const djInconnu = (sp) => !!sp && (!String(sp.dj || '').trim() || /inconnu|^\s*dj local\b|^\s*\?+\s*$/i.test(sp.dj));
  const visSpot = (sp) => djInconnu(sp) ? `<img class="fil-vis fil-pin fil-inconnu" src="${PIN_INCONNU}" alt="">` : '';
  // Visuel du DJ dans le bandeau qui défile : son épingle s'il est DJ Pro, sinon sa tête en rond
  // Dans le bandeau : la photo de sa fiche, avec son casque et le nombre de Bangers qui le banguent
  // L'épingle GPS verte du bandeau = le compteur des Bangers sur place qui confirment (image figée : pour confirmer, c'est le bouton BANGER du bas)
  // (le casque reste réservé à la fiche DJ : là, on bangue la qualité du set ; ici c'est une épingle GPS verte)
  const casqueConf = (n, act) => `<span class="fil-casque fil-gps${n ? ' on' : ''}" aria-label="${n} Bangers sur place confirment"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7z" fill="#3DF28A" stroke="#0A0D16" stroke-width="1.6"/><circle cx="12" cy="9" r="2.6" fill="#0A0D16"/></svg><b>${n || 0}</b></span>`;
  const visFil = (nom, n, act) => `<span class="fil-vis fil-dj"><span class="fil-rond">${avatarDj(nom)}</span>${casqueConf(n, act)}</span>`;
  // Info de lieu dans les bandeaux : nom, type, distance ; adresse et horaires d'ouverture à compléter plus tard
  const filClub = (l, kmTxt) => { const ty = typeLieu(l), lib = { club: 'Club', pool: 'Pool party', bar: 'Bar', beach: 'Beach club' }[ty];
    return `<button class="fil-item k-club a-vis" data-lieu="${l.id}"><span class="fil-vis fil-dj fil-pinbox"><img class="fil-pin fil-lieu" src="${pinLieu(l)}" alt="">${casqueConf(BANG_LIEU[l.id] || 0)}</span><span class="fil-l1"><em class="fil-tag club">${lib}</em><b>${esc(l.nom)}</b><span class="fil-t">${esc(l.horaires || 'Horaires à venir')}</span></span><span class="fil-l2"><span>${esc(l.adresse || 'Adresse à venir')}</span>${kmTxt ? `<span>${kmTxt}</span>` : ''}${l.style ? `<span>${esc(String(l.style).split(/[,·:]/)[0].trim())}</span>` : ''}</span></button>`; };
  const visSpotC = (sp) => djInconnu(sp) ? `<span class="fil-vis fil-dj fil-pinbox"><img class="fil-pin fil-inconnu" src="${PIN_INCONNU}" alt="">${casqueConf(sp.conf || 0, `data-spot-ok="${sp.id}"`)}</span>` : visFil(sp.dj, sp.conf || 0, `data-spot-ok="${sp.id}"`);
  const avPinDj = (pro) => cleePin(pro) ? 'pins-dj/' + cleePin(pro) + '-av.jpg' : '';
  function avatarDj(nom, cls) {
    const ill = avatarIllusDj(nom);
    const apn = avPinDj(djProParNom(nom));
    if (!ill && apn) return `<img class="avatar av-dj-illus ${cls || ''}" src="${apn}" alt="${esc(nom)}" loading="lazy">`;
    if (ill) return `<img class="avatar av-dj-illus ${cls || ''}" src="${ill}" alt="${esc(nom)}" loading="lazy">`;
    const fpl = fondPlancheDj(nom);
    if (fpl) return `<span class="avatar av-dj-illus ${cls || ''}" role="img" aria-label="${esc(nom)}" style="background:${fpl}"></span>`;
    const pro = djProParNom(nom);
    if (pro && pro.photo) return `<img class="avatar ${cls || ''}" src="${pro.photo}" alt="${esc(nom)}">`;
    const pl = photoLibre(nom);
    // Si les photos ont été envoyées à la racine (sans le dossier photos-dj), on les cherche aussi là
    if (pl) return `<img class="avatar ${cls || ''}" src="${pl.f}" alt="${esc(nom)}" loading="lazy" onerror="if(!this.dataset.r){this.dataset.r=1;this.src=this.src.replace('/photos-dj/','/');}">`;
    return `<span class="avatar ${cls || ''}" data-avatar="${esc(nom)}" aria-hidden="true">${esc(initiales(nom))}</span>`;
  }
  function remplirAvatars(racine) {
    (racine || document).querySelectorAll('[data-avatar]').forEach((el) => {
      const nom = el.dataset.avatar; el.removeAttribute('data-avatar');
      photoWiki(nom).then((ph) => {
        if (!ph || !el.isConnected) return;
        const img = document.createElement('img'); img.className = el.className; img.alt = nom; img.src = ph.src; img.loading = 'lazy';
        img.onerror = () => img.replaceWith(el);
        el.replaceWith(img);
        const credit = document.querySelector(`[data-credit-photo="${CSS.escape(nom)}"]`);
        if (credit) { credit.innerHTML = `Photo : <a href="${ph.page}" target="_blank" rel="noopener">Wikipédia</a>, licence libre`; credit.hidden = false; }
      });
    });
  }
  // Photo choisie par le DJ : redimensionnée à 400 px pour rester légère
  function lirePhoto(fichier, cb) {
    if (!fichier || !/^image\//.test(fichier.type)) return cb(null);
    const r = new FileReader();
    r.onload = () => {
      const img = new Image();
      img.onload = () => {
        const t = 400, c = document.createElement('canvas'), s = Math.min(img.width, img.height);
        c.width = t; c.height = t;
        c.getContext('2d').drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, t, t);
        cb(c.toDataURL('image/jpeg', 0.82));
      };
      img.onerror = () => cb(null);
      img.src = r.result;
    };
    r.readAsDataURL(fichier);
  }
  document.addEventListener('change', (e) => {
    if (!e.target.classList.contains("photo-dj-input") || !MON_DJ) return;
    lirePhoto(e.target.files[0], (data) => {
      if (!data) { toast('Choisis une image (JPG ou PNG)'); return; }
      MON_DJ.photo = data;
      try { store.set('djPro', MON_DJ); toast('Photo enregistrée'); } catch (err) { toast('Photo trop lourde'); }
      renderProfil();
    });
  });

  // ---------- Commentaires sur les fiches DJ (stars, pros, amateurs)
  // Tout le monde avec un profil peut commenter, répondre et aimer. Un DJ inscrit peut publier « en tant que DJ » :
  // son nom porte alors le badge DJ et renvoie vers sa fiche, pour que les DJ échangent entre eux.
  // Démo : les commentaires restent dans ce navigateur. Dans l'appli : modération et signalement des abus.
  const COM_DEMO = () => {
    const h = (n) => Date.now() - n * 3600000;
    return {
      'marco carola': [
        { id: 'c1', auteur: 'luna_ibz', texte: 'Le closing de Music On à Pacha cette année, irréel. 6 h de set sans baisser une seconde.', t: h(30), likes: 14, reponses: [
          { id: 'c1r1', auteur: 'Nina Sol', dj: true, texte: 'J\'y étais derrière les platines du warm-up, l\'énergie de la salle était folle. Respect Maestro.', t: h(26), likes: 9 }] },
        { id: 'c2', auteur: 'marcB_', texte: 'Quelqu\'un sait à quelle heure il passe vendredi ?', t: h(5), likes: 2, reponses: [
          { id: 'c2r1', auteur: 'nightowl_ibz', texte: 'Normalement vers 2 h, regarde la fiche Pacha le soir même, c\'est confirmé en direct.', t: h(4), likes: 3 }] }
      ],
      'nina sol': [
        { id: 'c3', auteur: 'sofi.dance', texte: 'Découverte au sunset du port, quelle pépite. Vivement la prochaine date !', t: h(48), likes: 21, reponses: [
          { id: 'c3r1', auteur: 'Nina Sol', dj: true, texte: 'Merci 🙏 je suis à Lío jeudi prochain, je vous attends !', t: h(40), likes: 12 }] },
        { id: 'c4', auteur: 'Kenzo B', dj: true, texte: 'Gros set l\'autre soir, on organise un b2b à Toulon cet hiver ?', t: h(12), likes: 6, reponses: [] }
      ],
      'kenzo b': [
        { id: 'c5', auteur: 'toulon_by_night', texte: 'Le meilleur DJ tech house du port, on a dansé jusqu\'à la fermeture.', t: h(20), likes: 8, reponses: [] }
      ]
    };
  };
  const COMS = (() => { const perso = store.get('commentaires', {}); const demo = COM_DEMO(); Object.keys(perso).forEach((k) => { demo[k] = (demo[k] || []).concat(perso[k]); }); return demo; })();
  const sauverComs = () => {
    const perso = {};
    Object.keys(COMS).forEach((k) => { const mes = COMS[k].filter((c) => c.mien || (c.reponses || []).some((r) => r.mien)); if (mes.length) perso[k] = mes; });
    store.set('commentaires', perso);
  };
  state.mesLikes = store.get('mesLikes', {});
  state.repondreA = null;
  const trouverCom = (k, id) => { for (const c of COMS[k] || []) { if (c.id === id) return c; for (const r of c.reponses || []) if (r.id === id) return r; } return null; };
  function ligneCom(k, c, reponse) {
    const aime = !!state.mesLikes[c.id];
    const auteur = c.dj ? `<span class="lien-dj-txt" data-dj-lien="${esc(c.auteur)}">${esc(c.auteur)}</span> <span class="badge b-dj">DJ</span>` : `<b>${esc(c.auteur)}</b> <span class="badge b-spotter">Banger</span>`;
    return `<div class="com ${reponse ? 'reponse' : ''}">
      ${c.dj ? avatarDj(c.auteur, 'petit') : `<span class="avatar petit membre">${esc(initiales(c.auteur))}</span>`}
      <div class="com-corps">
        <div class="com-tete">${auteur}<small>${ilYa(c.t)}</small></div>
        <p class="com-texte">${esc(c.texte)}</p>
        <div class="com-actions">
          <button class="com-btn ${aime ? 'on' : ''}" data-com-like="${c.id}" aria-pressed="${aime}">♥ ${c.likes + (aime ? 1 : 0)}</button>
          ${reponse ? '' : `<button class="com-btn" data-com-rep="${c.id}">Répondre</button>`}
          ${c.mien ? '' : `<button class="com-btn discret" data-com-signal="${c.id}">Signaler</button>`}
        </div>
        ${!reponse && state.repondreA === c.id ? formCom(k, c.id) : ''}
      </div></div>`;
  }
  function formCom(k, parent) {
    if (!state.profil) return `<div class="com-connexion"><span>Crée ton profil pour commenter et échanger avec les DJ.</span><button class="alerte" data-tab="profil">Créer mon profil</button></div>`;
    return `<form class="form-com" data-com-cle="${esc(k)}" ${parent ? `data-com-parent="${parent}"` : ''} novalidate>
      <textarea class="search" name="texte" maxlength="280" rows="2" placeholder="${parent ? 'Ta réponse…' : 'Ton commentaire sur ce DJ, un set, une soirée…'}"></textarea>
      <div class="form-com-bas">
        ${MON_DJ ? `<label class="com-en-dj"><input type="checkbox" name="enDj" checked> En tant que DJ ${esc(MON_DJ.nom)}</label>` : `<small>Publié en tant que ${esc(state.profil.pseudo)}</small>`}
        <button type="submit" class="btn-plein petit">${parent ? 'Répondre' : 'Publier'}</button>
      </div>
    </form>`;
  }
  function blocCommentaires(nom) {
    const k = sansAccent(nom), cs = (COMS[k] || []).filter((c) => !c.masque).sort((a, b) => b.t - a.t);
    const n = cs.reduce((a, c) => a + 1 + (c.reponses || []).filter((r) => !r.masque).length, 0);
    return `<div class="section-title">Commentaires <small>${n ? n + ' message' + (n > 1 ? 's' : '') : 'sois le premier'}</small></div>
      ${formCom(k, null)}
      <div class="coms">${cs.map((c) => ligneCom(k, c, false) + (c.reponses || []).filter((r) => !r.masque).map((r) => ligneCom(k, r, true)).join('')).join('')}</div>
      <p class="aide">Reste respectueux : les messages signalés sont vérifiés par la modération.</p>`;
  }
  document.addEventListener('submit', (e) => {
    if (!e.target.matches('.form-com')) return;
    e.preventDefault();
    const f = new FormData(e.target), texte = String(f.get('texte') || '').trim();
    if (texte.length < 2) return;
    const k = e.target.dataset.comCle, parent = e.target.dataset.comParent;
    const enDj = MON_DJ && f.get('enDj');
    const c = { id: 'm' + Date.now(), auteur: enDj ? MON_DJ.nom : state.profil.pseudo, dj: !!enDj, texte, t: Date.now(), likes: 0, mien: true, reponses: [] };
    if (parent) { const p = trouverCom(k, parent); if (p) { delete c.reponses; p.reponses = (p.reponses || []).concat([c]); } }
    else COMS[k] = (COMS[k] || []).concat([c]);
    state.repondreA = null; sauverComs(); renderDj(); toast(parent ? 'Réponse publiée' : 'Commentaire publié');
  });
  document.addEventListener('click', (e) => {
    if (!state.djOuvert) return;
    if (e.target.closest('.com-connexion [data-tab]')) { fermerDj(); return; }
    const k = sansAccent(state.djOuvert);
    const lk = e.target.closest('[data-com-like]');
    if (lk) { const id = lk.dataset.comLike; if (state.mesLikes[id]) delete state.mesLikes[id]; else state.mesLikes[id] = 1; store.set('mesLikes', state.mesLikes); renderDj(); return; }
    const rp = e.target.closest('[data-com-rep]');
    if (rp) { state.repondreA = state.repondreA === rp.dataset.comRep ? null : rp.dataset.comRep; renderDj(); setTimeout(() => { const t = document.querySelector(`[data-com-parent="${rp.dataset.comRep}"] textarea`); if (t) t.focus(); }, 0); return; }
    const sg = e.target.closest('[data-com-signal]');
    if (sg) { const c = trouverCom(k, sg.dataset.comSignal); if (c) c.masque = true; renderDj(); toast('Merci, la modération va vérifier ce message'); }
  });

  // ---------- Langue : choix au démarrage (écran de compte) et à tout moment dans le profil
  const selectLangue = () => `<select class="langue-select" data-langue-select="1" aria-label="${T('langue')}">${LANGUES.map((x) => `<option value="${x.id}" ${x.id === LANG ? 'selected' : ''}>${x.nom}</option>`).join('')}</select>`;
  function applyLangue() {
    const L = LANGUES.find((x) => x.id === LANG) || {};
    document.documentElement.lang = LANG;
    document.documentElement.dir = L.rtl ? 'rtl' : 'ltr';
    document.querySelectorAll('.tab[data-tab]').forEach((b) => { const t = b.lastChild; if (t && t.nodeType === 3) t.textContent = T('tab_' + b.dataset.tab); });
    const lib = { carte: 'carte', lieux: 'lieux' };
    document.querySelectorAll('[data-vue-carte].seg').forEach((b) => { b.textContent = T(lib[b.dataset.vueCarte]); });
    document.querySelectorAll('[data-fond].seg').forEach((b) => { b.textContent = T(b.dataset.fond); });
  }
  function choisirLangue(id, silencieux) {
    if (!I18N[id]) return;
    LANG = id; store.set('langue', id);
    if (state.profil) { state.profil.langue = id; store.set('profil', state.profil); }
    applyLangue();
    if (!silencieux) render();
  }
  document.addEventListener('change', (e) => { if (e.target.matches('[data-langue-select]')) choisirLangue(e.target.value); });

  // ---------- Rendu général
  function renderClock() {
    // Ibiza : l'heure de la démo (programme rejoué). Ailleurs : l'heure locale de la destination,
    // même si l'utilisateur regarde depuis chez lui avant de partir.
    $('#recherche-dj').placeholder = T('recherche');
    $('#clock').textContent = state.dest === 'ibiza' ? fmt(state.t) : heureLocale(DEST[state.dest].tz);
    $('#clock-date').textContent = state.dest === 'ibiza' ? 'Démo · 1er oct.'
      : DEST[state.dest].local ? 'Heure locale' : T('heure_locale') + ' · ' + labelMois(DEST[state.dest].mois[MOIS_NOW]);
    majModeUI();
  }
  // ---------- Accueil façon SoundCloud : la page défile de haut en bas, chaque rubrique de gauche à droite
  state.vueAcc = 'accueil';
  function majChipsAcc() {
    const pt = $('#chip-pourtoi'), di = $('#chip-direct');
    if (pt) pt.classList.toggle('on', state.vueAcc === 'accueil');
    if (di) { di.classList.toggle('on', state.vueAcc !== 'accueil' && state.mode !== 'geo'); di.textContent = 'En direct · ' + (state.mode === 'geo' ? 'Ibiza' : DEST[state.dest].nom); }
    if (typeof majAutour === 'function') majAutour();
  }
  document.addEventListener('click', (e) => {
    const c = e.target.closest('[data-acc]'); if (!c) return;
    state.vueAcc = c.dataset.acc; store.set('vueAcc', state.vueAcc);
    if (state.vueAcc === 'liste' && state.mode === 'geo') choisirDestMonde('ibiza');
    setTab('live');
  });
  document.addEventListener('click', (e) => { if (e.target.closest('[data-acc-agenda]')) setTab('agenda'); });
  const ACC_TEINTES = [['#FF8A3D', '#7A1E4F'], ['#3DD6C6', '#1B2A6B'], ['#A77BFF', '#2A1052'], ['#FF4FA3', '#3B0A2A'], ['#3D8BFF', '#0A1F4A'], ['#F2C53A', '#5A2A06'], ['#3DF28A', '#0B3A3A']];
  const accGrad = (nom) => { const t = ACC_TEINTES[[...String(nom)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7) % ACC_TEINTES.length]; return `linear-gradient(145deg, ${t[0]}, ${t[1]})`; };
  const ACC_ANNEAUX = '<svg class="acc-anneaux" viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="50" fill="none" stroke="#fff" stroke-width="8" stroke-dasharray="220 45"/><circle cx="60" cy="60" r="30" fill="none" stroke="#fff" stroke-width="8" stroke-dasharray="130 34"/><circle cx="60" cy="60" r="11" fill="#fff"/></svg>';
  const accInit = (n) => String(n).replace(/[^A-Za-zÀ-ÿ0-9 &]/g, '').split(/\s+/).filter(Boolean).slice(0, 2).map((m) => m[0]).join('').toUpperCase();
  const ACC_NIV = [['vert', T('pop0')], ['or', T('pop1')], ['rouge', T('pop2')], ['noir', T('pop3')]];
  const COUL_DEST = { ibiza: ['#FF8A3D', '#6A1838'], mykonos: ['#3D8BFF', '#0B1E52'], tulum: ['#3DF28A', '#0B3A3A'], miami: ['#FF4FA3', '#3B0A4A'], dubai: ['#F2C53A', '#5A2A06'] };
  // Compte à rebours jusqu'aux openings de la prochaine saison (dates estimées d'après les saisons précédentes)
  const OPENINGS = {
    ibiza: [['2026-04-24', '2026-10-12'], ['2027-04-23', '2027-10-11']],
    mykonos: [['2026-05-29', '2026-10-04'], ['2027-05-28', '2027-10-03']],
    tulum: [['2025-12-15', '2026-04-30'], ['2026-12-15', '2027-04-30']],
    miami: [['2025-11-06', '2026-05-15'], ['2026-11-06', '2027-05-15']],
    dubai: [['2025-10-03', '2026-04-30'], ['2026-10-02', '2027-04-30']]
  };
  function etatOpening(id, maintenant) {
    const t = maintenant || Date.now();
    for (const [deb, fin] of OPENINGS[id] || []) {
      const d = new Date(deb + 'T22:00:00').getTime(), f = new Date(fin + 'T23:59:00').getTime();
      if (t < d) return { avant: true, ms: d - t };
      if (t <= f) return { avant: false };
    }
    return null;
  }
  function texteOpening(id) {
    const e = etatOpening(id); if (!e) return '';
    if (!e.avant) return '<b class="en-saison">En saison</b>';
    const j = Math.floor(e.ms / 86400000), h = Math.floor(e.ms % 86400000 / 3600000), m = Math.floor(e.ms % 3600000 / 60000);
    return `Openings dans <b>${j} j ${String(h).padStart(2, '0')} h ${String(m).padStart(2, '0')}</b>`;
  }
  const compteurOpening = (id, monde) => OPENINGS[id] ? `<span class="acc-bande"><span class="acc-compteur" data-compteur="${id}">${texteOpening(id)}</span>${monde || ''}</span>` : (monde || '');
  setInterval(() => document.querySelectorAll('[data-compteur]').forEach((el) => { const t = texteOpening(el.dataset.compteur); if (el.innerHTML !== t) el.innerHTML = t; }), 20000);
  function accCarte(o) {
    return `<button class="acc-carte ${o.cls || ''}" ${o.attr || ''}><span class="acc-art" style="--g:${o.g || accGrad(o.titre)}">${ACC_ANNEAUX}${o.badge || ''}<span class="acc-grand">${o.grand != null ? o.grand : esc(accInit(o.titre))}</span></span><b>${esc(o.titre)}</b><span class="acc-s">${esc(o.sous)}</span></button>`;
  }
  // 5 cartes par rangée, puis une 6e carte « Tout voir »
  const accRubrique = (titre, sous, cartes, voir, max) => {
    if (!cartes.length) return '';
    const cinq = cartes.slice(0, max || 5), reste = cartes.length - cinq.length;
    const tv = voir ? `<button class="acc-carte acc-toutvoir" ${voir}><span class="acc-art"><span class="tv-rond"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg></span><span class="tv-txt">Tout voir${reste > 0 ? `<small>+${reste}</small>` : ''}</span></span></button>` : '';
    return `<section class="acc-rub"><div class="acc-tete"><div><h2>${titre}</h2>${sous ? `<small>${sous}</small>` : ''}</div></div><div class="acc-rang">${cinq.join('')}${tv}</div></section>`;
  };
  // DJ live : petite carte « lecteur » (image figée du set, Play, vinyle qui tourne, style en couleur)
  const COUL_GENRE = { 'House': '#FF8A3D', 'Deep house': '#3DD6C6', 'Tech house': '#F2C53A', 'Techno': '#A77BFF', 'Minimal': '#8A9BFF', 'Afro house': '#3FBF7F',
    'Melodic': '#FF4FA3', 'Amapiano': '#F2B53A', 'Rap': '#E5484D', 'Électro': '#3D8BFF' };
  const genreDe = (d) => (d.styles && d.styles[0]) || 'House';
  const coulGenre = (g) => COUL_GENRE[g] || '#3D8BFF';
  function carteLecteur(d, prevu) {
    const g = genreDe(d), c = coulGenre(g), st = d.stream || {};
    return `<button class="lecteur" data-dj-pro="${esc(d.nom)}" style="--gc:${c}">
      <span class="lect-image${d.photo ? ' photo' : ''}"${d.photo ? ` style="--photo:url('${d.photo}')"` : ''}>
        ${prevu ? `<span class="lect-live prevu">À ${hm(st.depuis)}</span>` : '<span class="lect-live"><i></i>Live<span class="lect-eq"><b></b><b></b><b></b></span></span>'}
        <span class="lect-vues" title="personnes à l'écoute"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 14v-2a8 8 0 0 1 16 0v2"/><rect x="3" y="14" width="4" height="6" rx="1.5"/><rect x="17" y="14" width="4" height="6" rx="1.5"/></svg>${(st.vues || 0).toLocaleString('fr-FR')}</span>
        <span class="lect-play"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></span>
        <span class="lect-vinyle"><span>${d.photo ? `<img src="${d.photo}" alt="">` : esc(accInit(d.nom))}</span></span>
      </span>
      <span class="lect-genre">${esc(g)}</span>
      <b class="lect-nom">${esc(d.nom)}</b>
      <small class="lect-titre">${esc(d.pays || '')} ${esc(st.titre || d.ville || '')}</small>
    </button>`;
  }
  document.addEventListener('click', (e) => { const b = e.target.closest('[data-genre-live]'); if (!b) return; e.stopPropagation(); state.genreLive = b.dataset.genreLive || null; renderAccueil(); if (state.djLiveOuvert) renderDjLive(); });

  // Légende « autour de moi » : on passe le doigt (ou la souris) sur un point, la bulle explique ce qu'il veut dire
  const bulleLegende = (it) => { const box = it && it.closest('.aut-legende'); if (!box) return; const b = box.querySelector('.lg-bulle');
    box.querySelectorAll('.lg-item').forEach((x) => x.classList.toggle('on', x === it)); b.textContent = it.dataset.lgInfo; b.classList.add('vu');
    clearTimeout(bulleLegende.t); bulleLegende.t = setTimeout(() => { b.classList.remove('vu'); box.querySelectorAll('.lg-item').forEach((x) => x.classList.remove('on')); }, 2600); };
  document.addEventListener('pointerover', (e) => { const it = e.target.closest && e.target.closest('.lg-item'); if (it) bulleLegende(it); });
  document.addEventListener('touchmove', (e) => { const t = e.touches[0]; const el = t && document.elementFromPoint(t.clientX, t.clientY); const it = el && el.closest('.lg-item'); if (it) bulleLegende(it); }, { passive: true });
  document.addEventListener('click', (e) => { const it = e.target.closest('.lg-item'); if (it) bulleLegende(it); });

  // Tuiles « autour de moi » : on cherche la plus grande taille de carré qui fait tenir toutes les tuiles dans la zone
  function tailleZoneAutour() {
    const z = $('#aut-zone'); if (!z) return; const n = z.children.length; if (!n) return;
    const W = z.clientWidth, H = parseFloat(getComputedStyle(z).getPropertyValue('--zone-h')) || 240, g = 6;
    let best = 0, bc = 1;
    for (let c = 1; c <= n; c++) { const r = Math.ceil(n / c); const s = Math.min((W - (c - 1) * g) / c, (H - (r - 1) * g) / r); if (s > best) { best = s; bc = c; } }
    const s = Math.floor(Math.min(best, 112));
    z.style.setProperty('--s', s + 'px'); z.style.setProperty('--cols', bc);
    z.dataset.taille = s >= 96 ? 'l' : s >= 70 ? 'm' : s >= 48 ? 's' : 'xs';
  }
  window.addEventListener('resize', tailleZoneAutour);

  // Mini-carte : le doigt (ou la souris) passe sur un point → encart avec tout ce qu'on sait ; on touche l'encart pour ouvrir la fiche
  function bulleMiniCarte(x, y, colle) {
    const box = document.querySelector('[data-mm] .mm-art'); if (!box) return;
    const r = box.getBoundingClientRect(); if (x < r.left || x > r.right || y < r.top || y > r.bottom) return;
    let best = null, bd = 30;
    box.querySelectorAll('.mm-pt').forEach((c) => { const b = c.getBoundingClientRect(), d = Math.hypot(b.left + b.width / 2 - x, b.top + b.height / 2 - y); if (d < bd) { bd = d; best = c; } });
    if (!best) return;
    const info = (window.__MM_INFOS || [])[+best.dataset.i]; if (!info) return;
    // Plus d'encart sur la carte : c'est le bandeau qui défile en dessous qui se cale sur l'info du point
    if (window.__filCibler) window.__filCibler(info.attr);
    box.querySelectorAll('.mm-pt.on').forEach((c) => c.classList.remove('on')); best.parentNode.appendChild(best); best.classList.add('on');
    clearTimeout(window.__mmZoomT); window.__mmZoomT = setTimeout(() => best.classList.remove('on'), 2600);
    return;
    const bulle = box.querySelector('.mm-bulle');
    if (bulle.dataset.i !== best.dataset.i) { bulle.dataset.i = best.dataset.i; bulle.className = 'mm-bulle enc-' + info.k; bulle.innerHTML = info.html; bulle.dataset.ouvre = info.attr; }
    bulle.hidden = false;
    const b = best.getBoundingClientRect(), px = b.left + b.width / 2 - r.left, py = b.top + b.height / 2 - r.top;
    const w = bulle.offsetWidth, h = bulle.offsetHeight;
    // l'encart se met du côté opposé au point, pour ne jamais le cacher
    bulle.style.left = (px < r.width / 2 ? Math.min(r.width - w - 6, px + 18) : Math.max(6, px - w - 18)) + 'px';
    bulle.style.top = Math.max(6, Math.min(r.height - h - 6, py - h / 2)) + 'px';
    bulle.dataset.t = Date.now();
    { const inf = (window.__MM_INFOS || [])[+best.dataset.i]; if (inf && window.__filCibler) window.__filCibler(inf.attr); }
    box.querySelectorAll('.mm-pt.on').forEach((c) => c.classList.remove('on')); best.classList.add('on');
  }
  document.addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse') bulleMiniCarte(e.clientX, e.clientY); });
  document.addEventListener('touchstart', (e) => { const t = e.touches[0]; if (t && e.target.closest('[data-mm]')) bulleMiniCarte(t.clientX, t.clientY, true); }, { passive: true });
  document.addEventListener('touchmove', (e) => { const t = e.touches[0]; if (t && e.target.closest('[data-mm]')) bulleMiniCarte(t.clientX, t.clientY, true); }, { passive: true });
  document.addEventListener('click', (e) => {
    const bu = e.target.closest('.mm-bulle'); if (bu && Date.now() - (+bu.dataset.t || 0) < 450) return; if (bu) { const m = (bu.dataset.ouvre || '').match(/data-([a-z-]+)="([^"]*)"/); if (m) { const f = document.createElement('button'); f.setAttribute('data-' + m[1], m[2].replace(/&quot;/g, '"').replace(/&amp;/g, '&')); f.hidden = true; document.body.appendChild(f); f.click(); f.remove(); } return; }
    if (e.target.closest('[data-mm]') && !e.target.closest('[data-tab]')) bulleMiniCarte(e.clientX, e.clientY, true);
  });

  // Bandeau d'infos qui défile : s'arrête quand on passe dessus, un tap l'arrête (un 2e tap sur l'info arrêtée ouvre sa fiche), un double tap passe à l'info suivante
  const FIL = { x: 0, pause: false, survol: false, cible: null, dernier: 0, tapT: 0, tapTimer: null };
  function filPiste() { const p = [...document.querySelectorAll('.fil-piste')].find((x) => x.offsetParent) || null; if (p !== FIL.el) { FIL.el = p; FIL.x = 0; FIL.cible = null; FIL.pause = false; } return p; }
  function filItemsVus(p) { return [...p.querySelectorAll('.fil-item')]; }
  function filTick(ts) {
    const dt = FIL.dernier ? Math.min(64, ts - FIL.dernier) : 16; FIL.dernier = ts;
    const p = filPiste();
    if (p && p.offsetParent) {
      const moitie = p.scrollWidth / 2;
      if (FIL.cible != null) { const d = FIL.cible - FIL.x; FIL.x += Math.abs(d) < 1 ? d : d * Math.min(1, dt / 90); if (Math.abs(d) < 1) FIL.cible = null; }
      else if (FIL.bloque && Date.now() > FIL.bloque) { FIL.bloque = 0; p.querySelectorAll('.fil-item.cible').forEach((x) => x.classList.remove('cible')); }
      else if (!FIL.bloque) FIL.x += dt * 0.045;
      if (moitie > 0 && FIL.x >= moitie) { FIL.x -= moitie; if (FIL.cible != null) FIL.cible -= moitie; }
      p.style.transform = `translateX(${-FIL.x}px)`;
    }
    requestAnimationFrame(filTick);
  }
  requestAnimationFrame(filTick);
  // Le bandeau défile tout le temps. Seul le doigt sur un point de la mini-carte le bloque sur l'info de ce lieu,
  // 5 secondes, ou jusqu'à un petit glissé de gauche à droite sur le bandeau
  function filCibler(attr) {
    const p = filPiste(); if (!p || !attr) return false;
    const m = attr.match(/data-([a-z-]+)="([^"]*)"/); if (!m) return false;
    const v = m[2].replace(/&quot;/g, '"').replace(/&amp;/g, '&');
    const its = filItemsVus(p).filter((it) => it.getAttribute('data-' + m[1]) === v); if (!its.length) return false;
    const moitie = p.scrollWidth / 2, xs = its.map((it) => it.offsetLeft - 8).filter((l) => l < moitie + 1);
    const cible = xs.length ? xs[0] : its[0].offsetLeft - 8;
    p.querySelectorAll('.fil-item.cible').forEach((x) => x.classList.remove('cible')); its.forEach((it) => it.classList.add('cible'));
    FIL.cible = cible; FIL.bloque = Date.now() + 5000; return true;
  }
  // Le doigt sur un repère de la grande carte le grossit un instant, pour bien voir le dessin
  function zoomRepere(m) { const el = m.getElement && m.getElement(); if (!el) return; document.querySelectorAll('.leaflet-marker-icon.zoom').forEach((x) => x !== el && x.classList.remove('zoom')); el.classList.add('zoom'); clearTimeout(el.__zt); el.__zt = setTimeout(() => el.classList.remove('zoom'), 2600); }
  window.__zoomRepere = zoomRepere;
  // Grande carte : si le lieu a son info dans le bandeau, toucher le repère cale le bandeau dessus (pas de bulle)
  function lierBandeau(m, attr) {
    const p = document.querySelector('#map-cartes .fil-piste'); if (!p || !attr) return m;
    const mm = attr.match(/data-([a-z-]+)="([^"]*)"/); if (!mm) return m;
    if (!filItemsVus(p).some((it) => it.getAttribute('data-' + mm[1]) === mm[2])) return m;
    m.unbindPopup(); m.off('mouseover'); m.on('click mouseover', () => { filCibler(attr); zoomRepere(m); }); return m;
  }
  window.__filCibler = filCibler;
  let filX0 = null;
  document.addEventListener('touchstart', (e) => { filX0 = e.target.closest('.fil-infos') && e.touches[0] ? e.touches[0].clientX : null; }, { passive: true });
  document.addEventListener('touchmove', (e) => { if (filX0 == null || !e.touches[0]) return; if (e.touches[0].clientX - filX0 > 30 && FIL.bloque) { FIL.bloque = 0; document.querySelectorAll('.fil-item.cible').forEach((x) => x.classList.remove('cible')); filX0 = null; } }, { passive: true });
  document.addEventListener('click', (e) => {
    const zone = e.target.closest('.fil-infos'); if (!zone) return;
    e.stopImmediatePropagation(); e.preventDefault();
    const it = e.target.closest('.fil-item');

    // Toucher une info ouvre sa fiche ; le bandeau, lui, ne s'arrête pas
    const ouvre = it && [...it.attributes].find((x) => /^data-(lieu|dj-pro|spot-voir)$/.test(x.name));
    if (ouvre) { const f = document.createElement('button'); f.setAttribute(ouvre.name, ouvre.value); f.hidden = true; document.body.appendChild(f); f.click(); f.remove(); }
  }, true);
  const toastFil2 = (m) => toast(m);
  let filToastT = 0; const toastFil = (m) => { if (Date.now() - filToastT > 4000) { filToastT = Date.now(); toast(m); } };

  // ---- Essai (prototype) : bannières « carte satellite de jour » et « Check-in » à la place de la mini-carte de l'accueil
  const BC_COTE = "M633.3 -9.8 L633.3 264.4 L633.3 264.4 L633.3 167.8 L610.5 170.6 L580.5 170.6 L562.5 131.0 L520.5 121.0 L466.5 124.4 L424.5 101.2 L430.5 87.9 L430.5 71.5 L436.5 61.5 L406.5 61.5 L382.5 64.8 L334.5 87.9 L358.5 97.9 L382.5 141.0 L412.5 150.8 L454.5 167.4 L436.5 183.9 L394.5 180.6 L346.5 180.6 L328.5 187.2 L292.5 236.8 L232.5 217.0 L184.5 187.2 L172.5 167.4 L202.5 147.5 L232.5 127.7 L220.5 114.4 L202.5 104.6 L172.5 97.9 L166.5 81.5 L160.5 68.1 L136.5 64.8 L100.5 64.8 L28.5 35.1 L10.5 -7.8 L8.7 -9.8 Z";
  const BC_PTS = [["dj", "nina-sol", 420.0, 86.2, "live"], ["dj", "kenzo-b", 430.0, 96.0, "live"], ["dj", "marco-vela", 446.7, 113.6, "decl"], ["dj", "lia-k", 348.3, 166.5, "live"], ["dj", "dax-volt", 550.8, 77.2, "decl"], ["lieu", "beach", 458.3, 121.4, ""], ["lieu", "beach", 340.0, 176.2, ""], ["lieu", "beach", 566.7, 137.1, ""], ["lieu", "pool", 500.0, 127.3, ""], ["lieu", "bar", 406.7, 80.3, ""], ["lieu", "bar", 375.0, 103.8, ""], ["lieu", "club", 441.7, 72.5, ""], ["lieu", "club", 300.0, 58.8, ""], ["spot", "", 440.0, 105.8, ""], ["spot", "", 416.7, 150.8, ""]];
  function bannieresDirect() {
    const img = (k, n) => k === 'dj' ? `pins-dj/${n}.png` : k === 'spot' ? PIN_INCONNU : `pins-lieux/${n}.png`;
    const halo = { live: '#F2C53A', decl: '#FF8A3D', '': '#3DD6C6' };
    const pins = BC_PTS.slice().sort((p, q) => p[3] - q[3]).map(([k, n, x, y, s], i) => `${k === 'dj' && s === 'live' ? `<circle class="bc-onde" cx="${x}" cy="${y}" r="14" fill="none" stroke="${halo[s]}" stroke-width="2" style="animation-delay:${(i % 5) * .35}s"/>` : ''}<ellipse cx="${x}" cy="${y}" rx="8" ry="2.6" fill="${k === 'spot' ? '#B58CFF' : halo[s] || '#3DD6C6'}" opacity=".7"/><image href="${img(k, n)}" x="${x - 15}" y="${y - 33}" width="30" height="33"/>`).join('');
    // Carte façon jeu vidéo néon, aux couleurs de Banzic : bleu nuit, routes et côte turquoise / violet / orange
    const carte = `<svg class="bc-svg" viewBox="0 0 600 235" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <radialGradient id="bc-mer" cx="70%" cy="80%" r="90%"><stop offset="0" stop-color="#14205A"/><stop offset="1" stop-color="#070B22"/></radialGradient>
        <pattern id="bc-grille" width="22" height="22" patternUnits="userSpaceOnUse"><path d="M22 0H0V22" fill="none" stroke="#3DD6C6" stroke-opacity=".07" stroke-width="1"/></pattern>
        <pattern id="bc-ilots" width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(18)"><rect x="2" y="2" width="9" height="9" rx="1.5" fill="#1C1F4A"/></pattern>
        <filter id="bc-neon" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        <clipPath id="bc-clip"><path d="${BC_COTE}"/></clipPath>
      </defs>
      <rect width="600" height="235" fill="url(#bc-mer)"/><rect width="600" height="235" fill="url(#bc-grille)"/>
      <path d="${BC_COTE}" fill="#10132E"/>
      <g clip-path="url(#bc-clip)"><rect width="600" height="235" fill="url(#bc-ilots)"/>
        <g fill="none" stroke-linecap="round" filter="url(#bc-neon)">
          <path d="M40 40 Q200 80 340 58 T620 72" stroke="#FF4FA3" stroke-width="2.6"/>
          <path d="M120 0 Q260 90 430 30 T600 20" stroke="#B58CFF" stroke-width="1.8"/>
          <path d="M380 0 L420 120 L470 235" stroke="#FF8A3D" stroke-width="2"/>
          <path d="M240 235 Q300 120 380 95" stroke="#3DD6C6" stroke-width="1.4" stroke-opacity=".8"/></g></g>
      <path d="${BC_COTE}" fill="none" stroke="#3DD6C6" stroke-width="2.2" filter="url(#bc-neon)" stroke-opacity=".9"/>
      ${pins}</svg>`;
    // Check-in : les vraies lignes de la page Check-in (mêmes bandes, mêmes couleurs), qui défilent
    let rows = []; try { rows = renderCheckin(true) || []; } catch (e) { rows = []; }
    rows = rows.map((r) => r.replace(/<button /g, '<span ').replace(/<\/button>/g, '</span>').replace(/data-(lieu|dj-pro|spot-voir)=/g, 'data-x-$1='));
    const lignes = rows.concat(rows).join('');
    return `<button class="ag-banniere bc-banniere" data-tab="map" aria-label="Ouvrir la carte : ce qui se passe autour de toi">${carte}
        <span class="bc-badge"><i></i>Samedi 15 août · 16:00</span>
        <span class="ag-txt bc-txt"><small class="ag-kick bc-kick"><span class="ico-diffusion" aria-hidden="true"><i></i><b></b><b></b></span>${esc(state.zoneGeo.nom)}</small><b class="ag-titre">Direct<br>autour de moi</b><span class="ag-sous">Toute la journée sur la carte : DJ en live, beach clubs, bars</span></span></button>
      <button class="ag-banniere bk-banniere" data-tab="checkin" aria-label="Ouvrir le Check-in : les départs de la journée">
        <span class="ag-txt bk-txt"><small class="ag-kick">Check-in</small><b class="ag-titre">Les départs<br>du jour</b><span class="ag-sous">${rows.length} départs autour de toi, rangés par distance</span></span>
        <span class="bk-tableau"><span class="bk-horloge">${flap(hm(Date.now()), 5)}</span><span class="bk-piste" style="--duree:${Math.max(10, rows.length * 3.2)}s">${lignes}</span></span></button>`;
  }

  function renderAccueil() {
    if (state.pageMontent) { renderPageMontent(); return; }
    if (state.pageTendance) { renderPageTendance(); return; }
    const t = state.t, auj = iso(new Date());
    let h = '';
    // 1. En direct autour de moi : DJ déclarés près de ma position, spots signalés, puis les clubs du coin
    const centre0 = DEST.local.centre, km = (la, lo) => distKm(centre0, [la, lo]);
    const decls = DECLS.filter((x) => x.dest === 'local' && declActive(x) && djDe(x)).map((x) => ({ x, l: lieuDe(x) })).filter((o) => o.l && (o.l.lat == null || km(o.l.lat, o.l.lng) <= 60));
    const spotsP = SPOTS.filter((sp) => spotPublic(sp) && sp.lat != null && km(sp.lat, sp.lng) <= 60);
    const coin = Object.values(LIEUX_DEST).filter((l) => l.dest === 'local').map((l) => ({ l, d: km(l.lat, l.lng) })).filter((o) => o.d <= 60).sort((a, b) => a.d - b.d);
    // Les cartes affichent le lieu répertorié en titre, et le DJ qui y joue en dessous
    // Couleurs de la légende : live (or), déclaré (orange), spot signalé (violet), club (turquoise)
    const COUL_AUTOUR = { live: ['#F2C53A', '#7A5A10'], decl: ['#FF8A3D', '#7A2E10'], spot: ['#B58CFF', '#3E2A7A'], club: ['#3DD6C6', '#0E4A52'] };
    const gAut = (k) => `linear-gradient(145deg, ${COUL_AUTOUR[k][0]}, ${COUL_AUTOUR[k][1]})`;
    // Cartes « autour de moi » : petit carré avec un dessin explicite (un DJ aux platines, un spot signalé), aux couleurs de la légende
    const DESSIN_DJ = (c) => `<svg class="aut-dessin" viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="17" r="8" fill="#0A0D16"/><path d="M22 17a10 10 0 0 1 20 0" fill="none" stroke="#0A0D16" stroke-width="3"/><rect x="19" y="15" width="5" height="8" rx="2" fill="#0A0D16"/><rect x="40" y="15" width="5" height="8" rx="2" fill="#0A0D16"/><path d="M20 40c2-9 7-13 12-13s10 4 12 13" fill="#0A0D16"/><path d="M14 33l6 7M50 33l-6 7" stroke="#0A0D16" stroke-width="3.5" stroke-linecap="round"/><rect x="6" y="40" width="52" height="16" rx="3" fill="#0A0D16"/><circle cx="20" cy="48" r="5.5" fill="${c}"/><circle cx="44" cy="48" r="5.5" fill="${c}"/><circle cx="20" cy="48" r="1.6" fill="#0A0D16"/><circle cx="44" cy="48" r="1.6" fill="#0A0D16"/><path d="M2 12q3 -4 0 -8M58 10q4 -5 0 -10M62 14q3 -4 0 -8" fill="none" stroke="#0A0D16" stroke-width="2" stroke-linecap="round" opacity=".7"/></svg>`;
    const DESSIN_SPOT = `<svg class="aut-dessin" viewBox="0 0 64 64" aria-hidden="true"><path d="M32 6c-10 0-18 8-18 18 0 13 18 32 18 32s18-19 18-32c0-10-8-18-18-18z" fill="#0A0D16"/><path d="M24 26l9-6v14l-9-6z" fill="#B58CFF"/><rect x="20" y="22" width="5" height="8" rx="1" fill="#B58CFF"/><path d="M37 21q4 5 0 10M40 18q7 8 0 16" fill="none" stroke="#B58CFF" stroke-width="2" stroke-linecap="round"/></svg>`;
    const DESSIN_CLUB = `<svg class="aut-dessin" viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="22" fill="#0A0D16"/><circle cx="32" cy="32" r="14" fill="none" stroke="#3DD6C6" stroke-width="1.5" opacity=".6"/><circle cx="32" cy="32" r="8" fill="none" stroke="#3DD6C6" stroke-width="1.5" opacity=".6"/><circle cx="32" cy="32" r="3" fill="#3DD6C6"/><path d="M46 14l6-6" stroke="#0A0D16" stroke-width="3" stroke-linecap="round"/></svg>`;
    const ilYa = (ms) => { const m = Math.max(1, Math.round((Date.now() - ms) / 60000)); return m < 60 ? `il y a ${m} min` : `il y a ${Math.floor(m / 60)} h`; };
    // Tuiles « autour de moi » : tout dans le carré (état, dessin, nom, heure). Triées par distance ; ce qui est fini disparaît
    // (déclarations terminées, spots expirés). Plus il y a de soirées, plus les tuiles rétrécissent pour tenir dans la zone.
    const kmDe = (la, lo) => la == null ? 99 : km(la, lo);
    // Encart qui s'ouvre quand on passe le doigt sur un point de la mini-carte : tout ce qu'on sait du lieu
    const vautLeCoup = (sp) => { const n = sp.note || 0, c = sp.conf || 0; return n >= 4 && c >= 3 ? ['Ça vaut le coup', 'top'] : n >= 3 || c >= 2 ? ['Sympa', 'bien'] : ['À vérifier', 'bof']; };
    const fmtKm = (d) => d < 1 ? '< 1 km' : Math.round(d) + ' km';
    const encart = (o) => ({ k: o.k, attr: o.attr, html: `<span class="enc-art enc-${o.k}">${o.dessin}</span><span class="enc-txt"><span class="enc-etat enc-${o.k}"><i></i>${o.etat}</span><b>${esc(o.t)}</b><span class="enc-heure">${o.heure}</span><small>${o.s}</small>${o.plus || ''}<span class="enc-voir">Voir la fiche →</span></span>` });
    const infos = decls.filter((o) => o.l).map(({ x, l }) => { const d = djDe(x), k = declConfirmee(x) ? 'live' : 'decl', dist = kmDe(l.lat, l.lng);
        return encart({ k, attr: x.lieu ? `data-lieu="${x.lieu}"` : `data-dj-pro="${esc(d.nom)}"`, dessin: DESSIN_DJ(k === 'live' ? '#F2C53A' : '#FF8A3D'), etat: k === 'live' ? 'DJ en live' : 'DJ déclaré',
          heure: `${hm(x.debut)} → ${hm(x.fin)}`, t: d.nom, s: `${esc(l.nom)} · ${fmtKm(dist)}`, plus: `<small>${k === 'live' ? x.conf + ' Bangers confirment' : 'Pas encore confirmé par les Bangers'}</small>` }); })
      .concat(spotsP.map((sp) => { const dist = kmDe(sp.lat, sp.lng), v = vautLeCoup(sp); return encart({ k: 'spot', attr: `data-spot-voir="${sp.id}"`, dessin: DESSIN_SPOT, etat: 'Spot signalé', heure: `Signalé à ${hm(sp.t)}`,
        t: sp.nom || TYPES_SPOT[sp.type], s: `${esc(sp.dj || 'DJ inconnu')} · ${fmtKm(dist)}`, plus: `<small>par <b>@${esc(sp.par || 'un Banger')}</b> · ${sp.conf} confirment${sp.note ? ' · ' + '★'.repeat(sp.note) : ''}</small><span class="enc-vaut ${v[1]}">${v[0]}</span>` }); }))
      .concat(coin.slice(0, 14).map(({ l, d }) => encart({ k: 'club', attr: `data-lieu="${l.id}"`, dessin: DESSIN_CLUB, etat: 'Club du coin', heure: 'DJ à confirmer', t: l.nom, s: `${esc((l.style || 'Club').split(/[,·:]/)[0].trim())} · ${fmtKm(d)}` })));
    const lgItem = (k, nom, info) => `<button type="button" class="lg-item" data-lg-info="${info}"><i class="lg ${k}"></i>${nom}</button>`;
    const legende = `<div class="aut-legende" aria-label="Légende de la carte">${lgItem('moi', 'Toi', 'Ta position')}${lgItem('live', 'Live', 'DJ en live, confirmé par les Bangers')}${lgItem('decl', 'Déclaré', 'DJ déclaré, pas encore confirmé')}${lgItem('spot', 'Spot', 'Spot signalé par un Banger : bar, plage, bateau…')}${lgItem('club', 'Club', 'Club du coin, DJ à confirmer')}<span class="lg-bulle" aria-live="polite"></span></div>`;
    // Fil d'actualité qui défile sous la carte : les DJ qui jouent (où, à combien de km, combien de temps il reste, confirmés ou non) puis les spots signalés
    const resteJeu = (fin) => { const m = Math.round((fin - Date.now()) / 60000); if (m <= 0) return 'se termine'; return 'encore ' + (m >= 60 ? Math.floor(m / 60) + ' h' + (m % 60 ? String(m % 60).padStart(2, '0') : '') : m + ' min'); };
    const avant = (deb) => { const m = Math.round((deb - Date.now()) / 60000); return m > 0 ? 'commence dans ' + (m >= 60 ? Math.floor(m / 60) + ' h' + (m % 60 ? String(m % 60).padStart(2, '0') : '') : m + ' min') : null; };
    const filItems = decls.filter((o) => o.l).map(({ x, l }) => ({ x, l, dist: kmDe(l.lat, l.lng) })).sort((a, b) => a.dist - b.dist).map(({ x, l, dist }) => { const d = djDe(x), k = declConfirmee(x) ? 'live' : 'decl';
        return `<button class="fil-item k-${k} a-vis" ${x.lieu ? `data-lieu="${x.lieu}"` : `data-dj-pro="${esc(d.nom)}"`}>${visFil(d.nom, x.conf || 0, `data-decl-ok="${x.id}"`)}<span class="fil-l1"><em class="fil-tag ${k}">${k === 'live' ? 'Live' : 'Déclaré'}</em><b>${esc(d.nom)}</b><span class="fil-t">${avant(x.debut) || resteJeu(x.fin)}</span></span><span class="fil-l2"><span>${esc(l.nom)} · ${fmtKm(dist)}</span><span class="${k === 'live' ? 'fil-ok' : 'fil-att'}">${k === 'live' ? x.conf + ' Banger' + (x.conf > 1 ? 's' : '') + ' confirment' : 'pas encore confirmé'}</span></span></button>`; })
      .concat(spotsP.map((sp) => ({ sp, dist: kmDe(sp.lat, sp.lng) })).sort((a, b) => a.dist - b.dist).map(({ sp, dist }) => { const v = vautLeCoup(sp);
        return `<button class="fil-item k-spot a-vis" data-spot-voir="${sp.id}">${visSpotC(sp)}<span class="fil-l1"><em class="fil-tag spot">Spot</em><b>${esc(sp.nom || TYPES_SPOT[sp.type])}</b><span class="fil-vaut v-${v[1]}">${v[0]}</span></span><span class="fil-l2"><span>${esc(sp.dj || 'DJ inconnu')} · ${fmtKm(dist)}</span><span>signalé à ${hm(sp.t)} par @${esc(sp.par || 'un Banger')}</span></span></button>`; }));
    coin.slice(0, 14).forEach(({ l, d }) => filItems.push(filClub(l, fmtKm(d))));
    const filInfos = filItems.length ? `<div class="fil-infos" aria-label="Fil d'actualité autour de moi"><div class="fil-fenetre"><div class="fil-piste">${filItems.join('<span class="fil-sep" aria-hidden="true"></span>')}<span class="fil-sep" aria-hidden="true"></span><span class="fil-copie" aria-hidden="true">${filItems.join('<span class="fil-sep"></span>')}<span class="fil-sep"></span></span></div></div></div>` : '';
    const essaiB = document.documentElement.classList.contains('essai-bannieres');
    h += `<section class="acc-rub">${essaiB ? '' : `<div class="acc-tete"><div><h2 class="h-direct"><span class="ico-diffusion" aria-hidden="true"><i></i><b></b><b></b></span>Direct autour de moi</h2><small>${esc(state.zoneGeo.nom)}${state.zoneGeo.approx ? ' · position de démo' : ''} · passe le doigt sur un point</small></div></div>`}
      ${essaiB ? bannieresDirect() : `<div class="aut-carte">${carteMiniMap(centre0, decls, spotsP, coin, infos)}</div>${legende}${filInfos}`}</section>`;
    // 1 bis. Agenda autour de moi : de petites cartes par type de sortie, avec le nombre de dates dans le rayon de l'Agenda
    const rayonAg = RAYONS[state.rayonIdx], dansRayon = soireesAvecKm().filter((x) => x.km <= rayonAg);
    const nbType = (k) => k === 'tout' ? dansRayon.length : dansRayon.filter((x) => (x.type || 'club') === k).length;
    const TYPES_AG = [['tout', 'Agenda', '✦', '#C9CFDD'], ['club', 'Club', '🪩', '#3D8BFF'], ['festival', 'Festival', '🎪', '#FF8A3D'], ['concert', 'Concert', '🎤', '#F2C53A'], ['bar', 'Bar', '🍸', '#A77BFF'], ['resto', 'Restaurant', '🍽️', '#3DF28A']];
    // Agenda autour de moi : la bannière « L'agenda » (visuel fourni par Antonio, textes dans la police de l'appli).
    // Un appui ouvre l'Agenda, où l'on choisit Club, Festival, Concert…
    h += `<section class="acc-rub ag-rub"><button class="ag-banniere" data-ag-type="tout" aria-label="Voir l'agenda : clubs, concerts et festivals">
        <img src="agenda-banniere.jpg?v=2" alt="" loading="lazy">
        <span class="ag-txt"><small class="ag-kick">Tes prochaines sorties</small><b class="ag-titre">L'agenda</b><span class="ag-sous">Clubs, concerts &amp; festivals</span>
          <span class="ag-compte">${nbType('tout')} dates à moins de ${rayonAg} km · ${esc(state.zoneGeo.nom)}</span></span></button></section>`;
    // 2. Les saisons
    // En saison d'abord, puis les autres dans l'ordre du compte à rebours (la plus proche en premier)
    const rangOpening = (id) => { const e = etatOpening(id); return !e ? 9e15 : e.avant ? e.ms : -1; };
    h += accRubrique('Les saisons', 'En saison d\'abord, puis les prochaines openings', DESTS.filter((d) => !d.local).sort((a, b) => rangOpening(a.id) - rangOpening(b.id)).map((d) => { const n = d.mois[MOIS_NOW], c = COUL_DEST[d.id] || ['#3D8BFF', '#0A1F4A'];
      // Une image de fond par destination quand on en a une (Ibiza : visuel fourni par Antonio, démo)
      const fond = ({ ibiza: 'ibiza-carte.jpg?v=3', mykonos: 'mykonos-carte.jpg?v=3', tulum: 'tulum-carte.jpg?v=3', miami: 'miami-carte.jpg?v=3', dubai: 'dubai-carte.jpg?v=3' })[d.id];
      return accCarte({ cls: 'large' + (fond ? ' avec-photo' : ''), titre: d.nom + ' saison', sous: d.saison, grand: fond ? '' : (DRAPEAUX[d.id] || '') + ' ' + esc(d.nom), g: fond ? `url('${fond}') center center / cover no-repeat, linear-gradient(145deg, ${c[0]}, ${c[1]})` : `linear-gradient(145deg, ${c[0]}, ${c[1]})`, attr: `data-dest-puce="${d.id}"`,
        badge: compteurOpening(d.id, n < 0 ? `<span class="acc-badge hors">${T('hors')}</span>` : `<span class="acc-badge ${ACC_NIV[n][0]}">${ACC_NIV[n][1]}</span>`) }); }));
    // 3. DJ live dans le monde
    const lives = streamsActifs(), genres = [...new Set(lives.map(genreDe))];
    if (state.genreLive && !genres.includes(state.genreLive)) state.genreLive = null;
    const puces = `<div class="genre-puces">${['', ...genres].map((g) => `<button class="genre-puce${(state.genreLive || '') === g ? ' on' : ''}" data-genre-live="${esc(g)}" style="--gc:${g ? coulGenre(g) : '#C9CFDD'}">${g ? esc(g) : 'Tous'}</button>`).join('')}</div>`;
    // Bannière « Les DJ en live » (visuel fourni par Antonio, textes dans la police de l'appli) : un appui ouvre tous les lives disponibles
    h += `<section class="acc-rub ag-rub"><button class="ag-banniere live-banniere" data-live-tous="1" aria-label="Les DJ en live : écouter un live">
        <img src="live-banniere.jpg?v=3" alt="" loading="lazy">
        <span class="ag-txt"><small class="ag-kick lv-kick"><i></i>En direct</small><b class="ag-titre">Les DJ<br>en live</b><span class="ag-sous">Leurs sets, où que tu sois.</span>
          <span class="ag-compte">${lives.length} DJ en live en ce moment</span></span></button></section>`;
    // La rubrique « DJ live dans le monde » (titre, styles, lecteurs) est retirée de l'accueil : la bannière ci-dessus ouvre tous les lives
    // 4. Classement DJ Mag Top 100 2026, du 1er au 100e (à la place des clubs d'Ibiza)
    const TOP = window.DJMAG2026; let secTop = '';
    if (TOP) {
      const MOUV = { '+': ['monte', '▲'], '-': ['descend', '▼'], '=': ['stable', '='], N: ['nouveau', 'Nouveau'], R: ['retour', 'Retour'] };
      const top = TOP.djs.map(([nom, mv], i) => `<button class="top-carte${i < 3 ? ' podium p' + (i + 1) : ''}" data-dj-pro="${esc(nom)}" style="--g:${accGrad(nom)}">
        <span class="top-vinyle"><span class="top-tete">${avatarDj(nom, 'top-photo')}</span><span class="top-rang">${i + 1}</span></span>
        <b class="top-nom">${esc(nom)}</b><small class="top-mv ${MOUV[mv][0]}">${MOUV[mv][1]}</small></button>`);
      h += '@@TOP100@@'; secTop = `<section class="acc-rub"><div class="acc-tete"><div><h2>DJ Top 100 · 2026</h2><small>Le classement complet, du 1er au 100e · annoncé le 7 octobre à [UNVRS] Ibiza</small></div></div><div class="acc-rang top-rangee">${top.join('')}</div></section>`;
    }
    // 5. La tendance du moment : les sets les mieux notés par les Bangers en ce moment et ce soir, puis les lives les plus écoutés
    const tAvis = (p) => { const r = { top: 0, bien: 0, bof: 0, ...(p.avis || {}) }; return { top: r.top, total: r.top + r.bien + r.bof }; };
    const chauds = passages.filter((p) => !p.inconnu && p.f > t && tAvis(p).total > 0).sort((x, y) => tAvis(y).top - tAvis(x).top || x.d - y.d).slice(0, 8);
    const tend = chauds.map((p) => { const l = lieux[p.lieu], a = tAvis(p), pl = photoLibre(decouperDjs(p.dj)[0] || p.dj), enCours = t >= p.d;
      return vCarte({ attr: `data-lieu="${p.lieu}"`, c: enCours ? '#FF3D5A' : '#FF8A3D', img: pl ? pl.f : imgLieu(l), badge: enCours ? '<i></i>Live' : 'À ' + p.debut,
        type: esc(l.nom), nom: esc(p.dj), lieu: esc(p.salle || ''), bas: [`${a.top} Banger${a.top > 1 ? 's' : ''} disent Top`, `${Math.round(a.top / a.total * 100)} % de Top`] }); })
      .concat(streamsActifs().slice(0, 3).map((d) => vCarte({ attr: `data-dj-pro="${esc(d.nom)}"`, c: coulGenre(genreDe(d)), img: d.photo || '', badge: '<i></i>Live en ligne', type: esc(genreDe(d)), nom: esc(d.nom), lieu: esc(d.ville || ''), bas: [(d.stream.vues || 0).toLocaleString('fr-FR') + ' à l\'écoute'] })));
    // Bannière « La tendance du moment » (visuel fourni par Antonio, textes dans la police de l'appli) : ouvre la page des tendances
    h += `<section class="acc-rub ag-rub"><button class="ag-banniere td-banniere" data-page-tendance="1" aria-label="La tendance du moment : explorer les tendances">
        <img src="tendance-banniere.jpg?v=1" alt="" loading="lazy">
        <span class="ag-txt"><small class="ag-kick">${tend.length} en ce moment</small><b class="ag-titre">La tendance<br>du moment</b><span class="ag-sous">Les coups de cœur des Bangers</span></span></button></section>`;
    // 6. Les DJ qui montent : plus fortes progressions du Top 100 2026, puis les nouvelles entrées
    const MONTEES = [['John Summit', 22], ['Mau P', 22], ['CHRIS STASSY', 22], ['GORDO', 18], ['Fred again..', 17], ['The Martinez Brothers', 15], ['Korolova', 14], ['Solomun', 14], ['Miss Monique', 14], ['B Jones', 14], ['Michael Bibi', 11], ['Indira Paganotto', 10], ['Mochakk', 10], ['Anyma', 7]];
    window.__MONTEES = MONTEES;
    // Bannière « Les DJ qui montent » (visuel fourni par Antonio, textes dans la police de l'appli) : un appui ouvre la page de tous les DJ qui montent
    const secMonte = `<section class="acc-rub ag-rub"><button class="ag-banniere mt-banniere" data-page-montent="1" aria-label="Les DJ qui montent : découvre la nouvelle vague">
        <img src="montent-banniere.jpg?v=1" alt="" loading="lazy">
        <span class="ag-txt"><small class="ag-kick">Top 100 · 2026</small><b class="ag-titre">Les DJ<br>qui montent</b><span class="ag-sous">Découvre la nouvelle vague</span></span></button></section>`;
    // « Les DJ qui montent » prend la place du Top 100, qui descend en dernier
    h = h.includes('@@TOP100@@') ? h.replace('@@TOP100@@', secMonte) + secTop : h + secMonte;
    $('#accueil').innerHTML = bandeauMesDj() + h;
    // Photos des DJ du Top 100 : chargées au fur et à mesure qu'on fait défiler la rangée
    const vus = new IntersectionObserver((es) => es.forEach((en) => { if (en.isIntersecting) { vus.unobserve(en.target); remplirAvatars(en.target); } }), { rootMargin: '0px 300px' });
    document.querySelectorAll('#accueil .top-tete').forEach((el) => vus.observe(el));
  }
  // ---- Page « La tendance du moment » : ce que les Bangers adorent, et pourquoi
  state.tdOnglet = 'sets';
  function renderPageTendance() {
    const t = state.t, tAvis = (p) => { const r = { top: 0, bien: 0, bof: 0, ...(p.avis || {}) }; return { ...r, total: r.top + r.bien + r.bof }; };
    const ong = state.tdOnglet;
    const sets = passages.filter((p) => !p.inconnu && p.f > t && tAvis(p).total > 0).sort((x, y) => tAvis(y).top - tAvis(x).top || x.d - y.d);
    const lives = streamsActifs();
    const bangues = DJS_DEMO.concat(MON_DJ ? [MON_DJ] : []).map((d) => d.nom).concat((window.DJMAG2026 ? DJMAG2026.djs.slice(0, 20).map((x) => x[0]) : []))
      .filter((n, i, arr) => arr.indexOf(n) === i).sort((x, y) => nbLikes(y) - nbLikes(x)).slice(0, 20);
    const dur = (m) => m >= 60 ? Math.floor(m / 60) + ' h' + (m % 60 ? String(m % 60).padStart(2, '0') : '') : m + ' min';
    let liste = '', aide = '';
    if (ong === 'sets') {
      aide = 'Les sets en cours ou de ce soir que les Bangers notent le mieux. Le classement suit le nombre de « Top » donnés sur place.';
      liste = sets.map((p, i) => { const l = lieux[p.lieu], a = tAvis(p), pct = Math.round(a.top / a.total * 100), enC = t >= p.d;
        return `<button class="mt-ligne td-ligne" data-lieu="${p.lieu}"><span class="mt-num">${i + 1}</span><span class="mt-av">${avatarDj(decouperDjs(p.dj)[0] || p.dj)}</span>
          <span class="mt-txt"><b>${esc(p.dj)}</b><small>${esc(l.nom)}${p.salle ? ' · ' + esc(p.salle) : ''} · ${enC ? 'encore ' + dur(p.f - t) : 'à ' + p.debut}</small>
          <span class="td-jauge"><i style="width:${pct}%"></i></span><small class="td-pourquoi">${a.top} Banger${a.top > 1 ? 's' : ''} disent Top · ${pct} % de Top sur ${a.total} avis</small></span>
          <span class="mt-badge ${enC ? 'live' : 'monte'}">${enC ? 'LIVE' : p.debut}</span></button>`; }).join('');
    } else if (ong === 'lives') {
      aide = 'Les DJ qui diffusent leur set en direct en ce moment, rangés par nombre de Bangers à l\'écoute.';
      liste = lives.map((d, i) => `<button class="mt-ligne td-ligne" data-dj-pro="${esc(d.nom)}"><span class="mt-num">${i + 1}</span><span class="mt-av">${avatarDj(d.nom)}</span>
          <span class="mt-txt"><b>${esc(d.nom)}</b><small>${esc(d.ville || '')} · ${esc(genreDe(d))} · depuis ${hm(d.stream.depuis)}</small><small class="td-pourquoi">${d.stream.vues || 0} Bangers à l'écoute · ${esc(d.stream.titre || '')}</small></span>
          <span class="mt-badge live">LIVE</span></button>`).join('');
    } else {
      aide = 'Les DJ les plus bangués avec le casque sur leur fiche : la note des Bangers sur la qualité de leurs sets.';
      liste = bangues.map((n, i) => { const pro = djProParNom(n), r = window.DJMAG2026 ? DJMAG2026.djs.findIndex((x) => x[0] === n) + 1 : 0;
        return `<button class="mt-ligne td-ligne" data-dj-pro="${esc(n)}"><span class="mt-num">${i + 1}</span><span class="mt-av">${avatarDj(n)}</span>
          <span class="mt-txt"><b>${esc(n)}</b><small>${r ? r + (r === 1 ? 'er' : 'e') + ' au Top 100' : pro ? 'DJ Pro · ' + esc(pro.ville || '') : ''}${PAYS_DJ[n] ? ' · ' + esc(PAYS_DJ[n]) : ''}</small><small class="td-pourquoi">${fmtLikes(nbLikes(n))} Bangers banguent ses sets</small></span>
          <span class="mt-badge note"><img src="banger-casque.png" alt="">${fmtLikes(nbLikes(n))}</span></button>`; }).join('');
    }
    $('#accueil').innerHTML = `<div class="mt-page"><button class="mt-retour" data-page-retour="1"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>Accueil</button>
      <div class="ag-banniere td-banniere mt-tete"><img src="tendance-banniere.jpg?v=1" alt=""><span class="ag-txt"><small class="ag-kick">Ce soir</small><b class="ag-titre">La tendance<br>du moment</b><span class="ag-sous">Les coups de cœur des Bangers</span></span></div>
      <div class="segs mt-segs">${[['sets', `Sets du moment`], ['lives', `Lives en ligne`], ['bangues', 'Les plus bangués']].map(([k, tt]) => `<button class="seg${k === ong ? ' on' : ''}" data-td-onglet="${k}">${tt}</button>`).join('')}</div>
      <p class="mt-aide">${aide}</p>
      <div class="mt-liste">${liste || '<div class="empty">Rien pour l\'instant, reviens ce soir.</div>'}</div></div>`;
    remplirAvatars($('#accueil'));
    window.scrollTo(0, 0); const sc = document.querySelector('#screen-live'); if (sc) sc.scrollTop = 0;
  }
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-page-tendance]')) { state.pageTendance = true; renderPageTendance(); return; }
    if (e.target.closest('[data-page-retour]')) { state.pageTendance = false; renderAccueil(); return; }
    const o = e.target.closest('[data-td-onglet]'); if (o) { state.tdOnglet = o.dataset.tdOnglet; renderPageTendance(); }
  });
  // ---- Page « Les DJ qui montent » : les progressions, les nouveaux, les mieux notés par les Bangers, avec leur pays
  const PAYS_DJ = {"David Guetta": "France", "Martin Garrix": "Pays-Bas", "Anyma": "Italie", "Alok": "Brésil", "Dimitri Vegas & Like Mike": "Belgique", "Charlotte de Witte": "Belgique", "Armin van Buuren": "Pays-Bas", "Timmy Trumpet": "Australie", "FISHER": "Australie", "Vintage Culture": "Brésil", "Calvin Harris": "Royaume-Uni", "Don Diablo": "Pays-Bas", "Peggy Gou": "Corée du Sud", "Black Coffee": "Afrique du Sud", "Afrojack": "Pays-Bas", "Fred again..": "Royaume-Uni", "Lost Frequencies": "Belgique", "Steve Aoki": "États-Unis", "KSHMR": "États-Unis", "W&W": "Pays-Bas", "Reinier Zonneveld": "Pays-Bas", "Tiësto": "Pays-Bas", "Carl Cox": "Royaume-Uni", "John Summit": "États-Unis", "Skrillex": "États-Unis", "Indira Paganotto": "Espagne", "Nicky Romero": "Pays-Bas", "The Martinez Brothers": "États-Unis", "Hardwell": "Pays-Bas", "Illenium": "États-Unis", "Keinemusik": "Allemagne", "Alan Walker": "Norvège", "Jamie Jones": "Royaume-Uni", "Swedish House Mafia": "Suède", "Paul van Dyk": "Allemagne", "Korolova": "Ukraine", "Michael Bibi": "Royaume-Uni", "Dom Dolla": "Australie", "Oliver Heldens": "Pays-Bas", "Josh Baker": "Royaume-Uni", "Solomun": "Allemagne", "Mahmut Orhan": "Turquie", "Claptone": "Allemagne", "Joel Corry": "Royaume-Uni", "R3hab": "Pays-Bas", "Mochakk": "Brésil", "Amelie Lens": "Belgique", "HUGEL": "France", "Lilly Palmer": "Allemagne", "GORDO": "États-Unis", "James Hype": "Royaume-Uni", "Maddix": "Pays-Bas", "Marshmello": "États-Unis", "Zedd": "Allemagne", "Mau P": "Pays-Bas", "Alesso": "Suède", "Boris Brejcha": "Allemagne", "Bassjackers": "Pays-Bas", "CHRIS STASSY": "Royaume-Uni", "DJ Snake": "France", "Miss Monique": "Ukraine", "Eric Prydz": "Suède", "ATB": "Allemagne", "Sara Landry": "États-Unis", "Kölsch": "Danemark", "Ben Nicky": "Royaume-Uni", "Sub Zero Project": "Pays-Bas", "Joseph Capriati": "Italie", "ARTBAT": "Ukraine", "Vini Vici": "Israël", "Wade": "Espagne", "Nora En Pure": "Suisse", "Shimza": "Afrique du Sud", "Quintino": "Pays-Bas", "Lucas & Steve": "Pays-Bas", "Giuseppe Ottaviani": "Italie", "Padre Guilherme": "Brésil", "Sonny Fodera": "Australie", "Deborah De Luca": "Italie", "Nico Moreno": "France", "Ferry Corsten": "Pays-Bas", "Cloonee": "Royaume-Uni", "Mosimann": "France", "PAWSA": "Royaume-Uni", "Above & Beyond": "Royaume-Uni", "Marnik": "Inde", "The Chainsmokers": "États-Unis", "Plastik Funk": "Allemagne", "Deadmau5": "Canada", "MATTN": "Belgique", "Nils van Zandt": "Pays-Bas", "Prospa": "Royaume-Uni", "¥ØU$UK€ ¥UK1MAT$U": "Japon", "Cuebrick": "Pays-Bas", "Marlon Hoffstadt": "Allemagne", "Honey Dijon": "États-Unis", "DubVision": "Pays-Bas", "KI/KI": "Pays-Bas"};
  state.mtOnglet = 'montent';
  function renderPageMontent() {
    const TOP = window.DJMAG2026; if (!TOP) return;
    const rang = (n) => TOP.djs.findIndex((x) => x[0] === n) + 1, mvDe = (n) => (TOP.djs.find((x) => x[0] === n) || [])[1];
    const MV = { '+': ['En hausse', 'monte'], '-': ['En baisse', 'descend'], '=': ['Stable', 'stable'], N: ['Nouveau', 'nouveau'], R: ['Retour', 'retour'] };
    const listes = {
      montent: (window.__MONTEES || []).map(([n, k]) => ({ n, badge: '+' + k, cls: 'monte' })),
      nouveaux: TOP.djs.filter((x) => x[1] === 'N' || x[1] === 'R').map(([n, m]) => ({ n, badge: m === 'N' ? 'NEW' : 'RETOUR', cls: 'nouveau' })),
      notes: TOP.djs.map(([n]) => n).sort((x, y) => nbLikes(y) - nbLikes(x)).slice(0, 30).map((n) => ({ n, badge: fmtLikes(nbLikes(n)), cls: 'note' }))
    };
    const ong = state.mtOnglet, L = listes[ong] || [];
    const ligne = (o, i) => { const r = rang(o.n), mv = MV[mvDe(o.n)] || ['', ''], pays = PAYS_DJ[o.n] || '';
      return `<button class="mt-ligne" data-dj-pro="${esc(o.n)}"><span class="mt-num">${i + 1}</span><span class="mt-av">${avatarDj(o.n)}</span>
        <span class="mt-txt"><b>${esc(o.n)}</b><small>${r ? r + (r === 1 ? 'er' : 'e') + ' au Top 100' : ''}${pays ? ' · ' + esc(pays) : ''}${mv[0] && ong !== 'montent' ? ' · ' + mv[0] : ''}</small></span>
        <span class="mt-badge ${o.cls}">${o.cls === 'note' ? `<img src="banger-casque.png" alt="">` : ''}${esc(o.badge)}</span></button>`; };
    $('#accueil').innerHTML = `<div class="mt-page"><button class="mt-retour" data-montent-retour="1"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>Accueil</button>
      <div class="ag-banniere mt-banniere mt-tete"><img src="montent-banniere.jpg?v=1" alt=""><span class="ag-txt"><small class="ag-kick">Top 100 · 2026</small><b class="ag-titre">Les DJ<br>qui montent</b><span class="ag-sous">Découvre la nouvelle vague</span></span></div>
      <div class="segs mt-segs">${[['montent', 'Ceux qui montent'], ['nouveaux', 'Les nouveaux'], ['notes', 'Les mieux notés']].map(([k, t]) => `<button class="seg${k === ong ? ' on' : ''}" data-mt-onglet="${k}">${t}</button>`).join('')}</div>
      <p class="mt-aide">${ong === 'montent' ? 'Les plus fortes progressions du classement DJ Mag 2026.' : ong === 'nouveaux' ? 'Les nouvelles entrées et les retours dans le Top 100 2026.' : 'Les DJ du Top 100 les plus bangués par les Bangers sur leur fiche.'}</p>
      <div class="mt-liste">${L.map(ligne).join('')}</div></div>`;
    remplirAvatars($('#accueil'));
    window.scrollTo(0, 0); const sc = document.querySelector('#screen-live'); if (sc) sc.scrollTop = 0;
  }
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-page-montent]')) { state.pageMontent = true; renderPageMontent(); return; }
    if (e.target.closest('[data-montent-retour]')) { state.pageMontent = false; renderAccueil(); return; }
    const o = e.target.closest('[data-mt-onglet]'); if (o) { state.mtOnglet = o.dataset.mtOnglet; renderPageMontent(); }
  });
  // Bandeau « Mes DJ » en tête de l'accueil (remplace la rangée de filtres)
  function bandeauMesDj() {
    const fav = state.favs || [], ce = fav.filter((n) => passages.some((p) => p.dj === n && !p.inconnu && p.f > state.t));
    // Les DJ Pro / Premium suivis qui sont en live (stream ou déclarés) passent devant et tournent comme un vinyle
    const enLiveMd = (n) => { const pro = djProParNom(n); return !!pro && (enStream(pro) || DECLS.some((x) => x.dj === pro.id && declActive(x))); };
    const ordre = fav.slice().sort((x, y) => (enLiveMd(y) ? 1 : 0) - (enLiveMd(x) ? 1 : 0));
    const avs = ordre.slice(0, 4).map((n, i) => { const live = enLiveMd(n), ap = avPinDj(djProParNom(n)), g = fondAvatarDj(n) || (ap ? `url('${ap}') center / cover` : '');
      return `<span class="md-av${live ? ' md-live' : ''}" style="--g:${g || accGrad(n)};z-index:${9 - i}" title="${esc(n)}${live ? ' · en live' : ''}">${g ? '' : esc(accInit(n))}</span>`; }).join('');
    const sous = !fav.length ? 'Touche le ♥ sur la fiche d\'un DJ pour le suivre ici'
      : `${fav.length} DJ suivi${fav.length > 1 ? 's' : ''}${fav.filter(enLiveMd).length ? ` · ${fav.filter(enLiveMd).length} en live` : ''}${ce.length ? ` · ${ce.length} joue${ce.length > 1 ? 'nt' : ''} ce soir` : ''}`;
    const fond = state.profil && !state.profil.photo ? 'avatars-banzic/' + avIllus(state.profil.avatar) + '-c.jpg' : '';
    const coeur = `<span class="md-coeur" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 20s-7-4.4-9-9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c-2 4.6-9 9-9 9z"/></svg></span>`;
    const fleche = `<svg class="md-fl" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>`;
    // Avec l'illustration : la photo en bannière, le bouton « Mes DJ » incrusté à droite, là où regarde le DJ
    if (fond) return `<button class="acc-mesdj md-illus md-fin" data-tab="fav" style="--md-img:url('${fond}')">
      <span class="md-ligne">${coeur}<span class="md-txt"><b>Mes DJ</b><small>${sous}</small></span>${avs ? `<span class="md-avs">${avs}</span>` : ''}${fleche}</span></button>`;
    return `<button class="acc-mesdj" data-tab="fav">${ACC_ANNEAUX}${coeur}
      <span class="md-txt"><b>Mes DJ</b><small>${sous}</small></span>${avs ? `<span class="md-avs">${avs}</span>` : ''}${fleche}</button>`;
  }
  // Première carte de « En direct autour de moi » : une mini-carte dessinée (ma position, les DJ déclarés, les clubs du coin).
  // Dessinée en SVG pour s'afficher partout, même sans fond de carte ; un toucher ouvre la vraie carte.
  function carteMiniMap(c, decls, spots, coin, infos) {
    const W = 420, H = 165, cx = W / 2, cy = H / 2;
    const pts = decls.filter((o) => o.l).map((o, i) => { const t = declConfirmee(o.x) ? 'live' : 'decl', pin = (o.x && o.x.dj && pinDj(djDe(o.x))) || pinLieu(o.l); return o.l.lat != null ? { la: o.l.lat, lo: o.l.lng, t, pin } : { la: c[0] + 0.004 + i * 0.002, lo: c[1] + 0.006, t, pin }; })
      .concat(spots.map((sp) => ({ la: sp.lat, lo: sp.lng, t: 'spot', pin: djInconnu(sp) ? PIN_INCONNU : pinSpot(sp) })))
      .concat(coin.slice(0, 14).map((o) => ({ la: o.l.lat, lo: o.l.lng, t: 'club', pin: pinLieu(o.l) })));
    const xy = (p) => ({ x: (p.lo - c[1]) * Math.cos(c[0] * Math.PI / 180), y: -(p.la - c[0]) });
    const raw = pts.map((p) => ({ ...xy(p), t: p.t, pin: p.pin })), max = Math.max(0.004, ...raw.map((p) => Math.hypot(p.x, p.y)));
    // échelle en racine carrée : les lieux tout proches s'écartent du centre, les lointains restent dans le cadre
    const pos = raw.map((p) => { const d = Math.hypot(p.x, p.y) || 1e-9, r = 18 + 58 * Math.sqrt(d / max); return { x: cx + p.x / d * r * 1.6, y: cy + p.y / d * r, t: p.t, pin: p.pin }; });
    let rues = ''; for (let i = 0; i < 9; i++) { const a = (i * 47 + 13) % 180, r = a * Math.PI / 180, dx = Math.cos(r) * 200, dy = Math.sin(r) * 200, ox = ((i * 37) % 120) - 60, oy = ((i * 53) % 80) - 40;
      rues += `<line x1="${cx + ox - dx}" y1="${cy + oy - dy}" x2="${cx + ox + dx}" y2="${cy + oy + dy}" stroke="#2A3A63" stroke-width="${i % 3 ? 1 : 2.4}"/>`; }
    const nDj = decls.length + spots.length;
    const svg = `<svg class="mm-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect width="${W}" height="${H}" fill="#0C1430"/>${rues}
      <path d="M0 ${H * .78} C ${W * .3} ${H * .7}, ${W * .55} ${H * .95}, ${W} ${H * .82} L ${W} ${H} L 0 ${H} Z" fill="#0A2240" opacity=".9"/>
      ${[28, 50, 72].map((r) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#3DD6C6" stroke-opacity=".18" stroke-dasharray="3 4"/>`).join('')}
      ${pos.map((p, i) => ({ p, i })).sort((u, v) => (u.p.t === 'club' ? 0 : 1) - (v.p.t === 'club' ? 0 : 1)).map(({ p, i }) => { const col = { live: '#F2C53A', decl: '#FF8A3D', spot: '#B58CFF', club: '#3DD6C6' }[p.t];
        return `<ellipse class="mm-pulse mm-${p.t}" cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" rx="${p.t === 'club' ? 6 : 9}" ry="${p.t === 'club' ? 2 : 3}" fill="${col}" opacity="${p.t === 'club' ? .35 : .6}"/><image class="mm-pt mm-pin mm-${p.t}" data-i="${i}" href="${p.pin}" x="${(p.x - 15).toFixed(1)}" y="${(p.y - 32).toFixed(1)}" width="30" height="33"/>`; }).join('')}
      <circle class="mm-pulse" cx="${cx}" cy="${cy}" r="12" fill="#4DA3FF" opacity=".3"/><circle cx="${cx}" cy="${cy}" r="6.5" fill="#4DA3FF" stroke="#fff" stroke-width="2"/></svg>`;
    window.__MM_INFOS = infos || [];
    return `<div class="acc-carte large acc-minimap" data-mm="1"><span class="acc-art mm-art">${svg}<span class="acc-badge"><i></i>${nDj} DJ autour</span><button class="mm-ouvrir" data-tab="map">Ouvrir la carte</button><span class="mm-bulle" hidden></span></span></div>`;
  }

  // L'onglet Accueil ramène toujours à la page d'accueil
  document.addEventListener('click', (e) => { if (e.target.closest('nav [data-tab="live"]')) { state.pageMontent = false; state.pageTendance = false; state.vueAcc = 'accueil'; store.set('vueAcc', 'accueil'); } }, true);
  document.addEventListener('click', (e) => { if (e.target.closest('#acc-voir-live') || e.target.closest('[data-live-tous]')) ouvrirDjLive(); });
  document.addEventListener('click', (e) => {
    const dp = e.target.closest('[data-ag-deplier]'); if (!dp || e.target.closest('[data-ag-type]')) return;
    state.agOuvert = !state.agOuvert; dp.classList.toggle('ouvert', state.agOuvert); dp.setAttribute('aria-expanded', state.agOuvert);
    const rang = dp.parentElement; rang.querySelectorAll('.ag-type').forEach((x, i) => { x.classList.toggle('ag-cache', !state.agOuvert); x.style.animationDelay = (i * 60) + 'ms'; });
  });
  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-ag-type]'); if (!t) return;
    const k = t.dataset.agType;
    if (state.mode !== 'geo') choisirMode('geo');
    state.sudType = ['bar', 'resto'].includes(k) ? 'tout' : k; state.sudQuand = null; state.sudMesDj = false;
    setTab('agenda');
    if (['bar', 'resto'].includes(k)) toast((k === 'bar' ? 'Les bars' : 'Les restaurants') + ' avec DJ arrivent bientôt dans l\'Agenda');
  });
  document.addEventListener('click', (e) => { if (!e.target.closest('[data-acc-autour]')) return; state.vueAcc = 'liste'; if (state.mode !== 'geo') choisirMode('geo'); setTab('live'); });
  // À la souris (ordinateur), on attrape une rangée et on la fait glisser comme au doigt
  (function () {
    let r = null, x0 = 0, s0 = 0, bouge = false;
    document.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') return; const g = e.target.closest('.acc-rang'); if (!g) return; r = g; x0 = e.clientX; s0 = g.scrollLeft; bouge = false; });
    document.addEventListener('pointermove', (e) => { if (!r) return; const dx = e.clientX - x0; if (Math.abs(dx) > 5) { bouge = true; r.classList.add('glisse'); } if (bouge) r.scrollLeft = s0 - dx; });
    const fin = () => { if (!r) return; const g = r; r = null; if (bouge) setTimeout(() => g.classList.remove('glisse'), 0); };
    document.addEventListener('pointerup', fin); document.addEventListener('pointercancel', fin);
  })();

  // ---------- En-tête : rond avec la photo de profil (sinon l'initiale), loupe qui ouvre la recherche
  function majEnteteMoi() {
    const b = $('#ent-moi'); if (!b) return;
    const ph = (state.profil && (state.profil.photo || 'avatars-banzic/' + avIllus(state.profil.avatar) + '.jpg')) || (MON_DJ && MON_DJ.photo);
    const nom = (state.profil && (state.profil.pseudo || state.profil.prenom)) || (MON_DJ && MON_DJ.nom) || '';
    const html = ph ? `<img src="${ph}" alt="">` : nom.trim() ? `<span>${esc(nom.trim()[0].toUpperCase())}</span>` : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg>';
    if (b._h !== html) { b._h = html; b.innerHTML = html; }
    b.classList.toggle('vide', !ph);
  }
  document.addEventListener('click', (e) => {
    if (e.target.closest('#ent-moi')) { setTab('profil'); return; }
    const l = e.target.closest('#tab-cherche'); if (!l) return;
    const top = document.querySelector('.top'), ouvert = !top.classList.contains('cherche');
    top.classList.toggle('cherche', ouvert); l.classList.toggle('on', ouvert); l.setAttribute('aria-expanded', ouvert);
    if (ouvert) setTimeout(() => { const i = $('#recherche-dj'); if (i) i.focus(); }, 30); else { $('#recherche-dj').value = ''; $('#suggestions-dj').hidden = true; }
  });

  // ---------- Cloche (notifications) et bulle (messages), façon SoundCloud. Démo : contenus d'exemple.
  const NOTIFS = [
    { ico: '🔴', txt: '<b>Nina Sol</b> est en live depuis la terrasse du port', quand: 'il y a 5 min', dj: 'Nina Sol' },
    { ico: '🎧', txt: '<b>Black Coffee</b> joue ce soir à [UNVRS], 23:30', quand: 'il y a 1 h', dj: 'Black Coffee' },
    { ico: '✓', txt: '2 Bangers ont confirmé le set de <b>Kenzo B</b> au Club du port', quand: 'il y a 2 h', dj: 'Kenzo B' },
    { ico: '🎪', txt: 'Nouveau festival près de toi : <b>Positive Education</b>, 6–7 novembre', quand: 'hier', agenda: 1 },
    { ico: '🇦🇪', txt: 'La saison de <b>Dubaï</b> commence : Anyma le 30 octobre', quand: 'hier', dest: 'dubai' }
  ];
  const MESSAGES = [
    { de: 'Lena Brandt', txt: 'Merci pour l\'écoute hier soir ! Je rejoue samedi.', quand: '19:02', nonlu: true },
    { de: 'Rafa Lume', txt: 'Rooftop à São Paulo ce soir, connecte-toi à 22 h 🎶', quand: '18:40', nonlu: true },
    { de: 'Équipe Banzic', txt: 'Bienvenue sur le prototype 2 ! Dis-nous ce que tu en penses.', quand: 'hier', nonlu: false }
  ];
  state.notifsVues = store.get('notifsVues', false); state.msgsVus = store.get('msgsVus', false);
  function majCloche() {
    const n = $('#nb-notif'), m = $('#nb-msg');
    if (n) n.textContent = state.notifsVues ? '' : NOTIFS.length;
    if (m) m.textContent = state.msgsVus ? '' : MESSAGES.filter((x) => x.nonlu).length;
  }
  function ouvrirPanneau(quoi) {
    const p = $('#ent-panneau'), deja = !p.hidden && p.dataset.quoi === quoi;
    document.querySelectorAll('#ent-cloche, #ent-msg').forEach((b) => b.setAttribute('aria-expanded', 'false'));
    if (deja) { p.hidden = true; return; }
    p.dataset.quoi = quoi; p.hidden = false;
    $(quoi === 'notif' ? '#ent-cloche' : '#ent-msg').setAttribute('aria-expanded', 'true');
    p.innerHTML = quoi === 'notif'
      ? `<div class="ep-tete"><b>Notifications</b><small>Démo</small></div>` + NOTIFS.map((x, i) => `<button class="ep-ligne" data-notif="${i}"><span class="ep-ico">${x.ico}</span><span class="ep-txt">${x.txt}<small>${x.quand}</small></span></button>`).join('')
      : `<div class="ep-tete"><b>Messages</b><small>Démo</small></div>` + MESSAGES.map((x) => `<button class="ep-ligne ${x.nonlu ? 'nonlu' : ''}" data-msg-de="${esc(x.de)}"><span class="ep-av" style="--g:${accGrad(x.de)}">${esc(accInit(x.de))}</span><span class="ep-txt"><b>${esc(x.de)}</b> ${esc(x.txt)}<small>${x.quand}</small></span></button>`).join('')
        + '<p class="ep-note">Bientôt : écrire aux DJ et aux autres Bangers.</p>';
    if (quoi === 'notif') { state.notifsVues = true; store.set('notifsVues', true); } else { state.msgsVus = true; store.set('msgsVus', true); }
    majCloche();
  }
  document.addEventListener('click', (e) => {
    if (e.target.closest('#ent-cloche')) { ouvrirPanneau('notif'); return; }
    if (e.target.closest('#ent-msg')) { ouvrirPanneau('msg'); return; }
    const p = $('#ent-panneau');
    const n = e.target.closest('[data-notif]');
    if (n) { const x = NOTIFS[+n.dataset.notif]; p.hidden = true;
      if (x.dj) ouvrirDj(x.dj); else if (x.agenda) setTab('agenda'); else if (x.dest) { state.vueAcc = 'liste'; choisirDestMonde(x.dest); setTab('live'); } return; }
    const m = e.target.closest('[data-msg-de]');
    if (m) { p.hidden = true; ouvrirDj(m.dataset.msgDe); return; }
    if (p && !p.hidden && !e.target.closest('#ent-panneau')) { p.hidden = true; document.querySelectorAll('#ent-cloche, #ent-msg').forEach((b) => b.setAttribute('aria-expanded', 'false')); }
  });

  // ---------- Bouton « + » au centre de la barre du bas (à la place d'Agenda) : les actions rapides
  function ouvrirPlus() {
    let f = $('#plus-feuille');
    if (!f) { f = document.createElement('div'); f.id = 'plus-feuille'; f.className = 'plus-calque'; (document.querySelector('.app') || document.body).appendChild(f); }
    const dj = !!MON_DJ;
    const ICO = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
    f.innerHTML = `<div class="plus-feuille" role="dialog" aria-label="Ajouter"><div class="plus-poignee"></div>
      <div class="plus-grandes">
        <button class="plus-carte" data-plus="spot" style="--g:linear-gradient(145deg,#A77BFF,#2A1052)">${ACC_ANNEAUX}<span class="pc-ico">${ICO('<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>')}</span><b>Un DJ joue ici</b><small>Signale-le et note-le</small></button>
        <button class="plus-carte" data-plus="mixe" style="--g:linear-gradient(145deg,#FF8A3D,#7A1E4F)">${ACC_ANNEAUX}<span class="pc-ico">${ICO('<path d="M4 15v-3a8 8 0 0 1 16 0v3"/><rect x="3" y="14" width="4" height="6" rx="1.5"/><rect x="17" y="14" width="4" height="6" rx="1.5"/>')}</span><b>${dj ? 'Je mixe maintenant' : 'Je suis DJ'}</b><small>${dj ? 'Apparais sur la carte' : 'Crée ton profil DJ'}</small></button>
      </div>
      <button class="plus-fermer" data-plus="fermer">Fermer</button></div>`;
    f.hidden = false; requestAnimationFrame(() => f.classList.add('ouvert'));
  }
  // Play « Banger » : si un DJ s'est déclaré là où je suis, sa fiche s'ouvre directement pour le noter en vinyles
  const VINYLE_SVG = '<svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="19" class="vn-disque"/><circle cx="20" cy="20" r="15" class="vn-sillon"/><circle cx="20" cy="20" r="11.5" class="vn-sillon"/><circle cx="20" cy="20" r="7" class="vn-label"/><circle cx="20" cy="20" r="1.6" class="vn-trou"/></svg>';
  state.notesDj = store.get('notesDj', {});
  function djIci() {
    const pos = state.maPos && Date.now() - state.maPos.t < 600000 ? [state.maPos.lat, state.maPos.lng] : DEST[state.dest].centre;
    const xs = DECLS.filter((x) => declActive(x) && djDe(x) && (x.dest === state.dest || (state.mode === 'geo' && x.dest === 'local')))
      .map((x) => { const l = lieuDe(x); return { x, l, km: l && l.lat != null ? distKm(pos, [l.lat, l.lng]) : 0 }; })
      .filter((o) => o.km <= 1).sort((a, b) => a.km - b.km);   // démo : 1 km ; dans l'appli, 200 m (comme pour confirmer)
    return xs[0] || null;
  }
  function ouvrirNoteDj({ x, l }) {
    let f = $('#plus-feuille');
    if (!f) { f = document.createElement('div'); f.id = 'plus-feuille'; f.className = 'plus-calque'; (document.querySelector('.app') || document.body).appendChild(f); }
    const d = djDe(x), deja = state.notesDj[x.id];
    f.innerHTML = `<div class="plus-feuille" role="dialog" aria-label="Noter ${esc(d.nom)}"><div class="plus-poignee"></div>
      <form id="form-note-dj" data-decl="${x.id}" novalidate>
        <div class="nd-tete" style="--g:${accGrad(d.nom)}">${ACC_ANNEAUX}
          <span class="nd-av">${avatarDj(d.nom)}</span>
          <span class="nd-txt"><span class="acc-badge nd-live"><i></i>${declConfirmee(x) ? 'LIVE' : 'DÉCLARÉ'}</span><b>${esc(d.nom)}</b><small>joue ici · ${esc(l.nom)}</small><small>${esc(x.style)} · jusqu'à ${hm(x.fin)}</small></span>
        </div>
        <p class="nd-explic">Tu es sur place avec ${esc(d.nom)} ? Banguérise : le compteur vert de ce lieu monte d'un Banger.</p>
        <button type="submit" class="btn-plein nd-envoyer nd-bang" ${deja ? 'disabled' : ''}>${deja ? 'Déjà banguérisé ici' : 'Je suis là, je bangue'}</button>
        <div class="nd-autres"><button type="button" class="lien-demo" data-dj-pro="${esc(d.nom)}">Voir sa fiche</button><button type="button" class="lien-demo" data-nd-autre="1">Ce n'est pas lui · signaler un autre DJ</button></div>
      </form>
      <button class="plus-fermer" data-plus="fermer">Fermer</button></div>`;
    f.hidden = false; requestAnimationFrame(() => f.classList.add('ouvert'));
  }
  document.addEventListener('submit', (e) => {
    if (e.target.id !== 'form-note-dj') return;
    e.preventDefault();
    const x = DECLS.find((y) => y.id === e.target.dataset.decl); if (!x) return;
    // Banguériser : juste « je suis là avec ce DJ » (plus de note) : +1 au compteur vert du DJ et du lieu
    if (!state.notesDj[x.id]) { state.notesDj[x.id] = 1; store.set('notesDj', state.notesDj); x.conf = (x.conf || 0) + 1; state.votesDecl[x.id] = 'ok'; store.set('votesDecl', state.votesDecl);
      if (x.lieu) { BANG_LIEU[x.lieu] = (BANG_LIEU[x.lieu] || 0) + 1; store.set('bangLieu', BANG_LIEU); }
      try { sauverDecls(); } catch (err) { /* démo */ } sonBanger(); if (navigator.vibrate) navigator.vibrate(30); toast('Banguérisé avec ' + djDe(x).nom + ' : +1 Banger sur place'); }
    fermerPlus(); render(); return;
    const n = 0;
    const d = djDe(x), avant = state.notesDj[x.id];
    // La note compte dans la crédibilité du DJ : 5 = top, 3-4 = bien, 1-2 = bof
    const cat = (k) => k >= 5 ? 'top' : k >= 3 ? 'bien' : 'bof';
    d.avis = d.avis || { top: 0, bien: 0, bof: 0 };
    if (avant) d.avis[cat(avant)] = Math.max(0, d.avis[cat(avant)] - 1);
    d.avis[cat(n)] += 1; if (d.mien) store.set('djPro', d);
    state.notesDj[x.id] = n; store.set('notesDj', state.notesDj);
    fermerPlus(); toast(`Merci ! ${d.nom} : ${n}/5 · ${NOTE_MOTS[n]}`); render();
  });
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-nd-autre]')) { e.preventDefault(); fermerPlus(); setTimeout(ouvrirPlus, 230); return; }
    if (e.target.closest('#plus-feuille [data-dj-pro]')) fermerPlus();
  });
  function fermerPlus() { const f = $('#plus-feuille'); if (f) { f.classList.remove('ouvert'); setTimeout(() => { f.hidden = true; }, 200); } }
  document.addEventListener('click', (e) => {
    if (e.target.closest('#tab-plus')) { const ici = djIci(); if (ici) ouvrirNoteDj(ici); else ouvrirPlus(); return; }
    const f = $('#plus-feuille'); if (!f || f.hidden) return;
    const b = e.target.closest('[data-plus]');
    if (!b) { if (e.target === f) fermerPlus(); return; }
    const k = b.dataset.plus; fermerPlus();
    if (k === 'spot') { setTab('map'); setTimeout(() => { const s = $('#btn-spot'); if (s) s.click(); }, 250); }
    else if (k === 'mixe') { state.vueDj = MON_DJ ? 'mixe' : 'creer'; setTab('profil'); }
    else if (k === 'agenda') setTab('agenda');
  });

  function render() {
    majEnteteMoi(); majCloche();
    renderClock();
    if (state.tab === 'live') { renderChips(); renderLive(); }
    if (state.tab === 'fav') renderFavs();
    if (state.tab === 'map') renderMap();
    if (state.tab === 'agenda') renderAgenda();
    if (state.tab === 'profil') renderProfil();
    if (state.tab === 'checkin') renderCheckin();
  }

  // Accès : « En direct », la carte et les fiches des lieux sont réservés aux inscrits.
  // Sans compte : l'agenda, les fiches DJ et Mes DJ restent ouverts.
  // Prototype 2 : tout est ouvert, sans inscription (on remettra le compte obligatoire avec les vrais comptes)
  const estInscrit = () => true;
  const ECRANS_INSCRITS = ['live', 'map'];
  function portail(ecran) {
    return `<div class="portail">
      <svg class="portail-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>
      <h2>${ecran === 'map' ? 'La carte en live' : 'Qui joue en ce moment'}</h2>
      <p>Inscris-toi gratuitement pour voir ${ecran === 'map' ? 'sur la carte qui joue où, en temps réel' : 'qui joue en ce moment, les pépites et les DJ déclarés'}, et rejoindre les Bangers.</p>
      <button class="btn-plein" data-aller-inscription="1">Se connecter</button>
      <p class="portail-libre">Sans compte, tu as déjà accès à l'agenda, aux fiches des DJ et à tes DJ favoris.</p>
      <div class="portail-liens"><button class="alerte" data-tab="agenda">Voir l'agenda</button><button class="alerte" data-tab="fav">Les DJ</button></div>
    </div>`;
  }
  function majPortails() {
    const libre = estInscrit();
    let g = $('#portail-map');
    if (!libre && !g) { g = document.createElement('div'); g.id = 'portail-map'; g.className = 'portail-calque'; $('#screen-map').appendChild(g); }
    if (g) { g.hidden = libre; if (!libre) g.innerHTML = portail('map'); }
    $('#screen-map').classList.toggle('verrouille', !libre);
    document.querySelectorAll('.tab[data-tab="live"], .tab[data-tab="map"]').forEach((b) => b.classList.toggle('verrou', !libre));
  }
  function setTab(tab) {
    state.tab = tab;
    document.querySelectorAll('.tab').forEach((b) => b.classList.toggle('on', b.dataset.tab === tab));
    $('#screen-live').hidden = tab !== 'live';
    $('#screen-map').hidden = tab !== 'map';
    $('#screen-fav').hidden = tab !== 'fav';
    $('#screen-agenda').hidden = tab !== 'agenda';
    $('#screen-profil').hidden = tab !== 'profil';
    $('#screen-checkin').hidden = tab !== 'checkin';
    const pst = document.querySelector('.pastilles'); if (pst) pst.hidden = tab !== 'live'; // boutons Autour de moi / DJ live : seulement sur « En direct »
    if (tab === 'map') { initMap(); setTimeout(() => map && map.invalidateSize(), 0); }
    majPortails();
    render();
    if (tab === 'map') setTimeout(centrerSurMoi, 250);
  }
  // En ouvrant la carte : on atterrit sur le point bleu de géolocalisation (position réelle du téléphone)
  function centrerSurMoi() {
    if (!map || !estInscrit()) return;
    // Point GPS au milieu, cercle de 50 km autour : la carte s'ouvre cadrée sur ce cercle
    const poser = () => { const m = state.maPos, c = m ? [m.lat, m.lng] : ((state.zoneGeo && DEST[state.zoneGeo.dest]) || DEST.local).centre; dessinerMoi();
      if (!rayonLayer) rayonLayer = L.layerGroup().addTo(map); rayonLayer.clearLayers();
      const cercle = L.circle(c, { radius: 50000, color: '#4DA3FF', weight: 1.5, opacity: .7, dashArray: '6 6', fillColor: '#4DA3FF', fillOpacity: .05, interactive: false }).addTo(rayonLayer);
      L.marker(L.latLng(c[0] + 50 / 111, c[1]), { icon: L.divIcon({ className: 'rayon-label', html: '<span>50 km</span>', iconSize: [60, 20], iconAnchor: [30, 10] }), interactive: false }).addTo(rayonLayer);
      map.fitBounds(cercle.getBounds(), { padding: [10, 10] }); };
    if (state.maPos && Date.now() - state.maPos.t < 120000) { poser(); return; }
    poser();
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((p) => {
      state.maPos = { lat: p.coords.latitude, lng: p.coords.longitude, acc: p.coords.accuracy, t: Date.now() };
      state.zoneGeo = zoneDe([state.maPos.lat, state.maPos.lng], false, villeProche(state.maPos.lat, state.maPos.lng));
      if (state.mode === 'geo') changerDest(state.zoneGeo.dest);
      if (state.tab === 'map') poser();
    }, () => { /* position refusée ou indisponible : la carte reste sur la zone, sans message ; le bouton viseur permet de réessayer */ },
    { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 });
  }

  // ---------- Événements
  document.addEventListener('click', (e) => { if (e.target.closest('[data-aller-inscription]')) setTab('profil'); });
  document.addEventListener('click', (e) => {
    if (state.tab === 'agenda' && !state.lieuOuvert && e.target.closest('#screen-agenda') && clicAgenda(e)) return;
    if (state.tab === 'profil' && e.target.closest('#screen-profil') && clicProfil(e)) return;
    const dst = e.target.closest('[data-dest]');
    if (dst) { $('#suggestions-dj').hidden = true; $('#recherche-dj').value = ''; changerDest(dst.dataset.dest); toast('Destination : ' + DEST[dst.dataset.dest].nom); return; }
    const fav = e.target.closest('[data-fav]');
    if (fav) { e.stopPropagation(); toggleFav(fav.dataset.fav); return; }
    const av = e.target.closest('[data-avis]');
    if (av) { const pid = Number(av.dataset.avis), p = passageParId(pid), val = av.dataset.val; surPlace(p && lieux[p.lieu], () => donnerAvis(pid, val)); return; }
    const aa = e.target.closest('[data-autre-avis]');
    if (aa) {
      const pid = Number(aa.dataset.autreAvis), v = aa.dataset.val;
      state.autresAvis[pid] = state.autresAvis[pid] || {};
      state.autresAvis[pid][v] = (state.autresAvis[pid][v] || 0) + 1; store.set('autresAvis', state.autresAvis);
      renderSheet(); render(); toast('Un autre utilisateur a donné son avis'); return;
    }
    if (e.target.closest('[data-signaler]')) { surPlace(lieux[state.lieuOuvert], () => { state.signaler = true; renderSheet(); setTimeout(() => { const i = document.querySelector('#form-signaler input'); if (i) i.focus(); }, 0); }); return; }
    if (e.target.closest('[data-annuler-signal]')) { state.signaler = false; renderSheet(); return; }
    const vc = e.target.closest('[data-vue-carte]');
    if (vc) {
      state.vueCarte = vc.dataset.vueCarte;
      $('#galerie-lieux').hidden = state.vueCarte !== 'lieux';
      $('#screen-map').classList.toggle('galerie-on', state.vueCarte === 'lieux');
      document.querySelectorAll('[data-vue-carte].seg').forEach((b) => { const on = b.dataset.vueCarte === state.vueCarte; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
      if (state.vueCarte === 'lieux') renderGalerie(); else setTimeout(() => map && map.invalidateSize(), 0);
      return;
    }
    const fond = e.target.closest('[data-fond]');
    if (fond) { choisirFond(fond.dataset.fond); return; }
    const vote = e.target.closest('[data-vote]');
    if (vote) { const pid = Number(vote.dataset.vote), p = passageParId(pid); surPlace(p && lieux[p.lieu], () => voter(pid)); return; }
    const autre = e.target.closest('[data-autre]');
    if (autre) {
      const pid = Number(autre.dataset.autre);
      state.autres[pid] = (state.autres[pid] || 0) + 1; store.set('autres', state.autres);
      renderSheet(); render();
      toast(monVoteValide(passageParId(pid)) ? 'Validée : ta confirmation est maintenant visible par tous' : 'Un autre utilisateur a confirmé');
      return;
    }
    const chip = e.target.closest('[data-filtre]');
    if (chip) { state.filtre = chip.dataset.filtre; render(); return; }
    const tab = e.target.closest('[data-tab]');
    if (tab) { setTab(tab.dataset.tab); return; }
    const lieu = e.target.closest('[data-lieu]');
    if (lieu) { if (map) map.closePopup(); ouvrirLieu(lieu.dataset.lieu); }
  });
  document.addEventListener('keydown', (e) => {
    // Dans la fiche profil, « OK » / « Entrée » du clavier ferme le clavier au lieu de valider la fiche
    if (e.key === 'Enter' && e.target.closest && e.target.closest('#form-profil') && e.target.tagName === 'INPUT') { e.preventDefault(); e.target.blur(); return; }
    if (e.key === 'Escape' && state.lieuOuvert) fermerLieu();
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('.card[role=button]')) { e.preventDefault(); ouvrirLieu(e.target.dataset.lieu); }
  });
  $('#sheet-back').addEventListener('click', fermerLieu);
  // Temps réel : on se recale sur l'horloge toutes les 30 secondes
  setInterval(() => {
    const t = heureReelle();
    renderClock();
    if (t === state.t) return;
    state.t = t;
    renderClock();
    if (['live', 'map', 'fav', 'checkin'].includes(state.tab)) render();
    if (state.lieuOuvert) renderSheet();
    if (state.djOuvert) renderDj();
  }, 30000);
  $('#fav-search').addEventListener('input', renderFavs);

  // Écran d'accueil : au tout premier lancement, il attend « Entrer » ; ensuite, il s'efface tout seul.
  (function splash() {
    const el = $('#splash'); if (!el) return;
    // Page de démarrage mise de côté pour l'instant (on la remettra plus tard) : on la retrouve avec ?demarrage=1 dans l'adresse
    if (!/[?&]demarrage=1\b/.test(location.search)) { el.remove(); return; }
    // Le bouton vert mène tout de suite à la page d'accueil
    const fermer = () => { if (el.classList.contains('fin')) return; el.classList.add('fin'); state.vueAcc = 'accueil'; setTab('live'); setTimeout(() => el.remove(), 600); };
    const premier = !store.get('dejaVu', false);
    // Deux versions de l'accueil : par défaut le plateau qui tourne (vb) ; ?accueil=1 pour la version mise de côté (va)
    if (/[?&]accueil=1\b/.test(location.search)) { el.classList.remove('vb'); el.classList.add('va'); }
    // Forme d'onde qui défile sur l'écran de la platine : basses, médiums, aigus ; intro, montée, break, drop
    const onde = el.querySelector('.sc-onde canvas');
    let animOnde = null;
    if (onde) {
      const dpr = Math.min(window.devicePixelRatio || 1, 2), W = 1400, H = 60, N = 350; // N colonnes par boucle, dessinées deux fois
      onde.width = W * dpr; onde.height = H * dpr; onde.style.width = W + 'px'; onde.style.height = H + 'px';
      const c = onde.getContext('2d'); c.scale(dpr, dpr);
      let g = 7; const rnd = () => { g = (g * 16807) % 2147483647; return g / 2147483647; };
      const cols = [];
      for (let i = 0; i < N; i++) {
        const p = i / N, beat = i % 8, kick = Math.max(0, 1 - beat / 3.2);
        let bas, med, aig;
        if (p < .22) { bas = .35 + .45 * kick; med = .18 + .1 * rnd(); aig = .25 + .25 * rnd(); }             // intro : kick + charleston
        else if (p < .42) { const m = (p - .22) / .2; bas = .3 + .2 * kick * (1 - m); med = .25 + .35 * m + .1 * rnd(); aig = .3 + .6 * m * rnd() + .2 * m; } // montée
        else if (p < .5) { bas = .08 + .05 * rnd(); med = .3 + .15 * rnd(); aig = .15 + .15 * rnd(); }       // break avant le drop
        else if (p < .82) { bas = .62 + .38 * kick; med = .45 + .25 * rnd(); aig = .35 + .4 * rnd(); }       // drop
        else { const m = (p - .82) / .18; bas = (.5 + .3 * kick) * (1 - .6 * m); med = .3 + .15 * rnd(); aig = .25 + .25 * rnd(); } // sortie
        cols.push([Math.min(bas, 1), Math.min(med, 1), Math.min(aig, 1)]);
      }
      const cw = W / (2 * N), mid = H / 2;
      for (let r = 0; r < 2; r++) cols.forEach(([b, m, a], i) => {
        const x = (r * N + i) * cw, w = Math.max(cw - .6, 1);
        c.fillStyle = 'rgba(255,138,61,.95)'; c.fillRect(x, mid - b * mid, w, 2 * b * mid);      // basses
        c.fillStyle = 'rgba(255,178,122,.9)'; c.fillRect(x, mid - m * mid * .72, w, 2 * m * mid * .72); // médiums
        c.fillStyle = 'rgba(244,241,234,.9)'; c.fillRect(x, mid - a * mid * .38, w, 2 * a * mid * .38); // aigus
      });
      // Vue d'ensemble du morceau, sous la forme d'onde
      const ap = el.querySelector('.sc-apercu canvas'), AW = 600, AH = 24;
      if (ap) {
        ap.width = AW * dpr; ap.height = AH * dpr;
        const k = ap.getContext('2d'); k.scale(dpr, dpr);
        const aw = AW / N;
        cols.forEach(([b, m, a], i) => {
          const v = Math.max(b, m * .85, a * .6);
          const tt = i / N; k.fillStyle = `hsl(${(330 + tt * 75) % 360}, 100%, ${b > .6 ? 62 : m > .45 ? 70 : 78}%)`;
          k.fillRect(i * aw, AH - v * AH, Math.max(aw - .4, .8), v * AH);
        });
      }
      if (onde.animate && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
        animOnde = [onde.animate([{ transform: 'translateX(0)' }, { transform: `translateX(-${W / 2}px)` }], { duration: 14000, iterations: Infinity })];
        const lu = el.querySelector('.sc-lu');
        if (lu) animOnde.push(lu.animate([{ left: '0%' }, { left: '100%' }], { duration: 14000, iterations: Infinity, iterationStart: ((onde.parentElement.clientWidth / 2) / (W / 2)) % 1 }));
      }
    }
    const lancer = () => {
      if (el.classList.contains('spin') || el.classList.contains('fin')) return;
      if (animOnde) animOnde.forEach((x) => { x.playbackRate = 5; });
      if (!el.classList.contains('vb') || matchMedia('(prefers-reduced-motion: reduce)').matches) { fermer(); return; }
      // « Se connecter » : le slogan tourne sur le plateau comme un vinyle lancé, puis l'accueil s'ouvre
      el.classList.add('spin');
      setTimeout(fermer, 1350);
    };
    // Choix de la langue dès l'écran d'accueil
    let auto = null;
    const btn = $('#sl-bouton'), liste = $('#sl-liste'), entrer = $('#splash-entrer');
    const majSplashLangue = () => {
      $('#sl-code').textContent = LANG.toUpperCase();
      entrer.querySelector('.sp-txt').textContent = T('se_connecter'); entrer.setAttribute('aria-label', T('se_connecter'));
      liste.innerHTML = LANGUES.map((x) => `<button type="button" role="option" class="sl-opt ${x.id === LANG ? 'on' : ''}" data-sl="${x.id}" lang="${x.id}" aria-selected="${x.id === LANG}">${x.nom}</button>`).join('');
    };
    majSplashLangue();
    btn.addEventListener('click', (e) => { e.stopPropagation(); if (auto) { clearTimeout(auto); auto = null; } liste.hidden = !liste.hidden; btn.setAttribute('aria-expanded', String(!liste.hidden)); });
    liste.addEventListener('click', (e) => {
      e.stopPropagation();
      const o = e.target.closest('[data-sl]'); if (!o) return;
      choisirLangue(o.dataset.sl); majSplashLangue();
      liste.hidden = true; btn.setAttribute('aria-expanded', 'false');
    });
    if (premier) {
      const b = $('#splash-entrer'); b.hidden = false;
      b.addEventListener('click', () => { store.set('dejaVu', true); lancer(); });
    } else {
      // Visites suivantes : le bouton reste affiché, on peut changer de langue ; un toucher ailleurs ferme l'écran
      entrer.hidden = false;
      entrer.addEventListener('click', (e) => { e.stopPropagation(); lancer(); });
      el.addEventListener('click', (e) => { if (!e.target.closest('.splash-langue')) lancer(); });
    }
  })();
  applyLangue();
  majPortails();
  if (state.mode === 'ibiza') state.dest = 'ibiza';
  if (state.mode === 'monde') state.dest = DEST[store.get('dest', 'ibiza')] && !DEST[store.get('dest', 'ibiza')].local ? store.get('dest', 'ibiza') : 'ibiza';
  majDestLigne();
  render();
  localiser();
})();
