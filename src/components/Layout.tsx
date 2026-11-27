import { Link, NavLink, Outlet, useLocation } from "react-router";
import { currentTrip, referralForTrip, resetDemo, useStore } from "../lib/store";
import { JourneyProgress } from "./JourneyProgress";

const VIEWS = [
  { label: "Traveller", to: "/", match: ["/", "/venue", "/trip", "/refer"] },
  { label: "Staff", to: "/staff", match: ["/staff"] },
  { label: "Owner", to: "/dashboard", match: ["/dashboard"] },
];

export function Layout() {
  const { pathname } = useLocation();
  const hasDiscovered = useStore((s) => s.session.discoveredAt !== null);
  const hasDecided = useStore((s) => s.session.interestedAt !== null);
  const trip = useStore(currentTrip);
  const hasReferred = useStore((s) => referralForTrip(s, s.session.tripId ?? undefined) !== undefined);

  const visited = trip?.status === "visited";
  const completed = hasReferred ? 4 : visited ? 3 : trip ? 2 : hasDecided ? 1 : hasDiscovered ? 0 : -1;
  const current =
    pathname === "/venue" ? 1 : pathname === "/trip" ? (visited ? 3 : 2) : pathname === "/refer" ? 4 : 0;
  const isTraveller = VIEWS[0].match.includes(pathname);

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
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 pt-4 pb-3">
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

        <nav aria-label="View as" className="mx-auto flex max-w-3xl items-center gap-2 px-4 pb-4 text-sm">
          <span className="text-sand-300">View as:</span>
          <div className="flex rounded-full bg-cocoa-950/60 p-1">
            {VIEWS.map((v) => {
              const active = v.match.includes(pathname);
              return (
                <NavLink
                  key={v.label}
                  to={v.label === "Traveller" && trip ? "/trip" : v.to}
                  aria-current={active ? "page" : undefined}
                  className={`flex min-h-9 items-center rounded-full px-3 font-semibold ${
                    active ? "bg-cream-100 text-cocoa-950" : "text-cream-200 hover:text-cream-50"
                  }`}
                  data-testid={`view-${v.label.toLowerCase()}`}
                >
                  {v.label}
                </NavLink>
              );
            })}
          </div>
        </nav>

        {isTraveller && <JourneyProgress current={current} completed={completed} />}
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
