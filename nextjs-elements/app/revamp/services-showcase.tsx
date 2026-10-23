"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { ContactModal } from "@/components/ContactModal";
import { SiteMenu } from "@/components/SiteMenu";
import { buildShowcase } from "./showcase-model";
import type { ServiceItem } from "./services";
import { StoreBadges } from "./store-badges";
import s from "./services-showcase.module.css";

export function ServicesShowcase({ projectSlug }: { projectSlug?: string }) {
  const model = useMemo(() => buildShowcase(projectSlug), [projectSlug]);
  const [selectedId, setSelectedId] = useState(model.overview.id);
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(projectSlug
    ? model.entries.find(e => e.item.id === model.overview.id)?.ancestors : ["web-services"]));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [contactTemplate, setContactTemplate] = useState<string | null>(null);
  const stage = useRef<HTMLElement>(null);
  const desktopContent = useRef<HTMLDivElement>(null);
  const mobileTrack = useRef<HTMLDivElement>(null);
  const mobileSections = useRef(new Map<string, HTMLElement>());
  const mobileLock = useRef(0);
  const wheelLock = useRef(0);
  const browse = useRef<HTMLButtonElement>(null);
  const navigation = useRef<HTMLElement>(null);
  const screens = useRef<HTMLDialogElement>(null);
  const selected = model.entries.find(e => e.item.id === selectedId)?.item || model.overview;
  const panelIndex = model.panels.findIndex(item => item.id === selectedId);
  const mobileIndex = model.mobilePanels.findIndex(item => item.id === selectedId);
  const adjacent = (direction: number) => isMobile ? model.mobilePanels[mobileIndex + direction] : nextPanel(direction);
  const contactFor = (item: ServiceItem) => `mailto:info@kno.plus?subject=${encodeURIComponent(`Let's talk — ${item.id === "work" ? "Kno.plus" : model.project?.name || item.name}`)}`;

  const commit = useCallback((item: ServiceItem, history: "push" | "replace" | "none" = "push", scroll = true, closeMenu = true, toggle = false) => {
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
      mobileLock.current = performance.now() + 900;
      const target = mobileSections.current.get(item.id);
      if (target) mobileTrack.current?.scrollTo({ top: target.offsetTop, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    }
    if (closeMenu && !item.children) {
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
      window.location.assign(`/revamp#${item.id}`);
      return;
    }
    commit(item, "push", true, true, toggle);
  }

  const nextPanel = useCallback((direction: number) => {
    const current = model.panels.findIndex(item => item.id === selectedId);
    if (current >= 0) return model.panels[current + direction];
    const descendant = model.entries.find(e => e.ancestors.includes(selectedId) && model.panels.some(p => p.id === e.item.id));
    const first = model.panels.findIndex(p => p.id === descendant?.item.id);
    return first >= 0 ? model.panels[first + (direction > 0 ? 0 : -1)] : undefined;
  }, [model, selectedId]);

  useEffect(() => {
    const element = stage.current;
    if (!element) return;
    const wheel = (event: WheelEvent) => {
      if (window.matchMedia("(max-width: 760px)").matches || mobileOpen || contactTemplate !== null || screens.current?.open ||
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
  }, [commit, contactTemplate, mobileOpen, nextPanel]);

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
    }, { root: track, threshold: [.2, .45, .65, .85] });
    mobileSections.current.forEach(section => observer.observe(section));
    return () => observer.disconnect();
  }, [commit, mobileOpen, model]);

  useEffect(() => {
    const viewport = window.matchMedia("(max-width: 760px)");
    setIsMobile(viewport.matches);
    const resize = () => {
      setIsMobile(viewport.matches);
      if (!viewport.matches) setMobileOpen(false);
      else {
        mobileLock.current = performance.now() + 500;
        requestAnimationFrame(() => {
          const target = mobileSections.current.get(selectedId);
          if (target) mobileTrack.current?.scrollTo({ top: target.offsetTop, behavior: "instant" });
        });
      }
    };
    viewport.addEventListener("change", resize);
    return () => viewport.removeEventListener("change", resize);
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
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") { setMobileOpen(false); browse.current?.focus(); } };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [mobileOpen]);

  function rows(items: ServiceItem[], depth = 0) {
    const ancestors = model.entries.find(e => e.item.id === selectedId)?.ancestors || [];
    return <ul className={s.rows}>{items.map(item => <li key={item.id}>
      <button type="button" className={`template-btn ${s.row} ${expanded.has(item.id) && item.children ? s.open : ""} ${selectedId === item.id ? s.current : ""} ${ancestors.includes(item.id) ? s.inPath : ""}`}
        style={{ "--depth": depth } as CSSProperties} data-depth={depth} aria-expanded={item.children ? expanded.has(item.id) : undefined}
        aria-controls={item.children ? `folder-${item.id}` : undefined} aria-current={selectedId === item.id ? "true" : undefined} onClick={() => select(item, true)}>
        <span>{item.name}</span>{item.children ? <span className="plus" aria-hidden="true" /> : <span className={s.itemArrow} aria-hidden="true">↗</span>}
      </button>
      {item.children && <div id={`folder-${item.id}`} hidden={!expanded.has(item.id)}>{rows(item.children, depth + 1)}</div>}
    </li>)}</ul>;
  }

  function panelCopy(item: ServiceItem, mobile = false, index = 0) {
    const Heading = mobile && index > 0 ? "h2" : "h1";
    const next = model.panels[model.panels.findIndex(p => p.id === item.id) + 1];
    return <div className={`copy ${s.copy}`} key={item.id}><div className={`copy-anchor ${s.anchor}`}>
      <div className={`eyebrow ${s.eyebrow}`}>{item.label}</div>
      <Heading id={mobile ? `mobile-title-${item.id}` : "project-title"} tabIndex={-1} className={s.title}>{item.titleText || (item.title ? <span dangerouslySetInnerHTML={{ __html: item.title }} /> : item.name)}</Heading>
      <p className={s.description}>{item.description}</p>
      {item.platform === "android" && <StoreBadges />}
      <div className={`actions template-actions ${s.actions}`}>
        {item.href ? <Link className="cta-button explore-button" href={item.href}>{item.action || "Explore"}</Link>
          : model.project ? next ? <button className="cta-button explore-button" onClick={() => commit(next)} type="button">Keep exploring</button> : <a className="cta-button explore-button" href={contactFor(item)}>Let’s talk</a>
            : item.children || item.id === "work" ? <button className="cta-button explore-button" type="button" onClick={() => {
              select(item.children?.[0] || model.navigation[0]);
              if (window.matchMedia("(max-width: 760px)").matches) setMobileOpen(true);
            }}>{item.id === "work" ? "Explore Services" : item.id === "websites" ? "Explore Websites" : "Explore the folder"}</button>
              : <a className="cta-button explore-button" href={contactFor(item)}>Let’s talk</a>}
        {item.related && <Link className="cta-button inquire-button" href={item.related.href}>{item.related.label}</Link>}
        {!!item.photos?.length && <button className="cta-button inquire-button" type="button" onClick={() => { commit(item, "none", false, false); screens.current?.showModal(); }}>View {item.platform ? "app screens" : "screens"}</button>}
        {item.template && <button className="cta-button inquire-button" type="button" onClick={() => setContactTemplate(item.name)}>Inquire</button>}
      </div>
      {item.highlights && <div className={s.highlights}>{item.highlights.map(text => <span key={text}>{text}</span>)}</div>}
      {item.note && <p className={s.note}>{item.note}</p>}
    </div></div>;
  }

  const logo = <Link href="/revamp#work" className="brand brand-logo-link" aria-label="Kno.plus services home">KNOPLUS</Link>;
  return <>
    <div className={`app ${s.shell}`}>
      <a href="#service-stage" className={s.skip}>Skip to project preview</a>
      <header className={s.mobileBar}>{logo}<button ref={browse} type="button" aria-expanded={mobileOpen} aria-controls="service-navigation" onClick={() => setMobileOpen(v => !v)}>{mobileOpen ? "Close" : "Browse services"}<span aria-hidden="true">{mobileOpen ? "×" : "+"}</span></button></header>
      <aside className={`${s.sidebar} ${mobileOpen ? s.mobileOpen : ""}`}>
        <div className={`sidebar-brand ${s.desktopBrand}`}>{logo}</div>
        <nav ref={navigation} id="service-navigation" className={`template-nav ${s.navigation}`} aria-label="Services and projects">
          <Link className={`nav-label ${s.navLabel}`} href="/revamp#work">Services</Link>{rows(model.navigation)}
        </nav>
        <div className={`sidebar-note cta-note ${s.sidebarNote}`}><div className="cta-copy">Know More.<br />Know Better.<br />Knoplus.</div><a href={contactFor(selected)} className="cta-button">Let’s talk</a><Link href="/" className={s.mainSite}>Main website ↗</Link></div>
      </aside>
      <main ref={stage} id="service-stage" tabIndex={0} className={`stage ${s.stage}`} data-theme={selected.theme || "service"} inert={mobileOpen} onKeyDown={event => {
        if (window.matchMedia("(max-width: 760px)").matches || (event.target as Element).closest("button,a,input,select,textarea")) return;
        const direction = ["ArrowDown", "PageDown", "ArrowRight"].includes(event.key) ? 1 : ["ArrowUp", "PageUp", "ArrowLeft"].includes(event.key) ? -1 : 0;
        const target = event.key === "Home" ? model.panels[0] : event.key === "End" ? model.panels.at(-1) : direction ? nextPanel(direction) : undefined;
        if (target) { event.preventDefault(); commit(target, "replace"); }
      }}>
        <SiteMenu className={`stage-menu-control ${s.siteMenu}`} hideIcon showLabel onNavigate={href => window.location.assign(href === "/" ? "/revamp" : href)} />
        <div key={selected.image} className={`preview-bg ${s.background} ${s.desktopBackground}`} style={{ "--bg": selected.image } as CSSProperties} />
        <div ref={desktopContent} className={`content ${s.content} ${s.desktopContent}`}>{panelCopy(selected)}</div>
        <div className={s.mobileTrack} ref={mobileTrack} aria-label={model.project ? `${model.project.name} story` : "Services and project previews"}>
          {model.mobilePanels.map((item, index) => <section className={s.mobilePanel} key={item.id} data-panel={item.id} aria-label={item.name}
            ref={node => { if (node) mobileSections.current.set(item.id, node); else mobileSections.current.delete(item.id); }}>
            <div className={`preview-bg ${s.background}`} style={{ "--bg": item.image } as CSSProperties} />{panelCopy(item, true, index)}
          </section>)}
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
    <ContactModal key={contactTemplate || "closed"} isOpen={contactTemplate !== null} onClose={() => setContactTemplate(null)} selectedTemplate={contactTemplate || ""} />
  </>;
}
