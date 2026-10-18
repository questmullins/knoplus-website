"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { HubShell } from "./hub/HubShell";
import type { AppStory as AppStoryData } from "@/data/appStories";

type AppStoryProps = {
  story: AppStoryData;
};

function Phone({ src, alt }: { src: string; alt: string }) {
  return (
    <figure className="hub-phone">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img alt={alt} loading="lazy" src={src} />
    </figure>
  );
}

export function AppStory({ story }: AppStoryProps) {
  const [active, setActive] = useState(0);
  const chapterRefs = useRef<Array<HTMLElement | null>>([]);

  useEffect(() => {
    // The chapter crossing the middle of the window decides which screen the sticky phone shows.
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActive(Number((entry.target as HTMLElement).dataset.index));
          }
        });
      },
      { rootMargin: "-45% 0px -45% 0px" }
    );

    chapterRefs.current.forEach((node) => node && observer.observe(node));
    return () => observer.disconnect();
  }, []);

  return (
    <HubShell
      accent={story.accent}
      accentInk={story.accentInk}
      cta={{ label: `About ${story.name}`, href: `/projects/${story.slug}` }}
      links={[
        { label: "Projects", href: "/#projects" },
        { label: "The story", href: "#story" }
      ]}
    >
      <main className="hub-main">
        <section className="hub-hero story-hero">
          <div className="hub-hero-copy">
            <span className="hub-eyebrow">{story.name} · App story</span>
            <h1>{story.title}</h1>
            <p>{story.intro}</p>
            <div className="hub-actions">
              <a className="hub-button" href="#story">
                Start the story
              </a>
            </div>
          </div>
          <div className="hub-hero-art count-1">
            <Phone alt={story.chapters[0].alt} src={story.chapters[0].screen} />
          </div>
        </section>

        <section className="story-body" id="story">
          <div className="story-chapters">
            {story.chapters.map((chapter, index) => (
              <article
                className={`hub-card story-chapter ${index === active ? "is-active" : ""}`}
                data-index={index}
                key={chapter.screen}
                ref={(node) => {
                  chapterRefs.current[index] = node;
                }}
              >
                <span className="hub-eyebrow">{chapter.eyebrow}</span>
                <h2>{chapter.heading}</h2>
                <p>{chapter.body}</p>
                <div className="story-inline-phone">
                  <Phone alt={chapter.alt} src={chapter.screen} />
                </div>
              </article>
            ))}
          </div>

          <div className="story-stage" aria-hidden="true">
            <div className="story-sticky">
              {story.chapters.map((chapter, index) => (
                <div className={`story-stage-screen ${index === active ? "is-active" : ""}`} key={chapter.screen}>
                  <Phone alt="" src={chapter.screen} />
                </div>
              ))}
              <div className="story-dots">
                {story.chapters.map((chapter, index) => (
                  <i className={index === active ? "on" : ""} key={chapter.screen} />
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="hub-section hub-cta">
          <h2>{story.closing.heading}</h2>
          <p>{story.closing.body}</p>
          <p className="story-note">Screens are from the current build, shown with example names and places.</p>
          <div className="hub-actions center">
            <Link className="hub-button" href={`/projects/${story.slug}`}>
              Read about {story.name}
            </Link>
            <Link className="hub-button ghost" href="/#projects">
              All projects
            </Link>
          </div>
        </section>
      </main>
    </HubShell>
  );
}
