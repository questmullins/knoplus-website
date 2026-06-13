export type TemplateItem = {
  label: string;
  navTitle: string;
  title: string;
  description: string;
  image: string;
  link: string;
  theme:
    | "traditional-auto"
    | "synergy"
    | "editorial-local"
    | "granite-watches"
    | "cleaning-restoration"
    | "homey-coffee";
  features: string[];
  sellingPoints: string[];
  price: string;
  genre: "Automotive" | "Food & Beverage" | "Home Services" | "General Local" | "Premium";
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
    link: "/templates/traditional-auto/index.html",
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
    link: "/templates/synergy/index.html",
    theme: "synergy",
    features: ["2-page build", "Floating nav", "FAQ sections"],
    sellingPoints: ["Feels polished and modern", "Easy to scan"],
    price: "$750 as shown",
    genre: "Automotive",
    stack: ["Next.js", "React", "JavaScript"],
    styleTags: ["Modern", "Glass", "Soft UI"]
  },
  {
    label: "Neighborhood coffeehouse",
    navTitle: "Homey Coffee",
    title: "Warm cups.<br>Soft corners.<br><em>Stay awhile.</em>",
    description:
      "A cozy cafe template with a Synergy-inspired polish, story-led pages, location details, hiring copy, and a calm contact path.",
    image: "url('https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1800&q=80')",
    link: "/templates/homey-coffee/index.html",
    theme: "homey-coffee",
    features: ["5-page build", "Menu highlights", "Location and careers"],
    sellingPoints: ["Feels warm and local", "Built for cafe discovery"],
    price: "$1,250 as shown",
    genre: "Food & Beverage",
    stack: ["HTML", "CSS", "JavaScript"],
    styleTags: ["Homey", "Editorial", "Soft UI"]
  },
  {
    label: "Editorial photographer",
    navTitle: "Photography",
    title: "Wild places.<br>Quiet frames.<br><em>Real work.</em>",
    description:
      "A refined photography portfolio template with full-width category panels, filtered galleries, print inquiries, and a calm editorial feel.",
    image: "url('https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1800&q=80')",
    link: "/templates/granite-watches/index.html",
    theme: "granite-watches",
    features: ["Portfolio filtering", "Image-led sections", "Print/contact path"],
    sellingPoints: ["Strong visual first impression", "Easy gallery browsing"],
    price: "$1,500 as shown",
    genre: "Premium",
    stack: ["HTML", "CSS", "JavaScript"],
    styleTags: ["Editorial", "Minimal", "Photography"]
  },
  {
    label: "Emergency lead-gen",
    navTitle: "Cleaning Services",
    title: "Urgent help.<br>Clear services.<br><em>Real leads.</em>",
    description:
      "A restoration and cleaning template built for calls, quote requests, insurance support, and high-trust service pages.",
    image: "url('https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1800&q=80')",
    link: "/templates/cleaning-services/index.html",
    theme: "cleaning-restoration",
    features: ["3-page build", "Lead form", "Services page"],
    sellingPoints: ["Emergency-ready conversion", "Strong trust signals"],
    price: "$1,000 as shown",
    genre: "Home Services",
    stack: ["Next.js", "React", "JavaScript"],
    styleTags: ["Modern", "Lead-gen", "Emergency"]
  }
];
