import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

const structuredData = [
  {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: "Knoplus",
    url: "https://kno.plus",
    email: "quest@kno.plus",
    description:
      "Knoplus builds website templates and custom websites for independent businesses with mobile-friendly design, basic SEO setup, contact forms, Cloudflare deployment, and launch support.",
    areaServed: "United States",
    offers: [
      {
        "@type": "Offer",
        name: "Template Website",
        price: "500",
        priceCurrency: "USD",
        description: "Professional template websites customized for small businesses, local companies, and independent brands."
      },
      {
        "@type": "Offer",
        name: "Custom Website",
        price: "1500",
        priceCurrency: "USD",
        description: "Custom website design with original layouts, user experience, visual direction, and launch support."
      },
      {
        "@type": "Offer",
        name: "Website Care Plan",
        price: "29",
        priceCurrency: "USD",
        description: "Optional monthly website care for hosting management, SSL monitoring, domain support, and content updates."
      }
    ],
    serviceType: [
      "Website design",
      "Website templates",
      "Custom websites",
      "Small business website design",
      "Local business websites",
      "SEO setup",
      "Cloudflare deployment"
    ]
  },
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Knoplus",
    url: "https://kno.plus",
    potentialAction: {
      "@type": "ContactAction",
      target: "mailto:quest@kno.plus"
    }
  },
  {
    "@context": "https://schema.org",
    "@type": "SiteNavigationElement",
    name: [
      "About Us",
      "Custom Websites",
      "Home",
      "Our Process",
      "Pricing",
      "Website Templates",
      "Sitemap"
    ],
    url: [
      "https://kno.plus/about",
      "https://kno.plus/custom-websites",
      "https://kno.plus",
      "https://kno.plus/process",
      "https://kno.plus/pricing",
      "https://kno.plus/website-templates",
      "https://kno.plus/sitemap"
    ]
  }
];

export const metadata: Metadata = {
  metadataBase: new URL("https://kno.plus"),
  title: {
    default: "Knoplus | Website Templates and Custom Websites for Independent Businesses",
    template: "%s | Knoplus"
  },
  description:
    "Knoplus builds modern website templates and custom websites for independent companies, local businesses, automotive shops, home service companies, and growing brands.",
  keywords: [
    "website templates",
    "custom websites",
    "small business websites",
    "local business website design",
    "professional websites",
    "mobile-friendly website design",
    "SEO website setup",
    "Cloudflare website deployment",
    "website care plans",
    "automotive website templates",
    "home services website templates",
    "Knoplus"
  ],
  openGraph: {
    title: "Knoplus | Website Templates and Custom Websites",
    description:
      "Modern, professional websites starting at $500 with templates, custom builds, mobile-friendly design, basic SEO setup, and launch support.",
    url: "https://kno.plus",
    siteName: "Knoplus",
    type: "website"
  },
  robots: {
    index: true,
    follow: true
  }
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Kanit:wght@200;300;400;500;600&family=Stack+Sans+Text:wght@200..700&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
