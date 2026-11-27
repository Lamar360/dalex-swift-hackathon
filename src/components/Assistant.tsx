import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { TBC_WITH_VENUE, VENUE, type VenueField } from "../data/venue";
import { askQuestion } from "../lib/store";

/**
 * Demo assistant: rule-based, NOT AI. No network calls, no API keys.
 * Answers come from src/data/venue.ts; anything it can't match is stored as an open question.
 */

const field = (f: VenueField, extra = "") =>
  f.value ? `${f.label}: ${f.value}` : `${f.label}: ${TBC_WITH_VENUE}. We’ll show it here once they confirm it.${extra}`;

interface Intent {
  id: string;
  chip?: string;
  keywords: string[];
  answer: () => string;
}

const INTENTS: Intent[] = [
  { id: "menu", chip: "Menu", keywords: ["menu", "food", "dish", "eat", "jollof", "drink", "beer", "pub"], answer: () => field(VENUE.menuHighlights) },
  { id: "prices", chip: "Prices", keywords: ["price", "cost", "expensive", "cheap", "how much", "cedi"], answer: () => field(VENUE.prices) },
  {
    id: "address",
    chip: "Address",
    keywords: ["address", "where", "location", "map", "direction", "find you", "located"],
    answer: () =>
      VENUE.address.value
        ? `Address: ${VENUE.address.value}${VENUE.mapUrl.value ? ` (map: ${VENUE.mapUrl.value})` : ""}`
        : `De Klinic is in ${VENUE.area}. The exact address is ${TBC_WITH_VENUE.toLowerCase()}.`,
  },
  { id: "hours", chip: "Opening hours", keywords: ["hour", "open", "close", "closing", "what time"], answer: () => field(VENUE.openingHours) },
  { id: "delivery", chip: "Delivery", keywords: ["deliver", "takeaway", "take away", "order"], answer: () => field(VENUE.deliveryCoverage) },
  {
    id: "groups",
    chip: "Group bookings",
    keywords: ["group", "book", "reserv", "table for", "big table"],
    answer: () => field(VENUE.groupBookings, " Saving a trip with your group size helps De Klinic plan."),
  },
  { id: "events", chip: "Events", keywords: ["event", "music", "dj", "new year", "christmas", "live", "party"], answer: () => field(VENUE.events) },
  {
    id: "code",
    chip: "How the arrival code works",
    keywords: ["arrival code", "code", "check in", "check-in", "arrive", "arrived"],
    answer: () =>
      "Save your trip to get a short arrival code like DK-7HQ4. When you get there, tap “I’ve arrived” on My trip and show the code to staff. Your visit is only verified once staff confirm it.",
  },
  {
    id: "referrals",
    chip: "How referrals work",
    keywords: ["refer", "friend", "share", "link", "invite"],
    answer: () =>
      "After staff confirm your visit, you can create your own share link on the Refer page. Friends who open it see that you recommended De Klinic, and De Klinic sees the visit came from you.",
  },
  {
    id: "contact",
    keywords: ["whatsapp", "contact", "phone", "call", "number", "message"],
    answer: () =>
      `WhatsApp: ${VENUE.whatsapp.display}.${VENUE.whatsapp.isSample ? " This is a placeholder, so messages won’t reach De Klinic yet." : ""}`,
  },
];

export const UNKNOWN_REPLY = "I don’t know yet. I’ve passed your question to De Klinic.";

export function matchIntent(text: string): Intent | undefined {
  const t = text.toLowerCase();
  let best: { intent: Intent; score: number } | undefined;
  for (const intent of INTENTS) {
    const score = intent.keywords.filter((k) => t.includes(k)).length;
    if (score > 0 && (!best || score > best.score)) best = { intent, score };
  }
  return best?.intent;
}

interface Message {
  id: number;
  from: "guest" | "assistant";
  text: string;
}

