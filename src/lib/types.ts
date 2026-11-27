export type SourceType = "community" | "ai-travel" | "curator";

export interface Source {
  id: string;
  label: string;
  type: SourceType;
  country: string;
}

export type TripStatus = "discovered" | "saved" | "visited";

export interface Trip {
  id: string;
  name: string;
  originCity: string;
  /** ISO date (YYYY-MM-DD) */
  travelFrom: string;
  /** ISO date (YYYY-MM-DD) */
  travelTo: string;
  groupSize: number;
  sourceId: string | null;
  /** ISO timestamp */
  savedAt: string;
  arrivalCode: string;
  status: TripStatus;
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
}

export interface Referral {
  id: string;
  fromTripId: string;
  sourceId: string | null;
  createdAt: string;
}

/** What this browser's traveller has done so far in the journey. */
export interface Session {
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
  session: Session;
}
