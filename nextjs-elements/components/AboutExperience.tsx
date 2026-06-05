"use client";

import Link from "next/link";
import { SiteMenu } from "./SiteMenu";
import { ScreenCounter } from "./ScreenCounter";

const aboutPrinciples = [
  {
    label: "Independent First",
    text: "We build for local operators, solo founders, service teams, and independent companies that need the web to feel useful instead of inflated."
  },
  {
    label: "Pride In The Work",
    text: "Every page should feel considered: clear structure, sharp visuals, direct language, and details that make the business easier to trust."
  },
  {
    label: "Function Meets Form",
    text: "A site has to look good, move cleanly, load fast, and guide people toward the next step without making them work for it."
  },
  {
    label: "Efficiency With Respect",
    text: "We care about cost because good websites should help everyone involved: the client, the customer, and the business behind the build."
  }
];

export function AboutExperience() {
  function navigateWithinKnoplus(destination: string) {
    window.location.href = destination;
  }

  return (
    <>
      <main className="about-app">
        <aside className="about-sidebar">
          <Link className="brand" href="/">
            Knoplus
          </Link>

          <div className="about-nav">
            <div className="nav-label">About</div>
            {aboutPrinciples.map((principle) => (
              <div className="about-nav-item" key={principle.label}>
                <span>{principle.label}</span>
                <span className="plus" />
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
            <a href="mailto:knopluswebsites@gmail.com" className="cta-button">
              Contact Us
            </a>
          </div>
        </aside>

        <section className="about-stage">
          <div className="about-bg" />
          <SiteMenu onNavigate={navigateWithinKnoplus} showHomeLink />

          <div className="about-copy">
            <div className="eyebrow">Independent web partners</div>
            <h1>
              Built with pride.
              <br />
              Priced with purpose.
            </h1>
            <p>
              Knoplus supports independent companies with websites that balance form, function,
              and efficiency. The goal is simple: make polished digital work accessible, useful,
              and worth the investment for everyone involved.
            </p>
          </div>

          <div className="about-principles" aria-label="Knoplus principles">
            {aboutPrinciples.map((principle) => (
              <article className="about-principle" key={principle.label}>
                <span>{principle.label}</span>
                <p>{principle.text}</p>
              </article>
            ))}
          </div>

          <blockquote className="about-pitch">
            * We meet design with practicality, speed with care, and ambition with pricing that
            helps small businesses move.
          </blockquote>
          <ScreenCounter current={1} total={1} />
        </section>
      </main>

      <main className="mobile-scroll-page mobile-about-page">
        <header className="mobile-scroll-header">
          <Link className="brand" href="/">
            Knoplus
          </Link>
          <SiteMenu onNavigate={navigateWithinKnoplus} showHomeLink />
        </header>

        <section className="mobile-about-section">
          <div className="eyebrow">Independent web partners</div>
          <h2>
            Built with pride.
            <br />
            Priced with purpose.
          </h2>
          <p>
            Knoplus supports independent companies with websites that balance form, function,
            and efficiency at a cost that benefits everyone.
          </p>

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
