(function () {
  var transitionKey = "knoplus:template-transition";
  var shouldReveal = false;
  var homeStyle = document.createElement("style");
  homeStyle.id = "knoplus-template-home-style";
  homeStyle.textContent = [
    ".knoplus-template-actions{",
    "position:fixed;left:50%;top:18px;transform:translateX(-50%);z-index:2147483645;",
    "display:grid;justify-items:center;gap:9px;font-family:Kanit,Arial,Helvetica,sans-serif;",
    "}",
    ".knoplus-template-home,.knoplus-template-choose{",
    "min-height:42px;padding:0 16px;display:inline-flex;align-items:center;justify-content:center;",
    "border:1px solid rgba(246,243,236,.38);background:rgba(5,5,6,.82);color:#f6f3ec;",
    "font-size:12px;font-weight:500;letter-spacing:.18em;line-height:1;text-decoration:none;text-transform:uppercase;",
    "backdrop-filter:blur(16px);box-shadow:0 16px 42px rgba(0,0,0,.32);",
    "transition:background .22s ease,color .22s ease,transform .22s ease;",
    "}",
    ".knoplus-template-choose{min-height:36px;padding:0 14px;font-size:10px;letter-spacing:.2em;cursor:pointer;}",
    ".knoplus-template-home:hover,.knoplus-template-home:focus-visible,.knoplus-template-choose:hover,.knoplus-template-choose:focus-visible{",
    "background:#f6f3ec;color:#050506;transform:translateY(-1px);",
    "}",
    ".knoplus-exit-transition{position:fixed;inset:0;z-index:2147483646;background:#050506;opacity:0;pointer-events:none;display:flex;align-items:center;justify-content:center;transition:opacity 720ms ease;}",
    ".knoplus-exit-transition::after{content:\"KNOPLUS\";color:#f6f3ec;font-family:Kanit,Arial,Helvetica,sans-serif;font-size:clamp(32px,4vw,54px);font-weight:500;letter-spacing:.12em;line-height:1;text-transform:uppercase;}",
    ".knoplus-exit-transition.active{opacity:1;pointer-events:auto;}",
    "@media (max-width:720px){.knoplus-template-actions{top:12px;}.knoplus-template-home{min-height:38px;padding:0 13px;font-size:10px;}.knoplus-template-choose{min-height:34px;font-size:9px;}}"
  ].join("");
  document.head.appendChild(homeStyle);

  function getTemplateName() {
    var path = window.location.pathname.toLowerCase();

    if (path.indexOf("cleaning-services") >= 0) {
      return "Cleaning Services";
    }

    if (path.indexOf("synergy") >= 0) {
      return path.indexOf("glass-colorful") >= 0 ? "Dark Luxury" : "Synergy";
    }

    if (path.indexOf("traditional-auto") >= 0) {
      return "Traditional Auto";
    }

    return "Traditional Auto";
  }

  function exitToKnoplus(destination) {
    var screen = document.querySelector(".knoplus-exit-transition");

    try {
      window.sessionStorage.setItem("knoplus:main-transition", "reveal");
    } catch {}

    if (!screen) {
      screen = document.createElement("div");
      screen.className = "knoplus-exit-transition";
      document.body.appendChild(screen);
    }

    window.requestAnimationFrame(function () {
      screen.classList.add("active");

      window.setTimeout(function () {
        window.location.href = destination;
      }, 820);
    });
  }

  function chooseTemplate() {
    try {
      window.sessionStorage.setItem("knoplus:selected-template", getTemplateName());
    } catch {}

    exitToKnoplus("/?contact=template");
  }

  function addTemplateActions() {
    if (document.querySelector(".knoplus-template-actions")) {
      return;
    }

    var wrapper = document.createElement("div");
    var choose = document.createElement("button");
    var link = document.createElement("a");

    wrapper.className = "knoplus-template-actions";
    link.className = "knoplus-template-home";
    link.href = "/";
    link.setAttribute("aria-label", "Return to Knoplus");
    link.textContent = "KNOPLUS";
    link.addEventListener("click", function (event) {
      event.preventDefault();
      exitToKnoplus("/");
    });
    choose.className = "knoplus-template-choose";
    choose.type = "button";
    choose.textContent = "Choose This Template";
    choose.addEventListener("click", chooseTemplate);

    wrapper.appendChild(link);
    wrapper.appendChild(choose);
    document.body.appendChild(wrapper);
  }

  if (document.body) {
    addTemplateActions();
  } else {
    document.addEventListener("DOMContentLoaded", addTemplateActions, { once: true });
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
    "z-index:2147483647;color:#f6f3ec;font-family:Kanit,Arial,Helvetica,sans-serif;",
    "font-size:clamp(32px,4vw,54px);font-weight:500;letter-spacing:.12em;line-height:1;",
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
