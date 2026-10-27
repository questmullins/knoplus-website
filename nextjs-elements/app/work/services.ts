import type { ProjectPhoto } from "./project-catalog";
import { templates } from "@/data/templates";

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
};

const architecture = "url('https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=1800&q=80')";
const rose = "url('/revamp/rosewave-gallery/photos/blush-of-autumn-01.webp')";
const websiteItems: ServiceItem[] = [...templates.map(template => ({
  id: `website-${template.theme}`, name: template.navTitle, label: `Web Services / Websites / ${template.navTitle}`,
  description: template.description, image: template.image, theme: template.theme,
  href: template.link, action: "Explore website", highlights: template.features, sellingPoints: template.sellingPoints, template: true,
}))];

// 2022–2025 business systems work, written up without the company's name, code or internal figures.
const story = (id: string, name: string, image: string, description: string, tools: string[], outcome: string): ServiceItem => ({
  id: `experience--${id}`, name, label: `Experience / ${name}`, description, image: `url('/revamp/banners/${image}.webp')`,
  highlights: tools, highlightsLabel: "Tools", sellingPoints: [outcome], sellingPointsLabel: "Outcome",
});

const experienceItems: ServiceItem[] = [
  story("shipping", "Shipping paperwork", "cellese",
    "Every international shipment needed its own declaration, invoice and carrier wording, put together by hand. I built a pipeline that reads pending shipments, checks the data, generates and stamps each document, files it, links it back to the shipment record and tells the team when it’s done.",
    ["Google Apps Script", "Google Sheets", "PDF.co", "Google Drive", "Gmail"], "From over an hour per shipment to a few seconds"),
  story("returns", "Returns", "process",
    "Returns came in across seven storefronts, and checking them meant searching each one by hand. I built a desktop app for the team that pulls a rolling year of returns from every store, filters by SKU, records what actually arrived, exports the results and drafts the customer email. It shipped with a proper installer, so anyone could set it up.",
    ["Python", "Shopify GraphQL", "Excel", "Outlook", "PyInstaller", "Inno Setup"], "Seven stores, one returns workflow"),
  story("commerce-data", "Commerce data", "excel",
    "Orders lived in Shopify, shipments in ShipStation and customers in HubSpot, and none of them lined up. I built the extractors and models that brought them together: seven stores in one order history, bundles broken into their parts, and system IDs replaced with real names. One run pulled in 2,321 draft orders in a single pass.",
    ["Shopify", "ShipStation", "HubSpot", "Python", "SQL", "Snowflake"], "One order history everyone could read"),
  story("production", "Production tracking", "consulting",
    "Production time was tracked in a spreadsheet anyone could break. I replaced it with an app where people pick their task from a list, required fields can’t be skipped, and breaks, lunch and downtime come off automatically. Project records became an interactive dashboard with timelines, turnaround and delivery accuracy.",
    ["Python", "PySide6", "pandas", "Plotly", "Asana API"], "Clean records, collected the same way every time"),
  story("documents", "Batch documents", "prepress",
    "Manufacturing paperwork was rebuilt by hand for every batch. I built a tool that turns production data into finished, printable batch documents, with quantities, specs and dates filled in and empty steps cleaned out. Approvals were routed on their own, filed as approved or rejected, with the team told in Teams.",
    ["Python", "Excel", "HTML to PDF", "Power Automate", "SharePoint", "Teams"], "Variable paperwork, made repeatable"),
  story("scheduler", "Automation control", "web-apps",
    "Once there were many scripts, someone had to remember to run them. I built a scheduler that runs each one on its own timetable, in priority order, shows the last and next run, and lets anyone start a job on demand. Exports write safely, so a failed run never leaves a broken file behind.",
    ["Python", "Tkinter", "APScheduler"], "Separate automations working as one system"),
  story("rebuild", "Knowing when to rebuild", "journey",
    "Bundle reporting started as a Google Sheet with hundreds of formulas. When that became hard to maintain, I moved the logic into Python. When running it on one computer became the bottleneck, I moved it into a cloud workflow that feeds the dashboards directly. Build for today’s problem, and notice when it needs to grow.",
    ["Google Sheets", "Python", "Pipedream", "Grow"], "Three versions, each one easier to run"),
  {
    ...story("toolkit", "Toolkit", "web-services",
      "The tools are how the work gets done, not what you’re buying. You need returns that are easier to handle, not GraphQL. These are the platforms and languages I’ve built real, everyday systems with.",
      ["Shopify", "ShipStation", "HubSpot", "Asana", "Power Apps", "Power Automate", "SharePoint", "Microsoft Graph", "Google Workspace", "Snowflake"], ""),
    highlightsLabel: "Platforms", sellingPoints: ["Python", "JavaScript", "SQL", "Google Apps Script", "HTML & CSS"], sellingPointsLabel: "Languages",
  },
];

export const serviceOverview: ServiceItem = {
  id: "work", name: "All services", label: "Websites, apps & useful things",
  title: "Websites.<br />Apps.<br /><em>Useful things.</em>",
  description: "A website that feels yours. An app you enjoy using. A tool that makes work easier. Explore what I make, and find a starting point for what you have in mind.",
  image: architecture, highlights: ["Web Services", "App Services", "Experience"],
};

