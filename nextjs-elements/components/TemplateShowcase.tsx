"use client";

import type { CSSProperties } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BrandLogo } from "./BrandLogo";
import { ContactModal } from "./ContactModal";
import { SiteMenu } from "./SiteMenu";
import { templates, type TemplateItem } from "@/data/templates";

const genres = ["All", ...Array.from(new Set(templates.map((template) => template.genre)))];

const serviceIntro = {
  label: "Website template service",
  navTitle: "Website Service",
  title: "Modern websites.<br />Clear pricing.<br /><em>Built to launch.</em>",
  description:
    "Knoplus builds professional websites for independent businesses using polished website templates, custom website design, mobile-friendly layouts, SEO-ready page structure, contact forms, Cloudflare deployment, and practical launch support.",
  image: "url('https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1800&q=80')",
  features: ["Template websites", "Custom websites", "Mobile-friendly design"],
  sellingPoints: ["Starting at $500", "Built for local business launches"]
};

function formatCounter(index: number, total: number) {
  return `${String(index + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}`;
}

export function TemplateShowcase() {
  const [isIntroActive, setIsIntroActive] = useState(true);
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
  const [isContactOpen, setIsContactOpen] = useState(false);

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
  const stageImage = isIntroActive ? serviceIntro.image : currentTemplate.image;
  const nextStageImage = isIntroActive ? serviceIntro.image : nextTemplate.image;
  const stageTheme = isIntroActive ? "service" : currentTemplate.theme;
  const counterLabel = useMemo(
    () => formatCounter(currentVisibleIndex, visibleTemplates.length || templates.length),
    [currentVisibleIndex, visibleTemplates.length]
  );
  const nextCounterLabel = useMemo(
    () => formatCounter(nextVisibleIndex, visibleTemplates.length || templates.length),
    [nextVisibleIndex, visibleTemplates.length]
  );

  const setTemplate = useCallback(
    (index: number) => {
      setIsIntroActive(false);

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
    },
    [currentIndex]
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
    let isWheelLocked = false;

    const advanceFromWheel = (event: WheelEvent) => {
      if (window.matchMedia("(max-width: 760px)").matches || Math.abs(event.deltaY) < 24 || isWheelLocked) {
        return;
      }

      const direction = event.deltaY > 0 ? 1 : -1;

      if (isIntroActive) {
        if (direction > 0) {
          event.preventDefault();
          isWheelLocked = true;
          setIsIntroActive(false);
          window.setTimeout(() => {
            isWheelLocked = false;
          }, 420);
        }

        return;
      }

      if (direction < 0 && currentVisibleIndex === 0) {
        event.preventDefault();
        isWheelLocked = true;
        setIsIntroActive(true);
        window.setTimeout(() => {
          isWheelLocked = false;
        }, 420);
        return;
      }

      const nextVisible = Math.max(0, Math.min(visibleTemplates.length - 1, currentVisibleIndex + direction));
      const nextTemplate = visibleTemplates[nextVisible];

      if (!nextTemplate || nextTemplate.index === currentIndex) {
        return;
      }

      event.preventDefault();
      isWheelLocked = true;
      setTemplate(nextTemplate.index);
      window.setTimeout(() => {
        isWheelLocked = false;
      }, 620);
    };

    window.addEventListener("wheel", advanceFromWheel, { passive: false });

    return () => {
      window.removeEventListener("wheel", advanceFromWheel);
    };
  }, [currentIndex, currentVisibleIndex, isIntroActive, setTemplate, visibleTemplates]);

  useEffect(() => {
    const resetTemplateExit = () => {
      setIsTransitioning(false);
    };

    window.addEventListener("pageshow", resetTemplateExit);
    window.addEventListener("focus", resetTemplateExit);

    return () => {
      window.removeEventListener("pageshow", resetTemplateExit);
      window.removeEventListener("focus", resetTemplateExit);
    };
  }, []);

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
      setIsIntroActive(false);
      setActiveMobileIndex(index);
      setRevealedMobileIndexes((indexes) => new Set(indexes).add(index));

      window.requestAnimationFrame(() => {
        window.scrollTo({ top: Number(parsed.scrollY) || 0, behavior: "auto" });
      });
    } catch {
      window.sessionStorage?.removeItem("knoplus:last-template-panel");
    }
  }, []);

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
    window.sessionStorage?.setItem("knoplus:template-transition", "reveal");

    setIsTransitioning(true);
    window.setTimeout(() => {
      window.location.href = template.link;
    }, 1450);
  }

  return (
    <>
      <main className="app">
        <aside>
          <div className="sidebar-brand">
            <BrandLogo />
          </div>

          <div className="template-nav">
            <div className="nav-label">Templates</div>
            <button
              className={`template-btn ${isIntroActive ? "active" : ""}`}
              onClick={() => setIsIntroActive(true)}
              type="button"
            >
              <span>{serviceIntro.navTitle}</span>
              <span className="plus" />
            </button>
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
            <button onClick={() => setIsContactOpen(true)} type="button" className="cta-button">
              Contact Us
            </button>
          </div>
        </aside>

        <section className="stage" data-theme={stageTheme}>
          <SiteMenu className="stage-menu-control" hideIcon onContact={() => setIsContactOpen(true)} showLabel />
          <div className="preview-bg" style={{ "--bg": stageImage } as CSSProperties} />
          <div
            className={`preview-bg-next ${isBgChanging ? "show" : ""}`}
            style={{ "--bg": nextStageImage } as CSSProperties}
          />

          <div className="content">
            <div className={`copy ${isCopyFading ? "fade" : ""}`}>
              <div className="copy-anchor">
                <div className="eyebrow">{isIntroActive ? serviceIntro.label : currentTemplate.label}</div>
                {isIntroActive ? (
                  <h1 dangerouslySetInnerHTML={{ __html: serviceIntro.title }} />
                ) : (
                  <h1>{currentTemplate.navTitle}</h1>
                )}
                <p>{isIntroActive ? serviceIntro.description : currentTemplate.description}</p>

                <div className="actions">
                  <button
                    className="circle-link"
                    onClick={() => (isIntroActive ? setIsIntroActive(false) : openTemplate())}
                    type="button"
                    aria-label={isIntroActive ? "Explore website templates" : "Open template"}
                  >
                    <span className="circle-plus" />
                  </button>
                  <button className="text-link" onClick={() => (isIntroActive ? setIsIntroActive(false) : openTemplate())} type="button">
                    {isIntroActive ? "Explore Templates" : "Explore Template"}
                  </button>
                </div>

                <div
                  className="template-panel-details"
                  aria-label={isIntroActive ? "Knoplus website service highlights" : `${currentTemplate.navTitle} features and price`}
                >
                  <strong>{isIntroActive ? "From $500" : currentTemplate.price}</strong>
                  <div>
                    <span>Features</span>
                    <p>{(isIntroActive ? serviceIntro.features : currentTemplate.features).join(" / ")}</p>
                  </div>
                  <div>
                    <span>Selling Points</span>
                    <p>{(isIntroActive ? serviceIntro.sellingPoints : currentTemplate.sellingPoints).join(" / ")}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {isIntroActive ? null : (
            <div className={`counter ${isCounterChanging ? "crossfade" : ""}`}>
              <span className="counter-value current">{counterLabel}</span>
              <span className="counter-value next">{nextCounterLabel}</span>
            </div>
          )}
        </section>
      </main>

      <main className="mobile-scroll-page">
        <header className="mobile-scroll-header">
          <BrandLogo />
          <SiteMenu onContact={() => setIsContactOpen(true)} />
        </header>

        <div className="mobile-scroll-kicker">Templates</div>
        <section className="mobile-template-section mobile-service-intro is-revealed" data-theme="service">
          <h2>
            Website service
            <br />
            for real businesses.
          </h2>
          <p>{serviceIntro.description}</p>
          <div className="actions mobile-actions">
            <button
              className="circle-link"
              onClick={() => {
                const nextSection = document.querySelector<HTMLElement>(".mobile-template-section[data-index]");
                nextSection?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              type="button"
              aria-label="Explore templates"
            >
              <span className="circle-plus" />
            </button>
            <button
              className="text-link"
              onClick={() => {
                const nextSection = document.querySelector<HTMLElement>(".mobile-template-section[data-index]");
                nextSection?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              type="button"
            >
              Explore Templates
            </button>
          </div>
          <div className="template-panel-details" aria-label="Knoplus website service highlights">
            <strong>From $500</strong>
            <div>
              <span>Website Services</span>
              <p>Template websites / Custom websites / SEO-ready structure</p>
            </div>
            <div>
              <span>Built For</span>
              <p>Independent companies / Local businesses / Fast launches</p>
            </div>
          </div>
        </section>

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
            <h2>{template.navTitle}</h2>
            <p>{template.description}</p>
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
              <strong>{template.price}</strong>
              <div>
                <span>Features</span>
                <p>{template.features.join(" / ")}</p>
              </div>
              <div>
                <span>Selling Points</span>
                <p>{template.sellingPoints.join(" / ")}</p>
              </div>
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
          <button onClick={() => setIsContactOpen(true)} type="button" className="cta-button">
            Contact Us
          </button>
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

      <ContactModal isOpen={isContactOpen} onClose={() => setIsContactOpen(false)} />
    </>
  );
}
