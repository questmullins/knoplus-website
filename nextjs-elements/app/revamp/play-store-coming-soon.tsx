import styles from "./horizontal.module.css";

export function PlayStoreComingSoon() {
  return (
    <button className={styles.playStore} type="button" disabled aria-label="Coming soon to Google Play">
      <svg viewBox="0 0 24 28" aria-hidden="true"><path d="M3 2 22 14 3 26Z" /></svg>
      <span><small>COMING SOON TO</small><strong>Google Play</strong></span>
    </button>
  );
}
