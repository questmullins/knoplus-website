import type { MetadataRoute } from "next";
import { templates } from "@/data/templates";

const baseUrl = "https://kno.plus";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  // Only the home page and the pages in its look; the older pages (/websites, /store, /work/…, the service pages) forward elsewhere.
  const corePages = [""];
  const toolPages = ["/webtools/freestyle/", "/examples/", ...["annotation", "barcode", "dieline", "fill", "made-before", "labels"].map((slug) => `/examples/${slug}/`)];
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

  return [...corePages, ...toolPages, ...templatePages, ...templateSubpages].map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: path === "" || path.startsWith("/templates/") ? "weekly" : "monthly",
    priority: path === "" ? 1 : path.startsWith("/templates/") ? 0.7 : 0.75
  }));
}
