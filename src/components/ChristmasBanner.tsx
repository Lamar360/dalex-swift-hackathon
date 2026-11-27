import { useState } from "react";

const DISMISS_KEY = "deklinic.xmasBannerDismissed";

function readDismissed() {
  try {
    return localStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

/** December mode only: a small, dismissible seasonal greeting with CSS-only trees. */
export function ChristmasBanner() {
  const [dismissed, setDismissed] = useState(readDismissed);
  if (dismissed) return null;

  return (
    <aside
      aria-label="Seasonal greeting"
      className="flex items-center gap-3 rounded-2xl bg-palm-100 py-2.5 pr-2 pl-4 text-palm-600 shadow-[var(--shadow-card)]"
      data-testid="xmas-banner"
    >
      <span className="xmas-trees flex shrink-0 items-end gap-1" aria-hidden>
        <span className="xmas-tree" />
        <span className="xmas-tree xmas-tree--big" />
        <span className="xmas-tree" />
      </span>
      <p className="flex-1 text-sm leading-snug font-semibold">
        Akwaaba, Happy Christmas! Planning a December trip to Ghana?
      </p>
      <button
        type="button"
        onClick={() => {
          try {
            localStorage.setItem(DISMISS_KEY, "1");
          } catch {
            // Storage blocked: hide for this view only.
          }
          setDismissed(true);
        }}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full hover:bg-palm-600/10"
        aria-label="Dismiss seasonal greeting"
        data-testid="xmas-dismiss"
      >
        <svg aria-hidden viewBox="0 0 16 16" className="h-4 w-4">
          <path d="M3 3l10 10M13 3 3 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </button>
    </aside>
  );
}
