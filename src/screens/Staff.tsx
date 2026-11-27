import { useState, type FormEvent } from "react";
import { DEMO_ARRIVAL_CODE } from "../lib/seed";
import { confirmVisit, findSource, findTripByCode, normaliseCode, useStore } from "../lib/store";
import { formatDate } from "./SaveTrip";

export function Staff() {
  const [input, setInput] = useState("");
  const [code, setCode] = useState<string | null>(null);
  const [justConfirmed, setJustConfirmed] = useState(false);

  const trip = useStore((s) => (code ? findTripByCode(s, code) : undefined));
  const source = useStore((s) => findSource(s, trip?.sourceId));
  const visit = useStore((s) => (trip ? s.visits.find((v) => v.tripId === trip.id) : undefined));

  function lookUp(ev: FormEvent) {
    ev.preventDefault();
    setJustConfirmed(false);
    setCode(normaliseCode(input));
  }

  return (
    <div className="rise space-y-6">
      <section className="space-y-2">
        <p className="text-sm font-bold tracking-wide text-clay-700 uppercase">Staff view · sample data</p>
        <h1 className="text-4xl font-bold">Confirm a guest’s visit</h1>
        <p className="text-lg text-cocoa-700">Ask the guest for their arrival code and enter it below.</p>
      </section>

      <form onSubmit={lookUp} className="card space-y-4" noValidate>
        <div>
          <label htmlFor="code" className="field-label">
            Arrival code
          </label>
          <input
            id="code"
            className="field font-mono text-2xl tracking-widest uppercase"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="DK-XXXX"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            data-testid="staff-code"
          />
          <p className="mt-2 text-sm text-cocoa-500">
            Demo hint: try the sample code{" "}
            <button
              type="button"
              className="font-mono font-bold text-clay-700 underline"
              onClick={() => setInput(DEMO_ARRIVAL_CODE)}
            >
              {DEMO_ARRIVAL_CODE}
            </button>
          </p>
        </div>
        <button type="submit" className="btn-primary" data-testid="staff-lookup">
          Look up code
        </button>
      </form>

      <section aria-live="polite">
        {code === null ? null : code === "" ? (
          <Message tone="warn" title="Enter a code first">
            Codes look like {DEMO_ARRIVAL_CODE}.
          </Message>
        ) : !trip ? (
          <Message tone="error" title="Code not found" testId="staff-invalid">
            No saved trip matches <span className="font-mono font-bold">{code}</span>. Check the letters with the
            guest (codes never use 0, O, 1, I or L).
          </Message>
        ) : (
          <div className="card space-y-4" data-testid="staff-result">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-mono text-sm font-bold text-cocoa-500">{trip.arrivalCode}</p>
                <h2 className="text-2xl font-bold">{trip.name}</h2>
              </div>
              <StatusPill status={trip.status} />
            </div>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
              <Detail label="Dates" value={`${formatDate(trip.travelFrom)} – ${formatDate(trip.travelTo)}`} />
              <Detail label="Group size" value={`${trip.groupSize} ${trip.groupSize === 1 ? "guest" : "guests"}`} />
              <Detail label="From" value={trip.originCity} />
              <Detail label="Source" value={source?.label ?? "Direct (no referral)"} />
            </dl>

            {trip.status === "saved" && (
              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  confirmVisit(trip.id);
                  setJustConfirmed(true);
                }}
                data-testid="staff-confirm"
              >
                Confirm visit
              </button>
            )}
            {trip.status === "discovered" && (
              <Message tone="warn" title="Trip not saved yet">
                This guest hasn’t saved their trip, so there’s nothing to confirm.
              </Message>
            )}
            {trip.status === "visited" && visit && (
              <Message
                tone={justConfirmed ? "ok" : "warn"}
                title={justConfirmed ? "Visit confirmed" : "Already confirmed"}
                testId={justConfirmed ? "staff-confirmed" : "staff-already"}
              >
                Confirmed{" "}
                {new Date(visit.confirmedAt).toLocaleString("en-GB", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}{" "}
                by {visit.confirmedBy}.
              </Message>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-sm font-semibold text-cocoa-500">{label}</dt>
      <dd className="font-semibold break-words">{value}</dd>
    </div>
  );
}

export function StatusPill({ status }: { status: "discovered" | "saved" | "visited" }) {
  const styles = {
    discovered: "bg-cream-200 text-cocoa-700",
    saved: "bg-gold-400/30 text-cocoa-900",
    visited: "bg-palm-100 text-palm-600",
  }[status];
  return (
    <span className={`rounded-full px-3 py-1 text-sm font-bold capitalize ${styles}`} data-testid="status-pill">
      {status}
    </span>
  );
}

function Message({
  tone,
  title,
  children,
  testId,
}: {
  tone: "ok" | "warn" | "error";
  title: string;
  children: React.ReactNode;
  testId?: string;
}) {
  const border = { ok: "border-palm-600 bg-palm-100", warn: "border-gold-500 bg-cream-100", error: "border-clay-600 bg-cream-100" }[tone];
  return (
    <div role={tone === "error" ? "alert" : "status"} className={`rounded-xl border-l-8 p-4 ${border}`} data-testid={testId}>
      <p className="font-bold">
        {tone === "ok" ? "✓ " : tone === "error" ? "✕ " : "! "}
        {title}
      </p>
      <p className="mt-1 text-cocoa-700">{children}</p>
    </div>
  );
}
