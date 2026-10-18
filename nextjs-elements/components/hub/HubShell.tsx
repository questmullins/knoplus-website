"use client";

import type { CSSProperties, ReactNode } from "react";
import { useState } from "react";
import Link from "next/link";
import { ContactModal } from "../ContactModal";
import type { ProjectScreen } from "@/data/projects";

export type NavLink = {
  label: string;
  href: string;
};

type HubShellProps = {
  accent?: string;
  accentInk?: string;
  links: NavLink[];
  cta?: NavLink;
  children: ReactNode;
};

// The page frame every hub page shares, modelled on the Synergy template: a floating pill nav over a soft wash
// tinted with the project's colour.
export function HubShell({ accent = "#f0717f", accentInk = "#1b1418", links, cta, children }: HubShellProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);

  return (
    <div className="hub" style={{ "--hub-accent": accent, "--hub-accent-ink": accentInk } as CSSProperties}>
      <header className="hub-header">
        <Link className="hub-logo" href="/" aria-label="Knoplus projects">
          KNOPLUS
        </Link>
        <nav className={`hub-pill ${isMenuOpen ? "open" : ""}`} aria-label="Page">
          <button
            className="hub-pill-toggle"
            type="button"
            aria-expanded={isMenuOpen}
            onClick={() => setIsMenuOpen((open) => !open)}
          >
            Menu
          </button>
          <div className="hub-pill-links">
            {links.map((link) => (
              <a href={link.href} key={link.href} onClick={() => setIsMenuOpen(false)}>
                {link.label}
              </a>
            ))}
            <button type="button" onClick={() => setIsContactOpen(true)}>
              Contact
            </button>
          </div>
          {cta ? (
            <a className="hub-pill-cta" href={cta.href}>
              {cta.label}
            </a>
          ) : null}
        </nav>
      </header>

      {children}

      <footer className="hub-footer">
        <div>
          <Link className="hub-logo" href="/">
            KNOPLUS
          </Link>
          <p>Know More. Know Better. Knoplus.</p>
        </div>
        <nav aria-label="Footer">
          <Link href="/">Projects</Link>
          <Link href="/websites">Websites</Link>
          <Link href="/sitemap">Sitemap</Link>
          <button type="button" onClick={() => setIsContactOpen(true)}>
            Contact
          </button>
        </nav>
      </footer>

      <ContactModal isOpen={isContactOpen} onClose={() => setIsContactOpen(false)} />
    </div>
  );
}

export function Device({ screen, priority = false }: { screen: ProjectScreen; priority?: boolean }) {
  if (screen.frame === "browser") {
    return (
      <figure className="hub-browser">
        <div className="hub-browser-bar" aria-hidden="true">
          <i />
          <i />
          <i />
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img alt={screen.alt} loading={priority ? "eager" : "lazy"} src={screen.src} />
      </figure>
    );
  }

  return (
    <figure className="hub-phone">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img alt={screen.alt} loading={priority ? "eager" : "lazy"} src={screen.src} />
    </figure>
  );
}

// Prepress Assistant has no screenshots to show, so its art is a drawn panel and the vectors it makes.
export function PrepressArt() {
  const bars = [
    1, 0, 1, 0, 0, 1, 1, 0, 1, 1, 0, 0, 1, 0, 1, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 0,
    0, 1, 1, 0, 1, 0, 1, 0, 0, 1, 1, 1, 0, 1, 0, 1
  ];

  return (
    <div className="prepress-art" aria-hidden="true">
      <div className="prepress-panel">
        <div className="prepress-panel-bar">
          <i />
          Signed in
        </div>
        <div className="prepress-row">
          <span>Last 5 digits</span>
          <b>
            •••••<em>Load</em>
          </b>
        </div>
        <div className="prepress-row">
          <span>Magnification</span>
          <b>100%</b>
        </div>
        <div className="prepress-row">
          <span>Bar height</span>
          <b>22.85 mm</b>
        </div>
        <div className="prepress-row">
          <span>Bar width reduction</span>
          <b>0.000 mm</b>
        </div>
        <div className="prepress-actions">
          <span>Reset</span>
          <b>Create</b>
        </div>
      </div>
      <div className="prepress-artboard">
        <svg viewBox="0 0 120 70" role="presentation">
          {bars.map((bar, index) =>
            bar ? <rect fill="#2d2a32" height={index < 3 || index > 49 || (index > 24 && index < 28) ? 60 : 54} key={index} width="1.6" x={8 + index * 1.97} y="4" /> : null
          )}
        </svg>
        <span>UPC-A · 100% K · vector</span>
      </div>
    </div>
  );
}
