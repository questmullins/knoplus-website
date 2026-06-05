"use client";

import { useEffect, useState } from "react";
import { BrandLogo } from "./BrandLogo";
import { SiteMenu } from "./SiteMenu";
import { ScreenCounter } from "./ScreenCounter";
import { aboutIntro, aboutPrinciples } from "@/data/about";

export function AboutExperience() {
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

      const nextIndex = Math.max(0, Math.min(aboutPrinciples.length - 1, activeIndex + (event.deltaY > 0 ? 1 : -1)));

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
      <main className="about-app">
        <aside className="about-sidebar">
          <div className="sidebar-brand">
            <BrandLogo />
          </div>

          <div className="about-nav">
            <div className="nav-label">About</div>
            {aboutPrinciples.map((principle, index) => (
              <button
                className={`about-nav-item ${index === activeIndex ? "active" : ""}`}
                key={principle.label}
                onClick={() => setActiveIndex(index)}
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
            <a href="mailto:knopluswebsites@gmail.com" className="cta-button">
              Contact Us
            </a>
          </div>
        </aside>

        <section className="about-stage">
          <SiteMenu className="stage-menu-control" hideIcon onNavigate={navigateWithinKnoplus} showLabel />
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
              <article className={`about-principle ${index === activeIndex ? "active" : ""}`} key={principle.label}>
                <span>{principle.label}</span>
                <p>{principle.text}</p>
              </article>
            ))}
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
          <SiteMenu onNavigate={navigateWithinKnoplus} />
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
          <a href="mailto:knopluswebsites@gmail.com" className="cta-button">
            Contact Us
          </a>
        </footer>
      </main>
    </>
  );
}
