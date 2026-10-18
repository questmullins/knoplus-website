export type StoryChapter = {
  eyebrow: string;
  heading: string;
  body: string;
  screen: string;
  alt: string;
};

export type AppStory = {
  slug: string;
  name: string;
  accent: string;
  accentInk: string;
  title: string;
  intro: string;
  chapters: StoryChapter[];
  closing: {
    heading: string;
    body: string;
  };
};

export const appStories: AppStory[] = [
  {
    slug: "update",
    name: "UpDate",
    accent: "#f0717f",
    accentInk: "#2a1320",
    title: "One evening with UpDate.",
    intro:
      "UpDate makes the sensible safety steps around dating quick enough that people actually take them. Follow one date from plan to ride home.",
    chapters: [
      {
        eyebrow: "01 · Getting started",
        heading: "Safety first, on your terms.",
        body: "Setup takes a minute: choose the people you trust, decide what each of them receives, and add an optional app lock. Nothing leaves the phone unless you send it.",
        screen: "/apps/update/screens/first-run-setup.webp",
        alt: "UpDate welcome screen"
      },
      {
        eyebrow: "02 · Home",
        heading: "Three buttons, three jobs.",
        body: "Plan a Date, Get Me Out and Emergency sit front and centre, each with its own colour, icon and label so there is never a wrong tap.",
        screen: "/apps/update/screens/home.webp",
        alt: "UpDate home screen"
      },
      {
        eyebrow: "03 · Plan",
        heading: "Who you're meeting.",
        body: "Pick someone you've met before or add someone new. UpDate remembers past dates, so repeat plans are quicker.",
        screen: "/apps/update/screens/plan-a-date-who.webp",
        alt: "Choosing who you are meeting"
      },
      {
        eyebrow: "04 · Plan",
        heading: "Where, when and check-ins.",
        body: "Venue, address, start and end times, and how often UpDate should check in, all with the phone's own date and time pickers.",
        screen: "/apps/update/screens/plan-a-date-when.webp",
        alt: "Date timing and check-in schedule"
      },
      {
        eyebrow: "05 · Share",
        heading: "Your people know where you'll be.",
        body: "Review the plan, see exactly who it goes to, and save it. Only the contacts you chose for date plans receive it.",
        screen: "/apps/update/screens/plan-a-date-review.webp",
        alt: "Reviewing the date plan"
      },
      {
        eyebrow: "06 · During",
        heading: "A discreet way out.",
        body: "If the date isn't going well, Get Me Out asks your chosen friends for help, with your location when it's available.",
        screen: "/apps/update/screens/get-me-out.webp",
        alt: "Get Me Out screen"
      },
      {
        eyebrow: "07 · If it's serious",
        heading: "One tap. No second guessing.",
        body: "Emergency alerts your contacts, captures your location and records privately. Ending it takes a deliberate hold.",
        screen: "/apps/update/screens/emergency-active.webp",
        alt: "Emergency mode active"
      },
      {
        eyebrow: "08 · Always there",
        heading: "Help without opening the app.",
        body: "Home screen widgets and lock screen shortcuts keep Get Me Out and Emergency one tap away.",
        screen: "/apps/update/screens/home-widgets.webp",
        alt: "UpDate home screen widgets"
      },
      {
        eyebrow: "09 · Afterwards",
        heading: "Your private life stays yours.",
        body: "Dates, notes and recordings stay encrypted on the phone, behind your PIN or fingerprint. Get Me Out and Emergency stay available even when it's locked.",
        screen: "/apps/update/screens/private-screen-unlock.webp",
        alt: "UpDate private screens locked"
      }
    ],
    closing: {
      heading: "Where it is now",
      body: "UpDate is a working Android app in testing, getting ready for its Play Store release. Every safety feature is free, now and always."
    }
  },
  {
    slug: "rosewave",
    name: "Rosewave",
    accent: "#e5508f",
    accentInk: "#2b0a17",
    title: "A gallery that lives on your phone.",
    intro:
      "Rosewave turns one photographer's infrared work into wallpapers, released in small named sets like albums. Scroll through a day with the app.",
    chapters: [
      {
        eyebrow: "01 · Open the app",
        heading: "One photo, the whole screen.",
        body: "No grid of thumbnails to wade through. Each photo fills the screen edge to edge, and a swipe brings the next one.",
        screen: "/apps/rosewave/screens/main.webp",
        alt: "Rosewave photo viewer"
      },
      {
        eyebrow: "02 · Set it",
        heading: "Home, lock or both.",
        body: "One button sets the photo as your wallpaper, on the home screen, the lock screen or both.",
        screen: "/apps/rosewave/screens/set.webp",
        alt: "Choosing where to set the wallpaper"
      },
      {
        eyebrow: "03 · Look at it",
        heading: "A wallpaper the app draws itself.",
        body: "Rosewave runs as a live wallpaper, centred on each photo's focal point so the subject never hides behind your clock.",
        screen: "/apps/rosewave/screens/bare.webp",
        alt: "A Rosewave photo as the lock screen"
      },
      {
        eyebrow: "04 · Releases",
        heading: "Photos arrive like albums.",
        body: "Every release has its own name and mood. The gallery keeps them as banners, alongside your faves and archive.",
        screen: "/apps/rosewave/screens/gallery.webp",
        alt: "Rosewave gallery of releases"
      },
      {
        eyebrow: "05 · Free and members",
        heading: "Something free in every release.",
        body: "Each release marks one free photo anyone can keep. Members unlock the rest.",
        screen: "/apps/rosewave/screens/set-tiles.webp",
        alt: "A release with its free photo marked"
      },
      {
        eyebrow: "06 · Look, then join",
        heading: "Every photo, open to browse.",
        body: "Free users can scroll every photo full screen. The locked ones offer an unlock button instead of setting the wallpaper.",
        screen: "/apps/rosewave/screens/next.webp",
        alt: "A members photo with an unlock button"
      },
      {
        eyebrow: "07 · Rotation",
        heading: "Fresh every time you look.",
        body: "Rotate the home screen, the lock screen or both, on unlock, on a timer or with the sun.",
        screen: "/apps/rosewave/screens/rotation.webp",
        alt: "Rotation settings"
      },
      {
        eyebrow: "08 · Everything else",
        heading: "One quiet menu.",
        body: "Gallery, prints, experience settings and membership all live behind one menu, so the photo stays the star.",
        screen: "/apps/rosewave/screens/menu.webp",
        alt: "The Rosewave menu"
      }
    ],
    closing: {
      heading: "Where it is now",
      body: "Rosewave runs as an Android test app with the viewer, gallery, live wallpaper and rotation working. Membership, prints and the cloud photo library are next."
    }
  }
];

export function getAppStory(slug: string) {
  return appStories.find((story) => story.slug === slug);
}
