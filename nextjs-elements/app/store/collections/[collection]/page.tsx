import type { Metadata } from "next";
import { notFound } from "next/navigation";
import data from "../../catalog.json";
import RosewaveGallery from "../../rosewave-gallery";

export const dynamicParams = false;

export function generateStaticParams() {
  return data.collections.map(collection => ({ collection: collection.id }));
}

export async function generateMetadata({ params }: {
  params: Promise<{ collection: string }>;
}): Promise<Metadata> {
  const { collection: id } = await params;
  const collection = data.collections.find(item => item.id === id);
  return {
    title: `${collection?.name || "Collection"} — Rose Wave Photography`,
    description: collection?.description,
    alternates: { canonical: `/store/collections/${id}` },
    icons: { icon: { url: "/icons/r-plus.svg", type: "image/svg+xml" }, apple: "/icons/k-plus-180.png" },
  };
}

export default async function CollectionPage({ params }: {
  params: Promise<{ collection: string }>;
}) {
  const { collection: id } = await params;
  if (!data.collections.some(item => item.id === id)) notFound();
  return <RosewaveGallery key={id} collectionId={id} />;
}
