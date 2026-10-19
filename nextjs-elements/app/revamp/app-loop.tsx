"use client";

import { useEffect, useRef, useState } from "react";

export function AppLoop({ src, poster, label, playing }: {
  src: string; poster: string; label: string; playing: boolean;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const [visible, setVisible] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const element = video.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => {
      setVisible(entry.isIntersecting);
      if (entry.isIntersecting) setLoaded(true);
    }, { threshold: 0.15 });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const element = video.current;
    if (!element) return;
    const update = () => {
      if (loaded && visible && playing && !document.hidden) {
        element.play().catch(() => { /* The poster remains if playback is unavailable. */ });
      } else element.pause();
    };
    update();
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, [loaded, visible, playing]);

  return <video ref={video} src={loaded ? src : undefined} poster={poster}
    width={360} height={800} muted loop playsInline preload="none"
    aria-label={label} />;
}
