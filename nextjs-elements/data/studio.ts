import { projects, websiteService, type ProjectScreen } from "./projects";

export type StudioEntry = {
  slug: string;
  navTitle: string;
  label: string;
  accent: string;
  // Thin display line plus an italic script line, matching the /websites headlines.
  title: string;
  script: string;
  summary: string;
  problem: string;
  built: string;
  status: string;
  screens: ProjectScreen[];
  links: { label: string; href: string }[];
};

const copy: Record<string, Pick<StudioEntry, "title" | "script" | "summary" | "problem" | "built">> = {
  update: {
    title: "Safety, without the awkwardness.",
    script: "For first dates.",
    summary: "An Android companion that makes the sensible steps around dating quick enough that people actually take them.",
    problem: "Telling a friend where you'll be, checking in and having a way out all get skipped because they feel awkward.",
    built: "Date plans shared with chosen people, a discreet Get Me Out and a one-tap emergency alert, all kept on the phone."
  },
  rosewave: {
    title: "Photography you live with.",
    script: "Released like albums.",
    summary: "A wallpaper app for one photographer's infrared work, released in small named sets.",
    problem: "Good photography ends up as a static wallpaper nobody looks at twice.",
    built: "A full-screen viewer, a live wallpaper that keeps the subject clear of the clock, and rotation on unlock, a timer or the sun."
  },
  freestyle: {
    title: "Whiteboard in. Wall chart out.",
    script: "No account needed.",
    summary: "A browser tool that turns a freehand process sketch into a clean, printable swimlane diagram.",
    problem: "Process maps live on whiteboards and sticky notes, and redrawing them neatly takes an afternoon.",
    built: "Draw cards and arrows freely, then get lanes, phases and an ideal path laid out and ready to print."
  },
  "prepress-assistant": {
    title: "Job data in. Vectors out.",
    script: "Straight to the artboard.",
    summary: "Custom Adobe Illustrator panels that read a company's job data and draw production-ready artwork.",
    problem: "Prepress artists retype numbers from one system into artwork by hand, and one typo reaches the press.",
    built: "Panels that load a job, then draw barcodes and annotations as exact vectors in a couple of clicks."
  },
  instapost: {
    title: "A finished post in six steps.",
    script: "From a few photos.",
    summary: "A phone-friendly tool that turns a handful of photos into a polished, on-brand Instagram post.",
    problem: "Small businesses have good photos but no time to lay them out the same way every week.",
    built: "Pick a post type, add photos and text, choose a style and save. The layout stays on brand every time."
  },
  websites: {
    title: "Websites for real businesses.",
    script: "Built to launch.",
    summary: "Polished templates and custom builds for independent businesses, with launch support included.",
    problem: "Small businesses need a site that looks considered and loads fast, without a months-long project.",
    built: "A library of templates, custom design when it's needed, SEO-ready structure and Cloudflare hosting."
  }
};

export const studioEntries: StudioEntry[] = [
  ...projects.map((project) => ({
    slug: project.slug,
    navTitle: project.navTitle,
    label: `${project.kind} · ${project.status}`,
    accent: project.accent,
    ...copy[project.slug],
    status: project.statusNote.heading,
    screens: project.heroScreens,
    links: [{ label: "Read the case", href: project.href }, ...(project.cta ? [project.cta] : [])]
  })),
  {
    slug: "websites",
    navTitle: "Websites",
    label: `${websiteService.kind} · ${websiteService.status}`,
    accent: "#f6f3ec",
    ...copy.websites,
    status: "Taking new clients.",
    screens: [websiteService.screen],
    links: [{ label: "See the templates", href: "/websites" }]
  }
];
