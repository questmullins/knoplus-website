import type { ProjectPhoto } from "./project-catalog";
import { templates } from "@/data/templates";
import type { ToolGroup } from "@/data/toolkit";
import { experienceItems, experienceStats } from "./experience";

export type ServiceItem = {
  id: string;
  name: string;
  label: string;
  title?: string;
  description: string;
  image: string;
  theme?: string;
  children?: ServiceItem[];
  href?: string;
  action?: string;
  related?: { href: string; label: string };
  platform?: "android";
  photos?: ProjectPhoto[];
  titleText?: string;
  highlights?: string[];
  note?: string;
  template?: boolean;
  sellingPoints?: string[];
  highlightsLabel?: string;
  sellingPointsLabel?: string;
  tools?: ToolGroup[];
  stats?: { value: string; label: string }[];
  metrics?: Metric[];
  /** The home panel's three doors, one per part of the site. */
  doors?: { id: string; label: string; primary?: boolean }[];
  /** Adds a "Want something like this?" button that leads to Work with me. */
  hire?: boolean;
};

// A before-and-after result. `headline` is the big percentage, when the result has one.
export type Metric = { label: string; change: string; before: string; after: string; headline?: string };

const architecture = "url('https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=1800&q=80')";
const rose = "url('/revamp/rosewave-gallery/photos/blush-of-autumn-01.webp')";
const websiteItems: ServiceItem[] = [...templates.map(template => ({
  id: `website-${template.theme}`, name: template.navTitle, label: `Work with me / Websites / ${template.navTitle}`,
  description: template.description, image: template.image, theme: template.theme,
  href: template.link, action: "Explore website", highlights: template.features, sellingPoints: template.sellingPoints, template: true,
}))];

export const serviceOverview: ServiceItem = {
  id: "work", name: "Kno.plus", label: "Quest / Knoplus",
  title: "I build the tools<br />a business <em>runs on.</em>",
  description: "I’m Quest. I make websites, apps, and the systems that take busywork off a team’s plate. See what I’ve done, try what I’ve made, or start something with me.",
  image: architecture,
  doors: [
    { id: "experience", label: "See what I’ve done" },
    { id: "projects", label: "See what I make" },
    { id: "work-with-me", label: "Work with me", primary: true },
  ],
};

