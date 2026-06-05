import type { Metadata } from "next";
import { ProcessExperience } from "@/components/ProcessExperience";

export const metadata: Metadata = {
  title: "Website Design Process",
  description:
    "See the Knoplus website design process for template websites, custom websites, content planning, mobile-friendly builds, Cloudflare deployment, and launch support."
};

export default function ProcessPage() {
  return <ProcessExperience />;
}
