(() => {
  // The KNOPLUS screen only plays on the way into a website template; every other link navigates straight away.
  if (window.__knoNavigation) return;
  window.__knoNavigation = true;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const isTemplate = url => url.origin === location.origin && url.pathname.startsWith('/templates/');
  let screen;
  function showScreen() {
    if (!screen) {
      const style = document.createElement('link');
      style.rel = 'stylesheet'; style.href = '/navigation-transition.css';
      document.head.append(style);
      screen = document.createElement('div');
      screen.className = 'kno-route-screen';
      screen.setAttribute('aria-hidden', 'true');
      screen.innerHTML = '<span>KNOPLUS</span>';
      document.body.append(screen);
      screen.getBoundingClientRect();
    }
    screen.classList.add('show');
  }
  let busy = false;
  function navigate(href) {
    const url = new URL(href, location.href);
    if (!isTemplate(url) || (url.pathname === location.pathname && url.search === location.search)) { location.assign(href); return; }
    if (busy) return;
    busy = true;
    try {
      sessionStorage.setItem('knoplus:template-transition', 'reveal');
      sessionStorage.setItem('knoplus:template-return', location.href);
    } catch {}
    showScreen();
    setTimeout(() => location.assign(url.href), reduced.matches ? 0 : 620);
  }
  window.addEventListener('knoplus:navigate', event => navigate(event.detail));
  document.addEventListener('click', event => {
    const link = event.target.closest?.('a[href]');
    if (!link || link.target === '_blank' || link.hasAttribute('download') || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const url = new URL(link.href, location.href);
    // /websites runs its own longer transition into a template.
    if (!isTemplate(url) || location.pathname.startsWith('/websites')) return;
    event.preventDefault(); event.stopImmediatePropagation(); navigate(url.href);
  }, true);
  window.addEventListener('pageshow', () => { busy = false; screen?.classList.remove('show'); });
})();
