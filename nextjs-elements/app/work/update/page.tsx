import type { Metadata } from "next";
import { AppHorizontal } from "../app-horizontal";
import { updateStory } from "../walkthroughs";

export const metadata: Metadata = {
  title: "UpDate — A little backup. A little more confidence.",
  description:
    "A plan and a little backup, so there’s more room to enjoy the evening. The reason behind UpDate.",
  alternates: { canonical: "/work/update" },
  openGraph: {
    title: "Inside UpDate",
    description:
      "A plan and a little backup, so there’s more room to enjoy the evening.",
    url: "https://kno.plus/work/update",
  },
};

export default function UpdateWalkthrough() {
  return <AppHorizontal story={updateStory} />;
}
