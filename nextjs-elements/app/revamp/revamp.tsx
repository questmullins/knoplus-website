"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import styles from "./revamp.module.css";

type Project = {
  name: string;
  category: string;
  kind: string;
  description: string;
  theme: string;
  detail: string;
  href?: string;
  screenshot?: string;
};

const projects: Project[] = [
  {
    name: "UpDate",
    category: "Mobile apps",
    kind: "A little more peace of mind.",
    description:
      "Exploring the moments before, during, and after a date — and how a phone can offer a little support along the way.",
    theme: "date",
    href: "/revamp/update",
    screenshot: "/revamp/apps/update/home.webp",
    detail:
      "A mobile project exploring date planning, check-ins, and quick access to support. The question behind it: how can something as familiar as a phone make an unfamiliar moment feel more manageable?",
  },
  {
    name: "RoseWave",
    category: "Mobile apps",
    kind: "A photograph becomes part of your day.",
    description:
      "A photography-led wallpaper app, from full-screen images and release galleries to the photograph on your home screen.",
    theme: "rose",
    href: "/revamp/rosewave",
    screenshot: "/revamp/apps/rosewave/main.webp",
    detail:
      "Explore the running Android test app through real emulator captures: the free-photo viewer, release galleries, and a wallpaper applied to the emulator's home screen.",
  },
  {
    name: "Insta-Post Maker",
    category: "Web tools",
    kind: "More making. Less arranging.",
    description:
      "A small browser tool for turning photos into a post, with more attention left for the story you want to share.",
    theme: "post",
    href: "/instapost/",
    detail:
      "An existing browser tool for choosing a post format, adding photos, and arranging a finished post. A focused example of removing friction from a recurring creative task.",
  },
  {
    name: "Website building",
    category: "Websites",
    kind: "A place that feels like yours.",
    description:
      "Websites for independent businesses, with room for their character and a clear way for people to get in touch.",
    theme: "web",
    href: "/",
    detail:
      "Explore the current Kno.plus website collection: templates and custom website options for independent businesses. This is where the work began, and remains part of the wider practice.",
  },
  {
    name: "Prepress Assistant",
    category: "Workflow",
    kind: "Give the repetitive work away.",
    description:
      "Exploring practical tools for the production tasks that interrupt a designer’s concentration.",
    theme: "press",
    detail:
      "A project exploring barcode and annotation tools for prepress work. This concept uses an illustrative panel rather than private production screens or customer information.",
  },
];

const filters = [
  "Everything",
  "Mobile apps",
  "Web tools",
  "Websites",
  "Workflow",
];

function ProjectArt({
  theme,
  screenshot,
}: {
  theme: string;
  screenshot?: string;
}) {
  return (
    <div className={`${styles.art} ${styles[theme]}`} aria-hidden="true">
      {screenshot ? (
        <Image
          className={styles.realScreen}
          src={screenshot}
          alt=""
          width={720}
          height={1600}
          unoptimized
        />
      ) : theme === "date" ? (
        <div className={styles.phone}>
          <div className={styles.phoneTop}>
            UpDate <span>✦</span>
          </div>
          <p>
            A good night starts
            <br />
            with a little peace of mind.
          </p>
          <div className={styles.phoneTile}>
            ↗ <span>Plan a date</span>
          </div>
          <div className={styles.phoneTile}>
            ♡ <span>Check in</span>
          </div>
          <div className={styles.phoneBottom}>
            A little backup. Wherever you go.
          </div>
        </div>
      ) : theme === "post" ? (
        <div className={styles.photoStack}>
          <div className={styles.photoBack} />
          <div className={styles.photoFront}>
            <div className={styles.sun} />
            <span>
              A moment.
              <br />
              <em>Made yours.</em>
            </span>
          </div>
          <div className={styles.photoLabel}>YOUR NEXT POST ↗</div>
        </div>
      ) : theme === "web" ? (
        <div className={styles.browser}>
          <div className={styles.browserBar}>
            <i />
            <i />
            <i />
            <span>a place of your own</span>
          </div>
          <div className={styles.websitePreview}>
            <small>INDEPENDENT BY NATURE</small>
            <p>
              Good things.
              <br />
              <em>Built with care.</em>
            </p>
            <span>Come on in ↗</span>
          </div>
        </div>
      ) : (
        <div className={styles.pressPanel}>
          <div className={styles.pressTitle}>
            A little production help <span>✳</span>
          </div>
          <div className={styles.barcode} />
          <div className={styles.pressRule} />
          <p>
            Less repetition.
            <br />
            More room to create.
          </p>
          <small>ILLUSTRATIVE TOOL CONCEPT</small>
        </div>
      )}
    </div>
  );
}

