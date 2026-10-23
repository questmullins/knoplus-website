"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { ContactModal } from "@/components/ContactModal";
import { SiteMenu } from "@/components/SiteMenu";
import { findService, serviceEntries, serviceOverview, services, type ServiceItem } from "./services";
import s from "./services-showcase.module.css";

export function ServicesShowcase({ initialId = "work" }: { initialId?: string }) {
  const initial = findService(initialId) || serviceOverview;
  const [selectedId, setSelectedId] = useState(initial.id);
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(initial.id === "work" ? ["web-services"] : serviceEntries.find(entry => entry.item.id === initial.id)?.ancestors || []));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [contactTemplate, setContactTemplate] = useState<string | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const browse = useRef<HTMLButtonElement>(null);
  const selected = findService(selectedId) || serviceOverview;
  const selectedEntry = serviceEntries.find(entry => entry.item.id === selectedId);
  const currentRoot = selectedEntry?.ancestors[0] || selected.id;
  const contact = `mailto:info@kno.plus?subject=${encodeURIComponent(`Let's talk — ${selected.id === "work" ? "Kno.plus" : selected.name}`)}`;

  useEffect(() => {
    const viewport = window.matchMedia("(max-width: 760px)");
    const resize = () => { if (!viewport.matches) setMobileOpen(false); };
    viewport.addEventListener("change", resize);
    return () => viewport.removeEventListener("change", resize);
  }, []);
  useEffect(() => {
    function fromHash() {
      const id = window.location.hash.slice(1);
      const item = findService(id);
      if (!item) return;
      setSelectedId(item.id);
      const ancestors = serviceEntries.find(entry => entry.item.id === item.id)?.ancestors || [];
      setExpanded(value => {
        const next = new Set([...value, ...ancestors, ...(item.children ? [item.id] : [])]);
        const path = new Set([...ancestors, item.id]);
        serviceEntries.forEach(entry => { if (entry.item.children && !path.has(entry.item.id)) next.delete(entry.item.id); });
        return next;
      });
    }
    fromHash();
    window.addEventListener("hashchange", fromHash);
    window.addEventListener("popstate", fromHash);
    return () => {
      window.removeEventListener("hashchange", fromHash);
      window.removeEventListener("popstate", fromHash);
    };
  }, []);
  useEffect(() => {
    if (!mobileOpen) return;
    function close(event: KeyboardEvent) {
      if (event.key === "Escape") { setMobileOpen(false); browse.current?.focus(); }
    }
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [mobileOpen]);

  function select(item: ServiceItem, toggle = false) {
    if (initialId !== "work" && item.id !== initialId) {
      window.location.assign(`/revamp#${item.id}`);
      return;
    }
    setSelectedId(item.id);
    setExpanded(value => {
      const next = new Set(value);
      const ancestors = serviceEntries.find(entry => entry.item.id === item.id)?.ancestors || [];
      const path = new Set([...ancestors, item.id]);
      serviceEntries.forEach(entry => { if (entry.item.children && !path.has(entry.item.id)) next.delete(entry.item.id); });
      ancestors.forEach(id => next.add(id));
      if (item.children) {
        if (toggle && next.has(item.id)) next.delete(item.id);
        else next.add(item.id);
      }
      return next;
    });
    window.history.pushState(null, "", `#${item.id}`);
    if (!item.children) {
      setMobileOpen(false);
      if (window.matchMedia("(max-width: 760px)").matches) requestAnimationFrame(() => heading.current?.focus({ preventScroll: true }));
    }
  }

  function folderRows(items: ServiceItem[], depth = 0) {
    return <ul className={s.rows}>{items.map(item => {
      const isOpen = expanded.has(item.id);
      const isCurrent = selectedId === item.id;
      const inPath = selectedEntry?.ancestors.includes(item.id);
      return <li key={item.id}>
        <button type="button" className={`template-btn ${s.row} ${isOpen && item.children ? s.open : ""} ${isCurrent ? s.current : ""} ${inPath ? s.inPath : ""}`}
          style={{ "--depth": depth } as CSSProperties} data-depth={depth}
          aria-expanded={item.children ? isOpen : undefined} aria-controls={item.children ? `folder-${item.id}` : undefined}
          aria-current={isCurrent ? "true" : undefined} onClick={() => select(item, true)}>
          <span>{item.name}</span>{item.children ? <span className="plus" aria-hidden="true" /> : <span className={s.itemArrow} aria-hidden="true">↗</span>}
        </button>
        {item.children && <div id={`folder-${item.id}`} hidden={!isOpen}>{folderRows(item.children, depth + 1)}</div>}
      </li>;
    })}</ul>;
  }

  function logo() {
    return <Link href="/revamp#work" className="brand brand-logo-link" aria-label="Kno.plus services home" onClick={() => { setSelectedId("work"); setMobileOpen(false); }}>KNOPLUS</Link>;
  }

  return <>
    <div className={`app ${s.shell}`}>
      <a href="#service-stage" className={s.skip}>Skip to project preview</a>
      <header className={s.mobileBar}>{logo()}<button ref={browse} type="button" aria-expanded={mobileOpen} aria-controls="service-navigation" onClick={() => setMobileOpen(value => !value)}>{mobileOpen ? "Close" : "Browse services"}<span aria-hidden="true">{mobileOpen ? "×" : "+"}</span></button></header>
      <aside className={`${s.sidebar} ${mobileOpen ? s.mobileOpen : ""}`}>
        <div className={`sidebar-brand ${s.desktopBrand}`}>{logo()}</div>
        <nav id="service-navigation" className={`template-nav ${s.navigation}`} aria-label="Services and projects">
          <button className={`nav-label ${s.navLabel}`} onClick={() => select(serviceOverview)} type="button">Services</button>
          {folderRows(services)}
        </nav>
        <div className={`sidebar-note cta-note ${s.sidebarNote}`}><div className="cta-copy">Know More.<br />Know Better.<br />Knoplus.</div><a href={contact} className="cta-button">Let’s talk</a><Link href="/" className={s.mainSite}>Main website ↗</Link></div>
      </aside>

      <main id="service-stage" className={`stage ${s.stage}`} data-theme={selected.theme || "service"} inert={mobileOpen}>
        <SiteMenu className={`stage-menu-control ${s.siteMenu}`} hideIcon showLabel onNavigate={href => window.location.assign(href === "/" ? "/revamp" : href)} />
        <div key={selected.id} className={`preview-bg ${s.background}`} style={{ "--bg": selected.image } as CSSProperties} />
        <div className={`content ${s.content} ${selected.screenshot ? s.withScreen : ""}`}>
          <div key={selected.id} className={`copy ${s.copy}`}>
            <div className={`copy-anchor ${s.anchor}`}>
              <div className={`eyebrow ${s.eyebrow}`}>{selected.label}</div>
              <h1 ref={heading} tabIndex={-1} className={s.title}>{selected.title ? <span dangerouslySetInnerHTML={{ __html: selected.title }} /> : selected.name}</h1>
              <p className={s.description}>{selected.description}</p>
              <div className={`actions template-actions ${s.actions}`}>
                {selected.id === "textualize" && initialId === "textualize" ? <a className="cta-button explore-button" href={contact}>Discuss an app</a>
                  : selected.href ? <Link className="cta-button explore-button" href={selected.href}>{selected.action || "Explore"}</Link>
                  : selected.children || selected.id === "work" ? <button className="cta-button explore-button" type="button" onClick={() => {
                    const next = selected.children?.[0] || services[0];
                    select(next);
                    if (window.matchMedia("(max-width: 760px)").matches) setMobileOpen(true);
                  }}>{selected.id === "work" ? "Explore Services" : selected.id === "websites" ? "Explore Websites" : "Explore the folder"}</button>
                    : <a className="cta-button explore-button" href={contact}>Let’s talk</a>}
                {selected.related && <Link className="cta-button inquire-button" href={selected.related.href}>{selected.related.label}</Link>}
                {selected.template && <button className="cta-button inquire-button" onClick={() => setContactTemplate(selected.name)} type="button">Inquire</button>}
              </div>
              {selected.highlights && <div className={s.highlights}>{selected.highlights.map(text => <span key={text}>{text}</span>)}</div>}
              {selected.note && <p className={s.note}>{selected.note}</p>}
            </div>
          </div>
          {selected.screenshot && <figure className={`${s.screen} ${selected.screenshot.height > selected.screenshot.width ? s.phone : ""}`}>
            <Image key={selected.screenshot.src} src={selected.screenshot.src} width={selected.screenshot.width} height={selected.screenshot.height} alt={selected.screenshot.alt} unoptimized priority />
          </figure>}
        </div>
        <div className={s.stageFooter}>
          <span>{selected.id === "work" ? "Explore the folders to find your starting point." : selected.children ? `${selected.children.length} ${selected.id === "websites" ? "websites" : "items in this folder"}` : selected.label.split(" / ").slice(0, -1).join(" / ")}</span>
          <div aria-label="Service categories">{services.map(item => <button key={item.id} type="button" aria-label={`Show ${item.name}`} aria-pressed={currentRoot === item.id} onClick={() => select(item)} />)}</div>
        </div>
      </main>
    </div>
    <ContactModal key={contactTemplate || "closed"} isOpen={contactTemplate !== null} onClose={() => setContactTemplate(null)} selectedTemplate={contactTemplate || ""} />
  </>;
}
