"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { ContactModal } from "@/components/ContactModal";
import { SchemeToggle } from "@/components/SchemeToggle";
import { toolIcons } from "@/data/tool-icons";
import { toolkit } from "@/data/toolkit";
import { serviceAccent, serviceOverview, services, type ServiceItem } from "../work/services";
import s from "./landing.module.css";

// The long-scroll home trial: a top bar with the three parts of the site, then one band per part, all built from the
// same content as the windows home (app/work/services.ts), so nothing here is written twice.
const find = (id: string, items: ServiceItem[] = services): ServiceItem | undefined => {
  for (const item of items) {
    if (item.id === id) return item;
    const inner = item.children && find(id, item.children);
    if (inner) return inner;
  }
};
const experience = find("experience")!;
const projects = find("projects")!;
const work = find("work-with-me")!;
const groups = experience.children!.filter(item => item.children);
const featured = find("experience--paperwork")!;
const metric = featured.metrics?.[0];
const projectList = projects.children!.flatMap(group => group.children || []);
const strip = toolkit.flatMap(group => group.tools).filter(tool => tool.icon && toolIcons[tool.icon]).slice(0, 18);
const bg = (image: string) => ({ "--bg": image } as CSSProperties);
const shade = (item: ServiceItem) => ({ "--shade": serviceAccent(item) } as CSSProperties);
// The hero rail: the intro, then every group window from the windows home (Automation, Apps, Websites…), side by side.
// Each window keeps the shade of the part of the site it belongs to.
const railWindows = [experience, projects, work].flatMap(section => section.children!.filter(item => !item.tools).map(item => ({ item, section })));
const tagFor = (item: ServiceItem) => {
  const m = item.metrics?.find(x => x.headline);
  return m ? `${m.headline} ${m.change}` : item.platform === "android" ? "Android" : item.note === "In progress." ? "In progress" : "";
};
const plain = (html = "") => html.replace(/<br \/>/g, " ").replace(/<\/?em>/g, "");

