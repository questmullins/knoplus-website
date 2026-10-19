"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { AppStory } from "./walkthroughs";
import base from "./revamp.module.css";
import styles from "./walkthrough.module.css";
import { AppLoop } from "./app-loop";

export function AppWalkthrough({ story }: { story: AppStory }) {
  const [current, setCurrent] = useState(0);
  const [originalStyle, setOriginalStyle] = useState(false);
  const [playing, setPlaying] = useState(false);
  const scrollRoot = useRef<HTMLDivElement>(null);
  const scenes = useRef<Array<HTMLElement | null>>([]);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setPlaying(!preference.matches);
    update();
    preference.addEventListener("change", update);
    return () => preference.removeEventListener("change", update);
  }, []);

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
          <button className={styles.videoToggle} type="button"
            aria-pressed={playing} onClick={() => setPlaying(value => !value)}>
            {playing ? "Pause the loops" : "Play the loops"}
          </button>
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
              const media = `/revamp/apps/${story.slug}/${chapter.image}`;
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
                    <a
                      className={styles.fullImage}
                      href={`${media}.gif`}
                      download
                    >
                      Download this GIF ↓
                    </a>
                  </div>
                  <figure className={styles.phone}>
                    <AppLoop src={`${media}-loop.mp4`} poster={image}
                      label={`${story.name}: ${chapter.name}, a silent recording from the Android app`}
                      playing={playing && current === index} />
                  </figure>
                </section>
              );
            })}
          </div>
        </div>
        <section className={styles.captureNote}>
          <p className={base.eyebrow}>ABOUT THIS PREVIEW</p>
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
