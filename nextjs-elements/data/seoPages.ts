export type SeoPage = {
  slug: string;
  eyebrow: string;
  title: string;
  description: string;
  keywords: string[];
  sections: Array<{
    heading: string;
    body: string;
  }>;
  links: Array<{
    label: string;
    href: string;
  }>;
};

export const seoPages: SeoPage[] = [
  {
    slug: "small-business-websites",
    eyebrow: "Small business websites",
    title: "Professional websites for small and independent businesses.",
    description:
      "Knoplus builds small business websites with mobile-friendly design, clear services, contact forms, basic SEO setup, launch support, and optional care plans.",
    keywords: [
      "small business websites",
      "independent business websites",
      "local business website design",
      "professional websites for small business",
      "affordable business websites"
    ],
    sections: [
      {
        heading: "Clear enough to trust",
        body:
          "A good small business website explains who you are, what you do, why people should trust you, and how they can take the next step."
      },
      {
        heading: "Practical launch support",
        body:
          "Knoplus can help with structure, copy direction, imagery, forms, Cloudflare deployment, SSL, domain connection, and monthly care after launch."
      }
    ],
    links: [
      { label: "Explore Templates", href: "/" },
      { label: "View Pricing", href: "/pricing" },
      { label: "Website Care Plans", href: "/website-care-plans" }
    ]
  },
  {
    slug: "automotive-website-templates",
    eyebrow: "Automotive website templates",
    title: "Automotive website templates for shops, specialists, and service brands.",
    description:
      "Knoplus automotive website templates are built for service shops, specialists, and local automotive businesses that need strong visuals, service sections, quote paths, and trust signals.",
    keywords: [
      "automotive website templates",
      "auto shop website template",
      "mechanic website design",
      "car service website",
      "automotive business website"
    ],
    sections: [
      {
        heading: "Built around service demand",
        body:
          "Automotive customers need clarity fast: services, location, proof, contact details, and a reason to trust the shop before they call."
      },
      {
        heading: "Templates with real direction",
        body:
          "Traditional Auto and Synergy show two different directions: bold high-contrast service energy or softer polished local-business trust."
      }
    ],
    links: [
      { label: "Explore Automotive Templates", href: "/" },
      { label: "View Template Pricing", href: "/pricing" },
      { label: "Request Custom Quote", href: "/pricing" }
    ]
  },
  {
    slug: "home-services-website-templates",
    eyebrow: "Home services websites",
    title: "Home services website templates built for leads and local trust.",
    description:
      "Knoplus home services website templates support cleaning, restoration, repair, and emergency service businesses with service pages, lead forms, trust signals, and mobile-friendly layouts.",
    keywords: [
      "home services website templates",
      "cleaning website template",
      "restoration website template",
      "service business website",
      "lead generation website template"
    ],
    sections: [
      {
        heading: "Designed for urgent decisions",
        body:
          "Home service customers often need help quickly. The website has to make services, trust, quote requests, and phone-ready action easy to find."
      },
      {
        heading: "Lead-gen without clutter",
        body:
          "The Cleaning Services template is structured for emergency-ready conversion, service clarity, insurance support, and strong local credibility."
      }
    ],
    links: [
      { label: "Explore Home Service Templates", href: "/" },
      { label: "View Pricing", href: "/pricing" },
      { label: "See Our Process", href: "/process" }
    ]
  },
  {
    slug: "website-care-plans",
    eyebrow: "Website care plans",
    title: "Website care plans for hosting, updates, SSL, and support.",
    description:
      "Knoplus website care plans help businesses manage hosting, SSL monitoring, domain support, priority support, and small content updates after launch.",
    keywords: [
      "website care plans",
      "website maintenance",
      "small business website support",
      "website hosting management",
      "SSL monitoring"
    ],
    sections: [
      {
        heading: "Launch is not the whole story",
        body:
          "After a site goes live, someone still has to think about hosting, SSL, domain support, small updates, and basic upkeep."
      },
      {
        heading: "Choose the level of hands-off",
        body:
          "Clients can self-manage, use Standard Care for essentials, or choose Business Care for priority support and more monthly update time."
      }
    ],
    links: [
      { label: "View Care Pricing", href: "/pricing" },
      { label: "Explore Templates", href: "/" },
      { label: "Request Custom Quote", href: "/pricing" }
    ]
  }
];

export function getSeoPage(slug: string) {
  return seoPages.find((page) => page.slug === slug);
}
