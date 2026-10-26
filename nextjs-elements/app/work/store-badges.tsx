import s from "./services-showcase.module.css";

export function StoreBadges() {
  return <div className={s.storeBadges}>
    <button type="button" disabled className={s.playBadge} aria-label="Coming soon to Google Play for Android">
      <svg viewBox="0 0 24 28" width="24" height="28" aria-hidden="true"><path d="M3 2 22 14 3 26Z" fill="none" stroke="currentColor" /><path d="m3 2 13 17M3 26 16 9" stroke="currentColor" fill="none" /></svg>
      <span><small>COMING SOON TO</small><strong>Google Play</strong></span>
    </button>
    <span className={s.android}><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="m7 5-2-3m12 3 2-3M3 13a9 9 0 0 1 18 0H3Zm0 0v6h18v-6" fill="none" stroke="currentColor" strokeWidth="1.2" /><circle cx="8" cy="10" r="1" fill="currentColor"/><circle cx="16" cy="10" r="1" fill="currentColor"/></svg>Android</span>
  </div>;
}
