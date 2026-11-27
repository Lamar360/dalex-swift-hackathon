import { useState, type FormEvent } from "react";
import { Link } from "react-router";
import { clearCurrentTrip, currentTrip, findSource, saveTrip, useStore } from "../lib/store";
import type { Trip } from "../lib/types";

const DEMO_FILL = {
  name: "Akosua Mensah (sample)",
  originCity: "London, UK",
  travelFrom: "2026-12-18",
  travelTo: "2027-01-03",
  groupSize: "4",
};

const EMPTY = { name: "", originCity: "", travelFrom: "", travelTo: "", groupSize: "2" };

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
  return e;
}

function formatDate(iso: string) {
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
      });
    }, 600);
  }

  const field = (key: keyof FormValues, label: string, props: React.InputHTMLAttributes<HTMLInputElement>) => (
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
  return (
    <div className="rise space-y-6" data-testid="confirmation">
      <section className="space-y-2">
        <p className="text-sm font-bold tracking-wide text-palm-600 uppercase">✓ Saved to your itinerary</p>
        <h1 className="text-4xl font-bold">See you in Accra, {trip.name.split(" ")[0]}.</h1>
      </section>

      <section className="card bg-cocoa-900 text-center text-cream-100" aria-labelledby="code-label">
        <p id="code-label" className="text-sm font-semibold tracking-[0.2em] text-sand-300 uppercase">
          Your arrival code
        </p>
        <p className="mt-2 font-mono text-5xl font-bold tracking-widest text-gold-400" data-testid="arrival-code">
          {trip.arrivalCode}
        </p>
        <p className="mt-3 text-cream-200">Show this at De Klinic so staff can confirm your visit.</p>
      </section>

      <section className="card">
        <h2 className="text-xl font-bold">Trip details</h2>
        <dl className="mt-3 divide-y divide-cream-200">
          {[
            ["Name", trip.name],
            ["From", trip.originCity],
            ["Dates", `${formatDate(trip.travelFrom)} – ${formatDate(trip.travelTo)}`],
            ["Group size", String(trip.groupSize)],
            ["Referred by", source?.label ?? "No referral (direct)"],
            ["Status", "Saved, visit not yet confirmed"],
          ].map(([k, v]) => (
            <div key={k} className="flex flex-wrap justify-between gap-2 py-3">
              <dt className="font-semibold">{k}</dt>
              <dd className="text-right">{v}</dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Link to="/venue" className="btn-secondary">
          Back to venue
        </Link>
        <button type="button" className="btn-secondary" onClick={clearCurrentTrip}>
          Plan another trip
        </button>
      </div>
      <p className="text-sm text-cocoa-500">Next steps (Visit, Refer) are coming in a later build.</p>
    </div>
  );
}
