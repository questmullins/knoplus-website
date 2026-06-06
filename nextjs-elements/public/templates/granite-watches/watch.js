(function () {
  var header = document.querySelector(".watch-header");
  var rail = document.querySelector(".scroll-rail span");
  var parallaxTargets = document.querySelectorAll("[data-parallax]");
  var windowTargets = document.querySelectorAll("[data-window-parallax]");
  var watchItems = document.querySelectorAll(".watch-item");
  var watchSections = document.querySelectorAll(".watch-section");

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

    windowTargets.forEach(function (target) {
      var rect = target.getBoundingClientRect();
      var viewportHeight = window.innerHeight || 1;
      var imageProgress = (rect.top - viewportHeight / 2) / viewportHeight;
      target.style.setProperty("--window-y", Math.max(-34, Math.min(34, imageProgress * -54)) + "px");
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
      } else {
        section.classList.remove("is-active");
      }
    });
  }

  updateScrollState();
  window.addEventListener("scroll", updateScrollState, { passive: true });
  window.addEventListener("resize", updateScrollState);
})();
