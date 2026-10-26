"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { K, PLUS_FOLD, PLUS_SCISSOR, align, ease, ends, mix, spin, type Shape } from "./geometry";

export type Variant = "scissor" | "fold" | "word";

type Step = { dur: number; to?: Shape; spin?: number; reveal?: number; ease?: (t: number) => number };
type Frame = { shape: Shape; reveal: number };
type Compiled = { start: number; dur: number; from: Frame; to: Frame; step: Step }[];

const swappedK: Shape = [K[0], K[2], K[1]];

const timelines: Record<Variant, Step[]> = {
  scissor: [
    { dur: 600 },
    { dur: 750, to: PLUS_SCISSOR, ease: ease.back },
    { dur: 250 },
    { dur: 600, spin: 180 },
    { dur: 200 },
    // After half a turn the two arms have traded places, so each goes home to the other's spot.
    { dur: 750, to: swappedK, ease: ease.back },
  ],
  fold: [
    { dur: 650 },
    { dur: 700, to: PLUS_FOLD, ease: ease.back },
    { dur: 650 },
    { dur: 700, to: K },
  ],
  word: [
    { dur: 1100 },
    { dur: 520, reveal: 0 },
    { dur: 650, to: PLUS_SCISSOR, ease: ease.back },
    { dur: 700 },
    { dur: 600, to: K },
    { dur: 600, reveal: 1, ease: ease.back },
  ],
};

function compile(steps: Step[]): { parts: Compiled; total: number } {
  let frame: Frame = { shape: K, reveal: 1 };
  let start = 0;
  const parts: Compiled = steps.map((step) => {
    const to: Frame = {
      shape: step.spin ? spin(frame.shape, step.spin) : step.to ? align(frame.shape, step.to) : frame.shape,
      reveal: step.reveal ?? frame.reveal,
    };
    const part = { start, dur: step.dur, from: frame, to, step };
    frame = to;
    start += step.dur;
    return part;
  });
  return { parts, total: start };
}

function sample({ parts, total }: { parts: Compiled; total: number }, ms: number): Frame {
  const t = ms % total;
  const part = parts.find((p) => t < p.start + p.dur) ?? parts[parts.length - 1];
  const raw = Math.min(1, (t - part.start) / part.dur);
  const e = (part.step.ease ?? ease.inOut)(raw);
  const reveal = part.from.reveal + (part.to.reveal - part.from.reveal) * Math.min(1, Math.max(0, e));
  const shape = part.step.spin ? spin(part.from.shape, part.step.spin * e) : mix(part.from.shape, part.to.shape, e);
  return { shape, reveal };
}

function useClock(playing: boolean) {
  const [ms, setMs] = useState(0);
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    if (!playing || reduced) return;
    let raf = 0;
    const begin = performance.now();
    const tick = (now: number) => {
      setMs(now - begin);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, reduced]);
  return ms;
}

function Strokes({ shape, width }: { shape: Shape; width: number }) {
  return (
    <>
      {shape.map((p, i) => {
        const e = ends(p);
        return <line key={i} {...e} strokeWidth={width} />;
      })}
    </>
  );
}

// N, O and + for the full KNO+ wordmark, laid out to the right of the K in one 100-high row.
const N: Shape = [
  { x: 92, y: 50, a: 90, l: 68 },
  { x: 118, y: 50, a: Math.atan2(68, 52) * (180 / Math.PI), l: Math.hypot(52, 68) },
  { x: 144, y: 50, a: 90, l: 68 },
];
const PLUS_SMALL: Shape = [
  { x: 270, y: 50, a: 0, l: 68 },
  { x: 270, y: 50, a: 90, l: 68 },
];

export function KPlusMark({
  variant,
  playing = true,
  stroke = 10,
  className,
  label = "K turning into a plus",
}: {
  variant: Variant;
  playing?: boolean;
  stroke?: number;
  className?: string;
  label?: string;
}) {
  const timeline = useMemo(() => compile(timelines[variant]), [variant]);
  const ms = useClock(playing);
  const { shape, reveal } = sample(timeline, ms);
  const clip = useId();
  // Trimming everything to the cap height gives the arms flat, Kanit-style ends.
  const capHeight = (
    <defs>
      <clipPath id={clip}>
        <rect x={-400} y={16} width={1200} height={68} />
      </clipPath>
    </defs>
  );

  if (variant !== "word") {
    return (
      <svg className={className} viewBox="0 0 100 100" role="img" aria-label={label}>
        {capHeight}
        <g stroke="currentColor" fill="none" clipPath={`url(#${clip})`}>
          <Strokes shape={shape} width={stroke} />
        </g>
      </svg>
    );
  }

  // The letters after the K tuck in behind it, then the K turns into the +.
  const hidden = 1 - reveal;
  const slide = (x: number) => `translate(${-(x - 50) * hidden} 0)`;
  return (
    <svg className={className} viewBox="0 0 320 100" role="img" aria-label="KNO+ folding into a plus">
      {capHeight}
      <g stroke="currentColor" fill="none" clipPath={`url(#${clip})`} transform={`translate(${110 * hidden} 0)`}>
        <g opacity={Math.max(0, reveal)} transform={slide(118)}>
          <Strokes shape={N} width={stroke} />
        </g>
        <g opacity={Math.max(0, reveal)} transform={slide(194)}>
          <ellipse cx={194} cy={50} rx={28 - stroke / 2} ry={34 - stroke / 2} strokeWidth={stroke} />
        </g>
        <g opacity={Math.max(0, reveal)} transform={slide(270)}>
          <Strokes shape={PLUS_SMALL} width={stroke} />
        </g>
        <Strokes shape={shape} width={stroke} />
      </g>
    </svg>
  );
}
