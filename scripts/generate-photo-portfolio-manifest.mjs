import { existsSync, readdirSync, writeFileSync } from "node:fs";
import { basename, extname, join } from "node:path";

const imageExtensions = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif", ".gif"]);
const templateRoot = join(process.cwd(), "nextjs-elements", "public", "templates", "photo-portfolio");
const photosRoot = join(templateRoot, "photos");
const manifestPath = join(templateRoot, "photo-manifest.json");

function titleFromSlug(value) {
  return value
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function isImage(fileName) {
  return imageExtensions.has(extname(fileName).toLowerCase());
}

function sortImages(a, b) {
  const aBase = basename(a, extname(a)).toLowerCase();
  const bBase = basename(b, extname(b)).toLowerCase();
  const rank = (value) => {
    if (value === "hero-1") return 0;
    if (value === "hero-2") return 1;
    return 2;
  };

  return rank(aBase) - rank(bBase) || a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}

function imageRecord(categorySlug, fileName) {
  const name = basename(fileName, extname(fileName));

  return {
    src: `./photos/${categorySlug}/${encodeURIComponent(fileName)}`,
    caption: titleFromSlug(name),
    alt: `${titleFromSlug(categorySlug)} photograph: ${titleFromSlug(name)}`
  };
}

const categories = existsSync(photosRoot)
  ? readdirSync(photosRoot, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))
      .map((entry) => entry.name)
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }))
      .map((slug) => {
        const categoryPath = join(photosRoot, slug);
        const files = readdirSync(categoryPath, { withFileTypes: true })
          .filter((entry) => entry.isFile() && isImage(entry.name))
          .map((entry) => entry.name)
          .sort(sortImages);

        const hero1 = files.find((file) => basename(file, extname(file)).toLowerCase() === "hero-1");
        const hero2 = files.find((file) => basename(file, extname(file)).toLowerCase() === "hero-2");
        const galleryFiles = files.filter((file) => {
          const base = basename(file, extname(file)).toLowerCase();
          return base !== "hero-1" && base !== "hero-2";
        });

        return {
          slug,
          title: titleFromSlug(slug),
          description: `${titleFromSlug(slug)} portfolio selections from the current image folder.`,
          hero1: hero1 ? imageRecord(slug, hero1).src : null,
          hero2: hero2 ? imageRecord(slug, hero2).src : null,
          images: galleryFiles.map((file) => imageRecord(slug, file))
        };
      })
      .filter((category) => category.hero1 || category.hero2 || category.images.length > 0)
  : [];

writeFileSync(
  manifestPath,
  `${JSON.stringify({ generatedAt: new Date().toISOString(), categories }, null, 2)}\n`
);
