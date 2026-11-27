import { useState, type FormEvent, type InputHTMLAttributes } from "react";
import { Link } from "react-router";
import { VENUE, arrivalMessage, whatsappLink } from "../data/venue";
import { addStory, checkIn, clearCurrentTrip, currentTrip, findSource, saveTrip, useStore } from "../lib/store";
import type { GuestType, Trip } from "../lib/types";
import { GUEST_TYPES, guestTypeLabel } from "./Discover";

const DEMO_FILL = {
  name: "Adwoa Asare (sample)",
  originCity: "London, UK",
  travelFrom: "2026-12-18",
  travelTo: "2027-01-03",
  groupSize: "4",
  guestType: "family",
};

const EMPTY = { name: "", originCity: "", travelFrom: "", travelTo: "", groupSize: "2", guestType: "" };

type FormValues = typeof EMPTY;
type Errors = Partial<Record<keyof FormValues, string>>;

function validate(v: FormValues): Errors {
  const e: Errors = {};
  if (!v.name.trim()) e.name = "Please enter your name.";
  if (!v.originCity.trim()) e.originCity = "Where are you travelling from?";
  if (!v.travelFrom) e.travelFrom = "Choose your arrival date.";
  if (!v.travelTo) e.travelTo = "Choose your departure date.";
  if (v.travelFrom && v.travelTo && v.travelTo < v.travelFrom) e.travelTo = "Departure must be after arrival.";
  const n = Number(v.groupSize);
  if (!Number.isInteger(n) || n < 1 || n > 30) e.groupSize = "Group size must be between 1 and 30.";
  if (!v.guestType) e.guestType = "Choose who’s coming.";
  return e;
}

