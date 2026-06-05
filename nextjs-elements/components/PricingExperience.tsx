"use client";

import type { CSSProperties } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { BrandLogo } from "./BrandLogo";
import { ContactModal } from "./ContactModal";
import { ScreenCounter } from "./ScreenCounter";
import { SiteMenu } from "./SiteMenu";
import {
  additionalServices,
  careComparison,
  carePlans,
  customPricing,
  includedItems,
  pagePricing,
  templateExamples
} from "@/data/pricing";

const pricingOptions = [
  {
    label: "Choose Path",
    eyebrow: "Template or custom",
    title: "Pick the build path that fits the business.",
    description:
      "Template websites are the cleanest path when a business needs a polished launch quickly. Knoplus is strongest for pre-built experiences, clear service pages, lead forms, and fast management; heavy e-commerce, payment processing, or highly modified software builds are usually not the right fit.",
    accent: "$500",
    note: "Template starting point",
    image: "url('https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=1800&q=80')",
    paths: [
      {
        name: "Template Website",
        price: "From $500",
        body:
          "Best when you like one of the existing directions and want it adapted around your business, branding, copy, imagery, and goals."
      },
      {
        name: "Custom Website",
        price: "From $1,500",
        body:
          "Best when the layout, user experience, brand system, integrations, or content flow needs to be designed from the ground up."
      },
      {
        name: "Not The Best Fit",
        price: "Storefront builds",
        body:
          "If the project needs shopping carts, subscriptions, payment processing, complex customer accounts, or constant custom feature changes, a dedicated e-commerce developer is probably a better match."
      }
    ]
  },
  {
    label: "Template Sites",
    eyebrow: "Starting at $500",
    title: "A proven framework, tailored until it feels like yours.",
    description:
      "Best for small businesses that need a polished launch without paying for a ground-up design system.",
    accent: "$500",
    note: "One-page starter",
    image: "url('https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1800&q=80')",
    rows: pagePricing,
    examples: templateExamples
  },
  {
    label: "Custom Sites",
    eyebrow: "Starting at $1,500",
    title: "Original direction for brands that need a sharper point of view.",
    description:
      "Designed from the ground up with custom layouts, branding, user experience, and visual direction.",
    accent: "$1,500",
    note: "Custom first page",
    image: "url('https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=1800&q=80')",
    rows: customPricing
  },
  {
    label: "Care Plans",
    eyebrow: "From $0/month",
    title: "Choose how hands-off you want launch to feel after the site goes live.",
    description:
      "Monthly care can cover hosting, SSL, DNS connection support, and small content updates. Clients own and renew their domains, while Knoplus helps connect the records cleanly.",
    accent: "$39",
    note: "Standard monthly care",
    image: "url('https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1800&q=80')",
    plans: carePlans
  },
  {
    label: "Compare Plans",
    eyebrow: "Care plan comparison",
    title: "See what each monthly care tier actually covers.",
    description:
      "The comparison keeps the choice simple: Self Managed is a handoff, Standard covers essential upkeep, and Business adds priority attention plus monthly health checks.",
    accent: "$99",
    note: "Full support tier",
    image: "url('https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1800&q=80')",
    comparison: careComparison
  },
  {
    label: "Included",
    eyebrow: "Launch essentials",
    title: "The practical things every site needs are already part of the build.",
    description:
      "A focused launch package with mobile design, forms, deployment, security, client-owned domain connection, basic SEO, and support.",
    accent: "7",
    note: "Included essentials",
    image: "url('https://images.unsplash.com/photo-1511818966892-d7d671e672a2?auto=format&fit=crop&w=1800&q=80')",
    items: includedItems
  },
  {
    label: "Add Ons",
    eyebrow: "Custom quote",
    title: "Simple add-ons are welcome. Heavy commerce is not the lane.",
    description:
      "Knoplus can scope light add-ons when they support the website experience, but the core offer is fast, polished, pre-built service websites. Full storefronts, payment systems, complex accounts, and ongoing custom software are better handled by a specialist.",
    accent: "Quote",
    note: "Scoped separately",
    image: "url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1800&q=80')",
    rows: additionalServices
  }
];

