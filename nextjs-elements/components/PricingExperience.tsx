"use client";

import Link from "next/link";
import { useState } from "react";
import { ScreenCounter } from "./ScreenCounter";
import { SiteMenu } from "./SiteMenu";
import {
  additionalServices,
  carePlans,
  customPricing,
  includedItems,
  pagePricing,
  templateExamples
} from "@/data/pricing";

const pricingOptions = [
  {
    label: "Template Sites",
    eyebrow: "Starting at $500",
    title: "A proven framework, tailored until it feels like yours.",
    description:
      "Best for small businesses that need a polished launch without paying for a ground-up design system.",
    accent: "$500",
    note: "One-page starter",
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
    rows: customPricing
  },
  {
    label: "Care Plans",
    eyebrow: "From $0/month",
    title: "Choose how hands-off you want launch to feel after the site goes live.",
    description:
      "Monthly care can cover hosting, SSL, domain support, and small content updates so clients are not left alone with maintenance.",
    accent: "$29",
    note: "Standard monthly care",
    plans: carePlans
  },
  {
    label: "Included",
    eyebrow: "Launch essentials",
    title: "The practical things every site needs are already part of the build.",
    description:
      "A focused launch package with mobile design, forms, deployment, security, domain connection, basic SEO, and support.",
    accent: "7",
    note: "Included essentials",
    items: includedItems
  },
  {
    label: "Add Ons",
    eyebrow: "Custom quote",
    title: "When the site needs deeper systems, we scope it cleanly.",
    description:
      "Booking systems, API work, e-commerce, memberships, and custom functionality can be layered in when the business needs it.",
    accent: "Quote",
    note: "Scoped separately",
    items: additionalServices.map((service) => service.label)
  }
];

export function PricingExperience() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isStageFading, setIsStageFading] = useState(false);
  const active = pricingOptions[activeIndex];

  function navigateWithinKnoplus(destination: string) {
    window.location.href = destination;
  }

  function setPricingOption(index: number) {
    if (index === activeIndex) {
      return;
    }

    setIsStageFading(true);
    window.setTimeout(() => {
      setActiveIndex(index);
      setIsStageFading(false);
    }, 170);
  }

  return (
    <>
      <main className="pricing-choice-app">
        <aside className="pricing-choice-sidebar">
          <Link className="brand" href="/">
            Knoplus
          </Link>

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
              Sexy pricing.
              <br />
              Less spreadsheet.
              <br />
              More clarity.
            </div>
            <a href="mailto:knopluswebsites@gmail.com" className="cta-button">
              Contact Us
            </a>
          </div>
        </aside>

        <section className="pricing-choice-stage">
          <div className="pricing-choice-bg" />
          <SiteMenu onNavigate={navigateWithinKnoplus} />

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
            Know More.
            <br />
            Know Better.
            <br />
            Knoplus.
          </blockquote>
          <button className="pricing-home" onClick={() => navigateWithinKnoplus("/")} type="button">
            Back Home
          </button>
          <ScreenCounter current={activeIndex + 1} total={pricingOptions.length} />
        </section>
      </main>
    </>
  );
}
