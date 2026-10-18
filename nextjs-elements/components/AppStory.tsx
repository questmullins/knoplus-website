"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { BrandLogo } from "./BrandLogo";
import { SiteMenu } from "./SiteMenu";
import { storyScreens } from "./AppStoryScreens";
import type { AppStory as AppStoryData } from "@/data/appStories";

type AppStoryProps = {
  story: AppStoryData;
};

function Phone({ screen }: { screen: string }) {
  const Screen = storyScreens[screen];

  return (
    <div className="story-phone">
      <div className="story-phone-screen">
        <Screen />
      </div>
    </div>
  );
}

export function AppStory({ story }: AppStoryProps) {
  const [active, setActive] = useState(0);
  const chapterRefs = useRef<Array<HTMLElement | null>>([]);
  const scrollerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    // The chapter crossing the middle of the view decides which screen the sticky phone shows.
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActive(Number((entry.target as HTMLElement).dataset.index));
          }
        });
      },
      { root: window.innerWidth > 720 ? scrollerRef.current : null, rootMargin: "-45% 0px -45% 0px" }
    );

    chapterRefs.current.forEach((node) => node && observer.observe(node));
    return () => observer.disconnect();
  }, []);

  return (
    <main className={`project-page story-page project-theme-${story.theme}`} ref={scrollerRef}>
      <header className="project-topbar story-topbar">
        <BrandLogo />
        <nav aria-label="Story navigation">
          <Link className="project-back" href={`/projects/${story.slug}`}>
            About {story.name}
          </Link>
          <SiteMenu className="project-menu" hideIcon showLabel />
        </nav>
      </header>

      <section className="story-hero">
        <div className="eyebrow">
          {story.name} · {story.kicker}
        </div>
        <h1 dangerouslySetInnerHTML={{ __html: story.title }} />
        <p>{story.intro}</p>
        <span className="story-scroll-cue">Scroll</span>
      </section>

      <div className="story-body">
        <div className="story-chapters">
          {story.chapters.map((chapter, index) => (
            <article
              className={`story-chapter ${index === active ? "is-active" : ""}`}
              data-index={index}
              key={chapter.screen}
              ref={(node) => {
                chapterRefs.current[index] = node;
              }}
            >
              <span className="story-eyebrow">{chapter.eyebrow}</span>
              <h2>{chapter.heading}</h2>
              <p>{chapter.body}</p>
              <div className="story-inline-phone">
                <Phone screen={chapter.screen} />
              </div>
            </article>
          ))}
        </div>

        <div className="story-stage" aria-hidden="true">
          <div className="story-sticky">
            {story.chapters.map((chapter, index) => (
              <div className={`story-stage-screen ${index === active ? "is-active" : ""}`} key={chapter.screen}>
                <Phone screen={chapter.screen} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <section className="story-closing">
        <h2>{story.closing.heading}</h2>
        <p>{story.closing.body}</p>
        <p className="story-disclaimer">Screens shown here are illustrations of the app, with example names and places.</p>
        <Link className="cta-button project-primary" href={`/projects/${story.slug}`}>
          Read about {story.name}
        </Link>
      </section>
    </main>
  );
}
