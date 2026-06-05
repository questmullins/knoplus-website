"use client";

import { useEffect, useState } from "react";
import { processIntro, processSteps } from "@/data/process";
import { BrandLogo } from "./BrandLogo";
import { ScreenCounter } from "./ScreenCounter";
import { SiteMenu } from "./SiteMenu";

export function ProcessExperience() {
  const [activeIndex, setActiveIndex] = useState(0);

  function navigateWithinKnoplus(destination: string) {
    window.location.href = destination;
  }

  useEffect(() => {
    let isWheelLocked = false;

    const advanceFromWheel = (event: WheelEvent) => {
      if (window.matchMedia("(max-width: 760px)").matches || Math.abs(event.deltaY) < 24 || isWheelLocked) {
        return;
      }

      const nextIndex = Math.max(0, Math.min(processSteps.length - 1, activeIndex + (event.deltaY > 0 ? 1 : -1)));

      if (nextIndex === activeIndex) {
        return;
      }

      event.preventDefault();
      isWheelLocked = true;
      setActiveIndex(nextIndex);
      window.setTimeout(() => {
        isWheelLocked = false;
      }, 360);
    };

    window.addEventListener("wheel", advanceFromWheel, { passive: false });

    return () => {
      window.removeEventListener("wheel", advanceFromWheel);
    };
  }, [activeIndex]);

  return (
    <>
      <main className="about-app process-app">
        <aside className="about-sidebar">
          <div className="sidebar-brand">
            <BrandLogo />
            <SiteMenu onNavigate={navigateWithinKnoplus} />
          </div>

          <div className="about-nav">
            <div className="nav-label">Process</div>
            {processSteps.map((step, index) => (
              <button
                className={`about-nav-item ${index === activeIndex ? "active" : ""}`}
                key={step.label}
                onClick={() => setActiveIndex(index)}
                type="button"
              >
                <span>{step.label}</span>
                <span className="plus" />
              </button>
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
            <a href="mailto:knopluswebsites@gmail.com" className="cta-button">
              Contact Us
            </a>
          </div>
        </aside>

        <section className="about-stage process-stage">
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
              <article className={`about-principle ${index === activeIndex ? "active" : ""}`} key={step.label}>
                <span>{step.label}</span>
                <p>{step.text}</p>
              </article>
            ))}
          </div>

          <blockquote className="about-pitch">{processIntro.pitch}</blockquote>
          <ScreenCounter current={activeIndex + 1} total={processSteps.length} />
        </section>
      </main>

      <main className="mobile-scroll-page mobile-about-page">
        <header className="mobile-scroll-header">
          <BrandLogo />
          <SiteMenu onNavigate={navigateWithinKnoplus} />
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
          <a href="mailto:knopluswebsites@gmail.com" className="cta-button">
            Contact Us
          </a>
        </footer>
      </main>
    </>
  );
}
