"use client";

import { createContext, useContext, useEffect, useState } from "react";
import data from "./catalog.json";

// RoseWave's worker hands this store its photos through its public web/ routes: the 2400-pixel copy of every set photo
// for viewing and buying, the live print menu, and checkout. Print originals never leave it. Set
// NEXT_PUBLIC_ROSEWAVE_API to the worker's address when building, and list this site's address in the worker's
// SITE_ORIGIN. Until both are set, or if the worker can't be reached, the store shows the 1200-pixel copies kept in
// public/revamp/rosewave-gallery/photos and the dated print menu in catalog.json, and checkout stays closed.
export const API = (process.env.NEXT_PUBLIC_ROSEWAVE_API || "").replace(/\/+$/, "");

type WebPhoto = { file: string; view: string; w: number; h: number };
type WebSet = { name: string; photos: WebPhoto[] };
type WebMenu = { types: { id: string; sizes: { id: string; cents: number }[] }[] };
export type LivePhoto = { file: string; view: string; full: string };
type Live = { photos: Record<string, LivePhoto>; prices: Record<string, number> };
const plain = (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, "");

const LiveData = createContext<Live>({ photos: {}, prices: {} });
export const useLivePhoto = (photoId: string): LivePhoto | undefined => useContext(LiveData).photos[photoId];
export const useLivePrice = (typeId: string, sizeId: string) => useContext(LiveData).prices[typeId + ":" + sizeId];

// Photo ids to the worker's addresses. Sets are matched by name and photos by place (the free photo first in both),
// and a photo whose shape differs from ours keeps the local copy rather than risk showing, or selling, the wrong one.
export function useLiveData() {
  const [live, setLive] = useState<Live>({ photos: {}, prices: {} });
  useEffect(() => {
    if (!API) return;
    let stale = false;
    const get = <T,>(path: string) => fetch(`${API}/web/${path}`).then(response => response.ok ? response.json() as Promise<T> : null).catch(() => null);
    Promise.all([get<{ sets: WebSet[] }>("manifest.json"), get<WebMenu>("catalog.json")]).then(([manifest, menu]) => {
      if (stale) return;
      const photos: Record<string, LivePhoto> = {};
      for (const collection of data.collections) {
        const set = manifest?.sets.find(item => plain(item.name) === plain(collection.name));
        collection.photos.forEach((photo, index) => {
          const match = set?.photos[index];
          if (match?.file && Math.abs(match.w / match.h - photo.width / photo.height) < .02) {
            photos[photo.id] = { file: match.file, view: `${API}/web/${match.view || match.file}`, full: `${API}/web/${match.file}` };
          }
        });
      }
      const prices: Record<string, number> = {};
      for (const type of menu?.types || []) for (const size of type.sizes) prices[type.id + ":" + size.id] = size.cents;
      setLive({ photos, prices });
    });
    return () => { stale = true; };
  }, []);
  return live;
}

// Opens RoseWave's payment page for one print. The worker prices it and works out shipping itself.
export async function checkout(file: string, type: string, size: string, finish: string) {
  const response = await fetch(`${API}/web/checkout`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ file, type, size, finish }),
  });
  const answer = await response.json().catch(() => ({})) as { url?: string; error?: string };
  if (!response.ok || !answer.url) throw new Error(answer.error || "Checkout couldn’t open just now. Try again in a minute.");
  window.location.assign(answer.url);
}

export const LiveDataProvider = LiveData.Provider;
