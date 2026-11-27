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
