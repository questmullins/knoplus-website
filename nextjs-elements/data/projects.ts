export type ProjectScreen = {
  src: string;
  label: string;
  alt: string;
  frame: "phone" | "browser";
};

export type ProjectFeature = {
  heading: string;
  body: string;
};

export type ProjectSpotlight = {
  eyebrow: string;
  heading: string;
  body: string[];
  screen?: ProjectScreen;
};

export type ProjectItem = {
  slug: string;
  navTitle: string;
  kind: string;
  status: string;
  platform: string;
  // Each project's own colour, used for its eyebrows, buttons and the soft wash behind the page
  accent: string;
  accentInk: string;
  title: string;
  description: string;
  // Where the hub card goes. Most projects have a page at /projects/[slug]; the website service has its own section.
  href: string;
  cta?: { label: string; href: string };
  heroScreens: ProjectScreen[];
  highlights: string[];
  featuresHeading: string;
  features: ProjectFeature[];
  spotlights: ProjectSpotlight[];
  gallery?: { eyebrow: string; heading: string; body: string; screens: ProjectScreen[] };
  glance: Array<{ label: string; value: string }>;
  statusNote: { heading: string; body: string };
  faq: Array<{ q: string; a: string }>;
};

const up = (name: string, label: string, alt: string): ProjectScreen => ({
  src: `/apps/update/screens/${name}.webp`,
  label,
  alt,
  frame: "phone"
});

const rose = (name: string, label: string, alt: string): ProjectScreen => ({
  src: `/apps/rosewave/screens/${name}.webp`,
  label,
  alt,
  frame: "phone"
});

