// ── Subscribe-flow repair: the live proof, state by state ───────────────────
// Drives the real capture bed on production through the whole double-opt-in
// loop and shoots every state into design-review/22-subscribe-repair/.
//
// Two phases, because the middle of the loop runs through an inbox: phase one
// subscribes and catches the pending button mid-flight; phase two takes the
// subscriber uuid the opt-in email carries and walks confirm → unsubscribe.
//
//   CHROME_PATH=… node scripts/subscribe-repair-shots.mjs subscribe <email>
//   CHROME_PATH=… node scripts/subscribe-repair-shots.mjs confirm <subUuid>
//   CHROME_PATH=… node scripts/subscribe-repair-shots.mjs error
//
// Run from the repo root (playwright resolution). The pending shot is timed,
// not waited on: the whole point is that the button changes inside the ~2s
// the POST spends on listmonk's SMTP round trip.
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";

const OUT = "design-review/22-subscribe-repair";
const ORIGIN = process.env.ORIGIN ?? "https://terralore.co";
const LIST = "70011fd6-48ff-40cc-bb1d-ee3164f1c76f";

const [phase, arg] = process.argv.slice(2);
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH });
const page = await browser.newPage({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 2,
});
page.on("pageerror", (e) => console.log("PAGEERROR:", e.message));

const shot = async (name, opts = {}) => {
  await page.screenshot({ path: `${OUT}/${name}.png`, ...opts });
  console.log(`  ▸ ${name}.png`);
};

if (phase === "subscribe") {
  console.log(`subscribing ${arg}`);
  await page.goto(`${ORIGIN}/ledger`, { waitUntil: "networkidle", timeout: 60000 });
  const form = page.locator("form[data-capture]").first();
  await form.scrollIntoViewIfNeeded();
  await page.waitForTimeout(600);
  await shot("01-form-idle", { clip: await form.boundingBox().then((b) => ({
    x: b.x - 24, y: b.y - 190, width: Math.min(b.width + 48, 1440), height: b.height + 260,
  })) });

  await form.locator('input[type="email"]').fill(arg);
  await page.waitForTimeout(200);

  // Click without awaiting navigation, then shoot the button while it waits.
  // The window is short — the POST returns in ~1s warm — so shoot early and
  // time the leg by the response itself rather than by a navigation predicate.
  const box = await form.boundingBox();
  const clip = { x: box.x - 12, y: box.y - 24, width: Math.min(box.width + 24, 1440), height: box.height + 48 };
  const posted = page.waitForResponse(
    (r) => r.url().includes("/subscription/form") && r.request().method() === "POST",
    { timeout: 60000 },
  );
  // ── does the guard swallow the second click? ─────────────────────────────
  // Asserted with the POST aborted, so two clicks can be counted without two
  // subscriptions. Nothing here is photographed; the picture comes after,
  // from a real submit.
  let postAttempts = 0;
  await page.route("**/subscription/form", async (route) => {
    if (route.request().method() !== "POST") return route.continue();
    postAttempts += 1;
    await route.abort();
  });

  await form.locator('button[type="submit"]').click({ noWaitAfter: true });
  await page.waitForTimeout(300);
  // Read the DOM directly: a locator here auto-waits 30s once the form
  // detaches at navigation, which measures playwright, not the page.
  const probe = async (fn, fallback) => {
    try {
      return await page.evaluate(fn);
    } catch {
      return fallback;
    }
  };
  // A second click while the first is outstanding — the double-click — then
  // read what the button says. Both are plain DOM, so a navigation that beats
  // us reports itself instead of hanging.
  const second = await probe(() => {
    const b = document.querySelector("form[data-capture] button[type=submit]");
    if (!b) return null;
    b.click();
    return { label: b.textContent.trim(), disabled: b.disabled, sent: b.form.dataset.sent };
  }, null);
  console.log(
    `  button mid-flight: ${second ? `"${second.label}" disabled=${second.disabled} form.sent=${second.sent}` : "(already navigated)"}`,
  );
  console.log(`  POSTs attempted after two clicks: ${postAttempts} (the guard swallows the second)`);

  // ── the real submit: photographed mid-flight, timed, unmediated ──────────
  // page.screenshot() waits out the in-flight navigation and so can only ever
  // shoot the page that lands. CDP's captureScreenshot takes the frame that is
  // on screen right now, which is how the pending state gets photographed
  // while the POST it is waiting on is genuinely outstanding.
  await page.unroute("**/subscription/form");
  await page.goto(`${ORIGIN}/ledger`, { waitUntil: "domcontentloaded", timeout: 60000 });
  const form2 = page.locator("form[data-capture]").first();
  await form2.scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  await form2.locator('input[type="email"]').fill(arg);
  const box2 = await form2.boundingBox();
  const cdp = await page.context().newCDPSession(page);

  const t0 = Date.now();
  await form2.locator('button[type="submit"]').click({ noWaitAfter: true });
  await page.waitForTimeout(600);
  const frame = await cdp.send("Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: false,
    clip: { x: box2.x - 12, y: box2.y - 24, width: Math.min(box2.width + 24, 1440), height: box2.height + 48, scale: 2 },
  });
  writeFileSync(`${OUT}/02-form-sending.png`, Buffer.from(frame.data, "base64"));
  console.log(`  ▸ 02-form-sending.png (captured ${((Date.now() - t0) / 1000).toFixed(2)}s into the POST)`);

  const res = await posted;
  console.log(`  POST → ${res.status()} in ${((Date.now() - t0) / 1000).toFixed(2)}s (unmediated)`);
  await page.waitForLoadState("networkidle").catch(() => {});
  await shot("03-confirmation", { fullPage: true });
} else if (phase === "confirm") {
  console.log(`confirming subscriber ${arg}`);
  await page.goto(`${ORIGIN}/subscription/optin/${arg}?l=${LIST}`, { waitUntil: "networkidle" });
  await shot("04-optin", { fullPage: true });

  await page.locator('button[type="submit"], input[type="submit"]').first().click();
  await page.waitForLoadState("networkidle");
  await shot("05-confirmed", { fullPage: true });

  // Leaving, by the link the opt-in email actually carries: the manage page.
  // Outside a send the campaign uuid is zeroes, and listmonk's plain
  // Unsubscribe button is scoped to the lists a *campaign* targeted — with no
  // campaign it renders success and updates nothing. The preferences form on
  // ?manage=true is not campaign-scoped and does commit, which is why the
  // letter links here. (A sent letter's own unsubscribe link carries its
  // campaign uuid, targets The Ledger, and works — verified separately.)
  await page.goto(`${ORIGIN}/subscription/00000000-0000-0000-0000-000000000000/${arg}?manage=true`, {
    waitUntil: "networkidle",
  });
  await shot("06-manage", { fullPage: true });

  await page.locator('input[name="l"]').first().uncheck();
  await page.locator("form.manage-form button, form.manage-form input[type=submit]").first().click();
  await page.waitForLoadState("networkidle");
  await shot("07-left", { fullPage: true });
} else if (phase === "error") {
  // A genuine failure, not a simulated one: an opt-in link that is not a uuid.
  await page.goto(`${ORIGIN}/subscription/optin/not-a-uuid`, { waitUntil: "networkidle" });
  await shot("08-error", { fullPage: true });
}

await browser.close();
console.log("done");
