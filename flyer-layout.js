/* Full flyers in their own orientation; height follows the active slide. */
(() => {
  'use strict';
  let rail = null, frame = 0;
  function measure() {
    frame = 0;
    if (!rail || !rail.isConnected || !rail.clientWidth) return;
    const i = Math.max(0, Math.min(rail.children.length - 1, Math.round(rail.scrollLeft / rail.clientWidth)));
    const slide = rail.children[i]; if (!slide) return;
    const height = slide.offsetHeight;
    if (height && Math.abs(parseFloat(rail.style.height || '0') - height) > 1) rail.style.height = height + 'px';
  }
  const queue = () => { if (!frame) frame = requestAnimationFrame(measure); };
  const resize = new ResizeObserver(queue);
  window.BANZIC_FLYER_LAYOUT = {
    sync(root) {
      resize.disconnect();
      if (frame) cancelAnimationFrame(frame); frame = 0;
      if (rail) rail.removeEventListener('scroll', queue);
      rail = root.querySelector('#dc-rail'); if (!rail) return;
      rail.addEventListener('scroll', queue, { passive: true });
      for (const slide of rail.children) {
        resize.observe(slide);
        const img = slide.querySelector('.dc-media img'); if (!img) continue;
        const size = () => {
          if (img.naturalWidth && img.naturalHeight) {
            img.parentElement.style.setProperty('--flyer-ratio', img.naturalWidth + ' / ' + img.naturalHeight);
            queue();
          }
        };
        img.addEventListener('load', size);
        if (img.complete) size();
      }
      queue();
    }
  };
})();