import type { Metadata } from "next";
import { AppWalkthrough } from "../app-walkthrough";
import { rosewaveStory } from "../walkthroughs";

export const metadata: Metadata = {
  title: "Inside RoseWave — A real-screen walkthrough",
  description:
    "Explore RoseWave through the app in action: free photography, release galleries, wallpaper selection, and the Android wallpaper handoff.",
  alternates: { canonical: "/revamp/rosewave" },
  robots: { index: false, follow: false },
  openGraph: {
    title: "Inside RoseWave",
    description: "A real-screen walkthrough of the Android test app.",
    url: "https://kno.plus/revamp/rosewave",
  },
};

export default function RosewaveWalkthrough() {
  return <AppWalkthrough story={rosewaveStory} />;
}
