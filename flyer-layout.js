/* Fixed frame, automatic crossfade; warm the next image before showing it. */
(() => {
  'use strict';
  let rail = null, index = 0, slides = [], pending = null;
  function prepare(i) {
    const img = slides[i]?.querySelector('.dc-media img');
    if (img) { img.loading = 'eager'; img.decoding = 'async'; }
    return img;
  }
  function show(i) {
    if (!rail || !slides.length) return;
    pending = null;
    index = (i + slides.length) % slides.length;
    slides.forEach((slide, n) => {
      const active = n === index;
      slide.classList.toggle('is-current', active);
      slide.inert = !active;
      slide.setAttribute('aria-hidden', String(!active));
    });
    rail.parentElement.querySelectorAll('.dc-points i').forEach((dot,n) => dot.classList.toggle('on', n === index));
    prepare((index + 1) % slides.length);
  }
  window.BANZIC_FLYER_LAYOUT = {
    sync(root) {
      rail = root.querySelector('#dc-rail');
      slides = rail ? Array.from(rail.children) : [];
      pending = null;
      if (slides.length) { prepare(0); show(0); }
    },
    next() {
      if (!rail || !rail.isConnected || slides.length < 2 || pending !== null) return;
      for (let step = 1; step < slides.length; step++) {
        const next = (index + step) % slides.length, img = prepare(next);
        if (!img) continue;
        if (img.complete && img.naturalWidth > 0) { show(next); return; }
        if (img.complete && !img.naturalWidth) continue;
        const currentRail = rail;
        pending = next;
        img.addEventListener('load', () => {
          if (rail === currentRail && pending === next && currentRail.isConnected) {
            pending = null;
            if (!document.hidden) show(next);
          }
        }, { once: true });
        img.addEventListener('error', () => { if (rail === currentRail && pending === next) pending = null; }, { once: true });
        return;
      }
    }
  };
})();