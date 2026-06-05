import type { Metadata } from "next";
import { TemplateShowcase } from "@/components/TemplateShowcase";

export const metadata: Metadata = {
  title: "Website Templates and Custom Websites",
  description:
    "Explore Knoplus website templates, custom website options, mobile-friendly layouts, SEO-ready structure, and launch support for independent businesses.",
  alternates: {
    canonical: "/"
  }
};

export default function HomePage() {
  return <TemplateShowcase />;
}
