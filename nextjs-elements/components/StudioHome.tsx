"use client";

import type { CSSProperties } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { BrandLogo } from "./BrandLogo";
import { ContactModal } from "./ContactModal";
import { SiteMenu } from "./SiteMenu";
import { Device, PrepressArt } from "./hub/HubShell";
import { studioEntries, type StudioEntry } from "@/data/studio";

const intro = {
  label: "Knoplus studio",
  title: "Small studio.",
  titleSecond: "Useful tools.",
  script: "Built to be used.",
  summary:
    "I design and build the tools people end up relying on: phone apps, browser tools, Illustrator automation and websites. If your team is working around a problem, I would like to hear about it.",
  approach: "Listen first, prototype quickly, then build it properly and stay for the launch.",
  current: "UpDate is heading to the Play Store, and Rosewave is in testing."
};

function formatCount(index: number, total: number) {
  return `${String(index + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}`;
}

function StudioArt({ entry }: { entry: StudioEntry }) {
  if (!entry.screens.length) {
    return (
      <div className="studio-art drawn">
        <PrepressArt />
      </div>
    );
  }

  const frame = entry.screens[0].frame;
  return (
    <div className={`studio-art ${frame} count-${Math.min(entry.screens.length, 2)}`}>
      {entry.screens.slice(0, 2).map((screen, index) => (
        <Device key={screen.src} priority={index === 0} screen={screen} />
      ))}
    </div>
  );
}

function CaseDetails({ entry, index }: { entry: StudioEntry; index: number }) {
  return (
    <div className="template-panel-details studio-details" aria-label={`${entry.navTitle} in brief`}>
      <strong>No. {String(index + 1).padStart(2, "0")}</strong>
      <div>
        <span>The problem</span>
        <p>{entry.problem}</p>
      </div>
      <div>
        <span>What I built</span>
        <p>{entry.built}</p>
      </div>
    </div>
  );
}

function CaseLinks({ entry }: { entry: StudioEntry }) {
  return (
    <div className="actions template-actions">
      {entry.links.map((link, linkIndex) => (
        <Link className={`cta-button ${linkIndex === 0 ? "explore-button" : "inquire-button"}`} href={link.href} key={link.href}>
          {link.label}
        </Link>
      ))}
    </div>
  );
}

