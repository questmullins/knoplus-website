(() => {
  const header = document.querySelector('.coffee-header');
  const toggle = document.querySelector('.mobile-toggle');
  const panel = document.querySelector('.mobile-panel');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  function setMenu(open, restoreFocus = false) {
    panel.classList.toggle('open', open);
    panel.inert = !open;
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.body.style.overflow = open ? 'hidden' : '';
    if (restoreFocus) toggle.focus();
  }
  toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
  panel.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setMenu(false, true)));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && panel.classList.contains('open')) setMenu(false, true);
    if (event.key !== 'Tab' || !panel.classList.contains('open')) return;
    const links = [...panel.querySelectorAll('a')];
    if (event.shiftKey && document.activeElement === toggle) { event.preventDefault(); links.at(-1).focus(); }
    else if (!event.shiftKey && document.activeElement === links.at(-1)) { event.preventDefault(); toggle.focus(); }
    else if (!event.shiftKey && document.activeElement === toggle) { event.preventDefault(); links[0].focus(); }
    else if (event.shiftKey && document.activeElement === links[0]) { event.preventDefault(); toggle.focus(); }
  });
  function update() {
    header.classList.toggle('is-solid', window.scrollY > 30);
    document.querySelectorAll('[data-parallax]').forEach(el => el.style.setProperty('--parallax-y', reduced.matches ? '0px' : `${Math.min(30, window.scrollY * .08)}px`));
  }
  let queued = false;
  window.addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(() => { update(); queued = false; }); } }, { passive: true });
  window.addEventListener('resize', () => { if (window.innerWidth > 860) setMenu(false); update(); });
  if ('IntersectionObserver' in window && !reduced.matches) {
    document.documentElement.classList.add('js-motion');
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); }
    }), { threshold: .12 });
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
  }
  update();
})();
