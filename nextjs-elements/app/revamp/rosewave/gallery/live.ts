"use client";

import { createContext, useContext, useEffect, useState } from "react";
import data from "./catalog.json";

// RoseWave's worker hands this site its gallery-size photos (1400 pixels tall) through its public web/ routes; full-size
// and print files never leave it. Set NEXT_PUBLIC_ROSEWAVE_API to the worker's address when building, and list this
// site's address in the worker's SITE_ORIGIN. Until both are set, or if the worker can't be reached, the gallery shows
// the 1200-pixel copies kept in public/revamp/rosewave-gallery/photos.
export const API = (process.env.NEXT_PUBLIC_ROSEWAVE_API || "").replace(/\/+$/, "");

type WebPhoto = { view: string; w: number; h: number };
type WebSet = { name: string; photos: WebPhoto[] };
const plain = (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, "");

const LiveSources = createContext<Record<string, string>>({});
export const useLiveSource = (photoId: string) => useContext(LiveSources)[photoId];

// Photo ids to the worker's view address. Sets are matched by name and photos by place (the free photo first in both),
// and a photo whose shape differs from ours keeps the local copy rather than risk showing the wrong one.
export function useLiveSources() {
  const [sources, setSources] = useState<Record<string, string>>({});
  useEffect(() => {
    if (!API) return;
    let stale = false;
    fetch(`${API}/web/manifest.json`).then(response => response.ok ? response.json() : null).then((manifest: { sets: WebSet[] } | null) => {
      if (stale || !manifest) return;
      const found: Record<string, string> = {};
      for (const collection of data.collections) {
        const set = manifest.sets.find(item => plain(item.name) === plain(collection.name));
        collection.photos.forEach((photo, index) => {
          const match = set?.photos[index];
          if (match?.view && Math.abs(match.w / match.h - photo.width / photo.height) < .02) found[photo.id] = `${API}/web/${match.view}`;
        });
      }
      setSources(found);
    }).catch(() => { /* The local copies stay. */ });
    return () => { stale = true; };
  }, []);
  return sources;
}

export const LiveSourcesProvider = LiveSources.Provider;
