"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { flushSync } from "react-dom";
import data from "./catalog.json";
import s from "./gallery.module.css";
import t from "./template.module.css";

type Photo = (typeof data.collections)[number]["photos"][number];
type Collection = (typeof data.collections)[number];
type BagItem = { key: string; photo: string; type: string; size: string; finish: string; quantity: number };
const root = "/revamp/rosewave-gallery";
const allPhotos = data.collections.flatMap(collection => collection.photos);
const types = data.prints.types;
const galleryPath = "/revamp/rosewave/gallery";
const collectionPath = (id: string) => `${galleryPath}/collections/${id}`;
const rooms = [
  { id: "sideboard", name: "Living room", x: 512, y: 811, ppi: 12.42 },
  { id: "sofa", name: "Sofa", x: 489, y: 679, ppi: 9.8 },
  { id: "office", name: "Office", x: 486, y: 800, ppi: 13.73 },
];
const money = (cents: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(cents / 100);
const priceOf = (item: BagItem) => types.find(type => type.id === item.type)?.sizes.find(size => size.id === item.size)?.cents ?? 0;
const validItem = (item: BagItem) => !!item && allPhotos.some(p => p.id === item.photo) && types.some(t =>
  t.id === item.type && t.sizes.some(z => z.id === item.size) &&
  (!t.finish || t.finish.choices.some(f => f.id === item.finish))) &&
  Number.isInteger(item.quantity) && item.quantity > 0 && item.quantity <= 20;

function TemplateLink({ children }: { children: string }) {
  // This template is a standalone public HTML document, outside the Next.js router.
  // eslint-disable-next-line @next/next/no-html-link-for-pages
  return <a href="/templates/photo-portfolio/index.html">{children}</a>;
}

function Arrow({ diagonal = false }: { diagonal?: boolean }) {
  return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d={diagonal ? "M5 19 19 5M5 5h14v14" : "M4 12h16m-6-6 6 6-6 6"} stroke="currentColor" strokeWidth="1.2" /></svg>;
}
function WaveMark() {
  return <svg width="35" height="35" viewBox="0 0 40 40" fill="none" aria-hidden="true"><circle cx="23" cy="13" r="7" fill="#EB8070" /><path d="M3 24c8-9 14 9 23 0s10-1 12 0M3 30c8-9 14 9 23 0s10-1 12 0" stroke="currentColor" strokeWidth="1.2" /></svg>;
}
function AppIcon({ name, className = "" }: { name: "gallery" | "print" | "grid" | "menu" | "close" | "arrow_right"; className?: string }) {
  return <Image src={`${root}/icons/icon_${name}.png`} width={64} height={64} alt="" aria-hidden="true" unoptimized className={`${t["app-icon"]} ${className}`} />;
}
function AppArtwork({ className = "", scene = "footer" }: { className?: string; scene?: "intro" | "about" | "footer" }) {
  return <div className={`${t.artwork} ${className}`} aria-hidden="true">
    <picture>
      <source media="(max-width: 900px)" srcSet={`${root}/artwork/${scene}-mobile.webp`} />
      {/* Art-directed Blender renders have different compositions, not stretched app layers. */}
      <img src={`${root}/artwork/${scene}-desktop.webp`} alt="" loading={scene === "intro" ? "eager" : "lazy"} draggable={false} />
    </picture>
  </div>;
}
function PhotoImage({ photo, className = "", eager = false, full = false }: { photo: Photo; className?: string; eager?: boolean; full?: boolean }) {
  return <Image src={full ? photo.fullSrc : photo.src} alt={photo.title} width={full ? photo.fullWidth : photo.width} height={full ? photo.fullHeight : photo.height} unoptimized draggable={false} loading={eager ? "eager" : "lazy"} className={className} />;
}

function PrintScene({ photo, typeId = "framed", sizeId = "16x24", finish = "natural", roomId = "sideboard" }: {
  photo: Photo; typeId?: string; sizeId?: string; finish?: string; roomId?: string;
}) {
  const room = rooms.find(item => item.id === roomId) || rooms[0];
  const [short, long] = sizeId.split("x").map(Number);
  const landscape = photo.width > photo.height;
  const width = landscape ? long : short;
  const height = landscape ? short : long;
  const framed = typeId === "framed";
  const paper = typeId === "paper";
  const outsideWidth = width + (framed ? 6 : paper ? width * .14 : 0);
  const outsideHeight = height + (framed ? 6 : paper ? width * .14 : 0);
  const style = {
    left: `${room.x / 1024 * 100}%`, top: `${room.y / 1536 * 100}%`,
    width: `${outsideWidth * room.ppi / 1024 * 100}%`,
    aspectRatio: `${outsideWidth} / ${outsideHeight}`,
    borderWidth: framed ? `${room.ppi / 1024 * 100}cqw` : 0,
    borderImageSource: framed ? `url(${root}/frames/${finish}.webp)` : undefined,
  } as CSSProperties;
  return <div className={s.scene} aria-label={`${photo.title}, ${typeId} print in the ${room.name.toLowerCase()}`}>
    <Image src={`${root}/rooms/${room.id}.webp`} width={1024} height={1536} alt="" unoptimized className={s.roomPhoto} />
    <div className={s.print} data-material={typeId} style={style}>
      <div className={s.mat} style={{ padding: framed ? `${2 / (width + 4) * 100}%` : paper ? "6.15%" : 0 }}>
        <div className={s.printSurface} data-material={typeId}><PhotoImage photo={photo} eager full /><span className={s.surfaceTexture} aria-hidden="true" /></div>
      </div>
    </div>
    <span className={s.sceneCaption}>A little perspective · Room preview</span>
  </div>;
}

function StudioPrint({ photo, typeId, sizeId, finish }: { photo: Photo; typeId: string; sizeId: string; finish: string }) {
  const [short, long] = sizeId.split("x").map(Number);
  const landscape = photo.width > photo.height;
  const width = landscape ? long : short;
  const height = landscape ? short : long;
  const framed = typeId === "framed";
  const paper = typeId === "paper";
  const outsideWidth = width + (framed ? 6 : paper ? width * .14 : 0);
  const outsideHeight = height + (framed ? 6 : paper ? width * .14 : 0);
  return <div className={s.studio} aria-label={`${photo.title}, ${typeId} print${framed ? ` with a ${finish} frame` : ""}`}>
    <div className={s.studioFit} style={{ "--art-ratio": outsideWidth / outsideHeight, aspectRatio: `${outsideWidth} / ${outsideHeight}` } as CSSProperties}>
      <div className={s.studioPrint} data-material={typeId} style={{ borderWidth: framed ? `${100 / outsideWidth}cqw` : 0, borderImageSource: framed ? `url(${root}/frames/${finish}.webp)` : undefined }}>
        <div className={s.mat} style={{ padding: framed ? `${2 / (width + 4) * 100}%` : paper ? "6.15%" : 0 }}><div className={s.printSurface} data-material={typeId}><PhotoImage photo={photo} eager full /><span className={s.surfaceTexture} aria-hidden="true" /></div></div>
      </div>
    </div>
  </div>;
}

type PreviewSnapshot = { photo: Photo; view: string; room: string; typeId: string; sizeId: string; finish: string };
const previewKey = (frame: PreviewSnapshot) => `${frame.photo.id}:${frame.view}:${frame.view === "room" ? frame.room : ""}`;
const previewConfig = (frame: PreviewSnapshot) => `${previewKey(frame)}:${frame.typeId}:${frame.sizeId}:${frame.finish}`;
function PreviewContent({ photo, view, room, typeId, sizeId, finish }: PreviewSnapshot) {
  if (view === "room") return <div className={s.roomStage}><PrintScene photo={photo} typeId={typeId} sizeId={sizeId} finish={finish} roomId={room} /></div>;
  if (view === "print") return <StudioPrint photo={photo} typeId={typeId} sizeId={sizeId} finish={finish} />;
  return <div className={s.photoOnly}><PhotoImage photo={photo} eager full /></div>;
}
function SlidingPreview(frame: PreviewSnapshot) {
  const [slides, setSlides] = useState({ active: frame, leaving: null as PreviewSnapshot | null, serial: 0, direction: 1 });
  if (previewConfig(frame) !== previewConfig(slides.active)) {
    if (previewKey(frame) !== previewKey(slides.active)) {
      const old = slides.active;
      const direction = frame.photo.id !== old.photo.id
        ? Math.sign(allPhotos.indexOf(frame.photo) - allPhotos.indexOf(old.photo))
        : frame.view !== old.view
          ? Math.sign(["photo", "print", "room"].indexOf(frame.view) - ["photo", "print", "room"].indexOf(old.view))
          : Math.sign(rooms.findIndex(item => item.id === frame.room) - rooms.findIndex(item => item.id === old.room));
      // Keep the outgoing scene intact while the next distinct scene slides past it.
      setSlides({ active: frame, leaving: old, serial: slides.serial + 1, direction: direction || 1 });
    } else setSlides({ ...slides, active: frame });
  }
  useEffect(() => {
    if (!slides.leaving) return;
    const timeout = window.setTimeout(() => setSlides(current => current.serial === slides.serial ? { ...current, leaving: null } : current), 600);
    return () => window.clearTimeout(timeout);
  }, [slides.serial, slides.leaving]);
  return <div className={s.previewDeck} style={{ "--slide-direction": slides.direction } as CSSProperties}>
    {slides.leaving && <div key={`out-${slides.serial}`} className={`${s.previewSlide} ${s.slideOut}`} aria-hidden="true" inert><PreviewContent {...slides.leaving} /></div>}
    <div key={`in-${slides.serial}`} className={`${s.previewSlide} ${slides.leaving ? s.slideIn : ""}`} onAnimationEnd={() => setSlides(current => current.serial === slides.serial ? { ...current, leaving: null } : current)}><PreviewContent {...slides.active} /></div>
  </div>;
}

export default function RosewaveGallery({ collectionId }: { collectionId?: string }) {
  const collection: Collection = data.collections.find(item => item.id === collectionId) || data.collections[0];
  const isCollection = !!collectionId;
  const [photo, setPhoto] = useState<Photo>(allPhotos[0]);
  const [printType, setPrintType] = useState("framed");
  const [sizeId, setSizeId] = useState("16x24");
  const [finish, setFinish] = useState("natural");
  const [room, setRoom] = useState("sideboard");
  const [view, setView] = useState("photo");
  const [bag, setBag] = useState<BagItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [notice, setNotice] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [centeredPanel, setCenteredPanel] = useState<number | null>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const panelRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const printDialog = useRef<HTMLDialogElement>(null);
  const bagDialog = useRef<HTMLDialogElement>(null);
  const sizeControlRef = useRef<HTMLLabelElement>(null);
  const sizeWheelRef = useRef({ distance: 0, lastStep: 0 });
  const selectedType = types.find(type => type.id === printType)!;
  const selectedSize = selectedType.sizes.find(size => size.id === sizeId) || selectedType.sizes[0];
  const count = bag.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = bag.reduce((sum, item) => sum + priceOf(item) * item.quantity, 0);
  const photoCollection = data.collections.find(item => item.photos.some(p => p.id === photo.id)) || collection;
  const photoIndex = photoCollection.photos.findIndex(item => item.id === photo.id);

  useEffect(() => {
    try {
      const saved: unknown = JSON.parse(localStorage.getItem("rosewave-gallery-bag-v1") || "[]");
      if (Array.isArray(saved)) setBag(saved.filter(validItem).slice(0, 40));
    } catch { /* Browsing and the bag still work without storage. */ }
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (loaded) try { localStorage.setItem("rosewave-gallery-bag-v1", JSON.stringify(bag)); } catch { /* Storage is optional. */ }
  }, [bag, loaded]);
  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(""), 4000);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  useEffect(() => {
    const page = pageRef.current;
    if (!page || isCollection) return;
    let frame = 0;
    let lastScroll = page.scrollTop;
    let direction = 0;
    let jumpingToSection = false;
    let jumpTimer = 0;
    const update = () => {
      frame = 0;
      if (jumpingToSection) return;
      const delta = page.scrollTop - lastScroll;
      if (Math.abs(delta) > 1) direction = Math.sign(delta);
      lastScroll = page.scrollTop;
      const height = window.visualViewport?.height || page.clientHeight;
      const top = window.visualViewport?.offsetTop || 0;
      const candidates: { index: number; distance: number }[] = [];
      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      panelRefs.current.forEach((panel, index) => {
        if (!panel) return;
        const rect = panel.getBoundingClientRect();
        const distance = (rect.top + rect.height / 2 - top - height / 2) / height;
        if (rect.bottom > top + height * .4 && rect.top < top + height * .6) candidates.push({ index, distance: Math.abs(distance) });
        if (!reducedMotion) panel.style.setProperty("--panel-y", `${Math.max(-22, Math.min(22, distance * -34)) + index * 1.5}px`);
      });
      // At a boundary, the incoming panel wins in the direction of travel.
      // Only scrolling/viewport changes trigger selection; resizing the panels cannot retrigger it.
      const next = direction > 0 ? candidates.at(-1) : direction < 0 ? candidates[0] : candidates.sort((a, b) => a.distance - b.distance)[0];
      setCenteredPanel(next?.index ?? null);
    };
    const finishJump = () => {
      jumpingToSection = false;
      delete page.dataset.sectionJump;
      lastScroll = page.scrollTop;
      direction = 0;
      schedule();
    };
    const schedule = () => {
      if (jumpingToSection) {
        window.clearTimeout(jumpTimer);
        jumpTimer = window.setTimeout(finishJump, 150);
      } else if (!frame) frame = requestAnimationFrame(update);
    };
    const prepareAnchor = (event: MouseEvent) => {
      const link = event.target instanceof Element ? event.target.closest("a") : null;
      if (!link || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      const url = new URL(link.href);
      if (url.origin !== location.origin || url.pathname !== location.pathname || !url.hash) return;
      // Settle panel heights before native anchor navigation measures its destination.
      // Otherwise an outgoing panel's collapse can pull the target under the header.
      jumpingToSection = true;
      page.dataset.sectionJump = "true";
      flushSync(() => setCenteredPanel(null));
      window.clearTimeout(jumpTimer);
      jumpTimer = window.setTimeout(finishJump, 150);
    };
    update();
    page.addEventListener("click", prepareAnchor, true);
    page.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    window.visualViewport?.addEventListener("resize", schedule);
    return () => { page.removeEventListener("click", prepareAnchor, true); page.removeEventListener("scroll", schedule); window.removeEventListener("resize", schedule); window.visualViewport?.removeEventListener("resize", schedule); cancelAnimationFrame(frame); window.clearTimeout(jumpTimer); delete page.dataset.sectionJump; };
  }, [isCollection]);

  useEffect(() => {
    const control = sizeControlRef.current;
    if (!control) return;
    const onWheel = (event: WheelEvent) => {
      if (event.ctrlKey || !event.deltaY || Math.abs(event.deltaX) > Math.abs(event.deltaY) || !printDialog.current?.open || bagDialog.current?.open) return;
      event.preventDefault();
      const wheel = sizeWheelRef.current;
      const now = performance.now();
      // Keep high-resolution trackpad gestures from racing through every size.
      if (now - wheel.lastStep < 150) return;
      const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? control.clientHeight : 1);
      if (Math.sign(delta) !== Math.sign(wheel.distance)) wheel.distance = 0;
      wheel.distance += delta;
      if (Math.abs(wheel.distance) < 24) return;
      const index = selectedType.sizes.findIndex(size => size.id === selectedSize.id);
      const next = Math.max(0, Math.min(selectedType.sizes.length - 1, index + Math.sign(wheel.distance)));
      wheel.distance = 0;
      wheel.lastStep = now;
      if (next === index) return;
      setSizeId(selectedType.sizes[next].id);
      if (view === "photo") setView("print");
    };
    control.addEventListener("wheel", onWheel, { passive: false });
    return () => control.removeEventListener("wheel", onWheel);
  }, [selectedType, selectedSize.id, view]);

  function openPrint(item: Photo) {
    setPhoto(item);
    setView("photo");
    printDialog.current?.showModal();
  }
  function changeType(id: string) {
    setPrintType(id);
    if (view === "photo") setView("print");
    const next = types.find(type => type.id === id)!;
    if (!next.sizes.some(size => size.id === sizeId)) setSizeId(next.sizes[0].id);
  }
  function addToBag() {
    const key = [photo.id, printType, selectedSize.id, selectedType.finish ? finish : ""].join(":");
    setBag(items => {
      const found = items.find(item => item.key === key);
      return found ? items.map(item => item.key === key ? { ...item, quantity: Math.min(20, item.quantity + 1) } : item)
        : [...items, { key, photo: photo.id, type: printType, size: selectedSize.id, finish: selectedType.finish ? finish : "", quantity: 1 }];
    });
    setNotice("Added to your bag");
  }
  function inquiry() {
    return `mailto:info@kno.plus?subject=${encodeURIComponent("Rose Wave print inquiry")}&body=${encodeURIComponent("Hello, I’m interested in these Rose Wave prints:\n\n" + bag.map(item => {
      const p = allPhotos.find(p => p.id === item.photo)!;
      const type = types.find(t => t.id === item.type)!;
      const size = type.sizes.find(z => z.id === item.size)!;
      return `${item.quantity} × ${p.title} / ${type.name} / ${size.name}${item.finish ? " / " + item.finish : ""} — ${money(priceOf(item) * item.quantity)}`;
    }).join("\n") + `\n\nPreview subtotal: ${money(subtotal)} (before shipping and tax). Please let me know about availability and final pricing.`)}`;
  }

  return <div ref={pageRef} className={`${t.page} ${s.page}`} onContextMenu={event => event.preventDefault()}>
    <a className={t.skip} href={isCollection ? "#portfolio" : "#collections"}>Skip to {isCollection ? "photographs" : "collections"}</a>
    <header className={`${t["photo-header"]} ${menuOpen ? t["is-menu-open"] : ""}`}>
      <Link href={isCollection ? galleryPath : "#top"} className={t.brand} aria-label="Rose Wave Photography home"><span className={t["brand-mark"]}><WaveMark /></span><span className={t["brand-type"]}><strong>Rose Wave</strong><span>Photography</span></span></Link>
      <button className={t["menu-toggle"]} aria-label={menuOpen ? "Close menu" : "Open menu"} aria-expanded={menuOpen} aria-controls="rosewave-menu" onClick={() => setMenuOpen(!menuOpen)}><AppIcon name={menuOpen ? "close" : "menu"} /></button>
      <nav className={t["photo-nav"]} id="rosewave-menu" aria-label="Rose Wave navigation">
        <Link href={collectionPath(collection.id)} onClick={() => setMenuOpen(false)}><AppIcon name="gallery" />Portfolio</Link><Link href={`${galleryPath}#about`} onClick={() => setMenuOpen(false)}>About</Link><Link href={`${galleryPath}#prints`} onClick={() => setMenuOpen(false)}><AppIcon name="print" />Prints</Link><Link href={`${galleryPath}#contact`} onClick={() => setMenuOpen(false)}>Contact</Link>
        <button onClick={() => { setMenuOpen(false); bagDialog.current?.showModal(); }} aria-label={`Open bag, ${count} ${count === 1 ? "item" : "items"}`}><svg width="18" height="21" viewBox="0 0 24 26" fill="none" aria-hidden="true"><path d="M4 8h16l1 16H3L4 8Zm4 0V5a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="1.4" /></svg>Bag ({count})</button>
      </nav>
    </header>
    <main id="top">
      {!isCollection && <><section className={t["collection-intro"]} aria-label="Rose Wave photography">
        <div className={t["intro-copy"]}><p className={t.eyebrow}>Original photography · A different perspective</p><p className={t["intro-title"]}>Find a photograph<br />that feels like you.</p></div>
        <AppArtwork className={t["intro-art"]} scene="intro" />
      </section>
      <section id="collections" className={t["category-stack"]} aria-label="Photography collections">
        {data.collections.map((item, index) => <Link key={item.id} href={collectionPath(item.id)} ref={element => { panelRefs.current[index] = element; }} className={`${t["category-panel"]} ${centeredPanel === index ? t["is-centered"] : ""}`} data-centered={centeredPanel === index} style={{ "--image": `url("${item.photos[0].fullSrc}")` } as CSSProperties} aria-label={`Explore ${item.name}, ${item.photos.length} photographs`}>
          <span className={t["category-number"]}>{String(index + 1).padStart(2, "0")} <span className={t["collection-count"]}>{item.photos.length} photographs</span></span><span className={t["category-title"]}>{item.name}</span><span className={t["category-action"]}>View gallery <AppIcon name="arrow_right" /></span>
        </Link>)}
      </section></>}
      {isCollection && <section className={`${t["portfolio-section"]} ${s.collectionPortfolio}`} id="portfolio" aria-labelledby="collection-title">
        <aside className={t["portfolio-sidebar"]}>
          <Link className={t["back-link"]} href={`${galleryPath}#collections`}>Back to collections</Link>
          <p className={t.eyebrow}><AppIcon name="grid" />The collections</p><h1 id="collection-title">{collection.name}</h1>
          <p className={t["gallery-description"]}>{collection.description}</p>
          <ol className={t["filter-list"]} aria-label="Collection filters">{data.collections.map(item => <li key={item.id}><Link href={collectionPath(item.id)} className={`${t["filter-button"]} ${collection.id === item.id ? t["is-active"] : ""}`} aria-current={collection.id === item.id ? "page" : undefined}>{item.name}</Link></li>)}</ol>
          <p className={t["gallery-hint"]}>{collection.photos.length} photographs.<br />Select one to explore prints.</p><div className={t["sidebar-mark"]} aria-hidden="true"><WaveMark /></div>
        </aside>
        <div className={t["gallery-grid"]} aria-live="polite" aria-label={`${collection.name} photographs`}>
          {collection.photos.map((item, index) => <figure key={item.id} className={`${t["gallery-item"]} ${index === 0 ? t.wide : index % 4 === 1 ? t.tall : ""}`}>
            <button onClick={() => openPrint(item)} aria-label={`Preview print of ${item.title}`}><PhotoImage photo={item} /></button><figcaption>{String(index + 1).padStart(2, "0")} / Explore print</figcaption>
          </figure>)}
        </div>
      </section>}
      {!isCollection && <><section className={t["about-section"]} id="about" aria-labelledby="about-title">
        <AppArtwork className={t["about-art"]} scene="about" /><p className={t.eyebrow}>About Rose Wave</p><h2 id="about-title">A different way to see the everyday.</h2><p>Something familiar. Something unexpected. Rose Wave gives a photograph you connect with a place in your everyday — on your phone, on your wall, or somewhere in between.</p>
      </section>
      <section className={t["print-section"]} id="prints" aria-labelledby="print-heading">
        <button onClick={() => openPrint(allPhotos[0])} aria-label="Preview The Blush of Autumn as a print"><PrintScene photo={allPhotos[0]} /></button>
        <div><p className={t.eyebrow}><AppIcon name="print" />From your screen to your space</p><h2 id="print-heading">Some photographs deserve a wall.</h2><p>Find a finish, choose a size, and see how it feels at home. Explore fine art paper, framed prints, metal, acrylic, and canvas.</p><button className={t["text-link"]} onClick={() => openPrint(allPhotos[0])}>Find your print <AppIcon name="arrow_right" /></button><p>Shop preview · Print orders opening soon.</p></div>
      </section>
      <section className={t["journal-section"]} aria-label="Explore more">
        <article><span>The app</span><h3><Link href="/revamp/rosewave">Keep a photograph close. ↗</Link></h3><p>Explore Rose Wave for your phone.<br />Coming soon to Google Play.</p></article>
        <article><span>The website</span><h3><TemplateLink>A template, in its element. ↗</TemplateLink></h3><p>This gallery uses the Kno.plus Photography template. See the original, then imagine your own photographs here.</p></article>
        <article id="contact"><span>Contact</span><h3><a href="mailto:info@kno.plus?subject=Rose%20Wave%20photography">Something caught your eye? ↗</a></h3><p>Ask about a photograph or a print.</p></article>
      </section></>}
    </main>
    <div className={t["footer-art"]}><AppArtwork /></div>
    <footer className={t["photo-footer"]}><span className={t["footer-brand"]}><WaveMark />© {new Date().getFullYear()} Rose Wave Photography</span><nav aria-label="Footer navigation"><Link href={`${galleryPath}#collections`}>Collections</Link><TemplateLink>Photography template</TemplateLink><Link href="/revamp">Kno.plus</Link></nav></footer>

    <dialog ref={printDialog} className={`${s.dialog} ${s.printDialog}`} aria-labelledby="product-title" onClose={() => setNotice("")} onClick={event => { if (event.target === event.currentTarget) printDialog.current?.close(); }}>
      <div className={`${s.dialogTop} ${s.productHeader}`}><button className={s.backToGallery} onClick={() => printDialog.current?.close()}><span aria-hidden="true">←</span> Back to gallery</button><span className={s.productWordmark}><WaveMark />Rose Wave</span><div className={s.dialogActions}><button className={s.textLink} onClick={() => bagDialog.current?.showModal()}>Bag ({count})</button><button className={s.close} aria-label="Close print preview" onClick={() => printDialog.current?.close()}>×</button></div></div>
      <div className={s.product}>
        <div className={s.productVisual}>
          <div className={s.viewSwitch} role="group" aria-label="Preview view"><button aria-pressed={view === "photo"} onClick={() => setView("photo")}>Photograph</button><button aria-pressed={view === "print"} onClick={() => setView("print")}>Print preview</button><button aria-pressed={view === "room"} onClick={() => setView("room")}>In a room</button></div>
          <SlidingPreview photo={photo} view={view} typeId={printType} sizeId={selectedSize.id} finish={finish} room={room} />
          <div className={s.photoNavigation} role="group" aria-label="Browse photographs"><button aria-label="Previous photograph" disabled={photoIndex === 0} onClick={() => setPhoto(photoCollection.photos[photoIndex - 1])}>←</button><button aria-label="Next photograph" disabled={photoIndex === photoCollection.photos.length - 1} onClick={() => setPhoto(photoCollection.photos[photoIndex + 1])}>→</button></div>
          {view !== "room" && <p className={s.visualCaption}>{view === "photo" ? "The photograph, uncropped" : `${selectedType.name} · ${selectedSize.name}${selectedType.finish ? ` · ${selectedType.finish.choices.find(item => item.id === finish)?.name} frame` : ""}`}</p>}
          {view === "room" && <div className={s.roomOptions} role="group" aria-label="Room"><span>Try a space</span>{rooms.map(item => <button key={item.id} aria-pressed={room === item.id} onClick={() => setRoom(item.id)}>{item.name}</button>)}</div>}
        </div>
        <div className={s.productCopy}>
          <div className={s.productDetails}><p className={s.eyebrow}>Original photography / Print preview</p><h2 id="product-title">{photo.title.split(" · ")[0]}<span>Photograph {photo.title.split(" · ")[1]}</span></h2>
          <label className={s.optionLabel}>Finish<select value={printType} onChange={event => changeType(event.target.value)}>{types.map(type => <option key={type.id} value={type.id}>{type.name}</option>)}</select></label>
          <p className={s.materialNote}>{selectedType.about}</p>
          <label className={s.optionLabel}>Frame<select value={selectedType.finish ? finish : "none"} disabled={!selectedType.finish} onChange={event => { setFinish(event.target.value); if (view === "photo") setView("print"); }}>{selectedType.finish ? selectedType.finish.choices.map(item => <option key={item.id} value={item.id}>{item.name}</option>) : <option value="none">Not used for this finish</option>}</select></label>
          <label ref={sizeControlRef} className={s.sizeLabel}><span>Print size<small className={s.sizeHint}>Scroll to change</small></span><select aria-label="Print size" value={selectedSize.id} onChange={event => { setSizeId(event.target.value); if (view === "photo") setView("print"); }}>{selectedType.sizes.map(size => <option key={size.id} value={size.id}>{size.name}</option>)}</select></label>
          <p className={s.previewNote}>Print previews illustrate the selected size and finish. Room views offer a sense of scale.</p></div>
          <div className={s.purchaseFooter}><div className={s.priceLine}><strong>{money(selectedSize.cents)}</strong><span>USD · Before shipping & tax</span></div>
          <button className={s.primary} onClick={addToBag}>Add to bag <Arrow /></button>
          <div className={s.addNotice} role="status" aria-live="polite">{notice && <span>{notice} <button onClick={() => bagDialog.current?.showModal()}>View bag →</button></span>}</div>
          <p className={s.small}>Shop preview. Save your choices in the bag; online ordering is coming soon.</p>
          </div>
        </div>
      </div>
    </dialog>

    <dialog ref={bagDialog} className={`${s.dialog} ${s.bagDialog}`} aria-labelledby="bag-title" onClick={event => { if (event.target === event.currentTarget) bagDialog.current?.close(); }}>
      <div className={s.dialogTop}><h2 id="bag-title">Your bag <span>({count})</span></h2><button className={s.close} aria-label="Close bag" onClick={() => bagDialog.current?.close()}>×</button></div>
      {bag.length ? <><div className={s.bagItems}>{bag.map(item => {
        const p = allPhotos.find(p => p.id === item.photo)!;
        const type = types.find(type => type.id === item.type)!;
        return <div className={s.bagItem} key={item.key}><PhotoImage photo={p} /><div><h3>{p.title}</h3><p>{type.name} · {item.size.replace("x", " × ")} in{item.finish ? ` · ${item.finish}` : ""}</p><label>Quantity <select value={item.quantity} onChange={event => setBag(items => items.map(b => b.key === item.key ? { ...b, quantity: Number(event.target.value) } : b))}>{Array.from({ length: 20 }, (_, i) => <option key={i + 1}>{i + 1}</option>)}</select></label><button className={s.remove} aria-label={`Remove ${p.title}`} onClick={() => setBag(items => items.filter(b => b.key !== item.key))}>Remove</button></div><strong>{money(priceOf(item) * item.quantity)}</strong></div>;
      })}</div><div className={s.subtotal}><span>Subtotal</span><strong>{money(subtotal)}</strong></div><p className={s.small}>USD, before shipping and tax. This is a shop preview; checkout is not open yet.</p><a className={s.primary} href={inquiry()}>Ask about these prints <Arrow /></a><p className={s.small}>Opens an email with your selections. No order is placed.</p></> : <div className={s.empty}><WaveMark /><h3>A little room for something you love.</h3><p>Find a photograph, try a finish, and keep your choices here.</p><button className={s.primary} onClick={() => bagDialog.current?.close()}>Keep exploring <Arrow /></button></div>}
    </dialog>
  </div>;
}
