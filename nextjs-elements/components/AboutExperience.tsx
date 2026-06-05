"use client";

import { useState } from "react";
import { BrandLogo } from "./BrandLogo";
import { ContactModal } from "./ContactModal";
import { SiteMenu } from "./SiteMenu";
import { aboutIntro, aboutPrinciples } from "@/data/about";

export function AboutExperience() {
  const [isContactOpen, setIsContactOpen] = useState(false);

  function navigateWithinKnoplus(destination: string) {
    window.location.href = destination;
  }

  return (
    <>
      <main className="about-app">
        <aside className="about-sidebar">
          <div className="sidebar-brand">
            <BrandLogo />
          </div>

          <div className="about-nav">
            <div className="nav-label">About</div>
            {aboutPrinciples.map((principle, index) => (
              <div className="template-btn about-nav-static" key={principle.label}>
                <span>{principle.label}</span>
                <small>{String(index + 1).padStart(2, "0")}</small>
              </div>
            ))}
          </div>

          <div className="sidebar-note cta-note">
            <div className="cta-copy">
              Know More.
              <br />
              Know Better.
              <br />
              Knoplus.
            </div>
            <button onClick={() => setIsContactOpen(true)} type="button" className="cta-button">
              Contact Us
            </button>
          </div>
        </aside>

        <section className="about-stage">
          <SiteMenu
            className="stage-menu-control"
            hideIcon
            onContact={() => setIsContactOpen(true)}
            onNavigate={navigateWithinKnoplus}
            showLabel
          />
          <div className="about-bg" />
          <div className="about-copy">
            <div className="eyebrow">{aboutIntro.eyebrow}</div>
            <h1>
              {aboutIntro.title.split("\n")[0]}
              <br />
              {aboutIntro.title.split("\n")[1]}
            </h1>
            <p>{aboutIntro.body}</p>
          </div>

          <div className="about-principles" aria-label="Knoplus principles">
            {aboutPrinciples.map((principle, index) => (
              <article className="about-principle active" key={principle.label}>
                <span>{principle.label}</span>
                <p>{principle.text}</p>
              </article>
            ))}
          </div>

          <blockquote className="about-pitch">
            {aboutIntro.pitch}
          </blockquote>
        </section>
      </main>

      <main className="mobile-scroll-page mobile-about-page">
        <header className="mobile-scroll-header">
          <BrandLogo />
          <SiteMenu onContact={() => setIsContactOpen(true)} onNavigate={navigateWithinKnoplus} />
        </header>

        <section className="mobile-about-section">
          <div className="eyebrow">{aboutIntro.eyebrow}</div>
          <h2>
            {aboutIntro.title.split("\n")[0]}
            <br />
            {aboutIntro.title.split("\n")[1]}
          </h2>
          <p>{aboutIntro.body}</p>

          <div className="about-principles">
            {aboutPrinciples.map((principle) => (
              <article className="about-principle" key={principle.label}>
                <span>{principle.label}</span>
                <p>{principle.text}</p>
              </article>
            ))}
          </div>
        </section>

        <footer className="mobile-scroll-footer">
          <p>
            Know More.
            <br />
            Know Better.
            <br />
            Knoplus.
          </p>
          <button onClick={() => setIsContactOpen(true)} type="button" className="cta-button">
            Contact Us
          </button>
        </footer>
      </main>

      <ContactModal isOpen={isContactOpen} onClose={() => setIsContactOpen(false)} />
    </>
  );
}
