"use client";

import { useState } from "react";

type SiteMenuProps = {
  onNavigate?: (destination: string) => void;
};

export function SiteMenu({ onNavigate }: SiteMenuProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  function handleInternalNavigation(destination: string) {
    if (onNavigate) {
      onNavigate(destination);
      return;
    }

    window.location.href = destination;
  }

  return (
    <>
      <button
        className={`top-menu ${isMenuOpen ? "open" : ""}`}
        aria-label="Open menu"
        onClick={() => setIsMenuOpen((isOpen) => !isOpen)}
        type="button"
      >
        <span className="menu-plus" />
      </button>

      <div className={`menu-panel ${isMenuOpen ? "open" : ""}`}>
        <nav>
          <a href="#">About Us</a>
          <a href="#">Our Process</a>
          <button onClick={() => handleInternalNavigation("/pricing")} type="button">
            Pricing
          </button>
          <a href="#">FAQ</a>
          <a href="mailto:knopluswebsites@gmail.com">Contact Us</a>
        </nav>

        <div className="menu-divider" />

        <div className="social-row">
          <a href="#" aria-label="Social profile">
            ig
          </a>
          <a href="#" aria-label="LinkedIn">
            in
          </a>
          <a href="mailto:knopluswebsites@gmail.com" aria-label="Email">
            mail
          </a>
        </div>
      </div>
    </>
  );
}
