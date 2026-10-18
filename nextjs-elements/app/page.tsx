import type { Metadata } from "next";
import { ProjectHub } from "@/components/ProjectHub";

export const metadata: Metadata = {
  title: {
    absolute: "Knoplus | Apps, Web Tools and Websites"
  },
  description:
    "Knoplus is a hub for apps, browser tools, design automation and the Knoplus website service. Explore UpDate, Rosewave, Freestyle, Prepress Assistant and more.",
  alternates: {
    canonical: "/"
  }
};

export default function HomePage() {
  return <ProjectHub />;
}
