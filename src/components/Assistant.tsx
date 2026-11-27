import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { SAMPLE, VENUE, whatsappLink, type SampleMenuItem } from "../data/venue";
import { askQuestion } from "../lib/store";

/**
 * Demo assistant: rule-based, NOT AI. No network calls, no API keys.
 * Confirmed answers come from VENUE in src/data/venue.ts. Where a detail is not confirmed yet, the assistant may use
 * the clearly marked SAMPLE block, and every such answer ends with SAMPLE.note.
 */

interface Reply {
  text: string;
  /** True when the answer is a placeholder or sample, so the traveller is offered a way to ask the team. */
  unconfirmed: boolean;
}

const sample = (text: string): Reply => ({ text: `${text}\n\n${SAMPLE.note}`, unconfirmed: true });
const confirmed = (text: string): Reply => ({ text, unconfirmed: false });
const tbc = (what: string): Reply => ({ text: `${what} still to be confirmed with De Klinic.`, unconfirmed: true });
const ghs = (n: number) => `GHS ${n}`;
const line = (i: SampleMenuItem) => `• ${i.name}, ${ghs(i.priceGhs)}`;

function findItem(t: string): SampleMenuItem | undefined {
  return SAMPLE.menu.find((i) => i.keywords.some((k) => t.includes(k)));
}

interface Intent {
  id: string;
  chip?: string;
  /** What the traveller "asks" when they tap the chip. */
  ask?: string;
  keywords: string[];
  answer: (t: string) => Reply;
}

