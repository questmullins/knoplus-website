"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { AppStory } from "./walkthroughs";
import base from "./revamp.module.css";
import styles from "./walkthrough.module.css";

function Photo({ slug, image, label, eager = false }: {
  slug: string; image: string; label: string; eager?: boolean;
}) {
  return <Image src={`/revamp/apps/${slug}/${image}.webp`} alt={label}
    width={720} height={1600} unoptimized loading={eager ? "eager" : "lazy"} />;
}

function RosewaveShowcase() {
  return <div className={styles.showcaseGrid}>
    <section className={styles.galleryCard} aria-label="Browse the photographs">
      <div className={styles.cardCopy}>
        <p className={base.eyebrow}>FIND YOUR PHOTOGRAPH</p>
        <h2>A collection to explore.</h2>
        <p>Browse a release, look through its photographs, and keep your favourites close.</p>
      </div>
      <div className={styles.galleryPhotos}>
        <Photo slug="rosewave" image="gallery" label="RoseWave’s photography releases" />
        <Photo slug="rosewave" image="set-tiles" label="Photographs within The Blush of Autumn release" />
      </div>
    </section>
    <section className={styles.wallpaperCard} aria-label="Make it your wallpaper">
      <div className={styles.cardCopy}>
        <p className={base.eyebrow}>MAKE IT YOURS</p>
        <h2>Part of your everyday.</h2>
        <p>Choose a photograph for your home screen, lock screen, or both.</p>
      </div>
      <div className={styles.homePhoto}>
        <Photo slug="rosewave" image="wallpaper-home" label="The free Blush of Autumn photograph on an Android home screen" />
      </div>
    </section>
  </div>;
}


export function AppWalkthrough({ story }: { story: AppStory }) {
  const [current, setCurrent] = useState(0);
  const [originalStyle, setOriginalStyle] = useState(false);
  const isRosewave = story.slug === "rosewave";
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
        <div className={styles.projectIntro}>
        <div className={styles.intro}>
          <p className={base.eyebrow}>
            A LOOK INSIDE · {story.name.toUpperCase()}
          </p>
          <h1>{story.title}</h1>
          <p>{story.intro}</p>
        </div>
        <figure className={styles.heroPhoto}>
          <Photo slug={story.slug} image={isRosewave ? "main" : "home"}
            label={isRosewave ? "RoseWave’s full-screen photograph viewer" : "UpDate’s home screen with planning and support options"} eager />
        </figure>
        </div>
        {isRosewave ? <RosewaveShowcase /> : (
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
              return (
                <section
                  key={chapter.image}
                  ref={(element) => {
                    scenes.current[index] = element;
                  }}
                  className={`${styles.stage} ${chapter.secondImage ? styles.pairedStage : ""}`}
                  aria-label={chapter.name}
                >
                  <div className={styles.copy}>
                    <p className={base.eyebrow}>{chapter.name.toUpperCase()}</p>
                    <h2>{chapter.title}</h2>
                    <p>{chapter.text}</p>
                    {chapter.note && (
                      <p className={styles.note}>{chapter.note}</p>
                    )}
                  </div>
                  <figure className={chapter.secondImage ? styles.photoPair : styles.phone}>
                    <Photo slug={story.slug} image={chapter.image} label={`${story.name}: ${chapter.name}`} />
                    {chapter.secondImage && <Photo slug={story.slug} image={chapter.secondImage}
                      label="Review the plan before sharing" />}
                  </figure>
                </section>
              );
            })}
          </div>
        </div>
        )}
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
        <p>Useful things, made for a reason.</p>
        <span>Concept preview · Kno.plus</span>
      </footer>
    </div>
  );
}
