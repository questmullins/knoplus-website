import type { Metadata } from "next";
import { ServicesShowcase } from "./work/services-showcase";

export const metadata: Metadata = {
  title: "Web Services & App Services",
  description:
    "Thoughtful websites, web tools, and mobile apps, shaped around the thing you want to change.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Kno.plus — Ideas into useful things",
    description: "Design and development. Websites, web tools, and mobile apps.",
    url: "https://kno.plus/",
  },
};

export default function HomePage() {
  return <ServicesShowcase />;
}
