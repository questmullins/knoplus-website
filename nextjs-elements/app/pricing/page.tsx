import type { Metadata } from "next";
import { PricingExperience } from "@/components/PricingExperience";

export const metadata: Metadata = {
  title: "Website Pricing",
  description:
    "Website pricing for Knoplus template websites, custom websites, care plans, new pages, redesigns, booking systems, e-commerce, and custom functionality.",
  alternates: {
    canonical: "/pricing"
  }
};

export default function PricingPage() {
  return <PricingExperience />;
}
