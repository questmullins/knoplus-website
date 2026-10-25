(() => {
  if (window.__knoNavigation) return;
  window.__knoNavigation = true;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const style = document.createElement('link');
  style.rel = 'stylesheet'; style.href = '/navigation-transition.css';
  document.head.append(style);
  const screen = document.createElement('div');
  screen.className = 'kno-route-screen';
  screen.setAttribute('aria-hidden', 'true');
  screen.innerHTML = '<span>KNOPLUS</span>';
  document.body.append(screen);
  const scoped = () => /^\/(revamp|clients|trials)(\/|$)/.test(location.pathname);
  let busy = false;
  function navigate(href) {
    const url = new URL(href, location.href);
    if (url.origin !== location.origin || (url.pathname === location.pathname && url.search === location.search)) { location.assign(href); return; }
    if (busy) return;
    busy = true;
    try {
      sessionStorage.setItem('knoplus:route-reveal', 'yes');
      if (url.pathname.startsWith('/templates/')) {
        sessionStorage.setItem('knoplus:template-transition', 'reveal');
        sessionStorage.setItem('knoplus:template-return', location.href);
      }
    } catch {}
    screen.classList.add('show');
    setTimeout(() => location.assign(url.href), reduced.matches ? 0 : 620);
  }
  window.addEventListener('knoplus:navigate', event => navigate(event.detail));
  document.addEventListener('click', event => {
    const link = event.target.closest?.('a[href]');
    if (!scoped() || !link || link.target === '_blank' || link.hasAttribute('download') || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const url = new URL(link.href, location.href);
    if (url.origin !== location.origin || !/^https?:$/.test(url.protocol) || (url.pathname === location.pathname && url.search === location.search)) return;
    event.preventDefault(); event.stopImmediatePropagation(); navigate(url.href);
  }, true);
  try {
    if (sessionStorage.getItem('knoplus:route-reveal') === 'yes') {
      sessionStorage.removeItem('knoplus:route-reveal');
      screen.classList.add('show');
      setTimeout(() => screen.classList.remove('show'), reduced.matches ? 0 : 180);
    }
  } catch {}
  window.addEventListener('pageshow', () => { busy = false; screen.classList.remove('show'); });
})();
