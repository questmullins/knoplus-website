(function () {
  var entry = document.querySelector(".vault-entry");
  var enterButton = document.querySelector(".vault-entry button");
  var header = document.querySelector(".watch-header");
  var watchMenu = document.querySelector("[data-watch-menu]");
  var menuToggle = document.querySelector(".watch-menu-toggle");
  var menuLinks = watchMenu ? watchMenu.querySelectorAll(".watch-orbit a") : [];
  var rail = document.querySelector(".scroll-rail span");
  var parallaxTargets = document.querySelectorAll("[data-parallax]");
  var revealTargets = document.querySelectorAll(".reveal");
  var watchItems = document.querySelectorAll(".watch-item");
  var watchSections = document.querySelectorAll(".watch-section");
  var revealedSections = new WeakSet();

  function openVault() {
    if (!entry) {
      return;
    }

    entry.classList.add("is-hidden");
    document.body.classList.remove("is-locked");
    try {
      window.sessionStorage.setItem("granite-watches:entered", "true");
    } catch {}
  }

  function updateScrollState() {
    var max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    var progress = Math.max(0, Math.min(1, window.scrollY / max));

    if (header) {
      header.classList.toggle("is-solid", window.scrollY > 30);
    }

    if (rail) {
      rail.style.setProperty("--scroll-progress", progress * 100 + "%");
    }

    parallaxTargets.forEach(function (target) {
      var rect = target.getBoundingClientRect();
      var viewportHeight = window.innerHeight || 1;
      var sectionProgress = (rect.top - viewportHeight / 2) / viewportHeight;
      target.style.setProperty("--parallax-y", Math.max(-36, Math.min(36, sectionProgress * -44)) + "px");
    });

    var closest = null;
    var closestDistance = Infinity;
    var closestSection = null;
    var closestSectionDistance = Infinity;

    watchItems.forEach(function (item) {
      var rect = item.getBoundingClientRect();
      var distance = Math.abs(rect.top + rect.height / 2 - window.innerHeight / 2);

      if (distance < closestDistance) {
        closestDistance = distance;
        closest = item;
      }
    });

    watchItems.forEach(function (item) {
      item.classList.toggle("active", item === closest);
    });

    watchSections.forEach(function (section) {
      var rect = section.getBoundingClientRect();
      var distance = Math.abs(rect.top + rect.height / 2 - window.innerHeight / 2);

      if (distance < closestSectionDistance) {
        closestSectionDistance = distance;
        closestSection = section;
      }
    });

    watchSections.forEach(function (section) {
      if (section === closestSection) {
        section.classList.add("is-active");
        section.classList.add("is-revealed");
        revealedSections.add(section);
      } else {
        section.classList.remove("is-active");
        if (revealedSections.has(section)) {
          section.classList.add("is-revealed");
        }
      }
    });
  }

  if (entry) {
    var hasEntered = false;

    try {
      hasEntered = window.sessionStorage.getItem("granite-watches:entered") === "true";
    } catch {}

    if (hasEntered || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      openVault();
    } else {
      document.body.classList.add("is-locked");
    }
  }

  if (enterButton) {
    enterButton.addEventListener("click", openVault);
  }

  function setMenuAngle(link) {
    if (!watchMenu || !link) {
      return;
    }

    var angle = link.getAttribute("data-angle") || "-72";
    watchMenu.style.setProperty("--hand-angle", angle + "deg");

    menuLinks.forEach(function (menuLink) {
      menuLink.classList.toggle("active", menuLink === link);
    });
  }

  if (watchMenu && menuToggle) {
    menuToggle.addEventListener("click", function () {
      var isOpen = !watchMenu.classList.contains("open");
      watchMenu.classList.toggle("open", isOpen);
      menuToggle.setAttribute("aria-expanded", String(isOpen));
    });

    menuLinks.forEach(function (link) {
      var linkUrl = new URL(link.href, window.location.href);
      var currentPath = window.location.pathname.split("/").pop() || "index.html";
      var linkPath = linkUrl.pathname.split("/").pop() || "index.html";

      if (currentPath === linkPath) {
        setMenuAngle(link);
      }

      link.addEventListener("click", function (event) {
        event.preventDefault();
        setMenuAngle(link);

        if (currentPath === linkPath) {
          window.setTimeout(function () {
            watchMenu.classList.remove("open");
            menuToggle.setAttribute("aria-expanded", "false");
          }, 240);
          return;
        }

        window.setTimeout(function () {
          window.location.href = link.href;
        }, 420);
      });
    });

    document.addEventListener("click", function (event) {
      if (!watchMenu.contains(event.target) && watchMenu.classList.contains("open")) {
        watchMenu.classList.remove("open");
        menuToggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  if ("IntersectionObserver" in window) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.18 }
    );

    revealTargets.forEach(function (target) {
      observer.observe(target);
    });
  } else {
    revealTargets.forEach(function (target) {
      target.classList.add("visible");
    });
  }

  updateScrollState();
  window.addEventListener("scroll", updateScrollState, { passive: true });
  window.addEventListener("resize", updateScrollState);
})();
