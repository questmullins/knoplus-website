"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { ContactModal } from "@/components/ContactModal";
import { SchemeToggle } from "@/components/SchemeToggle";
import { SiteMenu, menuItems } from "@/components/SiteMenu";
import { buildShowcase } from "./showcase-model";
import { serviceAccent, type ServiceItem } from "./services";
import { StoreBadges } from "./store-badges";
import { Toolkit } from "./toolkit";
import s from "./services-showcase.module.css";

export function ServicesShowcase({ projectSlug }: { projectSlug?: string }) {
  const model = useMemo(() => buildShowcase(projectSlug), [projectSlug]);
  const [selectedId, setSelectedId] = useState(model.overview.id);
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(projectSlug
    ? model.entries.find(e => e.item.id === model.overview.id)?.ancestors : []));
  const [displayId, setDisplayId] = useState(model.overview.id);
  const [crossfade, setCrossfade] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [contact, setContact] = useState<{ topic: string; template?: string } | null>(null);
  const [story, setStory] = useState<ServiceItem | null>(null);
  const storyDialog = useRef<HTMLDialogElement>(null);
  const stage = useRef<HTMLElement>(null);
  const desktopContent = useRef<HTMLDivElement>(null);
  const mobileTrack = useRef<HTMLDivElement>(null);
  const mobileSections = useRef(new Map<string, HTMLElement>());
  const mobileLock = useRef(0);
  const mobileScrollTimer = useRef<number | undefined>(undefined);
  const wheelLock = useRef(0);
  const browse = useRef<HTMLButtonElement>(null);
  const navigation = useRef<HTMLElement>(null);
  const screens = useRef<HTMLDialogElement>(null);
  const selected = model.entries.find(e => e.item.id === selectedId)?.item || model.overview;
  const displayed = model.entries.find(e => e.item.id === displayId)?.item || model.overview;
  useEffect(() => {
    if (selectedId === displayId) { setCrossfade(false); return; }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setDisplayId(selectedId); setCrossfade(false); return; }
    setCrossfade(true);
    const timer = window.setTimeout(() => { setDisplayId(selectedId); setCrossfade(false); }, 420);
    return () => window.clearTimeout(timer);
  }, [selectedId, displayId]);
  const panelIndex = model.panels.findIndex(item => item.id === selectedId);
  const mobileIndex = model.mobilePanels.findIndex(item => item.id === selectedId);
  const adjacent = (direction: number) => isMobile ? model.mobilePanels[mobileIndex + direction] : nextPanel(direction);
  const openContact = (item: ServiceItem) => setContact({ topic: model.project?.slug || item.id, template: item.template ? item.name : undefined });

  const commit = useCallback((picked: ServiceItem, history: "push" | "replace" | "none" = "push", scroll = true, closeMenu = true, toggle = false) => {
    // A project inside a group has no window of its own: show its group's window and open the project over it.
    let item = picked;
    if (!model.project && !picked.children && !model.panels.some(p => p.id === picked.id)) {
      const ancestors = model.entries.find(e => e.item.id === picked.id)?.ancestors || [];
      const holder = [...ancestors].reverse().map(id => model.panels.find(p => p.id === id)).find(Boolean);
      if (holder) { item = holder; setStory(picked); }
    } else setStory(null);
    setSelectedId(item.id);
    setExpanded(value => {
      const ancestors = model.entries.find(e => e.item.id === item.id)?.ancestors || [];
      const path = new Set([...ancestors, item.id]);
      const next = new Set(value);
      model.entries.forEach(e => { if (e.item.children && !path.has(e.item.id)) next.delete(e.item.id); });
      ancestors.forEach(id => next.add(id));
      if (item.children) {
        if (toggle && next.has(item.id)) next.delete(item.id);
        else next.add(item.id);
      }
      return next;
    });
    if (history !== "none" && window.location.hash !== `#${item.id}`) {
      window.history[history === "push" ? "pushState" : "replaceState"](null, "", `#${item.id}`);
    }
    desktopContent.current?.scrollTo({ top: 0, behavior: "instant" });
    if (scroll && window.matchMedia("(max-width: 760px)").matches) {
      mobileLock.current = performance.now() + 1600;
      window.clearTimeout(mobileScrollTimer.current);
      mobileScrollTimer.current = window.setTimeout(() => {
        // A folder has no frame of its own on the phone, so it goes to the first frame inside it.
        // A project inside a group has no window of its own on the phone: scroll to its group and open it over the top.
        const ancestors = model.entries.find(e => e.item.id === item.id)?.ancestors || [];
        const holder = [item.id, ...[...ancestors].reverse()].find(id => mobileSections.current.has(id));
        const target = holder ? mobileSections.current.get(holder) : undefined;
        window.scrollTo({ top: target ? target.getBoundingClientRect().top + window.scrollY - 56 : 0, behavior: "instant" });
      }, 0);
    }
    if (closeMenu && (!item.children || scroll && window.matchMedia("(max-width: 760px)").matches && !toggle)) {
      setMobileOpen(false);
      if (scroll && window.matchMedia("(max-width: 760px)").matches) requestAnimationFrame(() => document.getElementById(`mobile-title-${item.id}`)?.focus({ preventScroll: true }));
    }
  }, [model]);

  function select(item: ServiceItem, toggle = false) {
    if (projectSlug && item.id === projectSlug) {
      setExpanded(value => { const next = new Set(value); if (next.has(item.id)) next.delete(item.id); else next.add(item.id); return next; });
      return;
    }
    if (projectSlug && !model.panels.some(p => p.id === item.id)) {
      window.dispatchEvent(new CustomEvent("knoplus:navigate", { detail: `/#${item.id}` }));
      return;
    }
    commit(item, "push", true, true, toggle);
  }

  const nextPanel = useCallback((direction: number) => {
    const current = model.panels.findIndex(item => item.id === selectedId);
    if (current >= 0) return model.panels[current + direction];
    // An open project steps back to its group, or on to the window after it.
    const ancestors = model.entries.find(e => e.item.id === selectedId)?.ancestors || [];
    const holder = [...ancestors].reverse().map(id => model.panels.findIndex(p => p.id === id)).find(index => index >= 0);
    if (holder !== undefined) return model.panels[direction > 0 ? holder + 1 : holder];
    const descendant = model.entries.find(e => e.ancestors.includes(selectedId) && model.panels.some(p => p.id === e.item.id));
    const first = model.panels.findIndex(p => p.id === descendant?.item.id);
    return first >= 0 ? model.panels[first + (direction > 0 ? 0 : -1)] : undefined;
  }, [model, selectedId]);

  useEffect(() => {
    const element = stage.current;
    if (!element) return;
    const wheel = (event: WheelEvent) => {
      if (window.matchMedia("(max-width: 760px)").matches || mobileOpen || contact !== null || screens.current?.open ||
        event.ctrlKey || event.metaKey || Math.abs(event.deltaX) > Math.abs(event.deltaY) || Math.abs(event.deltaY) < 24) return;
      if ((event.target as Element).closest(".menu-panel")) return;
      const content = desktopContent.current;
      if (content && content.scrollHeight > content.clientHeight + 2 &&
        ((event.deltaY > 0 && content.scrollTop + content.clientHeight < content.scrollHeight - 3) || (event.deltaY < 0 && content.scrollTop > 3))) return;
      event.preventDefault();
      if (performance.now() < wheelLock.current) return;
      const next = nextPanel(Math.sign(event.deltaY));
      if (next) { wheelLock.current = performance.now() + 650; commit(next, "replace"); }
    };
    element.addEventListener("wheel", wheel, { passive: false });
    return () => element.removeEventListener("wheel", wheel);
  }, [commit, contact, mobileOpen, nextPanel]);

  useEffect(() => {
    const fromHash = () => {
      const id = window.location.hash.slice(1);
      const item = model.entries.find(e => e.item.id === id)?.item || (id === "work" ? model.overview : undefined);
      if (!item || (projectSlug && !model.panels.some(p => p.id === item.id))) return;
      commit(item, "none");
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    window.addEventListener("popstate", fromHash);
    return () => { window.removeEventListener("hashchange", fromHash); window.removeEventListener("popstate", fromHash); };
  }, [commit, model, projectSlug]);

  useEffect(() => {
    const track = mobileTrack.current;
    if (!track) return;
    const visible = new Map<string, number>();
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => { visible.set((entry.target as HTMLElement).dataset.panel!, entry.isIntersecting ? entry.intersectionRatio : 0); });
      if (!window.matchMedia("(max-width: 760px)").matches || mobileOpen || performance.now() < mobileLock.current) return;
      const best = [...visible].sort((a, b) => b[1] - a[1])[0];
      if (best && best[1] > .4) {
        const item = model.mobilePanels.find(p => p.id === best[0]);
        if (item) commit(item, "replace", false, false);
      }
    }, { root: null, threshold: [.2, .45, .65, .85] });
    mobileSections.current.forEach(section => observer.observe(section));
    return () => observer.disconnect();
  }, [commit, mobileOpen, model]);

  useEffect(() => {
    document.body.classList.add("revamp-showcase");
    const viewport = window.matchMedia("(max-width: 760px)");
    setIsMobile(viewport.matches);
    const resize = () => {
      setIsMobile(viewport.matches);
      if (!viewport.matches) setMobileOpen(false);
      else {
        mobileLock.current = performance.now() + 500;
        requestAnimationFrame(() => {
          const target = mobileSections.current.get(selectedId);
          if (target) window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - 92, behavior: "instant" });
        });
      }
    };
    viewport.addEventListener("change", resize);
    return () => { viewport.removeEventListener("change", resize); document.body.classList.remove("revamp-showcase"); };
  }, [selectedId]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const nav = navigation.current;
      const current = nav?.querySelector<HTMLElement>('[aria-current="true"]');
      if (!nav?.clientHeight || !current) return;
      const bounds = nav.getBoundingClientRect();
      const row = current.getBoundingClientRect();
      const delta = row.top < bounds.top ? row.top - bounds.top : row.bottom > bounds.bottom ? row.bottom - bounds.bottom : 0;
      if (delta) nav.scrollTo({ top: nav.scrollTop + delta, behavior: "auto" });
    });
    return () => cancelAnimationFrame(frame);
  }, [selectedId, mobileOpen]);

  useEffect(() => {
    if (!mobileOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") { setMobileOpen(false); browse.current?.focus(); } };
    window.addEventListener("keydown", close);
    return () => { window.removeEventListener("keydown", close); document.body.style.overflow = previous; };
  }, [mobileOpen]);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      if (!window.matchMedia("(max-width: 760px)").matches || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      mobileSections.current.forEach(section => {
        const progress = (section.getBoundingClientRect().top - window.innerHeight / 2) / window.innerHeight;
        // Set on the photo layer, not the section: a change on the section restyles and repaints the title every frame.
        section.querySelector<HTMLElement>(`.${s.background}`)?.style.setProperty("--parallax-y", `${Math.max(-34, Math.min(34, progress * -42))}px`);
      });
    };
    const scroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    update(); window.addEventListener("scroll", scroll, { passive: true });
    return () => { window.removeEventListener("scroll", scroll); cancelAnimationFrame(frame); };
  }, []);

  // The menu lists only places you can go: the sections and their windows. Projects inside a group are reached from
  // the group window's buttons, so they are not listed here (a project's own page still lists its panes).
  function rows(items: ServiceItem[], depth = 0) {
    const ancestors = model.entries.find(e => e.item.id === selectedId)?.ancestors || [];
    const listed = (item: ServiceItem) => !!model.project || model.panels.some(p => p.id === item.id) || !!item.children?.some(child => model.panels.some(p => p.id === child.id));
    const folder = (item: ServiceItem) => !!item.children?.some(listed);
    return <ul className={s.rows}>{items.filter(item => depth === 0 || listed(item)).map(item => <li key={item.id}>
      <button type="button" className={`template-btn ${s.row} ${expanded.has(item.id) && folder(item) ? s.open : ""} ${selectedId === item.id ? s.current : ""} ${ancestors.includes(item.id) ? s.inPath : ""}`}
        style={{ "--depth": depth, "--item-accent": serviceAccent(item) } as CSSProperties} data-depth={depth} aria-expanded={folder(item) ? expanded.has(item.id) : undefined}
        aria-controls={folder(item) ? `folder-${item.id}` : undefined} aria-current={selectedId === item.id ? "true" : undefined} onClick={() => select(item, folder(item))}>
        <span>{item.name}</span>{folder(item) && <span className={`plus ${expanded.has(item.id) ? "is-open" : ""}`} aria-hidden="true" />}
      </button>
      {folder(item) && <div id={`folder-${item.id}`} className={`${s.folder} ${expanded.has(item.id) ? s.folderOpen : ""}`} inert={!expanded.has(item.id)} aria-hidden={!expanded.has(item.id)}><div className={s.folderInner}>{rows(item.children!, depth + 1)}</div></div>}
    </li>)}</ul>;
  }

  function statList(item: ServiceItem) {
    return !!item.stats?.length && <dl className={s.stats}>{item.stats.map(stat => <div key={stat.label}><dt>{stat.value}</dt><dd>{stat.label}</dd></div>)}</dl>;
  }

  function results(item: ServiceItem) {
    return !!item.metrics?.length && <div className={s.metrics}><span>Results</span><div className={s.charts}>{item.metrics.map(metric => <figure className={s.result} key={metric.label}>
      <figcaption>{metric.label}</figcaption>
      {metric.headline && <p className={s.headline}>{metric.headline}<span>{metric.change}</span></p>}
      <p className={s.swap}><s>{metric.before}</s><b>{metric.after}</b></p>
      {!metric.headline && <span className={s.chip}>{metric.change}</span>}
    </figure>)}</div></div>;
  }

  // A group (Automation, Apps, Websites…) is one window listing its projects as thin banners, like Annex.
  // A project opens from its banner: in the main stage on desktop, over the window on a phone.
  function tag(item: ServiceItem) {
    const metric = item.metrics?.find(m => m.headline);
    return metric ? `${metric.headline} ${metric.change}` : item.platform === "android" ? "Android" : item.template ? "Template" : item.note === "In progress." ? "In progress" : "";
  }

  function openProject(item: ServiceItem) {
    setStory(item);
    window.history.replaceState(null, "", `#${item.id}`);
  }

  function banners(item: ServiceItem) {
    return <ul className={s.banners}>{item.children!.map(child => <li key={child.id}>
      <button type="button" className={s.banner} onClick={() => openProject(child)} style={{ "--item-accent": serviceAccent(child) } as CSSProperties}>
        <span className={s.bannerName}>{child.name}</span>
        {tag(child) && <span className={s.bannerTag}>{tag(child)}</span>}
      </button>
    </li>)}</ul>;
  }

  function panelCopy(item: ServiceItem, mobile = false, index = 0, full = false) {
    const depth = model.entries.find(e => e.item.id === item.id)?.ancestors.length || 0;
    const group = !model.project && !full && !!item.children && depth > 0;
    const Heading = full || (mobile && index > 0) ? "h2" : "h1";
    const next = model.panels[model.panels.findIndex(p => p.id === item.id) + 1];
    return <div className={`copy ${s.copy}`} style={{ "--panel-accent": serviceAccent(item) } as CSSProperties}><div className={`copy-anchor ${s.anchor}`}>
      {/* The eyebrow and title fade and slide with the rest of the copy, so a section changes as one piece. */}
      <div className={s.changingDetails}>
      <div className={`eyebrow ${s.eyebrow}`}>{item.label}</div>
      {item.doors && item.title ? <Heading id={full ? undefined : mobile ? `mobile-title-${item.id}` : "project-title"} tabIndex={-1} className={`${s.title} ${s.headlineTitle}`} dangerouslySetInnerHTML={{ __html: item.title }} />
        : <Heading id={full ? undefined : mobile ? `mobile-title-${item.id}` : "project-title"} tabIndex={-1} className={s.title}>{model.project?.name || item.name}</Heading>}
      {model.project && <h2 className={s.paneTitle}>{item.titleText || item.name}</h2>}
      <p className={s.description}>{item.description}</p>
      {group && banners(item)}
      {group && item.related && <Link className={s.groupLink} href={item.related.href}>{item.related.label} →</Link>}
      {item.platform === "android" && <StoreBadges />}
      {!group && <div className={`actions template-actions ${s.actions}`}>
        {item.doors ? item.doors.map(door => {
          const target = model.entries.find(e => e.item.id === door.id)?.item;
          return target && <button key={door.id} className={`cta-button ${door.primary ? "explore-button" : "inquire-button"}`} type="button" onClick={() => select(target)}>{door.label}</button>;
        })
        : item.href?.startsWith("mailto:") ? <button className="cta-button explore-button" type="button" onClick={() => openContact(item)}>{item.action || "Let’s talk"}</button>
          : item.href ? <Link className="cta-button explore-button" href={item.href}>{item.action || "Explore"}</Link>
          : model.project ? next ? <button className="cta-button explore-button" onClick={() => commit(next)} type="button">Keep exploring</button> : <button className="cta-button explore-button" type="button" onClick={() => openContact(item)}>Let’s talk</button>
            : item.children?.length || item.id === "work" ? <button className="cta-button explore-button" type="button" onClick={() => {
              select(item.children?.[0] || model.navigation[0]);
              if (window.matchMedia("(max-width: 760px)").matches) setMobileOpen(false);
            }}>{item.id === "websites" ? "Explore websites" : item.id === "experience" ? "Explore the work" : item.id === "work-with-me" ? "See what I offer" : "Take a look"}</button>
              : <button className="cta-button explore-button" type="button" onClick={() => openContact(item)}>Let’s talk</button>}
        {item.related && <Link className="cta-button inquire-button" href={item.related.href}>{item.related.label}</Link>}
        {!!item.photos?.length && <button className="cta-button inquire-button" type="button" onClick={() => { commit(item, "none", false, false); screens.current?.showModal(); }}>View {item.platform ? "app screens" : "screens"}</button>}
        {item.template && <button className="cta-button inquire-button" type="button" onClick={() => openContact(item)}>Inquire</button>}
        {item.hire && <button className="cta-button inquire-button" type="button" onClick={() => {
          const hire = model.entries.find(e => e.item.id === "work-with-me")?.item;
          if (hire) select(hire);
        }}>Want something like this?</button>}
        {item.tools && !full && <button className="cta-button inquire-button" type="button" onClick={() => setStory(item)}>See all the tools</button>}
      </div>}
      {(depth === 0 || full) && statList(item)}
      {!group && depth > 0 && !!item.highlights?.length && <div className={s.details}><div><span>{item.highlightsLabel || "Features"}</span><p>{item.highlights.join(" / ")}</p></div>{!!item.sellingPoints?.length && <div><span>{item.sellingPointsLabel || "Made for"}</span><p>{item.sellingPoints.join(" / ")}</p></div>}</div>}
      {full && item.tools && <Toolkit groups={item.tools} />}
      {!group && depth > 0 && item.note && <p className={s.note}>{item.note}</p>}
      {!group && results(item)}
      </div>
    </div></div>;
  }

  function mobilePanel(item: ServiceItem, index = 1) {
    return <section className={s.mobilePanel} key={item.id} data-panel={item.id} data-theme={item.theme || "service"} data-experience={item.id.startsWith("experience") || undefined} data-break={model.navigation.some(top => top.id === item.id) || undefined} aria-label={item.name}
      ref={node => { if (node) mobileSections.current.set(item.id,node); else mobileSections.current.delete(item.id); }}>
      <div className={`preview-bg ${s.background}`} style={{ "--bg": item.image } as CSSProperties} />{panelCopy(item,true,index)}
    </section>;
  }

  useEffect(() => () => window.clearTimeout(mobileScrollTimer.current), []);

  useEffect(() => {
    const dialog = storyDialog.current;
    if (story && dialog && !dialog.open) dialog.showModal();
    if (!story && dialog?.open) dialog.close();
  }, [story]);

  // "Choose This Template" on a website template returns here with ?contact=template.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("contact") !== "template") return;
    let template = "";
    try { template = window.sessionStorage.getItem("knoplus:selected-template") || ""; window.sessionStorage.removeItem("knoplus:selected-template"); } catch {}
    setContact({ topic: "websites", template: template || undefined });
    window.history.replaceState(null, "", window.location.pathname + window.location.hash);
  }, []);

  const logo = <Link href="/#work" className="brand brand-logo-link" aria-label="Kno.plus home">KNOPLUS</Link>;
  return <>
    <div className={`app ${s.shell}`}>
      <a href="#service-stage" className={s.skip}>Skip to project preview</a>
      <header className={`mobile-scroll-header ${s.mobileBar}`}>{logo}<SchemeToggle className={s.mobileScheme} /><button ref={browse} type="button" aria-expanded={mobileOpen} aria-controls="service-navigation" onClick={() => setMobileOpen(v => !v)}>{mobileOpen ? "Close" : "Menu"}<span aria-hidden="true">{mobileOpen ? "×" : "+"}</span></button></header>
      {!model.project && selected.id !== model.overview.id && <WhereBar entries={model.entries} panels={model.panels} selected={selected} />}
      <aside inert={isMobile && !mobileOpen} className={`${s.sidebar} ${mobileOpen ? s.mobileOpen : ""}`}>
        <div className={`sidebar-brand ${s.desktopBrand}`}>{logo}</div>
        <nav ref={navigation} id="service-navigation" className={`template-nav ${s.navigation}`} aria-label="Menu, experience, projects and work with me">
          {/* Phone only: the site menu sits above the services, since the desktop Menu button is hidden on phones. */}
          <div className={s.siteLinks}>
            <span className={`nav-label ${s.navLabel}`}>Menu</span>
            <ul>
              {menuItems.map(item => <li key={item.href}><Link href={item.href} prefetch={false} onClick={event => {
                if (item.href === "/" && !projectSlug) { event.preventDefault(); commit(model.overview); setMobileOpen(false); }
              }}>{item.label}</Link></li>)}
              <li><button type="button" onClick={() => { setMobileOpen(false); openContact(selected); }}>Contact Us</button></li>
            </ul>
          </div>
          <Link className={`nav-label ${s.navLabel}`} href="/#work">Explore</Link>{rows(model.navigation)}
        </nav>
        <div className={`sidebar-note cta-note ${s.sidebarNote}`}><div className="cta-copy">Know More.<br />Know Better.<br />Knoplus.</div><button type="button" onClick={() => openContact(selected)} className="cta-button">Let’s talk</button><Link href="/clients/" prefetch={false} className={s.clientLink}>Already a client?<br /><strong>Client sign-in ↗</strong></Link></div>
      </aside>
      <main ref={stage} id="service-stage" tabIndex={0} className={`stage ${s.stage}`} data-theme={selected.theme || "service"} data-experience={selected.id.startsWith("experience") || undefined} inert={mobileOpen} onKeyDown={event => {
        if (window.matchMedia("(max-width: 760px)").matches || (event.target as Element).closest("button,a,input,select,textarea")) return;
        const direction = ["ArrowDown", "PageDown", "ArrowRight"].includes(event.key) ? 1 : ["ArrowUp", "PageUp", "ArrowLeft"].includes(event.key) ? -1 : 0;
        const target = event.key === "Home" ? model.panels[0] : event.key === "End" ? model.panels.at(-1) : direction ? nextPanel(direction) : undefined;
        if (target) { event.preventDefault(); commit(target, "replace"); }
      }}>
        <SiteMenu className={`stage-menu-control ${s.siteMenu}`} hideIcon showLabel onContact={() => openContact(selected)} onNavigate={href => window.dispatchEvent(new CustomEvent("knoplus:navigate", { detail: href }))} />
        <div className={`preview-bg ${s.background} ${s.desktopBackground}`} style={{ "--bg": displayed.image } as CSSProperties} />
        <div className={`preview-bg-next ${s.background} ${s.desktopBackground} ${crossfade ? "show" : ""}`} style={{ "--bg": selected.image } as CSSProperties} />
        <div ref={desktopContent} className={`content ${s.content} ${s.desktopContent} ${crossfade ? s.fading : ""}`}>{panelCopy(displayed)}</div>
        <div className={s.mobileTrack} ref={mobileTrack} aria-label={model.project ? `${model.project.name} story` : "Experience, projects and work with me"}>
          {model.mobilePanels.map((item,index) => mobilePanel(item,index))}
        </div>
        <div className={s.stageFooter}>
          <span className={s.scrollHint}>Scroll to explore</span>
          <div className={s.paging}>
            <button aria-label="Previous preview" type="button" disabled={!adjacent(-1)} onClick={() => { const next = adjacent(-1); if (next) commit(next, "replace"); }}>←</button>
            <span aria-live="polite" aria-atomic="true"><span className={s.desktopCounter}>{panelIndex >= 0 ? `${String(panelIndex + 1).padStart(2, "0")} / ${String(model.panels.length).padStart(2, "0")}` : selected.name}</span><span className={s.mobileCounter}>{String(mobileIndex + 1).padStart(2, "0")} / {String(model.mobilePanels.length).padStart(2, "0")}</span></span>
            <button aria-label="Next preview" type="button" disabled={!adjacent(1)} onClick={() => { const next = adjacent(1); if (next) commit(next, "replace"); }}>→</button>
          </div>
        </div>
      </main>
    </div>
    <dialog ref={screens} className={s.screenDialog} aria-labelledby="screens-heading" onClick={event => { if (event.target === event.currentTarget) screens.current?.close(); }}>
      <header><h2 id="screens-heading">{model.project?.name} / {selected.name}</h2><button type="button" aria-label="Close screens" onClick={() => screens.current?.close()}>×</button></header>
      <div>{selected.photos?.map(photo => <Image key={photo.src} src={photo.src} width={photo.width} height={photo.height} alt={photo.alt} unoptimized />)}</div>
    </dialog>
    <dialog ref={storyDialog} className={`${s.screenDialog} ${s.storyDialog}`} aria-label={story?.name} onClose={() => { setStory(null); if (window.location.hash !== `#${selectedId}`) window.history.replaceState(null, "", `#${selectedId}`); }} onClick={event => { if (event.target === event.currentTarget) storyDialog.current?.close(); }}>
      <header><h2>{story?.label}</h2><button type="button" aria-label="Close" onClick={() => storyDialog.current?.close()}>×</button></header>
      {story && <div className={s.storyBody}>{panelCopy(story, true, 1, true)}</div>}
    </dialog>
    <ContactModal key={contact ? `${contact.topic}:${contact.template || ""}` : "closed"} isOpen={contact !== null} onClose={() => setContact(null)} selectedTemplate={contact?.template || ""} selectedTopic={contact?.topic || ""} />
  </>;
}

