import { useEffect, useId, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router";
import { currentTrip, referralForTrip, resetDemo, useStore } from "../lib/store";
import { JourneyProgress } from "./JourneyProgress";

const VIEWS = [
  { label: "Traveller", to: "/", match: ["/", "/venue", "/trip", "/refer"] },
  { label: "Staff", to: "/staff", match: ["/staff"] },
  { label: "Owner", to: "/dashboard", match: ["/dashboard"] },
];

/** Pages that show the compact journey stepper under the header. */
const STEPPER_PAGES = ["/venue", "/trip", "/staff", "/refer"];

function DemoMenu({ tripOpen }: { tripOpen: boolean }) {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  // Close whenever the route changes.
  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        button.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    wrap.current?.querySelector<HTMLElement>("a")?.focus();
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={wrap} className="relative">
      <button
        ref={button}
        type="button"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((o) => !o)}
        className="flex min-h-10 items-center gap-1.5 rounded-full border border-cream-100/25 px-3.5 text-sm font-semibold text-cream-100 hover:bg-cream-100/10"
        data-testid="demo-menu"
      >
        Demo
        <svg aria-hidden viewBox="0 0 12 12" className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`}>
          <path d="M2 4.5 6 8l4-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </button>
      {open && (
        <nav
          id={menuId}
          aria-label="View as"
          className="pop absolute right-0 z-50 mt-2 w-56 rounded-2xl bg-white p-2 text-cocoa-900 shadow-[var(--shadow-float)]"
        >
          <p className="px-3 pt-1 pb-2 text-sm text-cocoa-500">View as</p>
          <ul>
            {VIEWS.map((v) => {
              const active = v.match.includes(pathname);
              return (
                <li key={v.label}>
                  <NavLink
                    to={v.label === "Traveller" && tripOpen ? "/trip" : v.to}
                    aria-current={active ? "page" : undefined}
                    className={`flex min-h-11 items-center justify-between rounded-xl px-3 font-semibold ${
                      active ? "bg-cream-100 text-cocoa-950" : "hover:bg-cream-100"
                    }`}
                    data-testid={`view-${v.label.toLowerCase()}`}
                  >
                    {v.label}
                    {active && <span className="h-2 w-2 rounded-full bg-clay-500" aria-hidden />}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>
      )}
    </div>
  );
}

export function Layout() {
  const { pathname } = useLocation();
  const hasDiscovered = useStore((s) => s.session.discoveredAt !== null);
  const hasDecided = useStore((s) => s.session.interestedAt !== null);
  const trip = useStore(currentTrip);
  const hasReferred = useStore((s) => referralForTrip(s, s.session.tripId ?? undefined) !== undefined);

  const visited = trip?.status === "visited";
  const completed = hasReferred ? 4 : visited ? 3 : trip ? 2 : hasDecided ? 1 : hasDiscovered ? 0 : -1;
  const current =
    pathname === "/venue"
      ? 1
      : pathname === "/trip"
        ? visited ? 3 : 2
        : pathname === "/staff"
          ? 3
          : pathname === "/refer"
            ? 4
            : 0;

  function handleReset() {
    if (window.confirm("Reset all demo data back to the sample seed?")) {
      resetDemo();
      window.location.assign("/");
    }
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 bg-cocoa-900/95 text-cream-100 shadow-[0_1px_0_rgb(0_0_0/0.2),0_10px_30px_-18px_rgb(31_18_11/0.8)] backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-3 px-4">
          <Link to="/venue" className="font-display text-xl font-bold text-cream-50">
            De Klinic
          </Link>
          <span className="rounded-full bg-gold-400 px-2.5 py-0.5 text-xs font-bold text-cocoa-950">Sample data</span>
          <div className="ml-auto">
            <DemoMenu tripOpen={trip !== undefined} />
          </div>
        </div>
        {STEPPER_PAGES.includes(pathname) && <JourneyProgress current={current} completed={completed} />}
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:py-12">
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
