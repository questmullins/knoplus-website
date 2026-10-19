"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { AppStory } from "./walkthroughs";
import base from "./revamp.module.css";
import styles from "./walkthrough.module.css";

export function AppWalkthrough({ story }: { story: AppStory }) {
  const [current, setCurrent] = useState(0);
  const [originalStyle, setOriginalStyle] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const scrollRoot = useRef<HTMLDivElement>(null);
  const scenes = useRef<Array<HTMLElement | null>>([]);

  useEffect(() => {
    const root = scrollRoot.current;
    if (!root) return;
    let frame = 0;
    const measure = () => {
      const readingLine =
        root.getBoundingClientRect().top + root.clientHeight * 0.45;
      let active = 0;
      scenes.current.forEach((scene, index) => {
        if (scene && scene.getBoundingClientRect().top <= readingLine)
          active = index;
      });
      setCurrent(active);
    };
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    root.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    const resizeObserver = new ResizeObserver(onScroll);
    scenes.current.forEach((scene) => {
      if (scene) resizeObserver.observe(scene);
    });
    onScroll();
    return () => {
      root.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      resizeObserver.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [story.slug]);

  return (
    <div
      ref={scrollRoot}
      className={`${base.page} ${originalStyle ? base.original : ""}`}
    >
      <div className={base.conceptBar}>
        <span>INSIDE {story.name.toUpperCase()}</span>
        <button
          className={base.styleToggle}
          type="button"
          role="switch"
          aria-checked={originalStyle}
          onClick={() => setOriginalStyle((value) => !value)}
        >
          Original style
          <span className={base.switchTrack} aria-hidden="true">
            <span />
          </span>
        </button>
      </div>
      <header className={base.header}>
        <Link
          href="/revamp"
          className={base.logo}
          aria-label="Kno.plus consulting concept"
        >
          kno<span>+</span>
        </Link>
        <nav aria-label="Walkthrough navigation">
          <Link href="/revamp#work">Back to the work ↖</Link>
          <Link
            href={
              story.slug === "update" ? "/revamp/rosewave" : "/revamp/update"
            }
          >
            {story.slug === "update" ? "RoseWave" : "UpDate"} ↗
          </Link>
        </nav>
      </header>
      <main className={styles.main}>
        <div className={styles.intro}>
          <p className={base.eyebrow}>
            A LOOK INSIDE · {story.name.toUpperCase()}
          </p>
          <h1>{story.title}</h1>
          <p>{story.intro}</p>
        </div>
        <div className={styles.storyLayout}>
          <div
            className={styles.index}
            role="region"
            aria-label={`${story.name} story progress`}
          >
            <p className={styles.indexHeading}>IN THE STORY</p>
            <ol className={styles.indexList}>
              {story.chapters.map((item, index) => (
                <li
                  key={item.image}
                  aria-current={current === index ? "step" : undefined}
                  data-passed={index < current}
                >
                  <span className={styles.indexDot} aria-hidden="true" />
                  <span>{item.name}</span>
                </li>
              ))}
            </ol>
            <p className={styles.scrollHint}>Scroll to explore ↓</p>
          </div>
          <div className={styles.scenes}>
            {story.chapters.map((chapter, index) => {
              const image = `/revamp/apps/${story.slug}/${chapter.image}.webp`;
              return (
                <section
                  key={chapter.image}
                  ref={(element) => {
                    scenes.current[index] = element;
                  }}
                  className={styles.stage}
                  aria-label={chapter.name}
                >
                  <div className={styles.copy}>
                    <p className={base.eyebrow}>{chapter.name.toUpperCase()}</p>
                    <h2>{chapter.title}</h2>
                    <p>{chapter.text}</p>
                    {chapter.note && (
                      <p className={styles.note}>{chapter.note}</p>
                    )}
                    {chapter.video && (
                      <button
                        className={styles.videoToggle}
                        type="button"
                        aria-pressed={showVideo}
                        onClick={() => setShowVideo((value) => !value)}
                      >
                        {showVideo
                          ? "Show the still image"
                          : "Watch the pulse · silent preview"}
                      </button>
                    )}
                    <a
                      className={styles.fullImage}
                      href={image}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open this screenshot ↗
                    </a>
                  </div>
                  <figure className={styles.phone}>
                    {showVideo && chapter.video ? (
                      <video
                        key={chapter.video}
                        controls
                        playsInline
                        preload="metadata"
                        poster={image}
                        aria-label="Silent emergency design preview"
                      >
                        <source src={chapter.video} type="video/mp4" />
                      </video>
                    ) : (
                      <Image
                        key={image}
                        src={image}
                        alt={`${story.name}: ${chapter.name}, captured from the running Android app`}
                        width={720}
                        height={1600}
                        unoptimized
                        loading={index === 0 ? "eager" : "lazy"}
                      />
                    )}
                    <figcaption>
                      {showVideo && chapter.video
                        ? "A silent visual preview from the app"
                        : "Captured in the Android emulator"}
                    </figcaption>
                  </figure>
                </section>
              );
            })}
          </div>
        </div>
        <section className={styles.captureNote}>
          <p className={base.eyebrow}>ABOUT THESE CAPTURES</p>
          <p>{story.context}</p>
        </section>
        <div className={styles.invitation}>
          <p>Have something you’d like to bring to life?</p>
          <Link href="/revamp#conversation">Let’s talk about it. ↗</Link>
        </div>
      </main>
      <footer className={base.footer}>
        <Link href="/revamp" className={base.logo}>
          kno<span>+</span>
        </Link>
        <p>Real screens. A project taking shape.</p>
        <span>Concept preview · Kno.plus</span>
      </footer>
    </div>
  );
}
