import type { Metadata } from "next";
import { Landing } from "./home/landing";

export const metadata: Metadata = {
  title: "Quest · websites, apps and business systems",
  description:
    "I’m Quest. I build websites, apps, and the systems that take busywork off a team’s plate. See what I’ve done, try what I’ve made, or start something with me.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Kno.plus — Ideas into useful things",
    description: "Design and development. Websites, web tools, and mobile apps.",
    url: "https://kno.plus/",
  },
};

export default function HomePage() {
  return <Landing />;
}