// Phone only: a slim bar under the logo that says where you are, with an icon for the part of the site you are in.
const whereIcons: Record<string, string> = {
  experience: "M4 8h16v11H4zM9 8V5h6v3M4 13h16",
  "experience--automation": "M12 4a8 8 0 1 1-7.4 5M4 4v5h5",
  "experience--tools": "M5 4l6 15 2-6 6-2z",
  "experience--builds": "M4 8l8-4 8 4v8l-8 4-8-4zM4 8l8 4 8-4M12 12v8",
  "experience--toolkit": "M4 6h16M4 12h16M4 18h10",
  projects: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
  apps: "M8 3h8v18H8zM11 18h2",
  tools: "M14 4a4 4 0 0 0 5 5l-9 9a2 2 0 0 1-3-3l9-9a4 4 0 0 0-2-2z",
  "work-with-me": "M4 5h16v11H9l-5 4z",
  websites: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18",
  "client-work": "M12 4l2.5 5 5.5.8-4 3.9 1 5.5-5-2.7-5 2.7 1-5.5-4-3.9 5.5-.8z",
  "process-automation": "M12 4a8 8 0 1 1-7.4 5M4 4v5h5",
  "how-it-works": "M5 6h14M5 12h14M5 18h9",
};

function WhereBar({ entries, panels, selected }: { entries: { item: ServiceItem; ancestors: string[] }[]; panels: ServiceItem[]; selected: ServiceItem }) {
  const ancestors = entries.find(e => e.item.id === selected.id)?.ancestors || [];
  const trail = [...ancestors.map(id => entries.find(e => e.item.id === id)?.item).filter(Boolean) as ServiceItem[], ...(ancestors.length ? [] : [selected])];
  const parent = ancestors.at(-1);
  const siblings = parent ? entries.filter(e => e.ancestors.at(-1) === parent && panels.some(p => p.id === e.item.id)) : [];
  const position = siblings.findIndex(e => e.item.id === selected.id);
  const iconId = [selected.id, ...[...ancestors].reverse()].find(id => whereIcons[id]) || "";
  return <div className={s.whereBar} aria-live="polite">
    {iconId && <svg key={iconId} className={s.whereIcon} viewBox="0 0 24 24" aria-hidden="true"><path d={whereIcons[iconId]} /></svg>}
    <span className={s.whereTrail}>{trail.map(item => item.name).join(" › ")}</span>
    {siblings.length > 1 && position >= 0 && <span className={s.whereCount}>{position + 1} of {siblings.length}</span>}
  </div>;
}
