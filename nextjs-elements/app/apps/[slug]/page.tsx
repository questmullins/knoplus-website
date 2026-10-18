import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppStory } from "@/components/AppStory";
import { appStories, getAppStory } from "@/data/appStories";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return appStories.map((story) => ({ slug: story.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const story = getAppStory(slug);

  if (!story) {
    return {};
  }

  return {
    title: `${story.name} App Preview`,
    description: story.intro,
    alternates: {
      canonical: `/apps/${story.slug}`
    }
  };
}

export default async function AppStoryRoute({ params }: PageProps) {
  const { slug } = await params;
  const story = getAppStory(slug);

  if (!story) {
    notFound();
  }

  return <AppStory story={story} />;
}
