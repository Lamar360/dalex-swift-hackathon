export const JOURNEY_STEPS = ["Discover", "Decide", "Save", "Visit", "Refer"] as const;
export type JourneyStep = (typeof JOURNEY_STEPS)[number];

interface Props {
  /** Index of the step the traveller is on (0-based). */
  current: number;
  /** Highest step already completed, so earlier steps show as done. */
  completed: number;
}

export function JourneyProgress({ current, completed }: Props) {
  return (
    <nav aria-label="Journey progress" className="mx-auto w-full max-w-3xl px-4">
      <ol className="flex items-start">
        {JOURNEY_STEPS.map((step, i) => {
          const done = i <= completed && i !== current;
          const active = i === current;
          return (
            <li key={step} className="relative flex flex-1 flex-col items-center text-center">
              {i > 0 && (
                <span
                  aria-hidden
                  className={`absolute top-4 right-1/2 h-1 w-full -translate-y-1/2 ${
                    i <= Math.max(completed, current) ? "bg-gold-400" : "bg-cocoa-700"
                  }`}
                />
              )}
              <span
                aria-current={active ? "step" : undefined}
                className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                  active
                    ? "bg-gold-400 text-cocoa-950 ring-4 ring-gold-400/30"
                    : done
                      ? "bg-gold-400 text-cocoa-950"
                      : "bg-cocoa-700 text-cream-200"
                }`}
              >
                {done ? "✓" : i + 1}
              </span>
              <span
                className={`mt-1.5 text-xs font-semibold tracking-wide sm:text-sm ${
                  active ? "text-gold-400" : done ? "text-cream-100" : "text-cream-200/60"
                }`}
              >
                {step}
                <span className="sr-only">{active ? " (current step)" : done ? " (done)" : " (upcoming)"}</span>
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
