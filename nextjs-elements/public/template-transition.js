(function () {
  var transitionKey = "knoplus:template-transition";
  var shouldReveal = false;

  try {
    shouldReveal = window.sessionStorage.getItem(transitionKey) === "reveal";
    window.sessionStorage.removeItem(transitionKey);
  } catch {
    shouldReveal = false;
  }

  if (!shouldReveal) {
    return;
  }

  var style = document.createElement("style");
  style.id = "knoplus-template-transition-style";
  style.textContent = [
    "html.knoplus-template-transition-active,",
    "html.knoplus-template-transition-active body{overflow:hidden;}",
    "html.knoplus-template-transition-active::before{",
    "content:\"\";position:fixed;inset:0;background:#050506;z-index:2147483646;",
    "opacity:1;transition:opacity 920ms ease;pointer-events:none;",
    "}",
    "html.knoplus-template-transition-active::after{",
    "content:\"KNOPLUS\";position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);",
    "z-index:2147483647;color:#f6f3ec;font-family:Arial,Helvetica,sans-serif;",
    "font-size:clamp(24px,5vw,48px);font-weight:600;letter-spacing:.28em;",
    "opacity:1;transition:opacity 620ms ease;pointer-events:none;",
    "}",
    "html.knoplus-template-transition-active.knoplus-template-transition-fade::before,",
    "html.knoplus-template-transition-active.knoplus-template-transition-fade::after{opacity:0;}"
  ].join("");

  document.head.appendChild(style);
  document.documentElement.classList.add("knoplus-template-transition-active");

  var hasRevealed = false;

  function revealTemplate() {
    if (hasRevealed) {
      return;
    }

    hasRevealed = true;

    window.setTimeout(function () {
      document.documentElement.classList.add("knoplus-template-transition-fade");

      window.setTimeout(function () {
        document.documentElement.classList.remove("knoplus-template-transition-active");
        document.documentElement.classList.remove("knoplus-template-transition-fade");
        style.remove();
      }, 980);
    }, 160);
  }

  if (document.readyState === "complete") {
    revealTemplate();
  } else {
    window.addEventListener("load", revealTemplate, { once: true });
    window.setTimeout(revealTemplate, 1800);
  }
})();
