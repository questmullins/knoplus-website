import type { Metadata } from "next";
import { AppHorizontal } from "../app-horizontal";
import { rosewaveStory } from "../walkthroughs";

export const metadata: Metadata = {
  title: "RoseWave — A photograph becomes part of your day.",
  description:
    "Give a photograph you connect with a place in your everyday. The reason behind RoseWave.",
  alternates: { canonical: "/work/rosewave" },
  openGraph: {
    title: "Inside RoseWave",
    description: "Give a photograph you connect with a place in your everyday.",
    url: "https://kno.plus/work/rosewave",
  },
};

export default function RosewaveWalkthrough() {
  return <AppHorizontal story={rosewaveStory} />;
}
