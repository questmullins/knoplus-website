(function () {
  var categoryStack = document.querySelector("[data-category-stack]");
  var filterList = document.querySelector("[data-filter-list]");
  var galleryGrid = document.querySelector("[data-gallery-grid]");
  var galleryTitle = document.getElementById("gallery-title");
  var galleryDescription = document.getElementById("gallery-description");
  var portfolio = document.getElementById("portfolio");
  var header = document.querySelector(".photo-header");
  var menuToggle = document.querySelector(".menu-toggle");
  var photoNav = document.querySelector(".photo-nav");
  var motionTuner = document.querySelector(".motion-tuner");
  var motionTunerToggle = document.querySelector(".motion-tuner-toggle");
  var tuneInputs = Array.prototype.slice.call(document.querySelectorAll("[data-tune]"));
  var categoryPanels = [];
  var filterButtons = [];
  var galleryItems = [];
  var categories = [];
  var pressedPanel = null;
  var focusPoint = 50;
  var ticking = false;

  var fallbackCategories = [
    {
      slug: "wild-places",
      title: "Wild Places",
      description: "A collection of landscapes from remote corners of the world. Exploring the beauty and power of nature.",
      hero1: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=2200&q=84",
      hero2: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1500&q=84",
      images: [
        image("https://images.unsplash.com/photo-1483728642387-6c3bdd6c93e5?auto=format&fit=crop&w=1200&q=84", "The Highlands", "Hiker standing near sharp mountain peaks"),
        image("https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1200&q=84", "Coastal Roads", "Winding coastal road"),
        image("https://images.unsplash.com/photo-1509316785289-025f5b846b35?auto=format&fit=crop&w=1200&q=84", "Desert Dunes", "Person walking through desert dunes"),
        image("https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=84", "Forest Walks", "Forest path with tall trees")
      ]
    },
    {
      slug: "architecture",
      title: "Architecture",
      description: "Clean lines, hard shadows, quiet interiors, and built environments photographed with restraint.",
      hero1: "https://images.unsplash.com/photo-1511818966892-d7d671e672a2?auto=format&fit=crop&w=2200&q=84",
      hero2: "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1500&q=84",
      images: [
        image("https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=1200&q=84", "Facade Study", "Geometric modern building"),
        image("https://images.unsplash.com/photo-1511818966892-d7d671e672a2?auto=format&fit=crop&w=1200&q=84", "Courtyard Palm", "Plant shadows on architectural wall")
      ]
    },
    {
      slug: "portraits",
      title: "Portraits",
      description: "Editorial portraits with natural direction, soft movement, and a focus on presence over polish.",
      hero1: "https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?auto=format&fit=crop&w=2200&q=84",
      hero2: "https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?auto=format&fit=crop&w=1500&q=84",
      images: [
        image("https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=1200&q=84", "Soft Direction", "Editorial portrait in natural light"),
        image("https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1200&q=84", "Studio Quiet", "Studio portrait with clean styling")
      ]
    },
    {
      slug: "still-life",
      title: "Still Life",
      description: "Objects, texture, fabric, and light studies composed for brands, makers, and print collections.",
      hero1: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=2200&q=84",
      hero2: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1500&q=84",
      images: [
        image("https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=1200&q=84", "Linen Study", "Minimal linen still life"),
        image("https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?auto=format&fit=crop&w=1200&q=84", "Window Object", "Plant and object still life")
      ]
    }
  ];

  function image(src, caption, alt) {
    return { src: src, caption: caption, alt: alt };
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function cssUrl(value) {
    return "url('" + String(value || "").replace(/'/g, "\\'") + "')";
  }

  function getGalleryImages(category) {
    var output = [];

    if (category.hero2) {
      output.push({
        src: category.hero2,
        caption: category.title + " Hero",
        alt: category.title + " featured photograph",
        featured: true
      });
    }

    return output.concat(category.images || []);
  }

  function render() {
    if (!categoryStack || !filterList || !galleryGrid || !categories.length) {
      return;
    }

    categoryStack.innerHTML = categories
      .map(function (category, index) {
        var hero = category.hero1 || category.hero2 || (category.images && category.images[0] && category.images[0].src) || "";

        return (
          '<button class="category-panel' +
          (index === 0 ? " is-active" : "") +
          '" type="button" data-filter="' +
          escapeHtml(category.slug) +
          '" style="--image: ' +
          cssUrl(hero) +
          ';">' +
          '<span class="category-number">' +
          String(index + 1).padStart(2, "0") +
          "</span>" +
          '<span class="category-title">' +
          escapeHtml(category.title) +
          "</span>" +
          '<span class="category-action">View Gallery</span>' +
          "</button>"
        );
      })
      .join("");

    filterList.innerHTML = categories
      .map(function (category, index) {
        return (
          "<li>" +
          '<button class="filter-button' +
          (index === 0 ? " is-active" : "") +
          '" type="button" data-filter="' +
          escapeHtml(category.slug) +
          '">' +
          escapeHtml(category.title) +
          "</button>" +
          "</li>"
        );
      })
      .join("");

    galleryGrid.innerHTML = categories
      .map(function (category) {
        return getGalleryImages(category)
          .map(function (item, index) {
            var modifier = item.featured || index === 0 ? " wide" : index % 4 === 1 ? " tall" : "";

            return (
              '<figure class="gallery-item' +
              modifier +
              '" data-category="' +
              escapeHtml(category.slug) +
              '">' +
              '<img src="' +
              escapeHtml(item.src) +
              '" alt="' +
              escapeHtml(item.alt || item.caption || category.title) +
              '" loading="lazy">' +
              "<figcaption>" +
              escapeHtml(item.caption || category.title) +
              "</figcaption>" +
              "</figure>"
            );
          })
          .join("");
      })
      .join("");

    categoryPanels = Array.prototype.slice.call(document.querySelectorAll(".category-panel"));
    filterButtons = Array.prototype.slice.call(document.querySelectorAll(".filter-button"));
    galleryItems = Array.prototype.slice.call(document.querySelectorAll(".gallery-item"));

    categoryPanels.forEach(function (panel) {
      panel.addEventListener("click", function () {
        setFilter(panel.dataset.filter, true);
      });

      panel.addEventListener("pointerdown", function () {
        pressedPanel = panel;
        updateHeroParallax();
      });

      panel.addEventListener("pointerup", function () {
        if (pressedPanel === panel) {
          pressedPanel = null;
          updateHeroParallax();
        }
      });

      panel.addEventListener("pointercancel", function () {
        if (pressedPanel === panel) {
          pressedPanel = null;
          updateHeroParallax();
        }
      });

      panel.addEventListener("pointerleave", function () {
        if (pressedPanel === panel) {
          pressedPanel = null;
          updateHeroParallax();
        }
      });
    });

    filterButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        setFilter(button.dataset.filter, false);
      });
    });

    setFilter(categories[0].slug, false);
    updateHeroParallax();
  }

  function getCategory(slug) {
    return categories.find(function (category) {
      return category.slug === slug;
    });
  }

  function setFilter(category, shouldScroll) {
    var selected = getCategory(category) ? category : categories[0].slug;
    var selectedCategory = getCategory(selected);

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
      galleryTitle.textContent = selectedCategory.title;
    }

    if (galleryDescription) {
      galleryDescription.textContent = selectedCategory.description;
    }

    if (shouldScroll && portfolio) {
      portfolio.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function updateHeroParallax() {
    var viewportHeight = window.innerHeight || 1;
    var isMobile = window.matchMedia("(max-width: 900px)").matches;
    var headerOffset = header && isMobile ? header.getBoundingClientRect().height : 0;
    var targetCenter = headerOffset + (viewportHeight - headerOffset) * (focusPoint / 100);
    var closestPanel = null;
    var closestDistance = Infinity;

    categoryPanels.forEach(function (panel, index) {
      var rect = panel.getBoundingClientRect();
      var midpoint = rect.top + rect.height / 2;
      var distance = (midpoint - viewportHeight / 2) / viewportHeight;
      var absoluteDistance = Math.abs(midpoint - targetCenter);
      var drift = Math.max(-22, Math.min(22, distance * -34));
      var offset = drift + index * 1.5;

      if (absoluteDistance < closestDistance) {
        closestDistance = absoluteDistance;
        closestPanel = panel;
      }

      panel.style.setProperty("--panel-y", offset + "px");
    });

    categoryPanels.forEach(function (panel) {
      panel.classList.toggle("is-pressed", pressedPanel === panel);
      panel.classList.toggle("is-centered", isMobile && !pressedPanel && panel === closestPanel);
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

  function closeMenu() {
    if (!header || !menuToggle) {
      return;
    }

    header.classList.remove("is-menu-open");
    menuToggle.setAttribute("aria-expanded", "false");
  }

  if (menuToggle && header) {
    menuToggle.addEventListener("click", function () {
      var isOpen = header.classList.toggle("is-menu-open");
      menuToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });
  }

  if (photoNav) {
    Array.prototype.slice.call(photoNav.querySelectorAll("a")).forEach(function (link) {
      link.addEventListener("click", closeMenu);
    });
  }

  function getTuneValue(name, fallback) {
    var input = tuneInputs.find(function (item) {
      return item.dataset.tune === name;
    });

    return input ? parseFloat(input.value) : fallback;
  }

  function setOutput(name, value) {
    var output = document.querySelector('[data-output="' + name + '"]');

    if (output) {
      output.textContent = value;
    }
  }

  function applyMotionTuning() {
    var duration = getTuneValue("duration", 1.62);
    var x1 = getTuneValue("x1", 0.16);
    var y1 = getTuneValue("y1", 1);
    var x2 = getTuneValue("x2", 0.28);
    var y2 = getTuneValue("y2", 1);

    focusPoint = getTuneValue("focus", 50);

    document.documentElement.style.setProperty("--hero-focus-point", focusPoint);
    document.documentElement.style.setProperty("--hero-expand-duration", duration + "s");
    document.documentElement.style.setProperty("--hero-expand-ease", "cubic-bezier(" + x1 + ", " + y1 + ", " + x2 + ", " + y2 + ")");

    setOutput("focus", Math.round(focusPoint) + "%");
    setOutput("duration", duration.toFixed(2) + "s");
    setOutput("x1", x1.toFixed(2));
    setOutput("y1", y1.toFixed(2));
    setOutput("x2", x2.toFixed(2));
    setOutput("y2", y2.toFixed(2));
    updateHeroParallax();
  }

  if (motionTunerToggle && motionTuner) {
    motionTunerToggle.addEventListener("click", function () {
      var isOpen = motionTuner.classList.toggle("is-open");
      motionTunerToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });
  }

  tuneInputs.forEach(function (input) {
    input.addEventListener("input", applyMotionTuning);
  });

  function normalizeCategories(manifest) {
    if (!manifest || !Array.isArray(manifest.categories) || manifest.categories.length === 0) {
      return fallbackCategories;
    }

    return manifest.categories.map(function (category) {
      return {
        slug: category.slug,
        title: category.title,
        description: category.description || category.title + " portfolio selections.",
        hero1: category.hero1,
        hero2: category.hero2,
        images: Array.isArray(category.images) ? category.images : []
      };
    });
  }

  fetch("./photo-manifest.json", { cache: "no-cache" })
    .then(function (response) {
      if (!response.ok) {
        throw new Error("No photo manifest found.");
      }

      return response.json();
    })
    .then(function (manifest) {
      categories = normalizeCategories(manifest);
      render();
    })
    .catch(function () {
      categories = fallbackCategories;
      render();
    });

  window.addEventListener("scroll", scheduleParallax, { passive: true });
  window.addEventListener("resize", scheduleParallax);
  applyMotionTuning();
})();
