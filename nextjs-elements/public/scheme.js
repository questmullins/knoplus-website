// Light or dark: the visitor's own choice from a toggle, otherwise their system setting.
// Shared by kno.plus, Annex and the client page. Any element with data-scheme-toggle flips it.
(function () {
  var KEY = "kno-scheme";
  var root = document.documentElement;
  var system = window.matchMedia("(prefers-color-scheme: light)");

  function saved() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }
  function current() {
    var s = saved();
    return s === "light" || s === "dark" ? s : system.matches ? "light" : "dark";
  }
  function apply() {
    var s = current();
    root.setAttribute("data-scheme", s);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", s === "light" ? "#f6f3ec" : meta.getAttribute("data-dark") || "#050506");
  }
  function toggle() {
    var next = current() === "light" ? "dark" : "light";
    try {
      // Picking what the system already says goes back to following the system.
      if (next === (system.matches ? "light" : "dark")) localStorage.removeItem(KEY);
      else localStorage.setItem(KEY, next);
    } catch (e) {}
    apply();
  }

  window.knoScheme = { current: current, toggle: toggle };
  apply();
  if (system.addEventListener) system.addEventListener("change", apply);
  window.addEventListener("storage", function (e) { if (e.key === KEY) apply(); });
  document.addEventListener("click", function (e) {
    var button = e.target && e.target.closest ? e.target.closest("[data-scheme-toggle]") : null;
    if (!button) return;
    e.preventDefault();
    toggle();
  });
})();