export function Assistant() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 0,
      from: "assistant",
      text: "Akwaaba! Ask me about De Klinic. Many details are still being confirmed, and I’ll say so when they are.",
    },
  ]);
  const fab = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const wasOpen = useRef(false);

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
      const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
      document.addEventListener("keydown", onKey);
      wasOpen.current = true;
      return () => document.removeEventListener("keydown", onKey);
    }
    if (wasOpen.current) fab.current?.focus();
  }, [open]);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [messages]);

  function ask(question: string, intent = matchIntent(question)) {
    const q = question.trim();
    if (!q) return;
    let reply: string;
    if (intent) {
      reply = intent.answer();
    } else {
      askQuestion(q);
      reply = UNKNOWN_REPLY;
    }
    setMessages((m) => [
      ...m,
      { id: m.length, from: "guest", text: q },
      { id: m.length + 1, from: "assistant", text: reply },
    ]);
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    ask(input);
    setInput("");
  }

  return (
    <>
      {!open && (
        <button
          ref={fab}
          type="button"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          className="btn-primary fixed right-4 bottom-4 z-40 w-auto! gap-2 px-5 shadow-[var(--shadow-float)] sm:right-6 sm:bottom-6"
          data-testid="assistant-open"
        >
          <svg aria-hidden viewBox="0 0 20 20" className="h-5 w-5">
            <path
              d="M4 4.5h12a1.5 1.5 0 0 1 1.5 1.5v6.5A1.5 1.5 0 0 1 16 14H9l-3.5 3v-3H4a1.5 1.5 0 0 1-1.5-1.5V6A1.5 1.5 0 0 1 4 4.5Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
          </svg>
          Ask De Klinic
        </button>
      )}

      {open && (
        <div
          role="dialog"
          aria-labelledby={titleId}
          className="pop fixed inset-x-3 bottom-3 z-50 flex max-h-[min(36rem,calc(100dvh-5rem))] flex-col overflow-hidden rounded-3xl bg-white shadow-[var(--shadow-float)] ring-1 ring-cocoa-900/5 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:w-[24rem] assistant-panel"
          data-testid="assistant-panel"
        >
          <div className="flex items-start justify-between gap-3 bg-cocoa-900 px-5 py-4 text-cream-100">
            <div>
              <h2 id={titleId} className="font-display text-xl font-bold text-cream-50">
                Ask De Klinic
              </h2>
              <p className="text-sm text-sand-300" data-testid="assistant-label">
                Demo assistant · not AI
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex h-10 w-10 items-center justify-center rounded-full text-cream-100 hover:bg-cream-100/10"
              aria-label="Close assistant"
              data-testid="assistant-close"
            >
              <svg aria-hidden viewBox="0 0 16 16" className="h-4 w-4">
                <path d="M3 3l10 10M13 3 3 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <div ref={logRef} role="log" aria-live="polite" className="flex-1 space-y-3 overflow-y-auto px-4 py-4" data-testid="assistant-log">
            {messages.map((m) => (
              <p
                key={m.id}
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 leading-snug ${
                  m.from === "guest" ? "ml-auto bg-clay-500 text-cream-50" : "bg-cream-100 text-cocoa-900"
                }`}
                data-testid={m.from === "assistant" ? "assistant-reply" : "assistant-question"}
              >
                <span className="sr-only">{m.from === "guest" ? "You: " : "De Klinic demo assistant: "}</span>
                {m.text}
              </p>
            ))}
          </div>

          <div className="border-t border-cream-200 px-4 pt-3 pb-4">
            <ul className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 [scrollbar-width:none]" aria-label="Suggested questions">
              {INTENTS.filter((i) => i.chip).map((i) => (
                <li key={i.id} className="shrink-0">
                  <button
                    type="button"
                    onClick={() => ask(i.chip!, i)}
                    className="min-h-9 rounded-full border border-sand-300 px-3 text-sm whitespace-nowrap font-semibold text-cocoa-700 hover:border-clay-500 hover:text-clay-700"
                    data-testid={`assistant-chip-${i.id}`}
                  >
                    {i.chip}
                  </button>
                </li>
              ))}
            </ul>
            <form onSubmit={onSubmit} className="mt-3 flex gap-2">
              <label htmlFor="assistant-input" className="sr-only">
                Your question
              </label>
              <input
                id="assistant-input"
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a question…"
                autoComplete="off"
                className="field min-h-11 flex-1 rounded-full py-2"
                data-testid="assistant-input"
              />
              <button type="submit" className="btn-primary min-h-11! w-auto! px-4" data-testid="assistant-send">
                Send
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
