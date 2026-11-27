// End-to-end check of Screens 1-3 at 390px. Usage: npm run dev -- --port 5179, then npm run e2e [screenshotDir]
import { chromium } from "playwright";
const out = process.argv[2] ?? "test-results";
import { mkdirSync } from "node:fs";
mkdirSync(out, { recursive: true });
const base = process.env.BASE_URL ?? "http://localhost:5179";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
const check = (cond, msg) => { console.log((cond ? "PASS " : "FAIL ") + msg); if (!cond) process.exitCode = 1; };

await page.goto(`${base}/?src=ldn-ghana-circle`);
const banner = page.getByTestId("referral-banner");
await banner.waitFor();
check((await banner.innerText()).includes("You were referred by London Ghanaian Diaspora Circle"), "Discover shows referral source");
const sw = await page.evaluate(() => document.documentElement.scrollWidth);
check(sw <= 390, `no horizontal scroll at 390px (scrollWidth=${sw})`);
await page.waitForTimeout(600);
await page.screenshot({ path: `${out}/1-discover.png`, fullPage: true });
const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("deklinic.journey.v1")).session.sourceId);
check(stored === "ldn-ghana-circle", "source persisted to localStorage");

await page.getByTestId("cta-venue").click();
await page.waitForURL("**/venue");
await page.getByTestId("story").first().waitFor();
check((await page.getByTestId("story").count()) === 2, "Venue shows only the 2 verified stories");
check((await page.locator(".tbc").count()) >= 5, "Venue shows 'To be confirmed' placeholders");
await page.getByTestId("cta-interested").click();
check((await page.getByTestId("cta-interested").innerText()).includes("Interest noted"), "I'm interested registers");
await page.waitForTimeout(600);
await page.screenshot({ path: `${out}/2-venue.png`, fullPage: true });

await page.getByTestId("cta-save").click();
await page.waitForURL("**/trip");
await page.getByTestId("submit-trip").click();
check((await page.locator("[aria-invalid=true]").count()) >= 3, "empty form shows validation errors");
await page.getByTestId("demo-fill").click();
await page.getByTestId("submit-trip").click();
check((await page.getByTestId("submit-trip").innerText()).includes("Saving"), "saving state shown");
const code = page.getByTestId("arrival-code");
await code.waitFor();
const codeText = await code.innerText();
check(/^DK-[A-Z2-9]{4}$/.test(codeText), `arrival code generated: ${codeText}`);
await page.waitForTimeout(600);
await page.screenshot({ path: `${out}/3-confirmation.png`, fullPage: true });
const trip = await page.evaluate(() => { const s = JSON.parse(localStorage.getItem("deklinic.journey.v1")); return s.trips.find((t) => t.id === s.session.tripId); });
check(trip?.sourceId === "ldn-ghana-circle" && trip.status === "saved" && trip.arrivalCode === codeText, "trip saved with sourceId, status and code");

await page.reload();
check((await page.getByTestId("arrival-code").innerText()) === codeText, "code survives reload");

await page.goto(`${base}/?src=bogus`);
await page.getByTestId("unknown-source").waitFor();
check(true, "unknown src shows fallback");

page.once("dialog", (d) => d.accept());
await page.getByRole("button", { name: "Reset demo data" }).click();
await page.waitForURL(base + "/");
await page.getByTestId("no-source").waitFor();
const trips = await page.evaluate(() => JSON.parse(localStorage.getItem("deklinic.journey.v1")).trips.length);
check(trips === 1, "reset restores seed (1 demo trip)");

await page.setViewportSize({ width: 1280, height: 900 });
await page.goto(`${base}/venue`);
await page.waitForTimeout(600);
await page.screenshot({ path: `${out}/4-venue-desktop.png`, fullPage: true });

check(errors.length === 0, `no console errors ${errors.join(" | ")}`);
await browser.close();
