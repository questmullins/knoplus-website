"use client";

import { useState } from "react";
import { processIntro, processSteps } from "@/data/process";
import { BrandLogo } from "./BrandLogo";
import { ContactModal } from "./ContactModal";
import { SiteMenu } from "./SiteMenu";

export function ProcessExperience() {
  const [isContactOpen, setIsContactOpen] = useState(false);

  function navigateWithinKnoplus(destination: string) {
    window.location.href = destination;
  }

  return (
    <>
      <main className="about-app process-app">
        <aside className="about-sidebar">
          <div className="sidebar-brand">
            <BrandLogo />
          </div>

          <div className="about-nav">
            <div className="nav-label">Process</div>
            {processSteps.map((step, index) => (
              <div className="template-btn about-nav-static" key={step.label}>
                <span>{step.label}</span>
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

        <section className="about-stage process-stage">
          <SiteMenu
            className="stage-menu-control"
            hideIcon
            onContact={() => setIsContactOpen(true)}
            onNavigate={navigateWithinKnoplus}
            showLabel
          />
          <div className="about-bg process-bg" />
          <div className="about-copy">
            <div className="eyebrow">{processIntro.eyebrow}</div>
            <h1>
              {processIntro.title.split("\n")[0]}
              <br />
              {processIntro.title.split("\n")[1]}
            </h1>
            <p>{processIntro.body}</p>
          </div>

          <div className="about-principles" aria-label="Knoplus process">
            {processSteps.map((step, index) => (
              <article className="about-principle active" key={step.label}>
                <span>{step.label}</span>
                <p>{step.text}</p>
              </article>
            ))}
          </div>

          <blockquote className="about-pitch">{processIntro.pitch}</blockquote>
        </section>
      </main>

      <main className="mobile-scroll-page mobile-about-page">
        <header className="mobile-scroll-header">
          <BrandLogo />
          <SiteMenu onContact={() => setIsContactOpen(true)} onNavigate={navigateWithinKnoplus} />
        </header>

        <section className="mobile-about-section process-mobile-section">
          <div className="eyebrow">{processIntro.eyebrow}</div>
          <h2>
            {processIntro.title.split("\n")[0]}
            <br />
            {processIntro.title.split("\n")[1]}
          </h2>
          <p>{processIntro.body}</p>

          <div className="about-principles">
            {processSteps.map((step) => (
              <article className="about-principle" key={step.label}>
                <span>{step.label}</span>
                <p>{step.text}</p>
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
