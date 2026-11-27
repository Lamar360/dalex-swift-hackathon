import { Link, useNavigate } from "react-router";
import { currentTrip, findSource, markInterested, useStore } from "../lib/store";

const VENUE_DETAILS: { label: string; value?: string }[] = [
  { label: "Location", value: "Accra, Ghana" },
  { label: "Opening hours" },
];

/** Still to be confirmed with the owners: shown as placeholders, never guessed. */
const OFFER_PLACEHOLDERS = ["Menu", "Prices", "Delivery coverage", "Group bookings", "Events"];

function BriefTag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-gold-400/25 px-3 py-1 text-sm font-semibold text-cocoa-900">
      {children}
    </span>
  );
}

function Tbc() {
  return <span className="tbc">To be confirmed</span>;
}

export function Venue() {
  const navigate = useNavigate();
  const stories = useStore((s) => s.stories);
  const source = useStore((s) => findSource(s, s.session.sourceId));
  const interestedAt = useStore((s) => s.session.interestedAt);
  const trip = useStore(currentTrip);

  const verified = stories.filter((s) => s.verifiedVisit);
  const hiddenCount = stories.length - verified.length;

  return (
    <div className="rise space-y-8">
      <section className="space-y-3">
        {source && (
          <p className="text-sm font-semibold text-clay-700">Recommended by {source.label}</p>
        )}
        <h1 className="text-4xl font-bold sm:text-5xl">De Klinic Restaurant &amp; Pub</h1>
        <p className="text-lg text-cocoa-700">
          A place to eat, drink and gather in Accra. Full venue details are being confirmed with the owners.
        </p>
      </section>

      <section aria-label="Plan your visit" className="card space-y-3 border-2 border-cream-200">
        {trip ? (
          <>
            <p className="font-semibold">
              Saved to your itinerary · code <span className="font-mono">{trip.arrivalCode}</span>
            </p>
            <Link to="/trip" className="btn-primary">
              View my trip
            </Link>
          </>
        ) : (
          <div className="flex flex-col gap-3 sm:flex-row">
            <button type="button" className="btn-primary" onClick={() => navigate("/trip")} data-testid="cta-save">
              Save to my Ghana itinerary
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={markInterested}
              disabled={interestedAt !== null}
              aria-pressed={interestedAt !== null}
              data-testid="cta-interested"
            >
              {interestedAt ? "✓ Interest noted" : "I’m interested"}
            </button>
          </div>
        )}
        {interestedAt && !trip && (
          <p role="status" className="text-sm text-cocoa-700">
            Thanks, we’ve noted your interest. Save it to your itinerary to get an arrival code.
          </p>
        )}
      </section>

      <section aria-labelledby="details-heading" className="card">
        <h2 id="details-heading" className="text-xl font-bold">
          Venue details
        </h2>
        <dl className="mt-3 divide-y divide-cream-200">
          {VENUE_DETAILS.map((d) => (
            <div key={d.label} className="flex flex-wrap items-center justify-between gap-2 py-3">
              <dt className="font-semibold">{d.label}</dt>
              <dd>{d.value ?? <Tbc />}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="offers-heading" className="space-y-3" data-testid="venue-offers">
        <h2 id="offers-heading" className="text-2xl font-bold">
          What De Klinic offers
        </h2>
        <div className="card space-y-2 border-l-8 border-clay-500">
          <BriefTag>From the brief</BriefTag>
          <p className="font-display text-xl font-bold text-cocoa-950">Local food and the pub experience</p>
          <p className="text-cocoa-700">Specific dishes, drinks and prices are still being confirmed with the owners.</p>
        </div>
        <div className="card space-y-3 bg-cream-100 shadow-none" data-testid="story-to-confirm">
          <BriefTag>From the brief · to be confirmed with De Klinic</BriefTag>
          <h3 className="text-xl font-bold">A story worth confirming</h3>
          <blockquote className="border-l-4 border-sand-300 pl-4 text-lg leading-relaxed">
            Portia has publicly described serving meals bought by a supporter for five followers.
          </blockquote>
          <p className="text-sm text-cocoa-500">Not verified yet. It will only be shown as fact once De Klinic confirms it.</p>
        </div>
        <div className="card">
          <dl className="divide-y divide-cream-200">
            {OFFER_PLACEHOLDERS.map((label) => (
              <div key={label} className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0 last:pb-0">
                <dt className="font-semibold">{label}</dt>
                <dd>
                  <Tbc />
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section aria-labelledby="stories-heading" className="space-y-3">
        <h2 id="stories-heading" className="text-2xl font-bold">
          From visitors
        </h2>
        {verified.length === 0 ? (
          <div className="card text-cocoa-700" data-testid="stories-empty">
            No verified visitor stories yet. Stories appear here once a visit has been confirmed at the venue.
          </div>
        ) : (
          <ul className="space-y-3">
            {verified.map((story) => (
              <li key={story.id} className="card" data-testid="story">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-palm-100 px-3 py-1 text-sm font-bold text-palm-600">
                  <span aria-hidden>✓</span> Verified visit
                </span>
                <blockquote className="mt-3 text-lg leading-relaxed">“{story.text}”</blockquote>
                <p className="mt-2 text-sm font-semibold text-cocoa-500">{story.author}</p>
              </li>
            ))}
          </ul>
        )}
        {hiddenCount > 0 && (
          <p className="text-sm text-cocoa-500">
            {hiddenCount} more {hiddenCount === 1 ? "story is" : "stories are"} hidden until the visit is confirmed.
          </p>
        )}
      </section>

    </div>
  );
}
