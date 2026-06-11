(function () {
  var button = document.querySelector(".menu-toggle");
  var nav = document.querySelector(".nav");

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
})();
