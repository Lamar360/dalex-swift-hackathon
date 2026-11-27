// End-to-end check of the full journey at 390px, plus desktop screenshots.
// Usage: npm run dev -- --port 5179, then npm run e2e [screenshotDir]
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const out = process.argv[2] ?? "test-results";
mkdirSync(out, { recursive: true });
const base = process.env.BASE_URL ?? "http://localhost:5179";

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin: base });
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
page.on("dialog", (d) => d.accept());

const check = (cond, msg) => {
  console.log((cond ? "PASS " : "FAIL ") + msg);
  if (!cond) process.exitCode = 1;
};
const shot = async (name) => {
  await page.waitForTimeout(600); // let the fade-in finish
  await page.screenshot({ path: `${out}/${name}.png`, fullPage: true });
};
const text = (id) => page.getByTestId(id).innerText();
/** True when the element's whole box sits inside the current viewport (no scrolling needed). */
const aboveFold = (id) =>
  page.getByTestId(id).evaluate((el) => {
    const r = el.getBoundingClientRect();
    return r.top >= 0 && r.bottom <= window.innerHeight && r.right <= window.innerWidth;
  });
async function checkHomeAboveFold(label) {
  const ok = (await page.locator("#hero-heading").evaluate((el) => el.getBoundingClientRect().bottom <= window.innerHeight)) && (await aboveFold("cta-venue"));
  check(ok, `${label}: headline and See De Klinic visible without scrolling`);
}
const NEW_SOURCES = [
  { id: "ghana-travel-search", label: "Ghana travel search (sample)", type: "Web search", disc: 3, saved: 1, visited: 0 },
  { id: "dec-accra-itinerary", label: "December in Accra itinerary (sample)", type: "Curated itinerary", disc: 2, saved: 1, visited: 0 },
  { id: "accra-host", label: "Host in Accra (sample)", type: "Local host", disc: 2, saved: 1, visited: 1 },
];
const rowCounts = async (id) => {
  const cells = await page.getByTestId(`source-row-${id}`).locator("td").allInnerTexts();
  return { label: cells[0], disc: Number(cells[1]), saved: Number(cells[2]), visited: Number(cells[3]) };
};
const guestTypes = async () => {
  const r = {};
  for (const t of ["solo", "friends", "family", "group"]) r[t] = Number(await text(`guest-type-${t}`));
  return r;
};
async function dashboardCounts() {
  await page.goto(`${base}/dashboard`);
  await page.getByTestId("funnel-discovered").waitFor();
  const n = async (id) => Number(await text(id));
  return {
    discovered: await n("funnel-discovered"),
    saved: await n("funnel-saved"),
    visited: await n("funnel-visited"),
    referred: await n("funnel-referred"),
    decTrips: await n("dec-trips"),
    decGuests: await n("dec-guests"),
  };
}

// Fresh seed.
await page.goto(`${base}/staff`);
await page.evaluate(() => localStorage.clear());

// 0. Dashboard baseline from seed data.
const before = await dashboardCounts();
check(
  before.discovered === 21 && before.saved === 9 && before.visited === 3 && before.referred === 1,
  `seed funnel 21/9/3/1 (got ${JSON.stringify(before)})`,
);
check(before.decTrips === 6 && before.decGuests === 21, `seed December arrivals: 6 trips, 21 guests (got ${before.decTrips}/${before.decGuests})`);
for (const src of NEW_SOURCES) {
  const r = await rowCounts(src.id);
  check(
    r.label.includes(src.label) && r.label.includes(src.type) && r.disc === src.disc && r.saved === src.saved && r.visited === src.visited,
    `Sources table: ${src.id} ${src.disc}/${src.saved}/${src.visited} (got ${JSON.stringify(r)})`,
  );
}
const gtBefore = await guestTypes();
check(
  gtBefore.solo === 1 && gtBefore.friends === 4 && gtBefore.family === 3 && gtBefore.group === 1,
  `seed guest-type breakdown 1/4/3/1 (got ${JSON.stringify(gtBefore)})`,
);
check((await page.getByTestId("owner-label").textContent()).includes("Owner view · sample data"), "dashboard labelled Owner view · sample data");

