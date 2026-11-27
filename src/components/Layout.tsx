import { useEffect, useId, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router";
import { setSeasonMode, useSeason, type SeasonMode } from "../lib/season";
import { currentTrip, referralForTrip, resetDemo, useStore } from "../lib/store";
import { Assistant } from "./Assistant";
import { JourneyProgress } from "./JourneyProgress";

interface Audience {
  key: "traveller" | "staff" | "owner";
  label: string;
  tabs: { label: string; to: string }[];
}

const AUDIENCES: Audience[] = [
  {
    key: "traveller",
    label: "Traveller",
    tabs: [
      { label: "Home", to: "/" },
      { label: "Venue", to: "/venue" },
      { label: "My trip", to: "/trip" },
      { label: "Refer", to: "/refer" },
    ],
  },
  { key: "staff", label: "Staff", tabs: [{ label: "Confirm visit", to: "/staff" }] },
  {
    key: "owner",
    label: "Owner",
    tabs: [
      { label: "Dashboard", to: "/dashboard" },
      { label: "Guest journeys", to: "/guests" },
    ],
  },
];

const audienceFor = (pathname: string) => AUDIENCES.find((a) => a.tabs.some((t) => t.to === pathname));

/** Pages that show the compact journey stepper under the header. */
const STEPPER_PAGES = ["/venue", "/trip", "/staff", "/refer"];

function DemoMenu({ tripOpen }: { tripOpen: boolean }) {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  const current = audienceFor(pathname);

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
    wrap.current?.querySelector<HTMLElement>("nav a")?.focus();
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
          aria-label="Demo views and pages"
          className="pop absolute right-0 z-50 mt-2 w-64 rounded-2xl bg-white p-2 text-cocoa-900 shadow-[var(--shadow-float)]"
        >
          <p className="px-3 pt-1 pb-1 text-sm text-cocoa-500">View as</p>
          {AUDIENCES.map((a) => {
            const active = current?.key === a.key;
            return (
              <div key={a.key} className="border-b border-cream-200 py-1 last:border-0">
                <Link
                  to={a.key === "traveller" && tripOpen ? "/trip" : a.tabs[0].to}
                  aria-current={active ? "true" : undefined}
                  className={`flex min-h-11 items-center justify-between rounded-xl px-3 font-semibold ${
                    active ? "bg-cream-100 text-cocoa-950" : "hover:bg-cream-100"
                  }`}
                  data-testid={`view-${a.key}`}
                >
                  {a.label}
                  {active && <span className="h-2 w-2 rounded-full bg-clay-500" aria-hidden />}
                </Link>
                <ul className="flex flex-wrap gap-x-1 px-2 pb-1">
                  {a.tabs.map((t) => (
                    <li key={t.to}>
                      <NavLink
                        to={t.to}
                        end
                        className={({ isActive }) =>
                          `inline-flex min-h-9 items-center rounded-lg px-2 text-sm ${
                            isActive ? "font-semibold text-clay-700" : "text-cocoa-700 hover:bg-cream-100"
                          }`
                        }
                      >
                        {t.label}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
          <SeasonControl />
        </nav>
      )}
    </div>
  );
}

const SEASONS: { value: SeasonMode; label: string }[] = [
  { value: "auto", label: "Auto" },
  { value: "december", label: "December" },
  { value: "not-december", label: "Not December" },
];

/** Demo-only switch for the seasonal wording and greeting. */
function SeasonControl() {
  const { mode, december } = useSeason();
  return (
    <fieldset className="border-t border-cream-200 px-3 pt-2 pb-1">
      <legend className="sr-only">Season</legend>
      <p className="pb-1.5 text-sm text-cocoa-500" data-testid="season-current" aria-live="polite">
        Season: {SEASONS.find((s) => s.value === mode)!.label}
        {mode === "auto" && ` (${december ? "December" : "not December"} today)`}
      </p>
      <div className="grid grid-cols-3 gap-1 rounded-xl bg-cream-100 p-1">
        {SEASONS.map((s) => (
          <label
            key={s.value}
            className="flex min-h-11 cursor-pointer items-center justify-center rounded-lg px-1 text-center text-xs leading-tight font-semibold text-cocoa-700 has-[:checked]:bg-white has-[:checked]:text-cocoa-950 has-[:checked]:shadow-[var(--shadow-card)] has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-gold-500"
          >
            <input
              type="radio"
              name="season"
              value={s.value}
              checked={mode === s.value}
              onChange={() => setSeasonMode(s.value)}
              className="sr-only"
              data-testid={`season-${s.value}`}
            />
            {s.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function AudienceTabs({ audience }: { audience: Audience }) {
  return (
    <nav aria-label={`${audience.label} pages`} className="border-t border-cream-100/10">
      <ul className="mx-auto flex h-10 max-w-3xl items-center gap-1 overflow-x-auto px-3" data-testid="audience-tabs">
        {audience.tabs.map((t) => (
          <li key={t.to} className="shrink-0">
            <NavLink
              to={t.to}
              end
              className={({ isActive }) =>
                `inline-flex min-h-8 items-center rounded-full px-3 text-sm font-semibold ${
                  isActive ? "bg-cream-100 text-cocoa-950" : "text-cream-200 hover:bg-cream-100/10 hover:text-cream-50"
                }`
              }
              data-testid={`tab-${t.to.slice(1) || "home"}`}
            >
              {t.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function Layout() {
  const { pathname } = useLocation();
  const hasDiscovered = useStore((s) => s.session.discoveredAt !== null);
  const hasDecided = useStore((s) => s.session.interestedAt !== null);
  const trip = useStore(currentTrip);
  const hasReferred = useStore((s) => referralForTrip(s, s.session.tripId ?? undefined) !== undefined);
  const audience = audienceFor(pathname);
  const isTraveller = audience?.key === "traveller";

  const visited = trip?.status === "visited";
  const completed = hasReferred ? 4 : visited ? 3 : trip ? 2 : hasDecided ? 1 : hasDiscovered ? 0 : -1;
  const current =
    pathname === "/venue"
      ? 1
      : pathname === "/trip"
        ? trip && trip.status !== "saved" ? 3 : 2
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
        {audience && <AudienceTabs audience={audience} />}
        {STEPPER_PAGES.includes(pathname) && <JourneyProgress current={current} completed={completed} />}
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:py-12">
        <Outlet />
      </main>

      <footer className={`border-t border-cream-200 bg-cream-100 ${isTraveller ? "pb-20" : ""}`}>
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

      {isTraveller && <Assistant />}
    </div>
  );
}
