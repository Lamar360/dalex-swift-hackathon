export const JOURNEY_STEPS = ["Discover", "Decide", "Save", "Visit", "Refer"] as const;
export type JourneyStep = (typeof JOURNEY_STEPS)[number];

interface Props {
  /** Index of the step the traveller is on (0-based). */
  current: number;
  /** Highest step already completed, so earlier steps show as done. */
  completed: number;
}

/** Thin, single-line stepper that sits under the slim header. */
export function JourneyProgress({ current, completed }: Props) {
  return (
    <nav aria-label="Journey progress" className="border-t border-cream-100/10" data-testid="journey-progress">
      <ol className="mx-auto flex h-9 max-w-3xl items-center gap-1 px-4">
        {JOURNEY_STEPS.map((step, i) => {
          const done = i <= completed && i !== current;
          const active = i === current;
          return (
            <li key={step} className="flex flex-1 items-center gap-1.5">
              <span
                aria-current={active ? "step" : undefined}
                className={`h-2 w-2 shrink-0 rounded-full ${
                  active ? "bg-gold-400 ring-3 ring-gold-400/30" : done ? "bg-gold-400" : "bg-cream-100/25"
                }`}
              />
              <span
                className={`truncate text-xs font-semibold ${
                  active ? "text-gold-400" : done ? "text-cream-100" : "text-cream-100/50"
                }`}
              >
                {step}
                <span className="sr-only">{active ? " (current step)" : done ? " (done)" : " (upcoming)"}</span>
              </span>
              {i < JOURNEY_STEPS.length - 1 && (
                <span
                  aria-hidden
                  className={`hidden h-px flex-1 sm:block ${i < Math.max(completed, current) ? "bg-gold-400/70" : "bg-cream-100/15"}`}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
