import type { CSSProperties } from "react";
import Link from "next/link";
import { Device, HubShell, PrepressArt } from "./hub/HubShell";
import { projects, websiteService } from "@/data/projects";

const disciplines = [
  {
    heading: "Phone apps",
    body: "Android apps with real-world jobs: a safety companion for dating and a photography wallpaper service."
  },
  {
    heading: "Web tools",
    body: "Small, fast browser tools that do one thing well and keep your files on your own device."
  },
  {
    heading: "Design automation",
    body: "Illustrator panels that turn a team's data into print-ready artwork without retyping a number."
  }
];

export function HubHome() {
  const [update, rosewave, freestyle] = projects;

  return (
    <HubShell
      accent="#f0717f"
      accentInk="#2a1320"
      cta={{ label: "Websites", href: "/websites" }}
      links={[
        { label: "Projects", href: "#projects" },
        { label: "What I build", href: "#build" },
        { label: "Websites", href: "#websites" }
      ]}
    >
      <main className="hub-main">
        <section className="hub-hero hub-home-hero">
          <div className="hub-hero-copy">
            <span className="hub-eyebrow">Projects by Knoplus</span>
            <h1>Ideas, built.</h1>
            <p>
              Knoplus is home to everything I am building: phone apps, browser tools, design automation, and the website
              service where it all started.
            </p>
            <div className="hub-actions">
              <a className="hub-button" href="#projects">
                See the projects
              </a>
              <Link className="hub-button ghost" href="/websites">
                Website templates
              </Link>
            </div>
          </div>
          <div className="hub-hero-art hub-home-collage">
            <Device priority screen={freestyle.heroScreens[0]} />
            <Device priority screen={update.heroScreens[0]} />
            <Device priority screen={rosewave.heroScreens[0]} />
          </div>
        </section>

        <section className="hub-section" id="build">
          <div className="hub-heading center">
            <span className="hub-eyebrow">What I build</span>
            <h2>Useful things, finished properly.</h2>
          </div>
          <div className="hub-features three">
            {disciplines.map((item) => (
              <article key={item.heading}>
                <h3>{item.heading}</h3>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="hub-section" id="projects">
          <div className="hub-heading center">
            <span className="hub-eyebrow">Projects</span>
            <h2>Pick one to look inside.</h2>
          </div>
          <div className="hub-projects">
            {projects.map((project) => (
              <Link
                className={`hub-project project-${project.slug}`}
                href={project.href}
                key={project.slug}
                style={{ "--card-accent": project.accent } as CSSProperties}
              >
                <div className={`hub-project-art ${project.heroScreens[0]?.frame ?? "drawn"}`}>
                  {project.heroScreens.length ? (
                    project.heroScreens.slice(0, 2).map((screen) => <Device key={screen.src} screen={screen} />)
                  ) : (
                    <PrepressArt />
                  )}
                </div>
                <div className="hub-project-copy">
                  <span className="hub-eyebrow">
                    {project.kind} · {project.status}
                  </span>
                  <h3>{project.navTitle}</h3>
                  <p>{project.description}</p>
                  <span className="hub-project-more">Explore {project.navTitle}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="hub-split" id="websites">
          <div className="hub-split-art browser">
            <Device screen={websiteService.screen} />
          </div>
          <div className="hub-card hub-split-copy">
            <span className="hub-eyebrow">
              {websiteService.kind} · {websiteService.status}
            </span>
            <h2>{websiteService.navTitle}</h2>
            <p>{websiteService.description}</p>
            <div className="hub-actions">
              <Link className="hub-button" href="/websites">
                Explore templates
              </Link>
              <Link className="hub-button ghost" href="/websites/process">
                How it works
              </Link>
            </div>
          </div>
        </section>
      </main>
    </HubShell>
  );
}
