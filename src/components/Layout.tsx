import { Link, Outlet, useLocation } from "react-router";
import { currentTrip, resetDemo, useStore } from "../lib/store";
import { JourneyProgress } from "./JourneyProgress";

const STEP_FOR_PATH: Record<string, number> = { "/": 0, "/venue": 1, "/trip": 2 };

export function Layout() {
  const { pathname } = useLocation();
  const hasDiscovered = useStore((s) => s.session.discoveredAt !== null);
  const hasDecided = useStore((s) => s.session.interestedAt !== null);
  const hasSaved = useStore((s) => currentTrip(s) !== undefined);

  const current = STEP_FOR_PATH[pathname] ?? 0;
  // Saving is the furthest step this prototype covers so far.
  const completed = hasSaved ? 2 : hasDecided ? 1 : hasDiscovered ? 0 : -1;

  function handleReset() {
    if (window.confirm("Reset all demo data back to the sample seed?")) {
      resetDemo();
      window.location.assign("/");
    }
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="bg-cocoa-900 pb-4 text-cream-100">
        <div className="weave" aria-hidden />
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 pt-4 pb-4">
          <Link to="/venue" className="font-display text-2xl font-bold text-cream-50">
            De Klinic
            <span className="block font-sans text-xs font-medium tracking-[0.2em] text-sand-300 uppercase">
              Restaurant &amp; Pub · Accra
            </span>
          </Link>
          <span className="rounded-full bg-gold-400 px-3 py-1 text-xs font-bold tracking-wide text-cocoa-950 uppercase">
            Sample data
          </span>
        </div>
        <JourneyProgress current={current} completed={completed} />
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:py-10">
        <Outlet />
      </main>

      <footer className="border-t border-cream-200 bg-cream-100">
        <div className="mx-auto flex max-w-3xl flex-col gap-3 px-4 py-6 text-sm text-cocoa-700 sm:flex-row sm:items-center sm:justify-between">
          <p>
            Hackathon prototype. All people, stories and sources are <strong>sample data</strong>. Venue details
            are placeholders until confirmed by De Klinic.
          </p>
          <button
            type="button"
            onClick={handleReset}
            className="min-h-11 shrink-0 self-start whitespace-nowrap font-semibold text-clay-700 underline underline-offset-4 hover:text-clay-500 sm:self-auto"
          >
            Reset demo data
          </button>
        </div>
      </footer>
    </div>
  );
}
