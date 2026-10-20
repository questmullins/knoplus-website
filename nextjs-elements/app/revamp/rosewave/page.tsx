import type { Metadata } from "next";
import { AppWalkthrough } from "../app-walkthrough";
import { rosewaveStory } from "../walkthroughs";

export const metadata: Metadata = {
  title: "RoseWave — A photograph becomes part of your day.",
  description:
    "Give a photograph you connect with a place in your everyday. The reason behind RoseWave.",
  alternates: { canonical: "/revamp/rosewave" },
  robots: { index: false, follow: false },
  openGraph: {
    title: "Inside RoseWave",
    description: "Give a photograph you connect with a place in your everyday.",
    url: "https://kno.plus/revamp/rosewave",
  },
};

export default function RosewaveWalkthrough() {
  return <AppWalkthrough story={rosewaveStory} />;
}
