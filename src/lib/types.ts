export type SourceType =
  | "search"
  | "ai-travel"
  | "curated-itinerary"
  | "community"
  | "curator"
  | "host"
  | "referral";

export type GuestType = "solo" | "friends" | "family" | "group";

export interface Source {
  id: string;
  label: string;
  type: SourceType;
  country: string;
  /** For referral sources: the trip whose guest shared the link. */
  referrerTripId?: string;
}

/** "checked-in": the guest tapped "I've arrived"; only staff can move it on to "visited". */
export type TripStatus = "discovered" | "saved" | "checked-in" | "visited";

export interface Trip {
  id: string;
  /** Links the trip to the discovery events of the same browser visitor. */
  visitorId: string;
  name: string;
  originCity: string;
  /** ISO date (YYYY-MM-DD) */
  travelFrom: string;
  /** ISO date (YYYY-MM-DD) */
  travelTo: string;
  groupSize: number;
  guestType: GuestType;
  sourceId: string | null;
  /** ISO timestamp */
  savedAt: string;
  arrivalCode: string;
  status: TripStatus;
  /** ISO timestamp of the guest's own "I've arrived" tap. Never counts as verification. */
  checkedInAt?: string;
}

export interface Visit {
  tripId: string;
  confirmedAt: string;
  confirmedBy: string;
}

export interface Story {
  id: string;
  author: string;
  text: string;
  verifiedVisit: boolean;
  tripId?: string;
}

export interface Referral {
  id: string;
  fromTripId: string;
  /** The referral Source created for this guest's share link. */
  sourceId: string;
  /** Who the guest is referring back through. Older referrals may not have one. */
  channel?: ReferralChannel;
  createdAt: string;
}

export type EventType =
  | "discovered"
  | "interested"
  | "saved"
  | "checked_in"
  | "visit_confirmed"
  | "referred"
  | "question_asked"
  | "question_answered";

/** Where a guest chose to refer De Klinic back to. */
export type ReferralChannel = "community" | "host" | "curator";

/** A traveller question the demo assistant could not answer, passed on to De Klinic. */
export interface Question {
  id: string;
  text: string;
  createdAt: string;
  tripId?: string;
  status: "open" | "answered";
  answeredAt?: string;
}

/** Append-only log: every journey timeline is derived from this. */
export interface JourneyEvent {
  id: string;
  type: EventType;
  at: string;
  visitorId: string;
  tripId: string | null;
  sourceId: string | null;
}

/** What this browser's traveller has done so far in the journey. */
export interface Session {
  visitorId: string;
  sourceId: string | null;
  /** The raw ?src value, kept so we can show "link not recognised". */
  rawSrc: string | null;
  discoveredAt: string | null;
  interestedAt: string | null;
  tripId: string | null;
}

export interface AppState {
  version: number;
  sources: Source[];
  trips: Trip[];
  visits: Visit[];
  stories: Story[];
  referrals: Referral[];
  events: JourneyEvent[];
  questions: Question[];
  session: Session;
}