export function formatDate(iso: string) {
  return new Date(`${iso}T12:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function SaveTrip() {
  const trip = useStore(currentTrip);
  return trip ? <Confirmation trip={trip} /> : <TripForm />;
}

function TripForm() {
  const source = useStore((s) => findSource(s, s.session.sourceId));
  const [values, setValues] = useState<FormValues>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);

  function update<K extends keyof FormValues>(key: K, value: string) {
    setValues((v) => ({ ...v, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function onSubmit(ev: FormEvent) {
    ev.preventDefault();
    const e = validate(values);
    setErrors(e);
    if (Object.keys(e).length > 0) {
      document.getElementById(`f-${Object.keys(e)[0]}`)?.focus();
      return;
    }
    setSaving(true);
    // Brief pause so the saving state is visible in the demo; there is no backend.
    window.setTimeout(() => {
      saveTrip({
        name: values.name.trim(),
        originCity: values.originCity.trim(),
        travelFrom: values.travelFrom,
        travelTo: values.travelTo,
        groupSize: Number(values.groupSize),
        guestType: values.guestType as GuestType,
      });
    }, 600);
  }

  const field = (key: keyof FormValues, label: string, props: InputHTMLAttributes<HTMLInputElement>) => (
    <div>
      <label htmlFor={`f-${key}`} className="field-label">
        {label}
      </label>
      <input
        id={`f-${key}`}
        name={key}
        className={`field ${errors[key] ? "border-clay-600" : ""}`}
        value={values[key]}
        onChange={(e) => update(key, e.target.value)}
        aria-invalid={errors[key] ? true : undefined}
        aria-describedby={errors[key] ? `e-${key}` : undefined}
        {...props}
      />
      {errors[key] && (
        <p id={`e-${key}`} className="mt-1.5 text-sm font-semibold text-clay-700">
          {errors[key]}
        </p>
      )}
    </div>
  );

  return (
    <div className="rise space-y-6">
      <section className="space-y-2">
        <h1 className="text-4xl font-bold">Save to my Ghana itinerary</h1>
        <p className="text-lg text-cocoa-700">
          Tell us when you’re coming. You’ll get a short arrival code to show at De Klinic.
        </p>
        {source && <p className="text-sm text-cocoa-500">Referral credited to: {source.label}</p>}
      </section>

      <form onSubmit={onSubmit} noValidate className="card space-y-5" aria-busy={saving}>
        <button
          type="button"
          onClick={() => {
            setValues(DEMO_FILL);
            setErrors({});
          }}
          className="text-sm font-semibold text-clay-700 underline underline-offset-4"
          data-testid="demo-fill"
        >
          Fill with sample traveller (UK, December)
        </button>
        {field("name", "Your name", { autoComplete: "name", placeholder: "e.g. Ama Owusu" })}
        {field("originCity", "Travelling from", { autoComplete: "address-level2", placeholder: "e.g. London, UK" })}
        <div className="grid gap-5 sm:grid-cols-2">
          {field("travelFrom", "Arriving in Ghana", { type: "date" })}
          {field("travelTo", "Leaving Ghana", { type: "date", min: values.travelFrom || undefined })}
        </div>
        <fieldset aria-describedby={errors.guestType ? "e-guestType" : undefined}>
          <legend className="field-label">Who’s coming?</legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" data-testid="guest-type">
            {GUEST_TYPES.map((g, i) => (
              <label
                key={g.value}
                className={`flex min-h-[3.25rem] cursor-pointer items-center justify-center rounded-xl border-2 px-3 font-semibold transition-colors has-[:checked]:border-clay-500 has-[:checked]:bg-clay-500 has-[:checked]:text-cream-50 has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-gold-500 ${errors.guestType ? "border-clay-600" : "border-sand-300"}`}
              >
                <input
                  type="radio"
                  name="guestType"
                  id={i === 0 ? "f-guestType" : undefined}
                  value={g.value}
                  checked={values.guestType === g.value}
                  onChange={() => update("guestType", g.value)}
                  aria-invalid={errors.guestType ? true : undefined}
                  className="sr-only"
                />
                {g.label}
              </label>
            ))}
          </div>
          {errors.guestType && (
            <p id="e-guestType" className="mt-1.5 text-sm font-semibold text-clay-700">
              {errors.guestType}
            </p>
          )}
        </fieldset>
        {field("groupSize", "Group size", { type: "number", inputMode: "numeric", min: 1, max: 30 })}
        <button type="submit" className="btn-primary" disabled={saving} data-testid="submit-trip">
          {saving ? (
            <>
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-cream-50 border-t-transparent" aria-hidden />
              Saving…
            </>
          ) : (
            "Save my trip"
          )}
        </button>
      </form>
    </div>
  );
}

function Confirmation({ trip }: { trip: Trip }) {
  const source = useStore((s) => findSource(s, trip.sourceId));
  const visit = useStore((s) => s.visits.find((v) => v.tripId === trip.id));
  const story = useStore((s) => s.stories.find((st) => st.tripId === trip.id));
  const visited = trip.status === "visited";
  const pending = trip.status === "checked-in";

  return (
    <div className="rise space-y-6" data-testid="confirmation">
      <section className="space-y-2">
        {visited ? (
          <p className="text-sm font-bold tracking-wide text-palm-600 uppercase" data-testid="visit-confirmed">
            ✓ Visit confirmed
          </p>
        ) : (
          <p className="text-sm font-bold tracking-wide text-palm-600 uppercase">✓ Saved to your itinerary</p>
        )}
        <h1 className="text-4xl font-bold">
          {visited ? "Akwaaba, and thank you" : "See you in Accra"}, {trip.name.split(" ")[0]}.
        </h1>
      </section>

      <section className="card bg-cocoa-900 text-center text-cream-100" aria-labelledby="code-label">
        <p id="code-label" className="text-sm font-semibold tracking-[0.2em] text-sand-300 uppercase">
          Your arrival code
        </p>
        <p
          className={`mt-2 font-mono text-5xl font-bold tracking-widest ${visited ? "text-cream-200/60 line-through" : "text-gold-400"}`}
          data-testid="arrival-code"
        >
          {trip.arrivalCode}
        </p>
        <p className="mt-3 text-cream-200">
          {visited ? "Used. Your visit has been confirmed by staff." : "Show this at De Klinic so staff can confirm your visit."}
        </p>
      </section>

      {!visited && <ArrivalSection trip={trip} pending={pending} />}

      {visited && (
        <>
          <StoryBox tripId={trip.id} existing={story?.text} />
          <section className="card space-y-3 border-2 border-gold-400">
            <h2 className="text-xl font-bold">Bring someone with you next time</h2>
            <p className="text-cocoa-700">Share your own link so friends planning a trip see where you went.</p>
            <Link to="/refer" className="btn-primary" data-testid="cta-refer">
              Refer a friend <span aria-hidden>→</span>
            </Link>
          </section>
        </>
      )}

      <section className="card">
        <h2 className="text-xl font-bold">Trip details</h2>
        <dl className="mt-3 divide-y divide-cream-200">
          {[
            ["Name", trip.name],
            ["From", trip.originCity],
            ["Dates", `${formatDate(trip.travelFrom)} – ${formatDate(trip.travelTo)}`],
            ["Group size", String(trip.groupSize)],
            ["Who’s coming", guestTypeLabel(trip.guestType)],
            ["Referred by", source?.label.replace(/^Referred by /, "") ?? "No referral (direct)"],
            [
              "Status",
              visited && visit
                ? `Visited · confirmed ${new Date(visit.confirmedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`
                : pending
                  ? "Pending check-in · waiting for staff to confirm"
                  : "Saved, visit not yet confirmed",
            ],
          ].map(([k, v]) => (
            <div key={k} className="flex flex-wrap justify-between gap-x-4 gap-y-1 py-3">
              <dt className="font-semibold">{k}</dt>
              <dd className="text-right" data-testid={k === "Status" ? "trip-status" : undefined}>
                {v}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {!visited && (
        <p className="card bg-cream-100 text-sm text-cocoa-700 shadow-none">
          Demo tip: open <Link to="/staff" className="font-semibold text-clay-700 underline">Staff view</Link> and
          enter <span className="font-mono font-bold">{trip.arrivalCode}</span> to confirm this visit.
        </p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <Link to="/venue" className="btn-secondary">
          Back to venue
        </Link>
        <button type="button" className="btn-secondary" onClick={clearCurrentTrip}>
          Plan another trip
        </button>
      </div>
    </div>
  );
}

function ArrivalSection({ trip, pending }: { trip: Trip; pending: boolean }) {
  const address = VENUE.address.value;
  const mapUrl = VENUE.mapUrl.value;
  const wa = whatsappLink(arrivalMessage(trip.arrivalCode));

  return (
    <section aria-labelledby="arrival-heading" className="card space-y-5" data-testid="arrival">
      <div>
        <h2 id="arrival-heading" className="text-2xl font-bold">
          Getting there
        </h2>
        <p className="mt-1 text-cocoa-700" data-testid="arrival-address">
          {address ?? "Address to be confirmed"}
          <span className="text-cocoa-500"> · {VENUE.area}</span>
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {mapUrl ? (
          <a href={mapUrl} target="_blank" rel="noreferrer" className="btn-secondary" data-testid="arrival-map">
            Open map
          </a>
        ) : (
          <div>
            <button type="button" className="btn-secondary w-full" disabled data-testid="arrival-map">
              Open map
            </button>
            <p className="mt-1.5 text-sm text-cocoa-500">Map link to be confirmed with De Klinic.</p>
          </div>
        )}
        <div>
          <a href={wa} target="_blank" rel="noreferrer" className="btn-secondary w-full" data-testid="arrival-whatsapp">
            Message De Klinic on WhatsApp
          </a>
          <p className="mt-1.5 text-sm text-cocoa-500">
            {VENUE.whatsapp.display}
            {VENUE.whatsapp.isSample && ". Messages won’t reach De Klinic yet."} Your code is in the message.
          </p>
        </div>
      </div>

      <div className="rounded-2xl bg-cream-100 p-4" aria-live="polite">
        {pending ? (
          <div data-testid="checkin-pending">
            <p className="font-bold">
              Checked in at{" "}
              {new Date(trip.checkedInAt!).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
            </p>
            <p className="mt-1 text-cocoa-700">
              Show <span className="font-mono font-bold">{trip.arrivalCode}</span> to a member of staff. Your visit
              becomes verified once they confirm it.
            </p>
          </div>
        ) : (
          <>
            <p className="text-cocoa-700">At the door? Let De Klinic know you’re here, then show your code to staff.</p>
            <button type="button" className="btn-primary mt-3" onClick={() => checkIn(trip.id)} data-testid="checkin">
              I’ve arrived
            </button>
          </>
        )}
      </div>
    </section>
  );
}

function StoryBox({ tripId, existing }: { tripId: string; existing?: string }) {
  const [text, setText] = useState("");
  const [error, setError] = useState("");

  if (existing) {
    return (
      <section className="card space-y-2" data-testid="story-saved">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-palm-100 px-3 py-1 text-sm font-bold text-palm-600">
          ✓ Verified visit
        </span>
        <blockquote className="text-lg">“{existing}”</blockquote>
        <p className="text-sm text-cocoa-500">
          Thanks! Your story now appears on the <Link to="/venue" className="underline">venue page</Link>.
        </p>
      </section>
    );
  }

  return (
    <form
      className="card space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        const t = text.trim();
        if (t.length < 10) return setError("Please write at least a short sentence (10+ characters).");
        addStory(tripId, t);
      }}
    >
      <label htmlFor="story" className="field-label text-xl">
        How was your visit?
      </label>
      <p className="text-sm text-cocoa-700">A line or two. It will show on the venue page as a verified visit.</p>
      <textarea
        id="story"
        maxLength={280}
        rows={3}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setError("");
        }}
        className="field py-3"
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? "story-error" : undefined}
        placeholder="e.g. We came for one drink and stayed all evening."
      />
      {error && (
        <p id="story-error" className="text-sm font-semibold text-clay-700">
          {error}
        </p>
      )}
      <button type="submit" className="btn-primary" data-testid="submit-story">
        Share my story
      </button>
    </form>
  );
}
