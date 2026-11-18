/* Compact format-aware cards in a native vertical swipe feed. */
(() => {
 window.BANZIC_FLYER_LAYOUT = {
  sync(root) {
   const rail = root.querySelector('#dc-rail'); if (!rail) return;
   rail.setAttribute('aria-label','Soirées près de toi : faire défiler vers le haut');
   rail.querySelectorAll('.dc-slide').forEach(slide => {
    slide.inert = false; slide.removeAttribute('aria-hidden'); slide.classList.add('is-current');
    const img = slide.querySelector('img'); if (!img) return;
    const classify = () => { slide.classList.toggle('dc-portrait',img.naturalHeight > img.naturalWidth); };
    img.loading = 'eager'; if (img.complete) classify(); else img.addEventListener('load',classify,{once:true});
   });
  },
  next() {} // Manual vertical navigation replaces automatic crossfades.
 };
})();