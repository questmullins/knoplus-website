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
};

const architecture = "url('https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=1800&q=80')";
const rose = "url('/revamp/rosewave-gallery/photos/blush-of-autumn-01.webp')";
const websiteItems: ServiceItem[] = [...templates.map(template => ({
  id: `website-${template.theme}`, name: template.navTitle, label: `Web Services / Websites / ${template.navTitle}`,
  description: template.description, image: template.image, theme: template.theme,
  href: template.link, action: "Explore website", highlights: template.features, sellingPoints: template.sellingPoints, template: true,
}))];

export const serviceOverview: ServiceItem = {
  id: "work", name: "All services", label: "Websites, apps & useful things",
  title: "Websites.<br />Apps.<br /><em>Useful things.</em>",
  description: "A website that feels yours. An app you enjoy using. A tool that makes work easier. Explore what I make, and find a starting point for what you have in mind.",
  image: architecture, highlights: ["Web Services", "App Services"],
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
        related: { href: "/revamp/websites", label: "About website building" },
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
            related: { href: "/revamp/freestyle", label: "About the project" },

            highlights: ["Board view", "Swimlanes", "Free image export"],
          },
          {
            id: "instapost", name: "Insta-Post Maker", label: "Web Services / Web Apps / Insta-Post Maker",
            description: "You have the photographs and something you want to share. Insta-Post Maker exists so arranging them into a post feels quick and enjoyable.",
            image: "url('/revamp/banners/instapost.webp')", href: "/instapost/index.html", action: "Open Insta-Post Maker",
            related: { href: "/revamp/instapost", label: "About the project" },

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
        image: rose, href: "/revamp/rosewave", action: "Explore RoseWave",
        related: { href: "/revamp/rosewave/gallery", label: "Gallery & print shop" },

        highlights: ["Original photography", "Wallpaper collections", "Make it yours"],
      },
      {
        id: "update", platform: "android", name: "UpDate", label: "App Services / UpDate",
        description: "UpDate exists so you can step into a date with a plan and some backup, leaving more room to actually enjoy it.",
        image: "url('/revamp/banners/update.webp')", href: "/revamp/update", action: "Explore UpDate",

        highlights: ["Date plans", "Check-ins", "A little backup"],
      },
      {
        id: "textualize", platform: "android", name: "Textualize", label: "App Services / Textualize",
        description: "The things you do on your phone, in your own words. Textualize turns app actions into styled text shortcuts and home-screen boards, with room to make them feel like you.",
        image: "url('/revamp/banners/textualize.webp')", href: "/revamp/textualize", action: "About Textualize",
        highlights: ["Text shortcuts", "Home-screen boards", "Typography & styling"], note: "Android app in development.",
      },
    ],
  },

];

// Shared by the folder buttons, project actions, and mobile section dividers.
export function serviceAccent(item: ServiceItem): string {
  const colors: Record<string, string> = {
    work: "#85cfc0", "web-services": "#85cfc0", websites: "#d9b06f", "web-apps": "#9cbff0",
    "app-services": "#c5aceb", rosewave: "#edb3a4", update: "#b6a1ee", textualize: "#a6c9ed",
    freestyle: "#8dd7be", instapost: "#edbc8c", consulting: "#c9cf9a",
    "traditional-auto": "#f4776e", synergy: "#f0ede4", "editorial-local": "#d8c4a3",
    "photo-portfolio": "#d5ad63", "cleaning-restoration": "#86d5c3", "homey-coffee": "#d9b06f",
  };
  return colors[item.theme || item.id.split("--")[0]] || "#85cfc0";
}
