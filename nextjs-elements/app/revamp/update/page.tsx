import type { Metadata } from "next";
import { AppWalkthrough } from "../app-walkthrough";
import { updateStory } from "../walkthroughs";

export const metadata: Metadata = {
  title: "Inside UpDate — A real-screen walkthrough",
  description:
    "Explore UpDate through the app in action: planning a date, check-in choices, Get Me Out, and the emergency visual preview.",
  alternates: { canonical: "/revamp/update" },
  robots: { index: false, follow: false },
  openGraph: {
    title: "Inside UpDate",
    description:
      "A real-screen walkthrough of the current Android development build.",
    url: "https://kno.plus/revamp/update",
  },
};

export default function UpdateWalkthrough() {
  return <AppWalkthrough story={updateStory} />;
}
