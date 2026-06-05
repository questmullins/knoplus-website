export const pagePricing = [
  { label: "Page 1", value: "$500" },
  { label: "Pages 2-5", value: "$250/page" },
  { label: "Pages 6-10", value: "$225/page" },
  { label: "Pages 11+", value: "$200/page" }
];

export const templateExamples = [
  { label: "1 Page", value: "$500" },
  { label: "3 Pages", value: "$1,000" },
  { label: "5 Pages", value: "$1,500" },
  { label: "10 Pages", value: "$2,625" }
];

export const customPricing = [
  { label: "Page 1", value: "$1,500" },
  { label: "Pages 2-5", value: "$750/page" },
  { label: "Pages 6-10", value: "$675/page" },
  { label: "Pages 11+", value: "$600/page" }
];

export const includedItems = [
  "Mobile-friendly design",
  "Contact form integration",
  "Cloudflare deployment",
  "SSL security",
  "Client-owned domain connection",
  "Basic SEO setup",
  "Launch support"
];

export const carePlans = [
  {
    name: "Self Managed",
    price: "$0/month",
    details: [
      "Website handoff after launch",
      "Client manages hosting, renewals, updates, and content changes",
      "Best for teams comfortable owning the technical follow-through"
    ]
  },
  {
    name: "Standard Care",
    price: "$39/month",
    details: [
      "Hosting management",
      "SSL monitoring",
      "Client-owned domain and DNS connection assistance",
      "Basic uptime checks",
      "Monthly plugin/static asset check where applicable",
      "Up to 30 minutes of content updates per month"
    ]
  },
  {
    name: "Business Care",
    price: "$99/month",
    details: [
      "Everything in Standard Care",
      "Priority support",
      "Monthly performance and SEO health check",
      "Minor layout polish for seasonal offers or service changes",
      "Up to 1 hour of content updates per month"
    ]
  }
];

export const careComparison = [
  { feature: "Launch handoff", self: true, standard: true, business: true },
  { feature: "Hosting management", self: false, standard: true, business: true },
  { feature: "SSL monitoring", self: false, standard: true, business: true },
  { feature: "Client-owned domain connection", self: false, standard: true, business: true },
  { feature: "Domain registration included", self: false, standard: false, business: false },
  { feature: "Basic uptime checks", self: false, standard: true, business: true },
  { feature: "30 minutes of updates", self: false, standard: true, business: true },
  { feature: "1 hour of updates", self: false, standard: false, business: true },
  { feature: "Priority support", self: false, standard: false, business: true },
  { feature: "Performance health check", self: false, standard: false, business: true },
  { feature: "Basic SEO health check", self: false, standard: false, business: true },
  { feature: "Seasonal layout polish", self: false, standard: false, business: true }
];

export const additionalServices = [
  { label: "Domain Setup Service", value: "$75 one-time" },
  { label: "New Page", value: "Current page rate" },
  { label: "Major Redesign", value: "Custom Quote" },
  { label: "Light Booking Links", value: "Custom Quote" },
  { label: "Simple API Connections", value: "Custom Quote" },
  { label: "E-Commerce / Payments", value: "Not primary fit" },
  { label: "Membership Areas", value: "Not primary fit" },
  { label: "Heavy Custom Functionality", value: "Not primary fit" }
];
