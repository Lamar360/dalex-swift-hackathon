import { useEffect } from "react";
import { Link, useSearchParams } from "react-router";
import { findSource, recordDiscovery, useStore } from "../lib/store";
import type { GuestType, SourceType } from "../lib/types";

export const SOURCE_TYPE_LABEL: Record<SourceType, string> = {
  search: "Web search",
  "ai-travel": "AI travel answer",
  "curated-itinerary": "Curated itinerary",
  community: "Diaspora community",
  curator: "Travel curator",
  host: "Local host",
  referral: "Friend who visited",
};

export const SOURCE_TYPE_ICON: Record<SourceType, string> = {
  search: "🔍",
  "ai-travel": "✦",
  "curated-itinerary": "🗺️",
  community: "👥",
  curator: "🧭",
  host: "🏠",
  referral: "🤝",
};

export const GUEST_TYPES: { value: GuestType; label: string }[] = [
  { value: "solo", label: "Solo" },
  { value: "friends", label: "Friends" },
  { value: "family", label: "Family" },
  { value: "group", label: "Group" },
];

export const guestTypeLabel = (t: GuestType | undefined) => GUEST_TYPES.find((g) => g.value === t)?.label ?? "Not given";

export function Discover() {
  const [params] = useSearchParams();
  const rawSrc = params.get("src");

  useEffect(() => {
    recordDiscovery(rawSrc);
  }, [rawSrc]);

  const session = useStore((s) => s.session);
  const source = useStore((s) => findSource(s, s.session.sourceId));
  const sources = useStore((s) => s.sources);
  const recorded = session.discoveredAt !== null && (rawSrc === null || session.rawSrc === rawSrc);

  return (
    <div className="rise space-y-6">
      <section aria-live="polite">
        {!recorded ? (
          <div className="card animate-pulse space-y-3" aria-busy="true">
            <div className="h-4 w-1/3 rounded bg-cream-200" />
            <div className="h-7 w-3/4 rounded bg-cream-200" />
            <span className="sr-only">Checking where you came from…</span>
          </div>
        ) : source ? (
          <div className="card border-l-8 border-gold-400" data-testid="referral-banner">
            <p className="text-sm font-semibold tracking-wide text-clay-700 uppercase">
              {SOURCE_TYPE_ICON[source.type]} {SOURCE_TYPE_LABEL[source.type]} · {source.country}
            </p>
            <p className="mt-2 text-xl leading-snug sm:text-2xl">
              You were referred by{" "}
              <strong className="font-display text-cocoa-950">{source.label.replace(/^Referred by /, "")}</strong>
            </p>
            <p className="mt-2 text-sm text-cocoa-500">
              We’ve noted this so they get credit if you visit. (Sample data)
            </p>
          </div>
        ) : session.rawSrc ? (
          <div className="card border-l-8 border-clay-500" data-testid="unknown-source">
            <p className="text-lg font-semibold">We didn’t recognise that link</p>
            <p className="mt-1 text-cocoa-700">
              The referral code <code className="rounded bg-cream-100 px-1">{session.rawSrc}</code> isn’t one we know.
              You can still explore De Klinic below.
            </p>
          </div>
        ) : (
          <div className="card" data-testid="no-source">
            <p className="text-lg font-semibold">Exploring on your own</p>
            <p className="mt-1 text-cocoa-700">
              No referral link was used. Welcome all the same.
            </p>
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h1 className="text-[2.5rem] leading-[1.05] font-bold sm:text-6xl">
          Your first night back in Accra starts here.
        </h1>
        <p className="max-w-xl text-lg text-cocoa-700">
          Coming home for December? Plan a visit to De Klinic Restaurant &amp; Pub, save it to your Ghana
          itinerary, and get an arrival code to show when you get there.
        </p>
        <Link to="/venue" className="btn-primary text-lg" data-testid="cta-venue">
          See De Klinic <span aria-hidden>→</span>
        </Link>
      </section>

      {!rawSrc && (
        <section className="card bg-cream-100 shadow-none">
          <h2 className="text-lg font-bold">Try a sample referral link</h2>
          <p className="mt-1 text-sm text-cocoa-700">
            For the demo: each link simulates arriving from a different overseas source.
          </p>
          <ul className="mt-3 space-y-2">
            {sources.filter((s) => s.type !== "referral").map((s) => (
              <li key={s.id}>
                <Link
                  to={`/?src=${s.id}`}
                  className="flex min-h-11 items-center gap-2 font-semibold text-clay-700 underline underline-offset-4"
                >
                  <span aria-hidden>{SOURCE_TYPE_ICON[s.type]}</span> {s.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