const INTENTS: Intent[] = [
  {
    id: "menu",
    chip: "Menu",
    ask: "What’s on the menu?",
    keywords: ["menu", "food", "dish", "eat", "drink", "pub", "serve", "hungry"],
    answer: () =>
      VENUE.menuHighlights.value
        ? confirmed(`On the menu: ${VENUE.menuHighlights.value}`)
        : sample(`Here’s a taste of what’s on:\n${SAMPLE.menu.map(line).join("\n")}`),
  },
  {
    id: "prices",
    chip: "Prices",
    ask: "How much are things?",
    keywords: ["price", "cost", "how much", "expensive", "cheap", "cedi", "ghs", "budget"],
    answer: () => {
      if (VENUE.prices.value) return confirmed(`Prices: ${VENUE.prices.value}`);
      const food = SAMPLE.menu.filter((i) => i.kind === "food").map((i) => i.priceGhs);
      const drink = SAMPLE.menu.filter((i) => i.kind === "drink").map((i) => i.priceGhs);
      return sample(
        `Plates run from about ${ghs(Math.min(...food))} to ${ghs(Math.max(...food))}, and drinks from ${ghs(Math.min(...drink))}. For example:\n${SAMPLE.menu.slice(0, 3).map(line).join("\n")}`,
      );
    },
  },
  {
    id: "address",
    chip: "Address",
    ask: "Where are you?",
    keywords: ["address", "where", "location", "map", "direction", "find you", "located"],
    answer: () =>
      VENUE.address.value
        ? confirmed(`You’ll find us at ${VENUE.address.value}.${VENUE.mapUrl.value ? ` Map: ${VENUE.mapUrl.value}` : ""}`)
        : { text: `We’re in ${VENUE.area}. The exact address is still to be confirmed with De Klinic.`, unconfirmed: true },
  },
  {
    id: "hours",
    chip: "Opening hours",
    ask: "When are you open?",
    keywords: ["hour", "open", "close", "closing", "what time", "today", "tonight", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday", "weekend"],
    answer: (t) => {
      if (VENUE.openingHours.value) return confirmed(`Opening hours: ${VENUE.openingHours.value}`);
      const day = SAMPLE.openingHours.find((h) => h.days.some((d) => t.includes(d)));
      if (day) {
        const name = day.days.find((d) => t.includes(d))!;
        return sample(`Yes, on ${name[0].toUpperCase()}${name.slice(1)}s we’re open ${day.hours}.`);
      }
      return sample(SAMPLE.openingHours.map((h) => `• ${h.label}: ${h.hours}`).join("\n"));
    },
  },
  {
    id: "delivery",
    chip: "Delivery",
    ask: "Do you deliver?",
    keywords: ["deliver", "takeaway", "take away", "order"],
    answer: () =>
      VENUE.deliveryCoverage.value ? confirmed(`Delivery: ${VENUE.deliveryCoverage.value}`) : tbc("Delivery areas are"),
  },
  {
    id: "groups",
    chip: "Group bookings",
    ask: "Can I book for a group?",
    keywords: ["book", "reserv", "table", "group", "party of", "people", "seats"],
    answer: (t) => {
      if (VENUE.groupBookings.value) return confirmed(`Group bookings: ${VENUE.groupBookings.value}`);
      const n = t.match(/\b(\d{1,3})\b/)?.[1];
      return sample(`${n ? `A table for ${n}? Lovely. ` : "Happy to host your group. "}${SAMPLE.groupBookings}`);
    },
  },
  {
    id: "events",
    chip: "Events",
    ask: "Any events coming up?",
    keywords: ["event", "music", "dj", "new year", "nye", "christmas", "live", "party", "band"],
    answer: () => (VENUE.events.value ? confirmed(`Events: ${VENUE.events.value}`) : sample(SAMPLE.events)),
  },
  {
    id: "code",
    chip: "How the arrival code works",
    ask: "How does the arrival code work?",
    keywords: ["arrival code", "code", "check in", "check-in", "arrive", "arrived"],
    answer: () =>
      confirmed(
        "Save your trip to get a short arrival code like DK-7HQ4. When you get there, tap “I’ve arrived” on My trip and show the code to staff. Your visit is only verified once staff confirm it.",
      ),
  },
  {
    id: "referrals",
    chip: "How referrals work",
    ask: "How do referrals work?",
    keywords: ["refer", "friend", "share", "link", "invite"],
    answer: () =>
      confirmed(
        "After staff confirm your visit, you can create your own share link on the Refer page. Friends who open it see that you recommended De Klinic, and De Klinic sees the visit came from you.",
      ),
  },
  {
    id: "contact",
    keywords: ["whatsapp", "contact", "phone", "call", "number", "message"],
    answer: () =>
      confirmed(
        `WhatsApp: ${VENUE.whatsapp.display}.${VENUE.whatsapp.isSample ? " It’s a placeholder, so messages won’t reach De Klinic yet." : ""}`,
      ),
  },
];

export const UNKNOWN_REPLY = "Good question. I don’t know that one yet. You can ask the team directly, or leave it for them.";
export const LEFT_REPLY = "Thanks! I’ve passed your question to De Klinic. The team will see it on their dashboard.";

export function respond(text: string, intent?: Intent): Reply {
  const t = text.toLowerCase();
  if (!intent) {
    // A specific dish or drink wins: "price of jollof", "do you have sobolo?"
    const item = findItem(t);
    if (item && !VENUE.menuHighlights.value) {
      return sample(`${item.name}: ${ghs(item.priceGhs)}.`);
    }
    let best: { intent: Intent; score: number } | undefined;
    for (const i of INTENTS) {
      const score = i.keywords.filter((k) => t.includes(k)).length;
      if (score > 0 && (!best || score > best.score)) best = { intent: i, score };
    }
    intent = best?.intent;
  }
  return intent ? intent.answer(t) : { text: UNKNOWN_REPLY, unconfirmed: true };
}

interface Message {
  id: number;
  from: "guest" | "assistant";
  text: string;
  /** The traveller question this reply could not fully answer. */
  followUp?: string;
  left?: boolean;
}

function FollowUp({ message, onLeave }: { message: Message; onLeave: () => void }) {
  const q = message.followUp!;
  return (
    <div className="mt-2 flex flex-wrap gap-2" data-testid="assistant-followup">
      <a
        href={whatsappLink(`Hi De Klinic, I have a question: ${q}`)}
        target="_blank"
        rel="noreferrer"
        className="inline-flex min-h-9 items-center rounded-full bg-palm-600 px-3 text-sm font-semibold text-cream-50 hover:bg-palm-600/90"
        data-testid="assistant-ask-whatsapp"
      >
        Ask the team on WhatsApp
        <span className="sr-only"> (sample number)</span>
      </a>
      {message.left ? (
        <span className="inline-flex min-h-9 items-center px-1 text-sm font-semibold text-palm-600" data-testid="assistant-left">
          ✓ Left for the team
        </span>
      ) : (
        <button
          type="button"
          onClick={onLeave}
          className="inline-flex min-h-9 items-center rounded-full border border-cocoa-900/30 bg-white px-3 text-sm font-semibold hover:bg-cream-200"
          data-testid="assistant-leave"
        >
          Leave this for the team
        </button>
      )}
    </div>
  );
}

export function Assistant() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 0,
      from: "assistant",
      text: "Akwaaba! Ask me about food, prices, hours or bookings. Some answers are sample details until De Klinic confirms them, and I’ll always say so.",
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

  function ask(question: string, intent?: Intent) {
    const q = question.trim();
    if (!q) return;
    const reply = respond(q, intent);
    setMessages((m) => [
      ...m,
      { id: m.length, from: "guest", text: q },
      { id: m.length + 1, from: "assistant", text: reply.text, followUp: reply.unconfirmed ? q : undefined },
    ]);
  }

  function leave(id: number) {
    const msg = messages.find((m) => m.id === id);
    if (!msg?.followUp || msg.left) return;
    askQuestion(msg.followUp);
    setMessages((m) => [
      ...m.map((x) => (x.id === id ? { ...x, left: true } : x)),
      { id: m.length, from: "assistant", text: LEFT_REPLY },
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
          className="pop assistant-panel fixed inset-x-3 bottom-3 z-50 flex max-h-[calc(100dvh-9.75rem)] flex-col overflow-hidden rounded-3xl bg-white shadow-[var(--shadow-float)] ring-1 ring-cocoa-900/5 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:max-h-[min(36rem,calc(100dvh-5rem))] sm:w-[24rem]"
          data-testid="assistant-panel"
        >
          <div className="flex items-start justify-between gap-3 bg-cocoa-900 px-5 py-3 text-cream-100">
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
            {messages.map((m) =>
              m.from === "guest" ? (
                <p
                  key={m.id}
                  className="ml-auto max-w-[85%] rounded-2xl bg-clay-500 px-4 py-2.5 leading-snug text-cream-50"
                  data-testid="assistant-question"
                >
                  <span className="sr-only">You: </span>
                  {m.text}
                </p>
              ) : (
                <div key={m.id} className="max-w-[90%]">
                  <p className="rounded-2xl bg-cream-100 px-4 py-2.5 leading-snug whitespace-pre-line text-cocoa-900" data-testid="assistant-reply">
                    <span className="sr-only">De Klinic demo assistant: </span>
                    {m.text}
                  </p>
                  {m.followUp && <FollowUp message={m} onLeave={() => leave(m.id)} />}
                </div>
              ),
            )}
          </div>

          <div className="border-t border-cream-200 px-4 pt-3 pb-4">
            <ul className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 [scrollbar-width:none]" aria-label="Suggested questions">
              {INTENTS.filter((i) => i.chip).map((i) => (
                <li key={i.id} className="shrink-0">
                  <button
                    type="button"
                    onClick={() => ask(i.ask!, i)}
                    className="min-h-9 rounded-full border border-sand-300 px-3 text-sm font-semibold whitespace-nowrap text-cocoa-700 hover:border-clay-500 hover:text-clay-700"
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
                placeholder="Try “price of jollof”"
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
