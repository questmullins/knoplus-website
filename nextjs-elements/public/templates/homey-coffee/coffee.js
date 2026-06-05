(function () {
  var header = document.querySelector(".coffee-header");
  var toggle = document.querySelector(".mobile-toggle");
  var panel = document.querySelector(".mobile-panel");
  var parallaxTargets = document.querySelectorAll("[data-parallax]");
  var revealTargets = document.querySelectorAll(".reveal");

  function updateHeader() {
    if (!header) {
      return;
    }

    header.classList.toggle("is-solid", window.scrollY > 30);
  }

  function updateParallax() {
    var viewportHeight = window.innerHeight || 1;

    parallaxTargets.forEach(function (target) {
      var rect = target.getBoundingClientRect();
      var progress = (rect.top - viewportHeight / 2) / viewportHeight;
      target.style.setProperty("--parallax-y", Math.max(-34, Math.min(34, progress * -42)) + "px");
    });
  }

  if (toggle && panel) {
    toggle.addEventListener("click", function () {
      var isOpen = panel.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(isOpen));
    });

    panel.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        panel.classList.remove("open");
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

  updateHeader();
  updateParallax();
  window.addEventListener("scroll", function () {
    updateHeader();
    updateParallax();
  }, { passive: true });
  window.addEventListener("resize", updateParallax);
})();
