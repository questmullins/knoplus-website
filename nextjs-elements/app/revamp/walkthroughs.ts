export type AppChapter = {
  name: string;
  image: string;
  title: string;
  text: string;
  note?: string;
};

export type AppStory = {
  name: string;
  slug: string;
  title: string;
  intro: string;
  context: string;
  chapters: AppChapter[];
};

export const updateStory: AppStory = {
  name: "UpDate",
  slug: "update",
  title: "A little backup. A little more confidence.",
  intro:
    "Going on a date means stepping into something unfamiliar. Having a plan, someone who knows where you are, and a way to ask for support can make that feel more manageable. UpDate brings those things together so there’s a little more room to enjoy the evening.",
  context:
    "The example plan uses fictional details. No safety messages or calls were sent. The Emergency screen uses the app’s visual preview.",
  chapters: [
    {
      name: "A place to begin",
      image: "home",
      title: "Three ways to reach for support.",
      text: "The home screen puts Plan a Date, Get Me Out, and Emergency together. The setup reminder shows what this fresh install still needs before its safety tools are ready.",
    },
    {
      name: "The introduction",
      image: "first-run-setup",
      title: "An introduction before the first plan.",
      text: "The welcome screen introduces the app around planning, checking in, and reaching trusted people. These are real app screens, rather than a simulated phone interface.",
    },
    {
      name: "Who you’re meeting",
      image: "plan-a-date-who",
      title: "Start with who.",
      text: "Date planning opens with the person you’re meeting. Here, a fictional Alex gives the example plan someone to start with.",
    },
    {
      name: "Where you’re going",
      image: "plan-a-date-where",
      title: "Give the plan a place.",
      text: "The location screen brings together a venue, city and state, an optional address, and a place-search option. Sample Cafe is a fictional place entered just for this walkthrough.",
    },
    {
      name: "When you’ll be there",
      image: "plan-a-date-when",
      title: "Make room for the evening.",
      text: "Choose a day, a start time, and an expected duration. The loop tries different lengths for the evening in the current date-and-time form.",
    },
    {
      name: "Getting there",
      image: "plan-a-date-how",
      title: "A small detail with useful context.",
      text: "The plan asks whether you’re arriving alone or with your date, keeping that context alongside the rest of the evening.",
    },
    {
      name: "Staying in touch",
      image: "plan-a-date-check-ins",
      title: "Choose the kind of check-in that suits you.",
      text: "The current flow offers a plan without check-ins, Stay With Me, and Key Moments. This walkthrough shows the choices; it does not test timed delivery.",
    },
    {
      name: "Before sharing",
      image: "plan-a-date-review",
      title: "A moment to review the message.",
      text: "The confirmation screen brings recipients and the editable message together. Scroll through the fictional plan for Alex at Sample Cafe. This example has no trusted contacts, and no message was shared.",
    },
    {
      name: "An easier exit",
      image: "get-me-out",
      title: "Sometimes you just want a way out.",
      text: "Get Me Out offers Call Me, Come Get Me, and Urgent Excuse. This example has no contacts assigned to these requests, so sending remains unavailable.",
    },
    {
      name: "When it’s urgent",
      image: "emergency-active",
      title: "A clear view of an urgent moment.",
      text: "The built-in design preview shows the pulsing emergency symbol and status panels together. The short clip captures the animation in the running app.",
      note: "Visual preview only. The status text is fixture data; no emergency session, recording, alert, or call was started.",
    },
  ],
};

export const rosewaveStory: AppStory = {
  name: "RoseWave",
  slug: "rosewave",
  title: "A photograph becomes part of your day.",
  intro:
    "A photograph can become part of somewhere you spend time every day. RoseWave gives photography that place on your phone—a way to keep an image you connect with close, and let it become part of the everyday.",
  context:
    "The main photograph is marked free in the app. Gallery and release-grid images are reduced previews.",
  chapters: [
    {
      name: "Meet a photograph",
      image: "main",
      title: "Let the photograph take the screen.",
      text: "The Blush of Autumn opens in the full-screen viewer. This photograph is marked free; the controls leave most of the space to the image itself.",
    },
    {
      name: "Find a release",
      image: "gallery",
      title: "A collection with room to wander.",
      text: "The gallery groups photographs into named sets, with Faves and Archived close by. This capture shows the actual release covers in the running test app.",
      note: "Shown as a reduced-resolution preview.",
    },
    {
      name: "Look a little closer",
      image: "set-tiles",
      title: "Different views of the same feeling.",
      text: "Opening a release reveals its photograph grid. The first image in this set is the free photograph used throughout this walkthrough.",
      note: "The release grid is a small preview; members’ photographs are not published here at full quality.",
    },
    {
      name: "Make it yours",
      image: "set",
      title: "Home, lock, or both.",
      text: "The wallpaper control opens a choice of where the image should appear. The walkthrough uses the free photograph and Android’s wallpaper settings.",
    },
    {
      name: "The Android preview",
      image: "wallpaper-preview",
      title: "See it on the phone before setting it.",
      text: "Android supplies its wallpaper preview and final confirmation. This screen was captured from that real system handoff.",
    },
    {
      name: "Out in the everyday",
      image: "wallpaper-home",
      title: "From an app to the background of your day.",
      text: "The free photograph is now the wallpaper. Open the app drawer and see it settle into the background of the Android home screen.",
    },
    {
      name: "A little more control",
      image: "rotation",
      title: "A place for the wallpaper to change with you.",
      text: "The Rotation screen separates Home, Lock, and Both. Turning on Home reveals a choice of collections and when the photograph should change.",
      note: "Recorded using the test build’s simulated member mode. No purchase was made; scheduled rotation and billing were not tested.",
    },
    {
      name: "Around the app",
      image: "menu",
      title: "The rest of the experience, within reach.",
      text: "The current menu brings together the gallery, print options, Experience, Membership, and Settings, with RoseWave’s landscape artwork beneath them.",
    },
  ],
};
