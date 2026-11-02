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
  const [place, setPlace] = useState(0);
  // The rail is a loop: [copy of the last window, intro, every group window, copy of the intro]. It sits on a real
  // window (1…count); when it slides onto a copy, it jumps to the real one without animating, so it never rewinds.
  const count = railWindows.length + 1;
  const [pos, setPos] = useState(1);
  const [animate, setAnimate] = useState(true);
  const touchX = useRef<number | null>(null);
  const paused = useRef(false);
  // Appearance trial: a floating menu flips outlines and corners for the whole page (remembered in this browser only).
  const [look, setLook] = useState({ lines: "none" as "none" | "normal" | "thick", round: true });
  const [lookOpen, setLookOpen] = useState(false);
  useEffect(() => { try { const saved = JSON.parse(localStorage.getItem("kno-preview-look-2") || "null"); if (saved) setLook(saved); } catch {} }, []);
  const setLookSaved = (next: typeof look) => { setLook(next); try { localStorage.setItem("kno-preview-look-2", JSON.stringify(next)); } catch {} };
  const sheetBody = useRef<HTMLDivElement>(null);
  const open = (item: ServiceItem, section: ServiceItem) => { setPlace(0); setSheet({ item, section }); };
  const close = () => setSheet(null);
  const step = (by: number) => { setAnimate(true); setPos(current => Math.max(0, Math.min(count + 1, current + by))); };
  const settle = () => {
    if (pos === 0 || pos === count + 1) { setAnimate(false); setPos(pos === 0 ? count : 1); }
  };
  useEffect(() => {
    if (animate) return;
    const frame = requestAnimationFrame(() => requestAnimationFrame(() => setAnimate(true)));
    return () => cancelAnimationFrame(frame);
  }, [animate]);

  // The rail moves on by itself every 6 seconds, and waits while the pointer is over it, something in it has focus,
  // a window is open, or the visitor prefers less motion.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => {
      if (paused.current || sheet || document.hidden) return;
      step(1);
    }, 6000);
    return () => window.clearInterval(timer);
  }, [sheet]);

  useEffect(() => {
    if (!sheet) return;
    const key = (event: KeyboardEvent) => { if (event.key === "Escape") close(); };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [sheet]);

  useEffect(() => { sheetBody.current?.scrollTo({ top: 0 }); }, [sheet]);

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

  return <div className={s.page} data-locked={sheet ? true : undefined} data-lines={look.lines} data-round={look.round || undefined}>
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
      <section className={s.hero} aria-label="Kno.plus"
        onPointerEnter={() => { paused.current = true; }} onPointerLeave={() => { paused.current = false; }}
        onFocus={() => { paused.current = true; }} onBlur={() => { paused.current = false; }}>
        <div className={s.stage}
          onTouchStart={event => { touchX.current = event.touches[0].clientX; paused.current = true; }}
          onTouchEnd={event => { const start = touchX.current; touchX.current = null; paused.current = false; if (start === null) return; const dx = event.changedTouches[0].clientX - start; if (Math.abs(dx) > 40) step(dx < 0 ? 1 : -1); }}>
        <button type="button" className={`${s.arrowBtn} ${s.prev}`} aria-label="Previous" onClick={() => step(-1)}>←</button>
        <button type="button" className={`${s.arrowBtn} ${s.next}`} aria-label="Next" onClick={() => step(1)}>→</button>
        <div className={s.rail} style={{ transform: `translateX(${-pos * 100}%)`, transition: animate ? undefined : "none" }}
          onTransitionEnd={event => { if (event.target === event.currentTarget) settle(); }}>
          {[railWindows.length, ...Array.from({ length: count }, (_, i) => i), 0].map((index, place) => {
            const copy = place === 0 || place === count + 1;
            const away = place !== pos;
            const props = { "aria-hidden": copy || away || undefined, inert: copy || away || undefined } as const;
            if (index === 0) return <article key={place} {...props} className={`${s.win} ${s.intro}`} style={{ ...bg(serviceOverview.image), ...shade(work) }}>
              <div className={s.winCopy}>
                <span className={s.eyebrow}>{serviceOverview.label}</span>
                {copy ? <h2 dangerouslySetInnerHTML={{ __html: serviceOverview.title || "" }} /> : <h1 dangerouslySetInnerHTML={{ __html: serviceOverview.title || "" }} />}
                <p>{serviceOverview.description}</p>
                <div className={s.buttons}>
                  <button type="button" className={s.primary} onClick={() => step(1)}>See the work →</button>
                  <button type="button" className={s.secondary} onClick={() => talk()}>Work with me</button>
                </div>
              </div>
            </article>;
            const { item, section } = railWindows[index - 1];
            return <article key={place} {...props} className={s.win} style={{ ...bg(item.image), ...shade(section) }}>
              <button type="button" className={s.winHit} aria-label={`Open ${item.name}`} onClick={() => open(item, section)} />
              <div className={s.winCopy}>
                <span className={s.eyebrow}>{section.name}</span>
                <h2>{item.name}</h2>
                <p>{item.description}</p>
                {item.children && <ul className={s.winList}>{item.children.slice(0, 4).map(child => <li key={child.id}>{child.name}</li>)}{item.children.length > 4 && <li>+{item.children.length - 4} more</li>}</ul>}
                <div className={s.buttons}><button type="button" className={s.primary} onClick={() => open(item, section)}>{item.children ? `Open ${item.name}` : "Take a look"}</button></div>
              </div>
            </article>;
          })}
        </div>
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
        {/* A slim bar says where you are; below it, the original kno.plus scroll: one full window per project. */}
        <div className={s.sheetHead}>
          <span className={s.eyebrow}>{sheet.item.label}</span>
          {sheet.item.children && <span className={s.where}>{String(place + 1).padStart(2, "0")} / {String(sheet.item.children.length + 1).padStart(2, "0")}</span>}
          <button type="button" className={s.closeBtn} aria-label="Close" onClick={close}>×</button>
        </div>
        <div className={s.sheetBody} ref={sheetBody} onScroll={event => { const el = event.currentTarget; setPlace(Math.round(el.scrollTop / el.clientHeight)); }}>
          <section className={s.frame} style={bg(sheet.item.image)}>
            {sheet.item.children ? <div className={s.detail}>
              <span className={s.eyebrow}>{sheet.section.name}</span>
              <h2>{sheet.item.name}</h2>
              <p className={s.lede}>{sheet.item.description}</p>
              <ul className={s.banners}>{sheet.item.children.map((child, index) => <li key={child.id} style={bg(child.image)}>
                <button type="button" onClick={() => { const el = sheetBody.current; el?.scrollTo({ top: (index + 1) * el.clientHeight, behavior: "smooth" }); }}><span>{child.name}</span>{tagFor(child) && <small>{tagFor(child)}</small>}<b aria-hidden="true">↓</b></button>
                {child.template && child.href && <a href={child.href} aria-label={`Open the ${child.name} template`} title="Open the template">↗</a>}
              </li>)}</ul>
              {sheet.item.related && <div className={s.buttons}><a className={s.secondary} href={sheet.item.related.href}>{sheet.item.related.label} ↗</a></div>}
            </div> : detail(sheet.item, sheet.section)}
          </section>
          {sheet.item.children?.map(child => <section key={child.id} className={s.frame} style={bg(child.image)}>{detail(child, sheet.section)}</section>)}
        </div>
      </div>}
    </div>

    <div className={s.look}>
      {lookOpen && <div className={s.lookPanel} role="group" aria-label="Appearance">
        <span className={s.eyebrow}>Appearance</span>
        <label><input type="checkbox" checked={look.lines === "none"} onChange={e => setLookSaved({ ...look, lines: e.target.checked ? "none" : "normal" })} /> Remove outlines</label>
        <label><input type="checkbox" checked={look.lines === "thick"} onChange={e => setLookSaved({ ...look, lines: e.target.checked ? "thick" : "normal" })} /> Thicker outlines</label>
        <label><input type="checkbox" checked={look.round} onChange={e => setLookSaved({ ...look, round: e.target.checked })} /> Round edges</label>
      </div>}
      <button type="button" className={s.lookBtn} aria-expanded={lookOpen} onClick={() => setLookOpen(!lookOpen)}>{lookOpen ? "×" : "Aa"}</button>
    </div>

    <ContactModal key={contact || "closed"} isOpen={contact !== null} onClose={() => setContact(null)} selectedTopic={contact || ""} />
  </div>;
}
