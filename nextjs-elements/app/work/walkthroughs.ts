export type AppChapter = {
  name: string;
  image: string;
  title: string;
  text: string;
  note?: string;
  secondImage?: string;
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
      name: "Before you go",
      image: "plan-a-date-who",
      secondImage: "plan-a-date-review",
      title: "Someone knows the plan.",
      text: "An unfamiliar evening can feel a little easier when someone you trust knows where you’re going. UpDate gives the details a place to come together, with a message you can look over before sharing.",
    },
    {
      name: "While you’re there",
      image: "plan-a-date-check-ins",
      title: "A little backup in the background.",
      text: "You want to be present with the person in front of you. Choosing how you’d like to check in is part of making room for that, with support that fits the evening you have in mind.",
    },
    {
      name: "When you want to leave",
      image: "get-me-out",
      title: "It’s okay to want a way home.",
      text: "Sometimes the evening just isn’t right. Get Me Out puts a request for a call, a pickup, or an excuse within reach of the people you’ve chosen to trust.",
    },
    {
      name: "When you need help",
      image: "emergency-active",
      title: "Support should be easy to reach.",
      text: "The urgent side of UpDate brings its status and support controls together on one screen. It belongs to the same idea as the rest of the app: having a little backup when a moment feels unfamiliar.",
      note: "Emergency design preview. No emergency session, alert, recording, or call was started.",
    },
  ],
};

export const rosewaveStory: AppStory = {
  name: "RoseWave",
  slug: "rosewave",
  title: "A photograph becomes part of your day.",
  intro:
    "Find a photograph you connect with. Make it your wallpaper. Enjoy it every time you pick up your phone.",
  context:
    "The main photograph is marked free in the app. Gallery and release-grid images are reduced previews.",
  chapters: [],
};