// The home page as a studio index: the same sidebar, type and buttons as /websites, with one project at a time
// in the stage and a real screen beside it.
export function StudioHome() {
  const [active, setActive] = useState(-1);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const entry = active >= 0 ? studioEntries[active] : null;

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (isContactOpen || (event.key !== "ArrowDown" && event.key !== "ArrowUp")) {
        return;
      }
      event.preventDefault();
      setActive((current) => {
        const next = current + (event.key === "ArrowDown" ? 1 : -1);
        return Math.max(-1, Math.min(studioEntries.length - 1, next));
      });
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isContactOpen]);

  const openContact = () => window.requestAnimationFrame(() => setIsContactOpen(true));

  return (
    <div className="studio">
      <main className="studio-app">
        <aside>
          <div className="sidebar-brand">
            <BrandLogo />
          </div>

          <nav className="template-nav" aria-label="Projects">
            <div className="nav-label">Work</div>
            <button className={`template-btn ${active === -1 ? "active" : ""}`} onClick={() => setActive(-1)} type="button">
              <span>Studio</span>
              <span className="plus" />
            </button>
            {studioEntries.map((item, index) => (
              <button
                className={`template-btn ${index === active ? "active" : ""}`}
                key={item.slug}
                onClick={() => setActive(index)}
                type="button"
              >
                <span>{item.navTitle}</span>
                <span className="plus" />
              </button>
            ))}
          </nav>

          <div className="sidebar-note cta-note">
            <div className="cta-copy">
              Know More.
              <br />
              Know Better.
              <br />
              Knoplus.
            </div>
            <button className="cta-button" onClick={openContact} type="button">
              Work With Me
            </button>
          </div>
        </aside>

        <section
          className="studio-stage"
          style={{ "--panel-accent": entry?.accent ?? "#f6f3ec" } as CSSProperties}
        >
          <SiteMenu className="studio-menu" onContact={openContact} showLabel hideIcon />
          <div className="studio-glow" key={`glow-${active}`} />

          <div className="studio-content" key={active}>
            <div className="studio-copy">
              {entry ? (
                <>
                  <div className="eyebrow">{entry.label}</div>
                  <h1>
                    {entry.title}
                    <br />
                    <em>{entry.script}</em>
                  </h1>
                  <p>{entry.summary}</p>
                  <CaseLinks entry={entry} />
                  <CaseDetails entry={entry} index={active} />
                </>
              ) : (
                <>
                  <div className="eyebrow">{intro.label}</div>
                  <h1>
                    {intro.title}
                    <br />
                    {intro.titleSecond}
                    <br />
                    <em>{intro.script}</em>
                  </h1>
                  <p>{intro.summary}</p>
                  <div className="actions template-actions">
                    <button className="cta-button explore-button" onClick={() => setActive(0)} type="button">
                      See the work
                    </button>
                    <button className="cta-button inquire-button" onClick={openContact} type="button">
                      Start a conversation
                    </button>
                  </div>
                  <div className="template-panel-details studio-details" aria-label="How Knoplus works">
                    <strong>{String(studioEntries.length).padStart(2, "0")} projects</strong>
                    <div>
                      <span>How I work</span>
                      <p>{intro.approach}</p>
                    </div>
                    <div>
                      <span>Currently</span>
                      <p>{intro.current}</p>
                    </div>
                  </div>
                </>
              )}
            </div>

            {entry ? <StudioArt entry={entry} /> : <StudioIntroArt />}
          </div>

          {entry ? <div className="counter studio-counter">{formatCount(active, studioEntries.length)}</div> : null}
        </section>
      </main>

      <main className="studio-mobile">
        <header className="mobile-scroll-header">
          <BrandLogo />
          <SiteMenu onContact={openContact} />
        </header>

        <section className="studio-mobile-section studio-mobile-intro">
          <div className="eyebrow">{intro.label}</div>
          <h2>
            {intro.title}
            <br />
            {intro.titleSecond}
            <br />
            <em>{intro.script}</em>
          </h2>
          <p>{intro.summary}</p>
          <div className="actions template-actions">
            <button className="cta-button inquire-button" onClick={openContact} type="button">
              Start a conversation
            </button>
          </div>
        </section>

        {studioEntries.map((item, index) => (
          <section
            className="studio-mobile-section"
            key={item.slug}
            style={{ "--panel-accent": item.accent } as CSSProperties}
          >
            <div className="mobile-section-count">{formatCount(index, studioEntries.length)}</div>
            <div className="eyebrow">{item.label}</div>
            <h2>
              {item.title} <em>{item.script}</em>
            </h2>
            <StudioArt entry={item} />
            <p>{item.summary}</p>
            <CaseLinks entry={item} />
            <CaseDetails entry={item} index={index} />
          </section>
        ))}

        <footer className="mobile-scroll-footer">
          <p>
            Know More.
            <br />
            Know Better.
            <br />
            Knoplus.
          </p>
          <button className="cta-button" onClick={openContact} type="button">
            Work With Me
          </button>
        </footer>
      </main>

      <ContactModal isOpen={isContactOpen} onClose={() => setIsContactOpen(false)} />
    </div>
  );
}

// The opening panel shows three real screens fanned out, one from each kind of work.
function StudioIntroArt() {
  const picks = ["freestyle", "update", "rosewave"]
    .map((slug) => studioEntries.find((item) => item.slug === slug)?.screens[0])
    .filter((screen): screen is NonNullable<typeof screen> => Boolean(screen));

  return (
    <div className="studio-art intro">
      {picks.map((screen, index) => (
        <Device key={screen.src} priority={index === 0} screen={screen} />
      ))}
    </div>
  );
}
