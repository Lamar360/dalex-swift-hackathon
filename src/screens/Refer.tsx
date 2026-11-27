import { useState } from "react";
import { Link } from "react-router";
import { createReferral, currentTrip, REFERRAL_CHANNELS, referralFor, useStore } from "../lib/store";
import type { ReferralChannel } from "../lib/types";

export function Refer() {
  const trip = useStore(currentTrip);
  const [channel, setChannel] = useState<ReferralChannel>("community");
  const referral = useStore((s) => referralFor(s, trip?.id, channel));
  const broughtIn = useStore((s) =>
    referral ? s.events.filter((e) => e.type === "discovered" && e.sourceId === referral.sourceId).length : 0,
  );
  const [copied, setCopied] = useState<"idle" | "ok" | "fail">("idle");

  if (!trip || trip.status !== "visited") {
    return (
      <div className="rise card space-y-3" data-testid="refer-locked">
        <h1 className="text-3xl font-bold">Referrals unlock after your visit</h1>
        <p className="text-cocoa-700">
          {trip
            ? `Once staff confirm your visit with code ${trip.arrivalCode}, you can share your own link here.`
            : "Save a trip and visit De Klinic first. Then you can share your own link here."}
        </p>
        <Link to={trip ? "/trip" : "/venue"} className="btn-primary">
          {trip ? "View my trip" : "See De Klinic"}
        </Link>
      </div>
    );
  }

  const firstName = trip.name.split(" ")[0];
  const link = referral ? `${window.location.origin}/?src=${referral.sourceId}` : "";

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied("ok");
    } catch {
      setCopied("fail");
    }
  }

  return (
    <div className="rise space-y-6">
      <section className="space-y-2">
        <p className="text-sm font-bold tracking-wide text-palm-600 uppercase">✓ Visit confirmed</p>
        <h1 className="text-4xl font-bold">Send a friend your way, {firstName}.</h1>
        <p className="text-lg text-cocoa-700">
          Your link tells the next guest you’ve been, and lets De Klinic see that the visit came from you.
        </p>
      </section>

      <fieldset className="card space-y-3">
        <legend className="sr-only">Who are you referring De Klinic to?</legend>
        <p className="field-label">Who are you sharing with?</p>
        <div className="grid gap-2 sm:grid-cols-3" data-testid="referral-channel">
          {REFERRAL_CHANNELS.map((c) => (
            <label
              key={c.value}
              className="flex cursor-pointer flex-col rounded-xl border-2 border-sand-300 px-4 py-3 has-[:checked]:border-clay-500 has-[:checked]:bg-cream-100 has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-gold-500"
            >
              <input
                type="radio"
                name="channel"
                value={c.value}
                checked={channel === c.value}
                onChange={() => {
                  setChannel(c.value);
                  setCopied("idle");
                }}
                className="sr-only"
              />
              <span className="font-semibold">{c.label}</span>
              <span className="text-sm text-cocoa-500">{c.hint}</span>
            </label>
          ))}
        </div>
        {!referral && (
          <button
            type="button"
            className="btn-primary"
            onClick={() => createReferral(trip.id, channel)}
            data-testid="create-referral"
          >
            Create my share link
          </button>
        )}
      </fieldset>

      {referral && (
        <>
          <section className="card space-y-3">
            <label htmlFor="share-link" className="field-label">
              Your share link
            </label>
            <input
              id="share-link"
              readOnly
              value={link}
              onFocus={(e) => e.currentTarget.select()}
              className="field font-mono text-sm"
              data-testid="share-link"
            />
            <button type="button" className="btn-primary" onClick={copy} data-testid="copy-link">
              {copied === "ok" ? "✓ Copied" : "Copy link"}
            </button>
            <p role="status" className="text-sm text-cocoa-500">
              {copied === "fail" ? "Couldn’t copy automatically. Select the link above and copy it." : ""}
              {broughtIn > 0 ? ` ${broughtIn} ${broughtIn === 1 ? "person has" : "people have"} opened your link.` : ""}
            </p>
          </section>

          <section aria-labelledby="preview-heading" className="space-y-2">
            <h2 id="preview-heading" className="text-sm font-bold tracking-wide text-cocoa-500 uppercase">
              Share preview
            </h2>
            <div className="tilt max-w-sm overflow-hidden rounded-2xl border border-sand-300 bg-white shadow-[var(--shadow-card)]" data-testid="share-preview">
              <div className="bg-cocoa-900 px-4 pt-0 pb-5 text-cream-100">
                <div className="weave -mx-4 mb-4" aria-hidden />
                <p className="font-display text-2xl font-bold text-cream-50">De Klinic</p>
                <p className="text-xs tracking-[0.2em] text-sand-300 uppercase">Restaurant &amp; Pub · Accra</p>
              </div>
              <div className="space-y-1 p-4">
                <p className="font-bold">{firstName} visited De Klinic and recommends it</p>
                <p className="text-sm text-cocoa-700">
                  Planning a trip to Accra? Save it to your Ghana itinerary and get an arrival code.
                </p>
                <p className="truncate font-mono text-xs text-cocoa-500">{link.replace(/^https?:\/\//, "")}</p>
              </div>
            </div>
            <p className="text-xs text-cocoa-500">Preview only. Nothing is posted anywhere. (Sample data)</p>
          </section>

          <Link to={`/?src=${referral.sourceId}`} className="btn-secondary" data-testid="open-referral">
            Open the link as a new guest
          </Link>
        </>
      )}
    </div>
  );
}
