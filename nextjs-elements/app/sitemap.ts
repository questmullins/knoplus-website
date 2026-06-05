import type { MetadataRoute } from "next";
import { seoPages } from "@/data/seoPages";
import { templates } from "@/data/templates";

const baseUrl = "https://kno.plus";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const corePages = ["", "/about", "/process", "/pricing", "/sitemap"];
  const servicePages = seoPages.map((page) => `/${page.slug}`);
  const templatePages = Array.from(new Set(templates.map((template) => template.link)));

  return [...corePages, ...servicePages, ...templatePages].map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: path === "" || path.startsWith("/templates/") ? "weekly" : "monthly",
    priority: path === "" ? 1 : path === "/pricing" ? 0.9 : path.startsWith("/templates/") ? 0.7 : 0.75
  }));
}
