import type { MetadataRoute } from "next";
import { appStories } from "@/data/appStories";
import { projectPages } from "@/data/projects";
import { seoPages } from "@/data/seoPages";
import { templates } from "@/data/templates";

const baseUrl = "https://kno.plus";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const corePages = ["", "/websites", "/websites/about", "/websites/process", "/websites/pricing", "/sitemap"];
  const projectPaths = [...projectPages.map((project) => project.href), ...appStories.map((story) => `/apps/${story.slug}`)];
  const servicePages = seoPages.map((page) => `/websites/${page.slug}`);
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

  return [...corePages, ...projectPaths, ...servicePages, ...templatePages, ...templateSubpages].map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: path === "" || path.startsWith("/templates/") ? "weekly" : "monthly",
    priority: path === "" || path === "/websites" ? 1 : path === "/websites/pricing" ? 0.9 : path.startsWith("/templates/") ? 0.7 : 0.75
  }));
}
