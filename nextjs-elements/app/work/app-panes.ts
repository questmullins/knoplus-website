import type { AppStory } from "./walkthroughs";

export type AppPane = {
  name: string;
  title: string;
  text: string;
  note?: string;
  photos: { image: string; alt: string }[];
};

export function appPanes(story: AppStory): AppPane[] {
  const opening: AppPane = {
    name: `Meet ${story.name}`,
    title: story.title,
    text: story.slug === "update"
      ? "Going on a date means stepping into something unfamiliar. A plan, someone who knows where you are, and a way to ask for support can leave a little more room to enjoy the evening."
      : story.intro,
    photos: [{
      image: story.slug === "rosewave" ? "main" : "home",
      alt: `${story.name} home screen`,
    }],
  };

  if (story.slug === "rosewave") return [opening, {
    name: "Find your photograph",
    title: "A collection to explore.",
    text: "Browse a release, look through its photographs, and keep your favourites close.",
    note: "Gallery and release images are reduced previews. The full-screen photograph is free in the app.",
    photos: [
      { image: "gallery", alt: "RoseWave’s photography releases" },
      { image: "set-tiles", alt: "Photographs within The Blush of Autumn release" },
    ],
  }, {
    name: "Make it yours",
    title: "Part of your everyday.",
    text: "Choose a photograph for your home screen, lock screen, or both. Enjoy it every time you pick up your phone.",
    photos: [{ image: "wallpaper-home", alt: "The free Blush of Autumn photograph on an Android home screen" }],
  }];

  return [opening, ...story.chapters.map(chapter => ({
    name: chapter.name,
    title: chapter.title,
    text: chapter.text,
    note: chapter.note,
    photos: [
      { image: chapter.image, alt: `${story.name}: ${chapter.name}` },
      ...(chapter.secondImage ? [{ image: chapter.secondImage, alt: "Review the plan before sharing" }] : []),
    ],
  }))];
}
