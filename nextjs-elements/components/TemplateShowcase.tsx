"use client";

import type { CSSProperties } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { SiteMenu } from "./SiteMenu";
import { templates, type TemplateItem } from "@/data/templates";

const genres = ["All", ...Array.from(new Set(templates.map((template) => template.genre)))];

function formatCounter(index: number, total: number) {
  return `${String(index + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}`;
}

export function TemplateShowcase() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [nextIndex, setNextIndex] = useState(0);
  const [isCopyFading, setIsCopyFading] = useState(false);
  const [isBgChanging, setIsBgChanging] = useState(false);
  const [isCounterChanging, setIsCounterChanging] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const mobileSectionRefs = useRef<Array<HTMLElement | null>>([]);
  const [activeMobileIndex, setActiveMobileIndex] = useState(0);
  const [revealedMobileIndexes, setRevealedMobileIndexes] = useState<Set<number>>(() => new Set([0]));
  const [selectedGenre, setSelectedGenre] = useState("All");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const visibleTemplates = useMemo(
    () =>
      templates
        .map((template, index) => ({ template, index }))
        .filter(({ template }) => selectedGenre === "All" || template.genre === selectedGenre),
    [selectedGenre]
  );
  const currentVisibleIndex = Math.max(
    0,
    visibleTemplates.findIndex(({ index }) => index === currentIndex)
  );
  const nextVisibleIndex = Math.max(
    0,
    visibleTemplates.findIndex(({ index }) => index === nextIndex)
  );

  const currentTemplate = templates[currentIndex];
  const nextTemplate = templates[nextIndex];
  const counterLabel = useMemo(
    () => formatCounter(currentVisibleIndex, visibleTemplates.length || templates.length),
    [currentVisibleIndex, visibleTemplates.length]
  );
  const nextCounterLabel = useMemo(
    () => formatCounter(nextVisibleIndex, visibleTemplates.length || templates.length),
    [nextVisibleIndex, visibleTemplates.length]
  );

  useEffect(() => {
    if (!visibleTemplates.some(({ index }) => index === currentIndex)) {
      const nextVisible = visibleTemplates[0];

      if (nextVisible) {
        setCurrentIndex(nextVisible.index);
        setNextIndex(nextVisible.index);
        setActiveMobileIndex(nextVisible.index);
        setRevealedMobileIndexes((indexes) => new Set(indexes).add(nextVisible.index));
      }
    }
  }, [currentIndex, visibleTemplates]);

  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const hashIndex = hashParams.get("template");
    const hashScrollY = hashParams.get("scroll");
    const savedPanel =
      typeof window.sessionStorage === "undefined"
        ? null
        : window.sessionStorage.getItem("knoplus:last-template-panel");

    if (!savedPanel && hashIndex === null) {
      return;
    }

    try {
      const parsed = savedPanel
        ? (JSON.parse(savedPanel) as { index?: number; scrollY?: number; savedAt?: number })
        : { index: Number(hashIndex), scrollY: Number(hashScrollY), savedAt: Date.now() };
      const index = Number(parsed.index);
      const isFresh = parsed.savedAt ? Date.now() - parsed.savedAt < 1000 * 60 * 30 : true;

      if (!Number.isInteger(index) || index < 0 || index >= templates.length || !isFresh) {
        return;
      }

      setCurrentIndex(index);
      setNextIndex(index);
      setActiveMobileIndex(index);
      setRevealedMobileIndexes((indexes) => new Set(indexes).add(index));

      window.requestAnimationFrame(() => {
        window.scrollTo({ top: Number(parsed.scrollY) || 0, behavior: "auto" });
      });
    } catch {
      window.sessionStorage?.removeItem("knoplus:last-template-panel");
    }
  }, []);

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

  useEffect(() => {
    const sections = mobileSectionRefs.current.filter(Boolean) as HTMLElement[];

    if (!sections.length) {
      return;
    }

    const updateParallax = () => {
      const viewportHeight = window.innerHeight || 1;

      sections.forEach((section) => {
        const rect = section.getBoundingClientRect();
        const progress = (rect.top - viewportHeight / 2) / viewportHeight;
        section.style.setProperty("--parallax-y", `${Math.max(-34, Math.min(34, progress * -42))}px`);
      });
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Number((entry.target as HTMLElement).dataset.index ?? 0);

            setActiveMobileIndex(index);
            setRevealedMobileIndexes((indexes) => new Set(indexes).add(index));
          }
        });
      },
      { threshold: 0.42 }
    );

    sections.forEach((section) => observer.observe(section));
    updateParallax();
    window.addEventListener("scroll", updateParallax, { passive: true });
    window.addEventListener("resize", updateParallax);

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", updateParallax);
      window.removeEventListener("resize", updateParallax);
    };
  }, [selectedGenre]);

  function openTemplate(template: TemplateItem = currentTemplate, index: number = currentIndex) {
    const scrollY = Math.round(window.scrollY);
    const restoreHash = `template=${index}&scroll=${scrollY}`;

    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}#${restoreHash}`);
    window.sessionStorage?.setItem(
      "knoplus:last-template-panel",
      JSON.stringify({
        index,
        scrollY,
        savedAt: Date.now()
      })
    );

    setIsTransitioning(true);
    window.setTimeout(() => {
      window.location.href = template.link;
    }, 1450);
  }

  return (
    <>
      <main className="app">
        <aside>
          <div className="brand">Knoplus</div>

          <div className="template-nav">
            <div className="nav-label">Templates</div>
            {visibleTemplates.map(({ template, index }) => (
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

        <section className="stage" data-theme={currentTemplate.theme}>
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
                <div className="template-tag-row" aria-label={`${currentTemplate.navTitle} tags`}>
                  <span>{currentTemplate.genre}</span>
                  {currentTemplate.stack.map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                  {currentTemplate.styleTags.map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>

                <div className="actions">
                  <button className="circle-link" onClick={() => openTemplate()} type="button" aria-label="Open template">
                    <span className="circle-plus" />
                  </button>
                  <button className="text-link" onClick={() => openTemplate()} type="button">
                    Explore Template
                  </button>
                </div>

                <div className="template-panel-details" aria-label={`${currentTemplate.navTitle} features and price`}>
                  <div>
                    <span>Features</span>
                    <p>{currentTemplate.features.join(" / ")}</p>
                  </div>
                  <div>
                    <span>Selling Points</span>
                    <p>{currentTemplate.sellingPoints.join(" / ")}</p>
                  </div>
                  <strong>{currentTemplate.price}</strong>
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

      <main className="mobile-scroll-page">
        <header className="mobile-scroll-header">
          <div className="brand">Knoplus</div>
          <SiteMenu />
        </header>

        <div className="mobile-scroll-kicker">Templates</div>
        {visibleTemplates.map(({ template, index }, visibleIndex) => (
          <section
            className={`mobile-template-section ${activeMobileIndex === index ? "is-active" : ""} ${
              revealedMobileIndexes.has(index) ? "is-revealed" : ""
            }`}
            key={template.navTitle}
            data-index={index}
            data-theme={template.theme}
            ref={(node) => {
              mobileSectionRefs.current[index] = node;
            }}
            style={{ "--bg": template.image } as CSSProperties}
          >
            <div className="mobile-section-count">
              {String(visibleIndex + 1).padStart(2, "0")} / {String(visibleTemplates.length).padStart(2, "0")}
            </div>
            <h2 dangerouslySetInnerHTML={{ __html: template.title }} />
            <p>{template.description}</p>
            <div className="template-tag-row" aria-label={`${template.navTitle} tags`}>
              <span>{template.genre}</span>
              {template.stack.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
              {template.styleTags.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
            <div className="actions mobile-actions">
              <button
                className="circle-link"
                onClick={() => openTemplate(template, index)}
                type="button"
                aria-label="Open template"
              >
                <span className="circle-plus" />
              </button>
              <button
                className="text-link"
                onClick={() => openTemplate(template, index)}
                type="button"
              >
                Explore Template
              </button>
            </div>
            <div className="template-panel-details" aria-label={`${template.navTitle} features and price`}>
              <div>
                <span>Features</span>
                <p>{template.features.join(" / ")}</p>
              </div>
              <div>
                <span>Selling Points</span>
                <p>{template.sellingPoints.join(" / ")}</p>
              </div>
              <strong>{template.price}</strong>
            </div>
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
          <a href="mailto:knopluswebsites@gmail.com" className="cta-button">
            Contact Us
          </a>
        </footer>

        <div className="template-filter">
          <button
            className={`filter-toggle ${isFilterOpen ? "open" : ""}`}
            type="button"
            aria-label="Filter templates"
            aria-expanded={isFilterOpen}
            onClick={() => setIsFilterOpen((isOpen) => !isOpen)}
          >
            <span />
          </button>
          <div className={`filter-panel ${isFilterOpen ? "open" : ""}`}>
            <p>Filter by genre</p>
            {genres.map((genre) => (
              <button
                className={selectedGenre === genre ? "active" : ""}
                key={genre}
                onClick={() => {
                  setSelectedGenre(genre);
                  setIsFilterOpen(false);
                  window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "smooth" }));
                }}
                type="button"
              >
                {genre}
              </button>
            ))}
          </div>
        </div>
      </main>

      <div className={`transition-screen ${isTransitioning ? "active" : ""}`}>
        <div className="transition-logo">KNOPLUS</div>
      </div>
    </>
  );
}
