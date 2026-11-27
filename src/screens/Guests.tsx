import { Link } from "react-router";
import { useStore } from "../lib/store";
import { guestTypeLabel, SOURCE_TYPE_ICON } from "./Discover";
import { formatDate } from "./SaveTrip";
import { StatusPill } from "./Staff";

export function Guests() {
  const trips = useStore((s) => s.trips);
  const sources = useStore((s) => s.sources);
  const sorted = [...trips].sort((a, b) => a.travelFrom.localeCompare(b.travelFrom));

  return (
    <div className="rise space-y-6">
      <section className="space-y-2">
        <p className="text-sm font-bold tracking-wide text-clay-700 uppercase">Owner view · sample data</p>
        <h1 className="text-4xl font-bold">Guest journeys</h1>
        <p className="text-lg text-cocoa-700">Every saved trip, where it came from and how far it has got.</p>
      </section>

      {sorted.length === 0 ? (
        <div className="card text-cocoa-700">No saved trips yet.</div>
      ) : (
        <ul className="space-y-3" data-testid="guest-list">
          {sorted.map((t) => {
            const src = sources.find((s) => s.id === t.sourceId);
            return (
              <li key={t.id} className="card tilt" data-testid="guest-row">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-display text-lg font-bold text-cocoa-950">{t.name}</p>
                    <p className="text-sm text-cocoa-500">
                      <span className="font-mono">{t.arrivalCode}</span> · {formatDate(t.travelFrom)} – {formatDate(t.travelTo)}
                    </p>
                  </div>
                  <StatusPill status={t.status} />
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-3">
                  <div className="col-span-2 min-w-0 sm:col-span-1">
                    <dt className="text-cocoa-500">Source</dt>
                    <dd className="font-semibold break-words">
                      {src ? `${SOURCE_TYPE_ICON[src.type]} ${src.label}` : "Direct / no link"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-cocoa-500">Who’s coming</dt>
                    <dd className="font-semibold">
                      {guestTypeLabel(t.guestType)}, {t.groupSize}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-cocoa-500">From</dt>
                    <dd className="font-semibold">{t.originCity}</dd>
                  </div>
                </dl>
                <Link
                  to={`/dashboard?trip=${t.id}#timeline`}
                  className="mt-3 inline-flex min-h-11 items-center font-semibold text-clay-700 underline underline-offset-4"
                  data-testid="guest-timeline-link"
                >
                  View timeline
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
