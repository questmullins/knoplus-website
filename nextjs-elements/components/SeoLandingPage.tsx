"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { BrandLogo } from "./BrandLogo";
import { ContactModal } from "./ContactModal";
import { SiteMenu } from "./SiteMenu";
import type { SeoPage } from "@/data/seoPages";

type SeoLandingPageProps = {
  page: SeoPage;
};

export function SeoLandingPage({ page }: SeoLandingPageProps) {
  const [isContactOpen, setIsContactOpen] = useState(false);
  const stageRef = useRef<HTMLElement | null>(null);

  function navigateWithinKnoplus(destination: string) {
    window.location.href = destination;
  }

  useEffect(() => {
    const stage = stageRef.current;

    if (!stage) {
      return;
    }

    const updateParallax = () => {
      const viewportHeight = window.innerHeight || 1;
      const rect = stage.getBoundingClientRect();
      const progress = (rect.top - viewportHeight / 2) / viewportHeight;
      stage.style.setProperty("--parallax-y", `${Math.max(-36, Math.min(36, progress * -44))}px`);
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
      <main className="seo-page">
        <header className="mobile-scroll-header seo-mobile-header">
          <BrandLogo />
          <SiteMenu onContact={() => setIsContactOpen(true)} onNavigate={navigateWithinKnoplus} />
        </header>

        <aside className="seo-sidebar">
          <div className="sidebar-brand">
            <BrandLogo />
          </div>

          <nav className="seo-nav" aria-label="Website service pages">
            <span>Explore</span>
            <Link href="/custom-websites">Custom Websites</Link>
            <Link href="/pricing">Pricing</Link>
            <Link href="/small-business-websites">Small Business Websites</Link>
            <Link href="/website-templates">Website Templates</Link>
          </nav>

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

        <section className="seo-stage" ref={stageRef}>
          <SiteMenu
            className="stage-menu-control"
            hideIcon
            onContact={() => setIsContactOpen(true)}
            onNavigate={navigateWithinKnoplus}
            showLabel
          />
          <div className="seo-bg" />
          <div className="seo-copy">
            <div className="eyebrow">{page.eyebrow}</div>
            <h1>{page.title}</h1>
            <p>{page.description}</p>
          </div>

          <div className="seo-detail">
            {page.sections.map((section) => (
              <article className="seo-panel" key={section.heading}>
                <span>{section.heading}</span>
                <p>{section.body}</p>
              </article>
            ))}

            <div className="seo-links">
              {page.links.map((link) => (
                <Link className="cta-button" href={link.href} key={link.href}>
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>

      <ContactModal isOpen={isContactOpen} onClose={() => setIsContactOpen(false)} />
    </>
  );
}
