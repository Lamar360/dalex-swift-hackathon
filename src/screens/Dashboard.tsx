import { useMemo, useState } from "react";
import { findSource, getState, tripTimeline, useStore } from "../lib/store";
import type { EventType, JourneyEvent } from "../lib/types";
import { GUEST_TYPES, guestTypeLabel, SOURCE_TYPE_ICON, SOURCE_TYPE_LABEL } from "./Discover";
import { formatDate } from "./SaveTrip";
import { StatusPill } from "./Staff";

// The December this prototype is planning for.
const DEC_START = "2026-12-01";
const DEC_END = "2026-12-31";

const pct = (n: number, d: number) => (d === 0 ? "–" : `${Math.round((n / d) * 100)}%`);

export function Dashboard() {
  const events = useStore((s) => s.events);
  const trips = useStore((s) => s.trips);
  const sources = useStore((s) => s.sources);
  const referrals = useStore((s) => s.referrals);

  const stats = useMemo(() => {
    const discoveredVisitors = new Map<string, string | null>();
    for (const e of events) {
      if (e.type === "discovered" && !discoveredVisitors.has(e.visitorId)) discoveredVisitors.set(e.visitorId, e.sourceId);
    }
    const saved = trips.filter((t) => t.status === "saved" || t.status === "visited");
    const visited = trips.filter((t) => t.status === "visited");
    const referredTrips = new Set(referrals.map((r) => r.fromTripId));

    const rows = [...sources.map((s) => s.id), null].map((id) => {
      const discovered = [...discoveredVisitors.values()].filter((v) => v === id).length;
      const sv = saved.filter((t) => t.sourceId === id).length;
      const vi = visited.filter((t) => t.sourceId === id).length;
      return { id, discovered, saved: sv, visited: vi };
    });

    const december = trips.filter((t) => t.status === "saved" && t.travelFrom <= DEC_END && t.travelTo >= DEC_START);
    return {
      funnel: [
        { key: "discovered", label: "Discovered", value: discoveredVisitors.size },
        { key: "saved", label: "Saved a trip", value: saved.length },
        { key: "visited", label: "Visited", value: visited.length },
        { key: "referred", label: "Referred a friend", value: referredTrips.size },
      ],
      rows: rows.filter((r) => r.discovered + r.saved > 0),
      decTrips: december.length,
      decGuests: december.reduce((n, t) => n + t.groupSize, 0),
      guestTypes: GUEST_TYPES.map((g) => {
        const ts = saved.filter((t) => t.guestType === g.value);
        return { ...g, trips: ts.length, guests: ts.reduce((n, t) => n + t.groupSize, 0) };
      }),
      savedCount: saved.length,
    };
  }, [events, trips, sources, referrals]);

  const max = Math.max(1, stats.funnel[0].value);

  return (
    <div className="rise space-y-8">
      <section className="space-y-2">
        <p className="text-sm font-bold tracking-wide text-clay-700 uppercase" data-testid="owner-label">
          Owner view · sample data
        </p>
        <h1 className="text-4xl font-bold">Where December guests come from</h1>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <div className="card tilt bg-cocoa-900 text-cream-100">
          <p className="text-sm font-semibold text-sand-300">Expected December arrivals</p>
          <p className="font-display text-4xl font-bold text-gold-400" data-testid="dec-trips">
            {stats.decTrips}
          </p>
          <p className="text-sm text-cream-200">saved trips</p>
        </div>
        <div className="card tilt bg-cocoa-900 text-cream-100">
          <p className="text-sm font-semibold text-sand-300">Total guests</p>
          <p className="font-display text-4xl font-bold text-gold-400" data-testid="dec-guests">
            {stats.decGuests}
          </p>
          <p className="text-sm text-cream-200">across those trips</p>
        </div>
      </section>

      <section aria-labelledby="funnel-heading" className="card space-y-4">
        <h2 id="funnel-heading" className="text-xl font-bold">
          Journey funnel
        </h2>
        <ol className="space-y-3">
          {stats.funnel.map((f, i) => (
            <li key={f.key}>
              <div className="flex items-baseline justify-between">
                <span className="font-semibold">{f.label}</span>
                <span>
                  <strong className="text-xl" data-testid={`funnel-${f.key}`}>
                    {f.value}
                  </strong>
                  {i > 0 && (
                    <span className="ml-2 text-sm text-cocoa-500">{pct(f.value, stats.funnel[i - 1].value)} of previous</span>
                  )}
                </span>
              </div>
              <div className="mt-1 h-3 overflow-hidden rounded-full bg-cream-200" aria-hidden>
                <div
                  className="h-full rounded-full bg-clay-500"
                  style={{ width: `${Math.max(2, (f.value / max) * 100)}%`, opacity: 1 - i * 0.15 }}
                />
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="sources-heading" className="card space-y-3">
        <h2 id="sources-heading" className="text-xl font-bold">
          Sources
        </h2>
        <div className="-mx-5 overflow-x-auto px-5 sm:-mx-6 sm:px-6">
          <table className="w-full text-left text-sm sm:text-base" data-testid="sources-table">
            <thead className="text-cocoa-500">
              <tr className="border-b border-cream-200">
                <th className="py-2 pr-2 font-semibold">Source</th>
                <th className="w-11 px-1 py-2 text-right font-semibold">Disc.</th>
                <th className="w-12 px-1 py-2 text-right font-semibold">Saved</th>
                <th className="w-12 px-1 py-2 text-right font-semibold">Visit.</th>
                <th className="w-12 py-2 pl-1 text-right font-semibold">Conv.</th>
              </tr>
            </thead>
            <tbody>
              {stats.rows.map((r) => {
                const src = sources.find((s) => s.id === r.id);
                return (
                  <tr
                    key={r.id ?? "direct"}
                    className="border-b border-cream-200 last:border-0"
                    data-testid={`source-row-${r.id ?? "direct"}`}
                  >
                    <td className="py-2.5 pr-2">
                      <span className="font-semibold">{src ? src.label : "Direct / no link"}</span>
                      <span className="block text-xs text-cocoa-500">
                        {src ? `${SOURCE_TYPE_ICON[src.type]} ${SOURCE_TYPE_LABEL[src.type]}` : "—"}
                      </span>
                    </td>
                    <td className="px-1 text-right tabular-nums">{r.discovered}</td>
                    <td className="px-1 text-right tabular-nums">{r.saved}</td>
                    <td className="px-1 text-right tabular-nums">{r.visited}</td>
                    <td className="pl-1 text-right font-semibold tabular-nums">{pct(r.visited, r.discovered)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-cocoa-500">Conv. = visited ÷ discovered. Counts are sample data.</p>
      </section>

      <section aria-labelledby="guest-type-heading" className="card space-y-4">
        <h2 id="guest-type-heading" className="text-xl font-bold">
          Who’s coming
        </h2>
        <ul className="space-y-3" data-testid="guest-type-breakdown">
          {stats.guestTypes.map((g) => (
            <li key={g.value}>
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-semibold">{g.label}</span>
                <span className="text-sm text-cocoa-500">
                  <strong className="text-xl text-cocoa-900" data-testid={`guest-type-${g.value}`}>
                    {g.trips}
                  </strong>{" "}
                  {g.trips === 1 ? "trip" : "trips"}, {g.guests} {g.guests === 1 ? "guest" : "guests"}
                </span>
              </div>
              <div className="mt-1 h-3 overflow-hidden rounded-full bg-cream-200" aria-hidden>
                <div
                  className="h-full rounded-full bg-gold-500"
                  style={{ width: `${stats.savedCount ? Math.max(2, (g.trips / stats.savedCount) * 100) : 2}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
        <p className="text-xs text-cocoa-500">Saved and visited trips, by what guests chose on the trip form. Sample data.</p>
      </section>

      <GuestTimeline />
    </div>
  );
}

const EVENT_LABEL: Record<EventType, string> = {
  discovered: "Discovered De Klinic",
  saved: "Saved trip to itinerary",
  visit_confirmed: "Visit confirmed by staff",
  referred: "Created a referral link",
};

const EVENT_DOT: Record<EventType, string> = {
  discovered: "bg-sand-300",
  saved: "bg-gold-400",
  visit_confirmed: "bg-palm-600",
  referred: "bg-clay-500",
};

function GuestTimeline() {
  const trips = useStore((s) => s.trips);
  const events = useStore((s) => s.events);
  const [tripId, setTripId] = useState(() => [...trips].sort((a, b) => b.savedAt.localeCompare(a.savedAt))[0]?.id ?? "");
  const trip = trips.find((t) => t.id === tripId);
  // Recompute when the log changes; tripTimeline reads the latest state.
  const timeline = useMemo(() => (trip ? tripTimeline(getState(), trip) : []), [trip, events]);

  if (trips.length === 0) {
    return <div className="card text-cocoa-700">No saved trips yet.</div>;
  }

  function describe(e: JourneyEvent): string {
    const s = getState();
    const src = findSource(s, e.sourceId);
    if (e.type === "discovered" && trip && e.visitorId !== trip.visitorId) return "Their link brought in a new guest";
    if (e.type === "discovered") return `${EVENT_LABEL.discovered} via ${src?.label ?? "a direct visit"}`;
    if (e.type === "visit_confirmed") {
      const v = s.visits.find((x) => x.tripId === e.tripId);
      return `${EVENT_LABEL.visit_confirmed}${v ? ` (${v.confirmedBy})` : ""}`;
    }
    return EVENT_LABEL[e.type];
  }

  return (
    <section aria-labelledby="timeline-heading" className="card space-y-4">
      <h2 id="timeline-heading" className="text-xl font-bold">
        Guest timeline
      </h2>
      <div>
        <label htmlFor="guest" className="field-label">
          Choose a guest
        </label>
        <select id="guest" className="field" value={tripId} onChange={(e) => setTripId(e.target.value)} data-testid="timeline-picker">
          {trips.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} · {t.arrivalCode} · {t.status}
            </option>
          ))}
        </select>
      </div>
      {trip && (
        <>
          <div className="flex flex-wrap items-center gap-2 text-sm text-cocoa-700">
            <StatusPill status={trip.status} />
            <span>
              {trip.originCity} · {formatDate(trip.travelFrom)} – {formatDate(trip.travelTo)} · {trip.groupSize} guests ({guestTypeLabel(trip.guestType).toLowerCase()})
            </span>
          </div>
          <ol className="relative space-y-4 border-l-2 border-cream-200 pl-6" data-testid="timeline">
            {timeline.map((e) => (
              <li key={e.id} className="relative" data-testid={`timeline-${e.type}`}>
                <span className={`absolute top-1.5 -left-[1.95rem] h-3.5 w-3.5 rounded-full ring-4 ring-white ${EVENT_DOT[e.type]}`} />
                <p className="font-semibold">{describe(e)}</p>
                <p className="text-sm text-cocoa-500">
                  {new Date(e.at).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                </p>
              </li>
            ))}
          </ol>
        </>
      )}
    </section>
  );
}
