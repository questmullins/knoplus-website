"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { AppStory } from "./walkthroughs";
import { getProject, projectCatalog, type ProjectPresentation } from "./project-catalog";
import base from "./revamp.module.css";
import styles from "./horizontal.module.css";
import { PlayStoreComingSoon } from "./play-store-coming-soon";

export function AppHorizontal({ story }: { story: AppStory }) {
  return <ProjectHorizontal key={story.slug} project={getProject(story.slug)} />;
}

export function ProjectHorizontal({ project }: { project: ProjectPresentation }) {
  const panes = project.panes;
  const nextProject = projectCatalog[(projectCatalog.findIndex(item => item.slug === project.slug) + 1) % projectCatalog.length];
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
        <span className={styles.projectName}>{project.name}</span>
        <nav aria-label="Project navigation">
          <Link className={styles.allProjects} href="/revamp#work">All projects ↖</Link>
          <Link href={`/revamp/${nextProject.slug}`}>{nextProject.name} ↗</Link>
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
          aria-label={`${project.name} project`} aria-describedby="horizontal-hint"
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
                  <p className={styles.eyebrow}>{project.name} / {pane.name}</p>
                  {index === 0 ? <h1>{pane.title}</h1> : <h2>{pane.title}</h2>}
                  <p className={styles.description}>{pane.text}</p>
                  {pane.note && <p className={styles.note}>{pane.note}</p>}
                  {index === 0 && project.relatedLink && <Link className={styles.relatedLink} href={project.relatedLink.href}>{project.relatedLink.label} <span aria-hidden="true">↗</span></Link>}
                </div>
                <figure className={`${styles.photos} ${pane.photos.length > 1 ? styles.pair : ""}`}>
                  {pane.photos.map(photo => (
                    <Image key={photo.src} src={photo.src}
                      alt={photo.alt} width={photo.width} height={photo.height} unoptimized
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
          {panes.length > 1 && <button type="button" aria-label="Previous pane" disabled={current === 0}
            onClick={() => goTo(current - 1)}>←</button>}
          <div className={styles.position}>
            <p aria-live="polite" aria-atomic="true">{panes[current].name}</p>
            <div className={styles.progress} aria-hidden="true">
              {panes.map((pane, index) => <span key={pane.name} data-current={index === current} />)}
            </div>
          </div>
          {panes.length > 1 && <button type="button" aria-label="Next pane" disabled={current === panes.length - 1}
            onClick={() => goTo(current + 1)}>→</button>}
        </div>
        <p id="horizontal-hint" className={styles.hint}>{panes.length > 1 ? "Scroll or swipe sideways to explore" : "Project preview"}</p>
        {project.action.kind === "store" ? <PlayStoreComingSoon /> : (
          <a className={styles.projectAction} href={project.action.href} aria-label={project.action.label}>
            <span className={styles.fullLabel}>{project.action.label}</span>
            <span className={styles.shortLabel}>{project.action.shortLabel}</span><span aria-hidden="true">↗</span>
          </a>
        )}
      </footer>
    </div>
  );
}
