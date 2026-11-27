# De Klinic: From Diaspora Discovery to Visit

Hackathon prototype for De Klinic Restaurant & Pub (Accra). It shows one traceable journey:
**overseas discovery source → saved itinerary → confirmed visit → referral back.**

> Everything in the app is **sample data**. Venue facts (menu, prices, delivery, events, hours) are
> placeholders marked "To be confirmed" until De Klinic confirms them.

## Run

```bash
npm install
npm run dev          # http://localhost:5173
```

Try a referral link: `http://localhost:5173/?src=ldn-ghana-circle`
(other seeded sources: `ai-accra-guide`, `afrobeat-routes`).

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Vite dev server |
| `npm run typecheck` | TypeScript check |
| `npm run build` | Typecheck + production build |
| `npm run e2e` | Playwright walkthrough of the full journey at 390px (needs the dev server on port 5179: `npm run dev -- --port 5179`; first time: `npx playwright install chromium`) |

## Structure

- `src/lib/types.ts`: data model (Source, Trip, Visit, Story, Referral, JourneyEvent, Session)
- `src/lib/seed.ts`: sample seed data
- `src/lib/store.ts`: the only persistence layer (typed state in localStorage, `useStore` hook, actions, selectors)
- `src/data/venue.ts`: every venue detail (placeholders until De Klinic confirms them)
- `src/screens/`: Discover (`/`), Venue (`/venue`), Trip (`/trip`), Refer (`/refer`), Staff (`/staff`), Owner dashboard (`/dashboard`), Guest journeys (`/guests`)
- `src/components/Assistant.tsx`: rule-based demo assistant (not AI, no network calls)
- `src/components/`: shared layout, view switcher and journey progress bar

## Demo script

1. Open `/?src=ldn-ghana-circle` → **See De Klinic** → **Save to my Ghana itinerary** → fill the sample traveller → note the arrival code.
2. **View as: Staff** → enter the code (or the seeded `DK-7HQ4`) → **Confirm visit**.
3. **View as: Traveller** → "Visit confirmed" → leave a story (it shows on the venue page as *Verified visit*) → **Refer a friend** → create and copy the link.
4. Open the link: "You were referred by …".
5. **View as: Owner** → the funnel, sources, December arrivals and guest timeline have updated.

Every step is written to an event log in the store (`discovered`, `saved`, `checked_in`, `visit_confirmed`, `referred`, `question_asked`);
timelines and dashboard numbers are derived from it.

## Venue details

Every venue detail (address, map link, opening hours, menu, prices, delivery coverage, group bookings, events and the
WhatsApp number) lives in `src/data/venue.ts`. `null` means "To be confirmed" and the app shows a placeholder. Replace
a value there and the venue page, the arrival section on `/trip` and the demo assistant all update. The WhatsApp number
`233000000000` is a **sample** and must be replaced before real use.

## Deploy to Vercel

Not deployed yet. The repo is ready for it:

1. `npm run build` writes the static site to `dist/`.
2. `vercel.json` sets the build command and output directory, and rewrites every path to `/index.html` so deep
   links like `/trip`, `/staff` or `/?src=ldn-ghana-circle` load the app instead of a 404.
3. In Vercel: **Add New → Project**, import this GitHub repo, keep the detected settings and deploy (or run
   `npx vercel` then `npx vercel --prod` from the repo root).

Data still lives in each visitor's browser (localStorage), so a deployed demo has no shared backend.

## Limits

No backend: everything lives in this browser's localStorage, so the staff and traveller views must run in
the same browser (open tabs stay in sync). Referral links only resolve in that browser too.
