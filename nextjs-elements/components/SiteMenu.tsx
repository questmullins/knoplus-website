"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";

type SiteMenuProps = {
  className?: string;
  hideIcon?: boolean;
  onContact?: () => void;
  onNavigate?: (destination: string) => void;
  showLabel?: boolean;
};

const menuItems = [
  { label: "Home", href: "/" },
  { label: "Pricing", href: "/pricing" },
  { label: "Our Process", href: "/process" },
  { label: "About Us", href: "/about" }
];

export function SiteMenu({ className = "", hideIcon = false, onContact, onNavigate, showLabel = false }: SiteMenuProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const visibleMenuItems = onContact
    ? [
        ...menuItems,
        { label: "Contact Us", href: "#contact" }
      ]
    : menuItems;

  function handleInternalNavigation(destination: string) {
    setIsMenuOpen(false);

    if (onNavigate) {
      onNavigate(destination);
      return;
    }

    window.location.href = destination;
  }

  function handleContactClick() {
    setIsMenuOpen(false);
    onContact?.();
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
        {hideIcon ? null : <span className="menu-plus" />}
      </button>

      <div className={`menu-panel ${isMenuOpen ? "open" : ""}`}>
        <nav>
          {visibleMenuItems.map((item) => {
            const isActive = item.href === pathname;

            return (
              <button
                className={isActive ? "active" : ""}
                onClick={() => (item.href === "#contact" ? handleContactClick() : handleInternalNavigation(item.href))}
                type="button"
                key={item.href}
                aria-current={isActive ? "page" : undefined}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="menu-divider" />

        <div className="social-row">
          <a href="#" aria-label="Social profile">
            ig
          </a>
          <a href="#" aria-label="LinkedIn">
            in
          </a>
          <a href="mailto:quest@kno.plus" aria-label="Email">
            mail
          </a>
        </div>
      </div>
    </div>
  );
}
