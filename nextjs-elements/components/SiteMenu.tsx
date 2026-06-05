"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";

type SiteMenuProps = {
  className?: string;
  onNavigate?: (destination: string) => void;
  showLabel?: boolean;
};

const menuItems = [
  { label: "Home", href: "/" },
  { label: "About Us", href: "/about" },
  { label: "Our Process", href: "/process" },
  { label: "Pricing", href: "/pricing" }
];

export function SiteMenu({ className = "", onNavigate, showLabel = false }: SiteMenuProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  function handleInternalNavigation(destination: string) {
    setIsMenuOpen(false);

    if (onNavigate) {
      onNavigate(destination);
      return;
    }

    window.location.href = destination;
  }

  return (
    <div className={`site-menu ${className}`.trim()}>
      <button
        className={`top-menu ${isMenuOpen ? "open" : ""}`}
        aria-label="Open menu"
        onClick={() => setIsMenuOpen((isOpen) => !isOpen)}
        type="button"
      >
        {showLabel ? <span className="top-menu-text">Menu</span> : null}
        <span className="menu-plus" />
      </button>

      <div className={`menu-panel ${isMenuOpen ? "open" : ""}`}>
        <nav>
          {menuItems
            .filter((item) => item.href !== pathname)
            .map((item) => (
              <button onClick={() => handleInternalNavigation(item.href)} type="button" key={item.href}>
                {item.label}
              </button>
            ))}
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
    </div>
  );
}
