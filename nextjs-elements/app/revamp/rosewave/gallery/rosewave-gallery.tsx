"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import data from "./catalog.json";
import s from "./gallery.module.css";
import t from "./template.module.css";

type Photo = (typeof data.collections)[number]["photos"][number];
type Collection = (typeof data.collections)[number];
type BagItem = { key: string; photo: string; type: string; size: string; finish: string; quantity: number };
const root = "/revamp/rosewave-gallery";
const allPhotos = data.collections.flatMap(collection => collection.photos);
const types = data.prints.types;
const frameColors: Record<string, string> = { black: "#292929", white: "#f9f6ef", natural: "#ba9870", brown: "#72533d", darkgrey: "#555555", lightgrey: "#bcb9b2", gold: "#b6995b", silver: "#b7b9b8" };
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

function Arrow({ diagonal = false }: { diagonal?: boolean }) {
  return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d={diagonal ? "M5 19 19 5M5 5h14v14" : "M4 12h16m-6-6 6 6-6 6"} stroke="currentColor" strokeWidth="1.2" /></svg>;
}
function WaveMark() {
  return <svg width="35" height="35" viewBox="0 0 40 40" fill="none" aria-hidden="true"><circle cx="23" cy="13" r="7" fill="#EB8070" /><path d="M3 24c8-9 14 9 23 0s10-1 12 0M3 30c8-9 14 9 23 0s10-1 12 0" stroke="currentColor" strokeWidth="1.2" /></svg>;
}
function PhotoImage({ photo, className = "", eager = false }: { photo: Photo; className?: string; eager?: boolean }) {
  return <Image src={photo.src} alt={photo.title} width={photo.width} height={photo.height} unoptimized draggable={false} loading={eager ? "eager" : "lazy"} className={className} />;
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
    <div className={`${s.print} ${typeId === "canvas" ? s.canvas : ""}`} style={style}>
      <div className={s.mat} style={{ padding: framed ? `${2 / (width + 4) * 100}%` : paper ? "6.15%" : 0 }}>
        <PhotoImage photo={photo} eager />
      </div>
    </div>
    <span className={s.sceneCaption}>A little perspective · Room preview</span>
  </div>;
}

