"use client";

import type { CSSProperties } from "react";
import { useMemo, useState } from "react";
import { SiteMenu } from "./SiteMenu";
import { templates } from "@/data/templates";

function formatCounter(index: number) {
  return `${String(index + 1).padStart(2, "0")} / ${String(templates.length).padStart(2, "0")}`;
}

export function TemplateShowcase() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [nextIndex, setNextIndex] = useState(0);
  const [isCopyFading, setIsCopyFading] = useState(false);
  const [isBgChanging, setIsBgChanging] = useState(false);
  const [isCounterChanging, setIsCounterChanging] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const currentTemplate = templates[currentIndex];
  const nextTemplate = templates[nextIndex];
  const counterLabel = useMemo(() => formatCounter(currentIndex), [currentIndex]);
  const nextCounterLabel = useMemo(() => formatCounter(nextIndex), [nextIndex]);

  function setTemplate(index: number) {
    if (index === currentIndex) {
      return;
    }

    setNextIndex(index);
    setIsCopyFading(true);
    setIsBgChanging(true);
    setIsCounterChanging(true);

    window.setTimeout(() => {
      setCurrentIndex(index);
      setIsCopyFading(false);
      setIsBgChanging(false);
    }, 420);

    window.setTimeout(() => {
      setIsCounterChanging(false);
    }, 360);
  }

  function openCurrentTemplate() {
    setIsTransitioning(true);
    window.setTimeout(() => {
      window.location.href = currentTemplate.link;
    }, 1450);
  }

  return (
    <>
      <main className="app">
        <aside>
          <div className="brand">Knoplus</div>

          <div className="template-nav">
            <div className="nav-label">Templates</div>
            {templates.map((template, index) => (
              <button
                className={`template-btn ${index === currentIndex ? "active" : ""}`}
                data-index={index}
                key={template.navTitle}
                onClick={() => setTemplate(index)}
                type="button"
              >
                <span>{template.navTitle}</span>
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

        <section className="stage">
          <div className="preview-bg" style={{ "--bg": currentTemplate.image } as CSSProperties} />
          <div
            className={`preview-bg-next ${isBgChanging ? "show" : ""}`}
            style={{ "--bg": nextTemplate.image } as CSSProperties}
          />

          <SiteMenu />

          <div className="content">
            <div className={`copy ${isCopyFading ? "fade" : ""}`}>
              <div className="copy-anchor">
                <div className="eyebrow">{currentTemplate.label}</div>
                <h1 dangerouslySetInnerHTML={{ __html: currentTemplate.title }} />
                <p>{currentTemplate.description}</p>

                <div className="actions">
                  <button className="circle-link" onClick={openCurrentTemplate} type="button" aria-label="Open template">
                    <span className="circle-plus" />
                  </button>
                  <button className="text-link" onClick={openCurrentTemplate} type="button">
                    Explore Template
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className={`counter ${isCounterChanging ? "crossfade" : ""}`}>
            <span className="counter-value current">{counterLabel}</span>
            <span className="counter-value next">{nextCounterLabel}</span>
          </div>
        </section>
      </main>

      <div className={`transition-screen ${isTransitioning ? "active" : ""}`}>
        <div className="transition-logo">KNOPLUS</div>
      </div>
    </>
  );
}
