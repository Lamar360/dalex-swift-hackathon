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
| `npm run e2e` | Playwright walkthrough of Screens 1-3 at 390px (needs the dev server on port 5179: `npm run dev -- --port 5179`; first time: `npx playwright install chromium`) |

## Structure

- `src/lib/types.ts`: data model (Source, Trip, Visit, Story, Referral, Session)
- `src/lib/seed.ts`: sample seed data
- `src/lib/store.ts`: the only persistence layer (typed state in localStorage, `useStore` hook, actions)
- `src/screens/`: Discover (`/`), Venue (`/venue`), Save trip (`/trip`)
- `src/components/`: shared layout and journey progress bar

## Status

Built: Discover, Decide (venue), Save (trip + arrival code).
Not yet built: staff visit confirmation, referral screen, dashboard.