// 1. Discover via an overseas source link.
await page.goto(`${base}/?src=ldn-ghana-circle`);
await page.getByTestId("referral-banner").waitFor();
check(
  (await text("referral-banner")).includes("You were referred by London Ghanaian Diaspora Circle"),
  "Discover shows referral source",
);
const sw = await page.evaluate(() => document.documentElement.scrollWidth);
check(sw <= 390, `no horizontal scroll at 390px (scrollWidth=${sw})`);
check((await text("step-indicator")) === "Step 1 of 5", "Discover shows only 'Step 1 of 5'");
check((await page.getByTestId("journey-progress").count()) === 0, "no full stepper on Discover");
await checkHomeAboveFold("390x844 with ?src");
await shot("1-discover");

// Demo menu: View as switcher lives in it, closes on Esc and on outside click.
check((await page.getByTestId("view-staff").count()) === 0, "View as links hidden until Demo menu opens");
await page.getByTestId("demo-menu").click();
await page.getByTestId("view-staff").waitFor();
check((await page.getByTestId("demo-menu").getAttribute("aria-expanded")) === "true", "Demo menu opens (aria-expanded)");
await page.keyboard.press("Escape");
check((await page.getByTestId("view-staff").count()) === 0, "Demo menu closes on Esc");
check(await page.getByTestId("demo-menu").evaluate((el) => el === document.activeElement), "focus returns to Demo button");
await page.keyboard.press("Enter");
await page.getByTestId("view-traveller").waitFor();
check(await page.getByTestId("view-traveller").evaluate((el) => el === document.activeElement), "keyboard open focuses first menu item");
await page.mouse.click(5, 500);
check((await page.getByTestId("view-staff").count()) === 0, "Demo menu closes on outside click");

// 2. Venue.
await page.getByTestId("cta-venue").click();
await page.waitForURL("**/venue");
await page.getByTestId("journey-progress").waitFor({ timeout: 3000 });
check(true, "compact stepper shown on venue");
await page.getByTestId("story").first().waitFor();
check((await page.getByTestId("story").count()) === 2, "Venue shows only the 2 verified stories");
check((await page.locator(".tbc").count()) >= 6, "Venue shows 'To be confirmed' placeholders");
const offers = await text("venue-offers");
check(offers.includes("What De Klinic offers") && offers.includes("Local food and the pub experience"), "venue: What De Klinic offers block");
for (const label of ["Menu", "Prices", "Delivery coverage", "Group bookings", "Events"]) {
  check(offers.includes(label), `venue offers placeholder: ${label}`);
}
check((await page.getByTestId("venue-offers").locator(".tbc").count()) === 5, "venue offers: 5 'To be confirmed' placeholders");
const toConfirm = await text("story-to-confirm");
check(
  toConfirm.includes("A story worth confirming") &&
    toConfirm.includes("From the brief · to be confirmed with De Klinic") &&
    toConfirm.includes("Portia has publicly described serving meals bought by a supporter for five followers."),
  "venue: brief story card marked 'to be confirmed with De Klinic'",
);
await page.getByTestId("cta-interested").click();
check((await text("cta-interested")).includes("Interest noted"), "I'm interested registers");
await shot("2-venue");

// 3. Save trip.
await page.getByTestId("cta-save").click();
await page.waitForURL("**/trip");
await page.getByTestId("submit-trip").click();
check((await page.locator("[aria-invalid=true]").count()) >= 3, "empty form shows validation errors");
check((await page.locator("#e-guestType").count()) === 1, "guest type is required");
await page.getByTestId("demo-fill").click();
await page.getByTestId("guest-type").getByText("Friends", { exact: true }).click();
check(await page.locator("input[name=guestType][value=friends]").isChecked(), "Who's coming? choice selects Friends");
await shot("3-trip-form");
await page.getByTestId("submit-trip").click();
check((await text("submit-trip")).includes("Saving"), "saving state shown");
await page.getByTestId("arrival-code").waitFor();
const code = await text("arrival-code");
check(/^DK-[A-Z2-9]{4}$/.test(code), `arrival code generated: ${code}`);
check((await text("trip-status")).includes("Saved"), "trip status shows Saved");
check((await text("confirmation")).includes("Friends"), "confirmation shows guest type");
await shot("3-trip-saved");
await page.reload();
check((await text("arrival-code")) === code, "code survives reload");