export const services: ServiceItem[] = [
  {
    id: "web-services", name: "Web Services", label: "Web Services",
    title: "On the web.<br />Made for you.<br /><em>Ready to use.</em>",
    description: "Simple websites, made well and made quickly. Useful web apps that give you room to make something of your own.",
    image: "url('/revamp/banners/web-services.webp')", highlights: ["Websites", "Web Apps"],
    children: [
      {
        id: "websites", name: "Websites", label: "Web Services / Websites",
        title: "Modern websites.<br />Some character.<br /><em>Made yours.</em>",
        description: "I enjoy making websites, and I want you to feel excited about yours. Start with a template, then shape the photographs, words, and details into something that feels like your business.",
        image: "url('/revamp/banners/websites.webp')", highlights: ["Templates", "Customisation", "Practical turnaround"], children: websiteItems,
        related: { href: "/work/websites", label: "About website building" },
      },
      {
        id: "web-apps", name: "Web Apps", label: "Web Services / Web Apps",
        title: "An idea.<br />A useful tool.<br /><em>Right here.</em>",
        description: "For the thing you need to get done. Arrange a few photographs, map a process, or find a better way through the work in front of you.",
        image: "url('/revamp/banners/web-apps.webp')", highlights: ["Freestyle", "Insta-Post Maker"],
        children: [
          {
            id: "freestyle", name: "Freestyle", label: "Web Services / Web Apps / Freestyle",
            description: "I needed a swimlane diagram for work and kept finding services that wanted payment. Freestyle grew from finding a way around that. Finish your diagram and export it without reaching for a credit card.",
            image: "url('/revamp/banners/freestyle.webp')", href: "/webtools/freestyle/index.html", action: "Open Freestyle",
            related: { href: "/work/freestyle", label: "About the project" },

            highlights: ["Board view", "Swimlanes", "Free image export"],
          },
          {
            id: "instapost", name: "Insta-Post Maker", label: "Web Services / Web Apps / Insta-Post Maker",
            description: "You have the photographs and something you want to share. Insta-Post Maker exists so arranging them into a post feels quick and enjoyable.",
            image: "url('/revamp/banners/instapost.webp')", href: "/instapost/index.html", action: "Open Insta-Post Maker",
            related: { href: "/work/instapost", label: "About the project" },

            highlights: ["Your photographs", "Your words", "Ready to share"],
          },
        ],
      },
    ],
  },
  {
    id: "app-services", name: "App Services", label: "App Services",
    title: "A little easier.<br />A little yours.<br /><em>Every day.</em>",
    description: "Apps shaped around the places you spend your time. A little backup when you go out, a photograph on your phone, or a shortcut that feels your own.",
    image: "url('/revamp/rosewave-gallery/photos/nyc550-01.webp')", highlights: ["RoseWave", "UpDate", "Textualize"],
    children: [
      {
        id: "rosewave", platform: "android", name: "RoseWave", label: "App Services / RoseWave",
        description: "Find a photograph you connect with. Make it your wallpaper. Enjoy it every time you pick up your phone.",
        image: rose, href: "/work/rosewave", action: "Explore RoseWave",
        related: { href: "/store", label: "Gallery & print shop" },

        highlights: ["Original photography", "Wallpaper collections", "Make it yours"],
      },
      {
        id: "update", platform: "android", name: "UpDate", label: "App Services / UpDate",
        description: "UpDate exists so you can step into a date with a plan and some backup, leaving more room to actually enjoy it.",
        image: "url('/revamp/banners/update.webp')", href: "/work/update", action: "Explore UpDate",

        highlights: ["Date plans", "Check-ins", "A little backup"],
      },
      {
        id: "textualize", platform: "android", name: "Textualize", label: "App Services / Textualize",
        description: "The things you do on your phone, in your own words. Textualize turns app actions into styled text shortcuts and home-screen boards, with room to make them feel like you.",
        image: "url('/revamp/banners/textualize.webp')", href: "/work/textualize", action: "About Textualize",
        highlights: ["Text shortcuts", "Home-screen boards", "Typography & styling"], note: "Android app in development.",
      },
    ],
  },
  {
    id: "experience", name: "Experience", label: "Experience / 2022–2025",
    title: "Better processes.<br />Smarter systems.<br /><em>Less busywork.</em>",
    description: "For three years I worked inside a growing manufacturer and retailer, finding the slow, repetitive parts of the business and building the tools that took them over. More than forty systems and workflows, from shipping paperwork to returns, production records and reporting.",
    image: "url('/revamp/banners/consulting.webp')", highlights: ["Process improvement", "Custom software", "Workflow automation", "Systems integration", "Data & reporting"],
    highlightsLabel: "Capabilities", children: experienceItems,
  },
];

// Shared by the folder buttons, project actions, and mobile section dividers.
export function serviceAccent(item: ServiceItem): string {
  const colors: Record<string, string> = {
    work: "#85cfc0", "web-services": "#85cfc0", websites: "#d9b06f", "web-apps": "#9cbff0",
    "app-services": "#c5aceb", rosewave: "#edb3a4", update: "#b6a1ee", textualize: "#a6c9ed",
    freestyle: "#8dd7be", instapost: "#edbc8c", consulting: "#c9cf9a", experience: "#c9cf9a",
    "traditional-auto": "#f4776e", synergy: "#f0ede4", "editorial-local": "#d8c4a3",
    "photo-portfolio": "#d5ad63", "cleaning-restoration": "#86d5c3", "homey-coffee": "#d9b06f",
  };
  return colors[item.theme || item.id.split("--")[0]] || "#85cfc0";
}
