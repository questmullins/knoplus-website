"use client";

import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";
import { BrandLogo } from "./BrandLogo";
import { ContactModal } from "./ContactModal";
import { SiteMenu } from "./SiteMenu";
import { projects } from "@/data/projects";

const hubIntro = {
  label: "Projects by Knoplus",
  navTitle: "Overview",
  title: "Ideas, built.<br />Apps, tools<br /><em>and websites.</em>",
  description:
    "Knoplus is the home for everything I am building: phone apps, browser tools, design automation and the website service where it all started. Pick a project to see what it does and why it exists.",
  image:
    "radial-gradient(circle at 74% 24%, rgba(246, 243, 236, 0.14), transparent 30%), radial-gradient(circle at 24% 86%, rgba(147, 66, 82, 0.28), transparent 38%), linear-gradient(135deg, #050506, #17161a 54%, #2d2a32)"
};

function formatCounter(index: number, total: number) {
  return `${String(index + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}`;
}

export function ProjectHub() {
  // -1 is the overview; 0 and up are projects
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [stageImage, setStageImage] = useState(hubIntro.image);
  const [nextStageImage, setNextStageImage] = useState(hubIntro.image);
  const [isBgChanging, setIsBgChanging] = useState(false);
  const [isCopyFading, setIsCopyFading] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach((timer) => window.clearTimeout(timer));
  }, []);

  const current = currentIndex < 0 ? null : projects[currentIndex];

  function select(index: number) {
    if (index === currentIndex) {
      return;
    }

    const image = index < 0 ? hubIntro.image : projects[index].image;
    setNextStageImage(image);
    setIsBgChanging(true);
    setIsCopyFading(true);
    timers.current.push(
      window.setTimeout(() => {
        setCurrentIndex(index);
        setIsCopyFading(false);
      }, 260),
      window.setTimeout(() => {
        setStageImage(image);
        setIsBgChanging(false);
      }, 720)
    );
  }

  function openProject(href: string) {
    window.location.href = href;
  }

  return (
    <>
      <main className="app hub-app">
        <aside>
          <div className="sidebar-brand">
            <BrandLogo />
          </div>

          <div className="template-nav">
            <div className="nav-label">Projects</div>
            <button className={`template-btn ${currentIndex < 0 ? "active" : ""}`} onClick={() => select(-1)} type="button">
              <span>{hubIntro.navTitle}</span>
              <span className="plus" />
            </button>
            {projects.map((project, index) => (
              <button
                className={`template-btn ${index === currentIndex ? "active" : ""}`}
                key={project.slug}
                onClick={() => select(index)}
                onDoubleClick={() => openProject(project.href)}
                type="button"
              >
                <span>{project.navTitle}</span>
                <span className="plus" />
              </button>
            ))}
          </div>

          <div className="sidebar-note cta-note">
            <div className="cta-copy">
              Know More.
              <br />
              Know Better.
              <br />
              Knoplus.
            </div>
            <button onClick={() => setIsContactOpen(true)} type="button" className="cta-button">
              Contact Us
            </button>
          </div>
        </aside>

        <section className="stage" data-theme={current ? current.theme : "service"}>
          <SiteMenu className="stage-menu-control" hideIcon onContact={() => setIsContactOpen(true)} showLabel />
          <div className="preview-bg" style={{ "--bg": stageImage } as CSSProperties} />
          <div className={`preview-bg-next ${isBgChanging ? "show" : ""}`} style={{ "--bg": nextStageImage } as CSSProperties} />

          <div className="content">
            <div className={`copy ${isCopyFading ? "fade" : ""}`}>
              <div className="copy-anchor">
                <div className="eyebrow">{current ? current.kind : hubIntro.label}</div>
                <h1 dangerouslySetInnerHTML={{ __html: current ? current.title : hubIntro.title }} />
                <p>{current ? current.description : hubIntro.description}</p>

                <div className="actions template-actions">
                  <button
                    className="cta-button explore-button"
                    onClick={() => (current ? openProject(current.href) : select(0))}
                    type="button"
                  >
                    {current ? `Explore ${current.navTitle}` : "Explore Projects"}
                  </button>
                </div>

                <div className="template-panel-details" aria-label={current ? `${current.navTitle} details` : "Project overview"}>
                  <strong>{current ? current.status : `${projects.length} projects`}</strong>
                  <div>
                    <span>{current ? "Platform" : "Platforms"}</span>
                    <p>{current ? current.platform : "Android / Browser / Illustrator / Web"}</p>
                  </div>
                  <div>
                    <span>Highlights</span>
                    <p>{(current ? current.highlights : ["Phone apps", "Web tools", "Design automation"]).join(" / ")}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {current ? <div className="counter">{formatCounter(currentIndex, projects.length)}</div> : null}
        </section>
      </main>

      <main className="mobile-scroll-page">
        <header className="mobile-scroll-header">
          <BrandLogo />
          <SiteMenu onContact={() => setIsContactOpen(true)} />
        </header>

        <div className="mobile-scroll-kicker">Projects</div>
        <section
          className="mobile-template-section mobile-service-intro is-revealed"
          data-theme="service"
          style={{ "--bg": hubIntro.image } as CSSProperties}
        >
          <h2 dangerouslySetInnerHTML={{ __html: hubIntro.title }} />
          <p>{hubIntro.description}</p>
          <div className="actions mobile-actions template-actions">
            <button
              className="cta-button explore-button"
              onClick={() => {
                const firstProject = document.querySelector<HTMLElement>(".mobile-template-section:not(.mobile-service-intro)");
                firstProject?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              type="button"
            >
              Explore Projects
            </button>
          </div>
        </section>

        {projects.map((project, index) => (
          <section
            className="mobile-template-section is-revealed"
            data-theme={project.theme}
            key={project.slug}
            style={{ "--bg": project.image } as CSSProperties}
          >
            <div className="mobile-section-count">{formatCounter(index, projects.length)}</div>
            <h2>{project.navTitle}</h2>
            <p>{project.description}</p>
            <div className="actions mobile-actions template-actions">
              <a className="cta-button explore-button" href={project.href}>
                Explore
              </a>
            </div>
            <div className="template-panel-details" aria-label={`${project.navTitle} details`}>
              <strong>{project.status}</strong>
              <div>
                <span>Platform</span>
                <p>{project.platform}</p>
              </div>
              <div>
                <span>Highlights</span>
                <p>{project.highlights.join(" / ")}</p>
              </div>
            </div>
          </section>
        ))}

        <footer className="mobile-scroll-footer">
          <p>
            Know More.
            <br />
            Know Better.
            <br />
            Knoplus.
          </p>
          <button onClick={() => setIsContactOpen(true)} type="button" className="cta-button">
            Contact Us
          </button>
        </footer>
      </main>

      <ContactModal isOpen={isContactOpen} onClose={() => setIsContactOpen(false)} />
    </>
  );
}
