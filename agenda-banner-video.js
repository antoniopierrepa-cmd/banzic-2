/* Silent looping banner; the source file itself has no audio track. */
(() => {
  'use strict';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const videos = new Map();
  const update = (video, visible) => {
    if (document.hidden || reduced.matches || !visible || !video.isConnected) {
      video.pause();
      if (reduced.matches) video.style.visibility = 'hidden';
      return;
    }
    video.style.visibility = '';
    video.muted = true;
    video.play().catch(() => {}); // Poster remains visible if autoplay is blocked.
  };
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      videos.set(entry.target, entry.isIntersecting);
      update(entry.target, entry.isIntersecting);
    }
  });
  window.BANZIC_AGENDA_VIDEO = {
    sync(root) {
      for (const [video] of videos) if (!video.isConnected) {
        observer.unobserve(video); video.pause(); videos.delete(video);
      }
      for (const video of root.querySelectorAll('[data-agenda-banner-video]')) {
        if (videos.has(video)) continue;
        videos.set(video, false);
        video.defaultMuted = true; video.muted = true;
        video.addEventListener('error', () => { video.style.display = 'none'; }, { once: true });
        observer.observe(video);
      }
    }
  };
  const refresh = () => { for (const [video, visible] of videos) update(video, visible); };
  document.addEventListener('visibilitychange', refresh);
  reduced.addEventListener('change', refresh);
  window.addEventListener('pagehide', () => { for (const [video] of videos) video.pause(); });
  window.addEventListener('pageshow', refresh);
})();
