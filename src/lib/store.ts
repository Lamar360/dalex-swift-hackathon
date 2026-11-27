import { useSyncExternalStore } from "react";
import { createSeed, newId, STATE_VERSION } from "./seed";
import type { AppState, EventType, JourneyEvent, Referral, Source, Trip } from "./types";

/**
 * The app's only persistence layer: one typed state object in localStorage.
 * Components read it with `useStore(selector)` and change it through the
 * action functions exported below. Selectors must return stable references
 * (raw slices or items found in them), never freshly built arrays.
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

function emit() {
  listeners.forEach((l) => l());
}

function setState(update: (s: AppState) => AppState) {
  state = update(state);
  persist();
  emit();
}

// Keep tabs in sync, so a staff tab and a traveller tab can run side by side.
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === STORAGE_KEY) {
      state = load();
      emit();
    }
  });
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

export function findSource(s: AppState, id: string | null | undefined): Source | undefined {
  return id ? s.sources.find((src) => src.id === id) : undefined;
}

export function currentTrip(s: AppState): Trip | undefined {
  return s.session.tripId ? s.trips.find((t) => t.id === s.session.tripId) : undefined;
}

export function findTripByCode(s: AppState, code: string): Trip | undefined {
  return s.trips.find((t) => t.arrivalCode === code);
}

export function referralForTrip(s: AppState, tripId: string | undefined): Referral | undefined {
  return tripId ? s.referrals.find((r) => r.fromTripId === tripId) : undefined;
}

/** A guest's full journey: their own events plus guests their link brought in. */
export function tripTimeline(s: AppState, trip: Trip): JourneyEvent[] {
  const refSourceId = referralForTrip(s, trip.id)?.sourceId;
  return s.events
    .filter(
      (e) =>
        e.tripId === trip.id ||
        (e.visitorId === trip.visitorId && e.type === "discovered") ||
        (refSourceId !== undefined && e.sourceId === refSourceId && e.type === "discovered"),
    )
    .sort((a, b) => a.at.localeCompare(b.at));
}

/** Normalises "dk 7hq4", "7HQ4", "DK7HQ4" to "DK-7HQ4". */
export function normaliseCode(input: string): string {
  const body = input.toUpperCase().replace(/[^A-Z0-9]/g, "").replace(/^DK/, "");
  return body ? `DK-${body}` : "";
}

// ---------- actions ----------

function event(type: EventType, s: AppState, fields: Partial<JourneyEvent> = {}): JourneyEvent {
  return {
    id: newId("evt"),
    type,
    at: new Date().toISOString(),
    visitorId: s.session.visitorId,
    tripId: null,
    sourceId: s.session.sourceId,
    ...fields,
  };
}

/** Called by the Discover screen with the raw ?src value. */
export function recordDiscovery(rawSrc: string | null) {
  const { session } = state;
  // A link with no src does not wipe an earlier recorded source.
  if (!rawSrc && session.discoveredAt) return;
  if (rawSrc === session.rawSrc && session.discoveredAt) return;
  const match = rawSrc ? state.sources.find((s) => s.id === rawSrc) : undefined;
  setState((s) => {
    // A different link means a new arriving guest in this demo browser.
    const fresh = s.session.discoveredAt !== null;
    const session = {
      visitorId: fresh ? newId("visitor") : s.session.visitorId,
      rawSrc,
      sourceId: match?.id ?? null,
      discoveredAt: new Date().toISOString(),
      interestedAt: fresh ? null : s.session.interestedAt,
      tripId: fresh ? null : s.session.tripId,
    };
    const next = { ...s, session };
    return { ...next, events: [...s.events, event("discovered", next)] };
  });
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
    id: newId("trip"),
    visitorId: state.session.visitorId,
    ...input,
    sourceId: state.session.sourceId,
    savedAt: new Date().toISOString(),
    arrivalCode: generateArrivalCode(state.trips.map((t) => t.arrivalCode)),
    status: "saved",
  };
  setState((s) => {
    const events = [...s.events];
    // Guests who land straight on /trip still need a discovery on record.
    if (!s.session.discoveredAt) events.push(event("discovered", s));
    events.push(event("saved", s, { tripId: trip.id }));
    return {
      ...s,
      trips: [...s.trips, trip],
      events,
      session: { ...s.session, tripId: trip.id, discoveredAt: s.session.discoveredAt ?? trip.savedAt },
    };
  });
  return trip;
}

export function confirmVisit(tripId: string) {
  setState((s) => {
    const trip = s.trips.find((t) => t.id === tripId);
    if (!trip || trip.status !== "saved") return s;
    const confirmedAt = new Date().toISOString();
    return {
      ...s,
      trips: s.trips.map((t) => (t.id === tripId ? { ...t, status: "visited" } : t)),
      visits: [...s.visits, { tripId, confirmedAt, confirmedBy: "De Klinic staff (demo)" }],
      events: [
        ...s.events,
        event("visit_confirmed", s, { at: confirmedAt, tripId, visitorId: trip.visitorId, sourceId: trip.sourceId }),
      ],
    };
  });
}

export function addStory(tripId: string, text: string) {
  setState((s) => {
    const trip = s.trips.find((t) => t.id === tripId);
    if (!trip || trip.status !== "visited") return s;
    const first = trip.name.replace(/\s*\(sample\)$/, "").split(" ")[0];
    return {
      ...s,
      stories: [
        { id: newId("story"), author: `${first}, visiting from ${trip.originCity} (demo guest)`, text, verifiedVisit: true, tripId },
        ...s.stories,
      ],
    };
  });
}

/** Creates (once) the referral Source + Referral for a visited trip. */
export function createReferral(tripId: string): Referral | undefined {
  const existing = referralForTrip(state, tripId);
  if (existing) return existing;
  const trip = state.trips.find((t) => t.id === tripId);
  if (!trip || trip.status !== "visited") return undefined;
  const sourceId = `ref-${trip.id}`;
  const referral: Referral = { id: newId("ref"), fromTripId: trip.id, sourceId, createdAt: new Date().toISOString() };
  setState((s) => ({
    ...s,
    sources: [
      ...s.sources,
      {
        id: sourceId,
        label: `Referred by ${trip.name}`,
        type: "referral",
        country: trip.originCity,
        referrerTripId: trip.id,
      },
    ],
    referrals: [...s.referrals, referral],
    events: [
      ...s.events,
      event("referred", s, { at: referral.createdAt, tripId: trip.id, visitorId: trip.visitorId, sourceId }),
    ],
  }));
  return referral;
}

/** Lets the traveller start a fresh trip form (keeps their source). */
export function clearCurrentTrip() {
  setState((s) => ({ ...s, session: { ...s.session, tripId: null } }));
}

export function resetDemo() {
  setState(() => createSeed());
}
