import type { MetadataRoute } from "next";
import { seoPages } from "@/data/seoPages";
import { templates } from "@/data/templates";
import { projectCatalog } from "./work/project-catalog";
import storeCatalog from "./store/catalog.json";

const baseUrl = "https://kno.plus";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const corePages = ["", "/websites", "/store", "/sitemap"];
  const toolPages = ["/webtools/freestyle/"];
  const workPages = projectCatalog.map((project) => `/work/${project.slug}`);
  const storePages = storeCatalog.collections.map((collection) => `/store/collections/${collection.id}`);
  const servicePages = seoPages.map((page) => `/${page.slug}`);
  const templatePages = Array.from(new Set(templates.map((template) => template.link)));
  const templateSubpages = [
    "/lawrence-autorepair",
    "/lawrence-autorepair/services.html",
    "/lawrence-autorepair/knowledgebase.html",
    "/lawrence-autorepair/testimonial.html",
    "/lawrence-autorepair/contact.html",
    "/templates/homey-coffee/story.html",
    "/templates/homey-coffee/location.html",
    "/templates/homey-coffee/careers.html",
    "/templates/homey-coffee/contact.html",
    "/templates/photo-portfolio/index.html"
  ];

  return [...corePages, ...toolPages, ...workPages, ...storePages, ...servicePages, ...templatePages, ...templateSubpages].map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: path === "" || path.startsWith("/templates/") ? "weekly" : "monthly",
    priority: path === "" ? 1 : path.startsWith("/work/") ? 0.9 : path.startsWith("/templates/") ? 0.7 : 0.75
  }));
}
