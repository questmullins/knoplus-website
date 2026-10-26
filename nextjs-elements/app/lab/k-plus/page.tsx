import type { Metadata } from "next";
import { Lab } from "./lab";

export const metadata: Metadata = {
  title: "K+ experiments",
  description: "Tab icons and a K-to-plus loading animation for kno.plus.",
  robots: { index: false, follow: false },
};

export default function KPlusLabPage() {
  return <Lab />;
}
