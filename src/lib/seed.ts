import type { AppState } from "./types";

/**
 * SAMPLE DATA ONLY. None of these people, groups or quotes are real.
 * Nothing here is a fact about De Klinic Restaurant & Pub.
 */
export const STATE_VERSION = 1;

export function createSeed(): AppState {
  return {
    version: STATE_VERSION,
    sources: [
      {
        id: "ldn-ghana-circle",
        label: "London Ghanaian Diaspora Circle",
        type: "community",
        country: "United Kingdom",
      },
      {
        id: "ai-accra-guide",
        label: "AI travel answer: “Where to eat in Accra this December?”",
        type: "ai-travel",
        country: "Worldwide",
      },
      {
        id: "afrobeat-routes",
        label: "Afrobeat Routes travel curator",
        type: "curator",
        country: "United States",
      },
    ],
    trips: [
      {
        id: "trip-demo-uk",
        name: "Akosua Mensah (sample)",
        originCity: "London, UK",
        travelFrom: "2026-12-18",
        travelTo: "2027-01-03",
        groupSize: 4,
        sourceId: "ldn-ghana-circle",
        savedAt: "2026-11-20T19:42:00.000Z",
        arrivalCode: "DK-7HQ4",
        status: "saved",
      },
    ],
    visits: [],
    stories: [
      {
        id: "story-1",
        author: "Kwame, visiting from Manchester (sample)",
        text: "Came straight from the airport with my cousins. We showed our code at the door and felt expected, not like tourists.",
        verifiedVisit: true,
      },
      {
        id: "story-2",
        author: "Efua, visiting from Houston (sample)",
        text: "Found it through a travel curator's list. Good place to gather the whole family on our first night back home.",
        verifiedVisit: true,
      },
      {
        id: "story-3",
        author: "Anonymous (sample)",
        text: "Heard great things, planning to go next trip!",
        verifiedVisit: false,
      },
    ],
    referrals: [],
    session: {
      sourceId: null,
      rawSrc: null,
      discoveredAt: null,
      interestedAt: null,
      tripId: null,
    },
  };
}