export const services: ServiceItem[] = [
  {
    id: "experience", name: "Experience", label: "Experience / Business systems",
    title: "Better processes.<br />Smarter systems.<br /><em>Less busywork.</em>",
    description: "I worked inside a growing manufacturer and retailer, finding the slow, repetitive parts of the business and building the tools that took them over. More than forty systems and workflows, grouped by the kind of work: automation behind the scenes, interactive tools people use every day, and full applications.",
    image: "url('/revamp/banners/consulting.webp')", highlights: ["Process improvement", "Custom software", "Workflow automation", "Systems integration", "Data & reporting"],
    highlightsLabel: "Capabilities", stats: experienceStats.stats, note: experienceStats.note, children: experienceItems.map(item => ({ ...item, hire: true })),
    related: { href: "/#work-with-me", label: "Work with me" },
  },
  {
    id: "projects", name: "Projects", label: "Projects",
    title: "Made by me.<br />Used every day.<br /><em>Try them.</em>",
    description: "Apps and tools I designed and built myself. Download them, use them, and see what the same care could make for you.",
    image: "url('/revamp/banners/web-apps.webp')", highlights: ["Apps", "Tools"],
    children: [
      {
        id: "apps", name: "Apps", label: "Projects / Apps",
        description: "Phone apps for everyday life, designed and built from the first sketch to the store listing.",
        image: "url('/revamp/rosewave-gallery/photos/nyc550-01.webp')", highlights: ["UpDate", "Textualize"],
        children: [
          {
            id: "update", platform: "android", name: "UpDate", label: "Projects / Apps / UpDate", hire: true,
            description: "UpDate exists so you can step into a date with a plan and some backup, leaving more room to actually enjoy it.",
            image: "url('/revamp/banners/update.webp')", href: "/work/update", action: "Explore UpDate",
            highlights: ["Date plans", "Check-ins", "A little backup"],
          },
          {
            id: "textualize", platform: "android", name: "Textualize", label: "Projects / Apps / Textualize", hire: true,
            description: "The things you do on your phone, in your own words. Textualize turns app actions into styled text shortcuts and home-screen boards, with room to make them feel like you.",
            image: "url('/revamp/banners/textualize.webp')", href: "/work/textualize", action: "About Textualize",
            highlights: ["Text shortcuts", "Home-screen boards", "Typography & styling"], note: "Android app in development.",
          },
        ],
      },
      {
        id: "tools", name: "Tools", label: "Projects / Tools",
        description: "Tools that run in your browser. Each one started as a problem I ran into at work.",
        image: "url('/revamp/banners/web-apps.webp')", highlights: ["Freestyle", "Insta-Post Maker", "Prepress Assistant"],
        children: [
          {
            id: "freestyle", name: "Freestyle", label: "Projects / Tools / Freestyle", hire: true,
            description: "I needed a swimlane diagram for work and kept finding services that wanted payment. Freestyle grew from finding a way around that. Finish your diagram and export it without reaching for a credit card.",
            image: "url('/revamp/banners/freestyle.webp')", href: "/webtools/freestyle/", action: "Open Freestyle",
            related: { href: "/work/freestyle", label: "About the project" },
            highlights: ["Board view", "Swimlanes", "Free image export"],
          },
          {
            id: "instapost", name: "Insta-Post Maker", label: "Projects / Tools / Insta-Post Maker", hire: true,
            description: "You have the photographs and something you want to share. Insta-Post Maker exists so arranging them into a post feels quick and enjoyable.",
            image: "url('/revamp/banners/instapost.webp')", href: "/instapost/index.html", action: "Open Insta-Post Maker",
            related: { href: "/work/instapost", label: "About the project" },
            highlights: ["Your photographs", "Your words", "Ready to share"],
          },
          {
            id: "prepress-assistant", name: "Prepress Assistant", label: "Projects / Tools / Prepress Assistant", hire: true,
            description: "Practical tools for the production tasks that interrupt a designer’s concentration, including barcode and annotation work.",
            image: "url('/revamp/banners/prepress.webp')", href: "/work/prepress-assistant", action: "About the project",
            highlights: ["Barcodes", "Annotations", "Production checks"], note: "In progress.",
          },
        ],
      },
    ],
  },
  {
    id: "work-with-me", name: "Work with me", label: "Work with me",
    title: "Your idea.<br />Built properly.<br /><em>Ready to use.</em>",
    description: "A website for your business, a tool for your team, or a process that runs itself. Here’s what I make for clients, work I’ve finished, and how a project goes.",
    image: "url('/revamp/banners/web-services.webp')", highlights: ["Websites", "Custom tools & automation", "Client work", "How it works"],
    children: [
      {
        id: "websites", name: "Websites", label: "Work with me / Websites",
        title: "Modern websites.<br />Some character.<br /><em>Made yours.</em>",
        description: "I enjoy making websites, and I want you to feel excited about yours. Start with a template, then shape the photographs, words, and details into something that feels like your business.",
        image: "url('/revamp/banners/websites.webp')", highlights: ["Templates", "Customisation", "Practical turnaround"], children: websiteItems,
        related: { href: "/work/websites", label: "About website building" },
      },
      {
        id: "process-automation", name: "Custom tools & automation", label: "Work with me / Custom tools & automation",
        description: "The slow, repetitive parts of a business are usually where the time goes. I find them and build the tools that take them over: automations, dashboards, forms, and full applications.",
        image: "url('/revamp/banners/process.webp')", highlights: ["Process automation", "Custom software", "Dashboards & reporting", "Systems integration"],
        highlightsLabel: "What I build", related: { href: "/#experience", label: "See the results" },
      },
      {
        id: "client-work", name: "Client work", label: "Work with me / Client work",
        description: "Finished projects you can visit and use. See the work running for real, not just a screenshot.",
        image: rose, highlights: ["RoseWave"],
        children: [
          {
            id: "rosewave", platform: "android", name: "RoseWave", label: "Work with me / Client work / RoseWave",
            description: "A photography brand with its own website, print store, and Android app. Browse the gallery, order a print, and see the whole project working.",
            image: rose, href: "https://rosewave.art", action: "Visit rosewave.art",
            highlights: ["Website", "Print store", "Android app"],
          },
        ],
      },
      {
        id: "how-it-works", name: "How it works", label: "Work with me / How it works",
        description: "Tell me what you need, and I’ll come back with a plan and a timeline. You review the work on a private preview link as it takes shape, and nothing goes live until you’re happy. Once we’re working together, your client page shows progress and updates in one place.",
        image: "url('/revamp/banners/journey.webp')", highlights: ["Tell me what you need", "Get a plan", "Review a preview", "Go live"],
        highlightsLabel: "The steps", related: { href: "/clients/", label: "Client sign-in" },
      },
    ],
  },
];

// Shared by the folder buttons, project actions, and mobile section dividers.
export function serviceAccent(item: ServiceItem): string {
  const colors: Record<string, string> = {
    work: "#85cfc0", "work-with-me": "#85cfc0", projects: "#9cbff0", apps: "#c5aceb", tools: "#9cbff0", "client-work": "#edb3a4", "process-automation": "#c9cf9a", "how-it-works": "#85cfc0", "prepress-assistant": "#d8c4a3", "web-services": "#85cfc0", websites: "#d9b06f", "web-apps": "#9cbff0",
    "app-services": "#c5aceb", rosewave: "#edb3a4", update: "#b6a1ee", textualize: "#a6c9ed",
    freestyle: "#8dd7be", instapost: "#edbc8c", consulting: "#c9cf9a", experience: "#c9cf9a",
    "traditional-auto": "#f4776e", synergy: "#f0ede4", "editorial-local": "#d8c4a3",
    "photo-portfolio": "#d5ad63", "cleaning-restoration": "#86d5c3", "homey-coffee": "#d9b06f",
  };
  return colors[item.theme || item.id.split("--")[0]] || "#85cfc0";
}
