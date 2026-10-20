import { appPanes } from "./app-panes";
import { rosewaveStory, updateStory } from "./walkthroughs";

export type ProjectPhoto = { src: string; alt: string; width: number; height: number };
export type ProjectPane = {
  name: string;
  title: string;
  text: string;
  note?: string;
  photos: ProjectPhoto[];
};
export type ProjectPresentation = {
  name: string;
  slug: string;
  panes: ProjectPane[];
  action: { kind: "store" } | { kind: "link"; href: string; label: string; shortLabel: string };
};

const screen = (slug: string, image: string, alt: string): ProjectPhoto => ({
  src: `/revamp/projects/${slug}/${image}.webp`, alt, width: 1440, height: 900,
});

export const projectCatalog: ProjectPresentation[] = [
  ...[updateStory, rosewaveStory].map(story => ({
    name: story.name,
    slug: story.slug,
    action: { kind: "store" as const },
    panes: appPanes(story).map(pane => ({
      ...pane,
      photos: pane.photos.map(photo => ({
        src: `/revamp/apps/${story.slug}/${photo.image}.webp`,
        alt: photo.alt, width: 720, height: 1600,
      })),
    })),
  })),
  {
    name: "Insta-Post Maker", slug: "instapost",
    action: { kind: "link", href: "/instapost/index.html", label: "Open Insta-Post Maker", shortLabel: "Open tool" },
    panes: [
      {
        name: "More making", title: "More making. Less arranging.",
        text: "You have the photographs and something you want to share. Insta-Post Maker exists so arranging them into a post feels quick and enjoyable.",
        photos: [screen("instapost", "finished", "A finished sample post in Insta-Post Maker")],
      },
      {
        name: "Make room for the photos", title: "Your photographs, brought together.",
        text: "A before-and-after comparison or a little collection of your work. Choose the photographs, arrange them, and give them room to speak.",
        photos: [screen("instapost", "layout", "Arranging sample photographs in Insta-Post Maker")],
      },
      {
        name: "Make it feel like you", title: "A few choices. A finished post.",
        text: "Add your words and choose a look that suits them. When it feels right, the finished image is ready to save and share.",
        note: "Example made with public template photographs and fictional sample copy.",
        photos: [screen("instapost", "style", "Style choices alongside a sample post")],
      },
    ],
  },
  {
    name: "Website building", slug: "websites",
    action: { kind: "link", href: "/", label: "Explore the website collection", shortLabel: "View websites" },
    panes: [
      {
        name: "A website that feels yours", title: "Simple, well made, and ready when you need it.",
        text: "I enjoy making websites, and I want you to feel excited about yours. Templates, AI, and a little curation help me create something with character, with reasonable expectations and a reasonable turnaround.",
        photos: [screen("websites", "coffee", "The Homey Coffee website template")],
      },
      {
        name: "Room for your character", title: "A different feel for a different business.",
        text: "A local workshop and a neighbourhood coffeehouse have different things to say. The colours, photographs, and details should feel at home with the business they belong to.",
        note: "Existing website template example.",
        photos: [screen("websites", "synergy", "The Synergy automotive website template")],
      },
      {
        name: "Something to be proud of", title: "A good place to show what you do.",
        text: "The goal is a simple website that feels considered and personal, made with care and a practical turnaround. You can explore the collection and find a starting point that feels right.",
        note: "Existing photography website template example.",
        photos: [screen("websites", "photography", "The photography portfolio website template")],
      },
    ],
  },
  {
    name: "Freestyle", slug: "freestyle",
    action: { kind: "link", href: "/webtools/freestyle/index.html", label: "Open Freestyle", shortLabel: "Open tool" },
    panes: [
      {
        name: "A way around the paywall", title: "Make the diagram you need.",
        text: "I needed a swimlane diagram for work and kept finding services that wanted payment. Freestyle grew from finding a way around that. It was useful enough that I thought other people should have it too.",
        photos: [screen("freestyle", "both", "Freestyle showing a sample board and its swimlane diagram together")],
      },
      {
        name: "Work your way", title: "Room to think out loud.",
        text: "Sketch the process on a loose board, work in the swimlane, or see both together. Choose the view that helps you think and change things as the process takes shape.",
        photos: [screen("freestyle", "board", "Freestyle’s editable process board")],
      },
      {
        name: "Keep what you made", title: "Finish without reaching for a credit card.",
        text: "The moment that matters is looking at the diagram and seeing exactly what you needed. Then exporting it, freely, without having to ask for the boss’s credit card.",
        note: "The example process is a fictional coffee-shop order.",
        photos: [screen("freestyle", "swimlane", "A sample swimlane diagram with Freestyle’s print and export controls")],
      },
    ],
  },
  {
    name: "Prepress Assistant", slug: "prepress-assistant",
    action: { kind: "link", href: "mailto:info@kno.plus?subject=Prepress%20Assistant", label: "Talk about your workflow", shortLabel: "Let’s talk" },
    panes: [{
      name: "Production, with a little help", title: "Give the repetitive work away.",
      text: "Exploring practical tools for the production tasks that interrupt a designer’s concentration, including barcode and annotation work.",
      note: "Illustrative concept. Project screenshots will be added when available.",
      photos: [{ src: "/revamp/projects/prepress-concept.svg", alt: "Illustrative Prepress Assistant concept for barcode and annotation work", width: 900, height: 700 }],
    }],
  },
];

export function getProject(slug: string) {
  const project = projectCatalog.find(item => item.slug === slug);
  if (!project) throw new Error(`Unknown project: ${slug}`);
  return project;
}
