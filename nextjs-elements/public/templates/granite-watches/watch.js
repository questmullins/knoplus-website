(function () {
  var entry = document.querySelector(".vault-entry");
  var enterButton = document.querySelector(".vault-entry button");
  var header = document.querySelector(".watch-header");
  var toggle = document.querySelector(".mobile-toggle");
  var drawer = document.querySelector(".mobile-drawer");
  var rail = document.querySelector(".scroll-rail span");
  var parallaxTargets = document.querySelectorAll("[data-parallax]");
  var revealTargets = document.querySelectorAll(".reveal");
  var watchItems = document.querySelectorAll(".watch-item");

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

  if (toggle && drawer) {
    toggle.addEventListener("click", function () {
      var isOpen = drawer.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(isOpen));
    });

    drawer.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        drawer.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      });
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
