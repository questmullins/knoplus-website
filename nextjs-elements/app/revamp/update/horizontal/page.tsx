import type { Metadata } from "next";
import { AppHorizontal } from "../../app-horizontal";
import { updateStory } from "../../walkthroughs";

export const metadata: Metadata = {
  title: "UpDate — Horizontal preview",
  description: "A little backup. A little more confidence. Explore UpDate, one pane at a time.",
  robots: { index: false, follow: false },
};

export default function UpdateHorizontal() {
  return <AppHorizontal story={updateStory} />;
}