export function Landing() {
  const [contact, setContact] = useState<string | null>(null);
  const talk = (topic = "other") => setContact(topic);
  // The open window (a group) and, inside it, the open project. The sheet slides over the page below the bar.
  const [sheet, setSheet] = useState<{ item: ServiceItem; section: ServiceItem } | null>(null);
  const [project, setProject] = useState<ServiceItem | null>(null);
  const [slide, setSlide] = useState(0);
  const rail = useRef<HTMLDivElement>(null);
  const sheetBody = useRef<HTMLDivElement>(null);
  const open = (item: ServiceItem, section: ServiceItem) => { setSheet({ item, section }); setProject(item.children ? null : item); };
  const close = () => { setSheet(null); setProject(null); };
  const go = (index: number) => {
    const track = rail.current; const target = track?.children[Math.max(0, Math.min(railWindows.length, index))] as HTMLElement | undefined;
    if (track && target) track.scrollTo({ left: target.offsetLeft - track.offsetLeft - (track.clientWidth - target.clientWidth) / 2, behavior: "smooth" });
  };

  useEffect(() => {
    const track = rail.current; if (!track) return;
    const update = () => {
      const center = track.scrollLeft + track.clientWidth / 2;
      let best = 0, gap = Infinity;
      Array.from(track.children).forEach((child, index) => { const el = child as HTMLElement; const d = Math.abs(el.offsetLeft - track.offsetLeft + el.clientWidth / 2 - center); if (d < gap) { gap = d; best = index; } });
      setSlide(best);
    };
    track.addEventListener("scroll", update, { passive: true });
    return () => track.removeEventListener("scroll", update);
  }, []);

  useEffect(() => {
    if (!sheet) return;
    const key = (event: KeyboardEvent) => { if (event.key === "Escape") { if (project && sheet.item.children) setProject(null); else close(); } };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [sheet, project]);

  useEffect(() => { sheetBody.current?.scrollTo({ top: 0 }); }, [project, sheet]);

  function detail(item: ServiceItem, section: ServiceItem) {
    return <div className={s.detail}>
      <span className={s.eyebrow}>{item.label}</span>
      <h2>{item.name}</h2>
      <p className={s.lede}>{item.description}</p>
      {!!item.metrics?.length && <div className={s.results}>{item.metrics.map(m => <figure key={m.label}>
        <figcaption>{m.label}</figcaption>
        {m.headline && <p className={s.big}>{m.headline}<span>{m.change}</span></p>}
        <p className={s.swap}><s>{m.before}</s> → <b>{m.after}</b></p>
      </figure>)}</div>}
      {!!item.highlights?.length && <div className={s.facts}><div><span>{item.highlightsLabel || "Features"}</span><p>{item.highlights.join(" / ")}</p></div>
        {!!item.sellingPoints?.length && <div><span>{item.sellingPointsLabel || "Made for"}</span><p>{item.sellingPoints.join(" / ")}</p></div>}</div>}
      {item.note && <p className={s.note}>{item.note}</p>}
      <div className={s.buttons}>
        {item.href && !item.href.startsWith("mailto:") ? <a className={s.primary} href={item.href}>{item.action || "Take a look"}</a>
          : <button type="button" className={s.primary} onClick={() => talk(section.id === "experience" ? "process-automation" : item.id)}>{item.action || "Let’s talk"}</button>}
        {item.related && <a className={s.secondary} href={item.related.href}>{item.related.label}</a>}
        {item.template && <button type="button" className={s.secondary} onClick={() => talk("website-template")}>Inquire</button>}
        {item.hire && <button type="button" className={s.secondary} onClick={() => talk("process-automation")}>Want something like this?</button>}
      </div>
    </div>;
  }

  return <div className={s.page} data-locked={sheet ? true : undefined}>
    <header className={s.bar}>
      <Link href="/preview" className={s.logo}>KNOPLUS</Link>
      <nav className={s.nav} aria-label="Main">
        <a href="#experience">Experience</a>
        <a href="#projects">Projects</a>
        <a href="#work-with-me">Work with me</a>
      </nav>
      <div className={s.barEnd}>
        <Link href="/clients/" prefetch={false} className={s.quiet}>Client sign-in</Link>
        <SchemeToggle className={s.scheme} />
        <button type="button" className={s.primary} onClick={() => talk()}>Let’s talk</button>
      </div>
    </header>

    <main>
      {/* The hero is a side-scrolling rail of windows in the original kno.plus style: the intro first, then each group. */}
      <section className={s.hero} aria-label="Kno.plus">
        <div className={s.rail} ref={rail}>
          <article className={`${s.win} ${s.intro}`} style={{ ...bg(serviceOverview.image), ...shade(work) }}>
            <div className={s.winCopy}>
              <span className={s.eyebrow}>{serviceOverview.label}</span>
              <h1 dangerouslySetInnerHTML={{ __html: serviceOverview.title || "" }} />
              <p>{serviceOverview.description}</p>
              <div className={s.buttons}>
                <button type="button" className={s.primary} onClick={() => go(1)}>See the work →</button>
                <button type="button" className={s.secondary} onClick={() => talk()}>Work with me</button>
              </div>
            </div>
          </article>
          {railWindows.map(({ item, section }, index) => <article key={item.id} className={s.win} style={{ ...bg(item.image), ...shade(section) }}>
            <button type="button" className={s.winHit} aria-label={`Open ${item.name}`} onClick={() => open(item, section)} />
            <div className={s.winCopy}>
              <span className={s.eyebrow}>{section.name} / {String(index + 1).padStart(2, "0")}</span>
              <h2>{item.name}</h2>
              <p>{item.description}</p>
              {item.children && <ul className={s.winList}>{item.children.slice(0, 4).map(child => <li key={child.id}>{child.name}</li>)}{item.children.length > 4 && <li>+{item.children.length - 4} more</li>}</ul>}
              <div className={s.buttons}><button type="button" className={s.primary} onClick={() => open(item, section)}>{item.children ? `Open ${item.name}` : "Take a look"}</button></div>
            </div>
          </article>)}
        </div>
        <div className={s.railBar}>
          <button type="button" aria-label="Previous" onClick={() => go(slide - 1)} disabled={slide === 0}>←</button>
          <span>{String(slide + 1).padStart(2, "0")} / {String(railWindows.length + 1).padStart(2, "0")}</span>
          <div className={s.railDots}>{[null, ...railWindows].map((_, index) => <i key={index} data-on={index === slide || undefined} />)}</div>
          <button type="button" aria-label="Next" onClick={() => go(slide + 1)} disabled={slide === railWindows.length}>→</button>
        </div>
      </section>

      <section className={s.strip} aria-label="Some of the tools I build with">
        <span className={s.eyebrow}>Built with</span>
        <div className={s.marquee}><ul>{[...strip, ...strip].map((tool, index) => <li key={index} aria-hidden={index >= strip.length || undefined} title={tool.name}>
          <svg viewBox="0 0 24 24"><path d={toolIcons[tool.icon!].path} /></svg>
        </li>)}</ul></div>
      </section>

      <section id="experience" className={s.section} style={shade(experience)}>
        <div className={s.heading}>
          <span className={s.eyebrow}>Experience</span>
          <h2>{plain(experience.title)}</h2>
          <p>{experience.description}</p>
        </div>
        {!!experience.stats?.length && <dl className={s.stats}>{experience.stats.map(stat => <div key={stat.label}><dt>{stat.value}</dt><dd>{stat.label}</dd></div>)}</dl>}
        <div className={s.tiles}>{groups.map(group => <Link key={group.id} href={`/#${group.id}`} className={s.tile} style={bg(group.image)}>
          <h3>{group.name}</h3>
          <p>{group.description}</p>
          <ul>{group.children!.map(child => <li key={child.id}>{child.name}</li>)}</ul>
          <span className={s.arrow} aria-hidden="true">→</span>
        </Link>)}</div>
      </section>

      {metric && <section className={s.feature} style={shade(experience)}>
        <div>
          <span className={s.eyebrow}>Featured case study</span>
          <h2>{featured.name}</h2>
          <p className={s.big}>{metric.headline}<span>{metric.change}</span></p>
          <p className={s.swap}><s>{metric.before}</s> → <b>{metric.after}</b> {metric.label.toLowerCase()}</p>
          <p>{featured.description}</p>
          <div className={s.buttons}>
            <Link className={s.primary} href={`/#${featured.id}`}>Read the case study</Link>
            <button type="button" className={s.secondary} onClick={() => talk("process-automation")}>Want something like this?</button>
          </div>
        </div>
        <div className={s.featureImage} style={bg(featured.image)} />
      </section>}

      <section id="projects" className={`${s.section} ${s.band}`} style={shade(projects)}>
        <div className={s.heading}>
          <span className={s.eyebrow}>Projects</span>
          <h2>{plain(projects.title)}</h2>
          <p>{projects.description}</p>
        </div>
        <div className={s.cards}>{projectList.map(item => <Link key={item.id} href={item.related?.href || item.href || "/"} className={s.card}>
          <span className={s.mark} aria-hidden="true">{item.name.charAt(0)}</span>
          <h3>{item.name}</h3>
          <p>{item.description}</p>
          <span className={s.cardFoot}>{item.platform === "android" ? "Android app" : item.note === "In progress." ? "In progress" : "Runs in your browser"}<span aria-hidden="true">→</span></span>
        </Link>)}</div>
      </section>

      <section id="work-with-me" className={s.section} style={shade(work)}>
        <div className={s.heading}>
          <span className={s.eyebrow}>Work with me</span>
          <h2>{plain(work.title)}</h2>
          <p>{work.description}</p>
        </div>
        <ul className={s.list}>
          {work.children!.map(item => {
            const href = item.id === "websites" ? "/websites" : item.id === "client-work" ? item.children?.[0]?.href : undefined;
            const label = item.id === "client-work" ? `${item.name}: ${item.children?.map(child => child.name).join(", ")}` : item.name;
            const body = <><span>{label}</span><small>{item.id === "websites" ? `${item.children?.length} templates to start from` : item.id === "how-it-works" ? item.highlights?.join(" → ") : item.highlights?.slice(0, 3).join(" / ")}</small><span className={s.arrow} aria-hidden="true">→</span></>;
            return <li key={item.id}>{href ? <a href={href}>{body}</a> : <button type="button" onClick={() => talk(item.id)}>{body}</button>}</li>;
          })}
        </ul>
      </section>

      <section className={s.cta} style={shade(work)}>
        <h2>Have something in mind?</h2>
        <p>Tell me what you need, and I’ll come back with a plan and a timeline.</p>
        <div className={s.buttons}>
          <button type="button" className={s.primary} onClick={() => talk()}>Let’s talk</button>
          <Link className={s.secondary} href="/clients/" prefetch={false}>Client sign-in</Link>
        </div>
      </section>
    </main>

    <footer className={s.footer}>
      <span className={s.logo}>KNOPLUS</span>
      <nav aria-label="Footer"><a href="#experience">Experience</a><a href="#projects">Projects</a><a href="#work-with-me">Work with me</a><a href="mailto:info@kno.plus">info@kno.plus</a></nav>
      <small>Know More. Know Better. Knoplus.</small>
    </footer>

    {/* Opening a window slides a sheet up over the rest of the page, like a project opening over its window on the home. */}
    <div className={s.sheet} data-open={sheet ? true : undefined} aria-hidden={!sheet} inert={!sheet}>
      {sheet && <div className={s.sheetInner} style={shade(sheet.section)}>
        <div className={s.sheetHead} style={bg(sheet.item.image)}>
          {project && sheet.item.children ? <button type="button" className={s.back} onClick={() => setProject(null)}>← {sheet.item.name}</button> : <span />}
          <button type="button" className={s.closeBtn} aria-label="Close" onClick={close}>×</button>
        </div>
        <div className={s.sheetBody} ref={sheetBody}>
          {project ? detail(project, sheet.section) : <div className={s.detail}>
            <span className={s.eyebrow}>{sheet.item.label}</span>
            <h2>{sheet.item.name}</h2>
            <p className={s.lede}>{sheet.item.description}</p>
            <ul className={s.banners}>{sheet.item.children!.map(child => <li key={child.id} style={bg(child.image)}>
              <button type="button" onClick={() => setProject(child)}><span>{child.name}</span>{tagFor(child) && <small>{tagFor(child)}</small>}<b aria-hidden="true">→</b></button>
              {child.template && child.href && <a href={child.href} aria-label={`Open the ${child.name} template`} title="Open the template">↗</a>}
            </li>)}</ul>
            {sheet.item.related && <div className={s.buttons}><a className={s.secondary} href={sheet.item.related.href}>{sheet.item.related.label} ↗</a></div>}
          </div>}
        </div>
      </div>}
    </div>

    <ContactModal key={contact || "closed"} isOpen={contact !== null} onClose={() => setContact(null)} selectedTopic={contact || ""} />
  </div>;
}
