export type StoryChapter = {
  eyebrow: string;
  heading: string;
  body: string;
  screen: string;
};

export type AppStory = {
  slug: string;
  name: string;
  theme: "rosewave" | "update";
  kicker: string;
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
    slug: "rosewave",
    name: "Rosewave",
    theme: "rosewave",
    kicker: "Phone app preview",
    title: "A gallery that lives<br /><em>on your phone.</em>",
    intro:
      "Rosewave turns one photographer's infrared work into wallpapers, released in small named sets like albums. Scroll through a day with the app.",
    chapters: [
      {
        eyebrow: "01 · Open the app",
        heading: "One photo, the whole screen.",
        body: "There is no grid of thumbnails to wade through. Each photo fills the screen edge to edge, and a swipe brings the next one. One button sets it as your home screen, your lock screen or both.",
        screen: "rose-full"
      },
      {
        eyebrow: "02 · Releases",
        heading: "Photos arrive like albums.",
        body: "Every few weeks a new release lands with its own name and mood, nine to twelve photos at a time. The gallery keeps them as banners, alongside your faves and anything you have archived.",
        screen: "rose-gallery"
      },
      {
        eyebrow: "03 · Free and members",
        heading: "Something free in every release.",
        body: "Each release has one free photo anyone can keep at full quality. Everything else can be looked at, and becoming a member unlocks the lot.",
        screen: "rose-release"
      },
      {
        eyebrow: "04 · Set it",
        heading: "A wallpaper the app draws itself.",
        body: "Rosewave runs as a live wallpaper, centred on each photo's focal point so the subject never hides behind your clock or icons.",
        screen: "rose-home"
      },
      {
        eyebrow: "05 · Rotation",
        heading: "Fresh every time you look.",
        body: "Change the photo each time you unlock, on a timer, or with the sun at dawn, noon and dusk. Draw from your faves, a favourite release or everything.",
        screen: "rose-rotation"
      },
      {
        eyebrow: "06 · Prints",
        heading: "Take it off the screen.",
        body: "Any photo can be ordered as a framed, metal or canvas print, made and shipped on demand.",
        screen: "rose-print"
      }
    ],
    closing: {
      heading: "Where it is now",
      body: "Rosewave is running as an Android test app with the live wallpaper, rotation and gallery working. Membership, prints and the cloud photo library are next."
    }
  },
  {
    slug: "update",
    name: "UpDate",
    theme: "update",
    kicker: "Phone app preview",
    title: "Go on the date.<br /><em>We've got the rest.</em>",
    intro:
      "UpDate makes the sensible safety steps around dating quick enough that people actually take them, and keeps everything private on their own phone. Scroll through one evening with it.",
    chapters: [
      {
        eyebrow: "01 · Before",
        heading: "Everything starts from one calm screen.",
        body: "Plan a Date, Get Me Out and Emergency sit front and centre, each with its own colour, label and purpose. Your trusted people are right underneath.",
        screen: "up-home"
      },
      {
        eyebrow: "02 · Plan",
        heading: "A plan in under a minute.",
        body: "A short guided plan asks who, where, when and how you are getting home. Native date and time pickers and saved drafts keep it quick, even if you get interrupted.",
        screen: "up-plan"
      },
      {
        eyebrow: "03 · Share",
        heading: "Your people know where you'll be.",
        body: "UpDate writes the message for you. You see exactly what will be sent, edit anything, and send it to the friends you chose for date plans.",
        screen: "up-message"
      },
      {
        eyebrow: "04 · During",
        heading: "A graceful way out.",
        body: "If the date isn't going well, Get Me Out sends a ready-made request: call me with an excuse, come and get me, or check on me soon. A one-time location can go with it.",
        screen: "up-getout"
      },
      {
        eyebrow: "05 · If it's serious",
        heading: "One tap. No second guessing.",
        body: "Emergency alerts your emergency contacts immediately, shares a fresh location and starts a private recording. Ending it takes a deliberate hold, so it can't be cancelled by accident.",
        screen: "up-emergency"
      },
      {
        eyebrow: "06 · Always there",
        heading: "Help without opening the app.",
        body: "A home screen widget and a quiet notification keep Get Me Out and Emergency one tap away at all times.",
        screen: "up-widget"
      },
      {
        eyebrow: "07 · Private",
        heading: "Your private life stays yours.",
        body: "No account, no ads, no tracking and no developer servers. Everything is encrypted on the phone, an optional app lock keeps it private, and backups only ever go to your own cloud drive.",
        screen: "up-private"
      }
    ],
    closing: {
      heading: "Where it is now",
      body: "UpDate is a working Android app in testing, preparing for its Play Store release. Every safety feature is free, now and always."
    }
  }
];

export function getAppStory(slug: string) {
  return appStories.find((story) => story.slug === slug);
}
