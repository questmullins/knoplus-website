"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { AppStory } from "./walkthroughs";
import { appPanes } from "./app-panes";
import base from "./revamp.module.css";
import styles from "./horizontal.module.css";
import { PlayStoreComingSoon } from "./play-store-coming-soon";

export function AppHorizontal({ story }: { story: AppStory }) {
  const panes = useMemo(() => appPanes(story), [story]);
  const [current, setCurrent] = useState(0);
  const [originalStyle, setOriginalStyle] = useState(false);
  const track = useRef<HTMLDivElement>(null);
  const position = useRef(0);

  function goTo(index: number) {
    const element = track.current;
    if (!element) return;
    const next = Math.max(0, Math.min(panes.length - 1, index));
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    element.scrollTo({ left: next * element.clientWidth, behavior: reduced ? "auto" : "smooth" });
  }

  useEffect(() => {
    const element = track.current;
    if (!element) return;
    let frame = 0;
    let wheelUntil = 0;
    const measure = () => {
      const index = Math.max(0, Math.min(panes.length - 1,
        Math.round(element.scrollLeft / Math.max(1, element.clientWidth))));
      position.current = index;
      setCurrent(index);
    };
    const scroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    const resize = new ResizeObserver(() => {
      element.scrollTo({ left: position.current * element.clientWidth, behavior: "instant" });
      measure();
    });
    const wheel = (event: WheelEvent) => {
      if (event.ctrlKey || event.metaKey || event.shiftKey ||
          Math.abs(event.deltaX) >= Math.abs(event.deltaY) || Math.abs(event.deltaY) < 8) return;
      event.preventDefault();
      const now = performance.now();
      if (now < wheelUntil) return;
      wheelUntil = now + 650;
      const next = Math.max(0, Math.min(panes.length - 1,
        position.current + Math.sign(event.deltaY)));
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      element.scrollTo({ left: next * element.clientWidth, behavior: reduced ? "auto" : "smooth" });
    };
    element.addEventListener("scroll", scroll, { passive: true });
    element.addEventListener("wheel", wheel, { passive: false });
    resize.observe(element);
    measure();
    return () => {
      element.removeEventListener("scroll", scroll);
      element.removeEventListener("wheel", wheel);
      resize.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [panes.length]);

  return (
    <div className={`${base.page} ${styles.shell} ${originalStyle ? base.original : ""}`}>
      <header className={styles.header}>
        <Link href="/revamp#work" className={base.logo} aria-label="Back to Kno.plus projects">kno<span>+</span></Link>
        <span className={styles.projectName}>{story.name}</span>
        <nav aria-label="App preview navigation">
          <Link href={`/revamp/${story.slug}`}>Page view ↗</Link>
          <Link href={`/revamp/${story.slug === "update" ? "rosewave" : "update"}/horizontal`}>
            {story.slug === "update" ? "RoseWave" : "UpDate"} ↗
          </Link>
          <button className={base.styleToggle} type="button" role="switch"
            aria-label="Original style"
            aria-checked={originalStyle} onClick={() => setOriginalStyle(value => !value)}>
            <span className={styles.styleLabel}>Original style</span>
            <span className={base.switchTrack} aria-hidden="true"><span /></span>
          </button>
        </nav>
      </header>
      <main className={styles.main}>
        <div ref={track} className={styles.track} tabIndex={0} role="region"
          aria-label={`${story.name} horizontal preview`} aria-describedby="horizontal-hint"
          onKeyDown={event => {
            if (event.target !== event.currentTarget) return;
            const targets: Record<string, number> = {
              ArrowRight: current + 1, ArrowLeft: current - 1, Home: 0, End: panes.length - 1,
            };
            if (event.key in targets) {
              event.preventDefault();
              goTo(targets[event.key]);
            }
          }}>
          {panes.map((pane, index) => (
            <section key={pane.name} className={styles.pane} aria-label={pane.name}
              aria-roledescription="slide" inert={index !== current}>
              <div className={styles.paneBody}>
                <div className={styles.copy}>
                  <p className={styles.eyebrow}>{story.name} / {pane.name}</p>
                  {index === 0 ? <h1>{pane.title}</h1> : <h2>{pane.title}</h2>}
                  <p className={styles.description}>{pane.text}</p>
                  {pane.note && <p className={styles.note}>{pane.note}</p>}
                </div>
                <figure className={`${styles.photos} ${pane.photos.length > 1 ? styles.pair : ""}`}>
                  {pane.photos.map(photo => (
                    <Image key={photo.image} src={`/revamp/apps/${story.slug}/${photo.image}.webp`}
                      alt={photo.alt} width={720} height={1600} unoptimized
                      draggable={false}
                      loading={index < 2 ? "eager" : "lazy"} />
                  ))}
                </figure>
              </div>
            </section>
          ))}
        </div>
      </main>
      <footer className={styles.footer}>
        <div className={styles.navigation}>
          <button type="button" aria-label="Previous pane" disabled={current === 0}
            onClick={() => goTo(current - 1)}>←</button>
          <div className={styles.position}>
            <p aria-live="polite" aria-atomic="true">{panes[current].name}</p>
            <div className={styles.progress} aria-hidden="true">
              {panes.map((pane, index) => <span key={pane.name} data-current={index === current} />)}
            </div>
          </div>
          <button type="button" aria-label="Next pane" disabled={current === panes.length - 1}
            onClick={() => goTo(current + 1)}>→</button>
        </div>
        <p id="horizontal-hint" className={styles.hint}>Scroll or swipe sideways to explore</p>
        <PlayStoreComingSoon />
      </footer>
    </div>
  );
}
