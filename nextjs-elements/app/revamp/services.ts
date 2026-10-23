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
  screenshot?: { src: string; width: number; height: number; alt: string };
  highlights?: string[];
  note?: string;
  template?: boolean;
};

const architecture = "url('https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=1800&q=80')";
const rose = "url('/revamp/rosewave-gallery/photos/blush-of-autumn-01.webp')";
const websiteItems: ServiceItem[] = templates.map(template => ({
  id: `website-${template.theme}`, name: template.navTitle, label: `Web Services / Websites / ${template.navTitle}`,
  description: template.description, image: template.image, theme: template.theme,
  href: template.link, action: "Explore website", highlights: template.features, template: true,
}));

export const serviceOverview: ServiceItem = {
  id: "work", name: "All services", label: "Design, development & consulting",
  title: "Websites.<br />Apps.<br /><em>Useful things.</em>",
  description: "A website that feels yours. An app you enjoy using. A tool that makes work easier. Explore what I make, and find a starting point for what you have in mind.",
  image: architecture, highlights: ["Web Services", "App Services", "Consulting"],
};

export const services: ServiceItem[] = [
  {
    id: "web-services", name: "Web Services", label: "Web Services",
    title: "On the web.<br />Made for you.<br /><em>Ready to use.</em>",
    description: "Simple websites, made well and made quickly. Useful web apps that give you room to make something of your own.",
    image: architecture, highlights: ["Websites", "Web Apps"],
    children: [
      {
        id: "websites", name: "Websites", label: "Web Services / Websites",
        title: "Modern websites.<br />Some character.<br /><em>Made yours.</em>",
        description: "I enjoy making websites, and I want you to feel excited about yours. Start with a template, then shape the photographs, words, and details into something that feels like your business.",
        image: architecture, highlights: ["Templates", "Customisation", "Practical turnaround"], children: websiteItems,
        related: { href: "/revamp/websites", label: "About website building" },
      },
      {
        id: "web-apps", name: "Web Apps", label: "Web Services / Web Apps",
        title: "An idea.<br />A useful tool.<br /><em>Right here.</em>",
        description: "For the thing you need to get done. Arrange a few photographs, map a process, or find a better way through the work in front of you.",
        image: architecture, highlights: ["Freestyle", "Insta-Post Maker"],
        children: [
          {
            id: "freestyle", name: "Freestyle", label: "Web Services / Web Apps / Freestyle",
            description: "I needed a swimlane diagram for work and kept finding services that wanted payment. Freestyle grew from finding a way around that. Finish your diagram and export it without reaching for a credit card.",
            image: architecture, href: "/webtools/freestyle/index.html", action: "Open Freestyle",
            related: { href: "/revamp/freestyle", label: "About the project" },
            screenshot: { src: "/revamp/projects/freestyle/both.webp", width: 1440, height: 900, alt: "Freestyle showing a board and swimlane diagram" },
            highlights: ["Board view", "Swimlanes", "Free image export"],
          },
          {
            id: "instapost", name: "Insta-Post Maker", label: "Web Services / Web Apps / Insta-Post Maker",
            description: "You have the photographs and something you want to share. Insta-Post Maker exists so arranging them into a post feels quick and enjoyable.",
            image: architecture, href: "/instapost/index.html", action: "Open Insta-Post Maker",
            related: { href: "/revamp/instapost", label: "About the project" },
            screenshot: { src: "/revamp/projects/instapost/finished.webp", width: 1440, height: 900, alt: "A finished photo layout in Insta-Post Maker" },
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
    image: rose, highlights: ["RoseWave", "UpDate", "Textualize"],
    children: [
      {
        id: "rosewave", name: "RoseWave", label: "App Services / RoseWave",
        description: "Find a photograph you connect with. Make it your wallpaper. Enjoy it every time you pick up your phone.",
        image: rose, href: "/revamp/rosewave", action: "Explore RoseWave",
        related: { href: "/revamp/rosewave/gallery", label: "Gallery & print shop" },
        screenshot: { src: "/revamp/apps/rosewave/main.webp", width: 720, height: 1600, alt: "RoseWave showing The Blush of Autumn wallpaper" },
        highlights: ["Original photography", "Wallpaper collections", "Make it yours"],
      },
      {
        id: "update", name: "UpDate", label: "App Services / UpDate",
        description: "UpDate exists so you can step into a date with a plan and some backup, leaving more room to actually enjoy it.",
        image: architecture, href: "/revamp/update", action: "Explore UpDate",
        screenshot: { src: "/revamp/apps/update/home.webp", width: 720, height: 1600, alt: "UpDate's date planning and check-in home screen" },
        highlights: ["Date plans", "Check-ins", "A little backup"],
      },
      {
        id: "textualize", name: "Textualize", label: "App Services / Textualize",
        description: "The things you do on your phone, in your own words. Textualize turns app actions into styled text shortcuts and home-screen boards, with room to make them feel like you.",
        image: architecture, href: "/revamp/textualize", action: "About Textualize",
        highlights: ["Text shortcuts", "Home-screen boards", "Typography & styling"], note: "Android app in development.",
      },
    ],
  },
  {
    id: "consulting", name: "Consulting", label: "Consulting",
    title: "Know the work.<br />Find the friction.<br /><em>Make it easier.</em>",
    description: "Practical improvements start with the work itself. This is a place for the tools, spreadsheets, and ideas I have made for Cellese and in Excel.",
    image: architecture, highlights: ["Cellese", "Excel"],
    related: { href: "/revamp/prepress-assistant", label: "Prepress Assistant concept" },
    children: [
      {
        id: "cellese", name: "Cellese", label: "Consulting / Cellese",
        title: "Useful changes.<br /><em>In the everyday work.</em>",
        description: "A place for selected tools and improvements I have made for Cellese. The individual examples and their stories will be added here as we choose what to share.",
        image: architecture, note: "Project examples are being prepared.",
      },
      {
        id: "excel", name: "Excel", label: "Consulting / Excel",
        title: "Less repetition.<br /><em>More room for the work.</em>",
        description: "Spreadsheets and tools made around the way people work. This collection will bring together the Excel projects, with a look at what each one makes easier.",
        image: architecture, note: "Project examples are being prepared.",
      },
    ],
  },
];

export const serviceEntries: { item: ServiceItem; ancestors: string[] }[] = [];
function index(items: ServiceItem[], ancestors: string[] = []) {
  for (const item of items) {
    serviceEntries.push({ item, ancestors });
    if (item.children) index(item.children, [...ancestors, item.id]);
  }
}
index(services);
export function findService(id: string) {
  return id === "work" ? serviceOverview : serviceEntries.find(entry => entry.item.id === id)?.item;
}
