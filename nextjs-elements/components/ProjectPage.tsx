"use client";

import type { CSSProperties } from "react";
import { useState } from "react";
import Link from "next/link";
import { BrandLogo } from "./BrandLogo";
import { ContactModal } from "./ContactModal";
import { SiteMenu } from "./SiteMenu";
import { projectPages, type ProjectItem } from "@/data/projects";

type ProjectPageProps = {
  project: ProjectItem;
};

export function ProjectPage({ project }: ProjectPageProps) {
  const [isContactOpen, setIsContactOpen] = useState(false);
  const position = projectPages.findIndex((item) => item.slug === project.slug);
  const nextProject = projectPages[(position + 1) % projectPages.length];

  return (
    <>
      <main className={`project-page project-theme-${project.theme}`}>
        <header className="project-topbar">
          <BrandLogo />
          <nav aria-label="Project navigation">
            <Link className="project-back" href="/">
              All Projects
            </Link>
            <SiteMenu className="project-menu" hideIcon onContact={() => setIsContactOpen(true)} showLabel />
          </nav>
        </header>

        <section className="project-hero">
          <div className="project-hero-copy">
            <div className="eyebrow">
              {project.kind} · {project.status}
            </div>
            <h1 dangerouslySetInnerHTML={{ __html: project.title }} />
            <p>{project.description}</p>
            <div className="project-actions">
              {project.links.map((link) => (
                <a className="cta-button project-primary" href={link.href} key={link.href}>
                  {link.label}
                </a>
              ))}
              <button className="cta-button" onClick={() => setIsContactOpen(true)} type="button">
                Ask About It
              </button>
            </div>
          </div>
          <div className="project-hero-art" style={{ "--bg": project.image } as CSSProperties} aria-hidden="true" />
        </section>

        <section className="project-facts" aria-label={`${project.navTitle} at a glance`}>
          <div>
            <span>Platform</span>
            <p>{project.platform}</p>
          </div>
          <div>
            <span>Status</span>
            <p>{project.status}</p>
          </div>
          <div>
            <span>Highlights</span>
            <p>{project.highlights.join(" / ")}</p>
          </div>
        </section>

        <section className="project-section project-pitch">
          <h2>Why it exists</h2>
          <div>
            {project.pitch.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </section>

        <section className="project-section">
          <h2>What it does</h2>
          <div className="project-features">
            {project.features.map((feature) => (
              <article className="project-feature" key={feature.heading}>
                <h3>{feature.heading}</h3>
                <p>{feature.body}</p>
              </article>
            ))}
          </div>
        </section>

        {project.screenshots ? (
          <section className="project-section">
            <h2>A look inside</h2>
            <div className="project-shots">
              {project.screenshots.map((shot) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img alt={shot.alt} key={shot.src} loading="lazy" src={shot.src} />
              ))}
            </div>
          </section>
        ) : null}

        <section className="project-section project-goal">
          <h2>The goal</h2>
          <p>{project.goal}</p>
        </section>

        <footer className="project-footer">
          <Link className="project-next" href={nextProject.href}>
            <span>Next project</span>
            {nextProject.navTitle}
          </Link>
          <div className="cta-copy">
            Know More.
            <br />
            Know Better.
            <br />
            Knoplus.
          </div>
        </footer>
      </main>

      <ContactModal isOpen={isContactOpen} onClose={() => setIsContactOpen(false)} />
    </>
  );
}
