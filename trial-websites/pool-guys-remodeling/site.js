// The Pool Guys on Synergy: the template's interactions without React.
(() => {
  const root = document.documentElement;
  const KEY = 'poolguys-glass-theme';
  const toggle = document.querySelector('.glass-theme-toggle');
  const moon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.1A7.9 7.9 0 0 1 9.9 4a8.4 8.4 0 1 0 10.1 10.1Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path></svg>';
  const sun = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.8"></circle><path d="M12 2.5v2.2M12 19.3v2.2M4.6 4.6l1.6 1.6M17.8 17.8l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.6 19.4l1.6-1.6M17.8 6.2l1.6-1.6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"></path></svg>';
  const setMode = mode => {
    root.dataset.glassMode = mode;
    document.body.dataset.glassMode = mode;
    if (toggle) {
      toggle.innerHTML = mode === 'dark' ? sun : moon;
      toggle.setAttribute('aria-label', mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    }
  };
  let saved = null;
  try { saved = localStorage.getItem(KEY); } catch {}
  setMode(saved === 'dark' || saved === 'light' ? saved : (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
  toggle?.addEventListener('click', () => {
    const next = root.dataset.glassMode === 'dark' ? 'light' : 'dark';
    setMode(next);
    try { localStorage.setItem(KEY, next); } catch {}
  });

  // Mobile menu
  const menu = document.querySelector('.glass-mobile-menu');
  const scrim = document.querySelector('.glass-mobile-scrim');
  const burger = document.querySelector('.glass-mobile-toggle');
  const setMenu = open => {
    menu?.classList.toggle('is-open', open);
    scrim?.classList.toggle('is-open', open);
    menu?.setAttribute('aria-hidden', String(!open));
    burger?.setAttribute('aria-expanded', String(open));
  };
  burger?.addEventListener('click', () => setMenu(!menu.classList.contains('is-open')));
  scrim?.addEventListener('click', () => setMenu(false));
  menu?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });

  // Reveal on scroll
  const blocks = document.querySelectorAll('.reveal-block');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('is-visible'); io.unobserve(entry.target); }
    }), { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    blocks.forEach(b => io.observe(b));
  } else blocks.forEach(b => b.classList.add('is-visible'));

  // FAQ
  document.querySelectorAll('.faq-item').forEach(item => {
    const trigger = item.querySelector('.faq-trigger');
    trigger?.addEventListener('click', () => {
      const open = !item.classList.contains('is-open');
      item.classList.toggle('is-open', open);
      trigger.setAttribute('aria-expanded', String(open));
      trigger.querySelector('strong').textContent = open ? '×' : '+';
      item.querySelector('.faq-answer')?.setAttribute('aria-hidden', String(!open));
    });
  });

  // Gentle hero parallax
  const photos = document.querySelectorAll('[data-parallax-photo]');
  if (photos.length && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    let ticking = false;
    const move = () => {
      photos.forEach(p => {
        const r = p.closest('[data-parallax-root]')?.getBoundingClientRect();
        if (r && r.bottom > 0 && r.top < innerHeight) p.style.transform = `translate3d(0, ${(r.top * -0.08).toFixed(1)}px, 0) scale(1.08)`;
      });
      ticking = false;
    };
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(move); } }, { passive: true });
    move();
  }

  // Hide any photo that fails to load rather than showing a broken icon
  document.querySelectorAll('img.pg-fill').forEach(img => img.addEventListener('error', () => img.classList.add('pg-broken')));

  // Estimate form: opens the visitor's email app with the message filled in
  document.querySelectorAll('form[data-mailto]').forEach(form => form.addEventListener('submit', e => {
    e.preventDefault();
    const d = new FormData(form);
    const name = `${d.get('first_name') || ''} ${d.get('last_name') || ''}`.trim();
    const lines = [
      `Name: ${name}`, `Email: ${d.get('email') || ''}`, `Phone: ${d.get('phone') || ''}`,
      `City: ${d.get('city') || ''}`, `Interested in: ${d.get('interest') || ''}`, '', d.get('details') || ''
    ];
    const subject = `Estimate request: ${d.get('interest') || 'Pool project'} (${name})`;
    location.href = `mailto:${form.dataset.mailto}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join('\n'))}`;
    const note = form.querySelector('.pg-form-note');
    if (note) note.textContent = 'Your email app should open with the message ready. If it doesn’t, email info@poolguysremodeling.com or call 626-961-9977.';
  }));
})();
