import type { Metadata } from "next";
import { AppHorizontal } from "../../app-horizontal";
import { rosewaveStory } from "../../walkthroughs";

export const metadata: Metadata = {
  title: "RoseWave — A photograph becomes part of your day",
  description: "Explore RoseWave in the Kno.plus project showcase.",
  alternates: { canonical: "/revamp/rosewave" },
  robots: { index: false, follow: false },
};

export default function RosewaveHorizontal() {
  return <AppHorizontal story={rosewaveStory} />;
}
