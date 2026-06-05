import type { Metadata } from "next";
import { PricingExperience } from "@/components/PricingExperience";

export const metadata: Metadata = {
  title: "Website Pricing for Template and Custom Builds",
  description:
    "Compare Knoplus template website pricing, custom website pricing, care plans, launch essentials, add-ons, redesigns, booking systems, e-commerce, and custom functionality.",
  alternates: {
    canonical: "/pricing"
  }
};

export default function PricingPage() {
  return <PricingExperience />;
}
