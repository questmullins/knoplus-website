"use client";

import { useCallback, useEffect, useState } from "react";
import { BrandLogo } from "./BrandLogo";
import { ContactModal } from "./ContactModal";
import { ScreenCounter } from "./ScreenCounter";
import { SiteMenu } from "./SiteMenu";
import { aboutIntro, aboutPrinciples } from "@/data/about";

export function AboutExperience() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isStageFading, setIsStageFading] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const active = aboutPrinciples[activeIndex];

  function navigateWithinKnoplus(destination: string) {
    window.location.href = destination;
  }

  const setAboutOption = useCallback(
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

      const nextIndex = Math.max(0, Math.min(aboutPrinciples.length - 1, activeIndex + (event.deltaY > 0 ? 1 : -1)));

      if (nextIndex === activeIndex) {
        return;
      }

      event.preventDefault();
      isWheelLocked = true;
      setAboutOption(nextIndex);
      window.setTimeout(() => {
        isWheelLocked = false;
      }, 420);
    };

    window.addEventListener("wheel", advanceFromWheel, { passive: false });

    return () => {
      window.removeEventListener("wheel", advanceFromWheel);
    };
  }, [activeIndex, setAboutOption]);

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
              <button
                className={`template-btn ${index === activeIndex ? "active" : ""}`}
                key={principle.label}
                onClick={() => setAboutOption(index)}
                type="button"
              >
                <span>{principle.label}</span>
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

        <section className="about-stage">
          <SiteMenu
            className="stage-menu-control"
            hideIcon
            onContact={() => setIsContactOpen(true)}
            onNavigate={navigateWithinKnoplus}
            showLabel
          />
          <div className="about-bg" />
          <div className={`about-copy pricing-choice-copy ${isStageFading ? "is-fading" : ""}`}>
            <div className="eyebrow">{aboutIntro.eyebrow}</div>
            <h1>
              {aboutIntro.title.split("\n")[0]}
              <br />
              {aboutIntro.title.split("\n")[1]}
            </h1>
            <p>{aboutIntro.body}</p>
          </div>

          <div className={`about-principles pricing-detail ${isStageFading ? "is-fading" : ""}`} aria-label="Knoplus principles">
            <article className="about-principle active">
              <span>{active.label}</span>
              <p>{active.text}</p>
            </article>
            <article className="about-principle active">
              <span>Why It Matters</span>
              <p>Each decision is filtered through whether it helps the business look trustworthy, explain itself clearly, and move without wasted complexity.</p>
            </article>
          </div>

          <blockquote className="about-pitch">
            {aboutIntro.pitch}
          </blockquote>
          <ScreenCounter current={activeIndex + 1} total={aboutPrinciples.length} />
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
