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
  href?: string;
  screenshot?: string;
};

const projects: Project[] = [
  {
    name: "UpDate",
    category: "Mobile apps",
    kind: "A little more peace of mind.",
    description:
      "UpDate exists so you can step into a date with a plan and some backup, leaving more room to actually enjoy it.",
    theme: "date",
    href: "/revamp/update",
    screenshot: "/revamp/apps/update/home.webp",
  },
  {
    name: "RoseWave",
    category: "Mobile apps",
    kind: "A photograph becomes part of your day.",
    description:
      "A photograph can become part of somewhere you spend time every day. RoseWave gives a photo you connect with that place on your phone.",
    theme: "rose",
    href: "/revamp/rosewave",
    screenshot: "/revamp/apps/rosewave/main.webp",
  },
  {
    name: "Insta-Post Maker",
    category: "Web tools",
    kind: "More making. Less arranging.",
    description:
      "You have the photographs and something you want to share. Insta-Post Maker exists so arranging them into a post feels quick and enjoyable.",
    theme: "post",
    href: "/instapost/index.html",
  },
  {
    name: "Website building",
    category: "Websites",
    kind: "Simple, well made, and ready when you need it.",
    description:
      "I enjoy making websites, and I want you to feel excited about yours. Templates, AI, and a little curation help me create something with character, with reasonable expectations and a reasonable turnaround.",
    theme: "web",
    href: "/",
  },
  {
    name: "Freestyle",
    category: "Web tools",
    kind: "Finish your diagram without reaching for a credit card.",
    description:
      "I needed a swimlane diagram for work and kept finding services that wanted payment. Freestyle grew from finding a way around that. You can finish the diagram you need and export it without reaching for a credit card.",
    theme: "flow",
    href: "/webtools/freestyle/index.html",
  },
  {
    name: "Prepress Assistant",
    category: "Workflow",
    kind: "Give the repetitive work away.",
    description:
      "Exploring practical tools for the production tasks that interrupt a designer’s concentration.",
    theme: "press",
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
      ) : theme === "flow" ? (
        <div className={styles.flowBoard}>
          <div className={styles.browserBar}><i /><i /><i /><span>Freestyle</span></div>
          <div className={styles.flowMap}>
            <span>An idea</span><b>↓</b><span>A decision</span><b>↙　↘</b>
            <div><span>Make it</span><span>Refine it</span></div>
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
                A reason behind <em>everything here.</em>
              </h2>
            </div>
            <p>
              Useful things, made for a reason.
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
              .map((project) => {
                const content = <>
                  <ProjectArt theme={project.theme} screenshot={project.screenshot} />
                  <div className={styles.projectMeta}>
                    <span>{project.category}</span>
                    <span>{project.href ? "Open the project ↗" : "In development"}</span>
                  </div>
                  <h3>{project.name}</h3>
                  <h4>{project.kind}</h4>
                  <p>{project.description}</p>
                </>;
                return (
                  <article className={styles.project} key={project.name}>
                    {project.href ? (
                      <a className={styles.projectButton} href={project.href}
                        aria-label={`Open ${project.name}`}>
                        {content}
                      </a>
                    ) : <div className={styles.projectButton}>{content}</div>}
                  </article>
                );
              })}
          </div>
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
