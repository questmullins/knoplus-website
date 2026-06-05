"use client";

import { useCallback, useEffect, useState } from "react";
import { processIntro, processSteps } from "@/data/process";
import { BrandLogo } from "./BrandLogo";
import { ContactModal } from "./ContactModal";
import { ScreenCounter } from "./ScreenCounter";
import { SiteMenu } from "./SiteMenu";

export function ProcessExperience() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isStageFading, setIsStageFading] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const active = processSteps[activeIndex];

  function navigateWithinKnoplus(destination: string) {
    window.location.href = destination;
  }

  const setProcessOption = useCallback(
    (index: number) => {
      if (index === activeIndex) {
        return;
      }

      setIsStageFading(true);
      window.setTimeout(() => {
        setActiveIndex(index);
        setIsStageFading(false);
      }, 170);
    },
    [activeIndex]
  );

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
      setProcessOption(nextIndex);
      window.setTimeout(() => {
        isWheelLocked = false;
      }, 420);
    };

    window.addEventListener("wheel", advanceFromWheel, { passive: false });

    return () => {
      window.removeEventListener("wheel", advanceFromWheel);
    };
  }, [activeIndex, setProcessOption]);

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
              <button
                className={`template-btn ${index === activeIndex ? "active" : ""}`}
                key={step.label}
                onClick={() => setProcessOption(index)}
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
          <div className={`about-copy pricing-choice-copy ${isStageFading ? "is-fading" : ""}`}>
            <div className="eyebrow">{processIntro.eyebrow}</div>
            <h1>
              {processIntro.title.split("\n")[0]}
              <br />
              {processIntro.title.split("\n")[1]}
            </h1>
            <p>{processIntro.body}</p>
          </div>

          <div className={`about-principles pricing-detail ${isStageFading ? "is-fading" : ""}`} aria-label="Knoplus process">
            <article className="about-principle active">
              <span>{active.label}</span>
              <p>{active.text}</p>
            </article>
            <article className="about-principle active">
              <span>What You Get</span>
              <p>A clear next step, a realistic scope, and a site path that matches the level of customization the business actually needs.</p>
            </article>
          </div>

          <blockquote className="about-pitch">{processIntro.pitch}</blockquote>
          <ScreenCounter current={activeIndex + 1} total={processSteps.length} />
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
