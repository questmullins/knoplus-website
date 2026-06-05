import Link from "next/link";
import { BrandLogo } from "./BrandLogo";
import { SiteMenu } from "./SiteMenu";
import type { SeoPage } from "@/data/seoPages";

type SeoLandingPageProps = {
  page: SeoPage;
};

export function SeoLandingPage({ page }: SeoLandingPageProps) {
  return (
    <main className="seo-page">
      <header className="mobile-scroll-header seo-mobile-header">
        <BrandLogo />
        <SiteMenu />
      </header>

      <aside className="seo-sidebar">
        <div className="sidebar-brand">
          <BrandLogo />
        </div>

        <nav className="seo-nav" aria-label="Website service pages">
          <span>Explore</span>
          <Link href="/website-templates">Website Templates</Link>
          <Link href="/custom-websites">Custom Websites</Link>
          <Link href="/small-business-websites">Small Business Websites</Link>
          <Link href="/pricing">Pricing</Link>
        </nav>

        <div className="sidebar-note cta-note">
          <div className="cta-copy">
            Know More.
            <br />
            Know Better.
            <br />
            Knoplus.
          </div>
          <a href="mailto:quest@kno.plus" className="cta-button">
            Contact Us
          </a>
        </div>
      </aside>

      <section className="seo-stage">
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
  );
}
