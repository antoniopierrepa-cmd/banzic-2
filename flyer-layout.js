/* Compact format-aware cards in a native vertical swipe feed. */
(() => {
 let activeRail = null, pauseUntil = 0;
 window.BANZIC_FLYER_LAYOUT = {
  sync(root) {
   const rail = root.querySelector('#dc-rail'); if (!rail) return;
   activeRail = rail;
   const fit = () => {
     if(!rail.isConnected) return;
     const screen = rail.closest('.screen'), nav = document.querySelector('nav.tabs');
     if(!screen || !nav || !screen.clientHeight) return;
     const scale = rail.getBoundingClientRect().height / rail.clientHeight || 1;
     const top = rail.getBoundingClientRect().top + screen.scrollTop * scale;
     const space = Math.max(180, (nav.getBoundingClientRect().top - top) / scale);
     rail.style.setProperty('--discovery-height', space + 'px');
   };
   requestAnimationFrame(fit);
   const resize = new ResizeObserver(fit); resize.observe(document.querySelector('.app'));

   ['touchstart','wheel','pointerdown'].forEach(type => rail.addEventListener(type, () => { pauseUntil = Date.now() + 4000; }, {passive:true}));
   rail.setAttribute('aria-label','Soirées près de toi : faire défiler vers la gauche');
   rail.querySelectorAll('.dc-slide').forEach(slide => {
    slide.inert = false; slide.removeAttribute('aria-hidden'); slide.classList.add('is-current');
    const img = slide.querySelector('img'); if (!img) return;
    const classify = () => { slide.classList.toggle('dc-portrait',(img.naturalHeight || img.height) > (img.naturalWidth || img.width)); };
    img.loading = slide === rail.firstElementChild ? 'eager' : 'lazy'; classify(); img.addEventListener('load',classify,{once:true});
   });
  },
  next() {} // Manual vertical navigation replaces automatic crossfades.
 };
 setInterval(() => {
  const rail = activeRail;
  if (!rail || !rail.isConnected || document.hidden || Date.now() < pauseUntil || matchMedia('(prefers-reduced-motion: reduce)').matches || document.querySelector('dialog[open]')) return;
  const r = rail.getBoundingClientRect(); if (r.bottom <= 0 || r.top >= innerHeight) return;
  const n = rail.children.length; if(n<2) return;
  const i = Math.round(rail.scrollLeft / rail.clientWidth);
  const next = (i + 1) % n; const img = rail.children[next]?.querySelector('img'); if(img) img.loading='eager';
  rail.scrollTo({left: next*rail.clientWidth, behavior: i+1>=n ? 'instant' : 'smooth'});
 }, 4000);
})();