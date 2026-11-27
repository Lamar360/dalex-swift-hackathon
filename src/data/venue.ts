/**
 * Every De Klinic venue detail the app shows lives here.
 *
 * A value of `null` means "To be confirmed": the UI shows a placeholder and never presents it as fact.
 * When De Klinic confirms a detail, replace `null` with the real text (or URL) and the whole app updates:
 * the venue page, the arrival section on /trip and the demo assistant all read from this file.
 */

export interface VenueField {
  label: string;
  /** Confirmed value, or null while it is still to be confirmed with De Klinic. */
  value: string | null;
}

export const VENUE = {
  name: "De Klinic Restaurant & Pub",
  /** Area only, from the brief. The street address is still to be confirmed. */
  area: "Accra, Ghana",

  address: { label: "Address", value: null } as VenueField,
  /** A Google Maps (or similar) link. Leave null until De Klinic confirms the location. */
  mapUrl: { label: "Map link", value: null } as VenueField,
  openingHours: { label: "Opening hours", value: null } as VenueField,
  menuHighlights: { label: "Menu", value: null } as VenueField,
  prices: { label: "Prices", value: null } as VenueField,
  deliveryCoverage: { label: "Delivery coverage", value: null } as VenueField,
  groupBookings: { label: "Group bookings", value: null } as VenueField,
  events: { label: "Events", value: null } as VenueField,

  whatsapp: {
    /** Digits only, international format, as wa.me expects. SAMPLE: not a real number. */
    number: "233000000000",
    display: "+233 00 000 0000 (sample number)",
    /** Set to false once the real De Klinic number is in place. */
    isSample: true,
  },
};

export const TBC = "To be confirmed";
export const TBC_WITH_VENUE = "To be confirmed with De Klinic";

/** The "What De Klinic offers" placeholders, in display order. */
export const OFFER_FIELDS: VenueField[] = [
  VENUE.menuHighlights,
  VENUE.prices,
  VENUE.deliveryCoverage,
  VENUE.groupBookings,
  VENUE.events,
];

export function whatsappLink(text: string): string {
  return `https://wa.me/${VENUE.whatsapp.number}?text=${encodeURIComponent(text)}`;
}

export function arrivalMessage(code: string): string {
  return `Hi De Klinic, I'm on my way for my visit. My arrival code is ${code}.`;
}

/**
 * SAMPLE CONTENT, NOT REAL. Invented for the demo assistant only, so travellers can see how answers will look.
 * The venue page keeps showing "To be confirmed" for the real fields above. Every assistant answer built from
 * this block ends with SAMPLE.note. Delete this block (or replace it with confirmed values above) for real use.
 */
export interface SampleMenuItem {
  name: string;
  /** Lower-case words a traveller might type for this item. */
  keywords: string[];
  /** Sample price in Ghana cedis. Not a real price. */
  priceGhs: number;
  kind: "food" | "drink";
}

export const SAMPLE = {
  note: "Sample details, to be confirmed by De Klinic.",
  menu: [
    { name: "Jollof rice with grilled chicken", keywords: ["jollof"], priceGhs: 85, kind: "food" },
    { name: "Waakye with egg and shito", keywords: ["waakye", "shito"], priceGhs: 60, kind: "food" },
    { name: "Grilled tilapia with banku", keywords: ["tilapia", "fish", "banku"], priceGhs: 140, kind: "food" },
    { name: "Kelewele (spiced fried plantain)", keywords: ["kelewele", "plantain"], priceGhs: 35, kind: "food" },
    { name: "Red red (beans with plantain)", keywords: ["red red", "beans"], priceGhs: 55, kind: "food" },
    { name: "Club beer (bottle)", keywords: ["club", "beer", "lager"], priceGhs: 30, kind: "drink" },
    { name: "Sobolo (chilled hibiscus drink)", keywords: ["sobolo", "hibiscus", "bissap"], priceGhs: 20, kind: "drink" },
  ] as SampleMenuItem[],
  openingHours: [
    { days: ["monday", "tuesday", "wednesday", "thursday"], label: "Monday to Thursday", hours: "12:00 to 23:00" },
    { days: ["friday", "saturday"], label: "Friday and Saturday", hours: "12:00 to 01:00" },
    { days: ["sunday"], label: "Sunday", hours: "13:00 to 22:00" },
  ],
  groupBookings: "Tables for 8 or more can be reserved a day ahead by WhatsApp, with a short pre-order for big groups.",
  events: "New Year’s Eve: live highlife band and DJ from 20:00, booking recommended.",
};
