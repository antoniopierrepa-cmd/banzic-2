/* One shared home slot, two original destinations. No audio. */
(() => {
  'use strict';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const entries = new Map();
  function stop(entry) { clearTimeout(entry.timer); entry.timer = 0; }
  function schedule(entry) {
    stop(entry);
    if (document.hidden || reduced.matches || !entry.visible || entry.hold || !entry.el.isConnected) return;
    entry.timer = setTimeout(() => { flip(entry); schedule(entry); }, 3000);
  }
  function flip(entry) {
    entry.back = !entry.back;
    entry.el.classList.toggle('is-back', entry.back);
    entry.faces.forEach((face, i) => {
      const active = i === Number(entry.back);
      face.inert = !active;
      face.setAttribute('aria-hidden', String(!active));
    });
    entry.swap.setAttribute('aria-label', entry.back ? 'Afficher Direct autour de moi' : 'Afficher Départs du jour');
  }
  const observer = new IntersectionObserver(records => {
    for (const record of records) {
      const entry = entries.get(record.target);
      if (entry) { entry.visible = record.isIntersecting; schedule(entry); }
    }
  });
  window.BANZIC_HOME_FLIP = {
    sync(root) {
      for (const [el, entry] of entries) if (!el.isConnected) {
        stop(entry); observer.unobserve(el); entries.delete(el);
      }
      for (const el of root.querySelectorAll('.home-flip')) {
        if (entries.has(el)) continue;
        const entry = { el, faces: Array.from(el.querySelectorAll('.home-flip-face')), swap: el.querySelector('.home-flip-swap'), back: false, visible: false, hold: false, timer: 0 };
        entries.set(el, entry);
        entry.swap.addEventListener('click', () => { flip(entry); schedule(entry); });
        const hold = () => { entry.hold = true; stop(entry); };
        const release = () => { entry.hold = el.matches(':hover') || el.contains(document.activeElement); schedule(entry); };
        el.addEventListener('pointerenter', hold);
        el.addEventListener('pointerleave', release);
        el.addEventListener('focusin', hold);
        el.addEventListener('focusout', () => queueMicrotask(release));
        observer.observe(el);
      }
    }
  };
  const refresh = () => { for (const entry of entries.values()) schedule(entry); };
  document.addEventListener('visibilitychange', refresh);
  reduced.addEventListener('change', refresh);
  window.addEventListener('pagehide', () => { for (const entry of entries.values()) stop(entry); });
  window.addEventListener('pageshow', refresh);
})();
