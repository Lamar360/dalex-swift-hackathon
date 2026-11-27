import type { AppState, JourneyEvent, Trip } from "./types";

/**
 * SAMPLE DATA ONLY. None of these people, groups or quotes are real.
 * Nothing here is a fact about De Klinic Restaurant & Pub.
 */
export const STATE_VERSION = 3;

export const DEMO_ARRIVAL_CODE = "DK-7HQ4";

export function newId(prefix: string) {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
}

type SeedTrip = Omit<Trip, "visitorId" | "status"> & {
  discoveredAt: string;
  visitedAt?: string;
};

const SEED_TRIPS: SeedTrip[] = [
  {
    id: "trip-demo-uk",
    name: "Akosua Mensah (sample)",
    originCity: "London, UK",
    travelFrom: "2026-12-18",
    travelTo: "2027-01-03",
    groupSize: 4,
    guestType: "family",
    sourceId: "ldn-ghana-circle",
    discoveredAt: "2026-11-19T21:05:00.000Z",
    savedAt: "2026-11-20T19:42:00.000Z",
    arrivalCode: DEMO_ARRIVAL_CODE,
  },
  {
    id: "trip-s2",
    name: "Kwame Boateng (sample)",
    originCity: "Manchester, UK",
    travelFrom: "2026-10-30",
    travelTo: "2026-11-14",
    groupSize: 3,
    guestType: "friends",
    sourceId: "ldn-ghana-circle",
    discoveredAt: "2026-10-02T18:10:00.000Z",
    savedAt: "2026-10-03T08:30:00.000Z",
    visitedAt: "2026-11-01T19:20:00.000Z",
    arrivalCode: "DK-K3MP",
  },
  {
    id: "trip-s3",
    name: "Efua Asante (sample)",
    originCity: "Houston, USA",
    travelFrom: "2026-11-06",
    travelTo: "2026-11-22",
    groupSize: 5,
    guestType: "family",
    sourceId: "afrobeat-routes",
    discoveredAt: "2026-10-11T02:40:00.000Z",
    savedAt: "2026-10-11T03:05:00.000Z",
    visitedAt: "2026-11-08T20:15:00.000Z",
    arrivalCode: "DK-R8TW",
  },
  {
    id: "trip-s4",
    name: "Yaw Darko (sample)",
    originCity: "Toronto, Canada",
    travelFrom: "2026-12-20",
    travelTo: "2027-01-05",
    groupSize: 3,
    guestType: "friends",
    sourceId: "ai-accra-guide",
    discoveredAt: "2026-11-12T23:15:00.000Z",
    savedAt: "2026-11-12T23:31:00.000Z",
    arrivalCode: "DK-Y5NB",
  },
  {
    id: "trip-s5",
    name: "Abena Owusu (sample)",
    originCity: "New York, USA",
    travelFrom: "2026-12-15",
    travelTo: "2026-12-29",
    groupSize: 2,
    guestType: "friends",
    sourceId: "afrobeat-routes",
    discoveredAt: "2026-11-15T14:00:00.000Z",
    savedAt: "2026-11-16T10:12:00.000Z",
    arrivalCode: "DK-A9VE",
  },
  {
    id: "trip-s6",
    name: "Kofi Adjei (sample)",
    originCity: "Birmingham, UK",
    travelFrom: "2026-12-22",
    travelTo: "2027-01-02",
    groupSize: 6,
    guestType: "group",
    sourceId: "ref-trip-s2",
    discoveredAt: "2026-11-18T17:45:00.000Z",
    savedAt: "2026-11-18T18:02:00.000Z",
    arrivalCode: "DK-F6GH",
  },
  {
    id: "trip-s7",
    name: "Nana Ofori (sample)",
    originCity: "Washington DC, USA",
    travelFrom: "2026-12-21",
    travelTo: "2027-01-06",
    groupSize: 1,
    guestType: "solo",
    sourceId: "ghana-travel-search",
    discoveredAt: "2026-11-13T15:20:00.000Z",
    savedAt: "2026-11-14T09:05:00.000Z",
    arrivalCode: "DK-N4QS",
  },
  {
    id: "trip-s8",
    name: "Esi Quaye (sample)",
    originCity: "Amsterdam, Netherlands",
    travelFrom: "2026-12-17",
    travelTo: "2026-12-31",
    groupSize: 5,
    guestType: "family",
    sourceId: "dec-accra-itinerary",
    discoveredAt: "2026-11-16T07:50:00.000Z",
    savedAt: "2026-11-16T08:14:00.000Z",
    arrivalCode: "DK-E2XC",
  },
  {
    id: "trip-s9",
    name: "Kojo Amponsah (sample)",
    originCity: "Berlin, Germany",
    travelFrom: "2026-11-03",
    travelTo: "2026-11-17",
    groupSize: 3,
    guestType: "friends",
    sourceId: "accra-host",
    discoveredAt: "2026-11-04T12:30:00.000Z",
    savedAt: "2026-11-04T12:41:00.000Z",
    visitedAt: "2026-11-07T21:10:00.000Z",
    arrivalCode: "DK-J7PD",
  },
];

