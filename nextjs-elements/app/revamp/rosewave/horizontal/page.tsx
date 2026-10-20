import type { Metadata } from "next";
import { AppHorizontal } from "../../app-horizontal";
import { rosewaveStory } from "../../walkthroughs";

export const metadata: Metadata = {
  title: "RoseWave — Horizontal preview",
  description: "A photograph becomes part of your day. Explore RoseWave, one pane at a time.",
  robots: { index: false, follow: false },
};

export default function RosewaveHorizontal() {
  return <AppHorizontal story={rosewaveStory} />;
}
