import type { MetadataRoute } from "next";
import { seoPages } from "@/data/seoPages";

const baseUrl = "https://kno.plus";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const corePages = ["", "/about", "/process", "/pricing"];
  const servicePages = seoPages.map((page) => `/${page.slug}`);

  return [...corePages, ...servicePages].map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: path === "" ? "weekly" : "monthly",
    priority: path === "" ? 1 : path === "/pricing" ? 0.9 : 0.75
  }));
}
