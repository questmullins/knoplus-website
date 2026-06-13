(function () {
  var categoryPanels = Array.prototype.slice.call(document.querySelectorAll(".category-panel"));
  var filterButtons = Array.prototype.slice.call(document.querySelectorAll(".filter-button"));
  var galleryItems = Array.prototype.slice.call(document.querySelectorAll(".gallery-item"));
  var galleryTitle = document.getElementById("gallery-title");
  var galleryDescription = document.getElementById("gallery-description");
  var portfolio = document.getElementById("portfolio");
  var ticking = false;

  var copy = {
    wild: {
      title: "Wild Places",
      description: "A collection of landscapes from remote corners of the world. Exploring the beauty and power of nature."
    },
    architecture: {
      title: "Architecture",
      description: "Clean lines, hard shadows, quiet interiors, and built environments photographed with restraint."
    },
    portraits: {
      title: "Portraits",
      description: "Editorial portraits with natural direction, soft movement, and a focus on presence over polish."
    },
    "still-life": {
      title: "Still Life",
      description: "Objects, texture, fabric, and light studies composed for brands, makers, and print collections."
    }
  };

  function setFilter(category, shouldScroll) {
    var selected = copy[category] ? category : "wild";

    categoryPanels.forEach(function (panel) {
      panel.classList.toggle("is-active", panel.dataset.filter === selected);
    });

    filterButtons.forEach(function (button) {
      button.classList.toggle("is-active", button.dataset.filter === selected);
    });

    galleryItems.forEach(function (item) {
      item.classList.toggle("is-hidden", item.dataset.category !== selected);
    });

    if (galleryTitle) {
      galleryTitle.textContent = copy[selected].title;
    }

    if (galleryDescription) {
      galleryDescription.textContent = copy[selected].description;
    }

    if (shouldScroll && portfolio) {
      portfolio.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  categoryPanels.forEach(function (panel) {
    panel.addEventListener("click", function () {
      setFilter(panel.dataset.filter, true);
    });
  });

  filterButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      setFilter(button.dataset.filter, false);
    });
  });

  function updateHeroParallax() {
    var viewportHeight = window.innerHeight || 1;

    categoryPanels.forEach(function (panel, index) {
      var rect = panel.getBoundingClientRect();
      var midpoint = rect.top + rect.height / 2;
      var distance = (midpoint - viewportHeight / 2) / viewportHeight;
      var drift = Math.max(-22, Math.min(22, distance * -34));
      var offset = drift + index * 1.5;

      panel.style.setProperty("--panel-y", offset + "px");
    });
  }

  function scheduleParallax() {
    if (ticking) {
      return;
    }

    ticking = true;

    window.requestAnimationFrame(function () {
      ticking = false;
      updateHeroParallax();
    });
  }

  setFilter("wild", false);
  updateHeroParallax();
  window.addEventListener("scroll", scheduleParallax, { passive: true });
  window.addEventListener("resize", scheduleParallax);
})();
