/* Fixed flyer frame: no horizontal dragging; only the active card is interactive. */
(() => {
  'use strict';
  let rail = null, index = 0, slides = [];
  function show(i) {
    if (!rail || !slides.length) return;
    index = (i + slides.length) % slides.length;
    slides.forEach((slide, n) => {
      const active = n === index;
      slide.classList.toggle('is-current', active);
      slide.inert = !active;
      slide.setAttribute('aria-hidden', String(!active));
    });
    rail.parentElement.querySelectorAll('.dc-points i').forEach((dot,n) => dot.classList.toggle('on', n === index));
  }
  window.BANZIC_FLYER_LAYOUT = {
    sync(root) {
      rail = root.querySelector('#dc-rail');
      slides = rail ? Array.from(rail.children) : [];
      show(0);
    },
    next() {
      if (!rail || !rail.isConnected || rail.contains(document.activeElement) || rail.matches(':hover')) return;
      show(index + 1);
    }
  };
})();