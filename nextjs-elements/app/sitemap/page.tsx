import type { Metadata } from "next";
import Link from "next/link";
import { SiteMenu } from "@/components/SiteMenu";
import { seoPages } from "@/data/seoPages";
import { templates } from "@/data/templates";

export const metadata: Metadata = {
  title: "Sitemap",
  description:
    "Browse the Knoplus sitemap for website templates, custom website design, pricing, process, care plans, and template previews.",
  alternates: {
    canonical: "/sitemap"
  },
  robots: {
    index: true,
    follow: true
  }
};

const corePages = [
  { label: "Home", href: "/" },
  { label: "About Us", href: "/about" },
  { label: "Our Process", href: "/process" },
  { label: "Pricing", href: "/pricing" }
];

export default function SitemapPage() {
  const templateLinks = Array.from(
    new Map(templates.map((template) => [template.link, { label: `${template.navTitle} Template`, href: template.link }])).values()
  );

  return (
    <main className="sitemap-page">
      <SiteMenu className="sitemap-menu" />
      <section className="sitemap-hero">
        <div className="eyebrow">Knoplus sitemap</div>
        <h1>Find the website service, pricing, or template path you need.</h1>
        <p>
          This sitemap connects the main Knoplus website design pages, service landing pages,
          template previews, pricing, care plans, and process information for easier browsing and indexing.
        </p>
      </section>

      <section className="sitemap-grid" aria-label="Knoplus sitemap links">
        <div className="sitemap-group">
          <h2>Main Pages</h2>
          {corePages.map((page) => (
            <Link href={page.href} key={page.href}>
              {page.label}
            </Link>
          ))}
        </div>

        <div className="sitemap-group">
          <h2>Website Services</h2>
          {seoPages.map((page) => (
            <Link href={`/${page.slug}`} key={page.slug}>
              {page.title}
            </Link>
          ))}
        </div>

        <div className="sitemap-group">
          <h2>Template Previews</h2>
          {templateLinks.map((page) => (
            <Link href={page.href} key={page.href}>
              {page.label}
            </Link>
          ))}
        </div>

        <div className="sitemap-group">
          <h2>Search Console</h2>
          <Link href="/sitemap.xml">XML Sitemap</Link>
          <Link href="/robots.txt">Robots.txt</Link>
        </div>
      </section>
    </main>
  );
}
