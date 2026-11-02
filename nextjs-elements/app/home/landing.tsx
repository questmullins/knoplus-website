"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { ContactModal } from "@/components/ContactModal";
import { SchemeToggle } from "@/components/SchemeToggle";
import { toolIcons } from "@/data/tool-icons";
import { toolkit } from "@/data/toolkit";
import { projectCatalog } from "../work/project-catalog";
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
// Only names most people know on sight; the full list lives in Experience / Toolkit.
const known = ["python", "javascript", "typescript", "react", "nextdotjs", "nodedotjs", "android", "shopify", "googlesheets", "gmail", "github", "cloudflare"];
const strip = known.map(icon => toolkit.flatMap(group => group.tools).find(tool => tool.icon === icon)).filter((tool): tool is NonNullable<typeof tool> => !!tool && !!toolIcons[tool.icon!]);
// Each project's own icon where it has one; otherwise a monogram tile in its shade.
const freestyleIcon = <svg viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="#2d2a32" /><path d="M6 21c4-9 7 5 11-4s5-6 9-7" fill="none" stroke="#ffbf46" strokeWidth="3.2" strokeLinecap="round" /></svg>;
function AppMark({ item }: { item: ServiceItem }) {
  return <span className={s.appMark} style={{ "--shade": serviceAccent(item) } as CSSProperties} aria-hidden="true">
    {item.id === "update" ? <img src="/revamp/apps/update/icon.webp" alt="" /> : item.id === "rosewave-app" ? <img src="/revamp/rosewave-gallery/photos/blush-of-autumn-04.webp" alt="" /> : item.id === "freestyle" ? freestyleIcon : item.name.charAt(0)}
  </span>;
}
const shotsFor = (item: ServiceItem) => (projectCatalog.find(p => p.slug === item.id.replace(/-app$/, ""))?.panes.flatMap(pane => pane.photos) || []).slice(0, 4);
// Tools, outcome and "also includes" sit together in one box under a project.
function factRows(item: ServiceItem) {
  const rows: [string, string][] = [];
  if (item.highlights?.length) rows.push([item.highlightsLabel || "Features", item.highlights.join(" / ")]);
  if (item.sellingPoints?.length) rows.push([item.sellingPointsLabel || "Made for", item.sellingPoints.join(" / ")]);
  if (item.note) { const m = /^also includes:\s*/i.exec(item.note); rows.push(m ? ["Also includes", item.note.slice(m[0].length)] : ["Note", item.note]); }
  return rows;
}
const bg = (image: string) => ({ "--bg": image } as CSSProperties);
const shade = (item: ServiceItem) => ({ "--shade": serviceAccent(item) } as CSSProperties);
// The hero rail: the intro, then every group window from the windows home (Automation, Apps, Websites…), side by side.
// Each window keeps the shade of the part of the site it belongs to.
// Only the strongest windows ride the rail: the measured automation work, the apps, the websites and the client work.
const railPicks = ["experience--automation", "apps", "websites", "client-work"];
const railWindows = railPicks.map(id => {
  const section = [experience, projects, work].find(top => top.children!.some(item => item.id === id))!;
  return { item: section.children!.find(item => item.id === id)!, section };
});
// Photos for this page, so the windows don't repeat the same laptop shots: people, a phone, a desk, Quest's own photography.
const photos: Record<string, string> = {
  intro: "url('/revamp/rosewave-gallery/photos/dreaming-of-a-wave-05.webp')",
  "experience--automation": "url('/revamp/banners/process.webp')",
  apps: "url('/revamp/banners/phone.webp')",
  websites: "url('/revamp/banners/websites.webp')",
  "client-work": "url('/revamp/rosewave-gallery/photos/blush-of-autumn-04.webp')",
  rosewave: "url('/revamp/rosewave-gallery/photos/nyc550-08.webp')",
  "experience--commerce-data": "url('/revamp/banners/consulting.webp')",
  "experience--scheduler": "url('/revamp/banners/prepress.webp')",
};
const photo = (item: ServiceItem) => photos[item.id] || item.image;
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
  // A project card opens a small window: what it is, a few screens, and a button to open it.
  const [peeked, setPeeked] = useState<ServiceItem | null>(null);
  const peekDialog = useRef<HTMLDialogElement>(null);
  const peek = (item: ServiceItem) => { setPeeked(item); peekDialog.current?.showModal(); };
  // The rail is a loop: [copy of the last window, intro, every group window, copy of the intro]. It sits on a real
  // window (1…count); when it slides onto a copy, it jumps to the real one without animating, so it never rewinds.
  const count = railWindows.length + 1;
  const [pos, setPos] = useState(1);
  const [animate, setAnimate] = useState(true);
  const touchX = useRef<number | null>(null);
  const paused = useRef(false);
  // Appearance trial: a floating menu flips outlines and corners for the whole page (remembered in this browser only).
  const sheetBody = useRef<HTMLDivElement>(null);
  // Opening a window puts its id in the address (kno.plus/#websites), so it can be linked to and shared.
  const [start, setStart] = useState(0);
  const open = (item: ServiceItem, section: ServiceItem, at = 0) => {
    setPlace(at); setStart(at); setSheet({ item, section });
    window.history.replaceState(null, "", `#${item.children?.[at - 1]?.id || item.id}`);
  };
  const close = () => { setSheet(null); window.history.replaceState(null, "", window.location.pathname); };
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

  useEffect(() => { const el = sheetBody.current; el?.scrollTo({ top: start * (el.clientHeight || 0) }); }, [sheet, start]);

  // Links into the page: #experience / #projects / #work-with-me scroll to the section; any group or project id
  // (#websites, #experience--paperwork, #update…) opens its window, scrolled to that project.
  useEffect(() => {
    const follow = () => {
      const id = decodeURIComponent(window.location.hash.slice(1));
      if (!id) return;
      if ([experience, projects, work].some(top => top.id === id)) {
        setSheet(null);
        requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }));
        return;
      }
      for (const section of [experience, projects, work]) for (const group of section.children || []) {
        if (group.id === id) return open(group, section);
        const index = group.children?.findIndex(child => child.id === id) ?? -1;
        if (index >= 0) return open(group, section, index + 1);
      }
    };
    follow();
    window.addEventListener("hashchange", follow);
    return () => window.removeEventListener("hashchange", follow);
  }, []);

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
      {!!factRows(item).length && <dl className={s.factBox}>{factRows(item).map(([label, text]) => <div key={label}><dt>{label}</dt><dd>{text}</dd></div>)}</dl>}
      <div className={s.buttons}>
        {item.href && !item.href.startsWith("mailto:") ? <a className={s.primary} href={item.href}>{item.action || "Take a look"}</a>
          : <button type="button" className={s.primary} onClick={() => talk(section.id === "experience" ? "process-automation" : item.id)}>{item.action || "Let’s talk"}</button>}
        {item.related && <a className={s.secondary} href={item.related.href}>{item.related.label}</a>}
        {item.template && <button type="button" className={s.secondary} onClick={() => talk("website-template")}>Inquire</button>}
        {item.hire && <button type="button" className={s.secondary} onClick={() => talk("process-automation")}>Want something like this?</button>}
      </div>
    </div>;
  }

  return <div className={s.page} data-locked={sheet ? true : undefined} data-lines="none" data-round data-plain style={{ "--panel-a": 0.85 } as CSSProperties}>
    <header className={s.bar}>
      <Link href="/" className={s.logo} onClick={event => { if (sheet) { event.preventDefault(); close(); } }}>KNOPLUS</Link>
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
            if (index === 0) return <article key={place} {...props} className={`${s.win} ${s.intro}`} style={{ ...bg(photos.intro), ...shade(work) }}>
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
            return <article key={place} {...props} className={s.win} style={{ ...bg(photo(item)), ...shade(section) }}>
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
        <div className={s.marquee}><ul>{[...strip, ...strip].map((tool, index) => <li key={index} aria-hidden={index >= strip.length || undefined}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d={toolIcons[tool.icon!].path} /></svg><span>{tool.name}</span>
        </li>)}</ul></div>
      </section>

      <section id="experience" className={s.section} style={shade(experience)}>
        <div className={s.heading}>
          <span className={s.eyebrow}>Experience</span>
          <h2>{plain(experience.title)}</h2>
          <p>{experience.description}</p>
        </div>
        {!!experience.stats?.length && <dl className={s.stats}>{experience.stats.map(stat => <div key={stat.label}><dt>{stat.value}</dt><dd>{stat.label}</dd></div>)}</dl>}
        <div className={s.tiles}>{groups.map(group => <button type="button" key={group.id} className={s.tile} onClick={() => open(group, experience)}>
          <div className={s.tileBox}>
            <h3>{group.name}</h3>
            <p>{group.description}</p>
            <ul>{group.children!.map(child => <li key={child.id}>{child.name}</li>)}</ul>
            <span className={s.arrow} aria-hidden="true">→</span>
          </div>
        </button>)}</div>
      </section>

      {metric && <section className={s.feature} style={shade(experience)}>
        <div>
          <span className={s.eyebrow}>Featured case study</span>
          <h2>{featured.name}</h2>
          <p className={s.big}>{metric.headline}<span>{metric.change}</span></p>
          <p className={s.swap}><s>{metric.before}</s> → <b>{metric.after}</b> {metric.label.toLowerCase()}</p>
          <p>{featured.description}</p>
          <div className={s.buttons}>
            <a className={s.primary} href={`#${featured.id}`}>Read the case study</a>
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
        <div className={s.cards}>{projectList.map(item => <button type="button" key={item.id} className={s.card} onClick={() => peek(item)}>
          <AppMark item={item} />
          <h3>{item.name}</h3>
          <p>{item.description}</p>
        </button>)}</div>
      </section>

      <section id="work-with-me" className={s.section} style={shade(work)}>
        <div className={s.heading}>
          <span className={s.eyebrow}>Work with me</span>
          <h2>{plain(work.title)}</h2>
          <p>{work.description}</p>
        </div>
        {/* What I make, and how a project goes, side by side; the old closing call to action lives here now. */}
        <div className={s.hire}>
          <div className={s.offers}>
            {work.children!.filter(item => item.id !== "how-it-works").map(item => {
              // Websites and Custom tools open their windows on this page; client work goes straight to the live site.
              const href = item.id === "client-work" ? item.children?.[0]?.href : undefined;
              const note = item.id === "websites" ? `${item.children?.length} templates to start from` : item.id === "client-work" ? item.children?.map(child => child.name).join(", ") : item.highlights?.slice(0, 2).join(" / ");
              const body = <><b>{item.name}</b><small>{note}</small><span aria-hidden="true">{href ? "↗" : "→"}</span></>;
              return href ? <a key={item.id} href={href}>{body}</a> : <button key={item.id} type="button" onClick={() => open(item, work)}>{body}</button>;
            })}
          </div>
          <ol className={s.steps}>
            <span className={s.eyebrow}>How it works</span>
            {(work.children!.find(item => item.id === "how-it-works")?.highlights || []).map((step, index) => <li key={step}><i>{String(index + 1).padStart(2, "0")}</i>{step}</li>)}
          </ol>
        </div>
        <div className={`${s.buttons} ${s.hireButtons}`}>
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
          <section className={s.frame} style={bg(photo(sheet.item))}>
            {sheet.item.children ? <div className={s.detail}>
              <span className={s.eyebrow}>{sheet.section.name}</span>
              <h2>{sheet.item.name}</h2>
              <p className={s.lede}>{sheet.item.description}</p>
              <ul className={s.banners}>{sheet.item.children.map((child, index) => <li key={child.id} style={bg(photo(child))}>
                <button type="button" onClick={() => { const el = sheetBody.current; el?.scrollTo({ top: (index + 1) * el.clientHeight, behavior: "smooth" }); }}><span>{child.name}</span>{tagFor(child) && <small>{tagFor(child)}</small>}<b aria-hidden="true">↓</b></button>
                {child.template && child.href && <a href={child.href} aria-label={`Open the ${child.name} template`} title="Open the template">↗</a>}
              </li>)}</ul>
              {sheet.item.related && <div className={s.buttons}><a className={s.secondary} href={sheet.item.related.href}>{sheet.item.related.label} ↗</a></div>}
            </div> : detail(sheet.item, sheet.section)}
          </section>
          {sheet.item.children?.map(child => <section key={child.id} className={s.frame} style={bg(photo(child))}>{detail(child, sheet.section)}</section>)}
        </div>
      </div>}
    </div>

    <dialog ref={peekDialog} className={s.peek} aria-label={peeked?.name} onClose={() => setPeeked(null)} onClick={event => { if (event.target === event.currentTarget) peekDialog.current?.close(); }}>
      {peeked && <div className={s.peekInner} style={shade(projects)}>
        <header className={s.peekHead}>
          <AppMark item={peeked} />
          <div><h3>{peeked.name}</h3><span>{peeked.platform === "android" ? "Android app" : "Web tool"}{peeked.note === "In progress." || peeked.note?.includes("development") ? " · in progress" : ""}</span></div>
          <button type="button" className={s.closeBtn} aria-label="Close" onClick={() => peekDialog.current?.close()}>×</button>
        </header>
        <p className={s.peekText}>{peeked.description}</p>
        {!!peeked.highlights?.length && <ul className={s.chips}>{peeked.highlights.map(h => <li key={h}>{h}</li>)}</ul>}
        {!!shotsFor(peeked).length && <div className={s.shots} data-phone={peeked.platform === "android" || undefined}>{shotsFor(peeked).map(shot => <img key={shot.src} src={shot.src} alt={shot.alt} loading="lazy" />)}</div>}
        <div className={s.buttons}>
          {peeked.platform === "android" ? <a className={s.primary} href={peeked.href} {...(peeked.href?.startsWith("http") ? { target: "_blank", rel: "noopener" } : {})}>{peeked.action || "Take a look"}</a>
            : peeked.href?.startsWith("/work/") ? <a className={s.primary} href={peeked.href}>{peeked.action || "About the project"}</a>
            : <a className={s.primary} href={peeked.href} target="_blank" rel="noopener">Open in browser ↗</a>}
          {peeked.related && <a className={s.secondary} href={peeked.related.href}>{peeked.related.label}</a>}
          {peeked.platform === "android" && <span className={s.soon}>Coming soon to Google Play</span>}
        </div>
      </div>}
    </dialog>

    <ContactModal key={contact || "closed"} isOpen={contact !== null} onClose={() => setContact(null)} selectedTopic={contact || ""} />
  </div>;
}