// Refer is locked before the visit.
await page.goto(`${base}/refer`);
await page.getByTestId("refer-locked").waitFor();
check(true, "Refer locked before visit is confirmed");

const mid = await dashboardCounts();
check(mid.discovered === 22 && mid.saved === 10, `dashboard counts the new discovery + save (got ${JSON.stringify(mid)})`);
check(mid.decTrips === 7 && mid.decGuests === 25, "new December trip adds to expected arrivals (7 trips, 25 guests)");
check((await guestTypes()).friends === 5, "guest-type breakdown counts the new Friends trip");

// 4. Staff confirms.
await page.getByTestId("demo-menu").click();
await page.getByTestId("view-staff").click();
await page.waitForURL("**/staff");
await page.getByTestId("staff-code").fill("DK-ZZZZ");
await page.getByTestId("staff-lookup").click();
await page.getByTestId("staff-invalid").waitFor();
check(true, "staff: invalid code message");
await page.getByTestId("staff-code").fill("dk-k3mp");
await page.getByTestId("staff-lookup").click();
await page.getByTestId("staff-already").waitFor();
check(true, "staff: already-confirmed message (seeded visited code, lowercase input)");
await page.getByTestId("staff-code").fill(code);
await page.getByTestId("staff-lookup").click();
await page.getByTestId("staff-result").waitFor();
const result = await text("staff-result");
check(
  result.includes("Adwoa Asare") && result.includes("4 guests") && result.includes("London Ghanaian Diaspora Circle"),
  "staff sees name, group size and source",
);
check((await text("staff-guest-type")) === "Friends", "staff sees guest type (Friends) next to group size");
await shot("4-staff");
await page.getByTestId("staff-confirm").click();
await page.getByTestId("staff-confirmed").waitFor();
check((await text("staff-confirmed")).includes("De Klinic staff (demo)"), "staff: visit confirmed by De Klinic staff (demo)");
await page.getByTestId("staff-lookup").click();
await page.getByTestId("staff-already").waitFor();
check(true, "staff: second lookup shows already confirmed");

// 5. Traveller sees the visit, leaves a story.
await page.getByTestId("demo-menu").click();
await page.getByTestId("view-traveller").click();
await page.waitForURL("**/trip");
await page.getByTestId("visit-confirmed").waitFor();
check((await text("trip-status")).includes("Visited"), "traveller sees Visit confirmed");
await page.getByTestId("submit-story").click();
check((await page.locator("#story-error").count()) === 1, "empty story is rejected");
await page.fill("#story", "Showed our code and were seated with the whole family. Lovely evening.");
await page.getByTestId("submit-story").click();
await page.getByTestId("story-saved").waitFor();
await shot("5-trip-visited");
await page.goto(`${base}/venue`);
await page.getByTestId("story").first().waitFor();
check((await page.getByTestId("story").count()) === 3, "venue now shows 3 verified stories");
const firstStory = await page.getByTestId("story").first().innerText();
check(firstStory.includes("Verified visit") && firstStory.includes("Lovely evening"), "guest story shows with Verified visit badge");

// 6. Refer.
await page.goto(`${base}/refer`);
await page.getByTestId("create-referral").click();
const link = await page.getByTestId("share-link").inputValue();
check(/\?src=ref-trip-[a-z0-9]+$/.test(link), `share link created: ${link}`);
check((await text("share-preview")).includes("Adwoa visited De Klinic"), "share preview visible");
await page.getByTestId("copy-link").click();
await page.getByTestId("copy-link").filter({ hasText: "Copied" }).waitFor({ timeout: 3000 });
check(true, "copy-to-clipboard button confirms");
check((await page.evaluate(() => navigator.clipboard.readText())) === link, "clipboard holds the link");
await shot("6-refer");

// 7. Open the referral link as a new guest.
await page.goto(link);
await page.getByTestId("referral-banner").waitFor();
check(
  (await text("referral-banner")).includes("You were referred by Adwoa Asare (sample)"),
  "referral link shows 'You were referred by <name>'",
);