export function Revamp() {
  const [originalStyle, setOriginalStyle] = useState(false);
  const [filter, setFilter] = useState("Everything");
  const [selected, setSelected] = useState<string | null>(null);
  const activeProject = projects.find((project) => project.name === selected);

  return (
    <div
      className={`${styles.page} ${originalStyle ? styles.original : ""}`}
      data-style={originalStyle ? "original" : "concept"}
    >
      <div className={styles.conceptBar}>
        A NEW DIRECTION FOR KNO.PLUS{" "}
        <div className={styles.styleControls}>
          <span className={styles.conceptStatus}>
            Working concept · open for conversation
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={originalStyle}
            className={styles.styleToggle}
            onClick={() => setOriginalStyle((current) => !current)}
          >
            Original style
            <span className={styles.switchTrack} aria-hidden="true">
              <span />
            </span>
          </button>
        </div>
      </div>
      <header className={styles.header}>
        <Link
          className={styles.logo}
          href="/revamp"
          aria-label="Kno.plus revamp home"
        >
          kno<span>+</span>
        </Link>
        <nav aria-label="Main navigation">
          <a href="#perspective">The thinking</a>
          <a href="#work">The work</a>
          <a className={styles.navContact} href="#conversation">
            Have something in mind? <span>↗</span>
          </a>
        </nav>
      </header>
      <main>
        <section className={styles.hero}>
          <div className={styles.heroText}>
            <p className={styles.eyebrow}>
              <span /> INDEPENDENT THINKING. USEFUL THINGS.
            </p>
            <h1>
              There’s something
              <br />
              you want to
              <br />
              <em>make better.</em>
            </h1>
            <p className={styles.intro}>
              An idea that won’t leave you alone. A task that takes too much. A
              business ready for something more.
            </p>
            <p className={styles.introSmall}>That’s a good place to begin.</p>
            <a className={styles.textLink} href="#work">
              See where that can lead <span>↘</span>
            </a>
          </div>
          <div
            className={styles.heroBoard}
            aria-label="An illustrated studio pinboard connecting an idea to a useful outcome"
          >
            <div className={styles.boardHeading}>
              ON THE STUDIO WALL <span>↗</span>
            </div>
            <div className={styles.note}>
              <small>THE SPARK</small>
              <p>
                “There has to be
                <br />a better way
                <br />
                to do this.”
              </p>
              <span>Let’s find it.</span>
            </div>
            <div className={styles.orbit}>
              <span>idea</span>
              <i />
              <span>something useful</span>
            </div>
            <div className={styles.miniWindow}>
              <div>
                <i />
                <i />
                <i />
              </div>
              <span>
                less friction.
                <br />
                <em>more possibility.</em>
              </span>
              <p>Built around real life.</p>
            </div>
            <div className={styles.boardFooter}>
              <span>Websites / Apps / Tools / What’s next</span>
              <b>✳</b>
            </div>
          </div>
        </section>
        <section className={styles.perspective} id="perspective">
          <p className={styles.eyebrow}>THE REASON COMES FIRST</p>
          <div>
            <h2>
              The answer might be an app.
              <br />
              The starting point is <em>you.</em>
            </h2>
            <div className={styles.perspectiveCopy}>
              <p>
                You don’t need to arrive with a technical brief. Tell me what
                keeps getting in the way, what you wish existed, or what you’re
                ready to put into the world.
              </p>
              <p>
                We can question it, sketch it, and figure out what deserves to
                be built. Sometimes that’s a website. Sometimes it’s a tool that
                makes a long afternoon shorter. The form follows the reason.
              </p>
            </div>
          </div>
        </section>
        <section className={styles.work} id="work">
          <div className={styles.workHeading}>
            <div>
              <p className={styles.eyebrow}>
                DIFFERENT QUESTIONS. DIFFERENT POSSIBILITIES.
              </p>
              <h2>
                A few things <em>taking shape.</em>
              </h2>
            </div>
            <p>
              A working collection of projects and ideas.
              <br />
              Different forms. The same curiosity.
            </p>
          </div>
          <div
            className={styles.filters}
            role="group"
            aria-label="Filter projects"
          >
            {filters.map((item) => (
              <button
                key={item}
                type="button"
                aria-pressed={filter === item}
                onClick={() => {
                  setFilter(item);
                  setSelected(null);
                }}
                className={filter === item ? styles.activeFilter : ""}
              >
                {item}
              </button>
            ))}
          </div>
          <div className={styles.projects}>
            {projects
              .filter(
                (project) =>
                  filter === "Everything" || project.category === filter,
              )
              .map((project) => (
                <article className={styles.project} key={project.name}>
                  <button
                    className={styles.projectButton}
                    type="button"
                    onClick={() =>
                      setSelected(
                        selected === project.name ? null : project.name,
                      )
                    }
                    aria-expanded={selected === project.name}
                    aria-controls={
                      selected === project.name ? "project-detail" : undefined
                    }
                  >
                    <ProjectArt
                      theme={project.theme}
                      screenshot={project.screenshot}
                    />
                    <div className={styles.projectMeta}>
                      <span>{project.category}</span>
                      <span>Explore the idea ↗</span>
                    </div>
                    <h3>{project.name}</h3>
                    <h4>{project.kind}</h4>
                    <p>{project.description}</p>
                  </button>
                  {project.screenshot && project.href && (
                    <Link
                      className={styles.walkthroughLink}
                      href={project.href}
                    >
                      Walk through the app <span>↗</span>
                    </Link>
                  )}
                </article>
              ))}
          </div>
          {activeProject && (
            <div
              id="project-detail"
              className={styles.detail}
              role="region"
              aria-label={`${activeProject.name} project details`}
            >
              <div>
                <p className={styles.eyebrow}>BEHIND THE PROJECT</p>
                <h3>{activeProject.name}</h3>
                <p>{activeProject.detail}</p>
                {activeProject.href && (
                  <a className={styles.textLink} href={activeProject.href}>
                    {activeProject.screenshot
                      ? "Walk through the app"
                      : "Open the current experience"}{" "}
                    <span>↗</span>
                  </a>
                )}
                <small>
                  {activeProject.screenshot
                    ? "Real Android emulator screenshots. The walkthrough identifies the build and any preview-only screens."
                    : "Project artwork above is an illustrative concept, rather than a screenshot of the current product."}
                </small>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                aria-label="Close project details"
              >
                ×
              </button>
            </div>
          )}
        </section>
        <section className={styles.belief}>
          <span className={styles.asterisk} aria-hidden="true">
            ✳
          </span>
          <div>
            <p className={styles.eyebrow}>A COMMON THREAD</p>
            <h2>
              Technology should make room
              <br />
              for the thing you <em>actually do.</em>
            </h2>
            <p>
              For your work. Your people. Your next idea. That’s the kind of
              useful I’m interested in building.
            </p>
          </div>
        </section>
        <section className={styles.conversation} id="conversation">
          <p className={styles.eyebrow}>NO PERFECT BRIEF REQUIRED</p>
          <h2>
            What’s on <em>your mind?</em>
          </h2>
          <p>
            Start with the messy version. The “wouldn’t it be nice if.”
            <br />
            The thing you’ve been meaning to figure out.
          </p>
          <a
            href="mailto:info@kno.plus?subject=Something%20on%20my%20mind"
            className={styles.contactLink}
          >
            Let’s talk about it. <span>↗</span>
          </a>
          <a href="mailto:info@kno.plus" className={styles.email}>
            info@kno.plus
          </a>
        </section>
      </main>
      <footer className={styles.footer}>
        <Link href="/revamp" className={styles.logo}>
          kno<span>+</span>
        </Link>
        <p>Thoughtful consulting. Things worth making.</p>
        <span>Concept preview · Kno.plus</span>
      </footer>
    </div>
  );
}