export const projects: ProjectItem[] = [
  {
    slug: "update",
    navTitle: "UpDate",
    kind: "Android app",
    status: "In testing",
    platform: "Android",
    accent: "#f0717f",
    accentInk: "#2a1320",
    title: "A calm safety companion for first dates.",
    description:
      "Plan a date, keep trusted people in the loop, and reach for help in one tap, with everything kept private on your own phone.",
    href: "/projects/update",
    cta: { label: "See the App Story", href: "/apps/update" },
    heroScreens: [
      up("home", "Home", "UpDate home screen with Plan a Date, Get Me Out and Emergency buttons"),
      up("emergency-active", "Emergency", "UpDate Emergency Mode active screen")
    ],
    highlights: ["Date plans", "Get Me Out", "One-tap emergency"],
    featuresHeading: "Safety that fits in a pocket.",
    features: [
      {
        heading: "Date plans",
        body: "A five-step plan covers who, where, when and check-ins, then goes to the trusted people you choose."
      },
      {
        heading: "Get Me Out",
        body: "A discreet request for a friend to call or come and get you, with your location if it's available."
      },
      {
        heading: "Emergency mode",
        body: "One tap alerts your emergency contacts, captures your location and starts a private recording."
      },
      {
        heading: "Always within reach",
        body: "Home screen widgets and lock screen shortcuts keep Get Me Out and Emergency one tap away."
      },
      {
        heading: "Private by design",
        body: "No accounts, ads, analytics or developer servers. Everything is encrypted on the phone."
      },
      {
        heading: "Safety is never paywalled",
        body: "Every safety feature is free. An optional upgrade, coming later, adds a private date journal."
      }
    ],
    spotlights: [
      {
        eyebrow: "Built around the plan",
        heading: "Your people know where you'll be.",
        body: [
          "Plan a Date walks through who you're meeting, the venue, the time and how often to check in. It takes under a minute, and drafts are saved if you get interrupted.",
          "Before anything is sent you see the whole plan, and only the contacts you picked for date plans receive it."
        ],
        screen: up("plan-a-date-review", "Review", "UpDate review date plan screen")
      },
      {
        eyebrow: "When it matters",
        heading: "One tap. No second guessing.",
        body: [
          "Emergency starts immediately: contacts are alerted, location is captured and a private recording begins.",
          "Ending it takes a deliberate hold, so it can't be cancelled by accident or by someone else."
        ],
        screen: up("emergency-active", "Emergency", "UpDate emergency mode with status and hold-to-end")
      }
    ],
    gallery: {
      eyebrow: "Inside the app",
      heading: "From the first plan to the ride home.",
      body: "Screens from the current build, shown with example names and places.",
      screens: [
        up("first-run-setup", "Welcome", "UpDate welcome screen"),
        up("plan-a-date-who", "Who", "Choosing who you are meeting"),
        up("plan-a-date-when", "Check-ins", "Timing and check-in schedule"),
        up("get-me-out", "Get Me Out", "Get Me Out options"),
        up("home-widgets", "Widgets", "UpDate home screen widgets"),
        up("date-timeline", "Timeline", "A saved date with notes"),
        up("trusted-contacts", "Contacts", "Trusted contacts list"),
        up("private-screen-unlock", "App lock", "Private screens locked")
      ]
    },
    glance: [
      { label: "Platform", value: "Android" },
      { label: "Status", value: "In testing" },
      { label: "Account", value: "None needed" },
      { label: "Data", value: "Encrypted on device" },
      { label: "Backups", value: "Your own Google Drive" },
      { label: "Safety features", value: "Always free" }
    ],
    statusNote: {
      heading: "Getting ready for the Play Store.",
      body: "UpDate works end to end on Android today, including real emergency texts. It is going through device safety testing before its store release."
    },
    faq: [
      {
        q: "Does UpDate send my data anywhere?",
        a: "No. There is no UpDate account or server. Messages go from your phone to the people you choose, and backups only go to your own drive if you turn them on."
      },
      {
        q: "What happens when I press Emergency?",
        a: "Your emergency contacts are texted straight away, a fresh location follows when the phone has one, and a private recording starts."
      },
      {
        q: "Will it be on iPhone?",
        a: "Android comes first. iPhone depends on how the first release is received."
      }
    ]
  },
  {
    slug: "rosewave",
    navTitle: "Rosewave",
    kind: "Android app",
    status: "In testing",
    platform: "Android",
    accent: "#e5508f",
    accentInk: "#2b0a17",
    title: "Photography made for your lock screen.",
    description:
      "Full-screen infrared photography released in named sets, with a free photo in every release and a live wallpaper that keeps it fresh.",
    href: "/projects/rosewave",
    cta: { label: "See the App Story", href: "/apps/rosewave" },
    heroScreens: [
      rose("main", "Viewer", "Rosewave showing a pink infrared forest photo"),
      rose("gallery", "Gallery", "Rosewave gallery of named releases")
    ],
    highlights: ["Photo releases", "Live wallpaper", "Rotation"],
    featuresHeading: "A gallery that lives on your phone.",
    features: [
      {
        heading: "Named releases",
        body: "Photos arrive in small sets with their own names and moods, like albums."
      },
      {
        heading: "One free photo each",
        body: "Every release includes a free photo anyone can keep at full quality."
      },
      {
        heading: "Live wallpaper",
        body: "The app draws the background itself, centred on each photo's focal point."
      },
      {
        heading: "Rotation",
        body: "Change the photo on unlock, on a timer or with the sun, from your faves or any set."
      },
      {
        heading: "Blur and pairing",
        body: "Soften the wallpaper behind icons, or pair a different lock screen."
      },
      {
        heading: "Prints",
        body: "Order any photo as a framed, metal or canvas print, made on demand."
      }
    ],
    spotlights: [
      {
        eyebrow: "One photo, the whole screen",
        heading: "Nothing between you and the picture.",
        body: [
          "Each photo fills the screen edge to edge. A swipe brings the next one, and a tap hides the controls so you can see it as a background.",
          "Set it as your home screen, lock screen or both in one tap."
        ],
        screen: rose("set", "Set it", "Choosing home, lock or both")
      },
      {
        eyebrow: "Free and members",
        heading: "Something free in every release.",
        body: [
          "Anyone can scroll every photo full screen. One photo per release is free to keep, marked in the gallery.",
          "Members unlock the rest, along with rotation and blur."
        ],
        screen: rose("set-tiles", "A release", "Release tiles with the free photo marked")
      }
    ],
    gallery: {
      eyebrow: "Inside the app",
      heading: "Quiet controls, loud photos.",
      body: "Screens from the Android test build. Only free photos are shown at full quality here.",
      screens: [
        rose("main", "Viewer", "Rosewave photo viewer"),
        rose("gallery", "Releases", "Gallery of releases"),
        rose("menu", "Menu", "Rosewave menu"),
        rose("rotation", "Rotation", "Rotation settings"),
        rose("bare", "Lock screen", "Photo as a lock screen"),
        rose("next", "Members", "A members photo with the unlock button")
      ]
    },
    glance: [
      { label: "Platform", value: "Android" },
      { label: "Status", value: "In testing" },
      { label: "Wallpaper", value: "Live, drawn by the app" },
      { label: "Releases", value: "9 to 12 photos each" },
      { label: "Free photos", value: "One per release" },
      { label: "Screenshots", value: "Blocked in the app" }
    ],
    statusNote: {
      heading: "Running as a test app.",
      body: "The viewer, gallery, live wallpaper and rotation all work on Android today. Membership, prints and the cloud photo library are next."
    },
    faq: [
      {
        q: "Whose photos are these?",
        a: "One photographer's own work, mostly infrared, which is where the pink comes from."
      },
      {
        q: "Can I keep a free photo?",
        a: "Yes. A free photo already set as your wallpaper stays, even after it rotates off the free list."
      },
      {
        q: "How are the photos protected?",
        a: "They stay in the app's private storage at screen size, screenshots are off inside the app, and the originals never leave the cloud."
      }
    ]
  },
  {
    slug: "freestyle",
    navTitle: "Freestyle",
    kind: "Web tool",
    status: "Live",
    platform: "Browser",
    accent: "#ffbf46",
    accentInk: "#2d2a32",
    title: "Sketch a process. Get a swimlane.",
    description:
      "Draw cards and arrows on a free board and get a clean, print-ready swimlane diagram with lanes, phases and an ideal path.",
    href: "/projects/freestyle",
    cta: { label: "Open Freestyle", href: "/webtools/freestyle/" },
    heroScreens: [
      {
        src: "/projects/freestyle/freestyle-dark.png",
        label: "Board and swimlane",
        alt: "Freestyle with a board on the left and its swimlane diagram on the right",
        frame: "browser"
      }
    ],
    highlights: ["Free board", "Print-ready output", "No account"],
    featuresHeading: "From whiteboard to wall chart.",
    features: [
      {
        heading: "Draw freely",
        body: "Double-click to add a card, drag a dot to connect two cards, and pick who owns each step."
      },
      {
        heading: "Lanes that follow",
        body: "Owners become lanes, time runs left to right, and the diagram lays itself out as you draw."
      },
      {
        heading: "Readable arrows",
        body: "Yes, No and Loop arrows get their own colours, steps are numbered, and the ideal path glows."
      },
      {
        heading: "Print it",
        body: "One page per phase, the whole process on one wide page, a PDF, or PNG images."
      },
      {
        heading: "Private",
        body: "Everything runs in your browser. Nothing you draw is uploaded."
      },
      {
        heading: "Light and dark",
        body: "Follows your system, with a high-contrast mode for printing and projectors."
      }
    ],
    spotlights: [
      {
        eyebrow: "Two views, one map",
        heading: "Sketch on the left. Read on the right.",
        body: [
          "The board is for thinking: drop cards anywhere and connect them. The swimlane beside it is for everyone else, tidy and in order.",
          "Change either and the other follows."
        ],
        screen: {
          src: "/projects/freestyle/freestyle-light.png",
          label: "Light mode",
          alt: "Freestyle in light mode",
          frame: "browser"
        }
      }
    ],
    glance: [
      { label: "Runs in", value: "Any modern browser" },
      { label: "Install", value: "Nothing" },
      { label: "Account", value: "None" },
      { label: "Saves as", value: "A small map file" },
      { label: "Exports", value: "Print, PDF, PNG" },
      { label: "Imports", value: "Arcweave projects" }
    ],
    statusNote: {
      heading: "Live and free to use.",
      body: "Open it, draw a process, and print it. Your map is remembered in your browser, and Save file keeps a copy you can open anywhere."
    },
    faq: [
      {
        q: "Where is my map stored?",
        a: "In your browser and in any file you save. Nothing is sent to a server."
      },
      {
        q: "Can I share a map?",
        a: "Save the map file and send it. Anyone can open it in Freestyle."
      },
      {
        q: "Does it work on a phone?",
        a: "It opens on a phone, but drawing is far easier with a mouse or trackpad."
      }
    ]
  },
  {
    slug: "prepress-assistant",
    navTitle: "Prepress Assistant",
    kind: "Illustrator plugins",
    status: "In use",
    platform: "Adobe Illustrator",
    accent: "#ffbf46",
    accentInk: "#2d2a32",
    title: "Your data in. Print-ready vectors out.",
    description:
      "Custom Adobe Illustrator panels that read a company's job data and draw precise, production-ready artwork straight onto the artboard.",
    href: "/projects/prepress-assistant",
    heroScreens: [],
    highlights: ["Barcodes", "Annotations", "Team sign-in"],
    featuresHeading: "Less retyping. Fewer reprints.",
    features: [
      {
        heading: "Barcode builder",
        body: "Turns a product number into a standards-sized barcode drawn as clean vector bars, with the check digit verified."
      },
      {
        heading: "Annotation builder",
        body: "Looks up a job by a short code and draws a consistent set of annotation panels beside the artboard."
      },
      {
        heading: "Team sign-in",
        body: "Each person signs in once and every panel opens under their name, with their own data permissions."
      },
      {
        heading: "Read-only by design",
        body: "Panels read job data and never change it, so nothing in the system can be overwritten by accident."
      },
      {
        heading: "One installer",
        body: "The same panels install on Windows and Mac, with one shared look across every tool."
      },
      {
        heading: "Works offline",
        body: "If the network drops, panels keep working for a grace period after the last sign-in check."
      }
    ],
    spotlights: [
      {
        eyebrow: "How it works",
        heading: "Type a short code. Check. Create.",
        body: [
          "A designer enters the last few digits of a job, the panel fills in the values from the database, and one click draws the finished vectors into the open document on their own layer.",
          "The panel never asks anyone to retype a number, which is where most prepress mistakes start."
        ]
      }
    ],
    glance: [
      { label: "Runs in", value: "Adobe Illustrator 2021+" },
      { label: "Systems", value: "Windows and macOS" },
      { label: "Data", value: "Read-only" },
      { label: "Output", value: "Vector artwork on a new layer" },
      { label: "Barcodes", value: "UPC-A, standard sizes" },
      { label: "Availability", value: "Custom work" }
    ],
    statusNote: {
      heading: "In daily use by a packaging team.",
      body: "These panels were built for one team's workflow and aren't available to download. The same approach can be built around any team's data."
    },
    faq: [
      {
        q: "Can I download these panels?",
        a: "No. They're built for a specific team's data. Get in touch if you want something similar."
      },
      {
        q: "What data can a panel read?",
        a: "Anything the team's database exposes to a signed-in person, limited to that person's own permissions."
      },
      {
        q: "Does it replace the designer?",
        a: "No. It removes the copying and measuring so the designer can spend their time on the artwork."
      }
    ]
  },
  {
    slug: "instapost",
    navTitle: "Insta-Post Maker",
    kind: "Web tool",
    status: "Live",
    platform: "Browser",
    accent: "#b0703f",
    accentInk: "#2a2018",
    title: "Before and after posts in a couple of minutes.",
    description:
      "A phone-friendly tool that turns a few photos into a polished, on-brand Instagram post in six quick steps.",
    href: "/projects/instapost",
    cta: { label: "Open Insta-Post Maker", href: "/webtools/instapost/" },
    heroScreens: [
      {
        src: "/projects/instapost/choose.webp",
        label: "Post type",
        alt: "Insta-Post Maker asking what you are posting",
        frame: "phone"
      },
      {
        src: "/projects/instapost/photos.webp",
        label: "Photos",
        alt: "Placing before and after photos",
        frame: "phone"
      }
    ],
    highlights: ["Before & After", "Showcase", "Saved presets"],
    featuresHeading: "Made for the people doing the work.",
    features: [
      {
        heading: "Two post types",
        body: "Before & After puts two to four photos side by side. Showcase lays out one to four photos of finished work."
      },
      {
        heading: "Place and rotate",
        body: "Pick all the photos first, then drop each into a spot and rotate it until it sits right."
      },
      {
        heading: "Your colours",
        body: "Save your own swatches and full style presets so every post looks like the same brand."
      },
      {
        heading: "Ready to share",
        body: "Exports a full-size post you can save straight to your camera roll."
      },
      {
        heading: "No account",
        body: "Runs in the browser and keeps your photos on your phone."
      },
      {
        heading: "Six short steps",
        body: "Post type, photos, text, your handle, style and save, with a live preview at every step."
      }
    ],
    spotlights: [],
    glance: [
      { label: "Runs in", value: "Phone or desktop browser" },
      { label: "Account", value: "None" },
      { label: "Photos", value: "Stay on your device" },
      { label: "Output", value: "1080 × 1350 post" }
    ],
    statusNote: {
      heading: "Live and free to use.",
      body: "Open it on your phone, pick your photos, and save the finished post."
    },
    faq: [
      {
        q: "Are my photos uploaded?",
        a: "No. Everything happens on your device."
      },
      {
        q: "Do my presets save?",
        a: "Yes, in your browser on that device."
      }
    ]
  }
];

export const websiteService = {
  navTitle: "Website Building",
  kind: "Service",
  status: "Taking clients",
  accent: "#f6f3ec",
  description:
    "Polished templates and custom builds for independent businesses, with mobile-friendly layouts, SEO-ready structure and launch support.",
  href: "/websites",
  screen: {
    src: "/projects/websites/templates.webp",
    label: "Template viewer",
    alt: "The Knoplus website template viewer",
    frame: "browser" as const
  }
};

export function getProject(slug: string) {
  return projects.find((project) => project.slug === slug);
}

export const projectPages = projects;