export default function RosewaveGallery() {
  const [collection, setCollection] = useState<Collection>(data.collections[0]);
  const [photo, setPhoto] = useState<Photo>(allPhotos[0]);
  const [printType, setPrintType] = useState("framed");
  const [sizeId, setSizeId] = useState("16x24");
  const [finish, setFinish] = useState("natural");
  const [room, setRoom] = useState("sideboard");
  const [view, setView] = useState("room");
  const [bag, setBag] = useState<BagItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [notice, setNotice] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const pageRef = useRef<HTMLDivElement>(null);
  const portfolioRef = useRef<HTMLElement>(null);
  const panelRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const printDialog = useRef<HTMLDialogElement>(null);
  const bagDialog = useRef<HTMLDialogElement>(null);
  const selectedType = types.find(type => type.id === printType)!;
  const selectedSize = selectedType.sizes.find(size => size.id === sizeId) || selectedType.sizes[0];
  const count = bag.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = bag.reduce((sum, item) => sum + priceOf(item) * item.quantity, 0);

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
    if (!page) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      panelRefs.current.forEach((panel, index) => {
        if (!panel) return;
        const rect = panel.getBoundingClientRect();
        const distance = (rect.top + rect.height / 2 - page.clientHeight / 2) / page.clientHeight;
        panel.style.setProperty("--panel-y", `${Math.max(-22, Math.min(22, distance * -34)) + index * 1.5}px`);
      });
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    page.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => { page.removeEventListener("scroll", schedule); window.removeEventListener("resize", schedule); cancelAnimationFrame(frame); };
  }, []);

  function openCollection(item: Collection) {
    setCollection(item);
    portfolioRef.current?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "start" });
  }
  function openPrint(item: Photo) {
    setPhoto(item);
    setView("room");
    printDialog.current?.showModal();
  }
  function changeType(id: string) {
    setPrintType(id);
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

  return <div ref={pageRef} className={`${t.page} ${s.page}`}>
    <a className={t.skip} href="#portfolio">Skip to photographs</a>
    <header className={`${t["photo-header"]} ${menuOpen ? t["is-menu-open"] : ""}`}>
      <a href="#top" className={t.brand} aria-label="Rose Wave Photography home"><strong>Rose Wave</strong><span>Photography</span></a>
      <button className={t["menu-toggle"]} aria-label={menuOpen ? "Close menu" : "Open menu"} aria-expanded={menuOpen} aria-controls="rosewave-menu" onClick={() => setMenuOpen(!menuOpen)}><span /><span /></button>
      <nav className={t["photo-nav"]} id="rosewave-menu" aria-label="Rose Wave navigation">
        <a href="#portfolio" onClick={() => setMenuOpen(false)}>Portfolio</a><a href="#about" onClick={() => setMenuOpen(false)}>About</a><a href="#prints" onClick={() => setMenuOpen(false)}>Prints</a><a href="#contact" onClick={() => setMenuOpen(false)}>Contact</a>
        <button onClick={() => { setMenuOpen(false); bagDialog.current?.showModal(); }} aria-label={`Open bag, ${count} ${count === 1 ? "item" : "items"}`}>Bag ({count})</button>
      </nav>
    </header>
    <main>
      <section className={t["category-stack"]} id="top" aria-label="Photography collections">
        {data.collections.map((item, index) => <button key={item.id} ref={element => { panelRefs.current[index] = element; }} className={`${t["category-panel"]} ${collection.id === item.id ? t["is-active"] : ""}`} style={{ "--image": `url("${item.photos[0].src}")` } as CSSProperties} onClick={() => openCollection(item)} aria-label={`Explore ${item.name}, ${item.photos.length} photographs`}>
          <span className={t["category-number"]}>{String(index + 1).padStart(2, "0")}</span><span className={t["category-title"]}>{item.name}</span><span className={t["category-action"]}>View gallery</span>
        </button>)}
      </section>
      <section className={t["portfolio-section"]} id="portfolio" ref={portfolioRef} aria-labelledby="collection-title">
        <aside className={t["portfolio-sidebar"]}>
          <a className={t["back-link"]} href="#top">Back to collections</a>
          <p className={t.eyebrow}>Selected work</p><h1 id="collection-title">{collection.name}</h1>
          <p className={t["gallery-description"]}>{collection.description}</p>
          <ol className={t["filter-list"]} aria-label="Collection filters">{data.collections.map(item => <li key={item.id}><button className={`${t["filter-button"]} ${collection.id === item.id ? t["is-active"] : ""}`} aria-pressed={collection.id === item.id} onClick={() => setCollection(item)}>{item.name}</button></li>)}</ol>
          <p className={t["gallery-hint"]}>{collection.photos.length} photographs.<br />Select one to explore prints.</p>
        </aside>
        <div className={t["gallery-grid"]} aria-live="polite" aria-label={`${collection.name} photographs`}>
          {collection.photos.map((item, index) => <figure key={item.id} className={`${t["gallery-item"]} ${index === 0 ? t.wide : index % 4 === 1 ? t.tall : ""}`}>
            <button onClick={() => openPrint(item)} aria-label={`Preview print of ${item.title}`}><PhotoImage photo={item} /></button><figcaption>{String(index + 1).padStart(2, "0")} / Explore print</figcaption>
          </figure>)}
        </div>
      </section>
      <section className={t["about-section"]} id="about" aria-labelledby="about-title">
        <p className={t.eyebrow}>About Rose Wave</p><h2 id="about-title">A different way to see the everyday.</h2><p>Something familiar. Something unexpected. Rose Wave gives a photograph you connect with a place in your everyday — on your phone, on your wall, or somewhere in between.</p>
      </section>
      <section className={t["print-section"]} id="prints" aria-labelledby="print-heading">
        <button onClick={() => openPrint(allPhotos[0])} aria-label="Preview The Blush of Autumn as a print"><PrintScene photo={allPhotos[0]} /></button>
        <div><p className={t.eyebrow}>From your screen to your space</p><h2 id="print-heading">Some photographs deserve a wall.</h2><p>Find a finish, choose a size, and see how it feels at home. Explore fine art paper, framed prints, metal, acrylic, and canvas.</p><button className={t["text-link"]} onClick={() => openPrint(allPhotos[0])}>Find your print ↗</button><p>Shop preview · Print orders opening soon.</p></div>
      </section>
      <section className={t["journal-section"]} aria-label="Explore more">
        <article><span>The app</span><h3><Link href="/revamp/rosewave">Keep a photograph close. ↗</Link></h3><p>Explore Rose Wave for your phone.<br />Coming soon to Google Play.</p></article>
        <article><span>The website</span><h3><Link href="/templates/photo-portfolio/">A template, in its element. ↗</Link></h3><p>This gallery uses the Kno.plus Photography template. See the original, then imagine your own photographs here.</p></article>
        <article id="contact"><span>Contact</span><h3><a href="mailto:info@kno.plus?subject=Rose%20Wave%20photography">Something caught your eye? ↗</a></h3><p>Ask about a photograph or a print.</p></article>
      </section>
    </main>
    <footer className={t["photo-footer"]}><span>© {new Date().getFullYear()} Rose Wave Photography</span><nav aria-label="Footer navigation"><a href="#top">Collections</a><Link href="/templates/photo-portfolio/">Photography template</Link><Link href="/revamp">Kno.plus</Link></nav></footer>

    <dialog ref={printDialog} className={`${s.dialog} ${s.printDialog}`} aria-labelledby="product-title" onClose={() => setNotice("")} onClick={event => { if (event.target === event.currentTarget) printDialog.current?.close(); }}>
      <div className={s.dialogTop}><span className={s.eyebrow}>ROSE WAVE / FIND YOUR PRINT</span><div className={s.dialogActions}><button className={s.textLink} onClick={() => bagDialog.current?.showModal()}>Bag ({count})</button><button className={s.close} aria-label="Close print preview" onClick={() => printDialog.current?.close()}>×</button></div></div>
      <div className={s.product}>
        <div className={s.productVisual}>
          <div className={s.viewSwitch} role="group" aria-label="Preview view"><button aria-pressed={view === "room"} onClick={() => setView("room")}>In a room</button><button aria-pressed={view === "photo"} onClick={() => setView("photo")}>The photograph</button></div>
          {view === "room" ? <PrintScene photo={photo} typeId={printType} sizeId={selectedSize.id} finish={finish} roomId={room} /> : <div className={s.photoOnly}><PhotoImage photo={photo} eager /></div>}
          {view === "room" && <div className={s.roomOptions} role="group" aria-label="Room"><span>Try a space</span>{rooms.map(item => <button key={item.id} aria-pressed={room === item.id} onClick={() => setRoom(item.id)}>{item.name}</button>)}</div>}
        </div>
        <div className={s.productCopy}>
          <p className={s.eyebrow}>Original photography / Print preview</p><h2 id="product-title">{photo.title.split(" · ")[0]}<span>Photograph {photo.title.split(" · ")[1]}</span></h2>
          <fieldset><legend>Find your finish</legend><div className={s.typeOptions}>{types.map(type => <button key={type.id} aria-pressed={printType === type.id} onClick={() => changeType(type.id)}>{type.name}</button>)}</div></fieldset>
          <p className={s.materialNote}>{selectedType.about}</p>
          <label className={s.sizeLabel}>Print size <select value={selectedSize.id} onChange={event => setSizeId(event.target.value)}>{selectedType.sizes.map(size => <option key={size.id} value={size.id}>{size.name}</option>)}</select></label>
          {selectedType.finish && <fieldset><legend>Frame <span>{selectedType.finish.choices.find(item => item.id === finish)?.name}</span></legend><div className={s.swatches}>{selectedType.finish.choices.map(item => <button key={item.id} aria-label={`${item.name} frame`} aria-pressed={finish === item.id} onClick={() => setFinish(item.id)} style={{ backgroundColor: frameColors[item.id] }} />)}</div></fieldset>}
          <div className={s.priceLine}><strong>{money(selectedSize.cents)}</strong><span>USD · Before shipping & tax</span></div>
          <button className={s.primary} onClick={addToBag}>Add to bag <Arrow /></button>
          <div className={s.addNotice} role="status" aria-live="polite">{notice && <span>{notice} <button onClick={() => bagDialog.current?.showModal()}>View bag →</button></span>}</div>
          <p className={s.small}>Shop preview. Save your choices in the bag; online ordering is coming soon.</p>
          <p className={s.previewNote}>Room views illustrate the size and finish. The photograph is fitted to the selected print size.{!photo.free && " This photograph is shown at preview resolution."}</p>
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
