export type TemplateItem = {
  label: string;
  navTitle: string;
  title: string;
  description: string;
  image: string;
  link: string;
  theme: "traditional-auto" | "synergy" | "editorial-local" | "dark-luxury" | "cleaning-restoration";
  features: string[];
  sellingPoints: string[];
  price: string;
  genre: "Automotive" | "Home Services" | "General Local" | "Premium";
  stack: string[];
  styleTags: string[];
};

export const templates: TemplateItem[] = [
  {
    label: "BMW specialist energy",
    navTitle: "Traditional Auto",
    title: "Better care.<br>Real results.<br><em>Any car.</em>",
    description: "A bold service-shop template with oversized headlines, high-contrast sections, and direct booking energy.",
    image: "url('https://images.unsplash.com/photo-1603386329225-868f9b1ee6c9?auto=format&fit=crop&w=1800&q=80')",
    link: "https://m5x-mechanix-website.questmullins.workers.dev/",
    theme: "traditional-auto",
    features: ["2-page build", "Service sections", "Contact form"],
    sellingPoints: ["High-impact first impression", "Built for bookings"],
    price: "$750 as shown",
    genre: "Automotive",
    stack: ["HTML", "CSS", "JavaScript"],
    styleTags: ["Classic", "Bold", "High contrast"]
  },
  {
    label: "Rounded concept",
    navTitle: "Synergy",
    title: "Honest service<br>for things people<br><em>care about.</em>",
    description: "A softer full-screen concept with floating navigation, generous spacing, and a calmer service-first tone.",
    image: "url('https://images.unsplash.com/photo-1619767886558-efdc259cde1a?auto=format&fit=crop&w=1800&q=80')",
    link: "https://next-m5x-concepts.questmullins.workers.dev/",
    theme: "synergy",
    features: ["2-page build", "Floating nav", "FAQ sections"],
    sellingPoints: ["Feels polished and modern", "Easy to scan"],
    price: "$750 as shown",
    genre: "Automotive",
    stack: ["Next.js", "React", "JavaScript"],
    styleTags: ["Modern", "Glass", "Soft UI"]
  },
  {
    label: "Local trust",
    navTitle: "Editorial Local",
    title: "Clear details.<br>Useful sections.<br><em>Local proof.</em>",
    description: "Built for businesses that need services, about copy, hours, reviews, and contact details to feel organized and credible.",
    image: "url('https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1800&q=80')",
    link: "https://m5x-mechanix-website.questmullins.workers.dev/",
    theme: "editorial-local",
    features: ["2-page build", "About section", "Location details"],
    sellingPoints: ["Strong local credibility", "Clear customer path"],
    price: "$750 as shown",
    genre: "General Local",
    stack: ["HTML", "CSS", "JavaScript"],
    styleTags: ["Editorial", "Classic", "Trust-focused"]
  },
  {
    label: "Premium dark mode",
    navTitle: "Dark Luxury",
    title: "Cinematic visuals.<br>Minimal chrome.<br><em>Sharper mood.</em>",
    description: "A darker version of the concept site for brands that want polish, restraint, and a more premium first impression.",
    image: "url('https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1800&q=80')",
    link: "https://next-m5x-concepts.questmullins.workers.dev/",
    theme: "dark-luxury",
    features: ["2-page build", "Premium sections", "Minimal UI"],
    sellingPoints: ["Feels high-end quickly", "Great for visual brands"],
    price: "$750 as shown",
    genre: "Premium",
    stack: ["Next.js", "React", "JavaScript"],
    styleTags: ["Luxury", "Dark", "Cinematic"]
  },
  {
    label: "Emergency lead-gen",
    navTitle: "Cleaning Services",
    title: "Urgent help.<br>Clear services.<br><em>Real leads.</em>",
    description:
      "A restoration and cleaning template built for calls, quote requests, insurance support, and high-trust service pages.",
    image: "url('https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1800&q=80')",
    link: "http://127.0.0.1:3006/",
    theme: "cleaning-restoration",
    features: ["3-page build", "Lead form", "Services page"],
    sellingPoints: ["Emergency-ready conversion", "Strong trust signals"],
    price: "$1,000 as shown",
    genre: "Home Services",
    stack: ["Next.js", "React", "JavaScript"],
    styleTags: ["Modern", "Lead-gen", "Emergency"]
  }
];
