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
  "Domain connection",
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
    price: "$29/month",
    details: [
      "Hosting management",
      "SSL monitoring",
      "Domain management assistance",
      "Basic uptime checks",
      "Monthly plugin/static asset check where applicable",
      "Up to 15 minutes of content updates per month"
    ]
  },
  {
    name: "Business Care",
    price: "$79/month",
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
  { feature: "Hosting management", self: "Client managed", standard: "Included", business: "Included" },
  { feature: "SSL monitoring", self: "Client managed", standard: "Included", business: "Included" },
  { feature: "Domain help", self: "Launch handoff", standard: "Assistance", business: "Priority assistance" },
  { feature: "Content updates", self: "Quoted as needed", standard: "15 min/month", business: "1 hr/month" },
  { feature: "Support speed", self: "As available", standard: "Standard", business: "Priority" },
  { feature: "Performance checks", self: "Not included", standard: "Basic uptime", business: "Monthly review" },
  { feature: "SEO health checks", self: "Not included", standard: "Launch setup only", business: "Monthly basics" },
  { feature: "Best fit", self: "Hands-on owners", standard: "Simple sites", business: "Active businesses" }
];

export const additionalServices = [
  { label: "New Page", value: "Current page rate" },
  { label: "Major Redesign", value: "Custom Quote" },
  { label: "Booking Systems", value: "Custom Quote" },
  { label: "API Integrations", value: "Custom Quote" },
  { label: "E-Commerce", value: "Custom Quote" },
  { label: "Membership Areas", value: "Custom Quote" },
  { label: "Custom Functionality", value: "Custom Quote" }
];
