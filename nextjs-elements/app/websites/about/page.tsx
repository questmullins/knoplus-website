import type { Metadata } from "next";
import { AboutExperience } from "@/components/AboutExperience";

export const metadata: Metadata = {
  title: "About Our Website Design Service",
  description:
    "Knoplus supports independent companies with professional website design, practical website templates, custom builds, efficient launches, and pride in the details.",
  alternates: {
    canonical: "/websites/about"
  }
};

export default function AboutPage() {
  return <AboutExperience />;
}
