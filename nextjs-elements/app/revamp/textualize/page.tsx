import type { Metadata } from "next";
import { ServicesShowcase } from "../services-showcase";

export const metadata: Metadata = {
  title: "Textualize — Your phone, in your own words",
  description: "Styled text shortcuts and home-screen boards. Explore Textualize, an Android app in development.",
  alternates: { canonical: "/revamp/textualize" },
  robots: { index: false, follow: false },
};

export default function TextualizePage() {
  return <ServicesShowcase initialId="textualize" />;
}
