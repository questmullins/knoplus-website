import type { Metadata } from "next";
import { ServicesShowcase } from "./services-showcase";

export const metadata: Metadata = {
  title: "Web Services & App Services",
  description:
    "A new direction for Kno.plus: thoughtful websites, web tools, and mobile apps, shaped around the thing you want to change.",
  alternates: { canonical: "/revamp" },
  robots: { index: false, follow: false },
  openGraph: {
    title: "Kno.plus — Ideas into useful things",
    description:
      "Design and development. Explore a new direction for Kno.plus.",
    url: "https://kno.plus/revamp",
  },
};

export default function RevampPage() {
  return <ServicesShowcase />;
}