/** Visitors who arrived via a source but have not saved a trip (yet). */
const SEED_DISCOVERIES: { sourceId: string | null; at: string }[] = [
  { sourceId: "ai-accra-guide", at: "2026-11-10T09:00:00.000Z" },
  { sourceId: "ai-accra-guide", at: "2026-11-14T11:30:00.000Z" },
  { sourceId: "ai-accra-guide", at: "2026-11-21T16:20:00.000Z" },
  { sourceId: "ldn-ghana-circle", at: "2026-11-17T20:00:00.000Z" },
  { sourceId: "ldn-ghana-circle", at: "2026-11-22T19:10:00.000Z" },
  { sourceId: "afrobeat-routes", at: "2026-11-19T13:40:00.000Z" },
  { sourceId: "ref-trip-s2", at: "2026-11-20T08:25:00.000Z" },
  { sourceId: "ghana-travel-search", at: "2026-11-18T10:15:00.000Z" },
  { sourceId: "ghana-travel-search", at: "2026-11-21T22:40:00.000Z" },
  { sourceId: "dec-accra-itinerary", at: "2026-11-19T06:55:00.000Z" },
  { sourceId: "accra-host", at: "2026-11-20T18:30:00.000Z" },
  { sourceId: null, at: "2026-11-23T12:00:00.000Z" },
];

export function createSeed(): AppState {
  const events: JourneyEvent[] = [];
  const log = (e: Omit<JourneyEvent, "id">) => events.push({ id: `evt-${events.length + 1}`, ...e });

  const trips: Trip[] = SEED_TRIPS.map((t) => {
    const visitorId = `visitor-${t.id}`;
    const { discoveredAt, visitedAt, ...rest } = t;
    log({ type: "discovered", at: discoveredAt, visitorId, tripId: null, sourceId: t.sourceId });
    log({ type: "saved", at: t.savedAt, visitorId, tripId: t.id, sourceId: t.sourceId });
    if (visitedAt) log({ type: "visit_confirmed", at: visitedAt, visitorId, tripId: t.id, sourceId: t.sourceId });
    return { ...rest, visitorId, status: visitedAt ? "visited" : "saved" };
  });

  SEED_DISCOVERIES.forEach((d, i) =>
    log({ type: "discovered", at: d.at, visitorId: `visitor-browse-${i + 1}`, tripId: null, sourceId: d.sourceId }),
  );

  const kwameReferral = "2026-11-15T10:00:00.000Z";
  log({ type: "referred", at: kwameReferral, visitorId: "visitor-trip-s2", tripId: "trip-s2", sourceId: "ref-trip-s2" });

  events.sort((a, b) => a.at.localeCompare(b.at));

  return {
    version: STATE_VERSION,
    sources: [
      { id: "ghana-travel-search", label: "Ghana travel search (sample)", type: "search", country: "Worldwide" },
      { id: "ldn-ghana-circle", label: "London Ghanaian Diaspora Circle", type: "community", country: "United Kingdom" },
      {
        id: "ai-accra-guide",
        label: "AI travel answer: “Where to eat in Accra this December?”",
        type: "ai-travel",
        country: "Worldwide",
      },
      {
        id: "dec-accra-itinerary",
        label: "December in Accra itinerary (sample)",
        type: "curated-itinerary",
        country: "Worldwide",
      },
      { id: "afrobeat-routes", label: "Afrobeat Routes travel curator", type: "curator", country: "United States" },
      { id: "accra-host", label: "Host in Accra (sample)", type: "host", country: "Ghana" },
      {
        id: "ref-trip-s2",
        label: "Referred by Kwame Boateng (sample)",
        type: "referral",
        country: "United Kingdom",
        referrerTripId: "trip-s2",
      },
    ],
    trips,
    visits: [
      { tripId: "trip-s2", confirmedAt: "2026-11-01T19:20:00.000Z", confirmedBy: "De Klinic staff (demo)" },
      { tripId: "trip-s3", confirmedAt: "2026-11-08T20:15:00.000Z", confirmedBy: "De Klinic staff (demo)" },
      { tripId: "trip-s9", confirmedAt: "2026-11-07T21:10:00.000Z", confirmedBy: "De Klinic staff (demo)" },
    ],
    stories: [
      {
        id: "story-1",
        author: "Kwame, visiting from Manchester (sample)",
        text: "Came straight from the airport with my cousins. We showed our code at the door and felt expected, not like tourists.",
        verifiedVisit: true,
        tripId: "trip-s2",
      },
      {
        id: "story-2",
        author: "Efua, visiting from Houston (sample)",
        text: "Found it through a travel curator's list. Good place to gather the whole family on our first night back home.",
        verifiedVisit: true,
        tripId: "trip-s3",
      },
      {
        id: "story-3",
        author: "Anonymous (sample)",
        text: "Heard great things, planning to go next trip!",
        verifiedVisit: false,
      },
    ],
    referrals: [{ id: "ref-1", fromTripId: "trip-s2", sourceId: "ref-trip-s2", createdAt: kwameReferral }],
    events,
    session: {
      visitorId: newId("visitor"),
      sourceId: null,
      rawSrc: null,
      discoveredAt: null,
      interestedAt: null,
      tripId: null,
    },
  };
}
