(function () {
  var pages = [
    { label: "Home", href: "./index.html", match: ["index.html", "/lawrence-autorepair/"] },
    { label: "Services", href: "./services.html", match: ["services"] },
    { label: "Knowledge", href: "./knowledgebase.html", match: ["knowledgebase"] },
    { label: "Reviews", href: "./testimonial.html", match: ["testimonial"] },
    { label: "Contact", href: "./contact.html", match: ["contact"] }
  ];

  function isCurrent(item) {
    var path = window.location.pathname.toLowerCase();

    if (item.label === "Home") {
      return path.endsWith("/lawrence-autorepair/") || path.endsWith("/lawrence-autorepair/index.html");
    }

    return item.match.some(function (part) {
      return path.indexOf(part) >= 0;
    });
  }

  function injectStyles() {
    if (document.getElementById("lawrence-menu-style")) {
      return;
    }

    var style = document.createElement("style");
    style.id = "lawrence-menu-style";
    style.textContent = [
      ".lawrence-header{min-height:118px;padding:0 36px;background:linear-gradient(180deg,#0711a6,#000012);color:#fff;display:flex;align-items:center;justify-content:space-between;gap:34px;border-bottom:2px solid rgba(255,255,0,.42);position:sticky;top:0;z-index:40;font-family:Outfit,Arial,Helvetica,sans-serif;}",
      ".lawrence-logo{line-height:.82;font-size:clamp(30px,3vw,38px);font-weight:950;font-style:italic;letter-spacing:-1px;color:#fff;text-transform:uppercase;text-decoration:none;}",
      ".lawrence-logo .accent{color:#ffff00;}",
      ".lawrence-logo small{display:block;margin-top:9px;font-size:12px;letter-spacing:7px;font-style:normal;color:#ffff00;}",
      ".lawrence-nav{display:flex;align-items:center;gap:clamp(18px,2.6vw,38px);font-size:14px;font-weight:950;text-transform:uppercase;}",
      ".lawrence-nav a{display:inline-flex;align-items:center;gap:8px;color:rgba(255,255,255,.94);text-decoration:none;letter-spacing:.02em;}",
      ".lawrence-nav a:hover,.lawrence-nav a:focus-visible,.lawrence-nav a[aria-current='page']{color:#ffff00;}",
      ".lawrence-menu-toggle{display:none;}",
      "@media(max-width:760px){.lawrence-header{min-height:78px;padding:18px 24px;flex-wrap:wrap;align-items:center;gap:18px;}.lawrence-logo{font-size:30px;}.lawrence-menu-toggle{display:inline-flex;margin-left:auto;width:48px;height:42px;border:1px solid rgba(255,255,0,.46);background:rgba(48,196,223,.16);align-items:center;justify-content:center;padding:0;}.lawrence-menu-toggle span{width:24px;height:13px;display:grid;align-content:space-between;}.lawrence-menu-toggle i{display:block;height:2px;background:#ffff00;}.lawrence-nav{order:4;width:100%;display:grid;gap:0;max-height:0;overflow:hidden;transition:max-height .24s ease;}.lawrence-nav.is-open{max-height:320px;}.lawrence-nav a{padding:14px 0;border-top:1px solid rgba(255,255,0,.18);}}"
    ].join("");

    document.head.appendChild(style);
  }

  function renderHeader() {
    return [
      '<header class="lawrence-header">',
      '<a class="lawrence-logo" href="./index.html">Lawrence<span class="accent"> Auto</span><small>Repair</small></a>',
      '<button class="lawrence-menu-toggle" type="button" aria-label="Open menu" aria-expanded="false"><span><i></i><i></i><i></i></span></button>',
      '<nav class="lawrence-nav" aria-label="Primary">',
      pages.map(function (item) {
        return '<a href="' + item.href + '"' + (isCurrent(item) ? ' aria-current="page"' : "") + ">" + item.label + "</a>";
      }).join(""),
      "</nav>",
      "</header>"
    ].join("");
  }

  function installHeader() {
    injectStyles();

    var target = document.querySelector("[data-lawrence-menu]") || document.querySelector(".header") || document.querySelector(".site-header");

    if (!target) {
      return;
    }

    target.outerHTML = renderHeader();

    var button = document.querySelector(".lawrence-menu-toggle");
    var nav = document.querySelector(".lawrence-nav");

    if (!button || !nav) {
      return;
    }

    button.addEventListener("click", function () {
      var isOpen = nav.classList.toggle("is-open");
      button.setAttribute("aria-expanded", String(isOpen));
      button.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
    });

    nav.addEventListener("click", function (event) {
      if (event.target && event.target.tagName === "A") {
        nav.classList.remove("is-open");
        button.setAttribute("aria-expanded", "false");
        button.setAttribute("aria-label", "Open menu");
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", installHeader, { once: true });
  } else {
    installHeader();
  }
})();
