import type { Metadata } from "next";
import { TemplateShowcase } from "@/components/TemplateShowcase";

export const metadata: Metadata = {
  icons: { icon: { url: "/icons/w-plus.svg", type: "image/svg+xml" }, apple: "/icons/k-plus-180.png" },
  title: "Website Templates and Custom Websites",
  description:
    "Explore Knoplus website templates, custom website options, mobile-friendly layouts, SEO-ready structure, and launch support for independent businesses.",
  alternates: {
    canonical: "/websites"
  }
};

export default function WebsitesPage() {
  return <TemplateShowcase />;
}
