(function () {
  var transitionKey = "knoplus:template-transition";
  var shouldReveal = false;
  var homeStyle = document.createElement("style");
  homeStyle.id = "knoplus-template-home-style";
  homeStyle.textContent = [
    ".knoplus-template-home{",
    "position:fixed;left:20px;top:20px;z-index:2147483645;",
    "min-height:42px;padding:0 16px;display:inline-flex;align-items:center;justify-content:center;",
    "border:1px solid rgba(246,243,236,.38);background:rgba(5,5,6,.78);color:#f6f3ec;",
    "font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:700;letter-spacing:.24em;",
    "text-decoration:none;text-transform:uppercase;backdrop-filter:blur(16px);",
    "box-shadow:0 16px 42px rgba(0,0,0,.28);transition:background .22s ease,color .22s ease,transform .22s ease;",
    "}",
    ".knoplus-template-home:hover,.knoplus-template-home:focus-visible{",
    "background:#f6f3ec;color:#050506;transform:translateY(-1px);",
    "}",
    "@media (max-width:720px){.knoplus-template-home{left:14px;top:14px;min-height:38px;padding:0 13px;font-size:10px;}}"
  ].join("");
  document.head.appendChild(homeStyle);

  function addHomeButton() {
    if (document.querySelector(".knoplus-template-home")) {
      return;
    }

    var link = document.createElement("a");
    link.className = "knoplus-template-home";
    link.href = "/";
    link.setAttribute("aria-label", "Return to Knoplus");
    link.textContent = "KNOPLUS";
    document.body.appendChild(link);
  }

  if (document.body) {
    addHomeButton();
  } else {
    document.addEventListener("DOMContentLoaded", addHomeButton, { once: true });
  }

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
