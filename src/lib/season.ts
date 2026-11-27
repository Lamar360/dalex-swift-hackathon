import { useSyncExternalStore } from "react";

/**
 * Season helper: the one place that decides whether the app is in "December mode".
 * "auto" follows today's date; the demo can force either season from the Demo menu.
 */
export type SeasonMode = "auto" | "december" | "not-december";

const KEY = "deklinic.season";
const listeners = new Set<() => void>();

export function getSeasonMode(): SeasonMode {
  try {
    const v = localStorage.getItem(KEY);
    if (v === "december" || v === "not-december") return v;
  } catch {
    // Storage blocked: fall back to auto.
  }
  return "auto";
}

export function isDecember(now: Date = new Date()): boolean {
  const mode = getSeasonMode();
  return mode === "auto" ? now.getMonth() === 11 : mode === "december";
}

export function setSeasonMode(mode: SeasonMode) {
  try {
    if (mode === "auto") localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, mode);
  } catch {
    // Private mode: the switch still works for this tab.
  }
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  const onStorage = (e: StorageEvent) => e.key === KEY && l();
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(l);
    window.removeEventListener("storage", onStorage);
  };
}

/** Re-renders when the season mode changes. */
export function useSeason() {
  const mode = useSyncExternalStore(subscribe, getSeasonMode);
  return { mode, december: mode === "auto" ? isDecember() : mode === "december" };
}
