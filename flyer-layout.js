/* Compact format-aware cards in a native vertical swipe feed. */
(() => {
 let activeRail = null, pauseUntil = 0;
 window.BANZIC_FLYER_LAYOUT = {
  sync(root) {
   const rail = root.querySelector('#dc-rail'); if (!rail) return;
   activeRail = rail;
   ['touchstart','wheel','pointerdown'].forEach(type => rail.addEventListener(type, () => { pauseUntil = Date.now() + 4000; }, {passive:true}));
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
 setInterval(() => {
  const rail = activeRail;
  if (!rail || !rail.isConnected || document.hidden || Date.now() < pauseUntil || matchMedia('(prefers-reduced-motion: reduce)').matches || document.querySelector('dialog[open]')) return;
  const r = rail.getBoundingClientRect(); if (r.bottom <= 0 || r.top >= innerHeight) return;
  const n = rail.children.length; if(n<2) return;
  const i = Math.round(rail.scrollTop / rail.clientHeight);
  rail.scrollTo({top: ((i+1)%n)*rail.clientHeight, behavior: i+1>=n ? 'instant' : 'smooth'});
 }, 2000);
})();