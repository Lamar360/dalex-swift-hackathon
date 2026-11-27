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
  before.discovered === 14 && before.saved === 6 && before.visited === 2 && before.referred === 1,
  `seed funnel 14/6/2/1 (got ${JSON.stringify(before)})`,
);
check(before.decTrips === 4 && before.decGuests === 15, "seed December arrivals: 4 trips, 15 guests");
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
await shot("1-discover");

// 2. Venue.
await page.getByTestId("cta-venue").click();
await page.waitForURL("**/venue");
await page.getByTestId("story").first().waitFor();
check((await page.getByTestId("story").count()) === 2, "Venue shows only the 2 verified stories");
check((await page.locator(".tbc").count()) >= 5, "Venue shows 'To be confirmed' placeholders");
await page.getByTestId("cta-interested").click();
check((await text("cta-interested")).includes("Interest noted"), "I'm interested registers");
await shot("2-venue");

// 3. Save trip.
await page.getByTestId("cta-save").click();
await page.waitForURL("**/trip");
await page.getByTestId("submit-trip").click();
check((await page.locator("[aria-invalid=true]").count()) >= 3, "empty form shows validation errors");
await page.getByTestId("demo-fill").click();
await page.getByTestId("submit-trip").click();
check((await text("submit-trip")).includes("Saving"), "saving state shown");
await page.getByTestId("arrival-code").waitFor();
const code = await text("arrival-code");
check(/^DK-[A-Z2-9]{4}$/.test(code), `arrival code generated: ${code}`);
check((await text("trip-status")).includes("Saved"), "trip status shows Saved");
await shot("3-trip-saved");
await page.reload();
check((await text("arrival-code")) === code, "code survives reload");

// Refer is locked before the visit.
await page.goto(`${base}/refer`);
await page.getByTestId("refer-locked").waitFor();
check(true, "Refer locked before visit is confirmed");

const mid = await dashboardCounts();
check(mid.discovered === 15 && mid.saved === 7, "dashboard counts the new discovery + save");
check(mid.decTrips === 5 && mid.decGuests === 19, "new December trip adds to expected arrivals (5 trips, 19 guests)");

// 4. Staff confirms.
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
await shot("4-staff");
await page.getByTestId("staff-confirm").click();
await page.getByTestId("staff-confirmed").waitFor();
check((await text("staff-confirmed")).includes("De Klinic staff (demo)"), "staff: visit confirmed by De Klinic staff (demo)");
await page.getByTestId("staff-lookup").click();
await page.getByTestId("staff-already").waitFor();
check(true, "staff: second lookup shows already confirmed");

// 5. Traveller sees the visit, leaves a story.
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
  after.discovered === 16 && after.saved === 7 && after.visited === 3 && after.referred === 2,
  `dashboard funnel updated to 16/7/3/2 (got ${JSON.stringify(after)})`,
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

// Desktop screenshots.
await page.setViewportSize({ width: 1280, height: 900 });
for (const [name, path] of [["d-dashboard", "/dashboard"], ["d-staff", "/staff"], ["d-refer", "/refer"]]) {
  await page.goto(base + path);
  await shot(name);
}

// 9. Reset.
await page.goto(`${base}/staff`);
await page.getByRole("button", { name: "Reset demo data" }).click();
await page.waitForURL(base + "/");
const reset = await dashboardCounts();
check(reset.saved === 6 && reset.visited === 2 && reset.referred === 1, "reset restores seed trips");

check(errors.length === 0, `no console errors ${errors.join(" | ")}`);
await browser.close();
