"use client";

import Link from "next/link";
import { useState, type CSSProperties } from "react";
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
const plain = (html = "") => html.replace(/<br \/>/g, " ").replace(/<\/?em>/g, "");

export function Landing() {
  const [contact, setContact] = useState<string | null>(null);
  const talk = (topic = "other") => setContact(topic);

  return <div className={s.page}>
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
      <section className={s.hero}>
        <div className={s.heroCopy}>
          <span className={s.eyebrow}>{serviceOverview.label}</span>
          <h1 dangerouslySetInnerHTML={{ __html: serviceOverview.title || "" }} />
          <p>{serviceOverview.description}</p>
          <div className={s.buttons}>
            <a className={s.primary} href="#work-with-me">Work with me</a>
            <a className={s.secondary} href="#experience">See what I’ve done</a>
          </div>
        </div>
        {/* The three parts of the site as stacked windows: the windows idea, used once, as the picture. */}
        <div className={s.windows} aria-hidden="true">
          {[experience, projects, work].map((item, index) => <a key={item.id} href={`#${item.id}`} tabIndex={-1} className={s.window} style={{ ...bg(item.image), ...shade(item), "--i": index } as CSSProperties}>
            <span>{item.name}</span>
          </a>)}
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

    <ContactModal key={contact || "closed"} isOpen={contact !== null} onClose={() => setContact(null)} selectedTopic={contact || ""} />
  </div>;
}
