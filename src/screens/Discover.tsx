import { useEffect } from "react";
import { Link, useSearchParams } from "react-router";
import { ChristmasBanner } from "../components/ChristmasBanner";
import { useSeason } from "../lib/season";
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
  const { december } = useSeason();
  const recorded = session.discoveredAt !== null && (rawSrc === null || session.rawSrc === rawSrc);

  return (
    <div className="rise space-y-10">
      {december && <ChristmasBanner />}
      <section className="hero px-5 py-7 sm:px-10 sm:py-10" aria-labelledby="hero-heading">
        <div className="hero-deco" aria-hidden>
          <span className="d1" />
          <span className="d2" />
          <span className="d3" />
        </div>

        <p className="text-sm font-semibold text-cocoa-500" data-testid="step-indicator">
          Step 1 of 5
        </p>

        <div aria-live="polite" className="mt-4">
          {!recorded ? (
            <div className="h-[4.25rem] animate-pulse rounded-2xl bg-white/60" aria-busy="true">
              <span className="sr-only">Checking where you came from…</span>
            </div>
          ) : source ? (
            <div
              className="tilt flex items-center gap-3 rounded-2xl bg-white/85 p-3 pr-4 shadow-[var(--shadow-card)]"
              data-testid="referral-banner"
            >
              <span aria-hidden className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gold-400/25 text-xl">
                {SOURCE_TYPE_ICON[source.type]}
              </span>
              <div className="min-w-0">
                <p className="leading-snug">
                  You were referred by{" "}
                  <strong className="font-semibold text-cocoa-950">{source.label.replace(/^Referred by /, "")}</strong>
                </p>
                <p className="text-sm text-cocoa-500">
                  {SOURCE_TYPE_LABEL[source.type]}, {source.country} · Sample data
                </p>
              </div>
            </div>
          ) : session.rawSrc ? (
            <div className="rounded-2xl border-l-4 border-clay-500 bg-white/85 p-3 pl-4" data-testid="unknown-source">
              <p className="font-semibold">We didn’t recognise that link</p>
              <p className="text-sm text-cocoa-700">
                <code className="rounded bg-cream-100 px-1">{session.rawSrc}</code> isn’t a referral we know. You can
                still explore De Klinic.
              </p>
            </div>
          ) : (
            <p className="text-cocoa-700" data-testid="no-source">
              Exploring on your own. No referral link was used.
            </p>
          )}
        </div>

        <h1
          id="hero-heading"
          className="mt-6 max-w-[14ch] text-[2.375rem] leading-[1.04] font-bold tracking-tight sm:text-6xl"
        >
          Your first night back in Accra starts here.
        </h1>
        <p className="mt-4 max-w-md text-lg text-cocoa-700">
          {december ? "Coming home for December?" : "Coming home to Ghana?"} Plan your De Klinic visit before you land in Accra, and get it confirmed when you arrive.
        </p>
        <p className="mt-2 text-sm font-semibold text-cocoa-500" data-testid="who-it-serves">
          For diaspora travellers, families and groups.
        </p>
        <Link to="/venue" className="btn-primary mt-6 text-lg" data-testid="cta-venue">
          See De Klinic
        </Link>
      </section>

      {!rawSrc && (
        <section className="px-1">
          <h2 className="text-lg font-bold">Try a sample referral link</h2>
          <p className="mt-1 text-sm text-cocoa-700">
            For the demo: each link simulates arriving from a different overseas source.
          </p>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {sources.filter((s) => s.type !== "referral").map((s) => (
              <li key={s.id}>
                <Link
                  to={`/?src=${s.id}`}
                  className="tilt flex min-h-14 items-center gap-3 rounded-2xl bg-white px-4 py-3 font-semibold text-clay-700 shadow-[var(--shadow-card)]"
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
