import type { Metadata } from "next";
import { TemplateShowcase } from "@/components/TemplateShowcase";

export const metadata: Metadata = {
  title: "Website Templates and Custom Websites",
  description:
    "Explore Knoplus website templates, custom website options, mobile-friendly layouts, SEO-ready structure, and launch support for independent businesses.",
  alternates: {
    canonical: "/websites"
  },
  openGraph: {
    title: "Knoplus | Website Templates and Custom Websites",
    description:
      "Modern, professional websites starting at $500 with templates, custom builds, mobile-friendly design, basic SEO setup, and launch support.",
    url: "https://kno.plus/websites"
  }
};

export default function HomePage() {
  return <TemplateShowcase />;
}
