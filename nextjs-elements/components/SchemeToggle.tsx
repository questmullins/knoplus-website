// Flips light and dark mode; public/scheme.js does the work, so this only needs the data-scheme-toggle attribute.
export function SchemeToggle({ className = "" }: { className?: string }) {
  return (
    <button className={`scheme-toggle ${className}`.trim()} data-scheme-toggle="" type="button" aria-label="Switch between light and dark mode" title="Light or dark">
      <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
        <circle cx="10" cy="10" r="7.25" fill="none" stroke="currentColor" strokeWidth="1.75" />
        <path d="M10 2.75a7.25 7.25 0 0 1 0 14.5z" fill="currentColor" />
      </svg>
    </button>
  );
}