export function PricingExperience() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isStageFading, setIsStageFading] = useState(false);
  const mobileSectionRefs = useRef<Array<HTMLElement | null>>([]);
  const [activeMobileIndex, setActiveMobileIndex] = useState(0);
  const [revealedMobileIndexes, setRevealedMobileIndexes] = useState<Set<number>>(() => new Set([0]));
  const [isContactOpen, setIsContactOpen] = useState(false);
  const active = pricingOptions[activeIndex];

  function navigateWithinKnoplus(destination: string) {
    window.location.href = destination;
  }

  const setPricingOption = useCallback(
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

      const nextIndex = Math.max(0, Math.min(pricingOptions.length - 1, activeIndex + (event.deltaY > 0 ? 1 : -1)));

      if (nextIndex === activeIndex) {
        return;
      }

      event.preventDefault();
      isWheelLocked = true;
      setPricingOption(nextIndex);
      window.setTimeout(() => {
        isWheelLocked = false;
      }, 420);
    };

    window.addEventListener("wheel", advanceFromWheel, { passive: false });

    return () => {
      window.removeEventListener("wheel", advanceFromWheel);
    };
  }, [activeIndex, setPricingOption]);

  useEffect(() => {
    const sections = mobileSectionRefs.current.filter(Boolean) as HTMLElement[];

    if (!sections.length) {
      return;
    }

    const updateParallax = () => {
      const viewportHeight = window.innerHeight || 1;
      let closestIndex = 0;
      let closestDistance = Infinity;

      sections.forEach((section, index) => {
        const rect = section.getBoundingClientRect();
        const progress = (rect.top - viewportHeight / 2) / viewportHeight;
        const distance = Math.abs(rect.top + rect.height / 2 - viewportHeight / 2);

        section.style.setProperty("--parallax-y", `${Math.max(-38, Math.min(38, progress * -46))}px`);

        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = index;
        }
      });

      setActiveMobileIndex(closestIndex);
      setRevealedMobileIndexes((indexes) => new Set(indexes).add(closestIndex));
    };

    updateParallax();
    window.addEventListener("scroll", updateParallax, { passive: true });
    window.addEventListener("resize", updateParallax);

    return () => {
      window.removeEventListener("scroll", updateParallax);
      window.removeEventListener("resize", updateParallax);
    };
  }, []);

  return (
    <>
      <main className="pricing-choice-app">
        <aside className="pricing-choice-sidebar">
          <div className="sidebar-brand">
            <BrandLogo />
          </div>

          <div className="pricing-choice-nav">
            <div className="nav-label">Pricing</div>
            {pricingOptions.map((option, index) => (
              <button
                className={`template-btn ${index === activeIndex ? "active" : ""}`}
                key={option.label}
                onClick={() => setPricingOption(index)}
                type="button"
              >
                <span>{option.label}</span>
                <span className="plus" />
              </button>
            ))}
          </div>

          <div className="sidebar-note">
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

        <section className="pricing-choice-stage">
          <SiteMenu
            className="stage-menu-control"
            hideIcon
            onContact={() => setIsContactOpen(true)}
            onNavigate={navigateWithinKnoplus}
            showLabel
          />
          <div className="pricing-choice-bg" />
          <div className={`pricing-choice-copy ${isStageFading ? "is-fading" : ""}`}>
            <div className="eyebrow">{active.eyebrow}</div>
            <h1>{active.title}</h1>
            <p>{active.description}</p>

            <div className="pricing-spotlight">
              <span>{active.note}</span>
              <strong>{active.accent}</strong>
            </div>
          </div>

          <div className={`pricing-detail ${isStageFading ? "is-fading" : ""}`}>
            {"plans" in active && active.plans ? (
              <>
                <div className="pricing-plan-stack" aria-label="Website care plans">
                  {active.plans.map((plan) => (
                    <article className="pricing-plan-row" key={plan.name}>
                      <div>
                        <span>{plan.name}</span>
                        <strong>{plan.price}</strong>
                      </div>
                      <p>{plan.details.join(" / ")}</p>
                    </article>
                  ))}
                </div>
              </>
            ) : null}

            {"comparison" in active && active.comparison ? (
              <div className="care-comparison" aria-label="Website care plan comparison">
                <div className="care-comparison-row care-comparison-head">
                  <span>Feature</span>
                  <strong>Self</strong>
                  <strong>Standard</strong>
                  <strong>Business</strong>
                </div>
                {active.comparison.map((row) => (
                  <div className="care-comparison-row" key={row.feature}>
                    <span>{row.feature}</span>
                    <p aria-label={row.self ? "Included" : "Not included"}>{row.self ? "+" : "-"}</p>
                    <p aria-label={row.standard ? "Included" : "Not included"}>{row.standard ? "+" : "-"}</p>
                    <p aria-label={row.business ? "Included" : "Not included"}>{row.business ? "+" : "-"}</p>
                  </div>
                ))}
              </div>
            ) : null}

            {"paths" in active && active.paths ? (
              <div className="pricing-path-grid" aria-label="Choose between template and custom websites">
                {active.paths.map((path) => (
                  <article className="pricing-path-card" key={path.name}>
                    <span>{path.name}</span>
                    <strong>{path.price}</strong>
                    <p>{path.body}</p>
                  </article>
                ))}
              </div>
            ) : null}

            {"items" in active && active.items ? (
              <div className="pricing-chip-grid" aria-label={`${active.label} details`}>
                {active.items.map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </div>
            ) : null}

            {"rows" in active && active.rows ? (
              <div className="pricing-rate-list" aria-label={`${active.label} rates`}>
                {active.rows.map((row) => (
                  <div className="pricing-rate-row" key={`${row.label}-${row.value}`}>
                    <span>{row.label}</span>
                    <strong>{row.value}</strong>
                  </div>
                ))}
              </div>
            ) : null}

            {"examples" in active && active.examples ? (
              <div className="pricing-examples">
                <span>Common builds</span>
                <div>
                  {active.examples.map((example) => (
                    <small key={`${example.label}-${example.value}`}>
                      {example.label} <b>{example.value}</b>
                    </small>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <blockquote className="pricing-pitch">
            * Modern, professional websites start at $500. Monthly care plans are
            optional and can cover hosting, updates, and maintenance after launch.
            Domain registration and renewal stay client-owned and are billed separately by the registrar.
            Knoplus is built for service websites and lead generation, not heavy e-commerce or payment processing.
          </blockquote>
          <ScreenCounter current={activeIndex + 1} total={pricingOptions.length} />
        </section>
      </main>

      <main className="mobile-scroll-page mobile-pricing-page">
        <header className="mobile-scroll-header">
          <BrandLogo />
          <SiteMenu onContact={() => setIsContactOpen(true)} onNavigate={navigateWithinKnoplus} />
        </header>

        <div className="mobile-scroll-kicker">Pricing</div>
        {pricingOptions.map((option, index) => (
          <section
            className={`mobile-pricing-section ${activeMobileIndex === index ? "is-active" : ""} ${
              revealedMobileIndexes.has(index) ? "is-revealed" : ""
            }`}
            data-index={index}
            key={option.label}
            ref={(node) => {
              mobileSectionRefs.current[index] = node;
            }}
            style={{ "--bg": option.image } as CSSProperties}
          >
            <div className="mobile-section-count">
              {String(index + 1).padStart(2, "0")} / {String(pricingOptions.length).padStart(2, "0")}
            </div>
            <div className="eyebrow">{option.eyebrow}</div>
            <h2>{option.title}</h2>
            <p>{option.description}</p>
            <div className="pricing-spotlight">
              <span>{option.note}</span>
              <strong>{option.accent}</strong>
            </div>

            {"plans" in option && option.plans ? (
              <>
                <div className="pricing-plan-stack" aria-label="Website care plans">
                  {option.plans.map((plan) => (
                    <article className="pricing-plan-row" key={plan.name}>
                      <div>
                        <span>{plan.name}</span>
                        <strong>{plan.price}</strong>
                      </div>
                      <p>{plan.details.join(" / ")}</p>
                    </article>
                  ))}
                </div>
              </>
            ) : null}

            {"comparison" in option && option.comparison ? (
              <div className="care-comparison" aria-label="Website care plan comparison">
                <div className="care-comparison-row care-comparison-head">
                  <span>Feature</span>
                  <strong>Self</strong>
                  <strong>Standard</strong>
                  <strong>Business</strong>
                </div>
                {option.comparison.map((row) => (
                  <div className="care-comparison-row" key={row.feature}>
                    <span>{row.feature}</span>
                    <p aria-label={row.self ? "Included" : "Not included"}>{row.self ? "+" : "-"}</p>
                    <p aria-label={row.standard ? "Included" : "Not included"}>{row.standard ? "+" : "-"}</p>
                    <p aria-label={row.business ? "Included" : "Not included"}>{row.business ? "+" : "-"}</p>
                  </div>
                ))}
              </div>
            ) : null}

            {"paths" in option && option.paths ? (
              <div className="pricing-path-grid" aria-label="Choose between template and custom websites">
                {option.paths.map((path) => (
                  <article className="pricing-path-card" key={path.name}>
                    <span>{path.name}</span>
                    <strong>{path.price}</strong>
                    <p>{path.body}</p>
                  </article>
                ))}
              </div>
            ) : null}

            {"items" in option && option.items ? (
              <div className="pricing-chip-grid" aria-label={`${option.label} details`}>
                {option.items.map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </div>
            ) : null}

            {"rows" in option && option.rows ? (
              <div className="pricing-rate-list" aria-label={`${option.label} rates`}>
                {option.rows.map((row) => (
                  <div className="pricing-rate-row" key={`${row.label}-${row.value}`}>
                    <span>{row.label}</span>
                    <strong>{row.value}</strong>
                  </div>
                ))}
              </div>
            ) : null}

            {"examples" in option && option.examples ? (
              <div className="pricing-examples">
                <span>Common builds</span>
                <div>
                  {option.examples.map((example) => (
                    <small key={`${example.label}-${example.value}`}>
                      {example.label} <b>{example.value}</b>
                    </small>
                  ))}
                </div>
              </div>
            ) : null}
          </section>
        ))}

        <footer className="mobile-scroll-footer">
          <p>
            * Modern, professional websites start at $500. Monthly care plans are
            optional and can cover hosting, updates, and maintenance after launch.
            Domain registration and renewal stay client-owned and are billed separately by the registrar.
            Knoplus is built for service websites and lead generation, not heavy e-commerce or payment processing.
          </p>
        </footer>
      </main>
      <ContactModal isOpen={isContactOpen} onClose={() => setIsContactOpen(false)} />
    </>
  );
}
