import { useSyncExternalStore } from "react";
import { createSeed, STATE_VERSION } from "./seed";
import type { AppState, Source, Trip } from "./types";

/**
 * The app's only persistence layer: one typed state object in localStorage.
 * Components read it with `useStore(selector)` and change it through the
 * action functions exported below.
 */

const STORAGE_KEY = "deklinic.journey.v1";

function load(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AppState;
      if (parsed.version === STATE_VERSION) return parsed;
    }
  } catch {
    // Storage blocked or corrupt: fall back to seed data.
  }
  return createSeed();
}

let state: AppState = load();
const listeners = new Set<() => void>();

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Private mode etc: the demo still works for this tab.
  }
}

function setState(update: (s: AppState) => AppState) {
  state = update(state);
  persist();
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getState(): AppState {
  return state;
}

export function useStore<T>(selector: (s: AppState) => T): T {
  return useSyncExternalStore(subscribe, () => selector(state));
}

// ---------- selectors ----------

export function findSource(s: AppState, id: string | null): Source | undefined {
  return id ? s.sources.find((src) => src.id === id) : undefined;
}

export function currentTrip(s: AppState): Trip | undefined {
  return s.session.tripId ? s.trips.find((t) => t.id === s.session.tripId) : undefined;
}

// ---------- actions ----------

/** Called by the Discover screen with the raw ?src value. */
export function recordDiscovery(rawSrc: string | null) {
  const match = rawSrc ? state.sources.find((s) => s.id === rawSrc) : undefined;
  const { session } = state;
  // A link with no src does not wipe an earlier recorded source.
  if (!rawSrc && session.discoveredAt) return;
  if (rawSrc === session.rawSrc && session.discoveredAt) return;
  setState((s) => ({
    ...s,
    session: {
      ...s.session,
      rawSrc,
      sourceId: match?.id ?? null,
      discoveredAt: new Date().toISOString(),
    },
  }));
}

export function markInterested() {
  setState((s) => ({
    ...s,
    session: { ...s.session, interestedAt: new Date().toISOString() },
  }));
}

// Unambiguous characters only (no 0/O, 1/I/L) so codes read well aloud.
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function generateArrivalCode(existing: string[]): string {
  for (;;) {
    const bytes = crypto.getRandomValues(new Uint8Array(4));
    const body = Array.from(bytes, (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join("");
    const code = `DK-${body}`;
    if (!existing.includes(code)) return code;
  }
}

export interface SaveTripInput {
  name: string;
  originCity: string;
  travelFrom: string;
  travelTo: string;
  groupSize: number;
}

export function saveTrip(input: SaveTripInput): Trip {
  const trip: Trip = {
    id: `trip-${crypto.randomUUID().slice(0, 8)}`,
    ...input,
    sourceId: state.session.sourceId,
    savedAt: new Date().toISOString(),
    arrivalCode: generateArrivalCode(state.trips.map((t) => t.arrivalCode)),
    status: "saved",
  };
  setState((s) => ({
    ...s,
    trips: [...s.trips, trip],
    session: { ...s.session, tripId: trip.id },
  }));
  return trip;
}

/** Lets the traveller start a fresh trip form (keeps their source). */
export function clearCurrentTrip() {
  setState((s) => ({ ...s, session: { ...s.session, tripId: null } }));
}

export function resetDemo() {
  setState(() => createSeed());
}
