import type { Metadata } from "next";
import { Landing } from "./landing";

// A trial of a long-scroll home page, kept apart from the real home (/) until Quest decides. Not indexed.
export const metadata: Metadata = {
  title: "Home preview",
  description: "A trial of the long-scroll kno.plus home: the rail of windows, Experience slices, projects and how to work with Quest.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/" },
};

export default function PreviewPage() {
  return <Landing />;
}
