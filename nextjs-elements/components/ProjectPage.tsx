import Link from "next/link";
import { Device, HubShell, PrepressArt } from "./hub/HubShell";
import { projects, type ProjectItem } from "@/data/projects";

type ProjectPageProps = {
  project: ProjectItem;
};

export function ProjectPage({ project }: ProjectPageProps) {
  const position = projects.findIndex((item) => item.slug === project.slug);
  const nextProject = projects[(position + 1) % projects.length];
  const links = [
    { label: "Overview", href: "#overview" },
    { label: "Features", href: "#features" },
    ...(project.gallery ? [{ label: "Screens", href: "#screens" }] : []),
    { label: "Status", href: "#status" },
    { label: "FAQ", href: "#faq" }
  ];

  return (
    <HubShell accent={project.accent} accentInk={project.accentInk} cta={project.cta} links={links}>
      <main className={`hub-main project-${project.slug}`}>
        <section className="hub-hero" id="overview">
          <div className="hub-hero-copy">
            <span className="hub-eyebrow">
              {project.kind} · {project.status}
            </span>
            <h1>{project.title}</h1>
            <p>{project.description}</p>
            <div className="hub-actions">
              {project.cta ? (
                <a className="hub-button" href={project.cta.href}>
                  {project.cta.label}
                </a>
              ) : null}
              <a className="hub-button ghost" href="#features">
                What it does
              </a>
            </div>
          </div>
          <div className={`hub-hero-art count-${project.heroScreens.length}`}>
            {project.heroScreens.length ? (
              project.heroScreens.map((screen, index) => <Device key={screen.src} priority={index === 0} screen={screen} />)
            ) : (
              <PrepressArt />
            )}
          </div>
        </section>

        <section className="hub-section" id="features">
          <div className="hub-heading center">
            <span className="hub-eyebrow">What it does</span>
            <h2>{project.featuresHeading}</h2>
          </div>
          <div className="hub-features">
            {project.features.map((feature) => (
              <article key={feature.heading}>
                <h3>{feature.heading}</h3>
                <p>{feature.body}</p>
              </article>
            ))}
          </div>
        </section>

        {project.spotlights.map((spotlight, index) => (
          <section className={`hub-split ${index % 2 ? "flip" : ""} ${spotlight.screen ? "" : "text-only"}`} key={spotlight.heading}>
            {spotlight.screen ? (
              <div className={`hub-split-art ${spotlight.screen.frame}`}>
                <Device screen={spotlight.screen} />
              </div>
            ) : null}
            <div className="hub-card hub-split-copy">
              <span className="hub-eyebrow">{spotlight.eyebrow}</span>
              <h2>{spotlight.heading}</h2>
              {spotlight.body.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </section>
        ))}

        {project.gallery ? (
          <section className="hub-section" id="screens">
            <div className="hub-heading center">
              <span className="hub-eyebrow">{project.gallery.eyebrow}</span>
              <h2>{project.gallery.heading}</h2>
              <p>{project.gallery.body}</p>
            </div>
            <div className="hub-gallery">
              {project.gallery.screens.map((screen) => (
                <div className="hub-gallery-item" key={screen.src}>
                  <Device screen={screen} />
                  <span className="hub-tag">{screen.label}</span>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <section className="hub-pair" id="status">
          <div className="hub-card">
            <span className="hub-eyebrow">Where it is now</span>
            <h2>{project.statusNote.heading}</h2>
            <p>{project.statusNote.body}</p>
          </div>
          <div className="hub-card hub-table" aria-label={`${project.navTitle} at a glance`}>
            {project.glance.map((row) => (
              <div key={row.label}>
                <span>{row.label}</span>
                <b>{row.value}</b>
              </div>
            ))}
          </div>
        </section>

        <section className="hub-section hub-faq" id="faq">
          <div className="hub-heading center">
            <h2>Questions, answered.</h2>
          </div>
          {project.faq.map((item, index) => (
            <details key={item.q} open={index === 0}>
              <summary>{item.q}</summary>
              <p>{item.a}</p>
            </details>
          ))}
        </section>

        <section className="hub-section hub-cta">
          <h2>Curious about {project.navTitle}?</h2>
          <p>See the next project, or get in touch to talk about building something like it.</p>
          <div className="hub-actions center">
            {project.cta ? (
              <a className="hub-button" href={project.cta.href}>
                {project.cta.label}
              </a>
            ) : null}
            <Link className="hub-button ghost" href={nextProject.href}>
              Next: {nextProject.navTitle}
            </Link>
          </div>
        </section>
      </main>
    </HubShell>
  );
}
