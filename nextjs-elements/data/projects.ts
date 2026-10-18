export type ProjectLink = {
  label: string;
  href: string;
};

export type ProjectFeature = {
  heading: string;
  body: string;
};

export type ProjectItem = {
  slug: string;
  navTitle: string;
  kind: string;
  title: string;
  description: string;
  image: string;
  theme: "service" | "update" | "rosewave" | "freestyle" | "prepress" | "instapost";
  status: string;
  platform: string;
  highlights: string[];
  // Where the hub's Explore button goes. Most projects have a write-up page; the website service has its own section.
  href: string;
  pitch: string[];
  features: ProjectFeature[];
  goal: string;
  links: ProjectLink[];
  screenshots?: Array<{ src: string; alt: string }>;
};

export const projects: ProjectItem[] = [
  {
    slug: "websites",
    navTitle: "Website Building",
    kind: "Service",
    title: "Modern websites.<br />Clear pricing.<br /><em>Built to launch.</em>",
    description:
      "Polished templates and custom builds for independent businesses, with mobile-friendly layouts, SEO-ready structure and launch support.",
    image: "url('https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=1800&q=80')",
    theme: "service",
    status: "Taking clients",
    platform: "Web",
    highlights: ["Template websites", "Custom builds", "Launch support"],
    href: "/websites",
    pitch: [],
    features: [],
    goal: "",
    links: [{ label: "Explore Templates", href: "/websites" }]
  },
  {
    slug: "update",
    navTitle: "UpDate",
    kind: "Android app",
    title: "A calm safety<br />companion for<br /><em>first dates.</em>",
    description:
      "Plan a date, keep trusted people in the loop, and reach for help in one tap, with everything kept private on your own phone.",
    image:
      "radial-gradient(circle at 72% 28%, rgba(244, 220, 225, 0.32), transparent 34%), radial-gradient(circle at 30% 80%, rgba(155, 116, 75, 0.38), transparent 42%), linear-gradient(135deg, #2a171c, #934252 58%, #f3e4cf)",
    theme: "update",
    status: "In testing",
    platform: "Android",
    highlights: ["Date plans", "Get Me Out", "One-tap emergency"],
    href: "/projects/update",
    pitch: [
      "Going on a date with someone new should feel exciting, not risky. UpDate makes the sensible safety steps quick enough that people actually take them.",
      "Before a date, it builds a short plan (who, where, when and how you are getting home) and sends it to the people you trust. During the date, two buttons stay within reach: one asks a friend to call you out, the other raises the alarm."
    ],
    features: [
      {
        heading: "Date plans",
        body: "A guided plan with the time, place, transport and an optional photo of your match, previewed and sent to the trusted people you choose."
      },
      {
        heading: "Get Me Out",
        body: "Ready-made requests for a friend to call or come and get you, with an optional one-time location so they know where you are."
      },
      {
        heading: "Emergency mode",
        body: "One tap alerts your emergency contacts, shares a fresh location and starts a private recording you control."
      },
      {
        heading: "Always within reach",
        body: "A home screen widget and a quiet notification keep Get Me Out and Emergency one tap away, even when the app is closed."
      },
      {
        heading: "Private by design",
        body: "No accounts, ads, analytics or developer servers. Everything lives encrypted on the phone, and backups only ever go to your own cloud drive."
      },
      {
        heading: "Safety is never paywalled",
        body: "Every safety feature is free. An optional upgrade, coming later, adds a private date journal and timeline for fun."
      }
    ],
    goal: "Give people, especially women, a credible safety tool they trust enough to use every time, without handing their private life to anyone.",
    links: []
  },
  {
    slug: "rosewave",
    navTitle: "Rosewave",
    kind: "Android app",
    title: "Photography<br />made for<br /><em>your lock screen.</em>",
    description:
      "Full-screen infrared photography delivered in named releases, with one free photo in every release and a live wallpaper that keeps it fresh.",
    image: "url('/projects/rosewave/hero.jpg')",
    theme: "rosewave",
    status: "In testing",
    platform: "Android",
    highlights: ["Photo releases", "Live wallpaper", "Rotation"],
    href: "/projects/rosewave",
    pitch: [
      "Most wallpaper apps are an endless scroll of stock images. Rosewave is a curated gallery from one photographer, released in small named sets like albums.",
      "Each photo fills the whole screen with nothing printed over it. One button sets it as the wallpaper, and every release includes a free photo anyone can keep."
    ],
    features: [
      {
        heading: "Named releases",
        body: "Photos arrive in sets of nine to twelve, each with its own name and its own free photo."
      },
      {
        heading: "A real live wallpaper",
        body: "The app draws the background itself, centred on each photo's focal point so the subject is never hidden behind your icons."
      },
      {
        heading: "Rotation",
        body: "Change the photo on unlock, on a timer, or with the sun at dawn, noon and dusk, drawing from your favourites or any sets you pick."
      },
      {
        heading: "Blur and pairing",
        body: "Soften the wallpaper behind your icons, pair a different lock screen, and set an inner screen for folding phones."
      },
      {
        heading: "Prints",
        body: "Any photo can be ordered as a framed, metal or canvas print."
      },
      {
        heading: "Built to protect the art",
        body: "Photos stay inside the app's private storage at screen size, and screenshots are switched off inside the app."
      }
    ],
    goal: "Turn a photographer's portfolio into something people live with every day, and give the photographer a steady way to earn from it.",
    links: [{ label: "Try the Preview", href: "/apps/rosewave/" }]
  },
  {
    slug: "freestyle",
    navTitle: "Freestyle",
    kind: "Web tool",
    title: "Sketch a process.<br />Get a swimlane.<br /><em>Print it.</em>",
    description:
      "Draw cards and arrows on a free board and get a clean, print-ready swimlane diagram with lanes, phases and an ideal path.",
    image: "url('/projects/freestyle/freestyle-dark.png')",
    theme: "freestyle",
    status: "Live",
    platform: "Browser",
    highlights: ["Free board", "Print-ready output", "No account"],
    href: "/projects/freestyle",
    pitch: [
      "Process maps are usually either a whiteboard photo nobody can read or an afternoon fighting diagram software. Freestyle sits in between.",
      "You sketch freely on a board and the swimlane diagram lays itself out beside you, ready to print or drop into a document."
    ],
    features: [
      {
        heading: "Draw freely",
        body: "Double-click to add a card, drag a dot to connect two cards, and pick who owns each step."
      },
      {
        heading: "Swimlanes that follow",
        body: "Lanes for owners, time left to right, phases, coloured Yes, No and Loop arrows, numbered steps and a glowing ideal path."
      },
      {
        heading: "Get it out",
        body: "Print one page per phase or the whole process on one wide page, download a PDF, or copy PNG images."
      },
      {
        heading: "Private by default",
        body: "Everything runs in your browser and nothing you draw is uploaded. Save a map as a small file and open it again any time."
      }
    ],
    goal: "Make documenting how work really happens fast enough that teams actually do it.",
    links: [{ label: "Open Freestyle", href: "/webtools/freestyle/" }],
    screenshots: [
      { src: "/projects/freestyle/freestyle-dark.png", alt: "Freestyle in dark mode with a board and its swimlane" },
      { src: "/projects/freestyle/freestyle-light.png", alt: "Freestyle in light mode" }
    ]
  },
  {
    slug: "prepress-assistant",
    navTitle: "Prepress Assistant",
    kind: "Illustrator plugins",
    title: "Your data in.<br />Print-ready vectors<br /><em>out.</em>",
    description:
      "Custom Adobe Illustrator panels that read your company's data and draw precise, production-ready artwork straight onto the artboard.",
    image:
      "repeating-linear-gradient(90deg, rgba(241, 255, 250, 0.08) 0 3px, transparent 3px 7px, rgba(241, 255, 250, 0.05) 7px 9px, transparent 9px 16px), radial-gradient(circle at 74% 30%, rgba(255, 191, 70, 0.34), transparent 36%), linear-gradient(135deg, #1f1d23, #2d2a32 52%, #7c809b)",
    theme: "prepress",
    status: "In use",
    platform: "Adobe Illustrator",
    highlights: ["Barcodes", "Annotations", "Team sign-in"],
    href: "/projects/prepress-assistant",
    pitch: [
      "Prepress work is full of careful, repetitive steps: copying numbers out of a database, rebuilding the same callouts, checking barcode sizes by hand. Every manual step is a chance for a costly print mistake.",
      "Prepress Assistant puts that work inside Illustrator. A designer types a short code, checks the values in a compact panel, and clicks once to draw the finished vectors into the open document."
    ],
    features: [
      {
        heading: "Barcode builder",
        body: "Turns a product number into a standards-sized barcode drawn as clean vector bars, verifies the check digit, and supports magnification and bar width reduction for different presses."
      },
      {
        heading: "Annotation builder",
        body: "Looks up a job record by a short code, lets the designer adjust the values, and draws a consistent set of annotation panels on a new layer beside the artboard."
      },
      {
        heading: "Shared team sign-in",
        body: "Each person signs in once and every panel opens under their name, with their own data permissions and the key kept in the computer's secure keychain."
      },
      {
        heading: "Built to fit the team",
        body: "The panels share one look and one installer for Windows and Mac, read data without ever changing it, and keep working offline for a grace period."
      }
    ],
    goal: "Show what custom Illustrator automation can do for a print or packaging team: fewer hand-typed numbers, faster proofs and artwork that is right the first time. These panels are built for a specific team and are not available for download.",
    links: []
  },
  {
    slug: "instapost",
    navTitle: "Insta-Post Maker",
    kind: "Web tool",
    title: "Before and after.<br />Showcase.<br /><em>Post it.</em>",
    description:
      "A phone-friendly tool that turns a few photos into a polished, on-brand Instagram post in six quick steps.",
    image:
      "radial-gradient(circle at 70% 26%, rgba(243, 238, 228, 0.42), transparent 34%), linear-gradient(135deg, #1b1a18, #6d5b45 56%, #f3eee4)",
    theme: "instapost",
    status: "Live",
    platform: "Browser",
    highlights: ["Before & After", "Showcase", "Saved presets"],
    href: "/projects/instapost",
    pitch: [
      "Small service businesses do great work but rarely have time to design posts about it. Insta-Post Maker gets a clean before and after or showcase post out of a phone in a couple of minutes.",
      "It runs in the browser, needs no account, and keeps photos on the device."
    ],
    features: [
      {
        heading: "Two post types",
        body: "Before & After puts two to four photos side by side or in rows. Showcase lays out one to four photos of finished work."
      },
      {
        heading: "Place and rotate",
        body: "Pick all the photos first, then drop each into a spot and rotate it freely until it sits right."
      },
      {
        heading: "Your colours, saved",
        body: "Save your own colour swatches and full style presets so every post looks like it came from the same brand."
      },
      {
        heading: "Ready to share",
        body: "Exports a full-size post image you can save straight to your camera roll."
      }
    ],
    goal: "Help local businesses show off their work consistently without hiring a designer.",
    links: [{ label: "Open Insta-Post Maker", href: "/webtools/instapost/" }]
  }
];

export function getProject(slug: string) {
  return projects.find((project) => project.slug === slug);
}

export const projectPages = projects.filter((project) => project.href.startsWith("/projects/"));
