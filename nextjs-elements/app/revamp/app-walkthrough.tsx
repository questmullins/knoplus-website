"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { AppStory } from "./walkthroughs";
import base from "./revamp.module.css";
import styles from "./walkthrough.module.css";

export function AppWalkthrough({ story }: { story: AppStory }) {
  const [current, setCurrent] = useState(0);
  const [originalStyle, setOriginalStyle] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const chapter = story.chapters[current];
  const image = `/revamp/apps/${story.slug}/${chapter.image}.webp`;
  function select(index: number) {
    setCurrent(index);
    setShowVideo(false);
  }

  return (
    <div className={`${base.page} ${originalStyle ? base.original : ""}`}>
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
        <div
          className={styles.chapters}
          role="group"
          aria-label={`${story.name} walkthrough scenes`}
        >
          {story.chapters.map((item, index) => (
            <button
              type="button"
              key={item.image}
              aria-pressed={current === index}
              onClick={() => select(index)}
            >
              {item.name}
            </button>
          ))}
        </div>
        <section
          className={styles.stage}
          aria-label={`${story.name} app walkthrough`}
        >
          <div className={styles.copy} aria-live="polite" aria-atomic="true">
            <p className={base.eyebrow}>{chapter.name.toUpperCase()}</p>
            <h2>{chapter.title}</h2>
            <p>{chapter.text}</p>
            {chapter.note && <p className={styles.note}>{chapter.note}</p>}
            <div className={styles.controls}>
              <button
                type="button"
                disabled={current === 0}
                onClick={() => select(current - 1)}
              >
                ← Previous view
              </button>
              <button
                type="button"
                disabled={current === story.chapters.length - 1}
                onClick={() => select(current + 1)}
              >
                Next view →
              </button>
            </div>
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
                loading="eager"
              />
            )}
            <figcaption>
              {showVideo
                ? "A silent visual preview from the app"
                : "Captured in the Android emulator"}
            </figcaption>
          </figure>
        </section>
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
