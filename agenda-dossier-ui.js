(() => {
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  function dossierAgendaBonzik() {
    const aujourdHui = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Paris' }).format(new Date());
    const dates = (window.BANZIC_DOSSIER_2026 || []).filter((x) => x.date >= aujourdHui);
    if (!dates.length) return '';
    const cartes = dates.map((x) => {
      const date = new Date(x.date + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
      const source = /^https:\/\//i.test(x.url) ? x.url : '';
      const affiche = /^flyers\/(2026-11-23|dossier-2026)\/[a-z0-9-]+\.(jpg|png|webp)$/.test(x.flyer || '') ? x.flyer : '';
      return `<article class="sud-soiree">
        ${affiche ? `<a href="${esc(affiche)}" target="_blank" rel="noopener"><img class="sud-affiche" src="${esc(affiche)}" alt="Affiche de ${esc(x.nom)}" loading="lazy"></a>` : ''}
        <div class="sud-info">
          <small>${esc(date)}${x.heure ? ' · ' + esc(x.heure.replace(':', ' h ')) : ''}</small>
          <span class="venue">${esc(x.nom)}</span>
          ${x.djs ? `<small>${esc(x.djs)}</small>` : ''}
          <small class="sud-lieu">${esc(x.lieu)} · ${esc(x.adresse)} · ${esc(x.pays)}</small>
        </div>
        ${source ? `<a class="badge b-soon" href="${esc(source)}" target="_blank" rel="noopener noreferrer">Source</a>` : ''}
      </article>`;
    }).join('');
    return `<details class="jour"><summary>Soirées du dossier Bonzik · ${dates.length} dates</summary>${cartes}</details>`;
  }

  const agenda = document.getElementById('screen-agenda');
  if (!agenda) return;
  function mount() {
    const list = agenda.querySelector('#agenda-liste');
    if (!list || agenda.querySelector('#dossier-bonzik')) return;
    const markup = dossierAgendaBonzik();
    if (!markup) return;
    const section = document.createElement('div');
    section.id = 'dossier-bonzik';
    section.innerHTML = markup;
    list.before(section);
  }
  new MutationObserver(mount).observe(agenda, { childList: true });
  mount();
})();
