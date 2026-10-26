"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { KPlusMark, type Variant } from "./mark";
import { dataUri, favicons, tabFrames } from "./favicons";
import styles from "./lab.module.css";

const loaders: { id: Variant; name: string; note: string }[] = [
  {
    id: "scissor",
    name: "Scissor",
    note: "The two arms close into the upright while the stem tips over into the crossbar. The + spins half a turn before it opens back into a K.",
  },
  {
    id: "fold",
    name: "Fold",
    note: "The stem slides to the middle and the arms flatten out to either side. Calmer, with a small spring at the end.",
  },
  {
    id: "word",
    name: "KNO+",
    note: "Starts as the whole wordmark. N, O and + tuck in behind the K, the K becomes the +, then the word comes back out.",
  },
];

function setTabIcon(svg: string) {
  let link = document.querySelector<HTMLLinkElement>("link[data-kplus-lab]");
  if (!link) {
    document.querySelectorAll("link[rel~='icon']").forEach((l) => l.remove());
    link = document.createElement("link");
    link.rel = "icon";
    link.type = "image/svg+xml";
    link.dataset.kplusLab = "";
    document.head.append(link);
  }
  link.href = dataUri(svg);
}

export function Lab() {
  const [icon, setIcon] = useState(favicons[0].id);
  const [flipping, setFlipping] = useState(false);
  const [screen, setScreen] = useState<Variant | null>(null);
  const flip = useRef(0);

  useEffect(() => {
    if (flipping) return;
    setTabIcon(favicons.find((f) => f.id === icon)!.svg);
  }, [icon, flipping]);

  useEffect(() => {
    if (!flipping) return;
    let on = false;
    const swap = () => {
      on = !on;
      setTabIcon(on ? tabFrames.plus : tabFrames.k);
    };
    swap();
    flip.current = window.setInterval(swap, 650);
    return () => window.clearInterval(flip.current);
  }, [flipping]);

  useEffect(() => {
    if (!screen) return;
    const close = (e: KeyboardEvent) => e.key === "Escape" && setScreen(null);
    const timer = window.setTimeout(() => setScreen(null), 6000);
    window.addEventListener("keydown", close);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("keydown", close);
    };
  }, [screen]);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.logo}>
          KNO<span>+</span>
        </Link>
        <span className={styles.tag}>Experiment · not linked from the site</span>
      </header>

      <main>
        <section className={styles.intro}>
          <h1>K+</h1>
          <p>
            A tab icon and a loading animation built from the KNO+ logo. Every option here is drawn from the same
            straight strokes, so the K can turn into the + and back.
          </p>
        </section>

        <section className={styles.section} aria-labelledby="tab-heading">
          <div className={styles.sectionHead}>
            <p className={styles.eyebrow}>01</p>
            <h2 id="tab-heading">Tab icon</h2>
            <p>Pick one and look at this browser tab. It changes right away.</p>
          </div>
          <div className={styles.icons}>
            {favicons.map((f) => (
              <button
                key={f.id}
                type="button"
                className={styles.icon}
                aria-pressed={icon === f.id && !flipping}
                onClick={() => {
                  setFlipping(false);
                  setIcon(f.id);
                }}
              >
                <span className={styles.iconSizes}>
                  <img src={dataUri(f.svg)} alt="" width={96} height={96} />
                  <img src={dataUri(f.svg)} alt="" width={32} height={32} />
                  <img src={dataUri(f.svg)} alt="" width={16} height={16} />
                </span>
                <strong>{f.name}</strong>
                <span>{f.note}</span>
              </button>
            ))}
            <button
              type="button"
              className={styles.icon}
              aria-pressed={flipping}
              onClick={() => setFlipping((v) => !v)}
            >
              <span className={styles.iconSizes}>
                <img src={dataUri(tabFrames.k)} alt="" width={96} height={96} />
                <img src={dataUri(tabFrames.plus)} alt="" width={96} height={96} />
              </span>
              <strong>Flip while loading</strong>
              <span>The tab switches between K and + while a page loads, then settles on the icon above.</span>
            </button>
          </div>
        </section>

        <section className={styles.section} aria-labelledby="loader-heading">
          <div className={styles.sectionHead}>
            <p className={styles.eyebrow}>02</p>
            <h2 id="loader-heading">Loading animation</h2>
            <p>Three ways for the K to become a +. Press one to see it as a full loading screen.</p>
          </div>
          <div className={styles.loaders}>
            {loaders.map((l) => (
              <article key={l.id} className={styles.loader}>
                <div className={styles.stage}>
                  <KPlusMark variant={l.id} className={l.id === "word" ? styles.word : styles.mark} />
                </div>
                <div className={`${styles.stage} ${styles.light}`}>
                  <KPlusMark variant={l.id} className={l.id === "word" ? styles.wordSmall : styles.markSmall} />
                </div>
                <h3>{l.name}</h3>
                <p>{l.note}</p>
                <button type="button" className={styles.play} onClick={() => setScreen(l.id)}>
                  Play as loading screen <span aria-hidden="true">↗</span>
                </button>
              </article>
            ))}
          </div>
        </section>
      </main>

      {screen && (
        <div className={styles.screen} role="dialog" aria-label="Loading screen preview" onClick={() => setScreen(null)}>
          <KPlusMark variant={screen} className={screen === "word" ? styles.screenWord : styles.screenMark} />
          <span>Click or press Esc to close</span>
        </div>
      )}
    </div>
  );
}
