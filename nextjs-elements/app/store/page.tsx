import type { Metadata } from "next";
import RosewaveGallery from "./rosewave-gallery";

export const metadata: Metadata = {
  title: "Rose Wave — Photography for the everyday",
  description: "Explore Rose Wave photography. Find a photograph for your phone, your wall, or somewhere in between.",
  alternates: { canonical: "/store" },
  icons: { icon: { url: "/icons/r-plus.svg", type: "image/svg+xml" }, apple: "/icons/k-plus-180.png" },
  openGraph: {
    title: "Rose Wave — Photography for the everyday",
    description: "A different way to see the everyday. Explore the gallery and order prints.",
    images: ["/revamp/rosewave-gallery/photos/blush-of-autumn-01.webp"],
  },
};

export default function GalleryPage() {
  return <RosewaveGallery />;
}