// 8. Dashboard reflects everything.
const after = await dashboardCounts();
check(
  after.discovered === 23 && after.saved === 10 && after.visited === 4 && after.referred === 2,
  `dashboard funnel updated to 23/10/4/2 (got ${JSON.stringify(after)})`,
);
const opt = await page.locator("[data-testid=timeline-picker] option", { hasText: code }).getAttribute("value");
await page.getByTestId("timeline-picker").selectOption(opt);
for (const t of ["discovered", "saved", "visit_confirmed", "referred"]) {
  check((await page.getByTestId(`timeline-${t}`).count()) >= 1, `timeline has ${t}`);
}
check((await page.getByTestId("timeline").innerText()).includes("Their link brought in a new guest"), "timeline shows the referred guest");
const sw2 = await page.evaluate(() => document.documentElement.scrollWidth);
check(sw2 <= 390, `dashboard has no horizontal scroll at 390px (scrollWidth=${sw2})`);
await shot("7-dashboard");

// 9. New discovery source types work as ?src= links and appear as sample links.
await page.goto(`${base}/`);
await page.getByTestId("no-source").or(page.getByTestId("referral-banner")).first().waitFor();
await checkHomeAboveFold("390x844 without ?src");
const sampleLinks = await page.locator("a[href^='/?src=']").evaluateAll((as) => as.map((a) => a.getAttribute("href")));
for (const src of NEW_SOURCES) {
  check(sampleLinks.includes(`/?src=${src.id}`), `Visiting page lists sample link for ${src.id}`);
}
for (const src of NEW_SOURCES) {
  await page.goto(`${base}/?src=${src.id}`);
  await page.getByTestId("referral-banner").waitFor();
  const banner = await text("referral-banner");
  check(
    banner.includes(`You were referred by ${src.label}`) && banner.toLowerCase().includes(src.type.toLowerCase()),
    `?src=${src.id} shows "You were referred by ${src.label}" (${src.type})`,
  );
  if (src.id === "ghana-travel-search") await shot("8-discover-search");
}
await page.goto(`${base}/dashboard`);
await page.getByTestId("sources-table").waitFor();
for (const src of NEW_SOURCES) {
  const r = await rowCounts(src.id);
  check(r.disc === src.disc + 1, `Sources table counts the new ${src.id} discovery (${r.disc})`);
}

// Laptop: homepage above the fold at 1366x768, with and without ?src.
await page.setViewportSize({ width: 1366, height: 768 });
await page.goto(`${base}/?src=accra-host`);
await page.getByTestId("referral-banner").waitFor();
await checkHomeAboveFold("1366x768 with ?src");
await shot("d-home-src");
await page.goto(`${base}/`);
await page.getByTestId("cta-venue").waitFor();
await checkHomeAboveFold("1366x768 without ?src");
const swd = await page.evaluate(() => document.documentElement.scrollWidth);
check(swd <= 1366, `no horizontal scroll at 1366px (scrollWidth=${swd})`);

// Reduced motion: floating layer, parallax and tilt are switched off.
await page.emulateMedia({ reducedMotion: "reduce" });
const still = await page.evaluate(() => {
  const deco = getComputedStyle(document.querySelector(".hero-deco")).animationName;
  const blob = getComputedStyle(document.querySelector(".hero-deco span")).animationName;
  return deco === "none" && blob === "none";
});
check(still, "prefers-reduced-motion disables hero animations");
await page.emulateMedia({ reducedMotion: "no-preference" });

// Desktop screenshots.
for (const [name, path] of [["d-discover", "/?src=dec-accra-itinerary"], ["d-venue", "/venue"], ["d-trip", "/trip"], ["d-dashboard", "/dashboard"], ["d-staff", "/staff"], ["d-refer", "/refer"]]) {
  await page.goto(base + path);
  await shot(name);
}

// 10. Reset.
await page.goto(`${base}/staff`);
await page.getByRole("button", { name: "Reset demo data" }).click();
await page.waitForURL(base + "/");
const reset = await dashboardCounts();
check(reset.saved === 9 && reset.visited === 3 && reset.referred === 1, "reset restores seed trips");

check(errors.length === 0, `no console errors ${errors.join(" | ")}`);
await browser.close();
